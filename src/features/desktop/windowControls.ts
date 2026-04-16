import { isTauri } from '@/features/desktop/isTauri'
import { currentMonitor, getCurrentWindow, LogicalSize, type Monitor } from '@tauri-apps/api/window'

/**
 * ต้องใช้ `getCurrentWindow()` (label = หน้าต่าง)
 * — อย่าใช้ `WebviewWindow.getCurrent()` กับ setSize/center/fullscreen เพราะ label ของ webview กับ window อาจต่างกัน
 * ทำให้ plugin:window|set_size ส่งไปผิดตัวแล้วไม่เห็นผล
 */
function appWindow() {
  return getCurrentWindow()
}

export type WindowPresetId = 'p720' | 'p1080' | 'p1440'

/** ลำดับแสดงใน UI — เล็ก → กลาง → ใหญ่ */
export const WINDOW_PRESET_ORDER: WindowPresetId[] = ['p720', 'p1080', 'p1440']

export const WINDOW_PRESETS: Record<
  WindowPresetId,
  { label: string; width: number; height: number; tierTh: string; hintTh: string }
> = {
  p720: {
    label: '1280 × 720',
    width: 1280,
    height: 720,
    tierTh: 'จอเล็ก / POS',
    hintTh: 'จอโน้ตบุ๊ก 1366×768 หรือจอแนวตั้ง — ฟอร์มกะทัดรัด',
  },
  p1080: {
    label: '1920 × 1080',
    width: 1920,
    height: 1080,
    tierTh: 'จอกลาง (Full HD)',
    hintTh: 'จอ 1920×1080 ทั่วไป — สมดุลพื้นที่',
  },
  p1440: {
    label: '2560 × 1440',
    width: 2560,
    height: 1440,
    tierTh: 'จอใหญ่ (QHD)',
    hintTh: 'จอ 2K / จอใหญ่ — โต๊ะทำงานหรือจอคู่',
  },
}

/** แปลงความกว้างจอ (logical px) เป็น preset ที่เหมาะ */
export function suggestPresetIdFromMonitor(m: Monitor | null): WindowPresetId | null {
  if (!m) return null
  const logicalW = m.size.width / m.scaleFactor
  if (logicalW <= 1680) return 'p720'
  if (logicalW <= 2400) return 'p1080'
  return 'p1440'
}

export type MonitorSummaryUi = {
  name: string | null
  logicalW: number
  logicalH: number
  suggested: WindowPresetId | null
}

/** ข้อมูลจอปัจจุบัน + preset ที่แนะนำ (ใช้ใน Tauri เท่านั้น) */
export async function getMonitorSummaryForUi(): Promise<MonitorSummaryUi | null> {
  if (!isTauri()) return null
  const mon = await currentMonitor()
  if (!mon) return null
  const logicalW = Math.round(mon.size.width / mon.scaleFactor)
  const logicalH = Math.round(mon.size.height / mon.scaleFactor)
  return {
    name: mon.name,
    logicalW,
    logicalH,
    suggested: suggestPresetIdFromMonitor(mon),
  }
}

/**
 * ปรับขนาดหน้าต่างตาม preset — ถ้าจอเต็มหรือ maximize อยู่จะออกจากโหมดนั้นก่อน (ไม่งั้น setSize อาจไม่เห็นผลบน Windows)
 */
export async function setWindowPreset(presetId: WindowPresetId): Promise<void> {
  if (!isTauri()) return
  const win = appWindow()
  const p = WINDOW_PRESETS[presetId]
  try {
    await win.setFullscreen(false)
    try {
      if (await win.isMaximized()) {
        await win.unmaximize()
      }
    } catch {
      /* บางแพลตฟอร์มไม่รองรับ — ข้าม */
    }
    await win.setResizable(true)
    await win.setSize(new LogicalSize(p.width, p.height))
    await win.center()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[setWindowPreset]', e)
    throw new Error(msg || 'ปรับขนาดหน้าต่างไม่สำเร็จ')
  }
}

export async function toggleFullscreen(): Promise<boolean> {
  if (!isTauri()) return false
  const win = appWindow()
  const next = !(await win.isFullscreen())
  await win.setFullscreen(next)
  return next
}

export async function getFullscreen(): Promise<boolean> {
  if (!isTauri()) return false
  return await appWindow().isFullscreen()
}

