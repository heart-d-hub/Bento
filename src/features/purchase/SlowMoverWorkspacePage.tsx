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
import { clsx } from 'clsx'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  MoonStar,
  Search,
  Snowflake,
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

type ViewPrefs = {
  search?: string
  urgency?: UrgencyFilter
  age?: AgeFilter
  sortKey?: SortKey
  sortDir?: SortDir
  showSnoozed?: boolean
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
      sortKey: sortKey ?? undefined, sortDir, showSnoozed,
    })
  }, [search, urgencyFilter, ageFilter, sortKey, sortDir, showSnoozed])

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
      const b1Id = BRANCHES[0]?.id
      const b2Id = BRANCHES[1]?.id
      const b1 = master?.crossBranch?.find((r) => r.branchId === b1Id)?.stock ?? item.stock
      const b2 = master?.crossBranch?.find((r) => r.branchId === b2Id)?.stock ?? 0
      return {
        ...item,
        currentStock: item.stock,
        branches: { b1, b2 },
        sellPrice: master?.sellPrice ?? 0,
      }
    })
  }, [tick])

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

  return (
    <div className={clsx('relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-50', className)}>

      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 pb-3 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            {onBack && (
              <button type="button" onClick={onBack}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                <ArrowLeft className="size-3.5" /> กลับ
              </button>
            )}
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">สินค้าขายช้า / นอนสต็อก</h1>
              <p className="text-[10px] text-slate-400 leading-tight">ของกินทุน + ของกินพื้นที่ — เรียงตามมูลค่าจม</p>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setShowSnoozed((v) => !v)}
              className={clsx(
                'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm transition',
                showSnoozed ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
              )}
              title="แสดงรายการที่พักไว้ด้วย">
              <MoonStar className="size-3.5" />{showSnoozed ? 'รวมพักไว้' : 'ซ่อนพักไว้'}
            </button>
            {someSelected ? (
              <>
                <button type="button" onClick={() => bulkSnooze(30)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-600">
                  <Snowflake className="size-3.5" />พัก 30 วัน ({selectedIds.size})
                </button>
                <button type="button" onClick={bulkSetMinZero}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50">
                  <TimerReset className="size-3.5" />min=0 ({selectedIds.size})
                </button>
              </>
            ) : (
              <button type="button" onClick={() => bulkSnooze(30)}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-indigo-100"
                title="พักสินค้าในรายการนี้ทั้งหมด 30 วัน">
                <Snowflake className="size-3.5" />พักทั้งหมด 30 วัน
              </button>
            )}
          </div>
        </div>

        {/* KPI */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([
            {
              key: 'dead', label: 'นอนสต็อก', count: dead, icon: Snowflake,
              border: 'border-slate-200', bg: 'bg-slate-50', activeBg: 'bg-slate-100',
              activeBorder: 'border-slate-400 ring-2 ring-slate-200',
              iconBg: 'bg-slate-100', iconColor: 'text-slate-600',
              labelColor: 'text-slate-500', numColor: 'text-slate-700',
            },
            {
              key: 'verySlow', label: 'ช้ามาก >365ว', count: verySlow, icon: TrendingDown,
              border: 'border-rose-200', bg: 'bg-rose-50', activeBg: 'bg-rose-100',
              activeBorder: 'border-rose-400 ring-2 ring-rose-200',
              iconBg: 'bg-rose-100', iconColor: 'text-rose-600',
              labelColor: 'text-rose-500', numColor: 'text-rose-700',
            },
            {
              key: 'slow', label: 'ช้า 90-365ว', count: slow, icon: Clock,
              border: 'border-amber-200', bg: 'bg-amber-50', activeBg: 'bg-amber-100',
              activeBorder: 'border-amber-400 ring-2 ring-amber-200',
              iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
              labelColor: 'text-amber-500', numColor: 'text-amber-700',
            },
            {
              key: 'noSale60', label: 'ไม่ขาย 60+ วัน', count: stale, icon: MoonStar,
              border: 'border-indigo-200', bg: 'bg-indigo-50', activeBg: 'bg-indigo-100',
              activeBorder: 'border-indigo-400 ring-2 ring-indigo-200',
              iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600',
              labelColor: 'text-indigo-500', numColor: 'text-indigo-700',
            },
          ] as const).map(({ key, label, count, icon: Icon, border, bg, activeBg, activeBorder, iconBg, iconColor, labelColor, numColor }) => {
            const active = urgencyFilter === key
            return (
              <button key={key} type="button"
                onClick={() => setUrgencyFilter((f) => f === key ? 'all' : key)}
                className={clsx(
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition hover:opacity-90 active:scale-[0.98]',
                  active ? `${activeBorder} ${activeBg}` : `${border} ${bg}`,
                )}
              >
                <span className={clsx('flex size-8 shrink-0 items-center justify-center rounded-lg', iconBg)}>
                  <Icon className={clsx('size-4', iconColor)} />
                </span>
                <div className="min-w-0">
                  <p className={clsx('text-[9px] font-bold uppercase tracking-wide', labelColor)}>{label}</p>
                  <p className={clsx('text-xl font-black leading-none tabular-nums', numColor)}>{count}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Search + age filter */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา SKU / ชื่อสินค้า…"
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100" />
          </div>
          <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {([
              { v: 'any' as const, label: 'อายุใดๆ' },
              { v: 'older30' as const, label: '>30ว' },
              { v: 'older90' as const, label: '>90ว' },
            ]).map(({ v, label }) => (
              <button key={v} type="button" onClick={() => setAgeFilter(v)}
                className={clsx(
                  'px-2.5 py-1.5 text-xs font-semibold transition',
                  ageFilter === v ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50',
                  v !== 'any' && 'border-l border-slate-200',
                )}
                title="กรองตามอายุสต็อก (วันที่รับเข้าครั้งล่าสุด)">
                {label}
              </button>
            ))}
          </div>
          {(urgencyFilter !== 'all' || ageFilter !== 'any') && (
            <button type="button" onClick={() => { setUrgencyFilter('all'); setAgeFilter('any') }}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50">
              ✕ ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto">
        {display.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-300">
            <span className="flex size-16 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <CheckCircle2 className="size-8 stroke-[1.2] text-slate-300" />
            </span>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-400">
                {slowAll.length === 0 ? 'ไม่มีสินค้าขายช้าในขณะนี้' : 'ไม่พบรายการตามตัวกรอง'}
              </p>
              {slowAll.length === 0 && (
                <p className="mt-1 text-xs text-slate-400">ระบบจะเริ่มจับเมื่อมีสินค้าที่ velocity = 0 หรือ days-to-clear &gt; 90</p>
              )}
            </div>
          </div>
        ) : (
          <table className="w-full table-fixed border-collapse text-left text-[11px] leading-tight">
            <colgroup>
              <col className="w-8" />
              <col className="w-[5.5rem]" />
              <col />
              <col className="w-[3.5rem]" />
              <col className="w-[3rem]" />
              <col className="w-[3rem]" />
              <col className="w-[4rem]" />
              <col className="w-[5rem]" />
              <col className="w-[4.5rem]" />
              <col className="w-[5rem]" />
              <col className="w-[8rem]" />
            </colgroup>
            <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-white/95 backdrop-blur">
              <tr className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
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
                <th className="px-2 py-2 text-right" title={BRANCHES[0]?.name}>{BRANCHES[0]?.name?.slice(0, 3) ?? 'ส1'}</th>
                <th className="px-2 py-2 text-right" title={BRANCHES[1]?.name}>{BRANCHES[1]?.name?.slice(0, 3) ?? 'ส2'}</th>
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
                <th className="px-2 py-2 text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {display.map((it) => {
                const dtc = it.daysToClear === Number.POSITIVE_INFINITY ? null : Math.round(it.daysToClear)
                const cost = getLatestUnitCostForPo(it)
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
                      <div className="flex items-center gap-1.5">
                        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800" title={it.name}>{it.name}</p>
                        {it.snoozed && (
                          <span className="shrink-0 rounded-md bg-indigo-100 px-1 py-px text-[9px] font-black text-indigo-700">พัก</span>
                        )}
                        {it.isDead && (
                          <span className="shrink-0 rounded-md bg-slate-200 px-1 py-px text-[9px] font-black text-slate-700">นอน</span>
                        )}
                        {it.isVerySlow && (
                          <span className="shrink-0 rounded-md bg-rose-100 px-1 py-px text-[9px] font-black text-rose-700">ช้ามาก</span>
                        )}
                      </div>
                      {it.daysSinceReceived !== null && (
                        <p className="mt-0.5 text-[9px] text-slate-400">รับเข้าล่าสุด {it.daysSinceReceived} วันก่อน</p>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums font-bold text-xs text-slate-700">{it.currentStock}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-slate-500 text-xs">{it.branches.b1}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-slate-500 text-xs">{it.branches.b2}</td>
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
                        )}>
                          {it.daysSinceSale}ว
                        </span>
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
                        )}>
                          {dtc}ว
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <span className="tabular-nums font-black text-xs text-slate-800">
                        ฿{Math.round(it.tiedUp).toLocaleString('th-TH')}
                      </span>
                      {cost > 0 && (
                        <p className="text-[9px] tabular-nums text-slate-400">ทุน ฿{cost.toLocaleString('th-TH')}/ชิ้น</p>
                      )}
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        {it.snoozed ? (
                          <button type="button" onClick={() => unsnoozeProduct(it.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700 transition hover:bg-indigo-100"
                            title="เลิกพัก">
                            <Snowflake className="size-3" />เลิกพัก
                          </button>
                        ) : (
                          <button type="button" onClick={() => snoozeProduct(it.id, 30)}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700 transition hover:bg-indigo-100"
                            title="พักรายการนี้ 30 วัน">
                            <Snowflake className="size-3" />พัก
                          </button>
                        )}
                        <button type="button" onClick={() => { setMinZero(it.id, it.maxStock ?? undefined); setTick((n) => n + 1); showNotice('success', `${it.sku}: ตั้งขั้นต่ำ = 0`) }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                          title="ตั้งขั้นต่ำ = 0 (หยุดเตือนใกล้หมด)">
                          <TimerReset className="size-3" />min0
                        </button>
                        <button type="button" onClick={onGoToCatalog}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                          title="ไปดูในแคตตาล็อก (ตั้งราคา/โปร)">
                          <Tag className="size-3" />
                          <ExternalLink className="size-2.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
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
