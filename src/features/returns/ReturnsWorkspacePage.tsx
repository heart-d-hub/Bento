import {
  claimCreateAsync,
  claimDeleteAsync,
  claimListAsync,
  claimUpdateAsync,
  returnListAsync,
  CLAIM_STATUS_LABELS,
  CLAIM_STATUSES,
  type ClaimRow,
  type ClaimStatus,
  type ReturnListRow,
} from '@/features/returns/returnsClaimsDb'
import {
  REFUND_METHOD_LABELS,
  RETURN_REASON_OPTIONS,
  saleReturnCreateAsync,
  type SaleReturnPayload,
} from '@/features/pos/data/saleAdjustmentsDb'
import { getPosSaleByBillNoAsync, type PosSalesHistoryRow } from '@/features/pos/data/posSalesDb'
import { clsx } from 'clsx'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  History,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
  } catch { return iso }
}

function fmtDateInput(d: Date) { return d.toISOString().slice(0, 10) }

type Preset = 'today' | 'week' | 'month' | 'last_month' | 'custom'
const PRESETS: { id: Preset; label: string }[] = [
  { id: 'today',      label: 'วันนี้' },
  { id: 'week',       label: 'สัปดาห์นี้' },
  { id: 'month',      label: 'เดือนนี้' },
  { id: 'last_month', label: 'เดือนที่แล้ว' },
  { id: 'custom',     label: 'กำหนดเอง' },
]

