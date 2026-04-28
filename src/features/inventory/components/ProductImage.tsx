import { getProductImageUrl } from '@/features/inventory/data/productImages'
import { ImageIcon, Monitor, X, ZoomIn } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const SIZE_CLS = {
  xs: 'size-8',
  sm: 'size-10',
  md: 'size-16',
  lg: 'size-24',
} as const

type Props = {
  sku: string
  size?: keyof typeof SIZE_CLS
  className?: string
  zoomable?: boolean
  onProject?: () => void
}

export function ProductImage({ sku, size = 'md', className, zoomable = false, onProject }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [errored, setErrored] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    setUrl(null)
    setErrored(false)
    if (retryTimer.current) clearTimeout(retryTimer.current)

    async function tryFetch() {
      if (cancelled || !sku.trim()) return
      const u = await getProductImageUrl(sku)
      if (cancelled) return
      setUrl(u)
      if (!u) {
        retryTimer.current = setTimeout(tryFetch, 6000)
      }
    }

    void tryFetch()
    return () => {
      cancelled = true
      if (retryTimer.current) clearTimeout(retryTimer.current)
    }
  }, [sku])

  const sizeCls = SIZE_CLS[size]
  const hasImage = !!url && !errored

  return (
    <>
      {hasImage ? (
        <div className={`group relative shrink-0 ${sizeCls} ${className ?? ''}`}>
          <img
            src={url}
            alt={sku}
            className={`h-full w-full rounded-lg border border-slate-200 bg-slate-50 object-contain ${zoomable ? 'cursor-zoom-in' : onProject ? 'cursor-pointer' : ''}`}
            onError={() => setErrored(true)}
            onClick={(e) => {
              if (!zoomable && onProject) { e.stopPropagation(); onProject(); return }
              if (zoomable) setLightboxOpen(true)
            }}
          />
          {zoomable && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100 cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
            >
              <ZoomIn className="size-5 text-white drop-shadow" />
            </div>
          )}
          {onProject && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onProject() }}
              className="absolute bottom-0.5 right-0.5 flex size-5 items-center justify-center rounded bg-indigo-600/80 text-white opacity-0 shadow transition group-hover:opacity-100 hover:bg-indigo-600"
              aria-label="แสดงบนจอลูกค้า"
              title="แสดงบนจอลูกค้า"
            >
              <Monitor className="size-3" />
            </button>
          )}
        </div>
      ) : (
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-300 ${sizeCls} ${className ?? ''}`}
        >
          <ImageIcon className="size-5" strokeWidth={1.5} aria-hidden />
        </div>
      )}

      {lightboxOpen && hasImage && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="ปิด"
            >
              <X className="size-5" />
            </button>
            <img
              src={url!}
              alt={sku}
              className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-sm font-bold text-white/60">
              {sku}
            </p>
          </div>,
          document.body,
        )
      }
    </>
  )
}
