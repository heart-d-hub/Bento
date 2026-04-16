import { usePosCart } from '@/features/pos/context/PosCartContext'
import { clsx } from 'clsx'

type PosCheckoutPanelProps = {
  className?: string
}

function formatMoney(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function PosCheckoutPanel({ className }: PosCheckoutPanelProps) {
  const { lineCount, subtotal, discountTotal, grandTotal } = usePosCart()

  return (
    <aside
      className={clsx(
        'flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white/95 shadow-md shadow-slate-200/30 backdrop-blur-sm',
        className,
      )}
      aria-label="ชำระเงิน (New)"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/80 bg-gradient-to-r from-slate-50/90 to-white px-2.5 py-2.5">
        <h2 className="text-sm font-semibold text-slate-900">ชำระเงิน (หน้าใหม่)</h2>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {lineCount} รายการ
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="space-y-1 text-xs text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">รวมย่อย</span>
            <span className="tabular-nums">฿{formatMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">ส่วนลด</span>
            <span className="tabular-nums">฿{formatMoney(discountTotal)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-slate-900">
            <span>ยอดรวมสุทธิ</span>
            <span className="tabular-nums">฿{formatMoney(grandTotal)}</span>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-[11px] text-slate-600">
          ปุ่มยืนยันชำระเงิน/เลือกวิธีจ่าย จะทำในขั้นถัดไป
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-3">
        <button
          id="pos-confirm-sale"
          type="button"
          disabled={lineCount < 1 || grandTotal <= 0}
          className="w-full rounded-lg border border-slate-300 bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ยืนยันการขาย (ยังไม่พร้อม)
        </button>
      </div>
    </aside>
  )
}
