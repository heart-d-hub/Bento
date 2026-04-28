import {
  createTransportCompany,
  upsertTransportCompany,
  type TransportCompany,
  type TransportDamageRate,
} from '@/features/transport/data/transportDirectoryStore'
import { clsx } from 'clsx'
import { Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type TransportCompanyModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initial: TransportCompany | null
  onClose: () => void
  onSaved: (c: TransportCompany) => void
}

const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100'
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500'
const numFieldClass =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100 text-right font-mono'

export function TransportCompanyModal({ open, mode, initial, onClose, onSaved }: TransportCompanyModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [contactName, setContactName] = useState('')
  const [lineId, setLineId] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [minDays, setMinDays] = useState('')
  const [maxDays, setMaxDays] = useState('')
  const [dmgSmall, setDmgSmall] = useState('')
  const [dmgNormal, setDmgNormal] = useState('')
  const [dmgLarge, setDmgLarge] = useState('')
  const [maxWeightKg, setMaxWeightKg] = useState('')
  const [claimSupport, setClaimSupport] = useState<boolean | null>(null)
  const [costRating, setCostRating] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      setName(initial.name)
      setPhone(initial.phone ?? '')
      setContactName(initial.contactName ?? '')
      setLineId(initial.lineId ?? '')
      setTrackingUrl(initial.trackingUrl ?? '')
      setNotes(initial.notes ?? '')
      setMinDays(initial.minDays != null ? String(initial.minDays) : '')
      setMaxDays(initial.maxDays != null ? String(initial.maxDays) : '')
      setDmgSmall(initial.damageRatePct?.small != null ? String(initial.damageRatePct.small) : '')
      setDmgNormal(initial.damageRatePct?.normal != null ? String(initial.damageRatePct.normal) : '')
      setDmgLarge(initial.damageRatePct?.large != null ? String(initial.damageRatePct.large) : '')
      setMaxWeightKg(initial.maxWeightKg != null ? String(initial.maxWeightKg) : '')
      setClaimSupport(initial.claimSupport ?? null)
      setCostRating(initial.costRating ?? null)
    } else {
      setName(''); setPhone(''); setContactName(''); setLineId(''); setTrackingUrl('')
      setNotes(''); setMinDays(''); setMaxDays(''); setDmgSmall(''); setDmgNormal('')
      setDmgLarge(''); setMaxWeightKg(''); setClaimSupport(null); setCostRating(null)
    }
  }, [open, mode, initial])

  if (!open) return null

  const optNum = (s: string) => { const n = parseFloat(s); return isNaN(n) ? undefined : n }

  const submit = () => {
    const nm = name.trim()
    if (!nm) { window.alert('กรุณากรอกชื่อบริษัทขนส่ง'); return }
    const dmg: TransportDamageRate = {}
    const s = optNum(dmgSmall); if (s != null) dmg.small = Math.min(100, s)
    const n = optNum(dmgNormal); if (n != null) dmg.normal = Math.min(100, n)
    const l = optNum(dmgLarge); if (l != null) dmg.large = Math.min(100, l)
    const partial = {
      name: nm,
      phone: phone.trim() || undefined,
      contactName: contactName.trim() || undefined,
      lineId: lineId.trim() || undefined,
      trackingUrl: trackingUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      minDays: optNum(minDays),
      maxDays: optNum(maxDays),
      damageRatePct: Object.keys(dmg).length > 0 ? dmg : undefined,
      maxWeightKg: optNum(maxWeightKg),
      claimSupport: claimSupport ?? undefined,
      costRating: costRating ?? undefined,
    }
    if (mode === 'edit' && initial) {
      const updated: TransportCompany = { ...initial, ...partial }
      upsertTransportCompany(updated)
      onSaved(updated)
    } else {
      onSaved(createTransportCompany(partial))
    }
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">
            {mode === 'create' ? 'เพิ่มบริษัทขนส่ง' : 'แก้ไขบริษัทขนส่ง'}
          </h2>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto space-y-4 px-5 py-5">
          {/* Name */}
          <div>
            <label className={labelClass}>ชื่อบริษัทขนส่ง *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="เช่น Flash Express" className={fieldClass} autoFocus />
          </div>

          {/* Phone + Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>เบอร์โทร</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="02-xxx-xxxx" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>ผู้ติดต่อ</label>
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)}
                placeholder="ชื่อ-นามสกุล" className={fieldClass} />
            </div>
          </div>

          {/* LINE + Tracking */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>LINE ID</label>
              <input type="text" value={lineId} onChange={(e) => setLineId(e.target.value)}
                placeholder="@line-id" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>ลิงก์ติดตามพัสดุ</label>
              <input type="text" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://..." className={fieldClass} />
            </div>
          </div>

          {/* Transit days + Max weight */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">ประสิทธิภาพการจัดส่ง</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>วันเร็วสุด</label>
                <div className="relative">
                  <input type="number" min={0} step={1} value={minDays}
                    onChange={(e) => setMinDays(e.target.value)}
                    placeholder="1" className={numFieldClass} />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">วัน</span>
                </div>
              </div>
              <div>
                <label className={labelClass}>วันช้าสุด</label>
                <div className="relative">
                  <input type="number" min={0} step={1} value={maxDays}
                    onChange={(e) => setMaxDays(e.target.value)}
                    placeholder="3" className={numFieldClass} />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">วัน</span>
                </div>
              </div>
              <div>
                <label className={labelClass}>น้ำหนักสูงสุด/กล่อง</label>
                <div className="relative">
                  <input type="number" min={0} step={0.5} value={maxWeightKg}
                    onChange={(e) => setMaxWeightKg(e.target.value)}
                    placeholder="30" className={numFieldClass} />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">กก.</span>
                </div>
              </div>
            </div>

            {/* Damage rate per box size */}
            <div>
              <label className={labelClass}>อัตราสินค้าเสียหาย / แตก (%)</label>
              <div className="grid grid-cols-3 gap-3">
                {([['เล็ก', dmgSmall, setDmgSmall], ['กลาง', dmgNormal, setDmgNormal], ['ใหญ่', dmgLarge, setDmgLarge]] as const).map(([label, val, set]) => (
                  <div key={label}>
                    <p className="mb-1 text-center text-[10px] text-slate-500">กล่อง{label}</p>
                    <div className="relative">
                      <input type="number" min={0} max={100} step={0.1}
                        value={val} onChange={(e) => set(e.target.value)}
                        placeholder="0"
                        className={clsx(numFieldClass, Number(val) > 5 ? 'border-rose-300 bg-rose-50' : Number(val) > 2 ? 'border-amber-300 bg-amber-50' : '')} />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-slate-400">เขียงจากประสบการณ์ — เช่น ส่ง 100 กล่อง แตก 2 กล่อง = 2%</p>
            </div>

            {/* Claim support */}
            <div>
              <label className={labelClass}>รับผิดชอบค่าเสียหาย / ประกันสินค้า</label>
              <div className="flex gap-2">
                {([['รับผิดชอบ', true], ['ไม่รับผิดชอบ', false]] as const).map(([label, val]) => (
                  <button key={label} type="button"
                    onClick={() => setClaimSupport(claimSupport === val ? null : val)}
                    className={clsx(
                      'flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors',
                      claimSupport === val
                        ? val ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-rose-400 bg-rose-500 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300',
                    )}>
                    {val ? '✓ ' : '✗ '}{label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cost rating */}
          <div>
            <label className={labelClass}>ระดับค่าบริการ</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button"
                  onClick={() => setCostRating(costRating === n ? null : n)}
                  className={clsx(
                    'flex-1 rounded-lg border py-1.5 text-sm font-bold transition-colors',
                    (costRating ?? 0) >= n
                      ? 'border-amber-400 bg-amber-400 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-300 hover:border-amber-300 hover:text-amber-400',
                  )}>
                  ฿
                </button>
              ))}
            </div>
            {costRating && (
              <p className="mt-1 text-[10px] text-slate-400">
                {costRating === 1 ? 'ถูกมาก' : costRating === 2 ? 'ถูก' : costRating === 3 ? 'ปานกลาง' : costRating === 4 ? 'แพง' : 'แพงมาก'}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>หมายเหตุ</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2} placeholder="ข้อมูลเพิ่มเติม..." className={fieldClass} />
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            ยกเลิก
          </button>
          <button type="button" onClick={submit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            <Save className="size-4" aria-hidden />
            บันทึก
          </button>
        </footer>
      </div>
    </div>
  )
}
