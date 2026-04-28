import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import {
  isBoxPieceProduct,
  loadBoxPieceStock,
  loadLiveStock,
  loadRollStock,
  posProductUsesRollShelfStock,
  totalKgFromRoll,
  totalPiecesFromBoxPiece,
} from '@/features/pos/data/posLiveStock'
import { useReportFilters } from '@/features/report/context/ReportFilterContext'
import {
  loadReportAbcAnalysisAsync,
  loadReportDeadStockAsync,
  loadReportSlowMoversAsync,
  loadReportStockLedgerAsync,
  type ReportAbcRow,
  type ReportDeadStockRow,
  type ReportSlowMoverRow,
  type ReportStockLedgerRow,
} from '@/features/report/data/reportDb'
import { clsx } from 'clsx'
import { AlertTriangle, Database, RefreshCw, TrendingDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type LowStockItem = {
  productId: string
  sku: string
  name: string
  category: string
  current: number
  minStock: number
  unit: string
}

function buildLowStockItems(): LowStockItem[] {
  const products = getPosCatalogProducts()
  const pieceMap = loadLiveStock()
  const rollMap = loadRollStock()
  const boxMap = loadBoxPieceStock()
  const items: LowStockItem[] = []

  for (const p of products) {
    if (!p.isActive) continue
    const min = p.minStock ?? 0
    if (min <= 0) continue

    let current = 0
    let unit = 'ชิ้น'

    if (isBoxPieceProduct(p) && p.piecesPerBox) {
      const b = boxMap[p.id]
      current = b ? totalPiecesFromBoxPiece(b, p.piecesPerBox) : 0
      unit = 'ชิ้น'
    } else if (posProductUsesRollShelfStock(p)) {
      const r = rollMap[p.id]
      const nominal = (p.kgPerRoll ?? p.meterPerRoll ?? 1)
      current = r ? totalKgFromRoll(r, nominal) : 0
      unit = p.stockMode === 'meter_roll' ? 'ม.' : 'กก.'
    } else {
      current = pieceMap[p.id] ?? 0
      unit = 'ชิ้น'
    }

    if (current < min) {
      items.push({ productId: p.id, sku: p.sku, name: p.name, category: p.category, current, minStock: min, unit })
    }
  }

  return items.sort((a, b) => a.current / a.minStock - b.current / b.minStock)
}

function fmtDate(iso: string | null) {
  if (!iso) return 'ไม่เคยขาย'
  try {
    return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
  } catch {
    return iso
  }
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  return Math.floor(diff / 86_400_000)
}

type Tab = 'stock' | 'abc' | 'dead'

const ABC_COLORS = { A: '#10b981', B: '#6366f1', C: '#94a3b8' }

function fmtMoney(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function ReportStockPanel() {
  const { filters } = useReportFilters()
  const [stockTab, setStockTab] = useState<Tab>('stock')
  const [slowDays, setSlowDays] = useState(30)
  const [slowMovers, setSlowMovers] = useState<ReportSlowMoverRow[]>([])
  const [slowLoading, setSlowLoading] = useState(false)
  const [slowError, setSlowError] = useState<string | null>(null)

  const [dbStock, setDbStock] = useState<ReportStockLedgerRow[]>([])
  const [dbLoading, setDbLoading] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [dbFilter, setDbFilter] = useState<'all' | 'low' | 'zero'>('low')

  const [abc, setAbc] = useState<ReportAbcRow[]>([])
  const [abcLoading, setAbcLoading] = useState(false)
  const [abcError, setAbcError] = useState<string | null>(null)

  const [deadStock, setDeadStock] = useState<ReportDeadStockRow[]>([])
  const [deadLoading, setDeadLoading] = useState(false)
  const [deadError, setDeadError] = useState<string | null>(null)
  const [deadDays, setDeadDays] = useState(90)

  const lowStock = useMemo(() => buildLowStockItems(), [])

  const dbStats = useMemo(() => {
    const critical = dbStock.filter((r) => r.stockQty <= 0).length
    const low = dbStock.filter((r) => r.minStock > 0 && r.stockQty > 0 && r.stockQty < r.minStock).length
    const ok = dbStock.filter((r) => r.minStock <= 0 || r.stockQty >= r.minStock).length
    return { critical, low, ok }
  }, [dbStock])

  const loadSlowMovers = async (days: number) => {
    setSlowLoading(true)
    setSlowError(null)
    try {
      const data = await loadReportSlowMoversAsync(days, 50)
      setSlowMovers(data)
    } catch (e) {
      setSlowError(e instanceof Error ? e.message : String(e))
    } finally {
      setSlowLoading(false)
    }
  }

  const loadDbStock = async () => {
    setDbLoading(true)
    setDbError(null)
    try {
      setDbStock(await loadReportStockLedgerAsync())
    } catch (e) {
      setDbError(e instanceof Error ? e.message : String(e))
    } finally {
      setDbLoading(false)
    }
  }

  const loadAbc = async () => {
    setAbcLoading(true)
    setAbcError(null)
    try {
      setAbc(await loadReportAbcAnalysisAsync(filters.dateFrom, filters.dateTo))
    } catch (e) {
      setAbcError(e instanceof Error ? e.message : String(e))
    } finally {
      setAbcLoading(false)
    }
  }

  const loadDeadStock = async (days: number) => {
    setDeadLoading(true)
    setDeadError(null)
    try {
      setDeadStock(await loadReportDeadStockAsync(days))
    } catch (e) {
      setDeadError(e instanceof Error ? e.message : String(e))
    } finally {
      setDeadLoading(false)
    }
  }

  useEffect(() => {
    void loadSlowMovers(slowDays)
    void loadDbStock()
  }, [])

  useEffect(() => {
    if (stockTab === 'abc') void loadAbc()
    if (stockTab === 'dead') void loadDeadStock(deadDays)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockTab])

  const abcSummary = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0 }
    const revenue = { A: 0, B: 0, C: 0 }
    abc.forEach((r) => {
      counts[r.abcClass]++
      revenue[r.abcClass] += r.revenue
    })
    return { counts, revenue }
  }, [abc])

  const totalTiedUp = useMemo(
    () => deadStock.reduce((s, r) => s + r.tiedUpValue, 0),
    [deadStock],
  )

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex flex-wrap gap-1.5">
        {([
          { id: 'stock' as Tab, label: 'สต็อก' },
          { id: 'abc' as Tab, label: 'ABC Analysis' },
          { id: 'dead' as Tab, label: 'Dead Stock' },
        ] as const).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setStockTab(t.id)}
            className={clsx(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
              stockTab === t.id
                ? 'border-indigo-400 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ABC Analysis tab ── */}
      {stockTab === 'abc' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">ABC Analysis ตามรายได้</h2>
            <button type="button" onClick={() => void loadAbc()} disabled={abcLoading}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw className={clsx('size-3', abcLoading && 'animate-spin')} />รีเฟรช
            </button>
          </div>

          {abcLoading && <p className="py-6 text-center text-sm text-slate-400">กำลังโหลด…</p>}
          {abcError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{abcError}</div>}

          {!abcLoading && abc.length > 0 && (
            <>
              {/* ABC KPI */}
              <div className="grid grid-cols-3 gap-3">
                {(['A', 'B', 'C'] as const).map((cls) => (
                  <div key={cls}
                    className="rounded-2xl border px-4 py-3.5 shadow-sm"
                    style={{ borderColor: ABC_COLORS[cls] + '40', backgroundColor: ABC_COLORS[cls] + '0d' }}>
                    <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: ABC_COLORS[cls] }}>
                      Class {cls}
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{abcSummary.counts[cls]}</p>
                    <p className="text-[11px] text-slate-500">
                      รายการ · ฿{abcSummary.revenue[cls] >= 1_000_000
                        ? `${(abcSummary.revenue[cls] / 1_000_000).toFixed(1)}M`
                        : (abcSummary.revenue[cls] / 1_000).toFixed(0) + 'k'
                      }
                    </p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="max-h-[28rem] overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 border-b border-slate-100 bg-slate-50">
                      <tr className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        <th className="w-12 px-3 py-2 text-center">Class</th>
                        <th className="px-3 py-2 text-left">สินค้า</th>
                        <th className="px-3 py-2 text-right">รายได้</th>
                        <th className="px-3 py-2 text-right">% ของยอด</th>
                        <th className="px-3 py-2 text-right">% สะสม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {abc.map((r) => (
                        <tr key={r.productId} className="hover:bg-slate-50/80">
                          <td className="px-3 py-2 text-center">
                            <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
                              style={{ backgroundColor: ABC_COLORS[r.abcClass] }}>
                              {r.abcClass}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-medium text-slate-900">{r.name}</p>
                            <p className="text-[10px] text-slate-400">{r.sku} · {r.category}</p>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-900">
                            {fmtMoney(r.revenue)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                            {r.revenuePct.toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-400">
                            {r.cumPct.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!abcLoading && abc.length === 0 && !abcError && (
            <p className="py-8 text-center text-sm text-slate-400">ยังไม่มีข้อมูลการขาย — ต้องมียอดขายในช่วงที่เลือกก่อน</p>
          )}
        </div>
      )}

      {/* ── Dead Stock tab ── */}
      {stockTab === 'dead' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-700">Dead Stock — สินค้าหยุดนิ่ง</h2>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-slate-500">ไม่มีเคลื่อนไหวใน</span>
              <select value={deadDays} onChange={(e) => setDeadDays(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800">
                <option value={30}>30 วัน</option>
                <option value={60}>60 วัน</option>
                <option value={90}>90 วัน</option>
                <option value={180}>180 วัน</option>
              </select>
              <button type="button" onClick={() => void loadDeadStock(deadDays)} disabled={deadLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                <RefreshCw className={clsx('size-3', deadLoading && 'animate-spin')} />โหลด
              </button>
            </div>
          </div>

          {deadLoading && <p className="py-6 text-center text-sm text-slate-400">กำลังโหลด…</p>}
          {deadError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{deadError}</div>}

          {!deadLoading && deadStock.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white px-4 py-3.5 shadow-sm">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-rose-500">รายการหยุดนิ่ง</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-rose-900">{deadStock.length}</p>
                  <p className="text-[11px] text-rose-400">รายการ</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white px-4 py-3.5 shadow-sm">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-amber-500">มูลค่าทุนค้างอยู่</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-amber-900">
                    ฿{totalTiedUp >= 1_000_000
                      ? `${(totalTiedUp / 1_000_000).toFixed(2)}M`
                      : fmtMoney(totalTiedUp)}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="max-h-[28rem] overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 border-b border-slate-100 bg-slate-50">
                      <tr className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-2 text-left">สินค้า</th>
                        <th className="px-3 py-2 text-right">คงเหลือ</th>
                        <th className="px-3 py-2 text-right">ต้นทุน/ชิ้น</th>
                        <th className="px-3 py-2 text-right">มูลค่าค้าง</th>
                        <th className="px-3 py-2 text-right">วันไม่มีขาย</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {deadStock.map((r) => (
                        <tr key={r.productId} className="hover:bg-slate-50/80">
                          <td className="px-3 py-2">
                            <p className="font-medium text-slate-900">{r.name}</p>
                            <p className="text-[10px] text-slate-400">{r.sku} · {r.category}</p>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                            {r.stockQty.toLocaleString('th-TH', { maximumFractionDigits: 1 })}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                            {fmtMoney(r.costPrice)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold text-rose-700">
                            {fmtMoney(r.tiedUpValue)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {r.daysIdle === null ? (
                              <span className="font-semibold text-rose-600">ไม่เคยขาย</span>
                            ) : (
                              <span className={clsx('font-medium', r.daysIdle > 180 ? 'text-rose-600' : r.daysIdle > 90 ? 'text-amber-600' : 'text-slate-600')}>
                                {r.daysIdle} วัน
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!deadLoading && deadStock.length === 0 && !deadError && (
            <p className="py-8 text-center text-sm text-slate-400">ไม่พบสินค้าที่หยุดนิ่งในเกณฑ์นี้</p>
          )}
        </div>
      )}

      {/* ── Stock tab ── */}
      {stockTab === 'stock' && (<>
      {/* Low stock */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-slate-800">
            สินค้าต่ำกว่าขั้นต่ำ
            {lowStock.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                {lowStock.length}
              </span>
            )}
          </h2>
        </div>

        {lowStock.length === 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-6 text-center text-sm text-emerald-700">
            สต็อกทุกรายการอยู่เหนือขั้นต่ำ
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-amber-100 bg-amber-50 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                  <th className="px-3 py-2 text-left">สินค้า</th>
                  <th className="px-3 py-2 text-right">คงเหลือ</th>
                  <th className="px-3 py-2 text-right">ขั้นต่ำ</th>
                  <th className="px-3 py-2 text-right">ขาด</th>
                  <th className="w-24 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {lowStock.map((item) => {
                  const pct = Math.min(1, item.current / item.minStock)
                  const isCritical = pct <= 0
                  return (
                    <tr
                      key={item.productId}
                      className={clsx('hover:bg-amber-50/30', isCritical && 'bg-rose-50/40')}
                    >
                      <td className="px-3 py-1.5">
                        <p className={clsx('font-medium', isCritical ? 'text-rose-800' : 'text-slate-900')}>
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400">{item.sku} · {item.category}</p>
                      </td>
                      <td className={clsx('px-3 py-1.5 text-right tabular-nums font-semibold', isCritical ? 'text-rose-700' : 'text-amber-700')}>
                        {item.current.toLocaleString('th-TH', { maximumFractionDigits: 1 })} {item.unit}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">
                        {item.minStock.toLocaleString('th-TH', { maximumFractionDigits: 1 })}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-medium text-rose-700">
                        {(item.minStock - item.current).toLocaleString('th-TH', { maximumFractionDigits: 1 })}
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={clsx('h-full rounded-full', isCritical ? 'bg-rose-500' : 'bg-amber-400')}
                            style={{ width: `${pct * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* DB Stock levels */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Database className="size-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-slate-800">สต็อกจากฐานข้อมูล</h2>
          <div className="ml-auto flex items-center gap-1.5">
            {(['low', 'zero', 'all'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setDbFilter(f)}
                className={clsx(
                  'rounded-md border px-2 py-1 text-[10px] font-medium',
                  dbFilter === f ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                {f === 'low' ? 'ต่ำกว่าขั้นต่ำ' : f === 'zero' ? 'หมด/ติดลบ' : 'ทั้งหมด'}
              </button>
            ))}
            <button type="button" onClick={() => void loadDbStock()} disabled={dbLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw className={clsx('size-3', dbLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* KPI cards */}
        {dbStock.length > 0 && !dbLoading && (
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white px-3 py-2.5 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide text-rose-600">หมด / ติดลบ</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-rose-900">{dbStats.critical}</p>
              <p className="text-[10px] text-rose-500">รายการ</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white px-3 py-2.5 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600">ต่ำกว่าขั้นต่ำ</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-amber-900">{dbStats.low}</p>
              <p className="text-[10px] text-amber-500">รายการ</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white px-3 py-2.5 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600">ปกติ</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-900">{dbStats.ok}</p>
              <p className="text-[10px] text-emerald-500">รายการ</p>
            </div>
          </div>
        )}

        {dbLoading && <p className="py-4 text-center text-sm text-slate-400">กำลังโหลด…</p>}
        {dbError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{dbError}</div>}

        {!dbLoading && dbStock.length === 0 && !dbError && (
          <p className="rounded-xl border border-dashed border-slate-200 py-5 text-center text-xs text-slate-400">
            ยังไม่มีข้อมูลการเคลื่อนไหวสต็อก — เริ่มต้นเมื่อมีการขายสินค้า
          </p>
        )}

        {dbStock.length > 0 && (() => {
          const filtered = dbStock.filter((r) => {
            if (dbFilter === 'zero') return r.stockQty <= 0
            if (dbFilter === 'low') return r.minStock > 0 && r.stockQty < r.minStock
            return true
          })
          return (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="max-h-72 overflow-auto">
                {filtered.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">ไม่มีรายการในตัวกรองนี้</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 border-b border-slate-200 bg-slate-50">
                      <tr className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-2 text-left">สินค้า</th>
                        <th className="px-3 py-2 text-left">หมวด</th>
                        <th className="px-3 py-2 text-right">คงเหลือ</th>
                        <th className="px-3 py-2 text-right">ขั้นต่ำ</th>
                        <th className="w-20 px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((r) => {
                        const pct = r.minStock > 0 ? Math.min(1, Math.max(0, r.stockQty / r.minStock)) : 1
                        const critical = r.stockQty <= 0
                        return (
                          <tr key={r.productId} className={clsx('hover:bg-slate-50', critical && 'bg-rose-50/30')}>
                            <td className="px-3 py-1.5">
                              <p className={clsx('font-medium', critical ? 'text-rose-800' : 'text-slate-900')}>{r.name}</p>
                              <p className="font-mono text-[10px] text-slate-400">{r.sku}</p>
                            </td>
                            <td className="px-3 py-1.5 text-slate-500">{r.category}</td>
                            <td className={clsx('px-3 py-1.5 text-right tabular-nums font-semibold', critical ? 'text-rose-700' : r.minStock > 0 && r.stockQty < r.minStock ? 'text-amber-700' : 'text-emerald-700')}>
                              {r.stockQty.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-slate-400">
                              {r.minStock > 0 ? r.minStock.toLocaleString('th-TH', { maximumFractionDigits: 1 }) : '—'}
                            </td>
                            <td className="px-3 py-1.5">
                              {r.minStock > 0 && (
                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                  <div className={clsx('h-full rounded-full', critical ? 'bg-rose-500' : pct < 0.5 ? 'bg-amber-400' : 'bg-emerald-500')}
                                    style={{ width: `${pct * 100}%` }} />
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )
        })()}
      </section>

      {/* Slow movers */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <TrendingDown className="size-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">สินค้าเคลื่อนที่ช้า</h2>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-slate-500">ไม่มีขายใน</span>
            <select
              value={slowDays}
              onChange={(e) => setSlowDays(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
            >
              <option value={7}>7 วัน</option>
              <option value={14}>14 วัน</option>
              <option value={30}>30 วัน</option>
              <option value={60}>60 วัน</option>
              <option value={90}>90 วัน</option>
            </select>
            <button
              type="button"
              onClick={() => void loadSlowMovers(slowDays)}
              disabled={slowLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={clsx('size-3', slowLoading && 'animate-spin')} />
              โหลด
            </button>
          </div>
        </div>

        {slowLoading && <p className="py-6 text-center text-sm text-slate-400">กำลังโหลด…</p>}

        {slowError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{slowError}</div>
        )}

        {!slowLoading && slowMovers.length === 0 && !slowError && (
          <p className="py-6 text-center text-sm text-slate-400">ไม่มีสินค้าเคลื่อนที่ช้าในช่วงนี้</p>
        )}

        {slowMovers.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 border-b border-slate-200 bg-slate-50">
                  <tr className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 text-left">สินค้า</th>
                    <th className="px-3 py-2 text-left">หมวด</th>
                    <th className="px-3 py-2 text-right">ขายล่าสุด</th>
                    <th className="px-3 py-2 text-right">วันที่ผ่านมา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slowMovers.map((r) => {
                    const days = daysSince(r.lastSoldAt)
                    return (
                      <tr key={r.productId} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5">
                          <p className="font-medium text-slate-900">{r.name}</p>
                          <p className="font-mono text-[10px] text-slate-400">{r.sku}</p>
                        </td>
                        <td className="px-3 py-1.5 text-slate-500">{r.category}</td>
                        <td className="px-3 py-1.5 text-right text-slate-600">{fmtDate(r.lastSoldAt)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {days === null ? (
                            <span className="font-semibold text-rose-600">ไม่เคยขาย</span>
                          ) : (
                            <span className={clsx('font-medium', days > 60 ? 'text-rose-600' : days > 30 ? 'text-amber-600' : 'text-slate-600')}>
                              {days} วัน
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
      </>)}
    </div>
  )
}
