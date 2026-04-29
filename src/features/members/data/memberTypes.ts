/** ระดับราคาขาย 5 แบบ (ชื่อเรียกตามนโยบายร้าน — สินค้าอื่นใช้ราคาปกติของร้าน) */
export type MemberPriceTier = 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5'

/** ประเภทลูกค้า */
export type CustomerType = 'b2c' | 'b2b'

export const MEMBER_PRICE_TIER_LABELS: Record<MemberPriceTier, string> = {
  tier1: 'ราคาปลีก',
  tier2: 'ราคาช่าง',
  tier3: 'ราคาส่ง',
  tier4: 'ราคา VIP',
  tier5: 'ราคาพิเศษ',
}

export type MemberItemTierOverride = {
  id: string
  sku: string
  productName: string
  /** สินค้านี้บังคับใช้ระดับราคาใด (สินค้าอื่นใช้ราคาปกติ + ชุดราคาเริ่มต้นของสมาชิก) */
  tier: MemberPriceTier
}

