import { CreditRuleEditorModal } from '@/features/finance/components/CreditRuleEditorModal'
import {
  CREDIT_TERMS_CHANGED_EVENT,
  getSupplierCreditTerms,
  setSupplierCreditTerms,
  type CounterpartyCreditConfig,
} from '@/features/finance/data/creditTermsStore'
import {
  loadDebtReductionChannels,
  DEBT_REDUCTION_CHANNELS_CHANGED_EVENT,
} from '@/features/finance/data/debtReductionChannelsStore'
import { supplierPayDueDate, describeSupplierCreditRule } from '@/features/finance/data/supplierPaymentDueDate'
import {
  loadPurchaseOrdersAsync,
  upsertPurchaseOrderAsync,
  PURCHASE_ORDERS_CHANGED_EVENT,
} from '@/features/purchase/data/poStore'
import { loadSupplierDirectory, type SupplierBankAccount, type EarlyPayDiscount } from '@/features/purchase/data/supplierDirectoryStore'
import type { PurchaseOrder } from '@/features/purchase/data/poTypes'
import { clsx } from 'clsx'
import { ListChecks, Loader2, Search, Settings2, Truck } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type ApStatus = 'pending' | 'overdue'

const AP_STATUS_LABELS: Record<ApStatus, string> = {
  pending: 'รอจ่าย',
  overdue: 'เกินกำหนด',
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return iso
  }
}

function parseLocalNoon(iso: string): Date {
  const part = (iso.split('T')[0] ?? iso).trim()
  const [ys, ms, ds] = part.split('-')
  return new Date(Number(ys), Number(ms) - 1, Number(ds), 12, 0, 0)
}

function creditAnchorForPo(po: PurchaseOrder): Date {
  const last = po.receiveBatches.at(-1)?.at
  if (last) return parseLocalNoon(last)
  if (po.orderedAt) return parseLocalNoon(po.orderedAt)
  return parseLocalNoon(po.createdAt)
}

function poOutstanding(po: PurchaseOrder): number {
  if (po.poInvoices && po.poInvoices.length > 0) {
    return po.poInvoices.reduce((s, inv) => s + inv.totalBaht, 0)
  }
  const rcvTotal = po.receiveBatches.reduce(
    (s, b) => s + b.lines.reduce((ls, l) => ls + l.qty * l.unitCost, 0), 0,
  )
  const ordTotal = po.lines.reduce((s, l) => {
    const paidQ = l.bonusPaidQty ?? 0
    const freeQ = l.bonusFreeQty ?? 0
    const freeUnits = paidQ > 0 ? Math.floor(l.orderedQty / paidQ) * freeQ : 0
    return s + (l.orderedQty - freeUnits) * l.unitCostOrder
  }, 0)
  const raw = rcvTotal > 0 ? rcvTotal : ordTotal
  const vatMode = po.vatMode ?? 'excluded'
  const base =
    vatMode === 'included' && po.vatRatePercent > 0
      ? Math.round((raw / (1 + po.vatRatePercent / 100)) * 100) / 100
      : raw
  const vat = vatMode === 'none' ? 0 : Math.round((base * po.vatRatePercent) / 100 * 100) / 100
  return Math.round((base + vat - po.billDiscountBaht) * 100) / 100
}

function creditSummaryShort(cfg: CounterpartyCreditConfig): string {
  const t = describeSupplierCreditRule(cfg)
  return t.length > 72 ? `${t.slice(0, 72)}…` : t
}

type PayModal = {
  po: PurchaseOrder
  outstanding: number
  bankAccounts: SupplierBankAccount[]
  earlyPayDiscounts: EarlyPayDiscount[]
  daysFromOrder: number
}

type PayablesPanelProps = {
  onOpenDebtChannelsEditor?: () => void
}

