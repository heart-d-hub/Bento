import { clsx } from 'clsx'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { ReceiptDesignerLayout } from '@/features/inventory/data/receiptDesignerStore'
import {
  RECEIPT_FONT_STACK,
  type ReceiptExtraBlock,
} from '@/features/inventory/data/receiptDesignerExtras'
import type { StoreProfile } from '@/features/settings/data/mockStoreProfile'

export type ReceiptDesignerPrintData = {
  /** เลขที่ใบเสร็จจริงตอนพิมพ์จาก POS — ถ้าไม่ส่งใช้ตัวอย่างในตัวออกแบบ */
  receiptNo?: string
  /** แทนช่องข้อความท้ายบิลช่อง 1 ตอนพิมพ์จริง */
  endBillText1?: string
  /** แทนข้อความโปรท้ายบิล ตอนพิมพ์จริง */
  endBillPromoText?: string
}

export type ReceiptDesignerPreviewProps = {
  layout: ReceiptDesignerLayout
  profile: StoreProfile
  branchLabel?: string
  cashierLabel?: string
  className?: string
  printData?: ReceiptDesignerPrintData
}

const SAMPLE_ITEMS = [
  { no: 1, name: 'น้ำมันเครื่อง 5W-30 (4L)', sku: 'OIL-5W30-4L', unit: 890, qty: 1, line: 890 },
  { no: 2, name: 'ไส้กรองอากาศ', sku: 'AF-CIV16', unit: 320, qty: 2, line: 640 },
  { no: 3, name: 'ผ้าเบรกหน้า', sku: 'BP-FR-01', unit: 1250, qty: 1, line: 1250 },
] as const

const SAMPLE_RECEIPT_NO = 'R-2026-0411-0001'

function fmtBaht(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Divider({ show }: { show: boolean }) {
  if (!show) return null
  return <div className="my-2 border-t border-dashed border-slate-400" />
}

function ReceiptEndBillBarcode({ value, layout }: { value: string; layout: ReceiptDesignerLayout }) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const barHeight = Math.round(Math.min(52, Math.max(34, layout.baseFontPx * 2.85)))

  useEffect(() => {
    const el = svgRef.current
    if (!el || !value.trim()) return
    try {
      el.innerHTML = ''
      JsBarcode(el, value.trim(), {
        format: 'CODE128',
        displayValue: true,
        height: barHeight,
        width: 1.12,
        margin: 2,
        fontSize: Math.max(8, Math.round(layout.baseFontPx * 0.72)),
      })
    } catch {
      el.innerHTML = ''
    }
  }, [value, barHeight, layout.baseFontPx])

  if (!value.trim()) {
    return <p className="text-center text-[0.85em] opacity-50">(ไม่มีเลขที่บิล)</p>
  }
  return <svg ref={svgRef} className="mx-auto block w-full max-w-full min-w-0" aria-hidden />
}

