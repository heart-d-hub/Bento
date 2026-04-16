import {
  saveProductMasterList,
  type ProductMasterDetail,
} from '@/features/inventory/data/productMasterData'
import { INITIAL_VEHICLE_CATALOG } from '@/features/vehicle/data/mockCatalog'
import { normalizeCatalog } from '@/features/vehicle/data/normalizeCatalog'
import { VEHICLE_CATALOG_STORAGE_KEY } from '@/features/vehicle/data/vehicleCatalogStorageKeys'
import type { VehicleCatalogState } from '@/features/vehicle/data/types'

/**
 * นำข้อมูลจาก hub ลงเครื่อง — แฟ้มสินค้า + แคตตาล็อกรถ (ถ้ามี)
 */
export function applyHubDataToLocal(opts: {
  productMaster: ProductMasterDetail[]
  vehicleCatalog: VehicleCatalogState | null
}): void {
  saveProductMasterList(opts.productMaster, { notify: true })
  if (opts.vehicleCatalog && typeof opts.vehicleCatalog === 'object') {
    const normalized = normalizeCatalog(opts.vehicleCatalog)
    localStorage.setItem(VEHICLE_CATALOG_STORAGE_KEY, JSON.stringify(normalized))
    window.dispatchEvent(new CustomEvent('bento-vehicle-catalog-external-update', { detail: normalized }))
  }
}

export function readLocalVehicleCatalogRaw(): VehicleCatalogState {
  try {
    const raw = localStorage.getItem(VEHICLE_CATALOG_STORAGE_KEY)
    if (!raw) return INITIAL_VEHICLE_CATALOG
    const parsed = JSON.parse(raw) as VehicleCatalogState
    if (!parsed?.categories?.length || !parsed?.byCategory) return INITIAL_VEHICLE_CATALOG
    return normalizeCatalog(parsed)
  } catch {
    return INITIAL_VEHICLE_CATALOG
  }
}
