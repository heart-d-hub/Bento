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
pub struct VendorRow {
  pub id: String,
  pub name: String,
  pub bank_name: Option<String>,
  pub bank_account: Option<String>,
  pub contact_name: Option<String>,
  pub phone: Option<String>,
  pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct VendorSpendingRow {
  pub payee: String,
  pub total: f64,
  pub count: i64,
  pub last_date: Option<String>,
}

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn vendor_list() -> Result<Vec<VendorRow>, String> {
  let pool = get_pool().await?;
  sqlx::query_as::<_, VendorRow>(
    r#"SELECT id, name, "bankName" AS bank_name, "bankAccount" AS bank_account,
              "contactName" AS contact_name, phone, note
       FROM "Vendor" ORDER BY name"#,
  )
  .fetch_all(&pool).await
  .map_err(|e| format!("vendor_list: {e}"))
}

#[tauri::command]
pub async fn vendor_create(
  name: String,
  bank_name: Option<String>,
  bank_account: Option<String>,
  contact_name: Option<String>,
  phone: Option<String>,
  note: Option<String>,
) -> Result<String, String> {
  let pool = get_pool().await?;
  let id = sqlx::query_scalar::<_, String>(
    r#"INSERT INTO "Vendor" (id, name, "bankName", "bankAccount", "contactName", phone, note,
                             "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, NULLIF($2,''), NULLIF($3,''),
               NULLIF($4,''), NULLIF($5,''), NULLIF($6,''), now(), now())
       RETURNING id"#,
  )
  .bind(&name)
  .bind(bank_name.unwrap_or_default())
  .bind(bank_account.unwrap_or_default())
  .bind(contact_name.unwrap_or_default())
  .bind(phone.unwrap_or_default())
  .bind(note.unwrap_or_default())
  .fetch_one(&pool).await
  .map_err(|e| format!("vendor_create: {e}"))?;
  Ok(id)
}

#[tauri::command]
pub async fn vendor_update(
  id: String,
  name: String,
  bank_name: Option<String>,
  bank_account: Option<String>,
  contact_name: Option<String>,
  phone: Option<String>,
  note: Option<String>,
) -> Result<(), String> {
  let pool = get_pool().await?;
  sqlx::query(
    r#"UPDATE "Vendor" SET name=$1, "bankName"=NULLIF($2,''), "bankAccount"=NULLIF($3,''),
       "contactName"=NULLIF($4,''), phone=NULLIF($5,''), note=NULLIF($6,''),
       "updatedAt"=now() WHERE id=$7"#,
  )
  .bind(&name)
  .bind(bank_name.unwrap_or_default())
  .bind(bank_account.unwrap_or_default())
  .bind(contact_name.unwrap_or_default())
  .bind(phone.unwrap_or_default())
  .bind(note.unwrap_or_default())
  .bind(&id)
  .execute(&pool).await
  .map_err(|e| format!("vendor_update: {e}"))?;
  Ok(())
}

#[tauri::command]
pub async fn vendor_delete(id: String) -> Result<(), String> {
  let pool = get_pool().await?;
  sqlx::query(r#"DELETE FROM "Vendor" WHERE id=$1"#)
    .bind(&id).execute(&pool).await
    .map_err(|e| format!("vendor_delete: {e}"))?;
  Ok(())
}

#[tauri::command]
pub async fn vendor_spending(date_from: String, date_to: String) -> Result<Vec<VendorSpendingRow>, String> {
  let pool = get_pool().await?;
  sqlx::query_as::<_, VendorSpendingRow>(
    r#"SELECT
         COALESCE(payee, '(ไม่ระบุ)') AS payee,
         SUM(amount)::double precision AS total,
         COUNT(*)::bigint AS count,
         to_char(MAX("expenseDate"), 'YYYY-MM-DD') AS last_date
       FROM "Expense"
       WHERE "expenseDate" BETWEEN $1::date AND $2::date
         AND status != 'rejected'
       GROUP BY COALESCE(payee, '(ไม่ระบุ)')
       ORDER BY total DESC
       LIMIT 50"#,
  )
  .bind(&date_from).bind(&date_to)
  .fetch_all(&pool).await
  .map_err(|e| format!("vendor_spending: {e}"))
}
