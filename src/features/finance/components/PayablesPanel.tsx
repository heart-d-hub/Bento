import { CreditRuleEditorModal } from '@/features/finance/components/CreditRuleEditorModal'
import {
  CREDIT_TERMS_CHANGED_EVENT,
  getSupplierCreditTerms,
  setSupplierCreditTerms,
  type CounterpartyCreditConfig,
} from '@/features/finance/data/creditTermsStore'
import {
  AP_STATUS_LABELS,
  MOCK_PAYABLES,
  type ApPaymentStatus,
  type PayableAccount,
} from '@/features/finance/data/mockReceivablesPayables'
import { describeSupplierCreditRule } from '@/features/finance/data/supplierPaymentDueDate'
import { clsx } from 'clsx'
import { ListChecks, Search, Settings2, Truck } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

function statusBadge(s: ApPaymentStatus) {
  const map: Record<ApPaymentStatus, string> = {
    pending: 'border-slate-200 bg-slate-100 text-slate-700',
    partial: 'border-sky-200 bg-sky-50 text-sky-900',
    overdue: 'border-rose-200 bg-rose-50 text-rose-800',
  }
  return (
    <span
      className={clsx(
        'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium',
        map[s],
      )}
    >
      {AP_STATUS_LABELS[s]}
    </span>
  )
}

function formatDate(iso: string) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function creditSummaryShort(cfg: CounterpartyCreditConfig): string {
  const t = describeSupplierCreditRule(cfg)
  return t.length > 72 ? `${t.slice(0, 72)}…` : t
}

type PayablesPanelProps = {
  onOpenDebtChannelsEditor?: () => void
}

