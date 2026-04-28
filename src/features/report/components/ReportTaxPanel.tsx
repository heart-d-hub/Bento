import {
  loadReportCreditNotesAsync,
  loadReportTaxInvoicesAsync,
  type ReportCreditNoteRow,
  type ReportTaxInvoiceRow,
} from '@/features/report/data/reportDb'
import { clsx } from 'clsx'
import { Download, FileText, Printer, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
  } catch {
    return iso
  }
}

function currentYearMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function exportCsv(filename: string, headers: string[], rowsFn: string[][]) {
  const lines = [headers, ...rowsFn].map((cols) =>
    cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','),
  )
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ReportTaxPanel() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth)
  const [rows, setRows] = useState<ReportTaxInvoiceRow[]>([])
  const [cnRows, setCnRows] = useState<ReportCreditNoteRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const load = async (ym: string) => {
    setLoading(true)
    setError(null)
    try {
      const [invoices, cns] = await Promise.all([
        loadReportTaxInvoicesAsync(ym),
        loadReportCreditNotesAsync(ym),
      ])
      setRows(invoices)
      setCnRows(cns)
      setLoaded(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(yearMonth)
  }, [])

  const totalBeforeVat = rows.reduce((s, r) => s + r.beforeVat, 0)
  const totalVat = rows.reduce((s, r) => s + r.vatAmount, 0)
  const totalGrand = rows.reduce((s, r) => s + r.grandTotal, 0)

  const cnBeforeVat = cnRows.reduce((s, r) => s + r.beforeVat, 0)
  const cnVat = cnRows.reduce((s, r) => s + r.vatAmount, 0)
  const cnTotal = cnRows.reduce((s, r) => s + r.totalAmount, 0)

  const handlePrint = () => window.print()

  const handleExportInvoices = () => {
    exportCsv(
      `tax-invoices-${yearMonth}.csv`,
      ['เลขใบกำกับ', 'เลขบิล', 'วันที่', 'ลูกค้า', 'ก่อนภาษี', 'VAT', 'รวม'],
      rows.map((r) => [r.taxInvoiceNo, r.billNo, r.docDate, r.memberName,
        r.beforeVat.toFixed(2), r.vatAmount.toFixed(2), r.grandTotal.toFixed(2)]),
    )
  }

  const handleExportCn = () => {
    exportCsv(
      `credit-notes-${yearMonth}.csv`,
      ['เลขใบลดหนี้', 'วันที่', 'เลขใบกำกับเดิม', 'เลขบิลเดิม', 'ลูกค้า', 'ก่อนภาษี', 'VAT', 'รวม'],
      cnRows.map((r) => [r.creditNoteNo, r.creditNoteDate, r.originalTaxInvoiceNo,
        r.originalBillNo, r.memberName, r.beforeVat.toFixed(2), r.vatAmount.toFixed(2), r.totalAmount.toFixed(2)]),
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="month"
          value={yearMonth}
          onChange={(e) => setYearMonth(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-sm outline-none focus:border-indigo-400"
        />
        <button
          type="button"
          onClick={() => void load(yearMonth)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <RefreshCw className={clsx('size-3', loading && 'animate-spin')} />
          โหลด
        </button>
        {rows.length > 0 && (
          <>
            <button type="button" onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              <Printer className="size-3" />พิมพ์
            </button>
            <button type="button" onClick={handleExportInvoices}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              <Download className="size-3" />CSV
            </button>
          </>
        )}
      </div>

      {loading && <p className="py-8 text-center text-sm text-slate-400">กำลังโหลด…</p>}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</div>
      )}

      {!loading && loaded && rows.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">ไม่มีใบกำกับภาษีในเดือนนี้</p>
      )}

      {rows.length > 0 && (
        <>
          {/* Summary cards — invoices */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">ฐานภาษีรวม</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">฿{fmt(totalBeforeVat)}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">VAT 7% รวม</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-amber-900">฿{fmt(totalVat)}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">ยอดรวมทั้งสิ้น</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-emerald-900">฿{fmt(totalGrand)}</p>
            </div>
          </div>

          {/* Invoice table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="max-h-[32rem] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 border-b border-slate-200 bg-slate-50">
                  <tr className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 text-left">เลขใบกำกับ</th>
                    <th className="px-3 py-2 text-left">เลขบิล</th>
                    <th className="px-3 py-2 text-left">วันที่</th>
                    <th className="px-3 py-2 text-left">ลูกค้า</th>
                    <th className="px-3 py-2 text-right">ก่อนภาษี</th>
                    <th className="px-3 py-2 text-right">VAT</th>
                    <th className="px-3 py-2 text-right">รวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.billNo} className="hover:bg-slate-50">
                      <td className="px-3 py-1.5 font-mono text-[11px] text-indigo-700">
                        {r.taxInvoiceNo || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600">{r.billNo}</td>
                      <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">{fmtDate(r.docDate)}</td>
                      <td className="max-w-[10rem] truncate px-3 py-1.5 text-slate-800">
                        {r.memberName || <span className="text-slate-400">ลูกค้าทั่วไป</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-slate-700">{fmt(r.beforeVat)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-amber-700">{fmt(r.vatAmount)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-slate-900">
                        {fmt(r.grandTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-50">
                  <tr className="text-xs font-semibold">
                    <td colSpan={4} className="px-3 py-2 text-slate-600">รวม {rows.length} รายการ</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-800">{fmt(totalBeforeVat)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-amber-800">{fmt(totalVat)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-900">{fmt(totalGrand)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          {/* Credit notes */}
          {cnRows.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <FileText className="size-3.5 text-indigo-500" />
                  ใบลดหนี้ (Credit Notes) — {cnRows.length} รายการ
                </h2>
                <button type="button" onClick={handleExportCn}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50">
                  <Download className="size-3" />CSV
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2">
                  <p className="text-[10px] text-indigo-600 uppercase font-medium">ฐานภาษีลด</p>
                  <p className="text-sm font-bold tabular-nums text-indigo-900">฿{fmt(cnBeforeVat)}</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2">
                  <p className="text-[10px] text-amber-600 uppercase font-medium">VAT ลด</p>
                  <p className="text-sm font-bold tabular-nums text-amber-900">฿{fmt(cnVat)}</p>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2">
                  <p className="text-[10px] text-rose-600 uppercase font-medium">รวมลดหนี้</p>
                  <p className="text-sm font-bold tabular-nums text-rose-900">฿{fmt(cnTotal)}</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-indigo-100 bg-white">
                <table className="w-full text-xs">
                  <thead className="border-b border-indigo-100 bg-indigo-50">
                    <tr className="text-[10px] font-medium uppercase tracking-wide text-indigo-600">
                      <th className="px-3 py-2 text-left">เลขใบลดหนี้</th>
                      <th className="px-3 py-2 text-left">ใบกำกับเดิม</th>
                      <th className="px-3 py-2 text-left">วันที่</th>
                      <th className="px-3 py-2 text-left">ลูกค้า</th>
                      <th className="px-3 py-2 text-right">ก่อนภาษี</th>
                      <th className="px-3 py-2 text-right">VAT</th>
                      <th className="px-3 py-2 text-right">รวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50">
                    {cnRows.map((r) => (
                      <tr key={r.creditNoteNo} className="hover:bg-indigo-50/20">
                        <td className="px-3 py-1.5 font-mono text-[11px] text-indigo-700">{r.creditNoteNo}</td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-slate-500">{r.originalTaxInvoiceNo || r.originalBillNo}</td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-slate-500">{fmtDate(r.creditNoteDate)}</td>
                        <td className="max-w-[9rem] truncate px-3 py-1.5 text-slate-700">{r.memberName || <span className="text-slate-400">—</span>}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">{fmt(r.beforeVat)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-amber-700">{fmt(r.vatAmount)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-rose-700">{fmt(r.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-indigo-200 bg-indigo-50">
                    <tr className="text-xs font-semibold">
                      <td colSpan={4} className="px-3 py-2 text-indigo-700">รวม {cnRows.length} รายการ</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-700">{fmt(cnBeforeVat)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-amber-800">{fmt(cnVat)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-rose-800">{fmt(cnTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
