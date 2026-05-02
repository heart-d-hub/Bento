import { type LowStockHighlight, type InventoryActivity } from '@/features/inventory/data/mockInventory'
import {
  getProductMasterBySku,
  PRODUCT_MASTER_LIST_CHANGED_EVENT,
} from '@/features/inventory/data/productMasterData'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { LIVE_STOCK_CHANGED_EVENT } from '@/features/pos/data/posLiveStock'
import { loadRecentSales, POS_SALE_RECORDED_EVENT } from '@/features/pos/data/posSalesHistory'
import { clsx } from 'clsx'
import { Package, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

/**
 * Sparkline จาก data points จริง (เช่น ยอดขาย 7 วันย้อนหลัง)
 * — ถ้าไม่มี data points → fallback flat line
 */
function MiniSpark({ values, tone = 'slate' }: { values: number[]; tone?: 'slate' | 'emerald' | 'rose' }) {
  if (values.length < 2) {
    return (
      <svg viewBox="0 0 48 20" className="h-5 w-16 text-slate-300" aria-hidden>
        <path d="M0 14 L48 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 48
  const h = 20
  const stepX = w / (values.length - 1)
  const points = values
    .map((v, i) => {
      const x = i * stepX
      const y = h - ((v - min) / range) * (h - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' L ')
  const colorClass =
    tone === 'emerald' ? 'text-emerald-500' : tone === 'rose' ? 'text-rose-500' : 'text-slate-400'
  return (
    <svg viewBox="0 0 48 20" className={clsx('h-5 w-16', colorClass)} aria-hidden>
      <path d={`M ${points}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** มูลค่าสต็อกรวม = Σ (stock × cost ต่อหน่วย จาก master) */
function computeTotalStockValue(): number {
  const products = getPosCatalogProducts()
  let total = 0
  for (const p of products) {
    const master = getProductMasterBySku(p.sku)
    const cost = master?.lastCost ?? master?.avgCost ?? master?.costPrice ?? 0
    if (cost <= 0 || p.stock <= 0) continue
    total += cost * p.stock
  }
  return Math.round(total)
}

/** ของที่ stock ≤ minStock เรียงตามความ urgency (stock/min ratio น้อยสุดก่อน) */
function computeLowStockHighlights(max = 5): LowStockHighlight[] {
  const products = getPosCatalogProducts()
  const flagged: Array<LowStockHighlight & { ratio: number }> = []
  for (const p of products) {
    const min = p.minStock ?? 0
    if (min <= 0) continue
    if (p.stock > min) continue
    flagged.push({
      id: p.id,
      sku: p.sku,
      name: p.name,
      current: p.stock,
      min,
      ratio: min > 0 ? p.stock / min : 0,
    })
  }
  return flagged
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, max)
    .map((r) => ({ id: r.id, sku: r.sku, name: r.name, current: r.current, min: r.min }))
}

function relativeTimeLabel(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 1) return 'เมื่อสักครู่'
    if (diffMin < 60) return `${diffMin} นาทีก่อน`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24 && d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    }
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return `เมื่อวาน`
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  } catch {
    return iso
  }
}

/** Activity feed จากบิลขายล่าสุด */
function computeActivities(max = 6): InventoryActivity[] {
  const sales = loadRecentSales().slice(0, max)
  return sales.map((s) => {
    const lineCount = s.lines?.length ?? s.lineCount ?? 0
    const firstLine = s.lines?.[0]
    const more = lineCount > 1 ? ` +${lineCount - 1} รายการ` : ''
    const summary = firstLine ? `${firstLine.name} ×${firstLine.qty}${more}` : `${lineCount} รายการ`
    return {
      id: s.id,
      text: `${s.voidedAt ? '🚫 ยกเลิก' : 'ขาย'} (${s.billNo}) — ${summary}`,
      time: relativeTimeLabel(s.at),
    }
  })
}

/** ยอดขาย 7 วันย้อนหลัง (รายวัน) สำหรับ sparkline */
function computeDailySalesSeries(days = 7): number[] {
  const sales = loadRecentSales()
  const now = new Date()
  const series: number[] = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now)
    day.setDate(now.getDate() - i)
    const ymd = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
    let total = 0
    for (const s of sales) {
      if (s.voidedAt) continue
      const d = new Date(s.at)
      const dymd = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (dymd === ymd) total += s.total
    }
    series.push(total)
  }
  return series
}

export function InventorySummaryCards() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const handler = () => setTick((n) => n + 1)
    window.addEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, handler)
    window.addEventListener(LIVE_STOCK_CHANGED_EVENT, handler)
    window.addEventListener(POS_SALE_RECORDED_EVENT, handler)
    return () => {
      window.removeEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, handler)
      window.removeEventListener(LIVE_STOCK_CHANGED_EVENT, handler)
      window.removeEventListener(POS_SALE_RECORDED_EVENT, handler)
    }
  }, [])

  const totalSkus = useMemo(() => getPosCatalogProducts().length, [tick])
  const totalValueBaht = useMemo(() => computeTotalStockValue(), [tick])
  const lowStockItems = useMemo(() => computeLowStockHighlights(5), [tick])
  const activities = useMemo(() => computeActivities(6), [tick])
  const dailySales = useMemo(() => computeDailySalesSeries(7), [tick])

  /** เปรียบเทียบยอดวันนี้ vs ค่าเฉลี่ย 6 วันก่อน → trend up/down */
  const salesTrend = useMemo(() => {
    if (dailySales.length < 2) return 'flat' as const
    const today = dailySales[dailySales.length - 1]
    const prevAvg = dailySales.slice(0, -1).reduce((s, v) => s + v, 0) / (dailySales.length - 1)
    if (prevAvg <= 0) return today > 0 ? 'up' as const : 'flat' as const
    const diff = (today - prevAvg) / prevAvg
    if (diff > 0.05) return 'up' as const
    if (diff < -0.05) return 'down' as const
    return 'flat' as const
  }, [dailySales])

  const trendIcon = salesTrend === 'up' ? <TrendingUp className="size-3 text-emerald-500" />
    : salesTrend === 'down' ? <TrendingDown className="size-3 text-rose-500" />
    : null

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {/* Card 1 — Stock overview (sky/blue) */}
      <section className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/40 via-white to-blue-50/30 shadow-sm transition hover:shadow-md">
        <div className="h-1 w-full bg-gradient-to-r from-sky-400 to-blue-500" aria-hidden />
        <div className="p-4">
          <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-sky-700">
            <span aria-hidden>📊</span>
            ภาพรวมสต็อก
          </h3>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <p className="bg-gradient-to-r from-sky-700 to-blue-700 bg-clip-text text-3xl font-black tabular-nums text-transparent">
                {totalSkus.toLocaleString('th-TH')}
              </p>
              <p className="text-xs font-semibold text-slate-500">รายการ SKU</p>
            </div>
            <MiniSpark values={dailySales} tone={salesTrend === 'down' ? 'rose' : salesTrend === 'up' ? 'emerald' : 'slate'} />
          </div>
          <div className="mt-4 flex items-end justify-between gap-2 border-t border-sky-100 pt-3">
            <div>
              <p className="font-mono text-xl font-black tabular-nums text-slate-900">
                ฿{totalValueBaht.toLocaleString('th-TH')}
              </p>
              <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                มูลค่าสต็อก (ต้นทุน)
                {trendIcon}
              </p>
            </div>
            <MiniSpark values={dailySales} tone={salesTrend === 'down' ? 'rose' : 'emerald'} />
          </div>
        </div>
      </section>

      {/* Card 2 — Low stock (amber/rose) */}
      <section className="overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/40 via-white to-rose-50/20 shadow-sm transition hover:shadow-md">
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-rose-500" aria-hidden />
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-amber-700">
              <span aria-hidden>⚠️</span>
              สินค้าสต็อกต่ำ
            </h3>
            {lowStockItems.length > 0 && (
              <span className="animate-pulse rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
                {lowStockItems.length}
              </span>
            )}
          </div>
          {lowStockItems.length === 0 ? (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-center text-xs font-bold text-emerald-700">
              ✅ ไม่มีสินค้าสต็อกต่ำ
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {lowStockItems.map((item) => {
                const critical = item.current <= 0
                const veryLow = item.current < item.min / 2
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white/80 p-2 shadow-sm transition hover:-translate-y-px hover:bg-white hover:shadow-md"
                  >
                    <div className={clsx(
                      'flex size-10 shrink-0 items-center justify-center rounded-lg shadow-inner',
                      critical
                        ? 'bg-gradient-to-br from-rose-200 to-rose-300 text-rose-700'
                        : veryLow
                          ? 'bg-gradient-to-br from-rose-100 to-amber-200 text-rose-600'
                          : 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700',
                    )}>
                      <Package className="size-5" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[10px] font-bold text-slate-500">{item.sku}</p>
                      <p className="truncate text-sm font-bold text-slate-800">{item.name}</p>
                      <p className={clsx(
                        'flex items-center gap-1 text-xs font-black',
                        critical ? 'text-rose-700' : veryLow ? 'text-rose-600' : 'text-amber-600',
                      )}>
                        <span className={clsx(
                          'size-1.5 rounded-full',
                          critical ? 'bg-rose-600' : veryLow ? 'bg-rose-500' : 'bg-amber-500',
                        )} aria-hidden />
                        Stock: <span className="font-mono">{item.current}/{item.min}</span>
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Card 3 — Recent activity (emerald) */}
      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 via-white to-cyan-50/20 shadow-sm transition hover:shadow-md">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-cyan-500" aria-hidden />
        <div className="p-4">
          <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-700">
            <span aria-hidden>⚡</span>
            การเคลื่อนไหวล่าสุด
          </h3>
          {activities.length === 0 ? (
            <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center text-xs font-semibold text-slate-400">
              ยังไม่มีรายการขาย
            </p>
          ) : (
            <ul className="relative mt-3 space-y-0 border-l-2 border-emerald-200 pl-4">
              {activities.map((a) => (
                <li key={a.id} className="relative pb-3 last:pb-0">
                  <span
                    className="absolute -left-[22px] top-1.5 size-3 rounded-full border-2 border-white bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-sm"
                    aria-hidden
                  />
                  <p className="text-sm font-semibold leading-snug text-slate-700">{a.text}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{a.time}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
