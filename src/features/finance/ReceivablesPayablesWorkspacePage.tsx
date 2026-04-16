import { DebtReductionChannelsEditorModal } from '@/features/finance/components/DebtReductionChannelsEditorModal'
import { PayablesPanel } from '@/features/finance/components/PayablesPanel'
import { ReceivablesPanel } from '@/features/finance/components/ReceivablesPanel'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import { clsx } from 'clsx'
import { Scale } from 'lucide-react'
import { useState } from 'react'

type ReceivablesPayablesWorkspacePageProps = {
  className?: string
}

export function ReceivablesPayablesWorkspacePage({ className }: ReceivablesPayablesWorkspacePageProps) {
  const { receivablesPayablesPanel, setReceivablesPayablesPanel } = useWorkspaceTabs()
  const [debtChannelsEditorOpen, setDebtChannelsEditorOpen] = useState(false)

  return (
    <div
      className={clsx(
        'flex min-h-[min(85vh,56rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3 lg:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm">
            <Scale className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h1 className="text-base font-semibold text-slate-900 lg:text-lg">ลูกหนี้ / เจ้าหนี้</h1>
            <p className="text-xs text-slate-600 lg:text-sm">
              ยอดคงค้างจากลูกค้าและผู้จำหน่าย — กติกาเครดิต/จ่าย-เก็บ{' '}
              <strong className="font-medium text-slate-700">ตั้งได้รายบริษัท</strong> (ปุ่มแก้กติกาในแต่ละแถว)
              {' · '}
              <strong className="font-medium text-slate-700">ช่องทางลดหนี้</strong> ตั้งรายการได้จากปุ่มในแท็บลูกหนี้/เจ้าหนี้
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row">
        <aside
          role="tablist"
          aria-label="มุมมองลูกหนี้และเจ้าหนี้"
          className="flex shrink-0 flex-row gap-1.5 border-b border-slate-200 bg-slate-50/90 p-2 md:w-48 md:flex-col md:gap-1 md:border-b-0 md:border-r md:p-3"
        >
          <button
            type="button"
            role="tab"
            aria-selected={receivablesPayablesPanel === 'ar'}
            onClick={() => setReceivablesPayablesPanel('ar')}
            className={clsx(
              'min-h-10 flex-1 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition touch-manipulation md:min-h-11 md:w-full md:flex-none',
              receivablesPayablesPanel === 'ar'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:bg-white/70',
            )}
          >
            ลูกหนี้
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={receivablesPayablesPanel === 'ap'}
            onClick={() => setReceivablesPayablesPanel('ap')}
            className={clsx(
              'min-h-10 flex-1 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition touch-manipulation md:min-h-11 md:w-full md:flex-none',
              receivablesPayablesPanel === 'ap'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:bg-white/70',
            )}
          >
            เจ้าหนี้
          </button>
        </aside>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto p-4 lg:p-5">
          {receivablesPayablesPanel === 'ar' && (
            <ReceivablesPanel onOpenDebtChannelsEditor={() => setDebtChannelsEditorOpen(true)} />
          )}
          {receivablesPayablesPanel === 'ap' && (
            <PayablesPanel onOpenDebtChannelsEditor={() => setDebtChannelsEditorOpen(true)} />
          )}
        </div>
      </div>

      <DebtReductionChannelsEditorModal open={debtChannelsEditorOpen} onClose={() => setDebtChannelsEditorOpen(false)} />
    </div>
  )
}
