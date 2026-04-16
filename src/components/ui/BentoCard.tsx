import type { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type BentoCardProps = {
  icon: LucideIcon
  label: string
  iconClassName?: string
} & ButtonHTMLAttributes<HTMLButtonElement>

/** ความสูงขั้นต่ำของปุ่ม — กว้างเต็มช่องกริด */
const TILE_MIN_H = 'min-h-[4rem] sm:min-h-[4.5rem]'

export function BentoCard({
  icon: Icon,
  label,
  iconClassName,
  className,
  type = 'button',
  ...rest
}: BentoCardProps) {
  return (
    <button
      type={type}
      className={clsx(
        'group flex h-full w-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-sm ring-1 ring-slate-950/[0.04] transition-all duration-200 hover:-translate-y-px hover:border-slate-300/90 hover:shadow-md hover:ring-slate-950/[0.08] active:translate-y-0 active:scale-[0.99] sm:gap-2 sm:p-3',
        TILE_MIN_H,
        'touch-manipulation select-none',
        className,
      )}
      {...rest}
    >
      <span
        className={clsx(
          'pointer-events-none flex size-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-[1.03] sm:size-11',
          iconClassName,
        )}
      >
        <Icon className="size-[1.125rem] sm:size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="pointer-events-none text-[11px] font-medium leading-snug text-slate-800 sm:text-xs">
        {label}
      </span>
    </button>
  )
}
