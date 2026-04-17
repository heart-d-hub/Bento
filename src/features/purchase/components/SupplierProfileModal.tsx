import { getSupplierCreditTerms, setSupplierCreditTerms } from '@/features/finance/data/creditTermsStore'
import { DEFAULT_SUPPLIER_CREDIT, describeSupplierCreditRule } from '@/features/finance/data/supplierPaymentDueDate'
import {
  createSupplierProfile,
  nextSupplierDisplayCode,
  upsertSupplierProfile,
  type SupplierProfile,
} from '@/features/purchase/data/supplierDirectoryStore'
import { Pencil, Save, UserPlus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

/** เลย์เอาต์ช่องตัวเลขเครดิตให้สอดคล้องกับฟอร์มสมาชิก */
const supplierCreditTinyNumClass =
  'h-6 w-[2rem] min-w-[2rem] shrink-0 rounded border border-slate-200 bg-white px-0.5 py-0 text-center text-[10px] font-medium tabular-nums text-slate-900 shadow-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200'
const supplierCreditLabelClass = 'mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500'

type SupplierProfileModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialProfile: SupplierProfile | null
  onClose: () => void
  onSaved: (profile: SupplierProfile, mode: 'create' | 'edit') => void
}

const SHIPPING_PRESET_OPTIONS = [
  { value: '', label: '-- ไม่ระบุ --' },
  { value: 'NIM Express', label: 'NIM Express' },
  { value: 'Kerry Express', label: 'Kerry Express' },
  { value: 'PL ขนส่ง', label: 'PL ขนส่ง' },
  { value: 'รับสินค้าเอง', label: 'รับสินค้าเอง' },
] as const

type PrimaryPaymentKey = 'cash' | 'transfer' | 'both' | 'credit'

function primaryPaymentFlags(k: PrimaryPaymentKey): { acceptsCash: boolean; acceptsTransfer: boolean } {
  if (k === 'cash') return { acceptsCash: true, acceptsTransfer: false }
  if (k === 'transfer') return { acceptsCash: false, acceptsTransfer: true }
  return { acceptsCash: true, acceptsTransfer: true }
}

function primaryPaymentFromProfile(p: SupplierProfile): PrimaryPaymentKey {
  const ac = p.acceptsCash !== false
  const at = p.acceptsTransfer !== false
  if (ac && !at) return 'cash'
  if (!ac && at) return 'transfer'
  if (ac && at) return 'both'
  return 'credit'
}

