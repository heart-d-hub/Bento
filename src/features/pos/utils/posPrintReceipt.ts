import { MOCK_STORE_PROFILE } from '@/features/settings/data/mockStoreProfile'
import { getDeviceLabel } from '@/features/device/deviceSession'
import type { PosCartLine } from '@/features/pos/data/posCartLineTypes'
import { posLineSubtotal } from '@/features/pos/data/posCartLineTotals'

function formatMoney(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** ฝัง Sarabun จาก /public/fonts (หน้าต่างพิมพ์แยกไม่โหลด bundle หลัก) — OFL */
function posReceiptSarabunFontFaceCss(origin: string): string {
  if (!origin) return ''
  const b = `${origin.replace(/\/$/, '')}/fonts`
  const thaiRange = 'U+02D7,U+0303,U+0331,U+0E01-0E5B,U+200C-200D,U+25CC'
  const latinRange =
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
  return [400, 500, 600, 700]
    .map(
      (w) =>
        `@font-face{font-family:'Sarabun';font-style:normal;font-weight:${w};font-display:block;src:url('${b}/sarabun-thai-${w}-normal.woff2') format('woff2');unicode-range:${thaiRange};}` +
        `@font-face{font-family:'Sarabun';font-style:normal;font-weight:${w};font-display:block;src:url('${b}/sarabun-latin-${w}-normal.woff2') format('woff2');unicode-range:${latinRange};}`,
    )
    .join('')
}

/** โหลดฟอนต์ก่อนพิมพ์ — กัน Sarabun ยังไม่ทันโหลดแล้วไปใช้ fallback บางๆ บนเครื่องความร้อน */
function posReceiptSarabunPreloadLinks(origin: string): string {
  if (!origin) return ''
  const b = `${origin.replace(/\/$/, '')}/fonts`
  return [400, 500, 600, 700]
    .flatMap((w) => [
      `<link rel="preload" href="${b}/sarabun-thai-${w}-normal.woff2" as="font" type="font/woff2" crossorigin>`,
      `<link rel="preload" href="${b}/sarabun-latin-${w}-normal.woff2" as="font" type="font/woff2" crossorigin>`,
    ])
    .join('')
}

export function printPosReceipt(opts: {
  billNo: string
  lines: PosCartLine[]
  grandTotal: number
  paymentLabel: string
}): void {
  const shop = MOCK_STORE_PROFILE.storeName
  const device = getDeviceLabel()
  const rows = opts.lines
    .map(
      (l) =>
        `<tr><td colspan="2">${escapeHtml(l.name)}${l.unitLabel ? ` (${escapeHtml(l.unitLabel)})` : ''}</td></tr>` +
        `<tr><td>${l.qty} x ${formatMoney(l.unitPrice)}</td><td class="num">${formatMoney(posLineSubtotal(l))}</td></tr>`,
    )
    .join('')

  const fontOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  const sarabunFaces = posReceiptSarabunFontFaceCss(fontOrigin)
  const fontPreload = posReceiptSarabunPreloadLinks(fontOrigin)

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>ใบเสร็จ ${escapeHtml(opts.billNo)}</title>
  ${fontPreload}
  <style>
    ${sarabunFaces}
    @page { margin: 0; size: auto; }
    html, body {
      color: #000 !important;
      background: #fff !important;
      -webkit-font-smoothing: auto;
      -moz-osx-font-smoothing: auto;
      text-rendering: geometricPrecision;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: 'Sarabun', 'Leelawadee UI', Tahoma, system-ui, sans-serif;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.45;
      padding: 10px 8px;
      margin: 0 auto;
      max-width: 72mm;
      width: 72mm;
      box-sizing: border-box;
    }
    h1 {
      font-size: 17px;
      font-weight: 700;
      margin: 0 0 8px;
      color: #000 !important;
      letter-spacing: 0.01em;
    }
    .meta {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 500;
      line-height: 1.4;
      color: #000 !important;
    }
    table { width: 100%; border-collapse: collapse; }
    td {
      padding: 4px 0;
      vertical-align: top;
      font-size: 13px;
      font-weight: 500;
      color: #000 !important;
      font-variant-numeric: tabular-nums;
    }
    td.num { text-align: right; white-space: nowrap; font-weight: 600; }
    .total {
      font-weight: 700;
      font-size: 15px;
      margin-top: 10px;
      border-top: 2px solid #000;
      padding-top: 8px;
      color: #000 !important;
      font-variant-numeric: tabular-nums;
    }
    .pay { margin: 6px 0 0; font-size: 12px; font-weight: 600; color: #000 !important; }
    .footer { margin-top: 14px; font-size: 11px; font-weight: 500; color: #000 !important; }
    @media print {
      body {
        padding: 2mm 3mm !important;
        font-size: 11pt !important;
        max-width: none !important;
        width: auto !important;
      }
      h1 { font-size: 13pt !important; }
      .meta, .pay { font-size: 10pt !important; }
      td { font-size: 10.5pt !important; }
      .total { font-size: 12pt !important; }
      .footer { font-size: 9.5pt !important; }
      * { color: #000 !important; }
    }
  </style></head><body>
  <h1>${escapeHtml(shop)}</h1>
  <p class="meta">เลขที่ ${escapeHtml(opts.billNo)}<br/>เครื่อง: ${escapeHtml(device)}<br/>${escapeHtml(new Date().toLocaleString('th-TH'))}</p>
  <table>${rows}</table>
  <p class="total">ยอดรวม ${formatMoney(opts.grandTotal)} บาท</p>
  <p class="pay">ชำระ: ${escapeHtml(opts.paymentLabel)}</p>
  <p class="footer">— ขอบคุณที่ใช้บริการ —</p>
  </body></html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.open()
  w.document.write(html)
  w.document.close()

  let printed = false
  const triggerPrint = () => {
    if (printed) return
    printed = true
    try {
      w.focus()
      w.print()
    } finally {
      w.close()
    }
  }

  let layoutScheduled = false
  const afterFonts = () => {
    if (layoutScheduled) return
    layoutScheduled = true
    window.clearTimeout(fallbackTimer)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => triggerPrint())
    })
  }

  const fallbackMs = fontOrigin ? 2500 : 800
  const fallbackTimer = window.setTimeout(afterFonts, fallbackMs)

  if (fontOrigin && w.document.fonts?.ready) {
    void w.document.fonts.ready
      .then(() => {
        afterFonts()
      })
      .catch(() => {
        afterFonts()
      })
  } else {
    w.onload = () => afterFonts()
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