export function PayablesPanel({ onOpenDebtChannelsEditor }: PayablesPanelProps) {
  const [rows] = useState<PayableAccount[]>(() => [...MOCK_PAYABLES])
  const [q, setQ] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<ApPaymentStatus | 'all'>('all')
  const [, refreshCreditTick] = useState(0)

  const bumpCredit = useCallback(() => refreshCreditTick((n) => n + 1), [])

  useEffect(() => {
    const on = () => bumpCredit()
    window.addEventListener(CREDIT_TERMS_CHANGED_EVENT, on)
    return () => window.removeEventListener(CREDIT_TERMS_CHANGED_EVENT, on)
  }, [bumpCredit])

  const [creditEdit, setCreditEdit] = useState<{
    partyId: string
    label: string
    initial: CounterpartyCreditConfig
  } | null>(null)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (paymentStatus !== 'all' && r.paymentStatus !== paymentStatus) return false
      if (!term) return true
      return (
        r.supplierName.toLowerCase().includes(term) ||
        r.supplierCode.toLowerCase().includes(term) ||
        r.phone.replace(/\s/g, '').includes(term.replace(/\s/g, ''))
      )
    })
  }, [rows, q, paymentStatus])

  const totals = useMemo(() => {
    const outstanding = filtered.reduce((s, r) => s + r.outstanding, 0)
    const overdue = filtered.filter((r) => r.paymentStatus === 'overdue').length
    return { outstanding, overdue, count: filtered.length }
  }, [filtered])

  const openCreditEditor = (r: PayableAccount) => {
    const partyId = r.supplierPartyId ?? `ap-row:${r.id}`
    setCreditEdit({
      partyId,
      label: `${r.supplierCode} — ${r.supplierName}`,
      initial: getSupplierCreditTerms(partyId),
    })
  }

  const saveCredit = (next: CounterpartyCreditConfig) => {
    if (!creditEdit) return
    setSupplierCreditTerms(creditEdit.partyId, next)
    setCreditEdit(null)
    bumpCredit()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">ยอดเจ้าหนี้คงค้าง (รายการที่กรอง)</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
            ฿{totals.outstanding.toLocaleString('th-TH')}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-slate-500">จำนวนรายการ</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{totals.count}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
          <p className="text-xs font-medium text-amber-900">เกินกำหนดจ่าย (ในรายการที่กรอง)</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-amber-950">{totals.overdue}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา ชื่อผู้จำหน่าย, รหัส, เบอร์"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
          />
        </div>
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value as ApPaymentStatus | 'all')}
          className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="all">สถานะทั้งหมด</option>
          {(Object.keys(AP_STATUS_LABELS) as ApPaymentStatus[]).map((k) => (
            <option key={k} value={k}>
              {AP_STATUS_LABELS[k]}
            </option>
          ))}
        </select>
        {onOpenDebtChannelsEditor ? (
          <button
            type="button"
            onClick={onOpenDebtChannelsEditor}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-2.5 text-sm font-medium text-amber-950 shadow-sm hover:bg-amber-100"
          >
            <ListChecks className="size-4 text-amber-800" aria-hidden />
            ช่องทางลดหนี้
          </button>
        ) : null}
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Truck className="size-4 text-slate-600" aria-hidden />
          บันทึกจ่ายชำระ
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50/95 text-xs font-medium text-slate-600">
            <tr>
              <th className="px-3 py-2.5">รหัสผู้จำหน่าย</th>
              <th className="min-w-[10rem] px-3 py-2.5">ชื่อ</th>
              <th className="min-w-[14rem] px-3 py-2.5">กติกาเครดิต / จ่าย (รายซัพพลาย)</th>
              <th className="px-3 py-2.5">เบอร์</th>
              <th className="px-3 py-2.5 text-right">คงค้าง</th>
              <th className="px-3 py-2.5">ครบกำหนด</th>
              <th className="px-3 py-2.5">จ่ายล่าสุด</th>
              <th className="px-3 py-2.5">สถานะ</th>
              <th className="px-3 py-2.5">สาขา/คลัง</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                  ไม่พบรายการ
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const cfg = getSupplierCreditTerms(r.supplierPartyId ?? `ap-row:${r.id}`)
                return (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-700">
                      {r.supplierCode}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{r.supplierName}</td>
                    <td className="max-w-[18rem] px-3 py-2 align-top">
                      <p className="text-[10px] leading-snug text-slate-600">{creditSummaryShort(cfg)}</p>
                      <button
                        type="button"
                        onClick={() => openCreditEditor(r)}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:underline"
                      >
                        <Settings2 className="size-3" aria-hidden />
                        แก้กติกา
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">{r.phone}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium tabular-nums text-slate-900">
                      ฿{r.outstanding.toLocaleString('th-TH')}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">{formatDate(r.dueDate)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                      {formatDate(r.lastPaymentDate)}
                    </td>
                    <td className="px-3 py-2.5">{statusBadge(r.paymentStatus)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{r.branch}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-xs text-slate-600">
        <p className="font-semibold text-slate-800">เจ้าหนี้ — กติกาไม่เหมือนกันในแต่ละบริษัท</p>
        <p className="mt-1 leading-relaxed">
          ใช้ปุ่ม <strong>แก้กติกา</strong> ตั้งค่ารอบตัดบิล / วันเครดิต / ไม่รวมเดือนซื้อ / ชำระสิ้นเดือน <strong>แยกตามซัพพลาย</strong>{' '}
          (เก็บในเครื่อง) — หน้า{' '}
          <strong className="text-slate-800">ซื้อ (PO)</strong> จะคำนวณวันครบกำหนดจ่ายตามซัพพลายที่เลือกในใบสั่งซื้อ
        </p>
        <p className="mt-2 leading-relaxed">
          ปุ่ม <strong>ช่องทางลดหนี้</strong> ใช้แก้รายการวิธีจ่าย/รับชำระ (เงินสด โอน เช็ค ฯลฯ) — รายการเดียวกันจะไปให้เลือกในใบสั่งซื้อเมื่อบันทึกชำระแล้ว
        </p>
      </div>

      {creditEdit && (
        <CreditRuleEditorModal
          open
          title={creditEdit.label}
          partyKindLabel="supplier"
          initial={creditEdit.initial}
          onClose={() => setCreditEdit(null)}
          onSave={saveCredit}
        />
      )}
    </div>
  )
}
