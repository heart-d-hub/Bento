import { isTauri } from '@/features/desktop/isTauri'
import { loadShortcuts, saveShortcuts, type ShortcutActionId, type ShortcutMap } from '@/features/desktop/shortcuts'
import { useThemePreference } from '@/features/settings/themePreference'
import {
  ACTION_TILE_ORDER_CHANGED_EVENT,
  loadActionTileOrder,
  resetActionTileOrder,
  saveActionTileOrder,
} from '@/features/main/data/actionTileLayout'
import { ACTION_TILES } from '@/features/main/data/actionTiles'
import {
  getFullscreen,
  getMonitorSummaryForUi,
  setWindowPreset,
  toggleFullscreen,
  WINDOW_PRESETS,
  WINDOW_PRESET_ORDER,
  type MonitorSummaryUi,
  type WindowPresetId,
} from '@/features/desktop/windowControls'
import { clsx } from 'clsx'
import { ArrowDown, ArrowUp, Expand, GripVertical, Keyboard, LayoutGrid, Moon, Printer, RotateCcw, Sun } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type ShortcutRow = { id: ShortcutActionId; label: string; hint?: string }

const SHORTCUT_ROWS: ShortcutRow[] = [
  { id: 'ui.close', label: 'ปิดหน้าต่าง/ยกเลิก', hint: 'Esc' },
  { id: 'pos.help', label: 'ช่วยเหลือ', hint: 'F1' },
  { id: 'pos.search', label: 'ค้นหาสินค้า/โฟกัสช่องค้นหา', hint: 'F2' },
  { id: 'pos.customer', label: 'เลือกลูกค้า', hint: 'F4' },
  { id: 'pos.pay', label: 'ชำระเงิน', hint: 'F9' },
  { id: 'pos.print', label: 'พิมพ์/พรีวิวบิล', hint: 'F10' },
]

function prettifyKey(key: string): string {
  if (!key) return ''
  if (key === ' ') return 'Space'
  return key
}

