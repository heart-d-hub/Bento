import { DashboardLayoutWorkspacePage } from '@/features/main/DashboardLayoutWorkspacePage'
import { TaskNotepadHistoryWorkspacePage } from '@/features/main/TaskNotepadHistoryWorkspacePage'
import { GenericTabPlaceholder } from '@/features/main/components/GenericTabPlaceholder'
import { PurchaseOrdersWorkspacePage } from '@/features/purchase/PurchaseOrdersWorkspacePage'
import { SuppliersWorkspacePage } from '@/features/purchase/SuppliersWorkspacePage'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import { DaySummaryWorkspacePage } from '@/features/pos/DaySummaryWorkspacePage'
import { PosWorkspacePage } from '@/features/pos/PosWorkspacePage'
import { SalesHistoryWorkspacePage } from '@/features/pos/SalesHistoryWorkspacePage'
import { BranchStockWorkspacePage } from '@/features/inventory/BranchStockWorkspacePage'
import { CentralWarehouseWorkspacePage } from '@/features/inventory/CentralWarehouseWorkspacePage'
import { ReceivablesPayablesWorkspacePage } from '@/features/finance/ReceivablesPayablesWorkspacePage'
import { MembersWorkspacePage } from '@/features/members/MembersWorkspacePage'
import { SettingsWorkspacePage } from '@/features/settings/SettingsWorkspacePage'
import { VehicleWorkspacePage } from '@/features/vehicle/VehicleWorkspacePage'
import { ActivityLogWorkspacePage } from '@/features/activity/ActivityLogWorkspacePage'
import { PromotionsWorkspacePage } from '@/features/promotions/PromotionsWorkspacePage'
import { ReportWorkspacePage } from '@/features/report/ReportWorkspacePage'
import { CatalogWorkspacePage } from '@/features/catalog/CatalogWorkspacePage'
import { LabelPrintWorkspacePage } from '@/features/inventory/LabelPrintWorkspacePage'
import { clsx } from 'clsx'

type WorkspaceTabPanelProps = {
  className?: string
}

export function WorkspaceTabPanel({ className }: WorkspaceTabPanelProps) {
  const { activeTabId } = useWorkspaceTabs()

  if (!activeTabId) {
    return null
  }

  if (activeTabId === 'pos') {
    return <PosWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'sales-history') {
    return <SalesHistoryWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'day-summary') {
    return <DaySummaryWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'car-model') {
    return <VehicleWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'buy') {
    return <PurchaseOrdersWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'suppliers') {
    return <SuppliersWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'catalog') {
    return <CatalogWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'label-print') {
    return <LabelPrintWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'branch-stock') {
    return <BranchStockWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'central') {
    return <CentralWarehouseWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'ar-ap') {
    return <ReceivablesPayablesWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'members') {
    return <MembersWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'promotions') {
    return <PromotionsWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'settings') {
    return <SettingsWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'dashboard-layout') {
    return <DashboardLayoutWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'task-notepad-history') {
    return <TaskNotepadHistoryWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'activity') {
    return <ActivityLogWorkspacePage className={clsx('flex-1', className)} />
  }

  if (activeTabId === 'report') {
    return <ReportWorkspacePage className={clsx('flex-1', className)} />
  }

  return <GenericTabPlaceholder className={className} />
}
