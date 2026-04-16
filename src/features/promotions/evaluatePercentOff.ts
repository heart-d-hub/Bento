import type { PercentOffPromotion } from '@/features/promotions/data/promotionTypes'

export function isPercentPromotionActive(p: PercentOffPromotion, at: Date): boolean {
  if (!p.enabled) return false
  const d = at.toISOString().slice(0, 10)
  return d >= p.startDate && d <= p.endDate
}

/** โปรลด % ที่ใช้ได้วันนี้ และตรงสินค้า + หน่วย */
export function matchingActivePercentPromos(
  productId: string,
  unitIndex: number,
  at: Date,
  promos: PercentOffPromotion[],
): PercentOffPromotion[] {
  return promos.filter(
    (p) =>
      p.productId === productId &&
      p.unitIndex === unitIndex &&
      isPercentPromotionActive(p, at),
  )
}
