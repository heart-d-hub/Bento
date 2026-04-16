import {
  DEFAULT_MIN_LIST_SUBTOTAL_BAHT,
  DEFAULT_RETAIL_TIERS,
  DEFAULT_SELECTED_TAG_IDS,
  DEFAULT_WHOLESALE,
  type StlRetailTierSettingsRow,
  type StlVolumePromoSettings,
} from '@/features/promotions/stlVolumePromoSettings'
import {
  loadTagFormulas,
  newTagFormulaId,
  upsertTagFormula,
  type StlVolumeTagFormula,
} from '@/features/promotions/tagFormulaRegistry'
import { loadProductTagsRegistry } from '@/features/inventory/data/productTagsRegistry'
import { clsx } from 'clsx'
import { Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  /** ถ้าไม่ส่ง = แก้สูตร STL ตัวแรก (หรือสร้างจาก legacy) */
  formulaId?: string
}

function tierRowLabel(i: number, row: StlRetailTierSettingsRow) {
  if (row.maxBaht === null) return `ชั้น ${i + 1} — ${row.minBaht.toLocaleString('th-TH')} บาทขึ้นไป`
  return `ชั้น ${i + 1} — ${row.minBaht.toLocaleString('th-TH')} – ${row.maxBaht.toLocaleString('th-TH')} บาท`
}

