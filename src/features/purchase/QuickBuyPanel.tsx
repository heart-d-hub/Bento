import { getLatestUnitCostForPo } from '@/features/purchase/data/poMovingAverage'
import { receiveQtyToBranchStock } from '@/features/purchase/data/poStockReceive'
import { getSupplierCatalog, mergeItemsIntoSupplierCatalog } from '@/features/purchase/data/supplierCatalogStore'
import { extractItemsFromText, extractPriceListFromFile } from '@/features/purchase/data/priceListImport'
import { loadSupplierDirectory } from '@/features/purchase/data/supplierDirectoryStore'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { mergeInventoryProductsWithLiveStock } from '@/features/pos/data/posLiveStock'
import { getClaudeApiKey } from '@/features/settings/data/claudeApiKey'
import { clsx } from 'clsx'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileUp,
  Loader2,
  PackagePlus,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

type Product = ReturnType<typeof mergeInventoryProductsWithLiveStock>[number]

type PurchaseRow = {
  id: string
  productId: string | null
  sku: string
  name: string
  qty: number
  unitCost: number
  matched: boolean
}

function makeRow(): PurchaseRow {
  return {
    id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: null,
    sku: '',
    name: '',
    qty: 1,
    unitCost: 0,
    matched: false,
  }
}

const SELF_BUY_LOG_KEY = 'bento.purchase.selfBuy.v1'

