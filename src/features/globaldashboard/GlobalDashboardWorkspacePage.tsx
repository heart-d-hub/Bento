import { BRANCHES } from '@/features/auth/branches'
import { loadPurchaseOrders } from '@/features/purchase/data/poStore'
import {
  loadReportExpensesAsync,
  type ReportExpensesResult,
} from '@/features/report/data/expensesDb'
import {
  loadReportPnlAsync,
  loadReportSalesSummaryAsync,
  loadReportStockLedgerAsync,
  loadReportTopProductsAsync,
  type PnlMonthRow,
  type ReportPnlResult,
  type ReportSalesSummary,
  type ReportStockLedgerRow,
  type ReportTopProductRow,
} from '@/features/report/data/reportDb'
import { clsx } from 'clsx'
import { Globe, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type GlobalDashboardWorkspacePageProps = {
  className?: string
}

type Preset = 'today' | 'week' | 'month' | 'quarter'
type BranchFilter = 'all' | string

// ── helpers ──────────────────────────────────────────────────────────────────

function getPresetDates(preset: Preset): { from: string; to: string } {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const t = fmt(today)
  if (preset === 'today') return { from: t, to: t }
  if (preset === 'week') {
    const mon = new Date(today)
    const dow = today.getDay()
    mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
    return { from: fmt(mon), to: t }
  }
  if (preset === 'month') {
    return { from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), to: t }
  }
  const q = new Date(today)
  q.setMonth(today.getMonth() - 2, 1)
  return { from: fmt(q), to: t }
}

function thb(n: number | undefined | null, digits = 0): string {
  if (n == null) return '—'
  return n.toLocaleString('th-TH', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function poAmount(po: ReturnType<typeof loadPurchaseOrders>[number]): number {
  let received = 0
  for (const b of po.receiveBatches) for (const l of b.lines) received += l.qty * l.unitCost
  if (received > 0) return received
  return po.lines.reduce((s, l) => s + l.orderedQty * l.unitCostOrder, 0)
}

function shortMonth(iso: string): string {
  return new Date(`${iso}-01T12:00:00`).toLocaleDateString('th-TH', { month: 'short' })
}

function branchLabel(filter: BranchFilter): string {
  if (filter === 'all') return 'ทุกสาขา'
  return BRANCHES.find((b) => b.id === filter)?.name ?? filter
}

// ── sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent,
  loading,
}: {
  label: string
  value: string
  sub?: string
  accent?: 'green' | 'red' | 'amber' | 'sky' | 'slate'
  loading?: boolean
}) {
  const color = {
    green: 'text-emerald-600',
    red: 'text-rose-600',
    amber: 'text-amber-600',
    sky: 'text-sky-600',
    slate: 'text-slate-700',
  }[accent ?? 'slate']
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      {loading ? (
        <div className="mt-1.5 h-7 animate-pulse rounded bg-slate-100" />
      ) : (
        <p className={clsx('mt-1 text-2xl font-black tabular-nums', color)}>{value}</p>
      )}
      {sub && <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>}
    </div>
  )
}

