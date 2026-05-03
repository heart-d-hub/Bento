import { getStoredBranch } from '@/features/auth/authSession'
import { BRANCHES } from '@/features/auth/branches'
import { getLatestUnitCostForPo } from '@/features/purchase/data/poMovingAverage'
import { loadPurchaseOrders } from '@/features/purchase/data/poStore'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { mergeInventoryProductsWithLiveStock } from '@/features/pos/data/posLiveStock'
import { getProductMasterList } from '@/features/inventory/data/productMasterData'
import {
  applyWarehouseThresholds,
  setWarehouseMinMax,
  INVENTORY_THRESHOLDS_CHANGED_EVENT,
} from '@/features/inventory/data/inventoryStockThresholds'
import { loadRecentSales } from '@/features/pos/data/posSalesHistory'
import { ProductImage } from '@/features/inventory/components/ProductImage'
import { loadPercentOffPromotions, savePercentOffPromotions } from '@/features/promotions/data/percentPromotionsStore'
import { PROMOTIONS_CHANGED_EVENT } from '@/features/promotions/data/promotionsStore'
import type { PercentOffPromotion } from '@/features/promotions/data/promotionTypes'
import { clsx } from 'clsx'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  ExternalLink,
  Layers,
  List,
  MoonStar,
  PackagePlus,
  Search,
  Snowflake,
  Sparkles,
  Tag,
  TimerReset,
  TrendingDown,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const SNOOZE_LS_KEY = 'bento.purchase.slowMover.snoozeUntilByProduct.v1'
const VIEW_PREFS_SS_KEY = 'bento.purchase.slowMover.viewPrefs.v1'

type SnoozeMap = Record<string, string>
type SortKey = 'name' | 'stock' | 'velocity' | 'lastSold' | 'daysToClear' | 'tiedUp'
type SortDir = 'asc' | 'desc'
type UrgencyFilter = 'all' | 'dead' | 'verySlow' | 'slow' | 'noSale60'
type AgeFilter = 'any' | 'older30' | 'older90'
type ViewMode = 'flat' | 'brand'

type ViewPrefs = {
  search?: string
  urgency?: UrgencyFilter
  age?: AgeFilter
  sortKey?: SortKey
  sortDir?: SortDir
  showSnoozed?: boolean
  view?: ViewMode
}

function loadSnooze(): SnoozeMap {
  try {
    const raw = localStorage.getItem(SNOOZE_LS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: SnoozeMap = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string' && v.trim()) out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

function saveSnooze(map: SnoozeMap): void {
  try {
    localStorage.setItem(SNOOZE_LS_KEY, JSON.stringify(map))
  } catch { /* ignore */ }
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
  try { sessionStorage.setItem(VIEW_PREFS_SS_KEY, JSON.stringify(p)) } catch { /* ignore */ }
}

function daysSince(iso: string | undefined | null, nowMs: number): number | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  return Math.floor((nowMs - t) / 86400000)
}

function SortHeaderButton({
  label, sortKey, current, dir, onClick, align = 'left',
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
        'inline-flex w-full items-center gap-1 transition hover:text-indigo-600',
        align === 'right' && 'justify-end',
        align === 'center' && 'justify-center',
        active ? 'text-indigo-700' : 'text-slate-500',
      )}
    >
      <span>{label}</span>
      <Icon className={clsx('size-3', active ? 'opacity-100' : 'opacity-40')} />
    </button>
  )
}

type SlowMoverWorkspacePageProps = {
  className?: string
  onBack?: () => void
  onGoToCatalog?: () => void
}

