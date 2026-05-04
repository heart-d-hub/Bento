import Papa from 'papaparse'
import {
  deriveVehicleSummaryFromFitments,
  type CrossBranchStockRow,
  type PhysicalDimensions,
  type ProductMasterDetail,
  type ProductSalesStatus,
  type SalesUnit,
  type SellPriceTier,
  type VehicleFitmentRef,
} from '@/features/inventory/data/productMasterData'
import { defaultCrossBranchRowsForNewProduct } from '@/features/inventory/data/branchInventoryModel'
import type { VehicleCatalogState } from '@/features/vehicle/data/types'
import { findVariantInCatalog, formatVariantLabel } from '@/features/vehicle/data/vehicleCatalogUtils'

function splitPipe(s: string | undefined): string[] {
  if (!s || !s.trim()) return []
  return s
    .split('|')
    .map((x) => x.trim())
    .filter(Boolean)
}

/** แต่ละช่วง: `engineId` หรือ `engineId:front` / `engineId:rear` (ผ้าเบรก) */
function parseEngineIdSegment(segment: string): { id: string; brake?: 'front' | 'rear' } {
  const t = segment.trim()
  if (!t) return { id: '' }
  const m = t.match(/^(.+?):(front|rear)$/i)
  if (m) {
    return { id: m[1].trim(), brake: m[2].toLowerCase() as 'front' | 'rear' }
  }
  return { id: t }
}

function vehicleFitmentsFromEngineIdsColumn(
  catalog: VehicleCatalogState,
  raw: string,
  rowId: string,
): { refs: VehicleFitmentRef[]; missing: string[] } {
  const parts = raw.split('|').map((x) => x.trim())
  const missing: string[] = []
  const refs: VehicleFitmentRef[] = []
  let n = 0
  for (const part of parts) {
    if (!part) continue
    const { id, brake } = parseEngineIdSegment(part)
    if (!id) continue
    const loc = findVariantInCatalog(catalog, id)
    if (!loc) {
      missing.push(id)
      continue
    }
    refs.push({
      id: `vf-csv-${rowId}-${n++}`,
      categoryId: loc.categoryId,
      categoryLabel: loc.categoryLabel,
      brandId: loc.brandId,
      brandName: loc.brandName,
      modelId: loc.modelId,
      modelName: loc.modelName,
      engineId: loc.variant.id,
      engineLabel: formatVariantLabel(loc.engine, loc.variant),
      engineCode: loc.engine.engine_code ?? undefined,
      brakePosition: brake,
    })
  }
  return { refs, missing }
}

function engineIdsColumnFromFitments(rows: VehicleFitmentRef[] | undefined): string {
  if (!rows?.length) return ''
  return rows
    .map((f) => (f.brakePosition ? `${f.engineId}:${f.brakePosition}` : f.engineId))
    .join('|')
}

function num(v: string | undefined, fallback = 0): number {
  if (v === undefined || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw || !String(raw).trim()) return fallback
  try {
    return JSON.parse(String(raw)) as T
  } catch {
    return fallback
  }
}

function defaultCross(id: string): CrossBranchStockRow[] {
  return defaultCrossBranchRowsForNewProduct(id)
}

function parseInStoreCatalogCell(raw: string | undefined): boolean | undefined {
  const t = (raw ?? '').trim().toLowerCase()
  if (!t) return undefined
  if (t === '0' || t === 'false' || t === 'no' || t === 'n' || t === 'ref' || t === 'reference') return false
  if (t === '1' || t === 'true' || t === 'yes' || t === 'y' || t === 'store' || t === 'instore') return true
  return undefined
}

function parseSalesStatusCell(raw: string | undefined): ProductSalesStatus | undefined {
  const t = (raw ?? '').trim().toLowerCase()
  if (!t || t === 'active') return undefined
  if (t === 'paused' || t === 'discontinued') return t
  return undefined
}

function parseSellTierPercentBasisCell(raw: string | undefined): 'list_discount' | undefined {
  const t = (raw ?? '').trim().toLowerCase()
  if (t === 'list_discount' || t === 'list' || t === 'จากราคาตั้ง') return 'list_discount'
  return undefined
}

