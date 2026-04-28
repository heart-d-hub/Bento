use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};

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

// ─── Filter Options (Phase A) ────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct BranchOption {
  pub id: String,
  pub code: String,
  pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportFilterOptions {
  pub categories: Vec<String>,
  pub brands: Vec<String>,
  pub sub_categories: Vec<String>,
  pub branches: Vec<BranchOption>,
  pub member_types: Vec<String>,
}

#[tauri::command]
pub async fn report_filter_options() -> Result<ReportFilterOptions, String> {
  let pool = get_pool().await?;

  let categories = sqlx::query_scalar::<_, String>(
    r#"SELECT DISTINCT category FROM "Product" WHERE "isActive" = true ORDER BY category"#,
  )
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("filter categories: {e}"))?;

  let brands = sqlx::query_scalar::<_, String>(
    r#"SELECT DISTINCT brand FROM "Product" WHERE "isActive" = true AND brand IS NOT NULL ORDER BY brand"#,
  )
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("filter brands: {e}"))?;

  let sub_categories = sqlx::query_scalar::<_, String>(
    r#"SELECT DISTINCT "subCategory" FROM "Product" WHERE "isActive" = true AND "subCategory" IS NOT NULL ORDER BY "subCategory""#,
  )
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("filter sub_categories: {e}"))?;

  let branches = sqlx::query_as::<_, BranchOption>(
    r#"SELECT id, code, name FROM "Branch" WHERE "isActive" = true ORDER BY name"#,
  )
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("filter branches: {e}"))?;

  let member_types = sqlx::query_scalar::<_, String>(
    r#"SELECT DISTINCT "memberType" FROM "Member" ORDER BY "memberType""#,
  )
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("filter member_types: {e}"))?;

  Ok(ReportFilterOptions { categories, brands, sub_categories, branches, member_types })
}

// ─── Sales Summary (with optional filters) ───────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportPaymentRow {
  pub payment_type: String,
  pub count: i64,
  pub total_baht: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportDailyRow {
  pub date: String,
  pub count: i64,
  pub total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportSalesSummary {
  pub count: i64,
  pub total: f64,
  pub avg_bill: f64,
  pub by_payment: Vec<ReportPaymentRow>,
  pub daily_trend: Vec<ReportDailyRow>,
}

// Shared filter SQL: $1=date_from $2=date_to $3=payment_type $4=branch_id $5=category $6=brand
const SALE_FILTER: &str = r#"
    AND ($3::text IS NULL OR s."paymentType"::text = $3)
    AND ($4::text IS NULL OR s."branchId" = $4)
    AND ($5::text IS NULL OR EXISTS (
      SELECT 1 FROM "SaleLine" sl0 JOIN "Product" p0 ON p0.id = sl0."productId"
      WHERE sl0."saleId" = s.id AND p0.category = $5
    ))
    AND ($6::text IS NULL OR EXISTS (
      SELECT 1 FROM "SaleLine" sl1 JOIN "Product" p1 ON p1.id = sl1."productId"
      WHERE sl1."saleId" = s.id AND p1.brand = $6
    ))
"#;

#[tauri::command]
pub async fn report_sales_summary(
  date_from: String,
  date_to: String,
  category: Option<String>,
  brand: Option<String>,
  payment_type: Option<String>,
  branch_id: Option<String>,
) -> Result<ReportSalesSummary, String> {
  let pool = get_pool().await?;

  let totals_sql = format!(
    r#"SELECT COUNT(*)::bigint, COALESCE(SUM("grandTotal"),0)::double precision, COALESCE(AVG("grandTotal"),0)::double precision
       FROM "Sale" s WHERE s."docDate"::date BETWEEN $1::date AND $2::date {SALE_FILTER}"#
  );
  let row = sqlx::query_as::<_, (i64, f64, f64)>(&totals_sql)
    .bind(&date_from).bind(&date_to)
    .bind(&payment_type).bind(&branch_id).bind(&category).bind(&brand)
    .fetch_one(&pool).await
    .map_err(|e| format!("report summary totals: {e}"))?;

  let payment_sql = format!(
    r#"SELECT "paymentType"::text AS payment_type, COUNT(*)::bigint AS count,
              COALESCE(SUM("grandTotal"),0)::double precision AS total_baht
       FROM "Sale" s WHERE s."docDate"::date BETWEEN $1::date AND $2::date {SALE_FILTER}
       GROUP BY "paymentType" ORDER BY total_baht DESC"#
  );
  let by_payment = sqlx::query_as::<_, ReportPaymentRow>(&payment_sql)
    .bind(&date_from).bind(&date_to)
    .bind(&payment_type).bind(&branch_id).bind(&category).bind(&brand)
    .fetch_all(&pool).await
    .map_err(|e| format!("report by_payment: {e}"))?;

  let trend_sql = format!(
    r#"SELECT to_char(s."docDate"::date,'YYYY-MM-DD') AS date,
              COUNT(*)::bigint AS count, COALESCE(SUM("grandTotal"),0)::double precision AS total
       FROM "Sale" s WHERE s."docDate"::date BETWEEN $1::date AND $2::date {SALE_FILTER}
       GROUP BY s."docDate"::date ORDER BY s."docDate"::date"#
  );
  let daily_trend = sqlx::query_as::<_, ReportDailyRow>(&trend_sql)
    .bind(&date_from).bind(&date_to)
    .bind(&payment_type).bind(&branch_id).bind(&category).bind(&brand)
    .fetch_all(&pool).await
    .map_err(|e| format!("report daily_trend: {e}"))?;

  Ok(ReportSalesSummary { count: row.0, total: row.1, avg_bill: row.2, by_payment, daily_trend })
}

// ─── Top Products (with optional filters) ────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportTopProductRow {
  pub product_id: String,
  pub sku: String,
  pub name: String,
  pub category: String,
  pub qty_sold: f64,
  pub revenue: f64,
}

