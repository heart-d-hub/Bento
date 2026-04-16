/** ราคาขายต่อหน่วย (บาท) — mock สำหรับ POS */
export const POS_UNIT_PRICE_BAHT: Record<string, number> = {
  'p-gift-shirt': 0,
  p1: 850,
  p2: 420,
  p3: 180,
  p4: 2590,
  'p-hose-1in': 85,
  p5: 320,
  p6: 160,
  p7: 390,
  'p-batt-cable-raw': 140,
  'p-batt-cable': 135,
  'p-batt-head-plus': 120,
  'p-batt-head-minus': 120,
  'p-batt-lug': 35,
  'p-batt-rubber-boot': 25,
  'p-batt-cable-2m-asm': 690,
  /** น็อต STL — สำรองเมื่อแฟ้มมาสเตอร์ยังไม่โหลด / ไม่มี sellPriceTiers */
  'p-stl-bolt-male-14x12': 5,
  'p-stl-nut-female-14': 5,
  'p-stl-washer-14': 0,
}

export function getPosUnitPrice(productId: string): number {
  return POS_UNIT_PRICE_BAHT[productId] ?? 0
}
