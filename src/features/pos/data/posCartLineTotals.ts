import type { PosCartLine } from '@/features/pos/data/posCartLineTypes'

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

/** ยอดรวมบรรทัด (ราคา × จำนวน — เมตร×บาท/เมตร หรือ กก.×บาท/กก.) — หลังโปรลด % หรือโปรชิ้นถัดไปถูกลง */
export function posLineSubtotal(l: PosCartLine): number {
  if (l.promoGift) return roundMoney(l.qty * l.unitPrice)
  if (l.secondPiecePromoApplied) {
    const { fullPricePieces, percentOffAdditional } = l.secondPiecePromoApplied
    const fp = Math.min(l.qty, fullPricePieces)
    const extra = Math.max(0, l.qty - fullPricePieces)
    const unitExtra = roundMoney(l.unitPrice * (1 - percentOffAdditional / 100))
    return roundMoney(fp * l.unitPrice + extra * unitExtra)
  }
  let unit = l.unitPrice
  if (l.percentPromoApplied) {
    unit = roundMoney(l.unitPrice * (1 - l.percentPromoApplied.percentOff / 100))
  }
  return roundMoney(l.qty * unit)
}
