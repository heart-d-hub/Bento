import { DEFAULT_EXPENSE_CATEGORIES } from '@/features/report/data/expensesDb'
import { clsx } from 'clsx'
import { Check, Lock, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'

type Props = {
  customCategories: string[]
  onChange: (next: string[]) => void
}

export function ExpenseCategoryPanel({ customCategories, onChange }: Props) {
  const [showAdd, setShowAdd]   = useState(false)
  const [addInput, setAddInput] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [editIdx, setEditIdx]   = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  const allNames = new Set([...DEFAULT_EXPENSE_CATEGORIES, ...customCategories])

  const handleAdd = () => {
    const name = addInput.trim()
    if (!name) return
    if (allNames.has(name)) { setAddError('มีหมวดนี้อยู่แล้ว'); return }
    onChange([...customCategories, name])
    setAddInput(''); setAddError(null); setShowAdd(false)
  }

  const handleDelete = (idx: number) => {
    onChange(customCategories.filter((_, i) => i !== idx))
    if (editIdx === idx) setEditIdx(null)
  }

  const startEdit = (idx: number) => {
    setEditIdx(idx); setEditValue(customCategories[idx])
  }

  const handleEditSave = (idx: number) => {
    const name = editValue.trim()
    if (!name) return
    const conflict = [...DEFAULT_EXPENSE_CATEGORIES, ...customCategories.filter((_, i) => i !== idx)].includes(name)
    if (conflict) return
    onChange(customCategories.map((c, i) => (i === idx ? name : c)))
    setEditIdx(null)
  }

  const allCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...customCategories]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">หมวดหมู่ค่าใช้จ่าย</h2>
          <p className="text-xs text-slate-500">{allCategories.length} หมวด · หมวดเริ่มต้นแก้ไขไม่ได้</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowAdd(true); setEditIdx(null); setAddInput(''); setAddError(null) }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="size-3.5" />เพิ่มหมวด
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              <th className="w-8 px-3 py-2 text-right text-slate-300">#</th>
              <th className="px-3 py-2 text-left">ชื่อหมวด</th>
              <th className="px-3 py-2 text-left">ประเภท</th>
              <th className="w-16 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">

            {/* Inline add row */}
            {showAdd && (
              <tr className="bg-indigo-50/50">
                <td className="px-3 py-2 text-right text-[10px] text-slate-300">
                  {allCategories.length + 1}
                </td>
                <td className="px-3 py-2" colSpan={2}>
                  <div className="flex flex-col gap-1">
                    <input
                      autoFocus
                      type="text"
                      value={addInput}
                      onChange={(e) => { setAddInput(e.target.value); setAddError(null) }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd()
                        if (e.key === 'Escape') setShowAdd(false)
                      }}
                      placeholder="ชื่อหมวดใหม่"
                      className={clsx(
                        'w-full max-w-xs rounded-lg border bg-white px-2.5 py-1.5 text-xs outline-none',
                        addError ? 'border-rose-400' : 'border-indigo-300 focus:border-indigo-500',
                      )}
                    />
                    {addError && <p className="text-[10px] text-rose-600">{addError}</p>}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={!addInput.trim()}
                      className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAdd(false)}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Default categories */}
            {DEFAULT_EXPENSE_CATEGORIES.map((c, i) => (
              <tr key={c} className="text-slate-500">
                <td className="px-3 py-2.5 text-right text-[10px] text-slate-300">{i + 1}</td>
                <td className="px-3 py-2.5 font-medium text-slate-700">{c}</td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                    <Lock className="size-2.5" />ค่าเริ่มต้น
                  </span>
                </td>
                <td className="px-3 py-2.5" />
              </tr>
            ))}

            {/* Custom categories */}
            {customCategories.map((c, i) => {
              const rowNum = DEFAULT_EXPENSE_CATEGORIES.length + i + 1
              return (
                <tr key={i} className="hover:bg-slate-50/80">
                  <td className="px-3 py-2.5 text-right text-[10px] text-slate-300">{rowNum}</td>
                  {editIdx === i ? (
                    <td className="px-3 py-2" colSpan={2}>
                      <input
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave(i)
                          if (e.key === 'Escape') setEditIdx(null)
                        }}
                        className="w-full max-w-xs rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-2.5 font-medium text-slate-800">{c}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-600">
                          กำหนดเอง
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      {editIdx === i ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEditSave(i)}
                            disabled={!editValue.trim()}
                            className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
                          >
                            <Check className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditIdx(null)}
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                          >
                            <X className="size-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => { startEdit(i); setShowAdd(false) }}
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(i)}
                            className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}

            {/* Empty state for custom */}
            {!showAdd && customCategories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-5 text-center text-xs text-slate-400">
                  ยังไม่มีหมวดที่กำหนดเอง —{' '}
                  <button
                    type="button"
                    onClick={() => setShowAdd(true)}
                    className="text-indigo-500 underline underline-offset-2 hover:text-indigo-700"
                  >
                    เพิ่มหมวดแรก
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
