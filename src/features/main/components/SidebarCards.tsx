import { getCashOnHandBaht } from '@/features/main/data/dashboardCashOnHand'
import {
  loadDashboardPreferences,
  type DashboardPreferences,
} from '@/features/main/data/dashboardPreferences'
import { useDashboardSnapshot } from '@/features/main/hooks/useDashboardSnapshot'
import { AlertTriangle, Banknote, LayoutList, Wallet, type LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

type SidebarCardsProps = {
  className?: string
}

function formatBaht(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function SidebarCard({
  title,
  icon: Icon,
  iconClassName,
  children,
}: {
  title: string
  icon: LucideIcon
  iconClassName: string
  children?: ReactNode
}) {
  return (
    <section
      className={clsx(
        'flex min-h-[9rem] flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:min-h-[10rem] sm:p-5 pos-compact:min-h-[8rem] pos-compact:p-3.5 pos-compact:sm:min-h-[8.5rem] pos-compact:sm:p-4',
      )}
    >
      <div className="mb-2 flex items-center gap-3 text-slate-800 pos-compact:mb-1.5 pos-compact:gap-2">
        <span
          className={clsx(
            'flex size-11 items-center justify-center rounded-xl border sm:size-12 pos-compact:size-10 pos-compact:sm:size-11',
            iconClassName,
          )}
        >
          <Icon
            className="size-[1.375rem] sm:size-6 pos-compact:size-5"
            strokeWidth={1.75}
            aria-hidden
          />
        </span>
        <h2 className="text-base font-semibold leading-snug pos-compact:text-sm">{title}</h2>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-1.5 text-sm text-slate-600 leading-relaxed pos-compact:text-xs">
        {children ?? <span className="opacity-70">—</span>}
      </div>
    </section>
  )
}

export function SidebarCards({ className }: SidebarCardsProps) {
  const { topProducts, lowStock, today } = useDashboardSnapshot()
  const [prefs, setPrefs] = useState<DashboardPreferences>(() => loadDashboardPreferences())
  const [cashBaht, setCashBaht] = useState(() => getCashOnHandBaht())

  useEffect(() => {
    const refreshPrefs = () => setPrefs(loadDashboardPreferences())
    const refreshCash = () => setCashBaht(getCashOnHandBaht())
    window.addEventListener('bento-dashboard-prefs-changed', refreshPrefs)
    window.addEventListener('bento-dashboard-cash-changed', refreshCash)
    return () => {
      window.removeEventListener('bento-dashboard-prefs-changed', refreshPrefs)
      window.removeEventListener('bento-dashboard-cash-changed', refreshCash)
    }
  }, [])

  return (
    <aside
      className={clsx(
        'flex w-full shrink-0 flex-col gap-3 sm:gap-3.5 pos-compact:gap-2 pos-narrow:lg:w-[17.5rem] pos-narrow:lg:max-w-[17.5rem] lg:w-72 lg:max-w-72 xl:w-[20rem] xl:max-w-[20rem]',
        className,
      )}
    >
      {prefs.showTopProducts ? (
        <SidebarCard title="สินค้าขายดี (POS)" icon={LayoutList} iconClassName="border-slate-200 bg-slate-50 text-slate-600">
          {topProducts.length === 0 ? (
            <span className="text-slate-500">ยังไม่มีข้อมูลรายการสินค้า — ขายผ่าน POS แล้วจะสะสมที่นี่</span>
          ) : (
            <ul className="space-y-1 text-sm pos-compact:text-xs">
              {topProducts.map((row, i) => (
                <li key={`${row.name}-${i}`} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate text-slate-700">{row.name}</span>
                  <span className="shrink-0 tabular-nums text-slate-600">{row.qty} ชิ้น</span>
                </li>
              ))}
            </ul>
          )}
        </SidebarCard>
      ) : null}

      {prefs.showLowStock ? (
        <SidebarCard title="สต็อกใกล้หมด" icon={AlertTriangle} iconClassName="border-slate-200 bg-slate-50 text-slate-600">
          {lowStock.length === 0 ? (
            <span className="text-slate-500">ไม่มีรายการต่ำกว่าขั้นต่ำ (ตามสต็อก POS)</span>
          ) : (
            <ul className="space-y-1">
              {lowStock.map((row) => (
                <li key={row.id} className="min-w-0">
                  <p
                    className="truncate text-sm font-medium text-slate-800 pos-compact:text-xs"
                    title={`${row.name} · เหลือ ${row.current} / ขั้นต่ำ ${row.min} (${row.sku})`}
                  >
                    {row.name}
                    <span className="font-normal tabular-nums text-slate-500">
                      {' '}
                      · เหลือ {row.current}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SidebarCard>
      ) : null}

      {prefs.showTodaySales ? (
        <SidebarCard title="ยอดขายวันนี้" icon={Banknote} iconClassName="border-slate-200 bg-slate-50 text-slate-600">
          <div>
            <p className="text-xl font-semibold tabular-nums text-slate-900 pos-compact:text-lg">{formatBaht(today.totalBaht)} บาท</p>
            <p className="mt-0.5 text-xs text-slate-500 pos-compact:text-[11px]">{today.count} บิล — ข้อมูลในเครื่อง</p>
          </div>
        </SidebarCard>
      ) : null}

      {prefs.showCashOnHand ? (
        <SidebarCard title="เงินสดในเก๊ะ" icon={Wallet} iconClassName="border-slate-200 bg-slate-50 text-slate-600">
          <div>
            <p className="text-xl font-semibold tabular-nums text-slate-900 pos-compact:text-lg">{formatBaht(cashBaht)} บาท</p>
            <p className="mt-0.5 text-xs text-slate-500 pos-compact:text-[11px]">Cash on hand — ปรับยอดในหน้า Dashboard</p>
          </div>
        </SidebarCard>
      ) : null}

      {!prefs.showTopProducts && !prefs.showLowStock && !prefs.showTodaySales && !prefs.showCashOnHand ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] text-slate-500">
          ปิดการ์ดสรุปทั้งหมดไว้ — เปิดจากไทล์ &quot;Dashboard&quot; ในเมนู Bento
        </p>
      ) : null}
    </aside>
  )
}
