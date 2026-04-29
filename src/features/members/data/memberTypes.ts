/** ระดับราคาขาย 4 แบบ */
export type MemberPriceTier = 'tier1' | 'tier2' | 'tier3' | 'tier4'

/** ประเภทลูกค้า */
export type CustomerType = 'b2c' | 'garage' | 'store' | 'vip'

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  b2c: 'ลูกค้าทั่วไป',
  garage: 'อู่ / ช่าง',
  store: 'ร้านอะไหล่',
  vip: 'VIP',
}

export const MEMBER_PRICE_TIER_LABELS: Record<MemberPriceTier, string> = {
  tier1: 'ปลีก',
  tier2: 'อู่',
  tier3: 'ร้านค้า',
  tier4: 'VIP',
}

export type MemberItemTierOverride = {
  id: string
  sku: string
  productName: string
  /** สินค้านี้บังคับใช้ระดับราคาใด (สินค้าอื่นใช้ราคาปกติ + ชุดราคาเริ่มต้นของสมาชิก) */
  tier: MemberPriceTier
}

