import { clsx } from 'clsx'

export function PosTaxInvoiceSaleWorkspace({ className }: { className?: string }) {
  return (
    <section
      className={clsx(
        'flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white/95 shadow-md shadow-slate-200/30 backdrop-blur-sm',
        className,
      )}
      aria-label="Tax Invoice (New)"
    >
      <div className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50/90 to-white px-3 py-2.5">
        <h2 className="text-sm font-semibold text-slate-900">TAX / ใบกำกับภาษี (หน้าใหม่)</h2>
        <p className="mt-0.5 text-[11px] text-slate-500">ลบหน้าจอเดิมแล้ว — จะเริ่มทำใหม่จากศูนย์</p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-[11px] text-slate-600">
          <ul className="list-disc pl-4">
            <li>ลูกค้า/ที่อยู่/เลขผู้เสียภาษี</li>
            <li>โหมด VAT + เลขที่เอกสาร</li>
            <li>พิมพ์เอกสาร</li>
          </ul>
        </div>
      </div>
    </section>
  )
}