export type CatalogAudience = 'garage' | 'shop' | 'dealer' | 'general'

export type CatalogItem = {
  productId: string
  sku: string
  name: string
  brand: string
  category: string
  suggestedPrice: number
  note?: string
}

export type ProductCatalog = {
  id: string
  name: string
  audience: CatalogAudience
  note?: string
  items: CatalogItem[]
  updatedAt: string
}

const LS_KEY = 'bento.catalogs.v1'

export const CATALOGS_CHANGED_EVENT = 'bento-catalogs-changed'

export function loadCatalogs(): ProductCatalog[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ProductCatalog[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveCatalogs(catalogs: ProductCatalog[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(catalogs))
  window.dispatchEvent(new CustomEvent(CATALOGS_CHANGED_EVENT))
}
