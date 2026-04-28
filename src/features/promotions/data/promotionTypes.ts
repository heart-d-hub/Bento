/** โปรแบบซื้อสินค้าตัวถึงจำนวน/หน่วยที่กำหนด → แถมสินค้า (ราคา 0) — MVP */

export type BuyQtyPromotion = {
  id: string
  name: string
  enabled: boolean
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD */
  endDate: string
  /** สินค้าที่ต้องซื้อ */
  triggerProductId: string
  /**
   * หน่วยขายที่นับ (index ตาม POS / แฟ้มสินค้า) — ถ้าไม่ระบุ นับทุกบรรทัดของสินค้านี้ที่ไม่ใช่ของแถม
   */
  triggerUnitIndex?: number
  /** จำนวนขั้นต่ำของหน่วยด้านบน (หรือผลรวม qty เมื่อไม่ระบุหน่วย) */
  minQty: number
  giftProductId: string
  giftQty: number
}

export type PromoGiftMeta = {
  promoId: string
  label: string
}

/** ลดราคาเป็น % — เฉพาะหน่วยขายที่ระบุ (unitIndex ตาม POS) */
export type PercentOffPromotion = {
  id: string
  name: string
  enabled: boolean
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD */
  endDate: string
  productId: string
  /** ดัชนีหน่วยขายตาม POS (ต้องตรงกับหน่วยที่เลือกในตะกร้า) */
  unitIndex: number
  /** 1–100 */
  percentOff: number
}

export type PercentPromoApplied = {
  promoId: string
  label: string
  percentOff: number
}

/**
 * โปรซื้อชิ้นถัดไปถูกลง — ชิ้นแรก (หรือ N ชิ้นแรก) ราคาเต็ม ชิ้นที่เกินลด % จากราคาหน่วยนั้น
 */
export type SecondPieceDiscountPromotion = {
  id: string
  name: string
  enabled: boolean
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD */
  endDate: string
  productId: string
  unitIndex: number
  /** จำนวนชิ้นแรกที่ราคาเต็ม (ขั้นต่ำ 1 — เช่น 1 = ชิ้นที่ 2 เป็นต้นไปได้ส่วนลด) */
  fullPricePieces: number
  /** ลด % สำหรับชิ้นที่เกิน fullPricePieces */
  percentOffAdditional: number
}

export type SecondPiecePromoApplied = {
  promoId: string
  label: string
  fullPricePieces: number
  percentOffAdditional: number
}

/** ขั้นส่วนลดหนึ่งขั้นใน VendorPromotion */
export type VendorPromoTier = {
  /** จำนวนซื้อขั้นต่ำของ tier นี้ */
  minQty: number
  /** ส่วนลดเพิ่ม % (0 = ไม่ลด) */
  extraDiscountPct: number
  /** ของแถมจำนวนชิ้น (0 = ไม่แถม) */
  freeQty: number
}

/**
 * โปรโมชั่นผู้จัดจำหน่าย (Vendor Promotion)
 * รองรับหลายขั้น (tiers) เช่น ซื้อ 50 → -3%, ซื้อ 100 → แถม 10
 * ใช้ฝั่งการสั่งซื้อ (PO/Catalog) ไม่ใช่ POS
 */
export type VendorPromotion = {
  id: string
  name: string
  enabled: boolean
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD */
  endDate: string
  /** productId เฉพาะเจาะจง — '' = ใช้ brand/category แทน */
  productId: string
  /** กรองตามแบรนด์สินค้า — '' = ทุกแบรนด์ */
  brand: string
  /** กรองตามหมวดสินค้า — '' = ทุกหมวด */
  category: string
  /** รหัส supplier — '' = ทุก supplier */
  supplierId: string
  /** ขั้นส่วนลด เรียงตาม minQty น้อย → มาก */
  tiers: VendorPromoTier[]
}
