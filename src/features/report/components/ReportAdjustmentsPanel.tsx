import {
  loadReportAdjustmentsAsync,
  type ReportAdjustmentsResult,
} from '@/features/report/data/reportDb'
import { clsx } from 'clsx'
import { Ban, RefreshCw, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Preset = 'today' | 'week' | 'month' | 'last_month' | 'custom'

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'today', label: 'วันนี้' },
  { id: 'week', label: 'สัปดาห์นี้' },
  { id: 'month', label: 'เดือนนี้' },
  { id: 'last_month', label: 'เดือนที่แล้ว' },
  { id: 'custom', label: 'กำหนดเอง' },
]

function fmt(d: Date) { return d.toISOString().slice(0, 10) }

function getRange(preset: Preset): { from: string; to: string } {
  const now = new Date()
  switch (preset) {
    case 'today': return { from: fmt(now), to: fmt(now) }
    case 'week': {
      const day = now.getDay()
      const mon = new Date(now)
      mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
      return { from: fmt(mon), to: fmt(now) }
    }
    case 'month':
      return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmt(now) }
    case 'last_month':
      return {
        from: fmt(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: fmt(new Date(now.getFullYear(), now.getMonth(), 0)),
      }
    default: return { from: fmt(now), to: fmt(now) }
  }
}

function fmtMoney(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) }
  catch { return iso }
}

function fmtDateShort(iso: string) {
  try { return new Date(iso + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) }
  catch { return iso }
}

