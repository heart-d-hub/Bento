/**
 * ป้ายช่องมิติ + จำนวนช่องที่แสดง — จากรายการ «มิติ» ต่อหมวด (paperFields)
 * - 0 ชื่อ → ใช้ป้ายแคตตาล็อกเต็ม 3 ช่อง
 * - 1 ชื่อ → 3 ช่อง แต่กำหนดป้ายช่องแรก (A) อย่างเดียว
 * - 2 ชื่อ → แสดงแค่ 2 ช่อง (B/กว้าง · C/สูง/หนา ในโมเดล) = หน่วยวัด 2 อย่าง
 * - 3 ชื่อ → A · B · C
 */

export type PaperDimSlotCount = 0 | 1 | 2 | 3

export type PaperDimLayout = {
  slotCount: PaperDimSlotCount
  a: string
  b: string
  c: string
}

export const DEFAULT_DIMENSION_LABELS_CATALOG = {
  a: 'A/รูใน(ID)',
  b: 'B/กว้าง',
  c: 'C/สูง/หนา',
} as const

function cleanLabel(s: string) {
  return s.trim().replace(/\s+/g, ' ')
}

export function dimLayoutFromPaperFields(fields: { label: string }[] | undefined): PaperDimLayout {
  const raw = (fields ?? []).map((f) => cleanLabel(f.label)).filter(Boolean)
  const d = DEFAULT_DIMENSION_LABELS_CATALOG
  if (raw.length === 0) {
    return { slotCount: 0, ...d }
  }
  if (raw.length === 1) {
    return { slotCount: 1, a: raw[0], b: d.b, c: d.c }
  }
  if (raw.length === 2) {
    return { slotCount: 2, a: d.a, b: raw[0], c: raw[1] }
  }
  return {
    slotCount: 3,
    a: raw[0] ?? d.a,
    b: raw[1] ?? d.b,
    c: raw[2] ?? d.c,
  }
}
