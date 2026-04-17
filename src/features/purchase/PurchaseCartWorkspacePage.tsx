import { getStoredBranch } from '@/features/auth/authSession'
import { getProductMasterList } from '@/features/inventory/data/productMasterData'
import { getLatestUnitCostForPo } from '@/features/purchase/data/poMovingAverage'
import { nextPurchaseOrderNo } from '@/features/purchase/data/poSequence'
import {
  deletePurchaseOrder,
  loadPurchaseOrders,
  PURCHASE_ORDERS_CHANGED_EVENT,
  upsertPurchaseOrder,
} from '@/features/purchase/data/poStore'
import type { PurchaseOrder } from '@/features/purchase/data/poTypes'
import { loadSupplierDirectory, SUPPLIER_DIRECTORY_CHANGED_EVENT } from '@/features/purchase/data/supplierDirectoryStore'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { mergeInventoryProductsWithLiveStock } from '@/features/pos/data/posLiveStock'
import { clsx } from 'clsx'
import { Clipboard, PackagePlus, Save, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type PurchaseCartWorkspacePageProps = {
  className?: string
}

type PaymentTerm = 'cash' | 'credit'
type ShippingMethod = 'pickup' | 'delivery'

type SmartTier = {
  minQty: number
  newCost: number
}

type SmartAlert = {
  kind: 'warn' | 'ok'
  text: string
}

const SUPPLIER_MOQ_LS_KEY = 'bento.purchase.lowStock.supplierMoqById.v1'
const CART_SUPPLIER_META_LS_KEY = 'bento.purchase.cart.supplierMeta.v1'

function loadSupplierMoqById(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SUPPLIER_MOQ_LS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(parsed)) {
      const n = Math.floor(Number(v))
      if (Number.isFinite(n) && n >= 1) out[k] = n
    }
    return out
  } catch {
    return {}
  }
}

function loadSupplierMetaById(): Record<string, { cashDiscount: number; target: number; rebateBonus: number; creditDays: number }> {
  try {
    const raw = localStorage.getItem(CART_SUPPLIER_META_LS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: Record<string, { cashDiscount: number; target: number; rebateBonus: number; creditDays: number }> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (!v || typeof v !== 'object') continue
      const row = v as Record<string, unknown>
      out[k] = {
        cashDiscount: Math.max(0, Math.min(100, Number(row.cashDiscount) || 0)),
        target: Math.max(0, Number(row.target) || 0),
        rebateBonus: Math.max(0, Number(row.rebateBonus) || 0),
        creditDays: Math.max(0, Math.floor(Number(row.creditDays) || 30)),
      }
    }
    return out
  } catch {
    return {}
  }
}

function supplierMetaFor(
  supplierId: string,
  map: Record<string, { cashDiscount: number; target: number; rebateBonus: number; creditDays: number }>,
): { cashDiscount: number; target: number; rebateBonus: number; creditDays: number } {
  return map[supplierId] ?? { cashDiscount: 0, target: 100000, rebateBonus: 1500, creditDays: 30 }
}

function inferSmartTiers(baseCost: number): SmartTier[] {
  return [
    { minQty: 10, newCost: Math.round(baseCost * 0.98 * 100) / 100 },
    { minQty: 20, newCost: Math.round(baseCost * 0.95 * 100) / 100 },
  ]
}

function parsePromoScheme(s: string | undefined): { buy: number; free: number } | null {
  const m = (s ?? '').match(/(\d+)\s*\+\s*(\d+)/)
  if (!m) return null
  const buy = Number(m[1])
  const free = Number(m[2])
  if (!Number.isFinite(buy) || !Number.isFinite(free) || buy <= 0 || free <= 0) return null
  return { buy, free }
}

