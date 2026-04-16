import { X } from 'lucide-react'
import { useEffect } from 'react'

export const NUT_STOCK_OPEN_BOX_TITLE = 'ยืนยันแกะกล่อง'

export function nutStockOpenBoxMessage(productName: string, piecesPerBox: number): string {
  return `แกะกล่อง ${productName}\n+${piecesPerBox.toLocaleString('th-TH')}`
}

type SmallConfirmModalProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** เน้นปุ่มยืนยันแบบทอง (เช่น แกะกล่อง) */
  confirmVariant?: 'slate' | 'amber'
  onConfirm: () => void
  onClose: () => void
}

export function SmallConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  confirmVariant = 'slate',
  onConfirm,
  onClose,
}: SmallConfirmModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const confirmClass =
    confirmVariant === 'amber'
      ? 'border border-amber-700/35 bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 text-amber-950 shadow-sm shadow-amber-900/15 hover:from-amber-50 hover:via-amber-200 hover:to-amber-400'
      : 'bg-slate-900 text-white shadow-md shadow-slate-900/20 hover:bg-slate-800'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        aria-label="ปิด"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="small-confirm-title"
        className="relative z-10 w-full max-w-[17.5rem] rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xl ring-1 ring-slate-900/[0.06]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id="small-confirm-title" className="text-sm font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-m-0.5 shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="ปิด"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>
        <p className="mt-2 rounded-lg bg-slate-50/90 px-2.5 py-2 text-[11px] leading-relaxed text-slate-600 whitespace-pre-line">
          {message}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex min-h-9 flex-1 items-center justify-center rounded-lg text-xs font-semibold transition ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
