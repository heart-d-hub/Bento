import { getStoredBranch } from '@/features/auth/authSession'
import {
  loadCatalogCart,
  saveCatalogCart,
  CATALOG_CART_CHANGED,
  type CatalogCartItem,
} from '@/features/purchase/data/catalogCartStore'
import { nextPurchaseOrderNo } from '@/features/purchase/data/poSequence'
import { loadPurchaseOrders, upsertPurchaseOrder } from '@/features/purchase/data/poStore'
import {
  loadSupplierDirectory,
  SUPPLIER_DIRECTORY_CHANGED_EVENT,
  type SupplierProfile,
} from '@/features/purchase/data/supplierDirectoryStore'
import {
  buildProductSupplierMap,
  linkProductToSupplier,
  unlinkProductFromSupplier,
  SUPPLIER_CATALOG_CHANGED_EVENT,
  type ProductSupplierEntry,
} from '@/features/purchase/data/supplierCatalogStore'
import {
  loadTransportDirectory,
  TRANSPORT_DIRECTORY_CHANGED_EVENT,
} from '@/features/transport/data/transportDirectoryStore'
import { ProductImage } from '@/features/inventory/components/ProductImage'
import { ShippingCombobox } from '@/features/purchase/components/ShippingCombobox'
import { clsx } from 'clsx'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  MessageSquare,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  Truck,
  Wand2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
          'flex w-full items-center justify-between rounded-lg border px-2 py-1 text-left text-[10px] outline-none transition',
          !supplierId ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300',
        )}>
        <span className={clsx('truncate', supplierId ? 'text-slate-700' : 'text-slate-400')}>
          {supplierName || '— เลือกร้านค้า —'}
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

type PurchaseCartWorkspacePageProps = {
  className?: string
  onGoToCatalog?: () => void
  onGoToPurchaseOrders?: () => void
}

