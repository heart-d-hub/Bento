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
pub async fn open_product_images_dir(app: tauri::AppHandle) -> Result<(), String> {
  use tauri::Manager;
  let dir = app
    .path()
    .app_local_data_dir()
    .map_err(|e| format!("app_local_data_dir failed: {e}"))?
    .join("product-images");
  std::fs::create_dir_all(&dir).map_err(|e| format!("create product-images dir failed: {e}"))?;
  #[cfg(target_os = "windows")]
  {
    std::process::Command::new("explorer")
      .arg(dir.to_str().unwrap_or(""))
      .spawn()
      .map_err(|e| format!("open explorer failed: {e}"))?;
  }
  #[cfg(target_os = "macos")]
  {
    std::process::Command::new("open")
      .arg(dir.to_str().unwrap_or(""))
      .spawn()
      .map_err(|e| format!("open finder failed: {e}"))?;
  }
  #[cfg(target_os = "linux")]
  {
    std::process::Command::new("xdg-open")
      .arg(dir.to_str().unwrap_or(""))
      .spawn()
      .map_err(|e| format!("open file manager failed: {e}"))?;
  }
  Ok(())
}

#[tauri::command]
pub async fn get_product_image_b64(
  app: tauri::AppHandle,
  sku: String,
) -> Result<Option<String>, String> {
  use base64::{engine::general_purpose::STANDARD, Engine};
  use tauri::Manager;
  let dir = app
    .path()
    .app_local_data_dir()
    .map_err(|e| format!("app_local_data_dir failed: {e}"))?
    .join("product-images");
  if !dir.exists() {
    return Ok(None);
  }
  const EXTS: &[(&str, &str)] = &[
    ("jpg", "image/jpeg"),
    ("jpeg", "image/jpeg"),
    ("png", "image/png"),
    ("webp", "image/webp"),
    ("gif", "image/gif"),
  ];
  let sku_lower = sku.trim().to_lowercase();
  let entries = std::fs::read_dir(&dir).map_err(|e| format!("read dir failed: {e}"))?;
  for entry in entries.flatten() {
    let fname = entry.file_name().to_string_lossy().to_string();
    let lower = fname.to_lowercase();
    if let Some(dot) = lower.rfind('.') {
      let stem = &lower[..dot];
      let ext = &lower[dot + 1..];
      if stem == sku_lower.as_str() {
        if let Some((_, mime)) = EXTS.iter().find(|(e, _)| *e == ext) {
          let bytes = std::fs::read(entry.path()).map_err(|e| format!("read file failed: {e}"))?;
          return Ok(Some(format!("data:{};base64,{}", mime, STANDARD.encode(&bytes))));
        }
      }
    }
  }
  Ok(None)
}

#[tauri::command]
pub async fn get_product_images_b64(
  app: tauri::AppHandle,
  sku: String,
) -> Result<Vec<String>, String> {
  use base64::{engine::general_purpose::STANDARD, Engine};
  use tauri::Manager;
  let dir = app
    .path()
    .app_local_data_dir()
    .map_err(|e| format!("app_local_data_dir failed: {e}"))?
    .join("product-images");
  if !dir.exists() {
    return Ok(vec![]);
  }
  let sku_lower = sku.trim().to_lowercase();
  const EXTS: &[(&str, &str)] = &[
    ("jpg", "image/jpeg"),
    ("jpeg", "image/jpeg"),
    ("png", "image/png"),
    ("webp", "image/webp"),
    ("gif", "image/gif"),
  ];

  // Build map: lowercase stem → (path, mime)
  let mut file_map: std::collections::HashMap<String, (std::path::PathBuf, String)> =
    std::collections::HashMap::new();
  if let Ok(rd) = std::fs::read_dir(&dir) {
    for entry in rd.flatten() {
      let path = entry.path();
      let fname = entry.file_name().to_string_lossy().to_lowercase();
      if let Some(dot) = fname.rfind('.') {
        let stem = fname[..dot].to_string();
        let ext = fname[dot + 1..].to_string();
        if let Some((_, mime)) = EXTS.iter().find(|(e, _)| *e == ext.as_str()) {
          file_map.insert(stem, (path, mime.to_string()));
        }
      }
    }
  }

  let mut results: Vec<String> = Vec::new();
  // Slot 1: bare sku, fallback sku_1
  let slot1_stems = [sku_lower.clone(), format!("{}_1", sku_lower)];
  'slot1: for stem in &slot1_stems {
    if let Some((path, mime)) = file_map.get(stem) {
      if let Ok(bytes) = std::fs::read(path) {
        results.push(format!("data:{};base64,{}", mime, STANDARD.encode(&bytes)));
        break 'slot1;
      }
    }
  }
  // Slots 2–4
  for n in 2u8..=4 {
    let stem = format!("{}_{}", sku_lower, n);
    if let Some((path, mime)) = file_map.get(&stem) {
      if let Ok(bytes) = std::fs::read(path) {
        results.push(format!("data:{};base64,{}", mime, STANDARD.encode(&bytes)));
      }
    }
  }
  Ok(results)
}

fn delete_slot_files(dir: &std::path::Path, sku_lower: &str, slot: u8) {
  const EXTS: &[&str] = &["jpg", "jpeg", "png", "webp", "gif"];
  let stems: Vec<String> = if slot == 1 {
    vec![sku_lower.to_string(), format!("{}_1", sku_lower)]
  } else {
    vec![format!("{}_{}", sku_lower, slot)]
  };
  for stem in &stems {
    for ext in EXTS {
      let _ = std::fs::remove_file(dir.join(format!("{}.{}", stem, ext)));
    }
  }
}

#[tauri::command]
pub async fn save_product_image_from_path(
  app: tauri::AppHandle,
  sku: String,
  slot: u8,
  src_path: String,
) -> Result<(), String> {
  use tauri::Manager;
  let dir = app
    .path()
    .app_local_data_dir()
    .map_err(|e| format!("app_local_data_dir failed: {e}"))?
    .join("product-images");
  std::fs::create_dir_all(&dir).map_err(|e| format!("create dir failed: {e}"))?;

  let src = std::path::Path::new(&src_path);
  let ext = src
    .extension()
    .and_then(|e| e.to_str())
    .unwrap_or("jpg")
    .to_lowercase();
  const ALLOWED: &[&str] = &["jpg", "jpeg", "png", "webp", "gif"];
  if !ALLOWED.contains(&ext.as_str()) {
    return Err(format!("unsupported image extension: {}", ext));
  }

  let sku_lower = sku.trim().to_lowercase();
  delete_slot_files(&dir, &sku_lower, slot);

  let dest_name = if slot == 1 {
    format!("{}.{}", sku_lower, ext)
  } else {
    format!("{}_{}.{}", sku_lower, slot, ext)
  };
  std::fs::copy(&src_path, dir.join(&dest_name))
    .map_err(|e| format!("copy image failed: {e}"))?;
  Ok(())
}

#[tauri::command]
pub async fn delete_product_image(
  app: tauri::AppHandle,
  sku: String,
  slot: u8,
) -> Result<(), String> {
  use tauri::Manager;
  let dir = app
    .path()
    .app_local_data_dir()
    .map_err(|e| format!("app_local_data_dir failed: {e}"))?
    .join("product-images");
  if dir.exists() {
    delete_slot_files(&dir, &sku.trim().to_lowercase(), slot);
  }
  Ok(())
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