function parseVatModeCell(raw: string | undefined): 'vat' | 'no_vat' | undefined {
  const t = (raw ?? '').trim().toLowerCase()
  if (!t) return undefined
  if (t === 'no_vat' || t === 'novat' || t === 'no-vat' || t === 'ไม่มีvat' || t === 'ไม่มี') return 'no_vat'
  if (t === 'vat' || t === 'มีvat' || t === 'มี') return 'vat'
  return undefined
}

/** ค่าว่าง / ขีดกลาง (ข้อมูลเก่า) → 1+0 ให้สอดคล้องกับฟอร์มแฟ้มมาสเตอร์ที่ต้องการ X+Y */
function normalizeSchemeForImport(raw: string | undefined): string {
  const t = (raw ?? '').trim()
  if (!t || t === '—') return '1+0'
  const m = t.match(/^(\d+)\s*\+\s*(\d+)$/)
  if (!m) return t
  const buy = Number(m[1])
  const free = Number(m[2])
  if (!Number.isFinite(buy) || buy <= 0 || !Number.isFinite(free) || free < 0) return t
  return `${buy}+${free}`
}

/** แถว CSV ↔ Google Sheets — หัวคอลัมภาษาอังกฤษเพื่อความเสถียร */
export type ProductMasterCsvRow = Record<string, string>

export function productToCsvRow(p: ProductMasterDetail): ProductMasterCsvRow {
  return {
    id: p.id,
    sku: p.sku,
    boxBarcode: p.boxBarcode ?? '',
    name: p.name,
    brand: p.brand,
    category: p.category,
    subCategory: p.subCategory ?? '',
    subSubCategory: p.subSubCategory ?? '',
    carBrand: p.carBrand,
    carModelLabel: p.carModelLabel,
    yearLabel: p.yearLabel,
    oemTags: p.oemTags.join('|'),
    crossReferenceTags: (p.crossReferenceTags ?? []).join('|'),
    factoryNo: p.factoryNo ?? '',
    carModels: p.carModels.join('|'),
    engineIds: engineIdsColumnFromFitments(p.vehicleFitments),
    vehicleFitmentsJson: p.vehicleFitments?.length ? JSON.stringify(p.vehicleFitments) : '',
    costPrice: String(p.costPrice),
    avgCost: String(p.avgCost),
    sellPrice: String(p.sellPrice),
    vatMode: p.vatMode === 'no_vat' ? 'no_vat' : 'vat',
    scheme: p.scheme,
    notes: p.notes ?? '',
    posDisplayNote: p.posDisplayNote ?? '',
    inStoreCatalog: p.inStoreCatalog === false ? '0' : '1',
    salesStatus: p.salesStatus ?? 'active',
    storageLocation: p.storageLocation ?? '',
    storageLocationsJson: JSON.stringify(p.storageLocations ?? []),
    packaging: p.packaging ?? '',
    isGenuine: p.isGenuine ? '1' : '0',
    unitSmall: p.unitSmall ?? '',
    unitLarge: p.unitLarge ?? '',
    salesUnitsJson: JSON.stringify(p.salesUnits ?? []),
    crossBranchJson: JSON.stringify(p.crossBranch ?? []),
    physicalDimensionsJson: p.physicalDimensions ? JSON.stringify(p.physicalDimensions) : '',
    sellPriceTiersJson: JSON.stringify(p.sellPriceTiers ?? []),
    sellTierPercentBasis: p.sellTierPercentBasis === 'list_discount' ? 'list_discount' : '',
    purchaseDiscountPctsJson: JSON.stringify(p.purchaseDiscountPcts ?? [0, 0, 0, 0]),
    supplierListPrice: p.supplierListPrice != null ? String(p.supplierListPrice) : '',
    costEnteredManually: p.costEnteredManually ? '1' : '0',
    stockMode: p.stockMode ?? '',
    nominalKgPerRoll: p.nominalKgPerRoll != null ? String(p.nominalKgPerRoll) : '',
    nominalMetersPerRoll: p.nominalMetersPerRoll != null ? String(p.nominalMetersPerRoll) : '',
    piecesPerBox: p.piecesPerBox != null ? String(p.piecesPerBox) : '',
    splitSale: p.splitSale ? '1' : '0',
    productTagIdsJson: JSON.stringify(p.productTagIds ?? []),
    stlBoltPairNutSku: p.stlBoltPairNutSku ?? '',
    stlBoltPairWasherSku: p.stlBoltPairWasherSku ?? '',
    stlBoltPairMaleSkusJson: JSON.stringify(p.stlBoltPairMaleSkus ?? []),
  }
}

