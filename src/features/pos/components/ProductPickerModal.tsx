import * as React from 'react'
import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { Car, Check, CheckSquare, ChevronDown, ChevronRight, ChevronUp, Eye, EyeOff, LayoutGrid, List, MapPin, Minus, Plus, Ruler, Search, ShoppingCart, X } from 'lucide-react'
import {
  collectInventoryCarFilterOptions,
  getProductMasterBySku,
  productMatchesInventoryCarFilters,
  type ProductMasterDetail,
} from '@/features/inventory/data/productMasterData'
import {
  INVENTORY_CATEGORIES_UPDATED_EVENT,
  loadCategoryTree,
  type MainCategory,
} from '@/features/inventory/data/inventoryCategories'
import {
  dimensionScore,
  dimensionStrictMatch,
  parseMeasureMm,
  type MeasureInput,
} from '@/features/inventory/utils/dimensionSearch'
import {
  getPosSellConfig,
  pickDefaultPosUnitAndPrice,
  posPriceLevelsForUnit,
  posUnitsWithSellPrice,
} from '@/features/pos/data/posUnitPricing'
import { loadRecentSales, POS_SALE_RECORDED_EVENT } from '@/features/pos/data/posSalesHistory'
import { loadPosSalesHistoryByMemberAsync } from '@/features/pos/data/posSalesDb'
import { MEMBER_PRICE_TIER_LABELS } from '@/features/members/data/memberTypes'
import { getStoredBranch } from '@/features/auth/authSession'
import {
  addFilterPreset,
  deleteFilterPreset,
  FILTER_PRESETS_CHANGED_EVENT,
  generatePresetName,
  loadFilterPresets,
  type PickerFilterPreset,
} from '@/features/pos/data/posPickerPresets'
import { ProductImage } from '@/features/inventory/components/ProductImage'
import { SearchableFilterSelect } from '@/features/inventory/components/SearchableFilterSelect'
import {
  fitmentYearLabel,
  formatDims,
  getFitmentEngineName,
  normalizeSearchText,
  tokenizeSearch,
  type ProductDims,
} from '@/features/pos/utils/posSearchHelpers'

export type PickerProduct = {
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
  dimensions?: ProductDims
  bundleComponents?: unknown[]
}

export type AddToCartOptions = {
  qty?: number
  unitIndex?: number
  priceLevelIndex?: number
}

type ProductPickerModalProps = {
  open: boolean
  onClose: () => void
  products: PickerProduct[]
  productHaystackMap: Map<string, string>
  /** ใช้คำนวณ default tier */
  defaultPriceLevelIndex: number
  isDark: boolean
  onAddToCart: (product: PickerProduct, opts?: AddToCartOptions) => void
  onShowProductImage: (info: { code: string; name: string; price: number; unit: string }) => void
  /** Clear the customer-facing display spotlight — fired when the cashier closes the
   *  picture (lightbox close, picker close). Optional for back-compat. */
  onClearProductImage?: () => void
  /** ลูกค้าปัจจุบัน — undefined = walk-in (จะไม่แสดง tab "ลูกค้าคนนี้") */
  customerAccountCode?: string
  /** ใช้แสดงในแถบ tab ลูกค้า */
  customerName?: string
}

type PickerTab = 'all' | 'today' | 'customer'

const FILTER_ALL = 'ทั้งหมด'

/** ระบบใช้ 4 tier เท่านั้น (ปลีก/อู่/ร้านค้า/VIP) — tier index 4+ คือ legacy data ไม่แสดง */
const MAX_TIERS = 4

/** Map price level index → label จริง (ปลีก/อู่/ร้านค้า/VIP) */
function tierLabel(index: number, fallback?: string): string {
  const key = `tier${index + 1}` as keyof typeof MEMBER_PRICE_TIER_LABELS
  return MEMBER_PRICE_TIER_LABELS[key] ?? fallback ?? `ราคา ${index + 1}`
}

/** Emoji icon ตามชื่อหมวดสินค้า — ใช้ใน category chips */
function categoryEmoji(category: string): string {
  const c = category.toLowerCase()
  if (c.includes('เครื่องยนต์') || c.includes('engine')) return '🔧'
  if (c.includes('น็อต') || c.includes('นัต') || c.includes('สกรู') || c.includes('bolt')) return '🔩'
  if (c.includes('น้ำมัน') || c.includes('oil')) return '🛢️'
  if (c.includes('ของเหลว') || c.includes('สารหล่อ') || c.includes('coolant')) return '💧'
  if (c.includes('เบรก') || c.includes('brake')) return '🛞'
  if (c.includes('แบตเตอรี่') || c.includes('battery')) return '🔋'
  if (c.includes('ไฟ') || c.includes('light') || c.includes('lamp')) return '💡'
  if (c.includes('กรอง') || c.includes('filter')) return '🌀'
  if (c.includes('ยาง') || c.includes('tire')) return '⚫'
  if (c.includes('ช่วงล่าง') || c.includes('suspension')) return '🚗'
  if (c.includes('สาย') || c.includes('belt') || c.includes('hose')) return '➰'
  return '📦'
}

