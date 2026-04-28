import {
  expenseApproveAsync,
  expenseCreateAsync,
  expenseDeleteAsync,
  expenseRejectAsync,
  expenseUpdateAsync,
  loadReportExpensesAsync,
  reportExpenseComparisonAsync,
  type ExpenseCreatePayload,
  type ExpenseRow,
  type ReportExpensesResult,
} from '@/features/report/data/expensesDb'
import { clsx } from 'clsx'
import { Check, Download, Pencil, Plus, RefreshCw, Repeat2, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Preset = 'today' | 'week' | 'month' | 'last_month' | 'quarter' | 'year' | 'custom'

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'month',      label: 'เดือนนี้' },
  { id: 'last_month', label: 'เดือนที่แล้ว' },
  { id: 'quarter',    label: 'ไตรมาสนี้' },
  { id: 'year',       label: 'ปีนี้' },
  { id: 'custom',     label: 'กำหนดเอง' },
]

const CAT_COLORS = [
  '#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b',
  '#f97316','#ec4899','#14b8a6','#64748b','#ef4444','#84cc16',
]

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'เงินสด', transfer: 'โอน', credit_card: 'บัตรเครดิต', other: 'อื่นๆ',
}

const STATUS_STYLE: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700',
  pending:  'bg-amber-100 text-amber-700',
  rejected: 'bg-rose-100 text-rose-600 line-through',
}

const STATUS_LABEL: Record<string, string> = {
  approved: 'อนุมัติ', pending: 'รออนุมัติ', rejected: 'ปฏิเสธ',
}

function fmtDate(d: Date) { return d.toISOString().slice(0, 10) }

