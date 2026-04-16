/**
 * เข้ารหัสราคา 2 ช่วงบนป้าย: เลือกได้ว่าช่วงแรก/หลังจะอิงราคาระดับใด (ทุน / ปลีก / ช่าง / ส่ง / VIP / พิเศษ)
 * แต่ละช่วงใช้แผนที่ 10 ตัวอักษรแทนเลข 0–9
 */

/** ลำดับตรงกับแถวราคาขายในฟอร์มสินค้า: ปลีก, ช่าง, ส่ง, vip, พิเศษ */
export type PriceCipherSlot = 'cost' | 'retail' | 'mechanic' | 'wholesale' | 'vip' | 'special'

export const PRICE_CIPHER_SLOTS: PriceCipherSlot[] = [
  'cost',
  'retail',
  'mechanic',
  'wholesale',
  'vip',
  'special',
]

export const PRICE_CIPHER_SLOT_LABELS: Record<PriceCipherSlot, string> = {
  cost: 'ราคาทุน',
  retail: 'ราคาปลีก',
  mechanic: 'ราคาช่าง',
  wholesale: 'ราคาส่ง',
  vip: 'ราคา VIP',
  special: 'ราคาพิเศษ',
}

/** ตัวเลือกดรอปดาวน์ 1–6 ตามที่ผู้ใช้กำหนด */
export const PRICE_CIPHER_SLOT_OPTIONS: { value: PriceCipherSlot; label: string }[] = [
  { value: 'cost', label: '1. ราคาทุน' },
  { value: 'retail', label: '2. ราคาปลีก' },
  { value: 'mechanic', label: '3. ราคาช่าง' },
  { value: 'wholesale', label: '4. ราคาส่ง' },
  { value: 'vip', label: '5. ราคา VIP' },
  { value: 'special', label: '6. ราคาพิเศษ' },
]

export type PriceCipherMoney = {
  /** ทุนต่อหน่วยฐาน (บาท) */
  costBaht: number
  /** ราคาขายหน่วยฐานต่อระดับ [ปลีก, ช่าง, ส่ง, vip, พิเศษ] */
  tiers: [number, number, number, number, number]
  /**
   * เมื่อไม่มีข้อมูลระดับปลีกในแฟ้มสินค้า ใช้ราคานี้แทน (เช่น ราคาจากคิว / sellPrice หลัก)
   */
  fallbackRetailBaht: number
}

/** ตัวอย่างในหน้าตั้งค่า — ทุน 50, ปลีก 100 … พิเศษ 60 */
export const PRICE_CIPHER_PREVIEW_DEMO_MONEY: PriceCipherMoney = {
  costBaht: 50,
  tiers: [100, 90, 80, 70, 60],
  fallbackRetailBaht: 100,
}

export type PriceCipherSettings = {
  /** ตัวนำหน้าสุด 1 ตัว */
  leading1: string
  /** ช่วงแรกอิงราคาระดับใด */
  costSlot: PriceCipherSlot
  /** แผนที่ 10 ตัวแทน 0–9 สำหรับช่วงแรก */
  costDigitMap: string
  /** ตัวคั่นระหว่างสองช่วง 1 ตัว */
  separator: string
  /** ช่วงหลังอิงราคาระดับใด */
  sellSlot: PriceCipherSlot
  /** แผนที่ 10 ตัวสำหรับช่วงหลัง */
  sellDigitMap: string
}

export const DEFAULT_PRICE_CIPHER_SETTINGS: PriceCipherSettings = {
  leading1: '',
  costSlot: 'cost',
  costDigitMap: '',
  separator: '/',
  sellSlot: 'retail',
  sellDigitMap: '',
}

function normSlot(x: unknown, fallback: PriceCipherSlot): PriceCipherSlot {
  return typeof x === 'string' && (PRICE_CIPHER_SLOTS as string[]).includes(x)
    ? (x as PriceCipherSlot)
    : fallback
}

/** แปลงจำนวนเงินบาทเป็นหลักตัวเลข — เฉพาะจำนวนเต็มบาท (ปัดครึ่ง) */
export function bahtToDigitString(amount: number): string {
  const whole = Math.max(0, Math.round(amount))
  return String(whole)
}

