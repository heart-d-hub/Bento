import type { CounterpartyCreditConfig } from '@/features/finance/data/creditTermsStore'
import { describeSupplierCreditRule } from '@/features/finance/data/supplierPaymentDueDate'
import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

type CreditRuleEditorModalProps = {
  open: boolean
  title: string
  /** label สำหรับ hint ว่าใช้กับใบขาย / ใบซื้อ */
  partyKindLabel: 'supplier' | 'customer'
  initial: CounterpartyCreditConfig
  onClose: () => void
  onSave: (next: CounterpartyCreditConfig) => void
}

export function CreditRuleEditorModal({
  open,
  title,
  partyKindLabel,
  initial,
  onClose,
  onSave,
}: CreditRuleEditorModalProps) {
  const [cutoff, setCutoff] = useState(initial.statementCutoffDay)
  const [creditDays, setCreditDays] = useState(initial.creditDays)
  const [excl, setExcl] = useState(initial.excludePurchaseMonth)
  const [eom, setEom] = useState(initial.payAtEndOfDueMonth)

  useEffect(() => {
    if (!open) return
    setCutoff(initial.statementCutoffDay)
    setCreditDays(initial.creditDays)
    setExcl(initial.excludePurchaseMonth)
    setEom(initial.payAtEndOfDueMonth)
  }, [open, initial])

  if (!open) return null

  const preview: CounterpartyCreditConfig = {
    statementCutoffDay: cutoff,
    creditDays,
    excludePurchaseMonth: excl,
    payAtEndOfDueMonth: eom,
  }

  const hint =
    partyKindLabel === 'supplier'
      ? 'อ้างอิงวันซื้อ/วันรับของ (จาก PO)'
      : 'อ้างอิงวันขาย/ออกใบกำกับ (เมื่อเชื่อมเอกสารขาย)'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="credit-rule-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 id="credit-rule-title" className="text-sm font-bold text-slate-900">
              กติกาเครดิต / กำหนดจ่าย
            </h2>
            <p className="text-xs text-slate-500">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="ปิด"
          >
            <X className="size-5" />
          </button>
        </div>

        <p className="mb-3 text-[11px] leading-relaxed text-slate-600">{hint}</p>

        <div className="space-y-3">
          <label className="block text-[11px] font-medium text-slate-700">
            วันตัดรอบบิล (วันที่ในเดือน 1–31)
            <input
              type="number"
              min={1}
              max={31}
              value={cutoff}
              onChange={(e) => setCutoff(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-[11px] font-medium text-slate-700">
            จำนวนวันเครดิต (นับจากจุดเริ่มหลังกติกาไม่รวมเดือน)
            <input
              type="number"
              min={0}
              max={180}
              value={creditDays}
              onChange={(e) => setCreditDays(Math.max(0, Math.min(180, Number(e.target.value) || 0)))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={excl}
              onChange={(e) => setExcl(e.target.checked)}
              className="rounded border-slate-300"
            />
            ไม่รวมเดือน{partyKindLabel === 'supplier' ? 'ซื้อ' : 'ขาย'} (เริ่มนับจากวันที่ 1 เดือนถัดไป)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={eom}
              onChange={(e) => setEom(e.target.checked)}
              className="rounded border-slate-300"
            />
            ครบกำหนดที่สิ้นเดือนของเดือนที่ครบเครดิต
          </label>
        </div>

        <p
          className={clsx(
            'mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-700',
          )}
        >
          {describeSupplierCreditRule(preview)}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => onSave(preview)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  )
}
