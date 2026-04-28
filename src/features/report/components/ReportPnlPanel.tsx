import {
  loadReportPnlAsync,
  type PnlMonthRow,
  type ReportPnlResult,
} from '@/features/report/data/reportDb'
import { useReportFilters } from '@/features/report/context/ReportFilterContext'
import { clsx } from 'clsx'
import { RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function formatMoney(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtMonthShort(ym: string) {
  try {
    const [y, m] = ym.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })
  } catch { return ym }
}

function fmtYAxis(v: number) {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`
  return `${v}`
}

function PnlTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const byKey = Object.fromEntries(payload.map((p: any) => [p.dataKey, p.value]))
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-xl">
      <p className="mb-1.5 font-semibold text-slate-500">{fmtMonthShort(label)}</p>
      <div className="space-y-0.5">
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">รายได้</span>
          <span className="font-bold tabular-nums text-indigo-700">฿{formatMoney(byKey.revenue ?? 0)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">ต้นทุน</span>
          <span className="tabular-nums text-amber-600">฿{formatMoney(byKey.cogs ?? 0)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">ค่าใช้จ่าย</span>
          <span className="tabular-nums text-rose-500">฿{formatMoney(byKey.expenses ?? 0)}</span>
        </div>
        <div className="mt-1 flex justify-between gap-6 border-t border-slate-100 pt-1">
          <span className="font-semibold text-slate-700">กำไรสุทธิ</span>
          <span className={clsx('font-bold tabular-nums', (byKey.net ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
            ฿{formatMoney(byKey.net ?? 0)}
          </span>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label, value, sub, color,
}: {
  label: string
  value: string
  sub?: string
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate'
}) {
  const palette: Record<string, string> = {
    indigo:  'border-indigo-100  bg-gradient-to-br from-indigo-50  to-white text-indigo-900  [--lc:#6366f1]',
    emerald: 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-white text-emerald-900 [--lc:#10b981]',
    amber:   'border-amber-100   bg-gradient-to-br from-amber-50   to-white text-amber-900   [--lc:#f59e0b]',
    rose:    'border-rose-100    bg-gradient-to-br from-rose-50    to-white text-rose-900    [--lc:#f43f5e]',
    violet:  'border-violet-100  bg-gradient-to-br from-violet-50  to-white text-violet-900  [--lc:#8b5cf6]',
    slate:   'border-slate-200   bg-white text-slate-900  [--lc:#64748b]',
  }
  return (
    <div className={clsx('rounded-2xl border px-4 py-3.5 shadow-sm', palette[color])}>
      <p className="text-[11px] font-medium uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-[11px] opacity-50">{sub}</p>}
    </div>
  )
}

export function ReportPnlPanel() {
  const { filters } = useReportFilters()
  const [data, setData] = useState<ReportPnlResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await loadReportPnlAsync(filters.dateFrom, filters.dateTo)
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [filters.dateFrom, filters.dateTo])

  useEffect(() => { void load() }, [load])

  const marginPct = data && data.revenue > 0
    ? (data.grossProfit / data.revenue) * 100
    : 0

  const netMarginPct = data && data.revenue > 0
    ? (data.netProfit / data.revenue) * 100
    : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">กำไร-ขาดทุน (P&amp;L)</h2>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={clsx('size-3', loading && 'animate-spin')} />รีเฟรช
        </button>
      </div>

      {loading && <p className="py-8 text-center text-sm text-slate-400">กำลังโหลดข้อมูล…</p>}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</div>
      )}

      {!loading && data && (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <KpiCard
              label="รายได้รวม"
              value={`฿${data.revenue >= 1_000_000 ? `${(data.revenue / 1_000_000).toFixed(2)}M` : formatMoney(data.revenue)}`}
              color="indigo"
            />
            <KpiCard
              label="ต้นทุนสินค้า (COGS)"
              value={`฿${formatMoney(data.cogs)}`}
              sub={`${data.revenue > 0 ? ((data.cogs / data.revenue) * 100).toFixed(1) : '0'}% ของรายได้`}
              color="amber"
            />
            <KpiCard
              label="กำไรขั้นต้น"
              value={`฿${formatMoney(data.grossProfit)}`}
              sub={`Margin ${marginPct.toFixed(1)}%`}
              color="emerald"
            />
            <KpiCard
              label="ค่าใช้จ่ายดำเนินงาน"
              value={`฿${formatMoney(data.totalExpenses)}`}
              color="rose"
            />
            <div className={clsx(
              'col-span-2 rounded-2xl border px-4 py-3.5 shadow-sm lg:col-span-2',
              data.netProfit >= 0
                ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white'
                : 'border-rose-200 bg-gradient-to-br from-rose-50 to-white',
            )}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">กำไรสุทธิ</p>
                  <p className={clsx(
                    'mt-1 text-2xl font-bold tabular-nums',
                    data.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700',
                  )}>
                    ฿{formatMoney(data.netProfit)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Net Margin {netMarginPct.toFixed(1)}%
                  </p>
                </div>
                {data.netProfit >= 0
                  ? <TrendingUp className="size-8 text-emerald-400 opacity-60" />
                  : <TrendingDown className="size-8 text-rose-400 opacity-60" />
                }
              </div>
            </div>
          </div>

          {/* Monthly trend chart */}
          {data.monthlyTrend.length > 1 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold text-slate-700">แนวโน้มรายเดือน</h2>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 pb-3 pt-4 shadow-sm">
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={data.monthlyTrend}
                    margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tickFormatter={fmtMonthShort}
                      tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtYAxis}
                      tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={42} />
                    <Tooltip content={<PnlTooltip />} />
                    <Legend
                      iconType="circle" iconSize={8}
                      formatter={(v) => {
                        const labels: Record<string, string> = {
                          revenue: 'รายได้', cogs: 'ต้นทุน', expenses: 'ค่าใช้จ่าย', net: 'กำไรสุทธิ',
                        }
                        return <span className="text-[10px] text-slate-600">{labels[v] ?? v}</span>
                      }}
                    />
                    <Bar dataKey="revenue"   fill="#6366f1" opacity={0.8} radius={[3, 3, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="cogs"      fill="#f59e0b" opacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="expenses"  fill="#f43f5e" opacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={28} />
                    <Line dataKey="net" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#10b981', strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Monthly breakdown table */}
          {data.monthlyTrend.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold text-slate-700">รายละเอียดรายเดือน</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-2 text-left">เดือน</th>
                        <th className="px-3 py-2 text-right">รายได้</th>
                        <th className="px-3 py-2 text-right">ต้นทุน</th>
                        <th className="px-3 py-2 text-right">ค่าใช้จ่าย</th>
                        <th className="px-3 py-2 text-right">กำไรสุทธิ</th>
                        <th className="px-3 py-2 text-right">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.monthlyTrend.map((row: PnlMonthRow) => {
                        const netPct = row.revenue > 0 ? (row.net / row.revenue) * 100 : 0
                        return (
                          <tr key={row.month} className="hover:bg-slate-50/80">
                            <td className="px-3 py-2.5 font-medium text-slate-900">
                              {fmtMonthShort(row.month)}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-indigo-700 font-semibold">
                              {formatMoney(row.revenue)}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-amber-600">
                              {formatMoney(row.cogs)}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-rose-500">
                              {formatMoney(row.expenses)}
                            </td>
                            <td className={clsx(
                              'px-3 py-2.5 text-right tabular-nums font-bold',
                              row.net >= 0 ? 'text-emerald-700' : 'text-rose-600',
                            )}>
                              {formatMoney(row.net)}
                            </td>
                            <td className={clsx(
                              'px-3 py-2.5 text-right tabular-nums text-[11px]',
                              netPct >= 0 ? 'text-emerald-600' : 'text-rose-500',
                            )}>
                              {netPct.toFixed(1)}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {data.revenue === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">ไม่มีข้อมูลรายได้ในช่วงเวลานี้</p>
          )}
        </>
      )}
    </div>
  )
}
