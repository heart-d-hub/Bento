import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'

export type BudgetRow = {
  id: string
  category: string
  monthlyAmount: number
  branchId: string | null
}

export type BudgetVsActualRow = {
  category: string
  budget: number
  actual: number
  pct: number
}

export async function budgetListAsync(): Promise<BudgetRow[]> {
  if (!isTauri()) return []
  return invoke<BudgetRow[]>('budget_list')
}

export async function budgetUpsertAsync(category: string, monthlyAmount: number): Promise<string> {
  if (!isTauri()) return ''
  return invoke<string>('budget_upsert', { category, monthlyAmount })
}

export async function budgetDeleteAsync(id: string): Promise<void> {
  if (!isTauri()) return
  return invoke<void>('budget_delete', { id })
}

export async function reportBudgetVsActualAsync(yearMonth: string): Promise<BudgetVsActualRow[]> {
  if (!isTauri()) return []
  return invoke<BudgetVsActualRow[]>('report_budget_vs_actual', { yearMonth })
}
