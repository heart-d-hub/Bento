const LS_KEY = 'bento.purchase.quotations.v1'
const SEQ_KEY = 'bento.purchase.quotationSeq.v1'

export type QuotationStatus = 'draft' | 'confirmed' | 'rejected' | 'converted'

export type QuotationLine = {
  lineId: string
  productId: string | null
  sku: string
  name: string
  qty: number
  unitPrice: number
}

export type Quotation = {
  id: string
  quotationNo: string
  supplierId: string
  supplierName: string
  status: QuotationStatus
  createdAt: string
  validUntil?: string
  lines: QuotationLine[]
  notes?: string
}

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: 'แบบร่าง',
  confirmed: 'ยืนยันแล้ว',
  rejected: 'ปฏิเสธ',
  converted: 'สร้าง PO แล้ว',
}

export const QUOTATIONS_CHANGED_EVENT = 'bento-quotations-changed'

function emit() {
  try { window.dispatchEvent(new CustomEvent(QUOTATIONS_CHANGED_EVENT)) } catch { /* ignore */ }
}

export function loadQuotations(): Quotation[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as Quotation[]) : []
  } catch { return [] }
}

function saveList(list: Quotation[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)) } catch { /* ignore */ }
  emit()
}

export function upsertQuotation(q: Quotation): void {
  const list = loadQuotations()
  const idx = list.findIndex((x) => x.id === q.id)
  if (idx >= 0) list[idx] = q
  else list.unshift(q)
  saveList(list)
}

export function deleteQuotation(id: string): void {
  saveList(loadQuotations().filter((q) => q.id !== id))
}

export function nextQuotationNo(): string {
  const now = new Date()
  const yyyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const key = `${SEQ_KEY}.${yyyymmdd}`
  const seq = (parseInt(localStorage.getItem(key) ?? '0', 10) || 0) + 1
  try { localStorage.setItem(key, String(seq)) } catch { /* ignore */ }
  return `QT-${yyyymmdd}-${String(seq).padStart(3, '0')}`
}
