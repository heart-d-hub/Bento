import type { VehicleCategoryDef } from '@/features/vehicle/data/types'
import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

type CategoryDisplaySettingsModalProps = {
  open: boolean
  onClose: () => void
  allCategories: VehicleCategoryDef[]
  visibleIds: Set<string>
  onSave: (next: Set<string>) => void
}

export function CategoryDisplaySettingsModal({
  open,
  onClose,
  allCategories,
  visibleIds,
  onSave,
}: CategoryDisplaySettingsModalProps) {
  const [draft, setDraft] = useState<Set<string>>(visibleIds)

  useEffect(() => {
    if (open) setDraft(new Set(visibleIds))
  }, [open, visibleIds])

  if (!open) return null

  const sorted = [...allCategories].sort((a, b) => a.sortOrder - b.sortOrder)

  function toggle(id: string) {
    setDraft((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="ปิด"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="cat-settings-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 id="cat-settings-title" className="text-lg font-semibold text-slate-900">
            ตั้งค่าประเภทที่แสดง
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="ปิด"
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="mb-3 text-sm text-slate-500">
          เลือกประเภทที่ต้องการให้แสดงเป็นแท็บด้านบนหน้าค้นหา (เก็บในเครื่องนี้จนกว่าจะต่อ API)
        </p>
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {sorted.map((c) => (
            <li key={c.id}>
              <label
                className={clsx(
                  'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5',
                  draft.has(c.id) ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white',
                )}
              >
                <input
                  type="checkbox"
                  checked={draft.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="size-4 rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-800">{c.label}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draft)
              onClose()
            }}
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  )
}
