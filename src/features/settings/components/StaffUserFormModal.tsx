import {
  STAFF_STATUS_LABELS,
  isValidNationalIdDigits,
  normalizeNationalIdDigits,
  type StaffStatus,
  type StaffUser,
} from '@/features/settings/data/mockStaffUsers'
import { clsx } from 'clsx'
import { ImagePlus, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'

const MAX_PHOTO_BYTES = 2 * 1024 * 1024

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300'
const labelClass = 'mb-1 block text-xs font-medium text-slate-600'

export type StaffUserFormValues = {
  username: string
  displayNamePos: string
  nationalId: string
  photoDataUrl: string | null
  password: string
  role: string
  startDate: string
  status: StaffStatus
}

type StaffUserFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: StaffUser | null
  onClose: () => void
  onSubmit: (values: StaffUserFormValues) => void
}

function emptyForm(): StaffUserFormValues {
  return {
    username: '',
    displayNamePos: '',
    nationalId: '',
    photoDataUrl: null,
    password: '',
    role: '',
    startDate: new Date().toISOString().slice(0, 10),
    status: 'active',
  }
}

function toForm(u: StaffUser): StaffUserFormValues {
  return {
    username: u.username,
    displayNamePos: u.displayNamePos,
    nationalId: u.nationalId,
    photoDataUrl: u.photoDataUrl,
    password: u.password.includes('•') ? '' : u.password,
    role: u.role,
    startDate: u.startDate,
    status: u.status,
  }
}

export function StaffUserFormModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: StaffUserFormModalProps) {
  const titleId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<StaffUserFormValues>(emptyForm)
  const [nationalIdError, setNationalIdError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setNationalIdError(null)
    setPhotoError(null)
    if (mode === 'edit' && initial) setForm(toForm(initial))
    else setForm(emptyForm())
  }, [open, mode, initial])

  if (!open) return null

  const handlePhotoFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setPhotoError('เลือกไฟล์รูปภาพเท่านั้น')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('ขนาดไฟล์ไม่เกิน 2 MB')
      return
    }
    setPhotoError(null)
    const reader = new FileReader()
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : null
      setForm((f) => ({ ...f, photoDataUrl: url }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.username.trim() || !form.displayNamePos.trim()) return
    if (mode === 'create' && !form.password.trim()) return
    const nid = normalizeNationalIdDigits(form.nationalId)
    if (!isValidNationalIdDigits(nid)) {
      setNationalIdError('กรอกเลขบัตรประชาชนไม่ครบ 13 หลัก')
      return
    }
    setNationalIdError(null)
    onSubmit({ ...form, nationalId: nid })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[min(92vh,48rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 id={titleId} className="text-base font-semibold text-slate-900">
            {mode === 'create' ? 'เพิ่มพนักงาน' : 'แก้ไขพนักงาน'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="ปิด"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
            <div>
              <label className={labelClass} htmlFor="su-username">
                Username <span className="text-slate-600">*</span>
              </label>
              <input
                id="su-username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className={clsx(inputClass, mode === 'edit' && 'bg-slate-50')}
                readOnly={mode === 'edit'}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="su-password">
                รหัสผ่าน {mode === 'create' && <span className="text-slate-600">*</span>}
              </label>
              <input
                id="su-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={inputClass}
                placeholder={mode === 'edit' ? 'เว้นว่างถ้าไม่เปลี่ยน' : ''}
                autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                required={mode === 'create'}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                ตัวอย่างนี้เก็บใน mock เท่านั้น — ระบบจริงต้องเข้ารหัส
              </p>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="su-display">
              ชื่อแสดงที่ POS (หน้าคิดเงิน) <span className="text-slate-600">*</span>
            </label>
            <input
              id="su-display"
              value={form.displayNamePos}
              onChange={(e) => setForm((f) => ({ ...f, displayNamePos: e.target.value }))}
              className={inputClass}
              required
              placeholder="เช่น Ang — แคชเชียร์"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="su-national-id">
              เลขบัตรประชาชน <span className="text-slate-600">*</span>
            </label>
            <input
              id="su-national-id"
              inputMode="numeric"
              autoComplete="off"
              value={form.nationalId}
              onChange={(e) => {
                setNationalIdError(null)
                setForm((f) => ({
                  ...f,
                  nationalId: normalizeNationalIdDigits(e.target.value),
                }))
              }}
              className={clsx(inputClass, nationalIdError && 'border-slate-400 ring-1 ring-slate-300')}
              placeholder="กรอกเลข 13 หลัก"
              maxLength={13}
              required
              aria-invalid={!!nationalIdError}
            />
            <p className="mt-1 text-[11px] text-slate-500">เก็บเฉพาะตัวเลข 13 หลัก (mock — ระบบจริงต้องเข้ารหัสตาม PDPA)</p>
            {nationalIdError && (
              <p className="mt-1 text-xs text-slate-600" role="alert">
                {nationalIdError}
              </p>
            )}
          </div>

          <div>
            <span className={labelClass}>รูปพนักงาน</span>
            <div className="flex flex-wrap items-start gap-3">
              <div
                className={clsx(
                  'flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50',
                  form.photoDataUrl && 'border-solid',
                )}
              >
                {form.photoDataUrl ? (
                  <img
                    src={form.photoDataUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <ImagePlus className="size-10 text-slate-300" aria-hidden />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={handlePhotoFile}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    เลือกรูป
                  </button>
                  {form.photoDataUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, photoDataUrl: null }))}
                      className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200"
                    >
                      ลบรูป
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">JPEG, PNG, WebP, GIF ไม่เกิน 2 MB — เก็บเป็น data URL ใน mock</p>
                {photoError && (
                  <p className="text-xs text-slate-600" role="alert">
                    {photoError}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="su-role">
              หน้าที่ / ตำแหน่ง
            </label>
            <input
              id="su-role"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className={inputClass}
              placeholder="เช่น SALE, STOCK, MANAGER"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="su-start">
              วันที่เริ่มทำงาน
            </label>
            <input
              id="su-start"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="su-status">
              สถานะ
            </label>
            <select
              id="su-status"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as StaffStatus }))
              }
              className={inputClass}
            >
              {(Object.keys(STAFF_STATUS_LABELS) as StaffStatus[]).map((k) => (
                <option key={k} value={k}>
                  {STAFF_STATUS_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
