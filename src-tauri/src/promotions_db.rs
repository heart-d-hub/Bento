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

fn validate_kind(kind: &str) -> Result<(), String> {
  match kind {
    "buyQty" | "percentOff" | "secondPiece" => Ok(()),
    _ => Err(format!("invalid promotions kind: {kind}")),
  }
}

/// โหลดโปรโมชั่นตาม kind: 'buyQty' | 'percentOff' | 'secondPiece'
#[tauri::command]
pub async fn promotions_load(kind: String) -> Result<Vec<Value>, String> {
  validate_kind(&kind)?;
  let pool = get_pool().await?;
  let row = sqlx::query_scalar::<_, Value>(
    r#"SELECT payload FROM "PromotionsSnapshot" WHERE id = $1"#,
  )
  .bind(&kind)
  .fetch_optional(&pool)
  .await
  .map_err(|e| format!("promotions_load failed: {e}"))?;

  match row {
    Some(v) => {
      if let Some(arr) = v.as_array() {
        Ok(arr.clone())
      } else {
        Ok(vec![])
      }
    }
    None => Ok(vec![]),
  }
}

/// บันทึกโปรโมชั่นทั้งหมดของ kind (replace all)
#[tauri::command]
pub async fn promotions_save(kind: String, rows: Vec<Value>) -> Result<(), String> {
  validate_kind(&kind)?;
  let pool = get_pool().await?;
  let payload = Value::Array(rows);
  let payload_str = serde_json::to_string(&payload).map_err(|e| format!("serialize promotions: {e}"))?;
  sqlx::query(
    r#"INSERT INTO "PromotionsSnapshot" (id, payload, "updatedAt")
       VALUES ($1, $2::jsonb, (now() AT TIME ZONE 'Asia/Bangkok'))
       ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, "updatedAt" = EXCLUDED."updatedAt""#,
  )
  .bind(&kind)
  .bind(payload_str)
  .execute(&pool)
  .await
  .map_err(|e| format!("promotions_save failed: {e}"))?;
  Ok(())
}
