import { MOCK_PRODUCTS } from '@/features/inventory/data/mockInventory'
import { isTauri } from '@/features/desktop/isTauri'
import { getProductMasterList } from '@/features/inventory/data/productMasterData'
import { invoke } from '@tauri-apps/api/core'

const LEGACY_LIST_KEY = 'bento_inventory_category_list_v1'
const TREE_KEY = 'bento_inventory_category_tree_v2'
const CATEGORY_TREE_DB_DEBOUNCE_MS = 800
let categoryTreeDbDebounceTimer: number | null = null
let categoryTreeDbPending: MainCategory[] | null = null

/** สถานะแสดง/ใช้งานหมวด (เช่น ซ่อนจากเมนูเว็บเมื่อ inactive) */
export type CategoryStatus = 'active' | 'inactive'

function normalizeStatus(s: unknown): CategoryStatus {
  return s === 'inactive' ? 'inactive' : 'active'
}

/** ชื่อช่องมิติ/กระดาษต่อหมวดหลัก (เช่น กลาง, สูง) — อ้างอิงตอนลงสินค้า/แฟ้มข้อมูลในอนาคต */
export type CategoryPaperField = {
  id: string
  label: string
}

/** หมวดย่อยระดับที่ 2 (ใต้หมวดย่อย 1) — รองรับเว็บ / โครงสร้างลึกขึ้น */
export type SubSubCategory = {
  id: string
  name: string
  status: CategoryStatus
  paperFields?: CategoryPaperField[]
  showProductBrand?: boolean
  /** ถ้ามีและไม่ว่าง = สินค้าในหมวดนี้เลือกได้เฉพาะแท็กเหล่านี้ (จากจัดการแท็ก) */
  allowedProductTagIds?: string[]
  /**
   * แสดงบล็อกแท็กสินค้าในฟอร์มแฟ้มข้อมูล — false = ไม่แสดงตอนเพิ่ม/แก้ไขสินค้า
   * ไม่ระบุ = สืบทอดจาก ย่อย 2 → ย่อย 1 → หลัก; ถ้าไม่มีใครระบุ = แสดง (เข้ากับข้อมูลเก่า)
   */
  productTagsInMasterForm?: boolean
  /**
   * หมวดน็อตตัวผู้ — ตัวผู้หลายความยาวที่แชร์หัวตัวเมียตามเบอร์เดียวกัน (ใช้ร่วมกับคู่น็อตในแฟ้มสินค้า / POS)
   */
  boltHeadGroupBySize?: boolean
  /**
   * แสดงฟิลด์เสริมในฟอร์มเพิ่มสินค้า (แฟ้มข้อมูล) — false = ซ่อน
   * ไม่ระบุ = สืบทอดจาก ย่อย 2 → ย่อย 1 → หลัก; ถ้าไม่มีใครระบุ = แสดงทั้งหมด
   */
  productFormShowOemTags?: boolean
  productFormShowCrossRef?: boolean
  productFormShowFactoryNo?: boolean
  productFormShowVehicleFitment?: boolean
  productFormShowPhysicalDimensions?: boolean
}

export type SubCategory = {
  id: string
  name: string
  status: CategoryStatus
  /** หมวดย่อยระดับที่ 2 — ไม่มี = [] */
  subSubcategories: SubSubCategory[]
  paperFields?: CategoryPaperField[]
  showProductBrand?: boolean
  allowedProductTagIds?: string[]
  /** @see SubSubCategory.productTagsInMasterForm */
  productTagsInMasterForm?: boolean
  boltHeadGroupBySize?: boolean
  productFormShowOemTags?: boolean
  productFormShowCrossRef?: boolean
  productFormShowFactoryNo?: boolean
  productFormShowVehicleFitment?: boolean
  productFormShowPhysicalDimensions?: boolean
}

