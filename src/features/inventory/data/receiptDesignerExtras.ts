/** บล็อกเสริมบนใบเสร็จ — เก็บใน ReceiptDesignerLayout */

export type ReceiptFontPreset = 'mono' | 'sans_th' | 'system_sans'

export const RECEIPT_FONT_STACK: Record<ReceiptFontPreset, string> = {
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  sans_th: '"Sarabun", "Noto Sans Thai", "Leelawadee UI", ui-sans-serif, system-ui, sans-serif',
  system_sans: 'ui-sans-serif, system-ui, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
}

export const RECEIPT_FONT_LABELS: Record<ReceiptFontPreset, string> = {
  mono: 'มโนสเปซ (เครื่องพิมพ์)',
  sans_th: 'Sans ไทย (Sarabun / ระบบ)',
  system_sans: 'Sans ระบบ',
}

export type ReceiptExtraText = {
  id: string
  kind: 'text'
  text: string
  align: 'left' | 'center' | 'right'
  /** สัมพันธ์กับ baseFontPx (1 = เท่าฐาน) */
  fontEm: number
}

export type ReceiptExtraImage = {
  id: string
  kind: 'image'
  dataUrl: string
  widthPercent: number
}

export type ReceiptExtraQr = {
  id: string
  kind: 'qrcode'
  /** receiptNo = ข้อความใน QR เป็นเลขที่ใบเสร็จจริงตอนพิมพ์ */
  mode: 'receiptNo' | 'text'
  text: string
}

export type ReceiptExtraBlock = ReceiptExtraText | ReceiptExtraImage | ReceiptExtraQr

const MAX_IMAGE_DATA_URL_LEN = 450_000

export function newReceiptBlockId(): string {
  return `rb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function emptyTextBlock(): ReceiptExtraText {
  return {
    id: newReceiptBlockId(),
    kind: 'text',
    text: 'ข้อความ',
    align: 'center',
    fontEm: 1,
  }
}

export function emptyImageBlock(): ReceiptExtraImage {
  return {
    id: newReceiptBlockId(),
    kind: 'image',
    dataUrl: '',
    widthPercent: 72,
  }
}

export function emptyQrReceiptNoBlock(): ReceiptExtraQr {
  return {
    id: newReceiptBlockId(),
    kind: 'qrcode',
    mode: 'receiptNo',
    text: '',
  }
}

export function emptyQrTextBlock(): ReceiptExtraQr {
  return {
    id: newReceiptBlockId(),
    kind: 'qrcode',
    mode: 'text',
    text: 'https://example.com',
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function normalizeReceiptExtraBlock(v: unknown): ReceiptExtraBlock | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : newReceiptBlockId()
  const kind = o.kind
  if (kind === 'text') {
    const align = o.align === 'left' || o.align === 'right' ? o.align : 'center'
    const fontEm = clamp(typeof o.fontEm === 'number' && Number.isFinite(o.fontEm) ? o.fontEm : 1, 0.75, 1.75)
    const text = typeof o.text === 'string' ? o.text.slice(0, 2000) : ''
    return { id, kind: 'text', text, align, fontEm }
  }
  if (kind === 'image') {
    let dataUrl = typeof o.dataUrl === 'string' ? o.dataUrl : ''
    if (dataUrl.length > MAX_IMAGE_DATA_URL_LEN) dataUrl = ''
    const widthPercent = clamp(
      typeof o.widthPercent === 'number' && Number.isFinite(o.widthPercent) ? o.widthPercent : 72,
      15,
      100,
    )
    return { id, kind: 'image', dataUrl, widthPercent }
  }
  if (kind === 'qrcode') {
    const mode = o.mode === 'text' ? 'text' : 'receiptNo'
    const text = typeof o.text === 'string' ? o.text.slice(0, 2000) : ''
    return { id, kind: 'qrcode', mode, text }
  }
  return null
}

export function normalizeReceiptExtraBlocks(v: unknown): ReceiptExtraBlock[] {
  if (!Array.isArray(v)) return []
  const out: ReceiptExtraBlock[] = []
  for (const x of v) {
    const b = normalizeReceiptExtraBlock(x)
    if (b) out.push(b)
  }
  return out.slice(0, 24)
}

export function normalizeReceiptFontPreset(v: unknown): ReceiptFontPreset {
  if (v === 'sans_th' || v === 'system_sans') return v
  return 'mono'
}
