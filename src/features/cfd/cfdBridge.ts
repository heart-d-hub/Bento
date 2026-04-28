// ─── Shared state written by POS, read by CFD ────────────────────────────────

export const CFD_STATE_KEY    = 'bento.cfd.state.v1'
export const CFD_SETTINGS_KEY = 'bento.cfd.settings.v1'
export const CFD_VIDEO_KEY    = 'bento.cfd.video.v1'

export type CfdLine = {
  name: string
  qty: number
  unitLabel: string
  unitPrice: number
  lineTotal: number
  sku?: string
}

export type CfdMode = 'idle' | 'active' | 'confirmed' | 'qr'

export type CfdState = {
  mode: CfdMode
  lines: CfdLine[]
  subtotal: number
  discountAmt: number
  vatAmount: number
  grandTotal: number
  memberName: string | null
  paidAmount?: number
  changeAmount?: number
  qrPromptPayId?: string
  qrAmount?: number
  qrBankName?: string
  qrAccountName?: string
  spotlightSku?: string
  spotlightExpanded?: boolean
  spotlightImageIndex?: number
  updatedAt: number
}

export type CfdSettings = {
  storeName: string
  tagline: string
}

export const DEFAULT_CFD_SETTINGS: CfdSettings = {
  storeName: 'Ang Auto Parts',
  tagline: 'ยินดีต้อนรับ',
}

const IDLE_STATE: CfdState = {
  mode: 'idle',
  lines: [],
  subtotal: 0,
  discountAmt: 0,
  vatAmount: 0,
  grandTotal: 0,
  memberName: null,
  updatedAt: Date.now(),
}

export function writeCfdState(state: CfdState): void {
  try { localStorage.setItem(CFD_STATE_KEY, JSON.stringify(state)) } catch { /* noop */ }
}

export function readCfdState(): CfdState {
  try {
    const raw = localStorage.getItem(CFD_STATE_KEY)
    return raw ? (JSON.parse(raw) as CfdState) : IDLE_STATE
  } catch { return IDLE_STATE }
}

export function readCfdSettings(): CfdSettings {
  try {
    const raw = localStorage.getItem(CFD_SETTINGS_KEY)
    return raw ? { ...DEFAULT_CFD_SETTINGS, ...JSON.parse(raw) } : DEFAULT_CFD_SETTINGS
  } catch { return DEFAULT_CFD_SETTINGS }
}

export function writeCfdSettings(s: CfdSettings): void {
  try { localStorage.setItem(CFD_SETTINGS_KEY, JSON.stringify(s)) } catch { /* noop */ }
}

export function readCfdVideoPath(): string | null {
  try { return localStorage.getItem(CFD_VIDEO_KEY) } catch { return null }
}

export function writeCfdVideoPath(path: string | null): void {
  try {
    if (path) localStorage.setItem(CFD_VIDEO_KEY, path)
    else localStorage.removeItem(CFD_VIDEO_KEY)
  } catch { /* noop */ }
}
