/** รายละเอียดแฟ้มข้อมูลสินค้า + สต็อกข้ามคลัง (mock) */

import type { BranchId } from '@/features/auth/branches'
import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'

export type CrossBranchStockRow = {
  id: string
  /** ชื่อคลัง / สาขา */
  locationLabel: string
  /** อ้างอิงสาขา — ใช้ซิงค์กับเซิร์ฟเวอร์ / โอนสต็อก */
  branchId?: BranchId
  /** สาขาจริง vs คลังกลางในโปรแกรม vs อนาคตโกดัง */
  siteKind?: 'branch' | 'central_hub'
  stock: number
  /** ชั้น / ตำแหน่งเก็บ */
  position: string
  status: 'normal' | 'low'
  /** แสดงปุ่มขอโอน (เช่น สาขาที่สต็อกต่ำ) */
  showTransfer?: boolean
}

/**
 * มิติอ้างอิง (มม.) — ใช้ค้นหาเมื่อลูกค้านำของมาวัด ไม่เห็นเบอร์ OEM
 * แสดงใน UI เป็นมิติ A / B / C (ใช้ได้ทั้งไส้กรอง ลูกหมาก ชิ้นส่วนอื่น):
 * - **A (ใน / กว้าง)** → innerDiameterMm (หรือรูที่เล็กกว่าเมื่อมีสองรูไม่เท่ากัน)
 * - **A₂** → innerDiameterSecondaryMm (รูที่ใหญ่กว่า — เฉพาะกรณีสองรู)
 * - **B (นอก / ยาว)** → outerDiameterMm
 * - **C (หนา / สูง)** → heightMm
 *
 * B/C อาจมีเพียงข้างใดข้างหนึ่ง (เช่น หัวน็อตเก็บแค่เกลียว = B อย่างเดียว) เมื่อหมวดตั้งมิติ 2 ชื่อ
 */
export type PhysicalDimensions = {
  /** มิติ C — หนา / สูง (เช่น ความหนาแผ่นกรอง หรือความสูงชิ้นงานตามแกนหลัก) */
  heightMm?: number
  /** มิติ B — นอก / ยาว / เกลียว (เช่น Ø นอก หรือความยาวรวม) */
  outerDiameterMm?: number
  /** มิติ A — ใน / กว้าง (เช่น Ø รูด้านใน หรือความกว้างจุดวัด) — ถ้ามีสองรู แนะนำลงค่า Ø รูที่เล็กกว่า */
  innerDiameterMm?: number
  /** มิติ A รูที่สอง — เมื่อกรอง/ดักน้ำมีสองรูไม่เท่ากัน (เช่น ท่อเข้า-ออก) ลง Ø รูที่ใหญ่กว่า */
  innerDiameterSecondaryMm?: number
}

/** 1 หุน = 3.175 mm — ใช้ร่วมกับฟอร์มลงสินค้าและค้นหามิติ (แปลงหุน→มม.ตอนบันทึก) */
export const MM_PER_HUN = 3.175

export function mmToHun(mm: number): number {
  return mm / MM_PER_HUN
}

/** แสดงมม. พร้อมเทียบหุนโดยประมาณ (สำหรับแคตตาล็อก/เทียบมือ) */
export function formatMmWithHunApprox(mm: number, hunDecimals = 1): string {
  return `${mm} mm (~${mmToHun(mm).toFixed(hunDecimals)} หุน)`
}

/** หน่วยขายหนึ่งรายการ — หน่วยแรกมักเป็นหน่วยฐาน (baseUnits = 1) */
export type SalesUnit = {
  id: string
  /** ชื่อที่แสดง เช่น ชิ้น, ครึ่งโหล, ลัง */
  label: string
  /** 1 หน่วยนี้เทียบเท่ากี่หน่วยฐาน (หน่วยแรกต้องเป็น 1) */
  baseUnits: number
  /** บาร์โค้ดประจำหน่วยนี้ (ถ้ามี) */
  barcode?: string
}

/**
 * รุ่นรถอ้างอิงแคตตาล็อก — key เดียวกับ «ค้นหารุ่นรถ» / VehicleFitPicker / จัดการรุ่นรถ
 * engineId = รหัส variant (ช่วงปี) ในแคตตาล็อก ไม่ใช่แค่ชื่อเครื่อง
 * ใช้ผูก SKU เพื่อค้นหาจากเครื่อง/ปี + กรองเบรกหน้า-หลัง
 */
export type VehicleFitmentRef = {
  id: string
  categoryId: string
  categoryLabel: string
  brandId: string
  brandName: string
  modelId: string
  modelName: string
  engineId: string
  engineLabel: string
  /** เครื่องที่กรอกตรงตอนเพิ่มสินค้า (เช่น 2.0, 1KD, 4JA1) */
  engineText?: string
  /** ช่วงปีที่กรอกตรงตอนเพิ่มสินค้า (เช่น 1990-2018) */
  yearRangeText?: string
  /** ปีเริ่ม/สิ้นสุดสำหรับกรองแบบตัวเลขจริงที่ POS */
  yearFrom?: number
  yearTo?: number
  /** ระบบขับเคลื่อน เช่น 2WD, 4WD, AWD */
  driveType?: string
  engineCode?: string
  /** เฉพาะผ้าเบรก/ดิสก์ — ไม่ระบุ = ชิ้นทั่วไปที่ไม่แยกหน้า-หลัง */
  brakePosition?: 'front' | 'rear'
}

/** สถานะการขาย — POS แสดงเฉพาะ active + อยู่ในพอร์ตร้าน */
export type ProductSalesStatus = 'active' | 'paused' | 'discontinued'

/**
 * true = อยู่ในพอร์ตสินค้าของร้าน (มีในร้าน / ใช้ข้อมูลนี้)
 * false = เก็บเป็นอ้างอิงเทียบเท่า — ไม่แสดงใน POS / ค้นหาหน้าร้าน
 */
export function productEligibleForPosSale(p: ProductMasterDetail): boolean {
  if (p.inStoreCatalog === false) return false
  const s = p.salesStatus ?? 'active'
  return s === 'active'
}

/** สรุปยี่ห้อรถ / รุ่น / ปี-เครื่อง + บรรทัด carModels[] ให้สอดคล้องกับแฟ้มมาสเตอร์เดิม */
export function deriveVehicleSummaryFromFitments(rows: VehicleFitmentRef[]): {
  carBrand: string
  carModelLabel: string
  yearLabel: string
  carModels: string[]
} {
  if (rows.length === 0) {
    return { carBrand: '—', carModelLabel: '—', yearLabel: '—', carModels: [] }
  }
  const carBrand = rows[0]?.brandName.trim() || '—'
  const carModelLabel =
    [...new Set(rows.map((r) => r.modelName.trim()).filter(Boolean))].join(' / ') || '—'
  const yearLabel =
    rows.length === 1
      ? rows[0].engineLabel.trim() || '—'
      : rows
          .map((r) => r.engineLabel.trim())
          .filter(Boolean)
          .join(' · ')
  const carModels = rows.map((r) => {
    const pos =
      r.brakePosition === 'front' ? ' (เบรกหน้า)' : r.brakePosition === 'rear' ? ' (เบรกหลัง)' : ''
    return `${r.categoryLabel} ${r.brandName} ${r.modelName} — ${r.engineLabel}${pos}`
  })
  return { carBrand, carModelLabel, yearLabel, carModels }
}

export function totalCrossBranchStock(p: ProductMasterDetail): number {
  return (p.crossBranch ?? []).reduce((s, r) => s + (r.stock ?? 0), 0)
}

export function fitmentMatchesEngineAndBrake(
  f: VehicleFitmentRef,
  engineId: string,
  brakeFilter: '' | 'front' | 'rear',
): boolean {
  if (f.engineId !== engineId) return false
  if (!brakeFilter) return true
  if (f.brakePosition === undefined) return true
  return f.brakePosition === brakeFilter
}

/** สินค้าในแฟ้มมาสเตอร์ที่ผูกกับเครื่อง/ปีนี้ (และตัวกรองเบรกถ้ามี) */
export function masterProductsForEngine(
  engineId: string,
  brakeFilter: '' | 'front' | 'rear',
  products?: ProductMasterDetail[],
): ProductMasterDetail[] {
  const list = products ?? getProductMasterList()
  return list.filter((p) => {
    const fits = p.vehicleFitments?.filter((f) => fitmentMatchesEngineAndBrake(f, engineId, brakeFilter)) ?? []
    return fits.length > 0
  })
}

/** ดึงช่วงปีสำหรับใช้เป็น key ในตัวกรอง เช่น "2009-2015", "2016+", "ถึง 2010" */
export function fitmentYearRangeKey(f: VehicleFitmentRef): string {
  if (f.yearFrom != null && f.yearTo != null) return `${f.yearFrom}-${f.yearTo}`
  if (f.yearFrom != null) return `${f.yearFrom}+`
  if (f.yearTo != null) return `ถึง ${f.yearTo}`
  const t = f.yearRangeText?.trim()
  if (t) return t
  const m = (f.engineLabel ?? '').match(/(\d{4}\s*[-–]\s*\d{4})/)
  return m?.[1] ?? ''
}