#[tauri::command]
pub async fn report_top_products(
  date_from: String,
  date_to: String,
  limit: Option<i64>,
  category: Option<String>,
  brand: Option<String>,
  payment_type: Option<String>,
  branch_id: Option<String>,
) -> Result<Vec<ReportTopProductRow>, String> {
  let pool = get_pool().await?;
  let lim = limit.unwrap_or(10).clamp(1, 100);
  sqlx::query_as::<_, ReportTopProductRow>(
    r#"
    SELECT p.id AS product_id, p.sku, p.name, p.category,
           COALESCE(SUM(sl.qty),0)::double precision AS qty_sold,
           COALESCE(SUM(sl."lineTotal"),0)::double precision AS revenue
    FROM "SaleLine" sl
    JOIN "Sale"    s ON s.id  = sl."saleId"
    JOIN "Product" p ON p.id  = sl."productId"
    WHERE s."docDate"::date BETWEEN $1::date AND $2::date
      AND ($3::text IS NULL OR p.category   = $3)
      AND ($4::text IS NULL OR p.brand      = $4)
      AND ($5::text IS NULL OR s."paymentType"::text = $5)
      AND ($6::text IS NULL OR s."branchId" = $6)
    GROUP BY p.id, p.sku, p.name, p.category
    ORDER BY revenue DESC
    LIMIT $7
    "#,
  )
  .bind(&date_from).bind(&date_to)
  .bind(&category).bind(&brand).bind(&payment_type).bind(&branch_id)
  .bind(lim)
  .fetch_all(&pool).await
  .map_err(|e| format!("report_top_products: {e}"))
}

// ─── Top Members (with optional segment filters) ──────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportTopMemberRow {
  pub member_code: String,
  pub full_name: String,
  pub visit_count: i64,
  pub total_spent: f64,
}

#[tauri::command]
pub async fn report_top_members(
  date_from: String,
  date_to: String,
  limit: Option<i64>,
  member_type: Option<String>,
  price_tier: Option<String>,
  branch_id: Option<String>,
) -> Result<Vec<ReportTopMemberRow>, String> {
  let pool = get_pool().await?;
  let lim = limit.unwrap_or(10).clamp(1, 100);
  sqlx::query_as::<_, ReportTopMemberRow>(
    r#"
    SELECT m."memberCode" AS member_code, m."fullName" AS full_name,
           COUNT(s.id)::bigint AS visit_count,
           COALESCE(SUM(s."grandTotal"),0)::double precision AS total_spent
    FROM "Sale" s
    JOIN "Member" m ON m.id = s."memberId"
    WHERE s."docDate"::date BETWEEN $1::date AND $2::date
      AND ($3::text IS NULL OR m."memberType"              = $3)
      AND ($4::text IS NULL OR m."defaultPriceTier"::text  = $4)
      AND ($5::text IS NULL OR s."branchId"                = $5)
    GROUP BY m."memberCode", m."fullName"
    ORDER BY total_spent DESC
    LIMIT $6
    "#,
  )
  .bind(&date_from).bind(&date_to)
  .bind(&member_type).bind(&price_tier).bind(&branch_id)
  .bind(lim)
  .fetch_all(&pool).await
  .map_err(|e| format!("report_top_members: {e}"))
}

// ─── Tax Invoices ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportTaxInvoiceRow {
  pub bill_no: String,
  pub tax_invoice_no: String,
  pub doc_date: String,
  pub member_name: String,
  pub before_vat: f64,
  pub vat_amount: f64,
  pub grand_total: f64,
}

