/**
 * Filter presets สำหรับ ProductPickerModal — เก็บใน localStorage
 *
 * Why: Power user (เช่น เจ้าของร้านที่รับ rebuild Toyota Camry บ่อย) สามารถบันทึก
 * filter combo เป็น preset เพื่อเรียกใช้ครั้งเดียว (ไม่ต้องไล่กรอกทุกครั้ง)
 */

export type PickerFilterPreset = {
  id: string
  name: string
  make: string
  model: string
  engine: string
  drive: string
  year: string
  partBrand: string
  createdAt: number
}

const LS_KEY = 'bento.pos.picker.filterPresets.v1'
const MAX_PRESETS = 10

export const FILTER_PRESETS_CHANGED_EVENT = 'bento:posPicker:presets:changed'

function normalize(raw: unknown): PickerFilterPreset | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.name !== 'string') return null
  return {
    id: r.id,
    name: r.name,
    make: typeof r.make === 'string' ? r.make : 'ทั้งหมด',
    model: typeof r.model === 'string' ? r.model : 'ทั้งหมด',
    engine: typeof r.engine === 'string' ? r.engine : 'ทั้งหมด',
    drive: typeof r.drive === 'string' ? r.drive : 'ทั้งหมด',
    year: typeof r.year === 'string' ? r.year : 'ทั้งหมด',
    partBrand: typeof r.partBrand === 'string' ? r.partBrand : 'ทั้งหมด',
    createdAt: Number(r.createdAt) || Date.now(),
  }
}

export function loadFilterPresets(): PickerFilterPreset[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalize).filter((p): p is PickerFilterPreset => p != null)
  } catch {
    return []
  }
}

export function saveFilterPresets(presets: PickerFilterPreset[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(presets.slice(0, MAX_PRESETS)))
    window.dispatchEvent(new CustomEvent(FILTER_PRESETS_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}

export function addFilterPreset(preset: Omit<PickerFilterPreset, 'id' | 'createdAt'>): PickerFilterPreset {
  const created: PickerFilterPreset = {
    ...preset,
    id: `fp-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    createdAt: Date.now(),
  }
  const list = loadFilterPresets()
  saveFilterPresets([created, ...list])
  return created
}

export function deleteFilterPreset(id: string): void {
  saveFilterPresets(loadFilterPresets().filter((p) => p.id !== id))
}

/** สร้างชื่อ default จาก filter combo */
export function generatePresetName(p: Omit<PickerFilterPreset, 'id' | 'name' | 'createdAt'>): string {
  const parts: string[] = []
  if (p.make !== 'ทั้งหมด') parts.push(p.make)
  if (p.model !== 'ทั้งหมด') parts.push(p.model)
  if (p.engine !== 'ทั้งหมด') parts.push(p.engine)
  if (p.year !== 'ทั้งหมด') parts.push(`ปี ${p.year}`)
  if (p.drive !== 'ทั้งหมด') parts.push(p.drive)
  if (p.partBrand !== 'ทั้งหมด') parts.push(`[${p.partBrand}]`)
  return parts.length > 0 ? parts.join(' · ') : 'preset'
}
