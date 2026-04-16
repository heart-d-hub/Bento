import { type InventoryProduct } from '@/features/inventory/data/mockInventory'
import { posDisplayProductName } from '@/features/inventory/data/productMasterData'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import type { PosCartLine } from '@/features/pos/data/posCartLineTypes'
import { getPosSellConfig } from '@/features/pos/data/posUnitPricing'
import type { PromoGiftMeta } from '@/features/promotions/data/promotionTypes'
import { getStlBoltPairForMaleProduct } from '@/features/promotions/stlBoltPairRegistry'

export const STL_BOLT_PAIR_PROMO_ID = 'stl-bolt-pair'

export const STL_BOLT_PAIR_GIFT_LABEL = 'แถมแหวนอีแปะ (คู่น็อต STL)'

function isKgRoll(p: InventoryProduct | undefined): boolean {
  return p?.stockMode === 'kg_roll' && (p.nominalKgPerRoll ?? 0) > 0
}

function newLineId(): string {
  return `ln-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function giftMeta(): PromoGiftMeta {
  return { promoId: STL_BOLT_PAIR_PROMO_ID, label: STL_BOLT_PAIR_GIFT_LABEL }
}

function washerAvailablePiece(
  catalog: InventoryProduct[],
  washerProductId: string,
  piece: Record<string, number>,
): number {
  const p = catalog.find((x) => x.id === washerProductId)
  if (!p || isKgRoll(p)) return 0
  return piece[washerProductId] ?? 0
}

export function isStlBoltPairGiftLine(line: PosCartLine): boolean {
  return line.promoGift?.promoId === STL_BOLT_PAIR_PROMO_ID && !!line.stlBoltPairMaleLineId
}

export function isStlBoltNutLine(line: PosCartLine): boolean {
  return !!line.stlBoltMaleLineId
}

/**
 * ลบบรรทัดหนึ่ง — ถ้าเป็นคู่น็อต STL จะลบบรรทัดที่เกี่ยวข้องด้วย
 */
export function cascadeRemoveStlBoltPairLine(lineId: string, lines: PosCartLine[]): PosCartLine[] {
  const line = lines.find((l) => l.lineId === lineId)
  if (!line) return lines

  const removeIds = new Set<string>()

  if (line.stlBoltNutLineId) {
    removeIds.add(lineId)
    removeIds.add(line.stlBoltNutLineId)
    const gift = lines.find(
      (l) => isStlBoltPairGiftLine(l) && l.stlBoltPairMaleLineId === lineId,
    )
    if (gift) removeIds.add(gift.lineId)
    return lines.filter((l) => !removeIds.has(l.lineId))
  }

  if (line.stlBoltMaleLineId) {
    const maleId = line.stlBoltMaleLineId
    removeIds.add(lineId)
    const gift = lines.find(
      (l) => isStlBoltPairGiftLine(l) && l.stlBoltPairMaleLineId === maleId,
    )
    if (gift) removeIds.add(gift.lineId)
    return lines
      .filter((l) => !removeIds.has(l.lineId))
      .map((l) => (l.lineId === maleId ? { ...l, stlBoltNutLineId: undefined } : l))
  }

  if (isStlBoltPairGiftLine(line) && line.stlBoltPairMaleLineId) {
    return lines.filter((l) => l.lineId !== lineId)
  }

  return lines.filter((l) => l.lineId !== lineId)
}

/**
 * สร้างบรรทัดตัวเมีย + อัปเดตตัวผู้ — แทรกบรรทัดถัดจากตัวผู้
 */
export function insertBoltNutLinesForMale(
  lines: PosCartLine[],
  maleLineId: string,
  nutLine: PosCartLine,
  maleWithNutRef: PosCartLine,
): PosCartLine[] {
  const idx = lines.findIndex((l) => l.lineId === maleLineId)
  if (idx < 0) return lines
  const before = lines.slice(0, idx)
  const after = lines.slice(idx + 1)
  return [...before, maleWithNutRef, nutLine, ...after]
}

/**
 * อัปเดต/สร้างบรรทัดแหวนแถมตาม min(ตัวผู้, ตัวเมีย)
 */
export function syncStlBoltPairGifts(
  lines: PosCartLine[],
  pieceStock: Record<string, number>,
): PosCartLine[] {
  const catalog = getPosCatalogProducts()
  let out = [...lines]
  let changed = false

  const fixOrphanMales = (): void => {
    out = out.map((l) => {
      if (!l.stlBoltNutLineId) return l
      if (!out.some((x) => x.lineId === l.stlBoltNutLineId)) {
        changed = true
        const { stlBoltNutLineId: _, ...rest } = l
        return rest as PosCartLine
      }
      return l
    })
  }

  fixOrphanMales()

  const males = out.filter((l) => l.stlBoltNutLineId && getStlBoltPairForMaleProduct(l.productId))

  for (const male of males) {
    const pair = getStlBoltPairForMaleProduct(male.productId)
    if (!pair) continue
    const nut = out.find((l) => l.lineId === male.stlBoltNutLineId)
    if (!nut || !nut.stlBoltMaleLineId || nut.stlBoltMaleLineId !== male.lineId) {
      out = out.map((l) =>
        l.lineId === male.lineId ? { ...l, stlBoltNutLineId: undefined } : l,
      )
      changed = true
      continue
    }

    const mq = Math.max(0, Math.floor(male.qty))
    const nq = Math.max(0, Math.floor(nut.qty))
    const targetQty = Math.min(mq, nq)

    const giftIdx = out.findIndex(
      (l) => isStlBoltPairGiftLine(l) && l.stlBoltPairMaleLineId === male.lineId,
    )

    if (targetQty <= 0) {
      if (giftIdx >= 0) {
        const gid = out[giftIdx]!.lineId
        out = out.filter((l) => l.lineId !== gid)
        changed = true
      }
      continue
    }

    const pWash = catalog.find((x) => x.id === pair.washerProductId)
    if (!pWash || isKgRoll(pWash)) {
      if (giftIdx >= 0) {
        const gid = out[giftIdx]!.lineId
        out = out.filter((l) => l.lineId !== gid)
        changed = true
      }
      continue
    }

    const cfg = getPosSellConfig(pair.washerProductId)
    const u = cfg.units[0]
    const lv = cfg.priceLevels[0]
    const avail = washerAvailablePiece(catalog, pair.washerProductId, pieceStock)
    const maxQty = Math.floor(avail / Math.max(1, u.baseUnits))
    if (maxQty < 1) {
      if (giftIdx >= 0) {
        const gid = out[giftIdx]!.lineId
        out = out.filter((l) => l.lineId !== gid)
        changed = true
      }
      continue
    }

    const q = Math.min(targetQty, maxQty)
    const giftLineBase: PosCartLine = {
      lineId: giftIdx >= 0 ? out[giftIdx]!.lineId : newLineId(),
      productId: pWash.id,
      sku: pWash.sku,
      name: posDisplayProductName(pWash),
      qty: q,
      unitPrice: 0,
      unitLabel: u.label,
      unitIndex: u.index,
      unitBaseUnits: Math.max(1, u.baseUnits),
      priceLevelIndex: lv.index,
      priceLevelLabel: lv.label,
      promoGift: giftMeta(),
      stlBoltPairMaleLineId: male.lineId,
    }

    if (giftIdx >= 0) {
      const prev = out[giftIdx]!
      if (prev.qty !== giftLineBase.qty || prev.productId !== giftLineBase.productId) {
        out = out.map((l, i) => (i === giftIdx ? giftLineBase : l))
        changed = true
      }
    } else {
      const nutIdx = out.findIndex((l) => l.lineId === nut.lineId)
      const insertAt = nutIdx >= 0 ? nutIdx + 1 : out.length
      out = [...out.slice(0, insertAt), giftLineBase, ...out.slice(insertAt)]
      changed = true
    }
  }

  const validMaleIds = new Set(
    out.filter((l) => l.stlBoltNutLineId && getStlBoltPairForMaleProduct(l.productId)).map((l) => l.lineId),
  )

  out = out.filter((l) => {
    if (!isStlBoltPairGiftLine(l) || !l.stlBoltPairMaleLineId) return true
    if (!validMaleIds.has(l.stlBoltPairMaleLineId)) {
      changed = true
      return false
    }
    return true
  })

  return changed ? out : lines
}
