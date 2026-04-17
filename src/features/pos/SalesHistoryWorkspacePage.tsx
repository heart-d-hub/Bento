import { getPaymentMethodLabel } from '@/features/pos/data/posPaymentMethodLabels'
import {
  loadRecentSales,
  POS_SALE_RECORDED_EVENT,
  type PosSaleRecord,
} from '@/features/pos/data/posSalesHistory'
import { loadPosSalesHistoryAsync } from '@/features/pos/data/posSalesDb'
import { getPosSaleByBillNoAsync } from '@/features/pos/data/posSalesDb'
import { MOCK_POS_SALES_HISTORY } from '@/features/pos/data/mockPosSalesHistory'
import { printPosReceipt } from '@/features/pos/utils/posPrintReceipt'
import { clsx } from 'clsx'
import { History, Printer, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type SalesHistoryWorkspacePageProps = {
  className?: string
}

function formatBaht(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function SalesHistoryWorkspacePage({ className }: SalesHistoryWorkspacePageProps) {
  const [storedRows, setStoredRows] = useState<PosSaleRecord[]>(() => loadRecentSales())
  const [dbRows, setDbRows] = useState<PosSaleRecord[] | null>(null)
  const [q, setQ] = useState('')
  const [payment, setPayment] = useState<'all' | string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isReprintLoading, setIsReprintLoading] = useState(false)

  const isDemoFallback = dbRows == null && storedRows.length === 0
  const rows = useMemo(
    () => (dbRows && dbRows.length > 0 ? dbRows : isDemoFallback ? MOCK_POS_SALES_HISTORY : storedRows),
    [dbRows, storedRows, isDemoFallback],
  )

  useEffect(() => {
    const refresh = () => {
      setStoredRows(loadRecentSales())
      void loadPosSalesHistoryAsync(200)
        .then((rowsFromDb) => {
          if (!rowsFromDb) {
            setDbRows(null)
            return
          }
          setDbRows(
            rowsFromDb.map((r) => ({
              id: r.id,
              billNo: r.billNo,
              at: r.at,
              total: r.total,
              paymentId: r.paymentId as PosSaleRecord['paymentId'],
              lineCount: r.lineCount,
              lines: r.lines,
            })),
          )
        })
        .catch(() => setDbRows(null))
    }
    refresh()
    window.addEventListener(POS_SALE_RECORDED_EVENT, refresh)
    return () => window.removeEventListener(POS_SALE_RECORDED_EVENT, refresh)
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (payment !== 'all' && r.paymentId !== payment) return false
      if (!term) return true
      const linesText = (r.lines ?? []).map((l) => `${l.sku ?? ''} ${l.name}`).join(' ')
      return (
        r.billNo.toLowerCase().includes(term) ||
        r.paymentId.toLowerCase().includes(term) ||
        linesText.toLowerCase().includes(term)
      )
    })
  }, [rows, q, payment])

  const totals = useMemo(() => {
    const count = filtered.length
    const baht = filtered.reduce((s, r) => s + r.total, 0)
    return { count, baht: Math.round(baht * 100) / 100 }
  }, [filtered])

  const selected = useMemo(
    () => (selectedId ? rows.find((r) => r.id === selectedId) ?? null : null),
    [rows, selectedId],
  )

  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      <header className="shrink-0 border-b border-slate-200 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
              <History className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">ประวัติการขาย (POS)</h1>
              <p className="text-[11px] text-slate-500">
                {isDemoFallback
                  ? 'แสดงตัวอย่าง — ยังไม่มีการขายจริงในเครื่องนี้ (บันทึกจริงเก็บได้สูงสุด 80 บิล)'
                  : dbRows
                    ? 'ข้อมูลจากฐานข้อมูล'
                    : 'ข้อมูลในเครื่อง — ล่าสุด 80 รายการ'}
                {' · '}
                ในมุมมองนี้ {totals.count} บิล · ฿{formatBaht(totals.baht)}
              </p>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
            <div className="relative min-w-[14rem] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาเลขบิล / สินค้า / SKU"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-2.5 text-xs shadow-sm outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-300"
              />
            </div>
            <select
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs shadow-sm"
            >
              <option value="all">ชำระทั้งหมด</option>
              {[...new Set(rows.map((r) => r.paymentId))].map((p) => (
                <option key={p} value={p}>
                  {getPaymentMethodLabel(p)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
        <details
          className={clsx(
            'mb-3 rounded-xl border px-3 py-2 text-xs',
            isDemoFallback
              ? 'border-amber-200/90 bg-amber-50/90 text-amber-950'
              : 'border-slate-200 bg-slate-50/90 text-slate-800',
          )}
        >
          <summary
            className={clsx(
              'cursor-pointer select-none font-semibold',
              isDemoFallback ? 'text-amber-950/95' : 'text-slate-800',
            )}
          >
            เก็บอะไรบ้างต่อ 1 บิล (localStorage key:{' '}
            <span className="font-mono font-normal">bento.pos.salesHistory.v1</span>)
          </summary>
          <ul
            className={clsx(
              'mt-2 list-inside list-disc space-y-1 pl-0.5 text-[11px] leading-relaxed',
              isDemoFallback ? 'text-amber-950/90' : 'text-slate-700',
            )}
          >
            <li>
              <span className="font-medium">id</span> — รหัสอ้างอิงภายใน (สร้างตอนบันทึกการขาย)
            </li>
            <li>
              <span className="font-medium">billNo</span> — เลขที่บิล POS (รูปแบบเช่น 1P69-000001)
            </li>
            <li>
              <span className="font-medium">at</span> — เวลาออกบิล (ISO string)
            </li>
            <li>
              <span className="font-medium">total</span> — ยอดรวมสุทธิ (บาท)
            </li>
            <li>
              <span className="font-medium">paymentId</span> — ช่องทางชำระ (cash / qr / credit / bill)
            </li>
            <li>
              <span className="font-medium">lineCount</span> — จำนวนรายการในรถเข็น (แถวสินค้า)
            </li>
            <li>
              <span className="font-medium">lines</span> — รายละเอียดแต่ละแถว: productId, sku, name, qty, unitPrice (บิลเก่าอาจไม่มี)
            </li>
          </ul>
        </details>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500">ยังไม่มีการบันทึกการขาย</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-3 py-2 font-medium">เวลา</th>
                  <th className="border-b border-slate-200 px-3 py-2 font-medium">เลขที่บิล</th>
                  <th className="border-b border-slate-200 px-3 py-2 font-medium text-right">ยอด</th>
                  <th className="border-b border-slate-200 px-3 py-2 font-medium">ชำระ</th>
                  <th className="border-b border-slate-200 px-3 py-2 font-medium text-right">รายการ</th>
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(r.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedId(r.id)
                      }
                    }}
                    className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">{formatTime(r.at)}</td>
                    <td className="px-3 py-2 font-mono text-[11px]">{r.billNo}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatBaht(r.total)}</td>
                    <td className="px-3 py-2">{getPaymentMethodLabel(r.paymentId)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.lineCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-xs text-slate-500">เลขที่บิล</p>
                <p className="font-mono text-sm font-semibold text-slate-900">{selected.billNo}</p>
                <p className="mt-1 text-[11px] text-slate-600">
                  {formatTime(selected.at)} · {getPaymentMethodLabel(selected.paymentId)} · {selected.lineCount} รายการ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="ปิด"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
              {selected.lines?.length ? (
                <ul className="space-y-2">
                  {selected.lines.map((l, idx) => (
                    <li key={idx} className="flex items-start justify-between gap-2 text-xs text-slate-800">
                      <div className="min-w-0">
                        {l.sku ? <p className="font-mono text-[11px] text-slate-500">{l.sku}</p> : null}
                        <p className="truncate font-medium text-slate-900">{l.name}</p>
                        {l.unitPrice !== undefined ? (
                          <p className="text-[11px] text-slate-500">
                            {l.qty} x {formatBaht(l.unitPrice)}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500">จำนวน {l.qty}</p>
                        )}
                      </div>
                      {l.unitPrice !== undefined ? (
                        <p className="shrink-0 tabular-nums text-slate-900">{formatBaht(l.qty * l.unitPrice)}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">บิลนี้ไม่มีรายละเอียดรายการสินค้า (ข้อมูลเก่า)</p>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
              <div>
                <p className="text-[11px] text-slate-500">ยอดรวมสุทธิ</p>
                <p className="text-base font-semibold tabular-nums text-slate-900">฿{formatBaht(selected.total)}</p>
              </div>
              <button
                type="button"
                disabled={
                  isReprintLoading || !selected.lines?.length || selected.lines.some((l) => l.unitPrice === undefined)
                }
                onClick={async () => {
                  setIsReprintLoading(true)
                  try {
                    const fresh = (await getPosSaleByBillNoAsync(selected.billNo)) ?? selected
                    if (!fresh.lines?.length) return
                    const lines = fresh.lines
                    .filter((l) => l.unitPrice !== undefined)
                    .map((l) => ({
                      lineId: `re-${fresh.id}-${Math.random().toString(36).slice(2, 6)}`,
                      productId: l.productId,
                      sku: l.sku ?? '',
                      name: l.name,
                      qty: l.qty,
                      unitPrice: l.unitPrice ?? 0,
                      unitLabel: 'ชิ้น',
                      unitIndex: 0,
                      unitBaseUnits: 1,
                      priceLevelIndex: 0,
                      priceLevelLabel: 'ราคา 1',
                    }))
                    printPosReceipt({
                      billNo: fresh.billNo,
                      lines,
                      grandTotal: fresh.total,
                      paymentLabel: getPaymentMethodLabel(fresh.paymentId),
                    })
                  } finally {
                    setIsReprintLoading(false)
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <Printer className="size-4" aria-hidden />
                {isReprintLoading ? 'กำลังดึงบิล...' : 'พิมพ์ซ้ำ'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
