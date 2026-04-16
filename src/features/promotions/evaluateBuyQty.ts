import { MOCK_PRODUCTS, type InventoryProduct } from '@/features/inventory/data/mockInventory'
import type { BuyQtyPromotion } from '@/features/promotions/data/promotionTypes'

export type CartLineForPromo = {
  productId: string
  unitIndex: number
  qty: number
  promoGift?: { promoId: string; label: string }
}

function isKgRoll(p: InventoryProduct | undefined): boolean {
  return p?.stockMode === 'kg_roll' && (p.nominalKgPerRoll ?? 0) > 0
}

export function isPromotionActive(p: BuyQtyPromotion, at: Date): boolean {
  if (!p.enabled) return false
  const d = at.toISOString().slice(0, 10)
  return d >= p.startDate && d <= p.endDate
}

export function countTriggerQty(
  lines: CartLineForPromo[],
  triggerProductId: string,
  triggerUnitIndex: number | undefined,
): number {
  let sum = 0
  for (const l of lines) {
    if (l.promoGift) continue
    if (l.productId !== triggerProductId) continue
    if (triggerUnitIndex !== undefined && l.unitIndex !== triggerUnitIndex) continue
    sum += l.qty
  }
  return sum
}

export function alreadyHasPromoGift(lines: CartLineForPromo[], promoId: string): boolean {
  return lines.some((l) => l.promoGift?.promoId === promoId)
}

export function giftPieceStockAvailable(productId: string, piece: Record<string, number>): number {
  const p = MOCK_PRODUCTS.find((x) => x.id === productId)
  if (!p || isKgRoll(p)) return 0
  return piece[productId] ?? 0
}

export type PromoEvaluationRow = {
  promo: BuyQtyPromotion
  satisfied: boolean
  /** ข้อความสั้นๆ สำหรับ UI */
  detail: string
}

export function evaluateBuyQtyPromotions(
  lines: CartLineForPromo[],
  promotions: BuyQtyPromotion[],
  at: Date,
  pieceStock: Record<string, number>,
): PromoEvaluationRow[] {
  return promotions
    .filter((p) => isPromotionActive(p, at))
    .map((promo) => {
      const qty = countTriggerQty(lines, promo.triggerProductId, promo.triggerUnitIndex)
      const hasGift = alreadyHasPromoGift(lines, promo.id)
      const giftP = MOCK_PRODUCTS.find((x) => x.id === promo.giftProductId)
      const stock = giftPieceStockAvailable(promo.giftProductId, pieceStock)
      const giftOk = giftP && !isKgRoll(giftP) && stock >= promo.giftQty
      const satisfied = qty >= promo.minQty && !hasGift && !!giftOk

      let detail = ''
      if (hasGift) detail = 'ใส่ของแถมในตะกร้าแล้ว'
      else if (!giftP || isKgRoll(giftP)) detail = 'ของแถมไม่รองรับ (เฉพาะสินค้านับชิ้น)'
      else if (stock < promo.giftQty) detail = `สต็อกของแถมไม่พอ (เหลือ ${stock})`
      else if (qty < promo.minQty) detail = `ขาดอีก ${promo.minQty - qty} (${promo.minQty} ขั้นต่ำ)`
      else detail = 'กดปุ่มด้านล่างเพื่อใส่ของแถม'

      return { promo, satisfied, detail }
    })
}