function thaiMoney(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function PurchaseCartWorkspacePage({ className }: PurchaseCartWorkspacePageProps) {
  const [tick, setTick] = useState(0)
  const [paymentTerms, setPaymentTerms] = useState<Record<string, PaymentTerm>>({})
  const [shippingMethods, setShippingMethods] = useState<Record<string, ShippingMethod>>({})
  const [shippingCosts, setShippingCosts] = useState<Record<string, number>>({})
  const [supplierAccumulated, setSupplierAccumulated] = useState<Record<string, number>>({})
  const [addPickerOpenBySupplier, setAddPickerOpenBySupplier] = useState<Record<string, boolean>>({})
  const [addProductQueryBySupplier, setAddProductQueryBySupplier] = useState<Record<string, string>>({})
  const [addCategoryBySupplier, setAddCategoryBySupplier] = useState<Record<string, string>>({})
  const [addSubCategoryBySupplier, setAddSubCategoryBySupplier] = useState<Record<string, string>>({})
  const [addSubSubCategoryBySupplier, setAddSubSubCategoryBySupplier] = useState<Record<string, string>>({})

  useEffect(() => {
    const on = () => setTick((n) => n + 1)
    window.addEventListener(PURCHASE_ORDERS_CHANGED_EVENT, on)
    window.addEventListener(SUPPLIER_DIRECTORY_CHANGED_EVENT, on)
    return () => {
      window.removeEventListener(PURCHASE_ORDERS_CHANGED_EVENT, on)
      window.removeEventListener(SUPPLIER_DIRECTORY_CHANGED_EVENT, on)
    }
  }, [])

  const branch = getStoredBranch()
  const branchId = branch?.id
  const orders = useMemo(() => loadPurchaseOrders(), [tick])
  const suppliers = useMemo(() => loadSupplierDirectory(), [tick])
  const products = useMemo(() => mergeInventoryProductsWithLiveStock(getPosCatalogProducts()), [])
  const masterBySku = useMemo(() => new Map(getProductMasterList().map((m) => [m.sku, m] as const)), [])
  const supplierMoqById = useMemo(() => loadSupplierMoqById(), [tick])
  const supplierMetaById = useMemo(() => loadSupplierMetaById(), [tick])

  const draftPOs = useMemo(() => {
    const out: Record<string, PurchaseOrder> = {}
    for (const po of orders) {
      if (po.status !== 'draft') continue
      if (branchId && po.branchId !== branchId) continue
      out[po.supplierId] = po
    }
    return out
  }, [orders, branchId])

  const draftSupplierIds = useMemo(() => Object.keys(draftPOs), [draftPOs])

  const clearSupplierDraftUiState = (supplierId: string) => {
    setPaymentTerms((cur) => {
      if (!(supplierId in cur)) return cur
      const next = { ...cur }
      delete next[supplierId]
      return next
    })
    setShippingMethods((cur) => {
      if (!(supplierId in cur)) return cur
      const next = { ...cur }
      delete next[supplierId]
      return next
    })
    setShippingCosts((cur) => {
      if (!(supplierId in cur)) return cur
      const next = { ...cur }
      delete next[supplierId]
      return next
    })
  }

  const updateQty = (supplierId: string, lineId: string, nextQty: number) => {
    const po = draftPOs[supplierId]
    if (!po) return
    const qty = Math.max(1, Math.floor(nextQty))
    const nextLines = po.lines.map((ln) => {
      if (ln.lineId !== lineId) return ln
      const tiers = inferSmartTiers(ln.unitCostOrder)
      const hit = [...tiers].reverse().find((t) => qty >= t.minQty)
      return {
        ...ln,
        orderedQty: qty,
        unitCostOrder: hit ? hit.newCost : ln.unitCostOrder,
      }
    })
    upsertPurchaseOrder({ ...po, lines: nextLines })
  }

  const updateCost = (supplierId: string, lineId: string, nextCost: number) => {
    const po = draftPOs[supplierId]
    if (!po) return
    const cost = Math.max(0, Number(nextCost) || 0)
    upsertPurchaseOrder({
      ...po,
      lines: po.lines.map((ln) => (ln.lineId === lineId ? { ...ln, unitCostOrder: cost } : ln)),
    })
  }

  const removeLine = (supplierId: string, lineId: string) => {
    const po = draftPOs[supplierId]
    if (!po) return
    const nextLines = po.lines.filter((ln) => ln.lineId !== lineId)
    if (nextLines.length === 0) {
      deletePurchaseOrder(po.id)
      clearSupplierDraftUiState(supplierId)
      return
    }
    upsertPurchaseOrder({ ...po, lines: nextLines })
  }

  const handleAddNewItemToDraft = (supplierId: string, productId: string) => {
    const po = draftPOs[supplierId]
    if (!po || !productId) return
    if (po.lines.some((ln) => ln.productId === productId)) return
    const p = products.find((x) => x.id === productId)
    if (!p) return
    upsertPurchaseOrder({
      ...po,
      lines: [
        ...po.lines,
        {
          lineId: `ln-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          productId: p.id,
          sku: p.sku,
          name: p.name,
          orderedQty: 1,
          unitCostOrder: getLatestUnitCostForPo(p),
          receivedQtyTotal: 0,
        },
      ],
    })
  }

  const getSmartAlerts = (supplierId: string, line: PurchaseOrder['lines'][number]): SmartAlert[] => {
    const alerts: SmartAlert[] = []
    const moq = supplierMoqById[supplierId] ?? 1
    if (line.orderedQty < moq) {
      alerts.push({ kind: 'warn', text: `MOQ ขั้นต่ำ ${moq} (ขาดอีก ${moq - line.orderedQty})` })
    } else if (line.orderedQty % moq !== 0) {
      alerts.push({ kind: 'warn', text: `ไม่เต็มรอบ MOQ · เพิ่มอีก ${moq - (line.orderedQty % moq)}` })
    } else {
      alerts.push({ kind: 'ok', text: `ครบ MOQ (${moq})` })
    }

    const promo = parsePromoScheme(masterBySku.get(line.sku)?.scheme)
    if (promo) {
      const free = Math.floor(line.orderedQty / promo.buy) * promo.free
      if (free > 0) alerts.push({ kind: 'ok', text: `โปร ${promo.buy}+${promo.free} ได้แถม ${free}` })
      else alerts.push({ kind: 'warn', text: `โปร ${promo.buy}+${promo.free} · ขาดอีก ${promo.buy - line.orderedQty}` })
    }

    const tiers = inferSmartTiers(line.unitCostOrder)
    const nextTier = tiers.find((t) => line.orderedQty < t.minQty)
    if (nextTier) {
      alerts.push({
        kind: 'warn',
        text: `Tier ราคา · ซื้อเพิ่ม ${nextTier.minQty - line.orderedQty} เพื่อเหลือ ${thaiMoney(nextTier.newCost)}`,
      })
    } else {
      alerts.push({ kind: 'ok', text: 'ถึง Tier ราคาดีสุดแล้ว' })
    }
    return alerts
  }

  const copyToLine = async (supplierId: string) => {
    const po = draftPOs[supplierId]
    const supplier = suppliers.find((s) => s.id === supplierId)
    if (!po || !supplier) return
    const lines = po.lines
      .map((ln, i) => `${i + 1}) ${ln.sku} ${ln.name} x${ln.orderedQty} @${thaiMoney(ln.unitCostOrder)}`)
      .join('\n')
    const text = `สั่งซื้อ ${supplier.name}\n${lines}`
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      window.alert('คัดลอกข้อความแล้ว')
    } catch {
      window.alert('คัดลอกไม่สำเร็จ')
    }
  }

  const savePO = (supplierId: string) => {
    const po = draftPOs[supplierId]
    if (!po || !branchId) return
    if (!po.lines.length) {
      window.alert('ไม่มีรายการในตะกร้า')
      return
    }
    const supplier = suppliers.find((s) => s.id === supplierId)
    const meta = supplierMetaFor(supplierId, supplierMetaById)
    const subtotal = po.lines.reduce((s, ln) => s + ln.orderedQty * ln.unitCostOrder, 0)
    const discount = paymentTerms[supplierId] === 'cash' ? (subtotal * meta.cashDiscount) / 100 : 0
    const vat = (subtotal - discount) * 0.07
    const shipping = Math.max(0, shippingCosts[supplierId] ?? 0)
    const grand = subtotal - discount + vat + shipping

    const nextPo: PurchaseOrder = {
      ...po,
      poNo: nextPurchaseOrderNo(branchId),
      status: 'ordered',
      orderedAt: new Date().toISOString(),
      paymentMode: paymentTerms[supplierId] === 'cash' ? 'paid_cash' : 'payable',
      vatRatePercent: 7,
      billDiscountBaht: Math.round(discount * 100) / 100,
      paymentNote: [
        `shippingMethod=${shippingMethods[supplierId] ?? 'delivery'}`,
        `shippingCost=${shipping.toFixed(2)}`,
        `grandTotal=${grand.toFixed(2)}`,
        `creditDays=${meta.creditDays}`,
        supplier ? `supplier=${supplier.name}` : '',
      ]
        .filter(Boolean)
        .join(' | '),
    }
    upsertPurchaseOrder(nextPo)

    setPaymentTerms((cur) => {
      const next = { ...cur }
      delete next[supplierId]
      return next
    })
    setShippingMethods((cur) => {
      const next = { ...cur }
      delete next[supplierId]
      return next
    })
    setShippingCosts((cur) => {
      const next = { ...cur }
      delete next[supplierId]
      return next
    })
    setSupplierAccumulated((cur) => ({
      ...cur,
      [supplierId]: (cur[supplierId] ?? 0) + grand,
    }))
    window.alert(`บันทึก PO แล้ว (${nextPo.poNo})`)
  }

  return (
    <div className={clsx('flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white', className)}>
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h1 className="text-sm font-bold text-slate-900">ตะกร้าสั่งซื้อ (Smart Cart)</h1>
        <p className="text-[11px] text-slate-500">แยกตะกร้าตามผู้จัดจำหน่าย · คิดยอดอัตโนมัติ · บันทึกเป็น PO</p>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {draftSupplierIds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            ยังไม่มีตะกร้าร่างจากผู้จัดจำหน่าย — เพิ่มสินค้าจากหน้าสินค้าใกล้หมดก่อน
          </div>
        ) : (
          <div className="space-y-4">
            {draftSupplierIds.map((supId) => {
              const po = draftPOs[supId]
              if (!po) return null
              const supplier = suppliers.find((s) => s.id === supId)
              const meta = supplierMetaFor(supId, supplierMetaById)
              const subtotal = po.lines.reduce((s, ln) => s + ln.orderedQty * ln.unitCostOrder, 0)
              const paymentTerm = paymentTerms[supId] ?? 'credit'
              const shippingCost = Math.max(0, shippingCosts[supId] ?? 0)
              const discount = paymentTerm === 'cash' ? (subtotal * meta.cashDiscount) / 100 : 0
              const vat = (subtotal - discount) * 0.07
              const grand = subtotal - discount + vat + shippingCost
              const currentAccum = supplierAccumulated[supId] ?? 0
              const futureAccum = currentAccum + grand
              const progress = meta.target > 0 ? Math.min(100, (futureAccum / meta.target) * 100) : 0
              const addable = products.filter((p) => !po.lines.some((ln) => ln.productId === p.id))
              const addQuery = (addProductQueryBySupplier[supId] ?? '').trim().toLowerCase()
              const addCategory = addCategoryBySupplier[supId] ?? 'ทั้งหมด'
              const addSubCategory = addSubCategoryBySupplier[supId] ?? 'ทั้งหมด'
              const addSubSubCategory = addSubSubCategoryBySupplier[supId] ?? 'ทั้งหมด'
              const addCategories = ['ทั้งหมด', ...new Set(addable.map((p) => p.category).filter(Boolean))]
              const addSubCategories = [
                'ทั้งหมด',
                ...new Set(
                  addable
                    .filter((p) => addCategory === 'ทั้งหมด' || p.category === addCategory)
                    .map((p) => p.subCategory)
                    .filter(Boolean),
                ),
              ]
              const addSubSubCategories = [
                'ทั้งหมด',
                ...new Set(
                  addable
                    .filter((p) => addCategory === 'ทั้งหมด' || p.category === addCategory)
                    .filter((p) => addSubCategory === 'ทั้งหมด' || p.subCategory === addSubCategory)
                    .map((p) => p.subSubCategory)
                    .filter(Boolean),
                ),
              ]
              const addableFiltered = addable
                .filter((p) => addCategory === 'ทั้งหมด' || p.category === addCategory)
                .filter((p) => addSubCategory === 'ทั้งหมด' || p.subCategory === addSubCategory)
                .filter((p) => addSubSubCategory === 'ทั้งหมด' || p.subSubCategory === addSubSubCategory)
                .filter((p) => {
                  if (!addQuery) return true
                  const sku = p.sku.toLowerCase()
                  const name = p.name.toLowerCase()
                  const oem = (p.factoryOem ?? '').toLowerCase()
                  const genuine = (p.genuineNo ?? '').toLowerCase()
                  return (
                    sku.includes(addQuery) ||
                    name.includes(addQuery) ||
                    oem.includes(addQuery) ||
                    genuine.includes(addQuery)
                  )
                })
                .slice(0, 25)
              return (
                <section key={supId} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">{supplier?.name ?? supId}</h2>
                      <p className="text-[11px] text-slate-500">ตะกร้า {po.poNo}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copyToLine(supId)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                      >
                        <Clipboard className="size-3.5" aria-hidden />
                        Copy to Line
                      </button>
                      <button
                        type="button"
                        onClick={() => savePO(supId)}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white"
                      >
                        <Save className="size-3.5" aria-hidden />
                        Save PO
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto px-3 py-2">
                    <table className="w-full min-w-[56rem] text-xs">
                      <thead className="text-slate-500">
                        <tr>
                          <th className="py-1.5 text-left">SKU</th>
                          <th className="py-1.5 text-left">ชื่อ</th>
                          <th className="py-1.5 text-right">Qty</th>
                          <th className="py-1.5 text-right">Cost</th>
                          <th className="py-1.5 text-right">รวม</th>
                          <th className="py-1.5 text-left">Smart Alerts</th>
                          <th className="py-1.5 text-right">ลบ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {po.lines.map((ln) => (
                          <tr key={ln.lineId} className="border-t border-slate-100 align-top">
                            <td className="py-1.5 font-mono">{ln.sku}</td>
                            <td className="py-1.5">{ln.name}</td>
                            <td className="py-1.5 text-right">
                              <input
                                type="number"
                                min={1}
                                value={ln.orderedQty}
                                onChange={(e) => updateQty(supId, ln.lineId, Number(e.target.value))}
                                className="w-16 rounded border border-slate-200 px-1 py-0.5 text-right"
                              />
                            </td>
                            <td className="py-1.5 text-right">
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={ln.unitCostOrder}
                                onChange={(e) => updateCost(supId, ln.lineId, Number(e.target.value))}
                                className="w-24 rounded border border-slate-200 px-1 py-0.5 text-right"
                              />
                            </td>
                            <td className="py-1.5 text-right tabular-nums">{thaiMoney(ln.orderedQty * ln.unitCostOrder)}</td>
                            <td className="py-1.5">
                              <div className="flex flex-wrap gap-1">
                                {getSmartAlerts(supId, ln).map((a, i) => (
                                  <span
                                    key={`${ln.lineId}-a-${i}`}
                                    className={clsx(
                                      'rounded px-1.5 py-0.5 text-[10px]',
                                      a.kind === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900',
                                    )}
                                  >
                                    {a.text}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-1.5 text-right">
                              <button type="button" onClick={() => removeLine(supId, ln.lineId)} className="text-rose-600">
                                <Trash2 className="size-3.5" aria-hidden />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-2 border-t border-slate-100 px-3 py-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    <label>
                      เงื่อนไขจ่าย
                      <select
                        value={paymentTerm}
                        onChange={(e) => setPaymentTerms((cur) => ({ ...cur, [supId]: e.target.value as PaymentTerm }))}
                        className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5"
                      >
                        <option value="credit">เครดิต ({meta.creditDays} วัน)</option>
                        <option value="cash">เงินสด (ลด {meta.cashDiscount}%)</option>
                      </select>
                    </label>
                    <label>
                      ขนส่ง
                      <select
                        value={shippingMethods[supId] ?? 'delivery'}
                        onChange={(e) => setShippingMethods((cur) => ({ ...cur, [supId]: e.target.value as ShippingMethod }))}
                        className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5"
                      >
                        <option value="delivery">ส่งของ</option>
                        <option value="pickup">รับเอง</option>
                      </select>
                    </label>
                    <label>
                      ค่าขนส่ง
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={shippingCosts[supId] ?? 0}
                        onChange={(e) => setShippingCosts((cur) => ({ ...cur, [supId]: Math.max(0, Number(e.target.value) || 0) }))}
                        className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5"
                      />
                    </label>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() =>
                          setAddPickerOpenBySupplier((cur) => ({
                            ...cur,
                            [supId]: !cur[supId],
                          }))
                        }
                        className={clsx(
                          'inline-flex w-full items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium',
                          addPickerOpenBySupplier[supId]
                            ? 'border-amber-300 bg-amber-50 text-amber-800'
                            : 'border-slate-200 bg-white text-slate-700',
                        )}
                      >
                        <PackagePlus className="size-3.5" aria-hidden />
                        {addPickerOpenBySupplier[supId] ? 'ปิดช่องเพิ่มสินค้า' : 'เพิ่มสินค้า'}
                      </button>
                    </div>
                  </div>

                  {addPickerOpenBySupplier[supId] && (
                    <div className="space-y-2 border-t border-slate-100 bg-slate-50/40 px-3 py-3">
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                        <label className="text-[11px] text-slate-600">
                          หมวดใหญ่
                          <select
                            value={addCategory}
                            onChange={(e) => {
                              const next = e.target.value
                              setAddCategoryBySupplier((cur) => ({ ...cur, [supId]: next }))
                              setAddSubCategoryBySupplier((cur) => ({ ...cur, [supId]: 'ทั้งหมด' }))
                              setAddSubSubCategoryBySupplier((cur) => ({ ...cur, [supId]: 'ทั้งหมด' }))
                            }}
                            className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
                          >
                            {addCategories.map((cat) => (
                              <option key={`${supId}-cat-${cat}`} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-[11px] text-slate-600">
                          ย่อย 1
                          <select
                            value={addSubCategory}
                            onChange={(e) => {
                              const next = e.target.value
                              setAddSubCategoryBySupplier((cur) => ({ ...cur, [supId]: next }))
                              setAddSubSubCategoryBySupplier((cur) => ({ ...cur, [supId]: 'ทั้งหมด' }))
                            }}
                            className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
                          >
                            {addSubCategories.map((cat) => (
                              <option key={`${supId}-sub-${cat}`} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-[11px] text-slate-600">
                          ย่อย 2
                          <select
                            value={addSubSubCategory}
                            onChange={(e) =>
                              setAddSubSubCategoryBySupplier((cur) => ({ ...cur, [supId]: e.target.value }))
                            }
                            className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
                          >
                            {addSubSubCategories.map((cat) => (
                              <option key={`${supId}-sub2-${cat}`} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-[11px] text-slate-600">
                          ค้นหา
                          <div className="relative mt-1">
                            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                              type="search"
                              value={addProductQueryBySupplier[supId] ?? ''}
                              onChange={(e) =>
                                setAddProductQueryBySupplier((cur) => ({
                                  ...cur,
                                  [supId]: e.target.value,
                                }))
                              }
                              placeholder="SKU / ชื่อ / OEM"
                              className="w-full rounded border border-slate-200 py-1.5 pl-8 pr-2 text-xs"
                            />
                          </div>
                        </label>
                      </div>

                      <div className="max-h-48 overflow-auto rounded border border-slate-200 bg-white">
                        {addableFiltered.length === 0 ? (
                          <p className="px-2 py-2 text-[11px] text-slate-500">ไม่พบสินค้าที่ตรงเงื่อนไข</p>
                        ) : (
                          <table className="w-full text-[11px]">
                            <thead className="sticky top-0 bg-slate-50 text-[10px] text-slate-600">
                              <tr>
                                <th className="px-2 py-1 text-left">SKU</th>
                                <th className="px-2 py-1 text-left">ชื่อ</th>
                                <th className="px-2 py-1 text-right">คงเหลือ</th>
                                <th className="px-2 py-1 text-right">ขั้นต่ำ</th>
                                <th className="px-2 py-1 text-right">สูงสุด</th>
                                <th className="px-2 py-1 text-right"> </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {addableFiltered.map((p) => (
                                <tr key={`${supId}-${p.id}`}>
                                  <td className="px-2 py-1 font-mono text-[10px] text-slate-700">{p.sku}</td>
                                  <td className="px-2 py-1 text-slate-700">
                                    <span className="block truncate">{p.name}</span>
                                  </td>
                                  <td className="px-2 py-1 text-right tabular-nums text-slate-700">{p.stock}</td>
                                  <td className="px-2 py-1 text-right tabular-nums text-amber-700">{p.minStock}</td>
                                  <td className="px-2 py-1 text-right tabular-nums text-slate-500">
                                    {p.maxStock != null && p.maxStock > 0 ? p.maxStock : '-'}
                                  </td>
                                  <td className="px-2 py-1 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleAddNewItemToDraft(supId, p.id)}
                                      className="shrink-0 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:border-amber-300 hover:text-amber-900"
                                    >
                                      เพิ่ม
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 px-3 py-3 text-xs">
                    <div className="mb-2">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-600">
                        <span>เป้าสะสมเพื่อ rebate</span>
                        <span>
                          {thaiMoney(futureAccum)} / {thaiMoney(meta.target)} บาท
                        </span>
                      </div>
                      <div className="h-2.5 rounded bg-slate-100">
                        <div className="h-2.5 rounded bg-indigo-500" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        ถึงเป้าจะได้โบนัส rebate {thaiMoney(meta.rebateBonus)} บาท
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p>Subtotal: {thaiMoney(subtotal)}</p>
                      <p>Cash Discount: -{thaiMoney(discount)}</p>
                      <p>VAT 7%: {thaiMoney(vat)}</p>
                      <p>Shipping: {thaiMoney(shippingCost)}</p>
                      <p className="font-semibold text-slate-900">Grand Total: {thaiMoney(grand)}</p>
                    </div>
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
