import { invoke } from '@tauri-apps/api/core'
import type { StoreProfile } from '@/features/settings/data/mockStoreProfile'
import {
  isDraftGuideFieldKey,
  LINE_TABLE_COL_COUNT_MAX,
  LINE_TABLE_COL_COUNT_MIN,
  TAX_INVOICE_LINE_TABLE_DEFAULT_COL_ROLES,
  TAX_INVOICE_LINE_TABLE_DEFAULT_COL_WIDTHS_PCT,
  type TaxInvoiceCanvasElement,
  type TaxInvoiceFieldKey,
  type TaxInvoiceFormRecord,
  type TaxInvoiceLineColumnRole,
} from '@/features/inventory/data/taxInvoiceFormDesignerStore'

/** ขนาดช่องหัวข้อมุมบนขวาบนฟอร์มต่อเนื่อง (ใช้จัดกล่อง title_th ตอนเลือก preset 9×7) */
export const TAX_INVOICE_TITLE_CHAMBER_MM = { w: 91, h: 13 } as const

/** ข้อความหัวข้อไทยเริ่มต้นเมื่อไม่ได้กำหนดข้อความในบล็อก */
export const TAX_INVOICE_DEFAULT_TITLE_TH = 'ใบกำกับภาษี / ใบเสร็จรับเงิน'

/** คีย์ตัวแปรต่อแถวรายการ — ใช้อ้างอิง API / นำเข้า / Paste (แยกช่องชัดเจน) */
export type TaxInvoiceLineItemVariableKey =
  | 'line.lineSeq'
  | 'line.factoryCode'
  | 'line.sku'
  | 'line.productName'
  | 'line.quantity'
  | 'line.unit'
  | 'line.unitPrice'
  | 'line.discountPct'
  | 'line.discountTotal'
  | 'line.lineTotal'

/** ตัวแปรข้อมูลผู้ซื้อ (แยกช่อง — ไม่รวมในบล็อกเดียว) */
export type TaxInvoiceBuyerVariableKey = 'buyer.name' | 'buyer.taxId' | 'buyer.address'

export const BUYER_VARIABLE_DEFINITIONS: readonly { key: TaxInvoiceBuyerVariableKey; labelTh: string }[] = [
  { key: 'buyer.name', labelTh: 'ชื่อผู้ซื้อ' },
  { key: 'buyer.taxId', labelTh: 'เลขประจำตัวผู้เสียภาษี' },
  { key: 'buyer.address', labelTh: 'ที่อยู่ผู้ซื้อ' },
] as const

export type TaxInvoiceDocVariableKey = 'doc.receiptNo' | 'doc.date' | 'doc.page'

export const DOC_VARIABLE_DEFINITIONS: readonly { key: TaxInvoiceDocVariableKey; labelTh: string }[] = [
  { key: 'doc.receiptNo', labelTh: 'เลขที่ใบกำกับ / ใบเสร็จ' },
  { key: 'doc.date', labelTh: 'วันที่' },
  { key: 'doc.page', labelTh: 'หน้า (เช่น 1/1, 1/2)' },
] as const

/** ข้อมูลหนึ่งแถว — แต่ละฟิลด์แยกตัวแปร; คอลัมน์บนตารางเลือก mapping ได้ */
export type TaxInvoiceLineItemRow = {
  /** ลำดับจากข้อมูล (ว่าง = ใช้เลขแถวบน UI) */
  lineSeq: string
  factoryCode: string
  sku: string
  productName: string
  quantity: string
  unit: string
  unitPrice: string
  discountPct: string
  discountTotal: string
  lineTotal: string
}

export { LINE_TABLE_COL_COUNT_MAX, LINE_TABLE_COL_COUNT_MIN }

/** ลำดับช่อง Paste แบบ Tab แบบเต็ม (10 ช่อง) — ดู parseTaxInvoiceLineTsvCells */
export const LINE_ITEM_VARIABLE_DEFINITIONS: readonly {
  key: TaxInvoiceLineItemVariableKey
  labelTh: string
}[] = [
  { key: 'line.lineSeq', labelTh: 'ลำดับ (ว่างได้)' },
  { key: 'line.factoryCode', labelTh: 'เบอร์/รหัสโรงงาน' },
  { key: 'line.sku', labelTh: 'รหัส SKU' },
  { key: 'line.productName', labelTh: 'รายการสินค้า' },
  { key: 'line.quantity', labelTh: 'จำนวน' },
  { key: 'line.unit', labelTh: 'หน่วยนับ' },
  { key: 'line.unitPrice', labelTh: 'ราคา/หน่วย' },
  { key: 'line.discountPct', labelTh: 'ลด %' },
  { key: 'line.discountTotal', labelTh: 'ลดรวม' },
  { key: 'line.lineTotal', labelTh: 'จำนวนเงิน' },
] as const

/** ข้อความในเซลล์หัวตาราง — คอลัมน์ว่างไม่แสดงตัวอักษร */
export function lineTableHeaderCellLabel(role: TaxInvoiceLineColumnRole): string {
  return role === 'empty' ? '\u00a0' : lineColumnRoleLabelTh(role)
}