function newLineId() { return `ln-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
function newPoId() { return `po-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
function fmt(n: number) { return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const GROUP_COLORS = [
  { border: 'border-indigo-200', header: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-400', text: 'text-indigo-700' },
  { border: 'border-emerald-200', header: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400', text: 'text-emerald-700' },
  { border: 'border-amber-200', header: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400', text: 'text-amber-700' },
  { border: 'border-rose-200', header: 'bg-rose-50', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-400', text: 'text-rose-700' },
  { border: 'border-violet-200', header: 'bg-violet-50', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-400', text: 'text-violet-700' },
  { border: 'border-cyan-200', header: 'bg-cyan-50', badge: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-400', text: 'text-cyan-700' },
]

export function PurchaseCartWorkspacePage({ className, onGoToCatalog, onGoToPurchaseOrders }: PurchaseCartWorkspacePageProps) {
  const [items, setItems] = useState<CatalogCartItem[]>(() => loadCatalogCart())
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>(() => loadSupplierDirectory())
  const [productSupplierMap, setProductSupplierMap] = useState<Map<string, ProductSupplierEntry[]>>(
    () => buildProductSupplierMap(),
  )
  const [createdCount, setCreatedCount] = useState(0)
  const [vendorNotes, setVendorNotes] = useState<Record<string, string>>({})
  const [vendorDelivery, setVendorDelivery] = useState<Record<string, string>>({})
  const [vendorShipping, setVendorShipping] = useState<Record<string, string>>({})

  useEffect(() => {
    const handler = () => {
      const next = loadCatalogCart()
      setItems(next)
    }
    window.addEventListener(CATALOG_CART_CHANGED, handler)
    return () => window.removeEventListener(CATALOG_CART_CHANGED, handler)
  }, [])

  useEffect(() => {
    const handler = () => setSuppliers(loadSupplierDirectory())
    window.addEventListener(SUPPLIER_DIRECTORY_CHANGED_EVENT, handler)
    return () => window.removeEventListener(SUPPLIER_DIRECTORY_CHANGED_EVENT, handler)
  }, [])

  useEffect(() => {
    const handler = () => setProductSupplierMap(buildProductSupplierMap())
    window.addEventListener(SUPPLIER_CATALOG_CHANGED_EVENT, handler)
    return () => window.removeEventListener(SUPPLIER_CATALOG_CHANGED_EVENT, handler)
  }, [])

  const [transportNames, setTransportNames] = useState<string[]>(
    () => loadTransportDirectory().map((t) => t.name),
  )
  useEffect(() => {
    const handler = () => setTransportNames(loadTransportDirectory().map((t) => t.name))
    window.addEventListener(TRANSPORT_DIRECTORY_CHANGED_EVENT, handler)
    return () => window.removeEventListener(TRANSPORT_DIRECTORY_CHANGED_EVENT, handler)
  }, [])

  const supplierMap = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s])),
    [suppliers],
  )

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; items: CatalogCartItem[] }>()
    for (const item of items) {
      const key = item.supplierId ?? ''
      if (!map.has(key)) {
        const sup = supplierMap.get(key)
        map.set(key, { name: sup?.name ?? item.supplierName ?? 'ไม่ระบุร้านค้า', items: [] })
      }
      map.get(key)!.items.push(item)
    }
    return Array.from(map.entries()).map(([supplierId, val]) => ({ supplierId, ...val }))
  }, [items, supplierMap])

  // Auto-suggest shipping method from last PO per supplier
  useEffect(() => {
    const allPos = loadPurchaseOrders()
    setVendorShipping((prev) => {
      const next = { ...prev }
      let changed = false
      for (const group of groups) {
        if (!group.supplierId || next[group.supplierId]) continue
        const lastPo = allPos
          .filter((po) => po.supplierId === group.supplierId && po.shippingMethod)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
        if (lastPo?.shippingMethod) { next[group.supplierId] = lastPo.shippingMethod; changed = true }
      }
      return changed ? next : prev
    })
  }, [groups])

  const isItemSelected = (productId: string) => selected.has(productId)
  const isGroupSelected = (g: typeof groups[number]) => g.items.every((i) => selected.has(i.productId))
  const isGroupPartial = (g: typeof groups[number]) => g.items.some((i) => selected.has(i.productId)) && !isGroupSelected(g)
  const isAllSelected = items.length > 0 && items.every((i) => selected.has(i.productId))

  const toggleItem = (productId: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(productId) ? n.delete(productId) : n.add(productId); return n })

  const toggleGroup = (g: typeof groups[number]) =>
    setSelected((prev) => {
      const n = new Set(prev)
      const allIn = g.items.every((i) => n.has(i.productId))
      for (const i of g.items) allIn ? n.delete(i.productId) : n.add(i.productId)
      return n
    })

  const toggleAll = () =>
    isAllSelected ? setSelected(new Set()) : setSelected(new Set(items.map((i) => i.productId)))

  const saveItems = useCallback((next: CatalogCartItem[]) => {
    setItems(next); saveCatalogCart(next)
  }, [])

  // Auto-assign supplier when an item has exactly one linked vendor and none is set yet
  useEffect(() => {
    if (!items.some((i) => !i.supplierId)) return
    const next = items.map((item) => {
      if (item.supplierId) return item
      const vendors = productSupplierMap.get(item.productId) ?? []
      if (vendors.length !== 1) return item
      const vendor = vendors[0]!
      const sup = suppliers.find((s) => s.id === vendor.supplierId)
      return {
        ...item,
        supplierId: vendor.supplierId,
        supplierName: sup?.name ?? item.supplierName,
        unitCost: vendor.lastPrice > 0 ? vendor.lastPrice : item.unitCost,
      }
    })
    if (next.some((item, i) => item.supplierId !== items[i]?.supplierId)) saveItems(next)
  }, [items, productSupplierMap, suppliers, saveItems])

  const updateItem = (productId: string, patch: Partial<CatalogCartItem>) =>
    saveItems(items.map((i) => i.productId === productId ? { ...i, ...patch } : i))

  const removeItem = (productId: string) => {
    setSelected((prev) => { const n = new Set(prev); n.delete(productId); return n })
    saveItems(items.filter((i) => i.productId !== productId))
  }

  const removeSelected = () => { saveItems(items.filter((i) => !selected.has(i.productId))); setSelected(new Set()) }

  const autoAssignVendors = () => {
    const next = items.map((item) => {
      if (item.supplierId) return item
      const vendors = productSupplierMap.get(item.productId) ?? []
      if (vendors.length === 0) return item
      const best = vendors.filter((v) => v.lastPrice > 0).sort((a, b) => a.lastPrice - b.lastPrice)[0] ?? vendors[0]!
      const sup = suppliers.find((s) => s.id === best.supplierId)
      return {
        ...item,
        supplierId: best.supplierId,
        supplierName: sup?.name ?? item.supplierName,
        unitCost: best.lastPrice > 0 ? best.lastPrice : item.unitCost,
      }
    })
    saveItems(next)
  }

  const unassignedCount = items.filter((i) => !i.supplierId && (productSupplierMap.get(i.productId)?.length ?? 0) > 0).length

  const selectedItems = items.filter((i) => selected.has(i.productId))
  const selectedGroupCount = groups.filter((g) => g.items.some((i) => selected.has(i.productId))).length
  const selectedNoVendor = selectedItems.filter((i) => !i.supplierId)
  const grandTotal = items.reduce((s, i) => s + i.qty * i.unitCost, 0)
  const selectedTotal = selectedItems.reduce((s, i) => s + i.qty * i.unitCost, 0)

  const createPo = () => {
    if (selectedItems.length === 0) return
    if (selectedNoVendor.length > 0) return
    const branchId = getStoredBranch() ?? 'somneuk'
    const existing = loadPurchaseOrders()
    const now = new Date().toISOString()
    const groups2 = new Map<string, CatalogCartItem[]>()
    for (const item of selectedItems) {
      const key = item.supplierId ?? ''
      if (!groups2.has(key)) groups2.set(key, [])
      groups2.get(key)!.push(item)
    }
    let seq = 0
    for (const [gSupId, gItems] of groups2) {
      const gSupplier = suppliers.find((s) => s.id === gSupId)
      const draft = gSupId ? existing.find((o) => o.status === 'ordered' && o.supplierId === gSupId && o.receiveBatches.length === 0) : undefined
      if (gSupId) {
        for (const item of gItems) {
          linkProductToSupplier(gSupId, { productId: item.productId, sku: item.sku, name: item.name, unitCost: item.unitCost })
        }
      }
      const lines = gItems.map((item) => ({
        lineId: `${newLineId()}-${seq++}`,
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        orderedQty: item.qty,
        unitCostOrder: item.unitCost,
        receivedQtyTotal: 0,
        ...(item.boxCount ? { orderBoxCount: item.boxCount } : {}),
      }))
      if (draft) {
        const merged = { ...draft }
        for (const line of lines) {
          const idx = merged.lines.findIndex((l) => l.productId === line.productId)
          if (idx >= 0) {
            merged.lines = merged.lines.map((l, i) =>
              i === idx ? { ...l, orderedQty: l.orderedQty + line.orderedQty, unitCostOrder: line.unitCostOrder } : l,
            )
          } else { merged.lines = [...merged.lines, line] }
        }
        upsertPurchaseOrder(merged)
      } else {
        upsertPurchaseOrder({
          id: newPoId(),
          poNo: nextPurchaseOrderNo(branchId as 'somneuk' | 'ang'),
          branchId: branchId as 'somneuk' | 'ang',
          supplierId: gSupId,
          supplierName: gSupplier?.name ?? 'ไม่ระบุร้านค้า',
          status: 'ordered',
          createdAt: now,
          orderedAt: now,
          lines,
          receiveBatches: [],
          vatRatePercent: 0,
          billDiscountBaht: 0,
          paymentMode: 'unpaid',
          paymentNote: vendorNotes[gSupId] || undefined,
          expectedDeliveryAt: vendorDelivery[gSupId] || undefined,
          shippingMethod: vendorShipping[gSupId] || undefined,
        })
      }
    }
    const selectedIds = new Set(selectedItems.map((i) => i.productId))
    saveItems(items.filter((i) => !selectedIds.has(i.productId)))
    setSelected(new Set())
    setCreatedCount(groups2.size)
    setTimeout(() => { setCreatedCount(0); onGoToPurchaseOrders?.() }, 2000)
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className={clsx('flex min-h-0 flex-1 flex-col items-center justify-center gap-4 bg-slate-50', className)}>
        <div className="flex size-20 items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white">
          <ShoppingCart className="size-9 text-slate-300" strokeWidth={1} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-500">ตะกร้าว่าง</p>
          <p className="mt-1 text-xs text-slate-400">เพิ่มสินค้าจากหน้า «สั่งซื้อสินค้า»</p>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('relative flex min-h-0 flex-1 overflow-hidden bg-slate-50', className)}>

      {/* ── Main content ── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

        {/* Header */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-3">
          <div className="flex items-center gap-4">
            {/* Select all */}
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleAll}
                className="size-4 accent-emerald-600"
              />
              <span className="text-xs font-semibold text-slate-700">
                เลือกทั้งหมด
              </span>
            </label>

            <span className="text-slate-200">|</span>

            {/* KPIs */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Package className="size-3.5 text-slate-400" />
                <span><span className="font-bold text-slate-700">{items.length}</span> รายการ</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Building2 className="size-3.5 text-slate-400" />
                <span><span className="font-bold text-slate-700">{groups.length}</span> ร้านค้า</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-bold text-slate-700">฿{fmt(grandTotal)}</span>
                <span>รวมทั้งหมด</span>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {unassignedCount > 0 && (
                <button
                  type="button"
                  onClick={autoAssignVendors}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  <Wand2 className="size-3.5" />
                  เลือกร้านค้าอัตโนมัติ
                  <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-black text-white">
                    {unassignedCount}
                  </span>
                </button>
              )}
              {selected.size > 0 && (
                <button
                  type="button"
                  onClick={removeSelected}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                >
                  <Trash2 className="size-3.5" />
                  ลบที่เลือก ({selected.size})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline stepper */}
        <div className="shrink-0 flex items-center gap-0 border-b border-slate-100 bg-white px-5 py-2">
          {([
            { label: 'เลือกสินค้า', sub: 'ค้นหาและเพิ่ม',   done: true,  current: false, action: onGoToCatalog },
            { label: 'ตะกร้า',       sub: 'ยืนยันและสั่งซื้อ', done: false, current: true,  action: undefined },
            { label: 'ใบสั่งซื้อ',   sub: 'ติดตาม · ชำระ',    done: false, current: false, action: onGoToPurchaseOrders },
            { label: 'รับของ',       sub: 'บันทึกรับสินค้า',   done: false, current: false, action: undefined },
          ] as Array<{ label: string; sub: string; done: boolean; current: boolean; action: (() => void) | undefined }>).map((step, i, arr) => (
            <div key={step.label} className="flex items-center">
              {step.action ? (
                <button
                  type="button"
                  onClick={step.action}
                  className={clsx(
                    'flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-slate-50',
                    step.done ? 'cursor-pointer' : 'cursor-pointer',
                  )}
                >
                  <span className={clsx(
                    'flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black',
                    step.done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 text-slate-400',
                  )}>
                    {step.done ? '✓' : i + 1}
                  </span>
                  <span className={clsx(
                    'whitespace-nowrap text-[11px] font-semibold',
                    step.done ? 'text-emerald-700' : 'text-slate-400',
                  )}>{step.label}</span>
                </button>
              ) : (
                <div className={clsx('flex items-center gap-1.5 px-2 py-1', step.current && 'cursor-default')}>
                  <span className={clsx(
                    'flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black',
                    step.current ? 'bg-amber-500 text-white' : 'border-2 border-slate-200 text-slate-300',
                  )}>
                    {i + 1}
                  </span>
                  <span className={clsx(
                    'whitespace-nowrap text-[11px] font-semibold',
                    step.current ? 'text-amber-800' : 'text-slate-300',
                  )}>{step.label}</span>
                </div>
              )}
              {i < arr.length - 1 && (
                <ChevronRight className="mx-0.5 size-3.5 shrink-0 text-slate-200" />
              )}
            </div>
          ))}
        </div>

        {/* Groups */}
        <div className="min-h-0 flex-1 overflow-y-auto space-y-3 p-4">
          {groups.map((group, gi) => {
            const color = group.supplierId
              ? GROUP_COLORS[gi % GROUP_COLORS.length]
              : { border: 'border-slate-200', header: 'bg-slate-50', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', text: 'text-slate-600' }
            const groupTotal = group.items.reduce((s, i) => s + i.qty * i.unitCost, 0)
            const groupSelectedTotal = group.items.filter((i) => selected.has(i.productId)).reduce((s, i) => s + i.qty * i.unitCost, 0)

            return (
              <div key={group.supplierId || '__none__'} className={clsx('overflow-hidden rounded-2xl border bg-white shadow-sm', color.border)}>

                {/* Supplier header */}
                <div className={clsx('px-4 py-3', color.header)}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isGroupSelected(group)}
                      ref={(el) => { if (el) el.indeterminate = isGroupPartial(group) }}
                      onChange={() => toggleGroup(group)}
                      className="size-4 accent-emerald-600"
                    />
                    <div className={clsx('flex size-7 shrink-0 items-center justify-center rounded-xl', color.badge)}>
                      <Building2 className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{group.name}</p>
                      <p className="text-[10px] text-slate-500">{group.items.length} รายการ</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-slate-800">฿{fmt(groupTotal)}</p>
                      {groupSelectedTotal > 0 && groupSelectedTotal !== groupTotal && (
                        <p className={clsx('text-[10px] font-semibold', color.text)}>
                          เลือก ฿{fmt(groupSelectedTotal)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Note + delivery + shipping */}
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-white/80 bg-white/70 px-2.5 py-1.5 shadow-sm">
                      <MessageSquare className="size-3 shrink-0 text-slate-400" />
                      <input
                        type="text"
                        value={vendorNotes[group.supplierId] ?? ''}
                        onChange={(e) => setVendorNotes((n) => ({ ...n, [group.supplierId]: e.target.value }))}
                        placeholder="หมายเหตุ / ข้อความถึงร้านค้า…"
                        className="min-w-0 flex-1 bg-transparent text-[10px] text-slate-700 outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/70 px-2.5 py-1.5 shadow-sm">
                      <CalendarDays className="size-3 shrink-0 text-slate-400" />
                      <span className="text-[9px] font-semibold text-slate-400">นัดรับ</span>
                      <input
                        type="date"
                        value={vendorDelivery[group.supplierId] ?? ''}
                        onChange={(e) => setVendorDelivery((d) => ({ ...d, [group.supplierId]: e.target.value }))}
                        className="bg-transparent text-[10px] text-slate-700 outline-none"
                      />
                      {vendorDelivery[group.supplierId] && (
                        <button type="button" onClick={() => setVendorDelivery((d) => { const n = { ...d }; delete n[group.supplierId]; return n })} className="text-slate-300 hover:text-slate-500">
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/70 px-2.5 py-1.5 shadow-sm">
                      <Truck className="size-3 shrink-0 text-slate-400" />
                      <ShippingCombobox
                        value={vendorShipping[group.supplierId] ?? ''}
                        supplierId={group.supplierId}
                        transportNames={transportNames}
                        onChange={(v) => setVendorShipping((s) => ({ ...s, [group.supplierId]: v }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-[auto_auto_1fr_160px_130px_90px_auto] items-center gap-x-3 border-b border-slate-100 bg-slate-50/60 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  <span />
                  <span />
                  <span>สินค้า</span>
                  <span>ซัพพลายเออร์</span>
                  <span className="text-right">ราคา / หน่วย</span>
                  <span className="text-center">จำนวน</span>
                  <span />
                </div>

                {/* Items */}
                <div className="divide-y divide-slate-50">
                  {group.items.map((item) => {
                    const vendors = productSupplierMap.get(item.productId) ?? []
                    const noHistory = vendors.length === 0
                    const selectedVendorEntry = vendors.find((v) => v.supplierId === item.supplierId)
                    const noPrice = !noHistory && !!item.supplierId && selectedVendorEntry && selectedVendorEntry.lastPrice === 0
                    const lineTotal = item.qty * item.unitCost
                    const isSel = isItemSelected(item.productId)
                    return (
                      <div
                        key={item.productId}
                        className={clsx(
                          'grid grid-cols-[auto_auto_1fr_160px_130px_90px_auto] items-center gap-x-3 px-4 py-3 transition',
                          isSel ? 'bg-emerald-50/50' : 'bg-white hover:bg-slate-50/60',
                        )}
                      >
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleItem(item.productId)}
                          className="size-4 accent-emerald-600"
                        />

                        {/* Product image */}
                        <ProductImage sku={item.sku} size="xs" zoomable />

                        {/* Product info */}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800">{item.name}</p>
                          <p className="font-mono text-[10px] text-slate-400">{item.sku}</p>
                          {item.boxCount && (
                            <span className="inline-block rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700">
                              {item.boxCount} กล่อง
                            </span>
                          )}
                          {lineTotal > 0 && (
                            <p className="mt-0.5 text-[10px] font-bold text-emerald-700">
                              ฿{fmt(lineTotal)}
                            </p>
                          )}
                        </div>

                        {/* Vendor picker */}
                        <VendorCombobox
                          productId={item.productId}
                          supplierId={item.supplierId}
                          supplierName={item.supplierName}
                          options={[
                            ...vendors.map((v) => ({ id: v.supplierId, name: supplierMap.get(v.supplierId)?.name ?? v.supplierId, lastPrice: v.lastPrice, isKnown: true })).filter((v) => v.name !== v.id),
                            ...suppliers.filter((s) => !vendors.find((v) => v.supplierId === s.id)).map((s) => ({ id: s.id, name: s.name, isKnown: false })),
                          ]}
                          noHistory={noHistory}
                          noPrice={!!noPrice}
                          onChange={(patch) => updateItem(item.productId, patch)}
                        />

                        {/* Unit price */}
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[10px] text-slate-400">฿</span>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitCost || ''}
                            placeholder="0"
                            onChange={(e) => updateItem(item.productId, { unitCost: Math.max(0, Number(e.target.value) || 0) })}
                            className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs font-mono outline-none focus:border-emerald-400"
                          />
                        </div>

                        {/* Qty */}
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => item.qty > 1 ? updateItem(item.productId, { qty: item.qty - 1 }) : removeItem(item.productId)}
                            className="flex size-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-100"
                          >
                            <Minus className="size-3" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => updateItem(item.productId, { qty: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                            className="w-10 rounded-lg border border-slate-200 bg-white py-1 text-center text-xs font-mono outline-none focus:border-emerald-400"
                          />
                          <button
                            type="button"
                            onClick={() => updateItem(item.productId, { qty: item.qty + 1 })}
                            className="flex size-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-100"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="rounded-lg p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Summary sidebar ── */}
      <div className="flex w-64 shrink-0 flex-col border-l border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-bold text-slate-800">สรุปรายการ</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-2">
          {selected.size === 0 ? (
            <p className="text-center text-[11px] text-slate-400 mt-4">ยังไม่ได้เลือกรายการ</p>
          ) : (
            groups.map((group, gi) => {
              const selectedInGroup = group.items.filter((i) => selected.has(i.productId))
              if (selectedInGroup.length === 0) return null
              const color = group.supplierId
                ? GROUP_COLORS[gi % GROUP_COLORS.length]
                : { border: 'border-slate-200', header: 'bg-slate-50', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', text: 'text-slate-600' }
              const groupTotal = selectedInGroup.reduce((s, i) => s + i.qty * i.unitCost, 0)
              const groupQty = selectedInGroup.reduce((s, i) => s + i.qty, 0)

              return (
                <div key={group.supplierId || '__none__'} className={clsx('rounded-xl border p-3', color.border)}>
                  <div className="flex items-start gap-2">
                    <span className={clsx('mt-0.5 size-2 shrink-0 rounded-full', color.dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-slate-700">{group.name}</p>
                      <p className="text-[10px] text-slate-400">{selectedInGroup.length} รายการ · {groupQty} ชิ้น</p>
                    </div>
                  </div>
                  <p className={clsx('mt-1.5 text-right text-sm font-black', color.text)}>฿{fmt(groupTotal)}</p>
                </div>
              )
            })
          )}
        </div>

        {/* Totals + create PO */}
        <div className="shrink-0 border-t border-slate-200 p-4 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>รายการทั้งหมด</span>
              <span className="font-semibold text-slate-700">{items.length} รายการ</span>
            </div>
            {selected.size > 0 && selected.size < items.length && (
              <div className="flex items-center justify-between text-xs text-emerald-600">
                <span>ที่เลือก ({selected.size})</span>
                <span className="font-bold">฿{fmt(selectedTotal)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
              <span className="text-xs font-semibold text-slate-600">ยอดรวม</span>
              <span className="text-xl font-black text-slate-900">฿{fmt(grandTotal)}</span>
            </div>
          </div>

          {selectedGroupCount > 1 && (
            <p className="rounded-xl bg-indigo-50 px-3 py-2 text-center text-[10px] font-semibold text-indigo-700">
              จะสร้าง {selectedGroupCount} ใบสั่งซื้อ แยกตามร้านค้า
            </p>
          )}

          <button
            type="button"
            onClick={() => { toggleAll(); }}
            disabled={isAllSelected}
            className="w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            {isAllSelected ? 'เลือกทั้งหมดแล้ว' : `เลือกทั้งหมด (${items.length})`}
          </button>

          {selectedNoVendor.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
              <p className="font-semibold">ยังไม่ได้เลือกร้านค้า</p>
              <ul className="mt-1 list-disc pl-4 space-y-0.5">
                {selectedNoVendor.map((i) => (
                  <li key={i.productId}>{i.name || i.sku}</li>
                ))}
              </ul>
              <p className="mt-1 text-amber-700">กรุณาเลือกซัพพลายเออร์ก่อนสร้าง PO</p>
            </div>
          )}

          <button
            type="button"
            onClick={createPo}
            disabled={selectedItems.length === 0 || selectedNoVendor.length > 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileText className="size-4" />
            สร้างใบสั่งซื้อ (PO)
          </button>
        </div>
      </div>

      {/* Toast */}
      {createdCount > 0 && (
        <div className="absolute bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm text-white shadow-2xl">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <CheckCircle2 className="size-4" />
          </div>
          <div>
            <p className="font-bold">สร้าง {createdCount} ใบสั่งซื้อแล้ว!</p>
            <p className="text-[11px] text-slate-300">กำลังไปที่ใบสั่งซื้อ (PO)…</p>
          </div>
        </div>
      )}
    </div>
  )
}
