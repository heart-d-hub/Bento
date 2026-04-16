import type { CrossBranchStockRow } from '@/features/inventory/data/productMasterData'

export type CrossBranchSortKey = 'location' | 'stock' | 'position' | 'status'

export const CROSS_BRANCH_SORT_KEYS: CrossBranchSortKey[] = [
  'location',
  'stock',
  'position',
  'status',
]

export const CROSS_BRANCH_SORT_LABELS: Record<CrossBranchSortKey, string> = {
  location: 'สถานที่',
  stock: 'สต็อกคงเหลือ',
  position: 'ตำแหน่ง',
  status: 'สถานะ',
}

export type CrossBranchSortRule = {
  key: CrossBranchSortKey
  dir: 'asc' | 'desc'
}

const STORAGE = 'bento_cross_branch_sort_v1'

export const DEFAULT_CROSS_BRANCH_SORT_RULES: CrossBranchSortRule[] = [
  { key: 'location', dir: 'asc' },
]

export function loadCrossBranchSortRules(): CrossBranchSortRule[] {
  try {
    const raw = localStorage.getItem(STORAGE)
    if (!raw) return [...DEFAULT_CROSS_BRANCH_SORT_RULES]
    const parsed = JSON.parse(raw) as CrossBranchSortRule[]
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_CROSS_BRANCH_SORT_RULES]
    const filtered = parsed.filter(
      (r) => r && CROSS_BRANCH_SORT_KEYS.includes(r.key) && (r.dir === 'asc' || r.dir === 'desc'),
    )
    return filtered.length ? filtered : [...DEFAULT_CROSS_BRANCH_SORT_RULES]
  } catch {
    return [...DEFAULT_CROSS_BRANCH_SORT_RULES]
  }
}

export function saveCrossBranchSortRules(rules: CrossBranchSortRule[]) {
  localStorage.setItem(STORAGE, JSON.stringify(rules))
}

function comparable(row: CrossBranchStockRow, key: CrossBranchSortKey): string | number {
  switch (key) {
    case 'location':
      return row.locationLabel.toLowerCase()
    case 'stock':
      return row.stock
    case 'position':
      return row.position.toLowerCase()
    case 'status':
      return row.status === 'low' ? 0 : 1
    default:
      return ''
  }
}

function compareOne(
  a: CrossBranchStockRow,
  b: CrossBranchStockRow,
  key: CrossBranchSortKey,
  dir: 'asc' | 'desc',
): number {
  const va = comparable(a, key)
  const vb = comparable(b, key)
  const mul = dir === 'desc' ? -1 : 1
  if (typeof va === 'number' && typeof vb === 'number') {
    return (va - vb) * mul
  }
  return String(va).localeCompare(String(vb), 'th', { numeric: true, sensitivity: 'base' }) * mul
}

export function sortCrossBranchRows(
  list: CrossBranchStockRow[],
  rules: CrossBranchSortRule[],
): CrossBranchStockRow[] {
  if (rules.length === 0) return [...list]
  return [...list].sort((a, b) => {
    for (const r of rules) {
      const c = compareOne(a, b, r.key, r.dir)
      if (c !== 0) return c
    }
    return 0
  })
}

export function toggleCrossBranchHeaderSort(
  prev: CrossBranchSortRule[],
  key: CrossBranchSortKey,
): CrossBranchSortRule[] {
  if (prev.length === 1 && prev[0].key === key) {
    return [{ key, dir: prev[0].dir === 'asc' ? 'desc' : 'asc' }]
  }
  return [{ key, dir: 'asc' }]
}
