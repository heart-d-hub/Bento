/**
 * โปร STL ตามยอดราคาตั้งรวม (Bolt:Black / Bolt:Green) + โหมดส่ง
 * แท็กหลัก: bolt-black, bolt-green — รองรับ id รุ่นเก่า stl-schedule-*, stl-ladder-promo
 */

import type { ProductMasterDetail } from '@/features/inventory/data/productMasterData'
import type { MemberPriceTier } from '@/features/members/data/memberTypes'
import {
  loadStlVolumePromoSettings,
  mergeSettings,
  type StlVolumePromoSettings,
} from '@/features/promotions/stlVolumePromoSettings'
import {
  ensureLegacyStlFormulaSeeded,
  loadTagFormulas,
  type StlVolumeTagFormula,
} from '@/features/promotions/tagFormulaRegistry'

/** ราคาตั้ง × จำนวน ต่อบรรทัดตะกร้า */
export type StlPromoCartLine = {
  /** รหัสสินค้าในแฟ้ม */
  productId: string
  qty: number
  /** ราคาตั้งต่อหน่วย (หรือ extended แล้วหารด้วย qty) */
  listPricePerUnit: number
  master: ProductMasterDetail
}

export type StlPriceMode = 'retail' | 'wholesale'

/** ตามนโยบายร้าน: tier3 = ราคาส่ง → ใช้ `mode: 'wholesale'` กับ `computeStlVolumePromo` */
export function stlPriceModeFromMemberTier(
  tier: MemberPriceTier | undefined | null,
): StlPriceMode {
  return tier === 'tier3' ? 'wholesale' : 'retail'
}

/** ตารางปลีก — ชั้นตามยอดราคาตั้งรวมในกลุ่มโปร */
export type StlRetailTierTable = {
  minBaht: number
  maxBaht: number | null
  discountsByTagId: Record<string, number>
}

/** ตารางส่ง — ตอนนี้แบบเหมา % (อนาคตอาจเป็นขั้นบันได) */
export type StlWholesaleRates = {
  discountsByTagId: Record<string, number>
}

/** แท็กหลักใน registry ปัจจุบัน + id เดิมที่ยังอาจติดสินค้า */
export const STL_PROMO_TAG_IDS = {
  boltBlack: 'bolt-black',
  boltGreen: 'bolt-green',
  legacyBlack: 'stl-schedule-black',
  legacyGreen: 'stl-schedule-green',
  legacyLadder: 'stl-ladder-promo',
} as const

function hasTag(p: ProductMasterDetail, id: string): boolean {
  return (p.productTagIds ?? []).includes(id)
}

function hasAnyTag(p: ProductMasterDetail, ids: readonly string[]): boolean {
  return ids.some((id) => hasTag(p, id))
}

/** เข้ากลุ่มนับยอดขั้นบันได: อยู่ในแท็กที่เลือก */
export function isStlLadderLine(
  p: ProductMasterDetail,
  selectedTagIds: readonly string[],
): boolean {
  return hasAnyTag(p, selectedTagIds)
}

/**
 * สูตรที่บันทึกใน «จัดการแท็กสินค้า» (stl-volume) มีความสำคัญก่อน localStorage รุ่นเก่า
 */
export function getEffectiveStlVolumePromoSettings(): StlVolumePromoSettings {
  try {
    ensureLegacyStlFormulaSeeded()
    const formulas = loadTagFormulas().filter((f): f is StlVolumeTagFormula => f.kind === 'stl-volume')
    if (formulas.length > 0) {
      return mergeSettings(formulas[0].settings)
    }
  } catch (e) {
    console.warn('[STL promo] getEffectiveStlVolumePromoSettings fallback', e)
  }
  return loadStlVolumePromoSettings()
}

function schedulePercentForLine(
  p: ProductMasterDetail,
  tier: StlRetailTierTable | null,
  wholesale: StlWholesaleRates,
  mode: StlPriceMode,
  selectedTagIds: readonly string[],
): number {
  const table = mode === 'wholesale' ? wholesale.discountsByTagId : tier?.discountsByTagId
  if (!table) return 0
  let best = 0
  for (const id of selectedTagIds) {
    if (!hasTag(p, id)) continue
    const pct = table[id]
    if (typeof pct === 'number' && pct > best) best = pct
  }
  return best
}

/**
 * ผลรวมราคาตั้งของบรรทัดที่เข้าโปร STL (สาย Bolt ดำ/เขียว หรือแท็ก ladder รุ่นเก่า)
 */
