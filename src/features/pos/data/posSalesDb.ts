import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'

export type PosSaleLinePayload = {
  id: string
  productCode: string
  productName: string
  qty: number
  unitLabel: string
  unitIndex: number
  unitPrice: number
  discount: number
  lineTotal: number
  priceLevelLabel?: string
  priceLevelIndex?: number
  priceTagLabel?: string
}

export type PosSaleCreatePayload = {
  id: string
  billNo: string
  taxInvoiceNo?: string
  mode: 'retail' | 'tax'
  paymentType: 'cash' | 'transfer' | 'account' | 'mixed'
  docDate: string
  subtotal: number
  billDiscount: number
  beforeVat: number
  vatAmount: number
  roundingAdjust: number
  grandTotal: number
  remark?: string
  branchId?: string
  memberCode?: string
  shippingMethod?: string
  lines: PosSaleLinePayload[]
}

export async function createPosSaleAsync(payload: PosSaleCreatePayload): Promise<void> {
  if (!isTauri()) return
  await invoke('sales_create', { payload })
}

export type PosSalesByPayment = {
  paymentType: string
  totalBaht: number
}

export type PosDaySummary = {
  count: number
  totalBaht: number
  byPayment: PosSalesByPayment[]
}

export async function loadPosDaySummaryAsync(docDate: string): Promise<PosDaySummary | null> {
  if (!isTauri()) return null
  return invoke<PosDaySummary>('sales_day_summary', { docDate })
}

export type PosSalesHistoryLine = {
  productId: string
  sku?: string
  name: string
  qty: number
  unitPrice?: number
}

export type PosSalesHistoryRow = {
  id: string
  billNo: string
  at: string
  total: number
  paymentId: string
  lineCount: number
  lines: PosSalesHistoryLine[]
  voidedAt?: string | null
}

export async function loadPosSalesHistoryAsync(limit = 200): Promise<PosSalesHistoryRow[] | null> {
  if (!isTauri()) return null
  const rows = await invoke<Array<Omit<PosSalesHistoryRow, 'lineCount'> & { lineCount: number | string }>>(
    'sales_history_list',
    { limit },
  )
  return (rows ?? []).map((r) => ({
    ...r,
    lineCount: Number(r.lineCount) || 0,
    lines: Array.isArray(r.lines) ? r.lines : [],
  }))
}

export async function loadPosSalesHistoryByMemberAsync(
  memberCode: string,
  limit = 5,
  offset = 0,
): Promise<PosSalesHistoryRow[]> {
  if (!isTauri()) return []
  const rows = await invoke<Array<Omit<PosSalesHistoryRow, 'lineCount'> & { lineCount: number | string }>>(
    'sales_history_by_member',
    { memberCode, limit, offset },
  )
  return (rows ?? []).map((r) => ({
    ...r,
    lineCount: Number(r.lineCount) || 0,
    lines: Array.isArray(r.lines) ? r.lines : [],
  }))
}

export type MemberSalesSummary = {
  visitCount: number
  totalSpent: number
  avgBill: number
  lastVisitAt: string | null
}

export async function loadMemberSalesSummaryAsync(memberCode: string): Promise<MemberSalesSummary | null> {
  if (!isTauri()) return null
  return invoke<MemberSalesSummary>('sales_member_summary', { memberCode })
}

export async function salesLinkMemberByBillAsync(billNo: string, memberCode: string): Promise<void> {
  if (!isTauri()) return
  await invoke('sales_link_member_by_bill', { billNo, memberCode })
}

export async function getPosSaleByBillNoAsync(billNo: string): Promise<PosSalesHistoryRow | null> {
  if (!isTauri()) return null
  const row = await invoke<(Omit<PosSalesHistoryRow, 'lineCount'> & { lineCount: number | string }) | null>(
    'sales_get_by_bill_no',
    { billNo },
  )
  if (!row) return null
  return {
    ...row,
    lineCount: Number(row.lineCount) || 0,
    lines: Array.isArray(row.lines) ? row.lines : [],
  }
}
