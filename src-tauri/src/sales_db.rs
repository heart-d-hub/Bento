use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};

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

/// ตรวจว่าเชื่อม PostgreSQL ได้ (ใช้ DATABASE_URL จาก .env)
#[tauri::command]
pub async fn database_ping() -> Result<(), String> {
  let pool = get_pool().await?;
  sqlx::query_scalar::<_, i32>("SELECT 1")
    .fetch_one(&pool)
    .await
    .map_err(|e| format!("database ping failed: {e}"))?;
  Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleLinePayload {
  pub id: String,
  pub product_code: String,
  pub product_name: String,
  pub qty: f64,
  pub unit_label: String,
  pub unit_index: i32,
  pub unit_price: f64,
  pub discount: f64,
  pub line_total: f64,
  pub price_level_label: Option<String>,
  pub price_level_index: Option<i32>,
  pub price_tag_label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleCreatePayload {
  pub id: String,
  pub bill_no: String,
  pub tax_invoice_no: Option<String>,
  pub mode: String,
  pub payment_type: String,
  pub doc_date: String,
  pub subtotal: f64,
  pub bill_discount: f64,
  pub before_vat: f64,
  pub vat_amount: f64,
  pub rounding_adjust: f64,
  pub grand_total: f64,
  pub remark: Option<String>,
  pub branch_id: Option<String>,
  pub member_code: Option<String>,
  pub lines: Vec<SaleLinePayload>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleCreateResult {
  pub sale_id: String,
  pub bill_no: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct SalesByPaymentRow {
  pub payment_type: String,
  pub total_baht: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SalesDaySummaryResult {
  pub count: i64,
  pub total_baht: f64,
  pub by_payment: Vec<SalesByPaymentRow>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct SalesHistoryRow {
  pub id: String,
  pub bill_no: String,
  pub at: String,
  pub total: f64,
  pub payment_id: String,
  pub line_count: i64,
  pub lines: serde_json::Value,
}

#[tauri::command]
pub async fn sales_create(payload: SaleCreatePayload) -> Result<SaleCreateResult, String> {
  let pool = get_pool().await?;
  let mut tx = pool.begin().await.map_err(|e| format!("begin tx failed: {e}"))?;

  let member_id: Option<String> = if let Some(code) = payload.member_code.as_ref().map(|s| s.trim()).filter(|s| !s.is_empty()) {
    sqlx::query_scalar::<_, String>(r#"SELECT id FROM "Member" WHERE "memberCode" = $1 LIMIT 1"#)
      .bind(code)
      .fetch_optional(&mut *tx)
      .await
      .map_err(|e| format!("resolve member failed: {e}"))?
  } else {
    None
  };

  sqlx::query(
    r#"
    INSERT INTO "Sale" (
      id, "billNo", "taxInvoiceNo", mode, "paymentType", "docDate",
      subtotal, "billDiscount", "beforeVat", "vatAmount", "roundingAdjust", "grandTotal",
      remark, "branchId", "memberId", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, NULLIF($3, ''), $4::"SaleMode", $5::"SalePaymentType", COALESCE(NULLIF($6, '')::date::timestamp, (now() AT TIME ZONE 'Asia/Bangkok')),
      $7, $8, $9, $10, $11, $12,
      NULLIF($13, ''), NULLIF($14, ''), $15, (now() AT TIME ZONE 'Asia/Bangkok'), (now() AT TIME ZONE 'Asia/Bangkok')
    )
    "#,
  )
  .bind(payload.id.clone())
  .bind(payload.bill_no.clone())
  .bind(payload.tax_invoice_no.clone().unwrap_or_default())
  .bind(payload.mode.clone())
  .bind(payload.payment_type.clone())
  .bind(payload.doc_date.clone())
  .bind(payload.subtotal)
  .bind(payload.bill_discount)
  .bind(payload.before_vat)
  .bind(payload.vat_amount)
  .bind(payload.rounding_adjust)
  .bind(payload.grand_total)
  .bind(payload.remark.clone().unwrap_or_default())
  .bind(payload.branch_id.clone().unwrap_or_default())
  .bind(member_id)
  .execute(&mut *tx)
  .await
  .map_err(|e| format!("insert sale failed: {e}"))?;

  for line in &payload.lines {
    let product_id = sqlx::query_scalar::<_, String>(
      r#"
      INSERT INTO "Product" (
        id, sku, name, category, "isActive", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, 'ทั่วไป', true, (now() AT TIME ZONE 'Asia/Bangkok'), (now() AT TIME ZONE 'Asia/Bangkok')
      )
      ON CONFLICT (sku) DO UPDATE SET
        name = EXCLUDED.name,
        "updatedAt" = (now() AT TIME ZONE 'Asia/Bangkok')
      RETURNING id
      "#,
    )
    .bind(format!("prod-{}", line.product_code))
    .bind(line.product_code.clone())
    .bind(line.product_name.clone())
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| format!("ensure product {} failed: {e}", line.product_code))?;

    sqlx::query(
      r#"
      INSERT INTO "SaleLine" (
        id, qty, "unitLabel", "unitIndex", "unitPrice", discount, "lineTotal",
        "priceLevelLabel", "priceLevelIndex", "priceTagLabel", "createdAt", "saleId", "productId"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        NULLIF($8, ''), $9, NULLIF($10, ''), (now() AT TIME ZONE 'Asia/Bangkok'), $11, $12
      )
      "#,
    )
    .bind(line.id.clone())
    .bind(line.qty)
    .bind(line.unit_label.clone())
    .bind(line.unit_index)
    .bind(line.unit_price)
    .bind(line.discount)
    .bind(line.line_total)
    .bind(line.price_level_label.clone().unwrap_or_default())
    .bind(line.price_level_index)
    .bind(line.price_tag_label.clone().unwrap_or_default())
    .bind(payload.id.clone())
    .bind(product_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("insert sale line {} failed: {e}", line.id))?;
  }

  tx.commit().await.map_err(|e| format!("commit tx failed: {e}"))?;
  Ok(SaleCreateResult {
    sale_id: payload.id,
    bill_no: payload.bill_no,
  })
}

#[tauri::command]
pub async fn sales_day_summary(doc_date: Option<String>) -> Result<SalesDaySummaryResult, String> {
  let pool = get_pool().await?;
  let date_arg = doc_date.unwrap_or_default();

  let row = sqlx::query_as::<_, (i64, f64)>(
    r#"
    SELECT
      COUNT(*)::bigint as count,
      COALESCE(SUM("grandTotal"), 0)::double precision as total_baht
    FROM "Sale"
    WHERE "docDate"::date = COALESCE(NULLIF($1, '')::date, CURRENT_DATE)
    "#,
  )
  .bind(date_arg.clone())
  .fetch_one(&pool)
  .await
  .map_err(|e| format!("query sales summary failed: {e}"))?;

  let by_payment = sqlx::query_as::<_, SalesByPaymentRow>(
    r#"
    SELECT
      "paymentType"::text as payment_type,
      COALESCE(SUM("grandTotal"), 0)::double precision as total_baht
    FROM "Sale"
    WHERE "docDate"::date = COALESCE(NULLIF($1, '')::date, CURRENT_DATE)
    GROUP BY "paymentType"
    ORDER BY total_baht DESC
    "#,
  )
  .bind(date_arg)
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("query sales by payment failed: {e}"))?;

  Ok(SalesDaySummaryResult {
    count: row.0,
    total_baht: row.1,
    by_payment,
  })
}

#[tauri::command]
pub async fn sales_history_list(limit: Option<i64>) -> Result<Vec<SalesHistoryRow>, String> {
  let pool = get_pool().await?;
  let lim = limit.unwrap_or(200).clamp(1, 1000);
  let rows = sqlx::query_as::<_, SalesHistoryRow>(
    r#"
    SELECT
      s.id,
      s."billNo" as bill_no,
      to_char(s."docDate", 'YYYY-MM-DD"T"HH24:MI:SS') as at,
      s."grandTotal" as total,
      s."paymentType"::text as payment_id,
      COUNT(sl.id)::bigint as line_count,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'productId', p.id,
            'sku', p.sku,
            'name', p.name,
            'qty', sl.qty,
            'unitPrice', sl."unitPrice"
          )
        ) FILTER (WHERE sl.id IS NOT NULL),
        '[]'::jsonb
      ) as lines
    FROM "Sale" s
    LEFT JOIN "SaleLine" sl ON sl."saleId" = s.id
    LEFT JOIN "Product" p ON p.id = sl."productId"
    GROUP BY s.id
    ORDER BY s."docDate" DESC, s."createdAt" DESC
    LIMIT $1
    "#,
  )
  .bind(lim)
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("query sales history failed: {e}"))?;
  Ok(rows)
}

#[tauri::command]
pub async fn sales_get_by_bill_no(bill_no: String) -> Result<Option<SalesHistoryRow>, String> {
  let pool = get_pool().await?;
  let row = sqlx::query_as::<_, SalesHistoryRow>(
    r#"
    SELECT
      s.id,
      s."billNo" as bill_no,
      to_char(s."docDate", 'YYYY-MM-DD"T"HH24:MI:SS') as at,
      s."grandTotal" as total,
      s."paymentType"::text as payment_id,
      COUNT(sl.id)::bigint as line_count,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'productId', p.id,
            'sku', p.sku,
            'name', p.name,
            'qty', sl.qty,
            'unitPrice', sl."unitPrice"
          )
        ) FILTER (WHERE sl.id IS NOT NULL),
        '[]'::jsonb
      ) as lines
    FROM "Sale" s
    LEFT JOIN "SaleLine" sl ON sl."saleId" = s.id
    LEFT JOIN "Product" p ON p.id = sl."productId"
    WHERE s."billNo" = $1
    GROUP BY s.id
    LIMIT 1
    "#,
  )
  .bind(bill_no)
  .fetch_optional(&pool)
  .await
  .map_err(|e| format!("query sale by bill no failed: {e}"))?;
  Ok(row)
}

