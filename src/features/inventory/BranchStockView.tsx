import { InventoryFooterActions } from '@/features/inventory/components/InventoryFooterActions'
import { InventorySummaryCards } from '@/features/inventory/components/InventorySummaryCards'
import { InventoryTable } from '@/features/inventory/components/InventoryTable'

export function BranchStockView() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <InventorySummaryCards />
      <InventoryTable />
      <InventoryFooterActions />
    </div>
  )
}
