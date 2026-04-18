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
import { BRANCHES } from '@/features/auth/branches'
import { getStoredBranch } from '@/features/auth/authSession'
import { getProductMasterBySku, masterSearchExtrasForSku } from '@/features/inventory/data/productMasterData'
import { loadProductTagsRegistry } from '@/features/inventory/data/productTagsRegistry'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { mergeInventoryProductsWithLiveStock } from '@/features/pos/data/posLiveStock'
import {
  getPosSellConfig,
  pickDefaultPosUnitAndPrice,
  posPriceLevelsForUnit,
  posUnitsWithSellPrice,
} from '@/features/pos/data/posUnitPricing'
import { getStlBoltPairForMaleProduct } from '@/features/promotions/stlBoltPairRegistry'
import { computeStlVolumePromo } from '@/features/promotions/stlVolumePromo'
import { createPosSaleAsync } from '@/features/pos/data/posSalesDb'
import { POS_SALE_RECORDED_EVENT } from '@/features/pos/data/posSalesHistory'
import { localDateYYYYMMDD, parseLocalYYYYMMDD } from '@/features/pos/utils/posLocalDate'
import { INITIAL_VEHICLE_CATALOG } from '@/features/vehicle/data/mockCatalog'
import { normalizeCatalog } from '@/features/vehicle/data/normalizeCatalog'
import { VEHICLE_CATALOG_STORAGE_KEY } from '@/features/vehicle/data/vehicleCatalogStorageKeys'
import { useThemePreference } from '@/features/settings/themePreference'
import { clsx } from 'clsx'
import {
  Activity,
  Banknote,
  BookOpen,
  CheckCircle2,
  Building2,
  CalendarClock,
  Clock,
  ClipboardList,
  MapPin,
  Medal,
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
import { useEffect, useMemo, useState } from 'react'

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
}

type Customer = {
  accountCode: string
  name: string
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
  carBrand?: string
  carModelLabel?: string
  yearLabel?: string
  factoryOem?: string
  genuineNo?: string
}

const WALK_IN_CUSTOMER: Customer = {
  accountCode: 'WK-00001',
  name: 'ลูกค้าทั่วไป (Walk-in)',
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
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'numeric', year: 'numeric' })
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

