import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import {
  addPiecesToBoxPieceProduct,
  adjustPieceStock,
  adjustRollProductKg,
  isBoxPieceProduct,
  posRollNominalForProduct,
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
