import {
  getProductMasterById,
  getProductMasterList,
  saveProductMasterList,
  type ProductMasterDetail,
} from '@/features/inventory/data/productMasterData'
import type { InventoryProduct } from '@/features/inventory/data/mockInventory'
import { mergeInventoryProductsWithLiveStock } from '@/features/pos/data/posLiveStock'
import type { PoVatMode } from '@/features/purchase/data/poTypes'
import { getVatRegistered } from '@/features/settings/data/storeProfileStore'
import { loadCostingMethod } from '@/features/settings/data/costingMethodStore'

/**
 * คำนวณต้นทุนต่อหน่วยที่ถูกต้องสำหรับบันทึก moving average
 *
 * จดทะเบียน VAT:
 *   vat_included → หาร (1 + rate%) เพื่อได้ราคาก่อน VAT  (VAT ขอคืนได้)
 *   vat_excluded / no_vat → ใช้ราคาตรงๆ
 *
 * ไม่จดทะเบียน VAT:
 *   vat_excluded → คูณ (1 + rate%) เพราะ VAT กลายเป็นต้นทุน
 *   vat_included / no_vat → ใช้ราคาตรงๆ (จ่ายจริงเท่านี้)
 */
export function stripVatFromUnitCost(unitCost: number, vatMode: PoVatMode | undefined, vatRatePercent: number): number {
  const mode = vatMode ?? 'excluded'
  const rate = vatRatePercent > 0 ? vatRatePercent : 0
  if (rate === 0) return unitCost
  const vatRegistered = getVatRegistered()
  if (vatRegistered) {
    if (mode === 'included') {
      return Math.round((unitCost / (1 + rate / 100)) * 10000) / 10000
    }
    return unitCost
  } else {
    if (mode === 'excluded') {
      return Math.round(unitCost * (1 + rate / 100) * 10000) / 10000
    }
    return unitCost
  }
}

const MOCK_AVG_LS = 'bento.purchase.mockAvgCost.v1'

function loadMockAvg(): Record<string, number> {
  try {
    const raw = localStorage.getItem(MOCK_AVG_LS)
    if (!raw) return {}
    const o = JSON.parse(raw) as unknown
    if (o && typeof o === 'object' && !Array.isArray(o)) return o as Record<string, number>
  } catch { /* ignore */ }
  return {}
}

function saveMockAvg(m: Record<string, number>): void {
  try {
    localStorage.setItem(MOCK_AVG_LS, JSON.stringify(m))
  } catch { /* ignore */ }
}

/** สต็อกปัจจุบัน ณ เวลาที่กำลังรับ (ก่อนบวกของเพิ่ม) */
export function getOnHandQtyBeforeReceive(p: InventoryProduct): number {
  const [m] = mergeInventoryProductsWithLiveStock([p])
  return Math.max(0, m.stock)
}

/**
 * ต้นทุนที่ใช้แสดงผล/แนะนำใน PO line ใหม่ ตามวิธีที่เลือก
 * average → avgCost, latest → lastCost (ราคา PO receive ล่าสุด)
 * fallback ลำดับ: supplierListPrice → costing method cost → costPrice
 */
export function getActiveCost(m: ProductMasterDetail): number {
  if ((m.supplierListPrice ?? 0) > 0) return round2(m.supplierListPrice!)
  const method = loadCostingMethod()
  if (method === 'latest') {
    const c = (m.lastCost ?? 0) > 0 ? m.lastCost! : m.avgCost > 0 ? m.avgCost : m.costPrice
    return round2(Math.max(0, c))
  }
  const c = m.avgCost > 0 ? m.avgCost : m.costPrice
  return round2(Math.max(0, c))
}

export function getLatestUnitCostForPo(p: InventoryProduct): number {
  const m = getProductMasterById(p.id)
  if (m) return getActiveCost(m)
  const overlay = loadMockAvg()[p.id]
  return overlay != null && overlay > 0 ? round2(overlay) : 0
}