/** ใช้กับแฟ้มข้อมูลสินค้า — กรองยี่ห้อ/รุ่น/เครื่อง-ปี จาก vehicleFitments หรือฟิลด์สรุปเดิม */
export function productMatchesInventoryCarFilters(
  p: ProductMasterDetail,
  opts: { brand: string; carBrand: string; carModel: string; year: string; engineLabel?: string; driveType?: string },
  filterAll: string,
): boolean {
  const { brand, carBrand, carModel, year, engineLabel, driveType } = opts
  if (brand !== filterAll && p.brand !== brand) return false
  if (
    carBrand === filterAll &&
    carModel === filterAll &&
    year === filterAll &&
    (!engineLabel || engineLabel === filterAll) &&
    (!driveType || driveType === filterAll)
  ) return true

  const matchLegacy = (): boolean => {
    if (carBrand !== filterAll && p.carBrand !== carBrand) return false
    if (carModel !== filterAll && p.carModelLabel !== carModel) return false
    if (year !== filterAll && p.yearLabel !== year) return false
    return true
  }

  const fits = p.vehicleFitments
  if (!fits?.length) return matchLegacy()

  const anyFit = fits.some((f) => {
    if (!f) return false
    if (carBrand !== filterAll && f.brandName !== carBrand) return false
    if (carModel !== filterAll && f.modelName !== carModel) return false
    if (year !== filterAll && fitmentYearRangeKey(f) !== year) return false
    if (engineLabel && engineLabel !== filterAll && (f.engineLabel ?? '').trim() !== engineLabel) return false
    if (driveType && driveType !== filterAll && (f.driveType ?? '').toUpperCase() !== driveType.toUpperCase()) return false
    return true
  })
  return anyFit || matchLegacy()
}

export function collectInventoryCarFilterOptions(
  products: ProductMasterDetail[],
  filters?: { carBrand?: string; carModel?: string; engineLabel?: string; driveType?: string; filterAll?: string },
): {
  carBrands: string[]
  models: string[]
  engines: string[]
  driveTypes: string[]
  years: string[]
} {
  const fa = filters?.filterAll ?? 'ทั้งหมด'
  const activeBrand = filters?.carBrand && filters.carBrand !== fa ? filters.carBrand : null
  const activeModel = filters?.carModel && filters.carModel !== fa ? filters.carModel : null
  const activeEngine = filters?.engineLabel && filters.engineLabel !== fa ? filters.engineLabel : null
  const activeDrive = filters?.driveType && filters.driveType !== fa ? filters.driveType : null

  const carBrands = new Set<string>()
  const models = new Set<string>()
  const engines = new Set<string>()
  const driveTypes = new Set<string>()
  const years = new Set<string>()
  for (const p of products) {
    if (p.carBrand && p.carBrand !== '—') carBrands.add(p.carBrand)
    for (const f of p.vehicleFitments ?? []) {
      if (!f) continue
      if (f.brandName) carBrands.add(f.brandName)
      // cascade: models from brand
      if (!activeBrand || f.brandName === activeBrand) {
        if (f.modelName) models.add(f.modelName)
      }
      // cascade: engines from brand+model
      if ((!activeBrand || f.brandName === activeBrand) && (!activeModel || f.modelName === activeModel)) {
        if (f.engineLabel?.trim()) engines.add(f.engineLabel.trim())
      }
      // cascade: driveTypes from brand+model+engine
      if (
        (!activeBrand || f.brandName === activeBrand) &&
        (!activeModel || f.modelName === activeModel) &&
        (!activeEngine || (f.engineLabel ?? '').trim() === activeEngine)
      ) {
        if (f.driveType?.trim()) driveTypes.add(f.driveType.trim().toUpperCase())
      }
      // cascade: years from brand+model+engine+drive
      if (
        (!activeBrand || f.brandName === activeBrand) &&
        (!activeModel || f.modelName === activeModel) &&
        (!activeEngine || (f.engineLabel ?? '').trim() === activeEngine) &&
        (!activeDrive || (f.driveType ?? '').toUpperCase() === activeDrive.toUpperCase())
      ) {
        const yr = fitmentYearRangeKey(f)
        if (yr) years.add(yr)
      }
    }
    // legacy fields for models/years without fitments
    if (!p.vehicleFitments?.length) {
      if (p.carModelLabel && p.carModelLabel !== '—') models.add(p.carModelLabel)
      if (p.yearLabel && p.yearLabel !== '—') years.add(p.yearLabel)
    }
  }
  return {
    carBrands: [...carBrands].sort((a, b) => a.localeCompare(b, 'th')),
    models: [...models].sort((a, b) => a.localeCompare(b, 'th')),
    engines: [...engines].sort((a, b) => a.localeCompare(b, 'th')),
    driveTypes: [...driveTypes].sort(),
    years: [...years].sort((a, b) => a.localeCompare(b, 'th')),
  }
}

/** ฐานของตัวเลข % ในแถวระดับราคาขาย (ร่วมกับ sellPriceTiers) */
export type SellTierPercentBasis = 'cost_markup' | 'list_discount'

/** บาร์โค้ดหนึ่งรายการ — รหัส + จำนวนต่อการสแกน 1 ครั้ง */
export type BarcodeEntry = {
  code: string
  /** จำนวนชิ้นต่อการสแกน 1 ครั้ง: 1 = ชิ้น, 6 = ลัง 6 ชิ้น ฯลฯ */
  qtyPerScan: number
  /** ชื่อแสดงผล เช่น "ชิ้น" "กล่อง" "ลัง" */
  label?: string
  /** ขนาดกล่อง — เมื่อสแกนบาร์โค้ดนี้ตอนรับของ ระบบเพิ่มจำนวนกล่องให้อัตโนมัติ */
  boxSize?: 'small' | 'normal' | 'large'
}

/** กฎสินค้าแถมตอนรับของ — เมื่อรับสินค้านี้ N ชิ้น แถมสินค้าอื่น M ชิ้นอัตโนมัติ */
export type ReceiveBonusRule = {
  id: string
  bonusSku: string
  /** จำนวนแถมต่อ 1 ชิ้นที่รับ (เศษปัดทิ้ง) */
  bonusQtyPerUnit: number
  notes?: string
}

/** ส่วนประกอบ 1 รายการในสินค้าชุด (Bundle/Kit) */
export type BundleComponent = {
  sku: string
  qty: number
}

