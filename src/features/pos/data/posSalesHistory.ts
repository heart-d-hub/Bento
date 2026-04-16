import type { PaymentMethodId } from '@/features/pos/data/placeholders'

export type PosSaleLine = {
  productId: string
  sku?: string
  name: string
  qty: number
  unitPrice?: number
}

export type PosSaleRecord = {
  id: string
  billNo: string
  at: string
  total: number
  paymentId: PaymentMethodId
  lineCount: number
  /** รายการสินค้า (สำหรับสถิติแดชบอร์ด — บันทึกหลังเวอร์ชันนี้) */
  lines?: PosSaleLine[]
}

/** แจ้ง UI อื่น (เช่น แดชบอร์ด) ให้รีเฟรชหลังบันทึกการขาย */
export const POS_SALE_RECORDED_EVENT = 'bento-pos-sale-recorded'

const HISTORY_KEY = 'bento.pos.salesHistory.v1'
const MAX = 80

export function appendSale(record: Omit<PosSaleRecord, 'id'>): PosSaleRecord {
  const id = `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const full: PosSaleRecord = { ...record, id }
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const list: PosSaleRecord[] = raw ? JSON.parse(raw) : []
    list.unshift(full)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX)))
  } catch {
    // ignore
  }
  return full
}

export function loadRecentSales(): PosSaleRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PosSaleRecord[]
  } catch {
    return []
  }
}

function isSameLocalDay(iso: string, ref: Date): boolean {
  const d = new Date(iso)
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  )
}

export function getTodaySalesSummary(ref: Date = new Date()): { count: number; totalBaht: number } {
  const sales = loadRecentSales().filter((s) => isSameLocalDay(s.at, ref))
  return {
    count: sales.length,
    totalBaht: Math.round(sales.reduce((sum, s) => sum + s.total, 0) * 100) / 100,
  }
}

export function getTopProductsByQty(limit: number): { name: string; qty: number }[] {
  const sales = loadRecentSales()
  const map = new Map<string, { name: string; qty: number }>()
  for (const s of sales) {
    if (!s.lines?.length) continue
    for (const line of s.lines) {
      const cur = map.get(line.productId) ?? { name: line.name, qty: 0 }
      cur.qty += line.qty
      map.set(line.productId, cur)
    }
  }
  return [...map.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit)
}
