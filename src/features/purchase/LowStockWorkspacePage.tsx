import { getStoredBranch } from '@/features/auth/authSession'
import { BRANCHES } from '@/features/auth/branches'
import { getLatestUnitCostForPo } from '@/features/purchase/data/poMovingAverage'
import { loadPurchaseOrders, upsertPurchaseOrder } from '@/features/purchase/data/poStore'
import type { PurchaseOrder, PurchaseOrderLine } from '@/features/purchase/data/poTypes'
import { loadSupplierDirectory } from '@/features/purchase/data/supplierDirectoryStore'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { mergeInventoryProductsWithLiveStock } from '@/features/pos/data/posLiveStock'
import { getProductMasterList } from '@/features/inventory/data/productMasterData'
import { clsx } from 'clsx'
import { PackagePlus, Search, Star } from 'lucide-react'
import { useMemo, useState } from 'react'

type LowStockWorkspacePageProps = {
  className?: string
  onOpenPurchaseCart?: () => void
}

type RowSupplierMap = Record<string, string>
type DefaultSupplierMap = Record<string, string>
type SupplierMoqMap = Record<string, number>

const DEFAULT_SUPPLIER_LS_KEY = 'bento.purchase.lowStock.defaultSupplierByProduct.v1'
const SUPPLIER_MOQ_LS_KEY = 'bento.purchase.lowStock.supplierMoqById.v1'

function loadDefaultSupplierByProduct(): DefaultSupplierMap {
  try {
    const raw = localStorage.getItem(DEFAULT_SUPPLIER_LS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: DefaultSupplierMap = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string' && v.trim()) out[k] = v.trim()
    }
    return out
  } catch {
    return {}
  }
}

