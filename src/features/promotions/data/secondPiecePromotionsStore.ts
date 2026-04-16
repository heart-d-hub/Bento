import type { SecondPieceDiscountPromotion } from '@/features/promotions/data/promotionTypes'
import { PROMOTIONS_CHANGED_EVENT } from '@/features/promotions/data/promotionsStore'

const LS_KEY = 'bento.promotions.secondPiece.v1'

export function loadSecondPiecePromotions(): SecondPieceDiscountPromotion[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SecondPieceDiscountPromotion[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveSecondPiecePromotions(promotions: SecondPieceDiscountPromotion[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(promotions))
  window.dispatchEvent(new CustomEvent(PROMOTIONS_CHANGED_EVENT))
}
