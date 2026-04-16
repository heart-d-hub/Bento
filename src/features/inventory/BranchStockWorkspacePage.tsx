import { BranchStockView } from '@/features/inventory/BranchStockView'
import { SplitSaleStockView } from '@/features/inventory/SplitSaleStockView'
import { InventoryCategoryManageView } from '@/features/inventory/InventoryCategoryManageView'
import { InventoryProductTagsView } from '@/features/inventory/InventoryProductTagsView'
import { ProductDataFileView } from '@/features/inventory/ProductDataFileView'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import { clsx } from 'clsx'

type BranchStockWorkspacePageProps = {
  className?: string
}

export function BranchStockWorkspacePage({ className }: BranchStockWorkspacePageProps) {
  const { branchStockPanel } = useWorkspaceTabs()

  return (
    <div
      className={clsx(
        'flex min-h-[min(85vh,56rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm pos-compact:min-h-0 pos-compact:rounded-2xl',
        className,
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto p-4 pos-compact:p-2.5 lg:p-5 pos-compact:lg:p-3">
        {branchStockPanel === 'stock' && <BranchStockView />}
        {branchStockPanel === 'split-sale' && <SplitSaleStockView />}
        {branchStockPanel === 'product-file' && <ProductDataFileView />}
        {branchStockPanel === 'categories' && <InventoryCategoryManageView />}
        {branchStockPanel === 'product-tags' && <InventoryProductTagsView />}
      </div>
    </div>
  )
}