export type ProductMasterDetail = {
  id: string
  /** รหัสสินค้า — ใช้พิมพ์บาร์โค้ด */
  sku: string
  /** บาร์โค้ดทั้งหมดของสินค้านี้ — รองรับหลายบาร์โค้ด (ชิ้น / กล่อง / ลัง) */
  barcodes?: BarcodeEntry[]
  name: string
  /** บริษัท / แบรนด์ชิ้นงาน — ใช้ในตัวกรอง «แบรนด์» */
  brand: string
  /** ชื่อหมวดหมู่หลัก — ให้ตรงกับชื่อใน «จัดการหมวดหมู่» */
  category: string
  /** ชื่อหมวดหมู่ย่อย (ถ้ามี) — ให้ตรงกับหมวดย่อยภายใต้หมวดหลักเดียวกัน */
  subCategory?: string
  /** หมวดย่อยระดับที่ 2 (ใต้ subCategory) — ใช้เมื่อจัดหมวดแบบ ใหญ่ → ย่อย1 → ย่อย2 */
  subSubCategory?: string
  /** แท็กสินค้า (id จากจัดการแท็ก) — โปร STL / มิติเบอร์ ฯลฯ */
  productTagIds?: string[]
  /** ยี่ห้อรถ — ใช้ในตัวกรอง */
  carBrand: string
  /** รุ่นรถ (สั้น) — ใช้ในตัวกรอง */
  carModelLabel: string
  /** รุ่นปี / ช่วงปี — ใช้ในตัวกรอง */
  yearLabel: string
  /** เบอร์แท้ OEM — ได้หลายเบอร์ */
  oemTags: string[]
  /** เบอร์โรงงาน — มี 1 ค่า */
  factoryNo?: string
  /** เบอร์เทียบ / Cross reference — ได้หลายเบอร์ */
  crossReferenceTags?: string[]
  /** บรรทัดสรุปสำหรับแสดง / POS — สร้างอัตโนมัติจาก vehicleFitments เมื่อบันทึก */
  carModels: string[]
  /** รุ่นรถแบบผูกรหัสแคตตาล็อก — ใช้คู่กับหน้าค้นหารุ่นรถ */
  vehicleFitments?: VehicleFitmentRef[]
  costPrice: number
  scheme: string
  avgCost: number
  /** ต้นทุนล่าสุด — ราคาต่อหน่วยของ PO receive ล่าสุด */
  lastCost?: number
  sellPrice: number
  /** สถานะ VAT ของสินค้า (ไม่ระบุ = มี VAT ตามค่าเริ่มต้น) */
  vatMode?: 'vat' | 'no_vat'
  /** แท้ (OEM แท้) */
  isGenuine?: boolean
  /** หน่วยขายหลายแบบ (แทนรูปแบบหน่วยย่อย/ใหญ่เดิม) */
  salesUnits?: SalesUnit[]
  /** @deprecated ใช้ salesUnits — คงไว้อ่านข้อมูลเก่า */
  unitSmall?: string
  /** @deprecated ใช้ salesUnits */
  unitLarge?: string
  /** บรรจุ */
  packaging?: string
  /** ที่เก็บ */
  storageLocation?: string
  /** หมายเหตุ */
  notes?: string
  /** หมายเหตุแสดงบน POS — โชว์หลังชื่อสินค้า (เช่น โปรโมชัน) */
  posDisplayNote?: string
  /** false = ของอ้างอิงในระบบเท่านั้น — ไม่ขายที่ POS / ค้นหาหน้าร้าน */
  inStoreCatalog?: boolean
  /** ไม่ระบุ = ขายอยู่ — POS แสดงเฉพาะ active + inStoreCatalog ไม่เป็น false */
  salesStatus?: ProductSalesStatus
  /** ราคาตั้งจากซัพพลายเออร์ (ก่อนส่วนลดซื้อ) */
  supplierListPrice?: number
  /** ส่วนลดตอนซื้อ 4 ช่อง (%) — คูณต่อเนื่องจากราคาตั้ง */
  purchaseDiscountPcts?: [number, number, number, number]
  /** true = ใช้ค่า costPrice ที่กรอกเอง ไม่คำนวณจากราคาตั้ง */
  costEnteredManually?: boolean
  /** โปรซื้อครั้งล่าสุด — ส่วนลด chain เช่น "45+10" */
  poLastDiscountChain?: string
  /** โปรซื้อครั้งล่าสุด — จำนวนซื้อในรอบแถม เช่น 2 (ซื้อ 2 แถม 1) */
  poLastBonusPaid?: number
  /** โปรซื้อครั้งล่าสุด — จำนวนแถม */
  poLastBonusFree?: number
  /** โปรซื้อครั้งล่าสุด — % แถมเพิ่ม */
  poLastBonusPct?: number
  /** ราคาขายหลายระดับ — แถวละระดับ: กำไร % จากทุน (ใหม่) หรือ ราคา+ลด% (เดิม) */
  sellPriceTiers?: SellPriceTier[]
  /**
   * โหมดคอลัมน์ % ในแถวระดับราคา: กำไรจากทุน (ค่าเริ่มต้น) หรือ ลด% จากราคาตั้ง (supplierListPrice)
   */
  sellTierPercentBasis?: SellTierPercentBasis
  /** ถ้ามี — ใช้ในค้นหาตามมิติ (เช่น ไส้กรองที่วัดได้แต่ไม่มีเบอร์) */
  physicalDimensions?: PhysicalDimensions
  crossBranch: CrossBranchStockRow[]
  /** สอดคล้องกับ InventoryProduct */
  stockMode?: 'piece' | 'kg_roll' | 'meter_roll' | 'box_piece'
  /** กก. ต่อม้วนเต็ม (ประมาณ — ใช้หักสต็อกเมื่อเปิดม้วนใหม่) */
  nominalKgPerRoll?: number
  /** เมตรต่อม้วนเต็ม — ใช้กับ stockMode = meter_roll (สต็อกม้วนเก็บเป็นหน่วยเมตร) */
  nominalMetersPerRoll?: number
  /** ชิ้นต่อกล่อง — ใช้เมื่อ stockMode = box_piece */
  piecesPerBox?: number
  /** สินค้าแบ่งขาย (กก./ม้วน) — ชื่อบิล/POS ใช้ชื่อสั้น (ตัดท้ายวงเล็บชุดสุดท้าย) */
  splitSale?: boolean
  /**
   * รีวิชันแฟ้มมาสเตอร์ — เพิ่มทุกครั้งที่บันทึก (เตรียมตรวจแก้ทับข้ามสาขา / ซิงค์)
   */
  masterRevision?: number
  lastMasterEditAt?: string
  lastMasterEditBranchId?: BranchId
  lastMasterEditBy?: string
  /**
   * คู่น็อต STL (หมวด «คู่หัวตามไซส์») — เมื่อสินค้านี้เป็น**ตัวผู้**: ระบุ SKU หัว/ตัวเมีย + แหวนแถม (ใช้ที่ POS ปุ่ม +หัว)
   */
  stlBoltPairNutSku?: string
  stlBoltPairWasherSku?: string
  /**
   * เมื่อสินค้านี้เป็น**หัว/ตัวเมีย**: ระบุ SKU ตัวผู้ทั้งหมดที่ใช้คู่กับหัวนี้ (หลายความยาว)
   */
  stlBoltPairMaleSkus?: string[]
  /** กฎสินค้าแถมตอนรับของ — เมื่อรับสินค้านี้แล้วแถมสินค้าอื่นอัตโนมัติ */
  receiveBonusRules?: ReceiveBonusRule[]
  /** ส่วนประกอบของสินค้าชุด (Bundle/Kit) — ตัดสต็อกจาก SKU ส่วนประกอบแทน SKU ชุด */
  bundleComponents?: BundleComponent[]
  /** ISO timestamp เมื่อถูกย้ายเข้าถังขยะ — ถ้ามีค่า = soft-deleted */
  deletedAt?: string
}

/** ชื่อแสดงบน POS / บิล — ถ้า splitSale ตัดท้าย ` (ข้อความ)` ชุดสุดท้าย */
export function posDisplayProductName(p: { name: string; splitSale?: boolean }): string {
  if (!p.splitSale) return p.name
  const t = p.name.replace(/\s*\([^)]*\)\s*$/, '').trim()
  return t || p.name
}

/** จำนวนชุดที่ประกอบได้ = min(stock[comp] / comp.qty) ข้ามส่วนประกอบทั้งหมด */
export function getBundleAvailableQty(
  components: BundleComponent[],
  pieceStock: Record<string, number>,
): number {
  if (!components.length) return 0
  let available = Infinity
  for (const comp of components) {
    const master = getProductMasterBySku(comp.sku)
    if (!master) return 0
    const stock = pieceStock[master.id] ?? 0
    available = Math.min(available, Math.floor(stock / Math.max(1, comp.qty)))
  }
  return available === Infinity ? 0 : Math.max(0, available)
}

/** แปลง bundleComponents[] → stockBreakdown[] (productId + qty ต่อ 1 ชุด) */
export function resolveBundleBreakdown(
  components: BundleComponent[],
): Array<{ productId: string; qty: number }> {
  return components
    .flatMap((comp) => {
      const master = getProductMasterBySku(comp.sku)
      if (!master) return []
      return [{ productId: master.id, qty: comp.qty }]
    })
}

export type SellPriceTier = {
  price: number
  discountPercent: number
  /** กำไร % จากต้นทุนต่อชิ้น — ใช้เมื่อไม่ได้ระบุราคาต่อหน่วยโดยตรง */
  markupFromCostPercent?: number
  /** ลด % จากราคาตั้ง (supplierListPrice) ต่อชิ้น — รูปแบบเก่า: ค่าบวก = ลดจากราคาตั้ง */
  discountFromSupplierListPercent?: number
  /**
   * ปรับ % จากราคาตั้งต่อชิ้น (โหมด list_discount รูปแบบใหม่)
   * บวก = แพงกว่าราคาตั้ง, ลบ = ลดจากราคาตั้ง — ราคา = ฐาน × (1 + ค่านี้/100)
   */
  supplierListSignedPercent?: number
  /** ราคาขายสุทธิต่อหน่วย — ลำดับตรงกับ salesUnits (ถ้ามี) */
  explicitUnitPrices?: number[]
  /** ราคาขายสุทธิหน่วยฐาน (ระบุตรง) — ตำแหน่งแรกของ explicitUnitPrices */
  explicitSmallUnitPrice?: number
  /** ราคาขายสุทธิหน่วยที่สอง (ระบุตรง) */
  explicitLargeUnitPrice?: number
}

export function effectiveSellPriceTier(tier: SellPriceTier): number {
  return Math.round(tier.price * (1 - Math.min(100, Math.max(0, tier.discountPercent)) / 100) * 100) / 100
}

/** จำนวนชิ้นต่อหน่วยราคาตั้ง จาก Scheme «X+Y» (เช่น 10+1 → 11) — ใช้หารราคาตั้งเป็นต่อชิ้น */
export function effectiveQtyFromScheme(scheme: string | undefined): number {
  const t = scheme?.trim() ?? ''
  const m = t.match(/^(\d+)\s*\+\s*(\d+)$/)
  if (!m) return 1
  const buy = Number(m[1])
  const free = Number(m[2])
  if (!Number.isFinite(buy) || buy <= 0 || !Number.isFinite(free) || free < 0) return 1
  return buy + free
}