#[tauri::command]
pub async fn report_tax_invoices(year_month: String) -> Result<Vec<ReportTaxInvoiceRow>, String> {
  let pool = get_pool().await?;
  sqlx::query_as::<_, ReportTaxInvoiceRow>(
    r#"
    SELECT s."billNo" AS bill_no, COALESCE(s."taxInvoiceNo",'') AS tax_invoice_no,
           to_char(s."docDate"::date,'YYYY-MM-DD') AS doc_date,
           COALESCE(m."fullName",'') AS member_name,
           s."beforeVat" AS before_vat, s."vatAmount" AS vat_amount, s."grandTotal" AS grand_total
    FROM "Sale" s
    LEFT JOIN "Member" m ON m.id = s."memberId"
    WHERE s.mode = 'tax'::"SaleMode" AND to_char(s."docDate"::date,'YYYY-MM') = $1
    ORDER BY s."docDate", s."billNo"
    "#,
  )
  .bind(&year_month)
  .fetch_all(&pool).await
  .map_err(|e| format!("report_tax_invoices: {e}"))
}

// ─── Adjustments (Voids + Returns) ───────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportVoidRow {
  pub bill_no: String,
  pub doc_date: String,
  pub voided_at: String,
  pub grand_total: f64,
  pub void_reason: String,
  pub member_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportReturnRow {
  pub return_no: String,
  pub return_date: String,
  pub original_bill_no: String,
  pub refund_method: String,
  pub total_refund: f64,
  pub reason: String,
  pub member_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportAdjustmentsResult {
  pub void_count: i64,
  pub void_total: f64,
  pub voids: Vec<ReportVoidRow>,
  pub return_count: i64,
  pub return_total: f64,
  pub returns: Vec<ReportReturnRow>,
}

#[tauri::command]
pub async fn report_adjustments(date_from: String, date_to: String) -> Result<ReportAdjustmentsResult, String> {
  let pool = get_pool().await?;

  let voids = sqlx::query_as::<_, ReportVoidRow>(
    r#"
    SELECT s."billNo" AS bill_no,
           to_char(s."docDate"::date,'YYYY-MM-DD') AS doc_date,
           to_char(s."voidedAt" AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD') AS voided_at,
           s."grandTotal" AS grand_total,
           COALESCE(s."voidReason",'') AS void_reason,
           COALESCE(m."fullName",'') AS member_name
    FROM "Sale" s LEFT JOIN "Member" m ON m.id = s."memberId"
    WHERE s."voidedAt" IS NOT NULL
      AND (s."voidedAt" AT TIME ZONE 'Asia/Bangkok')::date BETWEEN $1::date AND $2::date
    ORDER BY s."voidedAt" DESC
    "#,
  )
  .bind(&date_from).bind(&date_to)
  .fetch_all(&pool).await
  .map_err(|e| format!("report_voids: {e}"))?;

  let returns = sqlx::query_as::<_, ReportReturnRow>(
    r#"
    SELECT sr."returnNo" AS return_no,
           to_char(sr."returnDate" AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD') AS return_date,
           s."billNo" AS original_bill_no,
           sr."refundMethod" AS refund_method,
           sr."totalRefund" AS total_refund,
           COALESCE(sr.reason,'') AS reason,
           COALESCE(m."fullName",'') AS member_name
    FROM "SaleReturn" sr
    JOIN "Sale" s ON s.id = sr."originalSaleId"
    LEFT JOIN "Member" m ON m.id = s."memberId"
    WHERE (sr."returnDate" AT TIME ZONE 'Asia/Bangkok')::date BETWEEN $1::date AND $2::date
    ORDER BY sr."returnDate" DESC
    "#,
  )
  .bind(&date_from).bind(&date_to)
  .fetch_all(&pool).await
  .map_err(|e| format!("report_returns: {e}"))?;

  let void_count = voids.len() as i64;
  let void_total = voids.iter().map(|r| r.grand_total).sum();
  let return_count = returns.len() as i64;
  let return_total = returns.iter().map(|r| r.total_refund).sum();

  Ok(ReportAdjustmentsResult { void_count, void_total, voids, return_count, return_total, returns })
}

// ─── Credit Notes ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportCreditNoteRow {
  pub credit_note_no: String,
  pub credit_note_date: String,
  pub original_bill_no: String,
  pub original_tax_invoice_no: String,
  pub member_name: String,
  pub before_vat: f64,
  pub vat_amount: f64,
  pub total_amount: f64,
}

#[tauri::command]
pub async fn report_credit_notes(year_month: String) -> Result<Vec<ReportCreditNoteRow>, String> {
  let pool = get_pool().await?;
  sqlx::query_as::<_, ReportCreditNoteRow>(
    r#"
    SELECT cn."creditNoteNo" AS credit_note_no,
           to_char(cn."creditNoteDate" AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD') AS credit_note_date,
           s."billNo" AS original_bill_no,
           COALESCE(s."taxInvoiceNo",'') AS original_tax_invoice_no,
           COALESCE(m."fullName",'') AS member_name,
           cn."beforeVat" AS before_vat, cn."vatAmount" AS vat_amount, cn."totalAmount" AS total_amount
    FROM "CreditNote" cn
    JOIN  "Sale"   s ON s.id  = cn."originalSaleId"
    LEFT JOIN "Member" m ON m.id = s."memberId"
    WHERE to_char(cn."creditNoteDate" AT TIME ZONE 'Asia/Bangkok','YYYY-MM') = $1
    ORDER BY cn."creditNoteDate", cn."creditNoteNo"
    "#,
  )
  .bind(&year_month)
  .fetch_all(&pool).await
  .map_err(|e| format!("report_credit_notes: {e}"))
}

// ─── Stock Ledger ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportStockLedgerRow {
  pub product_id: String,
  pub sku: String,
  pub name: String,
  pub category: String,
  pub min_stock: f64,
  pub stock_qty: f64,
}

#[tauri::command]
pub async fn report_stock_ledger(limit: Option<i64>) -> Result<Vec<ReportStockLedgerRow>, String> {
  let pool = get_pool().await?;
  let lim = limit.unwrap_or(300).clamp(1, 1000);
  sqlx::query_as::<_, ReportStockLedgerRow>(
    r#"
    SELECT p.id AS product_id, p.sku, p.name, p.category,
           p."minStock" AS min_stock,
           COALESCE(SUM(sm."qtyDelta"),0)::double precision AS stock_qty
    FROM "Product" p
    LEFT JOIN "StockMovement" sm ON sm."productId" = p.id
    WHERE p."isActive" = true
    GROUP BY p.id, p.sku, p.name, p.category, p."minStock"
    HAVING COALESCE(SUM(sm."qtyDelta"),0) != 0 OR p."minStock" > 0
    ORDER BY (COALESCE(SUM(sm."qtyDelta"),0) / NULLIF(p."minStock",0)) ASC NULLS LAST, p.name
    LIMIT $1
    "#,
  )
  .bind(lim)
  .fetch_all(&pool).await
  .map_err(|e| format!("report_stock_ledger: {e}"))
}

// ─── AR Balances ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportArBalanceRow {
  pub member_code: String,
  pub full_name: String,
  pub ar_balance: f64,
  pub credit_limit: f64,
  pub last_sale_at: Option<String>,
}

#[tauri::command]
pub async fn report_ar_balances() -> Result<Vec<ReportArBalanceRow>, String> {
  let pool = get_pool().await?;
  sqlx::query_as::<_, ReportArBalanceRow>(
    r#"
    SELECT m."memberCode" AS member_code, m."fullName" AS full_name,
           m."arBalance" AS ar_balance, m."creditLimitBaht" AS credit_limit,
           to_char(MAX(s."docDate"),'YYYY-MM-DD') AS last_sale_at
    FROM "Member" m
    LEFT JOIN "Sale" s ON s."memberId" = m.id
    WHERE m."arBalance" > 0 OR m."creditLimitBaht" > 0
    GROUP BY m."memberCode", m."fullName", m."arBalance", m."creditLimitBaht"
    ORDER BY m."arBalance" DESC
    "#,
  )
  .fetch_all(&pool).await
  .map_err(|e| format!("report_ar_balances: {e}"))
}

// ─── Sales by Category (with filters) ────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportCategoryRow {
  pub category: String,
  pub qty_sold: f64,
  pub revenue: f64,
  pub bill_count: i64,
}

