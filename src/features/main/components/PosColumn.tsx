import { clearSessionAndBranch } from '@/features/auth/authSession'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import { clsx } from 'clsx'
import { Banknote, Car, History, Power, ShoppingCart, X } from 'lucide-react'
import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type PosColumnProps = {
  className?: string
}

export function PosColumn({ className }: PosColumnProps) {
  const navigate = useNavigate()
  const { openTab, clearAllTabs } = useWorkspaceTabs()

  const openVehicle = (panel: 'search' | 'manage') => {
    openTab('car-model', 'รถ', { vehicleWorkspacePanel: panel })
  }
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const logoutDialogTitleId = useId()

  const confirmLogout = () => {
    clearAllTabs()
    clearSessionAndBranch()
    setLogoutConfirmOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <div
      className={clsx(
        'flex w-full shrink-0 flex-col gap-2.5 sm:gap-3 pos-compact:gap-2 lg:h-full lg:min-h-0 pos-narrow:lg:w-[13rem] pos-narrow:lg:max-w-[13rem] lg:w-[14.5rem] lg:max-w-[14.5rem] lg:shrink-0 xl:w-[15.5rem] xl:max-w-[15.5rem]',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => openTab('pos', 'POS / TAX')}
        aria-label="POS / TAX — ขายหน้าร้าน + ใบกำกับภาษี"
        className="flex min-h-[min(30vh,12rem)] flex-1 flex-col items-center justify-center gap-2 rounded-3xl border border-slate-200/80 bg-white px-5 py-6 shadow-sm transition hover:border-slate-300 hover:shadow-md active:scale-[0.99] touch-manipulation pos-compact:gap-1.5 pos-compact:px-4 pos-compact:py-4 pos-compact:lg:py-3 lg:min-h-0"
      >
        <span className="flex size-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 sm:size-[4.5rem] pos-compact:size-14 pos-compact:sm:size-[4rem]">
          <ShoppingCart className="size-9 sm:size-10 pos-compact:size-8 pos-compact:sm:size-9" strokeWidth={1.5} aria-hidden />
        </span>
        <span className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl pos-compact:text-xl pos-compact:sm:text-2xl">
          POS / TAX
        </span>
        <span className="text-sm font-medium text-slate-500 pos-compact:text-xs">ขายหน้าร้าน + ใบกำกับ</span>
      </button>

      <section
        className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-3.5 pos-compact:p-2.5 pos-compact:sm:p-3"
        aria-label="รถ — ค้นหาและจัดการรุ่นรถ"
      >
        <div className="mb-2.5 flex items-center gap-2 text-slate-800 pos-compact:mb-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 pos-compact:size-8">
            <Car className="size-[1.125rem] pos-compact:size-4" strokeWidth={1.75} aria-hidden />
          </span>
          <h2 className="text-sm font-semibold tracking-tight pos-compact:text-xs">รถ</h2>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2">
          <button
            type="button"
            onClick={() => openVehicle('search')}
            className="min-h-10 rounded-xl border border-slate-200/90 bg-slate-50/90 px-2.5 py-2 text-center text-xs font-medium text-slate-800 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/80 active:scale-[0.99] touch-manipulation"
          >
            ค้นหารุ่นรถ
          </button>
          <button
            type="button"
            onClick={() => openVehicle('manage')}
            className="min-h-10 rounded-xl border border-slate-200/90 bg-slate-50/90 px-2.5 py-2 text-center text-xs font-medium text-slate-800 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/80 active:scale-[0.99] touch-manipulation"
          >
            จัดการรุ่นรถ
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={() => openTab('sales-history', 'ประวัติการขาย')}
        className="flex min-h-[4rem] items-center justify-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-base font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:shadow-md active:scale-[0.99] touch-manipulation sm:min-h-[4.25rem] pos-compact:min-h-[3.5rem] pos-compact:gap-2 pos-compact:py-2.5 pos-compact:text-sm"
      >
        <History
          className="size-6 shrink-0 text-slate-500 pos-compact:size-5"
          strokeWidth={1.75}
          aria-hidden
        />
        ประวัติการขาย
      </button>

      <button
        type="button"
        onClick={() => openTab('day-summary', 'สรุปยอดสิ้นวัน')}
        className="flex min-h-[3.75rem] w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.99] touch-manipulation pos-compact:min-h-[3.25rem] pos-compact:py-2.5 pos-compact:text-xs"
      >
        <Banknote className="size-5 shrink-0 text-slate-600 pos-compact:size-[1.125rem]" aria-hidden />
        สรุปยอดสิ้นวัน
      </button>

      <button
        type="button"
        onClick={() => setLogoutConfirmOpen(true)}
        className="flex min-h-[3.75rem] w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-200/80 active:scale-[0.99] touch-manipulation pos-compact:min-h-[3.25rem] pos-compact:py-2.5 pos-compact:text-xs"
      >
        <Power className="size-5 shrink-0 pos-compact:size-[1.125rem]" aria-hidden />
        ออกจากระบบ
      </button>

      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLogoutConfirmOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={logoutDialogTitleId}
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id={logoutDialogTitleId} className="text-base font-semibold text-slate-900">
                ออกจากระบบ
              </h2>
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                aria-label="ปิด"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">ต้องการออกจากระบบจริงหรือไม่</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
              >
                ใช่
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
