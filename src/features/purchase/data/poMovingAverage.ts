import {
  getProductMasterById,
  getProductMasterList,
  saveProductMasterList,
  type ProductMasterDetail,
} from '@/features/inventory/data/productMasterData'
import type { InventoryProduct } from '@/features/inventory/data/mockInventory'
import { mergeInventoryProductsWithLiveStock } from '@/features/pos/data/posLiveStock'

const MOCK_AVG_LS = 'bento.purchase.mockAvgCost.v1'

function loadMockAvg(): Record<string, number> {
  try {
    const raw = localStorage.getItem(MOCK_AVG_LS)
    if (!raw) return {}
    const o = JSON.parse(raw) as unknown
    if (o && typeof o === 'object' && !Array.isArray(o)) return o as Record<string, number>
  } catch {
    /* ignore */
  }
  return {}
}

function saveMockAvg(m: Record<string, number>): void {
  try {
    localStorage.setItem(MOCK_AVG_LS, JSON.stringify(m))
  } catch {
    /* ignore */
  }
}

/** จำนวนคงเหลือก่อนรับครั้งนี้ (หน่วยเดียวกับที่รับเข้า — สอดคล้องตารางคลัง/POS) */
export function getOnHandQtyBeforeReceive(p: InventoryProduct): number {
  const [m] = mergeInventoryProductsWithLiveStock([p])
  return Math.max(0, m.stock)
}

/** ต้นทุนต่อหน่วยล่าสุดสำหรับแสดงใน PO */
export function getLatestUnitCostForPo(p: InventoryProduct): number {
  const master = getProductMasterById(p.id)
  if (master) {
    const v = master.avgCost > 0 ? master.avgCost : master.costPrice
    return Math.max(0, Math.round(v * 100) / 100)
  }
  const overlay = loadMockAvg()[p.id]
  if (overlay != null && overlay > 0) return Math.round(overlay * 100) / 100
  return 0
}

/**
 * Moving average: อัปเดต avgCost ในแฟ้มมาสเตอร์ หรือ overlay ถ้าไม่มีมาสเตอร์
 */
export function applyMovingAverageCost(
  productId: string,
  addQty: number,
  addUnitCost: number,
  catalogProduct: InventoryProduct,
): void {
  const add = Math.max(0, addQty)
  const cost = Math.max(0, addUnitCost)
  if (add <= 0) return

  const oldQty = getOnHandQtyBeforeReceive(catalogProduct)
  const list = getProductMasterList()
  const idx = list.findIndex((x) => x.id === productId)

  if (idx >= 0) {
    const cur = list[idx]!
    const oldAvg = cur.avgCost > 0 ? cur.avgCost : cur.costPrice
    const denom = oldQty + add
    const newAvg = denom > 0 ? (oldQty * oldAvg + add * cost) / denom : oldAvg
    const rounded = Math.max(0, Math.round(newAvg * 100) / 100)
    const next: ProductMasterDetail = { ...cur, avgCost: rounded }
    const copy = [...list]
    copy[idx] = next
    saveProductMasterList(copy)
    return
  }

  const map = loadMockAvg()
  const prev = map[productId] ?? 0
  const denom = oldQty + add
  const newAvg = denom > 0 ? (oldQty * prev + add * cost) / denom : cost
  map[productId] = Math.max(0, Math.round(newAvg * 100) / 100)
  saveMockAvg(map)
}