export type SellPriceTierPricingContext = {
  supplierListPrice?: number
  sellTierPercentBasis?: SellTierPercentBasis
  /** ราคาตั้ง ÷ ค่านี้ = ฐานต่อชิ้น (สอดคล้อง Scheme รับเข้า) */
  listPricePiecesPerListUnit?: number
}

function listPricePerPieceFromContext(ctx: SellPriceTierPricingContext | undefined): number | null {
  if (!ctx?.supplierListPrice || ctx.supplierListPrice <= 0) return null
  const q = Math.max(1, ctx.listPricePiecesPerListUnit ?? 1)
  return Math.round((ctx.supplierListPrice / q) * 100) / 100
}

export function sellPriceTierContextFromProduct(
  p: Pick<ProductMasterDetail, 'supplierListPrice' | 'sellTierPercentBasis' | 'scheme'>,
): SellPriceTierPricingContext {
  return {
    supplierListPrice: p.supplierListPrice,
    sellTierPercentBasis: p.sellTierPercentBasis,
    listPricePiecesPerListUnit: effectiveQtyFromScheme(p.scheme),
  }
}

/** รวม salesUnits จากฟิลด์ใหม่หรือแปลงจากหน่วยย่อย/ใหญ่ + บรรจุ */
export function normalizeSalesUnits(p: ProductMasterDetail): SalesUnit[] {
  if (p.salesUnits && p.salesUnits.length > 0) {
    return p.salesUnits.map((u) => ({
      ...u,
      baseUnits: Math.max(1, Math.round(Number(u.baseUnits)) || 1),
    }))
  }
  const units: SalesUnit[] = []
  const u1 = p.unitSmall?.trim()
  const u2 = p.unitLarge?.trim()
  const n = parsePiecesPerPack(p.packaging)
  if (u1) units.push({ id: 'legacy-u1', label: u1, baseUnits: 1 })
  if (u2) units.push({ id: 'legacy-u2', label: u2, baseUnits: Math.max(1, n) })
  if (units.length === 0) units.push({ id: 'default-u1', label: 'ชิ้น', baseUnits: 1 })
  return units
}

/**
 * ราคาขายหน่วยฐานต่อระดับ
 * ลำดับ: ระบุตรง → คำนวณจากหน่วยใหญ่ ÷ จำนวนต่อลัง → ลด% จากราคาตั้ง (ถ้าโหมด list_discount) → กำไร % จากทุน → แบบเดิม (ราคา−ลด%)
 */
export function sellPriceSmallUnitFromTier(
  tier: SellPriceTier,
  cost: number,
  piecesPerPack: number = 1,
  pricingCtx?: SellPriceTierPricingContext,
): number | null {
  const exArr = tier.explicitUnitPrices
  if (exArr && exArr.length > 0 && exArr[0] !== undefined && exArr[0] > 0) {
    return Math.round(exArr[0] * 100) / 100
  }
  const exS = tier.explicitSmallUnitPrice
  if (exS !== undefined && exS > 0) return Math.round(exS * 100) / 100
  const exL = tier.explicitLargeUnitPrice
  const q = Math.max(1, piecesPerPack)
  if (exL !== undefined && exL > 0) {
    return Math.round((exL / q) * 100) / 100
  }
  const basis = pricingCtx?.sellTierPercentBasis ?? 'cost_markup'
  if (basis === 'list_discount') {
    const listPp = listPricePerPieceFromContext(pricingCtx)
    if (listPp !== null && listPp > 0) {
      const signed = tier.supplierListSignedPercent
      if (signed !== undefined && signed !== 0 && Number.isFinite(signed)) {
        const p = Math.max(-100, signed)
        return Math.max(0, Math.round(listPp * (1 + p / 100) * 100) / 100)
      }
      const d = tier.discountFromSupplierListPercent
      if (d !== undefined && d > 0) {
        return Math.max(0, Math.round(listPp * (1 - Math.min(100, d) / 100) * 100) / 100)
      }
    }
  }
  const m = tier.markupFromCostPercent
  if (m !== undefined && m !== 0 && Number.isFinite(m) && cost >= 0) {
    return Math.max(0, Math.round(cost * (1 + m / 100) * 100) / 100)
  }
  if (tier.price > 0) return effectiveSellPriceTier(tier)
  return null
}

/** ราคาหน่วยใหญ่ (ดัชนี 1) — ระบุตรง หรือ หน่วยฐาน × จำนวนต่อลัง */
export function sellPriceLargeUnitFromTier(
  tier: SellPriceTier,
  cost: number,
  piecesPerPack: number,
  pricingCtx?: SellPriceTierPricingContext,
): number | null {
  const exArr = tier.explicitUnitPrices
  if (exArr && exArr.length > 1 && exArr[1] !== undefined && exArr[1] > 0) {
    return Math.round(exArr[1] * 100) / 100
  }
  const exL = tier.explicitLargeUnitPrice
  if (exL !== undefined && exL > 0) return Math.round(exL * 100) / 100
  const s = sellPriceSmallUnitFromTier(tier, cost, piecesPerPack, pricingCtx)
  if (s === null) return null
  const q = Math.max(1, piecesPerPack)
  return Math.round(s * q * 100) / 100
}

/** ราคาขายต่อหน่วยตามลำดับ (สอดคล้องกับ normalizeSalesUnits) */
export function sellPriceAtUnitIndex(
  tier: SellPriceTier,
  cost: number,
  piecesPerPack: number,
  units: SalesUnit[],
  index: number,
  pricingCtx?: SellPriceTierPricingContext,
): number | null {
  const exArr = tier.explicitUnitPrices
  if (exArr && exArr[index] !== undefined && exArr[index]! > 0) {
    return Math.round(exArr[index]! * 100) / 100
  }
  if (index === 0) return sellPriceSmallUnitFromTier(tier, cost, piecesPerPack, pricingCtx)
  const base = sellPriceSmallUnitFromTier(tier, cost, piecesPerPack, pricingCtx)
  if (base === null) return null
  const u = units[index]
  if (!u) return null
  const b = Math.max(1, u.baseUnits)
  return Math.round(base * b * 100) / 100
}

/**
 * ราคาหน่วยนี้ในแถวระดับราคาถูกใส่ตรงในแฟ้มมาสเตอร์ — ไม่นับค่าที่คำนวณจากทุน/% / tier.price / แปลงจากหน่วยฐาน
 * (POS ใช้กรอง dropdown — โชว์เฉพาะราคาที่ตั้งชัด)
 */
export function tierHasExplicitUnitPrice(
  tier: SellPriceTier,
  unitIndex: number,
  normUnits: SalesUnit[],
): boolean {
  const ex = tier.explicitUnitPrices
  if (ex != null && ex[unitIndex] != null && Number(ex[unitIndex]) > 0) return true
  if (unitIndex === 0 && tier.explicitSmallUnitPrice != null && tier.explicitSmallUnitPrice > 0) return true
  if (normUnits.length >= 2 && unitIndex === 1) {
    if (tier.explicitLargeUnitPrice != null && tier.explicitLargeUnitPrice > 0) return true
    if (ex != null && ex[1] != null && Number(ex[1]) > 0) return true
  }
  return false
}

/** ดึงตัวเลขนำหน้าจากข้อความบรรจุ (เช่น "12 ชิ้น/ลัง" → 12) */
export function parsePiecesPerPack(packaging: string | undefined): number {
  if (!packaging?.trim()) return 1
  const m = packaging.trim().match(/^(\d+)/)
  if (m) return Math.max(1, parseInt(m[1], 10))
  return 1
}

/** ราคาขายหลักในรายการ — ระดับแรกที่มีราคาหน่วยฐานสุทธิ > 0 */
export function primarySellPriceFromTiers(
  tiers: SellPriceTier[] | undefined,
  cost: number,
  piecesPerPack: number = 1,
  pricingCtx?: SellPriceTierPricingContext,
): number {
  if (!tiers?.length) return 0
  for (const t of tiers) {
    const s = sellPriceSmallUnitFromTier(t, cost, piecesPerPack, pricingCtx)
    if (s !== null && s > 0) return s
  }
  return 0
}

/** ทุนหลังหักส่วนลดซื้อตามลำดับ */
export function computeCostFromSupplierList(list: number, pcts: [number, number, number, number]): number {
  let x = list
  for (const p of pcts) {
    if (p > 0 && Number.isFinite(p)) x *= 1 - Math.min(100, p) / 100
  }
  return Math.round(x * 100) / 100
}

