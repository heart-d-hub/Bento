const KEY = 'bento.pos.taxInvoiceFormDesigner.v1'

export const TAX_INVOICE_FORM_DESIGNER_CHANGED_EVENT = 'bento-tax-invoice-form-designer-changed'

/** บทบาทแต่ละคอลัมน์ในตารางแถวรายการ — หัวตาราง + ค่าในแถวมาจาก role เดียวกัน */
export type TaxInvoiceLineColumnRole =
  | 'empty'
  | 'seq'
  | 'factoryCode'
  | 'sku'
  | 'productName'
  | 'quantity'
  | 'unit'
  | 'unitPrice'
  | 'discountPct'
  | 'discountTotal'
  | 'lineTotal'

export const TAX_INVOICE_LINE_COLUMN_ROLES: readonly TaxInvoiceLineColumnRole[] = [
  'empty',
  'seq',
  'factoryCode',
  'sku',
  'productName',
  'quantity',
  'unit',
  'unitPrice',
  'discountPct',
  'discountTotal',
  'lineTotal',
] as const

export const LINE_TABLE_COL_COUNT_MIN = 2
export const LINE_TABLE_COL_COUNT_MAX = 12

/** ค่าเริ่มต้น 9 คอลัมน์: ลำดับ · SKU · รายการ · โรงงาน · จำนวน · ราคา/หน่วย · ลด% · ลดรวม · จำนวนเงิน */
export const TAX_INVOICE_LINE_TABLE_DEFAULT_COL_ROLES: readonly TaxInvoiceLineColumnRole[] = [
  'seq',
  'sku',
  'productName',
  'factoryCode',
  'quantity',
  'unitPrice',
  'discountPct',
  'discountTotal',
  'lineTotal',
] as const

/** ฟิลด์ / กลุ่มบล็อกบนแคนวาสใบกำกับภาษี */
export type TaxInvoiceFieldKey =
  | 'title_th'
  | 'title_en'
  | 'seller_block'
  | 'buyer_block'
  | 'buyer_name'
  | 'buyer_tax_id'
  | 'buyer_address'
  | 'doc_meta'
  | 'doc_receipt_no'
  | 'doc_date'
  | 'customer_code'
  | 'line_table'
  /** คอลัมน์รายการหนึ่งช่อง — หลาย element ใช้ lineColumnGroupId เดียวกัน = แถวเดียว (ล็อกเลื่อนขึ้น/ลงพร้อมกัน) */
  | 'line_column'
  | 'totals_block'
  | 'total_text'
  | 'staff'
  | 'custom_text'
  /** เส้น/กรอบช่วยออกแบบ (ไม่ใช่ข้อมูลจริง) — เพิ่มได้หลายชิ้น */
  | 'draft_rect'
  | 'draft_line_h'
  | 'draft_line_v'

