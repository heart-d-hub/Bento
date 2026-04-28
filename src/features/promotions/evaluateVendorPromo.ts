import type { VendorPromotion, VendorPromoTier } from '@/features/promotions/data/promotionTypes'

function isActive(p: VendorPromotion, now: Date): boolean {
  if (!p.enabled) return false
  const start = new Date(p.startDate)
  const end = new Date(p.endDate + 'T23:59:59')
  return now >= start && now <= end
}

export function isVendorPromotionActive(p: VendorPromotion, now: Date): boolean {
  return isActive(p, now)
}

function productMatches(
  p: VendorPromotion,
  productId: string,
  brand: string,
  category: string,
): boolean {
  if (p.productId) return p.productId === productId
  if (p.brand) return p.brand === brand
  if (p.category) return p.category === category
  return true
}

/** best tier the buyer has already unlocked (highest minQty ≤ orderedQty) */
export function findBestVendorPromoTier(
  promo: VendorPromotion,
  orderedQty: number,
): VendorPromoTier | null {
  const eligible = promo.tiers.filter((t) => orderedQty >= t.minQty)
  if (!eligible.length) return null
  return eligible.reduce((best, t) => (t.minQty > best.minQty ? t : best))
}

/** next tier not yet reached (lowest minQty > orderedQty) */
export function findNextVendorPromoTier(
  promo: VendorPromotion,
  orderedQty: number,
): VendorPromoTier | null {
  const unreached = promo.tiers.filter((t) => orderedQty < t.minQty)
  if (!unreached.length) return null
  return unreached.reduce((min, t) => (t.minQty < min.minQty ? t : min))
}

/** active promos that match this product (regardless of qty) */
export function findActiveVendorPromos(
  promos: VendorPromotion[],
  productId: string,
  supplierId: string,
  brand = '',
  category = '',
  now = new Date(),
): VendorPromotion[] {
  return promos.filter(
    (p) =>
      isActive(p, now) &&
      (p.supplierId === '' || p.supplierId === supplierId) &&
      productMatches(p, productId, brand, category),
  )
}

/** backward-compat: promos where at least one tier is met */
export function findMatchingVendorPromos(
  promos: VendorPromotion[],
  productId: string,
  supplierId: string,
  orderedQty: number,
  now = new Date(),
  productBrand = '',
  productCategory = '',
): VendorPromotion[] {
  return findActiveVendorPromos(
    promos, productId, supplierId, productBrand, productCategory, now,
  ).filter((p) => p.tiers.some((t) => orderedQty >= t.minQty))
}