function getPresetRange(preset: Preset): { from: string; to: string } {
  const now = new Date()
  switch (preset) {
    case 'today': return { from: fmtDateInput(now), to: fmtDateInput(now) }
    case 'week': {
      const day = now.getDay()
      const mon = new Date(now)
      mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
      return { from: fmtDateInput(mon), to: fmtDateInput(now) }
    }
    case 'month':
      return { from: fmtDateInput(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmtDateInput(now) }
    case 'last_month':
      return {
        from: fmtDateInput(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: fmtDateInput(new Date(now.getFullYear(), now.getMonth(), 0)),
      }
    default: return { from: fmtDateInput(now), to: fmtDateInput(now) }
  }
}

const CLAIM_STATUS_COLORS: Record<ClaimStatus, { badge: string; dot: string }> = {
  pending:     { badge: 'bg-amber-100 text-amber-800',   dot: 'bg-amber-400' },
  in_progress: { badge: 'bg-blue-100 text-blue-800',     dot: 'bg-blue-500' },
  resolved:    { badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  rejected:    { badge: 'bg-rose-100 text-rose-800',     dot: 'bg-rose-400' },
}

const REFUND_COLORS: Record<string, string> = {
  cash:      'bg-emerald-100 text-emerald-800',
  credit:    'bg-indigo-100 text-indigo-800',
  deduct_ar: 'bg-violet-100 text-violet-800',
}

// ─── Tab: Create Return ───────────────────────────────────────────────────────

type LineState = { checked: boolean; qty: string }

function CreateReturnTab() {
  const [billSearch, setBillSearch] = useState('')
  const [searching, setSearching]   = useState(false)
  const [foundBill, setFoundBill]   = useState<PosSalesHistoryRow | null>(null)
  const [notFound, setNotFound]     = useState(false)
  const [lineState, setLineState]   = useState<Record<number, LineState>>({})
  const [reason, setReason]         = useState('')
  const [customReason, setCustomReason] = useState('')
  const [refundMethod, setRefundMethod] = useState<SaleReturnPayload['refundMethod']>('cash')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState<{ returnNo: string; totalRefund: number; creditNoteNo?: string } | null>(null)

  const lines = useMemo(() => (foundBill?.lines ?? []).filter((l) => l.unitPrice !== undefined), [foundBill])

  const setLine = (i: number, patch: Partial<LineState>) =>
    setLineState((prev) => ({ ...prev, [i]: { ...prev[i], ...patch } }))

  const selectedLines = useMemo(() =>
    lines.flatMap((l, i) => {
      const s = lineState[i]
      if (!s?.checked) return []
      const qty = parseFloat(s.qty)
      if (!qty || qty <= 0 || qty > l.qty) return []
      const unitPrice = l.unitPrice ?? 0
      return [{ productId: l.productId, productName: l.name, qty, unitPrice, lineTotal: Math.round(qty * unitPrice * 100) / 100 }]
    }),
  [lines, lineState])

  const totalRefund = useMemo(() => selectedLines.reduce((s, l) => s + l.lineTotal, 0), [selectedLines])
  const effectiveReason = reason === 'อื่นๆ' ? customReason.trim() : reason

  const handleSearch = async () => {
    if (!billSearch.trim()) return
    setSearching(true); setNotFound(false); setFoundBill(null); setSuccess(null); setError(null)
    try {
      const bill = await getPosSaleByBillNoAsync(billSearch.trim())
      if (bill) {
        setFoundBill(bill)
        setLineState(Object.fromEntries((bill.lines ?? []).map((l, i) => [i, { checked: true, qty: String(l.qty) }])))
      } else { setNotFound(true) }
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setSearching(false) }
  }

  const handleSubmit = async () => {
    if (!foundBill || selectedLines.length === 0) return
    setSubmitting(true); setError(null)
    try {
      const result = await saleReturnCreateAsync({
        originalSaleId: foundBill.id,
        reason: effectiveReason || undefined,
        refundMethod,
        lines: selectedLines,
      })
      setSuccess({ returnNo: result.returnNo, totalRefund: result.totalRefund, creditNoteNo: result.creditNoteNo })
      setFoundBill(null); setBillSearch(''); setLineState({})
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-4">
      {/* Success banner */}
      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">บันทึกการคืนสินค้าสำเร็จ</p>
            <p className="text-xs text-emerald-700">
              เลขที่ <span className="font-mono font-bold">{success.returnNo}</span>
              {' · '}ยอดคืน ฿{fmt(success.totalRefund)}
              {success.creditNoteNo && <span> · ใบลดหนี้ <span className="font-mono">{success.creditNoteNo}</span></span>}
            </p>
          </div>
          <button type="button" onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={billSearch}
            onChange={(e) => setBillSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleSearch() }}
            placeholder="ค้นหาเลขบิล (เช่น R2604001)"
            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={searching || !billSearch.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {searching ? <RefreshCw className="size-4 animate-spin" /> : <Search className="size-4" />}
          ค้นหา
        </button>
      </div>

      {notFound && (
        <p className="rounded-xl border border-dashed border-slate-200 py-4 text-center text-sm text-slate-400">
          ไม่พบเลขบิล "{billSearch}"
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</div>
      )}

      {/* Bill detail */}
      {foundBill && (
        <div className="space-y-3">
          {/* Bill header */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">เลขบิล</p>
              <p className="font-mono text-sm font-bold text-slate-900">{foundBill.billNo}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">วันที่</p>
              <p className="text-sm text-slate-700">{fmtDate(foundBill.at)}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">ยอดรวม</p>
              <p className="font-mono text-sm font-semibold text-slate-900">฿{fmt(foundBill.total)}</p>
            </div>
            {foundBill.voidedAt && (
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                ยกเลิกแล้ว
              </span>
            )}
          </div>

          {/* Lines */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-8 px-3 py-2">
                    <input
                      type="checkbox"
                      className="size-3.5"
                      checked={lines.length > 0 && lines.every((_, i) => lineState[i]?.checked)}
                      onChange={(e) => setLineState(Object.fromEntries(lines.map((l, i) => [i, { checked: e.target.checked, qty: String(l.qty) }])))}
                    />
                  </th>
                  <th className="px-3 py-2 text-left">สินค้า</th>
                  <th className="px-3 py-2 text-right">ราคา/หน่วย</th>
                  <th className="px-3 py-2 text-right">จำนวนคืน</th>
                  <th className="px-3 py-2 text-right">ยอดคืน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((l, i) => {
                  const s = lineState[i] ?? { checked: false, qty: '0' }
                  const returnQty = parseFloat(s.qty) || 0
                  const unitPrice = l.unitPrice ?? 0
                  const lineTotal = Math.round(returnQty * unitPrice * 100) / 100
                  const qtyInvalid = s.checked && (returnQty <= 0 || returnQty > l.qty)
                  return (
                    <tr key={i} className={clsx('transition', !s.checked && 'opacity-40')}>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" className="size-3.5" checked={s.checked}
                          onChange={(e) => setLine(i, { checked: e.target.checked })} />
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-slate-800">{l.name}</p>
                        {l.sku && <p className="font-mono text-[10px] text-slate-400">{l.sku}</p>}
                        <p className="text-[10px] text-slate-400">ซื้อมา {l.qty} ชิ้น</p>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">฿{fmt(unitPrice)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <input
                          type="number" min={0.01} max={l.qty} step={1} value={s.qty}
                          disabled={!s.checked}
                          onChange={(e) => setLine(i, { qty: e.target.value })}
                          className={clsx(
                            'w-16 rounded-lg border px-1.5 py-0.5 text-right text-xs tabular-nums outline-none',
                            qtyInvalid
                              ? 'border-rose-400 bg-rose-50 text-rose-800'
                              : 'border-slate-200 bg-white text-slate-800 focus:border-indigo-400',
                          )}
                        />
                      </td>
                      <td className={clsx('px-3 py-2.5 text-right tabular-nums font-semibold', s.checked && returnQty > 0 ? 'text-indigo-700' : 'text-slate-300')}>
                        {s.checked && returnQty > 0 ? `฿${fmt(lineTotal)}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Reason + refund method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">เหตุผล</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-400">
                <option value="">— เลือก —</option>
                {RETURN_REASON_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {reason === 'อื่นๆ' && (
                <input value={customReason} onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="ระบุเหตุผล"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-400" />
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">วิธีคืนเงิน</label>
              <div className="space-y-1.5">
                {(Object.keys(REFUND_METHOD_LABELS) as SaleReturnPayload['refundMethod'][]).map((k) => (
                  <label key={k} className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                    <input type="radio" name="refund-method-create" value={k}
                      checked={refundMethod === k} onChange={() => setRefundMethod(k)} className="size-3.5" />
                    {REFUND_METHOD_LABELS[k]}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-[10px] text-slate-500">ยอดคืนรวม ({selectedLines.length} รายการ)</p>
              <p className="font-mono text-xl font-bold tabular-nums text-indigo-700">฿{fmt(totalRefund)}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setFoundBill(null); setBillSearch('') }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                ยกเลิก
              </button>
              <button type="button" onClick={() => void handleSubmit()}
                disabled={submitting || selectedLines.length === 0 || !!foundBill.voidedAt}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                {submitting ? <RefreshCw className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                ยืนยันคืนสินค้า
              </button>
            </div>
          </div>
        </div>
      )}

      {!foundBill && !notFound && !success && (
        <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
          <RotateCcw className="size-8 opacity-30" />
          <p className="text-sm">ค้นหาเลขบิลเพื่อเริ่มต้นการคืนสินค้า</p>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Claims ──────────────────────────────────────────────────────────────

type ClaimForm = { productName: string; serialNo: string; issue: string; vendorName: string; returnId: string }
const BLANK_CLAIM: ClaimForm = { productName: '', serialNo: '', issue: '', vendorName: '', returnId: '' }

function ClaimsTab() {
  const [claims, setClaims]         = useState<ClaimRow[]>([])
  const [statusFilter, setFilter]   = useState<ClaimStatus | 'all'>('all')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [showAdd, setShowAdd]       = useState(false)
  const [addForm, setAddForm]       = useState<ClaimForm>(BLANK_CLAIM)
  const [saving, setSaving]         = useState(false)
  const [editId, setEditId]         = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<ClaimStatus>('pending')
  const [editResolution, setEditResolution] = useState('')
  const [editVendor, setEditVendor] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setClaims(await claimListAsync(statusFilter === 'all' ? null : statusFilter)) }
    catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { void load() }, [load])

  const handleAdd = async () => {
    if (!addForm.productName || !addForm.issue) return
    setSaving(true)
    try {
      await claimCreateAsync({
        returnId: addForm.returnId || null,
        productName: addForm.productName,
        serialNo: addForm.serialNo || null,
        issue: addForm.issue,
        vendorName: addForm.vendorName || null,
      })
      setAddForm(BLANK_CLAIM); setShowAdd(false); await load()
    } catch (e) { alert(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  const handleEditSave = async () => {
    if (!editId) return
    setSaving(true)
    try {
      await claimUpdateAsync(editId, editStatus, editResolution || null, editVendor || null)
      setEditId(null); await load()
    } catch (e) { alert(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ลบข้อมูลเคลมนี้?')) return
    await claimDeleteAsync(id); await load()
  }

  const pendingCount = claims.filter((c) => c.status === 'pending').length
  const inProgressCount = claims.filter((c) => c.status === 'in_progress').length

  return (
    <div className="space-y-4">
      {/* KPI + actions row */}
      <div className="flex flex-wrap items-center gap-3">
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
            <span className="size-2 rounded-full bg-amber-400" />
            รอดำเนินการ {pendingCount} รายการ
          </span>
        )}
        {inProgressCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
            <span className="size-2 rounded-full bg-blue-500" />
            กำลังดำเนินการ {inProgressCount} รายการ
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => void load()} disabled={loading}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={clsx('size-3', loading && 'animate-spin')} />
          </button>
          <button type="button" onClick={() => { setShowAdd(true); setEditId(null) }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
            <Plus className="size-3" />เพิ่มเคลม
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {(['all', ...CLAIM_STATUSES] as const).map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)}
            className={clsx(
              'rounded-xl border px-3 py-1 text-xs font-medium transition',
              statusFilter === s
                ? 'border-indigo-400 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}>
            {s === 'all' ? 'ทั้งหมด' : CLAIM_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading && <p className="py-6 text-center text-sm text-slate-400">กำลังโหลด…</p>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</div>}

      {/* Add form */}
      {showAdd && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm">
          <h3 className="mb-3 text-xs font-semibold text-indigo-800">เพิ่มเคลมใหม่</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { key: 'productName', label: 'ชื่อสินค้า', required: true },
              { key: 'serialNo',    label: 'S/N (ถ้ามี)' },
              { key: 'vendorName',  label: 'ซัพพลายเออร์' },
              { key: 'returnId',    label: 'เลขคืนสินค้า (ถ้ามี)' },
              { key: 'issue',       label: 'ปัญหา / อาการ', required: true },
            ].map(({ key, label, required }) => (
              <div key={key} className={key === 'issue' ? 'col-span-2' : ''}>
                <label className="mb-1 block text-[10px] font-medium text-slate-600">
                  {label}{required && <span className="ml-0.5 text-rose-500">*</span>}
                </label>
                <input type="text" value={addForm[key as keyof ClaimForm]}
                  onChange={(e) => setAddForm({ ...addForm, [key]: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400" />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              ยกเลิก
            </button>
            <button type="button" onClick={() => void handleAdd()}
              disabled={saving || !addForm.productName || !addForm.issue}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? <RefreshCw className="size-3 animate-spin" /> : <Plus className="size-3" />}บันทึก
            </button>
          </div>
        </div>
      )}

      {/* Edit status form */}
      {editId && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
          <h3 className="mb-3 text-xs font-semibold text-slate-700">อัปเดตสถานะเคลม</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-slate-600">สถานะ</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as ClaimStatus)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400">
                {CLAIM_STATUSES.map((s) => <option key={s} value={s}>{CLAIM_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-slate-600">ซัพพลายเออร์</label>
              <input type="text" value={editVendor} onChange={(e) => setEditVendor(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-[10px] font-medium text-slate-600">การแก้ไข / ผลลัพธ์</label>
              <input type="text" value={editResolution} onChange={(e) => setEditResolution(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400" />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setEditId(null)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              ยกเลิก
            </button>
            <button type="button" onClick={() => void handleEditSave()} disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? <RefreshCw className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}บันทึก
            </button>
          </div>
        </div>
      )}

      {/* Claims table */}
      {!loading && claims.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 text-left">เลขเคลม</th>
                <th className="px-3 py-2 text-left">สินค้า</th>
                <th className="px-3 py-2 text-left">ปัญหา</th>
                <th className="px-3 py-2 text-left">ซัพพลายเออร์</th>
                <th className="px-3 py-2 text-left">สถานะ</th>
                <th className="px-3 py-2 text-left">วันที่</th>
                <th className="w-16 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claims.map((c) => {
                const colors = CLAIM_STATUS_COLORS[c.status]
                return (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2.5">
                      <p className="font-mono font-semibold text-indigo-700">{c.claimNo}</p>
                      {c.returnNo && <p className="text-[10px] text-slate-400">คืน: {c.returnNo}</p>}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-900">{c.productName}</p>
                      {c.serialNo && <p className="font-mono text-[10px] text-slate-400">S/N: {c.serialNo}</p>}
                    </td>
                    <td className="max-w-[180px] px-3 py-2.5 text-slate-600">
                      <p className="line-clamp-2">{c.issue}</p>
                      {c.resolution && <p className="mt-0.5 text-[10px] text-emerald-600">↳ {c.resolution}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{c.vendorName || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', colors.badge)}>
                        <span className={clsx('size-1.5 rounded-full', colors.dot)} />
                        {CLAIM_STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">{fmtDate(c.createdAt)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button type="button"
                          onClick={() => {
                            setEditId(c.id); setEditStatus(c.status)
                            setEditResolution(c.resolution ?? ''); setEditVendor(c.vendorName ?? '')
                            setShowAdd(false)
                          }}
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <Pencil className="size-3" />
                        </button>
                        <button type="button" onClick={() => void handleDelete(c.id)}
                          className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && claims.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
          <AlertCircle className="size-7 opacity-30" />
          <p className="text-sm">ยังไม่มีรายการเคลมสินค้า</p>
        </div>
      )}
    </div>
  )
}

// ─── Tab: History ─────────────────────────────────────────────────────────────

function HistoryTab() {
  const [preset, setPreset]         = useState<Preset>('month')
  const [customFrom, setCustomFrom] = useState(fmtDateInput(new Date()))
  const [customTo, setCustomTo]     = useState(fmtDateInput(new Date()))
  const [returns, setReturns]       = useState<ReturnListRow[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const resolvedRange = useCallback(() => {
    if (preset === 'custom') return { from: customFrom, to: customTo }
    return getPresetRange(preset)
  }, [preset, customFrom, customTo])

  const load = useCallback(async () => {
    const { from, to } = resolvedRange()
    if (!from || !to) return
    setLoading(true); setError(null)
    try { setReturns(await returnListAsync(from, to)) }
    catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(false) }
  }, [resolvedRange])

  useEffect(() => { if (preset !== 'custom') void load() }, [preset])

  const totalRefund = returns.reduce((s, r) => s + r.totalRefund, 0)

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPreset(p.id)}
            className={clsx(
              'rounded-xl border px-3 py-1.5 text-xs font-medium transition',
              preset === p.id
                ? 'border-indigo-400 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            )}>
            {p.label}
          </button>
        ))}
        <button type="button" onClick={() => void load()} disabled={loading}
          className="ml-auto flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={clsx('size-3', loading && 'animate-spin')} />
        </button>
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-400" />
          <span className="text-xs text-slate-400">ถึง</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-400" />
          <button type="button" onClick={() => void load()} disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            <RefreshCw className={clsx('size-3', loading && 'animate-spin')} />โหลด
          </button>
        </div>
      )}

      {loading && <p className="py-6 text-center text-sm text-slate-400">กำลังโหลด…</p>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</div>}

      {!loading && returns.length > 0 && (
        <>
          {/* KPI */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">รายการคืน</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-900">{returns.length}</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-rose-500">ยอดคืนรวม</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-900">฿{fmt(totalRefund)}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">เฉลี่ย/รายการ</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-700">
                ฿{fmt(returns.length ? totalRefund / returns.length : 0)}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 border-b border-slate-100 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">เลขคืน</th>
                    <th className="px-3 py-2 text-left">บิลต้นทาง</th>
                    <th className="px-3 py-2 text-left">วันที่</th>
                    <th className="px-3 py-2 text-left">ลูกค้า</th>
                    <th className="px-3 py-2 text-left">วิธีคืน</th>
                    <th className="px-3 py-2 text-left">เหตุผล</th>
                    <th className="px-3 py-2 text-left">ใบลดหนี้</th>
                    <th className="px-3 py-2 text-right">ยอดคืน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returns.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2 font-mono font-semibold text-indigo-700">{r.returnNo}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{r.originalBillNo}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">{fmtDate(r.returnDate)}</td>
                      <td className="px-3 py-2 text-slate-700">{r.memberName || <span className="text-slate-400">ทั่วไป</span>}</td>
                      <td className="px-3 py-2">
                        <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-semibold', REFUND_COLORS[r.refundMethod] ?? 'bg-slate-100 text-slate-700')}>
                          {REFUND_METHOD_LABELS[r.refundMethod as keyof typeof REFUND_METHOD_LABELS] ?? r.refundMethod}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500">{r.reason || '—'}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-violet-700">{r.creditNoteNo || '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-rose-700">
                        ฿{fmt(r.totalRefund)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && returns.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
          <History className="size-7 opacity-30" />
          <p className="text-sm">ไม่มีรายการคืนสินค้าในช่วงเวลานี้</p>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'create' | 'claims' | 'history'

const TABS: { id: Tab; label: string; icon: typeof RotateCcw }[] = [
  { id: 'create',  label: 'คืนสินค้า',   icon: RotateCcw },
  { id: 'claims',  label: 'เคลมสินค้า',  icon: AlertTriangle },
  { id: 'history', label: 'ประวัติคืน',  icon: History },
]

type Props = { className?: string }

export function ReturnsWorkspacePage({ className }: Props) {
  const [tab, setTab] = useState<Tab>('create')

  return (
    <div
      className={clsx(
        'flex min-h-[min(85vh,56rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      {/* Header */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/90 to-white px-4 py-3 lg:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-200/80 bg-white text-indigo-700 shadow-sm">
            <RotateCcw className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-slate-900 lg:text-lg">คืนสินค้า / เคลม</h1>
            <p className="text-xs text-slate-500">คืนสินค้า · เคลมสินค้า · ประวัติ</p>
          </div>

          {/* Tab bar */}
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
        {tab === 'create'  && <CreateReturnTab />}
        {tab === 'claims'  && <ClaimsTab />}
        {tab === 'history' && <HistoryTab />}
      </div>
    </div>
  )
}
