/**
 * ระบบสะสมแต้ม / แลกแต้ม สำหรับลูกค้า B2C เท่านั้น
 *
 * Why: B2B ใช้ tier discount แทนแต้ม (ดู customerTiersStore.ts) — ระบบนี้กันเฉพาะ b2c/vip
 */

export type LoyaltyConfig = {
  /** ใช้กี่บาทต่อ 1 แต้ม เช่น 25 = ซื้อทุก 25 บาท ได้ 1 แต้ม */
  bahtPerPointEarned: number
  /** 1 แต้มแลกได้กี่บาท เช่น 0.1 = 100 แต้ม → 10 บาท */
  bahtPerPointRedeemed: number
  /** ขั้นต่ำที่จะแลกได้ในบิลเดียว */
  minPointsPerRedeem: number
  /** ส่วนลดจากแต้มห้ามเกิน X% ของยอดบิล (กันเอาแต้มจ่ายทั้งบิล) */
  maxRedeemPercentOfBill: number
  /** แต้มหมดอายุภายใน X เดือนนับจากวันได้ (0 = ไม่หมดอายุ) */
  expiryMonths: number
  /** ปัดเศษแต้มที่ได้: floor (ตัดทิ้ง) | round (ปกติ) */
  earnRounding: 'floor' | 'round'
}

const LS_KEY = 'bento.settings.loyalty.v1'

export const LOYALTY_CHANGED_EVENT = 'bento:loyalty:changed'

const DEFAULT_CONFIG: LoyaltyConfig = {
  bahtPerPointEarned: 25,
  bahtPerPointRedeemed: 0.1,
  minPointsPerRedeem: 100,
  maxRedeemPercentOfBill: 50,
  expiryMonths: 12,
  earnRounding: 'floor',
}

function normalizeConfig(raw: unknown): LoyaltyConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_CONFIG }
  const r = raw as Record<string, unknown>
  return {
    bahtPerPointEarned: Number(r.bahtPerPointEarned) > 0 ? Number(r.bahtPerPointEarned) : DEFAULT_CONFIG.bahtPerPointEarned,
    bahtPerPointRedeemed: Number(r.bahtPerPointRedeemed) > 0 ? Number(r.bahtPerPointRedeemed) : DEFAULT_CONFIG.bahtPerPointRedeemed,
    minPointsPerRedeem: Number(r.minPointsPerRedeem) >= 0 ? Math.floor(Number(r.minPointsPerRedeem)) : DEFAULT_CONFIG.minPointsPerRedeem,
    maxRedeemPercentOfBill: Number(r.maxRedeemPercentOfBill) > 0 && Number(r.maxRedeemPercentOfBill) <= 100
      ? Number(r.maxRedeemPercentOfBill)
      : DEFAULT_CONFIG.maxRedeemPercentOfBill,
    expiryMonths: Number(r.expiryMonths) >= 0 ? Math.floor(Number(r.expiryMonths)) : DEFAULT_CONFIG.expiryMonths,
    earnRounding: r.earnRounding === 'round' ? 'round' : 'floor',
  }
}

export function loadLoyaltyConfig(): LoyaltyConfig {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { ...DEFAULT_CONFIG }
    return normalizeConfig(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveLoyaltyConfig(config: LoyaltyConfig): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(config))
    window.dispatchEvent(new CustomEvent(LOYALTY_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}

/** ลูกค้า B2C / VIP เท่านั้นที่ได้/ใช้แต้ม */
export function customerTypeEarnsPoints(customerType: string): boolean {
  return customerType === 'b2c' || customerType === 'vip'
}

/** คำนวณแต้มที่จะได้จากยอดสุทธิหลังหักส่วนลดทั้งหมด (ก่อน VAT include หรือ exclude) */
export function calcEarnedPoints(billNetBaht: number, config: LoyaltyConfig = loadLoyaltyConfig()): number {
  if (billNetBaht <= 0 || config.bahtPerPointEarned <= 0) return 0
  const raw = billNetBaht / config.bahtPerPointEarned
  return config.earnRounding === 'round' ? Math.round(raw) : Math.floor(raw)
}

/** คำนวณส่วนลด (บาท) จากจำนวนแต้มที่จะใช้ */
export function pointsToBaht(points: number, config: LoyaltyConfig = loadLoyaltyConfig()): number {
  if (points <= 0) return 0
  return Math.round(points * config.bahtPerPointRedeemed * 100) / 100
}

/** หา max แต้มที่ลูกค้าจะใช้ได้ ตาม balance + ยอดบิล + กฎ */
export function maxRedeemablePoints(
  available: number,
  billGrandTotalBaht: number,
  config: LoyaltyConfig = loadLoyaltyConfig(),
): number {
  if (available < config.minPointsPerRedeem) return 0
  const cap = (billGrandTotalBaht * config.maxRedeemPercentOfBill) / 100
  const maxByBill = Math.floor(cap / config.bahtPerPointRedeemed)
  return Math.max(0, Math.min(available, maxByBill))
}

export type RedeemValidation =
  | { ok: true; discountBaht: number }
  | { ok: false; reason: string }

export function validateRedeem(
  points: number,
  available: number,
  billGrandTotalBaht: number,
  config: LoyaltyConfig = loadLoyaltyConfig(),
): RedeemValidation {
  if (points <= 0) return { ok: false, reason: 'ใส่จำนวนแต้มที่จะใช้' }
  if (!Number.isInteger(points)) return { ok: false, reason: 'จำนวนแต้มต้องเป็นจำนวนเต็ม' }
  if (points < config.minPointsPerRedeem) return { ok: false, reason: `ขั้นต่ำ ${config.minPointsPerRedeem} แต้ม` }
  if (points > available) return { ok: false, reason: `แต้มไม่พอ (มี ${available.toLocaleString('th-TH')})` }
  const max = maxRedeemablePoints(available, billGrandTotalBaht, config)
  if (points > max) {
    return { ok: false, reason: `ใช้ได้ไม่เกิน ${max.toLocaleString('th-TH')} แต้ม (จำกัด ${config.maxRedeemPercentOfBill}% ของบิล)` }
  }
  return { ok: true, discountBaht: pointsToBaht(points, config) }
}
