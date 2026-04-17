import { getStoredBranch } from '@/features/auth/authSession'
import { masterSearchExtrasForSku } from '@/features/inventory/data/productMasterData'
import type { InventoryProduct } from '@/features/inventory/data/mockInventory'
import {
  loadPurchaseOrders,
  PURCHASE_ORDERS_CHANGED_EVENT,
  upsertPurchaseOrder,
  deletePurchaseOrder,
} from '@/features/purchase/data/poStore'
import { SupplierProfileModal } from '@/features/purchase/components/SupplierProfileModal'
import {
  getSupplierProfile,
  loadSupplierDirectory,
  supplierPaymentMethodsLabel,
  SUPPLIER_DIRECTORY_CHANGED_EVENT,
} from '@/features/purchase/data/supplierDirectoryStore'
import type { SupplierProfile } from '@/features/purchase/data/supplierDirectoryStore'
import { mergeLinePatchForOrdered, mergeReceivedQtyTotal } from '@/features/purchase/data/poLineEdit'
import type { PurchaseOrder, PurchaseOrderLine, PoReceiveLine } from '@/features/purchase/data/poTypes'
import { nextPurchaseOrderNo } from '@/features/purchase/data/poSequence'
import {
  applyMovingAverageCost,
  getLatestUnitCostForPo,
  getOnHandQtyBeforeReceive,
} from '@/features/purchase/data/poMovingAverage'
import { applySignedReceiveQtyToBranchStock, receiveQtyToBranchStock } from '@/features/purchase/data/poStockReceive'
import { printPurchaseOrder } from '@/features/purchase/utils/printPurchaseOrder'
import {
  DEBT_REDUCTION_CHANNELS_CHANGED_EVENT,
  loadDebtReductionChannels,
} from '@/features/finance/data/debtReductionChannelsStore'
import { CREDIT_TERMS_CHANGED_EVENT, getSupplierCreditTerms } from '@/features/finance/data/creditTermsStore'
import {
  describeSupplierCreditRule,
  supplierPayDueDate,
  toIsoDateOnly,
} from '@/features/finance/data/supplierPaymentDueDate'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { clsx } from 'clsx'
import {
  ClipboardList,
  PackagePlus,
  Printer,
  UserPlus,
  Search,
  Trash2,
  Truck,
  CheckCircle2,
  FileEdit,
  CircleDollarSign,
  RotateCcw,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type PurchaseOrdersWorkspacePageProps = {
  className?: string
}

function newLineId(): string {
  return `ln-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function newPoId(): string {
  return `po-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function sumReceiveBatches(po: PurchaseOrder): number {
  let s = 0
  for (const b of po.receiveBatches) {
    for (const ln of b.lines) {
      s += ln.qty * ln.unitCost
    }
  }
  return Math.round(s * 100) / 100
}

function orderedSubtotal(po: PurchaseOrder): number {
  return Math.round(po.lines.reduce((a, l) => a + l.orderedQty * l.unitCostOrder, 0) * 100) / 100
}

function paymentBase(po: PurchaseOrder): number {
  const r = sumReceiveBatches(po)
  return r > 0 ? r : orderedSubtotal(po)
}

function vatAmount(po: PurchaseOrder): number {
  const base = paymentBase(po)
  return Math.round((base * po.vatRatePercent) / 100 * 100) / 100
}

function grandTotal(po: PurchaseOrder): number {
  return Math.round((paymentBase(po) + vatAmount(po) - po.billDiscountBaht) * 100) / 100
}

function parseLocalNoonFromIso(iso: string): Date {
  const part = (iso.split('T')[0] ?? iso).trim()
  const [ys, ms, ds] = part.split('-')
  const y = Number.parseInt(ys ?? '', 10)
  const m = Number.parseInt(ms ?? '', 10)
  const d = Number.parseInt(ds ?? '', 10)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return new Date()
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

/** วันที่อ้างอิงเครดิต: รับของล่าสุด → สั่ง → สร้างร่าง */
function creditAnchorDateForPo(po: PurchaseOrder): Date {
  const last = po.receiveBatches.at(-1)?.at
  if (last) return parseLocalNoonFromIso(last)
  if (po.orderedAt) return parseLocalNoonFromIso(po.orderedAt)
  return parseLocalNoonFromIso(po.createdAt)
}

function lineBackorder(l: PurchaseOrderLine): number {
  return Math.max(0, l.orderedQty - l.receivedQtyTotal)
}

function statusLabel(po: PurchaseOrder): string {
  if (po.status === 'draft') return 'Draft'
  if (po.status === 'closed') return 'ปิดแล้ว'
  const bo = po.lines.some((l) => lineBackorder(l) > 0)
  if (bo && po.receiveBatches.length > 0) return 'Ordered · ค้างรับ'
  return 'Ordered'
}

function searchProducts(q: string): InventoryProduct[] {
  const t = q.trim().toLowerCase()
  if (!t) return []
  const cat = getPosCatalogProducts()
  const out: InventoryProduct[] = []
  for (const p of cat) {
    const extra = masterSearchExtrasForSku(p.sku).toLowerCase()
    if (
      p.sku.toLowerCase().includes(t) ||
      p.name.toLowerCase().includes(t) ||
      (p.factoryOem && p.factoryOem.toLowerCase().includes(t)) ||
      (p.genuineNo && p.genuineNo.toLowerCase().includes(t)) ||
      extra.includes(t)
    ) {
      out.push(p)
      if (out.length >= 50) break
    }
  }
  return out
}

export function PurchaseOrdersWorkspacePage({ className }: PurchaseOrdersWorkspacePageProps) {
  const branch = getStoredBranch()
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => loadPurchaseOrders())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [productQuery, setProductQuery] = useState('')
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [receiveDraft, setReceiveDraft] = useState<Record<string, { qty: string; cost: string }>>({})

  const refresh = useCallback(() => setOrders(loadPurchaseOrders()), [])

  useEffect(() => {
    const on = () => refresh()
    window.addEventListener(PURCHASE_ORDERS_CHANGED_EVENT, on)
    return () => window.removeEventListener(PURCHASE_ORDERS_CHANGED_EVENT, on)
  }, [refresh])

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId],
  )

  const [creditTick, setCreditTick] = useState(0)
  const [supplierDirTick, setSupplierDirTick] = useState(0)
  const [debtChannelsTick, setDebtChannelsTick] = useState(0)
  const [supplierModal, setSupplierModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    profile: SupplierProfile | null
  }>({ open: false, mode: 'create', profile: null })

  useEffect(() => {
    const on = () => setCreditTick((n) => n + 1)
    window.addEventListener(CREDIT_TERMS_CHANGED_EVENT, on)
    return () => window.removeEventListener(CREDIT_TERMS_CHANGED_EVENT, on)
  }, [])

  useEffect(() => {
    const on = () => setSupplierDirTick((n) => n + 1)
    window.addEventListener(SUPPLIER_DIRECTORY_CHANGED_EVENT, on)
    return () => window.removeEventListener(SUPPLIER_DIRECTORY_CHANGED_EVENT, on)
  }, [])

  useEffect(() => {
    const on = () => setDebtChannelsTick((n) => n + 1)
    window.addEventListener(DEBT_REDUCTION_CHANNELS_CHANGED_EVENT, on)
    return () => window.removeEventListener(DEBT_REDUCTION_CHANNELS_CHANGED_EVENT, on)
  }, [])

  const suppliers = useMemo(() => loadSupplierDirectory(), [supplierDirTick])
  const debtReductionChannels = useMemo(() => loadDebtReductionChannels(), [debtChannelsTick])

  const payableDuePreview = useMemo(() => {
    if (!selected || selected.paymentMode !== 'payable') return null
    const anchor = creditAnchorDateForPo(selected)
    const terms = getSupplierCreditTerms(selected.supplierId)
    const due = supplierPayDueDate(anchor, terms)
    return {
      anchor,
      due,
      terms,
      anchorLabel: selected.receiveBatches.length ? 'วันรับของล่าสุด' : 'วันสั่งซื้อ',
    }
  }, [selected, creditTick])

  const searchHits = useMemo(() => searchProducts(productQuery), [productQuery])

  const createDraft = () => {
    if (!branch) return
    const list = loadSupplierDirectory()
    const first = list[0]
    if (!first) {
      window.alert('ยังไม่มีผู้จัดจำหน่ายในระบบ — กด «เพิ่มผู้จัดจำหน่าย» ก่อน')
      return
    }
    const po: PurchaseOrder = {
      id: newPoId(),
      poNo: `DR-${Date.now().toString(36).toUpperCase()}`,
      branchId: branch.id,
      supplierId: first.id,
      supplierName: first.name,
      status: 'draft',
      createdAt: new Date().toISOString(),
      lines: [],
      receiveBatches: [],
      vatRatePercent: 7,
      billDiscountBaht: 0,
      paymentMode: 'unpaid',
    }
    upsertPurchaseOrder(po)
    refresh()
    setSelectedId(po.id)
  }

  const updateSelected = (next: PurchaseOrder) => {
    upsertPurchaseOrder(next)
    refresh()
  }

  const addLine = (p: InventoryProduct) => {
    if (!selected || selected.status !== 'draft') return
    if (selected.lines.some((l) => l.productId === p.id)) return
    const unit = getLatestUnitCostForPo(p)
    const line: PurchaseOrderLine = {
      lineId: newLineId(),
      productId: p.id,
      sku: p.sku,
      name: p.name,
      orderedQty: 1,
      unitCostOrder: unit,
      receivedQtyTotal: 0,
    }
    updateSelected({ ...selected, lines: [...selected.lines, line] })
    setProductQuery('')
  }

  const patchLine = (lineId: string, patch: Partial<PurchaseOrderLine>) => {
    if (!selected) return
    if (selected.status === 'draft') {
      updateSelected({
        ...selected,
        lines: selected.lines.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l)),
      })
      return
    }
    if (selected.status !== 'ordered' && selected.status !== 'closed') return
    const line = selected.lines.find((l) => l.lineId === lineId)
    if (!line) return
    const onlyQtyCost: Partial<Pick<PurchaseOrderLine, 'orderedQty' | 'unitCostOrder'>> = {}
    if (patch.orderedQty !== undefined) onlyQtyCost.orderedQty = patch.orderedQty
    if (patch.unitCostOrder !== undefined) onlyQtyCost.unitCostOrder = patch.unitCostOrder
    if (Object.keys(onlyQtyCost).length === 0) return
    const result = mergeLinePatchForOrdered(line, onlyQtyCost)
    if (!result.ok) {
      window.alert(result.message)
      return
    }
    updateSelected({
      ...selected,
      lines: selected.lines.map((l) => (l.lineId === lineId ? result.line : l)),
    })
  }

  const patchReceivedTotal = (lineId: string, raw: number) => {
    if (!selected || (selected.status !== 'ordered' && selected.status !== 'closed')) return
    const line = selected.lines.find((l) => l.lineId === lineId)
    if (!line) return
    const result = mergeReceivedQtyTotal(line, raw)
    if (!result.ok) {
      window.alert(result.message)
      return
    }
    if (Math.abs(result.delta) < 1e-9) return
    const cat = getPosCatalogProducts()
    const p = cat.find((x) => x.id === line.productId)
    if (!p) {
      window.alert('ไม่พบสินค้าในแคตตาล็อก')
      return
    }
    try {
      applySignedReceiveQtyToBranchStock(line.productId, result.delta)
      if (result.delta > 0) {
        applyMovingAverageCost(line.productId, result.delta, line.unitCostOrder, p)
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'ปรับสต็อกไม่สำเร็จ')
      return
    }
    const nextLines = selected.lines.map((l) => (l.lineId === lineId ? result.line : l))
    const afterAllReceived = nextLines.every((l) => l.receivedQtyTotal + 1e-9 >= l.orderedQty)
    updateSelected({
      ...selected,
      lines: nextLines,
      ...(!afterAllReceived ? { status: 'ordered' as const, closedAt: undefined } : {}),
    })
  }

  const removeLine = (lineId: string) => {
    if (!selected || selected.status !== 'draft') return
    updateSelected({ ...selected, lines: selected.lines.filter((l) => l.lineId !== lineId) })
  }

  const confirmOrder = () => {
    if (!selected || !branch) return
    if (selected.status !== 'draft') return
    if (!selected.lines.length) {
      window.alert('กรุณาเพิ่มรายการสินค้าก่อนยืนยัน')
      return
    }
    if (!window.confirm('ยืนยันใบสั่งซื้อ — เอกสารจะล็อกแก้ไขรายการ และออกเลข PO จริง?')) return
    const poNo = nextPurchaseOrderNo(branch.id)
    updateSelected({
      ...selected,
      status: 'ordered',
      poNo,
      orderedAt: new Date().toISOString(),
    })
    window.alert(`สถานะ: Ordered\nเลขที่ PO: ${poNo}`)
  }

  const openReceive = () => {
    if (!selected || selected.status !== 'ordered') return
    const draft: Record<string, { qty: string; cost: string }> = {}
    for (const l of selected.lines) {
      const remain = lineBackorder(l)
      if (remain > 0) {
        draft[l.lineId] = {
          qty: String(remain),
          cost: String(l.unitCostOrder),
        }
      }
    }
    setReceiveDraft(draft)
    setReceiveOpen(true)
  }

  const submitReceive = () => {
    if (!selected || selected.status !== 'ordered') return
    const cat = getPosCatalogProducts()
    const lines: PoReceiveLine[] = []
    for (const l of selected.lines) {
      const d = receiveDraft[l.lineId]
      if (!d) continue
      const qty = Number.parseFloat(d.qty.replace(/,/g, '')) || 0
      const unitCost = Number.parseFloat(d.cost.replace(/,/g, '')) || 0
      if (qty <= 0) continue
      const remain = lineBackorder(l)
      if (qty > remain + 1e-6) {
        window.alert(`จำนวนรับเกินค้างรับสำหรับ ${l.sku} (คงเหลือสั่ง ${l.orderedQty}, รับแล้ว ${l.receivedQtyTotal})`)
        return
      }
      lines.push({ lineId: l.lineId, qty, unitCost })
    }
    if (!lines.length) {
      const hasPending = selected.lines.some((ln) => lineBackorder(ln) > 0)
      if (hasPending) {
        window.alert('กรอกจำนวนที่รับจริงอย่างน้อย 1 แถว')
        return
      }
      setReceiveOpen(false)
      return
    }

    const nextLines = selected.lines.map((l) => {
      const hit = lines.find((x) => x.lineId === l.lineId)
      if (!hit) return l
      return { ...l, receivedQtyTotal: l.receivedQtyTotal + hit.qty }
    })

    const byProduct = new Map<string, { qty: number; value: number }>()
    for (const hit of lines) {
      const row = selected.lines.find((x) => x.lineId === hit.lineId)
      if (!row) continue
      const cur = byProduct.get(row.productId) ?? { qty: 0, value: 0 }
      byProduct.set(row.productId, {
        qty: cur.qty + hit.qty,
        value: cur.value + hit.qty * hit.unitCost,
      })
    }

    try {
      for (const [productId, agg] of byProduct) {
        const p = cat.find((x) => x.id === productId)
        if (!p) throw new Error(`ไม่พบสินค้าในแคตตาล็อก: ${productId}`)
        const unitAvg = agg.qty > 0 ? agg.value / agg.qty : 0
        applyMovingAverageCost(productId, agg.qty, unitAvg, p)
        receiveQtyToBranchStock(productId, agg.qty)
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'รับสินค้าไม่สำเร็จ')
      return
    }

    const batch = {
      id: `rcv-${Date.now()}`,
      at: new Date().toISOString(),
      lines,
    }
    updateSelected({
      ...selected,
      lines: nextLines,
      receiveBatches: [...selected.receiveBatches, batch],
    })
    setReceiveOpen(false)
    window.alert('รับสินค้าแล้ว — สต็อกและต้นทุนเฉลี่ยอัปเดตแล้ว')
  }

  const savePayment = () => {
    if (!selected) return
    if (selected.status === 'draft') {
      window.alert('ยืนยันใบสั่งซื้อ (Ordered) ก่อนบันทึกการชำระ')
      return
    }
    updateSelected({ ...selected, paidAt: new Date().toISOString() })
    window.alert('บันทึกการชำระ / เจ้าหนี้แล้ว')
  }

  const closePo = () => {
    if (!selected || selected.status !== 'ordered') return
    if (!window.confirm('ปิดเอกสาร PO นี้? (ค้างรับจะไม่ถูกติดตามในรายการเปิด)')) return
    updateSelected({ ...selected, status: 'closed', closedAt: new Date().toISOString() })
  }

  const reopenPo = () => {
    if (!selected || selected.status !== 'closed') return
    if (
      !window.confirm(
        'เปิด PO กลับเป็น Ordered?\n\n' +
          '• รับของ / แก้ไขข้อมูลที่เกี่ยวข้องได้อีก\n' +
          '• ถ้าเคยบันทึกชำระ/เจ้าหนี้ไว้แล้ว ให้ตรวจสอบความสอดคล้องกับบัญชีเอง',
      )
    ) {
      return
    }
    updateSelected({ ...selected, status: 'ordered', closedAt: undefined })
    window.alert(`เปิด PO แล้ว — ${selected.poNo} กลับเป็นสถานะ Ordered`)
  }

  const deleteDraft = () => {
    if (!selected || selected.status !== 'draft') return
    if (!window.confirm('ลบร่างนี้?')) return
    deletePurchaseOrder(selected.id)
    refresh()
    setSelectedId(null)
  }

  const printPo = () => {
    if (!selected || selected.status === 'draft') return
    const shop = branch?.name ?? 'ร้าน'
    printPurchaseOrder(selected, shop)
  }

  const openSupplierCreate = () => {
    setSupplierModal({ open: true, mode: 'create', profile: null })
  }

  const openSupplierEdit = () => {
    if (!selected) return
    const p = getSupplierProfile(selected.supplierId)
    if (!p) {
      window.alert('ไม่พบข้อมูลผู้จัดจำหน่ายในแฟ้ม — เลือกจากรายการหรือเพิ่มผู้จัดจำหน่ายใหม่')
      return
    }
    setSupplierModal({ open: true, mode: 'edit', profile: p })
  }

  const handleSupplierSaved = (p: SupplierProfile, mode: 'create' | 'edit') => {
    if (selected) {
      if (mode === 'create') {
        updateSelected({ ...selected, supplierId: p.id, supplierName: p.name })
      } else if (selected.supplierId === p.id) {
        updateSelected({ ...selected, supplierName: p.name })
      }
    }
  }

  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm',
        className,
      )}
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-amber-600" aria-hidden />
          <div>
            <h1 className="text-sm font-bold text-slate-900">ใบสั่งซื้อ (PO)</h1>
            <p className="text-[11px] text-slate-500">
              Draft → Ordered → รับของ / ค้างรับ → ชำระหรือเจ้าหนี้ · สาขา {branch?.name ?? '—'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={createDraft}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
        >
          <PackagePlus className="size-4" aria-hidden />
          สร้างร่าง PO
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4 lg:flex-row">
        <section className="flex min-h-0 w-full shrink-0 flex-col lg:max-w-md lg:pr-2">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">รายการเอกสาร</h2>
          <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-2 py-2">เลขที่</th>
                  <th className="px-2 py-2">ซัพพลายเออร์</th>
                  <th className="px-2 py-2">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-slate-400">
                      ยังไม่มีใบสั่งซื้อ — กด «สร้างร่าง PO»
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr
                      key={o.id}
                      className={clsx(
                        'cursor-pointer border-t border-slate-100 hover:bg-amber-50/60',
                        selectedId === o.id && 'bg-amber-50',
                      )}
                      onClick={() => setSelectedId(o.id)}
                    >
                      <td className="px-2 py-2 font-mono font-medium">{o.poNo}</td>
                      <td className="max-w-[8rem] truncate px-2 py-2">{o.supplierName}</td>
                      <td className="px-2 py-2 text-[10px] font-semibold text-slate-600">{statusLabel(o)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="min-h-0 min-w-0 flex-1 space-y-4">
          {!selected ? (
            <p className="text-sm text-slate-500">เลือกเอกสารจากรายการด้านซ้าย หรือสร้างร่างใหม่</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-lg font-bold text-slate-900">{selected.poNo}</p>
                  <p className="text-xs text-slate-500">{statusLabel(selected)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.status === 'draft' && (
                    <button
                      type="button"
                      onClick={deleteDraft}
                      className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-800"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      ลบร่าง
                    </button>
                  )}
                  {selected.status === 'ordered' && (
                    <>
                      <button
                        type="button"
                        onClick={printPo}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold shadow-sm"
                      >
                        <Printer className="size-3.5" aria-hidden />
                        พิมพ์ PO
                      </button>
                      <button
                        type="button"
                        onClick={openReceive}
                        className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-semibold text-emerald-900"
                      >
                        <Truck className="size-3.5" aria-hidden />
                        รับสินค้า
                      </button>
                      <button
                        type="button"
                        onClick={closePo}
                        className="inline-flex items-center gap-1 rounded border border-slate-300 bg-slate-100 px-2 py-1.5 text-xs font-semibold"
                      >
                        <CheckCircle2 className="size-3.5" aria-hidden />
                        ปิด PO
                      </button>
                    </>
                  )}
                  {selected.status === 'closed' && (
                    <>
                      <button
                        type="button"
                        onClick={printPo}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold shadow-sm"
                      >
                        <Printer className="size-3.5" aria-hidden />
                        พิมพ์ PO
                      </button>
                      <button
                        type="button"
                        onClick={reopenPo}
                        className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-900"
                      >
                        <RotateCcw className="size-3.5" aria-hidden />
                        เปิด PO กลับ
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500">
                    ผู้จัดจำหน่าย / ร้านค้าส่ง
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={openSupplierCreate}
                      className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900 hover:bg-amber-100"
                    >
                      <UserPlus className="size-3" aria-hidden />
                      เพิ่มผู้จัดจำหน่าย
                    </button>
                    <button
                      type="button"
                      onClick={openSupplierEdit}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      รายละเอียด / เครดิต
                    </button>
                  </div>
                </div>
                <select
                  value={selected.supplierId}
                  disabled={selected.status !== 'draft'}
                  onChange={(e) => {
                    const s = suppliers.find((x) => x.id === e.target.value)
                    updateSelected({
                      ...selected,
                      supplierId: e.target.value,
                      supplierName: s?.name ?? '',
                    })
                  }}
                  className="w-full max-w-md rounded border border-slate-200 bg-white px-2 py-2 text-sm disabled:bg-slate-100"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.supplierCode} — {s.name}
                    </option>
                  ))}
                </select>

                {(() => {
                  const prof = getSupplierProfile(selected.supplierId)
                  if (!prof) {
                    return (
                      <p className="mt-2 text-[11px] text-amber-800">
                        ยังไม่มีรายละเอียดในแฟ้ม — กด «รายละเอียด / เครดิต» เพื่อกรอก
                      </p>
                    )
                  }
                  return (
                    <dl className="mt-3 grid gap-1.5 text-[11px] text-slate-700 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <dt className="font-semibold text-slate-500">รหัส</dt>
                        <dd className="font-mono text-slate-900">{prof.supplierCode}</dd>
                      </div>
                      {prof.taxId ? (
                        <div>
                          <dt className="font-semibold text-slate-500">เลขผู้เสียภาษี</dt>
                          <dd>{prof.taxId}</dd>
                        </div>
                      ) : null}
                      {prof.phone ? (
                        <div>
                          <dt className="font-semibold text-slate-500">โทรศัพท์</dt>
                          <dd>{prof.phone}</dd>
                        </div>
                      ) : null}
                      {prof.address ? (
                        <div className="sm:col-span-2">
                          <dt className="font-semibold text-slate-500">ที่อยู่</dt>
                          <dd className="whitespace-pre-wrap">{prof.address}</dd>
                        </div>
                      ) : null}
                      {prof.notes ? (
                        <div className="sm:col-span-2">
                          <dt className="font-semibold text-slate-500">หมายเหตุ</dt>
                          <dd className="whitespace-pre-wrap text-slate-600">{prof.notes}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="font-semibold text-slate-500">ชำระเงิน</dt>
                        <dd>{supplierPaymentMethodsLabel(prof)}</dd>
                      </div>
                      {prof.bankAccounts && prof.bankAccounts.length > 0 ? (
                        <div className="sm:col-span-2 space-y-1.5">
                          <div className="text-[11px] font-semibold text-slate-500">บัญชีรับโอน</div>
                          {prof.bankAccounts.map((a, i) => (
                            <div
                              key={`${prof.id}-ba-${i}`}
                              className="rounded border border-slate-100 bg-white px-2 py-1.5 text-[11px] text-slate-800"
                            >
                              <div className="mb-0.5 text-[10px] font-semibold text-slate-500">บัญชีที่ {i + 1}</div>
                              {a.bankName ? <div>ธนาคาร: {a.bankName}</div> : null}
                              {a.accountNo ? <div className="font-mono">เลขที่บัญชี: {a.accountNo}</div> : null}
                              {a.accountName ? <div>ชื่อบัญชี: {a.accountName}</div> : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <div className="sm:col-span-2 border-t border-slate-200 pt-2 text-[10px] text-slate-600">
                        {describeSupplierCreditRule(getSupplierCreditTerms(prof.id))}
                      </div>
                    </dl>
                  )
                })()}
              </div>

              {selected.status === 'draft' && (
                <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/40 p-3">
                  <div className="relative mb-2">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      placeholder="ค้นหา SKU / OEM / เบอร์แท้ / ชื่อสินค้า..."
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                  {searchHits.length > 0 && (
                    <ul className="max-h-40 overflow-auto rounded border border-slate-200 bg-white text-sm shadow-sm">
                      {searchHits.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => addLine(p)}
                            className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-amber-50"
                          >
                            <span className="font-mono text-xs text-amber-800">{p.sku}</span>
                            <span className="text-xs text-slate-700">{p.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div>
                <h3 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-slate-500">
                  <FileEdit className="size-3.5" aria-hidden />
                  รายการสินค้า
                </h3>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[640px] text-xs">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-2 py-2 text-left">SKU</th>
                        <th className="px-2 py-2 text-left">ชื่อ</th>
                        <th className="px-2 py-2 text-right">สั่ง</th>
                        <th className="px-2 py-2 text-right">ต้นทุน/หน่วย</th>
                        <th className="px-2 py-2 text-right">รับแล้ว</th>
                        <th className="px-2 py-2 text-right">ค้างรับ</th>
                        {selected.status === 'draft' && <th className="px-2 py-2" />}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.lines.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                            {selected.status === 'draft' ? 'ค้นหาและเพิ่มสินค้า — ยังไม่กระทบสต็อก' : 'ไม่มีรายการ'}
                          </td>
                        </tr>
                      ) : (
                        selected.lines.map((l) => (
                          <tr key={l.lineId} className="border-t border-slate-100">
                            <td className="px-2 py-2 font-mono">{l.sku}</td>
                            <td className="max-w-[14rem] truncate px-2 py-2">{l.name}</td>
                            <td className="px-2 py-2 text-right">
                              {selected.status === 'draft' ? (
                                <input
                                  type="number"
                                  min={1}
                                  value={l.orderedQty}
                                  onChange={(e) =>
                                    patchLine(l.lineId, { orderedQty: Math.max(1, Number(e.target.value) || 1) })
                                  }
                                  className="w-16 rounded border px-1 py-0.5 text-right"
                                />
                              ) : selected.status === 'ordered' || selected.status === 'closed' ? (
                                <input
                                  type="number"
                                  min={Math.max(1, l.receivedQtyTotal)}
                                  step="any"
                                  value={l.orderedQty}
                                  onChange={(e) =>
                                    patchLine(l.lineId, { orderedQty: Number.parseFloat(e.target.value) || 0 })
                                  }
                                  className="w-16 rounded border px-1 py-0.5 text-right"
                                />
                              ) : (
                                l.orderedQty
                              )}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {selected.status === 'draft' ? (
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={l.unitCostOrder}
                                  onChange={(e) =>
                                    patchLine(l.lineId, {
                                      unitCostOrder: Math.max(0, Number.parseFloat(e.target.value) || 0),
                                    })
                                  }
                                  className="w-24 rounded border px-1 py-0.5 text-right"
                                />
                              ) : selected.status === 'ordered' || selected.status === 'closed' ? (
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={l.unitCostOrder}
                                  onChange={(e) =>
                                    patchLine(l.lineId, {
                                      unitCostOrder: Math.max(0, Number.parseFloat(e.target.value) || 0),
                                    })
                                  }
                                  className="w-24 rounded border px-1 py-0.5 text-right"
                                />
                              ) : (
                                l.unitCostOrder.toLocaleString('th-TH', { maximumFractionDigits: 2 })
                              )}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {selected.status === 'ordered' || selected.status === 'closed' ? (
                                <input
                                  type="number"
                                  min={0}
                                  max={l.orderedQty}
                                  step="any"
                                  value={l.receivedQtyTotal}
                                  onChange={(e) =>
                                    patchReceivedTotal(l.lineId, Number.parseFloat(e.target.value) || 0)
                                  }
                                  className="w-16 rounded border px-1 py-0.5 text-right tabular-nums"
                                />
                              ) : (
                                <span className="tabular-nums">{l.receivedQtyTotal}</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums">
                              <span className={lineBackorder(l) > 0 ? 'font-semibold text-amber-700' : ''}>
                                {lineBackorder(l)}
                              </span>
                            </td>
                            {selected.status === 'draft' && (
                              <td className="px-2 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeLine(l.lineId)}
                                  className="text-rose-600 hover:underline"
                                >
                                  ลบ
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {selected.status === 'draft' && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    ต้นทุนที่แสดงดึงจากแฟ้มมาสเตอร์ (avg/cost) — แก้ไขได้ในร่าง · ยังไม่มีผลต่อสต็อก
                  </p>
                )}
                {(selected.status === 'ordered' || selected.status === 'closed') && (
                  <div className="mt-2 space-y-1 text-[11px] text-amber-800">
                    <p>แก้จำนวนสั่ง/ต้นทุนต่อหน่วยได้หากใส่ผิด — จำนวนสั่งต้องไม่น้อยกว่าที่รับแล้วในแต่ละแถว</p>
                    <p className="text-slate-600">
                      แก้ «รับแล้ว» ได้เมื่อตรวจพลาด — ระบบปรับสต็อกตามผลต่าง; ถ้าลดจำนวนรับ ต้นทุนเฉลี่ยไม่คำนวณย้อนอัตโนมัติ
                    </p>
                  </div>
                )}
              </div>

              {selected.status === 'draft' && (
                <button
                  type="button"
                  onClick={confirmOrder}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <CheckCircle2 className="size-4" aria-hidden />
                  ยืนยันการสั่งซื้อ (Ordered)
                </button>
              )}

              {(selected.status === 'ordered' || selected.status === 'closed') && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
                  <h3 className="mb-3 flex items-center gap-1 text-xs font-bold uppercase text-indigo-800">
                    <CircleDollarSign className="size-4" aria-hidden />
                    ชำระเงิน / เจ้าหนี้ (จากมูลค่ารับจริง)
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-[11px] font-medium text-slate-600">
                      VAT (%)
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={selected.vatRatePercent}
                        disabled={selected.status === 'closed'}
                        onChange={(e) =>
                          updateSelected({
                            ...selected,
                            vatRatePercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                          })
                        }
                        className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm disabled:bg-slate-100"
                      />
                    </label>
                    <label className="block text-[11px] font-medium text-slate-600">
                      ส่วนลดท้ายบิล (บาท)
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={selected.billDiscountBaht}
                        disabled={selected.status === 'closed'}
                        onChange={(e) =>
                          updateSelected({
                            ...selected,
                            billDiscountBaht: Math.max(0, Number.parseFloat(e.target.value) || 0),
                          })
                        }
                        className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm disabled:bg-slate-100"
                      />
                    </label>
                    <label className="block text-[11px] font-medium text-slate-600 sm:col-span-2">
                      วิธีชำระ
                      <select
                        value={selected.paymentMode}
                        disabled={selected.status === 'closed'}
                        onChange={(e) => {
                          const paymentMode = e.target.value as PurchaseOrder['paymentMode']
                          const next: PurchaseOrder = {
                            ...selected,
                            paymentMode,
                            debtReductionChannel:
                              paymentMode === 'paid_cash' || paymentMode === 'paid_transfer'
                                ? selected.debtReductionChannel
                                : undefined,
                          }
                          updateSelected(next)
                        }}
                        className="mt-1 w-full max-w-md rounded border border-slate-200 px-2 py-2 text-sm disabled:bg-slate-100"
                      >
                        <option value="unpaid">ยังไม่ชำระ</option>
                        <option value="paid_cash">ชำระเงินสด</option>
                        <option value="paid_transfer">โอน/QR</option>
                        <option value="payable">เครดิต — ลงเจ้าหนี้</option>
                      </select>
                    </label>
                    {(selected.paymentMode === 'paid_cash' || selected.paymentMode === 'paid_transfer') && (
                      <label className="block text-[11px] font-medium text-slate-600 sm:col-span-2">
                        ช่องทางลดหนี้
                        <select
                          value={selected.debtReductionChannel ?? ''}
                          disabled={selected.status === 'closed'}
                          onChange={(e) =>
                            updateSelected({
                              ...selected,
                              debtReductionChannel: e.target.value.trim() || undefined,
                            })
                          }
                          className="mt-1 w-full max-w-md rounded border border-slate-200 px-2 py-2 text-sm disabled:bg-slate-100"
                        >
                          <option value="">— เลือก —</option>
                          {selected.debtReductionChannel &&
                          !debtReductionChannels.includes(selected.debtReductionChannel) ? (
                            <option value={selected.debtReductionChannel}>
                              {selected.debtReductionChannel} (รายการเดิม)
                            </option>
                          ) : null}
                          {debtReductionChannels.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-[10px] text-slate-500">
                          แก้รายการช่องทางได้ที่เมนู <strong className="font-medium text-slate-700">ลูกหนี้/เจ้าหนี้</strong> → ปุ่ม
                          «ช่องทางลดหนี้»
                        </p>
                      </label>
                    )}
                    {payableDuePreview && (
                      <div className="rounded-md border border-indigo-100 bg-white/90 px-3 py-2 text-[11px] leading-relaxed text-indigo-950 sm:col-span-2">
                        <p className="font-semibold text-indigo-900">กำหนดจ่ายเครดิต (ประมาณการ)</p>
                        <p className="mt-1 text-slate-700">
                          อ้างอิง{payableDuePreview.anchorLabel}:{' '}
                          <span className="font-mono tabular-nums">{toIsoDateOnly(payableDuePreview.anchor)}</span>
                          {' · '}
                          ครบกำหนดชำระ (สิ้นเดือน):{' '}
                          <span className="font-semibold">
                            {payableDuePreview.due.toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>{' '}
                          <span className="font-mono text-slate-600">({toIsoDateOnly(payableDuePreview.due)})</span>
                        </p>
                        <p className="mt-1 text-slate-600">{describeSupplierCreditRule(payableDuePreview.terms)}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 space-y-1 rounded border border-white/80 bg-white/80 px-3 py-2 text-sm">
                    <p className="flex justify-between">
                      <span className="text-slate-600">ฐาน (รับจริง / หรือประมาณจากใบสั่ง)</span>
                      <span className="tabular-nums font-medium">
                        {paymentBase(selected).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                      </span>
                    </p>
                    <p className="flex justify-between text-slate-600">
                      <span>VAT {selected.vatRatePercent}%</span>
                      <span className="tabular-nums">{vatAmount(selected).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
                    </p>
                    <p className="flex justify-between text-slate-600">
                      <span>ส่วนลด</span>
                      <span className="tabular-nums">-{selected.billDiscountBaht.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                    </p>
                    <p className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                      <span>ยอดสุทธิ</span>
                      <span className="tabular-nums">{grandTotal(selected).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
                    </p>
                    {selected.debtReductionChannel &&
                    (selected.paymentMode === 'paid_cash' || selected.paymentMode === 'paid_transfer') ? (
                      <p className="border-t border-slate-100 pt-2 text-[11px] text-slate-700">
                        <span className="font-medium text-slate-600">ช่องทางลดหนี้:</span> {selected.debtReductionChannel}
                      </p>
                    ) : null}
                  </div>
                  {selected.status !== 'closed' && (
                    <button
                      type="button"
                      onClick={savePayment}
                      className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      บันทึกการชำระ / เจ้าหนี้
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {receiveOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">รับสินค้า — {selected.poNo}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {selected.lines.some((ln) => lineBackorder(ln) > 0)
                ? 'กรอกจำนวนที่ได้รับจริงและต้นทุนตามบิล — ไม่เกินค้างรับ'
                : 'รับครบแล้ว — แก้จำนวนรับจริงได้ที่ช่อง «รับแล้ว» ในแต่ละแถวด้านล่าง (หรือในตารางด้านบน)'}
            </p>
            <div className="mt-3 space-y-3">
              {selected.lines.map((l) => {
                const remain = lineBackorder(l)
                const pending = remain > 0
                return (
                  <div key={l.lineId} className="rounded border border-slate-100 p-2">
                    <p className="text-xs font-semibold text-slate-800">
                      {l.sku} — {l.name}
                    </p>
                    {pending ? (
                      <>
                        <p className="text-[10px] text-slate-500">
                          ค้างรับ {remain} · สต็อกปัจจุบัน (ก่อนรับ){' '}
                          {(() => {
                            const p = getPosCatalogProducts().find((x) => x.id === l.productId)
                            return p ? getOnHandQtyBeforeReceive(p) : '—'
                          })()}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <label className="text-[11px]">
                            จำนวนรับ
                            <input
                              value={receiveDraft[l.lineId]?.qty ?? ''}
                              onChange={(e) =>
                                setReceiveDraft((d) => {
                                  const cur = d[l.lineId] ?? { qty: '', cost: String(l.unitCostOrder) }
                                  return { ...d, [l.lineId]: { ...cur, qty: e.target.value } }
                                })
                              }
                              className="mt-0.5 block w-24 rounded border px-2 py-1 text-sm"
                            />
                          </label>
                          <label className="text-[11px]">
                            ต้นทุน/หน่วย (บาท)
                            <input
                              value={receiveDraft[l.lineId]?.cost ?? ''}
                              onChange={(e) =>
                                setReceiveDraft((d) => {
                                  const cur = d[l.lineId] ?? { qty: String(remain), cost: '' }
                                  return { ...d, [l.lineId]: { ...cur, cost: e.target.value } }
                                })
                              }
                              className="mt-0.5 block w-28 rounded border px-2 py-1 text-sm"
                            />
                          </label>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] text-slate-500">
                          สั่ง {l.orderedQty} · รับแล้ว {l.receivedQtyTotal} · ค้างรับ 0
                        </p>
                        <label className="mt-2 block text-[11px] font-medium text-slate-700">
                          รับแล้ว (แก้ไขเมื่อตรวจพลาด)
                          <input
                            type="number"
                            min={0}
                            max={l.orderedQty}
                            step="any"
                            value={l.receivedQtyTotal}
                            onChange={(e) =>
                              patchReceivedTotal(l.lineId, Number.parseFloat(e.target.value) || 0)
                            }
                            className="mt-0.5 block w-28 rounded border border-slate-200 px-2 py-1 text-sm tabular-nums"
                          />
                        </label>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReceiveOpen(false)}
                className="rounded border border-slate-200 px-3 py-2 text-sm"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={submitReceive}
                className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
              >
                ยืนยันรับสินค้า
              </button>
            </div>
          </div>
        </div>
      )}

      {supplierModal.open && (
        <SupplierProfileModal
          open
          mode={supplierModal.mode}
          initialProfile={supplierModal.profile}
          onClose={() => setSupplierModal({ open: false, mode: 'create', profile: null })}
          onSaved={handleSupplierSaved}
        />
      )}
    </div>
  )
}
