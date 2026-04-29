import { MEMBER_PRICE_TIER_LABELS, type MemberItemTierOverride, type MemberPriceTier } from '@/features/members/data/memberTypes'
import { isValidPhoneLength, normalizePhone } from '@/features/members/data/phoneUtils'
import {
  MEMBER_STATUS_LABELS,
  MEMBER_TYPE_LABELS,
  type Member,
  type MemberStatus,
  type MemberType,
} from '@/features/members/data/mockMembers'
import { BRANCHES } from '@/features/auth/branches'
import type { StaffUser } from '@/features/settings/data/mockStaffUsers'
import { loadStaffUsers, STAFF_USERS_CHANGED_EVENT } from '@/features/settings/data/staffUsersStore'
import {
  B2B_TIER_COLORS,
  B2B_TIER_ORDER,
  loadCustomerTiers,
  type B2bTier,
} from '@/features/settings/data/customerTiersStore'
import { clsx } from 'clsx'
import { Trash2, X } from 'lucide-react'
import { useEffect, useId, useMemo, useState, type FormEvent } from 'react'

const inputClass =
  'w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300'
const labelClass = 'mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500'
const tinyNumClass =
  'h-6 w-[2rem] min-w-[2rem] shrink-0 rounded border border-slate-200 bg-white px-0.5 py-0 text-center text-[10px] font-medium tabular-nums text-slate-900 shadow-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300'

export type MemberFormValues = Omit<Member, 'id' | 'createdAt'>

type MemberFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: Member | null
  onClose: () => void
  onSubmit: (values: MemberFormValues) => void
  suggestedCode?: string
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** รหัส Sales เดิม (mock) → id พนักงานใน จัดการผู้ใช้ */
const LEGACY_SALES_TO_STAFF: Record<string, string> = {
  s1: 'staff-1',
  s2: 'staff-2',
  s3: 'staff-3',
  s4: 'staff-1',
}

function pickDefaultSalesStaffId(staff: StaffUser[]): string {
  const active = staff.filter((s) => s.status === 'active')
  return active[0]?.id ?? staff[0]?.id ?? ''
}

function resolveSalesStaffId(raw: string, staff: StaffUser[]): string {
  if (!staff.length) return raw
  const ids = new Set(staff.map((s) => s.id))
  if (raw && ids.has(raw)) return raw
  const mapped = LEGACY_SALES_TO_STAFF[raw]
  if (mapped && ids.has(mapped)) return mapped
  return pickDefaultSalesStaffId(staff)
}

function emptyForm(suggestedCode: string, salesStaffIdDefault: string): MemberFormValues {
  const t = todayIso()
  return {
    memberCode: suggestedCode,
    fullName: '',
    address: '',
    taxId: '',
    contactPerson: '',
    email: '',
    phone: '',
    fax: '',
    salesStaffId: salesStaffIdDefault,
    creditLimitBaht: 0,
    creditTermDays: 0,
    creditTermMonths: 0,
    payAtMonthEnd: false,
    cutOffDayOfMonth: null,
    defaultPriceTier: 'tier1',
    markupPercent: 0,
    priceStartDate: t,
    priceEndDate: t,
    itemTierOverrides: [],
    notes: '',
    memberType: 'general',
    status: 'active',
    branchId: BRANCHES[0]?.id ?? '',
    customerType: 'b2c',
    b2bTier: null,
    pointsBalance: 0,
    arBalance: 0,
  }
}

function memberToForm(m: Member): MemberFormValues {
  const { id, createdAt, ...rest } = m
  void id
  void createdAt
  return {
    ...rest,
    itemTierOverrides: m.itemTierOverrides.map((x) => ({ ...x })),
  }
}

