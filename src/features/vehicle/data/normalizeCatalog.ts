import { migrateLegacyEnginesToDefs } from '@/features/vehicle/data/vehicleCatalogUtils'
import type { VehicleCatalogState, VehicleEngineDef } from '@/features/vehicle/data/types'

/** รองรับข้อมูลเก่าใน localStorage (แถวเดียว label+ปี) และรูปแบบใหม่ (engine def + variants) */
export function normalizeCatalog(state: VehicleCatalogState): VehicleCatalogState {
  const byCategory: VehicleCatalogState['byCategory'] = {}

  for (const catId of Object.keys(state.byCategory)) {
    const c = state.byCategory[catId]
    const enginesByModelId: Record<string, VehicleEngineDef[]> = {}

    for (const mid of Object.keys(c.enginesByModelId)) {
      const raw = c.enginesByModelId[mid] as unknown
      enginesByModelId[mid] = migrateLegacyEnginesToDefs(Array.isArray(raw) ? raw : [])
    }

    byCategory[catId] = {
      ...c,
      enginesByModelId,
    }
  }

  return { ...state, byCategory }
}
