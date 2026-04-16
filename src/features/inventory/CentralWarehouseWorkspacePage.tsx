import { CentralHubStockView } from '@/features/inventory/CentralHubStockView'
import { CrossBranchTransferView } from '@/features/inventory/CrossBranchTransferView'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import { clsx } from 'clsx'

type CentralWarehouseWorkspacePageProps = {
  className?: string
}

export function CentralWarehouseWorkspacePage({ className }: CentralWarehouseWorkspacePageProps) {
  const { centralWarehousePanel } = useWorkspaceTabs()

  return (
    <div
      className={clsx(
        'flex min-h-[min(85vh,56rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto p-4 lg:p-5">
        {centralWarehousePanel === 'hub-stock' && <CentralHubStockView />}
        {centralWarehousePanel === 'transfer' && <CrossBranchTransferView />}
      </div>
    </div>
  )
}