export function StlPromoFormulaModal({ open, onClose, formulaId }: Props) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([...DEFAULT_SELECTED_TAG_IDS])
  const [minBaht, setMinBaht] = useState(String(DEFAULT_MIN_LIST_SUBTOTAL_BAHT))
  const [tiers, setTiers] = useState<StlRetailTierSettingsRow[]>(() => [...DEFAULT_RETAIL_TIERS])
  const [wholesaleDiscounts, setWholesaleDiscounts] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [formulaLabel, setFormulaLabel] = useState('โปร STL (คิดจากราคาตั้งรวม)')
  const tagRegistry = useState(() => loadProductTagsRegistry())[0]

  const labelById: Record<string, string> = Object.fromEntries(
    tagRegistry.map((t) => [t.id, t.label] as const),
  )

  useEffect(() => {
    if (!open) return
    const list = loadTagFormulas().filter((f) => f.kind === 'stl-volume') as StlVolumeTagFormula[]
    const target = formulaId ? list.find((f) => f.id === formulaId) : undefined
    const s = target?.settings
    const sel = s?.selectedTagIds?.length ? [...s.selectedTagIds] : [...DEFAULT_SELECTED_TAG_IDS]
    setSelectedTagIds(sel)
    setFormulaLabel(target?.label ?? 'โปร STL (คิดจากราคาตั้งรวม)')
    setMinBaht(String(s?.minListSubtotalBaht ?? DEFAULT_MIN_LIST_SUBTOTAL_BAHT))
    setTiers((s?.retailTiers ?? DEFAULT_RETAIL_TIERS).map((r) => ({ ...r })))
    setError(null)
    const fromStore = Object.fromEntries(
      Object.entries(s?.wholesale?.discountsByTagId ?? {}).map(([id, pct]) => [id, String(pct)]),
    )
    const defaults = Object.fromEntries(
      Object.entries(DEFAULT_WHOLESALE.discountsByTagId).map(([id, pct]) => [id, String(pct)]),
    )
    // เติมค่าให้ครบทุกแท็กที่เลือก (กันค่าว่างทำให้กดบันทึกแล้วไม่เซฟ)
    setWholesaleDiscounts(
      Object.fromEntries(sel.map((id) => [id, fromStore[id] ?? defaults[id] ?? '0'])),
    )
  }, [open])

  useEffect(() => {
    if (!open) return
    setWholesaleDiscounts((prev) => {
      const defaults = Object.fromEntries(
        Object.entries(DEFAULT_WHOLESALE.discountsByTagId).map(([id, pct]) => [id, String(pct)]),
      )
      const next: Record<string, string> = {}
      for (const id of selectedTagIds) {
        next[id] = prev[id] ?? defaults[id] ?? '0'
      }
      return next
    })
  }, [open, selectedTagIds])

  function resetDefaults() {
    setSelectedTagIds([...DEFAULT_SELECTED_TAG_IDS])
    setMinBaht(String(DEFAULT_MIN_LIST_SUBTOTAL_BAHT))
    setTiers(DEFAULT_RETAIL_TIERS.map((r) => ({ ...r })))
    setWholesaleDiscounts(
      Object.fromEntries(Object.entries(DEFAULT_WHOLESALE.discountsByTagId).map(([id, pct]) => [id, String(pct)])),
    )
    setError(null)
  }

  function updateTier(i: number, patch: Partial<StlRetailTierSettingsRow>) {
    setTiers((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  }

  function addTierRow(afterIndex?: number) {
    setTiers((prev) => {
      const i = afterIndex === undefined ? prev.length - 1 : Math.max(0, Math.min(prev.length - 1, afterIndex))
      const base = prev[i] ?? prev[prev.length - 1] ?? DEFAULT_RETAIL_TIERS[0]
      const max = base.maxBaht
      const nextMin = max !== null ? Math.max(0, max + 1) : Math.max(0, base.minBaht)
      const newRow: StlRetailTierSettingsRow = {
        minBaht: nextMin,
        maxBaht: null,
        discountsByTagId: { ...base.discountsByTagId },
      }
      const out = [...prev]
      out.splice(i + 1, 0, newRow)
      return out
    })
  }

  function removeTierRow(index: number) {
    setTiers((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }

  function save() {
    const minN = Number(minBaht.replace(/,/g, ''))
    if (!Number.isFinite(minN) || minN < 0) {
      setError('ยอดขั้นต่ำต้องเป็นตัวเลข (บาท)')
      return
    }
    if (selectedTagIds.length === 0) {
      setError('ต้องเลือกอย่างน้อย 1 แท็ก')
      return
    }

    const wholesaleMap: Record<string, number> = {}
    for (const id of selectedTagIds) {
      const raw = wholesaleDiscounts[id] ?? '0'
      const n = Number(String(raw).trim())
      if (!Number.isFinite(n)) {
        setError(`โหมดส่ง: % ลดของ “${labelById[id] ?? id}” ต้องเป็นตัวเลข`)
        return
      }
      wholesaleMap[id] = Math.min(100, Math.max(0, n))
    }
    setError(null)

    const nextTiers: StlRetailTierSettingsRow[] = tiers.map((r) => ({
      minBaht: Math.max(0, r.minBaht),
      maxBaht: r.maxBaht,
      discountsByTagId: Object.fromEntries(
        selectedTagIds.map((id) => [
          id,
          Math.min(100, Math.max(0, Number(r.discountsByTagId[id] ?? 0))),
        ]),
      ),
    }))
    const next: StlVolumePromoSettings = {
      selectedTagIds: [...selectedTagIds],
      minListSubtotalBaht: minN,
      retailTiers: nextTiers,
      wholesale: {
        discountsByTagId: wholesaleMap,
      },
    }
    const id = formulaId ?? newTagFormulaId()
    upsertTagFormula({
      id,
      kind: 'stl-volume',
      label: formulaLabel.trim() || 'โปร STL (คิดจากราคาตั้งรวม)',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: next,
    })
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stl-formula-title"
    >
      <div
        className="max-h-[min(90vh,40rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
          <div>
            <h4 id="stl-formula-title" className="text-sm font-semibold text-slate-900">
              ตั้งค่าสูตร tag
            </h4>
            <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
              คิดจากยอดราคาตั้งรวมของสินค้าที่มีแท็ก Bolt ดำ/เขียว (และ ladder รุ่นเก่า) — เก็บในเครื่องนี้
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
            aria-label="ปิด"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4">
        <label className="mb-3 block">
          <span className="mb-1 block text-[10px] font-medium text-slate-600">ชื่อสูตร</span>
          <input
            type="text"
            value={formulaLabel}
            onChange={(e) => setFormulaLabel(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
            placeholder="เช่น น็อต STL / น็อต X"
          />
        </label>

        <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50/80 p-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            เลือกแท็กที่เอามาคิดร่วมกัน
          </p>
          <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-white bg-white p-2">
            {tagRegistry.map((t) => {
              const on = selectedTagIds.includes(t.id)
              return (
                <label key={t.id} className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-800">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setSelectedTagIds((prev) => {
                        const next = checked ? [...prev, t.id] : prev.filter((x) => x !== t.id)
                        return [...new Set(next)]
                      })
                      setWholesaleDiscounts((prev) => {
                        if (!checked) {
                          const next = { ...prev }
                          delete next[t.id]
                          return next
                        }
                        return { ...prev, [t.id]: prev[t.id] ?? '0' }
                      })
                      setTiers((prev) =>
                        prev.map((row) => ({
                          ...row,
                          discountsByTagId: {
                            ...row.discountsByTagId,
                            ...(checked ? { [t.id]: row.discountsByTagId[t.id] ?? 0 } : {}),
                          },
                        })),
                      )
                    }}
                    className="size-3 rounded border-slate-300 text-violet-700"
                  />
                  <span className="min-w-0 flex-1 truncate">{t.label}</span>
                </label>
              )
            })}
          </div>
          {selectedTagIds.length === 0 ? (
            <p className="mt-2 text-[10px] text-rose-600">ต้องเลือกอย่างน้อย 1 แท็ก</p>
          ) : null}
          {error ? <p className="mt-2 text-[10px] text-rose-600">{error}</p> : null}
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-[10px] font-medium text-slate-600">
            ยอดรวมราคาตั้งขั้นต่ำ (ปลีก) — ต่ำกว่านี้ไม่ลด
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={minBaht}
            onChange={(e) => setMinBaht(e.target.value)}
            className="w-full max-w-[8rem] rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums"
          />
          <span className="ml-1 text-[10px] text-slate-500">บาท</span>
        </label>

        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          ตารางปลีก (ตามยอดรวมของสินค้าที่ติด tag ที่แอดมาในรายการ)
        </p>
        <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 p-2">
          {tiers.map((row, i) => (
            <div key={i} className="rounded-md border border-white bg-white p-2 shadow-sm">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-[10px] text-slate-600">{tierRowLabel(i, row)}</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => addTierRow(i)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-700 hover:bg-slate-50"
                    title="เพิ่มชั้น"
                  >
                    <Plus className="size-3.5" />
                    เพิ่ม
                  </button>
                  <button
                    type="button"
                    disabled={tiers.length <= 1}
                    onClick={() => removeTierRow(i)}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-1.5 py-1 text-[10px] text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title={tiers.length <= 1 ? 'ต้องเหลืออย่างน้อย 1 ชั้น' : 'ลบชั้นนี้'}
                  >
                    <Trash2 className="size-3.5" />
                    ลบ
                  </button>
                </div>
              </div>
              <div className={clsx('grid gap-2', selectedTagIds.length <= 1 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4')}>
                <label className="text-[10px]">
                  <span className="mb-0.5 block text-slate-500">ต่ำสุด (บาท)</span>
                  <input
                    type="number"
                    min={0}
                    value={row.minBaht}
                    onChange={(e) => updateTier(i, { minBaht: Number(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-200 px-1.5 py-1 text-xs tabular-nums"
                  />
                </label>
                <label className="text-[10px]">
                  <span className="mb-0.5 block text-slate-500">สูงสุด (ว่าง=ไม่มีเพดาน)</span>
                  <input
                    type="number"
                    min={0}
                    value={row.maxBaht === null ? '' : row.maxBaht}
                    onChange={(e) => {
                      const v = e.target.value.trim()
                      updateTier(i, { maxBaht: v === '' ? null : Number(v) })
                    }}
                    placeholder="เช่น 500"
                    className="w-full rounded border border-slate-200 px-1.5 py-1 text-xs tabular-nums"
                  />
                </label>
                {selectedTagIds.map((id, idx) => (
                  <label key={id} className="text-[10px]">
                    <span
                      className={clsx(
                        'mb-0.5 block font-medium',
                        idx % 2 === 0 ? 'text-slate-800' : 'text-emerald-800',
                      )}
                    >
                      ลด {labelById[id] ?? id} %
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={row.discountsByTagId[id] ?? 0}
                      onChange={(e) => {
                        const n = Number(e.target.value) || 0
                        updateTier(i, {
                          discountsByTagId: { ...row.discountsByTagId, [id]: n },
                        } as Partial<StlRetailTierSettingsRow>)
                      }}
                      className="w-full rounded border border-slate-200 px-1.5 py-1 text-xs tabular-nums"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addTierRow()}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus className="size-3.5" />
            เพิ่มชั้นบันได
          </button>
        </div>

        <p className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          โหมดส่ง (ราคาส่ง / tier ส่ง)
        </p>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2">
          <div className={clsx('grid gap-2', selectedTagIds.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
            {selectedTagIds.map((id, idx) => (
              <label key={id} className="text-[10px]">
                <span
                  className={clsx(
                    'mb-0.5 block font-medium',
                    idx % 2 === 0 ? 'text-slate-800' : 'text-emerald-800',
                  )}
                >
                  ลด {labelById[id] ?? id} %
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={wholesaleDiscounts[id] ?? '0'}
                  onChange={(e) => setWholesaleDiscounts((prev) => ({ ...prev, [id]: e.target.value }))}
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm tabular-nums"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={resetDefaults}
            className={clsx(
              'inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700',
              'hover:bg-slate-50',
            )}
          >
            <RotateCcw className="size-3.5" />
            คืนค่าเริ่มต้น
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
            >
              บันทึก
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
