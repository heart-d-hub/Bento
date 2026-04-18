/* eslint-disable react-refresh/only-export-components */
import { type InventoryProduct } from '@/features/inventory/data/mockInventory'
import {
  getProductMasterById,
  getProductMasterBySku,
  masterPosDisplayNoteForSku,
  masterSearchExtrasForSku,
  posDisplayProductName,
  PRODUCT_MASTER_LIST_CHANGED_EVENT,
  productPosEligibleByInventorySku,
  type ProductMasterDetail,
} from '@/features/inventory/data/productMasterData'
import { PRODUCT_TAGS_CHANGED_EVENT } from '@/features/inventory/data/productTagsRegistry'
import type { PosCartLine } from '@/features/pos/data/posCartLineTypes'
import { posLineSubtotal } from '@/features/pos/data/posCartLineTotals'
import {
  cascadeRemoveStlBoltPairLine,
  insertBoltNutLinesForMale,
  syncStlBoltPairGifts,
} from '@/features/promotions/stlBoltPairCart'
import { getStlBoltPairForMaleProduct } from '@/features/promotions/stlBoltPairRegistry'
import { loadPercentOffPromotions } from '@/features/promotions/data/percentPromotionsStore'
import { loadPromotions, PROMOTIONS_CHANGED_EVENT } from '@/features/promotions/data/promotionsStore'
import { loadSecondPiecePromotions } from '@/features/promotions/data/secondPiecePromotionsStore'
import { matchingActivePercentPromos } from '@/features/promotions/evaluatePercentOff'
import { matchingActiveSecondPiecePromos } from '@/features/promotions/evaluateSecondPiece'
import {
  alreadyHasPromoGift,
  evaluateBuyQtyPromotions,
  type PromoEvaluationRow,
} from '@/features/promotions/evaluateBuyQty'
import { appendSale, POS_SALE_RECORDED_EVENT } from '@/features/pos/data/posSalesHistory'
import {
  deductBoxPieces,
  deductFullRolls,
  deductRollKg,
  deductStock,
  getBoxPieceStateForProduct,
  getRollStateForProduct,
  isBoxPieceProduct,
  LIVE_STOCK_CHANGED_EVENT,
  countFullRollsOnShelf,
  loadBoxPieceStock,
  loadLiveStock,
  loadRollStock,
  openFullRollAsNewPartial,
  posProductUsesRollShelfStock,
  posRollNominalForProduct,
  posRollNominalKgForProduct,
  saveBoxPieceStock,
  saveLiveStock,
  saveRollStock,
  totalKgFromRoll,
  totalPiecesFromBoxPiece,
  type BoxPieceStockState,
  type RollStockState,
} from '@/features/pos/data/posLiveStock'
import { isTauri } from '@/features/desktop/isTauri'
import { nextPosBillNumber, nextPosBillNumberForTodayAsync } from '@/features/pos/data/posBillSequence'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import {
  firstPosPriceLevelWithPrice,
  getPosListUnitPrice,
  getPosSellConfig,
  pickDefaultPosUnitAndPrice,
  type PosSellConfig,
} from '@/features/pos/data/posUnitPricing'
import {
  computeStlVolumePromo,
  getEffectiveStlVolumePromoSettings,
  isStlLadderLine,
  type StlPromoCartLine,
} from '@/features/promotions/stlVolumePromo'
import { STL_PROMO_SETTINGS_CHANGED_EVENT } from '@/features/promotions/stlVolumePromoSettings'
import { TAG_FORMULAS_CHANGED_EVENT } from '@/features/promotions/tagFormulaRegistry'
import type { PaymentMethodId } from '@/features/pos/data/placeholders'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

function posProductAllowedForSale(p: InventoryProduct): boolean {
  return productPosEligibleByInventorySku(p.sku)
}

export type { PosCartLine } from '@/features/pos/data/posCartLineTypes'

export const POS_BOLT_NUT_ADD_FAILED_EVENT = 'pos:bolt-nut-add-failed'

export type PosBoltNutAddFailedDetail = {
  title: string
  message: string
  miniWarning?: string
}

type PosCartContextValue = {
  /** แฟ้มมาสเตอร์ + mock — ใช้ resolve สินค้าตาม productId ใน UI */
  posCatalogProducts: InventoryProduct[]
  stockByProductId: Record<string, number>
  rollStockByProductId: Record<string, RollStockState>
  boxPieceStockByProductId: Record<string, BoxPieceStockState>
  lines: PosCartLine[]
  lineCount: number
  subtotal: number
  discountTotal: number
  grandTotal: number
  /** จำนวนที่ใช้แสดงคงเหลือตามหน่วยบรรทัด (ชิ้น / กก. / ม้วน / ∞ เมื่อคิดเมตร) */
  getAvailableForLine: (line: PosCartLine) => number
  /** จำนวนสูงสุดที่เพิ่มได้ด้วยหน่วยขายเริ่มต้นของสินค้า */
  getDefaultAddableQty: (productId: string) => number
  addProductById: (productId: string) => void
  addProductByIdWithQty: (productId: string, qty: number) => void
  addCustomChargeLine: (name: string, unitPrice: number, qty?: number) => void
  addAssemblySaleLine: (
    name: string,
    unitPrice: number,
    breakdown: { productId: string; qty: number }[],
    qty?: number,
    lineNote?: string,
  ) => void
  setLineUnit: (lineId: string, unitIndex: number) => void
  setLinePriceLevel: (lineId: string, priceLevelIndex: number) => void
  setLineQty: (lineId: string, qty: number) => void
  setLineStockDeductionKg: (lineId: string, kg: number) => void
  removeLine: (lineId: string) => void
  clearCart: () => void
  findProducts: (query: string) => InventoryProduct[]
  completeSale: (paymentId: PaymentMethodId) => Promise<{
    billNo: string
    total: number
    lines: PosCartLine[]
  }>
  lastCompletedBill: { billNo: string; total: number; at: string; lines: PosCartLine[] } | null
  clearLastBill: () => void
  /** เปิดม้วนเต็ม 1 ม้วน → เพิ่มเป็นม้วนเปิด (กก. ตาม nominal) */
  openFullRollToBench: (productId: string) => void
  /** ประเมินโปรซื้อครบแถม (ตามวันที่ปัจจุบัน) */
  promoEvaluations: PromoEvaluationRow[]
  /** ใส่บรรทัดของแถมตามโปร (ราคา 0) */
  applyPromotionGift: (promoId: string) => void
  /** น็อตตัวผู้ STL — เพิ่มบรรทัดตัวเมีย + แถมแหวนตาม min(ตัวผู้, ตัวเมีย) */
  addBoltNutLine: (maleLineId: string) => void
}

const PosCartContext = createContext<PosCartContextValue | null>(null)

