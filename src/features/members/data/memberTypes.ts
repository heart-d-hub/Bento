/** ระดับราคาขาย 5 แบบ (ชื่อเรียกตามนโยบายร้าน — สินค้าอื่นใช้ราคาปกติของร้าน) */
export type MemberPriceTier = 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5'

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

export type SalesStaff = {
  id: string
  displayName: string
}

export const MOCK_SALES_STAFF: SalesStaff[] = [
  { id: 's1', displayName: 'พี่หนึ่ง (แคชเชียร์)' },
  { id: 's2', displayName: 'พี่สอง (ช่าง)' },
  { id: 's3', displayName: 'พี่สาม (ฝ่ายขาย)' },
  { id: 's4', displayName: 'พี่สี่ (สต็อก)' },
]
