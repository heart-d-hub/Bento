/**
 * แท็กสินค้า — ใช้จัดกลุ่มโปร / สายสี (Bolt) / แบ่งขาย (เช่น สายยางอ่อน) ฯลฯ
 * ค่าเริ่มต้น: Bolt + สายยางอ่อน — ร้านเพิ่มแท็กเองได้ (localStorage)
 */

/** แท็กที่ merge จากค่าเริ่มต้นเสมอ — ลบถาวรจาก UI ไม่ได้ */
export const NON_REMOVABLE_PRODUCT_TAG_IDS = new Set([
  'bolt-black',
  'bolt-green',
  'hose-soft',
  'nut-stock',
])

export function isNonRemovableProductTagId(id: string): boolean {
  return NON_REMOVABLE_PRODUCT_TAG_IDS.has(id)
}

const STORAGE_KEY = 'bento.productTagsRegistry.v1'
export const PRODUCT_TAGS_CHANGED_EVENT = 'bento-product-tags-changed'

export type ProductTagDefinition = {
  id: string
  label: string
  /** จัดกลุ่มใน UI */
  group?: 'bolt' | 'stl' | 'general'
  /**
   * หน้า «สินค้าแบ่งขาย»: ถ้าสินค้ามีแท็กนี้และตั้งโหมด ม้วน/กก. ในแฟ้ม — แสดงคอลัมน์ ม้วนเต็ม / ม้วนเปิด / เศษ / รวม / กก.ต่อม้วน
   */
  splitSaleRollColumns?: boolean
  /**
   * หน้าแบ่งขาย (หมวดที่ติดแท็กเดียวกัน): สินค้า กล่อง+เศษ ที่มีแท็กนี้ — แสดงคอลัมน์ เศษตัว / กล่องเต็ม / ชิ้นต่อกล่อง / รวมตัว
   */
  splitSaleBoxColumns?: boolean
  /**
   * หน้าแบ่งขาย: สินค้าที่มีแท็กนี้จะจัดเข้า «หมวด» ในแถบซ้ายได้เฉพาะหมวดที่ติดแท็กเดียวกัน
   */
  splitSaleFolderMatch?: boolean
  /**
   * POS: ถ้าราคาขายต่อหน่วย (หลังคำนวณจากแฟ้มมาสเตอร์ ก่อนลดแท็ก) อยู่ในช่วง [min,max] บาท
   * จะลดราคาตาม discountPercent (ใช้เปอร์เซ็นต์สูงสุดเมื่อหลายแท็กเข้าเงื่อนไข)
   */
  priceMinBaht?: number
  priceMaxBaht?: number
  /** 0–100 */
  discountPercent?: number
}

/** แท็กเริ่มต้น «สายยางอ่อน» — id อ้างอิงในแฟ้มมาสเตอร์ / หมวดแบ่งขาย */
export const HOSE_SOFT_TAG_ID = 'hose-soft'

/** แท็กเริ่มต้น «นอตสต็อก» — น็อตหลายแบบ กล่อง+เศษ ในหน้าแบ่งขาย */
export const NUT_STOCK_TAG_ID = 'nut-stock'

/** ค่าเริ่มต้น — id อ้างอิงในโปรโมชัน (stlVolumePromo) และแบ่งขาย */
export const DEFAULT_PRODUCT_TAGS: ProductTagDefinition[] = [
  { id: 'bolt-black', label: 'Bolt:Black', group: 'bolt' },
  { id: 'bolt-green', label: 'Bolt:Green', group: 'bolt' },
  {
    id: HOSE_SOFT_TAG_ID,
    label: 'สายยางอ่อน',
    group: 'general',
    splitSaleRollColumns: true,
    splitSaleFolderMatch: true,
  },
  {
    id: NUT_STOCK_TAG_ID,
    label: 'นอตสต็อก',
    group: 'general',
    splitSaleBoxColumns: true,
    splitSaleFolderMatch: true,
  },
]

function normalizeTagList(raw: unknown): ProductTagDefinition[] {
  if (!Array.isArray(raw)) return []
  const out: ProductTagDefinition[] = []
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    if (typeof o.id !== 'string' || typeof o.label !== 'string') continue
    const id = o.id.trim()
    const label = o.label.trim()
    if (!id || !label) continue
    const group =
      o.group === 'bolt' || o.group === 'stl' || o.group === 'general' ? o.group : undefined
    let priceMinBaht: number | undefined
    let priceMaxBaht: number | undefined
    let discountPercent: number | undefined
    if (typeof o.priceMinBaht === 'number' && Number.isFinite(o.priceMinBaht) && o.priceMinBaht >= 0) {
      priceMinBaht = o.priceMinBaht
    }
    if (typeof o.priceMaxBaht === 'number' && Number.isFinite(o.priceMaxBaht) && o.priceMaxBaht >= 0) {
      priceMaxBaht = o.priceMaxBaht
    }
    if (typeof o.discountPercent === 'number' && Number.isFinite(o.discountPercent)) {
      discountPercent = Math.min(100, Math.max(0, o.discountPercent))
    }
    const splitSaleRollColumns = o.splitSaleRollColumns === true
    const splitSaleBoxColumns = o.splitSaleBoxColumns === true
    const splitSaleFolderMatch = o.splitSaleFolderMatch === true
    const row: ProductTagDefinition = { id, label, group }
    if (splitSaleRollColumns) row.splitSaleRollColumns = true
    if (splitSaleBoxColumns) row.splitSaleBoxColumns = true
    if (splitSaleFolderMatch) row.splitSaleFolderMatch = true
    if (priceMinBaht !== undefined) row.priceMinBaht = priceMinBaht
    if (priceMaxBaht !== undefined) row.priceMaxBaht = priceMaxBaht
    if (discountPercent !== undefined && discountPercent > 0) row.discountPercent = discountPercent
    out.push(row)
  }
  return out
}

