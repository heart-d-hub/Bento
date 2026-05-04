import type { WindowPresetId } from '@/features/desktop/windowControls'

const STORAGE_KEY = 'bento.label.realsize.calibration.v1'

export type RealSizeCalibrationMap = Partial<Record<WindowPresetId, number>>

/** กำหนดด้วย window.innerWidth — จับ preset ตามขนาดหน้าต่างปัจจุบัน (เลือก bucket ที่ใกล้สุด) */
export function detectCurrentPresetId(): WindowPresetId {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1280
  if (w <= 1600) return 'p720'
  if (w <= 2200) return 'p1080'
  return 'p1440'
}

export function loadRealSizeCalibration(): RealSizeCalibrationMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const out: RealSizeCalibrationMap = {}
    for (const k of ['p720', 'p1080', 'p1440'] as const) {
      const v = (parsed as Record<string, unknown>)[k]
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
        out[k] = v
      }
    }
    return out
  } catch {
    return {}
  }
}

export function saveRealSizeCalibration(map: RealSizeCalibrationMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* ignore quota / privacy mode */
  }
}

/** Scale factor that makes CSS mm match a physical mm for the active preset. 1.0 if uncalibrated. */
export function realSizeZoomFactor(): number {
  const map = loadRealSizeCalibration()
  const id = detectCurrentPresetId()
  return map[id] ?? 1.0
}

/** True เมื่อ preset ปัจจุบันมีค่าปรับเทียบแล้ว (ไม่ใช่ค่าเริ่มต้น) */
export function isRealSizeCalibrated(): boolean {
  const map = loadRealSizeCalibration()
  const id = detectCurrentPresetId()
  return typeof map[id] === 'number'
}

/**
 * บันทึก scale ใหม่จากการวัด: เราโชว์แท่ง ref CSS-mm ยาว `referenceMm` mm บนจอ
 * ผู้ใช้วัดด้วยไม้บรรทัดได้ `measuredMm` mm — scale = referenceMm / measuredMm
 */
export function commitRealSizeMeasurement(referenceMm: number, measuredMm: number): number {
  if (!Number.isFinite(measuredMm) || measuredMm <= 0) return realSizeZoomFactor()
  const factor = referenceMm / measuredMm
  const clamped = Math.max(0.5, Math.min(4, factor))
  const map = loadRealSizeCalibration()
  map[detectCurrentPresetId()] = clamped
  saveRealSizeCalibration(map)
  return clamped
}
