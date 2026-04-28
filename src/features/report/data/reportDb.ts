import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'

// ─── Filter Options (Phase A) ─────────────────────────────────────────────────

export type BranchOption = { id: string; code: string; name: string }

export type ReportFilterOptions = {
  categories: string[]
  brands: string[]
  subCategories: string[]
  branches: BranchOption[]
  memberTypes: string[]
}

export async function loadReportFilterOptionsAsync(): Promise<ReportFilterOptions | null> {
  if (!isTauri()) return null
  return invoke<ReportFilterOptions>('report_filter_options')
}

// ─── Shared filter type ───────────────────────────────────────────────────────

export type SalesFilters = {
  category?: string | null
  brand?: string | null
  paymentType?: string | null
  branchId?: string | null
  memberType?: string | null
  priceTier?: string | null
}

// ─── Sales Summary ────────────────────────────────────────────────────────────

export type ReportPaymentRow = { paymentType: string; count: number; totalBaht: number }
export type ReportDailyRow   = { date: string; count: number; total: number }
export type ReportSalesSummary = {
  count: number
  total: number
  avgBill: number
  byPayment: ReportPaymentRow[]
  dailyTrend: ReportDailyRow[]
}

export async function loadReportSalesSummaryAsync(
  dateFrom: string,
  dateTo: string,
  filters?: SalesFilters,
): Promise<ReportSalesSummary | null> {
  if (!isTauri()) return null
  return invoke<ReportSalesSummary>('report_sales_summary', {
    dateFrom, dateTo,
    category: filters?.category ?? null,
    brand: filters?.brand ?? null,
    paymentType: filters?.paymentType ?? null,
    branchId: filters?.branchId ?? null,
  })
}

// ─── Top Products ─────────────────────────────────────────────────────────────

export type ReportTopProductRow = {
  productId: string; sku: string; name: string; category: string
  qtySold: number; revenue: number
}

export async function loadReportTopProductsAsync(
  dateFrom: string,
  dateTo: string,
  limit = 10,
  filters?: SalesFilters,
): Promise<ReportTopProductRow[]> {
  if (!isTauri()) return []
  return invoke<ReportTopProductRow[]>('report_top_products', {
    dateFrom, dateTo, limit,
    category: filters?.category ?? null,
    brand: filters?.brand ?? null,
    paymentType: filters?.paymentType ?? null,
    branchId: filters?.branchId ?? null,
  })
}

// ─── Top Members ──────────────────────────────────────────────────────────────

export type ReportTopMemberRow = {
  memberCode: string; fullName: string; visitCount: number; totalSpent: number
}

export async function loadReportTopMembersAsync(
  dateFrom: string,
  dateTo: string,
  limit = 10,
  filters?: SalesFilters,
): Promise<ReportTopMemberRow[]> {
  if (!isTauri()) return []
  return invoke<ReportTopMemberRow[]>('report_top_members', {
    dateFrom, dateTo, limit,
    memberType: filters?.memberType ?? null,
    priceTier: filters?.priceTier ?? null,
    branchId: filters?.branchId ?? null,
  })
}

// ─── Tax Invoices ─────────────────────────────────────────────────────────────

export type ReportTaxInvoiceRow = {
  billNo: string; taxInvoiceNo: string; docDate: string
  memberName: string; beforeVat: number; vatAmount: number; grandTotal: number
}

export async function loadReportTaxInvoicesAsync(yearMonth: string): Promise<ReportTaxInvoiceRow[]> {
  if (!isTauri()) return []
  return invoke<ReportTaxInvoiceRow[]>('report_tax_invoices', { yearMonth })
}

// ─── Slow Movers ──────────────────────────────────────────────────────────────

export type ReportSlowMoverRow = {
  productId: string; sku: string; name: string; category: string; lastSoldAt: string | null
}

export async function loadReportSlowMoversAsync(days = 30, limit = 50): Promise<ReportSlowMoverRow[]> {
  if (!isTauri()) return []
  return invoke<ReportSlowMoverRow[]>('report_slow_movers', { days, limit })
}

// ─── Adjustments ─────────────────────────────────────────────────────────────

export type ReportVoidRow = {
  billNo: string; docDate: string; voidedAt: string
  grandTotal: number; voidReason: string; memberName: string
}

export type ReportReturnRow = {
  returnNo: string; returnDate: string; originalBillNo: string
  refundMethod: string; totalRefund: number; reason: string; memberName: string
}

export type ReportAdjustmentsResult = {
  voidCount: number; voidTotal: number; voids: ReportVoidRow[]
  returnCount: number; returnTotal: number; returns: ReportReturnRow[]
}

export async function loadReportAdjustmentsAsync(
  dateFrom: string,
  dateTo: string,
): Promise<ReportAdjustmentsResult | null> {
  if (!isTauri()) return null
  return invoke<ReportAdjustmentsResult>('report_adjustments', { dateFrom, dateTo })
}

// ─── Credit Notes ─────────────────────────────────────────────────────────────

export type ReportCreditNoteRow = {
  creditNoteNo: string; creditNoteDate: string; originalBillNo: string
  originalTaxInvoiceNo: string; memberName: string
  beforeVat: number; vatAmount: number; totalAmount: number
}

