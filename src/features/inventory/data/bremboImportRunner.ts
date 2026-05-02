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

const BREMBO_BRAND = 'Brembo'
const BREMBO_MAIN_CATEGORY = 'เบรก'

export type BremboImportResult = {
  removed: number
  added: number
  total: number
  newSubCategories: string[]
}

/**
 * นำเข้าผ้าเบรก Brembo ทั้งหมดจาก Excel — ลบของเดิม brand=Brembo เท่านั้น แล้วเพิ่มชุดใหม่
 * (สินค้ายี่ห้ออื่นเช่น Sakura ไม่ถูกแตะต้อง)
 *
 * เพิ่มหมวดหลัก «เบรก» พร้อม subcategory «ผ้าเบรก» ที่ยังไม่มี
 *
 * ข้อมูลโหลดแบบ dynamic import เพื่อไม่ให้บวกขนาด bundle ของหน้าแฟ้มสินค้า
 */
export async function runBremboImport(): Promise<BremboImportResult> {
  const mod = await import('@/features/inventory/data/bremboImportData')
  const importProducts = mod.BREMBO_IMPORT_PRODUCTS.map((p) => ({
    ...p,
    inStoreCatalog: false as const,
  }))

  const existing = getProductMasterList()
  const kept = existing.filter((p) => p.brand.trim().toLowerCase() !== BREMBO_BRAND.toLowerCase())
  const removed = existing.length - kept.length
  const next = [...importProducts, ...kept]
  saveProductMasterList(next)

  const newSubCategories = ensureBremboCategoryTree(importProducts)

  return {
    removed,
    added: importProducts.length,
    total: next.length,
    newSubCategories,
  }
}

function ensureBremboCategoryTree(importProducts: ProductMasterDetail[]): string[] {
  const subNames = collectImportSubCategoryNames(importProducts)
  if (subNames.length === 0) return []

  const tree = loadCategoryTree()
  const norm = (s: string) => s.trim().toLowerCase()
  let main = tree.find((m) => norm(m.name) === norm(BREMBO_MAIN_CATEGORY))
  let dirty = false
  const newlyAdded: string[] = []

  if (!main) {
    main = {
      id: newId('main'),
      name: BREMBO_MAIN_CATEGORY,
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
    const nextTree: MainCategory[] = [...tree]
    saveCategoryTree(nextTree)
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
