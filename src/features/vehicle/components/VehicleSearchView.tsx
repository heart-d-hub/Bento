import { CategoryDisplaySettingsModal } from '@/features/vehicle/components/CategoryDisplaySettingsModal'
import { VehicleSearchHintIcons } from '@/features/vehicle/components/VehicleSearchHints'
import { PRODUCT_MASTER_LIST_CHANGED_EVENT } from '@/features/inventory/data/productMasterData'
import { useVehicleCatalog } from '@/features/vehicle/context/VehicleCatalogContext'
import { flattenVariantOptions } from '@/features/vehicle/data/vehicleCatalogUtils'
import { powertrainLabel } from '@/features/vehicle/data/powertrainOptions'
import { getVehicleSearchRowsForEngine } from '@/features/vehicle/data/vehicleSearchRows'
import { clsx } from 'clsx'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

const selectClassCompact =
  'w-full rounded border border-slate-200/90 bg-white px-2 py-1.5 text-[11px] leading-snug text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400/70 focus:ring-1 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400'

const actionBtnClassCompact =
  'inline-flex items-center justify-center rounded border border-slate-200/90 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'

const dropdownPanelClass =
  'absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200/90 bg-white p-1 shadow-lg shadow-slate-200/40'

function resolveDefaultCategoryId(categories: { id: string; label: string }[]): string | null {
  const preferred = categories.find((c) => c.label.trim() === 'รถยนต์')
  return preferred?.id ?? categories[0]?.id ?? null
}

function moveHighlightIndex(current: number, length: number, direction: -1 | 1): number {
  if (length <= 0) return -1
  if (current < 0) return direction === 1 ? 0 : length - 1
  return (current + direction + length) % length
}

type SearchModelOption = {
  id: string
  name: string
  brandId: string
  brandName: string
}

type SearchVariantOption = ReturnType<typeof flattenVariantOptions>[number] & {
  brandId: string
  brandName: string
  modelId: string
  modelName: string
}

