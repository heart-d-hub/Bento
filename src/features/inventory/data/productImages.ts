import { invoke } from '@tauri-apps/api/core'
import { isTauri } from '@/features/desktop/isTauri'

// Cache only found images — null/empty results are not cached so retries hit disk
const dataUrlCache = new Map<string, string>()
const dataUrlsCache = new Map<string, string[]>()

export async function getProductImagesDir(): Promise<string | null> {
  if (!isTauri()) return null
  try {
    return await invoke<string>('get_product_images_dir')
  } catch {
    return null
  }
}

export async function getProductImageUrl(sku: string): Promise<string | null> {
  if (!isTauri() || !sku.trim()) return null
  const key = sku.trim().toLowerCase()
  if (dataUrlCache.has(key)) return dataUrlCache.get(key)!
  try {
    const dataUrl = await invoke<string | null>('get_product_image_b64', { sku })
    if (dataUrl) dataUrlCache.set(key, dataUrl)
    return dataUrl ?? null
  } catch {
    return null
  }
}

export async function getProductImageUrls(sku: string): Promise<string[]> {
  if (!isTauri() || !sku.trim()) return []
  const key = sku.trim().toLowerCase()
  if (dataUrlsCache.has(key)) return dataUrlsCache.get(key)!
  try {
    const urls = await invoke<string[]>('get_product_images_b64', { sku })
    if (urls.length > 0) dataUrlsCache.set(key, urls)
    return urls
  } catch {
    return []
  }
}

export function invalidateProductImageCache(): void {
  dataUrlCache.clear()
  dataUrlsCache.clear()
}
