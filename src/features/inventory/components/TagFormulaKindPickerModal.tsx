import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

export type TagFormulaKindPickerChoice = 'stl-ladder'

type TagFormulaKindPickerModalProps = {
  open: boolean
  onClose: () => void
  /** เมื่อเลือกชนิดแล้วกดดำเนินการ */
  onPick: (kind: TagFormulaKindPickerChoice) => void
}

/**
 * เลือกชนิดสูตรก่อนเปิดโมดัลตั้งค่า — ตอนนี้มีแค่ «ราคาขั้นบันได» (โปร STL)
 * เพิ่มชนิดอื่นได้โดยขยาย TagFormulaKindPickerChoice + UI ด้านล่าง
 */
export function TagFormulaKindPickerModal({ open, onClose, onPick }: TagFormulaKindPickerModalProps) {
  const [ladderChecked, setLadderChecked] = useState(false)

  useEffect(() => {
    if (!open) setLadderChecked(false)
  }, [open])

  if (!open) return null

  const canContinue = ladderChecked

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tag-formula-kind-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 id="tag-formula-kind-title" className="text-sm font-semibold text-slate-900">
            เพิ่มสูตร — เลือกชนิด
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
            aria-label="ปิด"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-slate-600">
          เลือกชนิดสูตรที่ต้องการสร้าง จากนั้นจะเปิดหน้าตั้งค่ารายละเอียด — ภายหลังสามารถเพิ่มชนิดอื่นในรายการด้านล่างได้
        </p>

        <ul className="space-y-2">
          <li>
            <label
              className={clsx(
                'flex cursor-pointer gap-2.5 rounded-lg border p-2.5 transition',
                ladderChecked
                  ? 'border-violet-300 bg-violet-50/80 ring-1 ring-violet-200/80'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50',
              )}
            >
              <input
                type="checkbox"
                checked={ladderChecked}
                onChange={(e) => setLadderChecked(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="min-w-0">
                <span className="block text-[12px] font-semibold text-slate-900">ราคาขั้นบันได</span>
                <span className="mt-0.5 block text-[10px] leading-snug text-slate-600">
                  นอต STLใช้กำหนด % ลดแบบหลายขั้น
                </span>
              </span>
            </label>
          </li>
          <li>
            <div className="flex gap-2.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/30 p-2.5 opacity-70">
              <input type="checkbox" disabled className="mt-0.5 size-4 shrink-0 cursor-not-allowed rounded border-slate-300" />
              <span className="min-w-0">
                <span className="block text-[12px] font-medium text-slate-500">สูตรอื่น</span>
                <span className="mt-0.5 block text-[10px] text-slate-400">เพิ่มในอัปเดตถัดไป</span>
              </span>
            </div>
          </li>
        </ul>

        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => {
              if (!canContinue) return
              onPick('stl-ladder')
            }}
            className={clsx(
              'rounded-lg px-3 py-1.5 text-xs font-medium text-white',
              canContinue ? 'bg-violet-600 hover:bg-violet-700' : 'cursor-not-allowed bg-slate-300',
            )}
          >
            ถัดไป — ตั้งค่าสูตร
          </button>
        </div>
      </div>
    </div>
  )
}
