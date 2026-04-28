import type { BranchId } from '@/features/auth/branches'
import type { PurchaseOrder, PoPromoGroup, PoVatMode, PoInvoice } from '@/features/purchase/data/poTypes'
import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'

const LS_KEY = 'bento.purchase.orders.v1'
const MAX = 200

export const PURCHASE_ORDERS_CHANGED_EVENT = 'bento-purchase-orders-changed'

function newId(): string {
  return `po-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function loadPurchaseOrders(): PurchaseOrder[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as unknown
    if (!Array.isArray(list)) return []
    return list.map(normalizePo).filter(Boolean) as PurchaseOrder[]
  } catch {
    return []
  }
}

function normalizePo(v: unknown): PurchaseOrder | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id : newId()
  const poNo = typeof o.poNo === 'string' ? o.poNo : id
  const branchId = (typeof o.branchId === 'string' ? o.branchId : 'somneuk') as BranchId
  const supplierId = typeof o.supplierId === 'string' ? o.supplierId : ''
  const supplierName = typeof o.supplierName === 'string' ? o.supplierName : ''
  const status = o.status === 'ordered' || o.status === 'closed' ? o.status : 'draft'
  const createdAt = typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString()
  const linesRaw = Array.isArray(o.lines) ? o.lines : []
  const lines = linesRaw
    .map((row) => {
      if (!row || typeof row !== 'object') return null
      const r = row as Record<string, unknown>
      const lineId = typeof r.lineId === 'string' ? r.lineId : `ln-${Math.random().toString(36).slice(2, 9)}`
      const productId = typeof r.productId === 'string' ? r.productId : ''
      const sku = typeof r.sku === 'string' ? r.sku : ''
      const name = typeof r.name === 'string' ? r.name : ''
      const orderedQty = Math.max(0, Number(r.orderedQty) || 0)
      const unitCostOrder = Math.max(0, Number(r.unitCostOrder) || 0)
      const receivedQtyTotal = Math.max(0, Number(r.receivedQtyTotal) || 0)
      if (!productId) return null
      return {
        lineId, productId, sku, name, orderedQty, unitCostOrder, receivedQtyTotal,
        ...(typeof r.listPrice === 'number' && r.listPrice > 0 ? { listPrice: r.listPrice } : {}),
        ...(typeof r.discountChain === 'string' && r.discountChain.trim() ? { discountChain: r.discountChain.trim() } : {}),
        ...(typeof r.bonusPaidQty === 'number' && r.bonusPaidQty > 0 ? { bonusPaidQty: r.bonusPaidQty } : {}),
        ...(typeof r.bonusFreeQty === 'number' && r.bonusFreeQty > 0 ? { bonusFreeQty: r.bonusFreeQty } : {}),
      }
    })
    .filter(Boolean) as PurchaseOrder['lines']

  const receiveBatches = Array.isArray(o.receiveBatches)
    ? (o.receiveBatches as unknown[])
        .map((b) => {
          if (!b || typeof b !== 'object') return null
          const x = b as Record<string, unknown>
          const bid = typeof x.id === 'string' ? x.id : `rcv-${Math.random().toString(36).slice(2, 9)}`
          const at = typeof x.at === 'string' ? x.at : new Date().toISOString()
          const lr = Array.isArray(x.lines) ? x.lines : []
          const blines = lr
            .map((ln) => {
              if (!ln || typeof ln !== 'object') return null
              const z = ln as Record<string, unknown>
              const lineId = typeof z.lineId === 'string' ? z.lineId : ''
              const qty = Math.max(0, Number(z.qty) || 0)
              const unitCost = Math.max(0, Number(z.unitCost) || 0)
              const shortageQty =
                typeof z.shortageQty === 'number' && z.shortageQty > 0
                  ? Math.round(Math.max(0, z.shortageQty) * 10000) / 10000
                  : undefined
              if (!lineId || (qty <= 0 && (!shortageQty || shortageQty <= 0))) return null
              return { lineId, qty, unitCost, ...(shortageQty ? { shortageQty } : {}) }
            })
            .filter(Boolean) as PurchaseOrder['receiveBatches'][0]['lines']
          if (blines.length === 0) return null
          const refNos = typeof x.refNos === 'string' ? x.refNos.trim() : undefined
          const shippingCostBaht =
            typeof x.shippingCostBaht === 'number' && Number.isFinite(x.shippingCostBaht)
              ? Math.max(0, x.shippingCostBaht)
              : undefined
          const receiveBranchId =
            x.receiveBranchId === 'somneuk' || x.receiveBranchId === 'ang' ? x.receiveBranchId : undefined
          return {
            id: bid,
            at,
            lines: blines,
            ...(refNos ? { refNos } : {}),
            ...(shippingCostBaht !== undefined ? { shippingCostBaht } : {}),
            ...(receiveBranchId ? { receiveBranchId } : {}),
          }
        })
        .filter(Boolean) as PurchaseOrder['receiveBatches']
    : []

  const vatRatePercent = Math.max(0, Math.min(100, Number(o.vatRatePercent) || 7))
  const billDiscountBaht = Math.max(0, Number(o.billDiscountBaht) || 0)
  const paymentMode =
    o.paymentMode === 'paid_cash' ||
    o.paymentMode === 'paid_transfer' ||
    o.paymentMode === 'payable' ||
    o.paymentMode === 'unpaid'
      ? o.paymentMode
      : 'unpaid'

  const promoGroups: PoPromoGroup[] | undefined = Array.isArray(o.promoGroups)
    ? (o.promoGroups as unknown[]).map((g) => {
        if (!g || typeof g !== 'object') return null
        const gr = g as Record<string, unknown>
        return {
          id: typeof gr.id === 'string' ? gr.id : `pg-${Math.random().toString(36).slice(2, 9)}`,
          name: typeof gr.name === 'string' ? gr.name : 'โปรโมชั่น',
          buyQty: Math.max(1, Number(gr.buyQty) || 1),
          freeQty: Math.max(1, Number(gr.freeQty) || 1),
          lineIds: Array.isArray(gr.lineIds)
            ? (gr.lineIds as unknown[]).filter((x): x is string => typeof x === 'string')
            : [],
        }
      }).filter(Boolean) as PoPromoGroup[]
    : undefined

  const poInvoices: PoInvoice[] | undefined = Array.isArray(o.poInvoices)
    ? (o.poInvoices as unknown[]).map((inv) => {
        if (!inv || typeof inv !== 'object') return null
        const i = inv as Record<string, unknown>
        const invoiceNo = typeof i.invoiceNo === 'string' ? i.invoiceNo.trim() : ''
        if (!invoiceNo) return null
        return {
          id: typeof i.id === 'string' ? i.id : `inv-${Math.random().toString(36).slice(2, 9)}`,
          invoiceNo,
          invoiceDate: typeof i.invoiceDate === 'string' ? i.invoiceDate : new Date().toISOString().slice(0, 10),
          receiveBatchId: typeof i.receiveBatchId === 'string' ? i.receiveBatchId : undefined,
          beforeVatBaht: Math.max(0, Number(i.beforeVatBaht) || 0),
          vatBaht: Math.max(0, Number(i.vatBaht) || 0),
          totalBaht: Math.max(0, Number(i.totalBaht) || 0),
          notes: typeof i.notes === 'string' && i.notes.trim() ? i.notes.trim() : undefined,
        } satisfies PoInvoice
      }).filter(Boolean) as PoInvoice[]
    : undefined

  return {
    id,
    poNo,
    branchId,
    supplierId,
    supplierName,
    status,
    createdAt,
    orderedAt: typeof o.orderedAt === 'string' ? o.orderedAt : undefined,
    closedAt: typeof o.closedAt === 'string' ? o.closedAt : undefined,
    lines,
    receiveBatches,
    vatRatePercent,
    billDiscountBaht,
    paymentMode,
    debtReductionChannel:
      typeof o.debtReductionChannel === 'string' && o.debtReductionChannel.trim()
        ? o.debtReductionChannel.trim()
        : undefined,
    supplierBankAccountRef:
      typeof o.supplierBankAccountRef === 'string' && o.supplierBankAccountRef.trim()
        ? o.supplierBankAccountRef.trim()
        : undefined,
    paymentNote: typeof o.paymentNote === 'string' ? o.paymentNote : undefined,
    paidAt: typeof o.paidAt === 'string' ? o.paidAt : undefined,
    expectedDeliveryAt: typeof o.expectedDeliveryAt === 'string' ? o.expectedDeliveryAt : undefined,
    shippingMethod: typeof o.shippingMethod === 'string' && o.shippingMethod.trim() ? o.shippingMethod.trim() : undefined,
    vatMode: (o.vatMode === 'included' || o.vatMode === 'none') ? (o.vatMode as PoVatMode) : undefined,
    notes: typeof o.notes === 'string' && o.notes.trim() ? o.notes.trim() : undefined,
    invoiceNo: typeof o.invoiceNo === 'string' && o.invoiceNo.trim() ? o.invoiceNo.trim() : undefined,
    trackingNo: typeof o.trackingNo === 'string' && o.trackingNo.trim() ? o.trackingNo.trim() : undefined,
    ...(promoGroups && promoGroups.length > 0 ? { promoGroups } : {}),
    ...(poInvoices && poInvoices.length > 0 ? { poInvoices } : {}),
  }
}

export function savePurchaseOrders(orders: PurchaseOrder[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(orders.slice(0, MAX)))
    window.dispatchEvent(new CustomEvent(PURCHASE_ORDERS_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}

export function upsertPurchaseOrder(po: PurchaseOrder): void {
  const list = loadPurchaseOrders()
  const idx = list.findIndex((p) => p.id === po.id)
  if (idx >= 0) list[idx] = po
  else list.unshift(po)
  savePurchaseOrders(list)
}

export function deletePurchaseOrder(id: string): void {
  savePurchaseOrders(loadPurchaseOrders().filter((p) => p.id !== id))
}

export function clearAllPurchaseOrders(): void {
  savePurchaseOrders([])
}

export async function loadPurchaseOrdersAsync(): Promise<PurchaseOrder[]> {
  if (isTauri()) {
    try {
      const rows = await invoke<unknown[]>('po_list')
      if (Array.isArray(rows) && rows.length > 0) {
        const parsed = rows.map(normalizePo).filter(Boolean) as PurchaseOrder[]
        if (parsed.length > 0) return parsed
      }
    } catch (e) {
      console.warn('po_list failed, falling back to localStorage', e)
    }
  }
  return loadPurchaseOrders()
}

export async function upsertPurchaseOrderAsync(po: PurchaseOrder): Promise<void> {
  upsertPurchaseOrder(po)
  if (isTauri()) {
    await invoke('po_upsert', { payload: po })
  }
}

export async function deletePurchaseOrderAsync(id: string): Promise<void> {
  deletePurchaseOrder(id)
  if (isTauri()) {
    await invoke('po_delete', { id })
  }
}
