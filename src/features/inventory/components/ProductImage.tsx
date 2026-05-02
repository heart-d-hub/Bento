import { getProductImageUrl } from '@/features/inventory/data/productImages'
import { ImageIcon, Monitor, X, ZoomIn } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const SIZE_CLS = {
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
  xl: 'h-28 w-28',
  fill: 'h-full w-full',
} as const

type Props = {
  sku: string
  size?: keyof typeof SIZE_CLS
  className?: string
  zoomable?: boolean
  onProject?: () => void
  /** เมื่อไม่มีรูปจริง — แสดง avatar gradient + ตัวอักษรนี้แทน (เช่น 'I' จาก IDEMITSU) */
  fallbackLetter?: string
  /** เมื่อไม่มีรูปจริง + ไม่มี letter — แสดง emoji แทน (เช่น 🛢️ สำหรับน้ำมันเครื่อง) */
  fallbackEmoji?: string
  /** วิธีจัดรูปในกรอบ: contain = เห็นทั้งภาพ + letterbox · cover = เต็มกรอบ + crop */
  objectFit?: 'contain' | 'cover'
  /** Inline style ส่งให้ outer wrapper — ใช้กรณีที่ class-based sizing ไม่ทำงาน (Tailwind v4) */
  style?: React.CSSProperties
}

/** Pick gradient ตาม hash ของ string — เพื่อให้สินค้า brand เดียวกันได้สีเดียวกัน */
const FALLBACK_GRADIENTS = [
  'from-blue-400 to-cyan-400',
  'from-emerald-400 to-teal-400',
  'from-violet-400 to-fuchsia-400',
  'from-amber-400 to-orange-400',
  'from-rose-400 to-pink-400',
  'from-indigo-400 to-purple-400',
  'from-sky-400 to-blue-500',
  'from-lime-400 to-emerald-500',
] as const

function pickGradient(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0
  return FALLBACK_GRADIENTS[Math.abs(h) % FALLBACK_GRADIENTS.length]
}

export function ProductImage({ sku, size = 'md', className, zoomable = false, onProject, fallbackLetter, fallbackEmoji, objectFit = 'contain', style }: Props) {
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
        <div className={`group relative shrink-0 ${sizeCls} ${className ?? ''}`} style={style}>
          <img
            src={url}
            alt={sku}
            style={{ objectPosition: 'center center' }}
            className={`h-full w-full rounded-lg border border-slate-200 bg-slate-50 ${objectFit === 'cover' ? 'object-cover' : 'object-contain'} ${zoomable ? 'cursor-zoom-in' : onProject ? 'cursor-pointer' : ''}`}
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
      ) : fallbackLetter || fallbackEmoji ? (
        <div
          className={`relative flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${pickGradient(fallbackLetter || fallbackEmoji || sku)} text-white shadow-inner ${sizeCls} ${className ?? ''}`}
          style={style}
          aria-label={`ไม่มีรูป — ${sku}`}
        >
          {fallbackLetter ? (
            <span className="select-none font-black uppercase leading-none tracking-tight" style={{ fontSize: 'min(60%, 2.5rem)' }}>
              {fallbackLetter.charAt(0)}
            </span>
          ) : (
            <span className="select-none leading-none" style={{ fontSize: 'min(55%, 2rem)' }}>
              {fallbackEmoji}
            </span>
          )}
        </div>
      ) : (
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-300 ${sizeCls} ${className ?? ''}`}
          style={style}
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
