import type { InventoryProduct } from '@/features/inventory/data/mockInventory'

const LS_KEY = 'bento.inventory.warehouseThresholds.v1'

export const INVENTORY_THRESHOLDS_CHANGED_EVENT = 'bento-inventory-thresholds-changed'

type ThresholdState = {
  minById: Record<string, number>
  maxById: Record<string, number>
}

export function loadWarehouseThresholds(): ThresholdState {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { minById: {}, maxById: {} }
    const p = JSON.parse(raw) as Partial<ThresholdState>
    return {
      minById: p.minById && typeof p.minById === 'object' ? { ...p.minById } : {},
      maxById: p.maxById && typeof p.maxById === 'object' ? { ...p.maxById } : {},
    }
  } catch {
    return { minById: {}, maxById: {} }
  }
}

function saveWarehouseThresholds(s: ThresholdState) {
  localStorage.setItem(LS_KEY, JSON.stringify(s))
  window.dispatchEvent(new CustomEvent(INVENTORY_THRESHOLDS_CHANGED_EVENT))
}

/** บันทึกขั้นต่ำ / สูงสุด (คลัง) — max เป็น null หรือ ≤0 = ไม่จำกัด (ลบ override) */
export function setWarehouseMinMax(productId: string, min: number, max: number | null): void {
  const s = loadWarehouseThresholds()
  s.minById[productId] = Math.max(0, Number.isFinite(min) ? min : 0)
  if (max === null || max <= 0 || !Number.isFinite(max)) {
    delete s.maxById[productId]
  } else {
    s.maxById[productId] = Math.max(0, max)
  }
  saveWarehouseThresholds(s)
}

/** รวมค่า min/max จาก localStorage เข้ากับรายการที่มาจากแคตตาล็อก + สต็อกสด */
export function applyWarehouseThresholds(products: InventoryProduct[]): InventoryProduct[] {
  const t = loadWarehouseThresholds()
  return products.map((p) => {
    const minStock = p.id in t.minById ? t.minById[p.id]! : p.minStock
    const maxStock = p.id in t.maxById ? t.maxById[p.id]! : p.maxStock
    return { ...p, minStock, maxStock }
  })
}
