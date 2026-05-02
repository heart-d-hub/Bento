import { Medal, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { B2B_TIER_COLORS, getB2bTierConfig, type B2bTier } from '@/features/settings/data/customerTiersStore'

type PosLoyaltyCellProps = {
  /** B2C/VIP สะสมแต้ม / ส่วน B2B จะแสดง tier */
  canEarnPoints: boolean
  customerType: string
  pointsBalance: number
  pointsToRedeem: number
  b2bTier: string
  /** ลูกค้าเป็น Walk-in หรือไม่ — ปิดปุ่มแลก */
  isWalkIn: boolean
  /** เปิด modal แลกแต้ม */
  onRedeemClick: () => void
}

/**
 * กล่องแสดงสถานะสะสมแต้ม (B2C) หรือ tier (B2B) ในแถบ Customer Info ของ POS
 * — ออกแบบเพื่อให้ใช้พื้นที่ใน grid cell เดิม (เคยเป็นช่อง "แต้มสะสม")
 */
export function PosLoyaltyCell({
  canEarnPoints,
  customerType,
  pointsBalance,
  pointsToRedeem,
  b2bTier,
  isWalkIn,
  onRedeemClick,
}: PosLoyaltyCellProps) {
  if (!canEarnPoints && b2bTier) {
    const tier = b2bTier as B2bTier
    const colors = B2B_TIER_COLORS[tier] ?? B2B_TIER_COLORS.bronze
    const tierConfig = getB2bTierConfig(tier)
    const baseDiscount =
      customerType === 'garage'
        ? tierConfig.garageDiscountPercent
        : customerType === 'store'
          ? tierConfig.storeDiscountPercent
          : 0
    return (
      <>
        <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-violet-700/90 dark:text-violet-300/90">
          ระดับลูกค้า B2B
        </label>
        <div className="flex items-center justify-between gap-1.5 rounded border border-violet-200 bg-violet-50/80 px-2 py-1.5 dark:border-violet-600/40 dark:bg-violet-950/25">
          <span className={clsx('rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider', colors.badge)}>
            {tierConfig.label}
          </span>
          {baseDiscount > 0 ? (
            <span className="font-mono text-[11px] font-black tabular-nums text-violet-800 dark:text-violet-200">
              −{baseDiscount}%
            </span>
          ) : (
            <span className="text-[10px] font-bold text-violet-700/70 dark:text-violet-300/70">
              ราคามาตรฐาน
            </span>
          )}
        </div>
      </>
    )
  }

  // B2C / VIP — แต้มสะสม + ปุ่มใช้แต้ม
  const hasRedemption = pointsToRedeem > 0
  const remaining = Math.max(0, pointsBalance - pointsToRedeem)
  return (
    <>
      <label className="mb-0.5 flex items-center justify-between gap-1 text-[9px] font-black uppercase tracking-widest text-amber-800/90 dark:text-amber-400/90">
        <span>แต้มสะสม</span>
        {!isWalkIn && (
          <button
            type="button"
            onClick={onRedeemClick}
            disabled={pointsBalance <= 0}
            className={clsx(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest shadow-sm transition',
              hasRedemption
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 dark:from-emerald-600 dark:to-cyan-600'
                : 'border border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-amber-600/50 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/55',
            )}
            title={hasRedemption ? 'แก้ไขแต้มที่ใช้' : 'ใช้แต้มแลกส่วนลด'}
          >
            <Sparkles className="size-2.5 shrink-0" aria-hidden />
            {hasRedemption ? 'แก้ไข' : 'ใช้แต้ม'}
          </button>
        )}
      </label>
      <button
        type="button"
        onClick={onRedeemClick}
        disabled={isWalkIn || pointsBalance <= 0}
        className={clsx(
          'relative flex w-full items-center justify-between gap-1.5 rounded border px-2 py-1.5 text-left transition disabled:cursor-not-allowed',
          hasRedemption
            ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-amber-50 dark:border-emerald-500/40 dark:from-emerald-950/30 dark:to-amber-950/30'
            : 'border-amber-200 bg-amber-50/80 hover:bg-amber-100/80 dark:border-amber-600/40 dark:bg-amber-950/25 dark:hover:bg-amber-900/35',
        )}
      >
        {hasRedemption ? (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-mono text-[10px] font-black tabular-nums text-emerald-700 dark:text-emerald-300">
              ใช้ {pointsToRedeem.toLocaleString('th-TH')} แต้ม
            </span>
            <span className="font-mono text-[9px] font-semibold tabular-nums text-amber-700 dark:text-amber-400">
              เหลือ {remaining.toLocaleString('th-TH')}
            </span>
          </span>
        ) : (
          <span className="min-w-0 truncate font-mono text-[11px] font-bold tabular-nums leading-none text-amber-900 dark:text-amber-200">
            {pointsBalance.toLocaleString('th-TH')}
          </span>
        )}
        <Medal
          className={clsx(
            'size-4 shrink-0',
            hasRedemption ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-400 dark:text-amber-500',
          )}
          aria-hidden
        />
      </button>
    </>
  )
}
