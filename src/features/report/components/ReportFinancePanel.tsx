import {
  loadReportArBalancesAsync,
  type ReportArBalanceRow,
} from '@/features/report/data/reportDb'
import { clsx } from 'clsx'
import { RefreshCw, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) }
  catch { return iso }
}

function fmtYAxis(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`
  return `${v}`
}

function usageColor(balance: number, limit: number) {
  if (limit <= 0) return 'bg-slate-400'
  const pct = balance / limit
  if (pct >= 0.9) return 'bg-rose-500'
  if (pct >= 0.6) return 'bg-amber-400'
  return 'bg-emerald-500'
}

function ArTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const r = payload[0]?.payload as { name: string; ar: number; limit: number; over: boolean }
  if (!r) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-slate-700">{r.name}</p>
      <p className="tabular-nums text-amber-700">AR: ฿{fmt(r.ar)}</p>
      {r.limit > 0 && <p className="tabular-nums text-slate-500">วงเงิน: ฿{fmt(r.limit)}</p>}
      {r.over && <p className="font-semibold text-rose-600">เกินวงเงิน</p>}
    </div>
  )
}

export function ReportFinancePanel() {
  const [rows, setRows] = useState<ReportArBalanceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await loadReportArBalancesAsync())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const totalAr = rows.reduce((s, r) => s + r.arBalance, 0)
  const totalLimit = rows.reduce((s, r) => s + r.creditLimit, 0)
  const overLimit = rows.filter((r) => r.creditLimit > 0 && r.arBalance > r.creditLimit)

  const chartData = useMemo(() =>
    rows
      .filter((r) => r.arBalance > 0)
      .slice(0, 12)
      .map((r) => ({
        name: r.fullName.length > 14 ? r.fullName.slice(0, 14) + '…' : r.fullName,
        ar: r.arBalance,
        limit: r.creditLimit,
        over: r.creditLimit > 0 && r.arBalance > r.creditLimit,
      }))
      .reverse(),
    [rows],
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Wallet className="size-4 text-indigo-500" />
          ลูกหนี้คงค้าง (AR)
        </h2>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={clsx('size-3', loading && 'animate-spin')} />
          รีเฟรช
        </button>
      </div>

      {loading && <p className="py-8 text-center text-sm text-slate-400">กำลังโหลด…</p>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</div>}

      {!loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">ยอด AR รวม</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-amber-900">฿{fmt(totalAr)}</p>
              <p className="text-[11px] text-amber-600">{rows.length} ลูกค้า</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">วงเงินรวม</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">฿{fmt(totalLimit)}</p>
            </div>
            <div className={clsx(
              'rounded-2xl border px-4 py-3 shadow-sm',
              overLimit.length > 0 ? 'border-rose-200 bg-gradient-to-br from-rose-50 to-white' : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
            )}>
              <p className={clsx('text-[11px] font-medium uppercase tracking-wide', overLimit.length > 0 ? 'text-rose-600' : 'text-emerald-600')}>
                เกินวงเงิน
              </p>
              <p className={clsx('mt-1 text-xl font-bold tabular-nums', overLimit.length > 0 ? 'text-rose-900' : 'text-emerald-700')}>
                {overLimit.length} ราย
              </p>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center">
              <p className="text-sm text-slate-500">ไม่มีลูกหนี้คงค้าง</p>
              <p className="mt-1 text-xs text-slate-400">ลูกค้าที่ซื้อแบบ "ลงบัญชี" จะปรากฏที่นี่</p>
            </div>
          ) : (
            <>
              {/* AR bar chart */}
              {chartData.length > 0 && (
                <section>
                  <h2 className="mb-2 text-xs font-semibold text-slate-700">AR รายลูกค้า</h2>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 pb-3 pt-4 shadow-sm">
                    <ResponsiveContainer width="100%" height={Math.max(100, chartData.length * 34)}>
                      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                        <XAxis type="number" tickFormatter={fmtYAxis}
                          tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name"
                          tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={96} />
                        <Tooltip content={<ArTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="ar" name="AR คงค้าง" radius={[0, 5, 5, 0]} maxBarSize={20}>
                          {chartData.map((r, i) => (
                            <Cell key={i} fill={r.over ? '#ef4444' : '#f59e0b'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}

              {/* Detail table */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="max-h-[28rem] overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 border-b border-slate-200 bg-slate-50">
                      <tr className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-2 text-left">ลูกค้า</th>
                        <th className="px-3 py-2 text-right">AR คงค้าง</th>
                        <th className="px-3 py-2 text-right">วงเงิน</th>
                        <th className="w-28 px-3 py-2 text-center">ใช้ไป</th>
                        <th className="px-3 py-2 text-right">ซื้อล่าสุด</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((r) => {
                        const pct = r.creditLimit > 0 ? Math.min(1, r.arBalance / r.creditLimit) : 0
                        const over = r.creditLimit > 0 && r.arBalance > r.creditLimit
                        return (
                          <tr key={r.memberCode} className={clsx('hover:bg-slate-50', over && 'bg-rose-50/30')}>
                            <td className="px-3 py-2">
                              <p className={clsx('font-medium', over ? 'text-rose-800' : 'text-slate-900')}>{r.fullName}</p>
                              <p className="font-mono text-[10px] text-slate-400">{r.memberCode}</p>
                            </td>
                            <td className={clsx('px-3 py-2 text-right tabular-nums font-semibold', over ? 'text-rose-700' : 'text-amber-700')}>
                              ฿{fmt(r.arBalance)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                              {r.creditLimit > 0 ? `฿${fmt(r.creditLimit)}` : '—'}
                            </td>
                            <td className="px-3 py-2">
                              {r.creditLimit > 0 ? (
                                <div className="mx-auto flex max-w-[6rem] flex-col items-end gap-0.5">
                                  <span className={clsx('text-[10px] tabular-nums font-medium', over ? 'text-rose-600' : 'text-slate-500')}>
                                    {(pct * 100).toFixed(0)}%
                                  </span>
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className={clsx('h-full rounded-full', usageColor(r.arBalance, r.creditLimit))}
                                      style={{ width: `${pct * 100}%` }}
                                    />
                                  </div>
                                </div>
                              ) : <span className="block text-center text-slate-300">—</span>}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-right text-slate-500">{fmtDate(r.lastSaleAt)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
