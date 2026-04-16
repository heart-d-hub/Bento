import {
  type ReceiptExtraBlock,
  type ReceiptFontPreset,
  normalizeReceiptExtraBlocks,
  normalizeReceiptFontPreset,
} from '@/features/inventory/data/receiptDesignerExtras'

const KEY = 'bento.pos.receiptDesignerLayout.v1'

export const RECEIPT_DESIGNER_CHANGED_EVENT = 'bento-receipt-designer-changed'

export type ReceiptPaperWidthMm = 58 | 80

export type { ReceiptExtraBlock, ReceiptFontPreset } from '@/features/inventory/data/receiptDesignerExtras'

/** แบบจัดวางใบเสร็จ (POS / เครื่องพิมพ์ใบกำกับ) — บันทึกในเครื่อง */
export type ReceiptDesignerLayout = {
  version: 1
  paperWidthMm: ReceiptPaperWidthMm
  /** ขนาดตัวอักษรฐาน (px) บนหน้าจอและพิมพ์ — สเกลส่วนอื่นจากค่านี้ */
  baseFontPx: number
  /** ชุดฟอนต์หลักของใบเสร็จ */
  fontPreset: ReceiptFontPreset
  /** บล็อกเสริม: หลังหัวร้าน ก่อนเลขที่/รายการ */
  topExtras: ReceiptExtraBlock[]
  /** บล็อกเสริม: หลังยอดเงิน/ชำระ ก่อนขอบคุณ */
  bottomExtras: ReceiptExtraBlock[]
  showStoreName: boolean
  showBranch: boolean
  showTaxId: boolean
  showPhone: boolean
  showAddress: boolean
  showDocNo: boolean
  showDateTime: boolean
  showCashier: boolean
  showItemNo: boolean
  showItemSku: boolean
  showItemUnitPrice: boolean
  showItemQty: boolean
  showItemLineTotal: boolean
  showSubtotal: boolean
  showDiscount: boolean
  showTax: boolean
  showTotal: boolean
  showPaymentMethod: boolean
  showChange: boolean
  showThankYou: boolean
  /** บรรทัดท้ายกำหนดเอง (แสดงใต้ข้อความขอบคุณถ้าเปิด) */
  footerLines: string[]
  /** เส้นคั่นหนาระหว่างส่วน */
  showSectionDividers: boolean
  /** ช่องท้ายบิล 1 — ข้อความ (เช่น โปรโมชั่นด้านบน) */
  showEndBillText1: boolean
  endBillText1: string
  /** ช่องท้ายบิล 2 — บาร์โค้ดเลขที่บิล (CODE128 ตามเลขที่ใบเสร็จ) */
  showEndBillBarcode: boolean
  /** ช่องท้ายบิล 3 — ข้อความโปรท้ายบิล */
  showEndBillPromoText: boolean
  endBillPromoText: string
}

export const DEFAULT_RECEIPT_DESIGNER_LAYOUT: ReceiptDesignerLayout = {
  version: 1,
  paperWidthMm: 80,
  baseFontPx: 12,
  fontPreset: 'mono',
  topExtras: [],
  bottomExtras: [],
  showStoreName: true,
  showBranch: true,
  showTaxId: true,
  showPhone: true,
  showAddress: false,
  showDocNo: true,
  showDateTime: true,
  showCashier: true,
  showItemNo: true,
  showItemSku: true,
  showItemUnitPrice: true,
  showItemQty: true,
  showItemLineTotal: true,
  showSubtotal: true,
  showDiscount: true,
  showTax: true,
  showTotal: true,
  showPaymentMethod: true,
  showChange: true,
  showThankYou: true,
  footerLines: [],
  showSectionDividers: true,
  showEndBillText1: false,
  endBillText1: '',
  showEndBillBarcode: false,
  showEndBillPromoText: false,
  endBillPromoText: '',
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function normalizeBool(v: unknown, d: boolean): boolean {
  return typeof v === 'boolean' ? v : d
}

function normalizePaperWidth(v: unknown): ReceiptPaperWidthMm {
  return v === 58 ? 58 : 80
}

function normalizeFooterLines(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((x): x is string => typeof x === 'string')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8)
}

