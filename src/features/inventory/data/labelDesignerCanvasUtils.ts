export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** ความสูงแท่งบาร์โค้ด (px) สำหรับ JsBarcode — สัดส่วนกับ % ความสูงบนป้าย */
export function barcodeBarsHeightPx(templateHeightMm: number, elHPercent: number): number {
  return clamp(Math.round(((templateHeightMm * elHPercent) / 100) * 6), 18, 52)
}

export function defaultBarcodeTextFontSize(barsHeightPx: number): number {
  return barsHeightPx > 28 ? 11 : 9
}

/** ความยาวด้าน QR (px) ให้พอดีกล่อง % บนป้าย (สี่เหลี่ยมจัตุรัส) */
export function qrcodePixelSize(
  templateWidthMm: number,
  templateHeightMm: number,
  elWPercent: number,
  elHPercent: number,
): number {
  const wPx = clamp(Math.round(((templateWidthMm * elWPercent) / 100) * 6), 20, 220)
  const hPx = clamp(Math.round(((templateHeightMm * elHPercent) / 100) * 6), 20, 220)
  return Math.min(wPx, hPx)
}
