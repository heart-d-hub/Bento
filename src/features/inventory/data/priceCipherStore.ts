import {
  DEFAULT_PRICE_CIPHER_SETTINGS,
  normalizePriceCipherSettings,
  type PriceCipherSettings,
} from '@/features/inventory/data/priceCipherCodec'

const KEY = 'bento.inventory.priceCipherSettings.v1'
export const PRICE_CIPHER_SETTINGS_CHANGED_EVENT = 'bento-price-cipher-settings-changed'

const MAX_PATTERNS = 8

export type PriceCipherStoreState = {
  patterns: PriceCipherSettings[]
  activePatternIndex: number
}

function defaultStoreState(): PriceCipherStoreState {
  return {
    patterns: [normalizePriceCipherSettings({ ...DEFAULT_PRICE_CIPHER_SETTINGS })],
    activePatternIndex: 0,
  }
}

function parseStored(raw: string | null): PriceCipherStoreState {
  if (!raw) return defaultStoreState()
  try {
    const j = JSON.parse(raw) as Record<string, unknown>
    if (j && Array.isArray(j.patterns)) {
      const patterns = (j.patterns as unknown[])
        .slice(0, MAX_PATTERNS)
        .map((p) => normalizePriceCipherSettings(p as Partial<PriceCipherSettings>))
      if (patterns.length === 0) return defaultStoreState()
      const activePatternIndex = Math.min(
        Math.max(0, Number(j.activePatternIndex) || 0),
        patterns.length - 1,
      )
      return { patterns, activePatternIndex }
    }
    const single = normalizePriceCipherSettings(j as Partial<PriceCipherSettings>)
    return { patterns: [single], activePatternIndex: 0 }
  } catch {
    return defaultStoreState()
  }
}

export function loadPriceCipherStoreState(): PriceCipherStoreState {
  try {
    const raw = localStorage.getItem(KEY)
    return parseStored(raw)
  } catch {
    return defaultStoreState()
  }
}

export function savePriceCipherStoreState(state: PriceCipherStoreState): void {
  const patterns = state.patterns
    .slice(0, MAX_PATTERNS)
    .map((p) => normalizePriceCipherSettings(p))
  if (patterns.length === 0) {
    const d = defaultStoreState()
    localStorage.setItem(KEY, JSON.stringify(d))
    window.dispatchEvent(new CustomEvent(PRICE_CIPHER_SETTINGS_CHANGED_EVENT))
    return
  }
  const activePatternIndex = Math.min(
    Math.max(0, state.activePatternIndex),
    patterns.length - 1,
  )
  const next: PriceCipherStoreState = { patterns, activePatternIndex }
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(PRICE_CIPHER_SETTINGS_CHANGED_EVENT))
}

export function loadPriceCipherSettings(): PriceCipherSettings {
  const st = loadPriceCipherStoreState()
  return normalizePriceCipherSettings(
    st.patterns[st.activePatternIndex] ?? st.patterns[0] ?? DEFAULT_PRICE_CIPHER_SETTINGS,
  )
}

export function savePriceCipherSettings(s: PriceCipherSettings): void {
  const st = loadPriceCipherStoreState()
  const idx = Math.min(Math.max(0, st.activePatternIndex), st.patterns.length - 1)
  const nextPatterns = [...st.patterns]
  nextPatterns[idx] = normalizePriceCipherSettings(s)
  savePriceCipherStoreState({ ...st, patterns: nextPatterns })
}

export type { PriceCipherSettings }