export function csvRowToProduct(
  row: ProductMasterCsvRow,
  rowIndex: number,
  catalog: VehicleCatalogState,
): { product: ProductMasterDetail | null; warnings: string[] } {
  const warnings: string[] = []
  const sku = (row.sku ?? '').trim()
  const name = (row.name ?? '').trim()
  if (!sku && !name) return { product: null, warnings }
  const idRaw = (row.id ?? '').trim()
  const id =
    idRaw ||
    `pm-import-${Date.now()}-${rowIndex}-${Math.random().toString(36).slice(2, 7)}`

  const salesUnits = parseJson<SalesUnit[]>(row.salesUnitsJson, [])
  const crossBranch = parseJson<CrossBranchStockRow[]>(row.crossBranchJson, [])
  const physicalDimensions = parseJson<PhysicalDimensions | null>(row.physicalDimensionsJson, null)
  const sellPriceTiers = parseJson<SellPriceTier[]>(row.sellPriceTiersJson, [])
  const purchaseDiscountPcts = parseJson<[number, number, number, number]>(
    row.purchaseDiscountPctsJson,
    [0, 0, 0, 0],
  )

  const oemTags = splitPipe(row.oemTags)
  const crossReferenceTags = splitPipe(row.crossReferenceTags)
  let vehicleFitments = parseJson<VehicleFitmentRef[]>(row.vehicleFitmentsJson, [])
  const engineIdsRaw = (row.engineIds ?? '').trim()
  if (vehicleFitments.length === 0 && engineIdsRaw) {
    const { refs, missing } = vehicleFitmentsFromEngineIdsColumn(catalog, engineIdsRaw, id)
    vehicleFitments = refs
    for (const mid of missing) {
      warnings.push(`แถว ${rowIndex}: ไม่พบรหัส variant ในแคตตาล็อกรถ — ${mid}`)
    }
  }

  const vehicleSummary =
    vehicleFitments.length > 0 ? deriveVehicleSummaryFromFitments(vehicleFitments) : null

  const product: ProductMasterDetail = {
    id,
    sku: sku || `NO-SKU-${rowIndex}`,
    boxBarcode: (row.boxBarcode ?? '').trim() || undefined,
    name: name || sku || 'ไม่มีชื่อ',
    brand: (row.brand ?? '').trim() || '—',
    category: (row.category ?? '').trim() || '—',
    subCategory: (row.subCategory ?? '').trim() || undefined,
    subSubCategory: (row.subSubCategory ?? '').trim() || undefined,
    carBrand: (vehicleSummary?.carBrand ?? (row.carBrand ?? '').trim()) || '—',
    carModelLabel: (vehicleSummary?.carModelLabel ?? (row.carModelLabel ?? '').trim()) || '—',
    yearLabel: (vehicleSummary?.yearLabel ?? (row.yearLabel ?? '').trim()) || '—',
    oemTags,
    crossReferenceTags: crossReferenceTags.length ? crossReferenceTags : undefined,
    factoryNo: (row.factoryNo ?? '').trim() || undefined,
    carModels: vehicleSummary?.carModels ?? splitPipe(row.carModels),
    vehicleFitments: vehicleFitments.length > 0 ? vehicleFitments : undefined,
    costPrice: num(row.costPrice, 0),
    avgCost: num(row.avgCost, 0),
    sellPrice: num(row.sellPrice, 0),
    vatMode: parseVatModeCell(row.vatMode) === 'no_vat' ? 'no_vat' : undefined,
    scheme: normalizeSchemeForImport(row.scheme),
    notes: (row.notes ?? '').trim() || undefined,
    posDisplayNote: (row.posDisplayNote ?? '').trim() || undefined,
    inStoreCatalog: (() => {
      const v = parseInStoreCatalogCell(row.inStoreCatalog)
      return v === false ? false : undefined
    })(),
    salesStatus: parseSalesStatusCell(row.salesStatus),
    storageLocation: (row.storageLocation ?? '').trim() || undefined,
    storageLocations: (() => {
      const raw = (row.storageLocationsJson ?? '').trim()
      if (!raw) return undefined
      try {
        const arr = JSON.parse(raw) as unknown
        if (!Array.isArray(arr)) return undefined
        const cleaned = arr.filter((s): s is string => typeof s === 'string').map((s) => s.trim()).filter(Boolean)
        return cleaned.length > 0 ? cleaned : undefined
      } catch {
        return undefined
      }
    })(),
    packaging: (row.packaging ?? '').trim() || undefined,
    isGenuine: row.isGenuine === '1' || row.isGenuine === 'true',
    unitSmall: (row.unitSmall ?? '').trim() || undefined,
    unitLarge: (row.unitLarge ?? '').trim() || undefined,
    salesUnits: salesUnits.length > 0 ? salesUnits : undefined,
    crossBranch: crossBranch.length > 0 ? crossBranch : defaultCross(id),
    physicalDimensions: physicalDimensions ?? undefined,
    sellPriceTiers: sellPriceTiers.length > 0 ? sellPriceTiers : undefined,
    purchaseDiscountPcts:
      purchaseDiscountPcts.some((x) => x !== 0) ? purchaseDiscountPcts : undefined,
    supplierListPrice: row.supplierListPrice ? num(row.supplierListPrice) : undefined,
    costEnteredManually: row.costEnteredManually === '1' || row.costEnteredManually === 'true',
    stockMode:
      row.stockMode === 'piece' ||
      row.stockMode === 'kg_roll' ||
      row.stockMode === 'meter_roll' ||
      row.stockMode === 'box_piece'
        ? row.stockMode
        : undefined,
    nominalKgPerRoll: row.nominalKgPerRoll ? num(row.nominalKgPerRoll) : undefined,
    nominalMetersPerRoll: row.nominalMetersPerRoll ? num(row.nominalMetersPerRoll) : undefined,
    piecesPerBox: row.piecesPerBox ? Math.max(1, Math.floor(num(row.piecesPerBox, 0))) : undefined,
    splitSale: row.splitSale === '1' || row.splitSale === 'true',
    sellTierPercentBasis: parseSellTierPercentBasisCell(row.sellTierPercentBasis),
    ...(() => {
      const tagIds = parseJson<string[]>(row.productTagIdsJson, []).filter(
        (x): x is string => typeof x === 'string' && x.trim().length > 0,
      )
      return tagIds.length > 0 ? { productTagIds: tagIds } : {}
    })(),
    ...(() => {
      const nutSku = (row.stlBoltPairNutSku ?? '').trim()
      const washerSku = (row.stlBoltPairWasherSku ?? '').trim()
      const maleSkus = parseJson<string[]>(row.stlBoltPairMaleSkusJson, []).filter(
        (x): x is string => typeof x === 'string' && x.trim().length > 0,
      )
      return {
        ...(nutSku ? { stlBoltPairNutSku: nutSku } : {}),
        ...(washerSku ? { stlBoltPairWasherSku: washerSku } : {}),
        ...(maleSkus.length > 0 ? { stlBoltPairMaleSkus: maleSkus } : {}),
      }
    })(),
  }

  return { product, warnings }
}

