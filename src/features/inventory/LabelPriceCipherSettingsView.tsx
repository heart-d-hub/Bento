import { clsx } from 'clsx'
import {
  exampleCipherPreview,
  normalizePriceCipherSettings,
  PRICE_CIPHER_SLOT_LABELS,
  PRICE_CIPHER_SLOT_OPTIONS,
  PRICE_CIPHER_PREVIEW_DEMO_MONEY,
  type PriceCipherSettings,
} from '@/features/inventory/data/priceCipherCodec'
import {
  loadPriceCipherStoreState,
  PRICE_CIPHER_SETTINGS_CHANGED_EVENT,
  savePriceCipherStoreState,
  type PriceCipherStoreState,
} from '@/features/inventory/data/priceCipherStore'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type LabelPriceCipherSettingsViewProps = {
  className?: string
}

/** ความกว้างคอลัมน์เดียวกับ 2. รหัสราคา / 5. รหัสราคา */
const colPriceSlotClass = 'w-[12ch] min-w-0 shrink-0'
/** ความกว้างคอลัมน์เดียวกับ 3. รหัส(10หลัก) / 6. รหัส(10หลัก) */
const colCipher10Class = 'w-[20mm] min-w-0 shrink-0'

function patchPattern(
  state: PriceCipherStoreState,
  index: number,
  partial: Partial<PriceCipherSettings>,
): PriceCipherStoreState {
  const patterns = state.patterns.map((p, i) => {
    if (i !== index) return p
    return {
      ...p,
      ...partial,
      costDigitMap:
        typeof partial.costDigitMap === 'string' ? partial.costDigitMap.slice(0, 10) : p.costDigitMap,
      sellDigitMap:
        typeof partial.sellDigitMap === 'string' ? partial.sellDigitMap.slice(0, 10) : p.sellDigitMap,
      leading1: typeof partial.leading1 === 'string' ? partial.leading1.slice(0, 1) : p.leading1,
      separator: typeof partial.separator === 'string' ? partial.separator.slice(0, 1) : p.separator,
    }
  })
  return { ...state, patterns }
}

