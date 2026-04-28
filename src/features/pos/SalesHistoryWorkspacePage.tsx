import { getPaymentMethodLabel } from '@/features/pos/data/posPaymentMethodLabels'
import {
  loadRecentSales,
  POS_SALE_RECORDED_EVENT,
  type PosSaleRecord,
} from '@/features/pos/data/posSalesHistory'
import { loadPosSalesHistoryAsync } from '@/features/pos/data/posSalesDb'
import { getPosSaleByBillNoAsync } from '@/features/pos/data/posSalesDb'
import { SaleVoidModal } from '@/features/pos/components/SaleVoidModal'
import { SaleReturnModal } from '@/features/pos/components/SaleReturnModal'
import { printPosReceipt } from '@/features/pos/utils/posPrintReceipt'
import { clsx } from 'clsx'
import { Ban, History, Printer, RefreshCw, RotateCcw, Search, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
  const [isLoadingDb, setIsLoadingDb] = useState(true)
  const [q, setQ] = useState('')
  const [payment, setPayment] = useState<'all' | string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isReprintLoading, setIsReprintLoading] = useState(false)
  const [showVoidModal, setShowVoidModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)

  const rows = useMemo(
    () => (dbRows && dbRows.length > 0 ? dbRows : storedRows),
    [dbRows, storedRows],
  )

  const refresh = useCallback((showSpinner = false) => {
    setStoredRows(loadRecentSales())
    if (showSpinner) setIsLoadingDb(true)
    void loadPosSalesHistoryAsync(200)
      .then((rowsFromDb) => {
        if (!rowsFromDb) { setDbRows(null); return }
        setDbRows(
          rowsFromDb.map((r) => ({
            id: r.id,
            billNo: r.billNo,
            at: r.at,
            total: r.total,
            paymentId: r.paymentId as PosSaleRecord['paymentId'],
            lineCount: r.lineCount,
            lines: r.lines,
            voidedAt: r.voidedAt,
          })),
        )
      })
      .catch(() => setDbRows(null))
      .finally(() => setIsLoadingDb(false))
  }, [])

  useEffect(() => {
    refresh(true)
    const onSale = () => refresh()
    window.addEventListener(POS_SALE_RECORDED_EVENT, onSale)
    return () => window.removeEventListener(POS_SALE_RECORDED_EVENT, onSale)
  }, [refresh])

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
                {isLoadingDb
                  ? 'กำลังโหลดจากฐานข้อมูล…'
                  : dbRows
                    ? `ฐานข้อมูล · ${totals.count} บิล · ฿${formatBaht(totals.baht)}`
                    : `ในเครื่อง · ${totals.count} บิล · ฿${formatBaht(totals.baht)}`}
              </p>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => refresh(true)}
              disabled={isLoadingDb}
              title="รีเฟรช"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <RefreshCw className={clsx('size-4', isLoadingDb && 'animate-spin')} />
            </button>
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
        {isLoadingDb && rows.length === 0 ? (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
            <RefreshCw className="size-4 animate-spin" />
            กำลังโหลดข้อมูลจากฐานข้อมูล…
          </div>
        ) : filtered.length === 0 ? (
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
                {filtered.map((r) => {
                  const isVoided = Boolean(r.voidedAt)
                  return (
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
                      className={clsx(
                        'cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/80',
                        isVoided && 'opacity-50',
                      )}
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">{formatTime(r.at)}</td>
                      <td className="px-3 py-2 font-mono text-[11px]">
                        <span className={clsx(isVoided && 'line-through')}>{r.billNo}</span>
                        {isVoided && (
                          <span className="ml-1.5 rounded bg-rose-100 px-1 py-0.5 text-[9px] font-bold text-rose-700">VOID</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatBaht(r.total)}</td>
                      <td className="px-3 py-2">{getPaymentMethodLabel(r.paymentId)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.lineCount}</td>
                    </tr>
                  )
                })}
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
              <div>
                <p className="text-[11px] text-slate-500">ยอดรวมสุทธิ</p>
                <p className="text-base font-semibold tabular-nums text-slate-900">฿{formatBaht(selected.total)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Void */}
                {!selected.voidedAt && (
                  <button
                    type="button"
                    onClick={() => setShowVoidModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    <Ban className="size-3.5" aria-hidden />
                    ยกเลิกบิล
                  </button>
                )}
                {/* Return */}
                {!selected.voidedAt && (selected.lines?.some((l) => l.unitPrice !== undefined)) && (
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    คืนสินค้า
                  </button>
                )}
                {/* Reprint */}
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
        </div>
      ) : null}

      {showVoidModal && selected && (
        <SaleVoidModal
          bill={selected}
          onClose={() => setShowVoidModal(false)}
          onVoided={() => {
            setShowVoidModal(false)
            setSelectedId(null)
            refresh(true)
          }}
        />
      )}

      {showReturnModal && selected && (
        <SaleReturnModal
          bill={selected}
          onClose={() => setShowReturnModal(false)}
          onReturned={(returnNo, totalRefund, creditNoteNo) => {
            setShowReturnModal(false)
            setSelectedId(null)
            refresh(true)
            const cn = creditNoteNo ? `\nใบลดหนี้: ${creditNoteNo}` : ''
            alert(`บันทึกคืนสินค้าแล้ว\nเลขที่ใบคืน: ${returnNo}\nยอดคืน: ฿${totalRefund.toLocaleString('th-TH', { minimumFractionDigits: 2 })}${cn}`)
          }}
        />
      )}
    </div>
  )
}
