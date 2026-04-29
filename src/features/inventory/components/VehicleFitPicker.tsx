import { useVehicleCatalog } from '@/features/vehicle/context/VehicleCatalogContext'
import { decodeVin, type CheckDigitStatus, type VinDecodeResult } from '@/features/vehicle/utils/vinDecoder'
import { clsx } from 'clsx'
import { Copy, Pencil, Plus, ScanSearch, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export type VehicleFitRow = {
  id: string
  categoryId: string
  categoryLabel: string
  brandId: string
  brandName: string
  modelId: string
  modelName: string
  engineId: string
  engineLabel: string
  engineText?: string
  yearRangeText?: string
  yearFrom?: number
  yearTo?: number
  driveType?: string
  engineCode?: string
  brakePosition?: '' | 'front' | 'rear'
}

const inputCls =
  'w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[13px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400/70 focus:ring-1 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400'

const dropdownPanelClass =
  'absolute z-[60] mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg'

const alignedLabelCls = 'mb-0.5 flex min-h-[1.75rem] items-end text-[10px] font-medium leading-snug text-slate-600'

const PINNED_BRAND_NAMES = [
  'toyota', 'honda', 'isuzu', 'nissan', 'mitsubishi', 'ford',
  'mazda', 'suzuki', 'chevrolet', 'hyundai', 'kia', 'yamaha', 'kawasaki',
]


const RECENT_BRANDS_KEY = 'bento.vfp.recentBrands'
const MAX_RECENT = 5

const VIN_HISTORY_KEY = 'bento.vfp.vinHistory'
const MAX_VIN_HISTORY = 10

type VinHistoryEntry = { vin: string; brand?: string; year?: number; ts: number }

function loadVinHistory(): VinHistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(VIN_HISTORY_KEY) ?? '[]') } catch { return [] }
}

function pushVinHistory(entry: VinHistoryEntry) {
  try {
    const list = loadVinHistory().filter((h) => h.vin !== entry.vin)
    localStorage.setItem(VIN_HISTORY_KEY, JSON.stringify([entry, ...list].slice(0, MAX_VIN_HISTORY)))
  } catch {}
}

type SearchBrandOption = { id: string; name: string; categoryId: string; categoryLabel: string }
type SearchModelOption = {
  id: string
  name: string
  brandId: string
  brandName: string
  categoryId: string
  categoryLabel: string
}
type Props = {
  rows: VehicleFitRow[]
  onAdd: (row: VehicleFitRow) => void
  onUpdate: (id: string, row: VehicleFitRow) => void
  onRemove: (id: string) => void
  labelClass: string
  sectionClass: string
  sectionTitleClass: string
  titleAction?: ReactNode
  hideSectionTitle?: boolean
}

