use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, FromRow, PgPool};

static DB_POOL: OnceCell<PgPool> = OnceCell::new();

async fn get_pool() -> Result<PgPool, String> {
  if let Some(pool) = DB_POOL.get() {
    return Ok(pool.clone());
  }
  let _ = dotenvy::from_filename("../.env");
  let _ = dotenvy::dotenv();
  let url = std::env::var("DATABASE_URL").map_err(|_| "DATABASE_URL is not set".to_string())?;
  let pool = PgPoolOptions::new()
    .max_connections(5)
    .connect(&url)
    .await
    .map_err(|e| format!("connect postgres failed: {e}"))?;
  let _ = DB_POOL.set(pool.clone());
  Ok(pool)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleLinePayload {
  pub id: String,
  pub product_code: String,
  pub product_name: String,
  pub qty: f64,
  pub unit_label: String,
  pub unit_index: i32,
  pub unit_price: f64,
  pub discount: f64,
  pub line_total: f64,
  pub price_level_label: Option<String>,
  pub price_level_index: Option<i32>,
  pub price_tag_label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleCreatePayload {
  pub id: String,
  pub bill_no: String,
  pub tax_invoice_no: Option<String>,
  pub mode: String,
  pub payment_type: String,
  pub doc_date: String,
  pub subtotal: f64,
  pub bill_discount: f64,
  pub before_vat: f64,
  pub vat_amount: f64,
  pub rounding_adjust: f64,
  pub grand_total: f64,
  pub remark: Option<String>,
  pub branch_id: Option<String>,
  pub member_code: Option<String>,
  pub lines: Vec<SaleLinePayload>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleCreateResult {
  pub sale_id: String,
  pub bill_no: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct SalesByPaymentRow {
  pub payment_type: String,
  pub total_baht: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SalesDaySummaryResult {
  pub count: i64,
  pub total_baht: f64,
  pub by_payment: Vec<SalesByPaymentRow>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct SalesHistoryRow {
  pub id: String,
  pub bill_no: String,
  pub at: String,
  pub total: f64,
  pub payment_id: String,
  pub line_count: i64,
  pub lines: serde_json::Value,
}

#[tauri::command]
pub async fn sales_create(payload: SaleCreatePayload) -> Result<SaleCreateResult, String> {
  let pool = get_pool().await?;
  let mut tx = pool.begin().await.map_err(|e| format!("begin tx failed: {e}"))?;

  let member_id: Option<String> = if let Some(code) = payload.member_code.as_ref().map(|s| s.trim()).filter(|s| !s.is_empty()) {
    sqlx::query_scalar::<_, String>(r#"SELECT id FROM "Member" WHERE "memberCode" = $1 LIMIT 1"#)
      .bind(code)
      .fetch_optional(&mut *tx)
      .await
      .map_err(|e| format!("resolve member failed: {e}"))?
  } else {
    None
  };

  sqlx::query(
    r#"
    INSERT INTO "Sale" (
      id, "billNo", "taxInvoiceNo", mode, "paymentType", "docDate",
      subtotal, "billDiscount", "beforeVat", "vatAmount", "roundingAdjust", "grandTotal",
      remark, "branchId", "memberId", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, NULLIF($3, ''), $4::"SaleMode", $5::"SalePaymentType", COALESCE(NULLIF($6, '')::date::timestamp, now()),
      $7, $8, $9, $10, $11, $12,
      NULLIF($13, ''), NULLIF($14, ''), $15, now(), now()
    )
    "#,
  )
  .bind(payload.id.clone())
  .bind(payload.bill_no.clone())
  .bind(payload.tax_invoice_no.clone().unwrap_or_default())
  .bind(payload.mode.clone())
  .bind(payload.payment_type.clone())
  .bind(payload.doc_date.clone())
  .bind(payload.subtotal)
  .bind(payload.bill_discount)
  .bind(payload.before_vat)
  .bind(payload.vat_amount)
  .bind(payload.rounding_adjust)
  .bind(payload.grand_total)
  .bind(payload.remark.clone().unwrap_or_default())
  .bind(payload.branch_id.clone().unwrap_or_default())
  .bind(member_id)
  .execute(&mut *tx)
  .await
  .map_err(|e| format!("insert sale failed: {e}"))?;

  for line in &payload.lines {
    let product_id = sqlx::query_scalar::<_, String>(
      r#"
      INSERT INTO "Product" (
        id, sku, name, category, "isActive", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, 'ทั่วไป', true, now(), now()
      )
      ON CONFLICT (sku) DO UPDATE SET
        name = EXCLUDED.name,
        "updatedAt" = now()
      RETURNING id
      "#,
    )
    .bind(format!("prod-{}", line.product_code))
    .bind(line.product_code.clone())
    .bind(line.product_name.clone())
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| format!("ensure product {} failed: {e}", line.product_code))?;

    sqlx::query(
      r#"
      INSERT INTO "SaleLine" (
        id, qty, "unitLabel", "unitIndex", "unitPrice", discount, "lineTotal",
        "priceLevelLabel", "priceLevelIndex", "priceTagLabel", "createdAt", "saleId", "productId"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        NULLIF($8, ''), $9, NULLIF($10, ''), now(), $11, $12
      )
      "#,
    )
    .bind(line.id.clone())
    .bind(line.qty)
    .bind(line.unit_label.clone())
    .bind(line.unit_index)
    .bind(line.unit_price)
    .bind(line.discount)
    .bind(line.line_total)
    .bind(line.price_level_label.clone().unwrap_or_default())
    .bind(line.price_level_index)
    .bind(line.price_tag_label.clone().unwrap_or_default())
    .bind(payload.id.clone())
    .bind(product_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("insert sale line {} failed: {e}", line.id))?;
  }

  tx.commit().await.map_err(|e| format!("commit tx failed: {e}"))?;
  Ok(SaleCreateResult {
    sale_id: payload.id,
    bill_no: payload.bill_no,
  })
}

#[tauri::command]
pub async fn sales_day_summary(doc_date: Option<String>) -> Result<SalesDaySummaryResult, String> {
  let pool = get_pool().await?;
  let date_arg = doc_date.unwrap_or_default();

  let row = sqlx::query_as::<_, (i64, f64)>(
    r#"
    SELECT
      COUNT(*)::bigint as count,
      COALESCE(SUM("grandTotal"), 0)::double precision as total_baht
    FROM "Sale"
    WHERE "docDate"::date = COALESCE(NULLIF($1, '')::date, CURRENT_DATE)
    "#,
  )
  .bind(date_arg.clone())
  .fetch_one(&pool)
  .await
  .map_err(|e| format!("query sales summary failed: {e}"))?;

  let by_payment = sqlx::query_as::<_, SalesByPaymentRow>(
    r#"
    SELECT
      "paymentType"::text as payment_type,
      COALESCE(SUM("grandTotal"), 0)::double precision as total_baht
    FROM "Sale"
    WHERE "docDate"::date = COALESCE(NULLIF($1, '')::date, CURRENT_DATE)
    GROUP BY "paymentType"
    ORDER BY total_baht DESC
    "#,
  )
  .bind(date_arg)
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("query sales by payment failed: {e}"))?;

  Ok(SalesDaySummaryResult {
    count: row.0,
    total_baht: row.1,
    by_payment,
  })
}

#[tauri::command]
pub async fn sales_history_list(limit: Option<i64>) -> Result<Vec<SalesHistoryRow>, String> {
  let pool = get_pool().await?;
  let lim = limit.unwrap_or(200).clamp(1, 1000);
  let rows = sqlx::query_as::<_, SalesHistoryRow>(
    r#"
    SELECT
      s.id,
      s."billNo" as bill_no,
      to_char(s."docDate", 'YYYY-MM-DD"T"HH24:MI:SS') as at,
      s."grandTotal" as total,
      s."paymentType"::text as payment_id,
      COUNT(sl.id)::bigint as line_count,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'productId', p.id,
            'sku', p.sku,
            'name', p.name,
            'qty', sl.qty,
            'unitPrice', sl."unitPrice"
          )
        ) FILTER (WHERE sl.id IS NOT NULL),
        '[]'::jsonb
      ) as lines
    FROM "Sale" s
    LEFT JOIN "SaleLine" sl ON sl."saleId" = s.id
    LEFT JOIN "Product" p ON p.id = sl."productId"
    GROUP BY s.id
    ORDER BY s."docDate" DESC, s."createdAt" DESC
    LIMIT $1
    "#,
  )
  .bind(lim)
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("query sales history failed: {e}"))?;
  Ok(rows)
}

#[tauri::command]
pub async fn sales_get_by_bill_no(bill_no: String) -> Result<Option<SalesHistoryRow>, String> {
  let pool = get_pool().await?;
  let row = sqlx::query_as::<_, SalesHistoryRow>(
    r#"
    SELECT
      s.id,
      s."billNo" as bill_no,
      to_char(s."docDate", 'YYYY-MM-DD"T"HH24:MI:SS') as at,
      s."grandTotal" as total,
      s."paymentType"::text as payment_id,
      COUNT(sl.id)::bigint as line_count,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'productId', p.id,
            'sku', p.sku,
            'name', p.name,
            'qty', sl.qty,
            'unitPrice', sl."unitPrice"
          )
        ) FILTER (WHERE sl.id IS NOT NULL),
        '[]'::jsonb
      ) as lines
    FROM "Sale" s
    LEFT JOIN "SaleLine" sl ON sl."saleId" = s.id
    LEFT JOIN "Product" p ON p.id = sl."productId"
    WHERE s."billNo" = $1
    GROUP BY s.id
    LIMIT 1
    "#,
  )
  .bind(bill_no)
  .fetch_optional(&pool)
  .await
  .map_err(|e| format!("query sale by bill no failed: {e}"))?;
  Ok(row)
}
