import {
  CROSS_BRANCH_SORT_KEYS,
  CROSS_BRANCH_SORT_LABELS,
  DEFAULT_CROSS_BRANCH_SORT_RULES,
  type CrossBranchSortKey,
  type CrossBranchSortRule,
} from '@/features/inventory/data/crossBranchStockSort'
import { clsx } from 'clsx'
import { RotateCcw, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type Slot = { key: CrossBranchSortKey | ''; dir: 'asc' | 'desc' }

const emptySlots = (): [Slot, Slot, Slot] => [
  { key: '', dir: 'asc' },
  { key: '', dir: 'asc' },
  { key: '', dir: 'asc' },
]

function rulesToSlots(rules: CrossBranchSortRule[]): [Slot, Slot, Slot] {
  const s = emptySlots()
  rules.slice(0, 3).forEach((r, i) => {
    s[i] = { key: r.key, dir: r.dir }
  })
  return s
}

function slotsToRules(slots: [Slot, Slot, Slot]): CrossBranchSortRule[] {
  const seen = new Set<CrossBranchSortKey>()
  const out: CrossBranchSortRule[] = []
  for (const slot of slots) {
    if (!slot.key || seen.has(slot.key)) continue
    seen.add(slot.key)
    out.push({ key: slot.key, dir: slot.dir })
  }
  return out.length ? out : [...DEFAULT_CROSS_BRANCH_SORT_RULES]
}

type CrossBranchStockSortModalProps = {
  open: boolean
  onClose: () => void
  rules: CrossBranchSortRule[]
  onSave: (next: CrossBranchSortRule[]) => void
}

export function CrossBranchStockSortModal({
  open,
  onClose,
  rules,
  onSave,
}: CrossBranchStockSortModalProps) {
  const [slots, setSlots] = useState<[Slot, Slot, Slot]>(() => rulesToSlots(rules))

  useEffect(() => {
    if (open) setSlots(rulesToSlots(rules))
  }, [open, rules])

  if (!open) return null

  const selectClass =
    'w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300'

  function updateSlot(index: 0 | 1 | 2, patch: Partial<Slot>) {
    setSlots((prev) => {
      const next = [...prev] as [Slot, Slot, Slot]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="ปิด" onClick={onClose} />
      <div
        role="dialog"
        aria-labelledby="cross-branch-sort-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 id="cross-branch-sort-title" className="text-lg font-semibold text-slate-900">
              จัดเรียงสต็อกข้ามคลัง (ลำดับ 1 → 2 → 3)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              หรือคลิกที่หัวคอลัมน์ในตารางเพื่อเรียงด่วน
            </p>
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

        <div className="space-y-3">
          {([0, 1, 2] as const).map((i) => (
            <div
              key={i}
              className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-800">
                {i + 1}
              </span>
              <label className="min-w-0 flex-1">
                <span className="mb-0.5 block text-xs text-slate-500">เรียงตาม</span>
                <select
                  className={selectClass}
                  value={slots[i].key}
                  onChange={(e) =>
                    updateSlot(i, { key: e.target.value as CrossBranchSortKey | '' })
                  }
                >
                  <option value="">ไม่ใช้</option>
                  {CROSS_BRANCH_SORT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {CROSS_BRANCH_SORT_LABELS[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="w-28 shrink-0">
                <span className="mb-0.5 block text-xs text-slate-500">ทิศทาง</span>
                <select
                  className={selectClass}
                  value={slots[i].dir}
                  disabled={!slots[i].key}
                  onChange={(e) =>
                    updateSlot(i, { dir: e.target.value as 'asc' | 'desc' })
                  }
                >
                  <option value="asc">น้อย → มาก</option>
                  <option value="desc">มาก → น้อย</option>
                </select>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setSlots(rulesToSlots(DEFAULT_CROSS_BRANCH_SORT_RULES))}
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
              onClick={() => {
                onSave(slotsToRules(slots))
                onClose()
              }}
              className={clsx(
                'rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800',
              )}
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
