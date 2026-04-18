/** ค่า YYYY-MM-DD ตาม timezone ของเบราว์เซอร์ — ให้ตรงกับ date input / วันที่บิล */
export function localDateYYYYMMDD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** แปลงจากค่า date input YYYY-MM-DD → Date เวลาเที่ยงวันใน timezone ท้องถิ่น */
export function parseLocalYYYYMMDD(s: string): Date {
  const t = s.trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t)
  if (!m) return new Date()
  const y = parseInt(m[1], 10)
  const mo = parseInt(m[2], 10)
  const d = parseInt(m[3], 10)
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return new Date()
  return new Date(y, mo - 1, d)
}
