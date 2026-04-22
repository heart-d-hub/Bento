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

#[tauri::command]
pub async fn products_master_load() -> Result<Vec<Value>, String> {
  let pool = get_pool().await?;
  let rows = sqlx::query_scalar::<_, Value>(
    r#"SELECT payload FROM "ProductMasterRow" ORDER BY COALESCE(payload->>'sku', '')"#,
  )
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("products_master_load failed: {e}"))?;
  Ok(rows)
}

#[tauri::command]
pub async fn products_master_replace_all(rows: Vec<Value>) -> Result<(), String> {
  let pool = get_pool().await?;
  let mut tx = pool.begin().await.map_err(|e| format!("begin tx failed: {e}"))?;

  sqlx::query(r#"DELETE FROM "ProductMasterRow""#)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("products_master_replace_all delete failed: {e}"))?;

  for v in rows {
    let id = v
      .get("id")
      .and_then(|x| x.as_str())
      .ok_or_else(|| "product master row missing id".to_string())?
      .to_string();
    let payload_str = serde_json::to_string(&v).map_err(|e| format!("serialize product {}: {e}", id))?;
    sqlx::query(
      r#"
      INSERT INTO "ProductMasterRow" (id, payload, "updatedAt")
      VALUES ($1, $2::jsonb, (now() AT TIME ZONE 'Asia/Bangkok'))
      ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, "updatedAt" = EXCLUDED."updatedAt"
      "#,
    )
    .bind(&id)
    .bind(payload_str)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("insert product master {} failed: {e}", id))?;
  }

  tx.commit().await.map_err(|e| format!("commit failed: {e}"))?;
  Ok(())
}

#[tauri::command]
pub async fn get_product_images_dir(app: tauri::AppHandle) -> Result<String, String> {
  use tauri::Manager;
  let dir = app
    .path()
    .app_local_data_dir()
    .map_err(|e| format!("app_local_data_dir failed: {e}"))?
    .join("product-images");
  std::fs::create_dir_all(&dir).map_err(|e| format!("create product-images dir failed: {e}"))?;
  Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn list_product_image_skus(
  app: tauri::AppHandle,
) -> Result<std::collections::HashMap<String, String>, String> {
  use tauri::Manager;
  let dir = app
    .path()
    .app_local_data_dir()
    .map_err(|e| format!("app_local_data_dir failed: {e}"))?
    .join("product-images");
  std::fs::create_dir_all(&dir).map_err(|e| format!("create product-images dir failed: {e}"))?;
  let mut map = std::collections::HashMap::new();
  const EXTS: &[&str] = &["jpg", "jpeg", "png", "webp", "gif"];
  for entry in std::fs::read_dir(&dir)
    .map_err(|e| format!("read product-images dir failed: {e}"))?
    .flatten()
  {
    let fname = entry.file_name().to_string_lossy().to_string();
    let lower = fname.to_lowercase();
    if let Some(dot) = lower.rfind('.') {
      let ext = &lower[dot + 1..];
      if EXTS.contains(&ext) {
        map.insert(lower[..dot].to_string(), fname);
      }
    }
  }
  Ok(map)
}
