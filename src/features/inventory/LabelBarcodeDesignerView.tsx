import { clsx } from 'clsx'
import { LabelDesignerStickerBody } from '@/features/inventory/components/LabelDesignerStickerBody'
import type { LabelDesignerElement, LabelDesignerField, LabelDesignerTemplate } from '@/features/inventory/data/labelDesignerTemplateStore'
import {
  defaultLabelDesignerTemplate,
  loadLabelDesignerTemplatesState,
  newLabelDesignerTemplateEntryId,
  saveLabelDesignerTemplatesState,
  entryToTemplate,
  type LabelDesignerTemplatesState,
} from '@/features/inventory/data/labelDesignerTemplateStore'
import {
  barcodeBarsHeightPx,
  clamp,
  defaultBarcodeTextFontSize,
} from '@/features/inventory/data/labelDesignerCanvasUtils'
import { LABEL_DESIGNER_DENSITY_PRESETS } from '@/features/inventory/data/labelDesignerDensityPresets'
import {
  computeAutoSheetCols,
  DESIGNER_PRINT_SHEET_ROWS_DEFAULT,
  LABEL_PRINT_SHEET_WIDTH_MM,
  labelPrintPageBoxMm,
} from '@/features/inventory/data/labelDesignerPrintMedia'
import {
  buildComposite2x4LabelPages,
  buildLabelPages,
  type EnrichedLabelRow,
} from '@/features/inventory/labelPrintLayout'
import { isComposite2x4StickerTemplate } from '@/features/inventory/data/labelDesignerDensityPresets'
import {
  LabelDesignerPrintPage,
  type LabelDesignerPrintLayoutMode,
} from '@/features/inventory/components/LabelDesignerPrintPage'
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
import type { PriceCipherSettings } from '@/features/inventory/data/priceCipherCodec'
import { loadStoreProfile, STORE_PROFILE_CHANGED_EVENT } from '@/features/settings/data/storeProfileStore'
import { QUICK_START_TEMPLATES, type QuickStartTemplate } from '@/features/inventory/data/labelDesignerQuickStarts'
import {
  commitRealSizeMeasurement,
  detectCurrentPresetId,
  isRealSizeCalibrated,
  realSizeZoomFactor,
} from '@/features/inventory/data/labelDesignerRealSizeCalibration'
import { WINDOW_PRESETS } from '@/features/desktop/windowControls'
import { CopyPlus, Grid3x3, GripVertical, Plus, Printer, Redo2, RotateCcw, Save, Sparkles, Store, Trash2, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type LabelBarcodeDesignerViewProps = {
  className?: string
  previewRow?: EnrichedLabelRow
  previewRowOptions?: EnrichedLabelRow[]
}

/**
 * Number input that defers clamping until blur/Enter so users can type
 * intermediate values like "3" on the way to "35" without snapping to min.
 */
function MmNumberInput({
  value,
  min,
  max,
  step,
  fallback,
  onCommit,
  className,
}: {
  value: number
  min: number
  max: number
  step: number
  fallback: number
  onCommit: (next: number) => void
  className?: string
}) {
  const [draft, setDraft] = useState<string>(String(value))
  const focusedRef = useRef(false)
  useEffect(() => {
    if (!focusedRef.current) setDraft(String(value))
  }, [value])
  const commit = () => {
    const parsed = Number(draft)
    const next = clamp(Number.isFinite(parsed) && draft.trim() !== '' ? parsed : fallback, min, max)
    setDraft(String(next))
    if (next !== value) onCommit(next)
  }
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={draft}
      onFocus={() => {
        focusedRef.current = true
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        focusedRef.current = false
        commit()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }}
      className={className}
    />
  )
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
    case 'binLocationsAll': return 'BIN×'
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
              (el.field === 'binLocation' || el.field === 'binLocationsAll') && !isScan && 'bg-violet-50 text-violet-700 ring-violet-200',
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

type DesignerCheckboxGroup = {
  title: string
  options: DesignerCheckboxOption[]
}

const DESIGNER_CHECKBOX_GROUPS: DesignerCheckboxGroup[] = [
  {
    title: 'สแกน',
    options: [
      { field: 'barcode', kind: 'barcode', label: 'บาร์โค้ด + รหัสสินค้า (SKU)', hint: 'ข้อมูลจากแฟ้มสินค้า' },
      { field: 'barcode', kind: 'qrcode', label: 'QR code', hint: 'รหัสเดียวกับบาร์โค้ด/SKU' },
    ],
  },
  {
    title: 'สินค้า',
    options: [
      { field: 'name', kind: 'text', label: 'ชื่อสินค้า' },
      { field: 'sku', kind: 'text', label: 'รหัส SKU' },
      { field: 'brand', kind: 'text', label: 'บริษัท / แบรนด์ชิ้นงาน' },
      { field: 'salesUnit', kind: 'text', label: 'หน่วยขาย' },
    ],
  },
  {
    title: 'ราคา',
    options: [
      { field: 'price', kind: 'text', label: 'ราคา', hint: 'จากคิวหรือแฟ้มสินค้า (เช่น ฿1,250.00)' },
      { field: 'priceCipher', kind: 'text', label: 'รหัสราคา', hint: 'จากแท็บตั้งค่ารหัสราคา' },
    ],
  },
  {
    title: 'ระบุตัว',
    options: [
      { field: 'oem', kind: 'text', label: 'เบอร์แท้ (OEM)', hint: 'เลือกค่าหน้าสุด' },
      { field: 'factory', kind: 'text', label: 'เบอร์โรงงาน' },
      { field: 'carModel', kind: 'text', label: 'รุ่นรถที่ใช้ได้', hint: 'เช่น CIVIC-1.5-Turbo(2020)' },
    ],
  },
  {
    title: 'สถานที่',
    options: [
      { field: 'binLocation', kind: 'text', label: 'ที่เก็บ (Bin) — หลัก', hint: 'ที่หลักของสินค้านี้ เช่น A-3-15' },
      { field: 'binLocationsAll', kind: 'text', label: 'ที่เก็บทั้งหมด', hint: 'ทุกที่ที่วางสินค้านี้ คั่นด้วย ,' },
      { field: 'storeName', kind: 'text', label: 'ชื่อร้าน', hint: 'จากโปรไฟล์ร้าน (การตั้งค่า)' },
    ],
  },
]

const DESIGNER_CHECKBOX_OPTIONS: DesignerCheckboxOption[] = DESIGNER_CHECKBOX_GROUPS.flatMap(
  (g) => g.options,
)

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

export function LabelBarcodeDesignerView({
  className,
  previewRow,
  previewRowOptions,
}: LabelBarcodeDesignerViewProps) {
  const [previewRowId, setPreviewRowId] = useState<string | null>(null)
  const rawSample = useMemo(() => {
    if (previewRowId === '__sample__') return DESIGNER_SAMPLE_ROW
    if (previewRowId && previewRowOptions) {
      const picked = previewRowOptions.find((r) => r.id === previewRowId)
      if (picked) return picked
    }
    return previewRow ?? DESIGNER_SAMPLE_ROW
  }, [previewRow, previewRowOptions, previewRowId])
  // ถ้าข้อมูลจริงในคิวยังไม่มี location → แทรก demo ให้ designer โชว์ field ได้ชัด
  const sampleRow: typeof rawSample = (() => {
    const hasLocs =
      (rawSample.storageLocations && rawSample.storageLocations.length > 0) ||
      Boolean(rawSample.storageLocation)
    if (hasLocs) return rawSample
    return {
      ...rawSample,
      storageLocation: DESIGNER_SAMPLE_ROW.storageLocation,
      storageLocations: DESIGNER_SAMPLE_ROW.storageLocations,
    }
  })()
  const [lib, setLib] = useState<LabelDesignerTemplatesState>(() => loadLabelDesignerTemplatesState())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [marquee, setMarquee] = useState<{
    startXPct: number
    startYPct: number
    curXPct: number
    curYPct: number
  } | null>(null)
  const marqueeRef = useRef<typeof marquee>(null)
  marqueeRef.current = marquee

  /** sync: ทุกครั้งที่ selectedId เปลี่ยน เป็น single → reset selectedIds */
  const selectSingle = useCallback((id: string | null) => {
    setSelectedId(id)
    setSelectedIds(id ? new Set([id]) : new Set())
  }, [])

  /** Shift+click — เพิ่ม/ถอด element จาก multi-selection */
  const toggleInSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        // ถ้า primary หายไปจาก set → ตั้ง primary เป็นอันใดก็ได้ที่เหลือ (หรือ null)
        setSelectedId((cur) => (cur === id ? (next.size > 0 ? Array.from(next)[0]! : null) : cur))
      } else {
        next.add(id)
        setSelectedId(id)
      }
      return next
    })
  }, [])
  const [zoom, setZoom] = useState(1.6)
  const [showGrid, setShowGrid] = useState(true)
  const [showRuler, setShowRuler] = useState(true)
  const [showMultiUp, setShowMultiUp] = useState(false)
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false)
  const [dragLayerId, setDragLayerId] = useState<string | null>(null)
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null)
  const [quickStartOpen, setQuickStartOpen] = useState(false)
  const [historyPast, setHistoryPast] = useState<LabelDesignerTemplatesState[]>([])
  const [historyFuture, setHistoryFuture] = useState<LabelDesignerTemplatesState[]>([])
  const [snapGuides, setSnapGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] })
  const [storeNamePreview, setStoreNamePreview] = useState(() => loadStoreProfile().storeName)
  const [cipherSettings, setCipherSettings] = useState(() => loadPriceCipherSettings())
  type DesignerPrintJob = {
    pages: (EnrichedLabelRow | null)[][]
    template: LabelDesignerTemplate
    sheetCols: number
    sheetRows: number
    printLayout: LabelDesignerPrintLayoutMode
    storeName: string
    priceCipher: PriceCipherSettings
  }
  const [printJob, setPrintJob] = useState<DesignerPrintJob | null>(null)
  const [calibrationOpen, setCalibrationOpen] = useState(false)
  const [calibrated, setCalibrated] = useState<boolean>(() => isRealSizeCalibrated())
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

  useEffect(() => {
    if (!printJob) return
    const { widthMm, heightMm } = labelPrintPageBoxMm({
      printLayout: printJob.printLayout,
      templateWidthMm: printJob.template.widthMm,
      templateHeightMm: printJob.template.heightMm,
      sheetCols: printJob.sheetCols,
      sheetRows: printJob.sheetRows,
    })
    const pageOrient = widthMm >= heightMm ? 'landscape' : 'portrait'
    const style = document.createElement('style')
    style.setAttribute('data-bento-label-print-page', '1')
    style.textContent = `@media print {
      @page { margin: 0; size: ${widthMm}mm ${heightMm}mm ${pageOrient}; }
      html:has(#label-print-surface),
      html:has(#label-print-surface) body {
        width: ${widthMm}mm !important;
        max-width: ${widthMm}mm !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
    }`
    document.head.appendChild(style)
    const onAfter = () => {
      style.remove()
      setPrintJob(null)
      window.removeEventListener('afterprint', onAfter)
    }
    window.addEventListener('afterprint', onAfter)
    const id = window.requestAnimationFrame(() => window.print())
    return () => {
      window.cancelAnimationFrame(id)
      window.removeEventListener('afterprint', onAfter)
      style.remove()
    }
  }, [printJob])

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

  type Warning = { level: 'warn' | 'info'; message: string; elementId?: string }
  const validationWarnings: Warning[] = useMemo(() => {
    const out: Warning[] = []
    if (template.elements.length === 0) {
      out.push({ level: 'warn', message: 'ป้ายว่าง — เพิ่มอย่างน้อย 1 element' })
      return out
    }
    const hasBarcode = template.elements.some((el) => el.kind === 'barcode' || el.kind === 'qrcode')
    if (!hasBarcode) {
      out.push({ level: 'info', message: 'ไม่มีบาร์โค้ด/QR — สแกนไม่ได้' })
    }
    for (const el of template.elements) {
      const wMm = (el.w / 100) * template.widthMm
      const hMm = (el.h / 100) * template.heightMm
      const fieldName = fieldLabelTh(el.field)
      // out of bounds
      if (el.x + el.w > 100.5 || el.y + el.h > 100.5 || el.x < -0.5 || el.y < -0.5) {
        out.push({ level: 'warn', message: `${fieldName} หลุดขอบป้าย`, elementId: el.id })
      }
      // tiny barcode
      if (el.kind === 'barcode' && hMm < 8) {
        out.push({
          level: 'warn',
          message: `บาร์โค้ดสูง ${hMm.toFixed(1)}mm — อาจสแกนไม่ติด (ขั้นต่ำ 8mm)`,
          elementId: el.id,
        })
      }
      if (el.kind === 'qrcode' && Math.min(wMm, hMm) < 6) {
        out.push({
          level: 'warn',
          message: `QR เล็กกว่า 6mm — อาจสแกนไม่ติด`,
          elementId: el.id,
        })
      }
      // tiny font
      if (el.kind === 'text' && (el.fontSize ?? 9) < 5) {
        out.push({
          level: 'warn',
          message: `${fieldName} font ${el.fontSize}px เล็กเกินไป (อ่านยาก)`,
          elementId: el.id,
        })
      }
    }
    // overlap detection — pairs that overlap by >50% area
    const els = template.elements
    for (let i = 0; i < els.length; i++) {
      for (let j = i + 1; j < els.length; j++) {
        const a = els[i]!, b = els[j]!
        const ix0 = Math.max(a.x, b.x)
        const ix1 = Math.min(a.x + a.w, b.x + b.w)
        const iy0 = Math.max(a.y, b.y)
        const iy1 = Math.min(a.y + a.h, b.y + b.h)
        if (ix1 > ix0 && iy1 > iy0) {
          const overlap = (ix1 - ix0) * (iy1 - iy0)
          const minArea = Math.min(a.w * a.h, b.w * b.h)
          if (overlap / minArea > 0.5) {
            out.push({
              level: 'info',
              message: `${fieldLabelTh(a.field)} กับ ${fieldLabelTh(b.field)} ทับกัน`,
            })
          }
        }
      }
    }
    return out
  }, [template])

  const warnCount = validationWarnings.filter((w) => w.level === 'warn').length
  const infoCount = validationWarnings.filter((w) => w.level === 'info').length
  const [validationOpen, setValidationOpen] = useState(false)

  const persistTemplate = useCallback(
    (nextBody: LabelDesignerTemplate) => {
      mergeLib((prev) => ({
        ...prev,
        templates: prev.templates.map((t) => (t.id === prev.activeId ? { id: t.id, ...nextBody } : t)),
      }))
    },
    [mergeLib],
  )

  const handleTestPrint = useCallback(() => {
    if (template.elements.length === 0) {
      window.alert('ป้ายว่าง — เพิ่ม element อย่างน้อย 1 ก่อนทดสอบพิมพ์')
      return
    }
    const sheetRows = DESIGNER_PRINT_SHEET_ROWS_DEFAULT
    if (isComposite2x4StickerTemplate(template)) {
      const sheetCols = computeAutoSheetCols(50)
      const physicalPerPage = sheetCols * sheetRows
      const pages = buildComposite2x4LabelPages([sampleRow], physicalPerPage)
      setPrintJob({
        pages,
        template,
        sheetCols,
        sheetRows,
        printLayout: 'composite2x4',
        storeName: loadStoreProfile().storeName,
        priceCipher: loadPriceCipherSettings(),
      })
      return
    }
    const sheetCols = computeAutoSheetCols(template.widthMm)
    const per = sheetCols * sheetRows
    const pages = buildLabelPages([sampleRow], per)
    setPrintJob({
      pages,
      template,
      sheetCols,
      sheetRows,
      printLayout: 'simple',
      storeName: loadStoreProfile().storeName,
      priceCipher: loadPriceCipherSettings(),
    })
  }, [template, sampleRow])

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

  type AlignOp = 'left' | 'center-h' | 'right' | 'top' | 'middle' | 'bottom' | 'distribute-h' | 'distribute-v'

  const alignSelected = useCallback(
    (op: AlignOp) => {
      mergeLib((prev) => ({
        ...prev,
        templates: prev.templates.map((t) => {
          if (t.id !== prev.activeId) return t
          const ids = selectedIds
          if (ids.size < 2) return t
          const targets = t.elements.filter((e) => ids.has(e.id))
          if (targets.length < 2) return t
          const xs = targets.map((e) => e.x)
          const ys = targets.map((e) => e.y)
          const xrs = targets.map((e) => e.x + e.w)
          const yrs = targets.map((e) => e.y + e.h)
          const minX = Math.min(...xs)
          const maxXR = Math.max(...xrs)
          const minY = Math.min(...ys)
          const maxYR = Math.max(...yrs)
          const cx = (minX + maxXR) / 2
          const cy = (minY + maxYR) / 2

          const updates = new Map<string, Partial<typeof targets[number]>>()
          if (op === 'left') {
            for (const e of targets) updates.set(e.id, { x: minX })
          } else if (op === 'right') {
            for (const e of targets) updates.set(e.id, { x: maxXR - e.w })
          } else if (op === 'center-h') {
            for (const e of targets) updates.set(e.id, { x: cx - e.w / 2 })
          } else if (op === 'top') {
            for (const e of targets) updates.set(e.id, { y: minY })
          } else if (op === 'bottom') {
            for (const e of targets) updates.set(e.id, { y: maxYR - e.h })
          } else if (op === 'middle') {
            for (const e of targets) updates.set(e.id, { y: cy - e.h / 2 })
          } else if (op === 'distribute-h' && targets.length >= 3) {
            const sorted = [...targets].sort((a, b) => a.x - b.x)
            const totalW = sorted.reduce((s, e) => s + e.w, 0)
            const spread = maxXR - minX
            const gap = (spread - totalW) / (sorted.length - 1)
            let cursor = minX
            for (const e of sorted) {
              updates.set(e.id, { x: cursor })
              cursor += e.w + gap
            }
          } else if (op === 'distribute-v' && targets.length >= 3) {
            const sorted = [...targets].sort((a, b) => a.y - b.y)
            const totalH = sorted.reduce((s, e) => s + e.h, 0)
            const spread = maxYR - minY
            const gap = (spread - totalH) / (sorted.length - 1)
            let cursor = minY
            for (const e of sorted) {
              updates.set(e.id, { y: cursor })
              cursor += e.h + gap
            }
          }
          if (updates.size === 0) return t
          return {
            ...t,
            elements: t.elements.map((e) =>
              updates.has(e.id) ? { ...e, ...updates.get(e.id)! } : e,
            ),
          }
        }),
      }))
    },
    [mergeLib, selectedIds],
  )

  /** ลาก layer drop ไว้ "เหนือ" target ใน list — ใน array = src ไปอยู่ "หลัง" target */
  const moveLayerAboveTarget = useCallback(
    (srcId: string, targetId: string) => {
      if (srcId === targetId) return
      mergeLib((prev) => ({
        ...prev,
        templates: prev.templates.map((t) => {
          if (t.id !== prev.activeId) return t
          const els = [...t.elements]
          const srcIdx = els.findIndex((e) => e.id === srcId)
          if (srcIdx < 0) return t
          const [src] = els.splice(srcIdx, 1)
          if (!src) return t
          const tgtIdx = els.findIndex((e) => e.id === targetId)
          if (tgtIdx < 0) return t
          els.splice(tgtIdx + 1, 0, src)
          return { ...t, elements: els }
        }),
      }))
    },
    [mergeLib],
  )

  /** ขยับ element ใน z-order — direction: 'up' = ไปข้างหน้า (front), 'down' = ไปข้างหลัง (back) */
  const reorderElement = useCallback(
    (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
      mergeLib((prev) => ({
        ...prev,
        templates: prev.templates.map((t) => {
          if (t.id !== prev.activeId) return t
          const idx = t.elements.findIndex((e) => e.id === id)
          if (idx < 0) return t
          const els = [...t.elements]
          const [el] = els.splice(idx, 1)
          if (!el) return t
          if (direction === 'top') els.push(el)
          else if (direction === 'bottom') els.unshift(el)
          else if (direction === 'up') els.splice(Math.min(idx + 1, els.length), 0, el)
          else els.splice(Math.max(idx - 1, 0), 0, el)
          return { ...t, elements: els }
        }),
      }))
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
      {printJob
        ? createPortal(
            <div id="label-print-surface" className="bg-white text-black">
              {printJob.pages.map((page, pi) => (
                <LabelDesignerPrintPage
                  key={`design-test-print-${pi}`}
                  pageRows={page}
                  template={printJob.template}
                  sheetCols={printJob.sheetCols}
                  sheetRows={printJob.sheetRows}
                  printLayout={printJob.printLayout}
                  storeName={printJob.storeName}
                  priceCipher={printJob.priceCipher}
                  pageIndex={pi}
                  isLastPage={pi >= printJob.pages.length - 1}
                />
              ))}
            </div>,
            document.body,
          )
        : null}
      <div className="flex shrink-0 flex-col gap-2 rounded-2xl border border-violet-200/80 bg-gradient-to-r from-violet-50/90 to-white px-3 py-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800">ออกแบบป้ายบาร์โค้ด (ลากวาง)</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
              <span>
                ตั้งชื่อ · กด <strong className="font-medium text-slate-700">บันทึก</strong> เพื่อจุดอ้างอิง —{' '}
                <strong className="font-medium text-slate-700">ค่าเริ่มต้น</strong> คืนตามที่บันทึกล่าสุด
              </span>
              <span className="flex items-center gap-1">
                · ตัวอย่าง:
                <select
                  value={previewRowId ?? '__queue0__'}
                  onChange={(e) => {
                    const v = e.target.value
                    setPreviewRowId(v === '__queue0__' ? null : v)
                  }}
                  className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px]"
                  title="เลือกสินค้าที่ใช้แสดงในตัวอย่าง"
                >
                  <option value="__queue0__">
                    {previewRow ? `คิว #1 — ${previewRow.name}` : 'ข้อมูลตัวอย่าง'}
                  </option>
                  <option value="__sample__">ข้อมูลตัวอย่าง (ผ้าเบรกหน้า NAO)</option>
                  {previewRowOptions && previewRowOptions.length > 0 ? (
                    <optgroup label="คิวพิมพ์">
                      {previewRowOptions.map((r, i) => (
                        <option key={r.id} value={r.id}>
                          #{i + 1} — {r.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </select>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-700">
              ซูม
              <input
                type="range"
                min={1}
                max={4}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-24"
              />
              <span className="tabular-nums">{zoom.toFixed(2)}×</span>
            </label>
            <button
              type="button"
              onClick={() => {
                if (!calibrated) {
                  setCalibrationOpen(true)
                  return
                }
                setZoom(realSizeZoomFactor())
              }}
              title={
                calibrated
                  ? 'ตั้งซูมให้ตรงขนาดจริง (มม. บนจอ = มม. จริง) ตามค่าปรับเทียบของ preset นี้'
                  : 'ยังไม่ได้ปรับเทียบจอนี้ — กดเพื่อเปิดหน้าต่างปรับเทียบก่อน'
              }
              className={clsx(
                'inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold',
                calibrated
                  ? 'border-violet-300 bg-white text-violet-800 hover:bg-violet-50'
                  : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100',
              )}
            >
              {calibrated ? (
                <>ขนาดจริง 1:1</>
              ) : (
                <>
                  <span aria-hidden>⚠</span> ขนาดจริง — ยังไม่ได้ปรับเทียบ
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setCalibrationOpen(true)}
              title="ปรับเทียบขนาดจริงสำหรับจอนี้ — วัดแท่งอ้างอิงด้วยไม้บรรทัด"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50"
            >
              ปรับเทียบ…
            </button>
            <button
              type="button"
              onClick={() => setShowGrid((v) => !v)}
              title={showGrid ? 'ซ่อนเส้นกริด' : 'แสดงเส้นกริด (5 มม.)'}
              className={clsx(
                'inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px]',
                showGrid
                  ? 'border-violet-300 bg-violet-50 text-violet-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              <Grid3x3 className="size-3.5" aria-hidden />
              กริด
            </button>
            <button
              type="button"
              onClick={() => setShowRuler((v) => !v)}
              title={showRuler ? 'ซ่อนไม้บรรทัด' : 'แสดงไม้บรรทัด (มม.)'}
              className={clsx(
                'inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px]',
                showRuler
                  ? 'border-violet-300 bg-violet-50 text-violet-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              <span className="font-mono text-[10px]">↔ มม.</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMultiUp((v) => !v)}
              title={showMultiUp ? 'ซ่อน preview แบบหลายดวงบนม้วน' : 'แสดง preview แบบหลายดวงบนม้วน'}
              className={clsx(
                'inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px]',
                showMultiUp
                  ? 'border-violet-300 bg-violet-50 text-violet-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              <span className="font-mono text-[10px]">⊞ preview</span>
            </button>
            <button
              type="button"
              onClick={() => setShortcutHelpOpen(true)}
              title="ดูคีย์ลัด"
              className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-50"
            >
              ?
            </button>
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
              onClick={handleTestPrint}
              title="พิมพ์ป้าย 1 ดวงด้วยข้อมูลตัวอย่างเพื่อตรวจสอบ"
              className="inline-flex items-center gap-1 rounded-lg border border-violet-300 bg-violet-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-violet-700"
            >
              <Printer className="size-3.5" />
              ทดสอบพิมพ์
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
          {/* Layers panel — z-order list */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold text-slate-700">
              เลเยอร์ ({template.elements.length})
              <span className="ml-1 text-[9px] font-normal text-slate-500">บนสุด = ทับด้านหน้า</span>
            </p>
            {template.elements.length === 0 ? (
              <p className="rounded border border-dashed border-slate-300 bg-white px-2 py-2 text-center text-[10px] text-slate-500">
                ป้ายว่าง — ติ๊กฟิลด์ด้านล่างเพื่อเพิ่ม
              </p>
            ) : (
              <ul className="space-y-0.5">
                {[...template.elements].reverse().map((el) => {
                  const isPrimary = el.id === selectedId
                  const isInSet = selectedIds.has(el.id)
                  const isDragging = dragLayerId === el.id
                  const isDropTarget = dragOverLayerId === el.id && dragLayerId !== el.id
                  const idxFromEnd = template.elements.length - 1 - template.elements.findIndex((e) => e.id === el.id)
                  const isTop = idxFromEnd === 0
                  const isBottom = idxFromEnd === template.elements.length - 1
                  return (
                    <li
                      key={el.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData('text/plain', el.id)
                        setDragLayerId(el.id)
                      }}
                      onDragEnd={() => {
                        setDragLayerId(null)
                        setDragOverLayerId(null)
                      }}
                      onDragOver={(e) => {
                        if (!dragLayerId || dragLayerId === el.id) return
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                        setDragOverLayerId(el.id)
                      }}
                      onDragLeave={() => {
                        setDragOverLayerId((cur) => (cur === el.id ? null : cur))
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        const srcId = e.dataTransfer.getData('text/plain') || dragLayerId
                        if (srcId && srcId !== el.id) moveLayerAboveTarget(srcId, el.id)
                        setDragLayerId(null)
                        setDragOverLayerId(null)
                      }}
                      className={clsx(
                        'group flex items-center gap-1 rounded border px-1.5 py-1 text-[10px] transition',
                        isDragging && 'opacity-40',
                        isDropTarget && 'border-violet-500 ring-2 ring-violet-300',
                        !isDropTarget && isPrimary
                          ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-300'
                          : !isDropTarget && isInSet
                            ? 'border-violet-300 bg-violet-50/60'
                            : !isDropTarget &&
                              'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/50',
                      )}
                    >
                      <span
                        className="shrink-0 cursor-grab text-slate-400 active:cursor-grabbing"
                        title="ลากเพื่อสลับลำดับ z-order"
                      >
                        <GripVertical className="size-3" aria-hidden />
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          if (e.shiftKey) toggleInSelection(el.id)
                          else selectSingle(el.id)
                        }}
                        title="คลิก = เลือกเดียว · Shift+คลิก = เพิ่มเลือกหลาย"
                        className="flex min-w-0 flex-1 items-center gap-1 text-left"
                      >
                        <span
                          className={clsx(
                            'shrink-0 rounded px-1 py-0.5 font-mono text-[8px] font-bold',
                            el.kind === 'barcode' && 'bg-slate-800 text-white',
                            el.kind === 'qrcode' && 'bg-slate-700 text-white',
                            el.kind === 'text' && 'bg-slate-100 text-slate-700',
                          )}
                        >
                          {el.kind === 'barcode' ? 'BC' : el.kind === 'qrcode' ? 'QR' : 'T'}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-slate-800">
                          {fieldLabelTh(el.field)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => reorderElement(el.id, 'top')}
                        disabled={isTop}
                        title="ส่งหน้าสุด"
                        className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20"
                      >
                        ⏫
                      </button>
                      <button
                        type="button"
                        onClick={() => reorderElement(el.id, 'up')}
                        disabled={isTop}
                        title="ขึ้น 1 ระดับ"
                        className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => reorderElement(el.id, 'down')}
                        disabled={isBottom}
                        title="ลง 1 ระดับ"
                        className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => reorderElement(el.id, 'bottom')}
                        disabled={isBottom}
                        title="ส่งหลังสุด"
                        className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20"
                      >
                        ⏬
                      </button>
                      <button
                        type="button"
                        onClick={() => removeElement(el.id)}
                        title="ลบ"
                        className="rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="size-2.5" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <div className="my-1.5 border-t border-slate-200" />
          <p className="text-[11px] font-semibold text-slate-700">เพิ่มฟิลด์</p>
          <div className="space-y-2">
            {DESIGNER_CHECKBOX_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                  {group.title}
                </p>
                <div className="flex flex-col gap-1">
                  {group.options.map((opt) => {
                    const checked = template.elements.some((e) =>
                      elementMatchesCheckboxForRemove(e, opt),
                    )
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
                          <span className="block text-[11px] font-medium text-slate-800">
                            {opt.label}
                          </span>
                          {opt.hint ? (
                            <span className="block text-[9px] leading-tight text-slate-500">
                              {opt.hint}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
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

        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/90">
          {validationWarnings.length > 0 ? (
            <div
              className={clsx(
                'shrink-0 border-b text-[11px]',
                warnCount > 0
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-sky-200 bg-sky-50/70',
              )}
            >
              <button
                type="button"
                onClick={() => setValidationOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left"
              >
                <span className={clsx('font-semibold', warnCount > 0 ? 'text-amber-900' : 'text-sky-900')}>
                  {warnCount > 0
                    ? `⚠️ พบ ${warnCount} ปัญหา${infoCount > 0 ? ` + ${infoCount} เตือน` : ''}`
                    : `ℹ️ ${infoCount} ข้อแนะนำ`}
                </span>
                <span className="text-[10px] text-slate-600">{validationOpen ? 'ซ่อน' : 'ดูรายละเอียด'}</span>
              </button>
              {validationOpen ? (
                <ul className="space-y-0.5 border-t border-amber-200/60 bg-white/40 px-3 py-1.5">
                  {validationWarnings.map((w, i) => (
                    <li
                      key={i}
                      className={clsx(
                        'flex items-start gap-1.5 text-[10px]',
                        w.level === 'warn' ? 'text-amber-900' : 'text-slate-700',
                      )}
                    >
                      <span className="mt-0.5">{w.level === 'warn' ? '⚠️' : '•'}</span>
                      <button
                        type="button"
                        onClick={() => w.elementId && setSelectedId(w.elementId)}
                        className={clsx(
                          'min-w-0 flex-1 text-left',
                          w.elementId ? 'hover:underline cursor-pointer' : 'cursor-default',
                        )}
                      >
                        {w.message}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <div className="shrink-0 border-b border-emerald-200/60 bg-emerald-50/60 px-3 py-1.5 text-[11px] font-semibold text-emerald-800">
              ✓ พร้อมพิมพ์
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 pt-7">
          <div className="flex justify-center">
            <div
              className="origin-top"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                paddingLeft: showRuler ? '5mm' : 0,
                paddingTop: showRuler ? '5mm' : 0,
                marginBottom: `calc((${template.heightMm}mm + ${showRuler ? '10mm' : '0mm'}) * (${zoom} - 1))`,
              }}
            >
              {showRuler ? (
                <div
                  className="pointer-events-none relative"
                  style={{
                    height: '5mm',
                    width: `${template.widthMm}mm`,
                    marginLeft: 0,
                  }}
                  aria-hidden
                >
                  {Array.from({ length: Math.floor(template.widthMm / 5) + 1 }, (_, i) => i * 5).map((mm) => (
                    <span
                      key={`rx-${mm}`}
                      className="absolute -top-0 text-[6px] font-medium text-slate-500"
                      style={{ left: `${mm}mm`, transform: 'translateX(-50%)' }}
                    >
                      {mm}
                    </span>
                  ))}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-px bg-slate-300"
                  />
                </div>
              ) : null}
              <div className="relative flex">
                {showRuler ? (
                  <div
                    className="pointer-events-none relative shrink-0"
                    style={{ width: '5mm', height: `${template.heightMm}mm`, marginLeft: '-5mm' }}
                    aria-hidden
                  >
                    {Array.from({ length: Math.floor(template.heightMm / 5) + 1 }, (_, i) => i * 5).map((mm) => (
                      <span
                        key={`ry-${mm}`}
                        className="absolute right-0.5 text-[6px] font-medium leading-none text-slate-500"
                        style={{ top: `${mm}mm`, transform: 'translateY(-50%)' }}
                      >
                        {mm}
                      </span>
                    ))}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-px bg-slate-300"
                    />
                  </div>
                ) : null}
              <div
                ref={canvasRef}
                role="application"
                aria-label="พื้นที่ออกแบบป้าย"
                className="relative bg-white"
                style={{
                  width: `${template.widthMm}mm`,
                  height: `${template.heightMm}mm`,
                  ...(showGrid
                    ? {
                        backgroundSize: '5mm 5mm, 5mm 5mm, 1mm 1mm, 1mm 1mm',
                        backgroundImage:
                          'linear-gradient(to right, rgb(148 163 184 / 0.55) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.55) 1px, transparent 1px), linear-gradient(to right, rgb(203 213 225 / 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgb(203 213 225 / 0.35) 1px, transparent 1px)',
                      }
                    : {}),
                }}
                onPointerDown={(e) => {
                  if (e.target !== e.currentTarget) return
                  if (e.button !== 0) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  const xPct = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100)
                  const yPct = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100)
                  e.currentTarget.setPointerCapture(e.pointerId)
                  setMarquee({ startXPct: xPct, startYPct: yPct, curXPct: xPct, curYPct: yPct })
                }}
                onPointerMove={(e) => {
                  if (!marqueeRef.current) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  const xPct = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100)
                  const yPct = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100)
                  setMarquee((prev) => (prev ? { ...prev, curXPct: xPct, curYPct: yPct } : prev))
                }}
                onPointerUp={(e) => {
                  const m = marqueeRef.current
                  if (!m) return
                  e.currentTarget.releasePointerCapture(e.pointerId)
                  setMarquee(null)
                  const x0 = Math.min(m.startXPct, m.curXPct)
                  const x1 = Math.max(m.startXPct, m.curXPct)
                  const y0 = Math.min(m.startYPct, m.curYPct)
                  const y1 = Math.max(m.startYPct, m.curYPct)
                  // คลิกเฉยๆ (ไม่ลาก) → clear selection
                  if (x1 - x0 < 1 && y1 - y0 < 1) {
                    selectSingle(null)
                    return
                  }
                  // เก็บ element ที่ตัดกับ marquee
                  const hit = template.elements.filter((el) => {
                    const ex0 = el.x, ex1 = el.x + el.w
                    const ey0 = el.y, ey1 = el.y + el.h
                    return ex1 > x0 && ex0 < x1 && ey1 > y0 && ey0 < y1
                  })
                  if (hit.length === 0) {
                    selectSingle(null)
                    return
                  }
                  const ids = new Set(hit.map((h) => h.id))
                  setSelectedIds(ids)
                  setSelectedId(hit[hit.length - 1]!.id)
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
                {/* Marquee selection box */}
                {marquee ? (
                  <div
                    className="pointer-events-none absolute border border-violet-500 bg-violet-500/15"
                    style={{
                      left: `${Math.min(marquee.startXPct, marquee.curXPct)}%`,
                      top: `${Math.min(marquee.startYPct, marquee.curYPct)}%`,
                      width: `${Math.abs(marquee.curXPct - marquee.startXPct)}%`,
                      height: `${Math.abs(marquee.curYPct - marquee.startYPct)}%`,
                    }}
                    aria-hidden
                  />
                ) : null}
              </div>
              </div>
            </div>
          </div>
          <p className="mx-auto mt-3 max-w-xl text-center text-[10px] text-slate-500">
            ขนาดกรอบ {template.widthMm}×{template.heightMm} มม. — ลากที่กรอบองค์ประกอบเพื่อจัดตำแหน่ง
            <span className="ml-2 text-slate-400">· กด Alt ค้างขณะลาก = ลากอิสระ (ไม่ snap)</span>
          </p>
          {showMultiUp ? (
            <MultiUpRollPreview
              template={template}
              row={sampleRow}
              storeName={storeNamePreview}
              priceCipher={cipherSettings}
            />
          ) : null}
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-2 overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-white p-3">
          {selectedIds.size >= 2 ? (
            <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-2">
              <p className="mb-1.5 text-[10px] font-semibold text-violet-900">
                เลือก {selectedIds.size} อัน · จัดเรียง
              </p>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { op: 'left' as const, label: 'ซ้าย', icon: '⇤' },
                  { op: 'center-h' as const, label: 'กลาง→', icon: '↔' },
                  { op: 'right' as const, label: 'ขวา', icon: '⇥' },
                  { op: 'top' as const, label: 'บน', icon: '⤒' },
                  { op: 'middle' as const, label: 'กลาง↕', icon: '↕' },
                  { op: 'bottom' as const, label: 'ล่าง', icon: '⤓' },
                ].map((a) => (
                  <button
                    key={a.op}
                    type="button"
                    onClick={() => alignSelected(a.op)}
                    title={`จัด${a.label}`}
                    className="rounded border border-violet-200 bg-white px-1 py-1 text-[10px] hover:bg-violet-100"
                  >
                    <span className="mr-0.5 font-bold">{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
              {selectedIds.size >= 3 ? (
                <div className="mt-1 grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => alignSelected('distribute-h')}
                    title="กระจายระยะแนวนอน"
                    className="rounded border border-violet-200 bg-white px-1 py-1 text-[10px] hover:bg-violet-100"
                  >
                    ↔ กระจายแนวนอน
                  </button>
                  <button
                    type="button"
                    onClick={() => alignSelected('distribute-v')}
                    title="กระจายระยะแนวตั้ง"
                    className="rounded border border-violet-200 bg-white px-1 py-1 text-[10px] hover:bg-violet-100"
                  >
                    ↕ กระจายแนวตั้ง
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => selectSingle(selectedId)}
                className="mt-1.5 w-full rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50"
              >
                ยกเลิกเลือกหลายอัน
              </button>
            </div>
          ) : null}
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
              <div className="grid grid-cols-2 gap-1.5">
                <label className="block">
                  <span className="text-slate-600">X (mm)</span>
                  <input
                    type="number"
                    min={0}
                    max={template.widthMm}
                    step={0.5}
                    value={Math.round((selected.x / 100) * template.widthMm * 10) / 10}
                    onChange={(e) => {
                      const xMm = clamp(Number(e.target.value) || 0, 0, template.widthMm)
                      const xPct = (xMm / template.widthMm) * 100
                      updateElement(selected.id, {
                        x: clamp(xPct, 0, Math.max(0, 100 - selected.w)),
                      })
                    }}
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-600">Y (mm)</span>
                  <input
                    type="number"
                    min={0}
                    max={template.heightMm}
                    step={0.5}
                    value={Math.round((selected.y / 100) * template.heightMm * 10) / 10}
                    onChange={(e) => {
                      const yMm = clamp(Number(e.target.value) || 0, 0, template.heightMm)
                      const yPct = (yMm / template.heightMm) * 100
                      updateElement(selected.id, {
                        y: clamp(yPct, 0, Math.max(0, 100 - selected.h)),
                      })
                    }}
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-600">กว้าง (mm)</span>
                  <input
                    type="number"
                    min={1}
                    max={template.widthMm}
                    step={0.5}
                    value={Math.round((selected.w / 100) * template.widthMm * 10) / 10}
                    onChange={(e) => {
                      const wMm = clamp(Number(e.target.value) || 1, 1, template.widthMm)
                      const wPct = (wMm / template.widthMm) * 100
                      updateElement(selected.id, {
                        w: clamp(wPct, 5, 100 - selected.x),
                      })
                    }}
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-600">สูง (mm)</span>
                  <input
                    type="number"
                    min={1}
                    max={template.heightMm}
                    step={0.5}
                    value={Math.round((selected.h / 100) * template.heightMm * 10) / 10}
                    onChange={(e) => {
                      const hMm = clamp(Number(e.target.value) || 1, 1, template.heightMm)
                      const hPct = (hMm / template.heightMm) * 100
                      updateElement(selected.id, {
                        h: clamp(hPct, 4, 100 - selected.y),
                      })
                    }}
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1"
                  />
                </label>
              </div>
              {selected.kind === 'text' && selected.field !== 'storeName' && selected.field !== 'priceCipher' ? (
                <label className="flex cursor-pointer items-start gap-1.5 rounded border border-slate-200 bg-amber-50/40 px-1.5 py-1 text-[10px]">
                  <input
                    type="checkbox"
                    checked={selected.hideIfEmpty === true}
                    onChange={(e) =>
                      updateElement(selected.id, {
                        hideIfEmpty: e.target.checked || undefined,
                      })
                    }
                    className="mt-0.5 size-3 rounded border-slate-300 text-amber-600"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-800">ซ่อนถ้าไม่มีข้อมูล</span>
                    <span className="block text-[9px] leading-tight text-slate-500">
                      ไม่ต้องโชว์ "—" ตอนสินค้าไม่มีค่านี้
                    </span>
                  </span>
                </label>
              ) : null}
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
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateElement(selected.id, { italic: !selected.italic || undefined })}
                      className={clsx(
                        'flex-1 rounded border px-2 py-1 text-[11px] italic',
                        selected.italic
                          ? 'border-violet-300 bg-violet-50 text-violet-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                      )}
                      title="เอียง"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateElement(selected.id, { underline: !selected.underline || undefined })
                      }
                      className={clsx(
                        'flex-1 rounded border px-2 py-1 text-[11px] underline',
                        selected.underline
                          ? 'border-violet-300 bg-violet-50 text-violet-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                      )}
                      title="ขีดเส้นใต้"
                    >
                      U
                    </button>
                  </div>
                  <label className="block">
                    <span className="text-slate-600">สี</span>
                    <div className="mt-0.5 flex items-center gap-1">
                      <input
                        type="color"
                        value={selected.color ?? '#000000'}
                        onChange={(e) => updateElement(selected.id, { color: e.target.value })}
                        className="h-7 w-10 cursor-pointer rounded border border-slate-200 bg-white"
                        aria-label="เลือกสีตัวอักษร"
                      />
                      <input
                        type="text"
                        value={selected.color ?? ''}
                        onChange={(e) =>
                          updateElement(selected.id, {
                            color: e.target.value.trim() || undefined,
                          })
                        }
                        placeholder="#000000 / red / rgb(...)"
                        className="flex-1 rounded border border-slate-200 px-2 py-1 font-mono text-[10px]"
                      />
                      {selected.color ? (
                        <button
                          type="button"
                          onClick={() => updateElement(selected.id, { color: undefined })}
                          className="rounded border border-slate-200 px-1 py-1 text-[10px] text-slate-600 hover:bg-slate-50"
                          title="ใช้สีเริ่มต้น (ดำ)"
                        >
                          ↺
                        </button>
                      ) : null}
                    </div>
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
                <MmNumberInput
                  value={template.widthMm}
                  min={12}
                  max={200}
                  step={0.5}
                  fallback={50}
                  onCommit={(next) => persistTemplate({ ...template, widthMm: next })}
                  className="mt-0.5 w-full rounded border border-slate-200 px-1.5 py-1"
                />
              </label>
              <label className="flex-1 text-[10px]">
                สูง
                <MmNumberInput
                  value={template.heightMm}
                  min={10}
                  max={200}
                  step={0.5}
                  fallback={35}
                  onCommit={(next) => persistTemplate({ ...template, heightMm: next })}
                  className="mt-0.5 w-full rounded border border-slate-200 px-1.5 py-1"
                />
              </label>
            </div>
          </div>
        </aside>
      </div>

      {shortcutHelpOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4"
          onClick={() => setShortcutHelpOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">คีย์ลัดในหน้าออกแบบป้าย</h3>
              <button
                type="button"
                onClick={() => setShortcutHelpOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
                aria-label="ปิด"
              >
                <span className="text-xs">✕</span>
              </button>
            </div>
            <ul className="space-y-1 text-[11px]">
              {[
                { keys: ['Ctrl', 'Z'], desc: 'ย้อนกลับ (Undo)' },
                { keys: ['Ctrl', 'Shift', 'Z'], desc: 'ทำซ้ำ (Redo)' },
                { keys: ['Ctrl', 'D'], desc: 'คัดลอก element ที่เลือก' },
                { keys: ['Delete'], desc: 'ลบ element ที่เลือก' },
                { keys: ['Esc'], desc: 'ยกเลิกการเลือก' },
                { keys: ['↑', '↓', '←', '→'], desc: 'ขยับ element ทีละ 1 มม.' },
                { keys: ['Shift', '+ ลูกศร'], desc: 'ขยับทีละ 5 มม.' },
                { keys: ['Alt', '+ ลาก'], desc: 'ลากอิสระ ไม่ snap to grid' },
                { keys: ['Shift', '+ คลิก (Layers)'], desc: 'เพิ่มเลือกหลาย element' },
                { keys: ['ลากที่พื้นที่ว่าง canvas'], desc: 'Marquee select — เลือกหลาย element ในกรอบ' },
              ].map((row, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded border border-slate-100 bg-slate-50/50 px-2 py-1">
                  <span className="text-slate-700">{row.desc}</span>
                  <span className="flex shrink-0 gap-0.5">
                    {row.keys.map((k, j) => (
                      <kbd
                        key={j}
                        className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700 shadow-sm"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] text-slate-500">
              💡 Tip: คลิกในช่อง input ใดๆ จะปิดคีย์ลัด element ชั่วคราว
            </p>
          </div>
        </div>
      ) : null}

      {calibrationOpen ? (
        <RealSizeCalibrationModal
          onClose={() => setCalibrationOpen(false)}
          onCommit={(measuredMm) => {
            const next = commitRealSizeMeasurement(100, measuredMm)
            setZoom(next)
            setCalibrated(true)
            setCalibrationOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

const REAL_SIZE_REFERENCE_MM = 100

function RealSizeCalibrationModal({
  onClose,
  onCommit,
}: {
  onClose: () => void
  onCommit: (measuredMm: number) => void
}) {
  const presetId = detectCurrentPresetId()
  const preset = WINDOW_PRESETS[presetId]
  const [measured, setMeasured] = useState<string>('')
  const measuredNum = Number(measured)
  const valid =
    measured.trim() !== '' && Number.isFinite(measuredNum) && measuredNum > 0 && measuredNum !== REAL_SIZE_REFERENCE_MM
  const sameAsReference = measured.trim() !== '' && Number(measured) === REAL_SIZE_REFERENCE_MM
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              ปรับเทียบขนาดจริง — {preset.tierTh} ({preset.label})
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-600">
              ค่าจะบันทึกเฉพาะ preset นี้ — เปลี่ยน preset แล้วปรับเทียบใหม่
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
          >
            ปิด
          </button>
        </div>

        <ol className="mb-3 list-decimal space-y-1 pl-5 text-[12px] text-slate-700">
          <li>เอาไม้บรรทัดทาบกับแท่งสีม่วงด้านล่าง</li>
          <li>กรอกค่าที่วัดได้ (มม.) ลงในช่อง</li>
          <li>กด «บันทึก» — ระบบจะคำนวณตัวคูณซูมให้</li>
        </ol>

        <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
          <span>0 mm</span>
          <span className="font-mono">แท่งอ้างอิง — CSS ตั้งใจให้ยาว {REAL_SIZE_REFERENCE_MM} mm</span>
          <span>{REAL_SIZE_REFERENCE_MM} mm</span>
        </div>
        <div className="mb-3 flex items-center">
          <div
            className="h-3 rounded-sm bg-violet-600"
            style={{ width: `${REAL_SIZE_REFERENCE_MM}mm` }}
          />
        </div>

        <label className="block text-[12px] font-medium text-slate-700">
          วัดได้กี่ มม.?
          <input
            type="number"
            min={1}
            max={400}
            step={0.5}
            value={measured}
            onChange={(e) => setMeasured(e.target.value)}
            placeholder="เช่น 75 หรือ 125"
            className="mt-1 w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            autoFocus
          />
        </label>
        {valid ? (
          <p className="mt-2 text-[11px] text-slate-600">
            ตัวคูณซูมที่จะตั้ง: <strong className="font-mono text-slate-900">{(REAL_SIZE_REFERENCE_MM / measuredNum).toFixed(3)}×</strong>
          </p>
        ) : sameAsReference ? (
          <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
            ⚠ ค่าที่กรอกเท่ากับ {REAL_SIZE_REFERENCE_MM} mm พอดี = ตัวคูณ 1.000× (ไม่มีการปรับ) — ตรวจสอบว่าวัดด้วยไม้บรรทัดจริง ไม่ใช่ใส่ตามค่าตั้งไว้
          </p>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => valid && onCommit(measuredNum)}
            disabled={!valid}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  )
}

/** Preview แบบหลายดวงบนม้วน — โชว์ว่าสติ๊กเกอร์เรียงต่อแถวกันแล้วหน้าตาเป็นไง */
function MultiUpRollPreview({
  template,
  row,
  storeName,
  priceCipher,
}: {
  template: LabelDesignerTemplate
  row: EnrichedLabelRow
  storeName: string
  priceCipher: PriceCipherSettings
}) {
  const cols = Math.max(1, computeAutoSheetCols(template.widthMm))
  const rows = 2
  // scale ให้เล็กพอดีกับ panel
  const previewMmPerCol = 28
  const scale = previewMmPerCol / template.widthMm
  return (
    <div className="mx-auto mt-4 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-700">
          แสดงตัวอย่างบนม้วน — {cols}×{rows} ดวง
        </p>
        <p className="text-[9px] text-slate-500">
          ม้วน ~{LABEL_PRINT_SHEET_WIDTH_MM} mm · สติ๊กเกอร์ {template.widthMm}×{template.heightMm} mm
        </p>
      </div>
      <div
        className="mx-auto rounded border border-dashed border-slate-300 bg-slate-50/60 p-2"
        style={{ maxWidth: 'fit-content' }}
      >
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${cols}, ${template.widthMm * scale}mm)` }}
        >
          {Array.from({ length: cols * rows }).map((_, i) => (
            <div
              key={i}
              className="relative bg-white shadow-sm ring-1 ring-slate-200"
              style={{
                width: `${template.widthMm * scale}mm`,
                height: `${template.heightMm * scale}mm`,
              }}
            >
              <div
                style={{
                  width: `${template.widthMm}mm`,
                  height: `${template.heightMm}mm`,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
                className="relative bg-white"
              >
                <LabelDesignerStickerBody
                  template={template}
                  row={row}
                  storeName={storeName}
                  priceCipher={priceCipher}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
