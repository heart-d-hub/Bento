import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'

export type ExpenseRow = {
  id: string
  expenseDate: string
  category: string
  amount: number
  note: string | null
  payee: string | null
  paymentMethod: string
  branchId: string | null
  isRecurring: boolean
  recurringInterval: string | null
  status: 'pending' | 'approved' | 'rejected'
  approvedBy: string | null
}

export type ExpenseCreatePayload = {
  expenseDate: string
  category: string
  amount: number
  note?: string | null
  payee?: string | null
  paymentMethod: string
  branchId?: string | null
  isRecurring?: boolean
  recurringInterval?: string | null
  status?: string
}

export type ExpenseCategoryRow = { category: string; total: number; count: number }
export type ExpenseMonthRow    = { month: string; total: number; count: number }

export type ReportExpensesResult = {
  total: number
  count: number
  avgPerEntry: number
  byCategory: ExpenseCategoryRow[]
  monthlyTrend: ExpenseMonthRow[]
  items: ExpenseRow[]
}

export type ExpenseCategoryComparison = {
  category: string
  current: number
  previous: number
  changePct: number
}

export type ExpenseComparisonResult = {
  currentMonth: string
  previousMonth: string
  currentTotal: number
  previousTotal: number
  byCategory: ExpenseCategoryComparison[]
}

export async function expenseCreateAsync(payload: ExpenseCreatePayload): Promise<string> {
  if (!isTauri()) return ''
  return invoke<string>('expense_create', { payload })
}

export async function expenseListAsync(
  dateFrom: string,
  dateTo: string,
  category?: string | null,
): Promise<ExpenseRow[]> {
  if (!isTauri()) return []
  return invoke<ExpenseRow[]>('expense_list', { dateFrom, dateTo, category: category ?? null })
}

export async function expenseUpdateAsync(
  id: string,
  expenseDate: string,
  category: string,
  amount: number,
  note: string | null,
  payee: string | null,
  paymentMethod: string,
  isRecurring?: boolean,
  recurringInterval?: string | null,
): Promise<void> {
  if (!isTauri()) return
  return invoke<void>('expense_update', {
    id, expenseDate, category, amount, note, payee, paymentMethod,
    isRecurring: isRecurring ?? false,
    recurringInterval: recurringInterval ?? null,
  })
}

export async function expenseDeleteAsync(id: string): Promise<void> {
  if (!isTauri()) return
  return invoke<void>('expense_delete', { id })
}

export async function expenseApproveAsync(id: string, approvedBy: string): Promise<void> {
  if (!isTauri()) return
  return invoke<void>('expense_approve', { id, approvedBy })
}

export async function expenseRejectAsync(id: string): Promise<void> {
  if (!isTauri()) return
  return invoke<void>('expense_reject', { id })
}

export async function loadReportExpensesAsync(
  dateFrom: string,
  dateTo: string,
  category?: string | null,
): Promise<ReportExpensesResult | null> {
  if (!isTauri()) return null
  return invoke<ReportExpensesResult>('report_expenses', { dateFrom, dateTo, category: category ?? null })
}

export async function reportExpenseComparisonAsync(yearMonth: string): Promise<ExpenseComparisonResult | null> {
  if (!isTauri()) return null
  return invoke<ExpenseComparisonResult>('report_expense_comparison', { yearMonth })
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  'ค่าแรงงาน',
  'ค่าเช่า',
  'ค่าน้ำมัน / ขนส่ง',
  'ค่าสาธารณูปโภค',
  'ค่าซ่อมบำรุง',
  'ค่าบรรจุภัณฑ์',
  'ค่าโฆษณา / การตลาด',
  'ค่าอาหาร / สวัสดิการ',
  'ภาษี / ค่าธรรมเนียม',
  'อุปกรณ์สำนักงาน',
  'อื่นๆ',
]
