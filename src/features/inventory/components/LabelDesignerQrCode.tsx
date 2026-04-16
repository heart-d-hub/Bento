import QRCode from 'qrcode'
import { useEffect, useRef } from 'react'

type LabelDesignerQrCodeProps = {
  value: string
  sizePx: number
  className?: string
}

/** QR สำหรับแม่แบบป้าย — สร้าง SVG ด้วย qrcode */
export function LabelDesignerQrCode({ value, sizePx, className }: LabelDesignerQrCodeProps) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const v = value.trim()
    const payload = v.length > 0 ? v : ' '
    let cancelled = false
    el.innerHTML = ''
    QRCode.toString(payload, {
      type: 'svg',
      width: Math.max(16, sizePx),
      margin: 0,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((svg) => {
        if (!cancelled && el) el.innerHTML = svg
      })
      .catch(() => {
        if (!cancelled && el) el.innerHTML = ''
      })
    return () => {
      cancelled = true
    }
  }, [value, sizePx])

  return (
    <div
      ref={wrapRef}
      className={
        className ??
        'flex h-full min-h-0 w-full min-w-0 items-center justify-center [&_svg]:box-border [&_svg]:h-auto [&_svg]:max-h-full [&_svg]:max-w-full [&_svg]:w-full'
      }
    />
  )
}
