import { type StoreProfile } from '@/features/settings/data/mockStoreProfile'
import { loadStoreProfile, saveStoreProfile } from '@/features/settings/data/storeProfileStore'
import { loadCostingMethod, saveCostingMethod, type CostingMethod } from '@/features/settings/data/costingMethodStore'
import { type ChangeEvent, type ReactNode, useState } from 'react'

function Field({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  )
}

export function StoreProfilePanel() {
  const [values, setValues] = useState<StoreProfile>(() => loadStoreProfile())
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [costingMethod, setCostingMethodState] = useState<CostingMethod>(() => loadCostingMethod())

  const handleCostingMethod = (m: CostingMethod) => {
    setCostingMethodState(m)
    saveCostingMethod(m)
  }

  const patchField =
    (key: keyof StoreProfile) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }))
      setSavedAt(null)
    }

  const handleSave = () => {
    saveStoreProfile(values)
    setSavedAt(Date.now())
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="store-name" label="ชื่อร้าน / นิติบุคคล">
            <input
              id="store-name"
              type="text"
              value={values.storeName}
              onChange={patchField('storeName')}
              autoComplete="organization"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </Field>
          <Field id="tax-id" label="เลขประจำตัวผู้เสียภาษี">
            <input
              id="tax-id"
              type="text"
              value={values.taxId}
              onChange={patchField('taxId')}
              inputMode="numeric"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </Field>
          <Field id="phone" label="เบอร์โทรศัพท์">
            <input
              id="phone"
              type="tel"
              value={values.phone}
              onChange={patchField('phone')}
              autoComplete="tel"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </Field>
          <Field id="email" label="อีเมล">
            <input
              id="email"
              type="email"
              value={values.email}
              onChange={patchField('email')}
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field id="address" label="ที่อยู่">
              <textarea
                id="address"
                value={values.address}
                onChange={patchField('address')}
                rows={3}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
              />
            </Field>
          </div>

          {/* VAT registration toggle */}
          <div className="sm:col-span-2">
            <div className={`rounded-xl border p-4 ${values.vatRegistered ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">จดทะเบียนภาษีมูลค่าเพิ่ม (VAT)</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {values.vatRegistered
                      ? 'เปิด — ระบบจะหัก VAT ออกจากต้นทุนสต็อก (VAT ขอคืนจากสรรพากรได้)'
                      : 'ปิด — VAT ที่จ่ายให้ vendor ถือเป็นต้นทุนสินค้า (บวกเข้าราคาทุน)'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={values.vatRegistered}
                  onClick={() => setValues((v) => ({ ...v, vatRegistered: !v.vatRegistered }))}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${values.vatRegistered ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span
                    className={`inline-block size-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform ${values.vatRegistered ? 'translate-x-5' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
            </div>
          </div>
          {/* Costing method */}
          <div className="sm:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-800">วิธีคิดต้นทุนสินค้า</p>
              <p className="mt-0.5 text-xs text-slate-500">ใช้สำหรับแนะนำราคาใน PO และแสดงต้นทุนในรายงาน</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-3">
                {([
                  { value: 'average' as const, label: 'ต้นทุนเฉลี่ย (Moving Average)', desc: 'เฉลี่ยราคาทุกล็อตที่รับเข้า — ราคาคงที่สม่ำเสมอ' },
                  { value: 'latest'  as const, label: 'ต้นทุนล่าสุด (Latest Cost)',    desc: 'ใช้ราคา PO receive ล่าสุด — สะท้อนราคาตลาดปัจจุบัน' },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleCostingMethod(opt.value)}
                    className={`flex flex-1 flex-col gap-0.5 rounded-xl border px-4 py-3 text-left transition ${
                      costingMethod === opt.value
                        ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-400'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-sm font-semibold ${costingMethod === opt.value ? 'text-amber-800' : 'text-slate-700'}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-slate-500">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            บันทึก
          </button>
          {savedAt !== null && (
            <p className="text-sm text-emerald-700" role="status">
              บันทึกแล้ว (mock — ยังไม่ส่งเซิร์ฟเวอร์)
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        ข้อมูลนี้ใช้แสดงบนเอกสารและใบกำกับภาษีเมื่อเชื่อมต่อ backend
      </p>
    </div>
  )
}
