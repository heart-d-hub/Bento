export type LabelDesignerField =
  | 'name'
  | 'sku'
  | 'barcode'
  | 'oem'
  | 'factory'
  | 'carModel'
  | 'salesUnit'
  | 'brand'
  | 'price'
  | 'storeName'
  | 'priceCipher'
  | 'binLocation'

export type LabelDesignerElement = {
  id: string
  kind: 'text' | 'barcode' | 'qrcode'
  field: LabelDesignerField
  x: number
  y: number
  w: number
  h: number
  fontSize?: number
  textAlign?: 'left' | 'center' | 'right'
  fontWeight?: 'normal' | 'semibold' | 'bold'
  textVariant?: 'plain' | 'badge'
  salesUnitIndex?: number
}

export type LabelDesignerTemplate = {
  version: 1
  name: string
  widthMm: number
  heightMm: number
  elements: LabelDesignerElement[]
}

export type LabelDesignerTemplateEntry = { id: string } & LabelDesignerTemplate

export type LabelDesignerTemplatesState = {
  activeId: string
  templates: LabelDesignerTemplateEntry[]
}

const KEY_V2 = 'bento.inventory.labelDesignerTemplates.v2'
const KEY_LEGACY = 'bento.inventory.labelDesignerTemplate.v1'

export const LABEL_DESIGNER_TEMPLATES_CHANGED_EVENT = 'bento-label-designer-templates-changed'

export function newLabelDesignerTemplateEntryId(): string {
  return `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

const VALID_FIELDS: LabelDesignerField[] = [
  'name',
  'sku',
  'barcode',
  'oem',
  'factory',
  'carModel',
  'salesUnit',
  'brand',
  'price',
  'storeName',
  'priceCipher',
]

function normalizeField(f: unknown): LabelDesignerField {
  if (typeof f === 'string' && VALID_FIELDS.includes(f as LabelDesignerField)) {
    return f as LabelDesignerField
  }
  return 'name'
}

function normalizeSalesUnitIndex(x: unknown): number | undefined {
  if (typeof x !== 'number' || !Number.isFinite(x) || x < 0) return undefined
  return Math.floor(x)
}

function normalizeKind(k: unknown): 'text' | 'barcode' | 'qrcode' {
  if (k === 'qrcode' || k === 'barcode' || k === 'text') return k
  return 'text'
}

function normalizeElement(e: LabelDesignerElement): LabelDesignerElement {
  return {
    ...e,
    kind: normalizeKind(e.kind),
    field: normalizeField(e.field),
    fontWeight:
      e.fontWeight === 'semibold' || e.fontWeight === 'bold' || e.fontWeight === 'normal'
        ? e.fontWeight
        : undefined,
    textVariant: e.textVariant === 'badge' ? 'badge' : undefined,
    salesUnitIndex: normalizeSalesUnitIndex(e.salesUnitIndex),
  }
}

function normalizeTemplateBody(p: Partial<LabelDesignerTemplate>): LabelDesignerTemplate | null {
  if (!p || p.version !== 1 || !Array.isArray(p.elements)) return null
  return {
    version: 1,
    name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : 'ป้ายมาตรฐาน',
    widthMm: typeof p.widthMm === 'number' ? p.widthMm : 90,
    heightMm: typeof p.heightMm === 'number' ? p.heightMm : 45,
    elements: p.elements
      .filter((e) => e && typeof e.id === 'string')
      .map((e) => normalizeElement(e as LabelDesignerElement)),
  }
}

function normalizeEntry(raw: unknown): LabelDesignerTemplateEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id : ''
  if (!id) return null
  const body = normalizeTemplateBody({
    version: 1,
    name: typeof o.name === 'string' ? o.name : undefined,
    widthMm: typeof o.widthMm === 'number' ? o.widthMm : undefined,
    heightMm: typeof o.heightMm === 'number' ? o.heightMm : undefined,
    elements: Array.isArray(o.elements) ? (o.elements as LabelDesignerElement[]) : [],
  })
  if (!body) return null
  return { id, ...body }
}

/** แม่แบบว่าง — องค์ประกอบและข้อความผู้ใช้ออกแบบเองทั้งหมด */
export function defaultLabelDesignerTemplate(): LabelDesignerTemplate {
  return {
    version: 1,
    name: 'ป้ายใหม่',
    widthMm: 50,
    heightMm: 35,
    elements: [],
  }
}

function freshDefaultState(): LabelDesignerTemplatesState {
  const id = newLabelDesignerTemplateEntryId()
  const t = defaultLabelDesignerTemplate()
  return { activeId: id, templates: [{ id, ...t }] }
}

/** ซ่อมสถานะที่เพี้ยน (ไม่มีแม่แบบ / activeId ชี้หาย) — กันหน้าจอขาวหลังลบแม่แบบหรือข้อมูล localStorage เสีย */
export function repairLabelDesignerTemplatesState(
  s: LabelDesignerTemplatesState,
): LabelDesignerTemplatesState {
  if (!s.templates || s.templates.length === 0) {
    return freshDefaultState()
  }
  if (!s.templates.some((t) => t.id === s.activeId)) {
    return { ...s, activeId: s.templates[0]!.id }
  }
  return s
}

function migrateLegacySingleTemplate(): LabelDesignerTemplatesState | null {
  try {
    const raw = localStorage.getItem(KEY_LEGACY)
    if (!raw) return null
    const p = JSON.parse(raw) as LabelDesignerTemplate
    const body = normalizeTemplateBody(p)
    if (!body) return null
    const id = newLabelDesignerTemplateEntryId()
    return { activeId: id, templates: [{ id, ...body }] }
  } catch {
    return null
  }
}

function normalizeState(raw: unknown): LabelDesignerTemplatesState | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const templates = Array.isArray(o.templates)
    ? (o.templates.map(normalizeEntry).filter((x): x is LabelDesignerTemplateEntry => x != null))
    : []
  if (templates.length === 0) return null
  let activeId = typeof o.activeId === 'string' ? o.activeId : templates[0]!.id
  if (!templates.some((t) => t.id === activeId)) activeId = templates[0]!.id
  return { activeId, templates }
}

export function loadLabelDesignerTemplatesState(): LabelDesignerTemplatesState {
  try {
    const raw = localStorage.getItem(KEY_V2)
    if (raw) {
      const parsed = normalizeState(JSON.parse(raw))
      if (parsed) return repairLabelDesignerTemplatesState(parsed)
    }
  } catch {
    /* fall through */
  }
  const migrated = migrateLegacySingleTemplate()
  if (migrated) {
    const saved = saveLabelDesignerTemplatesState(migrated)
    try {
      localStorage.removeItem(KEY_LEGACY)
    } catch {
      /* ignore */
    }
    return saved
  }
  return repairLabelDesignerTemplatesState(freshDefaultState())
}

export function saveLabelDesignerTemplatesState(s: LabelDesignerTemplatesState): LabelDesignerTemplatesState {
  const fixed = repairLabelDesignerTemplatesState(s)
  try {
    localStorage.setItem(KEY_V2, JSON.stringify(fixed))
  } catch {
    /* ignore quota / private mode */
  }
  window.dispatchEvent(new CustomEvent(LABEL_DESIGNER_TEMPLATES_CHANGED_EVENT))
  return fixed
}

export function entryToTemplate(entry: LabelDesignerTemplateEntry): LabelDesignerTemplate {
  const { id, ...rest } = entry
  void id
  return rest
}
