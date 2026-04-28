const LS_KEY = 'bento.purchase.boxRecipes.v1'

export const BOX_RECIPES_CHANGED_EVENT = 'bento-box-recipes-changed'

export type BoxRecipeComponent = {
  sku: string
  /** จำนวนชิ้นของ SKU นี้ต่อ 1 กล่อง */
  qtyPerBox: number
  /** ป้ายชื่อแสดงบนปุ่มเลือกขนาด เช่น "1L", "6L" */
  label?: string
}

export type BoxRecipeTemplate = {
  id: string
  name: string
  /** กล่องนี้ปกติซื้อจาก supplier รายนี้ (optional) */
  supplierId?: string
  components: BoxRecipeComponent[]
  /** เมื่อรับของ — แตกกล่องเป็นชิ้นอัตโนมัติตามสูตร */
  autoUnpack?: boolean
}

export function loadBoxRecipes(): BoxRecipeTemplate[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as unknown
    if (!Array.isArray(list)) return []
    return list.filter(
      (x): x is BoxRecipeTemplate =>
        x !== null &&
        typeof x === 'object' &&
        typeof (x as BoxRecipeTemplate).id === 'string' &&
        typeof (x as BoxRecipeTemplate).name === 'string' &&
        Array.isArray((x as BoxRecipeTemplate).components),
    )
  } catch {
    return []
  }
}

export function saveBoxRecipes(list: BoxRecipeTemplate[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent(BOX_RECIPES_CHANGED_EVENT))
}

export function upsertBoxRecipe(template: BoxRecipeTemplate): void {
  const list = loadBoxRecipes()
  const idx = list.findIndex((t) => t.id === template.id)
  if (idx >= 0) list[idx] = template
  else list.push(template)
  saveBoxRecipes(list)
}

export function deleteBoxRecipe(id: string): void {
  saveBoxRecipes(loadBoxRecipes().filter((t) => t.id !== id))
}

const SEED_IDS_TO_REMOVE = ['demo-oil-10w40', 'box-oil-promo-6p1l', 'box-oil-std-1l-24']

/** ลบสูตรตัวอย่างที่ถูก seed ไว้ก่อนหน้าออกจาก localStorage */
export function seedDemoBoxRecipeIfEmpty(): void {
  const list = loadBoxRecipes()
  const cleaned = list.filter((r) => !SEED_IDS_TO_REMOVE.includes(r.id))
  if (cleaned.length !== list.length) saveBoxRecipes(cleaned)
}
