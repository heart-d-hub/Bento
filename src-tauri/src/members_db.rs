use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, FromRow, PgPool};

static DB_POOL: OnceCell<PgPool> = OnceCell::new();

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct MemberPayload {
  pub id: String,
  pub member_code: String,
  pub full_name: String,
  pub address: String,
  pub tax_id: String,
  pub contact_person: String,
  pub email: String,
  pub phone: String,
  pub fax: String,
  pub sales_staff_id: String,
  pub credit_limit_baht: f64,
  pub credit_term_days: i32,
  pub credit_term_months: i32,
  pub pay_at_month_end: bool,
  pub cut_off_day_of_month: Option<i32>,
  pub default_price_tier: String,
  pub markup_percent: f64,
  pub price_start_date: String,
  pub price_end_date: String,
  pub item_tier_overrides: serde_json::Value,
  pub notes: String,
  pub member_type: String,
  pub status: String,
  pub default_branch: String,
  pub points_balance: f64,
  pub ar_balance: f64,
  pub created_at: String,
}

async fn get_pool() -> Result<PgPool, String> {
  if let Some(pool) = DB_POOL.get() {
    return Ok(pool.clone());
  }
  let url = std::env::var("DATABASE_URL").map_err(|_| "DATABASE_URL is not set".to_string())?;
  let pool = PgPoolOptions::new()
    .max_connections(5)
    .connect(&url)
    .await
    .map_err(|e| format!("connect postgres failed: {e}"))?;
  let _ = DB_POOL.set(pool.clone());
  Ok(pool)
}

#[tauri::command]
pub async fn members_load() -> Result<Vec<MemberPayload>, String> {
  let pool = get_pool().await?;
  let rows = sqlx::query_as::<_, MemberPayload>(
    r#"
    SELECT
      id,
      member_code,
      full_name,
      COALESCE(address, '') as address,
      COALESCE(tax_id, '') as tax_id,
      COALESCE(contact_person, '') as contact_person,
      COALESCE(email, '') as email,
      COALESCE(phone, '') as phone,
      COALESCE(fax, '') as fax,
      COALESCE(sales_staff_id, '') as sales_staff_id,
      credit_limit_baht,
      credit_term_days,
      credit_term_months,
      pay_at_month_end,
      cut_off_day_of_month,
      default_price_tier::text as default_price_tier,
      markup_percent,
      COALESCE(price_start_date, '') as price_start_date,
      COALESCE(price_end_date, '') as price_end_date,
      COALESCE(item_tier_overrides, '[]'::jsonb) as "item_tier_overrides!",
      COALESCE(notes, '') as notes,
      member_type,
      status::text as status,
      COALESCE(default_branch, '') as default_branch,
      points_balance,
      ar_balance,
      to_char(created_at, 'YYYY-MM-DD') as created_at
    FROM member
    ORDER BY created_at DESC
    "#
  )
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("members_load query failed: {e}"))?;
  Ok(rows)
}

#[tauri::command]
pub async fn members_save_all(members: Vec<MemberPayload>) -> Result<(), String> {
  let pool = get_pool().await?;
  let mut tx = pool.begin().await.map_err(|e| format!("begin tx failed: {e}"))?;

  sqlx::query("DELETE FROM member")
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("clear member table failed: {e}"))?;

  for m in members {
    sqlx::query(
      r#"
      INSERT INTO member (
        id, member_code, full_name, address, tax_id, contact_person, email, phone, fax, sales_staff_id,
        credit_limit_baht, credit_term_days, credit_term_months, pay_at_month_end, cut_off_day_of_month,
        default_price_tier, markup_percent, price_start_date, price_end_date, item_tier_overrides, notes,
        member_type, status, default_branch, points_balance, ar_balance, created_at, updated_at
      ) VALUES (
        $1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''), NULLIF($7, ''), NULLIF($8, ''), NULLIF($9, ''), NULLIF($10, ''),
        $11, $12, $13, $14, $15,
        $16::"PriceTier", $17, NULLIF($18, ''), NULLIF($19, ''), $20::jsonb, NULLIF($21, ''),
        $22, $23::"MemberStatus", NULLIF($24, ''), $25, $26, COALESCE(NULLIF($27, '')::date::timestamp, now()), now()
      )
      "#,
    )
    .bind(m.id)
    .bind(m.member_code)
    .bind(m.full_name)
    .bind(m.address)
    .bind(m.tax_id)
    .bind(m.contact_person)
    .bind(m.email)
    .bind(m.phone)
    .bind(m.fax)
    .bind(m.sales_staff_id)
    .bind(m.credit_limit_baht)
    .bind(m.credit_term_days)
    .bind(m.credit_term_months)
    .bind(m.pay_at_month_end)
    .bind(m.cut_off_day_of_month)
    .bind(m.default_price_tier)
    .bind(m.markup_percent)
    .bind(m.price_start_date)
    .bind(m.price_end_date)
    .bind(m.item_tier_overrides)
    .bind(m.notes)
    .bind(m.member_type)
    .bind(m.status)
    .bind(m.default_branch)
    .bind(m.points_balance)
    .bind(m.ar_balance)
    .bind(m.created_at)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("insert member {} failed: {e}", m.member_code))?;
  }

  tx.commit().await.map_err(|e| format!("commit tx failed: {e}"))?;
  Ok(())
}