export function bahtForCipherSlot(m: PriceCipherMoney, slot: PriceCipherSlot): number {
  switch (slot) {
    case 'cost':
      return Math.max(0, Math.round(m.costBaht))
    case 'retail': {
      const v = m.tiers[0]
      if (v > 0) return Math.round(v)
      return Math.max(0, Math.round(m.fallbackRetailBaht))
    }
    case 'mechanic':
      return Math.max(0, Math.round(m.tiers[1]))
    case 'wholesale':
      return Math.max(0, Math.round(m.tiers[2]))
    case 'vip':
      return Math.max(0, Math.round(m.tiers[3]))
    case 'special':
      return Math.max(0, Math.round(m.tiers[4]))
    default:
      return 0
  }
}

/** ใช้เฉพาะแผนที่ที่ผู้ใช้กรอกในโปรแกรม (สูงสุด 10 ตัว) */
function digitMapForEncoding(map: string): string {
  return (map ?? '').slice(0, 10)
}

/** เข้ารหัสได้ต่อเมื่อแผนที่มีครบ 10 ตัวเท่านั้น */
export function encodeDigitsWithMap(digitStr: string, map10: string): string {
  const map = digitMapForEncoding(map10)
  if (map.length !== 10) return ''
  let out = ''
  for (const ch of digitStr) {
    if (ch >= '0' && ch <= '9') {
      const raw = ch.charCodeAt(0) - 48
      const d = raw === 0 ? 9 : raw - 1 // 0 แทน 9
      out += map[d] ?? ''
    }
  }
  return out
}

export function buildPriceCipherLine(money: PriceCipherMoney, s: PriceCipherSettings): string {
  const n = normalizePriceCipherSettings(s)
  const a = bahtForCipherSlot(money, n.costSlot)
  const b = bahtForCipherSlot(money, n.sellSlot)
  const left = encodeDigitsWithMap(bahtToDigitString(a), n.costDigitMap)
  const right = encodeDigitsWithMap(bahtToDigitString(b), n.sellDigitMap)
  const lead = (n.leading1 ?? '').slice(0, 1)
  const sep = (n.separator ?? '').slice(0, 1)
  return `${lead}${left}${sep}${right}`
}

/** อ่านแผนที่จาก partial — ถ้ามีคีย์ชัดเจน (รวมสตริงว่าง) ใช้ค่านั้น ไม่เติม default ทับ */
function pickDigitMap(
  p: Partial<PriceCipherSettings> | null | undefined,
  key: 'costDigitMap' | 'sellDigitMap',
  def: string,
): string {
  if (p == null) return def
  if (!Object.prototype.hasOwnProperty.call(p, key)) return def
  const v = p[key]
  return typeof v === 'string' ? v.slice(0, 10) : def
}

export function normalizePriceCipherSettings(p: Partial<PriceCipherSettings> | null | undefined): PriceCipherSettings {
  const def = DEFAULT_PRICE_CIPHER_SETTINGS
  const pAny = p as { leading2?: string } | null | undefined
  const combinedLead = `${typeof p?.leading1 === 'string' ? p.leading1 : ''}${typeof pAny?.leading2 === 'string' ? pAny.leading2 : ''}`

  return {
    leading1: combinedLead.slice(0, 1),
    costSlot: normSlot(p?.costSlot, def.costSlot),
    costDigitMap: pickDigitMap(p, 'costDigitMap', def.costDigitMap),
    separator: typeof p?.separator === 'string' ? p.separator.slice(0, 1) : def.separator,
    sellSlot: normSlot(p?.sellSlot, def.sellSlot),
    sellDigitMap: pickDigitMap(p, 'sellDigitMap', def.sellDigitMap),
  }
}

export function exampleCipherPreview(s: PriceCipherSettings): {
  line: string
  firstBaht: number
  secondBaht: number
  firstSlot: PriceCipherSlot
  secondSlot: PriceCipherSlot
  firstDigits: string
  secondDigits: string
} {
  const ns = normalizePriceCipherSettings(s)
  const m = PRICE_CIPHER_PREVIEW_DEMO_MONEY
  const firstBaht = bahtForCipherSlot(m, ns.costSlot)
  const secondBaht = bahtForCipherSlot(m, ns.sellSlot)
  return {
    line: buildPriceCipherLine(m, ns),
    firstBaht,
    secondBaht,
    firstSlot: ns.costSlot,
    secondSlot: ns.sellSlot,
    firstDigits: bahtToDigitString(firstBaht),
    secondDigits: bahtToDigitString(secondBaht),
  }
}
