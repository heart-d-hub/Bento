import { saleVoidAsync } from '@/features/pos/data/saleAdjustmentsDb'
import type { PosSaleRecord } from '@/features/pos/data/posSalesHistory'
import { clsx } from 'clsx'
import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

type Props = {
  bill: PosSaleRecord
  onClose: () => void
  onVoided: () => void
}

export function SaleVoidModal({ bill, onClose, onVoided }: Props) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const billDate = new Date(bill.at)
  const today = new Date()
  const isOldBill =
    billDate.getFullYear() !== today.getFullYear() ||
    billDate.getMonth() !== today.getMonth() ||
    billDate.getDate() !== today.getDate()

  const handleConfirm = async () => {
    setBusy(true)
    setError(null)
    try {
      await saleVoidAsync(bill.id, reason.trim() || undefined)
      onVoided()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[350] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <AlertTriangle className="size-4 text-rose-500" />
            ยกเลิกบิล
          </h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs">
            <p className="font-mono font-bold text-slate-800">{bill.billNo}</p>
            <p className="mt-0.5 text-slate-500">
              {billDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
              {' · '}
              <span className="font-semibold text-slate-700">
                {bill.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
              </span>
            </p>
          </div>

          {isOldBill && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              บิลนี้ไม่ใช่บิลวันนี้ — ยืนยันว่าต้องการยกเลิกย้อนหลัง
            </div>
          )}

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              เหตุผล
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุเหตุผล (ไม่บังคับ)"
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={clsx(
              'rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-50',
              'bg-rose-600 hover:bg-rose-700',
            )}
          >
            {busy ? 'กำลังดำเนินการ…' : 'ยืนยันยกเลิกบิล'}
          </button>
        </div>
      </div>
    </div>
  )
}