function parseBrandsComma(s: string): string[] | undefined {
  const parts = s
    .split(/[,，]/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
  return parts.length ? parts : undefined
}

type SupplierMasterFormProps = {
  mode: 'create' | 'edit'
  initialProfile: SupplierProfile | null
  onClose: () => void
  onSaved: (profile: SupplierProfile, mode: 'create' | 'edit') => void
}

function SupplierMasterForm({ mode, initialProfile, onClose, onSaved }: SupplierMasterFormProps) {
  const [name, setName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [lineId, setLineId] = useState('')
  const [primaryPayment, setPrimaryPayment] = useState<PrimaryPaymentKey>('cash')
  const [creditTermDays, setCreditTermDays] = useState(DEFAULT_SUPPLIER_CREDIT.creditDays)
  const [creditTermMonths, setCreditTermMonths] = useState(DEFAULT_SUPPLIER_CREDIT.creditMonths)
  const [payAtMonthEnd, setPayAtMonthEnd] = useState(DEFAULT_SUPPLIER_CREDIT.payAtEndOfDueMonth)
  const [cutOffDayOfMonth, setCutOffDayOfMonth] = useState<number | null>(null)
  const [excludePurchaseMonth, setExcludePurchaseMonth] = useState(DEFAULT_SUPPLIER_CREDIT.excludePurchaseMonth)
  const [address, setAddress] = useState('')
  const [defaultShipping, setDefaultShipping] = useState('')
  const [brandsText, setBrandsText] = useState('')

  useEffect(() => {
    if (mode === 'create') {
      setName('')
      setTaxId('')
      setContactName('')
      setPhone('')
      setLineId('')
      setPrimaryPayment('cash')
      setCreditTermDays(DEFAULT_SUPPLIER_CREDIT.creditDays)
      setCreditTermMonths(DEFAULT_SUPPLIER_CREDIT.creditMonths)
      setPayAtMonthEnd(DEFAULT_SUPPLIER_CREDIT.payAtEndOfDueMonth)
      setCutOffDayOfMonth(null)
      setExcludePurchaseMonth(DEFAULT_SUPPLIER_CREDIT.excludePurchaseMonth)
      setAddress('')
      setDefaultShipping('')
      setBrandsText('')
      return
    }
    if (!initialProfile) return
    const p = initialProfile
    setName(p.name)
    setTaxId(p.taxId ?? '')
    setContactName(p.contactName ?? '')
    setPhone(p.phone ?? '')
    setLineId(p.lineId ?? '')
    setPrimaryPayment(primaryPaymentFromProfile(p))
    setAddress(p.address ?? '')
    setDefaultShipping(p.defaultShipping ?? '')
    setBrandsText((p.brandsSold ?? []).join(', '))
    const c = getSupplierCreditTerms(p.id)
    setCreditTermDays(Math.min(99, Math.max(0, c.creditDays)))
    setCreditTermMonths(Math.min(99, Math.max(0, c.creditMonths ?? 0)))
    setPayAtMonthEnd(c.payAtEndOfDueMonth)
    setCutOffDayOfMonth(c.statementCutoffDay)
    setExcludePurchaseMonth(c.excludePurchaseMonth)
  }, [mode, initialProfile])

  const shippingSelectOptions = useMemo(() => {
    const v = defaultShipping.trim()
    const base = [...SHIPPING_PRESET_OPTIONS]
    if (v && !base.some((o) => o.value === v)) {
      return [{ value: v, label: v }, ...base]
    }
    return base
  }, [defaultShipping])

  const creditPreviewSlice = {
    creditDays: Math.min(99, Math.max(0, creditTermDays)),
    creditMonths: Math.min(99, Math.max(0, creditTermMonths)),
    payAtEndOfDueMonth: payAtMonthEnd,
    statementCutoffDay:
      cutOffDayOfMonth != null
        ? Math.min(31, Math.max(1, cutOffDayOfMonth))
        : DEFAULT_SUPPLIER_CREDIT.statementCutoffDay,
    excludePurchaseMonth,
  }

  const submit = () => {
    const nm = name.trim()
    if (!nm) {
      window.alert('กรุณากรอกชื่อร้าน/บริษัท')
      return
    }
    const flags = primaryPaymentFlags(primaryPayment)
    const cd = Math.min(99, Math.max(0, Math.floor(Number(creditTermDays) || 0)))
    const cm = Math.min(99, Math.max(0, Math.floor(Number(creditTermMonths) || 0)))
    const co =
      cutOffDayOfMonth != null ? Math.min(31, Math.max(1, Math.floor(cutOffDayOfMonth))) : DEFAULT_SUPPLIER_CREDIT.statementCutoffDay

    const termsPayload = {
      ...DEFAULT_SUPPLIER_CREDIT,
      creditDays: cd,
      creditMonths: cm,
      payAtEndOfDueMonth: payAtMonthEnd,
      statementCutoffDay: co,
      excludePurchaseMonth,
    }

    if (mode === 'create') {
      const created = createSupplierProfile({
        supplierCode: nextSupplierDisplayCode(),
        name: nm,
        taxId: taxId.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        contactName: contactName.trim() || undefined,
        lineId: lineId.trim() || undefined,
        brandsSold: parseBrandsComma(brandsText),
        defaultShipping: defaultShipping.trim() || undefined,
        acceptsCash: flags.acceptsCash,
        acceptsTransfer: flags.acceptsTransfer,
        regularProductCount: 0,
      })
      setSupplierCreditTerms(created.id, termsPayload)
      onSaved(created, 'create')
      onClose()
      return
    }

    if (!initialProfile?.id) return
    const profile: SupplierProfile = {
      ...initialProfile,
      name: nm,
      taxId: taxId.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      contactName: contactName.trim() || undefined,
      lineId: lineId.trim() || undefined,
      brandsSold: parseBrandsComma(brandsText),
      defaultShipping: defaultShipping.trim() || undefined,
      acceptsCash: flags.acceptsCash,
      acceptsTransfer: flags.acceptsTransfer,
    }
    upsertSupplierProfile(profile)
    setSupplierCreditTerms(profile.id, termsPayload)
    onSaved(profile, 'edit')
    onClose()
  }

  const title =
    mode === 'create' ? 'เพิ่มผู้จัดจำหน่ายใหม่ (Supplier Master)' : 'แก้ไขผู้จัดจำหน่าย (Supplier Master)'

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal>
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              {mode === 'create' ? <UserPlus className="size-5" aria-hidden /> : <Pencil className="size-5" aria-hidden />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="ปิด">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-[11px] font-medium text-slate-700">
              ชื่อร้าน/บริษัท <span className="text-rose-600">*</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                placeholder="เช่น บจก. ออโต้พาร์ท"
              />
            </label>
            <label className="block text-[11px] font-medium text-slate-700">
              เลขประจำตัวผู้เสียภาษี
              <input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                placeholder="เลข 13 หลัก"
                inputMode="numeric"
              />
            </label>
            <label className="block text-[11px] font-medium text-slate-700">
              ชื่อผู้ติดต่อ (เซลล์)
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                placeholder="เช่น คุณวิชัย"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-[11px] font-medium text-slate-700">
              เบอร์โทรศัพท์
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                placeholder="เช่น 02-123-4567"
              />
            </label>
            <label className="block text-[11px] font-medium text-slate-700">
              LINE ID
              <input
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                placeholder="เช่น @autopart"
              />
            </label>
            <label className="block text-[11px] font-medium text-slate-700">
              เงื่อนไขชำระเงินหลัก
              <select
                value={primaryPayment}
                onChange={(e) => setPrimaryPayment(e.target.value as PrimaryPaymentKey)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              >
                <option value="cash">เงินสด (Cash)</option>
                <option value="transfer">เงินโอน (Bank transfer)</option>
                <option value="both">เงินสด + โอน</option>
                <option value="credit">เครดิต (Credit)</option>
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">เครดิต</p>
            <div className="mt-1.5 flex flex-wrap items-end gap-x-2 gap-y-1">
              <div>
                <label className={supplierCreditLabelClass} htmlFor="sup-master-credit-days">
                  เครดิต (วัน)
                </label>
                <input
                  id="sup-master-credit-days"
                  type="number"
                  min={0}
                  max={99}
                  value={Math.min(99, creditTermDays)}
                  onChange={(e) => {
                    const n = Math.floor(Number(e.target.value) || 0)
                    setCreditTermDays(Math.min(99, Math.max(0, n)))
                  }}
                  className={supplierCreditTinyNumClass}
                  title="0–99 วัน"
                />
              </div>
              <div>
                <label className={supplierCreditLabelClass} htmlFor="sup-master-credit-months">
                  เครดิต (เดือน)
                </label>
                <input
                  id="sup-master-credit-months"
                  type="number"
                  min={0}
                  max={99}
                  value={Math.min(99, creditTermMonths)}
                  onChange={(e) => {
                    const n = Math.floor(Number(e.target.value) || 0)
                    setCreditTermMonths(Math.min(99, Math.max(0, n)))
                  }}
                  className={supplierCreditTinyNumClass}
                  title="0–99 เดือน"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-1 pb-0.5 text-[10px] font-medium text-slate-800">
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-slate-300"
                  checked={payAtMonthEnd}
                  onChange={(e) => setPayAtMonthEnd(e.target.checked)}
                />
                สิ้นเดือน
              </label>
              <div className="flex items-end gap-1">
                <span className="pb-1.5 text-[10px] font-medium text-slate-500">ตัดวันที่</span>
                <div>
                  <label className="sr-only" htmlFor="sup-master-cutoff">
                    ตัดวันที่ (1–31)
                  </label>
                  <input
                    id="sup-master-cutoff"
                    type="number"
                    min={1}
                    max={31}
                    value={cutOffDayOfMonth ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '') {
                        setCutOffDayOfMonth(null)
                        return
                      }
                      const n = Math.min(31, Math.max(1, Number(v) || 1))
                      setCutOffDayOfMonth(n)
                    }}
                    placeholder="—"
                    className={supplierCreditTinyNumClass}
                    title="ว่าง = ใช้ค่าเริ่มต้น 25 · หรือระบุ 1–31"
                  />
                </div>
              </div>
            </div>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={excludePurchaseMonth}
                onChange={(e) => setExcludePurchaseMonth(e.target.checked)}
                className="rounded"
              />
              ไม่รวมเดือนซื้อ
            </label>
            <p className="mt-2 rounded border border-slate-100 bg-white px-2 py-1.5 text-[10px] leading-relaxed text-slate-600">
              {describeSupplierCreditRule({
                ...DEFAULT_SUPPLIER_CREDIT,
                ...creditPreviewSlice,
              })}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <label className="block text-[11px] font-medium text-slate-700 lg:col-span-1">
              ที่อยู่ (สำหรับการเปิดบิล/ออกใบกำกับภาษี)
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
              />
            </label>
            <label className="block text-[11px] font-medium text-slate-700">
              ขนส่งประจำ
              <select
                value={defaultShipping}
                onChange={(e) => setDefaultShipping(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              >
                {shippingSelectOptions.map((o) => (
                  <option key={`${o.value}-${o.label}`} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-[11px] font-medium text-slate-700">
            แบรนด์ / ยี่ห้อสินค้าที่จำหน่าย (คั่นด้วยลูกน้ำ ,)
            <input
              value={brandsText}
              onChange={(e) => setBrandsText(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              placeholder="เช่น Brembo, NSK, BOSCH, Toyota"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-900"
          >
            <Save className="size-4" aria-hidden />
            บันทึกข้อมูล
          </button>
        </div>
      </div>
    </div>
  )
}

export function SupplierProfileModal({ open, mode, initialProfile, onClose, onSaved }: SupplierProfileModalProps) {
  if (!open) return null
  if (mode === 'edit' && !initialProfile) return null
  return <SupplierMasterForm mode={mode} initialProfile={initialProfile} onClose={onClose} onSaved={onSaved} />
}
