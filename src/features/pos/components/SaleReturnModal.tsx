import {
  REFUND_METHOD_LABELS,
  RETURN_REASON_OPTIONS,
  saleReturnCreateAsync,
  type SaleReturnPayload,
} from '@/features/pos/data/saleAdjustmentsDb'
import type { PosSaleRecord } from '@/features/pos/data/posSalesHistory'
import { clsx } from 'clsx'
import { RotateCcw, X } from 'lucide-react'
import { useMemo, useState } from 'react'

type ReturnLineState = {
  checked: boolean
  qty: string
}

type Props = {
  bill: PosSaleRecord
  onClose: () => void
  onReturned: (returnNo: string, totalRefund: number, creditNoteNo?: string) => void
}

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function SaleReturnModal({ bill, onClose, onReturned }: Props) {
  const lines = useMemo(
    () => (bill.lines ?? []).filter((l) => l.unitPrice !== undefined),
    [bill.lines],
  )

  const [lineState, setLineState] = useState<Record<number, ReturnLineState>>(() =>
    Object.fromEntries(lines.map((l, i) => [i, { checked: true, qty: String(l.qty) }])),
  )
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [refundMethod, setRefundMethod] = useState<SaleReturnPayload['refundMethod']>('cash')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setLine = (i: number, patch: Partial<ReturnLineState>) =>
    setLineState((prev) => ({ ...prev, [i]: { ...prev[i], ...patch } }))

  const selectedLines = useMemo(
    () =>
      lines.flatMap((l, i) => {
        const s = lineState[i]
        if (!s?.checked) return []
        const qty = parseFloat(s.qty)
        if (!qty || qty <= 0 || qty > l.qty) return []
        const unitPrice = l.unitPrice ?? 0
        return [{
          originalSaleLineId: undefined,
          productId: l.productId ?? `prod-${l.sku ?? i}`,
          productName: l.name,
          qty,
          unitPrice,
          lineTotal: Math.round(qty * unitPrice * 100) / 100,
        }]
      }),
    [lines, lineState],
  )

  const totalRefund = useMemo(
    () => selectedLines.reduce((s, l) => s + l.lineTotal, 0),
    [selectedLines],
  )

  const effectiveReason = reason === 'อื่นๆ' ? customReason.trim() : reason

  const handleSubmit = async () => {
    if (selectedLines.length === 0) {
      setError('เลือกสินค้าอย่างน้อย 1 รายการ')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await saleReturnCreateAsync({
        originalSaleId: bill.id,
        reason: effectiveReason || undefined,
        refundMethod,
        lines: selectedLines,
      })
      onReturned(result.returnNo, result.totalRefund, result.creditNoteNo)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[350] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <RotateCcw className="size-4 text-indigo-500" />
            คืนสินค้า — {bill.billNo}
          </h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 overflow-auto">
          {/* Line selection */}
          {lines.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">บิลนี้ไม่มีรายละเอียดสินค้า</p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-8 px-3 py-2">
                    <input
                      type="checkbox"
                      className="size-3.5"
                      checked={lines.every((_, i) => lineState[i]?.checked)}
                      onChange={(e) =>
                        setLineState(
                          Object.fromEntries(
                            lines.map((l, i) => [i, { checked: e.target.checked, qty: String(l.qty) }]),
                          ),
                        )
                      }
                    />
                  </th>
                  <th className="px-3 py-2 text-left">สินค้า</th>
                  <th className="px-3 py-2 text-right">ราคา/หน่วย</th>
                  <th className="px-3 py-2 text-right">จำนวนคืน</th>
                  <th className="px-3 py-2 text-right">ยอดคืน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((l, i) => {
                  const s = lineState[i] ?? { checked: false, qty: '0' }
                  const returnQty = parseFloat(s.qty) || 0
                  const unitPrice = l.unitPrice ?? 0
                  const lineTotal = Math.round(returnQty * unitPrice * 100) / 100
                  const qtyInvalid = s.checked && (returnQty <= 0 || returnQty > l.qty)
                  return (
                    <tr key={i} className={clsx('hover:bg-slate-50', !s.checked && 'opacity-50')}>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          className="size-3.5"
                          checked={s.checked}
                          onChange={(e) => setLine(i, { checked: e.target.checked })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-800">{l.name}</p>
                        {l.sku && <p className="font-mono text-[10px] text-slate-400">{l.sku}</p>}
                        <p className="text-[10px] text-slate-400">ซื้อมา {l.qty} ชิ้น</p>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                        {fmt(unitPrice)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0.01}
                          max={l.qty}
                          step={1}
                          value={s.qty}
                          disabled={!s.checked}
                          onChange={(e) => setLine(i, { qty: e.target.value })}
                          className={clsx(
                            'w-16 rounded border px-1.5 py-0.5 text-right text-xs tabular-nums outline-none',
                            qtyInvalid
                              ? 'border-rose-400 bg-rose-50 text-rose-800 focus:ring-1 focus:ring-rose-300'
                              : 'border-slate-200 bg-white text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300',
                            !s.checked && 'cursor-default',
                          )}
                        />
                      </td>
                      <td className={clsx('px-3 py-2 text-right tabular-nums font-semibold', s.checked ? 'text-indigo-700' : 'text-slate-400')}>
                        {s.checked && returnQty > 0 ? fmt(lineTotal) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {/* Reason + refund method */}
          <div className="space-y-3 border-t border-slate-100 px-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  เหตุผล
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-400"
                >
                  <option value="">— เลือก —</option>
                  {RETURN_REASON_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {reason === 'อื่นๆ' && (
                  <input
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="ระบุเหตุผล"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400"
                  />
                )}
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  วิธีคืนเงิน
                </label>
                <div className="space-y-1">
                  {(Object.keys(REFUND_METHOD_LABELS) as SaleReturnPayload['refundMethod'][]).map((k) => (
                    <label key={k} className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                      <input
                        type="radio"
                        name="refund-method"
                        value={k}
                        checked={refundMethod === k}
                        onChange={() => setRefundMethod(k)}
                        className="size-3.5"
                      />
                      {REFUND_METHOD_LABELS[k]}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-[10px] text-slate-500">ยอดคืนรวม</p>
            <p className="font-mono text-base font-bold tabular-nums text-indigo-700">฿{fmt(totalRefund)}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={busy || selectedLines.length === 0}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {busy ? 'กำลังบันทึก…' : `ยืนยันคืนสินค้า (${selectedLines.length} รายการ)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
