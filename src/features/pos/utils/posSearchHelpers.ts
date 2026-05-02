import type { VehicleFitmentRef } from '@/features/inventory/data/productMasterData'

export function normalizeSearchText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

export function tokenizeSearch(q: string): string[] {
  return q
    .trim()
    .split(/\s+/g)
    .map((t) => normalizeSearchText(t))
    .filter(Boolean)
}

export function fitmentYearLabel(f: VehicleFitmentRef): string {
  if (f.yearFrom != null && f.yearTo != null) return `${f.yearFrom}-${f.yearTo}`
  if (f.yearFrom != null && f.yearTo == null) return `${f.yearFrom}-ปัจจุบัน`
  if (f.yearFrom == null && f.yearTo != null) return `ถึง ${f.yearTo}`
  const y = f.yearRangeText?.trim()
  if (y) return y
  const fromEngineLabel = f.engineLabel.match(/(\d{4}\s*[-–]\s*\d{4})/)
  return fromEngineLabel?.[1] ?? '-'
}

export function getFitmentEngineName(f: VehicleFitmentRef): string {
  let name = ''
  if (f.engineText?.trim()) {
    name = f.engineText.trim()
  } else {
    const label = f.engineLabel?.trim() || ''
    if (!label || label === 'ไม่ระบุเครื่อง/ปี') name = ''
    else {
      const stripped = label.replace(/\s*\(\s*\d{4}[\s\S]*?\)\s*$/, '').trim()
      if (/^ปี\s*\d/.test(stripped) || /^\d{4}\s*[-–]/.test(stripped) || /^\d{4}$/.test(stripped)) name = ''
      else name = stripped
    }
  }
  // ผนวก Euro มาตรฐานเข้าไปท้ายชื่อเครื่อง — แต่กันซ้ำถ้ามีอยู่แล้วใน label
  const euro = f.euroStandard?.trim()
  if (euro && !new RegExp(euro.replace(/\s+/g, '\\s*'), 'i').test(name)) {
    return name ? `${name} · ${euro}` : euro
  }
  return name
}

export type ProductDims = {
  innerDiameterMm?: number
  outerDiameterMm?: number
  heightMm?: number
}

export function formatDims(d?: ProductDims): string {
  if (!d) return ''
  const parts: string[] = []
  if (d.innerDiameterMm) parts.push(`A:${d.innerDiameterMm}`)
  if (d.outerDiameterMm) parts.push(`B:${d.outerDiameterMm}`)
  if (d.heightMm) parts.push(`C:${d.heightMm}`)
  return parts.length ? parts.join(' ') + ' mm' : ''
}
