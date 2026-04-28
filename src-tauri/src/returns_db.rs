use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};

static DB_POOL: OnceCell<PgPool> = OnceCell::new();

async fn get_pool() -> Result<PgPool, String> {
  if let Some(pool) = DB_POOL.get() { return Ok(pool.clone()); }
  let _ = dotenvy::from_filename("../.env");
  let _ = dotenvy::dotenv();
  let url = std::env::var("DATABASE_URL").map_err(|_| "DATABASE_URL is not set".to_string())?;
  let pool = crate::postgres_pool::connect_pool(&url).await
    .map_err(|e| format!("connect postgres failed: {e}"))?;
  let _ = DB_POOL.set(pool.clone());
  Ok(pool)
}

// ─── Types ────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReturnListRow {
  pub id: String,
  pub return_no: String,
  pub original_sale_id: String,
  pub original_bill_no: String,
  pub return_date: String,
  pub reason: Option<String>,
  pub refund_method: String,
  pub total_refund: f64,
  pub member_name: Option<String>,
  pub credit_note_no: Option<String>,
  pub line_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ClaimRow {
  pub id: String,
  pub claim_no: String,
  pub return_id: Option<String>,
  pub return_no: Option<String>,
  pub product_name: String,
  pub serial_no: Option<String>,
  pub issue: String,
  pub status: String,
  pub vendor_name: Option<String>,
  pub resolution: Option<String>,
  pub resolved_at: Option<String>,
  pub created_at: String,
}

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn return_list(date_from: String, date_to: String) -> Result<Vec<ReturnListRow>, String> {
  let pool = get_pool().await?;
  sqlx::query_as::<_, ReturnListRow>(
    r#"
    SELECT
      r.id,
      r."returnNo"        AS return_no,
      r."originalSaleId"  AS original_sale_id,
      s."billNo"          AS original_bill_no,
      to_char(r."returnDate" AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD"T"HH24:MI:SS') AS return_date,
      r.reason,
      r."refundMethod"    AS refund_method,
      r."totalRefund"     AS total_refund,
      m."fullName"        AS member_name,
      cn."creditNoteNo"   AS credit_note_no,
      COUNT(rl.id)::bigint AS line_count
    FROM "SaleReturn" r
    JOIN "Sale" s ON s.id = r."originalSaleId"
    LEFT JOIN "Member" m ON m.id = s."memberId"
    LEFT JOIN "CreditNote" cn ON cn."returnId" = r.id
    LEFT JOIN "SaleReturnLine" rl ON rl."returnId" = r.id
    WHERE (r."returnDate" AT TIME ZONE 'Asia/Bangkok')::date
          BETWEEN $1::date AND $2::date
    GROUP BY r.id, s."billNo", m.name, cn."creditNoteNo"
    ORDER BY r."returnDate" DESC
    LIMIT 200
    "#,
  )
  .bind(&date_from)
  .bind(&date_to)
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("return_list: {e}"))
}

#[tauri::command]
pub async fn claim_list(status: Option<String>) -> Result<Vec<ClaimRow>, String> {
  let pool = get_pool().await?;
  sqlx::query_as::<_, ClaimRow>(
    r#"
    SELECT
      c.id,
      c."claimNo"    AS claim_no,
      c."returnId"   AS return_id,
      r."returnNo"   AS return_no,
      c."productName" AS product_name,
      c."serialNo"   AS serial_no,
      c.issue,
      c.status,
      c."vendorName" AS vendor_name,
      c.resolution,
      to_char(c."resolvedAt" AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD"T"HH24:MI:SS') AS resolved_at,
      to_char(c."createdAt"  AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at
    FROM "Claim" c
    LEFT JOIN "SaleReturn" r ON r.id = c."returnId"
    WHERE ($1::text IS NULL OR c.status = $1)
    ORDER BY c."createdAt" DESC
    LIMIT 200
    "#,
  )
  .bind(status)
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("claim_list: {e}"))
}

#[tauri::command]
pub async fn claim_create(
  return_id: Option<String>,
  product_name: String,
  serial_no: Option<String>,
  issue: String,
  vendor_name: Option<String>,
) -> Result<String, String> {
  let pool = get_pool().await?;
  let claim_no: String = sqlx::query_scalar::<_, String>(
    r#"SELECT 'CLM' ||
              to_char(now() AT TIME ZONE 'Asia/Bangkok', 'YYMM') ||
              lpad((COUNT(*) + 1)::text, 4, '0')
       FROM "Claim"
       WHERE "claimNo" LIKE 'CLM' || to_char(now() AT TIME ZONE 'Asia/Bangkok', 'YYMM') || '%'"#,
  )
  .fetch_one(&pool)
  .await
  .map_err(|e| format!("gen claim_no: {e}"))?;

  let id: String = sqlx::query_scalar::<_, String>(
    r#"INSERT INTO "Claim"
         (id, "claimNo", "returnId", "productName", "serialNo", issue, status, "vendorName", "createdAt", "updatedAt")
       VALUES
         (gen_random_uuid()::text, $1, NULLIF($2,''), $3, NULLIF($4,''), $5, 'pending', NULLIF($6,''), now(), now())
       RETURNING id"#,
  )
  .bind(&claim_no)
  .bind(return_id.unwrap_or_default())
  .bind(&product_name)
  .bind(serial_no.unwrap_or_default())
  .bind(&issue)
  .bind(vendor_name.unwrap_or_default())
  .fetch_one(&pool)
  .await
  .map_err(|e| format!("claim_create: {e}"))?;
  Ok(id)
}

#[tauri::command]
pub async fn claim_update(
  id: String,
  status: String,
  resolution: Option<String>,
  vendor_name: Option<String>,
) -> Result<(), String> {
  let pool = get_pool().await?;
  sqlx::query(
    r#"UPDATE "Claim"
       SET status     = $2,
           resolution = NULLIF($3, ''),
           "vendorName" = NULLIF($4, ''),
           "resolvedAt" = CASE WHEN $2 IN ('resolved', 'rejected') AND "resolvedAt" IS NULL
                               THEN now() ELSE "resolvedAt" END,
           "updatedAt" = now()
       WHERE id = $1"#,
  )
  .bind(&id)
  .bind(&status)
  .bind(resolution.unwrap_or_default())
  .bind(vendor_name.unwrap_or_default())
  .execute(&pool)
  .await
  .map_err(|e| format!("claim_update: {e}"))?;
  Ok(())
}

#[tauri::command]
pub async fn claim_delete(id: String) -> Result<(), String> {
  let pool = get_pool().await?;
  sqlx::query(r#"DELETE FROM "Claim" WHERE id = $1"#)
    .bind(&id)
    .execute(&pool)
    .await
    .map_err(|e| format!("claim_delete: {e}"))?;
  Ok(())
}