#[tauri::command]
pub async fn report_sales_by_category(
  date_from: String,
  date_to: String,
  brand: Option<String>,
  payment_type: Option<String>,
  branch_id: Option<String>,
) -> Result<Vec<ReportCategoryRow>, String> {
  let pool = get_pool().await?;
  sqlx::query_as::<_, ReportCategoryRow>(
    r#"
    SELECT p.category,
           COALESCE(SUM(sl.qty),0)::double precision AS qty_sold,
           COALESCE(SUM(sl."lineTotal"),0)::double precision AS revenue,
           COUNT(DISTINCT s.id)::bigint AS bill_count
    FROM "SaleLine" sl
    JOIN "Sale"    s ON s.id = sl."saleId"
    JOIN "Product" p ON p.id = sl."productId"
    WHERE s."docDate"::date BETWEEN $1::date AND $2::date
      AND ($3::text IS NULL OR p.brand              = $3)
      AND ($4::text IS NULL OR s."paymentType"::text = $4)
      AND ($5::text IS NULL OR s."branchId"          = $5)
    GROUP BY p.category
    ORDER BY revenue DESC
    "#,
  )
  .bind(&date_from).bind(&date_to)
  .bind(&brand).bind(&payment_type).bind(&branch_id)
  .fetch_all(&pool).await
  .map_err(|e| format!("report_sales_by_category: {e}"))
}