export const PRODUCT_MASTER_DETAILS: ProductMasterDetail[] = [
  {
    id: 'pm1',
    sku: 'TOY-90915-YZZN2',
    name: 'กรองน้ำมันเครื่อง Toyota REVO/NEW FORTUNER',
    brand: 'Toyota Motor',
    category: 'เครื่องยนต์',
    subCategory: 'กรองน้ำมันเครื่อง',
    carBrand: 'TOYOTA',
    carModelLabel: 'Revo / Fortuner',
    yearLabel: '2015+',
    oemTags: ['TOYOTA 90915-YZZN2', '90915-YZZD2'],
    factoryNo: '1-OTT130',
    carModels: ['Revo 2015+', 'Fortuner 2015+'],
    costPrice: 185,
    scheme: '10+1',
    avgCost: 192,
    sellPrice: 280,
    physicalDimensions: { heightMm: 85, outerDiameterMm: 68, innerDiameterMm: 28 },
    crossBranch: [
      {
        id: 'cb1',
        locationLabel: 'คลังกลาง',
        stock: 415,
        position: 'Shelf A1-2',
        status: 'normal',
      },
      {
        id: 'cb2',
        locationLabel: 'สาขา 1',
        stock: 25,
        position: 'Rack B3-1',
        status: 'normal',
      },
      {
        id: 'cb3',
        locationLabel: 'สาขา 2',
        stock: 8,
        position: 'Rack C2-2',
        status: 'low',
        showTransfer: true,
      },
    ],
  },
  {
    id: 'pm2',
    sku: 'TOYVIG412',
    name: 'ลูกหมากปีกนก Vigo 2WD',
    brand: '555',
    category: 'ช่วงล่าง',
    subCategory: 'ลูกหมากปีกนก',
    carBrand: 'TOYOTA',
    carModelLabel: 'Vigo',
    yearLabel: '2004+',
    oemTags: ['43330-0K010'],
    carModels: ['Vigo 2004+'],
    costPrice: 890,
    scheme: '5+1',
    avgCost: 905,
    sellPrice: 1150,
    crossBranch: [
      { id: 'x1', locationLabel: 'คลังกลาง', stock: 35, position: 'B4-12', status: 'normal' },
      { id: 'x2', locationLabel: 'สาขา 1', stock: 4, position: 'Rack A2', status: 'low', showTransfer: true },
    ],
  },
  {
    id: 'pm3',
    sku: 'HON-CIV-AF',
    name: 'กรองอากาศ Civic FC',
    brand: 'HONDA',
    category: 'เครื่องยนต์',
    subCategory: 'กรองอากาศ',
    carBrand: 'HONDA',
    carModelLabel: 'CIVIC',
    yearLabel: '1.5 Turbo (2020)',
    oemTags: ['17220-5AA-A00'],
    carModels: ['รถยนต์ HONDA CIVIC — 1.5 Turbo (2020)'],
    vehicleFitments: [
      {
        id: 'vf-pm3-civ-15t',
        categoryId: 'car',
        categoryLabel: 'รถยนต์',
        brandId: 'b-honda',
        brandName: 'HONDA',
        modelId: 'm-civic',
        modelName: 'CIVIC',
        engineId: 'e-h-civ-1',
        engineLabel: '1.5 Turbo (2020)',
      },
    ],
    costPrice: 420,
    scheme: '10+1',
    avgCost: 430,
    sellPrice: 590,
    physicalDimensions: { heightMm: 42, outerDiameterMm: 235, innerDiameterMm: 150 },
    crossBranch: [
      { id: 'y1', locationLabel: 'คลังกลาง', stock: 10, position: 'A1-03', status: 'low' },
    ],
  },
  {
    id: 'pm-civ-brake-f',
    sku: 'HV-BR-PAD-F',
    name: 'ผ้าเบรกหน้า Civic FC',
    brand: 'HONDA',
    category: 'ช่วงล่าง',
    subCategory: 'ผ้าเบรก',
    carBrand: 'HONDA',
    carModelLabel: 'CIVIC',
    yearLabel: '1.5 Turbo (2020)',
    oemTags: [],
    carModels: ['รถยนต์ HONDA CIVIC — 1.5 Turbo (2020) (เบรกหน้า)'],
    vehicleFitments: [
      {
        id: 'vf-civ-br-f',
        categoryId: 'car',
        categoryLabel: 'รถยนต์',
        brandId: 'b-honda',
        brandName: 'HONDA',
        modelId: 'm-civic',
        modelName: 'CIVIC',
        engineId: 'e-h-civ-1',
        engineLabel: '1.5 Turbo (2020)',
        brakePosition: 'front',
      },
    ],
    costPrice: 1800,
    scheme: '5+1',
    avgCost: 1850,
    sellPrice: 2450,
    crossBranch: [
      { id: 'cb-civ-brf', locationLabel: 'คลังกลาง', stock: 6, position: 'B-BRK-01', status: 'normal' },
    ],
  },
  {
    id: 'pm-civ-brake-r',
    sku: 'HV-BR-PAD-R',
    name: 'ผ้าเบรกหลัง Civic FC',
    brand: 'HONDA',
    category: 'ช่วงล่าง',
    subCategory: 'ผ้าเบรก',
    carBrand: 'HONDA',
    carModelLabel: 'CIVIC',
    yearLabel: '1.5 Turbo (2020)',
    oemTags: [],
    carModels: ['รถยนต์ HONDA CIVIC — 1.5 Turbo (2020) (เบรกหลัง)'],
    vehicleFitments: [
      {
        id: 'vf-civ-br-r',
        categoryId: 'car',
        categoryLabel: 'รถยนต์',
        brandId: 'b-honda',
        brandName: 'HONDA',
        modelId: 'm-civic',
        modelName: 'CIVIC',
        engineId: 'e-h-civ-1',
        engineLabel: '1.5 Turbo (2020)',
        brakePosition: 'rear',
      },
    ],
    costPrice: 1600,
    scheme: '5+1',
    avgCost: 1650,
    sellPrice: 2180,
    crossBranch: [
      { id: 'cb-civ-brr', locationLabel: 'คลังกลาง', stock: 5, position: 'B-BRK-02', status: 'normal' },
    ],
  },
  {
    id: 'pm4',
    sku: 'ISU-DMAX-FS-W03',
    name: 'ไส้กรองโซล่า/ดักน้ำ Isuzu D-MAX 2003–2006 (ไม่ Common Rail)',
    brand: 'Isuzu / คู่ OEM',
    category: 'เครื่องยนต์',
    subCategory: 'กรองโซล่า / ดักน้ำ',
    carBrand: 'ISUZU',
    carModelLabel: 'D-MAX',
    yearLabel: '2003–2006',
    oemTags: ['8-97288947-0', '8972889470'],
    carModels: ['D-MAX 2003–2006 (ไม่ CR)'],
    costPrice: 380,
    scheme: '10+1',
    avgCost: 395,
    sellPrice: 520,
    /** ตัวอย่าง: สองรูไม่เท่ากัน — ลงเล็ก/ใหญ่ ระบบจับคู่แบบเรียงคู่ตอนค้นหา */
    physicalDimensions: {
      heightMm: 88,
      outerDiameterMm: 76,
      innerDiameterMm: 8.2,
      innerDiameterSecondaryMm: 12.4,
    },
    crossBranch: [
      { id: 'z1', locationLabel: 'คลังกลาง', stock: 22, position: 'F2-08', status: 'normal' },
    ],
  },
  {
    id: 'pm-hose-1in',
    sku: 'HOSE-1IN-PU',
    name: 'สายยางท่อน้ำ 1 นิ้ว (ตัดกิโล / ยกม้วน)',
    brand: 'Generic',
    category: 'ท่อและสาย',
    subCategory: 'สายยาง',
    carBrand: '—',
    carModelLabel: '—',
    yearLabel: '—',
    oemTags: [],
    carModels: [],
    costPrice: 60,
    scheme: '—',
    avgCost: 60,
    sellPrice: 85,
    stockMode: 'kg_roll',
    nominalKgPerRoll: 25,
    salesUnits: [
      { id: 'hose-kg', label: 'กก.', baseUnits: 1 },
      { id: 'hose-m', label: 'ม.', baseUnits: 1 },
      { id: 'hose-roll', label: 'ม้วน', baseUnits: 1 },
    ],
    sellPriceTiers: [
      {
        price: 0,
        discountPercent: 0,
        explicitUnitPrices: [85, 50, 1800],
      },
    ],
    packaging: '1 ม้วน',
    notes: 'ขายตามกิโล (หักสต็อกกก.) · คิดราคาตามเมตรได้ (กรอกกก.ที่ชั่ง) · ยกม้วนราคาต่อม้วน',
    /** ตัวอย่าง: แสดงหลังชื่อที่ POS / บิล (SKU เดียวกับ MOCK_PRODUCTS สายยาง 1 นิ้ว) */
    posDisplayNote: 'โปร: ซื้อม้วนเต็ม แถมข้อต่อ 1 ชุด',
    splitSale: true,
    productTagIds: ['hose-soft'],
    crossBranch: [
      { id: 'hose-cb1', locationLabel: 'คลังกลาง', stock: 250, position: 'R-HOSE-01', status: 'normal' },
    ],
  },
  {
    id: 'pm-batt-cable-raw',
    sku: 'BATT-CABLE-RAW',
    name: 'สายแบตเตอรี่แบบยังไม่ตัด',
    brand: 'Generic',
    category: 'ไฟฟ้า',
    subCategory: 'สายไฟ/สายแบต',
    carBrand: '—',
    carModelLabel: '—',
    yearLabel: '—',
    oemTags: [],
    carModels: [],
    costPrice: 95,
    scheme: '—',
    avgCost: 95,
    sellPrice: 140,
    salesUnits: [{ id: 'batt-cable-m', label: 'เมตร', baseUnits: 1 }],
    crossBranch: [{ id: 'batt-cb1', locationLabel: 'คลังกลาง', stock: 120, position: 'R-BATT-01', status: 'normal' }],
  },
  {
    id: 'pm-batt-cable',
    sku: 'BATT-CABLE',
    name: 'สายแบตเตอรี่',
    brand: 'Generic',
    category: 'ไฟฟ้า',
    subCategory: 'สายไฟ/สายแบต',
    carBrand: '—',
    carModelLabel: '—',
    yearLabel: '—',
    oemTags: [],
    carModels: [],
    costPrice: 88,
    scheme: '—',
    avgCost: 88,
    sellPrice: 135,
    salesUnits: [{ id: 'batt-cable-std-m', label: 'เมตร', baseUnits: 1 }],
    crossBranch: [{ id: 'batt-cb1b', locationLabel: 'คลังกลาง', stock: 80, position: 'R-BATT-01', status: 'normal' }],
  },
  {
    id: 'pm-batt-head-plus',
    sku: 'BATT-HEAD-PLUS-BRASS',
    name: 'หัวสายแบตทองเหลือง (+)',
    brand: 'Generic',
    category: 'ไฟฟ้า',
    subCategory: 'ขั้วแบตเตอรี่',
    carBrand: '—',
    carModelLabel: '—',
    yearLabel: '—',
    oemTags: [],
    carModels: [],
    costPrice: 78,
    scheme: '—',
    avgCost: 78,
    sellPrice: 120,
    crossBranch: [{ id: 'batt-cb2', locationLabel: 'คลังกลาง', stock: 45, position: 'R-BATT-02', status: 'normal' }],
  },
  {
    id: 'pm-batt-head-minus',
    sku: 'BATT-HEAD-MINUS-BRASS',
    name: 'หัวสายแบตทองเหลือง (-)',
    brand: 'Generic',
    category: 'ไฟฟ้า',
    subCategory: 'ขั้วแบตเตอรี่',
    carBrand: '—',
    carModelLabel: '—',
    yearLabel: '—',
    oemTags: [],
    carModels: [],
    costPrice: 78,
    scheme: '—',
    avgCost: 78,
    sellPrice: 120,
    crossBranch: [{ id: 'batt-cb3', locationLabel: 'คลังกลาง', stock: 42, position: 'R-BATT-02', status: 'normal' }],
  },
  {
    id: 'pm-batt-lug',
    sku: 'BATT-LUG',
    name: 'หางปลา',
    brand: 'Generic',
    category: 'ไฟฟ้า',
    subCategory: 'ขั้วต่อ',
    carBrand: '—',
    carModelLabel: '—',
    yearLabel: '—',
    oemTags: [],
    carModels: [],
    costPrice: 18,
    scheme: '—',
    avgCost: 18,
    sellPrice: 35,
    crossBranch: [{ id: 'batt-cb4', locationLabel: 'คลังกลาง', stock: 150, position: 'R-BATT-03', status: 'normal' }],
  },
  {
    id: 'pm-batt-rubber-boot',
    sku: 'BATT-RUBBER-BOOT',
    name: 'ยางหุ้มหัวแบต',
    brand: 'Generic',
    category: 'ไฟฟ้า',
    subCategory: 'อุปกรณ์หุ้ม/ป้องกัน',
    carBrand: '—',
    carModelLabel: '—',
    yearLabel: '—',
    oemTags: [],
    carModels: [],
    costPrice: 10,
    scheme: '—',
    avgCost: 10,
    sellPrice: 25,
    crossBranch: [{ id: 'batt-cb5', locationLabel: 'คลังกลาง', stock: 90, position: 'R-BATT-03', status: 'normal' }],
  },
  {
    id: 'pm-batt-cable-2m-asm',
    sku: 'BATT-CABLE-2M-ASM',
    name: 'สายแบตเตอรี่ 2(ประกอบ)',
    brand: 'Assembled',
    category: 'สินค้าประกอบ',
    subCategory: 'สายแบตสำเร็จรูป',
    carBrand: '—',
    carModelLabel: '—',
    yearLabel: '—',
    oemTags: [],
    carModels: [],
    costPrice: 372,
    scheme: 'ผลิตประกอบ',
    avgCost: 372,
    sellPrice: 690,
    crossBranch: [{ id: 'batt-cb6', locationLabel: 'คลังกลาง', stock: 0, position: 'FG-BATT-01', status: 'normal' }],
  },
  /** ตัวอย่าง: เก็บเทียบเบอร์ — ไม่โผล่ POS / ค้นหารุ่นรถเมื่อกรองเฉพาะของในร้าน */
  {
    id: 'pm-ref-civ-oem-only',
    sku: 'REF-OEM-CIVIC-AIR',
    name: 'เบอร์เทียบกรองอากาศ Civic (อ้างอิง — ไม่ขายที่ร้าน)',
    brand: 'คู่มืออ้างอิง',
    category: 'เครื่องยนต์',
    subCategory: 'กรองอากาศ',
    carBrand: 'HONDA',
    carModelLabel: 'CIVIC',
    yearLabel: '1.5 Turbo (2020)',
    oemTags: ['17220-5AA-A00-ALT'],
    carModels: ['รถยนต์ HONDA CIVIC — 1.5 Turbo (2020)'],
    inStoreCatalog: false,
    vehicleFitments: [
      {
        id: 'vf-ref-civ-air',
        categoryId: 'car',
        categoryLabel: 'รถยนต์',
        brandId: 'b-honda',
        brandName: 'HONDA',
        modelId: 'm-civic',
        modelName: 'CIVIC',
        engineId: 'e-h-civ-1',
        engineLabel: '1.5 Turbo (2020)',
      },
    ],
    costPrice: 0,
    scheme: '—',
    avgCost: 0,
    sellPrice: 0,
    notes: 'ตัวอย่างข้อมูลอ้างอิง — เปิด «เฉพาะสินค้าในร้าน» จะซ่อน; ปิดเพื่อดูในแฟ้มข้อมูล',
    crossBranch: [{ id: 'cb-ref-civ', locationLabel: '—', stock: 0, position: '—', status: 'normal' }],
  },
  {
    id: 'pm-stl-bolt-male-14x12',
    sku: 'STL-BOLT-14-12',
    name: 'น็อต STL 1/4×1/2 (ตัวผู้)',
    brand: 'STL',
    category: 'น็อต / สกรู',
    /** ใช้ที่ POS ปุ่ม +หัว — ตรง SKU หัว/แหวนในแฟ้มมาสเตอร์ */
    stlBoltPairNutSku: 'STL-NUT-14-F',
    stlBoltPairWasherSku: 'STL-WASH-14',
    carBrand: '—',
    carModelLabel: '—',
    yearLabel: '—',
    oemTags: [],
    carModels: [],
    costPrice: 2,
    scheme: '—',
    avgCost: 2,
    sellPrice: 5,
    salesUnits: [{ id: 'u-stl-bolt-pc', label: 'ตัว', baseUnits: 1 }],
    posDisplayNote: 'กด +หัว ใน POS เพื่อเพิ่มตัวเมียและแถมแหวน',
    crossBranch: [{ id: 'cb-stl-b14', locationLabel: 'คลังกลาง', stock: 800, position: 'BOLT-14', status: 'normal' }],
  },
  {
    id: 'pm-stl-nut-female-14',
    sku: 'STL-NUT-14-F',
    name: 'หัวน็อต STL 1/4 (ตัวเมีย)',
    brand: 'STL',
    category: 'น็อต / สกรู',
    carBrand: '—',
    carModelLabel: '—',
    yearLabel: '—',
    oemTags: [],
    carModels: [],
    costPrice: 2,
    scheme: '—',
    avgCost: 2,
    sellPrice: 5,
    salesUnits: [{ id: 'u-stl-nut-pc', label: 'ตัว', baseUnits: 1 }],
    crossBranch: [{ id: 'cb-stl-n14', locationLabel: 'คลังกลาง', stock: 600, position: 'BOLT-14', status: 'normal' }],
  },
  {
    id: 'pm-stl-washer-14',
    sku: 'STL-WASH-14',
    name: 'แหวนอีแปะ 1/4 (แถมคู่น็อต)',
    brand: 'STL',
    category: 'น็อต / สกรู',
    carBrand: '—',
    carModelLabel: '—',
    yearLabel: '—',
    oemTags: [],
    carModels: [],
    costPrice: 0.5,
    scheme: '—',
    avgCost: 0.5,
    sellPrice: 0,
    salesUnits: [{ id: 'u-stl-w-pc', label: 'ตัว', baseUnits: 1 }],
    posDisplayNote: 'ของแถมจากโปรคู่น็อต — ไม่ขายแยกในตะกร้า',
    crossBranch: [{ id: 'cb-stl-w14', locationLabel: 'คลังกลาง', stock: 2000, position: 'BOLT-14', status: 'normal' }],
  },
]

