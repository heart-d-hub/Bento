import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Medal, X } from 'lucide-react'
import {
  loadLoyaltyConfig,
  maxRedeemablePoints,
  pointsToBaht,
  validateRedeem,
} from '@/features/loyalty/data/loyaltyConfig'

type RedeemPointsModalProps = {
  open: boolean
  onClose: () => void
  customerName: string
  availablePoints: number
  /** ยอดบิลปัจจุบัน (หลังหักส่วนลดอื่น แต่ก่อน VAT include/exclude) — ใช้คำนวณ cap */
  billGrandTotalBaht: number
  /** แต้มที่ user เลือกไว้แล้ว (เพื่อให้แก้/ปรับได้) */
  initialPoints: number
  onConfirm: (points: number) => void
  isDark?: boolean
}

export function RedeemPointsModal({
  open,
  onClose,
  customerName,
  availablePoints,
  billGrandTotalBaht,
  initialPoints,
  onConfirm,
  isDark,
}: RedeemPointsModalProps) {
  const config = useMemo(() => loadLoyaltyConfig(), [open])
  const [pointsInput, setPointsInput] = useState(initialPoints > 0 ? String(initialPoints) : '')

  useEffect(() => {
    if (open) {
      setPointsInput(initialPoints > 0 ? String(initialPoints) : '')
    }
  }, [open, initialPoints])

  const maxAllowed = useMemo(
    () => maxRedeemablePoints(availablePoints, billGrandTotalBaht, config),
    [availablePoints, billGrandTotalBaht, config],
  )

  const parsed = Number.parseInt(pointsInput, 10)
  const validation = useMemo(() => {
    if (!pointsInput.trim()) return null
    if (Number.isNaN(parsed)) return { ok: false as const, reason: 'ใส่ตัวเลขเท่านั้น' }
    return validateRedeem(parsed, availablePoints, billGrandTotalBaht, config)
  }, [parsed, pointsInput, availablePoints, billGrandTotalBaht, config])

  const previewDiscount = pointsToBaht(parsed > 0 ? parsed : 0, config)

  if (!open || typeof document === 'undefined') return null

  const handleConfirm = () => {
    const value = parsed > 0 ? parsed : 0
    if (value === 0) {
      onConfirm(0)
      onClose()
      return
    }
    if (validation && 'ok' in validation && validation.ok) {
      onConfirm(value)
      onClose()
    }
  }

  const fillMax = () => {
    if (maxAllowed > 0) setPointsInput(String(maxAllowed))
  }

  const clearRedeem = () => {
    setPointsInput('')
    onConfirm(0)
    onClose()
  }

  return createPortal(
    <div className={isDark ? 'dark' : undefined}>
      <div
        className="fixed inset-0 z-[380] flex items-center justify-center bg-slate-600/35 p-4 backdrop-blur-md dark:bg-slate-950/55"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-2xl dark:border-amber-600/40 dark:bg-[#1e222e]">
          <div className="border-t-[3px] border-t-amber-500">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-slate-50/90 px-4 py-3 dark:border-slate-600/40 dark:from-amber-950/30 dark:to-[#252a38]">
              <h3 className="flex min-w-0 items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-800 sm:text-sm dark:text-slate-100">
                <Medal className="size-4 shrink-0 text-amber-500 dark:text-amber-400" aria-hidden />
                <span className="truncate">
                  ใช้แต้มแลกส่วนลด <span className="font-mono text-[10px] opacity-80">(REDEEM POINTS)</span>
                </span>
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1a1f35]"
                aria-label="ปิด"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-[#2a2d3e] dark:bg-[#0d0f17]/80">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                ลูกค้า
              </div>
              <div className="mt-0.5 truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                {customerName}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded border border-amber-200 bg-amber-50/80 px-2 py-1.5 dark:border-amber-600/40 dark:bg-amber-950/25">
                  <div className="text-[9px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                    แต้มสะสม
                  </div>
                  <div className="font-mono text-base font-black text-amber-900 dark:text-amber-200">
                    {availablePoints.toLocaleString('th-TH')}
                  </div>
                </div>
                <div className="rounded border border-emerald-200 bg-emerald-50/80 px-2 py-1.5 dark:border-emerald-600/40 dark:bg-emerald-950/25">
                  <div className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    ยอดบิลปัจจุบัน
                  </div>
                  <div className="font-mono text-base font-black text-emerald-900 dark:text-emerald-200">
                    {billGrandTotalBaht.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                  จำนวนแต้มที่จะใช้
                </span>
                <button
                  type="button"
                  onClick={fillMax}
                  disabled={maxAllowed <= 0}
                  className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-800 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-amber-600/50 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/55"
                >
                  ใช้สูงสุด ({maxAllowed.toLocaleString('th-TH')})
                </button>
              </label>
              <input
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                placeholder="0"
                autoFocus
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-right font-mono text-2xl font-black text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 dark:border-[#2a2d3e] dark:bg-[#0d0f17] dark:text-amber-200"
              />
              <div className="mt-1.5 flex items-center justify-between text-[10px]">
                <span className="text-slate-500 dark:text-slate-500">
                  อัตราแลก: {config.bahtPerPointRedeemed.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท / 1 แต้ม
                </span>
                <span
                  className={
                    validation && !validation.ok
                      ? 'font-bold text-rose-600 dark:text-rose-400'
                      : 'text-slate-500 dark:text-slate-500'
                  }
                >
                  {validation && !validation.ok
                    ? validation.reason
                    : `ขั้นต่ำ ${config.minPointsPerRedeem} แต้ม · ใช้ได้ ≤ ${config.maxRedeemPercentOfBill}% ของบิล`}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-cyan-50 p-3 dark:border-emerald-600/40 dark:from-emerald-950/30 dark:to-cyan-950/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  ส่วนลดที่จะได้
                </span>
                <span className="bg-gradient-to-r from-emerald-600 to-cyan-500 bg-clip-text font-mono text-2xl font-black text-transparent dark:from-emerald-400 dark:to-cyan-300">
                  −{previewDiscount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-[#2a2d3e] dark:bg-[#0a0c12]">
            <button
              type="button"
              onClick={clearRedeem}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#1a1f2e] dark:text-slate-300 dark:hover:bg-[#252b40]"
            >
              ยกเลิกการใช้แต้ม
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={Boolean(validation && !validation.ok)}
              className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white shadow-sm transition hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50 dark:from-amber-600 dark:to-orange-600"
            >
              ยืนยันใช้แต้ม
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