export function SlowMoverWorkspacePage({ className, onBack, onGoToCatalog }: SlowMoverWorkspacePageProps) {
  const [search, setSearch] = useState(() => loadViewPrefs().search ?? '')
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>(() => loadViewPrefs().urgency ?? 'all')
  const [ageFilter, setAgeFilter] = useState<AgeFilter>(() => loadViewPrefs().age ?? 'any')
  const [sortKey, setSortKey] = useState<SortKey | null>(() => loadViewPrefs().sortKey ?? 'tiedUp')
  const [sortDir, setSortDir] = useState<SortDir>(() => loadViewPrefs().sortDir ?? 'desc')
  const [showSnoozed, setShowSnoozed] = useState<boolean>(() => loadViewPrefs().showSnoozed ?? false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadViewPrefs().view ?? 'flat')
  const [collapsedBrands, setCollapsedBrands] = useState<Set<string>>(new Set())
  const [percentPromos, setPercentPromos] = useState<PercentOffPromotion[]>(() => loadPercentOffPromotions())
  const [discountTarget, setDiscountTarget] = useState<{
    productId: string
    sku: string
    name: string
    sellPrice: number
  } | null>(null)
  const [discountPctStr, setDiscountPctStr] = useState('30')
  const [discountDaysStr, setDiscountDaysStr] = useState('30')

  useEffect(() => {
    const h = () => setPercentPromos(loadPercentOffPromotions())
    window.addEventListener(PROMOTIONS_CHANGED_EVENT, h)
    return () => window.removeEventListener(PROMOTIONS_CHANGED_EVENT, h)
  }, [])

  const activeDiscountByProduct = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const map = new Map<string, number>()
    for (const p of percentPromos) {
      if (!p.enabled) continue
      if (p.startDate > today || p.endDate < today) continue
      const cur = map.get(p.productId) ?? 0
      if (p.percentOff > cur) map.set(p.productId, p.percentOff)
    }
    return map
  }, [percentPromos])

  const openDiscountFor = (it: typeof display[number]) => {
    setDiscountTarget({
      productId: it.id,
      sku: it.sku,
      name: it.name,
      sellPrice: it.sellPrice ?? 0,
    })
    const existing = activeDiscountByProduct.get(it.id) ?? 30
    setDiscountPctStr(String(existing))
    setDiscountDaysStr('30')
  }

  const saveDiscount = () => {
    if (!discountTarget) return
    const pct = Math.max(1, Math.min(90, Math.round(Number(discountPctStr) || 30)))
    const days = Math.max(1, Math.min(365, Math.round(Number(discountDaysStr) || 30)))
    const today = new Date().toISOString().slice(0, 10)
    const end = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
    const newPromo: PercentOffPromotion = {
      id: `po-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `ล้างสต็อก: ${discountTarget.sku}`,
      enabled: true,
      startDate: today,
      endDate: end,
      productId: discountTarget.productId,
      unitIndex: 0,
      percentOff: pct,
    }
    // Disable any existing active promo for the same product+unit (latest wins)
    const today2 = today
    const next = percentPromos.map((p) =>
      p.productId === discountTarget.productId && p.unitIndex === 0 && p.enabled && p.endDate >= today2
        ? { ...p, enabled: false }
        : p,
    ).concat(newPromo)
    setPercentPromos(next)
    savePercentOffPromotions(next)
    setDiscountTarget(null)
    showNotice('success', `ลด ${pct}% สำหรับ ${discountTarget.sku} (${days} วัน)`)
  }
  const [snoozeMap, setSnoozeMap] = useState<SnoozeMap>(() => loadSnooze())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [tick, setTick] = useState(0)
  const [notice, setNotice] = useState<{ kind: 'success' | 'info' | 'warn'; text: string } | null>(null)

  const showNotice = (kind: 'success' | 'info' | 'warn', text: string) => {
    setNotice({ kind, text })
    window.setTimeout(() => setNotice((cur) => (cur && cur.text === text ? null : cur)), 3200)
  }

  useEffect(() => {
    saveViewPrefs({
      search, urgency: urgencyFilter, age: ageFilter,
      sortKey: sortKey ?? undefined, sortDir, showSnoozed, view: viewMode,
    })
  }, [search, urgencyFilter, ageFilter, sortKey, sortDir, showSnoozed, viewMode])

  useEffect(() => {
    const handler = () => setTick((n) => n + 1)
    window.addEventListener(INVENTORY_THRESHOLDS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(INVENTORY_THRESHOLDS_CHANGED_EVENT, handler)
  }, [])

  const branch = getStoredBranch()
  const branchId = branch?.id ?? BRANCHES[0].id
  const orders = useMemo(() => loadPurchaseOrders(), [tick])
  const nowMs = Date.now()

  const stockItems = useMemo(() => {
    const products = applyWarehouseThresholds(mergeInventoryProductsWithLiveStock(getPosCatalogProducts()))
    const masterBySku = new Map(getProductMasterList().map((m) => [m.sku, m] as const))
    return products.map((item) => {
      const master = masterBySku.get(item.sku)
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

  // Sales velocity (per day, last 30 days of recorded sales)
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
    const out = new Map<string, number>()
    for (const [id, qty] of qtyMap) out.set(id, qty / days)
    return out
  }, [tick])

  const lastSoldByProduct = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of loadRecentSales()) {
      if (s.voidedAt) continue
      for (const l of s.lines ?? []) {
        const cur = m.get(l.productId)
        if (!cur || s.at > cur) m.set(l.productId, s.at)
      }
    }
    return m
  }, [tick])

  const lastReceivedByProduct = useMemo(() => {
    const m = new Map<string, string>()
    for (const po of orders) {
      if (po.branchId !== branchId) continue
      const lineToProduct = new Map<string, string>()
      for (const ln of po.lines) lineToProduct.set(ln.lineId, ln.productId)
      for (const batch of po.receiveBatches) {
        for (const r of batch.lines) {
          const pid = lineToProduct.get(r.lineId)
          if (!pid) continue
          const cur = m.get(pid)
          if (!cur || batch.at > cur) m.set(pid, batch.at)
        }
      }
    }
    return m
  }, [orders, branchId])

  const isSnoozedNow = (productId: string): boolean => {
    const until = snoozeMap[productId]
    if (!until) return false
    const t = Date.parse(until)
    return Number.isFinite(t) && t > nowMs
  }

  // Enrich + classify all items
  type Enriched = (typeof stockItems)[number] & {
    velocity: number
    daysToClear: number  // Infinity if velocity 0
    daysSinceSale: number | null
    daysSinceReceived: number | null
    tiedUp: number
    snoozed: boolean
    isDead: boolean
    isVerySlow: boolean
    isSlow: boolean
    isStale: boolean  // not sold in 60+ days
  }

  const enriched = useMemo<Enriched[]>(() => {
    return stockItems.map((it) => {
      const vel = salesVelocity.get(it.id) ?? 0
      const dtc = vel > 0 ? it.currentStock / vel : Number.POSITIVE_INFINITY
      const lastSold = lastSoldByProduct.get(it.id) ?? null
      const lastRecv = lastReceivedByProduct.get(it.id) ?? null
      const daysSinceSale = daysSince(lastSold, nowMs)
      const daysSinceReceived = daysSince(lastRecv, nowMs)
      const cost = getLatestUnitCostForPo(it)
      const tiedUp = it.currentStock * cost
      const isDead = vel === 0 && it.currentStock > 0
      const isVerySlow = vel > 0 && dtc > 365
      const isSlow = vel > 0 && dtc > 90 && dtc <= 365
      const isStale = (daysSinceSale ?? 9999) > 60
      return {
        ...it,
        velocity: vel,
        daysToClear: dtc,
        daysSinceSale,
        daysSinceReceived,
        tiedUp,
        snoozed: isSnoozedNow(it.id),
        isDead, isVerySlow, isSlow, isStale,
      }
    })
  }, [stockItems, salesVelocity, lastSoldByProduct, lastReceivedByProduct, snoozeMap])

  // "Slow candidates": currentStock > 0 AND (dead OR slow). Exclude max=undef and not-classified items.
  const slowAll = useMemo(
    () => enriched.filter((it) => it.currentStock > 0 && (it.isDead || it.isVerySlow || it.isSlow || it.isStale)),
    [enriched],
  )

  // Reset filters when there's nothing to show — prevents stale filter state on empty list
  useEffect(() => {
    if (slowAll.length === 0) {
      if (urgencyFilter !== 'all') setUrgencyFilter('all')
      if (ageFilter !== 'any') setAgeFilter('any')
    }
  }, [slowAll.length, urgencyFilter, ageFilter])

  const filteredBySearch = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return slowAll
    return slowAll.filter((it) => it.sku.toLowerCase().includes(q) || it.name.toLowerCase().includes(q))
  }, [slowAll, search])

  const filteredByAge = useMemo(() => {
    if (ageFilter === 'any') return filteredBySearch
    const min = ageFilter === 'older30' ? 30 : 90
    return filteredBySearch.filter((it) => (it.daysSinceReceived ?? 0) >= min)
  }, [filteredBySearch, ageFilter])

  const visible = useMemo(() => {
    return filteredByAge.filter((it) => showSnoozed || !it.snoozed)
  }, [filteredByAge, showSnoozed])

  const dead = visible.filter((p) => p.isDead).length
  const verySlow = visible.filter((p) => p.isVerySlow).length
  const slow = visible.filter((p) => p.isSlow).length
  const stale = visible.filter((p) => p.isStale).length

  const filteredByUrgency = useMemo(() => {
    if (urgencyFilter === 'all') return visible
    return visible.filter((p) => {
      if (urgencyFilter === 'dead') return p.isDead
      if (urgencyFilter === 'verySlow') return p.isVerySlow
      if (urgencyFilter === 'slow') return p.isSlow
      if (urgencyFilter === 'noSale60') return p.isStale
      return true
    })
  }, [visible, urgencyFilter])

  const sorted = useMemo(() => {
    if (!sortKey) return filteredByUrgency
    const dirMul = sortDir === 'asc' ? 1 : -1
    const arr = [...filteredByUrgency]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name, 'th'); break
        case 'stock': cmp = a.currentStock - b.currentStock; break
        case 'velocity': cmp = a.velocity - b.velocity; break
        case 'lastSold': {
          const av = a.daysSinceSale ?? Number.POSITIVE_INFINITY
          const bv = b.daysSinceSale ?? Number.POSITIVE_INFINITY
          cmp = (av === Number.POSITIVE_INFINITY ? 1e9 : av) - (bv === Number.POSITIVE_INFINITY ? 1e9 : bv)
          break
        }
        case 'daysToClear': {
          const av = a.daysToClear === Number.POSITIVE_INFINITY ? 1e9 : a.daysToClear
          const bv = b.daysToClear === Number.POSITIVE_INFINITY ? 1e9 : b.daysToClear
          cmp = av - bv
          break
        }
        case 'tiedUp': cmp = a.tiedUp - b.tiedUp; break
      }
      return cmp * dirMul
    })
    return arr
  }, [filteredByUrgency, sortKey, sortDir])

  const display = sorted

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const totalTiedUp = useMemo(() => display.reduce((s, it) => s + it.tiedUp, 0), [display])
  const totalUnits = useMemo(() => display.reduce((s, it) => s + it.currentStock, 0), [display])

  const allSelected = display.length > 0 && display.every((p) => selectedIds.has(p.id))
  const someSelected = selectedIds.size > 0
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(display.map((p) => p.id)))

  const snoozeProduct = (productId: string, days: number) => {
    const until = new Date(nowMs + days * 86400000).toISOString()
    const next = { ...snoozeMap, [productId]: until }
    setSnoozeMap(next); saveSnooze(next)
  }
  const unsnoozeProduct = (productId: string) => {
    const next = { ...snoozeMap }
    delete next[productId]
    setSnoozeMap(next); saveSnooze(next)
  }
  const setMinZero = (productId: string, maxStock: number | undefined) => {
    setWarehouseMinMax(productId, 0, (maxStock ?? 0) > 0 ? (maxStock as number) : null)
  }

  const bulkSnooze = (days: number) => {
    const targets = display.filter((p) => selectedIds.has(p.id))
    const list = targets.length > 0 ? targets : display
    const until = new Date(nowMs + days * 86400000).toISOString()
    const next = { ...snoozeMap }
    for (const p of list) next[p.id] = until
    setSnoozeMap(next); saveSnooze(next)
    setSelectedIds(new Set())
    showNotice('success', `พัก ${list.length} รายการ เป็นเวลา ${days} วัน`)
  }

  const bulkSetMinZero = () => {
    const targets = display.filter((p) => selectedIds.has(p.id))
    const list = targets.length > 0 ? targets : display
    for (const p of list) setMinZero(p.id, p.maxStock ?? undefined)
    setTick((n) => n + 1)
    setSelectedIds(new Set())
    showNotice('success', `ตั้งขั้นต่ำ = 0 ให้ ${list.length} รายการ (จะไม่เตือนใกล้หมดอีก)`)
  }

  const isEmpty = slowAll.length === 0
  const useCardLayout = display.length > 0 && display.length <= 3

  // Group by brand (when viewMode = 'brand')
  const brandGroups = useMemo(() => {
    if (viewMode !== 'brand') return []
    const map = new Map<string, { brand: string; items: typeof display; tied: number }>()
    for (const it of display) {
      const k = it.brand || '(ไม่มีแบรนด์)'
      let g = map.get(k)
      if (!g) { g = { brand: k, items: [], tied: 0 }; map.set(k, g) }
      g.items.push(it)
      g.tied += it.tiedUp
    }
    return [...map.values()].sort((a, b) => b.tied - a.tied)  // most tied first
  }, [viewMode, display])

  // Insights: top 3 brands by tied-up value across slowAll (not just visible)
  const insights = useMemo(() => {
    const totalTiedAll = slowAll.reduce((s, it) => s + it.tiedUp, 0)
    const totalUnitsAll = slowAll.reduce((s, it) => s + it.currentStock, 0)
    const byBrand = new Map<string, { tied: number; count: number }>()
    for (const it of slowAll) {
      const k = it.brand || '(ไม่มีแบรนด์)'
      const cur = byBrand.get(k) ?? { tied: 0, count: 0 }
      cur.tied += it.tiedUp
      cur.count += 1
      byBrand.set(k, cur)
    }
    const topBrands = [...byBrand.entries()]
      .map(([brand, v]) => ({ brand, ...v }))
      .sort((a, b) => b.tied - a.tied)
      .slice(0, 3)
    return { totalTiedAll, totalUnitsAll, topBrands }
  }, [slowAll])

  const renderItemRow = (it: typeof display[number]) => {
    const dtc = it.daysToClear === Number.POSITIVE_INFINITY ? null : Math.round(it.daysToClear)
    const cost = getLatestUnitCostForPo(it)
    const otherTotal = it.otherBranchStocks.reduce((s, b) => s + b.stock, 0)
    return (
      <tr key={it.id} className={clsx(
        'transition hover:bg-indigo-50/40',
        it.isDead ? 'bg-slate-50/40' : it.isVerySlow ? 'bg-rose-50/20' : '',
        it.snoozed && 'opacity-60',
        selectedIds.has(it.id) ? 'ring-1 ring-inset ring-indigo-300' : '',
      )}>
        <td className="px-2 py-2.5 text-center">
          <input type="checkbox" checked={selectedIds.has(it.id)} onChange={() => toggleSelect(it.id)}
            className="size-3.5 cursor-pointer rounded accent-indigo-500" />
        </td>
        <td className="px-3 py-2.5">
          <span className="font-mono text-[10px] text-slate-600">{it.sku}</span>
        </td>
        <td className="max-w-0 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <ProductImage sku={it.sku} size="xs" fallbackLetter={it.brand?.[0]} objectFit="cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800" title={it.name}>{it.name}</p>
                {it.snoozed && <span className="shrink-0 rounded-md bg-indigo-100 px-1 py-px text-[9px] font-black text-indigo-700">พัก</span>}
                {it.isDead && <span className="shrink-0 rounded-md bg-slate-200 px-1 py-px text-[9px] font-black text-slate-700">นอน</span>}
                {it.isVerySlow && <span className="shrink-0 rounded-md bg-rose-100 px-1 py-px text-[9px] font-black text-rose-700">ช้ามาก</span>}
              </div>
              {it.daysSinceReceived !== null && (
                <p className="mt-0.5 text-[9px] text-slate-400">รับเข้าล่าสุด {it.daysSinceReceived} วันก่อน</p>
              )}
            </div>
          </div>
        </td>
        <td className="px-2 py-2.5 text-right">
          <div className="flex items-center justify-end gap-1"
            title={otherTotal > 0 ? `สต็อกสาขาอื่น:\n${it.otherBranchStocks.map((b) => `· ${b.name}: ${b.stock}`).join('\n')}` : undefined}>
            <span className="tabular-nums font-bold text-xs text-slate-700">{it.currentStock}</span>
            {otherTotal > 0 && <span className="cursor-help text-[9px] text-slate-400">ⓘ</span>}
          </div>
          {otherTotal > 0 && <p className="text-[9px] tabular-nums text-slate-400">อื่น {otherTotal}</p>}
        </td>
        <td className="px-2 py-2.5 text-right">
          {it.velocity > 0 ? (
            <span className="tabular-nums text-xs text-slate-700">
              {it.velocity < 0.1 ? it.velocity.toFixed(2) : it.velocity < 1 ? it.velocity.toFixed(1) : Math.round(it.velocity)}
            </span>
          ) : <span className="text-slate-300 text-xs">0</span>}
        </td>
        <td className="px-2 py-2.5 text-right">
          {it.daysSinceSale === null ? (
            <span className="inline-block rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-500">ไม่เคย</span>
          ) : (
            <span className={clsx(
              'inline-block rounded-lg px-1.5 py-0.5 text-[10px] font-black tabular-nums',
              it.daysSinceSale > 180 ? 'bg-slate-200 text-slate-700'
              : it.daysSinceSale > 60 ? 'bg-rose-100 text-rose-700'
              : it.daysSinceSale > 30 ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-50 text-emerald-700',
            )}>{it.daysSinceSale}ว</span>
          )}
        </td>
        <td className="px-2 py-2.5 text-right">
          {dtc === null ? (
            <span className="inline-block rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-500">∞</span>
          ) : (
            <span className={clsx(
              'inline-block rounded-lg px-1.5 py-0.5 text-[10px] font-black tabular-nums',
              dtc > 365 ? 'bg-rose-100 text-rose-700'
              : dtc > 180 ? 'bg-amber-100 text-amber-700'
              : 'bg-yellow-50 text-yellow-700',
            )}>{dtc}ว</span>
          )}
        </td>
        <td className="px-2 py-2.5 text-right">
          <span className="tabular-nums font-black text-xs text-slate-800">
            ฿{Math.round(it.tiedUp).toLocaleString('th-TH')}
          </span>
          {cost > 0 && <p className="text-[9px] tabular-nums text-slate-400">ทุน ฿{cost.toLocaleString('th-TH')}</p>}
        </td>
        <td className="px-2 py-2.5">
          <div className="flex items-center justify-center gap-1">
            <button type="button" onClick={() => openDiscountFor(it)}
              className={clsx(
                'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold shadow-sm transition',
                activeDiscountByProduct.has(it.id)
                  ? 'border-rose-300 bg-rose-100 text-rose-800 hover:bg-rose-200'
                  : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
              )}
              title="ลดราคาเพื่อล้างสต็อก">
              <Coins className="size-3.5" />
              {activeDiscountByProduct.has(it.id) ? `-${activeDiscountByProduct.get(it.id)}%` : 'ลดราคา'}
            </button>
            {it.snoozed ? (
              <button type="button" onClick={() => unsnoozeProduct(it.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
                title="เลิกพัก">
                <Snowflake className="size-3.5" />เลิกพัก
              </button>
            ) : (
              <button type="button" onClick={() => snoozeProduct(it.id, 30)}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
                title="พักรายการนี้ 30 วัน">
                <Snowflake className="size-3.5" />พัก
              </button>
            )}
          </div>
        </td>
      </tr>
    )
  }

  const renderItemCard = (it: typeof display[number]) => {
    const dtc = it.daysToClear === Number.POSITIVE_INFINITY ? null : Math.round(it.daysToClear)
    const cost = getLatestUnitCostForPo(it)
    const otherTotal = it.otherBranchStocks.reduce((s, b) => s + b.stock, 0)
    const checked = selectedIds.has(it.id)
    return (
      <div key={it.id} className={clsx(
        'rounded-xl border bg-white px-3 py-2.5 shadow-sm transition',
        it.isDead ? 'border-slate-200 bg-slate-50/40'
          : it.isVerySlow ? 'border-rose-200 bg-rose-50/30'
          : it.isSlow ? 'border-amber-200 bg-amber-50/20'
          : 'border-indigo-200',
        it.snoozed && 'opacity-60',
        checked && 'ring-2 ring-indigo-400',
      )}>
        {/* Row 1: header */}
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={checked} onChange={() => toggleSelect(it.id)}
            className="size-3.5 cursor-pointer rounded accent-indigo-500" />
          <ProductImage sku={it.sku} size="sm" fallbackLetter={it.brand?.[0]} objectFit="cover" />
          {it.snoozed && (
            <span className="shrink-0 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-black text-indigo-700">พัก</span>
          )}
          {it.isDead && (
            <span className="shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-black text-slate-700">นอน</span>
          )}
          {it.isVerySlow && (
            <span className="shrink-0 rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-black text-rose-700">ช้ามาก</span>
          )}
          {!it.isDead && !it.isVerySlow && it.isSlow && (
            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700">ช้า</span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-slate-900">{it.name}</h3>
            <p className="truncate font-mono text-[10px] text-slate-400">{it.sku}{it.brand && ` · ${it.brand}`}</p>
          </div>
          <span className="ml-auto shrink-0 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
            จม ฿{Math.round(it.tiedUp).toLocaleString('th-TH')}
          </span>
        </div>

        {/* Row 2: stats inline */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-600">
          <span>
            <span className="text-slate-400">สต็อก </span>
            <strong className="tabular-nums text-slate-800">{it.currentStock}</strong>
          </span>
          {otherTotal > 0 && (
            <span className="text-slate-400" title={it.otherBranchStocks.map((b) => `${b.name}: ${b.stock}`).join('\n')}>
              ⓘ สาขาอื่น {otherTotal}
            </span>
          )}
          <span>
            <span className="text-slate-400">ขาย </span>
            <strong className="tabular-nums text-slate-700">
              {it.velocity > 0
                ? (it.velocity < 0.1 ? it.velocity.toFixed(2) : it.velocity < 1 ? it.velocity.toFixed(1) : Math.round(it.velocity))
                : '0'}
            </strong>
            <span className="text-slate-400">/วัน</span>
          </span>
          <span>
            <span className="text-slate-400">ขายล่าสุด </span>
            {it.daysSinceSale === null ? (
              <strong className="text-slate-500">ไม่เคย</strong>
            ) : (
              <strong className={clsx('tabular-nums',
                it.daysSinceSale > 180 ? 'text-slate-700'
                : it.daysSinceSale > 60 ? 'text-rose-700'
                : it.daysSinceSale > 30 ? 'text-amber-700'
                : 'text-emerald-700')}>{it.daysSinceSale}ว ก่อน</strong>
            )}
          </span>
          <span>
            <span className="text-slate-400">หมดใน </span>
            {dtc === null ? (
              <strong className="text-slate-500">∞</strong>
            ) : (
              <strong className={clsx('tabular-nums',
                dtc > 365 ? 'text-rose-700'
                : dtc > 180 ? 'text-amber-700'
                : 'text-yellow-700')}>{dtc}ว</strong>
            )}
          </span>
          {cost > 0 && (
            <span>
              <span className="text-slate-400">ทุน </span>
              <strong className="tabular-nums text-slate-700">฿{cost.toLocaleString('th-TH')}/ชิ้น</strong>
            </span>
          )}
          {it.daysSinceReceived !== null && (
            <span className="text-[10px] text-slate-400">รับเข้า {it.daysSinceReceived}ว ก่อน</span>
          )}

          <span className="ml-auto flex items-center gap-1">
            <button type="button" onClick={() => openDiscountFor(it)}
              className={clsx(
                'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold',
                activeDiscountByProduct.has(it.id)
                  ? 'border-rose-300 bg-rose-100 text-rose-800 hover:bg-rose-200'
                  : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
              )}
              title="ลดราคาเพื่อล้างสต็อก">
              <Coins className="size-3" />
              {activeDiscountByProduct.has(it.id) ? `-${activeDiscountByProduct.get(it.id)}%` : 'ลดราคา'}
            </button>
            {it.snoozed ? (
              <button type="button" onClick={() => unsnoozeProduct(it.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
                title="เลิกพัก">
                <Snowflake className="size-3" />เลิกพัก
              </button>
            ) : (
              <button type="button" onClick={() => snoozeProduct(it.id, 30)}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
                title="พัก 30 วัน">
                <Snowflake className="size-3" />พัก 30 วัน
              </button>
            )}
            <button type="button" onClick={() => { setMinZero(it.id, it.maxStock ?? undefined); setTick((n) => n + 1); showNotice('success', `${it.sku}: ตั้งขั้นต่ำ = 0`) }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
              title="ตั้งขั้นต่ำ = 0 (หยุดเตือนใกล้หมด)">
              <TimerReset className="size-3" />min = 0
            </button>
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-50', className)}>

      {/* Header (minimal when empty) */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 pb-3 pt-3">
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
              <h1 className="text-sm font-bold text-slate-900 leading-tight">สินค้าขายช้า / นอนสต็อก</h1>
              <p className="text-[10px] text-slate-400 leading-tight">
                {isEmpty ? 'ระบบจะจับเมื่อ velocity = 0 หรือ days-to-clear > 90' : `${slowAll.length} รายการต้องตัดสินใจ`}
              </p>
            </div>
          </div>

          {!isEmpty && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <button type="button" onClick={() => setViewMode('flat')}
                  className={clsx(
                    'flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition',
                    viewMode === 'flat' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50',
                  )}
                  title="แสดงเรียงรายการ">
                  <List className="size-3.5" />Flat
                </button>
                <button type="button" onClick={() => setViewMode('brand')}
                  className={clsx(
                    'flex items-center gap-1 border-l border-slate-200 px-2.5 py-1.5 text-xs font-semibold transition',
                    viewMode === 'brand' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50',
                  )}
                  title="จัดกลุ่มตามแบรนด์">
                  <Layers className="size-3.5" />ตามแบรนด์
                </button>
              </div>
              <button type="button" onClick={() => setShowSnoozed((v) => !v)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm transition',
                  showSnoozed ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                )}
                title="แสดงรายการที่พักไว้ด้วย">
                <MoonStar className="size-3.5" />{showSnoozed ? 'รวมพักไว้' : 'ซ่อนพักไว้'}
              </button>
              <button
                type="button"
                onClick={bulkSetMinZero}
                disabled={!someSelected}
                className={clsx(
                  'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition',
                  someSelected
                    ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                )}
                title="ตั้งขั้นต่ำของรายการที่เลือก = 0">
                <TimerReset className="size-3.5" />min = 0
                {someSelected && ` · ${selectedIds.size}`}
              </button>
              <button
                type="button"
                onClick={() => bulkSnooze(30)}
                disabled={!someSelected}
                className={clsx(
                  'flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition',
                  someSelected
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                )}
              >
                <Snowflake className="size-4" />
                <span>พัก 30 วัน{someSelected && ` · ${selectedIds.size}`}</span>
              </button>
            </div>
          )}
        </div>

        {/* KPI strip — compact, only when populated */}
        {!isEmpty && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {([
              { key: 'dead', label: 'นอนสต็อก', count: dead, dot: 'bg-slate-400', activeBg: 'bg-slate-100', activeText: 'text-slate-700', activeBorder: 'border-slate-400' },
              { key: 'verySlow', label: 'ช้ามาก >365ว', count: verySlow, dot: 'bg-rose-500', activeBg: 'bg-rose-100', activeText: 'text-rose-700', activeBorder: 'border-rose-400' },
              { key: 'slow', label: 'ช้า 90-365ว', count: slow, dot: 'bg-amber-500', activeBg: 'bg-amber-100', activeText: 'text-amber-700', activeBorder: 'border-amber-400' },
              { key: 'noSale60', label: 'ไม่ขาย 60+ วัน', count: stale, dot: 'bg-indigo-500', activeBg: 'bg-indigo-100', activeText: 'text-indigo-700', activeBorder: 'border-indigo-400' },
            ] as const).map(({ key, label, count, dot, activeBg, activeText, activeBorder }) => {
              const active = urgencyFilter === key
              return (
                <button key={key} type="button"
                  onClick={() => setUrgencyFilter((f) => f === key ? 'all' : key)}
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition active:scale-95',
                    active ? `${activeBorder} ${activeBg} ${activeText}`
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
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหา SKU / ชื่อสินค้า…"
                className="w-full rounded-full border border-slate-200 bg-white py-1 pl-7 pr-3 text-[11px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100" />
            </div>
            <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white">
              {([
                { v: 'any' as const, label: 'ทุกอายุ' },
                { v: 'older30' as const, label: '>30ว' },
                { v: 'older90' as const, label: '>90ว' },
              ]).map(({ v, label }) => (
                <button key={v} type="button" onClick={() => setAgeFilter(v)}
                  className={clsx(
                    'px-2.5 py-1 text-[11px] font-semibold transition',
                    ageFilter === v ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50',
                    v !== 'any' && 'border-l border-slate-200',
                  )}
                  title="กรองตามอายุสต็อก (รับเข้าครั้งล่าสุด)">
                  {label}
                </button>
              ))}
            </div>
            {(urgencyFilter !== 'all' || ageFilter !== 'any') && (
              <button type="button" onClick={() => { setUrgencyFilter('all'); setAgeFilter('any') }}
                className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-50">
                ✕ ล้างตัวกรอง
              </button>
            )}
          </div>
        )}
      </div>

      {/* Insights bar — total tied + top brands */}
      {!isEmpty && (
        <div className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-rose-50/40 via-white to-indigo-50/30 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[11px]">
            <div className="flex items-baseline gap-1.5">
              <Coins className="size-3.5 text-rose-500" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">มูลค่าจมรวม</span>
              <span className="text-base font-black tabular-nums text-rose-700">
                ฿{Math.round(insights.totalTiedAll).toLocaleString('th-TH')}
              </span>
              <span className="text-[10px] text-slate-400">
                · {insights.totalUnitsAll.toLocaleString('th-TH')} ชิ้น
              </span>
            </div>
            {insights.topBrands.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Top แบรนด์ที่จม</span>
                {insights.topBrands.map((b) => (
                  <span key={b.brand}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px]"
                    title={`${b.count} รายการ`}>
                    <span className="font-semibold text-slate-700">{b.brand}</span>
                    <span className="font-bold tabular-nums text-rose-600">
                      ฿{Math.round(b.tied).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[9px] text-slate-400">·{b.count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table / cards / empty */}
      <div className="min-h-0 flex-1 overflow-auto">
        {display.length === 0 ? (
          isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-5">
              <div className="flex size-24 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/40">
                <Sparkles className="size-12 text-emerald-400" strokeWidth={1.4} />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-700">ไม่มีสินค้าขายช้า</p>
                <p className="mt-1 text-xs text-slate-500">ทุกตัวมีการเคลื่อนไหว — ดี!</p>
              </div>
              {onGoToCatalog && (
                <button type="button" onClick={onGoToCatalog}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                  <PackagePlus className="size-3.5" />ไปแฟ้มสินค้า
                </button>
              )}
              <p className="text-[10px] text-slate-400">
                ระบบจะจับเมื่อมีสินค้า velocity = 0 หรือ days-to-clear &gt; 90
              </p>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-300">
              <span className="flex size-16 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <CheckCircle2 className="size-8 stroke-[1.2] text-slate-300" />
              </span>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-400">ไม่พบรายการตามตัวกรอง</p>
                <button type="button" onClick={() => { setUrgencyFilter('all'); setAgeFilter('any') }}
                  className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                  ดูทั้งหมด
                </button>
              </div>
            </div>
          )
        ) : useCardLayout ? (
          <div className="space-y-2 px-4 py-3">
            {viewMode === 'brand'
              ? brandGroups.flatMap((g) => {
                  const k = g.brand
                  const collapsed = collapsedBrands.has(k)
                  const head = (
                    <div key={`b-h-${k}`} className="flex items-center gap-2 rounded-lg bg-slate-100/80 px-3 py-1.5">
                      <button type="button"
                        onClick={() => setCollapsedBrands((cur) => { const n = new Set(cur); if (n.has(k)) n.delete(k); else n.add(k); return n })}
                        className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-indigo-600">
                        {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                        {g.brand}
                      </button>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        {g.items.length} รายการ · จม ฿{Math.round(g.tied).toLocaleString('th-TH')}
                      </span>
                    </div>
                  )
                  if (collapsed) return [head]
                  return [head, ...g.items.map((it) => renderItemCard(it))]
                })
              : display.map((it) => renderItemCard(it))}
          </div>
        ) : (
          <table className="w-full table-fixed border-collapse text-left text-[11px] leading-tight">
            <colgroup>
              <col className="w-8" />
              <col className="w-[5.5rem]" />
              <col />
              <col className="w-[4rem]" />
              <col className="w-[4rem]" />
              <col className="w-[5rem]" />
              <col className="w-[4.5rem]" />
              <col className="w-[5.5rem]" />
              <col className="w-[7rem]" />
            </colgroup>
            <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-white/95 backdrop-blur">
              <tr className="text-[9px] font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                <th className="px-2 py-2 text-center">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                    className="size-3.5 cursor-pointer rounded accent-indigo-500" />
                </th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">
                  <SortHeaderButton label="ชื่อสินค้า" sortKey="name" current={sortKey} dir={sortDir} onClick={toggleSort} />
                </th>
                <th className="px-2 py-2 text-right">
                  <SortHeaderButton label="สต็อก" sortKey="stock" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                </th>
                <th className="px-2 py-2 text-right">
                  <SortHeaderButton label="ขาย/วัน" sortKey="velocity" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                </th>
                <th className="px-2 py-2 text-right">
                  <SortHeaderButton label="ขายล่าสุด" sortKey="lastSold" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                </th>
                <th className="px-2 py-2 text-right">
                  <SortHeaderButton label="หมดใน" sortKey="daysToClear" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                </th>
                <th className="px-2 py-2 text-right">
                  <SortHeaderButton label="มูลค่าจม" sortKey="tiedUp" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                </th>
                <th className="px-2 py-2 text-center">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {viewMode === 'brand' ? (
                brandGroups.flatMap((g) => {
                  const k = g.brand
                  const collapsed = collapsedBrands.has(k)
                  const head = (
                    <tr key={`b-h-${k}`} className="bg-slate-100/80">
                      <td colSpan={9} className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button"
                            onClick={() => setCollapsedBrands((cur) => { const n = new Set(cur); if (n.has(k)) n.delete(k); else n.add(k); return n })}
                            className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-indigo-600">
                            {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                            {g.brand}
                          </button>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            {g.items.length} รายการ · จม ฿{Math.round(g.tied).toLocaleString('th-TH')}
                          </span>
                          <button type="button"
                            onClick={() => setSelectedIds((prev) => { const n = new Set(prev); for (const it of g.items) n.add(it.id); return n })}
                            className="ml-auto flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50">
                            ✓ เลือกทั้งกลุ่ม
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                  if (collapsed) return [head]
                  return [head, ...g.items.map((it) => renderItemRow(it))]
                })
              ) : (
                display.map((it) => renderItemRow(it))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {display.length > 0 && (
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="text-[11px] text-slate-500">
              แสดง <span className="font-bold text-slate-700">{display.length}</span>
              {(search.trim() || urgencyFilter !== 'all' || ageFilter !== 'any') && (
                <span className="text-slate-400"> / {slowAll.length}</span>
              )} รายการ
              {someSelected && <span className="ml-2 font-semibold text-indigo-700">· เลือกไว้ {selectedIds.size}</span>}
            </p>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">รวมจำนวน</p>
                <p className="text-sm font-black tabular-nums text-slate-700">{totalUnits.toLocaleString('th-TH')} ชิ้น</p>
              </div>
              <div className="text-right">
                <p className="flex items-center justify-end gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                  <Coins className="size-3" />มูลค่าจมรวม
                </p>
                <p className="text-sm font-black tabular-nums text-rose-700">
                  ฿{Math.round(totalTiedUp).toLocaleString('th-TH')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {discountTarget && (() => {
        const pct = Math.max(0, Math.min(90, Number(discountPctStr) || 0))
        const newPrice = discountTarget.sellPrice * (1 - pct / 100)
        return (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center gap-3 border-b border-slate-100 bg-rose-50 px-5 py-4">
                <span className="flex size-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <Coins className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">ลดราคาเพื่อล้างสต็อก</p>
                  <p className="truncate text-xs text-slate-500">{discountTarget.sku} — {discountTarget.name}</p>
                </div>
              </div>
              <div className="space-y-4 px-5 py-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">ลด (% off)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      step={1}
                      value={discountPctStr}
                      onChange={(e) => setDiscountPctStr(e.target.value)}
                      className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-right text-sm font-mono outline-none focus:border-rose-400"
                      autoFocus
                    />
                    <span className="text-xs text-slate-500">%</span>
                    {discountTarget.sellPrice > 0 && (
                      <span className="ml-auto text-xs text-slate-500">
                        <span className="line-through text-slate-400">฿{discountTarget.sellPrice.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                        {' → '}
                        <span className="text-base font-black text-rose-700">฿{newPrice.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                      </span>
                    )}
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">โปรอยู่กี่วัน</span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    step={1}
                    value={discountDaysStr}
                    onChange={(e) => setDiscountDaysStr(e.target.value)}
                    className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-right text-sm font-mono outline-none focus:border-rose-400"
                  />
                  <span className="ml-2 text-xs text-slate-500">วัน</span>
                </label>
                {activeDiscountByProduct.has(discountTarget.productId) && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                    ⚠ มีโปรลด {activeDiscountByProduct.get(discountTarget.productId)}% อยู่แล้ว — บันทึกใหม่จะแทนที่
                  </p>
                )}
              </div>
              <div className="flex gap-2 border-t border-slate-100 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setDiscountTarget(null)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={saveDiscount}
                  className="flex-[2] rounded-lg bg-rose-600 py-2 text-sm font-bold text-white shadow-sm hover:bg-rose-700"
                >
                  บันทึกโปร — ลด {Math.max(1, Math.min(90, Math.round(Number(discountPctStr) || 0)))}%
                </button>
              </div>
            </div>
          </div>
        )
      })()}

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
