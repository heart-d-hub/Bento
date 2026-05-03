import { getStoredBranch } from '@/features/auth/authSession'
import { BRANCHES } from '@/features/auth/branches'
import { getLatestUnitCostForPo } from '@/features/purchase/data/poMovingAverage'
import { loadPurchaseOrders } from '@/features/purchase/data/poStore'
import { loadSupplierDirectory } from '@/features/purchase/data/supplierDirectoryStore'
import {
  buildProductSupplierMap,
  SUPPLIER_CATALOG_CHANGED_EVENT,
} from '@/features/purchase/data/supplierCatalogStore'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { mergeInventoryProductsWithLiveStock } from '@/features/pos/data/posLiveStock'
import { getProductMasterList } from '@/features/inventory/data/productMasterData'
import {
  applyWarehouseThresholds,
  setWarehouseMinMax,
  INVENTORY_THRESHOLDS_CHANGED_EVENT,
} from '@/features/inventory/data/inventoryStockThresholds'
import { loadRecentSales } from '@/features/pos/data/posSalesHistory'
import { loadVendorPromotions } from '@/features/promotions/data/vendorPromotionsStore'
import { findActiveVendorPromos, findBestVendorPromoTier, findNextVendorPromoTier } from '@/features/promotions/evaluateVendorPromo'
import { PROMOTIONS_CHANGED_EVENT } from '@/features/promotions/data/promotionsStore'
import type { VendorPromotion } from '@/features/promotions/data/promotionTypes'
import { clsx } from 'clsx'
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  List,
  PackagePlus,
  Search,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingDown,
  UserX,
} from 'lucide-react'
import { addToCatalogCart } from '@/features/purchase/data/catalogCartStore'
import { ProductImage } from '@/features/inventory/components/ProductImage'
import { useEffect, useMemo, useState } from 'react'

type LowStockWorkspacePageProps = {
  className?: string
  onGoToCatalog?: () => void
  onBack?: () => void
}

type RowSupplierMap = Record<string, string>
type DefaultSupplierMap = Record<string, string>
type SupplierMoqMap = Record<string, number>

const DEFAULT_SUPPLIER_LS_KEY = 'bento.purchase.lowStock.defaultSupplierByProduct.v1'
const SUPPLIER_MOQ_LS_KEY = 'bento.purchase.lowStock.supplierMoqById.v1'
const SUPPLIER_LEAD_TIME_LS_KEY = 'bento.purchase.lowStock.supplierLeadTimeById.v1'
const VIEW_PREFS_SS_KEY = 'bento.purchase.lowStock.viewPrefs.v1'

type SupplierLeadTimeMap = Record<string, number>
type SortKey = 'name' | 'stock' | 'min' | 'days' | 'qty' | 'short'
type SortDir = 'asc' | 'desc'
type ViewMode = 'flat' | 'group'
type UrgencyFilter = 'all' | 'out' | 'critical' | 'warning' | 'missing'

type ViewPrefs = {
  search?: string
  urgency?: UrgencyFilter
  view?: ViewMode
  sortKey?: SortKey
  sortDir?: SortDir
}

function loadViewPrefs(): ViewPrefs {
  try {
    const raw = sessionStorage.getItem(VIEW_PREFS_SS_KEY)
    if (!raw) return {}
    const p = JSON.parse(raw) as ViewPrefs
    return p && typeof p === 'object' ? p : {}
  } catch {
    return {}
  }
}