function ReceiptQrImg({
  payload,
  layout,
}: {
  payload: string
  layout: ReceiptDesignerLayout
}) {
  const [src, setSrc] = useState<string | null>(null)
  const px = Math.round(Math.min(220, Math.max(120, layout.baseFontPx * 14)))

  useEffect(() => {
    if (!payload.trim()) {
      setSrc(null)
      return
    }
    let cancelled = false
    QRCode.toDataURL(payload.trim(), {
      width: px,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((u) => {
        if (!cancelled) setSrc(u)
      })
      .catch(() => {
        if (!cancelled) setSrc(null)
      })
    return () => {
      cancelled = true
    }
  }, [payload, px])

  if (!payload.trim()) return <p className="text-center text-[0.85em] opacity-60">(QR ว่าง)</p>
  if (!src) return <div className="mx-auto bg-slate-100" style={{ width: px, height: px }} />
  return (
    <img
      src={src}
      alt=""
      className="mx-auto block max-w-full"
      style={{ width: px, height: 'auto' }}
    />
  )
}

function ExtraBlocks({
  blocks,
  layout,
  receiptNo,
}: {
  blocks: ReceiptExtraBlock[]
  layout: ReceiptDesignerLayout
  receiptNo: string
}) {
  if (blocks.length === 0) return null
  return (
    <div className="space-y-2">
      {blocks.map((b) => {
        if (b.kind === 'text') {
          const st: CSSProperties = {
            fontSize: `${layout.baseFontPx * b.fontEm}px`,
            textAlign: b.align,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }
          return (
            <p key={b.id} style={st}>
              {b.text}
            </p>
          )
        }
        if (b.kind === 'image') {
          if (!b.dataUrl) {
            return (
              <div
                key={b.id}
                className="rounded border border-dashed border-slate-300 bg-slate-50 py-4 text-center text-[0.85em] text-slate-500"
              >
                ยังไม่เลือกรูป
              </div>
            )
          }
          return (
            <div key={b.id} className="flex justify-center">
              <img
                src={b.dataUrl}
                alt=""
                className="h-auto max-w-full object-contain"
                style={{ width: `${b.widthPercent}%` }}
              />
            </div>
          )
        }
        const qrPayload = b.mode === 'receiptNo' ? receiptNo : b.text
        return (
          <div key={b.id} className="py-1">
            {b.mode === 'receiptNo' ? (
              <p className="mb-1 text-center text-[0.82em] opacity-75">สแกน: เลขที่ {receiptNo}</p>
            ) : null}
            <ReceiptQrImg payload={qrPayload} layout={layout} />
          </div>
        )
      })}
    </div>
  )
}

export function ReceiptDesignerPreview({
  layout,
  profile,
  branchLabel,
  cashierLabel = 'admin',
  className,
  printData,
}: ReceiptDesignerPreviewProps) {
  const receiptNo = (printData?.receiptNo ?? SAMPLE_RECEIPT_NO).trim() || SAMPLE_RECEIPT_NO
  const text1 = (printData?.endBillText1 ?? layout.endBillText1).trimEnd()
  const promoEnd = (printData?.endBillPromoText ?? layout.endBillPromoText).trimEnd()

  const showEndStrip =
    layout.showEndBillText1 || layout.showEndBillBarcode || layout.showEndBillPromoText

  const subtotal = SAMPLE_ITEMS.reduce((s, i) => s + i.line, 0)
  const discount = 50
  const tax = 181.3
  const total = subtotal - discount + tax
  const paid = 3000
  const change = paid - total
  const now = new Date()

  const rootStyle: CSSProperties = {
    fontSize: layout.baseFontPx,
    lineHeight: 1.35,
    fontFamily: RECEIPT_FONT_STACK[layout.fontPreset] ?? RECEIPT_FONT_STACK.mono,
    width: `${layout.paperWidthMm}mm`,
    maxWidth: '100%',
    boxSizing: 'border-box',
  }

  return (
    <div
      className={clsx('bg-white px-2 py-3 text-black', className)}
      style={rootStyle}
    >
      <div className="text-center">
        {layout.showStoreName ? (
          <p className="font-bold" style={{ fontSize: '1.08em' }}>
            {profile.storeName || 'ชื่อร้าน'}
          </p>
        ) : null}
        {layout.showBranch && branchLabel ? <p className="opacity-90">{branchLabel}</p> : null}
        {layout.showTaxId && profile.taxId ? <p className="opacity-90">เลขประจำตัวผู้เสียภาษี {profile.taxId}</p> : null}
        {layout.showPhone && profile.phone ? <p className="opacity-90">โทร. {profile.phone}</p> : null}
        {layout.showAddress && profile.address ? (
          <p className="mt-1 whitespace-pre-wrap text-left opacity-90">{profile.address}</p>
        ) : null}
      </div>

      {layout.topExtras.length > 0 ? (
        <>
          <Divider show={layout.showSectionDividers} />
          <ExtraBlocks blocks={layout.topExtras} layout={layout} receiptNo={receiptNo} />
        </>
      ) : null}

      <Divider show={layout.showSectionDividers} />

      <div className="space-y-0.5">
        {layout.showDocNo ? <p>เลขที่ {receiptNo}</p> : null}
        {layout.showDateTime ? (
          <p>
            {now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
            {now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </p>
        ) : null}
        {layout.showCashier ? <p>ผู้ขาย: {cashierLabel}</p> : null}
      </div>

      <Divider show={layout.showSectionDividers} />

      <div className="space-y-2">
        {SAMPLE_ITEMS.map((item) => (
          <div key={item.no}>
            <div className="flex flex-wrap gap-x-1">
              {layout.showItemNo ? <span className="tabular-nums opacity-80">{item.no}.</span> : null}
              <span className="min-w-0 flex-1 font-medium">{item.name}</span>
            </div>
            {layout.showItemSku ? <p className="opacity-75">SKU {item.sku}</p> : null}
            {(layout.showItemUnitPrice || layout.showItemQty || layout.showItemLineTotal) && (
              <div className="flex flex-wrap justify-between gap-x-2 tabular-nums">
                {layout.showItemUnitPrice ? <span>@{fmtBaht(item.unit)}</span> : <span />}
                {layout.showItemQty ? <span>×{item.qty}</span> : null}
                {layout.showItemLineTotal ? <span className="font-medium">{fmtBaht(item.line)}</span> : null}
              </div>
            )}
          </div>
        ))}
      </div>

      <Divider show={layout.showSectionDividers} />

      <div className="space-y-0.5 tabular-nums">
        {layout.showSubtotal ? (
          <div className="flex justify-between gap-2">
            <span>รวมเงิน</span>
            <span>{fmtBaht(subtotal)}</span>
          </div>
        ) : null}
        {layout.showDiscount ? (
          <div className="flex justify-between gap-2">
            <span>ส่วนลด</span>
            <span>-{fmtBaht(discount)}</span>
          </div>
        ) : null}
        {layout.showTax ? (
          <div className="flex justify-between gap-2">
            <span>ภาษีมูลค่าเพิ่ม</span>
            <span>{fmtBaht(tax)}</span>
          </div>
        ) : null}
        {layout.showTotal ? (
          <div className="mt-1 flex justify-between gap-2 border-t border-slate-800 pt-1 font-bold" style={{ fontSize: '1.12em' }}>
            <span>ยอดสุทธิ</span>
            <span>{fmtBaht(total)}</span>
          </div>
        ) : null}
      </div>

      <Divider show={layout.showSectionDividers} />

      <div className="space-y-0.5 tabular-nums">
        {layout.showPaymentMethod ? <p>ชำระ: เงินสด</p> : null}
        {layout.showChange ? (
          <>
            <p>รับ {fmtBaht(paid)}</p>
            <p>ทอน {fmtBaht(change)}</p>
          </>
        ) : null}
      </div>

      {showEndStrip ? (
        <>
          <Divider show={layout.showSectionDividers} />
          <div className="space-y-2">
            {layout.showEndBillText1 ? (
              <div className="text-center">
                {text1 ? (
                  <p className="whitespace-pre-wrap text-[0.95em] leading-snug">{text1}</p>
                ) : (
                  <p className="text-[0.85em] opacity-50">(ช่องข้อความโปร — ยังว่าง)</p>
                )}
              </div>
            ) : null}
            {layout.showEndBillBarcode ? (
              <div className="py-0.5">
                <p className="mb-1 text-center text-[0.78em] opacity-70">บาร์โค้ดเลขที่บิล</p>
                <ReceiptEndBillBarcode value={receiptNo} layout={layout} />
              </div>
            ) : null}
            {layout.showEndBillPromoText ? (
              <div className="text-center">
                {promoEnd ? (
                  <p className="whitespace-pre-wrap text-[0.95em] font-medium leading-snug">{promoEnd}</p>
                ) : (
                  <p className="text-[0.85em] opacity-50">(โปรท้ายบิล — ยังว่าง)</p>
                )}
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {layout.bottomExtras.length > 0 ? (
        <>
          <Divider show={layout.showSectionDividers} />
          <ExtraBlocks blocks={layout.bottomExtras} layout={layout} receiptNo={receiptNo} />
        </>
      ) : null}

      {layout.showThankYou || layout.footerLines.length > 0 ? <Divider show={layout.showSectionDividers} /> : null}

      <div className="text-center">
        {layout.showThankYou ? <p className="font-medium">ขอบคุณที่ใช้บริการ</p> : null}
        {layout.footerLines.map((line, i) => (
          <p key={i} className="mt-1 whitespace-pre-wrap opacity-90">
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
