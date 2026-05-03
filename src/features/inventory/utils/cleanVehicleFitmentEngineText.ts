import type { ProductMasterDetail, VehicleFitmentRef } from '@/features/inventory/data/productMasterData'

/** Strip year/drive patterns from engineLabel — mirror of extractEngineTextFromLabel in VehicleFitPicker */
function stripYearAndDriveFromLabel(label: string): string {
  const t = label.trim()
  if (!t) return ''
  const yearLike = '(?:ถึง\\s*\\d{4}|\\d{4}\\s*[-–]\\s*\\d{4}|\\d{4}\\s*[-–]\\s*ปัจจุบัน|ปี\\s*\\d{4}(?:\\s*[-–]\\s*(?:\\d{4}|ปัจจุบัน))?)'
  const a = t.replace(new RegExp(`\\s*\\(\\s*${yearLike}\\s*\\)\\s*$`, 'i'), '')
  const b = a.replace(new RegExp(`\\s*[·•]\\s*\\(\\s*${yearLike}\\s*\\)\\s*$`, 'i'), '')
  const c = b.replace(new RegExp(`\\s+${yearLike}\\s*$`, 'i'), '')
  const d = c.replace(new RegExp(`\\s*(?:[·•\\-–:]|ปี)\\s*${yearLike}\\s*$`, 'i'), '')
  const e = d.replace(/\s*[·•:\-–]+\s*$/, '').trim()
  if (/^ปี\s*(?:\d{4}\s*[-–]\s*\d{4}|ถึง\s*\d{4}|\d{4}\s*[-–]\s*ปัจจุบัน)$/i.test(e)) return ''
  return e.replace(/\s*[·•:\-–]?\s*\b(\d{1,2}WD|AWD|FWD|RWD)\b\s*$/i, '').trim()
}

/** Strip chassis/HP/Euro patterns that duplicate other fields. */
function stripDuplicatesFromText(
  text: string,
  chassisCode: string | undefined,
  hp: number | undefined,
  euroStandard: string | undefined,
): string {
  let t = text
  if (chassisCode) {
    const esc = chassisCode.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (esc) t = t.replace(new RegExp(`\\b${esc}\\b`, 'gi'), ' ')
  }
  if (hp && hp > 0) {
    t = t.replace(new RegExp(`\\b${hp}\\s*HP\\b`, 'gi'), ' ')
    t = t.replace(new RegExp(`\\bHP\\s*${hp}\\b`, 'gi'), ' ')
  }
  if (euroStandard) {
    t = t.replace(/\bEuro\s*\d+\b/gi, ' ')
  }
  return t.replace(/\s+/g, ' ').replace(/^[\s,\-/]+|[\s,\-/]+$/g, '').trim()
}

/**
 * Clean engineText (ขนาดเครื่อง) by stripping content that already lives in other fields:
 * - chassisCode (e.g., "FM2P", "GUN125")
 * - HP value (e.g., "360 HP", "HP 360")
 * - Euro standard (e.g., "Euro 3", "Euro 5")
 *
 * If engineText is missing, derives from engineLabel first then cleans.
 *
 * Returns the cleaned engineText. Empty string means everything was duplicate noise.
 */
export function cleanFitmentEngineText(fitment: Pick<VehicleFitmentRef,
  'engineText' | 'engineLabel' | 'chassisCode' | 'hp' | 'euroStandard'>): string {
  // Source: prefer explicit engineText, fallback to derived from label (year/drive stripped)
  const source = (fitment.engineText ?? '').trim()
    || stripYearAndDriveFromLabel(fitment.engineLabel ?? '')
  if (!source) return ''
  return stripDuplicatesFromText(source, fitment.chassisCode, fitment.hp, fitment.euroStandard)
}

export type FitmentMigrationResult = {
  cleaned: ProductMasterDetail[]
  changedFitmentCount: number
  changedProductCount: number
  samples: { sku: string; before: string; after: string }[]
}

/** Apply cleanFitmentEngineText to every fitment across all products. Returns new array (immutable). */
export function migrateAllFitmentEngineText(products: ProductMasterDetail[]): FitmentMigrationResult {
  const samples: FitmentMigrationResult['samples'] = []
  let changedFitmentCount = 0
  let changedProductCount = 0
  const cleaned = products.map((p) => {
    if (!p.vehicleFitments?.length) return p
    let productChanged = false
    const newFits = p.vehicleFitments.map((f) => {
      // Determine the "current source" the form would show if user opened editor
      const currentSource = (f.engineText ?? '').trim()
        || ((f.engineLabel ?? '').trim() ? f.engineLabel!.trim() : '')
      const newText = cleanFitmentEngineText(f)
      // Change if cleaned differs from current source AND we'd actually be modifying meaningful data
      if (newText !== (f.engineText ?? '').trim()) {
        changedFitmentCount += 1
        productChanged = true
        if (samples.length < 10) samples.push({ sku: p.sku, before: currentSource, after: newText })
        return { ...f, engineText: newText || undefined }
      }
      return f
    })
    if (productChanged) {
      changedProductCount += 1
      return { ...p, vehicleFitments: newFits }
    }
    return p
  })
  return { cleaned, changedFitmentCount, changedProductCount, samples }
}