function saveViewPrefs(p: ViewPrefs): void {
  try {
    sessionStorage.setItem(VIEW_PREFS_SS_KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

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

function loadSupplierLeadTimeById(): SupplierLeadTimeMap {
  try {
    const raw = localStorage.getItem(SUPPLIER_LEAD_TIME_LS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: SupplierLeadTimeMap = {}
    for (const [k, v] of Object.entries(parsed)) {
      const n = Math.floor(Number(v))
      if (Number.isFinite(n) && n >= 0) out[k] = n
    }
    return out
  } catch {
    return {}
  }
}

function saveSupplierLeadTimeById(map: SupplierLeadTimeMap): void {
  try {
    localStorage.setItem(SUPPLIER_LEAD_TIME_LS_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

function resolveSuggestedQty(shortQty: number, moq: number): number {
  const base = Math.max(1, Math.ceil(shortQty))
  const lot = Math.max(1, Math.floor(moq))
  return Math.ceil(base / lot) * lot
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.floor(a))
  let y = Math.abs(Math.floor(b))
  while (y) { const t = y; y = x % y; x = t }
  return x
}

function recommendMoqFromHistory(
  supplierId: string,
  orders: PurchaseOrder[],
): { moq: number; sampleSize: number } | null {
  if (!supplierId) return null
  const qtys: number[] = []
  for (const po of orders) {
    if (po.supplierId !== supplierId) continue
    for (const line of po.lines) {
      const q = Math.floor(line.orderedQty)
      if (q >= 1) qtys.push(q)
    }
  }
  if (qtys.length === 0) return null

  let filtered = qtys
  if (qtys.length >= 5) {
    const sorted = [...qtys].sort((a, b) => a - b)
    const q1 = sorted[Math.floor(sorted.length * 0.25)]!
    const q3 = sorted[Math.floor(sorted.length * 0.75)]!
    const iqrRange = q3 - q1
    const lo = q1 - 1.5 * iqrRange
    const hi = q3 + 1.5 * iqrRange
    const trimmed = qtys.filter((q) => q >= lo && q <= hi)
    if (trimmed.length > 0) filtered = trimmed
  }

  const moq = filtered.reduce((acc, q) => gcd(acc, q), filtered[0]!)
  return { moq: Math.max(1, moq), sampleSize: qtys.length }
}

function SortHeaderButton({
  label,
  sortKey,
  current,
  dir,
  onClick,
  align = 'left',
}: {
  label: string
  sortKey: SortKey
  current: SortKey | null
  dir: SortDir
  onClick: (k: SortKey) => void
  align?: 'left' | 'right' | 'center'
}) {
  const active = current === sortKey
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={() => onClick(sortKey)}
      className={clsx(
        'inline-flex w-full items-center gap-1 transition hover:text-amber-600',
        align === 'right' && 'justify-end',
        align === 'center' && 'justify-center',
        active ? 'text-amber-700' : 'text-slate-500',
      )}
    >
      <span>{label}</span>
      <Icon className={clsx('size-3', active ? 'opacity-100' : 'opacity-40')} />
    </button>
  )
}

export function LowStockWorkspacePage({ className, onGoToCatalog, onBack }: LowStockWorkspacePageProps) {
  const [lowStockSearch, setLowStockSearch] = useState(() => loadViewPrefs().search ?? '')
  const [rowSuppliers, setRowSuppliers] = useState<RowSupplierMap>({})
  const [defaultSupplierByProduct, setDefaultSupplierByProduct] = useState<DefaultSupplierMap>(
    () => loadDefaultSupplierByProduct(),
  )
  const [supplierMoqById, setSupplierMoqById] = useState<SupplierMoqMap>(() => loadSupplierMoqById())
  const [supplierLeadTimeById, setSupplierLeadTimeById] = useState<SupplierLeadTimeMap>(
    () => loadSupplierLeadTimeById(),
  )
  const [tick, setTick] = useState(0)
  const [notice, setNotice] = useState<{ kind: 'success' | 'info' | 'warn'; text: string } | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadViewPrefs().view ?? 'flat')
  const [sortKey, setSortKey] = useState<SortKey | null>(() => loadViewPrefs().sortKey ?? null)
  const [sortDir, setSortDir] = useState<SortDir>(() => loadViewPrefs().sortDir ?? 'asc')
  const [collapsedSuppliers, setCollapsedSuppliers] = useState<Set<string>>(new Set())

  const showNotice = (kind: 'success' | 'info' | 'warn', text: string) => {
    setNotice({ kind, text })
    window.setTimeout(() => setNotice((cur) => (cur && cur.text === text ? null : cur)), 3200)
  }

  const branch = getStoredBranch()
  const branchId = branch?.id ?? BRANCHES[0].id
  const suppliers = useMemo(() => loadSupplierDirectory(), [tick])
  const [productSupplierMap, setProductSupplierMap] = useState(() => buildProductSupplierMap())
  useEffect(() => {
    const handler = () => setProductSupplierMap(buildProductSupplierMap())
    window.addEventListener(SUPPLIER_CATALOG_CHANGED_EVENT, handler)
    return () => window.removeEventListener(SUPPLIER_CATALOG_CHANGED_EVENT, handler)
  }, [])
  const orders = useMemo(() => loadPurchaseOrders(), [tick])
  const [vendorPromos, setVendorPromos] = useState<VendorPromotion[]>(() => loadVendorPromotions())
  useEffect(() => {
    const handler = () => setVendorPromos(loadVendorPromotions())
    window.addEventListener(PROMOTIONS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(PROMOTIONS_CHANGED_EVENT, handler)
  }, [])

  // Sales velocity: avg qty/day per product over last 30 days of sales history
  const salesVelocity = useMemo(() => {
    const sales = loadRecentSales()
    if (sales.length === 0) return new Map<string, number>()
    const sorted = [...sales].sort((a, b) => a.at.localeCompare(b.at))
    const oldest = new Date(sorted[0]!.at)
    const newest = new Date(sorted[sorted.length - 1]!.at)
    const days = Math.max(1, (newest.getTime() - oldest.getTime()) / 86400000)
    const qtyMap = new Map<string, number>()
    for (const s of sales) {
      if (s.voidedAt) continue
      for (const l of s.lines ?? []) {
        qtyMap.set(l.productId, (qtyMap.get(l.productId) ?? 0) + l.qty)
      }
    }
    const result = new Map<string, number>()
    for (const [id, qty] of qtyMap) {
      result.set(id, qty / days)
    }
    return result
  }, [])

  useEffect(() => {
    const handler = () => setTick((n) => n + 1)
    window.addEventListener(INVENTORY_THRESHOLDS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(INVENTORY_THRESHOLDS_CHANGED_EVENT, handler)
  }, [])

  const stockItems = useMemo(() => {
    const products = applyWarehouseThresholds(mergeInventoryProductsWithLiveStock(getPosCatalogProducts()))
    const masterBySku = new Map(getProductMasterList().map((m) => [m.sku, m] as const))

    return products.map((item) => {
      const master = masterBySku.get(item.sku)
      // Build dynamic per-branch stock list (excluding current branch) — scales to N branches
      const otherBranchStocks = BRANCHES
        .filter((b) => b.id !== branchId)
        .map((b) => ({
          branchId: b.id,
          name: b.name,
          stock: master?.crossBranch?.find((r) => r.branchId === b.id)?.stock ?? 0,
        }))
      return {
        ...item,
        currentStock: item.stock,
        otherBranchStocks,
        sellPrice: master?.sellPrice ?? 0,
      }
    })
  }, [tick, branchId])

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

  const resolveSupplierId = (productId: string): string => {
    if (rowSuppliers[productId]) return rowSuppliers[productId]
    if (defaultSupplierByProduct[productId]) return defaultSupplierByProduct[productId]
    const linked = productSupplierMap.get(productId) ?? []
    if (linked.length === 1) return linked[0]!.supplierId
    return ''
  }

  const resolvePendingStock = (productId: string, supplierId: string): number => {
    if (!supplierId) return 0
    return pendingByProductSupplier[`${productId}::${supplierId}`] ?? 0
  }

  const resolveMoq = (supplierId: string): number => {
    const n = supplierMoqById[supplierId]
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
  }

  const resolveLeadTime = (supplierId: string): number => {
    if (!supplierId) return 0
    const n = supplierLeadTimeById[supplierId]
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
  }

  const computeEffectiveMin = (item: { id: string; minStock: number }, supplierId: string): number => {
    const vel = salesVelocity.get(item.id) ?? 0
    const lt = resolveLeadTime(supplierId)
    if (vel <= 0 || lt <= 0) return item.minStock
    return item.minStock + Math.ceil(vel * lt)
  }

  const lowStockProducts = useMemo(
    () =>
      stockItems.filter((item) => {
        const supplierId = resolveSupplierId(item.id)
        const pendingStock = resolvePendingStock(item.id, supplierId)
        const effectiveMin = computeEffectiveMin(item, supplierId)
        return item.currentStock + pendingStock < effectiveMin
      }),
    [stockItems, rowSuppliers, defaultSupplierByProduct, pendingByProductSupplier, supplierLeadTimeById, salesVelocity],
  )

  const filteredLowStockProducts = useMemo(() => {
    const q = lowStockSearch.trim().toLowerCase()
    const list = q
      ? lowStockProducts.filter((item) => item.sku.toLowerCase().includes(q) || item.name.toLowerCase().includes(q))
      : lowStockProducts
    return [...list].sort((a, b) => {
      const aOut = a.currentStock <= 0
      const bOut = b.currentStock <= 0
      if (aOut !== bOut) return aOut ? -1 : 1
      const aCrit = !aOut && a.currentStock < a.minStock / 2
      const bCrit = !bOut && b.currentStock < b.minStock / 2
      if (aCrit !== bCrit) return aCrit ? -1 : 1
      const aVel = salesVelocity.get(a.id) ?? 0
      const bVel = salesVelocity.get(b.id) ?? 0
      const aDays = aVel > 0 ? a.currentStock / aVel : Infinity
      const bDays = bVel > 0 ? b.currentStock / bVel : Infinity
      return aDays - bDays
    })
  }, [lowStockProducts, lowStockSearch, salesVelocity])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>(() => loadViewPrefs().urgency ?? 'all')
  const [viewModeManuallySet, setViewModeManuallySet] = useState<boolean>(() => loadViewPrefs().view !== undefined)

  useEffect(() => {
    saveViewPrefs({
      search: lowStockSearch,
      urgency: urgencyFilter,
      view: viewModeManuallySet ? viewMode : undefined,
      sortKey: sortKey ?? undefined,
      sortDir,
    })
  }, [lowStockSearch, urgencyFilter, viewMode, viewModeManuallySet, sortKey, sortDir])

  const setViewModeUser = (mode: ViewMode) => {
    setViewMode(mode)
    setViewModeManuallySet(true)
  }

  const suggestMinStockForItem = (item: (typeof stockItems)[number]) => {
    const vel = salesVelocity.get(item.id) ?? 0
    if (vel <= 0) return false
    const suggested = Math.max(1, Math.ceil(vel * 7))
    setWarehouseMinMax(item.id, suggested, (item.maxStock ?? 0) > 0 ? (item.maxStock as number) : null)
    return true
  }

  const suggestAllMinStock = () => {
    let count = 0
    for (const item of filteredLowStockProducts) {
      if (suggestMinStockForItem(item)) count++
    }
    if (count === 0) showNotice('warn', 'ไม่มีข้อมูลยอดขายสำหรับสินค้าในรายการนี้')
    else showNotice('success', `อัปเดตขั้นต่ำให้ ${count} รายการแล้ว (อ้างอิงยอดขาย 7 วัน)`)
  }

  const recommendMoqForSupplier = (supplierId: string) => {
    if (!supplierId) return
    const result = recommendMoqFromHistory(supplierId, orders)
    if (!result) {
      showNotice('warn', 'ยังไม่มีประวัติการสั่งซัพนี้')
      return
    }
    const next = { ...supplierMoqById, [supplierId]: result.moq }
    setSupplierMoqById(next); saveSupplierMoqById(next)
    const sup = suppliers.find((s) => s.id === supplierId)
    showNotice(
      result.moq > 1 ? 'success' : 'info',
      `${sup?.name ?? 'ซัพ'}: MOQ = ${result.moq} (จากประวัติ ${result.sampleSize} ครั้ง)`,
    )
  }

  const suggestMoqForAllSuppliers = () => {
    const supplierIds = new Set<string>()
    for (const item of filteredLowStockProducts) {
      const sid = resolveSupplierId(item.id)
      if (sid) supplierIds.add(sid)
    }
    if (supplierIds.size === 0) {
      showNotice('warn', 'ไม่มีซัพในรายการนี้ให้แนะนำ')
      return
    }
    const next = { ...supplierMoqById }
    let updated = 0
    let noHistory = 0
    for (const sid of supplierIds) {
      const result = recommendMoqFromHistory(sid, orders)
      if (!result) { noHistory += 1; continue }
      next[sid] = result.moq
      updated += 1
    }
    if (updated > 0) {
      setSupplierMoqById(next); saveSupplierMoqById(next)
      showNotice(
        'success',
        `แนะนำ MOQ ให้ ${updated} ซัพ${noHistory > 0 ? ` (ข้าม ${noHistory} ซัพ — ไม่มีประวัติ)` : ''}`,
      )
    } else {
      showNotice('warn', `ไม่มีซัพไหนมีประวัติสั่ง (${noHistory} ซัพ)`)
    }
  }

  const computeSuggestQtyFor = (item: (typeof stockItems)[number]): number => {
    const supplierId = resolveSupplierId(item.id)
    const pendingStock = resolvePendingStock(item.id, supplierId)
    const effectiveMin = computeEffectiveMin(item, supplierId)
    const shortQty = effectiveMin - (item.currentStock + pendingStock)
    return (item.maxStock ?? 0) > 0
      ? (item.maxStock as number)
      : resolveSuggestedQty(shortQty, resolveMoq(supplierId))
  }

  const addSelectedToCart = () => {
    const selected = filteredLowStockProducts.filter((p) => selectedIds.has(p.id))
    let addedCount = 0
    for (const item of selected) {
      const supplierId = resolveSupplierId(item.id)
      const supplierName = supplierId ? (suppliers.find((s) => s.id === supplierId)?.name) : undefined
      addToCatalogCart({
        productId: item.id,
        sku: item.sku,
        name: item.name,
        qty: computeSuggestQtyFor(item),
        unitCost: getLatestUnitCostForPo(item),
        supplierId: supplierId || undefined,
        supplierName,
      })
      addedCount += 1
    }
    setSelectedIds(new Set())
    showNotice(addedCount > 0 ? 'success' : 'warn', `เพิ่มลงตะกร้า ${addedCount} รายการ`)
  }


  const outOfStock = filteredLowStockProducts.filter((p) => p.currentStock <= 0)
  const critical = filteredLowStockProducts.filter((p) => p.currentStock > 0 && p.currentStock < p.minStock / 2)
  const warning = filteredLowStockProducts.filter((p) => p.currentStock >= p.minStock / 2)
  const missingSupplier = filteredLowStockProducts.filter((p) => !resolveSupplierId(p.id))

  const filteredByUrgency = useMemo(() => {
    if (urgencyFilter === 'all') return filteredLowStockProducts
    if (urgencyFilter === 'missing') return filteredLowStockProducts.filter((p) => !resolveSupplierId(p.id))
    return filteredLowStockProducts.filter((p) => {
      const isOut = p.currentStock <= 0
      const isCrit = !isOut && p.currentStock < p.minStock / 2
      if (urgencyFilter === 'out') return isOut
      if (urgencyFilter === 'critical') return isCrit
      return !isOut && !isCrit
    })
  }, [filteredLowStockProducts, urgencyFilter, rowSuppliers, defaultSupplierByProduct])

  const sortedDisplay = useMemo(() => {
    if (!sortKey) return filteredByUrgency
    const dirMul = sortDir === 'asc' ? 1 : -1
    const arr = [...filteredByUrgency]
    arr.sort((a, b) => {
      const supA = resolveSupplierId(a.id)
      const supB = resolveSupplierId(b.id)
      const moqA = resolveMoq(supA)
      const moqB = resolveMoq(supB)
      const pendA = resolvePendingStock(a.id, supA)
      const pendB = resolvePendingStock(b.id, supB)
      const effMinA = computeEffectiveMin(a, supA)
      const effMinB = computeEffectiveMin(b, supB)
      const shortA = Math.max(0, effMinA - (a.currentStock + pendA))
      const shortB = Math.max(0, effMinB - (b.currentStock + pendB))
      const qtyA = (a.maxStock ?? 0) > 0 ? (a.maxStock as number) : resolveSuggestedQty(shortA, moqA)
      const qtyB = (b.maxStock ?? 0) > 0 ? (b.maxStock as number) : resolveSuggestedQty(shortB, moqB)
      const velA = salesVelocity.get(a.id) ?? 0
      const velB = salesVelocity.get(b.id) ?? 0
      const daysA = velA > 0 ? a.currentStock / velA : Number.POSITIVE_INFINITY
      const daysB = velB > 0 ? b.currentStock / velB : Number.POSITIVE_INFINITY
      let cmp = 0
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name, 'th'); break
        case 'stock': cmp = a.currentStock - b.currentStock; break
        case 'min': cmp = a.minStock - b.minStock; break
        case 'days': cmp = (daysA === Number.POSITIVE_INFINITY ? 1e9 : daysA) - (daysB === Number.POSITIVE_INFINITY ? 1e9 : daysB); break
        case 'qty': cmp = qtyA - qtyB; break
        case 'short': cmp = shortA - shortB; break
      }
      return cmp * dirMul
    })
    return arr
  }, [filteredByUrgency, sortKey, sortDir, rowSuppliers, defaultSupplierByProduct, supplierMoqById, supplierLeadTimeById, pendingByProductSupplier, salesVelocity])

  const displayProducts = sortedDisplay

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // Auto-default view: if ≥3 suppliers, group by supplier; else flat. Only when user hasn't manually chosen.
  const uniqueSupplierCount = useMemo(() => {
    const set = new Set<string>()
    for (const item of displayProducts) {
      const sid = resolveSupplierId(item.id)
      if (sid) set.add(sid)
    }
    return set.size
  }, [displayProducts, rowSuppliers, defaultSupplierByProduct])

  useEffect(() => {
    if (viewModeManuallySet) return
    const desired: ViewMode = uniqueSupplierCount >= 3 ? 'group' : 'flat'
    if (desired !== viewMode) setViewMode(desired)
  }, [uniqueSupplierCount, viewModeManuallySet, viewMode])

  // Reset urgency filter when there's nothing to show — prevents stale 'missing'/etc filter on empty list
  useEffect(() => {
    if (lowStockProducts.length === 0 && urgencyFilter !== 'all') {
      setUrgencyFilter('all')
    }
  }, [lowStockProducts.length, urgencyFilter])

  const supplierGroups = useMemo(() => {
    if (viewMode !== 'group') return []
    const map = new Map<string, { supplierId: string; supplierName: string; items: typeof displayProducts }>()
    for (const item of displayProducts) {
      const sid = resolveSupplierId(item.id)
      const name = sid ? (suppliers.find((s) => s.id === sid)?.name ?? sid) : '— ยังไม่ได้เลือกซัพ —'
      const key = sid || '__missing__'
      let g = map.get(key)
      if (!g) {
        g = { supplierId: sid, supplierName: name, items: [] }
        map.set(key, g)
      }
      g.items.push(item)
    }
    return [...map.values()].sort((a, b) => {
      if (!a.supplierId && b.supplierId) return -1
      if (a.supplierId && !b.supplierId) return 1
      return a.supplierName.localeCompare(b.supplierName, 'th')
    })
  }, [viewMode, displayProducts, suppliers, rowSuppliers, defaultSupplierByProduct])

  const allSelected = displayProducts.length > 0 && displayProducts.every((p) => selectedIds.has(p.id))
  const someSelected = selectedIds.size > 0
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(displayProducts.map((p) => p.id)))

  const totalSuggestQty = useMemo(
    () =>
      displayProducts.reduce((sum, item) => {
        const supplierId = resolveSupplierId(item.id)
        const pendingStock = resolvePendingStock(item.id, supplierId)
        const moq = resolveMoq(supplierId)
        const effectiveMin = computeEffectiveMin(item, supplierId)
        const shortQty = effectiveMin - (item.currentStock + pendingStock)
        const q = (item.maxStock ?? 0) > 0
          ? (item.maxStock as number)
          : resolveSuggestedQty(shortQty, moq)
        return sum + q
      }, 0),
    [displayProducts, rowSuppliers, defaultSupplierByProduct, supplierMoqById, supplierLeadTimeById, pendingByProductSupplier, salesVelocity],
  )

  const { totalEstimatedCost, totalEstimatedRevenue } = useMemo(() => {
    let cost = 0
    let revenue = 0
    for (const item of displayProducts) {
      const supplierId = resolveSupplierId(item.id)
      const pendingStock = resolvePendingStock(item.id, supplierId)
      const moq = resolveMoq(supplierId)
      const effectiveMin = computeEffectiveMin(item, supplierId)
      const shortQty = effectiveMin - (item.currentStock + pendingStock)
      const q = (item.maxStock ?? 0) > 0
        ? (item.maxStock as number)
        : resolveSuggestedQty(shortQty, moq)
      cost += q * getLatestUnitCostForPo(item)
      revenue += q * (item.sellPrice ?? 0)
    }
    return { totalEstimatedCost: cost, totalEstimatedRevenue: revenue }
  }, [displayProducts, rowSuppliers, defaultSupplierByProduct, supplierMoqById, supplierLeadTimeById, pendingByProductSupplier, salesVelocity])

  const renderItemRow = (item: (typeof stockItems)[number]) => {
    const supplierId = resolveSupplierId(item.id)
    const pendingStock = resolvePendingStock(item.id, supplierId)
    const moq = resolveMoq(supplierId)
    const leadTime = resolveLeadTime(supplierId)
    const effectiveMin = computeEffectiveMin(item, supplierId)
    const shortQty = effectiveMin - (item.currentStock + pendingStock)
    const suggestQty = (item.maxStock ?? 0) > 0
      ? (item.maxStock as number)
      : resolveSuggestedQty(shortQty, moq)
    const vel = salesVelocity.get(item.id) ?? 0
    const daysLeft = vel > 0 ? Math.floor(item.currentStock / vel) : null
    const isOut = item.currentStock <= 0
    const isCritical = !isOut && item.currentStock < item.minStock / 2
    const netShort = Math.max(0, item.minStock - item.currentStock)
    const pct = item.minStock > 0
      ? Math.min(100, Math.round((item.currentStock / item.minStock) * 100))
      : 0
    const ropDelta = effectiveMin - item.minStock

    return (
      <tr key={item.id} className={clsx(
        'transition hover:bg-amber-50/40',
        isOut ? 'bg-rose-50/30' : isCritical ? 'bg-amber-50/20' : '',
        selectedIds.has(item.id) ? 'ring-1 ring-inset ring-amber-300' : '',
      )}>
        <td className="px-2 py-2.5 text-center">
          <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)}
            className="size-3.5 cursor-pointer rounded accent-amber-500" />
        </td>

        <td className="px-3 py-2.5">
          <span className="font-mono text-[10px] text-slate-600">{item.sku}</span>
        </td>

        <td className="max-w-0 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <ProductImage sku={item.sku} size="xs" fallbackLetter={item.brand?.[0]} objectFit="cover" />
            <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800" title={item.name}>{item.name}</p>
            {netShort > 0 && (
              <span className={clsx(
                'shrink-0 rounded-md px-1 py-px text-[9px] font-black tabular-nums',
                isOut ? 'bg-rose-100 text-rose-700' : isCritical ? 'bg-amber-100 text-amber-700' : 'bg-yellow-100 text-yellow-700',
              )}>
                ขาด {netShort}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={clsx('h-full rounded-full transition-all', isOut ? 'bg-rose-500' : isCritical ? 'bg-amber-400' : 'bg-yellow-300')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="shrink-0 text-[9px] tabular-nums text-slate-400">{pct}%</span>
          </div>
        </td>

        <td className="px-2 py-2.5 text-center">
          {isOut ? (
            <span className="inline-block rounded-full border border-rose-200 bg-rose-100 px-2 py-0.5 text-[9px] font-black text-rose-700">หมด</span>
          ) : isCritical ? (
            <span className="inline-block rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-700">วิกฤต</span>
          ) : (
            <span className="inline-block rounded-full border border-yellow-200 bg-yellow-100 px-2 py-0.5 text-[9px] font-black text-yellow-700">ใกล้หมด</span>
          )}
        </td>

        <td className="px-2 py-2.5 text-right">
          <div
            className="flex items-center justify-end gap-1"
            title={item.otherBranchStocks.length > 0
              ? `สต็อกสาขาอื่น:\n${item.otherBranchStocks.map((b) => `· ${b.name}: ${b.stock}`).join('\n')}`
              : undefined}
          >
            <span className={clsx('tabular-nums font-bold text-xs', isOut ? 'text-rose-600' : isCritical ? 'text-amber-600' : 'text-slate-700')}>
              {item.currentStock}
            </span>
            {item.otherBranchStocks.some((b) => b.stock > 0) && (
              <span className="cursor-help text-[9px] text-slate-400" title={`สต็อกสาขาอื่น:\n${item.otherBranchStocks.map((b) => `· ${b.name}: ${b.stock}`).join('\n')}`}>
                ⓘ
              </span>
            )}
          </div>
          {pendingStock > 0 && (
            <p className="text-[9px] tabular-nums text-emerald-600 font-semibold">+{pendingStock} รอ</p>
          )}
          {item.otherBranchStocks.some((b) => b.stock > 0) && (
            <p className="text-[9px] tabular-nums text-slate-400">
              อื่น {item.otherBranchStocks.reduce((s, b) => s + b.stock, 0)}
            </p>
          )}
        </td>

        <td className="px-2 py-2.5 text-right">
          <div className="flex items-center justify-end gap-1">
            <input
              type="number"
              min={0}
              step={1}
              value={item.minStock}
              onChange={(e) => {
                const n = Math.max(0, Math.floor(Number(e.target.value) || 0))
                setWarehouseMinMax(item.id, n, (item.maxStock ?? 0) > 0 ? (item.maxStock as number) : null)
              }}
              className="w-12 rounded-lg border border-slate-200 bg-white px-1 py-1 text-right text-[10px] tabular-nums font-semibold text-slate-700 outline-none focus:border-amber-400"
            />
            {vel > 0 && (
              <button type="button" onClick={() => suggestMinStockForItem(item)}
                title={`แนะนำ ${Math.max(1, Math.ceil(vel * 7))} (ยอดขาย 7 วัน)`}
                className="rounded p-0.5 text-slate-300 transition hover:text-amber-500">
                <Sparkles className="size-3" />
              </button>
            )}
          </div>
          {ropDelta > 0 && (
            <p className="text-[9px] tabular-nums text-slate-400" title={`ลีดไทม์ ${leadTime} วัน × ${vel.toFixed(1)} ชิ้น/วัน`}>
              ROP {effectiveMin}
            </p>
          )}
        </td>

        <td className="px-2 py-2.5 text-right">
          {daysLeft !== null ? (
            <span className={clsx(
              'inline-block rounded-lg px-1.5 py-0.5 text-[10px] font-black tabular-nums',
              daysLeft <= 0 ? 'bg-rose-100 text-rose-700'
                : daysLeft <= 3 ? 'bg-rose-50 text-rose-600'
                : daysLeft <= 7 ? 'bg-amber-50 text-amber-600'
                : 'bg-slate-50 text-slate-500',
            )}>
              {daysLeft}ว
            </span>
          ) : <span className="text-slate-300">—</span>}
          {vel > 0 && (
            <p className="mt-0.5 text-[9px] tabular-nums text-slate-400">
              {vel < 1 ? vel.toFixed(1) : Math.round(vel)}/วัน
            </p>
          )}
        </td>

        <td className="px-2 py-2.5">
          <div className="flex items-center gap-1">
            <select
              value={supplierId}
              onChange={(e) => setRowSuppliers((cur) => ({ ...cur, [item.id]: e.target.value }))}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white py-1 pl-1.5 pr-1 text-[10px] outline-none focus:border-amber-400"
            >
              <option value="">— ซัพ —</option>
              {(() => {
                const linked = productSupplierMap.get(item.id) ?? []
                const list = linked.length > 0
                  ? linked.map((v) => suppliers.find((s) => s.id === v.supplierId)).filter(Boolean)
                  : suppliers
                return list.map((s) => (
                  <option key={s!.id} value={s!.id}>{s!.name}</option>
                ))
              })()}
            </select>
            <button type="button" disabled={!supplierId}
              onClick={() => {
                const next = { ...defaultSupplierByProduct, [item.id]: supplierId }
                setDefaultSupplierByProduct(next); saveDefaultSupplierByProduct(next)
              }}
              className={clsx('shrink-0 rounded-lg border p-1 transition', defaultSupplierByProduct[item.id] === supplierId ? 'border-amber-300 bg-amber-50 text-amber-600' : 'border-slate-200 bg-white text-slate-400 hover:text-amber-500')}
              title="ตั้งเป็นค่าเริ่มต้น">
              <Star className="size-3" />
            </button>
          </div>
        </td>

        <td className="px-2 py-2.5 text-right">
          <div className="flex items-center justify-end gap-0.5">
            <input type="number" min={1} step={1} disabled={!supplierId} value={moq}
              onChange={(e) => {
                if (!supplierId) return
                const n = Math.max(1, Math.floor(Number(e.target.value) || 1))
                const next = { ...supplierMoqById, [supplierId]: n }
                setSupplierMoqById(next); saveSupplierMoqById(next)
              }}
              className="w-10 rounded-lg border border-slate-200 bg-white px-1 py-1 text-center text-[10px] outline-none focus:border-amber-400 disabled:bg-slate-100" />
            <button type="button" disabled={!supplierId}
              onClick={() => recommendMoqForSupplier(supplierId)}
              title="แนะนำ MOQ จากประวัติสั่งซัพนี้"
              className="rounded p-0.5 text-slate-300 transition hover:text-amber-500 disabled:opacity-30">
              <Sparkles className="size-3" />
            </button>
          </div>
        </td>

        <td className="px-2 py-2.5 text-right">
          <input type="number" min={0} step={1} disabled={!supplierId} value={leadTime}
            onChange={(e) => {
              if (!supplierId) return
              const n = Math.max(0, Math.floor(Number(e.target.value) || 0))
              const next = { ...supplierLeadTimeById, [supplierId]: n }
              setSupplierLeadTimeById(next); saveSupplierLeadTimeById(next)
            }}
            title="ลีดไทม์ (วัน) — ใช้คำนวณจุดสั่ง"
            className="w-10 rounded-lg border border-slate-200 bg-white px-1 py-1 text-center text-[10px] outline-none focus:border-amber-400 disabled:bg-slate-100" />
        </td>

        <td className="px-2 py-2.5 text-right">
          <span className="rounded-lg bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800">{suggestQty}</span>
          {getLatestUnitCostForPo(item) > 0 && (
            <p className="mt-0.5 text-[9px] tabular-nums text-slate-400">
              ทุน ฿{(suggestQty * getLatestUnitCostForPo(item)).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
            </p>
          )}
          {(item.sellPrice ?? 0) > 0 && (
            <p className="text-[9px] tabular-nums text-indigo-500 font-semibold">
              ขาย ฿{(suggestQty * (item.sellPrice ?? 0)).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
            </p>
          )}
          {(() => {
            if (!supplierId) return null
            const activePromos = findActiveVendorPromos(
              vendorPromos,
              item.id,
              supplierId,
              item.brand ?? '',
              item.category ?? '',
            )
            if (activePromos.length === 0) return null
            const vp = activePromos[0]!
            const best = findBestVendorPromoTier(vp, suggestQty)
            const next = findNextVendorPromoTier(vp, suggestQty)
            if (best) {
              return (
                <p className="mt-0.5 text-[9px] font-semibold text-blue-600" title={vp.name}>
                  ✓ โปร{best.extraDiscountPct > 0 ? ` -${best.extraDiscountPct}%` : ''}{best.freeQty > 0 ? ` แถม ${best.freeQty}` : ''}
                </p>
              )
            }
            if (next) {
              const gap = next.minQty - suggestQty
              return (
                <p className="mt-0.5 text-[9px] font-semibold text-amber-600" title={vp.name}>
                  💡 +{gap} →{next.extraDiscountPct > 0 ? ` -${next.extraDiscountPct}%` : ''}{next.freeQty > 0 ? ` แถม ${next.freeQty}` : ''}
                </p>
              )
            }
            return null
          })()}
        </td>

      </tr>
    )
  }

  const renderItemCard = (item: (typeof stockItems)[number]) => {
    const supplierId = resolveSupplierId(item.id)
    const pendingStock = resolvePendingStock(item.id, supplierId)
    const moq = resolveMoq(supplierId)
    const leadTime = resolveLeadTime(supplierId)
    const effectiveMin = computeEffectiveMin(item, supplierId)
    const shortQty = effectiveMin - (item.currentStock + pendingStock)
    const suggestQty = (item.maxStock ?? 0) > 0
      ? (item.maxStock as number)
      : resolveSuggestedQty(shortQty, moq)
    const vel = salesVelocity.get(item.id) ?? 0
    const daysLeft = vel > 0 ? Math.floor(item.currentStock / vel) : null
    const isOut = item.currentStock <= 0
    const isCritical = !isOut && item.currentStock < item.minStock / 2
    const cost = getLatestUnitCostForPo(item)
    const checked = selectedIds.has(item.id)
    const otherTotal = item.otherBranchStocks.reduce((s, b) => s + b.stock, 0)
    const activePromos = supplierId
      ? findActiveVendorPromos(vendorPromos, item.id, supplierId, item.brand ?? '', item.category ?? '')
      : []
    const vp = activePromos[0]
    const best = vp ? findBestVendorPromoTier(vp, suggestQty) : null
    const next = vp ? findNextVendorPromoTier(vp, suggestQty) : null

    return (
      <div key={item.id} className={clsx(
        'rounded-xl border bg-white px-3 py-2.5 shadow-sm transition',
        isOut ? 'border-rose-200 bg-rose-50/30'
          : isCritical ? 'border-amber-200 bg-amber-50/20'
          : 'border-slate-200',
        checked && 'ring-2 ring-amber-400',
      )}>
        {/* Row 1: checkbox + image + status + name + qty/cost summary */}
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={checked} onChange={() => toggleSelect(item.id)}
            className="size-3.5 cursor-pointer rounded accent-amber-500" />
          <ProductImage sku={item.sku} size="sm" fallbackLetter={item.brand?.[0]} objectFit="cover" />
          {isOut ? (
            <span className="shrink-0 rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-black text-rose-700">หมด</span>
          ) : isCritical ? (
            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700">วิกฤต</span>
          ) : (
            <span className="shrink-0 rounded-full bg-yellow-100 px-1.5 py-0.5 text-[9px] font-black text-yellow-700">ใกล้หมด</span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-slate-900">{item.name}</h3>
            <p className="truncate font-mono text-[10px] text-slate-400">{item.sku}{item.brand && ` · ${item.brand}`}</p>
          </div>
          <span className="ml-auto shrink-0 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
            สั่ง {suggestQty}
            {cost > 0 && <span className="ml-1 text-[10px] font-semibold text-slate-500">฿{(suggestQty * cost).toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>}
          </span>
        </div>

        {/* Row 2: stats + supplier + MOQ/LT all inline */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-600">
          <span>
            <span className="text-slate-400">สต็อก </span>
            <strong className={clsx('tabular-nums', isOut ? 'text-rose-600' : isCritical ? 'text-amber-600' : 'text-slate-800')}>{item.currentStock}</strong>
            {pendingStock > 0 && <span className="ml-0.5 text-emerald-600 font-semibold">+{pendingStock} รอ</span>}
          </span>
          <span className="flex items-center gap-1">
            <span className="text-slate-400">ขั้นต่ำ</span>
            <input
              type="number"
              min={0}
              step={1}
              value={item.minStock}
              onChange={(e) => {
                const n = Math.max(0, Math.floor(Number(e.target.value) || 0))
                setWarehouseMinMax(item.id, n, (item.maxStock ?? 0) > 0 ? (item.maxStock as number) : null)
              }}
              className="w-12 rounded border border-slate-200 bg-white px-1 py-0.5 text-right text-[11px] tabular-nums font-semibold outline-none focus:border-amber-400"
            />
            {vel > 0 && (
              <button type="button" onClick={() => suggestMinStockForItem(item)}
                title={`แนะนำ ${Math.max(1, Math.ceil(vel * 7))}`}
                className="text-slate-300 hover:text-amber-500">
                <Sparkles className="size-3" />
              </button>
            )}
            {effectiveMin > item.minStock && <span className="text-[9px] text-slate-400">(ROP {effectiveMin})</span>}
          </span>
          <span>
            <span className="text-slate-400">เหลือ </span>
            {daysLeft !== null ? (
              <strong className={clsx('tabular-nums',
                daysLeft <= 3 ? 'text-rose-600'
                : daysLeft <= 7 ? 'text-amber-600'
                : 'text-slate-700')}>
                {daysLeft}ว
              </strong>
            ) : <span className="text-slate-300">—</span>}
            {vel > 0 && <span className="ml-0.5 text-[9px] text-slate-400">({vel < 1 ? vel.toFixed(1) : Math.round(vel)}/วัน)</span>}
          </span>
          {otherTotal > 0 && (
            <span className="text-slate-400" title={item.otherBranchStocks.map((b) => `${b.name}: ${b.stock}`).join('\n')}>
              ⓘ สาขาอื่น {otherTotal}
            </span>
          )}

          <span className="mx-1 h-4 w-px bg-slate-200" />

          <span className="flex items-center gap-1">
            <select
              value={supplierId}
              onChange={(e) => setRowSuppliers((cur) => ({ ...cur, [item.id]: e.target.value }))}
              className="w-40 max-w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-amber-400"
              title={supplierId ? (suppliers.find((s) => s.id === supplierId)?.name ?? '') : 'เลือกซัพพลายเออร์'}
            >
              <option value="">— ซัพ —</option>
              {(() => {
                const linked = productSupplierMap.get(item.id) ?? []
                const list = linked.length > 0
                  ? linked.map((v) => suppliers.find((s) => s.id === v.supplierId)).filter(Boolean)
                  : suppliers
                return list.map((s) => <option key={s!.id} value={s!.id}>{s!.name}</option>)
              })()}
            </select>
            <button type="button" disabled={!supplierId}
              onClick={() => {
                const next = { ...defaultSupplierByProduct, [item.id]: supplierId }
                setDefaultSupplierByProduct(next); saveDefaultSupplierByProduct(next)
              }}
              className={clsx('shrink-0 rounded-lg border p-1 transition',
                defaultSupplierByProduct[item.id] === supplierId
                  ? 'border-amber-300 bg-amber-50 text-amber-600'
                  : 'border-slate-200 bg-white text-slate-400 hover:text-amber-500')}
              title="ตั้งเป็นค่าเริ่มต้น">
              <Star className="size-3" />
            </button>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-slate-400">MOQ</span>
            <input type="number" min={1} step={1} disabled={!supplierId} value={moq}
              onChange={(e) => {
                if (!supplierId) return
                const n = Math.max(1, Math.floor(Number(e.target.value) || 1))
                const upd = { ...supplierMoqById, [supplierId]: n }
                setSupplierMoqById(upd); saveSupplierMoqById(upd)
              }}
              className="w-12 rounded border border-slate-200 bg-white px-1 py-0.5 text-center text-[11px] tabular-nums outline-none focus:border-amber-400 disabled:bg-slate-100" />
          </span>
          <span className="flex items-center gap-1">
            <span className="text-slate-400">LT</span>
            <input type="number" min={0} step={1} disabled={!supplierId} value={leadTime}
              onChange={(e) => {
                if (!supplierId) return
                const n = Math.max(0, Math.floor(Number(e.target.value) || 0))
                const upd = { ...supplierLeadTimeById, [supplierId]: n }
                setSupplierLeadTimeById(upd); saveSupplierLeadTimeById(upd)
              }}
              className="w-12 rounded border border-slate-200 bg-white px-1 py-0.5 text-center text-[11px] tabular-nums outline-none focus:border-amber-400 disabled:bg-slate-100" />
          </span>

          {vp && (best || next) && (
            <span className="ml-auto text-[10px] font-semibold" title={vp.name}>
              {best ? (
                <span className="text-blue-600">
                  ✓ โปร{best.extraDiscountPct > 0 && ` -${best.extraDiscountPct}%`}{best.freeQty > 0 && ` แถม ${best.freeQty}`}
                </span>
              ) : next && (
                <span className="text-amber-600">
                  💡 +{next.minQty - suggestQty} →{next.extraDiscountPct > 0 && ` -${next.extraDiscountPct}%`}{next.freeQty > 0 && ` แถม ${next.freeQty}`}
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    )
  }

  const isEmpty = lowStockProducts.length === 0
  const useCardLayout = displayProducts.length > 0 && displayProducts.length <= 3
  const totalEstCostAll = useMemo(() => {
    let cost = 0
    for (const item of displayProducts) {
      const supplierId = resolveSupplierId(item.id)
      const pendingStock = resolvePendingStock(item.id, supplierId)
      const moq = resolveMoq(supplierId)
      const effectiveMin = computeEffectiveMin(item, supplierId)
      const shortQty = effectiveMin - (item.currentStock + pendingStock)
      const q = (item.maxStock ?? 0) > 0
        ? (item.maxStock as number)
        : resolveSuggestedQty(shortQty, moq)
      cost += q * getLatestUnitCostForPo(item)
    }
    return cost
  }, [displayProducts, rowSuppliers, defaultSupplierByProduct, supplierMoqById, supplierLeadTimeById, pendingByProductSupplier, salesVelocity])

  return (
    <div className={clsx('relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-50', className)}>

      {/* ── Header (minimal when empty, full when populated) ── */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 pb-3 pt-3">

        {/* Top row: title + actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            {onBack && (
              <button type="button" onClick={onBack}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100"
                title="กลับไปหน้าแฟ้มสินค้า">
                <ArrowLeft className="size-3.5" /> กลับไปแฟ้มสินค้า
              </button>
            )}
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">สินค้าใกล้หมด</h1>
              <p className="text-[10px] text-slate-400 leading-tight">
                {isEmpty ? 'ระบบจะแจ้งเมื่อสต็อก + รอรับ < ขั้นต่ำ' : `${lowStockProducts.length} รายการต้องสั่ง`}
              </p>
            </div>
          </div>

          {!isEmpty && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <button type="button" onClick={() => setViewModeUser('flat')}
                  className={clsx(
                    'flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition',
                    viewMode === 'flat' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50',
                  )}
                  title="ตารางแบบเรียงรายการ">
                  <List className="size-3.5" />Flat
                </button>
                <button type="button" onClick={() => setViewModeUser('group')}
                  className={clsx(
                    'flex items-center gap-1 border-l border-slate-200 px-2.5 py-1.5 text-xs font-semibold transition',
                    viewMode === 'group' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50',
                  )}
                  title="จัดกลุ่มตามซัพพลายเออร์">
                  <Layers className="size-3.5" />ตามซัพ
                </button>
              </div>
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm hover:bg-amber-100">
                  <Sparkles className="size-3.5" />แนะนำอัตโนมัติ
                  <ChevronDown className="size-3" />
                </summary>
                <div className="absolute right-0 z-20 mt-1 min-w-[14rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <button type="button" onClick={(e) => { suggestAllMinStock(); (e.currentTarget.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open') }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-amber-50">
                    <Sparkles className="size-3.5 shrink-0 text-amber-500" />
                    <span className="flex-1">
                      <span className="block font-semibold">ขั้นต่ำ</span>
                      <span className="block text-[10px] text-slate-400">จากยอดขาย 7 วัน</span>
                    </span>
                  </button>
                  <button type="button" onClick={(e) => { suggestMoqForAllSuppliers(); (e.currentTarget.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open') }}
                    className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-xs text-slate-700 hover:bg-amber-50">
                    <Sparkles className="size-3.5 shrink-0 text-amber-500" />
                    <span className="flex-1">
                      <span className="block font-semibold">MOQ</span>
                      <span className="block text-[10px] text-slate-400">จากประวัติสั่งซื้อ (ทุกซัพ)</span>
                    </span>
                  </button>
                </div>
              </details>
              <button
                type="button"
                onClick={addSelectedToCart}
                disabled={!someSelected}
                className={clsx(
                  'flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition',
                  someSelected
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                )}
              >
                <ShoppingCart className="size-4" />
                <span>
                  ใส่ตะกร้า
                  {someSelected && ` · ${selectedIds.size} รายการ`}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* KPI strip — compact, only when populated */}
        {!isEmpty && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {([
              { key: 'out', label: 'หมด', count: outOfStock.length, dot: 'bg-rose-500', activeBg: 'bg-rose-100', activeText: 'text-rose-700', activeBorder: 'border-rose-400' },
              { key: 'critical', label: 'วิกฤต', count: critical.length, dot: 'bg-amber-500', activeBg: 'bg-amber-100', activeText: 'text-amber-700', activeBorder: 'border-amber-400' },
              { key: 'warning', label: 'ใกล้หมด', count: warning.length, dot: 'bg-yellow-400', activeBg: 'bg-yellow-100', activeText: 'text-yellow-700', activeBorder: 'border-yellow-400' },
              { key: 'missing', label: 'ขาดซัพ', count: missingSupplier.length, dot: 'bg-slate-400', activeBg: 'bg-slate-100', activeText: 'text-slate-700', activeBorder: 'border-slate-400' },
            ] as const).map(({ key, label, count, dot, activeBg, activeText, activeBorder }) => {
              const active = urgencyFilter === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setUrgencyFilter((f) => f === key ? 'all' : key)}
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition active:scale-95',
                    active
                      ? `${activeBorder} ${activeBg} ${activeText}`
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  <span className={clsx('size-1.5 shrink-0 rounded-full', dot)} />
                  <span>{count}</span>
                  <span className={clsx(active ? '' : 'text-slate-500')}>{label}</span>
                </button>
              )
            })}
            <div className="mx-1 h-4 w-px bg-slate-200" />
            <div className="relative flex-1 min-w-[10rem] max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-slate-400" />
              <input type="search" value={lowStockSearch} onChange={(e) => setLowStockSearch(e.target.value)}
                placeholder="ค้นหา SKU / ชื่อสินค้า…"
                className="w-full rounded-full border border-slate-200 bg-white py-1 pl-7 pr-3 text-[11px] outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100" />
            </div>
            {urgencyFilter !== 'all' && (
              <button type="button" onClick={() => setUrgencyFilter('all')}
                className="ml-auto flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-50">
                ✕ ล้างตัวกรอง
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="min-h-0 flex-1 overflow-auto">
        {displayProducts.length === 0 ? (
          isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-5">
              <div className="flex size-24 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/40">
                <Sparkles className="size-12 text-emerald-400" strokeWidth={1.4} />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-700">สต็อกเพียงพอทุกรายการ</p>
                <p className="mt-1 text-xs text-slate-500">ระบบจะแจ้งเมื่อสินค้าต่ำกว่าขั้นต่ำ</p>
              </div>
              {onGoToCatalog && (
                <button type="button" onClick={onGoToCatalog}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                  <PackagePlus className="size-3.5" />ไปแฟ้มสินค้า
                </button>
              )}
              <p className="text-[10px] text-slate-400">
                ตั้งค่าขั้นต่ำในแฟ้มสินค้า เพื่อให้ระบบแจ้งเตือน
              </p>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-300">
              <span className="flex size-16 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <PackagePlus className="size-8 stroke-[1.2] text-slate-300" />
              </span>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-400">
                  {urgencyFilter === 'missing' ? 'ทุกรายการมีซัพพลายเออร์แล้ว'
                    : urgencyFilter !== 'all' ? 'ไม่มีรายการในกลุ่มนี้'
                    : 'ไม่พบรายการที่ค้นหา'}
                </p>
                {urgencyFilter !== 'all' && (
                  <button type="button" onClick={() => setUrgencyFilter('all')}
                    className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                    ดูทั้งหมด
                  </button>
                )}
              </div>
            </div>
          )
        ) : useCardLayout ? (
          <div className="space-y-2 px-4 py-3">
            {displayProducts.map((item) => renderItemCard(item))}
          </div>
        ) : (
          <table className="w-full table-fixed border-collapse text-left text-[11px] leading-tight">
            <colgroup>
              <col className="w-8" />
              <col className="w-[5.5rem]" />
              <col />
              <col className="w-[4rem]" />
              <col className="w-[4.5rem]" />
              <col className="w-[4rem]" />
              <col className="w-[4rem]" />
              <col className="w-[11rem]" />
              <col className="w-[3rem]" />
              <col className="w-[3rem]" />
              <col className="w-[3.5rem]" />
            </colgroup>
            <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-white/95 backdrop-blur">
              <tr className="text-[9px] font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                <th className="px-2 py-2 text-center">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                    className="size-3.5 cursor-pointer rounded accent-amber-500" />
                </th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">
                  <SortHeaderButton label="ชื่อสินค้า" sortKey="name" current={sortKey} dir={sortDir} onClick={toggleSort} />
                </th>
                <th className="px-2 py-2 text-center">สถานะ</th>
                <th className="px-2 py-2 text-right">
                  <SortHeaderButton label="สต็อก" sortKey="stock" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                </th>
                <th className="px-2 py-2 text-right">
                  <SortHeaderButton label="ขั้นต่ำ" sortKey="min" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                </th>
                <th className="px-2 py-2 text-right">
                  <SortHeaderButton label="เหลือ" sortKey="days" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                </th>
                <th className="px-2 py-2">ซัพ</th>
                <th className="px-2 py-2 text-right" title="ขั้นต่ำต่อสั่ง">MOQ</th>
                <th className="px-2 py-2 text-right" title="ลีดไทม์ (วัน) — ใช้คำนวณจุดสั่ง">LT</th>
                <th className="px-2 py-2 text-right">
                  <SortHeaderButton label="สั่ง" sortKey="qty" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {viewMode === 'group' ? (
                supplierGroups.flatMap((group) => {
                  const isCollapsed = collapsedSuppliers.has(group.supplierId || '__missing__')
                  const groupKey = group.supplierId || '__missing__'
                  // Skip group header noise when there's only 1 group (often "ยังไม่ได้เลือกซัพ" with single item)
                  if (supplierGroups.length === 1) {
                    return group.items.map((item) => renderItemRow(item))
                  }
                  const groupQty = group.items.reduce((s, it) => {
                    const sid = resolveSupplierId(it.id)
                    const pend = resolvePendingStock(it.id, sid)
                    const eff = computeEffectiveMin(it, sid)
                    const sh = eff - (it.currentStock + pend)
                    return s + ((it.maxStock ?? 0) > 0 ? (it.maxStock as number) : resolveSuggestedQty(sh, resolveMoq(sid)))
                  }, 0)
                  const groupCost = group.items.reduce((s, it) => {
                    const sid = resolveSupplierId(it.id)
                    const pend = resolvePendingStock(it.id, sid)
                    const eff = computeEffectiveMin(it, sid)
                    const sh = eff - (it.currentStock + pend)
                    const q = (it.maxStock ?? 0) > 0 ? (it.maxStock as number) : resolveSuggestedQty(sh, resolveMoq(sid))
                    return s + q * getLatestUnitCostForPo(it)
                  }, 0)
                  const headerRow = (
                    <tr key={`grp-${groupKey}`} className="bg-slate-100/80">
                      <td colSpan={11} className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button"
                            onClick={() => setCollapsedSuppliers((cur) => {
                              const n = new Set(cur)
                              if (n.has(groupKey)) n.delete(groupKey); else n.add(groupKey)
                              return n
                            })}
                            className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-amber-600">
                            {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                            {group.supplierName}
                          </button>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            {group.items.length} รายการ · {groupQty.toLocaleString('th-TH')} ชิ้น
                            {groupCost > 0 && ` · ฿${groupCost.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`}
                          </span>
                          {group.supplierId && (() => {
                            const now = new Date()
                            const supPromos = vendorPromos.filter(
                              (vp) => vp.enabled && (vp.supplierId === '' || vp.supplierId === group.supplierId) &&
                                new Date(vp.startDate) <= now && new Date(vp.endDate + 'T23:59:59') >= now,
                            )
                            if (supPromos.length === 0) return null
                            return (
                              <span className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700"
                                title={supPromos.map((p) => p.name).join(' · ')}>
                                🏷 มีโปรซัพ {supPromos.length}
                              </span>
                            )
                          })()}
                          <button type="button"
                            onClick={() => setSelectedIds((prev) => {
                              const n = new Set(prev)
                              for (const it of group.items) n.add(it.id)
                              return n
                            })}
                            className="ml-auto flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50">
                            ✓ เลือกทั้งกลุ่ม
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                  if (isCollapsed) return [headerRow]
                  return [headerRow, ...group.items.map((item) => renderItemRow(item))]
                })
              ) : (
                displayProducts.map((item) => renderItemRow(item))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer summary ── */}
      {displayProducts.length > 0 && (
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="text-[11px] text-slate-500">
              แสดง{' '}
              <span className="font-bold text-slate-700">{displayProducts.length}</span>
              {(lowStockSearch.trim() || urgencyFilter !== 'all') && (
                <span className="text-slate-400"> / {lowStockProducts.length}</span>
              )}{' '}
              รายการ
              {someSelected && (
                <span className="ml-2 font-semibold text-amber-700">· เลือกไว้ {selectedIds.size}</span>
              )}
            </p>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">รวมต้องสั่ง</p>
                <p className="text-sm font-black tabular-nums text-amber-700">
                  {totalSuggestQty.toLocaleString('th-TH')} ชิ้น
                </p>
              </div>
              {totalEstimatedCost > 0 && (
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">ต้นทุนรวม</p>
                  <p className="text-sm font-black tabular-nums text-slate-700">
                    ฿{totalEstimatedCost.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              )}
              {totalEstimatedRevenue > 0 && (
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">รายได้คาด</p>
                  <p className="text-sm font-black tabular-nums text-indigo-700">
                    ฿{totalEstimatedRevenue.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              )}
              {totalEstimatedCost > 0 && totalEstimatedRevenue > 0 && (
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">กำไรรวม</p>
                  <p className={clsx('text-sm font-black tabular-nums', totalEstimatedRevenue > totalEstimatedCost ? 'text-emerald-700' : 'text-rose-700')}>
                    ฿{(totalEstimatedRevenue - totalEstimatedCost).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                    <span className="ml-1 text-[9px] font-bold">
                      ({Math.round(((totalEstimatedRevenue - totalEstimatedCost) / totalEstimatedRevenue) * 100)}%)
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className={clsx(
          'pointer-events-none absolute bottom-6 left-1/2 z-[300] flex -translate-x-1/2 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-xl',
          notice.kind === 'success' && 'bg-emerald-600 text-white',
          notice.kind === 'warn' && 'bg-amber-500 text-white',
          notice.kind === 'info' && 'bg-slate-800 text-white',
        )}>
          <CheckCircle2 className="size-4" />
          {notice.text}
        </div>
      )}
    </div>
  )
}
