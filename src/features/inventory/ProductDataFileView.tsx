import { AddProductModal, type AddProductBrowseNav } from '@/features/inventory/components/AddProductModal'
import { ProductImage } from '@/features/inventory/components/ProductImage'
import { ProductImageGallery } from '@/features/inventory/components/ProductImageGallery'
import { CrossBranchStockSortModal } from '@/features/inventory/components/CrossBranchStockSortModal'
import { canViewCost } from '@/features/auth/authSession'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import {
  loadCrossBranchSortRules,
  saveCrossBranchSortRules,
  sortCrossBranchRows,
  toggleCrossBranchHeaderSort,
  CROSS_BRANCH_SORT_LABELS,
  CROSS_BRANCH_SORT_KEYS,
  type CrossBranchSortKey,
  type CrossBranchSortRule,
} from '@/features/inventory/data/crossBranchStockSort'
import {
  INVENTORY_CATEGORIES_UPDATED_EVENT,
  loadCategoryTree,
  type MainCategory,
  type SubCategory,
} from '@/features/inventory/data/inventoryCategories'
import { dimLayoutFromPaperFields, type PaperDimLayout } from '@/features/inventory/data/paperDimensionLayout'
import { appendLabelPrintQueue } from '@/features/inventory/data/labelPrintQueueStore'
import { getBranchById } from '@/features/auth/branches'
import { normalizeCrossBranchRows } from '@/features/inventory/data/branchInventoryModel'
import {
  collectInventoryCarFilterOptions,
  effectiveSellPriceTier,
  fitmentYearRangeKey,
  flushProductMasterDbSave,
  formatMmWithHunApprox,
  generateNextTenDigitSku,
  getProductMasterList,
  mmToHun,
  normalizeEngineLabelForFilter,
  normalizeSalesUnits,
  PRODUCT_MASTER_LIST_CHANGED_EVENT,
  productMatchesInventoryCarFilters,
  saveProductMasterList,
  sellPriceAtUnitIndex,
  sellPriceTierContextFromProduct,
  totalCrossBranchStock,
  type CrossBranchStockRow,
  type PhysicalDimensions,
  type ProductMasterDetail,
  type VehicleFitmentRef,
} from '@/features/inventory/data/productMasterData'
import { loadProductTagsRegistry } from '@/features/inventory/data/productTagsRegistry'
import { clsx } from 'clsx'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardCopy,
  ExternalLink,
  FlipHorizontal2,
  LayoutGrid,
  LayoutList,
  ListOrdered,
  MapPin,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Ruler,
  Search,
  Store,
  Trash2,
} from 'lucide-react'
import { SearchableFilterSelect } from '@/features/inventory/components/SearchableFilterSelect'
import {
  dimensionScore,
  dimensionStrictMatch,
  parseMeasureMm,
  type MeasureInput,
} from '@/features/inventory/utils/dimensionSearch'
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'

function formatBaht(n: number) {
  return n.toLocaleString('th-TH', { maximumFractionDigits: 0 })
}

function norm(s: string) {
  return s.trim().toLowerCase()
}

function isMissingCategoryValue(s: string | undefined) {
  const t = (s ?? '').trim()
  return t.length === 0 || t === '—' || t === '-'
}

function normalizeSearchText(s: string) {
  return s.toLowerCase().replace(/[\s\-_/\\.]+/g, '')
}

function tokenizeSearchQuery(q: string): string[] {
  return q
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean)
}

function yearsFromRange(from: number | undefined, to: number | undefined): string[] {
  const nowYear = new Date().getFullYear()
  const hasFrom = Number.isFinite(from)
  const hasTo = Number.isFinite(to)
  if (!hasFrom && !hasTo) return []
  const startRaw = hasFrom ? Math.round(from as number) : 1900
  const endRaw = hasTo ? Math.round(to as number) : nowYear
  const start = Math.max(1900, startRaw)
  const end = Math.min(2100, endRaw)
  if (start > end) return []
  // จำกัดช่วงเพื่อกันสตริงยาวผิดปกติ
  if (end - start > 200) return []
  const out: string[] = []
  for (let y = start; y <= end; y++) out.push(String(y))
  return out
}

type SearchIndexRow = {
  product: ProductMasterDetail
  hit: string
  hitNorm: string
}

function safeVehicleFitments(rows: ProductMasterDetail['vehicleFitments']): VehicleFitmentRef[] {
  return (rows ?? []).filter((x): x is VehicleFitmentRef => Boolean(x && typeof x === 'object'))
}

function buildSearchHitText(p: ProductMasterDetail): string {
  const oem = p.oemTags.join(' ').toLowerCase()
  const factory = (p.factoryNo ?? '').toLowerCase()
  const xref = (p.crossReferenceTags ?? []).join(' ').toLowerCase()
  const notes = (p.notes ?? '').toLowerCase()
  const posNote = (p.posDisplayNote ?? '').toLowerCase()
  const boxBar = (p.boxBarcode ?? '').toLowerCase()
  const fitText = safeVehicleFitments(p.vehicleFitments)
    .map(
      (f) =>
        `${f.categoryLabel} ${f.brandName} ${f.modelName} ${f.engineLabel} ${f.engineCode ?? ''} ${f.engineText ?? ''} ${f.driveType ?? ''} ${f.yearRangeText ?? ''} ${
          f.yearFrom != null ? String(f.yearFrom) : ''
        } ${f.yearTo != null ? String(f.yearTo) : ''} ${
          f.brakePosition === 'front' ? 'เบรกหน้า' : f.brakePosition === 'rear' ? 'เบรกหลัง' : ''
        }`,
    )
    .join(' ')
    .toLowerCase()
  const yearTokens = [
    ...new Set(
      safeVehicleFitments(p.vehicleFitments).flatMap((f) => yearsFromRange(f.yearFrom, f.yearTo)),
    ),
  ].join(' ')
  return (
    p.name +
    ' ' +
    p.sku +
    ' ' +
    boxBar +
    ' ' +
    p.brand +
    ' ' +
    (p.subCategory ?? '') +
    ' ' +
    (p.subSubCategory ?? '') +
    ' ' +
    p.category +
    ' ' +
    p.carBrand +
    ' ' +
    p.carModelLabel +
    ' ' +
    p.yearLabel +
    ' ' +
    yearTokens +
    ' ' +
    oem +
    ' ' +
    factory +
    ' ' +
    xref +
    ' ' +
    notes +
    ' ' +
    posNote +
    ' ' +
    fitText
  ).toLowerCase()
}

function enqueueProductLabelPrintFromMaster(p: ProductMasterDetail) {
  const barcode = (p.boxBarcode?.trim() || p.sku.trim())
  if (!barcode) {
    window.alert('ไม่มีบาร์โค้ดหรือ SKU สำหรับสินค้านี้')
    return
  }
  const rawQty = window.prompt('พิมพ์กี่แผ่น', '1')
  if (rawQty == null) return
  const qty = Math.max(1, Math.floor(Number(rawQty) || 0))
  if (!Number.isFinite(qty) || qty <= 0) {
    window.alert('จำนวนไม่ถูกต้อง')
    return
  }
  appendLabelPrintQueue({
    name: p.name,
    barcode,
    sku: p.sku,
    oemNo: p.oemTags[0],
    factoryNo: p.factoryNo,
    price: p.sellPrice,
    qty,
    template: 'medium',
  })
}

function filterProductsBySearch(searchIndex: SearchIndexRow[], q: string): ProductMasterDetail[] {
  const tokens = tokenizeSearchQuery(q)
  if (tokens.length === 0) return searchIndex.map((row) => row.product)
  const tokenNorms = tokens.map((t) => normalizeSearchText(t)).filter(Boolean)
  return searchIndex
    .filter((row) =>
      tokens.every((t, idx) => {
        const tn = tokenNorms[idx] ?? ''
        return row.hit.includes(t) || (tn.length > 0 && row.hitNorm.includes(tn))
      }),
    )
    .map((row) => row.product)
}

function productsInMain(products: ProductMasterDetail[], main: MainCategory) {
  return products.filter((p) => norm(p.category) === norm(main.name))
}

function productsInSub(mainProducts: ProductMasterDetail[], sub: SubCategory) {
  return mainProducts.filter((p) => norm(p.subCategory ?? '') === norm(sub.name))
}

type CategoryNavSelection = AddProductBrowseNav

const FILTER_ALL = 'ทั้งหมด'

function productsForNavSelection(
  selection: CategoryNavSelection,
  tree: MainCategory[],
  products: ProductMasterDetail[],
): ProductMasterDetail[] {
  const mainById = new Map(tree.map((m) => [m.id, m]))
  const mainNames = new Set(tree.map((m) => norm(m.name)))

  switch (selection.type) {
    case 'all':
      return products
    case 'orphan':
      return products.filter((p) => !mainNames.has(norm(p.category)))
    case 'main': {
      const main = mainById.get(selection.mainId)
      if (!main) return products
      return productsInMain(products, main)
    }
    case 'sub': {
      const main = mainById.get(selection.mainId)
      if (!main) return []
      const sub = main.subcategories.find((s) => s.id === selection.subId)
      if (!sub) return []
      const mp = productsInMain(products, main)
      return productsInSub(mp, sub)
    }
    case 'subsub': {
      const main = mainById.get(selection.mainId)
      if (!main) return []
      const sub = main.subcategories.find((s) => s.id === selection.subId)
      if (!sub) return []
      const subSub = sub.subSubcategories.find((ss) => ss.id === selection.subSubId)
      if (!subSub) return []
      const mp = productsInMain(products, main)
      const inSub = productsInSub(mp, sub)
      return inSub.filter((p) => norm(p.subSubCategory ?? '') === norm(subSub.name))
    }
    default:
      return products
  }
}

function applyProductFilters(
  products: ProductMasterDetail[],
  brand: string,
  carBrand: string,
  carModel: string,
  engineLabel: string,
  driveType: string,
  year: string,
): ProductMasterDetail[] {
  return products.filter((p) =>
    productMatchesInventoryCarFilters(p, { brand, carBrand, carModel, year, engineLabel, driveType }, FILTER_ALL),
  )
}

/** เรียงแฟ้มมาสเตอร์ — คลิกหัวตารางเหมือนหน้าคลังสินค้า */
type MasterCatalogSortKey = 'name' | 'sku' | 'sellPrice'

type MasterCatalogSort = {
  key: MasterCatalogSortKey
  dir: 'asc' | 'desc'
}

function toggleMasterCatalogSort(prev: MasterCatalogSort, key: MasterCatalogSortKey): MasterCatalogSort {
  if (prev.key === key) {
    return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
  }
  return { key, dir: 'asc' }
}

const collatorBase = new Intl.Collator('th', { sensitivity: 'base' })
const collatorNumeric = new Intl.Collator('th', { sensitivity: 'base', numeric: true })

function sortMasterCatalogList(list: ProductMasterDetail[], sort: MasterCatalogSort): ProductMasterDetail[] {
  const arr = [...list]
  const mul = sort.dir === 'desc' ? -1 : 1
  if (sort.key === 'name') {
    arr.sort((a, b) => collatorBase.compare(a.name, b.name) * mul)
  } else if (sort.key === 'sku') {
    arr.sort((a, b) => collatorNumeric.compare(a.sku, b.sku) * mul)
  } else {
    arr.sort((a, b) => (a.sellPrice - b.sellPrice) * mul)
  }
  return arr
}

function MasterCatalogSortTh({
  sortKey,
  sort,
  label,
  onSort,
  alignRight,
  className,
}: {
  sortKey: MasterCatalogSortKey
  sort: MasterCatalogSort
  label: string
  onSort: (k: MasterCatalogSortKey) => void
  alignRight?: boolean
  className?: string
}) {
  const active = sort.key === sortKey
  return (
    <th className={clsx(className, alignRight && 'text-right')}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        title={`เรียงตาม${label}`}
        aria-label={`เรียงตาม${label}${active ? (sort.dir === 'asc' ? ' จากน้อยไปมาก' : ' จากมากไปน้อย') : ''}`}
        className={clsx(
          'inline-flex w-full max-w-full items-center gap-1.5 py-0.5 text-sm font-medium text-slate-600 transition hover:text-slate-900',
          alignRight ? 'ml-auto w-full justify-end text-right' : 'text-left',
        )}
      >
        <span className="min-w-0 truncate">{label}</span>
        {active &&
          (sort.dir === 'asc' ? (
            <ArrowUp className="size-3.5 shrink-0 text-slate-700" aria-hidden />
          ) : (
            <ArrowDown className="size-3.5 shrink-0 text-slate-700" aria-hidden />
          ))}
      </button>
    </th>
  )
}

function paperFieldsForNav(tree: MainCategory[], sel: CategoryNavSelection) {
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

/** บรรทัดเดียวสำหรับแถวรายการตอนเปิดค้นหามิติ — มม. + เทียบหุน (เดียวกับตอนลงสินค้าเป็นหุน) */
function formatPhysicalDimensionsSearchRow(d: PhysicalDimensions): string {
  const line = (mm: number) => `${mm} mm (~${mmToHun(mm).toFixed(1)} หุน)`
  const parts: string[] = []
  if (d.innerDiameterMm !== undefined) parts.push(`A ${line(d.innerDiameterMm)}`)
  if (d.outerDiameterMm !== undefined) parts.push(`B ${line(d.outerDiameterMm)}`)
  if (d.heightMm !== undefined) parts.push(`C ${line(d.heightMm)}`)
  return parts.join(' · ')
}

function formatDimsCompact(d: PhysicalDimensions): string {
  const parts: string[] = []
  if (d.innerDiameterMm !== undefined) parts.push(`A:${d.innerDiameterMm}`)
  if (d.outerDiameterMm !== undefined) parts.push(`B:${d.outerDiameterMm}`)
  if (d.heightMm !== undefined) parts.push(`C:${d.heightMm}`)
  return parts.length ? parts.join(' · ') + ' mm' : ''
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900">{children}</h4>
  )
}

function FieldLine({
  label,
  children,
  valueClassName,
}: {
  /** ถ้าไม่ส่ง label จะเว้นช่องซ้ายให้ตรงกับแถวอื่น แล้วแสดง children เป็นค่าหลัก */
  label?: string
  children: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
      {label !== undefined ? (
        <span className="min-w-[11rem] shrink-0 text-sm text-slate-600">{label}</span>
      ) : (
        <span className="hidden min-w-[11rem] sm:block" aria-hidden />
      )}
      <div className={clsx('min-w-0 text-sm text-slate-900', valueClassName)}>{children}</div>
    </div>
  )
}

function SortableCrossTh({
  colKey,
  label,
  sortRules,
  onSort,
  alignRight,
}: {
  colKey: CrossBranchSortKey
  label: string
  sortRules: CrossBranchSortRule[]
  onSort: (k: CrossBranchSortKey) => void
  alignRight?: boolean
}) {
  const idx = sortRules.findIndex((r) => r.key === colKey)
  const active = idx >= 0
  const dir = active ? sortRules[idx].dir : null

  return (
    <th className={clsx('px-3 py-2.5 text-xs font-medium text-slate-600', alignRight && 'text-right')}>
      <button
        type="button"
        onClick={() => onSort(colKey)}
        className={clsx(
          'inline-flex max-w-full items-center gap-1 text-xs font-medium text-slate-600 transition hover:text-slate-900',
          alignRight ? 'ml-auto w-full justify-end text-right' : 'text-left',
        )}
      >
        <span className="min-w-0 truncate">{label}</span>
        {active && (
          <>
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold tabular-nums text-slate-700"
              title={`ลำดับการเรียง ${idx + 1}`}
            >
              {idx + 1}
            </span>
            {dir === 'asc' ? (
              <ArrowUp className="size-3.5 shrink-0 text-slate-700" aria-hidden />
            ) : (
              <ArrowDown className="size-3.5 shrink-0 text-slate-700" aria-hidden />
            )}
          </>
        )}
      </button>
    </th>
  )
}