export async function loadReportCreditNotesAsync(yearMonth: string): Promise<ReportCreditNoteRow[]> {
  if (!isTauri()) return []
  return invoke<ReportCreditNoteRow[]>('report_credit_notes', { yearMonth })
}

// ─── Stock Ledger ─────────────────────────────────────────────────────────────

export type ReportStockLedgerRow = {
  productId: string; sku: string; name: string; category: string
  minStock: number; stockQty: number
}

export async function loadReportStockLedgerAsync(limit = 300): Promise<ReportStockLedgerRow[]> {
  if (!isTauri()) return []
  return invoke<ReportStockLedgerRow[]>('report_stock_ledger', { limit })
}

// ─── AR Balances ──────────────────────────────────────────────────────────────

export type ReportArBalanceRow = {
  memberCode: string; fullName: string; arBalance: number; creditLimit: number; lastSaleAt: string | null
}

export async function loadReportArBalancesAsync(): Promise<ReportArBalanceRow[]> {
  if (!isTauri()) return []
  return invoke<ReportArBalanceRow[]>('report_ar_balances')
}

// ─── Sales by Category ────────────────────────────────────────────────────────

export type ReportCategoryRow = {
  category: string; qtySold: number; revenue: number; billCount: number
}

export async function loadReportSalesByCategoryAsync(
  dateFrom: string,
  dateTo: string,
  filters?: SalesFilters,
): Promise<ReportCategoryRow[]> {
  if (!isTauri()) return []
  return invoke<ReportCategoryRow[]>('report_sales_by_category', {
    dateFrom, dateTo,
    brand: filters?.brand ?? null,
    paymentType: filters?.paymentType ?? null,
    branchId: filters?.branchId ?? null,
  })
}

// ─── Profit Margin (Phase C) ──────────────────────────────────────────────────

export type ReportMarginRow = {
  productId: string; sku: string; name: string; category: string
  qtySold: number; revenue: number; cogs: number; grossProfit: number; marginPct: number
}

export type ReportMarginCategoryRow = {
  category: string; revenue: number; cogs: number; grossProfit: number; marginPct: number
}

export type ReportProfitSummary = {
  revenue: number; cogs: number; grossProfit: number; marginPct: number
  byCategory: ReportMarginCategoryRow[]
  topProducts: ReportMarginRow[]
}

export async function loadReportProfitMarginAsync(
  dateFrom: string,
  dateTo: string,
  filters?: SalesFilters,
): Promise<ReportProfitSummary | null> {
  if (!isTauri()) return null
  return invoke<ReportProfitSummary>('report_profit_margin', {
    dateFrom, dateTo,
    category: filters?.category ?? null,
    brand: filters?.brand ?? null,
    branchId: filters?.branchId ?? null,
  })
}

// ─── Member Segments (Phase D) ────────────────────────────────────────────────

export type ReportSegmentRow = {
  segment: string; memberCount: number; billCount: number; revenue: number; avgBill: number
}

export async function loadReportMemberSegmentsAsync(
  dateFrom: string,
  dateTo: string,
): Promise<ReportSegmentRow[]> {
  if (!isTauri()) return []
  return invoke<ReportSegmentRow[]>('report_member_segments', { dateFrom, dateTo })
}

// ─── RFM Analysis (Phase D) ───────────────────────────────────────────────────

export type ReportRfmRow = {
  memberCode: string; fullName: string
  recencyDays: number; frequency: number; monetary: number
  rScore: number; fScore: number; mScore: number
  rfmTotal: number; rfmSegment: string
}

export async function loadReportRfmAsync(limit = 100): Promise<ReportRfmRow[]> {
  if (!isTauri()) return []
  return invoke<ReportRfmRow[]>('report_rfm', { limit })
}

// ─── P&L Summary (Phase E) ────────────────────────────────────────────────────

export type PnlMonthRow = {
  month: string; revenue: number; cogs: number; expenses: number; net: number
}

export type ReportPnlResult = {
  revenue: number; cogs: number; grossProfit: number; grossMarginPct: number
  totalExpenses: number; netProfit: number
  monthlyTrend: PnlMonthRow[]
}

export async function loadReportPnlAsync(
  dateFrom: string,
  dateTo: string,
): Promise<ReportPnlResult | null> {
  if (!isTauri()) return null
  return invoke<ReportPnlResult>('report_pnl', { dateFrom, dateTo })
}

// ─── ABC Analysis (Phase F) ───────────────────────────────────────────────────

export type ReportAbcRow = {
  productId: string; sku: string; name: string; category: string
  revenue: number; revenuePct: number; cumPct: number; abcClass: 'A' | 'B' | 'C'
}

export async function loadReportAbcAnalysisAsync(
  dateFrom: string,
  dateTo: string,
): Promise<ReportAbcRow[]> {
  if (!isTauri()) return []
  return invoke<ReportAbcRow[]>('report_abc_analysis', { dateFrom, dateTo })
}

// ─── Dead Stock (Phase F) ─────────────────────────────────────────────────────

export type ReportDeadStockRow = {
  productId: string; sku: string; name: string; category: string
  stockQty: number; costPrice: number; tiedUpValue: number
  lastMovement: string | null; daysIdle: number | null
}

export async function loadReportDeadStockAsync(daysThreshold = 90): Promise<ReportDeadStockRow[]> {
  if (!isTauri()) return []
  return invoke<ReportDeadStockRow[]>('report_dead_stock', { daysThreshold })
}
