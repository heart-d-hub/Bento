import type { PercentOffPromotion } from '@/features/promotions/data/promotionTypes'
import { PROMOTIONS_CHANGED_EVENT } from '@/features/promotions/data/promotionsStore'

const LS_KEY = 'bento.promotions.percentOff.v1'

export function loadPercentOffPromotions(): PercentOffPromotion[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PercentOffPromotion[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function savePercentOffPromotions(promotions: PercentOffPromotion[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(promotions))
  window.dispatchEvent(new CustomEvent(PROMOTIONS_CHANGED_EVENT))
}