function getPresetRange(preset: Preset) {
  const now = new Date()
  switch (preset) {
    case 'today':      return { from: fmtDate(now), to: fmtDate(now) }
    case 'week': {
      const day = now.getDay()
      const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
      return { from: fmtDate(mon), to: fmtDate(now) }
    }
    case 'month':      return { from: fmtDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmtDate(now) }
    case 'last_month': return {
      from: fmtDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to:   fmtDate(new Date(now.getFullYear(), now.getMonth(), 0)),
    }
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3)
      return { from: fmtDate(new Date(now.getFullYear(), q * 3, 1)), to: fmtDate(now) }
    }
    case 'year':       return { from: fmtDate(new Date(now.getFullYear(), 0, 1)), to: fmtDate(now) }
    default:           return { from: fmtDate(now), to: fmtDate(now) }
  }
}

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtYAxis(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`
  return `${v}`
}

function ExpTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-600">{payload[0]?.payload?.month}</p>
      <p className="tabular-nums text-rose-700">฿{fmt(payload[0]?.value ?? 0)}</p>
    </div>
  )
}

function CatTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-700">{d.name}</p>
      <p className="font-bold tabular-nums" style={{ color: d.payload.color }}>฿{fmt(d.value)}</p>
    </div>
  )
}

function MomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-slate-600">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="tabular-nums" style={{ color: p.fill }}>
          {p.name}: ฿{fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

type AddForm = {
  expenseDate: string; category: string; amount: string
  note: string; payee: string; paymentMethod: string
  isRecurring: boolean; recurringInterval: string
}

const BLANK_FORM: AddForm = {
  expenseDate: fmtDate(new Date()), category: '',
  amount: '', note: '', payee: '', paymentMethod: 'cash',
  isRecurring: false, recurringInterval: 'monthly',
}

function formFromRow(r: ExpenseRow): AddForm {
  return {
    expenseDate: r.expenseDate, category: r.category,
    amount: String(r.amount), note: r.note ?? '', payee: r.payee ?? '',
    paymentMethod: r.paymentMethod, isRecurring: r.isRecurring,
    recurringInterval: r.recurringInterval ?? 'monthly',
  }
}

function exportCsv(data: ReportExpensesResult, range: string) {
  const rows = data.items.map((r) => [
    r.expenseDate, r.category, r.amount.toFixed(2), r.payee ?? '', r.note ?? '',
    r.paymentMethod, r.isRecurring ? 'recurring' : '', r.status,
  ])
  const lines = [
    ['วันที่','หมวด','จำนวน','ผู้รับเงิน','หมายเหตุ','วิธีชำระ','recurring','สถานะ'],
    ...rows,
  ].map((cols) => cols.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(','))
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `expenses-${range}.csv`; a.click()
  URL.revokeObjectURL(url)
}

function currentYearMonth() {
  return new Date().toISOString().slice(0, 7)
}

type FormPanelProps = {
  form: AddForm
  setForm: (f: AddForm) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  title: string
  vendorNames?: string[]
  categories?: string[]
}

function ExpenseForm({ form, setForm, onSave, onCancel, saving, title, vendorNames = [], categories = [] }: FormPanelProps) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold text-emerald-800">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-600">วันที่</label>
          <input type="date" value={form.expenseDate}
            onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-600">หมวด</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400">
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-600">จำนวน (฿)</label>
          <input type="number" min="0" step="0.01" value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-600">วิธีชำระ</label>
          <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400">
            <option value="cash">เงินสด</option>
            <option value="transfer">โอน</option>
            <option value="credit_card">บัตรเครดิต</option>
            <option value="other">อื่นๆ</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-600">ผู้รับเงิน</label>
          <input type="text" list="vendor-datalist" value={form.payee}
            onChange={(e) => setForm({ ...form, payee: e.target.value })}
            placeholder="ไม่ระบุ"
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400" />
          <datalist id="vendor-datalist">
            {vendorNames.map((n) => <option key={n} value={n} />)}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-600">หมายเหตุ</label>
          <input type="text" value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="ไม่ระบุ"
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400" />
        </div>
        <div className="flex items-end gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700">
            <input type="checkbox" checked={form.isRecurring}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              className="size-3.5 accent-indigo-600" />
            <Repeat2 className="size-3 text-indigo-500" />ประจำ
          </label>
          {form.isRecurring && (
            <select value={form.recurringInterval}
              onChange={(e) => setForm({ ...form, recurringInterval: e.target.value })}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-indigo-400">
              <option value="weekly">รายสัปดาห์</option>
              <option value="monthly">รายเดือน</option>
              <option value="yearly">รายปี</option>
            </select>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
          ยกเลิก
        </button>
        <button type="button" onClick={onSave} disabled={saving || !form.amount}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
          {saving ? <RefreshCw className="size-3 animate-spin" /> : <Plus className="size-3" />}บันทึก
        </button>
      </div>
    </div>
  )
}

export function ReportExpensePanel({ vendorNames = [], categories = [] }: { vendorNames?: string[]; categories?: string[] }) {
  const [preset, setPreset] = useState<Preset>('month')
  const [customFrom, setCustomFrom] = useState(fmtDate(new Date()))
  const [customTo, setCustomTo]     = useState(fmtDate(new Date()))
  const [catFilter, setCatFilter]   = useState<string | null>(null)
  const [data, setData]             = useState<ReportExpensesResult | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const [showAdd, setShowAdd]       = useState(false)
  const [addForm, setAddForm]       = useState<AddForm>(BLANK_FORM)
  const [saving, setSaving]         = useState(false)

  const [editRow, setEditRow]       = useState<ExpenseRow | null>(null)
  const [editForm, setEditForm]     = useState<AddForm>(BLANK_FORM)

  const [momData, setMomData]       = useState<{ category: string; current: number; previous: number }[]>([])

  const getRange = () =>
    preset === 'custom' ? { from: customFrom, to: customTo } : getPresetRange(preset)

  const load = async () => {
    const { from, to } = getRange()
    setLoading(true); setError(null)
    try {
      const [result, mom] = await Promise.all([
        loadReportExpensesAsync(from, to, catFilter),
        reportExpenseComparisonAsync(currentYearMonth()),
      ])
      setData(result)
      setMomData(mom?.byCategory.slice(0, 8) ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }

  useEffect(() => { if (preset !== 'custom') void load() }, [preset, catFilter])

  const handleAdd = async () => {
    if (!addForm.amount || isNaN(Number(addForm.amount))) return
    setSaving(true)
    try {
      const payload: ExpenseCreatePayload = {
        expenseDate: addForm.expenseDate, category: addForm.category,
        amount: Number(addForm.amount), note: addForm.note || null,
        payee: addForm.payee || null, paymentMethod: addForm.paymentMethod,
        isRecurring: addForm.isRecurring,
        recurringInterval: addForm.isRecurring ? addForm.recurringInterval : null,
      }
      await expenseCreateAsync(payload)
      setAddForm(BLANK_FORM); setShowAdd(false)
      await load()
    } catch (e) { alert(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  const handleEdit = async () => {
    if (!editRow || !editForm.amount) return
    setSaving(true)
    try {
      await expenseUpdateAsync(
        editRow.id, editForm.expenseDate, editForm.category,
        Number(editForm.amount), editForm.note || null, editForm.payee || null,
        editForm.paymentMethod, editForm.isRecurring,
        editForm.isRecurring ? editForm.recurringInterval : null,
      )
      setEditRow(null); await load()
    } catch (e) { alert(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ลบรายการนี้?')) return
    await expenseDeleteAsync(id); await load()
  }

  const handleApprove = async (id: string) => {
    await expenseApproveAsync(id, 'admin'); await load()
  }

  const handleReject = async (id: string) => {
    await expenseRejectAsync(id); await load()
  }

  const handleRepeat = (row: ExpenseRow) => {
    const next = new Date(row.expenseDate)
    if (row.recurringInterval === 'weekly') next.setDate(next.getDate() + 7)
    else if (row.recurringInterval === 'yearly') next.setFullYear(next.getFullYear() + 1)
    else next.setMonth(next.getMonth() + 1)
    setAddForm({
      expenseDate: fmtDate(next), category: row.category,
      amount: String(row.amount), note: row.note ?? '', payee: row.payee ?? '',
      paymentMethod: row.paymentMethod, isRecurring: true,
      recurringInterval: row.recurringInterval ?? 'monthly',
    })
    setShowAdd(true)
  }

  const catData = useMemo(() =>
    (data?.byCategory ?? []).map((c, i) => ({
      ...c,
      color: CAT_COLORS[i % CAT_COLORS.length],
      pct: data && data.total > 0 ? (c.total / data.total * 100) : 0,
    })), [data])

  const rangeStr = preset === 'custom' ? `${customFrom}_${customTo}` : preset

  return (
    <div className="space-y-5">
      {/* Presets + actions */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPreset(p.id)}
            className={clsx('rounded-lg border px-3 py-1.5 text-xs font-medium transition',
              preset === p.id
                ? 'border-indigo-400 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}>
            {p.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {data && (
            <button type="button" onClick={() => exportCsv(data, rangeStr)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              <Download className="size-3" />CSV
            </button>
          )}
          <button type="button" onClick={() => { setAddForm({ ...BLANK_FORM, category: categories[0] ?? '' }); setShowAdd(!showAdd); setEditRow(null) }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
            <Plus className="size-3" />บันทึกค่าใช้จ่าย
          </button>
        </div>
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-sm outline-none focus:border-indigo-400" />
          <span className="text-xs text-slate-400">ถึง</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-sm outline-none focus:border-indigo-400" />
          <button type="button" onClick={() => void load()} disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
            <RefreshCw className={clsx('size-3', loading && 'animate-spin')} />โหลด
          </button>
        </div>
      )}

      {/* Add form */}
      {showAdd && !editRow && (
        <ExpenseForm form={addForm} setForm={setAddForm}
          onSave={() => void handleAdd()} onCancel={() => setShowAdd(false)}
          saving={saving} title="บันทึกค่าใช้จ่ายใหม่" vendorNames={vendorNames} categories={categories} />
      )}

      {/* Edit form */}
      {editRow && (
        <ExpenseForm form={editForm} setForm={setEditForm}
          onSave={() => void handleEdit()} onCancel={() => setEditRow(null)}
          saving={saving} title={`แก้ไข — ${editRow.category} ${editRow.expenseDate}`}
          vendorNames={vendorNames} categories={categories} />
      )}

      {loading && <p className="py-8 text-center text-sm text-slate-400">กำลังโหลด…</p>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</div>}

      {!loading && data && (
        <>
          {/* KPI */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white px-4 py-3.5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-rose-600">ค่าใช้จ่ายรวม</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-900">฿{fmt(data.total)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">จำนวนรายการ</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{data.count}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">เฉลี่ย/รายการ</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">฿{fmt(data.avgPerEntry)}</p>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {data.monthlyTrend.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold text-slate-700">ค่าใช้จ่ายรายเดือน</h2>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 pb-3 pt-4 shadow-sm">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={data.monthlyTrend} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={fmtYAxis} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={<ExpTooltip />} />
                      <Bar dataKey="total" name="ค่าใช้จ่าย" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {catData.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold text-slate-700">แยกตามหมวด</h2>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <PieChart width={130} height={130}>
                      <Pie data={catData} dataKey="total" nameKey="category"
                        cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={2} strokeWidth={0}>
                        {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                      <Tooltip content={<CatTooltip />} />
                    </PieChart>
                    <ul className="min-w-0 flex-1 space-y-1.5">
                      {catData.slice(0, 7).map((c) => (
                        <li key={c.category} className="flex items-center gap-1.5">
                          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="min-w-0 flex-1 truncate text-[11px] text-slate-700">{c.category}</span>
                          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-500">
                            {c.pct.toFixed(0)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* MoM comparison */}
          {momData.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold text-slate-700">เปรียบเทียบเดือนนี้ vs เดือนที่แล้ว</h2>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 pb-3 pt-4 shadow-sm">
                <ResponsiveContainer width="100%" height={Math.max(140, momData.length * 36)}>
                  <BarChart data={momData} layout="vertical"
                    margin={{ top: 0, right: 12, left: 4, bottom: 0 }}>
                    <XAxis type="number" tickFormatter={fmtYAxis}
                      tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="category" width={110}
                      tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <Tooltip content={<MomTooltip />} />
                    <Legend iconType="circle" iconSize={8}
                      formatter={(v) => <span className="text-[10px] text-slate-600">{v}</span>} />
                    <Bar dataKey="previous" name="เดือนที่แล้ว" fill="#94a3b8" radius={[0,0,0,0]} maxBarSize={10} />
                    <Bar dataKey="current"  name="เดือนนี้"     fill="#f43f5e" radius={[0,4,4,0]} maxBarSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Item table */}
          {data.items.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-xs font-semibold text-slate-700">รายการค่าใช้จ่าย</h2>
                <div className="ml-auto">
                  <select value={catFilter ?? ''} onChange={(e) => setCatFilter(e.target.value || null)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400">
                    <option value="">ทุกหมวด</option>
                    {data.byCategory.map((c) => <option key={c.category} value={c.category}>{c.category}</option>)}
                  </select>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 border-b border-slate-200 bg-slate-50">
                      <tr className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-2 text-left">วันที่</th>
                        <th className="px-3 py-2 text-left">หมวด</th>
                        <th className="px-3 py-2 text-left">ผู้รับเงิน</th>
                        <th className="px-3 py-2 text-left">หมายเหตุ</th>
                        <th className="px-3 py-2 text-right">จำนวน</th>
                        <th className="px-3 py-2 text-center">สถานะ</th>
                        <th className="w-24 px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.items.map((r) => (
                        <tr key={r.id} className={clsx('hover:bg-slate-50', r.status === 'rejected' && 'opacity-50')}>
                          <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">{r.expenseDate}</td>
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                {r.category}
                              </span>
                              {r.isRecurring && (
                                <Repeat2 className="size-3 shrink-0 text-indigo-400" title={`ประจำ (${r.recurringInterval})`} />
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-1.5 text-slate-600">{r.payee || '—'}</td>
                          <td className="max-w-[8rem] truncate px-3 py-1.5 text-slate-500">{r.note || '—'}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-rose-700">
                            ฿{fmt(r.amount)}
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <span className={clsx('rounded-full px-1.5 py-0.5 text-[10px] font-medium', STATUS_STYLE[r.status] ?? '')}>
                              {STATUS_LABEL[r.status] ?? r.status}
                            </span>
                          </td>
                          <td className="px-3 py-1.5">
                            <div className="flex items-center justify-end gap-1">
                              {r.status === 'pending' && (
                                <>
                                  <button type="button" onClick={() => void handleApprove(r.id)}
                                    className="rounded-md p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600" title="อนุมัติ">
                                    <Check className="size-3" />
                                  </button>
                                  <button type="button" onClick={() => void handleReject(r.id)}
                                    className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="ปฏิเสธ">
                                    <X className="size-3" />
                                  </button>
                                </>
                              )}
                              {r.isRecurring && (
                                <button type="button" onClick={() => handleRepeat(r)}
                                  className="rounded-md p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" title="บันทึกรายการถัดไป">
                                  <Repeat2 className="size-3" />
                                </button>
                              )}
                              <button type="button"
                                onClick={() => { setEditRow(r); setEditForm(formFromRow(r)); setShowAdd(false) }}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                <Pencil className="size-3" />
                              </button>
                              <button type="button" onClick={() => void handleDelete(r.id)}
                                className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {data.items.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">ไม่มีค่าใช้จ่ายในช่วงนี้</p>
          )}
        </>
      )}
    </div>
  )
}
