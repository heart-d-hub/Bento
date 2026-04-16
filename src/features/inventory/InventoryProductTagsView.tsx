import { StlPromoFormulaModal } from '@/features/inventory/components/StlPromoFormulaModal'
import { TagFormulaKindPickerModal } from '@/features/inventory/components/TagFormulaKindPickerModal'
import {
  isNonRemovableProductTagId,
  loadProductTagsRegistry,
  newProductTagId,
  PRODUCT_TAGS_CHANGED_EVENT,
  removeProductTagDefinition,
  upsertProductTagDefinition,
  type ProductTagDefinition,
} from '@/features/inventory/data/productTagsRegistry'
import {
  ensureLegacyStlFormulaSeeded,
  TAG_FORMULAS_CHANGED_EVENT,
  removeTagFormula,
  type StlVolumeTagFormula,
} from '@/features/promotions/tagFormulaRegistry'
import {
  getProductMasterList,
  PRODUCT_MASTER_LIST_CHANGED_EVENT,
  type ProductMasterDetail,
} from '@/features/inventory/data/productMasterData'
import { clsx } from 'clsx'
import { Info, LayoutGrid, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

function countProductsWithTag(tagId: string): number {
  return getProductMasterList().filter((p) => (p.productTagIds ?? []).includes(tagId)).length
}

function productsWithTag(tagId: string, limit: number): ProductMasterDetail[] {
  return getProductMasterList()
    .filter((p) => (p.productTagIds ?? []).includes(tagId))
    .slice(0, limit)
}

export function InventoryProductTagsView() {
  const [tags, setTags] = useState<ProductTagDefinition[]>(() => loadProductTagsRegistry())
  const [productTick, setProductTick] = useState(0)
  const [editing, setEditing] = useState<ProductTagDefinition | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editPriceMin, setEditPriceMin] = useState('')
  const [editPriceMax, setEditPriceMax] = useState('')
  const [editDiscountPct, setEditDiscountPct] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addLabel, setAddLabel] = useState('')
  const [infoTag, setInfoTag] = useState<ProductTagDefinition | null>(null)
  const [formulaOpen, setFormulaOpen] = useState(false)
  const [formulaKindPickerOpen, setFormulaKindPickerOpen] = useState(false)
  const [formulasTick, setFormulasTick] = useState(0)
  /** สูตรที่กำลังเปิดแก้ใน modal (null = เพิ่มสูตรใหม่) */
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; tag: ProductTagDefinition } | null>(null)
  const ctxMenuRef = useRef<HTMLDivElement>(null)
  const [formulaCtxMenu, setFormulaCtxMenu] = useState<{ x: number; y: number; formula: StlVolumeTagFormula } | null>(
    null,
  )
  const formulaCtxMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onTags = () => setTags(loadProductTagsRegistry())
    window.addEventListener(PRODUCT_TAGS_CHANGED_EVENT, onTags)
    return () => window.removeEventListener(PRODUCT_TAGS_CHANGED_EVENT, onTags)
  }, [])

  useEffect(() => {
    const on = () => setFormulasTick((n) => n + 1)
    window.addEventListener(TAG_FORMULAS_CHANGED_EVENT, on)
    return () => window.removeEventListener(TAG_FORMULAS_CHANGED_EVENT, on)
  }, [])

  useEffect(() => {
    const on = () => setProductTick((n) => n + 1)
    window.addEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, on)
    return () => window.removeEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, on)
  }, [])

  const counts = useMemo(() => {
    void productTick
    const m: Record<string, number> = {}
    for (const t of tags) {
      m[t.id] = countProductsWithTag(t.id)
    }
    return m
  }, [tags, productTick])

  const closeCtx = useCallback(() => setCtxMenu(null), [])
  const closeFormulaCtx = useCallback(() => setFormulaCtxMenu(null), [])

  useEffect(() => {
    if (!ctxMenu) return
    const onClick = (e: MouseEvent) => {
      if (ctxMenuRef.current?.contains(e.target as Node)) return
      closeCtx()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCtx()
    }
    window.addEventListener('pointerdown', onClick, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onClick, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [ctxMenu, closeCtx])

  useEffect(() => {
    if (!formulaCtxMenu) return
    const onClick = (e: MouseEvent) => {
      if (formulaCtxMenuRef.current?.contains(e.target as Node)) return
      closeFormulaCtx()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFormulaCtx()
    }
    window.addEventListener('pointerdown', onClick, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onClick, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [formulaCtxMenu, closeFormulaCtx])

  function openEdit(t: ProductTagDefinition) {
    setEditing(t)
    setEditLabel(t.label)
    setEditPriceMin(t.priceMinBaht != null && Number.isFinite(t.priceMinBaht) ? String(t.priceMinBaht) : '')
    setEditPriceMax(t.priceMaxBaht != null && Number.isFinite(t.priceMaxBaht) ? String(t.priceMaxBaht) : '')
    setEditDiscountPct(
      t.discountPercent != null && t.discountPercent > 0 ? String(t.discountPercent) : '',
    )
    closeCtx()
  }

  function openInfo(t: ProductTagDefinition) {
    setInfoTag(t)
    closeCtx()
  }

  function saveEdit() {
    if (!editing) return
    const label = editLabel.trim()
    if (!label) return
    const parseOpt = (s: string): number | undefined => {
      const t = s.trim().replace(',', '.')
      if (!t) return undefined
      const n = Number(t)
      return Number.isFinite(n) && n >= 0 ? n : undefined
    }
    const pm = parseOpt(editPriceMin)
    const px = parseOpt(editPriceMax)
    const dc = parseOpt(editDiscountPct)
    if (pm != null && px != null && pm > px) {
      window.alert('ราคาต่ำสุดต้องไม่มากกว่าราคาสูงสุด (บาท)')
      return
    }
    const tag: ProductTagDefinition = {
      id: editing.id,
      label,
      group: editing.group,
    }
    if (editing.splitSaleRollColumns) tag.splitSaleRollColumns = true
    if (editing.splitSaleBoxColumns) tag.splitSaleBoxColumns = true
    if (editing.splitSaleFolderMatch) tag.splitSaleFolderMatch = true
    if (pm !== undefined) tag.priceMinBaht = pm
    if (px !== undefined) tag.priceMaxBaht = px
    if (dc != null && dc > 0) tag.discountPercent = Math.min(100, dc)
    upsertProductTagDefinition(tag)
    setEditing(null)
    setTags(loadProductTagsRegistry())
  }

  function confirmDelete(t: ProductTagDefinition) {
    const n = counts[t.id] ?? 0
    const ok = window.confirm(
      n > 0
        ? `ลบแท็ก "${t.label}"?\nมีสินค้า ${n} รายการที่ยังอ้าง id นี้ — ชื่อแท็กจะหายจากรายการ แต่ id อาจยังค้างในแฟ้มจนกว่าจะแก้สินค้า`
        : `ลบแท็ก "${t.label}" ออกจากระบบ?`,
    )
    if (!ok) return
    removeProductTagDefinition(t.id)
    setEditing(null)
    setTags(loadProductTagsRegistry())
  }

  function addTag() {
    const label = addLabel.trim()
    if (!label) return
    const id = newProductTagId()
    upsertProductTagDefinition({ id, label, group: 'general' })
    setAddLabel('')
    setAddOpen(false)
    setTags(loadProductTagsRegistry())
  }

  function onChipContextMenu(e: React.MouseEvent, t: ProductTagDefinition) {
    e.preventDefault()
    closeFormulaCtx()
    const pad = 8
    const x = Math.min(e.clientX, window.innerWidth - 160 - pad)
    const y = Math.min(e.clientY, window.innerHeight - 88 - pad)
    setCtxMenu({ x, y, tag: t })
  }

  function onFormulaContextMenu(e: React.MouseEvent, f: StlVolumeTagFormula) {
    e.preventDefault()
    closeCtx()
    const pad = 8
    const x = Math.min(e.clientX, window.innerWidth - 160 - pad)
    const y = Math.min(e.clientY, window.innerHeight - 88 - pad)
    setFormulaCtxMenu({ x, y, formula: f })
  }

  const chipClass = (t: ProductTagDefinition) =>
    clsx(
      'inline-flex max-w-full min-w-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition',
      'select-none hover:bg-white',
      t.id === 'bolt-black' && 'border-slate-600 bg-slate-800/95 text-white',
      t.id === 'bolt-green' && 'border-emerald-600 bg-emerald-800/95 text-white',
      t.id !== 'bolt-black' && t.id !== 'bolt-green' && 'border-slate-200 bg-white text-slate-800 shadow-sm',
    )

  const labelById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const t of tags) m[t.id] = t.label
    return m
  }, [tags])

  const stlFormulas = useMemo(() => {
    void formulasTick
    const seeded = ensureLegacyStlFormulaSeeded()
    return seeded.filter((f) => f.kind === 'stl-volume') as StlVolumeTagFormula[]
  }, [formulasTick])

  return (
    <section className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-3 pos-compact:gap-2">
      <div className="shrink-0">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <LayoutGrid className="size-4 text-violet-600" strokeWidth={1.75} aria-hidden />
          จัดการแท็กสินค้า
        </h3>
        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
          แท็กด้านบนแสดงจำนวนสินค้า — คลิกขวาเพื่อเปิดเมนูข้อมูล / แก้ไข · ตั้งช่วงราคา (บาท) + % ลด
          แล้วไปติ๊กแท็กนั้นในสินค้าแฟ้มมาสเตอร์ — POS จะลดราคาตามเงื่อนไข
        </p>
      </div>

      {/* ป้ายแท็กไม่ใหญ่ — สินค้าใน tag กี่รายการ */}
      <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-2 pos-compact:px-1.5 pos-compact:py-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((t) => {
            const n = counts[t.id] ?? 0
            return (
              <button
                key={t.id}
                type="button"
                onContextMenu={(e) => onChipContextMenu(e, t)}
                className={chipClass(t)}
                title={`${t.label} — คลิกขวาเพื่อเมนู`}
              >
                <span className="truncate">{t.label}</span>
                {t.discountPercent != null && t.discountPercent > 0 ? (
                  <span
                    className="shrink-0 rounded px-0.5 text-[9px] font-semibold tabular-nums text-amber-200"
                    title="มีเงื่อนไขลดราคาที่ POS"
                  >
                    −{t.discountPercent}%
                  </span>
                ) : null}
                <span
                  className={clsx(
                    'shrink-0 rounded-full px-1 py-px text-[10px] tabular-nums',
                    t.id === 'bolt-black' || t.id === 'bolt-green'
                      ? 'bg-white/15 text-white'
                      : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {n}
                </span>
              </button>
            )
          })}
          {tags.length === 0 ? (
            <span className="text-[11px] text-slate-400">ยังไม่มีแท็ก — ใช้ปุ่มด้านล่างเพิ่มแท็ก</span>
          ) : null}
        </div>
      </div>

      {/* แถบขีดด้านล่าง: สรุปสูตร/ฟังก์ชันที่ผูกกับ tag */}
      <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 py-2 pos-compact:px-2 pos-compact:py-1.5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-slate-900">สูตร/ฟังก์ชันที่ผูกกับแท็ก</p>
        </div>

        {stlFormulas.map((f) => {
          const selected = f.settings.selectedTagIds ?? []
          const selectedLabels = selected.map((id) => labelById[id] ?? id)
          const tierCount = f.settings.retailTiers?.length ?? 0
          return (
            <div
              key={f.id}
              onContextMenu={(e) => onFormulaContextMenu(e, f)}
              className="flex w-full cursor-default items-start gap-2 border-b border-slate-100 py-2 text-left hover:bg-slate-50/60"
              title="คลิกขวา: ตั้งค่าสูตร / ลบสูตร"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-900">{f.label}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
                  แท็กที่นับร่วม:{' '}
                  <span className="font-medium text-slate-700">
                    {selectedLabels.length ? selectedLabels.join(', ') : '—'}
                  </span>
                  {' · '}
                  ขั้น {tierCount} ชั้น
                  {' · '}
                  ขั้นต่ำ {f.settings.minListSubtotalBaht.toLocaleString('th-TH')} บาท
                </p>
              </div>
            </div>
          )
        })}

        <div className="pt-2 text-[10px] text-slate-400">
          คลิกขวาที่รายการเพื่อตั้งค่าหรือลบสูตร — ปุ่ม «เพิ่มสูตร» เลือกชนิด (เช่น ราคาขั้นบันได) แล้วตั้งค่ารายละเอียด
        </div>
      </div>

      {ctxMenu ? (
        <div
          ref={ctxMenuRef}
          role="menu"
          className="fixed z-[200] min-w-[9rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => openInfo(ctxMenu.tag)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-800 hover:bg-slate-50"
          >
            <Info className="size-3.5 text-slate-500" aria-hidden />
            ข้อมูล
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => openEdit(ctxMenu.tag)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-800 hover:bg-slate-50"
          >
            <Pencil className="size-3.5 text-slate-500" aria-hidden />
            แก้ไข
          </button>
        </div>
      ) : null}

      {formulaCtxMenu ? (
        <div
          ref={formulaCtxMenuRef}
          role="menu"
          className="fixed z-[200] min-w-[9rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          style={{ left: formulaCtxMenu.x, top: formulaCtxMenu.y }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              const f = formulaCtxMenu.formula
              closeFormulaCtx()
              setEditingFormulaId(f.id)
              setFormulaOpen(true)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-800 hover:bg-slate-50"
          >
            <Pencil className="size-3.5 text-slate-500" aria-hidden />
            ตั้งค่าสูตร
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              const f = formulaCtxMenu.formula
              const ok = window.confirm(`ลบสูตร “${f.label}” ?`)
              if (!ok) return
              closeFormulaCtx()
              removeTagFormula(f.id)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="size-3.5" aria-hidden />
            ลบสูตร
          </button>
        </div>
      ) : null}

      {/* Spacer ให้ footer อยู่ล่าง */}
      <div className="min-h-0 flex-1" aria-hidden />

      {/* ปุ่มล่าง */}
      <div className="sticky bottom-0 mt-auto flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white/95 py-2.5 pt-3 backdrop-blur-sm pos-compact:py-2 pos-compact:pt-2">
        <button
          type="button"
          onClick={() => {
            setEditingFormulaId(null)
            setFormulaKindPickerOpen(true)
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-medium text-violet-900 shadow-sm hover:bg-violet-100"
        >
          <Plus className="size-3.5" strokeWidth={2} aria-hidden />
          เพิ่มสูตร
        </button>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-violet-700"
        >
          <Plus className="size-3.5" strokeWidth={2} />
          เพิ่มแท็ก
        </button>
      </div>

      <TagFormulaKindPickerModal
        open={formulaKindPickerOpen}
        onClose={() => setFormulaKindPickerOpen(false)}
        onPick={() => {
          setFormulaKindPickerOpen(false)
          setEditingFormulaId(null)
          setFormulaOpen(true)
        }}
      />

      <StlPromoFormulaModal
        open={formulaOpen}
        formulaId={editingFormulaId ?? undefined}
        onClose={() => {
          setFormulaOpen(false)
          setEditingFormulaId(null)
        }}
      />

      {infoTag ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tag-info-title"
          onClick={() => setInfoTag(null)}
        >
          <div
            className="max-h-[min(90vh,28rem)] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 id="tag-info-title" className="text-sm font-semibold text-slate-900">
                ข้อมูลแท็ก
              </h4>
              <button
                type="button"
                onClick={() => setInfoTag(null)}
                className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
                aria-label="ปิด"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mb-1 font-mono text-[10px] text-slate-400">{infoTag.id}</p>
            <p className="text-sm font-medium text-slate-900">{infoTag.label}</p>
            {infoTag.group ? (
              <p className="mt-1 text-[10px] text-slate-500">กลุ่ม: {infoTag.group}</p>
            ) : null}
            {infoTag.splitSaleRollColumns ? (
              <p className="mt-2 rounded-md border border-teal-100 bg-teal-50/80 px-2 py-1.5 text-[10px] leading-snug text-teal-950">
                <span className="font-semibold">แบ่งขาย:</span> สินค้าที่มีแท็กนี้และตั้งโหมด{' '}
                <strong>ม้วน/กก.</strong> ในแฟ้ม — ตารางหน้าแบ่งขายจะแสดงคอลัมน์ ม้วนเต็ม / ม้วนเปิด / เศษ (กก.) /
                รวม (กก.) / กก.ต่อม้วน
              </p>
            ) : null}
            {infoTag.splitSaleBoxColumns ? (
              <p className="mt-2 rounded-md border border-amber-100 bg-amber-50/80 px-2 py-1.5 text-[10px] leading-snug text-amber-950">
                <span className="font-semibold">แบ่งขาย (กล่อง):</span> สินค้าที่มีแท็กนี้และตั้งโหมด{' '}
                <strong>กล่อง + เศษตัว</strong> ในแฟ้ม — ในหมวดแบ่งขายที่ติดแท็กเดียวกันจะแสดงคอลัมน์ เศษ (ตัว) / กล่องเต็ม /
                ตัวต่อกล่อง / รวม (ตัว)
              </p>
            ) : null}
            {infoTag.splitSaleFolderMatch ? (
              <p className="mt-2 rounded-md border border-violet-100 bg-violet-50/80 px-2 py-1.5 text-[10px] leading-snug text-violet-950">
                <span className="font-semibold">หมวดแบ่งขาย:</span> แท็กบนสินค้ากับแท็กที่หมวด (หน้าแบ่งขาย) ต้องตรงกันพอดี — มีแท็กนี้ที่สินค้าได้เฉพาะหมวดที่ติดแท็กเดียวกัน และหมวดที่ติดแท็กนี้รับเฉพาะสินค้าที่มีแท็กเดียวกัน
              </p>
            ) : null}
            {infoTag.discountPercent != null && infoTag.discountPercent > 0 ? (
              <p className="mt-2 rounded-lg border border-amber-100 bg-amber-50/80 px-2 py-1.5 text-[11px] text-amber-950">
                <span className="font-semibold">POS:</span> ราคาต่อหน่วย (ก่อนลดแท็ก) อยู่ระหว่าง{' '}
                <strong>
                  {infoTag.priceMinBaht ?? 0}–{infoTag.priceMaxBaht ?? '∞'}
                </strong>{' '}
                บาท → ลด <strong>{infoTag.discountPercent}%</strong>
              </p>
            ) : (
              <p className="mt-2 text-[10px] text-slate-500">ยังไม่ตั้งเงื่อนไขลดราคาที่ POS (แก้ไขแท็ก)</p>
            )}
            <p className="mt-2 text-[11px] text-slate-600">
              สินค้าที่มีแท็กนี้: <strong>{counts[infoTag.id] ?? 0}</strong> รายการ
            </p>
            <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/80 p-2">
              <p className="mb-1 text-[10px] font-medium text-slate-500">ตัวอย่างสินค้า</p>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-[11px] text-slate-800">
                {productsWithTag(infoTag.id, 20).length === 0 ? (
                  <li className="text-slate-400">— ยังไม่มีสินค้า</li>
                ) : (
                  productsWithTag(infoTag.id, 20).map((p) => (
                    <li key={p.id} className="truncate border-b border-slate-100/80 pb-0.5 last:border-0">
                      <span className="font-mono text-[10px] text-slate-400">{p.sku}</span> · {p.name}
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const t = infoTag
                  setInfoTag(null)
                  if (t) openEdit(t)
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                แก้ไขชื่อแท็ก…
              </button>
              <button
                type="button"
                onClick={() => setInfoTag(null)}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tag-edit-title"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 id="tag-edit-title" className="text-sm font-semibold text-slate-900">
                แก้ชื่อแท็ก
              </h4>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
                aria-label="ปิด"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mb-1 font-mono text-[10px] text-slate-400">{editing.id}</p>
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium text-slate-600">ชื่อที่แสดง</span>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                autoFocus
              />
            </label>
            <p className="mb-2 mt-3 text-[10px] font-medium text-slate-600">เงื่อนไขราคาที่ POS (ถ้าสินค้ามีแท็กนี้)</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="block sm:col-span-1">
                <span className="mb-0.5 block text-[10px] text-slate-500">ราคาต่ำสุด (บาท)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editPriceMin}
                  onChange={(e) => setEditPriceMin(e.target.value)}
                  placeholder="เช่น 20"
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums outline-none focus:border-violet-400"
                />
              </label>
              <label className="block sm:col-span-1">
                <span className="mb-0.5 block text-[10px] text-slate-500">ราคาสูงสุด (บาท)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editPriceMax}
                  onChange={(e) => setEditPriceMax(e.target.value)}
                  placeholder="เช่น 500"
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums outline-none focus:border-violet-400"
                />
              </label>
              <label className="block sm:col-span-1">
                <span className="mb-0.5 block text-[10px] text-slate-500">ลด (%)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editDiscountPct}
                  onChange={(e) => setEditDiscountPct(e.target.value)}
                  placeholder="เช่น 50"
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums outline-none focus:border-violet-400"
                />
              </label>
            </div>
            <p className="mt-1.5 text-[9px] leading-snug text-slate-500">
              เปรียบเทียบกับราคาขายต่อหน่วยจากแฟ้มมาสเตอร์ (ก่อนลดแท็ก) · ว่างช่อง min/max = ใช้ 0 / ไม่จำกัด ·
              หลายแท็กเข้าเงื่อนไข = ใช้ % ลดสูงสุด
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {!isNonRemovableProductTagId(editing.id) ? (
                <button
                  type="button"
                  onClick={() => editing && confirmDelete(editing)}
                  className="mr-auto text-xs text-rose-600 hover:underline"
                >
                  ลบแท็กนี้…
                </button>
              ) : (
                <p className="mr-auto max-w-[14rem] text-[10px] text-slate-400">
                  แท็กระบบเริ่มต้น — แก้ชื่อได้ ลบถาวรไม่ได้
                </p>
              )}
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {addOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tag-add-title"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 id="tag-add-title" className="text-sm font-semibold text-slate-900">
                เพิ่มแท็ก
              </h4>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
                aria-label="ปิด"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mb-2 text-[10px] text-slate-500">
              ระบบสร้างรหัสภายในให้อัตโนมัติ — คุณกำหนดแค่ชื่อที่แสดง
            </p>
            <input
              type="text"
              value={addLabel}
              onChange={(e) => setAddLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="เช่น พิเศษ — โปร A"
              className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={addTag}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
              >
                เพิ่ม
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