export function VehicleSearchView() {
  const { catalog, visibleCategoryIds, setVisibleCategoryIds } = useVehicleCatalog()

  const visibleCategories = useMemo(() => {
    return [...catalog.categories]
      .filter((c) => visibleCategoryIds.has(c.id))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [catalog.categories, visibleCategoryIds])

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [categoryId, setCategoryId] = useState<string | null>(() => resolveDefaultCategoryId(visibleCategories))
  const [brandId, setBrandId] = useState<string>('')
  const [brandQuery, setBrandQuery] = useState('')
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false)
  const [brandHighlightedIndex, setBrandHighlightedIndex] = useState(-1)
  const [modelId, setModelId] = useState<string>('')
  const [modelQuery, setModelQuery] = useState('')
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [modelHighlightedIndex, setModelHighlightedIndex] = useState(-1)
  const [engineId, setEngineId] = useState<string>('')
  const [variantQuery, setVariantQuery] = useState('')
  const [variantDropdownOpen, setVariantDropdownOpen] = useState(false)
  const [variantHighlightedIndex, setVariantHighlightedIndex] = useState(-1)
  const brandDropdownRef = useRef<HTMLDivElement | null>(null)
  const modelDropdownRef = useRef<HTMLDivElement | null>(null)
  const variantDropdownRef = useRef<HTMLDivElement | null>(null)
  /** กรองเบรก/ดิสก์ — ว่าง = แสดงทุกรายการรวมที่ไม่ระบุตำแหน่ง */
  const [brakePosition, setBrakePosition] = useState<'' | 'front' | 'rear'>('')
  const [masterTick, setMasterTick] = useState(0)

  const cat = categoryId ? catalog.byCategory[categoryId] : undefined
  const categorySearchData = useMemo(() => {
    const empty = {
      brands: [] as { id: string; name: string }[],
      models: [] as SearchModelOption[],
      variants: [] as SearchVariantOption[],
    }
    if (!cat) return empty

    const brands = [...cat.brands].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    const models: SearchModelOption[] = []
    const variants: SearchVariantOption[] = []

    for (const brand of brands) {
      const brandModels = [...(cat.modelsByBrandId[brand.id] ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      )
      for (const model of brandModels) {
        models.push({
          id: model.id,
          name: model.name,
          brandId: brand.id,
          brandName: brand.name,
        })
        for (const variant of flattenVariantOptions(cat.enginesByModelId[model.id] ?? [])) {
          variants.push({
            ...variant,
            brandId: brand.id,
            brandName: brand.name,
            modelId: model.id,
            modelName: model.name,
          })
        }
      }
    }

    return { brands, models, variants }
  }, [cat])

  const brands = categorySearchData.brands
  const allModels = categorySearchData.models
  const allVariants = categorySearchData.variants
  const selectedBrand = brands.find((b) => b.id === brandId)
  const selectedModel = allModels.find((m) => m.id === modelId)
  const selectedEngine = allVariants.find((v) => v.id === engineId)

  const filteredBrands = useMemo(() => {
    const q = brandQuery.trim().toLocaleLowerCase()
    const base = brands.filter(
      (b) =>
        (!selectedModel || b.id === selectedModel.brandId) &&
        (!selectedEngine || b.id === selectedEngine.brandId),
    )
    if (!q) return base
    return base.filter((b) => b.name.toLocaleLowerCase().includes(q))
  }, [brands, brandQuery, selectedEngine, selectedModel])

  const filteredModels = useMemo(() => {
    const q = modelQuery.trim().toLocaleLowerCase()
    const base = allModels.filter(
      (m) => (!brandId || m.brandId === brandId) && (!selectedEngine || m.id === selectedEngine.modelId),
    )
    if (!q) return base
    return base.filter((m) => m.name.toLocaleLowerCase().includes(q))
  }, [allModels, brandId, modelQuery, selectedEngine])

  const filteredVariantOptions = useMemo(() => {
    const q = variantQuery.trim().toLocaleLowerCase()
    const base = allVariants.filter((v) => (!brandId || v.brandId === brandId) && (!modelId || v.modelId === modelId))
    if (!q) return base
    return base.filter((v) =>
      `${v.label} ${v.engineSummary} ${v.searchText} ${powertrainLabel(v.powertrain_type)}`
        .toLocaleLowerCase()
        .includes(q),
    )
  }, [allVariants, brandId, modelId, variantQuery])

  const selectedBrandName = selectedBrand?.name ?? selectedModel?.brandName ?? selectedEngine?.brandName
  const selectedModelName = selectedModel?.name ?? selectedEngine?.modelName

  useEffect(() => {
    const h = () => setMasterTick((t) => t + 1)
    window.addEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, h)
    return () => window.removeEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, h)
  }, [])

  const products = useMemo(() => {
    if (!engineId) return []
    return getVehicleSearchRowsForEngine(engineId, brakePosition)
  }, [engineId, brakePosition, masterTick])

  useEffect(() => {
    if (categoryId && visibleCategoryIds.has(categoryId)) return
    const next = resolveDefaultCategoryId(visibleCategories)
    setCategoryId(next)
    setBrandId('')
    setModelId('')
    setEngineId('')
    setBrakePosition('')
  }, [visibleCategories, categoryId, visibleCategoryIds])

  useEffect(() => {
    if (!brandId) {
      setBrandQuery('')
      return
    }
    setBrandQuery(selectedBrand?.name ?? '')
  }, [brandId, selectedBrand])

  useEffect(() => {
    if (!modelId) {
      setModelQuery('')
      return
    }
    setModelQuery(selectedModel?.name ?? '')
  }, [modelId, selectedModel])

  useEffect(() => {
    if (!engineId) {
      setVariantQuery('')
      return
    }
    setVariantQuery(selectedEngine?.label ?? '')
  }, [engineId, selectedEngine])

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
    setVariantHighlightedIndex((prev) => {
      if (filteredVariantOptions.length === 0) return -1
      if (prev < 0) return 0
      return Math.min(prev, filteredVariantOptions.length - 1)
    })
  }, [filteredVariantOptions])

  useEffect(() => {
    if (!brandDropdownOpen || brandHighlightedIndex < 0) return
    const el = brandDropdownRef.current?.querySelector<HTMLElement>(`[data-option-index="${brandHighlightedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [brandDropdownOpen, brandHighlightedIndex])

  useEffect(() => {
    if (!modelDropdownOpen || modelHighlightedIndex < 0) return
    const el = modelDropdownRef.current?.querySelector<HTMLElement>(`[data-option-index="${modelHighlightedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [modelDropdownOpen, modelHighlightedIndex])

  useEffect(() => {
    if (!variantDropdownOpen || variantHighlightedIndex < 0) return
    const el = variantDropdownRef.current?.querySelector<HTMLElement>(`[data-option-index="${variantHighlightedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [variantDropdownOpen, variantHighlightedIndex])

  function onSelectCategory(id: string) {
    setCategoryId(id)
    setBrandId('')
    setBrandQuery('')
    setBrandDropdownOpen(false)
    setBrandHighlightedIndex(-1)
    setModelId('')
    setModelQuery('')
    setModelDropdownOpen(false)
    setModelHighlightedIndex(-1)
    setEngineId('')
    setVariantQuery('')
    setVariantDropdownOpen(false)
    setVariantHighlightedIndex(-1)
    setBrakePosition('')
  }

  function onBrandChange(value: string) {
    setBrandId(value)
    const nextBrand = brands.find((b) => b.id === value)
    setBrandQuery(nextBrand?.name ?? '')
    if (!value || selectedModel?.brandId !== value) {
      setModelId('')
      setModelQuery('')
      setModelDropdownOpen(false)
      setModelHighlightedIndex(-1)
    }
    if (!value || selectedEngine?.brandId !== value) {
      setEngineId('')
      setVariantQuery('')
      setVariantDropdownOpen(false)
      setVariantHighlightedIndex(-1)
    }
    setBrakePosition('')
  }

  function onModelChange(value: string) {
    const nextModel = allModels.find((m) => m.id === value)
    setModelId(value)
    setModelQuery(nextModel?.name ?? '')
    if (nextModel) {
      setBrandId(nextModel.brandId)
      setBrandQuery(nextModel.brandName)
    }
    if (!value || selectedEngine?.modelId !== value) {
      setEngineId('')
      setVariantQuery('')
      setVariantDropdownOpen(false)
      setVariantHighlightedIndex(-1)
    }
    setBrakePosition('')
  }

  function onVariantChange(value: string) {
    const nextVariant = allVariants.find((v) => v.id === value)
    setEngineId(value)
    setVariantQuery(nextVariant?.label ?? '')
    if (nextVariant) {
      setBrandId(nextVariant.brandId)
      setBrandQuery(nextVariant.brandName)
      setModelId(nextVariant.modelId)
      setModelQuery(nextVariant.modelName)
    }
    setBrakePosition('')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 bg-slate-100/40 p-1.5">
      <div className="relative z-10 flex flex-col gap-1.5 xl:flex-row">
        <SearchPanel
          title="ประเภท"
          subtitle="เลือกกลุ่มรถที่ใช้ค้นหา"
          widthClass="xl:w-[14rem] xl:shrink-0"
          action={
            <button type="button" onClick={() => setSettingsOpen(true)} className={actionBtnClassCompact}>
              ตั้งค่าที่แสดง
            </button>
          }
        >
          {visibleCategories.length === 0 ? (
            <p className="text-[11px] leading-snug text-slate-500">
              ยังไม่ได้เลือกประเภทที่จะแสดง กด &quot;ตั้งค่าที่แสดง&quot; ก่อน
            </p>
          ) : (
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium text-slate-600">ประเภท</span>
              <select
                className={selectClassCompact}
                value={categoryId ?? ''}
                onChange={(e) => onSelectCategory(e.target.value)}
              >
                {visibleCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </SearchPanel>

        <SearchPanel
          title="ค้นหารุ่นรถ"
          subtitle="เลือกยี่ห้อ รุ่น และเครื่อง/โฉม/ปี"
          widthClass="min-w-0 flex-1"
          headerExtra={<VehicleSearchHintIcons />}
          action={
            brandId || modelId || engineId ? (
              <button
                type="button"
                onClick={() => {
                  setBrandId('')
                  setBrandQuery('')
                  setBrandDropdownOpen(false)
                  setBrandHighlightedIndex(-1)
                  setModelId('')
                  setModelQuery('')
                  setModelDropdownOpen(false)
                  setModelHighlightedIndex(-1)
                  setEngineId('')
                  setVariantQuery('')
                  setVariantDropdownOpen(false)
                  setVariantHighlightedIndex(-1)
                  setBrakePosition('')
                }}
                className={actionBtnClassCompact}
              >
                ล้างการเลือกรถ
              </button>
            ) : null
          }
        >
          <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.2fr)]">
          <label className="block">
            <span className="mb-1 block text-[10px] font-medium text-slate-600">1. ยี่ห้อ</span>
            <div className="relative">
              <input
                className={selectClassCompact}
                value={brandQuery}
                onFocus={() => {
                  setBrandDropdownOpen(true)
                  const idx = filteredBrands.findIndex((b) => b.id === brandId)
                  setBrandHighlightedIndex(idx >= 0 ? idx : 0)
                }}
                onBlur={() => {
                  window.setTimeout(() => setBrandDropdownOpen(false), 120)
                }}
                onChange={(e) => {
                  setBrandDropdownOpen(true)
                  setBrandQuery(e.target.value)
                  setBrandHighlightedIndex(0)
                  if (brandId) onBrandChange('')
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
                  if (e.key === 'Escape') {
                    setBrandDropdownOpen(false)
                  }
                  if (e.key === 'Enter' && filteredBrands.length > 0) {
                    e.preventDefault()
                    const pickIndex = brandHighlightedIndex >= 0 ? brandHighlightedIndex : 0
                    const picked = filteredBrands[pickIndex]
                    onBrandChange(picked.id)
                    setBrandQuery(picked.name)
                    setBrandDropdownOpen(false)
                  }
                }}
                disabled={!categoryId || brands.length === 0}
                placeholder={categoryId ? 'พิมพ์ค้นหายี่ห้อ เช่น TOY...' : 'เลือกประเภทก่อน'}
              />
              {brandDropdownOpen && categoryId && brands.length > 0 ? (
                <div ref={brandDropdownRef} className={dropdownPanelClass}>
                  {filteredBrands.length === 0 ? (
                    <p className="px-1.5 py-1 text-[11px] text-slate-500">ไม่พบยี่ห้อที่ค้นหา</p>
                  ) : (
                    filteredBrands.map((b, idx) => (
                      <button
                        key={b.id}
                        type="button"
                        data-option-index={idx}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setBrandHighlightedIndex(idx)}
                        onClick={() => {
                          onBrandChange(b.id)
                          setBrandQuery(b.name)
                          setBrandHighlightedIndex(idx)
                          setBrandDropdownOpen(false)
                        }}
                        className={clsx(
                          'flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-[11px] transition',
                          brandId === b.id
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

          <label className="block">
            <span className="mb-1 block text-[10px] font-medium text-slate-600">2. รุ่น</span>
            <div className="relative">
              <input
                className={selectClassCompact}
                value={modelQuery}
                onFocus={() => {
                  setModelDropdownOpen(true)
                  const idx = filteredModels.findIndex((m) => m.id === modelId)
                  setModelHighlightedIndex(idx >= 0 ? idx : 0)
                }}
                onBlur={() => {
                  window.setTimeout(() => setModelDropdownOpen(false), 120)
                }}
                onChange={(e) => {
                  setModelDropdownOpen(true)
                  setModelQuery(e.target.value)
                  setModelHighlightedIndex(0)
                  if (modelId) onModelChange('')
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
                  if (e.key === 'Escape') {
                    setModelDropdownOpen(false)
                  }
                  if (e.key === 'Enter' && filteredModels.length > 0) {
                    e.preventDefault()
                    const pickIndex = modelHighlightedIndex >= 0 ? modelHighlightedIndex : 0
                    const picked = filteredModels[pickIndex]
                    onModelChange(picked.id)
                    setModelQuery(picked.name)
                    setModelDropdownOpen(false)
                  }
                }}
                disabled={!categoryId || allModels.length === 0}
                placeholder={categoryId ? 'พิมพ์ค้นหารุ่น เช่น CIV...' : 'เลือกประเภทก่อน'}
              />
              {modelDropdownOpen && categoryId && allModels.length > 0 ? (
                <div ref={modelDropdownRef} className={dropdownPanelClass}>
                  {filteredModels.length === 0 ? (
                    <p className="px-1.5 py-1 text-[11px] text-slate-500">ไม่พบรุ่นที่ค้นหา</p>
                  ) : (
                    filteredModels.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        data-option-index={idx}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setModelHighlightedIndex(idx)}
                        onClick={() => {
                          onModelChange(m.id)
                          setModelQuery(m.name)
                          setModelHighlightedIndex(idx)
                          setModelDropdownOpen(false)
                        }}
                        className={clsx(
                          'flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-[11px] transition',
                          modelId === m.id
                            ? 'bg-slate-900 text-white'
                            : idx === modelHighlightedIndex
                              ? 'bg-slate-100 text-slate-800'
                              : 'text-slate-700 hover:bg-slate-100',
                        )}
                      >
                        <span className="truncate">{m.name}</span>
                        <span
                          className={clsx(
                            'ml-1.5 shrink-0 text-[10px]',
                            modelId === m.id ? 'text-slate-200' : 'text-slate-500',
                          )}
                        >
                          {m.brandName}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-medium text-slate-600">
              3. เครื่อง · โฉม · ช่วงปี (variant)
            </span>
            <div className="relative">
              <input
                className={selectClassCompact}
                value={variantQuery}
                onFocus={() => {
                  setVariantDropdownOpen(true)
                  const idx = filteredVariantOptions.findIndex((v) => v.id === engineId)
                  setVariantHighlightedIndex(idx >= 0 ? idx : 0)
                }}
                onBlur={() => {
                  window.setTimeout(() => setVariantDropdownOpen(false), 120)
                }}
                onChange={(e) => {
                  setVariantDropdownOpen(true)
                  setVariantQuery(e.target.value)
                  setVariantHighlightedIndex(0)
                  if (engineId) onVariantChange('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setVariantDropdownOpen(true)
                    setVariantHighlightedIndex((prev) => moveHighlightIndex(prev, filteredVariantOptions.length, 1))
                    return
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setVariantDropdownOpen(true)
                    setVariantHighlightedIndex((prev) => moveHighlightIndex(prev, filteredVariantOptions.length, -1))
                    return
                  }
                  if (e.key === 'Escape') {
                    setVariantDropdownOpen(false)
                  }
                  if (e.key === 'Enter' && filteredVariantOptions.length > 0) {
                    e.preventDefault()
                    const pickIndex = variantHighlightedIndex >= 0 ? variantHighlightedIndex : 0
                    const picked = filteredVariantOptions[pickIndex]
                    onVariantChange(picked.id)
                    setVariantQuery(picked.label)
                    setVariantDropdownOpen(false)
                  }
                }}
                disabled={!categoryId || allVariants.length === 0}
                placeholder={categoryId ? 'พิมพ์ค้นหาเครื่อง/โฉม/ปี...' : 'เลือกประเภทก่อน'}
              />
              {variantDropdownOpen && categoryId && allVariants.length > 0 ? (
                <div ref={variantDropdownRef} className={dropdownPanelClass}>
                  {filteredVariantOptions.length === 0 ? (
                    <p className="px-1.5 py-1 text-[11px] text-slate-500">ไม่พบ variant ที่ค้นหา</p>
                  ) : (
                    filteredVariantOptions.map((v, idx) => (
                      <button
                        key={v.id}
                        type="button"
                        data-option-index={idx}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setVariantHighlightedIndex(idx)}
                        onClick={() => {
                          onVariantChange(v.id)
                          setVariantQuery(v.label)
                          setVariantHighlightedIndex(idx)
                          setVariantDropdownOpen(false)
                        }}
                        className={clsx(
                          'flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-[11px] transition',
                          engineId === v.id
                            ? 'bg-slate-900 text-white'
                            : idx === variantHighlightedIndex
                              ? 'bg-slate-100 text-slate-800'
                              : 'text-slate-700 hover:bg-slate-100',
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">{v.label}</span>
                        <span className="ml-1.5 flex shrink-0 items-center gap-1">
                          {v.engineCode ? (
                            <span
                              className={clsx(
                                'rounded border px-1 py-0.5 font-mono text-[9px]',
                                engineId === v.id
                                  ? 'border-white/30 bg-white/10 text-slate-100'
                                  : 'border-sky-200 bg-sky-50 text-sky-900',
                              )}
                            >
                              {v.engineCode}
                            </span>
                          ) : null}
                          <span
                            className={clsx(
                              'text-[10px]',
                              engineId === v.id ? 'text-slate-200' : 'text-slate-500',
                            )}
                          >
                            {v.brandName} · {v.modelName}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </label>

          {engineId ? (
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium text-slate-600">
                ตำแหน่งชิ้น (เบรก / ดิสก์ — ไม่บังคับ)
              </span>
              <select
                className={selectClassCompact}
                value={brakePosition}
                onChange={(e) => setBrakePosition(e.target.value as '' | 'front' | 'rear')}
              >
                <option value="">— ทั้งหมด —</option>
                <option value="front">หน้า</option>
                <option value="rear">หลัง</option>
              </select>
              <p className="mt-1 text-[10px] leading-snug text-slate-500">
                เลือก &quot;หน้า&quot;หรือ&quot;หลัง&quot; เพื่อซ่อนผ้าเบรกอีกฝั่ง — รายการจากแฟ้มมาสเตอร์ที่ผูก <code className="font-mono">engineId</code> จะกรองตามตำแหน่งเบรก — ชิ้นอื่นที่ไม่ระบุตำแหน่งยังแสดงครบ
              </p>
            </label>
          ) : null}
          </div>
        </SearchPanel>
      </div>

      <section
        className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/20"
        aria-label="สินค้าในร้านตามที่เลือก"
      >
        <div className="border-b border-slate-100/90 px-3 py-2">
          <h3 className="text-sm font-semibold text-slate-900">สินค้าในร้าน</h3>
          {engineId && selectedEngine ? (
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              {selectedBrandName} · {selectedModelName} · {selectedEngine.label} ·{' '}
              {powertrainLabel(selectedEngine.powertrain_type)}
              {selectedEngine.engineCode ? (
                <span className="ml-1 rounded border border-sky-200 bg-sky-50 px-1 py-0.5 font-mono text-[10px] text-sky-900">
                  {selectedEngine.engineCode}
                </span>
              ) : null}
              <span className="ml-1 font-mono text-[10px] text-slate-400">({engineId})</span>
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-400">เลือกยี่ห้อ รุ่น และเครื่อง/ปี ให้ครบเพื่อแสดงสินค้า</p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3">
          {!engineId ? (
            <p className="py-8 text-center text-[11px] text-slate-400">ยังไม่ได้เลือกเครื่อง / ปี</p>
          ) : products.length === 0 ? (
            <p className="py-8 text-center text-[11px] text-slate-500">
              ยังไม่มีสินค้าในแฟ้มมาสเตอร์ที่ผูกเครื่อง/ปีนี้ — ลงรุ่นรถในแฟ้มสินค้า (หรือใช้รายการตัวอย่างถ้ามี)
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] border-collapse text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] text-slate-500">
                    <th className="pb-2 pr-3 font-medium">SKU</th>
                    <th className="pb-2 pr-3 font-medium">ชื่อสินค้า</th>
                    <th className="pb-2 pr-2 font-medium">ที่มา</th>
                    <th className="pb-2 pr-3 font-medium text-right">ราคา</th>
                    <th className="pb-2 font-medium text-right">คงเหลือ</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={`${p.source}-${p.sku}`} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-3 font-mono text-[10px] text-slate-600">{p.sku}</td>
                      <td className="py-2 pr-3 text-slate-800">{p.name}</td>
                      <td className="py-2 pr-2">
                        <span
                          className={clsx(
                            'inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium',
                            p.source === 'master'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                              : 'border-amber-200 bg-amber-50 text-amber-950',
                          )}
                        >
                          {p.source === 'master' ? 'แฟ้มมาสเตอร์' : 'ตัวอย่าง'}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-800">
                        ฿{p.price.toLocaleString('th-TH')}
                      </td>
                      <td className="py-2 text-right tabular-nums text-slate-700">{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <CategoryDisplaySettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        allCategories={catalog.categories}
        visibleIds={visibleCategoryIds}
        onSave={setVisibleCategoryIds}
      />
    </div>
  )
}

function SearchPanel({
  title,
  subtitle,
  widthClass,
  headerExtra,
  action,
  children,
}: {
  title: string
  subtitle?: string
  widthClass?: string
  headerExtra?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  const hasHeaderRight = headerExtra || action
  return (
    <section
      className={clsx(
        'relative flex min-h-0 flex-col overflow-visible rounded-lg border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/20',
        widthClass,
      )}
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-100/90 px-3 py-2">
        <div className="min-w-0">
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{subtitle}</p> : null}
        </div>
        {hasHeaderRight ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            {headerExtra}
            {action}
          </div>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-visible px-3 pb-3 pt-2">{children}</div>
    </section>
  )
}
