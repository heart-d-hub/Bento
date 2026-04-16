import {
  computeLineColumnGroupLayout,
  getLineCellValue,
  getLineTableConfig,
  lineColumnBodyFontPx,
  lineColumnHeaderFontPx,
  lineColumnSingleColumnBandPx,
  lineColumnSingleColumnRowLinePx,
  lineTableHeaderCellLabel,
  resolveLineColumnBodyTextAlign,
  resolveLineColumnHeaderTextAlign,
  TAX_INVOICE_DEFAULT_TITLE_TH,
  TAX_INVOICE_FORM_SAMPLE,
  toThaiBahtText,
  type TaxInvoiceLineColumnGroupLayout,
  type TaxInvoiceLineItemRow,
} from '@/features/inventory/data/taxInvoiceFormCanvasShared'
import type { TaxInvoiceLineColumnRole } from '@/features/inventory/data/taxInvoiceFormDesignerStore'
import { TRACTOR_FEED_SIDE_MARGIN_MM } from '@/features/inventory/data/taxInvoiceDesignerUiPrefs'
import {
  isDraftGuideFieldKey,
  type TaxInvoiceCanvasElement,
  type TaxInvoiceFormRecord,
} from '@/features/inventory/data/taxInvoiceFormDesignerStore'
import type { StoreProfile } from '@/features/settings/data/mockStoreProfile'
import { clsx } from 'clsx'
import { useMemo, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'

const GRID_10MM_STYLE: CSSProperties = {
  backgroundSize: '10mm 10mm',
  backgroundImage:
    'linear-gradient(to right, rgb(203 213 225 / 0.55) 1px, transparent 1px), linear-gradient(to bottom, rgb(203 213 225 / 0.55) 1px, transparent 1px)',
}

function BlockContent({
  el,
  profile,
  lineItems,
  contentInnerWidthMm,
  lineColumnGroupLayoutByGroupId,
}: {
  el: TaxInvoiceCanvasElement
  profile: StoreProfile
  lineItems: readonly TaxInvoiceLineItemRow[]
  contentInnerWidthMm: number
  lineColumnGroupLayoutByGroupId: Map<string, TaxInvoiceLineColumnGroupLayout>
}) {
  const S = TAX_INVOICE_FORM_SAMPLE
  const fsPx = Math.max(7, Math.min(22, (el.fontSize ?? 10) * 1.15))
  const ta = el.textAlign ?? 'left'
  const insetLeftMm = el.textInsetLeftMm ?? 0
  const insetTopMm = el.textInsetTopMm ?? 0
  const base: CSSProperties = {
    fontSize: `${fsPx}px`,
    lineHeight: 1.25,
    textAlign: ta,
    wordBreak: 'break-word',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  }

  switch (el.field) {
    case 'title_th': {
      const titleText = (el.staticText ?? '').trim() || TAX_INVOICE_DEFAULT_TITLE_TH
      const il = el.textInsetLeftMm ?? 0
      const it = el.textInsetTopMm ?? 0
      return (
        <div
          style={{
            fontSize: `${fsPx}px`,
            lineHeight: 1.25,
            textAlign: 'left',
            wordBreak: 'break-word',
            overflow: 'hidden',
            width: '100%',
            height: '100%',
            fontWeight: 700,
            boxSizing: 'border-box',
            paddingLeft: `${il}mm`,
            paddingTop: `${it}mm`,
          }}
          className="text-slate-900"
        >
          <span className="min-w-0 block leading-tight">{titleText}</span>
        </div>
      )
    }
    case 'title_en':
      return (
        <div style={{ ...base, fontWeight: 600 }} className="text-slate-600">
          Tax Invoice / Receipt
        </div>
      )
    case 'seller_block':
      return (
        <div
          style={{
            ...base,
            textAlign: 'left',
            boxSizing: 'border-box',
            paddingLeft: `${el.textInsetLeftMm ?? 0}mm`,
            paddingTop: `${el.textInsetTopMm ?? 0}mm`,
          }}
          className="text-slate-800"
        >
          <div className="font-semibold" style={{ fontSize: `${Math.max(8, fsPx + 1.5)}px` }}>
            {profile.storeName || 'ชื่อร้าน'}
          </div>
          <div>{(profile.address || '').slice(0, 120)}</div>
          <div>เลขประจำตัวผู้เสียภาษี : {profile.taxId || '—'}</div>
          <div>โทรศัพท์ : {profile.phone || '—'}</div>
        </div>
      )
    case 'buyer_block':
      return (
        <div
          style={{
            ...base,
            textAlign: 'left',
            boxSizing: 'border-box',
            paddingLeft: `${el.textInsetLeftMm ?? 0}mm`,
            paddingTop: `${el.textInsetTopMm ?? 0}mm`,
          }}
          className="text-slate-800"
        >
          <div>{S.buyerName}</div>
          <div>{S.buyerAddr}</div>
          <div>
            เลขประจำตัวผู้เสียภาษี : {S.buyerTaxId} โทรศัพท์ : {S.buyerPhone}
          </div>
        </div>
      )
    case 'buyer_name':
      return (
        <div style={{ ...base, textAlign: 'left' }} className="text-slate-800">
          {S.buyerName}
        </div>
      )
    case 'buyer_tax_id':
      return (
        <div style={{ ...base, textAlign: 'left' }} className="text-slate-800">
          {S.buyerTaxId}
        </div>
      )
    case 'buyer_address':
      return (
        <div style={{ ...base, textAlign: 'left' }} className="text-slate-800">
          {S.buyerAddr}
        </div>
      )
    case 'doc_meta':
      return (
        <div
          style={{
            ...base,
            textAlign: 'left',
            lineHeight: el.docLineHeight ?? 1.25,
            boxSizing: 'border-box',
            paddingLeft: `${insetLeftMm}mm`,
            paddingTop: `${insetTopMm}mm`,
          }}
          className="text-slate-800"
        >
          <div>{S.receiptNo}</div>
          <div>{S.date}</div>
          <div>{S.pageLabel}</div>
        </div>
      )
    case 'doc_receipt_no':
      return (
        <div style={{ ...base, textAlign: 'left' }} className="text-slate-800">
          {S.receiptNo}
        </div>
      )
    case 'doc_date':
      return (
        <div style={{ ...base, textAlign: 'left' }} className="text-slate-800">
          {S.date}
        </div>
      )
    case 'customer_code':
      return (
        <div style={{ ...base, textAlign: 'left' }} className="text-slate-800">
          <div>รหัสลูกค้า</div>
          <div>{S.customerCode}</div>
        </div>
      )
    case 'line_column': {
      const role = el.lineColumnRole ?? 'empty'
      const showHeader = el.lineColumnShowHeader !== false
      const bodyPx = lineColumnBodyFontPx(el)
      const headerPx = lineColumnHeaderFontPx(el)
      const taH = resolveLineColumnHeaderTextAlign(el, role)
      const taB = resolveLineColumnBodyTextAlign(el, role)
      const alignClass = (ta: 'left' | 'center' | 'right') =>
        ta === 'center' ? 'text-center' : ta === 'right' ? 'text-right tabular-nums' : 'text-left [overflow-wrap:anywhere]'
      const headerAlign = alignClass(taH)
      const bodyAlign = alignClass(taB)
      const headerOffsetMm = el.lineColumnHeaderOffsetMm ?? 0
      const bodyOffsetMm = el.lineColumnBodyOffsetMm ?? 0
      const colWmm = (el.w / 100) * Math.max(1, contentInnerWidthMm)
      const gid = el.lineColumnGroupId ?? ''
      const synced = lineColumnGroupLayoutByGroupId.get(gid)
      const headerBandPx = synced?.headerBandPx ?? lineColumnSingleColumnBandPx(el, colWmm)
      const rowLinePx = synced?.rowLinePx ?? lineColumnSingleColumnRowLinePx(el)
      return (
        <div
          style={{
            ...base,
            textAlign: 'left',
            fontSize: `${bodyPx}px`,
            fontWeight: 500,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
          className="text-slate-900"
        >
          <div
            className="relative w-full shrink-0 box-border"
            style={{ minHeight: headerBandPx }}
          >
            {showHeader ? (
              <div
                className={clsx('absolute left-0 right-0 top-0 font-semibold leading-tight text-slate-800', headerAlign)}
                style={{
                  fontSize: `${headerPx}px`,
                  ...(headerOffsetMm !== 0 ? { transform: `translateY(${headerOffsetMm}mm)` } : {}),
                }}
              >
                {lineTableHeaderCellLabel(role)}
              </div>
            ) : null}
          </div>
          <div
            className="min-h-0 flex-1 overflow-hidden box-border"
            style={bodyOffsetMm !== 0 ? { marginTop: `${bodyOffsetMm}mm` } : undefined}
          >
            {lineItems.map((row, ri) => (
              <div
                key={ri}
                className={clsx('box-border w-full min-h-0 leading-snug', bodyAlign)}
                style={{ minHeight: rowLinePx }}
              >
                {getLineCellValue(row, role, ri)}
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'line_table': {
      const small = Math.max(6, fsPx - 2)
      const { widths, roles, showHeader } = getLineTableConfig(el)
      const tdClass = (role: TaxInvoiceLineColumnRole) => {
        if (role === 'unit') return 'px-0.5 py-px text-center align-top whitespace-nowrap tabular-nums'
        if (
          role === 'seq' ||
          role === 'quantity' ||
          role === 'unitPrice' ||
          role === 'discountPct' ||
          role === 'discountTotal' ||
          role === 'lineTotal'
        ) {
          return 'px-0.5 py-px text-right align-top whitespace-nowrap tabular-nums'
        }
        return 'break-words py-px px-0.5 align-top text-left [overflow-wrap:anywhere]'
      }
      return (
        <div
          style={{ ...base, textAlign: 'left', fontSize: `${small}px`, lineHeight: 1.3, fontWeight: 500 }}
          className="text-slate-900"
        >
          <table className="w-full border-collapse [table-layout:fixed]">
            <colgroup>
              {widths.map((p, i) => (
                <col key={i} style={{ width: `${p}%` }} />
              ))}
            </colgroup>
            {showHeader ? (
              <thead>
                <tr>
                  {roles.map((role, hi) => (
                    <th
                      key={hi}
                      className={clsx(
                        'py-px px-0.5 align-top text-[length:inherit] font-semibold leading-tight text-slate-800',
                        tdClass(role),
                      )}
                    >
                      {lineTableHeaderCellLabel(role)}
                    </th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {lineItems.map((row, ri) => (
                <tr key={ri}>
                  {roles.map((role, ci) => (
                    <td key={ci} className={tdClass(role)}>
                      {getLineCellValue(row, role, ri)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    case 'totals_block': {
      const lhTotals = el.totalsLineHeight ?? el.lineHeight ?? 1.25
      const gapMm = el.totalsLabelValueGapMm ?? 2
      const valueW = el.totalsValueColumnWidthPct ?? 36
      const labelAlign = el.totalsLabelTextAlign ?? el.textAlign ?? 'left'
      const valueAlign = el.totalsValueTextAlign ?? 'right'
      const line = (label: string, value: string, strong?: boolean) => (
        <div style={{ display: 'flex', gap: `${gapMm}mm`, alignItems: 'baseline' }}>
          <span style={{ flex: '1 1 auto', minWidth: 0, textAlign: labelAlign }}>{label}</span>
          <span
            style={{ flex: `0 0 ${valueW}%`, textAlign: valueAlign, whiteSpace: 'nowrap' }}
            className={clsx(strong && 'font-semibold')}
          >
            {value}
          </span>
        </div>
      )
      return (
        <div style={{ ...base, textAlign: 'left', lineHeight: lhTotals }} className="text-slate-800">
          {line('รวมเป็นเงิน', S.subtotal)}
          {line('ภาษีมูลค่าเพิ่ม 7%', S.vat)}
          {line('จำนวนเงินทั้งสิ้น', S.total, true)}
        </div>
      )
    }
    case 'total_text':
      return (
        <div style={{ ...base, textAlign: ta }} className="text-slate-800">
          {toThaiBahtText(S.total)}
        </div>
      )
    case 'staff':
      return (
        <div
          style={{
            ...base,
            textAlign: 'left',
            boxSizing: 'border-box',
            paddingLeft: `${insetLeftMm}mm`,
            paddingTop: `${insetTopMm}mm`,
          }}
          className="text-slate-700"
        >
          พนักงานขาย: {S.staff}
        </div>
      )
    case 'custom_text':
      return (
        <div style={{ ...base, textAlign: ta }} className="text-slate-800">
          {(el.staticText ?? '').trim() || '— ข้อความกำหนดเอง —'}
        </div>
      )
    case 'draft_rect':
      return (
        <div
          className="h-full w-full box-border border border-dashed border-slate-500 bg-transparent"
          aria-hidden
        />
      )
    case 'draft_line_h':
      return <div className="h-full w-full box-border border-t-2 border-slate-600 bg-transparent" aria-hidden />
    case 'draft_line_v':
      return <div className="h-full w-full box-border border-l-2 border-slate-600 bg-transparent" aria-hidden />
    default:
      return null
  }
}

export type TaxInvoiceDesignerAssist = {
  /** กริด 10mm ในพื้นที่พิมพ์ (กล่องขาว) — ช่วยทาบฟอร์มสำเร็จ */
  showGrid10mm?: boolean
  /** แถบซ้าย/ขวาแสดงโซนรูเจาต่อเนื่อง (ไม่ถูกพิมพ์จากแอป) */
  showTractorMargins?: boolean
  /** แสดงบล็อกแบบร่าง (เส้น / กรอบ) บนแคนวาส — ปิดเพื่อโฟกัสบล็อกข้อมูล */
  showDraftGuides?: boolean
  /** ซ่อนบล็อกข้อมูลบนแคนวาส — เห็นเฉพาะแบบร่าง (ช่วยทาบฟอร์มสำเร็จ) */
  hideDataBlocksPreview?: boolean
  /** ความกว้างแถบรูเจาแต่ละข้าง มม. */
  tractorSideMarginMm?: number
}

export type TaxInvoiceFormCanvasBodyProps = {
  form: TaxInvoiceFormRecord
  storeProfile: StoreProfile
  selectedId: string | null
  interactive?: boolean
  /** อ้างอิงพื้นที่พิมพ์ (กล่องขาว) — ใช้คำนวณ % ตอนลาก */
  contentAreaRef?: RefObject<HTMLDivElement | null>
  onPointerDownContentArea?: (e: ReactPointerEvent<HTMLDivElement>) => void
  onPointerDownElement?: (e: ReactPointerEvent<HTMLDivElement>, el: TaxInvoiceCanvasElement) => void
  /** เฉพาะโหมดออกแบบ: กริด / ขอบรูเจา / พิกัดเมาส์บนกระดาษ (มม.) */
  designerAssist?: TaxInvoiceDesignerAssist
  onDesignerPaperPointerMm?: (pos: { xMm: number; yMm: number } | null) => void
  /** แถวรายการตัวอย่าง — แยกตัวแปรต่อช่อง; ไม่ส่ง = ใช้ค่าเริ่มต้น */
  linePreviewRows?: readonly TaxInvoiceLineItemRow[]
}

export function TaxInvoiceFormCanvasBody({
  form,
  storeProfile,
  selectedId,
  interactive,
  contentAreaRef,
  onPointerDownContentArea,
  onPointerDownElement,
  designerAssist,
  onDesignerPaperPointerMm,
  linePreviewRows,
}: TaxInvoiceFormCanvasBodyProps) {
  const { pageWidthMm, pageHeightMm, marginTopMm, marginRightMm, marginBottomMm, marginLeftMm, elements } = form
  const lineItems = linePreviewRows ?? TAX_INVOICE_FORM_SAMPLE.lines
  const innerW = Math.max(1, pageWidthMm - marginLeftMm - marginRightMm)
  const innerH = Math.max(1, pageHeightMm - marginTopMm - marginBottomMm)
  const lineColumnGroupLayoutByGroupId = useMemo(
    () => computeLineColumnGroupLayout(elements, innerW),
    [elements, innerW],
  )
  const tractorMm = designerAssist?.tractorSideMarginMm ?? TRACTOR_FEED_SIDE_MARGIN_MM
  const showGrid = Boolean(designerAssist?.showGrid10mm)
  const showTractor = Boolean(designerAssist?.showTractorMargins)
  const showDraftGuides = designerAssist?.showDraftGuides !== false
  const hideDataBlocksPreview = Boolean(designerAssist?.hideDataBlocksPreview)

  return (
    <div
      className={clsx('relative bg-slate-300/90 shadow-md', interactive && onDesignerPaperPointerMm && 'cursor-crosshair')}
      style={{ width: `${pageWidthMm}mm`, height: `${pageHeightMm}mm`, boxSizing: 'border-box' }}
      onPointerMove={
        onDesignerPaperPointerMm
          ? (e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              if (rect.width <= 0 || rect.height <= 0) return
              const xMm = ((e.clientX - rect.left) / rect.width) * pageWidthMm
              const yMm = ((e.clientY - rect.top) / rect.height) * pageHeightMm
              onDesignerPaperPointerMm({
                xMm: Math.max(0, Math.min(pageWidthMm, xMm)),
                yMm: Math.max(0, Math.min(pageHeightMm, yMm)),
              })
            }
          : undefined
      }
      onPointerLeave={onDesignerPaperPointerMm ? () => onDesignerPaperPointerMm(null) : undefined}
    >
      {showTractor ? (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] flex flex-col items-center justify-evenly border-r border-red-200/90 bg-rose-50/75 py-3"
            style={{ width: `${tractorMm}mm` }}
            aria-hidden
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={`tl-${i}`} className="size-1.5 rounded-full bg-rose-300/90" />
            ))}
            <span className="pointer-events-none absolute left-1/2 top-2 origin-left -translate-x-1/2 rotate-90 text-[9px] font-semibold text-rose-500 tabular-nums">
              {tractorMm} mm
            </span>
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-[1] flex flex-col items-center justify-evenly border-l border-red-200/90 bg-rose-50/75 py-3"
            style={{ width: `${tractorMm}mm` }}
            aria-hidden
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={`tr-${i}`} className="size-1.5 rounded-full bg-rose-300/90" />
            ))}
            <span className="pointer-events-none absolute left-1/2 top-2 origin-left -translate-x-1/2 rotate-90 text-[9px] font-semibold text-rose-500 tabular-nums">
              {tractorMm} mm
            </span>
          </div>
        </>
      ) : null}
      <div
        ref={contentAreaRef}
        role={interactive ? 'application' : undefined}
        aria-label={interactive ? 'พื้นที่ออกแบบฟอร์มใบกำกับ' : undefined}
        className="absolute z-[2] box-border bg-white"
        style={{
          left: `${marginLeftMm}mm`,
          top: `${marginTopMm}mm`,
          width: `${innerW}mm`,
          height: `${innerH}mm`,
          ...(showGrid ? GRID_10MM_STYLE : {}),
        }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) onPointerDownContentArea?.(e)
        }}
      >
        {elements.map((el) => {
          const sel = el.id === selectedId
          const draftGuide = isDraftGuideFieldKey(el.field)
          const draftHidden = draftGuide && !showDraftGuides
          const dataBlockHidden = hideDataBlocksPreview && !draftGuide
          const blockHidden = draftHidden || dataBlockHidden
          return (
            <div
              key={el.id}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? -1 : undefined}
              onPointerDown={
                interactive && onPointerDownElement && !blockHidden ? (e) => onPointerDownElement(e, el) : undefined
              }
              className={clsx(
                'absolute box-border overflow-hidden',
                draftGuide ? 'p-0' : 'p-0.5',
                interactive && !blockHidden && 'cursor-grab active:cursor-grabbing',
                blockHidden && 'pointer-events-none opacity-0',
                sel ? 'ring-2 ring-violet-500 ring-offset-1' : interactive && !blockHidden && 'ring-1 ring-violet-300/60',
              )}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.w}%`,
                height: `${el.h}%`,
              }}
            >
              <BlockContent
                el={el}
                profile={storeProfile}
                lineItems={lineItems}
                contentInnerWidthMm={innerW}
                lineColumnGroupLayoutByGroupId={lineColumnGroupLayoutByGroupId}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
