import type { SecondPieceDiscountPromotion } from '@/features/promotions/data/promotionTypes'
import { PROMOTIONS_CHANGED_EVENT } from '@/features/promotions/data/promotionsStore'
import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'

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

export async function loadSecondPiecePromotionsAsync(): Promise<SecondPieceDiscountPromotion[]> {
  if (isTauri()) {
    try {
      const rows = await invoke<SecondPieceDiscountPromotion[]>('promotions_load', { kind: 'secondPiece' })
      if (Array.isArray(rows) && rows.length > 0) return rows
    } catch (e) {
      console.warn('promotions_load secondPiece failed, falling back to localStorage', e)
    }
  }
  return loadSecondPiecePromotions()
}

export async function saveSecondPiecePromotionsAsync(promotions: SecondPieceDiscountPromotion[]): Promise<void> {
  saveSecondPiecePromotions(promotions)
  if (isTauri()) {
    await invoke('promotions_save', { kind: 'secondPiece', rows: promotions })
  }
}
