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
  /** Structured fields surfaced from VehicleFitmentRef for richer display */
  vehicleType?: string
  engineSeries?: string
  chassisCode?: string
  /** รุ่นย่อย / trim — เช่น "e:HEV", "Cedia", "Vigo" */
  trim?: string
  wheels?: string
  hp?: number
  euroStandard?: string
  engineSize?: string
}

const inputCls =
  'w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[13px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400/70 focus:ring-1 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400'

const dropdownPanelClass =
  'absolute z-[60] mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg'


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
  const [manualEngineCode, setManualEngineCode] = useState('')
  const [manualDriveType, setManualDriveType] = useState('')
  const [manualYearFrom, setManualYearFrom] = useState('')
  const [manualYearTo, setManualYearTo] = useState('')
  const [manualChassisCode, setManualChassisCode] = useState('')
  const [manualTrim, setManualTrim] = useState('')
  const [manualHp, setManualHp] = useState('')
  const [manualEuro, setManualEuro] = useState('')
  const [editingRowId, setEditingRowId] = useState<string | null>(null)

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
    const engineText = manualEngineTextTrim
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

  // ── Grouped rows: Brand → sorted Model sub-groups ───────────────────────
  const groupedRows = useMemo(() => {
    type ModelGroup = { modelKey: string; modelName: string; items: VehicleFitRow[] }
    type BrandGroup = { key: string; brandName: string; categoryLabel: string; models: ModelGroup[] }
    const brands: BrandGroup[] = []
    const brandIdx = new Map<string, number>()
    for (const r of rows) {
      const bKey = `${r.categoryId}::${r.brandId}`
      let bi = brandIdx.get(bKey)
      if (bi === undefined) {
        bi = brands.length
        brandIdx.set(bKey, bi)
        brands.push({ key: bKey, brandName: r.brandName, categoryLabel: r.categoryLabel, models: [] })
      }
      const bg = brands[bi]
      const mKey = `${bKey}::${r.modelId}`
      let mg = bg.models.find((m) => m.modelKey === mKey)
      if (!mg) {
        mg = { modelKey: mKey, modelName: r.modelName, items: [] }
        bg.models.push(mg)
      }
      mg.items.push(r)
    }
    // sort models alphabetically within each brand
    for (const bg of brands) {
      bg.models.sort((a, b) => a.modelName.localeCompare(b.modelName, undefined, { sensitivity: 'base' }))
    }
    return brands
  }, [rows])

  function resetFormState() {
    setBrakePos('')
    setManualEngineText('')
    setManualEngineCode('')
    setManualDriveType('')
    setManualYearFrom('')
    setManualYearTo('')
    setManualChassisCode('')
    setManualTrim('')
    setManualHp('')
    setManualEuro('')
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
    setManualEngineText(engineRaw)
    setManualEngineCode(last.engineCode ?? '')
    setManualDriveType(last.driveType ?? last.wheels ?? '')
    setManualYearFrom(last.yearFrom != null ? String(last.yearFrom) : '')
    setManualYearTo(last.yearTo != null ? String(last.yearTo) : '')
    setManualChassisCode(last.chassisCode ?? '')
    setManualTrim(last.trim ?? '')
    setManualHp(last.hp != null ? String(last.hp) : '')
    setManualEuro(last.euroStandard ?? '')
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
    setManualEngineText(cleanEngine)
    setManualEngineCode(row.engineCode ?? '')
    setManualDriveType(
      row.driveType ??
        row.wheels ??
        extractDriveTypeFromLabel(row.engineLabel ?? '') ??
        extractDriveTypeFromLabel(row.engineText ?? ''),
    )
    setManualYearFrom(yearResolved.yearFrom != null ? String(yearResolved.yearFrom) : '')
    setManualYearTo(yearResolved.yearTo != null ? String(yearResolved.yearTo) : '')
    setManualChassisCode(row.chassisCode ?? '')
    setManualTrim(row.trim ?? '')
    setManualHp(row.hp != null ? String(row.hp) : '')
    setManualEuro(row.euroStandard ?? '')
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
    const engineText = manualEngineTextTrim
    const engineCode = manualEngineCode.trim()
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
    const manualChassisTrim = manualChassisCode.trim()
    const manualTrimVal = manualTrim.trim()
    const manualHpNum = manualHp.trim().length > 0 ? Number(manualHp.trim()) : NaN
    const manualEuroTrim = manualEuro.trim()
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
      ...(manualChassisTrim ? { chassisCode: manualChassisTrim } : {}),
      ...(manualTrimVal ? { trim: manualTrimVal } : {}),
      ...(Number.isFinite(manualHpNum) && manualHpNum > 0 ? { hp: manualHpNum } : {}),
      ...(manualEuroTrim ? { euroStandard: manualEuroTrim } : {}),
      ...(editingRow?.vehicleType ? { vehicleType: editingRow.vehicleType } : {}),
      ...(editingRow?.engineSeries ? { engineSeries: editingRow.engineSeries } : {}),
      ...(editingRow?.engineSize ? { engineSize: editingRow.engineSize } : {}),
      brakePosition: brakePos || undefined,
    }
    if (editingRowId) onUpdate(editingRowId, rowPayload)
    else onAdd(rowPayload)
    resetFormState()
  }

  // ── Models already used in this product's fitment rows (for this brand) ──
  const existingModelsForBrand = useMemo(() => {
    if (!brandId && !brandQuery.trim()) return []
    const bq = brandQuery.trim().toLowerCase()
    return rows
      .filter((r) => r.brandId === brandId || r.brandName.toLowerCase() === bq)
      .map((r) => ({ id: r.modelId, name: r.modelName }))
      .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i)
  }, [rows, brandId, brandQuery])
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

      <div ref={formTopRef} className="flex flex-col gap-3">

        {/* ── Category pills ── */}
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleCategories.length === 0 ? (
            <span className="text-[11px] text-slate-400">ไม่มีประเภทที่แสดง</span>
          ) : visibleCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCategory(c.id)}
              className={clsx(
                'shrink-0 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition',
                catId === c.id
                  ? 'border-sky-400 bg-sky-500 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* ── Brand + Model row ── */}
        <div className="grid grid-cols-2 gap-2">
          {/* Brand */}
          <div>
            <p className="mb-1 text-[11px] font-semibold text-slate-500">ยี่ห้อ</p>
            <div className="relative">
              <input
                className={clsx(inputCls, !catId && 'cursor-not-allowed opacity-40')}
                value={brandQuery}
                disabled={!catId}
                onFocus={() => { setBrandDropdownOpen(true); setBrandHighlightedIndex(0) }}
                onBlur={() => window.setTimeout(() => setBrandDropdownOpen(false), 120)}
                onChange={(e) => { setBrandDropdownOpen(true); setBrandQuery(e.target.value); setBrandHighlightedIndex(0); if (brandId) { setBrandId(''); setModelId(''); setModelQuery('') } }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setBrandDropdownOpen(true); setBrandHighlightedIndex((p) => moveHighlightIndex(p, filteredBrands.length, 1)); return }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setBrandDropdownOpen(true); setBrandHighlightedIndex((p) => moveHighlightIndex(p, filteredBrands.length, -1)); return }
                  if (e.key === 'Escape') { setBrandDropdownOpen(false) }
                  if (e.key === 'Enter' && filteredBrands.length > 0) { e.preventDefault(); onBrandPick(filteredBrands[brandHighlightedIndex >= 0 ? brandHighlightedIndex : 0]); setBrandDropdownOpen(false) }
                }}
                placeholder={catId ? 'พิมพ์หรือเลือกยี่ห้อ' : 'เลือกประเภทก่อน'}
              />
              {brandDropdownOpen && catId && filteredBrands.length > 0 ? (
                <div ref={brandDropdownRef} className={dropdownPanelClass}>
                  {filteredBrands.map((b, idx) => {
                    const count = modelCountByBrand.get(`${b.categoryId}::${b.id}`) ?? 0
                    const isSelected = brandId === b.id && catId === b.categoryId
                    const isHighlighted = idx === brandHighlightedIndex
                    return (
                      <button key={`${b.categoryId}-${b.id}`} type="button" data-brand-index={idx}
                        onMouseDown={(ev) => ev.preventDefault()} onMouseEnter={() => setBrandHighlightedIndex(idx)}
                        onClick={() => { onBrandPick(b); setBrandDropdownOpen(false) }}
                        className={clsx('flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-[12px] transition',
                          isSelected ? 'bg-sky-500 text-white' : isHighlighted ? 'bg-sky-50 text-sky-900' : 'text-slate-700 hover:bg-slate-50')}>
                        <span className="truncate font-medium">{b.name}</span>
                        {count > 0 && <span className={clsx('shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold', isSelected ? 'bg-sky-400 text-white' : 'bg-slate-100 text-slate-500')}>{count}</span>}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {/* Model */}
          <div>
            <p className="mb-1 text-[11px] font-semibold text-slate-500">รุ่น</p>
            <div className="relative">
              <input
                ref={modelInputRef}
                className={clsx(inputCls, (!catId || (!brandId && !brandQuery.trim())) && 'cursor-not-allowed opacity-40')}
                disabled={!catId || (!brandId && !brandQuery.trim())}
                value={modelQuery}
                onFocus={() => { setModelDropdownOpen(true); setModelHighlightedIndex(0) }}
                onBlur={() => window.setTimeout(() => setModelDropdownOpen(false), 120)}
                onChange={(e) => { setModelDropdownOpen(true); setModelQuery(e.target.value); setModelHighlightedIndex(0); if (modelId) setModelId('') }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setModelDropdownOpen(true); setModelHighlightedIndex((p) => moveHighlightIndex(p, filteredModels.length, 1)); return }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setModelDropdownOpen(true); setModelHighlightedIndex((p) => moveHighlightIndex(p, filteredModels.length, -1)); return }
                  if (e.key === 'Escape') setModelDropdownOpen(false)
                  if (e.key === 'Enter' && filteredModels.length > 0) { e.preventDefault(); onModelPick(filteredModels[modelHighlightedIndex >= 0 ? modelHighlightedIndex : 0]); setModelDropdownOpen(false) }
                }}
                placeholder={!catId || (!brandId && !brandQuery.trim()) ? 'เลือกยี่ห้อก่อน' : 'พิมพ์หรือเลือกรุ่น'}
              />
              {modelDropdownOpen && filteredModels.length > 0 ? (
                <div ref={modelDropdownRef} className={dropdownPanelClass}>
                  {lastVinYear && !modelQuery.trim() && (
                    <div className="mb-1 flex items-center gap-1.5 rounded bg-violet-50 px-2 py-1">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-violet-500">VIN ปี {lastVinYear}</span>
                      <span className="text-[9px] text-violet-400">— เลือกรุ่นที่ตรงกัน</span>
                    </div>
                  )}
                  {existingModelsForBrand.length > 0 && !modelQuery.trim() && (
                    <>
                      <p className="px-2 pb-0.5 pt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">มีในสินค้านี้แล้ว</p>
                      {existingModelsForBrand.map((em) => {
                        const full = filteredModels.find((m) => m.id === em.id)
                        const isSelected = modelId === em.id
                        return (
                          <button key={`existing-${em.id}`} type="button" onMouseDown={(ev) => ev.preventDefault()}
                            onClick={() => { if (full) { onModelPick(full); setModelDropdownOpen(false) } else { setModelQuery(em.name); setModelId(em.id); setModelDropdownOpen(false) } }}
                            className={clsx('flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-[12px] transition', isSelected ? 'bg-indigo-500 text-white' : 'text-indigo-700 hover:bg-indigo-50')}>
                            <span className="truncate font-medium">{em.name}</span>
                            <span className={clsx('ml-auto shrink-0 text-[9px]', isSelected ? 'text-indigo-200' : 'text-indigo-400')}>+ เครื่องใหม่</span>
                          </button>
                        )
                      })}
                      <div className="my-1 border-t border-slate-100" />
                    </>
                  )}
                  {filteredModels.map((m, idx) => {
                    const isSelected = modelId === m.id && catId === m.categoryId
                    const isHighlighted = idx === modelHighlightedIndex
                    return (
                      <button key={`${m.categoryId}-${m.id}`} type="button" data-model-index={idx}
                        onMouseDown={(ev) => ev.preventDefault()} onMouseEnter={() => setModelHighlightedIndex(idx)}
                        onClick={() => { onModelPick(m); setModelDropdownOpen(false) }}
                        className={clsx('flex w-full items-center rounded px-2 py-1.5 text-left text-[12px] transition',
                          isSelected ? 'bg-indigo-500 text-white' : isHighlighted ? 'bg-indigo-50 text-indigo-900' : 'text-slate-700 hover:bg-slate-50')}>
                        <span className="truncate font-medium">{m.name}</span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Engine / Year row ── */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-500">ความจุเครื่อง</p>
              {rows.length > 0 && !editingRowId && (
                <button type="button" onClick={copyLastRowSpec} className="text-[10px] text-sky-600 hover:underline">↺ ล่าสุด</button>
              )}
            </div>
            <input className={inputCls} value={manualEngineText} onChange={(e) => setManualEngineText(e.target.value)} placeholder="เช่น 2.0, 2.5" />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold text-slate-500">รหัสเครื่อง</p>
            <input className={inputCls} value={manualEngineCode} onChange={(e) => setManualEngineCode(e.target.value.toUpperCase())} placeholder="เช่น 1KD-FTV, 2GR-FE" />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold text-slate-500">ปีเริ่มต้น</p>
            <input className={inputCls} inputMode="numeric" value={manualYearFrom} onChange={(e) => setManualYearFrom(e.target.value)} placeholder="เช่น 2005" />
            {hasYearFromInput && parsedYearFrom === undefined && <p className="mt-0.5 text-[10px] text-rose-600">ปีไม่ถูกต้อง</p>}
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold text-slate-500">ปีสิ้นสุด</p>
            <input className={inputCls} inputMode="numeric" value={manualYearTo} onChange={(e) => setManualYearTo(e.target.value)} placeholder="เช่น 2015" />
            {hasYearToInput && parsedYearTo === undefined && <p className="mt-0.5 text-[10px] text-rose-600">ปีไม่ถูกต้อง</p>}
          </div>
        </div>

        {/* ── Chassis / Trim / Drive·Wheels / HP / Euro row ── */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div>
            <p className="mb-1 text-[11px] font-semibold text-slate-500">รหัสตัวถัง</p>
            <input className={inputCls} value={manualChassisCode} onChange={(e) => setManualChassisCode(e.target.value.toUpperCase())} placeholder="เช่น GUN125, AE86" />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold text-slate-500">รุ่นย่อย / Trim</p>
            <input className={inputCls} value={manualTrim} onChange={(e) => setManualTrim(e.target.value)} placeholder="เช่น e:HEV, Vigo, Cedia" />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold text-slate-500">ขับเคลื่อน / ล้อ</p>
            <input className={inputCls} value={manualDriveType} onChange={(e) => setManualDriveType(e.target.value.toUpperCase())} placeholder="เช่น 4WD, 10WD" />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold text-slate-500">แรงม้า (HP)</p>
            <input className={inputCls} inputMode="numeric" value={manualHp} onChange={(e) => setManualHp(e.target.value.replace(/[^\d]/g, ''))} placeholder="เช่น 215, 360" />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold text-slate-500">มาตรฐาน Euro</p>
            <input className={inputCls} value={manualEuro} onChange={(e) => setManualEuro(e.target.value)} placeholder="เช่น Euro 3, Euro 5" />
          </div>
        </div>

        {/* ── Action row ── */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canAddResolved || isDuplicate}
            onClick={handleAddOrUpdate}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[12px] font-semibold transition',
              canAddResolved && !isDuplicate
                ? 'bg-sky-500 text-white hover:bg-sky-600 active:scale-95 shadow-sm'
                : 'cursor-not-allowed bg-slate-100 text-slate-400',
            )}
          >
            <Plus className="size-3.5" />
            {editingRowId ? 'บันทึกการแก้ไข' : 'เพิ่มรุ่นนี้'}
          </button>
          {editingRowId && (
            <button type="button" onClick={resetFormState} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50">
              ยกเลิก
            </button>
          )}
          {isDuplicate && <span className="text-[11px] font-semibold text-amber-600">⚠ มีรุ่นนี้อยู่แล้ว</span>}
          <button
            type="button"
            onClick={() => setShowVin((v) => !v)}
            className={clsx(
              'ml-auto inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition',
              showVin ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:text-violet-600',
            )}
          >
            <ScanSearch className="size-3.5" />VIN
          </button>
        </div>

        {/* ── VIN panel ── */}
        {showVin && (
          <div className="flex flex-col gap-2 rounded-xl border border-violet-200 bg-violet-50/60 p-3">
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
              <span className={clsx('shrink-0 text-[11px] font-semibold tabular-nums', vinInput.length === 17 ? 'text-emerald-600' : 'text-slate-400')}>
                {vinInput.length}/17
              </span>
              <button type="button" onClick={() => { setShowVin(false); setVinInput('') }} className="rounded p-1 text-slate-400 hover:text-slate-700">
                <X className="size-3.5" />
              </button>
            </div>
            {vinResult && (
              <div className={clsx('rounded-lg border px-3 py-2', vinResult.isValid ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50')}>
                {!vinResult.isValid ? (
                  <p className="text-[11px] font-semibold text-rose-700">{vinResult.error}</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold text-slate-400">
                        {vinResult.vin.slice(0, 3)}<span className="text-slate-300">·</span>{vinResult.vin.slice(3, 8)}<span className="text-slate-300">·</span>
                        <span className={clsx(vinResult.checkDigit === 'valid' ? 'text-emerald-600' : vinResult.checkDigit === 'invalid' ? 'text-rose-500' : 'text-slate-400')}>{vinResult.vin[8]}</span>
                        <span className="text-slate-300">·</span>{vinResult.vin.slice(9)}
                      </span>
                      <CheckDigitBadge status={vinResult.checkDigit} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {vinResult.brand
                        ? <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700">{vinResult.brand}</span>
                        : <span className="text-[11px] text-slate-400">ไม่พบยี่ห้อใน WMI table</span>}
                      {vinResult.modelYear && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                          ปี {vinResult.modelYear}{vinResult.modelYearAlt ? <span className="font-normal text-indigo-400"> (หรือ {vinResult.modelYearAlt})</span> : null}
                        </span>
                      )}
                      <button type="button" onClick={() => applyVinResult()} className="ml-auto rounded-lg bg-violet-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-violet-700 active:scale-95">
                        ใช้ข้อมูลนี้ ↵
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {vinHistory.length > 0 && (
              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">VIN ล่าสุด</p>
                <div className="flex flex-col gap-0.5">
                  {vinHistory.map((h) => (
                    <button key={h.vin} type="button"
                      onClick={() => { const r = decodeVin(h.vin); if (r.isValid) applyVinResult(r) }}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-violet-100">
                      <span className="font-mono text-[11px] text-slate-600">{h.vin}</span>
                      {h.brand && <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700">{h.brand}</span>}
                      {h.year && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-600">ปี {h.year}</span>}
                      <span className="ml-auto text-[9px] text-slate-400">{new Date(h.ts).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[10px] text-slate-400">WMI (3 ตัวแรก) = ยี่ห้อ · ตำแหน่งที่ 10 = ปีรถ · ตำแหน่งที่ 9 = check digit</p>
          </div>
        )}

      </div>

      {hasYearRangeError && (
        <p className="mt-1 text-[10px] text-rose-600">ปีเริ่มต้องน้อยกว่าหรือเท่าปีสิ้นสุด</p>
      )}

      {/* ── Rows list — Brand → Model → spec rows ── */}
      {rows.length > 0 ? (
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center border-b border-slate-100 bg-slate-50 px-3 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              รุ่นที่ผูกไว้ ({rows.length})
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {groupedRows.map((brand) => (
              <div key={brand.key}>
                {/* ── Brand header ── */}
                <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-100 bg-slate-100/95 px-3 py-1 backdrop-blur-sm">
                  <span className="text-[11px] font-extrabold tracking-wide text-slate-700">{brand.brandName}</span>
                  <span className="rounded bg-slate-300/60 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">{brand.categoryLabel}</span>
                  <span className="ml-auto text-[9px] text-slate-400">{brand.models.length} รุ่น</span>
                </div>

                {brand.models.map((mg) => (
                  <div key={mg.modelKey}>
                    {/* ── Model sub-header ── */}
                    <div className="flex items-center gap-2 border-b border-slate-50 bg-white px-3 py-1.5">
                      <span className="text-[12px] font-bold text-slate-800">{mg.modelName}</span>
                      {mg.items.length > 1 && (
                        <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-500">
                          {mg.items.length} ชุด
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => copyBrandModel(mg.items[0])}
                        className="ml-auto rounded p-1 text-slate-300 hover:bg-emerald-50 hover:text-emerald-600"
                        title="คัดลอกรุ่นนี้ — เพิ่มเครื่องใหม่"
                      >
                        <Copy className="size-3" />
                      </button>
                    </div>

                    {/* ── Spec rows ── */}
                    {mg.items.map((r) => {
                      const engineDisplay =
                        r.engineText ||
                        (r.engineLabel && r.engineLabel !== 'ไม่ระบุเครื่อง/ปี'
                          ? extractEngineTextFromLabel(r.engineLabel)
                          : '')
                      const displacement =
                        r.engineSize ||
                        (engineDisplay && /^\d+(?:\.\d+)?$/.test(engineDisplay.trim())
                          ? engineDisplay.trim()
                          : '')
                      const showEngineDisplayAsSlate = engineDisplay && engineDisplay.trim() !== displacement
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
                      const parts: string[] = []
                      if (engineDisplay) parts.push(engineDisplay)
                      if (r.engineCode) parts.push(`[${r.engineCode}]`)
                      if (r.driveType) parts.push(r.driveType)
                      const isEditing = editingRowId === r.id
                      return (
                        <div
                          key={r.id}
                          className={clsx(
                            'flex items-center gap-1 border-b border-slate-50 py-1.5 pl-6 pr-2 transition',
                            isEditing ? 'border-l-2 border-sky-400 bg-sky-50' : 'border-l-2 border-transparent hover:bg-slate-50/60',
                          )}
                        >
                          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                            {(parts.length > 0 || r.chassisCode || r.trim || r.hp || r.wheels || r.euroStandard || r.engineSize || displacement) ? (
                              <>
                                {/* Chassis code, or non-numeric engine descriptor (e.g. "VVT-i") */}
                                {r.chassisCode ? (
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">{r.chassisCode}</span>
                                ) : showEngineDisplayAsSlate ? (
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">{engineDisplay}</span>
                                ) : null}
                                {/* Engine displacement (highlighted) */}
                                {displacement ? (
                                  <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">{displacement}L</span>
                                ) : null}
                                {r.hp != null ? (
                                  <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">{r.hp} HP</span>
                                ) : null}
                                {r.euroStandard ? (
                                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">{r.euroStandard}</span>
                                ) : null}
                                {/* Trim / submodel */}
                                {r.trim ? (
                                  <span className="rounded bg-pink-50 px-1.5 py-0.5 text-[10px] font-semibold text-pink-700">{r.trim}</span>
                                ) : null}
                                {/* Wheels */}
                                {r.wheels ? (
                                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">{r.wheels}</span>
                                ) : null}
                                {r.driveType
                                  ? r.driveType
                                      .split(/[\/,+]/)
                                      .map((d) => d.trim())
                                      .filter(Boolean)
                                      .map((d, i) => (
                                        <span
                                          key={`${r.id}-drive-${i}`}
                                          className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700"
                                        >
                                          {d}
                                        </span>
                                      ))
                                  : null}
                                {/* Engine code in brackets */}
                                {r.engineCode ? (
                                  <span className="text-[10px] font-mono text-slate-400">[{r.engineCode}]</span>
                                ) : null}
                                {yearDisplay ? (
                                  <span className="text-[11px] text-slate-500">ปี {yearDisplay}</span>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-[11px] italic text-slate-400">ไม่ระบุเครื่อง/ปี</span>
                            )}
                          </span>
                          <div className="flex shrink-0 items-center gap-0.5">
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
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-1.5 text-[10px] text-slate-400">ยังไม่ได้เพิ่มรุ่นรถ</p>
      )}
    </div>
  )
}
