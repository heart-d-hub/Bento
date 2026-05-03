import type { ProductMasterDetail } from '@/features/inventory/data/productMasterData'

/** A/B/C inputs map to inner / outer / height in physicalDimensions. */
export type MeasureInput = { h: number; od: number; id?: number }

export function parseMeasureMm(s: string): number | undefined {
  const t = s.trim().replace(',', '.')
  if (!t) return undefined
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

export function dimensionStrictMatch(
  p: ProductMasterDetail,
  input: MeasureInput,
  tol: number,
): boolean {
  const d = p.physicalDimensions
  if (!d) return false
  if (d.outerDiameterMm !== undefined && Math.abs(d.outerDiameterMm - input.od) > tol) return false
  if (d.heightMm !== undefined && Math.abs(d.heightMm - input.h) > tol) return false
  if (d.innerDiameterMm !== undefined && input.id !== undefined) {
    if (Math.abs(d.innerDiameterMm - input.id) > tol) return false
  }
  return true
}

export function dimensionScore(p: ProductMasterDetail, input: MeasureInput): number | null {
  const d = p.physicalDimensions
  if (!d) return null
  let s = 0
  if (d.outerDiameterMm !== undefined) s += Math.abs(d.outerDiameterMm - input.od)
  if (d.heightMm !== undefined) s += Math.abs(d.heightMm - input.h)
  if (input.id !== undefined && d.innerDiameterMm !== undefined) {
    s += Math.abs(d.innerDiameterMm - input.id)
  }
  return s
}
