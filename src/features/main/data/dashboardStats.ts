import { MOCK_PRODUCTS } from '@/features/inventory/data/mockInventory'
import {
  getRollStateForProduct,
  loadLiveStock,
  loadRollStock,
  totalKgFromRoll,
} from '@/features/pos/data/posLiveStock'

export type LowStockAlertRow = {
  id: string
  sku: string
  name: string
  current: number
  min: number
}

/** สินค้าที่ต่ำกว่า minStock จากสต็อก POS ปัจจุบัน */
export function getLowStockAlerts(limit: number): LowStockAlertRow[] {
  const piece = loadLiveStock()
  const roll = loadRollStock()
  const rows = MOCK_PRODUCTS.filter((p) => {
    let cur: number
    if (p.stockMode === 'kg_roll' && p.nominalKgPerRoll) {
      const r = getRollStateForProduct(p, roll)
      cur = totalKgFromRoll(r, p.nominalKgPerRoll)
    } else if (p.stockMode === 'meter_roll' && p.nominalMetersPerRoll) {
      const r = getRollStateForProduct(p, roll)
      cur = totalKgFromRoll(r, p.nominalMetersPerRoll)
    } else {
      cur = piece[p.id] ?? p.stock
    }
    return cur < p.minStock
  }).map((p) => {
    let current: number
    if (p.stockMode === 'kg_roll' && p.nominalKgPerRoll) {
      const r = getRollStateForProduct(p, roll)
      current = totalKgFromRoll(r, p.nominalKgPerRoll)
    } else if (p.stockMode === 'meter_roll' && p.nominalMetersPerRoll) {
      const r = getRollStateForProduct(p, roll)
      current = totalKgFromRoll(r, p.nominalMetersPerRoll)
    } else {
      current = piece[p.id] ?? p.stock
    }
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      current,
      min: p.minStock,
    }
  })
  rows.sort((a, b) => a.current - a.min - (b.current - b.min))
  return rows.slice(0, limit)
}