#[tauri::command]
pub async fn sales_history_by_member(member_code: String, limit: Option<i64>) -> Result<Vec<SalesHistoryRow>, String> {
  let pool = get_pool().await?;
  let lim = limit.unwrap_or(5).clamp(1, 50);
  let rows = sqlx::query_as::<_, SalesHistoryRow>(
    r#"
    SELECT
      s.id,
      s."billNo" as bill_no,
      to_char(s."docDate", 'YYYY-MM-DD"T"HH24:MI:SS') as at,
      s."grandTotal" as total,
      s."paymentType"::text as payment_id,
      COUNT(sl.id)::bigint as line_count,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'productId', p.id,
            'sku', p.sku,
            'name', p.name,
            'qty', sl.qty,
            'unitPrice', sl."unitPrice"
          )
        ) FILTER (WHERE sl.id IS NOT NULL),
        '[]'::jsonb
      ) as lines
    FROM "Sale" s
    JOIN "Member" m ON m.id = s."memberId"
    LEFT JOIN "SaleLine" sl ON sl."saleId" = s.id
    LEFT JOIN "Product" p ON p.id = sl."productId"
    WHERE m."memberCode" = $1
    GROUP BY s.id
    ORDER BY s."docDate" DESC, s."createdAt" DESC
    LIMIT $2
    "#,
  )
  .bind(member_code)
  .bind(lim)
  .fetch_all(&pool)
  .await
  .map_err(|e| format!("query sales by member failed: {e}"))?;
  Ok(rows)
}