export function DesktopAppPanel() {
  const [presetId, setPresetId] = useState<WindowPresetId>('p720')
  const [presetError, setPresetError] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [monitorSummary, setMonitorSummary] = useState<MonitorSummaryUi | null>(null)
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(() => loadShortcuts())
  const [capturing, setCapturing] = useState<ShortcutActionId | null>(null)
  const [menuOrder, setMenuOrder] = useState<string[]>(() => loadActionTileOrder())
  const [menuArrangeMode, setMenuArrangeMode] = useState(false)
  const { theme, toggleTheme } = useThemePreference()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const fs = await getFullscreen()
      if (!cancelled) setFullscreen(fs)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isTauri()) return
    let cancelled = false
    void (async () => {
      const s = await getMonitorSummaryForUi()
      if (!cancelled) setMonitorSummary(s)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onChanged = () => setMenuOrder(loadActionTileOrder())
    window.addEventListener(ACTION_TILE_ORDER_CHANGED_EVENT, onChanged)
    return () => window.removeEventListener(ACTION_TILE_ORDER_CHANGED_EVENT, onChanged)
  }, [])

  useEffect(() => {
    if (!capturing) return
    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault()
      const nextKey = e.key
      const actionId = capturing as ShortcutActionId
      const next: ShortcutMap = { ...shortcuts, [actionId]: nextKey }
      setShortcuts(next)
      saveShortcuts(next)
      setCapturing(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [capturing, shortcuts])

  const isDesktop = useMemo(() => isTauri(), [])
  const menuRows = useMemo(() => {
    const byId = new Map(ACTION_TILES.map((x) => [x.id, x]))
    return menuOrder
      .map((id) => byId.get(id))
      .filter((x): x is (typeof ACTION_TILES)[number] => !!x)
  }, [menuOrder])

  const moveMenuTile = (from: number, to: number) => {
    if (from === to || to < 0 || to >= menuOrder.length) return
    const next = [...menuOrder]
    const [picked] = next.splice(from, 1)
    next.splice(to, 0, picked)
    setMenuOrder(next)
    saveActionTileOrder(next)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
            {theme === 'dark' ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">ธีมหน้าจอ (Theme)</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              สลับโหมดสว่าง / โหมดมืด (จะส่งผลกับหน้าจอที่รองรับ เช่น หน้าขายบิลภาษี)
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition',
              theme === 'dark'
                ? 'border-slate-800 bg-slate-900 text-white hover:bg-slate-800'
                : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
            )}
          >
            {theme === 'dark' ? (
              <>
                <Moon className="size-4" aria-hidden />
                โหมดมืด (Dark Mode)
              </>
            ) : (
              <>
                <Sun className="size-4" aria-hidden />
                โหมดสว่าง (Light Mode)
              </>
            )}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
            <Expand className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">หน้าจอและขนาดหน้าต่าง</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              <strong className="font-medium text-slate-800">ปรับขนาดเอง:</strong> ลากขอบหรือมุมหน้าต่างได้ตามปกติ (ยืดหยุ่น){' '}
              <span className="text-slate-600">
                ส่วน preset ด้านล่างเป็นทางลัดไปขนาดมาตรฐานเท่านั้น
                {isDesktop && monitorSummary?.suggested
                  ? ` — แนะนำสำหรับจอนี้: ${WINDOW_PRESETS[monitorSummary.suggested].tierTh}`
                  : null}
              </span>
              {!isDesktop ? ' — ขณะนี้กำลังรันบนเว็บ จึงเป็นโหมดดูตัวอย่าง' : null}
            </p>
          </div>
        </div>

        {!isDesktop ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/95 px-3 py-2 text-xs leading-relaxed text-amber-950">
            <p className="font-medium text-amber-950">ตอนนี้อยู่ในเบราว์เซอร์ (เช่น Chrome ที่ localhost:5173) — ไม่ใช่หน้าต่างแอป Tauri</p>
            <p className="mt-1 text-amber-900/95">
              แม้จะรัน <code className="rounded bg-white/80 px-1 py-0.5 font-mono text-[10px] text-amber-950">npm run tauri:dev</code> อยู่
              ก็ยังมี <strong className="font-semibold">สองหน้าต่างคนละอย่าง</strong>: เซิร์ฟเวอร์ Vite ให้เปิดใน Chrome ได้
              แต่การปรับขนาดหน้าต่างใช้ได้เฉพาะใน{' '}
              <strong className="font-semibold">หน้าต่างแอป Bento</strong> ที่ Tauri เปิดให้ (มักไม่มีแถบที่อยู่แบบเว็บ หรือชื่อหน้าต่างเป็น Bento)
              — สลับด้วย Alt+Tab แล้วเลือกหน้าต่างแอป ไม่ใช่แท็บ Chrome ที่เปิด DevTools
            </p>
          </div>
        ) : null}

        {isDesktop && monitorSummary ? (
          <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs leading-relaxed text-slate-700">
            <span className="font-medium text-slate-800">จอที่หน้าต่างอยู่ (โดยประมาณ): </span>
            {monitorSummary.logicalW} × {monitorSummary.logicalH} px
            {monitorSummary.name ? <span className="text-slate-600"> — {monitorSummary.name}</span> : null}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-600">Preset (ทางลัด — ไม่บังคับ)</span>
            <select
              value={presetId}
              onChange={(e) => {
                setPresetId(e.target.value as WindowPresetId)
                setPresetError(null)
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            >
              {WINDOW_PRESET_ORDER.map((id) => {
                const p = WINDOW_PRESETS[id]
                return (
                  <option key={id} value={id}>
                    {p.tierTh} — {p.label}
                  </option>
                )
              })}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => {
                setPresetError(null)
                if (!isDesktop) {
                  setPresetError(
                    'โหมดเบราว์เซอร์ควบคุมหน้าต่างแอปไม่ได้ — สลับไปหน้าต่างแอป Bento ที่ Tauri เปิด (ไม่ใช่แท็บ Chrome ที่ localhost)',
                  )
                  return
                }
                void (async () => {
                  try {
                    await setWindowPreset(presetId)
                  } catch (e) {
                    setPresetError(e instanceof Error ? e.message : 'ปรับขนาดไม่สำเร็จ')
                  }
                })()
              }}
              className={clsx(
                'w-full rounded-lg border px-3 py-2 text-sm font-medium shadow-sm',
                isDesktop
                  ? 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                  : 'border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100',
              )}
              title={
                isDesktop
                  ? 'ปรับขนาดหน้าต่างแอปเป็นค่าที่เลือก'
                  : 'ในเบราว์เซอร์ใช้ไม่ได้ — ต้องเปิดจากแอป Tauri'
              }
            >
              {isDesktop ? 'ใช้ขนาดนี้' : 'ทำไมกดไม่ได้?'}
            </button>
          </div>
        </div>

        {presetError ? (
          <p
            className={clsx('mt-2 text-xs', presetError.includes('เบราว์เซอร์') ? 'text-amber-900' : 'text-rose-700')}
            role="status"
          >
            {presetError}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              void (async () => {
                const next = await toggleFullscreen()
                setFullscreen(next)
              })()
            }
            className={clsx(
              'rounded-lg border px-3 py-2 text-sm font-medium shadow-sm',
              fullscreen ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
            )}
            disabled={!isDesktop}
            title={!isDesktop ? 'ต้องรันผ่าน .exe (Tauri) เพื่อควบคุม fullscreen' : undefined}
          >
            {fullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}
          </button>
          <p className="text-xs text-slate-500">
            เต็มจอแยกจาก preset — ถ้ากด preset แล้วไม่ขยับ ให้ออกจากโหมดเต็มจอ/ยกเลิกขยายเต็มหน้าต่างก่อน หรือใช้การลากขอบปรับเอง
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
            <Keyboard className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">คีย์ลัด (ตั้งค่าได้)</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              กด “ตั้งค่า” แล้วกดปุ่มที่ต้องการ (PoC: รองรับ Esc และ F1–F10 ตามที่คุณต้องการ)
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                <th className="px-3 py-2.5">การทำงาน</th>
                <th className="w-44 px-3 py-2.5">ปุ่ม</th>
                <th className="w-32 px-3 py-2.5 text-right">ตั้งค่า</th>
              </tr>
            </thead>
            <tbody>
              {SHORTCUT_ROWS.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-slate-900">{row.label}</p>
                    {row.hint ? <p className="text-xs text-slate-500">แนะนำ: {row.hint}</p> : null}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-800">{prettifyKey(shortcuts[row.id])}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => setCapturing(row.id)}
                      className={clsx(
                        'rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm',
                        capturing === row.id
                          ? 'border-sky-300 bg-sky-50 text-sky-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                      )}
                    >
                      {capturing === row.id ? 'กดปุ่ม...' : 'ตั้งค่า'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
            <LayoutGrid className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">เมนู Home (จัดเรียง)</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              จัดตำแหน่งเมนูหน้า Home แบบซ้ายไปขวา (ไล่ทีละแถว) แล้วบันทึกทันที
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuArrangeMode((v) => !v)}
            className={clsx(
              'rounded-lg border px-3 py-2 text-sm font-medium shadow-sm',
              menuArrangeMode
                ? 'border-cyan-300 bg-cyan-50 text-cyan-900'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            {menuArrangeMode ? 'ปิดโหมดจัดเรียงเมนู' : 'เปิดโหมดจัดเรียงเมนู'}
          </button>
          <button
            type="button"
            onClick={() => {
              resetActionTileOrder()
              setMenuOrder(loadActionTileOrder())
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RotateCcw className="size-4" aria-hidden />
            รีเซ็ตค่าเริ่มต้น
          </button>
        </div>

        {menuArrangeMode ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="w-14 px-3 py-2.5">ลำดับ</th>
                  <th className="px-3 py-2.5">เมนู</th>
                  <th className="w-28 px-3 py-2.5 text-right">ย้าย</th>
                </tr>
              </thead>
              <tbody>
                {menuRows.map((row, idx) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        <GripVertical className="size-3.5 text-slate-500" aria-hidden />
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-900">{row.label}</p>
                      <p className="text-xs text-slate-500">id: {row.id}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveMenuTile(idx, idx - 1)}
                          disabled={idx === 0}
                          className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-700 shadow-sm enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          title="ย้ายขึ้น"
                        >
                          <ArrowUp className="size-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveMenuTile(idx, idx + 1)}
                          disabled={idx === menuRows.length - 1}
                          className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-700 shadow-sm enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          title="ย้ายลง"
                        >
                          <ArrowDown className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            เปิดโหมดจัดเรียงเพื่อย้ายเมนูขึ้น/ลง และระบบจะสะท้อนที่หน้า Home ทันที
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
            <Printer className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">พิมพ์หลายฟอร์ม (โครง)</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              โครงสำหรับต่อ “เลือกฟอร์มก่อนพิมพ์” — ขั้นถัดไปจะทำหน้าพรีวิวและผูกกับการคิดเงินจริง
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            onClick={() => window.print()}
            title="PoC: ใช้หน้าพิมพ์ของระบบก่อน"
          >
            ทดลองเปิดหน้าพิมพ์
          </button>
          <p className="text-xs text-slate-500">PoC: ใช้ dialog พิมพ์ของ Windows; จะเพิ่ม selector ฟอร์มและ preview ในขั้นถัดไป</p>
        </div>
      </section>
    </div>
  )
}