export function lineColumnRoleLabelTh(role: TaxInvoiceLineColumnRole): string {
  const m: Record<TaxInvoiceLineColumnRole, string> = {
    empty: 'ว่าง',
    seq: 'ลำดับ',
    factoryCode: 'เบอร์โรงงาน',
    sku: 'รหัส SKU',
    productName: 'รายการสินค้า',
    quantity: 'จำนวน',
    unit: 'หน่วยนับ',
    unitPrice: 'ราคา/หน่วย',
    discountPct: 'ลด %',
    discountTotal: 'ลดรวม',
    lineTotal: 'จำนวนเงิน',
  }
  return m[role]
}

/** ตัวเลือกใน dropdown ออกแบบคอลัมน์ */
export const LINE_COLUMN_ROLE_SELECT_OPTIONS: readonly {
  value: TaxInvoiceLineColumnRole
  labelTh: string
}[] = [
  { value: 'empty', labelTh: 'ว่าง (ช่องว่าง)' },
  { value: 'seq', labelTh: 'ลำดับ' },
  { value: 'sku', labelTh: 'รหัส SKU' },
  { value: 'productName', labelTh: 'รายการสินค้า' },
  { value: 'factoryCode', labelTh: 'เบอร์โรงงาน' },
  { value: 'quantity', labelTh: 'จำนวน (แสดงพร้อมหน่วย)' },
  { value: 'unit', labelTh: 'หน่วยนับ' },
  { value: 'unitPrice', labelTh: 'ราคา/หน่วย' },
  { value: 'discountPct', labelTh: 'ลด %' },
  { value: 'discountTotal', labelTh: 'ลดรวม' },
  { value: 'lineTotal', labelTh: 'จำนวนเงิน' },
] as const

/**
 * ข้อความคอลัมน์จำนวนบนฟอร์ม: ต่อท้ายด้วยหน่วย (เช่น 1 กล่อง, 1 กก.)
 * ถ้าในช่องจำนวนมีหน่วยอยู่แล้วจะไม่ต่อซ้ำ
 */
export function formatLineQuantityWithUnit(row: Pick<TaxInvoiceLineItemRow, 'quantity' | 'unit'>): string {
  const q = (row.quantity ?? '').trim()
  const u = (row.unit ?? '').trim()
  if (!q) return q
  if (!u) return q
  if (q === u) return q
  if (q.endsWith(u)) return q
  if (q.endsWith(` ${u}`)) return q
  return `${q} ${u}`
}

export function lineColumnRoleVariableKey(role: TaxInvoiceLineColumnRole): string | null {
  const map: Partial<Record<TaxInvoiceLineColumnRole, string>> = {
    seq: 'line.lineSeq',
    factoryCode: 'line.factoryCode',
    sku: 'line.sku',
    productName: 'line.productName',
    quantity: 'line.quantity',
    unit: 'line.unit',
    unitPrice: 'line.unitPrice',
    discountPct: 'line.discountPct',
    discountTotal: 'line.discountTotal',
    lineTotal: 'line.lineTotal',
  }
  return map[role] ?? null
}

export function getLineCellValue(
  row: TaxInvoiceLineItemRow,
  role: TaxInvoiceLineColumnRole,
  rowIndex: number,
): string {
  switch (role) {
    case 'empty':
      return ''
    case 'seq':
      return (row.lineSeq ?? '').trim() || String(rowIndex + 1)
    case 'factoryCode':
      return row.factoryCode
    case 'sku':
      return row.sku
    case 'productName':
      return row.productName
    case 'quantity':
      return formatLineQuantityWithUnit(row)
    case 'unit':
      return row.unit
    case 'unitPrice':
      return row.unitPrice
    case 'discountPct':
      return row.discountPct
    case 'discountTotal':
      return row.discountTotal
    case 'lineTotal':
      return row.lineTotal
    default:
      return ''
  }
}

export function lineColumnRoleTextAlign(role: TaxInvoiceLineColumnRole): 'left' | 'center' | 'right' {
  if (role === 'unit') return 'center'
  if (
    role === 'seq' ||
    role === 'quantity' ||
    role === 'unitPrice' ||
    role === 'discountPct' ||
    role === 'discountTotal' ||
    role === 'lineTotal'
  ) {
    return 'right'
  }
  return 'left'
}

type LineColumnAlignEl = Pick<
  TaxInvoiceCanvasElement,
  'lineColumnHeaderTextAlign' | 'lineColumnBodyTextAlign'
> &
  Partial<Pick<TaxInvoiceCanvasElement, 'lineColumnTextAlign'>>

/** line_column: หัวคอลัมน์ — auto หรือไม่มีใช้ตามชนิด; ถ้าเป็น JSON เก่ามีแค่ lineColumnTextAlign ให้ใช้ค่านั้น */
export function resolveLineColumnHeaderTextAlign(
  el: LineColumnAlignEl,
  role: TaxInvoiceLineColumnRole,
): 'left' | 'center' | 'right' {
  const m = el.lineColumnHeaderTextAlign
  if (m === undefined || m === 'auto') {
    const legacy = el.lineColumnTextAlign
    if (legacy === 'left' || legacy === 'center' || legacy === 'right') return legacy
    return lineColumnRoleTextAlign(role)
  }
  return m
}

/** line_column: แถวรายการ — เหมือน header แต่ใช้ lineColumnBodyTextAlign */
export function resolveLineColumnBodyTextAlign(
  el: LineColumnAlignEl,
  role: TaxInvoiceLineColumnRole,
): 'left' | 'center' | 'right' {
  const m = el.lineColumnBodyTextAlign
  if (m === undefined || m === 'auto') {
    const legacy = el.lineColumnTextAlign
    if (legacy === 'left' || legacy === 'center' || legacy === 'right') return legacy
    return lineColumnRoleTextAlign(role)
  }
  return m
}

