import type { TaxInvoiceCanvasElement, TaxInvoiceFormRecord } from '@/features/inventory/data/taxInvoiceFormDesignerStore'

const KEY_GRID = 'bento.taxInvoiceDesigner.showGrid10mm.v1'
const KEY_TRACTOR = 'bento.taxInvoiceDesigner.showTractorMargins.v1'
const KEY_DRAFT_GUIDES = 'bento.taxInvoiceDesigner.showDraftGuides.v1'
const KEY_HIDE_DATA_BLOCKS = 'bento.taxInvoiceDesigner.hideDataBlocksPreview.v1'

/** ขอบซ้าย/ขวาที่มักเป็นพื้นที่รูเจาต่อเนื่อง (แสดงเฉพาะตอนออกแบบ ไม่ส่งไปพิมพ์) */
export const TRACTOR_FEED_SIDE_MARGIN_MM = 12.7

export function loadTaxInvoiceDesignerShowGrid(): boolean {
  try {
    const v = localStorage.getItem(KEY_GRID)
    if (v === '0') return false
    if (v === '1') return true
  } catch {
    /* noop */
  }
  return true
}

export function saveTaxInvoiceDesignerShowGrid(show: boolean): void {
  try {
    localStorage.setItem(KEY_GRID, show ? '1' : '0')
  } catch {
    /* noop */
  }
}

export function loadTaxInvoiceDesignerShowTractor(): boolean {
  try {
    const v = localStorage.getItem(KEY_TRACTOR)
    if (v === '0') return false
    if (v === '1') return true
  } catch {
    /* noop */
  }
  return true
}

export function saveTaxInvoiceDesignerShowTractor(show: boolean): void {
  try {
    localStorage.setItem(KEY_TRACTOR, show ? '1' : '0')
  } catch {
    /* noop */
  }
}

export function loadTaxInvoiceDesignerShowDraftGuides(): boolean {
  try {
    const v = localStorage.getItem(KEY_DRAFT_GUIDES)
    if (v === '0') return false
    if (v === '1') return true
  } catch {
    /* noop */
  }
  return true
}

export function saveTaxInvoiceDesignerShowDraftGuides(show: boolean): void {
  try {
    localStorage.setItem(KEY_DRAFT_GUIDES, show ? '1' : '0')
  } catch {
    /* noop */
  }
}

export function loadTaxInvoiceDesignerHideDataBlocksPreview(): boolean {
  try {
    const v = localStorage.getItem(KEY_HIDE_DATA_BLOCKS)
    if (v === '0') return false
    if (v === '1') return true
  } catch {
    /* noop */
  }
  return false
}

export function saveTaxInvoiceDesignerHideDataBlocksPreview(hide: boolean): void {
  try {
    localStorage.setItem(KEY_HIDE_DATA_BLOCKS, hide ? '1' : '0')
  } catch {
    /* noop */
  }
}

/** มุมซ้ายบนของบล็อกเทียบขอบกระดาษ (มม.) + ขนาด มม. */
export function taxInvoiceElementBoundsOnPageMm(
  form: TaxInvoiceFormRecord,
  el: TaxInvoiceCanvasElement,
): { leftMm: number; topMm: number; wMm: number; hMm: number } {
  const innerW = Math.max(1, form.pageWidthMm - form.marginLeftMm - form.marginRightMm)
  const innerH = Math.max(1, form.pageHeightMm - form.marginTopMm - form.marginBottomMm)
  return {
    leftMm: form.marginLeftMm + (el.x / 100) * innerW,
    topMm: form.marginTopMm + (el.y / 100) * innerH,
    wMm: (el.w / 100) * innerW,
    hMm: (el.h / 100) * innerH,
  }
}
