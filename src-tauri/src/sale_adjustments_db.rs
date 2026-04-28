use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

static DB_POOL: OnceCell<PgPool> = OnceCell::new();

async fn get_pool() -> Result<PgPool, String> {
  if let Some(pool) = DB_POOL.get() {
    return Ok(pool.clone());
  }
  let _ = dotenvy::from_filename("../.env");
  let _ = dotenvy::dotenv();
  let url = std::env::var("DATABASE_URL").map_err(|_| "DATABASE_URL is not set".to_string())?;
  let pool = crate::postgres_pool::connect_pool(&url)
    .await
    .map_err(|e| format!("connect postgres failed: {e}"))?;
  let _ = DB_POOL.set(pool.clone());
  Ok(pool)
}

// ─── Void ─────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn sale_void(sale_id: String, reason: Option<String>) -> Result<(), String> {
  let pool = get_pool().await?;
  let mut tx = pool.begin().await.map_err(|e| format!("begin tx: {e}"))?;

  // Fetch sale header — also validates existence and non-voided status
  let sale_row = sqlx::query_as::<_, (String, f64, Option<String>, Option<String>)>(
    r#"SELECT "paymentType"::text, "grandTotal", "memberId", "branchId"
       FROM "Sale" WHERE id = $1 AND "voidedAt" IS NULL LIMIT 1"#,
  )
  .bind(&sale_id)
  .fetch_optional(&mut *tx)
  .await
  .map_err(|e| format!("fetch sale: {e}"))?
  .ok_or_else(|| "ไม่พบบิล หรือบิลนี้ถูกยกเลิกไปแล้ว".to_string())?;

  let (payment_type, grand_total, member_id, branch_id) = sale_row;

  // Fetch sale lines for stock reversal
  let lines = sqlx::query_as::<_, (String, f64)>(
    r#"SELECT "productId", qty FROM "SaleLine" WHERE "saleId" = $1"#,
  )
  .bind(&sale_id)
  .fetch_all(&mut *tx)
  .await
  .map_err(|e| format!("fetch sale lines: {e}"))?;

  // Void the sale
  let affected = sqlx::query(
    r#"UPDATE "Sale"
       SET "voidedAt"   = now() AT TIME ZONE 'Asia/Bangkok',
           "voidReason" = NULLIF($2, ''),
           "updatedAt"  = now() AT TIME ZONE 'Asia/Bangkok'
       WHERE id = $1 AND "voidedAt" IS NULL"#,
  )
  .bind(&sale_id)
  .bind(reason.unwrap_or_default())
  .execute(&mut *tx)
  .await
  .map_err(|e| format!("sale_void UPDATE failed: {e}"))?
  .rows_affected();

  if affected == 0 {
    return Err("ไม่พบบิล หรือบิลนี้ถูกยกเลิกไปแล้ว".into());
  }

  // Stock movements: return stock for every line
  for (product_id, qty) in &lines {
    sqlx::query(
      r#"INSERT INTO "StockMovement"
           (id, "movementAt", type, "qtyDelta", "refType", "refId", "branchId", "productId", "createdAt")
         VALUES
           (gen_random_uuid()::text, now() AT TIME ZONE 'Asia/Bangkok',
            'return_in'::"StockMovementType", $1, 'sale_void', $2, NULLIF($3,''), $4,
            now() AT TIME ZONE 'Asia/Bangkok')"#,
    )
    .bind(qty)
    .bind(&sale_id)
    .bind(branch_id.clone().unwrap_or_default())
    .bind(product_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("stock movement (void) failed: {e}"))?;
  }

  // AR balance: reverse the charge if it was an account sale
  if payment_type == "account" {
    if let Some(ref mid) = member_id {
      sqlx::query(
        r#"UPDATE "Member" SET "arBalance" = "arBalance" - $1, "updatedAt" = now() AT TIME ZONE 'Asia/Bangkok' WHERE id = $2"#,
      )
      .bind(grand_total)
      .bind(mid)
      .execute(&mut *tx)
      .await
      .map_err(|e| format!("ar balance reverse failed: {e}"))?;
    }
  }

  tx.commit().await.map_err(|e| format!("commit: {e}"))?;
  Ok(())
}