/** line_column: ขนาด px ของแถวข้อมูล (สอดคล้องกับบล็อกอื่นในแบบฟอร์ม) */
export function lineColumnBodyFontPx(el: Pick<TaxInvoiceCanvasElement, 'fontSize'>): number {
  const fsScaled = Math.max(7, Math.min(22, ((el.fontSize ?? 10) * 1.15)))
  return Math.max(6, fsScaled - 2)
}

/** line_column: ขนาด px ของหัวคอลัมน์ — ปรับแยกได้ต่อกล่อง */
export function lineColumnHeaderFontPx(
  el: Pick<TaxInvoiceCanvasElement, 'fontSize' | 'lineColumnHeaderFontSize'>,
): number {
  const bodyDesign = el.fontSize ?? 10
  const headerDesign =
    typeof el.lineColumnHeaderFontSize === 'number' && Number.isFinite(el.lineColumnHeaderFontSize)
      ? el.lineColumnHeaderFontSize
      : Math.min(36, bodyDesign + 1)
  return Math.max(7, Math.min(26, headerDesign * 1.15))
}

/** แปลง mm → px ตามข้อตกลง CSS 96dpi (สำหรับประมาณการจัดแนวตั้ง) */
export function taxInvoiceMmToCssPx(mm: number): number {
  if (!Number.isFinite(mm)) return 0
  return (mm / 25.4) * 96
}

const LINE_COLUMN_ROW_LINE_MIN_PX = 14

/** ประมาณจำนวนบรรทัดของหัวคอลัมน์เมื่อข้อความยาวเกินความกว้างช่อง */
export function estimateLineColumnHeaderLines(
  headerLabel: string,
  columnWidthMm: number,
  headerFontPx: number,
): number {
  const wPx = taxInvoiceMmToCssPx(Math.max(0.1, columnWidthMm))
  const charPx = Math.max(5, headerFontPx * 0.62)
  const charsPerLine = Math.max(4, Math.floor(wPx / charPx))
  const len = headerLabel.trim().length || 1
  return Math.max(1, Math.ceil(len / charsPerLine))
}

/** ความสูงรวม (px) ของโซนหัว + ระยะหัว→แถวแรก ต่อกล่อง — ใช้หาค่า max ในกลุ่ม */
export function lineColumnSingleColumnBandPx(
  el: Pick<
    TaxInvoiceCanvasElement,
    | 'lineColumnShowHeader'
    | 'lineColumnHeaderBodyGapMm'
    | 'lineColumnHeaderOffsetMm'
    | 'lineColumnRole'
    | 'fontSize'
    | 'lineColumnHeaderFontSize'
  >,
  columnWidthMm: number,
): number {
  const gapPx = taxInvoiceMmToCssPx(el.lineColumnHeaderBodyGapMm ?? 0)
  const show = el.lineColumnShowHeader !== false
  const offPx = taxInvoiceMmToCssPx(Math.max(0, el.lineColumnHeaderOffsetMm ?? 0))
  if (!show) return gapPx
  const role = el.lineColumnRole ?? 'empty'
  const label = lineTableHeaderCellLabel(role)
  const headerPx = lineColumnHeaderFontPx(el)
  const lines = estimateLineColumnHeaderLines(label, columnWidthMm, headerPx)
  const headerBlockPx = lines * headerPx * 1.22 + 2 + offPx
  return headerBlockPx + gapPx
}

export function lineColumnSingleColumnRowLinePx(
  el: Pick<TaxInvoiceCanvasElement, 'fontSize'>,
): number {
  const bodyPx = lineColumnBodyFontPx(el)
  return Math.max(LINE_COLUMN_ROW_LINE_MIN_PX, Math.ceil(bodyPx * 1.35 + 2))
}

export type TaxInvoiceLineColumnGroupLayout = { headerBandPx: number; rowLinePx: number }

/** จัดค่าแนวตั้งร่วมให้ทุกคอลัมน์ในกลุ่ม — แถวที่ n เริ่มระดับเดียวกัน */
export function computeLineColumnGroupLayout(
  elements: readonly TaxInvoiceCanvasElement[],
  innerWidthMm: number,
): Map<string, TaxInvoiceLineColumnGroupLayout> {
  const wMm = Math.max(1, innerWidthMm)
  const byGroup = new Map<string, TaxInvoiceCanvasElement[]>()
  for (const e of elements) {
    if (e.field !== 'line_column' || !e.lineColumnGroupId) continue
    const g = e.lineColumnGroupId
    if (!byGroup.has(g)) byGroup.set(g, [])
    byGroup.get(g)!.push(e)
  }
  const out = new Map<string, TaxInvoiceLineColumnGroupLayout>()
  for (const [gid, cols] of byGroup) {
    let maxBand = 0
    let maxRow = 0
    for (const el of cols) {
      const colWmm = (el.w / 100) * wMm
      maxBand = Math.max(maxBand, lineColumnSingleColumnBandPx(el, colWmm))
      maxRow = Math.max(maxRow, lineColumnSingleColumnRowLinePx(el))
    }
    out.set(gid, { headerBandPx: maxBand, rowLinePx: maxRow })
  }
  return out
}

