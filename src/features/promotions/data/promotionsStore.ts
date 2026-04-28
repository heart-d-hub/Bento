import type { BuyQtyPromotion } from '@/features/promotions/data/promotionTypes'
import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'

const LS_KEY = 'bento.promotions.buyQty.v1'

export const PROMOTIONS_CHANGED_EVENT = 'bento-promotions-changed'

export const DEFAULT_PROMOTIONS: BuyQtyPromotion[] = [
  {
    id: 'promo-hose-shirt',
    name: 'ซื้อสายยาง 1 ม้วน แถมเสื้อ',
    enabled: true,
    startDate: '2020-01-01',
    endDate: '2099-12-31',
    triggerProductId: 'p-hose-1in',
    triggerUnitIndex: 2,
    minQty: 1,
    giftProductId: 'p-gift-shirt',
    giftQty: 1,
  },
]

export function loadPromotions(): BuyQtyPromotion[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return [...DEFAULT_PROMOTIONS]
    const parsed = JSON.parse(raw) as BuyQtyPromotion[]
    if (!Array.isArray(parsed)) return [...DEFAULT_PROMOTIONS]
    return parsed
  } catch {
    return [...DEFAULT_PROMOTIONS]
  }
}

export function savePromotions(promotions: BuyQtyPromotion[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(promotions))
  window.dispatchEvent(new CustomEvent(PROMOTIONS_CHANGED_EVENT))
}

export async function loadPromotionsAsync(): Promise<BuyQtyPromotion[]> {
  if (isTauri()) {
    try {
      const rows = await invoke<BuyQtyPromotion[]>('promotions_load', { kind: 'buyQty' })
      if (Array.isArray(rows) && rows.length > 0) return rows
    } catch (e) {
      console.warn('promotions_load buyQty failed, falling back to localStorage', e)
    }
  }
  return loadPromotions()
}

export async function savePromotionsAsync(promotions: BuyQtyPromotion[]): Promise<void> {
  savePromotions(promotions)
  if (isTauri()) {
    await invoke('promotions_save', { kind: 'buyQty', rows: promotions })
  }
}
