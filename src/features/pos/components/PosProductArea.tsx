import { clsx } from 'clsx'
import { Search } from 'lucide-react'
import { useState } from 'react'

type PosProductAreaProps = {
  className?: string
}

export function PosProductArea({ className }: PosProductAreaProps) {
  const [query, setQuery] = useState('')

  return (
    <section
      className={clsx(
        'flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white/95 shadow-md shadow-slate-200/30 backdrop-blur-sm',
        className,
      )}
      aria-label="POS (New)"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/80 bg-gradient-to-r from-slate-50/90 to-white px-2.5 py-2.5">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-900">POS (หน้าใหม่)</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            ลบ UI เก่าแล้ว — โครงหน้าใหม่พร้อมให้ทยอยต่อฟังก์ชันเดิมกลับเข้ามา
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <label htmlFor="pos-product-search" className="mb-1 block text-[11px] font-medium text-slate-600">
          ค้นหาสินค้า
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            id="pos-product-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="สแกนบาร์โค้ด · SKU · ชื่อ · รุ่นรถ · OEM..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            autoComplete="off"
          />
        </div>

        <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-[11px] text-slate-600">
          <p className="font-medium text-slate-700">ของที่จะย้ายกลับเข้าหน้านี้</p>
          <ul className="mt-1 list-disc pl-4">
            <li>ฟิลเตอร์อัจฉริยะ (เช่น รุ่นรถ) ตอนค้นหา</li>
            <li>โปร “+หัวน็อต / แถมแหวน”</li>
            <li>ขายแบบม้วน + ปุ่ม “เปิดม้วนเต็ม (FIFO)”</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