/**
 * อัปเดตต้นทุนเฉลี่ยถ่วงน้ำหนัก (Moving Average) หลังรับสินค้า
 *
 * กฎการคำนวณ:
 *   - ถ้ายังไม่มีต้นทุนเดิม (avgCost = 0 และ costPrice = 0)
 *     → ใช้ราคารับครั้งนี้โดยตรง ไม่เฉลี่ยกับสต็อกเดิมที่ไม่รู้ราคา
 *   - ถ้ามีต้นทุนเดิม
 *     → คำนวณ (สต็อกเดิม × ราคาเดิม + จำนวนรับ × ราคารับ) / (สต็อกเดิม + จำนวนรับ)
 *
 * @param newSupplierListPrice ถ้าส่งมา (> 0) จะอัปเดต supplierListPrice ในมาสเตอร์ด้วย
 *   — ควรส่งเฉพาะเมื่อ PO line มี listPrice ที่ user ตั้งเองในแผงโปร
 */
export function applyMovingAverageCost(
  productId: string,
  addQty: number,
  addUnitCost: number,
  catalogProduct: InventoryProduct,
  newSupplierListPrice?: number,
): void {
  const add = Math.max(0, addQty)
  const cost = Math.max(0, addUnitCost)
  if (add <= 0) return

  const list = getProductMasterList()
  const idx = list.findIndex((x) => x.id === productId)

  if (idx >= 0) {
    const cur = list[idx]!
    const prevAvg = cur.avgCost > 0 ? cur.avgCost : cur.costPrice

    const newAvg = prevAvg > 0
      ? weightedAvg(getOnHandQtyBeforeReceive(catalogProduct), prevAvg, add, cost)
      : cost  // ไม่มีต้นทุนเดิม → ใช้ราคารับโดยตรง

    const rounded = round2(Math.max(0, newAvg))
    const lastCost = round2(cost)
    const slp = (newSupplierListPrice ?? 0) > 0 ? round2(newSupplierListPrice!) : cur.supplierListPrice

    const next: ProductMasterDetail = { ...cur, avgCost: rounded, costPrice: rounded, lastCost, supplierListPrice: slp }
    const copy = [...list]
    copy[idx] = next
    saveProductMasterList(copy)
    return
  }

  // สินค้าไม่มีในมาสเตอร์ — บันทึก overlay แทน
  const map = loadMockAvg()
  const prev = map[productId] ?? 0
  const newAvg = prev > 0
    ? weightedAvg(getOnHandQtyBeforeReceive(catalogProduct), prev, add, cost)
    : cost
  map[productId] = round2(Math.max(0, newAvg))
  saveMockAvg(map)
}

export const PRODUCT_PROMO_CHANGED_EVENT = 'bento-product-promo-changed'

/**
 * บันทึกโปรซื้อล่าสุดลงมาสเตอร์ — เรียกเมื่อปิดแผงโปร
 * ค่า undefined หมายความว่า field นั้นถูกเคลียร์
 */
export function savePoLastPromo(
  productId: string,
  listPrice: number | undefined,
  discountChain: string | undefined,
  bonusPaidQty: number | undefined,
  bonusFreeQty: number | undefined,
  bonusPct?: number,
): void {
  const list = getProductMasterList()
  const idx = list.findIndex((x) => x.id === productId)
  if (idx < 0) return
  const cur = list[idx]!
  const slp = (listPrice ?? 0) > 0 ? round2(listPrice!) : cur.supplierListPrice
  const copy = [...list]
  copy[idx] = {
    ...cur,
    supplierListPrice: slp,
    poLastDiscountChain: discountChain,
    poLastBonusPaid: bonusPaidQty,
    poLastBonusFree: bonusFreeQty,
    poLastBonusPct: bonusPct,
  }
  saveProductMasterList(copy)
  try { window.dispatchEvent(new CustomEvent(PRODUCT_PROMO_CHANGED_EVENT)) } catch { /* ignore */ }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function weightedAvg(onHand: number, prevCost: number, addQty: number, addCost: number): number {
  const denom = onHand + addQty
  return denom > 0 ? (onHand * prevCost + addQty * addCost) / denom : addCost
}
