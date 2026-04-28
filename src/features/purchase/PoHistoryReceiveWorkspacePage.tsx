import { loadPurchaseOrders, PURCHASE_ORDERS_CHANGED_EVENT } from '@/features/purchase/data/poStore'
import { loadSupplierDirectory } from '@/features/purchase/data/supplierDirectoryStore'
import type { PurchaseOrder } from '@/features/purchase/data/poTypes'
import { clsx } from 'clsx'
import {
  ArrowDownRight, ArrowUpRight, CalendarDays, ChevronDown, ChevronRight,
  ChevronsDownUp, ChevronsUpDown, Layers, Package, Receipt, Search, Truck,
  TrendingDown, TrendingUp, X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type PoHistoryReceiveWorkspacePageProps = { className?: string }

type ReceiveLine = {
  lineId: string; sku: string; name: string; productId: string
  qty: number; unitCost: number; shortageQty?: number
}
type ReceiveEntry = {
  batchId: string; batchIndex: number
  poId: string; poNo: string; supplierName: string; supplierId: string
  at: string; dateKey: string
  lines: ReceiveLine[]
  refNos?: string; shippingCost?: number
  totalQty: number; totalValue: number
}
type ProductHistory = {
  sku: string; name: string; productId: string
  totalQty: number; totalValue: number; receiveCount: number
  firstCost: number; lastCost: number; firstAt: string; lastAt: string
  avgCost: number
  events: Array<{ at: string; poNo: string; supplierName: string; qty: number; unitCost: number; batchId: string }>
}

// ── data builders ─────────────────────────────────────────────────────────────

function buildEntries(orders: PurchaseOrder[]): ReceiveEntry[] {
  const entries: ReceiveEntry[] = []
  for (const po of orders) {
    po.receiveBatches.forEach((batch, bIdx) => {
      const lines: ReceiveLine[] = batch.lines.map((bl) => {
        const poLine = po.lines.find((l) => l.lineId === bl.lineId)
        return { lineId: bl.lineId, sku: poLine?.sku ?? bl.lineId, name: poLine?.name ?? '—', productId: poLine?.productId ?? '', qty: bl.qty, unitCost: bl.unitCost, shortageQty: bl.shortageQty }
      })
      entries.push({
        batchId: batch.id, batchIndex: bIdx + 1,
        poId: po.id, poNo: po.poNo, supplierName: po.supplierName || '—', supplierId: po.supplierId ?? '',
        at: batch.at, dateKey: batch.at.slice(0, 10),
        lines, refNos: batch.refNos, shippingCost: batch.shippingCostBaht,
        totalQty: lines.reduce((s, l) => s + l.qty, 0),
        totalValue: lines.reduce((s, l) => s + l.qty * l.unitCost, 0),
      })
    })
  }
  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

function buildProductHistory(entries: ReceiveEntry[]): ProductHistory[] {
  const map = new Map<string, ProductHistory>()
  // process oldest→newest so firstCost/lastCost are correct
  for (const entry of [...entries].reverse()) {
    for (const l of entry.lines) {
      const existing = map.get(l.sku)
      const event = { at: entry.at, poNo: entry.poNo, supplierName: entry.supplierName, qty: l.qty, unitCost: l.unitCost, batchId: entry.batchId }
      if (!existing) {
        map.set(l.sku, {
          sku: l.sku, name: l.name, productId: l.productId,
          totalQty: l.qty, totalValue: l.qty * l.unitCost, receiveCount: 1,
          firstCost: l.unitCost, lastCost: l.unitCost,
          firstAt: entry.at, lastAt: entry.at, avgCost: l.unitCost,
          events: [event],
        })
      } else {
        existing.totalQty   += l.qty
        existing.totalValue += l.qty * l.unitCost
        existing.receiveCount++
        existing.lastCost = l.unitCost
        existing.lastAt   = entry.at
        existing.avgCost  = existing.totalValue / existing.totalQty
        existing.events.push(event)
      }
    }
  }
  // sort events newest-first, products by last receive date newest-first
  const arr = Array.from(map.values())
  for (const p of arr) p.events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  return arr.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
}

function buildPrevCostMap(allEntries: ReceiveEntry[]): Map<string, Map<string, number | null>> {
  const skuLastCost = new Map<string, number>()
  const result = new Map<string, Map<string, number | null>>()
  for (const entry of [...allEntries].reverse()) {
    const prev = new Map<string, number | null>()
    for (const l of entry.lines) { prev.set(l.lineId, skuLastCost.get(l.sku) ?? null); skuLastCost.set(l.sku, l.unitCost) }
    result.set(entry.batchId, prev)
  }
  return result
}

// ── formatters ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) }
function fmtDateLong(dk: string) { return new Date(dk + 'T12:00:00').toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }
function fmtMoney(n: number) { return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : fmtMoney(n) }
function isoToday() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function isoNDaysAgo(n: number) { const d = new Date(Date.now() - n * 86400000); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function isoMonthStart() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` }

const SUPPLIER_COLORS = ['bg-blue-400','bg-violet-400','bg-rose-400','bg-amber-400','bg-teal-400','bg-pink-400','bg-indigo-400','bg-orange-400']
function supplierColor(id: string) { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return SUPPLIER_COLORS[h % SUPPLIER_COLORS.length]! }

type QuickRange = 'today' | '7d' | '30d' | 'month' | 'all'
type ViewMode = 'batch' | 'product'

// ── component ─────────────────────────────────────────────────────────────────

export function PoHistoryReceiveWorkspacePage({ className }: PoHistoryReceiveWorkspacePageProps) {
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => loadPurchaseOrders())
  const refresh = useCallback(() => setOrders(loadPurchaseOrders()), [])
  useEffect(() => {
    window.addEventListener(PURCHASE_ORDERS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(PURCHASE_ORDERS_CHANGED_EVENT, refresh)
  }, [refresh])

  const [viewMode, setViewMode]           = useState<ViewMode>('batch')
  const [search, setSearch]               = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [quickRange, setQuickRange]       = useState<QuickRange>('all')
  const [dateFrom, setDateFrom]           = useState('')
  const [dateTo, setDateTo]               = useState('')
  const [expanded, setExpanded]           = useState<Set<string>>(new Set())
  const [allOpen, setAllOpen]             = useState(false)

  // Reset expand state on view mode switch
  const switchView = (m: ViewMode) => { setViewMode(m); setExpanded(new Set()); setAllOpen(false) }

  const suppliers = useMemo(() => {
    const dir = loadSupplierDirectory()
    const merged = new Map<string, string>()
    for (const s of dir) merged.set(s.id, s.name)
    for (const o of orders) if (o.supplierId && !merged.has(o.supplierId)) merged.set(o.supplierId, o.supplierName || o.supplierId)
    return Array.from(merged.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'th'))
  }, [orders])

  const allEntries  = useMemo(() => buildEntries(orders), [orders])
  const prevCostMap = useMemo(() => buildPrevCostMap(allEntries), [allEntries])

  const effectiveDateFrom = useMemo(() => {
    if (quickRange === 'today') return isoToday()
    if (quickRange === '7d')    return isoNDaysAgo(6)
    if (quickRange === '30d')   return isoNDaysAgo(29)
    if (quickRange === 'month') return isoMonthStart()
    return dateFrom
  }, [quickRange, dateFrom])
  const effectiveDateTo = useMemo(() => quickRange !== 'all' ? isoToday() : dateTo, [quickRange, dateTo])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allEntries.filter((e) => {
      if (filterSupplier && e.supplierId !== filterSupplier) return false
      if (effectiveDateFrom && e.dateKey < effectiveDateFrom) return false
      if (effectiveDateTo   && e.dateKey > effectiveDateTo)   return false
      if (q) {
        const hay = [e.poNo, e.supplierName, e.refNos ?? '', ...e.lines.map((l) => `${l.sku} ${l.name}`)].join(' ').toLowerCase()
        return hay.includes(q)
      }
      return true
    })
  }, [allEntries, search, filterSupplier, effectiveDateFrom, effectiveDateTo])

  const productRows = useMemo(() => buildProductHistory(filtered), [filtered])

  const totalBatches = filtered.length
  const totalQty     = filtered.reduce((s, e) => s + e.totalQty, 0)
  const totalValue   = filtered.reduce((s, e) => s + e.totalValue, 0)
  const avgBatch     = totalBatches > 0 ? totalValue / totalBatches : 0

  const { priceUpCount, priceDownCount } = useMemo(() => {
    let up = 0, dn = 0
    for (const e of filtered) {
      const pm = prevCostMap.get(e.batchId)
      if (!pm) continue
      for (const l of e.lines) {
        const prev = pm.get(l.lineId)
        if (prev == null || prev <= 0) continue
        if (l.unitCost - prev >  0.005) up++
        if (l.unitCost - prev < -0.005) dn++
      }
    }
    return { priceUpCount: up, priceDownCount: dn }
  }, [filtered, prevCostMap])

  const groups = useMemo(() => {
    const map = new Map<string, ReceiveEntry[]>()
    for (const e of filtered) { const arr = map.get(e.dateKey) ?? []; arr.push(e); map.set(e.dateKey, arr) }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const toggle = (id: string) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => {
    if (allOpen) { setExpanded(new Set()); setAllOpen(false) }
    else {
      const ids = viewMode === 'batch' ? filtered.map((e) => e.batchId) : productRows.map((p) => p.sku)
      setExpanded(new Set(ids)); setAllOpen(true)
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className={clsx('flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm', className)}>

      {/* Header */}
      <header className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100">
              <Truck className="size-4 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">บันทึกรับของเข้า</h1>
              <p className="text-[11px] text-slate-500">ประวัติทุกครั้งที่รับสินค้า · เรียงล่าสุดก่อน</p>
            </div>
          </div>
          {totalBatches > 0 && (
            <div className="flex flex-wrap gap-2">
              <div className="flex flex-col items-end rounded-xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm">
                <span className="text-[10px] font-medium text-slate-400">มูลค่ารวม</span>
                <span className="text-base font-black tabular-nums text-emerald-700">฿{fmtK(totalValue)}</span>
              </div>
              <div className="flex flex-col items-end rounded-xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm">
                <span className="text-[10px] font-medium text-slate-400">รับ {totalBatches} ครั้ง · {totalQty.toLocaleString('th-TH')} ชิ้น</span>
                <span className="text-base font-black tabular-nums text-slate-700">เฉลี่ย ฿{fmtK(avgBatch)}</span>
              </div>
              {(priceUpCount > 0 || priceDownCount > 0) && (
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm">
                  {priceUpCount  > 0 && <span className="flex items-center gap-0.5 text-[11px] font-bold text-rose-500"><ArrowUpRight className="size-3.5" />{priceUpCount}</span>}
                  {priceDownCount > 0 && <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600"><ArrowDownRight className="size-3.5" />{priceDownCount}</span>}
                  <span className="text-[10px] text-slate-400">ราคาเปลี่ยน</span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Filter + view toggle bar */}
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[160px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="SKU / ชื่อ / PO / ใบกำกับ"
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs outline-none focus:border-amber-400" />
            {search && <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X className="size-3" /></button>}
          </div>

          {/* Supplier */}
          <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-6 text-xs outline-none focus:border-amber-400">
            <option value="">ซัพพลายเออร์ทั้งหมด</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {/* Quick range pills */}
          <div className="flex items-center gap-1">
            {([{ k: 'today', l: 'วันนี้' }, { k: '7d', l: '7 วัน' }, { k: '30d', l: '30 วัน' }, { k: 'month', l: 'เดือนนี้' }, { k: 'all', l: 'ทั้งหมด' }] as const).map(({ k, l }) => (
              <button key={k} type="button" onClick={() => { setQuickRange(k); if (k !== 'all') { setDateFrom(''); setDateTo('') } }}
                className={clsx('rounded-full px-2.5 py-1 text-[11px] font-semibold transition',
                  quickRange === k ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-slate-500 hover:bg-slate-100 ring-1 ring-slate-200')}>
                {l}
              </button>
            ))}
          </div>

          {quickRange === 'all' && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <CalendarDays className="size-3.5 shrink-0" />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] outline-none focus:border-amber-400" />
              <span>—</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] outline-none focus:border-amber-400" />
            </div>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            {/* View mode toggle */}
            <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white text-[11px] font-semibold">
              <button type="button" onClick={() => switchView('batch')}
                className={clsx('flex items-center gap-1.5 px-3 py-1.5 transition', viewMode === 'batch' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50')}>
                <Layers className="size-3.5" />ตามการรับ
              </button>
              <button type="button" onClick={() => switchView('product')}
                className={clsx('flex items-center gap-1.5 border-l border-slate-200 px-3 py-1.5 transition', viewMode === 'product' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50')}>
                <Package className="size-3.5" />ตามสินค้า
              </button>
            </div>

            {/* Expand all */}
            {filtered.length > 0 && (
              <button type="button" onClick={toggleAll}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50">
                {allOpen ? <ChevronsDownUp className="size-3.5" /> : <ChevronsUpDown className="size-3.5" />}
                {allOpen ? 'ย่อ' : 'ขยาย'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Ledger body ──────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100"><Package className="size-7 opacity-40" /></div>
            <p className="text-sm">{allEntries.length === 0 ? 'ยังไม่มีประวัติ — รับสินค้าจากหน้า «ใบสั่งซื้อ» ก่อน' : 'ไม่พบรายการ'}</p>
          </div>
        ) : viewMode === 'batch' ? (

          /* ── BATCH VIEW ─────────────────────────────────────────────────── */
          <div>
            {groups.map(([dateKey, entries]) => {
              const dayValue = entries.reduce((s, e) => s + e.totalValue, 0)
              const dayQty   = entries.reduce((s, e) => s + e.totalQty, 0)
              return (
                <div key={dateKey}>
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/95 px-4 py-1.5 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-3.5 text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-600">{fmtDateLong(dateKey)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>{entries.length} ครั้ง · {dayQty.toLocaleString('th-TH')} ชิ้น</span>
                      <span className="font-semibold text-slate-600">฿{fmtMoney(dayValue)}</span>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {entries.map((entry) => {
                      const isOpen  = expanded.has(entry.batchId)
                      const prevMap = prevCostMap.get(entry.batchId)
                      const hasShort = entry.lines.some((l) => (l.shortageQty ?? 0) > 0)
                      const colDot  = supplierColor(entry.supplierId || entry.supplierName)
                      let bUp = 0, bDn = 0
                      if (prevMap) for (const l of entry.lines) { const p = prevMap.get(l.lineId); if (p == null || p <= 0) continue; if (l.unitCost - p > 0.005) bUp++; if (l.unitCost - p < -0.005) bDn++ }
                      return (
                        <div key={entry.batchId} className={clsx('transition-colors', isOpen ? 'bg-white' : 'hover:bg-slate-50/60')}>
                          <button type="button" onClick={() => toggle(entry.batchId)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left">
                            <div className="flex shrink-0 items-center gap-1.5">
                              <div className={clsx('h-7 w-1 rounded-full', colDot)} />
                              <span className="text-slate-300">{isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}</span>
                            </div>
                            <div className="flex w-44 shrink-0 items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-slate-800">{entry.poNo}</span>
                              <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-bold text-slate-400">#{entry.batchIndex}</span>
                            </div>
                            <span className="w-36 shrink-0 truncate text-xs text-slate-600">{entry.supplierName}</span>
                            <div className="hidden min-w-0 flex-1 items-center gap-1 lg:flex">
                              {entry.lines.slice(0, 3).map((l) => <span key={l.lineId} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">{l.sku}</span>)}
                              {entry.lines.length > 3 && <span className="text-[10px] text-slate-400">+{entry.lines.length - 3}</span>}
                            </div>
                            <div className="hidden shrink-0 items-center gap-1 sm:flex">
                              {bUp > 0 && <span className="flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-500 ring-1 ring-rose-200"><TrendingUp className="size-2.5" />{bUp}</span>}
                              {bDn > 0 && <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 ring-1 ring-emerald-200"><TrendingDown className="size-2.5" />{bDn}</span>}
                            </div>
                            {entry.refNos && <span className="hidden shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700 ring-1 ring-amber-200 xl:inline-flex"><Receipt className="size-2.5" />{entry.refNos}</span>}
                            <div className="ml-auto flex shrink-0 items-center gap-4">
                              <span className="text-right text-[11px] text-slate-500"><span className="font-semibold text-slate-700">{entry.totalQty}</span> ชิ้น</span>
                              <span className="w-24 text-right text-[12px] font-bold text-emerald-700">฿{fmtMoney(entry.totalValue)}</span>
                            </div>
                          </button>
                          {isOpen && (
                            <div className="border-t border-slate-100 bg-slate-50/40 px-4 pb-4 pt-2">
                              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                <span className="font-semibold text-slate-700">{fmtDate(entry.at)}</span>
                                <span>·</span><span>{entry.supplierName}</span>
                                {entry.refNos && <><span>·</span><span className="inline-flex items-center gap-1 font-semibold text-amber-700"><Receipt className="size-3" />ใบกำกับ {entry.refNos}</span></>}
                                {(entry.shippingCost ?? 0) > 0 && <><span>·</span><span>ค่าขนส่ง ฿{entry.shippingCost!.toLocaleString('th-TH')}</span></>}
                              </div>
                              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                <table className="w-full min-w-[520px] text-xs">
                                  <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                    <tr>
                                      <th className="px-3 py-2 text-left">SKU</th><th className="px-3 py-2 text-left">ชื่อสินค้า</th>
                                      <th className="px-3 py-2 text-right">รับ</th>
                                      {hasShort && <th className="px-3 py-2 text-right text-rose-400">ขาด</th>}
                                      <th className="px-3 py-2 text-right">ต้นทุน/หน่วย</th><th className="px-3 py-2 text-right">เทียบครั้งก่อน</th><th className="px-3 py-2 text-right">รวม</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {entry.lines.map((l) => {
                                      const prev = prevMap?.get(l.lineId) ?? null
                                      const diff = prev != null && prev > 0 ? l.unitCost - prev : null
                                      const pct  = diff != null && prev! > 0 ? (diff / prev!) * 100 : null
                                      return (
                                        <tr key={l.lineId} className="hover:bg-slate-50/70">
                                          <td className="px-3 py-2 font-mono font-medium text-slate-700">{l.sku}</td>
                                          <td className="max-w-[11rem] truncate px-3 py-2 text-slate-600">{l.name}</td>
                                          <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-800">{l.qty}</td>
                                          {hasShort && <td className="px-3 py-2 text-right tabular-nums">{(l.shortageQty ?? 0) > 0 ? <span className="font-bold text-rose-600">{l.shortageQty}</span> : <span className="text-slate-200">—</span>}</td>}
                                          <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-700">฿{fmtMoney(l.unitCost)}</td>
                                          <td className="px-3 py-2 text-right">
                                            {pct === null ? <span className="text-[10px] text-slate-300">ครั้งแรก</span>
                                              : Math.abs(pct) < 0.01 ? <span className="text-[10px] text-slate-400">เท่าเดิม</span>
                                              : <span className={clsx('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold', pct > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700')}>
                                                  {pct > 0 ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
                                                  {Math.abs(pct).toFixed(1)}%
                                                  <span className="font-normal opacity-70">({pct > 0 ? '+' : ''}฿{fmtMoney(diff!)})</span>
                                                </span>}
                                          </td>
                                          <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-800">฿{fmtMoney(l.qty * l.unitCost)}</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                  <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                                    <tr>
                                      <td colSpan={2} className="px-3 py-2 text-[11px] text-slate-500">รวม {entry.lines.length} รายการ</td>
                                      <td className="px-3 py-2 text-right tabular-nums text-slate-800">{entry.totalQty}</td>
                                      {hasShort && <td />}<td /><td />
                                      <td className="px-3 py-2 text-right tabular-nums text-emerald-700">฿{fmtMoney(entry.totalValue)}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

        ) : (

          /* ── PRODUCT VIEW ───────────────────────────────────────────────── */
          <div className="divide-y divide-slate-100">
            {productRows.map((p) => {
              const isOpen    = expanded.has(p.sku)
              const costDiff  = p.lastCost - p.firstCost
              const costPct   = p.firstCost > 0 ? (costDiff / p.firstCost) * 100 : null
              const trending  = costPct != null && Math.abs(costPct) >= 0.01
              return (
                <div key={p.sku} className={clsx('transition-colors', isOpen ? 'bg-white' : 'hover:bg-slate-50/60')}>
                  <button type="button" onClick={() => toggle(p.sku)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <span className="shrink-0 text-slate-300">{isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}</span>

                    {/* SKU + name */}
                    <div className="w-52 shrink-0">
                      <p className="font-mono text-[11px] font-bold text-slate-800">{p.sku}</p>
                      <p className="truncate text-[10px] text-slate-500">{p.name}</p>
                    </div>

                    {/* Receive count + qty */}
                    <div className="hidden w-28 shrink-0 sm:block">
                      <p className="text-[11px] font-semibold text-slate-700">{p.totalQty.toLocaleString('th-TH')} ชิ้น</p>
                      <p className="text-[10px] text-slate-400">{p.receiveCount} ครั้ง</p>
                    </div>

                    {/* Last received date */}
                    <div className="hidden w-24 shrink-0 lg:block">
                      <p className="text-[10px] text-slate-400">รับล่าสุด</p>
                      <p className="text-[11px] font-semibold text-slate-700">{fmtDate(p.lastAt)}</p>
                    </div>

                    {/* Avg cost */}
                    <div className="hidden w-28 shrink-0 xl:block">
                      <p className="text-[10px] text-slate-400">ต้นทุนเฉลี่ย</p>
                      <p className="text-[11px] font-semibold text-slate-700">฿{fmtMoney(p.avgCost)}</p>
                    </div>

                    {/* Last cost + trend */}
                    <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                      {trending && (
                        <span className={clsx('flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold',
                          costPct! > 0 ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200')}>
                          {costPct! > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                          {Math.abs(costPct!).toFixed(1)}%
                        </span>
                      )}
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">ต้นทุนล่าสุด</p>
                        <p className="text-[13px] font-black tabular-nums text-slate-800">฿{fmtMoney(p.lastCost)}</p>
                      </div>
                    </div>

                    <span className="w-24 shrink-0 text-right text-[11px] font-bold text-emerald-700">฿{fmtK(p.totalValue)}</span>
                  </button>

                  {/* Expanded: full receive timeline for this product */}
                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/40 px-4 pb-4 pt-2">
                      <p className="mb-2 text-[11px] font-semibold text-slate-500">ประวัติการรับ — {p.receiveCount} ครั้ง</p>
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full min-w-[480px] text-xs">
                          <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            <tr>
                              <th className="px-3 py-2 text-left">วันที่</th>
                              <th className="px-3 py-2 text-left">PO</th>
                              <th className="px-3 py-2 text-left">ซัพพลายเออร์</th>
                              <th className="px-3 py-2 text-right">จำนวน</th>
                              <th className="px-3 py-2 text-right">ต้นทุน/หน่วย</th>
                              <th className="px-3 py-2 text-right">เทียบครั้งก่อน</th>
                              <th className="px-3 py-2 text-right">รวม</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {p.events.map((ev, ei) => {
                              const prevEv = p.events[ei + 1]
                              const diff   = prevEv ? ev.unitCost - prevEv.unitCost : null
                              const pct    = diff != null && prevEv!.unitCost > 0 ? (diff / prevEv!.unitCost) * 100 : null
                              const isLast = ei === p.events.length - 1
                              return (
                                <tr key={`${ev.batchId}-${ei}`} className={clsx('hover:bg-slate-50/70', ei === 0 && 'bg-emerald-50/30')}>
                                  <td className="px-3 py-2 text-slate-600">
                                    <span className="flex items-center gap-1">
                                      {ei === 0 && <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">ล่าสุด</span>}
                                      {fmtDate(ev.at)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 font-mono text-[10px] text-slate-600">{ev.poNo}</td>
                                  <td className="max-w-[8rem] truncate px-3 py-2 text-slate-600">{ev.supplierName}</td>
                                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-800">{ev.qty}</td>
                                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-700">฿{fmtMoney(ev.unitCost)}</td>
                                  <td className="px-3 py-2 text-right">
                                    {isLast ? <span className="text-[10px] text-slate-300">ครั้งแรก</span>
                                      : pct === null || Math.abs(pct) < 0.01 ? <span className="text-[10px] text-slate-400">เท่าเดิม</span>
                                      : <span className={clsx('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold', pct > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700')}>
                                          {pct > 0 ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
                                          {Math.abs(pct).toFixed(1)}%
                                        </span>}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-800">฿{fmtMoney(ev.qty * ev.unitCost)}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                            <tr>
                              <td colSpan={3} className="px-3 py-2 text-[11px] text-slate-500">รวมทั้งหมด</td>
                              <td className="px-3 py-2 text-right tabular-nums text-slate-800">{p.totalQty}</td>
                              <td className="px-3 py-2 text-right text-[11px] text-slate-500">เฉลี่ย ฿{fmtMoney(p.avgCost)}</td>
                              <td />
                              <td className="px-3 py-2 text-right tabular-nums text-emerald-700">฿{fmtMoney(p.totalValue)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