function CrossBranchStockSection({ detail }: { detail: ProductMasterDetail }) {
  const [sortModalOpen, setSortModalOpen] = useState(false)
  const [sortRules, setSortRules] = useState<CrossBranchSortRule[]>(loadCrossBranchSortRules)

  useEffect(() => {
    saveCrossBranchSortRules(sortRules)
  }, [sortRules])

  const normalizedCross = useMemo(
    () => normalizeCrossBranchRows(detail.crossBranch ?? []),
    [detail.crossBranch],
  )

  const rows = useMemo(
    () => sortCrossBranchRows(normalizedCross, sortRules),
    [normalizedCross, sortRules],
  )

  const totalStock = useMemo(() => normalizedCross.reduce((s, r) => s + r.stock, 0), [normalizedCross])

  function handleHeaderSort(key: CrossBranchSortKey) {
    setSortRules((prev) => toggleCrossBranchHeaderSort(prev, key))
  }

  return (
    <section className="rounded-2xl border-2 border-amber-200/90 bg-amber-50/30">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100/80 px-4 py-3">
        <h3 className="text-sm font-semibold text-amber-950">สถานะสต็อกทุกคลัง (Cross-Branch Stock)</h3>
        <button
          type="button"
          onClick={() => setSortModalOpen(true)}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-amber-300/80 bg-white text-amber-900 shadow-sm transition hover:bg-amber-50"
          title="จัดเรียงแบบลำดับ 1–3"
          aria-label="จัดเรียงแบบลำดับ 1–3"
        >
          <ListOrdered className="size-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-amber-100/90 bg-white/60">
              {CROSS_BRANCH_SORT_KEYS.map((key) => (
                <SortableCrossTh
                  key={key}
                  colKey={key}
                  label={CROSS_BRANCH_SORT_LABELS[key]}
                  sortRules={sortRules}
                  onSort={handleHeaderSort}
                  alignRight={key === 'stock'}
                />
              ))}
              <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-500"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <CrossBranchRow key={row.id} row={row} />
            ))}
            <tr className="border-t-2 border-amber-200/80 bg-white/80 font-medium">
              <td className="px-3 py-2.5 text-slate-800">รวมทั้งหมด</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-900">{totalStock}</td>
              <td colSpan={3} className="px-3 py-2.5 text-slate-500" />
            </tr>
          </tbody>
        </table>
      </div>

      <CrossBranchStockSortModal
        open={sortModalOpen}
        onClose={() => setSortModalOpen(false)}
        rules={sortRules}
        onSave={(next) => setSortRules(next)}
      />
    </section>
  )
}

function CrossBranchRow({ row }: { row: CrossBranchStockRow }) {
  const low = row.status === 'low'
  return (
    <tr className="border-b border-amber-100/60 last:border-0">
      <td className="px-3 py-2.5 text-slate-800">{row.locationLabel}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-slate-900">{row.stock}</td>
      <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{row.position}</td>
      <td className="px-3 py-2.5">
        <span
          className={clsx(
            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
            low ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800',
          )}
        >
          {low ? 'สต็อกต่ำ' : 'ปกติ'}
        </span>
      </td>
      <td className="px-3 py-2 text-right">
        {row.showTransfer && (
          <button
            type="button"
            className="rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-50"
          >
            ขอโอนจากคลังกลาง
          </button>
        )}
      </td>
    </tr>
  )
}

type CatalogViewMode = 'list' | 'flip-card'

function ProductThumb({ sku, className }: { sku: string; className?: string }) {
  return (
    <div className={clsx('aspect-[4/3] w-full overflow-hidden rounded-xl', className)}>
      <ProductImage sku={sku} size="md" className="!size-full !rounded-xl" />
    </div>
  )
}

/** บรรทัดรายละเอียดใต้ชื่อสินค้า (กริด) */
function ProductPortfolioBadges({ product }: { product: ProductMasterDetail }) {
  const tags: { key: string; cls: string; text: string }[] = []
  if (product.inStoreCatalog === false) {
    tags.push({ key: 'ref', cls: 'border-slate-200 bg-slate-100 text-slate-700', text: 'อ้างอิง' })
  }
  const st = product.salesStatus ?? 'active'
  if (st === 'paused') tags.push({ key: 'pause', cls: 'border-amber-200 bg-amber-50 text-amber-950', text: 'หยุดขาย' })
  if (st === 'discontinued') tags.push({ key: 'disc', cls: 'border-rose-200 bg-rose-50 text-rose-950', text: 'เลิกขาย' })
  if (product.vatMode === 'no_vat') {
    tags.push({ key: 'novat', cls: 'border-indigo-200 bg-indigo-50 text-indigo-900', text: 'ไม่มี VAT' })
  }
  if (tags.length === 0) return null
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {tags.map((t) => (
        <span
          key={t.key}
          className={clsx('inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium', t.cls)}
        >
          {t.text}
        </span>
      ))}
    </span>
  )
}

