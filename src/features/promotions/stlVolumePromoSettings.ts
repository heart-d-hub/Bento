/**
 * ตั้งค่าสูตรโปร STL (ราคาตั้ง / ขั้นบันได / ส่ง) — localStorage
 * (type ซ้ำกับ stlVolumePromo.ts — เก็บแยกเพื่อไม่ circular import)
 */

const STORAGE_KEY_V2 = 'bento.stlVolumePromoSettings.v2'
const STORAGE_KEY_V1 = 'bento.stlVolumePromoSettings.v1'
export const STL_PROMO_SETTINGS_CHANGED_EVENT = 'bento-stl-promo-settings-changed'

export type StlRetailTierSettingsRow = {
  minBaht: number
  maxBaht: number | null
  /** ส่วนลด % ต่อ tagId (เช่น bolt-black, bolt-green) */
  discountsByTagId: Record<string, number>
}

export type StlWholesaleSettings = {
  /** ส่วนลด % ต่อ tagId */
  discountsByTagId: Record<string, number>
}

export const DEFAULT_MIN_LIST_SUBTOTAL_BAHT = 20

export const DEFAULT_SELECTED_TAG_IDS = ['bolt-black', 'bolt-green'] as const

export const DEFAULT_RETAIL_TIERS: StlRetailTierSettingsRow[] = [
  {
    minBaht: 20,
    maxBaht: 500,
    discountsByTagId: { 'bolt-black': 50, 'bolt-green': 25 },
  },
]

export const DEFAULT_WHOLESALE: StlWholesaleSettings = {
  discountsByTagId: { 'bolt-black': 63, 'bolt-green': 40 },
}

export type StlVolumePromoSettings = {
  /** รายการแท็กที่เอามาคิดยอดร่วมกัน และเป็นคอลัมน์ส่วนลด */
  selectedTagIds: string[]
  /** ยอดรวมราคาตั้งกลุ่มโปรต่ำกว่านี้ = ไม่ลด (ปลีก) */
  minListSubtotalBaht: number
  retailTiers: StlRetailTierSettingsRow[]
  wholesale: StlWholesaleSettings
}

function normalizeTagIds(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null
  const out = raw
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim())
    .filter(Boolean)
  return out.length > 0 ? [...new Set(out)] : null
}

function normalizeDiscountMap(raw: unknown): Record<string, number> | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(o)) {
    const id = k.trim()
    const n = Number(v)
    if (!id) continue
    if (!Number.isFinite(n) || n < 0 || n > 100) continue
    out[id] = n
  }
  return Object.keys(out).length > 0 ? out : null
}

function normalizeTier(t: unknown): StlRetailTierSettingsRow | null {
  if (!t || typeof t !== 'object') return null
  const o = t as Record<string, unknown>
  const minBaht = Number(o.minBaht)
  const maxRaw = o.maxBaht
  const maxBaht = maxRaw === null || maxRaw === undefined ? null : Number(maxRaw)
  const discountsByTagId = normalizeDiscountMap(o.discountsByTagId)
  if (!Number.isFinite(minBaht) || minBaht < 0) return null
  if (maxBaht !== null && (!Number.isFinite(maxBaht) || maxBaht < minBaht)) return null
  if (!discountsByTagId) return null
  return {
    minBaht,
    maxBaht,
    discountsByTagId,
  }
}

function normalizeWholesale(o: unknown): StlWholesaleSettings | null {
  if (!o || typeof o !== 'object') return null
  const x = o as Record<string, unknown>
  const discountsByTagId = normalizeDiscountMap(x.discountsByTagId)
  if (!discountsByTagId) return null
  return { discountsByTagId }
}

/** รวมค่า raw กับค่าเริ่มต้น — ใช้เมื่อโหลดสูตรจาก registry */
export function mergeSettings(raw: unknown): StlVolumePromoSettings {
  const base: StlVolumePromoSettings = {
    selectedTagIds: [...DEFAULT_SELECTED_TAG_IDS],
    minListSubtotalBaht: DEFAULT_MIN_LIST_SUBTOTAL_BAHT,
    retailTiers: [...DEFAULT_RETAIL_TIERS],
    wholesale: { ...DEFAULT_WHOLESALE },
  }
  if (!raw || typeof raw !== 'object') return base
  const o = raw as Record<string, unknown>

  const sel = normalizeTagIds(o.selectedTagIds)
  if (sel) base.selectedTagIds = sel

  const min = Number(o.minListSubtotalBaht)
  if (Number.isFinite(min) && min >= 0 && min <= 1_000_000) {
    base.minListSubtotalBaht = min
  }
  if (Array.isArray(o.retailTiers)) {
    const tiers = o.retailTiers.map(normalizeTier).filter((x): x is StlRetailTierSettingsRow => x !== null)
    if (tiers.length > 0) base.retailTiers = tiers
  }
  const w = normalizeWholesale(o.wholesale)
  if (w) base.wholesale = w
  return base
}

