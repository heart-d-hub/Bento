const LS_KEY = 'bento.purchase.supplierCatalog.v1'
export const SUPPLIER_CATALOG_CHANGED_EVENT = 'bento-supplier-catalog-changed'

function emit() {
  try { window.dispatchEvent(new CustomEvent(SUPPLIER_CATALOG_CHANGED_EVENT)) } catch { /* ignore */ }
}

export type SupplierCatalogItem = {
  productId: string | null
  sku: string
  name: string
  lastPrice: number
  lastQty: number
  lastBoughtAt: string
}

type CatalogMap = Record<string, SupplierCatalogItem[]>

function load(): CatalogMap {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as CatalogMap) : {}
  } catch { return {} }
}

function save(map: CatalogMap) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(map)) } catch { /* ignore */ }
  emit()
}

export function getSupplierCatalog(supplierId: string): SupplierCatalogItem[] {
  return load()[supplierId] ?? []
}

export type ProductSupplierEntry = {
  supplierId: string
  lastPrice: number
  lastBoughtAt: string
}

/** For each productId → which suppliers carry it + last price */
export function buildProductSupplierMap(): Map<string, ProductSupplierEntry[]> {
  const map = load()
  const result = new Map<string, ProductSupplierEntry[]>()
  for (const [supplierId, items] of Object.entries(map)) {
    for (const item of items) {
      if (!item.productId) continue
      const existing = result.get(item.productId) ?? []
      existing.push({ supplierId, lastPrice: item.lastPrice, lastBoughtAt: item.lastBoughtAt })
      result.set(item.productId, existing)
    }
  }
  return result
}

export function saveSupplierCatalogItems(supplierId: string, items: SupplierCatalogItem[]): void {
  const map = load()
  map[supplierId] = items
  save(map)
}

/** All items across ALL suppliers — useful for showing products not in store */
export function getAllSupplierCatalogItems(): Array<SupplierCatalogItem & { supplierId: string }> {
  const map = load()
  const result: Array<SupplierCatalogItem & { supplierId: string }> = []
  for (const [supplierId, items] of Object.entries(map)) {
    for (const item of items) result.push({ ...item, supplierId })
  }
  return result
}

/**
 * Ensures a product is linked to a supplier without overwriting existing purchase history.
 * Call this when the user manually picks a vendor for the first time.
 */
export function unlinkProductFromSupplier(supplierId: string, productId: string): void {
  const map = load()
  const existing = map[supplierId] ?? []
  map[supplierId] = existing.filter((e) => e.productId !== productId)
  save(map)
}

export function linkProductToSupplier(
  supplierId: string,
  product: { productId: string; sku: string; name: string; unitCost: number },
): void {
  const map = load()
  const existing = map[supplierId] ?? []
  const alreadyLinked = existing.some((e) => e.productId === product.productId)
  if (alreadyLinked) return
  existing.push({
    productId: product.productId,
    sku: product.sku,
    name: product.name,
    lastPrice: product.unitCost,
    lastQty: 0,
    lastBoughtAt: new Date().toISOString(),
  })
  map[supplierId] = existing
  save(map)
}

export function mergeItemsIntoSupplierCatalog(
  supplierId: string,
  items: Array<{ productId: string | null; sku: string; name: string; qty: number; unitCost: number }>,
) {
  const map = load()
  const existing = map[supplierId] ?? []
  const now = new Date().toISOString()

  for (const item of items) {
    if (!item.name.trim()) continue
    const idx = existing.findIndex((e) =>
      item.productId ? e.productId === item.productId : e.name.toLowerCase() === item.name.toLowerCase(),
    )
    const entry: SupplierCatalogItem = {
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      lastPrice: item.unitCost,
      lastQty: item.qty,
      lastBoughtAt: now,
    }
    if (idx >= 0) existing[idx] = entry
    else existing.push(entry)
  }

  map[supplierId] = existing
  save(map)
}