const DEMO_OIL_IDS = ['pm-oil-10w40-6l', 'pm-oil-10w40-1l', 'pm-oil-6p1l', 'pm-oil-1l']

/** ลบสินค้าตัวอย่างน้ำมันเครื่องที่ถูก seed ไว้ก่อนหน้าออกจาก localStorage */
export function seedDemoOilProducts(): void {
  const list = getProductMasterList()
  const cleaned = list.filter((p) => !DEMO_OIL_IDS.includes(p.id))
  if (cleaned.length !== list.length) saveProductMasterList(cleaned, { notify: false })
}

/** หมายเหตุแสดง (POS) จากแฟ้มมาสเตอร์ — ใช้คู่กับ MOCK_PRODUCTS ตาม SKU */
export function masterPosDisplayNoteForSku(sku: string): string | undefined {
  const key = sku.trim().toLowerCase()
  for (const p of getProductMasterList()) {
    if (p.sku.trim().toLowerCase() === key) {
      const n = p.posDisplayNote?.trim()
      if (n) return n
    }
  }
  return undefined
}

/**
 * รหัสสินค้าใหม่ 10 หลัก — รันต่อจากเลข 10 หลักที่มีอยู่ (ถ้ายังไม่มี เริ่มที่ 0000000001)
 * ไม่ชนกับ SKU ใดๆ ในรายการ
 */