export function PayablesPanel({ onOpenDebtChannelsEditor }: PayablesPanelProps) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApStatus | 'all'>('all')
  const [, refreshCreditTick] = useState(0)
  const [channels, setChannels] = useState<string[]>([])
  const [payModal, setPayModal] = useState<PayModal | null>(null)
  const [payMethod, setPayMethod] = useState<'paid_cash' | 'paid_transfer'>('paid_transfer')
  const [payChannel, setPayChannel] = useState('')
  const [payNote, setPayNote] = useState('')
  const [payDiscountPct, setPayDiscountPct] = useState<number | null>(null)
  const [paying, setPaying] = useState(false)

  const [creditEdit, setCreditEdit] = useState<{
    partyId: string
    label: string
    initial: CounterpartyCreditConfig
  } | null>(null)

  const bumpCredit = useCallback(() => refreshCreditTick((n) => n + 1), [])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const all = await loadPurchaseOrdersAsync()
      setOrders(all.filter((o) => o.paymentMode === 'payable'))
    } catch (e) {
      console.warn('loadPurchaseOrdersAsync failed', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadOrders() }, [loadOrders])

  useEffect(() => {
    const on = () => { void loadOrders() }
    window.addEventListener(PURCHASE_ORDERS_CHANGED_EVENT, on)
    return () => window.removeEventListener(PURCHASE_ORDERS_CHANGED_EVENT, on)
  }, [loadOrders])

  useEffect(() => {
    setChannels(loadDebtReductionChannels())
    const on = () => {
      bumpCredit()
      setChannels(loadDebtReductionChannels())
    }
    window.addEventListener(CREDIT_TERMS_CHANGED_EVENT, on)
    window.addEventListener(DEBT_REDUCTION_CHANNELS_CHANGED_EVENT, on)
    return () => {
      window.removeEventListener(CREDIT_TERMS_CHANGED_EVENT, on)
      window.removeEventListener(DEBT_REDUCTION_CHANNELS_CHANGED_EVENT, on)
    }
  }, [bumpCredit])

  const suppliers = useMemo(() => loadSupplierDirectory(), [])

  const rowsWithMeta = useMemo(() => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    return orders.map((po) => {
      const outstanding = poOutstanding(po)
      const terms = getSupplierCreditTerms(po.supplierId)
      const anchor = creditAnchorForPo(po)
      const dueDate = supplierPayDueDate(anchor, terms)
      const isOverdue = dueDate < today
      const status: ApStatus = isOverdue ? 'overdue' : 'pending'
      const sup = suppliers.find((s) => s.id === po.supplierId)
      const phone = sup?.phone ?? ''
      const bankAccounts = sup?.bankAccounts ?? []
      return { po, outstanding, dueDate, status, phone, bankAccounts }
    })
  }, [orders, suppliers])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rowsWithMeta.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (!term) return true
      return (
        r.po.supplierName.toLowerCase().includes(term) ||
        r.po.poNo.toLowerCase().includes(term) ||
        r.phone.replace(/\s/g, '').includes(term.replace(/\s/g, ''))
      )
    })
  }, [rowsWithMeta, q, statusFilter])

  const totals = useMemo(() => ({
    outstanding: filtered.reduce((s, r) => s + r.outstanding, 0),
    overdue: filtered.filter((r) => r.status === 'overdue').length,
    count: filtered.length,
  }), [filtered])

  const openPayModal = (r: (typeof rowsWithMeta)[0]) => {
    const sup = suppliers.find((s) => s.id === r.po.supplierId)
    const anchor = new Date(r.po.orderedAt ?? r.po.createdAt)
    anchor.setHours(0, 0, 0, 0)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const daysFromOrder = Math.floor((today.getTime() - anchor.getTime()) / 86_400_000)
    setPayModal({
      po: r.po,
      outstanding: r.outstanding,
      bankAccounts: r.bankAccounts,
      earlyPayDiscounts: sup?.earlyPayDiscounts ?? [],
      daysFromOrder,
    })
    setPayMethod('paid_transfer')
    setPayChannel(channels[1] ?? channels[0] ?? '')
    setPayNote('')
    setPayDiscountPct(null)
  }

  const submitPay = async () => {
    if (!payModal) return
    setPaying(true)
    try {
      const discountBaht = payDiscountPct != null
        ? Math.round(payModal.outstanding * (payDiscountPct / 100) * 100) / 100
        : 0
      const updated: PurchaseOrder = {
        ...payModal.po,
        paymentMode: payMethod,
        paidAt: new Date().toISOString(),
        debtReductionChannel: payChannel || undefined,
        paymentNote: payNote || undefined,
        ...(discountBaht > 0 ? { billDiscountBaht: (payModal.po.billDiscountBaht ?? 0) + discountBaht } : {}),
      }
      await upsertPurchaseOrderAsync(updated)
      setPayModal(null)
      setPayDiscountPct(null)
      await loadOrders()
    } catch (e) {
      console.error('pay vendor failed', e)
    } finally {
      setPaying(false)
    }
  }

  const openCreditEditor = (po: PurchaseOrder) => {
    const sup = suppliers.find((s) => s.id === po.supplierId)
    setCreditEdit({
      partyId: po.supplierId,
      label: `${sup?.supplierCode ?? po.supplierId} — ${po.supplierName}`,
      initial: getSupplierCreditTerms(po.supplierId),
    })
  }

  const saveCredit = (next: CounterpartyCreditConfig) => {
    if (!creditEdit) return
    setSupplierCreditTerms(creditEdit.partyId, next)
    setCreditEdit(null)
    bumpCredit()
  }

  const statusBadge = (s: ApStatus) => {
    const map: Record<ApStatus, string> = {
      pending: 'border-slate-200 bg-slate-100 text-slate-700',
      overdue: 'border-rose-200 bg-rose-50 text-rose-800',
    }
    return (
      <span className={clsx('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium', map[s])}>
        {AP_STATUS_LABELS[s]}
      </span>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">ยอดเจ้าหนี้คงค้าง (รายการที่กรอง)</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
            ฿{totals.outstanding.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-slate-500">จำนวนใบสั่งซื้อ (เครดิต)</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{totals.count}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
          <p className="text-xs font-medium text-amber-900">เกินกำหนดจ่าย (ในรายการที่กรอง)</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-amber-950">{totals.overdue}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา ชื่อผู้จำหน่าย, เลข PO, เบอร์"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApStatus | 'all')}
          className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="all">สถานะทั้งหมด</option>
          {(Object.keys(AP_STATUS_LABELS) as ApStatus[]).map((k) => (
            <option key={k} value={k}>{AP_STATUS_LABELS[k]}</option>
          ))}
        </select>
        {onOpenDebtChannelsEditor && (
          <button
            type="button"
            onClick={onOpenDebtChannelsEditor}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-2.5 text-sm font-medium text-amber-950 shadow-sm hover:bg-amber-100"
          >
            <ListChecks className="size-4 text-amber-800" aria-hidden />
            ช่องทางลดหนี้
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[60rem] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50/95 text-xs font-medium text-slate-600">
            <tr>
              <th className="px-3 py-2.5">เลข PO</th>
              <th className="min-w-[10rem] px-3 py-2.5">ผู้จำหน่าย</th>
              <th className="min-w-[12rem] px-3 py-2.5">กติกาเครดิต</th>
              <th className="px-3 py-2.5">เบอร์</th>
              <th className="min-w-[10rem] px-3 py-2.5">บัญชีโอน</th>
              <th className="px-3 py-2.5 text-right">ยอด</th>
              <th className="px-3 py-2.5">วันสั่ง</th>
              <th className="px-3 py-2.5">ครบกำหนด</th>
              <th className="px-3 py-2.5">สถานะ</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-slate-500">
                  ไม่พบรายการเจ้าหนี้ — ใบสั่งซื้อที่เลือก «เครดิต» จะปรากฏที่นี่
                </td>
              </tr>
            ) : (
              filtered.map(({ po, outstanding, dueDate, status, phone, bankAccounts }) => {
                const cfg = getSupplierCreditTerms(po.supplierId)
                const primaryBank = bankAccounts[0]
                return (
                  <tr key={po.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-700">{po.poNo}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{po.supplierName}</td>
                    <td className="max-w-[16rem] px-3 py-2 align-top">
                      <p className="text-[10px] leading-snug text-slate-600">{creditSummaryShort(cfg)}</p>
                      <button
                        type="button"
                        onClick={() => openCreditEditor(po)}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:underline"
                      >
                        <Settings2 className="size-3" aria-hidden />
                        แก้กติกา
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">{phone || '—'}</td>
                    <td className="px-3 py-2 align-top">
                      {primaryBank ? (
                        <div className="text-xs leading-snug">
                          <p className="font-medium text-slate-800">{primaryBank.bankName ?? '—'}</p>
                          <p className="font-mono text-slate-600">{primaryBank.accountNo ?? '—'}</p>
                          {primaryBank.accountName && (
                            <p className="text-[10px] text-slate-500">{primaryBank.accountName}</p>
                          )}
                          {bankAccounts.length > 1 && (
                            <p className="text-[10px] text-slate-400">+{bankAccounts.length - 1} บัญชี</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                      ฿{outstanding.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                      {formatDate(po.orderedAt ?? po.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                      {formatDate(dueDate.toISOString().slice(0, 10))}
                    </td>
                    <td className="px-3 py-2.5">{statusBadge(status)}</td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => openPayModal({ po, outstanding, dueDate, status, phone, bankAccounts })}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
                      >
                        <Truck className="size-3.5" aria-hidden />
                        จ่ายชำระ
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pay Vendor Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">บันทึกจ่ายชำระ</h2>
            <p className="mt-1 text-sm text-slate-600">{payModal.po.supplierName}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              PO: <span className="font-mono">{payModal.po.poNo}</span>
              {' · '}ยอด:{' '}
              <span className="font-semibold text-slate-800">
                ฿{payModal.outstanding.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </p>

            <div className="mt-4 flex flex-col gap-3">
              {/* Early payment discounts */}
              {payModal.earlyPayDiscounts.length > 0 && (() => {
                const eligible = payModal.earlyPayDiscounts.filter(
                  (t) => payModal.daysFromOrder <= t.withinDays,
                )
                const expired = payModal.earlyPayDiscounts.filter(
                  (t) => payModal.daysFromOrder > t.withinDays,
                )
                return (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="mb-2 text-xs font-bold text-emerald-800">ส่วนลดจ่ายก่อนกำหนด</p>
                    <div className="space-y-1.5">
                      {eligible.map((t, i) => {
                        const discountBaht = Math.round(payModal.outstanding * (t.discountPct / 100) * 100) / 100
                        const daysLeft = t.withinDays - payModal.daysFromOrder
                        const isSelected = payDiscountPct === t.discountPct
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setPayDiscountPct(isSelected ? null : t.discountPct)}
                            className={clsx(
                              'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
                              isSelected
                                ? 'border-emerald-500 bg-emerald-100 text-emerald-900'
                                : 'border-emerald-300 bg-white text-slate-700 hover:bg-emerald-50',
                            )}
                          >
                            <div className="text-xs">
                              <span className="font-bold text-emerald-700">ลด {t.discountPct}%</span>
                              <span className="ml-2 text-slate-500">เหลืออีก {daysLeft} วัน</span>
                            </div>
                            <span className={clsx('text-xs font-semibold', isSelected ? 'text-emerald-800' : 'text-slate-500')}>
                              −฿{discountBaht.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </span>
                          </button>
                        )
                      })}
                      {expired.map((t, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 opacity-50">
                          <span className="text-xs text-slate-400 line-through">ลด {t.discountPct}% (ภายใน {t.withinDays} วัน)</span>
                          <span className="text-[10px] text-rose-400">หมดสิทธิ์</span>
                        </div>
                      ))}
                    </div>
                    {payDiscountPct != null && (
                      <p className="mt-2 text-right text-xs font-semibold text-emerald-700">
                        ยอดจ่ายจริง: ฿{(payModal.outstanding - Math.round(payModal.outstanding * (payDiscountPct / 100) * 100) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                )
              })()}

              <fieldset>
                <legend className="text-xs font-medium text-slate-600">วิธีชำระ</legend>
                <div className="mt-1 flex gap-3">
                  {(['paid_cash', 'paid_transfer'] as const).map((m) => (
                    <label key={m} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="payMethod"
                        value={m}
                        checked={payMethod === m}
                        onChange={() => setPayMethod(m)}
                      />
                      {m === 'paid_cash' ? 'เงินสด' : 'โอน / QR'}
                    </label>
                  ))}
                </div>
              </fieldset>

              {payMethod === 'paid_transfer' && payModal.bankAccounts.length > 0 && (
                <div className="rounded-lg border border-sky-100 bg-sky-50/70 px-3 py-2.5">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">บัญชีรับโอน</p>
                  <div className="flex flex-col gap-1.5">
                    {payModal.bankAccounts.map((a, i) => (
                      <div key={i} className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium text-slate-700">{a.bankName ?? '—'}</span>
                        <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 select-all">
                          {a.accountNo ?? '—'}
                        </span>
                      </div>
                    ))}
                    {payModal.bankAccounts[0]?.accountName && (
                      <p className="text-[10px] text-slate-500">ชื่อบัญชี: {payModal.bankAccounts[0].accountName}</p>
                    )}
                  </div>
                </div>
              )}

              <label className="block text-xs font-medium text-slate-600">
                ช่องทางลดหนี้
                <select
                  value={payChannel}
                  onChange={(e) => setPayChannel(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">(ไม่ระบุ)</option>
                  {channels.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="block text-xs font-medium text-slate-600">
                หมายเหตุ
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="ออปชันนัล"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayModal(null)}
                disabled={paying}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => void submitPay()}
                disabled={paying}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {paying && <Loader2 className="size-4 animate-spin" />}
                บันทึกชำระแล้ว
              </button>
            </div>
          </div>
        </div>
      )}

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
