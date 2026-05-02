import { MOCK_PRODUCTS } from '@/features/inventory/data/mockInventory'
import {
  getProductMasterById,
  getProductMasterBySku,
  normalizeSalesUnits,
  type ProductMasterDetail,
  quantityBreakPriceFor,
  sellPriceAtUnitIndex,
  sellPriceTierContextFromProduct,
  tierHasExplicitUnitPrice,
} from '@/features/inventory/data/productMasterData'
import {
  loadProductTagsRegistry,
  PRODUCT_TAGS_CHANGED_EVENT,
} from '@/features/inventory/data/productTagsRegistry'
import { masterToInventoryProduct } from '@/features/pos/data/posCatalogMerge'
import { getPosUnitPrice } from '@/features/pos/data/posProductPrices'

let productTagsCache: ReturnType<typeof loadProductTagsRegistry> | null = null
function getProductTagsCached() {
  if (!productTagsCache) productTagsCache = loadProductTagsRegistry()
  return productTagsCache
}
if (typeof window !== 'undefined') {
  window.addEventListener(PRODUCT_TAGS_CHANGED_EVENT, () => {
    productTagsCache = null
  })
}

/** ราคาต่อหน่วยจากแฟ้มมาสเตอร์ (ก่อนลดแท็ก) — เทียบช่วงบาทแล้วใช้ % ลดสูงสุดที่เข้าเงื่อนไข */
export function applyProductTagPriceBandDiscount(
  master: ProductMasterDetail | undefined,
  baseUnitPriceBaht: number,
): number {
  if (!master?.productTagIds?.length || baseUnitPriceBaht <= 0) return baseUnitPriceBaht
  const tags = getProductTagsCached()
  const byId = new Map(tags.map((t) => [t.id, t]))
  let bestPct = 0
  for (const tid of master.productTagIds) {
    const def = byId.get(tid)
    if (!def || def.discountPercent == null || def.discountPercent <= 0) continue
    const min = def.priceMinBaht ?? 0
    const max = def.priceMaxBaht ?? Number.POSITIVE_INFINITY
    if (baseUnitPriceBaht >= min && baseUnitPriceBaht <= max) {
      bestPct = Math.max(bestPct, Math.min(100, def.discountPercent))
    }
  }
  if (bestPct <= 0) return baseUnitPriceBaht
  return roundMoney(baseUnitPriceBaht * (1 - bestPct / 100))
}

export type PosSellUnitOption = {
  index: number
  label: string
  baseUnits: number
}

export type PosSellPriceLevelOption = {
  index: number
  label: string
}

/** ระบบราคา 4 ระดับเสมอ (ปลีก/อู่/ร้านค้า/VIP) — tier ที่ไม่ได้ตั้ง fallback เป็นราคาแรกที่ตั้งไว้ */
export const POS_PRICE_TIER_COUNT = 4

