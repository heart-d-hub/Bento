import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { isTauri } from '@/features/desktop/isTauri'

let cachedDir: string | null = null
let cachedSkuMap: Record<string, string> | null = null
let cacheTs = 0
const CACHE_TTL = 5_000

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
  try {
    const now = Date.now()
    if (!cachedSkuMap || now - cacheTs > CACHE_TTL) {
      ;[cachedSkuMap, cachedDir] = await Promise.all([
        invoke<Record<string, string>>('list_product_image_skus'),
        invoke<string>('get_product_images_dir'),
      ])
      cacheTs = now
    }
    const filename = cachedSkuMap![sku.trim().toLowerCase()]
    if (!filename || !cachedDir) return null
    return convertFileSrc(cachedDir + '\\' + filename)
  } catch {
    return null
  }
}

export function invalidateProductImageCache(): void {
  cachedSkuMap = null
  cachedDir = null
  cacheTs = 0
}
