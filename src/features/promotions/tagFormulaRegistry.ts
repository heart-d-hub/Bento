import {
  loadStlVolumePromoSettings,
  type StlVolumePromoSettings,
} from '@/features/promotions/stlVolumePromoSettings'

const STORAGE_KEY = 'bento.tagFormulaRegistry.v1'
export const TAG_FORMULAS_CHANGED_EVENT = 'bento-tag-formulas-changed'

export type TagFormulaKind = 'stl-volume'

export type TagFormulaBase = {
  id: string
  kind: TagFormulaKind
  /** ชื่อสูตรที่แสดงในรายการ */
  label: string
  createdAt: number
  updatedAt: number
}

export type StlVolumeTagFormula = TagFormulaBase & {
  kind: 'stl-volume'
  settings: StlVolumePromoSettings
}

export type TagFormula = StlVolumeTagFormula

function normalizeFormula(raw: unknown): TagFormula | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id.trim() : ''
  const kind = o.kind === 'stl-volume' ? 'stl-volume' : null
  const label = typeof o.label === 'string' ? o.label.trim() : ''
  const createdAt = Number(o.createdAt)
  const updatedAt = Number(o.updatedAt)
  if (!id || !kind || !label) return null
  if (!Number.isFinite(createdAt) || !Number.isFinite(updatedAt)) return null

  if (kind === 'stl-volume') {
    const settings = o.settings as unknown
    // reuse existing normalizer via load/save path by merging
    // (best-effort: if settings is invalid, drop)
    try {
      const merged = (() => {
        // loadStlVolumePromoSettings already returns merged defaults; mimic merge by saving to JSON then parsing
        // but we can just accept object and fall back below
        return settings
      })()
      // quick validate minimal shape
      if (!merged || typeof merged !== 'object') return null
      const s = merged as Record<string, unknown>
      if (!Array.isArray(s.selectedTagIds)) return null
      return {
        id,
        kind,
        label,
        createdAt,
        updatedAt,
        settings: merged as StlVolumePromoSettings,
      }
    } catch {
      return null
    }
  }
  return null
}

function normalizeList(raw: unknown): TagFormula[] {
  if (!Array.isArray(raw)) return []
  const out: TagFormula[] = []
  for (const x of raw) {
    const f = normalizeFormula(x)
    if (f) out.push(f)
  }
  // stable by updatedAt desc
  out.sort((a, b) => b.updatedAt - a.updatedAt)
  return out
}

export function newTagFormulaId(): string {
  try {
    const c = typeof globalThis !== 'undefined' ? (globalThis as { crypto?: Crypto }).crypto : undefined
    if (c && typeof c.randomUUID === 'function') {
      return `formula-${c.randomUUID()}`
    }
  } catch {
    /* fallback */
  }
  return `formula-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function loadTagFormulas(): TagFormula[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return normalizeList(JSON.parse(raw) as unknown)
  } catch {
    return []
  }
}

export function saveTagFormulas(next: TagFormula[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(TAG_FORMULAS_CHANGED_EVENT))
}

export function upsertTagFormula(formula: TagFormula) {
  const list = loadTagFormulas()
  const idx = list.findIndex((x) => x.id === formula.id)
  const now = Date.now()
  const next: TagFormula[] = [...list]
  if (idx >= 0) {
    next[idx] = { ...formula, updatedAt: now }
  } else {
    next.unshift({ ...formula, createdAt: now, updatedAt: now })
  }
  saveTagFormulas(next)
}

export function removeTagFormula(id: string) {
  const list = loadTagFormulas().filter((x) => x.id !== id)
  saveTagFormulas(list)
}

export function ensureLegacyStlFormulaSeeded(): TagFormula[] {
  const existing = loadTagFormulas()
  if (existing.some((f) => f.kind === 'stl-volume')) return existing
  const legacy = loadStlVolumePromoSettings()
  const seeded: StlVolumeTagFormula = {
    id: newTagFormulaId(),
    kind: 'stl-volume',
    label: 'โปร STL (คิดจากราคาตั้งรวม)',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: legacy,
  }
  const next = [seeded, ...existing]
  saveTagFormulas(next)
  return next
}

