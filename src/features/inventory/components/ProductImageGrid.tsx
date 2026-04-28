import {
  deleteProductImage,
  getProductImageUrls,
  saveProductImageFromPath,
} from '@/features/inventory/data/productImages'
import { isTauri } from '@/features/desktop/isTauri'
import { clsx } from 'clsx'
import { Camera, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const SLOTS = [1, 2, 3, 4] as const

type Props = {
  sku: string
  className?: string
}

export function ProductImageGrid({ sku, className }: Props) {
  const [urls, setUrls] = useState<(string | null)[]>([null, null, null, null])
  const [loading, setLoading] = useState(false)
  const [busySlot, setBusySlot] = useState<number | null>(null)

  const reload = useCallback(async () => {
    if (!sku.trim()) {
      setUrls([null, null, null, null])
      return
    }
    setLoading(true)
    try {
      const fetched = await getProductImageUrls(sku)
      const next: (string | null)[] = [null, null, null, null]
      fetched.forEach((u, i) => { if (i < 4) next[i] = u })
      setUrls(next)
    } finally {
      setLoading(false)
    }
  }, [sku])

  useEffect(() => { void reload() }, [reload])

  const handlePick = async (slot: number) => {
    if (!isTauri() || !sku.trim() || busySlot !== null) return
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open({
      title: `เลือกรูปภาพ (ช่องที่ ${slot})`,
      filters: [{ name: 'Image', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
      multiple: false,
    })
    if (!selected || typeof selected !== 'string') return
    setBusySlot(slot)
    try {
      await saveProductImageFromPath(sku, slot, selected)
      await reload()
    } finally {
      setBusySlot(null)
    }
  }

  const handleDelete = async (e: React.MouseEvent, slot: number) => {
    e.stopPropagation()
    if (!sku.trim() || busySlot !== null) return
    setBusySlot(slot)
    try {
      await deleteProductImage(sku, slot)
      await reload()
    } finally {
      setBusySlot(null)
    }
  }

  const disabled = !sku.trim() || !isTauri()

  return (
    <div className={clsx('flex items-center gap-1.5', className)}>
      {SLOTS.map((slot) => {
        const idx = slot - 1
        const url = urls[idx]
        const busy = busySlot === slot

        return (
          <div key={slot} className="relative">
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => { if (!url) void handlePick(slot) }}
              className={clsx(
                'group relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg transition',
                url
                  ? 'cursor-default border border-slate-200 bg-slate-50'
                  : disabled
                    ? 'cursor-not-allowed border border-dashed border-slate-200 bg-slate-50'
                    : 'cursor-pointer border border-dashed border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50',
              )}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin text-slate-400" />
              ) : url ? (
                <>
                  <img src={url} alt={`รูป ${slot}`} className="h-full w-full object-cover" />
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100"
                    onClick={() => void handlePick(slot)}
                    role="button"
                    aria-label="เปลี่ยนรูป"
                  >
                    <Camera className="size-4 text-white" />
                  </div>
                </>
              ) : loading ? (
                <Loader2 className="size-3.5 animate-spin text-slate-300" />
              ) : (
                <Camera className="size-4 text-slate-300 group-hover:text-blue-400" />
              )}
            </button>

            {url && !busy && (
              <button
                type="button"
                onClick={(e) => void handleDelete(e, slot)}
                className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm transition hover:bg-rose-600"
                aria-label="ลบรูป"
              >
                <X className="size-2.5" />
              </button>
            )}

            {slot === 1 && (
              <span className="absolute -bottom-3.5 left-0 right-0 text-center text-[8px] font-medium text-slate-400">
                หลัก
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