export function LabelPriceCipherSettingsView({ className }: LabelPriceCipherSettingsViewProps) {
  const [store, setStore] = useState<PriceCipherStoreState>(() => loadPriceCipherStoreState())

  useEffect(() => {
    const sync = () => setStore(loadPriceCipherStoreState())
    window.addEventListener(PRICE_CIPHER_SETTINGS_CHANGED_EVENT, sync)
    return () => window.removeEventListener(PRICE_CIPHER_SETTINGS_CHANGED_EVENT, sync)
  }, [])

  const activeSettings = useMemo(() => {
    const i = Math.min(
      Math.max(0, store.activePatternIndex),
      store.patterns.length - 1,
    )
    return normalizePriceCipherSettings(store.patterns[i] ?? store.patterns[0])
  }, [store])

  const preview = useMemo(() => exampleCipherPreview(activeSettings), [activeSettings])

  const persist = (next: PriceCipherStoreState) => {
    setStore(next)
    savePriceCipherStoreState(next)
  }

  const updatePattern = (index: number, partial: Partial<PriceCipherSettings>) => {
    persist(patchPattern(store, index, partial))
  }

  const setActiveIndex = (index: number) => {
    if (index < 0 || index >= store.patterns.length) return
    persist({ ...store, activePatternIndex: index })
  }

  const addPattern = () => {
    const last = store.patterns[store.patterns.length - 1]
    const clone = normalizePriceCipherSettings(last ? { ...last } : {})
    persist({
      patterns: [...store.patterns, clone],
      activePatternIndex: store.patterns.length,
    })
  }

  const removePattern = (index: number) => {
    if (store.patterns.length <= 1) return
    const patterns = store.patterns.filter((_, i) => i !== index)
    let activePatternIndex = store.activePatternIndex
    if (index === activePatternIndex) {
      activePatternIndex = Math.min(index, patterns.length - 1)
    } else if (index < activePatternIndex) {
      activePatternIndex -= 1
    }
    persist({ patterns, activePatternIndex })
  }

  return (
    <div className={clsx('flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3', className)}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-start">
        <section className="rounded-2xl border border-slate-300/80 bg-slate-100/90 p-3 shadow-inner sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-700">
              ลำดับช่อง: ตัวนำ → รหัสราคา ช่วงแรก (ระดับราคา) → รหัส(10หลัก) → คั่น → รหัสราคา ช่วงหลัง (ระดับราคา) → รหัส(10หลัก)
            </p>
            <button
              type="button"
              onClick={addPattern}
              disabled={store.patterns.length >= 8}
              className="inline-flex items-center gap-1 rounded-lg border border-sky-600 bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-3.5" aria-hidden />
              เพิ่มแบบ +
            </button>
          </div>

          <div className="space-y-3">
            {store.patterns.map((pattern, pi) => {
              const p = pattern
              const isActive = store.activePatternIndex === pi

              return (
                <div
                  key={pi}
                  className={clsx(
                    'rounded-xl border bg-white/90 p-3 shadow-sm',
                    isActive ? 'border-amber-400/90 ring-1 ring-amber-200/80' : 'border-slate-200/90',
                  )}
                >
                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">แบบที่ {pi + 1}</span>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-600">
                        <input
                          type="radio"
                          name="price-cipher-active"
                          checked={isActive}
                          onChange={() => setActiveIndex(pi)}
                          className="size-3.5 border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        ใช้แบบนี้เมื่อพิมพ์
                      </label>
                    </div>
                    {store.patterns.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removePattern(pi)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-800 hover:bg-red-100"
                      >
                        <Trash2 className="size-3" aria-hidden />
                        ลบแบบ
                      </button>
                    ) : null}
                  </div>

                  <div className="flex min-w-0 flex-wrap items-end gap-x-2 gap-y-3 md:flex-nowrap md:overflow-x-auto md:pb-1">
                    {/* 1. ตัวนำ — กว้าง 1 ตัวอักษร */}
                    <label className="flex w-[2.25rem] shrink-0 flex-col gap-1">
                      <span className="max-w-full break-words text-[10px] font-medium leading-tight text-slate-600">
                        1. ตัวนำ
                      </span>
                      <input
                        type="text"
                        value={p.leading1.slice(0, 1)}
                        onChange={(e) => updatePattern(pi, { leading1: e.target.value.slice(0, 1) })}
                        maxLength={1}
                        className="h-9 w-full min-w-0 rounded-lg border border-slate-200 text-center text-sm font-semibold"
                        placeholder="—"
                        title="ตัวหน้าสุด 1 ตัว"
                      />
                    </label>

                    {/* 2. รหัสราคา ช่วงแรก */}
                    <div className={colPriceSlotClass}>
                      <label className="flex flex-col gap-1">
                        <span className="max-w-full break-words text-[10px] font-medium leading-tight text-slate-600">
                          2. รหัสราคา
                        </span>
                        <select
                          value={p.costSlot}
                          onChange={(e) =>
                            updatePattern(pi, {
                              costSlot: e.target.value as PriceCipherSettings['costSlot'],
                            })
                          }
                          className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-1 text-[10px] leading-tight sm:text-[11px]"
                        >
                          {PRICE_CIPHER_SLOT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {/* 3. รหัส(10หลัก) */}
                    <div className={colCipher10Class}>
                      <label className="flex flex-col gap-1">
                        <span className="max-w-full break-words text-[10px] font-medium leading-tight text-slate-600">
                          3. รหัส(10หลัก)
                        </span>
                        <input
                          type="text"
                          value={p.costDigitMap.slice(0, 10)}
                          onChange={(e) => updatePattern(pi, { costDigitMap: e.target.value })}
                          maxLength={10}
                          className="h-9 w-full min-w-0 overflow-x-auto rounded-lg border border-amber-200/80 bg-amber-50/30 px-1 font-mono text-[10px] tracking-wide sm:text-[11px]"
                          placeholder="รหัส 10 หลัก"
                          title="ตัวอักษรตัวที่ 1 แทนเลข 0 … ตัวที่ 10 แทนเลข 9"
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </label>
                    </div>

                    {/* 4. คั่น — 1 ตัวอักษร */}
                    <label className="flex w-[2.25rem] shrink-0 flex-col gap-1">
                      <span className="max-w-full break-words text-[10px] font-medium leading-tight text-slate-600">
                        4. คั่น
                      </span>
                      <input
                        type="text"
                        value={p.separator.slice(0, 1)}
                        onChange={(e) => updatePattern(pi, { separator: e.target.value.slice(0, 1) })}
                        maxLength={1}
                        className="h-9 w-full min-w-0 rounded-lg border border-slate-200 text-center text-sm font-semibold"
                        placeholder="—"
                      />
                    </label>

                    {/* 5. รหัสราคา ช่วงหลัง — กว้างเท่า 2 */}
                    <div className={colPriceSlotClass}>
                      <label className="flex flex-col gap-1">
                        <span className="max-w-full break-words text-[10px] font-medium leading-tight text-slate-600">
                          5. รหัสราคา
                        </span>
                        <select
                          value={p.sellSlot}
                          onChange={(e) =>
                            updatePattern(pi, {
                              sellSlot: e.target.value as PriceCipherSettings['sellSlot'],
                            })
                          }
                          className="h-9 w-full min-w-0 rounded-lg border border-emerald-200/90 bg-emerald-50/25 px-1 text-[10px] leading-tight sm:text-[11px]"
                        >
                          {PRICE_CIPHER_SLOT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {/* 6. รหัส(10หลัก) — กว้างเท่า 3 */}
                    <div className={colCipher10Class}>
                      <label className="flex flex-col gap-1">
                        <span className="max-w-full break-words text-[10px] font-medium leading-tight text-slate-600">
                          6. รหัส(10หลัก)
                        </span>
                        <input
                          type="text"
                          value={p.sellDigitMap.slice(0, 10)}
                          onChange={(e) => updatePattern(pi, { sellDigitMap: e.target.value })}
                          maxLength={10}
                          className="h-9 w-full min-w-0 overflow-x-auto rounded-lg border border-emerald-200/90 bg-emerald-50/25 px-1 font-mono text-[10px] tracking-wide sm:text-[11px]"
                          placeholder="รหัส 10 หลัก"
                          title="ตัวอักษรตัวที่ 1 แทนเลข 0 … ตัวที่ 10 แทนเลข 9"
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-3 text-[10px] leading-relaxed text-slate-600">
            ราคา 5 ระดับ (ปลีก–พิเศษ) อิงจากแถวราคาในฟอร์มสินค้า — ถ้าไม่มีแถวปลีกในแฟ้ม จะใช้ราคาจากคิวหรือราคาขายหลักแทน
          </p>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">ตัวอย่าง</h3>
          <p className="mt-1 text-[10px] text-slate-500">
            สมมติสินค้า: ทุน {PRICE_CIPHER_PREVIEW_DEMO_MONEY.costBaht} · ปลีก {PRICE_CIPHER_PREVIEW_DEMO_MONEY.tiers[0]} · ช่าง{' '}
            {PRICE_CIPHER_PREVIEW_DEMO_MONEY.tiers[1]} · ส่ง {PRICE_CIPHER_PREVIEW_DEMO_MONEY.tiers[2]} · VIP{' '}
            {PRICE_CIPHER_PREVIEW_DEMO_MONEY.tiers[3]} · พิเศษ {PRICE_CIPHER_PREVIEW_DEMO_MONEY.tiers[4]} บาท
          </p>
          <p className="mt-2 text-[11px] text-slate-700">
            ช่วงแรก ({PRICE_CIPHER_SLOT_LABELS[preview.firstSlot]}):{' '}
            <span className="font-mono font-medium">{preview.firstBaht}</span> บาท → หลัก{' '}
            <span className="font-mono">{preview.firstDigits}</span>
          </p>
          <p className="text-[11px] text-slate-700">
            ช่วงหลัง ({PRICE_CIPHER_SLOT_LABELS[preview.secondSlot]}):{' '}
            <span className="font-mono font-medium">{preview.secondBaht}</span> บาท → หลัก{' '}
            <span className="font-mono">{preview.secondDigits}</span>
          </p>
          <p className="mt-3 text-xs font-medium text-slate-700">สร้างบรรทัดรหัส:</p>
          <div className="mt-1.5 break-all rounded-xl border border-slate-200 bg-slate-50/80 p-3 font-mono text-sm font-semibold text-slate-900">
            {preview.line || '—'}
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
            ใช้จำนวนเต็มบาท (ปัดครึ่ง) แล้วเข้ารหัสทีละหลัก: หลัก 0 ใช้ตัวอักษรตัวแรกของชุด 10 ตัว … หลัก 9 ใช้ตัวที่สิบ
          </p>
        </aside>
      </div>
    </div>
  )
}
