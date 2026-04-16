import type { InventoryColumnKey } from '@/features/inventory/data/inventoryColumns'
import type { InventoryProduct } from '@/features/inventory/data/mockInventory'

/** คอลัมน์ที่เรียงได้ (ไม่รวมรูป / การดำเนินการ) */
export type SortableColumnKey = Exclude<InventoryColumnKey, 'thumb' | 'actions'>

export const SORTABLE_COLUMN_KEYS: SortableColumnKey[] = [
  'sku',
  'genuine',
  'oem',
  'name',
  'brand',
  'location',
  'stock',
  'minStock',
  'maxStock',
  'status',
]

export type SortRule = {
  key: SortableColumnKey
  dir: 'asc' | 'desc'
}

const SORT_STORAGE = 'bento_inventory_sort_v1'

export const DEFAULT_SORT_RULES: SortRule[] = [{ key: 'sku', dir: 'asc' }]

export function loadSortRules(): SortRule[] {
  try {
    const raw = localStorage.getItem(SORT_STORAGE)
    if (!raw) return [...DEFAULT_SORT_RULES]
    const parsed = JSON.parse(raw) as SortRule[]
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_SORT_RULES]
    return parsed.filter(
      (r) => r && SORTABLE_COLUMN_KEYS.includes(r.key) && (r.dir === 'asc' || r.dir === 'desc'),
    )
  } catch {
    return [...DEFAULT_SORT_RULES]
  }
}

export function saveSortRules(rules: SortRule[]) {
  localStorage.setItem(SORT_STORAGE, JSON.stringify(rules))
}

function getComparable(p: InventoryProduct, key: SortableColumnKey): string | number {
  switch (key) {
    case 'sku':
      return p.sku.toLowerCase()
    case 'genuine':
      return p.genuineNo.toLowerCase()
    case 'oem':
      return p.factoryOem.toLowerCase()
    case 'name':
      return p.name.toLowerCase()
    case 'brand':
      return p.brand.toLowerCase()
    case 'location':
      return p.location.toLowerCase()
    case 'stock':
      return p.stock
    case 'minStock':
      return p.minStock
    case 'maxStock':
      return p.maxStock ?? 0
    case 'status': {
      const low = p.stock < p.minStock
      const over = (p.maxStock ?? 0) > 0 && p.stock > (p.maxStock ?? 0)
      if (low) return 0
      if (over) return 2
      return 1
    }
    default:
      return ''
  }
}

function compareOne(a: InventoryProduct, b: InventoryProduct, key: SortableColumnKey, dir: 'asc' | 'desc'): number {
  const va = getComparable(a, key)
  const vb = getComparable(b, key)
  const mul = dir === 'desc' ? -1 : 1
  if (typeof va === 'number' && typeof vb === 'number') {
    return (va - vb) * mul
  }
  return String(va).localeCompare(String(vb), 'th', { numeric: true, sensitivity: 'base' }) * mul
}

export function sortProducts(list: InventoryProduct[], rules: SortRule[]): InventoryProduct[] {
  if (rules.length === 0) return [...list]
  return [...list].sort((a, b) => {
    for (const r of rules) {
      const c = compareOne(a, b, r.key, r.dir)
      if (c !== 0) return c
    }
    return 0
  })
}

/** คลิกหัวตาราง: ถ้าเป็นคอลัมน์เดิมที่เรียงลำดับแรก → สลับ asc/desc มิฉะนั้นตั้งลำดับแรกเป็นคอลัมน์นี้ asc */
export function toggleHeaderSort(prev: SortRule[], key: SortableColumnKey): SortRule[] {
  if (prev.length === 1 && prev[0].key === key) {
    return [{ key, dir: prev[0].dir === 'asc' ? 'desc' : 'asc' }]
  }
  return [{ key, dir: 'asc' }]
}