function MiniBarChart({ rows, height = 80 }: { rows: PnlMonthRow[]; height?: number }) {
  const last6 = rows.slice(-6)
  if (!last6.length) return <p className="text-xs text-slate-400">ไม่มีข้อมูล</p>
  const maxAbs = Math.max(...last6.map((r) => Math.max(Math.abs(r.revenue), Math.abs(r.net))), 1)
  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {last6.map((r) => {
          const revH = (r.revenue / maxAbs) * height * 0.9
          const netH = (Math.abs(r.net) / maxAbs) * height * 0.9
          return (
            <div key={r.month} className="flex flex-1 flex-col items-center justify-end gap-0.5">
              <div className="flex w-full items-end justify-center gap-0.5">
                <div
                  className="flex-1 rounded-t bg-sky-300"
                  style={{ height: revH }}
                  title={`ยอดขาย ${thb(r.revenue)}`}
                />
                <div
                  className={clsx('flex-1 rounded-t', r.net >= 0 ? 'bg-emerald-400' : 'bg-rose-400')}
                  style={{ height: netH }}
                  title={`กำไรสุทธิ ${thb(r.net)}`}
                />
              </div>
              <span className="text-[8px] text-slate-400">{shortMonth(r.month)}</span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-3 text-[9px] text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block size-2 rounded bg-sky-300" />ยอดขาย</span>
        <span className="flex items-center gap-1"><span className="inline-block size-2 rounded bg-emerald-400" />กำไรสุทธิ</span>
      </div>
    </div>
  )
}

function BranchBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-mono tabular-nums text-slate-600">฿{thb(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-right text-[10px] text-slate-400">{pct.toFixed(1)}% ของยอดรวม</p>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export function GlobalDashboardWorkspacePage({ className }: GlobalDashboardWorkspacePageProps) {
  const [preset, setPreset] = useState<Preset>('month')
  const { from: initFrom, to: initTo } = getPresetDates('month')
  const [dateFrom, setDateFrom] = useState(initFrom)
  const [dateTo, setDateTo] = useState(initTo)
  const [selectedBranch, setSelectedBranch] = useState<BranchFilter>('all')
  const [loading, setLoading] = useState(false)
  const [tick, setTick] = useState(0)

  // async data
  const [combined, setCombined] = useState<ReportSalesSummary | null>(null)
  const [branchSales, setBranchSales] = useState<Record<string, ReportSalesSummary | null>>({})
  const [pnl, setPnl] = useState<ReportPnlResult | null>(null)
  const [expenses, setExpenses] = useState<ReportExpensesResult | null>(null)
  const [stockLedger, setStockLedger] = useState<ReportStockLedgerRow[]>([])
  const [topProducts, setTopProducts] = useState<ReportTopProductRow[]>([])

  // synchronous PO data — filtered by selected branch
  const allOrders = useMemo(() => loadPurchaseOrders(), [tick])
  const orders = useMemo(
    () => (selectedBranch === 'all' ? allOrders : allOrders.filter((p) => p.branchId === selectedBranch)),
    [allOrders, selectedBranch],
  )
  const openPos = useMemo(() => orders.filter((p) => p.status === 'ordered'), [orders])
  const pendingReceive = useMemo(
    () => openPos.filter((p) => p.lines.some((l) => l.receivedQtyTotal < l.orderedQty)),
    [openPos],
  )
  const unpaidConfirmed = useMemo(
    () => orders.filter((p) => p.status !== 'draft' && p.paymentMode === 'unpaid'),
    [orders],
  )
  const periodPoSpend = useMemo(() => {
    return orders
      .filter((p) => {
        if (p.status === 'draft') return false
        const at = p.orderedAt ?? p.createdAt
        return at >= dateFrom && at <= `${dateTo}T23:59:59`
      })
      .reduce((s, p) => s + poAmount(p), 0)
  }, [orders, dateFrom, dateTo])

  const lowStockCount = useMemo(
    () => stockLedger.filter((r) => r.minStock > 0 && r.stockQty < r.minStock).length,
    [stockLedger],
  )

  const salesFilters = selectedBranch === 'all' ? undefined : { branchId: selectedBranch }

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      if (selectedBranch === 'all') {
        // Load combined totals + per-branch breakdown in parallel
        const branchIds = BRANCHES.map((b) => b.id)
        const [combinedRes, ...branchResults] = await Promise.all([
          loadReportSalesSummaryAsync(dateFrom, dateTo),
          ...branchIds.map((id) => loadReportSalesSummaryAsync(dateFrom, dateTo, { branchId: id })),
        ])
        const [pnlRes, expRes, stockRes, topRes] = await Promise.all([
          loadReportPnlAsync(dateFrom, dateTo),
          loadReportExpensesAsync(dateFrom, dateTo),
          loadReportStockLedgerAsync(500),
          loadReportTopProductsAsync(dateFrom, dateTo, 8),
        ])
        setCombined(combinedRes)
        const map: Record<string, ReportSalesSummary | null> = {}
        branchIds.forEach((id, i) => { map[id] = branchResults[i] ?? null })
        setBranchSales(map)
        setPnl(pnlRes)
        setExpenses(expRes)
        setStockLedger(stockRes)
        setTopProducts(topRes)
      } else {
        // Sales + top products support branch filter; P&L, expenses, stock do not
        const [salesRes, topRes, pnlRes, expRes, stockRes] = await Promise.all([
          loadReportSalesSummaryAsync(dateFrom, dateTo, salesFilters),
          loadReportTopProductsAsync(dateFrom, dateTo, 8, salesFilters),
          loadReportPnlAsync(dateFrom, dateTo),
          loadReportExpensesAsync(dateFrom, dateTo),
          loadReportStockLedgerAsync(500),
        ])
        setCombined(salesRes)
        setBranchSales({})
        setPnl(pnlRes)
        setExpenses(expRes)
        setStockLedger(stockRes)
        setTopProducts(topRes)
      }
      setTick((n) => n + 1)
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, selectedBranch]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  function applyPreset(p: Preset) {
    setPreset(p)
    const { from, to } = getPresetDates(p)
    setDateFrom(from)
    setDateTo(to)
  }

  const profitColor = (v: number | undefined | null) =>
    v == null ? 'slate' : v >= 0 ? 'green' : 'red'

  const topExpenses = expenses?.byCategory.slice(0, 6) ?? []
  const maxExpCat = topExpenses[0]?.total ?? 1
  const trendMonths = pnl?.monthlyTrend ?? []
  const showComparison = selectedBranch === 'all'

  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      {/* Header */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Globe className="size-5 text-indigo-600" aria-hidden />
          <div>
            <h1 className="text-sm font-bold text-slate-900">Dashboard รวมทุกสาขา</h1>
            <p className="text-[11px] text-slate-500">
              {branchLabel(selectedBranch)} · {dateFrom} ถึง {dateTo}
            </p>
          </div>
        </div>

        {/* Branch filter chips */}
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-0.5">
          {(['all', ...BRANCHES.map((b) => b.id)] as BranchFilter[]).map((bid) => (
            <button
              key={bid}
              type="button"
              onClick={() => setSelectedBranch(bid)}
              className={clsx(
                'rounded-lg px-3 py-1 text-[11px] font-semibold transition-colors',
                selectedBranch === bid
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100',
              )}
            >
              {bid === 'all' ? 'ทุกสาขา' : BRANCHES.find((b) => b.id === bid)?.name ?? bid}
            </button>
          ))}
        </div>

        {/* Preset chips */}
        <div className="flex gap-1">
          {(['today', 'week', 'month', 'quarter'] as Preset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => applyPreset(p)}
              className={clsx(
                'rounded-full px-2.5 py-1 text-[10px] font-semibold',
                preset === p ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {p === 'today' ? 'วันนี้' : p === 'week' ? 'สัปดาห์นี้' : p === 'month' ? 'เดือนนี้' : '3 เดือน'}
            </button>
          ))}
        </div>

        {/* Custom range */}
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPreset('month') }}
            className="rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-indigo-400"
          />
          <span>—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPreset('month') }}
            className="rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-indigo-400"
          />
        </div>

        <button
          type="button"
          onClick={() => void loadAll()}
          disabled={loading}
          className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={clsx('size-3.5', loading && 'animate-spin')} />
          รีเฟรช
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-4 space-y-5">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label={`ยอดขาย${selectedBranch === 'all' ? 'รวม' : ''} (฿)`}
            value={`฿${thb(combined?.total)}`}
            sub={combined ? `${thb(combined.count)} บิล` : undefined}
            accent="sky"
            loading={loading}
          />
          <KpiCard
            label="กำไรขั้นต้น (฿)"
            value={`฿${thb(pnl?.grossProfit)}`}
            sub={pnl ? `margin ${pnl.grossMarginPct.toFixed(1)}%` : undefined}
            accent={profitColor(pnl?.grossProfit) as 'green' | 'red' | 'slate'}
            loading={loading}
          />
          <KpiCard
            label="กำไรสุทธิ (฿)"
            value={`฿${thb(pnl?.netProfit)}`}
            sub={pnl && pnl.netProfit != null ? (pnl.netProfit >= 0 ? 'กำไร' : 'ขาดทุน') : undefined}
            accent={profitColor(pnl?.netProfit) as 'green' | 'red' | 'slate'}
            loading={loading}
          />
          <KpiCard
            label="ค่าใช้จ่ายรวม (฿)"
            value={`฿${thb(expenses?.total ?? pnl?.totalExpenses)}`}
            sub={expenses ? `${expenses.count} รายการ` : undefined}
            accent="amber"
            loading={loading}
          />
          <KpiCard
            label="ซื้อเข้าช่วงนี้ (฿)"
            value={`฿${thb(periodPoSpend)}`}
            sub={`ค้างรับ ${pendingReceive.length} ใบ`}
            accent="slate"
          />
          <KpiCard
            label="สินค้าต่ำขั้นต่ำ"
            value={loading ? '…' : `${lowStockCount} รายการ`}
            sub={loading ? undefined : lowStockCount > 0 ? 'ต้องเติมสต็อก' : 'สต็อกปกติ'}
            accent={lowStockCount > 0 ? 'red' : 'green'}
            loading={loading}
          />
        </div>

        {/* ── Branch Comparison (all mode) or Single-Branch Sales (branch mode) + P&L Trend ── */}
        <div className="grid gap-4 lg:grid-cols-2">
          {showComparison ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                ยอดขายแต่ละสาขา
              </h2>
              {loading ? (
                <div className="space-y-4">
                  {BRANCHES.map((b) => (
                    <div key={b.id} className="space-y-1.5">
                      <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                      <div className="h-2 w-full animate-pulse rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {BRANCHES.map((b) => (
                    <BranchBar
                      key={b.id}
                      label={b.name}
                      value={branchSales[b.id]?.total ?? 0}
                      total={combined?.total ?? 1}
                    />
                  ))}
                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>รวมทุกสาขา</span>
                      <span className="font-mono text-sky-700">฿{thb(combined?.total)}</span>
                    </div>
                    {combined?.byPayment && combined.byPayment.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-[10px] font-semibold uppercase text-slate-400">แยกตามการชำระ</p>
                        {combined.byPayment.map((row) => (
                          <div key={row.paymentType} className="flex justify-between text-[11px] text-slate-600">
                            <span>
                              {row.paymentType === 'cash' ? 'เงินสด'
                                : row.paymentType === 'transfer' ? 'โอน/QR'
                                : row.paymentType === 'account' ? 'เครดิต'
                                : row.paymentType}
                            </span>
                            <span className="font-mono tabular-nums">฿{thb(row.totalBaht)} ({row.count} บิล)</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Single-branch: show payment breakdown + bill count */
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-sm">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-indigo-500">
                {branchLabel(selectedBranch)}
              </h2>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 animate-pulse rounded bg-indigo-100" />
                  ))}
                </div>
              ) : combined ? (
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-xs text-slate-500">ยอดขายรวม</span>
                    <span className="text-2xl font-black tabular-nums text-sky-700">฿{thb(combined.total)}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-xs text-slate-500">จำนวนบิล</span>
                    <span className="text-lg font-bold tabular-nums text-slate-700">{thb(combined.count)} บิล</span>
                  </div>
                  {combined.byPayment && combined.byPayment.length > 0 && (
                    <div className="mt-2 space-y-1.5 border-t border-indigo-100 pt-3">
                      <p className="text-[10px] font-semibold uppercase text-slate-400">แยกตามการชำระ</p>
                      {combined.byPayment.map((row) => (
                        <div key={row.paymentType} className="flex justify-between text-xs text-slate-600">
                          <span>
                            {row.paymentType === 'cash' ? 'เงินสด'
                              : row.paymentType === 'transfer' ? 'โอน/QR'
                              : row.paymentType === 'account' ? 'เครดิต'
                              : row.paymentType}
                          </span>
                          <span className="font-mono tabular-nums">฿{thb(row.totalBaht)} ({row.count} บิล)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="py-8 text-center text-xs text-slate-400">ไม่มีข้อมูล</p>
              )}
            </div>
          )}

          {/* P&L trend chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Trend รายเดือน (P&L)
                </h2>
                {selectedBranch !== 'all' && (
                  <p className="text-[10px] text-slate-400">ข้อมูลรวมทุกสาขา (ยังไม่รองรับแยกสาขา)</p>
                )}
              </div>
              {pnl && (
                <span className={clsx(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                  pnl.netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                )}>
                  {pnl.netProfit >= 0
                    ? <TrendingUp className="size-3" />
                    : <TrendingDown className="size-3" />}
                  {pnl.netProfit >= 0 ? 'กำไร' : 'ขาดทุน'}
                </span>
              )}
            </div>
            {loading ? (
              <div className="flex h-24 items-end gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 animate-pulse rounded-t bg-slate-100"
                    style={{ height: `${40 + i * 10}%` }}
                  />
                ))}
              </div>
            ) : trendMonths.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                ไม่มีข้อมูล P&L (ต้องใช้ในแอปพลิเคชัน)
              </p>
            ) : (
              <>
                <MiniBarChart rows={trendMonths} height={100} />
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="py-0.5 text-left">เดือน</th>
                        <th className="py-0.5 text-right">ยอดขาย</th>
                        <th className="py-0.5 text-right">COGS</th>
                        <th className="py-0.5 text-right">ค่าใช้จ่าย</th>
                        <th className="py-0.5 text-right">กำไร</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trendMonths.slice(-4).map((r) => (
                        <tr key={r.month} className="border-t border-slate-50">
                          <td className="py-0.5 font-mono text-slate-500">{shortMonth(r.month)}</td>
                          <td className="py-0.5 text-right tabular-nums text-slate-600">{thb(r.revenue)}</td>
                          <td className="py-0.5 text-right tabular-nums text-slate-500">{thb(r.cogs)}</td>
                          <td className="py-0.5 text-right tabular-nums text-slate-500">{thb(r.expenses)}</td>
                          <td className={clsx('py-0.5 text-right tabular-nums font-bold', r.net >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                            {thb(r.net)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Expense Categories + PO / Purchase Summary ── */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Expense breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">ค่าใช้จ่ายแยกหมวด</h2>
              {selectedBranch !== 'all' && (
                <p className="text-[10px] text-slate-400">ข้อมูลรวมทุกสาขา (ยังไม่รองรับแยกสาขา)</p>
              )}
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-2.5 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div className="h-1.5 w-full animate-pulse rounded-full bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : topExpenses.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">ไม่มีข้อมูล (ต้องใช้ในแอปพลิเคชัน)</p>
            ) : (
              <div className="space-y-3">
                {topExpenses.map((cat) => (
                  <div key={cat.category}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{cat.category}</span>
                      <span className="font-mono tabular-nums text-slate-600">฿{thb(cat.total)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${(cat.total / maxExpCat) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="border-t border-slate-100 pt-2 text-right text-xs font-bold text-slate-700">
                  รวม ฿{thb(expenses?.total)}
                  {expenses?.count ? <span className="ml-1 font-normal text-slate-400">({expenses.count} รายการ)</span> : null}
                </div>
              </div>
            )}
          </div>

          {/* Purchase / PO summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">
              สรุปการจัดซื้อ ({branchLabel(selectedBranch)})
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'ใบสั่งซื้อเปิดอยู่', value: openPos.length, color: 'bg-sky-100 text-sky-700' },
                { label: 'รอรับสินค้า', value: pendingReceive.length, color: pendingReceive.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500' },
                { label: 'ค้างชำระ', value: unpaidConfirmed.length, color: unpaidConfirmed.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500' },
                { label: 'ร่าง PO', value: orders.filter((p) => p.status === 'draft').length, color: 'bg-slate-100 text-slate-500' },
              ].map((item) => (
                <div key={item.label} className={clsx('rounded-xl px-4 py-3', item.color)}>
                  <p className="text-2xl font-black tabular-nums">{item.value}</p>
                  <p className="text-[11px] font-semibold">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>ซื้อเข้าช่วงนี้</span>
                <span className="font-mono font-bold tabular-nums text-slate-800">฿{thb(periodPoSpend)}</span>
              </div>
              {selectedBranch === 'all' ? (
                BRANCHES.map((b) => {
                  const bTotal = allOrders
                    .filter((p) => {
                      if (p.status === 'draft') return false
                      const at = p.orderedAt ?? p.createdAt
                      return p.branchId === b.id && at >= dateFrom && at <= `${dateTo}T23:59:59`
                    })
                    .reduce((s, p) => s + poAmount(p), 0)
                  return (
                    <div key={b.id} className="flex justify-between text-slate-500">
                      <span>{b.name}</span>
                      <span className="font-mono tabular-nums">฿{thb(bTotal)}</span>
                    </div>
                  )
                })
              ) : (
                <div className="flex justify-between text-slate-500">
                  <span>{branchLabel(selectedBranch)}</span>
                  <span className="font-mono tabular-nums">฿{thb(periodPoSpend)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Top Products ── */}
        {(topProducts.length > 0 || loading) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              สินค้าขายดี ({branchLabel(selectedBranch)})
            </h2>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-6 animate-pulse rounded bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">SKU</th>
                      <th className="px-3 py-2 text-left">ชื่อสินค้า</th>
                      <th className="px-3 py-2 text-left">หมวด</th>
                      <th className="px-3 py-2 text-right">จำนวนขาย</th>
                      <th className="px-3 py-2 text-right">ยอดขาย (฿)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr key={p.productId} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 font-mono text-slate-600">{p.sku}</td>
                        <td className="max-w-[14rem] px-3 py-2 font-medium text-slate-800">
                          <p className="truncate">{p.name}</p>
                        </td>
                        <td className="px-3 py-2 text-slate-500">{p.category}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{thb(p.qtySold)}</td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-sky-700">
                          ฿{thb(p.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Low stock alert */}
        {lowStockCount > 0 && !loading && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-sm">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-rose-800">
                สต็อกต่ำกว่าขั้นต่ำ {lowStockCount} รายการ
              </p>
              <p className="text-xs text-rose-600">
                เปิดหน้า <strong>ซื้อ → สินค้าใกล้หมด</strong> เพื่อดูรายการและสร้างใบสั่งซื้อ
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
