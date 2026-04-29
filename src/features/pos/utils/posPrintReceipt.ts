import { getStoreContextForPrint } from '@/features/settings/data/storeProfileStore'
import { getDeviceLabel } from '@/features/device/deviceSession'
import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'
import type { PosCartLine } from '@/features/pos/data/posCartLineTypes'
import { posLineSubtotal } from '@/features/pos/data/posCartLineTotals'

function formatMoney(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const SURFACE_ID = 'pos-receipt-print-surface'
const STYLE_ID = 'pos-receipt-print-style'

function mountReceiptSurface(opts: {
  billNo: string
  lines: PosCartLine[]
  grandTotal: number
  paymentLabel: string
}): void {
  document.getElementById(SURFACE_ID)?.remove()
  document.getElementById(STYLE_ID)?.remove()

  const ctx = getStoreContextForPrint()
  const device = getDeviceLabel()
  const rows = opts.lines
    .map(
      (l) =>
        `<tr><td colspan="2">${escapeHtml(l.name)}${l.unitLabel ? ` (${escapeHtml(l.unitLabel)})` : ''}</td></tr>` +
        `<tr><td>${l.qty} x ${formatMoney(l.unitPrice)}</td><td class="r-num">${formatMoney(posLineSubtotal(l))}</td></tr>`,
    )
    .join('')

  const styleEl = document.createElement('style')
  styleEl.id = STYLE_ID
  styleEl.textContent = `
    @media screen { #${SURFACE_ID} { display: none !important; } }
    @media print {
      body > *:not(#${SURFACE_ID}) { display: none !important; visibility: hidden !important; }
      #${SURFACE_ID} {
        display: block !important; visibility: visible !important;
        position: static !important; width: auto !important; height: auto !important;
        overflow: visible !important; opacity: 1 !important; z-index: auto !important;
        font-family: 'Sarabun', 'Leelawadee UI', Tahoma, system-ui, sans-serif;
        font-size: 11pt; font-weight: 500; line-height: 1.45;
        padding: 2mm 3mm; margin: 0; color: #000;
      }
      #${SURFACE_ID} h1 { font-size: 13pt; font-weight: 700; margin: 0 0 6pt; }
      #${SURFACE_ID} .r-meta { font-size: 10pt; margin: 0 0 6pt; line-height: 1.4; }
      #${SURFACE_ID} table { width: 100%; border-collapse: collapse; }
      #${SURFACE_ID} td { padding: 2pt 0; font-size: 10.5pt; vertical-align: top; color: #000; font-variant-numeric: tabular-nums; }
      #${SURFACE_ID} td.r-num { text-align: right; white-space: nowrap; font-weight: 600; }
      #${SURFACE_ID} .r-total { font-size: 12pt; font-weight: 700; margin-top: 8pt; border-top: 2px solid #000; padding-top: 6pt; font-variant-numeric: tabular-nums; }
      #${SURFACE_ID} .r-pay { font-size: 10pt; font-weight: 600; margin: 4pt 0 0; }
      #${SURFACE_ID} .r-footer { font-size: 9.5pt; margin-top: 12pt; }
      * { color: #000 !important; }
    }
  `
  document.head.appendChild(styleEl)

  const surface = document.createElement('div')
  surface.id = SURFACE_ID
  surface.innerHTML = `
    <h1>${escapeHtml(ctx.storeName)}</h1>
    ${ctx.address ? `<p class="r-meta" style="margin-bottom:4pt;">${escapeHtml(ctx.address)}</p>` : ''}
    ${ctx.phone ? `<p class="r-meta" style="margin-bottom:4pt;">โทร ${escapeHtml(ctx.phone)}</p>` : ''}
    ${ctx.taxId ? `<p class="r-meta" style="margin-bottom:6pt;">เลขภาษี ${escapeHtml(ctx.taxId)}</p>` : ''}
    <p class="r-meta">เลขที่ ${escapeHtml(opts.billNo)}<br/>เครื่อง: ${escapeHtml(device)}<br/>${escapeHtml(new Date().toLocaleString('th-TH'))}</p>
    <table>${rows}</table>
    <p class="r-total">ยอดรวม ${formatMoney(opts.grandTotal)} บาท</p>
    <p class="r-pay">ชำระ: ${escapeHtml(opts.paymentLabel)}</p>
    <p class="r-footer">— ขอบคุณที่ใช้บริการ —</p>
  `
  document.body.appendChild(surface)
}

function unmountReceiptSurface(): void {
  document.getElementById(SURFACE_ID)?.remove()
  document.getElementById(STYLE_ID)?.remove()
}

export async function printPosReceipt(opts: {
  billNo: string
  lines: PosCartLine[]
  grandTotal: number
  paymentLabel: string
}): Promise<void> {
  mountReceiptSurface(opts)

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

  try {
    if (isTauri()) {
      await invoke('show_system_print_dialog')
      unmountReceiptSurface()
    } else {
      const onAfterPrint = () => {
        unmountReceiptSurface()
        window.removeEventListener('afterprint', onAfterPrint)
      }
      window.addEventListener('afterprint', onAfterPrint)
      window.setTimeout(unmountReceiptSurface, 120_000)
      window.print()
    }
  } catch {
    const onAfterPrint = () => {
      unmountReceiptSurface()
      window.removeEventListener('afterprint', onAfterPrint)
    }
    window.addEventListener('afterprint', onAfterPrint)
    window.setTimeout(unmountReceiptSurface, 120_000)
    window.print()
  }
}
