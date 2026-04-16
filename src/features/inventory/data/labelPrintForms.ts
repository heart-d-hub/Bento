/** แม่แบบป้าย (อ้างอิง workflow โปรแกรมเดิม — ใช้กำหนดจำนวนป้ายต่อแผ่น) */
export type LabelPrintFormId =
  | 'product_2x1'
  | 'product_2x1_price'
  | 'product_2x2'
  | 'product_2x2_price'
  | 'product_2x2_box'
  | 'product_2x4'
  | 'shelf_1x1'
  | 'shelf_1x1_large'

export type LabelPrintFormDef = {
  id: LabelPrintFormId
  /** ชื่อที่แสดงใน dropdown */
  label: string
  cols: number
  rows: number
  /** ถ้ามี จะบังคับโชว์ราคาในเลย์เอาต์ (แม้ปิด checkbox ราคา) */
  forcePrice?: boolean
}

export const LABEL_PRINT_FORMS: LabelPrintFormDef[] = [
  { id: 'product_2x1', label: 'ป้ายสินค้า_2x1', cols: 2, rows: 1 },
  { id: 'product_2x1_price', label: 'ป้ายสินค้า_2x1 แสดงราคา', cols: 2, rows: 1, forcePrice: true },
  { id: 'product_2x2', label: 'ป้ายสินค้า_2x2', cols: 2, rows: 2 },
  { id: 'product_2x2_price', label: 'ป้ายสินค้า_2x2 แสดงราคา', cols: 2, rows: 2, forcePrice: true },
  { id: 'product_2x2_box', label: 'ป้ายสินค้า_2x2 หน้ากล่อง', cols: 2, rows: 2 },
  { id: 'product_2x4', label: 'ป้ายสินค้า_2x4', cols: 2, rows: 4 },
  { id: 'shelf_1x1', label: 'ป้ายสินค้า_หน้าชั้น 1x1', cols: 1, rows: 1 },
  { id: 'shelf_1x1_large', label: 'ป้ายสินค้า_หน้าชั้น 1x1 ใหญ่', cols: 1, rows: 1 },
]

export function getLabelPrintForm(id: LabelPrintFormId): LabelPrintFormDef | undefined {
  return LABEL_PRINT_FORMS.find((f) => f.id === id)
}

export function labelsPerPage(form: LabelPrintFormDef): number {
  return Math.max(1, form.cols * form.rows)
}
