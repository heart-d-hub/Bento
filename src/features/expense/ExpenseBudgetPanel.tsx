import {
  budgetDeleteAsync,
  budgetListAsync,
  budgetUpsertAsync,
  reportBudgetVsActualAsync,
  type BudgetRow,
  type BudgetVsActualRow,
} from '@/features/expense/expenseBudgetDb'
import { clsx } from 'clsx'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function currentYearMonth() {
  return new Date().toISOString().slice(0, 7)
}

function statusColor(pct: number) {
  if (pct >= 100) return { bar: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' }
  if (pct >= 80)  return { bar: 'bg-amber-400', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' }
  return { bar: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' }
}

export function ExpenseBudgetPanel({ categories }: { categories: string[] }) {
  const [budgets, setBudgets]       = useState<BudgetRow[]>([])
  const [actuals, setActuals]       = useState<BudgetVsActualRow[]>([])
  const [yearMonth, setYearMonth]   = useState(currentYearMonth())
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const [editId, setEditId]         = useState<string | null>(null)
  const [editCat, setEditCat]       = useState('')
  const [editAmt, setEditAmt]       = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [addCat, setAddCat]         = useState(categories[0] ?? '')
  const [addAmt, setAddAmt]         = useState('')
  const [saving, setSaving]         = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [b, a] = await Promise.all([
        budgetListAsync(),
        reportBudgetVsActualAsync(yearMonth),
      ])
      setBudgets(b); setActuals(a)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [yearMonth])

  const actualsMap = useMemo(() => {
    const m: Record<string, BudgetVsActualRow> = {}
    actuals.forEach((a) => { m[a.category] = a })
    return m
  }, [actuals])

  const totalBudget  = budgets.reduce((s, b) => s + b.monthlyAmount, 0)
  const totalActual  = actuals.reduce((s, a) => s + a.actual, 0)
  const overallPct   = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0

  const handleAdd = async () => {
    if (!addAmt || isNaN(Number(addAmt))) return
    setSaving(true)
    try {
      await budgetUpsertAsync(addCat, Number(addAmt))
      setShowAdd(false); setAddAmt(''); await load()
    } catch (e) { alert(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  const handleEditSave = async (id: string) => {
    if (!editAmt || isNaN(Number(editAmt))) return
    setSaving(true)
    try {
      await budgetUpsertAsync(editCat, Number(editAmt))
      setEditId(null); await load()
    } catch (e) { alert(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ลบงบหมวดนี้?')) return
    await budgetDeleteAsync(id); await load()
  }

  return (
    <div className="space-y-5">
      {/* Month picker + summary */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600">เดือน</label>
          <input type="month" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400" />
        </div>
        <button type="button" onClick={() => void load()} disabled={loading}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={clsx('size-3', loading && 'animate-spin')} />
        </button>
        <button type="button" onClick={() => setShowAdd(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
          <Plus className="size-3" />เพิ่มงบหมวด
        </button>
      </div>

      {loading && <p className="py-6 text-center text-sm text-slate-400">กำลังโหลด…</p>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</div>}

      {/* Overall KPI */}
      {!loading && budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white px-4 py-3.5 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">งบรวม/เดือน</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-900">฿{fmt(totalBudget)}</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white px-4 py-3.5 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wide text-rose-500">ใช้ไปแล้ว</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-rose-900">฿{fmt(totalActual)}</p>
          </div>
          <div className={clsx(
            'rounded-2xl border px-4 py-3.5 shadow-sm',
            overallPct >= 100 ? 'border-rose-200 bg-gradient-to-br from-rose-50 to-white'
              : overallPct >= 80 ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-white'
              : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
          )}>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">ใช้ไปแล้ว</p>
            <p className={clsx('mt-1 text-2xl font-bold tabular-nums', statusColor(overallPct).text)}>
              {overallPct.toFixed(1)}%
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className={clsx('h-full rounded-full transition-all', statusColor(overallPct).bar)}
                style={{ width: `${Math.min(100, overallPct)}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm">
          <h3 className="mb-3 text-xs font-semibold text-indigo-800">เพิ่มงบหมวดใหม่</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-slate-600">หมวด</label>
              <select value={addCat} onChange={(e) => setAddCat(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-slate-600">งบ/เดือน (฿)</label>
              <input type="number" min="0" step="100" value={addAmt}
                onChange={(e) => setAddAmt(e.target.value)} placeholder="0"
                className="w-32 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400" />
            </div>
            <button type="button" onClick={() => void handleAdd()} disabled={saving || !addAmt}
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              บันทึก
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Budget vs actual table */}
      {!loading && budgets.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold text-slate-700">งบ vs ค่าใช้จ่ายจริง</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 text-left">หมวด</th>
                  <th className="px-4 py-2 text-right">งบ/เดือน</th>
                  <th className="px-4 py-2 text-right">ใช้ไปแล้ว</th>
                  <th className="px-4 py-2 text-right">คงเหลือ</th>
                  <th className="w-28 px-4 py-2">% ใช้</th>
                  <th className="w-16 px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {budgets.map((b) => {
                  const a = actualsMap[b.category]
                  const actual = a?.actual ?? 0
                  const pct    = b.monthlyAmount > 0 ? (actual / b.monthlyAmount) * 100 : 0
                  const remaining = b.monthlyAmount - actual
                  const sc = statusColor(pct)
                  return editId === b.id ? (
                    <tr key={b.id} className="bg-indigo-50/40">
                      <td className="px-4 py-2 font-medium text-slate-900">{b.category}</td>
                      <td className="px-4 py-2" colSpan={3}>
                        <input type="number" min="0" step="100" value={editAmt}
                          onChange={(e) => setEditAmt(e.target.value)}
                          className="w-28 rounded-lg border border-indigo-300 bg-white px-2.5 py-1 text-xs outline-none focus:border-indigo-500" />
                      </td>
                      <td className="px-4 py-2" />
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => void handleEditSave(b.id)} disabled={saving}
                            className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50">
                            <Plus className="size-3" />
                          </button>
                          <button type="button" onClick={() => setEditId(null)}
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-2.5 font-medium text-slate-900">{b.category}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                        ฿{fmt(b.monthlyAmount)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-rose-700 font-medium">
                        ฿{fmt(actual)}
                      </td>
                      <td className={clsx('px-4 py-2.5 text-right tabular-nums font-medium', remaining >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                        {remaining >= 0 ? `฿${fmt(remaining)}` : `-฿${fmt(Math.abs(remaining))}`}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className={clsx('h-full rounded-full transition-all', sc.bar)}
                              style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                          <span className={clsx('w-10 shrink-0 text-right text-[10px] font-semibold tabular-nums', sc.text)}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <button type="button"
                            onClick={() => { setEditId(b.id); setEditCat(b.category); setEditAmt(String(b.monthlyAmount)) }}
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                            <Pencil className="size-3" />
                          </button>
                          <button type="button" onClick={() => void handleDelete(b.id)}
                            className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && budgets.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
          <p className="text-sm">ยังไม่มีงบประมาณ</p>
          <button type="button" onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700">
            <Plus className="size-3" />เพิ่มงบหมวดแรก
          </button>
        </div>
      )}
    </div>
  )
}
