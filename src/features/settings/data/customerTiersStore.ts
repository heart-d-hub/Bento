import type { MemberPriceTier } from '@/features/members/data/memberTypes'

export type B2bTier = 'silver' | 'gold' | 'platinum'

export type DiscountRuleType = 'category' | 'brand'

export type DiscountRule = {
  id: string
  type: DiscountRuleType
  value: string
  discountPercent: number
}

export type B2bTierConfig = {
  tier: B2bTier
  label: string
  description: string
  /** Price tier ที่ใช้เป็น base สำหรับลูกค้า B2B tier นี้ */
  defaultPriceTier: MemberPriceTier
  /** Rules เพิ่มเติม — หักเพิ่มจาก base price ต่อ line item ตามหมวด/แบรนด์ */
  discountRules: DiscountRule[]
  creditLimitBaht: number
  creditTermDays: number
  payAtMonthEnd: boolean
}

export type CustomerTiersConfig = {
  b2bTiers: B2bTierConfig[]
}

const LS_KEY = 'bento.settings.customerTiers.v2'

const DEFAULT_TIERS: B2bTierConfig[] = [
  {
    tier: 'silver',
    label: 'Silver',
    description: 'ร้านซ่อมทั่วไป',
    defaultPriceTier: 'tier2',
    discountRules: [],
    creditLimitBaht: 10000,
    creditTermDays: 0,
    payAtMonthEnd: false,
  },
  {
    tier: 'gold',
    label: 'Gold',
    description: 'ร้านประจำ',
    defaultPriceTier: 'tier3',
    discountRules: [],
    creditLimitBaht: 30000,
    creditTermDays: 15,
    payAtMonthEnd: false,
  },
  {
    tier: 'platinum',
    label: 'Platinum',
    description: 'ตัวแทนหลัก',
    defaultPriceTier: 'tier4',
    discountRules: [],
    creditLimitBaht: 100000,
    creditTermDays: 30,
    payAtMonthEnd: true,
  },
]

export const CUSTOMER_TIERS_CHANGED = 'bento:customerTiers:changed'

function normalizeTier(raw: unknown): B2bTierConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.tier !== 'string') return null
  const def = DEFAULT_TIERS.find((t) => t.tier === r.tier)
  if (!def) return null
  return {
    tier: r.tier as B2bTier,
    label: typeof r.label === 'string' ? r.label : def.label,
    description: typeof r.description === 'string' ? r.description : def.description,
    defaultPriceTier: (typeof r.defaultPriceTier === 'string' ? r.defaultPriceTier : def.defaultPriceTier) as MemberPriceTier,
    discountRules: Array.isArray(r.discountRules)
      ? (r.discountRules as DiscountRule[]).filter(
          (x) => x && typeof x.id === 'string' && typeof x.type === 'string' && typeof x.value === 'string' && typeof x.discountPercent === 'number',
        )
      : [],
    creditLimitBaht: Number(r.creditLimitBaht) || def.creditLimitBaht,
    creditTermDays: Number(r.creditTermDays) || def.creditTermDays,
    payAtMonthEnd: Boolean(r.payAtMonthEnd),
  }
}

export function loadCustomerTiers(): CustomerTiersConfig {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { b2bTiers: DEFAULT_TIERS }
    const parsed = JSON.parse(raw) as Partial<CustomerTiersConfig>
    if (!Array.isArray(parsed.b2bTiers)) return { b2bTiers: DEFAULT_TIERS }
    const tiers = parsed.b2bTiers.map(normalizeTier).filter((t): t is B2bTierConfig => Boolean(t))
    if (tiers.length !== 3) return { b2bTiers: DEFAULT_TIERS }
    return { b2bTiers: tiers }
  } catch {
    return { b2bTiers: DEFAULT_TIERS }
  }
}

export function saveCustomerTiers(config: CustomerTiersConfig): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(config))
    window.dispatchEvent(new CustomEvent(CUSTOMER_TIERS_CHANGED))
  } catch { /* ignore */ }
}

export function getB2bTierConfig(tier: B2bTier): B2bTierConfig {
  return loadCustomerTiers().b2bTiers.find((t) => t.tier === tier) ?? DEFAULT_TIERS.find((t) => t.tier === tier)!
}

/**
 * หา discount % ที่ควรหักสำหรับ product นี้ตาม rules ของ tier
 * คืนค่า { discountPercent, ruleLabel } ของ rule แรกที่ match
 * คืน null ถ้าไม่มี rule match
 */
export function resolveB2bLineDiscount(
  tier: B2bTier,
  productCategory: string,
  productBrand: string,
): { discountPercent: number; ruleLabel: string } | null {
  const cfg = getB2bTierConfig(tier)
  for (const rule of cfg.discountRules) {
    if (rule.discountPercent <= 0) continue
    const val = rule.value.trim().toLowerCase()
    if (!val) continue
    if (rule.type === 'category' && productCategory.trim().toLowerCase() === val) {
      return { discountPercent: rule.discountPercent, ruleLabel: `${cfg.label} · ${rule.value} −${rule.discountPercent}%` }
    }
    if (rule.type === 'brand' && productBrand.trim().toLowerCase() === val) {
      return { discountPercent: rule.discountPercent, ruleLabel: `${cfg.label} · ${rule.value} −${rule.discountPercent}%` }
    }
  }
  return null
}

export const B2B_TIER_ORDER: B2bTier[] = ['silver', 'gold', 'platinum']

export const B2B_TIER_COLORS: Record<B2bTier, { badge: string; dot: string }> = {
  silver:   { badge: 'bg-slate-100 text-slate-700 ring-1 ring-slate-300', dot: 'bg-slate-400' },
  gold:     { badge: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300', dot: 'bg-amber-400' },
  platinum: { badge: 'bg-violet-100 text-violet-800 ring-1 ring-violet-300', dot: 'bg-violet-500' },
}

export const PRICE_TIER_LABELS: Record<MemberPriceTier, string> = {
  tier1: 'tier1 — ราคาปลีก',
  tier2: 'tier2 — ราคาช่าง',
  tier3: 'tier3 — ราคาส่ง',
  tier4: 'tier4 — ราคา VIP',
  tier5: 'tier5 — ราคาพิเศษ',
}
