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
pub struct BudgetRow {
  pub id: String,
  pub category: String,
  pub monthly_amount: f64,
  pub branch_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct BudgetVsActualRow {
  pub category: String,
  pub budget: f64,
  pub actual: f64,
  pub pct: f64,
}

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn budget_list() -> Result<Vec<BudgetRow>, String> {
  let pool = get_pool().await?;
  sqlx::query_as::<_, BudgetRow>(
    r#"SELECT id, category, "monthlyAmount" AS monthly_amount, "branchId" AS branch_id
       FROM "ExpenseBudget" ORDER BY category"#,
  )
  .fetch_all(&pool).await
  .map_err(|e| format!("budget_list: {e}"))
}

#[tauri::command]
pub async fn budget_upsert(category: String, monthly_amount: f64) -> Result<String, String> {
  let pool = get_pool().await?;
  // UPDATE first; if nothing updated, INSERT
  let updated = sqlx::query_scalar::<_, String>(
    r#"UPDATE "ExpenseBudget" SET "monthlyAmount"=$2, "updatedAt"=now()
       WHERE category=$1 AND "branchId" IS NULL RETURNING id"#,
  )
  .bind(&category).bind(monthly_amount)
  .fetch_optional(&pool).await
  .map_err(|e| format!("budget_upsert update: {e}"))?;

  if let Some(id) = updated { return Ok(id); }

  let id = sqlx::query_scalar::<_, String>(
    r#"INSERT INTO "ExpenseBudget" (id, category, "monthlyAmount", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, now(), now())
       RETURNING id"#,
  )
  .bind(&category).bind(monthly_amount)
  .fetch_one(&pool).await
  .map_err(|e| format!("budget_upsert insert: {e}"))?;
  Ok(id)
}

#[tauri::command]
pub async fn budget_delete(id: String) -> Result<(), String> {
  let pool = get_pool().await?;
  sqlx::query(r#"DELETE FROM "ExpenseBudget" WHERE id=$1"#)
    .bind(&id).execute(&pool).await
    .map_err(|e| format!("budget_delete: {e}"))?;
  Ok(())
}

#[tauri::command]
pub async fn report_budget_vs_actual(year_month: String) -> Result<Vec<BudgetVsActualRow>, String> {
  let pool = get_pool().await?;
  sqlx::query_as::<_, BudgetVsActualRow>(
    r#"
    SELECT
      b.category,
      b."monthlyAmount"::double precision AS budget,
      COALESCE(SUM(e.amount), 0)::double precision AS actual,
      CASE WHEN b."monthlyAmount" > 0
           THEN COALESCE(SUM(e.amount),0) / b."monthlyAmount" * 100
           ELSE 0 END::double precision AS pct
    FROM "ExpenseBudget" b
    LEFT JOIN "Expense" e
      ON e.category = b.category
     AND to_char(e."expenseDate", 'YYYY-MM') = $1
     AND e.status != 'rejected'
    GROUP BY b.category, b."monthlyAmount"
    ORDER BY pct DESC
    "#,
  )
  .bind(&year_month)
  .fetch_all(&pool).await
  .map_err(|e| format!("report_budget_vs_actual: {e}"))
}