function fmtYAxis(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`
  return `${v}`
}

const REFUND_LABELS: Record<string, string> = {
  cash: 'คืนเงินสด',
  credit: 'เครดิต',
  deduct_ar: 'หักหนี้',
}

function AdjTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-slate-500">{fmtDateShort(label)}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="tabular-nums" style={{ color: p.dataKey === 'voids' ? '#f43f5e' : '#6366f1' }}>
          {p.name}: ฿{fmtMoney(p.value)}
        </p>
      ))}
    </div>
  )
}

export function ReportAdjustmentsPanel() {
  const [preset, setPreset] = useState<Preset>('month')
  const [customFrom, setCustomFrom] = useState(fmt(new Date()))
  const [customTo, setCustomTo] = useState(fmt(new Date()))
  const [data, setData] = useState<ReportAdjustmentsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedRange = useCallback(() => {
    if (preset === 'custom') return { from: customFrom, to: customTo }
    return getRange(preset)
  }, [preset, customFrom, customTo])

  const load = useCallback(async () => {
    const { from, to } = resolvedRange()
    if (!from || !to) return
    setLoading(true)
    setError(null)
    try {
      setData(await loadReportAdjustmentsAsync(from, to))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [resolvedRange])

  useEffect(() => { if (preset !== 'custom') void load() }, [preset])

  const dailyChart = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { date: string; voids: number; returns: number }>()
    data.voids.forEach((v) => {
      const d = v.voidedAt.slice(0, 10)
      if (!map.has(d)) map.set(d, { date: d, voids: 0, returns: 0 })
      map.get(d)!.voids += v.grandTotal
    })
    data.returns.forEach((r) => {
      const d = r.returnDate.slice(0, 10)
      if (!map.has(d)) map.set(d, { date: d, voids: 0, returns: 0 })
      map.get(d)!.returns += r.totalRefund
    })
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [data])

  return (
    <div className="space-y-5">
      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreset(p.id)}
            className={clsx(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
              preset === p.id
                ? 'border-indigo-400 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-sm outline-none focus:border-indigo-400" />
          <span className="text-xs text-slate-400">ถึง</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-sm outline-none focus:border-indigo-400" />
          <button type="button" onClick={() => void load()} disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            <RefreshCw className={clsx('size-3', loading && 'animate-spin')} />
            โหลด
          </button>
        </div>
      )}

      {loading && <p className="py-8 text-center text-sm text-slate-400">กำลังโหลดข้อมูล…</p>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</div>}

      {!loading && data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white px-4 py-3 shadow-sm">
              <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-rose-600">
                <Ban className="size-3" />ยกเลิกบิล
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-900">{data.voidCount}</p>
              <p className="text-[11px] tabular-nums text-rose-600">฿{fmtMoney(data.voidTotal)}</p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white px-4 py-3 shadow-sm">
              <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-indigo-600">
                <RotateCcw className="size-3" />คืนสินค้า
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-900">{data.returnCount}</p>
              <p className="text-[11px] tabular-nums text-indigo-600">฿{fmtMoney(data.returnTotal)}</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">ผลกระทบรวม</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                −฿{fmtMoney(data.voidTotal + data.returnTotal)}
              </p>
              <p className="text-[11px] text-slate-500">{data.voidCount + data.returnCount} รายการ</p>
            </div>
          </div>

          {/* Daily impact chart */}
          {dailyChart.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold text-slate-700">ผลกระทบรายวัน</h2>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 pb-2 pt-4 shadow-sm">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={dailyChart} margin={{ top: 0, right: 4, left: 0, bottom: 0 }} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmtDateShort}
                      tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtYAxis} tick={{ fontSize: 9, fill: '#94a3b8' }}
                      axisLine={false} tickLine={false} width={40} />
                    <Tooltip content={<AdjTooltip />} />
                    <Bar dataKey="voids" name="ยกเลิกบิล" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={24} />
                    <Bar dataKey="returns" name="คืนสินค้า" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-1.5 flex justify-center gap-4">
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="inline-block size-2 rounded-sm bg-[#f43f5e]" />ยกเลิกบิล
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="inline-block size-2 rounded-sm bg-[#6366f1]" />คืนสินค้า
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Voids */}
          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Ban className="size-3.5 text-rose-500" />
              ยกเลิกบิล ({data.voidCount})
            </h2>
            {data.voids.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 py-5 text-center text-xs text-slate-400">ไม่มีการยกเลิกบิลในช่วงนี้</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-rose-100 bg-white">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 border-b border-rose-100 bg-rose-50">
                      <tr className="text-[10px] font-medium uppercase tracking-wide text-rose-600">
                        <th className="px-3 py-2 text-left">เลขบิล</th>
                        <th className="px-3 py-2 text-left">วันที่บิล</th>
                        <th className="px-3 py-2 text-left">วันที่ยกเลิก</th>
                        <th className="px-3 py-2 text-left">ลูกค้า</th>
                        <th className="px-3 py-2 text-left">เหตุผล</th>
                        <th className="px-3 py-2 text-right">ยอด</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-50">
                      {data.voids.map((r) => (
                        <tr key={r.billNo} className="hover:bg-rose-50/30">
                          <td className="px-3 py-1.5 font-mono text-[11px] text-slate-700">{r.billNo}</td>
                          <td className="whitespace-nowrap px-3 py-1.5 text-slate-500">{fmtDate(r.docDate)}</td>
                          <td className="whitespace-nowrap px-3 py-1.5 text-rose-700">{fmtDate(r.voidedAt)}</td>
                          <td className="px-3 py-1.5 text-slate-700">{r.memberName || <span className="text-slate-400">ทั่วไป</span>}</td>
                          <td className="px-3 py-1.5 text-slate-500">{r.voidReason || '—'}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-rose-700">
                            {fmtMoney(r.grandTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Returns */}
          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <RotateCcw className="size-3.5 text-indigo-500" />
              คืนสินค้า ({data.returnCount})
            </h2>
            {data.returns.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 py-5 text-center text-xs text-slate-400">ไม่มีการคืนสินค้าในช่วงนี้</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-indigo-100 bg-white">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 border-b border-indigo-100 bg-indigo-50">
                      <tr className="text-[10px] font-medium uppercase tracking-wide text-indigo-600">
                        <th className="px-3 py-2 text-left">เลขคืน</th>
                        <th className="px-3 py-2 text-left">บิลต้นทาง</th>
                        <th className="px-3 py-2 text-left">วันที่</th>
                        <th className="px-3 py-2 text-left">ลูกค้า</th>
                        <th className="px-3 py-2 text-left">วิธีคืน</th>
                        <th className="px-3 py-2 text-left">เหตุผล</th>
                        <th className="px-3 py-2 text-right">ยอดคืน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-50">
                      {data.returns.map((r) => (
                        <tr key={r.returnNo} className="hover:bg-indigo-50/30">
                          <td className="px-3 py-1.5 font-mono text-[11px] text-indigo-700">{r.returnNo}</td>
                          <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600">{r.originalBillNo}</td>
                          <td className="whitespace-nowrap px-3 py-1.5 text-slate-500">{fmtDate(r.returnDate)}</td>
                          <td className="px-3 py-1.5 text-slate-700">{r.memberName || <span className="text-slate-400">ทั่วไป</span>}</td>
                          <td className="px-3 py-1.5 text-slate-600">{REFUND_LABELS[r.refundMethod] ?? r.refundMethod}</td>
                          <td className="px-3 py-1.5 text-slate-500">{r.reason || '—'}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-indigo-700">
                            {fmtMoney(r.totalRefund)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
