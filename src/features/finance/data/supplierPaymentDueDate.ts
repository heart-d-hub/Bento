/**
 * คำนวณวันครบกำหนดชำระเจ้าหนี้แบบที่ใช้กันในค้าส่งอะไหล่ (ไทย)
 *
 * กติกาที่รองรับ (ค่าเริ่มต้น):
 * - **ตัดรอบบิลวันที่ 25** — รอบบัญชี = วันที่ 26 เดือนก่อน → 25 เดือนนี้ (รายการวันที่ 1–25 อยู่รอบที่ปิด 25 เดือนเดียวกัน;
 *   รายการวันที่ 26–สิ้นเดือน ไปอยู่รอบที่ปิด 25 เดือนถัดไป)
 * - **เริ่มนับเครดิตวันที่ 26** — นับจากวันรุ่งขึ้นหลังวันตัดรอบของรายการนั้น (เช่นตัด 25 ม.ค. → นับได้ตั้งแต่ 26 ม.ค.)
 * - **เครดิต 30 วัน ไม่รวมเดือนซื้อ** — ไม่เริ่มนับครบ 30 วันก่อนวันที่ 1 ของเดือนถัดจาก «เดือนปฏิทินของวันซื้อ/ใบรับ»
 *   (ใช้ร่วมกับวันที่ 26: เอาวันที่หลังสองเงื่อนไขที่ช้ากว่าเป็นจุดเริ่มนับ 30 วัน)
 * - **ชำระสิ้นเดือน** — ครบกำหนด = **วันสุดท้ายของเดือนปฏิทิน**ที่มีวันครบ 30 วันนับจากจุดเริ่ม
 *
 * หมายเหตุ: ซัพพลายแต่ละรายอาจตกลงต่างกัน — ปรับ `creditDays` / `statementCutoffDay` ในออบเจ็กต์ config ได้
 */

export type SupplierCreditDueConfig = {
  /** วันตัดรอบบิลของรอบนั้น (ค่าเริ่มต้น 25) */
  statementCutoffDay: number
  /** จำนวนวันเครดิตนับจากจุดเริ่ม (ค่าเริ่มต้น 30) */
  creditDays: number
  /** บวกเดือนปฏิทินหลังครบวันเครดิต (เช่น ตรงกับฟอร์มสมาชิก — เครดิตเดือน) */
  creditMonths: number
  /** ไม่เริ่มนับก่อนวันที่ 1 ของเดือนถัดจากเดือนของวันซื้อ */
  excludePurchaseMonth: boolean
  /** ครบกำหนดชำระที่สิ้นเดือนของเดือนที่ครบเครดิต */
  payAtEndOfDueMonth: boolean
}

export const DEFAULT_SUPPLIER_CREDIT: SupplierCreditDueConfig = {
  statementCutoffDay: 25,
  creditDays: 30,
  creditMonths: 0,
  excludePurchaseMonth: true,
  payAtEndOfDueMonth: true,
}

function startOfNextCalendarMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1)
}

/** วันปิดรอบบิล — หลังวันตัดรอบ (`cutoffDay` ของเดือน) อยู่รอบที่ปิดเดือนถัดไป */
export function statementClosingDate(purchaseDate: Date, cutoffDay: number = 25): Date {
  const y = purchaseDate.getFullYear()
  const m = purchaseDate.getMonth()
  const day = purchaseDate.getDate()
  const dim = daysInMonth(y, m)
  const c = Math.min(Math.max(1, Math.floor(cutoffDay)), dim)
  if (day > c) {
    return new Date(y, m + 1, Math.min(Math.floor(cutoffDay), daysInMonth(y, m + 1)))
  }
  return new Date(y, m, Math.min(Math.floor(cutoffDay), dim))
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function addCalendarDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
}

function addCalendarMonths(d: Date, months: number): Date {
  if (!months || months <= 0) return d
  return new Date(d.getFullYear(), d.getMonth() + months, d.getDate())
}

function endOfCalendarMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function maxDate(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b
}

/**
 * วันครบกำหนดชำระ (เฉพาะวันที่ในเวลาท้องถิ่น — ไม่มี timezone offset)
 */
export function supplierPayDueDate(
  purchaseDate: Date,
  config: Partial<SupplierCreditDueConfig> = {},
): Date {
  const c: SupplierCreditDueConfig = { ...DEFAULT_SUPPLIER_CREDIT, ...config }
  const close = statementClosingDate(purchaseDate, c.statementCutoffDay)
  const dayAfterClose = addCalendarDays(close, 1)

  let startCount = dayAfterClose
  if (c.excludePurchaseMonth) {
    const firstAfterPurchaseMonth = startOfNextCalendarMonth(purchaseDate)
    startCount = maxDate(dayAfterClose, firstAfterPurchaseMonth)
  }

  const afterDays = addCalendarDays(startCount, c.creditDays)
  const afterCredit = addCalendarMonths(afterDays, c.creditMonths ?? 0)
  if (c.payAtEndOfDueMonth) {
    return endOfCalendarMonth(afterCredit)
  }
  return afterCredit
}

/** ISO date YYYY-MM-DD (สำหรับเก็บ/แสดง) */
export function toIsoDateOnly(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function describeSupplierCreditRule(c: Partial<SupplierCreditDueConfig> = {}): string {
  const cfg = { ...DEFAULT_SUPPLIER_CREDIT, ...c }
  const co = Math.floor(cfg.statementCutoffDay)
  const nextAfterClose = co < 31 ? `หลังวันที่ ${co} ของเดือน` : 'งวดสิ้นเดือน'
  const months = cfg.creditMonths ?? 0
  const creditBit =
    months > 0
      ? `เครดิต ${cfg.creditDays} วัน + ${months} เดือน`
      : `เครดิต ${cfg.creditDays} วัน`
  return `ตัดรอบ ~วันที่ ${co} · ${nextAfterClose} · ${creditBit}${cfg.excludePurchaseMonth ? ' (ไม่รวมเดือนซื้อ/ขาย)' : ''}${cfg.payAtEndOfDueMonth ? ' · ชำระสิ้นเดือน' : ''}`
}
