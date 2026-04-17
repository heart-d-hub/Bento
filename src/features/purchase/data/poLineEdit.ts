import type { PurchaseOrderLine } from '@/features/purchase/data/poTypes'

/** แก้จำนวนสั่ง/ต้นทุนบน PO ที่ Ordered หรือปิดแล้ว — จำนวนสั่งต้องไม่น้อยกว่าที่รับแล้ว */
export function mergeLinePatchForOrdered(
  line: PurchaseOrderLine,
  patch: Partial<Pick<PurchaseOrderLine, 'orderedQty' | 'unitCostOrder'>>,
): { ok: true; line: PurchaseOrderLine } | { ok: false; message: string } {
  const next: PurchaseOrderLine = { ...line }
  if (patch.orderedQty !== undefined) {
    const raw =
      typeof patch.orderedQty === 'number'
        ? patch.orderedQty
        : Number.parseFloat(String(patch.orderedQty))
    if (!Number.isFinite(raw)) {
      return { ok: false, message: 'จำนวนสั่งไม่ถูกต้อง' }
    }
    const minQ = line.receivedQtyTotal > 0 ? line.receivedQtyTotal : 1
    if (raw + 1e-9 < minQ) {
      return {
        ok: false,
        message: `จำนวนสั่งต้องไม่น้อยกว่า ${minQ} (รับแล้ว ${line.receivedQtyTotal})`,
      }
    }
    next.orderedQty = raw
  }
  if (patch.unitCostOrder !== undefined) {
    const u =
      typeof patch.unitCostOrder === 'number'
        ? patch.unitCostOrder
        : Number.parseFloat(String(patch.unitCostOrder))
    if (!Number.isFinite(u) || u < 0) {
      return { ok: false, message: 'ต้นทุนต่อหน่วยไม่ถูกต้อง' }
    }
    next.unitCostOrder = Math.round(u * 100) / 100
  }
  return { ok: true, line: next }
}

/** แก้ยอดรับสะสมบนบรรทัด PO — ใช้คู่กับปรับสต็อกตาม delta */
export function mergeReceivedQtyTotal(
  line: PurchaseOrderLine,
  newReceived: number,
): { ok: true; delta: number; line: PurchaseOrderLine } | { ok: false; message: string } {
  const next = typeof newReceived === 'number' ? newReceived : Number.parseFloat(String(newReceived))
  if (!Number.isFinite(next) || next < 0) {
    return { ok: false, message: 'จำนวนรับแล้วไม่ถูกต้อง' }
  }
  if (next - 1e-9 > line.orderedQty) {
    return { ok: false, message: `รับแล้วต้องไม่เกินจำนวนสั่ง (${line.orderedQty})` }
  }
  const delta = next - line.receivedQtyTotal
  return { ok: true, delta, line: { ...line, receivedQtyTotal: next } }
}
