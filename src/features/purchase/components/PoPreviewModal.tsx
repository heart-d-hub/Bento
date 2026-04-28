import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer, FileDown, ClipboardCopy } from 'lucide-react'
import { clsx } from 'clsx'
import { buildPoPreviewDoc } from '@/features/purchase/utils/printPurchaseOrder'
import type { PurchaseOrder } from '@/features/purchase/data/poTypes'

type Props = {
  po: PurchaseOrder
  shopName: string
  copyDone: boolean
  onCopy: () => void
  onClose: () => void
}

export function PoPreviewModal({ po, shopName, copyDone, onCopy, onClose }: Props) {
  const html = buildPoPreviewDoc(po, shopName)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const printIframe = () => {
    iframeRef.current?.contentWindow?.print()
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900/80">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-2 bg-white px-4 py-2 shadow">
        <span className="mr-2 flex-1 text-sm font-bold text-slate-800">
          ตัวอย่างเอกสาร — {po.poNo}
        </span>

        <button
          type="button"
          onClick={printIframe}
          className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Printer className="size-3.5" aria-hidden />
          พิมพ์
        </button>

        <button
          type="button"
          onClick={printIframe}
          className="inline-flex items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
        >
          <FileDown className="size-3.5" aria-hidden />
          บันทึก PDF
        </button>

        <button
          type="button"
          onClick={onCopy}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors',
            copyDone
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
          )}
        >
          <ClipboardCopy className="size-3.5" aria-hidden />
          {copyDone ? 'คัดลอกแล้ว ✓' : 'คัดลอกข้อความ'}
        </button>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        <button
          type="button"
          onClick={onClose}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="ปิด"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Preview area */}
      <div className="flex flex-1 items-start justify-center overflow-auto bg-slate-200 p-6">
        <iframe
          ref={iframeRef}
          srcDoc={html}
          title="ตัวอย่างใบสั่งซื้อ"
          className="h-[1000px] w-full max-w-3xl rounded bg-white shadow-xl"
          sandbox="allow-same-origin allow-modals"
        />
      </div>
    </div>,
    document.body,
  )
}
