import type { TaxInvoiceCanvasElement } from '@/features/inventory/data/taxInvoiceFormDesignerStore'

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi)
}

/** จำกัดตำแหน่ง X (% ในพื้นที่พิมพ์) ให้คอลัมน์ในกลุ่มเดียวกันไม่ทับ — ชิดขอบซ้าย/ขวาของเพื่อนบ้าน */
export function clampLineColumnXPct(
  group: readonly TaxInvoiceCanvasElement[],
  selfId: string,
  nx: number,
): number {
  const self = group.find((e) => e.id === selfId)
  if (!self || self.field !== 'line_column') {
    const w = self?.w ?? 0
    return clamp(nx, 0, 100 - w)
  }
  const w = self.w

  const ordered = [...group].sort((a, b) => {
    const ax = a.id === selfId ? nx : a.x
    const bx = b.id === selfId ? nx : b.x
    const d = ax - bx
    if (Math.abs(d) < 1e-9) return a.id.localeCompare(b.id)
    return d
  })
  const idx = ordered.findIndex((e) => e.id === selfId)
  if (idx < 0) return clamp(nx, 0, 100 - w)

  const leftBound = idx > 0 ? ordered[idx - 1]!.x + ordered[idx - 1]!.w : 0
  const rightEdge = idx < ordered.length - 1 ? ordered[idx + 1]!.x : 100
  const hi = rightEdge - w
  if (hi < leftBound) return clamp(leftBound, 0, 100 - w)
  return clamp(nx, leftBound, hi)
}

/** จำกัดความกว้าง W ไม่ให้ล้ำเข้าเพื่อนขวา (ขอบขวาสุดชิด x ของเพื่อนหรือ 100%) */
export function clampLineColumnWPct(
  group: readonly TaxInvoiceCanvasElement[],
  selfId: string,
  nw: number,
): number {
  const self = group.find((e) => e.id === selfId)
  if (!self || self.field !== 'line_column') return nw
  const x = self.x
  const minW = 0.5
  const ordered = [...group].sort((a, b) => a.x - b.x || a.id.localeCompare(b.id))
  const idx = ordered.findIndex((e) => e.id === selfId)
  const rightNeighborX = idx < ordered.length - 1 ? ordered[idx + 1]!.x : 100
  const maxW = Math.max(minW, rightNeighborX - x)
  return clamp(nw, minW, maxW)
}
