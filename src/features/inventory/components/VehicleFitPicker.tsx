import { useVehicleCatalog } from '@/features/vehicle/context/VehicleCatalogContext'
import { clsx } from 'clsx'
import { Copy, Pencil, Plus, X } from 'lucide-react'
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
  /** เว้นว่าง = ไม่ระบุ (กรอง/ของทั่วไป) — ใช้กับผ้าเบรก/ดิสก์ */
  brakePosition?: '' | 'front' | 'rear'
}

const inputCls =
  'w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[13px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400/70 focus:ring-1 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400'

const dropdownPanelClass =
  'absolute z-[60] mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg'

const alignedLabelCls = 'mb-0.5 flex min-h-[1.75rem] items-end text-[10px] font-medium leading-snug text-slate-600'

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
  /** แสดงทางขวาของหัวข้อ เช่น ปุ่มเปิดจัดการรุ่นรถ */
  titleAction?: ReactNode
  /** true = ไม่แสดงแถบหัวข้อ (ใช้เมื่อห่อด้วย summary ภายนอก) */
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

function compactEngineLabel(label: string): string {
  const parts = label
    .split(' · ')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length <= 1) return label
  const yearPart = parts.pop()
  if (!yearPart) return label
  return `${parts.join(' · ')} · (${yearPart})`
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
  if (mTo) {
    const to = parseYearInput(mTo[1])
    return { yearTo: to }
  }
  const mFromNow = t.match(/(\d{4})\s*[-–]\s*ปัจจุบัน/i)
  if (mFromNow) {
    const from = parseYearInput(mFromNow[1])
    return { yearFrom: from }
  }
  return {}
}

function extractEngineTextFromLabel(label: string): string {
  const t = label.trim()
  if (!t) return ''
  const yearLike = '(?:ถึง\\s*\\d{4}|\\d{4}\\s*[-–]\\s*\\d{4}|\\d{4}\\s*[-–]\\s*ปัจจุบัน|ปี\\s*\\d{4}(?:\\s*[-–]\\s*(?:\\d{4}|ปัจจุบัน))?)'
  // ตัดท้ายรูปแบบ "(2001-2010)" / "(ถึง 2010)" / "(2001-ปัจจุบัน)"
  const withoutParenYear = t.replace(
    new RegExp(`\\s*\\(\\s*${yearLike}\\s*\\)\\s*$`, 'i'),
    '',
  )
  // ตัดท้ายรูปแบบ "· (2001-2010)" ที่เคยจัดรูปไว้
  const withoutDotYear = withoutParenYear.replace(
    new RegExp(`\\s*[·•]\\s*\\(\\s*${yearLike}\\s*\\)\\s*$`, 'i'),
    '',
  )
  // ตัดท้ายรูปแบบไม่ใส่วงเล็บ เช่น "1KD 2001-2010", "1KD ถึง 2010", "1KD 2001-ปัจจุบัน", "1KD ปี 2001-2010"
  const withoutPlainYearSuffix = withoutDotYear.replace(
    new RegExp(`\\s+${yearLike}\\s*$`, 'i'),
    '',
  )
  // ตัดท้ายแบบมีตัวคั่น "· ปี 2005-2010" / "- 2005-2010"
  const withoutSeparatedYearSuffix = withoutPlainYearSuffix.replace(
    new RegExp(`\\s*(?:[·•\\-–:]|ปี)\\s*${yearLike}\\s*$`, 'i'),
    '',
  )
  // เก็บงานตัวคั่นค้างท้าย เช่น "1KD ·" หลังตัดปีออก
  const cleaned = withoutSeparatedYearSuffix.replace(/\s*[·•:\-–]+\s*$/, '').trim()
  // กรณีเป็น label สั้น "ปี 2001-2010" ให้ถือว่าไม่มีเครื่อง
  if (
    /^ปี\s*(?:\d{4}\s*[-–]\s*\d{4}|ถึง\s*\d{4}|\d{4}\s*[-–]\s*ปัจจุบัน)$/i.test(
      cleaned,
    )
  ) {
    return ''
  }
  return cleaned.replace(/\s*[·•:\-–]?\s*\b(\d{1,2}WD|AWD|FWD|RWD)\b\s*$/i, '').trim()
}

