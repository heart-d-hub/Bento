import {
  getProductMasterList,
  masterProductsForEngine,
  productEligibleForPosSale,
  totalCrossBranchStock,
  type ProductMasterDetail,
} from '@/features/inventory/data/productMasterData'
import {
  filterStoreProductsByBrakePosition,
  MOCK_STORE_PRODUCTS_BY_ENGINE_ID,
} from '@/features/vehicle/data/mockStoreProducts'

export type VehicleSearchProductRow = {
  sku: string
  name: string
  price: number
  stock: number
  /** จากแฟ้มมาสเตอร์ (ผูก engineId) หรือตัวอย่างในระบบ */
  source: 'master' | 'demo'
}

/**
 * รายการสินค้าหลังเลือกเครื่อง/ปี — รวมจากแฟ้มมาสเตอร์ก่อน แล้วเติมตัวอย่าง demo ที่ยังไม่มี SKU ซ้ำ
 */
export function buildVehicleSearchProductRows(
  engineId: string,
  brakeFilter: '' | 'front' | 'rear',
  masterList?: ProductMasterDetail[],
): VehicleSearchProductRow[] {
  const masters = masterProductsForEngine(engineId, brakeFilter, masterList).filter(productEligibleForPosSale)
  const fromMaster: VehicleSearchProductRow[] = masters.map((p) => ({
    sku: p.sku,
    name: p.name,
    price: p.sellPrice,
    stock: totalCrossBranchStock(p),
    source: 'master',
  }))
  const masterSkus = new Set(fromMaster.map((r) => r.sku.trim().toLowerCase()))
  const demoRaw = MOCK_STORE_PRODUCTS_BY_ENGINE_ID[engineId] ?? []
  const demoFiltered = filterStoreProductsByBrakePosition(demoRaw, brakeFilter)
  const fromDemo: VehicleSearchProductRow[] = demoFiltered
    .filter((d) => !masterSkus.has(d.sku.trim().toLowerCase()))
    .map((d) => ({
      sku: d.sku,
      name: d.name,
      price: d.price,
      stock: d.stock,
      source: 'demo' as const,
    }))
  return [...fromMaster, ...fromDemo]
}

/** ใช้คู่ React — โหลดรายการมาสเตอร์ล่าสุด */
export function getVehicleSearchRowsForEngine(
  engineId: string,
  brakeFilter: '' | 'front' | 'rear',
): VehicleSearchProductRow[] {
  return buildVehicleSearchProductRows(engineId, brakeFilter, getProductMasterList())
}