export function exportProductsToCsvString(products: ProductMasterDetail[]): string {
  const rows = products.map(productToCsvRow)
  return Papa.unparse(rows, {
    header: true,
    quotes: true,
  })
}

/** แถวตัวอย่าง — รุ่นรถตัวอย่างใช้รหัสจากชุดข้อมูลเริ่มต้น (ลบแถวนี้ใน Sheets ได้) */
const CSV_TEMPLATE_FITMENTS: VehicleFitmentRef[] = [
  {
    id: 'vf-example',
    categoryId: 'car',
    categoryLabel: 'รถยนต์',
    brandId: 'b-honda',
    brandName: 'HONDA',
    modelId: 'm-civic',
    modelName: 'CIVIC',
    engineId: 'e-h-civ-1',
    engineLabel: '1.5 Turbo (2016-2025)',
    engineText: '1.5 Turbo',
    engineCode: 'L15B7',
    yearFrom: 2016,
    yearTo: 2025,
    yearRangeText: '2016-2025',
  },
]
const CSV_TEMPLATE_VEHICLE_SUMMARY = deriveVehicleSummaryFromFitments(CSV_TEMPLATE_FITMENTS)

const CSV_TEMPLATE_EXAMPLE_ROW: ProductMasterDetail = {
  id: 'example-you-can-delete-this-row',
  sku: 'SKU001',
  name: 'ตัวอย่างชื่อสินค้า',
  brand: 'แบรนด์',
  category: 'หมวดหลัก',
  subCategory: 'หมวดย่อย 1',
  subSubCategory: 'หมวดย่อย 2',
  carBrand: CSV_TEMPLATE_VEHICLE_SUMMARY.carBrand,
  carModelLabel: CSV_TEMPLATE_VEHICLE_SUMMARY.carModelLabel,
  yearLabel: CSV_TEMPLATE_VEHICLE_SUMMARY.yearLabel,
  oemTags: [],
  carModels: CSV_TEMPLATE_VEHICLE_SUMMARY.carModels,
  vehicleFitments: CSV_TEMPLATE_FITMENTS,
  costPrice: 0,
  avgCost: 0,
  sellPrice: 0,
  scheme: '1+0',
  crossBranch: defaultCross('tpl-example'),
}