function saveDefaultSupplierByProduct(map: DefaultSupplierMap): void {
  try {
    localStorage.setItem(DEFAULT_SUPPLIER_LS_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

function loadSupplierMoqById(): SupplierMoqMap {
  try {
    const raw = localStorage.getItem(SUPPLIER_MOQ_LS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: SupplierMoqMap = {}
    for (const [k, v] of Object.entries(parsed)) {
      const n = Math.floor(Number(v))
      if (Number.isFinite(n) && n >= 1) out[k] = n
    }
    return out
  } catch {
    return {}
  }
}

function saveSupplierMoqById(map: SupplierMoqMap): void {
  try {
    localStorage.setItem(SUPPLIER_MOQ_LS_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

function newLineId(): string {
  return `ln-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function newPoId(): string {
  return `po-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function resolveSuggestedQty(shortQty: number, moq: number): number {
  const base = Math.max(1, Math.ceil(shortQty))
  const lot = Math.max(1, Math.floor(moq))
  return Math.ceil(base / lot) * lot
}

export function LowStockWorkspacePage({ className, onOpenPurchaseCart }: LowStockWorkspacePageProps) {
  const [lowStockSearch, setLowStockSearch] = useState('')
  const [rowSuppliers, setRowSuppliers] = useState<RowSupplierMap>({})
  const [defaultSupplierByProduct, setDefaultSupplierByProduct] = useState<DefaultSupplierMap>(
    () => loadDefaultSupplierByProduct(),
  )
  const [supplierMoqById, setSupplierMoqById] = useState<SupplierMoqMap>(() => loadSupplierMoqById())
  const [tick, setTick] = useState(0)

  const branch = getStoredBranch()
  const branchId = branch?.id ?? BRANCHES[0].id
  const suppliers = useMemo(() => loadSupplierDirectory(), [tick])
  const orders = useMemo(() => loadPurchaseOrders(), [tick])

  const stockItems = useMemo(() => {
    const products = mergeInventoryProductsWithLiveStock(getPosCatalogProducts())
    const masterBySku = new Map(getProductMasterList().map((m) => [m.sku, m] as const))

    return products.map((item) => {
      const master = masterBySku.get(item.sku)
      const b1Id = BRANCHES[0]?.id
      const b2Id = BRANCHES[1]?.id
      const b1 = master?.crossBranch?.find((r) => r.branchId === b1Id)?.stock ?? item.stock
      const b2 = master?.crossBranch?.find((r) => r.branchId === b2Id)?.stock ?? 0
      return {
        ...item,
        currentStock: item.stock,
        branches: { b1, b2 },
      }
    })
  }, [])

  const pendingByProductSupplier = useMemo(() => {
    const map: Record<string, number> = {}
    for (const po of orders) {
      if (po.branchId !== branchId || po.status !== 'ordered') continue
      for (const line of po.lines) {
        const remain = Math.max(0, line.orderedQty - line.receivedQtyTotal)
        if (remain <= 0) continue
        const key = `${line.productId}::${po.supplierId}`
        map[key] = (map[key] ?? 0) + remain
      }
    }
    return map
  }, [orders, branchId])

  const draftOrdersBySupplier = useMemo(() => {
    const out = new Map<string, PurchaseOrder>()
    for (const po of orders) {
      if (po.branchId !== branchId || po.status !== 'draft') continue
      if (!out.has(po.supplierId)) out.set(po.supplierId, po)
    }
    return out
  }, [orders, branchId])

  const getCartStatus = (productId: string): string | null => {
    for (const po of draftOrdersBySupplier.values()) {
      if (po.lines.some((ln) => ln.productId === productId)) {
        return `${po.supplierName} (${po.poNo})`
      }
    }
    return null
  }

  const resolveSupplierId = (productId: string): string =>
    rowSuppliers[productId] ?? defaultSupplierByProduct[productId] ?? ''

  const resolvePendingStock = (productId: string, supplierId: string): number => {
    if (!supplierId) return 0
    return pendingByProductSupplier[`${productId}::${supplierId}`] ?? 0
  }

  const resolveMoq = (supplierId: string): number => {
    const n = supplierMoqById[supplierId]
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
  }

  const lowStockProducts = useMemo(
    () =>
      stockItems.filter((item) => {
        const supplierId = resolveSupplierId(item.id)
        const pendingStock = resolvePendingStock(item.id, supplierId)
        return item.currentStock + pendingStock < item.minStock
      }),
    [stockItems, rowSuppliers, defaultSupplierByProduct, pendingByProductSupplier],
  )

  const filteredLowStockProducts = useMemo(() => {
    const q = lowStockSearch.trim().toLowerCase()
    if (!q) return lowStockProducts
    return lowStockProducts.filter((item) => item.sku.toLowerCase().includes(q) || item.name.toLowerCase().includes(q))
  }, [lowStockProducts, lowStockSearch])

  const upsertDraftPoLine = (
    product: (typeof stockItems)[number],
    supplierId: string,
    suggestQty: number,
  ): { added: boolean; reason?: string } => {
    const supplier = suppliers.find((s) => s.id === supplierId)
    if (!supplier) return { added: false, reason: 'ไม่พบผู้จัดจำหน่ายที่เลือก' }
    if (getCartStatus(product.id)) return { added: false, reason: 'อยู่ในตะกร้าแล้ว' }

    const line: PurchaseOrderLine = {
      lineId: newLineId(),
      productId: product.id,
      sku: product.sku,
      name: product.name,
      orderedQty: suggestQty,
      unitCostOrder: getLatestUnitCostForPo(product),
      receivedQtyTotal: 0,
    }

    const existed = draftOrdersBySupplier.get(supplierId)
    if (!existed) {
      const created: PurchaseOrder = {
        id: newPoId(),
        poNo: `DR-${Date.now().toString(36).toUpperCase()}`,
        branchId,
        supplierId: supplier.id,
        supplierName: supplier.name,
        status: 'draft',
        createdAt: new Date().toISOString(),
        lines: [line],
        receiveBatches: [],
        vatRatePercent: 7,
        billDiscountBaht: 0,
        paymentMode: 'unpaid',
      }
      upsertPurchaseOrder(created)
      return { added: true }
    }

    const next: PurchaseOrder = {
      ...existed,
      lines: [...existed.lines, line],
    }
    upsertPurchaseOrder(next)
    return { added: true }
  }

  const addToPO = (product: (typeof stockItems)[number]) => {
    const supplierId = resolveSupplierId(product.id)
    if (!supplierId) {
      window.alert(`กรุณาเลือกผู้จัดจำหน่ายสำหรับ ${product.sku}`)
      return
    }
    const pendingStock = resolvePendingStock(product.id, supplierId)
    const shortQty = product.minStock - (product.currentStock + pendingStock)
    const suggestQty = resolveSuggestedQty(shortQty, resolveMoq(supplierId))
    const result = upsertDraftPoLine(product, supplierId, suggestQty)
    if (!result.added && result.reason) {
      window.alert(result.reason)
      return
    }
    setTick((n) => n + 1)
  }

  const addAllToPO = () => {
    let addedCount = 0
    let missingSupplierCount = 0
    let skippedInCart = 0
    for (const item of filteredLowStockProducts) {
      const supplierId = resolveSupplierId(item.id)
      if (!supplierId) {
        missingSupplierCount += 1
        continue
      }
      const pendingStock = resolvePendingStock(item.id, supplierId)
      const shortQty = item.minStock - (item.currentStock + pendingStock)
      const suggestQty = resolveSuggestedQty(shortQty, resolveMoq(supplierId))
      const result = upsertDraftPoLine(item, supplierId, suggestQty)
      if (result.added) addedCount += 1
      else if (result.reason === 'อยู่ในตะกร้าแล้ว') skippedInCart += 1
    }
    setTick((n) => n + 1)
    window.alert(
      `เพิ่มเข้าตะกร้าแล้ว ${addedCount} รายการ` +
        (missingSupplierCount > 0 ? `\nข้าม ${missingSupplierCount} รายการ (ยังไม่เลือกผู้จัดจำหน่าย)` : '') +
        (skippedInCart > 0 ? `\nข้าม ${skippedInCart} รายการ (อยู่ในตะกร้าแล้ว)` : ''),
    )
  }

  const b0 = BRANCHES[0]
  const b1 = BRANCHES[1]

  return (
    <div
      className={clsx(
        'flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white',
        className,
      )}
    >
      <header className="flex shrink-0 items-start justify-between gap-x-3 gap-y-1 border-b border-slate-200 bg-slate-50 px-2 py-2 sm:px-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <h1 className="text-xs font-bold leading-tight text-slate-900 sm:text-sm">สินค้าใกล้หมด</h1>
            <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700">
              {filteredLowStockProducts.length} รายการ
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-500 sm:line-clamp-1">
            สต็อก + ค้างเข้า (ตามซัพที่เลือก) ต้องน้อยกว่าขั้นต่ำ — เลื่อนตารางด้านล่างได้
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {onOpenPurchaseCart ? (
            <button
              type="button"
              onClick={onOpenPurchaseCart}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
            >
              ตะกร้า
            </button>
          ) : null}
          <button
            type="button"
            onClick={addAllToPO}
            className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-amber-700"
          >
            <PackagePlus className="size-3.5 shrink-0" aria-hidden />
            <span className="hidden min-[1180px]:inline">เพิ่มทั้งหมดลงตะกร้า</span>
            <span className="min-[1180px]:hidden">เพิ่มทั้งหมด</span>
          </button>
        </div>
      </header>

      <div className="shrink-0 border-b border-slate-100 px-2 py-1.5 sm:px-3">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={lowStockSearch}
            onChange={(e) => setLowStockSearch(e.target.value)}
            placeholder="ค้นหา SKU / ชื่อ"
            className="w-full rounded-md border border-slate-200 bg-white py-1 pl-7 pr-2 text-[11px] text-slate-900 shadow-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
        <table className="w-full table-fixed border-collapse text-left text-[11px] leading-tight">
          <colgroup>
            <col className="w-[6.5rem]" />
            <col />
            <col className="w-[3.25rem]" />
            <col className="w-[3.25rem]" />
            <col className="w-[3.25rem]" />
            <col className="w-[3.25rem]" />
            <col className="w-[3.25rem]" />
            <col className="min-w-[9rem] w-[26%]" />
            <col className="w-[3rem]" />
            <col className="w-[3.25rem]" />
            <col className="w-[5.75rem]" />
          </colgroup>
          <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50/95 backdrop-blur">
            <tr className="text-[9px] font-semibold uppercase tracking-wide text-slate-600">
              <th className="px-1.5 py-1.5">SKU</th>
              <th className="px-1.5 py-1.5">ชื่อ</th>
              <th className="px-1 py-1.5 text-right" title="สต็อกรวม (สาขานี้)">
                รวม
              </th>
              <th className="px-1 py-1.5 text-right" title={b0?.name}>
                {b0?.name.slice(0, 4) ?? 'ส1'}
              </th>
              <th className="px-1 py-1.5 text-right" title={b1?.name}>
                {b1?.name.slice(0, 4) ?? 'ส2'}
              </th>
              <th className="px-1 py-1.5 text-right" title="กำลังเข้า (ตามซัพพลายที่เลือก)">
                เข้า
              </th>
              <th className="px-1 py-1.5 text-right" title="ขั้นต่ำ">
                ต่ำ
              </th>
              <th className="px-1.5 py-1.5">ซัพพลาย</th>
              <th className="px-1 py-1.5 text-right">MOQ</th>
              <th className="px-1 py-1.5 text-right" title="แนะนำสั่ง">
                แนะนำ
              </th>
              <th className="px-1 py-1.5 text-right"> </th>
            </tr>
          </thead>
          <tbody>
            {filteredLowStockProducts.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-[11px] text-slate-500">
                  ไม่พบรายการสินค้าใกล้หมด
                </td>
              </tr>
            ) : (
              filteredLowStockProducts.map((item) => {
                const supplierId = resolveSupplierId(item.id)
                const cartStatus = getCartStatus(item.id)
                const pendingStock = resolvePendingStock(item.id, supplierId)
                const moq = resolveMoq(supplierId)
                const suggestQty = resolveSuggestedQty(item.minStock - (item.currentStock + pendingStock), moq)
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-amber-50/40">
                    <td className="px-1.5 py-1 font-mono text-[10px] text-slate-700">{item.sku}</td>
                    <td className="max-w-0 px-1.5 py-1">
                      <span className="block truncate font-medium text-slate-900" title={item.name}>
                        {item.name}
                      </span>
                    </td>
                    <td className="px-1 py-1 text-right tabular-nums text-rose-700">{item.currentStock}</td>
                    <td className="px-1 py-1 text-right tabular-nums text-slate-700">{item.branches.b1}</td>
                    <td className="px-1 py-1 text-right tabular-nums text-slate-700">{item.branches.b2}</td>
                    <td className="px-1 py-1 text-right tabular-nums text-indigo-700">{pendingStock}</td>
                    <td className="px-1 py-1 text-right tabular-nums font-semibold text-slate-900">{item.minStock}</td>
                    <td className="px-1 py-1">
                      <div className="flex min-w-0 items-center gap-0.5">
                        <select
                          value={supplierId}
                          onChange={(e) => setRowSuppliers((cur) => ({ ...cur, [item.id]: e.target.value }))}
                          disabled={Boolean(cartStatus)}
                          className="min-w-0 flex-1 rounded border border-slate-200 bg-white py-0.5 pl-1 pr-0.5 text-[10px] leading-tight disabled:bg-slate-100"
                        >
                          <option value="">— เลือก —</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.supplierCode} — {s.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!supplierId}
                          onClick={() => {
                            const next = { ...defaultSupplierByProduct, [item.id]: supplierId }
                            setDefaultSupplierByProduct(next)
                            saveDefaultSupplierByProduct(next)
                          }}
                          className={clsx(
                            'shrink-0 rounded border p-0.5',
                            defaultSupplierByProduct[item.id] === supplierId
                              ? 'border-amber-300 bg-amber-50 text-amber-700'
                              : 'border-slate-200 bg-white text-slate-500',
                          )}
                          title="ตั้งเป็นค่าเริ่มต้นของสินค้านี้"
                        >
                          <Star className="size-3" aria-hidden />
                        </button>
                      </div>
                    </td>
                    <td className="px-1 py-1 text-right">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        disabled={!supplierId}
                        value={moq}
                        onChange={(e) => {
                          if (!supplierId) return
                          const nextMoq = Math.max(1, Math.floor(Number(e.target.value) || 1))
                          const next = { ...supplierMoqById, [supplierId]: nextMoq }
                          setSupplierMoqById(next)
                          saveSupplierMoqById(next)
                        }}
                        className="w-10 rounded border border-slate-200 px-0.5 py-0.5 text-right text-[10px] disabled:bg-slate-100"
                      />
                    </td>
                    <td className="px-1 py-1 text-right tabular-nums font-semibold text-amber-800">{suggestQty}</td>
                    <td className="px-1 py-1 text-right">
                      <button
                        type="button"
                        onClick={() => addToPO(item)}
                        disabled={Boolean(cartStatus)}
                        className="inline-flex w-full min-w-0 items-center justify-center gap-0.5 rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm hover:border-amber-300 hover:text-amber-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        title={cartStatus ?? 'เพิ่มลงตะกร้า'}
                      >
                        <PackagePlus className="size-3 shrink-0" aria-hidden />
                        <span className="truncate">{cartStatus ? 'ในตะกร้า' : 'เพิ่ม'}</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
