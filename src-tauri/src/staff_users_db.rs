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
    CREATE TABLE IF NOT EXISTS "StaffUserRow" (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Bangkok')
    )
    "#,
  )
  .execute(pool)
  .await
  .map_err(|e| format!("ensure StaffUserRow table failed: {e}"))?;
  Ok(())
}

#[tauri::command]
pub async fn staff_users_load() -> Result<Vec<Value>, String> {
  let pool = get_pool().await?;
  ensure_table(&pool).await?;
  let rows = sqlx::query_scalar::<_, Value>(
    r#"SELECT payload FROM "StaffUserRow" ORDER BY COALESCE(payload->>'username', '')"#,
  )
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("staff_users_load failed: {e}"))?;
  Ok(rows)
}

#[tauri::command]
pub async fn staff_users_replace_all(rows: Vec<Value>) -> Result<(), String> {
  let pool = get_pool().await?;
  ensure_table(&pool).await?;
  let mut tx = pool.begin().await.map_err(|e| format!("begin tx failed: {e}"))?;

  sqlx::query(r#"DELETE FROM "StaffUserRow""#)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("staff_users_replace_all delete failed: {e}"))?;

  for v in rows {
    let id = v
      .get("id")
      .and_then(|x| x.as_str())
      .ok_or_else(|| "staff user row missing id".to_string())?
      .to_string();
    let payload_str = serde_json::to_string(&v).map_err(|e| format!("serialize staff user {}: {e}", id))?;
    sqlx::query(
      r#"
      INSERT INTO "StaffUserRow" (id, payload, "updatedAt")
      VALUES ($1, $2::jsonb, (now() AT TIME ZONE 'Asia/Bangkok'))
      "#,
    )
    .bind(&id)
    .bind(payload_str)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("insert staff user {} failed: {e}", id))?;
  }

  tx.commit().await.map_err(|e| format!("commit failed: {e}"))?;
  Ok(())
}
