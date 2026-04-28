import type { VendorPromotion } from '@/features/promotions/data/promotionTypes'
import { PROMOTIONS_CHANGED_EVENT } from '@/features/promotions/data/promotionsStore'

const LS_KEY = 'bento.promotions.vendor.v1'

function migrate(raw: unknown[]): VendorPromotion[] {
  return (raw as Record<string, unknown>[]).map((p) => ({
    brand: '',
    category: '',
    ...p,
    tiers: Array.isArray(p.tiers)
      ? p.tiers
      : [
          {
            minQty: typeof p.minQty === 'number' ? p.minQty : 1,
            extraDiscountPct: typeof p.extraDiscountPct === 'number' ? p.extraDiscountPct : 0,
            freeQty: 0,
          },
        ],
  })) as VendorPromotion[]
}

export function loadVendorPromotions(): VendorPromotion[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown[]
    if (!Array.isArray(parsed)) return []
    return migrate(parsed)
  } catch {
    return []
  }
}

export function saveVendorPromotions(promotions: VendorPromotion[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(promotions))
  window.dispatchEvent(new CustomEvent(PROMOTIONS_CHANGED_EVENT))
}