function saveSelfBuyLog(rows: PurchaseRow[]) {
  try {
    const raw = localStorage.getItem(SELF_BUY_LOG_KEY)
    const list = raw ? (JSON.parse(raw) as unknown[]) : []
    const now = new Date().toISOString()
    for (const row of rows) {
      list.unshift({
        id: `sb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        at: now,
        productId: row.productId,
        sku: row.sku,
        name: row.name,
        qty: row.qty,
        unitCost: row.unitCost,
      })
    }
    localStorage.setItem(SELF_BUY_LOG_KEY, JSON.stringify((list as unknown[]).slice(0, 500)))
  } catch { /* ignore */ }
}

// ── Per-row search dropdown ──────────────────────────────────────────────────

function SearchDropdown({
  search,
  products,
  visible,
  onSelect,
}: {
  search: string
  products: Product[]
  visible: boolean
  onSelect: (p: Product) => void
}) {
  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return products
      .filter(
        (p) =>
          p.sku.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.barcode ?? '').toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [search, products])

  if (!visible || results.length === 0) return null

  return (
    <div className="absolute left-0 top-full z-50 mt-0.5 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      {results.map((p, i) => (
        <button
          key={p.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(p)
          }}
          className={clsx(
            'flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-emerald-50',
            i === 0 && 'bg-slate-50',
          )}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded bg-slate-100 text-[9px] font-bold text-slate-600">
            {p.sku.slice(0, 3)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-slate-800">{p.name}</span>
            <span className="text-[10px] text-slate-400">
              {p.sku} · สต็อก {p.stock}
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}

// ── Import modal ─────────────────────────────────────────────────────────────

type ImportModalProps = {
  onClose: () => void
  onImport: (items: Array<{ name: string; qty: number; unitCost: number }>) => void
}

function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [tab, setTab] = useState<'text' | 'file'>('text')

  // text tab
  const [pastedText, setPastedText] = useState('')

  // file tab
  const [file, setFile] = useState<File | null>(null)
  const [apiKey, setApiKey] = useState(() => getClaudeApiKey())
  const [keyMissing, setKeyMissing] = useState(false)
  const apiKeyRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTextImport = () => {
    const items = extractItemsFromText(pastedText)
    if (items.length === 0) {
      setError('ไม่พบรายการ — ลองวางข้อความในรูปแบบ: ชื่อสินค้า จำนวน ราคา (แยกบรรทัด)')
      return
    }
    onImport(items)
    onClose()
  }

  const handleFileImport = async () => {
    if (!file) return
    if (!apiKey.trim()) {
      setKeyMissing(true)
      apiKeyRef.current?.focus()
      return
    }
    setKeyMissing(false)
    setClaudeApiKey(apiKey)
    setLoading(true)
    setError(null)
    try {
      const items = await extractPriceListFromFile(file, apiKey)
      if (items.length === 0) throw new Error('ไม่พบรายการสินค้า — ลองถ่ายรูปให้ชัดขึ้นหรือเลือกไฟล์อื่น')
      onImport(items)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-bold text-slate-800">นำเข้ารายการสินค้า</p>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="size-5" />
          </button>
        </div>

        {/* tabs */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => { setTab('text'); setError(null) }}
            className={clsx(
              'flex-1 py-2.5 text-xs font-semibold transition',
              tab === 'text'
                ? 'border-b-2 border-emerald-500 text-emerald-700'
                : 'text-slate-400 hover:text-slate-600',
            )}
          >
            📋 วางข้อความ
            <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">ไม่ต้องใช้ API</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('file'); setError(null) }}
            className={clsx(
              'flex-1 py-2.5 text-xs font-semibold transition',
              tab === 'file'
                ? 'border-b-2 border-emerald-500 text-emerald-700'
                : 'text-slate-400 hover:text-slate-600',
            )}
          >
            📄 PDF / รูปภาพ
            <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">ต้องใช้ API</span>
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">

          {/* ── TEXT TAB ── */}
          {tab === 'text' && (
            <>
              <p className="text-xs text-slate-500">
                คัดลอกข้อความจาก LINE, WhatsApp, PDF แล้ววางที่นี่ — ระบบจะอ่านชื่อ จำนวน และราคาให้อัตโนมัติ
              </p>
              <textarea
                autoFocus
                rows={8}
                value={pastedText}
                onChange={(e) => { setPastedText(e.target.value); setError(null) }}
                placeholder={`ตัวอย่าง:\nข้าวสาร 5kg 10 150\nน้ำมันพืช 5 45\nซอสปรุงรส 20 25`}
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs leading-relaxed outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
              />
              <p className="text-[10px] text-slate-400">
                แต่ละบรรทัด = 1 สินค้า · รูปแบบ: ชื่อสินค้า [จำนวน] ราคา/หน่วย
              </p>
            </>
          )}

          {/* ── FILE TAB ── */}
          {tab === 'file' && (
            <>
              {/* drop zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setError(null) } }}
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition',
                  file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50',
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setError(null) } }}
                />
                <FileUp className={clsx('size-7', file ? 'text-emerald-500' : 'text-slate-400')} />
                {file ? (
                  <p className="text-center text-sm font-semibold text-emerald-700">{file.name}</p>
                ) : (
                  <>
                    <p className="text-center text-xs font-semibold text-slate-600">ลากไฟล์มาวาง หรือคลิกเลือก</p>
                    <p className="text-center text-[10px] text-slate-400">PDF · JPG · PNG · WEBP</p>
                  </>
                )}
              </div>

              {/* API key */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Claude API Key
                  {keyMissing
                    ? <span className="ml-1 font-normal text-rose-500">← จำเป็น กรุณาใส่ก่อน</span>
                    : <span className="ml-1 font-normal text-slate-400">ขอได้ที่ console.anthropic.com</span>
                  }
                </label>
                <input
                  ref={apiKeyRef}
                  type="password"
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setKeyMissing(false) }}
                  placeholder="sk-ant-api03-…"
                  className={clsx(
                    'w-full rounded-lg border px-3 py-2 text-xs font-mono outline-none transition',
                    keyMissing
                      ? 'border-rose-400 bg-rose-50 ring-1 ring-rose-200'
                      : 'border-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100',
                  )}
                />
                <p className="mt-1 text-[10px] text-slate-400">บันทึกในเครื่องนี้เท่านั้น · ใส่ครั้งเดียวใช้ได้เรื่อยๆ</p>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
          >
            ยกเลิก
          </button>
          {tab === 'text' ? (
            <button
              type="button"
              onClick={handleTextImport}
              disabled={!pastedText.trim()}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              นำเข้ารายการ
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFileImport}
              disabled={!file || loading}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <FileUp className="size-3.5" />}
              {loading ? 'กำลังวิเคราะห์…' : 'วิเคราะห์และนำเข้า'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main panel ───────────────────────────────────────────────────────────────

type QuickBuyPanelProps = { className?: string }

export function QuickBuyPanel({ className }: QuickBuyPanelProps) {
  const [rows, setRows] = useState<PurchaseRow[]>([makeRow()])
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [activeRow, setActiveRow] = useState<string | null>(null)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [supplierOpen, setSupplierOpen] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const nameRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const costRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const allProducts = useMemo(
    () => mergeInventoryProductsWithLiveStock(getPosCatalogProducts()),
    [],
  )
  const suppliers = useMemo(() => loadSupplierDirectory(), [])
  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId)
  const supplierCatalog = useMemo(
    () => (selectedSupplierId ? getSupplierCatalog(selectedSupplierId) : []),
    [selectedSupplierId],
  )

  const updateRow = (id: string, patch: Partial<PurchaseRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const removeRow = (id: string) =>
    setRows((prev) => {
      if (prev.length === 1) return [makeRow()]
      const next = prev.filter((r) => r.id !== id)
      setTimeout(() => nameRefs.current[next[next.length - 1]?.id]?.focus(), 20)
      return next
    })

  const addRowAfter = (afterId: string) => {
    const newRow = makeRow()
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === afterId)
      const next = [...prev]
      next.splice(idx + 1, 0, newRow)
      return next
    })
    setTimeout(() => nameRefs.current[newRow.id]?.focus(), 30)
  }

  const selectProduct = (rowId: string, p: Product) => {
    updateRow(rowId, {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      unitCost: getLatestUnitCostForPo(p),
      matched: true,
    })
    setOpenDropdown(null)
    setTimeout(() => qtyRefs.current[rowId]?.focus(), 20)
  }

  const loadSupplierLastOrder = () => {
    if (!supplierCatalog.length) return
    const newRows = supplierCatalog.map((item) => {
      const matched = item.productId
        ? allProducts.find((p) => p.id === item.productId)
        : allProducts.find((p) => p.name.toLowerCase() === item.name.toLowerCase())
      return {
        ...makeRow(),
        productId: item.productId,
        sku: item.sku || matched?.sku || '',
        name: item.name,
        qty: item.lastQty,
        unitCost: item.lastPrice,
        matched: !!matched,
        ...(matched ? { productId: matched.id, sku: matched.sku, name: matched.name } : {}),
      }
    })
    setRows(newRows)
  }

  const handleImportItems = (items: Array<{ name: string; qty: number; unitCost: number }>) => {
    const newRows = items.map((item) => {
      const q = item.name.trim().toLowerCase()
      const matched = allProducts.find(
        (p) =>
          p.name.toLowerCase() === q ||
          p.sku.toLowerCase() === q ||
          (p.barcode ?? '').toLowerCase() === q,
      )
      return {
        ...makeRow(),
        name: matched ? matched.name : item.name,
        sku: matched?.sku ?? '',
        productId: matched?.id ?? null,
        qty: item.qty,
        unitCost: item.unitCost || (matched ? getLatestUnitCostForPo(matched) : 0),
        matched: !!matched,
      }
    })
    setRows((prev) => {
      const hasContent = prev.some((r) => r.name.trim())
      return hasContent ? [...prev, ...newRows] : newRows
    })
  }

  const readyRows = rows.filter((r) => r.name.trim() && r.qty > 0)
  const matchedRows = readyRows.filter((r) => r.matched)
  const unmatchedCount = readyRows.length - matchedRows.length
  const totalCost = readyRows.reduce((s, r) => s + r.qty * r.unitCost, 0)

  const handleConfirm = async () => {
    if (readyRows.length === 0) return
    setSaving(true)
    try {
      for (const row of matchedRows) {
        if (row.productId) receiveQtyToBranchStock(row.productId, row.qty)
      }
      saveSelfBuyLog(readyRows)
      if (selectedSupplierId) {
        mergeItemsIntoSupplierCatalog(
          selectedSupplierId,
          readyRows.map((r) => ({
            productId: r.productId,
            sku: r.sku,
            name: r.name,
            qty: r.qty,
            unitCost: r.unitCost,
          })),
        )
      }
      setDone(true)
      setRows([makeRow()])
      setTimeout(() => setDone(false), 3000)
    } catch (e) {
      alert(`เกิดข้อผิดพลาด: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={clsx('relative flex h-full min-h-0 flex-col overflow-hidden', className)}>

      {/* ── Supplier bar ── */}
      <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
        <div className="flex items-center gap-2">
          {/* supplier picker */}
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => setSupplierOpen((v) => !v)}
              className={clsx(
                'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition',
                selectedSupplier
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
              )}
            >
              <span className="truncate">
                {selectedSupplier ? selectedSupplier.name : 'เลือกซัพพลายเออร์ (ไม่บังคับ)'}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                {selectedSupplier && (
                  <span
                    role="button"
                    tabIndex={0}
                    onMouseDown={(e) => { e.stopPropagation(); setSelectedSupplierId(''); setSupplierOpen(false) }}
                    className="text-slate-400 hover:text-rose-500"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <X className="size-3.5" />
                  </span>
                )}
                <ChevronDown className="size-3.5 text-slate-400" />
              </div>
            </button>
            {supplierOpen && (
              <div className="absolute left-0 top-full z-50 mt-0.5 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                {suppliers.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={() => { setSelectedSupplierId(s.id); setSupplierOpen(false) }}
                    className={clsx(
                      'flex w-full flex-col px-3 py-2 text-left hover:bg-emerald-50',
                      s.id === selectedSupplierId && 'bg-emerald-50',
                    )}
                  >
                    <span className="text-xs font-semibold text-slate-800">{s.name}</span>
                    {s.contactName && <span className="text-[10px] text-slate-400">{s.contactName}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* load last order */}
          {supplierCatalog.length > 0 && (
            <button
              type="button"
              onClick={loadSupplierLastOrder}
              title="โหลดรายการสั่งซื้อครั้งล่าสุดจากซัพพลายเออร์นี้"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <RotateCcw className="size-3.5" />
              โหลดรายการเดิม ({supplierCatalog.length})
            </button>
          )}

          {/* import file */}
          <button
            type="button"
            onClick={() => setShowImport(true)}
            title="นำเข้ารายการจาก PDF หรือรูปภาพราคาลิสต์"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <FileUp className="size-3.5" />
            นำเข้า PDF/รูป
          </button>
        </div>
      </div>

      {/* ── Column headers ── */}
      <div className="grid shrink-0 grid-cols-[1fr_76px_88px_68px_28px] gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        <span>สินค้า</span>
        <span className="text-right">จำนวน</span>
        <span className="text-right">ราคา/หน่วย</span>
        <span className="text-right">รวม</span>
        <span />
      </div>

      {/* ── Rows ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.map((row, idx) => (
          <div
            key={row.id}
            className={clsx(
              'grid grid-cols-[1fr_76px_88px_68px_28px] items-center gap-1.5 border-b border-slate-100 px-3 py-2 transition-colors',
              activeRow === row.id && 'bg-emerald-50/50',
            )}
          >
            {/* product / search */}
            <div className="relative">
              <input
                ref={(el) => { nameRefs.current[row.id] = el }}
                type="text"
                value={row.name}
                autoFocus={idx === 0}
                placeholder={idx === 0 ? 'พิมพ์ชื่อ / รหัส / บาร์โค้ด…' : 'สินค้า…'}
                onFocus={() => { setActiveRow(row.id); setOpenDropdown(row.id) }}
                onBlur={() => {
                  setActiveRow(null)
                  setTimeout(() => setOpenDropdown(null), 120)
                }}
                onChange={(e) => {
                  updateRow(row.id, { name: e.target.value, matched: false, productId: null, sku: '' })
                  setOpenDropdown(row.id)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' || e.key === 'Enter') {
                    e.preventDefault()
                    setOpenDropdown(null)
                    qtyRefs.current[row.id]?.focus()
                  } else if (e.key === 'Escape') {
                    setOpenDropdown(null)
                  }
                }}
                className={clsx(
                  'w-full rounded-lg border px-2 py-1.5 text-xs outline-none transition',
                  row.matched
                    ? 'border-emerald-300 bg-emerald-50 pr-10 font-semibold text-emerald-900 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100'
                    : 'border-slate-200 bg-white text-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100',
                )}
              />
              {row.matched && (
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-600">
                  {row.sku}
                </span>
              )}
              <SearchDropdown
                search={row.name}
                products={allProducts}
                visible={openDropdown === row.id}
                onSelect={(p) => selectProduct(row.id, p)}
              />
            </div>

            {/* qty */}
            <input
              ref={(el) => { qtyRefs.current[row.id] = el }}
              type="number"
              min={1}
              step={1}
              value={row.qty || ''}
              placeholder="1"
              onFocus={() => setActiveRow(row.id)}
              onBlur={() => setActiveRow(null)}
              onChange={(e) =>
                updateRow(row.id, { qty: Math.max(1, Math.floor(Number(e.target.value) || 1)) })
              }
              onKeyDown={(e) => {
                if (e.key === 'Tab' || e.key === 'Enter') {
                  e.preventDefault()
                  costRefs.current[row.id]?.focus()
                }
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-xs font-mono outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
            />

            {/* unit cost */}
            <input
              ref={(el) => { costRefs.current[row.id] = el }}
              type="number"
              min={0}
              step={0.01}
              value={row.unitCost || ''}
              placeholder="0.00"
              onFocus={() => setActiveRow(row.id)}
              onBlur={() => setActiveRow(null)}
              onChange={(e) =>
                updateRow(row.id, { unitCost: Math.max(0, Number(e.target.value) || 0) })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
                  e.preventDefault()
                  const nextRow = rows[idx + 1]
                  if (nextRow) nameRefs.current[nextRow.id]?.focus()
                  else addRowAfter(row.id)
                }
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-xs font-mono outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
            />

            {/* row total */}
            <span className="text-right text-xs font-bold text-slate-700">
              {row.qty > 0 && row.unitCost > 0 ? (
                `฿${(row.qty * row.unitCost).toLocaleString('th-TH', { maximumFractionDigits: 0 })}`
              ) : (
                <span className="text-slate-300">—</span>
              )}
            </span>

            {/* delete */}
            <button
              type="button"
              tabIndex={-1}
              onClick={() => removeRow(row.id)}
              className="flex items-center justify-center text-slate-300 transition hover:text-rose-500"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}

        {/* add row */}
        <button
          type="button"
          onClick={() => addRowAfter(rows[rows.length - 1].id)}
          className="flex w-full items-center gap-1.5 px-4 py-2.5 text-xs text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
        >
          <Plus className="size-3.5" />
          เพิ่มบรรทัด
        </button>
      </div>

      {/* ── Footer ── */}
      {readyRows.length > 0 && (
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          {unmatchedCount > 0 && (
            <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertCircle className="size-3.5 shrink-0" />
              {unmatchedCount} รายการไม่พบในระบบ — บันทึกล็อกแต่ไม่เพิ่มสต็อก
            </div>
          )}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {readyRows.length} รายการ{selectedSupplier && ` · ${selectedSupplier.name}`} · รวมจ่าย
            </span>
            <span className="text-xl font-black text-slate-900">
              ฿{totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-60"
          >
            <PackagePlus className="size-4" />
            ยืนยันซื้อ — รับเข้าสต็อก {matchedRows.length} รายการ
          </button>
        </div>
      )}

      {/* ── Success toast ── */}
      {done && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          <CheckCircle2 className="size-4" />
          รับเข้าสต็อกสำเร็จ!
          {selectedSupplier && <span className="opacity-80">· บันทึกรายการของ {selectedSupplier.name} แล้ว</span>}
        </div>
      )}

      {/* ── Import modal ── */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={handleImportItems}
        />
      )}
    </div>
  )
}