export const DEFAULT_TAX_INVOICE_LINE_ITEMS: TaxInvoiceLineItemRow[] = [
  {
    lineSeq: '',
    factoryCode: 'FG-01',
    sku: 'SKU-OIL-4L',
    productName: 'น้ำมันเครื่อง 4L',
    quantity: '1',
    unit: 'กป.',
    unitPrice: '890.00',
    discountPct: '0',
    discountTotal: '0.00',
    lineTotal: '890.00',
  },
  {
    lineSeq: '',
    factoryCode: 'FG-01',
    sku: 'SKU-FILTER',
    productName: 'ไส้กรองอากาศ',
    quantity: '2',
    unit: 'ชิ้น',
    unitPrice: '320.00',
    discountPct: '0',
    discountTotal: '0.00',
    lineTotal: '640.00',
  },
]

/** ข้อมูลจำลองบนแคนวาส / พิมพ์ตัวอย่าง */
export const TAX_INVOICE_FORM_SAMPLE = {
  buyerName: 'บริษัท ตัวอย่าง จำกัด',
  buyerTaxId: '0-1055-12345-67-8',
  buyerPhone: '0812322220',
  buyerAddr: '123 ถ.ตัวอย่าง แขวง/เขต กรุงเทพฯ 10110',
  customerCode: 'CU-000142',
  receiptNo: 'ANG0000001',
  date: '13/4/2569',
  pageLabel: 'หน้า 1/1',
  staff: 'สมชาย ใจดี',
  lines: DEFAULT_TAX_INVOICE_LINE_ITEMS,
  subtotal: '1,530.00',
  vat: '107.10',
  total: '1,637.10',
} as const

const THAI_DIGIT_WORDS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'] as const
const THAI_PLACE_WORDS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'] as const

function readThaiNumberBelowMillion(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return ''
  const digits = String(Math.trunc(value)).split('').map((d) => Number(d))
  const len = digits.length
  let out = ''
  for (let i = 0; i < len; i += 1) {
    const d = digits[i]!
    if (d === 0) continue
    const pos = len - i - 1
    if (pos === 0) {
      if (d === 1 && len > 1) out += 'เอ็ด'
      else out += THAI_DIGIT_WORDS[d]
      continue
    }
    if (pos === 1) {
      if (d === 1) out += 'สิบ'
      else if (d === 2) out += 'ยี่สิบ'
      else out += `${THAI_DIGIT_WORDS[d]}สิบ`
      continue
    }
    out += `${THAI_DIGIT_WORDS[d]}${THAI_PLACE_WORDS[pos]}`
  }
  return out
}

function readThaiInteger(value: number): string {
  const intVal = Math.trunc(value)
  if (!Number.isFinite(intVal) || intVal <= 0) return 'ศูนย์'
  const s = String(intVal)
  if (s.length <= 6) return readThaiNumberBelowMillion(intVal)
  const head = Number(s.slice(0, -6))
  const tail = Number(s.slice(-6))
  const headText = readThaiInteger(head)
  const tailText = tail > 0 ? readThaiNumberBelowMillion(tail) : ''
  return `${headText}ล้าน${tailText}`
}

export function toThaiBahtText(rawAmount: string): string {
  const cleaned = (rawAmount ?? '').replace(/,/g, '').trim()
  if (!cleaned) return 'ศูนย์บาทถ้วน'
  const amount = Number(cleaned)
  if (!Number.isFinite(amount) || amount < 0) return 'ศูนย์บาทถ้วน'
  const [bahtRaw, satangRaw] = amount.toFixed(2).split('.')
  const baht = Number(bahtRaw)
  const satang = Number(satangRaw)
  const bahtText = readThaiInteger(baht)
  if (satang <= 0) return `${bahtText}บาทถ้วน`
  return `${bahtText}บาท${readThaiNumberBelowMillion(satang)}สตางค์`
}

/** แถวสั้น (≤7 ช่อง) = รูปแบบเก่า: โรงงาน, SKU, ชื่อ, จำนวน, หน่วย, ราคา/หน่วย, จำนวนเงิน */
export function parseTaxInvoiceLineTsvCells(cells: string[]): TaxInvoiceLineItemRow {
  const c = (i: number) => (cells[i] ?? '').trim()
  if (cells.length <= 7) {
    return {
      lineSeq: '',
      factoryCode: c(0),
      sku: c(1),
      productName: c(2),
      quantity: c(3),
      unit: c(4),
      unitPrice: c(5),
      discountPct: '',
      discountTotal: '',
      lineTotal: c(6),
    }
  }
  return {
    lineSeq: c(0),
    factoryCode: c(1),
    sku: c(2),
    productName: c(3),
    quantity: c(4),
    unit: c(5),
    unitPrice: c(6),
    discountPct: c(7),
    discountTotal: c(8),
    lineTotal: c(9),
  }
}

/** หลายแถว — แต่ละแถวแยกด้วยขึ้นบรรทัด แต่ละช่องแยกด้วย Tab */
export function parseTaxInvoiceLineTsvBlock(text: string): TaxInvoiceLineItemRow[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => parseTaxInvoiceLineTsvCells(line.split('\t')))
}