// ─── Slow Movers ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportSlowMoverRow {
  pub product_id: String,
  pub sku: String,
  pub name: String,
  pub category: String,
  pub last_sold_at: Option<String>,
}

#[tauri::command]
pub async fn report_slow_movers(days: Option<i32>, limit: Option<i64>) -> Result<Vec<ReportSlowMoverRow>, String> {
  let pool = get_pool().await?;
  let d = days.unwrap_or(30);
  let lim = limit.unwrap_or(50).clamp(1, 200);
  sqlx::query_as::<_, ReportSlowMoverRow>(
    r#"
    SELECT p.id AS product_id, p.sku, p.name, p.category,
           to_char(MAX(s."docDate"),'YYYY-MM-DD') AS last_sold_at
    FROM "Product" p
    LEFT JOIN "SaleLine" sl ON sl."productId" = p.id
    LEFT JOIN "Sale"     s  ON s.id = sl."saleId"
    WHERE p."isActive" = true
    GROUP BY p.id, p.sku, p.name, p.category
    HAVING MAX(s."docDate") IS NULL
        OR MAX(s."docDate") < (CURRENT_DATE - ($1::int * INTERVAL '1 day'))
    ORDER BY MAX(s."docDate") ASC NULLS FIRST, p.name
    LIMIT $2
    "#,
  )
  .bind(d).bind(lim)
  .fetch_all(&pool).await
  .map_err(|e| format!("report_slow_movers: {e}"))
}

