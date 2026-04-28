import { getProductImageUrl } from '@/features/inventory/data/productImages'
import { getLatestUnitCostForPo, getActiveCost } from '@/features/purchase/data/poMovingAverage'
import { loadPurchaseOrders } from '@/features/purchase/data/poStore'
import {
  CATALOG_CART_CHANGED,
  loadCatalogCart,
  saveCatalogCartSilent,
  type CatalogCartItem,
} from '@/features/purchase/data/catalogCartStore'

import {
  buildProductSupplierMap,
  getAllSupplierCatalogItems,
  getSupplierCatalog,
  unlinkProductFromSupplier,
  SUPPLIER_CATALOG_CHANGED_EVENT,
  type ProductSupplierEntry,
} from '@/features/purchase/data/supplierCatalogStore'
import { loadSupplierDirectory, type SupplierProfile } from '@/features/purchase/data/supplierDirectoryStore'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { mergeInventoryProductsWithLiveStock } from '@/features/pos/data/posLiveStock'
import { getProductMasterById, getProductMasterList, saveProductMasterList, collectInventoryCarFilterOptions, productMatchesInventoryCarFilters, PRODUCT_MASTER_LIST_CHANGED_EVENT, type ProductMasterDetail, type VehicleFitmentRef } from '@/features/inventory/data/productMasterData'
import { loadCategoryTree, type MainCategory } from '@/features/inventory/data/inventoryCategories'
import { AddProductModal } from '@/features/inventory/components/AddProductModal'
import { PRODUCT_PROMO_CHANGED_EVENT } from '@/features/purchase/data/poMovingAverage'
import {
  applyWarehouseThresholds,
  setWarehouseMinMax,
  INVENTORY_THRESHOLDS_CHANGED_EVENT,
} from '@/features/inventory/data/inventoryStockThresholds'
import { decodeVin, validateVin, type VinDecodeResult } from '@/features/inventory/data/vinDecoder'
import { loadVendorPromotions, saveVendorPromotions } from '@/features/promotions/data/vendorPromotionsStore'
import { PROMOTIONS_CHANGED_EVENT } from '@/features/promotions/data/promotionsStore'
import {
  isVendorPromotionActive,
  findBestVendorPromoTier,
  findNextVendorPromoTier,
} from '@/features/promotions/evaluateVendorPromo'
import type { VendorPromotion, VendorPromoTier } from '@/features/promotions/data/promotionTypes'
import { clsx } from 'clsx'
import {
  ArrowLeftRight,
  ChevronDown,
  Copy,
  ImageIcon,
  LayoutGrid,
  LayoutList,
  Car,
  Minus,
  Package,
  PackagePlus,
  Pencil,
  Percent,
  Plus,
  ScanLine,
  Search,
  ShoppingCart,
  Star,
  Store,
  TriangleAlert,
  Trophy,
  X,
} from 'lucide-react'
import { LowStockWorkspacePage } from '@/features/purchase/LowStockWorkspacePage'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type ViewMode = 'grid' | 'list'
const VIEW_MODE_KEY = 'bento.purchase.catalog.view.v1'
function loadViewMode(): ViewMode {
  try { return (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) ?? 'grid' } catch { return 'grid' }
}
function saveViewMode(v: ViewMode) {
  try { localStorage.setItem(VIEW_MODE_KEY, v) } catch { /* ignore */ }
}

type Product = ReturnType<typeof mergeInventoryProductsWithLiveStock>[number]

type CartItem = CatalogCartItem

// ── Smart search engine ───────────────────────────────────────────────────────

