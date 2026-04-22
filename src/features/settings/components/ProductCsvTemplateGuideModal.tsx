import { BookOpen, X } from 'lucide-react'
import { useId } from 'react'

type ProductCsvTemplateGuideModalProps = {
  open: boolean
  onClose: () => void
}

const mono = 'rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-slate-800'

export function ProductCsvTemplateGuideModal({ open, onClose }: ProductCsvTemplateGuideModalProps) {
  const titleId = useId()

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[min(92vh,36rem)] w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-violet-200 bg-violet-50 text-violet-800">
              <BookOpen className="size-4" strokeWidth={2} aria-hidden />
            </span>
            <h2 id={titleId} className="truncate text-base font-semibold text-slate-900">
              วิธีกรอกข้อมูลลงเทมเพลต CSV
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="ปิด"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="max-h-[min(calc(92vh-5rem),31rem)] space-y-3 overflow-y-auto px-4 py-3 text-sm leading-relaxed text-slate-700">
          <ol className="list-decimal space-y-2.5 pl-4 marker:font-medium marker:text-slate-500">
            <li>
              กด <strong className="font-medium text-slate-900">ดาวน์โหลดเทมเพลต</strong> แล้วเปิดไฟล์ใน Google Sheets หรือ Excel
              — แถวแรกคือ <strong className="font-medium text-slate-900">หัวคอลัมน์</strong> ห้ามลบหรือเปลี่ยนชื่อคอลัมน์
            </li>
            <li>
              แถวตัวอย่างลบได้ถ้าไม่ต้องการ — แต่ละแถวสินค้าต้องมีอย่างน้อย <span className={mono}>sku</span> หรือ{' '}
              <span className={mono}>name</span> (ถ้าไม่มี sku ระบบจะสร้างรหัสชั่วคราวให้)
            </li>
            <li>
              <span className={mono}>scheme</span> รูปแบบซื้อแถม เช่น <span className={mono}>10+1</span> หรือซื้อตรง{' '}
              <span className={mono}>1+0</span> — ถ้าเว้นว่างหรือใส่ขีดกลาง ระบบจะใช้ <span className={mono}>1+0</span> ตอนนำเข้า
            </li>
            <li>
              หลายค่าในช่องเดียวใช้เครื่องหมาย <span className={mono}>|</span> เช่น <span className={mono}>oemTags</span>,{' '}
              <span className={mono}>crossReferenceTags</span>, <span className={mono}>carModels</span>
            </li>
            <li>
              <span className={mono}>engineIds</span> ใส่รหัส variant จากเมนู <strong className="font-medium text-slate-900">จัดการรุ่นรถ</strong> คั่นด้วย{' '}
              <span className={mono}>|</span> — ผ้าเบรกต่อท้าย <span className={mono}>:front</span> หรือ{' '}
              <span className={mono}>:rear</span> หรือเว้นว่างแล้วใช้ <span className={mono}>vehicleFitmentsJson</span> จากไฟล์ส่งออก
            </li>
            <li>
              ราคาและตัวเลข: <span className={mono}>costPrice</span>, <span className={mono}>avgCost</span>,{' '}
              <span className={mono}>sellPrice</span>, <span className={mono}>supplierListPrice</span> เว้นได้ (นำเข้าเป็น 0)
            </li>
            <li>
              <span className={mono}>vatMode</span>: <span className={mono}>vat</span> = มี VAT,{' '}
              <span className={mono}>no_vat</span> = ไม่มี VAT (ถ้าเว้นว่าง ระบบใช้มี VAT)
            </li>
            <li>
              <span className={mono}>inStoreCatalog</span>: <span className={mono}>1</span> / ว่าง = ขายในร้าน,{' '}
              <span className={mono}>0</span> / <span className={mono}>ref</span> = อ้างอิงเท่านั้น —{' '}
              <span className={mono}>salesStatus</span>: ว่างหรือ <span className={mono}>active</span>,{' '}
              <span className={mono}>paused</span>, <span className={mono}>discontinued</span>
            </li>
            <li>
              คอลัมน์ที่ลงท้าย <span className={mono}>Json</span> เก็บโครงสร้างซับซ้อน — ถ้าไม่ถนัดแก้ใน Sheet ให้ส่งออก CSV จากโปรแกรม
              แล้วคัดลอกค่าจากแถวที่คล้ายกันมาแก้
            </li>
            <li>
              บันทึกเป็นไฟล์ <strong className="font-medium text-slate-900">.csv</strong> (แนะนำ UTF-8) แล้วกด{' '}
              <strong className="font-medium text-slate-900">นำเข้า CSV</strong> — การนำเข้าจะแทนที่แฟ้มสินค้าในเครื่องทั้งหมด
              ควรกด <strong className="font-medium text-slate-900">ส่งออก CSV</strong> สำรองก่อน
            </li>
          </ol>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/90 px-4 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 sm:w-auto"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  )
}
