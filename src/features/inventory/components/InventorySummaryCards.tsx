import {
  INVENTORY_ACTIVITIES,
  INVENTORY_SUMMARY,
  LOW_STOCK_HIGHLIGHTS,
} from '@/features/inventory/data/mockInventory'
import { PRODUCT_MASTER_LIST_CHANGED_EVENT } from '@/features/inventory/data/productMasterData'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { clsx } from 'clsx'
import { Package } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

function MiniSpark() {
  return (
    <svg viewBox="0 0 48 20" className="h-5 w-16 text-slate-300" aria-hidden>
      <path
        d="M0 14 L8 10 L16 12 L24 6 L32 9 L40 4 L48 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function InventorySummaryCards() {
  const [masterTick, setMasterTick] = useState(0)

  useEffect(() => {
    const h = () => setMasterTick((n) => n + 1)
    window.addEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, h)
    return () => window.removeEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, h)
  }, [])

  const totalSkus = useMemo(() => getPosCatalogProducts().length, [masterTick])

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">ภาพรวมสต็อก</h3>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl font-semibold tabular-nums text-slate-900">
              {totalSkus.toLocaleString('th-TH')}
            </p>
            <p className="text-xs text-slate-500">รายการ SKU</p>
          </div>
          <MiniSpark />
        </div>
        <div className="mt-4 flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
          <div>
            <p className="text-xl font-semibold tabular-nums text-slate-900">
              {INVENTORY_SUMMARY.totalValueBaht.toLocaleString('th-TH')} ฿
            </p>
            <p className="text-xs text-slate-500">มูลค่าสต็อกโดยประมาณ</p>
          </div>
          <MiniSpark />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">สินค้าสต็อกต่ำ</h3>
        <ul className="mt-3 space-y-2">
          {LOW_STOCK_HIGHLIGHTS.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-2"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-200/80 text-slate-500">
                <Package className="size-5" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-slate-500">{item.sku}</p>
                <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                <p className="text-xs text-rose-600">
                  Stock: {item.current}/{item.min}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Reorder
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">การเคลื่อนไหวล่าสุด</h3>
        <ul className="relative mt-3 space-y-0 border-l border-slate-200 pl-4">
          {INVENTORY_ACTIVITIES.map((a) => (
            <li key={a.id} className={clsx('relative pb-4 last:pb-0')}>
              <span
                className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-white bg-slate-400"
                aria-hidden
              />
              <p className="text-sm text-slate-700">{a.text}</p>
              <p className="text-xs text-slate-400">{a.time}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
