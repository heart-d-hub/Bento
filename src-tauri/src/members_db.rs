use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};

static DB_POOL: OnceCell<PgPool> = OnceCell::new();

fn normalize_branch_id(raw: &str) -> Option<String> {
  let t = raw.trim();
  if t.is_empty() {
    return None;
  }
  match t {
    "somneuk" | "ang" => Some(t.to_string()),
    "สาขา 1" => Some("somneuk".to_string()),
    "สาขา 2" => Some("ang".to_string()),
    _ => None,
  }
}

async fn ensure_default_branches(pool: &PgPool) -> Result<(), String> {
  sqlx::query(
    r#"
    INSERT INTO "Branch" ("id", "code", "name", "isActive", "createdAt", "updatedAt")
    VALUES
      ('somneuk', 'SOM', 'สมนึกอะไหล่', true, (now() AT TIME ZONE 'Asia/Bangkok'), (now() AT TIME ZONE 'Asia/Bangkok')),
      ('ang', 'ANG', 'อังอะไหล่', true, (now() AT TIME ZONE 'Asia/Bangkok'), (now() AT TIME ZONE 'Asia/Bangkok'))
    ON CONFLICT ("id") DO UPDATE SET
      "code" = EXCLUDED."code",
      "name" = EXCLUDED."name",
      "isActive" = EXCLUDED."isActive",
      "updatedAt" = (now() AT TIME ZONE 'Asia/Bangkok')
    "#,
  )
  .execute(pool)
  .await
  .map_err(|e| format!("ensure default branches failed: {e}"))?;
  Ok(())
}

async fn upsert_member(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, m: &MemberPayload) -> Result<(), String> {
  let normalized_branch_id = normalize_branch_id(&m.branch_id);
  sqlx::query(
    r#"
    INSERT INTO "Member" (
      id, "memberCode", "fullName", address, "taxId", "contactPerson", email, phone, fax, "salesStaffId",
      "creditLimitBaht", "creditTermDays", "creditTermMonths", "payAtMonthEnd", "cutOffDayOfMonth",
      "defaultPriceTier", "markupPercent", "priceStartDate", "priceEndDate", "itemTierOverrides", notes,
      "memberType", status, "branchId", "pointsBalance", "arBalance", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''), NULLIF($7, ''), NULLIF($8, ''), NULLIF($9, ''), NULLIF($10, ''),
      $11, $12, $13, $14, $15,
      $16::"PriceTier", $17, NULLIF($18, ''), NULLIF($19, ''), $20::jsonb, NULLIF($21, ''),
      $22, $23::"MemberStatus", NULLIF($24, ''), $25, $26, COALESCE(NULLIF($27, '')::date::timestamp, (now() AT TIME ZONE 'Asia/Bangkok')), (now() AT TIME ZONE 'Asia/Bangkok')
    )
    ON CONFLICT (id) DO UPDATE SET
      "memberCode" = EXCLUDED."memberCode",
      "fullName" = EXCLUDED."fullName",
      address = EXCLUDED.address,
      "taxId" = EXCLUDED."taxId",
      "contactPerson" = EXCLUDED."contactPerson",
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      fax = EXCLUDED.fax,
      "salesStaffId" = EXCLUDED."salesStaffId",
      "creditLimitBaht" = EXCLUDED."creditLimitBaht",
      "creditTermDays" = EXCLUDED."creditTermDays",
      "creditTermMonths" = EXCLUDED."creditTermMonths",
      "payAtMonthEnd" = EXCLUDED."payAtMonthEnd",
      "cutOffDayOfMonth" = EXCLUDED."cutOffDayOfMonth",
      "defaultPriceTier" = EXCLUDED."defaultPriceTier",
      "markupPercent" = EXCLUDED."markupPercent",
      "priceStartDate" = EXCLUDED."priceStartDate",
      "priceEndDate" = EXCLUDED."priceEndDate",
      "itemTierOverrides" = EXCLUDED."itemTierOverrides",
      notes = EXCLUDED.notes,
      "memberType" = EXCLUDED."memberType",
      status = EXCLUDED.status,
      "branchId" = EXCLUDED."branchId",
      "pointsBalance" = EXCLUDED."pointsBalance",
      "arBalance" = EXCLUDED."arBalance",
      "updatedAt" = (now() AT TIME ZONE 'Asia/Bangkok')
    "#,
  )
  .bind(m.id.clone())
  .bind(m.member_code.clone())
  .bind(m.full_name.clone())
  .bind(m.address.clone())
  .bind(m.tax_id.clone())
  .bind(m.contact_person.clone())
  .bind(m.email.clone())
  .bind(m.phone.clone())
  .bind(m.fax.clone())
  .bind(m.sales_staff_id.clone())
  .bind(m.credit_limit_baht)
  .bind(m.credit_term_days)
  .bind(m.credit_term_months)
  .bind(m.pay_at_month_end)
  .bind(m.cut_off_day_of_month)
  .bind(m.default_price_tier.clone())
  .bind(m.markup_percent)
  .bind(m.price_start_date.clone())
  .bind(m.price_end_date.clone())
  .bind(m.item_tier_overrides.clone())
  .bind(m.notes.clone())
  .bind(m.member_type.clone())
  .bind(m.status.clone())
  .bind(normalized_branch_id)
  .bind(m.points_balance)
  .bind(m.ar_balance)
  .bind(m.created_at.clone())
  .execute(&mut **tx)
  .await
  .map_err(|e| format!("upsert member {} failed: {e}", m.member_code))?;
  Ok(())
}

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
  pub branch_id: String,
  pub points_balance: f64,
  pub ar_balance: f64,
  pub created_at: String,
}

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
pub async fn members_load() -> Result<Vec<MemberPayload>, String> {
  let pool = get_pool().await?;
  ensure_default_branches(&pool).await?;
  let rows = sqlx::query_as::<_, MemberPayload>(
    r#"
    SELECT
      id,
      "memberCode" as member_code,
      "fullName" as full_name,
      COALESCE(address, '') as address,
      COALESCE("taxId", '') as tax_id,
      COALESCE("contactPerson", '') as contact_person,
      COALESCE(email, '') as email,
      COALESCE(phone, '') as phone,
      COALESCE(fax, '') as fax,
      COALESCE("salesStaffId", '') as sales_staff_id,
      "creditLimitBaht" as credit_limit_baht,
      "creditTermDays" as credit_term_days,
      "creditTermMonths" as credit_term_months,
      "payAtMonthEnd" as pay_at_month_end,
      "cutOffDayOfMonth" as cut_off_day_of_month,
      "defaultPriceTier"::text as default_price_tier,
      "markupPercent" as markup_percent,
      COALESCE("priceStartDate", '') as price_start_date,
      COALESCE("priceEndDate", '') as price_end_date,
      COALESCE("itemTierOverrides", '[]'::jsonb) as item_tier_overrides,
      COALESCE(notes, '') as notes,
      "memberType" as member_type,
      status::text as status,
      COALESCE("branchId", '') as branch_id,
      "pointsBalance" as points_balance,
      "arBalance" as ar_balance,
      to_char("createdAt", 'YYYY-MM-DD') as created_at
    FROM "Member"
    ORDER BY "createdAt" DESC
    "#
  )
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("members_load query failed: {e}"))?;
  Ok(rows)
}