function ProductCardMeta({
  product,
  matchingFitments,
}: {
  product: ProductMasterDetail
  preferredFitment?: VehicleFitmentRef
  /** When user has active filters, this is the subset of fitments that match them.
   *  If undefined (no filters), all fitments are considered. */
  matchingFitments?: VehicleFitmentRef[]
}) {
  const skip = (v: string | undefined) => !v || v === '—'
  const brand = skip(product.brand) ? null : product.brand
  const sourceFits = matchingFitments ?? product.vehicleFitments ?? []

  type Entry = { model: string; year: string }
  const brandOrder: string[] = []
  const brandMap = new Map<string, Entry[]>()
  const seen = new Set<string>()
  for (const f of sourceFits) {
    const cb = f.brandName
    if (!cb) continue
    const modelLabel = f.trim ? `${f.modelName} ${f.trim}` : f.modelName
    const key = `${cb}|${modelLabel}|${f.yearRangeText ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    if (!brandMap.has(cb)) {
      brandMap.set(cb, [])
      brandOrder.push(cb)
    }
    brandMap.get(cb)!.push({ model: modelLabel, year: f.yearRangeText ?? '' })
  }

  const carParts: string[] = []
  for (const cb of brandOrder) {
    const entries = brandMap.get(cb)!
    if (entries.length === 1) {
      const e = entries[0]
      carParts.push(e.year ? `${cb} ${e.model} ปี ${e.year}` : `${cb} ${e.model}`)
    } else {
      const sharedYear = entries.every((e) => e.year === entries[0].year) ? entries[0].year : ''
      const models = entries.map((e) => e.model).join(', ')
      carParts.push(sharedYear ? `${cb}: ${models} ปี ${sharedYear}` : `${cb}: ${models}`)
    }
  }

  if (carParts.length === 0) {
    const car = [
      skip(product.carBrand) ? null : product.carBrand,
      skip(product.carModelLabel) ? null : product.carModelLabel,
      skip(product.yearLabel) ? null : `ปี ${product.yearLabel}`,
    ].filter(Boolean).join(' ')
    const parts = [brand, car || null].filter(Boolean)
    if (!parts.length) return null
    return (
      <div className="mt-1 flex flex-wrap items-start gap-1">
        <p className="line-clamp-2 flex-1 min-w-0 text-xs leading-relaxed text-slate-500">
          {parts.join(' · ')}
        </p>
      </div>
    )
  }

  const parts = [brand, ...carParts].filter(Boolean)
  const totalFits = seen.size
  const flatList = brandOrder.flatMap((cb) =>
    brandMap.get(cb)!.map((e) => ({ brand: cb, model: e.model, year: e.year })),
  )
  const tooltipText = flatList
    .map((f) => `${f.brand} ${f.model}${f.year ? ' ปี ' + f.year : ''}`)
    .join('\n')

  return (
    <div className="mt-1 flex flex-wrap items-start gap-1">
      <p className="line-clamp-2 flex-1 min-w-0 text-xs leading-relaxed text-slate-500">
        {parts.join(' · ')}
      </p>
      {totalFits > 2 ? (
        <span
          className="group relative inline-flex shrink-0 items-center align-middle"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className="cursor-help rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 hover:bg-sky-100"
            title={tooltipText}
          >
            {totalFits} รุ่น
          </span>
          <div className="pointer-events-none invisible absolute right-0 top-full z-[100] mt-1 max-h-64 w-72 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 text-[11px] leading-snug text-slate-700 opacity-0 shadow-xl transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              ใช้ได้ทั้งหมด {totalFits} รุ่น
            </p>
            {brandOrder.map((cb) => (
              <div key={cb} className="mb-1.5 last:mb-0">
                <p className="text-[10px] font-semibold text-slate-500">{cb}</p>
                {brandMap.get(cb)!.map((e, i) => (
                  <p key={i} className="py-0.5 pl-2 text-slate-600">
                    · {e.model}{e.year ? ` ปี ${e.year}` : ''}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </span>
      ) : null}
    </div>
  )
}

const ProductMasterFlipCard = memo(function ProductMasterFlipCard({
  product,
  onOpenProduct,
  onSelectProduct,
  selected,
  onContextMenuProduct,
  preferredFitment,
  matchingFitments,
  bulkSelected,
  onToggleBulk,
}: {
  product: ProductMasterDetail
  onOpenProduct: (id: string) => void
  onSelectProduct: (id: string) => void
  selected: boolean
  onContextMenuProduct: (e: React.MouseEvent, id: string) => void
  preferredFitment?: VehicleFitmentRef
  matchingFitments?: VehicleFitmentRef[]
  bulkSelected: boolean
  onToggleBulk: (id: string) => void
}) {
  const [flipped, setFlipped] = useState(false)

  // Group fitments by car brand for the back face
  const fitGroups = useMemo(() => {
    const fits = matchingFitments ?? product.vehicleFitments ?? []
    const order: string[] = []
    const map = new Map<string, Set<string>>()
    const seenPair = new Set<string>()
    for (const f of fits) {
      if (!f?.brandName || !f?.modelName) continue
      const pairKey = `${f.brandName}|${f.modelName}`
      if (seenPair.has(pairKey)) continue
      seenPair.add(pairKey)
      if (!map.has(f.brandName)) {
        map.set(f.brandName, new Set())
        order.push(f.brandName)
      }
      map.get(f.brandName)!.add(f.modelName)
    }
    return order.map((brand) => ({ brand, models: [...map.get(brand)!] }))
  }, [product.vehicleFitments, matchingFitments])

  const oemTags = (product.oemTags ?? []).filter((t) => t && t.trim().length > 0)
  const stock = totalCrossBranchStock(product)
  const dimStr = product.physicalDimensions ? formatDimsCompact(product.physicalDimensions) : ''
  const loc = (product.storageLocation ?? '').trim()
  const carSummary = preferredFitment
    ? [
        preferredFitment.brandName,
        preferredFitment.modelName,
        preferredFitment.yearRangeText ? `ปี ${preferredFitment.yearRangeText}` : '',
      ]
        .filter(Boolean)
        .join(' · ')
    : [product.carBrand, product.carModelLabel, product.yearLabel ? `ปี ${product.yearLabel}` : '']
        .filter((s) => s && s !== '—')
        .join(' · ')

  const faceClass = clsx(
    'col-start-1 row-start-1 flex w-full flex-col rounded-2xl border bg-white p-3 text-left shadow-sm transition pos-compact:rounded-xl pos-compact:p-2.5',
    bulkSelected
      ? 'border-violet-400 ring-2 ring-violet-300/80'
      : selected
        ? 'border-violet-300 ring-2 ring-violet-200/70'
        : 'border-slate-200',
  )

  return (
    <div className="relative w-full" style={{ perspective: '1200px' }}>
      <input
        type="checkbox"
        checked={bulkSelected}
        onChange={() => onToggleBulk(product.id)}
        onClick={(e) => e.stopPropagation()}
        className="absolute left-2 top-2 z-20 size-4 cursor-pointer rounded border-slate-300 bg-white shadow-sm accent-violet-600"
        aria-label={`เลือก ${product.name}`}
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setFlipped((v) => !v)
        }}
        className="absolute right-2 top-2 z-20 inline-flex size-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
        title={flipped ? 'พลิกกลับ' : 'พลิกดูรายละเอียด'}
        aria-label={flipped ? 'พลิกกลับ' : 'พลิกดูรายละเอียด'}
      >
        <FlipHorizontal2 className="size-3.5" strokeWidth={1.75} aria-hidden />
      </button>

      <div
        className="grid transition-transform duration-500 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* ── Front face ── */}
        <div
          className={faceClass}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <button
            type="button"
            onClick={() => onSelectProduct(product.id)}
            onDoubleClick={() => onOpenProduct(product.id)}
            onContextMenu={(e) => onContextMenuProduct(e, product.id)}
            className="-m-3 flex flex-1 flex-col gap-2 rounded-2xl p-3 text-left pos-compact:-m-2.5 pos-compact:p-2.5"
          >
            <ProductThumb sku={product.sku} />
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 pos-compact:text-[13px]">
              {product.name}
            </p>
            <ProductPortfolioBadges product={product} />
            {carSummary ? (
              <p className="line-clamp-2 text-[11px] leading-snug text-slate-500">{carSummary}</p>
            ) : null}
            <div className="mt-auto flex items-end justify-between gap-2 pt-1">
              <p className="font-mono text-[11px] text-slate-400">{product.sku}</p>
              <p className="text-base font-semibold tabular-nums text-rose-600 pos-compact:text-sm">
                ฿{product.sellPrice.toLocaleString('th-TH')}
              </p>
            </div>
          </button>
        </div>

        {/* ── Back face ── */}
        <div
          className={faceClass}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <button
            type="button"
            onClick={() => onSelectProduct(product.id)}
            onDoubleClick={() => onOpenProduct(product.id)}
            onContextMenu={(e) => onContextMenuProduct(e, product.id)}
            className="-m-3 flex flex-1 flex-col gap-2 overflow-y-auto rounded-2xl p-3 text-left pos-compact:-m-2.5 pos-compact:p-2.5"
          >
            <p className="line-clamp-2 pr-7 text-[12px] font-semibold leading-snug text-slate-900">
              {product.name}
            </p>
            <p className="font-mono text-[10px] text-slate-400">{product.sku}</p>

            {oemTags.length > 0 ? (
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  OEM
                </p>
                <div className="flex flex-wrap gap-1">
                  {oemTags.slice(0, 8).map((t, i) => (
                    <span
                      key={i}
                      className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700"
                    >
                      {t}
                    </span>
                  ))}
                  {oemTags.length > 8 ? (
                    <span className="text-[10px] text-slate-400">+{oemTags.length - 8}</span>
                  ) : null}
                </div>
              </div>
            ) : null}

            {fitGroups.length > 0 ? (
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  ใช้ได้กับ
                </p>
                <div className="space-y-0.5">
                  {fitGroups.slice(0, 5).map((g) => (
                    <p key={g.brand} className="text-[11px] leading-snug text-slate-600">
                      <span className="font-semibold text-slate-700">{g.brand}</span>:{' '}
                      <span className="text-slate-500">{g.models.slice(0, 4).join(', ')}</span>
                      {g.models.length > 4 ? (
                        <span className="text-slate-400"> +{g.models.length - 4}</span>
                      ) : null}
                    </p>
                  ))}
                  {fitGroups.length > 5 ? (
                    <p className="text-[10px] italic text-slate-400">
                      …และอีก {fitGroups.length - 5} ยี่ห้อ
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-1 pt-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                <span>
                  สต็อก <span className="tabular-nums text-slate-700">{stock}</span>
                </span>
                {dimStr ? <span className="tabular-nums">{dimStr}</span> : null}
                {loc ? (
                  <span className="inline-flex items-center gap-0.5 text-slate-400">
                    <MapPin className="size-2.5 shrink-0" aria-hidden />
                    {loc}
                  </span>
                ) : null}
              </div>
              <p className="text-base font-semibold tabular-nums text-rose-600 pos-compact:text-sm">
                ฿{product.sellPrice.toLocaleString('th-TH')}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
})

const ProductMasterListRow = memo(function ProductMasterListRow({
  product,
  onOpenProduct,
  onSelectProduct,
  selected,
  onContextMenuProduct,
  dimensionSearchActive,
  preferredFitment,
  matchingFitments,
  bulkSelected,
  onToggleBulk,
}: {
  product: ProductMasterDetail
  onOpenProduct: (id: string) => void
  onSelectProduct: (id: string) => void
  selected: boolean
  onContextMenuProduct: (e: React.MouseEvent, id: string) => void
  dimensionSearchActive?: boolean
  preferredFitment?: VehicleFitmentRef
  matchingFitments?: VehicleFitmentRef[]
  bulkSelected: boolean
  onToggleBulk: (id: string) => void
}) {
  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={() => onSelectProduct(product.id)}
      onDoubleClick={() => onOpenProduct(product.id)}
      onContextMenu={(e) => onContextMenuProduct(e, product.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpenProduct(product.id)
        if (e.key === ' ') {
          e.preventDefault()
          onSelectProduct(product.id)
        }
      }}
      className={clsx(
        'cursor-pointer border-b border-slate-100 transition',
        bulkSelected
          ? 'bg-violet-100/80 ring-1 ring-inset ring-violet-300'
          : selected
            ? 'bg-violet-50/70 ring-1 ring-inset ring-violet-200'
            : 'hover:bg-slate-50/80',
      )}
    >
      <td
        className="w-9 py-2 pl-3 pr-1 pos-compact:w-8 pos-compact:pl-2"
        onClick={(e) => {
          e.stopPropagation()
          onToggleBulk(product.id)
        }}
      >
        <input
          type="checkbox"
          checked={bulkSelected}
          onChange={() => onToggleBulk(product.id)}
          onClick={(e) => e.stopPropagation()}
          className="size-4 cursor-pointer rounded border-slate-300 accent-violet-600"
          aria-label={`เลือก ${product.name}`}
        />
      </td>
      <td className="w-20 py-2 pl-2.5 pr-2 pos-compact:w-[4.25rem] pos-compact:py-1.5 pos-compact:pl-2">
        <ProductImage sku={product.sku} size="md" />
      </td>
      <td className="min-w-0 py-2 pr-2 pos-compact:py-1.5">
        <p className="font-medium text-slate-900 pos-compact:text-sm">{product.name}</p>
        <ProductPortfolioBadges product={product} />
        <ProductCardMeta product={product} preferredFitment={preferredFitment} matchingFitments={matchingFitments} />
        {dimensionSearchActive && product.physicalDimensions ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-violet-900/95 tabular-nums">
            <span className="font-medium text-violet-950">ในระบบ:</span> {formatPhysicalDimensionsSearchRow(product.physicalDimensions)}
          </p>
        ) : (
          (() => {
            const dimStr = product.physicalDimensions ? formatDimsCompact(product.physicalDimensions) : ''
            const loc = product.storageLocation?.trim() ?? ''
            if (!dimStr && !loc) return null
            return (
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] leading-snug text-slate-400 tabular-nums pos-compact:text-[10px]">
                {dimStr ? <span>{dimStr}</span> : null}
                {loc ? (
                  <span className="flex items-center gap-0.5 not-italic text-slate-400">
                    <MapPin className="size-2.5 shrink-0" aria-hidden />
                    {loc}
                  </span>
                ) : null}
              </p>
            )
          })()
        )}
      </td>
      <td className="hidden py-2 font-mono text-xs text-slate-500 pos-compact:py-1.5 sm:table-cell">{product.sku}</td>
      <td className="hidden py-2 pr-3 text-right text-xs tabular-nums text-slate-600 pos-compact:py-1.5 pos-compact:text-[11px] sm:table-cell">
        {totalCrossBranchStock(product)}
      </td>
      <td className="hidden border-l border-slate-100/90 py-2 pl-4 pr-3 text-right text-sm tabular-nums text-slate-700 pos-compact:py-1.5 pos-compact:pl-3 pos-compact:text-xs lg:table-cell">
        ฿{product.sellPrice.toLocaleString('th-TH')}
      </td>
      <td className="py-2 pr-3 text-right pos-compact:py-1.5 pos-compact:pr-2">
        <ChevronRight className="inline size-4 text-slate-300 pos-compact:size-3.5" aria-hidden />
      </td>
    </tr>
  )
})

type CategoryOption = {
  value: string
  label: string
  main: string
  sub?: string
  subSub?: string
}

function buildCategoryOptions(tree: MainCategory[]): CategoryOption[] {
  const out: CategoryOption[] = []
  for (const main of tree) {
    if (main.subcategories.length === 0) {
      out.push({ value: main.id, label: main.name, main: main.name })
      continue
    }
    for (const sub of main.subcategories) {
      if (sub.subSubcategories.length === 0) {
        out.push({
          value: `${main.id}::${sub.id}`,
          label: `${main.name} / ${sub.name}`,
          main: main.name,
          sub: sub.name,
        })
        continue
      }
      for (const ss of sub.subSubcategories) {
        out.push({
          value: `${main.id}::${sub.id}::${ss.id}`,
          label: `${main.name} / ${sub.name} / ${ss.name}`,
          main: main.name,
          sub: sub.name,
          subSub: ss.name,
        })
      }
    }
  }
  return out
}

function BulkMoveCategoryPicker({
  tree,
  count,
  onClose,
  onApply,
}: {
  tree: MainCategory[]
  count: number
  onClose: () => void
  onApply: (main: string, sub: string | undefined, subSub: string | undefined) => void
}) {
  const options = useMemo(() => buildCategoryOptions(tree), [tree])
  const [filter, setFilter] = useState('')
  const [selectedValue, setSelectedValue] = useState<string | null>(null)
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, filter])
  const selected = options.find((o) => o.value === selectedValue) ?? null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-md flex-col gap-3 rounded-2xl bg-white p-5 shadow-xl">
        <div>
          <p className="text-base font-semibold text-slate-900">ย้ายไปหมวด</p>
          <p className="mt-0.5 text-xs text-slate-500">
            ย้าย <span className="font-semibold tabular-nums">{count.toLocaleString('th-TH')}</span> รายการที่เลือก
          </p>
        </div>
        <input
          type="search"
          autoFocus
          placeholder="ค้นหาหมวด..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
        />
        <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/40">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-slate-500">ไม่พบหมวดที่ตรงกับคำค้น</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => setSelectedValue(o.value)}
                    className={clsx(
                      'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition',
                      selectedValue === o.value
                        ? 'bg-violet-100 font-medium text-violet-900'
                        : 'text-slate-700 hover:bg-white',
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              if (!selected) return
              onApply(selected.main, selected.sub, selected.subSub)
            }}
            className="flex-1 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            ย้าย
          </button>
        </div>
      </div>
    </div>
  )
}

function breadcrumbLabel(
  tree: MainCategory[],
  sel: CategoryNavSelection,
): string {
  if (sel.type === 'all') return 'ทั้งหมด'
  if (sel.type === 'orphan') return 'ไม่ตรงหมวดในระบบ'
  const main = tree.find((m) => m.id === sel.mainId)
  if (!main) return '—'
  if (sel.type === 'main') return main.name
  const sub = main.subcategories.find((s) => s.id === sel.subId)
  if (!sub) return main.name
  if (sel.type === 'sub') return `${main.name} / ${sub.name}`
  if (sel.type === 'subsub') {
    const ss = sub.subSubcategories.find((x) => x.id === sel.subSubId)
    return ss ? `${main.name} / ${sub.name} / ${ss.name}` : `${main.name} / ${sub.name}`
  }
  return `${main.name} / ${sub.name}`
}

function ProductMasterDetailContent({
  selected,
  onEdit,
  onSoftDelete,
  onOpenVehicleManage,
}: {
  selected: ProductMasterDetail
  onEdit?: () => void
  onSoftDelete?: () => void
  onOpenVehicleManage?: () => void
}) {
  const tierPriceCtx = useMemo(() => sellPriceTierContextFromProduct(selected), [selected])

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <SectionTitle>ข้อมูลพื้นฐาน</SectionTitle>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <ProductImageGallery sku={selected.sku} mainSize="md" />
              <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-base font-semibold leading-snug text-slate-900">{selected.name}</p>
              <ProductPortfolioBadges product={selected} />
              <FieldLine label="รหัสสินค้า(SKU)">
                <span className="font-mono tabular-nums">{selected.sku}</span>
              </FieldLine>
              {selected.boxBarcode ? (
                <div className="mt-2">
                  <FieldLine label="บาร์โค้ดบนกล่อง">
                    <span className="font-mono tabular-nums">{selected.boxBarcode}</span>
                  </FieldLine>
                </div>
              ) : null}
              {selected.masterRevision != null && selected.masterRevision > 0 ? (
                <p className="mt-2 rounded-md border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-[10px] leading-snug text-slate-600">
                  <span className="font-medium text-slate-700">แฟ้มมาสเตอร์:</span> รอบ {selected.masterRevision}
                  {selected.lastMasterEditBranchId ? (
                    <>
                      {' '}
                      · แก้ล่าสุดจากสาขา{' '}
                      {getBranchById(selected.lastMasterEditBranchId)?.name ?? selected.lastMasterEditBranchId}
                    </>
                  ) : null}
                  {selected.lastMasterEditBy ? <> · {selected.lastMasterEditBy}</> : null}
                  {selected.lastMasterEditAt ? (
                    <> · {new Date(selected.lastMasterEditAt).toLocaleString('th-TH')}</>
                  ) : null}
                </p>
              ) : null}
              <div className="mt-2 space-y-1">
                <FieldLine label="บริษัท / แบรนด์ชิ้นงาน">{selected.brand}</FieldLine>
                <FieldLine label="ยี่ห้อรถ">{selected.carBrand}</FieldLine>
                <FieldLine label="รุ่น">{selected.carModelLabel}</FieldLine>
                <FieldLine label="รุ่นปี">{selected.yearLabel}</FieldLine>
              </div>
              <div className="mt-2 space-y-1">
                <FieldLine label="หมวดหมู่หลัก">{selected.category}</FieldLine>
                {selected.subCategory ? (
                  <FieldLine label="หมวดหมู่ย่อย 1">{selected.subCategory}</FieldLine>
                ) : null}
                {selected.subSubCategory ? (
                  <FieldLine label="หมวดหมู่ย่อย 2">{selected.subSubCategory}</FieldLine>
                ) : null}
              </div>
              {selected.physicalDimensions ? (
                <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2">
                  <p className="mb-2 text-xs font-medium text-violet-900">
                    มิติอ้างอิง — เก็บเป็นมม. (ถ้าลงเป็นหุนตอนบันทึก ระบบแปลงเป็นมม. อัตโนมัติ) · A/B/C ใช้ได้ทั้งไส้กรอง ลูกหมาก และชิ้นอื่น
                  </p>
                  <FieldLine label="A">
                    {selected.physicalDimensions.innerDiameterMm !== undefined ? (
                      <span className="tabular-nums">{formatMmWithHunApprox(selected.physicalDimensions.innerDiameterMm)}</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </FieldLine>
                  <FieldLine label="B">
                    {selected.physicalDimensions.outerDiameterMm !== undefined ? (
                      <span className="tabular-nums">{formatMmWithHunApprox(selected.physicalDimensions.outerDiameterMm)}</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </FieldLine>
                  <FieldLine label="C">
                    {selected.physicalDimensions.heightMm !== undefined ? (
                      <span className="tabular-nums">{formatMmWithHunApprox(selected.physicalDimensions.heightMm)}</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </FieldLine>
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="mb-0.5 text-xs font-medium text-slate-500">เบอร์แท้ (OEM)</p>
              <p className="mb-2 text-[10px] leading-snug text-slate-400">
                ลงเบอร์แท้ / เทียบ / โรงงานให้ครบ — ช่วยค้นหาและลดความสับสนหน้าร้าน
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.oemTags.length ? (
                  selected.oemTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-800"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">—</span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="mb-2 text-xs font-medium text-slate-500">เบอร์โรงงาน</p>
              {selected.factoryNo ? (
                <span className="inline-flex rounded-lg border border-sky-100 bg-sky-50/80 px-2.5 py-1 font-mono text-xs text-sky-950">
                  {selected.factoryNo}
                </span>
              ) : (
                <span className="text-sm text-slate-400">—</span>
              )}
            </div>

            {selected.crossReferenceTags && selected.crossReferenceTags.length > 0 ? (
              <div className="border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-medium text-slate-500">เบอร์เทียบ (Cross reference)</p>
                <div className="flex flex-wrap gap-2">
                  {selected.crossReferenceTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex rounded-lg border border-amber-100 bg-amber-50/80 px-2.5 py-1 font-mono text-xs text-amber-950"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="border-t border-slate-100 pt-3">
              <FieldLine label="แท้ (OEM)">
                {selected.isGenuine ? (
                  <span className="text-emerald-700">ใช่</span>
                ) : (
                  <span className="text-slate-500">ไม่ระบุ / ไม่ใช่</span>
                )}
              </FieldLine>
              <FieldLine label="VAT">
                {selected.vatMode === 'no_vat' ? (
                  <span className="text-indigo-700">ไม่มี VAT</span>
                ) : (
                  <span className="text-slate-600">มี VAT</span>
                )}
              </FieldLine>
              {normalizeSalesUnits(selected).length > 0 ? (
                <div className="mt-2 space-y-1.5">
                  <p className="text-xs font-medium text-slate-500">หน่วยขาย</p>
                  <ul className="space-y-1 text-sm text-slate-800">
                    {normalizeSalesUnits(selected).map((u, idx) => (
                      <li key={u.id} className="flex flex-wrap gap-x-2 gap-y-0.5">
                        <span className="font-medium">{u.label}</span>
                        {idx > 0 && u.baseUnits > 1 ? (
                          <span className="text-xs text-slate-500">(เทียบฐาน ×{u.baseUnits})</span>
                        ) : idx === 0 ? (
                          <span className="text-xs text-slate-500">(หน่วยฐาน)</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {selected.packaging ? (
                <div className="mt-2">
                  <FieldLine label="บรรจุ">{selected.packaging}</FieldLine>
                </div>
              ) : null}
              {selected.storageLocation ? (
                <div className="mt-2">
                  <FieldLine label="ที่เก็บ">{selected.storageLocation}</FieldLine>
                </div>
              ) : null}
              {selected.notes ? (
                <div className="mt-2">
                  <FieldLine label="หมายเหตุ">
                    <span className="whitespace-pre-wrap">{selected.notes}</span>
                  </FieldLine>
                </div>
              ) : null}
              {selected.posDisplayNote ? (
                <div className="mt-2">
                  <FieldLine label="หมายเหตุแสดง POS">
                    <span className="whitespace-pre-wrap text-sky-900">{selected.posDisplayNote}</span>
                  </FieldLine>
                </div>
              ) : null}
              {selected.productTagIds && selected.productTagIds.length > 0 ? (
                <div className="mt-2">
                  <p className="mb-1 text-xs font-medium text-slate-500">แท็กสินค้า</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.productTagIds.map((id) => {
                      const label = loadProductTagsRegistry().find((t) => t.id === id)?.label ?? id
                      return (
                        <span
                          key={id}
                          className="inline-flex rounded-lg border border-violet-200 bg-violet-50/90 px-2 py-0.5 text-[11px] text-violet-950"
                        >
                          {label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="mb-0.5 text-xs font-medium text-slate-500">รุ่นรถที่ใช้ได้</p>
                  <p className="text-[10px] leading-snug text-slate-400">
                    รหัส <span className="font-mono text-slate-600">engineId</span> = variant แต่ละช่วงปี — ใส่ใน CSV คอลัมน์{' '}
                    <span className="font-mono">engineIds</span> คั่นด้วย |
                  </p>
                </div>
                {onOpenVehicleManage ? (
                  <button
                    type="button"
                    onClick={onOpenVehicleManage}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[10px] font-medium text-emerald-900 shadow-sm hover:bg-emerald-50"
                  >
                    <ExternalLink className="size-3.5" aria-hidden />
                    จัดการรุ่นรถ
                  </button>
                ) : null}
              </div>
              {safeVehicleFitments(selected.vehicleFitments).length > 0 ? (
                <ul className="mb-2 space-y-1.5 text-xs text-slate-800">
                  {safeVehicleFitments(selected.vehicleFitments).map((f) => (
                    <li
                      key={f.id}
                      className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-2.5 py-1.5 leading-snug"
                    >
                      <span className="font-medium text-emerald-950">{f.categoryLabel}</span>
                      {' · '}
                      {f.brandName} {f.modelName} — {f.engineLabel}
                      {f.engineCode ? (
                        <span className="ml-1 rounded border border-emerald-200 bg-white px-1 py-0.5 font-mono text-[10px] text-emerald-900">
                          {f.engineCode}
                        </span>
                      ) : null}
                      {f.brakePosition === 'front'
                        ? ' · เบรกหน้า'
                        : f.brakePosition === 'rear'
                          ? ' · เบรกหลัง'
                          : ''}
                      <span className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-emerald-800/90">
                        <span>
                          engineId: <span className="select-all">{f.engineId}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard?.writeText(f.engineId)
                          }}
                          className="inline-flex items-center gap-0.5 rounded border border-emerald-200/80 bg-white px-1.5 py-0.5 text-[9px] font-medium text-emerald-900 hover:bg-emerald-100/80"
                        >
                          <ClipboardCopy className="size-3" aria-hidden />
                          คัดลอก
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mb-1 text-[10px] text-slate-500">
                สรุป (POS / ตัวกรอง): {selected.carBrand} · {selected.carModelLabel} · {selected.yearLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.carModels.length > 0 ? (
                  selected.carModels.map((m) => (
                    <span
                      key={m}
                      className="inline-flex rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs text-sky-900"
                    >
                      {m}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <SectionTitle>ราคาขาย</SectionTitle>
        <div className="mt-4">

          {/* ── ราคาขาย ── */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">ขาย</p>
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <span className="text-xs text-slate-500">ราคาขายหลัก</span>
              <span className="tabular-nums text-base font-bold text-emerald-800">฿{formatBaht(selected.sellPrice)}</span>
            </div>

            {/* ตารางระดับราคา — new-style (markup/list-discount tiers) */}
            {selected.sellPriceTiers &&
            selected.sellPriceTiers.some(
              (t) =>
                (t.markupFromCostPercent ?? 0) !== 0 ||
                (t.supplierListSignedPercent ?? 0) !== 0 ||
                (t.discountFromSupplierListPercent ?? 0) > 0 ||
                (t.explicitSmallUnitPrice ?? 0) > 0 ||
                (t.explicitLargeUnitPrice ?? 0) > 0 ||
                (t.explicitUnitPrices?.some((p) => p > 0) ?? false),
            ) ? (
              <div className="overflow-x-auto rounded-lg border border-emerald-100">
                <table className="w-full min-w-[20rem] border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-emerald-100 bg-emerald-50 text-left text-slate-500">
                      <th className="px-2 py-1.5 font-medium">ระดับ</th>
                      {normalizeSalesUnits(selected).map((u) => (
                        <th key={u.id} className="px-2 py-1.5 font-medium">
                          ราคา ({u.label})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.sellPriceTiers.map((t, i) => {
                      const m = t.markupFromCostPercent ?? 0
                      const dList = t.discountFromSupplierListPercent ?? 0
                      const sList = t.supplierListSignedPercent
                      const pieces = 1
                      const units = normalizeSalesUnits(selected)
                      const hasAny =
                        m !== 0 ||
                        (sList !== undefined && sList !== 0) ||
                        dList > 0 ||
                        (t.explicitSmallUnitPrice ?? 0) > 0 ||
                        (t.explicitLargeUnitPrice ?? 0) > 0 ||
                        (t.explicitUnitPrices?.some((p) => p > 0) ?? false)
                      if (!hasAny) return null
                      return (
                        <tr key={i} className="border-b border-emerald-50">
                          <td className="px-2 py-1.5 text-slate-500">{i + 1}</td>
                          {units.map((u, ui) => {
                            const px = sellPriceAtUnitIndex(t, selected.costPrice, pieces, units, ui, tierPriceCtx)
                            return (
                              <td
                                key={u.id}
                                className={clsx('px-2 py-1.5 tabular-nums', ui === 0 ? 'font-semibold text-emerald-800' : 'text-emerald-700')}
                              >
                                {px !== null ? `฿${px.toLocaleString('th-TH', { maximumFractionDigits: 2 })}` : '—'}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : selected.sellPriceTiers?.some((t) => t.price > 0) ? (
              /* ตารางระดับราคา — old-style (explicit price + discount%) */
              <div className="overflow-x-auto rounded-lg border border-emerald-100">
                <table className="w-full min-w-[16rem] border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-emerald-100 bg-emerald-50 text-left text-slate-500">
                      <th className="px-2 py-1.5 font-medium">ระดับ</th>
                      <th className="px-2 py-1.5 font-medium">ราคา</th>
                      <th className="px-2 py-1.5 font-medium">ลด%</th>
                      <th className="px-2 py-1.5 font-medium">หลังลด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.sellPriceTiers.map((t, i) =>
                      t.price > 0 ? (
                        <tr key={i} className="border-b border-emerald-50">
                          <td className="px-2 py-1.5 text-slate-500">{i + 1}</td>
                          <td className="px-2 py-1.5 tabular-nums">฿{formatBaht(t.price)}</td>
                          <td className="px-2 py-1.5 tabular-nums text-slate-600">{t.discountPercent}%</td>
                          <td className="px-2 py-1.5 tabular-nums font-semibold text-emerald-800">
                            ฿{effectiveSellPriceTier(t).toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ) : null,
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}

          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onEdit}
          disabled={!onEdit}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil className="size-4" />
          แก้ไขสินค้า
        </button>
        <button
          type="button"
          onClick={onSoftDelete}
          disabled={!onSoftDelete}
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="size-4" />
          ย้ายไปถังขยะ
        </button>
        <button
          type="button"
          onClick={() => enqueueProductLabelPrintFromMaster(selected)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <Printer className="size-4" />
          พิมพ์บาร์โค้ด
          <span className="text-xs font-normal text-slate-400">F8</span>
        </button>
      </div>

      <CrossBranchStockSection detail={selected} />
    </>
  )
}

type ProductDataFileViewCache = {
  navSelection: CategoryNavSelection
  expandedMain: string[]
  expandedSub: string[]
  q: string
  hasSearched: boolean
  filterBrand: string
  filterCarBrand: string
  filterCarModel: string
  filterEngine: string
  filterDrive: string
  filterYear: string
  filterChassisCode: string
  catalogSort: MasterCatalogSort
  catalogViewMode: CatalogViewMode
  filterInStoreOnly: boolean
  showMissingCategoryOnly: boolean
  selectedProductId: string | null
  measA: string
  measB: string
  measC: string
  measTol: number
  measActive: boolean
  measPanelOpen: boolean
}

let _productDataFileViewCache: ProductDataFileViewCache | null = null

function readCache(): ProductDataFileViewCache {
  return _productDataFileViewCache ?? {
    navSelection: { type: 'all' },
    expandedMain: [],
    expandedSub: [],
    q: '',
    hasSearched: false,
    filterBrand: FILTER_ALL,
    filterCarBrand: FILTER_ALL,
    filterCarModel: FILTER_ALL,
    filterEngine: FILTER_ALL,
    filterDrive: FILTER_ALL,
    filterYear: FILTER_ALL,
    filterChassisCode: '',
    catalogSort: { key: 'name', dir: 'asc' },
    catalogViewMode: 'list',
    filterInStoreOnly: true,
    showMissingCategoryOnly: false,
    selectedProductId: null,
    measA: '',
    measB: '',
    measC: '',
    measTol: 3,
    measActive: false,
    measPanelOpen: false,
  }
}

export function ProductDataFileView() {
  const allowCost = canViewCost()
  const { openTab } = useWorkspaceTabs()
  const [page, setPage] = useState<'browse' | 'detail'>('browse')
  const [detailProductId, setDetailProductId] = useState<string | null>(null)

  const _c = readCache()
  const [catalogViewMode, setCatalogViewMode] = useState<CatalogViewMode>(
    // Coerce the legacy 'grid-5' cached value into the new merged 'flip-card' view
    _c.catalogViewMode === ('grid-5' as CatalogViewMode) ? 'flip-card' : _c.catalogViewMode,
  )

  const [categoryTree, setCategoryTree] = useState<MainCategory[]>(() => loadCategoryTree())
  const [expandedMain, setExpandedMain] = useState<Set<string>>(() => new Set(_c.expandedMain))
  const [expandedSub, setExpandedSub] = useState<Set<string>>(() => new Set(_c.expandedSub))
  const [navSelection, setNavSelection] = useState<CategoryNavSelection>(_c.navSelection)
  const [q, setQ] = useState(_c.q)
  const [hasSearched, setHasSearched] = useState(_c.hasSearched)
  const [filterBrand, setFilterBrand] = useState(_c.filterBrand)
  const [filterCarBrand, setFilterCarBrand] = useState(_c.filterCarBrand)
  const [filterCarModel, setFilterCarModel] = useState(_c.filterCarModel)
  const [filterEngine, setFilterEngine] = useState(_c.filterEngine)
  const [filterDrive, setFilterDrive] = useState(_c.filterDrive)
  const [filterYear, setFilterYear] = useState(_c.filterYear)
  const [filterChassisCode, setFilterChassisCode] = useState(_c.filterChassisCode ?? '')
  const [filterTrim, setFilterTrim] = useState<string>(FILTER_ALL)
  const [catalogSort, setCatalogSort] = useState<MasterCatalogSort>(_c.catalogSort)
  /** A=ใน/กว้าง → inner, B=นอก/ยาว → outer, C=หนา/สูง → height */
  const [measA, setMeasA] = useState(_c.measA)
  const [measB, setMeasB] = useState(_c.measB)
  const [measC, setMeasC] = useState(_c.measC)
  const [measTol, setMeasTol] = useState(_c.measTol)
  const [measActive, setMeasActive] = useState(_c.measActive)
  /** แถบค้นหามิติ — ย่อเป็นไอคอนไว้กดขยาย */
  const [measPanelOpen, setMeasPanelOpen] = useState(_c.measPanelOpen)
  /** เปิด = แสดงเฉพาะสินค้าในพอร์ตร้าน (ซ่อนรายการอ้างอิง) */
  const [filterInStoreOnly, setFilterInStoreOnly] = useState(_c.filterInStoreOnly)
  /** เปิด = แสดงเฉพาะรายการที่ยังไม่ถูกจัดหมวดตามระดับที่เลือก */
  const [showMissingCategoryOnly, setShowMissingCategoryOnly] = useState(_c.showMissingCategoryOnly)
  const [products, setProducts] = useState<ProductMasterDetail[]>(() => [...getProductMasterList()])
  const [showBin, setShowBin] = useState(false)
  const [hardDeleteTarget, setHardDeleteTarget] = useState<ProductMasterDetail | null>(null)
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(() => new Set())
  const [moveCategoryPickerOpen, setMoveCategoryPickerOpen] = useState(false)

  useEffect(() => {
    if (showBin) setShowBin(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navSelection])

  const clearBulk = useCallback(() => setBulkSelected(new Set()), [])

  // Clear bulk selection whenever the visible list shape changes substantially
  // (nav, search query, in-store toggle, bin) so users don't act on hidden rows.
  useEffect(() => {
    setBulkSelected(new Set())
  }, [navSelection, q, filterInStoreOnly, showMissingCategoryOnly, showBin])

  const toggleBulkOne = useCallback((id: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const bulkSetInStore = useCallback((ids: string[], inStore: boolean) => {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    setProducts((prev) =>
      prev.map((p) => (idSet.has(p.id) ? { ...p, inStoreCatalog: inStore } : p)),
    )
    setBulkSelected(new Set())
  }, [])

  const bulkMoveCategory = useCallback(
    (ids: string[], main: string, sub: string | undefined, subSub: string | undefined) => {
      if (ids.length === 0) return
      const idSet = new Set(ids)
      setProducts((prev) =>
        prev.map((p) =>
          idSet.has(p.id)
            ? { ...p, category: main, subCategory: sub ?? '', subSubCategory: subSub ?? '' }
            : p,
        ),
      )
      setBulkSelected(new Set())
      setMoveCategoryPickerOpen(false)
    },
    [],
  )

  const bulkSoftDelete = useCallback((ids: string[]) => {
    if (ids.length === 0) return
    const now = new Date().toISOString()
    const idSet = new Set(ids)
    setProducts((prev) =>
      prev.map((p) => (idSet.has(p.id) ? { ...p, deletedAt: now } : p)),
    )
    setBulkSelected(new Set())
    setSelectedProductId((cur) => (cur && idSet.has(cur) ? null : cur))
  }, [])

  const activeProducts = useMemo(() => products.filter((p) => !p.deletedAt), [products])
  const binProducts = useMemo(() => products.filter((p) => !!p.deletedAt), [products])

  const softDelete = useCallback((id: string) => {
    setProducts((prev) => prev.map((x) => x.id === id ? { ...x, deletedAt: new Date().toISOString() } : x))
    setSelectedProductId((cur) => (cur === id ? null : cur))
  }, [])

  const restoreProduct = useCallback((id: string) => {
    setProducts((prev) => prev.map((x) => x.id === id ? { ...x, deletedAt: undefined } : x))
  }, [])

  const permanentDelete = useCallback((id: string) => {
    setProducts((prev) => prev.filter((x) => x.id !== id))
    setHardDeleteTarget(null)
  }, [])

  const [productModalOpen, setProductModalOpen] = useState(false)
  const [modalEditProduct, setModalEditProduct] = useState<ProductMasterDetail | null>(null)
  const [addProductCopySource, setAddProductCopySource] = useState<ProductMasterDetail | null>(null)
  const [copySuggestedSku, setCopySuggestedSku] = useState<string | undefined>(undefined)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(_c.selectedProductId)
  const [ctx, setCtx] = useState<null | { x: number; y: number; productId: string }>(null)

  useEffect(() => {
    _productDataFileViewCache = {
      navSelection,
      expandedMain: [...expandedMain],
      expandedSub: [...expandedSub],
      q,
      hasSearched,
      filterBrand,
      filterCarBrand,
      filterCarModel,
      filterEngine,
      filterDrive,
      filterYear,
      filterChassisCode,
      catalogSort,
      catalogViewMode,
      filterInStoreOnly,
      showMissingCategoryOnly,
      selectedProductId,
      measA,
      measB,
      measC,
      measTol,
      measActive,
      measPanelOpen,
    }
  }, [
    navSelection, expandedMain, expandedSub, q, hasSearched,
    filterBrand, filterCarBrand, filterCarModel, filterEngine, filterDrive, filterYear, filterChassisCode,
    catalogSort, catalogViewMode, filterInStoreOnly, showMissingCategoryOnly, selectedProductId,
    measA, measB, measC, measTol, measActive, measPanelOpen,
  ])
  const ctxMenuRef = useRef<HTMLDivElement>(null)
  const [ctxMenuPos, setCtxMenuPos] = useState<{ left: number; top: number } | null>(null)

  const existingSkus = useMemo(() => {
    const s = new Set(products.map((p) => p.sku.toLowerCase()))
    if (modalEditProduct) s.delete(modalEditProduct.sku.toLowerCase())
    return s
  }, [products, modalEditProduct])

  const checkBarcodeConflicts = useCallback(
    (trimmed: string) => {
      const t = trimmed.trim().toLowerCase()
      if (!t) return false
      return products.some((p) => {
        if (modalEditProduct && p.id === modalEditProduct.id) return false
        if (p.sku.toLowerCase() === t) return true
        if (p.boxBarcode?.trim().toLowerCase() === t) return true
        return false
      })
    },
    [products, modalEditProduct],
  )

  const openVehicleManage = useCallback(() => {
    openTab('car-model', 'รถ', { vehicleWorkspacePanel: 'manage' })
  }, [openTab])

  useEffect(() => {
    const onUpdate = () => setCategoryTree(loadCategoryTree())
    window.addEventListener(INVENTORY_CATEGORIES_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(INVENTORY_CATEGORIES_UPDATED_EVENT, onUpdate)
  }, [])

  useEffect(() => {
    saveProductMasterList(products, { notify: false })
  }, [products])

  useEffect(() => {
    return () => {
      void flushProductMasterDbSave()
    }
  }, [])

  useEffect(() => {
    const onMaster = () => setProducts([...getProductMasterList()])
    window.addEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, onMaster)
    return () => window.removeEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, onMaster)
  }, [])

  useEffect(() => {
    setExpandedMain(new Set())
    setExpandedSub(new Set())
  }, [categoryTree])

  const fromNav = useMemo(
    () => productsForNavSelection(navSelection, categoryTree, activeProducts),
    [navSelection, categoryTree, activeProducts],
  )

  const missingCategoryMeta = useMemo(() => {
    if (navSelection.type === 'all') {
      const count = fromNav.filter((p) => isMissingCategoryValue(p.category)).length
      return { enabled: true, count, label: 'ยังไม่มีหมวดหลัก', title: 'ดูสินค้าที่ไม่มี Category หลัก' }
    }
    if (navSelection.type === 'main') {
      const count = fromNav.filter((p) => isMissingCategoryValue(p.subCategory)).length
      return { enabled: true, count, label: 'ยังไม่มีหมวดย่อย 1', title: 'ดูสินค้าที่ยังไม่มี Subcategory' }
    }
    return { enabled: false, count: 0, label: '', title: '' }
  }, [fromNav, navSelection.type])

  useEffect(() => {
    if (!missingCategoryMeta.enabled && showMissingCategoryOnly) {
      setShowMissingCategoryOnly(false)
    }
  }, [missingCategoryMeta.enabled, showMissingCategoryOnly])

  const fromNavMissingFiltered = useMemo(() => {
    if (!showMissingCategoryOnly) return fromNav
    if (navSelection.type === 'all') {
      return fromNav.filter((p) => isMissingCategoryValue(p.category))
    }
    if (navSelection.type === 'main') {
      return fromNav.filter((p) => isMissingCategoryValue(p.subCategory))
    }
    return fromNav
  }, [fromNav, navSelection.type, showMissingCategoryOnly])

  const dimLayout: PaperDimLayout = useMemo(() => {
    if (navSelection.type === 'all') {
      return dimLayoutFromPaperFields(undefined)
    }
    return dimLayoutFromPaperFields(paperFieldsForNav(categoryTree, navSelection))
  }, [categoryTree, navSelection])

  useEffect(() => {
    if (dimLayout.slotCount === 2) {
      setMeasA('')
    }
  }, [dimLayout.slotCount])

  const fromNavCatalog = useMemo(
    () =>
      filterInStoreOnly ? fromNavMissingFiltered.filter((p) => p.inStoreCatalog !== false) : fromNavMissingFiltered,
    [fromNavMissingFiltered, filterInStoreOnly],
  )

  const globalSearchIndex = useMemo<Map<string, { hit: string; hitNorm: string }>>(() => {
    const map = new Map<string, { hit: string; hitNorm: string }>()
    for (const p of products) {
      const hit = buildSearchHitText(p)
      map.set(p.id, { hit, hitNorm: normalizeSearchText(hit) })
    }
    return map
  }, [products])

  const searchIndex = useMemo<SearchIndexRow[]>(
    () =>
      fromNavCatalog.map((product) => {
        const entry = globalSearchIndex.get(product.id) ?? { hit: '', hitNorm: '' }
        return { product, ...entry }
      }),
    [fromNavCatalog, globalSearchIndex],
  )

  /** มีสินค้าในมุมมองหมวด แต่ทุกรายการถูกซ่อนเพราะโหมดเฉพาะในร้าน */
  const catalogFilterHidesAllInNav = useMemo(
    () => filterInStoreOnly && fromNav.length > 0 && fromNavCatalog.length === 0,
    [filterInStoreOnly, fromNav, fromNavCatalog],
  )

  const afterSearch = useMemo(
    () => filterProductsBySearch(searchIndex, q),
    [searchIndex, q],
  )

  const filteredBeforeChassis = useMemo(
    () => applyProductFilters(afterSearch, filterBrand, filterCarBrand, filterCarModel, filterEngine, filterDrive, filterYear),
    [afterSearch, filterBrand, filterCarBrand, filterCarModel, filterEngine, filterDrive, filterYear],
  )
  const filtered = useMemo(() => {
    const q = filterChassisCode.trim().toUpperCase()
    const hasChassis = q.length > 0
    const hasTrim = filterTrim !== FILTER_ALL
    if (!hasChassis && !hasTrim) return filteredBeforeChassis
    return filteredBeforeChassis.filter((p) => {
      const fits = p.vehicleFitments ?? []
      return fits.some((f) => {
        if (hasChassis) {
          const codes = [f.chassisCode, f.engineCode, f.engineText].filter(Boolean) as string[]
          if (!codes.some((c) => c.toUpperCase().includes(q))) return false
        }
        if (hasTrim && (f.trim ?? '') !== filterTrim) return false
        return true
      })
    })
  }, [filteredBeforeChassis, filterChassisCode, filterTrim])

  const measureInput = useMemo(() => {
    const id = parseMeasureMm(measA)
    const od = parseMeasureMm(measB)
    const h = parseMeasureMm(measC)
    if (h === undefined || od === undefined) return null
    const input: MeasureInput = { h, od }
    if (id !== undefined) input.id = id
    return input
  }, [measA, measB, measC])

  const dimensionMatch = useMemo(() => {
    if (!measActive) {
      return { list: filtered, kind: 'none' as const }
    }
    if (!measureInput) {
      return { list: filtered, kind: 'invalid' as const }
    }
    const withDim = filtered.filter((p) => p.physicalDimensions)
    if (withDim.length === 0) {
      return { list: [], kind: 'no_dim_in_filter' as const }
    }
    const strict = withDim.filter((p) => dimensionStrictMatch(p, measureInput, measTol))
    if (strict.length > 0) {
      return { list: strict, kind: 'strict' as const }
    }
    const nearest = [...withDim]
      .map((p) => ({ p, score: dimensionScore(p, measureInput) ?? Infinity }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 8)
      .map((x) => x.p)
    return { list: nearest, kind: 'nearest' as const }
  }, [filtered, measActive, measureInput, measTol])

  const sortedList = useMemo(
    () => sortMasterCatalogList(dimensionMatch.list, catalogSort),
    [dimensionMatch.list, catalogSort],
  )

  const PAGE_SIZE = 150
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [sortedList])
  const visibleList = useMemo(() => sortedList.slice(0, visibleCount), [sortedList, visibleCount])

  // Are any vehicle filters / search active? Used to decide whether to filter the popup list
  const hasActiveVehicleFilter =
    filterCarBrand !== FILTER_ALL ||
    filterCarModel !== FILTER_ALL ||
    filterEngine !== FILTER_ALL ||
    filterDrive !== FILTER_ALL ||
    filterYear !== FILTER_ALL ||
    filterTrim !== FILTER_ALL ||
    filterChassisCode.trim().length > 0 ||
    (hasSearched && q.trim().length > 0)

  // Returns ALL fitments that pass the active filters (used to scope the "+N รุ่น" popup list)
  const findMatchingFitments = (product: ProductMasterDetail): VehicleFitmentRef[] | undefined => {
    if (!product.vehicleFitments?.length) return undefined
    if (!hasActiveVehicleFilter) return undefined // no filters → caller uses full list
    const chassisQ = filterChassisCode.trim().toUpperCase()
    const searchTokens = hasSearched && q.trim()
      ? q.trim().toLowerCase().split(/\s+/).filter((t) => t.length >= 2)
      : []
    return product.vehicleFitments.filter((f) => {
      if (filterCarBrand !== FILTER_ALL && f.brandName !== filterCarBrand) return false
      if (filterCarModel !== FILTER_ALL && f.modelName !== filterCarModel) return false
      if (filterEngine !== FILTER_ALL && normalizeEngineLabelForFilter(f.engineLabel) !== filterEngine) return false
      if (filterDrive !== FILTER_ALL) {
        const dt = filterDrive.toUpperCase()
        if ((f.driveType ?? '').toUpperCase() !== dt && (f.wheels ?? '').toUpperCase() !== dt) return false
      }
      if (filterYear !== FILTER_ALL && fitmentYearRangeKey(f) !== filterYear) return false
      if (filterTrim !== FILTER_ALL && (f.trim ?? '') !== filterTrim) return false
      if (chassisQ) {
        const codes = [f.chassisCode, f.engineCode, f.engineText].filter(Boolean) as string[]
        if (!codes.some((c) => c.toUpperCase().includes(chassisQ))) return false
      }
      if (searchTokens.length > 0) {
        const fitText = `${f.brandName} ${f.modelName}`.toLowerCase().replace(/[-\s]/g, '')
        const matches = searchTokens.some((tok) => fitText.includes(tok.replace(/[-\s]/g, '')))
        if (!matches) return false
      }
      return true
    })
  }

  // When user has filters set OR a search query, find the fitment row that matches
  // (so the row display shows the relevant fitment, not just the first one)
  const findPreferredFitment = (product: ProductMasterDetail): VehicleFitmentRef | undefined => {
    if (!product.vehicleFitments?.length) return undefined
    const chassisQ = filterChassisCode.trim().toUpperCase()
    const searchTokens = hasSearched && q.trim()
      ? q.trim().toLowerCase().split(/\s+/).filter((t) => t.length >= 2)
      : []
    const hasAny =
      filterCarBrand !== FILTER_ALL ||
      filterCarModel !== FILTER_ALL ||
      filterEngine !== FILTER_ALL ||
      filterDrive !== FILTER_ALL ||
      filterYear !== FILTER_ALL ||
      filterTrim !== FILTER_ALL ||
      chassisQ.length > 0 ||
      searchTokens.length > 0
    if (!hasAny) return undefined
    for (const f of product.vehicleFitments) {
      if (filterCarBrand !== FILTER_ALL && f.brandName !== filterCarBrand) continue
      if (filterCarModel !== FILTER_ALL && f.modelName !== filterCarModel) continue
      if (filterEngine !== FILTER_ALL && normalizeEngineLabelForFilter(f.engineLabel) !== filterEngine) continue
      if (filterDrive !== FILTER_ALL) {
        const dt = filterDrive.toUpperCase()
        if ((f.driveType ?? '').toUpperCase() !== dt && (f.wheels ?? '').toUpperCase() !== dt) continue
      }
      if (filterYear !== FILTER_ALL && fitmentYearRangeKey(f) !== filterYear) continue
      if (filterTrim !== FILTER_ALL && (f.trim ?? '') !== filterTrim) continue
      if (chassisQ) {
        const codes = [f.chassisCode, f.engineCode, f.engineText].filter(Boolean) as string[]
        if (!codes.some((c) => c.toUpperCase().includes(chassisQ))) continue
      }
      // For search tokens, prefer fitments where the brand/model contains a token
      if (searchTokens.length > 0) {
        const fitText = `${f.brandName} ${f.modelName}`.toLowerCase().replace(/[-\s]/g, '')
        const matches = searchTokens.some((tok) => fitText.includes(tok.replace(/[-\s]/g, '')))
        if (!matches) continue
      }
      return f
    }
    return undefined
  }

  function handleCatalogHeaderSort(key: MasterCatalogSortKey) {
    setCatalogSort((prev) => toggleMasterCatalogSort(prev, key))
  }

  const filterOptions = useMemo(() => {
    // Scope filter options to:
    //   1) currently-selected category (sidebar)
    //   2) AND the active search-bar query (so typing "Vios" narrows make/model/year dropdowns
    //      to only what's in the Vios results)
    let base = filterInStoreOnly ? fromNav.filter((p) => p.inStoreCatalog !== false) : fromNav
    if (hasSearched && q.trim().length > 0) {
      const matched = filterProductsBySearch(searchIndex, q)
      const matchedIds = new Set(matched.map((p) => p.id))
      base = base.filter((p) => matchedIds.has(p.id))
    }
    const brands = [...new Set(base.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'th'))
    const { carBrands, models, engines, driveTypes, years } = collectInventoryCarFilterOptions(base, {
      carBrand: filterCarBrand,
      carModel: filterCarModel,
      engineLabel: filterEngine,
      driveType: filterDrive,
      filterAll: FILTER_ALL,
    })
    // Trim options — collect from active products' fitments (cascade with model/brand)
    const trimSet = new Set<string>()
    for (const p of base) {
      for (const f of p.vehicleFitments ?? []) {
        if (filterCarBrand !== FILTER_ALL && f.brandName !== filterCarBrand) continue
        if (filterCarModel !== FILTER_ALL && f.modelName !== filterCarModel) continue
        if (f.trim?.trim()) trimSet.add(f.trim.trim())
      }
    }
    const trims = [...trimSet].sort((a, b) => a.localeCompare(b, 'th'))
    return { brands, carBrands, models, engines, driveTypes, years, trims }
  }, [fromNav, filterInStoreOnly, filterCarBrand, filterCarModel, filterEngine, filterDrive, hasSearched, q, searchIndex])

  const hasOrphans = useMemo(() => {
    const names = new Set(categoryTree.map((m) => norm(m.name)))
    return activeProducts.some((p) => !names.has(norm(p.category)))
  }, [categoryTree, activeProducts])

  const navCounts = useMemo(() => {
    const base = filterInStoreOnly ? activeProducts.filter((p) => p.inStoreCatalog !== false) : activeProducts
    const mainByName = new Map<string, number>()
    const subByMainSub = new Map<string, number>()
    const subSubByMainSubSub = new Map<string, number>()
    const mainNameSet = new Set(categoryTree.map((m) => norm(m.name)))
    let orphan = 0
    for (const p of base) {
      const mainKey = norm(p.category)
      if (!mainNameSet.has(mainKey)) {
        orphan += 1
        continue
      }
      mainByName.set(mainKey, (mainByName.get(mainKey) ?? 0) + 1)
      const subKey = norm(p.subCategory ?? '')
      if (subKey) {
        const msKey = `${mainKey}::${subKey}`
        subByMainSub.set(msKey, (subByMainSub.get(msKey) ?? 0) + 1)
      }
      const subSubKey = norm(p.subSubCategory ?? '')
      if (subKey && subSubKey) {
        const mssKey = `${mainKey}::${subKey}::${subSubKey}`
        subSubByMainSubSub.set(mssKey, (subSubByMainSubSub.get(mssKey) ?? 0) + 1)
      }
    }
    return { mainByName, subByMainSub, subSubByMainSubSub, orphan, total: base.length }
  }, [categoryTree, activeProducts, filterInStoreOnly])

  const detailProduct = useMemo(
    () => (detailProductId ? products.find((p) => p.id === detailProductId) : undefined),
    [detailProductId, products],
  )

  const selectedProduct = useMemo(
    () => (selectedProductId ? products.find((p) => p.id === selectedProductId) ?? null : null),
    [products, selectedProductId],
  )

  const openProductDetail = useCallback((id: string) => {
    setDetailProductId(id)
    setPage('detail')
    setSelectedProductId(id)
  }, [])

  function backToCatalog() {
    setPage('browse')
    setDetailProductId(null)
  }

  function openCopyFromProduct(p: ProductMasterDetail) {
    setModalEditProduct(null)
    setAddProductCopySource(p)
    setCopySuggestedSku(generateNextTenDigitSku(products))
    setProductModalOpen(true)
  }

  const openProductContextMenu = useCallback((e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    setSelectedProductId(productId)
    setCtxMenuPos(null)
    setCtx({ x: e.clientX, y: e.clientY, productId })
  }, [])

  const handleSelectProduct = useCallback((id: string) => {
    setSelectedProductId(id)
  }, [])

  useEffect(() => {
    if (productModalOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.key === 'F2') {
        if (page !== 'browse' || !selectedProduct) return
        e.preventDefault()
        setCtx(null)
        openCopyFromProduct(selectedProduct)
        return
      }
      if (e.key === 'F8') {
        if (e.ctrlKey || e.metaKey || e.altKey) return
        const target = e.target as HTMLElement | null
        if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
        const id = page === 'detail' ? detailProductId : selectedProductId
        if (!id) return
        const p = products.find((x) => x.id === id)
        if (!p) return
        e.preventDefault()
        setCtx(null)
        enqueueProductLabelPrintFromMaster(p)
        return
      }
      if (page !== 'browse') return
      if (e.key === 'Escape') {
        setCtx(null)
      } else if (e.key === 'ContextMenu') {
        if (!selectedProduct) return
        const anchor = document.activeElement?.getBoundingClientRect()
        if (!anchor) return
        setCtxMenuPos(null)
        setCtx({
          x: Math.round(anchor.left + Math.min(40, anchor.width - 10)),
          y: Math.round(anchor.top + Math.min(16, anchor.height - 10)),
          productId: selectedProduct.id,
        })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [page, productModalOpen, selectedProduct, selectedProductId, detailProductId, products])

  function toggleMain(mainId: string) {
    setExpandedMain((prev) => (prev.has(mainId) ? new Set() : new Set([mainId])))
    setExpandedSub(new Set())
  }

  function toggleSub(mainId: string, subId: string) {
    const key = `${mainId}::${subId}`
    setExpandedSub((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectClass =
    'w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200'

  const viewToggleBtn = (mode: CatalogViewMode, label: ReactNode, icon: ReactNode) => (
    <button
      type="button"
      onClick={() => setCatalogViewMode(mode)}
      aria-pressed={catalogViewMode === mode}
      className={clsx(
        'inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition',
        catalogViewMode === mode
          ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
          : 'text-slate-600 hover:bg-white/80',
      )}
    >
      {icon}
      {label}
    </button>
  )

  useLayoutEffect(() => {
    if (!ctx) {
      setCtxMenuPos(null)
      return
    }
    const el = ctxMenuRef.current
    if (!el) return
    const pad = 6
    const vw = window.innerWidth
    const vh = window.innerHeight
    const rect = el.getBoundingClientRect()
    let left = ctx.x
    let top = ctx.y

    if (top + rect.height > vh - pad) {
      const above = ctx.y - rect.height
      if (above >= pad) top = above
      else top = Math.max(pad, vh - rect.height - pad)
    }

    if (left + rect.width > vw - pad) {
      left = Math.max(pad, vw - rect.width - pad)
    }
    if (left < pad) left = pad
    if (top < pad) top = pad

    setCtxMenuPos((prev) => (prev && prev.left === left && prev.top === top ? prev : { left, top }))
  }, [ctx])

  if (page === 'detail') {
    if (!detailProduct) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-10 text-center">
          <p className="text-sm text-amber-900">ไม่พบข้อมูลสินค้า</p>
          <button
            type="button"
            onClick={backToCatalog}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            <ArrowLeft className="size-4" />
            กลับรายการสินค้า
          </button>
        </div>
      )
    }

    return (
      <div className="min-w-0 flex-1 space-y-4 pos-compact:space-y-3">
        <button
          type="button"
          onClick={backToCatalog}
          className="inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          กลับรายการสินค้า
        </button>
        <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
          <span className="text-slate-400">หน้าแรก</span>
          <span className="mx-1 text-slate-300">/</span>
          <span className="text-slate-400">แฟ้มข้อมูลสินค้า</span>
          <span className="mx-1 text-slate-300">/</span>
          <span className="font-medium text-slate-800">{detailProduct.name}</span>
        </nav>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">ข้อมูลสินค้า</h2>
        <ProductMasterDetailContent
          selected={detailProduct}
          onEdit={
            allowCost
              ? () => {
                  setModalEditProduct(detailProduct)
                  setAddProductCopySource(null)
                  setCopySuggestedSku(undefined)
                  setProductModalOpen(true)
                }
              : undefined
          }
          onSoftDelete={
            allowCost
              ? () => {
                  softDelete(detailProduct.id)
                  setPage('browse')
                  setDetailProductId(null)
                }
              : undefined
          }
          onOpenVehicleManage={openVehicleManage}
        />
        <AddProductModal
          open={productModalOpen}
          onClose={() => {
            setProductModalOpen(false)
            setModalEditProduct(null)
            setAddProductCopySource(null)
            setCopySuggestedSku(undefined)
          }}
          onCreate={(p) => setProducts((prev) => [p, ...prev])}
          onUpdate={(p) =>
            setProducts((prev) => {
              const next = prev.map((x) => (x.id === p.id ? p : x))
              return next
            })
          }
          editingProduct={modalEditProduct}
          categoryTree={categoryTree}
          existingSkus={existingSkus}
          checkBarcodeConflicts={checkBarcodeConflicts}
          onOpenVehicleManage={openVehicleManage}
          copySource={addProductCopySource}
          suggestedSku={copySuggestedSku}
          browseNav={navSelection}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 pos-compact:gap-2 lg:flex-row lg:gap-3 pos-compact:lg:gap-2">
      <aside
        className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 shadow-sm pos-compact:rounded-xl lg:w-[13.5rem] lg:max-w-[13.5rem] pos-compact:lg:w-[11.5rem]"
        aria-label="เลือกหมวดหมู่สินค้า"
      >
        <div className="border-b border-slate-200/90 bg-white/90 px-2.5 py-2 pos-compact:px-2 pos-compact:py-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 pos-compact:text-[10px]">
            หมวดหมู่สินค้า
          </p>
        </div>
        <nav className="min-h-0 max-h-[min(70vh,36rem)] flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-2 pos-compact:max-h-[min(65vh,28rem)] pos-compact:py-1.5">
          <button
            type="button"
            onClick={() => { setNavSelection({ type: 'all' }); setShowBin(false) }}
            className={clsx(
              'mb-1 flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium pos-compact:py-1 pos-compact:text-[13px]',
              navSelection.type === 'all' && !showBin
                ? 'bg-teal-100 text-teal-900 ring-1 ring-teal-200/80'
                : 'text-slate-800 hover:bg-white',
            )}
          >
            <span>ทั้งหมด</span>
            <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-700">
              {navCounts.total.toLocaleString('th-TH')}
            </span>
          </button>
          {categoryTree.length === 0 ? (
            <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-2 py-2.5 text-center text-[11px] leading-snug text-amber-900 pos-compact:text-[10px]">
              ยังไม่มีหมวดหมู่ — ไปที่ «จัดการหมวดหมู่»
            </p>
          ) : (
            categoryTree.map((main) => {
              const subs = main.subcategories
              const open = expandedMain.has(main.id)
              const mainSelected =
                navSelection.type === 'main' && navSelection.mainId === main.id
              const mainCount = navCounts.mainByName.get(norm(main.name)) ?? 0

              return (
                <div key={main.id} className="mb-0.5">
                  {subs.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setNavSelection({ type: 'main', mainId: main.id })}
                      className={clsx(
                        'flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm pos-compact:py-1 pos-compact:text-[13px]',
                        mainSelected
                          ? 'bg-teal-100 font-medium text-teal-900 ring-1 ring-teal-200/80'
                          : 'font-medium text-slate-800 hover:bg-white',
                      )}
                    >
                      <span className="line-clamp-2">{main.name}</span>
                      <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700">
                        {mainCount.toLocaleString('th-TH')}
                      </span>
                    </button>
                  ) : (
                    <>
                      <div className="flex min-w-0 items-stretch gap-0.5">
                        <button
                          type="button"
                          onClick={() => toggleMain(main.id)}
                          className="flex shrink-0 items-center justify-center rounded-lg px-0.5 text-slate-500 hover:bg-white hover:text-slate-800"
                          aria-expanded={open}
                          aria-label={open ? 'ยุบหมวดย่อย' : 'ขยายหมวดย่อย'}
                        >
                          {open ? (
                            <ChevronDown className="size-4 pos-compact:size-3.5" aria-hidden />
                          ) : (
                            <ChevronRight className="size-4 pos-compact:size-3.5" aria-hidden />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNavSelection({ type: 'main', mainId: main.id })
                            setExpandedMain(new Set([main.id]))
                            setExpandedSub(new Set())
                          }}
                          className={clsx(
                            'min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm pos-compact:py-1 pos-compact:text-[13px]',
                            mainSelected
                              ? 'bg-teal-100 font-medium text-teal-900 ring-1 ring-teal-200/80'
                              : 'font-medium text-slate-800 hover:bg-white',
                          )}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="line-clamp-2">{main.name}</span>
                            <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700">
                              {mainCount.toLocaleString('th-TH')}
                            </span>
                          </span>
                        </button>
                      </div>
                      {open && (
                        <div className="ml-4 space-y-1 border-l border-slate-200/90 py-0.5 pl-2">
                          {subs.map((sub) => {
                            const subSel =
                              (navSelection.type === 'sub' &&
                                navSelection.mainId === main.id &&
                                navSelection.subId === sub.id) ||
                              (navSelection.type === 'subsub' &&
                                navSelection.mainId === main.id &&
                                navSelection.subId === sub.id)
                            const subSubs = sub.subSubcategories
                            const subKey = `${main.id}::${sub.id}`
                            const subOpen = expandedSub.has(subKey)
                            const subCount =
                              navCounts.subByMainSub.get(`${norm(main.name)}::${norm(sub.name)}`) ?? 0
                            return (
                              <div key={sub.id} className="space-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNavSelection({ type: 'sub', mainId: main.id, subId: sub.id })
                                    if (subSubs.length > 0) toggleSub(main.id, sub.id)
                                  }}
                                  className={clsx(
                                    'w-full rounded-md px-2 py-1 text-left text-[13px] pos-compact:text-[12px]',
                                    subSel
                                      ? 'bg-teal-100 font-medium text-teal-900 ring-1 ring-teal-200/80'
                                      : 'text-slate-700 hover:bg-white',
                                  )}
                                >
                                  <span className="flex items-center justify-between gap-2">
                                    <span className="line-clamp-2">{sub.name}</span>
                                    <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700">
                                      {subCount.toLocaleString('th-TH')}
                                    </span>
                                  </span>
                                </button>
                                {subSubs.length > 0 && subOpen ? (
                                  <div className="ml-0 space-y-0.5 border-l border-slate-200/70 py-0.5 pl-2">
                                    {subSubs.map((ss) => {
                                      const ssSel =
                                        navSelection.type === 'subsub' &&
                                        navSelection.mainId === main.id &&
                                        navSelection.subId === sub.id &&
                                        navSelection.subSubId === ss.id
                                      const subSubCount =
                                        navCounts.subSubByMainSubSub.get(
                                          `${norm(main.name)}::${norm(sub.name)}::${norm(ss.name)}`,
                                        ) ?? 0
                                      return (
                                        <button
                                          key={ss.id}
                                          type="button"
                                          onClick={() =>
                                            setNavSelection({
                                              type: 'subsub',
                                              mainId: main.id,
                                              subId: sub.id,
                                              subSubId: ss.id,
                                            })
                                          }
                                          className={clsx(
                                            'w-full rounded-md py-1 pl-3 pr-2 text-left text-[12px] leading-snug text-slate-600 pos-compact:text-[11px]',
                                            ssSel
                                              ? 'bg-teal-100 font-medium text-teal-900 ring-1 ring-teal-200/80'
                                              : 'hover:bg-white',
                                          )}
                                        >
                                          <span className="flex items-center justify-between gap-2">
                                            <span className="line-clamp-2">{ss.name}</span>
                                            <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700">
                                              {subSubCount.toLocaleString('th-TH')}
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
          {hasOrphans && (
            <button
              type="button"
              onClick={() => { setNavSelection({ type: 'orphan' }); setShowBin(false) }}
              className={clsx(
                'mt-2 flex w-full items-center justify-between gap-2 rounded-lg border border-amber-200/80 px-2 py-2 text-left text-[11px] font-medium leading-snug pos-compact:text-[10px]',
                navSelection.type === 'orphan' && !showBin
                  ? 'bg-amber-100 text-amber-950 ring-1 ring-amber-200/90'
                  : 'bg-amber-50/80 text-amber-900 hover:bg-amber-100/90',
              )}
            >
              <span>สินค้าไม่ตรงหมวดในระบบ</span>
              <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-900">
                {navCounts.orphan.toLocaleString('th-TH')}
              </span>
            </button>
          )}
          {/* Bin button */}
          <button
            type="button"
            onClick={() => setShowBin(true)}
            className={clsx(
              'mt-2 flex w-full items-center justify-between gap-2 rounded-lg border px-2 py-2 text-left text-[11px] font-medium leading-snug pos-compact:text-[10px]',
              showBin
                ? 'border-rose-200/80 bg-rose-100 text-rose-950 ring-1 ring-rose-200/90'
                : 'border-slate-200/60 bg-white/60 text-slate-500 hover:bg-slate-50',
            )}
          >
            <span className="flex items-center gap-1.5">
              <Trash2 className="size-3 shrink-0" />
              ถังขยะ
            </span>
            {binProducts.length > 0 && (
              <span className={clsx('shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                showBin ? 'bg-rose-200 text-rose-900' : 'bg-slate-100 text-slate-500'
              )}>
                {binProducts.length.toLocaleString('th-TH')}
              </span>
            )}
          </button>
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-3 pos-compact:space-y-2">
        {showBin ? (
          /* ─── Bin view ─── */
          <div className="rounded-2xl border border-rose-100 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-rose-100 bg-rose-50/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <Trash2 className="size-4 text-rose-500" />
                <p className="text-sm font-semibold text-rose-900">ถังขยะ</p>
                <span className="rounded-full bg-rose-200 px-2 py-0.5 text-[11px] font-bold tabular-nums text-rose-900">
                  {binProducts.length}
                </span>
              </div>
              <p className="text-xs text-rose-700">สินค้าที่ถูกลบจะอยู่ที่นี่ — กด «คืนสินค้า» เพื่อนำกลับมา หรือ «ลบถาวร» เพื่อลบออกจากระบบ</p>
            </div>
            {binProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
                <Trash2 className="size-10 stroke-[1]" />
                <p className="text-sm">ถังขยะว่างเปล่า</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {binProducts.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-rose-50/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
                      <p className="text-[11px] text-slate-500">
                        SKU: <span className="font-mono">{p.sku}</span>
                        {p.deletedAt && (
                          <span className="ml-2 text-slate-400">
                            ลบเมื่อ {new Date(p.deletedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => restoreProduct(p.id)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                    >
                      <RotateCcw className="size-3.5" />
                      คืนสินค้า
                    </button>
                    <button
                      type="button"
                      onClick={() => setHardDeleteTarget(p)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="size-3.5" />
                      ลบถาวร
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
        <>
        <nav className="text-[11px] text-slate-500 pos-compact:text-[10px]" aria-label="Breadcrumb">
          <span className="text-slate-400">หน้าแรก</span>
          <span className="mx-1 text-slate-300">/</span>
          <span className="font-medium text-slate-700">{breadcrumbLabel(categoryTree, navSelection)}</span>
        </nav>

        <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
          <span className="text-slate-500">สินค้าแสดงผล</span>
          <span className="font-semibold tabular-nums text-slate-900">{sortedList.length.toLocaleString('th-TH')}</span>
          <span className="text-slate-500">จาก</span>
          <span className="tabular-nums text-slate-700">{navCounts.total.toLocaleString('th-TH')}</span>
          <span className="text-slate-500">รายการ</span>
        </div>

        <div className="flex flex-col gap-2 pos-compact:gap-1.5 sm:flex-row sm:items-stretch sm:gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="ค้นหาสินค้า (ชื่อ, SKU, OEM, Cross ref, หมวด...)"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-2.5 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
              key={q}
              defaultValue={q}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                setHasSearched(true)
                setQ(e.currentTarget.value)
              }}
            />
          </div>
          {allowCost ? (
            <button
              type="button"
              disabled={categoryTree.length === 0}
              title={categoryTree.length === 0 ? 'เพิ่มหมวดหมู่ก่อน (จัดการหมวดหมู่)' : undefined}
              onClick={() => {
                setModalEditProduct(null)
                setAddProductCopySource(null)
                setCopySuggestedSku(undefined)
                setProductModalOpen(true)
              }}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
            >
              <Plus className="size-3.5" strokeWidth={2} />
              เพิ่มสินค้า
            </button>
          ) : null}
        </div>

        <AddProductModal
          open={productModalOpen}
          onClose={() => {
            setProductModalOpen(false)
            setModalEditProduct(null)
            setAddProductCopySource(null)
            setCopySuggestedSku(undefined)
          }}
          onCreate={(p) => setProducts((prev) => [p, ...prev])}
          onUpdate={(p) => setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)))}
          editingProduct={modalEditProduct}
          categoryTree={categoryTree}
          existingSkus={existingSkus}
          checkBarcodeConflicts={checkBarcodeConflicts}
          onOpenVehicleManage={openVehicleManage}
          copySource={addProductCopySource}
          suggestedSku={copySuggestedSku}
          browseNav={navSelection}
        />

        <div className="grid w-full gap-1.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <label className="block min-w-0">
            <span className="mb-0.5 block text-[11px] text-slate-500">แบรนด์</span>
            <SearchableFilterSelect
              value={filterBrand}
              options={filterOptions.brands}
              allValue={FILTER_ALL}
              onChange={setFilterBrand}
              ariaLabel="แบรนด์"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-0.5 block text-[11px] text-slate-500">ยี่ห้อรถ</span>
            <SearchableFilterSelect
              value={filterCarBrand}
              options={filterOptions.carBrands}
              allValue={FILTER_ALL}
              onChange={(v) => { setFilterCarBrand(v); setFilterCarModel(FILTER_ALL); setFilterEngine(FILTER_ALL); setFilterDrive(FILTER_ALL); setFilterYear(FILTER_ALL) }}
              ariaLabel="ยี่ห้อรถ"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-0.5 block text-[11px] text-slate-500">รุ่นรถ</span>
            <SearchableFilterSelect
              value={filterCarModel}
              options={filterOptions.models}
              allValue={FILTER_ALL}
              onChange={(v) => { setFilterCarModel(v); setFilterEngine(FILTER_ALL); setFilterDrive(FILTER_ALL); setFilterYear(FILTER_ALL) }}
              ariaLabel="รุ่นรถ"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-0.5 block text-[11px] text-slate-500">รุ่นย่อย / Trim</span>
            <SearchableFilterSelect
              value={filterTrim}
              options={filterOptions.trims}
              allValue={FILTER_ALL}
              onChange={setFilterTrim}
              ariaLabel="รุ่นย่อย / Trim"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-0.5 block text-[11px] text-slate-500">เครื่องยนต์</span>
            <SearchableFilterSelect
              value={filterEngine}
              options={filterOptions.engines}
              allValue={FILTER_ALL}
              onChange={(v) => { setFilterEngine(v); setFilterDrive(FILTER_ALL); setFilterYear(FILTER_ALL) }}
              ariaLabel="เครื่องยนต์"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-0.5 block text-[11px] text-slate-500">ขับเคลื่อน / ล้อ</span>
            <SearchableFilterSelect
              value={filterDrive}
              options={filterOptions.driveTypes}
              allValue={FILTER_ALL}
              onChange={(v) => { setFilterDrive(v); setFilterYear(FILTER_ALL) }}
              ariaLabel="ขับเคลื่อน / ล้อ"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-0.5 block text-[11px] text-slate-500">รุ่นปี</span>
            <SearchableFilterSelect
              value={filterYear}
              options={filterOptions.years}
              allValue={FILTER_ALL}
              onChange={setFilterYear}
              ariaLabel="รุ่นปี"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-0.5 block text-[11px] text-slate-500">รหัสตัวถัง / chassis</span>
            <div className="flex min-w-0 items-stretch gap-1.5">
              <div className="relative min-w-0 flex-1">
                <input
                  type="text"
                  value={filterChassisCode}
                  onChange={(e) => setFilterChassisCode(e.target.value)}
                  placeholder="เช่น FM2P, JZS155"
                  className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-sm uppercase shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                  aria-label="ค้นหารหัสตัวถัง"
                />
                {filterChassisCode && (
                  <button
                    type="button"
                    onClick={() => setFilterChassisCode('')}
                    className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="ล้างรหัสตัวถัง"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                type="button"
                aria-expanded={measPanelOpen}
                aria-controls="catalog-meas-dimension-panel"
                title="ค้นหาตามมิติ (กรณีไม่เห็นเบอร์ OEM)"
                onClick={() => setMeasPanelOpen((open) => !open)}
                className={clsx(
                  'relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-200/90 bg-gradient-to-br from-violet-50 to-white text-violet-800 shadow-sm outline-none ring-violet-300/40 transition hover:border-violet-300 hover:bg-violet-100/80 focus-visible:ring-2',
                  measPanelOpen && 'border-violet-400 bg-violet-100/80',
                )}
              >
                <Ruler className="size-4" strokeWidth={1.75} aria-hidden />
                <span className="sr-only">เปิดหรือย่อค้นหาตามมิติ</span>
                {measActive ? (
                  <span
                    className="absolute right-1.5 top-1.5 size-2 rounded-full bg-emerald-500 ring-2 ring-white"
                    aria-hidden
                  />
                ) : null}
              </button>
            </div>
          </label>
        </div>

        {(() => {
          const activeFilterCount =
            (filterBrand !== FILTER_ALL ? 1 : 0)
            + (filterCarBrand !== FILTER_ALL ? 1 : 0)
            + (filterCarModel !== FILTER_ALL ? 1 : 0)
            + (filterEngine !== FILTER_ALL ? 1 : 0)
            + (filterDrive !== FILTER_ALL ? 1 : 0)
            + (filterYear !== FILTER_ALL ? 1 : 0)
            + (filterTrim !== FILTER_ALL ? 1 : 0)
            + (filterChassisCode.trim().length > 0 ? 1 : 0)
          if (activeFilterCount === 0) return null
          return (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setFilterBrand(FILTER_ALL)
                  setFilterCarBrand(FILTER_ALL)
                  setFilterCarModel(FILTER_ALL)
                  setFilterEngine(FILTER_ALL)
                  setFilterDrive(FILTER_ALL)
                  setFilterYear(FILTER_ALL)
                  setFilterTrim(FILTER_ALL)
                  setFilterChassisCode('')
                }}
                className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
              >
                ล้างตัวกรอง ({activeFilterCount})
              </button>
            </div>
          )
        })()}

        {measPanelOpen ? (
        <section
          id="catalog-meas-dimension-panel"
          className="rounded-xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white p-3 shadow-sm pos-compact:p-2.5 pos-compact:rounded-lg"
        >
          <div className="flex flex-wrap items-start gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-800">
              <Ruler className="size-4" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-violet-950">ค้นหาตามมิติ (กรณีไม่เห็นเบอร์ OEM)</h3>
                  <p className="mt-0.5 text-[11px] leading-snug text-violet-900/90">ใช้หน่วยเป็น มิลลิเมตร(mm)</p>
                </div>
                <button
                  type="button"
                  aria-expanded
                  aria-controls="catalog-meas-dimension-panel"
                  title="ย่อแถบค้นหามิติ"
                  onClick={() => setMeasPanelOpen(false)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-violet-200 bg-white px-2 py-1 text-[11px] font-medium text-violet-900 hover:bg-violet-50"
                >
                  <ChevronUp className="size-3.5" aria-hidden />
                  ย่อ
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <div
                  className={clsx(
                    'grid w-full min-w-0 gap-2',
                    dimLayout.slotCount === 2 && 'grid-cols-2 sm:grid-cols-3',
                    dimLayout.slotCount === 3 && 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-5',
                    (dimLayout.slotCount === 0 || dimLayout.slotCount === 1) &&
                      'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
                  )}
                >
                  {dimLayout.slotCount === 2 ? (
                    <>
                      <label className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[11px] font-medium leading-snug text-violet-900/90">{dimLayout.b}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="เช่น 68"
                          value={measB}
                          onChange={(e) => setMeasB(e.target.value)}
                          aria-label={dimLayout.b}
                          className="w-full min-w-0 rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-xs tabular-nums outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                        />
                      </label>
                      <label className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[11px] font-medium leading-snug text-violet-900/90">{dimLayout.c}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="เช่น 85"
                          value={measC}
                          onChange={(e) => setMeasC(e.target.value)}
                          aria-label={dimLayout.c}
                          className="w-full min-w-0 rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-xs tabular-nums outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                        />
                      </label>
                    </>
                  ) : dimLayout.slotCount === 3 ? (
                    <>
                      <label className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[11px] font-medium leading-snug text-violet-900/90">{dimLayout.a}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="ไม่บังคับ"
                          value={measA}
                          onChange={(e) => setMeasA(e.target.value)}
                          aria-label={dimLayout.a}
                          className="w-full min-w-0 rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-xs tabular-nums outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                        />
                      </label>
                      <label className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[11px] font-medium leading-snug text-violet-900/90">{dimLayout.b}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="เช่น 68"
                          value={measB}
                          onChange={(e) => setMeasB(e.target.value)}
                          aria-label={dimLayout.b}
                          className="w-full min-w-0 rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-xs tabular-nums outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                        />
                      </label>
                      <label className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[11px] font-medium leading-snug text-violet-900/90">{dimLayout.c}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="เช่น 85"
                          value={measC}
                          onChange={(e) => setMeasC(e.target.value)}
                          aria-label={dimLayout.c}
                          className="w-full min-w-0 rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-xs tabular-nums outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[11px] font-medium leading-snug text-violet-900/90">{dimLayout.a}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="ไม่บังคับ"
                          value={measA}
                          onChange={(e) => setMeasA(e.target.value)}
                          aria-label={dimLayout.a}
                          className="w-full min-w-0 rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-xs tabular-nums outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                        />
                      </label>
                      <label className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[11px] font-medium leading-snug text-violet-900/90">{dimLayout.b}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="เช่น 68"
                          value={measB}
                          onChange={(e) => setMeasB(e.target.value)}
                          aria-label={dimLayout.b}
                          className="w-full min-w-0 rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-xs tabular-nums outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                        />
                      </label>
                      <label className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[11px] font-medium leading-snug text-violet-900/90">{dimLayout.c}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="เช่น 85"
                          value={measC}
                          onChange={(e) => setMeasC(e.target.value)}
                          aria-label={dimLayout.c}
                          className="w-full min-w-0 rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-xs tabular-nums outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                        />
                      </label>
                    </>
                  )}
                  <label className="flex min-w-0 flex-col gap-0.5 sm:col-span-2 lg:col-span-1">
                    <span className="text-[11px] font-medium text-violet-900/90">คลาดเคลื่อนได้±</span>
                    <select
                      aria-label="คลาดเคลื่อนได้ ±"
                      className="w-full min-w-0 rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                      value={measTol}
                      onChange={(e) => setMeasTol(Number(e.target.value))}
                    >
                      {[1, 2, 3, 5, 8].map((n) => (
                        <option key={n} value={n}>
                          ± {n} mm
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMeasActive(true)}
                    className="rounded-lg border border-violet-700 bg-violet-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-900"
                  >
                    ใช้การค้นหามิติ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMeasActive(false)
                      setMeasA('')
                      setMeasB('')
                      setMeasC('')
                    }}
                    className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-900 hover:bg-violet-50"
                  >
                    ล้างมิติ
                  </button>
                </div>
              </div>
              {measActive && dimensionMatch.kind === 'invalid' && (
                <p className="text-xs font-medium text-rose-700">
                  กรุณากรอกมิติ B และ C (มม.) เป็นตัวเลขที่ถูกต้อง
                </p>
              )}
              {measActive && measureInput && dimensionMatch.kind === 'strict' && (
                <p className="text-xs font-medium text-emerald-800">
                  พบสินค้าที่มิติตรงภายใน ±{measTol} mm ต่อมิติ
                </p>
              )}
              {measActive && measureInput && dimensionMatch.kind === 'nearest' && (
                <p className="text-xs font-medium text-amber-900">
                  ไม่พบในช่วงที่กำหนด — แสดงสินค้าที่มิติใกล้เคียงที่สุด (เรียงจากใกล้ไปไกล)
                </p>
              )}
              {measActive && dimensionMatch.kind === 'no_dim_in_filter' && (
                <p className="text-xs font-medium text-amber-900">
                  ในรายการที่กรองอยู่ไม่มีสินค้าที่ลงมิติไว้ — ลองขยายหมวดหรือปิดตัวกรอง
                </p>
              )}
            </div>
          </div>
        </section>
        ) : null}

        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 border-b border-slate-100 pb-2 pos-compact:gap-x-2 pos-compact:gap-y-1.5 pos-compact:pb-1.5">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
                <span className="shrink-0 text-[11px] font-medium text-slate-500">มุมมอง</span>
                <div
                  role="group"
                  aria-label="สลับมุมมองรายการสินค้า"
                  className="inline-flex shrink-0 flex-wrap rounded-lg border border-slate-200 bg-slate-50 p-0.5"
                >
                  {viewToggleBtn('list', 'รายการ', <LayoutList className="size-3.5" strokeWidth={1.75} />)}
                  {viewToggleBtn(
                    'flip-card',
                    'การ์ด',
                    <LayoutGrid className="size-3.5" strokeWidth={1.75} />,
                  )}
                </div>
              </div>
              <div className="flex w-full min-w-0 flex-wrap items-end justify-end sm:ml-auto sm:w-auto">
                {missingCategoryMeta.enabled ? (
                  <button
                    type="button"
                    onClick={() => setShowMissingCategoryOnly((v) => !v)}
                    title={missingCategoryMeta.title}
                    className={clsx(
                      'mr-2 inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition',
                      showMissingCategoryOnly
                        ? 'border-violet-300 bg-violet-100 text-violet-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    <span>{missingCategoryMeta.label}</span>
                    <span className="rounded-md bg-white/90 px-1.5 py-0.5 tabular-nums text-[10px] text-slate-700">
                      {missingCategoryMeta.count.toLocaleString('th-TH')}
                    </span>
                  </button>
                ) : null}
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1">
                  <span className="text-[11px] font-medium text-slate-600">เฉพาะในร้าน</span>
                  <div className="flex items-center gap-1">
                    <Store
                      className={clsx(
                        'size-3.5 shrink-0',
                        filterInStoreOnly ? 'text-emerald-600' : 'text-slate-400',
                      )}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <button
                      type="button"
                      role="switch"
                      aria-checked={filterInStoreOnly}
                      aria-label={
                        filterInStoreOnly
                          ? 'เฉพาะสินค้าในร้าน — กดเพื่อแสดงรายการอ้างอิงทั้งหมด'
                          : 'แสดงทุกรายการ — กดเพื่อดูเฉพาะสินค้าในร้าน'
                      }
                      title={
                        filterInStoreOnly
                          ? 'เฉพาะสินค้าในร้าน — กดเพื่อแสดงรายการอ้างอิงทั้งหมด'
                          : 'แสดงทุกรายการ — กดเพื่อดูเฉพาะสินค้าในร้าน'
                      }
                      onClick={() => {
                        setFilterInStoreOnly((v) => !v)
                        setFilterBrand(FILTER_ALL)
                        setFilterCarBrand(FILTER_ALL)
                        setFilterCarModel(FILTER_ALL)
                        setFilterYear(FILTER_ALL)
                        setFilterDrive(FILTER_ALL)
                        setQ('')
                        setHasSearched(false)
                      }}
                      className={clsx(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1',
                        filterInStoreOnly
                          ? 'border-emerald-600 bg-emerald-500'
                          : 'border-slate-300 bg-slate-200',
                      )}
                    >
                      <span
                        className={clsx(
                          'pointer-events-none absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200',
                          filterInStoreOnly ? 'translate-x-4' : 'translate-x-0.5',
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

        {!showBin && allowCost && bulkSelected.size > 0 ? (
          <div className="sticky top-0 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-violet-300/80 bg-violet-50/95 px-3 py-2 shadow-sm backdrop-blur pos-compact:px-2 pos-compact:py-1.5">
            <span className="text-xs font-semibold text-violet-900 pos-compact:text-[11px]">
              เลือกแล้ว <span className="tabular-nums">{bulkSelected.size.toLocaleString('th-TH')}</span> รายการ
            </span>
            {allowCost ? (
              <>
                <button
                  type="button"
                  onClick={() => bulkSetInStore([...bulkSelected], true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-medium text-emerald-800 shadow-sm hover:bg-emerald-50 pos-compact:text-[11px]"
                >
                  <Store className="size-3" />
                  เปิดใช้ในร้าน
                </button>
                <button
                  type="button"
                  onClick={() => bulkSetInStore([...bulkSelected], false)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 pos-compact:text-[11px]"
                >
                  ปิดใช้ในร้าน
                </button>
                <button
                  type="button"
                  onClick={() => setMoveCategoryPickerOpen(true)}
                  className="rounded-lg border border-sky-300 bg-white px-2.5 py-1 text-xs font-medium text-sky-800 shadow-sm hover:bg-sky-50 pos-compact:text-[11px]"
                >
                  ย้ายไปหมวด…
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`ย้าย ${bulkSelected.size} รายการไปถังขยะ?`)) {
                      bulkSoftDelete([...bulkSelected])
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-xs font-medium text-rose-700 shadow-sm hover:bg-rose-50 pos-compact:text-[11px]"
                >
                  <Trash2 className="size-3" />
                  ย้ายไปถังขยะ
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={clearBulk}
              className="ml-auto rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 pos-compact:text-[11px]"
            >
              ยกเลิก
            </button>
          </div>
        ) : null}

        {sortedList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-center text-sm text-slate-500 pos-compact:rounded-xl pos-compact:py-6 pos-compact:px-3 pos-compact:text-xs">
            {catalogFilterHidesAllInNav
              ? 'ในมุมมองนี้มีเฉพาะสินค้าอ้างอิง — ปิดสวิตช์ «เฉพาะในร้าน» ด้านบนเพื่อดูในแฟ้มข้อมูล หรือเปลี่ยนหมวด'
              : dimensionMatch.kind === 'no_dim_in_filter'
                ? 'ไม่มีสินค้าที่มีมิติในระบบในรายการนี้ — ลองเปลี่ยนหมวดหรือตัวกรอง'
                : 'ไม่พบสินค้าตามหมวดหมู่ คำค้นหา หรือตัวกรอง'}
          </div>
        ) : catalogViewMode === 'list' ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm pos-compact:rounded-xl">
                <table className="w-full min-w-[600px] table-fixed border-collapse text-left text-sm pos-narrow:min-w-[540px] xl:min-w-[680px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500 pos-compact:text-[10px]">
                      <th className="w-9 py-2.5 pl-3 pr-1 pos-compact:w-8 pos-compact:pl-2">
                        <input
                          type="checkbox"
                          checked={visibleList.length > 0 && visibleList.every((p) => bulkSelected.has(p.id))}
                          ref={(el) => {
                            if (!el) return
                            const all = visibleList.length > 0 && visibleList.every((p) => bulkSelected.has(p.id))
                            const some = visibleList.some((p) => bulkSelected.has(p.id))
                            el.indeterminate = some && !all
                          }}
                          onChange={() => {
                            setBulkSelected((prev) => {
                              const next = new Set(prev)
                              const allSelected =
                                visibleList.length > 0 && visibleList.every((p) => prev.has(p.id))
                              if (allSelected) {
                                visibleList.forEach((p) => next.delete(p.id))
                              } else {
                                visibleList.forEach((p) => next.add(p.id))
                              }
                              return next
                            })
                          }}
                          className="size-4 cursor-pointer rounded border-slate-300 accent-violet-600"
                          aria-label="เลือกทั้งหมดที่มองเห็น"
                        />
                      </th>
                      <th className="w-[5.5rem] py-2.5 pl-3 pr-1 pos-compact:w-[4.5rem] pos-compact:py-2 pos-compact:pl-2">
                        รูป
                      </th>
                      <MasterCatalogSortTh
                        sortKey="name"
                        sort={catalogSort}
                        label="ชื่อสินค้า"
                        onSort={handleCatalogHeaderSort}
                        className="min-w-0 py-2.5 pr-2 pos-compact:py-2"
                      />
                      <MasterCatalogSortTh
                        sortKey="sku"
                        sort={catalogSort}
                        label="SKU"
                        onSort={handleCatalogHeaderSort}
                        className="hidden w-[7.5rem] py-2.5 pos-compact:py-2 sm:table-cell"
                      />
                      <th className="hidden w-[4.5rem] py-2.5 pr-3 text-right whitespace-nowrap pos-compact:py-2 pos-compact:text-[10px] sm:table-cell">
                        สต็อก
                      </th>
                      <MasterCatalogSortTh
                        sortKey="sellPrice"
                        sort={catalogSort}
                        label="ราคาขาย"
                        onSort={handleCatalogHeaderSort}
                        alignRight
                        className="hidden w-[6.5rem] border-l border-slate-100/90 py-2.5 pl-4 pr-3 whitespace-nowrap pos-compact:py-2 pos-compact:pl-3 lg:table-cell"
                      />
                      <th className="w-9 py-2.5 pr-3 pos-compact:py-2 pos-compact:pr-2" aria-hidden />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleList.map((p) => (
                      <ProductMasterListRow
                        key={p.id}
                        product={p}
                        dimensionSearchActive={measActive}
                        onOpenProduct={openProductDetail}
                        onSelectProduct={handleSelectProduct}
                        selected={selectedProductId === p.id}
                        onContextMenuProduct={openProductContextMenu}
                        preferredFitment={findPreferredFitment(p)}
                        matchingFitments={findMatchingFitments(p)}
                        bulkSelected={bulkSelected.has(p.id)}
                        onToggleBulk={toggleBulkOne}
                      />
                    ))}
                    {visibleCount < sortedList.length ? (
                      <tr>
                        <td colSpan={7} className="py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            แสดงเพิ่ม ({sortedList.length - visibleCount} รายการที่เหลือ)
                          </button>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="min-w-0 space-y-2">
                <div
                  className={clsx(
                    'grid gap-3 pos-compact:gap-2',
                    'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 pos-compact:md:grid-cols-3 pos-compact:xl:grid-cols-4',
                  )}
                >
                  {visibleList.map((p) => (
                    <ProductMasterFlipCard
                      key={p.id}
                      product={p}
                      onOpenProduct={openProductDetail}
                      onSelectProduct={handleSelectProduct}
                      selected={selectedProductId === p.id}
                      onContextMenuProduct={openProductContextMenu}
                      preferredFitment={findPreferredFitment(p)}
                      matchingFitments={findMatchingFitments(p)}
                      bulkSelected={bulkSelected.has(p.id)}
                      onToggleBulk={toggleBulkOne}
                    />
                  ))}
                </div>
                {visibleCount < sortedList.length ? (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      แสดงเพิ่ม ({sortedList.length - visibleCount} รายการที่เหลือ)
                    </button>
                  </div>
                ) : null}
              </div>
        )}

        {ctx ? (
          <div
            className="fixed inset-0 z-50"
            role="presentation"
            onMouseDown={() => setCtx(null)}
          >
            <div
              ref={ctxMenuRef}
              className="fixed z-[140] min-w-[9.5rem] max-h-[min(72vh,20rem)] overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200/90 bg-white p-0.5 text-xs shadow-lg ring-1 ring-slate-950/8 pos-compact:max-h-[min(52vh,14rem)]"
              style={{
                left: ctxMenuPos?.left ?? ctx.x,
                top: ctxMenuPos?.top ?? ctx.y,
              }}
              role="menu"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {allowCost ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-slate-800 hover:bg-slate-100"
                  role="menuitem"
                  onClick={() => {
                    const p = products.find((x) => x.id === ctx.productId)
                    setCtx(null)
                    if (!p) return
                    setModalEditProduct(p)
                    setAddProductCopySource(null)
                    setCopySuggestedSku(undefined)
                    setProductModalOpen(true)
                  }}
                >
                  <Pencil className="size-3.5 shrink-0 text-slate-500" aria-hidden />
                  แก้ไขข้อมูล
                </button>
              ) : null}
              <button
                type="button"
                className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100"
                role="menuitem"
                onClick={() => {
                  const p = products.find((x) => x.id === ctx.productId)
                  setCtx(null)
                  if (!p) return
                  openCopyFromProduct(p)
                }}
              >
                คัดลอก
                <span className="ml-1.5 text-[10px] tabular-nums text-slate-400">F2</span>
              </button>
              <button
                type="button"
                className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100"
                role="menuitem"
                onClick={() => {
                  const p = products.find((x) => x.id === ctx.productId)
                  setCtx(null)
                  if (!p) return
                  enqueueProductLabelPrintFromMaster(p)
                }}
              >
                พิมพ์บาร์โค้ด
                <span className="ml-1.5 text-[10px] tabular-nums text-slate-400">F8</span>
              </button>
              <button
                type="button"
                className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100"
                role="menuitem"
                onClick={() => {
                  const id = ctx.productId
                  setCtx(null)
                  openProductDetail(id)
                }}
              >
                เปิดรายละเอียด
                <span className="ml-1.5 text-[10px] tabular-nums text-slate-400">Enter</span>
              </button>
              <div className="my-0.5 border-t border-slate-100" role="separator" />
              <button
                type="button"
                className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-red-700 hover:bg-red-50"
                role="menuitem"
                onClick={() => {
                  const id = ctx.productId
                  setCtx(null)
                  softDelete(id)
                }}
              >
                ย้ายไปถังขยะ
              </button>
            </div>
          </div>
        ) : null}
        </>
        )}

        {/* Bulk move-category picker */}
        {moveCategoryPickerOpen && (
          <BulkMoveCategoryPicker
            tree={categoryTree}
            count={bulkSelected.size}
            onClose={() => setMoveCategoryPickerOpen(false)}
            onApply={(main, sub, subSub) =>
              bulkMoveCategory([...bulkSelected], main, sub, subSub)
            }
          />
        )}

        {/* Hard-delete confirmation modal */}
        {hardDeleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-rose-100">
                <Trash2 className="size-5 text-rose-600" />
              </div>
              <p className="text-base font-semibold text-slate-900">ลบถาวร?</p>
              <p className="mt-1.5 text-sm text-slate-600">
                สินค้า <span className="font-semibold">"{hardDeleteTarget.name}"</span>{' '}
                <span className="font-mono text-xs text-slate-500">({hardDeleteTarget.sku})</span>{' '}
                จะถูกลบออกจากระบบทั้งหมดและไม่สามารถกู้คืนได้
              </p>
              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setHardDeleteTarget(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => permanentDelete(hardDeleteTarget.id)}
                  className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  ลบถาวร
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
