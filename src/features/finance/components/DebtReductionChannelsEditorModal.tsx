import {
  DEFAULT_DEBT_REDUCTION_CHANNELS,
  loadDebtReductionChannels,
  saveDebtReductionChannels,
} from '@/features/finance/data/debtReductionChannelsStore'
import { clsx } from 'clsx'
import { ListChecks, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type DebtReductionChannelsEditorModalProps = {
  open: boolean
  onClose: () => void
}

export function DebtReductionChannelsEditorModal({ open, onClose }: DebtReductionChannelsEditorModalProps) {
  const [rows, setRows] = useState<string[]>(() => [...DEFAULT_DEBT_REDUCTION_CHANNELS])

  useEffect(() => {
    if (!open) return
    setRows(loadDebtReductionChannels())
  }, [open])

  if (!open) return null

  const save = () => {
    saveDebtReductionChannels(rows)
    onClose()
  }

  const resetDefaults = () => {
    if (!window.confirm('คืนค่าเป็นชุดตั้งต้นของโปรแกรม?')) return
    setRows([...DEFAULT_DEBT_REDUCTION_CHANNELS])
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
              <ListChecks className="size-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">ช่องทางลดหนี้</h2>
              <p className="text-[11px] text-slate-500">
                ใช้เลือกตอนบันทึกจ่ายเจ้าหนี้ / รับชำระลูกหนี้ และในใบสั่งซื้อ (ชำระแล้ว)
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="ปิด">
            <X className="size-5" />
          </button>
        </div>

        <p className="mb-2 text-[11px] leading-snug text-slate-600">
          แก้ชื่อหรือเพิ่มรายการให้ตรงกับวิธีที่ร้านใช้จริง (เก็บในเครื่องนี้)
        </p>

        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={`dr-${idx}`} className="flex gap-2">
              <input
                value={row}
                onChange={(e) => setRows((prev) => prev.map((r, i) => (i === idx ? e.target.value : r)))}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="ชื่อช่องทาง"
              />
              {rows.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                  className="shrink-0 rounded-lg border border-rose-200 bg-white px-2 py-2 text-rose-700 hover:bg-rose-50"
                  aria-label="ลบรายการ"
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, ''])}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <Plus className="size-3.5" aria-hidden />
          เพิ่มช่องทาง
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={resetDefaults}
            className={clsx('text-xs font-medium text-slate-600 underline-offset-2 hover:underline')}
          >
            คืนค่าเริ่มต้น
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