export type TaxInvoiceCanvasElement = {
  id: string
  field: TaxInvoiceFieldKey
  x: number
  y: number
  w: number
  h: number
  fontSize?: number
  textAlign?: 'left' | 'center' | 'right'
  /** โหมดเก่า (totals_block) — ใช้ migrate ไป totalsLineHeight */
  lineHeight?: number
  /** totals_block: ความสูงบรรทัดแบบไม่มีหน่วย (เช่น 1.25) */
  totalsLineHeight?: number
  /** totals_block: ระยะห่างระหว่างข้อความกับตัวเลขในแต่ละบรรทัด (มม.) */
  totalsLabelValueGapMm?: number
  /** totals_block: จัดแนวข้อความฝั่งซ้าย */
  totalsLabelTextAlign?: 'left' | 'center' | 'right'
  /** totals_block: จัดแนวตัวเลขฝั่งขวา */
  totalsValueTextAlign?: 'left' | 'center' | 'right'
  /** totals_block: ความกว้างคอลัมน์ตัวเลข (%) */
  totalsValueColumnWidthPct?: number
  /** doc_meta: ความห่างบรรทัด */
  docLineHeight?: number
  /** สำหรับ custom_text หรือข้อความหัวข้อไทย (title_th) */
  staticText?: string
  /** ระยะข้อความจากขอบซ้าย/บนของกล่อง (มม.) — ใช้กับ title_th / seller_block / buyer_block / doc_meta / staff */
  textInsetLeftMm?: number
  textInsetTopMm?: number
  /** แถวรายการ: ความกว้างคอลัมน์ % ตามลำดับ (รวม 100) — คู่กับ lineColRoles */
  lineColWidthsPct?: number[]
  /** แถวรายการ: บทบาทต่อคอลัมน์ (หัวตาราง + ข้อมูล) — ความยาวเท่า lineColWidthsPct */
  lineColRoles?: TaxInvoiceLineColumnRole[]
  /** แสดงแถวหัวตารางในกล่อง — ปิดเมื่อกระดาษฟอร์มสำเร็จมีหัวพิมพ์อยู่แล้ว */
  lineTableShowHeader?: boolean
  /** line_column: กลุ่มแถวเดียวกัน — เลื่อนแนวตั้งพร้อมกัน */
  lineColumnGroupId?: string
  lineColumnRole?: TaxInvoiceLineColumnRole
  /** line_column: แสดงหัวคอลัมน์ในกล่อง */
  lineColumnShowHeader?: boolean
  /** line_column: ขนาดหัวคอลัมน์ (สเกล 6–36 เหมือนขนาดตัวอักษรของกล่อง) — ไม่ระบุ = ใหญ่กว่าข้อมูล 1 ระดับ */
  lineColumnHeaderFontSize?: number
  /** line_column: ระยะจากหัวคอลัมน์ถึงบรรทัดแรกของข้อมูล (มม.) */
  lineColumnHeaderBodyGapMm?: number
  /** line_column: เลื่อนหัวขึ้น/ลง (มม.) บวก = ลง — รายการไม่เลื่อน */
  lineColumnHeaderOffsetMm?: number
  /** line_column: เลื่อนเฉพาะรายการขึ้น/ลง (มม.) ลบ = ขึ้น — หัวไม่ขยับ */
  lineColumnBodyOffsetMm?: number
  /** line_column: จัดหัวคอลัมน์ — auto = ตามชนิดข้อมูล */
  lineColumnHeaderTextAlign?: 'auto' | 'left' | 'center' | 'right'
  /** line_column: จัดแถวรายการสินค้า — auto = ตามชนิดข้อมูล */
  lineColumnBodyTextAlign?: 'auto' | 'left' | 'center' | 'right'
  /** โหมดเก่า (อ่านตอนโหลด) — normalize แมปไป header/body */
  lineColumnTextAlign?: 'auto' | 'left' | 'center' | 'right'
}

export type TaxInvoiceFormLayout = {
  version: 1
  name: string
  pageWidthMm: number
  pageHeightMm: number
  marginTopMm: number
  marginRightMm: number
  marginBottomMm: number
  marginLeftMm: number
  elements: TaxInvoiceCanvasElement[]
}

export type TaxInvoiceFormRecord = { id: string } & TaxInvoiceFormLayout

export type TaxInvoiceFormDesignerState = {
  version: 1
  forms: TaxInvoiceFormRecord[]
  activeFormId: string
}

const MM_MIN = 80
const MM_MAX = 420

function clampMm(n: number, d: number): number {
  if (!Number.isFinite(n)) return d
  return Math.min(MM_MAX, Math.max(MM_MIN, n))
}

function clampMargin(n: number, d: number): number {
  if (!Number.isFinite(n)) return d
  return Math.min(80, Math.max(0, n))
}

function clampFontSize(n: number, d: number): number {
  if (!Number.isFinite(n)) return d
  return Math.min(36, Math.max(6, Math.round(n)))
}

function clampTotalsLineHeight(n: number): number {
  if (!Number.isFinite(n)) return 1.25
  return Math.min(2.5, Math.max(1, Math.round(n * 100) / 100))
}

/** อ่านความห่างบรรทัดยอดรวมจาก JSON / state — รองรับ string จากที่เก็บข้อมูลบางแหล่ง */
function parseTotalsLineHeightRaw(raw: unknown): number | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined
  const n =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? parseFloat(raw.trim())
        : Number.NaN
  if (!Number.isFinite(n)) return undefined
  return clampTotalsLineHeight(n)
}

function clampTotalsLabelValueGapMm(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 2
  return Math.min(20, Math.max(0, Math.round(raw * 10) / 10))
}