/** Lowercase + collapse separators/punctuation → space  e.g. "D-MAX" → "d max" */
function normTxt(s: string): string {
  return s.toLowerCase().replace(/[-_./\\()\[\]]+/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Remove ALL separators incl. spaces  e.g. "D-MAX" → "dmax", "SFA 0012" → "sfa0012" */
function stripAll(s: string): string {
  return s.toLowerCase().replace(/[-_./\\()\[\]\s]+/g, '')
}

/**
 * Score how well a single search token matches a field value.
 * Runs two passes: space-normalised then fully-stripped, so
 * "dmax" matches "D-MAX" and "d-max" matches "DMAX" equally.
 * 10 = exact · 8 = exact word · 6 = word-prefix · 4 = substring · 0 = miss
 */
function fieldScore(raw: string, tok: string): number {
  if (!raw || !tok) return 0

  // Pass 1 — separator → space
  const f = normTxt(raw)
  const t = normTxt(tok)
  if (f === t) return 10
  const words = f.split(' ')
  if (words.includes(t)) return 8
  if (words.some((w) => w.startsWith(t))) return 6
  if (f.startsWith(t)) return 5
  if (f.includes(t)) return 4

  // Pass 2 — strip all separators (handles dmax↔d-max, sfa0012↔sfa-0012)
  const fs = stripAll(raw)
  const ts = stripAll(tok)
  if (fs === ts) return 9
  if (fs.startsWith(ts)) return 5
  if (fs.includes(ts)) return 4

  return 0
}

/**
 * Returns a relevance score ≥ 1, or –1 if ANY token is unmatched (AND logic).
 * Score is summed across tokens so multi-word hits rank above single-word hits.
 */
function searchScore(fieldValues: string[], tokens: string[]): number {
  let total = 0
  for (const tok of tokens) {
    const best = Math.max(0, ...fieldValues.map((v) => fieldScore(v, tok)))
    if (best === 0) return -1
    total += best
  }
  return total
}

function productFields(p: Product): string[] {
  return [
    p.name, p.sku,
    p.genuineNo ?? '', p.factoryOem ?? '', p.barcode ?? '',
    p.brand ?? '', p.carBrand ?? '', p.carModelLabel ?? '', p.yearLabel ?? '',
    ...(p.vehicleFitments?.flatMap((f) => [
      f.brandName, f.modelName, f.driveType ?? '', f.yearRangeText ?? '',
      f.engineLabel, f.engineText ?? '', f.engineCode ?? '',
    ]) ?? []),
  ]
}

function masterFields(p: ProductMasterDetail): string[] {
  return [
    p.name, p.sku, p.factoryNo ?? '',
    p.brand, p.carBrand, p.carModelLabel, p.yearLabel,
    ...(p.oemTags ?? []),
    ...(p.crossReferenceTags ?? []),
    ...(p.vehicleFitments?.flatMap((f) => [
      f.brandName, f.modelName, f.driveType ?? '', f.yearRangeText ?? '',
      f.engineLabel, f.engineText ?? '', f.engineCode ?? '',
    ]) ?? []),
  ]
}

// ── VIN search box ───────────────────────────────────────────────────────────

function VinSearchBox({
  availableBrands,
  availableYears,
  onApply,
}: {
  availableBrands: string[]
  availableYears: string[]
  onApply: (brand: string, year: string, model: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [vin, setVin] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VinDecodeResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const clear = () => { setVin(''); setResult(null) }
  const close = () => { setOpen(false); clear() }

  const matchBrand = (make: string | null): string => {
    if (!make) return ''
    const up = make.toUpperCase()
    return availableBrands.find((b) => b.toUpperCase() === up)
      ?? availableBrands.find((b) => up.includes(b.toUpperCase()) || b.toUpperCase().includes(up))
      ?? ''
  }

  const matchYear = (year: number | null): string => {
    if (!year) return ''
    return availableYears.find((y) => y.includes(String(year))) ?? ''
  }

  const handleVinChange = async (raw: string) => {
    const v = raw.replace(/\s/g, '').toUpperCase().slice(0, 17)
    setVin(v)
    setResult(null)
    if (v.length === 17 && validateVin(v)) {
      setLoading(true)
      const decoded = await decodeVin(v)
      setResult(decoded)
      setLoading(false)
    }
  }

  const apply = () => {
    if (!result) return
    const brand = matchBrand(result.make)
    const year = matchYear(result.year)
    const model = result.model ?? ''
    onApply(brand, year, model)
    close()
  }

  return (
    <div className="relative">
      {!open ? (
        <button
          type="button"
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0) }}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-violet-300 hover:text-violet-600"
        >
          <ScanLine className="size-3.5" />
          VIN
        </button>
      ) : (
        <div className="flex items-center gap-1.5 rounded-lg border border-violet-300 bg-violet-50 px-2 py-1">
          <ScanLine className="size-3.5 shrink-0 text-violet-500" />
          <input
            ref={inputRef}
            type="text"
            value={vin}
            onChange={(e) => handleVinChange(e.target.value)}
            placeholder="วาง VIN 17 หลัก…"
            maxLength={17}
            className="w-44 bg-transparent text-xs font-mono outline-none placeholder:text-slate-400"
          />
          {/* Status */}
          {loading && (
            <span className="text-[10px] text-violet-500 animate-pulse">กำลังค้น…</span>
          )}
          {result && !loading && (
            <div className="flex items-center gap-1">
              {result.make ? (
                <>
                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                    {[result.make, result.model, result.year].filter(Boolean).join(' ')}
                    {result.engine && ` · ${result.engine}`}
                  </span>
                  <button
                    type="button"
                    onClick={apply}
                    className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-violet-700"
                  >
                    ใช้กรอง
                  </button>
                </>
              ) : (
                <span className="text-[10px] text-rose-500">ไม่รู้จัก WMI: <b>{result.wmi}</b></span>
              )}
            </div>
          )}
          {vin.length > 0 && vin.length < 17 && !loading && (
            <span className="text-[10px] text-slate-400">{vin.length}/17</span>
          )}
          <button type="button" onClick={close} className="ml-1 rounded-full p-0.5 text-slate-400 hover:text-slate-600">
            <X className="size-3" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Supplier searchable combobox ──────────────────────────────────────────────

function SupplierCombobox({
  suppliers,
  value,
  onChange,
}: {
  suppliers: SupplierProfile[]
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = suppliers.find((s) => s.id === value)
  const filtered = q.trim()
    ? suppliers.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
    : suppliers

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setQ('')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const select = (id: string) => { onChange(id); setOpen(false); setQ('') }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setTimeout(() => inputRef.current?.focus(), 0) }}
        className={clsx(
          'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition',
          value
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
        )}
      >
        <Store className="size-3.5 shrink-0" />
        <span className="max-w-[140px] truncate">{selected?.name ?? 'ซัพพลายเออร์ทั้งหมด'}</span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); select('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); select('') } }}
            className="ml-0.5 rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700"
          >
            <X className="size-3" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาซัพพลายเออร์…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => select('')}
              className={clsx(
                'flex w-full items-center px-3 py-2 text-xs transition hover:bg-slate-50',
                !value ? 'font-bold text-indigo-700' : 'text-slate-500',
              )}
            >
              ทั้งหมด
            </button>
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-center text-xs text-slate-400">ไม่พบ "{q}"</p>
            )}
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => select(s.id)}
                className={clsx(
                  'flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-slate-50',
                  value === s.id ? 'font-bold text-indigo-700' : 'text-slate-700',
                )}
              >
                {value === s.id && <span className="size-1.5 rounded-full bg-indigo-500 shrink-0" />}
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Inline min-stock editor ───────────────────────────────────────────────────

function MinStockEditor({ productId, minStock, orderQty, onSaved }: { productId: string; minStock: number; orderQty: number; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(minStock))
  const inputRef = useRef<HTMLInputElement>(null)

  const open = () => { setValue(String(minStock)); setEditing(true); setTimeout(() => inputRef.current?.select(), 0) }

  const commit = () => {
    const n = Math.max(0, Math.floor(Number(value) || 0))
    setWarehouseMinMax(productId, n, orderQty > 0 ? orderQty : null)
    onSaved()
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-slate-400">ขั้นต่ำ:</span>
        <input
          ref={inputRef}
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          className="w-12 rounded border border-indigo-300 bg-white px-1 py-0.5 text-center text-[10px] font-bold outline-none ring-1 ring-indigo-200"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={open}
      className="group flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-600"
      title="คลิกเพื่อแก้ไขสต็อกขั้นต่ำ"
    >
      <span>ขั้นต่ำ: <span className="font-bold text-slate-600">{minStock}</span></span>
      <Pencil className="size-2.5 opacity-0 transition group-hover:opacity-100" />
    </button>
  )
}

// ── Inline order-qty editor ───────────────────────────────────────────────────

function OrderQtyEditor({ productId, minStock, orderQty, onSaved }: { productId: string; minStock: number; orderQty: number; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(orderQty || ''))
  const inputRef = useRef<HTMLInputElement>(null)

  const open = () => { setValue(String(orderQty || '')); setEditing(true); setTimeout(() => inputRef.current?.select(), 0) }

  const commit = () => {
    const n = Math.max(0, Math.floor(Number(value) || 0))
    setWarehouseMinMax(productId, minStock, n > 0 ? n : null)
    onSaved()
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-slate-400">สั่งครั้งละ:</span>
        <input
          ref={inputRef}
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          className="w-12 rounded border border-emerald-300 bg-white px-1 py-0.5 text-center text-[10px] font-bold outline-none ring-1 ring-emerald-200"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={open}
      className="group flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-600"
      title="คลิกเพื่อตั้งจำนวนสั่งซื้อต่อครั้ง"
    >
      <span>สั่งครั้งละ: <span className={orderQty > 0 ? 'font-bold text-emerald-700' : 'text-slate-400'}>{orderQty > 0 ? orderQty : '—'}</span></span>
      <Pencil className="size-2.5 opacity-0 transition group-hover:opacity-100" />
    </button>
  )
}

// ── Inline cost editor ───────────────────────────────────────────────────────

export const PRODUCT_COST_CHANGED_EVENT = 'bento-product-cost-changed'

function CostEditor({ productId, cost, onSaved }: { productId: string; cost: number; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const open = () => {
    setValue(cost > 0 ? String(cost) : '')
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commit = () => {
    const n = Math.max(0, Math.round(Number(value) * 100) / 100)
    const list = getProductMasterList()
    const idx = list.findIndex((m) => m.id === productId)
    if (idx >= 0) {
      const updated = [...list]
      updated[idx] = { ...updated[idx]!, avgCost: n, costPrice: n }
      saveProductMasterList(updated)
      try { window.dispatchEvent(new CustomEvent(PRODUCT_COST_CHANGED_EVENT)) } catch { /* ignore */ }
    }
    onSaved()
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-slate-400">ต้นทุน ฿</span>
        <input
          ref={inputRef}
          type="number"
          min={0}
          step={0.01}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          className="w-16 rounded border border-orange-300 bg-white px-1 py-0.5 text-center text-[10px] font-bold outline-none ring-1 ring-orange-200"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={open}
      className="group flex items-center gap-1 text-[10px] text-slate-400 hover:text-orange-600"
      title="คลิกเพื่อแก้ไขต้นทุน"
    >
      <span>ต้นทุน: <span className={cost > 0 ? 'font-bold text-orange-700' : 'text-slate-400'}>{cost > 0 ? `฿${cost.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}</span></span>
      <Pencil className="size-2.5 opacity-0 transition group-hover:opacity-100" />
    </button>
  )
}

// ── Favorites ────────────────────────────────────────────────────────────────

const FAV_KEY = 'bento.purchase.favorites.v1'

function loadFavs(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]') as string[]) }
  catch { return new Set() }
}

function saveFavs(s: Set<string>) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify([...s])) } catch { /* ignore */ }
}

// ── Vehicle fitment inline panel ─────────────────────────────────────────────

function FitmentPanel({ product }: { product: Product }) {
  const fitments = product.vehicleFitments
  if (fitments?.length) {
    return (
      <div className="mt-2 space-y-1 rounded-lg border border-sky-100 bg-sky-50 p-2">
        {fitments.map((f, i) => (
          <div key={i} className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-[10px] leading-tight">
            <span className="font-bold text-sky-800">{f.brandName}</span>
            <span className="text-sky-700">{f.modelName}</span>
            {f.yearRangeText && <span className="text-sky-600">{f.yearRangeText}</span>}
            {f.driveType && <span className="rounded bg-sky-200 px-1 font-semibold text-sky-700">{f.driveType}</span>}
            {f.engineLabel && <span className="text-sky-500">{f.engineLabel}</span>}
          </div>
        ))}
      </div>
    )
  }
  // fall back to flat fields
  const parts = [product.carBrand, product.carModelLabel, product.yearLabel].filter(Boolean)
  if (!parts.length) return <p className="mt-2 text-[10px] text-slate-400">ไม่มีข้อมูลรุ่นรถ</p>
  return (
    <div className="mt-2 rounded-lg border border-sky-100 bg-sky-50 p-2">
      <p className="text-[10px] text-sky-800">{parts.join(' · ')}</p>
    </div>
  )
}

type ExtItem = { fitments?: VehicleFitmentRef[]; carBrand?: string; carModelLabel?: string; yearLabel?: string }

function ExtFitmentButton({ item }: { item: ExtItem }) {
  const [open, setOpen] = useState(false)
  const hasFitment = !!(item.fitments?.length || item.carBrand || item.carModelLabel)
  if (!hasFitment) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'mt-1 flex w-full items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition',
          open ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500 hover:bg-sky-50 hover:text-sky-600',
        )}
      >
        <Car className="size-3 shrink-0" />
        <span>รุ่นรถที่ใช้ได้</span>
        <ChevronDown className={clsx('ml-auto size-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        item.fitments?.length ? (
          <div className="mt-1 space-y-1 rounded-lg border border-sky-100 bg-sky-50 p-2">
            {item.fitments.map((f, i) => (
              <div key={i} className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-[10px] leading-tight">
                <span className="font-bold text-sky-800">{f.brandName}</span>
                <span className="text-sky-700">{f.modelName}</span>
                {f.yearRangeText && <span className="text-sky-600">{f.yearRangeText}</span>}
                {f.driveType && <span className="rounded bg-sky-200 px-1 font-semibold text-sky-700">{f.driveType}</span>}
                {f.engineLabel && <span className="text-sky-500">{f.engineLabel}</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-1 rounded-lg border border-sky-100 bg-sky-50 p-2">
            <p className="text-[10px] text-sky-800">{[item.carBrand, item.carModelLabel, item.yearLabel].filter(Boolean).join(' · ')}</p>
          </div>
        )
      )}
    </>
  )
}

// ── Catalog product image (fill container) ───────────────────────────────────

function CatalogImage({ sku }: { sku: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getProductImageUrl(sku).then((u) => { if (!cancelled) setUrl(u) })
    return () => { cancelled = true }
  }, [sku])

  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 text-slate-300">
        <ImageIcon className="size-8" strokeWidth={1} />
      </div>
    )
  }
  return <img src={url} alt={sku} className="h-full w-full object-cover" />
}

// ── Product card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  isFav,
  inCart,
  cartQty,
  price,
  buyScheme,
  discountChain,
  suppliers,
  supplierMap,
  activeSupplierId,
  lastOrderedAt,
  vendorPromos,
  onToggleFav,
  onAdd,
  onSelectSupplier,
  onCompare,
  onEdit,
  onMinStockSaved,
  onOrderQtySaved,
}: {
  product: Product
  isFav: boolean
  inCart: boolean
  cartQty: number
  price: number
  buyScheme: { buyQty: number; freeQty: number } | null
  discountChain: string | undefined
  suppliers: ProductSupplierEntry[]
  supplierMap: Map<string, SupplierProfile>
  activeSupplierId: string
  onToggleFav: () => void
  onAdd: () => void
  onSelectSupplier: (id: string) => void
  onCompare: () => void
  onEdit: () => void
  lastOrderedAt: string | undefined
  vendorPromos: VendorPromotion[]
  onMinStockSaved: () => void
  onOrderQtySaved: () => void
}) {
  const stockOut = product.stock <= 0
  const stockLow = !stockOut && product.minStock > 0 && product.stock < product.minStock
  const showAll = !activeSupplierId
  const visibleSuppliers = showAll ? suppliers : suppliers.filter(s => s.supplierId === activeSupplierId)
  const daysAgo = lastOrderedAt ? Math.floor((Date.now() - new Date(lastOrderedAt).getTime()) / 86400000) : null
  const [showFitment, setShowFitment] = useState(false)
  const hasFitment = !!(product.vehicleFitments?.length || product.carBrand || product.carModelLabel)

  return (
    <div
      onContextMenu={(e) => { e.preventDefault(); onEdit() }}
      className={clsx(
        'relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-150',
        inCart
          ? 'border-emerald-400 shadow-emerald-100 ring-2 ring-emerald-100'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
      )}
    >
      {/* ── Favourite ── */}
      <button
        type="button"
        onClick={onToggleFav}
        className="absolute right-2 top-2 z-10 rounded-full bg-white/80 p-1 shadow-sm backdrop-blur-sm transition hover:scale-110"
      >
        <Star
          className={clsx(
            'size-3.5 transition',
            isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300',
          )}
        />
      </button>

      {/* ── Cart qty badge ── */}
      {inCart && (
        <div className="absolute left-2 top-2 z-10 flex size-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white shadow">
          {cartQty}
        </div>
      )}

      {/* ── Image ── */}
      <div className="relative aspect-square w-full overflow-hidden">
        <CatalogImage sku={product.sku} />
        {stockOut && (
          <div className="absolute inset-0 flex items-end bg-rose-500/10">
            <span className="w-full bg-rose-500 py-1 text-center text-[10px] font-black text-white">
              หมดสต็อก
            </span>
          </div>
        )}
        {stockLow && (
          <div className="absolute inset-0 flex items-end bg-amber-400/10">
            <span className="w-full bg-amber-400 py-1 text-center text-[10px] font-black text-amber-900">
              ต่ำกว่าขั้นต่ำ · เหลือ {product.stock}
            </span>
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div className="flex flex-1 flex-col p-2.5">
        <p className="line-clamp-2 text-xs font-semibold leading-tight text-slate-800">
          {product.name}
        </p>
        <p className="text-[10px] text-slate-400">{product.sku}</p>
        {hasFitment && (
          <button
            type="button"
            onClick={() => setShowFitment((v) => !v)}
            title="รุ่นรถที่ใช้ได้"
            className={clsx(
              'mt-1 flex w-full items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition',
              showFitment
                ? 'bg-sky-100 text-sky-700'
                : 'bg-slate-100 text-slate-500 hover:bg-sky-50 hover:text-sky-600',
            )}
          >
            <Car className="size-3 shrink-0" />
            <span>รุ่นรถที่ใช้ได้</span>
            <ChevronDown className={clsx('ml-auto size-3 transition-transform', showFitment && 'rotate-180')} />
          </button>
        )}
        {showFitment && <FitmentPanel product={product} />}

        <p className="mt-1.5 text-[10px] text-slate-400">
          สต็อก <span className={clsx('font-bold', stockOut ? 'text-rose-500' : stockLow ? 'text-amber-500' : 'text-slate-600')}>{product.stock}</span>
          {daysAgo !== null && (
            <span className={clsx(
              'ml-1.5 rounded-full px-1 py-0.5 text-[9px] font-semibold',
              daysAgo <= 7 ? 'bg-emerald-50 text-emerald-600' : daysAgo <= 30 ? 'bg-sky-50 text-sky-600' : 'bg-slate-100 text-slate-400',
            )}>
              สั่ง {daysAgo === 0 ? 'วันนี้' : `${daysAgo}วัน`}
            </span>
          )}
        </p>
        <MinStockEditor productId={product.id} minStock={product.minStock} orderQty={product.maxStock ?? 0} onSaved={onMinStockSaved} />
        <OrderQtyEditor productId={product.id} minStock={product.minStock} orderQty={product.maxStock ?? 0} onSaved={onOrderQtySaved} />

        {/* ── Supplier tags ── */}
        {visibleSuppliers.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {visibleSuppliers.map((s) => {
              const profile = supplierMap.get(s.supplierId)
              if (!profile) return null
              const isActive = activeSupplierId === s.supplierId
              return (
                <button
                  key={s.supplierId}
                  type="button"
                  onClick={() => onSelectSupplier(isActive ? '' : s.supplierId)}
                  title={`${profile.name} — ราคาล่าสุด ฿${s.lastPrice.toLocaleString('th-TH')}`}
                  className={clsx(
                    'flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold transition',
                    isActive
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600',
                  )}
                >
                  <span className="max-w-[60px] truncate">{profile.name}</span>
                  {s.lastPrice > 0 && (
                    <span className="opacity-70">฿{s.lastPrice.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {suppliers.length === 0 && (
          <p className="mt-1.5 text-[9px] text-slate-300">ยังไม่มีข้อมูลผู้ขาย</p>
        )}

        <p className="mt-1.5 text-sm font-black text-slate-900">
          {price > 0 ? (
            `฿${price.toLocaleString('th-TH')}`
          ) : (
            <span className="text-xs font-normal text-slate-300">ยังไม่มีราคา</span>
          )}
        </p>
        <div className="mt-0.5 flex flex-wrap gap-1">
          {buyScheme && buyScheme.freeQty > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
              ซื้อ {buyScheme.buyQty} แถม {buyScheme.freeQty}
            </span>
          )}
          {discountChain && (
            <span className="inline-flex items-center rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-700">
              ลด {discountChain}%
            </span>
          )}
          {vendorPromos.map((vp) => {
            const bestTier = findBestVendorPromoTier(vp, cartQty)
            const nextTier = findNextVendorPromoTier(vp, cartQty)
            const lowestTier = [...vp.tiers].sort((a, b) => a.minQty - b.minQty)[0]
            if (!lowestTier) return null
            return (
              <span key={vp.id} className={clsx(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                bestTier ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700',
              )}>
                {bestTier ? (
                  <>
                    ✓ {tierLabel(bestTier)}
                    {nextTier && (
                      <span className="ml-0.5 opacity-70">· +{nextTier.minQty - cartQty}→{tierLabel(nextTier)}</span>
                    )}
                  </>
                ) : (
                  <>
                    <Percent className="size-2.5" />
                    ซื้อ {lowestTier.minQty}+ → {tierLabel(lowestTier)}
                    {vp.tiers.length > 1 && <span className="opacity-60">+{vp.tiers.length - 1}</span>}
                  </>
                )}
              </span>
            )
          })}
        </div>

        <div className="mt-2 flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            title="แก้ไขสินค้า"
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100"
          >
            <Pencil className="size-3" />
          </button>
          {suppliers.length > 0 && (
            <button
              type="button"
              onClick={onCompare}
              title="เปรียบราคาซัพพลายเออร์"
              className="flex items-center justify-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-[10px] font-bold text-indigo-700 transition hover:bg-indigo-100"
            >
              <ArrowLeftRight className="size-3" />
              {suppliers.length}
            </button>
          )}
          <button
            type="button"
            onClick={onAdd}
            className={clsx(
              'flex flex-1 items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-bold transition',
              inCart
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-700',
            )}
          >
            <Plus className="size-3.5" />
            {inCart ? 'เพิ่มอีก' : 'ใส่ตะกร้า'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Product list row ─────────────────────────────────────────────────────────

function ProductListRow({
  product,
  isFav,
  inCart,
  cartQty,
  price,
  suppliers,
  supplierMap,
  activeSupplierId,
  lastOrderedAt,
  vendorPromos,
  onToggleFav,
  onAdd,
  onSelectSupplier,
  onCompare,
  onEdit,
  onMinStockSaved,
  onOrderQtySaved,
}: {
  product: Product
  isFav: boolean
  inCart: boolean
  cartQty: number
  price: number
  suppliers: ProductSupplierEntry[]
  supplierMap: Map<string, SupplierProfile>
  activeSupplierId: string
  onToggleFav: () => void
  onAdd: () => void
  onSelectSupplier: (id: string) => void
  onCompare: () => void
  onEdit: () => void
  lastOrderedAt: string | undefined
  vendorPromos: VendorPromotion[]
  onMinStockSaved: () => void
  onOrderQtySaved: () => void
}) {
  const stockOut = product.stock <= 0
  const stockLow = !stockOut && product.minStock > 0 && product.stock < product.minStock
  const daysAgo = lastOrderedAt ? Math.floor((Date.now() - new Date(lastOrderedAt).getTime()) / 86400000) : null
  const [showFitment, setShowFitment] = useState(false)
  const hasFitment = !!(product.vehicleFitments?.length || product.carBrand || product.carModelLabel)
  const firstSupplierEntry = suppliers[0]
  const firstSupplier = firstSupplierEntry ? supplierMap.get(firstSupplierEntry.supplierId) : null
  const hasActivePromo = vendorPromos.length > 0
  const bestPromoTier = hasActivePromo ? findBestVendorPromoTier(vendorPromos[0]!, cartQty) : null

  return (
    <div>
      <div
        onContextMenu={(e) => { e.preventDefault(); onEdit() }}
        className={clsx(
          'flex items-center gap-3 rounded-xl border bg-white px-3 py-2 transition-all',
          inCart
            ? 'border-emerald-400 ring-2 ring-emerald-100'
            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
        )}
      >
        {/* Image */}
        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-slate-50">
          <CatalogImage sku={product.sku} />
          {inCart && (
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/80">
              <span className="text-xs font-black text-white">{cartQty}</span>
            </div>
          )}
        </div>

        {/* Name + SKU */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xs font-semibold text-slate-800">{product.name}</p>
            {hasFitment && (
              <button
                type="button"
                onClick={() => setShowFitment((v) => !v)}
                className={clsx(
                  'shrink-0 rounded px-1 py-0.5 text-[9px] font-bold transition',
                  showFitment ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400 hover:text-sky-600',
                )}
              >
                <Car className="mr-0.5 inline size-2.5" />
                รุ่นรถ
              </button>
            )}
          </div>
          <p className="font-mono text-[10px] text-slate-400">{product.sku}</p>
        </div>

        {/* Stock */}
        <div className="w-32 shrink-0 text-center">
          {stockOut ? (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700">หมดสต็อก</span>
          ) : stockLow ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
              ต่ำกว่าขั้นต่ำ · {product.stock}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-slate-600">{product.stock} ชิ้น</span>
          )}
          {daysAgo !== null && (
            <span className={clsx(
              'ml-1 text-[9px]',
              daysAgo <= 7 ? 'text-emerald-500' : daysAgo <= 30 ? 'text-sky-400' : 'text-slate-300',
            )}>
              · {daysAgo === 0 ? 'วันนี้' : `${daysAgo}ว.`}
            </span>
          )}
        </div>

        {/* Supplier */}
        <div className="w-36 shrink-0">
          {firstSupplier ? (
            <button
              type="button"
              onClick={() => onSelectSupplier(activeSupplierId === firstSupplierEntry!.supplierId ? '' : firstSupplierEntry!.supplierId)}
              className={clsx(
                'w-full truncate rounded-full border px-2 py-0.5 text-left text-[9px] font-bold transition',
                activeSupplierId === firstSupplierEntry?.supplierId
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-indigo-200 hover:text-indigo-600',
              )}
            >
              {firstSupplier.name}
              {suppliers.length > 1 && (
                <span className="ml-1 text-slate-400">+{suppliers.length - 1}</span>
              )}
            </button>
          ) : (
            <span className="text-[9px] text-slate-300">—</span>
          )}
        </div>

        {/* Price */}
        <div className="w-24 shrink-0 text-right">
          {price > 0 ? (
            <span className="text-sm font-black text-slate-900">฿{price.toLocaleString('th-TH')}</span>
          ) : (
            <span className="text-xs text-slate-300">—</span>
          )}
          {hasActivePromo && (
            <span
              className={clsx('ml-1.5 inline-block size-2 rounded-full', bestPromoTier ? 'bg-emerald-400' : 'bg-blue-400')}
              title="มีโปรโมชั่นผู้ขาย"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleFav}
            className="rounded-full p-1 text-slate-300 transition hover:scale-110"
          >
            <Star className={clsx('size-3.5', isFav && 'fill-amber-400 text-amber-400')} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            title="แก้ไขสินค้า"
            className="rounded-lg border border-slate-200 bg-slate-50 p-1 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100"
          >
            <Pencil className="size-3.5" />
          </button>
          {suppliers.length > 0 && (
            <button
              type="button"
              onClick={onCompare}
              title="เปรียบราคา"
              className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 transition hover:bg-indigo-100"
            >
              <ArrowLeftRight className="size-3" />
              {suppliers.length}
            </button>
          )}
          <button
            type="button"
            onClick={onAdd}
            className={clsx(
              'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition',
              inCart
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-700',
            )}
          >
            <Plus className="size-3.5" />
            {inCart ? 'เพิ่ม' : 'ใส่ตะกร้า'}
          </button>
        </div>
      </div>
      {showFitment && (
        <div className="px-3 pb-2">
          <FitmentPanel product={product} />
        </div>
      )}
    </div>
  )
}

// ── Price compare modal ───────────────────────────────────────────────────────

function PriceCompareModal({
  product,
  suppliers,
  supplierMap,
  currentCost,
  onBuyFrom,
  onClose,
}: {
  product: Product
  suppliers: ProductSupplierEntry[]
  supplierMap: Map<string, SupplierProfile>
  currentCost: number
  onBuyFrom: (supplierId: string, price: number) => void
  onClose: () => void
}) {
  const sorted = useMemo(
    () => [...suppliers].sort((a, b) => (a.lastPrice || Infinity) - (b.lastPrice || Infinity)),
    [suppliers],
  )
  const cheapest = sorted[0]?.lastPrice ?? 0
  const [qty, setQty] = useState(1)

  const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) }
    catch { return iso }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <ArrowLeftRight className="size-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">เปรียบราคาซัพพลายเออร์</p>
              <p className="line-clamp-1 text-sm font-bold text-slate-900">{product.name}</p>
              <p className="text-[10px] text-slate-400">{product.sku}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>

        {/* cost baseline */}
        {currentCost > 0 && (
          <div className="flex items-center gap-2 border-b border-slate-100 bg-sky-50/60 px-5 py-2">
            <span className="text-[10px] font-medium text-sky-700">ต้นทุนปัจจุบัน (เฉลี่ยเคลื่อนที่)</span>
            <span className="ml-auto text-sm font-bold text-sky-900">฿{fmt(currentCost)}</span>
          </div>
        )}

        {/* qty selector */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-2.5">
          <span className="text-xs font-medium text-slate-600">จำนวนที่ต้องการซื้อ</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Minus className="size-3.5" />
            </button>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              className="w-14 rounded-lg border border-slate-200 py-1 text-center text-sm font-bold outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>

        {/* supplier list */}
        <div className="max-h-72 overflow-y-auto">
          {sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">ยังไม่มีข้อมูลราคาจากซัพพลายเออร์</p>
          ) : (
            sorted.map((s, idx) => {
              const profile = supplierMap.get(s.supplierId)
              if (!profile) return null
              const isCheapest = idx === 0 && sorted.length > 1
              const savings = currentCost > 0 && s.lastPrice > 0
                ? ((currentCost - s.lastPrice) / currentCost) * 100
                : null
              const total = qty * s.lastPrice

              return (
                <div
                  key={s.supplierId}
                  className={clsx(
                    'flex items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-0',
                    isCheapest ? 'bg-emerald-50/60' : 'hover:bg-slate-50/60',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {isCheapest && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">
                          <Trophy className="size-2.5" />
                          ถูกสุด
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-800 truncate">{profile.name}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                      <span>ซื้อล่าสุด {fmtDate(s.lastBoughtAt)}</span>
                      {savings !== null && Math.abs(savings) > 0.5 && (
                        <span className={savings > 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-500'}>
                          {savings > 0 ? `ประหยัด ${savings.toFixed(1)}%` : `แพงกว่า ${Math.abs(savings).toFixed(1)}%`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className={clsx('text-sm font-black', isCheapest ? 'text-emerald-700' : 'text-slate-800')}>
                      ฿{s.lastPrice > 0 ? fmt(s.lastPrice) : '—'}
                    </p>
                    {qty > 1 && s.lastPrice > 0 && (
                      <p className="text-[10px] text-slate-400">รวม ฿{fmt(total)}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => { onBuyFrom(s.supplierId, s.lastPrice); onClose() }}
                    className="shrink-0 rounded-xl bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    ซื้อจากร้านนี้
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* cheapest summary */}
        {sorted.length > 1 && cheapest > 0 && (
          <div className="border-t border-slate-100 bg-emerald-50/70 px-5 py-2.5 text-center text-[11px] text-emerald-700">
            ราคาถูกสุด <span className="font-black">฿{fmt(cheapest)}</span>
            {qty > 1 && <span className="ml-1 opacity-70">× {qty} = ฿{fmt(cheapest * qty)}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Cart sidebar ─────────────────────────────────────────────────────────────

type VendorOption = { id: string; name: string; lastPrice?: number; isKnown: boolean }

function VendorCombobox({
  productId, supplierId, supplierName, options, noHistory, noPrice, className,
  onChange,
}: {
  productId: string
  supplierId?: string
  supplierName?: string
  options: VendorOption[]
  noHistory: boolean
  noPrice: boolean
  className?: string
  onChange: (patch: { supplierId?: string; supplierName?: string; unitCost?: number }) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const openDropdown = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 2, left: r.left, width: Math.max(r.width, 200) })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    setTimeout(() => searchRef.current?.focus(), 10)
    const onMouse = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node) && !dropRef.current?.contains(e.target as Node)) {
        setOpen(false); setQuery('')
      }
    }
    const onScroll = () => { setOpen(false); setQuery('') }
    document.addEventListener('mousedown', onMouse)
    window.addEventListener('scroll', onScroll, true)
    return () => { document.removeEventListener('mousedown', onMouse); window.removeEventListener('scroll', onScroll, true) }
  }, [open])

  const q = query.toLowerCase()
  const filtered = q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options
  const known = filtered.filter((o) => o.isKnown)
  const others = filtered.filter((o) => !o.isKnown)

  const select = (opt: VendorOption) => {
    onChange({ supplierId: opt.id, supplierName: opt.name, ...(opt.lastPrice && opt.lastPrice > 0 ? { unitCost: opt.lastPrice } : {}) })
    setOpen(false); setQuery('')
  }

  const dropdown = open ? createPortal(
    <div ref={dropRef} style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-100 p-1.5">
        <input ref={searchRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหา…"
          className="w-full rounded-lg bg-slate-50 px-2 py-1 text-[10px] text-slate-700 outline-none placeholder:text-slate-400" />
      </div>
      <div className="max-h-52 overflow-y-auto py-1">
        {supplierId && !query && (
          <button type="button" onClick={() => { onChange({ supplierId: undefined, supplierName: undefined }); setOpen(false); setQuery('') }}
            className="w-full px-3 py-1.5 text-left text-[10px] text-slate-400 hover:bg-slate-50">
            — ไม่ระบุร้านค้า —
          </button>
        )}
        {known.length > 0 && (
          <>
            <p className="px-3 pt-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">เคยซื้อจาก</p>
            {known.map((opt) => (
              <div key={opt.id} className="group flex items-center">
                <button type="button" onClick={() => select(opt)}
                  className={clsx('flex flex-1 items-center justify-between px-3 py-1.5 text-[10px] hover:bg-emerald-50',
                    supplierId === opt.id ? 'bg-emerald-50 font-semibold text-emerald-700' : 'text-slate-700')}>
                  <span>{opt.name}</span>
                  {opt.lastPrice != null && opt.lastPrice > 0 && (
                    <span className="ml-2 shrink-0 text-slate-400">฿{opt.lastPrice.toLocaleString('th-TH')}</span>
                  )}
                </button>
                <button type="button" title="ลบออกจากประวัติ"
                  onClick={(e) => {
                    e.stopPropagation()
                    unlinkProductFromSupplier(opt.id, productId)
                    if (supplierId === opt.id) onChange({ supplierId: undefined, supplierName: undefined })
                  }}
                  className="mr-1.5 rounded p-0.5 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100">
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </>
        )}
        {others.length > 0 && (
          <>
            {known.length > 0 && <div className="mx-3 my-1 border-t border-slate-100" />}
            <p className="px-3 pt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
              {known.length > 0 ? 'ร้านค้าอื่นๆ' : 'ร้านค้าทั้งหมด'}
            </p>
            {others.map((opt) => (
              <button key={opt.id} type="button" onClick={() => select(opt)}
                className={clsx('w-full px-3 py-1.5 text-left text-[10px] hover:bg-slate-50',
                  supplierId === opt.id ? 'font-semibold text-slate-800' : 'text-slate-600')}>
                {opt.name}
              </button>
            ))}
          </>
        )}
        {filtered.length === 0 && <p className="py-4 text-center text-[10px] text-slate-400">ไม่พบร้านค้า</p>}
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <div className={clsx('relative', className)}>
      <button ref={triggerRef} type="button" onClick={openDropdown}
        className={clsx(
          'flex w-full items-center justify-between rounded border px-2 py-1 text-left text-[10px] outline-none transition',
          !supplierId ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300',
        )}>
        <span className={clsx('truncate', supplierId ? 'text-slate-700' : 'text-slate-400')}>
          {supplierName || '— ไม่ระบุร้านค้า —'}
        </span>
        <ChevronDown className={clsx('ml-1 size-3 shrink-0 text-slate-400 transition', open && 'rotate-180')} />
      </button>
      {dropdown}

      {noHistory && supplierId && (
        <p className="mt-0.5 text-[9px] text-amber-700">⚠ ไม่มีประวัติขายสินค้านี้ — ตรวจสอบก่อนสร้าง PO</p>
      )}
      {noPrice && (
        <p className="mt-0.5 text-[9px] text-amber-600">⚠ ไม่มีประวัติราคาจากร้านค้านี้</p>
      )}
    </div>
  )
}

function CostHistoryPopup({ productId, onClose }: { productId: string; onClose: () => void }) {
  const history = useMemo(() => {
    const rows: { at: string; qty: number; unitCost: number; supplierName: string }[] = []
    for (const po of loadPurchaseOrders()) {
      for (const batch of po.receiveBatches) {
        for (const ln of batch.lines) {
          const poLine = po.lines.find((l) => l.lineId === ln.lineId)
          if (!poLine || poLine.productId !== productId || ln.qty <= 0) continue
          rows.push({ at: batch.at, qty: ln.qty, unitCost: ln.unitCost, supplierName: po.supplierName })
        }
      }
    }
    return rows.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 15)
  }, [productId])

  return (
    <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <span className="text-[11px] font-bold text-slate-700">ประวัติราคาซื้อ</span>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="size-3.5" /></button>
      </div>
      {history.length === 0 ? (
        <p className="px-3 py-4 text-center text-[11px] text-slate-400">ยังไม่มีประวัติการรับสินค้า</p>
      ) : (
        <div className="max-h-56 overflow-y-auto">
          {history.map((r, i) => {
            const prev = history[i + 1]
            const pct = prev && prev.unitCost > 0 ? ((r.unitCost - prev.unitCost) / prev.unitCost) * 100 : null
            return (
              <div key={i} className="flex items-center gap-2 border-b border-slate-50 px-3 py-1.5 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400">
                    {new Date(r.at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                    <span className="ml-1.5 truncate text-slate-300">{r.supplierName}</span>
                  </p>
                  <p className="text-xs font-mono font-semibold text-slate-800">
                    ฿{r.unitCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    <span className="ml-1.5 font-normal text-slate-400">× {r.qty}</span>
                  </p>
                </div>
                {pct !== null && Math.abs(pct) >= 0.01 && (
                  <span className={clsx('text-[10px] font-bold', pct > 0 ? 'text-rose-500' : 'text-emerald-600')}>
                    {pct > 0 ? '▲' : '▼'}{Math.abs(pct).toFixed(1)}%
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CartItemRow({
  item,
  vendors,
  supplierProfileMap,
  onUpdate,
  onRemove,
}: {
  item: CartItem
  vendors: ProductSupplierEntry[]
  supplierProfileMap: Map<string, SupplierProfile>
  onUpdate: (productId: string, patch: Partial<CartItem>) => void
  onRemove: (productId: string) => void
}) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const allSuppliers = useMemo(
    () => Array.from(supplierProfileMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'th')),
    [supplierProfileMap],
  )
  const selectedVendorEntry = vendors.find((v) => v.supplierId === item.supplierId)
  const noHistory = vendors.length === 0
  const noPrice = !noHistory && !!item.supplierId && selectedVendorEntry && selectedVendorEntry.lastPrice === 0

  const vendorOptions: VendorOption[] = [
    ...vendors.map((v) => ({ id: v.supplierId, name: supplierProfileMap.get(v.supplierId)?.name ?? v.supplierId, lastPrice: v.lastPrice, isKnown: true })).filter((v) => v.name !== v.id),
    ...allSuppliers.filter((s) => !vendors.find((v) => v.supplierId === s.id)).map((s) => ({ id: s.id, name: s.name, isKnown: false })),
  ]

  return (
    <div className="px-3 py-2.5">
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-semibold leading-tight text-slate-800">{item.name}</p>
        <button
          type="button"
          onClick={() => onRemove(item.productId)}
          className="mt-0.5 shrink-0 text-slate-300 transition hover:text-rose-500"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <VendorCombobox
        productId={item.productId}
        supplierId={item.supplierId}
        supplierName={item.supplierName}
        options={vendorOptions}
        noHistory={noHistory}
        noPrice={!!noPrice}
        className="mt-1.5"
        onChange={(patch) => onUpdate(item.productId, patch)}
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">จำนวน</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => item.qty > 1 ? onUpdate(item.productId, { qty: item.qty - 1 }) : onRemove(item.productId)}
              className="flex size-6 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              <Minus className="size-3" />
            </button>
            <input
              type="number"
              min={1}
              value={item.qty}
              onChange={(e) => onUpdate(item.productId, { qty: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
              className="w-10 rounded-lg border border-slate-200 py-1 text-center text-xs font-mono outline-none focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={() => onUpdate(item.productId, { qty: item.qty + 1 })}
              className="flex size-6 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              <Plus className="size-3" />
            </button>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">ราคา/หน่วย</p>
          <input
            type="number"
            min={0}
            step={0.01}
            value={item.unitCost || ''}
            placeholder="0"
            onChange={(e) => onUpdate(item.productId, { unitCost: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-right text-xs font-mono outline-none focus:border-emerald-400"
          />
          <div className="relative">
            {(() => {
              const base = getActiveCost(item.productId)
              if (!base || !item.unitCost) return (
                <button type="button" onClick={() => setHistoryOpen((v) => !v)}
                  className="mt-0.5 w-full text-right text-[10px] text-slate-300 hover:text-slate-500">
                  ประวัติราคา ▾
                </button>
              )
              const pct = ((item.unitCost - base) / base) * 100
              const up = pct > 0
              return (
                <button type="button" onClick={() => setHistoryOpen((v) => !v)}
                  className={clsx('mt-0.5 w-full text-right text-[10px] font-bold hover:opacity-70', up ? 'text-rose-500' : Math.abs(pct) < 0.01 ? 'text-slate-400' : 'text-emerald-600')}>
                  {Math.abs(pct) < 0.01 ? '— ราคาเดิม ▾' : `${up ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}% vs ต้นทุนปัจจุบัน ▾`}
                </button>
              )
            })()}
            {historyOpen && (
              <CostHistoryPopup productId={item.productId} onClose={() => setHistoryOpen(false)} />
            )}
          </div>
        </div>
      </div>
      {item.qty > 0 && item.unitCost > 0 && (
        <p className="mt-1.5 text-right text-xs font-bold text-emerald-700">
          ฿{(item.qty * item.unitCost).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </p>
      )}
    </div>
  )
}

function CartSidebar({
  items,
  productSupplierMap,
  supplierProfileMap,
  onUpdate,
  onRemove,
  onGoToCart,
  onClose,
}: {
  items: CartItem[]
  productSupplierMap: Map<string, ProductSupplierEntry[]>
  supplierProfileMap: Map<string, SupplierProfile>
  onUpdate: (productId: string, patch: Partial<CartItem>) => void
  onRemove: (productId: string) => void
  onGoToCart: () => void
  onClose: () => void
}) {
  const total = items.reduce((s, i) => s + i.qty * i.unitCost, 0)

  // Group items by supplier
  const groups: { key: string; label: string; items: CartItem[] }[] = []
  for (const item of items) {
    const key = item.supplierId ?? ''
    const label = item.supplierName ?? 'ไม่ระบุร้านค้า'
    const existing = groups.find((g) => g.key === key)
    if (existing) existing.items.push(item)
    else groups.push({ key, label, items: [item] })
  }
  const assignedGroupCount = groups.filter((g) => g.key !== '').length

  const groupColors = ['bg-indigo-50 border-indigo-200 text-indigo-800', 'bg-amber-50 border-amber-200 text-amber-800', 'bg-emerald-50 border-emerald-200 text-emerald-800', 'bg-rose-50 border-rose-200 text-rose-800']

  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-slate-200 bg-white">
      {/* header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-bold text-slate-800">
          ตะกร้าซื้อ
          {items.length > 0 && (
            <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-700">
              {items.length}
            </span>
          )}
        </p>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="size-4" />
        </button>
      </div>

      {/* items grouped by vendor */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300">
            <ShoppingCart className="size-10 stroke-[1]" />
            <p className="text-xs">ตะกร้าว่าง</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {groups.map((group, gi) => {
              const color = group.key ? groupColors[gi % groupColors.length] : 'bg-slate-50 border-slate-200 text-slate-500'
              const groupTotal = group.items.reduce((s, i) => s + i.qty * i.unitCost, 0)
              return (
                <div key={group.key || '__none__'} className={`rounded-xl border ${color.split(' ')[1]} overflow-hidden`}>
                  {/* vendor header */}
                  <div className={`flex items-center justify-between px-3 py-1.5 ${color.split(' ')[0]}`}>
                    <span className={`text-[10px] font-bold ${color.split(' ')[2]}`}>
                      {group.label}
                    </span>
                    <span className={`text-[10px] font-semibold tabular-nums ${color.split(' ')[2]}`}>
                      {groupTotal > 0 ? `฿${groupTotal.toLocaleString('th-TH', { minimumFractionDigits: 0 })}` : '—'}
                    </span>
                  </div>
                  {/* items */}
                  <div className="divide-y divide-slate-100 bg-white">
                    {group.items.map((item) => (
                      <CartItemRow key={item.productId} item={item} vendors={productSupplierMap.get(item.productId) ?? []} supplierProfileMap={supplierProfileMap} onUpdate={onUpdate} onRemove={onRemove} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* footer */}
      {items.length > 0 && (
        <div className="shrink-0 border-t border-slate-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">รวมทั้งหมด</span>
            <span className="text-xl font-black text-slate-900">
              ฿{total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button
            type="button"
            onClick={onGoToCart}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-amber-600"
          >
            ไปยืนยันสั่งซื้อ →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Vendor promo management modal ────────────────────────────────────────────

function emptyVendorPromo(): Omit<VendorPromotion, 'id'> {
  const today = new Date().toISOString().slice(0, 10)
  return {
    name: '',
    enabled: true,
    startDate: today,
    endDate: today,
    productId: '',
    brand: '',
    category: '',
    supplierId: '',
    tiers: [{ minQty: 1, extraDiscountPct: 0, freeQty: 0 }],
  }
}

function tierLabel(t: VendorPromoTier): string {
  const parts: string[] = []
  if (t.extraDiscountPct > 0) parts.push(`-${t.extraDiscountPct}%`)
  if (t.freeQty > 0) parts.push(`แถม ${t.freeQty}`)
  return parts.join(' ')
}

function tiersSummary(tiers: VendorPromoTier[]): string {
  return [...tiers]
    .sort((a, b) => a.minQty - b.minQty)
    .map((t) => `${t.minQty}+: ${tierLabel(t) || '—'}`)
    .join(' | ')
}

function VendorPromoModal({
  promos,
  products,
  brands,
  categories,
  suppliers,
  onSave,
  onClose,
}: {
  promos: VendorPromotion[]
  products: { id: string; name: string; sku: string }[]
  brands: string[]
  categories: string[]
  suppliers: SupplierProfile[]
  onSave: (updated: VendorPromotion[]) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<(Omit<VendorPromotion, 'id'> & { id?: string }) | null>(null)
  const [search, setSearch] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (draft) setDraft(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [draft, onClose])

  const getStatus = (p: VendorPromotion): 'active' | 'upcoming' | 'expired' | 'disabled' => {
    if (!p.enabled) return 'disabled'
    if (p.endDate < today) return 'expired'
    if (p.startDate > today) return 'upcoming'
    return 'active'
  }

  const daysLeft = (endDate: string): number =>
    Math.ceil((new Date(endDate).getTime() - new Date(today).getTime()) / 86400000)

  const stats = promos.reduce(
    (acc, p) => { acc[getStatus(p)]++; return acc },
    { active: 0, upcoming: 0, expired: 0, disabled: 0 },
  )

  const filtered = promos.filter((p) => {
    if (supplierFilter && p.supplierId !== supplierFilter) return false
    if (!search) return true
    const sup = suppliers.find((s) => s.id === p.supplierId)
    const q = search.toLowerCase()
    return p.name.toLowerCase().includes(q) || (sup?.name.toLowerCase().includes(q) ?? false)
  })

  const startEdit = (p: VendorPromotion) => setDraft({ ...p })
  const startAdd = () => setDraft({ ...emptyVendorPromo() })

  const saveDraft = () => {
    if (!draft || !draft.name) return
    const id = draft.id ?? crypto.randomUUID()
    const sorted = { ...draft, tiers: [...draft.tiers].sort((a, b) => a.minQty - b.minQty) }
    const updated = draft.id
      ? promos.map((p) => (p.id === draft.id ? { ...sorted, id } : p))
      : [...promos, { ...sorted, id }]
    onSave(updated as VendorPromotion[])
    setDraft(null)
  }

  const addTier = () =>
    setDraft((d) => {
      if (!d) return d
      const last = d.tiers[d.tiers.length - 1]
      return { ...d, tiers: [...d.tiers, { minQty: (last?.minQty ?? 0) + 50, extraDiscountPct: 0, freeQty: 0 }] }
    })
  const removeTier = (idx: number) =>
    setDraft((d) => d && { ...d, tiers: d.tiers.filter((_, i) => i !== idx) })
  const patchTier = (idx: number, patch: Partial<VendorPromoTier>) =>
    setDraft((d) => d && { ...d, tiers: d.tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)) })

  const deletePromo = (id: string) => {
    if (draft?.id === id) setDraft(null)
    onSave(promos.filter((p) => p.id !== id))
  }
  const toggleEnabled = (id: string) =>
    onSave(promos.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)))
  const duplicatePromo = (p: VendorPromotion) =>
    onSave([...promos, { ...p, id: crypto.randomUUID(), name: `${p.name} (สำเนา)` }])

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) } catch { return d }
  }

  const StatusBadge = ({ p }: { p: VendorPromotion }) => {
    const s = getStatus(p)
    if (s === 'active') {
      const d = daysLeft(p.endDate)
      return <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">ใช้งาน{d > 0 ? ` ${d}ว.` : ''}</span>
    }
    if (s === 'upcoming') return <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">เร็วๆ นี้</span>
    if (s === 'expired') return <span className="shrink-0 rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-600">หมดอายุ {fmtDate(p.endDate)}</span>
    return <span className="shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">ปิด</span>
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
          <Percent className="size-4 text-blue-600" />
          <h2 className="flex-1 text-sm font-black text-slate-800">โปรโมชั่นผู้จัดจำหน่าย</h2>
          <div className="flex items-center gap-1.5">
            {stats.active > 0 && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{stats.active} ใช้งาน</span>}
            {stats.upcoming > 0 && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">{stats.upcoming} เร็วๆ นี้</span>}
            {stats.expired > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">{stats.expired} หมดอายุ</span>}
            {stats.disabled > 0 && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">{stats.disabled} ปิด</span>}
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
            <X className="size-4" />
          </button>
        </div>

        {/* ── Body: 2-panel ── */}
        <div className="flex min-h-0 flex-1">

          {/* Left panel: list */}
          <div className="flex w-80 shrink-0 flex-col border-r border-slate-100">
            {/* Search + add */}
            <div className="flex flex-col gap-2 border-b border-slate-100 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                  <Search className="size-3 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาชื่อโปร"
                    className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                      <X className="size-3" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={startAdd}
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-blue-700"
                >
                  <Plus className="size-3" />
                  ใหม่
                </button>
              </div>
              {suppliers.length > 0 && (
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] text-slate-700 outline-none focus:border-blue-400"
                >
                  <option value="">ทุก supplier</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>

            {/* Promo list */}
            <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Percent className="size-8 text-slate-200" />
                  <p className="text-xs text-slate-400">{search ? 'ไม่พบโปรโมชั่นที่ค้นหา' : 'ยังไม่มีโปรโมชั่น'}</p>
                  {!search && (
                    <button type="button" onClick={startAdd} className="mt-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700">
                      + เพิ่มโปรโมชั่นแรก
                    </button>
                  )}
                </div>
              )}
              {filtered.map((p) => {
                const prod = products.find((x) => x.id === p.productId)
                const sup = suppliers.find((s) => s.id === p.supplierId)
                const scope = prod ? prod.name : p.brand ? `แบรนด์ ${p.brand}` : p.category ? `หมวด ${p.category}` : 'ทุกสินค้า'
                const isEditing = draft?.id === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => { if (!isEditing) startEdit(p) }}
                    className={clsx(
                      'cursor-pointer rounded-xl border p-2.5 transition',
                      isEditing ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm',
                      !p.enabled && 'opacity-60',
                    )}
                  >
                    <div className="mb-1 flex items-start gap-1.5">
                      <p className="min-w-0 flex-1 text-xs font-bold leading-tight text-slate-800">{p.name || '(ไม่มีชื่อ)'}</p>
                      <StatusBadge p={p} />
                    </div>

                    <p className="mb-0.5 text-[10px] text-slate-500">{scope}{sup ? ` · ${sup.name}` : ''}</p>

                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {[...p.tiers].sort((a, b) => a.minQty - b.minQty).map((t, i) => (
                        <span key={i} className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
                          ≥{t.minQty}{t.extraDiscountPct > 0 ? ` -${t.extraDiscountPct}%` : ''}{t.freeQty > 0 ? ` +แถม${t.freeQty}` : ''}
                        </span>
                      ))}
                    </div>

                    <p className="mb-2 text-[9px] text-slate-400">{fmtDate(p.startDate)} – {fmtDate(p.endDate)}</p>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleEnabled(p.id) }}
                        className={clsx(
                          'rounded-lg px-2 py-0.5 text-[9px] font-bold transition',
                          p.enabled ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-500 hover:bg-slate-300',
                        )}
                      >
                        {p.enabled ? 'เปิด' : 'ปิด'}
                      </button>
                      <div className="flex-1" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); duplicatePromo(p) }}
                        title="ทำสำเนา"
                        className="rounded-lg border border-slate-200 bg-white p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <Copy className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deletePromo(p.id) }}
                        title="ลบ"
                        className="rounded-lg border border-rose-200 bg-rose-50 p-1 text-rose-500 hover:bg-rose-100"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right panel: form or placeholder */}
          {draft ? (
            <div className="flex-1 overflow-y-auto p-5">
              <p className="mb-4 text-sm font-black text-blue-800">{draft.id ? 'แก้ไขโปรโมชั่น' : 'เพิ่มโปรโมชั่นใหม่'}</p>
              <div className="space-y-3">
                <div>
                  <label className="mb-0.5 block text-xs font-semibold text-slate-600">ชื่อโปรโมชั่น</label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => d && { ...d, name: e.target.value })}
                    placeholder="เช่น SAKURA ซื้อ 50 ลด 3%"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-0.5 block text-xs font-semibold text-slate-600">แบรนด์</label>
                    <select
                      value={draft.brand}
                      onChange={(e) => setDraft((d) => d && { ...d, brand: e.target.value, productId: '', category: '' })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs outline-none focus:border-blue-400"
                    >
                      <option value="">ทุกแบรนด์</option>
                      {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs font-semibold text-slate-600">หมวด</label>
                    <select
                      value={draft.category}
                      onChange={(e) => setDraft((d) => d && { ...d, category: e.target.value, productId: '', brand: '' })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs outline-none focus:border-blue-400"
                    >
                      <option value="">ทุกหมวด</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs font-semibold text-slate-600">สินค้าเฉพาะ</label>
                    <select
                      value={draft.productId}
                      onChange={(e) => setDraft((d) => d && { ...d, productId: e.target.value, brand: '', category: '' })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs outline-none focus:border-blue-400"
                    >
                      <option value="">—</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-0.5 block text-xs font-semibold text-slate-600">ผู้จัดจำหน่าย</label>
                  <select
                    value={draft.supplierId}
                    onChange={(e) => setDraft((d) => d && { ...d, supplierId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                  >
                    <option value="">ทุกผู้ขาย</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600">ขั้นส่วนลด / ของแถม</label>
                    <button type="button" onClick={addTier} className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100">
                      <Plus className="size-2.5" /> เพิ่มขั้น
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="grid grid-cols-[2rem_1fr_1fr_1fr_auto] border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-500">
                      <span />
                      <span>ซื้อขั้นต่ำ (ชิ้น)</span>
                      <span>ลด % (0=ไม่ลด)</span>
                      <span>แถมฟรี (ชิ้น)</span>
                      <span />
                    </div>
                    {draft.tiers.map((t, idx) => (
                      <div key={idx} className={clsx('grid grid-cols-[2rem_1fr_1fr_1fr_auto] items-center gap-2 px-2 py-2', idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60')}>
                        <span className="text-center text-[9px] font-bold text-slate-400">T{idx + 1}</span>
                        <input
                          type="number" min={1}
                          value={t.minQty}
                          onChange={(e) => patchTier(idx, { minQty: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                        />
                        <input
                          type="number" min={0} max={100} step={0.5}
                          value={t.extraDiscountPct}
                          onChange={(e) => patchTier(idx, { extraDiscountPct: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                        />
                        <input
                          type="number" min={0}
                          value={t.freeQty}
                          onChange={(e) => patchTier(idx, { freeQty: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                        />
                        <button
                          type="button"
                          onClick={() => removeTier(idx)}
                          disabled={draft.tiers.length <= 1}
                          className="flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-400 hover:bg-rose-100 disabled:opacity-30"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-0.5 block text-xs font-semibold text-slate-600">วันเริ่ม</label>
                    <input type="date" value={draft.startDate}
                      onChange={(e) => setDraft((d) => d && { ...d, startDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs font-semibold text-slate-600">วันสิ้นสุด</label>
                    <input type="date" value={draft.endDate}
                      onChange={(e) => setDraft((d) => d && { ...d, endDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={draft.enabled}
                    onChange={(e) => setDraft((d) => d && { ...d, enabled: e.target.checked })}
                    className="size-4 accent-blue-600"
                  />
                  เปิดใช้งาน
                </label>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={!draft.name || draft.tiers.length === 0}
                    className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-40"
                  >
                    บันทึก
                  </button>
                  <button type="button" onClick={() => setDraft(null)} className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full bg-slate-100 p-5">
                <Percent className="size-8 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">คลิกโปรในลิสต์เพื่อแก้ไข</p>
                <p className="mt-0.5 text-xs text-slate-400">หรือกด "+ ใหม่" เพื่อสร้างโปรโมชั่น</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end border-t border-slate-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            ปิด
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type PurchaseCatalogPageProps = { className?: string; onGoToPurchaseCart?: () => void; onGoToPurchaseOrders?: () => void }

export function PurchaseCatalogPage({ className, onGoToPurchaseCart, onGoToPurchaseOrders }: PurchaseCatalogPageProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(100)
  const [visibleExternalCount, setVisibleExternalCount] = useState(100)
  const [externalOpen, setExternalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductMasterDetail | null>(null)
  const [categoryTree, setCategoryTree] = useState<MainCategory[]>(() => loadCategoryTree())
  const [showFavOnly, setShowFavOnly] = useState(false)
  const [lowStockMode, setLowStockMode] = useState(false)
  const [showInStoreOnly, setShowInStoreOnly] = useState(true)
  const [supplierId, setSupplierId] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [subCategoryFilter, setSubCategoryFilter] = useState('')
  const [filterCarBrand, setFilterCarBrand] = useState('ทั้งหมด')
  const [filterCarModel, setFilterCarModel] = useState('ทั้งหมด')
  const [filterYear, setFilterYear] = useState('ทั้งหมด')
  const [filterEngine, setFilterEngine] = useState('ทั้งหมด')
  const [filterDrive, setFilterDrive] = useState('ทั้งหมด')
  const [favs, setFavs] = useState<Set<string>>(() => loadFavs())
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadCatalogCart())
  const [cartOpen, setCartOpen] = useState(() => loadCatalogCart().length > 0)
  const [compareProduct, setCompareProduct] = useState<Product | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadViewMode())
  const [vendorPromos, setVendorPromos] = useState<VendorPromotion[]>(() => loadVendorPromotions())
  const [vendorPromoModalOpen, setVendorPromoModalOpen] = useState(false)


  // Sync when another panel (e.g. LowStock) adds items
  useEffect(() => {
    const handler = () => setCartItems(loadCatalogCart())
    window.addEventListener(CATALOG_CART_CHANGED, handler)
    return () => window.removeEventListener(CATALOG_CART_CHANGED, handler)
  }, [])

  // Debounce search — filter only fires 250 ms after the user stops typing
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 250)
    return () => clearTimeout(id)
  }, [search])

  // Auto-expand reference section when user is searching
  useEffect(() => {
    if (debouncedSearch.trim()) setExternalOpen(true)
  }, [debouncedSearch])

  const lastOrderedMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const po of loadPurchaseOrders()) {
      for (const line of po.lines) {
        const existing = map.get(line.productId)
        if (!existing || po.createdAt > existing) map.set(line.productId, po.createdAt)
      }
    }
    return map
  }, [])

  const supplierDirectory = useMemo(() => loadSupplierDirectory(), [])
  const supplierProfileMap = useMemo(
    () => new Map(supplierDirectory.map((s) => [s.id, s])),
    [supplierDirectory],
  )
  const [thresholdTick, setThresholdTick] = useState(0)
  const [promoTick, setPromoTick] = useState(0)
  useEffect(() => {
    const handler = () => setThresholdTick((n) => n + 1)
    window.addEventListener(INVENTORY_THRESHOLDS_CHANGED_EVENT, handler)
    window.addEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, handler)
    return () => {
      window.removeEventListener(INVENTORY_THRESHOLDS_CHANGED_EVENT, handler)
      window.removeEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, handler)
    }
  }, [])
  useEffect(() => {
    const handler = () => setPromoTick((n) => n + 1)
    window.addEventListener(PRODUCT_PROMO_CHANGED_EVENT, handler)
    return () => window.removeEventListener(PRODUCT_PROMO_CHANGED_EVENT, handler)
  }, [])

  useEffect(() => {
    const handler = () => setVendorPromos(loadVendorPromotions())
    window.addEventListener(PROMOTIONS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(PROMOTIONS_CHANGED_EVENT, handler)
  }, [])

  const allProducts = useMemo(
    () => applyWarehouseThresholds(mergeInventoryProductsWithLiveStock(getPosCatalogProducts())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [thresholdTick],
  )

  const categories = useMemo(
    () => [...new Set(allProducts.map((p) => p.category).filter(Boolean))].sort(),
    [allProducts],
  )
  const subCategories = useMemo(() => {
    if (!categoryFilter) return []
    return [...new Set(
      allProducts
        .filter((p) => p.category === categoryFilter && p.subCategory)
        .map((p) => p.subCategory as string),
    )].sort()
  }, [allProducts, categoryFilter])

  // When reference items are visible, include external master products in filter options
  // so the car brand/model dropdowns show all available values, not just in-store ones
  const productsForFilterOptions = useMemo(() => {
    if (showInStoreOnly) return allProducts as unknown as ProductMasterDetail[]
    const storeSkus = new Set(allProducts.map((p) => p.sku))
    const externalMaster = getProductMasterList().filter((p) => !storeSkus.has(p.sku))
    return [...(allProducts as unknown as ProductMasterDetail[]), ...externalMaster]
  }, [allProducts, showInStoreOnly])

  const carFilterOptions = useMemo(
    () =>
      collectInventoryCarFilterOptions(productsForFilterOptions, {
        carBrand: filterCarBrand,
        carModel: filterCarModel,
        engineLabel: filterEngine,
        driveType: filterDrive,
        filterAll: 'ทั้งหมด',
      }),
    [productsForFilterOptions, filterCarBrand, filterCarModel, filterEngine, filterDrive],
  )

  // productId → [{supplierId, lastPrice, lastBoughtAt}]
  const [productSupplierMap, setProductSupplierMap] = useState(() => buildProductSupplierMap())
  useEffect(() => {
    const handler = () => setProductSupplierMap(buildProductSupplierMap())
    window.addEventListener(SUPPLIER_CATALOG_CHANGED_EVENT, handler)
    return () => window.removeEventListener(SUPPLIER_CATALOG_CHANGED_EVENT, handler)
  }, [])

  const supplierPriceMap = useMemo(() => {
    if (!supplierId) return new Map<string, number>()
    return new Map(
      getSupplierCatalog(supplierId)
        .filter((c) => c.productId)
        .map((c) => [c.productId!, c.lastPrice]),
    )
  }, [supplierId])

  const getPrice = (p: Product) => {
    // ถ้าเลือก supplier ใด → ใช้ราคาของ supplier นั้น
    const fromSelected = supplierPriceMap.get(p.id)
    if (fromSelected) return fromSelected
    // ไม่มี supplier filter → หาราคาถูกสุดจากทุก supplier
    const entries = productSupplierMap.get(p.id) ?? []
    const prices = entries.map((e) => e.lastPrice).filter((x) => x > 0)
    if (prices.length > 0) return Math.min(...prices)
    // ไม่มี supplier เลย → ใช้ supplierListPrice จากมาสเตอร์
    const m = getProductMasterById(p.id)
    return (m?.supplierListPrice ?? 0) > 0 ? m!.supplierListPrice! : 0
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getBuyConditions = useCallback((p: Product) => {
    const m = getProductMasterById(p.id)
    if (!m) return { buyScheme: null, discountChain: undefined }
    const bp = m.poLastBonusPaid ?? 0
    const bf = m.poLastBonusFree ?? 0
    const buyScheme = bp > 0 && bf > 0 ? { buyQty: bp, freeQty: bf } : null
    return { buyScheme, discountChain: m.poLastDiscountChain }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promoTick])

  const productBrandMap = useMemo(
    () => new Map(allProducts.map((p) => [p.id, (p as unknown as { brand?: string }).brand ?? ''])),
    [allProducts],
  )

  const availableBrands = useMemo(
    () => [...new Set(allProducts.map((p) => (p as unknown as { brand?: string }).brand).filter(Boolean) as string[])].sort(),
    [allProducts],
  )

  const vendorPromosByProduct = useMemo(() => {
    const now = new Date()
    const map = new Map<string, VendorPromotion[]>()
    for (const vp of vendorPromos) {
      if (!isVendorPromotionActive(vp, now)) continue
      if (supplierId && vp.supplierId !== '' && vp.supplierId !== supplierId) continue
      if (vp.productId) {
        const list = map.get(vp.productId) ?? []
        list.push(vp)
        map.set(vp.productId, list)
      } else {
        for (const p of allProducts) {
          const brand = productBrandMap.get(p.id) ?? ''
          const cat = (p as unknown as { category?: string }).category ?? ''
          if (vp.brand && brand !== vp.brand) continue
          if (vp.category && cat !== vp.category) continue
          const list = map.get(p.id) ?? []
          list.push(vp)
          map.set(p.id, list)
        }
      }
    }
    return map
  }, [vendorPromos, supplierId, allProducts, productBrandMap])

  const lowStockCount = useMemo(
    () => allProducts.filter((p) => p.stock < p.minStock).length,
    [allProducts],
  )

  // Pre-compute search fields per product — rebuilds only when product list changes
  const productFieldsMap = useMemo(
    () => new Map(allProducts.map((p) => [p.id, productFields(p)])),
    [allProducts],
  )

  const filtered = useMemo(() => {
    const hasVehicleFilter =
      filterCarBrand !== 'ทั้งหมด' ||
      filterCarModel !== 'ทั้งหมด' ||
      filterYear !== 'ทั้งหมด' ||
      filterEngine !== 'ทั้งหมด' ||
      filterDrive !== 'ทั้งหมด'

    let list = [...allProducts]
    if (showFavOnly) list = list.filter((p) => favs.has(p.id))
    if (supplierId) list = list.filter((p) => productSupplierMap.get(p.id)?.some((v) => v.supplierId === supplierId))
    if (categoryFilter) list = list.filter((p) => p.category === categoryFilter)
    if (subCategoryFilter) list = list.filter((p) => p.subCategory === subCategoryFilter)
    if (hasVehicleFilter) {
      list = list.filter((p) =>
        productMatchesInventoryCarFilters(
          p as unknown as ProductMasterDetail,
          { brand: 'ทั้งหมด', carBrand: filterCarBrand, carModel: filterCarModel, year: filterYear, engineLabel: filterEngine, driveType: filterDrive },
          'ทั้งหมด',
        ),
      )
    }
    if (debouncedSearch.trim()) {
      const tokens = debouncedSearch.trim().split(/\s+/).filter(Boolean)
      const scored = list
        .map((p) => ({ p, score: searchScore(productFieldsMap.get(p.id) ?? productFields(p), tokens) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
      list = scored.map(({ p }) => p)
    }
    return list
  }, [allProducts, showFavOnly, supplierId, categoryFilter, subCategoryFilter, productSupplierMap, debouncedSearch, favs, productFieldsMap, filterCarBrand, filterCarModel, filterYear, filterEngine, filterDrive])

  // Products NOT currently active in store (from master list, filtered out of POS catalog)
  const externalItems = useMemo(() => {
    if (showInStoreOnly) return []
    const storeSkus = new Set(allProducts.map((p) => p.sku))
    const storeProductIds = new Set(allProducts.map((p) => p.id))
    const q = debouncedSearch.trim()
    const tokens = q ? q.split(/\s+/).filter(Boolean) : []
    const hasVehicleFilter =
      filterCarBrand !== 'ทั้งหมด' ||
      filterCarModel !== 'ทั้งหมด' ||
      filterYear !== 'ทั้งหมด' ||
      filterEngine !== 'ทั้งหมด' ||
      filterDrive !== 'ทั้งหมด'
    const hasAnyFilter = hasVehicleFilter || !!categoryFilter || !!subCategoryFilter

    const passesFilter = (p: ProductMasterDetail): boolean => {
      if (categoryFilter && p.category !== categoryFilter) return false
      if (subCategoryFilter && p.subCategory !== subCategoryFilter) return false
      if (!hasVehicleFilter) return true
      return productMatchesInventoryCarFilters(
        p,
        { brand: 'ทั้งหมด', carBrand: filterCarBrand, carModel: filterCarModel, year: filterYear, engineLabel: filterEngine, driveType: filterDrive },
        'ทั้งหมด',
      )
    }

    // 1) Master list products not in store
    const allMasterNotInStore = getProductMasterList().filter((p) => !storeSkus.has(p.sku))
    // Build SKU → master lookup for supplier item filtering below
    const masterBySku = new Map(allMasterNotInStore.map((p) => [p.sku, p]))

    const masterExternal = allMasterNotInStore
      .filter((p) => !hasAnyFilter || passesFilter(p))
      .filter((p) => !tokens.length || searchScore(masterFields(p), tokens) > 0)
      .sort((a, b) => {
        if (!tokens.length) return 0
        return searchScore(masterFields(b), tokens) - searchScore(masterFields(a), tokens)
      })
      .map((p) => ({
        source: 'master' as const,
        key: `master-${p.sku}`,
        sku: p.sku,
        name: p.name,
        lastPrice: getActiveCost(p),
        supplierId: '',
        supplierName: undefined as string | undefined,
        fitments: p.vehicleFitments,
        carBrand: p.carBrand !== '—' ? p.carBrand : undefined,
        carModelLabel: p.carModelLabel !== '—' ? p.carModelLabel : undefined,
        yearLabel: p.yearLabel !== '—' ? p.yearLabel : undefined,
      }))

    // 2) Supplier catalog items not linked to any store product
    // When a vehicle/category filter is active, look up master data by SKU to apply it
    const supplierExternal: typeof masterExternal = []
    const seen = new Set<string>()
    for (const item of getAllSupplierCatalogItems()) {
      if (item.productId && storeProductIds.has(item.productId)) continue
      if (supplierId && item.supplierId !== supplierId) continue
      if (tokens.length && searchScore([item.sku, item.name], tokens) < 0) continue
      if (hasAnyFilter) {
        const masterItem = masterBySku.get(item.sku)
        if (!masterItem || !passesFilter(masterItem)) continue
      }
      const key = `sup-${item.sku}-${item.supplierId}`
      if (seen.has(key)) continue
      seen.add(key)
      const sup = supplierDirectory.find((s) => s.id === item.supplierId)
      supplierExternal.push({
        source: 'supplier' as const,
        key,
        sku: item.sku,
        name: item.name,
        lastPrice: item.lastPrice,
        supplierId: item.supplierId,
        supplierName: sup?.name,
      })
    }

    // Merge: supplier items take priority over master (they have pricing), de-dup by sku
    // When a supplier filter is active, skip master-list items (they have no supplier link)
    const allExternal = [...supplierExternal]
    if (!supplierId) {
      const supplierSkus = new Set(supplierExternal.map((e) => e.sku))
      for (const m of masterExternal) {
        if (!supplierSkus.has(m.sku)) allExternal.push(m)
      }
    }
    return allExternal
  }, [showInStoreOnly, allProducts, supplierId, debouncedSearch, supplierDirectory, categoryFilter, subCategoryFilter, filterCarBrand, filterCarModel, filterYear, filterEngine, filterDrive])

  const toggleFav = (productId: string) => {
    setFavs((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      saveFavs(next)
      return next
    })
  }

  const saveCart = (items: CartItem[]) => {
    setCartItems(items)
    saveCatalogCartSilent(items)
  }

  const addToCart = (p: Product) => {
    const vendors = productSupplierMap.get(p.id) ?? []
    const autoVendor = vendors.length === 1 ? vendors[0] : undefined
    const autoSup = autoVendor ? supplierProfileMap.get(autoVendor.supplierId) : undefined
    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === p.id)
      let next: CartItem[]
      if (idx >= 0) {
        next = prev.map((i, n) => n === idx ? { ...i, qty: i.qty + 1 } : i)
      } else {
        next = [...prev, {
          productId: p.id,
          sku: p.sku,
          name: p.name,
          qty: 1,
          unitCost: autoVendor && autoVendor.lastPrice > 0 ? autoVendor.lastPrice : getPrice(p),
          supplierId: autoVendor?.supplierId,
          supplierName: autoSup?.name,
        }]
      }
      saveCatalogCartSilent(next)
      return next
    })
    setCartOpen(true)
  }

  const updateCartItem = (productId: string, patch: Partial<CartItem>) => {
    setCartItems((prev) => {
      const next = prev.map((i) => i.productId === productId ? { ...i, ...patch } : i)
      saveCatalogCartSilent(next)
      return next
    })
  }

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId)
      saveCatalogCartSilent(next)
      return next
    })
  }

  const cartTotal = cartItems.reduce((s, i) => s + i.qty * i.unitCost, 0)

  const handleBuyFrom = (product: Product, fromSupplierId: string, price: number) => {
    setSupplierId(fromSupplierId)
    const fromSupplier = supplierDirectory.find((s) => s.id === fromSupplierId)
    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id)
      let next: CartItem[]
      if (idx >= 0) {
        next = prev.map((i, n) =>
          n === idx
            ? { ...i, qty: i.qty + 1, unitCost: price, supplierId: fromSupplierId, supplierName: fromSupplier?.name }
            : i,
        )
      } else {
        next = [
          ...prev,
          {
            productId: product.id,
            sku: product.sku,
            name: product.name,
            qty: 1,
            unitCost: price,
            supplierId: fromSupplierId,
            supplierName: fromSupplier?.name,
          },
        ]
      }
      saveCatalogCartSilent(next)
      return next
    })
    setCartOpen(true)
  }

  if (lowStockMode) {
    return (
      <LowStockWorkspacePage
        className={className}
        onBack={() => setLowStockMode(false)}
        onGoToCatalog={() => setLowStockMode(false)}
        onOpenPurchaseCart={() => { setLowStockMode(false); setCartOpen(true) }}
      />
    )
  }

  return (
    <div className={clsx('relative flex h-full min-h-0 flex-col overflow-hidden', className)}>

      {/* ── Filter bar ── */}
      <div className="shrink-0 flex flex-col gap-0 border-b border-slate-200 bg-slate-50">
      {/* Row 1: Search + Cart */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(100); setVisibleExternalCount(100) }}
            placeholder="ค้นหาชื่อสินค้า / รหัส / บาร์โค้ด…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setVisibleCount(100); setVisibleExternalCount(100) }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Toggle buttons — sit between search and cart */}
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="h-4 w-px shrink-0 bg-slate-200" />
          <button
            type="button"
            onClick={() => setLowStockMode(true)}
            className={clsx(
              'flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition',
              lowStockCount > 0
                ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'border-slate-200 bg-white text-slate-500 hover:border-rose-300 hover:text-rose-600',
            )}
          >
            <TriangleAlert className="size-3.5" />
            ใกล้หมด
            {lowStockCount > 0 && (
              <span className="rounded-full bg-rose-200 px-1.5 text-[10px] font-black text-rose-800">{lowStockCount}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowInStoreOnly((v) => !v)}
            className={clsx(
              'flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition',
              showInStoreOnly
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600',
            )}
          >
            <Store className="size-3.5" />
            เฉพาะในร้าน
          </button>
          <button
            type="button"
            onClick={() => setShowFavOnly((v) => !v)}
            className={clsx(
              'flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition',
              showFavOnly
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-600',
            )}
          >
            <Star className={clsx('size-3.5', showFavOnly && 'fill-amber-400 text-amber-400')} />
            รายการโปรด
            {favs.size > 0 && (
              <span className={clsx('rounded-full px-1.5 text-[10px] font-black', showFavOnly ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-500')}>{favs.size}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setVendorPromoModalOpen(true)}
            className={clsx(
              'flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition',
              vendorPromos.filter((vp) => vp.enabled).length > 0
                ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600',
            )}
          >
            <Percent className="size-3.5" />
            โปรผู้ขาย
            {vendorPromos.filter((vp) => vp.enabled).length > 0 && (
              <span className="rounded-full bg-blue-200 px-1.5 text-[10px] font-black text-blue-800">
                {vendorPromos.filter((vp) => vp.enabled).length}
              </span>
            )}
          </button>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => { setViewMode('grid'); saveViewMode('grid') }}
              className={clsx('rounded-md p-1 transition', viewMode === 'grid' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-600')}
              title="มุมมองกริด"
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('list'); saveViewMode('list') }}
              className={clsx('rounded-md p-1 transition', viewMode === 'list' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-600')}
              title="มุมมองรายการ"
            >
              <LayoutList className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Cart — pinned right */}
        <button
          type="button"
          onClick={() => setCartOpen((v) => !v)}
          className={clsx(
            'flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition',
            cartItems.length > 0
              ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
              : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-600',
          )}
        >
          <ShoppingCart className="size-3.5" />
          ตะกร้า
          {cartItems.length > 0 && (
            <>
              <span className="rounded-full bg-white/25 px-1.5 text-[10px] font-black">{cartItems.length}</span>
              <span className="text-[10px] font-black opacity-80">฿{cartTotal.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
            </>
          )}
        </button>
      </div>
      {/* Row 2: Filter groups */}
      <div className="flex flex-wrap items-center gap-x-0 gap-y-1.5 px-3 pb-2">

        {/* Group 1: Product filters — VIN · Supplier · Category */}
        <div className="flex items-center gap-2">
          <VinSearchBox
            availableBrands={carFilterOptions.carBrands}
            availableYears={carFilterOptions.years}
            onApply={(brand, year, _model) => {
              if (brand) setFilterCarBrand(brand)
              if (year) setFilterYear(year)
            }}
          />
          <SupplierCombobox
            suppliers={supplierDirectory}
            value={supplierId}
            onChange={setSupplierId}
          />
          <div className="flex items-center gap-1">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setSubCategoryFilter('') }}
              className={clsx(
                'rounded-lg border py-1.5 pl-2.5 pr-6 text-xs font-semibold outline-none transition',
                categoryFilter
                  ? 'border-violet-300 bg-violet-50 text-violet-800 focus:border-violet-400'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 focus:border-violet-300',
              )}
            >
              <option value="">หมวดทั้งหมด</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {subCategories.length > 0 && (
              <select
                value={subCategoryFilter}
                onChange={(e) => setSubCategoryFilter(e.target.value)}
                className={clsx(
                  'rounded-lg border py-1.5 pl-2.5 pr-6 text-xs font-semibold outline-none transition',
                  subCategoryFilter
                    ? 'border-violet-300 bg-violet-100 text-violet-900 focus:border-violet-400'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 focus:border-violet-300',
                )}
              >
                <option value="">ทุกหมวดย่อย</option>
                {subCategories.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
            {categoryFilter && (
              <button
                type="button"
                onClick={() => { setCategoryFilter(''); setSubCategoryFilter('') }}
                className="rounded-full p-1 text-violet-400 hover:bg-violet-50 hover:text-violet-700"
                title="ล้างหมวด"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-2 h-4 w-px shrink-0 bg-slate-200" />

        {/* Group 2: Vehicle filters */}
        <div className="flex items-center gap-1">
          <Car className="size-3.5 shrink-0 text-slate-400" aria-hidden />
          <select
            value={filterCarBrand}
            onChange={(e) => {
              setFilterCarBrand(e.target.value)
              setFilterCarModel('ทั้งหมด')
              setFilterEngine('ทั้งหมด')
              setFilterDrive('ทั้งหมด')
              setFilterYear('ทั้งหมด')
            }}
            className={clsx(
              'rounded-lg border py-1.5 pl-2.5 pr-6 text-xs font-semibold outline-none transition',
              filterCarBrand !== 'ทั้งหมด'
                ? 'border-sky-300 bg-sky-50 text-sky-800 focus:border-sky-400'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 focus:border-sky-300',
            )}
          >
            <option value="ทั้งหมด">ยี่ห้อรถ</option>
            {carFilterOptions.carBrands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={filterCarModel}
            onChange={(e) => {
              setFilterCarModel(e.target.value)
              setFilterEngine('ทั้งหมด')
              setFilterDrive('ทั้งหมด')
              setFilterYear('ทั้งหมด')
            }}
            className={clsx(
              'rounded-lg border py-1.5 pl-2.5 pr-6 text-xs font-semibold outline-none transition',
              filterCarModel !== 'ทั้งหมด'
                ? 'border-sky-300 bg-sky-100 text-sky-900 focus:border-sky-400'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 focus:border-sky-300',
            )}
          >
            <option value="ทั้งหมด">รุ่นรถ</option>
            {carFilterOptions.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={filterEngine}
            onChange={(e) => {
              setFilterEngine(e.target.value)
              setFilterDrive('ทั้งหมด')
              setFilterYear('ทั้งหมด')
            }}
            className={clsx(
              'rounded-lg border py-1.5 pl-2.5 pr-6 text-xs font-semibold outline-none transition',
              filterEngine !== 'ทั้งหมด'
                ? 'border-sky-300 bg-sky-50 text-sky-800 focus:border-sky-400'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 focus:border-sky-300',
            )}
          >
            <option value="ทั้งหมด">เครื่องยนต์</option>
            {carFilterOptions.engines.map((en) => (
              <option key={en} value={en}>{en}</option>
            ))}
          </select>
          <select
            value={filterDrive}
            onChange={(e) => {
              setFilterDrive(e.target.value)
              setFilterYear('ทั้งหมด')
            }}
            className={clsx(
              'rounded-lg border py-1.5 pl-2.5 pr-6 text-xs font-semibold outline-none transition',
              filterDrive !== 'ทั้งหมด'
                ? 'border-sky-300 bg-sky-50 text-sky-800 focus:border-sky-400'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 focus:border-sky-300',
            )}
          >
            <option value="ทั้งหมด">ขับเคลื่อน</option>
            {carFilterOptions.driveTypes.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className={clsx(
              'rounded-lg border py-1.5 pl-2.5 pr-6 text-xs font-semibold outline-none transition',
              filterYear !== 'ทั้งหมด'
                ? 'border-sky-300 bg-sky-50 text-sky-800 focus:border-sky-400'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 focus:border-sky-300',
            )}
          >
            <option value="ทั้งหมด">รุ่นปี</option>
            {carFilterOptions.years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {(filterCarBrand !== 'ทั้งหมด' || filterCarModel !== 'ทั้งหมด' || filterYear !== 'ทั้งหมด' || filterEngine !== 'ทั้งหมด' || filterDrive !== 'ทั้งหมด') && (
            <button
              type="button"
              onClick={() => { setFilterCarBrand('ทั้งหมด'); setFilterCarModel('ทั้งหมด'); setFilterYear('ทั้งหมด'); setFilterEngine('ทั้งหมด'); setFilterDrive('ทั้งหมด') }}
              className="rounded-full p-1 text-sky-400 hover:bg-sky-50 hover:text-sky-700"
              title="ล้างตัวกรองรุ่นรถ"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

      </div>
      </div>

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* Product grid */}
        <div className="min-w-0 flex-1 overflow-y-auto p-3">

          {filtered.length === 0 && externalItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <Star className="size-12 stroke-[1]" />
              <p className="text-sm font-semibold">
                {showFavOnly ? 'ยังไม่มีรายการโปรด' : 'ไม่พบสินค้า'}
              </p>
              {showFavOnly && (
                <p className="text-xs">กด ⭐ บนการ์ดสินค้าเพื่อเพิ่มรายการโปรด</p>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* In-store products */}
              {filtered.length > 0 && (() => {
                const visibleFiltered = filtered.slice(0, visibleCount)
                const hasMore = filtered.length > visibleCount
                return (
                  <div>
                    {viewMode === 'list' ? (
                      <div className="space-y-1.5">
                        {/* List header */}
                        <div className="flex items-center gap-3 px-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          <div className="size-12 shrink-0" />
                          <div className="flex-1">สินค้า</div>
                          <div className="w-36 shrink-0 text-center">สต็อก / ขั้นต่ำ</div>
                          <div className="hidden w-36 shrink-0 md:block">ซัพพลายเออร์</div>
                          <div className="w-20 shrink-0 text-right">ราคา</div>
                          <div className="w-32 shrink-0" />
                        </div>
                        {visibleFiltered.map((p) => (
                          <ProductListRow
                            key={p.id}
                            product={p}
                            isFav={favs.has(p.id)}
                            inCart={cartItems.some((i) => i.productId === p.id)}
                            cartQty={cartItems.find((i) => i.productId === p.id)?.qty ?? 0}
                            price={getPrice(p)}
                            suppliers={productSupplierMap.get(p.id) ?? []}
                            supplierMap={supplierProfileMap}
                            activeSupplierId={supplierId}
                            lastOrderedAt={lastOrderedMap.get(p.id)}
                            vendorPromos={vendorPromosByProduct.get(p.id) ?? []}
                            onToggleFav={() => toggleFav(p.id)}
                            onAdd={() => addToCart(p)}
                            onSelectSupplier={(id) => setSupplierId(id)}
                            onCompare={() => setCompareProduct(p)}
                            onEdit={() => {
                              const m = getProductMasterList().find((x) => x.sku === p.sku)
                              if (m) setEditingProduct(m)
                            }}
                            onMinStockSaved={() => setThresholdTick((n) => n + 1)}
                            onOrderQtySaved={() => setThresholdTick((n) => n + 1)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3">
                        {visibleFiltered.map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            isFav={favs.has(p.id)}
                            inCart={cartItems.some((i) => i.productId === p.id)}
                            cartQty={cartItems.find((i) => i.productId === p.id)?.qty ?? 0}
                            price={getPrice(p)}
                            buyScheme={getBuyConditions(p).buyScheme}
                            discountChain={getBuyConditions(p).discountChain}
                            suppliers={productSupplierMap.get(p.id) ?? []}
                            supplierMap={supplierProfileMap}
                            activeSupplierId={supplierId}
                            lastOrderedAt={lastOrderedMap.get(p.id)}
                            vendorPromos={vendorPromosByProduct.get(p.id) ?? []}
                            onToggleFav={() => toggleFav(p.id)}
                            onAdd={() => addToCart(p)}
                            onSelectSupplier={(id) => setSupplierId(id)}
                            onCompare={() => setCompareProduct(p)}
                            onEdit={() => {
                              const m = getProductMasterList().find((x) => x.sku === p.sku)
                              if (m) setEditingProduct(m)
                            }}
                            onMinStockSaved={() => setThresholdTick((n) => n + 1)}
                            onOrderQtySaved={() => setThresholdTick((n) => n + 1)}
                          />
                        ))}
                      </div>
                    )}
                    {hasMore && (
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setVisibleCount((n) => n + 100)}
                          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          แสดงเพิ่ม 100 ({visibleCount}/{filtered.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setVisibleCount(filtered.length)}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          แสดงทั้งหมด {filtered.length} รายการ
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* External supplier products (not in store) */}
              {externalItems.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-px flex-1 bg-slate-200" />
                    <button
                      type="button"
                      onClick={() => setExternalOpen((o) => !o)}
                      className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 transition hover:bg-slate-200"
                    >
                      <PackagePlus className="size-3" />
                      ไม่มีในร้าน — จากซัพพลายเออร์ ({externalItems.length})
                      <ChevronDown className={clsx('size-3 transition-transform', externalOpen && 'rotate-180')} />
                    </button>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  {externalOpen && (() => {
                    const addToExtCart = (item: typeof externalItems[number]) => {
                      setCartItems((prev) => {
                        const idx = prev.findIndex((i) => i.productId === item.key)
                        const next = idx >= 0
                          ? prev.map((i, n) => n === idx ? { ...i, qty: i.qty + 1 } : i)
                          : [...prev, { productId: item.key, sku: item.sku, name: item.name, qty: 1, unitCost: item.lastPrice, supplierId: item.supplierId || undefined, supplierName: item.supplierName }]
                        saveCatalogCartSilent(next)
                        return next
                      })
                      setCartOpen(true)
                    }
                    return viewMode === 'list' ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3 px-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          <div className="size-12 shrink-0" />
                          <div className="flex-1">สินค้า</div>
                          <div className="w-20 shrink-0 text-right">ราคา</div>
                          <div className="w-32 shrink-0" />
                        </div>
                        {externalItems.slice(0, visibleExternalCount).map((item) => {
                          const inCart = cartItems.some((i) => i.productId === item.key)
                          const cartQty = cartItems.find((i) => i.productId === item.key)?.qty ?? 0
                          return (
                            <div key={item.key} className={clsx('flex items-center gap-3 rounded-xl border bg-white px-3 py-2', inCart ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200')}>
                              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-slate-50 flex items-center justify-center">
                                <PackagePlus className="size-6 text-slate-300" strokeWidth={1} />
                                {inCart && <div className="absolute left-0 top-0 flex size-5 items-center justify-center rounded-br-lg bg-emerald-600 text-[9px] font-black text-white">{cartQty}</div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-xs font-semibold text-slate-800">{item.name}</p>
                                <p className="font-mono text-[10px] text-slate-400">{item.sku}</p>
                                <div className="mt-0.5 flex items-center gap-1.5">
                                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">ไม่มีในร้าน</span>
                                  {item.supplierName && <span className="text-[9px] font-semibold text-indigo-500">{item.supplierName}</span>}
                                </div>
                                <ExtFitmentButton item={item} />
                              </div>
                              <div className="w-20 shrink-0 text-right">
                                {item.lastPrice > 0
                                  ? <span className="text-sm font-black text-slate-900">฿{item.lastPrice.toLocaleString('th-TH')}</span>
                                  : <span className="text-xs text-slate-300">—</span>}
                              </div>
                              <div className="w-32 shrink-0 flex justify-end">
                                <button type="button" onClick={() => addToExtCart(item)} className={clsx('flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition', inCart ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-700')}>
                                  <Plus className="size-3.5" />{inCart ? 'เพิ่ม' : 'ใส่ตะกร้า'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3">
                        {externalItems.slice(0, visibleExternalCount).map((item) => {
                          const inCart = cartItems.some((i) => i.productId === item.key)
                          const cartQty = cartItems.find((i) => i.productId === item.key)?.qty ?? 0
                          return (
                            <div key={item.key} className={clsx('relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm', inCart ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200')}>
                              {inCart && <div className="absolute left-2 top-2 z-10 flex size-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white shadow">{cartQty}</div>}
                              <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
                                <PackagePlus className="size-8 text-slate-300" strokeWidth={1} />
                              </div>
                              <div className="flex flex-1 flex-col p-2.5">
                                <p className="line-clamp-2 text-xs font-semibold leading-tight text-slate-800">{item.name}</p>
                                <p className="mt-0.5 font-mono text-[10px] text-slate-400">{item.sku}</p>
                                <span className="mt-1 inline-block rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">ไม่มีในร้าน</span>
                                {item.supplierName && <p className="mt-1 truncate text-[9px] font-semibold text-indigo-500">{item.supplierName}</p>}
                                <ExtFitmentButton item={item} />
                                <p className="mt-1.5 text-sm font-black text-slate-900">
                                  {item.lastPrice > 0 ? `฿${item.lastPrice.toLocaleString('th-TH')}` : <span className="text-xs font-normal text-slate-300">ยังไม่มีราคา</span>}
                                </p>
                                <button type="button" onClick={() => addToExtCart(item)} className={clsx('mt-2 flex w-full items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-bold transition', inCart ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-700')}>
                                  <Plus className="size-3.5" />{inCart ? 'เพิ่มอีก' : 'ใส่ตะกร้า'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                  {externalOpen && externalItems.length > visibleExternalCount && (
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setVisibleExternalCount((n) => n + 100)}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        แสดงเพิ่ม 100 ({visibleExternalCount}/{externalItems.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisibleExternalCount(externalItems.length)}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        แสดงทั้งหมด {externalItems.length} รายการ
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart sidebar */}
        {cartOpen && (
          <CartSidebar
            items={cartItems}
            productSupplierMap={productSupplierMap}
            supplierProfileMap={supplierProfileMap}
            onUpdate={updateCartItem}
            onRemove={removeFromCart}
            onGoToCart={() => { setCartOpen(false); onGoToPurchaseCart?.() }}
            onClose={() => setCartOpen(false)}
          />
        )}
      </div>


      {/* ── Price compare modal ── */}
      {compareProduct && (
        <PriceCompareModal
          product={compareProduct}
          suppliers={productSupplierMap.get(compareProduct.id) ?? []}
          supplierMap={supplierProfileMap}
          currentCost={getLatestUnitCostForPo(compareProduct)}
          onBuyFrom={(fromSupplierId, price) => handleBuyFrom(compareProduct, fromSupplierId, price)}
          onClose={() => setCompareProduct(null)}
        />
      )}

      {/* ── Edit product modal ── */}
      <AddProductModal
        open={editingProduct !== null}
        onClose={() => setEditingProduct(null)}
        onCreate={() => {}}
        onUpdate={(updated) => {
          saveProductMasterList(
            getProductMasterList().map((x) => (x.id === updated.id ? updated : x)),
          )
          setEditingProduct(null)
          setThresholdTick((n) => n + 1)
        }}
        editingProduct={editingProduct}
        categoryTree={categoryTree}
        existingSkus={new Set(getProductMasterList().filter((x) => x.id !== editingProduct?.id).map((x) => x.sku.toLowerCase()))}
      />

      {/* ── Vendor promo modal ── */}

      {vendorPromoModalOpen && (
        <VendorPromoModal
          promos={vendorPromos}
          products={allProducts.map((p) => ({ id: p.id, name: p.name, sku: p.sku }))}
          brands={availableBrands}
          categories={categories}
          suppliers={supplierDirectory}
          onSave={(updated) => {
            saveVendorPromotions(updated)
            setVendorPromos(updated)
          }}
          onClose={() => setVendorPromoModalOpen(false)}
        />
      )}
    </div>
  )
}
