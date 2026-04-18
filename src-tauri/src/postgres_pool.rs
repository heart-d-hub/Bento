use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

/// ตั้ง `TimeZone` ของ session เป็นไทย (ช่วย query ทั่วไป)
///
/// การ **เขียน** `timestamp without time zone` ใช้ `(now() AT TIME ZONE 'Asia/Bangkok')` ใน SQL
/// โดยตรง — ไม่ขึ้นกับ session
pub async fn connect_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
  PgPoolOptions::new()
    .max_connections(5)
    .after_connect(|conn, _meta| {
      Box::pin(async move {
        sqlx::query(r#"SET TIME ZONE 'Asia/Bangkok'"#)
          .execute(&mut *conn)
          .await?;
        Ok(())
      })
    })
    .connect(database_url)
    .await
}
