import { ReportAdjustmentsPanel } from '@/features/report/components/ReportAdjustmentsPanel'
import { ReportCustomerPanel } from '@/features/report/components/ReportCustomerPanel'
import { ReportExpensePanel } from '@/features/report/components/ReportExpensePanel'
import { ReportFilterBar } from '@/features/report/components/ReportFilterBar'
import { ReportFinancePanel } from '@/features/report/components/ReportFinancePanel'
import { ReportPnlPanel } from '@/features/report/components/ReportPnlPanel'
import { ReportSalesPanel } from '@/features/report/components/ReportSalesPanel'
import { ReportStockPanel } from '@/features/report/components/ReportStockPanel'
import { ReportTaxPanel } from '@/features/report/components/ReportTaxPanel'
import { ReportFilterProvider } from '@/features/report/context/ReportFilterContext'
import { clsx } from 'clsx'
import { BarChart3, FileText, Package, Receipt, RotateCcw, Scale, TrendingUp, Users, Wallet } from 'lucide-react'
import { useState } from 'react'

type ReportWorkspacePageProps = {
  className?: string
}

type ReportPanelId = 'sales' | 'stock' | 'tax' | 'adjustments' | 'finance' | 'expense' | 'customer' | 'pnl'

const PANELS: {
  id: ReportPanelId
  label: string
  short: string
  icon: typeof FileText
  usesDateFilter?: boolean
}[] = [
  { id: 'sales',       label: 'ยอดขาย',    short: 'POS · สินค้า · ลูกค้า · หมวด',   icon: BarChart3,  usesDateFilter: true },
  { id: 'stock',       label: 'สต็อก',      short: 'ต่ำกว่าขั้นต่ำ · ABC · Dead',     icon: Package },
  { id: 'expense',     label: 'ค่าใช้จ่าย',  short: 'บันทึก · หมวด · เดือน',          icon: Wallet },
  { id: 'customer',    label: 'ลูกค้า',      short: 'กลุ่ม · RFM Analysis',            icon: Users,      usesDateFilter: true },
  { id: 'pnl',         label: 'P&L',         short: 'กำไร-ขาดทุน · รายเดือน',         icon: TrendingUp, usesDateFilter: true },
  { id: 'tax',         label: 'ภาษี',        short: 'ใบกำกับ · ใบลดหนี้ · CSV',        icon: Receipt },
  { id: 'adjustments', label: 'ปรับปรุง',    short: 'ยกเลิกบิล · คืนสินค้า',          icon: RotateCcw },
  { id: 'finance',     label: 'การเงิน',     short: 'ลูกหนี้ AR · วงเงิน',            icon: Scale },
]

function ReportContent() {
  const [panel, setPanel] = useState<ReportPanelId>('sales')
  const currentPanel = PANELS.find((p) => p.id === panel)

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row">
      <aside
        role="tablist"
        aria-label="หมวดรายงาน"
        className="flex shrink-0 flex-row gap-1.5 border-b border-slate-200 bg-slate-50/90 p-2 md:w-56 md:flex-col md:gap-1 md:border-b-0 md:border-r md:p-3"
      >
        {PANELS.map((p) => {
          const Icon = p.icon
          const selected = panel === p.id
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setPanel(p.id)}
              className={clsx(
                'flex min-h-10 flex-1 flex-col items-stretch gap-0.5 rounded-xl px-3 py-2 text-left transition touch-manipulation md:min-h-0 md:w-full md:flex-none',
                selected
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                  : 'text-slate-600 hover:bg-white/70',
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                {p.label}
              </span>
              <span className="hidden pl-6 text-[10px] leading-tight text-slate-500 md:block">
                {p.short}
              </span>
            </button>
          )
        })}
      </aside>

      <div className="min-h-0 min-w-0 flex-1 overflow-auto p-4 lg:p-5">
        {/* Shared filter bar — shown for panels that use date/segment filters */}
        {currentPanel?.usesDateFilter && (
          <div className="mb-4">
            <ReportFilterBar />
          </div>
        )}

        {panel === 'sales'       && <ReportSalesPanel />}
        {panel === 'stock'       && <ReportStockPanel />}
        {panel === 'expense'     && <ReportExpensePanel />}
        {panel === 'customer'    && <ReportCustomerPanel />}
        {panel === 'pnl'         && <ReportPnlPanel />}
        {panel === 'tax'         && <ReportTaxPanel />}
        {panel === 'adjustments' && <ReportAdjustmentsPanel />}
        {panel === 'finance'     && <ReportFinancePanel />}
      </div>
    </div>
  )
}

export function ReportWorkspacePage({ className }: ReportWorkspacePageProps) {
  return (
    <ReportFilterProvider>
      <div
        className={clsx(
          'flex min-h-[min(85vh,56rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
          className,
        )}
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/90 to-white px-4 py-3 lg:px-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-200/80 bg-white text-indigo-800 shadow-sm">
              <FileText className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h1 className="text-base font-semibold text-slate-900 lg:text-lg">Report</h1>
              <p className="text-xs text-slate-600 lg:text-sm">รายงานสรุปทางธุรกิจ — เลือกหมวดด้านซ้าย</p>
            </div>
          </div>
        </div>

        <ReportContent />
      </div>
    </ReportFilterProvider>
  )
}