// ─── Profit Margin (Phase C) ──────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportMarginRow {
  pub product_id: String,
  pub sku: String,
  pub name: String,
  pub category: String,
  pub qty_sold: f64,
  pub revenue: f64,
  pub cogs: f64,
  pub gross_profit: f64,
  pub margin_pct: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportMarginCategoryRow {
  pub category: String,
  pub revenue: f64,
  pub cogs: f64,
  pub gross_profit: f64,
  pub margin_pct: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportProfitSummary {
  pub revenue: f64,
  pub cogs: f64,
  pub gross_profit: f64,
  pub margin_pct: f64,
  pub by_category: Vec<ReportMarginCategoryRow>,
  pub top_products: Vec<ReportMarginRow>,
}

#[tauri::command]
pub async fn report_profit_margin(
  date_from: String,
  date_to: String,
  category: Option<String>,
  brand: Option<String>,
  branch_id: Option<String>,
) -> Result<ReportProfitSummary, String> {
  let pool = get_pool().await?;

  let (revenue, cogs): (f64, f64) = sqlx::query_as::<_, (f64, f64)>(
    r#"
    SELECT COALESCE(SUM(sl."lineTotal"),0)::double precision,
           COALESCE(SUM(sl."costAtSale" * sl.qty),0)::double precision
    FROM "SaleLine" sl
    JOIN "Sale"    s ON s.id = sl."saleId"
    JOIN "Product" p ON p.id = sl."productId"
    WHERE s."docDate"::date BETWEEN $1::date AND $2::date
      AND ($3::text IS NULL OR p.category = $3)
      AND ($4::text IS NULL OR p.brand    = $4)
      AND ($5::text IS NULL OR s."branchId" = $5)
    "#,
  )
  .bind(&date_from).bind(&date_to).bind(&category).bind(&brand).bind(&branch_id)
  .fetch_one(&pool).await
  .map_err(|e| format!("profit totals: {e}"))?;

  let by_category = sqlx::query_as::<_, ReportMarginCategoryRow>(
    r#"
    SELECT p.category,
           COALESCE(SUM(sl."lineTotal"),0)::double precision AS revenue,
           COALESCE(SUM(sl."costAtSale" * sl.qty),0)::double precision AS cogs,
           (COALESCE(SUM(sl."lineTotal"),0) - COALESCE(SUM(sl."costAtSale" * sl.qty),0))::double precision AS gross_profit,
           CASE WHEN COALESCE(SUM(sl."lineTotal"),0) > 0
                THEN ((COALESCE(SUM(sl."lineTotal"),0) - COALESCE(SUM(sl."costAtSale"*sl.qty),0))
                      / COALESCE(SUM(sl."lineTotal"),0) * 100)
                ELSE 0 END::double precision AS margin_pct
    FROM "SaleLine" sl
    JOIN "Sale"    s ON s.id = sl."saleId"
    JOIN "Product" p ON p.id = sl."productId"
    WHERE s."docDate"::date BETWEEN $1::date AND $2::date
      AND ($3::text IS NULL OR p.brand    = $3)
      AND ($4::text IS NULL OR s."branchId" = $4)
    GROUP BY p.category ORDER BY gross_profit DESC
    "#,
  )
  .bind(&date_from).bind(&date_to).bind(&brand).bind(&branch_id)
  .fetch_all(&pool).await
  .map_err(|e| format!("profit by_category: {e}"))?;

  let top_products = sqlx::query_as::<_, ReportMarginRow>(
    r#"
    SELECT p.id AS product_id, p.sku, p.name, p.category,
           COALESCE(SUM(sl.qty),0)::double precision AS qty_sold,
           COALESCE(SUM(sl."lineTotal"),0)::double precision AS revenue,
           COALESCE(SUM(sl."costAtSale"*sl.qty),0)::double precision AS cogs,
           (COALESCE(SUM(sl."lineTotal"),0)-COALESCE(SUM(sl."costAtSale"*sl.qty),0))::double precision AS gross_profit,
           CASE WHEN COALESCE(SUM(sl."lineTotal"),0) > 0
                THEN ((COALESCE(SUM(sl."lineTotal"),0)-COALESCE(SUM(sl."costAtSale"*sl.qty),0))
                      / COALESCE(SUM(sl."lineTotal"),0)*100)
                ELSE 0 END::double precision AS margin_pct
    FROM "SaleLine" sl
    JOIN "Sale"    s ON s.id = sl."saleId"
    JOIN "Product" p ON p.id = sl."productId"
    WHERE s."docDate"::date BETWEEN $1::date AND $2::date
      AND ($3::text IS NULL OR p.category = $3)
      AND ($4::text IS NULL OR p.brand    = $4)
      AND ($5::text IS NULL OR s."branchId" = $5)
    GROUP BY p.id, p.sku, p.name, p.category
    ORDER BY gross_profit DESC
    LIMIT 20
    "#,
  )
  .bind(&date_from).bind(&date_to).bind(&category).bind(&brand).bind(&branch_id)
  .fetch_all(&pool).await
  .map_err(|e| format!("profit top_products: {e}"))?;

  let gross_profit = revenue - cogs;
  let margin_pct = if revenue > 0.0 { gross_profit / revenue * 100.0 } else { 0.0 };

  Ok(ReportProfitSummary { revenue, cogs, gross_profit, margin_pct, by_category, top_products })
}

// ─── Member Segments (Phase D) ────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportSegmentRow {
  pub segment: String,
  pub member_count: i64,
  pub bill_count: i64,
  pub revenue: f64,
  pub avg_bill: f64,
}

#[tauri::command]
pub async fn report_member_segments(
  date_from: String,
  date_to: String,
) -> Result<Vec<ReportSegmentRow>, String> {
  let pool = get_pool().await?;
  sqlx::query_as::<_, ReportSegmentRow>(
    r#"
    SELECT m."defaultPriceTier"::text AS segment,
           COUNT(DISTINCT m.id)::bigint AS member_count,
           COUNT(s.id)::bigint AS bill_count,
           COALESCE(SUM(s."grandTotal"),0)::double precision AS revenue,
           COALESCE(AVG(s."grandTotal"),0)::double precision AS avg_bill
    FROM "Member" m
    JOIN "Sale" s ON s."memberId" = m.id
    WHERE s."docDate"::date BETWEEN $1::date AND $2::date
    GROUP BY m."defaultPriceTier"
    ORDER BY revenue DESC
    "#,
  )
  .bind(&date_from).bind(&date_to)
  .fetch_all(&pool).await
  .map_err(|e| format!("report_member_segments: {e}"))
}

// ─── RFM Analysis (Phase D) ───────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportRfmRow {
  pub member_code: String,
  pub full_name: String,
  pub recency_days: i32,
  pub frequency: i64,
  pub monetary: f64,
  pub r_score: i32,
  pub f_score: i32,
  pub m_score: i32,
  pub rfm_total: i32,
  pub rfm_segment: String,
}

