import { getLatestUnitCostForPo } from '@/features/purchase/data/poMovingAverage'
import { nextPurchaseOrderNo } from '@/features/purchase/data/poSequence'
import { loadPurchaseOrders, upsertPurchaseOrder } from '@/features/purchase/data/poStore'
import { getStoredBranch } from '@/features/auth/authSession'
import {
  deleteQuotation,
  loadQuotations,
  nextQuotationNo,
  QUOTATION_STATUS_LABELS,
  QUOTATIONS_CHANGED_EVENT,
  upsertQuotation,
  type Quotation,
  type QuotationLine,
  type QuotationStatus,
} from '@/features/purchase/data/quotationStore'
import {
  extractItemsFromText,
  extractPriceListFromFile,
} from '@/features/purchase/data/priceListImport'
import { loadSupplierDirectory } from '@/features/purchase/data/supplierDirectoryStore'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { mergeInventoryProductsWithLiveStock } from '@/features/pos/data/posLiveStock'
import { getClaudeApiKey, setClaudeApiKey } from '@/features/settings/data/claudeApiKey'
import { clsx } from 'clsx'
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  FileUp,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Product = ReturnType<typeof mergeInventoryProductsWithLiveStock>[number]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) }
  catch { return iso }
}

function statusBadgeClass(s: QuotationStatus) {
  const map: Record<QuotationStatus, string> = {
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    confirmed: 'bg-sky-50 text-sky-700 border-sky-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    converted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return map[s]
}

// ── Draft row type for create form ───────────────────────────────────────────

type DraftRow = {
  id: string
  productId: string | null
  sku: string
  name: string
  qty: number
  unitPrice: number
  searchQ: string
  dropdownOpen: boolean
}

function makeDraftRow(): DraftRow {
  return {
    id: `dr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: null, sku: '', name: '', qty: 1, unitPrice: 0,
    searchQ: '', dropdownOpen: false,
  }
}

// ── Row search dropdown ───────────────────────────────────────────────────────

function ProductSearchDropdown({
  q,
  products,
  onSelect,
  onClose,
}: {
  q: string
  products: Product[]
  onSelect: (p: Product) => void
  onClose: () => void
}) {
  const hits = useMemo(() => {
    const term = q.toLowerCase()
    return products.filter((p) =>
      p.sku.toLowerCase().includes(term) || p.name.toLowerCase().includes(term)
    ).slice(0, 8)
  }, [q, products])

  if (!hits.length) return null
  return (
    <div className="absolute left-0 top-full z-[200] mt-0.5 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
      {hits.map((p) => (
        <button
          key={p.id}
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-sky-50"
          onMouseDown={(e) => { e.preventDefault(); onSelect(p); onClose() }}
        >
          <span className="w-16 shrink-0 text-[10px] font-mono text-slate-400">{p.sku}</span>
          <span className="min-w-0 flex-1 truncate text-xs text-slate-800">{p.name}</span>
          <span className="text-[10px] text-emerald-600">฿{fmt(getLatestUnitCostForPo(p))}</span>
        </button>
      ))}
    </div>
  )
}

// ── Create quotation modal ────────────────────────────────────────────────────

function CreateQuotationModal({
  onSave,
  onClose,
}: {
  onSave: (q: Quotation) => void
  onClose: () => void
}) {
  const suppliers = useMemo(() => loadSupplierDirectory(), [])
  const allProducts = useMemo(() => mergeInventoryProductsWithLiveStock(getPosCatalogProducts()), [])

  const [supplierId, setSupplierId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<DraftRow[]>([makeDraftRow()])
  const [importTab, setImportTab] = useState<'manual' | 'text' | 'file'>('manual')
  const [pasteText, setPasteText] = useState('')
  const [apiKey, setApiKeyState] = useState(() => getClaudeApiKey())
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const updateRow = (id: string, patch: Partial<DraftRow>) =>
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r))

  const deleteRow = (id: string) =>
    setRows((prev) => prev.filter((r) => r.id !== id))

  const selectProduct = (rowId: string, p: Product) => {
    updateRow(rowId, {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      unitPrice: getLatestUnitCostForPo(p),
      searchQ: '',
      dropdownOpen: false,
    })
  }

  const handleImportText = () => {
    const items = extractItemsFromText(pasteText)
    if (!items.length) { setImportError('ไม่พบรายการในข้อความ'); return }
    const newRows: DraftRow[] = items.map((item) => {
      const match = allProducts.find((p) =>
        p.name.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(p.name.toLowerCase().slice(0, 6))
      )
      return {
        id: `dr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: match?.id ?? null,
        sku: match?.sku ?? '',
        name: match?.name ?? item.name,
        qty: item.qty,
        unitPrice: item.unitCost,
        searchQ: '',
        dropdownOpen: false,
      }
    })
    setRows((prev) => {
      const blank = prev.filter((r) => !r.name)
      return [...newRows, ...(blank.length < prev.length ? [] : [])]
    })
    setImportError('')
    setImportTab('manual')
  }

  const handleImportFile = async (file: File) => {
    const key = apiKey.trim()
    if (!key) { setImportError('กรุณาใส่ Claude API Key'); return }
    setClaudeApiKey(key)
    setImporting(true)
    setImportError('')
    try {
      const items = await extractPriceListFromFile(file, key)
      if (!items.length) { setImportError('ไม่พบรายการในไฟล์'); return }
      const newRows: DraftRow[] = items.map((item) => {
        const match = allProducts.find((p) =>
          p.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(p.name.toLowerCase().slice(0, 6))
        )
        return {
          id: `dr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: match?.id ?? null,
          sku: match?.sku ?? '',
          name: match?.name ?? item.name,
          qty: item.qty,
          unitPrice: item.unitCost,
          searchQ: '',
          dropdownOpen: false,
        }
      })
      setRows(newRows)
      setImportTab('manual')
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'นำเข้าไม่สำเร็จ')
    } finally {
      setImporting(false)
    }
  }

  const handleSave = () => {
    const supplier = suppliers.find((s) => s.id === supplierId)
    const validRows = rows.filter((r) => r.name.trim())
    if (!validRows.length) { window.alert('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ'); return }
    const q: Quotation = {
      id: `qt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      quotationNo: nextQuotationNo(),
      supplierId,
      supplierName: supplier?.name ?? 'ไม่ระบุซัพพลายเออร์',
      status: 'draft',
      createdAt: new Date().toISOString(),
      validUntil: validUntil || undefined,
      notes: notes.trim() || undefined,
      lines: validRows.map((r) => ({
        lineId: r.id,
        productId: r.productId,
        sku: r.sku,
        name: r.name.trim(),
        qty: r.qty,
        unitPrice: r.unitPrice,
      })),
    }
    onSave(q)
  }

  const inputClass = 'w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100'
  const tabBtn = (t: typeof importTab, label: string) => (
    <button
      type="button"
      onClick={() => setImportTab(t)}
      className={clsx(
        'px-3 py-1.5 text-xs font-semibold rounded-lg transition',
        importTab === t ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100',
      )}
    >{label}</button>
  )

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <ClipboardList className="size-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">สร้างใบเสนอราคาใหม่</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-4 p-5">
            {/* Meta */}
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-[11px] font-medium text-slate-700">
                ซัพพลายเออร์
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-sky-300"
                >
                  <option value="">— ไม่ระบุ —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] font-medium text-slate-700">
                ใช้ได้ถึงวันที่
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-sky-300"
                />
              </label>
              <label className="block text-[11px] font-medium text-slate-700">
                หมายเหตุ
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น ราคาโปรโมชั่น Q2"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-sky-300"
                />
              </label>
            </div>

            {/* Import tabs */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 flex items-center gap-1">
                {tabBtn('manual', '✏️ กรอกเอง')}
                {tabBtn('text', '📋 วางข้อความ')}
                {tabBtn('file', '📄 PDF / รูป')}
              </div>

              {importTab === 'text' && (
                <div className="space-y-2">
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    rows={6}
                    placeholder={'วางรายการราคาจากเซลล์ เช่น:\nผ้าเบรก Toyota 10 450\nน้ำมันเครื่อง 5W-30 24 320'}
                    className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-sky-300"
                  />
                  <button
                    type="button"
                    onClick={handleImportText}
                    className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
                  >
                    นำเข้า →
                  </button>
                </div>
              )}

              {importTab === 'file' && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-slate-700">
                    Claude API Key
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKeyState(e.target.value)}
                      placeholder="sk-ant-..."
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs outline-none focus:border-sky-300"
                    />
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleImportFile(f)
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    disabled={importing}
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {importing ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
                    {importing ? 'กำลังอ่าน...' : 'เลือกไฟล์ PDF / รูปภาพ'}
                  </button>
                </div>
              )}

              {importError && (
                <p className="mt-2 text-xs font-medium text-rose-600">{importError}</p>
              )}
            </div>

            {/* Line items table */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">รายการสินค้า</p>
                <button
                  type="button"
                  onClick={() => setRows((prev) => [...prev, makeDraftRow()])}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-900"
                >
                  <Plus className="size-3" /> เพิ่มแถว
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[580px] border-collapse text-xs">
                  <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="w-8 px-2 py-2 text-center">#</th>
                      <th className="px-3 py-2 text-left">สินค้า</th>
                      <th className="w-16 px-2 py-2 text-right">จำนวน</th>
                      <th className="w-28 px-2 py-2 text-right">ราคาที่เสนอ</th>
                      <th className="w-28 px-2 py-2 text-right">ต้นทุนปัจจุบัน</th>
                      <th className="w-8 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, idx) => {
                      const matchedProduct = allProducts.find((p) => p.id === row.productId)
                      const currentCost = matchedProduct ? getLatestUnitCostForPo(matchedProduct) : 0
                      return (
                        <tr key={row.id} className="group">
                          <td className="px-2 py-2 text-center text-slate-400">{idx + 1}</td>
                          <td className="px-2 py-2">
                            <div className="relative">
                              {row.productId ? (
                                <div className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1">
                                  <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
                                    <span className="mr-1 text-slate-400">[{row.sku}]</span>{row.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateRow(row.id, { productId: null, sku: '', name: '', searchQ: '' })}
                                    className="text-slate-300 hover:text-rose-500"
                                  >
                                    <X className="size-3" />
                                  </button>
                                </div>
                              ) : (
                                <input
                                  value={row.searchQ || row.name}
                                  onChange={(e) => updateRow(row.id, { searchQ: e.target.value, name: e.target.value, dropdownOpen: true })}
                                  onFocus={() => updateRow(row.id, { dropdownOpen: true })}
                                  onBlur={() => setTimeout(() => updateRow(row.id, { dropdownOpen: false }), 150)}
                                  placeholder="ค้นหาหรือพิมพ์ชื่อสินค้า..."
                                  className={inputClass}
                                />
                              )}
                              {row.dropdownOpen && (row.searchQ || row.name) && !row.productId && (
                                <ProductSearchDropdown
                                  q={row.searchQ || row.name}
                                  products={allProducts}
                                  onSelect={(p) => selectProduct(row.id, p)}
                                  onClose={() => updateRow(row.id, { dropdownOpen: false })}
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={1}
                              value={row.qty}
                              onChange={(e) => updateRow(row.id, { qty: Math.max(1, Number(e.target.value) || 1) })}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-right outline-none focus:border-sky-300"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={row.unitPrice || ''}
                              placeholder="0"
                              onChange={(e) => updateRow(row.id, { unitPrice: Math.max(0, Number(e.target.value) || 0) })}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-right outline-none focus:border-sky-300"
                            />
                          </td>
                          <td className="px-2 py-2 text-right">
                            {currentCost > 0 ? (
                              <span className={clsx(
                                'font-semibold',
                                row.unitPrice > 0 && row.unitPrice < currentCost ? 'text-emerald-600' :
                                row.unitPrice > 0 && row.unitPrice > currentCost ? 'text-rose-500' : 'text-slate-400',
                              )}>
                                ฿{fmt(currentCost)}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => deleteRow(row.id)}
                              className="text-slate-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2 text-sm font-bold text-white hover:bg-slate-900"
          >
            <ClipboardList className="size-4" />
            บันทึกใบเสนอราคา
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Quotation detail panel ────────────────────────────────────────────────────

function QuotationDetail({
  quotation,
  onUpdate,
  onDelete,
  onClose,
}: {
  quotation: Quotation
  onUpdate: (q: Quotation) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const allProducts = useMemo(() => mergeInventoryProductsWithLiveStock(getPosCatalogProducts()), [])
  const suppliers = useMemo(() => loadSupplierDirectory(), [])

  const lineDetails = useMemo(() =>
    quotation.lines.map((l) => {
      const product = l.productId ? allProducts.find((p) => p.id === l.productId) : null
      const currentCost = product ? getLatestUnitCostForPo(product) : 0
      const diff = currentCost > 0 && l.unitPrice > 0 ? l.unitPrice - currentCost : null
      const savingsPct = currentCost > 0 && diff !== null ? (-diff / currentCost) * 100 : null
      return { ...l, currentCost, diff, savingsPct }
    }),
    [quotation, allProducts],
  )

  const total = quotation.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
  const avgSavings = useMemo(() => {
    const valid = lineDetails.filter((l) => l.savingsPct !== null)
    if (!valid.length) return null
    return valid.reduce((s, l) => s + l.savingsPct!, 0) / valid.length
  }, [lineDetails])

  const canEdit = quotation.status === 'draft' || quotation.status === 'confirmed'

  const setStatus = (status: QuotationStatus) => {
    onUpdate({ ...quotation, status })
  }

  const handleConvertToPo = () => {
    if (quotation.lines.length === 0) return
    const supplier = suppliers.find((s) => s.id === quotation.supplierId)
    const branchId = getStoredBranch() ?? 'somneuk'
    const existing = loadPurchaseOrders()
    const draftForSupplier = existing.find((o) => o.status === 'draft' && o.supplierId === quotation.supplierId)
    const now = new Date().toISOString()
    const lines = quotation.lines.map((l) => ({
      lineId: `line-${l.lineId}-${Date.now()}`,
      productId: l.productId ?? `unmatched-${l.lineId}`,
      sku: l.sku,
      name: l.name,
      orderedQty: l.qty,
      unitCostOrder: l.unitPrice,
      receivedQtyTotal: 0,
    }))

    if (draftForSupplier) {
      const merged = { ...draftForSupplier }
      for (const line of lines) {
        const idx = merged.lines.findIndex((ml) => ml.productId === line.productId)
        if (idx >= 0) {
          merged.lines = merged.lines.map((ml, i) =>
            i === idx ? { ...ml, orderedQty: ml.orderedQty + line.orderedQty, unitCostOrder: line.unitCostOrder } : ml,
          )
        } else {
          merged.lines = [...merged.lines, line]
        }
      }
      upsertPurchaseOrder(merged)
    } else {
      upsertPurchaseOrder({
        id: `po-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        poNo: nextPurchaseOrderNo(branchId as 'somneuk' | 'ang'),
        branchId: branchId as 'somneuk' | 'ang',
        supplierId: quotation.supplierId,
        supplierName: supplier?.name ?? quotation.supplierName,
        status: 'draft',
        createdAt: now,
        lines,
        receiveBatches: [],
        vatRatePercent: 0,
        billDiscountBaht: 0,
        paymentMode: 'unpaid',
      })
    }
    onUpdate({ ...quotation, status: 'converted' })
    window.alert('สร้าง PO สำเร็จ — ไปที่ "ตะกร้าสั่งซื้อ" เพื่อยืนยัน')
  }

  const handleDelete = () => {
    if (!window.confirm(`ลบใบเสนอราคา ${quotation.quotationNo}?`)) return
    onDelete(quotation.id)
    onClose()
  }

  const isExpired = quotation.validUntil && new Date(quotation.validUntil) < new Date()

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* header */}
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-slate-900">{quotation.quotationNo}</span>
            <span className={clsx('rounded-full border px-2 py-0.5 text-[10px] font-semibold', statusBadgeClass(quotation.status))}>
              {QUOTATION_STATUS_LABELS[quotation.status]}
            </span>
            {isExpired && (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                หมดอายุ
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-semibold text-slate-700">{quotation.supplierName}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
            <span>สร้าง {fmtDate(quotation.createdAt)}</span>
            {quotation.validUntil && <span>ใช้ได้ถึง {fmtDate(quotation.validUntil)}</span>}
            {quotation.notes && <span className="italic">{quotation.notes}</span>}
          </div>
        </div>
        <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X className="size-5" />
        </button>
      </div>

      {/* savings summary */}
      {avgSavings !== null && (
        <div className={clsx(
          'flex shrink-0 items-center gap-2 border-b px-5 py-2 text-xs font-medium',
          avgSavings >= 0 ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-rose-100 bg-rose-50 text-rose-700',
        )}>
          {avgSavings >= 0
            ? <TrendingDown className="size-3.5 shrink-0" />
            : <TrendingUp className="size-3.5 shrink-0" />}
          {avgSavings >= 0
            ? `ราคาเสนอถูกกว่าต้นทุนปัจจุบันเฉลี่ย ${avgSavings.toFixed(1)}%`
            : `ราคาเสนอแพงกว่าต้นทุนปัจจุบันเฉลี่ย ${Math.abs(avgSavings).toFixed(1)}%`}
        </div>
      )}

      {/* lines table */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[640px] border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 text-left">สินค้า</th>
              <th className="px-3 py-2.5 text-right">จำนวน</th>
              <th className="px-3 py-2.5 text-right">ราคาที่เสนอ</th>
              <th className="px-3 py-2.5 text-right">ต้นทุนปัจจุบัน</th>
              <th className="px-3 py-2.5 text-right">ส่วนต่าง</th>
              <th className="px-3 py-2.5 text-right">รวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lineDetails.map((l) => (
              <tr key={l.lineId} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{l.name}</p>
                  {l.sku && <p className="text-[10px] text-slate-400">{l.sku}</p>}
                  {!l.productId && (
                    <span className="mt-0.5 inline-block rounded bg-amber-100 px-1 text-[9px] font-bold text-amber-700">ยังไม่ได้จับคู่</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-700">{l.qty}</td>
                <td className="px-3 py-3 text-right tabular-nums font-semibold text-slate-900">
                  {l.unitPrice > 0
                    ? `฿${fmt(l.unitPrice)}`
                    : <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">ยังไม่มีราคา</span>}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {l.currentCost > 0 ? (
                    <span className="text-slate-600">฿{fmt(l.currentCost)}</span>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {l.diff !== null ? (
                    <span className={clsx('font-semibold', l.diff <= 0 ? 'text-emerald-600' : 'text-rose-500')}>
                      {l.diff <= 0 ? '▼' : '▲'}
                      {fmt(Math.abs(l.diff))}
                      {l.savingsPct !== null && (
                        <span className="ml-1 text-[10px] opacity-70">{Math.abs(l.savingsPct).toFixed(1)}%</span>
                      )}
                    </span>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-3 text-right tabular-nums font-bold text-slate-900">
                  ฿{fmt(l.qty * l.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50">
            <tr>
              <td colSpan={5} className="px-4 py-2.5 text-right text-xs font-semibold text-slate-600">รวมทั้งสิ้น</td>
              <td className="px-3 py-2.5 text-right text-base font-black text-slate-900">฿{fmt(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* actions */}
      {canEdit && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          {quotation.status === 'draft' && (
            <button
              type="button"
              onClick={() => setStatus('confirmed')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700"
            >
              <CheckCircle2 className="size-3.5" /> ยืนยันใบเสนอราคา
            </button>
          )}
          {(quotation.status === 'confirmed' || quotation.status === 'draft') && (
            <button
              type="button"
              onClick={handleConvertToPo}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              <FileText className="size-3.5" /> สร้าง PO
            </button>
          )}
          {quotation.status === 'draft' && (
            <button
              type="button"
              onClick={() => setStatus('rejected')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
            >
              <X className="size-3.5" /> ปฏิเสธ
            </button>
          )}
          {quotation.status !== 'converted' && (
            <button
              type="button"
              onClick={handleDelete}
              className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              title="ลบ"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type QuotationWorkspacePageProps = { className?: string }

export function QuotationWorkspacePage({ className }: QuotationWorkspacePageProps) {
  const [quotations, setQuotations] = useState<Quotation[]>(() => loadQuotations())
  const [selected, setSelected] = useState<Quotation | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [q, setQ] = useState('')
  const [filterStatus, setFilterStatus] = useState<QuotationStatus | ''>('')

  const refresh = useCallback(() => {
    const list = loadQuotations()
    setQuotations(list)
    if (selected) {
      const updated = list.find((x) => x.id === selected.id)
      setSelected(updated ?? null)
    }
  }, [selected])

  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener(QUOTATIONS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(QUOTATIONS_CHANGED_EVENT, handler)
  }, [refresh])

  const filtered = useMemo(() => {
    let list = quotations
    if (filterStatus) list = list.filter((qt) => qt.status === filterStatus)
    if (q.trim()) {
      const term = q.trim().toLowerCase()
      list = list.filter((qt) =>
        qt.quotationNo.toLowerCase().includes(term) ||
        qt.supplierName.toLowerCase().includes(term) ||
        qt.lines.some((l) => l.name.toLowerCase().includes(term)),
      )
    }
    return list
  }, [quotations, q, filterStatus])

  const handleSave = (qt: Quotation) => {
    upsertQuotation(qt)
    refresh()
    setCreateOpen(false)
    setSelected(qt)
  }

  const handleUpdate = (qt: Quotation) => {
    upsertQuotation(qt)
    refresh()
  }

  const handleDelete = (id: string) => {
    deleteQuotation(id)
    refresh()
    setSelected(null)
  }

  const allStatuses: { value: QuotationStatus | ''; label: string }[] = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'draft', label: 'แบบร่าง' },
    { value: 'confirmed', label: 'ยืนยันแล้ว' },
    { value: 'converted', label: 'สร้าง PO แล้ว' },
    { value: 'rejected', label: 'ปฏิเสธ' },
  ]

  return (
    <div className={clsx('flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm', className)}>
      {/* left list */}
      <div className="flex w-72 shrink-0 flex-col border-r border-slate-200">
        <div className="shrink-0 border-b border-slate-100 bg-slate-50 p-3 space-y-2">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-2 text-sm font-bold text-white hover:bg-slate-900"
          >
            <Plus className="size-4" /> สร้างใบเสนอราคา
          </button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหา..."
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-sky-300"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {allStatuses.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setFilterStatus(s.value)}
                className={clsx(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold transition',
                  filterStatus === s.value
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
              <ClipboardList className="size-10 stroke-[1]" />
              <p className="text-xs">{quotations.length === 0 ? 'ยังไม่มีใบเสนอราคา' : 'ไม่พบรายการ'}</p>
            </div>
          ) : (
            filtered.map((qt) => {
              const total = qt.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
              const isSelected = selected?.id === qt.id
              const isExpired = qt.validUntil && new Date(qt.validUntil) < new Date()
              return (
                <button
                  key={qt.id}
                  type="button"
                  onClick={() => setSelected(qt)}
                  className={clsx(
                    'w-full border-b border-slate-100 px-3 py-3 text-left transition hover:bg-slate-50',
                    isSelected && 'bg-sky-50 hover:bg-sky-50',
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900">{qt.quotationNo}</span>
                    <span className={clsx('shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold', statusBadgeClass(qt.status))}>
                      {QUOTATION_STATUS_LABELS[qt.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-slate-600">{qt.supplierName}</p>
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-slate-400">{fmtDate(qt.createdAt)} · {qt.lines.length} รายการ</span>
                    <span className="text-[11px] font-bold text-slate-900">฿{total.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                  </div>
                  {isExpired && qt.status !== 'converted' && qt.status !== 'rejected' && (
                    <span className="mt-1 inline-block rounded bg-rose-50 px-1.5 text-[9px] font-semibold text-rose-600">หมดอายุ</span>
                  )}
                  {isSelected && <ChevronRight className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-sky-400" />}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* right detail */}
      <div className="min-w-0 flex-1">
        {selected ? (
          <QuotationDetail
            quotation={selected}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onClose={() => setSelected(null)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
            <Eye className="size-14 stroke-[1]" />
            <p className="text-sm font-semibold">เลือกใบเสนอราคาจากรายการทางซ้าย</p>
            <p className="text-xs">หรือกด «สร้างใบเสนอราคา» เพื่อสร้างใหม่</p>
          </div>
        )}
      </div>

      {createOpen && (
        <CreateQuotationModal
          onSave={handleSave}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  )
}