function normalizeEndBillString(v: unknown, maxLen: number): string {
  if (typeof v !== 'string') return ''
  return v.replace(/\r/g, '').slice(0, maxLen)
}

export function loadReceiptDesignerLayout(): ReceiptDesignerLayout {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_RECEIPT_DESIGNER_LAYOUT }
    const p = JSON.parse(raw) as Record<string, unknown>
    if (p.version !== 1) return { ...DEFAULT_RECEIPT_DESIGNER_LAYOUT }
    const d = DEFAULT_RECEIPT_DESIGNER_LAYOUT
    return {
      version: 1,
      paperWidthMm: normalizePaperWidth(p.paperWidthMm),
      baseFontPx: clamp(typeof p.baseFontPx === 'number' ? p.baseFontPx : d.baseFontPx, 9, 18),
      fontPreset: normalizeReceiptFontPreset(p.fontPreset),
      topExtras: normalizeReceiptExtraBlocks(p.topExtras),
      bottomExtras: normalizeReceiptExtraBlocks(p.bottomExtras),
      showStoreName: normalizeBool(p.showStoreName, d.showStoreName),
      showBranch: normalizeBool(p.showBranch, d.showBranch),
      showTaxId: normalizeBool(p.showTaxId, d.showTaxId),
      showPhone: normalizeBool(p.showPhone, d.showPhone),
      showAddress: normalizeBool(p.showAddress, d.showAddress),
      showDocNo: normalizeBool(p.showDocNo, d.showDocNo),
      showDateTime: normalizeBool(p.showDateTime, d.showDateTime),
      showCashier: normalizeBool(p.showCashier, d.showCashier),
      showItemNo: normalizeBool(p.showItemNo, d.showItemNo),
      showItemSku: normalizeBool(p.showItemSku, d.showItemSku),
      showItemUnitPrice: normalizeBool(p.showItemUnitPrice, d.showItemUnitPrice),
      showItemQty: normalizeBool(p.showItemQty, d.showItemQty),
      showItemLineTotal: normalizeBool(p.showItemLineTotal, d.showItemLineTotal),
      showSubtotal: normalizeBool(p.showSubtotal, d.showSubtotal),
      showDiscount: normalizeBool(p.showDiscount, d.showDiscount),
      showTax: normalizeBool(p.showTax, d.showTax),
      showTotal: normalizeBool(p.showTotal, d.showTotal),
      showPaymentMethod: normalizeBool(p.showPaymentMethod, d.showPaymentMethod),
      showChange: normalizeBool(p.showChange, d.showChange),
      showThankYou: normalizeBool(p.showThankYou, d.showThankYou),
      footerLines: normalizeFooterLines(p.footerLines),
      showSectionDividers: normalizeBool(p.showSectionDividers, d.showSectionDividers),
      showEndBillText1: normalizeBool(p.showEndBillText1, d.showEndBillText1),
      endBillText1: normalizeEndBillString(p.endBillText1, 2000),
      showEndBillBarcode: normalizeBool(p.showEndBillBarcode, d.showEndBillBarcode),
      showEndBillPromoText: normalizeBool(p.showEndBillPromoText, d.showEndBillPromoText),
      endBillPromoText: normalizeEndBillString(p.endBillPromoText, 2000),
    }
  } catch {
    return { ...DEFAULT_RECEIPT_DESIGNER_LAYOUT }
  }
}

export function saveReceiptDesignerLayout(layout: ReceiptDesignerLayout): ReceiptDesignerLayout {
  const next = {
    ...layout,
    version: 1 as const,
    footerLines: normalizeFooterLines(layout.footerLines),
    fontPreset: normalizeReceiptFontPreset(layout.fontPreset),
    topExtras: normalizeReceiptExtraBlocks(layout.topExtras),
    bottomExtras: normalizeReceiptExtraBlocks(layout.bottomExtras),
    endBillText1: normalizeEndBillString(layout.endBillText1, 2000),
    endBillPromoText: normalizeEndBillString(layout.endBillPromoText, 2000),
  }
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(RECEIPT_DESIGNER_CHANGED_EVENT))
  return next
}