export function lineItemsToTsvPreview(rows: readonly TaxInvoiceLineItemRow[]): string {
  return rows
    .map((r) =>
      [
        r.lineSeq,
        r.factoryCode,
        r.sku,
        r.productName,
        r.quantity,
        r.unit,
        r.unitPrice,
        r.discountPct,
        r.discountTotal,
        r.lineTotal,
      ].join('\t'),
    )
    .join('\n')
}

export type TaxInvoiceLineRenderContext = {
  lineRows?: readonly TaxInvoiceLineItemRow[]
  /** ความกว้างพื้นที่พิมพ์ภายใน (มม.) — ใช้ประมาณการหัวหลายบรรทัด / fallback layout */
  innerContentWidthMm?: number
  lineColumnGroupLayoutByGroupId?: ReadonlyMap<string, TaxInvoiceLineColumnGroupLayout>
}

export function getLineTableConfig(el: TaxInvoiceCanvasElement): {
  widths: number[]
  roles: TaxInvoiceLineColumnRole[]
  showHeader: boolean
} {
  const dw = [...TAX_INVOICE_LINE_TABLE_DEFAULT_COL_WIDTHS_PCT]
  const dr = [...TAX_INVOICE_LINE_TABLE_DEFAULT_COL_ROLES]
  if (el.field !== 'line_table') {
    return { widths: dw, roles: dr, showHeader: true }
  }
  const w = el.lineColWidthsPct
  const r = el.lineColRoles
  const widths =
    Array.isArray(w) &&
    w.length >= LINE_TABLE_COL_COUNT_MIN &&
    w.length <= LINE_TABLE_COL_COUNT_MAX
      ? w
      : dw
  const len = widths.length
  const roles: TaxInvoiceLineColumnRole[] =
    Array.isArray(r) && r.length === len
      ? (r as TaxInvoiceLineColumnRole[])
      : Array.from({ length: len }, (_, i) => dr[i] ?? 'empty')
  return {
    widths,
    roles,
    showHeader: el.lineTableShowHeader !== false,
  }
}

export function getLineTableColWidthsPct(el: TaxInvoiceCanvasElement): number[] {
  return getLineTableConfig(el).widths
}

/** เปลี่ยนความกว้างคอลัมน์หนึ่ง — คอลัมน์อื่นปรับตามสัดส่วนเดิมให้รวม 100% */
export function adjustLineTableColumnWidth(current: readonly number[], index: number, newVal: number): number[] {
  const len = current.length
  if (len < 2 || index < 0 || index >= len) return [...current]
  const min = len > 8 ? 3 : 5
  const max = Math.min(45, 100 - (len - 1) * min)
  const restIdx = Array.from({ length: len }, (_, i) => i).filter((i) => i !== index)
  const minRest = restIdx.length * min
  let nv = Math.round(newVal * 10) / 10
  nv = Math.min(max, Math.max(min, nv))
  let rest = 100 - nv
  if (rest < minRest) {
    nv = 100 - minRest
    rest = minRest
  }
  const out = [...current]
  out[index] = nv
  const restSum = restIdx.reduce<number>((s, i) => s + out[i], 0)
  if (restSum < 0.01) {
    const each = rest / restIdx.length
    restIdx.forEach((i) => {
      out[i] = Math.round(each * 10) / 10
    })
  } else {
    restIdx.forEach((i) => {
      out[i] = Math.round((out[i] / restSum) * rest * 10) / 10
    })
  }
  const drift = 100 - out.reduce((a, b) => a + b, 0)
  const last = restIdx[restIdx.length - 1]!
  out[last] = Math.round((out[last] + drift) * 10) / 10
  return out
}

export function taxInvoiceFieldLabelTh(field: TaxInvoiceFieldKey): string {
  const m: Record<TaxInvoiceFieldKey, string> = {
    title_th: 'หัวข้อ (ไทย)',
    title_en: 'หัวข้อ (อังกฤษ)',
    seller_block: 'ผู้ขาย',
    buyer_block: 'ผู้ซื้อ',
    buyer_name: 'ผู้ซื้อ · ชื่อ',
    buyer_tax_id: 'ผู้ซื้อ · เลขผู้เสียภาษี',
    buyer_address: 'ผู้ซื้อ · ที่อยู่',
    doc_meta: 'เลขบิล · วันที่ · หน้า',
    doc_receipt_no: 'เลขที่ใบกำกับ / ใบเสร็จ',
    doc_date: 'วันที่',
    customer_code: 'รหัสลูกค้า',
    line_table: 'แถวรายการ · ตารางรวม (ฟอร์มเก่า)',
    line_column: 'คอลัมน์รายการสินค้า (แยกกล่อง)',
    totals_block: 'ยอดสรุป',
    total_text: 'จำนวนเงินตัวอักษร',
    staff: 'พนักงาน',
    custom_text: 'ข้อความกำหนดเอง',
    draft_rect: 'แบบร่าง · กรอบ',
    draft_line_h: 'แบบร่าง · เส้นนอน',
    draft_line_v: 'แบบร่าง · เส้นตั้ง',
  }
  return m[field]
}

