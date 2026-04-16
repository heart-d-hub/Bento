import type { SecondPieceDiscountPromotion } from '@/features/promotions/data/promotionTypes'

export function isSecondPiecePromotionActive(p: SecondPieceDiscountPromotion, at: Date): boolean {
  if (!p.enabled) return false
  const d = at.toISOString().slice(0, 10)
  return d >= p.startDate && d <= p.endDate
}

export function matchingActiveSecondPiecePromos(
  productId: string,
  unitIndex: number,
  at: Date,
  promos: SecondPieceDiscountPromotion[],
): SecondPieceDiscountPromotion[] {
  return promos.filter(
    (p) =>
      p.productId === productId &&
      p.unitIndex === unitIndex &&
      isSecondPiecePromotionActive(p, at),
  )
}
