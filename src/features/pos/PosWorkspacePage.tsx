import {
  nextPosBillNumber,
  nextTaxInvoiceNumber,
  peekNextPosBillNumber,
  peekNextTaxInvoiceNumber,
} from '@/features/pos/data/posBillSequence'
import { loadMembers, MEMBERS_CHANGED_EVENT } from '@/features/members/data/membersStore'
import { getProductMasterBySku, masterSearchExtrasForSku } from '@/features/inventory/data/productMasterData'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { mergeInventoryProductsWithLiveStock } from '@/features/pos/data/posLiveStock'
import { INITIAL_VEHICLE_CATALOG } from '@/features/vehicle/data/mockCatalog'
import { normalizeCatalog } from '@/features/vehicle/data/normalizeCatalog'
import { VEHICLE_CATALOG_STORAGE_KEY } from '@/features/vehicle/data/vehicleCatalogStorageKeys'
import { useThemePreference } from '@/features/settings/themePreference'
import { clsx } from 'clsx'
import {
  Activity,
  Banknote,
  CheckCircle2,
  Building2,
  CalendarClock,
  Clock,
  ClipboardList,
  FileText,
  Layers,
  MapPin,
  Printer,
  QrCode,
  Receipt,
  Search,
  Send,
  ShoppingCart,
  Sun,
  Moon,
  Trash2,
  Users,
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
  code: string
  name: string
  unit: string
  price: number
  discount: number
  qty: number
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
  const [showPreBillModal, setShowPreBillModal] = useState(false)
  const [showPickingModal, setShowPickingModal] = useState(false)
  const [showQuotationModal, setShowQuotationModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [checkoutPaymentType, setCheckoutPaymentType] = useState<CheckoutPaymentType>('cash')

  const [cashReceived, setCashReceived] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [mixedCashAmount, setMixedCashAmount] = useState('')
  const [mixedTransferAmount, setMixedTransferAmount] = useState('')
  const [billDiscount, setBillDiscount] = useState('')
  const [applyRounding, setApplyRounding] = useState(false)
  const [suspendedBills, setSuspendedBills] = useState<SuspendedBill[]>([])

  const [memberTick, setMemberTick] = useState(0)
  useEffect(() => {
    const on = () => setMemberTick((n) => n + 1)
    window.addEventListener(MEMBERS_CHANGED_EVENT, on)
    return () => window.removeEventListener(MEMBERS_CHANGED_EVENT, on)
  }, [])

  const mockMembers: Customer[] = useMemo(() => {
    const members = loadMembers()
      .filter((m) => m.status !== 'blacklist')
      .map((m) => ({
        accountCode: m.memberCode,
        name: m.fullName,
        taxId: m.taxId ?? '',
        branch: m.defaultBranch ?? '',
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
  }, [memberTick])

  const walkInCustomer = useMemo(() => mockMembers.find((m) => m.accountCode === 'WK-00001') ?? WALK_IN_CUSTOMER, [mockMembers])

  const [customer, setCustomer] = useState<Customer>(WALK_IN_CUSTOMER)

  const [docInfo, setDocInfo] = useState(() => ({
    posBillNo: peekNextPosBillNumber(),
    taxInvoiceNo: peekNextTaxInvoiceNumber(),
    docDate: new Date().toISOString().split('T')[0],
    employee: '001 สมชาย (Player 1)',
    vatType: 'exclude' as 'exclude' | 'include' | 'none',
    remark: '',
  }))

  const [cart, setCart] = useState<CartLine[]>(() => [
    { id: 1, code: 'BATT-LUG', name: 'หางปลา', unit: 'ชิ้น', price: 35, discount: 0, qty: 1 },
    { id: 2, code: '90915-YZZD2', name: 'ไส้กรองน้ำมันเครื่อง TOYOTA', unit: 'ลูก', price: 250, discount: 10, qty: 2 },
    { id: 3, code: '04465-0K120', name: 'ผ้าเบรกหน้า TOYOTA REVO', unit: 'ชุด', price: 1850, discount: 0, qty: 1 },
  ])

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

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, line) => sum + line.price * line.qty - line.discount, 0)
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
  }, [applyRounding, billDiscount, cart, docInfo.vatType, mode])

  const receivedAmount = useMemo(() => Number.parseFloat(cashReceived || '0') || 0, [cashReceived])
  const changeAmount = useMemo(() => receivedAmount - totals.grandTotal, [receivedAmount, totals.grandTotal])

  const mixedCashNum = useMemo(() => Number.parseFloat(mixedCashAmount || '0') || 0, [mixedCashAmount])
  const mixedTransferNum = useMemo(() => Number.parseFloat(mixedTransferAmount || '0') || 0, [mixedTransferAmount])
  const mixedSum = useMemo(() => mixedCashNum + mixedTransferNum, [mixedCashNum, mixedTransferNum])

  const removeLine = (id: number) => {
    setCart((prev) => prev.filter((l) => l.id !== id))
  }

  const addProductToCart = (p: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.code === p.code)
      if (idx === -1) {
        const nextId = (prev.at(-1)?.id ?? 0) + 1
        return [...prev, { id: nextId, code: p.code, name: p.name, unit: p.unit, price: p.price, discount: 0, qty: 1 }]
      }
      const next = [...prev]
      next[idx] = { ...next[idx], qty: next[idx].qty + 1 }
      return next
    })
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
    setBillDiscount('')
    setApplyRounding(false)
    setCashReceived('')
    setSelectedBank('')
    setMixedCashAmount('')
    setMixedTransferAmount('')
    setCheckoutPaymentType('cash')
  }

  const closeCheckoutModal = () => {
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

  const handleConfirmCheckout = () => {
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

    const issuedDocNo = mode === 'retail' ? nextPosBillNumber() : nextTaxInvoiceNumber()
    const docLabel = mode === 'retail' ? 'เลขที่บิล POS' : 'เลขที่ใบกำกับภาษี'

    window.alert(
      `บันทึกการขายแล้ว\n${docLabel}: ${issuedDocNo}\nวิธีชำระ: ${payLabel}\nยอด: ${gt.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท` +
        (checkoutPaymentType === 'cash'
          ? `\nเงินทอน: ${Math.max(0, receivedAmount - gt).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`
          : ''),
    )

    setDocInfo((prev) => ({
      ...prev,
      posBillNo: peekNextPosBillNumber(),
      taxInvoiceNo: peekNextTaxInvoiceNumber(),
    }))
    closeCheckoutModal()
    clearCurrentBill()
  }

  const handleSuspendBill = () => {
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
    }
    setSuspendedBills((prev) => [next, ...prev])
    setShowSuspendModal(false)
    setShowPreBillModal(false)
    setShowPickingModal(false)
    setShowQuotationModal(false)
    clearCurrentBill()
  }

  const resumeSuspendedBill = (bill: SuspendedBill) => {
    setMode(bill.mode)
    setCustomer(bill.customer)
    setCart(bill.cart)
    setDocInfo(bill.docInfo)
    setBillDiscount(bill.billDiscount || '')
    setApplyRounding(Boolean(bill.applyRounding))
    setSuspendedBills((prev) => prev.filter((b) => b.id !== bill.id))
    setShowSuspendModal(false)
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
              className="relative inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-800 shadow-sm transition hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/35 pos-720p:px-2 pos-720p:py-1 pos-720p:text-[9px]"
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
                    <option value="member">สมาชิก/ลูกหนี้</option>
                  </select>
                  <div className="relative min-w-0 w-full max-w-[14rem] sm:w-56 sm:max-w-none">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-slate-400 dark:text-cyan-500/50" />
                    <input
                      id="pos-member-search"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="ค้นหาลูกค้า..."
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
                    className={clsx(
                      'w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-50 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30',
                      '',
                    )}
                  />
                </div>
                <div className="col-span-6 sm:col-span-4 pos-720p:col-span-4">
                  <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                    เลขผู้เสียภาษี
                  </label>
                  <input
                    value={customer.taxId}
                    onChange={(e) => setCustomer((prev) => ({ ...prev, taxId: e.target.value }))}
                    disabled={mode === 'retail'}
                    className={clsx(
                      'w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-50 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30',
                      mode === 'retail' ? 'cursor-not-allowed opacity-60' : '',
                    )}
                  />
                </div>
                <div className="col-span-6 sm:col-span-2 pos-720p:col-span-2">
                  <label className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                    สาขา
                  </label>
                  <input
                    value={customer.branch}
                    onChange={(e) => setCustomer((prev) => ({ ...prev, branch: e.target.value }))}
                    disabled={mode === 'retail'}
                    className={clsx(
                      'w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-50 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30',
                      mode === 'retail' ? 'cursor-not-allowed opacity-60' : '',
                    )}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 pos-720p:col-span-6">
                  <label className="mb-0.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-600/80 dark:text-cyan-500/70">
                    <MapPin className="size-3" aria-hidden />
                    ที่อยู่
                  </label>
                  <input
                    value={customer.address}
                    onChange={(e) => setCustomer((prev) => ({ ...prev, address: e.target.value }))}
                    disabled={mode === 'retail'}
                    className={clsx(
                      'w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-50 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30',
                      mode === 'retail' ? 'cursor-not-allowed opacity-60' : '',
                    )}
                  />
                </div>
              </div>

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
                <div className="col-span-2 text-right">ราคา/หน่วย</div>
                <div className="col-span-2 text-right">ส่วนลด</div>
                <div className="col-span-2 pr-5 text-right">รวมสุทธิ</div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
                {cart.map((item) => {
                  const total = item.price * item.qty - item.discount
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
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <input
                          value={item.qty}
                          readOnly
                          className="w-10 rounded border border-emerald-200 bg-emerald-50 py-0.5 text-center text-[11px] font-black text-emerald-700 outline-none dark:border-[#0f4d5c] dark:bg-[#0d2127] dark:text-emerald-400"
                        />
                      </div>
                      <div className="col-span-1 text-center font-mono text-[11px] text-slate-500 dark:text-slate-500">
                        {item.unit}
                      </div>
                      <div className="col-span-2 text-right font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {item.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
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
                  onClick={handleSuspendBill}
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
                    if (cart.length) setShowPreBillModal(true)
                  }}
                  disabled={!cart.length}
                  className={clsx(
                    'inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-black uppercase tracking-widest shadow-sm transition pos-720p:gap-1 pos-720p:px-2 pos-720p:py-1.5 pos-720p:text-[9px]',
                    cart.length
                      ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-200 dark:hover:bg-[#1a1f35]'
                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-600',
                  )}
                >
                  <FileText className="size-4 shrink-0 pos-720p:size-3.5" aria-hidden />
                  พรีบิล
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
            className="fixed inset-0 z-[360] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-black/70"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowSuspendModal(false)
            }}
          >
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#2a2d3e] dark:bg-[#0d0f17]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
                  <Clock className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
                  บิลที่พักไว้
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
              <div className="max-h-[70vh] overflow-auto space-y-2 p-2">
                {suspendedBills.length === 0 ? (
                  <div className="p-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">ไม่มีบิลที่พักไว้</div>
                ) : (
                  suspendedBills.map((b) => (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => resumeSuspendedBill(b)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:hover:bg-[#1a1f35]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white dark:bg-emerald-600">
                            {b.mode === 'tax' ? 'TAX' : 'POS'}
                          </span>
                          <span className="truncate text-[12px] font-black text-slate-800 dark:text-slate-100">{b.customer.name}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          <span className="font-mono">{new Date(b.createdAt).toLocaleString('th-TH')}</span>
                          <span className="font-mono">{b.cart.length} รายการ</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resume</div>
                      </div>
                    </button>
                  ))
                )}
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
            className="fixed inset-0 z-[350] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-black/70"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeCheckoutModal()
            }}
          >
            <div
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#2a2d3e] dark:bg-[#0d0f17]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="checkout-title"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                <h3
                  id="checkout-title"
                  className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100"
                >
                  เลือกวิธีชำระเงิน
                </h3>
                <button
                  type="button"
                  onClick={closeCheckoutModal}
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1a1f35]"
                  aria-label="ปิด"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-4 p-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-[#2a2d3e] dark:bg-[#050508]">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-cyan-500/70">
                    ยอดชำระสุทธิ
                  </div>
                  <div className="mt-1 bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text font-mono text-3xl font-black text-transparent dark:from-emerald-400 dark:to-cyan-300">
                    {totals.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setCheckoutPaymentType('cash')}
                    className={clsx(
                      'flex min-h-[3rem] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-black uppercase tracking-widest transition sm:text-[11px]',
                      checkoutPaymentType === 'cash'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-cyan-500 dark:bg-cyan-900/20 dark:text-cyan-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#0d0f17] dark:text-slate-400 dark:hover:bg-[#12141c]',
                    )}
                  >
                    <Banknote className="size-4 shrink-0" aria-hidden />
                    เงินสด
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutPaymentType('transfer')}
                    className={clsx(
                      'flex min-h-[3rem] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-black uppercase tracking-widest transition sm:text-[11px]',
                      checkoutPaymentType === 'transfer'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-cyan-500 dark:bg-cyan-900/20 dark:text-cyan-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#0d0f17] dark:text-slate-400 dark:hover:bg-[#12141c]',
                    )}
                  >
                    <QrCode className="size-4 shrink-0" aria-hidden />
                    โอน/QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutPaymentType('account')}
                    className={clsx(
                      'flex min-h-[3rem] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-black uppercase tracking-widest transition sm:text-[11px]',
                      checkoutPaymentType === 'account'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-cyan-500 dark:bg-cyan-900/20 dark:text-cyan-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#0d0f17] dark:text-slate-400 dark:hover:bg-[#12141c]',
                    )}
                  >
                    <Building2 className="size-4 shrink-0" aria-hidden />
                    ลงบัญชี
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutPaymentType('mixed')}
                    className={clsx(
                      'flex min-h-[3rem] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-black uppercase tracking-widest transition sm:text-[11px]',
                      checkoutPaymentType === 'mixed'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-cyan-500 dark:bg-cyan-900/20 dark:text-cyan-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#0d0f17] dark:text-slate-400 dark:hover:bg-[#12141c]',
                    )}
                  >
                    <Layers className="size-4 shrink-0" aria-hidden />
                    ผสม
                  </button>
                </div>

                {checkoutPaymentType === 'cash' && (
                  <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-cyan-500/70">
                      รับเงินมา
                    </label>
                    <input
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      inputMode="decimal"
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right font-mono text-lg font-black text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                    />
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      <span>เงินทอน</span>
                      <span className={clsx('font-mono', changeAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                        {Math.max(0, changeAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                {checkoutPaymentType === 'transfer' && (
                  <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-cyan-500/70">
                      เลือกบัญชีรับโอน
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                    >
                      <option value="">เลือกบัญชี...</option>
                      <option value="kbank">กสิกรไทย</option>
                      <option value="scb">ไทยพาณิชย์</option>
                      <option value="ktb">กรุงไทย</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowQRModal(true)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 transition hover:bg-slate-100 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-200 dark:hover:bg-[#1a1f35]"
                    >
                      <QrCode className="size-4" aria-hidden />
                      แสดง QR
                    </button>
                  </div>
                )}

                {checkoutPaymentType === 'account' && (
                  <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-[#2a2d3e] dark:bg-[#12141c]">
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
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-cyan-500/70">
                      แบ่งชำระ: เงินสด + โอน ให้รวมเท่ายอดชำระสุทธิ
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-cyan-500/70">
                          ยอดเงินสด
                        </label>
                        <input
                          value={mixedCashAmount}
                          onChange={(e) => setMixedCashAmount(e.target.value)}
                          inputMode="decimal"
                          placeholder="0"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right font-mono text-lg font-black text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-cyan-500/70">
                          ยอดโอน
                        </label>
                        <input
                          value={mixedTransferAmount}
                          onChange={(e) => setMixedTransferAmount(e.target.value)}
                          inputMode="decimal"
                          placeholder="0"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right font-mono text-lg font-black text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-cyan-500/70">
                        บัญชีรับโอน (ส่วนโอน)
                      </label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-cyan-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                      >
                        <option value="">เลือกบัญชี...</option>
                        <option value="kbank">กสิกรไทย</option>
                        <option value="scb">ไทยพาณิชย์</option>
                        <option value="ktb">กรุงไทย</option>
                      </select>
                    </div>
                    <div className="flex justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-black uppercase tracking-widest dark:border-[#2a2d3e] dark:bg-[#050508]">
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
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-400 dark:hover:bg-[#12141c]"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCheckout}
                      disabled={!canSubmitCheckout}
                      className={clsx(
                        'flex-1 rounded-lg py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm transition',
                        canSubmitCheckout
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400'
                          : 'cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-500',
                      )}
                    >
                      ยืนยัน
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

      {showPreBillModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[360] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-black/70"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowPreBillModal(false)
            }}
          >
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#2a2d3e] dark:bg-[#0d0f17]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
                  <FileText className="size-4 text-blue-500 dark:text-cyan-400" aria-hidden />
                  พรีบิล (Pre-bill)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPreBillModal(false)}
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1a1f35]"
                  aria-label="ปิด"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="space-y-3 p-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-200">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    <span>ลูกค้า</span>
                    <span className="font-semibold normal-case tracking-normal">{customer.name}</span>
                  </div>
                  <div className="mt-2 max-h-60 overflow-auto rounded-md border border-slate-200 bg-white p-2 dark:border-[#2a2d3e] dark:bg-[#12141c]">
                    {cart.map((l) => (
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
                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-xs font-black uppercase tracking-widest">ยอดรวม</span>
                    <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text font-mono text-2xl font-black text-transparent dark:from-emerald-400 dark:to-cyan-300">
                      {totals.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSuspendBill}
                    className="flex-1 rounded-lg border border-amber-200 bg-amber-50 py-3 text-xs font-black uppercase tracking-widest text-amber-800 hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/35"
                  >
                    พักบิล
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreBillModal(false)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#050508] dark:text-slate-200 dark:hover:bg-[#12141c]"
                  >
                    ปิด
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreBillModal(false)}
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
                  {cart.map((l) => (
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
                    {cart.map((l) => (
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
                      handleSuspendBill()
                      setShowQuotationModal(false)
                    }}
                    className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-black uppercase tracking-widest text-white hover:from-emerald-400 hover:to-teal-400"
                  >
                    ส่ง/พักบิล
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
