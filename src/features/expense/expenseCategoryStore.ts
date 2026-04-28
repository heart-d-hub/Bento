import { DEFAULT_EXPENSE_CATEGORIES } from '@/features/report/data/expensesDb'

const KEY = 'bento.expense.customCategories.v1'

export function loadCustomCategories(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]).filter((s) => typeof s === 'string' && s.trim()) : []
  } catch { return [] }
}

export function saveCustomCategories(cats: string[]): void {
  localStorage.setItem(KEY, JSON.stringify(cats))
}

export function getAllCategories(customCategories: string[]): string[] {
  const seen = new Set(DEFAULT_EXPENSE_CATEGORIES)
  const custom = customCategories.filter((c) => !seen.has(c))
  return [...DEFAULT_EXPENSE_CATEGORIES, ...custom]
}
