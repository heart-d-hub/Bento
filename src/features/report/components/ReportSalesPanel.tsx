import { useReportFilters } from '@/features/report/context/ReportFilterContext'
import {
  loadReportProfitMarginAsync,
  loadReportSalesByCategoryAsync,
  loadReportSalesSummaryAsync,
  loadReportTopMembersAsync,
  loadReportTopProductsAsync,
  type ReportCategoryRow,
  type ReportMarginRow,
  type ReportProfitSummary,
  type ReportSalesSummary,
  type ReportTopMemberRow,
  type ReportTopProductRow,
} from '@/features/report/data/reportDb'
import { clsx } from 'clsx'
import { RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Tab = 'overview' | 'profit'

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#f97316', '#ec4899', '#14b8a6',
]

const PAYMENT_COLORS: Record<string, string> = {
  cash: '#10b981',
  transfer: '#6366f1',
  account: '#f59e0b',
  mixed: '#8b5cf6',
}

function formatMoney(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDateShort(iso: string) {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  } catch { return iso }
}

function fmtYAxis(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`
  return `${v}`
}

function payLabel(id: string) {
  const map: Record<string, string> = {
    cash: 'เงินสด', transfer: 'โอน/QR', account: 'ลงบัญชี', mixed: 'ผสม',
  }
  return map[id] ?? id
}

function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl">
      <p className="mb-0.5 font-semibold text-slate-500">{fmtDateShort(label)}</p>
      <p className="font-bold tabular-nums text-indigo-700">฿{formatMoney(payload[0].value)}</p>
      {payload[1] && <p className="text-[10px] text-slate-400">{payload[1].value} บิล</p>}
    </div>
  )
}

function PaymentTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-600">{payLabel(d.payload.paymentType)}</p>
      <p className="font-bold tabular-nums text-indigo-700">฿{formatMoney(d.value)}</p>
      <p className="text-[10px] text-slate-400">{d.payload.count} บิล</p>
    </div>
  )
}

function CatTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-700">{d.name}</p>
      <p className="font-bold tabular-nums" style={{ color: d.payload.color }}>
        ฿{formatMoney(d.value)}
      </p>
      <p className="text-[10px] text-slate-400">{(d.payload.pct ?? 0).toFixed(1)}%</p>
    </div>
  )
}

function MarginTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as ReportMarginRow
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-700">{d.name}</p>
      <p className="text-slate-500">รายได้ <span className="font-bold text-indigo-700">฿{formatMoney(d.revenue)}</span></p>
      <p className="text-slate-500">ต้นทุน <span className="tabular-nums text-amber-600">฿{formatMoney(d.cogs)}</span></p>
      <p className="text-slate-500">กำไร <span className="font-bold text-emerald-600">฿{formatMoney(d.grossProfit)}</span></p>
      <p className="text-[10px] text-slate-400">Margin {d.marginPct.toFixed(1)}%</p>
    </div>
  )
}

export function ReportSalesPanel() {
  const { filters } = useReportFilters()
  const [tab, setTab] = useState<Tab>('overview')

  const [summary, setSummary] = useState<ReportSalesSummary | null>(null)
  const [topProducts, setTopProducts] = useState<ReportTopProductRow[]>([])
  const [topMembers, setTopMembers] = useState<ReportTopMemberRow[]>([])
  const [categories, setCategories] = useState<ReportCategoryRow[]>([])
  const [profit, setProfit] = useState<ReportProfitSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { dateFrom: from, dateTo: to } = filters
    if (!from || !to) return
    setLoading(true)
    setError(null)
    try {
      const salesFilters = {
        category: filters.category,
        brand: filters.brand,
        paymentType: filters.paymentType,
        branchId: filters.branchId,
        memberType: filters.memberType,
        priceTier: filters.priceTier,
      }
      const [s, p, m, c, pr] = await Promise.all([
        loadReportSalesSummaryAsync(from, to, salesFilters),
        loadReportTopProductsAsync(from, to, 10, salesFilters),
        loadReportTopMembersAsync(from, to, 10, salesFilters),
        loadReportSalesByCategoryAsync(from, to, salesFilters),
        loadReportProfitMarginAsync(from, to, salesFilters),
      ])
      setSummary(s)
      setTopProducts(p)
      setTopMembers(m)
      setCategories(c)
      setProfit(pr)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { void load() }, [load])

  const totalCatRevenue = categories.reduce((s, c) => s + c.revenue, 0)
  const catData = useMemo(() =>
    categories.map((c, i) => ({
      ...c,
      pct: totalCatRevenue > 0 ? (c.revenue / totalCatRevenue) * 100 : 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })), [categories, totalCatRevenue])

  const maxProductRevenue = topProducts[0]?.revenue ?? 1

  const profitChartData = useMemo(() =>
    (profit?.topProducts ?? []).slice(0, 10).map((r) => ({
      ...r,
      name: r.name.length > 14 ? r.name.slice(0, 14) + '…' : r.name,
    })), [profit])

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1.5">
        {(['overview', 'profit'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={clsx(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
              tab === t
                ? 'border-indigo-400 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            {t === 'overview' ? 'ภาพรวม' : 'กำไร / Margin'}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={clsx('size-3', loading && 'animate-spin')} />
        </button>
      </div>

      {loading && <p className="py-8 text-center text-sm text-slate-400">กำลังโหลดข้อมูล…</p>}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</div>
      )}

      {/* ── Overview tab ── */}
      {!loading && tab === 'overview' && summary && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white px-4 py-3.5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">ยอดขายรวม</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-900">
                ฿{summary.total >= 1_000_000
                  ? `${(summary.total / 1_000_000).toFixed(2)}M`
                  : formatMoney(summary.total)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">จำนวนบิล</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {summary.count.toLocaleString('th-TH')}
              </p>
              <p className="text-[11px] text-slate-400">บิล</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">เฉลี่ย/บิล</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                ฿{formatMoney(summary.avgBill)}
              </p>
            </div>
          </div>

          {/* Daily trend */}
          {summary.dailyTrend.length > 1 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold text-slate-700">ยอดขายรายวัน</h2>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 pb-3 pt-4 shadow-sm">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={summary.dailyTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmtDateShort}
                      tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                      interval="preserveStartEnd" />
                    <YAxis tickFormatter={fmtYAxis} tick={{ fontSize: 9, fill: '#94a3b8' }}
                      axisLine={false} tickLine={false} width={40} />
                    <Tooltip content={<TrendTooltip />} />
                    <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5}
                      fill="url(#gradSales)" dot={false} activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Payment + Category */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {summary.byPayment.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold text-slate-700">แยกตามช่องทางชำระ</h2>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 pb-3 pt-4 shadow-sm">
                  <ResponsiveContainer width="100%" height={Math.max(80, summary.byPayment.length * 46)}>
                    <BarChart data={summary.byPayment} layout="vertical"
                      margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="paymentType" tickFormatter={payLabel}
                        tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={62} />
                      <Tooltip content={<PaymentTooltip />} cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="totalBaht" radius={[0, 6, 6, 0]} maxBarSize={30}>
                        {summary.byPayment.map((r) => (
                          <Cell key={r.paymentType} fill={PAYMENT_COLORS[r.paymentType] ?? '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {catData.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold text-slate-700">สัดส่วนตามหมวดสินค้า</h2>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <PieChart width={130} height={130}>
                        <Pie data={catData} dataKey="revenue" nameKey="category"
                          cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={2}
                          strokeWidth={0}>
                          {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
                        </Pie>
                        <Tooltip content={<CatTooltip />} />
                      </PieChart>
                    </div>
                    <ul className="min-w-0 flex-1 space-y-1.5">
                      {catData.slice(0, 6).map((c) => (
                        <li key={c.category} className="flex items-center gap-1.5">
                          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="min-w-0 flex-1 truncate text-[11px] text-slate-700">{c.category}</span>
                          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-500">
                            {c.pct.toFixed(0)}%
                          </span>
                        </li>
                      ))}
                      {catData.length > 6 && (
                        <li className="text-[10px] text-slate-400">+{catData.length - 6} หมวดอื่น</li>
                      )}
                    </ul>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Top products */}
          {topProducts.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold text-slate-700">สินค้าขายดี Top 10</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      <th className="w-7 px-3 py-2 text-center">#</th>
                      <th className="px-3 py-2 text-left">สินค้า</th>
                      <th className="px-3 py-2 text-right">จำนวน</th>
                      <th className="px-3 py-2 text-right">ยอด (฿)</th>
                      <th className="w-20 px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topProducts.map((r, i) => (
                      <tr key={r.productId} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 text-center font-mono text-[10px] text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-900">{r.name}</p>
                          <p className="text-[10px] text-slate-400">{r.sku} · {r.category}</p>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                          {r.qtySold.toLocaleString('th-TH', { maximumFractionDigits: 1 })}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-900">
                          {formatMoney(r.revenue)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${(r.revenue / maxProductRevenue) * 100}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Top members */}
          {topMembers.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold text-slate-700">ลูกค้าสูงสุด Top 10</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      <th className="w-7 px-3 py-2 text-center">#</th>
                      <th className="px-3 py-2 text-left">สมาชิก</th>
                      <th className="px-3 py-2 text-right">ครั้ง</th>
                      <th className="px-3 py-2 text-right">ยอดรวม (฿)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topMembers.map((r, i) => (
                      <tr key={r.memberCode} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 text-center font-mono text-[10px] text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-900">{r.fullName}</p>
                          <p className="font-mono text-[10px] text-slate-400">{r.memberCode}</p>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-500">{r.visitCount}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-violet-800">
                          {formatMoney(r.totalSpent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {summary.count === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">ไม่มียอดขายในช่วงเวลานี้</p>
          )}
        </>
      )}

      {/* ── Profit tab ── */}
      {!loading && tab === 'profit' && profit && (
        <>
          {/* Profit KPI */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white px-4 py-3.5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">รายได้รวม</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-indigo-900">
                ฿{profit.revenue >= 1_000_000
                  ? `${(profit.revenue / 1_000_000).toFixed(2)}M`
                  : formatMoney(profit.revenue)}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white px-4 py-3.5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-amber-500">ต้นทุน (COGS)</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-amber-900">
                ฿{formatMoney(profit.cogs)}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white px-4 py-3.5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-500">กำไรขั้นต้น</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-emerald-900">
                ฿{formatMoney(profit.grossProfit)}
              </p>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white px-4 py-3.5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-violet-500">Gross Margin</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-violet-900">
                {profit.marginPct.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Margin by category */}
          {profit.byCategory.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold text-slate-700">Margin ตามหมวดสินค้า</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2 text-left">หมวด</th>
                      <th className="px-3 py-2 text-right">รายได้</th>
                      <th className="px-3 py-2 text-right">ต้นทุน</th>
                      <th className="px-3 py-2 text-right">กำไร</th>
                      <th className="px-3 py-2 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profit.byCategory.map((c) => (
                      <tr key={c.category} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-medium text-slate-900">{c.category}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-indigo-700">{formatMoney(c.revenue)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-amber-600">{formatMoney(c.cogs)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-emerald-700">{formatMoney(c.grossProfit)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-violet-700 font-medium">
                          {c.marginPct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Top products by margin */}
          {profitChartData.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold text-slate-700">กำไรรายสินค้า Top 10</h2>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 pb-3 pt-4 shadow-sm">
                <ResponsiveContainer width="100%" height={Math.max(160, profitChartData.length * 36)}>
                  <BarChart data={profitChartData} layout="vertical"
                    margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                    <XAxis type="number" tickFormatter={fmtYAxis}
                      tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name"
                      tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} width={110} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <Tooltip content={<MarginTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="revenue"     fill="#6366f1" opacity={0.6} radius={[0, 0, 0, 0]} maxBarSize={10} />
                    <Bar dataKey="grossProfit" fill="#10b981" opacity={0.85} radius={[0, 4, 4, 0]} maxBarSize={10} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="mt-1 text-center text-[10px] text-slate-400">
                  <span className="mr-3 inline-flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-indigo-400 opacity-60" />รายได้</span>
                  <span className="inline-flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-emerald-500" />กำไร</span>
                </p>
              </div>
            </section>
          )}

          {profit.revenue === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">ไม่มีข้อมูลในช่วงเวลานี้</p>
          )}
        </>
      )}

      {!loading && tab === 'profit' && !profit && !error && (
        <p className="py-8 text-center text-sm text-slate-400">ไม่มีข้อมูลกำไร — ตรวจสอบว่ามีการตั้งต้นทุนสินค้าแล้ว</p>
      )}
    </div>
  )
}
