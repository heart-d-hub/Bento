import type { LabelPrintFormDef } from '@/features/inventory/data/labelPrintForms'
import type { EnrichedLabelRow } from '@/features/inventory/labelPrintLayout'
import JsBarcode from 'jsbarcode'
import { useEffect, useRef } from 'react'

export type LabelDisplayFlags = {
  showName: boolean
  showOem: boolean
  showFactoryNo: boolean
  showSku: boolean
  showPrice: boolean
}

function formatBaht(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function LabelBarcodeSvg({
  value,
  height,
  textFontSize,
  className,
}: {
  value: string
  height: number
  /** ขนาดตัวเลขมนุษย์อ่านได้ใต้แท่ง — ถ้าไม่ส่งจะคำนวณจากความสูงแท่ง */
  textFontSize?: number
  className?: string
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const el = svgRef.current
    if (!el || !value.trim()) return
    try {
      el.innerHTML = ''
      const fontSize = textFontSize ?? (height > 28 ? 11 : 9)
      JsBarcode(el, value.trim(), {
        format: 'CODE128',
        displayValue: true,
        height,
        width: 1.2,
        margin: 2,
        fontSize,
      })
    } catch {
      /* invalid code */
    }
  }, [value, height, textFontSize])

  return <svg ref={svgRef} className={className ?? 'max-h-[52px] w-full min-w-0'} aria-hidden />
}

export function LabelStickerCell({
  row,
  flags,
  forcePrice,
  form,
}: {
  row: EnrichedLabelRow
  flags: LabelDisplayFlags
  forcePrice?: boolean
  form: LabelPrintFormDef
}) {
  const per = form.cols * form.rows
  const tight = per >= 8
  const barcodeH = form.id === 'shelf_1x1_large' ? 44 : tight ? 22 : 36
  const large = form.id === 'shelf_1x1_large'
  const showPrice = forcePrice || flags.showPrice
  const encodedForBarcode = (row.barcode || row.sku || '').trim()
  const skuOnly = (row.sku || '').trim()
  const showSkuLine =
    flags.showSku && skuOnly.length > 0 && skuOnly !== encodedForBarcode

  return (
    <div
      className={[
        'flex h-full min-h-0 flex-col border border-slate-800 bg-white p-1.5 text-slate-900 print:border-black',
        large ? 'text-sm' : tight ? 'text-[9px] leading-tight' : 'text-[10px] leading-snug',
      ].join(' ')}
    >
      <div className="min-h-0 shrink">
        <LabelBarcodeSvg value={row.barcode || row.sku || ''} height={barcodeH} />
      </div>
      {showSkuLine ? (
        <p className="mt-0.5 font-mono tabular-nums text-[10px] font-semibold">{row.sku}</p>
      ) : null}
      {flags.showName ? <p className="line-clamp-3 font-medium">{row.name || '—'}</p> : null}
      {flags.showOem ? <p className="text-slate-700">OEM: {row.oemNo || '—'}</p> : null}
      {flags.showFactoryNo ? <p className="text-slate-700">รุ่น/โรงงาน: {row.factoryNo || '—'}</p> : null}
      {showPrice ? (
        <p className="mt-auto font-semibold tabular-nums">
          {row.price != null ? `฿${formatBaht(row.price)}` : '—'}
        </p>
      ) : null}
    </div>
  )
}

export function LabelPrintPageGrid({
  pageRows,
  flags,
  form,
  pageIndex,
}: {
  pageRows: (EnrichedLabelRow | null)[]
  flags: LabelDisplayFlags
  form: LabelPrintFormDef
  pageIndex: number
}) {
  const { cols, rows } = form
  const gridStyle = {
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
  }

  return (
    <div
      className="mx-auto box-border grid min-h-[260mm] w-[190mm] gap-1 bg-white p-3 print:min-h-[277mm] print:w-[210mm]"
      style={gridStyle}
    >
      {pageRows.map((cell, i) =>
        cell ? (
          <LabelStickerCell
            key={`${cell.id}-${pageIndex}-${i}`}
            row={cell}
            flags={flags}
            forcePrice={form.forcePrice}
            form={form}
          />
        ) : (
          <div
            key={`empty-${pageIndex}-${i}`}
            className="min-h-[4rem] border border-dashed border-slate-200 bg-slate-50 print:border-slate-300"
          />
        ),
      )}
    </div>
  )
}