#[tauri::command]
pub async fn report_rfm(limit: Option<i64>) -> Result<Vec<ReportRfmRow>, String> {
  let pool = get_pool().await?;
  let lim = limit.unwrap_or(100).clamp(1, 500);
  sqlx::query_as::<_, ReportRfmRow>(
    r#"
    WITH member_stats AS (
      SELECT m.id, m."memberCode", m."fullName",
             EXTRACT(DAYS FROM NOW() - MAX(s."docDate"))::int AS recency_days,
             COUNT(s.id)::bigint AS frequency,
             COALESCE(SUM(s."grandTotal"),0) AS monetary
      FROM "Member" m
      JOIN "Sale" s ON s."memberId" = m.id
      GROUP BY m.id, m."memberCode", m."fullName"
    ),
    scored AS (
      SELECT *,
        NTILE(5) OVER (ORDER BY recency_days ASC)::int  AS r_score,
        NTILE(5) OVER (ORDER BY frequency DESC)::int    AS f_score,
        NTILE(5) OVER (ORDER BY monetary DESC)::int     AS m_score
      FROM member_stats
    )
    SELECT
      "memberCode" AS member_code,
      "fullName"   AS full_name,
      recency_days, frequency,
      monetary::double precision,
      r_score, f_score, m_score,
      (r_score + f_score + m_score)::int AS rfm_total,
      CASE
        WHEN r_score >= 4 AND f_score >= 4              THEN 'Champion'
        WHEN r_score >= 3 AND f_score >= 3              THEN 'Loyal'
        WHEN r_score >= 4 AND f_score < 3               THEN 'Promising'
        WHEN r_score < 3  AND f_score >= 3              THEN 'At Risk'
        WHEN r_score <= 2 AND f_score <= 2              THEN 'Lost'
        ELSE                                                 'Potential'
      END AS rfm_segment
    FROM scored
    ORDER BY rfm_total DESC
    LIMIT $1
    "#,
  )
  .bind(lim)
  .fetch_all(&pool).await
  .map_err(|e| format!("report_rfm: {e}"))
}

// ─── P&L Summary (Phase E) ────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PnlMonthRow {
  pub month: String,
  pub revenue: f64,
  pub cogs: f64,
  pub expenses: f64,
  pub net: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportPnlResult {
  pub revenue: f64,
  pub cogs: f64,
  pub gross_profit: f64,
  pub gross_margin_pct: f64,
  pub total_expenses: f64,
  pub net_profit: f64,
  pub monthly_trend: Vec<PnlMonthRow>,
}

#[tauri::command]
pub async fn report_pnl(date_from: String, date_to: String) -> Result<ReportPnlResult, String> {
  let pool = get_pool().await?;

  let (revenue, cogs): (f64, f64) = sqlx::query_as::<_, (f64, f64)>(
    r#"
    SELECT COALESCE(SUM(sl."lineTotal"),0)::double precision,
           COALESCE(SUM(sl."costAtSale" * sl.qty),0)::double precision
    FROM "SaleLine" sl
    JOIN "Sale" s ON s.id = sl."saleId"
    WHERE s."docDate"::date BETWEEN $1::date AND $2::date
    "#,
  )
  .bind(&date_from).bind(&date_to)
  .fetch_one(&pool).await
  .map_err(|e| format!("pnl revenue/cogs: {e}"))?;

  let total_expenses: f64 = sqlx::query_scalar::<_, f64>(
    r#"SELECT COALESCE(SUM(amount),0)::double precision FROM "Expense"
       WHERE "expenseDate" BETWEEN $1::date AND $2::date"#,
  )
  .bind(&date_from).bind(&date_to)
  .fetch_one(&pool).await
  .unwrap_or(0.0);

  let monthly_trend = sqlx::query_as::<_, PnlMonthRow>(
    r#"
    WITH months AS (
      SELECT generate_series($1::date, $2::date, '1 month'::interval)::date AS month_start
    ),
    sales_data AS (
      SELECT to_char(s."docDate",'YYYY-MM') AS month,
             COALESCE(SUM(sl."lineTotal"),0) AS rev,
             COALESCE(SUM(sl."costAtSale"*sl.qty),0) AS cogs_val
      FROM "Sale" s JOIN "SaleLine" sl ON sl."saleId" = s.id
      WHERE s."docDate"::date BETWEEN $1::date AND $2::date
      GROUP BY to_char(s."docDate",'YYYY-MM')
    ),
    exp_data AS (
      SELECT to_char("expenseDate",'YYYY-MM') AS month,
             COALESCE(SUM(amount),0) AS exp_val
      FROM "Expense"
      WHERE "expenseDate" BETWEEN $1::date AND $2::date
      GROUP BY to_char("expenseDate",'YYYY-MM')
    )
    SELECT to_char(m.month_start,'YYYY-MM') AS month,
           COALESCE(sd.rev,0)::double precision AS revenue,
           COALESCE(sd.cogs_val,0)::double precision AS cogs,
           COALESCE(ed.exp_val,0)::double precision AS expenses,
           (COALESCE(sd.rev,0) - COALESCE(sd.cogs_val,0) - COALESCE(ed.exp_val,0))::double precision AS net
    FROM months m
    LEFT JOIN sales_data sd ON sd.month = to_char(m.month_start,'YYYY-MM')
    LEFT JOIN exp_data   ed ON ed.month = to_char(m.month_start,'YYYY-MM')
    ORDER BY m.month_start
    "#,
  )
  .bind(&date_from).bind(&date_to)
  .fetch_all(&pool).await
  .unwrap_or_default();

  let gross_profit = revenue - cogs;
  let gross_margin_pct = if revenue > 0.0 { gross_profit / revenue * 100.0 } else { 0.0 };
  let net_profit = gross_profit - total_expenses;

  Ok(ReportPnlResult { revenue, cogs, gross_profit, gross_margin_pct, total_expenses, net_profit, monthly_trend })
}

