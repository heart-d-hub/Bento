import type { InventoryProduct } from '@/features/inventory/data/mockInventory'
import {
  appendFullRollPartsForProduct,
  getRollStateForProduct,
  loadRollStock,
  usesPerRollWeightTracking,
} from '@/features/pos/data/posLiveStock'
import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

function localDateInputValue(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseKg(s: string): number {
  const t = s.trim().replace(',', '.')
  const n = Number(t)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 1000) / 1000
}

const inputRowClass =
  'rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm tabular-nums outline-none ring-teal-500/15 focus:border-teal-500 focus:ring-2'

type AddFullRollsModalProps = {
  open: boolean
  product: InventoryProduct | null
  /** กก./ม้วนหรือ ม./ม้วนจากมาสเตอร์ — ใส่ช่องเป็นค่าเริ่มต้นเมื่อ > 0 */
  defaultNominalPerRoll?: number
  onClose: () => void
}

export function AddFullRollsModal({ open, product, defaultNominalPerRoll, onClose }: AddFullRollsModalProps) {
  const [countStr, setCountStr] = useState('1')
  const [kgStr, setKgStr] = useState('')
  const [dateStr, setDateStr] = useState(() => localDateInputValue())

  useEffect(() => {
    if (!open || !product) return
    setCountStr('1')
    setKgStr(
      defaultNominalPerRoll != null && defaultNominalPerRoll > 0 ? String(defaultNominalPerRoll) : '',
    )
    setDateStr(localDateInputValue())
  }, [open, product, defaultNominalPerRoll])

  if (!open || !product) return null

  const p = product
  const isMeterRoll = p.stockMode === 'meter_roll'
  const perRollFieldLabel = isMeterRoll ? 'ม./ม้วน' : 'กก./ม้วน'
  const perRollAria = isMeterRoll ? 'เมตรต่อม้วน' : 'กิโลกรัมต่อม้วน'
  const amountNoun = isMeterRoll ? 'เมตร' : 'กก.'
  const roll = getRollStateForProduct(p, loadRollStock())
  const legacyFullRolls = !usesPerRollWeightTracking(roll) ? Math.max(0, Math.floor(roll.fullRolls)) : 0

  const handleClose = () => {
    onClose()
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const n = Math.max(0, Math.floor(Number(countStr.trim().replace(',', '.')) || 0))
    const kg = parseKg(kgStr)
    if (n < 1) {
      window.alert('กรอกจำนวนม้วนที่เพิ่มอย่างน้อย 1')
      return
    }
    if (kg <= 1e-6) {
      window.alert(`กรอก${amountNoun}ต่อม้วนให้มากกว่า 0`)
      return
    }
    try {
      appendFullRollPartsForProduct(p.id, n, kg, dateStr)
      handleClose()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
    }
  }

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-3">
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="ปิด" onClick={handleClose} />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="add-full-rolls-title"
        className="relative z-10 w-full max-w-[26rem] rounded-xl border border-slate-200/95 bg-white p-3 shadow-lg shadow-slate-300/40"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="min-w-0">
            <h2 id="add-full-rolls-title" className="text-sm font-semibold text-slate-900">
              เพิ่มม้วนเต็ม
            </h2>
            <p className="truncate text-[10px] text-slate-500" title={`${p.sku} · ${p.name}`}>
              {p.sku} · {p.name}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="ปิด"
            onClick={handleClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <p
          className="mt-2 line-clamp-2 text-[10px] leading-snug text-slate-500"
          title={`ม้วนที่บันทึกจากหน้าต่างนี้ — ใช้${amountNoun} และวันที่ตามแถวด้านล่างเหมือนกันทุกม้วนในรอบนี้`}
        >
          <span className="font-medium text-slate-700">ม้วนเดียวกัน</span> = รอบนี้ในหน้าต่างนี้ ใช้{amountNoun}·วันที่เดียวกันทุกม้วน
        </p>

        {legacyFullRolls > 0 ? (
          <p
            className="mt-1.5 line-clamp-3 rounded-md border border-amber-200/90 bg-amber-50/80 px-2 py-1.5 text-[10px] leading-snug text-amber-950"
            title={`มีม้วนเต็มแบบนับจำนวน ${legacyFullRolls} ม้วน — แปลงเป็นม้วนละ${amountNoun} ด้วย${amountNoun}·วันที่ในแถวด้านล่าง แล้วเพิ่มม้วนใหม่ตามจำนวน`}
          >
            นับจำนวน {legacyFullRolls} ม้วนอยู่ — จะแปลงด้วย{amountNoun}·วันที่ในแถวด้านล่าง แล้วค่อยเพิ่มตามจำนวน
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-2.5">
          <div className="flex flex-wrap items-end gap-x-2 gap-y-2">
            <label className="flex w-[4.5rem] min-w-[4rem] shrink-0 flex-col gap-0.5">
              <span className="text-[10px] font-medium text-slate-600">จำนวน</span>
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={countStr}
                onChange={(e) => setCountStr(e.target.value)}
                className={clsx(inputRowClass, 'w-full')}
                aria-label="เพิ่มม้วน จำนวน"
              />
            </label>
            <label className="flex min-w-[5.25rem] max-w-[6.5rem] flex-1 flex-col gap-0.5">
              <span className="text-[10px] font-medium text-slate-600">{perRollFieldLabel}</span>
              <input
                type="text"
                inputMode="decimal"
                value={kgStr}
                onChange={(e) => setKgStr(e.target.value)}
                placeholder={isMeterRoll ? '100' : '50'}
                className={clsx(inputRowClass, 'w-full')}
                aria-label={perRollAria}
              />
            </label>
            <label className="flex min-w-[9.25rem] flex-[1.15] flex-col gap-0.5 sm:min-w-[10rem]">
              <span className="text-[10px] font-medium text-slate-600" title="ไม่บังคับ">
                วันที่รับ
              </span>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className={clsx(inputRowClass, 'w-full min-w-0 text-xs')}
                aria-label="วันที่รับ ไม่บังคับ"
              />
            </label>
          </div>

          <div className="mt-2.5 flex justify-end gap-1.5 border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
