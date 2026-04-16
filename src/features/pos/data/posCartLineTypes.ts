import type { PercentPromoApplied, PromoGiftMeta, SecondPiecePromoApplied } from '@/features/promotions/data/promotionTypes'

/** บรรทัดตะกร้า POS — แยกไฟล์เพื่อใช้ร่วมกับโปรคู่น็อต STL โดยไม่วนห่วง import */
export type PosCartLine = {
  lineId: string
  productId: string
  sku: string
  name: string
  qty: number
  unitPrice: number
  unitLabel: string
  unitIndex: number
  unitBaseUnits: number
  priceLevelIndex: number
  priceLevelLabel: string
  stockMode?: 'piece' | 'kg_roll' | 'meter_roll'
  priceByMeter?: boolean
  stockDeductionKg?: number
  posDisplayNote?: string
  promoGift?: PromoGiftMeta
  percentPromoApplied?: PercentPromoApplied
  secondPiecePromoApplied?: SecondPiecePromoApplied
  stockBreakdown?: { productId: string; qty: number }[]
  /** บรรทัดตัวผู้ (น็อตยาว): รหัสบรรทัดตัวเมียที่สร้างจาก +หัว */
  stlBoltNutLineId?: string
  /** บรรทัดตัวเมีย: ชี้กลับบรรทัดตัวผู้ */
  stlBoltMaleLineId?: string
  /** บรรทัดของแถมแหวน (โปรคู่น็อต): ชี้บรรทัดตัวผู้ */
  stlBoltPairMaleLineId?: string
}
