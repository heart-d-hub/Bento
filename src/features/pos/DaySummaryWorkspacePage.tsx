import { getPaymentMethodLabel } from '@/features/pos/data/posPaymentMethodLabels'
import type { PaymentMethodId } from '@/features/pos/data/placeholders'
import {
  getTodaySalesSummary,
  loadRecentSales,
  POS_SALE_RECORDED_EVENT,
} from '@/features/pos/data/posSalesHistory'
import { clsx } from 'clsx'
import { Banknote } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type DaySummaryWorkspacePageProps = {
  className?: string
}

function formatBaht(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function isSameLocalDay(iso: string, ref: Date): boolean {
  const d = new Date(iso)
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  )
}

export function DaySummaryWorkspacePage({ className }: DaySummaryWorkspacePageProps) {
  const today = useMemo(() => new Date(), [])
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const onSale = () => setTick((t) => t + 1)
    window.addEventListener(POS_SALE_RECORDED_EVENT, onSale)
    return () => window.removeEventListener(POS_SALE_RECORDED_EVENT, onSale)
  }, [])

  const { count, totalBaht } = getTodaySalesSummary(today)

  const byPayment = useMemo(() => {
    const map = new Map<PaymentMethodId, number>()
    for (const s of loadRecentSales()) {
      if (!isSameLocalDay(s.at, today)) continue
      map.set(s.paymentId, (map.get(s.paymentId) ?? 0) + s.total)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [today, tick])

  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      <header className="shrink-0 border-b border-slate-200 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
            <Banknote className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h1 className="text-sm font-semibold text-slate-900">สรุปยอดสิ้นวัน</h1>
            <p className="text-[11px] text-slate-500">
              วันที่ {today.toLocaleDateString('th-TH', { dateStyle: 'long' })} — ข้อมูลในเครื่อง
            </p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">จำนวนบิลวันนี้</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{count}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-800/80">ยอดขายรวมวันนี้</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-950">{formatBaht(totalBaht)} บาท</p>
          </div>
        </div>

        {count > 0 && (
          <div>
            <h2 className="mb-2 text-xs font-semibold text-slate-700">แยกตามช่องทางชำระ</h2>
            <ul className="space-y-2 rounded-xl border border-slate-200/80 bg-white p-3">
              {byPayment.map(([id, baht]) => (
                <li
                  key={id}
                  className="flex items-center justify-between gap-2 text-xs text-slate-800"
                >
                  <span>{getPaymentMethodLabel(id)}</span>
                  <span className="tabular-nums font-medium">{formatBaht(baht)} บาท</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {count === 0 && (
          <p className="text-sm text-slate-500">ยังไม่มียอดขายในวันนี้ (ตามเวลาเครื่อง)</p>
        )}
      </div>
    </div>
  )
}
