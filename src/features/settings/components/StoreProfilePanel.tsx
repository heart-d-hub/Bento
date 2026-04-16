import { type StoreProfile } from '@/features/settings/data/mockStoreProfile'
import { loadStoreProfile, saveStoreProfile } from '@/features/settings/data/storeProfileStore'
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
