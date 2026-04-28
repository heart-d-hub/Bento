import { useMemo } from 'react'
import { BankWorkspacePage } from '@/features/bank/BankWorkspacePage'
import { ExpenseWorkspacePage } from '@/features/expense/ExpenseWorkspacePage'
import { ReturnsWorkspacePage } from '@/features/returns/ReturnsWorkspacePage'
import { DashboardLayoutWorkspacePage } from '@/features/main/DashboardLayoutWorkspacePage'
import { TaskNotepadHistoryWorkspacePage } from '@/features/main/TaskNotepadHistoryWorkspacePage'
import { GenericTabPlaceholder } from '@/features/main/components/GenericTabPlaceholder'
import { BuyWorkspacePage } from '@/features/purchase/BuyWorkspacePage'
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
import { ClockInWorkspacePage } from '@/features/clockin/ClockInWorkspacePage'
import { GlobalDashboardWorkspacePage } from '@/features/globaldashboard/GlobalDashboardWorkspacePage'
import { TransportWorkspacePage } from '@/features/transport/TransportWorkspacePage'
import { clsx } from 'clsx'

const KNOWN_TAB_IDS = new Set([
  'pos', 'sales-history', 'day-summary', 'car-model', 'buy', 'catalog',
  'label-print', 'branch-stock', 'central', 'ar-ap', 'members', 'promotions',
  'settings', 'dashboard-layout', 'task-notepad-history', 'activity',
  'bank', 'expense', 'returns', 'report', 'clockin', 'global-dashboard', 'transport',
])

type WorkspaceTabPanelProps = {
  className?: string
}

export function WorkspaceTabPanel({ className }: WorkspaceTabPanelProps) {
  const { activeTabId, tabs } = useWorkspaceTabs()

  const openIds = useMemo(() => new Set(tabs.map((t) => t.id)), [tabs])

  if (openIds.size === 0) return null

  // Returns className for a tab: visible when active, hidden otherwise
  const tab = (id: string) => clsx('flex-1', className, activeTabId !== id && 'hidden')

  return (
    <>
      {openIds.has('pos') && <PosWorkspacePage className={tab('pos')} />}
      {openIds.has('sales-history') && <SalesHistoryWorkspacePage className={tab('sales-history')} />}
      {openIds.has('day-summary') && <DaySummaryWorkspacePage className={tab('day-summary')} />}
      {openIds.has('car-model') && <VehicleWorkspacePage className={tab('car-model')} />}
      {openIds.has('buy') && <BuyWorkspacePage className={tab('buy')} />}
      {openIds.has('catalog') && <CatalogWorkspacePage className={tab('catalog')} />}
      {openIds.has('label-print') && <LabelPrintWorkspacePage className={tab('label-print')} />}
      {openIds.has('branch-stock') && <BranchStockWorkspacePage className={tab('branch-stock')} />}
      {openIds.has('central') && <CentralWarehouseWorkspacePage className={tab('central')} />}
      {openIds.has('ar-ap') && <ReceivablesPayablesWorkspacePage className={tab('ar-ap')} />}
      {openIds.has('members') && <MembersWorkspacePage className={tab('members')} />}
      {openIds.has('promotions') && <PromotionsWorkspacePage className={tab('promotions')} />}
      {openIds.has('settings') && <SettingsWorkspacePage className={tab('settings')} />}
      {openIds.has('dashboard-layout') && <DashboardLayoutWorkspacePage className={tab('dashboard-layout')} />}
      {openIds.has('task-notepad-history') && <TaskNotepadHistoryWorkspacePage className={tab('task-notepad-history')} />}
      {openIds.has('activity') && <ActivityLogWorkspacePage className={tab('activity')} />}
      {openIds.has('bank') && <BankWorkspacePage className={tab('bank')} />}
      {openIds.has('expense') && <ExpenseWorkspacePage className={tab('expense')} />}
      {openIds.has('returns') && <ReturnsWorkspacePage className={tab('returns')} />}
      {openIds.has('report') && <ReportWorkspacePage className={tab('report')} />}
      {openIds.has('clockin') && <ClockInWorkspacePage className={tab('clockin')} />}
      {openIds.has('global-dashboard') && <GlobalDashboardWorkspacePage className={tab('global-dashboard')} />}
      {openIds.has('transport') && <TransportWorkspacePage className={tab('transport')} />}
      {tabs
        .filter((t) => !KNOWN_TAB_IDS.has(t.id))
        .map((t) => (
          <GenericTabPlaceholder key={t.id} className={tab(t.id)} />
        ))}
    </>
  )
}
