import type { BranchId } from '@/features/auth/branches'
import type { PurchaseOrder } from '@/features/purchase/data/poTypes'

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
      return { lineId, productId, sku, name, orderedQty, unitCostOrder, receivedQtyTotal }
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
              if (!lineId || qty <= 0) return null
              return { lineId, qty, unitCost }
            })
            .filter(Boolean) as PurchaseOrder['receiveBatches'][0]['lines']
          if (blines.length === 0) return null
          return { id: bid, at, lines: blines }
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
    paymentNote: typeof o.paymentNote === 'string' ? o.paymentNote : undefined,
    paidAt: typeof o.paidAt === 'string' ? o.paidAt : undefined,
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
