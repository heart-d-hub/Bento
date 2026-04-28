import { ExpenseBudgetPanel } from '@/features/expense/ExpenseBudgetPanel'
import { ExpenseCategoryPanel } from '@/features/expense/ExpenseCategoryPanel'
import {
  getAllCategories,
  loadCustomCategories,
  saveCustomCategories,
} from '@/features/expense/expenseCategoryStore'
import { VendorPanel } from '@/features/expense/VendorPanel'
import { vendorListAsync } from '@/features/expense/vendorDb'
import { ReportExpensePanel } from '@/features/report/components/ReportExpensePanel'
import { clsx } from 'clsx'
import { BookUser, PiggyBank, Tag, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'

type Tab = 'expenses' | 'budgets' | 'vendors' | 'categories'

const TABS: { id: Tab; label: string; icon: typeof Wallet }[] = [
  { id: 'expenses',   label: 'ค่าใช้จ่าย', icon: Wallet },
  { id: 'budgets',    label: 'งบประมาณ',   icon: PiggyBank },
  { id: 'vendors',    label: 'คู่ค้า',      icon: BookUser },
  { id: 'categories', label: 'หมวดหมู่',   icon: Tag },
]

type Props = { className?: string }

export function ExpenseWorkspacePage({ className }: Props) {
  const [tab, setTab] = useState<Tab>('expenses')
  const [vendorNames, setVendorNames] = useState<string[]>([])
  const [customCategories, setCustomCategories] = useState<string[]>(() => loadCustomCategories())

  const categories = getAllCategories(customCategories)

  useEffect(() => {
    vendorListAsync().then((v) => setVendorNames(v.map((r) => r.name))).catch(() => {})
  }, [])

  const handleCategoriesChange = (next: string[]) => {
    saveCustomCategories(next)
    setCustomCategories(next)
  }

  return (
    <div
      className={clsx(
        'flex min-h-[min(85vh,56rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      {/* Header */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-rose-50/90 to-white px-4 py-3 lg:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-rose-200/80 bg-white text-rose-700 shadow-sm">
            <Wallet className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-slate-900 lg:text-lg">ค่าใช้จ่าย</h1>
            <p className="text-xs text-slate-500">บันทึก · งบประมาณ · คู่ค้า · หมวดหมู่</p>
          </div>

          {/* Tab bar in header */}
          <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
            {TABS.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={clsx(
                    'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition',
                    tab === t.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:bg-white/60',
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto p-4 lg:p-5">
        {tab === 'expenses'   && <ReportExpensePanel vendorNames={vendorNames} categories={categories} />}
        {tab === 'budgets'    && <ExpenseBudgetPanel categories={categories} />}
        {tab === 'vendors'    && <VendorPanel />}
        {tab === 'categories' && (
          <ExpenseCategoryPanel
            customCategories={customCategories}
            onChange={handleCategoriesChange}
          />
        )}
      </div>
    </div>
  )
}
