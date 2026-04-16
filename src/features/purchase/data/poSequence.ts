import type { BranchId } from '@/features/auth/branches'

const LS_KEY = 'bento.purchase.poSeq.v1'

function loadMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return {}
    const o = JSON.parse(raw) as unknown
    if (o && typeof o === 'object' && !Array.isArray(o)) return o as Record<string, number>
  } catch {
    /* ignore */
  }
  return {}
}

function saveMap(m: Record<string, number>): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(m))
  } catch {
    /* ignore */
  }
}

/** เลขที่ PO เช่น PO-SOM-2026-0001 */
export function nextPurchaseOrderNo(branchId: BranchId, d: Date = new Date()): string {
  const y = d.getFullYear()
  const key = `${branchId}-${y}`
  const map = loadMap()
  const prev = map[key]
  const next = Number.isFinite(prev) && prev >= 1 ? prev + 1 : 1
  map[key] = next
  saveMap(map)
  const branchTag = String(branchId)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5) || 'BR'
  const seq = String(next).padStart(4, '0')
  return `PO-${branchTag}-${y}-${seq}`
}