/** เทมเพลต CSV = หัวคอลัมน์ + แถวตัวอย่าง 1 แถว (ลบแถวนั้นใน Sheets ได้ถ้าไม่ต้องการ) */
export function exportProductMasterCsvTemplateString(): string {
  return exportProductsToCsvString([CSV_TEMPLATE_EXAMPLE_ROW])
}

/** สรุปคำเตือนหลังนำเข้า — แยกแถวที่อ้าง engineId ไม่พบในแคตตาล็อก */
export function summarizeProductMasterImportWarnings(warnings: string[]): {
  totalWarnings: number
  engineIdRowWarnings: number
  /** รหัส variant ที่อ้างแล้วไม่พบ (ไม่ซ้ำ) สูงสุด 20 รายการ */
  sampleMissingEngineIds: string[]
} {
  const engineWarnRe = /ไม่พบรหัส variant ในแคตตาล็อกรถ\s*[—–-]\s*(.+)$/i
  const engineLines = warnings.filter((w) => w.includes('ไม่พบรหัส variant'))
  const missing = new Set<string>()
  for (const line of engineLines) {
    const m = line.match(engineWarnRe)
    if (m?.[1]) missing.add(m[1].trim())
    else {
      const tail = line.split(/[—–-]/).pop()?.trim()
      if (tail) missing.add(tail)
    }
  }
  return {
    totalWarnings: warnings.length,
    engineIdRowWarnings: engineLines.length,
    sampleMissingEngineIds: [...missing].slice(0, 20),
  }
}

export function importProductsFromCsvString(
  text: string,
  catalog: VehicleCatalogState,
): { ok: true; products: ProductMasterDetail[]; warnings: string[] } | { ok: false; error: string } {
  const trimmed = text.trim()
  if (!trimmed) return { ok: false, error: 'ไฟล์ว่าง' }

  const parsed = Papa.parse<ProductMasterCsvRow>(trimmed, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  })

  if (parsed.errors.length > 0) {
    const msg = parsed.errors[0]?.message ?? 'อ่าน CSV ไม่สำเร็จ'
    return { ok: false, error: msg }
  }

  const data = parsed.data ?? []
  const out: ProductMasterDetail[] = []
  const warnings: string[] = []
  data.forEach((row, i) => {
    const { product, warnings: rowWarnings } = csvRowToProduct(row, i + 1, catalog)
    warnings.push(...rowWarnings)
    if (product) out.push(product)
  })

  if (out.length === 0) return { ok: false, error: 'ไม่พบแถวข้อมูลสินค้า (ต้องมีหัวคอลัมน์และอย่างน้อย sku หรือ name)' }

  return { ok: true, products: out, warnings }
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([`\uFEFF${content}`], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
