use once_cell::sync::OnceCell;
use serde_json::Value;
use sqlx::PgPool;

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

#[tauri::command]
pub async fn supplier_list() -> Result<Vec<Value>, String> {
  let pool = get_pool().await?;
  let rows = sqlx::query_scalar::<_, Value>(
    r#"SELECT payload FROM "SupplierRow" ORDER BY COALESCE(payload->>'name', '')"#,
  )
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("supplier_list failed: {e}"))?;
  Ok(rows)
}

#[tauri::command]
pub async fn supplier_upsert(payload: Value) -> Result<(), String> {
  let pool = get_pool().await?;
  let id = payload
    .get("id")
    .and_then(|x| x.as_str())
    .ok_or_else(|| "supplier payload missing id".to_string())?
    .to_string();
  let payload_str = serde_json::to_string(&payload).map_err(|e| format!("serialize supplier: {e}"))?;
  sqlx::query(
    r#"INSERT INTO "SupplierRow" (id, payload, "updatedAt")
       VALUES ($1, $2::jsonb, (now() AT TIME ZONE 'Asia/Bangkok'))
       ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, "updatedAt" = EXCLUDED."updatedAt""#,
  )
  .bind(&id)
  .bind(payload_str)
  .execute(&pool)
  .await
  .map_err(|e| format!("supplier_upsert failed: {e}"))?;
  Ok(())
}

#[tauri::command]
pub async fn supplier_delete(id: String) -> Result<(), String> {
  let pool = get_pool().await?;
  sqlx::query(r#"DELETE FROM "SupplierRow" WHERE id = $1"#)
    .bind(&id)
    .execute(&pool)
    .await
    .map_err(|e| format!("supplier_delete failed: {e}"))?;
  Ok(())
}