export function sumListSubtotalForStlLadder(
  lines: StlPromoCartLine[],
  selectedTagIds?: readonly string[],
): number {
  const ids = selectedTagIds ?? getEffectiveStlVolumePromoSettings().selectedTagIds
  let s = 0
  for (const L of lines) {
    if (!isStlLadderLine(L.master, ids)) continue
    s += Math.max(0, L.listPricePerUnit) * Math.max(0, L.qty)
  }
  return Math.round(s * 100) / 100
}

function pickRetailTier(
  promoListSubtotal: number,
  tiers: StlRetailTierTable[],
  minListSubtotalBaht: number,
): StlRetailTierTable | null {
  if (promoListSubtotal < minListSubtotalBaht) return null
  for (const t of tiers) {
    const maxOk = t.maxBaht === null || promoListSubtotal <= t.maxBaht
    const minOk = promoListSubtotal >= t.minBaht
    if (minOk && maxOk) return t
  }
  return tiers[tiers.length - 1] ?? null
}

export type StlPromoLineResult = {
  productId: string
  qty: number
  listSubtotal: number
  /** ถ้าไม่เข้าโปร ladder หรือไม่มีสายสี = ขายตามราคาตั้งรวม */
  sellSubtotal: number
  discountPercentApplied: number
  /** หมายเหตุบนบิล */
  note?: string
}

export type ComputeStlVolumePromoInput = {
  lines: StlPromoCartLine[]
  mode: StlPriceMode
  /** ถ้าไม่ส่ง = ใช้ค่าจากการตั้งค่าในโปรแกรม (localStorage) */
  retailTiers?: StlRetailTierTable[]
  wholesale?: StlWholesaleRates
  /** ถ้าไม่ส่ง = ใช้ค่าจากการตั้งค่า — ยอดรวมราคาตั้งกลุ่มโปรต่ำกว่านี้ไม่ลด (ปลีก) */
  minListSubtotalBaht?: number
  /** ถ้าไม่ส่ง = ใช้แท็กที่เลือกจากการตั้งค่าในโปรแกรม */
  selectedTagIds?: string[]
}

/**
 * คำนวณยอดขายต่อบรรทัดหลังโปร STL
 * - บรรทัดที่ไม่ใช่สาย Bolt (ดำ/เขียว) และไม่มีแท็ก ladder รุ่นเก่า: ราคาตั้งเต็ม
 * - ยอดรวมราคาตั้งกลุ่มโปร &lt; 20: ขายตามราคาตั้ง (ไม่ลด)
 */
export function computeStlVolumePromo(input: ComputeStlVolumePromoInput): {
  promoListSubtotal: number
  tier: StlRetailTierTable | null
  lineResults: StlPromoLineResult[]
} {
  const eff = getEffectiveStlVolumePromoSettings()
  const retailTiers = input.retailTiers ?? (eff.retailTiers as StlRetailTierTable[])
  const wholesale = input.wholesale ?? (eff.wholesale as StlWholesaleRates)
  const minListSubtotalBaht = input.minListSubtotalBaht ?? eff.minListSubtotalBaht
  const selectedTagIds = input.selectedTagIds ?? eff.selectedTagIds
  const promoListSubtotal = sumListSubtotalForStlLadder(input.lines, selectedTagIds)
  const tier =
    input.mode === 'retail'
      ? pickRetailTier(promoListSubtotal, retailTiers, minListSubtotalBaht)
      : null

  const lineResults: StlPromoLineResult[] = input.lines.map((L) => {
    const listSubtotal = Math.round(Math.max(0, L.listPricePerUnit) * Math.max(0, L.qty) * 100) / 100
    if (!isStlLadderLine(L.master, selectedTagIds)) {
      return {
        productId: L.productId,
        qty: L.qty,
        listSubtotal,
        sellSubtotal: listSubtotal,
        discountPercentApplied: 0,
        note: undefined,
      }
    }
    const pct = schedulePercentForLine(L.master, tier, wholesale, input.mode, selectedTagIds)
    if (input.mode === 'retail' && promoListSubtotal < minListSubtotalBaht) {
      return {
        productId: L.productId,
        qty: L.qty,
        listSubtotal,
        sellSubtotal: listSubtotal,
        discountPercentApplied: 0,
        note: `ยอดราคาตั้งกลุ่มโปรต่ำกว่า ${minListSubtotalBaht} บาท — ขายราคาตั้ง`,
      }
    }
    const sellSubtotal = Math.round(listSubtotal * (1 - pct / 100) * 100) / 100
    return {
      productId: L.productId,
      qty: L.qty,
      listSubtotal,
      sellSubtotal,
      discountPercentApplied: pct,
    }
  })

  return { promoListSubtotal, tier, lineResults }
}

export {
  DEFAULT_MIN_LIST_SUBTOTAL_BAHT,
  DEFAULT_RETAIL_TIERS,
  DEFAULT_WHOLESALE,
} from '@/features/promotions/stlVolumePromoSettings'
