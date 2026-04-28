const LS_KEY = 'bento.transport.directory.v1'

export const TRANSPORT_DIRECTORY_CHANGED_EVENT = 'bento-transport-directory-changed'

export type TransportDamageRate = {
  small?: number   // % กล่องเล็ก
  normal?: number  // % กล่องกลาง
  large?: number   // % กล่องใหญ่
}

export type TransportCompany = {
  id: string
  name: string
  phone?: string
  contactName?: string
  lineId?: string
  trackingUrl?: string
  notes?: string
  /** ระยะเวลาจัดส่งโดยประมาณ เช่น "1 วัน", "2-3 วัน" — legacy text */
  deliveryDays?: string
  /** จำนวนวันต่ำสุดที่ส่งถึง */
  minDays?: number
  /** จำนวนวันสูงสุดที่ส่งถึง */
  maxDays?: number
  /** อัตราสินค้าเสียหาย/แตก (%) แยกตามขนาดกล่อง */
  damageRatePct?: TransportDamageRate
  /** น้ำหนักสูงสุดต่อกล่อง (กก.) */
  maxWeightKg?: number
  /** รับผิดชอบค่าเสียหาย / มีประกัน */
  claimSupport?: boolean
  /** ระดับค่าบริการ 1–5 (฿ = ถูก, ฿฿฿฿฿ = แพง) */
  costRating?: number
}

function newId(): string {
  return `trn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const SEED: TransportCompany[] = [
  { id: 'trn-nim', name: 'NIM Express' },
  { id: 'trn-kerry', name: 'Kerry Express', phone: '1217' },
  { id: 'trn-flash', name: 'Flash Express', phone: '02-056-5656' },
  { id: 'trn-jt', name: 'J&T Express', phone: '02-068-9898' },
  { id: 'trn-pl', name: 'PL ขนส่ง' },
]

function optTrim(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t || undefined
}

function optNum(v: unknown): number | undefined {
  const n = Number(v)
  return v !== null && v !== '' && !Number.isNaN(n) && n >= 0 ? n : undefined
}

function normalizeDamageRate(v: unknown): TransportDamageRate | undefined {
  if (!v || typeof v !== 'object') return undefined
  const o = v as Record<string, unknown>
  const result: TransportDamageRate = {}
  const s = optNum(o.small); if (s !== undefined) result.small = Math.min(100, s)
  const n = optNum(o.normal); if (n !== undefined) result.normal = Math.min(100, n)
  const l = optNum(o.large); if (l !== undefined) result.large = Math.min(100, l)
  return Object.keys(result).length > 0 ? result : undefined
}

function normalize(v: unknown): TransportCompany | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : ''
  const name = typeof o.name === 'string' ? o.name.trim() : ''
  if (!id || !name) return null
  const costRating = typeof o.costRating === 'number' && o.costRating >= 1 && o.costRating <= 5
    ? Math.round(o.costRating)
    : undefined
  return {
    id,
    name,
    phone: optTrim(o.phone),
    contactName: optTrim(o.contactName),
    lineId: optTrim(o.lineId),
    trackingUrl: optTrim(o.trackingUrl),
    notes: optTrim(o.notes),
    deliveryDays: optTrim(o.deliveryDays),
    minDays: optNum(o.minDays),
    maxDays: optNum(o.maxDays),
    damageRatePct: normalizeDamageRate(o.damageRatePct),
    maxWeightKg: optNum(o.maxWeightKg),
    claimSupport: typeof o.claimSupport === 'boolean' ? o.claimSupport : undefined,
    costRating,
  }
}

export function loadTransportDirectory(): TransportCompany[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) {
      localStorage.setItem(LS_KEY, JSON.stringify(SEED))
      return [...SEED]
    }
    const list = JSON.parse(raw) as unknown
    if (!Array.isArray(list) || list.length === 0) {
      localStorage.setItem(LS_KEY, JSON.stringify(SEED))
      return [...SEED]
    }
    return list.map(normalize).filter((x): x is TransportCompany => x !== null)
  } catch {
    return [...SEED]
  }
}

function saveList(list: TransportCompany[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent(TRANSPORT_DIRECTORY_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}

export function upsertTransportCompany(c: TransportCompany): void {
  const list = loadTransportDirectory()
  const idx = list.findIndex((x) => x.id === c.id)
  if (idx >= 0) {
    list[idx] = c
  } else {
    list.push(c)
  }
  saveList(list)
}

export function deleteTransportCompany(id: string): void {
  saveList(loadTransportDirectory().filter((x) => x.id !== id))
}

export function createTransportCompany(partial: Omit<TransportCompany, 'id'>): TransportCompany {
  const c: TransportCompany = {
    id: newId(),
    name: partial.name.trim(),
    phone: partial.phone?.trim() || undefined,
    contactName: partial.contactName?.trim() || undefined,
    lineId: partial.lineId?.trim() || undefined,
    trackingUrl: partial.trackingUrl?.trim() || undefined,
    notes: partial.notes?.trim() || undefined,
    deliveryDays: partial.deliveryDays?.trim() || undefined,
    minDays: partial.minDays,
    maxDays: partial.maxDays,
    damageRatePct: partial.damageRatePct,
    maxWeightKg: partial.maxWeightKg,
    claimSupport: partial.claimSupport,
    costRating: partial.costRating,
  }
  upsertTransportCompany(c)
  return c
}
