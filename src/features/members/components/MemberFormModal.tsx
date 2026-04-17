import {
  MEMBER_PRICE_TIER_LABELS,
  MOCK_SALES_STAFF,
  type MemberItemTierOverride,
  type MemberPriceTier,
} from '@/features/members/data/memberTypes'
import {
  MEMBER_STATUS_LABELS,
  MEMBER_TYPE_LABELS,
  type Member,
  type MemberStatus,
  type MemberType,
} from '@/features/members/data/mockMembers'
import { clsx } from 'clsx'
import { Trash2, X } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'

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

function emptyForm(suggestedCode: string): MemberFormValues {
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
    salesStaffId: MOCK_SALES_STAFF[0]?.id ?? 's1',
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
    defaultBranch: 'สาขา 1',
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
  const [form, setForm] = useState<MemberFormValues>(() =>
    mode === 'edit' && initial ? memberToForm(initial) : emptyForm(suggestedCode),
  )

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      setForm(memberToForm(initial))
    } else {
      setForm(emptyForm(suggestedCode))
    }
  }, [open, mode, initial, suggestedCode])

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
    onSubmit(form)
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
            <div className="grid gap-x-4 gap-y-2 lg:grid-cols-2">
              {/* คอลัมน์ซ้าย — ตัวตน / ที่อยู่ / ติดต่อ */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">ข้อมูลทั่วไป</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass} htmlFor="member-code">
                      รหัส
                    </label>
                    <input
                      id="member-code"
                      type="text"
                      value={form.memberCode}
                      onChange={(e) => set({ memberCode: e.target.value })}
                      className={clsx(inputClass, mode === 'edit' && 'bg-slate-50 text-slate-600')}
                      readOnly={mode === 'edit'}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="member-status">
                      สถานะ
                    </label>
                    <select
                      id="member-status"
                      value={form.status}
                      onChange={(e) => set({ status: e.target.value as MemberStatus })}
                      className={inputClass}
                    >
                      {(Object.keys(MEMBER_STATUS_LABELS) as MemberStatus[]).map((k) => (
                        <option key={k} value={k}>
                          {MEMBER_STATUS_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="member-name">
                    ชื่อ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="member-name"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => set({ fullName: e.target.value })}
                    className={inputClass}
                    required
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="addr">
                    ที่อยู่
                  </label>
                  <textarea
                    id="addr"
                    rows={2}
                    value={form.address}
                    onChange={(e) => set({ address: e.target.value })}
                    placeholder="บรรทัดแรก / บรรทัดสอง (ถ้ามี)"
                    className={clsx(inputClass, 'resize-none leading-snug')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass} htmlFor="tax-id">
                      เลขผู้เสียภาษี
                    </label>
                    <input
                      id="tax-id"
                      value={form.taxId}
                      onChange={(e) => set({ taxId: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="contact">
                      ผู้ติดต่อ
                    </label>
                    <input
                      id="contact"
                      value={form.contactPerson}
                      onChange={(e) => set({ contactPerson: e.target.value })}
                      className={inputClass}
                      placeholder="มาซื้อ / ประสานงาน"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="min-w-0">
                    <label className={labelClass} htmlFor="member-email">
                      อีเมล
                    </label>
                    <input
                      id="member-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => set({ email: e.target.value })}
                      className={inputClass}
                      autoComplete="email"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className={labelClass} htmlFor="member-phone">
                      โทร
                    </label>
                    <input
                      id="member-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => set({ phone: e.target.value })}
                      className={inputClass}
                      autoComplete="tel"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className={labelClass} htmlFor="fax">
                      แฟ็กซ์
                    </label>
                    <input
                      id="fax"
                      value={form.fax}
                      onChange={(e) => set({ fax: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass} htmlFor="member-type">
                      ประเภท
                    </label>
                    <select
                      id="member-type"
                      value={form.memberType}
                      onChange={(e) => set({ memberType: e.target.value as MemberType })}
                      className={inputClass}
                    >
                      {(Object.keys(MEMBER_TYPE_LABELS) as MemberType[]).map((k) => (
                        <option key={k} value={k}>
                          {MEMBER_TYPE_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="member-branch">
                      สาขา
                    </label>
                    <input
                      id="member-branch"
                      type="text"
                      value={form.defaultBranch}
                      onChange={(e) => set({ defaultBranch: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* คอลัมน์ขวา — เครดิต / ราคา / ระบบ */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                  Sales · เครดิต · วงเงิน
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass} htmlFor="sales">
                      Sales
                    </label>
                    <select
                      id="sales"
                      value={form.salesStaffId}
                      onChange={(e) => set({ salesStaffId: e.target.value })}
                      className={inputClass}
                    >
                      {MOCK_SALES_STAFF.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="credit-limit">
                      วงเงิน (฿)
                    </label>
                    <input
                      id="credit-limit"
                      type="number"
                      min={0}
                      step={1}
                      value={form.creditLimitBaht}
                      onChange={(e) => set({ creditLimitBaht: Math.max(0, Number(e.target.value) || 0) })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                  <div>
                    <label className={labelClass} htmlFor="credit-days">
                      เครดิต (วัน)
                    </label>
                    <input
                      id="credit-days"
                      type="number"
                      min={0}
                      max={99}
                      value={Math.min(99, form.creditTermDays)}
                      onChange={(e) => {
                        const n = Math.floor(Number(e.target.value) || 0)
                        set({ creditTermDays: Math.min(99, Math.max(0, n)) })
                      }}
                      className={tinyNumClass}
                      title="0–99 วัน"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="credit-months">
                      เครดิต (เดือน)
                    </label>
                    <input
                      id="credit-months"
                      type="number"
                      min={0}
                      max={99}
                      value={Math.min(99, form.creditTermMonths)}
                      onChange={(e) => {
                        const n = Math.floor(Number(e.target.value) || 0)
                        set({ creditTermMonths: Math.min(99, Math.max(0, n)) })
                      }}
                      className={tinyNumClass}
                      title="0–99 เดือน"
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-1 pb-0.5 text-[10px] font-medium text-slate-800">
                    <input
                      type="checkbox"
                      className="size-3.5 rounded border-slate-300"
                      checked={form.payAtMonthEnd}
                      onChange={(e) => set({ payAtMonthEnd: e.target.checked })}
                    />
                    สิ้นเดือน
                  </label>
                  <div className="flex items-end gap-1">
                    <span className="pb-1.5 text-[10px] font-medium text-slate-500">ตัดวันที่</span>
                    <div>
                      <label className="sr-only" htmlFor="cutoff-day">
                        ตัดวันที่ (1–31)
                      </label>
                      <input
                        id="cutoff-day"
                        type="number"
                        min={1}
                        max={31}
                        value={form.cutOffDayOfMonth ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          if (v === '') {
                            set({ cutOffDayOfMonth: null })
                            return
                          }
                          const n = Math.min(31, Math.max(1, Number(v) || 1))
                          set({ cutOffDayOfMonth: n })
                        }}
                        placeholder="—"
                        className={tinyNumClass}
                        title="วันที่ 1–31"
                      />
                    </div>
                  </div>
                </div>

                <p className="pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                  ระดับราคาเริ่มต้น · ช่วงวันที่มีผล
                </p>
                <div className="flex flex-nowrap items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
                  <span className="shrink-0 text-[10px] font-medium text-slate-500">ระดับ</span>
                  <div className="flex shrink-0 flex-nowrap gap-0.5">
                    {(Object.keys(MEMBER_PRICE_TIER_LABELS) as MemberPriceTier[]).map((tier) => (
                      <label
                        key={tier}
                        className={clsx(
                          'cursor-pointer shrink-0 whitespace-nowrap rounded border px-1 py-px text-[9px] font-medium leading-tight',
                          form.defaultPriceTier === tier
                            ? 'border-slate-800 bg-slate-800 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                        )}
                      >
                        <input
                          type="radio"
                          name={tierRadioName}
                          className="sr-only"
                          checked={form.defaultPriceTier === tier}
                          onChange={() => setTierDefault(tier)}
                        />
                        {MEMBER_PRICE_TIER_LABELS[tier]}
                      </label>
                    ))}
                  </div>
                  <div className="ml-0.5 flex shrink-0 items-center gap-0.5 border-l border-slate-200 pl-1.5">
                    <span className="text-[10px] font-medium text-slate-600">+%</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      step={1}
                      value={form.markupPercent}
                      onChange={(e) => {
                        const n = Number(e.target.value)
                        if (Number.isNaN(n)) {
                          set({ markupPercent: 0 })
                          return
                        }
                        set({ markupPercent: Math.min(99, Math.max(0, Math.round(n))) })
                      }}
                      className={tinyNumClass}
                      title="บวกเพิ่มจากราคาตามระดับที่เลือก (0–99)"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>วันที่เริ่มมีผล</label>
                    <input
                      type="date"
                      value={form.priceStartDate}
                      onChange={(e) => set({ priceStartDate: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>วันที่สิ้นสุด</label>
                    <input
                      type="date"
                      value={form.priceEndDate}
                      onChange={(e) => set({ priceEndDate: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className={labelClass}>แต้มสะสม</span>
                    <div
                      className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium tabular-nums text-slate-800"
                      title="อ่านอย่างเดียว"
                    >
                      {form.pointsBalance.toLocaleString('th-TH')}
                    </div>
                  </div>
                  <div>
                    <span className={labelClass}>ค้างชำระ</span>
                    <div
                      className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium tabular-nums text-slate-800"
                      title="อ่านอย่างเดียว"
                    >
                      {form.arBalance > 0 ? (
                        <span className="text-amber-900">฿{form.arBalance.toLocaleString('th-TH')}</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] leading-snug text-slate-500">
                  ยอดแต้มและค้างชำระคำนวณจากบิล/ธุรกรรม — ไม่แก้ในฟอร์มนี้ (เมื่อเชื่อม POS/ลูกหนี้จะอัปเดตอัตโนมัติ)
                </p>

                <div>
                  <label className={labelClass} htmlFor="member-notes">
                    หมายเหตุ
                  </label>
                  <textarea
                    id="member-notes"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => set({ notes: e.target.value })}
                    className={clsx(inputClass, 'resize-y')}
                  />
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
