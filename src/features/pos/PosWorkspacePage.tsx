import {
  nextPosBillNumberAsync,
  nextTaxInvoiceNumberAsync,
  peekNextPosBillNumber,
  peekNextPosBillNumberAsync,
  peekNextTaxInvoiceNumber,
  peekNextTaxInvoiceNumberAsync,
} from '@/features/pos/data/posBillSequence'
import { isTauri } from '@/features/desktop/isTauri'
import type { Member } from '@/features/members/data/mockMembers'
import { loadMembers, loadMembersAsync, MEMBERS_CHANGED_EVENT } from '@/features/members/data/membersStore'
import { formatPhone, phoneMatchesQuery } from '@/features/members/data/phoneUtils'
import { BRANCHES } from '@/features/auth/branches'
import { getStoredBranch } from '@/features/auth/authSession'
import {
  getBundleAvailableQty,
  getProductMasterBySku,
  masterSearchExtrasForSku,
  resolveBundleBreakdown,
  type VehicleFitmentRef,
} from '@/features/inventory/data/productMasterData'
import { loadProductTagsRegistry } from '@/features/inventory/data/productTagsRegistry'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import {
  mergeInventoryProductsWithLiveStock,
  loadLiveStock,
  saveLiveStock,
  loadRollStock,
  saveRollStock,
  loadBoxPieceStock,
  saveBoxPieceStock,
  deductStock,
  deductRollKg,
  deductFullRolls,
  deductBoxPieces,
  isBoxPieceProduct,
  posProductUsesRollShelfStock,
  posRollNominalForProduct,
} from '@/features/pos/data/posLiveStock'
import {
  getPosSellConfig,
  pickDefaultPosUnitAndPrice,
  posPriceLevelsForUnit,
  posUnitsWithSellPrice,
} from '@/features/pos/data/posUnitPricing'
import { getStlBoltPairForMaleProduct } from '@/features/promotions/stlBoltPairRegistry'
import { computeStlVolumePromo } from '@/features/promotions/stlVolumePromo'
import { createPosSaleAsync, loadPosSalesHistoryByMemberAsync, type PosSalesHistoryRow } from '@/features/pos/data/posSalesDb'
import { appendSale, POS_SALE_RECORDED_EVENT } from '@/features/pos/data/posSalesHistory'
import { loadTransportDirectory, TRANSPORT_DIRECTORY_CHANGED_EVENT } from '@/features/transport/data/transportDirectoryStore'
import { printPosReceipt } from '@/features/pos/utils/posPrintReceipt'
import { localDateYYYYMMDD, parseLocalYYYYMMDD } from '@/features/pos/utils/posLocalDate'
import { writeCfdState, readCfdState } from '@/features/cfd/cfdBridge'
import { getProductImageUrl, getProductImageUrls } from '@/features/inventory/data/productImages'
import { openCfdWindow } from '@/features/cfd/openCfdWindow'
import { loadBankAccounts, getDefaultBankAccount, BANK_CHANGED_EVENT } from '@/features/bank/bankStore'
import { promptPayDataUrl } from '@/features/bank/promptPayQr'
import { buildTaxInvoiceFormPrintHtml, printTaxInvoiceHtmlPreferSystemDialog, type TaxInvoiceLineItemRow } from '@/features/inventory/data/taxInvoiceFormCanvasShared'
import { getActiveTaxInvoiceForm, loadTaxInvoiceFormDesignerState } from '@/features/inventory/data/taxInvoiceFormDesignerStore'
import { MOCK_STORE_PROFILE } from '@/features/settings/data/mockStoreProfile'
import { useThemePreference } from '@/features/settings/themePreference'
import { ProductImage } from '@/features/inventory/components/ProductImage'
import { clsx } from 'clsx'
import {
  Activity,
  AlertTriangle,
  Banknote,
  BookOpen,
  CheckCircle2,
  Building2,
  CalendarClock,
  Clock,
  ClipboardList,
  MapPin,
  Medal,
  Image,
  Monitor,
  Pause,
  Printer,
  QrCode,
  Receipt,
  Search,
  Play,
  Send,
  ShoppingCart,
  Sun,
  Moon,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'

type PosWorkspacePageProps = {
  className?: string
}

type SaleMode = 'retail' | 'tax'

type CheckoutPaymentType = 'cash' | 'transfer' | 'account' | 'mixed'

type CartLine = {
  id: number
  productId?: string
  code: string
  name: string
  unit: string
  unitIndex?: number
  basePrice: number
  price: number
  priceLevel: string
  priceLevelIndex?: number
  discount: number
  qty: number
  stlBoltRole?: 'nut' | 'washerGift'
  stlBoltMaleCode?: string
  stockBreakdown?: { productId: string; qty: number }[]
}

type Customer = {
  accountCode: string
  name: string
  phone: string
  taxId: string
  branch: string
  address: string
  creditTerms: string
  creditLimit: number
  creditUsed: number
  points: number
}

type Product = {
  id: string
  code: string
  name: string
  unit: string
  price: number
  stock: number
  category?: string
  brand?: string
  location?: string
  carBrand?: string
  carModelLabel?: string
  yearLabel?: string
  factoryOem?: string
  genuineNo?: string
  dimensions?: { innerDiameterMm?: number; innerDiameterSecondaryMm?: number; outerDiameterMm?: number; heightMm?: number }
}

function formatDims(d: Product['dimensions']): string {
  if (!d) return ''
  const parts: string[] = []
  if (d.innerDiameterMm) parts.push(`A:${d.innerDiameterMm}`)
  if (d.innerDiameterSecondaryMm) parts.push(`A₂:${d.innerDiameterSecondaryMm}`)
  if (d.outerDiameterMm) parts.push(`B:${d.outerDiameterMm}`)
  if (d.heightMm) parts.push(`C:${d.heightMm}`)
  return parts.length ? parts.join(' ') + ' mm' : ''
}

const WALK_IN_CUSTOMER: Customer = {
  accountCode: 'WK-00001',
  name: 'ลูกค้าทั่วไป (Walk-in)',
  phone: '',
  taxId: '',
  branch: '',
  address: '-',
  creditTerms: 'เงินสด',
  creditLimit: 0,
  creditUsed: 0,
  points: 0,
}

/** พักบิลธรรมดา vs แจ้งยอดแล้วพักรอให้คนอื่นโอน */
type SuspendedBillKind = 'hold' | 'await_transfer'

type SuspendedBill = {
  id: string
  createdAt: number
  mode: SaleMode
  customer: Customer
  cart: CartLine[]
  docInfo: {
    posBillNo: string
    taxInvoiceNo: string
    docDate: string
    employee: string
    vatType: 'exclude' | 'include' | 'none'
    remark: string
  }
  billDiscount: string
  applyRounding: boolean
  /** ไม่มี = พักบิลธรรมดา (รุ่นเก่า) */
  suspendKind?: SuspendedBillKind
}

function suspendedCartSubtotal(cart: CartLine[]): number {
  return round2(cart.reduce((s, line) => s + round2(line.price * line.qty - line.discount), 0))
}

/** ยอดแสดงในรายการบิลพัก (หักส่วนลดท้ายบิลตัวเลข — ไม่รวม VAT/ปัดเศษเต็มรูปแบบ) */
function suspendedBillGrandDisplay(b: SuspendedBill): number {
  const sub = suspendedCartSubtotal(b.cart)
  const billDisc = Number.parseFloat(b.billDiscount || '0') || 0
  return round2(Math.max(0, sub - billDisc))
}

function formatSuspendedBillTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatThaiBillNoticeDate(docDate: string): string {
  const d = parseLocalYYYYMMDD(docDate)
  if (Number.isNaN(d.getTime())) return docDate
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** รอบเครดิตตามเดือนของวันที่เอกสาร (พ.ศ.) */
function formatCreditCycleRangeFromDocDate(docDate: string): string {
  const d = parseLocalYYYYMMDD(docDate)
  if (Number.isNaN(d.getTime())) return '—'
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  const fmt = (x: Date) =>
    x.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${fmt(start)} - ${fmt(end)}`
}

function isSuspendedAwaitTransfer(b: SuspendedBill): boolean {
  return (b.suspendKind ?? 'hold') === 'await_transfer'
}

type PosFitmentBadge = {
  label: string
  matchedRows: string[]
}

function stripYearFromEngineLabel(label: string): string {
  return label.replace(/\s*\(\d{4}\)\s*$/, '').trim()
}

function parseYearsFromLabel(label: string): number[] {
  const current = new Date().getFullYear()
  const mRange = label.match(/(\d{4})\s*[-–]\s*(\d{4})/)
  if (mRange) {
    const from = Number(mRange[1])
    const to = Number(mRange[2])
    return Array.from({ length: to - from + 1 }, (_, i) => from + i)
  }
  const mFrom = label.match(/(\d{4})\s*\+/)
  if (mFrom) {
    const from = Number(mFrom[1])
    return Array.from({ length: current - from + 1 }, (_, i) => from + i)
  }
  const mSingle = label.match(/\b(\d{4})\b/)
  if (mSingle) return [Number(mSingle[1])]
  return []
}

function normalizeSearchText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

function tokenizeSearch(q: string): string[] {
  return q
    .trim()
    .split(/\s+/g)
    .map((t) => normalizeSearchText(t))
    .filter(Boolean)
}

function fitmentYearLabel(f: VehicleFitmentRef): string {
  if (f.yearFrom != null && f.yearTo != null) return `${f.yearFrom}-${f.yearTo}`
  if (f.yearFrom != null && f.yearTo == null) return `${f.yearFrom}-ปัจจุบัน`
  if (f.yearFrom == null && f.yearTo != null) return `ถึง ${f.yearTo}`
  const y = f.yearRangeText?.trim()
  if (y) return y
  const fromEngineLabel = f.engineLabel.match(/(\d{4}\s*[-–]\s*\d{4})/)
  return fromEngineLabel?.[1] ?? '-'
}

function getFitmentEngineName(f: VehicleFitmentRef): string {
  if (f.engineText?.trim()) return f.engineText.trim()
  const label = f.engineLabel?.trim() || ''
  if (!label || label === 'ไม่ระบุเครื่อง/ปี') return ''
  // Strip trailing "(YYYY-YYYY)" or "(YYYY-ปัจจุบัน)"
  const stripped = label.replace(/\s*\(\s*\d{4}[\s\S]*?\)\s*$/, '').trim()
  // If what remains is a year range or "ปี" prefix, it's not engine info
  if (/^ปี\s*\d/.test(stripped) || /^\d{4}\s*[-–]/.test(stripped) || /^\d{4}$/.test(stripped)) return ''
  return stripped
}

function buildFitmentSummary(f: VehicleFitmentRef): string {
  const engine = getFitmentEngineName(f)
  const year = fitmentYearLabel(f)
  const brake = f.brakePosition === 'front' ? ' · เบรกหน้า' : f.brakePosition === 'rear' ? ' · เบรกหลัง' : ''
  const engPart = engine ? ` · ${engine}` : ''
  const yrPart = year !== '-' ? ` (ปี ${year})` : ''
  return `${f.brandName} ${f.modelName}${engPart}${yrPart}${brake}`
}

function displayPriceLevelLabel(levelIndex: number, fallbackLabel: string): string {
  const byIndex = ['ปลีก', 'ช่าง', 'ส่ง', 'VIP', 'พิเศษ'][levelIndex]
  return byIndex ?? fallbackLabel
}

function defaultLinePriceTypeLabel(line: CartLine): string {
  if (line.stlBoltRole === 'washerGift') return 'แถม'
  if (line.priceLevelIndex != null && Number.isFinite(line.priceLevelIndex) && line.priceLevelIndex >= 0) {
    return displayPriceLevelLabel(line.priceLevelIndex, line.priceLevel)
  }
  return line.priceLevel || 'ราคา'
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function isSaleBillNoDuplicateError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return msg.includes('Sale_billNo_key') || msg.toLowerCase().includes('duplicate key value')
}

type QrModalBodyProps = {
  amount: number
  accountId: string
  bankAccounts: import('@/features/bank/bankStore').BankAccountRecord[]
  onClose: () => void
}

function QrModalBody({ amount, accountId, bankAccounts, onClose }: QrModalBodyProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)
  const account = bankAccounts.find((a) => a.id === accountId)

  useEffect(() => {
    setQrDataUrl(null)
    setQrError(null)
    if (!account?.promptPayId) return
    promptPayDataUrl(account.promptPayId, amount)
      .then(setQrDataUrl)
      .catch((e) => setQrError(e instanceof Error ? e.message : 'สร้าง QR ไม่สำเร็จ'))
  }, [account?.promptPayId, amount])

  return (
    <div className="space-y-3 p-5 text-center">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#2a2d3e] dark:bg-[#050508]">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          ยอดโอน
        </div>
        <div className="mt-1 bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text font-mono text-2xl font-black text-transparent dark:from-emerald-400 dark:to-cyan-300">
          {amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </div>

        <div className="mt-3 flex min-h-[12rem] items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-[#2a2d3e] dark:bg-[#12141c]">
          {account?.promptPayId ? (
            qrDataUrl ? (
              <img src={qrDataUrl} alt="PromptPay QR" className="size-48 object-contain" />
            ) : qrError ? (
              <p className="text-xs text-rose-500 px-4">{qrError}</p>
            ) : (
              <p className="text-xs text-slate-400">กำลังสร้าง QR…</p>
            )
          ) : (
            <div className="px-6 py-4 text-center">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">ไม่มี PromptPay ID</p>
              <p className="mt-1 text-xs text-slate-400">เพิ่ม PromptPay ID ในหน้า เปิด/ปิดกะ › บัญชีธนาคาร</p>
            </div>
          )}
        </div>

        {account && (
          <div className="mt-2 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            <p className="font-semibold">{account.bankName} · {account.accountNo}</p>
            <p>{account.accountName}{account.branch ? ` (${account.branch})` : ''}</p>
            {account.promptPayId && <p className="text-slate-400">PromptPay: {account.promptPayId}</p>}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-black uppercase tracking-widest text-white hover:from-blue-500 hover:to-indigo-500 dark:from-cyan-600 dark:to-blue-600 dark:hover:from-cyan-500 dark:hover:to-blue-500"
      >
        ปิด
      </button>
    </div>
  )
}

export function PosWorkspacePage({ className }: PosWorkspacePageProps) {
  const { theme, setTheme } = useThemePreference()
  const [mode, setMode] = useState<SaleMode>('retail')

  const isDark = theme === 'dark'
  const statusText = useMemo(() => (mode === 'tax' ? 'TAX INVOICE' : 'RETAIL POS'), [mode])

  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [suggestHighlightIndex, setSuggestHighlightIndex] = useState(-1)
  const suggestDropdownRef = useRef<HTMLDivElement | null>(null)
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [productModalCategory, setProductModalCategory] = useState<string | null>(null)
  const [productModalMake, setProductModalMake] = useState('ทั้งหมด')
  const [productModalModel, setProductModalModel] = useState('ทั้งหมด')
  const [selectedModalProduct, setSelectedModalProduct] = useState<Product | null>(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showAmountNoticeModal, setShowAmountNoticeModal] = useState(false)
  const [showPickingModal, setShowPickingModal] = useState(false)
  const [showQuotationModal, setShowQuotationModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [cfdOpening, setCfdOpening] = useState(false)
  const [posSpotlight, setPosSpotlight] = useState<{ sku: string; name: string; price: number; unit: string } | null>(null)
  const [posSpotlightUrls, setPosSpotlightUrls] = useState<string[]>([])
  const [posSpotlightIndex, setPosSpotlightIndex] = useState(0)
  const [posSpotlightExpanded, setPosSpotlightExpanded] = useState(false)
  const [showHistoryPopup, setShowHistoryPopup] = useState(false)
  const [expandedHistoryBills, setExpandedHistoryBills] = useState<Set<string>>(new Set())
  const [fitmentPreviewSku, setFitmentPreviewSku] = useState<string | null>(null)
  const [checkoutPaymentType, setCheckoutPaymentType] = useState<CheckoutPaymentType>('cash')
  const [checkoutShippingMethod, setCheckoutShippingMethod] = useState('รับเอง')
  const [transportNames, setTransportNames] = useState<string[]>(() => loadTransportDirectory().map((c) => c.name))
  const [isSavingCheckout, setIsSavingCheckout] = useState(false)

  const [cashReceived, setCashReceived] = useState('')
  const [selectedBank, setSelectedBank] = useState(() => getDefaultBankAccount()?.id ?? '')
  const [bankAccounts, setBankAccounts] = useState(() => loadBankAccounts())
  const [mixedCashAmount, setMixedCashAmount] = useState('')
  const [mixedTransferAmount, setMixedTransferAmount] = useState('')
  const [billDiscount, setBillDiscount] = useState('')
  const [applyRounding, setApplyRounding] = useState(false)
  const [suspendedBills, setSuspendedBills] = useState<SuspendedBill[]>([])
  const [disabledWasherGiftByMaleCode, setDisabledWasherGiftByMaleCode] = useState<Record<string, boolean>>({})

  const [memberTick, setMemberTick] = useState(0)
  const [posMemberRows, setPosMemberRows] = useState<Member[]>(() => loadMembers())

  useEffect(() => {
    const on = () => setMemberTick((n) => n + 1)
    window.addEventListener(MEMBERS_CHANGED_EVENT, on)
    return () => window.removeEventListener(MEMBERS_CHANGED_EVENT, on)
  }, [])

  useEffect(() => {
    const on = () => setTransportNames(loadTransportDirectory().map((c) => c.name))
    window.addEventListener(TRANSPORT_DIRECTORY_CHANGED_EVENT, on)
    return () => window.removeEventListener(TRANSPORT_DIRECTORY_CHANGED_EVENT, on)
  }, [])

  useEffect(() => {
    const on = () => {
      const accounts = loadBankAccounts()
      setBankAccounts(accounts)
      setSelectedBank((prev) => {
        if (accounts.find((a) => a.id === prev)) return prev
        return getDefaultBankAccount()?.id ?? ''
      })
    }
    window.addEventListener(BANK_CHANGED_EVENT, on)
    return () => window.removeEventListener(BANK_CHANGED_EVENT, on)
  }, [])

  useEffect(() => {
    let alive = true
    void loadMembersAsync().then((rows) => {
      if (alive) setPosMemberRows(rows)
    })
    return () => {
      alive = false
    }
  }, [memberTick])

  const mockMembers: Customer[] = useMemo(() => {
    const members = posMemberRows
      .filter((m) => m.status !== 'blacklist')
      .map((m) => ({
        accountCode: m.memberCode,
        name: m.fullName,
        phone: m.phone ?? '',
        taxId: m.taxId ?? '',
        branch: BRANCHES.find((b) => b.id === m.branchId)?.name ?? '',
        address: m.address ?? '',
        creditTerms:
          m.creditTermMonths > 0 || m.creditTermDays > 0
            ? `${m.creditTermMonths > 0 ? `${m.creditTermMonths} เดือน ` : ''}${m.creditTermDays > 0 ? `${m.creditTermDays} วัน` : ''}`.trim()
            : 'เงินสด',
        creditLimit: m.creditLimitBaht ?? 0,
        creditUsed: m.arBalance ?? 0,
        points: m.pointsBalance ?? 0,
      }))
    return [WALK_IN_CUSTOMER, ...members]
  }, [posMemberRows])

  const walkInCustomer = useMemo(() => mockMembers.find((m) => m.accountCode === 'WK-00001') ?? WALK_IN_CUSTOMER, [mockMembers])

  const [customer, setCustomer] = useState<Customer>(WALK_IN_CUSTOMER)
  const [memberHistory, setMemberHistory] = useState<PosSalesHistoryRow[]>([])

  useEffect(() => {
    setShowHistoryPopup(false)
    if (customer.accountCode === WALK_IN_CUSTOMER.accountCode) {
      setMemberHistory([])
      return
    }
    loadPosSalesHistoryByMemberAsync(customer.accountCode, 5).then(setMemberHistory).catch(() => setMemberHistory([]))
  }, [customer.accountCode])

  const [docInfo, setDocInfo] = useState(() => {
    const d = new Date()
    return {
      posBillNo: peekNextPosBillNumber(d),
      taxInvoiceNo: peekNextTaxInvoiceNumber(d),
      docDate: localDateYYYYMMDD(d),
      employee: '001 สมชาย (Player 1)',
      vatType: 'exclude' as 'exclude' | 'include' | 'none',
      remark: '',
    }
  })

  useEffect(() => {
    const docDate = docInfo.docDate
    const d = parseLocalYYYYMMDD(docDate)
    if (!isTauri()) {
      setDocInfo((prev) => ({
        ...prev,
        posBillNo: peekNextPosBillNumber(d),
        taxInvoiceNo: peekNextTaxInvoiceNumber(d),
      }))
      return
    }
    let cancel = false
    void (async () => {
      try {
        const [pos, tax] = await Promise.all([
          peekNextPosBillNumberAsync(docDate),
          peekNextTaxInvoiceNumberAsync(docDate),
        ])
        if (!cancel) {
          setDocInfo((prev) => (prev.docDate !== docDate ? prev : { ...prev, posBillNo: pos, taxInvoiceNo: tax }))
        }
      } catch (e) {
        console.error('[pos] bill sequence peek failed', e)
        if (!cancel) {
          setDocInfo((prev) =>
            prev.docDate !== docDate
              ? prev
              : {
                  ...prev,
                  posBillNo: peekNextPosBillNumber(d),
                  taxInvoiceNo: peekNextTaxInvoiceNumber(d),
                },
          )
        }
      }
    })()
    return () => {
      cancel = true
    }
  }, [docInfo.docDate])

  const [cart, setCart] = useState<CartLine[]>([])
  const [stockVersion, setStockVersion] = useState(0)

  const LOW_STOCK_THRESHOLD = 3

  const mockProducts: Product[] = useMemo(
    () =>
      mergeInventoryProductsWithLiveStock(getPosCatalogProducts()).map((p) => ({
        id: p.id,
        code: p.sku,
        name: p.name,
        unit: p.stockMode === 'kg_roll' ? 'กก.' : p.stockMode === 'meter_roll' ? 'เมตร' : 'ชิ้น',
        price: 0,
        stock: p.stock,
        category: p.category || undefined,
        brand: p.brand || undefined,
        location: p.location || undefined,
        carBrand: p.carBrand,
        carModelLabel: p.carModelLabel,
        yearLabel: p.yearLabel,
        factoryOem: p.factoryOem,
        genuineNo: p.genuineNo,
        dimensions: getProductMasterBySku(p.sku)?.physicalDimensions,
      })),
    [stockVersion],
  )
  const productTagRegistry = useMemo(() => loadProductTagsRegistry(), [])
  const priceTypeLabelForLine = (line: CartLine): string => {
    if (line.stlBoltRole === 'washerGift') return 'แถม'
    if (line.productId && line.unitIndex != null && line.priceLevelIndex != null) {
      const master = getProductMasterBySku(line.code)
      const tagIds = master?.productTagIds ?? []
      if (tagIds.length > 0) {
        const cfg = getPosSellConfig(line.productId)
        const listPrice = cfg.getListUnitPrice(line.unitIndex, line.priceLevelIndex)
        let picked: { label: string; discount: number } | null = null
        for (const id of tagIds) {
          const tag = productTagRegistry.find((t) => t.id === id)
          if (!tag || !tag.label.startsWith('Bolt:')) continue
          if (!tag.discountPercent || tag.discountPercent <= 0) continue
          const min = tag.priceMinBaht ?? 0
          const max = tag.priceMaxBaht ?? Number.POSITIVE_INFINITY
          if (listPrice < min || listPrice > max) continue
          if (!picked || tag.discountPercent > picked.discount) {
            picked = { label: tag.label, discount: tag.discountPercent }
          }
        }
        if (picked) return picked.label
      }
    }
    return defaultLinePriceTypeLabel(line)
  }
  const isWalkIn = customer.accountCode === 'WK-00001'

  const creditBar = useMemo(() => {
    const limit = Math.max(0, customer.creditLimit)
    const usedRaw = Math.max(0, customer.creditUsed)
    const used = limit > 0 ? Math.min(usedRaw, limit) : usedRaw
    const remaining = Math.max(0, limit - used)
    const pct = limit > 0 ? Math.min(100, (remaining / limit) * 100) : 0
    return { limit, used, remaining, pct }
  }, [customer.creditLimit, customer.creditUsed])

  const creditCycleDisplay = useMemo(() => {
    if (isWalkIn) return 'เงินสด'
    const m = posMemberRows.find((row) => row.memberCode === customer.accountCode)
    if (!m) return 'เงินสด'
    const hasCreditProfile =
      (m.creditLimitBaht ?? 0) > 0 ||
      (m.creditTermMonths ?? 0) > 0 ||
      (m.creditTermDays ?? 0) > 0 ||
      m.payAtMonthEnd ||
      (m.cutOffDayOfMonth != null && m.cutOffDayOfMonth > 0)
    if (!hasCreditProfile) return 'เงินสด'
    return formatCreditCycleRangeFromDocDate(docInfo.docDate)
  }, [isWalkIn, customer.accountCode, posMemberRows, docInfo.docDate])

  const filteredMembers = useMemo(() => {
    const q = memberSearchQuery.trim().toLowerCase()
    const base = q
      ? mockMembers.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.accountCode.toLowerCase().includes(q) ||
            phoneMatchesQuery(m.phone, q) ||
            (m.taxId && m.taxId.includes(q)),
        )
      : mockMembers

    return base
  }, [memberSearchQuery, mockMembers, mode])

  const productHaystackMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of mockProducts) {
      map.set(
        p.code,
        normalizeSearchText(
          [p.code, p.name, p.factoryOem ?? '', p.genuineNo ?? '', p.brand ?? '', p.category ?? '', p.carBrand ?? '', p.carModelLabel ?? '', p.yearLabel ?? '', masterSearchExtrasForSku(p.code)].join(' '),
        ),
      )
    }
    return map
  }, [mockProducts])

  const deferredProductSearchQuery = useDeferredValue(productSearchQuery)
  const deferredBarcodeInput = useDeferredValue(barcodeInput)

  const modalCategoryOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const p of mockProducts) {
      if (p.category) seen.add(p.category)
    }
    return [...seen].sort((a, b) => a.localeCompare(b, 'th'))
  }, [mockProducts])

  const modalMakeOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const p of mockProducts) {
      if (p.carBrand) seen.add(p.carBrand)
    }
    return ['ทั้งหมด', ...[...seen].sort((a, b) => a.localeCompare(b, 'th'))]
  }, [mockProducts])

  const modalModelOptions = useMemo(() => {
    if (productModalMake === 'ทั้งหมด') return ['ทั้งหมด']
    const seen = new Set<string>()
    for (const p of mockProducts) {
      if (p.carBrand === productModalMake && p.carModelLabel) seen.add(p.carModelLabel)
    }
    return ['ทั้งหมด', ...[...seen].sort((a, b) => a.localeCompare(b, 'th'))]
  }, [mockProducts, productModalMake])

  const filteredProducts = useMemo(() => {
    const tokens = tokenizeSearch(deferredProductSearchQuery)
    const hasMakeFilter = productModalMake !== 'ทั้งหมด'
    const hasModelFilter = productModalModel !== 'ทั้งหมด'
    const hasTextFilter = tokens.length > 0
    if (!productModalCategory && !hasMakeFilter && !hasTextFilter) return mockProducts.slice(0, 150)

    const passFilters = (p: InventoryProduct) => {
      if (productModalCategory && p.category !== productModalCategory) return false
      if (hasMakeFilter && p.carBrand !== productModalMake) return false
      if (hasModelFilter && p.carModelLabel !== productModalModel) return false
      return true
    }
    if (!hasTextFilter) return mockProducts.filter(passFilters).slice(0, 200)

    const getHay = (p: InventoryProduct) => productHaystackMap.get(p.code) ?? ''
    const q = tokens.join('')

    const scoreProduct = (p: InventoryProduct): number => {
      const hay = getHay(p)
      const normSku  = normalizeSearchText(p.code)
      const normOem  = normalizeSearchText(p.factoryOem ?? '')
      const normName = normalizeSearchText(p.name)
      if (normSku === q || normOem === q) return 100
      if (normSku.startsWith(q) || normOem.startsWith(q)) return 80
      if (tokens.every((t) => normSku.includes(t)) || tokens.every((t) => normOem.includes(t))) return 60
      if (tokens.every((t) => normName.includes(t))) return 40
      if (tokens.every((t) => hay.includes(t))) return 20
      return (tokens.filter((t) => hay.includes(t)).length / tokens.length) * 10
    }

    const andMatches = mockProducts.filter((p) => passFilters(p) && tokens.every((t) => getHay(p).includes(t)))
    const candidates = andMatches.length > 0
      ? andMatches
      : tokens.length > 1
        ? mockProducts.filter((p) => passFilters(p) && tokens.some((t) => getHay(p).includes(t)))
        : []

    return candidates
      .map((p) => [p, scoreProduct(p)] as const)
      .sort((a, b) => b[1] - a[1])
      .map(([p]) => p)
      .slice(0, 200)
  }, [mockProducts, productHaystackMap, deferredProductSearchQuery, productModalCategory, productModalMake, productModalModel])

  useEffect(() => {
    if (!showProductModal) return
    if (selectedModalProduct && filteredProducts.some((p) => p.id === selectedModalProduct.id)) return
    setSelectedModalProduct(filteredProducts[0] ?? null)
  }, [filteredProducts, showProductModal])

  const quickTextMatchedProducts = useMemo(() => {
    const tokens = tokenizeSearch(deferredBarcodeInput)
    if (!tokens.length) return []
    const q = tokens.join('')
    return mockProducts
      .filter((p) => {
        const hay = productHaystackMap.get(p.code) ?? ''
        return tokens.every((t) => hay.includes(t))
      })
      .map((p) => {
        const normSku = normalizeSearchText(p.code)
        const normOem = normalizeSearchText(p.factoryOem ?? '')
        let s = 20
        if (normSku === q || normOem === q) s = 100
        else if (normSku.startsWith(q) || normOem.startsWith(q)) s = 80
        else if (tokens.every((t) => normSku.includes(t)) || tokens.every((t) => normOem.includes(t))) s = 60
        else if (tokens.every((t) => normalizeSearchText(p.name).includes(t))) s = 40
        return [p, s] as const
      })
      .sort((a, b) => b[1] - a[1])
      .map(([p]) => p)
  }, [deferredBarcodeInput, mockProducts, productHaystackMap])

  const quickSuggestProducts = useMemo(
    () => quickTextMatchedProducts.slice(0, 10),
    [quickTextMatchedProducts],
  )

  const fitmentBadgeBySku = useMemo(() => {
    const map = new Map<string, PosFitmentBadge>()
    for (const p of quickSuggestProducts) {
      const master = getProductMasterBySku(p.code)
      if (!master?.vehicleFitments?.length) continue
      const firstYear = fitmentYearLabel(master.vehicleFitments[0])
      map.set(p.code, {
        label: `ปี ${firstYear}`,
        matchedRows: master.vehicleFitments.map(buildFitmentSummary),
      })
    }
    return map
  }, [quickSuggestProducts])

  const fitmentPreviewRows = useMemo(() => {
    if (!fitmentPreviewSku) return []
    return fitmentBadgeBySku.get(fitmentPreviewSku)?.matchedRows ?? []
  }, [fitmentBadgeBySku, fitmentPreviewSku])

  useEffect(() => {
    if (suggestHighlightIndex < 0 || !suggestDropdownRef.current) return
    const el = suggestDropdownRef.current.querySelector<HTMLElement>(`[data-suggest-index="${suggestHighlightIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [suggestHighlightIndex])

  const pricedCart = useMemo(() => {
    const next = cart.map((l) => ({ ...l }))
    const promoInputs: Array<{
      idx: number
      productId: string
      qty: number
      listPricePerUnit: number
      master: NonNullable<ReturnType<typeof getProductMasterBySku>>
    }> = []
    next.forEach((l, idx) => {
      if (l.stlBoltRole === 'washerGift') {
        next[idx] = { ...next[idx], discount: 0 }
        return
      }
      if (!l.productId || l.qty <= 0 || l.price <= 0) return
      const master = getProductMasterBySku(l.code)
      if (!master) return
      promoInputs.push({ idx, productId: l.productId, qty: l.qty, listPricePerUnit: l.price, master })
    })
    if (!promoInputs.length) return next
    const promo = computeStlVolumePromo({
      lines: promoInputs.map((x) => ({
        productId: x.productId,
        qty: x.qty,
        listPricePerUnit: x.listPricePerUnit,
        master: x.master,
      })),
      mode: 'retail',
    })
    promo.lineResults.forEach((r, i) => {
      const src = promoInputs[i]
      if (!src) return
      const discount = Math.max(0, round2(r.listSubtotal - r.sellSubtotal))
      next[src.idx] = { ...next[src.idx], discount }
    })
    return next
  }, [cart])

  const totals = useMemo(() => {
    const subtotal = pricedCart.reduce((sum, line) => sum + line.price * line.qty - line.discount, 0)
    const discountAmt = Number.parseFloat(billDiscount || '0') || 0
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmt)

    const vatType = mode === 'tax' ? docInfo.vatType : 'none'
    const applyVat = (base: number) => {
      if (vatType === 'exclude') {
        const beforeVat = base
        const vatAmount = base * 0.07
        return { beforeVat, vatAmount, rawGrandTotal: beforeVat + vatAmount }
      }
      if (vatType === 'include') {
        const beforeVat = base * (100 / 107)
        const vatAmount = base - beforeVat
        return { beforeVat, vatAmount, rawGrandTotal: base }
      }
      return { beforeVat: base, vatAmount: 0, rawGrandTotal: base }
    }

    const { beforeVat, vatAmount, rawGrandTotal } = applyVat(subtotalAfterDiscount)
    const decimalPart = Number.parseFloat((rawGrandTotal % 1).toFixed(2))
    const roundingAdjustment =
      applyRounding && decimalPart > 0
        ? decimalPart <= 0.5
          ? -decimalPart
          : Number.parseFloat((1 - decimalPart).toFixed(2))
        : 0
    const grandTotal = rawGrandTotal + roundingAdjustment

    return { subtotal, discountAmt, beforeVat, vatAmount, rawGrandTotal, roundingAdjustment, grandTotal }
  }, [applyRounding, billDiscount, pricedCart, docInfo.vatType, mode])

  useEffect(() => {
    if (showQRModal) return
    const memberName =
      customer.accountCode !== WALK_IN_CUSTOMER.accountCode ? customer.name : null
    writeCfdState({
      mode: pricedCart.length > 0 ? 'active' : 'idle',
      lines: pricedCart.map((l) => ({
        name: l.name,
        qty: l.qty,
        unitLabel: l.unit,
        unitPrice: l.price,
        lineTotal: Math.max(0, l.price * l.qty - l.discount),
        sku: l.code,
      })),
      subtotal: totals.subtotal,
      discountAmt: totals.discountAmt,
      vatAmount: totals.vatAmount,
      grandTotal: totals.grandTotal,
      memberName,
      updatedAt: Date.now(),
    })
  }, [showQRModal, pricedCart, totals, customer.accountCode, customer.name])

  useEffect(() => {
    if (!showQRModal) return
    const account = bankAccounts.find((a) => a.id === selectedBank)
    const memberName =
      customer.accountCode !== WALK_IN_CUSTOMER.accountCode ? customer.name : null
    writeCfdState({
      mode: 'qr',
      lines: pricedCart.map((l) => ({
        name: l.name,
        qty: l.qty,
        unitLabel: l.unit,
        unitPrice: l.price,
        lineTotal: Math.max(0, l.price * l.qty - l.discount),
      })),
      subtotal: totals.subtotal,
      discountAmt: totals.discountAmt,
      vatAmount: totals.vatAmount,
      grandTotal: totals.grandTotal,
      memberName,
      qrPromptPayId: account?.promptPayId,
      qrAmount: checkoutPaymentType === 'mixed'
        ? (Number.parseFloat(mixedTransferAmount || '0') || 0)
        : totals.grandTotal,
      qrBankName: account?.bankName,
      qrAccountName: account?.accountName,
      updatedAt: Date.now(),
    })
  }, [showQRModal, bankAccounts, selectedBank, pricedCart, totals, customer.accountCode, customer.name, checkoutPaymentType, mixedTransferAmount])

  useEffect(() => {
    setPosSpotlightUrls([])
    setPosSpotlightIndex(0)
    setPosSpotlightExpanded(false)
    if (!posSpotlight) return
    getProductImageUrls(posSpotlight.sku).then((urls) => {
      setPosSpotlightUrls(urls)
    }).catch(() => null)
  }, [posSpotlight])

  const hasAwaitTransferSuspended = useMemo(
    () => suspendedBills.some(isSuspendedAwaitTransfer),
    [suspendedBills],
  )

  const receivedAmount = useMemo(() => Number.parseFloat(cashReceived || '0') || 0, [cashReceived])
  const changeAmount = useMemo(() => receivedAmount - totals.grandTotal, [receivedAmount, totals.grandTotal])

  const quickCashAmounts = useMemo(() => {
    const total = totals.grandTotal
    if (total <= 0) return []
    const amounts = new Set<number>()
    const denoms = [10, 20, 50, 100, 500, 1000]
    denoms.forEach((d) => {
      let rounded = Math.ceil(total / d) * d
      if (rounded <= total) rounded += d
      amounts.add(rounded)
    })
    return Array.from(amounts).sort((a, b) => a - b).slice(0, 3)
  }, [totals.grandTotal])

  const mixedCashNum = useMemo(() => Number.parseFloat(mixedCashAmount || '0') || 0, [mixedCashAmount])
  const mixedTransferNum = useMemo(() => Number.parseFloat(mixedTransferAmount || '0') || 0, [mixedTransferAmount])
  const mixedSum = useMemo(() => mixedCashNum + mixedTransferNum, [mixedCashNum, mixedTransferNum])
  const qrAmount = useMemo(
    () => checkoutPaymentType === 'mixed' ? mixedTransferNum : totals.grandTotal,
    [checkoutPaymentType, mixedTransferNum, totals.grandTotal],
  )

  const showProductImage = (item: { code: string; name: string; price?: number; unit?: string }) => {
    setPosSpotlight({ sku: item.code, name: item.name, price: item.price ?? 0, unit: item.unit ?? '' })
    writeCfdState({ ...readCfdState(), spotlightSku: item.code, updatedAt: Date.now() })
  }

  const removeLine = (id: number) => {
    setCart((prev) => {
      const target = prev.find((l) => l.id === id)
      if (!target) return prev
      let next = prev.filter((l) => l.id !== id)
      if (!target.stlBoltRole) {
        setDisabledWasherGiftByMaleCode((prevMap) => {
          if (!prevMap[target.code]) return prevMap
          const copy = { ...prevMap }
          delete copy[target.code]
          return copy
        })
        next = next.filter(
          (l) => !(l.stlBoltMaleCode === target.code && (l.stlBoltRole === 'nut' || l.stlBoltRole === 'washerGift')),
        )
        return next
      }
      if (target.stlBoltRole === 'washerGift' && target.stlBoltMaleCode) {
        const nextDisabled = { ...disabledWasherGiftByMaleCode, [target.stlBoltMaleCode]: true }
        setDisabledWasherGiftByMaleCode(nextDisabled)
        // ลบแหวนแล้วต้องไม่ sync รอบเดียวกัน ไม่งั้นจะถูกเติมกลับจนต้องกด 2 ครั้ง
        return syncStlGiftLineForMaleCode(next, target.stlBoltMaleCode, nextDisabled)
      }
      if (target.stlBoltMaleCode) {
        next = syncStlGiftLineForMaleCode(next, target.stlBoltMaleCode)
      }
      return next
    })
  }

  const addProductToCart = (p: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.code === p.code && !l.stlBoltRole)
      if (idx === -1) {
        const cfg = getPosSellConfig(p.id)
        const picked = pickDefaultPosUnitAndPrice(cfg)
        const selectedListPrice =
          picked != null ? cfg.getListUnitPrice(picked.unit.index, picked.level.index) : p.price
        const nextId = (prev.at(-1)?.id ?? 0) + 1
        const bundleBreakdown = p.bundleComponents?.length
          ? resolveBundleBreakdown(p.bundleComponents)
          : undefined
        return [
          ...prev,
          {
            id: nextId,
            productId: p.id,
            code: p.code,
            name: p.name,
            unit: picked?.unit.label ?? p.unit,
            unitIndex: picked?.unit.index ?? 0,
            basePrice: selectedListPrice,
            price: selectedListPrice,
            priceLevel: picked?.level.label ?? 'ราคา 1',
            priceLevelIndex: picked?.level.index ?? 0,
            discount: 0,
            qty: 1,
            ...(bundleBreakdown ? { stockBreakdown: bundleBreakdown } : {}),
          },
        ]
      }
      const next = [...prev]
      next[idx] = { ...next[idx], qty: next[idx].qty + 1 }
      return next
    })
  }

  const syncStlGiftLineForMaleCode = (
    lines: CartLine[],
    maleCode: string,
    disabledMapOverride?: Record<string, boolean>,
  ): CartLine[] => {
    const maleSeed = lines.find((l) => l.code === maleCode && !l.stlBoltRole)
    if (!maleSeed) return lines
    const maleProductId = maleSeed.productId ?? mockProducts.find((p) => p.code === maleCode)?.id
    if (!maleProductId) return lines
    const pair = getStlBoltPairForMaleProduct(maleProductId)
    if (!pair) return lines
    const washer = mockProducts.find((p) => p.id === pair.washerProductId)
    if (!washer) return lines

    const maleQty = lines.filter((l) => l.code === maleCode && !l.stlBoltRole).reduce((s, l) => s + l.qty, 0)
    const nutQty = lines
      .filter((l) => l.stlBoltRole === 'nut' && l.stlBoltMaleCode === maleCode)
      .reduce((s, l) => s + l.qty, 0)
    const disabledMap = disabledMapOverride ?? disabledWasherGiftByMaleCode
    const giftQty = disabledMap[maleCode] ? 0 : Math.max(0, Math.min(maleQty, nutQty))
    const giftIdx = lines.findIndex((l) => l.stlBoltRole === 'washerGift' && l.stlBoltMaleCode === maleCode)

    if (giftQty <= 0) return giftIdx >= 0 ? lines.filter((_, i) => i !== giftIdx) : lines
    if (giftIdx >= 0) {
      const next = [...lines]
      next[giftIdx] = {
        ...next[giftIdx],
        qty: giftQty,
        productId: washer.id,
        code: washer.code,
        name: `${washer.name} [แถมคู่น็อต STL]`,
        basePrice: 0,
        price: 0,
        priceLevel: 'แถม',
        priceLevelIndex: 0,
      }
      return next
    }
    const nextId = (lines.at(-1)?.id ?? 0) + 1
    return [
      ...lines,
      {
        id: nextId,
        productId: washer.id,
        code: washer.code,
        name: `${washer.name} [แถมคู่น็อต STL]`,
        unit: washer.unit,
        unitIndex: 0,
        basePrice: 0,
        price: 0,
        priceLevel: 'แถม',
        priceLevelIndex: 0,
        discount: 0,
        qty: giftQty,
        stlBoltRole: 'washerGift',
        stlBoltMaleCode: maleCode,
      },
    ]
  }

  const addBoltNutForLine = (lineId: number) => {
    setCart((prev) => {
      const line = prev.find((l) => l.id === lineId)
      if (!line || line.stlBoltRole) return prev
      const maleProductId = line.productId ?? mockProducts.find((p) => p.code === line.code)?.id
      if (!maleProductId) return prev
      const pair = getStlBoltPairForMaleProduct(maleProductId)
      if (!pair) return prev
      const nut = mockProducts.find((p) => p.id === pair.nutProductId)
      if (!nut) return prev

      const cfg = getPosSellConfig(nut.id)
      const picked = pickDefaultPosUnitAndPrice(cfg)
      const selectedListPrice =
        picked != null ? cfg.getListUnitPrice(picked.unit.index, picked.level.index) : nut.price
      let next = [...prev]
      const nutIdx = next.findIndex((l) => l.stlBoltRole === 'nut' && l.stlBoltMaleCode === line.code)
      if (nutIdx >= 0) {
        // กด +หัว = ซิงก์จำนวนหัวให้เท่ากับตัวผู้ในบรรทัดนี้ทันที
        next[nutIdx] = { ...next[nutIdx], qty: line.qty }
      } else {
        const nextId = (next.at(-1)?.id ?? 0) + 1
        next.push({
          id: nextId,
          productId: nut.id,
          code: nut.code,
          name: `${nut.name} [หัวน็อตคู่]`,
          unit: picked?.unit.label ?? nut.unit,
          unitIndex: picked?.unit.index ?? 0,
          basePrice: selectedListPrice,
          price: selectedListPrice,
          priceLevel: picked?.level.label ?? 'ราคา 1',
          priceLevelIndex: picked?.level.index ?? 0,
          discount: 0,
          qty: line.qty,
          stlBoltRole: 'nut',
          stlBoltMaleCode: line.code,
        })
      }
      const nextDisabled = { ...disabledWasherGiftByMaleCode }
      delete nextDisabled[line.code]
      setDisabledWasherGiftByMaleCode(nextDisabled)
      return syncStlGiftLineForMaleCode(next, line.code, nextDisabled)
    })
  }

  const updateLineQty = (id: number, qtyRaw: string) => {
    const qty = Math.max(0, Number(qtyRaw) || 0)
    setCart((prev) => {
      const target = prev.find((l) => l.id === id)
      if (!target) return prev
      let next = prev.map((l) => (l.id === id ? { ...l, qty } : l))
      if (!target.stlBoltRole) {
        next = syncStlGiftLineForMaleCode(next, target.code)
      } else if (target.stlBoltRole === 'nut' && target.stlBoltMaleCode) {
        next = syncStlGiftLineForMaleCode(next, target.stlBoltMaleCode)
      }
      return next
    })
  }

  const updateLineUnit = (id: number, unitIndexRaw: string) => {
    const unitIndex = Number(unitIndexRaw)
    setCart((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        if (!l.productId || !Number.isFinite(unitIndex)) return l
        const cfg = getPosSellConfig(l.productId)
        const unit = cfg.units.find((u) => u.index === unitIndex)
        if (!unit) return l
        const levels = posPriceLevelsForUnit(cfg, unit.index)
        const level = levels[0] ?? cfg.priceLevels[0]
        const price = level ? cfg.getListUnitPrice(unit.index, level.index) : l.price
        return {
          ...l,
          unit: unit.label,
          unitIndex: unit.index,
          priceLevel: level?.label ?? l.priceLevel,
          priceLevelIndex: level?.index ?? l.priceLevelIndex,
          basePrice: price,
          price,
        }
      }),
    )
  }

  const updateLinePriceLevel = (id: number, priceLevelIndexRaw: string) => {
    const priceLevelIndex = Number(priceLevelIndexRaw)
    setCart((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        if (!l.productId || l.unitIndex == null || !Number.isFinite(priceLevelIndex)) return l
        const cfg = getPosSellConfig(l.productId)
        const level = cfg.priceLevels.find((x) => x.index === priceLevelIndex)
        if (!level) return l
        const price = cfg.getListUnitPrice(l.unitIndex, level.index)
        return { ...l, priceLevel: level.label, priceLevelIndex: level.index, basePrice: price, price }
      }),
    )
  }

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setBarcodeInput('')
      setSuggestHighlightIndex(-1)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSuggestHighlightIndex((prev) => Math.min(prev + 1, quickSuggestProducts.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSuggestHighlightIndex((prev) => Math.max(prev - 1, -1))
      return
    }
    if (e.key !== 'Enter') return
    e.preventDefault()
    const code = barcodeInput.trim()
    if (!code) return
    const highlighted = suggestHighlightIndex >= 0 ? quickSuggestProducts[suggestHighlightIndex] : undefined
    const found =
      highlighted ??
      mockProducts.find((p) => p.code.toLowerCase() === code.toLowerCase()) ??
      quickSuggestProducts[0]
    if (found) addProductToCart(found)
    setBarcodeInput('')
    setSuggestHighlightIndex(-1)
  }

  const clearCurrentBill = () => {
    setCart([])
    setDisabledWasherGiftByMaleCode({})
    setBillDiscount('')
    setApplyRounding(false)
    setCashReceived('')
    setSelectedBank('')
    setMixedCashAmount('')
    setMixedTransferAmount('')
    setCheckoutPaymentType('cash')
  }

  const closeCheckoutModal = () => {
    if (isSavingCheckout) return
    setShowCheckoutModal(false)
    setShowQRModal(false)
    setCashReceived('')
    setSelectedBank('')
    setMixedCashAmount('')
    setMixedTransferAmount('')
    setCheckoutPaymentType('cash')
    setCheckoutShippingMethod('รับเอง')
  }

  const openCheckoutModal = () => {
    if (!cart.length) {
      window.alert('ไม่มีรายการในตะกร้า')
      return
    }
    if (totals.grandTotal <= 0) {
      window.alert('ยอดรวมต้องมากกว่า 0')
      return
    }
    setCashReceived('')
    setSelectedBank('')
    setMixedCashAmount('')
    setMixedTransferAmount('')
    setCheckoutPaymentType('cash')
    setCheckoutShippingMethod('รับเอง')
    setShowCheckoutModal(true)
  }

  const handleCheckoutPaymentTypeChange = (type: CheckoutPaymentType) => {
    setCheckoutPaymentType(type)
    setCashReceived('')
    setSelectedBank('')
    setMixedCashAmount('')
    setMixedTransferAmount('')
  }

  const handleCashNumpad = (val: string) => {
    const gt = totals.grandTotal
    if (val === 'C') {
      setCashReceived('')
      return
    }
    if (val === 'DEL') {
      setCashReceived((prev) => prev.slice(0, -1))
      return
    }
    if (val === 'EXACT') {
      setCashReceived(gt.toFixed(2))
      return
    }
    if (!/^\d$/.test(val)) return
    setCashReceived((prev) => {
      if (prev.length >= 8) return prev
      return prev + val
    })
  }

  const MIX_TOTAL_EPS = 0.01

  const canSubmitCheckout = useMemo(() => {
    if (!showCheckoutModal) return false
    const gt = totals.grandTotal
    if (checkoutPaymentType === 'cash') {
      return receivedAmount + 1e-9 >= gt
    }
    if (checkoutPaymentType === 'transfer') {
      return Boolean(selectedBank)
    }
    if (checkoutPaymentType === 'account') {
      return !isWalkIn
    }
    if (checkoutPaymentType === 'mixed') {
      if (mixedCashNum <= 0 || mixedTransferNum <= 0) return false
      if (!selectedBank) return false
      return Math.abs(mixedSum - gt) <= MIX_TOTAL_EPS
    }
    return false
  }, [
    checkoutPaymentType,
    isWalkIn,
    mixedCashNum,
    mixedSum,
    mixedTransferNum,
    receivedAmount,
    selectedBank,
    showCheckoutModal,
    totals.grandTotal,
  ])

  const bankLabel = (id: string) => {
    const acc = bankAccounts.find((a) => a.id === id)
    if (acc) return `${acc.bankName} · ${acc.accountNo} (${acc.accountName})`
    return id || 'ไม่ระบุ'
  }

  const printCheckoutDocument = async (issuedDocNo: string, payLabel: string): Promise<void> => {
    if (mode === 'retail') {
      const receiptLines = pricedCart.map((line, idx) => ({
        lineId: `print-${issuedDocNo}-${idx + 1}`,
        productId: line.productId ?? line.code,
        sku: line.code,
        name: line.name,
        qty: line.qty,
        unitPrice: line.price,
        unitLabel: line.unit,
        unitIndex: line.unitIndex ?? 0,
        unitBaseUnits: 1,
        priceLevelIndex: line.priceLevelIndex ?? 0,
        priceLevelLabel: line.priceLevel || 'ราคา 1',
      }))
      await printPosReceipt({
        billNo: issuedDocNo,
        lines: receiptLines,
        grandTotal: totals.grandTotal,
        paymentLabel: payLabel,
      })
      return
    }

    const lineRows: TaxInvoiceLineItemRow[] = pricedCart.map((line, idx) => {
      const base = line.qty * line.price
      const discountPct = base > 0 ? (line.discount / base) * 100 : 0
      return {
        lineSeq: String(idx + 1),
        factoryCode: '',
        sku: line.code,
        productName: line.name,
        quantity: line.qty.toLocaleString('th-TH'),
        unit: line.unit,
        unitPrice: line.price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        discountPct:
          line.discount > 0
            ? discountPct.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '',
        discountTotal:
          line.discount > 0
            ? line.discount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '',
        lineTotal: (line.price * line.qty - line.discount).toLocaleString('th-TH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      }
    })
    const state = loadTaxInvoiceFormDesignerState()
    const activeForm = getActiveTaxInvoiceForm(state)
    const html = buildTaxInvoiceFormPrintHtml(activeForm, MOCK_STORE_PROFILE, { lineRows })
    await printTaxInvoiceHtmlPreferSystemDialog(html)
  }

  const handleConfirmCheckout = async () => {
    if (isSavingCheckout) return
    if (!cart.length) return
    const gt = totals.grandTotal
    if (checkoutPaymentType === 'cash' && receivedAmount + 1e-9 < gt) {
      window.alert('เงินรับมาไม่พอ')
      return
    }
    if (checkoutPaymentType === 'transfer' && !selectedBank) {
      window.alert('กรุณาเลือกบัญชีรับโอน')
      return
    }
    if (checkoutPaymentType === 'account' && isWalkIn) {
      window.alert('ลงบัญชี: กรุณาเลือกลูกค้าที่มีรหัสลูกหนี้ (ไม่ใช่ Walk-in)')
      return
    }
    if (checkoutPaymentType === 'mixed') {
      if (mixedCashNum <= 0 || mixedTransferNum <= 0) {
        window.alert('ผสม: กรุณากรอกยอดเงินสดและยอดโอนให้ครบทั้งสองส่วน')
        return
      }
      if (!selectedBank) {
        window.alert('กรุณาเลือกบัญชีรับโอนสำหรับส่วนโอน')
        return
      }
      if (Math.abs(mixedSum - gt) > MIX_TOTAL_EPS) {
        window.alert('ผสม: ยอดเงินสด + ยอดโอนต้องเท่ากับยอดชำระสุทธิ')
        return
      }
    }

    const payLabel =
      checkoutPaymentType === 'cash'
        ? 'เงินสด'
        : checkoutPaymentType === 'transfer'
          ? `โอน/QR (${bankLabel(selectedBank)})`
          : checkoutPaymentType === 'account'
            ? `ลงบัญชี (${customer.name})`
            : `ผสม — ตรวจรับเงินสด ${mixedCashNum.toLocaleString('th-TH', { minimumFractionDigits: 2 })} + โอน ${mixedTransferNum.toLocaleString('th-TH', { minimumFractionDigits: 2 })} (${bankLabel(selectedBank)})`

    const docLabel = mode === 'retail' ? 'เลขที่บิล POS' : 'เลขที่ใบกำกับภาษี'
    const branchId = getStoredBranch()?.id
    const saleLines = pricedCart.map((line, idx) => ({
      id: `sl-${Date.now()}-${idx}-${Math.random().toString(16).slice(2, 6)}`,
      productCode: line.code,
      productName: line.name,
      qty: line.qty,
      unitLabel: line.unit,
      unitIndex: line.unitIndex ?? 0,
      unitPrice: line.price,
      discount: line.discount,
      lineTotal: round2(line.price * line.qty - line.discount),
      priceLevelLabel: line.priceLevel || undefined,
      priceLevelIndex: line.priceLevelIndex,
      priceTagLabel: line.stlBoltRole === 'washerGift' ? 'แถม' : undefined,
    }))

    let issuedDocNo = ''
    let saved = false
    setIsSavingCheckout(true)
    try {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        issuedDocNo =
          mode === 'retail'
            ? await nextPosBillNumberAsync(docInfo.docDate)
            : await nextTaxInvoiceNumberAsync(docInfo.docDate)
        const saleId = `sale-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
        try {
          await createPosSaleAsync({
            id: saleId,
            billNo: issuedDocNo,
            taxInvoiceNo: mode === 'tax' ? issuedDocNo : undefined,
            mode,
            paymentType: checkoutPaymentType,
            docDate: docInfo.docDate,
            subtotal: totals.subtotal,
            billDiscount: totals.discountAmt,
            beforeVat: totals.beforeVat,
            vatAmount: totals.vatAmount,
            roundingAdjust: totals.roundingAdjustment,
            grandTotal: totals.grandTotal,
            remark: docInfo.remark,
            branchId,
            memberCode: customer.accountCode !== WALK_IN_CUSTOMER.accountCode ? customer.accountCode : undefined,
            shippingMethod: checkoutShippingMethod !== 'รับเอง' ? checkoutShippingMethod : undefined,
            lines: saleLines,
          })
          saved = true
          break
        } catch (error) {
          if (isSaleBillNoDuplicateError(error)) {
            continue
          }
          console.error('[pos] create sale in db failed', error)
          window.alert('บันทึกบิลลงฐานข้อมูลไม่สำเร็จ กรุณาเปิด DevTools ดู error log')
          return
        }
      }
      if (!saved) {
        window.alert('เลขที่บิลซ้ำหลายครั้ง กรุณาลองใหม่อีกครั้ง')
        return
      }

      window.alert(
        `บันทึกการขายแล้ว\n${docLabel}: ${issuedDocNo}\nวิธีชำระ: ${payLabel}\nจัดส่ง: ${checkoutShippingMethod}\nยอด: ${gt.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท` +
          (checkoutPaymentType === 'cash'
            ? `\nเงินทอน: ${Math.max(0, receivedAmount - gt).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`
            : ''),
      )
      window.dispatchEvent(new CustomEvent(POS_SALE_RECORDED_EVENT))
      appendSale({
        billNo: issuedDocNo,
        at: new Date().toISOString(),
        total: totals.grandTotal,
        paymentId: checkoutPaymentType,
        lineCount: pricedCart.length,
        shippingMethod: checkoutShippingMethod !== 'รับเอง' ? checkoutShippingMethod : undefined,
        lines: pricedCart.map((line) => ({
          productId: line.productId ?? '',
          sku: line.code,
          name: line.name,
          qty: line.qty,
          unitPrice: line.price,
        })),
      })
      writeCfdState({
        mode: 'confirmed',
        lines: pricedCart.map((l) => ({
          name: l.name,
          qty: l.qty,
          unitLabel: l.unit,
          unitPrice: l.price,
          lineTotal: Math.max(0, l.price * l.qty - l.discount),
        })),
        subtotal: totals.subtotal,
        discountAmt: totals.discountAmt,
        vatAmount: totals.vatAmount,
        grandTotal: gt,
        memberName: customer.accountCode !== WALK_IN_CUSTOMER.accountCode ? customer.name : null,
        paidAmount: checkoutPaymentType === 'cash' ? receivedAmount : gt,
        changeAmount: checkoutPaymentType === 'cash' ? Math.max(0, receivedAmount - gt) : 0,
        updatedAt: Date.now(),
      })
      try {
        await printCheckoutDocument(issuedDocNo, payLabel)
      } catch (error) {
        console.error('[pos] print checkout document failed', error)
        window.alert('บันทึกบิลสำเร็จ แต่พิมพ์เอกสารไม่สำเร็จ')
      }

      if (isTauri()) {
        try {
          const [pos, tax] = await Promise.all([
            peekNextPosBillNumberAsync(docInfo.docDate),
            peekNextTaxInvoiceNumberAsync(docInfo.docDate),
          ])
          setDocInfo((prev) => ({ ...prev, posBillNo: pos, taxInvoiceNo: tax }))
        } catch (e) {
          console.error('[pos] bill sequence peek after save failed', e)
          setDocInfo((prev) => {
            const d = parseLocalYYYYMMDD(prev.docDate)
            return {
              ...prev,
              posBillNo: peekNextPosBillNumber(d),
              taxInvoiceNo: peekNextTaxInvoiceNumber(d),
            }
          })
        }
      } else {
        setDocInfo((prev) => {
          const d = parseLocalYYYYMMDD(prev.docDate)
          return {
            ...prev,
            posBillNo: peekNextPosBillNumber(d),
            taxInvoiceNo: peekNextTaxInvoiceNumber(d),
          }
        })
      }
      // ตัดสต็อก
      try {
        const catalog = getPosCatalogProducts()
        let pieceStock = loadLiveStock()
        let rollStock = loadRollStock()
        let boxStock = loadBoxPieceStock()
        const pieceDeductions: { productId: string; qty: number }[] = []

        for (const line of pricedCart) {
          if (!line.productId) continue
          if (line.stockBreakdown?.length) {
            for (const b of line.stockBreakdown) {
              pieceDeductions.push({ productId: b.productId, qty: b.qty * line.qty })
            }
            continue
          }
          const p = catalog.find((x) => x.id === line.productId)
          if (!p) continue
          const cfg = getPosSellConfig(line.productId)
          const unitIdx = line.unitIndex ?? 0
          const unit = cfg.units.find((u) => u.index === unitIdx) ?? cfg.units[0]
          const baseUnits = Math.max(1, unit?.baseUnits ?? 1)
          const isRoll = unit?.label === 'ม้วน'

          if (isBoxPieceProduct(p)) {
            boxStock = deductBoxPieces(boxStock, line.productId, line.qty * baseUnits, p.piecesPerBox!)
          } else if (posProductUsesRollShelfStock(p)) {
            const nominal = posRollNominalForProduct(p)
            if (isRoll) {
              rollStock = deductFullRolls(rollStock, line.productId, Math.floor(line.qty))
            } else {
              rollStock = deductRollKg(rollStock, line.productId, line.qty, nominal)
            }
          } else {
            pieceDeductions.push({ productId: line.productId, qty: line.qty * baseUnits })
          }
        }

        pieceStock = deductStock(pieceStock, pieceDeductions)
        saveLiveStock(pieceStock)
        saveRollStock(rollStock)
        saveBoxPieceStock(boxStock)
        setStockVersion((v) => v + 1)
      } catch (stockErr) {
        console.error('[pos] stock deduction failed', stockErr)
      }

      closeCheckoutModal()
      clearCurrentBill()
    } catch (error) {
      console.error('[pos] checkout failed', error)
      const msg = error instanceof Error ? error.message : String(error)
      window.alert(`เกิดข้อผิดพลาด กรุณาลองใหม่\n\n${msg}`)
    } finally {
      setIsSavingCheckout(false)
    }
  }

  const handleSuspendBill = (suspendKind: SuspendedBillKind = 'hold') => {
    if (!cart.length) return
    const next: SuspendedBill = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: Date.now(),
      mode,
      customer,
      cart,
      docInfo,
      billDiscount,
      applyRounding,
      suspendKind,
    }
    setSuspendedBills((prev) => [next, ...prev])
    setShowSuspendModal(false)
    setShowAmountNoticeModal(false)
    setShowPickingModal(false)
    setShowQuotationModal(false)
    clearCurrentBill()
  }

  const resumeSuspendedBill = (bill: SuspendedBill) => {
    setMode(bill.mode)
    setCustomer(bill.customer)
    setCart(bill.cart)
    setDisabledWasherGiftByMaleCode({})
    setDocInfo(bill.docInfo)
    setBillDiscount(bill.billDiscount || '')
    setApplyRounding(Boolean(bill.applyRounding))
    setSuspendedBills((prev) => prev.filter((b) => b.id !== bill.id))
    setShowSuspendModal(false)
  }

  const removeSuspendedBill = (id: string) => {
    if (!window.confirm('ลบบิลที่พักไว้รายการนี้? จะไม่สามารถเรียกคืนได้')) return
    setSuspendedBills((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <div
      className={clsx(
        isDark && 'dark',
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-200 font-sans text-slate-800 transition-colors duration-500 selection:bg-cyan-500/30 dark:border-[#2a2d3e] dark:from-[#131726] dark:via-[#0a0a0f] dark:to-[#050508] dark:text-slate-200',
        className,
      )}
    >
      <header className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm dark:border-[#2a2d3e] dark:bg-[#0d0f17]/80 sm:px-4 pos-720p:gap-1.5 pos-720p:py-1.5 pos-720p:px-2.5">
        <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h1 className="flex min-w-0 items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-sm font-black uppercase tracking-wider text-transparent dark:from-cyan-400 dark:to-fuchsia-500 sm:text-base">
            <Activity className="size-4 shrink-0 text-blue-500 dark:text-cyan-400 sm:size-5" strokeWidth={1.75} aria-hidden />
            <span className="truncate">POS / TAX</span>
          </h1>
          <span className="hidden items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-slate-600 dark:border-[#2a2d3e] dark:bg-[#1a1f35] dark:text-cyan-400 lg:inline-flex">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            STATUS: READY // {statusText}
          </span>
        </div>

        <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2 pos-720p:gap-1.5">
          {suspendedBills.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSuspendModal(true)}
              className={clsx(
                'relative inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-800 shadow-sm transition hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/35 pos-720p:px-2 pos-720p:py-1 pos-720p:text-[9px]',
                hasAwaitTransferSuspended && 'ring-2 ring-pink-400/90 ring-offset-2 ring-offset-white dark:ring-pink-500/80 dark:ring-offset-[#0d0f17]',
              )}
            >
              <Clock className="size-4 animate-pulse" aria-hidden />
              บิลที่พักไว้
              <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                {suspendedBills.length}
              </span>
            </button>
          )}
          <div className="flex shrink-0 rounded-lg border border-slate-200 bg-slate-100/90 p-0.5 dark:border-[#2a2d3e] dark:bg-[#050508]">
            <button
              type="button"
              onClick={() => setMode('retail')}
              className={clsx(
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all pos-720p:px-2 pos-720p:py-1 pos-720p:text-[9px]',
                mode === 'retail'
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-emerald-600'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-300',
              )}
            >
              <ShoppingCart className="size-3.5" strokeWidth={1.75} aria-hidden />
              POS
            </button>
            <button
              type="button"
              onClick={() => setMode('tax')}
              className={clsx(
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all pos-720p:px-2 pos-720p:py-1 pos-720p:text-[9px]',
                mode === 'tax'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-300',
              )}
            >
              <Receipt className="size-3.5" strokeWidth={1.75} aria-hidden />
              TAX
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setCfdOpening(true)
              void openCfdWindow().finally(() => setCfdOpening(false))
            }}
            disabled={cfdOpening}
            className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:opacity-50 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-indigo-400 dark:hover:bg-[#1a1f35]"
            aria-label="เปิดจอลูกค้า"
            title="เปิดจอลูกค้า (CFD)"
          >
            <Monitor className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-amber-400 dark:hover:bg-[#1a1f35]"
            aria-label="สลับธีม"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-200 p-2 dark:from-[#131726] dark:via-[#0a0a0f] dark:to-[#050508] sm:p-3 pos-compact:p-1.5 pos-compact:sm:p-2 pos-720p:p-1 pos-720p:sm:p-1.5">
        <div className="flex h-full min-h-0 gap-2 pos-720p:gap-1.5">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 pos-720p:gap-1.5">
            <section className="shrink-0 rounded-lg border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur-md dark:border-[#1e2233] dark:bg-[#12141c]/80 pos-720p:p-1.5">
              <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pos-720p:mb-1 pos-720p:gap-1.5">
                <h2 className="flex shrink-0 items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 pos-720p:text-[9px]">
                  <Building2 className="size-3 text-purple-600 dark:text-fuchsia-500" aria-hidden />
                  ข้อมูลลูกค้า (CUSTOMER INFO)
                </h2>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 pos-720p:gap-1.5">
                  <select
                    value={isWalkIn ? 'walkin' : 'member'}
                    onChange={(e) => {
                      const next =
                        e.target.value === 'walkin'
                          ? walkInCustomer
                          : mockMembers.find((m) => m.accountCode !== 'WK-00001') ?? mockMembers[0]
                      setCustomer(next)
                    }}
                    className={clsx(
                      'rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-800 shadow-sm outline-none transition-all dark:border-[#2a2d3e] dark:bg-[#1a1f35] dark:text-cyan-100',
                      'cursor-pointer',
                    )}
                  >
                    <option value="walkin">Walk-in</option>
                    <option value="member">สมาชิกระบบ</option>
                  </select>
                  <div className="relative min-w-0 w-full max-w-[14rem] sm:w-56 sm:max-w-none">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-slate-400 dark:text-cyan-500/50" />
                    <input
                      id="pos-member-search"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="ชื่อ / รหัส / เบอร์โทร..."
                      className="w-full rounded-full border border-slate-200 bg-slate-50 py-1 pl-8 pr-8 text-[10px] font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-50 dark:placeholder:text-slate-600 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMemberModal(true)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1 text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-cyan-400 dark:hover:bg-[#1a1f35]"
                      aria-label="เปิดรายชื่อลูกค้า"
                    >
                      <Users className="size-3" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>

              {mode === 'retail' ? (
                <div className="grid grid-cols-12 gap-2 pos-720p:gap-1.5">
                  <div className="col-span-12 sm:col-span-3 pos-720p:col-span-4">
                    <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                      รหัสลูกค้า
                    </label>
                    <input
                      value={customer.accountCode}
                      readOnly
                      className="w-full cursor-default rounded border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-black text-purple-700 outline-none dark:border-[#1e2233] dark:bg-[#050508]/50 dark:text-fuchsia-400"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-9 pos-720p:col-span-8">
                    <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                      ชื่อลูกค้า/บริษัท
                    </label>
                    <input
                      value={customer.name}
                      onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-50 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-4">
                    <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                      รอบเครดิต
                    </label>
                    <input
                      readOnly
                      value={creditCycleDisplay}
                      className="w-full cursor-default rounded border border-slate-200 bg-slate-100 px-2 py-1.5 text-[11px] font-semibold text-slate-600 outline-none dark:border-[#2a2d3e] dark:bg-[#0d0f17]/80 dark:text-slate-400"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-4">
                    <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-amber-800/90 dark:text-amber-400/90">
                      แต้มสะสม
                    </label>
                    <div className="relative flex items-center justify-between gap-1.5 rounded border border-amber-200 bg-amber-50/80 px-2 py-1.5 dark:border-amber-600/40 dark:bg-amber-950/25">
                      <span className="font-mono text-[11px] font-bold tabular-nums leading-none text-amber-900 dark:text-amber-200">
                        {customer.points.toLocaleString('th-TH')}
                      </span>
                      <Medal className="size-4 shrink-0 text-amber-400 dark:text-amber-500" aria-hidden />
                    </div>
                  </div>
                  <div className="col-span-12 flex min-h-0 flex-col justify-center sm:col-span-4">
                    <div className="mb-1 flex items-start justify-between gap-2 text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                      <span>วงเงินเครดิต</span>
                      {creditBar.limit > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          เหลือ: {creditBar.remaining.toLocaleString('th-TH')}
                        </span>
                      ) : (
                        <span className="font-semibold normal-case text-slate-500 dark:text-slate-500">เงินสด</span>
                      )}
                    </div>
                    <div
                      className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                      role="progressbar"
                      aria-valuenow={creditBar.limit > 0 ? Math.round(creditBar.pct) : 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-[width] duration-300"
                        style={{ width: creditBar.limit > 0 ? `${creditBar.pct}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-2 pos-720p:gap-1.5">
                  <div className="col-span-12 sm:col-span-3">
                    <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                      รหัสลูกค้า
                    </label>
                    <input
                      value={customer.accountCode}
                      readOnly
                      className="w-full cursor-default rounded border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-black text-purple-700 outline-none dark:border-[#1e2233] dark:bg-[#050508]/50 dark:text-fuchsia-400"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-5">
                    <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                      ชื่อลูกค้า/บริษัท
                    </label>
                    <input
                      value={customer.name}
                      onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-50 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-4">
                    <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                      เลขผู้เสียภาษี
                    </label>
                    <input
                      value={customer.taxId}
                      onChange={(e) => setCustomer((prev) => ({ ...prev, taxId: e.target.value }))}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-50 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-6">
                    <label className="mb-0.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                      <MapPin className="size-3 shrink-0" aria-hidden />
                      ที่อยู่
                    </label>
                    <input
                      value={customer.address}
                      onChange={(e) => setCustomer((prev) => ({ ...prev, address: e.target.value }))}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-50 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-2">
                    <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                      รอบเครดิต
                    </label>
                    <input
                      readOnly
                      value={creditCycleDisplay}
                      className="w-full cursor-default rounded border border-slate-200 bg-slate-100 px-2 py-1.5 text-[11px] font-semibold text-slate-600 outline-none dark:border-[#2a2d3e] dark:bg-[#0d0f17]/80 dark:text-slate-400"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-2">
                    <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-amber-800/90 dark:text-amber-400/90">
                      แต้มสะสม
                    </label>
                    <div className="relative flex items-center justify-between gap-1.5 rounded border border-amber-200 bg-amber-50/80 px-2 py-1.5 dark:border-amber-600/40 dark:bg-amber-950/25">
                      <span className="min-w-0 truncate font-mono text-[11px] font-bold tabular-nums leading-none text-amber-900 dark:text-amber-200">
                        {customer.points.toLocaleString('th-TH')}
                      </span>
                      <Medal className="size-4 shrink-0 text-amber-400 dark:text-amber-500" aria-hidden />
                    </div>
                  </div>
                  <div className="col-span-12 flex min-h-0 flex-col justify-center sm:col-span-2">
                    <div className="mb-1 flex items-start justify-between gap-1 text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                      <span className="leading-tight">วงเงินเครดิต</span>
                      {creditBar.limit > 0 ? (
                        <span className="shrink-0 text-emerald-600 dark:text-emerald-400">
                          เหลือ: {creditBar.remaining.toLocaleString('th-TH')}
                        </span>
                      ) : (
                        <span className="shrink-0 font-semibold normal-case text-slate-500 dark:text-slate-500">เงินสด</span>
                      )}
                    </div>
                    <div
                      className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                      role="progressbar"
                      aria-valuenow={creditBar.limit > 0 ? Math.round(creditBar.pct) : 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-[width] duration-300"
                        style={{ width: creditBar.limit > 0 ? `${creditBar.pct}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isWalkIn && memberHistory.length > 0 && (() => {
                const last = memberHistory[0]
                return (
                  <div className="mt-2 border-t border-slate-100 pt-1.5 dark:border-[#1e2233]">
                    <button
                      type="button"
                      onClick={() => { setExpandedHistoryBills(new Set()); setShowHistoryPopup(true) }}
                      className="flex w-full items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50/70 px-2.5 py-1 text-left transition hover:bg-purple-100/80 dark:border-fuchsia-800/40 dark:bg-fuchsia-950/30 dark:hover:bg-fuchsia-950/50"
                    >
                      <Clock className="size-3 shrink-0 text-purple-500 dark:text-fuchsia-400" aria-hidden />
                      <span className="text-[9px] font-bold text-purple-700 dark:text-fuchsia-300">
                        {memberHistory.length} บิล
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500">·</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400">
                        ล่าสุด {new Date(last.at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="ml-auto shrink-0 font-mono text-[9px] font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {last.total.toLocaleString('th-TH', { minimumFractionDigits: 0 })}฿
                      </span>
                    </button>
                  </div>
                )
              })()}

            </section>

            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-[#2a2d3e] dark:bg-[#12141c]/80">
              <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-100 px-2 py-2 dark:border-[#2a2d3e] dark:bg-[#0d0f17] pos-720p:py-1.5">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 dark:text-cyan-500/60" />
                  <input
                    id="pos-product-search"
                    value={barcodeInput}
                    onChange={(e) => { setBarcodeInput(e.target.value); setSuggestHighlightIndex(-1) }}
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder="สแกนบาร์โค้ด / รหัส / ชื่อ / OEM..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs font-semibold text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-50 dark:placeholder:text-slate-600 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                  />
                  {barcodeInput && (
                    <button
                      type="button"
                      onClick={() => { setBarcodeInput(''); setSuggestHighlightIndex(-1) }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                  {barcodeInput.trim() && (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-[#2a2d3e] dark:bg-[#12141c]">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-2.5 py-1 dark:border-[#1c1f2e] dark:bg-[#0a0c13]">
                        <span className="text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {quickSuggestProducts.length > 0
                            ? `${quickSuggestProducts.length}${quickTextMatchedProducts.length > quickSuggestProducts.length ? `/${quickTextMatchedProducts.length}` : ''} รายการ`
                            : 'ไม่พบสินค้า'}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-600">↑↓ เลื่อน · Enter เพิ่ม · Esc ล้าง</span>
                      </div>
                      {quickSuggestProducts.length > 0 ? (
                        <div ref={suggestDropdownRef} className="max-h-[26rem] overflow-auto overscroll-contain">
                          {quickSuggestProducts.map((p, idx) => {
                            const stockColor =
                              p.stock <= 0
                                ? 'text-rose-500 dark:text-rose-400'
                                : p.stock <= 5
                                  ? 'text-amber-500 dark:text-amber-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                            const stockLabel = p.stock <= 0 ? 'หมด' : `${p.stock} ชิ้น`
                            const carLine = [p.carBrand, p.carModelLabel, p.yearLabel].filter(Boolean).join(' · ')
                            const oem = [p.factoryOem, p.genuineNo].filter(Boolean).join(' / ')
                            const dims = formatDims(p.dimensions)
                            const cfg = getPosSellConfig(p.id)
                            const picked = pickDefaultPosUnitAndPrice(cfg)
                            const displayPrice = picked != null ? cfg.getListUnitPrice(picked.unit.index, picked.level.index) : 0
                            const fitBadge = fitmentBadgeBySku.get(p.code)
                            const isHighlighted = idx === suggestHighlightIndex
                            return (
                              <button
                                key={`quick-${p.id}`}
                                data-suggest-index={idx}
                                type="button"
                                onClick={() => { addProductToCart(p); setBarcodeInput(''); setSuggestHighlightIndex(-1) }}
                                onMouseEnter={() => setSuggestHighlightIndex(idx)}
                                className={clsx(
                                  'flex w-full items-start gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition-colors dark:border-[#1c1f2e]',
                                  isHighlighted
                                    ? 'bg-blue-50 dark:bg-[#1a1f35]'
                                    : 'hover:bg-slate-50 dark:hover:bg-[#1a1f35]/60',
                                )}
                              >
                                {/* Thumbnail */}
                                <ProductImage sku={p.code} size="sm" className="mt-0.5 shrink-0" onProject={() => showProductImage({ code: p.code, name: p.name })} />

                                {/* Main info block */}
                                <span className="min-w-0 flex-1">
                                  {/* Row 1: code + brand badge */}
                                  <span className="flex items-center gap-1.5">
                                    <span className="font-mono text-[11px] font-black text-blue-700 dark:text-cyan-300">{p.code}</span>
                                    {p.brand && (
                                      <span className="rounded bg-blue-50 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">{p.brand}</span>
                                    )}
                                    {p.category && (
                                      <span className="rounded bg-slate-100 px-1.5 py-px text-[9px] font-semibold text-slate-500 dark:bg-[#1a1f35] dark:text-slate-400">{p.category}</span>
                                    )}
                                  </span>
                                  {/* Row 2: name */}
                                  <span className="mt-0.5 block truncate text-[12px] font-semibold text-slate-800 dark:text-slate-100">{p.name}</span>
                                  {/* Row 3: car + fitment */}
                                  {(carLine || fitBadge) && (
                                    <span className="mt-0.5 flex flex-wrap items-center gap-1">
                                      {carLine && (
                                        <span className="truncate text-[10px] text-slate-500 dark:text-slate-400">🚗 {carLine}</span>
                                      )}
                                      {fitBadge && (
                                        <span className="inline-flex items-center gap-1">
                                          <span className="rounded border border-emerald-200 bg-emerald-50 px-1 py-px text-[9px] text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/20 dark:text-emerald-300">{fitBadge.label}</span>
                                          <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setFitmentPreviewSku(p.code) }}
                                            onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); setFitmentPreviewSku(p.code) } }}
                                            className="rounded border border-slate-200 bg-white px-1 py-px text-[9px] text-slate-500 hover:bg-slate-100 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-400"
                                          >ดูรุ่น</span>
                                        </span>
                                      )}
                                    </span>
                                  )}
                                  {/* Row 4: OEM + dims + location */}
                                  {(oem || dims || p.location) && (
                                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                      {oem && (
                                        <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400">OEM: {oem}</span>
                                      )}
                                      {dims && (
                                        <span className="font-mono text-[10px] text-violet-600 dark:text-violet-400">{dims}</span>
                                      )}
                                      {p.location && (
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">📍 {p.location}</span>
                                      )}
                                    </span>
                                  )}
                                </span>

                                {/* Price + stock (right column) */}
                                <span className="mt-0.5 shrink-0 text-right">
                                  {displayPrice > 0 && (
                                    <span className="block font-mono text-[12px] font-black text-slate-800 dark:text-slate-100">
                                      ฿{displayPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    </span>
                                  )}
                                  <span className={clsx('block font-mono text-[11px] font-bold tabular-nums', stockColor)}>{stockLabel}</span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="px-3 py-4 text-center">
                          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">ไม่พบสินค้าที่ตรงกัน</p>
                          <p className="mt-0.5 text-[9px] text-slate-400 dark:text-slate-500">ลองค้นด้วย OEM หรือกดปุ่ม ค้นหาสินค้า</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  className="shrink-0 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700 shadow-sm transition hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-cyan-400 dark:hover:bg-[#1a1f35] pos-720p:px-2 pos-720p:py-1 pos-720p:text-[9px]"
                >
                  ค้นหาสินค้า
                </button>
              </div>

              <div className="grid grid-cols-12 gap-1 border-b border-slate-200 bg-slate-200/50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:border-[#2a2d3e] dark:bg-[#0a0c13] dark:text-slate-500">
                <div className="col-span-4 pl-1">รายการสินค้า</div>
                <div className="col-span-1 text-center">จำนวน</div>
                <div className="col-span-1 text-center">หน่วย</div>
                <div className="col-span-2 text-center">ราคา/หน่วย</div>
                <div className="col-span-2 text-right">ส่วนลด</div>
                <div className="col-span-2 pr-5 text-right">รวมสุทธิ</div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
                {pricedCart.map((item) => {
                  const total = item.price * item.qty - item.discount
                  const itemProductId = item.productId ?? mockProducts.find((p) => p.code === item.code)?.id
                  const itemProduct = mockProducts.find((p) => p.id === itemProductId)
                  const liveStock = stockVersion >= 0
                    ? (itemProduct?.bundleComponents?.length
                      ? getBundleAvailableQty(itemProduct.bundleComponents, loadLiveStock())
                      : (itemProduct ? loadLiveStock()[itemProduct.id] ?? itemProduct.stock : null))
                    : null
                  const remainingStock = liveStock !== null ? liveStock - item.qty : null
                  const isLowStock = remainingStock !== null && remainingStock >= 0 && remainingStock <= LOW_STOCK_THRESHOLD
                  const isOverStock = remainingStock !== null && remainingStock < 0
                  const canAddBoltNut = !item.stlBoltRole && Boolean(itemProductId && getStlBoltPairForMaleProduct(itemProductId))
                  const sellCfg = item.productId ? getPosSellConfig(item.productId) : null
                  const unitOptions = sellCfg ? posUnitsWithSellPrice(sellCfg) : []
                  const currentUnitIndex = item.unitIndex ?? 0
                  const levelOptions = sellCfg
                    ? posPriceLevelsForUnit(sellCfg, currentUnitIndex).map((lv) => ({
                        index: lv.index,
                        label: displayPriceLevelLabel(lv.index, lv.label),
                        price: sellCfg.getListUnitPrice(currentUnitIndex, lv.index),
                      }))
                    : []
                  const selectedLevelLabel = priceTypeLabelForLine(item)
                  return (
                    <div
                      key={item.id}
                      className="group grid grid-cols-12 items-center gap-1 border-b border-slate-100 px-3 py-2 hover:bg-blue-50/50 dark:border-[#1c1f2e]/50 dark:hover:bg-[#1a1f35]/40"
                    >
                      <div className="col-span-4 flex flex-col pl-1">
                        <span className="font-mono text-[10px] font-black text-blue-600 dark:text-cyan-400">
                          {item.code}
                        </span>
                        <span className="truncate text-xs font-semibold text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
                          {item.name}
                        </span>
                        {isOverStock ? (
                          <div className="mt-0.5 flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-black text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                            <AlertTriangle className="size-2.5 shrink-0" aria-hidden />
                            สต็อกไม่พอ (คงเหลือ {itemProduct!.stock})
                          </div>
                        ) : isLowStock ? (
                          <div className="mt-0.5 flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <AlertTriangle className="size-2.5 shrink-0" aria-hidden />
                            เหลือน้อย (จะเหลือ {remainingStock})
                          </div>
                        ) : null}
                        {canAddBoltNut ? (
                          <div className="mt-1">
                            <button
                              type="button"
                              onClick={() => addBoltNutForLine(item.id)}
                              className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-700 transition hover:bg-amber-100 dark:border-amber-700/70 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
                            >
                              +หัว
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <input
                          type="number"
                          min={0}
                          step="1"
                          value={item.qty}
                          onChange={(e) => updateLineQty(item.id, e.target.value)}
                          disabled={item.stlBoltRole === 'washerGift'}
                          className="w-12 rounded border border-emerald-200 bg-emerald-50 py-0.5 text-center text-[11px] font-black text-emerald-700 outline-none dark:border-[#0f4d5c] dark:bg-[#0d2127] dark:text-emerald-400"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center text-center">
                        <div className="w-[68px]">
                        <select
                          value={String(item.unitIndex ?? 0)}
                          onChange={(e) => updateLineUnit(item.id, e.target.value)}
                          disabled={Boolean(item.stlBoltRole)}
                          className="w-full rounded border border-slate-200 bg-white px-1 py-0.5 text-center font-mono text-[12px] text-slate-600 outline-none dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-300"
                        >
                          {(unitOptions.length
                            ? unitOptions.map((u) => ({ value: String(u.index), label: u.label }))
                            : [{ value: String(item.unitIndex ?? 0), label: item.unit }]).map((u) => (
                            <option key={`${item.id}-unit-${u.value}`} value={u.value}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                        </div>
                      </div>
                      <div className="col-span-2 flex justify-center text-center">
                        <div className="relative w-[96px]">
                          <span className="pointer-events-none absolute right-1 -top-1 rounded bg-white px-0.5 text-[8px] font-bold leading-none text-blue-600 dark:bg-[#050508] dark:text-cyan-300">
                            {selectedLevelLabel}
                          </span>
                          <select
                            value={String(item.priceLevelIndex ?? -1)}
                            onChange={(e) => updateLinePriceLevel(item.id, e.target.value)}
                            disabled={item.stlBoltRole === 'washerGift'}
                            className="h-6 w-full rounded border border-slate-200 bg-white py-0.5 pl-1 pr-3 text-right text-[11px] font-black tracking-wide text-slate-900 outline-none dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-100"
                          >
                            {(levelOptions.length
                              ? levelOptions.map((lv) => ({
                                  value: String(lv.index),
                                  label: lv.price.toLocaleString('th-TH', { minimumFractionDigits: 2 }),
                                }))
                              : [
                                  {
                                    value: String(item.priceLevelIndex ?? -1),
                                    label: item.price.toLocaleString('th-TH', { minimumFractionDigits: 2 }),
                                  },
                                ]).map((lv) => (
                              <option key={`${item.id}-lv-${lv.value}`} value={lv.value}>
                                {lv.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <input
                          value={item.discount}
                          readOnly
                          className="w-12 rounded border border-rose-200 bg-rose-50 px-1 py-0.5 text-right font-mono text-[11px] font-black text-rose-700 outline-none dark:border-[#4a1625] dark:bg-[#1c0f14] dark:text-rose-500"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-2 pr-1">
                        <span className="font-mono text-xs font-black text-slate-800 dark:text-white">
                          {total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                        <button
                          type="button"
                          onClick={() => showProductImage({ code: item.code, name: item.name, price: item.price, unit: item.unit })}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 transition hover:text-indigo-500 dark:text-slate-600 dark:hover:text-indigo-400"
                          aria-label="แสดงรูปสินค้าบนจอลูกค้า"
                          title="แสดงรูปบนจอลูกค้า"
                        >
                          <Image className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLine(item.id)}
                          className="text-slate-400 transition hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-500"
                          aria-label="ลบรายการ"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          <aside className="flex h-full min-h-0 w-[300px] shrink-0 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-contain pos-narrow:w-[272px] pos-720p:w-[248px] pos-720p:gap-1.5">
            <section className="shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-[#2a2d3e] dark:bg-[#12141c]/80">
              <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-2 py-2 dark:border-[#2a2d3e] dark:bg-[#0d0f17] pos-720p:py-1.5">
                <CalendarClock className="size-4 text-blue-500 dark:text-cyan-400" aria-hidden />
                <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
                  ตั้งค่าเอกสาร (SETTINGS)
                </h2>
              </div>
              <div className="space-y-3 p-3 pos-720p:space-y-2 pos-720p:p-2">
                <div className="flex flex-col gap-2 pos-720p:gap-1.5">
                  {mode === 'retail' ? (
                    <div className="min-w-0">
                      <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                        เลขที่บิล POS
                      </label>
                      <input
                        value={docInfo.posBillNo}
                        readOnly
                        title="ลำดับแยกจากใบกำกับภาษี"
                        className="w-full cursor-default rounded border border-blue-300 bg-slate-100 px-2 py-1.5 text-[11px] font-black text-blue-800 outline-none dark:border-cyan-600/50 dark:bg-[#050508]/50 dark:text-cyan-300"
                      />
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                        เลขที่ใบกำกับภาษี
                      </label>
                      <input
                        value={docInfo.taxInvoiceNo}
                        readOnly
                        title="ลำดับแยกจากบิล POS"
                        className="w-full cursor-default rounded border border-indigo-300 bg-slate-100 px-2 py-1.5 text-[11px] font-black text-indigo-800 outline-none dark:border-indigo-500/50 dark:bg-[#050508]/50 dark:text-indigo-300"
                      />
                    </div>
                  )}
                </div>
                <div className="max-w-[11rem]">
                  <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                    วันที่
                  </label>
                  <input
                    type="date"
                    value={docInfo.docDate}
                    onChange={(e) => setDocInfo((prev) => ({ ...prev, docDate: e.target.value }))}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-50 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                  />
                </div>

                <div>
                  <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                    รูปแบบ VAT (เฉพาะ TAX)
                  </label>
                  <div className="flex rounded border border-slate-200 bg-slate-100 p-0.5 dark:border-[#2a2d3e] dark:bg-[#050508]">
                    {(
                      [
                        { id: 'exclude', label: 'ไม่รวม' },
                        { id: 'include', label: 'รวม' },
                        { id: 'none', label: 'ไม่มี' },
                      ] as const
                    ).map((opt) => {
                      const active = docInfo.vatType === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setDocInfo((prev) => ({ ...prev, vatType: opt.id }))}
                          disabled={mode !== 'tax'}
                          className={clsx(
                            'flex-1 rounded px-2 py-1 text-[10px] font-black uppercase tracking-wider transition',
                            active
                              ? 'bg-blue-600 text-white shadow-sm dark:bg-cyan-600'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-300',
                            mode !== 'tax' && 'cursor-not-allowed opacity-60',
                          )}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                    หมายเหตุ
                  </label>
                  <textarea
                    value={docInfo.remark}
                    onChange={(e) => setDocInfo((prev) => ({ ...prev, remark: e.target.value }))}
                    rows={2}
                    className="w-full resize-none rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-50 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30 pos-720p:py-1"
                  />
                </div>
              </div>
            </section>

            <section className="shrink-0 overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-b from-white to-slate-50 shadow-xl dark:border-cyan-500/30 dark:from-[#141b2d] dark:to-[#0a0d14] dark:shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-cyan-400 dark:to-emerald-400" />
              <div className="space-y-2 p-4 pos-720p:space-y-1.5 pos-720p:p-2.5">
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white/70 p-2 dark:border-[#2a2d3e] dark:bg-[#050508]/60 pos-720p:gap-1.5 pos-720p:p-1.5">
                  <label className="col-span-1 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    ส่วนลดท้ายบิล
                    <input
                      value={billDiscount}
                      onChange={(e) => setBillDiscount(e.target.value)}
                      inputMode="decimal"
                      placeholder="0"
                      className="mt-1 w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right font-mono text-[11px] font-black text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-cyan-100"
                    />
                  </label>
                  <label className="col-span-1 flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    ปัดเศษ
                    <input
                      type="checkbox"
                      checked={applyRounding}
                      onChange={(e) => setApplyRounding(e.target.checked)}
                      className="size-4 accent-emerald-600"
                    />
                  </label>
                  {applyRounding && totals.roundingAdjustment !== 0 && (
                    <div className="col-span-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      <span>ปรับเศษ</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {totals.roundingAdjustment.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <span>รวมเป็นเงิน</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {totals.beforeVat.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <span>VAT 7%</span>
                  <span className="font-mono text-blue-600 dark:text-cyan-400">
                    {totals.vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="mt-2 border-t border-slate-200 pt-3 dark:border-[#2a2d3e] pos-720p:mt-1.5 pos-720p:pt-2">
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 pos-720p:text-[10px]">
                      ยอดรวมทั้งสิ้น
                    </span>
                    <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text font-mono text-3xl font-black text-transparent dark:from-emerald-400 dark:to-cyan-300 pos-720p:text-2xl">
                      {totals.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-white/80 p-3 dark:border-[#2a2d3e] dark:bg-[#0d0f17]/60 pos-720p:gap-1.5 pos-720p:p-2">
                <button
                  type="button"
                  onClick={() => handleSuspendBill('hold')}
                  disabled={!cart.length}
                  className={clsx(
                    'inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-black uppercase tracking-widest shadow-sm transition pos-720p:gap-1 pos-720p:px-2 pos-720p:py-1.5 pos-720p:text-[9px]',
                    cart.length
                      ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/35'
                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-600',
                  )}
                >
                  <Clock className="size-4 shrink-0 pos-720p:size-3.5" aria-hidden />
                  พักบิล
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (cart.length) setShowAmountNoticeModal(true)
                  }}
                  disabled={!cart.length}
                  className={clsx(
                    'inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-black uppercase tracking-widest shadow-sm transition pos-720p:gap-1 pos-720p:px-2 pos-720p:py-1.5 pos-720p:text-[9px]',
                    cart.length
                      ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-200 dark:hover:bg-[#1a1f35]'
                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-600',
                  )}
                >
                  <Send className="size-4 shrink-0 pos-720p:size-3.5" aria-hidden />
                  แจ้งยอด
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (cart.length) setShowPickingModal(true)
                  }}
                  disabled={!cart.length}
                  className={clsx(
                    'inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-black uppercase tracking-widest shadow-sm transition pos-720p:gap-1 pos-720p:px-2 pos-720p:py-1.5 pos-720p:text-[9px]',
                    cart.length
                      ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-200 dark:hover:bg-[#1a1f35]'
                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-600',
                  )}
                >
                  <ClipboardList className="size-4 shrink-0 pos-720p:size-3.5" aria-hidden />
                  ใบสั่งจัด
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (cart.length) setShowQuotationModal(true)
                  }}
                  disabled={!cart.length}
                  className={clsx(
                    'inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-black uppercase tracking-widest shadow-sm transition pos-720p:gap-1 pos-720p:px-2 pos-720p:py-1.5 pos-720p:text-[9px]',
                    cart.length
                      ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-200 dark:hover:bg-[#1a1f35]'
                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-600',
                  )}
                >
                  <Send className="size-4 shrink-0 pos-720p:size-3.5" aria-hidden />
                  ใบเสนอราคา
                </button>
              </div>
              <button
                id="pos-confirm-sale"
                type="button"
                onClick={openCheckoutModal}
                disabled={!cart.length}
                className={clsx(
                  'flex w-full items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-black uppercase tracking-widest text-white transition dark:from-cyan-600 dark:to-blue-600 pos-720p:py-2 pos-720p:text-xs',
                  cart.length
                    ? 'hover:from-blue-500 hover:to-indigo-500 dark:hover:from-cyan-500 dark:hover:to-blue-500'
                    : 'cursor-not-allowed opacity-50',
                )}
              >
                <CheckCircle2 className="size-5 shrink-0 pos-720p:size-4" aria-hidden />
                ยืนยัน (CONFIRM)
              </button>
            </section>
          </aside>
        </div>
      </div>

      {showSuspendModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[360] flex items-center justify-center bg-slate-600/35 p-4 backdrop-blur-md dark:bg-slate-950/50"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowSuspendModal(false)
            }}
          >
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-600/50 dark:bg-[#1e222e]">
              <div className="border-t-[3px] border-t-amber-500">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-amber-50/80 to-slate-50/90 px-4 py-3 dark:border-slate-600/40 dark:from-amber-950/25 dark:to-[#252a38]">
                  <h3 className="flex min-w-0 items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-800 sm:text-sm dark:text-slate-100">
                    <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                    <span className="truncate">
                      รายการบิลที่พักไว้ <span className="font-mono text-[10px] opacity-80">(SUSPENDED BILLS)</span>
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowSuspendModal(false)}
                    className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1a1f35]"
                    aria-label="ปิด"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>
              <div className="max-h-[60vh] overflow-auto space-y-2 p-2 sm:max-h-[70vh]">
                {suspendedBills.length === 0 ? (
                  <div className="p-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">ไม่มีบิลที่พักไว้</div>
                ) : (
                  suspendedBills.map((b) => {
                    const awaitTransfer = isSuspendedAwaitTransfer(b)
                    return (
                    <div
                      key={b.id}
                      className={clsx(
                        'flex w-full items-stretch gap-2 rounded-lg border px-2 py-2.5 shadow-sm sm:gap-3 sm:px-3 sm:py-3',
                        awaitTransfer
                          ? 'border-pink-400/70 bg-gradient-to-r from-pink-50 via-rose-50/80 to-white dark:border-pink-500/45 dark:from-pink-950/50 dark:via-rose-950/35 dark:to-[#12141c]'
                          : 'border-slate-200 bg-white dark:border-[#2a2d3e] dark:bg-[#12141c]',
                      )}
                    >
                      <div
                        className={clsx(
                          'hidden w-1 shrink-0 rounded-full sm:block',
                          awaitTransfer ? 'bg-gradient-to-b from-pink-500 to-rose-600' : 'bg-amber-400/80',
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span
                            className={clsx(
                              'rounded px-2 py-0.5 text-[9px] font-black tabular-nums',
                              awaitTransfer
                                ? 'bg-pink-600 text-white dark:bg-pink-700'
                                : 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100',
                            )}
                          >
                            {awaitTransfer ? 'แจ้งยอด · รอโอน' : `เวลา ${formatSuspendedBillTime(b.createdAt)}`}
                          </span>
                          {awaitTransfer ? (
                            <span className="rounded border border-pink-200/80 bg-white/90 px-2 py-0.5 text-[9px] font-black tabular-nums text-pink-900 dark:border-pink-500/30 dark:bg-pink-950/40 dark:text-pink-100">
                              เวลา {formatSuspendedBillTime(b.createdAt)}
                            </span>
                          ) : null}
                          <span
                            className={clsx(
                              'rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white',
                              b.mode === 'tax' ? 'bg-violet-600' : 'bg-blue-600',
                            )}
                          >
                            {b.mode === 'tax' ? 'TAX' : 'RETAIL'}
                          </span>
                          <span className="min-w-0 truncate text-[11px] font-bold text-slate-800 sm:text-[12px] dark:text-slate-100">
                            {b.customer.name}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          <span>สินค้า {b.cart.length} รายการ</span>
                          <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                            ·
                          </span>
                          <span className="font-mono text-cyan-600 dark:text-cyan-400">
                            ยอด{' '}
                            {suspendedBillGrandDisplay(b).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => removeSuspendedBill(b.id)}
                          className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-900 text-slate-300 shadow-sm transition hover:bg-slate-800 hover:text-white dark:border-[#2a2d3e] dark:bg-[#1a1f2e] dark:text-slate-400 dark:hover:bg-[#252b40] dark:hover:text-slate-100 sm:size-10"
                          aria-label="ลบบิลที่พักไว้"
                          title="ลบ"
                        >
                          <Trash2 className="size-4 shrink-0" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => resumeSuspendedBill(b)}
                          className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-2.5 py-2 text-[11px] font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-amber-500 sm:px-4 sm:py-2.5 sm:text-xs"
                        >
                          <Play className="size-3.5 shrink-0 fill-current sm:size-4" aria-hidden />
                          เรียกคืน
                        </button>
                      </div>
                    </div>
                    )
                  })
                )}
              </div>
              <div className="flex justify-end border-t border-slate-200 bg-slate-50/80 px-3 py-2.5 dark:border-[#2a2d3e] dark:bg-[#0a0c12]">
                <button
                  type="button"
                  onClick={() => setShowSuspendModal(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#1a1f2e] dark:text-slate-200 dark:hover:bg-[#252b40]"
                >
                  ปิด (CLOSE)
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showHistoryPopup && memberHistory.length > 0 &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[340] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-black/70"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setShowHistoryPopup(false) }}
          >
            <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#2a2d3e] dark:bg-[#0d0f17]">
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
                  <Clock className="size-4 text-purple-500 dark:text-fuchsia-400" aria-hidden />
                  ประวัติการซื้อ — {customer.name}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedHistoryBills((prev) =>
                        prev.size === memberHistory.length
                          ? new Set()
                          : new Set(memberHistory.map((b) => b.id)),
                      )
                    }
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-300 dark:hover:bg-[#1a1f35]"
                  >
                    {expandedHistoryBills.size === memberHistory.length ? 'ซ่อนทั้งหมด' : 'แสดงทั้งหมด'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHistoryPopup(false)}
                    className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1a1f35]"
                    aria-label="ปิด"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="min-h-0 overflow-auto">
                <table className="w-full border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-[#12141c]">
                    <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-[#2a2d3e] dark:text-slate-400">
                      <th className="px-3 py-2 text-left">เลขบิล</th>
                      <th className="px-3 py-2 text-left">วันที่</th>
                      <th className="px-3 py-2 text-right">รายการ</th>
                      <th className="px-3 py-2 text-right">ยอด</th>
                      <th className="px-3 py-2 text-center">สินค้า</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberHistory.map((bill) => {
                      const expanded = expandedHistoryBills.has(bill.id)
                      return (
                        <>
                          <tr
                            key={bill.id}
                            className="border-b border-slate-100 hover:bg-slate-50/70 dark:border-[#1e2233] dark:hover:bg-[#1a1f35]/50"
                          >
                            <td className="px-3 py-2 font-mono text-[11px] font-bold text-blue-600 dark:text-cyan-400">
                              {bill.billNo}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-500 dark:text-slate-400">
                              {new Date(bill.at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-500 dark:text-slate-400">
                              {bill.lineCount}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                              {bill.total.toLocaleString('th-TH', { minimumFractionDigits: 0 })}฿
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedHistoryBills((prev) => {
                                    const next = new Set(prev)
                                    next.has(bill.id) ? next.delete(bill.id) : next.add(bill.id)
                                    return next
                                  })
                                }
                                className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-300 dark:hover:bg-[#1a1f35]"
                              >
                                {expanded ? 'ซ่อน' : 'แสดง'}
                              </button>
                            </td>
                          </tr>
                          {expanded && (
                            <tr key={`${bill.id}-lines`} className="border-b border-slate-100 bg-slate-50/60 dark:border-[#1e2233] dark:bg-[#0a0c14]">
                              <td colSpan={5} className="px-4 py-2">
                                {bill.lines.length > 0 ? (
                                  <table className="w-full select-text text-[11px]">
                                    <tbody className="divide-y divide-slate-100 dark:divide-[#1e2233]">
                                      {bill.lines.map((line, i) => (
                                        <tr key={i}>
                                          <td className="py-0.5 pr-3 text-slate-700 dark:text-slate-300">{line.name}</td>
                                          <td className="whitespace-nowrap py-0.5 pr-3 tabular-nums text-slate-400 dark:text-slate-500">×{line.qty}</td>
                                          <td className="whitespace-nowrap py-0.5 text-right tabular-nums text-slate-500 dark:text-slate-400">
                                            {line.unitPrice !== undefined
                                              ? `${(line.qty * line.unitPrice).toLocaleString('th-TH', { minimumFractionDigits: 0 })}฿`
                                              : '—'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500">ไม่มีรายละเอียดรายการ</p>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-300 bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                    <tr className="font-bold">
                      <td colSpan={3} className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                        รวม {memberHistory.length} บิล
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm tabular-nums text-emerald-800 dark:text-emerald-300">
                        {memberHistory.reduce((s, b) => s + b.total, 0).toLocaleString('th-TH', { minimumFractionDigits: 0 })}฿
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showMemberModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[340] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-black/70"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowMemberModal(false)
            }}
          >
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#2a2d3e] dark:bg-[#0d0f17]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
                  <Users className="size-4 text-blue-500 dark:text-cyan-400" aria-hidden />
                  เลือกลูกค้า
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1a1f35]"
                  aria-label="ปิด"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="border-b border-slate-200 bg-white p-3 dark:border-[#2a2d3e] dark:bg-[#050508]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-cyan-500/50" />
                  <input
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ / รหัส / เบอร์โทร / เลขผู้เสียภาษี..."
                    autoFocus
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-cyan-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              <div className="max-h-[70vh] overflow-auto p-2">
                <div className="grid grid-cols-12 gap-2 border-b border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:border-[#2a2d3e] dark:text-slate-400">
                  <div className="col-span-3">Account</div>
                  <div className="col-span-7">Name / Phone</div>
                  <div className="col-span-2 text-center">Action</div>
                </div>
                {filteredMembers.map((m) => (
                  <div
                    key={m.accountCode}
                    className="grid grid-cols-12 items-center gap-2 border-b border-slate-100 px-3 py-2 text-sm hover:bg-slate-50 dark:border-[#1c1f2e] dark:hover:bg-[#1a1f35]"
                  >
                    <div className="col-span-3 font-mono text-[11px] font-black text-purple-700 dark:text-fuchsia-400">
                      {m.accountCode}
                    </div>
                    <div className="col-span-7 min-w-0">
                      <p className="truncate text-[12px] font-semibold text-slate-700 dark:text-slate-200">{m.name}</p>
                      {m.phone && (
                        <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{formatPhone(m.phone)}</p>
                      )}
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomer(m)
                          setShowMemberModal(false)
                        }}
                        className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:bg-blue-100 dark:border-cyan-800/50 dark:bg-cyan-900/20 dark:text-cyan-300 dark:hover:bg-cyan-900/35"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showProductModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[340] flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm dark:bg-black/70"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setShowProductModal(false)
                setProductSearchQuery('')
                setProductModalCategory(null)
                setProductModalMake('ทั้งหมด')
                setProductModalModel('ทั้งหมด')
                setSelectedModalProduct(null)
              }
            }}
          >
            <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#2a2d3e] dark:bg-[#0d0f17]" style={{ maxHeight: 'min(94vh, 860px)' }}>

              {/* Header */}
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-4 text-blue-500 dark:text-cyan-400" aria-hidden />
                  <span className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">เลือกสินค้า</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                    {filteredProducts.length} รายการ
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowProductModal(false); setProductSearchQuery(''); setProductModalCategory(null); setProductModalMake('ทั้งหมด'); setProductModalModel('ทั้งหมด'); setSelectedModalProduct(null) }}
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1a1f35]"
                  aria-label="ปิด"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Search + car filter */}
              <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2.5 dark:border-[#2a2d3e] dark:bg-[#050508]">
                {/* Search bar */}
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-cyan-500/50" />
                  <input
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="ค้นหา รหัส / ชื่อสินค้า / เลขอะไหล่ OEM / ยี่ห้อ..."
                    autoFocus
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-8 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-cyan-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                  />
                  {productSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setProductSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                {/* Car make / model */}
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">รถ</span>
                    <select
                      value={productModalMake}
                      onChange={(e) => { setProductModalMake(e.target.value); setProductModalModel('ทั้งหมด') }}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-cyan-100"
                    >
                      {modalMakeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <select
                    value={productModalModel}
                    onChange={(e) => setProductModalModel(e.target.value)}
                    disabled={productModalMake === 'ทั้งหมด'}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 disabled:opacity-40 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-cyan-100"
                  >
                    {modalModelOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {(productModalMake !== 'ทั้งหมด') && (
                    <button
                      type="button"
                      onClick={() => { setProductModalMake('ทั้งหมด'); setProductModalModel('ทั้งหมด') }}
                      className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:border-[#2a2d3e] dark:text-slate-400 dark:hover:bg-[#1a1f35]"
                    >
                      <X className="size-3" /> ล้าง
                    </button>
                  )}
                </div>
              </div>

              {/* Category chips */}
              {modalCategoryOptions.length > 0 && (
                <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-[#2a2d3e] dark:bg-[#0a0c13]" style={{ scrollbarWidth: 'none' }}>
                  <button
                    type="button"
                    onClick={() => setProductModalCategory(null)}
                    className={clsx(
                      'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition',
                      productModalCategory === null
                        ? 'border-blue-500 bg-blue-500 text-white dark:border-cyan-500 dark:bg-cyan-500 dark:text-slate-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-400 dark:hover:bg-[#1a1f35]',
                    )}
                  >
                    ทั้งหมด
                  </button>
                  {modalCategoryOptions.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setProductModalCategory(productModalCategory === cat ? null : cat)}
                      className={clsx(
                        'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition',
                        productModalCategory === cat
                          ? 'border-blue-500 bg-blue-500 text-white dark:border-cyan-500 dark:bg-cyan-500 dark:text-slate-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-400 dark:hover:bg-[#1a1f35]',
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Split view: left list + right detail */}
              <div className="flex min-h-0 flex-1 overflow-hidden">

                {/* LEFT — compact scrollable list */}
                <div className="w-72 shrink-0 overflow-y-auto border-r border-slate-200 dark:border-[#2a2d3e]">
                  {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                      <Search className="size-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">ไม่พบสินค้า</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                    </div>
                  ) : filteredProducts.map((p) => {
                    const dotColor = p.stock <= 0 ? 'bg-rose-400' : p.stock <= 5 ? 'bg-amber-400' : 'bg-emerald-400'
                    const stockText = p.stock <= 0 ? 'หมด' : `${p.stock}`
                    const stockTextColor = p.stock <= 0 ? 'text-rose-500 dark:text-rose-400' : p.stock <= 5 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    const cfg = getPosSellConfig(p.id)
                    const picked = pickDefaultPosUnitAndPrice(cfg)
                    const price = picked != null ? cfg.getListUnitPrice(picked.unit.index, picked.level.index) : 0
                    const isSelected = selectedModalProduct?.id === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedModalProduct(p)}
                        className={clsx(
                          'flex w-full items-center gap-2.5 border-b border-slate-100 px-3 py-2.5 text-left transition-colors dark:border-[#1c1f2e]',
                          isSelected ? 'bg-blue-50 dark:bg-[#1a1f35]' : 'hover:bg-slate-50 dark:hover:bg-[#1a1f35]/60',
                        )}
                      >
                        <span className={clsx('mt-0.5 size-2 shrink-0 rounded-full', dotColor)} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-mono text-[11px] font-black text-blue-700 dark:text-cyan-300">{p.code}</span>
                          <span className="block truncate text-[12px] font-semibold text-slate-700 dark:text-slate-200">{p.name}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          {price > 0 && <span className="block font-mono text-[11px] font-black text-slate-700 dark:text-slate-200">฿{price.toLocaleString('th-TH')}</span>}
                          <span className={clsx('block font-mono text-[10px] font-bold tabular-nums', stockTextColor)}>{stockText}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* RIGHT — product detail panel */}
                <div className="min-w-0 flex-1 overflow-y-auto">
                  {selectedModalProduct ? (() => {
                    const sp = selectedModalProduct
                    const master = getProductMasterBySku(sp.code)
                    const cfg = getPosSellConfig(sp.id)
                    const picked = pickDefaultPosUnitAndPrice(cfg)
                    const displayPrice = picked != null ? cfg.getListUnitPrice(picked.unit.index, picked.level.index) : 0
                    const fits = (master?.vehicleFitments ?? []).filter(Boolean)
                    const oem = [sp.factoryOem, sp.genuineNo].filter(Boolean).join(' / ')
                    const dims = formatDims(sp.dimensions)
                    const stockColor = sp.stock <= 0 ? 'text-rose-500 dark:text-rose-400' : sp.stock <= 5 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    return (
                      <div className="flex h-full flex-col gap-4 p-5">
                        {/* Image + title */}
                        <div className="flex gap-4">
                          <ProductImage sku={sp.code} size="lg" className="shrink-0" zoomable onProject={() => showProductImage({ code: sp.code, name: sp.name, price: displayPrice, unit: picked?.unit.label ?? '' })} />
                          <div className="min-w-0">
                            <div className="mb-1.5 flex flex-wrap gap-1">
                              {sp.brand && <span className="rounded bg-blue-50 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">{sp.brand}</span>}
                              {sp.category && <span className="rounded bg-slate-100 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-[#1a1f35] dark:text-slate-400">{sp.category}</span>}
                            </div>
                            <p className="font-mono text-[12px] font-black text-blue-700 dark:text-cyan-300">{sp.code}</p>
                            <h2 className="mt-0.5 text-[15px] font-black leading-snug text-slate-900 dark:text-white">{sp.name}</h2>
                          </div>
                        </div>

                        {/* Vehicle fitments */}
                        {fits.length > 0 && (
                          <div>
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">รุ่นรถที่ใช้ได้</p>
                            <div className="flex flex-wrap gap-1.5">
                              {fits.map((f, i) => {
                                const eng = getFitmentEngineName(f)
                                const yr = fitmentYearLabel(f)
                                const engPart = eng ? ` · ${eng}` : ''
                                const yrPart = yr !== '-' ? ` · ปี ${yr}` : ''
                                const drivePart = f.driveType ? ` · ${f.driveType}` : ''
                                const brakePart = f.brakePosition === 'front' ? ' · เบรกหน้า' : f.brakePosition === 'rear' ? ' · เบรกหลัง' : ''
                                return (
                                  <span key={i} className="rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] text-sky-800 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-300">
                                    🚗 {f.brandName} {f.modelName}{engPart}{yrPart}{drivePart}{brakePart}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* OEM / dims / location */}
                        {(oem || dims || sp.location) && (
                          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-[#2a2d3e] dark:bg-[#0a0c13]">
                            {oem && (
                              <div>
                                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">OEM / เบอร์แท้</p>
                                <p className="font-mono text-[12px] font-semibold text-amber-700 dark:text-amber-400">{oem}</p>
                              </div>
                            )}
                            {dims && (
                              <div>
                                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">มิติ (A/B/C)</p>
                                <p className="font-mono text-[12px] font-semibold text-violet-600 dark:text-violet-400">{dims}</p>
                              </div>
                            )}
                            {sp.location && (
                              <div>
                                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">ที่เก็บ</p>
                                <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">📍 {sp.location}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Price + stock + add button */}
                        <div className="mt-auto">
                          <div className="mb-3 flex items-end justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-[#2a2d3e] dark:bg-[#0a0c13]">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ราคาขาย</p>
                              <p className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                                {displayPrice > 0 ? `฿${displayPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '—'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">คงเหลือ</p>
                              <p className={clsx('font-mono text-2xl font-black', stockColor)}>{sp.stock} ชิ้น</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              addProductToCart(sp)
                              setShowProductModal(false)
                              setProductSearchQuery('')
                              setSelectedModalProduct(null)
                              setProductModalCategory(null)
                              setProductModalMake('ทั้งหมด')
                              setProductModalModel('ทั้งหมด')
                            }}
                            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-black uppercase tracking-widest text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98] dark:bg-cyan-600 dark:hover:bg-cyan-500"
                          >
                            + เพิ่มเข้าตะกร้า
                          </button>
                        </div>
                      </div>
                    )
                  })() : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <ShoppingCart className="size-12 text-slate-200 dark:text-slate-700" />
                      <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">เลือกสินค้าจากรายการ</p>
                      <p className="text-xs text-slate-300 dark:text-slate-600">คลิกชื่อสินค้าเพื่อดูรายละเอียดและเพิ่มเข้าตะกร้า</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>,
          document.body,
        )}

      {fitmentPreviewSku &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[345] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-black/70"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setFitmentPreviewSku(null)
            }}
          >
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#2a2d3e] dark:bg-[#0d0f17]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
                  รุ่นที่รองรับ · {fitmentPreviewSku}
                </h3>
                <button
                  type="button"
                  onClick={() => setFitmentPreviewSku(null)}
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1a1f35]"
                  aria-label="ปิด"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="max-h-[60vh] space-y-1 overflow-auto p-3">
                {fitmentPreviewRows.length > 0 ? (
                  fitmentPreviewRows.map((row, idx) => (
                    <p
                      key={`fitment-preview-${fitmentPreviewSku}-${idx}`}
                      className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-700 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-200"
                    >
                      {row}
                    </p>
                  ))
                ) : (
                  <p className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-500 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-400">
                    ไม่มีข้อมูลรุ่นรถที่ตรงเงื่อนไข
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showCheckoutModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[350] flex items-center justify-center bg-slate-600/35 p-4 backdrop-blur-md dark:bg-slate-950/50"
            onMouseDown={(e) => {
              if (!isSavingCheckout && e.target === e.currentTarget) closeCheckoutModal()
            }}
          >
            <div
              className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl dark:border-slate-600/50 dark:bg-[#1e222e]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="checkout-title"
            >
              <div className="flex justify-end px-4 pt-4">
                <button
                  type="button"
                  onClick={closeCheckoutModal}
                  disabled={isSavingCheckout}
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                  aria-label="ปิด"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-4 px-6 pb-6 pt-0">
                <div className="text-center">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-inner dark:border-slate-600/50 dark:bg-[#252a38]/80">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">ยอดชำระสุทธิ</div>
                    <div className="mt-1 bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text font-mono text-4xl font-black text-transparent dark:from-emerald-400 dark:to-cyan-300">
                      {totals.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                    </div>
                  </div>
                </div>

                <div className="max-h-28 space-y-1 overflow-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-600/50 dark:bg-[#252a38]/50">
                  {pricedCart.map((l) => (
                    <div key={`checkout-line-${l.id}`} className="flex items-center justify-between gap-2 rounded px-1 py-1 text-[11px]">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-700 dark:text-slate-200">{l.name}</div>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          {l.qty} {l.unit} | {priceTypeLabelForLine(l)}
                        </div>
                      </div>
                      <div className="shrink-0 font-mono font-black text-slate-800 dark:text-slate-100">
                        {(l.price * l.qty - l.discount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>

                <h3
                  id="checkout-title"
                  className="text-center text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200"
                >
                  เลือกวิธีชำระเงิน
                </h3>

                <div className="flex flex-wrap justify-center gap-2.5">
                  {(
                    [
                      {
                        id: 'cash' as const,
                        label: 'เงินสด',
                        icon: <Banknote className="size-4 shrink-0" aria-hidden />,
                        activeColor: 'text-emerald-600 dark:text-emerald-400',
                        activeBorder: 'border-emerald-500',
                        activeBg: 'bg-emerald-50 dark:bg-emerald-900/20',
                        disabled: false,
                      },
                      {
                        id: 'transfer' as const,
                        label: 'โอนเงิน',
                        icon: <QrCode className="size-4 shrink-0" aria-hidden />,
                        activeColor: 'text-blue-600 dark:text-cyan-400',
                        activeBorder: 'border-blue-500',
                        activeBg: 'bg-blue-50 dark:bg-blue-900/20',
                        disabled: false,
                      },
                      {
                        id: 'account' as const,
                        label: 'ลงบัญชี',
                        icon: <BookOpen className="size-4 shrink-0" aria-hidden />,
                        activeColor: 'text-teal-600 dark:text-teal-400',
                        activeBorder: 'border-teal-500',
                        activeBg: 'bg-teal-50 dark:bg-teal-900/20',
                        disabled: false,
                      },
                      {
                        id: 'mixed' as const,
                        label: 'ผสม',
                        icon: <Wallet className="size-4 shrink-0" aria-hidden />,
                        activeColor: 'text-purple-600 dark:text-purple-400',
                        activeBorder: 'border-purple-500',
                        activeBg: 'bg-purple-50 dark:bg-purple-900/20',
                        disabled: false,
                      },
                    ] as const
                  ).map((pm) => {
                    const isSelected = checkoutPaymentType === pm.id
                    let btnClass =
                      'flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border-2 px-4 py-2 text-[12px] font-bold uppercase tracking-wider transition-all group '
                    if (pm.disabled) {
                      btnClass +=
                        'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60 dark:border-slate-600 dark:bg-[#151822] dark:text-slate-600'
                    } else if (isSelected) {
                      btnClass += `${pm.activeBg} ${pm.activeBorder} ${pm.activeColor} scale-[1.02] shadow-sm`
                    } else {
                      btnClass +=
                        'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-[#252a38] dark:text-slate-400 dark:hover:bg-[#2d3445]'
                    }
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        disabled={pm.disabled || isSavingCheckout}
                        onClick={() => !pm.disabled && handleCheckoutPaymentTypeChange(pm.id)}
                        className={btnClass}
                      >
                        <div
                          className={
                            isSelected && !pm.disabled
                              ? ''
                              : 'text-slate-400 transition-colors group-hover:text-slate-600 dark:group-hover:text-slate-300'
                          }
                        >
                          {pm.icon}
                        </div>
                        <span className="tracking-wider">{pm.label}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="min-h-[220px] rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-600/50 dark:bg-[#252a38]/60">
                  {checkoutPaymentType === 'cash' && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            รับเงินมา (Received)
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={
                              cashReceived
                                ? (() => {
                                    const n = Number.parseFloat(cashReceived)
                                    return Number.isNaN(n)
                                      ? cashReceived
                                      : n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                  })()
                                : ''
                            }
                            placeholder="0"
                            className="w-full rounded-xl border border-blue-300 bg-white py-2 px-3 text-right font-mono text-xl font-bold text-slate-800 shadow-inner outline-none dark:border-blue-500/50 dark:bg-[#1a1f2e] dark:text-cyan-100"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            เงินทอน (Change)
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={
                              changeAmount >= 0 && receivedAmount > 0
                                ? Math.max(0, changeAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })
                                : '0.00'
                            }
                            className={clsx(
                              'w-full rounded-xl border py-2 px-3 text-right font-mono text-xl font-bold outline-none transition-colors',
                              changeAmount >= 0 && receivedAmount > 0
                                ? 'border-emerald-400 bg-emerald-50 text-emerald-600 shadow-[0_0_10px_rgba(52,211,153,0.1)] dark:border-emerald-500/40 dark:bg-emerald-900/10 dark:text-emerald-400'
                                : 'border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-600 dark:bg-[#1a1f2e] dark:text-slate-500',
                            )}
                          />
                        </div>
                        <div className="mt-auto grid grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => handleCashNumpad('EXACT')}
                            disabled={isSavingCheckout}
                            className="rounded-lg border border-emerald-200 bg-emerald-100 py-2 text-[11px] font-bold uppercase text-emerald-700 transition-colors hover:bg-emerald-200 dark:border-emerald-500/50 dark:bg-emerald-900/30 dark:text-emerald-400"
                          >
                            พอดี
                          </button>
                          {quickCashAmounts.map((amt, idx) => (
                            <button
                              key={`quick-${idx}-${amt}`}
                              type="button"
                              onClick={() => setCashReceived(amt.toString())}
                              disabled={isSavingCheckout}
                              className="rounded-lg border border-blue-200 bg-blue-50 py-2 font-mono text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-900/20 dark:text-cyan-400"
                            >
                              {amt.toLocaleString('th-TH')}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', 'DEL'] as const).map((btn) => (
                          <button
                            key={btn}
                            type="button"
                            disabled={isSavingCheckout}
                            onClick={() => handleCashNumpad(btn)}
                            className={clsx(
                              'flex items-center justify-center rounded-xl border py-3 font-mono text-lg font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-95',
                              btn === 'C'
                                ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-900/20 dark:text-rose-400'
                                : btn === 'DEL'
                                  ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-400'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-[#2d3445] dark:text-slate-200 dark:hover:bg-[#363e52]',
                            )}
                          >
                            {btn === 'DEL' ? <Trash2 className="size-5" aria-hidden /> : btn}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {checkoutPaymentType === 'transfer' && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        เลือกบัญชีรับโอน
                      </label>
                      {bankAccounts.length === 0 ? (
                        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          ยังไม่มีบัญชีธนาคาร — กรุณาเพิ่มที่เมนู เปิด/ปิดกะ › บัญชีธนาคาร
                        </p>
                      ) : (
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-[#1a1f2e] dark:text-cyan-100"
                        >
                          <option value="">เลือกบัญชี...</option>
                          {bankAccounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.bankName} · {a.accountNo} ({a.accountName})
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowQRModal(true)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-[#1a1f2e] dark:text-slate-200 dark:hover:bg-[#2d3445]"
                      >
                        <QrCode className="size-4" aria-hidden />
                        แสดง QR
                      </button>
                    </div>
                  )}

                  {checkoutPaymentType === 'account' && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
                        บันทึกเป็นยอดค้างชำระ (ลูกหนี้) ตามลูกค้าที่เลือกในหน้าจอหลัก
                      </p>
                      {isWalkIn ? (
                        <p className="text-[11px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
                          กรุณาเลือกลูกค้าที่มีรหัสลูกหนี้ (ไม่ใช่ Walk-in)
                        </p>
                      ) : (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          ลูกค้า: <span className="font-black">{customer.name}</span> ({customer.accountCode})
                        </p>
                      )}
                    </div>
                  )}

                  {checkoutPaymentType === 'mixed' && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        แบ่งชำระ: เงินสด + โอน ให้รวมเท่ายอดชำระสุทธิ
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            ยอดเงินสด
                          </label>
                          <input
                            value={mixedCashAmount}
                            onChange={(e) => setMixedCashAmount(e.target.value)}
                            inputMode="decimal"
                            placeholder="0"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-right font-mono text-lg font-black text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-[#1a1f2e] dark:text-cyan-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            ยอดโอน
                          </label>
                          <input
                            value={mixedTransferAmount}
                            onChange={(e) => setMixedTransferAmount(e.target.value)}
                            inputMode="decimal"
                            placeholder="0"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-right font-mono text-lg font-black text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-[#1a1f2e] dark:text-cyan-100"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          บัญชีรับโอน (ส่วนโอน)
                        </label>
                        {bankAccounts.length === 0 ? (
                          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            ยังไม่มีบัญชีธนาคาร — กรุณาเพิ่มที่เมนู เปิด/ปิดกะ › บัญชีธนาคาร
                          </p>
                        ) : (
                          <select
                            value={selectedBank}
                            onChange={(e) => setSelectedBank(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-[#1a1f2e] dark:text-cyan-100"
                          >
                            <option value="">เลือกบัญชี...</option>
                            {bankAccounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.bankName} · {a.accountNo} ({a.accountName})
                              </option>
                            ))}
                          </select>
                        )}
                        {selectedBank && mixedTransferNum > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowQRModal(true)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-[#1a1f2e] dark:text-slate-200 dark:hover:bg-[#2d3445]"
                          >
                            <QrCode className="size-4" aria-hidden />
                            แสดง QR ส่วนโอน ({mixedTransferNum.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท)
                          </button>
                        )}
                      </div>
                      <div className="flex justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-widest dark:border-slate-600 dark:bg-[#1a1f2e]">
                        <span className="text-slate-500 dark:text-slate-400">รวมตรวจสอบ</span>
                        <span
                          className={clsx(
                            'font-mono',
                            Math.abs(mixedSum - totals.grandTotal) <= MIX_TOTAL_EPS
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400',
                          )}
                        >
                          {mixedSum.toLocaleString('th-TH', { minimumFractionDigits: 2 })} /{' '}
                          {totals.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    วิธีจัดส่ง
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['รับเอง', 'ส่งเอง', ...transportNames].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setCheckoutShippingMethod(method)}
                        className={clsx(
                          'rounded-xl border-2 px-3 py-1.5 text-[11px] font-bold transition-all',
                          checkoutShippingMethod === method
                            ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-[#252a38] dark:text-slate-400',
                        )}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {!canSubmitCheckout && (
                    <p className="text-center text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      {checkoutPaymentType === 'cash' && 'กรุณากรอกเงินรับให้ครบหรือมากกว่ายอดชำระ'}
                      {checkoutPaymentType === 'transfer' && 'กรุณาเลือกบัญชีรับโอน'}
                      {checkoutPaymentType === 'account' && 'ลงบัญชี: กรุณาเลือกลูกค้าที่มีรหัสลูกหนี้'}
                      {checkoutPaymentType === 'mixed' &&
                        'ผสม: กรอกเงินสดและโอนให้ครบทั้งสองส่วน เลือกบัญชี และให้ยอดรวมเท่ายอดชำระ'}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeCheckoutModal}
                      disabled={isSavingCheckout}
                      className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-[#252a38] dark:text-slate-400 dark:hover:bg-[#2d3445]"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCheckout}
                      disabled={!canSubmitCheckout || isSavingCheckout}
                      className={clsx(
                        'flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm transition',
                        canSubmitCheckout && !isSavingCheckout
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400'
                          : 'cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-500',
                      )}
                    >
                      {isSavingCheckout ? 'กำลังบันทึก...' : 'ยืนยัน'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {posSpotlight &&
        typeof document !== 'undefined' &&
        createPortal(
          (() => {
            const currentUrl = posSpotlightUrls[posSpotlightIndex] ?? null
            const selectImage = (idx: number) => {
              setPosSpotlightIndex(idx)
              writeCfdState({ ...readCfdState(), spotlightImageIndex: idx, updatedAt: Date.now() })
            }
            const thumbnails = posSpotlightUrls.length > 1 ? (
              <div className="flex items-center justify-center gap-2">
                {posSpotlightUrls.map((u, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); selectImage(i) }}
                    className={`size-12 overflow-hidden rounded-lg border-2 transition ${i === posSpotlightIndex ? 'border-orange-400 shadow-md' : 'border-slate-200 opacity-60 hover:opacity-100'}`}
                  >
                    <img src={u} alt={`${i + 1}`} className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            ) : null

            if (posSpotlightExpanded) {
              return (
                <div
                  className="fixed inset-0 z-[360] flex flex-col items-center justify-center gap-5 bg-white/95 backdrop-blur-md dark:bg-[#0d0f17]/95 cursor-zoom-out"
                  onClick={() => { setPosSpotlightExpanded(false); writeCfdState({ ...readCfdState(), spotlightExpanded: false, updatedAt: Date.now() }) }}
                >
                  <div className="flex h-[60vh] w-[60vh] max-w-[85vw] items-center justify-center overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 shadow-2xl dark:border-[#2a2d3e] dark:bg-[#12141c]">
                    {currentUrl ? (
                      <img src={currentUrl} alt={posSpotlight.name} className="h-full w-full object-contain" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="size-32 text-slate-200 dark:text-slate-700" fill="none" stroke="currentColor" strokeWidth={1}>
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                      </svg>
                    )}
                  </div>
                  {thumbnails}
                  <div className="text-center space-y-1 px-8" onClick={(e) => e.stopPropagation()}>
                    <p className="text-2xl font-black leading-tight text-slate-900 dark:text-white">{posSpotlight.name}</p>
                    {posSpotlight.price > 0 && (
                      <p className="text-lg font-semibold text-orange-500">
                        ฿{posSpotlight.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}{' '}
                        <span className="text-sm font-normal text-slate-400">/ {posSpotlight.unit}</span>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPosSpotlight(null); writeCfdState({ ...readCfdState(), spotlightSku: undefined, updatedAt: Date.now() }) }}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#1a1f35] dark:text-slate-300"
                  >
                    ปิด
                  </button>
                </div>
              )
            }

            return (
              <div className="fixed inset-0 z-[360] flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#2a2d3e] dark:bg-[#0d0f17]">
                  <div
                    className="flex h-56 items-center justify-center bg-slate-50 dark:bg-[#12141c] cursor-zoom-in"
                    onClick={() => { setPosSpotlightExpanded(true); writeCfdState({ ...readCfdState(), spotlightExpanded: true, updatedAt: Date.now() }) }}
                  >
                    {currentUrl ? (
                      <img src={currentUrl} alt={posSpotlight.name} className="h-full w-full object-contain" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="size-20 text-slate-200 dark:text-slate-700" fill="none" stroke="currentColor" strokeWidth={1}>
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                      </svg>
                    )}
                  </div>
                  {posSpotlightUrls.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 border-b border-slate-100 py-2 dark:border-[#2a2d3e]">
                      {posSpotlightUrls.map((u, i) => (
                        <button key={i} type="button" onClick={() => selectImage(i)}
                          className={`size-9 overflow-hidden rounded-md border transition ${i === posSpotlightIndex ? 'border-orange-400 shadow' : 'border-slate-200 opacity-50 hover:opacity-100'}`}
                        >
                          <img src={u} alt={`${i + 1}`} className="h-full w-full object-contain" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="space-y-0.5 p-4">
                    <p className="text-base font-black leading-snug text-slate-900 dark:text-white">{posSpotlight.name}</p>
                    {posSpotlight.price > 0 && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        ฿{posSpotlight.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })} / {posSpotlight.unit}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPosSpotlight(null); writeCfdState({ ...readCfdState(), spotlightSku: undefined, updatedAt: Date.now() }) }}
                    className="w-full border-t border-slate-100 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-50 dark:border-[#2a2d3e] dark:hover:bg-[#1a1f35]"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            )
          })(),
          document.body,
        )}

      {showQRModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[370] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-black/70"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowQRModal(false)
            }}
          >
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#2a2d3e] dark:bg-[#0d0f17]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
                  <QrCode className="size-4 text-blue-500 dark:text-cyan-400" aria-hidden />
                  QR รับเงิน
                </h3>
                <button
                  type="button"
                  onClick={() => setShowQRModal(false)}
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1a1f35]"
                  aria-label="ปิด"
                >
                  <X className="size-5" />
                </button>
              </div>
              <QrModalBody
                amount={qrAmount}
                accountId={selectedBank}
                bankAccounts={bankAccounts}
                onClose={() => setShowQRModal(false)}
              />
            </div>
          </div>,
          document.body,
        )}

      {showAmountNoticeModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[360] flex items-center justify-center bg-slate-600/35 p-4 backdrop-blur-md dark:bg-slate-950/50"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowAmountNoticeModal(false)
            }}
          >
            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-600/50 dark:bg-[#1e222e]">
              <div className="border-t-[3px] border-t-pink-500">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-pink-50 via-rose-50/40 to-slate-50/80 px-4 py-3 dark:border-slate-600/40 dark:from-pink-950/30 dark:via-rose-950/20 dark:to-[#252a38]">
                  <h3 className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-bold text-slate-800 dark:text-slate-100">
                    <Send className="size-4 shrink-0 text-pink-600 dark:text-pink-400" aria-hidden />
                    <span>แจ้งยอด</span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      (AMOUNT NOTICE)
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAmountNoticeModal(false)}
                    className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1a1f35]"
                    aria-label="ปิด"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>
              <div className="max-h-[85vh] space-y-4 overflow-auto p-4">
                <p className="text-center text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  ส่งสรุปนี้ให้คนโอน — กด <span className="font-black text-pink-700 dark:text-pink-300">พักบิลนี้เพื่อรอโอนเงิน</span> แล้วไปดูในรายการบิลที่พัก
                  (แถบ<span className="text-pink-600 dark:text-pink-400">ชมพู</span>) จะไม่ปนกับพักบิลธรรมดา
                </p>

                <div className="rounded-xl border border-pink-100/90 bg-gradient-to-b from-white via-pink-50/25 to-slate-50/90 p-4 shadow-sm dark:border-pink-900/35 dark:from-[#262b38] dark:via-[#222833] dark:to-[#1c202c]">
                  <p className="text-center text-[15px] font-bold tracking-wide text-slate-800 dark:text-slate-100">แจ้งยอด</p>
                  <p className="mt-2 text-center text-sm font-semibold text-pink-700 dark:text-pink-300">ลูกค้า: {customer.name}</p>
                  <p className="mt-1 text-center text-[11px] text-slate-500 dark:text-slate-400">
                    {formatThaiBillNoticeDate(docInfo.docDate)} · {docInfo.employee}
                  </p>

                  <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200/90 bg-white/80 dark:border-slate-600/50 dark:bg-[#2a3040]/60">
                    <table className="w-full min-w-[300px] text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100/95 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-400">
                          <th className="px-2 py-2">รายการสินค้า</th>
                          <th className="w-[4.5rem] px-2 py-2 text-right">จำนวน</th>
                          <th className="w-20 px-2 py-2 text-right">ราคา</th>
                          <th className="w-24 px-2 py-2 text-right">รวม</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricedCart.map((l) => (
                          <tr key={l.id} className="border-b border-slate-100 last:border-0 dark:border-slate-600/40">
                            <td className="px-2 py-2 align-top">
                              <div className="font-mono text-[9px] text-pink-600 dark:text-pink-400">{l.code}</div>
                              <div className="font-semibold leading-snug text-slate-800 dark:text-slate-100">{l.name}</div>
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                              {l.qty} {l.unit}
                            </td>
                            <td className="px-2 py-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                              {l.price.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-2 py-2 text-right font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                              {round2(l.price * l.qty - l.discount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-[11px] text-slate-500 dark:border-slate-600 dark:text-slate-400">
                    <span>รวมเป็นเงิน</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {round2(totals.subtotal).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                    </span>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">ยอดสุทธิที่ต้องชำระ</span>
                    <span className="font-mono text-2xl font-black text-emerald-700 dark:text-emerald-300">
                      {totals.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                    </span>
                  </div>

                  <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    ชำระโอนตามบัญชีที่ร้านแจ้งหรือตกลงกับลูกค้า
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSuspendBill('await_transfer')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3.5 text-sm font-black text-white shadow-md transition hover:from-amber-400 hover:to-orange-500 dark:from-amber-600 dark:to-orange-700 dark:hover:from-amber-500 dark:hover:to-orange-600"
                >
                  <Pause className="size-5 shrink-0" aria-hidden />
                  พักบิลนี้เพื่อรอโอนเงิน
                </button>

                <button
                  type="button"
                  onClick={() => setShowAmountNoticeModal(false)}
                  className="w-full py-1 text-center text-[12px] font-semibold text-slate-600 underline-offset-2 hover:underline dark:text-slate-400"
                >
                  ปิด (ย้อนกลับไปหน้าเดิม)
                </button>

                <div className="border-t border-slate-200 pt-3 dark:border-[#2a2d3e]">
                  <button
                    type="button"
                    onClick={() => setShowAmountNoticeModal(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-200 dark:hover:bg-[#1a1f35]"
                  >
                    <Printer className="size-4 shrink-0" aria-hidden />
                    พิมพ์แจ้งยอด
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showPickingModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[360] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-black/70"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowPickingModal(false)
            }}
          >
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#2a2d3e] dark:bg-[#0d0f17]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
                  <ClipboardList className="size-4 text-blue-500 dark:text-cyan-400" aria-hidden />
                  ใบสั่งจัดสินค้า (Picking List)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPickingModal(false)}
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1a1f35]"
                  aria-label="ปิด"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="space-y-3 p-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-200">
                  {pricedCart.map((l) => (
                    <div key={l.id} className="flex items-center justify-between gap-3 py-1 text-[12px]">
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] font-black text-blue-700 dark:text-cyan-300">{l.code}</div>
                        <div className="truncate font-semibold">{l.name}</div>
                      </div>
                      <div className="font-mono font-black">
                        {l.qty} {l.unit}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPickingModal(false)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-200 dark:hover:bg-[#12141c]"
                  >
                    ปิด
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPickingModal(false)}
                    className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-black uppercase tracking-widest text-white hover:from-blue-500 hover:to-indigo-500 dark:from-cyan-600 dark:to-blue-600 dark:hover:from-cyan-500 dark:hover:to-blue-500"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Printer className="size-4" aria-hidden />
                      พิมพ์
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showQuotationModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[360] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-black/70"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowQuotationModal(false)
            }}
          >
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#2a2d3e] dark:bg-[#0d0f17]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
                  <Send className="size-4 text-blue-500 dark:text-cyan-400" aria-hidden />
                  ใบเสนอราคา (Quotation)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowQuotationModal(false)}
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1a1f35]"
                  aria-label="ปิด"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="space-y-3 p-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-200">
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    ลูกค้า: <span className="font-semibold normal-case tracking-normal">{customer.name}</span>
                  </div>
                  <div className="mt-2 max-h-60 overflow-auto rounded-md border border-slate-200 bg-white p-2 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                    {pricedCart.map((l) => (
                      <div key={l.id} className="flex items-center justify-between gap-3 py-1 text-[12px]">
                        <div className="min-w-0">
                          <div className="font-mono text-[10px] font-black text-blue-700 dark:text-cyan-300">{l.code}</div>
                          <div className="truncate font-semibold">{l.name}</div>
                        </div>
                        <div className="font-mono font-black">
                          {(l.price * l.qty - l.discount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowQuotationModal(false)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-200 dark:hover:bg-[#12141c]"
                  >
                    ปิด
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSuspendBill('hold')
                      setShowQuotationModal(false)
                    }}
                    className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-black uppercase tracking-widest text-white hover:from-emerald-400 hover:to-teal-400"
                  >
                    พักบิล
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