function mergeWithDefaults(custom: ProductTagDefinition[]): ProductTagDefinition[] {
  const byId = new Map<string, ProductTagDefinition>()
  for (const t of DEFAULT_PRODUCT_TAGS) {
    byId.set(t.id, { ...t })
  }
  for (const t of custom) {
    const base = DEFAULT_PRODUCT_TAGS.find((d) => d.id === t.id)
    byId.set(t.id, base ? { ...base, ...t } : { ...t })
  }
  return [...byId.values()]
    .filter((t) => t.id !== 'hose')
    .sort((a, b) => a.label.localeCompare(b.label, 'th'))
}

/** สินค้าติดแท็กที่เปิดคอลัมน์ม้วน/เศษในหน้าแบ่งขาย (เช่น สายยางอ่อน) */
export function productHasSplitSaleRollColumnsTag(p: { productTagIds?: string[] }): boolean {
  const ids = new Set(p.productTagIds ?? [])
  if (ids.size === 0) return false
  for (const t of loadProductTagsRegistry()) {
    if (t.splitSaleRollColumns && ids.has(t.id)) return true
  }
  return false
}

/** สินค้าติดแท็กที่ใช้คอลัมน์กล่อง+เศษในหมวดแบ่งขายแบบพิเศษ (เช่น นอตสต็อก) */
export function productHasSplitSaleBoxColumnsTag(p: { productTagIds?: string[] }): boolean {
  const ids = new Set(p.productTagIds ?? [])
  if (ids.size === 0) return false
  for (const t of loadProductTagsRegistry()) {
    if (t.splitSaleBoxColumns && ids.has(t.id)) return true
  }
  return false
}

/** แท็กที่ใช้จับคู่สินค้า ↔ หมวดแบ่งขาย */
export function getSplitSaleFolderMatchTagIdSet(tags?: ProductTagDefinition[]): Set<string> {
  const list = tags ?? loadProductTagsRegistry()
  return new Set(list.filter((t) => t.splitSaleFolderMatch === true).map((t) => t.id))
}

/**
 * จับคู่แบบสมมาตร: ชุดแท็ก `splitSaleFolderMatch` บนสินค้าและบนหมวดต้องเหมือนกันพอดี
 * (หมวดไม่ติดแท็กจับคู่ = รับเฉพาะสินค้าที่ไม่มีแท็กจับคู่ · หมวดติดสายยางอ่อน = รับเฉพาะสินค้าที่ติดสายยางอ่อน)
 */
export function canAssignProductToSplitSaleFolder(
  productTagIds: string[] | undefined,
  folder: { tagIds?: string[] } | null | undefined,
  folderMatchTagIds: Set<string>,
): boolean {
  if (folder == null) return true
  const pMatch = new Set((productTagIds ?? []).filter((id) => folderMatchTagIds.has(id)))
  const fMatch = new Set((folder.tagIds ?? []).filter((id) => folderMatchTagIds.has(id)))
  if (pMatch.size !== fMatch.size) return false
  for (const id of pMatch) {
    if (!fMatch.has(id)) return false
  }
  return true
}

export function loadProductTagsRegistry(): ProductTagDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...DEFAULT_PRODUCT_TAGS]
    const parsed = JSON.parse(raw) as unknown
    const custom = normalizeTagList(parsed)
    return mergeWithDefaults(custom)
  } catch {
    return [...DEFAULT_PRODUCT_TAGS]
  }
}

export function saveProductTagsRegistry(tags: ProductTagDefinition[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mergeWithDefaults(tags)))
  window.dispatchEvent(new CustomEvent(PRODUCT_TAGS_CHANGED_EVENT))
}

export function upsertProductTagDefinition(tag: ProductTagDefinition) {
  const list = loadProductTagsRegistry()
  const idx = list.findIndex((t) => t.id === tag.id)
  const next = [...list]
  if (idx >= 0) next[idx] = tag
  else next.push(tag)
  saveProductTagsRegistry(next)
}

/** ลบแท็กออกจาก registry (สินค้าที่ยังอ้าง id เดิมจะแสดงเป็นรหัสดิบ) */
export function removeProductTagDefinition(id: string) {
  const list = loadProductTagsRegistry().filter((t) => t.id !== id)
  saveProductTagsRegistry(list)
}

export function newProductTagId(): string {
  return `tag-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`
}
