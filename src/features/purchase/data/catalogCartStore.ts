const LS_KEY = 'bento.purchase.catalogCart.v1'
export const CATALOG_CART_CHANGED = 'bento-catalog-cart-changed'

export type CatalogCartItem = {
  productId: string
  sku: string
  name: string
  qty: number
  unitCost: number
  supplierId?: string
  supplierName?: string
  /** สั่งมาจากสูตรกล่อง — เก็บจำนวนกล่อง (สำหรับแสดงผลและตั้ง orderBoxCount ใน PO) */
  boxCount?: number
  recipeId?: string
}

function emit() {
  try { window.dispatchEvent(new CustomEvent(CATALOG_CART_CHANGED)) } catch { /* ignore */ }
}

export function loadCatalogCart(): CatalogCartItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as CatalogCartItem[]) : []
  } catch { return [] }
}

export function saveCatalogCart(items: CatalogCartItem[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)) } catch { /* ignore */ }
  emit()
}

/** Save without emitting — use inside the catalog component to avoid re-render loops */
export function saveCatalogCartSilent(items: CatalogCartItem[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)) } catch { /* ignore */ }
}

export function addToCatalogCart(item: CatalogCartItem): void {
  const items = loadCatalogCart()
  const idx = items.findIndex((i) => i.productId === item.productId)
  if (idx >= 0) {
    items[idx] = { ...items[idx], qty: items[idx].qty + item.qty, unitCost: item.unitCost || items[idx].unitCost }
  } else {
    items.push(item)
  }
  saveCatalogCart(items)
}

export function clearCatalogCart(): void {
  saveCatalogCart([])
}
