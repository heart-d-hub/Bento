/**
 * ความหนาแน่นของป้าย (ชื่อเรียกเดิมของร้าน) ↔ ขนาดมม. ต่อหนึ่งช่องที่พิมพ์
 *
 * ฐาน **2×1 = 50×35 มม.** — 2×2 และ 2×4 คือการแบ่งครึ่งจากฐานนี้:
 * - 2×2 → ครึ่งกว้าง → 25×35
 * - 2×4 → ครึ่งกว้าง + ครึ่งสูง → 25×17.5
 */
export type LabelDesignerDensityPreset = {
  id: '2x1' | '2x2' | '2x4'
  label: string
  widthMm: number
  heightMm: number
  shortHint: string
}

export const LABEL_DESIGNER_DENSITY_PRESETS: readonly LabelDesignerDensityPreset[] = [
  {
    id: '2x1',
    label: '2×1',
    widthMm: 50,
    heightMm: 35,
    shortHint: '50×35 มม. — ฐานเต็ม',
  },
  {
    id: '2x2',
    label: '2×2',
    widthMm: 25,
    heightMm: 35,
    shortHint: '25×35 มม. — แบ่งครึ่งกว้างจาก 2×1',
  },
  {
    id: '2x4',
    label: '2×4',
    widthMm: 25,
    heightMm: 17.5,
    shortHint: '25×17.5 มม. — แบ่งครึ่งกว้างและสูงจาก 2×1',
  },
] as const

/** ดวงสติ๊กเกอร์จริง 50×35 มม. — ใส่ป้าย 2×4 ได้ 4 อันต่อดวง */
export const COMPOSITE_2X4_PHYSICAL_WIDTH_MM = 50
export const COMPOSITE_2X4_PHYSICAL_HEIGHT_MM = 35
export const COMPOSITE_2X4_SLOTS_PER_STICKER = 4

/** แม่แบบขนาด 2×4 (ช่องย่อย 25×17.5) → ตอนพิมพ์รวม 4 รายการต่อดวง 50×35 */
export function isComposite2x4StickerTemplate(t: { widthMm: number; heightMm: number }): boolean {
  const p = LABEL_DESIGNER_DENSITY_PRESETS.find((x) => x.id === '2x4')
  if (!p) return false
  return (
    Math.abs(t.widthMm - p.widthMm) < 0.75 &&
    Math.abs(t.heightMm - p.heightMm) < 0.55
  )
}
