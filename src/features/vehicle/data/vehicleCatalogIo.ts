import { normalizeCatalog } from '@/features/vehicle/data/normalizeCatalog'
import type { VehicleCatalogState } from '@/features/vehicle/data/types'

/** ส่งออก JSON สำหรับสำรอง / ย้ายเครื่อง / ให้ลูกน้องแก้แล้วนำเข้า */
export function exportVehicleCatalogToJsonString(state: VehicleCatalogState): string {
  return JSON.stringify(state, null, 2)
}

export function importVehicleCatalogFromJsonString(
  text: string,
): { ok: true; catalog: VehicleCatalogState } | { ok: false; error: string } {
  const trimmed = text.trim()
  if (!trimmed) return { ok: false, error: 'ไฟล์ว่าง' }
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'รูปแบบไม่ถูกต้อง' }
    }
    const p = parsed as Partial<VehicleCatalogState>
    if (!Array.isArray(p.categories) || typeof p.byCategory !== 'object' || p.byCategory === null) {
      return { ok: false, error: 'ไม่ใช่แคตตาล็อกรถ (ต้องมี categories และ byCategory)' }
    }
    return { ok: true, catalog: normalizeCatalog(p as VehicleCatalogState) }
  } catch {
    return { ok: false, error: 'อ่าน JSON ไม่สำเร็จ' }
  }
}
