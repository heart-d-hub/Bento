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
pub struct ExpenseRow {
  pub id: String,
  pub expense_date: String,
  pub category: String,
  pub amount: f64,
  pub note: Option<String>,
  pub payee: Option<String>,
  pub payment_method: String,
  pub branch_id: Option<String>,
  pub is_recurring: bool,
  pub recurring_interval: Option<String>,
  pub status: String,
  pub approved_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpenseCreatePayload {
  pub expense_date: String,
  pub category: String,
  pub amount: f64,
  pub note: Option<String>,
  pub payee: Option<String>,
  pub payment_method: String,
  pub branch_id: Option<String>,
  pub is_recurring: Option<bool>,
  pub recurring_interval: Option<String>,
  pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ExpenseCategoryRow {
  pub category: String,
  pub total: f64,
  pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ExpenseMonthRow {
  pub month: String,
  pub total: f64,
  pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportExpensesResult {
  pub total: f64,
  pub count: i64,
  pub avg_per_entry: f64,
  pub by_category: Vec<ExpenseCategoryRow>,
  pub monthly_trend: Vec<ExpenseMonthRow>,
  pub items: Vec<ExpenseRow>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ExpenseCategoryComparison {
  pub category: String,
  pub current: f64,
  pub previous: f64,
  pub change_pct: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpenseComparisonResult {
  pub current_month: String,
  pub previous_month: String,
  pub current_total: f64,
  pub previous_total: f64,
  pub by_category: Vec<ExpenseCategoryComparison>,
}

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn expense_create(payload: ExpenseCreatePayload) -> Result<String, String> {
  let pool = get_pool().await?;
  let is_recurring = payload.is_recurring.unwrap_or(false);
  let status = payload.status.clone().unwrap_or_else(|| "approved".into());
  let id = sqlx::query_scalar::<_, String>(
    r#"
    INSERT INTO "Expense" (id, "expenseDate", category, amount, note, payee, "paymentMethod",
                           "branchId", "isRecurring", "recurringInterval", status,
                           "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, $1::date, $2, $3, NULLIF($4,''), NULLIF($5,''), $6,
            NULLIF($7,''), $8, NULLIF($9,''), $10,
            now() AT TIME ZONE 'Asia/Bangkok', now() AT TIME ZONE 'Asia/Bangkok')
    RETURNING id
    "#,
  )
  .bind(&payload.expense_date)
  .bind(&payload.category)
  .bind(payload.amount)
  .bind(payload.note.clone().unwrap_or_default())
  .bind(payload.payee.clone().unwrap_or_default())
  .bind(&payload.payment_method)
  .bind(payload.branch_id.clone().unwrap_or_default())
  .bind(is_recurring)
  .bind(payload.recurring_interval.clone().unwrap_or_default())
  .bind(&status)
  .fetch_one(&pool).await
  .map_err(|e| format!("expense_create: {e}"))?;
  Ok(id)
}

#[tauri::command]
pub async fn expense_list(
  date_from: String,
  date_to: String,
  category: Option<String>,
) -> Result<Vec<ExpenseRow>, String> {
  let pool = get_pool().await?;
  sqlx::query_as::<_, ExpenseRow>(
    r#"
    SELECT id, to_char("expenseDate",'YYYY-MM-DD') AS expense_date,
           category, amount, note, payee, "paymentMethod" AS payment_method,
           "branchId" AS branch_id, "isRecurring" AS is_recurring,
           "recurringInterval" AS recurring_interval, status,
           "approvedBy" AS approved_by
    FROM "Expense"
    WHERE "expenseDate" BETWEEN $1::date AND $2::date
      AND ($3::text IS NULL OR category = $3)
    ORDER BY "expenseDate" DESC, "createdAt" DESC
    "#,
  )
  .bind(&date_from).bind(&date_to).bind(&category)
  .fetch_all(&pool).await
  .map_err(|e| format!("expense_list: {e}"))
}

#[tauri::command]
pub async fn expense_update(
  id: String,
  expense_date: String,
  category: String,
  amount: f64,
  note: Option<String>,
  payee: Option<String>,
  payment_method: String,
  is_recurring: Option<bool>,
  recurring_interval: Option<String>,
) -> Result<(), String> {
  let pool = get_pool().await?;
  sqlx::query(
    r#"UPDATE "Expense"
       SET "expenseDate"=$1::date, category=$2, amount=$3,
           note=NULLIF($4,''), payee=NULLIF($5,''), "paymentMethod"=$6,
           "isRecurring"=$7, "recurringInterval"=NULLIF($8,''),
           "updatedAt"=now() AT TIME ZONE 'Asia/Bangkok'
       WHERE id=$9"#,
  )
  .bind(&expense_date).bind(&category).bind(amount)
  .bind(note.unwrap_or_default()).bind(payee.unwrap_or_default())
  .bind(&payment_method)
  .bind(is_recurring.unwrap_or(false))
  .bind(recurring_interval.unwrap_or_default())
  .bind(&id)
  .execute(&pool).await
  .map_err(|e| format!("expense_update: {e}"))?;
  Ok(())
}

#[tauri::command]
pub async fn expense_delete(id: String) -> Result<(), String> {
  let pool = get_pool().await?;
  sqlx::query(r#"DELETE FROM "Expense" WHERE id=$1"#)
    .bind(&id).execute(&pool).await
    .map_err(|e| format!("expense_delete: {e}"))?;
  Ok(())
}

#[tauri::command]
pub async fn expense_approve(id: String, approved_by: String) -> Result<(), String> {
  let pool = get_pool().await?;
  sqlx::query(
    r#"UPDATE "Expense" SET status='approved', "approvedBy"=$1,
       "updatedAt"=now() AT TIME ZONE 'Asia/Bangkok' WHERE id=$2"#,
  )
  .bind(&approved_by).bind(&id).execute(&pool).await
  .map_err(|e| format!("expense_approve: {e}"))?;
  Ok(())
}

#[tauri::command]
pub async fn expense_reject(id: String) -> Result<(), String> {
  let pool = get_pool().await?;
  sqlx::query(
    r#"UPDATE "Expense" SET status='rejected', "approvedBy"=NULL,
       "updatedAt"=now() AT TIME ZONE 'Asia/Bangkok' WHERE id=$1"#,
  )
  .bind(&id).execute(&pool).await
  .map_err(|e| format!("expense_reject: {e}"))?;
  Ok(())
}

#[tauri::command]
pub async fn report_expenses(
  date_from: String,
  date_to: String,
  category: Option<String>,
) -> Result<ReportExpensesResult, String> {
  let pool = get_pool().await?;

  let (total, count): (f64, i64) = sqlx::query_as::<_, (f64, i64)>(
    r#"SELECT COALESCE(SUM(amount),0)::double precision, COUNT(*)::bigint
       FROM "Expense"
       WHERE "expenseDate" BETWEEN $1::date AND $2::date
         AND ($3::text IS NULL OR category = $3)
         AND status != 'rejected'"#,
  )
  .bind(&date_from).bind(&date_to).bind(&category)
  .fetch_one(&pool).await.map_err(|e| format!("expense totals: {e}"))?;

  let by_category = sqlx::query_as::<_, ExpenseCategoryRow>(
    r#"SELECT category, COALESCE(SUM(amount),0)::double precision AS total, COUNT(*)::bigint AS count
       FROM "Expense"
       WHERE "expenseDate" BETWEEN $1::date AND $2::date
         AND ($3::text IS NULL OR category = $3) AND status != 'rejected'
       GROUP BY category ORDER BY total DESC"#,
  )
  .bind(&date_from).bind(&date_to).bind(&category)
  .fetch_all(&pool).await.map_err(|e| format!("expense by_category: {e}"))?;

  let monthly_trend = sqlx::query_as::<_, ExpenseMonthRow>(
    r#"SELECT to_char("expenseDate",'YYYY-MM') AS month,
              COALESCE(SUM(amount),0)::double precision AS total,
              COUNT(*)::bigint AS count
       FROM "Expense"
       WHERE "expenseDate" BETWEEN $1::date AND $2::date
         AND ($3::text IS NULL OR category = $3) AND status != 'rejected'
       GROUP BY to_char("expenseDate",'YYYY-MM') ORDER BY month"#,
  )
  .bind(&date_from).bind(&date_to).bind(&category)
  .fetch_all(&pool).await.map_err(|e| format!("expense monthly_trend: {e}"))?;

  let items = sqlx::query_as::<_, ExpenseRow>(
    r#"SELECT id, to_char("expenseDate",'YYYY-MM-DD') AS expense_date,
              category, amount, note, payee, "paymentMethod" AS payment_method,
              "branchId" AS branch_id, "isRecurring" AS is_recurring,
              "recurringInterval" AS recurring_interval, status,
              "approvedBy" AS approved_by
       FROM "Expense"
       WHERE "expenseDate" BETWEEN $1::date AND $2::date
         AND ($3::text IS NULL OR category = $3)
       ORDER BY "expenseDate" DESC, "createdAt" DESC"#,
  )
  .bind(&date_from).bind(&date_to).bind(&category)
  .fetch_all(&pool).await.map_err(|e| format!("expense items: {e}"))?;

  let avg_per_entry = if count > 0 { total / count as f64 } else { 0.0 };
  Ok(ReportExpensesResult { total, count, avg_per_entry, by_category, monthly_trend, items })
}

#[tauri::command]
pub async fn report_expense_comparison(year_month: String) -> Result<ExpenseComparisonResult, String> {
  let pool = get_pool().await?;
  let parts: Vec<&str> = year_month.split('-').collect();
  if parts.len() != 2 { return Err("invalid year_month format (expect YYYY-MM)".into()); }
  let year: i32 = parts[0].parse().map_err(|_| "invalid year".to_string())?;
  let month: i32 = parts[1].parse().map_err(|_| "invalid month".to_string())?;
  let (prev_year, prev_month) = if month == 1 { (year - 1, 12) } else { (year, month - 1) };
  let prev_ym = format!("{:04}-{:02}", prev_year, prev_month);

  let (current_total,): (f64,) = sqlx::query_as::<_, (f64,)>(
    r#"SELECT COALESCE(SUM(amount),0)::double precision FROM "Expense"
       WHERE to_char("expenseDate",'YYYY-MM')=$1 AND status!='rejected'"#,
  ).bind(&year_month).fetch_one(&pool).await.map_err(|e| format!("current_total: {e}"))?;

  let (previous_total,): (f64,) = sqlx::query_as::<_, (f64,)>(
    r#"SELECT COALESCE(SUM(amount),0)::double precision FROM "Expense"
       WHERE to_char("expenseDate",'YYYY-MM')=$1 AND status!='rejected'"#,
  ).bind(&prev_ym).fetch_one(&pool).await.map_err(|e| format!("previous_total: {e}"))?;

  let by_category = sqlx::query_as::<_, ExpenseCategoryComparison>(
    r#"
    WITH cur AS (
      SELECT category, COALESCE(SUM(amount),0) AS total
      FROM "Expense" WHERE to_char("expenseDate",'YYYY-MM')=$1 AND status!='rejected'
      GROUP BY category
    ), prev AS (
      SELECT category, COALESCE(SUM(amount),0) AS total
      FROM "Expense" WHERE to_char("expenseDate",'YYYY-MM')=$2 AND status!='rejected'
      GROUP BY category
    )
    SELECT
      COALESCE(cur.category, prev.category) AS category,
      COALESCE(cur.total, 0)::double precision AS current,
      COALESCE(prev.total, 0)::double precision AS previous,
      CASE WHEN COALESCE(prev.total,0) > 0
           THEN (COALESCE(cur.total,0) - COALESCE(prev.total,0)) / prev.total * 100
           ELSE 0 END::double precision AS change_pct
    FROM cur FULL OUTER JOIN prev USING (category)
    ORDER BY COALESCE(cur.total, 0) DESC
    "#,
  ).bind(&year_month).bind(&prev_ym)
  .fetch_all(&pool).await.map_err(|e| format!("by_category: {e}"))?;

  Ok(ExpenseComparisonResult {
    current_month: year_month,
    previous_month: prev_ym,
    current_total,
    previous_total,
    by_category,
  })
}
