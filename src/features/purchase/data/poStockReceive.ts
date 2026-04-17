import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import {
  addPiecesToBoxPieceProduct,
  adjustPieceStock,
  adjustRollProductKg,
  deductBoxPieces,
  isBoxPieceProduct,
  loadBoxPieceStock,
  posRollNominalForProduct,
  saveBoxPieceStock,
  notifyLiveStockChanged,
} from '@/features/pos/data/posLiveStock'

/**
 * บวกสต็อกสาขา (ชิ้น / ม้วนกก.·เมตร / กล่อง+เศษ) ตามแคตตาล็อก POS
 * qty = หน่วยเดียวกับที่แสดงในคลัง (ชิ้น, กก., เมตร, ชิ้นรวมในกล่องโหมด)
 */
export function receiveQtyToBranchStock(productId: string, qty: number): void {
  const p = getPosCatalogProducts().find((x) => x.id === productId)
  if (!p) {
    throw new Error(`ไม่พบสินค้าในแคตตาล็อก: ${productId}`)
  }
  const q = qty
  if (q <= 0) return

  const mode = p.stockMode ?? 'piece'
  if (mode === 'piece') {
    adjustPieceStock(productId, Math.floor(q))
    return
  }
  if (mode === 'kg_roll' || mode === 'meter_roll') {
    adjustRollProductKg(productId, q, posRollNominalForProduct(p))
    return
  }
  if (isBoxPieceProduct(p) && p.piecesPerBox) {
    addPiecesToBoxPieceProduct(productId, p.piecesPerBox, Math.floor(q))
    return
  }
  adjustPieceStock(productId, Math.floor(q))
}

/**
 * ปรับสต็อกตามผลต่างจำนวนรับ (บวก/ลบ) — ใช้เมื่อแก้ «รับแล้ว» ใน PO
 */
export function applySignedReceiveQtyToBranchStock(productId: string, signedQty: number): void {
  if (signedQty === 0) return
  if (signedQty > 0) {
    receiveQtyToBranchStock(productId, signedQty)
    return
  }
  const p = getPosCatalogProducts().find((x) => x.id === productId)
  if (!p) {
    throw new Error(`ไม่พบสินค้าในแคตตาล็อก: ${productId}`)
  }
  const mode = p.stockMode ?? 'piece'
  if (mode === 'piece') {
    adjustPieceStock(productId, Math.trunc(signedQty))
    return
  }
  if (mode === 'kg_roll' || mode === 'meter_roll') {
    adjustRollProductKg(productId, signedQty, posRollNominalForProduct(p))
    return
  }
  if (isBoxPieceProduct(p) && p.piecesPerBox) {
    const per = Math.max(1, Math.floor(p.piecesPerBox))
    const need = Math.abs(Math.floor(signedQty))
    const map = loadBoxPieceStock()
    const next = deductBoxPieces(map, productId, need, per)
    saveBoxPieceStock(next)
    notifyLiveStockChanged()
    return
  }
  adjustPieceStock(productId, Math.trunc(signedQty))
}

