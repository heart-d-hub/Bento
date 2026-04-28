import { clsx } from 'clsx'
import { ClipboardList } from 'lucide-react'

type Props = { className?: string }

export function CustomerOrderWorkspacePage({ className }: Props) {
  return (
    <div className={clsx('flex min-h-0 flex-1 flex-col', className)}>
      <header className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <ClipboardList className="size-5 text-teal-600" aria-hidden />
        <div>
          <h1 className="text-sm font-bold text-slate-900">สั่งสินค้าให้ลูกค้า</h1>
          <p className="text-[11px] text-slate-500">บันทึกรายการสั่งพิเศษ / Backorder ให้ลูกค้า</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex size-20 items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white">
          <ClipboardList className="size-9 text-slate-300" strokeWidth={1} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-600">ฟีเจอร์กำลังพัฒนา</p>
          <p className="mt-1 text-xs text-slate-400">
            ใช้สำหรับบันทึกรายการสินค้าที่ลูกค้าสั่งพิเศษ (Backorder)
            <br />
            ระบบจะช่วยติดตามสถานะและแจ้งเมื่อของมาถึง
          </p>
        </div>
      </div>
    </div>
  )
}