/** HTML ภายในกล่อง (พิมพ์ตัวอย่าง) — เนื้อหาสอดคล้องกับ BlockContent บนแคนวาส */
export function taxInvoiceElementPrintInnerHtml(
  el: TaxInvoiceCanvasElement,
  profile: StoreProfile,
  ctx?: TaxInvoiceLineRenderContext,
): string {
  const S = TAX_INVOICE_FORM_SAMPLE
  const lineRows = ctx?.lineRows ?? DEFAULT_TAX_INVOICE_LINE_ITEMS
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const fs = Math.max(7, Math.min(22, (el.fontSize ?? 10) * 1.15))
  const ta = el.textAlign ?? 'left'
  const wrap = (body: string, extra = '') =>
    `<div style="font-size:${fs}px;line-height:1.25;text-align:${ta};word-break:break-word;width:100%;height:100%;overflow:hidden;box-sizing:border-box;${extra}">${body}</div>`

  switch (el.field) {
    case 'title_th': {
      const titleText = (el.staticText ?? '').trim() || TAX_INVOICE_DEFAULT_TITLE_TH
      const il = el.textInsetLeftMm ?? 0
      const it = el.textInsetTopMm ?? 0
      return `<div style="font-size:${fs}px;line-height:1.25;text-align:left;word-break:break-word;width:100%;height:100%;overflow:hidden;box-sizing:border-box;color:#000;padding-left:${il}mm;padding-top:${it}mm;"><strong>${esc(titleText)}</strong></div>`
    }
    case 'title_en':
      return wrap(`<strong>${esc('Tax Invoice / Receipt')}</strong>`, 'text-align:left;color:#000;')
    case 'seller_block': {
      const sellerInsetL = el.textInsetLeftMm ?? 0
      const sellerInsetT = el.textInsetTopMm ?? 0
      const sellerNameSize = Math.max(8, fs + 1.5)
      return wrap(
        `<div style="font-weight:700;font-size:${sellerNameSize}px;">${esc(profile.storeName || 'ชื่อร้าน')}</div>` +
          `<div>${esc((profile.address || '').slice(0, 120))}</div>` +
          `<div>${esc('เลขประจำตัวผู้เสียภาษี : ' + (profile.taxId || '—'))}</div>` +
          `<div>${esc('โทรศัพท์ : ' + (profile.phone || '—'))}</div>`,
        `text-align:left;color:#000;padding-left:${sellerInsetL}mm;padding-top:${sellerInsetT}mm;`,
      )
    }
    case 'buyer_block': {
      const buyerInsetL = el.textInsetLeftMm ?? 0
      const buyerInsetT = el.textInsetTopMm ?? 0
      return wrap(
        `<div>${esc(S.buyerName)}</div>` +
          `<div>${esc(S.buyerAddr)}</div>` +
          `<div>${esc('เลขประจำตัวผู้เสียภาษี : ' + S.buyerTaxId + ' โทรศัพท์ : ' + S.buyerPhone)}</div>`,
        `text-align:left;color:#000;padding-left:${buyerInsetL}mm;padding-top:${buyerInsetT}mm;`,
      )
    }
    case 'buyer_name':
      return wrap(esc(S.buyerName), 'text-align:left;color:#000;')
    case 'buyer_tax_id':
      return wrap(esc(S.buyerTaxId), 'text-align:left;color:#000;')
    case 'buyer_address':
      return wrap(esc(S.buyerAddr), 'text-align:left;color:#000;')
    case 'doc_meta':
      return wrap(
        `<div>${esc(S.receiptNo)}</div><div>${esc(S.date)}</div><div>${esc(S.pageLabel)}</div>`,
        `text-align:left;color:#000;line-height:${el.docLineHeight ?? 1.25};padding-left:${el.textInsetLeftMm ?? 0}mm;padding-top:${el.textInsetTopMm ?? 0}mm;`,
      )
    case 'doc_receipt_no':
      return wrap(esc(S.receiptNo), 'text-align:left;color:#000;')
    case 'doc_date':
      return wrap(esc(S.date), 'text-align:left;color:#000;')
    case 'customer_code':
      return wrap(`<div>${esc('รหัสลูกค้า')}</div><div>${esc(S.customerCode)}</div>`, 'text-align:left;color:#000;')
    case 'line_column': {
      const role = el.lineColumnRole ?? 'empty'
      const show = el.lineColumnShowHeader !== false
      const bodyPx = lineColumnBodyFontPx(el)
      const headerPx = lineColumnHeaderFontPx(el)
      const taH = resolveLineColumnHeaderTextAlign(el, role)
      const taB = resolveLineColumnBodyTextAlign(el, role)
      const headerOffsetMm = el.lineColumnHeaderOffsetMm ?? 0
      const bodyOffsetMm = el.lineColumnBodyOffsetMm ?? 0
      const innerMm = Math.max(1, ctx?.innerContentWidthMm ?? 80)
      const colWmm = (el.w / 100) * innerMm
      const gid = el.lineColumnGroupId ?? ''
      const synced = ctx?.lineColumnGroupLayoutByGroupId?.get(gid)
      const headerBandPx = synced?.headerBandPx ?? lineColumnSingleColumnBandPx(el, colWmm)
      const rowLinePx = synced?.rowLinePx ?? lineColumnSingleColumnRowLinePx(el)
      const alignBlock = (ta: 'left' | 'center' | 'right') =>
        ta === 'left'
          ? 'text-align:left;word-break:break-word;overflow-wrap:anywhere;white-space:normal'
          : ta === 'center'
            ? 'text-align:center;white-space:nowrap'
            : 'text-align:right;white-space:nowrap'
      const headerTransform =
        headerOffsetMm !== 0 ? `transform:translateY(${headerOffsetMm}mm);` : ''
      const headerStyle = `font-weight:600;font-size:${Math.max(5, headerPx - 0.5)}px;line-height:1.2;${alignBlock(taH)}${headerTransform}`
      const dataStyle = alignBlock(taB)
      const hdr = show
        ? `<div style="position:absolute;left:0;right:0;top:0;${headerStyle}">${esc(lineTableHeaderCellLabel(role))}</div>`
        : ''
      const band = `<div style="position:relative;flex-shrink:0;width:100%;min-height:${headerBandPx}px;box-sizing:border-box;">${hdr}</div>`
      const cells = lineRows
        .map((row, ri) => {
          const v = getLineCellValue(row, role, ri)
          return `<div style="font-size:${bodyPx}px;line-height:1.3;font-weight:500;min-height:${rowLinePx}px;width:100%;box-sizing:border-box;${dataStyle}">${esc(v)}</div>`
        })
        .join('')
      const bodyMargin = bodyOffsetMm !== 0 ? `margin-top:${bodyOffsetMm}mm;` : ''
      const bodyWrap = `<div style="flex:1;min-height:0;overflow:hidden;box-sizing:border-box;${bodyMargin}">${cells}</div>`
      return `<div style="width:100%;height:100%;overflow:hidden;color:#000;box-sizing:border-box;display:flex;flex-direction:column;">${band}${bodyWrap}</div>`
    }
    case 'line_table': {
      const small = Math.max(6, fs - 2)
      const { widths, roles, showHeader } = getLineTableConfig(el)
      const colgroup =
        '<colgroup>' + widths.map((w) => `<col style="width:${w}%"/>`).join('') + '</colgroup>'
      const cellStyle = (ta: 'left' | 'center' | 'right') => {
        const base =
          'border:none;padding:1px 2px;vertical-align:top;white-space:nowrap;font-weight:600;font-size:' +
          Math.max(5, small - 0.5) +
          'px'
        if (ta === 'left')
          return base + ';text-align:left;word-break:break-word;overflow-wrap:anywhere;white-space:normal'
        if (ta === 'center') return base + ';text-align:center'
        return base + ';text-align:right'
      }
      const dataStyle = (ta: 'left' | 'center' | 'right') => {
        const base = 'border:none;padding:1px 2px;vertical-align:top;'
        if (ta === 'left')
          return base + 'text-align:left;word-break:break-word;overflow-wrap:anywhere;white-space:normal'
        if (ta === 'center') return base + 'text-align:center;white-space:nowrap'
        return base + 'text-align:right;white-space:nowrap'
      }
      const headerRow = showHeader
        ? `<thead><tr>` +
          roles
            .map((role) => {
              const ta = lineColumnRoleTextAlign(role)
              return `<th style="${cellStyle(ta)}">${esc(lineTableHeaderCellLabel(role))}</th>`
            })
            .join('') +
          `</tr></thead>`
        : ''
      const bodyRows = lineRows
        .map((row, ri) => {
          const tds = roles
            .map((role) => {
              const ta = lineColumnRoleTextAlign(role)
              const v = getLineCellValue(row, role, ri)
              return `<td style="${dataStyle(ta)}">${esc(v)}</td>`
            })
            .join('')
          return `<tr>${tds}</tr>`
        })
        .join('')
      return `<div style="font-size:${small}px;line-height:1.3;text-align:left;width:100%;height:100%;overflow:hidden;color:#000;font-weight:500;">
<table style="width:100%;table-layout:fixed;border-collapse:collapse;border:none">${colgroup}${headerRow}<tbody>${bodyRows}</tbody></table></div>`
    }
    case 'totals_block': {
      const lhTotals = el.totalsLineHeight ?? el.lineHeight ?? 1.25
      const gapMm = el.totalsLabelValueGapMm ?? 2
      const valueW = el.totalsValueColumnWidthPct ?? 36
      const labelAlign = el.totalsLabelTextAlign ?? el.textAlign ?? 'left'
      const valueAlign = el.totalsValueTextAlign ?? 'right'
      const row = (label: string, value: string, strong?: boolean) =>
        `<div style="display:flex;gap:${gapMm}mm;align-items:baseline;">` +
        `<span style="flex:1 1 auto;min-width:0;text-align:${labelAlign};">${esc(label)}</span>` +
        `<span style="flex:0 0 ${valueW}%;text-align:${valueAlign};white-space:nowrap;${strong ? 'font-weight:700;' : ''}">${esc(value)}</span>` +
        `</div>`
      return (
        `<div style="font-size:${fs}px;line-height:${lhTotals};text-align:left;word-break:break-word;width:100%;height:100%;overflow:hidden;box-sizing:border-box;color:#000;">` +
        row('รวมเป็นเงิน', S.subtotal) +
        row('ภาษีมูลค่าเพิ่ม 7%', S.vat) +
        row('จำนวนเงินทั้งสิ้น', S.total, true) +
        `</div>`
      )
    }
    case 'total_text':
      return wrap(esc(toThaiBahtText(S.total)), 'text-align:left;color:#000;')
    case 'staff':
      return wrap(
        esc('พนักงานขาย: ' + S.staff),
        `text-align:left;color:#000;padding-left:${el.textInsetLeftMm ?? 0}mm;padding-top:${el.textInsetTopMm ?? 0}mm;`,
      )
    case 'custom_text':
      return wrap(esc((el.staticText ?? '').trim() || '— ข้อความกำหนดเอง —'))
    case 'draft_rect':
      return `<div style="width:100%;height:100%;box-sizing:border-box;border:0.2mm dashed #64748b;overflow:hidden;"></div>`
    case 'draft_line_h':
      return `<div style="width:100%;height:100%;box-sizing:border-box;border-top:0.25mm solid #0f172a;overflow:hidden;"></div>`
    case 'draft_line_v':
      return `<div style="width:100%;height:100%;box-sizing:border-box;border-left:0.25mm solid #0f172a;overflow:hidden;"></div>`
    default:
      return ''
  }
}

