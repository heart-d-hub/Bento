import type { PurchaseOrder } from '@/features/purchase/data/poTypes'
import { isTauri } from '@/features/desktop/isTauri'

export type PoOutputMode = 'print' | 'pdf' | 'copy'

const SURFACE_ID = 'bento-po-print-surface'
const STYLE_ID   = 'bento-po-print-style'

// ── helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function baht(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function thDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
}

function statusThai(po: PurchaseOrder): string {
  if (po.status === 'draft')  return 'ร่าง'
  if (po.status === 'closed') return 'ปิดแล้ว'
  return 'Ordered'
}

function exVatUnit(unitCost: number, po: PurchaseOrder): number {
  if ((po.vatMode ?? 'excluded') === 'included' && po.vatRatePercent > 0)
    return Math.round((unitCost / (1 + po.vatRatePercent / 100)) * 10000) / 10000
  return unitCost
}

/** Apply a discount chain string like "45+10" to a base price */
function applyDiscountChain(base: number, chain: string): number {
  return chain.split('+').reduce((price, part) => {
    const pct = parseFloat(part.trim())
    return isNaN(pct) ? price : Math.round(price * (1 - pct / 100) * 10000) / 10000
  }, base)
}

// ── document body ─────────────────────────────────────────────────────────────

function buildPoBody(po: PurchaseOrder, shopName: string): string {
  const isDraft  = po.status === 'draft'
  const vatMode  = po.vatMode ?? 'excluded'
  const docTitle = isDraft ? 'ร่างใบสั่งซื้อ' : 'ใบสั่งซื้อ'
  const docEn    = isDraft ? 'DRAFT PURCHASE ORDER' : 'PURCHASE ORDER'

  // Optional columns
  const hasListPrice = po.lines.some((l) => (l.listPrice ?? 0) > 0)
  const hasDiscount  = po.lines.some((l) => !!l.discountChain)
  const hasBonus     = po.lines.some((l) => (l.bonusFreeQty ?? 0) > 0)
  const showExVat    = vatMode === 'included' && po.vatRatePercent > 0

  // colCount: #, SKU, name, qty, [listPrice], [discount], [bonus], unitCost, [exVat], total
  const colCount = 6
    + (hasListPrice ? 1 : 0)
    + (hasDiscount  ? 1 : 0)
    + (hasBonus     ? 1 : 0)
    + (showExVat    ? 1 : 0)

  // ── thead ──
  const theadCells = [
    '<th class="col-no">#</th>',
    '<th class="col-sku">SKU</th>',
    '<th class="col-name">รายการสินค้า</th>',
    '<th class="num col-qty">จำนวน</th>',
    hasListPrice ? '<th class="num">ราคาทุน (฿)</th>'      : '',
    hasDiscount  ? '<th class="center">ส่วนลด</th>'          : '',
    hasBonus     ? '<th class="center">แถม</th>'             : '',
    '<th class="num">ราคา/หน่วย (฿)</th>',
    showExVat    ? '<th class="num col-exvat">ก่อน VAT/หน่วย (฿)</th>' : '',
    '<th class="num col-total">รวม (฿)</th>',
  ].join('')

  // ── tbody rows ──
  const rows = po.lines.map((l, i) => {
    const lineTotal  = l.orderedQty * l.unitCostOrder
    const exUnit     = exVatUnit(l.unitCostOrder, po)

    // Discount chain hint: show computed net price if listPrice set
    let discountCell = '—'
    if (l.discountChain) {
      const chainParts = l.discountChain.split('+').map((p) => p.trim() + '%').join(' − ')
      if ((l.listPrice ?? 0) > 0) {
        const net = applyDiscountChain(l.listPrice!, l.discountChain)
        discountCell = `<span class="chain-parts">${chainParts}</span><br/><span class="chain-net">net ฿${baht(net)}</span>`
      } else {
        discountCell = `<span class="chain-parts">${chainParts}</span>`
      }
    }

    const bonusCell = (l.bonusFreeQty ?? 0) > 0
      ? `<span class="bonus-badge">${l.bonusPaidQty}+${l.bonusFreeQty}</span>`
      : '—'

    return [
      `<tr class="${i % 2 === 1 ? 'row-alt' : ''}">`,
      `<td class="col-no center muted">${i + 1}</td>`,
      `<td class="col-sku mono">${esc(l.sku)}</td>`,
      `<td class="col-name">${esc(l.name)}</td>`,
      `<td class="num col-qty">${l.orderedQty}</td>`,
      hasListPrice ? `<td class="num">${(l.listPrice ?? 0) > 0 ? baht(l.listPrice!) : '—'}</td>` : '',
      hasDiscount  ? `<td class="center">${discountCell}</td>` : '',
      hasBonus     ? `<td class="center">${bonusCell}</td>` : '',
      `<td class="num">${baht(l.unitCostOrder)}</td>`,
      showExVat    ? `<td class="num col-exvat">${baht(exUnit)}</td>` : '',
      `<td class="num col-total">${baht(lineTotal)}</td>`,
      `</tr>`,
    ].join('')
  }).join('')

  // ── tfoot summary ──
  const quotedSub = po.lines.reduce((s, l) => s + l.orderedQty * l.unitCostOrder, 0)
  const sp = `<tr class="summary-spacer"><td colspan="${colCount}"></td></tr>`

  let footerHtml = ''
  if (vatMode === 'none') {
    footerHtml = `${sp}
      <tr class="summary-grand">
        <td colspan="${colCount - 1}" class="summary-label">ยอดรวม (ไม่มี VAT)</td>
        <td class="num">${baht(quotedSub)}</td>
      </tr>`
  } else if (vatMode === 'included') {
    const base   = Math.round((quotedSub / (1 + po.vatRatePercent / 100)) * 100) / 100
    const vatAmt = Math.round((quotedSub - base) * 100) / 100
    footerHtml = `${sp}
      <tr class="summary-mid">
        <td colspan="${colCount - 1}" class="summary-label">ยอดรวม (ราคารวม VAT ${po.vatRatePercent}% แล้ว)</td>
        <td class="num">${baht(quotedSub)}</td>
      </tr>
      <tr class="summary-sub">
        <td colspan="${colCount - 1}" class="summary-label">VAT ${po.vatRatePercent}% ที่รวมอยู่ในราคา</td>
        <td class="num">${baht(vatAmt)}</td>
      </tr>
      <tr class="summary-grand">
        <td colspan="${colCount - 1}" class="summary-label">ราคาก่อน VAT (มูลค่าต้นทุนสต็อก)</td>
        <td class="num">${baht(base)}</td>
      </tr>`
  } else {
    const vatAmt = Math.round(quotedSub * po.vatRatePercent / 100 * 100) / 100
    const total  = Math.round((quotedSub + vatAmt) * 100) / 100
    footerHtml = `${sp}
      <tr class="summary-sub">
        <td colspan="${colCount - 1}" class="summary-label">ยอดก่อน VAT</td>
        <td class="num">${baht(quotedSub)}</td>
      </tr>
      <tr class="summary-sub">
        <td colspan="${colCount - 1}" class="summary-label">VAT ${po.vatRatePercent}%</td>
        <td class="num">+ ${baht(vatAmt)}</td>
      </tr>
      <tr class="summary-grand">
        <td colspan="${colCount - 1}" class="summary-label">ยอดรวม (รวม VAT)</td>
        <td class="num">${baht(total)}</td>
      </tr>`
  }

  // ── meta values ──
  const vatLabel =
    vatMode === 'included' ? `ราคารวม VAT ${po.vatRatePercent}% แล้ว`
    : vatMode === 'none'   ? 'ไม่มี VAT'
    : `+ VAT ${po.vatRatePercent}% (ยังไม่รวม)`

  const deliveryRows = [
    po.shippingMethod    ? `<tr><td class="ikey">ขนส่ง</td><td class="ival">${esc(po.shippingMethod)}</td></tr>` : '',
    po.expectedDeliveryAt ? `<tr><td class="ikey">คาดรับ</td><td class="ival">${thDate(po.expectedDeliveryAt)}</td></tr>` : '',
    po.trackingNo         ? `<tr><td class="ikey">Tracking</td><td class="ival mono">${esc(po.trackingNo)}</td></tr>` : '',
    po.invoiceNo          ? `<tr><td class="ikey">Invoice</td><td class="ival mono">${esc(po.invoiceNo)}</td></tr>` : '',
  ].filter(Boolean).join('')

  const notesHtml = po.notes
    ? `<div class="notes-box"><span class="notes-label">หมายเหตุ</span> ${esc(po.notes)}</div>`
    : ''

  const invoicesHtml = (() => {
    if (!po.poInvoices || po.poInvoices.length === 0) return ''
    const invRows = po.poInvoices.map((inv, i) => {
      const bIdx = inv.receiveBatchId
        ? po.receiveBatches.findIndex((b) => b.id === inv.receiveBatchId)
        : -1
      const bLabel = bIdx >= 0
        ? `ครั้งที่ ${bIdx + 1} · ${thDate(po.receiveBatches[bIdx].at)}`
        : '—'
      return [
        `<tr class="${i % 2 === 1 ? 'row-alt' : ''}">`,
        `<td class="col-no center muted">${i + 1}</td>`,
        `<td class="mono inv-no">${esc(inv.invoiceNo)}</td>`,
        `<td class="center">${inv.invoiceDate}</td>`,
        `<td class="center inv-batch">${bLabel}</td>`,
        `<td class="num">${inv.beforeVatBaht > 0 ? baht(inv.beforeVatBaht) : '—'}</td>`,
        `<td class="num">${inv.vatBaht > 0 ? baht(inv.vatBaht) : '—'}</td>`,
        `<td class="num inv-total-cell">${baht(inv.totalBaht)}</td>`,
        `</tr>`,
      ].join('')
    }).join('')
    const grandRow = po.poInvoices.length > 1
      ? [
          `<tr class="inv-grand">`,
          `<td colspan="4" class="inv-grand-label">รวมทุกใบกำกับ</td>`,
          `<td class="num">${baht(po.poInvoices.reduce((s, v) => s + v.beforeVatBaht, 0))}</td>`,
          `<td class="num">${baht(po.poInvoices.reduce((s, v) => s + v.vatBaht, 0))}</td>`,
          `<td class="num inv-total-cell">${baht(po.poInvoices.reduce((s, v) => s + v.totalBaht, 0))}</td>`,
          `</tr>`,
        ].join('')
      : ''
    return [
      `<div class="inv-section">`,
      `<div class="inv-section-title">ใบกำกับภาษีจากผู้จำหน่าย · Vendor Tax Invoices</div>`,
      `<table class="inv-table">`,
      `<thead><tr>`,
      `<th class="col-no">#</th>`,
      `<th>เลขที่ใบกำกับ</th>`,
      `<th class="center">วันที่</th>`,
      `<th class="center">เชื่อมการรับ</th>`,
      `<th class="num">ก่อน VAT (฿)</th>`,
      `<th class="num">VAT (฿)</th>`,
      `<th class="num">ยอดรวม (฿)</th>`,
      `</tr></thead>`,
      `<tbody>${invRows}</tbody>`,
      po.poInvoices.length > 1 ? `<tfoot>${grandRow}</tfoot>` : '',
      `</table>`,
      `</div>`,
    ].join('')
  })()

  const generatedAt = new Date().toLocaleString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return `
    ${isDraft ? '<div class="watermark">DRAFT</div>' : ''}

    <div class="accent-bar"></div>

    ${isDraft ? `<div class="draft-banner">⚠ เอกสารนี้เป็นเพียงร่าง ยังไม่ได้รับการยืนยัน — DRAFT · NOT CONFIRMED</div>` : ''}

    <div class="doc-header">
      <div class="doc-header-left">
        <div class="doc-title">${esc(docTitle)}</div>
        <div class="doc-subtitle">${docEn}</div>
        <div class="doc-shop">${esc(shopName)}</div>
      </div>
      <div class="doc-header-right">
        <div class="po-number-badge">${esc(po.poNo)}</div>
        <table class="meta-table">
          <tr><td class="mkey">วันที่</td><td class="mval">${thDate(po.orderedAt ?? po.createdAt)}</td></tr>
          <tr><td class="mkey">สถานะ</td><td class="mval">${statusThai(po)}</td></tr>
          <tr><td class="mkey">VAT</td><td class="mval">${vatLabel}</td></tr>
        </table>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <div class="info-card-label">ซัพพลายเออร์ · Supplier</div>
        <div class="info-card-name">${esc(po.supplierName)}</div>
      </div>
      ${deliveryRows ? `
      <div class="info-card">
        <div class="info-card-label">การจัดส่ง · Delivery</div>
        <table class="inner-table">${deliveryRows}</table>
      </div>` : '<div></div>'}
    </div>

    <table class="items-table">
      <thead><tr>${theadCells}</tr></thead>
      <tbody>${rows || `<tr><td colspan="${colCount}" class="empty-row">— ยังไม่มีรายการ —</td></tr>`}</tbody>
      <tfoot>${footerHtml}</tfoot>
    </table>

    ${notesHtml}

    ${invoicesHtml}

    <div class="page-footer">
      <span>พิมพ์เมื่อ ${generatedAt}</span>
      <span>${esc(po.poNo)}</span>
    </div>
  `
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const PO_CSS = `
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Leelawadee UI', 'Leelawadee', Tahoma, sans-serif;
    font-size: 12.5px;
    line-height: 1.45;
    color: #1a202c;
    background: #fff;
    padding: 1.4cm 1.6cm 1.8cm;
    max-width: 900px;
    margin: 0 auto;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* ── Accent bar ── */
  .accent-bar {
    height: 3px;
    background: #111;
    margin-bottom: 16px;
  }

  /* ── Draft banner ── */
  .draft-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #fff;
    border: 1.5px dashed #666;
    color: #333;
    font-weight: 700;
    font-size: 11px;
    padding: 6px 16px;
    border-radius: 5px;
    margin-bottom: 14px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }

  /* ── Document header ── */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 2px solid #111;
  }
  .doc-title {
    font-size: 22px;
    font-weight: 900;
    color: #111;
    letter-spacing: -0.5px;
  }
  .doc-subtitle {
    font-size: 10px;
    font-weight: 600;
    color: #666;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-top: 1px;
    margin-bottom: 5px;
  }
  .doc-shop {
    font-size: 11.5px;
    color: #444;
    font-weight: 500;
  }
  .doc-header-right { text-align: right; }

  .po-number-badge {
    display: inline-block;
    background: #fff;
    color: #111;
    border: 1.5px solid #111;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 4px;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
  }

  .meta-table { border-collapse: collapse; font-size: 11.5px; }
  .meta-table td { padding: 2px 4px; border: none; }
  .mkey { color: #666; text-align: right; padding-right: 8px; white-space: nowrap; }
  .mval { font-weight: 600; color: #111; }

  /* ── Info grid (supplier + delivery) ── */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }
  .info-card {
    border: 1px solid #bbb;
    border-radius: 4px;
    padding: 9px 12px;
    background: #fff;
  }
  .info-card-label {
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #666;
    margin-bottom: 5px;
  }
  .info-card-name {
    font-size: 14px;
    font-weight: 800;
    color: #111;
  }
  .inner-table { border-collapse: collapse; font-size: 11px; width: 100%; }
  .inner-table td { padding: 1.5px 4px; border: none; }
  .ikey { color: #666; white-space: nowrap; padding-right: 8px; width: 60px; }
  .ival { font-weight: 600; color: #111; }

  /* ── Items table ── */
  .items-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 14px; }
  .items-table thead tr { background: #fff; border-bottom: 2px solid #111; }
  .items-table th {
    color: #111;
    font-size: 10.5px;
    font-weight: 700;
    padding: 7px 8px;
    text-align: left;
    white-space: nowrap;
    letter-spacing: 0.2px;
  }
  .items-table td {
    padding: 6px 8px;
    border-bottom: 1px solid #ccc;
    vertical-align: middle;
  }
  .row-alt td { background: #f5f5f5; }
  .num    { text-align: right; font-variant-numeric: tabular-nums; }
  .center { text-align: center; }
  .mono   { font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.3px; }
  .muted  { color: #888; font-size: 11px; }
  .col-no    { width: 28px; }
  .col-sku   { width: 90px; }
  .col-qty   { width: 60px; }
  .col-exvat { color: #333; }
  .col-total { font-weight: 600; }
  .empty-row { text-align: center; color: #888; padding: 20px; font-style: italic; }

  .chain-parts { font-size: 11px; color: #333; font-weight: 600; }
  .chain-net   { font-size: 10px; color: #555; }
  .bonus-badge {
    display: inline-block;
    background: #fff;
    color: #111;
    border: 1px solid #666;
    border-radius: 999px;
    padding: 1px 7px;
    font-size: 10.5px;
    font-weight: 700;
    white-space: nowrap;
  }

  /* ── Totals footer ── */
  .items-table tfoot td { border-bottom: none; vertical-align: middle; }
  .summary-spacer td    { height: 4px; background: #fff !important; }
  .summary-label        { text-align: right; padding-right: 12px !important; }
  .summary-sub td  { background: #f5f5f5; color: #444; font-size: 11.5px; padding: 5px 8px; }
  .summary-mid td  { background: #fff; color: #111; border-top: 1px solid #999; border-bottom: 1px solid #999; font-weight: 700; font-size: 12.5px; padding: 7px 8px; }
  .summary-grand td {
    background: #fff;
    color: #111;
    border-top: 2.5px solid #111;
    font-weight: 800;
    font-size: 14px;
    padding: 9px 8px;
    letter-spacing: -0.2px;
  }

  /* ── Notes ── */
  .notes-box {
    background: #fff;
    border: 1px solid #bbb;
    border-left: 3px solid #444;
    border-radius: 0 4px 4px 0;
    padding: 8px 12px;
    font-size: 11.5px;
    color: #222;
    margin-bottom: 20px;
  }
  .notes-label { font-weight: 700; margin-right: 6px; }

  /* ── Vendor invoices section ── */
  .inv-section { margin-bottom: 20px; }
  .inv-section-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #111;
    background: #fff;
    border-left: 3px solid #444;
    padding: 5px 10px;
    margin-bottom: 6px;
    border-radius: 0 4px 4px 0;
  }
  .inv-table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 6px; }
  .inv-table thead tr { background: #fff; border-bottom: 2px solid #111; }
  .inv-table th {
    color: #111;
    font-size: 10px;
    font-weight: 700;
    padding: 5px 8px;
    text-align: left;
    white-space: nowrap;
  }
  .inv-table td { padding: 5px 8px; border-bottom: 1px solid #ccc; vertical-align: middle; }
  .inv-no { color: #111; font-weight: 700; letter-spacing: 0.5px; }
  .inv-batch { color: #555; font-size: 10.5px; }
  .inv-total-cell { font-weight: 700; color: #111; }
  .inv-grand td {
    background: #fff;
    color: #111;
    border-top: 2px solid #111;
    font-weight: 800;
    font-size: 12.5px;
    padding: 7px 8px;
  }
  .inv-grand-label { text-align: right; padding-right: 12px !important; }

  /* ── Page footer ── */
  .page-footer {
    position: fixed;
    bottom: 14px;
    left: 32px;
    right: 32px;
    display: flex;
    justify-content: space-between;
    font-size: 9.5px;
    color: #94a3b8;
    border-top: 1px solid #e2e8f0;
    padding-top: 5px;
  }

  /* ── Watermark ── */
  .watermark {
    position: fixed;
    top: 44%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-38deg);
    font-size: 120px;
    font-weight: 900;
    color: rgba(249,115,22,0.07);
    pointer-events: none;
    letter-spacing: 14px;
    user-select: none;
    white-space: nowrap;
  }

  @media print {
    .page-footer { position: fixed; bottom: 8px; }
    .watermark   { position: fixed; }
  }
`

// ── exports ───────────────────────────────────────────────────────────────────

/** Full standalone HTML document used by the iframe preview */
export function buildPoPreviewDoc(po: PurchaseOrder, shopName: string): string {
  return `<!DOCTYPE html><html lang="th"><head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${esc(po.status === 'draft' ? 'Draft PO' : 'PO')} — ${esc(po.poNo)}</title>
  <style>${PO_CSS}</style>
  </head><body>${buildPoBody(po, shopName)}</body></html>`
}

// Converts PO_CSS (body-scoped) into surface-scoped rules for DOM injection
function scopedCss(id: string): string {
  return PO_CSS
    .replace(/@page[^{]*\{[^}]*\}/g, '')   // strip @page (not meaningful in DOM)
    .replace(/body\s*\{/g, `#${id} {`)
    .replace(/\bbody\b/g, `#${id}`)
}

function unmountSurface(): void {
  document.getElementById(SURFACE_ID)?.remove()
  document.getElementById(STYLE_ID)?.remove()
}

function mountSurface(po: PurchaseOrder, shopName: string): void {
  unmountSurface()

  const styleEl = document.createElement('style')
  styleEl.id = STYLE_ID
  styleEl.textContent = `
    @media print {
      body > *:not(#${SURFACE_ID}):not(style) { display: none !important; }
      #${SURFACE_ID} { display: block !important; }
    }
    #${SURFACE_ID} { display: none; }
    ${scopedCss(SURFACE_ID)}
  `
  document.head.appendChild(styleEl)

  const surface = document.createElement('div')
  surface.id = SURFACE_ID
  surface.innerHTML = buildPoBody(po, shopName)
  document.body.appendChild(surface)
}

// ── copy-to-clipboard text ────────────────────────────────────────────────────

function buildCopyText(po: PurchaseOrder, shopName: string): string {
  const vatMode = po.vatMode ?? 'excluded'
  const lines = po.lines.map((l, i) => {
    const parts = [`${i + 1}. [${l.sku}] ${l.name}  ×${l.orderedQty}  @${baht(l.unitCostOrder)} ฿`]
    if ((l.listPrice ?? 0) > 0)    parts.push(`(ราคาทุน ${baht(l.listPrice!)} ฿)`)
    if (l.discountChain)           parts.push(`ลด ${l.discountChain}%`)
    if ((l.bonusFreeQty ?? 0) > 0) parts.push(`แถม ${l.bonusPaidQty}+${l.bonusFreeQty}`)
    if (vatMode === 'included' && po.vatRatePercent > 0)
      parts.push(`[ก่อน VAT ${baht(exVatUnit(l.unitCostOrder, po))} ฿]`)
    parts.push(`= ${baht(l.orderedQty * l.unitCostOrder)} ฿`)
    return '  ' + parts.join('  ')
  }).join('\n')

  const sub = po.lines.reduce((s, l) => s + l.orderedQty * l.unitCostOrder, 0)
  let vatSummary = ''
  if (vatMode === 'none') {
    vatSummary = `รวม ${baht(sub)} บาท (ไม่มี VAT)`
  } else if (vatMode === 'included') {
    const base = Math.round((sub / (1 + po.vatRatePercent / 100)) * 100) / 100
    const v    = Math.round((sub - base) * 100) / 100
    vatSummary = `รวม ${baht(sub)} บาท (รวม VAT ${po.vatRatePercent}% = ${baht(v)} ฿ · ก่อน VAT = ${baht(base)} ฿)`
  } else {
    const v = Math.round(sub * po.vatRatePercent / 100 * 100) / 100
    vatSummary = `ก่อน VAT ${baht(sub)} ฿ + VAT ${po.vatRatePercent}% ${baht(v)} ฿ = รวม ${baht(sub + v)} ฿`
  }

  const extras = [
    po.shippingMethod     ? `ขนส่ง: ${po.shippingMethod}` : '',
    po.expectedDeliveryAt ? `คาดรับ: ${thDate(po.expectedDeliveryAt)}` : '',
    po.notes              ? `หมายเหตุ: ${po.notes}` : '',
  ].filter(Boolean).join('\n')

  const invLines = po.poInvoices && po.poInvoices.length > 0
    ? po.poInvoices.map((inv, i) =>
        `  ${i + 1}. ${inv.invoiceNo}  วันที่ ${inv.invoiceDate}  รวม ${baht(inv.totalBaht)} ฿` +
        (inv.vatBaht > 0 ? `  (VAT ${baht(inv.vatBaht)} ฿)` : '')
      ).join('\n')
    : ''

  return [
    `${po.status === 'draft' ? '[ร่าง] ' : ''}ใบสั่งซื้อ เลขที่ ${po.poNo}`,
    `ร้าน: ${shopName}  ·  ซัพพลายเออร์: ${po.supplierName}`,
    `วันที่: ${thDate(po.orderedAt ?? po.createdAt)}`,
    `${'─'.repeat(48)}`,
    lines,
    `${'─'.repeat(48)}`,
    vatSummary,
    extras,
    invLines ? `${'─'.repeat(48)}\nใบกำกับภาษี\n${invLines}` : '',
  ].filter(Boolean).join('\n').trim()
}

// ── main export ───────────────────────────────────────────────────────────────

export async function printPurchaseOrder(
  po: PurchaseOrder,
  shopName: string,
  mode: PoOutputMode = 'print',
): Promise<void> {
  if (mode === 'copy') {
    await navigator.clipboard.writeText(buildCopyText(po, shopName))
    return
  }

  mountSurface(po, shopName)
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

  const cmd = mode === 'pdf' ? 'show_browser_print_dialog' : 'show_system_print_dialog'

  try {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke(cmd)
      unmountSurface()
    } else {
      const cleanup = () => { unmountSurface(); window.removeEventListener('afterprint', cleanup) }
      window.addEventListener('afterprint', cleanup)
      window.setTimeout(unmountSurface, 120_000)
      window.print()
    }
  } catch {
    const cleanup = () => { unmountSurface(); window.removeEventListener('afterprint', cleanup) }
    window.addEventListener('afterprint', cleanup)
    window.setTimeout(unmountSurface, 120_000)
    window.print()
  }
}