export type MainCategory = {
  id: string
  name: string
  status: CategoryStatus
  subcategories: SubCategory[]
  /** ชื่อมิติที่หมวดนี้เก็บ (เช่น กว้าง/ยาว/สูง) — ว่างได้ */
  paperFields?: CategoryPaperField[]
  /** บันทึกว่าหมวดนี้เก็บข้อมูลอะไรบ้าง (อ้างอิงภายในร้าน) — legacy */
  dataNotes?: string
  /** แสดงแบรนด์สินค้าในช่องที่เกี่ยวข้อง (แฟ้มข้อมูล / UI ในอนาคต) */
  showProductBrand?: boolean
  /** จำกัดแท็กที่เลือกได้ในสินค้าภายใต้หมวดหลัก (ถ้าไม่มี sub) */
  allowedProductTagIds?: string[]
  /** @see SubSubCategory.productTagsInMasterForm */
  productTagsInMasterForm?: boolean
  boltHeadGroupBySize?: boolean
  productFormShowOemTags?: boolean
  productFormShowCrossRef?: boolean
  productFormShowFactoryNo?: boolean
  productFormShowVehicleFitment?: boolean
  productFormShowPhysicalDimensions?: boolean
}

/** ผลรวมว่าจะแสดงแต่ละฟิลด์เสริมในฟอร์มเพิ่มสินค้าหรือไม่ (แบ่งขายแสดงเสมอ; แท็กสินค้าควบคุมที่หมวด) */
export type ProductFormFieldVisibility = {
  showOemTags: boolean
  showCrossRef: boolean
  showFactoryNo: boolean
  showVehicleFitment: boolean
  showPhysicalDimensions: boolean
}

function normalizeOptionalBool(raw: unknown): boolean | undefined {
  return typeof raw === 'boolean' ? raw : undefined
}

function pickProductFormShow(
  main: MainCategory,
  sub: SubCategory | undefined,
  subSub: SubSubCategory | undefined,
  key: keyof Pick<
    MainCategory,
    | 'productFormShowOemTags'
    | 'productFormShowCrossRef'
    | 'productFormShowFactoryNo'
    | 'productFormShowVehicleFitment'
    | 'productFormShowPhysicalDimensions'
  >,
): boolean {
  let v: boolean | undefined
  if (subSub && subSub[key] !== undefined) v = subSub[key]
  else if (sub && sub[key] !== undefined) v = sub[key]
  else if (main[key] !== undefined) v = main[key]
  else v = undefined
  return v !== false
}

/** ใช้กับหมวดที่เลือกในฟอร์มสินค้า — สืบทอด ย่อย 2 → ย่อย 1 → หลัก */
export function resolveProductFormFieldVisibility(
  tree: MainCategory[],
  categoryMain: string,
  subName?: string,
  subSubName?: string,
): ProductFormFieldVisibility {
  const n = (s: string) => s.trim().toLowerCase()
  const main = tree.find((m) => n(m.name) === n(categoryMain))
  if (!main) {
    return {
      showOemTags: true,
      showCrossRef: true,
      showFactoryNo: true,
      showVehicleFitment: true,
      showPhysicalDimensions: true,
    }
  }
  const sub = subName?.trim()
    ? main.subcategories.find((s) => n(s.name) === n(subName))
    : undefined
  const subSub =
    sub && subSubName?.trim()
      ? sub.subSubcategories.find((x) => n(x.name) === n(subSubName))
      : undefined

  return {
    showOemTags: pickProductFormShow(main, sub, subSub, 'productFormShowOemTags'),
    showCrossRef: pickProductFormShow(main, sub, subSub, 'productFormShowCrossRef'),
    showFactoryNo: pickProductFormShow(main, sub, subSub, 'productFormShowFactoryNo'),
    showVehicleFitment: pickProductFormShow(main, sub, subSub, 'productFormShowVehicleFitment'),
    showPhysicalDimensions: pickProductFormShow(main, sub, subSub, 'productFormShowPhysicalDimensions'),
  }
}

