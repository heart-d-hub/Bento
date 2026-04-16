import {
  COMPOSITE_2X4_PHYSICAL_HEIGHT_MM,
  COMPOSITE_2X4_PHYSICAL_WIDTH_MM,
} from '@/features/inventory/data/labelDesignerDensityPresets'

/**
 * ขนาดกระดาษ/ม้วนสำหรับป้ายบาร์โค้ด (มม.)
 * อ้างอิงเครื่อง: TSC TTP-244 Pro — ปรับค่าที่นี่ถ้าเปลี่ยนม้วน ขอบจริง หรือรุ่นเครื่อง
 */
/** รุ่นเครื่องที่ใช้จูนข้อความแนะนำในกล่องสั่งพิมพ์ */
export const LABEL_PRINT_REFERENCE_PRINTER_MODEL = 'TSC TTP-244 Pro'

export const LABEL_PRINT_SHEET_WIDTH_MM = 104

export const LABEL_PRINT_MARGIN_LEFT_MM = 2
export const LABEL_PRINT_MARGIN_RIGHT_MM = 2
export const LABEL_PRINT_MARGIN_TOP_MM = 1
export const LABEL_PRINT_MARGIN_BOTTOM_MM = 0.5

/** ระยะห่างแนวตั้งระหว่างแถวสติ๊กเกอร์ (มม.) — ปรับตามระยะตัดจริง */
const DEFAULT_ROW_GAP_MM = 2

export function labelPrintContentWidthMm(): number {
  return (
    LABEL_PRINT_SHEET_WIDTH_MM - LABEL_PRINT_MARGIN_LEFT_MM - LABEL_PRINT_MARGIN_RIGHT_MM
  )
}

/**
 * จำนวนแถวป้ายต่อหน้าพิมพ์ — ตั้งที่นี่ถ้าต้องการหลายแถวบนม้วน (ค่าเริ่ม 1 = แบบ 2×1 ที่ป้าย 50 มม.)
 */
export const DESIGNER_PRINT_SHEET_ROWS_DEFAULT = 1

const MAX_AUTO_SHEET_COLS = 8

/**
 * คำนวณจำนวนคอลัมน์ที่วางได้ในความกว้างพื้นที่พิมพ์ (เรียงซ้าย → ขวา แล้วขึ้นแถวใหม่เมื่อแถวเต็ม)
 * เช่น พื้นที่ 100 มม. + แม่แบบกว้าง 50 มม. → 2 คอลัมน์
 */
export function computeAutoSheetCols(cellWidthMm: number): number {
  const contentW = labelPrintContentWidthMm()
  const w = Math.max(0.1, cellWidthMm)
  const n = Math.floor(contentW / w)
  return Math.max(1, Math.min(MAX_AUTO_SHEET_COLS, n))
}

/**
 * ระยะห่างคอลัมน์คำนวณให้พอดีความกว้างพื้นที่พิมพ์
 * (เช่น สติ๊กเกอร์ 50+50 ใน 100 มม. → ช่องว่าง 0)
 */
export function computeLabelGridGapsMm(
  cols: number,
  rows: number,
  cellWidthMm: number,
): { colGapMm: number; rowGapMm: number } {
  const contentW = labelPrintContentWidthMm()
  let colGapMm = 0
  if (cols > 1) {
    const slack = contentW - cols * cellWidthMm
    colGapMm = Math.max(0, slack / (cols - 1))
  }
  const rowGapMm = rows > 1 ? DEFAULT_ROW_GAP_MM : 0
  return { colGapMm, rowGapMm }
}

export function labelPrintPageBodyHeightMm(
  rows: number,
  cellHeightMm: number,
  rowGapMm: number,
): number {
  if (rows < 1) return 0
  return rows * cellHeightMm + (rows > 1 ? (rows - 1) * rowGapMm : 0)
}

/** ความสูงรวมของหน้า (ขอบบน + กริด + ขอบล่าง) */
export function labelPrintPageTotalHeightMm(
  rows: number,
  cellHeightMm: number,
  rowGapMm: number,
): number {
  return (
    LABEL_PRINT_MARGIN_TOP_MM +
    labelPrintPageBodyHeightMm(rows, cellHeightMm, rowGapMm) +
    LABEL_PRINT_MARGIN_BOTTOM_MM
  )
}

/** ขนาดหน้า CSS @page ให้ตรงกับหนึ่งแผ่นพิมพ์ในแอป (ลดการย่อ/ขยายผิดจาก size: … auto) */
export type LabelPrintPageBoxInput = {
  printLayout: 'simple' | 'composite2x4'
  templateWidthMm: number
  templateHeightMm: number
  sheetCols: number
  sheetRows: number
}

export function labelPrintPageBoxMm(input: LabelPrintPageBoxInput): {
  widthMm: number
  heightMm: number
} {
  const cols = Math.max(1, input.sheetCols)
  const rows = Math.max(1, input.sheetRows)
  const isComposite = input.printLayout === 'composite2x4'
  const cellW = isComposite ? COMPOSITE_2X4_PHYSICAL_WIDTH_MM : input.templateWidthMm
  const cellH = isComposite ? COMPOSITE_2X4_PHYSICAL_HEIGHT_MM : input.templateHeightMm
  const { rowGapMm } = computeLabelGridGapsMm(cols, rows, cellW)
  const heightMm = labelPrintPageTotalHeightMm(rows, cellH, rowGapMm)
  return { widthMm: LABEL_PRINT_SHEET_WIDTH_MM, heightMm }
}