function extractDriveTypeFromLabel(label: string): string {
  const t = label.trim()
  if (!t) return ''
  const m = t.match(/\b(\d{1,2}WD|AWD|FWD|RWD)\b/i)
  if (!m?.[1]) return ''
  return m[1].toUpperCase()
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

  const [categoryQuery, setCategoryQuery] = useState('')
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [categoryHighlightedIndex, setCategoryHighlightedIndex] = useState(-1)

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

  const categoryDropdownRef = useRef<HTMLDivElement | null>(null)
  const brandDropdownRef = useRef<HTMLDivElement | null>(null)
  const modelDropdownRef = useRef<HTMLDivElement | null>(null)

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
        brands.push({
          id: brand.id,
          name: brand.name,
          categoryId: vc.id,
          categoryLabel: vc.label,
        })
        for (const model of catData.modelsByBrandId[brand.id] ?? []) {
          models.push({
            id: model.id,
            name: model.name,
            brandId: brand.id,
            brandName: brand.name,
            categoryId: vc.id,
            categoryLabel: vc.label,
          })
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

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLocaleLowerCase()
    const base = visibleCategories
    if (!q) return base
    return base.filter((c) => c.label.toLocaleLowerCase().includes(q))
  }, [visibleCategories, categoryQuery])

  const filteredBrands = useMemo(() => {
    const q = brandQuery.trim().toLocaleLowerCase()
    const base = allBrands.filter(
      (b) =>
        (!catId || b.categoryId === catId) &&
        (!selectedModel || (b.id === selectedModel.brandId && b.categoryId === selectedModel.categoryId)),
    )
    if (!q) return base
    return base.filter((b) => b.name.toLocaleLowerCase().includes(q))
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

  const categoryLabel = visibleCategories.find((c) => c.id === catId)?.label ?? ''
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
    parsedYearFrom !== undefined &&
    parsedYearTo !== undefined &&
    parsedYearFrom > parsedYearTo
  const hasManualSpec = !hasYearInputError && !hasYearRangeError
  const canAddResolved = Boolean(catId && (brandId || brandQuery.trim()) && (modelId || modelQuery.trim()) && hasManualSpec)

  function resetFormState() {
    setBrakePos('')
    setManualEngineText('')
    setManualDriveType('')
    setManualYearFrom('')
    setManualYearTo('')
    setEditingRowId(null)
  }

  function clearCategorySelection() {
    setCatId('')
    setBrandId('')
    setBrandQuery('')
    setModelId('')
    setModelQuery('')
  }

  function onSelectCategory(id: string) {
    setCatId(id)
    const lab = visibleCategories.find((c) => c.id === id)?.label ?? ''
    setCategoryQuery(lab)
    setBrandId('')
    setBrandQuery('')
    setModelId('')
    setModelQuery('')
    setCategoryDropdownOpen(false)
  }

  function onBrandPick(b: SearchBrandOption) {
    setCatId(b.categoryId)
    setCategoryQuery(b.categoryLabel)
    setBrandId(b.id)
    setBrandQuery(b.name)
    setModelId('')
    setModelQuery('')
  }

  function onModelPick(m: SearchModelOption) {
    setCatId(m.categoryId)
    setCategoryQuery(m.categoryLabel)
    setBrandId(m.brandId)
    setBrandQuery(m.brandName)
    setModelId(m.id)
    setModelQuery(m.name)
  }

  function clearBrandSelection() {
    setBrandId('')
    setBrandQuery('')
    setModelId('')
    setModelQuery('')
  }

  function clearModelSelection() {
    setModelId('')
    setModelQuery('')
  }

  function copyBrandModel(row: VehicleFitRow) {
    setEditingRowId(null)
    setCatId(row.categoryId)
    setCategoryQuery(row.categoryLabel)
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

  function beginEdit(row: VehicleFitRow) {
    const yearResolved =
      row.yearFrom !== undefined || row.yearTo !== undefined
        ? { yearFrom: row.yearFrom, yearTo: row.yearTo }
        : parseYearRangeFromText(row.yearRangeText ?? row.engineLabel ?? '')
    setEditingRowId(row.id)
    setCatId(row.categoryId)
    setCategoryQuery(row.categoryLabel)
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
  }

  useEffect(() => {
    if (!catId) return
    setCategoryQuery(visibleCategories.find((c) => c.id === catId)?.label ?? '')
  }, [catId, visibleCategories])

  useEffect(() => {
    if (!brandId || !catId) {
      if (!editingRowId) setBrandQuery('')
      return
    }
    if (selectedBrand?.name) setBrandQuery(selectedBrand.name)
  }, [brandId, catId, selectedBrand, editingRowId])

  useEffect(() => {
    if (!modelId || !catId) {
      if (!editingRowId) setModelQuery('')
      return
    }
    if (selectedModel?.name) setModelQuery(selectedModel.name)
  }, [modelId, catId, selectedModel, editingRowId])

  useEffect(() => {
    setCategoryHighlightedIndex((prev) => {
      if (filteredCategories.length === 0) return -1
      if (prev < 0) return 0
      return Math.min(prev, filteredCategories.length - 1)
    })
  }, [filteredCategories])

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
    if (!categoryDropdownOpen || categoryHighlightedIndex < 0) return
    const el = categoryDropdownRef.current?.querySelector<HTMLElement>(
      `[data-cat-index="${categoryHighlightedIndex}"]`,
    )
    el?.scrollIntoView({ block: 'nearest' })
  }, [categoryDropdownOpen, categoryHighlightedIndex])

  useEffect(() => {
    if (!brandDropdownOpen || brandHighlightedIndex < 0) return
    const el = brandDropdownRef.current?.querySelector<HTMLElement>(`[data-brand-index="${brandHighlightedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [brandDropdownOpen, brandHighlightedIndex])

  useEffect(() => {
    if (!modelDropdownOpen || modelHighlightedIndex < 0) return
    const el = modelDropdownRef.current?.querySelector<HTMLElement>(`[data-model-index="${modelHighlightedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [modelDropdownOpen, modelHighlightedIndex])

  useEffect(() => {
    if (!editingRowId) return
    if (!rows.some((r) => r.id === editingRowId)) {
      setEditingRowId(null)
    }
  }, [rows, editingRowId])

  function handleAddOrUpdate() {
    if (!canAddResolved) return
    const editingRow = editingRowId ? rows.find((r) => r.id === editingRowId) : undefined
    const bp = brakePos || ''
    const engineCodeMatch = manualEngineTextTrim.match(/\[([^\]]*)\]\s*$/)
    const engineCode = engineCodeMatch ? engineCodeMatch[1].trim() : ''
    const engineText = engineCodeMatch
      ? manualEngineTextTrim.slice(0, manualEngineTextTrim.lastIndexOf('[')).trim()
      : manualEngineTextTrim
    const driveType = normalizeManualText(manualDriveType)
    const yearFrom = parsedYearFrom
    const yearTo = parsedYearTo
    const yearRangeLabel = buildYearRangeLabel(yearFrom, yearTo)
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
        : `manual:${catId}:${resolvedBrandId}:${resolvedModelId}:${engineKey}:${yearRangeKey
            .toLowerCase()
            .replace(/\s+/g, '-')}`
    const resolvedCategoryLabel = categoryLabel || categoryQuery.trim() || editingRow?.categoryLabel || ''
    const resolvedBrandName = brandName || brandQuery.trim() || editingRow?.brandName || ''
    const resolvedModelName = modelName || modelQuery.trim() || editingRow?.modelName || ''
    if (!resolvedEngineId || !resolvedEngineLabel) return
    const dup = rows.some(
      (r) =>
        r.id !== editingRowId &&
        r.categoryId === catId &&
        r.brandId === resolvedBrandId &&
        r.modelId === resolvedModelId &&
        r.engineId === resolvedEngineId &&
        (r.driveType ?? '') === driveType &&
        (r.brakePosition ?? '') === bp,
    )
    if (dup) return
    const keepExistingEngineDetail =
      Boolean(editingRow) &&
      manualEngineTextTrim.length === 0 &&
      manualYearFrom.trim().length === 0 &&
      manualYearTo.trim().length === 0
    const rowPayload: VehicleFitRow = {
      id: editingRowId ?? newRowId(),
      categoryId: catId,
      categoryLabel: resolvedCategoryLabel,
      brandId: resolvedBrandId,
      brandName: resolvedBrandName,
      modelId: resolvedModelId,
      modelName: resolvedModelName,
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
            ...(yearFrom !== undefined ? { yearFrom } : {}),
            ...(yearTo !== undefined ? { yearTo } : {}),
          }),
      ...(driveType ? { driveType } : {}),
      ...(engineCode ? { engineCode } : {}),
      brakePosition: brakePos || undefined,
    }
    if (editingRowId) onUpdate(editingRowId, rowPayload)
    else onAdd(rowPayload)
    resetFormState()
  }

  return (
    <div className={sectionClass}>
      {!hideSectionTitle ? (
        <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
          <p
            className={clsx(
              'min-w-0 flex-1',
              sectionTitleClass.replace(/\bmb-1\b/g, '').trim(),
            )}
          >
            รถ / รุ่น / เครื่อง-ปี (ผูกสินค้า)
          </p>
          {titleAction ? <div className="shrink-0">{titleAction}</div> : null}
        </div>
      ) : null}

      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <label className="block min-w-0">
          <span className={clsx(labelClass, alignedLabelCls)}>ประเภท</span>
          <div className="relative">
            <input
              className={inputCls}
              value={categoryQuery}
              onFocus={() => {
                setCategoryDropdownOpen(true)
                const idx = filteredCategories.findIndex((c) => c.id === catId)
                setCategoryHighlightedIndex(idx >= 0 ? idx : 0)
              }}
              onBlur={() => {
                window.setTimeout(() => setCategoryDropdownOpen(false), 120)
              }}
              onChange={(e) => {
                setCategoryDropdownOpen(true)
                setCategoryQuery(e.target.value)
                setCategoryHighlightedIndex(0)
                if (catId) {
                  setCatId('')
                  setBrandId('')
                  setModelId('')
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setCategoryDropdownOpen(true)
                  setCategoryHighlightedIndex((prev) => moveHighlightIndex(prev, filteredCategories.length, 1))
                  return
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setCategoryDropdownOpen(true)
                  setCategoryHighlightedIndex((prev) => moveHighlightIndex(prev, filteredCategories.length, -1))
                  return
                }
                if (e.key === 'Escape') setCategoryDropdownOpen(false)
                if (e.key === 'Enter' && filteredCategories.length > 0) {
                  e.preventDefault()
                  const pickIndex = categoryHighlightedIndex >= 0 ? categoryHighlightedIndex : 0
                  const picked = filteredCategories[pickIndex]
                  onSelectCategory(picked.id)
                }
              }}
              disabled={visibleCategories.length === 0}
              placeholder={visibleCategories.length ? '...' : 'ไม่มีประเภทที่แสดง'}
            />
            {categoryDropdownOpen && visibleCategories.length > 0 ? (
              <div ref={categoryDropdownRef} className={dropdownPanelClass}>
                {filteredCategories.length === 0 ? (
                  <p className="px-1.5 py-1 text-[11px] text-slate-500">ไม่พบประเภท</p>
                ) : (
                  filteredCategories.map((c, idx) => (
                    <button
                      key={c.id}
                      type="button"
                      data-cat-index={idx}
                      onMouseDown={(ev) => ev.preventDefault()}
                      onMouseEnter={() => setCategoryHighlightedIndex(idx)}
                      onClick={() => onSelectCategory(c.id)}
                      className={clsx(
                        'flex w-full rounded px-1.5 py-1 text-left text-[11px] transition',
                        catId === c.id
                          ? 'bg-slate-900 text-white'
                          : idx === categoryHighlightedIndex
                            ? 'bg-slate-100 text-slate-800'
                            : 'text-slate-700 hover:bg-slate-100',
                      )}
                    >
                      {c.label}
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </label>

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
                if (brandId) {
                  setBrandId('')
                  setModelId('')
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setBrandDropdownOpen(true)
                  setBrandHighlightedIndex((prev) => moveHighlightIndex(prev, filteredBrands.length, 1))
                  return
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setBrandDropdownOpen(true)
                  setBrandHighlightedIndex((prev) => moveHighlightIndex(prev, filteredBrands.length, -1))
                  return
                }
                if (e.key === 'Escape') setBrandDropdownOpen(false)
                if (e.key === 'Enter' && filteredBrands.length > 0) {
                  e.preventDefault()
                  const pickIndex = brandHighlightedIndex >= 0 ? brandHighlightedIndex : 0
                  onBrandPick(filteredBrands[pickIndex])
                  setBrandDropdownOpen(false)
                }
              }}
              disabled={!visibleCategories.length || !allBrands.length}
              placeholder={visibleCategories.length ? '...' : '—'}
            />
            {brandDropdownOpen && visibleCategories.length > 0 && allBrands.length > 0 ? (
              <div ref={brandDropdownRef} className={dropdownPanelClass}>
                {filteredBrands.length === 0 ? (
                  <p className="px-1.5 py-1 text-[11px] text-slate-500">ไม่พบยี่ห้อ</p>
                ) : (
                  filteredBrands.map((b, idx) => (
                    <button
                      key={`${b.categoryId}-${b.id}`}
                      type="button"
                      data-brand-index={idx}
                      onMouseDown={(ev) => ev.preventDefault()}
                      onMouseEnter={() => setBrandHighlightedIndex(idx)}
                      onClick={() => {
                        onBrandPick(b)
                        setBrandDropdownOpen(false)
                      }}
                      className={clsx(
                        'flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[11px] transition',
                        brandId === b.id && catId === b.categoryId
                          ? 'bg-slate-900 text-white'
                          : idx === brandHighlightedIndex
                            ? 'bg-slate-100 text-slate-800'
                            : 'text-slate-700 hover:bg-slate-100',
                      )}
                    >
                      <span className="truncate">{b.name}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </label>

        <label className="block min-w-0">
          <span className={clsx(labelClass, alignedLabelCls)}>รุ่น</span>
          <div className="relative">
            <input
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
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setModelDropdownOpen(true)
                  setModelHighlightedIndex((prev) => moveHighlightIndex(prev, filteredModels.length, 1))
                  return
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setModelDropdownOpen(true)
                  setModelHighlightedIndex((prev) => moveHighlightIndex(prev, filteredModels.length, -1))
                  return
                }
                if (e.key === 'Escape') setModelDropdownOpen(false)
                if (e.key === 'Enter' && filteredModels.length > 0) {
                  e.preventDefault()
                  const pickIndex = modelHighlightedIndex >= 0 ? modelHighlightedIndex : 0
                  onModelPick(filteredModels[pickIndex])
                  setModelDropdownOpen(false)
                }
              }}
              disabled={!visibleCategories.length || !allModels.length}
              placeholder="..."
            />
            {modelDropdownOpen && visibleCategories.length > 0 && allModels.length > 0 ? (
              <div ref={modelDropdownRef} className={dropdownPanelClass}>
                {filteredModels.length === 0 ? (
                  <p className="px-1.5 py-1 text-[11px] text-slate-500">ไม่พบรุ่น</p>
                ) : (
                  filteredModels.map((m, idx) => (
                    <button
                      key={`${m.categoryId}-${m.id}`}
                      type="button"
                      data-model-index={idx}
                      onMouseDown={(ev) => ev.preventDefault()}
                      onMouseEnter={() => setModelHighlightedIndex(idx)}
                      onClick={() => {
                        onModelPick(m)
                        setModelDropdownOpen(false)
                      }}
                      className={clsx(
                        'flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[11px] transition',
                        modelId === m.id && catId === m.categoryId
                          ? 'bg-slate-900 text-white'
                          : idx === modelHighlightedIndex
                            ? 'bg-slate-100 text-slate-800'
                            : 'text-slate-700 hover:bg-slate-100',
                      )}
                    >
                      <span className="truncate">{m.name}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </label>

        <label className="block min-w-0">
          <span className={clsx(labelClass, alignedLabelCls)}>เครื่อง</span>
          <input
            className={inputCls}
            value={manualEngineText}
            onChange={(e) => setManualEngineText(e.target.value)}
            placeholder="เช่น 2.0, 1KD, 4JA1"
          />
        </label>
        <label className="block min-w-0">
          <span className={clsx(labelClass, alignedLabelCls)}>ขับเคลื่อน</span>
          <input
            className={inputCls}
            value={manualDriveType}
            onChange={(e) => setManualDriveType(e.target.value.toUpperCase())}
            placeholder="เช่น 4WD, AWD"
          />
        </label>

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

        <label className="block min-w-0 sm:col-span-2 xl:col-span-1">
          <span className={clsx(labelClass, alignedLabelCls)}>เบรก หน้า/หลัง (ไม่บังคับ)</span>
          <select
            className={inputCls}
            value={brakePos}
            disabled={!hasManualSpec}
            onChange={(e) => setBrakePos(e.target.value as '' | 'front' | 'rear')}
          >
            <option value="">—</option>
            <option value="front">หน้า</option>
            <option value="rear">หลัง</option>
          </select>
        </label>
      </div>
      {hasYearRangeError ? (
        <p className="mt-1 text-[10px] text-rose-700">ปีเริ่มต้องน้อยกว่าหรือเท่าปีสิ้นสุด</p>
      ) : null}
      <p className="mt-1 text-[10px] text-slate-500">
        กติกาปี: ใส่เฉพาะปีสิ้นสุด = ถึงปีนั้น, ใส่เฉพาะปีเริ่ม = ถึงปัจจุบัน, ไม่ใส่ทั้งคู่ = ไม่มีข้อมูลปี
      </p>

      <button
        type="button"
        disabled={!canAddResolved}
        onClick={handleAddOrUpdate}
        className={clsx(
          'mt-1.5 inline-flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition sm:w-auto',
          canAddResolved
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
          className="ml-1.5 mt-1.5 inline-flex w-full items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
        >
          ยกเลิกแก้ไข
        </button>
      ) : null}

      {rows.length > 0 ? (
        <ul className="mt-1.5 max-h-20 overflow-y-auto rounded-md border border-slate-200 bg-white p-1.5">
          {rows.map((r) => (
            <li
              key={r.id}
              className="mb-1 inline-flex max-w-full items-center gap-1 rounded-md border border-slate-200 bg-slate-50 py-0.5 pl-2 pr-1 text-[11px] text-slate-800 last:mb-0"
            >
              <span className="truncate">
                {r.modelName} {compactEngineLabel(r.engineLabel)}
                {r.engineCode ? ` [${r.engineCode}]` : ''}
                {r.driveType ? ` · ${r.driveType}` : ''}
                {r.brakePosition === 'front'
                  ? ' · เบรกหน้า'
                  : r.brakePosition === 'rear'
                    ? ' · เบรกหลัง'
                    : ''}
              </span>
              <button
                type="button"
                onClick={() => copyBrandModel(r)}
                className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"
                aria-label="ใช้ยี่ห้อ/รุ่นเดิม"
                title="ใช้ยี่ห้อ/รุ่นเดิม (เพิ่มเครื่องใหม่)"
              >
                <Copy className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => beginEdit(r)}
                className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-sky-50 hover:text-sky-700"
                aria-label="แก้ไขรายการ"
                title="แก้ไข"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(r.id)}
                className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                aria-label="ลบรายการ"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-[10px] text-slate-400">ยังไม่ได้เพิ่มรุ่นรถ</p>
      )}
    </div>
  )
}
