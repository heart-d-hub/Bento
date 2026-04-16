/** รหัสประเภท — ขยายได้โดยเพิ่มใน master โดยไม่ต้องแก้ enum ในอนาคตถ้าย้ายไป DB */
export type VehicleCategoryId = string

export type VehicleCategoryDef = {
  id: VehicleCategoryId
  label: string
  sortOrder: number
}

export type VehicleBrand = {
  id: string
  name: string
}

export type VehicleModel = {
  id: string
  name: string
}

/** ประเภทเชื้อเพลิง — ICE / Hybrid / PHEV (nullable = ไม่ระบุ) */
export type VehicleFuelType = 'diesel' | 'bensin' | 'unspecified'

/** ระบบขับเคลื่อน — ตรงกับ powertrain_type ฝั่ง API/DB */
export type VehiclePowertrainType = 'ice' | 'hev' | 'phev' | 'ev'

/**
 * 1 Vehicle Variant = 1 ใบไม้สุดท้ายในต้นไม้ — id นี้ใช้ผูกสินค้า / vehicleFitments.engineId
 * ช่วงปี + โฉม (ไม่บังคับ) อยู่ที่ระดับนี้
 */
export type VehicleVariant = {
  id: string
  yearFrom: number
  yearTo: number
  /** โฉม เช่น FD, FC, FE — ไม่บังคับ */
  generationCode?: string
}

/**
 * นิยามระบบขับเคลื่อนต่อรุ่น — ฟิลด์ snake_case ให้สอดคล้องหลังบ้าน (nullable ตาม schema)
 */
export type VehicleEngineDef = {
  id: string
  powertrain_type: VehiclePowertrainType
  engine_size: string | null
  /** รหัสเครื่องหลัก เช่น 4JA1, 1KD, B16A */
  engine_code?: string | null
  /** alias สำหรับการค้นหา/คำเรียกหน้าร้าน เช่น 4JA, 4JA-T, 4JA1 */
  engine_code_aliases?: string[]
  fuel_type: VehicleFuelType | null
  motor_power: number | null
  battery_capacity: number | null
  variants: VehicleVariant[]
  /**
   * รถบรรทุก: แถวสเปก = EURO + จำนวนล้อ + HP (ยี่ห้อ/รุ่นอยู่ระดับ brand/model)
   * ไม่เก็บช่วงปีใน UI — เก็บ variant เดียวแบบ placeholder สำหรับผูกสินค้า
   */
  line_kind?: 'standard' | 'truck'
  truck_euro?: string | null
  /** เช่น "6 ล้อ", "10 ล้อ" */
  truck_wheel_config?: string | null
  truck_hp?: number | null
}

export type CategoryCatalog = {
  brands: VehicleBrand[]
  modelsByBrandId: Record<string, VehicleModel[]>
  enginesByModelId: Record<string, VehicleEngineDef[]>
}

export type VehicleCatalogState = {
  categories: VehicleCategoryDef[]
  byCategory: Record<string, CategoryCatalog>
}
