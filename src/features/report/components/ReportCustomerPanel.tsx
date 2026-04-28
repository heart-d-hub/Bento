import {
  loadReportMemberSegmentsAsync,
  loadReportRfmAsync,
  type ReportRfmRow,
  type ReportSegmentRow,
} from '@/features/report/data/reportDb'
import { useReportFilters } from '@/features/report/context/ReportFilterContext'
import { clsx } from 'clsx'
import { RefreshCw, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Tab = 'segments' | 'rfm'

const SEGMENT_COLORS: Record<string, string> = {
  tier1: '#6366f1',
  tier2: '#8b5cf6',
  tier3: '#06b6d4',
  tier4: '#10b981',
  tier5: '#f59e0b',
}

const RFM_SEGMENT_COLORS: Record<string, string> = {
  Champion:  '#10b981',
  Loyal:     '#6366f1',
  Promising: '#06b6d4',
  'At Risk':  '#f59e0b',
  Lost:       '#f43f5e',
  Potential: '#8b5cf6',
}

function fmtYAxis(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`
  return `${v}`
}

function formatMoney(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function SegTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as ReportSegmentRow
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-700">{d.segment}</p>
      <p className="tabular-nums text-indigo-700 font-bold">฿{formatMoney(d.revenue)}</p>
      <p className="text-[10px] text-slate-400">{d.memberCount} ราย · {d.billCount} บิล</p>
      <p className="text-[10px] text-slate-400">เฉลี่ย ฿{formatMoney(d.avgBill)}/บิล</p>
    </div>
  )
}

function RfmBadge({ segment }: { segment: string }) {
  const color = RFM_SEGMENT_COLORS[segment] ?? '#94a3b8'
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {segment}
    </span>
  )
}

export function ReportCustomerPanel() {
  const { filters } = useReportFilters()
  const [tab, setTab] = useState<Tab>('segments')
  const [segments, setSegments] = useState<ReportSegmentRow[]>([])
  const [rfm, setRfm] = useState<ReportRfmRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [seg, rfmData] = await Promise.all([
        loadReportMemberSegmentsAsync(filters.dateFrom, filters.dateTo),
        loadReportRfmAsync(100),
      ])
      setSegments(seg)
      setRfm(rfmData)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [filters.dateFrom, filters.dateTo])

  useEffect(() => { void load() }, [load])

  const segmentChartData = useMemo(() =>
    segments.map((s, i) => ({
      ...s,
      color: SEGMENT_COLORS[`tier${i + 1}`] ?? '#94a3b8',
    })), [segments])

  const rfmStats = useMemo(() => {
    const counts: Record<string, number> = {}
    rfm.forEach((r) => { counts[r.rfmSegment] = (counts[r.rfmSegment] ?? 0) + 1 })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([segment, count]) => ({ segment, count }))
  }, [rfm])

  const totalMembers = segments.reduce((s, r) => s + r.memberCount, 0)
  const totalRevenue = segments.reduce((s, r) => s + r.revenue, 0)
  const totalBills   = segments.reduce((s, r) => s + r.billCount, 0)

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1.5">
        {(['segments', 'rfm'] as Tab[]).map((t) => (
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
            {t === 'segments' ? 'กลุ่มลูกค้า' : 'RFM Analysis'}
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

      {/* ── Segments tab ── */}
      {!loading && tab === 'segments' && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white px-4 py-3.5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">ลูกค้าทั้งหมด</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-900">
                {totalMembers.toLocaleString('th-TH')}
              </p>
              <p className="text-[11px] text-indigo-400">ราย</p>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white px-4 py-3.5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-violet-500">ยอดรวม</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-violet-900">
                ฿{totalRevenue >= 1_000_000
                  ? `${(totalRevenue / 1_000_000).toFixed(2)}M`
                  : formatMoney(totalRevenue)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">บิลรวม</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {totalBills.toLocaleString('th-TH')}
              </p>
            </div>
          </div>

          {/* Revenue by segment chart */}
          {segmentChartData.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold text-slate-700">ยอดขายแยกตามกลุ่มลูกค้า</h2>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 pb-3 pt-4 shadow-sm">
                <ResponsiveContainer width="100%" height={Math.max(120, segmentChartData.length * 52)}>
                  <BarChart data={segmentChartData} layout="vertical"
                    margin={{ top: 0, right: 12, left: 4, bottom: 0 }}>
                    <XAxis type="number" tickFormatter={fmtYAxis}
                      tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="segment"
                      tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={72} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <Tooltip content={<SegTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={32}>
                      {segmentChartData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Segment table */}
          {segments.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold text-slate-700">รายละเอียดแต่ละกลุ่ม</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2 text-left">กลุ่ม</th>
                      <th className="px-3 py-2 text-right">ลูกค้า</th>
                      <th className="px-3 py-2 text-right">บิล</th>
                      <th className="px-3 py-2 text-right">ยอดรวม (฿)</th>
                      <th className="px-3 py-2 text-right">เฉลี่ย/บิล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {segments.map((s, i) => (
                      <tr key={s.segment} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-2">
                            <span
                              className="size-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: SEGMENT_COLORS[`tier${i + 1}`] ?? '#94a3b8' }}
                            />
                            <span className="font-medium text-slate-900">{s.segment}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                          {s.memberCount.toLocaleString('th-TH')}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">
                          {s.billCount.toLocaleString('th-TH')}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-900">
                          {formatMoney(s.revenue)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">
                          {formatMoney(s.avgBill)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {segments.length === 0 && !loading && (
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <Users className="size-10 opacity-30" />
              <p className="text-sm">ไม่มีข้อมูลลูกค้าในช่วงนี้</p>
            </div>
          )}
        </>
      )}

      {/* ── RFM tab ── */}
      {!loading && tab === 'rfm' && (
        <>
          {/* RFM segment summary chips */}
          {rfmStats.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {rfmStats.map(({ segment, count }) => (
                <div
                  key={segment}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
                >
                  <RfmBadge segment={segment} />
                  <span className="text-xs font-bold tabular-nums text-slate-700">{count}</span>
                  <span className="text-[10px] text-slate-400">ราย</span>
                </div>
              ))}
            </div>
          )}

          {/* RFM table */}
          {rfm.length > 0 ? (
            <section>
              <h2 className="mb-2 text-xs font-semibold text-slate-700">
                RFM Score รายบุคคล ({rfm.length} ราย)
              </h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-2 text-left">ลูกค้า</th>
                        <th className="px-3 py-2 text-right" title="Recency (วันที่ซื้อล่าสุด)">R</th>
                        <th className="px-3 py-2 text-right" title="Frequency (ความถี่)">F</th>
                        <th className="px-3 py-2 text-right" title="Monetary (ยอดใช้จ่าย)">M</th>
                        <th className="px-3 py-2 text-right">คะแนน</th>
                        <th className="px-3 py-2 text-right">ยอดรวม</th>
                        <th className="px-3 py-2 text-left">กลุ่ม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rfm.map((r) => (
                        <tr key={r.memberCode} className="hover:bg-slate-50/80">
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-slate-900">{r.fullName}</p>
                            <p className="font-mono text-[10px] text-slate-400">{r.memberCode}</p>
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">
                            {r.recencyDays}d
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">
                            {r.frequency}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">
                            {formatMoney(r.monetary)}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className="font-bold tabular-nums text-indigo-700">
                              {r.rfmTotal}
                            </span>
                            <span className="ml-1 text-[10px] text-slate-400">
                              ({r.rScore}/{r.fScore}/{r.mScore})
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-900">
                            {formatMoney(r.monetary)}
                          </td>
                          <td className="px-3 py-2.5">
                            <RfmBadge segment={r.rfmSegment} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <Users className="size-10 opacity-30" />
              <p className="text-sm">ไม่มีข้อมูล RFM — ต้องมีข้อมูลการขายและลูกค้าก่อน</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