export function MemberFormModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
  suggestedCode = 'M-NEW',
}: MemberFormModalProps) {
  const titleId = useId()
  const tierRadioName = useId()
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => loadStaffUsers())
  const [form, setForm] = useState<MemberFormValues>(() =>
    mode === 'edit' && initial
      ? { ...memberToForm(initial), salesStaffId: resolveSalesStaffId(initial.salesStaffId, loadStaffUsers()) }
      : emptyForm(suggestedCode, pickDefaultSalesStaffId(loadStaffUsers())),
  )

  useEffect(() => {
    const on = () => setStaffUsers(loadStaffUsers())
    window.addEventListener(STAFF_USERS_CHANGED_EVENT, on)
    return () => window.removeEventListener(STAFF_USERS_CHANGED_EVENT, on)
  }, [])

  useEffect(() => {
    if (!open) return
    const staff = loadStaffUsers()
    if (mode === 'edit' && initial) {
      const base = memberToForm(initial)
      base.salesStaffId = resolveSalesStaffId(base.salesStaffId, staff)
      setForm(base)
    } else {
      setForm(emptyForm(suggestedCode, pickDefaultSalesStaffId(staff)))
    }
  }, [open, mode, initial, suggestedCode])

  useEffect(() => {
    if (!open) return
    if (!staffUsers.length) {
      setForm((f) => (f.salesStaffId === '' ? f : { ...f, salesStaffId: '' }))
      return
    }
    const ids = new Set(staffUsers.map((s) => s.id))
    setForm((f) => {
      if (ids.has(f.salesStaffId)) return f
      return { ...f, salesStaffId: pickDefaultSalesStaffId(staffUsers) }
    })
  }, [open, staffUsers])

  const salesSelectOptions = useMemo(() => {
    const active = staffUsers.filter((s) => s.status === 'active')
    return active.length ? active : staffUsers
  }, [staffUsers])

  if (!open) return null

  const set = (patch: Partial<MemberFormValues>) => setForm((f) => ({ ...f, ...patch }))

  const setTierDefault = (defaultPriceTier: MemberPriceTier) => set({ defaultPriceTier })

  const addItemOverride = () => {
    const id = `io-${Date.now()}`
    set({
      itemTierOverrides: [
        ...form.itemTierOverrides,
        { id, sku: '', productName: '', tier: form.defaultPriceTier },
      ],
    })
  }

  const updateOverride = (id: string, patch: Partial<MemberItemTierOverride>) => {
    set({
      itemTierOverrides: form.itemTierOverrides.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    })
  }

  const removeOverride = (id: string) => {
    set({ itemTierOverrides: form.itemTierOverrides.filter((row) => row.id !== id) })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim()) return
    if (!isValidPhoneLength(form.phone)) return
    if (!isValidPhoneLength(form.fax)) return
    onSubmit({ ...form, phone: normalizePhone(form.phone), fax: normalizePhone(form.fax) })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-2 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(92vh,48rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2">
          <h2 id={titleId} className="text-sm font-semibold text-slate-900">
            {mode === 'create' ? 'เพิ่มสมาชิก' : 'แก้ไขสมาชิก'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="ปิด"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2">

            {/* ── Customer type toggle — top of form ── */}
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5">
              <div className="flex gap-2">
                {(['b2c', 'b2b'] as const).map((ct) => (
                  <button
                    key={ct}
                    type="button"
                    onClick={() => set({ customerType: ct, b2bTier: ct === 'b2c' ? null : (form.b2bTier ?? 'silver') })}
                    className={clsx(
                      'flex-1 rounded-lg border py-2 text-xs font-bold transition',
                      form.customerType === ct
                        ? 'border-violet-500 bg-violet-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                    )}
                  >
                    {ct === 'b2c' ? '👤 B2C — ลูกค้าทั่วไป' : '🏢 B2B — ลูกค้าธุรกิจ'}
                  </button>
                ))}
              </div>

              {/* B2B tier picker */}
              {form.customerType === 'b2b' && (
                <div className="mt-2 flex gap-1.5">
                  {B2B_TIER_ORDER.map((tier) => {
                    const cfg = loadCustomerTiers().b2bTiers.find((t) => t.tier === tier)
                    const colors = B2B_TIER_COLORS[tier]
                    const isActive = form.b2bTier === tier
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => set({
                          b2bTier: tier,
                          defaultPriceTier: cfg?.defaultPriceTier ?? form.defaultPriceTier,
                          creditLimitBaht: cfg?.creditLimitBaht ?? form.creditLimitBaht,
                          creditTermDays: cfg?.creditTermDays ?? form.creditTermDays,
                          payAtMonthEnd: cfg?.payAtMonthEnd ?? form.payAtMonthEnd,
                        })}
                        className={clsx(
                          'flex flex-1 flex-col items-center rounded-lg border py-1.5 text-xs font-bold transition',
                          isActive ? colors.badge + ' shadow-sm' : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50',
                        )}
                      >
                        <span>{tier === 'silver' ? '🥈' : tier === 'gold' ? '🥇' : '💎'} {cfg?.label ?? tier}</span>
                        {cfg && <span className="mt-0.5 text-[9px] font-normal opacity-70">{cfg.defaultPriceTier} · ฿{cfg.creditLimitBaht.toLocaleString('th-TH')}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-x-4 gap-y-2 lg:grid-cols-2">
              {/* ── Left column — identity / contact ── */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">ข้อมูลทั่วไป</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass} htmlFor="member-code">รหัส</label>
                    <input id="member-code" type="text" value={form.memberCode}
                      onChange={(e) => set({ memberCode: e.target.value })}
                      className={clsx(inputClass, mode === 'edit' && 'bg-slate-50 text-slate-600')}
                      readOnly={mode === 'edit'} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="member-status">สถานะ</label>
                    <select id="member-status" value={form.status}
                      onChange={(e) => set({ status: e.target.value as MemberStatus })}
                      className={inputClass}>
                      {(Object.keys(MEMBER_STATUS_LABELS) as MemberStatus[]).map((k) => (
                        <option key={k} value={k}>{MEMBER_STATUS_LABELS[k]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="member-name">ชื่อ <span className="text-rose-600">*</span></label>
                  <input id="member-name" type="text" value={form.fullName}
                    onChange={(e) => set({ fullName: e.target.value })}
                    className={inputClass} required autoComplete="name" />
                </div>

                <div>
                  <label className={labelClass} htmlFor="addr">ที่อยู่</label>
                  <textarea id="addr" rows={2} value={form.address}
                    onChange={(e) => set({ address: e.target.value })}
                    placeholder="บรรทัดแรก / บรรทัดสอง (ถ้ามี)"
                    className={clsx(inputClass, 'resize-none leading-snug')} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass} htmlFor="tax-id">เลขผู้เสียภาษี</label>
                    <input id="tax-id" value={form.taxId}
                      onChange={(e) => set({ taxId: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="contact">ผู้ติดต่อ</label>
                    <input id="contact" value={form.contactPerson}
                      onChange={(e) => set({ contactPerson: e.target.value })}
                      className={inputClass} placeholder="มาซื้อ / ประสานงาน" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="min-w-0">
                    <label className={labelClass} htmlFor="member-email">อีเมล</label>
                    <input id="member-email" type="email" value={form.email}
                      onChange={(e) => set({ email: e.target.value })}
                      className={inputClass} autoComplete="email" />
                  </div>
                  <div className="min-w-0">
                    <label className={labelClass} htmlFor="member-phone">โทร</label>
                    <input id="member-phone" type="tel" value={form.phone}
                      onChange={(e) => set({ phone: e.target.value })}
                      className={clsx(inputClass, form.phone && !isValidPhoneLength(form.phone) && 'border-rose-400 ring-1 ring-rose-300')}
                      placeholder="มือถือ 10 หลัก / บ้าน 9 หลัก" autoComplete="tel" />
                    {form.phone && !isValidPhoneLength(form.phone) && (
                      <p className="mt-0.5 text-[9px] text-rose-600">ต้องเป็น 9 หลัก (บ้าน) หรือ 10 หลัก (มือถือ)</p>
                    )}
                  </div>
                  <div className="min-w-0">
                    <label className={labelClass} htmlFor="fax">แฟ็กซ์</label>
                    <input id="fax" type="tel" value={form.fax}
                      onChange={(e) => set({ fax: e.target.value })}
                      className={clsx(inputClass, form.fax && !isValidPhoneLength(form.fax) && 'border-rose-400 ring-1 ring-rose-300')}
                      placeholder="9 หลัก" autoComplete="tel" />
                    {form.fax && !isValidPhoneLength(form.fax) && (
                      <p className="mt-0.5 text-[9px] text-rose-600">ต้องเป็น 9 หลัก (บ้าน) หรือ 10 หลัก (มือถือ)</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass} htmlFor="member-type">ประเภท</label>
                    <select id="member-type" value={form.memberType}
                      onChange={(e) => set({ memberType: e.target.value as MemberType })}
                      className={inputClass}>
                      {(Object.keys(MEMBER_TYPE_LABELS) as MemberType[]).map((k) => (
                        <option key={k} value={k}>{MEMBER_TYPE_LABELS[k]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="member-branch">สาขา</label>
                    <select id="member-branch" value={form.branchId}
                      onChange={(e) => set({ branchId: e.target.value })}
                      className={inputClass}>
                      {BRANCHES.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* B2C: points prominent */}
                {form.customerType === 'b2c' && (
                  <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-violet-500">แต้มสะสม</p>
                    <p className="text-lg font-black tabular-nums text-violet-700">
                      {form.pointsBalance.toLocaleString('th-TH')}
                      <span className="ml-1 text-xs font-medium text-violet-400">แต้ม</span>
                    </p>
                  </div>
                )}
              </div>

              {/* ── Right column — staff / credit / pricing ── */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                  {form.customerType === 'b2b' ? 'ผู้ดูแล · เครดิต · วงเงิน' : 'ผู้ดูแลข้อมูล'}
                </p>

                {/* Staff selector */}
                <div>
                  <label className={labelClass} htmlFor="sales">พนักงานผู้ดูแลข้อมูล</label>
                  {salesSelectOptions.length === 0 ? (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] text-amber-900">
                      ยังไม่มีพนักงานในระบบ — ไปที่ <span className="font-semibold">การตั้งค่า → จัดการผู้ใช้</span>
                    </p>
                  ) : (
                    <select id="sales" value={form.salesStaffId}
                      onChange={(e) => set({ salesStaffId: e.target.value })}
                      className={inputClass}>
                      {salesSelectOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.displayNamePos}{s.username ? ` · ${s.username}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* B2B only: credit + pricing */}
                {form.customerType === 'b2b' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass} htmlFor="credit-limit">วงเงิน (฿)</label>
                        <input id="credit-limit" type="number" min={0} step={1} value={form.creditLimitBaht}
                          onChange={(e) => set({ creditLimitBaht: Math.max(0, Number(e.target.value) || 0) })}
                          className={inputClass} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={labelClass}>เครดิต</span>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <div className="flex items-center gap-1">
                            <input id="credit-days" type="number" min={0} max={99}
                              value={Math.min(99, form.creditTermDays)}
                              onChange={(e) => set({ creditTermDays: Math.min(99, Math.max(0, Math.floor(Number(e.target.value) || 0))) })}
                              className={tinyNumClass} title="วัน" />
                            <span className="text-[10px] text-slate-500">วัน</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input id="credit-months" type="number" min={0} max={99}
                              value={Math.min(99, form.creditTermMonths)}
                              onChange={(e) => set({ creditTermMonths: Math.min(99, Math.max(0, Math.floor(Number(e.target.value) || 0))) })}
                              className={tinyNumClass} title="เดือน" />
                            <span className="text-[10px] text-slate-500">ด.</span>
                          </div>
                          <label className="flex cursor-pointer items-center gap-1 text-[10px] font-medium text-slate-700">
                            <input type="checkbox" className="size-3.5 rounded border-slate-300"
                              checked={form.payAtMonthEnd}
                              onChange={(e) => set({ payAtMonthEnd: e.target.checked })} />
                            สิ้นเดือน
                          </label>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">ตัดวันที่</span>
                            <input id="cutoff-day" type="number" min={1} max={31}
                              value={form.cutOffDayOfMonth ?? ''}
                              onChange={(e) => {
                                const v = e.target.value
                                if (v === '') { set({ cutOffDayOfMonth: null }); return }
                                set({ cutOffDayOfMonth: Math.min(31, Math.max(1, Number(v) || 1)) })
                              }}
                              placeholder="—" className={tinyNumClass} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price tier — read-only from tier, manual override allowed */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">ระดับราคา · ช่วงวันที่มีผล</p>
                      <div className="mt-1 flex flex-nowrap items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
                        <span className="shrink-0 text-[10px] text-slate-500">ระดับ</span>
                        <div className="flex shrink-0 flex-nowrap gap-0.5">
                          {(Object.keys(MEMBER_PRICE_TIER_LABELS) as MemberPriceTier[]).map((tier) => (
                            <label key={tier} className={clsx(
                              'cursor-pointer shrink-0 whitespace-nowrap rounded border px-1 py-px text-[9px] font-medium leading-tight',
                              form.defaultPriceTier === tier
                                ? 'border-slate-800 bg-slate-800 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                            )}>
                              <input type="radio" name={tierRadioName} className="sr-only"
                                checked={form.defaultPriceTier === tier}
                                onChange={() => setTierDefault(tier)} />
                              {MEMBER_PRICE_TIER_LABELS[tier]}
                            </label>
                          ))}
                        </div>
                        <div className="ml-0.5 flex shrink-0 items-center gap-0.5 border-l border-slate-200 pl-1.5">
                          <span className="text-[10px] text-slate-600">+%</span>
                          <input type="number" min={0} max={99} step={1} value={form.markupPercent}
                            onChange={(e) => {
                              const n = Number(e.target.value)
                              set({ markupPercent: Number.isNaN(n) ? 0 : Math.min(99, Math.max(0, Math.round(n))) })
                            }}
                            className={tinyNumClass} />
                        </div>
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelClass}>วันที่เริ่มมีผล</label>
                          <input type="date" value={form.priceStartDate}
                            onChange={(e) => set({ priceStartDate: e.target.value })}
                            className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>วันที่สิ้นสุด</label>
                          <input type="date" value={form.priceEndDate}
                            onChange={(e) => set({ priceEndDate: e.target.value })}
                            className={inputClass} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* AR balance — both types */}
                <div className="grid grid-cols-2 gap-2">
                  {form.customerType === 'b2b' && (
                    <div>
                      <span className={labelClass}>แต้มสะสม</span>
                      <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium tabular-nums text-slate-800">
                        {form.pointsBalance.toLocaleString('th-TH')}
                      </div>
                    </div>
                  )}
                  <div className={form.customerType === 'b2b' ? '' : 'col-span-2'}>
                    <span className={labelClass}>ค้างชำระ</span>
                    <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium tabular-nums text-slate-800">
                      {form.arBalance > 0
                        ? <span className="text-amber-900">฿{form.arBalance.toLocaleString('th-TH')}</span>
                        : <span className="text-slate-500">—</span>}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] leading-snug text-slate-500">
                  ยอดแต้มและค้างชำระคำนวณจากบิล/ธุรกรรม — ไม่แก้ในฟอร์มนี้
                </p>

                <div>
                  <label className={labelClass} htmlFor="member-notes">หมายเหตุ</label>
                  <textarea id="member-notes" rows={2} value={form.notes}
                    onChange={(e) => set({ notes: e.target.value })}
                    className={clsx(inputClass, 'resize-y')} />
                </div>
              </div>
            </div>

            {/* เต็มความกว้าง — พับได้ */}
            <details className="mt-2 rounded-md border border-slate-100 bg-slate-50/50">
              <summary className="cursor-pointer list-none px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100/80">
                รายการสินค้าเฉพาะ (เลือกระดับราคา)
                {form.itemTierOverrides.length > 0 ? (
                  <span className="rounded bg-violet-100 px-1.5 py-0 text-[10px] text-violet-800">
                    {form.itemTierOverrides.length}
                  </span>
                ) : null}
              </summary>
              <div className="border-t border-slate-100 px-2 pb-2 pt-1">
                <div className="mb-1 flex justify-end">
                  <button
                    type="button"
                    onClick={addItemOverride}
                    className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    + แถว
                  </button>
                </div>
                <div className="overflow-x-auto rounded border border-slate-200 bg-white">
                  <table className="w-full min-w-[20rem] border-collapse text-left text-[10px]">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-1 py-1">SKU</th>
                        <th className="px-1 py-1">ชื่อ</th>
                        <th className="px-1 py-1">ระดับ</th>
                        <th className="w-7 px-0 py-1" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.itemTierOverrides.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-2 py-2 text-center text-slate-500">
                            ไม่ระบุ = ราคาปกติ + ชุดด้านบน
                          </td>
                        </tr>
                      ) : (
                        form.itemTierOverrides.map((row) => (
                          <tr key={row.id} className="border-t border-slate-100">
                            <td className="p-0.5">
                              <input
                                value={row.sku}
                                onChange={(e) => updateOverride(row.id, { sku: e.target.value })}
                                className={clsx(inputClass, '!py-1')}
                              />
                            </td>
                            <td className="p-0.5">
                              <input
                                value={row.productName}
                                onChange={(e) => updateOverride(row.id, { productName: e.target.value })}
                                className={clsx(inputClass, '!py-1')}
                              />
                            </td>
                            <td className="p-0.5">
                              <select
                                value={row.tier}
                                onChange={(e) =>
                                  updateOverride(row.id, { tier: e.target.value as MemberPriceTier })
                                }
                                className={clsx(inputClass, '!py-1')}
                              >
                                {(Object.keys(MEMBER_PRICE_TIER_LABELS) as MemberPriceTier[]).map((t) => (
                                  <option key={t} value={t}>
                                    {MEMBER_PRICE_TIER_LABELS[t]}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-0.5">
                              <button
                                type="button"
                                onClick={() => removeOverride(row.id)}
                                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                                aria-label="ลบ"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-white px-3 py-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-md border border-violet-300 bg-violet-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-violet-700"
            >
              {mode === 'create' ? 'บันทึก' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