// ─── Return ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleReturnLinePayload {
  pub original_sale_line_id: Option<String>,
  pub product_id: String,
  pub product_name: String,
  pub qty: f64,
  pub unit_price: f64,
  pub line_total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleReturnPayload {
  pub original_sale_id: String,
  pub reason: Option<String>,
  pub refund_method: String,
  pub lines: Vec<SaleReturnLinePayload>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleReturnResult {
  pub return_id: String,
  pub return_no: String,
  pub total_refund: f64,
  pub credit_note_no: Option<String>,
}

#[tauri::command]
pub async fn sale_return_create(payload: SaleReturnPayload) -> Result<SaleReturnResult, String> {
  if payload.lines.is_empty() {
    return Err("ต้องเลือกสินค้าอย่างน้อย 1 รายการ".into());
  }

  let pool = get_pool().await?;
  let mut tx = pool.begin().await.map_err(|e| format!("begin tx: {e}"))?;

  // Fetch original sale — mode, VAT figures, member, branch
  let sale_info = sqlx::query_as::<_, (bool, String, f64, f64, f64, Option<String>, Option<String>)>(
    r#"SELECT
         "voidedAt" IS NOT NULL,
         mode::text,
         "beforeVat",
         "vatAmount",
         "grandTotal",
         "memberId",
         "branchId"
       FROM "Sale" WHERE id = $1 LIMIT 1"#,
  )
  .bind(&payload.original_sale_id)
  .fetch_optional(&mut *tx)
  .await
  .map_err(|e| format!("check sale: {e}"))?
  .ok_or_else(|| "ไม่พบบิลต้นฉบับ".to_string())?;

  let (is_voided, sale_mode, before_vat, vat_amount, grand_total, member_id, branch_id) = sale_info;

  if is_voided {
    return Err("บิลนี้ถูกยกเลิกแล้ว ไม่สามารถคืนสินค้าได้".into());
  }

  let total_refund: f64 = payload.lines.iter().map(|l| l.line_total).sum();

  // Generate return number: RTN + YYMM + 4-digit seq
  let return_no: String = sqlx::query_scalar::<_, String>(
    r#"SELECT 'RTN' ||
              to_char(now() AT TIME ZONE 'Asia/Bangkok', 'YYMM') ||
              lpad((COUNT(*) + 1)::text, 4, '0')
       FROM "SaleReturn"
       WHERE "returnNo" LIKE 'RTN' || to_char(now() AT TIME ZONE 'Asia/Bangkok', 'YYMM') || '%'"#,
  )
  .fetch_one(&mut *tx)
  .await
  .map_err(|e| format!("gen return_no: {e}"))?;

  let return_id = format!("rtn-{}", uuid_v4());

  sqlx::query(
    r#"INSERT INTO "SaleReturn"
         (id, "returnNo", "originalSaleId", "returnDate", reason, "refundMethod", "totalRefund", "createdAt")
       VALUES
         ($1, $2, $3, now() AT TIME ZONE 'Asia/Bangkok', NULLIF($4,''), $5, $6, now() AT TIME ZONE 'Asia/Bangkok')"#,
  )
  .bind(&return_id)
  .bind(&return_no)
  .bind(&payload.original_sale_id)
  .bind(payload.reason.clone().unwrap_or_default())
  .bind(&payload.refund_method)
  .bind(total_refund)
  .execute(&mut *tx)
  .await
  .map_err(|e| format!("insert SaleReturn: {e}"))?;

  for line in &payload.lines {
    let line_id = format!("rtl-{}", uuid_v4());
    sqlx::query(
      r#"INSERT INTO "SaleReturnLine"
           (id, "returnId", "productId", "originalSaleLineId", "productName", qty, "unitPrice", "lineTotal")
         VALUES
           ($1, $2, $3, NULLIF($4,''), $5, $6, $7, $8)"#,
    )
    .bind(&line_id)
    .bind(&return_id)
    .bind(&line.product_id)
    .bind(line.original_sale_line_id.clone().unwrap_or_default())
    .bind(&line.product_name)
    .bind(line.qty)
    .bind(line.unit_price)
    .bind(line.line_total)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("insert SaleReturnLine: {e}"))?;

    // Stock movement: return_in
    sqlx::query(
      r#"INSERT INTO "StockMovement"
           (id, "movementAt", type, "qtyDelta", "refType", "refId", "branchId", "productId", "createdAt")
         VALUES
           (gen_random_uuid()::text, now() AT TIME ZONE 'Asia/Bangkok',
            'return_in'::"StockMovementType", $1, 'sale_return', $2, NULLIF($3,''), $4,
            now() AT TIME ZONE 'Asia/Bangkok')"#,
    )
    .bind(line.qty)
    .bind(&return_id)
    .bind(branch_id.clone().unwrap_or_default())
    .bind(&line.product_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("stock movement return_in failed: {e}"))?;
  }

  // AR balance: deduct from member's outstanding balance
  if payload.refund_method == "deduct_ar" {
    if let Some(ref mid) = member_id {
      sqlx::query(
        r#"UPDATE "Member" SET "arBalance" = "arBalance" - $1, "updatedAt" = now() AT TIME ZONE 'Asia/Bangkok' WHERE id = $2"#,
      )
      .bind(total_refund)
      .bind(mid)
      .execute(&mut *tx)
      .await
      .map_err(|e| format!("ar balance deduct failed: {e}"))?;
    }
  }

  // Credit note: auto-create for TAX-mode bills
  let credit_note_no = if sale_mode == "tax" {
    let cn_no: String = sqlx::query_scalar::<_, String>(
      r#"SELECT 'CN' ||
                to_char(now() AT TIME ZONE 'Asia/Bangkok', 'YYMM') ||
                lpad((COUNT(*) + 1)::text, 4, '0')
         FROM "CreditNote"
         WHERE "creditNoteNo" LIKE 'CN' || to_char(now() AT TIME ZONE 'Asia/Bangkok', 'YYMM') || '%'"#,
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| format!("gen credit_note_no: {e}"))?;

    let (cn_before_vat, cn_vat) = if grand_total > 0.0 {
      (
        (total_refund * before_vat / grand_total * 100.0).round() / 100.0,
        (total_refund * vat_amount / grand_total * 100.0).round() / 100.0,
      )
    } else {
      (total_refund, 0.0)
    };

    sqlx::query(
      r#"INSERT INTO "CreditNote"
           (id, "creditNoteNo", "originalSaleId", "returnId", "creditNoteDate", "beforeVat", "vatAmount", "totalAmount", "createdAt")
         VALUES
           (gen_random_uuid()::text, $1, $2, $3, now() AT TIME ZONE 'Asia/Bangkok', $4, $5, $6,
            now() AT TIME ZONE 'Asia/Bangkok')"#,
    )
    .bind(&cn_no)
    .bind(&payload.original_sale_id)
    .bind(&return_id)
    .bind(cn_before_vat)
    .bind(cn_vat)
    .bind(total_refund)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("insert CreditNote: {e}"))?;

    Some(cn_no)
  } else {
    None
  };

  tx.commit().await.map_err(|e| format!("commit: {e}"))?;

  Ok(SaleReturnResult { return_id, return_no, total_refund, credit_note_no })
}

fn uuid_v4() -> String {
  use std::time::{SystemTime, UNIX_EPOCH};
  let t = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default();
  format!("{:x}-{:x}", t.as_nanos(), t.subsec_nanos() ^ (t.as_secs() as u32))
}