// --- POS bill / tax invoice sequence (Postgres, แทน localStorage) ---

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PosBillSeqPayload {
  pub kind: String,
  pub doc_date: String,
  pub machine: i32,
  pub branch_id: Option<String>,
}

fn branch_letter(branch_id: Option<&str>) -> char {
  match branch_id.map(str::trim).filter(|s| !s.is_empty()) {
    Some("somneuk") => 'S',
    _ => 'A',
  }
}

fn parse_doc_date_yyyy_mm_dd(s: &str) -> Result<(i32, u32), String> {
  let t = s.trim();
  if t.len() != 10 || t.as_bytes().get(4) != Some(&b'-') || t.as_bytes().get(7) != Some(&b'-') {
    return Err(format!("invalid docDate (expected YYYY-MM-DD): {t}"));
  }
  let y: i32 = t[0..4]
    .parse()
    .map_err(|_| format!("invalid year in docDate: {t}"))?;
  let mo: u32 = t[5..7]
    .parse()
    .map_err(|_| format!("invalid month in docDate: {t}"))?;
  if !(1..=12).contains(&mo) {
    return Err(format!("invalid month in docDate: {t}"));
  }
  Ok((y, mo))
}

fn buddhist_era_year_last2_digits(gregorian_year: i32) -> i32 {
  let be = gregorian_year + 543;
  be.rem_euclid(100)
}

fn retail_storage_key(machine: i32, letter: char, yy: i32, mm: u32) -> String {
  // ตรงกับ localStorage key เดิม: `${machine}-P-${L}-${yy}-${mm}` (yy ไม่ pad ใน key)
  format!("{machine}-P-{letter}-{yy}-{mm:02}")
}

fn tax_machine_prefix(letter: char, machine: i32) -> String {
  let digit = machine.clamp(1, 9);
  format!("{letter}{digit}")
}

