import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'
import { clsx } from 'clsx'
import { Package } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type Props = {
  sku: string
  mainSize?: 'sm' | 'md' | 'lg'
  className?: string
}

const MAIN_SIZE_CLS = {
  sm: 'size-16',
  md: 'size-28',
  lg: 'size-40',
}

/** Always fetches fresh from disk — bypasses the module-level cache so newly added photos appear immediately. */
async function fetchImageUrls(sku: string): Promise<string[]> {
  try {
    return await invoke<string[]>('get_product_images_b64', { sku })
  } catch {
    return []
  }
}

export function ProductImageGallery({ sku, mainSize = 'md', className }: Props) {
  const [urls, setUrls] = useState<string[]>([])
  const [active, setActive] = useState(0)

  const load = useCallback(async () => {
    if (!sku.trim() || !isTauri()) { setUrls([]); return }
    const fetched = await fetchImageUrls(sku)
    setUrls(fetched)
    setActive(0)
  }, [sku])

  useEffect(() => { void load() }, [load])

  const mainCls = MAIN_SIZE_CLS[mainSize]
  const skuKey = sku.trim().toLowerCase()

  if (!urls.length) {
    return (
      <div className={clsx('flex shrink-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50 p-2', mainCls, className)}>
        <Package className="size-6 text-slate-300" strokeWidth={1.25} />
        {skuKey && (
          <p className="text-center font-mono text-[8px] leading-tight text-slate-400">
            {skuKey}.jpg
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={clsx('flex shrink-0 flex-col items-start gap-1.5', className)}>
      <div className={clsx('overflow-hidden rounded-xl border border-slate-200 bg-slate-50', mainCls)}>
        <img
          src={urls[active]}
          alt={`${sku} รูป ${active + 1}`}
          className="h-full w-full object-contain"
        />
      </div>

      {urls.length > 1 && (
        <div className="flex items-center gap-1">
          {urls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={clsx(
                'size-9 overflow-hidden rounded-lg border transition',
                i === active
                  ? 'border-blue-400 ring-1 ring-blue-300'
                  : 'border-slate-200 opacity-60 hover:opacity-100',
              )}
            >
              <img src={url} alt={`thumb ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
