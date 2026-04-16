/**
 * ป้ายช่องมิติ + จำนวนช่องที่แสดง — จากรายการ «มิติ» ต่อหมวด (paperFields)
 * - 0 ชื่อ → ใช้ป้ายแคตตาล็อกเต็ม 4 ช่อง
 * - 1 ชื่อ → 4 ช่อง แต่กำหนดป้ายช่องแรก (A) อย่างเดียว
 * - 2 ชื่อ → แสดงแค่ 2 ช่อง (B/กว้าง · C/สูง/หนา ในโมเดล) = หน่วยวัด 2 อย่าง
 * - 3 ชื่อ → A · B · C (ไม่มี A₂)
 * - 4 ชื่อ → A · A₂ · B · C (ลำดับในรายการ = A, B, C, A₂)
 */

export type PaperDimSlotCount = 0 | 1 | 2 | 3 | 4

export type PaperDimLayout = {
  slotCount: PaperDimSlotCount
  a: string
  a2: string
  b: string
  c: string
  showA2ByCategory: boolean
}

export const DEFAULT_DIMENSION_LABELS_CATALOG = {
  a: 'A/รูใน(ID1)',
  a2: 'A₁/ID2(ไม่บังคับ)',
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
    return { slotCount: 0, ...d, showA2ByCategory: true }
  }
  if (raw.length === 1) {
    return {
      slotCount: 1,
      a: raw[0],
      b: d.b,
      c: d.c,
      a2: d.a2,
      showA2ByCategory: true,
    }
  }
  if (raw.length === 2) {
    return {
      slotCount: 2,
      a: d.a,
      a2: d.a2,
      b: raw[0],
      c: raw[1],
      showA2ByCategory: false,
    }
  }
  if (raw.length === 3) {
    return {
      slotCount: 3,
      a: raw[0],
      b: raw[1],
      c: raw[2],
      a2: d.a2,
      showA2ByCategory: false,
    }
  }
  return {
    slotCount: 4,
    a: raw[0] ?? d.a,
    b: raw[1] ?? d.b,
    c: raw[2] ?? d.c,
    a2: raw[3] ?? d.a2,
    showA2ByCategory: Boolean(raw[3]),
  }
}