function migrateV1ToV2(rawV1: unknown): StlVolumePromoSettings {
  // best-effort: map v1 black/green → selectedTagIds (bolt-black/bolt-green)
  const o = (rawV1 && typeof rawV1 === 'object' ? (rawV1 as Record<string, unknown>) : {}) as Record<
    string,
    unknown
  >
  const min = Number(o.minListSubtotalBaht)
  const minListSubtotalBaht =
    Number.isFinite(min) && min >= 0 && min <= 1_000_000 ? min : DEFAULT_MIN_LIST_SUBTOTAL_BAHT

  const tiersRaw = Array.isArray(o.retailTiers) ? o.retailTiers : []
  const migrated =
    tiersRaw.length > 0
      ? tiersRaw
          .map((t): StlRetailTierSettingsRow | null => {
            if (!t || typeof t !== 'object') return null
            const tt = t as Record<string, unknown>
            const minBaht = Number(tt.minBaht)
            const maxRaw = tt.maxBaht
            const maxBaht = maxRaw === null || maxRaw === undefined ? null : Number(maxRaw)
            const b = Number(tt.discountBlackPercent)
            const g = Number(tt.discountGreenPercent)
            if (!Number.isFinite(minBaht) || minBaht < 0) return null
            if (maxBaht !== null && (!Number.isFinite(maxBaht) || maxBaht < minBaht)) return null
            if (!Number.isFinite(b) || b < 0 || b > 100) return null
            if (!Number.isFinite(g) || g < 0 || g > 100) return null
            return {
              minBaht,
              maxBaht,
              discountsByTagId: { 'bolt-black': b, 'bolt-green': g },
            }
          })
          .filter((x): x is StlRetailTierSettingsRow => x !== null)
      : []
  const retailTiers: StlRetailTierSettingsRow[] = migrated.length ? migrated : [...DEFAULT_RETAIL_TIERS]

  const whRaw = o.wholesale && typeof o.wholesale === 'object' ? (o.wholesale as Record<string, unknown>) : {}
  const wb = Number(whRaw.discountBlackPercent)
  const wg = Number(whRaw.discountGreenPercent)
  const wholesale: StlWholesaleSettings =
    Number.isFinite(wb) && wb >= 0 && wb <= 100 && Number.isFinite(wg) && wg >= 0 && wg <= 100
      ? { discountsByTagId: { 'bolt-black': wb, 'bolt-green': wg } }
      : { ...DEFAULT_WHOLESALE }

  return {
    selectedTagIds: [...DEFAULT_SELECTED_TAG_IDS],
    minListSubtotalBaht,
    retailTiers: retailTiers.length ? retailTiers : [...DEFAULT_RETAIL_TIERS],
    wholesale,
  }
}

export function loadStlVolumePromoSettings(): StlVolumePromoSettings {
  try {
    const s2 = localStorage.getItem(STORAGE_KEY_V2)
    if (s2) return mergeSettings(JSON.parse(s2) as unknown)
    const s1 = localStorage.getItem(STORAGE_KEY_V1)
    if (s1) return migrateV1ToV2(JSON.parse(s1) as unknown)
    return {
      selectedTagIds: [...DEFAULT_SELECTED_TAG_IDS],
      minListSubtotalBaht: DEFAULT_MIN_LIST_SUBTOTAL_BAHT,
      retailTiers: [...DEFAULT_RETAIL_TIERS],
      wholesale: { ...DEFAULT_WHOLESALE },
    }
  } catch {
    return {
      selectedTagIds: [...DEFAULT_SELECTED_TAG_IDS],
      minListSubtotalBaht: DEFAULT_MIN_LIST_SUBTOTAL_BAHT,
      retailTiers: [...DEFAULT_RETAIL_TIERS],
      wholesale: { ...DEFAULT_WHOLESALE },
    }
  }
}

export function saveStlVolumePromoSettings(next: StlVolumePromoSettings) {
  const merged = mergeSettings(next)
  localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(merged))
  window.dispatchEvent(new CustomEvent(STL_PROMO_SETTINGS_CHANGED_EVENT))
}

export function getEffectiveRetailTiers(): StlRetailTierSettingsRow[] {
  return loadStlVolumePromoSettings().retailTiers
}

export function getEffectiveWholesale(): StlWholesaleSettings {
  return loadStlVolumePromoSettings().wholesale
}

export function getEffectiveMinListSubtotalBaht(): number {
  return loadStlVolumePromoSettings().minListSubtotalBaht
}

export function getEffectiveSelectedTagIds(): string[] {
  return loadStlVolumePromoSettings().selectedTagIds
}