function pickProductTagsInMasterForm(
  main: MainCategory,
  sub: SubCategory | undefined,
  subSub: SubSubCategory | undefined,
): boolean {
  let v: boolean | undefined
  if (subSub && subSub.productTagsInMasterForm !== undefined) v = subSub.productTagsInMasterForm
  else if (sub && sub.productTagsInMasterForm !== undefined) v = sub.productTagsInMasterForm
  else if (main.productTagsInMasterForm !== undefined) v = main.productTagsInMasterForm
  else v = undefined
  return v !== false
}

/** แสดงบล็อกแท็กสินค้าในฟอร์มแฟ้มข้อมูลหรือไม่ — สืบทอด ย่อย 2 → ย่อย 1 → หลัก; ค่าเริ่มต้น = แสดง */
export function resolveProductTagsInMasterForm(
  tree: MainCategory[],
  categoryMain: string,
  subName?: string,
  subSubName?: string,
): boolean {
  const n = (s: string) => s.trim().toLowerCase()
  const main = tree.find((m) => n(m.name) === n(categoryMain))
  if (!main) return true
  const sub = subName?.trim()
    ? main.subcategories.find((s) => n(s.name) === n(subName))
    : undefined
  const subSub =
    sub && subSubName?.trim()
      ? sub.subSubcategories.find((x) => n(x.name) === n(subSubName))
      : undefined
  return pickProductTagsInMasterForm(main, sub, subSub)
}

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`
}

function normalizeAllowedTagIds(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const ids = raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim())
  return ids.length > 0 ? ids : undefined
}

function normalizePaperFields(raw: unknown): CategoryPaperField[] {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) return []
  const out: CategoryPaperField[] = []
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    if (typeof o.id !== 'string' || typeof o.label !== 'string') continue
    const label = o.label.trim()
    if (!label) continue
    out.push({ id: o.id, label })
  }
  return out
}

function defaultMainFromName(name: string): MainCategory {
  const id = newId('main')
  return {
    id,
    name,
    status: 'active',
    subcategories: [],
    paperFields: [],
    dataNotes: undefined,
    showProductBrand: false,
  }
}

function normalizeSubSub(s: unknown): SubSubCategory | null {
  if (!s || typeof s !== 'object') return null
  const o = s as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return null
  return {
    id: o.id,
    name: o.name,
    status: normalizeStatus(o.status),
    paperFields: normalizePaperFields(o.paperFields),
    showProductBrand: o.showProductBrand === true,
    allowedProductTagIds: normalizeAllowedTagIds(o.allowedProductTagIds),
    productTagsInMasterForm: normalizeOptionalBool(o.productTagsInMasterForm),
    boltHeadGroupBySize: typeof o.boltHeadGroupBySize === 'boolean' ? o.boltHeadGroupBySize : undefined,
    productFormShowOemTags: normalizeOptionalBool(o.productFormShowOemTags),
    productFormShowCrossRef: normalizeOptionalBool(o.productFormShowCrossRef),
    productFormShowFactoryNo: normalizeOptionalBool(o.productFormShowFactoryNo),
    productFormShowVehicleFitment: normalizeOptionalBool(o.productFormShowVehicleFitment),
    productFormShowPhysicalDimensions: normalizeOptionalBool(o.productFormShowPhysicalDimensions),
  }
}

function normalizeSub(s: unknown): SubCategory | null {
  if (!s || typeof s !== 'object') return null
  const o = s as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return null
  const raw = o.subSubcategories
  const subSubcategories: SubSubCategory[] = Array.isArray(raw)
    ? raw.map(normalizeSubSub).filter((x): x is SubSubCategory => x !== null)
    : []
  return {
    id: o.id,
    name: o.name,
    status: normalizeStatus(o.status),
    subSubcategories,
    paperFields: normalizePaperFields(o.paperFields),
    showProductBrand: o.showProductBrand === true,
    allowedProductTagIds: normalizeAllowedTagIds(o.allowedProductTagIds),
    productTagsInMasterForm: normalizeOptionalBool(o.productTagsInMasterForm),
    boltHeadGroupBySize: typeof o.boltHeadGroupBySize === 'boolean' ? o.boltHeadGroupBySize : undefined,
    productFormShowOemTags: normalizeOptionalBool(o.productFormShowOemTags),
    productFormShowCrossRef: normalizeOptionalBool(o.productFormShowCrossRef),
    productFormShowFactoryNo: normalizeOptionalBool(o.productFormShowFactoryNo),
    productFormShowVehicleFitment: normalizeOptionalBool(o.productFormShowVehicleFitment),
    productFormShowPhysicalDimensions: normalizeOptionalBool(o.productFormShowPhysicalDimensions),
  }
}

/** โหลดจาก storage — เติม subSubcategories ว่างถ้าเป็นข้อมูลเก่า */
export function normalizeCategoryTree(tree: unknown): MainCategory[] {
  if (!Array.isArray(tree)) return []
  const out: MainCategory[] = []
  for (const m of tree) {
    if (!m || typeof m !== 'object') continue
    const o = m as Record<string, unknown>
    if (typeof o.id !== 'string' || typeof o.name !== 'string') continue
    const subsRaw = o.subcategories
    const subcategories: SubCategory[] = Array.isArray(subsRaw)
      ? subsRaw.map(normalizeSub).filter((x): x is SubCategory => x !== null)
      : []
    const paperFields = normalizePaperFields(o.paperFields)
    const dn = o.dataNotes
    const dataNotes = typeof dn === 'string' && dn.trim() !== '' ? dn : undefined
    const showProductBrand = o.showProductBrand === true
    out.push({
      id: o.id,
      name: o.name,
      status: normalizeStatus(o.status),
      subcategories,
      paperFields,
      dataNotes,
      showProductBrand,
      allowedProductTagIds: normalizeAllowedTagIds(o.allowedProductTagIds),
      productTagsInMasterForm: normalizeOptionalBool(o.productTagsInMasterForm),
      boltHeadGroupBySize: typeof o.boltHeadGroupBySize === 'boolean' ? o.boltHeadGroupBySize : undefined,
      productFormShowOemTags: normalizeOptionalBool(o.productFormShowOemTags),
      productFormShowCrossRef: normalizeOptionalBool(o.productFormShowCrossRef),
      productFormShowFactoryNo: normalizeOptionalBool(o.productFormShowFactoryNo),
      productFormShowVehicleFitment: normalizeOptionalBool(o.productFormShowVehicleFitment),
      productFormShowPhysicalDimensions: normalizeOptionalBool(o.productFormShowPhysicalDimensions),
    })
  }
  return out
}

export function defaultCategoryTree(): MainCategory[] {
  const masterNames = [...new Set(getProductMasterList().map((p) => p.category.trim()).filter(Boolean))]
  const fallbackNames = [...new Set(MOCK_PRODUCTS.map((p) => p.category.trim()).filter(Boolean))]
  const names = (masterNames.length > 0 ? masterNames : fallbackNames).sort((a, b) =>
    a.localeCompare(b, 'th', { sensitivity: 'base' }),
  )
  return names.map((name) => defaultMainFromName(name))
}

function mergeMissingMainCategoriesFromMaster(tree: MainCategory[]): MainCategory[] {
  const masterNames = [...new Set(getProductMasterList().map((p) => p.category.trim()).filter(Boolean))]
  if (masterNames.length === 0) return tree
  const existing = new Set(tree.map((m) => m.name.trim().toLowerCase()))
  const missing = masterNames
    .filter((name) => !existing.has(name.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'th', { sensitivity: 'base' }))
  if (missing.length === 0) return tree
  return [...tree, ...missing.map((name) => defaultMainFromName(name))]
}

function parseLegacyStringList(raw: string): MainCategory[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const names = parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    if (!names.length) return null
    return names.map((name) => defaultMainFromName(name))
  } catch {
    return null
  }
}

export function loadCategoryTree(): MainCategory[] {
  try {
    const treeRaw = localStorage.getItem(TREE_KEY)
    if (treeRaw) {
      const parsed = JSON.parse(treeRaw) as unknown
      if (Array.isArray(parsed) && parsed.length > 0) {
        const norm = normalizeCategoryTree(parsed)
        if (norm.length > 0) return mergeMissingMainCategoriesFromMaster(norm)
      }
    }

    const legacy = localStorage.getItem(LEGACY_LIST_KEY)
    if (legacy) {
      const migrated = parseLegacyStringList(legacy)
      if (migrated?.length) return mergeMissingMainCategoriesFromMaster(migrated)
    }

    return mergeMissingMainCategoriesFromMaster(defaultCategoryTree())
  } catch {
    return mergeMissingMainCategoriesFromMaster(defaultCategoryTree())
  }
}

export const INVENTORY_CATEGORIES_UPDATED_EVENT = 'bento-inventory-categories-updated'

export function saveCategoryTree(tree: MainCategory[]) {
  localStorage.setItem(TREE_KEY, JSON.stringify(tree))
  if (isTauri()) {
    categoryTreeDbPending = tree
    if (categoryTreeDbDebounceTimer !== null) {
      clearTimeout(categoryTreeDbDebounceTimer)
    }
    categoryTreeDbDebounceTimer = window.setTimeout(() => {
      categoryTreeDbDebounceTimer = null
      const snap = categoryTreeDbPending
      categoryTreeDbPending = null
      if (!snap) return
      void invoke('inventory_categories_replace_all', { payload: snap }).catch((e) => {
        console.error('[inventory-categories] persist to db failed', e)
      })
    }, CATEGORY_TREE_DB_DEBOUNCE_MS)
  }
  window.dispatchEvent(new CustomEvent(INVENTORY_CATEGORIES_UPDATED_EVENT))
}

export async function hydrateCategoryTreeFromDb(): Promise<MainCategory[]> {
  const local = loadCategoryTree()
  if (!isTauri()) return local
  try {
    const row = await invoke<unknown | null>('inventory_categories_load')
    if (!row) {
      if (local.length > 0) {
        void invoke('inventory_categories_replace_all', { payload: local }).catch((e) => {
          console.error('[inventory-categories] bootstrap db failed', e)
        })
      }
      return local
    }
    const normalizedDb = normalizeCategoryTree(row)
    if (normalizedDb.length === 0) return local
    const merged = mergeMissingMainCategoriesFromMaster(normalizedDb)
    localStorage.setItem(TREE_KEY, JSON.stringify(merged))
    window.dispatchEvent(new CustomEvent(INVENTORY_CATEGORIES_UPDATED_EVENT))
    return merged
  } catch (e) {
    console.error('[inventory-categories] hydrate from db failed', e)
    return local
  }
}

/**
 * แท็กที่สินค้าในหมวดนี้เลือกได้ (เมื่อเปิดแท็กในแฟ้มแล้ว — ดู resolveProductTagsInMasterForm)
 * คืน null = ไม่จำกัด (ใช้แท็กทั้งหมดในระบบ) · ลำดับ: ย่อย 2 → ย่อย 1 → หลัก
 */
export function resolveAllowedProductTagIdsForProduct(
  tree: MainCategory[],
  categoryMain: string,
  subName?: string,
  subSubName?: string,
): string[] | null {
  const n = (s: string) => s.trim().toLowerCase()
  const main = tree.find((m) => n(m.name) === n(categoryMain))
  if (!main) return null
  const sub = subName?.trim()
    ? main.subcategories.find((s) => n(s.name) === n(subName))
    : undefined
  const subSub =
    sub && subSubName?.trim()
      ? sub.subSubcategories.find((x) => n(x.name) === n(subSubName))
      : undefined
  if (subSub?.allowedProductTagIds && subSub.allowedProductTagIds.length > 0) {
    return subSub.allowedProductTagIds
  }
  if (sub?.allowedProductTagIds && sub.allowedProductTagIds.length > 0) {
    return sub.allowedProductTagIds
  }
  if (main.allowedProductTagIds && main.allowedProductTagIds.length > 0) {
    return main.allowedProductTagIds
  }
  return null
}

/** ตรงกับเมนูหมวดในแฟ้มข้อมูล — ใช้ดึง allowedProductTagIds ตอนเปิดฟอร์มจากหมวดที่เลือก */
export type CategoryBrowseNavForTags =
  | { type: 'all' }
  | { type: 'main'; mainId: string }
  | { type: 'sub'; mainId: string; subId: string }
  | { type: 'subsub'; mainId: string; subId: string; subSubId: string }
  | { type: 'orphan' }

/**
 * แท็กที่เลือกได้ในสินค้า ตามหมวดที่เลือกในแถบข้างแฟ้มข้อมูล — สืบทอด ย่อย 2 → ย่อย 1 → หลัก
 * คืน null = ไม่จำกัด
 */
export function resolveAllowedProductTagIdsForBrowseNav(
  tree: MainCategory[],
  nav: CategoryBrowseNavForTags | undefined,
): string[] | null {
  if (!nav || nav.type === 'all' || nav.type === 'orphan') return null
  const main = tree.find((m) => m.id === nav.mainId)
  if (!main) return null
  if (nav.type === 'main') {
    return main.allowedProductTagIds?.length ? main.allowedProductTagIds : null
  }
  const sub = main.subcategories.find((s) => s.id === nav.subId)
  if (!sub) {
    return main.allowedProductTagIds?.length ? main.allowedProductTagIds : null
  }
  if (nav.type === 'sub') {
    if (sub.allowedProductTagIds?.length) return sub.allowedProductTagIds
    return main.allowedProductTagIds?.length ? main.allowedProductTagIds : null
  }
  const ss = sub.subSubcategories.find((x) => x.id === nav.subSubId)
  if (ss?.allowedProductTagIds?.length) return ss.allowedProductTagIds
  if (sub.allowedProductTagIds?.length) return sub.allowedProductTagIds
  return main.allowedProductTagIds?.length ? main.allowedProductTagIds : null
}

/**
 * หมวดนี้เปิดโหมด «จัดกลุ่มน็อตตามไซส์ (หัวร่วมกัน)» หรือไม่ — สืบทอดจาก ย่อย2 → ย่อย1 → หลัก
 */
export function resolveBoltHeadGroupBySizeForProduct(
  tree: MainCategory[],
  categoryMain: string,
  subName?: string,
  subSubName?: string,
): boolean {
  const n = (s: string) => s.trim().toLowerCase()
  const main = tree.find((m) => n(m.name) === n(categoryMain))
  if (!main) return false
  const sub = subName?.trim()
    ? main.subcategories.find((s) => n(s.name) === n(subName))
    : undefined
  const subSub =
    sub && subSubName?.trim()
      ? sub.subSubcategories.find((x) => n(x.name) === n(subSubName))
      : undefined

  if (subSubName?.trim() && subSub) {
    if (subSub.boltHeadGroupBySize !== undefined) return subSub.boltHeadGroupBySize
    if (sub?.boltHeadGroupBySize !== undefined) return sub.boltHeadGroupBySize
    return main.boltHeadGroupBySize ?? false
  }
  if (subName?.trim() && sub) {
    if (sub.boltHeadGroupBySize !== undefined) return sub.boltHeadGroupBySize
    return main.boltHeadGroupBySize ?? false
  }
  return main.boltHeadGroupBySize ?? false
}

export { newId }
