import type { PercentOffPromotion } from '@/features/promotions/data/promotionTypes'
import { PROMOTIONS_CHANGED_EVENT } from '@/features/promotions/data/promotionsStore'
import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'

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

export async function loadPercentOffPromotionsAsync(): Promise<PercentOffPromotion[]> {
  if (isTauri()) {
    try {
      const rows = await invoke<PercentOffPromotion[]>('promotions_load', { kind: 'percentOff' })
      if (Array.isArray(rows) && rows.length > 0) return rows
    } catch (e) {
      console.warn('promotions_load percentOff failed, falling back to localStorage', e)
    }
  }
  return loadPercentOffPromotions()
}

export async function savePercentOffPromotionsAsync(promotions: PercentOffPromotion[]): Promise<void> {
  savePercentOffPromotions(promotions)
  if (isTauri()) {
    await invoke('promotions_save', { kind: 'percentOff', rows: promotions })
  }
}