export type PosSellConfig = {
  units: PosSellUnitOption[]
  priceLevels: PosSellPriceLevelOption[]
  /** ราคาตั้งต่อหน่วย (ก่อนลดแท็กช่วงราคา) */
  getListUnitPrice: (unitIndex: number, priceLevelIndex: number) => number
  getUnitPrice: (unitIndex: number, priceLevelIndex: number) => number
  /**
   * ราคาต่อหน่วยที่ qty นั้น — ถ้า product มีตารางขั้นบันได (quantityBreaks) และ qty ถึงเกณฑ์
   * จะคืนราคาขั้นบันไดแทน list price ปกติ. มี fallback ไปใช้ getUnitPrice() เสมอเมื่อไม่มี break match.
   */
  getUnitPriceAtQty: (unitIndex: number, priceLevelIndex: number, qty: number) => number
  /**
   * คืนข้อมูล break ที่ active เมื่อ qty ถึงเกณฑ์ (สำหรับโชว์ inline hint ใน UI)
   * คืน null ถ้ายังไม่ถึงขั้นบันได / ไม่มี breaks
   */
  getActiveBreak: (unitIndex: number, priceLevelIndex: number, qty: number) => {
    price: number
    minQty: number
    source: 'tier' | 'default'
  } | null
  /**
   * true เมื่อมาสเตอร์ระบุราคาหน่วยนี้ชัดเจน (explicitUnitPrices / explicitSmall·Large / sellPrice เมื่อไม่มีแถว tier)
   * — ไม่นับราคาที่คำนวณจากทุน% หรือดึงมาจากหน่วยฐานโดยอ้อม
   */
  hasExplicitListPrice: (unitIndex: number, priceLevelIndex: number) => boolean
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export function getPosSellConfig(productId: string): PosSellConfig {
  const fallbackBase = Math.max(0, getPosUnitPrice(productId))
  const masterById = getProductMasterById(productId)
  const mock = MOCK_PRODUCTS.find((p) => p.id === productId)
  const product = mock ?? (masterById ? masterToInventoryProduct(masterById) : undefined)
  const m = masterById ?? (product ? getProductMasterBySku(product.sku) : undefined)

  // เปิด 4 tier ทุกครั้ง — getListUnitPrice ด้านล่าง fallback ให้เองเมื่อ tier นั้นยังไม่ตั้งราคา
  const allTierLevels: PosSellPriceLevelOption[] = Array.from({ length: POS_PRICE_TIER_COUNT }, (_, i) => ({
    index: i,
    label: `ราคา ${i + 1}`,
  }))

  if (!m) {
    const one = () => roundMoney(fallbackBase)
    return {
      units: [{ index: 0, label: 'ชิ้น', baseUnits: 1 }],
      priceLevels: allTierLevels,
      getListUnitPrice: one,
      getUnitPrice: one,
      getUnitPriceAtQty: one,
      getActiveBreak: () => null,
      hasExplicitListPrice: (unitIndex: number) => unitIndex === 0 && fallbackBase > 0,
    }
  }

  const normUnits = normalizeSalesUnits(m)
  const units: PosSellUnitOption[] = normUnits.map((u, i) => ({
    index: i,
    label: u.label,
    baseUnits: Math.max(1, u.baseUnits),
  }))
  const priceLevels = allTierLevels

  /** บรรจุใช้แสดงผลเท่านั้น; คำนวณราคาจากหน่วยขาย/ราคาโดยตรง */
  const pieces = 1
  const cost = m.costPrice
  const tierCtx = sellPriceTierContextFromProduct(m)

  const priceFromMasterNoTier = (u: PosSellUnitOption): number => {
    const fromPosTable = fallbackBase * u.baseUnits
    if (fromPosTable > 0) return roundMoney(fromPosTable)
    const sp = m.sellPrice
    if (typeof sp === 'number' && sp > 0) return roundMoney(sp * u.baseUnits)
    return roundMoney(fromPosTable)
  }

  /** หาราคาที่ตั้งไว้ชัดเจนของ tier ที่ระบุบนหน่วยหนึ่ง (null ถ้าไม่ได้ตั้ง) */
  const explicitTierPrice = (priceLevelIndex: number, u: PosSellUnitOption): number | null => {
    const tier = m.sellPriceTiers?.[priceLevelIndex]
    if (!tier) return null
    if (!tierHasExplicitUnitPrice(tier, u.index, normUnits)) return null
    const p = sellPriceAtUnitIndex(tier, cost, pieces, normUnits, u.index, tierCtx)
    return p !== null && p > 0 ? roundMoney(p) : null
  }

  const getListUnitPrice = (unitIndex: number, priceLevelIndex: number): number => {
    const u = units[unitIndex] ?? units[0]
    if (!m.sellPriceTiers || m.sellPriceTiers.length === 0) {
      return priceFromMasterNoTier(u)
    }
    // Cascade-down: ใช้ราคาที่ตั้งไว้ชัดเจนของ tier นั้นก่อน → ถ้าไม่มี ลองเดินซ้าย (tier ราคาเต็มกว่า)
    // → ถ้ายังไม่มี ค่อยลองเดินขวา (tier ที่ลดมากกว่า) → สุดท้าย fallback master sellPrice
    const explicit = explicitTierPrice(priceLevelIndex, u)
    if (explicit !== null) return explicit
    for (let i = priceLevelIndex - 1; i >= 0; i--) {
      const p = explicitTierPrice(i, u)
      if (p !== null) return p
    }
    for (let i = priceLevelIndex + 1; i < m.sellPriceTiers.length; i++) {
      const p = explicitTierPrice(i, u)
      if (p !== null) return p
    }
    return priceFromMasterNoTier(u)
  }

  const hasExplicitListPrice = (unitIndex: number, priceLevelIndex: number): boolean => {
    if (!m.sellPriceTiers || m.sellPriceTiers.length === 0) {
      if (unitIndex !== 0) return false
      return typeof m.sellPrice === 'number' && m.sellPrice > 0
    }
    const tier = m.sellPriceTiers[priceLevelIndex] ?? m.sellPriceTiers[0]
    if (!tier) return false
    return tierHasExplicitUnitPrice(tier, unitIndex, normUnits)
  }

  const getUnitPrice = (unitIndex: number, priceLevelIndex: number) => {
    const base = getListUnitPrice(unitIndex, priceLevelIndex)
    return applyProductTagPriceBandDiscount(m, base)
  }

  const getUnitPriceAtQty = (unitIndex: number, priceLevelIndex: number, qty: number) => {
    const breakHit = quantityBreakPriceFor(m, unitIndex, priceLevelIndex, qty)
    if (breakHit) return roundMoney(applyProductTagPriceBandDiscount(m, breakHit.price))
    return getUnitPrice(unitIndex, priceLevelIndex)
  }

  const getActiveBreak = (unitIndex: number, priceLevelIndex: number, qty: number) =>
    quantityBreakPriceFor(m, unitIndex, priceLevelIndex, qty)

  return {
    units,
    priceLevels,
    getListUnitPrice,
    getUnitPrice,
    getUnitPriceAtQty,
    getActiveBreak,
    hasExplicitListPrice,
  }
}

/** ระดับราคาแรกที่มาสเตอร์ระบุราคาชัด + ราคาขายจริง > 0 */
export function firstPosPriceLevelWithPrice(
  cfg: PosSellConfig,
  unitIndex: number,
): PosSellPriceLevelOption | null {
  for (const lv of cfg.priceLevels) {
    if (
      cfg.hasExplicitListPrice(unitIndex, lv.index) &&
      cfg.getUnitPrice(unitIndex, lv.index) > 0
    ) {
      return lv
    }
  }
  return null
}

/** เฉพาะระดับราคาที่มาสเตอร์ระบุชัด + ราคา > 0 */
export function posPriceLevelsForUnit(cfg: PosSellConfig, unitIndex: number): PosSellPriceLevelOption[] {
  return cfg.priceLevels.filter(
    (lv) => cfg.hasExplicitListPrice(unitIndex, lv.index) && cfg.getUnitPrice(unitIndex, lv.index) > 0,
  )
}

/** หน่วยขายที่มีราคา > 0 (รวมราคาคำนวณจากหน่วยฐาน) */
export function posUnitsWithSellPrice(cfg: PosSellConfig): PosSellUnitOption[] {
  return cfg.units.filter((u) =>
    cfg.priceLevels.some((lv) => cfg.getUnitPrice(u.index, lv.index) > 0),
  )
}

/** หน่วย+ระดับราคาเริ่มต้นสำหรับเพิ่มบรรทัด POS — หน่วยแรกที่มีราคาตั้งแล้ว */
export function pickDefaultPosUnitAndPrice(
  cfg: PosSellConfig,
): { unit: PosSellUnitOption; level: PosSellPriceLevelOption; price: number } | null {
  for (const u of cfg.units) {
    const level = firstPosPriceLevelWithPrice(cfg, u.index)
    if (!level) continue
    const price = cfg.getUnitPrice(u.index, level.index)
    if (price > 0) return { unit: u, level, price }
  }
  return null
}

/**
 * ราคาตั้งต่อหน่วย (ก่อนลดแท็กช่วงราคา) — ใช้คู่กับโปร STL ตามยอดราคาตั้งรวม
 */
export function getPosListUnitPrice(productId: string, unitIndex: number, priceLevelIndex: number): number {
  return getPosSellConfig(productId).getListUnitPrice(unitIndex, priceLevelIndex)
}