export function generateNextTenDigitSku(products: ProductMasterDetail[]): string {
  const taken = new Set(products.map((p) => p.sku.trim().toLowerCase()))
  let max = 0
  for (const p of products) {
    const s = p.sku.trim()
    if (/^\d{10}$/.test(s)) {
      const n = parseInt(s, 10)
      if (n > max) max = n
    }
  }
  let n = max > 0 ? max + 1 : 1
  for (let guard = 0; guard < 1_000_000; guard++) {
    if (n > 9_999_999_999) n = 1
    const sku = String(n).padStart(10, '0')
    if (!taken.has(sku)) return sku
    n++
  }
  return String(Date.now()).slice(-10).padStart(10, '0')
}

/** คัดลอกเฉพาะชื่อ รุ่น ยี่ห้อ บริษัท หน่วยขาย หมวด — รหัสใหม่ / ไม่คัดลอก OEM ราคา มิติ */
export function buildQuickCopyProduct(source: ProductMasterDetail, newSku: string): ProductMasterDetail {
  const id = `pm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const su = normalizeSalesUnits(source).map((u, i) => ({
    id: `u-${id}-${i}`,
    label: u.label,
    baseUnits: u.baseUnits,
  }))
  return {
    id,
    sku: newSku,
    name: source.name,
    brand: source.brand,
    category: source.category,
    subCategory: source.subCategory,
    carBrand: source.carBrand,
    carModelLabel: source.carModelLabel,
    yearLabel: '—',
    oemTags: [],
    crossReferenceTags: undefined,
    carModels: source.carModelLabel.trim() ? [source.carModelLabel.trim()] : [],
    vehicleFitments: source.vehicleFitments?.map((f, i) => ({
      ...f,
      id: `vf-${id}-${i}`,
    })),
    costPrice: 0,
    scheme: 'คัดลอก',
    avgCost: 0,
    sellPrice: 0,
    salesUnits: su,
    physicalDimensions: undefined,
    crossBranch: [
      {
        id: `cb-${id}`,
        locationLabel: 'คลังกลาง',
        stock: 0,
        position: '—',
        status: 'normal',
      },
    ],
    splitSale: source.splitSale,
    posDisplayNote: source.posDisplayNote,
    inStoreCatalog: source.inStoreCatalog,
    salesStatus: source.salesStatus,
    subSubCategory: source.subSubCategory,
    productTagIds: source.productTagIds?.length ? [...source.productTagIds] : undefined,
    stlBoltPairNutSku: source.stlBoltPairNutSku,
    stlBoltPairWasherSku: source.stlBoltPairWasherSku,
    stlBoltPairMaleSkus: source.stlBoltPairMaleSkus?.length ? [...source.stlBoltPairMaleSkus] : undefined,
  }
}

const PRODUCT_MASTER_LIST_LS_KEY = 'bento.inventory.productMasterList.v1'

export const PRODUCT_MASTER_LIST_CHANGED_EVENT = 'bento-product-master-list-changed'

/** เมื่อโหลดจาก Postgres แล้ว — ให้ getProductMasterList() ใช้ชุดนี้แทน localStorage */
let productMasterMemoryCache: ProductMasterDetail[] | null = null
let productMasterSkuMap: Map<string, ProductMasterDetail> | null = null

export function clearProductMasterMemoryCache(): void {
  productMasterMemoryCache = null
  productMasterSkuMap = null
}

const PRODUCT_MASTER_DB_DEBOUNCE_MS = 1200

let productMasterDbDebounceTimer: number | null = null
let productMasterDbPending: ProductMasterDetail[] | null = null

export async function persistProductMasterListToDb(products: ProductMasterDetail[]): Promise<void> {
  const rows = JSON.parse(JSON.stringify(products)) as unknown[]
  await invoke('products_master_replace_all', { rows })
}

/** บังคับบันทึกลง Postgres ทันที (เช่น ก่อนออกจากหน้าแฟ้มสินค้า) */
export function flushProductMasterDbSave(): Promise<void> {
  if (productMasterDbDebounceTimer !== null) {
    clearTimeout(productMasterDbDebounceTimer)
    productMasterDbDebounceTimer = null
  }
  if (!isTauri() || !productMasterDbPending) {
    productMasterDbPending = null
    return Promise.resolve()
  }
  const snap = productMasterDbPending
  productMasterDbPending = null
  return persistProductMasterListToDb(snap).catch((e) => {
    const msg = e instanceof Error ? e.message : String(e)
    window.alert(`บันทึกแฟ้มสินค้าลงฐานข้อมูลไม่สำเร็จ\n${msg}`)
    throw e
  })
}

function schedulePersistProductMasterListToDb(products: ProductMasterDetail[]): void {
  if (!isTauri()) return
  productMasterDbPending = products
  if (productMasterDbDebounceTimer !== null) {
    clearTimeout(productMasterDbDebounceTimer)
  }
  productMasterDbDebounceTimer = window.setTimeout(() => {
    productMasterDbDebounceTimer = null
    const snap = productMasterDbPending
    productMasterDbPending = null
    if (!snap) return
    void persistProductMasterListToDb(snap).catch((e) => {
      const msg = e instanceof Error ? e.message : String(e)
      window.alert(`บันทึกแฟ้มสินค้าลงฐานข้อมูลไม่สำเร็จ\n${msg}`)
    })
  }, PRODUCT_MASTER_DB_DEBOUNCE_MS)
}

/** โหลดแฟ้มสินค้าจาก Postgres (Tauri) — ถ้ามีข้อมูลจะอัปเดต cache + localStorage */
export async function hydrateProductMasterFromDb(): Promise<ProductMasterDetail[]> {
  if (!isTauri()) {
    return getProductMasterList()
  }
  try {
    const rows = await invoke<unknown[]>('products_master_load')
    if (!Array.isArray(rows) || rows.length === 0) {
      // DB ว่าง — ถ้า localStorage มีข้อมูลจริง (user เคยบันทึก) ให้ push ขึ้น DB ทันที
      const hasLocalSave = localStorage.getItem(PRODUCT_MASTER_LIST_LS_KEY) !== null
      if (hasLocalSave) {
        const localList = getProductMasterList()
        void persistProductMasterListToDb(localList).catch((e) => {
          console.error('[product-master] auto-push local→db failed', e)
        })
        console.info(`[product-master] DB empty — pushing ${localList.length} rows from localStorage to DB`)
      }
      return getProductMasterList()
    }
    const list = rows
      .map((r) => r as ProductMasterDetail)
      .filter((p) => p && typeof p.id === 'string' && typeof p.sku === 'string')
    const afterHose = migrateLegacyHoseProductTag(list)
    const oemFix = migrateSkuDuplicateFromOemToFactory(afterHose)
    const normalized = oemFix.list
    if (oemFix.dirty) {
      void persistProductMasterListToDb(normalized).catch((e) => {
        console.error('[product-master] migrate SKU→factory persist failed', e)
      })
    }
    productMasterMemoryCache = normalized
    productMasterSkuMap = null
    try {
      localStorage.setItem(PRODUCT_MASTER_LIST_LS_KEY, JSON.stringify(normalized))
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(PRODUCT_MASTER_LIST_CHANGED_EVENT))
    return normalized
  } catch (e) {
    console.error('[product-master] hydrateProductMasterFromDb failed', e)
    return getProductMasterList()
  }
}

/** รายการสินค้าที่ใช้ในระบบ — ถ้ามีข้อมูลใน localStorage ใช้ชุดนั้น ไม่เช่นนั้นใช้ชุดตัวอย่างในตัวโปรแกรม */
function migrateLegacyHoseProductTag(list: ProductMasterDetail[]): ProductMasterDetail[] {
  let dirty = false
  const next = list.map((p) => {
    const ids = p.productTagIds
    if (!ids?.includes('hose')) return p
    dirty = true
    const replaced = ids.map((id) => (id === 'hose' ? 'hose-soft' : id))
    const uniq = [...new Set(replaced)]
    return { ...p, productTagIds: uniq.length ? uniq : undefined }
  })
  if (dirty) {
    localStorage.setItem(PRODUCT_MASTER_LIST_LS_KEY, JSON.stringify(next))
  }
  return next
}

/**
 * ย้ายเบอร์ที่ซ้ำกับรหัสสินค้า (SKU) ออกจาก oemTags → factoryNo เมื่อช่องโรงงานว่าง
 * (กรณีกรอกเบอร์โรงงานผิดช่องไปที่ «เบอร์แท้ (OEM)»)
 */
function migrateSkuDuplicateFromOemToFactory(list: ProductMasterDetail[]): {
  list: ProductMasterDetail[]
  dirty: boolean
} {
  let dirty = false
  const next = list.map((p) => {
    const sku = (p.sku ?? '').trim()
    if (!sku) return p
    if ((p.factoryNo ?? '').trim()) return p
    const tags = (p.oemTags ?? []).map((t) => String(t).trim()).filter(Boolean)
    if (tags.length === 0) return p
    const skuLower = sku.toLowerCase()
    const matchSku = tags.filter((t) => t.toLowerCase() === skuLower)
    if (matchSku.length === 0) return p
    dirty = true
    const rest = tags.filter((t) => t.toLowerCase() !== skuLower)
    return { ...p, factoryNo: matchSku[0], oemTags: rest }
  })
  return { list: next, dirty }
}

export function getProductMasterList(): ProductMasterDetail[] {
  if (productMasterMemoryCache !== null) {
    return productMasterMemoryCache
  }
  try {
    const raw = localStorage.getItem(PRODUCT_MASTER_LIST_LS_KEY)
    if (!raw) return [...PRODUCT_MASTER_DETAILS]
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return [...PRODUCT_MASTER_DETAILS]
    const afterHose = migrateLegacyHoseProductTag(parsed as ProductMasterDetail[])
    const oemFix = migrateSkuDuplicateFromOemToFactory(afterHose)
    if (oemFix.dirty) {
      try {
        localStorage.setItem(PRODUCT_MASTER_LIST_LS_KEY, JSON.stringify(oemFix.list))
      } catch {
        /* ignore */
      }
      if (isTauri()) {
        schedulePersistProductMasterListToDb(oemFix.list)
      }
    }
    return oemFix.list
  } catch {
    return [...PRODUCT_MASTER_DETAILS]
  }
}

export function saveProductMasterList(
  products: ProductMasterDetail[],
  opts?: { notify?: boolean },
): void {
  productMasterMemoryCache = products
  productMasterSkuMap = null
  try {
    localStorage.setItem(PRODUCT_MASTER_LIST_LS_KEY, JSON.stringify(products))
  } catch {
    /* ignore */
  }
  if (opts?.notify !== false) {
    window.dispatchEvent(new CustomEvent(PRODUCT_MASTER_LIST_CHANGED_EVENT))
  }
  if (isTauri()) {
    schedulePersistProductMasterListToDb(products)
  }
}

export function clearProductMasterListOverride(): void {
  productMasterMemoryCache = null
  productMasterSkuMap = null
  localStorage.removeItem(PRODUCT_MASTER_LIST_LS_KEY)
  window.dispatchEvent(new CustomEvent(PRODUCT_MASTER_LIST_CHANGED_EVENT))
}

export function getProductMasterById(id: string): ProductMasterDetail | undefined {
  return getProductMasterList().find((p) => p.id === id)
}

export function getProductMasterBySku(sku: string): ProductMasterDetail | undefined {
  const key = sku.trim().toLowerCase()
  if (!key) return undefined
  if (productMasterSkuMap === null) {
    productMasterSkuMap = new Map(
      getProductMasterList().map((p) => [p.sku.trim().toLowerCase(), p]),
    )
  }
  return productMasterSkuMap.get(key)
}

/** ค้นบาร์โค้ดข้ามทุกสินค้า — คืน product + จำนวนต่อสแกน */
export function getProductMasterByBarcode(
  code: string,
): { product: ProductMasterDetail; qtyPerScan: number } | undefined {
  const key = code.trim().toLowerCase()
  if (!key) return undefined
  for (const p of getProductMasterList()) {
    if (p.sku.trim().toLowerCase() === key) return { product: p, qtyPerScan: 1 }
    for (const b of p.barcodes ?? []) {
      if (b.code.trim().toLowerCase() === key) return { product: p, qtyPerScan: b.qtyPerScan }
    }
  }
  return undefined
}

/** POS / MOCK สินค้า — ถ้าไม่มีแถวมาสเตอร์ให้ผ่าน (ของเดโมเก่า) */
export function productPosEligibleByInventorySku(sku: string): boolean {
  const m = getProductMasterBySku(sku)
  if (!m) return true
  return productEligibleForPosSale(m)
}

/** ข้อความรวมสำหรับค้นหา POS — รุ่นรถหลายแถว, OEM, เทียบ */
export function masterSearchExtrasForSku(sku: string): string {
  const m = getProductMasterBySku(sku)
  if (!m) return ''
  const parts: string[] = []
  const yearTokens = new Set<string>()
  const nowYear = new Date().getFullYear()
  for (const f of m.vehicleFitments ?? []) {
    if (!f) continue
    parts.push(`${f.categoryLabel} ${f.brandName} ${f.modelName} ${f.engineLabel}`)
    if (f.engineText?.trim()) parts.push(f.engineText.trim())
    if (f.driveType?.trim()) parts.push(f.driveType.trim())
    if (f.yearRangeText?.trim()) parts.push(f.yearRangeText.trim())
    const hasFrom = f.yearFrom != null && Number.isFinite(f.yearFrom)
    const hasTo = f.yearTo != null && Number.isFinite(f.yearTo)
    if (hasFrom || hasTo) {
      const from = Math.max(1900, Math.round(hasFrom ? (f.yearFrom as number) : 1900))
      const to = Math.min(2100, Math.round(hasTo ? (f.yearTo as number) : nowYear))
      if (from <= to) {
        for (let y = from; y <= to; y++) {
          yearTokens.add(String(y))
        }
      }
    }
    if (f.engineCode?.trim()) parts.push(f.engineCode.trim())
    if (f.brakePosition === 'front') parts.push('เบรกหน้า')
    else if (f.brakePosition === 'rear') parts.push('เบรกหลัง')
  }
  for (const y of yearTokens) {
    parts.push(y)
  }
  for (const line of m.carModels ?? []) {
    const t = line.trim()
    if (t) parts.push(t)
  }
  for (const t of m.oemTags ?? []) {
    const x = t.trim()
    if (x) parts.push(x)
  }
  for (const t of m.crossReferenceTags ?? []) {
    const x = t.trim()
    if (x) parts.push(x)
  }
  const fn = m.factoryNo?.trim()
  if (fn) parts.push(fn)
  for (const b of m.barcodes ?? []) {
    const c = b.code.trim()
    if (c) parts.push(c)
  }
  return parts.join(' ')
}

/** บรรทัดย่อสำหรับแสดงใต้ผลค้นหา POS เมื่อมีหลายรุ่นในแฟ้มมาสเตอร์ */
export function masterFitmentPreviewForSku(sku: string): string | undefined {
  const m = getProductMasterBySku(sku)
  if (!m) return undefined
  if (m.vehicleFitments?.length) {
    const joined = m.vehicleFitments
      .slice(0, 4)
      .map(
        (f) =>
          `${f.brandName} ${f.modelName} — ${f.engineLabel}${
            f.brakePosition === 'front' ? ' (เบรกหน้า)' : f.brakePosition === 'rear' ? ' (เบรกหลัง)' : ''
          }`,
      )
      .join(' · ')
    return joined.length > 120 ? `${joined.slice(0, 117)}…` : joined
  }
  if (!m.carModels?.length) return undefined
  const joined = m.carModels.slice(0, 4).join(' · ')
  return joined.length > 120 ? `${joined.slice(0, 117)}…` : joined
}