export function buildTaxInvoiceFormPrintHtml(
  form: TaxInvoiceFormRecord,
  profile: StoreProfile,
  ctx?: TaxInvoiceLineRenderContext,
): string {
  const { pageWidthMm, pageHeightMm, marginTopMm, marginRightMm, marginBottomMm, marginLeftMm, elements } = form
  const innerW = Math.max(1, pageWidthMm - marginLeftMm - marginRightMm)
  const innerH = Math.max(1, pageHeightMm - marginTopMm - marginBottomMm)
  const printElements = elements.filter((el) => !isDraftGuideFieldKey(el.field))
  const lineColumnGroupLayout = computeLineColumnGroupLayout(printElements, innerW)
  const printCtx: TaxInvoiceLineRenderContext = {
    ...ctx,
    innerContentWidthMm: innerW,
    lineColumnGroupLayoutByGroupId: lineColumnGroupLayout,
  }
  const boxes = printElements
    .map((el) => {
      const inner = taxInvoiceElementPrintInnerHtml(el, profile, printCtx)
      return `<div class="el" style="left:${el.x}%;top:${el.y}%;width:${el.w}%;height:${el.h}%;">${inner}</div>`
    })
    .join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>ตัวอย่างใบกำกับ</title>
<style>
@page { size: ${pageWidthMm}mm ${pageHeightMm}mm; margin: 0; }
html,body{margin:0;padding:0;}
.page{box-sizing:border-box;width:${pageWidthMm}mm;height:${pageHeightMm}mm;position:relative;background:#fff;
  font-family:"Sarabun","TH Sarabun New","Leelawadee UI","Tahoma","Microsoft Sans Serif",Arial,sans-serif;
  -webkit-font-smoothing:auto;-moz-osx-font-smoothing:auto;text-rendering:geometricPrecision;}
.inner{position:absolute;left:${marginLeftMm}mm;top:${marginTopMm}mm;width:${innerW}mm;height:${innerH}mm;box-sizing:border-box;
  -webkit-print-color-adjust:exact;print-color-adjust:exact;color:#000;}
.inner,.inner *{color:#000 !important;-webkit-font-smoothing:auto !important;text-rendering:geometricPrecision !important;}
.el{position:absolute;box-sizing:border-box;overflow:hidden;padding:1px;}
</style></head><body><div class="page"><div class="inner">${boxes}</div></div></body></html>`
}

/** ต้องตรงกับ @media print ใน index.css */
export const TAX_INVOICE_PRINT_SURFACE_ID = 'tax-invoice-print-surface'

export function parseTaxInvoicePrintHtmlForMainDocument(fullHtml: string): {
  styleCss: string
  pageMarkup: string
} {
  const doc = new DOMParser().parseFromString(fullHtml, 'text/html')
  const styleCss = doc.querySelector('head style')?.textContent?.trim() ?? ''
  const pageMarkup = doc.querySelector('.page')?.outerHTML ?? ''
  if (!pageMarkup) {
    throw new Error('parseTaxInvoicePrintHtmlForMainDocument: missing .page')
  }
  return { styleCss, pageMarkup }
}

export function mountTaxInvoicePrintSurface(fullHtml: string): void {
  document.getElementById(TAX_INVOICE_PRINT_SURFACE_ID)?.remove()
  const { styleCss, pageMarkup } = parseTaxInvoicePrintHtmlForMainDocument(fullHtml)
  const host = document.createElement('div')
  host.id = TAX_INVOICE_PRINT_SURFACE_ID
  host.setAttribute('aria-hidden', 'true')
  Object.assign(host.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '-1',
  })
  const styleEl = document.createElement('style')
  styleEl.textContent = styleCss
  host.appendChild(styleEl)
  const wrap = document.createElement('div')
  wrap.innerHTML = pageMarkup
  while (wrap.firstChild) {
    host.appendChild(wrap.firstChild)
  }
  document.body.appendChild(host)
}

export function unmountTaxInvoicePrintSurface(): void {
  document.getElementById(TAX_INVOICE_PRINT_SURFACE_ID)?.remove()
}

/** Tauri Windows: กล่องพิมพ์ระบบ — เบราว์เซอร์ / dev: window.print() */
export async function printTaxInvoiceHtmlPreferSystemDialog(fullHtml: string): Promise<void> {
  mountTaxInvoicePrintSurface(fullHtml)
  const cleanup = () => {
    unmountTaxInvoicePrintSurface()
  }
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
  try {
    await invoke('show_system_print_dialog')
    cleanup()
  } catch {
    const onAfterPrint = () => {
      cleanup()
      window.removeEventListener('afterprint', onAfterPrint)
    }
    window.addEventListener('afterprint', onAfterPrint)
    window.setTimeout(cleanup, 120_000)
    window.print()
  }
}