function clampTotalsValueColumnWidthPct(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 36
  return Math.min(70, Math.max(20, Math.round(raw * 10) / 10))
}

function normalizeTotalsTextAlign(
  raw: unknown,
  fallback: 'left' | 'center' | 'right',
): 'left' | 'center' | 'right' {
  const n = normalizeTextAlign(raw)
  return n ?? fallback
}

function clampPct(n: number, d: number): number {
  if (!Number.isFinite(n)) return d
  return Math.min(100, Math.max(0, n))
}

const TEXT_INSET_MM_MAX = 150
const LINE_COLUMN_HEADER_BODY_GAP_MM_MAX = 20
/** เลื่อนหัวคอลัมน์ขึ้น/ลงเทียบกับช่อง — ไม่ดันแถวรายการ (ใช้ transform) */
const LINE_COLUMN_HEADER_OFFSET_MM_MAX = 15

function clampLineColumnHeaderBodyGapMm(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0
  return Math.min(LINE_COLUMN_HEADER_BODY_GAP_MM_MAX, Math.max(0, Math.round(raw * 10) / 10))
}

function clampLineColumnHeaderOffsetMm(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0
  return Math.min(
    LINE_COLUMN_HEADER_OFFSET_MM_MAX,
    Math.max(-LINE_COLUMN_HEADER_OFFSET_MM_MAX, Math.round(raw * 10) / 10),
  )
}

function clampLineColumnBodyOffsetMm(raw: unknown): number {
  return clampLineColumnHeaderOffsetMm(raw)
}

function normalizeLineColumnTextAlign(
  raw: unknown,
): 'auto' | 'left' | 'center' | 'right' {
  if (raw === 'left' || raw === 'center' || raw === 'right' || raw === 'auto') return raw
  return 'auto'
}

/** อ่าน align ต่อส่วน — ถ้าไม่มีใช้ legacy lineColumnTextAlign (โหมดเก่า) */
function lineColumnPartAlignFromRaw(
  rawPart: unknown,
  legacyLineColumnTextAlign: unknown,
): 'auto' | 'left' | 'center' | 'right' {
  if (rawPart !== undefined && rawPart !== null) return normalizeLineColumnTextAlign(rawPart)
  return normalizeLineColumnTextAlign(legacyLineColumnTextAlign)
}

/** ความกว้างคอลัมน์เริ่มต้น % สำหรับ line_table 9 คอลัมน์ (รวม 100) — คู่กับ TAX_INVOICE_LINE_TABLE_DEFAULT_COL_ROLES */
export const TAX_INVOICE_LINE_TABLE_DEFAULT_COL_WIDTHS_PCT = [5, 9, 22, 10, 7, 9, 8, 10, 20] as const

function clampTextInsetMmField(n: unknown): number | undefined {
  if (typeof n !== 'number' || !Number.isFinite(n)) return undefined
  const v = Math.round(n * 10) / 10
  return Math.min(TEXT_INSET_MM_MAX, Math.max(0, v))
}

