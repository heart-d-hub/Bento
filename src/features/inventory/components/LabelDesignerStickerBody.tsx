import { clsx } from 'clsx'
import { LabelBarcodeSvg } from '@/features/inventory/components/LabelPrintParts'
import { LabelDesignerQrCode } from '@/features/inventory/components/LabelDesignerQrCode'
import {
  barcodeBarsHeightPx,
  defaultBarcodeTextFontSize,
  qrcodePixelSize,
} from '@/features/inventory/data/labelDesignerCanvasUtils'
import type { LabelDesignerElement, LabelDesignerTemplate } from '@/features/inventory/data/labelDesignerTemplateStore'
import {
  fieldLabelTh,
  getDesignerFieldValue,
} from '@/features/inventory/labelDesignerFieldUtils'
import type { EnrichedLabelRow } from '@/features/inventory/labelPrintLayout'
import type { PriceCipherSettings } from '@/features/inventory/data/priceCipherCodec'

export type LabelDesignerStickerBodyProps = {
  template: LabelDesignerTemplate
  row: EnrichedLabelRow
  storeName: string
  priceCipher: PriceCipherSettings
  selectedId?: string | null
  interactive?: boolean
  onPointerDownElement?: (e: React.PointerEvent, el: LabelDesignerElement) => void
}

export function LabelDesignerStickerBody({
  template,
  row,
  storeName,
  priceCipher,
  selectedId = null,
  interactive = false,
  onPointerDownElement,
}: LabelDesignerStickerBodyProps) {
  return (
    <>
      {template.elements.map((el) => {
        const value = getDesignerFieldValue(
          row,
          el.field,
          { storeName, priceCipher },
          { salesUnitIndex: el.salesUnitIndex },
        )
        const isEmpty = !value || value === '—' || value.trim() === ''
        // hideIfEmpty: ซ่อนตอนพิมพ์จริง (ไม่ interactive) แต่โชว์ใน designer พร้อมแสดงสถานะ "ซ่อน"
        if (el.hideIfEmpty && isEmpty && !interactive) return null
        const isSel = interactive && selectedId === el.id
        const barcodeH = barcodeBarsHeightPx(template.heightMm, el.h)
        const qrPx =
          el.kind === 'qrcode'
            ? qrcodePixelSize(template.widthMm, template.heightMm, el.w, el.h)
            : 0
        const fw = el.fontWeight === 'bold' ? 700 : el.fontWeight === 'semibold' ? 600 : 400
        return (
          <div
            key={el.id}
            className={clsx(
              'group absolute box-border overflow-visible bg-white',
              interactive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
              interactive
                ? isSel
                  ? 'border border-violet-500 shadow-md ring-1 ring-violet-300/80'
                  : 'border-0'
                : 'border-0',
              el.hideIfEmpty && isEmpty && interactive && 'opacity-40 outline-dashed outline-1 outline-amber-400',
            )}
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.w}%`,
              height: `${el.h}%`,
            }}
            onPointerDown={interactive && onPointerDownElement ? (e) => onPointerDownElement(e, el) : undefined}
            title={el.hideIfEmpty && isEmpty ? 'จะซ่อนตอนพิมพ์ — ไม่มีข้อมูล' : undefined}
          >
            {interactive && isSel ? (
              <span className="pointer-events-none absolute -top-4 left-0 z-10 max-w-[140%] truncate rounded bg-violet-600 px-1 py-0.5 text-[7px] font-medium text-white shadow">
                {el.kind === 'barcode'
                  ? 'บาร์โค้ด'
                  : el.kind === 'qrcode'
                    ? 'QR code'
                    : fieldLabelTh(el.field)}
              </span>
            ) : null}
            <div className="flex h-full min-h-0 w-full flex-col p-0.5">
              {el.kind === 'barcode' ? (
                <div className="flex h-full min-h-0 items-center justify-center">
                  <LabelBarcodeSvg
                    value={value || '00000000'}
                    height={barcodeH}
                    textFontSize={el.fontSize ?? defaultBarcodeTextFontSize(barcodeH)}
                    className="h-full max-h-full w-full min-w-0"
                  />
                </div>
              ) : el.kind === 'qrcode' ? (
                <div className="flex h-full min-h-0 items-center justify-center">
                  <LabelDesignerQrCode value={value || ' '} sizePx={qrPx} />
                </div>
              ) : el.textVariant === 'badge' ? (
                <div
                  className={clsx(
                    'flex h-full min-h-0 items-center px-px',
                    el.textAlign === 'right' && 'justify-end',
                    el.textAlign === 'center' && 'justify-center',
                    (!el.textAlign || el.textAlign === 'left') && 'justify-start',
                  )}
                >
                  <span
                    className="max-w-full truncate rounded-sm border-2 border-slate-900 bg-white px-1 py-px leading-none text-slate-900 shadow-sm print:border-0 print:shadow-none"
                    style={{
                      fontSize: el.fontSize ?? 8,
                      fontWeight: fw,
                      fontStyle: el.italic ? 'italic' : undefined,
                      textDecoration: el.underline ? 'underline' : undefined,
                      color: el.color || undefined,
                    }}
                    title={value}
                  >
                    {value}
                  </span>
                </div>
              ) : (
                <p
                  className={clsx(
                    'line-clamp-6 h-full min-h-0 leading-tight',
                    el.field === 'priceCipher' && 'font-mono tracking-tight',
                    !el.color && 'text-slate-900',
                  )}
                  style={{
                    fontSize: el.fontSize ?? 9,
                    textAlign: el.textAlign ?? 'left',
                    fontWeight: fw,
                    fontStyle: el.italic ? 'italic' : undefined,
                    textDecoration: el.underline ? 'underline' : undefined,
                    color: el.color || undefined,
                  }}
                >
                  {value}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}