fn tax_storage_key(prefix: &str, yy: i32, mm: u32) -> String {
  format!("{prefix}-{yy}-{mm:02}")
}

fn format_retail_bill(machine: i32, letter: char, yy: i32, mm: u32, seq: i32) -> String {
  format!("{machine}P{letter}{yy:02}{mm:02}{seq:04}")
}

fn format_tax_bill(prefix: &str, yy: i32, mm: u32, seq: i32) -> String {
  format!("{prefix}{yy:02}{mm:02}{seq:04}")
}

struct ResolvedPosBillSeq {
  key: String,
  kind: String,
  yy: i32,
  mm: u32,
  machine: i32,
  letter: char,
  tax_prefix: Option<String>,
}

fn resolve_pos_bill_seq(p: &PosBillSeqPayload) -> Result<ResolvedPosBillSeq, String> {
  let kind = p.kind.trim().to_ascii_lowercase();
  if kind != "retail" && kind != "tax" {
    return Err(format!("pos bill kind must be retail or tax, got {}", p.kind));
  }
  let (gy, mm) = parse_doc_date_yyyy_mm_dd(&p.doc_date)?;
  let yy = buddhist_era_year_last2_digits(gy);
  let letter = branch_letter(p.branch_id.as_deref());
  let machine = p.machine.clamp(1, 99);
  if kind == "retail" {
    let key = retail_storage_key(machine, letter, yy, mm);
    return Ok(ResolvedPosBillSeq {
      key,
      kind,
      yy,
      mm,
      machine,
      letter,
      tax_prefix: None,
    });
  }
  let prefix = tax_machine_prefix(letter, machine);
  let key = tax_storage_key(&prefix, yy, mm);
  Ok(ResolvedPosBillSeq {
    key,
    kind,
    yy,
    mm,
    machine,
    letter,
    tax_prefix: Some(prefix),
  })
}

async fn pos_bill_next_seq(pool: &PgPool, key: &str) -> Result<i32, String> {
  let seq: i32 = sqlx::query_scalar(
    r#"
    INSERT INTO "PosBillSequenceCounter" (id, "lastSeq", "updatedAt")
    VALUES ($1, 1, (now() AT TIME ZONE 'Asia/Bangkok'))
    ON CONFLICT (id) DO UPDATE SET
      "lastSeq" = "PosBillSequenceCounter"."lastSeq" + 1,
      "updatedAt" = (now() AT TIME ZONE 'Asia/Bangkok')
    RETURNING "lastSeq"
    "#,
  )
  .bind(key)
  .fetch_one(pool)
  .await
  .map_err(|e| format!("pos bill sequence bump failed: {e}"))?;
  Ok(seq)
}

async fn pos_bill_peek_seq(pool: &PgPool, key: &str) -> Result<i32, String> {
  let prev: Option<i32> = sqlx::query_scalar(r#"SELECT "lastSeq" FROM "PosBillSequenceCounter" WHERE id = $1"#)
    .bind(key)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("pos bill sequence peek failed: {e}"))?;
  Ok(prev.map(|v| v + 1).unwrap_or(1))
}

/// เลขบิล/ใบกำกับถัดไป (ยังไม่เพิ่มลำดับใน DB)
#[tauri::command]
pub async fn pos_bill_peek_next(payload: PosBillSeqPayload) -> Result<String, String> {
  let pool = get_pool().await?;
  let r = resolve_pos_bill_seq(&payload)?;
  let seq = pos_bill_peek_seq(&pool, &r.key).await?;
  if r.kind == "retail" {
    return Ok(format_retail_bill(r.machine, r.letter, r.yy, r.mm, seq));
  }
  let prefix = r.tax_prefix.ok_or_else(|| "tax prefix missing".to_string())?;
  Ok(format_tax_bill(&prefix, r.yy, r.mm, seq))
}

/// เพิ่มลำดับใน DB แล้วคืนเลขที่จัดรูปแบบแล้ว
#[tauri::command]
pub async fn pos_bill_next(payload: PosBillSeqPayload) -> Result<String, String> {
  let pool = get_pool().await?;
  let r = resolve_pos_bill_seq(&payload)?;
  let seq = pos_bill_next_seq(&pool, &r.key).await?;
  if r.kind == "retail" {
    return Ok(format_retail_bill(r.machine, r.letter, r.yy, r.mm, seq));
  }
  let prefix = r.tax_prefix.ok_or_else(|| "tax prefix missing".to_string())?;
  Ok(format_tax_bill(&prefix, r.yy, r.mm, seq))
}