export function newTaxInvoiceFormId(): string {
  return `tif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function newTaxInvoiceElementId(): string {
  return `tie-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function newTaxInvoiceLineColumnGroupId(): string {
  return `lcg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** สร้างกล่องคอลัมน์รายการ N ช่อง แถวเดียว — ลากซ้าย/ขวาแยกช่อง; ลากบน/ลงทั้งแถว */
export function createLineColumnGroupElements(count: number): TaxInvoiceCanvasElement[] {
  const n = Math.min(LINE_TABLE_COL_COUNT_MAX, Math.max(LINE_TABLE_COL_COUNT_MIN, Math.round(count)))
  const groupId = newTaxInvoiceLineColumnGroupId()
  const roles: TaxInvoiceLineColumnRole[] = Array.from(
    { length: n },
    (_, i) => TAX_INVOICE_LINE_TABLE_DEFAULT_COL_ROLES[i] ?? 'empty',
  )
  const rawW = Array.from({ length: n }, (_, i) => {
    const d = TAX_INVOICE_LINE_TABLE_DEFAULT_COL_WIDTHS_PCT[i]
    return typeof d === 'number' ? d : 100 / n
  })
  const widths = scaleLineColWidthsTo100(rawW)
  const rowBandLeft = 4
  const rowBandW = 92
  const rowY = 62
  const rowH = 19
  const targetRight = rowBandLeft + rowBandW
  let xAcc = rowBandLeft
  const els: TaxInvoiceCanvasElement[] = []
  for (let i = 0; i < n; i++) {
    const isLast = i === n - 1
    const wPct = isLast ? targetRight - xAcc : (widths[i]! / 100) * rowBandW
    const wClamped = Math.max(0.5, Math.round(wPct * 1000) / 1000)
    els.push({
      id: newTaxInvoiceElementId(),
      field: 'line_column',
      x: Math.round(xAcc * 1000) / 1000,
      y: rowY,
      w: wClamped,
      h: rowH,
      fontSize: 8,
      textAlign: 'left',
      lineColumnGroupId: groupId,
      lineColumnRole: roles[i]!,
      lineColumnShowHeader: true,
    })
    xAcc += wClamped
  }
  return els
}

export const TAX_INVOICE_PAPER_PRESETS: { id: string; label: string; w: number; h: number }[] = [
  { id: 'a4', label: 'A4 (210×297 มม.)', w: 210, h: 297 },
  { id: 'a5', label: 'A5 (148×210 มม.)', w: 148, h: 210 },
  { id: 'cont95', label: 'ต่อเนื่อง 9.5×5.5 นิ้ว (241×140 มม.)', w: 241, h: 140 },
  { id: 'cont9', label: 'ต่อเนื่อง 9×5.5 นิ้ว (229×140 มม.)', w: 228.6, h: 139.7 },
  /** กระดาษต่อเนื่องฟอร์มสำเร็จ: กว้าง 9″ × สูง 7″ */
  { id: 'cont9x7', label: 'ต่อเนื่องฟอร์ม 9×7 นิ้ว (229×178 มม.)', w: 228.6, h: 177.8 },
]

function normalizeTextAlign(v: unknown): 'left' | 'center' | 'right' | undefined {
  if (v === 'center' || v === 'right') return v
  if (v === 'left') return 'left'
  return undefined
}

export function isDraftGuideFieldKey(k: TaxInvoiceFieldKey): boolean {
  return k === 'draft_rect' || k === 'draft_line_h' || k === 'draft_line_v'
}

function normalizeElement(raw: unknown): TaxInvoiceCanvasElement | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Record<string, unknown>
  const id = typeof e.id === 'string' && e.id ? e.id : newTaxInvoiceElementId()
  const field = e.field
  const valid: TaxInvoiceFieldKey[] = [
    'title_th',
    'title_en',
    'seller_block',
    'buyer_block',
    'buyer_name',
    'buyer_tax_id',
    'buyer_address',
    'doc_meta',
    'doc_receipt_no',
    'doc_date',
    'customer_code',
    'line_table',
    'line_column',
    'totals_block',
    'total_text',
    'staff',
    'custom_text',
    'draft_rect',
    'draft_line_h',
    'draft_line_v',
  ]
  const fk = valid.includes(field as TaxInvoiceFieldKey) ? (field as TaxInvoiceFieldKey) : 'custom_text'
  const draft = isDraftGuideFieldKey(fk)
  const fs =
    draft
      ? undefined
      : typeof e.fontSize === 'number' && Number.isFinite(e.fontSize)
        ? clampFontSize(e.fontSize, 11)
        : undefined
  const st = typeof e.staticText === 'string' ? e.staticText.slice(0, 2000) : undefined
  const staticText =
    fk === 'custom_text' ? st ?? '' : fk === 'title_th' ? (typeof e.staticText === 'string' ? st : undefined) : undefined
  const supportTextInset =
    fk === 'title_th' ||
    fk === 'seller_block' ||
    fk === 'buyer_block' ||
    fk === 'doc_meta' ||
    fk === 'staff'
  const textInsetLeftMm = supportTextInset ? clampTextInsetMmField(e.textInsetLeftMm) : undefined
  const textInsetTopMm = supportTextInset ? clampTextInsetMmField(e.textInsetTopMm) : undefined
  const lineTable =
    fk === 'line_table'
      ? normalizeLineTableFields(e.lineColWidthsPct, e.lineColRoles, e.lineTableShowHeader)
      : undefined
  const totalsBits =
    fk === 'totals_block'
      ? {
          totalsLineHeight:
            parseTotalsLineHeightRaw(e.lineHeight) ??
            parseTotalsLineHeightRaw(e.totalsLineHeight) ??
            1.25,
          totalsLabelValueGapMm: clampTotalsLabelValueGapMm(e.totalsLabelValueGapMm),
          totalsValueColumnWidthPct: clampTotalsValueColumnWidthPct(e.totalsValueColumnWidthPct),
          totalsLabelTextAlign: normalizeTotalsTextAlign(
            e.totalsLabelTextAlign,
            normalizeTextAlign(e.textAlign) ?? 'left',
          ),
          totalsValueTextAlign: normalizeTotalsTextAlign(
            e.totalsValueTextAlign,
            normalizeTextAlign(e.textAlign) ?? 'right',
          ),
        }
      : undefined
  const docMetaBits =
    fk === 'doc_meta'
      ? {
          docLineHeight: clampTotalsLineHeight(
            typeof e.docLineHeight === 'number'
              ? e.docLineHeight
              : typeof e.lineHeight === 'number'
                ? e.lineHeight
                : 1.25,
          ),
        }
      : undefined
  const lineColumnBits =
    fk === 'line_column'
      ? {
          lineColumnGroupId:
            typeof e.lineColumnGroupId === 'string' && e.lineColumnGroupId.trim().length > 0
              ? e.lineColumnGroupId.trim().slice(0, 80)
              : newTaxInvoiceLineColumnGroupId(),
          lineColumnRole:
            typeof e.lineColumnRole === 'string' &&
            (TAX_INVOICE_LINE_COLUMN_ROLES as readonly string[]).includes(e.lineColumnRole)
              ? (e.lineColumnRole as TaxInvoiceLineColumnRole)
              : 'empty',
          lineColumnShowHeader: e.lineColumnShowHeader === false ? false : true,
          lineColumnHeaderBodyGapMm: clampLineColumnHeaderBodyGapMm(e.lineColumnHeaderBodyGapMm),
          lineColumnHeaderOffsetMm: clampLineColumnHeaderOffsetMm(e.lineColumnHeaderOffsetMm),
          lineColumnBodyOffsetMm: clampLineColumnBodyOffsetMm(e.lineColumnBodyOffsetMm),
          lineColumnHeaderTextAlign: lineColumnPartAlignFromRaw(
            e.lineColumnHeaderTextAlign,
            e.lineColumnTextAlign,
          ),
          lineColumnBodyTextAlign: lineColumnPartAlignFromRaw(
            e.lineColumnBodyTextAlign,
            e.lineColumnTextAlign,
          ),
          lineColumnHeaderFontSize:
            typeof e.lineColumnHeaderFontSize === 'number' && Number.isFinite(e.lineColumnHeaderFontSize)
              ? clampFontSize(e.lineColumnHeaderFontSize, Math.min(36, (typeof fs === 'number' ? fs : 11) + 1))
              : undefined,
        }
      : undefined
  return {
    id,
    field: fk,
    x: clampPct(typeof e.x === 'number' ? e.x : 0, 0),
    y: clampPct(typeof e.y === 'number' ? e.y : 0, 0),
    w: clampPct(typeof e.w === 'number' ? e.w : 40, 40),
    h: clampPct(typeof e.h === 'number' ? e.h : 10, 10),
    fontSize: fs,
    textAlign: draft ? undefined : normalizeTextAlign(e.textAlign),
    staticText,
    ...(textInsetLeftMm !== undefined ? { textInsetLeftMm } : {}),
    ...(textInsetTopMm !== undefined ? { textInsetTopMm } : {}),
    ...(lineTable
      ? {
          lineColWidthsPct: lineTable.lineColWidthsPct,
          lineColRoles: lineTable.lineColRoles,
          lineTableShowHeader: lineTable.lineTableShowHeader,
        }
      : {}),
    ...(lineColumnBits
      ? {
          lineColumnGroupId: lineColumnBits.lineColumnGroupId,
          lineColumnRole: lineColumnBits.lineColumnRole,
          lineColumnShowHeader: lineColumnBits.lineColumnShowHeader,
          lineColumnHeaderBodyGapMm: lineColumnBits.lineColumnHeaderBodyGapMm,
          lineColumnHeaderOffsetMm: lineColumnBits.lineColumnHeaderOffsetMm,
          lineColumnBodyOffsetMm: lineColumnBits.lineColumnBodyOffsetMm,
          lineColumnHeaderTextAlign: lineColumnBits.lineColumnHeaderTextAlign,
          lineColumnBodyTextAlign: lineColumnBits.lineColumnBodyTextAlign,
          ...(lineColumnBits.lineColumnHeaderFontSize !== undefined
            ? { lineColumnHeaderFontSize: lineColumnBits.lineColumnHeaderFontSize }
            : {}),
        }
      : {}),
    ...(totalsBits
      ? {
          /** mirror legacy key เผื่อ flow อื่นยังอ่าน lineHeight */
          lineHeight: totalsBits.totalsLineHeight,
          totalsLineHeight: totalsBits.totalsLineHeight,
          totalsLabelValueGapMm: totalsBits.totalsLabelValueGapMm,
          totalsValueColumnWidthPct: totalsBits.totalsValueColumnWidthPct,
          totalsLabelTextAlign: totalsBits.totalsLabelTextAlign,
          totalsValueTextAlign: totalsBits.totalsValueTextAlign,
        }
      : {}),
    ...(docMetaBits
      ? {
          docLineHeight: docMetaBits.docLineHeight,
        }
      : {}),
  }
}

function isTaxInvoiceLineColumnRole(v: unknown): v is TaxInvoiceLineColumnRole {
  return typeof v === 'string' && (TAX_INVOICE_LINE_COLUMN_ROLES as readonly string[]).includes(v)
}

/** สเกลความกว้างคอลัมน์ให้รวม 100% — ใช้ตอนเปลี่ยนจำนวนคอลัมน์ / นำเข้า */
export function scaleLineColWidthsTo100(v: readonly number[]): number[] {
  const len = v.length
  const minW = len > 8 ? 3 : 4
  const maxW = 50
  const clamped = v.map((n) => {
    const x = typeof n === 'number' && Number.isFinite(n) ? n : 0
    return Math.max(minW, Math.min(maxW, x))
  })
  const s = clamped.reduce((a, b) => a + b, 0)
  if (s < 1) return [...TAX_INVOICE_LINE_TABLE_DEFAULT_COL_WIDTHS_PCT]
  const scaled = clamped.map((x) => (x / s) * 100)
  const rounded = scaled.map((x) => Math.round(x * 10) / 10)
  const drift = 100 - rounded.reduce((a, b) => a + b, 0)
  const last = rounded.length - 1
  rounded[last] = Math.round((rounded[last]! + drift) * 10) / 10
  return rounded
}

function normalizeLineTableFields(
  rawW: unknown,
  rawR: unknown,
  rawShowHeader: unknown,
): {
  lineColWidthsPct: number[]
  lineColRoles: TaxInvoiceLineColumnRole[]
  lineTableShowHeader: boolean
} {
  const dW = [...TAX_INVOICE_LINE_TABLE_DEFAULT_COL_WIDTHS_PCT]
  let widths: number[]
  if (
    !Array.isArray(rawW) ||
    rawW.length < LINE_TABLE_COL_COUNT_MIN ||
    rawW.length > LINE_TABLE_COL_COUNT_MAX
  ) {
    widths = dW
  } else {
    widths = scaleLineColWidthsTo100(rawW as number[])
  }
  const len = widths.length
  const hadSavedRoles =
    Array.isArray(rawR) && rawR.length > 0 && rawR.some((x) => isTaxInvoiceLineColumnRole(x))
  const useLegacy7 = !hadSavedRoles && len === 7
  const LEGACY_7: TaxInvoiceLineColumnRole[] = [
    'factoryCode',
    'sku',
    'productName',
    'quantity',
    'unit',
    'unitPrice',
    'lineTotal',
  ]
  const DEF = [...TAX_INVOICE_LINE_TABLE_DEFAULT_COL_ROLES]
  const fallbackRoles = (): TaxInvoiceLineColumnRole[] => {
    if (useLegacy7) return [...LEGACY_7]
    return Array.from({ length: len }, (_, i) => DEF[i] ?? 'empty')
  }
  let roles: TaxInvoiceLineColumnRole[]
  if (!Array.isArray(rawR) || rawR.length === 0) {
    roles = fallbackRoles()
  } else {
    const fb = fallbackRoles()
    roles = Array.from({ length: len }, (_, i) => {
      const x = rawR[i]
      return isTaxInvoiceLineColumnRole(x) ? x : fb[i]!
    })
  }
  const lineTableShowHeader = rawShowHeader === false ? false : true
  return { lineColWidthsPct: widths, lineColRoles: roles, lineTableShowHeader }
}

/** เปลี่ยนจำนวนคอลัมน์ — กว้างสเกลใหม่; role เก็บตำแหน่งเดิมที่ทับได้ ที่เหลือเติมจากค่าเริ่มต้น */
export function resizeLineTableToColumnCount(
  prevW: readonly number[],
  prevR: readonly TaxInvoiceLineColumnRole[],
  n: number,
): { lineColWidthsPct: number[]; lineColRoles: TaxInvoiceLineColumnRole[] } {
  const clampedN = Math.min(LINE_TABLE_COL_COUNT_MAX, Math.max(LINE_TABLE_COL_COUNT_MIN, Math.round(n)))
  const DEF = [...TAX_INVOICE_LINE_TABLE_DEFAULT_COL_ROLES]
  let widths: number[]
  if (clampedN <= prevW.length) {
    widths = scaleLineColWidthsTo100(prevW.slice(0, clampedN))
  } else {
    const base = [...prevW]
    while (base.length < clampedN) {
      base.push(100 / clampedN)
    }
    widths = scaleLineColWidthsTo100(base)
  }
  const roles: TaxInvoiceLineColumnRole[] = Array.from({ length: clampedN }, (_, i) => {
    const p = prevR[i]
    if (p !== undefined && (TAX_INVOICE_LINE_COLUMN_ROLES as readonly string[]).includes(p)) return p
    return DEF[i] ?? 'empty'
  })
  return { lineColWidthsPct: widths, lineColRoles: roles }
}

function normalizeFormBody(p: Record<string, unknown>, id: string): TaxInvoiceFormRecord | null {
  if (p.version !== 1) return null
  const d = defaultTaxInvoiceFormBody('ฟอร์ม')
  const els = Array.isArray(p.elements) ? p.elements.map(normalizeElement).filter(Boolean) : []
  return {
    id,
    version: 1,
    name: typeof p.name === 'string' && p.name.trim() ? p.name.trim().slice(0, 80) : 'ฟอร์มใบกำกับ',
    pageWidthMm: clampMm(typeof p.pageWidthMm === 'number' ? p.pageWidthMm : d.pageWidthMm, d.pageWidthMm),
    pageHeightMm: clampMm(typeof p.pageHeightMm === 'number' ? p.pageHeightMm : d.pageHeightMm, d.pageHeightMm),
    marginTopMm: clampMargin(typeof p.marginTopMm === 'number' ? p.marginTopMm : d.marginTopMm, d.marginTopMm),
    marginRightMm: clampMargin(typeof p.marginRightMm === 'number' ? p.marginRightMm : d.marginRightMm, d.marginRightMm),
    marginBottomMm: clampMargin(typeof p.marginBottomMm === 'number' ? p.marginBottomMm : d.marginBottomMm, d.marginBottomMm),
    marginLeftMm: clampMargin(typeof p.marginLeftMm === 'number' ? p.marginLeftMm : d.marginLeftMm, d.marginLeftMm),
    elements: (els as TaxInvoiceCanvasElement[]).slice(0, 64),
  }
}

export function defaultTaxInvoiceFormBody(name: string): TaxInvoiceFormLayout {
  return {
    version: 1,
    name,
    pageWidthMm: 210,
    pageHeightMm: 297,
    marginTopMm: 12,
    marginRightMm: 12,
    marginBottomMm: 12,
    marginLeftMm: 12,
    elements: defaultStackedElements(),
  }
}

/** จัดวางเริ่มต้นคล้ายใบกำกับทั่วไป (ลากต่อได้) */
export function defaultStackedElements(): TaxInvoiceCanvasElement[] {
  let t = Date.now()
  const id = () => {
    t += 1
    return `tie-${t}-${Math.random().toString(36).slice(2, 5)}`
  }
  return [
    { id: id(), field: 'title_th', x: 8, y: 2, w: 84, h: 6, fontSize: 14 },
    { id: id(), field: 'title_en', x: 8, y: 8, w: 84, h: 4, fontSize: 10, textAlign: 'center' },
    { id: id(), field: 'seller_block', x: 6, y: 14, w: 52, h: 16, fontSize: 9, textAlign: 'left' },
    { id: id(), field: 'buyer_block', x: 6, y: 31, w: 88, h: 10, fontSize: 9, textAlign: 'left' },
    { id: id(), field: 'doc_meta', x: 6, y: 53, w: 40, h: 9, fontSize: 9, textAlign: 'left', docLineHeight: 1.25 },
    ...createLineColumnGroupElements(9),
    {
      id: id(),
      field: 'totals_block',
      x: 48,
      y: 83,
      w: 48,
      h: 11,
      fontSize: 9,
      lineHeight: 1.25,
      totalsLineHeight: 1.25,
      totalsLabelValueGapMm: 2,
      totalsValueColumnWidthPct: 36,
      totalsLabelTextAlign: 'left',
      totalsValueTextAlign: 'right',
    },
    { id: id(), field: 'staff', x: 6, y: 90, w: 88, h: 5, fontSize: 9, textAlign: 'left' },
  ]
}

function normalizeState(raw: unknown): TaxInvoiceFormDesignerState | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.version !== 1 || !Array.isArray(o.forms)) return null
  const forms: TaxInvoiceFormRecord[] = []
  for (const f of o.forms) {
    if (!f || typeof f !== 'object') continue
    const fr = f as Record<string, unknown>
    const id = typeof fr.id === 'string' && fr.id ? fr.id : newTaxInvoiceFormId()
    const body = normalizeFormBody({ ...fr, version: 1 }, id)
    if (body) forms.push(body)
  }
  if (forms.length === 0) return null
  const active =
    typeof o.activeFormId === 'string' && forms.some((x) => x.id === o.activeFormId)
      ? o.activeFormId
      : forms[0]!.id
  return { version: 1, forms, activeFormId: active }
}

export function loadTaxInvoiceFormDesignerState(): TaxInvoiceFormDesignerState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialTaxInvoiceFormDesignerState()
    const parsed = JSON.parse(raw) as unknown
    const n = normalizeState(parsed)
    if (n) return n
  } catch {
    /* noop */
  }
  return initialTaxInvoiceFormDesignerState()
}

function initialTaxInvoiceFormDesignerState(): TaxInvoiceFormDesignerState {
  const id = newTaxInvoiceFormId()
  return {
    version: 1,
    activeFormId: id,
    forms: [{ id, ...defaultTaxInvoiceFormBody('ฟอร์มมาตรฐาน') }],
  }
}

/**
 * บันทึก state ตามที่อยู่ในหน่วยความจำ — ไม่รัน normalize รอบสอง
 * (normalize ใช้แค่ตอนโหลด) เพื่อไม่ให้ค่าที่เพิ่งแก้ เช่น totals_block.lineHeight หาย
 * หลัง mergeState / เปลี่ยนการเลือกบล็อก
 */
export function saveTaxInvoiceFormDesignerState(state: TaxInvoiceFormDesignerState): TaxInvoiceFormDesignerState {
  if (state.forms.length === 0) {
    const init = initialTaxInvoiceFormDesignerState()
    try {
      localStorage.setItem(KEY, JSON.stringify(init))
    } catch {
      /* noop */
    }
    window.dispatchEvent(new Event(TAX_INVOICE_FORM_DESIGNER_CHANGED_EVENT))
    return init
  }
  const activeFormId = state.forms.some((x) => x.id === state.activeFormId)
    ? state.activeFormId
    : state.forms[0]!.id
  const next: TaxInvoiceFormDesignerState = {
    version: 1,
    forms: state.forms,
    activeFormId,
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* quota / private mode */
  }
  window.dispatchEvent(new Event(TAX_INVOICE_FORM_DESIGNER_CHANGED_EVENT))
  return next
}

export function getActiveTaxInvoiceForm(state: TaxInvoiceFormDesignerState): TaxInvoiceFormRecord {
  return state.forms.find((f) => f.id === state.activeFormId) ?? state.forms[0]!
}
