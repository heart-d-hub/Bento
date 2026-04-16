import {
  DEFAULT_INVENTORY_COLUMN_VISIBILITY,
  INVENTORY_COLUMN_LABELS,
  INVENTORY_COLUMN_ORDER,
  type InventoryColumnKey,
} from '@/features/inventory/data/inventoryColumns'
import { clsx } from 'clsx'
import { RotateCcw, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type InventoryColumnSettingsModalProps = {
  open: boolean
  onClose: () => void
  visibility: Record<InventoryColumnKey, boolean>
  onSave: (next: Record<InventoryColumnKey, boolean>) => void
}

export function InventoryColumnSettingsModal({
  open,
  onClose,
  visibility,
  onSave,
}: InventoryColumnSettingsModalProps) {
  const [draft, setDraft] = useState<Record<InventoryColumnKey, boolean>>(visibility)

  useEffect(() => {
    if (open) setDraft({ ...visibility })
  }, [open, visibility])

  if (!open) return null

  function toggle(key: InventoryColumnKey) {
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const selectedCount = INVENTORY_COLUMN_ORDER.filter((k) => draft[k]).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="ปิด" onClick={onClose} />
      <div
        role="dialog"
        aria-labelledby="inv-col-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 id="inv-col-title" className="text-lg font-semibold text-slate-900">
              คอลัมน์ที่แสดงในรายงาน
            </h2>
            <p className="mt-1 text-xs text-slate-500">เลือกว่าต้องการแสดงฟิลด์ใดในตารางสินค้าคงคลัง</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="ปิด"
          >
            <X className="size-5" />
          </button>
        </div>

        <ul className="max-h-[min(60vh,22rem)] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {INVENTORY_COLUMN_ORDER.map((key) => (
            <li key={key}>
              <label
                className={clsx(
                  'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5',
                  draft[key] ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white',
                )}
              >
                <input
                  type="checkbox"
                  checked={draft[key]}
                  onChange={() => toggle(key)}
                  className="size-4 rounded border-slate-300 text-slate-900"
                />
                <span className="text-sm font-medium text-slate-800">{INVENTORY_COLUMN_LABELS[key]}</span>
              </label>
            </li>
          ))}
        </ul>

        {selectedCount === 0 && (
          <p className="mt-3 text-xs text-amber-700">ควรเลือกอย่างน้อย 1 คอลัมน์</p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setDraft({ ...DEFAULT_INVENTORY_COLUMN_VISIBILITY })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="size-4" />
            คืนค่าเริ่มต้น
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={() => {
                onSave(draft)
                onClose()
              }}
              className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
