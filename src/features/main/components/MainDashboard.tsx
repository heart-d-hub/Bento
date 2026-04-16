import { ActionGrid } from '@/features/main/components/ActionGrid'
import { HomeTaskNotepad } from '@/features/main/components/HomeTaskNotepad'
import { PosColumn } from '@/features/main/components/PosColumn'
import { SidebarCards } from '@/features/main/components/SidebarCards'
import { clsx } from 'clsx'

type MainDashboardProps = {
  className?: string
}

export function MainDashboard({ className }: MainDashboardProps) {
  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 flex-col gap-3 sm:gap-4 pos-compact:gap-2 pos-compact:sm:gap-3',
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-3 pos-compact:gap-1.5 pos-compact:sm:gap-2 lg:flex-row lg:items-stretch lg:gap-3 pos-compact:lg:gap-2">
        <SidebarCards />

        <HomeTaskNotepad className="lg:min-h-0" />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:gap-4 pos-compact:gap-2 pos-compact:sm:gap-3 lg:flex-row lg:items-stretch lg:gap-4 pos-compact:lg:gap-3">
          <PosColumn className="lg:min-h-0" />
          <ActionGrid className="min-h-0 min-w-0 flex-1" />
        </div>
      </div>
    </div>
  )
}
