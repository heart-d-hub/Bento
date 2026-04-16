import { DashboardLayoutSettingsForm } from '@/features/main/components/DashboardLayoutSettingsForm'
import { clsx } from 'clsx'
import { SlidersHorizontal } from 'lucide-react'

type DashboardLayoutWorkspacePageProps = {
  className?: string
}

export function DashboardLayoutWorkspacePage({ className }: DashboardLayoutWorkspacePageProps) {
  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      <header className="shrink-0 border-b border-slate-200 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
            <SlidersHorizontal className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h1 className="text-sm font-semibold text-slate-900">Dashboard</h1>
            <p className="text-[11px] text-slate-500">
              การ์ดสรุปด้านซ้าย · เลขเครื่อง POS — แยกจากตั้งค่าร้านทั้งระบบ
            </p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-5">
        <DashboardLayoutSettingsForm />
      </div>
    </div>
  )
}
