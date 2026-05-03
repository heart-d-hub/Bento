import { clsx } from 'clsx'
import { LabelDesignerStickerBody } from '@/features/inventory/components/LabelDesignerStickerBody'
import type { LabelDesignerElement, LabelDesignerField, LabelDesignerTemplate } from '@/features/inventory/data/labelDesignerTemplateStore'
import {
  defaultLabelDesignerTemplate,
  loadLabelDesignerTemplatesState,
  newLabelDesignerTemplateEntryId,
  saveLabelDesignerTemplatesState,
  entryToTemplate,
  type LabelDesignerTemplate,
  type LabelDesignerTemplatesState,
} from '@/features/inventory/data/labelDesignerTemplateStore'
import {
  barcodeBarsHeightPx,
  clamp,
  defaultBarcodeTextFontSize,
} from '@/features/inventory/data/labelDesignerCanvasUtils'
import { LABEL_DESIGNER_DENSITY_PRESETS } from '@/features/inventory/data/labelDesignerDensityPresets'
import type { EnrichedLabelRow } from '@/features/inventory/labelPrintLayout'
import {
  DESIGNER_SAMPLE_ROW,
  fieldLabelTh,
  findProductMasterForLabelRow,
} from '@/features/inventory/labelDesignerFieldUtils'
import { normalizeSalesUnits } from '@/features/inventory/data/productMasterData'
import {
  loadPriceCipherSettings,
  PRICE_CIPHER_SETTINGS_CHANGED_EVENT,
} from '@/features/inventory/data/priceCipherStore'
import { loadStoreProfile, STORE_PROFILE_CHANGED_EVENT } from '@/features/settings/data/storeProfileStore'
import { QUICK_START_TEMPLATES, type QuickStartTemplate } from '@/features/inventory/data/labelDesignerQuickStarts'
import { CopyPlus, Plus, Redo2, RotateCcw, Save, Sparkles, Store, Trash2, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

type LabelBarcodeDesignerViewProps = {
  className?: string
  previewRow?: EnrichedLabelRow
}

function newElementId(): string {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function createElement(kind: 'text' | 'barcode' | 'qrcode', field: LabelDesignerField, index: number): LabelDesignerElement {
  const stagger = (index % 4) * 3
  if (field === 'storeName') {
    return {
      id: newElementId(),
      kind: 'text',
      field: 'storeName',
      x: 56,
      y: 5,
      w: 40,
      h: 12,
      fontSize: 8,
      textAlign: 'right',
      fontWeight: 'bold',
      textVariant: 'badge',
    }
  }
  if (field === 'priceCipher') {
    return {
      id: newElementId(),
      kind: 'text',
      field: 'priceCipher',
      x: 4,
      y: 84,
      w: 92,
      h: 14,
      fontSize: 7,
      textAlign: 'left',
      fontWeight: 'normal',
    }
  }
  return {
    id: newElementId(),
    kind,
    field,
    x: 8 + stagger,
    y: 8 + stagger * 1.5,
    w: 84,
    h: kind === 'barcode' ? 32 : kind === 'qrcode' ? 30 : 14,
    fontSize: kind === 'text' ? 9 : undefined,
    textAlign: 'left',
  }
}

type DragRef = {
  id: string
  startClientX: number
  startClientY: number
  origX: number
  origY: number
  w: number
  h: number
}

type DesignerCheckboxOption = {
  field: LabelDesignerField
  kind: 'text' | 'barcode' | 'qrcode'
  label: string
  hint?: string
}

function fieldPreviewLabel(field: LabelDesignerField, kind: 'text' | 'barcode' | 'qrcode'): string {
  if (kind === 'barcode') return '||||'
  if (kind === 'qrcode') return '◼'
  switch (field) {
    case 'oem': return 'OEM'
    case 'price': return '฿'
    case 'name': return 'ชื่อ'
    case 'sku': return 'SKU'
    case 'binLocation': return 'BIN'
    case 'brand': return 'แบรนด์'
    case 'storeName': return 'ร้าน'
    case 'carModel': return 'รถ'
    case 'factory': return 'F#'
    case 'salesUnit': return 'หน่วย'
    case 'priceCipher': return 'รหัส'
    case 'barcode': return 'BC'
    default: return ''
  }
}

function QuickStartPreview({ template }: { template: LabelDesignerTemplate }) {
  const w = 92
  const h = Math.round((w * template.heightMm) / template.widthMm)
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded border border-slate-300 bg-slate-50"
      style={{ width: w, height: h }}
      aria-hidden
    >
      {template.elements.map((el) => {
        const isScan = el.kind === 'barcode' || el.kind === 'qrcode'
        return (
          <div
            key={el.id}
            className={clsx(
              'absolute flex items-center justify-center overflow-hidden rounded-[1px] text-[7px] font-bold leading-none',
              isScan ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-500 ring-1 ring-slate-200',
              el.field === 'price' && !isScan && 'bg-emerald-50 text-emerald-700 ring-emerald-200',
              el.field === 'oem' && !isScan && 'bg-amber-50 text-amber-700 ring-amber-200',
              el.field === 'binLocation' && !isScan && 'bg-violet-50 text-violet-700 ring-violet-200',
            )}
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.w}%`,
              height: `${el.h}%`,
            }}
          >
            {fieldPreviewLabel(el.field, el.kind)}
          </div>
        )
      })}
    </div>
  )
}

const DESIGNER_CHECKBOX_OPTIONS: DesignerCheckboxOption[] = [
  { field: 'barcode', kind: 'barcode', label: 'บาร์โค้ด + รหัสสินค้า (SKU)', hint: 'ข้อมูลจากแฟ้มสินค้า' },
  { field: 'barcode', kind: 'qrcode', label: 'QR code', hint: 'รหัสเดียวกับบาร์โค้ด/SKU' },
  { field: 'storeName', kind: 'text', label: 'ชื่อร้าน', hint: 'จากโปรไฟล์ร้าน (การตั้งค่า)' },
  { field: 'priceCipher', kind: 'text', label: 'รหัสราคา', hint: 'จากแท็บตั้งค่ารหัสราคา' },
  { field: 'price', kind: 'text', label: 'ราคา', hint: 'จากคิวหรือแฟ้มสินค้า (เช่น ฿1,250.00)' },
  { field: 'name', kind: 'text', label: 'ชื่อสินค้า' },
  { field: 'carModel', kind: 'text', label: 'รุ่นรถที่ใช้ได้', hint: 'เช่น CIVIC-1.5-Turbo(2020)' },
  { field: 'oem', kind: 'text', label: 'เบอร์แท้ (OEM)', hint: 'เลือกค่าหน้าสุด' },
  { field: 'factory', kind: 'text', label: 'เบอร์โรงงาน' },
  { field: 'salesUnit', kind: 'text', label: 'หน่วยขาย' },
  { field: 'brand', kind: 'text', label: 'บริษัท / แบรนด์ชิ้นงาน' },
  { field: 'binLocation', kind: 'text', label: 'ที่เก็บ (Bin)', hint: 'จาก «ที่เก็บ» ในแฟ้มสินค้า เช่น A-3-15' },
]

/** ติ๊ก checkbox: มีองค์ประกอบนี้แล้วหรือยัง (กันซ้ำ) */
function elementMatchesCheckboxForAdd(el: LabelDesignerElement, opt: DesignerCheckboxOption): boolean {
  if (opt.kind === 'barcode') {
    return el.kind === 'barcode' && el.field === 'barcode'
  }
  if (opt.kind === 'qrcode') {
    return el.kind === 'qrcode' && el.field === 'barcode'
  }
  return el.field === opt.field && el.kind === 'text'
}

/** ถอด checkbox: ลบทุกองค์ประกอบที่เป็นฟิลด์นี้ (กันค้างจากข้อมูลเก่า kind ไม่ตรง) */
function elementMatchesCheckboxForRemove(el: LabelDesignerElement, opt: DesignerCheckboxOption): boolean {
  if (opt.kind === 'barcode') {
    return el.kind === 'barcode' && el.field === 'barcode'
  }
  if (opt.kind === 'qrcode') {
    return el.kind === 'qrcode' && el.field === 'barcode'
  }
  return el.field === opt.field
}

export function LabelBarcodeDesignerView({ className, previewRow }: LabelBarcodeDesignerViewProps) {
  const sampleRow = previewRow ?? DESIGNER_SAMPLE_ROW
  const [lib, setLib] = useState<LabelDesignerTemplatesState>(() => loadLabelDesignerTemplatesState())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1.6)
  const [quickStartOpen, setQuickStartOpen] = useState(false)
  const [historyPast, setHistoryPast] = useState<LabelDesignerTemplatesState[]>([])
  const [historyFuture, setHistoryFuture] = useState<LabelDesignerTemplatesState[]>([])
  const [snapGuides, setSnapGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] })
  const [storeNamePreview, setStoreNamePreview] = useState(() => loadStoreProfile().storeName)
  const [cipherSettings, setCipherSettings] = useState(() => loadPriceCipherSettings())
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<DragRef | null>(null)
  /** สถานะตอนกด «บันทึก» ล่าสุด (หรือตอนเปิดหน้า) — «ค่าเริ่มต้น» คืนค่านี้ */
  const savedBaselineRef = useRef<LabelDesignerTemplatesState | null>(null)
  const baselineInitializedRef = useRef(false)

  useEffect(() => {
    const sync = () => setStoreNamePreview(loadStoreProfile().storeName)
    window.addEventListener(STORE_PROFILE_CHANGED_EVENT, sync)
    return () => window.removeEventListener(STORE_PROFILE_CHANGED_EVENT, sync)
  }, [])

  useEffect(() => {
    const sync = () => setCipherSettings(loadPriceCipherSettings())
    window.addEventListener(PRICE_CIPHER_SETTINGS_CHANGED_EVENT, sync)
    return () => window.removeEventListener(PRICE_CIPHER_SETTINGS_CHANGED_EVENT, sync)
  }, [])

  const activeEntry = useMemo(() => {
    const t = lib.templates.find((x) => x.id === lib.activeId)
    return t ?? lib.templates[0] ?? null
  }, [lib])

  const libRef = useRef(lib)
  useEffect(() => {
    libRef.current = lib
  }, [lib])

  const HISTORY_MAX = 50
  const pushHistory = useCallback(() => {
    setHistoryPast((past) => {
      const snapshot = structuredClone(libRef.current)
      const next = [...past, snapshot]
      return next.length > HISTORY_MAX ? next.slice(-HISTORY_MAX) : next
    })
    setHistoryFuture([])
  }, [])

  const mergeLib = useCallback((recipe: (prev: LabelDesignerTemplatesState) => LabelDesignerTemplatesState) => {
    pushHistory()
    setLib((prev) => saveLabelDesignerTemplatesState(recipe(prev)))
  }, [pushHistory])

  const undo = useCallback(() => {
    setHistoryPast((past) => {
      if (past.length === 0) return past
      const prev = past[past.length - 1]!
      const newPast = past.slice(0, -1)
      setHistoryFuture((future) => {
        const snapshot = structuredClone(libRef.current)
        const next = [snapshot, ...future]
        return next.length > HISTORY_MAX ? next.slice(0, HISTORY_MAX) : next
      })
      setLib(saveLabelDesignerTemplatesState(prev))
      setSelectedId(null)
      return newPast
    })
  }, [])

  const redo = useCallback(() => {
    setHistoryFuture((future) => {
      if (future.length === 0) return future
      const next = future[0]!
      const newFuture = future.slice(1)
      setHistoryPast((past) => {
        const snapshot = structuredClone(libRef.current)
        const arr = [...past, snapshot]
        return arr.length > HISTORY_MAX ? arr.slice(-HISTORY_MAX) : arr
      })
      setLib(saveLabelDesignerTemplatesState(next))
      setSelectedId(null)
      return newFuture
    })
  }, [])

  useLayoutEffect(() => {
    if (activeEntry === null) {
      setLib((p) => saveLabelDesignerTemplatesState(p))
    }
  }, [activeEntry])

  useLayoutEffect(() => {
    if (activeEntry === null || baselineInitializedRef.current) return
    baselineInitializedRef.current = true
    savedBaselineRef.current = structuredClone(lib)
  }, [activeEntry])

  const template = useMemo(() => {
    if (!activeEntry) return defaultLabelDesignerTemplate()
    return entryToTemplate(activeEntry)
  }, [activeEntry])

  const selected = template.elements.find((e) => e.id === selectedId) ?? null
  const selectedBarcodeBarsH =
    selected?.kind === 'barcode'
      ? barcodeBarsHeightPx(template.heightMm, selected.h)
      : null
  const selectedBarcodeTextDefault =
    selectedBarcodeBarsH != null ? defaultBarcodeTextFontSize(selectedBarcodeBarsH) : 9

  const previewSalesUnits = useMemo(() => {
    const master = findProductMasterForLabelRow(sampleRow)
    if (master) return normalizeSalesUnits(master)
    const t = (sampleRow.salesUnitText ?? '').trim()
    return [{ id: 'fallback', label: t || 'ชิ้น', baseUnits: 1 }]
  }, [sampleRow])

  const persistTemplate = useCallback(
    (nextBody: LabelDesignerTemplate) => {
      mergeLib((prev) => ({
        ...prev,
        templates: prev.templates.map((t) => (t.id === prev.activeId ? { id: t.id, ...nextBody } : t)),
      }))
    },
    [mergeLib],
  )

  const updateElement = useCallback(
    (id: string, patch: Partial<LabelDesignerElement>) => {
      mergeLib((prev) => ({
        ...prev,
        templates: prev.templates.map((t) =>
          t.id !== prev.activeId
            ? t
            : { ...t, elements: t.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) },
        ),
      }))
    },
    [mergeLib],
  )

  const removeElement = useCallback(
    (id: string) => {
      mergeLib((prev) => ({
        ...prev,
        templates: prev.templates.map((t) =>
          t.id !== prev.activeId ? t : { ...t, elements: t.elements.filter((e) => e.id !== id) },
        ),
      }))
      setSelectedId((s) => (s === id ? null : s))
    },
    [mergeLib],
  )

  const duplicateElement = useCallback(
    (id: string) => {
      const newId = newElementId()
      mergeLib((prev) => ({
        ...prev,
        templates: prev.templates.map((t) => {
          if (t.id !== prev.activeId) return t
          const src = t.elements.find((e) => e.id === id)
          if (!src) return t
          const offset = 4
          const dup: LabelDesignerElement = {
            ...src,
            id: newId,
            x: clamp(src.x + offset, 0, 100 - src.w),
            y: clamp(src.y + offset, 0, 100 - src.h),
          }
          return { ...t, elements: [...t.elements, dup] }
        }),
      }))
      queueMicrotask(() => setSelectedId(newId))
    },
    [mergeLib],
  )

  const toggleCheckboxField = useCallback(
    (opt: DesignerCheckboxOption, enabled: boolean) => {
      mergeLib((prev) => {
        const active = prev.templates.find((t) => t.id === prev.activeId)
        if (!active) return prev
        const matched = active.elements.filter((e) => elementMatchesCheckboxForRemove(e, opt))
        if (enabled) {
          if (active.elements.some((e) => elementMatchesCheckboxForAdd(e, opt))) return prev
          const el = createElement(opt.kind, opt.field, active.elements.length)
          queueMicrotask(() => setSelectedId(el.id))
          return {
            ...prev,
            templates: prev.templates.map((t) =>
              t.id === prev.activeId ? { ...t, elements: [...t.elements, el] } : t,
            ),
          }
        }
        if (matched.length === 0) return prev
        const removedIds = new Set(matched.map((m) => m.id))
        setSelectedId((s) => (s && removedIds.has(s) ? null : s))
        return {
          ...prev,
          templates: prev.templates.map((t) =>
            t.id === prev.activeId
              ? { ...t, elements: t.elements.filter((e) => !removedIds.has(e.id)) }
              : t,
          ),
        }
      })
    },
    [mergeLib],
  )

  const revertToSavedBaseline = () => {
    const baseline = savedBaselineRef.current
    if (!baseline) return
    if (!window.confirm('คืนค่าตามที่กดบันทึกล่าสุด? การแก้หลังบันทึกจะหาย')) return
    pushHistory()
    const clone = structuredClone(baseline)
    setLib(clone)
    saveLabelDesignerTemplatesState(clone)
    setSelectedId(null)
  }

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const dx = ((e.clientX - d.startClientX) / rect.width) * 100
      const dy = ((e.clientY - d.startClientY) / rect.height) * 100
      let nx = clamp(d.origX + dx, 0, 100 - d.w)
      let ny = clamp(d.origY + dy, 0, 100 - d.h)

      const guides: { x: number[]; y: number[] } = { x: [], y: [] }
      const altKey = e.altKey // hold Alt = free move (no snap)
      const tpl = libRef.current.templates.find((t) => t.id === libRef.current.activeId)

      if (!altKey && tpl) {
        // 1) Snap to 1mm grid
        const stepX = 100 / tpl.widthMm
        const stepY = 100 / tpl.heightMm
        nx = Math.round(nx / stepX) * stepX
        ny = Math.round(ny / stepY) * stepY

        // 2) Smart guides — snap to other elements' edges/centers + canvas edges/center
        const others = tpl.elements.filter((el) => el.id !== d.id)
        const xTargets = [0, 50, 100, ...others.flatMap((el) => [el.x, el.x + el.w, el.x + el.w / 2])]
        const yTargets = [0, 50, 100, ...others.flatMap((el) => [el.y, el.y + el.h, el.y + el.h / 2])]
        const SNAP_THRESH = 1.5 // % of canvas

        // X: try left edge / right edge / center of dragged element
        const xCands = [
          { offset: 0, edge: nx },
          { offset: d.w, edge: nx + d.w },
          { offset: d.w / 2, edge: nx + d.w / 2 },
        ]
        let bestX: { delta: number; snapNx: number; guide: number } | null = null
        for (const c of xCands) {
          for (const t of xTargets) {
            const delta = Math.abs(c.edge - t)
            if (delta < SNAP_THRESH && (!bestX || delta < bestX.delta)) {
              bestX = { delta, snapNx: t - c.offset, guide: t }
            }
          }
        }
        if (bestX) {
          nx = clamp(bestX.snapNx, 0, 100 - d.w)
          guides.x.push(bestX.guide)
        }

        // Y: same approach
        const yCands = [
          { offset: 0, edge: ny },
          { offset: d.h, edge: ny + d.h },
          { offset: d.h / 2, edge: ny + d.h / 2 },
        ]
        let bestY: { delta: number; snapNy: number; guide: number } | null = null
        for (const c of yCands) {
          for (const t of yTargets) {
            const delta = Math.abs(c.edge - t)
            if (delta < SNAP_THRESH && (!bestY || delta < bestY.delta)) {
              bestY = { delta, snapNy: t - c.offset, guide: t }
            }
          }
        }
        if (bestY) {
          ny = clamp(bestY.snapNy, 0, 100 - d.h)
          guides.y.push(bestY.guide)
        }
      }

      setSnapGuides(guides)
      setLib((prev) => ({
        ...prev,
        templates: prev.templates.map((t) =>
          t.id !== prev.activeId
            ? t
            : {
                ...t,
                elements: t.elements.map((el) => (el.id === d.id ? { ...el, x: nx, y: ny } : el)),
              },
        ),
      }))
    }
    const up = () => {
      if (!dragRef.current) return
      dragRef.current = null
      setSnapGuides({ x: [], y: [] })
      setLib((prev) => saveLabelDesignerTemplatesState(prev))
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [])

  // Keyboard shortcuts: Ctrl+Z/Y, Delete, Ctrl+D, Esc, Arrow keys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable
      if (isTyping) return

      const mod = e.ctrlKey || e.metaKey

      // Undo / Redo
      if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        undo()
        return
      }
      if (mod && ((e.shiftKey && (e.key === 'z' || e.key === 'Z')) || e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        redo()
        return
      }

      if (selectedId) {
        // Delete element
        if (!mod && (e.key === 'Delete' || e.key === 'Backspace')) {
          e.preventDefault()
          removeElement(selectedId)
          return
        }
        // Duplicate (Ctrl+D)
        if (mod && (e.key === 'd' || e.key === 'D')) {
          e.preventDefault()
          duplicateElement(selectedId)
          return
        }
        // Arrow nudge
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault()
          const tpl = libRef.current.templates.find((t) => t.id === libRef.current.activeId)
          const el = tpl?.elements.find((x) => x.id === selectedId)
          if (!el || !tpl) return
          const stepMm = e.shiftKey ? 5 : 1
          const stepXPct = (stepMm / tpl.widthMm) * 100
          const stepYPct = (stepMm / tpl.heightMm) * 100
          let nx = el.x
          let ny = el.y
          if (e.key === 'ArrowLeft') nx = clamp(el.x - stepXPct, 0, 100 - el.w)
          if (e.key === 'ArrowRight') nx = clamp(el.x + stepXPct, 0, 100 - el.w)
          if (e.key === 'ArrowUp') ny = clamp(el.y - stepYPct, 0, 100 - el.h)
          if (e.key === 'ArrowDown') ny = clamp(el.y + stepYPct, 0, 100 - el.h)
          updateElement(selectedId, { x: nx, y: ny })
          return
        }
      }

      // Esc — deselect
      if (e.key === 'Escape') {
        if (selectedId) {
          e.preventDefault()
          setSelectedId(null)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedId, undo, redo, removeElement, duplicateElement, updateElement])

  const onPointerDownElement = (e: React.PointerEvent, el: LabelDesignerElement) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    setSelectedId(el.id)
    pushHistory()
    dragRef.current = {
      id: el.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: el.x,
      origY: el.y,
      w: el.w,
      h: el.h,
    }
  }

  const addNewTemplate = () => {
    const id = newLabelDesignerTemplateEntryId()
    const base = defaultLabelDesignerTemplate()
    mergeLib((prev) => ({
      activeId: id,
      templates: [{ id, ...base, name: `ป้ายใหม่ ${prev.templates.length + 1}` }, ...prev.templates],
    }))
    setSelectedId(null)
  }

  const addQuickStartTemplate = (qs: QuickStartTemplate) => {
    const id = newLabelDesignerTemplateEntryId()
    const base = qs.build()
    mergeLib((prev) => ({
      activeId: id,
      templates: [{ id, ...base }, ...prev.templates],
    }))
    setSelectedId(null)
    setQuickStartOpen(false)
  }

  const duplicateActiveTemplate = () => {
    if (!activeEntry) return
    const id = newLabelDesignerTemplateEntryId()
    const copy = entryToTemplate(activeEntry)
    mergeLib((prev) => ({
      activeId: id,
      templates: [
        {
          id,
          ...copy,
          name: `${copy.name} (สำเนา)`,
        },
        ...prev.templates,
      ],
    }))
    setSelectedId(null)
  }

  const deleteActiveTemplate = () => {
    if (!activeEntry) return
    if (lib.templates.length <= 1) {
      window.alert('ต้องมีอย่างน้อยหนึ่งแม่แบบป้าย')
      return
    }
    if (!window.confirm(`ลบแม่แบบ «${activeEntry.name}»?`)) return
    mergeLib((prev) => {
      const idx = prev.templates.findIndex((t) => t.id === prev.activeId)
      if (idx < 0) return prev
      const next = prev.templates.filter((t) => t.id !== prev.activeId)
      if (next.length === 0) return prev
      const newIdx = Math.min(idx, next.length - 1)
      const pick = next[newIdx]!
      return { activeId: pick.id, templates: next }
    })
    setSelectedId(null)
  }

  const switchTemplate = (id: string) => {
    setSelectedId(null)
    mergeLib((prev) => ({ ...prev, activeId: id }))
  }

  return (
    <div className={clsx('flex min-h-0 flex-1 flex-col gap-3 overflow-hidden', className)}>
      <div className="flex shrink-0 flex-col gap-2 rounded-2xl border border-violet-200/80 bg-gradient-to-r from-violet-50/90 to-white px-3 py-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-800">ออกแบบป้ายบาร์โค้ด (ลากวาง)</p>
            <p className="text-[11px] text-slate-600">
              ตั้งชื่อ · กด <strong className="font-medium text-slate-700">บันทึก</strong> เพื่อจุดอ้างอิง —{' '}
              <strong className="font-medium text-slate-700">ค่าเริ่มต้น</strong> คืนตามที่บันทึกล่าสุด — ใช้ตอนสั่งพิมพ์
              · ตัวอย่างจากรายการแรกในคิว (คิวว่างใช้ข้อมูลตัวอย่าง)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-700">
              ซูม
              <input
                type="range"
                min={1}
                max={2.6}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-24"
              />
              <span className="tabular-nums">{zoom.toFixed(1)}×</span>
            </label>
            <button
              type="button"
              onClick={undo}
              disabled={historyPast.length === 0}
              title="ย้อนกลับ (Ctrl+Z)"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Undo2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={historyFuture.length === 0}
              title="ทำซ้ำ (Ctrl+Y / Ctrl+Shift+Z)"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Redo2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setLib((prev) => {
                  const saved = saveLabelDesignerTemplatesState(prev)
                  savedBaselineRef.current = structuredClone(saved)
                  return saved
                })
                window.alert('บันทึกแม่แบบแล้ว')
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
            >
              <Save className="size-3.5" />
              บันทึก
            </button>
            <button
              type="button"
              onClick={revertToSavedBaseline}
              title="คืนทุกแม่แบบตามจุดที่กดบันทึกล่าสุด"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="size-3.5" />
              ค่าเริ่มต้น
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2 border-t border-violet-100/80 pt-2">
          <label className="min-w-[10rem] flex-1">
            <span className="mb-0.5 block text-[10px] font-medium text-slate-600">แม่แบบที่กำลังแก้</span>
            <select
              value={lib.activeId}
              onChange={(e) => switchTemplate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-900"
            >
              {lib.templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || 'ไม่มีชื่อ'} ({t.widthMm}×{t.heightMm} มม.)
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[12rem] flex-[2]">
            <span className="mb-0.5 block text-[10px] font-medium text-slate-600">ชื่อป้าย (แสดงตอนสั่งพิมพ์)</span>
            <input
              type="text"
              value={activeEntry?.name ?? ''}
              onChange={(e) =>
                mergeLib((prev) => ({
                  ...prev,
                  templates: prev.templates.map((t) =>
                    t.id === prev.activeId ? { ...t, name: e.target.value } : t,
                  ),
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-slate-900"
              placeholder="ตั้งชื่อให้จำง่าย"
            />
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setQuickStartOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
              title="เริ่มจากแม่แบบสำเร็จรูป — ลากวางมาให้แล้ว"
            >
              <Sparkles className="size-3.5" />
              เริ่มจากแม่แบบ
            </button>
            {quickStartOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setQuickStartOpen(false)}
                  aria-hidden
                />
                <div className="absolute left-0 top-full z-40 mt-1 w-[28rem] rounded-xl border border-slate-200 bg-white p-3 shadow-2xl">
                  <div className="mb-2 flex items-center gap-1.5 px-1">
                    <Sparkles className="size-3.5 text-amber-500" />
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                      เริ่มจากแม่แบบสำเร็จรูป
                    </p>
                    <span className="ml-auto text-[10px] text-slate-400">เลือกแล้วปรับแต่งต่อได้</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_START_TEMPLATES.map((qs) => {
                      const previewTpl = qs.build()
                      return (
                        <button
                          key={qs.id}
                          type="button"
                          onClick={() => addQuickStartTemplate(qs)}
                          className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-left transition hover:border-amber-300 hover:bg-amber-50/40 hover:shadow-sm"
                        >
                          <QuickStartPreview template={previewTpl} />
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="flex items-center gap-1">
                              <span className="text-sm leading-none">{qs.emoji}</span>
                              <span className="truncate text-[11px] font-bold text-slate-800">{qs.name}</span>
                            </span>
                            <span className="text-[9.5px] leading-tight text-slate-500">{qs.description}</span>
                            <span className="mt-0.5 text-[9px] font-mono text-slate-400">
                              {previewTpl.widthMm}×{previewTpl.heightMm}mm
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={addNewTemplate}
            className="inline-flex items-center gap-1 rounded-lg border border-violet-300 bg-violet-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-violet-700"
          >
            <Plus className="size-3.5" />
            เพิ่มป้ายใหม่
          </button>
          <button
            type="button"
            onClick={duplicateActiveTemplate}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
            title="สำเนาแม่แบบปัจจุบัน"
          >
            <CopyPlus className="size-3.5" />
            สำเนา
          </button>
          <button
            type="button"
            onClick={deleteActiveTemplate}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] text-red-800 hover:bg-red-50"
          >
            <Trash2 className="size-3.5" />
            ลบแม่แบบ
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,14rem)_1fr_minmax(0,13rem)]">
        <aside className="flex min-h-0 flex-col gap-2 overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <p className="text-[11px] font-semibold text-slate-700">องค์ประกอบบนป้าย (checkbox)</p>
          <div className="flex flex-col gap-1.5">
            {DESIGNER_CHECKBOX_OPTIONS.map((opt) => {
              const checked = template.elements.some((e) => elementMatchesCheckboxForRemove(e, opt))
              return (
                <label
                  key={`${opt.kind}-${opt.field}`}
                  className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 hover:border-violet-300 hover:bg-violet-50/80"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggleCheckboxField(opt, e.target.checked)}
                    className="mt-0.5 size-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="min-w-0">
                    <span className="block text-[11px] font-medium text-slate-800">{opt.label}</span>
                    {opt.hint ? <span className="block text-[9px] leading-tight text-slate-500">{opt.hint}</span> : null}
                  </span>
                </label>
              )
            })}
          </div>
          <p className="flex items-start gap-1.5 rounded-lg border border-violet-100 bg-violet-50/80 px-2 py-1.5 text-[9px] leading-snug text-violet-900">
            <Store className="mt-0.5 size-3 shrink-0" aria-hidden />
            <span>
              ชื่อร้านปัจจุบัน: <strong className="font-semibold">{storeNamePreview || '—'}</strong>
            </span>
          </p>
          <p className="mt-1 text-[9px] leading-snug text-slate-500">
            ติ๊กเพิ่ม / ถอดติ๊กลบองค์ประกอบฟิลด์นั้นบนป้าย (ถอดติ๊กลบได้แม้ข้อมูลเก่า kind ไม่ตรง)
          </p>
        </aside>

        <div className="min-h-0 overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-slate-100/90 p-4 pt-7">
          <div className="flex justify-center">
            <div
              className="origin-top"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
              }}
            >
              <div
                ref={canvasRef}
                role="application"
                aria-label="พื้นที่ออกแบบป้าย"
                className="relative bg-white"
                style={{ width: `${template.widthMm}mm`, height: `${template.heightMm}mm` }}
                onPointerDown={(e) => {
                  if (e.target === e.currentTarget) setSelectedId(null)
                }}
              >
                <LabelDesignerStickerBody
                  template={template}
                  row={sampleRow}
                  storeName={storeNamePreview}
                  priceCipher={cipherSettings}
                  selectedId={selectedId}
                  interactive
                  onPointerDownElement={onPointerDownElement}
                />
                {/* Alignment snap guides — visible only during drag */}
                {snapGuides.x.map((g, i) => (
                  <div
                    key={`gx-${i}`}
                    className="pointer-events-none absolute top-0 bottom-0 w-px bg-pink-500/80"
                    style={{ left: `${g}%` }}
                    aria-hidden
                  />
                ))}
                {snapGuides.y.map((g, i) => (
                  <div
                    key={`gy-${i}`}
                    className="pointer-events-none absolute left-0 right-0 h-px bg-pink-500/80"
                    style={{ top: `${g}%` }}
                    aria-hidden
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="mx-auto mt-3 max-w-xl text-center text-[10px] text-slate-500">
            ขนาดกรอบ {template.widthMm}×{template.heightMm} มม. — ลากที่กรอบองค์ประกอบเพื่อจัดตำแหน่ง
            <span className="ml-2 text-slate-400">· กด Alt ค้างขณะลาก = ลากอิสระ (ไม่ snap)</span>
          </p>
        </div>

        <aside className="flex min-h-0 flex-col gap-2 overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-semibold text-slate-700">คุณสมบัติ</p>
          {selected ? (
            <div className="space-y-2 text-[11px]">
              <p className="text-slate-600">
                {selected.kind === 'barcode'
                  ? 'บาร์โค้ด'
                  : selected.kind === 'qrcode'
                    ? 'QR code'
                    : 'ข้อความ'}{' '}
                · {fieldLabelTh(selected.field)}
              </p>
              <label className="block">
                <span className="text-slate-600">กว้าง %</span>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={Math.round(selected.w)}
                  onChange={(e) =>
                    updateElement(selected.id, {
                      w: clamp(Number(e.target.value) || 10, 10, 100 - selected.x),
                    })
                  }
                  className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1"
                />
              </label>
              <label className="block">
                <span className="text-slate-600">สูง %</span>
                <input
                  type="number"
                  min={6}
                  max={100}
                  value={Math.round(selected.h)}
                  onChange={(e) =>
                    updateElement(selected.id, {
                      h: clamp(Number(e.target.value) || 6, 6, 100 - selected.y),
                    })
                  }
                  className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1"
                />
              </label>
              {selected.field === 'salesUnit' && selected.kind === 'text' ? (
                <label className="block">
                  <span className="text-slate-600">หน่วยขายที่แสดง</span>
                  <select
                    value={Math.min(
                      selected.salesUnitIndex ?? 0,
                      Math.max(0, previewSalesUnits.length - 1),
                    )}
                    onChange={(e) =>
                      updateElement(selected.id, {
                        salesUnitIndex: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1"
                  >
                    {previewSalesUnits.map((u, i) => (
                      <option key={`${u.id}-${i}`} value={i}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[9px] leading-snug text-slate-500">
                    รายการหน่วยตามสินค้าตัวอย่างบนป้าย (คิวพิมพ์รายการแรก)
                  </p>
                </label>
              ) : null}
              {selected.kind === 'barcode' ? (
                <label className="block">
                  <span className="text-slate-600">ขนาดตัวเลขใต้แท่งบาร์โค้ด</span>
                  <input
                    type="number"
                    min={5}
                    max={18}
                    value={selected.fontSize ?? selectedBarcodeTextDefault}
                    onChange={(e) =>
                      updateElement(selected.id, {
                        fontSize: clamp(Number(e.target.value) || selectedBarcodeTextDefault, 5, 18),
                      })
                    }
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1"
                  />
                </label>
              ) : null}
              {selected.kind === 'text' ? (
                <>
                  <label className="block">
                    <span className="text-slate-600">ขนาดตัวอักษร</span>
                    <input
                      type="number"
                      min={6}
                      max={18}
                      value={selected.fontSize ?? 9}
                      onChange={(e) =>
                        updateElement(selected.id, { fontSize: clamp(Number(e.target.value) || 9, 6, 18) })
                      }
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-600">ความหนา</span>
                    <select
                      value={selected.fontWeight ?? 'normal'}
                      onChange={(e) =>
                        updateElement(selected.id, {
                          fontWeight: e.target.value as 'normal' | 'semibold' | 'bold',
                        })
                      }
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1"
                    >
                      <option value="normal">ปกติ</option>
                      <option value="semibold">กลาง</option>
                      <option value="bold">หนา</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-slate-600">รูปแบบ</span>
                    <select
                      value={selected.textVariant ?? 'plain'}
                      onChange={(e) =>
                        updateElement(selected.id, {
                          textVariant: e.target.value === 'badge' ? 'badge' : undefined,
                        })
                      }
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1"
                    >
                      <option value="plain">ข้อความ</option>
                      <option value="badge">แท็กกรอบ (ชื่อร้าน)</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-slate-600">จัดบรรทัด</span>
                    <select
                      value={selected.textAlign ?? 'left'}
                      onChange={(e) =>
                        updateElement(selected.id, {
                          textAlign: e.target.value as 'left' | 'center' | 'right',
                        })
                      }
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1"
                    >
                      <option value="left">ซ้าย</option>
                      <option value="center">กลาง</option>
                      <option value="right">ขวา</option>
                    </select>
                  </label>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => removeElement(selected.id)}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 py-1.5 text-red-800 hover:bg-red-100"
              >
                <Trash2 className="size-3.5" />
                ลบองค์ประกอบ
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">คลิกที่กรอบบนป้ายเพื่อแก้ขนาดหรือลบ</p>
          )}

          <div className="mt-auto border-t border-slate-100 pt-2">
            <p className="mb-1 text-[10px] font-medium text-slate-600">ขนาดป้าย (มม.)</p>
            <p className="mb-1.5 text-[9px] leading-snug text-slate-500">
              ชื่อเรียก 2×1 / 2×2 / 2×4 = ขนาดช่องต่อดวงที่พิมพ์ โดย 2×2 และ 2×4 แบ่งครึ่งจากฐาน 50×35
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LABEL_DESIGNER_DENSITY_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title={p.shortHint}
                  onClick={() => persistTemplate({ ...template, widthMm: p.widthMm, heightMm: p.heightMm })}
                  className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-[9px] font-semibold text-violet-900 hover:bg-violet-100"
                >
                  {p.label}{' '}
                  <span className="font-normal text-violet-800/90">
                    ({p.widthMm}×{p.heightMm})
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <label className="flex-1 text-[10px]">
                กว้าง
                <input
                  type="number"
                  min={12}
                  max={200}
                  step={0.5}
                  value={template.widthMm}
                  onChange={(e) =>
                    persistTemplate({
                      ...template,
                      widthMm: clamp(Number(e.target.value) || 50, 12, 200),
                    })
                  }
                  className="mt-0.5 w-full rounded border border-slate-200 px-1.5 py-1"
                />
              </label>
              <label className="flex-1 text-[10px]">
                สูง
                <input
                  type="number"
                  min={10}
                  max={200}
                  step={0.5}
                  value={template.heightMm}
                  onChange={(e) =>
                    persistTemplate({
                      ...template,
                      heightMm: clamp(Number(e.target.value) || 35, 10, 200),
                    })
                  }
                  className="mt-0.5 w-full rounded border border-slate-200 px-1.5 py-1"
                />
              </label>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