// ─── ABC Analysis (Phase F) ───────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportAbcRow {
  pub product_id: String,
  pub sku: String,
  pub name: String,
  pub category: String,
  pub revenue: f64,
  pub revenue_pct: f64,
  pub cum_pct: f64,
  pub abc_class: String,
}

#[tauri::command]
pub async fn report_abc_analysis(
  date_from: String,
  date_to: String,
) -> Result<Vec<ReportAbcRow>, String> {
  let pool = get_pool().await?;
  sqlx::query_as::<_, ReportAbcRow>(
    r#"
    WITH product_rev AS (
      SELECT p.id AS product_id, p.sku, p.name, p.category,
             COALESCE(SUM(sl."lineTotal"),0) AS revenue
      FROM "Product" p
      JOIN "SaleLine" sl ON sl."productId" = p.id
      JOIN "Sale"     s  ON s.id = sl."saleId"
      WHERE s."docDate"::date BETWEEN $1::date AND $2::date
      GROUP BY p.id, p.sku, p.name, p.category
      HAVING COALESCE(SUM(sl."lineTotal"),0) > 0
    ),
    total AS (SELECT SUM(revenue) AS grand FROM product_rev),
    ranked AS (
      SELECT *, revenue / NULLIF((SELECT grand FROM total),0) * 100 AS rev_pct,
             SUM(revenue) OVER (ORDER BY revenue DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
               / NULLIF((SELECT grand FROM total),0) * 100 AS cum_pct
      FROM product_rev
    )
    SELECT product_id, sku, name, category,
           revenue::double precision,
           rev_pct::double precision AS revenue_pct,
           cum_pct::double precision,
           CASE WHEN cum_pct <= 80 THEN 'A' WHEN cum_pct <= 95 THEN 'B' ELSE 'C' END AS abc_class
    FROM ranked
    ORDER BY revenue DESC
    "#,
  )
  .bind(&date_from).bind(&date_to)
  .fetch_all(&pool).await
  .map_err(|e| format!("report_abc_analysis: {e}"))
}

// ─── Dead Stock (Phase F) ─────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportDeadStockRow {
  pub product_id: String,
  pub sku: String,
  pub name: String,
  pub category: String,
  pub stock_qty: f64,
  pub cost_price: f64,
  pub tied_up_value: f64,
  pub last_movement: Option<String>,
  pub days_idle: Option<i32>,
}

#[tauri::command]
pub async fn report_dead_stock(days_threshold: Option<i32>) -> Result<Vec<ReportDeadStockRow>, String> {
  let pool = get_pool().await?;
  let days = days_threshold.unwrap_or(90);
  sqlx::query_as::<_, ReportDeadStockRow>(
    r#"
    SELECT p.id AS product_id, p.sku, p.name, p.category,
           COALESCE(SUM(sm."qtyDelta"),0)::double precision AS stock_qty,
           p."costPrice"::double precision AS cost_price,
           (COALESCE(SUM(sm."qtyDelta"),0) * p."costPrice")::double precision AS tied_up_value,
           to_char(MAX(sm."movementAt") AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD') AS last_movement,
           EXTRACT(DAYS FROM NOW() - MAX(sm."movementAt"))::int AS days_idle
    FROM "Product" p
    LEFT JOIN "StockMovement" sm ON sm."productId" = p.id
    WHERE p."isActive" = true
    GROUP BY p.id, p.sku, p.name, p.category, p."costPrice"
    HAVING COALESCE(SUM(sm."qtyDelta"),0) > 0
       AND (MAX(sm."movementAt") IS NULL
         OR MAX(sm."movementAt") < NOW() - ($1::int * INTERVAL '1 day'))
    ORDER BY days_idle DESC NULLS FIRST, tied_up_value DESC
    "#,
  )
  .bind(days)
  .fetch_all(&pool).await
  .map_err(|e| format!("report_dead_stock: {e}"))
}