export function ProductPickerModal({
  open,
  onClose,
  products,
  productHaystackMap,
  defaultPriceLevelIndex,
  isDark,
  onAddToCart,
  onShowProductImage,
  onClearProductImage,
  customerAccountCode,
}: ProductPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [subCategory, setSubCategory] = useState<string | null>(null)
  const [subSubCategory, setSubSubCategory] = useState<string | null>(null)
  const [categoryTree, setCategoryTree] = useState<MainCategory[]>(() => loadCategoryTree())
  const [expandedMain, setExpandedMain] = useState<Set<string>>(() => new Set())
  const [expandedSub, setExpandedSub] = useState<Set<string>>(() => new Set())
  const [make, setMake] = useState(FILTER_ALL)
  const [model, setModel] = useState(FILTER_ALL)
  const [engine, setEngine] = useState(FILTER_ALL)
  const [drive, setDrive] = useState(FILTER_ALL)
  const [year, setYear] = useState(FILTER_ALL)
  const [partBrand, setPartBrand] = useState(FILTER_ALL)
  const [hp, setHp] = useState(FILTER_ALL)
  const [euro, setEuro] = useState(FILTER_ALL)
  const [trim, setTrim] = useState(FILTER_ALL)
  /** Phase 5: chassis-code search — typed by mechanic (e.g., "FM2P", "JZS155") */
  const [chassisCodeQuery, setChassisCodeQuery] = useState('')
  /** Dimension search — A (inner) / B (outer) / C (height) in mm */
  const [measA, setMeasA] = useState('')
  const [measB, setMeasB] = useState('')
  const [measC, setMeasC] = useState('')
  const [measTol, setMeasTol] = useState(3)
  const [measActive, setMeasActive] = useState(false)
  const [measPanelOpen, setMeasPanelOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<PickerProduct | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [tab, setTab] = useState<PickerTab>('all')
  const [todaySkuMap, setTodaySkuMap] = useState<Map<string, number>>(() => new Map())
  const [customerSkuMap, setCustomerSkuMap] = useState<Map<string, number>>(() => new Map())
  const [customerLoading, setCustomerLoading] = useState(false)
  /** Phase 4A — multi-select bulk add */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  /** Visual feedback flash (Round 4) — id ของ product ที่เพิ่ง quick-add */
  const [flashedId, setFlashedId] = useState<string | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Phase 3C — dismiss banner รถลูกค้า */
  const [vehicleHintDismissed, setVehicleHintDismissed] = useState(false)
  /** Phase 4D — saved filter presets */
  const [presets, setPresets] = useState<PickerFilterPreset[]>(() => loadFilterPresets())
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const listContainerRef = useRef<HTMLDivElement | null>(null)

  // เลือก unit/tier/qty ใน detail panel
  const [chosenUnitIndex, setChosenUnitIndex] = useState<number>(0)
  const [chosenTierIndex, setChosenTierIndex] = useState<number>(0)
  const [chosenQty, setChosenQty] = useState<string>('1')

  const deferredSearchQuery = useDeferredValue(searchQuery)

  const resetFilters = () => {
    setMake(FILTER_ALL)
    setModel(FILTER_ALL)
    setEngine(FILTER_ALL)
    setDrive(FILTER_ALL)
    setYear(FILTER_ALL)
    setPartBrand(FILTER_ALL)
    setHp(FILTER_ALL)
    setEuro(FILTER_ALL)
    setTrim(FILTER_ALL)
    setChassisCodeQuery('')
  }

  // Reset state เมื่อปิด modal
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setCategory(null)
      setSubCategory(null)
      setSubSubCategory(null)
      setExpandedMain(new Set())
      setExpandedSub(new Set())
      resetFilters()
      setSelectedProduct(null)
      setTab('all')
      setChosenQty('1')
      setSelectedIds(new Set())
      setVehicleHintDismissed(false)
      setMeasA('')
      setMeasB('')
      setMeasC('')
      setMeasActive(false)
      setMeasPanelOpen(false)
    }
  }, [open])

  // Refresh categoryTree if it gets edited elsewhere while the picker is open
  useEffect(() => {
    if (!open) return
    setCategoryTree(loadCategoryTree())
    const onUpdate = () => setCategoryTree(loadCategoryTree())
    window.addEventListener(INVENTORY_CATEGORIES_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(INVENTORY_CATEGORIES_UPDATED_EVENT, onUpdate)
  }, [open])

  const toggleMainExpand = (id: string) => {
    setExpandedMain((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleSubExpand = (mainId: string, subId: string) => {
    const key = `${mainId}::${subId}`
    setExpandedSub((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ลูกค้าเปลี่ยน → reset dismiss
  useEffect(() => {
    setVehicleHintDismissed(false)
  }, [customerAccountCode])

  // Cleanup flash timer on unmount
  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    }
  }, [])

  // Listen for preset changes (in case other modals/code modify them)
  useEffect(() => {
    if (!open) return
    const refresh = () => setPresets(loadFilterPresets())
    window.addEventListener(FILTER_PRESETS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(FILTER_PRESETS_CHANGED_EVENT, refresh)
  }, [open])

  // ถ้าลูกค้าเปลี่ยน หรือ tab "customer" หาย → fallback ไป all
  useEffect(() => {
    if (tab === 'customer' && !customerAccountCode) setTab('all')
  }, [tab, customerAccountCode])

  // โหลด "ขายบ่อยวันนี้" (Phase 3A) — sync จาก localStorage
  useEffect(() => {
    if (!open || tab !== 'today') return
    const refresh = () => {
      const today = new Date()
      const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      const todayKey = ymd(today)
      const sales = loadRecentSales().filter((s) => {
        if (s.voidedAt) return false
        const d = new Date(s.at)
        return ymd(d) === todayKey
      })
      const m = new Map<string, number>()
      for (const s of sales) {
        if (!s.lines?.length) continue
        for (const line of s.lines) {
          const key = (line.sku || line.productId || '').trim()
          if (!key) continue
          m.set(key, (m.get(key) ?? 0) + (line.qty || 0))
        }
      }
      setTodaySkuMap(m)
    }
    refresh()
    const onSale = () => refresh()
    window.addEventListener(POS_SALE_RECORDED_EVENT, onSale)
    return () => window.removeEventListener(POS_SALE_RECORDED_EVENT, onSale)
  }, [open, tab])

  // โหลด "ลูกค้าคนนี้" (Phase 3B + 3C) — async จาก DB; โหลดทันทีเมื่อเปิด modal + มีลูกค้า
  // (เพื่อให้ Phase 3C banner ใช้ข้อมูลได้โดยไม่ต้องเปิด tab "customer" ก่อน)
  useEffect(() => {
    if (!open || !customerAccountCode) return
    let cancel = false
    setCustomerLoading(true)
    loadPosSalesHistoryByMemberAsync(customerAccountCode, 30)
      .then((rows) => {
        if (cancel) return
        const m = new Map<string, number>()
        for (const r of rows) {
          if (r.voidedAt) continue
          for (const line of r.lines ?? []) {
            const key = (line.sku || line.productId || '').trim()
            if (!key) continue
            m.set(key, (m.get(key) ?? 0) + (line.qty || 0))
          }
        }
        setCustomerSkuMap(m)
      })
      .catch(() => {
        if (!cancel) setCustomerSkuMap(new Map())
      })
      .finally(() => {
        if (!cancel) setCustomerLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [open, customerAccountCode])

  const masterProducts = useMemo<ProductMasterDetail[]>(() => {
    // Scope filter options to:
    //   1) currently-selected category / sub / sub-sub (so picking «เบรก / ผ้าเบรก»
    //      only shows brands with brake pads)
    //   2) AND active search-bar query (so typing "Vios" narrows make/model/year to the result set)
    const tokens = tokenizeSearch(deferredSearchQuery)
    const hasText = tokens.length > 0
    const list: ProductMasterDetail[] = []
    const seen = new Set<string>()
    for (const p of products) {
      if (category && p.category !== category) continue
      if (hasText) {
        const hay = productHaystackMap.get(p.code) ?? ''
        if (!tokens.every((t) => hay.includes(t))) continue
      }
      if (seen.has(p.code)) continue
      seen.add(p.code)
      const master = getProductMasterBySku(p.code)
      if (!master) continue
      if (subCategory && (master.subCategory ?? '') !== subCategory) continue
      if (subSubCategory && (master.subSubCategory ?? '') !== subSubCategory) continue
      list.push(master)
    }
    return list
  }, [products, productHaystackMap, category, subCategory, subSubCategory, deferredSearchQuery])

  const carFilterOptions = useMemo(() => {
    const base = collectInventoryCarFilterOptions(masterProducts, {
      carBrand: make,
      carModel: model,
      engineLabel: engine,
      driveType: drive,
      filterAll: FILTER_ALL,
    })
    // บาง product ไม่มี master ที่บันทึก fitments — เติม brand/model/year จาก field
    // ของ PickerProduct เองเพื่อให้ filter options ครอบคลุมทุกอย่างที่ปรากฎใน list
    const brands = new Set(base.carBrands)
    const models = new Set(base.models)
    const years = new Set(base.years)
    for (const p of products) {
      if (category && p.category !== category) continue
      const hasMaster = getProductMasterBySku(p.code) != null
      if (hasMaster) continue
      if (p.carBrand && p.carBrand !== '—') brands.add(p.carBrand)
      if (p.carModelLabel && p.carModelLabel !== '—' && (make === FILTER_ALL || p.carBrand === make)) {
        models.add(p.carModelLabel)
      }
      if (
        p.yearLabel
        && p.yearLabel !== '—'
        && (make === FILTER_ALL || p.carBrand === make)
        && (model === FILTER_ALL || p.carModelLabel === model)
      ) {
        years.add(p.yearLabel)
      }
    }
    return {
      ...base,
      carBrands: [...brands].sort((a, b) => a.localeCompare(b, 'th')),
      models: [...models].sort((a, b) => a.localeCompare(b, 'th')),
      years: [...years].sort((a, b) => a.localeCompare(b, 'th')),
    }
  }, [masterProducts, products, category, make, model, engine, drive])

  const makeOptions = useMemo(() => carFilterOptions.carBrands, [carFilterOptions])
  const modelOptions = useMemo(() => carFilterOptions.models, [carFilterOptions])
  const engineOptions = useMemo(() => carFilterOptions.engines, [carFilterOptions])
  const driveOptions = useMemo(() => carFilterOptions.driveTypes, [carFilterOptions])
  const yearOptions = useMemo(() => carFilterOptions.years, [carFilterOptions])
  const hpOptions = useMemo(() => {
    const set = new Set<string>()
    for (const p of masterProducts) {
      for (const f of p.vehicleFitments ?? []) {
        if (f?.hp != null && f.hp > 0) set.add(String(f.hp))
      }
    }
    return [...set].sort((a, b) => Number(a) - Number(b))
  }, [masterProducts])
  const euroOptions = useMemo(() => {
    const set = new Set<string>()
    for (const p of masterProducts) {
      for (const f of p.vehicleFitments ?? []) {
        if (f?.euroStandard?.trim()) set.add(f.euroStandard.trim())
      }
    }
    return [...set].sort()
  }, [masterProducts])
  const trimOptions = useMemo(() => {
    const set = new Set<string>()
    for (const p of masterProducts) {
      for (const f of p.vehicleFitments ?? []) {
        if (f?.trim?.trim()) set.add(f.trim.trim())
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'th'))
  }, [masterProducts])
  const partBrandOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const p of products) if (p.brand) seen.add(p.brand)
    return [...seen].sort((a, b) => a.localeCompare(b, 'th'))
  }, [products])

  /** Per-level product counts for the category sidebar.
   *  Counts ignore the currently-selected category/sub so users can see how many
   *  parts exist in each branch of the tree at a glance. */
  const navCounts = useMemo(() => {
    const main = new Map<string, number>()
    const sub = new Map<string, number>() // `${main}::${sub}` → count
    const subSub = new Map<string, number>() // `${main}::${sub}::${subSub}` → count
    const seen = new Set<string>()
    let total = 0
    for (const p of products) {
      if (seen.has(p.code)) continue
      seen.add(p.code)
      total += 1
      const m = (p.category ?? '').trim()
      if (!m || m === '—') continue
      main.set(m, (main.get(m) ?? 0) + 1)
      const master = getProductMasterBySku(p.code)
      const s = (master?.subCategory ?? '').trim()
      if (s) {
        sub.set(`${m}::${s}`, (sub.get(`${m}::${s}`) ?? 0) + 1)
        const ss = (master?.subSubCategory ?? '').trim()
        if (ss) {
          subSub.set(`${m}::${s}::${ss}`, (subSub.get(`${m}::${s}::${ss}`) ?? 0) + 1)
        }
      }
    }
    return { main, sub, subSub, total }
  }, [products])

  const activeVehicleFilterCount =
    (make !== FILTER_ALL ? 1 : 0)
    + (model !== FILTER_ALL ? 1 : 0)
    + (engine !== FILTER_ALL ? 1 : 0)
    + (drive !== FILTER_ALL ? 1 : 0)
    + (year !== FILTER_ALL ? 1 : 0)
    + (partBrand !== FILTER_ALL ? 1 : 0)
    + (hp !== FILTER_ALL ? 1 : 0)
    + (euro !== FILTER_ALL ? 1 : 0)
    + (trim !== FILTER_ALL ? 1 : 0)
    + (chassisCodeQuery.trim().length > 0 ? 1 : 0)

  /** Phase 3C — infer รถที่ลูกค้ามักซื้ออะไหล่ จาก customerSkuMap */
  const customerVehicleHint = useMemo(() => {
    if (!customerAccountCode) return null
    if (customerSkuMap.size === 0) return null
    const counts = new Map<string, { brand: string; model: string; weight: number }>()
    for (const [sku, qty] of customerSkuMap) {
      const product = products.find((p) => p.code === sku)
      if (!product) continue
      const master = getProductMasterBySku(sku)
      const fits = master?.vehicleFitments ?? []
      if (!fits.length) continue
      // นับครั้งเดียวต่อ fitment-key per product (กัน double-count รุ่นเดียวกันหลาย fitment row)
      const seen = new Set<string>()
      for (const f of fits) {
        if (!f.brandName || !f.modelName) continue
        const key = `${f.brandName}|${f.modelName}`
        if (seen.has(key)) continue
        seen.add(key)
        const cur = counts.get(key) ?? { brand: f.brandName, model: f.modelName, weight: 0 }
        cur.weight += qty
        counts.set(key, cur)
      }
    }
    if (counts.size === 0) return null
    const top = [...counts.values()].sort((a, b) => b.weight - a.weight)[0]
    return top
  }, [customerAccountCode, customerSkuMap, products])

  const showVehicleHint =
    customerVehicleHint != null
    && !vehicleHintDismissed
    && make === FILTER_ALL
    && model === FILTER_ALL

  const applyVehicleHint = () => {
    if (!customerVehicleHint) return
    setMake(customerVehicleHint.brand)
    setModel(customerVehicleHint.model)
  }

  /** Phase 4D — บันทึก current filter combo เป็น preset */
  const handleSavePreset = () => {
    if (activeVehicleFilterCount === 0) return
    const draft = { make, model, engine, drive, year, partBrand }
    const defaultName = generatePresetName(draft)
    const userName = window.prompt('ตั้งชื่อ preset', defaultName)
    if (userName == null) return
    const name = userName.trim() || defaultName
    addFilterPreset({ ...draft, name })
    setPresets(loadFilterPresets())
  }

  const applyPreset = (p: PickerFilterPreset) => {
    setMake(p.make)
    setModel(p.model)
    setEngine(p.engine)
    setDrive(p.drive)
    setYear(p.year)
    setPartBrand(p.partBrand)
  }

  const handleDeletePreset = (id: string) => {
    if (!window.confirm('ลบ preset นี้?')) return
    deleteFilterPreset(id)
    setPresets(loadFilterPresets())
  }

  const filteredProducts = useMemo(() => {
    // Tab-based filtering layer (Phase 3A+3B) — applied AFTER search/category/vehicle filter
    const applyTabFilter = (list: PickerProduct[]): PickerProduct[] => {
      if (tab === 'all') return list
      const skuMap = tab === 'today' ? todaySkuMap : customerSkuMap
      if (skuMap.size === 0) return []
      return list
        .map((p) => [p, skuMap.get(p.code) ?? 0] as const)
        .filter(([, q]) => q > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([p]) => p)
    }

    const tokens = tokenizeSearch(deferredSearchQuery)
    const hasMake = make !== FILTER_ALL
    const hasModel = model !== FILTER_ALL
    const hasEngine = engine !== FILTER_ALL
    const hasDrive = drive !== FILTER_ALL
    const hasYear = year !== FILTER_ALL
    const hasPartBrand = partBrand !== FILTER_ALL
    const hasText = tokens.length > 0
    const chassisQ = chassisCodeQuery.trim().toUpperCase()
    const hasChassisFilter = chassisQ.length > 0
    const hasHp = hp !== FILTER_ALL
    const hasEuro = euro !== FILTER_ALL
    const hasTrim = trim !== FILTER_ALL
    const hasAnyVehicleFilter = hasMake || hasModel || hasEngine || hasDrive || hasYear || hasHp || hasEuro || hasTrim
    if (!category && !subCategory && !subSubCategory && !hasAnyVehicleFilter && !hasPartBrand && !hasText && !hasChassisFilter) {
      // ใน tab !== 'all' ให้รวมทั้งหมดก่อน filter ตาม tab — กันเสียโอกาสเพราะ slice 150
      return tab === 'all' ? products.slice(0, 150) : applyTabFilter(products)
    }

    const passFilters = (p: PickerProduct) => {
      if (category && p.category !== category) return false
      if (subCategory || subSubCategory) {
        const master = getProductMasterBySku(p.code)
        if (!master) return false
        if (subCategory && (master.subCategory ?? '') !== subCategory) return false
        if (subSubCategory && (master.subSubCategory ?? '') !== subSubCategory) return false
      }
      if (hasPartBrand && p.brand !== partBrand) return false
      if (hasAnyVehicleFilter) {
        const master = getProductMasterBySku(p.code)
        if (master) {
          if (!productMatchesInventoryCarFilters(
            master,
            {
              brand: FILTER_ALL,
              carBrand: make,
              carModel: model,
              year,
              engineLabel: engine,
              driveType: drive,
            },
            FILTER_ALL,
          )) return false
        } else {
          // ไม่มี master — เทียบกับ field บน PickerProduct โดยตรง (engine/drive ไม่มี → ถ้า user ตั้งจะตัดทิ้ง)
          if (make !== FILTER_ALL && p.carBrand !== make) return false
          if (model !== FILTER_ALL && p.carModelLabel !== model) return false
          if (year !== FILTER_ALL && p.yearLabel !== year) return false
          if (engine !== FILTER_ALL) return false
          if (drive !== FILTER_ALL) return false
        }
      }
      if (hasHp || hasEuro || hasTrim) {
        const master = getProductMasterBySku(p.code)
        const fits = master?.vehicleFitments ?? []
        const matches = fits.some((f) => {
          if (hasHp && String(f.hp ?? '') !== hp) return false
          if (hasEuro && (f.euroStandard ?? '') !== euro) return false
          if (hasTrim && (f.trim ?? '') !== trim) return false
          return true
        })
        if (!matches) return false
      }
      if (hasChassisFilter) {
        const master = getProductMasterBySku(p.code)
        const fits = master?.vehicleFitments ?? []
        const matches = fits.some((f) => {
          const codes = [f.chassisCode, f.engineCode, f.engineText].filter(Boolean) as string[]
          return codes.some((c) => c.toUpperCase().includes(chassisQ))
        })
        if (!matches) return false
      }
      return true
    }
    if (!hasText) {
      const list = products.filter(passFilters)
      return tab === 'all' ? list.slice(0, 200) : applyTabFilter(list)
    }

    const getHay = (p: PickerProduct): string => productHaystackMap.get(p.code) ?? ''
    const q = tokens.join('')

    const scoreProduct = (p: PickerProduct): number => {
      const hay = getHay(p)
      const normSku = normalizeSearchText(p.code)
      const normOem = normalizeSearchText(p.factoryOem ?? '')
      const normName = normalizeSearchText(p.name)
      if (normSku === q || normOem === q) return 100
      if (normSku.startsWith(q) || normOem.startsWith(q)) return 80
      if (tokens.every((t) => normSku.includes(t)) || tokens.every((t) => normOem.includes(t))) return 60
      if (tokens.every((t) => normName.includes(t))) return 40
      if (tokens.every((t) => hay.includes(t))) return 20
      return (tokens.filter((t) => hay.includes(t)).length / tokens.length) * 10
    }

    const andMatches = products.filter((p) => passFilters(p) && tokens.every((t) => getHay(p).includes(t)))
    const candidates = andMatches.length > 0
      ? andMatches
      : tokens.length > 1
        ? products.filter((p) => passFilters(p) && tokens.some((t) => getHay(p).includes(t)))
        : []

    const ranked = candidates
      .map((p) => [p, scoreProduct(p)] as const)
      .sort((a, b) => b[1] - a[1])
      .map(([p]) => p)
    return tab === 'all' ? ranked.slice(0, 200) : applyTabFilter(ranked)
  }, [products, productHaystackMap, deferredSearchQuery, category, subCategory, subSubCategory, make, model, engine, drive, year, partBrand, hp, euro, trim, chassisCodeQuery, tab, todaySkuMap, customerSkuMap])

  /** Resolved A/B/C measure input (mm). null when B and C are not both valid numbers. */
  const measureInput = useMemo<MeasureInput | null>(() => {
    const id = parseMeasureMm(measA)
    const od = parseMeasureMm(measB)
    const h = parseMeasureMm(measC)
    if (h === undefined || od === undefined) return null
    const input: MeasureInput = { h, od }
    if (id !== undefined) input.id = id
    return input
  }, [measA, measB, measC])

  /** Apply dimension search on top of the existing filter pipeline.
   *  - strict: products whose dims fall within ±measTol of the input
   *  - nearest: if no strict match, top-8 closest by score (ranked) */
  const dimensionMatch = useMemo<{
    list: PickerProduct[]
    kind: 'none' | 'invalid' | 'strict' | 'nearest' | 'no_dim_in_filter'
  }>(() => {
    if (!measActive) return { list: filteredProducts, kind: 'none' }
    if (!measureInput) return { list: filteredProducts, kind: 'invalid' }
    const withMaster = filteredProducts
      .map((p) => ({ p, master: getProductMasterBySku(p.code) }))
      .filter((x) => x.master?.physicalDimensions) as { p: PickerProduct; master: ProductMasterDetail }[]
    if (withMaster.length === 0) return { list: [], kind: 'no_dim_in_filter' }
    const strict = withMaster.filter((x) => dimensionStrictMatch(x.master, measureInput, measTol))
    if (strict.length > 0) return { list: strict.map((x) => x.p), kind: 'strict' }
    const nearest = [...withMaster]
      .map((x) => ({ p: x.p, score: dimensionScore(x.master, measureInput) ?? Infinity }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 8)
      .map((x) => x.p)
    return { list: nearest, kind: 'nearest' }
  }, [filteredProducts, measActive, measureInput, measTol])

  const displayProducts = dimensionMatch.list

  // Auto-select first product เมื่อ list เปลี่ยน
  useEffect(() => {
    if (!open) return
    if (selectedProduct && displayProducts.some((p) => p.id === selectedProduct.id)) return
    setSelectedProduct(displayProducts[0] ?? null)
  }, [displayProducts, open, selectedProduct])

  // เมื่อ selectedProduct เปลี่ยน — reset unit/tier/qty
  const sellConfig = useMemo(
    () => (selectedProduct ? getPosSellConfig(selectedProduct.id) : null),
    [selectedProduct],
  )
  const availableUnits = useMemo(() => (sellConfig ? posUnitsWithSellPrice(sellConfig) : []), [sellConfig])
  // ใช้ filter เดียวกับตาราง PriceMatrix — แสดง tier ใดก็ได้ที่มีราคา > 0 บนหน่วยที่เลือก
  // (รวมราคา fallback/derived) เพื่อให้ dropdown ตรงกับสิ่งที่ตารางแสดง
  const availableTiers = useMemo(
    () => (sellConfig
      ? sellConfig.priceLevels.filter(
          (lv) => lv.index < MAX_TIERS && sellConfig.getUnitPrice(chosenUnitIndex, lv.index) > 0,
        )
      : []),
    [sellConfig, chosenUnitIndex],
  )

  useEffect(() => {
    if (!sellConfig || !selectedProduct) return
    const picked = pickDefaultPosUnitAndPrice(sellConfig)
    const defaultUnit = picked?.unit.index ?? availableUnits[0]?.index ?? 0
    setChosenUnitIndex(defaultUnit)
    setChosenQty('1')
    // เลือก tier ตามประเภทลูกค้าเสมอ — ทุก tier มีราคา fallback แล้ว ไม่ต้องกลัวว่าจะเลือกไม่ได้
    const validTiers = sellConfig.priceLevels.filter(
      (lv) => sellConfig.getUnitPrice(defaultUnit, lv.index) > 0,
    )
    const customerTier = validTiers.find((lv) => lv.index === defaultPriceLevelIndex)
    setChosenTierIndex(customerTier?.index ?? validTiers[0]?.index ?? 0)
  }, [selectedProduct?.id, sellConfig, defaultPriceLevelIndex, availableUnits])

  // ถ้า unit เปลี่ยน ตรวจว่า tier ปัจจุบันใช้ได้ ถ้าไม่ → fallback ไป tier ของลูกค้าก่อน แล้วค่อย tier แรกที่มีราคา
  useEffect(() => {
    if (!sellConfig) return
    const tiers = sellConfig.priceLevels.filter(
      (lv) => sellConfig.getUnitPrice(chosenUnitIndex, lv.index) > 0,
    )
    if (!tiers.find((t) => t.index === chosenTierIndex)) {
      const customerTier = tiers.find((t) => t.index === defaultPriceLevelIndex)
      setChosenTierIndex(customerTier?.index ?? tiers[0]?.index ?? 0)
    }
  }, [chosenUnitIndex, sellConfig, chosenTierIndex, defaultPriceLevelIndex])

  const qtyNumber = Math.max(1, Number.parseInt(chosenQty || '1', 10) || 1)

  /** ราคา list ปกติ (ไม่นับ qty break) — ใช้แสดง “ราคาก่อนลด” เมื่อมี break active */
  const baseListPrice = useMemo(() => {
    if (!sellConfig) return 0
    return sellConfig.getListUnitPrice(chosenUnitIndex, chosenTierIndex)
  }, [sellConfig, chosenUnitIndex, chosenTierIndex])

  /** ราคาที่ใช้จริง — เผื่อ qty ถึงเกณฑ์ขั้นบันได */
  const chosenPrice = useMemo(() => {
    if (!sellConfig) return 0
    return sellConfig.getUnitPriceAtQty(chosenUnitIndex, chosenTierIndex, qtyNumber)
  }, [sellConfig, chosenUnitIndex, chosenTierIndex, qtyNumber])

  /** break ที่ active ตอนนี้ (สำหรับโชว์ inline hint) */
  const activeBreak = useMemo(() => {
    if (!sellConfig) return null
    return sellConfig.getActiveBreak(chosenUnitIndex, chosenTierIndex, qtyNumber)
  }, [sellConfig, chosenUnitIndex, chosenTierIndex, qtyNumber])

  const lineTotal = chosenPrice * qtyNumber

  const handleAddToCart = (closeAfter: boolean) => {
    if (!selectedProduct) return
    onAddToCart(selectedProduct, {
      qty: qtyNumber,
      unitIndex: chosenUnitIndex,
      priceLevelIndex: chosenTierIndex,
    })
    if (closeAfter) {
      onClose()
    } else {
      setChosenQty('1')
    }
  }

  /** Quick-add: เพิ่ม 1 ชิ้น default unit/tier ไม่ต้องเปิด detail (Phase 2D) */
  const handleQuickAdd = (product: PickerProduct) => {
    onAddToCart(product, { qty: 1, priceLevelIndex: defaultPriceLevelIndex })
    // Flash feedback
    setFlashedId(product.id)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlashedId(null), 650)
  }

  /** Toggle id ใน selectedIds (Phase 4A) */
  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /** Bulk add: เพิ่มทุกตัวที่ check ไว้ default unit/tier qty=1 (Phase 4A) */
  const handleBulkAdd = () => {
    if (selectedIds.size === 0) return
    const idSet = selectedIds
    for (const p of products) {
      if (!idSet.has(p.id)) continue
      onAddToCart(p, { qty: 1, priceLevelIndex: defaultPriceLevelIndex })
    }
    setSelectedIds(new Set())
    onClose()
  }

  // Keyboard navigation (Phase 1C)
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName ?? ''
      const isTextField = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA'
      const isSearchFocused = target === searchInputRef.current

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      // "/" — focus search (only when not already in a text field)
      if (e.key === '/' && !isTextField) {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      // Enter — add+close (Shift+Enter = keep open)
      // Allowed when nothing is focused OR search box focused (cashier presses Enter after typing)
      if (e.key === 'Enter' && (!isTextField || isSearchFocused)) {
        if (selectedProduct && chosenPrice > 0) {
          e.preventDefault()
          handleAddToCart(!e.shiftKey)
        }
        return
      }

      // ↑↓ — navigate list (only when not editing detail inputs)
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && (!isTextField || isSearchFocused)) {
        if (displayProducts.length === 0) return
        e.preventDefault()
        const dir = e.key === 'ArrowDown' ? 1 : -1
        const currentIdx = selectedProduct ? displayProducts.findIndex((x) => x.id === selectedProduct.id) : -1
        const nextIdx = currentIdx < 0
          ? (dir > 0 ? 0 : displayProducts.length - 1)
          : Math.max(0, Math.min(displayProducts.length - 1, currentIdx + dir))
        setSelectedProduct(displayProducts[nextIdx])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, selectedProduct, chosenQty, chosenUnitIndex, chosenTierIndex, chosenPrice, displayProducts])

  // Scroll selected row/card into view (Phase 1C)
  useLayoutEffect(() => {
    if (!open || !selectedProduct) return
    const el = listContainerRef.current?.querySelector<HTMLElement>(`[data-product-id="${selectedProduct.id}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [open, selectedProduct?.id])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className={isDark ? 'dark' : undefined}>
      <div
        className="fixed inset-0 z-[340] flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm dark:bg-black/70 picker-fade-in"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="picker-slide-up flex w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#2a2d3e] dark:bg-[#0d0f17]"
          style={{ maxHeight: 'min(94vh, 860px)' }}
        >
          {/* Header */}
          <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50/30 to-cyan-50/30 px-4 py-2.5 dark:border-[#2a2d3e] dark:from-[#12141c] dark:via-[#0a1525] dark:to-[#0a1f1f]">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" aria-hidden />
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-4 text-blue-500 dark:text-cyan-400" aria-hidden />
              <span className="bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-sm font-black uppercase tracking-widest text-transparent dark:from-cyan-300 dark:to-emerald-300">
                เลือกสินค้า
              </span>
              <span className="rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 shadow-sm dark:from-cyan-900/50 dark:to-emerald-900/50 dark:text-cyan-300">
                {displayProducts.length} รายการ
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 dark:border-[#2a2d3e]">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    'flex size-7 items-center justify-center transition',
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white dark:bg-cyan-600'
                      : 'bg-white text-slate-500 hover:bg-slate-100 dark:bg-[#12141c] dark:text-slate-400 dark:hover:bg-[#1a1f35]',
                  )}
                  aria-label="มุมมองรายการ"
                  title="มุมมองรายการ"
                >
                  <List className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    'flex size-7 items-center justify-center transition',
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white dark:bg-cyan-600'
                      : 'bg-white text-slate-500 hover:bg-slate-100 dark:bg-[#12141c] dark:text-slate-400 dark:hover:bg-[#1a1f35]',
                  )}
                  aria-label="มุมมองตาราง"
                  title="มุมมองตาราง"
                >
                  <LayoutGrid className="size-3.5" aria-hidden />
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1a1f35]"
                aria-label="ปิด"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2.5 dark:border-[#2a2d3e] dark:bg-[#050508]">
            <div className="group relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500 dark:text-cyan-500/50 dark:group-focus-within:text-cyan-400" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา รหัส / ชื่อสินค้า / OEM / ยี่ห้อ..."
                autoFocus
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-9 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-md focus:shadow-blue-500/10 focus:ring-2 focus:ring-blue-500/20 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-cyan-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#1a1f35] dark:hover:text-slate-200"
                  aria-label="ล้างคำค้น"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Inline filter row — always visible below search bar */}
          <div className="shrink-0 border-b border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-[#2a2d3e] dark:bg-[#0a0c13]">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <Car className="size-3 shrink-0 text-blue-500 dark:text-cyan-400" aria-hidden />
                ตัวกรอง
              </span>
              {activeVehicleFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:bg-slate-100 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-400 dark:hover:bg-[#1a1f35]"
                >
                  <X className="size-3" /> ล้างทั้งหมด
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-7">
              <SearchableFilterSelect
                value={make}
                options={makeOptions}
                allValue={FILTER_ALL}
                onChange={(v) => { setMake(v); setModel(FILTER_ALL); setEngine(FILTER_ALL); setDrive(FILTER_ALL); setYear(FILTER_ALL) }}
                ariaLabel="ยี่ห้อรถ"
                placeholder="ยี่ห้อรถ"
              />
              <SearchableFilterSelect
                value={model}
                options={modelOptions}
                allValue={FILTER_ALL}
                onChange={(v) => { setModel(v); setEngine(FILTER_ALL); setDrive(FILTER_ALL); setYear(FILTER_ALL) }}
                ariaLabel="รุ่นรถ"
                placeholder="รุ่นรถ"
              />
              <SearchableFilterSelect
                value={trim}
                options={trimOptions}
                allValue={FILTER_ALL}
                onChange={setTrim}
                ariaLabel="รุ่นย่อย / Trim"
                placeholder="รุ่นย่อย / Trim"
              />
              <SearchableFilterSelect
                value={engine}
                options={engineOptions}
                allValue={FILTER_ALL}
                onChange={(v) => { setEngine(v); setDrive(FILTER_ALL); setYear(FILTER_ALL) }}
                ariaLabel="เครื่องยนต์ + variant (รวม trim/HP/Euro/ขับเคลื่อน)"
                placeholder="เครื่องยนต์ + variant"
              />
              <SearchableFilterSelect
                value={drive}
                options={driveOptions}
                allValue={FILTER_ALL}
                onChange={(v) => { setDrive(v); setYear(FILTER_ALL) }}
                ariaLabel="ขับเคลื่อน / ล้อ"
                placeholder="ขับเคลื่อน / ล้อ"
              />
              <SearchableFilterSelect
                value={year}
                options={yearOptions}
                allValue={FILTER_ALL}
                onChange={setYear}
                ariaLabel="รุ่นปี"
                placeholder="รุ่นปี"
              />
              {hpOptions.length > 0 && (
                <SearchableFilterSelect
                  value={hp}
                  options={hpOptions}
                  allValue={FILTER_ALL}
                  onChange={setHp}
                  ariaLabel="HP"
                  placeholder="HP"
                />
              )}
              {euroOptions.length > 0 && (
                <SearchableFilterSelect
                  value={euro}
                  options={euroOptions}
                  allValue={FILTER_ALL}
                  onChange={setEuro}
                  ariaLabel="Euro"
                  placeholder="Euro"
                />
              )}
              <div className="flex min-w-0 items-stretch gap-1.5">
                <div className="relative min-w-0 flex-1">
                  <input
                    type="text"
                    value={chassisCodeQuery}
                    onChange={(e) => setChassisCodeQuery(e.target.value)}
                    placeholder="รหัสตัวถัง / chassis (เช่น FM2P, JZS155)"
                    className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-sm uppercase shadow-sm outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-cyan-100"
                    aria-label="ค้นหารหัสตัวถัง"
                  />
                  {chassisCodeQuery && (
                    <button
                      type="button"
                      onClick={() => setChassisCodeQuery('')}
                      className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="ล้างรหัสตัวถัง"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  aria-expanded={measPanelOpen}
                  aria-controls="picker-meas-dimension-panel"
                  title="ค้นหาตามมิติ (กรณีไม่เห็นเบอร์ OEM)"
                  onClick={() => setMeasPanelOpen((open) => !open)}
                  className={clsx(
                    'relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-sm outline-none transition focus-visible:ring-2',
                    measPanelOpen
                      ? 'border-violet-400 bg-violet-100/80 text-violet-900 dark:border-violet-500/60 dark:bg-violet-950/40 dark:text-violet-200'
                      : 'border-violet-200/90 bg-gradient-to-br from-violet-50 to-white text-violet-800 hover:border-violet-300 hover:bg-violet-100/80 dark:border-violet-700/40 dark:from-violet-950/30 dark:to-[#12141c] dark:text-violet-300',
                  )}
                >
                  <Ruler className="size-4" strokeWidth={1.75} aria-hidden />
                  <span className="sr-only">เปิดหรือย่อค้นหาตามมิติ</span>
                  {measActive ? (
                    <span
                      className="absolute right-1.5 top-1.5 size-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0d0f17]"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </div>
            </div>
            {(presets.length > 0 || activeVehicleFilterCount > 0) && (
              <div className="mt-2 border-t border-slate-200/70 pt-1.5 dark:border-[#1c1f2e]">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Presets
                  </span>
                  {activeVehicleFilterCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700 hover:bg-rose-100 dark:border-rose-700/40 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/40"
                      >
                        ล้างตัวกรอง ({activeVehicleFilterCount})
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePreset}
                        className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700 hover:bg-blue-100 dark:border-cyan-700/40 dark:bg-cyan-950/40 dark:text-cyan-300 dark:hover:bg-cyan-900/40"
                      >
                        + บันทึก preset ปัจจุบัน
                      </button>
                    </div>
                  )}
                </div>
                {presets.length === 0 ? (
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    ยังไม่มี preset — กดปุ่ม "+ บันทึก preset ปัจจุบัน" เมื่อมี filter ที่ตั้งไว้
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {presets.map((p) => (
                      <span
                        key={p.id}
                        className="group inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-300"
                      >
                        <button
                          type="button"
                          onClick={() => applyPreset(p)}
                          className="inline-flex items-center gap-1 hover:text-blue-700 dark:hover:text-cyan-400"
                          title={`ใช้ preset: ${p.name}`}
                        >
                          <span aria-hidden>📌</span>
                          <span className="max-w-[10rem] truncate">{p.name}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(p.id)}
                          className="rounded-full p-0.5 text-slate-400 opacity-0 transition hover:bg-rose-100 hover:text-rose-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
                          title="ลบ preset"
                          aria-label="ลบ preset"
                        >
                          <X className="size-2.5" aria-hidden />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dimension search panel — opens when Ruler button toggled */}
          {measPanelOpen && (
            <div
              id="picker-meas-dimension-panel"
              className="shrink-0 border-b border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white px-3 py-2 dark:border-violet-700/40 dark:from-violet-950/30 dark:to-[#0a0c13]"
            >
              <div className="flex flex-wrap items-start gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
                  <Ruler className="size-4" strokeWidth={1.75} aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[12px] font-semibold text-violet-950 dark:text-violet-200">
                        ค้นหาตามมิติ (กรณีไม่เห็นเบอร์ OEM)
                      </h3>
                      <p className="mt-0.5 text-[10px] leading-snug text-violet-900/90 dark:text-violet-300/80">
                        หน่วยเป็นมิลลิเมตร (mm) — กรอก B (เส้นผ่านศูนย์กลางนอก) และ C (สูง) อย่างน้อย
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMeasPanelOpen(false)}
                      title="ย่อแถบค้นหามิติ"
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-violet-200 bg-white px-2 py-1 text-[10px] font-medium text-violet-900 hover:bg-violet-50 dark:border-violet-700/40 dark:bg-[#12141c] dark:text-violet-200 dark:hover:bg-violet-950/40"
                    >
                      <ChevronUp className="size-3" aria-hidden />
                      ย่อ
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
                    <label className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[10px] font-medium leading-snug text-violet-900/90 dark:text-violet-300/80">A — ใน (ไม่บังคับ)</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="ไม่บังคับ"
                        value={measA}
                        onChange={(e) => setMeasA(e.target.value)}
                        aria-label="A — เส้นผ่านศูนย์กลางใน"
                        className="w-full min-w-0 rounded-lg border border-violet-200 bg-white px-2 py-1 text-xs tabular-nums outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200 dark:border-violet-700/40 dark:bg-[#12141c] dark:text-violet-100"
                      />
                    </label>
                    <label className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[10px] font-medium leading-snug text-violet-900/90 dark:text-violet-300/80">B — นอก</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="เช่น 68"
                        value={measB}
                        onChange={(e) => setMeasB(e.target.value)}
                        aria-label="B — เส้นผ่านศูนย์กลางนอก"
                        className="w-full min-w-0 rounded-lg border border-violet-200 bg-white px-2 py-1 text-xs tabular-nums outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200 dark:border-violet-700/40 dark:bg-[#12141c] dark:text-violet-100"
                      />
                    </label>
                    <label className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[10px] font-medium leading-snug text-violet-900/90 dark:text-violet-300/80">C — สูง</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="เช่น 85"
                        value={measC}
                        onChange={(e) => setMeasC(e.target.value)}
                        aria-label="C — ความสูง"
                        className="w-full min-w-0 rounded-lg border border-violet-200 bg-white px-2 py-1 text-xs tabular-nums outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200 dark:border-violet-700/40 dark:bg-[#12141c] dark:text-violet-100"
                      />
                    </label>
                    <label className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[10px] font-medium text-violet-900/90 dark:text-violet-300/80">คลาดเคลื่อนได้ ±</span>
                      <select
                        aria-label="คลาดเคลื่อนได้"
                        value={measTol}
                        onChange={(e) => setMeasTol(Number(e.target.value))}
                        className="w-full min-w-0 rounded-lg border border-violet-200 bg-white px-2 py-1 text-xs outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200 dark:border-violet-700/40 dark:bg-[#12141c] dark:text-violet-100"
                      >
                        {[1, 2, 3, 5, 8].map((n) => (
                          <option key={n} value={n}>± {n} mm</option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMeasActive(true)}
                        className="flex-1 rounded-lg border border-violet-700 bg-violet-800 px-2 py-1 text-[11px] font-medium text-white hover:bg-violet-900"
                      >
                        ใช้
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMeasActive(false)
                          setMeasA('')
                          setMeasB('')
                          setMeasC('')
                        }}
                        className="flex-1 rounded-lg border border-violet-200 bg-white px-2 py-1 text-[11px] font-medium text-violet-900 hover:bg-violet-50 dark:border-violet-700/40 dark:bg-[#12141c] dark:text-violet-200 dark:hover:bg-violet-950/40"
                      >
                        ล้าง
                      </button>
                    </div>
                  </div>
                  {measActive && dimensionMatch.kind === 'invalid' && (
                    <p className="text-[11px] font-medium text-rose-700 dark:text-rose-400">
                      กรอก B และ C เป็นตัวเลข
                    </p>
                  )}
                  {measActive && dimensionMatch.kind === 'strict' && (
                    <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400">
                      พบสินค้ามิติตรง ±{measTol} mm
                    </p>
                  )}
                  {measActive && dimensionMatch.kind === 'nearest' && (
                    <p className="text-[11px] font-medium text-amber-900 dark:text-amber-400">
                      ไม่พบในช่วงที่กำหนด — แสดงสินค้าใกล้เคียงที่สุด
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Vehicle hint banner (Phase 3C) — แสดงเฉพาะเมื่อมีลูกค้า + infer ได้ + ยังไม่ dismiss */}
          {showVehicleHint && customerVehicleHint && (
            <div className="picker-fade-in relative flex shrink-0 items-center justify-between gap-2 overflow-hidden border-b border-sky-200 bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 px-3 py-1.5 dark:border-sky-700/40 dark:from-sky-950/30 dark:via-cyan-950/30 dark:to-blue-950/30">
              <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-sky-500 to-cyan-500" aria-hidden />
              <span className="flex min-w-0 items-center gap-1.5 truncate text-[11px] font-bold text-sky-800 dark:text-sky-300">
                <Car className="size-3.5 shrink-0" aria-hidden />
                ลูกค้าซื้ออะไหล่ <span className="rounded bg-white px-1.5 py-px font-mono text-[10px] font-black text-sky-700 dark:bg-[#0a0c13] dark:text-sky-400">{customerVehicleHint.brand} · {customerVehicleHint.model}</span> บ่อย
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={applyVehicleHint}
                  className="rounded-lg bg-sky-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-sky-700 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                >
                  ใช้เป็นตัวกรอง
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleHintDismissed(true)}
                  className="rounded-full p-1 text-sky-700/70 hover:bg-sky-100 dark:text-sky-400/70 dark:hover:bg-sky-900/30"
                  aria-label="ปิดคำแนะนำ"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
          )}


          {/* Split view: category sidebar + list + detail */}
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* SIDEBAR — category tree (mirrors product-folder layout) */}
            <aside className="hidden w-44 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50/40 px-1.5 py-2 dark:border-[#2a2d3e] dark:bg-[#0a0c13] sm:block">
              <button
                type="button"
                onClick={() => {
                  setCategory(null)
                  setSubCategory(null)
                  setSubSubCategory(null)
                }}
                className={clsx(
                  'mb-1 flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] font-medium transition',
                  category === null
                    ? 'bg-blue-100 text-blue-900 ring-1 ring-blue-200/80 dark:bg-cyan-900/30 dark:text-cyan-100 dark:ring-cyan-700/40'
                    : 'text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-[#12141c]',
                )}
              >
                <span>ทั้งหมด</span>
                <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700 dark:bg-[#12141c] dark:text-slate-400">
                  {navCounts.total.toLocaleString('th-TH')}
                </span>
              </button>
              {categoryTree.length === 0 ? (
                <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-2 py-2 text-center text-[10px] leading-snug text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-300">
                  ยังไม่มีหมวดหมู่
                </p>
              ) : (
                categoryTree.map((main) => {
                  const subs = main.subcategories
                  const open = expandedMain.has(main.id)
                  const mainSelected = category === main.name
                  const mainCount = navCounts.main.get(main.name) ?? 0
                  return (
                    <div key={main.id} className="mb-0.5">
                      {subs.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCategory(main.name)
                            setSubCategory(null)
                            setSubSubCategory(null)
                          }}
                          className={clsx(
                            'flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition',
                            mainSelected
                              ? 'bg-blue-100 font-medium text-blue-900 ring-1 ring-blue-200/80 dark:bg-cyan-900/30 dark:text-cyan-100 dark:ring-cyan-700/40'
                              : 'font-medium text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-[#12141c]',
                          )}
                        >
                          <span className="line-clamp-2">{main.name}</span>
                          <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700 dark:bg-[#12141c] dark:text-slate-400">
                            {mainCount.toLocaleString('th-TH')}
                          </span>
                        </button>
                      ) : (
                        <>
                          <div className="flex min-w-0 items-stretch gap-0.5">
                            <button
                              type="button"
                              onClick={() => toggleMainExpand(main.id)}
                              className="flex shrink-0 items-center justify-center rounded-lg px-0.5 text-slate-500 hover:bg-white hover:text-slate-800 dark:text-slate-500 dark:hover:bg-[#12141c]"
                              aria-expanded={open}
                              aria-label={open ? 'ยุบหมวดย่อย' : 'ขยายหมวดย่อย'}
                            >
                              {open ? <ChevronDown className="size-3.5" aria-hidden /> : <ChevronRight className="size-3.5" aria-hidden />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCategory(main.name)
                                setSubCategory(null)
                                setSubSubCategory(null)
                                setExpandedMain(new Set([main.id]))
                                setExpandedSub(new Set())
                              }}
                              className={clsx(
                                'min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-[12px] transition',
                                mainSelected
                                  ? 'bg-blue-100 font-medium text-blue-900 ring-1 ring-blue-200/80 dark:bg-cyan-900/30 dark:text-cyan-100 dark:ring-cyan-700/40'
                                  : 'font-medium text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-[#12141c]',
                              )}
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="line-clamp-2">{main.name}</span>
                                <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700 dark:bg-[#12141c] dark:text-slate-400">
                                  {mainCount.toLocaleString('th-TH')}
                                </span>
                              </span>
                            </button>
                          </div>
                          {open && (
                            <div className="ml-4 space-y-0.5 border-l border-slate-200/90 py-0.5 pl-2 dark:border-[#2a2d3e]">
                              {subs.map((sub) => {
                                const subSel = mainSelected && subCategory === sub.name
                                const subSubs = sub.subSubcategories
                                const subKey = `${main.id}::${sub.id}`
                                const subOpen = expandedSub.has(subKey)
                                const subCount = navCounts.sub.get(`${main.name}::${sub.name}`) ?? 0
                                return (
                                  <div key={sub.id} className="space-y-0.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCategory(main.name)
                                        setSubCategory(sub.name)
                                        setSubSubCategory(null)
                                        if (subSubs.length > 0) toggleSubExpand(main.id, sub.id)
                                      }}
                                      className={clsx(
                                        'w-full rounded-md px-2 py-1 text-left text-[11.5px] transition',
                                        subSel
                                          ? 'bg-blue-100 font-medium text-blue-900 ring-1 ring-blue-200/80 dark:bg-cyan-900/30 dark:text-cyan-100 dark:ring-cyan-700/40'
                                          : 'text-slate-600 hover:bg-white dark:text-slate-400 dark:hover:bg-[#12141c]',
                                      )}
                                    >
                                      <span className="flex items-center justify-between gap-2">
                                        <span className="line-clamp-2">{sub.name}</span>
                                        <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700 dark:bg-[#12141c] dark:text-slate-400">
                                          {subCount.toLocaleString('th-TH')}
                                        </span>
                                      </span>
                                    </button>
                                    {subSubs.length > 0 && subOpen ? (
                                      <div className="ml-0 space-y-0.5 border-l border-slate-200/70 py-0.5 pl-2 dark:border-[#2a2d3e]">
                                        {subSubs.map((ss) => {
                                          const ssSel =
                                            mainSelected &&
                                            subCategory === sub.name &&
                                            subSubCategory === ss.name
                                          const ssCount =
                                            navCounts.subSub.get(
                                              `${main.name}::${sub.name}::${ss.name}`,
                                            ) ?? 0
                                          return (
                                            <button
                                              key={ss.id}
                                              type="button"
                                              onClick={() => {
                                                setCategory(main.name)
                                                setSubCategory(sub.name)
                                                setSubSubCategory(ss.name)
                                              }}
                                              className={clsx(
                                                'w-full rounded-md py-1 pl-3 pr-2 text-left text-[11px] leading-snug transition',
                                                ssSel
                                                  ? 'bg-blue-100 font-medium text-blue-900 ring-1 ring-blue-200/80 dark:bg-cyan-900/30 dark:text-cyan-100 dark:ring-cyan-700/40'
                                                  : 'text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-[#12141c]',
                                              )}
                                            >
                                              <span className="flex items-center justify-between gap-2">
                                                <span className="line-clamp-2">{ss.name}</span>
                                                <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700 dark:bg-[#12141c] dark:text-slate-400">
                                                  {ssCount.toLocaleString('th-TH')}
                                                </span>
                                              </span>
                                            </button>
                                          )
                                        })}
                                      </div>
                                    ) : null}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })
              )}
            </aside>

            {/* LEFT — list / grid */}
            <div
              ref={listContainerRef}
              className={clsx(
                'overflow-y-auto border-r border-slate-200 dark:border-[#2a2d3e]',
                viewMode === 'list' ? 'w-72 shrink-0' : 'min-w-0 flex-1',
              )}
            >
              {displayProducts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                  <Search className="size-8 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {measActive && dimensionMatch.kind === 'no_dim_in_filter'
                      ? 'ในรายการที่กรองอยู่ไม่มีสินค้าที่ลงมิติไว้'
                      : tab === 'today'
                        ? customerLoading ? 'กำลังโหลด...' : 'ยังไม่มีการขายวันนี้'
                        : tab === 'customer'
                          ? customerLoading ? 'กำลังโหลด...' : 'ลูกค้านี้ยังไม่มีประวัติการซื้อ'
                          : 'ไม่พบสินค้า'}
                  </p>
                  {tab === 'all' && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                  )}
                </div>
              ) : viewMode === 'list' ? (
                displayProducts.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    isSelected={selectedProduct?.id === p.id}
                    isChecked={selectedIds.has(p.id)}
                    isFlashing={flashedId === p.id}
                    onSelect={() => setSelectedProduct(p)}
                    onQuickAdd={() => handleQuickAdd(p)}
                    onToggleCheck={() => toggleSelected(p.id)}
                  />
                ))
              ) : (
                <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                  {displayProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      isSelected={selectedProduct?.id === p.id}
                      isChecked={selectedIds.has(p.id)}
                      isFlashing={flashedId === p.id}
                      onSelect={() => setSelectedProduct(p)}
                      onQuickAdd={() => handleQuickAdd(p)}
                      onToggleCheck={() => toggleSelected(p.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — detail */}
            <div
              className={clsx(
                'overflow-y-auto',
                viewMode === 'list' ? 'min-w-0 flex-1' : 'w-[340px] shrink-0 border-l border-slate-200 dark:border-[#2a2d3e]',
              )}
            >
              {selectedProduct ? (
                <DetailPane
                  product={selectedProduct}
                  sellConfig={sellConfig}
                  availableUnits={availableUnits}
                  availableTiers={availableTiers}
                  chosenUnitIndex={chosenUnitIndex}
                  chosenTierIndex={chosenTierIndex}
                  chosenQty={chosenQty}
                  chosenPrice={chosenPrice}
                  baseListPrice={baseListPrice}
                  activeBreak={activeBreak}
                  qtyNumber={qtyNumber}
                  lineTotal={lineTotal}
                  allProducts={products}
                  customerVehicleHint={customerVehicleHint}
                  onFitmentClick={(brand, model) => {
                    setMake(brand)
                    setModel(model)
                    setEngine(FILTER_ALL)
                    setDrive(FILTER_ALL)
                    setYear(FILTER_ALL)
                    setSearchQuery('')
                  }}
                  onUnitChange={setChosenUnitIndex}
                  onTierChange={setChosenTierIndex}
                  onQtyChange={setChosenQty}
                  onAddAndClose={() => handleAddToCart(true)}
                  onShowProductImage={onShowProductImage}
                  onClearProductImage={onClearProductImage}
                  onSelectProduct={setSelectedProduct}
                  onQuickAddProduct={handleQuickAdd}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <ShoppingCart className="size-12 text-slate-200 dark:text-slate-700" />
                  <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">เลือกสินค้าจากรายการ</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer — bulk action bar (Phase 4A) หรือ keyboard hint */}
          {selectedIds.size > 0 ? (
            <div className="picker-fade-in relative flex shrink-0 items-center justify-between gap-2 overflow-hidden border-t-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-cyan-50 to-emerald-50 px-3 py-2.5 shadow-inner dark:border-emerald-600/60 dark:from-emerald-950/40 dark:via-cyan-950/40 dark:to-emerald-950/40">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5" aria-hidden />
              <span className="relative flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
                <CheckSquare className="size-4 shrink-0" aria-hidden />
                เลือกแล้ว <span className="rounded bg-emerald-600 px-1.5 py-0.5 font-mono text-[11px] text-white shadow-sm">{selectedIds.size}</span> รายการ
              </span>
              <div className="relative flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 transition hover:-translate-y-px hover:bg-slate-50 hover:shadow dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-300 dark:hover:bg-[#1a1f35]"
                >
                  ล้าง
                </button>
                <button
                  type="button"
                  onClick={handleBulkAdd}
                  className="rounded-lg bg-gradient-to-r from-emerald-500 via-emerald-500 to-cyan-500 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest text-white shadow-md shadow-emerald-500/30 transition hover:-translate-y-px hover:shadow-lg hover:shadow-emerald-500/40 active:scale-[0.98] dark:from-emerald-600 dark:to-cyan-600 dark:shadow-emerald-500/30"
                >
                  + เพิ่มทั้งหมด ({selectedIds.size})
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}

type DetailPaneProps = {
  product: PickerProduct
  sellConfig: ReturnType<typeof getPosSellConfig> | null
  availableUnits: ReturnType<typeof posUnitsWithSellPrice>
  availableTiers: ReturnType<typeof posPriceLevelsForUnit>
  chosenUnitIndex: number
  chosenTierIndex: number
  chosenQty: string
  chosenPrice: number
  /** ราคา list ปกติ (ก่อน qty break) — ใช้แสดง compare เมื่อมี break active */
  baseListPrice: number
  /** break ที่ active เมื่อ qty ถึงเกณฑ์ — null เมื่อยังไม่ถึง */
  activeBreak: { price: number; minQty: number; source: 'tier' | 'default' } | null
  qtyNumber: number
  lineTotal: number
  /** Phase 3D — รายการทั้งหมดสำหรับหา substitute */
  allProducts: PickerProduct[]
  /** ใช้ highlight fitment row ที่ตรงกับรถที่ลูกค้ามักซื้ออะไหล่ */
  customerVehicleHint: { brand: string; model: string } | null
  /** คลิก fitment chip → เซต filter ใน picker เพื่อดูอะไหล่อื่นที่ตรงรุ่นเดียวกัน */
  onFitmentClick: (brand: string, model: string) => void
  onUnitChange: (idx: number) => void
  onTierChange: (idx: number) => void
  onQtyChange: (v: string) => void
  onAddAndClose: () => void
  onShowProductImage: (info: { code: string; name: string; price: number; unit: string }) => void
  /** Clear the customer-facing display spotlight when the cashier closes the lightbox. */
  onClearProductImage?: () => void
  /** Phase 3D — เลือกสินค้าทดแทน */
  onSelectProduct: (product: PickerProduct) => void
  /** Phase 3E — quick-add cross-sell โดยไม่สลับ detail */
  onQuickAddProduct: (product: PickerProduct) => void
}

function DetailPane({
  product,
  sellConfig,
  availableUnits,
  availableTiers,
  chosenUnitIndex,
  chosenTierIndex,
  chosenQty,
  chosenPrice,
  baseListPrice,
  activeBreak,
  qtyNumber,
  lineTotal,
  allProducts,
  customerVehicleHint,
  onFitmentClick,
  onUnitChange,
  onTierChange,
  onQtyChange,
  onAddAndClose,
  onShowProductImage,
  onClearProductImage,
  onSelectProduct,
  onQuickAddProduct,
}: DetailPaneProps) {
  const sp = product
  const master = getProductMasterBySku(sp.code)
  const fits = (master?.vehicleFitments ?? []).filter(Boolean)
  const normVeh = (s: string | undefined | null) => (s ?? '').trim().toLowerCase()
  /** ชื่อรุ่นที่จะแสดงให้ลูกค้า — engineSeries (Mega/Decca) ก่อน ไม่มีก็ใช้ modelName เดิม */
  const fitDisplayModel = (f: { engineSeries?: string; modelName?: string }) =>
    (f.engineSeries ?? f.modelName ?? '').trim()
  const fitMatchesCustomer = (f: { brandName?: string; modelName?: string; engineSeries?: string }) =>
    customerVehicleHint != null
    && normVeh(f.brandName) === normVeh(customerVehicleHint.brand)
    && normVeh(fitDisplayModel(f)) === normVeh(customerVehicleHint.model)
  const hasCustomerFitMatch = customerVehicleHint != null && fits.some(fitMatchesCustomer)
  /** จัดกลุ่ม fitment ตาม brand + (engineSeries || modelName) — ตัวที่ตรงรถลูกค้าเลื่อนขึ้นบนสุด */
  const fitGroups = useMemo(() => {
    const map = new Map<string, { brand: string; model: string; variants: typeof fits; matchesCustomer: boolean }>()
    for (const f of fits) {
      const brand = f.brandName ?? ''
      const model = fitDisplayModel(f)
      const key = `${brand}|${model}`
      let g = map.get(key)
      if (!g) {
        g = { brand, model, variants: [], matchesCustomer: false }
        map.set(key, g)
      }
      g.variants.push(f)
      if (fitMatchesCustomer(f)) g.matchesCustomer = true
    }
    return [...map.values()].sort((a, b) => Number(b.matchesCustomer) - Number(a.matchesCustomer))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fits, customerVehicleHint?.brand, customerVehicleHint?.model])
  const [showAllFits, setShowAllFits] = useState(false)
  const FIT_COLLAPSE_THRESHOLD = 5
  const visibleGroups = showAllFits || fitGroups.length <= FIT_COLLAPSE_THRESHOLD
    ? fitGroups
    : fitGroups.slice(0, FIT_COLLAPSE_THRESHOLD)
  const hiddenCount = fitGroups.length - visibleGroups.length
  const oem = [sp.factoryOem, sp.genuineNo].filter(Boolean).join(' / ')
  const dims = formatDims(sp.dimensions)
  // กรองค่าเปล่า/dash ออก — ไม่งั้น section จะมี "—" ทิ้งให้ดูรก
  const locationClean = sp.location && !/^[—-]+$/.test(sp.location.trim()) ? sp.location : ''
  const stockColor =
    sp.stock <= 0
      ? 'text-rose-500 dark:text-rose-400'
      : sp.stock <= 5
        ? 'text-amber-500 dark:text-amber-400'
        : 'text-emerald-600 dark:text-emerald-400'

  const chosenUnitLabel = sellConfig?.units.find((u) => u.index === chosenUnitIndex)?.label ?? sp.unit

  return (
    <div className="flex h-full flex-col gap-3 p-5">
      {/* Hero — Image + title with gradient backdrop */}
      <div className={clsx(
        'relative flex gap-4 overflow-hidden rounded-2xl border bg-gradient-to-br p-3 shadow-sm transition-colors',
        sp.stock <= 0
          ? 'border-rose-200 from-rose-50/40 via-white to-rose-50/30 dark:border-rose-700/30 dark:from-rose-950/15 dark:via-[#12141c] dark:to-rose-950/15'
          : 'border-slate-200 from-slate-50 via-white to-blue-50/40 dark:border-[#2a2d3e] dark:from-[#0d0f17] dark:via-[#12141c] dark:to-[#0a0f1f]',
      )}>
        <div
          className={clsx(
            'relative shrink-0 overflow-hidden rounded-xl ring-1',
            sp.stock <= 0
              ? 'ring-rose-300/70 dark:ring-rose-700/50'
              : 'ring-slate-200 dark:ring-[#2a2d3e]',
          )}
          style={{ width: 112, height: 112, minWidth: 112, minHeight: 112, maxWidth: 112, maxHeight: 112 }}
        >
          <ProductImage
            sku={sp.code}
            size="fill"
            style={{ width: '100%', height: '100%' }}
            objectFit="cover"
            onProject={() =>
              onShowProductImage({ code: sp.code, name: sp.name, price: chosenPrice, unit: chosenUnitLabel })
            }
            fallbackLetter={sp.brand}
            fallbackEmoji={sp.category ? categoryEmoji(sp.category) : undefined}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-black text-blue-700 dark:text-cyan-300">{sp.code}</p>
          <h2 className="mt-0.5 text-[17px] font-black leading-tight text-slate-900 dark:text-white">{sp.name}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
            <span className={clsx(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
              sp.stock <= 0
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                : sp.stock <= 5
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
            )}>
              <span className={clsx(
                'size-1.5 rounded-full',
                sp.stock <= 0 ? 'bg-rose-500' : sp.stock <= 5 ? 'bg-amber-500' : 'bg-emerald-500',
              )} aria-hidden />
              {sp.stock <= 0 ? 'หมดสต็อก' : sp.stock <= 5 ? `เหลือน้อย ${sp.stock}` : `พร้อม ${sp.stock} ชิ้น`}
            </span>
            {/* Phase 5B: Branch stock — popup button beside stock pill */}
            <BranchStockTable sku={sp.code} currentBranchStock={sp.stock} />
          </div>
        </div>
      </div>

      {/* Vehicle fitments — จัดกลุ่มตาม brand+model, คลิกเพื่อกรองสินค้าอื่นที่ตรงรุ่น */}
      {fitGroups.length > 0 && (
        <div
          className={clsx(
            'rounded-xl border p-2.5 shadow-sm',
            hasCustomerFitMatch
              ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white dark:border-emerald-700/40 dark:from-emerald-950/25 dark:to-[#12141c]'
              : 'border-sky-100 bg-gradient-to-br from-sky-50/60 to-white dark:border-sky-900/30 dark:from-sky-950/20 dark:to-[#12141c]',
          )}
        >
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p
              className={clsx(
                'flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide',
                hasCustomerFitMatch
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-sky-600 dark:text-sky-400',
              )}
            >
              <span aria-hidden>🚗</span>
              รุ่นรถที่ใช้ได้
              <span className={clsx(
                'rounded-full px-1.5 py-px text-[10px] font-black tabular-nums',
                hasCustomerFitMatch
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
              )}>
                {fitGroups.length}
              </span>
            </p>
            {hasCustomerFitMatch && customerVehicleHint && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-sm dark:bg-emerald-500">
                <Check className="size-3" aria-hidden />
                ตรงรถลูกค้า · {customerVehicleHint.brand} {customerVehicleHint.model}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {visibleGroups.map((g) => {
              const detailedVariants = g.variants.filter((f) => {
                const eng = getFitmentEngineName(f)
                const yr = fitmentYearLabel(f)
                return Boolean(eng) || Boolean(f.chassisCode) || Boolean(f.hp) || Boolean(f.wheels) || Boolean(f.engineSize) || yr !== '-' || Boolean(f.driveType) || Boolean(f.brakePosition)
              })
              return (
                <div
                  key={`${g.brand}|${g.model}`}
                  className={clsx(
                    'overflow-hidden rounded-lg border',
                    g.matchesCustomer
                      ? 'border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-300/60 dark:border-emerald-600/60 dark:bg-emerald-900/20 dark:ring-emerald-500/40'
                      : 'border-sky-100 bg-white/70 dark:border-sky-900/40 dark:bg-sky-950/10',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onFitmentClick(g.brand, g.model)}
                    title={`ดูอะไหล่อื่นที่ตรงกับ ${g.brand} ${g.model}`}
                    className={clsx(
                      'group flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-[12px] font-black transition',
                      g.matchesCustomer
                        ? 'text-emerald-800 hover:bg-emerald-100/70 dark:text-emerald-200 dark:hover:bg-emerald-900/30'
                        : 'text-sky-800 hover:bg-sky-50 dark:text-sky-200 dark:hover:bg-sky-900/30',
                    )}
                  >
                    <span aria-hidden>{g.matchesCustomer ? '✅' : '🚗'}</span>
                    <span className="truncate">{g.brand} {g.model}</span>
                    <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500 opacity-0 ring-1 ring-slate-200 transition group-hover:opacity-100 dark:bg-[#12141c]/80 dark:text-slate-400 dark:ring-[#2a2d3e]">
                      ดูสินค้ารุ่นนี้
                    </span>
                  </button>
                  {detailedVariants.length > 0 && (
                    <div className="flex flex-wrap gap-1 border-t border-slate-200/60 bg-white/40 px-2 py-1.5 dark:border-[#2a2d3e]/60 dark:bg-[#0a0c13]/40">
                      {detailedVariants.map((f, i) => {
                        const yr = fitmentYearLabel(f)
                        // ประกอบ "engine block" — chassisCode · engineSize · hp HP · euroStandard · wheels
                        const engineBlockParts = [
                          f.chassisCode,
                          f.engineSize,
                          [f.hp ? `${f.hp} HP` : null, f.euroStandard].filter(Boolean).join(' '),
                        ].filter(Boolean)
                        const engineBlock = engineBlockParts.join(' · ')
                        const parts = [
                          engineBlock || getFitmentEngineName(f),
                          f.wheels,
                          yr !== '-' ? `ปี ${yr}` : '',
                          f.driveType,
                          f.brakePosition === 'front' ? 'เบรกหน้า' : f.brakePosition === 'rear' ? 'เบรกหลัง' : '',
                        ].filter(Boolean)
                        return (
                          <span
                            key={i}
                            className={clsx(
                              'rounded-md border px-1.5 py-0.5 text-[10px]',
                              g.matchesCustomer
                                ? 'border-emerald-200 bg-white text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-200'
                                : 'border-slate-200 bg-white text-slate-600 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-300',
                            )}
                          >
                            {parts.join(' · ')}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllFits(true)}
                className="mt-0.5 self-start rounded-md border border-dashed border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-300"
              >
                + ดูเพิ่ม {hiddenCount} รุ่น
              </button>
            )}
            {showAllFits && fitGroups.length > FIT_COLLAPSE_THRESHOLD && (
              <button
                type="button"
                onClick={() => setShowAllFits(false)}
                className="mt-0.5 self-start rounded-md border border-dashed border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-300"
              >
                ย่อรายการ
              </button>
            )}
          </div>
        </div>
      )}

      {/* OEM / dims / location — แสดงเฉพาะ field ที่มีค่าจริง */}
      {(oem || dims || locationClean) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/40 to-white px-3 py-2 shadow-sm dark:border-amber-900/30 dark:from-amber-950/15 dark:to-[#12141c]">
          {oem && (
            <span className="inline-flex items-center gap-1 text-[11px]">
              <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">🏷️ OEM</span>
              <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">{oem}</span>
            </span>
          )}
          {dims && (
            <span className="inline-flex items-center gap-1 text-[11px]">
              <span className="text-[10px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">📐 มิติ</span>
              <span className="font-mono font-semibold text-violet-700 dark:text-violet-300">{dims}</span>
            </span>
          )}
          {locationClean && (
            <span className="inline-flex items-center gap-1 text-[11px]">
              <span className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <MapPin className="size-3" aria-hidden /> ที่เก็บ
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{locationClean}</span>
            </span>
          )}
        </div>
      )}

      {/* Phase 3D: Substitute SKUs — แสดงเฉพาะเมื่อสินค้านี้หมด */}
      {sp.stock <= 0 && (
        <SubstituteList target={sp} allProducts={allProducts} onSelect={onSelectProduct} />
      )}


      {/* Phase 3E: Cross-sell มักซื้อพร้อมกัน */}
      <CrossSellList
        targetSku={sp.code}
        allProducts={allProducts}
        onSelect={onSelectProduct}
        onQuickAdd={onQuickAddProduct}
      />

      {/* Phase 5C: Price matrix unit × tier */}
      {sellConfig && (
        <PriceMatrix
          sellConfig={sellConfig}
          chosenUnitIndex={chosenUnitIndex}
          chosenTierIndex={chosenTierIndex}
          onPick={(unitIdx, tierIdx) => {
            onUnitChange(unitIdx)
            onTierChange(tierIdx)
          }}
        />
      )}


      {/* Stock summary */}
      <div className="flex items-end justify-between gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50/80 via-white to-emerald-50/40 px-4 py-2.5 shadow-sm dark:border-[#2a2d3e] dark:from-[#0a0c13] dark:via-[#12141c] dark:to-emerald-950/20">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">คงเหลือ</p>
          <p className={clsx('font-mono text-2xl font-black leading-none', stockColor)}>
            {sp.stock} <span className="text-sm font-bold">ชิ้น</span>
          </p>
        </div>
        <div className="h-10 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent dark:via-[#2a2d3e]" aria-hidden />
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">ยอดบรรทัด</p>
          <p className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text font-mono text-2xl font-black leading-none text-transparent dark:from-emerald-400 dark:to-cyan-400">
            {lineTotal > 0 ? `฿${lineTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '—'}
          </p>
        </div>
      </div>

      {/* Active quantity-break hint */}
      {activeBreak && baseListPrice > 0 && chosenPrice > 0 && chosenPrice < baseListPrice && (
        <div className="flex shrink-0 items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-2.5 py-1.5 text-[11px] dark:border-emerald-700/40 dark:bg-emerald-950/25">
          <span className="font-bold text-emerald-800 dark:text-emerald-300">
            🎯 ขั้นบันได ≥ {activeBreak.minQty} {sellConfig?.units[chosenUnitIndex]?.label ?? ''}
            {activeBreak.source === 'tier' && (
              <span className="ml-1 rounded-full bg-emerald-600 px-1.5 py-px text-[9px] font-black uppercase tracking-wide text-white dark:bg-emerald-500">
                เฉพาะ {tierLabel(chosenTierIndex)}
              </span>
            )}
          </span>
          <span className="font-mono font-black text-emerald-700 dark:text-emerald-300">
            ฿{chosenPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            <span className="ml-1 text-[10px] font-bold text-slate-500 line-through dark:text-slate-400">
              ฿{baseListPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </span>
            <span className="ml-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              -฿{(baseListPrice - chosenPrice).toLocaleString('th-TH', { minimumFractionDigits: 2 })}/หน่วย
            </span>
          </span>
        </div>
      )}

      {/* Phase 1B: Qty / Unit / Tier picker */}
      <div className="mt-auto space-y-2.5">
        <div className="grid grid-cols-12 gap-2">
          {/* Qty */}
          <div className="col-span-4">
            <label className="mb-0.5 block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              จำนวน
            </label>
            <div className="flex items-stretch overflow-hidden rounded-lg border border-slate-200 dark:border-[#2a2d3e]">
              <button
                type="button"
                onClick={() => onQtyChange(String(Math.max(1, qtyNumber - 1)))}
                className="flex w-8 shrink-0 items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#1a1f35] dark:text-slate-300 dark:hover:bg-[#252b40]"
                aria-label="ลด"
              >
                <Minus className="size-3.5" aria-hidden />
              </button>
              <input
                value={chosenQty}
                onChange={(e) => onQtyChange(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                className="min-w-0 flex-1 bg-white px-2 text-center font-mono text-sm font-black text-slate-800 outline-none dark:bg-[#12141c] dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => onQtyChange(String(qtyNumber + 1))}
                className="flex w-8 shrink-0 items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#1a1f35] dark:text-slate-300 dark:hover:bg-[#252b40]"
                aria-label="เพิ่ม"
              >
                <Plus className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>

          {/* Unit */}
          <div className="col-span-4">
            <label className="mb-0.5 block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              หน่วย
            </label>
            <select
              value={chosenUnitIndex}
              onChange={(e) => onUnitChange(Number.parseInt(e.target.value, 10))}
              disabled={availableUnits.length <= 1}
              className="h-[34px] w-full rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-100"
            >
              {availableUnits.length === 0 ? (
                <option value={0}>{sp.unit}</option>
              ) : (
                availableUnits.map((u) => (
                  <option key={u.index} value={u.index}>
                    {u.label}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Tier */}
          <div className="col-span-4">
            <label className="mb-0.5 block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              ราคา
            </label>
            <select
              value={chosenTierIndex}
              onChange={(e) => onTierChange(Number.parseInt(e.target.value, 10))}
              disabled={availableTiers.length <= 1}
              className="h-[34px] w-full rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-100"
            >
              {availableTiers.length === 0 ? (
                <option value={0}>—</option>
              ) : (
                availableTiers
                  .filter((lv) => lv.index < MAX_TIERS)
                  .map((lv) => {
                    const price = sellConfig?.getListUnitPrice(chosenUnitIndex, lv.index) ?? 0
                    return (
                      <option key={lv.index} value={lv.index}>
                        {tierLabel(lv.index, lv.label)} · ฿{price.toLocaleString('th-TH')}
                      </option>
                    )
                  })
              )}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddAndClose}
          disabled={chosenPrice <= 0}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:hover:translate-y-0 dark:from-cyan-600 dark:via-cyan-500 dark:to-emerald-500 dark:shadow-cyan-500/30 dark:hover:shadow-cyan-500/40"
        >
          + เพิ่มเข้าตะกร้า ({qtyNumber})
        </button>
      </div>
    </div>
  )
}

/* =====================================================
 * CrossSellList — Phase 3E
 * วิเคราะห์ co-occurrence จาก posSalesHistory
 * — สำหรับ targetSku หา SKU อื่นที่อยู่ในบิลเดียวกันบ่อยสุด
 * ===================================================== */

type CoSold = { product: PickerProduct; count: number }

function findCoSoldSkus(targetSku: string, allProducts: PickerProduct[], max = 5): CoSold[] {
  const target = targetSku.trim()
  if (!target) return []
  const sales = loadRecentSales()
  const counts = new Map<string, number>()
  for (const s of sales) {
    if (s.voidedAt) continue
    if (!s.lines?.length) continue
    const skus = s.lines.map((l) => (l.sku || '').trim()).filter(Boolean)
    if (!skus.includes(target)) continue
    const seen = new Set<string>() // นับแต่ละ SKU ครั้งเดียวต่อบิล
    for (const sku of skus) {
      if (sku === target || seen.has(sku)) continue
      seen.add(sku)
      counts.set(sku, (counts.get(sku) ?? 0) + 1)
    }
  }
  if (counts.size === 0) return []
  const byCode = new Map<string, PickerProduct>()
  for (const p of allProducts) byCode.set(p.code, p)
  const result: CoSold[] = []
  for (const [sku, count] of counts) {
    const product = byCode.get(sku)
    if (!product) continue
    if (product.stock <= 0) continue
    result.push({ product, count })
  }
  return result.sort((a, b) => b.count - a.count).slice(0, max)
}

type CrossSellListProps = {
  targetSku: string
  allProducts: PickerProduct[]
  onSelect: (p: PickerProduct) => void
  onQuickAdd: (p: PickerProduct) => void
}

function CrossSellList({ targetSku, allProducts, onSelect, onQuickAdd }: CrossSellListProps) {
  const items = useMemo(() => findCoSoldSkus(targetSku, allProducts), [targetSku, allProducts])
  if (items.length === 0) return null
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-2.5 dark:border-violet-700/40 dark:bg-violet-950/20">
      <p className="mb-1.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-300">
        <span aria-hidden>🤝</span>
        มักซื้อพร้อมกัน ({items.length})
      </p>
      <div className="flex flex-col gap-1.5">
        {items.map(({ product: p, count }) => {
          const cfg = getPosSellConfig(p.id)
          const picked = pickDefaultPosUnitAndPrice(cfg)
          const price = picked != null ? cfg.getListUnitPrice(picked.unit.index, picked.level.index) : 0
          return (
            <div
              key={p.id}
              className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-2 py-1 shadow-sm dark:border-violet-700/40 dark:bg-[#12141c]"
            >
              <button
                type="button"
                onClick={() => onSelect(p)}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                title={p.name}
              >
                <ProductImage sku={p.code} size="sm" className="size-8 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[10px] font-black text-blue-700 dark:text-cyan-300">
                    {p.code}
                  </span>
                  <span className="block truncate text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                    {p.brand ? `${p.brand} · ` : ''}{p.name}
                  </span>
                </span>
              </button>
              <span className="flex shrink-0 flex-col items-end gap-0.5">
                {price > 0 && (
                  <span className="font-mono text-[10px] font-black text-slate-700 dark:text-slate-200">
                    ฿{price.toLocaleString('th-TH')}
                  </span>
                )}
                <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-black text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                  ซื้อคู่ ×{count}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onQuickAdd(p)}
                className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500 text-white shadow-sm transition hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-500"
                title="เพิ่มเข้าตะกร้า (+1)"
                aria-label="เพิ่มเข้าตะกร้า"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* =====================================================
 * SubstituteList — Phase 3D
 * แนะนำสินค้าทดแทนเมื่อ target stock = 0
 * Score: same OEM = 200 / same genuineNo = 200 / same category = 50
 *        + shared vehicle fitment = 80 / different brand = 5
 * ===================================================== */

function rankSubstitutes(target: PickerProduct, allProducts: PickerProduct[], max = 6): PickerProduct[] {
  const tMaster = getProductMasterBySku(target.code)
  const tCat = (target.category ?? '').trim().toLowerCase()
  const tBrand = (target.brand ?? '').trim().toLowerCase()
  const tOem = (target.factoryOem ?? '').trim().toLowerCase()
  const tGen = (target.genuineNo ?? '').trim().toLowerCase()
  const tFits = tMaster?.vehicleFitments ?? []

  type Scored = readonly [PickerProduct, number]
  const scored: Scored[] = []

  for (const p of allProducts) {
    if (p.id === target.id) continue
    if (p.stock <= 0) continue

    const pOem = (p.factoryOem ?? '').trim().toLowerCase()
    const pGen = (p.genuineNo ?? '').trim().toLowerCase()
    const pCat = (p.category ?? '').trim().toLowerCase()
    const pBrand = (p.brand ?? '').trim().toLowerCase()

    const oemMatch = !!tOem && !!pOem && tOem === pOem
    const genMatch = !!tGen && !!pGen && tGen === pGen
    const catMatch = !!tCat && tCat === pCat
    if (!oemMatch && !genMatch && !catMatch) continue

    let score = 0
    if (oemMatch) score += 200
    if (genMatch) score += 200
    if (catMatch) score += 50
    if (tBrand && pBrand && pBrand !== tBrand) score += 5

    if (tFits.length > 0) {
      const pMaster = getProductMasterBySku(p.code)
      const pFits = pMaster?.vehicleFitments ?? []
      const sharedFit = pFits.some((f) =>
        tFits.some((tf) => tf.brandName === f.brandName && tf.modelName === f.modelName),
      )
      if (sharedFit) score += 80
    }
    scored.push([p, score])
  }

  return scored
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([p]) => p)
}

type SubstituteListProps = {
  target: PickerProduct
  allProducts: PickerProduct[]
  onSelect: (p: PickerProduct) => void
}

function SubstituteList({ target, allProducts, onSelect }: SubstituteListProps) {
  const subs = useMemo(() => rankSubstitutes(target, allProducts), [target, allProducts])
  if (subs.length === 0) return null

  return (
    <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 p-2.5 dark:border-emerald-600/40 dark:bg-emerald-950/20">
      <p className="mb-1.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
        <span aria-hidden>🔄</span>
        สินค้าทดแทน · มีของพร้อมขาย ({subs.length})
      </p>
      <div className="flex flex-wrap gap-1.5">
        {subs.map((s) => {
          const cfg = getPosSellConfig(s.id)
          const picked = pickDefaultPosUnitAndPrice(cfg)
          const price = picked != null ? cfg.getListUnitPrice(picked.unit.index, picked.level.index) : 0
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s)}
              className="group inline-flex max-w-full items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2 py-1 text-left shadow-sm transition hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-700/40 dark:bg-[#12141c] dark:hover:border-emerald-500 dark:hover:bg-emerald-950/30"
              title={s.name}
            >
              <span className="min-w-0 flex flex-col leading-tight">
                <span className="font-mono text-[10px] font-black text-blue-700 dark:text-cyan-300">{s.code}</span>
                <span className="truncate text-[10px] font-semibold text-slate-700 dark:text-slate-200" style={{ maxWidth: '12rem' }}>
                  {s.brand ? `${s.brand} · ` : ''}{s.name}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-0.5">
                {price > 0 && (
                  <span className="font-mono text-[10px] font-black text-slate-700 dark:text-slate-200">
                    ฿{price.toLocaleString('th-TH')}
                  </span>
                )}
                <StockBadge stock={s.stock} compact />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* =====================================================
 * PriceMatrix — Phase 5C
 * แสดงตาราง units × price levels คลิกเซลล์เพื่อเปลี่ยน unit+tier
 * ===================================================== */

type PriceMatrixProps = {
  sellConfig: ReturnType<typeof getPosSellConfig>
  chosenUnitIndex: number
  chosenTierIndex: number
  onPick: (unitIndex: number, tierIndex: number) => void
}

function PriceMatrix({ sellConfig, chosenUnitIndex, chosenTierIndex, onPick }: PriceMatrixProps) {
  const units = useMemo(() => posUnitsWithSellPrice(sellConfig), [sellConfig])
  // Show only price levels that have at least one priced unit
  const levelsWithPrice = useMemo(
    () => sellConfig.priceLevels
      .filter((lv) => lv.index < MAX_TIERS)
      .filter((lv) => units.some((u) => sellConfig.getUnitPrice(u.index, lv.index) > 0)),
    [sellConfig, units],
  )
  // ซ่อนราคา 4 ระดับเป็นค่าเริ่มต้น — กันลูกค้ามองเห็นโดยไม่ตั้งใจ
  // Cashier กดปุ่ม "แสดงราคา" ก่อนถึงจะเห็นตารางราคา
  const [revealed, setRevealed] = useState(false)
  // รีเซ็ตเป็นซ่อนทุกครั้งเมื่อสลับสินค้า
  useEffect(() => {
    setRevealed(false)
  }, [sellConfig])

  if (units.length === 0 || levelsWithPrice.length === 0) return null
  const isSimple = units.length === 1 && levelsWithPrice.length === 1
  if (isSimple) return null // Skip when only 1 cell — dropdowns cover this case

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-[#2a2d3e] dark:bg-[#12141c]">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          ราคาตาม หน่วย × ระดับ
        </p>
        {revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(false)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-400 dark:hover:bg-[#1a1f35] dark:hover:text-slate-200"
            aria-label="ซ่อนราคา"
          >
            <EyeOff className="size-3" aria-hidden /> ซ่อนราคา
          </button>
        ) : (
          <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">คลิกแสดง</span>
        )}
      </div>
      {revealed ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white px-1.5 py-1 text-left text-[9px] font-black uppercase tracking-widest text-slate-400 dark:bg-[#12141c]">
                  หน่วย
                </th>
                {levelsWithPrice.map((lv) => (
                  <th
                    key={lv.index}
                    className="px-1.5 py-1 text-right text-[9px] font-black uppercase tracking-widest text-slate-400"
                  >
                    {tierLabel(lv.index, lv.label)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.index}>
                  <td className="sticky left-0 bg-white px-1.5 py-1 font-bold text-slate-700 dark:bg-[#12141c] dark:text-slate-200">
                    {u.label}
                  </td>
                  {levelsWithPrice.map((lv) => {
                    const price = sellConfig.getListUnitPrice(u.index, lv.index)
                    const isActive = u.index === chosenUnitIndex && lv.index === chosenTierIndex
                    const hasPrice = price > 0
                    return (
                      <td key={lv.index} className="p-0.5">
                        <button
                          type="button"
                          onClick={() => hasPrice && onPick(u.index, lv.index)}
                          disabled={!hasPrice}
                          className={clsx(
                            'w-full rounded px-1.5 py-1 text-right font-mono font-bold tabular-nums transition',
                            !hasPrice
                              ? 'cursor-not-allowed text-slate-300 dark:text-slate-700'
                              : isActive
                                ? 'bg-blue-600 text-white shadow-sm dark:bg-cyan-600'
                                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-[#1a1f35]',
                          )}
                        >
                          {hasPrice ? `฿${price.toLocaleString('th-TH')}` : '—'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2 py-3 text-[11px] font-bold text-slate-500 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-[#2a2d3e] dark:bg-[#0a0c13] dark:text-slate-400 dark:hover:border-cyan-500 dark:hover:bg-[#0a1525] dark:hover:text-cyan-300"
          aria-label="แสดงราคาทั้ง 4 ระดับ"
        >
          <Eye className="size-3.5" aria-hidden />
          <span>คลิกเพื่อแสดงราคา</span>
          <span className="rounded bg-slate-200 px-1.5 py-px font-mono text-[10px] font-black tabular-nums text-slate-600 dark:bg-[#1a1f35] dark:text-slate-300">
            {units.length} × {levelsWithPrice.length}
          </span>
        </button>
      )}
    </div>
  )
}

/* =====================================================
 * BranchStockTable — Phase 5B
 * อ่าน master.crossBranch ของ SKU แสดง stock ทุกสาขา
 * — highlight สาขาปัจจุบัน + summary "รวมทุกสาขา"
 * ===================================================== */

function BranchStockTable({ sku, currentBranchStock }: { sku: string; currentBranchStock: number }) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null)

  const master = useMemo(() => getProductMasterBySku(sku), [sku])
  const currentBranch = useMemo(() => getStoredBranch(), [])
  const rows = useMemo(() => {
    const base = master?.crossBranch ?? []
    if (!currentBranch?.id) return base
    let foundCurrent = false
    const merged = base.map((r) => {
      if (r.branchId === currentBranch.id) {
        foundCurrent = true
        return {
          ...r,
          stock: currentBranchStock,
          status: (currentBranchStock > 5 ? 'normal' : 'low') as 'normal' | 'low',
        }
      }
      return r
    })
    if (!foundCurrent) {
      merged.unshift({
        id: `current-${currentBranch.id}`,
        locationLabel: currentBranch.name ?? currentBranch.id,
        branchId: currentBranch.id,
        siteKind: 'branch',
        stock: currentBranchStock,
        position: '',
        status: currentBranchStock > 5 ? 'normal' : 'low',
      })
    }
    return merged
  }, [master, currentBranch, currentBranchStock])

  // Calculate popup position from button rect
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const POPUP_W = 280
    let left = rect.left
    if (left + POPUP_W > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - POPUP_W - 8)
    }
    setPopupPos({ top: rect.bottom + 4, left })
  }, [open])

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target)) return
      const popup = document.getElementById('branch-stock-popup')
      if (popup?.contains(target)) return
      setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onEsc)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onEsc)
    }
  }, [open])

  if (rows.length === 0) return null
  const totalStock = rows.reduce((sum, r) => sum + (r.stock || 0), 0)
  const branchCount = rows.length
  const inStockCount = rows.filter((r) => r.stock > 0).length

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold shadow-sm transition hover:-translate-y-px hover:shadow',
          open
            ? 'border-blue-400 bg-blue-50 text-blue-800 dark:border-cyan-500 dark:bg-cyan-950/40 dark:text-cyan-300'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:text-slate-300 dark:hover:bg-[#1a1f35]',
        )}
        aria-expanded={open}
        title={`${inStockCount}/${branchCount} สาขามีของ · รวม ${totalStock.toLocaleString('th-TH')}`}
      >
        <span aria-hidden>📦</span>
        <span className="font-mono tabular-nums">{totalStock.toLocaleString('th-TH')}</span>
      </button>

      {open && popupPos && typeof document !== 'undefined' && createPortal(
        <div
          id="branch-stock-popup"
          className="picker-fade-in fixed z-[400] w-[280px] rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xl ring-1 ring-blue-500/10 dark:border-[#2a2d3e] dark:bg-[#12141c] dark:ring-cyan-500/10"
          style={{ top: popupPos.top, left: popupPos.left }}
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
              <span aria-hidden>📦</span>
              สต็อกข้ามสาขา
            </span>
            <span className="font-mono text-[10px] font-black tabular-nums text-emerald-600 dark:text-emerald-400">
              รวม {totalStock.toLocaleString('th-TH')}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {rows.map((r) => {
              const isCentral = r.siteKind === 'central_hub'
              const isLow = r.status === 'low'
              const out = r.stock <= 0
              const isCurrent = currentBranch?.id != null && r.branchId === currentBranch.id
              return (
                <span
                  key={r.id}
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold',
                    isCurrent
                      ? 'border-blue-400 bg-blue-50 text-blue-800 ring-1 ring-blue-200 dark:border-cyan-500 dark:bg-cyan-950/30 dark:text-cyan-200 dark:ring-cyan-500/30'
                      : out
                        ? 'border-rose-200 bg-rose-50/60 text-rose-700 dark:border-rose-700/40 dark:bg-rose-950/20 dark:text-rose-300'
                        : isLow
                          ? 'border-amber-200 bg-amber-50/60 text-amber-700 dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-amber-300'
                          : isCentral
                            ? 'border-violet-200 bg-violet-50/60 text-violet-700 dark:border-violet-700/40 dark:bg-violet-950/20 dark:text-violet-300'
                            : 'border-slate-200 bg-slate-50/60 text-slate-700 dark:border-[#2a2d3e] dark:bg-[#0a0c13] dark:text-slate-300',
                  )}
                  title={isCurrent ? 'สาขาปัจจุบัน · stock จากระบบ' : r.position ? `ตำแหน่ง: ${r.position}` : undefined}
                >
                  <span aria-hidden>{isCurrent ? '📍' : isCentral ? '🏭' : '🏪'}</span>
                  <span className="truncate">
                    {r.locationLabel}{isCurrent && <span className="ml-0.5 opacity-70">(คุณ)</span>}
                  </span>
                  <span className={clsx(
                    'rounded px-1 font-mono text-[10px] tabular-nums',
                    out
                      ? 'bg-rose-200 text-rose-800 dark:bg-rose-800/40 dark:text-rose-200'
                      : isLow
                        ? 'bg-amber-200 text-amber-800 dark:bg-amber-800/40 dark:text-amber-200'
                        : 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800/40 dark:text-emerald-200',
                  )}>
                    {out ? 'หมด' : r.stock}
                  </span>
                  {r.showTransfer && !out && (
                    <span className="rounded-full bg-blue-500 px-1 py-px text-[8px] font-black uppercase text-white">โอน</span>
                  )}
                </span>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

/* =====================================================
 * Product row (list mode) + Product card (grid mode)
 * Phase 2A: rich row with image + brand + OEM
 * Phase 2C: stock badge pill (color-coded)
 * Phase 2D: quick-add button (+1 default unit/tier)
 * ===================================================== */

type StockTone = 'ok' | 'low' | 'out'

function getStockTone(stock: number): StockTone {
  if (stock <= 0) return 'out'
  if (stock <= 5) return 'low'
  return 'ok'
}

const STOCK_BADGE_CLASSES: Record<StockTone, string> = {
  ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  low: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  out: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
}

const STOCK_DOT_CLASSES: Record<StockTone, string> = {
  ok: 'bg-emerald-500',
  low: 'bg-amber-500',
  out: 'bg-rose-500',
}

function StockBadge({ stock, compact = false }: { stock: number; compact?: boolean }) {
  const tone = getStockTone(stock)
  const label = tone === 'out' ? 'หมด' : tone === 'low' ? `เหลือน้อย ${stock}` : `พร้อม ${stock}`
  const compactLabel = tone === 'out' ? 'หมด' : `${stock}`
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-bold',
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        STOCK_BADGE_CLASSES[tone],
      )}
    >
      <span className={clsx('size-1.5 shrink-0 rounded-full', STOCK_DOT_CLASSES[tone])} aria-hidden />
      <span className="font-mono tabular-nums">{compact ? compactLabel : label}</span>
    </span>
  )
}

type ProductRowProps = {
  product: PickerProduct
  isSelected: boolean
  isChecked: boolean
  isFlashing?: boolean
  onSelect: () => void
  onQuickAdd: () => void
  onToggleCheck: () => void
}

function ProductRow({ product: p, isSelected, isChecked, isFlashing, onSelect, onQuickAdd, onToggleCheck }: ProductRowProps) {
  const cfg = getPosSellConfig(p.id)
  const picked = pickDefaultPosUnitAndPrice(cfg)
  const price = picked != null ? cfg.getListUnitPrice(picked.unit.index, picked.level.index) : 0
  const oem = [p.factoryOem, p.genuineNo].filter(Boolean).join(' / ')
  const outOfStock = p.stock <= 0

  return (
    <div
      data-product-id={p.id}
      className={clsx(
        'group relative flex items-center gap-2 border-b border-slate-100 px-2.5 py-2 transition-all dark:border-[#1c1f2e]',
        isFlashing && 'picker-flash-add',
        isChecked
          ? 'bg-gradient-to-r from-emerald-50 to-cyan-50/40 dark:from-emerald-950/30 dark:to-cyan-950/20'
          : isSelected
            ? 'bg-gradient-to-r from-blue-50 to-blue-50/30 shadow-inner dark:from-[#1a1f35] dark:to-[#1a1f35]/40'
            : 'hover:bg-slate-50 hover:shadow-sm dark:hover:bg-[#1a1f35]/60',
      )}
    >
      <button
        type="button"
        onClick={onToggleCheck}
        className={clsx(
          'flex size-5 shrink-0 items-center justify-center rounded border transition',
          isChecked
            ? 'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-500'
            : 'border-slate-300 bg-white opacity-40 hover:border-emerald-500 hover:opacity-100 group-hover:opacity-100 dark:border-[#2a2d3e] dark:bg-[#12141c]',
        )}
        aria-label={isChecked ? 'ยกเลิกการเลือก' : 'เลือก'}
      >
        {isChecked && <Check className="size-3" aria-hidden />}
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <div className="relative shrink-0">
          <ProductImage
            sku={p.code}
            size="sm"
            className="size-10 rounded-lg ring-1 ring-slate-200 dark:ring-[#2a2d3e]"
            fallbackLetter={p.brand}
            fallbackEmoji={p.category ? categoryEmoji(p.category) : undefined}
          />
          {outOfStock && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-rose-900/40 backdrop-blur-[1px]" aria-hidden>
              <span className="text-[8px] font-black uppercase tracking-widest text-white">หมด</span>
            </div>
          )}
        </div>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1">
            <span className="truncate font-mono text-[11px] font-black text-blue-700 dark:text-cyan-300">{p.code}</span>
            {p.brand && (
              <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-px text-[8px] font-black uppercase tracking-wide text-slate-600 dark:bg-[#1a1f35] dark:text-slate-300">
                {p.brand}
              </span>
            )}
          </span>
          <span className="block truncate text-[12px] font-semibold text-slate-700 dark:text-slate-200">{p.name}</span>
          {oem && (
            <span className="flex items-center gap-0.5 truncate text-[9px] font-bold text-slate-400 dark:text-slate-500">
              <span className="opacity-60">OEM</span>
              <span className="truncate font-mono text-amber-600 dark:text-amber-400">{oem}</span>
            </span>
          )}
        </span>
      </button>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        {price > 0 && (
          <span className="font-mono text-[11px] font-black text-slate-700 dark:text-slate-200">
            ฿{price.toLocaleString('th-TH')}
          </span>
        )}
        <StockBadge stock={p.stock} compact />
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onQuickAdd() }}
        disabled={outOfStock}
        className={clsx(
          'flex size-7 shrink-0 items-center justify-center rounded-lg shadow-sm transition',
          outOfStock
            ? 'cursor-not-allowed bg-slate-100 text-slate-300 dark:bg-[#0a0c13] dark:text-slate-700'
            : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105 dark:bg-emerald-600 dark:hover:bg-emerald-500',
        )}
        title={outOfStock ? 'หมดสต็อก' : 'เพิ่มเข้าตะกร้า (+1)'}
        aria-label="เพิ่มเข้าตะกร้า"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  )
}

type ProductCardProps = ProductRowProps

function ProductCard({ product: p, isSelected, isChecked, isFlashing, onSelect, onQuickAdd, onToggleCheck }: ProductCardProps) {
  const cfg = getPosSellConfig(p.id)
  const picked = pickDefaultPosUnitAndPrice(cfg)
  const price = picked != null ? cfg.getListUnitPrice(picked.unit.index, picked.level.index) : 0
  const outOfStock = p.stock <= 0

  return (
    <div
      data-product-id={p.id}
      className={clsx(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-white transition-all dark:bg-[#12141c]',
        isFlashing && 'picker-flash-add',
        isChecked
          ? 'border-emerald-500 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/30 dark:border-emerald-400 dark:ring-emerald-400/30'
          : isSelected
            ? 'border-blue-500 shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30 dark:border-cyan-500 dark:ring-cyan-500/30'
            : 'border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 dark:border-[#2a2d3e] dark:hover:border-cyan-700',
      )}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleCheck() }}
        className={clsx(
          'absolute left-1.5 top-1.5 z-10 flex size-6 items-center justify-center rounded-md border shadow-sm transition',
          isChecked
            ? 'border-emerald-500 bg-emerald-500 text-white opacity-100 dark:border-emerald-400 dark:bg-emerald-500'
            : 'border-slate-300 bg-white opacity-0 hover:border-emerald-500 group-hover:opacity-100 dark:border-[#2a2d3e] dark:bg-[#12141c]',
        )}
        aria-label={isChecked ? 'ยกเลิกการเลือก' : 'เลือก'}
      >
        {isChecked && <Check className="size-3.5" aria-hidden />}
      </button>
      <button type="button" onClick={onSelect} className="flex w-full flex-col text-left">
        <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-[#0a0c13] dark:to-[#0f1525]">
          <ProductImage
            sku={p.code}
            size="fill"
            style={{ width: '100%', height: '100%' }}
            className="rounded-none border-0"
            objectFit="cover"
            fallbackLetter={p.brand}
            fallbackEmoji={p.category ? categoryEmoji(p.category) : undefined}
          />
          {outOfStock && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-rose-900/30 backdrop-blur-[1px]">
              <span className="rounded bg-rose-500 px-1.5 py-px text-[9px] font-black uppercase tracking-widest text-white shadow">
                หมด
              </span>
            </div>
          )}
        </div>
        <div className="space-y-0.5 p-2">
          <div className="flex items-start justify-between gap-1">
            <span className="truncate font-mono text-[10px] font-black text-blue-700 dark:text-cyan-300">{p.code}</span>
            {price > 0 && (
              <span className="shrink-0 font-mono text-[11px] font-black text-slate-800 dark:text-slate-100">
                ฿{price.toLocaleString('th-TH')}
              </span>
            )}
          </div>
          <p className="line-clamp-2 min-h-[28px] text-[11px] font-bold leading-tight text-slate-700 dark:text-slate-200">
            {p.name}
          </p>
          <div className="flex items-center justify-between gap-1">
            {p.brand ? (
              <span className="truncate rounded bg-slate-100 px-1 py-px text-[8px] font-black uppercase tracking-wide text-slate-500 dark:bg-[#1a1f35] dark:text-slate-400">
                {p.brand}
              </span>
            ) : <span />}
            <StockBadge stock={p.stock} compact />
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onQuickAdd() }}
        disabled={outOfStock}
        className={clsx(
          'absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full shadow-md transition',
          outOfStock
            ? 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-[#0a0c13] dark:text-slate-700'
            : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-110 dark:bg-emerald-600 dark:hover:bg-emerald-500',
        )}
        title={outOfStock ? 'หมดสต็อก' : 'เพิ่มเข้าตะกร้า (+1)'}
        aria-label="เพิ่มเข้าตะกร้า"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  )
}
