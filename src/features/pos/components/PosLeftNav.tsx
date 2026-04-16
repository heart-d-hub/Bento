import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import { clsx } from 'clsx'

type PosLeftNavProps = {
  className?: string
}

export function PosLeftNav({ className }: PosLeftNavProps) {
  const { openTab } = useWorkspaceTabs()

  const openTaxInvoicePage = () => {
    openTab('label-print', 'พิมพ์ป้ายสินค้า', { labelPrintTopSection: 'tax-invoice' })
  }

  return (
    <nav
      className={clsx(
        'flex w-full shrink-0 flex-col gap-4 border-b border-slate-200 pb-4 lg:w-52 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4',
        className,
      )}
      aria-label="เมนู POS"
    >
      <div className="space-y-1.5">
        <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">ขายหน้าร้าน</p>
        <button
          type="button"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-left text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-400"
        >
          ขายหน้าร้าน (POS)
        </button>
        <p className="px-1 text-[11px] leading-snug text-slate-500">
          บิลขาย / ใบเสร็จทั่วไป — ไม่ต้องใช้ใบกำกับภาษีเต็มรูปแบบ
        </p>
      </div>

      <div className="space-y-1.5 border-t border-slate-100 pt-4">
        <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">ใบกำกับภาษี</p>
        <button
          type="button"
          onClick={openTaxInvoicePage}
          className="w-full rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-3 text-left text-sm shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
        >
          <span className="block font-semibold text-amber-950">ออกใบกำกับภาษีขาย</span>
          <span className="mt-1 block text-[11px] font-normal leading-snug text-amber-900/80">
            เปิดหน้าออกแบบฟอร์มใบกำกับ — เลขบิลจริงเชื่อม POS เมื่อมี backend
          </span>
        </button>
      </div>

      <div className="space-y-1.5 border-t border-slate-100 pt-4">
        <button
          type="button"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          ใบสั่งจัด / ใบเสนอราคา
        </button>
        <p className="px-1 text-xs text-slate-500">ขายด่วน</p>
      </div>
    </nav>
  )
}
