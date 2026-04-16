import type { InventoryProduct } from '@/features/inventory/data/mockInventory'
import {
  getRollStateForProduct,
  loadRollStock,
  openFullRollPartById,
  openOneLegacyFullRollFromStorage,
  sortFullRollPartsFifo,
  usesPerRollWeightTracking,
  type FullRollPart,
} from '@/features/pos/data/posLiveStock'
import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

function formatReceivedDateTh(d?: string): string {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return '—'
  const [y, m, day] = d.split('-').map(Number)
  const dt = new Date(y, m - 1, day)
  return dt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

type UnpackFullRollModalProps = {
  open: boolean
  product: InventoryProduct | null
  /** กก./ม้วนหรือ ม./ม้วน จากมาสเตอร์ — ใช้แกะม้วนเต็มแบบนับจำนวน (legacy) */
  nominalPerRoll: number
  onClose: () => void
}

export function UnpackFullRollModal({ open, product, nominalPerRoll, onClose }: UnpackFullRollModalProps) {
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)

  const { sorted, legacyFull } = useMemo(() => {
    if (!open || !product) return { sorted: [] as FullRollPart[], legacyFull: 0 }
    const roll = getRollStateForProduct(product, loadRollStock())
    const list: FullRollPart[] = roll.fullRollParts ? sortFullRollPartsFifo(roll.fullRollParts) : []
    const legacy = !usesPerRollWeightTracking(roll) ? Math.max(0, Math.floor(roll.fullRolls)) : 0
    return { sorted: list, legacyFull: legacy }
  }, [open, product])

  useEffect(() => {
    if (!open || !product) return
    const roll = getRollStateForProduct(product, loadRollStock())
    const list = roll.fullRollParts ? sortFullRollPartsFifo(roll.fullRollParts) : []
    setSelectedPartId(list[0]?.id ?? null)
  }, [open, product?.id])

  if (!open || !product) return null

  const p = product
  const isMeterRoll = p.stockMode === 'meter_roll'
  const perRollShort = isMeterRoll ? 'ม./ม้วน' : 'กก./ม้วน'
  const amountNoun = isMeterRoll ? 'เมตร' : 'กก.'
  const nominalOk = nominalPerRoll > 1e-6

  const handleClose = () => onClose()

  const handleUnpackSelected = () => {
    if (!selectedPartId) {
      window.alert('เลือกม้วนที่จะแกะ')
      return
    }
    try {
      openFullRollPartById(p.id, selectedPartId)
      handleClose()
    } catch {
      window.alert('แกะม้วนไม่สำเร็จ — ลองปิดแล้วเปิดใหม่ หรือตรวจสต็อก')
    }
  }

  const handleUnpackLegacyFifo = () => {
    if (!nominalOk) {
      window.alert(`ตั้ง ${perRollShort} ในมาสเตอร์ หรือใช้ +ม้วนเต็ม เพื่อมีรายการ${amountNoun} ต่อม้วน`)
      return
    }
    try {
      openOneLegacyFullRollFromStorage(p.id, nominalPerRoll)
      handleClose()
    } catch {
      window.alert('ไม่มีม้วนเต็มให้แกะ')
    }
  }

  const hasPerRollList = sorted.length > 0
  const hasLegacyOnly = !hasPerRollList && legacyFull > 0
  const empty = !hasPerRollList && legacyFull <= 0

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-3">
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="ปิด" onClick={handleClose} />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="unpack-roll-title"
        className="relative z-10 w-full max-w-[22rem] rounded-xl border border-slate-200/95 bg-white p-3 shadow-lg shadow-slate-300/40"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="min-w-0">
            <h2 id="unpack-roll-title" className="text-sm font-semibold text-slate-900">
              แกะม้วน
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

        {empty ? (
          <p className="mt-3 text-center text-xs text-slate-600">ไม่มีม้วนเต็มให้แกะ</p>
        ) : null}

        {hasPerRollList ? (
          <>
            <p className="mt-2 text-[10px] leading-snug text-slate-500">
              เลือกม้วน (เรียงเก่าก่อน) — แสดง{amountNoun} และวันที่รับ
            </p>
            <ul
              className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/80 p-1.5"
              role="listbox"
              aria-label="ม้วนเต็ม"
            >
              {sorted.map((part) => {
                const active = selectedPartId === part.id
                return (
                  <li key={part.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => setSelectedPartId(part.id)}
                      className={clsx(
                        'flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition',
                        active
                          ? 'border-amber-400 bg-amber-50 text-amber-950'
                          : 'border-transparent bg-white text-slate-800 hover:border-slate-200',
                      )}
                    >
                      <span className="tabular-nums font-semibold">
                        {part.kg.toLocaleString('th-TH', { maximumFractionDigits: 3 })}{' '}
                        {isMeterRoll ? 'ม.' : 'กก.'}
                      </span>
                      <span className="shrink-0 text-[10px] text-slate-600">
                        {formatReceivedDateTh(part.receivedDate)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-2.5 flex justify-end gap-1.5 border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleUnpackSelected}
                disabled={!selectedPartId}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                แกะม้วนนี้
              </button>
            </div>
          </>
        ) : null}

        {hasLegacyOnly ? (
          <div className="mt-2.5 space-y-2">
            <p className="text-[11px] leading-snug text-slate-700">
              ม้วนเต็มแบบนับจำนวน <span className="font-semibold tabular-nums">{legacyFull}</span> ม้วน
              {nominalOk ? (
                <>
                  {' '}
                  · {perRollShort}{' '}
                  <span className="font-medium tabular-nums text-slate-900">
                    {nominalPerRoll.toLocaleString('th-TH', { maximumFractionDigits: 3 })}
                  </span>{' '}
                  {isMeterRoll ? 'ม.' : 'กก.'} (FIFO — ม้วนแรกในลำดับ)
                </>
              ) : (
                <span className="block text-amber-800"> — ยังไม่มี {perRollShort} ในมาสเตอร์</span>
              )}
            </p>
            <div className="flex justify-end gap-1.5 border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleUnpackLegacyFifo}
                disabled={!nominalOk}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                แกะ 1 ม้วน
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