function newLineId(): string {
  return `ln-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

/** ยอดรวมบรรทัดเมื่อฐานราคาเป็นยอดหลังโปร STL (ราคาตั้ง) แล้วค่อยทับด้วยโปร % / ชิ้นถัดไป */
function posLineSubtotalFromStlSellBase(l: PosCartLine, stlLineSubtotal: number): number {
  if (l.promoGift) return posLineSubtotal(l)
  if (stlLineSubtotal <= 0 || l.qty <= 0) return 0
  if (l.secondPiecePromoApplied) {
    const unit = stlLineSubtotal / Math.max(l.qty, 0.0001)
    const { fullPricePieces, percentOffAdditional } = l.secondPiecePromoApplied
    const fp = Math.min(l.qty, fullPricePieces)
    const extra = Math.max(0, l.qty - fullPricePieces)
    const unitExtra = roundMoney(unit * (1 - percentOffAdditional / 100))
    return roundMoney(fp * unit + extra * unitExtra)
  }
  let unit = stlLineSubtotal / Math.max(l.qty, 0.0001)
  if (l.percentPromoApplied) {
    unit = roundMoney(unit * (1 - l.percentPromoApplied.percentOff / 100))
  }
  return roundMoney(l.qty * unit)
}

function resolvePosLineMaster(
  l: PosCartLine,
  catalog: InventoryProduct[],
): ProductMasterDetail | undefined {
  const byId = getProductMasterById(l.productId)
  if (byId) return byId
  const cat = catalog.find((p) => p.id === l.productId)
  if (cat) return getProductMasterBySku(cat.sku)
  return undefined
}

/**
 * ยอดรวมบิล — บรรทัดที่มีแท็ก Bolt (ตามสูตร) ใช้โปร STL จากยอดราคาตั้งรวม;
 * บรรทัดอื่นใช้ posLineSubtotal ตามเดิม
 */
function computePosGrandTotal(lines: PosCartLine[], posCatalog: InventoryProduct[]): number {
  const selectedTagIds = getEffectiveStlVolumePromoSettings().selectedTagIds
  const stlInput: StlPromoCartLine[] = []
  const stlCartIndices: number[] = []

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (l.promoGift) continue
    const master = resolvePosLineMaster(l, posCatalog)
    if (!master) continue
    stlCartIndices.push(i)
    stlInput.push({
      productId: l.productId,
      qty: l.qty,
      listPricePerUnit: getPosListUnitPrice(l.productId, l.unitIndex, l.priceLevelIndex),
      master,
    })
  }

  if (stlInput.length === 0) {
    return roundMoney(lines.reduce((s, l) => s + posLineSubtotal(l), 0))
  }

  const { lineResults } = computeStlVolumePromo({ lines: stlInput, mode: 'retail' })
  const stlByLineId = new Map<string, { stlSell: boolean; sellSubtotal: number }>()
  for (let k = 0; k < lineResults.length; k++) {
    const line = lines[stlCartIndices[k]!]
    const master = stlInput[k]!.master
    stlByLineId.set(line.lineId, {
      stlSell: isStlLadderLine(master, selectedTagIds),
      sellSubtotal: lineResults[k]!.sellSubtotal,
    })
  }

  let total = 0
  for (const l of lines) {
    const meta = stlByLineId.get(l.lineId)
    if (meta?.stlSell) {
      total += posLineSubtotalFromStlSellBase(l, meta.sellSubtotal)
    } else {
      total += posLineSubtotal(l)
    }
  }
  return roundMoney(total)
}

/** โปรชิ้นถัดไปถูกลงมีลำดับก่อนโปรลด % ทุกชิ้น — สินค้า+หน่วยเดียวกันไม่ควรซ้ำหลายโปร */
function attachPricePromos(line: PosCartLine, opts: { silent: boolean }): PosCartLine {
  if (line.promoGift) {
    return { ...line, percentPromoApplied: undefined, secondPiecePromoApplied: undefined }
  }

  const secondPromos = loadSecondPiecePromotions()
  const secondMatches = matchingActiveSecondPiecePromos(
    line.productId,
    line.unitIndex,
    new Date(),
    secondPromos,
  )

  if (secondMatches.length > 1) {
    if (!opts.silent) {
      window.alert(
        `มีโปร "ซื้อชิ้นถัดไปถูกลง" ซ้ำสำหรับสินค้านี้หน่วยนี้ (${secondMatches.length} รายการ)\n\n${secondMatches.map((m) => `• ${m.name}`).join('\n')}\n\nจะไม่ใช้โปรนี้ — ให้เหลือโปรเดียวที่หน้าโปรโมชัน`,
      )
    }
  } else if (secondMatches.length === 1) {
    const m = secondMatches[0]
    const fp = Math.max(1, Math.floor(Number(m.fullPricePieces)) || 1)
    const po = Math.min(100, Math.max(0, Math.floor(Number(m.percentOffAdditional)) || 0))
    return {
      ...line,
      percentPromoApplied: undefined,
      secondPiecePromoApplied: {
        promoId: m.id,
        label: m.name,
        fullPricePieces: fp,
        percentOffAdditional: po,
      },
    }
  }

  const promos = loadPercentOffPromotions()
  const matches = matchingActivePercentPromos(line.productId, line.unitIndex, new Date(), promos)
  if (matches.length === 0) {
    return { ...line, percentPromoApplied: undefined, secondPiecePromoApplied: undefined }
  }
  if (matches.length > 1) {
    if (!opts.silent) {
      window.alert(
        `มีโปรลดราคาซ้ำหรือทับกันสำหรับสินค้านี้หน่วยนี้ (${matches.length} รายการ)\n\n${matches.map((m) => `• ${m.name} (${m.percentOff}%)`).join('\n')}\n\nจะไม่ลดราคาอัตโนมัติ — ให้เหลือโปรเดียวที่หน้าโปรโมชัน`,
      )
    }
    return { ...line, percentPromoApplied: undefined, secondPiecePromoApplied: undefined }
  }
  const m = matches[0]
  return {
    ...line,
    secondPiecePromoApplied: undefined,
    percentPromoApplied: { promoId: m.id, label: m.name, percentOff: m.percentOff },
  }
}

/** มีกก./ม้วนคงที่ในมาสเตอร์ — ใช้ร่วมโหมดขายแบบเมตร ฯลฯ */
function isKgRoll(p: InventoryProduct | undefined): p is InventoryProduct & {
  stockMode: 'kg_roll'
  nominalKgPerRoll: number
} {
  return p?.stockMode === 'kg_roll' && p.nominalKgPerRoll != null && p.nominalKgPerRoll > 0
}

function isMeterRoll(p: InventoryProduct | undefined): p is InventoryProduct & {
  stockMode: 'meter_roll'
  nominalMetersPerRoll: number
} {
  return p?.stockMode === 'meter_roll' && p.nominalMetersPerRoll != null && p.nominalMetersPerRoll > 0
}

function posRollLineStockMode(p: InventoryProduct): 'kg_roll' | 'meter_roll' {
  return p.stockMode === 'meter_roll' ? 'meter_roll' : 'kg_roll'
}

function unitMeta(cfg: PosSellConfig, unitIndex: number) {
  const u = cfg.units.find((x) => x.index === unitIndex) ?? cfg.units[0]
  const label = u?.label ?? 'ชิ้น'
  const isRoll = label === 'ม้วน'
  const isMeter = label === 'ม.'
  return { u: u!, label, isRoll, isMeter }
}

function availableAmount(
  p: InventoryProduct,
  piece: Record<string, number>,
  roll: Record<string, RollStockState>,
  box: Record<string, BoxPieceStockState>,
  unitIndex: number,
): number {
  const cfg = getPosSellConfig(p.id)
  const { isRoll, isMeter } = unitMeta(cfg, unitIndex)
  if (isBoxPieceProduct(p)) {
    const b = getBoxPieceStateForProduct(p, box)
    return totalPiecesFromBoxPiece(b, p.piecesPerBox!)
  }
  if (!posProductUsesRollShelfStock(p)) return piece[p.id] ?? 0
  const r = getRollStateForProduct(p, roll)
  const nominal = posRollNominalForProduct(p)
  if (isRoll) return countFullRollsOnShelf(r)
  if (isMeter) {
    if (isKgRoll(p)) return Number.POSITIVE_INFINITY
    if (isMeterRoll(p)) return totalKgFromRoll(r, p.nominalMetersPerRoll)
    return Number.POSITIVE_INFINITY
  }
  return totalKgFromRoll(r, nominal)
}

function linePosNote(p: InventoryProduct): string | undefined {
  const t = p.posDisplayNote?.trim()
  if (t) return t
  return masterPosDisplayNoteForSku(p.sku)
}

function buildLine(
  catalog: InventoryProduct[],
  productId: string,
  piece: Record<string, number>,
  roll: Record<string, RollStockState>,
  box: Record<string, BoxPieceStockState>,
  qty: number,
): PosCartLine | null {
  const p = catalog.find((x) => x.id === productId)
  if (!p) return null
  const note = linePosNote(p)
  const cfg = getPosSellConfig(productId)
  const picked = pickDefaultPosUnitAndPrice(cfg)
  if (!picked) return null
  const u = picked.unit
  const lv = picked.level
  const price = picked.price
  const avail = availableAmount(p, piece, roll, box, u.index)
  const meta = unitMeta(cfg, u.index)

  if (posProductUsesRollShelfStock(p)) {
    const rollMode = posRollLineStockMode(p)
    if (meta.isRoll) {
      if (avail < 1) return null
      return {
        lineId: newLineId(),
        productId: p.id,
        sku: p.sku,
        name: posDisplayProductName(p),
        qty: Math.min(Math.max(1, Math.floor(qty)), avail),
        unitPrice: price,
        unitLabel: u.label,
        unitIndex: u.index,
        unitBaseUnits: Math.max(1, u.baseUnits),
        priceLevelIndex: lv.index,
        priceLevelLabel: lv.label,
        stockMode: rollMode,
        priceByMeter: false,
        ...(note ? { posDisplayNote: note } : {}),
      }
    }
    const maxKg = avail
    if (maxKg < 0.01) return null
    const q = Math.min(Math.max(0.01, qty), Math.round(maxKg * 100) / 100)
    return {
      lineId: newLineId(),
      productId: p.id,
      sku: p.sku,
      name: posDisplayProductName(p),
      qty: q,
      unitPrice: price,
      unitLabel: u.label,
      unitIndex: u.index,
      unitBaseUnits: Math.max(1, u.baseUnits),
      priceLevelIndex: lv.index,
      priceLevelLabel: lv.label,
      stockMode: rollMode,
      priceByMeter: false,
      ...(note ? { posDisplayNote: note } : {}),
    }
  }

  const maxQty = Math.floor(avail / Math.max(1, u.baseUnits))
  if (maxQty < 1) return null
  return {
    lineId: newLineId(),
    productId: p.id,
    sku: p.sku,
    name: posDisplayProductName(p),
    qty: Math.min(Math.max(1, qty), maxQty),
    unitPrice: price,
    unitLabel: u.label,
    unitIndex: u.index,
    unitBaseUnits: Math.max(1, u.baseUnits),
    priceLevelIndex: lv.index,
    priceLevelLabel: lv.label,
    ...(note ? { posDisplayNote: note } : {}),
  }
}

function notifyBoltNutAddFailed(detail: PosBoltNutAddFailedDetail): void {
  window.dispatchEvent(new CustomEvent<PosBoltNutAddFailedDetail>(POS_BOLT_NUT_ADD_FAILED_EVENT, { detail }))
}

/** อธิบายเหตุที่ buildLine คืน null — ใช้แจ้งผู้ใช้ตอนกด +หัว (ตัวเมีย) */
function explainPosLineBuildFailure(
  catalog: InventoryProduct[],
  productId: string,
  piece: Record<string, number>,
  roll: Record<string, RollStockState>,
  box: Record<string, BoxPieceStockState>,
): PosBoltNutAddFailedDetail {
  const p = catalog.find((x) => x.id === productId)
  if (!p) {
    return {
      title: 'เพิ่มหัว (ตัวเมีย) ไม่สำเร็จ',
      message: `ไม่พบสินค้าหัวคู่ในรายการ POS (รหัส ${productId})\nตรวจ SKU คู่ในมาสเตอร์น็อตตัวผู้ให้ตรงกับสินค้าในแฟ้ม`,
    }
  }
  const cfg = getPosSellConfig(productId)
  const pickedNut = pickDefaultPosUnitAndPrice(cfg)
  if (!pickedNut) {
    return {
      title: 'เพิ่มหัว (ตัวเมีย) ไม่สำเร็จ',
      message: `ยังไม่ตั้งราคาขาย POS สำหรับหัวคู่\n${posDisplayProductName(p)} (${p.sku})`,
    }
  }
  const u = pickedNut.unit
  const avail = availableAmount(p, piece, roll, box, u.index)
  const meta = unitMeta(cfg, u.index)
  if (posProductUsesRollShelfStock(p)) {
    if (meta.isRoll && avail < 1) {
      return {
        title: 'สต็อกหัว (ตัวเมีย) ไม่พอ',
        message: `สต็อกหัวคู่ไม่พอ (ม้วน/กก.)\n${posDisplayProductName(p)} (${p.sku})`,
        miniWarning: `${posDisplayProductName(p)}(${p.sku}) เหลือ ${Math.max(0, Math.floor(avail))}`,
      }
    }
    if (!meta.isRoll && avail < 0.01) {
      return {
        title: 'สต็อกหัว (ตัวเมีย) ไม่พอ',
        message: `สต็อกหัวคู่ไม่พอ (กก.)\n${posDisplayProductName(p)} (${p.sku})`,
        miniWarning: `${posDisplayProductName(p)}(${p.sku}) เหลือ ${Math.max(0, Math.floor(avail * 100) / 100)}`,
      }
    }
    return {
      title: 'เพิ่มหัว (ตัวเมีย) ไม่สำเร็จ',
      message: `เพิ่มบรรทัดหัวคู่ไม่สำเร็จ\n${posDisplayProductName(p)} (${p.sku})`,
    }
  }
  const maxQty = Math.floor(avail / Math.max(1, u.baseUnits))
  if (maxQty < 1) {
    const unitHint =
      u.baseUnits > 1 ? `\nหน่วยขาย 1 ${u.label} ใช้ ${u.baseUnits} หน่วยฐาน — ต้องมีสต็อกฐานอย่างน้อย ${u.baseUnits}` : ''
    const boxHint = isBoxPieceProduct(p)
    return {
      title: 'สต็อกหัว (ตัวเมีย) ไม่พอ',
      message: `สต็อกหัวคู่ไม่พอ\n${posDisplayProductName(p)} (${p.sku}) — คงเหลือเทียบเท่า ${avail}${unitHint}${boxHint}`,
      miniWarning: `${posDisplayProductName(p)}(${p.sku}) เหลือ ${Math.max(0, Math.floor(avail))}`,
    }
  }
  return {
    title: 'เพิ่มหัว (ตัวเมีย) ไม่สำเร็จ',
    message: `เพิ่มบรรทัดหัวคู่ไม่สำเร็จ\n${posDisplayProductName(p)} (${p.sku})`,
  }
}

function buildGiftLine(
  catalog: InventoryProduct[],
  productId: string,
  piece: Record<string, number>,
  box: Record<string, BoxPieceStockState>,
  promo: { id: string; name: string },
  giftQty: number,
): PosCartLine | null {
  const p = catalog.find((x) => x.id === productId)
  if (!p || posProductUsesRollShelfStock(p)) return null
  const cfg = getPosSellConfig(productId)
  const u = cfg.units[0]
  const lv = cfg.priceLevels[0]
  const avail = isBoxPieceProduct(p)
    ? totalPiecesFromBoxPiece(getBoxPieceStateForProduct(p, box), p.piecesPerBox!)
    : piece[p.id] ?? 0
  const maxQty = Math.floor(avail / Math.max(1, u.baseUnits))
  if (maxQty < 1) return null
  const q = Math.min(Math.max(1, giftQty), maxQty)
  return {
    lineId: newLineId(),
    productId: p.id,
    sku: p.sku,
    name: posDisplayProductName(p),
    qty: q,
    unitPrice: 0,
    unitLabel: u.label,
    unitIndex: u.index,
    unitBaseUnits: Math.max(1, u.baseUnits),
    priceLevelIndex: lv.index,
    priceLevelLabel: lv.label,
    promoGift: { promoId: promo.id, label: promo.name },
  }
}

function normalizeSearchText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

function tokenizeQuery(q: string): string[] {
  return q
    .trim()
    .split(/\s+/g)
    .map((t) => normalizeSearchText(t))
    .filter(Boolean)
}

export function PosCartProvider({ children }: { children: ReactNode }) {
  const [stockByProductId, setStockByProductId] = useState<Record<string, number>>(() => loadLiveStock())
  const [rollStockByProductId, setRollStockByProductId] = useState<Record<string, RollStockState>>(() =>
    loadRollStock(),
  )
  const [boxPieceStockByProductId, setBoxPieceStockByProductId] = useState<Record<string, BoxPieceStockState>>(() =>
    loadBoxPieceStock(),
  )
  const [lines, setLines] = useState<PosCartLine[]>([])
  const [lastCompletedBill, setLastCompletedBill] = useState<{
    billNo: string
    total: number
    at: string
    lines: PosCartLine[]
  } | null>(null)
  const [promoTick, setPromoTick] = useState(0)
  /** รีเฟรชการค้นหา POS เมื่อแก้แฟ้มมาสเตอร์ (รุ่นรถ / OEM) */
  const [masterListTick, setMasterListTick] = useState(0)
  /** รีเฟรชยอดรวมโปร STL เมื่อแก้สูตรใน «จัดการแท็ก» หรือค่าเก่าใน localStorage */
  const [stlPromoTick, setStlPromoTick] = useState(0)

  const posCatalog = useMemo(() => getPosCatalogProducts(), [masterListTick])

  useEffect(() => {
    const h = () => setPromoTick((t) => t + 1)
    window.addEventListener(PROMOTIONS_CHANGED_EVENT, h)
    return () => window.removeEventListener(PROMOTIONS_CHANGED_EVENT, h)
  }, [])

  useEffect(() => {
    const bump = () => setStlPromoTick((t) => t + 1)
    window.addEventListener(TAG_FORMULAS_CHANGED_EVENT, bump)
    window.addEventListener(STL_PROMO_SETTINGS_CHANGED_EVENT, bump)
    return () => {
      window.removeEventListener(TAG_FORMULAS_CHANGED_EVENT, bump)
      window.removeEventListener(STL_PROMO_SETTINGS_CHANGED_EVENT, bump)
    }
  }, [])

  /** รีเฟรชราคาหน่วย (แท็ก / แฟ้มมาสเตอร์ / ระดับราคา) */
  useEffect(() => {
    const repriceLines = () => {
      setLines((prev) =>
        syncStlBoltPairGifts(
          prev.map((l) => {
            if (l.promoGift || l.sku === 'CUSTOM' || l.sku === 'ASSEMBLY') return l
            const cfg = getPosSellConfig(l.productId)
            let unitIndex = l.unitIndex
            let priceLevelIndex = l.priceLevelIndex
            let unitLabel = l.unitLabel
            let unitBaseUnits = l.unitBaseUnits
            let priceLevelLabel = l.priceLevelLabel
            let price = cfg.getUnitPrice(unitIndex, priceLevelIndex)
            if (price <= 0) {
              const pl = firstPosPriceLevelWithPrice(cfg, unitIndex)
              if (pl) {
                priceLevelIndex = pl.index
                priceLevelLabel = pl.label
                price = cfg.getUnitPrice(unitIndex, priceLevelIndex)
              }
            }
            if (price <= 0) {
              const pick = pickDefaultPosUnitAndPrice(cfg)
              if (!pick) return { ...l, unitPrice: 0 }
              unitIndex = pick.unit.index
              unitLabel = pick.unit.label
              unitBaseUnits = Math.max(1, pick.unit.baseUnits)
              priceLevelIndex = pick.level.index
              priceLevelLabel = pick.level.label
              price = pick.price
            }
            return attachPricePromos(
              {
                ...l,
                unitIndex,
                unitLabel,
                unitBaseUnits,
                priceLevelIndex,
                priceLevelLabel,
                unitPrice: price,
              },
              { silent: true },
            )
          }),
          stockByProductId,
        ),
      )
    }
    const onMaster = () => {
      setMasterListTick((t) => t + 1)
      repriceLines()
    }
    window.addEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, onMaster)
    window.addEventListener(PRODUCT_TAGS_CHANGED_EVENT, repriceLines)
    return () => {
      window.removeEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, onMaster)
      window.removeEventListener(PRODUCT_TAGS_CHANGED_EVENT, repriceLines)
    }
  }, [stockByProductId])

  useEffect(() => {
    const sync = () => {
      setStockByProductId(loadLiveStock())
      setRollStockByProductId(loadRollStock())
      setBoxPieceStockByProductId(loadBoxPieceStock())
    }
    window.addEventListener(LIVE_STOCK_CHANGED_EVENT, sync)
    return () => window.removeEventListener(LIVE_STOCK_CHANGED_EVENT, sync)
  }, [])

  useEffect(() => {
    setLines((prev) => {
      const synced = syncStlBoltPairGifts(prev, stockByProductId)
      return synced.map((l) => (l.promoGift ? l : attachPricePromos(l, { silent: true })))
    })
  }, [promoTick, stockByProductId])

  const promoEvaluations = useMemo(() => {
    const promotions = loadPromotions()
    return evaluateBuyQtyPromotions(lines, promotions, new Date(), stockByProductId)
  }, [lines, stockByProductId, promoTick])

  const applyPromotionGift = useCallback(
    (promoId: string) => {
      const promotions = loadPromotions()
      const promo = promotions.find((x) => x.id === promoId)
      if (!promo) return
      if (alreadyHasPromoGift(lines, promoId)) return
      const row = evaluateBuyQtyPromotions(lines, promotions, new Date(), stockByProductId).find(
        (r) => r.promo.id === promoId,
      )
      if (!row?.satisfied) return
      const gift = buildGiftLine(
        posCatalog,
        promo.giftProductId,
        stockByProductId,
        boxPieceStockByProductId,
        { id: promo.id, name: promo.name },
        promo.giftQty,
      )
      if (!gift) return
      setLines((prev) => syncStlBoltPairGifts([...prev, gift], stockByProductId))
    },
    [lines, stockByProductId, boxPieceStockByProductId, posCatalog],
  )

  const addBoltNutLine = useCallback(
    (maleLineId: string) => {
      setLines((prev) => {
        const male = prev.find((l) => l.lineId === maleLineId)
        if (!male || male.promoGift || male.stlBoltNutLineId) return syncStlBoltPairGifts(prev, stockByProductId)
        const pair = getStlBoltPairForMaleProduct(male.productId)
        if (!pair) {
          notifyBoltNutAddFailed({
            title: 'ยังไม่ตั้งคู่น็อต STL',
            message:
              'ยังไม่ตั้งคู่หัว/แหวนในมาสเตอร์สำหรับน็อตตัวผู้นี้\nกรอก SKU หัว (ตัวเมีย) และแหวนในคอลัมน์คู่ STL ที่แฟ้มมาสเตอร์ หรือเพิ่มในตารางสำรองโค้ด',
          })
          return syncStlBoltPairGifts(prev, stockByProductId)
        }
        const rawNut = buildLine(
          posCatalog,
          pair.nutProductId,
          stockByProductId,
          rollStockByProductId,
          boxPieceStockByProductId,
          Math.max(1, Math.floor(male.qty)),
        )
        if (!rawNut) {
          notifyBoltNutAddFailed(
            explainPosLineBuildFailure(
              posCatalog,
              pair.nutProductId,
              stockByProductId,
              rollStockByProductId,
              boxPieceStockByProductId,
            ),
          )
          return syncStlBoltPairGifts(prev, stockByProductId)
        }
        const nutLine: PosCartLine = {
          ...attachPricePromos(rawNut, { silent: false }),
          stlBoltMaleLineId: maleLineId,
          posDisplayNote: 'คู่กับน็อตตัวผู้',
        }
        const maleUp: PosCartLine = { ...male, stlBoltNutLineId: nutLine.lineId }
        const next = insertBoltNutLinesForMale(prev, maleLineId, nutLine, maleUp)
        return syncStlBoltPairGifts(next, stockByProductId)
      })
    },
    [stockByProductId, rollStockByProductId, boxPieceStockByProductId, posCatalog],
  )

  const getAvailableForLine = useCallback(
    (line: PosCartLine) => {
      const p = posCatalog.find((x) => x.id === line.productId)
      if (!p) return 0
      return availableAmount(p, stockByProductId, rollStockByProductId, boxPieceStockByProductId, line.unitIndex)
    },
    [stockByProductId, rollStockByProductId, boxPieceStockByProductId, posCatalog],
  )

  const getDefaultAddableQty = useCallback(
    (productId: string) => {
      const p = posCatalog.find((x) => x.id === productId)
      if (!p) return 0
      const cfg = getPosSellConfig(productId)
      const picked = pickDefaultPosUnitAndPrice(cfg)
      if (!picked) return 0
      const u = picked.unit
      const avail = availableAmount(p, stockByProductId, rollStockByProductId, boxPieceStockByProductId, u.index)
      const meta = unitMeta(cfg, u.index)

      if (posProductUsesRollShelfStock(p)) {
        if (meta.isRoll) return Math.max(0, Math.floor(avail))
        const maxKg = Math.round(Math.max(0, avail) * 1000) / 1000
        return maxKg < 0.01 ? 0 : maxKg
      }
      return Math.max(0, Math.floor(avail / Math.max(1, u.baseUnits)))
    },
    [stockByProductId, rollStockByProductId, boxPieceStockByProductId, posCatalog],
  )

  const findProducts = useCallback((query: string) => {
    const tokens = tokenizeQuery(query)
    const base =
      tokens.length === 0
        ? posCatalog
        : posCatalog.filter((p) => {
            const hay = normalizeSearchText(
              [
                p.sku,
                p.name,
                p.posDisplayNote ?? masterPosDisplayNoteForSku(p.sku) ?? '',
                p.factoryOem,
                p.genuineNo,
                p.carBrand ?? '',
                p.carModelLabel ?? '',
                p.yearLabel ?? '',
                masterSearchExtrasForSku(p.sku),
              ]
                .filter(Boolean)
                .join(' '),
            )
            return tokens.every((t) => hay.includes(t))
          })
    /** ของแถม — ไม่ให้ค้นหาเพิ่มเป็นบรรทางขายปกติ (ใช้ปุ่มโปรเท่านั้น) */
    return base
      .filter((p) => p.id !== 'p-gift-shirt' && p.id !== 'p-stl-washer-14')
      .filter(posProductAllowedForSale)
      .slice(0, 24)
  }, [masterListTick, posCatalog])

  const addProductById = useCallback(
    (productId: string) => {
      const p = posCatalog.find((x) => x.id === productId)
      if (!p) return
      if (!posProductAllowedForSale(p)) return
      const lineTemplate = buildLine(posCatalog, p.id, stockByProductId, rollStockByProductId, boxPieceStockByProductId, 1)
      if (!lineTemplate) return

      setLines((prev) => {
        const idx = prev.findIndex(
          (l) =>
            l.productId === p.id &&
            l.unitIndex === lineTemplate.unitIndex &&
            l.priceLevelIndex === lineTemplate.priceLevelIndex &&
            !!l.priceByMeter === !!lineTemplate.priceByMeter,
        )
        if (idx >= 0) {
          const next = [...prev]
          const line = next[idx]
          const cfg = getPosSellConfig(p.id)
          const meta = unitMeta(cfg, line.unitIndex)
          const avail = availableAmount(
            p,
            stockByProductId,
            rollStockByProductId,
            boxPieceStockByProductId,
            line.unitIndex,
          )
          if (meta.isRoll) {
            const maxAdd = avail - line.qty
            if (maxAdd < 1) return syncStlBoltPairGifts(prev, stockByProductId)
            next[idx] = { ...line, qty: line.qty + 1 }
            return syncStlBoltPairGifts(next, stockByProductId)
          }
          if (
            (line.stockMode === 'kg_roll' || line.stockMode === 'meter_roll') &&
            line.priceByMeter
          ) {
            return syncStlBoltPairGifts([...prev, attachPricePromos(lineTemplate, { silent: false })], stockByProductId)
          }
          if (
            (line.stockMode === 'kg_roll' || line.stockMode === 'meter_roll') &&
            !line.priceByMeter
          ) {
            const maxQ = avail
            const step = 1
            const newQty = Math.min(maxQ, line.qty + step)
            if (newQty <= line.qty) return syncStlBoltPairGifts(prev, stockByProductId)
            next[idx] = { ...line, qty: newQty }
            return syncStlBoltPairGifts(next, stockByProductId)
          }
          const maxAdd = Math.floor(avail / Math.max(1, line.unitBaseUnits)) - line.qty
          if (maxAdd < 1) return syncStlBoltPairGifts(prev, stockByProductId)
          next[idx] = { ...line, qty: line.qty + 1 }
          return syncStlBoltPairGifts(next, stockByProductId)
        }
        return syncStlBoltPairGifts(
          [...prev, attachPricePromos(lineTemplate, { silent: false })],
          stockByProductId,
        )
      })
    },
    [stockByProductId, rollStockByProductId, boxPieceStockByProductId, posCatalog],
  )

  const addProductByIdWithQty = useCallback(
    (productId: string, qty: number) => {
      if (!Number.isFinite(qty) || qty <= 0) return
      const p = posCatalog.find((x) => x.id === productId)
      if (!p) return
      if (!posProductAllowedForSale(p)) return
      const lineTemplate = buildLine(posCatalog, p.id, stockByProductId, rollStockByProductId, boxPieceStockByProductId, qty)
      if (!lineTemplate) return

      setLines((prev) => {
        const idx = prev.findIndex(
          (l) =>
            l.productId === p.id &&
            l.unitIndex === lineTemplate.unitIndex &&
            l.priceLevelIndex === lineTemplate.priceLevelIndex &&
            !!l.priceByMeter === !!lineTemplate.priceByMeter,
        )
        if (idx < 0) {
          return syncStlBoltPairGifts([...prev, attachPricePromos(lineTemplate, { silent: false })], stockByProductId)
        }

        const next = [...prev]
        const line = next[idx]
        const cfg = getPosSellConfig(p.id)
        const meta = unitMeta(cfg, line.unitIndex)
        const avail = availableAmount(
          p,
          stockByProductId,
          rollStockByProductId,
          boxPieceStockByProductId,
          line.unitIndex,
        )

        if (meta.isRoll) {
          const add = Math.max(1, Math.floor(qty))
          const newQty = Math.min(avail, line.qty + add)
          if (newQty <= line.qty) return syncStlBoltPairGifts(prev, stockByProductId)
          next[idx] = { ...line, qty: newQty }
          return syncStlBoltPairGifts(next, stockByProductId)
        }

        if (
          (line.stockMode === 'kg_roll' || line.stockMode === 'meter_roll') &&
          line.priceByMeter
        ) {
          return syncStlBoltPairGifts([...prev, attachPricePromos(lineTemplate, { silent: false })], stockByProductId)
        }

        if (
          (line.stockMode === 'kg_roll' || line.stockMode === 'meter_roll') &&
          !line.priceByMeter
        ) {
          const add = Math.max(0.001, qty)
          const newQty = Math.round(Math.min(avail, line.qty + add) * 1000) / 1000
          if (newQty <= line.qty) return syncStlBoltPairGifts(prev, stockByProductId)
          next[idx] = { ...line, qty: newQty }
          return syncStlBoltPairGifts(next, stockByProductId)
        }

        const add = Math.max(1, Math.floor(qty))
        const max = Math.floor(avail / Math.max(1, line.unitBaseUnits))
        const newQty = Math.min(max, line.qty + add)
        if (newQty <= line.qty) return syncStlBoltPairGifts(prev, stockByProductId)
        next[idx] = { ...line, qty: newQty }
        return syncStlBoltPairGifts(next, stockByProductId)
      })
    },
    [stockByProductId, rollStockByProductId, boxPieceStockByProductId, posCatalog],
  )

  const addCustomChargeLine = useCallback((name: string, unitPrice: number, qty = 1) => {
    const title = name.trim()
    if (!title) return
    const price = Math.max(0, Number(unitPrice) || 0)
    const amount = Math.max(0.001, Number(qty) || 1)
    const line: PosCartLine = {
      lineId: newLineId(),
      productId: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sku: 'CUSTOM',
      name: title,
      qty: amount,
      unitPrice: price,
      unitLabel: 'รายการ',
      unitIndex: 0,
      unitBaseUnits: 1,
      priceLevelIndex: 0,
      priceLevelLabel: 'กำหนดเอง',
    }
    setLines((prev) => syncStlBoltPairGifts([...prev, line], stockByProductId))
  }, [stockByProductId])

  const addAssemblySaleLine = useCallback(
    (
      name: string,
      unitPrice: number,
      breakdown: { productId: string; qty: number }[],
      qty = 1,
      lineNote?: string,
    ) => {
      const title = name.trim()
      const parts = breakdown
        .map((x) => ({ productId: x.productId, qty: Math.max(0, Number(x.qty) || 0) }))
        .filter((x) => x.qty > 0)
      if (!title || parts.length === 0) return
      const price = Math.max(0, Number(unitPrice) || 0)
      const amount = Math.max(0.001, Number(qty) || 1)
      const note = lineNote?.trim()
      const line: PosCartLine = {
        lineId: newLineId(),
        productId: `assembly-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sku: 'ASSEMBLY',
        name: title,
        qty: amount,
        unitPrice: price,
        unitLabel: 'ชุด',
        unitIndex: 0,
        unitBaseUnits: 1,
        priceLevelIndex: 0,
        priceLevelLabel: 'สูตรประกอบ',
        stockBreakdown: parts,
        ...(note ? { posDisplayNote: note } : {}),
      }
      setLines((prev) => syncStlBoltPairGifts([...prev, line], stockByProductId))
    },
    [stockByProductId],
  )

  const setLineUnit = useCallback(
    (lineId: string, unitIndex: number) => {
      setLines((prev) => {
        const line = prev.find((l) => l.lineId === lineId)
        if (!line) return syncStlBoltPairGifts(prev, stockByProductId)
        if (line.promoGift) return syncStlBoltPairGifts(prev, stockByProductId)
        const p = posCatalog.find((x) => x.id === line.productId)
        if (!p) return syncStlBoltPairGifts(prev, stockByProductId)
        const cfg = getPosSellConfig(line.productId)
        const u = cfg.units[unitIndex] ?? cfg.units[0]
        const keepLevel =
          cfg.getUnitPrice(u.index, line.priceLevelIndex) > 0
            ? cfg.priceLevels.find((x) => x.index === line.priceLevelIndex)
            : undefined
        const lv = keepLevel ?? firstPosPriceLevelWithPrice(cfg, u.index)
        if (!lv) return syncStlBoltPairGifts(prev, stockByProductId)
        const price = cfg.getUnitPrice(u.index, lv.index)
        if (price <= 0) return syncStlBoltPairGifts(prev, stockByProductId)
        const avail = availableAmount(p, stockByProductId, rollStockByProductId, boxPieceStockByProductId, u.index)
        const meta = unitMeta(cfg, u.index)
        if (meta.isRoll && avail < 1) {
          return syncStlBoltPairGifts(prev.filter((l) => l.lineId !== lineId), stockByProductId)
        }

        const priceByMeter = isKgRoll(p) && meta.isMeter
        let nextQty = line.qty
        if (meta.isRoll) nextQty = Math.min(Math.max(1, Math.floor(line.qty)), avail)
        else if (priceByMeter) nextQty = 1
        else if (posProductUsesRollShelfStock(p)) nextQty = Math.min(1, avail)
        else nextQty = Math.min(Math.max(1, Math.floor(line.qty)), Math.floor(avail / Math.max(1, u.baseUnits)))

        const mapped = prev.map((l) => {
          if (l.lineId !== lineId) return l
          const updated: PosCartLine = {
            ...l,
            qty: nextQty,
            unitIndex: u.index,
            unitLabel: u.label,
            unitBaseUnits: Math.max(1, u.baseUnits),
            unitPrice: price,
            priceLevelIndex: lv.index,
            priceLevelLabel: lv.label,
            priceByMeter,
            stockDeductionKg: priceByMeter ? undefined : l.stockDeductionKg,
          }
          return attachPricePromos(updated, { silent: false })
        })
        return syncStlBoltPairGifts(mapped, stockByProductId)
      })
    },
    [stockByProductId, rollStockByProductId, boxPieceStockByProductId, posCatalog],
  )

  const setLinePriceLevel = useCallback((lineId: string, priceLevelIndex: number) => {
    setLines((prev) => {
      const line = prev.find((l) => l.lineId === lineId)
      if (!line) return syncStlBoltPairGifts(prev, stockByProductId)
      if (line.promoGift) return syncStlBoltPairGifts(prev, stockByProductId)
      const cfg = getPosSellConfig(line.productId)
      const u = cfg.units[line.unitIndex] ?? cfg.units[0]
      const lv = cfg.priceLevels[priceLevelIndex] ?? cfg.priceLevels[0]
      const price = cfg.getUnitPrice(u.index, lv.index)
      if (price <= 0) return syncStlBoltPairGifts(prev, stockByProductId)
      const mapped = prev.map((l) =>
        l.lineId === lineId
          ? attachPricePromos({ ...l, unitPrice: price, priceLevelIndex: lv.index, priceLevelLabel: lv.label }, {
              silent: false,
            })
          : l,
      )
      return syncStlBoltPairGifts(mapped, stockByProductId)
    })
  }, [stockByProductId])

  const setLineQty = useCallback(
    (lineId: string, qty: number) => {
      if (!Number.isFinite(qty)) return
      setLines((prev) => {
        const line = prev.find((l) => l.lineId === lineId)
        if (!line) return syncStlBoltPairGifts(prev, stockByProductId)
        const p = posCatalog.find((x) => x.id === line.productId)
        if (!p) return syncStlBoltPairGifts(prev, stockByProductId)
        const cfg = getPosSellConfig(line.productId)
        const avail = availableAmount(
          p,
          stockByProductId,
          rollStockByProductId,
          boxPieceStockByProductId,
          line.unitIndex,
        )
        const meta = unitMeta(cfg, line.unitIndex)

        if (meta.isRoll) {
          const q = Math.max(0, Math.floor(qty))
          const capped = Math.min(q, avail)
          const mapped = prev.map((l) => (l.lineId === lineId ? { ...l, qty: capped } : l))
          return syncStlBoltPairGifts(mapped, stockByProductId)
        }

        if (
          (line.stockMode === 'kg_roll' || line.stockMode === 'meter_roll') &&
          line.priceByMeter
        ) {
          const q = Math.max(0, qty)
          const mapped = prev.map((l) => (l.lineId === lineId ? { ...l, qty: q } : l))
          return syncStlBoltPairGifts(mapped, stockByProductId)
        }

        if (
          (line.stockMode === 'kg_roll' || line.stockMode === 'meter_roll') &&
          !line.priceByMeter
        ) {
          const q = Math.max(0, qty)
          const capped = Math.min(q, avail)
          const rounded = Math.round(capped * 1000) / 1000
          const mapped = prev.map((l) => (l.lineId === lineId ? { ...l, qty: rounded } : l))
          return syncStlBoltPairGifts(mapped, stockByProductId)
        }

        const q = Math.max(0, Math.floor(qty))
        const capped = Math.min(q, Math.floor(avail / Math.max(1, line.unitBaseUnits)))
        const mapped = prev.map((l) => (l.lineId === lineId ? { ...l, qty: capped } : l))
        return syncStlBoltPairGifts(mapped, stockByProductId)
      })
    },
    [stockByProductId, rollStockByProductId, boxPieceStockByProductId, posCatalog],
  )

  const setLineStockDeductionKg = useCallback(
    (lineId: string, kg: number) => {
      setLines((prev) => {
        const line = prev.find((l) => l.lineId === lineId)
        if (!line || !line.priceByMeter) return prev
        const p = posCatalog.find((x) => x.id === line.productId)
        if (!p || !isKgRoll(p)) return prev
        const avail = totalKgFromRoll(
          getRollStateForProduct(p, rollStockByProductId),
          posRollNominalKgForProduct(p),
        )
        const v = Math.max(0, Math.round(kg * 1000) / 1000)
        const capped = Math.min(v, avail)
        return prev.map((l) => (l.lineId === lineId ? { ...l, stockDeductionKg: capped } : l))
      })
    },
    [rollStockByProductId, posCatalog],
  )

  const removeLine = useCallback(
    (lineId: string) => {
      setLines((prev) => {
        const after = cascadeRemoveStlBoltPairLine(lineId, prev)
        return syncStlBoltPairGifts(after, stockByProductId)
      })
    },
    [stockByProductId],
  )

  const clearCart = useCallback(() => setLines([]), [])

  const grandTotal = useMemo(
    () => computePosGrandTotal(lines, posCatalog),
    [lines, posCatalog, stlPromoTick],
  )
  const subtotal = useMemo(
    () =>
      roundMoney(
        lines.reduce((s, l) => {
          if (l.promoGift) return s
          return s + roundMoney(l.qty * l.unitPrice)
        }, 0),
      ),
    [lines],
  )
  const discountTotal = useMemo(() => roundMoney(subtotal - grandTotal), [subtotal, grandTotal])
  const lineCount = useMemo(() => lines.length, [lines])

  const completeSale = useCallback(
    async (paymentId: PaymentMethodId) => {
      if (lines.length === 0 || grandTotal <= 0) {
        throw new Error('empty')
      }
      const linesSnapshot = [...lines]
      const total = grandTotal
      const billNo = isTauri() ? await nextPosBillNumberForTodayAsync() : nextPosBillNumber()

      const pieceDeductions: { productId: string; qty: number }[] = []
      let nextRoll = { ...rollStockByProductId }
      let nextPiece = { ...stockByProductId }
      let nextBox = { ...boxPieceStockByProductId }

      for (const l of linesSnapshot) {
        if (l.stockBreakdown && l.stockBreakdown.length > 0) {
          for (const b of l.stockBreakdown) {
            pieceDeductions.push({
              productId: b.productId,
              qty: b.qty * Math.max(0, l.qty),
            })
          }
          continue
        }
        const p = posCatalog.find((x) => x.id === l.productId)
        if (!p) continue

        if (isBoxPieceProduct(p)) {
          try {
            nextBox = deductBoxPieces(
              nextBox,
              l.productId,
              l.qty * Math.max(1, l.unitBaseUnits),
              p.piecesPerBox!,
            )
          } catch {
            throw new Error('stock')
          }
          continue
        }

        if (!posProductUsesRollShelfStock(p)) {
          pieceDeductions.push({ productId: l.productId, qty: l.qty * Math.max(1, l.unitBaseUnits) })
          continue
        }

        const cfg = getPosSellConfig(l.productId)
        const meta = unitMeta(cfg, l.unitIndex)
        const nominal = posRollNominalForProduct(p)

        try {
          if (meta.isRoll) {
            nextRoll = deductFullRolls(nextRoll, l.productId, Math.floor(l.qty))
          } else if (l.priceByMeter) {
            const kg = l.stockDeductionKg ?? 0
            if (kg <= 0) throw new Error('meter-kg')
            nextRoll = deductRollKg(nextRoll, l.productId, kg, nominal)
          } else {
            nextRoll = deductRollKg(nextRoll, l.productId, l.qty, nominal)
          }
        } catch (err) {
          if (err instanceof Error && err.message === 'meter-kg') throw err
          throw new Error('stock')
        }
      }

      try {
        nextPiece = deductStock(nextPiece, pieceDeductions)
      } catch {
        throw new Error('stock')
      }

      saveLiveStock(nextPiece)
      saveRollStock(nextRoll)
      saveBoxPieceStock(nextBox)
      setStockByProductId(nextPiece)
      setRollStockByProductId(nextRoll)
      setBoxPieceStockByProductId(nextBox)

      appendSale({
        billNo,
        at: new Date().toISOString(),
        total,
        paymentId,
        lineCount: linesSnapshot.length,
        lines: linesSnapshot.map((l) => {
          const baseName = l.promoGift
            ? `${l.name} [แถมโปร: ${l.promoGift.label}]${l.unitLabel ? ` [${l.unitLabel}]` : ''}`
            : `${l.name}${l.posDisplayNote ? ` — ${l.posDisplayNote}` : ''}${l.unitLabel ? ` [${l.unitLabel}]` : ''}${l.priceByMeter && l.stockDeductionKg ? ` (${l.stockDeductionKg} กก.)` : ''}`
          let name = baseName
          if (!l.promoGift && l.percentPromoApplied) {
            name = `${baseName} [ลด ${l.percentPromoApplied.percentOff}%: ${l.percentPromoApplied.label}]`
          } else if (!l.promoGift && l.secondPiecePromoApplied) {
            const sp = l.secondPiecePromoApplied
            name = `${baseName} [ชิ้นถัดไปลด ${sp.percentOffAdditional}%: ${sp.label}]`
          }
          let unitPriceForReceipt = l.unitPrice
          if (!l.promoGift && l.percentPromoApplied) {
            unitPriceForReceipt = roundMoney(l.unitPrice * (1 - l.percentPromoApplied.percentOff / 100))
          } else if (!l.promoGift && l.secondPiecePromoApplied && l.qty > 0) {
            unitPriceForReceipt = roundMoney(posLineSubtotal(l) / l.qty)
          }
          return { productId: l.productId, sku: l.sku, name, qty: l.qty, unitPrice: unitPriceForReceipt }
        }),
      })
      window.dispatchEvent(new CustomEvent(POS_SALE_RECORDED_EVENT))
      setLastCompletedBill({
        billNo,
        total,
        at: new Date().toLocaleString('th-TH'),
        lines: linesSnapshot,
      })
      setLines([])
      return { billNo, total, lines: linesSnapshot }
    },
    [lines, grandTotal, stockByProductId, rollStockByProductId, boxPieceStockByProductId, posCatalog],
  )

  const clearLastBill = useCallback(() => setLastCompletedBill(null), [])

  const openFullRollToBench = useCallback(
    (productId: string) => {
      const p = posCatalog.find((x) => x.id === productId)
      if (!p || !posProductUsesRollShelfStock(p)) return
      try {
        const next = openFullRollAsNewPartial(
          rollStockByProductId,
          productId,
          Math.max(0.001, posRollNominalForProduct(p)),
        )
        saveRollStock(next)
        setRollStockByProductId(next)
        window.dispatchEvent(new CustomEvent(POS_SALE_RECORDED_EVENT))
      } catch {
        window.alert('ไม่มีม้วนเต็มให้เปิด หรือข้อมูลสินค้าไม่ครบ')
      }
    },
    [rollStockByProductId, posCatalog],
  )

  const value = useMemo(
    () => ({
      posCatalogProducts: posCatalog,
      stockByProductId,
      rollStockByProductId,
      boxPieceStockByProductId,
      lines,
      lineCount,
      subtotal,
      discountTotal,
      grandTotal,
      getAvailableForLine,
      getDefaultAddableQty,
      addProductById,
      addProductByIdWithQty,
      addCustomChargeLine,
      addAssemblySaleLine,
      setLineUnit,
      setLinePriceLevel,
      setLineQty,
      setLineStockDeductionKg,
      removeLine,
      clearCart,
      findProducts,
      completeSale,
      lastCompletedBill,
      clearLastBill,
      openFullRollToBench,
      promoEvaluations,
      applyPromotionGift,
      addBoltNutLine,
    }),
    [
      posCatalog,
      stockByProductId,
      rollStockByProductId,
      boxPieceStockByProductId,
      lines,
      lineCount,
      subtotal,
      grandTotal,
      discountTotal,
      getAvailableForLine,
      getDefaultAddableQty,
      addProductById,
      addProductByIdWithQty,
      addCustomChargeLine,
      addAssemblySaleLine,
      setLineUnit,
      setLinePriceLevel,
      setLineQty,
      setLineStockDeductionKg,
      removeLine,
      clearCart,
      findProducts,
      completeSale,
      lastCompletedBill,
      clearLastBill,
      openFullRollToBench,
      promoEvaluations,
      applyPromotionGift,
      addBoltNutLine,
    ],
  )

  return <PosCartContext.Provider value={value}>{children}</PosCartContext.Provider>
}

export function usePosCart(): PosCartContextValue {
  const ctx = useContext(PosCartContext)
  if (!ctx) throw new Error('usePosCart must be used within PosCartProvider')
  return ctx
}