type VehicleFacetRow = {
  brandName: string
  modelName: string
  engineSize: string
  yearRangeLabel: string
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

export function PosWorkspacePage({ className }: PosWorkspacePageProps) {
  const { theme, setTheme } = useThemePreference()
  const [mode, setMode] = useState<SaleMode>('retail')

  const isDark = theme === 'dark'
  const statusText = useMemo(() => (mode === 'tax' ? 'TAX INVOICE' : 'RETAIL POS'), [mode])

  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [productFilterCarBrand, setProductFilterCarBrand] = useState('ทั้งหมด')
  const [productFilterCarModel, setProductFilterCarModel] = useState('ทั้งหมด')
  const [productFilterYear, setProductFilterYear] = useState('ทั้งหมด')
  const [quickFilterCarBrand, setQuickFilterCarBrand] = useState('ทั้งหมด')
  const [quickFilterCarModel, setQuickFilterCarModel] = useState('ทั้งหมด')
  const [quickFilterEngine, setQuickFilterEngine] = useState('ทั้งหมด')
  const [quickFilterYear, setQuickFilterYear] = useState('ทั้งหมด')
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showAmountNoticeModal, setShowAmountNoticeModal] = useState(false)
  const [showPickingModal, setShowPickingModal] = useState(false)
  const [showQuotationModal, setShowQuotationModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [checkoutPaymentType, setCheckoutPaymentType] = useState<CheckoutPaymentType>('cash')
  const [isSavingCheckout, setIsSavingCheckout] = useState(false)

  const [cashReceived, setCashReceived] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
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

  const mockProducts: Product[] = useMemo(
    () =>
      mergeInventoryProductsWithLiveStock(getPosCatalogProducts()).map((p) => ({
        id: p.id,
        code: p.sku,
        name: p.name,
        unit: p.stockMode === 'kg_roll' ? 'กก.' : p.stockMode === 'meter_roll' ? 'เมตร' : 'ชิ้น',
        price: 0,
        stock: p.stock,
        carBrand: p.carBrand,
        carModelLabel: p.carModelLabel,
        yearLabel: p.yearLabel,
        factoryOem: p.factoryOem,
        genuineNo: p.genuineNo,
      })),
    [],
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
  const vehicleCatalog = useMemo(() => {
    try {
      const raw = localStorage.getItem(VEHICLE_CATALOG_STORAGE_KEY)
      if (!raw) return INITIAL_VEHICLE_CATALOG
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return INITIAL_VEHICLE_CATALOG
      return normalizeCatalog(parsed)
    } catch {
      return INITIAL_VEHICLE_CATALOG
    }
  }, [])

  const vehicleFacetRows = useMemo<VehicleFacetRow[]>(() => {
    const out: VehicleFacetRow[] = []
    for (const cat of vehicleCatalog.categories) {
      const data = vehicleCatalog.byCategory[cat.id]
      if (!data) continue
      for (const brand of data.brands) {
        const models = data.modelsByBrandId[brand.id] ?? []
        for (const model of models) {
          const engines = data.enginesByModelId[model.id] ?? []
          for (const eng of engines) {
            const engineSize = (eng.engine_size ?? '').trim()
            if (!engineSize) continue
            for (const v of eng.variants ?? []) {
              const yearTo = v.yearTo >= 2099 ? 'ปัจจุบัน' : String(v.yearTo)
              out.push({
                brandName: brand.name,
                modelName: model.name,
                engineSize,
                yearRangeLabel: `${v.yearFrom}-${yearTo}`,
              })
            }
          }
        }
      }
    }
    return out
  }, [vehicleCatalog])
  const vehicleVariantIdSet = useMemo(() => {
    const ids = new Set<string>()
    for (const cat of vehicleCatalog.categories) {
      const data = vehicleCatalog.byCategory[cat.id]
      if (!data) continue
      for (const brand of data.brands) {
        const models = data.modelsByBrandId[brand.id] ?? []
        for (const model of models) {
          const engines = data.enginesByModelId[model.id] ?? []
          for (const eng of engines) {
            for (const v of eng.variants ?? []) {
              if (v.id) ids.add(v.id)
            }
          }
        }
      }
    }
    return ids
  }, [vehicleCatalog])

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
            (m.taxId && m.taxId.includes(q)),
        )
      : mockMembers

    return base
  }, [memberSearchQuery, mockMembers, mode])

  const carBrandOptions = useMemo(
    () => [
      'ทั้งหมด',
      ...new Set(
        mockProducts
          .filter((p) => productFilterCarModel === 'ทั้งหมด' || p.carModelLabel === productFilterCarModel)
          .filter((p) => productFilterYear === 'ทั้งหมด' || p.yearLabel === productFilterYear)
          .map((p) => p.carBrand)
          .filter(Boolean) as string[],
      ),
    ],
    [mockProducts, productFilterCarModel, productFilterYear],
  )
  const carModelOptions = useMemo(
    () => [
      'ทั้งหมด',
      ...new Set(
        mockProducts
          .filter((p) => productFilterCarBrand === 'ทั้งหมด' || p.carBrand === productFilterCarBrand)
          .filter((p) => productFilterYear === 'ทั้งหมด' || p.yearLabel === productFilterYear)
          .map((p) => p.carModelLabel)
          .filter(Boolean) as string[],
      ),
    ],
    [mockProducts, productFilterCarBrand, productFilterYear],
  )
  const yearOptions = useMemo(
    () => [
      'ทั้งหมด',
      ...new Set(
        mockProducts
          .filter((p) => productFilterCarBrand === 'ทั้งหมด' || p.carBrand === productFilterCarBrand)
          .filter((p) => productFilterCarModel === 'ทั้งหมด' || p.carModelLabel === productFilterCarModel)
          .map((p) => p.yearLabel)
          .filter(Boolean) as string[],
      ),
    ],
    [mockProducts, productFilterCarBrand, productFilterCarModel],
  )

  const filteredProducts = useMemo(() => {
    const tokens = tokenizeSearch(productSearchQuery)
    return mockProducts
      .filter((p) => productFilterCarBrand === 'ทั้งหมด' || p.carBrand === productFilterCarBrand)
      .filter((p) => productFilterCarModel === 'ทั้งหมด' || p.carModelLabel === productFilterCarModel)
      .filter((p) => productFilterYear === 'ทั้งหมด' || p.yearLabel === productFilterYear)
      .filter((p) => {
        if (!tokens.length) return true
        const hay = normalizeSearchText(
          [
          p.code,
          p.name,
          p.factoryOem ?? '',
          p.genuineNo ?? '',
          p.carBrand ?? '',
          p.carModelLabel ?? '',
          p.yearLabel ?? '',
          masterSearchExtrasForSku(p.code),
        ]
            .join(' '),
        )
        return tokens.every((t) => hay.includes(t))
      })
      .slice(0, 120)
  }, [mockProducts, productSearchQuery, productFilterCarBrand, productFilterCarModel, productFilterYear])

  const quickSuggestProducts = useMemo(() => {
    const tokens = tokenizeSearch(barcodeInput)
    if (!tokens.length) return []
    const textMatched = mockProducts
      .filter((p) => {
        const hay = normalizeSearchText(
          [
          p.code,
          p.name,
          p.factoryOem ?? '',
          p.genuineNo ?? '',
          p.carBrand ?? '',
          p.carModelLabel ?? '',
          p.yearLabel ?? '',
          masterSearchExtrasForSku(p.code),
        ]
            .join(' '),
        )
        return tokens.every((t) => hay.includes(t))
      })
    const filtered = textMatched
      .filter((p) => quickFilterCarBrand === 'ทั้งหมด' || p.carBrand === quickFilterCarBrand)
      .filter((p) => quickFilterCarModel === 'ทั้งหมด' || p.carModelLabel === quickFilterCarModel)
      .filter((p) => {
        if (quickFilterEngine === 'ทั้งหมด') return true
        const rows = vehicleFacetRows.filter(
          (r) =>
            (!p.carBrand || r.brandName === p.carBrand) &&
            (!p.carModelLabel || p.carModelLabel === r.modelName || p.carModelLabel.includes(r.modelName)),
        )
        return rows.some((r) => r.engineSize === quickFilterEngine)
      })
      .filter((p) => {
        if (quickFilterYear === 'ทั้งหมด') return true
        const rows = vehicleFacetRows.filter(
          (r) =>
            (!p.carBrand || r.brandName === p.carBrand) &&
            (!p.carModelLabel || p.carModelLabel === r.modelName || p.carModelLabel.includes(r.modelName)),
        )
        return rows.some((r) => r.yearRangeLabel === quickFilterYear)
      })
    return filtered.slice(0, 8)
  }, [
    barcodeInput,
    mockProducts,
    quickFilterCarBrand,
    quickFilterCarModel,
    quickFilterEngine,
    quickFilterYear,
    vehicleFacetRows,
  ])

  const quickTextMatchedProducts = useMemo(() => {
    const tokens = tokenizeSearch(barcodeInput)
    if (!tokens.length) return []
    return mockProducts.filter((p) => {
      const hay = normalizeSearchText(
        [
          p.code,
          p.name,
          p.factoryOem ?? '',
          p.genuineNo ?? '',
          p.carBrand ?? '',
          p.carModelLabel ?? '',
          p.yearLabel ?? '',
          masterSearchExtrasForSku(p.code),
        ].join(' '),
      )
      return tokens.every((t) => hay.includes(t))
    })
  }, [barcodeInput, mockProducts])

  const hasVehicleFacetForProduct = (p: Product): boolean => {
    const m = getProductMasterBySku(p.code)
    if (!m?.vehicleFitments?.length) return false
    return m.vehicleFitments.some((f) => vehicleVariantIdSet.has(f.engineId))
  }

  const mappedQuickProducts = useMemo(
    () => quickTextMatchedProducts.filter((p) => hasVehicleFacetForProduct(p)),
    [quickTextMatchedProducts, vehicleVariantIdSet],
  )

  const quickCarBrandOptions = useMemo(
    () => [
      'ทั้งหมด',
      ...new Set(
        mappedQuickProducts
          .filter((p) => quickFilterCarModel === 'ทั้งหมด' || p.carModelLabel === quickFilterCarModel)
          .filter((p) => {
            if (quickFilterEngine === 'ทั้งหมด') return true
            const rows = vehicleFacetRows.filter(
              (r) =>
                (!p.carBrand || r.brandName === p.carBrand) &&
                (!p.carModelLabel || p.carModelLabel === r.modelName || p.carModelLabel.includes(r.modelName)),
            )
            return rows.some((r) => r.engineSize === quickFilterEngine)
          })
          .filter((p) => {
            if (quickFilterYear === 'ทั้งหมด') return true
            const rows = vehicleFacetRows.filter(
              (r) =>
                (!p.carBrand || r.brandName === p.carBrand) &&
                (!p.carModelLabel || p.carModelLabel === r.modelName || p.carModelLabel.includes(r.modelName)),
            )
            return rows.some((r) => r.yearRangeLabel === quickFilterYear)
          })
          .map((p) => p.carBrand)
          .filter(Boolean) as string[],
      ),
    ],
    [mappedQuickProducts, quickFilterCarModel, quickFilterEngine, quickFilterYear, vehicleFacetRows],
  )

  const quickCarModelOptions = useMemo(
    () => [
      'ทั้งหมด',
      ...new Set(
        mappedQuickProducts
          .filter((p) => quickFilterCarBrand === 'ทั้งหมด' || p.carBrand === quickFilterCarBrand)
          .filter((p) => {
            if (quickFilterEngine === 'ทั้งหมด') return true
            const rows = vehicleFacetRows.filter(
              (r) =>
                (!p.carBrand || r.brandName === p.carBrand) &&
                (!p.carModelLabel || p.carModelLabel === r.modelName || p.carModelLabel.includes(r.modelName)),
            )
            return rows.some((r) => r.engineSize === quickFilterEngine)
          })
          .filter((p) => {
            if (quickFilterYear === 'ทั้งหมด') return true
            const rows = vehicleFacetRows.filter(
              (r) =>
                (!p.carBrand || r.brandName === p.carBrand) &&
                (!p.carModelLabel || p.carModelLabel === r.modelName || p.carModelLabel.includes(r.modelName)),
            )
            return rows.some((r) => r.yearRangeLabel === quickFilterYear)
          })
          .map((p) => p.carModelLabel)
          .filter(Boolean) as string[],
      ),
    ],
    [mappedQuickProducts, quickFilterCarBrand, quickFilterEngine, quickFilterYear, vehicleFacetRows],
  )

  const quickEngineOptions = useMemo(
    () => [
      'ทั้งหมด',
      ...new Set(
        vehicleFacetRows
          .filter((r) => quickFilterCarBrand === 'ทั้งหมด' || r.brandName === quickFilterCarBrand)
          .filter((r) => quickFilterCarModel === 'ทั้งหมด' || r.modelName === quickFilterCarModel)
          .filter((r) => quickFilterYear === 'ทั้งหมด' || r.yearRangeLabel === quickFilterYear)
          .map((r) => r.engineSize)
          .filter(Boolean),
      ),
    ],
    [vehicleFacetRows, quickFilterCarBrand, quickFilterCarModel, quickFilterYear],
  )

  const quickYearOptions = useMemo(
    () => [
      'ทั้งหมด',
      ...new Set(
        vehicleFacetRows
          .filter((r) => quickFilterCarBrand === 'ทั้งหมด' || r.brandName === quickFilterCarBrand)
          .filter((r) => quickFilterCarModel === 'ทั้งหมด' || r.modelName === quickFilterCarModel)
          .filter((r) => quickFilterEngine === 'ทั้งหมด' || r.engineSize === quickFilterEngine)
          .map((r) => r.yearRangeLabel),
      ),
    ],
    [vehicleFacetRows, quickFilterCarBrand, quickFilterCarModel, quickFilterEngine],
  )

  const showQuickCarFilters = useMemo(() => {
    // แสดงเฉพาะเมื่อผลค้นหาปัจจุบันมีสินค้าที่ผูกรุ่นรถจริง
    const hasMappedVehicle = mappedQuickProducts.length > 0
    if (!hasMappedVehicle) return false
    const hasBrand = quickCarBrandOptions.length > 1
    const hasModel = quickCarModelOptions.length > 1
    const hasEngine = quickEngineOptions.length > 1
    const hasYear = quickYearOptions.length > 1
    return hasBrand || hasModel || hasEngine || hasYear
  }, [
    mappedQuickProducts,
    quickCarBrandOptions,
    quickCarModelOptions,
    quickEngineOptions,
    quickYearOptions,
  ])

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
    if (e.key !== 'Enter') return
    e.preventDefault()
    const code = barcodeInput.trim()
    if (!code) return
    const found =
      mockProducts.find((p) => p.code.toLowerCase() === code.toLowerCase()) ??
      quickSuggestProducts[0]
    if (found) addProductToCart(found)
    setBarcodeInput('')
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

  const bankLabel = (code: string) =>
    code === 'kbank'
      ? 'กสิกรไทย'
      : code === 'scb'
        ? 'ไทยพาณิชย์'
        : code === 'ktb'
          ? 'กรุงไทย'
          : code

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
        `บันทึกการขายแล้ว\n${docLabel}: ${issuedDocNo}\nวิธีชำระ: ${payLabel}\nยอด: ${gt.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท` +
          (checkoutPaymentType === 'cash'
            ? `\nเงินทอน: ${Math.max(0, receivedAmount - gt).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`
            : ''),
      )
      window.dispatchEvent(new CustomEvent(POS_SALE_RECORDED_EVENT))

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
      closeCheckoutModal()
      clearCurrentBill()
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
                      placeholder="สแกนหรือค้นหาลูกค้า..."
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

            </section>

            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-[#2a2d3e] dark:bg-[#12141c]/80">
              <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-100 px-2 py-2 dark:border-[#2a2d3e] dark:bg-[#0d0f17] pos-720p:py-1.5">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-slate-400 dark:text-cyan-500/60" />
                  <input
                    id="pos-product-search"
                    value={barcodeInput}
                    onChange={(e) => {
                      setBarcodeInput(e.target.value)
                    }}
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder="สแกนบาร์โค้ด หรือ รหัสสินค้า..."
                    className="w-full rounded border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-50 dark:placeholder:text-slate-600 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                  />
                  {(tokenizeSearch(barcodeInput).length > 0 || quickSuggestProducts.length > 0) && (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 space-y-1 rounded border border-slate-200 bg-white p-2 shadow-lg dark:border-[#2a2d3e] dark:bg-[#12141c]">
                      {showQuickCarFilters ? (
                        <>
                          <div className="grid grid-cols-2 gap-1 lg:grid-cols-4">
                            <label className="space-y-0.5">
                              <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">ยี่ห้อ</span>
                              <select
                                value={quickFilterCarBrand}
                                onChange={(e) => setQuickFilterCarBrand(e.target.value)}
                                className="w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] dark:border-[#2a2d3e] dark:bg-[#050508]"
                              >
                                {quickCarBrandOptions.map((opt) => (
                                  <option key={`q-brand-${opt}`} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="space-y-0.5">
                              <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">รุ่น</span>
                              <select
                                value={quickFilterCarModel}
                                onChange={(e) => setQuickFilterCarModel(e.target.value)}
                                className="w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] dark:border-[#2a2d3e] dark:bg-[#050508]"
                              >
                                {quickCarModelOptions.map((opt) => (
                                  <option key={`q-model-${opt}`} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="space-y-0.5">
                              <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">เครื่อง</span>
                              <select
                                value={quickFilterEngine}
                                onChange={(e) => setQuickFilterEngine(e.target.value)}
                                className="w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] dark:border-[#2a2d3e] dark:bg-[#050508]"
                              >
                                {quickEngineOptions.map((opt) => (
                                  <option key={`q-engine-${opt}`} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="space-y-0.5">
                              <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">ปี</span>
                              <select
                                value={quickFilterYear}
                                onChange={(e) => setQuickFilterYear(e.target.value)}
                                className="w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] dark:border-[#2a2d3e] dark:bg-[#050508]"
                              >
                                {quickYearOptions.map((opt) => (
                                  <option key={`q-year-${opt}`} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            ฟิลเตอร์ช่วยถามลูกค้าต่อ: ยี่ห้อ / รุ่น / เครื่อง / ปี
                          </p>
                        </>
                      ) : null}
                      {quickSuggestProducts.length > 0 ? (
                        <div className="max-h-56 overflow-auto rounded border border-slate-200 dark:border-[#2a2d3e]">
                          {quickSuggestProducts.map((p) => (
                            <button
                              key={`quick-${p.id}`}
                              type="button"
                              onClick={() => {
                                addProductToCart(p)
                                setBarcodeInput('')
                              }}
                              className="grid w-full grid-cols-12 items-center gap-2 border-b border-slate-100 px-2 py-1.5 text-left hover:bg-slate-50 dark:border-[#1c1f2e] dark:hover:bg-[#1a1f35]"
                            >
                              <span className="col-span-3 font-mono text-[10px] font-black text-blue-700 dark:text-cyan-300">{p.code}</span>
                              <span className="col-span-7 truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">{p.name}</span>
                              <span className="col-span-2 text-right font-mono text-[10px] text-slate-500 dark:text-slate-400">{p.stock}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded border border-slate-200 px-2 py-1 text-[10px] text-slate-500 dark:border-[#2a2d3e] dark:text-slate-400">
                          ไม่พบรายการที่ตรงเงื่อนไข
                        </p>
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
                    placeholder="ค้นหาชื่อ/รหัส/เลขผู้เสียภาษี..."
                    autoFocus
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-cyan-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                  />
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <label className="space-y-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    ยี่ห้อ
                    <select
                      value={productFilterCarBrand}
                      onChange={(e) => setProductFilterCarBrand(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold normal-case tracking-normal text-slate-800 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-cyan-100"
                    >
                      {carBrandOptions.map((opt) => (
                        <option key={`brand-${opt}`} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    รุ่นรถ
                    <select
                      value={productFilterCarModel}
                      onChange={(e) => setProductFilterCarModel(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold normal-case tracking-normal text-slate-800 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-cyan-100"
                    >
                      {carModelOptions.map((opt) => (
                        <option key={`model-${opt}`} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    ปี/เครื่อง
                    <select
                      value={productFilterYear}
                      onChange={(e) => setProductFilterYear(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold normal-case tracking-normal text-slate-800 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-cyan-100"
                    >
                      {yearOptions.map((opt) => (
                        <option key={`year-${opt}`} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-auto p-2">
                <div className="grid grid-cols-12 gap-2 border-b border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:border-[#2a2d3e] dark:text-slate-400">
                  <div className="col-span-3">Account</div>
                  <div className="col-span-7">Name</div>
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
                    <div className="col-span-7 truncate text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                      {m.name}
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
            className="fixed inset-0 z-[340] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-black/70"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowProductModal(false)
            }}
          >
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#2a2d3e] dark:bg-[#0d0f17]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
                  <ShoppingCart className="size-4 text-blue-500 dark:text-cyan-400" aria-hidden />
                  เลือกสินค้า
                </h3>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
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
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="ค้นหาสินค้า (รหัส/ชื่อ)..."
                    autoFocus
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-cyan-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              <div className="max-h-[70vh] overflow-auto p-2">
                <div className="grid grid-cols-12 gap-2 border-b border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:border-[#2a2d3e] dark:text-slate-400">
                  <div className="col-span-3">Code</div>
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-1 text-right">Stock</div>
                  <div className="col-span-1 text-center">Add</div>
                </div>
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-12 items-center gap-2 border-b border-slate-100 px-3 py-2 text-sm hover:bg-slate-50 dark:border-[#1c1f2e] dark:hover:bg-[#1a1f35]"
                  >
                    <div className="col-span-3 font-mono text-[11px] font-black text-blue-700 dark:text-cyan-300">
                      {p.code}
                    </div>
                    <div className="col-span-5 truncate text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                      {p.name}
                    </div>
                    <div className="col-span-2 text-right font-mono text-[12px] font-black text-slate-700 dark:text-slate-200">
                      {p.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="col-span-1 text-right font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {p.stock}
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => addProductToCart(p)}
                        className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/35"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
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
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-[#1a1f2e] dark:text-cyan-100"
                      >
                        <option value="">เลือกบัญชี...</option>
                        <option value="kbank">กสิกรไทย</option>
                        <option value="scb">ไทยพาณิชย์</option>
                        <option value="ktb">กรุงไทย</option>
                      </select>
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
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-[#1a1f2e] dark:text-cyan-100"
                        >
                          <option value="">เลือกบัญชี...</option>
                          <option value="kbank">กสิกรไทย</option>
                          <option value="scb">ไทยพาณิชย์</option>
                          <option value="ktb">กรุงไทย</option>
                        </select>
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
              <div className="space-y-3 p-5 text-center">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#2a2d3e] dark:bg-[#050508]">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    ยอดโอน
                  </div>
                  <div className="mt-1 bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text font-mono text-2xl font-black text-transparent dark:from-emerald-400 dark:to-cyan-300">
                    {totals.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-3 flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-slate-400 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-500">
                    QR PLACEHOLDER
                  </div>
                  <div className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    บัญชี: {selectedBank || '-'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQRModal(false)}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-black uppercase tracking-widest text-white hover:from-blue-500 hover:to-indigo-500 dark:from-cyan-600 dark:to-blue-600 dark:hover:from-cyan-500 dark:hover:to-blue-500"
                >
                  ปิด
                </button>
              </div>
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
