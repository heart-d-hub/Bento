use once_cell::sync::OnceCell;
use serde_json::Value;
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

async fn ensure_table(pool: &PgPool) -> Result<(), String> {
  sqlx::query(
    r#"
    CREATE TABLE IF NOT EXISTS "InventoryCategoryTreeRow" (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Bangkok')
    )
    "#,
  )
  .execute(pool)
  .await
  .map_err(|e| format!("ensure InventoryCategoryTreeRow table failed: {e}"))?;
  Ok(())
}

#[tauri::command]
pub async fn inventory_categories_load() -> Result<Option<Value>, String> {
  let pool = get_pool().await?;
  ensure_table(&pool).await?;
  let row = sqlx::query_scalar::<_, Value>(r#"SELECT payload FROM "InventoryCategoryTreeRow" WHERE id='main'"#)
    .fetch_optional(&pool)
    .await
    .map_err(|e| format!("inventory_categories_load failed: {e}"))?;
  Ok(row)
}

#[tauri::command]
pub async fn inventory_categories_replace_all(payload: Value) -> Result<(), String> {
  let pool = get_pool().await?;
  ensure_table(&pool).await?;
  sqlx::query(
    r#"
    INSERT INTO "InventoryCategoryTreeRow" (id, payload, "updatedAt")
    VALUES ('main', $1::jsonb, (now() AT TIME ZONE 'Asia/Bangkok'))
    ON CONFLICT (id)
    DO UPDATE SET payload = EXCLUDED.payload, "updatedAt" = EXCLUDED."updatedAt"
    "#,
  )
  .bind(serde_json::to_string(&payload).map_err(|e| format!("serialize category tree: {e}"))?)
  .execute(&pool)
  .await
  .map_err(|e| format!("inventory_categories_replace_all failed: {e}"))?;
  Ok(())
}
