import {
  getProductMasterList,
  saveProductMasterList,
  type ProductMasterDetail,
} from '@/features/inventory/data/productMasterData'
import {
  loadCategoryTree,
  saveCategoryTree,
  newId,
  type MainCategory,
  type SubCategory,
} from '@/features/inventory/data/inventoryCategories'

const SAKURA_BRAND = 'Sakura'
const SAKURA_MAIN_CATEGORY = 'ไส้กรอง'

export type SakuraImportResult = {
  removed: number
  added: number
  total: number
  newSubCategories: string[]
}

/**
 * นำเข้าสินค้า Sakura ทั้งหมดจาก Excel กรองซากุระ — ลบของเดิม brand=Sakura ทั้งหมดก่อน แล้วเพิ่มชุดใหม่
 * เพิ่มหมวดหลัก «ไส้กรอง» พร้อม subcategory ทุกประเภท «กรอง...» ที่ยังไม่มี
 *
 * ข้อมูลโหลดแบบ dynamic import เพื่อไม่ให้บวกขนาด bundle ของหน้าแฟ้มสินค้า
 */
export async function runSakuraImport100(): Promise<SakuraImportResult> {
  const mod = await import('@/features/inventory/data/sakuraImportData')
  // นำเข้าเป็นสินค้าอ้างอิง (reference) — ไม่แสดงใน POS / ค้นหาหน้าร้าน
  const importProducts = mod.SAKURA_IMPORT_PRODUCTS.map((p) => ({
    ...p,
    inStoreCatalog: false as const,
  }))

  const existing = getProductMasterList()
  const kept = existing.filter((p) => p.brand.trim().toLowerCase() !== SAKURA_BRAND.toLowerCase())
  const removed = existing.length - kept.length
  const next = [...importProducts, ...kept]
  saveProductMasterList(next)

  const newSubCategories = ensureSakuraCategoryTree(importProducts)

  return {
    removed,
    added: importProducts.length,
    total: next.length,
    newSubCategories,
  }
}

/**
 * เพิ่มหมวดหลัก «ไส้กรอง» และ subcategory ที่ยังไม่มี (เช่น กรองอากาศ, กรองเครื่อง ฯลฯ)
 * คืนรายชื่อ subcategory ที่เพิ่งเพิ่ม
 */
function ensureSakuraCategoryTree(importProducts: ProductMasterDetail[]): string[] {
  const subNames = collectImportSubCategoryNames(importProducts)
  if (subNames.length === 0) return []

  const tree = loadCategoryTree()
  const norm = (s: string) => s.trim().toLowerCase()
  let main = tree.find((m) => norm(m.name) === norm(SAKURA_MAIN_CATEGORY))
  let dirty = false
  const newlyAdded: string[] = []

  if (!main) {
    main = {
      id: newId('main'),
      name: SAKURA_MAIN_CATEGORY,
      status: 'active',
      subcategories: [],
      paperFields: [],
      showProductBrand: true,
    }
    tree.push(main)
    dirty = true
  }

  const existingSubNames = new Set(main.subcategories.map((s) => norm(s.name)))
  for (const name of subNames) {
    if (existingSubNames.has(norm(name))) continue
    const sub: SubCategory = {
      id: newId('sub'),
      name,
      status: 'active',
      subSubcategories: [],
    }
    main.subcategories.push(sub)
    existingSubNames.add(norm(name))
    newlyAdded.push(name)
    dirty = true
  }

  if (dirty) {
    const next: MainCategory[] = [...tree]
    saveCategoryTree(next)
  }

  return newlyAdded
}

function collectImportSubCategoryNames(importProducts: ProductMasterDetail[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const p of importProducts) {
    const sub = (p.subCategory ?? '').trim()
    if (!sub) continue
    const key = sub.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(sub)
  }
  return out
}

/** ตรวจว่าผู้ใช้นำเข้า Sakura ไปแล้วหรือยัง — ใช้แสดงสถานะปุ่ม */
export function hasSakuraImported(): boolean {
  return getProductMasterList().some(
    (p) => p.brand.trim().toLowerCase() === SAKURA_BRAND.toLowerCase(),
  )
}

/** เคลียร์สินค้า Sakura ทั้งหมด (ใช้เมื่ออยากนำเข้าใหม่ตั้งแต่ต้น) */
export function clearSakuraProducts(): number {
  const existing = getProductMasterList()
  const kept = existing.filter(
    (p: ProductMasterDetail) => p.brand.trim().toLowerCase() !== SAKURA_BRAND.toLowerCase(),
  )
  const removed = existing.length - kept.length
  if (removed > 0) saveProductMasterList(kept)
  return removed
}
