import { TaxInvoiceFormCanvasBody } from '@/features/inventory/components/TaxInvoiceFormCanvasBody'
import {
  adjustLineTableColumnWidth,
  BUYER_VARIABLE_DEFINITIONS,
  buildTaxInvoiceFormPrintHtml,
  DEFAULT_TAX_INVOICE_LINE_ITEMS,
  DOC_VARIABLE_DEFINITIONS,
  getLineTableColWidthsPct,
  getLineTableConfig,
  LINE_COLUMN_ROLE_SELECT_OPTIONS,
  LINE_ITEM_VARIABLE_DEFINITIONS,
  LINE_TABLE_COL_COUNT_MAX,
  LINE_TABLE_COL_COUNT_MIN,
  lineColumnRoleVariableKey,
  lineItemsToTsvPreview,
  parseTaxInvoiceLineTsvBlock,
  printTaxInvoiceHtmlPreferSystemDialog,
  taxInvoiceFieldLabelTh,
  TAX_INVOICE_TITLE_CHAMBER_MM,
  type TaxInvoiceLineItemRow,
} from '@/features/inventory/data/taxInvoiceFormCanvasShared'
import { clamp } from '@/features/inventory/data/labelDesignerCanvasUtils'
import {
  clampLineColumnWPct,
  clampLineColumnXPct,
} from '@/features/inventory/data/taxInvoiceLineColumnCollision'
import {
  loadTaxInvoiceDesignerHideDataBlocksPreview,
  loadTaxInvoiceDesignerShowDraftGuides,
  loadTaxInvoiceDesignerShowGrid,
  loadTaxInvoiceDesignerShowTractor,
  saveTaxInvoiceDesignerHideDataBlocksPreview,
  saveTaxInvoiceDesignerShowDraftGuides,
  saveTaxInvoiceDesignerShowGrid,
  saveTaxInvoiceDesignerShowTractor,
} from '@/features/inventory/data/taxInvoiceDesignerUiPrefs'
import {
  TAX_INVOICE_FORM_DESIGNER_CHANGED_EVENT,
  TAX_INVOICE_PAPER_PRESETS,
  defaultTaxInvoiceFormBody,
  createLineColumnGroupElements,
  defaultStackedElements,
  getActiveTaxInvoiceForm,
  loadTaxInvoiceFormDesignerState,
  newTaxInvoiceElementId,
  newTaxInvoiceFormId,
  isDraftGuideFieldKey,
  saveTaxInvoiceFormDesignerState,
  resizeLineTableToColumnCount,
  type TaxInvoiceCanvasElement,
  type TaxInvoiceLineColumnRole,
  type TaxInvoiceFieldKey,
  type TaxInvoiceFormDesignerState,
  type TaxInvoiceFormRecord,
} from '@/features/inventory/data/taxInvoiceFormDesignerStore'
import { loadStoreProfile, STORE_PROFILE_CHANGED_EVENT } from '@/features/settings/data/storeProfileStore'
import { clsx } from 'clsx'
import { ChevronDown, ChevronUp, CopyPlus, Plus, Printer, RotateCcw, Save, Store, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

type TaxInvoiceFormDesignerViewProps = {
  className?: string
}

/** บล็อกข้อมูลมาตรฐาน (ไม่รวมข้อความกำหนดเอง / แบบร่าง / รายการสินค้าแยกคอลัมน์) */
type StandardBlockField = Exclude<
  TaxInvoiceFieldKey,
  | 'custom_text'
  | 'draft_rect'
  | 'draft_line_h'
  | 'draft_line_v'
  | 'line_table'
  | 'line_column'
>

const UNIQUE_FIELDS: StandardBlockField[] = [
  'title_th',
  'title_en',
  'seller_block',
  'buyer_block',
  'doc_meta',
  'customer_code',
  'totals_block',
  'total_text',
  'staff',
]

const DEFAULT_DIMS: Record<StandardBlockField, Omit<TaxInvoiceCanvasElement, 'id' | 'field'>> = {
  title_th: { x: 8, y: 2, w: 84, h: 6, fontSize: 14 },
  title_en: { x: 8, y: 8, w: 84, h: 4, fontSize: 10, textAlign: 'center' },
  seller_block: { x: 6, y: 14, w: 52, h: 16, fontSize: 9, textAlign: 'left' },
  buyer_block: { x: 6, y: 31, w: 88, h: 10, fontSize: 9, textAlign: 'left' },
  buyer_name: { x: 6, y: 31, w: 88, h: 4, fontSize: 9, textAlign: 'left' },
  buyer_tax_id: { x: 6, y: 35.5, w: 88, h: 3.5, fontSize: 9, textAlign: 'left' },
  buyer_address: { x: 6, y: 39, w: 88, h: 6, fontSize: 9, textAlign: 'left' },
  doc_meta: { x: 6, y: 53, w: 40, h: 9, fontSize: 9, textAlign: 'left', docLineHeight: 1.25 },
  doc_receipt_no: { x: 6, y: 53, w: 88, h: 3.5, fontSize: 9, textAlign: 'left' },
  doc_date: { x: 6, y: 57, w: 88, h: 3.5, fontSize: 9, textAlign: 'left' },
  customer_code: { x: 6, y: 61, w: 40, h: 6, fontSize: 9, textAlign: 'left' },
  totals_block: {
    x: 48,
    y: 83,
    w: 48,
    h: 11,
    fontSize: 9,
    lineHeight: 1.25,
    totalsLineHeight: 1.25,
    totalsLabelValueGapMm: 2,
    totalsValueColumnWidthPct: 36,
    totalsLabelTextAlign: 'left',
    totalsValueTextAlign: 'right',
  },
  total_text: { x: 6, y: 96, w: 90, h: 4, fontSize: 9, textAlign: 'left' },
  staff: { x: 6, y: 91, w: 88, h: 5, fontSize: 9, textAlign: 'left' },
}

const DRAFT_LINE_MIN_MM = 0.25
const DRAFT_RECT_MIN_MM = 1

type DragRef = {
  id: string
  startClientX: number
  startClientY: number
  origX: number
  origY: number
  w: number
  h: number
  /** line_column: เลื่อนแนวตั้งพร้อมทุกกล่องในกลุ่ม */
  lineRowGroup?: { groupId: string; origYs: Record<string, number> }
}

/** เก็บฟอร์มเป็นมม. — หน่วยนิ้วใช้แค่ตอนแสดง/กรอก */
const MM_PER_IN = 25.4
const PAPER_DIM_UNIT_KEY = 'bento.taxInvoiceDesigner.paperDimUnit.v1'
const PAGE_MIN_MM = 80
const PAGE_MAX_MM = 420
const MARGIN_MAX_MM = 80

type PaperDimUnit = 'mm' | 'inch'

function loadPaperDimUnit(): PaperDimUnit {
  try {
    const v = localStorage.getItem(PAPER_DIM_UNIT_KEY)
    if (v === 'inch' || v === 'mm') return v
  } catch {
    /* noop */
  }
  return 'mm'
}

function mmToIn(mm: number): number {
  return mm / MM_PER_IN
}

function inToMm(inch: number): number {
  return inch * MM_PER_IN
}

function clampPageMm(n: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback
  return Math.min(PAGE_MAX_MM, Math.max(PAGE_MIN_MM, n))
}

function clampMarginMm(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(MARGIN_MAX_MM, Math.max(0, n))
}

function formatMmPairForUnit(wMm: number, hMm: number, unit: PaperDimUnit): string {
  if (unit === 'mm') return `${wMm}×${hMm} มม.`
  const a = Math.round(mmToIn(wMm) * 10000) / 10000
  const b = Math.round(mmToIn(hMm) * 10000) / 10000
  return `${a}×${b} นิ้ว`
}

function createElementForField(field: StandardBlockField, index: number): TaxInvoiceCanvasElement {
  const stagger = (index % 5) * 2
  const d = DEFAULT_DIMS[field]
  return {
    id: newTaxInvoiceElementId(),
    field,
    x: clamp(d.x + stagger, 0, 100 - d.w),
    y: clamp(d.y + stagger * 0.8, 0, 100 - d.h),
    w: d.w,
    h: d.h,
    fontSize: d.fontSize,
    ...(d.textAlign !== undefined ? { textAlign: d.textAlign } : {}),
                    ...(d.lineHeight !== undefined ? { lineHeight: d.lineHeight } : {}),
    ...(d.totalsLineHeight !== undefined ? { totalsLineHeight: d.totalsLineHeight } : {}),
    ...(d.totalsLabelValueGapMm !== undefined ? { totalsLabelValueGapMm: d.totalsLabelValueGapMm } : {}),
    ...(d.totalsValueColumnWidthPct !== undefined
      ? { totalsValueColumnWidthPct: d.totalsValueColumnWidthPct }
      : {}),
    ...(d.totalsLabelTextAlign !== undefined ? { totalsLabelTextAlign: d.totalsLabelTextAlign } : {}),
    ...(d.totalsValueTextAlign !== undefined ? { totalsValueTextAlign: d.totalsValueTextAlign } : {}),
    ...(d.docLineHeight !== undefined ? { docLineHeight: d.docLineHeight } : {}),
  }
}

export function TaxInvoiceFormDesignerView({ className }: TaxInvoiceFormDesignerViewProps) {
  const [state, setState] = useState<TaxInvoiceFormDesignerState>(() => loadTaxInvoiceFormDesignerState())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.85)
  /** แถบตั้งค่าด้านบน (ฟอร์ม / กระดาษ / ขอบ) — ย่อได้เพื่อเน้นพื้นที่แคนวาส */
  const [settingsToolbarOpen, setSettingsToolbarOpen] = useState(false)
  const [paperDimUnit, setPaperDimUnit] = useState<PaperDimUnit>(loadPaperDimUnit)
  const [showGrid10mm, setShowGrid10mm] = useState(loadTaxInvoiceDesignerShowGrid)
  const [showTractorMargins, setShowTractorMargins] = useState(loadTaxInvoiceDesignerShowTractor)
  const [showDraftGuides, setShowDraftGuides] = useState(loadTaxInvoiceDesignerShowDraftGuides)
  const [hideDataBlocksPreview, setHideDataBlocksPreview] = useState(loadTaxInvoiceDesignerHideDataBlocksPreview)
  const [linePreviewRows, setLinePreviewRows] = useState<TaxInvoiceLineItemRow[]>(() =>
    DEFAULT_TAX_INVOICE_LINE_ITEMS.map((r) => ({ ...r })),
  )
  const [lineImportDraft, setLineImportDraft] = useState('')
  /** จำนวนคอลัมน์ตอนสร้างแถวรายการ (แยกกล่อง) */
  const [lineRowColCount, setLineRowColCount] = useState(9)
  const [paperMouseMm, setPaperMouseMm] = useState<{ xMm: number; yMm: number } | null>(null)
  const [draftCopyTargetId, setDraftCopyTargetId] = useState('')
  const [storeProfile, setStoreProfile] = useState(() => loadStoreProfile())
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<DragRef | null>(null)
  const savedBaselineRef = useRef<TaxInvoiceFormDesignerState | null>(null)
  const baselineInitializedRef = useRef(false)

  const mergeState = useCallback((recipe: (prev: TaxInvoiceFormDesignerState) => TaxInvoiceFormDesignerState) => {
    setState((prev) => saveTaxInvoiceFormDesignerState(recipe(prev)))
  }, [])

  const activeForm = useMemo(() => getActiveTaxInvoiceForm(state), [state])

  const hasLineItemsOnForm = useMemo(
    () => activeForm.elements.some((e) => e.field === 'line_column' || e.field === 'line_table'),
    [activeForm.elements],
  )

  const otherFormsForDraftCopy = useMemo(
    () => state.forms.filter((f) => f.id !== state.activeFormId),
    [state.forms, state.activeFormId],
  )

  useEffect(() => {
    if (otherFormsForDraftCopy.length === 0) {
      setDraftCopyTargetId('')
      return
    }
    setDraftCopyTargetId((cur) =>
      cur && otherFormsForDraftCopy.some((f) => f.id === cur) ? cur : otherFormsForDraftCopy[0]!.id,
    )
  }, [otherFormsForDraftCopy])

  useEffect(() => {
    const sync = () => setStoreProfile(loadStoreProfile())
    window.addEventListener(STORE_PROFILE_CHANGED_EVENT, sync)
    return () => window.removeEventListener(STORE_PROFILE_CHANGED_EVENT, sync)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(PAPER_DIM_UNIT_KEY, paperDimUnit)
    } catch {
      /* noop */
    }
  }, [paperDimUnit])

  useEffect(() => {
    saveTaxInvoiceDesignerShowGrid(showGrid10mm)
  }, [showGrid10mm])

  useEffect(() => {
    saveTaxInvoiceDesignerShowTractor(showTractorMargins)
  }, [showTractorMargins])

  useEffect(() => {
    saveTaxInvoiceDesignerShowDraftGuides(showDraftGuides)
  }, [showDraftGuides])

  useEffect(() => {
    saveTaxInvoiceDesignerHideDataBlocksPreview(hideDataBlocksPreview)
  }, [hideDataBlocksPreview])

  useLayoutEffect(() => {
    if (!baselineInitializedRef.current && state.forms.length) {
      baselineInitializedRef.current = true
      savedBaselineRef.current = structuredClone(state)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot ครั้งแรกเมื่อมีฟอร์ม; ไม่ผูก `state` ทั้งก้อน (จะถ่ายซ้ำทุกแก้ไข)
  }, [state.forms.length])

  const selected = activeForm.elements.find((e) => e.id === selectedId) ?? null

  useEffect(() => {
    if (selected?.field === 'line_table' || selected?.field === 'line_column') {
      setLineImportDraft(lineItemsToTsvPreview(linePreviewRows))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- โหลดร่าง TSV เมื่อเปลี่ยนบล็อกที่เลือกเท่านั้น
  }, [selected?.field, selected?.id])

  /** แปลง % ภายในพื้นที่พิมพ์ ↔ มม. บนกระดาษ (สำหรับแก้ในคอลัมน์ขวา) */
  const selectedLayoutMm = useMemo(() => {
    if (!selected) return null
    const innerW = Math.max(1, activeForm.pageWidthMm - activeForm.marginLeftMm - activeForm.marginRightMm)
    const innerH = Math.max(1, activeForm.pageHeightMm - activeForm.marginTopMm - activeForm.marginBottomMm)
    return {
      innerW,
      innerH,
      xPageMm: activeForm.marginLeftMm + (selected.x / 100) * innerW,
      yPageMm: activeForm.marginTopMm + (selected.y / 100) * innerH,
      wMm: (selected.w / 100) * innerW,
      hMm: (selected.h / 100) * innerH,
    }
  }, [activeForm, selected])

  const selectedIsDraft = Boolean(selected && isDraftGuideFieldKey(selected.field))

  const draftDimsMinMm = useMemo(() => {
    if (!selected) return { minWmm: 1 as number, minHmm: 1 as number }
    if (selected.field === 'draft_line_v')
      return { minWmm: DRAFT_LINE_MIN_MM, minHmm: DRAFT_RECT_MIN_MM }
    if (selected.field === 'draft_line_h')
      return { minWmm: DRAFT_RECT_MIN_MM, minHmm: DRAFT_LINE_MIN_MM }
    if (isDraftGuideFieldKey(selected.field))
      return { minWmm: DRAFT_RECT_MIN_MM, minHmm: DRAFT_RECT_MIN_MM }
    return { minWmm: 1, minHmm: 1 }
  }, [selected])

  const patchActiveForm = useCallback(
    (patch: Partial<TaxInvoiceFormRecord>) => {
      mergeState((prev) => ({
        ...prev,
        forms: prev.forms.map((f) => (f.id === prev.activeFormId ? { ...f, ...patch } : f)),
      }))
    },
    [mergeState],
  )

  const updateElement = useCallback(
    (id: string, patch: Partial<TaxInvoiceCanvasElement>) => {
      mergeState((prev) => ({
        ...prev,
        forms: prev.forms.map((f) =>
          f.id !== prev.activeFormId
            ? f
            : { ...f, elements: f.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) },
        ),
      }))
    },
    [mergeState],
  )

  const syncLineColumnGroupLayout = useCallback(
    (groupId: string, opts: { yPct?: number; hPct?: number }) => {
      mergeState((prev) => ({
        ...prev,
        forms: prev.forms.map((f) =>
          f.id !== prev.activeFormId
            ? f
            : {
                ...f,
                elements: f.elements.map((e) => {
                  if (e.field !== 'line_column' || e.lineColumnGroupId !== groupId) return e
                  let next = { ...e }
                  if (opts.yPct !== undefined) next.y = clamp(opts.yPct, 0, 100 - e.h)
                  if (opts.hPct !== undefined) next.h = clamp(opts.hPct, 0.5, 100 - next.y)
                  return next
                }),
              },
        ),
      }))
    },
    [mergeState],
  )

  const removeElement = useCallback(
    (id: string) => {
      mergeState((prev) => ({
        ...prev,
        forms: prev.forms.map((f) =>
          f.id !== prev.activeFormId ? f : { ...f, elements: f.elements.filter((e) => e.id !== id) },
        ),
      }))
      setSelectedId((s) => (s === id ? null : s))
    },
    [mergeState],
  )

  const removeLineColumnGroup = useCallback(
    (groupId: string) => {
      mergeState((prev) => ({
        ...prev,
        forms: prev.forms.map((f) =>
          f.id !== prev.activeFormId
            ? f
            : {
                ...f,
                elements: f.elements.filter(
                  (e) => !(e.field === 'line_column' && e.lineColumnGroupId === groupId),
                ),
              },
        ),
      }))
      setSelectedId(null)
    },
    [mergeState],
  )

  const toggleLineItemsOnForm = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        const cols = createLineColumnGroupElements(lineRowColCount)
        const selectId = cols[0]?.id ?? null
        mergeState((prev) => {
          const active = prev.forms.find((f) => f.id === prev.activeFormId)
          if (!active) return prev
          const has = active.elements.some((e) => e.field === 'line_column' || e.field === 'line_table')
          if (has) return prev
          return {
            ...prev,
            forms: prev.forms.map((f) =>
              f.id !== prev.activeFormId ? f : { ...f, elements: [...f.elements, ...cols] },
            ),
          }
        })
        if (selectId) queueMicrotask(() => setSelectedId(selectId))
      } else {
        mergeState((prev) => ({
          ...prev,
          forms: prev.forms.map((f) =>
            f.id !== prev.activeFormId
              ? f
              : {
                  ...f,
                  elements: f.elements.filter((e) => e.field !== 'line_column' && e.field !== 'line_table'),
                },
          ),
        }))
        setSelectedId(null)
      }
    },
    [mergeState, lineRowColCount],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = document.activeElement
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT')) return

      if (!selectedId) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        removeElement(selectedId)
        return
      }

      const stepMm = e.shiftKey ? 10 : 1
      let dxMm = 0
      let dyMm = 0
      if (e.key === 'ArrowLeft') dxMm = -stepMm
      else if (e.key === 'ArrowRight') dxMm = stepMm
      else if (e.key === 'ArrowUp') dyMm = -stepMm
      else if (e.key === 'ArrowDown') dyMm = stepMm
      else return

      e.preventDefault()
      mergeState((prev) => {
        const fid = prev.activeFormId
        const form = prev.forms.find((f) => f.id === fid)
        if (!form) return prev
        const innerW = Math.max(1, form.pageWidthMm - form.marginLeftMm - form.marginRightMm)
        const innerH = Math.max(1, form.pageHeightMm - form.marginTopMm - form.marginBottomMm)
        const dxp = (dxMm / innerW) * 100
        const dyp = (dyMm / innerH) * 100
        const cur = form.elements.find((x) => x.id === selectedId)
        const rowGid =
          cur?.field === 'line_column' && cur.lineColumnGroupId ? cur.lineColumnGroupId : null
        const rowIds = rowGid
          ? new Set(
              form.elements
                .filter((x) => x.field === 'line_column' && x.lineColumnGroupId === rowGid)
                .map((x) => x.id),
            )
          : null
        return {
          ...prev,
          forms: prev.forms.map((f) =>
            f.id !== fid
              ? f
              : {
                  ...f,
                  elements: f.elements.map((el) => {
                    if (rowIds && rowIds.has(el.id) && dyMm !== 0) {
                      return { ...el, y: clamp(el.y + dyp, 0, 100 - el.h) }
                    }
                    if (el.id === selectedId) {
                      let nx = dxMm !== 0 ? clamp(el.x + dxp, 0, 100 - el.w) : el.x
                      if (
                        el.field === 'line_column' &&
                        el.lineColumnGroupId &&
                        dxMm !== 0
                      ) {
                        const grp = form.elements.filter(
                          (x) =>
                            x.field === 'line_column' && x.lineColumnGroupId === el.lineColumnGroupId,
                        )
                        nx = clampLineColumnXPct(grp, selectedId, nx)
                      }
                      const ny = dyMm !== 0 && !rowIds ? clamp(el.y + dyp, 0, 100 - el.h) : el.y
                      return { ...el, x: nx, y: ny }
                    }
                    return el
                  }),
                },
          ),
        }
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, mergeState, removeElement])

  const toggleUniqueField = useCallback(
    (field: StandardBlockField, enabled: boolean) => {
      mergeState((prev) => {
        const active = prev.forms.find((f) => f.id === prev.activeFormId)
        if (!active) return prev
        const matched = active.elements.filter((e) => e.field === field)
        if (enabled) {
          if (matched.length > 0) return prev
          const el = createElementForField(field, active.elements.length)
          queueMicrotask(() => setSelectedId(el.id))
          return {
            ...prev,
            forms: prev.forms.map((f) =>
              f.id === prev.activeFormId ? { ...f, elements: [...f.elements, el] } : f,
            ),
          }
        }
        if (matched.length === 0) return prev
        const removed = new Set(matched.map((m) => m.id))
        setSelectedId((s) => (s && removed.has(s) ? null : s))
        return {
          ...prev,
          forms: prev.forms.map((f) =>
            f.id === prev.activeFormId ? { ...f, elements: f.elements.filter((e) => !removed.has(e.id)) } : f,
          ),
        }
      })
    },
    [mergeState],
  )

  const addCustomTextBlock = useCallback(() => {
    const el: TaxInvoiceCanvasElement = {
      id: newTaxInvoiceElementId(),
      field: 'custom_text',
      x: 10,
      y: 72,
      w: 80,
      h: 8,
      fontSize: 10,
      textAlign: 'left',
      staticText: 'ข้อความที่กำหนดเอง',
    }
    mergeState((prev) => ({
      ...prev,
      forms: prev.forms.map((f) =>
        f.id === prev.activeFormId ? { ...f, elements: [...f.elements, el] } : f,
      ),
    }))
    queueMicrotask(() => setSelectedId(el.id))
  }, [mergeState])

  const addDraftGuide = useCallback(
    (field: 'draft_rect' | 'draft_line_h' | 'draft_line_v') => {
      const el: TaxInvoiceCanvasElement =
        field === 'draft_rect'
          ? { id: newTaxInvoiceElementId(), field, x: 8, y: 12, w: 45, h: 18 }
          : field === 'draft_line_h'
            ? { id: newTaxInvoiceElementId(), field, x: 5, y: 22, w: 85, h: 0.5 }
            : { id: newTaxInvoiceElementId(), field, x: 50, y: 8, w: 0.5, h: 35 }
      mergeState((prev) => ({
        ...prev,
        forms: prev.forms.map((f) =>
          f.id === prev.activeFormId ? { ...f, elements: [...f.elements, el] } : f,
        ),
      }))
      queueMicrotask(() => setSelectedId(el.id))
    },
    [mergeState],
  )

  const copyDraftGuidesToForm = useCallback(
    (targetFormId: string) => {
      if (!targetFormId) return
      mergeState((prev) => {
        const src = prev.forms.find((f) => f.id === prev.activeFormId)
        if (!src || targetFormId === prev.activeFormId) return prev
        if (!prev.forms.some((f) => f.id === targetFormId)) return prev
        const drafts = src.elements.filter((el) => isDraftGuideFieldKey(el.field))
        if (drafts.length === 0) {
          window.alert('ฟอร์มนี้ยังไม่มีกรอบหรือเส้นแบบร่าง')
          return prev
        }
        const clones = drafts.map((el) => ({ ...el, id: newTaxInvoiceElementId() }))
        return {
          ...prev,
          forms: prev.forms.map((f) =>
            f.id === targetFormId ? { ...f, elements: [...f.elements, ...clones] } : f,
          ),
        }
      })
    },
    [mergeState],
  )

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const dx = ((e.clientX - d.startClientX) / rect.width) * 100
      const dy = ((e.clientY - d.startClientY) / rect.height) * 100
      const nxRaw = clamp(d.origX + dx, 0, 100 - d.w)
      const ny = clamp(d.origY + dy, 0, 100 - d.h)
      const ddy = ny - d.origY
      setState((prev) => {
        const form = prev.forms.find((ff) => ff.id === prev.activeFormId)
        const dragged = form?.elements.find((e) => e.id === d.id)
        let nx = nxRaw
        if (dragged?.field === 'line_column' && dragged.lineColumnGroupId && form) {
          const grp = form.elements.filter(
            (e) => e.field === 'line_column' && e.lineColumnGroupId === dragged.lineColumnGroupId,
          )
          nx = clampLineColumnXPct(grp, d.id, nxRaw)
        }
        return {
          ...prev,
          forms: prev.forms.map((f) =>
            f.id !== prev.activeFormId
              ? f
              : {
                  ...f,
                  elements: f.elements.map((el) => {
                    if (
                      d.lineRowGroup &&
                      el.field === 'line_column' &&
                      el.lineColumnGroupId === d.lineRowGroup.groupId
                    ) {
                      const oy = d.lineRowGroup.origYs[el.id] ?? el.y
                      const newY = clamp(oy + ddy, 0, 100 - el.h)
                      if (el.id === d.id) return { ...el, x: nx, y: newY }
                      return { ...el, y: newY }
                    }
                    if (el.id === d.id) return { ...el, x: nx, y: ny }
                    return el
                  }),
                },
          ),
        }
      })
    }
    const up = () => {
      if (!dragRef.current) return
      dragRef.current = null
      setState((prev) => saveTaxInvoiceFormDesignerState(prev))
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

  const onPointerDownElement = (e: React.PointerEvent, el: TaxInvoiceCanvasElement) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    setSelectedId(el.id)
    let lineRowGroup: DragRef['lineRowGroup']
    if (el.field === 'line_column' && el.lineColumnGroupId) {
      const gid = el.lineColumnGroupId
      const origYs: Record<string, number> = {}
      for (const x of activeForm.elements) {
        if (x.field === 'line_column' && x.lineColumnGroupId === gid) origYs[x.id] = x.y
      }
      lineRowGroup = { groupId: gid, origYs }
    }
    dragRef.current = {
      id: el.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: el.x,
      origY: el.y,
      w: el.w,
      h: el.h,
      lineRowGroup,
    }
  }

  const revertToSavedBaseline = () => {
    const baseline = savedBaselineRef.current
    if (!baseline) return
    if (!window.confirm('คืนค่าตามที่กดบันทึกล่าสุด? การแก้หลังบันทึกจะหาย')) return
    const clone = structuredClone(baseline)
    setState(clone)
    saveTaxInvoiceFormDesignerState(clone)
    setSelectedId(null)
  }

  const addNewForm = () => {
    const id = newTaxInvoiceFormId()
    const body = defaultTaxInvoiceFormBody(`ฟอร์มใหม่ ${state.forms.length + 1}`)
    mergeState((prev) => ({
      version: 1,
      activeFormId: id,
      forms: [{ id, ...body }, ...prev.forms],
    }))
    setSelectedId(null)
  }

  const duplicateActiveForm = () => {
    const id = newTaxInvoiceFormId()
    const copy: TaxInvoiceFormRecord = {
      ...activeForm,
      id,
      name: `${activeForm.name} (สำเนา)`,
      elements: activeForm.elements.map((e) => ({ ...e, id: newTaxInvoiceElementId() })),
    }
    mergeState((prev) => ({
      version: 1,
      activeFormId: id,
      forms: [copy, ...prev.forms],
    }))
    setSelectedId(null)
  }

  const deleteActiveForm = () => {
    if (state.forms.length <= 1) {
      window.alert('ต้องมีอย่างน้อยหนึ่งฟอร์ม')
      return
    }
    if (!window.confirm(`ลบฟอร์ม «${activeForm.name}»?`)) return
    mergeState((prev) => {
      const idx = prev.forms.findIndex((f) => f.id === prev.activeFormId)
      if (idx < 0) return prev
      const next = prev.forms.filter((f) => f.id !== prev.activeFormId)
      if (next.length === 0) return prev
      const newIdx = Math.min(idx, next.length - 1)
      return { version: 1, activeFormId: next[newIdx]!.id, forms: next }
    })
    setSelectedId(null)
  }

  const switchForm = (id: string) => {
    setSelectedId(null)
    mergeState((prev) => ({ ...prev, activeFormId: id }))
  }

  const applyPaperPreset = (presetId: string) => {
    const p = TAX_INVOICE_PAPER_PRESETS.find((x) => x.id === presetId)
    if (!p) return
    const { w: chamberW, h: chamberH } = TAX_INVOICE_TITLE_CHAMBER_MM
    mergeState((prev) => ({
      ...prev,
      forms: prev.forms.map((f) => {
        if (f.id !== prev.activeFormId) return f
        const next: TaxInvoiceFormRecord = { ...f, pageWidthMm: p.w, pageHeightMm: p.h }
        if (presetId !== 'cont9x7') return next
        const innerW = Math.max(1, p.w - f.marginLeftMm - f.marginRightMm)
        const innerH = Math.max(1, p.h - f.marginTopMm - f.marginBottomMm)
        if (innerW < chamberW) return next
        const wPct = (chamberW / innerW) * 100
        const leftPct = ((innerW - chamberW) / innerW) * 100
        const hPct = (chamberH / innerH) * 100
        return {
          ...next,
          elements: f.elements.map((e) =>
            e.field === 'title_th'
              ? { ...e, x: leftPct, y: 0, w: wPct, h: hPct }
              : e,
          ),
        }
      }),
    }))
  }

  const printSample = () => {
    const html = buildTaxInvoiceFormPrintHtml(activeForm, storeProfile, { lineRows: linePreviewRows })
    void printTaxInvoiceHtmlPreferSystemDialog(html).catch(() => {
      window.alert('ไม่สามารถเปิดกล่องพิมพ์ได้')
    })
  }

  const activePresetId = useMemo(() => {
    const match = TAX_INVOICE_PAPER_PRESETS.find(
      (p) => Math.abs(p.w - activeForm.pageWidthMm) < 0.6 && Math.abs(p.h - activeForm.pageHeightMm) < 0.6,
    )
    return match?.id ?? ''
  }, [activeForm.pageWidthMm, activeForm.pageHeightMm])

  return (
    <div className={clsx('flex min-h-0 flex-1 flex-col gap-3 overflow-hidden', className)}>
      <div className="flex shrink-0 flex-col gap-2 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 to-white px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setSettingsToolbarOpen((v) => !v)}
            aria-expanded={settingsToolbarOpen}
            aria-label={settingsToolbarOpen ? 'ย่อแถบตั้งค่าฟอร์มและกระดาษ' : 'ขยายแถบตั้งค่าฟอร์มและกระดาษ'}
            className="flex min-w-0 flex-1 items-start gap-2 rounded-xl px-1 py-0.5 text-left transition hover:bg-amber-100/60"
          >
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-amber-200/80 bg-white text-amber-900 shadow-sm">
              {settingsToolbarOpen ? <ChevronUp className="size-4" aria-hidden /> : <ChevronDown className="size-4" aria-hidden />}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-slate-800">ออกแบบฟอร์มใบกำกับภาษี (ลากวาง)</span>
              <span className="mt-0.5 block text-[10px] font-normal text-slate-500">
                {settingsToolbarOpen ? 'แตะลูกศรเพื่อย่อแถบตั้งค่า' : 'แตะเพื่อขยาย — ฟอร์ม ขนาดกระดาษ ขอบ'}
              </span>
            </span>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-700">
              ซูม
              <input
                type="range"
                min={0.45}
                max={1.4}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-24"
              />
              <span className="tabular-nums">{zoom.toFixed(2)}×</span>
            </label>
            <button
              type="button"
              onClick={printSample}
              title="แอป Windows เปิดกล่องพิมพ์ของระบบโดยตรง — ตรงกับ Ctrl+Shift+P ในเบราว์เซอร์"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
            >
              <Printer className="size-3.5" />
              พิมพ์ตัวอย่าง
            </button>
            <button
              type="button"
              onClick={() => {
                setState((prev) => {
                  const saved = saveTaxInvoiceFormDesignerState(prev)
                  savedBaselineRef.current = structuredClone(saved)
                  window.dispatchEvent(new Event(TAX_INVOICE_FORM_DESIGNER_CHANGED_EVENT))
                  return saved
                })
                window.alert('บันทึกฟอร์มแล้ว')
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
            >
              <Save className="size-3.5" />
              บันทึก
            </button>
            <button
              type="button"
              onClick={revertToSavedBaseline}
              title="คืนทุกฟอร์มตามจุดที่กดบันทึกล่าสุด"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="size-3.5" />
              ค่าเริ่มต้น
            </button>
          </div>
        </div>

        {settingsToolbarOpen ? (
          <>
            <p className="text-[11px] text-slate-600">
              เลือกขนาดกระดาษ · หลายฟอร์ม · กด <strong className="font-medium text-slate-700">บันทึก</strong> เพื่อจุดอ้างอิง —{' '}
              <strong className="font-medium text-slate-700">ค่าเริ่มต้น</strong> คืนตามที่บันทึกล่าสุด — ตัวอย่างเป็นข้อมูลจำลอง
            </p>

        <div className="flex flex-wrap items-end gap-2 border-t border-amber-100/80 pt-2">
          <label className="min-w-[10rem] flex-1">
            <span className="mb-0.5 block text-[10px] font-medium text-slate-600">ฟอร์มที่กำลังแก้</span>
            <select
              value={state.activeFormId}
              onChange={(e) => switchForm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-900"
            >
              {state.forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name || 'ไม่มีชื่อ'} ({formatMmPairForUnit(f.pageWidthMm, f.pageHeightMm, paperDimUnit)})
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[12rem] flex-[2]">
            <span className="mb-0.5 block text-[10px] font-medium text-slate-600">ชื่อฟอร์ม</span>
            <input
              type="text"
              value={activeForm.name}
              onChange={(e) => patchActiveForm({ name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-slate-900"
              placeholder="ตั้งชื่อให้จำง่าย"
            />
          </label>
          <label className="min-w-[11rem]">
            <span className="mb-0.5 block text-[10px] font-medium text-slate-600">ขนาดกระดาษ (preset)</span>
            <select
              value={activePresetId}
              onChange={(e) => applyPaperPreset(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-900"
            >
              <option value="">
                กำหนดเอง ({paperDimUnit === 'mm' ? 'กรอก มม.' : 'กรอก นิ้ว'} ด้านล่าง)
              </option>
              {TAX_INVOICE_PAPER_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={addNewForm}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-400 bg-amber-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-700"
          >
            <Plus className="size-3.5" />
            เพิ่มฟอร์ม
          </button>
          <button
            type="button"
            onClick={duplicateActiveForm}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
          >
            <CopyPlus className="size-3.5" />
            สำเนา
          </button>
          <button
            type="button"
            onClick={deleteActiveForm}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] text-red-800 hover:bg-red-50"
          >
            <Trash2 className="size-3.5" />
            ลบฟอร์ม
          </button>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-amber-100/80 pt-2 text-[11px]">
          <label className="inline-flex flex-col">
            <span className="text-[10px] font-medium text-slate-600">หน่วยกระดาษ</span>
            <select
              value={paperDimUnit}
              onChange={(e) => setPaperDimUnit(e.target.value as PaperDimUnit)}
              className="mt-0.5 min-w-[9.5rem] rounded border border-slate-200 bg-white px-2 py-1 text-[11px]"
            >
              <option value="mm">มิลลิเมตร (มม.)</option>
              <option value="inch">นิ้ว (in)</option>
            </select>
          </label>
          <label className="inline-flex flex-col">
            <span className="text-[10px] font-medium text-slate-600">
              กว้าง ({paperDimUnit === 'mm' ? 'มม.' : 'นิ้ว'})
            </span>
            <input
              type="number"
              min={paperDimUnit === 'mm' ? PAGE_MIN_MM : mmToIn(PAGE_MIN_MM)}
              max={paperDimUnit === 'mm' ? PAGE_MAX_MM : mmToIn(PAGE_MAX_MM)}
              step={paperDimUnit === 'mm' ? 0.1 : 0.001}
              value={
                paperDimUnit === 'mm'
                  ? activeForm.pageWidthMm
                  : Math.round(mmToIn(activeForm.pageWidthMm) * 10000) / 10000
              }
              onChange={(e) => {
                const raw = Number(e.target.value)
                if (!Number.isFinite(raw)) return
                patchActiveForm({
                  pageWidthMm: clampPageMm(
                    paperDimUnit === 'mm' ? raw : inToMm(raw),
                    activeForm.pageWidthMm,
                  ),
                })
              }}
              className="mt-0.5 w-24 rounded border border-slate-200 px-2 py-1"
            />
          </label>
          <label className="inline-flex flex-col">
            <span className="text-[10px] font-medium text-slate-600">
              สูง ({paperDimUnit === 'mm' ? 'มม.' : 'นิ้ว'})
            </span>
            <input
              type="number"
              min={paperDimUnit === 'mm' ? PAGE_MIN_MM : mmToIn(PAGE_MIN_MM)}
              max={paperDimUnit === 'mm' ? PAGE_MAX_MM : mmToIn(PAGE_MAX_MM)}
              step={paperDimUnit === 'mm' ? 0.1 : 0.001}
              value={
                paperDimUnit === 'mm'
                  ? activeForm.pageHeightMm
                  : Math.round(mmToIn(activeForm.pageHeightMm) * 10000) / 10000
              }
              onChange={(e) => {
                const raw = Number(e.target.value)
                if (!Number.isFinite(raw)) return
                patchActiveForm({
                  pageHeightMm: clampPageMm(
                    paperDimUnit === 'mm' ? raw : inToMm(raw),
                    activeForm.pageHeightMm,
                  ),
                })
              }}
              className="mt-0.5 w-24 rounded border border-slate-200 px-2 py-1"
            />
          </label>
          <span className="text-[10px] font-semibold text-slate-500 self-end pb-1">
            ขอบกระดาษ ({paperDimUnit === 'mm' ? 'มม.' : 'นิ้ว'})
          </span>
          <label className="inline-flex flex-col">
            <span className="text-[10px] font-medium text-slate-600">บน</span>
            <input
              type="number"
              min={0}
              max={paperDimUnit === 'mm' ? MARGIN_MAX_MM : mmToIn(MARGIN_MAX_MM)}
              step={paperDimUnit === 'mm' ? 0.1 : 0.001}
              value={
                paperDimUnit === 'mm'
                  ? activeForm.marginTopMm
                  : Math.round(mmToIn(activeForm.marginTopMm) * 10000) / 10000
              }
              onChange={(e) => {
                const raw = Number(e.target.value)
                if (!Number.isFinite(raw)) return
                patchActiveForm({
                  marginTopMm: clampMarginMm(paperDimUnit === 'mm' ? raw : inToMm(raw)),
                })
              }}
              className="mt-0.5 w-16 rounded border border-slate-200 px-2 py-1"
            />
          </label>
          <label className="inline-flex flex-col">
            <span className="text-[10px] font-medium text-slate-600">ขวา</span>
            <input
              type="number"
              min={0}
              max={paperDimUnit === 'mm' ? MARGIN_MAX_MM : mmToIn(MARGIN_MAX_MM)}
              step={paperDimUnit === 'mm' ? 0.1 : 0.001}
              value={
                paperDimUnit === 'mm'
                  ? activeForm.marginRightMm
                  : Math.round(mmToIn(activeForm.marginRightMm) * 10000) / 10000
              }
              onChange={(e) => {
                const raw = Number(e.target.value)
                if (!Number.isFinite(raw)) return
                patchActiveForm({
                  marginRightMm: clampMarginMm(paperDimUnit === 'mm' ? raw : inToMm(raw)),
                })
              }}
              className="mt-0.5 w-16 rounded border border-slate-200 px-2 py-1"
            />
          </label>
          <label className="inline-flex flex-col">
            <span className="text-[10px] font-medium text-slate-600">ล่าง</span>
            <input
              type="number"
              min={0}
              max={paperDimUnit === 'mm' ? MARGIN_MAX_MM : mmToIn(MARGIN_MAX_MM)}
              step={paperDimUnit === 'mm' ? 0.1 : 0.001}
              value={
                paperDimUnit === 'mm'
                  ? activeForm.marginBottomMm
                  : Math.round(mmToIn(activeForm.marginBottomMm) * 10000) / 10000
              }
              onChange={(e) => {
                const raw = Number(e.target.value)
                if (!Number.isFinite(raw)) return
                patchActiveForm({
                  marginBottomMm: clampMarginMm(paperDimUnit === 'mm' ? raw : inToMm(raw)),
                })
              }}
              className="mt-0.5 w-16 rounded border border-slate-200 px-2 py-1"
            />
          </label>
          <label className="inline-flex flex-col">
            <span className="text-[10px] font-medium text-slate-600">ซ้าย</span>
            <input
              type="number"
              min={0}
              max={paperDimUnit === 'mm' ? MARGIN_MAX_MM : mmToIn(MARGIN_MAX_MM)}
              step={paperDimUnit === 'mm' ? 0.1 : 0.001}
              value={
                paperDimUnit === 'mm'
                  ? activeForm.marginLeftMm
                  : Math.round(mmToIn(activeForm.marginLeftMm) * 10000) / 10000
              }
              onChange={(e) => {
                const raw = Number(e.target.value)
                if (!Number.isFinite(raw)) return
                patchActiveForm({
                  marginLeftMm: clampMarginMm(paperDimUnit === 'mm' ? raw : inToMm(raw)),
                })
              }}
              className="mt-0.5 w-16 rounded border border-slate-200 px-2 py-1"
            />
          </label>
          <button
            type="button"
            onClick={() => patchActiveForm({ elements: defaultStackedElements() })}
            className="self-end rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-700 hover:bg-slate-50"
          >
            จัดวางเริ่มต้นใหม่
          </button>
        </div>
          </>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,14rem)_1fr_minmax(0,13rem)]">
        <aside className="flex min-h-0 flex-col gap-2 overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <p className="text-[11px] font-semibold text-slate-700">บล็อกบนแบบฟอร์ม</p>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 hover:border-amber-300 hover:bg-amber-50/80">
            <input
              type="checkbox"
              checked={hideDataBlocksPreview}
              onChange={(e) => setHideDataBlocksPreview(e.target.checked)}
              className="mt-0.5 size-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="min-w-0 text-[10px] font-medium leading-snug text-slate-800">
              ซ่อนบล็อกข้อมูลบนแคนวาส — เห็นเฉพาะแบบร่าง (ทาบฟอร์ม)
            </span>
          </label>
          <p className="text-[8px] leading-snug text-slate-500">
            พิมพ์ตัวอย่างไม่รวมเส้น/กรอบแบบร่าง
          </p>
          <div className="flex flex-col gap-1.5">
            {UNIQUE_FIELDS.map((field) => {
              const checked = activeForm.elements.some((e) => e.field === field)
              return (
                <label
                  key={field}
                  className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 hover:border-amber-300 hover:bg-amber-50/80"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggleUniqueField(field, e.target.checked)}
                    className="mt-0.5 size-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="min-w-0 text-[11px] font-medium text-slate-800">{taxInvoiceFieldLabelTh(field)}</span>
                </label>
              )
            })}
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-2">
            <p className="text-[10px] font-semibold text-sky-950">แถวรายการสินค้า</p>
            <p className="mt-0.5 text-[8px] leading-snug text-sky-900/80">
              แยกกล่องต่อคอลัมน์ทาบเส้นฟอร์ม — ลากซ้าย/ขวาแต่ละช่อง · ลากบน/ลงทั้งแถว
            </p>
            <label className="mt-2 block">
              <span className="text-[9px] font-medium text-slate-700">จำนวนหัวข้อ (ตอนสร้าง)</span>
              <select
                value={lineRowColCount}
                disabled={hasLineItemsOnForm}
                onChange={(e) => setLineRowColCount(Number(e.target.value))}
                className="mt-0.5 w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-900 disabled:opacity-50"
              >
                {Array.from(
                  { length: LINE_TABLE_COL_COUNT_MAX - LINE_TABLE_COL_COUNT_MIN + 1 },
                  (_, i) => LINE_TABLE_COL_COUNT_MIN + i,
                ).map((n) => (
                  <option key={n} value={n}>
                    {n} คอลัมน์
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-lg border border-white bg-white px-2 py-1.5">
              <input
                type="checkbox"
                checked={hasLineItemsOnForm}
                onChange={(e) => toggleLineItemsOnForm(e.target.checked)}
                className="mt-0.5 size-3.5 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="min-w-0 text-[11px] font-medium text-slate-800">แสดงแถวรายการบนฟอร์ม</span>
            </label>
          </div>
          <button
            type="button"
            onClick={addCustomTextBlock}
            className="rounded-lg border border-dashed border-amber-400 bg-amber-50/80 px-2 py-1.5 text-[11px] font-medium text-amber-900 hover:bg-amber-100/80"
          >
            + เพิ่มข้อความกำหนดเอง
          </button>
          <div className="rounded-xl border border-slate-200 bg-white p-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-semibold text-slate-700">แบบร่าง (เส้น / กรอบ)</p>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-[9px] font-medium text-slate-500">แสดง</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showDraftGuides}
                  aria-label={
                    showDraftGuides
                      ? 'แสดงเส้นและกรอบแบบร่างบนแคนวาสอยู่ — กดเพื่อซ่อน'
                      : 'ซ่อนเส้นและกรอบแบบร่างบนแคนวาสอยู่ — กดเพื่อแสดง'
                  }
                  title={showDraftGuides ? 'ซ่อนบนแคนวาส (ยังอยู่ในฟอร์ม)' : 'แสดงบนแคนวาส'}
                  onClick={() => setShowDraftGuides((v) => !v)}
                  className={clsx(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-1',
                    showDraftGuides ? 'border-violet-600 bg-violet-500' : 'border-slate-300 bg-slate-200',
                  )}
                >
                  <span
                    className={clsx(
                      'pointer-events-none absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200',
                      showDraftGuides ? 'translate-x-4' : 'translate-x-0.5',
                    )}
                  />
                </button>
              </div>
            </div>
            <p className="mt-0.5 text-[9px] leading-snug text-slate-500">
              วาดโครงบนกระดาษก่อน แล้วคัดลอกไปฟอร์มที่มีบล็อกข้อมูลจริง
            </p>
            <div className="mt-2 grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => addDraftGuide('draft_rect')}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-left text-[10px] font-medium text-slate-800 hover:bg-slate-100"
              >
                + กรอบสี่เหลี่ยม
              </button>
              <button
                type="button"
                onClick={() => addDraftGuide('draft_line_h')}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-left text-[10px] font-medium text-slate-800 hover:bg-slate-100"
              >
                + เส้นนอน
              </button>
              <button
                type="button"
                onClick={() => addDraftGuide('draft_line_v')}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-left text-[10px] font-medium text-slate-800 hover:bg-slate-100"
              >
                + เส้นตั้ง
              </button>
            </div>
            <label className="mt-2 block text-[9px] font-medium text-slate-600">
              คัดลอกแบบร่างไปฟอร์ม
              <select
                value={draftCopyTargetId}
                onChange={(e) => setDraftCopyTargetId(e.target.value)}
                disabled={otherFormsForDraftCopy.length === 0}
                className="mt-0.5 w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-900 disabled:opacity-50"
              >
                {otherFormsForDraftCopy.length === 0 ? (
                  <option value="">ไม่มีฟอร์มอื่น</option>
                ) : (
                  otherFormsForDraftCopy.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name || 'ไม่มีชื่อ'}
                    </option>
                  ))
                )}
              </select>
            </label>
            <button
              type="button"
              disabled={otherFormsForDraftCopy.length === 0 || !draftCopyTargetId}
              onClick={() => copyDraftGuidesToForm(draftCopyTargetId)}
              className="mt-1.5 w-full rounded-lg border border-violet-300 bg-violet-600 py-1.5 text-[10px] font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              คัดลอกเส้นและกรอบไปฟอร์มนี้
            </button>
          </div>
          <p className="flex items-start gap-1.5 rounded-lg border border-amber-100 bg-amber-50/80 px-2 py-1.5 text-[9px] leading-snug text-amber-950">
            <Store className="mt-0.5 size-3 shrink-0" aria-hidden />
            <span>
              ข้อมูลผู้ขายตัวอย่างจากโปรไฟล์ร้าน: <strong className="font-semibold">{storeProfile.storeName || '—'}</strong>
            </span>
          </p>
        </aside>

        <div className="min-h-0 overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-slate-100/90 p-4 pt-7">
          <div className="flex justify-center">
            <div className="origin-top" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
              <TaxInvoiceFormCanvasBody
                form={activeForm}
                storeProfile={storeProfile}
                selectedId={selectedId}
                interactive
                contentAreaRef={canvasRef}
                onPointerDownContentArea={() => setSelectedId(null)}
                onPointerDownElement={onPointerDownElement}
                designerAssist={{
                  showGrid10mm,
                  showTractorMargins,
                  showDraftGuides,
                  hideDataBlocksPreview,
                }}
                linePreviewRows={linePreviewRows}
                onDesignerPaperPointerMm={setPaperMouseMm}
              />
            </div>
          </div>
          <p className="mx-auto mt-3 max-w-xl text-center text-[10px] text-slate-500">
            พื้นที่พิมพ์ {formatMmPairForUnit(activeForm.pageWidthMm, activeForm.pageHeightMm, paperDimUnit)} (
            {formatMmPairForUnit(
              activeForm.pageWidthMm,
              activeForm.pageHeightMm,
              paperDimUnit === 'mm' ? 'inch' : 'mm',
            )}
            ) — ลากกรอบบล็อกในพื้นที่ขาว (ภายในขอบ)
          </p>
        </div>

        <aside className="flex min-h-0 flex-col gap-2 overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-white p-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-2.5">
            <p className="text-[10px] font-semibold text-slate-700">ตั้งค่ากระดาษ (ทาบฟอร์มสำเร็จ)</p>
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-white bg-white px-2 py-1.5">
              <span className="text-[9px] font-medium text-slate-500">พิกัดเมาส์ (มม.)</span>
              <span className="font-mono text-[12px] font-semibold tabular-nums text-sky-700">
                {paperMouseMm ? `${paperMouseMm.xMm.toFixed(1)}, ${paperMouseMm.yMm.toFixed(1)}` : '—'}
              </span>
            </div>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-[10px] text-slate-700">
              <input
                type="checkbox"
                checked={showGrid10mm}
                onChange={(e) => setShowGrid10mm(e.target.checked)}
                className="size-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              แสดงกริด 10×10 มม. ในพื้นที่พิมพ์
            </label>
            <label className="mt-1.5 flex cursor-pointer items-start gap-2 text-[10px] text-slate-700">
              <input
                type="checkbox"
                checked={showTractorMargins}
                onChange={(e) => setShowTractorMargins(e.target.checked)}
                className="mt-0.5 size-3.5 shrink-0 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span>
                แสดงขอบรูเจาต่อเนื่อง (ซ้าย/ขวา){' '}
                <span className="text-rose-600">โซนห้ามพิมพ์บนกระดาษจริง</span>
              </span>
            </label>
            <p className="mt-2 text-[9px] leading-snug text-slate-500">
              ลูกศรเลื่อนบล็อกทีละ 1 มม. · Shift+ลูกศร 10 มม. · Del / Backspace ลบบล็อก
            </p>
          </div>
          <p className="text-[11px] font-semibold text-slate-700">คุณสมบัติบล็อก</p>
          {selected && selectedLayoutMm ? (
            <div className="space-y-2 text-[11px]">
              <p className="text-slate-600">{taxInvoiceFieldLabelTh(selected.field)}</p>
              <p className="text-[9px] leading-snug text-slate-500">
                {selectedIsDraft ? (
                  <>
                    กรอบ/เส้นแบบร่าง — X/Y มุมซ้ายบนกล่องเทียบขอบกระดาษ · ปรับความยาวเส้นหรือขนาดกรอบเป็นมม. พิมพ์ตัวอย่างจะเห็นเส้นช่วยทาบกระดาษฟอร์มสำเร็จ
                  </>
                ) : (
                  <>
                    X / Y มุมซ้ายบนของ<strong className="font-medium text-slate-600">กล่อง</strong>เทียบขอบกระดาษ · กว้าง×สูงกล่อง (มม.) — หัวข้อไทยตั้งระยะข้อความจากขอบซ้ายบนของกล่อง (มม.) ด้านล่าง
                  </>
                )}
              </p>
              {selected.field === 'title_th' ? (
                <>
                  <label className="block">
                    <span className="text-slate-600">ข้อความหัวข้อ</span>
                    <textarea
                      value={selected.staticText ?? ''}
                      onChange={(e) => updateElement(selected.id, { staticText: e.target.value.slice(0, 2000) })}
                      rows={2}
                      placeholder="ว่างไว้ = ใบกำกับภาษี / ใบเสร็จรับเงิน"
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-[11px]"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-slate-600">ข้อความห่างขอบซ้ายกล่อง (มม.)</span>
                      <input
                        type="number"
                        min={0}
                        max={Math.min(150, Math.max(0.1, selectedLayoutMm.wMm - 0.05))}
                        step={0.1}
                        value={Math.round((selected.textInsetLeftMm ?? 0) * 10) / 10}
                        onChange={(e) => {
                          const raw = Number(e.target.value)
                          if (!Number.isFinite(raw)) return
                          const cap = Math.min(150, Math.max(0, selectedLayoutMm.wMm - 0.05))
                          updateElement(selected.id, { textInsetLeftMm: clamp(raw, 0, cap) })
                        }}
                        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 font-mono tabular-nums"
                      />
                    </label>
                    <label className="block">
                      <span className="text-slate-600">ข้อความห่างขอบบนกล่อง (มม.)</span>
                      <input
                        type="number"
                        min={0}
                        max={Math.min(150, Math.max(0.1, selectedLayoutMm.hMm - 0.05))}
                        step={0.1}
                        value={Math.round((selected.textInsetTopMm ?? 0) * 10) / 10}
                        onChange={(e) => {
                          const raw = Number(e.target.value)
                          if (!Number.isFinite(raw)) return
                          const cap = Math.min(150, Math.max(0, selectedLayoutMm.hMm - 0.05))
                          updateElement(selected.id, { textInsetTopMm: clamp(raw, 0, cap) })
                        }}
                        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 font-mono tabular-nums"
                      />
                    </label>
                  </div>
                </>
              ) : null}
              {selected.field === 'seller_block' ||
              selected.field === 'buyer_block' ||
              selected.field === 'doc_meta' ||
              selected.field === 'staff' ? (
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-slate-600">ข้อความห่างขอบซ้ายกล่อง (มม.)</span>
                    <input
                      type="number"
                      min={0}
                      max={Math.min(150, Math.max(0.1, selectedLayoutMm.wMm - 0.05))}
                      step={0.1}
                      value={Math.round((selected.textInsetLeftMm ?? 0) * 10) / 10}
                      onChange={(e) => {
                        const raw = Number(e.target.value)
                        if (!Number.isFinite(raw)) return
                        const cap = Math.min(150, Math.max(0, selectedLayoutMm.wMm - 0.05))
                        updateElement(selected.id, { textInsetLeftMm: clamp(raw, 0, cap) })
                      }}
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 font-mono tabular-nums"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-600">ข้อความห่างขอบบนกล่อง (มม.)</span>
                    <input
                      type="number"
                      min={0}
                      max={Math.min(150, Math.max(0.1, selectedLayoutMm.hMm - 0.05))}
                      step={0.1}
                      value={Math.round((selected.textInsetTopMm ?? 0) * 10) / 10}
                      onChange={(e) => {
                        const raw = Number(e.target.value)
                        if (!Number.isFinite(raw)) return
                        const cap = Math.min(150, Math.max(0, selectedLayoutMm.hMm - 0.05))
                        updateElement(selected.id, { textInsetTopMm: clamp(raw, 0, cap) })
                      }}
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 font-mono tabular-nums"
                    />
                  </label>
                </div>
              ) : null}
              {selected.field === 'custom_text' ? (
                <label className="block">
                  <span className="text-slate-600">ข้อความ</span>
                  <textarea
                    value={selected.staticText ?? ''}
                    onChange={(e) => updateElement(selected.id, { staticText: e.target.value.slice(0, 2000) })}
                    rows={3}
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-[11px]"
                  />
                </label>
              ) : null}
              <label className="block">
                <span className="text-slate-600">กว้าง (มม.)</span>
                <input
                  type="number"
                  min={draftDimsMinMm.minWmm}
                  max={Math.max(draftDimsMinMm.minWmm, selectedLayoutMm.innerW)}
                  step={0.1}
                  value={Math.round(selectedLayoutMm.wMm * 10) / 10}
                  onChange={(e) => {
                    const raw = Number(e.target.value)
                    if (!Number.isFinite(raw)) return
                    const { innerW } = selectedLayoutMm
                    const minPct = (draftDimsMinMm.minWmm / innerW) * 100
                    let wPct = clamp((raw / innerW) * 100, minPct, 100 - selected.x)
                    if (selected.field === 'line_column' && selected.lineColumnGroupId) {
                      mergeState((prev) => {
                        const f = prev.forms.find((ff) => ff.id === prev.activeFormId)
                        if (!f) return prev
                        const grp = f.elements.filter(
                          (el) =>
                            el.field === 'line_column' &&
                            el.lineColumnGroupId === selected.lineColumnGroupId,
                        )
                        const wFinal = clampLineColumnWPct(grp, selected.id, wPct)
                        return {
                          ...prev,
                          forms: prev.forms.map((ff) =>
                            ff.id !== prev.activeFormId
                              ? ff
                              : {
                                  ...ff,
                                  elements: ff.elements.map((el) =>
                                    el.id === selected.id ? { ...el, w: wFinal } : el,
                                  ),
                                },
                          ),
                        }
                      })
                      return
                    }
                    updateElement(selected.id, { w: wPct })
                  }}
                  className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 font-mono tabular-nums"
                />
              </label>
              <label className="block">
                <span className="text-slate-600">สูง (มม.)</span>
                <input
                  type="number"
                  min={draftDimsMinMm.minHmm}
                  max={Math.max(draftDimsMinMm.minHmm, selectedLayoutMm.innerH)}
                  step={0.1}
                  value={Math.round(selectedLayoutMm.hMm * 10) / 10}
                  onChange={(e) => {
                    const raw = Number(e.target.value)
                    if (!Number.isFinite(raw)) return
                    const { innerH } = selectedLayoutMm
                    const minPct = (draftDimsMinMm.minHmm / innerH) * 100
                    const hPct = clamp((raw / innerH) * 100, minPct, 100 - selected.y)
                    if (selected.field === 'line_column' && selected.lineColumnGroupId) {
                      syncLineColumnGroupLayout(selected.lineColumnGroupId, { hPct })
                      return
                    }
                    updateElement(selected.id, { h: hPct })
                  }}
                  className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 font-mono tabular-nums"
                />
              </label>
              <label className="block">
                <span className="text-slate-600">ตำแหน่ง X (มม.)</span>
                <input
                  type="number"
                  min={0}
                  max={Math.max(0, activeForm.pageWidthMm - 1)}
                  step={0.1}
                  value={Math.round(selectedLayoutMm.xPageMm * 10) / 10}
                  onChange={(e) => {
                    const raw = Number(e.target.value)
                    if (!Number.isFinite(raw)) return
                    const { innerW } = selectedLayoutMm
                    const xPct = ((raw - activeForm.marginLeftMm) / innerW) * 100
                    if (selected.field === 'line_column' && selected.lineColumnGroupId) {
                      mergeState((prev) => {
                        const f = prev.forms.find((ff) => ff.id === prev.activeFormId)
                        if (!f) return prev
                        const grp = f.elements.filter(
                          (el) =>
                            el.field === 'line_column' &&
                            el.lineColumnGroupId === selected.lineColumnGroupId,
                        )
                        const xFinal = clampLineColumnXPct(grp, selected.id, xPct)
                        return {
                          ...prev,
                          forms: prev.forms.map((ff) =>
                            ff.id !== prev.activeFormId
                              ? ff
                              : {
                                  ...ff,
                                  elements: ff.elements.map((el) =>
                                    el.id === selected.id ? { ...el, x: xFinal } : el,
                                  ),
                                },
                          ),
                        }
                      })
                      return
                    }
                    updateElement(selected.id, { x: clamp(xPct, 0, 100 - selected.w) })
                  }}
                  className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 font-mono tabular-nums"
                />
              </label>
              <label className="block">
                <span className="text-slate-600">ตำแหน่ง Y (มม.)</span>
                <input
                  type="number"
                  min={0}
                  max={Math.max(0, activeForm.pageHeightMm - 1)}
                  step={0.1}
                  value={Math.round(selectedLayoutMm.yPageMm * 10) / 10}
                  onChange={(e) => {
                    const raw = Number(e.target.value)
                    if (!Number.isFinite(raw)) return
                    const { innerH } = selectedLayoutMm
                    const yPct = ((raw - activeForm.marginTopMm) / innerH) * 100
                    if (selected.field === 'line_column' && selected.lineColumnGroupId) {
                      syncLineColumnGroupLayout(selected.lineColumnGroupId, { yPct })
                      return
                    }
                    updateElement(selected.id, { y: clamp(yPct, 0, 100 - selected.h) })
                  }}
                  className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 font-mono tabular-nums"
                />
              </label>
              {!selectedIsDraft ? (
                <label className="block">
                  <span className="text-slate-600">ขนาดตัวอักษร</span>
                  <input
                    type="number"
                    min={6}
                    max={36}
                    value={selected.fontSize ?? 10}
                    onChange={(e) => updateElement(selected.id, { fontSize: clamp(Number(e.target.value) || 10, 6, 36) })}
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1"
                  />
                </label>
              ) : null}
              {!selectedIsDraft && selected.field === 'totals_block' ? (
                <div className="space-y-2 rounded-lg border border-emerald-100 bg-emerald-50/70 p-2">
                  <p className="text-[9px] font-semibold text-emerald-950">รูปแบบยอดสรุป (ข้อความ/ตัวเลขแยกฝั่ง)</p>
                  <label className="block">
                    <span className="text-slate-600">ความห่างบรรทัด</span>
                    <input
                      type="number"
                      min={1}
                      max={2.5}
                      step={0.05}
                      value={selected.lineHeight ?? selected.totalsLineHeight ?? 1.25}
                      onChange={(e) => {
                        const raw = Number(e.target.value)
                        if (!Number.isFinite(raw)) return
                        const v = Math.min(2.5, Math.max(1, Math.round(raw * 100) / 100))
                        updateElement(selected.id, { totalsLineHeight: v, lineHeight: v })
                      }}
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 font-mono tabular-nums"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-600">ระยะข้อความ ↔ ตัวเลข (มม.)</span>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      step={0.1}
                      value={selected.totalsLabelValueGapMm ?? 2}
                      onChange={(e) => {
                        const raw = Number(e.target.value)
                        if (!Number.isFinite(raw)) return
                        updateElement(selected.id, { totalsLabelValueGapMm: Math.min(20, Math.max(0, Math.round(raw * 10) / 10)) })
                      }}
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 font-mono tabular-nums"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-600">ความกว้างคอลัมน์ตัวเลข (%)</span>
                    <input
                      type="number"
                      min={20}
                      max={70}
                      step={0.5}
                      value={selected.totalsValueColumnWidthPct ?? 36}
                      onChange={(e) => {
                        const raw = Number(e.target.value)
                        if (!Number.isFinite(raw)) return
                        updateElement(selected.id, { totalsValueColumnWidthPct: Math.min(70, Math.max(20, Math.round(raw * 10) / 10)) })
                      }}
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 font-mono tabular-nums"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-600">จัดข้อความฝั่งซ้าย</span>
                    <select
                      value={selected.totalsLabelTextAlign ?? 'left'}
                      onChange={(e) =>
                        updateElement(selected.id, {
                          totalsLabelTextAlign: e.target.value as 'left' | 'center' | 'right',
                        })
                      }
                      className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1"
                    >
                      <option value="left">ซ้าย</option>
                      <option value="center">กลาง</option>
                      <option value="right">ขวา</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-slate-600">จัดตัวเลขฝั่งขวา</span>
                    <select
                      value={selected.totalsValueTextAlign ?? 'right'}
                      onChange={(e) =>
                        updateElement(selected.id, {
                          totalsValueTextAlign: e.target.value as 'left' | 'center' | 'right',
                        })
                      }
                      className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1"
                    >
                      <option value="left">ซ้าย</option>
                      <option value="center">กลาง</option>
                      <option value="right">ขวา</option>
                    </select>
                  </label>
                </div>
              ) : null}
              {selected.field === 'line_column' || selected.field === 'line_table' ? (
                <div className="space-y-3">
                  {selected.field === 'line_column' ? (
                    <div className="space-y-2 rounded-lg border border-indigo-200 bg-indigo-50/80 p-2">
                      <p className="text-[9px] font-semibold text-indigo-950">คอลัมน์รายการ (กล่องแยก)</p>
                      <p className="text-[8px] leading-snug text-slate-600">
                        ลากซ้าย/ขวา = เฉพาะช่องนี้ · ลากขึ้น/ลงบนแคนวาส = ทุกคอลัมน์ในแถว · แก้ Y/สูงที่นี่ = ทั้งแถว
                      </p>
                      <label className="block">
                        <span className="text-[9px] text-slate-600">หัวข้อ / ข้อมูล</span>
                        <select
                          value={selected.lineColumnRole ?? 'empty'}
                          onChange={(e) =>
                            updateElement(selected.id, {
                              lineColumnRole: e.target.value as TaxInvoiceLineColumnRole,
                            })
                          }
                          className="mt-0.5 w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-900"
                        >
                          {LINE_COLUMN_ROLE_SELECT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.labelTh}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex cursor-pointer items-start gap-2 text-[9px] text-slate-700">
                        <input
                          type="checkbox"
                          checked={selected.lineColumnShowHeader !== false}
                          onChange={(e) =>
                            updateElement(selected.id, { lineColumnShowHeader: e.target.checked })
                          }
                          className="mt-0.5 size-3.5 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>แสดงหัวในกล่อง (ปิดถ้ากระดาษพิมพ์หัวแล้ว)</span>
                      </label>
                      <label className="block">
                        <span className="text-[9px] text-slate-600">ระยะหัว → แถวแรก (มม.)</span>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.1}
                          value={Math.round((selected.lineColumnHeaderBodyGapMm ?? 0) * 10) / 10}
                          onChange={(e) => {
                            const raw = Number(e.target.value)
                            if (!Number.isFinite(raw)) return
                            updateElement(selected.id, {
                              lineColumnHeaderBodyGapMm: Math.min(20, Math.max(0, raw)),
                            })
                          }}
                          className="mt-0.5 w-full rounded border border-slate-200 px-1.5 py-1 font-mono text-[11px] tabular-nums"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[9px] text-slate-600">ขนาดหัวคอลัมน์ (สเกล 6–36)</span>
                        <div className="mt-0.5 flex gap-1">
                          <input
                            type="number"
                            min={6}
                            max={36}
                            value={
                              selected.lineColumnHeaderFontSize ??
                              Math.min(36, (selected.fontSize ?? 10) + 1)
                            }
                            onChange={(e) => {
                              const raw = Number(e.target.value)
                              if (!Number.isFinite(raw)) return
                              const c = Math.min(36, Math.max(6, Math.round(raw)))
                              const auto = Math.min(36, (selected.fontSize ?? 10) + 1)
                              updateElement(selected.id, {
                                lineColumnHeaderFontSize: c === auto ? undefined : c,
                              })
                            }}
                            className="min-w-0 flex-1 rounded border border-slate-200 px-1.5 py-1 font-mono text-[11px] tabular-nums"
                          />
                          <button
                            type="button"
                            className="shrink-0 rounded border border-slate-200 bg-white px-2 py-1 text-[9px] text-slate-700 hover:bg-slate-50"
                            onClick={() =>
                              updateElement(selected.id, { lineColumnHeaderFontSize: undefined })
                            }
                          >
                            อัตโนมัติ
                          </button>
                        </div>
                        <p className="mt-0.5 text-[7.5px] leading-snug text-slate-500">
                          อัตโนมัติ = ใหญ่กว่าข้อมูล 1 ระดับ · ปรับแยกได้ทุกกล่อง
                        </p>
                      </label>
                      {selected.lineColumnShowHeader !== false ? (
                        <label className="block">
                          <span className="text-[9px] text-slate-600">
                            เลื่อนหัวขึ้น/ลง (มม.) — รายการคงที่
                          </span>
                          <input
                            type="number"
                            min={-15}
                            max={15}
                            step={0.1}
                            value={Math.round((selected.lineColumnHeaderOffsetMm ?? 0) * 10) / 10}
                            onChange={(e) => {
                              const raw = Number(e.target.value)
                              if (!Number.isFinite(raw)) return
                              updateElement(selected.id, {
                                lineColumnHeaderOffsetMm: Math.min(
                                  15,
                                  Math.max(-15, Math.round(raw * 10) / 10),
                                ),
                              })
                            }}
                            className="mt-0.5 w-full rounded border border-slate-200 px-1.5 py-1 font-mono text-[11px] tabular-nums"
                          />
                          <p className="mt-0.5 text-[7.5px] leading-snug text-slate-500">
                            ค่าบวก = เลื่อนหัวลง · ค่าลบ = เลื่อนหัวขึ้น
                          </p>
                        </label>
                      ) : null}
                      <label className="block">
                        <span className="text-[9px] text-slate-600">จัดหัวคอลัมน์</span>
                        <select
                          value={selected.lineColumnHeaderTextAlign ?? 'auto'}
                          onChange={(e) =>
                            updateElement(selected.id, {
                              lineColumnHeaderTextAlign: e.target.value as
                                | 'auto'
                                | 'left'
                                | 'center'
                                | 'right',
                            })
                          }
                          className="mt-0.5 w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-900"
                        >
                          <option value="auto">อัตโนมัติ (ตามชนิดข้อมูล)</option>
                          <option value="left">ซ้าย</option>
                          <option value="center">กึ่งกลาง</option>
                          <option value="right">ขวา</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-[9px] text-slate-600">จัดรายการสินค้า</span>
                        <select
                          value={selected.lineColumnBodyTextAlign ?? 'auto'}
                          onChange={(e) =>
                            updateElement(selected.id, {
                              lineColumnBodyTextAlign: e.target.value as
                                | 'auto'
                                | 'left'
                                | 'center'
                                | 'right',
                            })
                          }
                          className="mt-0.5 w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-900"
                        >
                          <option value="auto">อัตโนมัติ (ตามชนิดข้อมูล)</option>
                          <option value="left">ซ้าย</option>
                          <option value="center">กึ่งกลาง</option>
                          <option value="right">ขวา</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-[9px] text-slate-600">
                          เลื่อนรายการขึ้น/ลง (มม.) — หัวไม่ขยับ
                        </span>
                        <input
                          type="number"
                          min={-15}
                          max={15}
                          step={0.1}
                          value={Math.round((selected.lineColumnBodyOffsetMm ?? 0) * 10) / 10}
                          onChange={(e) => {
                            const raw = Number(e.target.value)
                            if (!Number.isFinite(raw)) return
                            updateElement(selected.id, {
                              lineColumnBodyOffsetMm: Math.min(
                                15,
                                Math.max(-15, Math.round(raw * 10) / 10),
                              ),
                            })
                          }}
                          className="mt-0.5 w-full rounded border border-slate-200 px-1.5 py-1 font-mono text-[11px] tabular-nums"
                        />
                        <p className="mt-0.5 text-[7.5px] leading-snug text-slate-500">
                          ค่าลบ = ดันรายการขึ้นใกล้หัว · ค่าบวก = ลง — ใช้ค่าเดียวกันทุกคอลัมน์ในแถวถ้าต้องการแนวตั้งตรงกัน
                        </p>
                      </label>
                      {lineColumnRoleVariableKey(selected.lineColumnRole ?? 'empty') ? (
                        <p className="font-mono text-[7.5px] text-sky-900">
                          <span className="text-slate-500">ตัวแปร:</span>{' '}
                          {lineColumnRoleVariableKey(selected.lineColumnRole ?? 'empty')}
                        </p>
                      ) : null}
                      {selected.lineColumnGroupId ? (
                        <button
                          type="button"
                          onClick={() => removeLineColumnGroup(selected.lineColumnGroupId!)}
                          className="w-full rounded-lg border border-red-200 bg-white py-1.5 text-[10px] font-medium text-red-800 hover:bg-red-50"
                        >
                          ลบทั้งแถวรายการ (ทุกคอลัมน์)
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {selected.field === 'line_table' ? (
                    <>
                      <label className="flex cursor-pointer items-start gap-2 text-[10px] text-slate-700">
                        <input
                          type="checkbox"
                          checked={selected.lineTableShowHeader !== false}
                          onChange={(e) => updateElement(selected.id, { lineTableShowHeader: e.target.checked })}
                          className="mt-0.5 size-3.5 shrink-0 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span>แสดงแถวหัวตารางในกล่อง (ปิดถ้ากระดาษฟอร์มสำเร็จมีหัวพิมพ์อยู่แล้ว)</span>
                      </label>
                  <label className="block">
                    <span className="text-slate-600">จำนวนคอลัมน์</span>
                    <select
                      value={getLineTableConfig(selected).widths.length}
                      onChange={(e) => {
                        const n = Number(e.target.value)
                        if (!Number.isFinite(n)) return
                        const cfg = getLineTableConfig(selected)
                        const next = resizeLineTableToColumnCount(cfg.widths, cfg.roles, n)
                        updateElement(selected.id, {
                          lineColWidthsPct: next.lineColWidthsPct,
                          lineColRoles: next.lineColRoles,
                        })
                      }}
                      className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-900"
                    >
                      {Array.from(
                        { length: LINE_TABLE_COL_COUNT_MAX - LINE_TABLE_COL_COUNT_MIN + 1 },
                        (_, i) => LINE_TABLE_COL_COUNT_MIN + i,
                      ).map((n) => (
                        <option key={n} value={n}>
                          {n} คอลัมน์
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/90 p-2">
                    <p className="text-[9px] font-semibold text-slate-700">หัวตาราง · ความกว้าง (%)</p>
                    <p className="text-[8px] leading-snug text-slate-500">
                      เลือกว่าแต่ละคอลัมน์แมปกับข้อมูลใด — ช่องว่างสำหรับทาบฟอร์มที่พิมพ์บางส่วนไว้แล้ว
                    </p>
                    {getLineTableConfig(selected).widths.map((wPct, idx) => {
                      const role = getLineTableConfig(selected).roles[idx]!
                      const colMin = getLineTableConfig(selected).widths.length > 8 ? 3 : 5
                      return (
                        <div
                          key={idx}
                          className="space-y-1.5 border-b border-slate-200/80 pb-2 last:border-b-0 last:pb-0"
                        >
                          <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-500">
                            คอลัมน์ {idx + 1}
                          </p>
                          <label className="block">
                            <span className="text-[9px] text-slate-600">หัวข้อ / ข้อมูล</span>
                            <select
                              value={role}
                              onChange={(e) => {
                                const v = e.target.value as TaxInvoiceLineColumnRole
                                const cfg = getLineTableConfig(selected)
                                const nextRoles = [...cfg.roles]
                                nextRoles[idx] = v
                                updateElement(selected.id, { lineColRoles: nextRoles })
                              }}
                              className="mt-0.5 w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-900"
                            >
                              {LINE_COLUMN_ROLE_SELECT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.labelTh}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-[9px] text-slate-600">กว้าง % (รวมทุกคอลัมน์ = 100)</span>
                            <input
                              type="number"
                              min={colMin}
                              max={45}
                              step={0.5}
                              value={wPct}
                              onChange={(e) => {
                                const raw = Number(e.target.value)
                                if (!Number.isFinite(raw)) return
                                const next = adjustLineTableColumnWidth(getLineTableColWidthsPct(selected), idx, raw)
                                updateElement(selected.id, { lineColWidthsPct: next })
                              }}
                              className="mt-0.5 w-full rounded border border-slate-200 px-1.5 py-1 font-mono text-[11px] tabular-nums"
                            />
                          </label>
                          {lineColumnRoleVariableKey(role) ? (
                            <p className="font-mono text-[7.5px] text-sky-900">
                              <span className="text-slate-500">ตัวแปร:</span> {lineColumnRoleVariableKey(role)}
                            </p>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                    </>
                  ) : null}
                  <div className="space-y-2 rounded-lg border border-sky-100 bg-sky-50/70 p-2">
                    <p className="text-[9px] font-semibold text-sky-950">ตัวแปรข้อมูลแถว (Paste TSV)</p>
                    <ul className="max-h-28 space-y-0.5 overflow-y-auto text-[8px] leading-snug">
                      {LINE_ITEM_VARIABLE_DEFINITIONS.map((v) => (
                        <li key={v.key} className="flex flex-wrap items-baseline justify-between gap-x-1 gap-y-0">
                          <span className="text-slate-600">{v.labelTh}</span>
                          <code className="shrink-0 rounded bg-white/80 px-1 py-px text-[7.5px] text-sky-900">{v.key}</code>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[8px] leading-snug text-slate-600">
                      <span className="font-medium text-slate-700">Paste:</span> 1 แถว / บรรทัด · คั่นด้วย{' '}
                      <kbd className="rounded bg-white px-0.5">Tab</kbd> — แบบเต็ม 10 ช่องตามตารางด้านบน · แบบสั้น 7
                      ช่อง (ข้อมูลเก่า): โรงงาน, SKU, ชื่อ, จำนวน, หน่วย, ราคา/หน่วย, จำนวนเงิน
                    </p>
                    <textarea
                      value={lineImportDraft}
                      onChange={(e) => setLineImportDraft(e.target.value)}
                      rows={5}
                      spellCheck={false}
                      className="w-full rounded border border-slate-200 bg-white px-1.5 py-1 font-mono text-[9px] leading-snug text-slate-900"
                      aria-label="ข้อความ TSV สำหรับนำเข้าแถวรายการ"
                    />
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const rows = parseTaxInvoiceLineTsvBlock(lineImportDraft)
                          if (rows.length === 0) {
                            window.alert('ไม่พบแถวข้อมูล (ต้องมีอย่างน้อย 1 บรรทัด)')
                            return
                          }
                          setLinePreviewRows(rows)
                          setLineImportDraft(lineItemsToTsvPreview(rows))
                        }}
                        className="rounded-lg border border-sky-300 bg-sky-600 px-2 py-1 text-[9px] font-semibold text-white hover:bg-sky-700"
                      >
                        นำเข้าจากกล่องข้อความ
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const t = await navigator.clipboard.readText()
                            const rows = parseTaxInvoiceLineTsvBlock(t)
                            if (rows.length === 0) {
                              window.alert('คลิปบอร์ดไม่มีแถวที่อ่านได้')
                              return
                            }
                            setLinePreviewRows(rows)
                            setLineImportDraft(lineItemsToTsvPreview(rows))
                          } catch {
                            window.alert('ไม่สามารถอ่านคลิปบอร์ดได้')
                          }
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[9px] font-medium text-slate-800 hover:bg-slate-50"
                      >
                        วางจากคลิปบอร์ด
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = DEFAULT_TAX_INVOICE_LINE_ITEMS.map((r) => ({ ...r }))
                          setLinePreviewRows(d)
                          setLineImportDraft(lineItemsToTsvPreview(d))
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[9px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        รีเซ็ตตัวอย่าง
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
              {selected.field === 'buyer_block' ? (
                <div className="space-y-2 rounded-lg border border-violet-100 bg-violet-50/70 p-2">
                  <p className="text-[9px] font-semibold text-violet-950">ตัวแปรผู้ซื้อ</p>
                  <ul className="space-y-0.5 text-[8px] leading-snug">
                    {BUYER_VARIABLE_DEFINITIONS.map((v) => (
                      <li key={v.key} className="flex flex-wrap items-baseline justify-between gap-x-1">
                        <span className="text-slate-600">{v.labelTh}</span>
                        <code className="shrink-0 rounded bg-white/80 px-1 py-px text-[7.5px] text-violet-900">{v.key}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {selected.field === 'doc_receipt_no' || selected.field === 'doc_date' || selected.field === 'doc_meta' ? (
                <div className="space-y-2 rounded-lg border border-violet-100 bg-violet-50/70 p-2">
                  <p className="text-[9px] font-semibold text-violet-950">ตัวแปรเอกสาร</p>
                  <ul className="space-y-0.5 text-[8px] leading-snug">
                    {DOC_VARIABLE_DEFINITIONS.map((v) => (
                      <li key={v.key} className="flex flex-wrap items-baseline justify-between gap-x-1">
                        <span className="text-slate-600">{v.labelTh}</span>
                        <code className="shrink-0 rounded bg-white/80 px-1 py-px text-[7.5px] text-violet-900">{v.key}</code>
                      </li>
                    ))}
                  </ul>
                  {selected.field === 'doc_meta' ? (
                    <label className="block">
                      <span className="text-slate-600">ความห่างบรรทัด</span>
                      <input
                        type="number"
                        min={1}
                        max={2.5}
                        step={0.05}
                        value={selected.docLineHeight ?? 1.25}
                        onChange={(e) => {
                          const raw = Number(e.target.value)
                          if (!Number.isFinite(raw)) return
                          updateElement(selected.id, { docLineHeight: Math.min(2.5, Math.max(1, Math.round(raw * 100) / 100)) })
                        }}
                        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 font-mono tabular-nums"
                      />
                    </label>
                  ) : null}
                </div>
              ) : null}
              {selected.field !== 'title_th' &&
              selected.field !== 'line_table' &&
              selected.field !== 'line_column' &&
              selected.field !== 'totals_block' &&
              !selectedIsDraft ? (
                <label className="block">
                  <span className="text-slate-600">จัดข้อความ</span>
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
              ) : null}
              <button
                type="button"
                onClick={() => removeElement(selected.id)}
                className="w-full rounded-lg border border-red-200 bg-red-50 py-1.5 text-[11px] font-medium text-red-800 hover:bg-red-100"
              >
                ลบบล็อกนี้
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">คลิกบล็อกบนแคนวาสเพื่อแก้ค่า</p>
          )}
        </aside>
      </div>
    </div>
  )
}
