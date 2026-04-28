import { CreditRuleEditorModal } from '@/features/finance/components/CreditRuleEditorModal'
import {
  CREDIT_TERMS_CHANGED_EVENT,
  getCustomerCreditTerms,
  setCustomerCreditTerms,
  type CounterpartyCreditConfig,
} from '@/features/finance/data/creditTermsStore'
import {
  loadDebtReductionChannels,
  DEBT_REDUCTION_CHANNELS_CHANGED_EVENT,
} from '@/features/finance/data/debtReductionChannelsStore'
import { supplierPayDueDate, describeSupplierCreditRule } from '@/features/finance/data/supplierPaymentDueDate'
import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'
import { clsx } from 'clsx'
import { Banknote, ListChecks, Loader2, Search, Settings2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type ArAgingStatus = 'current' | 'due_soon' | 'overdue'

const AR_AGING_LABELS: Record<ArAgingStatus, string> = {
  current: 'ปกติ',
  due_soon: 'ใกล้ครบกำหนด',
  overdue: 'เกินกำหนด',
}

type MemberArRow = {
  id: string
  memberCode: string
  fullName: string
  phone: string
  arBalance: number
  creditLimitBaht: number
  branchId: string
  lastSaleAt: string | null
}

function agingBadge(s: ArAgingStatus) {
  const map: Record<ArAgingStatus, string> = {
    current: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    due_soon: 'border-amber-200 bg-amber-50 text-amber-900',
    overdue: 'border-rose-200 bg-rose-50 text-rose-800',
  }
  return (
    <span className={clsx('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium', map[s])}>
      {AR_AGING_LABELS[s]}
    </span>
  )
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

function getAgingStatus(row: MemberArRow, creditTerms: CounterpartyCreditConfig): { status: ArAgingStatus; dueDate: Date | null } {
  if (!row.lastSaleAt) return { status: 'current', dueDate: null }
  try {
    const anchor = parseLocalNoon(row.lastSaleAt)
    const dueDate = supplierPayDueDate(anchor, creditTerms)
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const diffDays = Math.round((dueDate.getTime() - today.getTime()) / 86400000)
    const status: ArAgingStatus = diffDays < 0 ? 'overdue' : diffDays <= 7 ? 'due_soon' : 'current'
    return { status, dueDate }
  } catch {
    return { status: 'current', dueDate: null }
  }
}

function creditSummaryShort(cfg: CounterpartyCreditConfig): string {
  const t = describeSupplierCreditRule(cfg)
  return t.length > 72 ? `${t.slice(0, 72)}…` : t
}

type PaymentModal = {
  memberId: string
  memberCode: string
  fullName: string
  balance: number
}

type ReceivablesPanelProps = {
  onOpenDebtChannelsEditor?: () => void
}

export function ReceivablesPanel({ onOpenDebtChannelsEditor }: ReceivablesPanelProps) {
  const [rows, setRows] = useState<MemberArRow[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [aging, setAging] = useState<ArAgingStatus | 'all'>('all')
  const [, refreshCreditTick] = useState(0)
  const [channels, setChannels] = useState<string[]>([])
  const [pay, setPay] = useState<PaymentModal | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payChannel, setPayChannel] = useState('')
  const [payNote, setPayNote] = useState('')
  const [paying, setPaying] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)

  const [creditEdit, setCreditEdit] = useState<{
    partyId: string
    label: string
    initial: CounterpartyCreditConfig
  } | null>(null)

  const bumpCredit = useCallback(() => refreshCreditTick((n) => n + 1), [])

  const loadRows = useCallback(async () => {
    if (!isTauri()) return
    setLoading(true)
    try {
      const data = await invoke<MemberArRow[]>('member_ar_list')
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      console.warn('member_ar_list failed', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadRows() }, [loadRows])

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

  const rowsWithAging = useMemo(() =>
    rows.map((r) => {
      const terms = getCustomerCreditTerms(r.memberCode)
      const { status, dueDate } = getAgingStatus(r, terms)
      return { ...r, agingStatus: status, dueDate }
    }),
  [rows])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rowsWithAging.filter((r) => {
      if (aging !== 'all' && r.agingStatus !== aging) return false
      if (!term) return true
      return (
        r.fullName.toLowerCase().includes(term) ||
        r.memberCode.toLowerCase().includes(term) ||
        r.phone.replace(/\s/g, '').includes(term.replace(/\s/g, ''))
      )
    })
  }, [rowsWithAging, q, aging])

  const totals = useMemo(() => ({
    outstanding: filtered.reduce((s, r) => s + r.arBalance, 0),
    overdue: filtered.filter((r) => r.agingStatus === 'overdue').length,
    count: filtered.length,
  }), [filtered])

  const openPayModal = (r: MemberArRow) => {
    setPay({ memberId: r.id, memberCode: r.memberCode, fullName: r.fullName, balance: r.arBalance })
    setPayAmount(r.arBalance.toFixed(2))
    setPayChannel(channels[0] ?? '')
    setPayNote('')
    setTimeout(() => amountRef.current?.select(), 50)
  }

  const submitPayment = async () => {
    if (!pay) return
    const amount = parseFloat(payAmount)
    if (!Number.isFinite(amount) || amount <= 0) return
    setPaying(true)
    try {
      await invoke('member_receive_payment', { memberId: pay.memberId, amount, note: payNote })
      setPay(null)
      await loadRows()
    } catch (e) {
      console.error('member_receive_payment failed', e)
    } finally {
      setPaying(false)
    }
  }

  const openCreditEditor = (r: MemberArRow) => {
    setCreditEdit({
      partyId: r.memberCode,
      label: `${r.memberCode} — ${r.fullName}`,
      initial: getCustomerCreditTerms(r.memberCode),
    })
  }

  const saveCredit = (next: CounterpartyCreditConfig) => {
    if (!creditEdit) return
    setCustomerCreditTerms(creditEdit.partyId, next)
    setCreditEdit(null)
    bumpCredit()
  }

  const branchLabel = (id: string) => id === 'somneuk' ? 'สมนึก' : id === 'ang' ? 'อัง' : id || '—'

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">ยอดลูกหนี้คงค้าง (รายการที่กรอง)</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
            ฿{totals.outstanding.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-slate-500">จำนวนรายการ</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{totals.count}</p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3">
          <p className="text-xs font-medium text-rose-800">เกินกำหนด (ในรายการที่กรอง)</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-rose-900">{totals.overdue}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา ชื่อ, รหัสลูกค้า, เบอร์"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
          />
        </div>
        <select
          value={aging}
          onChange={(e) => setAging(e.target.value as ArAgingStatus | 'all')}
          className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="all">อายุหนี้ทั้งหมด</option>
          {(Object.keys(AR_AGING_LABELS) as ArAgingStatus[]).map((k) => (
            <option key={k} value={k}>{AR_AGING_LABELS[k]}</option>
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
        <table className="w-full min-w-[62rem] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50/95 text-xs font-medium text-slate-600">
            <tr>
              <th className="px-3 py-2.5">รหัสลูกค้า</th>
              <th className="min-w-[10rem] px-3 py-2.5">ชื่อ</th>
              <th className="min-w-[12rem] px-3 py-2.5">กติกาเครดิต</th>
              <th className="px-3 py-2.5">เบอร์</th>
              <th className="px-3 py-2.5 text-right">วงเงิน</th>
              <th className="px-3 py-2.5 text-right">คงค้าง</th>
              <th className="px-3 py-2.5">ครบกำหนด (ประมาณ)</th>
              <th className="px-3 py-2.5">ขายล่าสุด</th>
              <th className="px-3 py-2.5">อายุหนี้</th>
              <th className="px-3 py-2.5">สาขา</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-slate-400">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                  {!isTauri() ? 'ต้องเปิดในแอป Tauri เพื่อดูข้อมูลจริง' : 'ไม่พบรายการลูกหนี้คงค้าง'}
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const cfg = getCustomerCreditTerms(r.memberCode)
                return (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-700">{r.memberCode}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{r.fullName}</td>
                    <td className="max-w-[16rem] px-3 py-2 align-top">
                      <p className="text-[10px] leading-snug text-slate-600">{creditSummaryShort(cfg)}</p>
                      <button
                        type="button"
                        onClick={() => openCreditEditor(r)}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:underline"
                      >
                        <Settings2 className="size-3" aria-hidden />
                        แก้กติกา
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">{r.phone || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-700">
                      {r.creditLimitBaht > 0 ? `฿${r.creditLimitBaht.toLocaleString('th-TH')}` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                      ฿{r.arBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                      {r.dueDate ? formatDate(r.dueDate.toISOString().slice(0, 10)) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{formatDate(r.lastSaleAt)}</td>
                    <td className="px-3 py-2.5">{agingBadge(r.agingStatus)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{branchLabel(r.branchId)}</td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => openPayModal(r)}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                      >
                        <Banknote className="size-3.5" aria-hidden />
                        รับชำระ
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Receive Payment Modal */}
      {pay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">บันทึกรับชำระ</h2>
            <p className="mt-1 text-sm text-slate-600">
              {pay.memberCode} — {pay.fullName}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              ยอดคงค้าง:{' '}
              <span className="font-semibold text-slate-800">
                ฿{pay.balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </p>

            <div className="mt-4 flex flex-col gap-3">
              <label className="block text-xs font-medium text-slate-600">
                จำนวนที่รับชำระ (บาท)
                <input
                  ref={amountRef}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                />
              </label>

              <label className="block text-xs font-medium text-slate-600">
                ช่องทางรับชำระ
                <select
                  value={payChannel}
                  onChange={(e) => setPayChannel(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
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
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPay(null)}
                disabled={paying}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => void submitPayment()}
                disabled={paying || !(parseFloat(payAmount) > 0)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {paying && <Loader2 className="size-4 animate-spin" />}
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {creditEdit && (
        <CreditRuleEditorModal
          open
          title={creditEdit.label}
          partyKindLabel="customer"
          initial={creditEdit.initial}
          onClose={() => setCreditEdit(null)}
          onSave={saveCredit}
        />
      )}
    </div>
  )
}
