const STORAGE_KEY = 'bento_inventory_columns_v2'

export type InventoryColumnKey =
  | 'thumb'
  | 'sku'
  | 'genuine'
  | 'oem'
  | 'name'
  | 'brand'
  | 'location'
  | 'stock'
  | 'minStock'
  | 'maxStock'
  | 'status'
  | 'actions'

export const INVENTORY_COLUMN_ORDER: InventoryColumnKey[] = [
  'thumb',
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
  'actions',
]

export const INVENTORY_COLUMN_LABELS: Record<InventoryColumnKey, string> = {
  thumb: 'รูปภาพ',
  sku: 'รหัสสินค้า',
  genuine: 'เบอร์แท้',
  oem: 'เบอร์โรงงาน',
  name: 'ชื่อสินค้า',
  brand: 'แบรนด์',
  location: 'ตำแหน่งที่เก็บ',
  stock: 'สต็อกคงเหลือ',
  minStock: 'สต็อกขั้นต่ำ (Low)',
  maxStock: 'สต็อกสูงสุด (High)',
  status: 'สถานะ',
  actions: 'การดำเนินการ',
}

export const DEFAULT_INVENTORY_COLUMN_VISIBILITY: Record<InventoryColumnKey, boolean> = {
  thumb: true,
  sku: true,
  genuine: true,
  oem: true,
  name: true,
  brand: true,
  location: true,
  stock: true,
  minStock: true,
  maxStock: true,
  status: true,
  actions: true,
}

export function loadColumnVisibility(): Record<InventoryColumnKey, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_INVENTORY_COLUMN_VISIBILITY }
    const parsed = JSON.parse(raw) as Partial<Record<InventoryColumnKey, boolean>>
    return { ...DEFAULT_INVENTORY_COLUMN_VISIBILITY, ...parsed }
  } catch {
    return { ...DEFAULT_INVENTORY_COLUMN_VISIBILITY }
  }
}

export function saveColumnVisibility(v: Record<InventoryColumnKey, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
}