#[tauri::command]
pub async fn members_upsert(member: MemberPayload) -> Result<(), String> {
  let pool = get_pool().await?;
  ensure_default_branches(&pool).await?;
  let mut tx = pool.begin().await.map_err(|e| format!("begin tx failed: {e}"))?;
  upsert_member(&mut tx, &member).await?;
  tx.commit().await.map_err(|e| format!("commit tx failed: {e}"))?;
  Ok(())
}

#[tauri::command]
pub async fn members_delete(member_id: String) -> Result<(), String> {
  let pool = get_pool().await?;
  sqlx::query(r#"DELETE FROM "Member" WHERE id = $1"#)
    .bind(member_id)
    .execute(&pool)
    .await
    .map_err(|e| format!("delete member failed: {e}"))?;
  Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct MemberArRow {
  pub id: String,
  pub member_code: String,
  pub full_name: String,
  pub phone: String,
  pub ar_balance: f64,
  pub credit_limit_baht: f64,
  pub branch_id: String,
  pub last_sale_at: Option<String>,
}

#[tauri::command]
pub async fn member_ar_list() -> Result<Vec<MemberArRow>, String> {
  let pool = get_pool().await?;
  let rows = sqlx::query_as::<_, MemberArRow>(
    r#"
    SELECT
      m.id,
      m."memberCode"        AS member_code,
      m."fullName"          AS full_name,
      COALESCE(m.phone, '') AS phone,
      m."arBalance"         AS ar_balance,
      m."creditLimitBaht"   AS credit_limit_baht,
      COALESCE(m."branchId", '') AS branch_id,
      to_char(MAX(s."docDate"), 'YYYY-MM-DD') AS last_sale_at
    FROM "Member" m
    LEFT JOIN "Sale" s ON s."memberId" = m.id AND s."voidedAt" IS NULL
    WHERE m."arBalance" > 0.001
    GROUP BY m.id, m."memberCode", m."fullName", m.phone, m."arBalance", m."creditLimitBaht", m."branchId"
    ORDER BY m."arBalance" DESC
    "#,
  )
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("member_ar_list failed: {e}"))?;
  Ok(rows)
}

#[tauri::command]
pub async fn member_receive_payment(member_id: String, amount: f64, note: String) -> Result<(), String> {
  if amount <= 0.0 {
    return Err("amount must be positive".to_string());
  }
  let pool = get_pool().await?;
  let rows = sqlx::query(
    r#"UPDATE "Member"
       SET "arBalance" = GREATEST(0, "arBalance" - $1),
           "updatedAt" = now() AT TIME ZONE 'Asia/Bangkok'
       WHERE id = $2"#,
  )
  .bind(amount)
  .bind(&member_id)
  .execute(&pool)
  .await
  .map_err(|e| format!("member_receive_payment failed: {e}"))?;
  if rows.rows_affected() == 0 {
    return Err(format!("member not found: {member_id}"));
  }
  let _ = note; // reserved for future audit log
  Ok(())
}