function newRowId() {
  return `vf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function moveHighlightIndex(current: number, length: number, direction: -1 | 1): number {
  if (length <= 0) return -1
  if (current < 0) return direction === 1 ? 0 : length - 1
  return (current + direction + length) % length
}

function parseYearInput(value: string): number | undefined {
  const n = Number(value.trim())
  if (!Number.isFinite(n)) return undefined
  const y = Math.round(n)
  if (y < 1900 || y > 2100) return undefined
  return y
}

function normalizeManualText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function buildYearRangeLabel(yearFrom?: number, yearTo?: number): string {
  if (yearFrom !== undefined && yearTo !== undefined) return `${yearFrom}-${yearTo}`
  if (yearFrom === undefined && yearTo !== undefined) return `ถึง ${yearTo}`
  if (yearFrom !== undefined && yearTo === undefined) return `${yearFrom}-ปัจจุบัน`
  return ''
}

function parseYearRangeFromText(text: string): { yearFrom?: number; yearTo?: number } {
  const t = text.trim()
  if (!t) return {}
  const mRange = t.match(/(\d{4})\s*[-–]\s*(\d{4})/)
  if (mRange) {
    const from = parseYearInput(mRange[1])
    const to = parseYearInput(mRange[2])
    if (from !== undefined || to !== undefined) return { yearFrom: from, yearTo: to }
  }
  const mTo = t.match(/ถึง\s*(\d{4})/)
  if (mTo) return { yearTo: parseYearInput(mTo[1]) }
  const mFromNow = t.match(/(\d{4})\s*[-–]\s*ปัจจุบัน/i)
  if (mFromNow) return { yearFrom: parseYearInput(mFromNow[1]) }
  return {}
}

function extractEngineTextFromLabel(label: string): string {
  const t = label.trim()
  if (!t) return ''
  const yearLike = '(?:ถึง\\s*\\d{4}|\\d{4}\\s*[-–]\\s*\\d{4}|\\d{4}\\s*[-–]\\s*ปัจจุบัน|ปี\\s*\\d{4}(?:\\s*[-–]\\s*(?:\\d{4}|ปัจจุบัน))?)'
  const withoutParenYear = t.replace(new RegExp(`\\s*\\(\\s*${yearLike}\\s*\\)\\s*$`, 'i'), '')
  const withoutDotYear = withoutParenYear.replace(new RegExp(`\\s*[·•]\\s*\\(\\s*${yearLike}\\s*\\)\\s*$`, 'i'), '')
  const withoutPlainYear = withoutDotYear.replace(new RegExp(`\\s+${yearLike}\\s*$`, 'i'), '')
  const withoutSepYear = withoutPlainYear.replace(new RegExp(`\\s*(?:[·•\\-–:]|ปี)\\s*${yearLike}\\s*$`, 'i'), '')
  const cleaned = withoutSepYear.replace(/\s*[·•:\-–]+\s*$/, '').trim()
  if (/^ปี\s*(?:\d{4}\s*[-–]\s*\d{4}|ถึง\s*\d{4}|\d{4}\s*[-–]\s*ปัจจุบัน)$/i.test(cleaned)) return ''
  return cleaned.replace(/\s*[·•:\-–]?\s*\b(\d{1,2}WD|AWD|FWD|RWD)\b\s*$/i, '').trim()
}

function extractDriveTypeFromLabel(label: string): string {
  const m = label.trim().match(/\b(\d{1,2}WD|AWD|FWD|RWD)\b/i)
  return m?.[1]?.toUpperCase() ?? ''
}

function CheckDigitBadge({ status }: { status: CheckDigitStatus }) {
  if (status === 'valid') return (
    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">✓ check digit ถูก</span>
  )
  if (status === 'invalid') return (
    <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">⚠ check digit ผิด — อาจพิมพ์ผิด</span>
  )
  return (
    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">check digit: ไม่ทราบ</span>
  )
}

function loadRecentBrands(): SearchBrandOption[] {
  try { return JSON.parse(localStorage.getItem(RECENT_BRANDS_KEY) ?? '[]') } catch { return [] }
}

function pushRecentBrand(b: SearchBrandOption) {
  try {
    const list = loadRecentBrands().filter((r) => !(r.id === b.id && r.categoryId === b.categoryId))
    localStorage.setItem(RECENT_BRANDS_KEY, JSON.stringify([b, ...list].slice(0, MAX_RECENT)))
  } catch {}
}

export function VehicleFitPicker({
  rows,
  onAdd,
  onUpdate,
  onRemove,
  labelClass,
  sectionClass,
  sectionTitleClass,
  titleAction,
  hideSectionTitle = false,
}: Props) {
  const { catalog, visibleCategoryIds } = useVehicleCatalog()
  const [catId, setCatId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [modelId, setModelId] = useState('')
  const [brakePos, setBrakePos] = useState<'' | 'front' | 'rear'>('')

  const [brandQuery, setBrandQuery] = useState('')
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false)
  const [brandHighlightedIndex, setBrandHighlightedIndex] = useState(-1)

  const [modelQuery, setModelQuery] = useState('')
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [modelHighlightedIndex, setModelHighlightedIndex] = useState(-1)

  const [manualEngineText, setManualEngineText] = useState('')
  const [manualDriveType, setManualDriveType] = useState('')
  const [manualYearFrom, setManualYearFrom] = useState('')
  const [manualYearTo, setManualYearTo] = useState('')
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [recentBrands, setRecentBrands] = useState<SearchBrandOption[]>(loadRecentBrands)

  const [showVin, setShowVin] = useState(false)
  const [vinInput, setVinInput] = useState('')
  const [vinHistory, setVinHistory] = useState<VinHistoryEntry[]>(loadVinHistory)
  const [lastVinYear, setLastVinYear] = useState<number | null>(null)
  const vinResult = useMemo<VinDecodeResult | null>(
    () => (vinInput.trim().length >= 3 ? decodeVin(vinInput) : null),
    [vinInput],
  )

  const brandDropdownRef = useRef<HTMLDivElement | null>(null)
  const modelDropdownRef = useRef<HTMLDivElement | null>(null)
  const modelInputRef = useRef<HTMLInputElement | null>(null)
  const formTopRef = useRef<HTMLDivElement | null>(null)

  const visibleCategories = useMemo(
    () =>
      [...catalog.categories]
        .filter((c) => visibleCategoryIds.has(c.id))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [catalog.categories, visibleCategoryIds],
  )

  const aggregated = useMemo(() => {
    const brands: SearchBrandOption[] = []
    const models: SearchModelOption[] = []
    for (const vc of visibleCategories) {
      const catData = catalog.byCategory[vc.id]
      if (!catData) continue
      for (const brand of catData.brands) {
        brands.push({ id: brand.id, name: brand.name, categoryId: vc.id, categoryLabel: vc.label })
        for (const model of catData.modelsByBrandId[brand.id] ?? []) {
          models.push({ id: model.id, name: model.name, brandId: brand.id, brandName: brand.name, categoryId: vc.id, categoryLabel: vc.label })
        }
      }
    }
    brands.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    models.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    return { brands, models }
  }, [visibleCategories, catalog])

  const allBrands = aggregated.brands
  const allModels = aggregated.models
  const selectedBrand = allBrands.find((b) => b.id === brandId && b.categoryId === catId)
  const selectedModel = allModels.find((m) => m.id === modelId && m.categoryId === catId)
  const categoryLabel = visibleCategories.find((c) => c.id === catId)?.label ?? ''

  const modelCountByBrand = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of allModels) {
      const key = `${m.categoryId}::${m.brandId}`
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [allModels])

  const filteredBrands = useMemo(() => {
    const q = brandQuery.trim().toLocaleLowerCase()
    const base = allBrands.filter(
      (b) =>
        (!catId || b.categoryId === catId) &&
        (!selectedModel || (b.id === selectedModel.brandId && b.categoryId === selectedModel.categoryId)),
    )
    const filtered = !q ? base : base.filter((b) => b.name.toLocaleLowerCase().includes(q))
    return [...filtered].sort((a, b) => {
      const rA = PINNED_BRAND_NAMES.findIndex((p) => a.name.toLowerCase().startsWith(p))
      const rB = PINNED_BRAND_NAMES.findIndex((p) => b.name.toLowerCase().startsWith(p))
      const rankA = rA >= 0 ? rA : PINNED_BRAND_NAMES.length
      const rankB = rB >= 0 ? rB : PINNED_BRAND_NAMES.length
      if (rankA !== rankB) return rankA - rankB
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
  }, [allBrands, brandQuery, catId, selectedModel])

  const filteredModels = useMemo(() => {
    const q = modelQuery.trim().toLocaleLowerCase()
    const base = allModels.filter(
      (m) =>
        (!catId || m.categoryId === catId) &&
        (!brandId || (m.brandId === brandId && m.categoryId === catId)),
    )
    if (!q) return base
    return base.filter((m) => m.name.toLocaleLowerCase().includes(q))
  }, [allModels, brandId, catId, modelQuery])

  const brandName = selectedBrand?.name ?? selectedModel?.brandName ?? ''
  const modelName = selectedModel?.name ?? ''
  const manualEngineTextTrim = normalizeManualText(manualEngineText)
  const parsedYearFrom = parseYearInput(manualYearFrom)
  const parsedYearTo = parseYearInput(manualYearTo)
  const hasYearFromInput = manualYearFrom.trim().length > 0
  const hasYearToInput = manualYearTo.trim().length > 0
  const hasYearInputError =
    (hasYearFromInput && parsedYearFrom === undefined) || (hasYearToInput && parsedYearTo === undefined)
  const hasYearRangeError =
    parsedYearFrom !== undefined && parsedYearTo !== undefined && parsedYearFrom > parsedYearTo
  const hasManualSpec = !hasYearInputError && !hasYearRangeError
  const canAddResolved = Boolean(catId && (brandId || brandQuery.trim()) && (modelId || modelQuery.trim()) && hasManualSpec)

  // ── Duplicate detection ──────────────────────────────────────────────────
  const isDuplicate = useMemo(() => {
    if (!canAddResolved) return false
    const bp = brakePos || ''
    const engineCodeMatch = manualEngineTextTrim.match(/\[([^\]]*)\]\s*$/)
    const engineText = engineCodeMatch
      ? manualEngineTextTrim.slice(0, manualEngineTextTrim.lastIndexOf('[')).trim()
      : manualEngineTextTrim
    const driveType = normalizeManualText(manualDriveType)
    const yearRangeLabel = buildYearRangeLabel(parsedYearFrom, parsedYearTo)
    const yearRangeKey = yearRangeLabel || 'no-year'
    const engineKey = engineText ? engineText.toLowerCase().replace(/\s+/g, '-') : 'no-engine'
    const resolvedBrandId = brandId || `manual-brand:${brandQuery.trim().toLowerCase().replace(/\s+/g, '-')}`
    const resolvedModelId = modelId || `manual-model:${modelQuery.trim().toLowerCase().replace(/\s+/g, '-')}`
    const editingRow = editingRowId ? rows.find((r) => r.id === editingRowId) : undefined
    const resolvedEngineId =
      editingRow && !editingRow.engineId.startsWith('manual:')
        ? editingRow.engineId
        : `manual:${catId}:${resolvedBrandId}:${resolvedModelId}:${engineKey}:${yearRangeKey.toLowerCase().replace(/\s+/g, '-')}`
    return rows.some(
      (r) =>
        r.id !== editingRowId &&
        r.categoryId === catId &&
        r.brandId === resolvedBrandId &&
        r.modelId === resolvedModelId &&
        r.engineId === resolvedEngineId &&
        (r.driveType ?? '') === driveType &&
        (r.brakePosition ?? '') === bp,
    )
  }, [canAddResolved, catId, brandId, brandQuery, modelId, modelQuery, brakePos, manualEngineTextTrim, manualDriveType, parsedYearFrom, parsedYearTo, rows, editingRowId])

  // ── Grouped rows for display ─────────────────────────────────────────────
  const groupedRows = useMemo(() => {
    const groups: { key: string; brandName: string; categoryLabel: string; items: VehicleFitRow[] }[] = []
    const seen = new Map<string, number>()
    for (const r of rows) {
      const key = `${r.categoryId}::${r.brandId}`
      const idx = seen.get(key)
      if (idx === undefined) {
        seen.set(key, groups.length)
        groups.push({ key, brandName: r.brandName, categoryLabel: r.categoryLabel, items: [r] })
      } else {
        groups[idx].items.push(r)
      }
    }
    return groups
  }, [rows])

  function resetFormState() {
    setBrakePos('')
    setManualEngineText('')
    setManualDriveType('')
    setManualYearFrom('')
    setManualYearTo('')
    setEditingRowId(null)
  }

  function onSelectCategory(id: string) {
    setCatId(id)
    setBrandId('')
    setBrandQuery('')
    setModelId('')
    setModelQuery('')
  }

  function onBrandPick(b: SearchBrandOption) {
    setCatId(b.categoryId)
    setBrandId(b.id)
    setBrandQuery(b.name)
    setModelId('')
    setModelQuery('')
    pushRecentBrand(b)
    setRecentBrands(loadRecentBrands())
    window.setTimeout(() => modelInputRef.current?.focus(), 30)
  }

  function onModelPick(m: SearchModelOption) {
    setCatId(m.categoryId)
    setBrandId(m.brandId)
    setBrandQuery(m.brandName)
    setModelId(m.id)
    setModelQuery(m.name)
  }

  function copyBrandModel(row: VehicleFitRow) {
    setEditingRowId(null)
    setCatId(row.categoryId)
    setBrandId(row.brandId)
    setBrandQuery(row.brandName)
    setModelId(row.modelId)
    setModelQuery(row.modelName)
    setManualEngineText('')
    setManualDriveType('')
    setManualYearFrom('')
    setManualYearTo('')
    setBrakePos('')
  }

  function applyVinResult(result?: VinDecodeResult) {
    const r = result ?? vinResult
    if (!r?.isValid) return
    const decoded = r.brand?.toLowerCase() ?? ''
    const match = allBrands.find(
      (b) =>
        (!catId || b.categoryId === catId) &&
        (b.name.toLowerCase() === decoded ||
          decoded.startsWith(b.name.toLowerCase()) ||
          b.name.toLowerCase().startsWith(decoded)),
    )
    if (match) onBrandPick(match)
    else if (r.brand) setBrandQuery(r.brand)
    if (r.modelYear) {
      setManualYearFrom(String(r.modelYear))
      setManualYearTo(String(r.modelYear))
      setLastVinYear(r.modelYear)
    }
    // Save to history
    const entry: VinHistoryEntry = { vin: r.vin, brand: r.brand, year: r.modelYear, ts: Date.now() }
    pushVinHistory(entry)
    setVinHistory(loadVinHistory())
    setShowVin(false)
    setVinInput('')
  }

  function copyLastRowSpec() {
    const last = rows[rows.length - 1]
    if (!last) return
    const engineRaw = last.engineText ?? extractEngineTextFromLabel(last.engineLabel ?? '')
    setManualEngineText(last.engineCode ? `${engineRaw} [${last.engineCode}]` : engineRaw)
    setManualDriveType(last.driveType ?? '')
    setManualYearFrom(last.yearFrom != null ? String(last.yearFrom) : '')
    setManualYearTo(last.yearTo != null ? String(last.yearTo) : '')
  }

  function beginEdit(row: VehicleFitRow) {
    const yearResolved =
      row.yearFrom !== undefined || row.yearTo !== undefined
        ? { yearFrom: row.yearFrom, yearTo: row.yearTo }
        : parseYearRangeFromText(row.yearRangeText ?? row.engineLabel ?? '')
    setEditingRowId(row.id)
    setCatId(row.categoryId)
    setBrandId(row.brandId)
    setBrandQuery(row.brandName)
    setModelId(row.modelId)
    setModelQuery(row.modelName)
    setBrakePos((row.brakePosition ?? '') as '' | 'front' | 'rear')
    const engineRaw = row.engineText ?? extractEngineTextFromLabel(row.engineLabel ?? '')
    const cleanEngine = extractEngineTextFromLabel(engineRaw)
    setManualEngineText(row.engineCode ? `${cleanEngine} [${row.engineCode}]` : cleanEngine)
    setManualDriveType(
      row.driveType ??
        extractDriveTypeFromLabel(row.engineLabel ?? '') ??
        extractDriveTypeFromLabel(row.engineText ?? ''),
    )
    setManualYearFrom(yearResolved.yearFrom != null ? String(yearResolved.yearFrom) : '')
    setManualYearTo(yearResolved.yearTo != null ? String(yearResolved.yearTo) : '')
    window.setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 30)
  }

  useEffect(() => {
    setBrandHighlightedIndex((prev) => {
      if (filteredBrands.length === 0) return -1
      if (prev < 0) return 0
      return Math.min(prev, filteredBrands.length - 1)
    })
  }, [filteredBrands])

  useEffect(() => {
    setModelHighlightedIndex((prev) => {
      if (filteredModels.length === 0) return -1
      if (prev < 0) return 0
      return Math.min(prev, filteredModels.length - 1)
    })
  }, [filteredModels])

  useEffect(() => {
    if (!brandDropdownOpen || brandHighlightedIndex < 0) return
    brandDropdownRef.current?.querySelector<HTMLElement>(`[data-brand-index="${brandHighlightedIndex}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [brandDropdownOpen, brandHighlightedIndex])

  useEffect(() => {
    if (!modelDropdownOpen || modelHighlightedIndex < 0) return
    modelDropdownRef.current?.querySelector<HTMLElement>(`[data-model-index="${modelHighlightedIndex}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [modelDropdownOpen, modelHighlightedIndex])

  useEffect(() => {
    if (!editingRowId) return
    if (!rows.some((r) => r.id === editingRowId)) setEditingRowId(null)
  }, [rows, editingRowId])

  function handleAddOrUpdate() {
    if (!canAddResolved || isDuplicate) return
    const editingRow = editingRowId ? rows.find((r) => r.id === editingRowId) : undefined
    const bp = brakePos || ''
    const engineCodeMatch = manualEngineTextTrim.match(/\[([^\]]*)\]\s*$/)
    const engineCode = engineCodeMatch ? engineCodeMatch[1].trim() : ''
    const engineText = engineCodeMatch
      ? manualEngineTextTrim.slice(0, manualEngineTextTrim.lastIndexOf('[')).trim()
      : manualEngineTextTrim
    const driveType = normalizeManualText(manualDriveType)
    const yearRangeLabel = buildYearRangeLabel(parsedYearFrom, parsedYearTo)
    const resolvedEngineLabel = (() => {
      if (engineText && yearRangeLabel) return `${engineText} (${yearRangeLabel})`
      if (engineText) return engineText
      if (yearRangeLabel) return `ปี ${yearRangeLabel}`
      return 'ไม่ระบุเครื่อง/ปี'
    })()
    const yearRangeKey = yearRangeLabel || 'no-year'
    const engineKey = engineText ? engineText.toLowerCase().replace(/\s+/g, '-') : 'no-engine'
    const resolvedBrandId = brandId || `manual-brand:${brandQuery.trim().toLowerCase().replace(/\s+/g, '-')}`
    const resolvedModelId = modelId || `manual-model:${modelQuery.trim().toLowerCase().replace(/\s+/g, '-')}`
    const resolvedEngineId =
      editingRow && !editingRow.engineId.startsWith('manual:')
        ? editingRow.engineId
        : `manual:${catId}:${resolvedBrandId}:${resolvedModelId}:${engineKey}:${yearRangeKey.toLowerCase().replace(/\s+/g, '-')}`
    if (!resolvedEngineId || !resolvedEngineLabel) return
    const keepExistingEngineDetail =
      Boolean(editingRow) &&
      manualEngineTextTrim.length === 0 &&
      manualYearFrom.trim().length === 0 &&
      manualYearTo.trim().length === 0
    const rowPayload: VehicleFitRow = {
      id: editingRowId ?? newRowId(),
      categoryId: catId,
      categoryLabel: categoryLabel || editingRow?.categoryLabel || '',
      brandId: resolvedBrandId,
      brandName: brandName || brandQuery.trim() || editingRow?.brandName || '',
      modelId: resolvedModelId,
      modelName: modelName || modelQuery.trim() || editingRow?.modelName || '',
      engineId: resolvedEngineId,
      engineLabel: keepExistingEngineDetail && editingRow ? editingRow.engineLabel : resolvedEngineLabel,
      ...(keepExistingEngineDetail && editingRow
        ? {
            ...(editingRow.engineText ? { engineText: editingRow.engineText } : {}),
            ...(editingRow.yearRangeText ? { yearRangeText: editingRow.yearRangeText } : {}),
            ...(editingRow.yearFrom !== undefined ? { yearFrom: editingRow.yearFrom } : {}),
            ...(editingRow.yearTo !== undefined ? { yearTo: editingRow.yearTo } : {}),
          }
        : {
            ...(engineText ? { engineText } : {}),
            ...(yearRangeLabel ? { yearRangeText: yearRangeLabel } : {}),
            ...(parsedYearFrom !== undefined ? { yearFrom: parsedYearFrom } : {}),
            ...(parsedYearTo !== undefined ? { yearTo: parsedYearTo } : {}),
          }),
      ...(driveType ? { driveType } : {}),
      ...(engineCode ? { engineCode } : {}),
      brakePosition: brakePos || undefined,
    }
    if (editingRowId) onUpdate(editingRowId, rowPayload)
    else onAdd(rowPayload)
    resetFormState()
  }

  // ── Visible recent brands (filtered by catId when selected) ──────────────
  const visibleRecentBrands = useMemo(
    () => recentBrands.filter((b) => !catId || b.categoryId === catId),
    [recentBrands, catId],
  )

  // ── Models already used in this product's fitment rows (for this brand) ──
  const existingModelsForBrand = useMemo(() => {
    if (!brandId && !brandQuery.trim()) return []
    const bq = brandQuery.trim().toLowerCase()
    return rows
      .filter((r) => r.brandId === brandId || r.brandName.toLowerCase() === bq)
      .map((r) => ({ id: r.modelId, name: r.modelName }))
      .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i)
  }, [rows, brandId, brandQuery])
  const showRecentSection = !brandQuery.trim() && visibleRecentBrands.length > 0

  return (
    <div className={sectionClass}>
      {!hideSectionTitle ? (
        <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
          <p className={clsx('min-w-0 flex-1', sectionTitleClass.replace(/\bmb-1\b/g, '').trim())}>
            รถ / รุ่น / เครื่อง-ปี (ผูกสินค้า)
          </p>
          {titleAction ? <div className="shrink-0">{titleAction}</div> : null}
        </div>
      ) : null}

      <div ref={formTopRef} className="flex flex-col gap-2">

        {/* ── Category pills ── */}
        <div>
          <span className={clsx(labelClass, 'mb-1.5 block text-[10px] font-medium text-slate-600')}>ประเภท</span>
          {visibleCategories.length === 0 ? (
            <span className="text-[11px] text-slate-400">ไม่มีประเภทที่แสดง</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {visibleCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectCategory(c.id)}
                  className={clsx(
                    'rounded-lg border px-3 py-1 text-[12px] font-medium transition',
                    catId === c.id
                      ? 'border-sky-400 bg-sky-500 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── VIN lookup ── */}
        <div>
          <button
            type="button"
            onClick={() => setShowVin((v) => !v)}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition',
              showVin
                ? 'border-violet-300 bg-violet-50 text-violet-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50',
            )}
          >
            <ScanSearch className="size-3.5" />
            ค้นหาจาก VIN
          </button>

          {showVin && (
            <div className="mt-2 flex flex-col gap-2 rounded-xl border border-violet-200 bg-violet-50/60 p-3">
              {/* Input row */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={17}
                  value={vinInput}
                  onChange={(e) => setVinInput(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && vinResult?.isValid) applyVinResult() }}
                  placeholder="กรอก VIN 17 หลัก เช่น MHF…"
                  className="flex-1 rounded-lg border border-violet-200 bg-white px-3 py-1.5 font-mono text-[13px] tracking-widest text-slate-800 shadow-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400"
                  autoFocus
                />
                <span className={clsx(
                  'shrink-0 text-[11px] font-semibold tabular-nums',
                  vinInput.length === 17 ? 'text-emerald-600' : 'text-slate-400',
                )}>
                  {vinInput.length}/17
                </span>
                <button type="button" onClick={() => { setShowVin(false); setVinInput('') }} className="rounded p-1 text-slate-400 hover:text-slate-700">
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Decode result */}
              {vinResult && (
                <div className={clsx(
                  'rounded-lg border px-3 py-2',
                  vinResult.isValid ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50',
                )}>
                  {!vinResult.isValid ? (
                    <p className="text-[11px] font-semibold text-rose-700">{vinResult.error}</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* WMI */}
                        <span className="font-mono text-[10px] font-semibold text-slate-400">
                          {vinResult.vin.slice(0, 3)}
                          <span className="text-slate-300">·</span>
                          {vinResult.vin.slice(3, 8)}
                          <span className="text-slate-300">·</span>
                          <span className={clsx(
                            vinResult.checkDigit === 'valid' ? 'text-emerald-600' :
                            vinResult.checkDigit === 'invalid' ? 'text-rose-500' : 'text-slate-400',
                          )}>{vinResult.vin[8]}</span>
                          <span className="text-slate-300">·</span>
                          {vinResult.vin.slice(9)}
                        </span>
                        {/* Check digit badge */}
                        <CheckDigitBadge status={vinResult.checkDigit} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {vinResult.brand ? (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                            {vinResult.brand}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">ไม่พบยี่ห้อใน WMI table</span>
                        )}
                        {vinResult.modelYear && (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                            ปี {vinResult.modelYear}
                            {vinResult.modelYearAlt ? <span className="font-normal text-indigo-400"> (หรือ {vinResult.modelYearAlt})</span> : null}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => applyVinResult()}
                          className="ml-auto rounded-lg bg-violet-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-violet-700 active:scale-95"
                        >
                          ใช้ข้อมูลนี้ ↵
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VIN history */}
              {vinHistory.length > 0 && (
                <div>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">VIN ล่าสุด</p>
                  <div className="flex flex-col gap-0.5">
                    {vinHistory.map((h) => (
                      <button
                        key={h.vin}
                        type="button"
                        onClick={() => {
                          const r = decodeVin(h.vin)
                          if (r.isValid) applyVinResult(r)
                        }}
                        className="flex items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-violet-100 transition"
                      >
                        <span className="font-mono text-[11px] text-slate-600">{h.vin}</span>
                        {h.brand && <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700">{h.brand}</span>}
                        {h.year && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-600">ปี {h.year}</span>}
                        <span className="ml-auto text-[9px] text-slate-400">
                          {new Date(h.ts).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-400">
                WMI (3 ตัวแรก) = ยี่ห้อ · ตำแหน่งที่ 10 = ปีรถ · ตำแหน่งที่ 9 = check digit
              </p>
            </div>
          )}
        </div>

        {/* ── Breadcrumb strip ── */}
        {(catId || brandQuery || modelQuery) ? (
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5">
            {catId && (
              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                {categoryLabel}
              </span>
            )}
            {catId && brandQuery && <span className="text-[11px] text-slate-300">›</span>}
            {brandQuery && (
              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                {brandQuery}
              </span>
            )}
            {brandQuery && modelQuery && <span className="text-[11px] text-slate-300">›</span>}
            {modelQuery && (
              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                {modelQuery}
              </span>
            )}
            <button
              type="button"
              onClick={() => { setCatId(''); setBrandId(''); setBrandQuery(''); setModelId(''); setModelQuery('') }}
              className="ml-auto rounded p-0.5 text-slate-400 hover:text-slate-700"
              title="ล้างการเลือกทั้งหมด"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : null}

        {/* ── Brand / Model / Spec fields ── */}
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">

          {/* ยี่ห้อ */}
          <label className="block min-w-0">
            <span className={clsx(labelClass, alignedLabelCls)}>ยี่ห้อ</span>
            <div className="relative">
              <input
                className={inputCls}
                value={brandQuery}
                onFocus={() => {
                  setBrandDropdownOpen(true)
                  const idx = filteredBrands.findIndex((b) => b.id === brandId && b.categoryId === catId)
                  setBrandHighlightedIndex(idx >= 0 ? idx : 0)
                }}
                onBlur={() => window.setTimeout(() => setBrandDropdownOpen(false), 120)}
                onChange={(e) => {
                  setBrandDropdownOpen(true)
                  setBrandQuery(e.target.value)
                  setBrandHighlightedIndex(0)
                  if (brandId) { setBrandId(''); setModelId('') }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setBrandDropdownOpen(true); setBrandHighlightedIndex((p) => moveHighlightIndex(p, filteredBrands.length, 1)); return }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setBrandDropdownOpen(true); setBrandHighlightedIndex((p) => moveHighlightIndex(p, filteredBrands.length, -1)); return }
                  if (e.key === 'Escape') setBrandDropdownOpen(false)
                  if (e.key === 'Enter' && filteredBrands.length > 0) {
                    e.preventDefault()
                    onBrandPick(filteredBrands[brandHighlightedIndex >= 0 ? brandHighlightedIndex : 0])
                    setBrandDropdownOpen(false)
                  }
                }}
                disabled={!visibleCategories.length || !allBrands.length}
                placeholder={visibleCategories.length ? 'พิมพ์หรือเลือก...' : '—'}
              />
              {brandDropdownOpen && visibleCategories.length > 0 && allBrands.length > 0 ? (
                <div ref={brandDropdownRef} className={dropdownPanelClass}>
                  {/* Recent brands section */}
                  {showRecentSection && (
                    <>
                      <p className="px-1.5 pb-0.5 pt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">ล่าสุด</p>
                      {visibleRecentBrands.map((b) => {
                        const isSelected = brandId === b.id && catId === b.categoryId
                        return (
                          <button
                            key={`recent-${b.categoryId}-${b.id}`}
                            type="button"
                            onMouseDown={(ev) => ev.preventDefault()}
                            onClick={() => { onBrandPick(b); setBrandDropdownOpen(false) }}
                            className={clsx(
                              'flex w-full items-center justify-between gap-1 rounded px-1.5 py-1 text-left text-[11px] transition',
                              isSelected ? 'bg-sky-500 text-white' : 'text-slate-700 hover:bg-sky-50',
                            )}
                          >
                            <span className="truncate font-medium">{b.name}</span>
                            <span className={clsx('shrink-0 text-[9px]', isSelected ? 'text-sky-200' : 'text-slate-400')}>{b.categoryLabel}</span>
                          </button>
                        )
                      })}
                      <div className="my-1 border-t border-slate-100" />
                      <p className="px-1.5 pb-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">ทั้งหมด</p>
                    </>
                  )}
                  {filteredBrands.length === 0 ? (
                    <p className="px-1.5 py-1 text-[11px] text-slate-500">ไม่พบยี่ห้อ</p>
                  ) : (
                    filteredBrands.map((b, idx) => {
                      const count = modelCountByBrand.get(`${b.categoryId}::${b.id}`) ?? 0
                      const isSelected = brandId === b.id && catId === b.categoryId
                      const isHighlighted = idx === brandHighlightedIndex
                      return (
                        <button
                          key={`${b.categoryId}-${b.id}`}
                          type="button"
                          data-brand-index={idx}
                          onMouseDown={(ev) => ev.preventDefault()}
                          onMouseEnter={() => setBrandHighlightedIndex(idx)}
                          onClick={() => { onBrandPick(b); setBrandDropdownOpen(false) }}
                          className={clsx(
                            'flex w-full items-center justify-between gap-1 rounded px-1.5 py-1 text-left text-[11px] transition',
                            isSelected ? 'bg-sky-500 text-white' : isHighlighted ? 'bg-sky-50 text-sky-900' : 'text-slate-700 hover:bg-slate-50',
                          )}
                        >
                          <span className="truncate font-medium">{b.name}</span>
                          {count > 0 && (
                            <span className={clsx('shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold', isSelected ? 'bg-sky-400 text-white' : 'bg-slate-100 text-slate-500')}>
                              {count} รุ่น
                            </span>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              ) : null}
            </div>
          </label>

          {/* รุ่น */}
          <label className="block min-w-0">
            <span className={clsx(labelClass, alignedLabelCls)}>รุ่น</span>
            <div className="relative">
              <input
                ref={modelInputRef}
                className={inputCls}
                value={modelQuery}
                onFocus={() => {
                  setModelDropdownOpen(true)
                  const idx = filteredModels.findIndex((m) => m.id === modelId && m.categoryId === catId)
                  setModelHighlightedIndex(idx >= 0 ? idx : 0)
                }}
                onBlur={() => window.setTimeout(() => setModelDropdownOpen(false), 120)}
                onChange={(e) => {
                  setModelDropdownOpen(true)
                  setModelQuery(e.target.value)
                  setModelHighlightedIndex(0)
                  if (modelId) setModelId('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setModelDropdownOpen(true); setModelHighlightedIndex((p) => moveHighlightIndex(p, filteredModels.length, 1)); return }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setModelDropdownOpen(true); setModelHighlightedIndex((p) => moveHighlightIndex(p, filteredModels.length, -1)); return }
                  if (e.key === 'Escape') setModelDropdownOpen(false)
                  if (e.key === 'Enter' && filteredModels.length > 0) {
                    e.preventDefault()
                    onModelPick(filteredModels[modelHighlightedIndex >= 0 ? modelHighlightedIndex : 0])
                    setModelDropdownOpen(false)
                  }
                }}
                disabled={!visibleCategories.length || !allModels.length}
                placeholder="พิมพ์หรือเลือก..."
              />
              {modelDropdownOpen && visibleCategories.length > 0 && allModels.length > 0 ? (
                <div ref={modelDropdownRef} className={dropdownPanelClass}>
                  {/* VIN year context header */}
                  {lastVinYear && !modelQuery.trim() && (
                    <div className="mb-1 flex items-center gap-1.5 rounded bg-violet-50 px-2 py-1">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-violet-500">VIN ปี {lastVinYear}</span>
                      <span className="text-[9px] text-violet-400">— เลือกรุ่นที่ตรงกัน</span>
                    </div>
                  )}
                  {/* Models already in this product's fitment rows */}
                  {existingModelsForBrand.length > 0 && !modelQuery.trim() && (
                    <>
                      <p className="px-1.5 pb-0.5 pt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">มีในสินค้านี้แล้ว</p>
                      {existingModelsForBrand.map((em) => {
                        const full = filteredModels.find((m) => m.id === em.id)
                        const isSelected = modelId === em.id
                        return (
                          <button
                            key={`existing-${em.id}`}
                            type="button"
                            onMouseDown={(ev) => ev.preventDefault()}
                            onClick={() => {
                              if (full) { onModelPick(full); setModelDropdownOpen(false) }
                              else { setModelQuery(em.name); setModelId(em.id); setModelDropdownOpen(false) }
                            }}
                            className={clsx(
                              'flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[11px] transition',
                              isSelected ? 'bg-indigo-500 text-white' : 'text-indigo-700 hover:bg-indigo-50',
                            )}
                          >
                            <span className="truncate font-medium">{em.name}</span>
                            <span className={clsx('ml-auto shrink-0 text-[9px]', isSelected ? 'text-indigo-200' : 'text-indigo-400')}>+ เครื่องใหม่</span>
                          </button>
                        )
                      })}
                      <div className="my-1 border-t border-slate-100" />
                      <p className="px-1.5 pb-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">ทั้งหมด</p>
                    </>
                  )}
                  {filteredModels.length === 0 ? (
                    <p className="px-1.5 py-1 text-[11px] text-slate-500">ไม่พบรุ่น</p>
                  ) : (
                    filteredModels.map((m, idx) => {
                      const isSelected = modelId === m.id && catId === m.categoryId
                      const isHighlighted = idx === modelHighlightedIndex
                      return (
                        <button
                          key={`${m.categoryId}-${m.id}`}
                          type="button"
                          data-model-index={idx}
                          onMouseDown={(ev) => ev.preventDefault()}
                          onMouseEnter={() => setModelHighlightedIndex(idx)}
                          onClick={() => { onModelPick(m); setModelDropdownOpen(false) }}
                          className={clsx(
                            'flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[11px] transition',
                            isSelected ? 'bg-indigo-500 text-white' : isHighlighted ? 'bg-indigo-50 text-indigo-900' : 'text-slate-700 hover:bg-slate-50',
                          )}
                        >
                          <span className="truncate font-medium">{m.name}</span>
                          {!catId && (
                            <span className={clsx('ml-auto shrink-0 rounded px-1 text-[9px]', isSelected ? 'text-indigo-200' : 'text-slate-400')}>
                              {m.categoryLabel}
                            </span>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              ) : null}
            </div>
          </label>

          {/* เครื่อง — with "copy from last row" shortcut */}
          <label className="block min-w-0">
            <span className={clsx(labelClass, 'mb-0.5 flex min-h-[1.75rem] items-end justify-between text-[10px] font-medium leading-snug text-slate-600')}>
              <span>เครื่อง</span>
              {rows.length > 0 && !editingRowId && (
                <button
                  type="button"
                  onClick={copyLastRowSpec}
                  className="font-normal text-sky-600 hover:underline"
                >
                  ↺ แถวล่าสุด
                </button>
              )}
            </span>
            <input
              className={inputCls}
              value={manualEngineText}
              onChange={(e) => setManualEngineText(e.target.value)}
              placeholder="เช่น 2.0, 1KD, 4JA1"
            />
          </label>

          {/* ขับเคลื่อน */}
          <label className="block min-w-0">
            <span className={clsx(labelClass, alignedLabelCls)}>ขับเคลื่อน</span>
            <input
              className={inputCls}
              value={manualDriveType}
              onChange={(e) => setManualDriveType(e.target.value.toUpperCase())}
              placeholder="เช่น 4WD, AWD"
            />
          </label>

          {/* ปีเริ่ม */}
          <label className="block min-w-0">
            <span className={clsx(labelClass, alignedLabelCls)}>ปีเริ่ม</span>
            <input
              className={inputCls}
              inputMode="numeric"
              value={manualYearFrom}
              onChange={(e) => setManualYearFrom(e.target.value)}
              placeholder="เช่น 1995"
            />
            {hasYearFromInput && parsedYearFrom === undefined ? (
              <span className="mt-0.5 block text-[10px] text-rose-700">กรอกปีเริ่มเป็นตัวเลข 1900-2100</span>
            ) : null}
          </label>

          {/* ปีสิ้นสุด */}
          <label className="block min-w-0">
            <span className={clsx(labelClass, alignedLabelCls)}>ปีสิ้นสุด</span>
            <input
              className={inputCls}
              inputMode="numeric"
              value={manualYearTo}
              onChange={(e) => setManualYearTo(e.target.value)}
              placeholder="เช่น 2015"
            />
            {hasYearToInput && parsedYearTo === undefined ? (
              <span className="mt-0.5 block text-[10px] text-rose-700">กรอกปีสิ้นสุดเป็นตัวเลข 1900-2100</span>
            ) : null}
          </label>
        </div>

      </div>

      {hasYearRangeError ? (
        <p className="mt-1 text-[10px] text-rose-700">ปีเริ่มต้องน้อยกว่าหรือเท่าปีสิ้นสุด</p>
      ) : null}

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={!canAddResolved || isDuplicate}
          onClick={handleAddOrUpdate}
          className={clsx(
            'inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition',
            canAddResolved && !isDuplicate
              ? 'border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100'
              : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400',
          )}
        >
          <Plus className="size-3.5" />
          {editingRowId ? 'บันทึกการแก้ไขชุดนี้' : 'เพิ่มชุดนี้'}
        </button>
        {editingRowId ? (
          <button
            type="button"
            onClick={resetFormState}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
          >
            ยกเลิกแก้ไข
          </button>
        ) : null}
        {/* ── Duplicate warning ── */}
        {isDuplicate && (
          <span className="text-[11px] font-semibold text-amber-600">
            ⚠ มีรุ่นนี้อยู่แล้ว
          </span>
        )}
      </div>

      {/* ── Rows list — grouped by brand ── */}
      {rows.length > 0 ? (
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              รุ่นที่ผูกไว้ ({rows.length})
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {groupedRows.map((group) => (
              <div key={group.key}>
                {/* Brand group header */}
                <div className="sticky top-0 flex items-center gap-2 border-b border-slate-100 bg-slate-50/95 px-3 py-1 backdrop-blur-sm">
                  <span className="text-[11px] font-bold text-slate-700">{group.brandName}</span>
                  <span className="rounded bg-slate-200 px-1 py-0.5 text-[9px] font-semibold text-slate-500">{group.categoryLabel}</span>
                  <span className="ml-auto text-[9px] text-slate-400">{group.items.length} รุ่น</span>
                </div>
                {group.items.map((r, idx) => {
                  const engineDisplay =
                    r.engineText ||
                    (r.engineLabel && r.engineLabel !== 'ไม่ระบุเครื่อง/ปี'
                      ? extractEngineTextFromLabel(r.engineLabel)
                      : '')
                  const yearDisplay = (() => {
                    if (r.yearFrom !== undefined || r.yearTo !== undefined)
                      return buildYearRangeLabel(r.yearFrom, r.yearTo)
                    if (r.yearRangeText) return r.yearRangeText
                    if (r.engineLabel && r.engineLabel !== 'ไม่ระบุเครื่อง/ปี') {
                      const p = parseYearRangeFromText(r.engineLabel)
                      if (p.yearFrom !== undefined || p.yearTo !== undefined)
                        return buildYearRangeLabel(p.yearFrom, p.yearTo)
                    }
                    return ''
                  })()
                  const specParts: string[] = []
                  if (engineDisplay) specParts.push(engineDisplay)
                  if (r.engineCode) specParts.push(`[${r.engineCode}]`)
                  if (r.driveType) specParts.push(r.driveType)
                  if (yearDisplay) specParts.push(`ปี ${yearDisplay}`)
                  if (r.brakePosition === 'front') specParts.push('เบรกหน้า')
                  else if (r.brakePosition === 'rear') specParts.push('เบรกหลัง')
                  const isEditing = editingRowId === r.id
                  return (
                    <div
                      key={r.id}
                      className={clsx(
                        'flex items-center gap-2 py-2 pl-4 pr-2 transition',
                        isEditing
                          ? 'border-l-2 border-sky-400 bg-sky-50'
                          : idx % 2 === 0
                            ? 'border-l-2 border-transparent bg-white'
                            : 'border-l-2 border-transparent bg-slate-50/50',
                      )}
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-[12px] font-semibold text-slate-800">{r.modelName}</span>
                        {specParts.length > 0 ? (
                          <span className="truncate text-[11px] text-slate-500">{specParts.join(' · ')}</span>
                        ) : (
                          <span className="text-[11px] italic text-slate-400">ไม่ระบุเครื่อง/ปี</span>
                        )}
                      </span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => copyBrandModel(r)}
                          className="rounded p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"
                          title="คัดลอกยี่ห้อ/รุ่น — เพิ่มเครื่องใหม่สำหรับรุ่นนี้"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => beginEdit(r)}
                          className={clsx(
                            'rounded p-1 transition',
                            isEditing ? 'bg-sky-100 text-sky-700' : 'text-slate-400 hover:bg-sky-50 hover:text-sky-700',
                          )}
                          title="แก้ไข"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(r.id)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-1.5 text-[10px] text-slate-400">ยังไม่ได้เพิ่มรุ่นรถ</p>
      )}
    </div>
  )
}
