import type { PurchaseOrder } from '@/features/purchase/data/poTypes'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatBaht(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function printPurchaseOrder(po: PurchaseOrder, shopName: string): void {
  const rows = po.lines
    .map(
      (l) =>
        `<tr><td>${esc(l.sku)}</td><td>${esc(l.name)}</td><td class="num">${l.orderedQty}</td><td class="num">${formatBaht(l.unitCostOrder)}</td><td class="num">${formatBaht(l.orderedQty * l.unitCostOrder)}</td></tr>`,
    )
    .join('')
  const sub = po.lines.reduce((s, l) => s + l.orderedQty * l.unitCostOrder, 0)
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>ใบสั่งซื้อ ${esc(po.poNo)}</title>
  <style>
    body { font-family: Tahoma, 'Leelawadee UI', sans-serif; font-size: 13px; padding: 16px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    .meta { margin-bottom: 16px; color: #333; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #f3f4f6; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .foot { margin-top: 12px; text-align: right; font-weight: bold; }
  </style></head><body>
  <h1>ใบสั่งซื้อ (Purchase Order)</h1>
  <p class="meta">
    ร้าน: ${esc(shopName)}<br/>
    เลขที่: ${esc(po.poNo)}<br/>
    ซัพพลายเออร์: ${esc(po.supplierName)}<br/>
    วันที่: ${esc(new Date(po.orderedAt ?? po.createdAt).toLocaleString('th-TH'))}<br/>
    สถานะ: ORDERED
  </p>
  <table>
    <thead><tr><th>SKU</th><th>รายการ</th><th>จำนวนสั่ง</th><th>ต้นทุน/หน่วย</th><th>รวม</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="foot">รวม ${formatBaht(sub)} บาท (ก่อน VAT — ตามรายการสั่ง)</p>
  </body></html>`
  const w = window.open('', '_blank')
  if (!w) return
  w.document.open()
  w.document.write(html)
  w.document.close()
  w.focus()
  w.print()
  w.close()
}
