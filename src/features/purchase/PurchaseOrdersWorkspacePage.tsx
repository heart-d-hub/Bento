import { getStoredBranch } from '@/features/auth/authSession'
import { masterSearchExtrasForSku, getProductMasterById, getProductMasterBySku, getProductMasterByBarcode } from '@/features/inventory/data/productMasterData'
import type { InventoryProduct } from '@/features/inventory/data/mockInventory'
import { loadVendorPromotions, saveVendorPromotions } from '@/features/promotions/data/vendorPromotionsStore'
import type { VendorPromotion } from '@/features/promotions/data/promotionTypes'
import { findBestVendorPromoTier, findActiveVendorPromos, findNextVendorPromoTier } from '@/features/promotions/evaluateVendorPromo'
import {
  loadPurchaseOrders,
  savePurchaseOrders,
  PURCHASE_ORDERS_CHANGED_EVENT,
  upsertPurchaseOrder,
  deletePurchaseOrder,
  clearAllPurchaseOrders,
} from '@/features/purchase/data/poStore'
import {
  BOX_RECIPES_CHANGED_EVENT,
  deleteBoxRecipe,
  loadBoxRecipes,
  upsertBoxRecipe,
  seedDemoBoxRecipeIfEmpty,
  type BoxRecipeComponent,
  type BoxRecipeTemplate,
} from '@/features/purchase/data/boxRecipeStore'
import { SupplierProfileModal } from '@/features/purchase/components/SupplierProfileModal'
import {
  getSupplierProfile,
  loadSupplierDirectory,
  supplierPaymentMethodsLabel,
  SUPPLIER_DIRECTORY_CHANGED_EVENT,
} from '@/features/purchase/data/supplierDirectoryStore'
import type { SupplierProfile } from '@/features/purchase/data/supplierDirectoryStore'
import { mergeLinePatchForOrdered, mergeReceivedQtyTotal } from '@/features/purchase/data/poLineEdit'
import type { PurchaseOrder, PurchaseOrderLine, PoReceiveLine, PoPromoGroup, PurchaseOrderStatus, PoVatMode, PoInvoice } from '@/features/purchase/data/poTypes'
import { nextPurchaseOrderNo } from '@/features/purchase/data/poSequence'
import {
  applyMovingAverageCost,
  getLatestUnitCostForPo,
  getOnHandQtyBeforeReceive,
  savePoLastPromo,
  stripVatFromUnitCost,
} from '@/features/purchase/data/poMovingAverage'
import { applySignedReceiveQtyToBranchStock, receiveQtyToBranchStock } from '@/features/purchase/data/poStockReceive'
import { mergeItemsIntoSupplierCatalog } from '@/features/purchase/data/supplierCatalogStore'
import { printPurchaseOrder, type PoOutputMode } from '@/features/purchase/utils/printPurchaseOrder'
import { PoPreviewModal } from '@/features/purchase/components/PoPreviewModal'
import {
  DEBT_REDUCTION_CHANNELS_CHANGED_EVENT,
  loadDebtReductionChannels,
} from '@/features/finance/data/debtReductionChannelsStore'
import { CREDIT_TERMS_CHANGED_EVENT, getSupplierCreditTerms, setSupplierCreditTerms } from '@/features/finance/data/creditTermsStore'
import {
  describeSupplierCreditRule,
  supplierPayDueDate,
  toIsoDateOnly,
} from '@/features/finance/data/supplierPaymentDueDate'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { ProductImage } from '@/features/inventory/components/ProductImage'
import { ShippingCombobox } from '@/features/purchase/components/ShippingCombobox'
import {
  loadTransportDirectory,
  TRANSPORT_DIRECTORY_CHANGED_EVENT,
} from '@/features/transport/data/transportDirectoryStore'
import {
  appendTransportShipmentLog,
  deleteTransportShipmentLog,
  getTransportStats,
  type BoxCount,
} from '@/features/transport/data/transportShipmentLogStore'
import { clsx } from 'clsx'
import {
  ChevronDown,
  ClipboardList,
  Clock,
  Layers,
  PackagePlus,
  Plus,
  Printer,
  Receipt,
  Tag,
  UserPlus,
  Search,
  Store,
  Trash2,
  Truck,
  CheckCircle2,
  FileEdit,
  CircleDollarSign,
  RotateCcw,
  X,
  Package,
  Wallet,
  TrendingUp,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type PurchaseOrdersWorkspacePageProps = {
  className?: string
}

function SkuCombobox({
  value,
  onChange,
  onSelect,
}: {
  value: string
  onChange: (sku: string) => void
  onSelect: (sku: string, name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const hits = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return []
    return getProductMasterList()
      .filter((p) => !p.deletedAt && (p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)))
      .slice(0, 8)
  }, [value])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative w-20">
      <input
        className="w-full rounded border border-slate-200 px-1.5 py-0.5 font-mono text-xs outline-none focus:border-sky-400"
        placeholder="SKU"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => { if (value.trim()) setOpen(true) }}
      />
      {open && hits.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-0.5 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {hits.map((p) => (
            <button key={p.id} type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(p.sku, p.name); setOpen(false) }}
              className="flex w-full flex-col items-start px-2.5 py-1 text-left hover:bg-sky-50">
              <span className="font-mono text-xs font-semibold text-slate-800">{p.sku}</span>
              <span className="truncate text-[10px] text-slate-400">{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function newLineId(): string {
  return `ln-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function newPoId(): string {
  return `po-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function newVendorPromoId(): string {
  return `vp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function sumReceiveBatches(po: PurchaseOrder): number {
  let s = 0
  for (const b of po.receiveBatches) {
    for (const ln of b.lines) {
      s += ln.qty * ln.unitCost
    }
  }
  return Math.round(s * 100) / 100
}

function orderedSubtotal(po: PurchaseOrder): number {
  return Math.round(po.lines.reduce((a, l) => a + l.orderedQty * l.unitCostOrder, 0) * 100) / 100
}

function resolvedVatMode(po: PurchaseOrder): 'none' | 'excluded' | 'included' {
  return po.vatMode ?? 'excluded'
}

/** Ex-VAT base — ราคาก่อน VAT เสมอ (ใช้สำหรับคำนวณ VAT และต้นทุนเฉลี่ย) */
function paymentBase(po: PurchaseOrder): number {
  const raw = (() => { const r = sumReceiveBatches(po); return r > 0 ? r : orderedSubtotal(po) })()
  const mode = resolvedVatMode(po)
  if (mode === 'included' && po.vatRatePercent > 0) {
    return Math.round((raw / (1 + po.vatRatePercent / 100)) * 100) / 100
  }
  return raw
}

function vatAmount(po: PurchaseOrder): number {
  if (resolvedVatMode(po) === 'none') return 0
  const base = paymentBase(po)
  return Math.round((base * po.vatRatePercent) / 100 * 100) / 100
}

/** Ex-VAT cost per unit — ต้นทุนก่อน VAT ต่อหน่วย */
function exVatUnitCost(unitCost: number, po: PurchaseOrder): number {
  const mode = resolvedVatMode(po)
  if (mode === 'included' && po.vatRatePercent > 0) {
    return Math.round((unitCost / (1 + po.vatRatePercent / 100)) * 10000) / 10000
  }
  return unitCost
}

function grandTotal(po: PurchaseOrder): number {
  return Math.round((paymentBase(po) + vatAmount(po) - po.billDiscountBaht) * 100) / 100
}

function parseLocalNoonFromIso(iso: string): Date {
  const part = (iso.split('T')[0] ?? iso).trim()
  const [ys, ms, ds] = part.split('-')
  const y = Number.parseInt(ys ?? '', 10)
  const m = Number.parseInt(ms ?? '', 10)
  const d = Number.parseInt(ds ?? '', 10)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return new Date()
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

/** วันที่อ้างอิงเครดิต: รับของล่าสุด → สั่ง → สร้างร่าง */
function creditAnchorDateForPo(po: PurchaseOrder): Date {
  const last = po.receiveBatches.at(-1)?.at
  if (last) return parseLocalNoonFromIso(last)
  if (po.orderedAt) return parseLocalNoonFromIso(po.orderedAt)
  return parseLocalNoonFromIso(po.createdAt)
}

function lineTotalExpected(l: PurchaseOrderLine): number {
  const paid = l.bonusPaidQty ?? 0
  const free = l.bonusFreeQty ?? 0
  const freeUnits = paid > 0 ? Math.floor(l.orderedQty / paid) * free : 0
  return l.orderedQty + freeUnits
}

function lineBackorder(l: PurchaseOrderLine): number {
  return Math.max(0, lineTotalExpected(l) - l.receivedQtyTotal)
}

function lineShortageTotal(po: PurchaseOrder, lineId: string): number {
  return po.receiveBatches.reduce((s, b) => {
    const ln = b.lines.find((x) => x.lineId === lineId)
    return s + (ln?.shortageQty ?? 0)
  }, 0)
}

function statusLabel(po: PurchaseOrder): string {
  if (po.status === 'draft') return 'Draft'
  if (po.status === 'closed') return 'ปิดแล้ว'
  const bo = po.lines.some((l) => lineBackorder(l) > 0)
  if (bo && po.receiveBatches.length > 0) return 'Ordered · ค้างรับ'
  return 'Ordered'
}

// ── Cascade discount helpers ──────────────────────────────────────────────────

function parseChain(s: string): number[] {
  return s.split('+').map((t) => Number.parseFloat(t.trim())).filter((n) => n > 0 && n < 100)
}

function applyChain(price: number, chain: string): number {
  return parseChain(chain).reduce((p, d) => p * (1 - d / 100), price)
}

function effectivePct(chain: string): number {
  const steps = parseChain(chain)
  if (steps.length === 0) return 0
  const multiplier = steps.reduce((m, d) => m * (1 - d / 100), 1)
  return Math.round((1 - multiplier) * 10000) / 100
}

// ── Per-line promo calculation ────────────────────────────────────────────────

function calcPromo(line: PurchaseOrderLine) {
  const list = (line.listPrice ?? 0) > 0 ? line.listPrice! : line.unitCostOrder
  const afterDiscount = line.discountChain ? applyChain(list, line.discountChain) : list
  let freeUnits = 0
  if ((line.bonusPct ?? 0) > 0) {
    freeUnits = Math.floor(line.orderedQty * line.bonusPct! / 100)
  } else {
    const paidScheme = line.bonusPaidQty ?? 0
    const freeScheme = line.bonusFreeQty ?? 0
    freeUnits = paidScheme > 0 ? Math.floor(line.orderedQty / paidScheme) * freeScheme : 0
  }
  const totalPaid = line.orderedQty * afterDiscount
  const totalUnits = line.orderedQty + freeUnits
  const trueCost = totalUnits > 0
    ? Math.round((totalPaid / totalUnits) * 10000) / 10000
    : Math.round(afterDiscount * 10000) / 10000
  return { list, afterDiscount: Math.round(afterDiscount * 10000) / 10000, freeUnits, totalPaid, trueCost }
}

function hasPromo(line: PurchaseOrderLine): boolean {
  return (line.listPrice ?? 0) > 0 || !!line.discountChain || (line.bonusFreeQty ?? 0) > 0 || (line.bonusPct ?? 0) > 0
}

function calcEffectiveCost(
  listPrice: number | undefined,
  discountChain: string | undefined,
  bonusPaidQty: number | undefined,
  bonusFreeQty: number | undefined,
  orderedQty: number,
  fallback: number,
  bonusPct?: number,
): number {
  const list = (listPrice ?? 0) > 0 ? listPrice! : fallback
  const afterDiscount = discountChain ? applyChain(list, discountChain) : list
  let freeUnits = 0
  if ((bonusPct ?? 0) > 0) {
    freeUnits = Math.floor(orderedQty * bonusPct! / 100)
  } else {
    const paid = bonusPaidQty ?? 0
    const free = bonusFreeQty ?? 0
    freeUnits = paid > 0 ? Math.floor(orderedQty / paid) * free : 0
  }
  const totalUnits = orderedQty + freeUnits
  const trueCost = totalUnits > 0
    ? Math.round((orderedQty * afterDiscount / totalUnits) * 10000) / 10000
    : Math.round(afterDiscount * 10000) / 10000
  return trueCost
}

// ── Mix-match promo group calculation ────────────────────────────────────────

function calcPromoGroup(
  group: PoPromoGroup,
  lines: PurchaseOrderLine[],
): Map<string, { freeCount: number; effectiveCost: number; savings: number }> {
  const groupLines = lines.filter((l) => group.lineIds.includes(l.lineId))
  const totalQty = groupLines.reduce((s, l) => s + l.orderedQty, 0)
  const freeEligible = totalQty >= group.buyQty ? group.freeQty : 0

  // Expand all units sorted cheapest first
  const allUnits: { lineId: string; price: number }[] = []
  for (const l of groupLines) {
    for (let i = 0; i < l.orderedQty; i++) {
      allUnits.push({ lineId: l.lineId, price: l.unitCostOrder })
    }
  }
  allUnits.sort((a, b) => a.price - b.price)

  const freeByLine = new Map<string, number>()
  for (let i = 0; i < Math.min(freeEligible, allUnits.length); i++) {
    const id = allUnits[i]!.lineId
    freeByLine.set(id, (freeByLine.get(id) ?? 0) + 1)
  }

  const result = new Map<string, { freeCount: number; effectiveCost: number; savings: number }>()
  for (const l of groupLines) {
    const free = freeByLine.get(l.lineId) ?? 0
    const paid = l.orderedQty - free
    const totalPaid = paid * l.unitCostOrder
    const effectiveCost = l.orderedQty > 0 ? Math.round((totalPaid / l.orderedQty) * 10000) / 10000 : l.unitCostOrder
    const savings = free * l.unitCostOrder
    result.set(l.lineId, { freeCount: free, effectiveCost, savings })
  }
  return result
}

function searchProducts(q: string): InventoryProduct[] {
  const t = q.trim().toLowerCase()
  if (!t) return []
  const cat = getPosCatalogProducts()
  const out: InventoryProduct[] = []
  for (const p of cat) {
    const extra = masterSearchExtrasForSku(p.sku).toLowerCase()
    if (
      p.sku.toLowerCase().includes(t) ||
      p.name.toLowerCase().includes(t) ||
      (p.factoryOem && p.factoryOem.toLowerCase().includes(t)) ||
      (p.genuineNo && p.genuineNo.toLowerCase().includes(t)) ||
      (p.barcodes ?? []).some((b) => b.code.toLowerCase().includes(t)) ||
      extra.includes(t)
    ) {
      out.push(p)
      if (out.length >= 50) break
    }
  }
  return out
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

export function PurchaseOrdersWorkspacePage({ className }: PurchaseOrdersWorkspacePageProps) {
  const branch = getStoredBranch()
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => loadPurchaseOrders())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [vendorPromos, setVendorPromos] = useState<VendorPromotion[]>(() => loadVendorPromotions())
  const [vendorPromoDraft, setVendorPromoDraft] = useState<VendorPromotion | null>(null)
  const [vendorPromoOpen, setVendorPromoOpen] = useState(false)
  const [productQuery, setProductQuery] = useState('')
  const [boxRecipes, setBoxRecipes] = useState<BoxRecipeTemplate[]>(() => loadBoxRecipes())
  /** lineId → จำนวนกล่องที่จะเพิ่มจากสูตร */
  const [boxRecipeQtys, setBoxRecipeQtys] = useState<Record<string, string>>({})
  const [boxRecipePanelOpen, setBoxRecipePanelOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<BoxRecipeTemplate | null>(null)
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [inlineReceive, setInlineReceive] = useState(false)
  const [receiveDraft, setReceiveDraft] = useState<Record<string, { qty: string; cost: string; shortage: string; shortageReason: string }>>({})
  const [rcvExtraLines, setRcvExtraLines] = useState<Array<{ id: string; productId: string; sku: string; name: string; qty: string; cost: string }>>([])
  const [rcvExtraQuery, setRcvExtraQuery] = useState('')
  const [rcvShippingCost, setRcvShippingCost] = useState('')
  const [rcvNotes, setRcvNotes] = useState('')
  const [rcvTransportId, setRcvTransportId] = useState('')
  const [rcvBoxes, setRcvBoxes] = useState<BoxCount>({})
  const [rcvDamagedBoxes, setRcvDamagedBoxes] = useState<BoxCount>({})
  const [rcvScanInput, setRcvScanInput] = useState('')
  const [rcvScanError, setRcvScanError] = useState('')
  /** lineId → จำนวนกล่อง (ผู้ใช้กรอก) สำหรับสินค้าที่มี piecesPerBox */
  const [rcvLineBoxes, setRcvLineBoxes] = useState<Record<string, string>>({})
  /** recipeId → จำนวนกล่อง สำหรับ box recipe ในฝั่งรับของ */
  const [rcvRecipeBoxes, setRcvRecipeBoxes] = useState<Record<string, string>>({})

  // ── Receive invoice rows (multi-bill support) ──────────────────────────────
  type RcvInvoiceRow = { id: string; invoiceNo: string; invoiceDate: string; totalBaht: string }
  const [rcvInvoiceRows, setRcvInvoiceRows] = useState<RcvInvoiceRow[]>([])

  // ── Legacy single-invoice states (used by old modal fallback only) ──────────
  const [rcvInvoiceNo, setRcvInvoiceNo] = useState('')
  const [rcvInvoiceDate, setRcvInvoiceDate] = useState('')
  const [rcvBeforeVat, setRcvBeforeVat] = useState('')
  const [rcvVat, setRcvVat] = useState('')
  const [rcvTotal, setRcvTotal] = useState('')

  // ── Standalone invoice add form ────────────────────────────────────────────
  type InvFormState = { invoiceNo: string; invoiceDate: string; receiveBatchId: string; beforeVatBaht: string; vatBaht: string; totalBaht: string; notes: string }
  const emptyInvForm = (): InvFormState => {
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { invoiceNo: '', invoiceDate: today, receiveBatchId: '', beforeVatBaht: '', vatBaht: '', totalBaht: '', notes: '' }
  }
  const [invFormOpen, setInvFormOpen] = useState(false)
  const [invForm, setInvForm] = useState<InvFormState>(emptyInvForm)

  const [expandedPromo, setExpandedPromo] = useState<Set<string>>(new Set())
  const [filterText, setFilterText] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | PurchaseOrderStatus | 'paid' | 'receiving'>('all')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false)
  const [supplierDropdownSearch, setSupplierDropdownSearch] = useState('')

  function handleClearAllPo() {
    if (!window.confirm('ล้างข้อมูล PO ทั้งหมด? (ไม่สามารถกู้คืนได้)')) return
    savePurchaseOrders([])
    localStorage.removeItem('bento.purchase.poSeq.v1')
    localStorage.removeItem('bento.purchase.catalogCart.v1')
    setSelected(null)
  }

  const togglePromo = (lineId: string) => {
    const isOpen = expandedPromo.has(lineId)
    if (isOpen && selected) {
      const line = selected.lines.find((l) => l.lineId === lineId)
      if (line) {
        savePoLastPromo(line.productId, line.listPrice, line.discountChain, line.bonusPaidQty, line.bonusFreeQty, line.bonusPct)
      }
    }
    setExpandedPromo((prev) => {
      const n = new Set(prev)
      n.has(lineId) ? n.delete(lineId) : n.add(lineId)
      return n
    })
  }

  const refresh = useCallback(() => setOrders(loadPurchaseOrders()), [])

  useEffect(() => {
    const on = () => refresh()
    window.addEventListener(PURCHASE_ORDERS_CHANGED_EVENT, on)
    return () => window.removeEventListener(PURCHASE_ORDERS_CHANGED_EVENT, on)
  }, [refresh])

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId],
  )

  const [creditTick, setCreditTick] = useState(0)
  const [supplierDirTick, setSupplierDirTick] = useState(0)
  const [debtChannelsTick, setDebtChannelsTick] = useState(0)
  const [creditEditOpen, setCreditEditOpen] = useState(false)
  const [creditEditDays, setCreditEditDays] = useState('')
  const [creditEditCutoff, setCreditEditCutoff] = useState('')
  const [creditEditExclude, setCreditEditExclude] = useState(true)
  const [creditEditEndOfMonth, setCreditEditEndOfMonth] = useState(true)

  const [supplierModal, setSupplierModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    profile: SupplierProfile | null
  }>({ open: false, mode: 'create', profile: null })

  useEffect(() => {
    const on = () => setCreditTick((n) => n + 1)
    window.addEventListener(CREDIT_TERMS_CHANGED_EVENT, on)
    return () => window.removeEventListener(CREDIT_TERMS_CHANGED_EVENT, on)
  }, [])

  useEffect(() => {
    const on = () => setSupplierDirTick((n) => n + 1)
    window.addEventListener(SUPPLIER_DIRECTORY_CHANGED_EVENT, on)
    return () => window.removeEventListener(SUPPLIER_DIRECTORY_CHANGED_EVENT, on)
  }, [])

  useEffect(() => {
    const on = () => setDebtChannelsTick((n) => n + 1)
    window.addEventListener(DEBT_REDUCTION_CHANNELS_CHANGED_EVENT, on)
    return () => window.removeEventListener(DEBT_REDUCTION_CHANNELS_CHANGED_EVENT, on)
  }, [])

  useEffect(() => {
    seedDemoBoxRecipeIfEmpty()
    const on = () => setBoxRecipes(loadBoxRecipes())
    window.addEventListener(BOX_RECIPES_CHANGED_EVENT, on)
    return () => window.removeEventListener(BOX_RECIPES_CHANGED_EVENT, on)
  }, [])

  const [transportDirectory, setTransportDirectory] = useState(() => loadTransportDirectory())
  const transportNames = transportDirectory.map((t) => t.name)
  useEffect(() => {
    const handler = () => setTransportDirectory(loadTransportDirectory())
    window.addEventListener(TRANSPORT_DIRECTORY_CHANGED_EVENT, handler)
    return () => window.removeEventListener(TRANSPORT_DIRECTORY_CHANGED_EVENT, handler)
  }, [])

  const suppliers = useMemo(() => loadSupplierDirectory(), [supplierDirTick])

  // Auto-apply supplier's priceListVatMode to new POs (no receives yet)
  useEffect(() => {
    if (!selected || selected.status !== 'ordered' || selected.receiveBatches.length > 0) return
    const prof = suppliers.find((s) => s.id === selected.supplierId)
    if (!prof?.priceListVatMode) return
    const desired: PoVatMode =
      prof.priceListVatMode === 'vat_included' ? 'included' :
      prof.priceListVatMode === 'no_vat'       ? 'none'     : 'excluded'
    if ((selected.vatMode ?? 'excluded') !== desired) {
      upsertPurchaseOrder({ ...selected, vatMode: desired })
      refresh()
    }
  }, [selected?.id, selected?.supplierId, selected?.status])

  const debtReductionChannels = useMemo(() => loadDebtReductionChannels(), [debtChannelsTick])

  const payableDuePreview = useMemo(() => {
    if (!selected || selected.paymentMode !== 'payable') return null
    const anchor = creditAnchorDateForPo(selected)
    const terms = getSupplierCreditTerms(selected.supplierId)
    const due = supplierPayDueDate(anchor, terms)
    return {
      anchor,
      due,
      terms,
      anchorLabel: selected.receiveBatches.length ? 'วันรับของล่าสุด' : 'วันสั่งซื้อ',
    }
  }, [selected, creditTick])

  const searchHits = useMemo(() => searchProducts(productQuery), [productQuery])

  const supplierOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const o of orders) {
      if (o.supplierId && !map.has(o.supplierId)) map.set(o.supplierId, o.supplierName || o.supplierId)
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'th'))
  }, [orders])

  const isPaidOrder = (o: PurchaseOrder) =>
    (o.paymentMode === 'paid_cash' || o.paymentMode === 'paid_transfer' || o.paymentMode === 'payable') && !!o.paidAt

  const filteredOrders = useMemo(() => {
    const t = filterText.trim().toLowerCase()
    return orders
      .filter((o) => {
        if (filterStatus === 'all') { if (o.status === 'closed') return false }
        else if (filterStatus === 'paid') { if (!isPaidOrder(o) || o.receiveBatches.length > 0) return false }
        else if (filterStatus === 'ordered') { if (o.status !== 'ordered' || isPaidOrder(o)) return false }
        else if (filterStatus === 'receiving') { if (o.receiveBatches.length === 0 || o.status === 'closed') return false }
        else if (filterStatus !== 'all' && o.status !== filterStatus) return false
        if (filterSupplier && o.supplierId !== filterSupplier) return false
        if (t) return o.poNo.toLowerCase().includes(t) || o.supplierName.toLowerCase().includes(t)
        return true
      })
      .sort((a, b) => {
        const ta = new Date(a.orderedAt ?? a.createdAt).getTime()
        const tb = new Date(b.orderedAt ?? b.createdAt).getTime()
        return tb - ta
      })
  }, [orders, filterText, filterStatus, filterSupplier])

  // base for status-tab counts: supplier + text filters only, no status filter
  const ordersForStatusCount = useMemo(() => {
    const t = filterText.trim().toLowerCase()
    return orders.filter((o) => {
      if (filterSupplier && o.supplierId !== filterSupplier) return false
      if (t) return o.poNo.toLowerCase().includes(t) || o.supplierName.toLowerCase().includes(t)
      return true
    })
  }, [orders, filterText, filterSupplier])

  const createNewPo = () => {
    if (!branch) return
    const list = loadSupplierDirectory()
    const first = list[0]
    if (!first) {
      window.alert('ยังไม่มีผู้จัดจำหน่ายในระบบ — กด «เพิ่มผู้จัดจำหน่าย» ก่อน')
      return
    }
    const vatMode: PoVatMode =
      first.priceListVatMode === 'vat_included' ? 'included' :
      first.priceListVatMode === 'no_vat'       ? 'none'     : 'excluded'
    const now = new Date().toISOString()
    const po: PurchaseOrder = {
      id: newPoId(),
      poNo: nextPurchaseOrderNo(branch.id),
      branchId: branch.id,
      supplierId: first.id,
      supplierName: first.name,
      status: 'ordered',
      createdAt: now,
      orderedAt: now,
      lines: [],
      receiveBatches: [],
      vatRatePercent: 7,
      billDiscountBaht: 0,
      paymentMode: 'unpaid',
      vatMode,
    }
    upsertPurchaseOrder(po)
    refresh()
    setSelectedId(po.id)
  }

  const updateSelected = (next: PurchaseOrder) => {
    upsertPurchaseOrder(next)
    refresh()
  }

  const addLine = (p: InventoryProduct) => {
    if (!selected || selected.status === 'closed' || selected.receiveBatches.length > 0) return
    if (selected.lines.some((l) => l.productId === p.id)) return
    const unit = getLatestUnitCostForPo(p)
    const master = getProductMasterBySku(p.sku)
    const ppb = master?.piecesPerBox
    // Auto-apply supplier's default discount for this brand
    const supplier = suppliers.find((s) => s.id === selected.supplierId)
    const brand = master?.brand ?? p.brand ?? ''
    const defaultDiscount = supplier?.defaultDiscountByBrand?.find(
      (d) => d.brand.trim().toLowerCase() === brand.trim().toLowerCase(),
    )
    const orderedQty = ppb ?? 1
    let listPrice: number | undefined = undefined
    let discountChain: string | undefined = undefined
    let unitCostOrder = unit
    if (defaultDiscount && defaultDiscount.discountChain) {
      const list = (master?.supplierListPrice ?? 0) > 0 ? master!.supplierListPrice! : unit
      if (list > 0) {
        listPrice = list
        discountChain = defaultDiscount.discountChain
        unitCostOrder = calcEffectiveCost(listPrice, discountChain, undefined, undefined, orderedQty, unit)
      }
    }
    const line: PurchaseOrderLine = {
      lineId: newLineId(),
      productId: p.id,
      sku: p.sku,
      name: p.name,
      orderedQty,
      ...(ppb ? { orderBoxCount: 1 } : {}),
      unitCostOrder,
      receivedQtyTotal: 0,
      ...(listPrice !== undefined ? { listPrice } : {}),
      ...(discountChain ? { discountChain } : {}),
    }
    updateSelected({ ...selected, lines: [...selected.lines, line] })
    setProductQuery('')
  }

  const addFromBoxRecipe = (template: BoxRecipeTemplate, boxCount: number) => {
    if (!selected || selected.status !== 'draft' || boxCount < 1) return
    const allProducts = getPosCatalogProducts()
    let lines = [...selected.lines]
    for (const comp of template.components) {
      const qty = Math.round(comp.qtyPerBox * boxCount)
      if (qty <= 0) continue
      const p = allProducts.find((x) => x.sku.trim().toLowerCase() === comp.sku.trim().toLowerCase())
      if (!p) continue
      const existing = lines.findIndex((l) => l.productId === p.id)
      if (existing >= 0) {
        // SET quantity (not add) — so re-entering box count replaces the previous value
        lines = lines.map((l, i) => i === existing ? { ...l, orderedQty: qty, orderBoxCount: boxCount } : l)
      } else {
        const unit = getLatestUnitCostForPo(p)
        lines.push({ lineId: newLineId(), productId: p.id, sku: p.sku, name: p.name, orderedQty: qty, orderBoxCount: boxCount, unitCostOrder: unit, receivedQtyTotal: 0 })
      }
    }
    updateSelected({ ...selected, lines })
  }

  const applyRcvBoxRecipe = (template: BoxRecipeTemplate, boxCount: number) => {
    if (!selected || boxCount < 1) return
    setReceiveDraft((prev) => {
      const next = { ...prev }
      for (const comp of template.components) {
        const qty = Math.round(comp.qtyPerBox * boxCount)
        if (qty <= 0) continue
        const line = selected.lines.find((l) => l.sku.trim().toLowerCase() === comp.sku.trim().toLowerCase())
        if (!line) continue
        const cur = next[line.lineId] ?? { qty: '', cost: String(line.unitCostOrder), shortage: '', shortageReason: '' }
        const existing = Number.parseFloat(cur.qty) || 0
        next[line.lineId] = { ...cur, qty: String(existing + qty) }
      }
      return next
    })
  }

  const patchLine = (lineId: string, patch: Partial<PurchaseOrderLine>) => {
    if (!selected) return
    if (selected.status === 'ordered' && selected.receiveBatches.length === 0) {
      updateSelected({
        ...selected,
        lines: selected.lines.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l)),
      })
      return
    }
    if (selected.status !== 'ordered' && selected.status !== 'closed') return
    const line = selected.lines.find((l) => l.lineId === lineId)
    if (!line) return
    // Promo fields are always allowed on ordered POs
    const promoFields: Partial<PurchaseOrderLine> = {}
    if ('listPrice'     in patch) promoFields.listPrice     = patch.listPrice
    if ('discountChain' in patch) promoFields.discountChain = patch.discountChain
    if ('bonusPaidQty'  in patch) promoFields.bonusPaidQty  = patch.bonusPaidQty
    if ('bonusFreeQty'  in patch) promoFields.bonusFreeQty  = patch.bonusFreeQty
    if ('bonusPct'      in patch) promoFields.bonusPct      = patch.bonusPct
    const onlyQtyCost: Partial<Pick<PurchaseOrderLine, 'orderedQty' | 'unitCostOrder' | 'orderBoxCount'>> = {}
    if ('orderedQty'    in patch) onlyQtyCost.orderedQty    = patch.orderedQty
    if ('unitCostOrder' in patch) onlyQtyCost.unitCostOrder  = patch.unitCostOrder
    if ('orderBoxCount' in patch) onlyQtyCost.orderBoxCount  = patch.orderBoxCount
    if (Object.keys(onlyQtyCost).length > 0) {
      const result = mergeLinePatchForOrdered(line, onlyQtyCost)
      if (!result.ok) { window.alert(result.message); return }
      updateSelected({
        ...selected,
        lines: selected.lines.map((l) => (l.lineId === lineId ? { ...result.line, ...promoFields } : l)),
      })
    } else if (Object.keys(promoFields).length > 0) {
      updateSelected({
        ...selected,
        lines: selected.lines.map((l) => (l.lineId === lineId ? { ...l, ...promoFields } : l)),
      })
    }
  }

  const patchReceivedTotal = (lineId: string, raw: number) => {
    if (!selected || (selected.status !== 'ordered' && selected.status !== 'closed')) return
    const line = selected.lines.find((l) => l.lineId === lineId)
    if (!line) return
    const result = mergeReceivedQtyTotal(line, raw)
    if (!result.ok) {
      window.alert(result.message)
      return
    }
    if (Math.abs(result.delta) < 1e-9) return
    try {
      applySignedReceiveQtyToBranchStock(line.productId, result.delta)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'ปรับสต็อกไม่สำเร็จ')
      return
    }
    const nextLines = selected.lines.map((l) => (l.lineId === lineId ? result.line : l))
    const afterAllReceived = nextLines.every((l) => l.receivedQtyTotal + 1e-9 >= lineTotalExpected(l))
    updateSelected({
      ...selected,
      lines: nextLines,
      ...(!afterAllReceived ? { status: 'ordered' as const, closedAt: undefined } : {}),
    })
  }

  const removeLine = (lineId: string) => {
    if (!selected || selected.status === 'closed' || selected.receiveBatches.length > 0) return
    updateSelected({ ...selected, lines: selected.lines.filter((l) => l.lineId !== lineId) })
  }


  const openReceive = () => {
    if (!selected || selected.status !== 'ordered') return
    if (!selected.paidAt) {
      window.alert('ไม่สามารถรับสินค้าได้\n\nต้องบันทึกการชำระเงินก่อนรับสินค้าทุกครั้ง\n\n(ไปที่แถบ «ชำระ / ใบกำกับ»)')
      setPoTab('payment')
      return
    }
    const draft: Record<string, { qty: string; cost: string; shortage: string; shortageReason: string }> = {}
    for (const l of selected.lines) {
      const remain = lineBackorder(l)
      draft[l.lineId] = { qty: remain > 0 ? String(remain) : '', cost: String(l.unitCostOrder), shortage: '', shortageReason: '' }
    }
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    setReceiveDraft(draft)
    setRcvInvoiceRows([{ id: `ir-${Date.now()}`, invoiceNo: '', invoiceDate: today, totalBaht: '' }])
    setRcvExtraLines([])
    setRcvExtraQuery('')
    setRcvShippingCost('')
    setRcvNotes('')
    setRcvTransportId('')
    setRcvBoxes({})
    setRcvDamagedBoxes({})
    setRcvScanInput('')
    setRcvScanError('')
    setRcvLineBoxes({})
    setRcvRecipeBoxes({})
    setInlineReceive(true)
    setPoTab('items')
  }

  const handleBarcodeScan = (raw: string) => {
    if (!selected) return
    const code = raw.trim()
    if (!code) return

    const hit = getProductMasterByBarcode(code)
    if (!hit) {
      setRcvScanError(`ไม่พบบาร์โค้ด "${code}"`)
      setRcvScanInput('')
      return
    }
    setRcvScanError('')

    const { product, qtyPerScan } = hit

    // Auto-increment box count if barcode has a boxSize
    const matchedBarcode = product.barcodes?.find((b) => b.code.trim().toLowerCase() === code.toLowerCase())
    if (matchedBarcode?.boxSize) {
      setRcvBoxes((prev) => ({ ...prev, [matchedBarcode.boxSize!]: (prev[matchedBarcode.boxSize!] ?? 0) + 1 }))
    }

    // Find matching PO line and increment its qty
    const poLine = selected.lines.find((l) => l.productId === product.id || l.sku.toLowerCase() === product.sku.toLowerCase())
    if (poLine) {
      setReceiveDraft((prev) => {
        const cur = prev[poLine.lineId] ?? { qty: '', cost: String(poLine.unitCostOrder), shortage: '', shortageReason: '' }
        const currentQty = Number.parseFloat(cur.qty.replace(/,/g, '')) || 0
        return { ...prev, [poLine.lineId]: { ...cur, qty: String(currentQty + qtyPerScan) } }
      })
    } else {
      // Not in PO — add to extra lines or increment existing
      setRcvExtraLines((prev) => {
        const existing = prev.find((l) => l.productId === product.id)
        if (existing) {
          return prev.map((l) => l.id === existing.id
            ? { ...l, qty: String((Number.parseFloat(l.qty.replace(/,/g, '')) || 0) + qtyPerScan) }
            : l)
        }
        return [...prev, {
          id: `el-${Date.now()}`,
          productId: product.id,
          sku: product.sku,
          name: product.name,
          qty: String(qtyPerScan),
          cost: String(product.avgCost ?? product.costPrice ?? 0),
        }]
      })
    }

    setRcvScanInput('')
  }

  const submitReceive = () => {
    if (!selected || selected.status !== 'ordered') return

    // Regular PO lines
    const lines: PoReceiveLine[] = []
    for (const l of selected.lines) {
      const d = receiveDraft[l.lineId]
      if (!d) continue
      const qty = Number.parseFloat(d.qty.replace(/,/g, '')) || 0
      const unitCost = Number.parseFloat(d.cost.replace(/,/g, '')) || 0
      const shortageQty = Number.parseFloat((d.shortage ?? '').replace(/,/g, '')) || 0
      if (qty <= 0 && shortageQty <= 0) continue
      lines.push({
        lineId: l.lineId, qty, unitCost,
        ...(shortageQty > 0 ? { shortageQty } : {}),
        ...(shortageQty > 0 && d.shortageReason ? { shortageReason: d.shortageReason } : {}),
      })
    }

    // Extra lines — vendor sent items not on the PO
    const extraPoLines: PurchaseOrderLine[] = []
    const extraReceiveLines: PoReceiveLine[] = []
    for (const ex of rcvExtraLines) {
      const qty = Number.parseFloat(ex.qty.replace(/,/g, '')) || 0
      const unitCost = Number.parseFloat(ex.cost.replace(/,/g, '')) || 0
      if (qty <= 0) continue
      const lineId = newLineId()
      extraPoLines.push({ lineId, productId: ex.productId, sku: ex.sku, name: ex.name, orderedQty: qty, unitCostOrder: unitCost, receivedQtyTotal: 0 })
      extraReceiveLines.push({ lineId, qty, unitCost })
    }

    if (!lines.length && !extraReceiveLines.length) {
      window.alert('กรอกจำนวนรับ หรือจำนวนขาด/เสียหาย อย่างน้อย 1 แถว')
      return
    }

    // Auto-inject receive bonus lines from product rules (e.g. ซื้อ 6+1L แถม 1L ฟรี)
    const bonusLineIds = new Set<string>()
    for (const hit of lines) {
      const poLine = selected.lines.find((l) => l.lineId === hit.lineId)
      if (!poLine || hit.qty <= 0) continue
      const master = getProductMasterBySku(poLine.sku)
      for (const rule of master?.receiveBonusRules ?? []) {
        const bonusQty = Math.floor(hit.qty * rule.bonusQtyPerUnit)
        if (bonusQty <= 0) continue
        const bonusMaster = getProductMasterBySku(rule.bonusSku)
        if (!bonusMaster) continue
        const bonusLineId = `bonus-${rule.id}-${poLine.lineId}`
        bonusLineIds.add(bonusLineId)
        extraPoLines.push({
          lineId: bonusLineId,
          productId: bonusMaster.id,
          sku: bonusMaster.sku,
          name: `${bonusMaster.name} (แถม)`,
          orderedQty: bonusQty,
          unitCostOrder: 0,
          receivedQtyTotal: 0,
        })
        extraReceiveLines.push({ lineId: bonusLineId, qty: bonusQty, unitCost: 0 })
      }
    }

    const nextLines = selected.lines.map((l) => {
      const hit = lines.find((x) => x.lineId === l.lineId)
      if (!hit) return l
      return { ...l, receivedQtyTotal: l.receivedQtyTotal + hit.qty }
    })
    const finalLines = [
      ...nextLines,
      ...extraPoLines.map((l, i) => ({ ...l, receivedQtyTotal: extraReceiveLines[i]!.qty })),
    ]

    const allPoLines = [...selected.lines, ...extraPoLines]
    const allReceiveLines = [...lines, ...extraReceiveLines]

    // Landed cost: ex-VAT cost per line value, then add shipping pro-rata by value
    const shippingCost = Number.parseFloat(rcvShippingCost.replace(/,/g, '')) || 0
    const byProductWithCost = new Map<string, { qty: number; value: number }>()
    for (const hit of allReceiveLines) {
      if (bonusLineIds.has(hit.lineId)) continue  // bonus lines handled separately below
      const row = allPoLines.find((x) => x.lineId === hit.lineId)
      if (!row) continue
      const exVatCost = stripVatFromUnitCost(hit.unitCost, selected.vatMode, selected.vatRatePercent)
      const cur = byProductWithCost.get(row.productId) ?? { qty: 0, value: 0 }
      byProductWithCost.set(row.productId, { qty: cur.qty + hit.qty, value: cur.value + hit.qty * exVatCost })
    }

    const cat = getPosCatalogProducts()

    // Total value of products eligible for shipping allocation (excludes shippingCostExcluded products)
    const totalEligibleShippingValue = [...byProductWithCost.entries()].reduce((s, [productId, agg]) => {
      const p = cat.find((x) => x.id === productId)
      return p?.shippingCostExcluded ? s : s + agg.value
    }, 0)

    try {
      for (const [productId, agg] of byProductWithCost) {
        const p = cat.find((x) => x.id === productId)
        if (!p) throw new Error(`ไม่พบสินค้าในแคตตาล็อก: ${productId}`)
        const baseAvgCost = agg.qty > 0 ? agg.value / agg.qty : 0
        // Allocate shipping cost pro-rata by value — skip products marked as shippingCostExcluded
        const shippingShare = !p.shippingCostExcluded && totalEligibleShippingValue > 0 && shippingCost > 0
          ? (agg.value / totalEligibleShippingValue) * shippingCost
          : 0
        const landedAvgCost = agg.qty > 0 ? baseAvgCost + shippingShare / agg.qty : 0
        applyMovingAverageCost(productId, agg.qty, landedAvgCost, p)
        receiveQtyToBranchStock(productId, agg.qty)
      }
      // Add bonus stock only — no moving average change (free items don't affect cost per unit)
      for (const hit of allReceiveLines) {
        if (!bonusLineIds.has(hit.lineId)) continue
        const row = allPoLines.find((x) => x.lineId === hit.lineId)
        if (row) receiveQtyToBranchStock(row.productId, hit.qty)
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'รับสินค้าไม่สำเร็จ')
      return
    }

    if (selected.supplierId) {
      const catalogItems = allReceiveLines.map((rl) => {
        const poLine = allPoLines.find((l) => l.lineId === rl.lineId)
        return {
          productId: poLine?.productId ?? null,
          sku: poLine?.sku ?? '',
          name: poLine?.name ?? '',
          qty: rl.qty,
          unitCost: rl.unitCost,
        }
      })
      mergeItemsIntoSupplierCatalog(selected.supplierId, catalogItems)
    }

    const batchId = `rcv-${Date.now()}`
    const now = new Date().toISOString()

    // Build transport log first (if transporter selected) so we can store its ID in the batch
    let transportLogId: string | undefined
    const transport = rcvTransportId ? transportDirectory.find((t) => t.id === rcvTransportId) : undefined
    if (transport) {
      const transitDays = selected.orderedAt
        ? Math.round((Date.now() - new Date(selected.orderedAt).getTime()) / 86_400_000)
        : undefined
      const totalQtyReceived = allReceiveLines.reduce((s, l) => s + l.qty, 0)
      const shortageQtyTotal = allReceiveLines.reduce((s, l) => s + (l.shortageQty ?? 0), 0)
      const hasBoxes = Object.values(rcvBoxes).some((v) => (v ?? 0) > 0)
      const hasDamaged = Object.values(rcvDamagedBoxes).some((v) => (v ?? 0) > 0)
      transportLogId = `tsl-${Date.now()}`
      appendTransportShipmentLog({
        id: transportLogId,
        transportId: transport.id,
        transportName: transport.name,
        poId: selected.id,
        poNo: selected.poNo,
        receivedAt: now,
        orderedAt: selected.orderedAt,
        transitDays,
        totalQtyReceived,
        shortageQtyTotal,
        ...(hasBoxes ? { boxes: rcvBoxes } : {}),
        ...(hasDamaged ? { damagedBoxes: rcvDamagedBoxes } : {}),
        ...(shippingCost > 0 ? { shippingCostBaht: shippingCost } : {}),
      })
    }

    const batch = {
      id: batchId,
      at: now,
      lines: allReceiveLines,
      ...(shippingCost > 0 ? { shippingCostBaht: shippingCost } : {}),
      ...(rcvNotes.trim() ? { notes: rcvNotes.trim() } : {}),
      ...(transportLogId ? { transportLogId } : {}),
    }

    const newInvoices: PoInvoice[] = rcvInvoiceRows
      .filter((r) => r.invoiceNo.trim())
      .map((r, i) => ({
        id: `inv-${Date.now()}-${i}`,
        invoiceNo: r.invoiceNo.trim(),
        invoiceDate: r.invoiceDate,
        receiveBatchId: batchId,
        beforeVatBaht: 0,
        vatBaht: 0,
        totalBaht: Number(r.totalBaht) || 0,
      }))

    const hasBackorders = finalLines.some((l) => lineBackorder(l) > 0)
    const autoClose = !hasBackorders && window.confirm('รับสินค้าครบทุกรายการแล้ว\n\nต้องการปิด PO นี้เลยไหม?')
    updateSelected({
      ...selected,
      lines: finalLines,
      receiveBatches: [...selected.receiveBatches, batch],
      ...(newInvoices.length > 0 ? { poInvoices: [...(selected.poInvoices ?? []), ...newInvoices] } : {}),
      ...(autoClose ? { status: 'closed' as const, closedAt: new Date().toISOString() } : {}),
    })

    setInlineReceive(false)
    setReceiveOpen(false)
  }

  const undoReceiveBatch = (batchId: string) => {
    if (!selected) return
    const batch = selected.receiveBatches.find((b) => b.id === batchId)
    if (!batch) return
    if (!window.confirm('ยกเลิกการรับสินค้าครั้งนี้?\n\nระบบจะหักสต็อกกลับตามที่รับไว้ (ต้นทุนเฉลี่ยไม่ย้อนกลับอัตโนมัติ)')) return

    if (batch.transportLogId) deleteTransportShipmentLog(batch.transportLogId)

    for (const hit of batch.lines) {
      if (hit.qty <= 0) continue
      const row = selected.lines.find((l) => l.lineId === hit.lineId)
      if (row) applySignedReceiveQtyToBranchStock(row.productId, -hit.qty)
    }

    const nextLines = selected.lines.map((l) => {
      const hit = batch.lines.find((x) => x.lineId === l.lineId)
      if (!hit) return l
      return { ...l, receivedQtyTotal: Math.max(0, l.receivedQtyTotal - hit.qty) }
    })

    updateSelected({
      ...selected,
      status: selected.status === 'closed' ? 'ordered' : selected.status,
      closedAt: selected.status === 'closed' ? undefined : selected.closedAt,
      lines: nextLines,
      receiveBatches: selected.receiveBatches.filter((b) => b.id !== batchId),
      poInvoices: (selected.poInvoices ?? []).filter((inv) => inv.receiveBatchId !== batchId),
    })
  }

  const savePayment = () => {
    if (!selected) return
    updateSelected({ ...selected, paidAt: new Date().toISOString() })
    setPoTab('items')
  }

  const closePo = () => {
    if (!selected || selected.status !== 'ordered') return
    if (!window.confirm('ปิดเอกสาร PO นี้? (ค้างรับจะไม่ถูกติดตามในรายการเปิด)')) return
    updateSelected({ ...selected, status: 'closed', closedAt: new Date().toISOString() })
  }

  const reopenPo = () => {
    if (!selected || selected.status !== 'closed') return
    if (
      !window.confirm(
        'เปิด PO กลับเป็น Ordered?\n\n' +
          '• รับของ / แก้ไขข้อมูลที่เกี่ยวข้องได้อีก\n' +
          '• ถ้าเคยบันทึกชำระ/เจ้าหนี้ไว้แล้ว ให้ตรวจสอบความสอดคล้องกับบัญชีเอง',
      )
    ) {
      return
    }
    updateSelected({ ...selected, status: 'ordered', closedAt: undefined })
    window.alert(`เปิด PO แล้ว — ${selected.poNo} กลับเป็นสถานะ Ordered`)
  }

  const deleteOrdered = () => {
    if (!selected || selected.status === 'closed') return
    if (selected.receiveBatches.length > 0) { window.alert('ไม่สามารถลบ PO ที่รับของแล้ว'); return }
    if (!window.confirm(`ลบ PO ${selected.poNo}?`)) return
    deletePurchaseOrder(selected.id)
    refresh()
    setSelectedId(null)
  }

  const addInvoiceFromForm = () => {
    if (!selected || !invForm.invoiceNo.trim()) return
    const bv = Number(invForm.beforeVatBaht) || 0
    const v  = Number(invForm.vatBaht) || 0
    const t  = Number(invForm.totalBaht) || (bv + v) || 0
    const inv: PoInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNo: invForm.invoiceNo.trim(),
      invoiceDate: invForm.invoiceDate,
      ...(invForm.receiveBatchId ? { receiveBatchId: invForm.receiveBatchId } : {}),
      beforeVatBaht: bv,
      vatBaht: v,
      totalBaht: t,
      ...(invForm.notes.trim() ? { notes: invForm.notes.trim() } : {}),
    }
    updateSelected({ ...selected, poInvoices: [...(selected.poInvoices ?? []), inv] })
    setInvFormOpen(false)
    setInvForm(emptyInvForm())
  }

  const deleteInvoice = (invId: string) => {
    if (!selected) return
    updateSelected({ ...selected, poInvoices: (selected.poInvoices ?? []).filter((i) => i.id !== invId) })
  }

  const [previewOpen, setPreviewOpen] = useState(false)
  const [copyDone, setCopyDone] = useState(false)
  const [poTab, setPoTab] = useState<'items' | 'supplier' | 'payment'>('items')

  const printPo = async (mode: PoOutputMode = 'print') => {
    if (!selected) return
    const shop = branch?.name ?? 'ร้าน'
    await printPurchaseOrder(selected, shop, mode)
    if (mode === 'copy') {
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 2000)
    }
  }

  const openSupplierCreate = () => {
    setSupplierModal({ open: true, mode: 'create', profile: null })
  }

  const openSupplierEdit = () => {
    if (!selected) return
    const p = getSupplierProfile(selected.supplierId)
    if (!p) {
      window.alert('ไม่พบข้อมูลผู้จัดจำหน่ายในแฟ้ม — เลือกจากรายการหรือเพิ่มผู้จัดจำหน่ายใหม่')
      return
    }
    setSupplierModal({ open: true, mode: 'edit', profile: p })
  }

  const handleSupplierSaved = (p: SupplierProfile, mode: 'create' | 'edit') => {
    if (selected) {
      if (mode === 'create') {
        updateSelected({ ...selected, supplierId: p.id, supplierName: p.name })
      } else if (selected.supplierId === p.id) {
        updateSelected({ ...selected, supplierName: p.name })
      }
    }
  }

  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm',
        className,
      )}
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-amber-600" aria-hidden />
          <div>
            <h1 className="text-sm font-bold text-slate-900">ใบสั่งซื้อ (PO)</h1>
            <p className="text-[11px] text-slate-500">
              Ordered → ชำระ → รับของ (สด/โอน) หรือ รับของ → ชำระ (เครดิต) · สาขา {branch?.name ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('ลบ PO ทั้งหมดใช่ไหม? ไม่สามารถกู้คืนได้')) {
                clearAllPurchaseOrders()
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            <Trash2 className="size-4" aria-hidden />
            ลบทั้งหมด
          </button>
          <button
            type="button"
            onClick={createNewPo}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
          >
            <PackagePlus className="size-4" aria-hidden />
            สร้าง PO ใหม่
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── PO list ── */}
        <div className="flex min-h-0 w-56 shrink-0 flex-col border-r border-slate-200">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              รายการ PO
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 normal-case tracking-normal text-slate-600">
                {filteredOrders.length}
              </span>
            </span>
            <button
              type="button"
              onClick={handleClearAllPo}
              title="ล้างข้อมูล PO ทั้งหมด"
              className="rounded p-0.5 text-slate-300 hover:bg-red-50 hover:text-red-400"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
          {/* supplier dropdown filter */}
          <div className="relative shrink-0 border-b border-slate-100 px-2 py-1.5">
            <button
              type="button"
              onClick={() => { setSupplierDropdownOpen((v) => !v); setSupplierDropdownSearch('') }}
              className={clsx(
                'flex w-full items-center justify-between gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold',
                filterSupplier
                  ? 'border-amber-400 bg-amber-50 text-amber-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
              )}
            >
              <span className="truncate">
                {filterSupplier
                  ? (supplierOptions.find((s) => s.id === filterSupplier)?.name ?? 'ซัพพลายเออร์')
                  : 'ซัพพลายเออร์ · ทั้งหมด'}
              </span>
              <ChevronDown className={clsx('size-3 shrink-0 transition-transform', supplierDropdownOpen && 'rotate-180')} />
            </button>

            {supplierDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSupplierDropdownOpen(false)} />
                <div className="absolute left-2 right-2 top-full z-50 mt-1 flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                {/* search */}
                <div className="border-b border-slate-100 px-2 py-1.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-slate-400" />
                    <input
                      autoFocus
                      value={supplierDropdownSearch}
                      onChange={(e) => setSupplierDropdownSearch(e.target.value)}
                      placeholder="ค้นหาซัพพลายเออร์…"
                      className="w-full rounded-md border border-slate-200 bg-slate-50 py-1 pl-6 pr-2 text-[11px] outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
                {/* options */}
                <div className="max-h-52 overflow-y-auto">
                  {!supplierDropdownSearch && (
                    <button
                      type="button"
                      onClick={() => { setFilterSupplier(''); setSupplierDropdownOpen(false) }}
                      className={clsx(
                        'flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px]',
                        filterSupplier === '' ? 'bg-amber-500 font-semibold text-white' : 'text-slate-700 hover:bg-amber-50',
                      )}
                    >
                      <span>ทั้งหมด</span>
                      <span className={clsx('rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                        filterSupplier === '' ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500')}>
                        {orders.length}
                      </span>
                    </button>
                  )}
                  {supplierOptions
                    .filter((s) => !supplierDropdownSearch || s.name.toLowerCase().includes(supplierDropdownSearch.toLowerCase()))
                    .map((s) => {
                      const count = orders.filter((o) => o.supplierId === s.id).length
                      const active = filterSupplier === s.id
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => { setFilterSupplier(active ? '' : s.id); setSupplierDropdownOpen(false) }}
                          className={clsx(
                            'flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px]',
                            active ? 'bg-amber-500 font-semibold text-white' : 'text-slate-700 hover:bg-amber-50',
                          )}
                        >
                          <span className="truncate">{s.name}</span>
                          <span className={clsx('ml-1 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                            active ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500')}>
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  {supplierOptions.filter((s) => !supplierDropdownSearch || s.name.toLowerCase().includes(supplierDropdownSearch.toLowerCase())).length === 0 && (
                    <p className="px-3 py-4 text-center text-[11px] text-slate-400">ไม่พบ</p>
                  )}
                </div>
                {/* add supplier */}
                <div className="border-t border-slate-100 p-1.5">
                  <button
                    type="button"
                    onClick={() => { setSupplierModal({ open: true, mode: 'create', profile: null }); setSupplierDropdownOpen(false) }}
                    className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 py-1.5 text-[10px] font-semibold text-slate-400 hover:border-amber-400 hover:text-amber-600"
                  >
                    <UserPlus className="size-3" />
                    เพิ่มซัพพลายเออร์
                  </button>
                </div>
              </div>
              </>
            )}
          </div>

          <div className="shrink-0 border-b border-slate-100 px-2 py-1.5 flex flex-col gap-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-slate-400" />
              <input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="ค้นหา PO…"
                className="w-full rounded-md border border-slate-200 bg-white py-1 pl-6 pr-2 text-[11px] outline-none focus:border-amber-400"
              />
            </div>
            {/* Pipeline stepper — purchasing flow */}
            {(() => {
              const steps = [
                { value: 'ordered'   as const, label: 'สั่งซื้อ',   sub: 'รอชำระ',       dot: 'bg-blue-500',    ring: 'border-blue-500',    activeBg: 'bg-blue-50',    activeText: 'text-blue-700',    badge: 'bg-blue-500'    },
                { value: 'paid'      as const, label: 'ชำระแล้ว',  sub: 'รอรับสินค้า',  dot: 'bg-emerald-500', ring: 'border-emerald-500', activeBg: 'bg-emerald-50', activeText: 'text-emerald-700', badge: 'bg-emerald-500' },
                { value: 'receiving' as const, label: 'รับสินค้า', sub: 'กำลังรับ/ค้าง', dot: 'bg-amber-500',   ring: 'border-amber-500',   activeBg: 'bg-amber-50',   activeText: 'text-amber-700',   badge: 'bg-amber-500'   },
                { value: 'closed'    as const, label: 'ปิดแล้ว',   sub: 'เสร็จสิ้น',    dot: 'bg-slate-300',   ring: 'border-slate-300',   activeBg: 'bg-slate-50',   activeText: 'text-slate-500',   badge: 'bg-slate-400', dim: true },
              ] as const
              const getCount = (value: typeof steps[number]['value']) =>
                value === 'ordered'   ? ordersForStatusCount.filter((o) => o.status === 'ordered' && !isPaidOrder(o)).length
                : value === 'paid'    ? ordersForStatusCount.filter((o) => isPaidOrder(o) && o.receiveBatches.length === 0).length
                : value === 'receiving'? ordersForStatusCount.filter((o) => o.receiveBatches.length > 0 && o.status !== 'closed').length
                : ordersForStatusCount.filter((o) => o.status === value).length
              const handleClick = (value: typeof steps[number]['value']) => {
                setFilterStatus(value)
                if (!selectedId) {
                  const match = orders.find((o) => {
                    if (filterSupplier && o.supplierId !== filterSupplier) return false
                    if (value === 'ordered')    return o.status === 'ordered' && !isPaidOrder(o)
                    if (value === 'paid')       return isPaidOrder(o) && o.receiveBatches.length === 0
                    if (value === 'receiving')  return o.receiveBatches.length > 0 && o.status !== 'closed'
                    return o.status === value
                  })
                  if (match) { setSelectedId(match.id); setPoTab('items') }
                }
              }
              return (
                <div>
                  {/* "ดูทั้งหมด" top link */}
                  <button
                    type="button"
                    onClick={() => { setFilterStatus('all'); if (!selectedId) { const first = orders.find((o) => o.status !== 'closed'); if (first) { setSelectedId(first.id); setPoTab('items') } } }}
                    className={clsx(
                      'mb-1 flex w-full items-center justify-between rounded-lg px-2 py-1 text-[11px] transition-colors',
                      filterStatus === 'all' ? 'font-bold text-amber-700' : 'text-slate-400 hover:text-slate-600',
                    )}
                  >
                    <span>ดูที่ยังเปิดอยู่</span>
                    <span className={clsx('rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                      filterStatus === 'all' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500',
                    )}>{ordersForStatusCount.filter((o) => o.status !== 'closed').length}</span>
                  </button>

                  {/* Stepper */}
                  <div className="flex flex-col">
                    {steps.map((step, i) => {
                      const cnt = getCount(step.value)
                      const active = filterStatus === step.value
                      const hasItems = cnt > 0
                      return (
                        <div key={step.value}>
                          <button
                            type="button"
                            onClick={() => handleClick(step.value)}
                            className={clsx(
                              'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors',
                              active ? step.activeBg : 'hover:bg-slate-50',
                              'dim' in step && step.dim && !active && !hasItems && 'opacity-40',
                            )}
                          >
                            {/* Circle node */}
                            <div className={clsx(
                              'size-3 shrink-0 rounded-full border-2 transition-all',
                              active ? `${step.dot} border-transparent` : hasItems ? `${step.ring} bg-white` : 'border-slate-200 bg-white',
                            )} />
                            {/* Label */}
                            <div className="flex-1 text-left">
                              <p className={clsx('text-[11px] font-bold leading-tight',
                                active ? step.activeText : hasItems ? 'text-slate-700' : 'text-slate-400',
                              )}>{step.label}</p>
                              <p className={clsx('text-[9px] leading-tight',
                                active ? 'opacity-70 ' + step.activeText : 'text-slate-400',
                              )}>{step.sub}</p>
                            </div>
                            {/* Count badge */}
                            <span className={clsx(
                              'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                              active ? `${step.badge} text-white` : hasItems ? 'bg-slate-100 text-slate-600' : 'text-slate-300',
                            )}>{cnt}</span>
                          </button>
                          {/* Connector line between steps */}
                          {i < steps.length - 1 && (
                            <div className="ml-[14px] h-2.5 w-0.5 bg-slate-200" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>
          <div className="min-h-0 flex-1 overflow-auto divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-slate-400">
                {orders.length === 0 ? 'ยังไม่มีใบสั่งซื้อ — กด «สร้าง PO ใหม่»' : 'ไม่พบรายการ'}
              </p>
            ) : filteredOrders.map((o) => {
                      const total = grandTotal(o)
                      const backorderCount = o.lines.reduce((s, l) => s + lineBackorder(l), 0)
                      const totalOrdered   = o.lines.reduce((s, l) => s + lineTotalExpected(l), 0)
                      const totalReceived  = o.lines.reduce((s, l) => s + l.receivedQtyTotal, 0)
                      const receivePct     = totalOrdered > 0 ? Math.min(100, Math.round((totalReceived / totalOrdered) * 100)) : 0
                      const today = new Date(); today.setHours(0, 0, 0, 0)
                      const isLate = o.status === 'ordered' && !!o.expectedDeliveryAt &&
                        new Date(o.expectedDeliveryAt) < today
                      const isPaid = (o.paymentMode === 'paid_cash' || o.paymentMode === 'paid_transfer') && !!o.paidAt
                      const isPayable = o.paymentMode === 'payable'
                      const isPayableConfirmed = isPayable && !!o.paidAt
                      // payment due date for payable POs
                      const payDue = isPayable ? supplierPayDueDate(creditAnchorDateForPo(o), getSupplierCreditTerms(o.supplierId)) : null
                      const payDueDays = payDue ? Math.round((payDue.getTime() - today.getTime()) / 86_400_000) : null
                      const payOverdue = payDueDays !== null && payDueDays < 0
                      const stripCls =
                        isLate                   ? 'bg-rose-500' :
                        payOverdue               ? 'bg-red-600' :
                        o.status === 'draft'     ? 'bg-slate-300' :
                        backorderCount > 0       ? 'bg-amber-400' :
                        o.status === 'ordered'   ? 'bg-blue-400' :
                        isPaid                   ? 'bg-emerald-400' :
                        'bg-slate-200'
                      const dateStr = (() => {
                        const ref = o.orderedAt ?? o.createdAt
                        const d = new Date(ref)
                        return d.toDateString() === new Date().toDateString()
                          ? d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                          : formatShortDate(ref)
                      })()
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => { setSelectedId(o.id); setPoTab('items') }}
                          className={clsx(
                            'flex w-full text-left transition-colors hover:bg-amber-50/60',
                            selectedId === o.id ? 'bg-amber-50' : 'bg-white',
                          )}
                        >
                          {/* left status strip */}
                          <div className={clsx('w-1.5 shrink-0', stripCls)} />

                          <div className="flex-1 min-w-0 px-3 py-2.5">
                            {/* supplier name — always show */}
                            {o.supplierName && (
                              <div className="mb-1 truncate text-[10px] font-medium text-amber-600/80">
                                {o.supplierName}
                              </div>
                            )}

                            {/* row 1: PO number + amount */}
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-slate-800">{o.poNo}</span>
                              <span className="tabular-nums text-sm font-bold text-slate-900">
                                ฿{total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            {/* row 2: status badge + date */}
                            <div className="mt-1 flex items-center justify-between gap-1">
                              <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                                <span className={clsx(
                                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                  o.status === 'draft'   ? 'bg-slate-100 text-slate-500' :
                                  o.status === 'closed'  ? 'bg-slate-200 text-slate-600' :
                                  backorderCount > 0     ? 'bg-amber-100 text-amber-800' :
                                                           'bg-blue-100 text-blue-700',
                                )}>
                                  {statusLabel(o)}
                                </span>
                                {isLate && (
                                  <span className="shrink-0 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                    ล่าช้า
                                  </span>
                                )}
                                {isPaid && (
                                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                    ชำระแล้ว
                                  </span>
                                )}
                                {isPayableConfirmed && (
                                  <span className={clsx(
                                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                    payOverdue ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700',
                                  )}>
                                    {payOverdue ? `เกินกำหนด ${Math.abs(payDueDays!)}วัน` : 'เครดิต'}
                                  </span>
                                )}
                              </div>
                              <span className="shrink-0 text-[10px] text-slate-400">{dateStr}</span>
                            </div>

                            {/* row 3: payment due date for payable */}
                            {payDue && !payOverdue && payDueDays !== null && (
                              <div className="mt-1 flex items-center gap-1">
                                <span className={clsx(
                                  'text-[10px]',
                                  payDueDays <= 7 ? 'font-semibold text-orange-600' : 'text-slate-400',
                                )}>
                                  ครบกำหนด {payDue.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                  {payDueDays <= 14 && ` (อีก ${payDueDays} วัน)`}
                                </span>
                              </div>
                            )}
                            {payOverdue && payDue && (
                              <div className="mt-1 text-[10px] font-semibold text-red-600">
                                ครบกำหนด {payDue.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} — เกินกำหนดแล้ว
                              </div>
                            )}

                            {/* row 4: progress bar */}
                            {o.status !== 'draft' && totalOrdered > 0 ? (
                              <div className="mt-2 space-y-0.5">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] text-slate-400">
                                    รับแล้ว {totalReceived}/{totalOrdered} ชิ้น · {o.lines.length} SKU
                                  </span>
                                  <span className="tabular-nums text-[10px] font-semibold text-slate-500">{receivePct}%</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className={clsx('h-full rounded-full transition-all', receivePct >= 100 ? 'bg-emerald-400' : 'bg-blue-300')}
                                    style={{ width: `${receivePct}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="mt-1.5">
                                <span className="text-[10px] text-slate-400">{o.lines.length} SKU · {totalOrdered} ชิ้น</span>
                              </div>
                            )}
                          </div>
                        </button>
                      )
            })}
          </div>
        </div>

        {/* ── PO detail ── */}
        <section className="min-h-0 min-w-0 flex-1 overflow-auto p-4 space-y-4">
          {!selected ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-200">
                <ClipboardList className="size-8 text-amber-400" />
              </div>
              {/* summary stats */}
              {orders.length > 0 && (() => {
                const today = new Date(); today.setHours(0, 0, 0, 0)
                const payables = orders.filter((o) => o.paymentMode === 'payable')
                const totalOwed = payables.reduce((s, o) => s + grandTotal(o), 0)
                const overdueCount = payables.filter((o) => {
                  const due = supplierPayDueDate(creditAnchorDateForPo(o), getSupplierCreditTerms(o.supplierId))
                  return due < today
                }).length
                const pendingReceive = orders.filter((o) =>
                  o.status === 'ordered' && o.lines.some((l) => lineBackorder(l) > 0)
                ).length
                return (
                  <div className="flex gap-4 text-left">
                    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm min-w-[110px]">
                      <p className="text-[10px] text-slate-400">ใบสั่งซื้อทั้งหมด</p>
                      <p className="mt-0.5 text-2xl font-black text-slate-800">{orders.length}</p>
                    </div>
                    {payables.length > 0 && (
                      <div className={clsx(
                        'rounded-xl border px-4 py-3 shadow-sm min-w-[120px]',
                        overdueCount > 0 ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-white',
                      )}>
                        <p className="text-[10px] text-slate-400">ค้างชำระซัพพลาย</p>
                        <p className={clsx('mt-0.5 text-xl font-black tabular-nums', overdueCount > 0 ? 'text-red-700' : 'text-indigo-700')}>
                          ฿{(totalOwed / 1000).toFixed(1)}K
                        </p>
                        {overdueCount > 0 && (
                          <p className="text-[10px] font-semibold text-red-600">เกินกำหนด {overdueCount} รายการ</p>
                        )}
                      </div>
                    )}
                    {pendingReceive > 0 && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 shadow-sm min-w-[110px]">
                        <p className="text-[10px] text-slate-400">รอรับสินค้า</p>
                        <p className="mt-0.5 text-2xl font-black text-amber-700">{pendingReceive}</p>
                        <p className="text-[10px] text-amber-600">ใบสั่งซื้อ</p>
                      </div>
                    )}
                  </div>
                )
              })()}
              <div>
                <p className="text-sm font-semibold text-slate-700">ยังไม่ได้เลือกใบสั่งซื้อ</p>
                <p className="mt-1 text-xs text-slate-400">เลือก PO จากรายการทางซ้าย หรือสร้างใบสั่งซื้อใหม่</p>
              </div>
              <button
                type="button"
                onClick={createNewPo}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-600"
              >
                <PackagePlus className="size-3.5" />
                สร้าง PO ใหม่
              </button>
            </div>
          ) : (
            <>
              {/* ── PO header card ── */}
              {(() => {
                const statusBadge =
                  selected.status === 'ordered'
                    ? { label: 'Ordered', cls: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200' }
                    : { label: 'ปิดแล้ว', cls: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200' }
                const gt = grandTotal(selected)
                const totalOrdered  = selected.lines.reduce((s, l) => s + l.orderedQty, 0)
                const totalReceived = selected.lines.reduce((s, l) => s + l.receivedQtyTotal, 0)
                const receivePct    = totalOrdered > 0 ? Math.min(100, Math.round((totalReceived / totalOrdered) * 100)) : 0
                const payLabel =
                  selected.paymentMode === 'paid_cash'                       ? 'ชำระสดแล้ว' :
                  selected.paymentMode === 'paid_transfer'                   ? 'โอนแล้ว' :
                  selected.paymentMode === 'payable' && selected.paidAt      ? 'เครดิต' : 'ยังไม่ชำระ'
                const payColor =
                  selected.paymentMode === 'paid_cash' || selected.paymentMode === 'paid_transfer'
                    ? 'text-emerald-700 bg-emerald-50 ring-emerald-200'
                    : selected.paymentMode === 'payable' && selected.paidAt
                    ? 'text-indigo-700 bg-indigo-50 ring-indigo-200'
                    : 'text-slate-500 bg-slate-50 ring-slate-200'
                const due = selected.expectedDeliveryAt ? new Date(selected.expectedDeliveryAt) : null
                const today = new Date(); today.setHours(0,0,0,0)
                const isLate = selected.status === 'ordered' && !!due && due < today
                return (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    {/* top strip */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 pt-3 pb-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xl font-black tracking-tight text-slate-900">{selected.poNo}</span>
                          <span className={clsx('rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1', statusBadge.cls)}>
                            {statusBadge.label}
                          </span>
                          {due && (
                            <span className={clsx(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1',
                              isLate ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-amber-50 text-amber-700 ring-amber-200',
                            )}>
                              {isLate ? '⚠ ล่าช้า' : '📦'} {due.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{selected.supplierName || '—'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setPreviewOpen(true)}
                          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                          <Printer className="size-3.5" aria-hidden /> ดูตัวอย่าง / พิมพ์
                        </button>
                        {selected.receiveBatches.length === 0 && selected.status !== 'closed' && (
                          <button type="button" onClick={deleteOrdered}
                            className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100">
                            <Trash2 className="size-3.5" aria-hidden /> ลบ PO
                          </button>
                        )}
                        {selected.status === 'ordered' && (<>
                          <button type="button" onClick={openReceive} disabled={!selected.paidAt}
                            title={!selected.paidAt ? 'ต้องบันทึกชำระก่อนรับสินค้า' : undefined}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40">
                            <Truck className="size-3.5" aria-hidden /> รับสินค้า
                          </button>
                          <button type="button" onClick={closePo}
                            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-slate-100 px-2 py-1.5 text-xs font-semibold hover:bg-slate-200">
                            <CheckCircle2 className="size-3.5" aria-hidden /> ปิด PO
                          </button>
                        </>)}
                        {selected.status === 'closed' && (
                          <button type="button" onClick={reopenPo}
                            className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100">
                            <RotateCcw className="size-3.5" aria-hidden /> เปิด PO กลับ
                          </button>
                        )}
                      </div>
                    </div>
                    {/* stats strip */}
                    <div className="grid grid-cols-4 divide-x divide-slate-100 px-0">
                      <div className="flex flex-col gap-0.5 px-4 py-2.5">
                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          <Package className="size-3" /> รายการ
                        </span>
                        <span className="text-sm font-bold text-slate-800">{selected.lines.length} <span className="text-xs font-normal text-slate-400">SKU · {totalOrdered} ชิ้น</span></span>
                      </div>
                      <div className="flex flex-col gap-0.5 px-4 py-2.5">
                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          <TrendingUp className="size-3" /> มูลค่า
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          ฿{gt.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 px-4 py-2.5">
                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          <Wallet className="size-3" /> ชำระ
                        </span>
                        <span className={clsx('inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-bold ring-1', payColor)}>
                          {payLabel}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 px-4 py-2.5">
                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          <Truck className="size-3" /> รับแล้ว
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{totalReceived}<span className="text-xs font-normal text-slate-400">/{totalOrdered}</span></span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className={clsx('h-full rounded-full transition-all', receivePct === 100 ? 'bg-emerald-500' : 'bg-blue-400')}
                              style={{ width: `${receivePct}%` }} />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500">{receivePct}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Payment-first reminder banner */}
              {selected.status === 'ordered' && !selected.paidAt && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <CircleDollarSign className="size-4 shrink-0 text-amber-600" />
                      <p className="text-xs font-semibold text-amber-900">
                        ต้องบันทึกชำระก่อนรับสินค้า —{' '}
                        <span className="font-normal text-amber-800">
                          {selected.paymentMode === 'unpaid'
                            ? 'กรุณาเลือกวิธีชำระและบันทึกการชำระ'
                            : selected.paymentMode === 'payable'
                            ? 'กรุณาบันทึกเจ้าหนี้ก่อนรับของ'
                            : 'กรุณาบันทึกการชำระก่อนรับสินค้า'}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPoTab('payment')}
                      className="shrink-0 rounded-lg border border-amber-400 bg-amber-400 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500"
                    >
                      ไปบันทึกชำระ →
                    </button>
                  </div>
                )}

              {/* Timeline strip */}
              {(() => {
                const hasBackorders = selected.lines.some((l) => lineBackorder(l) > 0)
                const partialRcv = selected.receiveBatches.length > 0 && hasBackorders
                const paidAt = selected.paidAt ?? null
                const firstReceiveAt = selected.receiveBatches[0]?.at ?? null
                const isPrepay = paidAt != null && (firstReceiveAt == null || paidAt < firstReceiveAt)
                const timelineSteps = [
                  {
                    label: 'สั่งซื้อ',
                    date: selected.orderedAt ?? selected.createdAt,
                    done: true,
                    dotDone: 'border-blue-400 bg-blue-400',
                    dotCurrent: 'border-blue-600 bg-blue-600 shadow shadow-blue-200',
                    textActive: 'text-blue-700',
                    progressColor: 'bg-blue-400',
                  },
                  {
                    label: 'ชำระแล้ว',
                    sublabel: isPrepay && !!paidAt ? 'ล่วงหน้า' : undefined,
                    date: paidAt,
                    done: !!paidAt,
                    dotDone: 'border-emerald-400 bg-emerald-400',
                    dotCurrent: 'border-emerald-600 bg-emerald-600 shadow shadow-emerald-200',
                    textActive: 'text-emerald-700',
                    progressColor: 'bg-emerald-400',
                  },
                  {
                    label: partialRcv ? 'รับบางส่วน' : 'รับครบ',
                    date: selected.receiveBatches.at(-1)?.at ?? null,
                    done: selected.receiveBatches.length > 0,
                    dotDone: partialRcv ? 'border-amber-400 bg-amber-400' : 'border-sky-400 bg-sky-400',
                    dotCurrent: partialRcv ? 'border-amber-500 bg-amber-500 shadow shadow-amber-200' : 'border-sky-500 bg-sky-500 shadow shadow-sky-200',
                    textActive: partialRcv ? 'text-amber-700' : 'text-sky-700',
                    progressColor: partialRcv ? 'bg-amber-400' : 'bg-sky-400',
                  },
                  {
                    label: 'ปิดแล้ว',
                    date: selected.closedAt ?? null,
                    done: selected.status === 'closed',
                    dotDone: 'border-slate-400 bg-slate-400',
                    dotCurrent: 'border-slate-500 bg-slate-500 shadow shadow-slate-200',
                    textActive: 'text-slate-600',
                    progressColor: 'bg-slate-400',
                  },
                ]
                const lastDoneIdx = timelineSteps.reduce((acc, s, i) => (s.done ? i : acc), 0)
                const progressRatio = lastDoneIdx / (timelineSteps.length - 1)
                const progressColor = timelineSteps[lastDoneIdx]!.progressColor
                return (
                  <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
                    <div className="relative flex items-start justify-between">
                      <div className="absolute left-5 right-5 top-1.5 h-px bg-slate-200" />
                      <div
                        className={clsx('absolute left-5 top-1.5 h-px transition-all duration-500', progressColor)}
                        style={{ width: `calc((100% - 2.5rem) * ${progressRatio})` }}
                      />
                      {timelineSteps.map((step, idx) => {
                        const isCurrent = idx === lastDoneIdx
                        return (
                          <div key={step.label} className="relative z-10 flex w-16 flex-col items-center gap-0.5 text-center">
                            <div className={clsx(
                              'rounded-full border-2 ring-2 ring-slate-50 transition-colors',
                              isCurrent ? 'size-3.5' : 'size-3',
                              step.done
                                ? isCurrent ? step.dotCurrent : step.dotDone
                                : 'border-slate-300 bg-white',
                            )} />
                            <span className={clsx(
                              'leading-tight mt-0.5 font-semibold',
                              isCurrent ? 'text-[10.5px]' : 'text-[10px]',
                              step.done ? (isCurrent ? step.textActive : 'text-slate-600') : 'text-slate-400',
                            )}>
                              {step.label}
                              {'sublabel' in step && step.sublabel && (
                                <span className="ml-0.5 text-[8px] font-bold text-violet-500">{step.sublabel}</span>
                              )}
                            </span>
                            {step.date && (
                              <span className="text-[9px] leading-tight text-slate-400">{formatShortDate(step.date)}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* ── Tab bar ── */}
              <div className="flex border-b border-slate-200">
                {([
                  { id: 'items',    label: 'สินค้า',           badge: selected.lines.length },
                  { id: 'payment',  label: 'ชำระ / ใบกำกับ',   badge: (selected.poInvoices ?? []).length || null },
                  { id: 'supplier', label: 'ซัพพลายเออร์',     badge: null },
                ] as const).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPoTab(t.id)}
                    className={clsx(
                      'flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors',
                      poTab === t.id
                        ? 'border-amber-500 text-amber-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700',
                    )}
                  >
                    {t.label}
                    {t.badge != null && t.badge > 0 && (
                      <span className={clsx(
                        'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                        poTab === t.id ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500',
                      )}>
                        {t.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── Tab: ซัพพลายเออร์ ── */}
              {poTab === 'supplier' && (<>
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500">
                    ผู้จัดจำหน่าย / ร้านค้าส่ง
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={openSupplierCreate}
                      className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900 hover:bg-amber-100"
                    >
                      <UserPlus className="size-3" aria-hidden />
                      เพิ่มผู้จัดจำหน่าย
                    </button>
                    <button
                      type="button"
                      onClick={openSupplierEdit}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      รายละเอียด / เครดิต
                    </button>
                  </div>
                </div>
                <select
                  value={selected.supplierId}
                  disabled={selected.status === 'closed' || selected.receiveBatches.length > 0}
                  onChange={(e) => {
                    const s = suppliers.find((x) => x.id === e.target.value)
                    const vatMode: PoVatMode =
                      s?.priceListVatMode === 'vat_included' ? 'included' :
                      s?.priceListVatMode === 'no_vat'       ? 'none'     : 'excluded'
                    updateSelected({
                      ...selected,
                      supplierId: e.target.value,
                      supplierName: s?.name ?? '',
                      vatMode,
                    })
                  }}
                  className="w-full max-w-md rounded border border-slate-200 bg-white px-2 py-2 text-sm disabled:bg-slate-100"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.supplierCode} — {s.name}
                    </option>
                  ))}
                </select>

                {(() => {
                  const prof = getSupplierProfile(selected.supplierId)
                  if (!prof) {
                    return (
                      <p className="mt-2 text-[11px] text-amber-800">
                        ยังไม่มีรายละเอียดในแฟ้ม — กด «รายละเอียด / เครดิต» เพื่อกรอก
                      </p>
                    )
                  }
                  return (
                    <div className="mt-3 space-y-2 text-[11px]">
                      {/* Name + code headline */}
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-base font-black leading-tight text-slate-900">{prof.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">{prof.supplierCode}</span>
                      </div>

                      {/* Contact row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
                        {prof.phone && (
                          <span>📞 {prof.phone}</span>
                        )}
                        {prof.taxId && (
                          <span className="font-mono">เลขภาษี: {prof.taxId}</span>
                        )}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {supplierPaymentMethodsLabel(prof)}
                        </span>
                      </div>

                      {prof.address && (
                        <p className="whitespace-pre-wrap text-slate-500">{prof.address}</p>
                      )}
                      {prof.notes && (
                        <p className="whitespace-pre-wrap text-slate-500 italic">{prof.notes}</p>
                      )}

                      {/* Bank accounts */}
                      {prof.bankAccounts && prof.bankAccounts.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {prof.bankAccounts.map((a, i) => (
                            <div
                              key={`${prof.id}-ba-${i}`}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] shadow-sm min-w-[160px]"
                            >
                              <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                {a.bankName || `บัญชี ${i + 1}`}
                              </div>
                              {a.accountNo && (
                                <div className="font-mono text-sm font-bold text-slate-800 tracking-wider">
                                  {a.accountNo}
                                </div>
                              )}
                              {a.accountName && (
                                <div className="text-slate-500">{a.accountName}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Credit terms */}
                      <div className="border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                        {describeSupplierCreditRule(getSupplierCreditTerms(prof.id))}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Shipping section */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <Truck className="size-3.5" />
                  การจัดส่ง
                </div>


                <div className="flex flex-wrap gap-4">
                  <label className="flex flex-col gap-1 text-[10px] font-semibold text-slate-600">
                    วันที่คาดรับสินค้า
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={selected.expectedDeliveryAt ?? ''}
                        onChange={(e) => updateSelected({ ...selected, expectedDeliveryAt: e.target.value || undefined })}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-amber-400"
                      />
                      {selected.expectedDeliveryAt && (
                        <button
                          type="button"
                          onClick={() => updateSelected({ ...selected, expectedDeliveryAt: undefined })}
                          className="text-[10px] text-slate-400 hover:text-rose-500"
                        >
                          ล้าง
                        </button>
                      )}
                    </div>
                  </label>
                  <div className="flex flex-col gap-1 text-[10px] font-semibold text-slate-600">
                    วิธีขนส่ง
                    <div className="w-44">
                      <ShippingCombobox
                        variant="field"
                        value={selected.shippingMethod ?? ''}
                        supplierId={selected.supplierId}
                        transportNames={transportNames}
                        disabled={selected.status === 'closed'}
                        onChange={(v) => updateSelected({ ...selected, shippingMethod: v || undefined })}
                      />
                    </div>
                  </div>
                  <label className="flex flex-col gap-1 text-[10px] font-semibold text-slate-600">
                    เลขพัสดุ / Tracking
                    <input
                      type="text"
                      value={selected.trackingNo ?? ''}
                      placeholder="TH1234567890"
                      onChange={(e) => updateSelected({ ...selected, trackingNo: e.target.value.trim() || undefined })}
                      className="w-36 rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-amber-400"
                    />
                  </label>
                </div>
              </div>

              </>)}

              {/* ── Tab: สินค้า ── */}
              {poTab === 'items' && (<>

              {/* Vendor Promotions — top of items tab */}
              {(() => {
                const today = new Date().toISOString().slice(0, 10)
                const supplierPromos = vendorPromos.filter(
                  (p) => p.supplierId === selected.supplierId || p.supplierId === '',
                )
                const isEditing = (id: string) => vendorPromoDraft?.id === id
                const isAdding = vendorPromoDraft !== null && !vendorPromos.some((p) => p.id === vendorPromoDraft.id)
                const savePromo = (draft: VendorPromotion) => {
                  const next = vendorPromos.some((p) => p.id === draft.id)
                    ? vendorPromos.map((p) => (p.id === draft.id ? draft : p))
                    : [...vendorPromos, draft]
                  setVendorPromos(next)
                  saveVendorPromotions(next)
                  setVendorPromoDraft(null)
                }
                const deletePromo = (id: string) => {
                  if (!window.confirm('ลบโปรนี้?')) return
                  const next = vendorPromos.filter((p) => p.id !== id)
                  setVendorPromos(next)
                  saveVendorPromotions(next)
                }
                const poProductIds = selected.lines.map((l) => l.productId)
                const allProducts = getPosCatalogProducts()
                return (
                  <div className="rounded-lg border border-blue-200/70 bg-blue-50/30">
                    <button
                      type="button"
                      onClick={() => setVendorPromoOpen((o) => !o)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
                    >
                      <Store className="size-3.5 shrink-0 text-blue-600" />
                      <span className="flex-1 text-[11px] font-bold text-blue-700">
                        โปรผู้จัดจำหน่าย — {selected.supplierName || 'ผู้จัดจำหน่าย'}
                      </span>
                      {supplierPromos.length > 0 && (
                        <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          {supplierPromos.length}
                        </span>
                      )}
                      <ChevronDown className={clsx('size-3.5 text-blue-500 transition-transform', vendorPromoOpen && 'rotate-180')} />
                    </button>

                    {vendorPromoOpen && (
                      <div className="border-t border-blue-200/60 px-3 pb-3 pt-2 space-y-2">
                        <div className="flex justify-end">
                          {!vendorPromoDraft && (
                            <button
                              type="button"
                              onClick={() =>
                                setVendorPromoDraft({
                                  id: newVendorPromoId(),
                                  name: 'โปรใหม่',
                                  enabled: true,
                                  startDate: today,
                                  endDate: '2099-12-31',
                                  productId: poProductIds[0] ?? (allProducts[0]?.id ?? ''),
                                  brand: '',
                                  category: '',
                                  supplierId: selected.supplierId,
                                  tiers: [{ minQty: 1, extraDiscountPct: 3, freeQty: 0 }],
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-400/40 bg-blue-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700"
                            >
                              <Plus className="size-3" />
                              เพิ่มโปร
                            </button>
                          )}
                        </div>

                        {vendorPromoDraft && (
                          <div className="rounded-lg border border-blue-300/60 bg-white p-3 shadow-sm">
                            <p className="mb-2 text-[10px] font-bold text-blue-800">
                              {isAdding ? 'เพิ่มโปรใหม่' : 'แก้ไขโปร'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <label className="flex flex-col gap-0.5 text-[10px] font-semibold text-slate-600">
                                ชื่อโปร
                                <input type="text" value={vendorPromoDraft.name}
                                  onChange={(e) => setVendorPromoDraft((d) => d && { ...d, name: e.target.value })}
                                  className="w-36 rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-400" />
                              </label>
                              <label className="flex flex-col gap-0.5 text-[10px] font-semibold text-slate-600">
                                สินค้า
                                <select value={vendorPromoDraft.productId}
                                  onChange={(e) => setVendorPromoDraft((d) => d && { ...d, productId: e.target.value })}
                                  className="w-44 rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-400">
                                  {poProductIds.length > 0 && (
                                    <optgroup label="สินค้าใน PO นี้">
                                      {selected.lines.map((l) => (
                                        <option key={l.productId} value={l.productId}>{l.sku} — {l.name}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  <optgroup label="สินค้าทั้งหมด">
                                    {allProducts.filter((p) => !poProductIds.includes(p.id)).map((p) => (
                                      <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                                    ))}
                                  </optgroup>
                                </select>
                              </label>
                              <label className="flex flex-col gap-0.5 text-[10px] font-semibold text-slate-600">
                                ผู้จัดจำหน่าย
                                <select value={vendorPromoDraft.supplierId}
                                  onChange={(e) => setVendorPromoDraft((d) => d && { ...d, supplierId: e.target.value })}
                                  className="w-36 rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-400">
                                  <option value="">— ทุก supplier —</option>
                                  {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>{s.supplierCode} — {s.name}</option>
                                  ))}
                                </select>
                              </label>
                              <label className="flex flex-col gap-0.5 text-[10px] font-semibold text-slate-600">
                                เริ่ม
                                <input type="date" value={vendorPromoDraft.startDate}
                                  onChange={(e) => setVendorPromoDraft((d) => d && { ...d, startDate: e.target.value })}
                                  className="rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-400" />
                              </label>
                              <label className="flex flex-col gap-0.5 text-[10px] font-semibold text-slate-600">
                                สิ้นสุด
                                <input type="date" value={vendorPromoDraft.endDate}
                                  onChange={(e) => setVendorPromoDraft((d) => d && { ...d, endDate: e.target.value })}
                                  className="rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-400" />
                              </label>
                            </div>

                            {/* Tier list — supports both single-tier (2+1) and multi-tier (50→20, 100→5) */}
                            <div className="mt-3 rounded-md border border-blue-200/60 bg-blue-50/30 p-2">
                              <div className="mb-1.5 flex items-center justify-between">
                                <p className="text-[10px] font-bold text-blue-800">ขั้นส่วนลด / ของแถม</p>
                                <span className="text-[9px] text-slate-400">
                                  {vendorPromoDraft.tiers.length === 1 ? 'ใส่ขั้นเดียว = โปรไม่มี step' : `${vendorPromoDraft.tiers.length} ขั้น`}
                                </span>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-[10px]">
                                  <thead>
                                    <tr className="text-slate-500">
                                      <th className="px-1.5 py-0.5 text-left font-semibold">ขั้น</th>
                                      <th className="px-1.5 py-0.5 text-right font-semibold">สั่งขั้นต่ำ</th>
                                      <th className="px-1.5 py-0.5 text-right font-semibold">ลดเพิ่ม %</th>
                                      <th className="px-1.5 py-0.5 text-right font-semibold">แถม (ชิ้น)</th>
                                      <th className="w-6" />
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {vendorPromoDraft.tiers.map((t, i) => (
                                      <tr key={i} className="border-t border-blue-100">
                                        <td className="px-1.5 py-1 text-slate-500 font-mono">{i + 1}</td>
                                        <td className="px-1.5 py-1 text-right">
                                          <input
                                            type="number"
                                            min={1}
                                            step={1}
                                            value={t.minQty}
                                            onChange={(e) => setVendorPromoDraft((d) => d && {
                                              ...d,
                                              tiers: d.tiers.map((tt, idx) => idx === i ? { ...tt, minQty: Math.max(1, Math.floor(Number(e.target.value) || 1)) } : tt),
                                            })}
                                            className="w-20 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-right tabular-nums outline-none focus:border-blue-400"
                                          />
                                        </td>
                                        <td className="px-1.5 py-1 text-right">
                                          <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.5}
                                            value={t.extraDiscountPct}
                                            onChange={(e) => setVendorPromoDraft((d) => d && {
                                              ...d,
                                              tiers: d.tiers.map((tt, idx) => idx === i ? { ...tt, extraDiscountPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) } : tt),
                                            })}
                                            className="w-16 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-right tabular-nums outline-none focus:border-blue-400"
                                          />
                                        </td>
                                        <td className="px-1.5 py-1 text-right">
                                          <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={t.freeQty}
                                            onChange={(e) => setVendorPromoDraft((d) => d && {
                                              ...d,
                                              tiers: d.tiers.map((tt, idx) => idx === i ? { ...tt, freeQty: Math.max(0, Math.floor(Number(e.target.value) || 0)) } : tt),
                                            })}
                                            className="w-16 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-right tabular-nums outline-none focus:border-blue-400"
                                          />
                                        </td>
                                        <td className="px-1 py-1 text-center">
                                          {vendorPromoDraft.tiers.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => setVendorPromoDraft((d) => d && {
                                                ...d,
                                                tiers: d.tiers.filter((_, idx) => idx !== i),
                                              })}
                                              className="rounded p-0.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                                              title="ลบขั้นนี้"
                                            >
                                              <X className="size-3" />
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <button
                                type="button"
                                onClick={() => setVendorPromoDraft((d) => {
                                  if (!d) return d
                                  const last = d.tiers[d.tiers.length - 1]
                                  return {
                                    ...d,
                                    tiers: [...d.tiers, { minQty: (last?.minQty ?? 0) + 50, extraDiscountPct: 0, freeQty: 0 }],
                                  }
                                })}
                                className="mt-1.5 inline-flex items-center gap-1 rounded border border-blue-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"
                              >
                                <Plus className="size-3" /> เพิ่มขั้น
                              </button>
                            </div>

                            <div className="mt-2 flex items-center gap-1.5">
                              <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-medium text-slate-700">
                                <input type="checkbox" checked={vendorPromoDraft.enabled}
                                  onChange={(e) => setVendorPromoDraft((d) => d && { ...d, enabled: e.target.checked })}
                                  className="size-3 rounded" />
                                เปิดใช้งาน
                              </label>
                              <div className="flex-1" />
                              <button type="button" onClick={() => setVendorPromoDraft(null)}
                                className="rounded border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50">
                                ยกเลิก
                              </button>
                              <button type="button" onClick={() => {
                                const sorted = { ...vendorPromoDraft, tiers: [...vendorPromoDraft.tiers].sort((a, b) => a.minQty - b.minQty) }
                                savePromo(sorted)
                              }}
                                className="rounded border border-blue-500/30 bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-blue-700">
                                บันทึก
                              </button>
                            </div>
                          </div>
                        )}

                        {supplierPromos.length === 0 && !vendorPromoDraft ? (
                          <p className="text-[11px] text-blue-600/70">ยังไม่มีโปร — กด «เพิ่มโปร» เพื่อตั้งเงื่อนไขส่วนลดตามจำนวนสั่ง</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {supplierPromos.map((vp) => {
                              const prod = allProducts.find((p) => p.id === vp.productId)
                              const prodLabel = prod ? `${prod.sku} — ${prod.name}` : vp.productId
                              const supLabel = vp.supplierId
                                ? (suppliers.find((s) => s.id === vp.supplierId)?.name ?? vp.supplierId)
                                : 'ทุก supplier'
                              return (
                                <li key={vp.id} className="flex items-start gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-[11px]">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-800">{vp.name}</p>
                                    <p className="text-[10px] text-slate-500">
                                      {prodLabel} · จาก {supLabel} · {[...vp.tiers].sort((a, b) => a.minQty - b.minQty).map((t) => `${t.minQty}+:${t.extraDiscountPct > 0 ? `-${t.extraDiscountPct}%` : ''}${t.freeQty > 0 ? `แถม${t.freeQty}` : ''}`).join(' ')}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      {vp.startDate} → {vp.endDate} · <span className={vp.enabled ? 'text-emerald-600' : 'text-slate-400'}>{vp.enabled ? 'เปิด' : 'ปิด'}</span>
                                    </p>
                                  </div>
                                  {!isEditing(vp.id) && (
                                    <div className="flex shrink-0 gap-1">
                                      <button type="button" onClick={() => setVendorPromoDraft({ ...vp })}
                                        className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800 hover:bg-blue-100">แก้ไข</button>
                                      <button type="button" onClick={() => deletePromo(vp.id)}
                                        className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 hover:bg-red-100">ลบ</button>
                                    </div>
                                  )}
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

              {selected.status === 'draft' && (
                <>
                  <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/40 p-3">
                    <div className="relative mb-2">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={productQuery}
                        onChange={(e) => setProductQuery(e.target.value)}
                        placeholder="ค้นหา SKU / OEM / เบอร์แท้ / ชื่อสินค้า..."
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500"
                      />
                    </div>
                    {searchHits.length > 0 && (
                      <ul className="max-h-40 overflow-auto rounded border border-slate-200 bg-white text-sm shadow-sm">
                        {searchHits.map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => addLine(p)}
                              className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-amber-50"
                            >
                              <span className="font-mono text-xs text-amber-800">{p.sku}</span>
                              <span className="text-xs text-slate-700">{p.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Box Recipe Section */}
                  <div className="rounded-lg border border-dashed border-sky-300 bg-sky-50/40 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-sky-800">
                        เพิ่มจากสูตรกล่อง
                      </p>
                      <button
                        type="button"
                        onClick={() => { setBoxRecipePanelOpen((v) => !v); setEditingRecipe(null) }}
                        className="text-[11px] font-semibold text-sky-600 hover:text-sky-900"
                      >
                        {boxRecipePanelOpen ? 'ปิด' : '+ จัดการสูตร'}
                      </button>
                    </div>

                    {/* Use templates */}
                    {boxRecipes.length > 0 && !boxRecipePanelOpen && (
                      <div className="space-y-1.5">
                        {boxRecipes.map((t) => (
                          <div key={t.id} className="flex items-center gap-2 rounded-md border border-sky-100 bg-white px-2 py-1.5">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-700">{t.name}</p>
                              <p className="text-[10px] text-slate-400">
                                {t.components.map((c) => `${c.sku} ×${c.qtyPerBox}`).join(' · ')}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                step={1}
                                value={boxRecipeQtys[t.id] ?? '1'}
                                onChange={(e) => setBoxRecipeQtys((prev) => ({ ...prev, [t.id]: e.target.value }))}
                                className="w-12 rounded border border-sky-200 px-1 py-0.5 text-center text-sm"
                              />
                              <span className="text-[10px] text-slate-400">กล่อง</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const n = Math.max(1, Math.round(Number(boxRecipeQtys[t.id] ?? '1') || 1))
                                  addFromBoxRecipe(t, n)
                                }}
                                className="rounded-md bg-sky-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-sky-700"
                              >
                                ตั้งจำนวน
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {boxRecipes.length === 0 && !boxRecipePanelOpen && (
                      <p className="text-[11px] text-slate-400">ยังไม่มีสูตรกล่อง — กด «+ จัดการสูตร» เพื่อสร้าง</p>
                    )}

                    {/* Manage / edit panel */}
                    {boxRecipePanelOpen && (
                      <div className="space-y-2">
                        {/* Existing recipes list */}
                        {boxRecipes.length > 0 && (
                          <div className="space-y-1">
                            {boxRecipes.map((t) => (
                              <div key={t.id} className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1">
                                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{t.name}</span>
                                <button type="button" onClick={() => setEditingRecipe({ ...t, components: t.components.map((c) => ({ ...c })) })}
                                  className="text-[11px] text-sky-600 hover:text-sky-900">แก้ไข</button>
                                <button type="button" onClick={() => { if (window.confirm(`ลบสูตร "${t.name}"?`)) deleteBoxRecipe(t.id) }}
                                  className="text-[11px] text-rose-500 hover:text-rose-700">ลบ</button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Create / Edit form */}
                        {(() => {
                          const recipe = editingRecipe ?? { id: `br-${Date.now()}`, name: '', components: [] }
                          const isNew = !editingRecipe
                          return (
                            <div className="rounded-md border border-sky-200 bg-sky-50/50 p-2 space-y-2">
                              <p className="text-[11px] font-bold text-sky-800">{isNew ? 'สร้างสูตรใหม่' : `แก้ไข: ${editingRecipe!.name}`}</p>
                              <input
                                className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                                placeholder="ชื่อสูตร เช่น น้ำมัน 10W-40 (1 กล่อง)"
                                value={recipe.name}
                                onChange={(e) => {
                                  const n = e.target.value
                                  if (isNew) setEditingRecipe({ ...recipe, name: n })
                                  else setEditingRecipe((prev) => prev ? { ...prev, name: n } : null)
                                }}
                              />
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 pb-0.5">
                                  <span className="w-20 text-[9px] font-semibold text-slate-400">SKU</span>
                                  <span className="w-12 text-[9px] font-semibold text-sky-500">ป้ายขนาด</span>
                                  <span className="w-12 text-[9px] font-semibold text-slate-400">ชิ้น/กล่อง</span>
                                </div>
                                {recipe.components.map((comp, ci) => (
                                  <div key={ci} className="flex items-center gap-1">
                                    <SkuCombobox
                                      value={comp.sku}
                                      onChange={(v) => {
                                        setEditingRecipe((prev) => {
                                          if (!prev) return { ...recipe, components: recipe.components.map((c, j) => j === ci ? { ...c, sku: v } : c) }
                                          return { ...prev, components: prev.components.map((c, j) => j === ci ? { ...c, sku: v } : c) }
                                        })
                                      }}
                                      onSelect={(sku, name) => {
                                        const autoLabel = name.match(/(\d+\s*[lLmMkKgG]+)/)?.[1]?.replace(/\s/g, '') ?? ''
                                        setEditingRecipe((prev) => {
                                          const base = prev ?? recipe
                                          return { ...base, components: base.components.map((c, j) => j === ci ? { ...c, sku, label: c.label || autoLabel } : c) }
                                        })
                                      }}
                                    />
                                    <input
                                      className="w-12 rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-center text-xs"
                                      placeholder="ขนาด"
                                      value={comp.label ?? ''}
                                      onChange={(e) => {
                                        const v = e.target.value
                                        setEditingRecipe((prev) => {
                                          if (!prev) return { ...recipe, components: recipe.components.map((c, j) => j === ci ? { ...c, label: v } : c) }
                                          return { ...prev, components: prev.components.map((c, j) => j === ci ? { ...c, label: v } : c) }
                                        })
                                      }}
                                    />
                                    <input
                                      type="number" min={1} step={1}
                                      className="w-12 rounded border border-slate-200 px-1 py-0.5 text-right text-xs"
                                      value={comp.qtyPerBox}
                                      onChange={(e) => {
                                        const v = Math.max(1, Number(e.target.value) || 1)
                                        setEditingRecipe((prev) => {
                                          if (!prev) return { ...recipe, components: recipe.components.map((c, j) => j === ci ? { ...c, qtyPerBox: v } : c) }
                                          return { ...prev, components: prev.components.map((c, j) => j === ci ? { ...c, qtyPerBox: v } : c) }
                                        })
                                      }}
                                    />
                                    <span className="text-[10px] text-slate-400">ชิ้น/กล่อง</span>
                                    <button type="button"
                                      onClick={() => setEditingRecipe((prev) => {
                                        const base = prev ?? recipe
                                        return { ...base, components: base.components.filter((_, j) => j !== ci) }
                                      })}
                                      className="text-slate-300 hover:text-rose-500"><X className="size-3" /></button>
                                  </div>
                                ))}
                                <button type="button"
                                  onClick={() => setEditingRecipe((prev) => {
                                    const base = prev ?? recipe
                                    return { ...base, components: [...base.components, { sku: '', qtyPerBox: 1, label: '' }] }
                                  })}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-900">
                                  <Plus className="size-3" /> เพิ่มส่วนประกอบ
                                </button>
                              </div>
                              <div className="flex gap-2">
                                <button type="button"
                                  onClick={() => {
                                    const toSave = editingRecipe ?? recipe
                                    if (!toSave.name.trim()) return
                                    upsertBoxRecipe({ ...toSave, id: toSave.id || `br-${Date.now()}` })
                                    setEditingRecipe(null)
                                    if (isNew) setBoxRecipePanelOpen(false)
                                  }}
                                  className="rounded-md bg-sky-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-sky-700">
                                  บันทึก
                                </button>
                                {!isNew && (
                                  <button type="button" onClick={() => setEditingRecipe(null)}
                                    className="rounded-md border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
                                    ยกเลิก
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  {/* VAT mode */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">ราคาจากผู้ขาย</span>
                    {(
                      [
                        { mode: 'excluded' as PoVatMode, label: '+ VAT', hint: 'ราคายังไม่รวม VAT' },
                        { mode: 'included' as PoVatMode, label: 'รวม VAT', hint: 'ราคารวม VAT แล้ว' },
                        { mode: 'none'     as PoVatMode, label: 'ไม่มี VAT', hint: 'ไม่มี VAT' },
                      ]
                    ).map(({ mode, label, hint }) => {
                      const active = (selected.vatMode ?? 'excluded') === mode
                      return (
                        <button
                          key={mode}
                          type="button"
                          title={hint}
                          disabled={selected.status === 'closed'}
                          onClick={() => updateSelected({ ...selected, vatMode: mode })}
                          className={clsx(
                            'rounded px-2 py-0.5 text-[11px] font-semibold transition disabled:cursor-not-allowed',
                            active
                              ? mode === 'included'
                                ? 'bg-violet-600 text-white shadow-sm'
                                : mode === 'none'
                                ? 'bg-slate-600 text-white shadow-sm'
                                : 'bg-amber-500 text-white shadow-sm'
                              : 'bg-white text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-100 disabled:opacity-40',
                          )}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>

                  {/* VAT rate — hidden when 'none' */}
                  {resolvedVatMode(selected) !== 'none' && (
                    <label className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">อัตรา VAT</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={selected.vatRatePercent}
                        disabled={selected.status === 'closed'}
                        onChange={(e) =>
                          updateSelected({
                            ...selected,
                            vatRatePercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                          })
                        }
                        className="w-14 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-center text-sm font-semibold disabled:bg-slate-100"
                      />
                      <span className="text-[11px] text-slate-500">%</span>
                    </label>
                  )}

                  {/* Contextual hint */}
                  <span className="ml-auto text-[10px] text-slate-400">
                    {resolvedVatMode(selected) === 'excluded' && selected.vatRatePercent > 0 &&
                      `ต้นทุนสต็อก = ราคา + ${selected.vatRatePercent}% VAT`}
                    {resolvedVatMode(selected) === 'included' && selected.vatRatePercent > 0 &&
                      `ต้นทุนสต็อก = ราคา ÷ ${(1 + selected.vatRatePercent / 100).toFixed(2)} (ก่อน VAT)`}
                    {resolvedVatMode(selected) === 'none' && 'ไม่คิด VAT — ต้นทุนสต็อก = ราคาที่ใส่'}
                  </span>
                </div>

                {(() => {
                  if (!selected.lines.length) return null
                  type Suggestion = {
                    line: typeof selected.lines[number]
                    vp: typeof vendorPromos[number]
                    gap: number
                    next: ReturnType<typeof findNextVendorPromoTier>
                  }
                  const suggestions: Suggestion[] = []
                  const reachedSet = new Set<string>()
                  const allActiveSet = new Set<string>()
                  for (const l of selected.lines) {
                    const master = getProductMasterById(l.productId)
                    const promos = findActiveVendorPromos(
                      vendorPromos,
                      l.productId,
                      selected.supplierId,
                      master?.brand ?? '',
                      master?.category ?? '',
                    )
                    for (const vp of promos) {
                      allActiveSet.add(vp.id)
                      const best = findBestVendorPromoTier(vp, l.orderedQty)
                      if (best) reachedSet.add(vp.id)
                      const next = findNextVendorPromoTier(vp, l.orderedQty)
                      if (!next) continue
                      const gap = next.minQty - l.orderedQty
                      if (gap <= 0 || gap > Math.max(5, l.orderedQty)) continue
                      suggestions.push({ line: l, vp, gap, next })
                    }
                  }
                  if (allActiveSet.size === 0) return null
                  const reached = reachedSet.size
                  const total = allActiveSet.size
                  return (
                    <div className="mb-3 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50/60 to-blue-50/40 px-3 py-2">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                          🏷 โปรซัพ — {reached}/{total} ใช้แล้ว
                        </p>
                        {suggestions.length > 0 && (
                          <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[9px] font-bold text-white">
                            {suggestions.length} คำแนะนำ
                          </span>
                        )}
                      </div>
                      {suggestions.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {suggestions.slice(0, 8).map((s, idx) => (
                            <div key={`${s.line.lineId}-${s.vp.id}-${idx}`} className="flex flex-wrap items-center gap-2 text-[11px]">
                              <span className="font-mono font-semibold text-slate-600">{s.line.sku}</span>
                              <span className="text-slate-700">+{s.gap} ชิ้น</span>
                              <span className="text-slate-400">→</span>
                              <span className="font-semibold text-amber-700">
                                {s.next!.extraDiscountPct > 0 ? `-${s.next!.extraDiscountPct}%` : ''}
                                {s.next!.freeQty > 0 ? ` แถม ${s.next!.freeQty}` : ''}
                              </span>
                              <span className="truncate text-[9px] text-slate-400" title={s.vp.name}>({s.vp.name})</span>
                              {selected.status === 'draft' && (
                                <button
                                  type="button"
                                  className="ml-auto shrink-0 rounded-md bg-amber-600 px-2 py-0.5 text-[9px] font-bold text-white hover:bg-amber-700"
                                  onClick={() => {
                                    const newQty = s.next!.minQty
                                    const cost = calcEffectiveCost(s.line.listPrice, s.line.discountChain, s.line.bonusPaidQty, s.line.bonusFreeQty, newQty, s.line.unitCostOrder, s.line.bonusPct)
                                    patchLine(s.line.lineId, { orderedQty: newQty, ...((s.line.listPrice ?? 0) > 0 ? { unitCostOrder: cost } : {}) })
                                  }}
                                  title={`ปรับ ${s.line.sku} เป็น ${s.next!.minQty} ชิ้น`}
                                >
                                  ปรับเป็น {s.next!.minQty}
                                </button>
                              )}
                            </div>
                          ))}
                          {suggestions.length > 8 && (
                            <p className="mt-0.5 text-[9px] text-slate-400">…และอีก {suggestions.length - 8} รายการ</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500">
                          {reached === total
                            ? '✓ ใช้โปรซัพครบแล้วทุกรายการ'
                            : 'รายการที่กรอกอยู่ยังไม่อยู่ในระยะที่แนะนำเพิ่ม — ดูโปรในแต่ละบรรทัด'}
                        </p>
                      )}
                    </div>
                  )
                })()}

                <h3 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-slate-500">
                  <FileEdit className="size-3.5" aria-hidden />
                  รายการสินค้า
                </h3>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[700px] text-xs">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-2 py-2" />
                        <th className="px-2 py-2 text-left">SKU</th>
                        <th className="px-2 py-2 text-left">ชื่อ</th>
                        <th className="px-2 py-2 text-right">สั่ง</th>
                        <th className="px-2 py-2 text-right">ต้นทุน/หน่วย</th>
                        <th className="px-2 py-2 text-right">รับแล้ว</th>
                        <th className="px-2 py-2 text-right">ค้างรับ</th>
                        {selected.receiveBatches.some((b) => b.lines.some((ln) => (ln.shortageQty ?? 0) > 0)) && (
                          <th className="px-2 py-2 text-right text-rose-600">ขาด/เสียหาย</th>
                        )}
                        <th className="px-2 py-2 text-center">โปร</th>
                        {selected.status === 'draft' && <th className="px-2 py-2" />}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.lines.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                            {selected.status === 'draft' ? 'ค้นหาและเพิ่มสินค้า — ยังไม่กระทบสต็อก' : 'ไม่มีรายการ'}
                          </td>
                        </tr>
                      ) : (
                        selected.lines.map((l) => {
                          const promoOpen = expandedPromo.has(l.lineId)
                          const promo = calcPromo(l)
                          const promoActive = hasPromo(l)
                          return (
                            <>
                              <tr key={l.lineId} className="border-t border-slate-100">
                                <td className="px-2 py-1.5">
                                  <ProductImage sku={l.sku} size="xs" zoomable />
                                </td>
                                <td className="px-2 py-2 font-mono">{l.sku}</td>
                                <td className="max-w-[14rem] px-2 py-2">
                                  <p className="truncate">{l.name}</p>
                                  {promoActive && !promoOpen && (
                                    <p className="mt-0.5 text-[10px] text-violet-600 font-semibold">
                                      {l.discountChain && `ลด ${l.discountChain}%`}
                                      {l.discountChain && (l.bonusFreeQty ?? 0) > 0 && ' · '}
                                      {(l.bonusFreeQty ?? 0) > 0 && `${l.bonusPaidQty}+${l.bonusFreeQty}`}
                                      {' → ฿'}{promo.trueCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    </p>
                                  )}
                                </td>
                                <td className="px-2 py-2 text-right">
                                  {(() => {
                                    const lineMaster = getProductMasterBySku(l.sku)
                                    const ppb = lineMaster?.piecesPerBox
                                    const isEditable = selected.status === 'draft' || (selected.status === 'ordered' && selected.receiveBatches.length === 0)
                                    return (
                                      <div className="flex flex-col items-end gap-0.5">
                                        {ppb ? (
                                          <div className="flex items-center gap-1">
                                            <input
                                              type="number"
                                              min={1}
                                              step={1}
                                              value={l.orderBoxCount ?? (Math.round(l.orderedQty / ppb) || 1)}
                                              disabled={!isEditable}
                                              onChange={(e) => {
                                                const boxes = Math.max(1, Math.round(Number(e.target.value) || 1))
                                                patchLine(l.lineId, { orderBoxCount: boxes, orderedQty: boxes * ppb })
                                              }}
                                              className="w-14 rounded border border-sky-200 bg-sky-50/60 px-1 py-0.5 text-right disabled:opacity-60"
                                            />
                                            <span className="text-[10px] text-slate-400">กล่อง</span>
                                          </div>
                                        ) : l.orderBoxCount ? (
                                          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                                            {l.orderBoxCount} กล่อง
                                          </span>
                                        ) : null}
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            min={selected.status === 'draft' ? 1 : Math.max(1, l.receivedQtyTotal)}
                                            step="any"
                                            value={l.orderedQty}
                                            disabled={!isEditable}
                                            onChange={(e) => {
                                              const qty = selected.status === 'draft'
                                                ? Math.max(1, Number(e.target.value) || 1)
                                                : Number.parseFloat(e.target.value) || 0
                                              patchLine(l.lineId, { orderedQty: qty, orderBoxCount: undefined })
                                            }}
                                            className="w-16 rounded border px-1 py-0.5 text-right disabled:opacity-60"
                                          />
                                          {ppb && <span className="text-[10px] text-slate-400">ชิ้น</span>}
                                        </div>
                                      </div>
                                    )
                                  })()}
                                </td>
                                <td className="px-2 py-2 text-right">
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={l.unitCostOrder}
                                    onChange={(e) =>
                                      patchLine(l.lineId, {
                                        unitCostOrder: Math.max(0, Number.parseFloat(e.target.value) || 0),
                                      })
                                    }
                                    className="w-24 rounded border px-1 py-0.5 text-right"
                                  />
                                  {resolvedVatMode(selected) === 'included' && selected.vatRatePercent > 0 && l.unitCostOrder > 0 && (
                                    <p className="mt-0.5 text-[9px] text-violet-600">
                                      ก่อน VAT ฿{exVatUnitCost(l.unitCostOrder, selected).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    </p>
                                  )}
                                </td>
                                <td className="px-2 py-2 text-right">
                                  {selected.status === 'ordered' || selected.status === 'closed' ? (
                                    <>
                                      <input
                                        type="number"
                                        min={0}
                                        step="any"
                                        value={l.receivedQtyTotal}
                                        onChange={(e) =>
                                          patchReceivedTotal(l.lineId, Number.parseFloat(e.target.value) || 0)
                                        }
                                        className="w-16 rounded border px-1 py-0.5 text-right tabular-nums"
                                      />
                                      {l.receivedQtyTotal > l.orderedQty + 1e-6 && (
                                        <p className="text-[9px] font-semibold text-orange-600">⬆ เกินสั่ง</p>
                                      )}
                                    </>
                                  ) : (
                                    <span className="tabular-nums">{l.receivedQtyTotal}</span>
                                  )}
                                </td>
                                <td className="px-2 py-2 text-right tabular-nums">
                                  <span className={lineBackorder(l) > 0 ? 'font-semibold text-amber-700' : ''}>
                                    {lineBackorder(l)}
                                  </span>
                                </td>
                                {selected.receiveBatches.some((b) => b.lines.some((ln) => (ln.shortageQty ?? 0) > 0)) && (
                                  <td className="px-2 py-2 text-right tabular-nums">
                                    {(() => {
                                      const s = lineShortageTotal(selected, l.lineId)
                                      return s > 0
                                        ? <span className="font-semibold text-rose-600">{s}</span>
                                        : <span className="text-slate-300">—</span>
                                    })()}
                                  </td>
                                )}
                                <td className="px-2 py-2 text-center">
                                  {(() => {
                                    const masterForBadge = getProductMasterById(l.productId)
                                    const availablePromos = findActiveVendorPromos(
                                      vendorPromos,
                                      l.productId,
                                      selected.supplierId,
                                      masterForBadge?.brand ?? '',
                                      masterForBadge?.category ?? '',
                                    )
                                    const hasAvailable = availablePromos.length > 0
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const opening = !expandedPromo.has(l.lineId)
                                          togglePromo(l.lineId)
                                          if (opening && !hasPromo(l)) {
                                            const master = getProductMasterById(l.productId)
                                            if (master) {
                                              const sp = master.supplierListPrice ?? 0
                                              const dc = master.poLastDiscountChain
                                              const bp = master.poLastBonusPaid
                                              const bf = master.poLastBonusFree
                                              const bpct = master.poLastBonusPct
                                              const patch: Record<string, unknown> = {}
                                              if (sp > 0) patch.listPrice = sp
                                              if (dc) patch.discountChain = dc
                                              if (bpct && bpct > 0) {
                                                patch.bonusPct = bpct
                                              } else {
                                                if (bp) patch.bonusPaidQty = bp
                                                if (bf) patch.bonusFreeQty = bf
                                              }
                                              if (Object.keys(patch).length > 0) {
                                                const cost = calcEffectiveCost(
                                                  (patch.listPrice as number | undefined) ?? l.listPrice,
                                                  (patch.discountChain as string | undefined) ?? l.discountChain,
                                                  (patch.bonusPaidQty as number | undefined) ?? l.bonusPaidQty,
                                                  (patch.bonusFreeQty as number | undefined) ?? l.bonusFreeQty,
                                                  l.orderedQty,
                                                  l.unitCostOrder,
                                                  (patch.bonusPct as number | undefined) ?? l.bonusPct,
                                                )
                                                patchLine(l.lineId, { ...patch, unitCostOrder: cost })
                                              }
                                            }
                                          }
                                        }}
                                        title={hasAvailable ? `มีโปรซัพ ${availablePromos.length} รายการ — กดดู` : 'โปรโมชั่น / สินค้าแถม'}
                                        className={clsx(
                                          'relative inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold transition',
                                          promoActive
                                            ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                                            : hasAvailable
                                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 ring-1 ring-blue-300'
                                              : 'bg-slate-100 text-slate-500 hover:bg-violet-50 hover:text-violet-600',
                                        )}
                                      >
                                        <Tag className="size-2.5" />
                                        โปร
                                        {hasAvailable && !promoActive && (
                                          <span className="ml-0.5 rounded-full bg-blue-600 px-1 text-[8px] font-black text-white">
                                            {availablePromos.length}
                                          </span>
                                        )}
                                        <ChevronDown className={clsx('size-2.5 transition-transform', promoOpen && 'rotate-180')} />
                                      </button>
                                    )
                                  })()}
                                </td>
                                {selected.status === 'draft' && (
                                  <td className="px-2 py-2">
                                    <button
                                      type="button"
                                      onClick={() => removeLine(l.lineId)}
                                      className="text-rose-600 hover:underline"
                                    >
                                      ลบ
                                    </button>
                                  </td>
                                )}
                              </tr>

                              {promoOpen && (
                                <tr key={`${l.lineId}-promo`} className="border-t border-violet-100 bg-violet-50/40">
                                  <td colSpan={selected.status === 'draft' ? 9 : 8} className="px-4 py-3">
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-violet-500">คำนวณต้นทุนจากราคาตั้ง → ส่วนลด → VAT</p>
                                    {(() => {
                                      const masterForPromo = getProductMasterById(l.productId)
                                      const allActive = findActiveVendorPromos(
                                        vendorPromos,
                                        l.productId,
                                        selected.supplierId,
                                        masterForPromo?.brand ?? '',
                                        masterForPromo?.category ?? '',
                                      )
                                      if (allActive.length === 0) return null
                                      return (
                                        <div className="mb-2 flex flex-wrap gap-1.5">
                                          {allActive.map((vp) => {
                                            const bestTier = findBestVendorPromoTier(vp, l.orderedQty)
                                            const nextTier = findNextVendorPromoTier(vp, l.orderedQty)
                                            const discPct = bestTier?.extraDiscountPct ?? 0
                                            const freeQty = bestTier?.freeQty ?? 0
                                            const alreadyApplied = discPct > 0 && (l.discountChain ?? '').split('+').includes(String(discPct))
                                            const reached = bestTier !== null
                                            const gap = nextTier ? Math.max(0, nextTier.minQty - l.orderedQty) : 0
                                            return (
                                              <div
                                                key={vp.id}
                                                className={clsx(
                                                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold',
                                                  reached
                                                    ? 'border-blue-200 bg-blue-50 text-blue-800'
                                                    : 'border-amber-200 bg-amber-50 text-amber-800',
                                                )}
                                              >
                                                <span>
                                                  {vp.name}
                                                  {reached && discPct > 0 && ` +${discPct}%`}
                                                  {reached && freeQty > 0 && ` แถม ${freeQty} ชิ้น`}
                                                </span>
                                                {!reached && nextTier && (
                                                  <span className="text-[9px] text-amber-700">
                                                    💡 อีก {gap} ชิ้น →{nextTier.extraDiscountPct > 0 ? ` -${nextTier.extraDiscountPct}%` : ''}{nextTier.freeQty > 0 ? ` แถม ${nextTier.freeQty}` : ''}
                                                  </span>
                                                )}
                                                {!reached && nextTier && selected.status === 'draft' && (
                                                  <button
                                                    type="button"
                                                    className="rounded-md bg-amber-600 px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-amber-700"
                                                    onClick={() => {
                                                      const newQty = nextTier.minQty
                                                      const cost = calcEffectiveCost(l.listPrice, l.discountChain, l.bonusPaidQty, l.bonusFreeQty, newQty, l.unitCostOrder, l.bonusPct)
                                                      patchLine(l.lineId, { orderedQty: newQty, ...((l.listPrice ?? 0) > 0 ? { unitCostOrder: cost } : {}) })
                                                    }}
                                                    title={`ปรับจำนวนเป็น ${nextTier.minQty} เพื่อรับโปร`}
                                                  >
                                                    +{gap}
                                                  </button>
                                                )}
                                                {reached && discPct > 0 && !alreadyApplied && (
                                                  <button
                                                    type="button"
                                                    className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-blue-700"
                                                    onClick={() => {
                                                      const base = l.discountChain?.trim()
                                                      const newChain = base ? `${base}+${discPct}` : String(discPct)
                                                      const cost = calcEffectiveCost(l.listPrice, newChain, l.bonusPaidQty, l.bonusFreeQty, l.orderedQty, l.unitCostOrder, l.bonusPct)
                                                      patchLine(l.lineId, { discountChain: newChain, ...((l.listPrice ?? 0) > 0 ? { unitCostOrder: cost } : {}) })
                                                    }}
                                                  >
                                                    ใช้โปร
                                                  </button>
                                                )}
                                                {reached && alreadyApplied && (
                                                  <span className="text-[9px] text-blue-500">✓ ใช้แล้ว</span>
                                                )}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )
                                    })()}
                                    <div className="flex flex-wrap items-start gap-3">

                                      {/* Step 1: List price */}
                                      <label className="flex flex-col gap-1 text-[10px] font-semibold text-slate-600">
                                        <span className="flex items-center gap-1">
                                          <span className="inline-flex size-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-black text-white">1</span>
                                          ราคาตั้ง (฿)
                                        </span>
                                        <input
                                          type="number"
                                          min={0}
                                          step={0.01}
                                          value={l.listPrice ?? ''}
                                          placeholder={String(l.unitCostOrder)}
                                          onChange={(e) => {
                                            const listPrice = Number.parseFloat(e.target.value) || undefined
                                            const cost = calcEffectiveCost(listPrice, l.discountChain, l.bonusPaidQty, l.bonusFreeQty, l.orderedQty, l.unitCostOrder, l.bonusPct)
                                            patchLine(l.lineId, { listPrice, ...(listPrice != null ? { unitCostOrder: cost } : {}) })
                                            savePoLastPromo(l.productId, listPrice, l.discountChain, l.bonusPaidQty, l.bonusFreeQty, l.bonusPct)
                                          }}
                                          className="w-24 rounded border border-violet-300 bg-white px-2 py-1.5 text-right text-xs font-bold outline-none focus:border-violet-500"
                                        />
                                      </label>

                                      <span className="mt-5 text-lg text-violet-300">→</span>

                                      {/* Step 2: Discount chain */}
                                      <div className="flex flex-col gap-1 text-[10px] font-semibold text-slate-600">
                                        <span className="flex items-center gap-1">
                                          <span className="inline-flex size-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-black text-white">2</span>
                                          ส่วนลด % (เช่น 45+10)
                                        </span>
                                        <input
                                          type="text"
                                          value={l.discountChain ?? ''}
                                          placeholder="เช่น 45+10+5"
                                          onChange={(e) => {
                                            const discountChain = e.target.value.trim() || undefined
                                            const cost = calcEffectiveCost(l.listPrice, discountChain, l.bonusPaidQty, l.bonusFreeQty, l.orderedQty, l.unitCostOrder, l.bonusPct)
                                            patchLine(l.lineId, { discountChain, ...((l.listPrice ?? 0) > 0 ? { unitCostOrder: cost } : {}) })
                                            savePoLastPromo(l.productId, l.listPrice, discountChain, l.bonusPaidQty, l.bonusFreeQty, l.bonusPct)
                                          }}
                                          className="w-28 rounded border border-violet-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-violet-400"
                                        />
                                        {l.discountChain && parseChain(l.discountChain).length > 0 && (
                                          <span className="text-[9px] text-violet-500 font-normal">
                                            ลดรวม {effectivePct(l.discountChain)}%
                                          </span>
                                        )}
                                      </div>

                                      <span className="mt-5 text-lg text-violet-300">→</span>

                                      {/* Step 3: Bonus */}
                                      <div className="flex flex-col gap-1 text-[10px] font-semibold text-slate-600">
                                        <span className="flex items-center gap-1">
                                          <span className="inline-flex size-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-black text-white">3</span>
                                          สินค้าแถม
                                        </span>
                                        {/* Buy+get cycle */}
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            min={0}
                                            value={l.bonusPaidQty ?? ''}
                                            placeholder="ซื้อ"
                                            onChange={(e) => {
                                              const bonusPaidQty = Math.floor(Number(e.target.value)) || undefined
                                              const cost = calcEffectiveCost(l.listPrice, l.discountChain, bonusPaidQty, l.bonusFreeQty, l.orderedQty, l.unitCostOrder)
                                              patchLine(l.lineId, { bonusPaidQty, bonusPct: undefined, ...((l.listPrice ?? 0) > 0 ? { unitCostOrder: cost } : {}) })
                                              savePoLastPromo(l.productId, l.listPrice, l.discountChain, bonusPaidQty, l.bonusFreeQty, undefined)
                                            }}
                                            className="w-14 rounded border border-violet-200 bg-white px-2 py-1 text-center text-xs outline-none focus:border-violet-400"
                                          />
                                          <span className="text-slate-400">+</span>
                                          <input
                                            type="number"
                                            min={0}
                                            value={l.bonusFreeQty ?? ''}
                                            placeholder="แถม"
                                            onChange={(e) => {
                                              const bonusFreeQty = Math.floor(Number(e.target.value)) || undefined
                                              const cost = calcEffectiveCost(l.listPrice, l.discountChain, l.bonusPaidQty, bonusFreeQty, l.orderedQty, l.unitCostOrder)
                                              patchLine(l.lineId, { bonusFreeQty, bonusPct: undefined, ...((l.listPrice ?? 0) > 0 ? { unitCostOrder: cost } : {}) })
                                              savePoLastPromo(l.productId, l.listPrice, l.discountChain, l.bonusPaidQty, bonusFreeQty, undefined)
                                            }}
                                            className="w-14 rounded border border-violet-200 bg-white px-2 py-1 text-center text-xs outline-none focus:border-violet-400"
                                          />
                                        </div>
                                      </div>

                                      {/* Result card */}
                                      <div className="min-w-[220px] flex-1 rounded-lg border border-violet-200 bg-white px-4 py-3 space-y-1.5">
                                        {/* Calculation chain */}
                                        {(l.listPrice ?? 0) > 0 && (
                                          <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
                                            <span className="font-bold text-slate-700">
                                              ฿{l.listPrice!.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                                            </span>
                                            {l.discountChain && parseChain(l.discountChain).map((d, i) => (
                                              <span key={i} className="text-violet-600">× {(100 - d).toFixed(0)}%</span>
                                            ))}
                                            {(l.discountChain || promo.freeUnits > 0) && (
                                              <>
                                                <span className="text-slate-300">→</span>
                                                <span className="font-bold text-slate-700">
                                                  ฿{promo.afterDiscount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        )}
                                        {promo.freeUnits > 0 && (
                                          <p className="text-[10px] text-slate-500">
                                            แถม <span className="font-bold text-emerald-700">{promo.freeUnits} ชิ้น</span>
                                            {' '}(รวม {l.orderedQty + promo.freeUnits} ชิ้น)
                                          </p>
                                        )}
                                        {resolvedVatMode(selected) !== 'none' && selected.vatRatePercent > 0 && promo.trueCost > 0 && (
                                          <p className="text-[10px] text-slate-400">
                                            {resolvedVatMode(selected) === 'included'
                                              ? `ก่อน VAT ${selected.vatRatePercent}%: ฿${exVatUnitCost(promo.trueCost, selected).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                                              : `รวม VAT ${selected.vatRatePercent}%: ฿${(promo.trueCost * (1 + selected.vatRatePercent / 100)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                                            }
                                          </p>
                                        )}
                                        <div className="border-t border-violet-100 pt-1.5">
                                          <p className="text-[9px] text-slate-400">ต้นทุนสุทธิ/ชิ้น</p>
                                          <p className="text-lg font-black text-violet-700">
                                            ฿{promo.trueCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                          </p>
                                          {(l.listPrice ?? 0) > 0 && (
                                            <p className="text-[9px] font-semibold text-emerald-600">✓ อัปเดตต้นทุนอัตโนมัติ</p>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                          ยอดจ่ายรวม: ฿{promo.totalPaid.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                        </p>
                                      </div>

                                      {/* Action strip: save as vendor promo + clear */}
                                      <div className="mt-5 flex flex-col items-stretch gap-1">
                                        {hasPromo(l) && selected.status === 'draft' && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const today = new Date().toISOString().slice(0, 10)
                                              const endDate = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
                                              const firstPct = l.discountChain ? (parseChain(l.discountChain)[0] ?? 0) : 0
                                              const minQty = Math.max(1, Math.floor(l.bonusPaidQty ?? 1))
                                              const freeQty = Math.max(0, Math.floor(l.bonusFreeQty ?? 0))
                                              const supName = selected.supplierName || 'ซัพ'
                                              const chainLabel = l.discountChain ? ` ${l.discountChain}%` : ''
                                              const bonusLabel = freeQty > 0 ? ` ซื้อ${minQty}แถม${freeQty}` : ''
                                              setVendorPromoDraft({
                                                id: `vp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                                                name: `${supName} — ${l.sku}${chainLabel}${bonusLabel}`,
                                                enabled: true,
                                                startDate: today,
                                                endDate,
                                                productId: l.productId,
                                                brand: '',
                                                category: '',
                                                supplierId: selected.supplierId,
                                                tiers: [{
                                                  minQty,
                                                  extraDiscountPct: firstPct,
                                                  freeQty,
                                                }],
                                              })
                                              setVendorPromoOpen(true)
                                              window.scrollTo({ top: 0, behavior: 'smooth' })
                                            }}
                                            className="inline-flex items-center justify-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
                                            title="บันทึกโปรนี้เป็น Vendor Promotion ถาวร — กรอกชื่อ/วันที่ในแผงด้านบน"
                                          >
                                            💾 บันทึกเป็นโปรซัพ
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            patchLine(l.lineId, {
                                              listPrice: undefined,
                                              discountChain: undefined,
                                              bonusPaidQty: undefined,
                                              bonusFreeQty: undefined,
                                            })
                                          }
                                          className="text-[10px] text-slate-400 hover:text-rose-500"
                                        >
                                          ล้างโปร
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          )
                        })
                      )}
                    </tbody>
                    {selected.lines.length > 0 && (() => {
                      const ftOrderedQty  = selected.lines.reduce((s, l) => s + lineTotalExpected(l), 0)
                      const ftReceivedQty = selected.lines.reduce((s, l) => s + l.receivedQtyTotal, 0)
                      const ftBackorder   = selected.lines.reduce((s, l) => s + lineBackorder(l), 0)
                      const sub           = orderedSubtotal(selected)
                      const vat           = vatAmount(selected)
                      const showVat       = resolvedVatMode(selected) !== 'none' && selected.vatRatePercent > 0
                      return (
                        <tfoot>
                          <tr className="border-t-2 border-slate-200 bg-slate-50/80 text-xs">
                            <td className="px-2 py-2" />
                            <td className="px-2 py-2" />
                            <td className="px-2 py-2 font-semibold text-slate-500">
                              รวม {selected.lines.length} รายการ
                            </td>
                            <td className="px-2 py-2 text-right font-bold tabular-nums text-slate-800">
                              {ftOrderedQty.toLocaleString('th-TH')}
                            </td>
                            <td className="px-2 py-2 text-right">
                              <div className="font-bold text-slate-800">
                                ฿{sub.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </div>
                              {showVat && (
                                <div className="text-[9px] text-slate-400">
                                  +฿{vat.toLocaleString('th-TH', { minimumFractionDigits: 2 })} VAT
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-2 text-right font-bold tabular-nums text-slate-800">
                              {ftReceivedQty.toLocaleString('th-TH')}
                            </td>
                            <td className="px-2 py-2 text-right font-bold tabular-nums">
                              <span className={ftBackorder > 0 ? 'text-amber-700' : 'text-slate-800'}>
                                {ftBackorder.toLocaleString('th-TH')}
                              </span>
                            </td>
                            {selected.receiveBatches.some((b) => b.lines.some((ln) => (ln.shortageQty ?? 0) > 0)) && (
                              <td className="px-2 py-2 text-right font-bold tabular-nums">
                                {(() => {
                                  const ftShortage = selected.lines.reduce((s, l) => s + lineShortageTotal(selected, l.lineId), 0)
                                  return ftShortage > 0
                                    ? <span className="text-rose-600">{ftShortage.toLocaleString('th-TH')}</span>
                                    : <span className="text-slate-300">—</span>
                                })()}
                              </td>
                            )}
                            <td className="px-2 py-2" />
                            {selected.status === 'draft' && <td />}
                          </tr>
                        </tfoot>
                      )
                    })()}
                  </table>
                </div>
                {selected.status === 'draft' && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    ต้นทุนที่แสดงดึงจากแฟ้มมาสเตอร์ (avg/cost) — แก้ไขได้ในร่าง · ยังไม่มีผลต่อสต็อก
                  </p>
                )}
                {(selected.status === 'ordered' || selected.status === 'closed') && (
                  <div className="mt-2 space-y-1 text-[11px] text-amber-800">
                    <p>แก้จำนวนสั่ง/ต้นทุนต่อหน่วยได้หากใส่ผิด — จำนวนสั่งต้องไม่น้อยกว่าที่รับแล้วในแต่ละแถว</p>
                    <p className="text-slate-600">
                      แก้ «รับแล้ว» ได้เมื่อตรวจพลาด — ระบบปรับสต็อกตามผลต่าง; ถ้าลดจำนวนรับ ต้นทุนเฉลี่ยไม่คำนวณย้อนอัตโนมัติ
                    </p>
                  </div>
                )}
              </div>

              {/* ── Inline receive panel ── */}
              {inlineReceive && selected.status === 'ordered' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="size-4 text-emerald-600" aria-hidden />
                      <h3 className="text-sm font-bold text-emerald-900">รับสินค้าครั้งนี้</h3>
                    </div>
                    <button type="button" onClick={() => setInlineReceive(false)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Barcode scan input */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-emerald-400" aria-hidden />
                        <input
                          type="text"
                          value={rcvScanInput}
                          onChange={(e) => { setRcvScanInput(e.target.value); setRcvScanError('') }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBarcodeScan(rcvScanInput) } }}
                          placeholder="สแกนบาร์โค้ด หรือพิมพ์รหัสสินค้า แล้วกด Enter"
                          className="w-full rounded-lg border border-emerald-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          autoFocus
                        />
                      </div>
                      {rcvScanInput && (
                        <button type="button" onClick={() => handleBarcodeScan(rcvScanInput)}
                          className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                          เพิ่ม
                        </button>
                      )}
                    </div>
                    {rcvScanError && (
                      <p className="text-[11px] font-semibold text-rose-600">{rcvScanError}</p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      สแกนบาร์โค้ดกล่อง/ชิ้น — ระบบเพิ่มจำนวนและนับกล่องให้อัตโนมัติ
                    </p>
                  </div>

                  {/* Box recipe helper for receive */}
                  {boxRecipes.length > 0 && (
                    <div className="space-y-2">
                      {boxRecipes.map((t) => {
                        const n = Math.max(1, Math.round(Number(rcvRecipeBoxes[t.id] ?? '1') || 1))
                        const isAutoUnpack = t.autoUnpack ?? false
                        return (
                          <div key={t.id} className={clsx(
                            'rounded-lg border p-3 space-y-2',
                            isAutoUnpack ? 'border-emerald-300 bg-emerald-50/60' : 'border-sky-200 bg-sky-50/50'
                          )}>
                            {/* Header */}
                            <div className="flex items-center gap-2">
                              {isAutoUnpack && (
                                <span className="shrink-0 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white">AUTO-UNPACK</span>
                              )}
                              <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{t.name}</span>
                              <input
                                type="number"
                                min={1}
                                step="1"
                                value={rcvRecipeBoxes[t.id] ?? '1'}
                                onChange={(e) => setRcvRecipeBoxes((prev) => ({ ...prev, [t.id]: e.target.value }))}
                                className="w-14 rounded border border-slate-300 bg-white px-2 py-1 text-right text-xs"
                              />
                              <span className="text-[10px] text-slate-400">กล่อง</span>
                              <button
                                type="button"
                                onClick={() => applyRcvBoxRecipe(t, n)}
                                className={clsx(
                                  'shrink-0 rounded px-2.5 py-1 text-[11px] font-semibold text-white',
                                  isAutoUnpack ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                                )}
                              >
                                ใส่จำนวน
                              </button>
                            </div>

                            {/* Unpack preview table */}
                            {isAutoUnpack && t.components.length > 0 && (
                              <div className="rounded-md border border-emerald-200 bg-white overflow-hidden">
                                <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-emerald-100 bg-emerald-100/60 px-2.5 py-1">
                                  <span className="text-[9px] font-bold text-emerald-800">SKU</span>
                                  <span className="text-[9px] font-bold text-emerald-800">ชิ้น/กล่อง</span>
                                  <span className="text-[9px] font-bold text-emerald-800">รวม {n} กล่อง</span>
                                </div>
                                {t.components.map((comp, ci) => (
                                  <div key={ci} className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-2.5 py-1 border-b border-slate-100 last:border-0">
                                    <span className="font-mono text-[10px] text-slate-700">{comp.sku}{comp.label ? <span className="ml-1 text-slate-400">({comp.label})</span> : null}</span>
                                    <span className="text-[10px] text-slate-500 text-right">×{comp.qtyPerBox}</span>
                                    <span className="text-[10px] font-semibold text-emerald-700 text-right">+{comp.qtyPerBox * n}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      <p className="text-[10px] text-slate-400 px-1">จำนวนจะถูก <em>บวกเพิ่ม</em> ลงในช่องรับครั้งนี้</p>
                    </div>
                  )}

                  {/* Per-line receive inputs */}
                  <div className="space-y-2">
                    {selected.lines.map((l) => {
                      const remain = lineBackorder(l)
                      const draftRow = receiveDraft[l.lineId] ?? { qty: '', cost: String(l.unitCostOrder), shortage: '', shortageReason: '' }
                      const enteredQty = Number.parseFloat(draftRow.qty.replace(/,/g, '')) || 0
                      const shortageVal = Number.parseFloat((draftRow.shortage ?? '').replace(/,/g, '')) || 0
                      const overQty = enteredQty > 0 && enteredQty > remain + 1e-6 ? Math.round((enteredQty - remain) * 100) / 100 : 0
                      const lineMaster = getProductMasterBySku(l.sku)
                      const piecesPerBox = lineMaster?.piecesPerBox
                      return (
                        <div key={l.lineId} className={clsx(
                          'rounded-lg border bg-white p-2.5 space-y-1.5',
                          remain > 0 ? 'border-slate-200' : 'border-slate-100',
                        )}>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="font-mono text-xs font-semibold text-slate-700">{l.sku}</span>
                            <span className="text-xs text-slate-500 truncate flex-1">{l.name}</span>
                            <span className={clsx('text-[10px] font-semibold', remain > 0 ? 'text-amber-700' : 'text-emerald-600')}>
                              ค้างรับ {remain > 0 ? remain : '0 ✓'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                            {piecesPerBox ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-slate-400">กล่อง ({piecesPerBox} ชิ้น/กล่อง)</span>
                                <input
                                  type="number"
                                  min={0}
                                  step="1"
                                  value={rcvLineBoxes[l.lineId] ?? ''}
                                  onChange={(e) => {
                                    const boxes = e.target.value
                                    setRcvLineBoxes((prev) => ({ ...prev, [l.lineId]: boxes }))
                                    const n = Number.parseFloat(boxes) || 0
                                    if (n > 0) {
                                      const qty = String(Math.round(n * piecesPerBox))
                                      setReceiveDraft((d) => {
                                        const cur = d[l.lineId] ?? { qty: '', cost: String(l.unitCostOrder), shortage: '', shortageReason: '' }
                                        return { ...d, [l.lineId]: { ...cur, qty } }
                                      })
                                    }
                                  }}
                                  placeholder="0"
                                  className="w-16 rounded border border-sky-200 bg-sky-50/60 px-2 py-1 text-right text-sm"
                                />
                              </div>
                            ) : null}
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-slate-400">รับครั้งนี้ (ชิ้น)</span>
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={draftRow.qty}
                                onChange={(e) => {
                                  setReceiveDraft((d) => {
                                    const cur = d[l.lineId] ?? { qty: '', cost: String(l.unitCostOrder), shortage: '', shortageReason: '' }
                                    return { ...d, [l.lineId]: { ...cur, qty: e.target.value } }
                                  })
                                  if (piecesPerBox) setRcvLineBoxes((prev) => ({ ...prev, [l.lineId]: '' }))
                                }}
                                placeholder="0"
                                className={clsx(
                                  'w-20 rounded border px-2 py-1 text-right text-sm',
                                  overQty > 0 ? 'border-orange-400 bg-orange-50' : 'border-slate-200',
                                )}
                              />
                              {overQty > 0 && <span className="text-[9px] font-semibold text-orange-600">+{overQty} เกินสั่ง</span>}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-slate-400">ต้นทุน/หน่วย</span>
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={draftRow.cost}
                                onChange={(e) => setReceiveDraft((d) => {
                                  const cur = d[l.lineId] ?? { qty: '', cost: '', shortage: '', shortageReason: '' }
                                  return { ...d, [l.lineId]: { ...cur, cost: e.target.value } }
                                })}
                                className="w-24 rounded border border-slate-200 px-2 py-1 text-right text-sm"
                              />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-rose-500">ขาด/เสียหาย</span>
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={draftRow.shortage ?? ''}
                                onChange={(e) => setReceiveDraft((d) => {
                                  const cur = d[l.lineId] ?? { qty: '', cost: String(l.unitCostOrder), shortage: '', shortageReason: '' }
                                  return { ...d, [l.lineId]: { ...cur, shortage: e.target.value } }
                                })}
                                placeholder="0"
                                className="w-20 rounded border border-rose-200 bg-rose-50/50 px-2 py-1 text-right text-sm"
                              />
                            </div>
                            {shortageVal > 0 && (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-rose-500">สาเหตุ</span>
                                <select
                                  value={draftRow.shortageReason ?? ''}
                                  onChange={(e) => setReceiveDraft((d) => {
                                    const cur = d[l.lineId] ?? { qty: '', cost: String(l.unitCostOrder), shortage: '', shortageReason: '' }
                                    return { ...d, [l.lineId]: { ...cur, shortageReason: e.target.value } }
                                  })}
                                  className="rounded border border-rose-200 bg-rose-50/50 px-2 py-1 text-xs text-slate-700"
                                >
                                  <option value="">— เลือก —</option>
                                  <option value="ขาดส่ง">ขาดส่ง</option>
                                  <option value="เสียหาย">เสียหาย</option>
                                  <option value="คุณภาพไม่ผ่าน">คุณภาพไม่ผ่าน</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Extra items — vendor sends items not on the PO */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <PackagePlus className="size-3.5 text-sky-600" aria-hidden />
                      <span className="text-xs font-bold text-sky-800">สินค้าที่ vendor ส่งมาเพิ่ม (นอก PO)</span>
                    </div>
                    {rcvExtraLines.length > 0 && (
                      <div className="mb-2 space-y-1.5">
                        {rcvExtraLines.map((ex) => (
                          <div key={ex.id} className="grid items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 p-2"
                            style={{ gridTemplateColumns: '1fr auto auto auto' }}>
                            <span className="text-xs font-semibold text-slate-700 truncate">
                              <span className="font-mono text-sky-700">{ex.sku}</span> {ex.name}
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-slate-400">จำนวน</span>
                              <input
                                type="number" min={0} step="any" value={ex.qty}
                                onChange={(e) => setRcvExtraLines((prev) => prev.map((x) => x.id === ex.id ? { ...x, qty: e.target.value } : x))}
                                className="w-20 rounded border border-slate-200 px-2 py-1 text-right text-sm"
                              />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-slate-400">ต้นทุน/หน่วย</span>
                              <input
                                type="number" min={0} step={0.01} value={ex.cost}
                                onChange={(e) => setRcvExtraLines((prev) => prev.map((x) => x.id === ex.id ? { ...x, cost: e.target.value } : x))}
                                className="w-24 rounded border border-slate-200 px-2 py-1 text-right text-sm"
                              />
                            </div>
                            <button type="button"
                              onClick={() => setRcvExtraLines((prev) => prev.filter((x) => x.id !== ex.id))}
                              className="rounded p-1 text-slate-400 hover:text-rose-600">
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Search for extra product */}
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={rcvExtraQuery}
                        onChange={(e) => setRcvExtraQuery(e.target.value)}
                        placeholder="ค้นหา SKU / ชื่อสินค้า เพื่อเพิ่มสินค้านอก PO..."
                        className="w-full rounded-lg border border-sky-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-sky-400"
                      />
                    </div>
                    {rcvExtraQuery.trim() && (() => {
                      const hits = searchProducts(rcvExtraQuery)
                      return hits.length > 0 ? (
                        <ul className="mt-1 max-h-32 overflow-auto rounded-lg border border-sky-200 bg-white shadow-sm">
                          {hits.slice(0, 8).map((p) => (
                            <li key={p.id}>
                              <button type="button"
                                onClick={() => {
                                  setRcvExtraLines((prev) => [
                                    ...prev,
                                    { id: `ex-${Date.now()}`, productId: p.id, sku: p.sku, name: p.name, qty: '1', cost: String(getLatestUnitCostForPo(p)) },
                                  ])
                                  setRcvExtraQuery('')
                                }}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-sky-50">
                                <span className="font-mono text-[11px] text-sky-700">{p.sku}</span>
                                <span className="text-xs text-slate-600">{p.name}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null
                    })()}
                  </div>

                  {/* Transport + box tracking */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                      <Truck className="size-3.5" aria-hidden /> ข้อมูลขนส่ง (บันทึกประสิทธิภาพ)
                    </p>

                    {/* Transporter selector */}
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-500">บริษัทขนส่ง</label>
                      <select
                        value={rcvTransportId}
                        onChange={(e) => setRcvTransportId(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-400"
                      >
                        <option value="">— ไม่ระบุ / รับเอง —</option>
                        {transportDirectory.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Estimates — delivery date + cost suggestion */}
                    {rcvTransportId && (() => {
                      const st = getTransportStats(rcvTransportId)
                      const tc = transportDirectory.find((t) => t.id === rcvTransportId)

                      // Estimate transit days: prefer historical avg, then profile midpoint, then min or max
                      const estDays = st.avgTransitDays != null
                        ? st.avgTransitDays
                        : tc?.minDays != null && tc?.maxDays != null
                          ? (tc.minDays + tc.maxDays) / 2
                          : tc?.minDays ?? tc?.maxDays ?? null

                      // Estimated arrival from orderedAt
                      let estArrival: string | null = null
                      if (estDays != null && selected?.orderedAt) {
                        const d = new Date(selected.orderedAt)
                        d.setDate(d.getDate() + Math.round(estDays))
                        estArrival = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
                      }

                      const estRange = tc?.minDays != null || tc?.maxDays != null
                        ? tc?.minDays != null && tc?.maxDays != null
                          ? `${tc.minDays}–${tc.maxDays} วัน`
                          : tc?.minDays != null ? `≥${tc.minDays} วัน` : `≤${tc.maxDays} วัน`
                        : null

                      const hasSomething = estArrival || st.avgShippingCost != null || estRange
                      if (!hasSomething) return null

                      return (
                        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2">
                          {(estArrival || estRange) && (
                            <span className="flex items-center gap-1.5 text-[11px] text-sky-700">
                              <Clock className="size-3.5 shrink-0" aria-hidden />
                              <span>
                                {st.avgTransitDays != null
                                  ? `เฉลี่ย ${st.avgTransitDays} วัน`
                                  : estRange}
                                {estArrival && (
                                  <span className="ml-1 font-semibold">· คาดว่าถึง {estArrival}</span>
                                )}
                              </span>
                            </span>
                          )}
                          {st.avgShippingCost != null && (
                            <button
                              type="button"
                              onClick={() => setRcvShippingCost(String(st.avgShippingCost))}
                              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="กดเพื่อใช้ค่านี้"
                            >
                              ค่าขนส่งเฉลี่ย ฿{st.avgShippingCost.toLocaleString('th-TH')}
                              <span className="text-emerald-400">← ใช้ค่านี้</span>
                            </button>
                          )}
                          {st.shipmentCount > 0 && (
                            <span className="text-[10px] text-sky-400">({st.shipmentCount} ครั้งที่ผ่านมา)</span>
                          )}
                        </div>
                      )
                    })()}

                    {/* Box counts — only show when transporter selected */}
                    {rcvTransportId && (
                      <div className="space-y-2">
                        {(['small', 'normal', 'large'] as const).map((size) => {
                          const label = size === 'small' ? 'กล่องเล็ก' : size === 'normal' ? 'กล่องกลาง' : 'กล่องใหญ่'
                          return (
                            <div key={size} className="grid grid-cols-2 gap-2 items-center">
                              <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                              <div className="grid grid-cols-2 gap-1.5">
                                <div className="relative">
                                  <input
                                    type="number" min={0} step={1}
                                    value={rcvBoxes[size] ?? ''}
                                    onChange={(e) => {
                                      const v = e.target.value === '' ? undefined : Number(e.target.value)
                                      setRcvBoxes((prev) => ({ ...prev, [size]: v }))
                                    }}
                                    placeholder="0"
                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1 pr-7 text-right text-xs outline-none focus:border-emerald-400"
                                  />
                                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">กล่อง</span>
                                </div>
                                <div className="relative">
                                  <input
                                    type="number" min={0} step={1}
                                    value={rcvDamagedBoxes[size] ?? ''}
                                    onChange={(e) => {
                                      const v = e.target.value === '' ? undefined : Number(e.target.value)
                                      setRcvDamagedBoxes((prev) => ({ ...prev, [size]: v }))
                                    }}
                                    placeholder="0 เสีย"
                                    className={clsx(
                                      'w-full rounded border bg-white px-2 py-1 pr-7 text-right text-xs outline-none focus:border-rose-400',
                                      (rcvDamagedBoxes[size] ?? 0) > 0 ? 'border-rose-300 bg-rose-50' : 'border-slate-200',
                                    )}
                                  />
                                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">เสีย</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        <p className="text-[10px] text-slate-400">จำนวนกล่องที่รับ · กล่องที่เสียหาย — ระบบบันทึกสถิติให้อัตโนมัติ</p>
                      </div>
                    )}
                  </div>

                  {/* Shipping cost + notes */}
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                        ค่าขนส่ง (บาท)
                        <span className="font-normal text-slate-400">— คิดรวมเป็นต้นทุนสินค้า</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={rcvShippingCost}
                        onChange={(e) => setRcvShippingCost(e.target.value)}
                        placeholder="0.00"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-right text-sm outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-[2] min-w-[180px]">
                      <label className="text-[11px] font-bold text-slate-600">บันทึกประกอบการรับ</label>
                      <input
                        type="text"
                        value={rcvNotes}
                        onChange={(e) => setRcvNotes(e.target.value)}
                        placeholder="หมายเหตุ เช่น สินค้ารอบที่ 2, ส่งทางรถ..."
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Multi-invoice rows */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
                        <Receipt className="size-3.5" /> ใบกำกับภาษี (ไม่บังคับ)
                      </p>
                      <span className="text-[10px] text-slate-400">กรอกได้หลายใบ — ปล่อยว่างไว้ก่อนได้</span>
                    </div>
                    {/* Column headers */}
                    <div className="mb-1 grid gap-x-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                      style={{ gridTemplateColumns: '1fr 130px 110px 24px' }}>
                      <span>เลขที่ใบกำกับ</span>
                      <span>วันที่</span>
                      <span className="text-right">ยอดรวม (฿)</span>
                      <span />
                    </div>
                    <div className="space-y-1.5">
                      {rcvInvoiceRows.map((row, idx) => (
                        <div key={row.id} className="grid items-center gap-x-2"
                          style={{ gridTemplateColumns: '1fr 130px 110px 24px' }}>
                          <input
                            type="text"
                            value={row.invoiceNo}
                            onChange={(e) => setRcvInvoiceRows((prev) => prev.map((r) => r.id === row.id ? { ...r, invoiceNo: e.target.value } : r))}
                            placeholder={`TAX-2026-${String(idx + 1).padStart(5, '0')}`}
                            className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-amber-400"
                          />
                          <input
                            type="date"
                            value={row.invoiceDate}
                            onChange={(e) => setRcvInvoiceRows((prev) => prev.map((r) => r.id === row.id ? { ...r, invoiceDate: e.target.value } : r))}
                            className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs"
                          />
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={row.totalBaht}
                            onChange={(e) => setRcvInvoiceRows((prev) => prev.map((r) => r.id === row.id ? { ...r, totalBaht: e.target.value } : r))}
                            placeholder="0.00"
                            className="rounded border border-slate-200 bg-white px-2 py-1.5 text-right text-xs"
                          />
                          <button
                            type="button"
                            disabled={rcvInvoiceRows.length === 1}
                            onClick={() => setRcvInvoiceRows((prev) => prev.filter((r) => r.id !== row.id))}
                            className="flex items-center justify-center rounded p-0.5 text-slate-300 hover:text-rose-500 disabled:pointer-events-none"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Total row when multiple bills */}
                    {rcvInvoiceRows.length > 1 && (() => {
                      const grandTotal = rcvInvoiceRows.reduce((s, r) => s + (Number(r.totalBaht) || 0), 0)
                      return grandTotal > 0 ? (
                        <p className="mt-2 text-right text-xs font-semibold text-amber-800">
                          รวมทุกใบ ฿{grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </p>
                      ) : null
                    })()}
                    <button
                      type="button"
                      onClick={() => {
                        const last = rcvInvoiceRows.at(-1)
                        const d = new Date()
                        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                        setRcvInvoiceRows((prev) => [...prev, { id: `ir-${Date.now()}`, invoiceNo: '', invoiceDate: last?.invoiceDate ?? today, totalBaht: '' }])
                      }}
                      className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-900"
                    >
                      <Plus className="size-3.5" /> เพิ่มใบกำกับ
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setInlineReceive(false)}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                      ยกเลิก
                    </button>
                    <button type="button" onClick={submitReceive}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                      <Truck className="size-4" aria-hidden />
                      ยืนยันรับสินค้า
                    </button>
                  </div>
                </div>
              )}

              {/* ── Receive batch history ── */}
              {selected.receiveBatches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="size-3.5 text-slate-400" aria-hidden />
                    <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">ประวัติการรับสินค้า</h3>
                  </div>
                  {selected.receiveBatches.map((batch, idx) => {
                    const batchTotal = batch.lines.reduce((s, ln) => s + ln.qty * ln.unitCost, 0)
                    const batchQty = batch.lines.reduce((s, ln) => s + ln.qty, 0)
                    const isLast = idx === selected.receiveBatches.length - 1
                    const linkedInvoices = (selected.poInvoices ?? []).filter((inv) => inv.receiveBatchId === batch.id)
                    return (
                      <div key={batch.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span className="font-semibold text-slate-600">
                            ครั้งที่ {idx + 1} · {new Date(batch.at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </span>
                          <span className="text-slate-400">{batchQty} ชิ้น</span>
                          <span className="text-slate-400">฿{batchTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                          {batch.shippingCostBaht != null && batch.shippingCostBaht > 0 && (
                            <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                              ขนส่ง ฿{batch.shippingCostBaht.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          {linkedInvoices.map((inv) => (
                            <span key={inv.id} className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              {inv.invoiceNo}
                            </span>
                          ))}
                          {batch.notes && (
                            <span className="truncate text-slate-400 italic">{batch.notes}</span>
                          )}
                          {isLast && selected.status === 'ordered' && (
                            <button
                              type="button"
                              onClick={() => undoReceiveBatch(batch.id)}
                              className="ml-auto inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-100"
                            >
                              <RotateCcw className="size-3" /> ยกเลิกรับ
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── Promo groups ── */}
              {((selected.promoGroups ?? []).length > 0 || selected.status === 'draft' || selected.status === 'ordered') && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-rose-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">โปรโมชั่นกลุ่ม (มิกซ์-แมทช์)</h3>
                    {(selected.status === 'draft' || selected.status === 'ordered') && (
                      <button
                        type="button"
                        onClick={() => {
                          const group: PoPromoGroup = {
                            id: `pg-${Date.now()}`,
                            name: 'โปรโมชั่นใหม่',
                            buyQty: 100,
                            freeQty: 30,
                            lineIds: [],
                          }
                          updateSelected({ ...selected, promoGroups: [...(selected.promoGroups ?? []), group] })
                        }}
                        className="ml-auto inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100"
                      >
                        + เพิ่มกลุ่มโปร
                      </button>
                    )}
                  </div>

                  {(selected.promoGroups ?? []).map((group) => {
                    const results = calcPromoGroup(group, selected.lines)
                    const totalSavings = [...results.values()].reduce((s, r) => s + r.savings, 0)
                    const totalFree = [...results.values()].reduce((s, r) => s + r.freeCount, 0)
                    const totalGroupQty = selected.lines
                      .filter((l) => group.lineIds.includes(l.lineId))
                      .reduce((s, l) => s + l.orderedQty, 0)
                    const qualified = totalGroupQty >= group.buyQty

                    return (
                      <div key={group.id} className="rounded-xl border border-rose-200 bg-rose-50/30 overflow-hidden">
                        {/* Group header */}
                        <div className="flex flex-wrap items-center gap-3 border-b border-rose-100 bg-rose-50 px-4 py-2.5">
                          <input
                            type="text"
                            value={group.name}
                            disabled={selected.status !== 'draft' && selected.status !== 'ordered'}
                            onChange={(e) => updateSelected({
                              ...selected,
                              promoGroups: (selected.promoGroups ?? []).map((g) =>
                                g.id === group.id ? { ...g, name: e.target.value } : g,
                              ),
                            })}
                            className="min-w-0 flex-1 rounded border border-rose-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 outline-none focus:border-rose-400 disabled:bg-transparent disabled:border-transparent"
                          />
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-semibold">
                            <span>ซื้อรวม</span>
                            <input
                              type="number"
                              min={1}
                              value={group.buyQty}
                              disabled={selected.status !== 'draft' && selected.status !== 'ordered'}
                              onChange={(e) => updateSelected({
                                ...selected,
                                promoGroups: (selected.promoGroups ?? []).map((g) =>
                                  g.id === group.id ? { ...g, buyQty: Math.max(1, Number(e.target.value) || 1) } : g,
                                ),
                              })}
                              className="w-16 rounded border border-rose-200 bg-white px-1 py-0.5 text-center text-xs outline-none focus:border-rose-400 disabled:bg-transparent disabled:border-transparent"
                            />
                            <span>ชิ้น แถม</span>
                            <input
                              type="number"
                              min={1}
                              value={group.freeQty}
                              disabled={selected.status !== 'draft' && selected.status !== 'ordered'}
                              onChange={(e) => updateSelected({
                                ...selected,
                                promoGroups: (selected.promoGroups ?? []).map((g) =>
                                  g.id === group.id ? { ...g, freeQty: Math.max(1, Number(e.target.value) || 1) } : g,
                                ),
                              })}
                              className="w-16 rounded border border-rose-200 bg-white px-1 py-0.5 text-center text-xs outline-none focus:border-rose-400 disabled:bg-transparent disabled:border-transparent"
                            />
                            <span className="text-slate-500">ชิ้นราคาถูกสุดฟรี</span>
                          </div>
                          <div className={clsx(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold',
                            qualified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
                          )}>
                            {totalGroupQty}/{group.buyQty} ชิ้น {qualified ? '✓' : '(ยังไม่ครบ)'}
                          </div>
                          {(selected.status === 'draft' || selected.status === 'ordered') && (
                            <button
                              type="button"
                              onClick={() => updateSelected({
                                ...selected,
                                promoGroups: (selected.promoGroups ?? []).filter((g) => g.id !== group.id),
                              })}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <X className="size-4" />
                            </button>
                          )}
                        </div>

                        {/* Line assignment */}
                        <div className="divide-y divide-rose-100">
                          {selected.lines.map((l) => {
                            const inGroup = group.lineIds.includes(l.lineId)
                            const res = results.get(l.lineId)
                            return (
                              <div
                                key={l.lineId}
                                className={clsx(
                                  'flex flex-wrap items-center gap-3 px-4 py-2 text-xs',
                                  inGroup ? 'bg-white' : 'opacity-40',
                                )}
                              >
                                {(selected.status === 'draft' || selected.status === 'ordered') && (
                                  <input
                                    type="checkbox"
                                    checked={inGroup}
                                    onChange={(e) => updateSelected({
                                      ...selected,
                                      promoGroups: (selected.promoGroups ?? []).map((g) =>
                                        g.id === group.id
                                          ? {
                                              ...g,
                                              lineIds: e.target.checked
                                                ? [...g.lineIds, l.lineId]
                                                : g.lineIds.filter((id) => id !== l.lineId),
                                            }
                                          : g,
                                      ),
                                    })}
                                    className="size-4 accent-rose-500"
                                  />
                                )}
                                <span className="font-mono text-slate-500 w-16 shrink-0">{l.sku}</span>
                                <span className="flex-1 min-w-0 truncate text-slate-700">{l.name}</span>
                                <span className="text-slate-500 tabular-nums">{l.orderedQty} ชิ้น × ฿{l.unitCostOrder.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</span>
                                {inGroup && res && qualified && (
                                  <div className="flex items-center gap-2 ml-auto">
                                    {res.freeCount > 0 && (
                                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                        แถม {res.freeCount} ชิ้น
                                      </span>
                                    )}
                                    <span className="text-[10px] font-semibold text-rose-700">
                                      ต้นทุนจริง ฿{res.effectiveCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Group summary + apply */}
                        {qualified && (
                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rose-100 bg-rose-50 px-4 py-2.5">
                            <div className="flex gap-4 text-[11px]">
                              <span className="text-slate-600">แถมรวม <span className="font-bold text-emerald-700">{totalFree} ชิ้น</span></span>
                              <span className="text-slate-600">ประหยัด <span className="font-bold text-rose-700">฿{totalSavings.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span></span>
                            </div>
                            {(selected.status === 'draft' || selected.status === 'ordered') && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = { ...selected }
                                    next.lines = next.lines.map((l) => {
                                      const res = results.get(l.lineId)
                                      if (!res || res.freeCount === 0) return l
                                      const newQty = l.orderedQty + res.freeCount
                                      const effectiveCost = Math.round((l.orderedQty * l.unitCostOrder / newQty) * 10000) / 10000
                                      return { ...l, orderedQty: newQty, unitCostOrder: effectiveCost }
                                    })
                                    updateSelected(next)
                                  }}
                                  className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                                >
                                  แถมเพิ่มอัตโนมัติ +{totalFree} ชิ้น
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const patches = [...results.entries()]
                                    const next = { ...selected }
                                    next.lines = next.lines.map((l) => {
                                      const r = patches.find(([id]) => id === l.lineId)
                                      if (!r) return l
                                      return { ...l, unitCostOrder: r[1].effectiveCost }
                                    })
                                    updateSelected(next)
                                  }}
                                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                                >
                                  ใช้ต้นทุนสุทธิทุกแถว
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Internal notes */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  หมายเหตุภายใน
                </label>
                <textarea
                  value={selected.notes ?? ''}
                  rows={2}
                  placeholder="จดบันทึกภายใน เช่น เงื่อนไขพิเศษ รอสต็อกรุ่นใหม่..."
                  disabled={selected.status === 'closed'}
                  onChange={(e) => updateSelected({ ...selected, notes: e.target.value || undefined })}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-400 disabled:bg-slate-100"
                />
              </div>

              </>)}

              {/* ── Tab: ชำระ / ใบกำกับ ── */}
              {poTab === 'payment' && (selected.status === 'ordered' || selected.status === 'closed') && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                      <CircleDollarSign className="size-4 text-indigo-500" aria-hidden />
                      การชำระเงิน
                    </h3>
                    {selected.paidAt && selected.paymentMode !== 'payable' && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                        ✓ บันทึกแล้ว {new Date(selected.paidAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {/* Payment method toggle buttons */}
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold text-slate-600">วิธีชำระ</p>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { value: 'paid_cash',     label: 'เงินสด',   icon: '💵' },
                        { value: 'paid_transfer', label: 'โอน / QR', icon: '📱' },
                        { value: 'payable',       label: 'เครดิต',   icon: '📋' },
                      ] as const).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={selected.status === 'closed'}
                          onClick={() => {
                            const paymentMode = opt.value as PurchaseOrder['paymentMode']
                            updateSelected({
                              ...selected,
                              paymentMode,
                              // switching to credit clears any stale paidAt (real payment set via PayablesPanel)
                              paidAt: paymentMode === 'payable' ? undefined : selected.paidAt,
                              debtReductionChannel:
                                paymentMode === 'paid_cash' || paymentMode === 'paid_transfer'
                                  ? selected.debtReductionChannel
                                  : undefined,
                            })
                          }}
                          className={clsx(
                            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50',
                            selected.paymentMode === opt.value
                              ? opt.value === 'unpaid'
                                ? 'border-slate-400 bg-slate-100 text-slate-700'
                                : opt.value === 'payable'
                                ? 'border-indigo-400 bg-indigo-100 text-indigo-800'
                                : 'border-emerald-400 bg-emerald-100 text-emerald-800'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50',
                          )}
                        >
                          <span>{opt.icon}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Supplier bank account (only for transfer) */}
                  {selected.paymentMode === 'paid_transfer' && (() => {
                    const supplierProfile = suppliers.find((s) => s.id === selected.supplierId)
                    const accounts = supplierProfile?.bankAccounts ?? []
                    return (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-slate-600">
                          โอนเงินไปบัญชี
                          <span className="ml-1 font-normal text-slate-400">(บัญชีของ{supplierProfile?.name ?? 'ซัพพลายเออร์'})</span>
                        </p>
                        {accounts.length === 0 ? (
                          <div className="mt-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                            ยังไม่มีบัญชีธนาคารในโปรไฟล์ซัพพลายเออร์ —{' '}
                            <button
                              type="button"
                              onClick={openSupplierEdit}
                              className="font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-800"
                            >
                              เพิ่มบัญชีในโปรไฟล์
                            </button>
                          </div>
                        ) : (
                          <div className="mt-1.5 space-y-1.5">
                            {accounts.map((acc, i) => {
                              const label = [acc.bankName, acc.accountNo, acc.accountName].filter(Boolean).join(' · ')
                              const isSelected = selected.supplierBankAccountRef === label
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  disabled={selected.status === 'closed'}
                                  onClick={() =>
                                    updateSelected({
                                      ...selected,
                                      supplierBankAccountRef: isSelected ? undefined : label,
                                    })
                                  }
                                  className={clsx(
                                    'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:opacity-50',
                                    isSelected
                                      ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                                  )}
                                >
                                  <span className={clsx('size-4 shrink-0 rounded-full border-2 transition-colors', isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white')} />
                                  <span>
                                    {acc.bankName && <span className="font-semibold">{acc.bankName}</span>}
                                    {acc.accountNo && <span className="ml-2 font-mono text-xs">{acc.accountNo}</span>}
                                    {acc.accountName && <span className="ml-2 text-xs text-slate-500">{acc.accountName}</span>}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* Credit due date + inline editor */}
                  {payableDuePreview && (
                    <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-indigo-800">กำหนดจ่ายเครดิต</p>
                        <button
                          type="button"
                          onClick={() => {
                            if (!creditEditOpen) {
                              setCreditEditDays(String(payableDuePreview.terms.creditDays ?? 30))
                              setCreditEditCutoff(String(payableDuePreview.terms.statementCutoffDay ?? 25))
                              setCreditEditExclude(payableDuePreview.terms.excludePurchaseMonth ?? true)
                              setCreditEditEndOfMonth(payableDuePreview.terms.payAtEndOfDueMonth ?? true)
                            }
                            setCreditEditOpen((v) => !v)
                          }}
                          className="rounded px-2 py-0.5 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-100"
                        >
                          {creditEditOpen ? 'ยกเลิก' : 'แก้ไขเงื่อนไข'}
                        </button>
                      </div>
                      <p className="mt-1 text-slate-700">
                        อ้างอิง{payableDuePreview.anchorLabel}:{' '}
                        <span className="font-mono">{toIsoDateOnly(payableDuePreview.anchor)}</span>
                        {' → '}
                        ครบกำหนด{' '}
                        <span className="font-bold text-indigo-900">
                          {payableDuePreview.due.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </p>
                      <p className="mt-0.5 text-slate-500">{describeSupplierCreditRule(payableDuePreview.terms)}</p>
                      {creditEditOpen && (
                        <div className="mt-2.5 space-y-2 border-t border-indigo-200 pt-2.5">
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-1.5 text-slate-600">
                              ตัดรอบวันที่
                              <input
                                type="number"
                                min={1}
                                max={31}
                                value={creditEditCutoff}
                                onChange={(e) => setCreditEditCutoff(e.target.value)}
                                className="w-14 rounded border border-indigo-200 bg-white px-2 py-0.5 text-center font-mono text-slate-800"
                              />
                              ของเดือน
                            </label>
                            <label className="flex items-center gap-1.5 text-slate-600">
                              เครดิต
                              <input
                                type="number"
                                min={0}
                                max={365}
                                value={creditEditDays}
                                onChange={(e) => setCreditEditDays(e.target.value)}
                                className="w-14 rounded border border-indigo-200 bg-white px-2 py-0.5 text-center font-mono text-slate-800"
                              />
                              วัน
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <label className="flex cursor-pointer items-center gap-1.5 text-slate-600">
                              <input
                                type="checkbox"
                                checked={creditEditExclude}
                                onChange={(e) => setCreditEditExclude(e.target.checked)}
                                className="rounded"
                              />
                              ไม่รวมเดือนซื้อ
                            </label>
                            <label className="flex cursor-pointer items-center gap-1.5 text-slate-600">
                              <input
                                type="checkbox"
                                checked={creditEditEndOfMonth}
                                onChange={(e) => setCreditEditEndOfMonth(e.target.checked)}
                                className="rounded"
                              />
                              ชำระสิ้นเดือน
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!selected) return
                              setSupplierCreditTerms(selected.supplierId, {
                                creditDays: Math.max(0, parseInt(creditEditDays) || 0),
                                statementCutoffDay: Math.min(31, Math.max(1, parseInt(creditEditCutoff) || 25)),
                                excludePurchaseMonth: creditEditExclude,
                                payAtEndOfDueMonth: creditEditEndOfMonth,
                              })
                              setCreditTick((t) => t + 1)
                              setCreditEditOpen(false)
                            }}
                            className="rounded-lg bg-indigo-600 px-3 py-1 font-semibold text-white hover:bg-indigo-700"
                          >
                            บันทึกเงื่อนไข
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bill discount + summary */}
                  <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-600">ส่วนลดท้ายบิล</label>
                      <div className="flex overflow-hidden rounded border border-slate-200 bg-white">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={selected.billDiscountPct != null ? selected.billDiscountPct : selected.billDiscountBaht || ''}
                          placeholder="0"
                          disabled={selected.status === 'closed'}
                          onChange={(e) => {
                            const val = Math.max(0, Number.parseFloat(e.target.value) || 0)
                            if (selected.billDiscountPct != null) {
                              const pct = Math.min(100, val)
                              const base = paymentBase(selected) + vatAmount(selected)
                              updateSelected({ ...selected, billDiscountPct: pct, billDiscountBaht: Math.round(base * pct / 100 * 100) / 100 })
                            } else {
                              updateSelected({ ...selected, billDiscountBaht: val })
                            }
                          }}
                          className="w-24 px-2 py-1 text-sm outline-none disabled:bg-slate-100"
                        />
                        <button
                          type="button"
                          title="คลิกเพื่อสลับ ฿ / %"
                          onClick={() => {
                            const base = paymentBase(selected) + vatAmount(selected)
                            if (selected.billDiscountPct != null) {
                              updateSelected({ ...selected, billDiscountPct: undefined })
                            } else {
                              const pct = base > 0 ? Math.round((selected.billDiscountBaht / base) * 10000) / 100 : 0
                              updateSelected({ ...selected, billDiscountPct: pct })
                            }
                          }}
                          className="border-l border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          {selected.billDiscountPct != null ? '%' : '฿'}
                        </button>
                      </div>
                      {selected.billDiscountPct != null && selected.billDiscountBaht > 0 && (
                        <span className="text-[10px] text-slate-400">= {selected.billDiscountBaht.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>
                          ก่อน VAT
                          {resolvedVatMode(selected) === 'included' && <span className="ml-1 text-[10px] text-violet-600">(หักจากราคารวม VAT)</span>}
                          {resolvedVatMode(selected) === 'none' && <span className="ml-1 text-[10px] text-slate-400">(ไม่มี VAT)</span>}
                        </span>
                        <span className="tabular-nums">{paymentBase(selected).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>VAT {selected.vatRatePercent}%</span>
                        <span className="tabular-nums">{vatAmount(selected).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
                      </div>
                      {selected.billDiscountBaht > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>ส่วนลด{selected.billDiscountPct != null ? ` ${selected.billDiscountPct}%` : ''}</span>
                          <span className="tabular-nums text-rose-600">−{selected.billDiscountBaht.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                        <span>ยอดสุทธิ</span>
                        <span className="tabular-nums">{grandTotal(selected).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
                      </div>
                      {selected.supplierBankAccountRef && selected.paymentMode === 'paid_transfer' && (
                        <div className="flex justify-between border-t border-slate-100 pt-1.5 text-xs text-slate-500">
                          <span>โอนไปบัญชี</span>
                          <span className="text-right">{selected.supplierBankAccountRef}</span>
                        </div>
                      )}
                      {selected.invoiceNo && !(selected.poInvoices ?? []).some(i => i.invoiceNo === selected.invoiceNo) && (
                        <div className="flex justify-between border-t border-slate-100 pt-1.5 text-xs text-slate-400">
                          <span>ใบกำกับเดิม</span>
                          <span>{selected.invoiceNo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selected.status !== 'closed' && selected.paymentMode !== 'unpaid' && (
                    <button
                      type="button"
                      onClick={savePayment}
                      className={clsx(
                        'mt-4 w-full rounded-xl py-2.5 text-sm font-bold text-white shadow-sm transition-colors',
                        selected.paymentMode === 'payable'
                          ? 'bg-indigo-600 hover:bg-indigo-700'
                          : 'bg-emerald-600 hover:bg-emerald-700',
                      )}
                    >
                      {selected.paymentMode === 'payable'
                        ? 'บันทึกเครดิต (เจ้าหนี้)'
                        : selected.paidAt
                        ? '✓ อัปเดตการชำระ'
                        : 'บันทึกชำระแล้ว'}
                    </button>
                  )}

                  {/* ── Vendor invoice list ──────────────────────────────── */}
                  <div className="mt-4 border-t border-indigo-100 pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-indigo-800">
                        <Receipt className="size-3.5" />
                        ใบกำกับจากผู้จำหน่าย ({(selected.poInvoices ?? []).length})
                      </h4>
                      {selected.status !== 'closed' && (
                        <button
                          type="button"
                          onClick={() => {
                            setInvForm(emptyInvForm())
                            setInvFormOpen(true)
                          }}
                          className="inline-flex items-center gap-0.5 rounded border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-50"
                        >
                          <Plus className="size-3" />
                          เพิ่มใบกำกับ
                        </button>
                      )}
                    </div>

                    {(selected.poInvoices ?? []).length === 0 ? (
                      <p className="mt-2 text-[10px] text-slate-400">
                        ยังไม่มีใบกำกับ — รับสินค้าและกรอกเลขที่ใบกำกับ หรือกด «เพิ่มใบกำกับ»
                      </p>
                    ) : (
                      <div className="mt-2 space-y-1.5">
                        {(selected.poInvoices ?? []).map((inv) => {
                          const linkedBatch = selected.receiveBatches.find((b) => b.id === inv.receiveBatchId)
                          return (
                            <div key={inv.id} className="flex flex-wrap items-start gap-2 rounded-lg border border-indigo-100 bg-white px-3 py-2 text-xs shadow-sm">
                              <div className="flex flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                                <span className="font-mono font-bold text-slate-900">{inv.invoiceNo}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(inv.invoiceDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                </span>
                                {inv.totalBaht > 0 && (
                                  <span className="font-semibold text-slate-700">
                                    ฿{inv.totalBaht.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                                {inv.beforeVatBaht > 0 && inv.vatBaht > 0 && (
                                  <span className="text-[10px] text-slate-400">
                                    (ก่อน VAT ฿{inv.beforeVatBaht.toLocaleString('th-TH', { minimumFractionDigits: 2 })} · VAT ฿{inv.vatBaht.toLocaleString('th-TH', { minimumFractionDigits: 2 })})
                                  </span>
                                )}
                                {linkedBatch && (
                                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                    รับของ {new Date(linkedBatch.at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                  </span>
                                )}
                                {inv.notes && (
                                  <span className="text-[10px] italic text-slate-400">{inv.notes}</span>
                                )}
                              </div>
                              {selected.status !== 'closed' && (
                                <button
                                  type="button"
                                  onClick={() => deleteInvoice(inv.id)}
                                  className="shrink-0 text-slate-300 hover:text-rose-500"
                                  title="ลบใบกำกับนี้"
                                >
                                  <X className="size-3.5" />
                                </button>
                              )}
                            </div>
                          )
                        })}
                        {/* invoice total vs PO grand total */}
                        {(selected.poInvoices ?? []).length > 1 && (
                          <div className="flex justify-end gap-1 pt-1 text-[10px] text-slate-500">
                            <span>รวมทุกใบกำกับ:</span>
                            <span className="font-bold text-slate-700">
                              ฿{(selected.poInvoices ?? []).reduce((s, i) => s + i.totalBaht, 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Add invoice inline form */}
                    {invFormOpen && (
                      <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3">
                        <p className="mb-2 text-[11px] font-bold text-indigo-800">เพิ่มใบกำกับใหม่</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="sm:col-span-2 block text-[11px] font-medium text-slate-600">
                            เลขที่ใบกำกับ *
                            <input
                              type="text"
                              value={invForm.invoiceNo}
                              onChange={(e) => setInvForm((f) => ({ ...f, invoiceNo: e.target.value }))}
                              placeholder="เช่น TAX-2026-00123"
                              className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
                            />
                          </label>
                          <label className="block text-[11px] font-medium text-slate-600">
                            วันที่ในใบกำกับ
                            <input
                              type="date"
                              value={invForm.invoiceDate}
                              onChange={(e) => setInvForm((f) => ({ ...f, invoiceDate: e.target.value }))}
                              className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
                            />
                          </label>
                          <label className="block text-[11px] font-medium text-slate-600">
                            เชื่อมกับรับของ
                            <select
                              value={invForm.receiveBatchId}
                              onChange={(e) => setInvForm((f) => ({ ...f, receiveBatchId: e.target.value }))}
                              className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
                            >
                              <option value="">— ไม่เชื่อม —</option>
                              {selected.receiveBatches.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {new Date(b.at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                  {' · '}{b.lines.length} รายการ
                                  {b.refNos ? ` · ${b.refNos}` : ''}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-[11px] font-medium text-slate-600">
                            ยอดรวมในใบกำกับ (฿)
                            <input
                              type="number" min={0} step={0.01}
                              value={invForm.totalBaht}
                              onChange={(e) => setInvForm((f) => ({ ...f, totalBaht: e.target.value }))}
                              placeholder="0.00"
                              className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
                            />
                          </label>
                          <label className="block text-[11px] font-medium text-slate-600">
                            ก่อน VAT (฿)
                            <input
                              type="number" min={0} step={0.01}
                              value={invForm.beforeVatBaht}
                              onChange={(e) => setInvForm((f) => ({ ...f, beforeVatBaht: e.target.value }))}
                              placeholder="0.00"
                              className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
                            />
                          </label>
                          <label className="block text-[11px] font-medium text-slate-600">
                            VAT (฿)
                            <input
                              type="number" min={0} step={0.01}
                              value={invForm.vatBaht}
                              onChange={(e) => setInvForm((f) => ({ ...f, vatBaht: e.target.value }))}
                              placeholder="0.00"
                              className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
                            />
                          </label>
                          <label className="sm:col-span-2 block text-[11px] font-medium text-slate-600">
                            หมายเหตุ
                            <input
                              type="text"
                              value={invForm.notes}
                              onChange={(e) => setInvForm((f) => ({ ...f, notes: e.target.value }))}
                              placeholder="ไม่บังคับ"
                              className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
                            />
                          </label>
                        </div>
                        <div className="mt-2 flex justify-end gap-2">
                          <button type="button" onClick={() => setInvFormOpen(false)}
                            className="rounded border border-slate-200 px-3 py-1.5 text-xs">
                            ยกเลิก
                          </button>
                          <button type="button" onClick={addInvoiceFromForm}
                            disabled={!invForm.invoiceNo.trim()}
                            className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">
                            บันทึกใบกำกับ
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {receiveOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">รับสินค้า — {selected.poNo}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  กรอกจำนวนรับจริง · รับเกินสั่งได้ · กรอก «ขาด/เสียหาย» สำหรับของที่ถูกเรียกเก็บแต่ไม่ได้รับ
                </p>
              </div>
              <button type="button" onClick={() => setReceiveOpen(false)}
                className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100">
                <X className="size-4" />
              </button>
            </div>

            {/* Invoice section */}
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/40 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
                <Receipt className="size-3.5" /> ใบกำกับภาษีที่มาพร้อมการส่งนี้
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="sm:col-span-2 block text-[11px] font-medium text-slate-600">
                  เลขที่ใบกำกับ
                  <input
                    type="text"
                    value={rcvInvoiceNo}
                    onChange={(e) => setRcvInvoiceNo(e.target.value)}
                    placeholder="เช่น TAX-2026-00123"
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-amber-400"
                  />
                </label>
                <label className="block text-[11px] font-medium text-slate-600">
                  วันที่ในใบกำกับ
                  <input
                    type="date"
                    value={rcvInvoiceDate}
                    onChange={(e) => setRcvInvoiceDate(e.target.value)}
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block text-[11px] font-medium text-slate-600">
                  ยอดรวมในใบกำกับ (฿)
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={rcvTotal}
                    onChange={(e) => setRcvTotal(e.target.value)}
                    placeholder="0.00"
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block text-[11px] font-medium text-slate-600">
                  ก่อน VAT (฿)
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={rcvBeforeVat}
                    onChange={(e) => setRcvBeforeVat(e.target.value)}
                    placeholder="0.00"
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block text-[11px] font-medium text-slate-600">
                  VAT (฿)
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={rcvVat}
                    onChange={(e) => setRcvVat(e.target.value)}
                    placeholder="0.00"
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
              {!rcvInvoiceNo.trim() && (
                <p className="mt-1.5 text-[10px] text-slate-400">ปล่อยว่างได้ถ้ายังไม่มีใบกำกับ — เพิ่มภายหลังได้จากส่วน «ใบกำกับ»</p>
              )}
            </div>

            <div className="mt-3 space-y-3">
              {selected.lines.map((l) => {
                const remain = lineBackorder(l)
                const draftRow = receiveDraft[l.lineId] ?? { qty: '', cost: String(l.unitCostOrder), shortage: '' }
                const enteredQty = Number.parseFloat(draftRow.qty.replace(/,/g, '')) || 0
                const overQty = enteredQty > 0 && enteredQty > remain + 1e-6 ? Math.round((enteredQty - remain) * 100) / 100 : 0
                const shortageEntered = Number.parseFloat((draftRow.shortage ?? '').replace(/,/g, '')) || 0
                return (
                  <div key={l.lineId} className={clsx('rounded border p-2', remain > 0 ? 'border-slate-200' : 'border-slate-100 bg-slate-50/60')}>
                    <p className="text-xs font-semibold text-slate-800">{l.sku} — {l.name}</p>
                    <p className="text-[10px] text-slate-500">
                      สั่ง {l.orderedQty} · รับแล้ว {l.receivedQtyTotal} · ค้างรับ{' '}
                      <span className={remain > 0 ? 'font-semibold text-amber-700' : 'text-emerald-600'}>
                        {remain > 0 ? remain : '0 ✓'}
                      </span>
                      {' · สต็อกก่อนรับ '}
                      {(() => {
                        const p = getPosCatalogProducts().find((x) => x.id === l.productId)
                        return p ? getOnHandQtyBeforeReceive(p) : '—'
                      })()}
                    </p>
                    <div className="mt-2 flex flex-wrap items-end gap-2">
                      <label className="text-[11px]">
                        จำนวนรับจริง
                        <input
                          value={draftRow.qty}
                          onChange={(e) =>
                            setReceiveDraft((d) => {
                              const cur = d[l.lineId] ?? { qty: '', cost: String(l.unitCostOrder), shortage: '' }
                              return { ...d, [l.lineId]: { ...cur, qty: e.target.value } }
                            })
                          }
                          className={clsx(
                            'mt-0.5 block w-24 rounded border px-2 py-1 text-sm',
                            overQty > 0 ? 'border-orange-400 bg-orange-50' : 'border-slate-200',
                          )}
                          placeholder="0"
                        />
                        {overQty > 0 && (
                          <span className="mt-0.5 block text-[10px] font-semibold text-orange-600">⬆ เกินสั่ง +{overQty}</span>
                        )}
                      </label>
                      <label className="text-[11px]">
                        ต้นทุน/หน่วย (฿)
                        <input
                          value={draftRow.cost}
                          onChange={(e) =>
                            setReceiveDraft((d) => {
                              const cur = d[l.lineId] ?? { qty: '', cost: '', shortage: '' }
                              return { ...d, [l.lineId]: { ...cur, cost: e.target.value } }
                            })
                          }
                          className="mt-0.5 block w-28 rounded border border-slate-200 px-2 py-1 text-sm"
                        />
                      </label>
                      <label className="text-[11px] text-rose-700">
                        ขาด/เสียหาย
                        <input
                          value={draftRow.shortage ?? ''}
                          onChange={(e) =>
                            setReceiveDraft((d) => {
                              const cur = d[l.lineId] ?? { qty: '', cost: String(l.unitCostOrder), shortage: '' }
                              return { ...d, [l.lineId]: { ...cur, shortage: e.target.value } }
                            })
                          }
                          className="mt-0.5 block w-20 rounded border border-rose-200 bg-rose-50/50 px-2 py-1 text-sm placeholder:text-rose-300"
                          placeholder="0"
                        />
                        {shortageEntered > 0 && (
                          <span className="mt-0.5 block text-[10px] font-semibold text-rose-600">−{shortageEntered} ไม่รับสต็อก</span>
                        )}
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReceiveOpen(false)}
                className="rounded border border-slate-200 px-3 py-2 text-sm"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={submitReceive}
                className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
              >
                ยืนยันรับสินค้า
              </button>
            </div>
          </div>
        </div>
      )}

      {supplierModal.open && (
        <SupplierProfileModal
          open
          mode={supplierModal.mode}
          initialProfile={supplierModal.profile}
          onClose={() => setSupplierModal({ open: false, mode: 'create', profile: null })}
          onSaved={handleSupplierSaved}
        />
      )}

      {previewOpen && selected && (
        <PoPreviewModal
          po={selected}
          shopName={branch?.name ?? 'ร้าน'}
          copyDone={copyDone}
          onCopy={() => printPo('copy')}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  )
}
