import { loadReportFilterOptionsAsync, type ReportFilterOptions } from '@/features/report/data/reportDb'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type FilterPreset = 'today' | 'week' | 'month' | 'last_month' | 'custom'

export type ReportFilters = {
  preset: FilterPreset
  dateFrom: string
  dateTo: string
  category: string | null
  brand: string | null
  paymentType: string | null
  branchId: string | null
  memberType: string | null
  priceTier: string | null
}

type ReportFilterCtx = {
  filters: ReportFilters
  options: ReportFilterOptions | null
  setFilter: <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => void
  resetFilters: () => void
  activeCount: number
}

function fmtDate(d: Date) { return d.toISOString().slice(0, 10) }

export function getPresetDates(preset: FilterPreset): { from: string; to: string } {
  const now = new Date()
  switch (preset) {
    case 'today': return { from: fmtDate(now), to: fmtDate(now) }
    case 'week': {
      const day = now.getDay()
      const mon = new Date(now)
      mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
      return { from: fmtDate(mon), to: fmtDate(now) }
    }
    case 'month':
      return { from: fmtDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmtDate(now) }
    case 'last_month':
      return {
        from: fmtDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: fmtDate(new Date(now.getFullYear(), now.getMonth(), 0)),
      }
    default: return { from: fmtDate(now), to: fmtDate(now) }
  }
}

const { from: initFrom, to: initTo } = getPresetDates('month')

const DEFAULT_FILTERS: ReportFilters = {
  preset: 'month',
  dateFrom: initFrom,
  dateTo: initTo,
  category: null,
  brand: null,
  paymentType: null,
  branchId: null,
  memberType: null,
  priceTier: null,
}

const Ctx = createContext<ReportFilterCtx | null>(null)

export function useReportFilters() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useReportFilters must be used within ReportFilterProvider')
  return ctx
}

export function ReportFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS)
  const [options, setOptions] = useState<ReportFilterOptions | null>(null)

  useEffect(() => {
    void loadReportFilterOptionsAsync().then((o) => { if (o) setOptions(o) })
  }, [])

  const setFilter = useCallback(<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'preset' && value !== 'custom') {
        const { from, to } = getPresetDates(value as FilterPreset)
        next.dateFrom = from
        next.dateTo = to
      }
      return next
    })
  }, [])

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  const activeCount = [
    filters.category, filters.brand, filters.paymentType,
    filters.branchId, filters.memberType, filters.priceTier,
  ].filter(Boolean).length

  return (
    <Ctx.Provider value={{ filters, options, setFilter, resetFilters, activeCount }}>
      {children}
    </Ctx.Provider>
  )
}
