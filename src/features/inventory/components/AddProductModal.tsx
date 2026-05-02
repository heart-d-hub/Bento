import { getStaffUsername, getStoredBranch } from '@/features/auth/authSession'
import {
  resolveAllowedProductTagIdsForBrowseNav,
  resolveAllowedProductTagIdsForProduct,
  resolveBoltHeadGroupBySizeForProduct,
  resolveProductFormFieldVisibility,
  resolveProductTagsInMasterForm,
  type CategoryBrowseNavForTags,
  type MainCategory,
} from '@/features/inventory/data/inventoryCategories'
import {
  HOSE_SOFT_TAG_ID,
  NUT_STOCK_TAG_ID,
  loadProductTagsRegistry,
  PRODUCT_TAGS_CHANGED_EVENT,
  type ProductTagDefinition,
} from '@/features/inventory/data/productTagsRegistry'
import {
  applyStorageLocationToCrossBranch,
  buildNextMasterEditMetadata,
  defaultCrossBranchRowsForNewProduct,
  detectConcurrentMasterEdit,
  normalizeCrossBranchRows,
} from '@/features/inventory/data/branchInventoryModel'
import {
  computeCostFromSupplierList,
  deriveVehicleSummaryFromFitments,
  getProductMasterById,
  getProductMasterList,
  MM_PER_HUN,
  normalizeSalesUnits,
  primarySellPriceFromTiers,
  sellPriceSmallUnitFromTier,
  type BarcodeEntry,
  type PhysicalDimensions,
  type ProductMasterDetail,
  type ProductSalesStatus,
  type QuantityBreakRow,
  type QuantityBreaksConfig,
  type QuantityBreaksForUnit,
  type SalesUnit,
  type SellPriceTier,
  type SellTierPercentBasis,
  type VehicleFitmentRef,
} from '@/features/inventory/data/productMasterData'
import {
  dimLayoutFromPaperFields,
  type PaperDimLayout,
} from '@/features/inventory/data/paperDimensionLayout'
import { VehicleFitPicker, type VehicleFitRow } from '@/features/inventory/components/VehicleFitPicker'
import { ProductImageGallery } from '@/features/inventory/components/ProductImageGallery'
import { isTauri } from '@/features/desktop/isTauri'
import { clsx } from 'clsx'
import { ChevronDown, Coins, ExternalLink, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

function norm(s: string) {
  return s.trim().toLowerCase()
}

/** ตรงกับเมนูหมวดในหน้าแฟ้มข้อมูล — ใช้กำหนดป้ายมิติตอนกดเพิ่มสินค้า */
export type AddProductBrowseNav =
  | { type: 'all' }
  | { type: 'main'; mainId: string }
  | { type: 'sub'; mainId: string; subId: string }
  | { type: 'subsub'; mainId: string; subId: string; subSubId: string }
  | { type: 'orphan' }

function paperFieldsForNav(tree: MainCategory[], sel: AddProductBrowseNav) {
  if (sel.type === 'main') return tree.find((m) => m.id === sel.mainId)?.paperFields
  if (sel.type === 'sub') {
    const main = tree.find((m) => m.id === sel.mainId)
    const sub = main?.subcategories.find((s) => s.id === sel.subId)
    return sub?.paperFields ?? main?.paperFields
  }
  if (sel.type === 'subsub') {
    const main = tree.find((m) => m.id === sel.mainId)
    const sub = main?.subcategories.find((s) => s.id === sel.subId)
    const ss = sub?.subSubcategories.find((x) => x.id === sel.subSubId)
    return ss?.paperFields ?? sub?.paperFields ?? main?.paperFields
  }
  return undefined
}

function splitTags(s: string): string[] {
  return s
    .split(/[\n,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
}

function splitLegacyCarModelLines(lines: string[]): string[] {
  return lines
    .flatMap((line) => line.split(/\s*\/\s*/))
    .map((x) => x.trim())
    .filter(Boolean)
}

function extractDriveType(text: string): string | undefined {
  const m = text.match(/\b(\d{1,2}WD|AWD|FWD|RWD)\b/i)
  return m?.[1] ? m[1].toUpperCase() : undefined
}

function stripDriveType(text: string): string {
  return text
    .replace(/\s*[·•:\-–]?\s*\b(\d{1,2}WD|AWD|FWD|RWD)\b\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function looksLikeEngineText(text: string): boolean {
  const t = text.toLowerCase()
  return /(\d+\s*hp|\bwd\b|awd|fwd|rwd|engine|cng|diesel|hybrid|ev)/i.test(t)
}

function normalizeVehicleLine(
  p: ProductMasterDetail,
  f: VehicleFitmentRef,
  idx: number,
): VehicleFitRow {
  const driveType = f.driveType?.trim() || extractDriveType(f.engineText ?? '') || extractDriveType(f.engineLabel ?? '')
  const engineTextBase = (f.engineText?.trim() || stripDriveType(f.engineLabel ?? '') || '').trim()
  const modelCandidate = (f.modelName ?? '').trim()
  const chassisCandidate = (f.chassisCode ?? '').trim()
  // Pick a model name that's NOT just a duplicate of the chassis code
  let modelName: string
  if (modelCandidate && modelCandidate !== '—' && !looksLikeEngineText(modelCandidate) && modelCandidate !== chassisCandidate) {
    modelName = modelCandidate
  } else {
    const fallbackLabel = p.carModelLabel && p.carModelLabel !== '—' ? p.carModelLabel : ''
    // Don't use carModelLabel if it equals chassis (would duplicate)
    if (fallbackLabel && fallbackLabel !== chassisCandidate) modelName = fallbackLabel
    else modelName = '—'
  }
  const brandCandidate = (f.brandName ?? '').trim()
  const brandName =
    !brandCandidate ||
    brandCandidate === '—' ||
    ['รถบรรทุก', 'รถยนต์', 'รถกระบะ', 'รถตู้', 'มอเตอร์ไซค์'].includes(brandCandidate)
      ? (p.carBrand && p.carBrand !== '—' ? p.carBrand : '—')
      : brandCandidate
  const yearRangeText = f.yearRangeText?.trim() || undefined
  const engineLabel =
    f.engineLabel?.trim() ||
    [engineTextBase || undefined, driveType || undefined, yearRangeText || p.yearLabel || undefined]
      .filter(Boolean)
      .join(' · ') ||
    'ไม่ระบุเครื่อง/ปี'

  return {
    id: f.id || `vf-row-${p.id}-${idx}`,
    categoryId: f.categoryId || 'legacy-category',
    categoryLabel: f.categoryLabel || '—',
    brandId: f.brandId || 'legacy-brand',
    brandName,
    modelId: f.modelId || `legacy-model-${idx}`,
    modelName,
    engineId: f.engineId || `legacy-engine-${p.id}-${idx}`,
    engineLabel,
    ...(engineTextBase ? { engineText: engineTextBase } : {}),
    ...(yearRangeText ? { yearRangeText } : {}),
    ...(f.yearFrom != null ? { yearFrom: f.yearFrom } : {}),
    ...(f.yearTo != null ? { yearTo: f.yearTo } : {}),
    ...(driveType ? { driveType } : {}),
    ...(f.engineCode ? { engineCode: f.engineCode } : {}),
    // Surface structured fields so the picker can display them
    ...(f.vehicleType ? { vehicleType: f.vehicleType } : {}),
    ...(f.engineSeries ? { engineSeries: f.engineSeries } : {}),
    ...(f.chassisCode ? { chassisCode: f.chassisCode } : {}),
    ...(f.wheels ? { wheels: f.wheels } : {}),
    ...(f.hp ? { hp: f.hp } : {}),
    ...(f.euroStandard ? { euroStandard: f.euroStandard } : {}),
    ...(f.engineSize ? { engineSize: f.engineSize } : {}),
    brakePosition: (f.brakePosition ?? '') as '' | 'front' | 'rear',
  }
}

function vehicleRowsFromProduct(p: ProductMasterDetail): VehicleFitRow[] {
  const fits = (p.vehicleFitments ?? []).filter(
    (f): f is VehicleFitmentRef => Boolean(f && typeof f === 'object'),
  )
  if (fits.length > 0) {
    const normalized = fits.map((f, idx) => normalizeVehicleLine(p, f, idx))
    const seen = new Set<string>()
    return normalized.filter((r) => {
      const key = [
        r.brandName,
        r.modelName,
        r.engineText ?? '',
        r.driveType ?? '',
        r.yearRangeText ?? '',
        r.yearFrom ?? '',
        r.yearTo ?? '',
        r.brakePosition ?? '',
      ].join('|')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  // fallback: ข้อมูลเก่าที่มีเฉพาะสรุปรถบนหัวสินค้า/บรรทัด carModels
  const lines = [
    ...new Set(splitLegacyCarModelLines((p.carModels ?? []).map((x) => x.trim()).filter(Boolean))),
  ]
  if (lines.length > 0) {
    return lines.map((line, idx) => {
      const [left, rightRaw] = line.split(/[—-]/, 2)
      const right = (rightRaw ?? '').trim()
      const leftParts = (left ?? '').trim().split(/\s+/).filter(Boolean)
      const brandName =
        (p.carBrand && p.carBrand !== '—' ? p.carBrand : leftParts[1]) || '—'
      const modelName =
        (p.carModelLabel && p.carModelLabel !== '—'
          ? p.carModelLabel
          : (leftParts.slice(2).join(' ').trim() || right || line)) || '—'
      const driveType = extractDriveType(right)
      const engineText = stripDriveType(right)
      return {
        id: `vf-legacy-${p.id}-${idx}`,
        categoryId: 'legacy-category',
        categoryLabel: '—',
        brandId: 'legacy-brand',
        brandName,
        modelId: `legacy-model-${idx}`,
        modelName,
        engineId: `legacy-engine-${p.id}-${idx}`,
        engineLabel:
          [engineText || undefined, driveType || undefined, p.yearLabel && p.yearLabel !== '—' ? p.yearLabel : undefined]
            .filter(Boolean)
            .join(' · ') || 'ไม่ระบุเครื่อง/ปี',
        ...(engineText ? { engineText } : {}),
        ...(driveType ? { driveType } : {}),
      }
    })
  }
  if (p.carBrand && p.carBrand !== '—' && p.carModelLabel && p.carModelLabel !== '—') {
    return [{
      id: `vf-legacy-${p.id}`,
      categoryId: 'legacy-category',
      categoryLabel: '—',
      brandId: 'legacy-brand',
      brandName: p.carBrand,
      modelId: 'legacy-model',
      modelName: p.carModelLabel,
      engineId: `legacy-engine-${p.id}`,
      engineLabel: p.yearLabel && p.yearLabel !== '—' ? p.yearLabel : 'ไม่ระบุเครื่อง/ปี',
    }]
  }
  return []
}

function parseBoltMaleSkuLines(s: string): string[] | undefined {
  const arr = s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean)
  return arr.length > 0 ? arr : undefined
}

function parseDim(s: string): number | undefined {
  const t = s.trim().replace(',', '.')
  if (!t) return undefined
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

type DimUnit = 'mm' | 'hun'

function formatDimForInput(n: number): string {
  const r = Math.round(n * 1000) / 1000
  return Number.isInteger(r) ? String(r) : r.toString()
}

function convertDimStringUnit(value: string, from: DimUnit, to: DimUnit): string {
  const n = parseDim(value)
  if (n === undefined || from === to) return value
  const mm = from === 'mm' ? n : n * MM_PER_HUN
  const out = to === 'mm' ? mm : mm / MM_PER_HUN
  return formatDimForInput(out)
}

function parseMoney(s: string): number | undefined {
  const t = s.trim().replace(/,/g, '').replace(',', '.')
  if (!t) return undefined
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

function parsePct(s: string): number {
  const t = s.trim().replace(',', '.')
  if (!t) return 0
  const n = Number(t)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(100, n)
}

/** % ระดับราคา — รองรับเครื่องหมายลบ/บวก (เช่น -15 = ลด 15%, 15 = +15%) */
function parseSignedTierPercent(s: string): number {
  const t = s.trim().replace(/,/g, '.')
  if (!t) return 0
  const n = Number(t)
  return Number.isFinite(n) ? n : 0
}

function sanitizeSignedPercentInput(raw: string): string {
  const t = raw.replace(/,/g, '.')
  let out = ''
  let i = 0
  if (t[0] === '-' || t[0] === '+') {
    if (t[0] === '-') out = '-'
    i = 1
  }
  let dot = false
  for (; i < t.length && out.length < 14; i++) {
    const c = t[i]
    if (c >= '0' && c <= '9') out += c
    else if (c === '.' && !dot) {
      dot = true
      out += c
    }
  }
  return out
}

function formatMoneyInput(n: number): string {
  const r = Math.round(n * 100) / 100
  if (Number.isInteger(r)) return String(r)
  return r.toFixed(2).replace(/\.?0+$/, '')
}

/** ชื่อเรียกระดับราคาตามลำดับแถว 1–4 */
const SELL_PRICE_TIER_LABELS = ['ปลีก', 'อู่', 'ร้านค้า', 'VIP'] as const

function parseBuyScheme(s: string): { buyQty: number; freeQty: number; effectiveQty: number; normalized: string } | null {
  const m = s.trim().match(/^(\d+)\s*\+\s*(\d+)$/)
  if (!m) return null
  const buyQty = Number(m[1])
  const freeQty = Number(m[2])
  if (!Number.isFinite(buyQty) || !Number.isFinite(freeQty) || buyQty <= 0 || freeQty < 0) return null
  return {
    buyQty,
    freeQty,
    effectiveQty: buyQty + freeQty,
    normalized: `${buyQty}+${freeQty}`,
  }
}

/** เกณฑ์เริ่มต้นในโมเดิลปัดเศษ (5 / 10 บาท) */
const ROUNDING_START_5_BAHT_DEFAULT = '50'
const ROUNDING_START_10_BAHT_DEFAULT = '500'
const VAT_RATE = 0.07

/** ปัดเศษ 5 / 10 บาทตามเกณฑ์เริ่มที่ — ใช้กับราคาปลีกจาก % เท่านั้น */
function applyRetailPriceRounding(price: number, start5Baht: number, start10Baht: number): number {
  if (!Number.isFinite(price) || price <= 0) return price
  const t5 = Math.max(0, start5Baht)
  const t10 = Math.max(0, start10Baht)
  if (price >= t10) return Math.round(price / 10) * 10
  if (price >= t5) return Math.round(price / 5) * 5
  return Math.round(price * 100) / 100
}

function applyNonRetailIntegerRounding(price: number): number {
  if (!Number.isFinite(price) || price <= 0) return price
  return Math.round(price)
}

function parseRoundingThreshold(raw: string, fallbackNum: number): number {
  const n = parseInt(raw.replace(/\D/g, ''), 10)
  return Number.isFinite(n) && n >= 0 ? n : fallbackNum
}

const inputClass =
  'w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[13px] text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300'
/** %กำไร — สูงสุด 5 หลัก */
const markupPctInputClass =
  'w-[3.75rem] max-w-[3.75rem] shrink-0 rounded-md border border-amber-300 bg-amber-50 px-1 py-1 text-center text-[11px] font-semibold tabular-nums text-amber-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200'
const listDiscountPctInputClass =
  'w-[3.75rem] max-w-[3.75rem] shrink-0 rounded-md border border-sky-300 bg-sky-50 px-1 py-1 text-center text-[11px] font-semibold tabular-nums text-sky-950 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200'
const sellPriceCellClass =
  'min-w-[3.75rem] max-w-[6.5rem] rounded-md border border-slate-200 bg-white px-1 py-1 text-[11px] tabular-nums text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300'
const labelClass = 'mb-0.5 block text-[10px] font-medium text-slate-600'
const sectionClass = 'rounded-lg border border-slate-100 bg-slate-50/50 p-2'
const sectionTitleClass = 'mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500'

type Props = {
  open: boolean
  onClose: () => void
  onCreate: (product: ProductMasterDetail) => void
  /** แก้ไขสินค้าเดิม — บันทึกแล้วเรียกแทน onCreate */
  onUpdate?: (product: ProductMasterDetail) => void
  editingProduct?: ProductMasterDetail | null
  categoryTree: MainCategory[]
  existingSkus: Set<string>
  /** true = บาร์โค้ด/รหัสนี้ซ้ำกับ SKU หรือบาร์โค้ดของสินค้าอื่น (ไม่นับสินค้าที่กำลังแก้) */
  checkBarcodeConflicts?: (trimmedBarcode: string) => boolean
  /** เปิดแท็บจัดการรุ่นรถ — ลดการสลับจอมือ */
  onOpenVehicleManage?: () => void
  /** เปิดจากคัดลอกสินค้า — เติมข้อมูลพื้นฐานบางส่วน */
  copySource?: ProductMasterDetail | null
  /** รหัส 10 หลักที่รันใหม่ (ส่งมาพร้อม copySource) */
  suggestedSku?: string
  /** มุมมองหมวดในหน้าแฟ้มตอนเปิดฟอร์ม — กำหนดป้ายมิติเริ่มต้น (ทั้งหมด = ชุดค่าเริ่มต้น, หมวดอื่น = ตามจัดการหมวด) */
  browseNav?: AddProductBrowseNav
}

export function AddProductModal({
  open,
  onClose,
  onCreate,
  onUpdate,
  editingProduct = null,
  categoryTree,
  existingSkus,
  checkBarcodeConflicts,
  onOpenVehicleManage,
  copySource = null,
  suggestedSku,
  browseNav,
}: Props) {
  const [sku, setSku] = useState('')
  const [receiveBonusRules, setReceiveBonusRules] = useState<import('@/features/inventory/data/productMasterData').ReceiveBonusRule[]>([])
  const [bundleRows, setBundleRows] = useState<{ id: string; sku: string; qtyStr: string }[]>([])
  const [oemText, setOemText] = useState('')
  const [factoryNo, setFactoryNo] = useState('')
  const [crossRefText, setCrossRefText] = useState('')
  const [name, setName] = useState('')
  const [vehicleRows, setVehicleRows] = useState<VehicleFitRow[]>([])
  const [brand, setBrand] = useState('')
  const [isGenuine, setIsGenuine] = useState(false)
  const [vatMode, setVatMode] = useState<'vat' | 'no_vat'>('vat')
  /** สินค้าแบ่งขาย — ชื่อบิล/POS ไม่แสดงท้ายวงเล็บ */
  const [splitSale, setSplitSale] = useState(false)
  /** ราคาซื้อรวมค่าขนส่งแล้ว — ไม่แบ่งค่าขนส่งเข้าต้นทุนตอนรับสินค้า */
  const [shippingCostExcluded, setShippingCostExcluded] = useState(false)
  /** piece | kg_roll | meter_roll | box_piece — ควบคุมการตัดสต็อก POS / หน้าแบ่งขาย */
  const [stockModeChoice, setStockModeChoice] = useState<'piece' | 'kg_roll' | 'meter_roll' | 'box_piece'>('piece')
  /** เปิดรายละเอียดโหมดม้วน/กล่อง — ค่าเริ่มปิดเพื่อไม่ให้ดูเหมือนต้องเป็นม้วนตั้งแต่แรก */
  const [stockModeDetailsOpen, setStockModeDetailsOpen] = useState(false)
  const [nominalKgRollStr, setNominalKgRollStr] = useState('')
  const [nominalMetersRollStr, setNominalMetersRollStr] = useState('')
  const [piecesPerBoxStr, setPiecesPerBoxStr] = useState('')
  const [salesUnitRows, setSalesUnitRows] = useState(() => [
    { id: `u-${Date.now()}`, label: 'ชิ้น', baseUnits: '1', barcode: '' },
  ])
  /** ราคาขั้นบันได ต่อหน่วย (UI string state) — รวม per-tier override */
  const [quantityBreakRows, setQuantityBreakRows] = useState<{
    unitIndex: number
    defaultRows: { id: string; minQty: string; price: string }[]
    perTierRows: { [tierIndex: number]: { id: string; minQty: string; price: string }[] }
    showPerTier: boolean
  }[]>([])
  const [packaging, setPackaging] = useState('')
  const [storageLocation, setStorageLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [posDisplayNote, setPosDisplayNote] = useState('')
  /** ไม่ติ๊ก = inStoreCatalog false (อ้างอิงเท่านั้น) */
  const [inStoreCatalog, setInStoreCatalog] = useState(true)
  const [salesStatus, setSalesStatus] = useState<ProductSalesStatus>('active')
  const [mainCatId, setMainCatId] = useState('')
  const [subCatId, setSubCatId] = useState('')
  const [subSubCatId, setSubSubCatId] = useState('')
  const [dimA, setDimA] = useState('')
  const [dimB, setDimB] = useState('')
  const [dimC, setDimC] = useState('')
  const [dimUnit, setDimUnit] = useState<DimUnit>('mm')
  const [supplierListStr, setSupplierListStr] = useState('')
  const [buyScheme, setBuyScheme] = useState('1+0')
  const [pd1, setPd1] = useState('')
  const [pd2, setPd2] = useState('')
  const [pd3, setPd3] = useState('')
  const [pd4, setPd4] = useState('')
  const [costStr, setCostStr] = useState('')
  const [costManualOverride, setCostManualOverride] = useState(false)
  const [costSource, setCostSource] = useState<'manual' | 'avg' | 'last'>('manual')
  const [sellRows, setSellRows] = useState(() =>
    Array.from({ length: 4 }, () => ({ markup: '', prices: [''] as string[] })),
  )
  /** คอลัมน์ % ระดับราคา: กำไรจากทุน หรือ ลดจากราคาตั้ง */
  const [sellTierPercentBasis, setSellTierPercentBasis] = useState<SellTierPercentBasis>('cost_markup')
  const [priceRoundingInfoOpen, setPriceRoundingInfoOpen] = useState(false)
  /** เกณฑ์ «เริ่มที่» สำหรับปัดเศษ 5 / 10 บาท (แก้ในโมเดิล) */
  const [rounding5StartBahtStr, setRounding5StartBahtStr] = useState(ROUNDING_START_5_BAHT_DEFAULT)
  const [rounding10StartBahtStr, setRounding10StartBahtStr] = useState(ROUNDING_START_10_BAHT_DEFAULT)
  const retailRoundingThresholds = useMemo(
    () => ({
      t5: parseRoundingThreshold(rounding5StartBahtStr, Number(ROUNDING_START_5_BAHT_DEFAULT)),
      t10: parseRoundingThreshold(rounding10StartBahtStr, Number(ROUNDING_START_10_BAHT_DEFAULT)),
    }),
    [rounding5StartBahtStr, rounding10StartBahtStr],
  )
  const priceRoundingInfoTitleId = useId()
  const [productTagIds, setProductTagIds] = useState<string[]>([])
  const [productTagsEpoch, setProductTagsEpoch] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  function setErrorAndScroll(msg: string) {
    setError(msg)
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }
  /** ส่วนมิติ — พับได้; เปิดอัตโนมัติเมื่อแก้ไขสินค้าที่มีมิติ */
  const [dimsOpen, setDimsOpen] = useState(false)
  /** ผู้ใช้เปลี่ยนหมวดในฟอร์มแล้ว — ใช้ป้ายมิติจากหมวดที่เลือก (จัดการหมวด) แทนค่าจาก browseNav */
  const [categoryPickerTouched, setCategoryPickerTouched] = useState(false)
  /** ผูกรถ — พับได้; เปิดเมื่อมีรายการผูกรถตอนแก้ไข/คัดลอก */
  const [vehicleFitOpen, setVehicleFitOpen] = useState(false)
  /** คู่น็อต STL — ตั้งในแฟ้มมาสเตอร์ (หมวด «คู่หัวตามไซส์») */
  const [stlBoltPairNutSku, setStlBoltPairNutSku] = useState('')
  const [stlBoltPairWasherSku, setStlBoltPairWasherSku] = useState('')
  const [stlBoltPairMaleSkusText, setStlBoltPairMaleSkusText] = useState('')

  const main = useMemo(() => categoryTree.find((m) => m.id === mainCatId), [categoryTree, mainCatId])
  /** ตรงกับที่ select หมวดหลักแสดง (มี fallback เป็นหมวดแรก) — ใช้กับย่อย/แท็กเมื่อ state ยังว่าง */
  const effectiveMain = useMemo(() => main ?? categoryTree[0], [main, categoryTree])
  const subcategories = effectiveMain?.subcategories ?? []
  const selectedSub = useMemo(
    () => (subCatId ? subcategories.find((s) => s.id === subCatId) : undefined),
    [subcategories, subCatId],
  )
  const subSubOptions = selectedSub?.subSubcategories ?? []
  const selectedSubSub = useMemo(
    () => (subSubCatId ? subSubOptions.find((x) => x.id === subSubCatId) : undefined),
    [subSubOptions, subSubCatId],
  )

  const showBoltPairSection = useMemo(
    () =>
      resolveBoltHeadGroupBySizeForProduct(
        categoryTree,
        effectiveMain?.name ?? '',
        selectedSub?.name,
        selectedSubSub?.name,
      ),
    [categoryTree, effectiveMain?.name, selectedSub?.name, selectedSubSub?.name],
  )

  const formVis = useMemo(
    () =>
      resolveProductFormFieldVisibility(
        categoryTree,
        effectiveMain?.name ?? '',
        selectedSub?.name,
        selectedSubSub?.name,
      ),
    [categoryTree, effectiveMain?.name, selectedSub?.name, selectedSubSub?.name],
  )

  const showTagsInMasterForm = useMemo(
    () =>
      resolveProductTagsInMasterForm(
        categoryTree,
        effectiveMain?.name ?? '',
        selectedSub?.name,
        selectedSubSub?.name,
      ),
    [categoryTree, effectiveMain?.name, selectedSub?.name, selectedSubSub?.name],
  )

  /**
   * เปิดจากแฟ้มข้อมูลขณะเลือกเมนู «ทั้งหมด» และยังไม่ได้เปลี่ยนหมวดในฟอร์ม —
   * ซ่อนส่วนที่ไม่บังคับ (แท็ก / คู่น็อต / ฟิลเตอร์หมวด ฯลฯ) จนกว่าจะเลือกหมวด
   */
  const deferOptionalCategoryUi = useMemo(
    () =>
      browseNav?.type === 'all' &&
      !categoryPickerTouched &&
      !editingProduct &&
      !copySource,
    [browseNav?.type, categoryPickerTouched, editingProduct, copySource],
  )

  /** หมวดจำกัดแท็กสายยางอ่อน — หน่วย กก./ม้วน ไม่เทียบฐาน (แต่ละม้วนกก.ไม่เท่ากัน) */
  const hoseSoftUnitIndependentUi = useMemo(() => {
    if (deferOptionalCategoryUi) return false
    const allowed = resolveAllowedProductTagIdsForProduct(
      categoryTree,
      effectiveMain?.name ?? '',
      selectedSub?.name,
      selectedSubSub?.name,
    )
    return Boolean(allowed?.includes(HOSE_SOFT_TAG_ID))
  }, [
    deferOptionalCategoryUi,
    categoryTree,
    effectiveMain?.name,
    selectedSub?.name,
    selectedSubSub?.name,
  ])

  /** หมวดจำกัดแท็กนอตสต็อก — โหมดกล่อง+เศษ */
  const nutStockUnitBoxUi = useMemo(() => {
    if (deferOptionalCategoryUi) return false
    const allowed = resolveAllowedProductTagIdsForProduct(
      categoryTree,
      effectiveMain?.name ?? '',
      selectedSub?.name,
      selectedSubSub?.name,
    )
    return Boolean(
      allowed?.includes(NUT_STOCK_TAG_ID) && !allowed?.includes(HOSE_SOFT_TAG_ID),
    )
  }, [
    deferOptionalCategoryUi,
    categoryTree,
    effectiveMain?.name,
    selectedSub?.name,
    selectedSubSub?.name,
  ])

  const selectableProductTags = useMemo((): ProductTagDefinition[] => {
    void productTagsEpoch
    const all = loadProductTagsRegistry()
    const mainName = effectiveMain?.name ?? ''
    if (!showTagsInMasterForm) return []
    if (!mainName.trim()) return all
    const allowed = resolveAllowedProductTagIdsForProduct(
      categoryTree,
      mainName,
      selectedSub?.name,
      selectedSubSub?.name,
    )
    if (allowed === null) return all
    const filtered = all.filter((t) => allowed.includes(t.id))
    // หมวดจำกัดแท็กแต่ id ในหมวดไม่ตรงกับ registry (เช่น แท็กเก่า) — ให้เลือกจากแท็กในระบบได้
    if (filtered.length === 0) return all
    return filtered
  }, [
    categoryTree,
    effectiveMain?.name,
    selectedSub?.name,
    selectedSubSub?.name,
    productTagsEpoch,
    showTagsInMasterForm,
  ])

  useEffect(() => {
    const on = () => setProductTagsEpoch((n) => n + 1)
    window.addEventListener(PRODUCT_TAGS_CHANGED_EVENT, on)
    return () => window.removeEventListener(PRODUCT_TAGS_CHANGED_EVENT, on)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!priceRoundingInfoOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPriceRoundingInfoOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [priceRoundingInfoOpen])

  useEffect(() => {
    if (!showTagsInMasterForm || deferOptionalCategoryUi) return
    const allowedIds = new Set(selectableProductTags.map((t) => t.id))
    setProductTagIds((prev) => prev.filter((id) => allowedIds.has(id)))
  }, [selectableProductTags, showTagsInMasterForm, deferOptionalCategoryUi])

  /** เลือกหมวดที่มีแท็กสายยางอ่อนในฟอร์ม (หลังเปิดจาก «ทั้งหมด») — ตั้งหน่วย กก.+ม้วน */
  useEffect(() => {
    if (!open || editingProduct || copySource) return
    if (deferOptionalCategoryUi) return
    const allowed = resolveAllowedProductTagIdsForProduct(
      categoryTree,
      effectiveMain?.name ?? '',
      selectedSub?.name,
      selectedSubSub?.name,
    )
    if (!allowed?.includes(HOSE_SOFT_TAG_ID)) return
    setSalesUnitRows((prev) => {
      if (
        prev.length === 2 &&
        norm(prev[0].label) === norm('กก.') &&
        norm(prev[1].label) === norm('ม้วน')
      ) {
        return prev
      }
      if (prev.length !== 1 || norm(prev[0].label) !== norm('ชิ้น')) return prev
      const ts = Date.now()
      return [
        { id: `u-${ts}-kg`, label: 'กก.', baseUnits: '1' },
        { id: `u-${ts}-roll`, label: 'ม้วน', baseUnits: '1' },
      ]
    })
    setSplitSale(true)
    setProductTagIds((ids) => (ids.length === 0 ? [HOSE_SOFT_TAG_ID] : ids))
  }, [
    open,
    editingProduct,
    copySource,
    deferOptionalCategoryUi,
    categoryTree,
    effectiveMain?.name,
    selectedSub?.name,
    selectedSubSub?.name,
  ])

  /** หมวดที่มีแท็กนอตสต็อก (ไม่มีสายยางในหมวดเดียวกัน) — โหมดกล่อง+เศษ + แบ่งขาย */
  useEffect(() => {
    if (!open || editingProduct || copySource) return
    if (deferOptionalCategoryUi) return
    const allowed = resolveAllowedProductTagIdsForProduct(
      categoryTree,
      effectiveMain?.name ?? '',
      selectedSub?.name,
      selectedSubSub?.name,
    )
    if (!allowed?.includes(NUT_STOCK_TAG_ID)) return
    if (allowed?.includes(HOSE_SOFT_TAG_ID)) return
    setStockModeChoice('box_piece')
    setStockModeDetailsOpen(true)
    setSplitSale(true)
    setProductTagIds((ids) => (ids.length === 0 ? [NUT_STOCK_TAG_ID] : ids))
  }, [
    open,
    editingProduct,
    copySource,
    deferOptionalCategoryUi,
    categoryTree,
    effectiveMain?.name,
    selectedSub?.name,
    selectedSubSub?.name,
  ])

  const dimLayout: PaperDimLayout = useMemo(() => {
    const fields =
      selectedSubSub?.paperFields ??
      selectedSub?.paperFields ??
      effectiveMain?.paperFields
    const fromForm = dimLayoutFromPaperFields(fields)
    if (editingProduct) return fromForm
    if (copySource) return fromForm
    if (browseNav != null && !categoryPickerTouched) {
      if (browseNav.type === 'all') {
        return dimLayoutFromPaperFields(undefined)
      }
      return dimLayoutFromPaperFields(paperFieldsForNav(categoryTree, browseNav))
    }
    return fromForm
  }, [
    effectiveMain?.paperFields,
    selectedSub?.paperFields,
    selectedSubSub?.paperFields,
    editingProduct,
    copySource,
    browseNav,
    categoryPickerTouched,
    categoryTree,
  ])
  /** ป้องกัน effect re-populate ซ้ำเมื่อ dep อื่น (เช่น browseNav) เปลี่ยนขณะ modal เปิดอยู่ */
  const initKeyRef = useRef<string | null>(null)

  const reset = useCallback((browse?: AddProductBrowseNav) => {
    setSku('')
    setReceiveBonusRules([])
    setBundleRows([])
    setOemText('')
    setFactoryNo('')
    setCrossRefText('')
    setName('')
    setVehicleRows([])
    setBrand('')
    setIsGenuine(false)
    setVatMode('vat')
    setSplitSale(false)
    setShippingCostExcluded(false)
    setStockModeChoice('piece')
    setStockModeDetailsOpen(false)
    setNominalKgRollStr('')
    setNominalMetersRollStr('')
    setPiecesPerBoxStr('')
    {
      const allowedNav = browse
        ? resolveAllowedProductTagIdsForBrowseNav(categoryTree, browse as CategoryBrowseNavForTags)
        : null
      if (allowedNav?.includes(HOSE_SOFT_TAG_ID)) {
        const ts = Date.now()
        setSalesUnitRows([
          { id: `u-${ts}-kg`, label: 'กก.', baseUnits: '1', barcode: '' },
          { id: `u-${ts}-roll`, label: 'ม้วน', baseUnits: '1', barcode: '' },
        ])
        setSplitSale(true)
        if (allowedNav.length === 1 && allowedNav[0] === HOSE_SOFT_TAG_ID) {
          setProductTagIds([HOSE_SOFT_TAG_ID])
        }
      } else if (allowedNav?.includes(NUT_STOCK_TAG_ID) && !allowedNav?.includes(HOSE_SOFT_TAG_ID)) {
        setStockModeChoice('box_piece')
        setStockModeDetailsOpen(true)
        setSplitSale(true)
        setSalesUnitRows([{ id: `u-${Date.now()}`, label: 'ชิ้น', baseUnits: '1', barcode: '' }])
        if (allowedNav.length === 1 && allowedNav[0] === NUT_STOCK_TAG_ID) {
          setProductTagIds([NUT_STOCK_TAG_ID])
        }
      } else {
        setSalesUnitRows([{ id: `u-${Date.now()}`, label: 'ชิ้น', baseUnits: '1', barcode: '' }])
      }
    }
    setQuantityBreakRows([])
    setPackaging('')
    setStorageLocation('')
    setNotes('')
    setPosDisplayNote('')
    setInStoreCatalog(true)
    setSalesStatus('active')
    setCategoryPickerTouched(false)
    if (browse?.type === 'main') {
      setMainCatId(browse.mainId)
      setSubCatId('')
      setSubSubCatId('')
    } else if (browse?.type === 'sub') {
      setMainCatId(browse.mainId)
      setSubCatId(browse.subId)
      setSubSubCatId('')
    } else if (browse?.type === 'subsub') {
      setMainCatId(browse.mainId)
      setSubCatId(browse.subId)
      setSubSubCatId(browse.subSubId)
    } else {
      setMainCatId(categoryTree[0]?.id ?? '')
      setSubCatId('')
      setSubSubCatId('')
    }
    setDimA('')
    setDimB('')
    setDimC('')
    setDimUnit('mm')
    setSupplierListStr('')
    setBuyScheme('1+0')
    setPd1('')
    setPd2('')
    setPd3('')
    setPd4('')
    setCostStr('')
    setCostManualOverride(false)
    setSellRows(Array.from({ length: 4 }, () => ({ markup: '', prices: [''] })))
    setSellTierPercentBasis('cost_markup')
    setPriceRoundingInfoOpen(false)
    setRounding5StartBahtStr(ROUNDING_START_5_BAHT_DEFAULT)
    setRounding10StartBahtStr(ROUNDING_START_10_BAHT_DEFAULT)
    setProductTagIds([])
    setError(null)
    setDimsOpen(false)
    setVehicleFitOpen(false)
    setStlBoltPairNutSku('')
    setStlBoltPairWasherSku('')
    setStlBoltPairMaleSkusText('')
  }, [categoryTree])

  useEffect(() => {
    if (!open || !categoryTree.length) {
      if (!open) initKeyRef.current = null
      return
    }

    // Build a key that captures what we're initializing for.
    // Only re-initialize if this key is different from last time.
    const newKey = editingProduct
      ? `edit:${editingProduct.id}`
      : copySource
        ? `copy:${copySource.id}:${suggestedSku ?? ''}`
        : `new:${browseNav ? JSON.stringify(browseNav) : 'all'}`
    if (initKeyRef.current === newKey) return
    initKeyRef.current = newKey

    if (editingProduct) {
      setCategoryPickerTouched(false)
      const p = editingProduct
      setSku(p.sku)
      setReceiveBonusRules(p.receiveBonusRules ? [...p.receiveBonusRules] : [])
      setBundleRows(p.bundleComponents ? p.bundleComponents.map((c, i) => ({ id: `bc-${i}`, sku: c.sku, qtyStr: String(c.qty) })) : [])
      setOemText(p.oemTags.join('\n'))
      setFactoryNo(p.factoryNo ?? '')
      setCrossRefText((p.crossReferenceTags ?? []).join('\n'))
      setName(p.name)
      setVehicleRows(vehicleRowsFromProduct(p))
      setBrand(p.brand === '—' ? '' : p.brand)
      setIsGenuine(Boolean(p.isGenuine))
      setVatMode(p.vatMode === 'no_vat' ? 'no_vat' : 'vat')
      setSplitSale(Boolean(p.splitSale))
      setShippingCostExcluded(Boolean(p.shippingCostExcluded))
      const sm = p.stockMode
      if (sm === 'kg_roll') {
        setStockModeChoice('kg_roll')
        setNominalKgRollStr(p.nominalKgPerRoll != null ? String(p.nominalKgPerRoll) : '')
        setNominalMetersRollStr('')
        setPiecesPerBoxStr('')
      } else if (sm === 'meter_roll') {
        setStockModeChoice('meter_roll')
        setNominalKgRollStr('')
        setNominalMetersRollStr(p.nominalMetersPerRoll != null ? String(p.nominalMetersPerRoll) : '')
        setPiecesPerBoxStr('')
      } else if (sm === 'box_piece') {
        setStockModeChoice('box_piece')
        setNominalKgRollStr('')
        setNominalMetersRollStr('')
        setPiecesPerBoxStr(p.piecesPerBox != null ? String(p.piecesPerBox) : '')
      } else {
        setStockModeChoice('piece')
        setNominalKgRollStr('')
        setNominalMetersRollStr('')
        setPiecesPerBoxStr('')
      }
      setStockModeDetailsOpen(sm === 'kg_roll' || sm === 'meter_roll' || sm === 'box_piece')
      const nu = normalizeSalesUnits(p)
      setSalesUnitRows(
        nu.map((u, i) => ({
          id: u.id || `u-edit-${i}`,
          label: u.label,
          baseUnits: i === 0 ? '1' : String(u.baseUnits),
          barcode: p.barcodes?.[i]?.code ?? '',
        })),
      )
      // ราคาขั้นบันได — โหลดจากแฟ้มมาสเตอร์
      const qb = p.quantityBreaks?.perUnit ?? []
      setQuantityBreakRows(
        qb.map((u) => {
          const perTier: { [tier: number]: { id: string; minQty: string; price: string }[] } = {}
          if (u.perTierBreaks) {
            for (const [k, rows] of Object.entries(u.perTierBreaks)) {
              perTier[Number(k)] = (rows ?? []).map((r, i) => ({
                id: `qbpt-${u.unitIndex}-${k}-${i}-${Date.now()}`,
                minQty: String(r.minQty),
                price: String(r.price),
              }))
            }
          }
          return {
            unitIndex: u.unitIndex,
            defaultRows: (u.defaultBreaks ?? []).map((r, i) => ({
              id: `qb-${u.unitIndex}-${i}-${Date.now()}`,
              minQty: String(r.minQty),
              price: String(r.price),
            })),
            perTierRows: perTier,
            showPerTier: Object.keys(perTier).length > 0,
          }
        }),
      )
      setPackaging(p.packaging ?? '')
      setStorageLocation(p.storageLocation ?? '')
      setNotes(p.notes ?? '')
      setPosDisplayNote(p.posDisplayNote ?? '')
      setInStoreCatalog(p.inStoreCatalog !== false)
      setSalesStatus(p.salesStatus ?? 'active')
      const pd = p.physicalDimensions
      if (pd) {
        setDimA(pd.innerDiameterMm !== undefined ? formatDimForInput(pd.innerDiameterMm) : '')
        setDimB(pd.outerDiameterMm !== undefined ? formatDimForInput(pd.outerDiameterMm) : '')
        setDimC(pd.heightMm !== undefined ? formatDimForInput(pd.heightMm) : '')
        setDimUnit('mm')
      } else {
        setDimA('')
        setDimB('')
        setDimC('')
        setDimUnit('mm')
      }
      setDimsOpen(Boolean(pd))
      setVehicleFitOpen(vehicleRowsFromProduct(p).length > 0)
      setSupplierListStr(
        p.supplierListPrice !== undefined && p.supplierListPrice > 0 ? formatMoneyInput(p.supplierListPrice) : '',
      )
      const pcts = p.purchaseDiscountPcts ?? [0, 0, 0, 0]
      setPd1(pcts[0] ? String(pcts[0]) : '')
      setPd2(pcts[1] ? String(pcts[1]) : '')
      setPd3(pcts[2] ? String(pcts[2]) : '')
      setPd4(pcts[3] ? String(pcts[3]) : '')
      setBuyScheme(parseBuyScheme(p.scheme)?.normalized ?? p.scheme)
      setCostStr(p.costPrice > 0 ? formatMoneyInput(p.costPrice) : '')
      setCostManualOverride(p.costPrice > 0 || Boolean(p.costEnteredManually))
      setCostSource('manual')
      const nCols = Math.max(1, nu.length)
      const tiers = p.sellPriceTiers ?? []
      setSellTierPercentBasis(p.sellTierPercentBasis === 'list_discount' ? 'list_discount' : 'cost_markup')
      setSellRows(
        Array.from({ length: 4 }, (_, i) => {
          const t = tiers[i]
          if (!t) return { markup: '', prices: Array(nCols).fill('') }
          const listMode = p.sellTierPercentBasis === 'list_discount'
          const markup = listMode
            ? t.supplierListSignedPercent !== undefined && t.supplierListSignedPercent !== 0
              ? String(t.supplierListSignedPercent)
              : t.discountFromSupplierListPercent !== undefined && t.discountFromSupplierListPercent > 0
                ? `-${t.discountFromSupplierListPercent}`
                : ''
            : t.markupFromCostPercent !== undefined && t.markupFromCostPercent !== 0
              ? String(t.markupFromCostPercent)
              : ''
          const prices = Array.from({ length: nCols }, (_, pi) => {
            const ex = t.explicitUnitPrices?.[pi]
            if (ex !== undefined && ex > 0) return formatMoneyInput(ex)
            if (pi === 0 && t.explicitSmallUnitPrice !== undefined && t.explicitSmallUnitPrice > 0) {
              return formatMoneyInput(t.explicitSmallUnitPrice)
            }
            if (pi === 1 && t.explicitLargeUnitPrice !== undefined && t.explicitLargeUnitPrice > 0) {
              return formatMoneyInput(t.explicitLargeUnitPrice)
            }
            return ''
          })
          return { markup, prices }
        }),
      )
      const main = categoryTree.find((m) => norm(m.name) === norm(p.category))
      setMainCatId(main?.id ?? categoryTree[0]?.id ?? '')
      const sub = p.subCategory
        ? main?.subcategories.find((s) => norm(s.name) === norm(p.subCategory!))
        : undefined
      setSubCatId(sub?.id ?? '')
      if (sub && p.subSubCategory) {
        const ss = sub.subSubcategories.find((x) => norm(x.name) === norm(p.subSubCategory!))
        setSubSubCatId(ss?.id ?? '')
      } else {
        setSubSubCatId('')
      }
      setProductTagIds(p.productTagIds?.length ? [...p.productTagIds] : [])
      setStlBoltPairNutSku(p.stlBoltPairNutSku?.trim() ?? '')
      setStlBoltPairWasherSku(p.stlBoltPairWasherSku?.trim() ?? '')
      setStlBoltPairMaleSkusText((p.stlBoltPairMaleSkus ?? []).join('\n'))
      setError(null)
      return
    }

    if (!copySource) {
      reset(browseNav)
      return
    }

    // โหมดคัดลอก: ดึงเฉพาะข้อมูลหลัก + เลือกหมวดเดิม + ตั้ง SKU ใหม่
    setName(copySource.name)
    setVehicleRows(vehicleRowsFromProduct(copySource))
    setBrand(copySource.brand)
    const nu = normalizeSalesUnits(copySource)
    setSalesUnitRows(
      nu.map((u, i) => ({
        id: `u-copy-${i}-${u.id}`,
        label: u.label,
        baseUnits: i === 0 ? '1' : String(u.baseUnits),
        barcode: '',
      })),
    )
    setOemText('')
    setFactoryNo('')
    setCrossRefText('')
    setIsGenuine(Boolean(copySource.isGenuine))
    setVatMode(copySource.vatMode === 'no_vat' ? 'no_vat' : 'vat')
    setSplitSale(Boolean(copySource.splitSale))
    setShippingCostExcluded(Boolean(copySource.shippingCostExcluded))
    const csm = copySource.stockMode
    if (csm === 'kg_roll') {
      setStockModeChoice('kg_roll')
      setNominalKgRollStr(copySource.nominalKgPerRoll != null ? String(copySource.nominalKgPerRoll) : '')
      setNominalMetersRollStr('')
      setPiecesPerBoxStr('')
    } else if (csm === 'meter_roll') {
      setStockModeChoice('meter_roll')
      setNominalKgRollStr('')
      setNominalMetersRollStr(
        copySource.nominalMetersPerRoll != null ? String(copySource.nominalMetersPerRoll) : '',
      )
      setPiecesPerBoxStr('')
    } else if (csm === 'box_piece') {
      setStockModeChoice('box_piece')
      setNominalKgRollStr('')
      setNominalMetersRollStr('')
      setPiecesPerBoxStr(copySource.piecesPerBox != null ? String(copySource.piecesPerBox) : '')
    } else {
      setStockModeChoice('piece')
      setNominalKgRollStr('')
      setNominalMetersRollStr('')
      setPiecesPerBoxStr('')
    }
    setStockModeDetailsOpen(csm === 'kg_roll' || csm === 'meter_roll' || csm === 'box_piece')
    setPackaging('')
    setStorageLocation('')
    setNotes(copySource.notes ?? '')
    setPosDisplayNote(copySource.posDisplayNote ?? '')
    setInStoreCatalog(copySource.inStoreCatalog !== false)
    setSalesStatus(copySource.salesStatus ?? 'active')
    setDimA('')
    setDimB('')
    setDimC('')
    setDimUnit('mm')
    setDimsOpen(false)
    setVehicleFitOpen(vehicleRowsFromProduct(copySource).length > 0)
    setSupplierListStr('')
    setBuyScheme(parseBuyScheme(copySource.scheme)?.normalized ?? '1+0')
    setPd1('')
    setPd2('')
    setPd3('')
    setPd4('')
    setCostStr('')
    setCostManualOverride(false)
    const colN = Math.max(1, nu.length)
    setSellRows(Array.from({ length: 4 }, () => ({ markup: '', prices: Array(colN).fill('') })))
    const main = categoryTree.find((m) => norm(m.name) === norm(copySource.category))
    const mid = main?.id ?? categoryTree[0].id
    setMainCatId(mid)
    const sub = copySource.subCategory
      ? main?.subcategories.find((s) => norm(s.name) === norm(copySource.subCategory!))
      : undefined
    setSubCatId(sub?.id ?? '')
    if (sub && copySource.subSubCategory) {
      const ss = sub.subSubcategories.find((x) => norm(x.name) === norm(copySource.subSubCategory!))
      setSubSubCatId(ss?.id ?? '')
    } else {
      setSubSubCatId('')
    }
    setProductTagIds(copySource.productTagIds?.length ? [...copySource.productTagIds] : [])
    setStlBoltPairNutSku(copySource.stlBoltPairNutSku?.trim() ?? '')
    setStlBoltPairWasherSku(copySource.stlBoltPairWasherSku?.trim() ?? '')
    setStlBoltPairMaleSkusText((copySource.stlBoltPairMaleSkus ?? []).join('\n'))
    setSku(suggestedSku ?? '')
    setReceiveBonusRules(copySource.receiveBonusRules ? [...copySource.receiveBonusRules] : [])
    setBundleRows(copySource.bundleComponents ? copySource.bundleComponents.map((c, i) => ({ id: `bc-copy-${i}`, sku: c.sku, qtyStr: String(c.qty) })) : [])
    setError(null)
    setCategoryPickerTouched(true)
  }, [open, categoryTree, reset, copySource, suggestedSku, editingProduct, browseNav])

  useEffect(() => {
    const n = Math.max(1, salesUnitRows.length)
    setSellRows((rows) =>
      rows.map((r) => {
        const p = [...r.prices]
        while (p.length < n) p.push('')
        if (p.length > n) p.length = n
        return { ...r, prices: p }
      }),
    )
  }, [salesUnitRows.length])

  const addSalesUnit = useCallback(() => {
    const nid = `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setSalesUnitRows((prev) => [...prev, { id: nid, label: '', baseUnits: '1', barcode: '' }])
  }, [])

  const removeSalesUnit = useCallback((idx: number) => {
    setSalesUnitRows((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== idx)
    })
  }, [])

  const pctsPreview: [number, number, number, number] = [parsePct(pd1), parsePct(pd2), parsePct(pd3), parsePct(pd4)]
  const listPPreview = parseMoney(supplierListStr)
  const schemePreview = parseBuyScheme(buyScheme)
  const vatMultiplier = vatMode === 'no_vat' ? 1 : 1 + VAT_RATE
  const autoCostPreview =
    listPPreview !== undefined && listPPreview > 0
      ? Math.round(
          ((computeCostFromSupplierList(listPPreview, pctsPreview) * vatMultiplier) /
            Math.max(1, schemePreview?.effectiveQty ?? 1)) *
            100,
        ) / 100
      : null

  useEffect(() => {
    if (costManualOverride) return
    if (autoCostPreview === null) {
      setCostStr('')
      return
    }
    setCostStr(String(autoCostPreview))
  }, [autoCostPreview, costManualOverride])

  if (!open) return null

  function parseDimInput(s: string): number | undefined {
    const n = parseDim(s)
    if (n === undefined) return undefined
    const mm = dimUnit === 'hun' ? n * MM_PER_HUN : n
    return Math.round(mm * 1000) / 1000
  }

  function handleDimUnitChange(next: DimUnit) {
    if (next === dimUnit) return
    setDimA((v) => convertDimStringUnit(v, dimUnit, next))
    setDimB((v) => convertDimStringUnit(v, dimUnit, next))
    setDimC((v) => convertDimStringUnit(v, dimUnit, next))
    setDimUnit(next)
  }

  function doSave() {
    try {
    const isEdit = Boolean(editingProduct)
    const skuTrim = sku.trim()
    const nameTrim = name.trim()
    if (!skuTrim) {
      setErrorAndScroll('กรุณากรอกรหัสสินค้า')
      return
    }
    const skuLower = skuTrim.toLowerCase()
    const prevSkuLower = editingProduct?.sku.trim().toLowerCase() ?? ''
    if (skuLower !== prevSkuLower && existingSkus.has(skuLower)) {
      setErrorAndScroll('รหัสสินค้านี้มีในระบบแล้ว — เปลี่ยนรหัสหรือแก้สินค้าเดิม')
      return
    }
    for (const row of salesUnitRows) {
      const bc = row.barcode?.trim()
      if (bc && checkBarcodeConflicts?.(bc)) {
        setErrorAndScroll(`บาร์โค้ด "${bc}" ซ้ำกับรหัสหรือบาร์โค้ดของสินค้าอื่น`)
        return
      }
    }
    const branch = getStoredBranch()
    if (!branch?.id) {
      setErrorAndScroll('ไม่พบสาขาที่ล็อกอิน — กรุณาเลือกสาขาใหม่')
      return
    }
    const branchId = branch.id
    if (!nameTrim) {
      setErrorAndScroll('กรุณากรอกชื่อสินค้า')
      return
    }
    const hasAnyDim =
      dimLayout.slotCount === 2
        ? Boolean(dimB.trim() || dimC.trim())
        : dimLayout.slotCount === 3
          ? Boolean(dimA.trim() || dimB.trim() || dimC.trim())
          : Boolean(dimA.trim() || dimB.trim() || dimC.trim())
    const b = parseDimInput(dimB)
    const c = parseDimInput(dimC)
    if (formVis.showPhysicalDimensions && !deferOptionalCategoryUi && hasAnyDim) {
      if (dimLayout.slotCount === 2) {
        if (b === undefined && c === undefined) {
          setErrorAndScroll('ถ้ากรอกมิติ ต้องกรอกอย่างน้อย 1 ช่อง (มม.) ให้ถูกต้อง')
          return
        }
      } else if (b === undefined || c === undefined) {
        setErrorAndScroll('ถ้ากรอกมิติ ต้องกรอกค่าช่อง B และ C (มม.) ให้ครบ')
        return
      }
    }
    const effectiveMainId = mainCatId.trim() || categoryTree[0]?.id
    const m = effectiveMainId ? categoryTree.find((x) => x.id === effectiveMainId) : undefined
    if (!m) {
      setErrorAndScroll('เลือกหมวดหมู่หลัก')
      return
    }
    const sub = subCatId ? m.subcategories.find((s) => s.id === subCatId) : undefined
    const subSub =
      sub && subSubCatId ? sub.subSubcategories.find((ss) => ss.id === subSubCatId) : undefined
    if (subSubCatId && sub && !subSub) {
      setErrorAndScroll('หมวดย่อย 2 ไม่ถูกต้อง — เลือกใหม่หรือเว้นว่าง')
      return
    }

    const oemTags =
      formVis.showOemTags && !deferOptionalCategoryUi
        ? splitTags(oemText)
        : isEdit
          ? [...(editingProduct?.oemTags ?? [])]
          : []
    const factoryNoTrim = factoryNo.trim()
    const crossRefResolved =
      formVis.showCrossRef && !deferOptionalCategoryUi
        ? splitTags(crossRefText)
        : isEdit
          ? [...(editingProduct?.crossReferenceTags ?? [])]
          : []
    const crossReferenceTags = crossRefResolved.length ? crossRefResolved : undefined
    const id = isEdit ? editingProduct!.id : `pm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    const parsedScheme = parseBuyScheme(buyScheme) ?? { normalized: '1+0', buyQty: 1, freeQty: 0, effectiveQty: 1 }
    const costPrice = parseMoney(costStr) ?? editingProduct?.costPrice ?? 0

    const salesUnitsAligned: SalesUnit[] = salesUnitRows.map((row, i) => {
      const label = row.label.trim() || `หน่วย${i + 1}`
      const baseUnits =
        i === 0
          ? 1
          : Math.max(1, Math.round(Number(String(row.baseUnits).replace(',', '.')) || 1))
      return { id: row.id || `u-${id}-${i}`, label, baseUnits, barcode: row.barcode?.trim() || undefined }
    })
    const derivedBarcodes: BarcodeEntry[] = salesUnitsAligned
      .filter((u) => u.barcode)
      .map((u) => ({ code: u.barcode!, qtyPerScan: u.baseUnits }))
    const nCols = Math.max(1, salesUnitsAligned.length)

    /** บรรจุใช้เพื่อแสดงผลเท่านั้น — ไม่ใช้คำนวณราคาขาย */
    const packPieces = 1
    const sellTiersParsed: SellPriceTier[] = sellRows.map((r) => {
      const signed = parseSignedTierPercent(r.markup)
      const unitPrices = r.prices.slice(0, nCols).map((p) => parseMoney(p))
      const hasExplicit = unitPrices.some((x) => x !== undefined && x > 0)
      const explicitUnitPrices: number[] | undefined = hasExplicit
        ? unitPrices.map((x) => (x !== undefined && x > 0 ? Math.round(x * 100) / 100 : 0))
        : undefined
      const ev = explicitUnitPrices?.some((p) => p > 0) ? explicitUnitPrices : undefined
      return {
        price: 0,
        discountPercent: 0,
        markupFromCostPercent:
          sellTierPercentBasis === 'cost_markup' && signed !== 0 ? signed : undefined,
        discountFromSupplierListPercent: undefined,
        supplierListSignedPercent:
          sellTierPercentBasis === 'list_discount' && signed !== 0 ? signed : undefined,
        explicitUnitPrices: ev,
        explicitSmallUnitPrice: ev?.[0] && ev[0] > 0 ? ev[0] : undefined,
        explicitLargeUnitPrice: ev?.[1] && ev[1] > 0 ? ev[1] : undefined,
      }
    })

    const listP = parseMoney(supplierListStr.trim())
    const pricingCtxSubmit = {
      supplierListPrice: listP !== undefined && listP > 0 ? listP : undefined,
      sellTierPercentBasis,
      listPricePiecesPerListUnit: parsedScheme.effectiveQty,
    }
    const r0 = sellRows[0]
    const signed0 = parseSignedTierPercent(r0.markup)
    const hasManualPrice0 = r0.prices[0]?.trim().length !== 0
    const tier0RetailUsesPercentOnly = signed0 !== 0 && !hasManualPrice0
    if (tier0RetailUsesPercentOnly && sellTiersParsed.length > 0) {
      const raw0 = sellPriceSmallUnitFromTier(sellTiersParsed[0], costPrice, packPieces, pricingCtxSubmit)
      if (raw0 !== null && raw0 > 0) {
        const rounded0 = applyRetailPriceRounding(
          raw0,
          parseRoundingThreshold(rounding5StartBahtStr, Number(ROUNDING_START_5_BAHT_DEFAULT)),
          parseRoundingThreshold(rounding10StartBahtStr, Number(ROUNDING_START_10_BAHT_DEFAULT)),
        )
        const t0 = sellTiersParsed[0]
        const ev0 = t0.explicitUnitPrices
        const hasExplicitOtherUnits = ev0 !== undefined && ev0.some((v, idx) => idx >= 1 && v > 0)
        if (hasExplicitOtherUnits && ev0) {
          const next = ev0.slice()
          while (next.length < nCols) next.push(0)
          next[0] = rounded0
          sellTiersParsed[0] = {
            ...t0,
            explicitUnitPrices: next,
            explicitSmallUnitPrice: next[0] > 0 ? next[0] : undefined,
            explicitLargeUnitPrice: next[1] && next[1] > 0 ? next[1] : undefined,
          }
        } else {
          sellTiersParsed[0] = {
            ...t0,
            explicitSmallUnitPrice: rounded0,
            explicitUnitPrices: undefined,
            explicitLargeUnitPrice: undefined,
          }
        }
      }
    }

    // ระดับราคาอื่น (อู่/ร้านค้า/VIP): ปัดเศษทศนิยมให้เป็นจำนวนเต็ม เฉพาะกรณีคำนวณจาก ±% (ไม่ได้ใส่ราคาตรง)
    for (let tierIndex = 1; tierIndex < Math.min(4, sellRows.length, sellTiersParsed.length); tierIndex++) {
      const r = sellRows[tierIndex]
      const signed = parseSignedTierPercent(r.markup)
      const hasManualPrice = r.prices[0]?.trim().length !== 0
      if (signed === 0 || hasManualPrice) continue
      const raw = sellPriceSmallUnitFromTier(sellTiersParsed[tierIndex], costPrice, packPieces, pricingCtxSubmit)
      if (raw === null || raw <= 0) continue
      const rounded = applyNonRetailIntegerRounding(raw)
      const t = sellTiersParsed[tierIndex]
      const ev = t.explicitUnitPrices
      const hasExplicitOtherUnits = ev !== undefined && ev.some((v, idx) => idx >= 1 && v > 0)
      if (hasExplicitOtherUnits && ev) {
        const next = ev.slice()
        while (next.length < nCols) next.push(0)
        next[0] = rounded
        sellTiersParsed[tierIndex] = {
          ...t,
          explicitUnitPrices: next,
          explicitSmallUnitPrice: next[0] > 0 ? next[0] : undefined,
          explicitLargeUnitPrice: next[1] && next[1] > 0 ? next[1] : undefined,
        }
      } else {
        sellTiersParsed[tierIndex] = {
          ...t,
          explicitSmallUnitPrice: rounded,
          explicitUnitPrices: undefined,
          explicitLargeUnitPrice: undefined,
        }
      }
    }

    const sellPriceTiers = sellTiersParsed.some(
      (t) =>
        (t.markupFromCostPercent ?? 0) !== 0 ||
        (t.supplierListSignedPercent ?? 0) !== 0 ||
        (t.discountFromSupplierListPercent ?? 0) > 0 ||
        (t.explicitUnitPrices?.some((p) => p > 0) ?? false),
    )
      ? sellTiersParsed
      : undefined
    const sellPrice = primarySellPriceFromTiers(sellTiersParsed, costPrice, packPieces, pricingCtxSubmit)

    let physicalDimensions: PhysicalDimensions | undefined
    if (formVis.showPhysicalDimensions && !deferOptionalCategoryUi) {
      const a = parseDimInput(dimA)
      if (dimLayout.slotCount === 2) {
        if (b !== undefined || c !== undefined) {
          physicalDimensions = {
            ...(b !== undefined ? { outerDiameterMm: b } : {}),
            ...(c !== undefined ? { heightMm: c } : {}),
          }
        }
      } else if (b !== undefined && c !== undefined) {
        physicalDimensions = {
          outerDiameterMm: b,
          heightMm: c,
          ...(a !== undefined ? { innerDiameterMm: a } : {}),
        }
      }
    } else if (isEdit) {
      physicalDimensions = editingProduct?.physicalDimensions
    }

    const vehicleFitments: VehicleFitmentRef[] | undefined = formVis.showVehicleFitment &&
      !deferOptionalCategoryUi
      ? vehicleRows.length > 0
        ? vehicleRows.map((r) => ({
            id: r.id,
            categoryId: r.categoryId,
            categoryLabel: r.categoryLabel,
            brandId: r.brandId,
            brandName: r.brandName,
            modelId: r.modelId,
            modelName: r.modelName,
            engineId: r.engineId,
            engineLabel: r.engineLabel,
            ...(r.engineText ? { engineText: r.engineText } : {}),
            ...(r.yearRangeText ? { yearRangeText: r.yearRangeText } : {}),
            ...(r.yearFrom != null ? { yearFrom: r.yearFrom } : {}),
            ...(r.yearTo != null ? { yearTo: r.yearTo } : {}),
            ...(r.driveType ? { driveType: r.driveType } : {}),
            ...(r.engineCode ? { engineCode: r.engineCode } : {}),
            ...(r.brakePosition === 'front' || r.brakePosition === 'rear'
              ? { brakePosition: r.brakePosition }
              : {}),
          }))
        : undefined
      : isEdit
        ? editingProduct?.vehicleFitments
        : undefined

    const derived =
      vehicleFitments && vehicleFitments.length > 0
        ? deriveVehicleSummaryFromFitments(vehicleFitments)
        : null

    const carBrandOut = derived?.carBrand ?? '—'
    const carModelLabelOut = derived?.carModelLabel ?? '—'
    const yearLabelOut = derived?.yearLabel ?? '—'
    const carModels = derived?.carModels ?? []

    const prev = editingProduct
    const latestForMeta = getProductMasterById(id)
    const masterMeta = buildNextMasterEditMetadata(latestForMeta, branchId, getStaffUsername())

    const crossBranchNormalized = prev?.crossBranch?.length
      ? normalizeCrossBranchRows(prev.crossBranch)
      : defaultCrossBranchRowsForNewProduct(id)
    const crossBranch = applyStorageLocationToCrossBranch(
      crossBranchNormalized,
      storageLocation.trim(),
      branchId,
    )

    const allowedTagSet = new Set(selectableProductTags.map((t) => t.id))
    const productTagsFiltered =
      showTagsInMasterForm && !deferOptionalCategoryUi
        ? productTagIds.filter((id) => allowedTagSet.has(id))
        : isEdit
          ? [...(editingProduct?.productTagIds ?? [])]
          : []

    const boltHeadCat = resolveBoltHeadGroupBySizeForProduct(categoryTree, m.name, sub?.name, subSub?.name)
    const maleSkusParsed = parseBoltMaleSkuLines(stlBoltPairMaleSkusText)

    if (stockModeChoice === 'kg_roll') {
      const nk = Number(String(nominalKgRollStr).replace(',', '.'))
      if (!Number.isFinite(nk) || nk <= 0) {
        setErrorAndScroll('โหมดม้วน/กก. — กรอก กก. ต่อม้วนให้มากกว่า 0')
        return
      }
    }
    if (stockModeChoice === 'meter_roll') {
      const nm = Number(String(nominalMetersRollStr).replace(',', '.'))
      if (!Number.isFinite(nm) || nm <= 0) {
        setErrorAndScroll('โหมดม้วน/เมตร — กรอก เมตร ต่อม้วนให้มากกว่า 0')
        return
      }
    }
    if (stockModeChoice === 'box_piece') {
      const pb = Math.floor(Number(String(piecesPerBoxStr).replace(',', '.')) || 0)
      if (!Number.isFinite(pb) || pb < 1) {
        setErrorAndScroll('โหมดกล่อง+ตัว — กรอกชิ้นต่อกล่องเป็นจำนวนเต็มตั้งแต่ 1')
        return
      }
    }
    const nominalKgResolved =
      stockModeChoice === 'kg_roll'
        ? Math.round(Number(String(nominalKgRollStr).replace(',', '.')) * 1000) / 1000
        : undefined
    const nominalMetersResolved =
      stockModeChoice === 'meter_roll'
        ? Math.round(Number(String(nominalMetersRollStr).replace(',', '.')) * 1000) / 1000
        : undefined
    const piecesPerBoxResolved =
      stockModeChoice === 'box_piece'
        ? Math.max(1, Math.floor(Number(String(piecesPerBoxStr).replace(',', '.')) || 0))
        : undefined

    // Build qty-break config from UI state — drop empty rows / invalid numbers
    const parsedQtyBreaks: QuantityBreaksConfig | undefined = (() => {
      const cleanRows = (raws: { minQty: string; price: string }[]): QuantityBreakRow[] =>
        raws
          .map((r) => ({
            minQty: Math.floor(Number(String(r.minQty).replace(',', '.')) || 0),
            price: Math.round((Number(String(r.price).replace(',', '.')) || 0) * 100) / 100,
          }))
          .filter((r) => r.minQty > 0 && r.price > 0)
          .sort((a, b) => a.minQty - b.minQty)
      const perUnit: QuantityBreaksForUnit[] = []
      for (const cfg of quantityBreakRows) {
        const def = cleanRows(cfg.defaultRows)
        const perTier: { [t: number]: QuantityBreakRow[] } = {}
        for (const [k, raws] of Object.entries(cfg.perTierRows)) {
          const cleaned = cleanRows(raws ?? [])
          if (cleaned.length > 0) perTier[Number(k)] = cleaned
        }
        if (def.length === 0 && Object.keys(perTier).length === 0) continue
        perUnit.push({
          unitIndex: cfg.unitIndex,
          defaultBreaks: def.length > 0 ? def : undefined,
          perTierBreaks: Object.keys(perTier).length > 0 ? perTier : undefined,
        })
      }
      return perUnit.length > 0 ? { perUnit } : undefined
    })()

    const product: ProductMasterDetail = {
      ...(prev ?? {}),
      id,
      sku: skuTrim,
      barcodes: derivedBarcodes.length > 0 ? derivedBarcodes : undefined,
      receiveBonusRules: receiveBonusRules.filter((r) => r.bonusSku.trim()).length > 0
        ? receiveBonusRules.filter((r) => r.bonusSku.trim())
        : undefined,
      bundleComponents: bundleRows.filter((r) => r.sku.trim()).length > 0
        ? bundleRows.filter((r) => r.sku.trim()).map((r) => ({ sku: r.sku.trim(), qty: Math.max(1, Math.round(Number(r.qtyStr) || 1)) }))
        : undefined,
      name: nameTrim,
      brand: brand.trim() || '—',
      category: m.name,
      subCategory: sub?.name,
      subSubCategory: subSub ? subSub.name : undefined,
      carBrand: carBrandOut,
      carModelLabel: carModelLabelOut,
      yearLabel: yearLabelOut,
      oemTags,
      factoryNo:
        formVis.showFactoryNo && !deferOptionalCategoryUi
          ? factoryNoTrim || undefined
          : isEdit
            ? editingProduct?.factoryNo
            : undefined,
      crossReferenceTags,
      carModels,
      vehicleFitments,
      costPrice,
      scheme: parsedScheme.normalized,
      avgCost: (editingProduct?.avgCost ?? 0) > 0 ? editingProduct!.avgCost : costPrice,
      sellPrice,
      vatMode: undefined,
      supplierListPrice: undefined,
      purchaseDiscountPcts: undefined,
      costEnteredManually: costManualOverride || costPrice > 0 ? true : undefined,
      sellTierPercentBasis: sellTierPercentBasis === 'list_discount' ? 'list_discount' : undefined,
      sellPriceTiers,
      quantityBreaks: parsedQtyBreaks,
      isGenuine: isGenuine || undefined,
      salesUnits: salesUnitsAligned,
      packaging: packaging.trim() || undefined,
      storageLocation: storageLocation.trim() || undefined,
      notes: notes.trim() || undefined,
      posDisplayNote: posDisplayNote.trim() || undefined,
      stockMode: stockModeChoice === 'piece' ? undefined : stockModeChoice,
      nominalKgPerRoll:
        stockModeChoice === 'kg_roll' && nominalKgResolved != null && nominalKgResolved > 0
          ? nominalKgResolved
          : undefined,
      nominalMetersPerRoll:
        stockModeChoice === 'meter_roll' && nominalMetersResolved != null && nominalMetersResolved > 0
          ? nominalMetersResolved
          : undefined,
      piecesPerBox:
        stockModeChoice === 'box_piece' && piecesPerBoxResolved != null && piecesPerBoxResolved > 0
          ? piecesPerBoxResolved
          : undefined,
      inStoreCatalog: inStoreCatalog ? undefined : false,
      salesStatus: salesStatus === 'active' ? undefined : salesStatus,
      physicalDimensions,
      splitSale: splitSale || undefined,
      shippingCostExcluded: shippingCostExcluded || undefined,
      crossBranch,
      productTagIds: productTagsFiltered.length > 0 ? productTagsFiltered : undefined,
      stlBoltPairNutSku:
        boltHeadCat && !deferOptionalCategoryUi && stlBoltPairNutSku.trim()
          ? stlBoltPairNutSku.trim()
          : undefined,
      stlBoltPairWasherSku:
        boltHeadCat && !deferOptionalCategoryUi && stlBoltPairWasherSku.trim()
          ? stlBoltPairWasherSku.trim()
          : undefined,
      stlBoltPairMaleSkus:
        boltHeadCat && !deferOptionalCategoryUi ? maleSkusParsed : undefined,
      ...masterMeta,
    }

    if (isEdit && onUpdate) {
      onUpdate(product)
    } else {
      onCreate(product)
    }
    reset()
    onClose()
    } catch (err) {
      setErrorAndScroll(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    doSave()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-2 sm:p-3 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-product-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 bg-white px-3 py-2 sm:px-4">
          <div className="min-w-0">
            <h2 id="add-product-title" className="text-sm font-semibold text-slate-900 sm:text-base">
              {editingProduct ? 'แก้ไขสินค้า' : copySource ? 'เพิ่มสินค้า (คัดลอก)' : 'เพิ่มสินค้า'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              reset()
              onClose()
            }}
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="ปิด"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2 sm:px-4">
            {error ? (
              <p className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-sm text-rose-800">{error}</p>
            ) : null}
            {copySource ? (
              <p className="mb-1.5 rounded-md border border-sky-200 bg-sky-50/90 px-2 py-1 text-[10px] leading-snug text-sky-950">
                จากคัดลอก: ใช้ข้อมูลหลักเดิมและรหัสใหม่ <span className="font-mono font-medium">10 หลัก</span>
              </p>
            ) : null}

            <div className="grid gap-2 lg:grid-cols-2 lg:items-start lg:gap-3">
              <div className={sectionClass}>
                <div className="flex items-start gap-3">
                  <p className={clsx(sectionTitleClass, 'flex-1')}>ข้อมูลหลัก</p>
                  {isTauri() && <ProductImageGallery sku={sku} mainSize="sm" />}
                </div>
                <label className="block min-w-0">
                  <span className={labelClass}>รหัสสินค้า *</span>
                  <input
                    className={inputClass}
                    value={sku}
                    onChange={(e) => {
                      setSku(e.target.value)
                      setError(null)
                    }}
                    placeholder="เช่น ABC-12345"
                    autoComplete="off"
                  />
                  {sku.trim() &&
                  (!editingProduct || sku.trim().toLowerCase() !== editingProduct.sku.trim().toLowerCase()) &&
                  existingSkus.has(sku.trim().toLowerCase()) ? (
                    <p className="mt-0.5 text-[10px] leading-snug text-amber-800">
                      รหัสนี้มีในระบบแล้ว — เปลี่ยนรหัสหรือแก้สินค้าเดิม
                    </p>
                  ) : null}
                </label>

                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-12 sm:items-end">
                  <label className="block min-w-0 sm:col-span-7">
                    <span className={labelClass}>ชื่อสินค้า *</span>
                    <input
                      className={inputClass}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        setError(null)
                      }}
                    />
                  </label>
                  <div className="flex min-w-0 items-end gap-2 sm:col-span-5">
                    <label className="block min-w-0 sm:w-44">
                      <span className={labelClass}>บริษัท / แบรนด์ชิ้นงาน</span>
                      <input className={inputClass} value={brand} onChange={(e) => setBrand(e.target.value)} />
                    </label>
                    <label className="mb-1 flex cursor-pointer items-center gap-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isGenuine}
                        onChange={(e) => setIsGenuine(e.target.checked)}
                        className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-800">แท้</span>
                    </label>
                  </div>
                </div>

                {!deferOptionalCategoryUi &&
                (formVis.showOemTags || formVis.showCrossRef || formVis.showFactoryNo) ? (
                  <div className="mt-1.5 rounded-md border border-slate-200 bg-white p-1.5">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {formVis.showOemTags ? (
                        <label className="flex min-w-0 flex-col">
                          <span className={labelClass}>เบอร์แท้ (OEM)</span>
                          <textarea
                            className={clsx(inputClass, 'min-h-[2.25rem] resize-y overflow-y-auto leading-snug')}
                            rows={2}
                            value={oemText}
                            onChange={(e) => setOemText(e.target.value)}
                            placeholder="หลายเบอร์: คั่นด้วย , หรือขึ้นบรรทัดใหม่"
                          />
                        </label>
                      ) : null}
                      {formVis.showCrossRef ? (
                        <label className="flex min-w-0 flex-col">
                          <span className={labelClass}>เบอร์เทียบ (Cross reference)</span>
                          <textarea
                            className={clsx(inputClass, 'min-h-[2.25rem] resize-y overflow-y-auto leading-snug')}
                            rows={2}
                            value={crossRefText}
                            onChange={(e) => setCrossRefText(e.target.value)}
                            placeholder="หลายเบอร์: คั่นด้วย , หรือขึ้นบรรทัดใหม่"
                          />
                        </label>
                      ) : null}
                    </div>
                    {formVis.showFactoryNo ? (
                      <label className="mt-2 block min-w-0 sm:max-w-[12.5rem]">
                        <span className={labelClass}>เบอร์โรงงาน</span>
                        <input
                          className={inputClass}
                          value={factoryNo}
                          onChange={(e) => setFactoryNo(e.target.value)}
                          placeholder="เช่น 1-OTT130"
                        />
                      </label>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-1.5 rounded-md border border-slate-200 bg-white p-1.5">
                  <p className={sectionTitleClass}>หน่วยขาย</p>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                    <p className="min-w-0 flex-1 text-[10px] leading-snug text-slate-500">
                      {hoseSoftUnitIndependentUi ? (
                        <>
                          หมวดจำกัดแท็ก <span className="font-medium text-teal-800">สายยางอ่อน</span> — หน่วยเริ่มต้น{' '}
                          <span className="font-medium text-slate-700">กก.</span> กับ{' '}
                          <span className="font-medium text-slate-700">ม้วน</span> ไม่มีอัตราเทียบฐาน (แต่ละม้วนกก.ไม่เท่ากัน)
                          — ตั้งราคา <span className="font-medium text-slate-700">แยกต่อหน่วย</span> ในตารางระดับราคาด้านล่าง
                        </>
                      ) : nutStockUnitBoxUi ? (
                        <>
                          หมวดจำกัดแท็ก <span className="font-medium text-amber-900">นอตสต็อก</span> — โหมดสต็อกเริ่มต้น{' '}
                          <span className="font-medium text-slate-700">กล่อง + เศษตัว</span> เปิดโหมดละเอียดด้านล่างแล้ว — กรอก{' '}
                          <span className="font-medium text-slate-700">ชิ้นต่อกล่อง</span> ให้ตรงกล่องจริง
                        </>
                      ) : (
                        <>
                          หน่วยแรกเป็นหน่วยฐาน (เช่น ชิ้น) · &quot;เทียบฐาน&quot; = 1 หน่วยนี้เท่ากับกี่หน่วยฐาน
                        </>
                      )}
                    </p>
                    <label className="flex shrink-0 cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={splitSale}
                        onChange={(e) => setSplitSale(e.target.checked)}
                        className="size-4 shrink-0 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs font-medium text-slate-800">สินค้าแบ่งขาย</span>
                    </label>
                  </div>
                  <details
                    className="mt-2 rounded-md border border-teal-100 bg-teal-50/40 p-2"
                    open={stockModeDetailsOpen}
                    onToggle={(e) => setStockModeDetailsOpen(e.currentTarget.open)}
                  >
                    <summary className="cursor-pointer select-none text-[11px] font-semibold text-slate-800 outline-none marker:text-slate-500">
                      โหมดสต็อกละเอียด (ไม่บังคับ)
                      <span className="mt-0.5 block font-normal text-[10px] leading-snug text-slate-600">
                        ค่าเริ่ม = นับชิ้น — เปิดเมื่อใช้ม้วน/กก. ม้วน/เมตร หรือกล่อง+เศษ (POS / คลัง / แบ่งขาย ตัดสต็อกตามโหมด)
                      </span>
                    </summary>
                    <div className="mt-2 space-y-2 border-t border-teal-100/80 pt-2">
                      <p className={sectionTitleClass}>โหมดสต็อก (POS / คลังแบ่งขาย)</p>
                      <select
                        value={stockModeChoice}
                        onChange={(e) =>
                          setStockModeChoice(
                            e.target.value as 'piece' | 'kg_roll' | 'meter_roll' | 'box_piece',
                          )
                        }
                        className={clsx(inputClass, 'text-xs')}
                      >
                        <option value="piece">นับชิ้นปกติ</option>
                        <option value="kg_roll">ม้วน / กก.</option>
                        <option value="meter_roll">ม้วน / เมตร</option>
                        <option value="box_piece">กล่อง + เศษตัว (ขายชิ้น)</option>
                      </select>
                      {stockModeChoice === 'kg_roll' ? (
                        <label className="block min-w-0">
                          <span className={labelClass}>กก. ต่อม้วนเต็ม</span>
                          <input
                            className={inputClass}
                            value={nominalKgRollStr}
                            onChange={(e) => setNominalKgRollStr(e.target.value)}
                            placeholder="เช่น 25"
                            inputMode="decimal"
                          />
                        </label>
                      ) : null}
                      {stockModeChoice === 'meter_roll' ? (
                        <label className="block min-w-0">
                          <span className={labelClass}>เมตร ต่อม้วนเต็ม</span>
                          <input
                            className={inputClass}
                            value={nominalMetersRollStr}
                            onChange={(e) => setNominalMetersRollStr(e.target.value)}
                            placeholder="เช่น 50"
                            inputMode="decimal"
                          />
                        </label>
                      ) : null}
                      {stockModeChoice === 'box_piece' ? (
                        <label className="block min-w-0">
                          <span className={labelClass}>ชิ้นต่อกล่อง (ปิด)</span>
                          <input
                            className={inputClass}
                            value={piecesPerBoxStr}
                            onChange={(e) => setPiecesPerBoxStr(e.target.value)}
                            placeholder="เช่น 100"
                            inputMode="numeric"
                          />
                        </label>
                      ) : null}
                    </div>
                  </details>
                  <div className="space-y-1.5">
                    {salesUnitRows.map((row, idx) => (
                      <div key={row.id} className="flex flex-wrap items-end gap-1.5">
                        <label className="block min-w-0 flex-1 sm:max-w-[220px]">
                          <span className={labelClass}>ชื่อหน่วย {idx === 0 ? '(ฐาน)' : ''}</span>
                          <input
                            className={inputClass}
                            value={row.label}
                            onChange={(e) => {
                              const v = e.target.value
                              setSalesUnitRows((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, label: v } : r)),
                              )
                            }}
                            placeholder={idx === 0 ? 'เช่น ชิ้น' : 'เช่น ครึ่งโหล, ลัง'}
                          />
                        </label>
                        <label className="block w-[5.5rem] shrink-0">
                          <span className={labelClass}>เทียบฐาน</span>
                          {hoseSoftUnitIndependentUi && idx > 0 ? (
                            <div
                              className={clsx(
                                inputClass,
                                'flex cursor-default items-center justify-center bg-slate-50 text-[11px] text-slate-500',
                              )}
                              title="ไม่ใช้อัตราเทียบ — ตั้งราคาต่อม้วนแยกในตารางระดับราคา"
                            >
                              —
                            </div>
                          ) : (
                            <input
                              className={clsx(inputClass, idx === 0 && 'cursor-not-allowed bg-slate-50 text-slate-500')}
                              value={idx === 0 ? '1' : row.baseUnits}
                              disabled={idx === 0}
                              onChange={(e) => {
                                if (idx === 0) return
                                setSalesUnitRows((prev) =>
                                  prev.map((r) => (r.id === row.id ? { ...r, baseUnits: e.target.value } : r)),
                                )
                              }}
                              placeholder="1"
                              inputMode="decimal"
                            />
                          )}
                        </label>
                        <label className="block min-w-0 flex-1">
                          <span className={labelClass}>บาร์โค้ด</span>
                          <input
                            className={inputClass}
                            value={row.barcode ?? ''}
                            onChange={(e) => {
                              const v = e.target.value
                              setSalesUnitRows((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, barcode: v } : r)),
                              )
                              setError(null)
                            }}
                            placeholder="บาร์โค้ด"
                            autoComplete="off"
                          />
                          {row.barcode?.trim() && checkBarcodeConflicts?.(row.barcode.trim()) ? (
                            <p className="mt-0.5 text-[10px] leading-snug text-amber-800">
                              ซ้ำกับสินค้าอื่น
                            </p>
                          ) : null}
                        </label>
                        <button
                          type="button"
                          disabled={salesUnitRows.length <= 1}
                          onClick={() => removeSalesUnit(idx)}
                          className="mb-0.5 shrink-0 rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="ลบหน่วย"
                          title="ลบหน่วย"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addSalesUnit}
                    className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="size-3.5" />
                    เพิ่มหน่วย
                  </button>
                </div>

                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                  <label className="block min-w-0">
                    <span className={labelClass}>บรรจุ</span>
                    <input
                      className={inputClass}
                      value={packaging}
                      onChange={(e) => setPackaging(e.target.value)}
                      placeholder="เช่น 12 ชิ้น/ลัง"
                    />
                  </label>
                  <label className="block min-w-0">
                    <span className={labelClass}>ที่เก็บ</span>
                    <input className={inputClass} value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} />
                  </label>
                </div>

                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                  <label className="block min-w-0">
                    <span className={labelClass}>หมายเหตุ (หมายเหตุปกติไว้จดทั่วไป)</span>
                    <textarea
                      className={clsx(inputClass, 'min-h-[3rem] resize-y')}
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="บันทึกภายในแฟ้ม"
                    />
                  </label>
                  <label className="block min-w-0">
                    <span className={labelClass}>หมายเหตุแสดง (แสดงหน้า POS)</span>
                    <textarea
                      className={clsx(inputClass, 'min-h-[3rem] resize-y')}
                      rows={2}
                      value={posDisplayNote}
                      onChange={(e) => setPosDisplayNote(e.target.value)}
                      placeholder="เช่น ซื้อ 1 ลังแถมเสื้อ"
                    />
                  </label>
                </div>

                {/* Bundle / Kit components */}
                <div className="mt-1.5 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-indigo-800">
                    สินค้าชุด / Bundle — ส่วนประกอบ
                  </p>
                  <div className="space-y-1.5">
                    {bundleRows.map((row, i) => (
                      <div key={row.id} className="grid grid-cols-[1fr_56px_20px] gap-1.5 items-center">
                        <input
                          className={clsx(inputClass, 'text-xs font-mono')}
                          value={row.sku}
                          onChange={(e) => setBundleRows((prev) => prev.map((r, j) => j === i ? { ...r, sku: e.target.value } : r))}
                          placeholder="SKU ส่วนประกอบ"
                        />
                        <div className="relative">
                          <input
                            type="number" min={1} step={1}
                            className={clsx(inputClass, 'text-xs text-right pr-6')}
                            value={row.qtyStr}
                            onChange={(e) => setBundleRows((prev) => prev.map((r, j) => j === i ? { ...r, qtyStr: e.target.value } : r))}
                            title="จำนวนต่อ 1 ชุด"
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">ชิ้น</span>
                        </div>
                        <button type="button" onClick={() => setBundleRows((prev) => prev.filter((_, j) => j !== i))}
                          className="flex items-center justify-center text-slate-300 hover:text-rose-500">
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    <button type="button"
                      onClick={() => setBundleRows((prev) => [...prev, { id: `bc-${Date.now()}`, sku: '', qtyStr: '1' }])}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900">
                      <Plus className="size-3" /> เพิ่มส่วนประกอบ
                    </button>
                    {bundleRows.length > 0 && (
                      <p className="text-[10px] text-slate-400">ขายสินค้าชุดนี้ → POS ตัดสต็อกจากส่วนประกอบโดยอัตโนมัติ</p>
                    )}
                  </div>
                </div>

                {/* Receive bonus rules */}
                <div className="mt-1.5 rounded-lg border border-amber-100 bg-amber-50/40 p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-amber-800">
                    สินค้าแถมตอนรับของ (Receive Bonus)
                  </p>
                  <div className="space-y-1.5">
                    {receiveBonusRules.map((rule, i) => (
                      <div key={rule.id} className="grid grid-cols-[1fr_64px_20px] gap-1.5 items-center">
                        <input
                          className={clsx(inputClass, 'text-xs')}
                          value={rule.bonusSku}
                          onChange={(e) => setReceiveBonusRules((prev) => prev.map((r, j) => j === i ? { ...r, bonusSku: e.target.value } : r))}
                          placeholder="SKU สินค้าแถม"
                        />
                        <div className="relative">
                          <input
                            type="number" min={0.01} step={0.01}
                            className={clsx(inputClass, 'text-xs text-right pr-6')}
                            value={rule.bonusQtyPerUnit}
                            onChange={(e) => setReceiveBonusRules((prev) => prev.map((r, j) => j === i ? { ...r, bonusQtyPerUnit: Math.max(0.01, Number(e.target.value) || 1) } : r))}
                            title="จำนวนแถมต่อ 1 ชิ้นที่รับ"
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">/ชิ้น</span>
                        </div>
                        <button type="button" onClick={() => setReceiveBonusRules((prev) => prev.filter((_, j) => j !== i))}
                          className="flex items-center justify-center text-slate-300 hover:text-rose-500">
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    <button type="button"
                      onClick={() => setReceiveBonusRules((prev) => [...prev, { id: `rb-${Date.now()}`, bonusSku: '', bonusQtyPerUnit: 1 }])}
                      className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-900">
                      <Plus className="size-3" /> เพิ่มสินค้าแถม
                    </button>
                    {receiveBonusRules.length > 0 && (
                      <p className="text-[10px] text-slate-400">รับสินค้านี้ 1 ชิ้น → ระบบเพิ่มสต็อกสินค้าแถมให้อัตโนมัติ</p>
                    )}
                  </div>
                </div>

                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                  <label className="block min-w-0">
                    <span className={labelClass}>สถานะการขาย</span>
                    <select
                      className={inputClass}
                      value={salesStatus}
                      onChange={(e) => setSalesStatus(e.target.value as ProductSalesStatus)}
                    >
                      <option value="active">ขายอยู่</option>
                      <option value="paused">หยุดขายชั่วคราว</option>
                      <option value="discontinued">เลิกขาย</option>
                    </select>
                  </label>
                </div>

                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-3">
                  <label className="block min-w-0">
                    <span className={labelClass}>หมวดหลัก *</span>
                    <select
                      className={inputClass}
                      value={mainCatId || (categoryTree[0]?.id ?? '')}
                      onChange={(e) => {
                        setCategoryPickerTouched(true)
                        setMainCatId(e.target.value)
                        setSubCatId('')
                        setSubSubCatId('')
                      }}
                    >
                      {categoryTree.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0">
                    <span className={labelClass}>หมวดย่อย 1</span>
                    <select
                      className={inputClass}
                      value={subCatId}
                      onChange={(e) => {
                        setCategoryPickerTouched(true)
                        setSubCatId(e.target.value)
                        setSubSubCatId('')
                      }}
                      disabled={!subcategories.length}
                    >
                      <option value="">—</option>
                      {subcategories.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0">
                    <span className={labelClass}>หมวดย่อย 2</span>
                    <select
                      className={inputClass}
                      value={subSubCatId}
                      onChange={(e) => {
                        setCategoryPickerTouched(true)
                        setSubSubCatId(e.target.value)
                      }}
                      disabled={!subSubOptions.length}
                    >
                      <option value="">—</option>
                      {subSubOptions.map((ss) => (
                        <option key={ss.id} value={ss.id}>
                          {ss.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {deferOptionalCategoryUi ? (
                  <p className="mt-1.5 rounded-md border border-slate-100 bg-slate-50/90 px-2 py-1.5 text-[10px] leading-snug text-slate-600">
                    เลือกหรือเปลี่ยนหมวดด้านบนเพื่อแสดงแท็กและตัวเลือกตามหมวด — ตอนนี้แสดงเฉพาะรายการหลัก
                  </p>
                ) : null}

                {showTagsInMasterForm &&
                !deferOptionalCategoryUi &&
                selectableProductTags.length > 0 ? (
                  <div className="mt-1.5 rounded-md border border-violet-100 bg-violet-50/30 p-2">
                    <span className={labelClass}>แท็กสินค้า</span>
                    <p className="mb-1.5 text-[10px] leading-snug text-slate-500">
                      โปร STL / มิติเบอร์ — จัดการแท็กและกำหนดว่าหมวดไหนแสดงแท็กได้ที่ «จัดการหมวดหมู่»
                    </p>
                    <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
                      {selectableProductTags.map((t) => (
                        <label
                          key={t.id}
                          className="inline-flex cursor-pointer items-center gap-1 rounded border border-violet-200/80 bg-white px-2 py-1 text-[10px] text-slate-800"
                        >
                          <input
                            type="checkbox"
                            checked={productTagIds.includes(t.id)}
                            onChange={(e) => {
                              setProductTagIds((prev) =>
                                e.target.checked ? [...prev, t.id] : prev.filter((x) => x !== t.id),
                              )
                            }}
                            className="size-3 rounded border-slate-300 text-violet-600"
                          />
                          {t.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                {showBoltPairSection && !deferOptionalCategoryUi ? (
                  <div className="mt-1.5 rounded-md border border-violet-200/90 bg-gradient-to-br from-violet-50/90 to-white p-2.5">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-violet-900">
                      สินค้าคู่กัน (น็อต STL)
                    </p>
                    <p className="mb-2 text-[10px] leading-snug text-slate-600">
                      ตัว<strong>ผู้</strong>: ระบุ SKU หัว/ตัวเมีย + แหวนแถม — ใช้ที่ POS ปุ่ม +หัว · ตัว<strong>เมีย</strong>: ระบุ
                      SKU ตัวผู้ทุกตัวที่ใช้หัวนี้ร่วมกัน (ทีละบรรทัดหรือคั่นด้วยจุลภาค)
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="block min-w-0">
                        <span className={labelClass}>SKU หัว / ตัวเมีย (ตอนสินค้านี้เป็นตัวผู้)</span>
                        <input
                          className={inputClass}
                          value={stlBoltPairNutSku}
                          onChange={(e) => setStlBoltPairNutSku(e.target.value)}
                          placeholder="เช่น STL-NUT-14-F"
                          autoComplete="off"
                        />
                      </label>
                      <label className="block min-w-0">
                        <span className={labelClass}>SKU แหวนแถม</span>
                        <input
                          className={inputClass}
                          value={stlBoltPairWasherSku}
                          onChange={(e) => setStlBoltPairWasherSku(e.target.value)}
                          placeholder="เช่น STL-WASH-14"
                          autoComplete="off"
                        />
                      </label>
                    </div>
                    <label className="mt-2 block min-w-0">
                      <span className={labelClass}>SKU ตัวผู้ที่คู่กับหัวนี้ (ตอนสินค้านี้เป็นตัวเมีย)</span>
                      <textarea
                        className={clsx(inputClass, 'min-h-[4.5rem] resize-y')}
                        value={stlBoltPairMaleSkusText}
                        onChange={(e) => setStlBoltPairMaleSkusText(e.target.value)}
                        placeholder={'เช่น\nSTL-BOLT-14-12\nSTL-BOLT-14-34'}
                        rows={4}
                        autoComplete="off"
                      />
                    </label>
                  </div>
                ) : null}

                {formVis.showVehicleFitment && !deferOptionalCategoryUi ? (
                  <details
                    className="group mt-1.5 rounded-md border border-sky-100 bg-sky-50/20 open:border-sky-200/90"
                    open={vehicleFitOpen}
                    onToggle={(e) => setVehicleFitOpen(e.currentTarget.open)}
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-1.5 py-1.5 [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1 text-left text-[11px] font-semibold leading-snug text-slate-900">
                        รถ / รุ่น / เครื่อง-ปี (ผูกสินค้า){' '}
                        <span className="font-normal text-slate-500">(ไม่บังคับ)</span>
                      </span>
                      {onOpenVehicleManage ? (
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.preventDefault()
                            ev.stopPropagation()
                            onOpenVehicleManage()
                          }}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-sky-200 bg-white px-2 py-1 text-[10px] font-medium text-sky-900 shadow-sm hover:bg-sky-50"
                        >
                          <ExternalLink className="size-3.5" aria-hidden />
                          จัดการรุ่นรถ
                        </button>
                      ) : null}
                      <ChevronDown
                        className="size-4 shrink-0 text-slate-500 transition group-open:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <div className="border-t border-sky-100/80 px-1.5 pb-1.5 pt-2">
                      <VehicleFitPicker
                        rows={vehicleRows}
                        onAdd={(row) => setVehicleRows((prev) => [...prev, row])}
                        onUpdate={(id, row) =>
                          setVehicleRows((prev) => prev.map((r) => (r.id === id ? row : r)))
                        }
                        onRemove={(id) => setVehicleRows((prev) => prev.filter((r) => r.id !== id))}
                        sectionClass="border-0 bg-transparent p-0"
                        sectionTitleClass={sectionTitleClass}
                        hideSectionTitle
                      />
                    </div>
                  </details>
                ) : null}
              </div>

              <div className={clsx(sectionClass, 'flex flex-col gap-1.5')}>
                <p className={sectionTitleClass}>ข้อมูลเสริม</p>
                {formVis.showPhysicalDimensions && !deferOptionalCategoryUi ? (
                  <details
                    className="group rounded-md border border-slate-200 bg-white open:border-slate-300"
                    open={dimsOpen}
                    onToggle={(e) => setDimsOpen(e.currentTarget.open)}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-1.5 py-1.5 text-[11px] font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                      <span>มิติอ้างอิง (ไม่บังคับ)</span>
                      <ChevronDown
                        className="size-4 shrink-0 text-slate-500 transition group-open:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <div className="border-t border-slate-100 p-1.5 pt-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-[10px] font-medium text-slate-600">หน่วย: {dimUnit === 'mm' ? 'มม.' : 'หุน'}</p>
                        <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
                          <button
                            type="button"
                            onClick={() => handleDimUnitChange('mm')}
                            className={clsx(
                              'rounded px-1.5 py-0.5 text-[10px] font-medium',
                              dimUnit === 'mm' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100',
                            )}
                          >
                            mm
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDimUnitChange('hun')}
                            className={clsx(
                              'rounded px-1.5 py-0.5 text-[10px] font-medium',
                              dimUnit === 'hun' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100',
                            )}
                          >
                            หุน
                          </button>
                        </div>
                      </div>
                      {dimLayout.slotCount === 2 ? (
                        <div className="grid grid-cols-2 gap-1">
                          <label>
                            <span className="mb-0.5 block text-[10px] text-slate-500">{dimLayout.b} *</span>
                            <input
                              className={inputClass}
                              value={dimB}
                              onChange={(e) => setDimB(e.target.value)}
                              inputMode="decimal"
                            />
                          </label>
                          <label>
                            <span className="mb-0.5 block text-[10px] text-slate-500">{dimLayout.c} *</span>
                            <input
                              className={inputClass}
                              value={dimC}
                              onChange={(e) => setDimC(e.target.value)}
                              inputMode="decimal"
                            />
                          </label>
                        </div>
                      ) : dimLayout.slotCount === 3 ? (
                        <div className="grid grid-cols-3 gap-1">
                          <label>
                            <span className="mb-0.5 block text-[10px] text-slate-500">{dimLayout.a}</span>
                            <input
                              className={inputClass}
                              value={dimA}
                              onChange={(e) => setDimA(e.target.value)}
                              inputMode="decimal"
                            />
                          </label>
                          <label>
                            <span className="mb-0.5 block text-[10px] text-slate-500">{dimLayout.b} *</span>
                            <input
                              className={inputClass}
                              value={dimB}
                              onChange={(e) => setDimB(e.target.value)}
                              inputMode="decimal"
                            />
                          </label>
                          <label>
                            <span className="mb-0.5 block text-[10px] text-slate-500">{dimLayout.c} *</span>
                            <input
                              className={inputClass}
                              value={dimC}
                              onChange={(e) => setDimC(e.target.value)}
                              inputMode="decimal"
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-1">
                          <label>
                            <span className="mb-0.5 block text-[10px] text-slate-500">{dimLayout.a}</span>
                            <input
                              className={inputClass}
                              value={dimA}
                              onChange={(e) => setDimA(e.target.value)}
                              inputMode="decimal"
                            />
                          </label>
                          <label>
                            <span className="mb-0.5 block text-[10px] text-slate-500">{dimLayout.b} *</span>
                            <input
                              className={inputClass}
                              value={dimB}
                              onChange={(e) => setDimB(e.target.value)}
                              inputMode="decimal"
                            />
                          </label>
                          <label>
                            <span className="mb-0.5 block text-[10px] text-slate-500">{dimLayout.c} *</span>
                            <input
                              className={inputClass}
                              value={dimC}
                              onChange={(e) => setDimC(e.target.value)}
                              inputMode="decimal"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </details>
                ) : null}

                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                  <label className="flex min-w-0 cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-slate-300"
                      checked={inStoreCatalog}
                      onChange={(e) => setInStoreCatalog(e.target.checked)}
                    />
                    <span className="min-w-0">
                      <span className={labelClass}>อยู่ในพอร์ตร้าน</span>
                      <span className="mt-0.5 block text-[11px] font-normal leading-snug text-slate-500">
                        ปิด = เก็บเป็นอ้างอิงเท่านั้น — ไม่แสดงใน POS / ค้นหาหน้าร้าน
                      </span>
                    </span>
                  </label>
                  <label className="flex min-w-0 cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      checked={shippingCostExcluded}
                      onChange={(e) => setShippingCostExcluded(e.target.checked)}
                    />
                    <span className="min-w-0">
                      <span className={labelClass}>ราคาซื้อรวมค่าขนส่งแล้ว</span>
                      <span className="mt-0.5 block text-[11px] font-normal leading-snug text-slate-500">
                        ติ๊ก = ไม่แบ่งค่าขนส่งเข้าต้นทุนสินค้านี้ตอนรับของ
                      </span>
                    </span>
                  </label>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50/60 px-2 py-2 mb-2">
                  <p className="mb-1.5 text-[10px] font-semibold text-slate-600">ต้นทุน / ชิ้น (บาท)</p>

                  {/* Cost source picker — only when editing a product that has calc costs */}
                  {editingProduct && ((editingProduct.avgCost ?? 0) > 0 || (editingProduct.lastCost ?? 0) > 0) && (
                    <div className="mb-2 flex gap-1.5">
                      {/* Average cost */}
                      {(editingProduct.avgCost ?? 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const v = editingProduct.avgCost!.toFixed(2)
                            setCostStr(v); setCostManualOverride(true); setCostSource('avg')
                          }}
                          className={`flex flex-1 flex-col items-center rounded-md border px-2 py-1.5 transition ${
                            costSource === 'avg'
                              ? 'border-sky-400 bg-sky-50 shadow-sm ring-1 ring-sky-400'
                              : 'border-slate-200 bg-white/60 hover:border-sky-200 hover:bg-sky-50/50'
                          }`}
                        >
                          <span className={`text-[8px] font-medium ${costSource === 'avg' ? 'text-sky-700' : 'text-slate-400'}`}>ต้นทุนเฉลี่ย</span>
                          <span className={`mt-0.5 text-[12px] font-bold tabular-nums leading-tight ${costSource === 'avg' ? 'text-sky-700' : 'text-slate-500'}`}>
                            {editingProduct.avgCost!.toFixed(2)}
                          </span>
                        </button>
                      )}

                      {/* Latest cost */}
                      {(editingProduct.lastCost ?? 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const v = editingProduct.lastCost!.toFixed(2)
                            setCostStr(v); setCostManualOverride(true); setCostSource('last')
                          }}
                          className={`flex flex-1 flex-col items-center rounded-md border px-2 py-1.5 transition ${
                            costSource === 'last'
                              ? 'border-amber-400 bg-amber-50 shadow-sm ring-1 ring-amber-400'
                              : 'border-slate-200 bg-white/60 hover:border-amber-200 hover:bg-amber-50/50'
                          }`}
                        >
                          <span className={`text-[8px] font-medium ${costSource === 'last' ? 'text-amber-700' : 'text-slate-400'}`}>ต้นทุนล่าสุด</span>
                          <span className={`mt-0.5 text-[12px] font-bold tabular-nums leading-tight ${costSource === 'last' ? 'text-amber-700' : 'text-slate-500'}`}>
                            {editingProduct.lastCost!.toFixed(2)}
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Cost input row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] text-slate-400">
                      {costSource === 'avg' ? 'จากต้นทุนเฉลี่ย — แก้ไขเองได้' : costSource === 'last' ? 'จากต้นทุนล่าสุด — แก้ไขเองได้' : 'แก้ไขเองได้'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {costManualOverride && autoCostPreview !== null && (
                        <button
                          type="button"
                          onClick={() => { setCostManualOverride(false); setCostSource('manual') }}
                          className="text-[9px] text-slate-400 underline hover:text-slate-600"
                        >
                          รีเซตอัตโนมัติ
                        </button>
                      )}
                      <input
                        type="text"
                        inputMode="decimal"
                        value={costStr}
                        onChange={(e) => { setCostStr(e.target.value); setCostManualOverride(true); setCostSource('manual') }}
                        placeholder={autoCostPreview !== null ? String(autoCostPreview) : '0.00'}
                        className="w-24 rounded border border-slate-200 bg-white px-2 py-0.5 text-right text-xs tabular-nums text-slate-800 outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                  {autoCostPreview !== null && !costManualOverride && (
                    <p className="mt-0.5 text-[9px] text-slate-400">คำนวณจากราคาตั้ง + ส่วนลดซัพพลายเออร์</p>
                  )}
                </div>

                <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-1.5">
                  <p className="mb-1 text-[11px] font-semibold text-slate-900">ราคาขาย 4 ระดับ</p>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-100 bg-white/90 px-2 py-1">
                    <span className="text-[10px] font-medium text-slate-600">คิดคอลัมน์ % จาก</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label="ปัดเศษราคา — ดูเกณฑ์"
                        title="ปัดเศษราคา"
                        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1"
                        onClick={() => setPriceRoundingInfoOpen(true)}
                      >
                        <Coins className="size-3.5" strokeWidth={1.75} aria-hidden />
                      </button>
                      <span
                        className={clsx(
                          'text-[10px]',
                          sellTierPercentBasis === 'cost_markup' ? 'font-semibold text-slate-800' : 'text-slate-500',
                        )}
                      >
                        ทุน
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={sellTierPercentBasis === 'list_discount'}
                        aria-label={
                          sellTierPercentBasis === 'list_discount'
                            ? 'คิดจากราคาตั้ง — กดเพื่อเปลี่ยนเป็นคิดจากทุน'
                            : 'คิดจากทุน — กดเพื่อเปลี่ยนเป็นคิดจากราคาตั้ง'
                        }
                        title={
                          sellTierPercentBasis === 'list_discount'
                            ? 'โหมดลด % จากราคาตั้ง (ซัพพลายเออร์)'
                            : 'โหมดกำไร % จากทุน'
                        }
                        onClick={() =>
                          setSellTierPercentBasis((b) => (b === 'cost_markup' ? 'list_discount' : 'cost_markup'))
                        }
                        className={clsx(
                          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1',
                          sellTierPercentBasis === 'list_discount'
                            ? 'border-sky-500 bg-sky-500'
                            : 'border-amber-400 bg-amber-400',
                        )}
                      >
                        <span
                          className={clsx(
                            'pointer-events-none absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200',
                            sellTierPercentBasis === 'list_discount' ? 'translate-x-4' : 'translate-x-0.5',
                          )}
                        />
                      </button>
                      <span
                        className={clsx(
                          'text-[10px]',
                          sellTierPercentBasis === 'list_discount' ? 'font-semibold text-sky-900' : 'text-slate-500',
                        )}
                      >
                        ราคาตั้ง
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-max min-w-[12rem] border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-emerald-100 text-left text-[10px] text-slate-600">
                          <th className="min-w-[3.25rem] py-0.5 pr-1 font-medium align-bottom">ลำดับ</th>
                          <th className="w-[4.75rem] py-0.5 pr-1 font-medium">± %</th>
                          {salesUnitRows.map((u, hi) => (
                            <th key={u.id} className="py-0.5 pr-1 font-medium">
                              {u.label.trim() || `หน่วย${hi + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sellRows.map((row, i) => (
                          <tr key={i} className="border-b border-emerald-50">
                            <td className="py-0.5 pr-1 align-middle text-slate-600">
                              <div className="flex flex-nowrap items-baseline gap-1">
                                <span className="tabular-nums font-medium text-slate-700">{i + 1}</span>
                                <span className="text-[9px] text-slate-500">
                                  {SELL_PRICE_TIER_LABELS[i] ?? '—'}
                                </span>
                              </div>
                            </td>
                            <td className="py-0.5 pr-1">
                              <input
                                className={
                                  sellTierPercentBasis === 'list_discount'
                                    ? listDiscountPctInputClass
                                    : markupPctInputClass
                                }
                                value={row.markup}
                                onChange={(e) => {
                                  const v = sanitizeSignedPercentInput(e.target.value)
                                  const next = [...sellRows]
                                  // Clear explicit prices so the formula recalculates
                                  next[i] = { ...next[i]!, markup: v, prices: next[i]!.prices.map(() => '') }
                                  setSellRows(next)
                                }}
                                placeholder="—"
                                inputMode="decimal"
                                maxLength={14}
                              />
                            </td>
                            {row.prices.map((cell, pi) => {
                              const baseUnitsAt = (idx: number) =>
                                idx === 0
                                  ? 1
                                  : Math.max(
                                      1,
                                      Math.round(
                                        Number(String(salesUnitRows[idx]?.baseUnits ?? '1').replace(',', '.')) || 1,
                                      ),
                                    )
                              return (
                              <td key={`${i}-u${pi}`} className="py-0.5 pr-1">
                                <input
                                  className={sellPriceCellClass}
                                  value={(() => {
                                    if (cell !== '') return cell
                                    // ถ้า cell อื่นในแถวเดียวกันถูกตั้งราคาด้วยมือ — derive ราคา cell นี้จาก per-piece × baseUnits
                                    // ป้องกันบั๊ก "ซื้อลัง แพงกว่าซื้อชิ้น × จำนวน" เมื่อ user override แค่ ชิ้น แต่ลังยังว่าง
                                    for (let pj = 0; pj < row.prices.length; pj++) {
                                      if (pj === pi) continue
                                      const raw = row.prices[pj]
                                      if (!raw) continue
                                      const v = parseMoney(raw)
                                      if (v === undefined || v <= 0) continue
                                      const perPiece = v / baseUnitsAt(pj)
                                      const derived = perPiece * baseUnitsAt(pi)
                                      return formatMoneyInput(derived)
                                    }
                                    const s = parseSignedTierPercent(row.markup)
                                    if (s === 0) return ''
                                    const unitMul = baseUnitsAt(pi)
                                    let autoPrice: number
                                    if (sellTierPercentBasis === 'list_discount') {
                                      const lp = listPPreview
                                      if (lp === undefined || lp <= 0) return ''
                                      const eff = schemePreview?.effectiveQty ?? 1
                                      const listPerPiece = lp / Math.max(1, eff)
                                      const p = Math.max(-100, s)
                                      autoPrice = Math.max(0, listPerPiece * (1 + p / 100) * unitMul)
                                    } else {
                                      const baseCost = parseMoney(costStr)
                                      if (baseCost === undefined) return ''
                                      autoPrice = Math.max(0, baseCost * (1 + s / 100) * unitMul)
                                    }
                                    if (i === 0 && pi === 0) {
                                      autoPrice = applyRetailPriceRounding(
                                        autoPrice,
                                        retailRoundingThresholds.t5,
                                        retailRoundingThresholds.t10,
                                      )
                                    } else if (i >= 1) {
                                      autoPrice = applyNonRetailIntegerRounding(autoPrice)
                                    }
                                    return formatMoneyInput(autoPrice)
                                  })()}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    setSellRows((prev) =>
                                      prev.map((r, ri) => {
                                        if (ri !== i) return r
                                        const prices = [...r.prices]
                                        prices[pi] = v
                                        return { ...r, prices }
                                      }),
                                    )
                                  }}
                                  placeholder="บาท"
                                  inputMode="decimal"
                                />
                              </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-1 text-[10px] leading-snug text-slate-500">
                    {sellTierPercentBasis === 'list_discount'
                      ? 'จากราคาตั้งต่อชิ้น: ไม่ใส่ - = บวก (แพงกว่าราคาตั้ง), ใส่ - = ลด — ฐาน = ราคาตั้ง ÷ จำนวนชิ้นตาม Scheme'
                      : '% จากทุน: ไม่ใส่ - = บวก (กำไร), ใส่ - = ขายต่ำกว่าทุนตาม %'}
                    <span className="mt-0.5 block text-slate-500">
                      ปัดเศษใช้กับราคา «ปลีก» หน่วยแรกเท่านั้น — ทำงานเมื่อใส่ ±% และยังไม่ใส่ราคาในช่องบาท; ถ้าใส่ราคาตรง ระบบจะไม่ปัด
                    </span>
                  </p>
                </div>
                {/* ราคาขั้นบันไดตามจำนวน — qty break editor */}
                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50/40 p-2">
                  <p className={clsx(sectionTitleClass, 'flex items-center gap-1.5')}>
                    <span aria-hidden>🪜</span>
                    ราคาขั้นบันได ตามจำนวนซื้อ <span className="text-[10px] font-normal text-slate-500">(ไม่บังคับ)</span>
                  </p>
                  <p className="mb-1.5 text-[10px] leading-snug text-slate-500">
                    เช่น ลัง: 1+ = ฿2,550 · 2+ = ฿2,530 · 3+ = ฿2,515 — ราคาต่อหน่วย ปกติใช้กับทุกระดับลูกค้า
                  </p>
                  <div className="space-y-2">
                    {salesUnitRows.map((unitRow, uIdx) => {
                      const cfg = quantityBreakRows.find((q) => q.unitIndex === uIdx)
                      const defaultRows = cfg?.defaultRows ?? []
                      const showPerTier = cfg?.showPerTier ?? false
                      const ensureUnit = (mut: (c: typeof quantityBreakRows[number]) => typeof quantityBreakRows[number]) =>
                        setQuantityBreakRows((prev) => {
                          const exists = prev.find((q) => q.unitIndex === uIdx)
                          const base = exists ?? {
                            unitIndex: uIdx,
                            defaultRows: [],
                            perTierRows: {},
                            showPerTier: false,
                          }
                          const next = mut(base)
                          if (exists) return prev.map((q) => (q.unitIndex === uIdx ? next : q))
                          return [...prev, next].sort((a, b) => a.unitIndex - b.unitIndex)
                        })
                      const addDefault = () =>
                        ensureUnit((c) => ({
                          ...c,
                          defaultRows: [
                            ...c.defaultRows,
                            { id: `qb-${uIdx}-${Date.now()}-${Math.random()}`, minQty: '', price: '' },
                          ],
                        }))
                      const updateDefault = (id: string, key: 'minQty' | 'price', val: string) =>
                        ensureUnit((c) => ({
                          ...c,
                          defaultRows: c.defaultRows.map((r) => (r.id === id ? { ...r, [key]: val } : r)),
                        }))
                      const removeDefault = (id: string) =>
                        ensureUnit((c) => ({ ...c, defaultRows: c.defaultRows.filter((r) => r.id !== id) }))
                      const togglePerTier = () =>
                        ensureUnit((c) => ({ ...c, showPerTier: !c.showPerTier }))
                      const addPerTier = (tierIdx: number) =>
                        ensureUnit((c) => ({
                          ...c,
                          perTierRows: {
                            ...c.perTierRows,
                            [tierIdx]: [
                              ...(c.perTierRows[tierIdx] ?? []),
                              { id: `qbpt-${uIdx}-${tierIdx}-${Date.now()}-${Math.random()}`, minQty: '', price: '' },
                            ],
                          },
                        }))
                      const updatePerTier = (tierIdx: number, id: string, key: 'minQty' | 'price', val: string) =>
                        ensureUnit((c) => ({
                          ...c,
                          perTierRows: {
                            ...c.perTierRows,
                            [tierIdx]: (c.perTierRows[tierIdx] ?? []).map((r) =>
                              r.id === id ? { ...r, [key]: val } : r,
                            ),
                          },
                        }))
                      const removePerTier = (tierIdx: number, id: string) =>
                        ensureUnit((c) => ({
                          ...c,
                          perTierRows: {
                            ...c.perTierRows,
                            [tierIdx]: (c.perTierRows[tierIdx] ?? []).filter((r) => r.id !== id),
                          },
                        }))
                      const clearPerTier = (tierIdx: number) =>
                        ensureUnit((c) => {
                          const next = { ...c.perTierRows }
                          delete next[tierIdx]
                          return { ...c, perTierRows: next }
                        })
                      return (
                        <div key={`qbu-${uIdx}`} className="rounded border border-slate-200 bg-white p-2">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700">
                              หน่วย: {unitRow.label || `หน่วย ${uIdx + 1}`}
                              {uIdx > 0 && (
                                <span className="ml-1 text-[10px] font-normal text-slate-500">
                                  (= {unitRow.baseUnits || 1} {salesUnitRows[0]?.label || 'ฐาน'})
                                </span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={addDefault}
                              className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 hover:bg-amber-100"
                            >
                              + ขั้น
                            </button>
                          </div>
                          {defaultRows.length === 0 ? (
                            <p className="text-[10px] italic text-slate-400">ยังไม่มีขั้นบันได</p>
                          ) : (
                            <div className="space-y-1">
                              {defaultRows.map((r) => (
                                <div key={r.id} className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-500">≥</span>
                                  <input
                                    className={clsx(inputClass, 'w-16 text-[11px]')}
                                    value={r.minQty}
                                    onChange={(e) => updateDefault(r.id, 'minQty', e.target.value)}
                                    placeholder="qty"
                                    inputMode="numeric"
                                  />
                                  <span className="text-[10px] text-slate-500">ราคา/หน่วย ฿</span>
                                  <input
                                    className={clsx(inputClass, 'w-24 text-[11px]')}
                                    value={r.price}
                                    onChange={(e) => updateDefault(r.id, 'price', e.target.value)}
                                    placeholder="0.00"
                                    inputMode="decimal"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeDefault(r.id)}
                                    className="rounded p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                    aria-label="ลบขั้น"
                                    title="ลบขั้น"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={togglePerTier}
                            className="mt-1.5 text-[10px] font-bold text-blue-700 hover:underline"
                          >
                            {showPerTier ? '▾ ซ่อน override ต่อระดับลูกค้า' : '▸ ตั้งราคาขั้นบันไดต่างกันต่อระดับลูกค้า'}
                          </button>
                          {showPerTier && (
                            <div className="mt-1.5 space-y-1.5 border-t border-slate-100 pt-1.5">
                              {[0, 1, 2, 3].map((tierIdx) => {
                                const rows = cfg?.perTierRows[tierIdx] ?? []
                                return (
                                  <div key={`pt-${tierIdx}`} className="rounded bg-slate-50 p-1.5">
                                    <div className="mb-0.5 flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-slate-700">
                                        {SELL_PRICE_TIER_LABELS[tierIdx] ?? `tier ${tierIdx + 1}`}
                                        {rows.length === 0 && (
                                          <span className="ml-1 text-[9px] font-normal italic text-slate-400">
                                            (ใช้ค่ากลาง)
                                          </span>
                                        )}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        {rows.length > 0 && (
                                          <button
                                            type="button"
                                            onClick={() => clearPerTier(tierIdx)}
                                            className="text-[9px] text-slate-500 hover:text-slate-800 hover:underline"
                                          >
                                            กลับใช้ค่ากลาง
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => addPerTier(tierIdx)}
                                          className="rounded border border-blue-200 bg-blue-50 px-1.5 py-px text-[9px] font-bold text-blue-700 hover:bg-blue-100"
                                        >
                                          + ขั้น
                                        </button>
                                      </div>
                                    </div>
                                    {rows.map((r) => (
                                      <div key={r.id} className="mt-0.5 flex items-center gap-1.5">
                                        <span className="text-[9px] text-slate-500">≥</span>
                                        <input
                                          className={clsx(inputClass, 'w-14 text-[10px]')}
                                          value={r.minQty}
                                          onChange={(e) => updatePerTier(tierIdx, r.id, 'minQty', e.target.value)}
                                          placeholder="qty"
                                          inputMode="numeric"
                                        />
                                        <span className="text-[9px] text-slate-500">฿</span>
                                        <input
                                          className={clsx(inputClass, 'w-20 text-[10px]')}
                                          value={r.price}
                                          onChange={(e) => updatePerTier(tierIdx, r.id, 'price', e.target.value)}
                                          placeholder="0.00"
                                          inputMode="decimal"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removePerTier(tierIdx, r.id)}
                                          className="rounded p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                          aria-label="ลบขั้น"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 bg-slate-50/90 px-3 py-2 sm:px-4">
            {error && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-sm text-rose-800">
                {error}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  reset()
                  onClose()
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={doSave}
                className="rounded-lg border border-emerald-700 bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
              >
                {editingProduct ? 'บันทึกการแก้ไข' : 'บันทึกสินค้า'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {priceRoundingInfoOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="presentation"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            aria-label="ปิด"
            onClick={() => setPriceRoundingInfoOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={priceRoundingInfoTitleId}
            className="relative z-10 w-full max-w-[19rem] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl ring-1 ring-slate-900/[0.06]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/90 to-white px-3.5 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-white text-emerald-700 shadow-sm">
                    <Coins className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <h2
                    id={priceRoundingInfoTitleId}
                    className="text-sm font-semibold tracking-tight text-slate-900"
                  >
                    ปัดเศษราคา
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPriceRoundingInfoOpen(false)}
                  className="-m-0.5 shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-white/80 hover:text-slate-700"
                  aria-label="ปิด"
                >
                  <X className="size-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
            <div className="px-3.5 py-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2">
                <div className="grid grid-cols-[max-content_4.25rem_max-content] items-center gap-x-1.5 gap-y-2 text-[11px] leading-snug text-slate-700">
                  <span className="min-w-0 whitespace-nowrap">ปัดเศษ 5 บาท เริ่มที่</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={rounding5StartBahtStr}
                    onChange={(e) => setRounding5StartBahtStr(e.target.value.replace(/\D/g, ''))}
                    aria-label="เริ่มปัดเศษ 5 บาทเมื่อราคาถึง (บาท)"
                    className="w-full min-w-0 rounded-md border border-emerald-200/90 bg-white px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  />
                  <span className="whitespace-nowrap">บาท</span>
                  <span className="min-w-0 whitespace-nowrap">ปัดเศษ 10 บาท เริ่มที่</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={rounding10StartBahtStr}
                    onChange={(e) => setRounding10StartBahtStr(e.target.value.replace(/\D/g, ''))}
                    aria-label="เริ่มปัดเศษ 10 บาทเมื่อราคาถึง (บาท)"
                    className="w-full min-w-0 rounded-md border border-emerald-200/90 bg-white px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  />
                  <span className="whitespace-nowrap">บาท</span>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/90 px-3.5 py-2.5">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRounding5StartBahtStr(ROUNDING_START_5_BAHT_DEFAULT)
                    setRounding10StartBahtStr(ROUNDING_START_10_BAHT_DEFAULT)
                  }}
                  title={`ค่าเริ่มต้น: ${ROUNDING_START_5_BAHT_DEFAULT} / ${ROUNDING_START_10_BAHT_DEFAULT} บาท`}
                  aria-label={`ค่าเริ่มต้น — ปัดเศษ 5 บาทเริ่มที่ ${ROUNDING_START_5_BAHT_DEFAULT} บาท, ปัดเศษ 10 บาทเริ่มที่ ${ROUNDING_START_10_BAHT_DEFAULT} บาท`}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-600 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/80 hover:text-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1"
                >
                  <RotateCcw className="size-3.5 shrink-0 text-emerald-700" strokeWidth={1.75} aria-hidden />
                  <span>ค่าเริ่มต้น</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPriceRoundingInfoOpen(false)}
                  className="min-w-[6.5rem] rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1"
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  )
}
