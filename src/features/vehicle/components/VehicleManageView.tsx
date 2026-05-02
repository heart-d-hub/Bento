import { getProductMasterList } from '@/features/inventory/data/productMasterData'
import { decodeVin, validateVin, type VinDecodeResult } from '@/features/inventory/data/vinDecoder'
import { THAI_MARKET_DATA } from '@/features/vehicle/data/thaiMarketData'
import type { CategoryCatalog, VehicleBrand, VehicleEngineDef, VehicleFuelType, VehicleModel } from '@/features/vehicle/data/types'
import { formatEngineDisplayName, formatYearRangeLabel, OPEN_END_YEAR } from '@/features/vehicle/data/vehicleCatalogUtils'
import { useVehicleCatalog } from '@/features/vehicle/context/VehicleCatalogContext'
import { newEntityId } from '@/features/vehicle/lib/newId'
import { clsx } from 'clsx'
import { CheckCircle2, Database, Plus, ScanLine, Scissors, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SplitSlashFieldsModal } from '@/features/vehicle/components/SplitSlashFieldsModal'

const inputCls =
  'w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400/70 focus:ring-1 focus:ring-sky-100'
const btnCls =
  'inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
const listBtnCls =
  'w-full rounded-md border px-2 py-1 text-left text-[12px] transition'

function emptyCatalog(): CategoryCatalog {
  return { brands: [], modelsByBrandId: {}, enginesByModelId: {} }
}

function byNameAsc<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

// ── VIN import banner ────────────────────────────────────────────────────────

function VinImportBar({
  categorySelected,
  onImport,
}: {
  categorySelected: boolean
  onImport: (result: VinDecodeResult) => { brandAdded: boolean; modelAdded: boolean; brandName: string; modelName: string }
}) {
  const [vin, setVin] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VinDecodeResult | null>(null)
  const [imported, setImported] = useState<{ brandName: string; modelName: string; brandAdded: boolean; modelAdded: boolean } | null>(null)

  const handleChange = async (raw: string) => {
    const v = raw.replace(/\s/g, '').toUpperCase().slice(0, 17)
    setVin(v)
    setResult(null)
    setImported(null)
    if (v.length === 17 && validateVin(v)) {
      setLoading(true)
      const decoded = await decodeVin(v)
      setResult(decoded)
      setLoading(false)
    }
  }

  const handleImport = () => {
    if (!result) return
    const info = onImport(result)
    setImported(info)
    setVin('')
    setResult(null)
  }

  const clear = () => { setVin(''); setResult(null); setImported(null) }

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <ScanLine className="size-4 shrink-0 text-violet-500" />
        <span className="text-[11px] font-semibold text-violet-800">นำเข้าข้อมูลจาก VIN</span>

        <div className="flex items-center gap-1.5 rounded-lg border border-violet-300 bg-white px-2 py-1">
          <input
            type="text"
            value={vin}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="วาง VIN 17 หลัก…"
            maxLength={17}
            className="w-48 bg-transparent font-mono text-xs outline-none placeholder:text-slate-400"
          />
          {vin.length > 0 && vin.length < 17 && (
            <span className="text-[10px] text-slate-400">{vin.length}/17</span>
          )}
          {vin && (
            <button type="button" onClick={clear} className="text-slate-300 hover:text-slate-500">
              <X className="size-3" />
            </button>
          )}
        </div>

        {loading && (
          <span className="animate-pulse text-[11px] text-violet-600">กำลังค้น…</span>
        )}

        {result && !loading && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-800">
              {[result.make, result.model, result.year].filter(Boolean).join(' · ')}
              {result.engine && <span className="ml-1 opacity-70">{result.engine}</span>}
              <span className="ml-1.5 text-[9px] font-normal opacity-50">
                ({result.source === 'nhtsa' ? 'NHTSA' : 'ถอดรหัสเอง'})
              </span>
            </div>
            {!result.make ? (
              <span className="text-[11px] text-rose-500">
                ไม่รู้จัก WMI: <b>{result.wmi}</b>
              </span>
            ) : !categorySelected ? (
              <span className="text-[11px] text-amber-600">เลือกประเภทก่อน</span>
            ) : (
              <button
                type="button"
                onClick={handleImport}
                className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-violet-700"
              >
                <Plus className="size-3.5" />
                นำเข้า
              </button>
            )}
          </div>
        )}

        {imported && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="size-3.5" />
            {imported.brandAdded ? `เพิ่มยี่ห้อ "${imported.brandName}"` : `ยี่ห้อ "${imported.brandName}" มีอยู่แล้ว`}
            {imported.modelName && (
              <span>
                {imported.modelAdded
                  ? ` · เพิ่มรุ่น "${imported.modelName}"`
                  : ` · รุ่น "${imported.modelName}" มีอยู่แล้ว`}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function VehicleManageView() {
  const { catalog, setCatalog } = useVehicleCatalog()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(catalog.categories[0]?.id ?? '')
  const [selectedBrandId, setSelectedBrandId] = useState<string>('')
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [categoryName, setCategoryName] = useState('')
  const [brandName, setBrandName] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const [modelName, setModelName] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [splitModalOpen, setSplitModalOpen] = useState(false)

  // Engine add form state
  const [engCode, setEngCode] = useState('')
  const [engSize, setEngSize] = useState('')
  const [engFuel, setEngFuel] = useState<VehicleFuelType>('unspecified')
  const [engYearFrom, setEngYearFrom] = useState('')
  const [engYearTo, setEngYearTo] = useState('')

  const categories = useMemo(() => [...catalog.categories].sort((a, b) => a.sortOrder - b.sortOrder), [catalog.categories])
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null
  const categoryData = selectedCategory ? (catalog.byCategory[selectedCategory.id] ?? emptyCatalog()) : emptyCatalog()
  const brands = useMemo(() => [...categoryData.brands].sort(byNameAsc), [categoryData.brands])
  const selectedBrand = brands.find((b) => b.id === selectedBrandId) ?? null
  const models = useMemo(() => {
    if (!selectedBrand) return []
    return [...(categoryData.modelsByBrandId[selectedBrand.id] ?? [])].sort(byNameAsc)
  }, [categoryData.modelsByBrandId, selectedBrand])
  const selectedModel = models.find((m) => m.id === selectedModelId) ?? null
  const engines = useMemo(() => {
    if (!selectedModel) return []
    return categoryData.enginesByModelId[selectedModel.id] ?? []
  }, [categoryData.enginesByModelId, selectedModel])

  const filteredBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase()
    return q ? brands.filter((b) => b.name.toLowerCase().includes(q)) : brands
  }, [brands, brandSearch])

  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase()
    return q ? models.filter((m) => m.name.toLowerCase().includes(q)) : models
  }, [models, modelSearch])

  // Product coverage count (unique products per brand/model)
  const { coverageByBrand, coverageByModel } = useMemo(() => {
    const byBrand = new Map<string, number>()
    const byModel = new Map<string, number>()
    for (const p of getProductMasterList()) {
      const seenBrands = new Set<string>()
      const seenModels = new Set<string>()
      for (const f of p.vehicleFitments ?? []) {
        if (!seenBrands.has(f.brandId)) {
          byBrand.set(f.brandId, (byBrand.get(f.brandId) ?? 0) + 1)
          seenBrands.add(f.brandId)
        }
        if (!seenModels.has(f.modelId)) {
          byModel.set(f.modelId, (byModel.get(f.modelId) ?? 0) + 1)
          seenModels.add(f.modelId)
        }
      }
    }
    return { coverageByBrand: byBrand, coverageByModel: byModel }
  }, [])

  const hasCategory = Boolean(selectedCategory)
  const hasBrand = Boolean(selectedBrand)
  const hasModel = Boolean(selectedModel)

  function patchCategory(categoryId: string, patcher: (data: CategoryCatalog) => CategoryCatalog) {
    const current = catalog.byCategory[categoryId] ?? emptyCatalog()
    setCatalog({
      ...catalog,
      byCategory: { ...catalog.byCategory, [categoryId]: patcher(current) },
    })
  }

  function addCategory() {
    const name = normalizeName(categoryName)
    if (!name) return
    const dup = categories.some((c) => c.label.toLocaleLowerCase() === name.toLocaleLowerCase())
    if (dup) return
    const id = newEntityId('cat')
    const sortOrder = Math.max(0, ...categories.map((c) => c.sortOrder)) + 1
    setCatalog({
      ...catalog,
      categories: [...catalog.categories, { id, label: name, sortOrder }],
      byCategory: { ...catalog.byCategory, [id]: emptyCatalog() },
    })
    setSelectedCategoryId(id)
    setSelectedBrandId('')
    setSelectedModelId('')
    setCategoryName('')
  }

  function removeCategory() {
    if (!selectedCategory) return
    if (!window.confirm(`ลบประเภท "${selectedCategory.label}" หรือไม่?`)) return
    const { [selectedCategory.id]: _drop, ...rest } = catalog.byCategory
    const nextCategories = catalog.categories.filter((c) => c.id !== selectedCategory.id)
    setCatalog({ ...catalog, categories: nextCategories, byCategory: rest })
    setSelectedCategoryId(nextCategories[0]?.id ?? '')
    setSelectedBrandId('')
    setSelectedModelId('')
  }

  function addBrand() {
    if (!selectedCategory) return
    const name = normalizeName(brandName)
    if (!name) return
    const dup = brands.some((b) => b.name.toLocaleLowerCase() === name.toLocaleLowerCase())
    if (dup) return
    const id = newEntityId('brand')
    patchCategory(selectedCategory.id, (data) => ({
      ...data,
      brands: [...data.brands, { id, name }],
      modelsByBrandId: { ...data.modelsByBrandId, [id]: [] },
    }))
    setSelectedBrandId(id)
    setSelectedModelId('')
    setBrandName('')
  }

  function removeBrand() {
    if (!selectedCategory || !selectedBrand) return
    if (!window.confirm(`ลบยี่ห้อ "${selectedBrand.name}" หรือไม่?`)) return
    patchCategory(selectedCategory.id, (data) => {
      const modelRows = data.modelsByBrandId[selectedBrand.id] ?? []
      const modelIds = new Set(modelRows.map((m) => m.id))
      const nextEngines: CategoryCatalog['enginesByModelId'] = {}
      for (const [modelId, engs] of Object.entries(data.enginesByModelId)) {
        if (!modelIds.has(modelId)) nextEngines[modelId] = engs
      }
      const nextModelsByBrand = { ...data.modelsByBrandId }
      delete nextModelsByBrand[selectedBrand.id]
      return {
        ...data,
        brands: data.brands.filter((b) => b.id !== selectedBrand.id),
        modelsByBrandId: nextModelsByBrand,
        enginesByModelId: nextEngines,
      }
    })
    setSelectedBrandId('')
    setSelectedModelId('')
  }

  function addModel() {
    if (!selectedCategory || !selectedBrand) return
    const name = normalizeName(modelName)
    if (!name) return
    const rows = categoryData.modelsByBrandId[selectedBrand.id] ?? []
    const dup = rows.some((m) => m.name.toLocaleLowerCase() === name.toLocaleLowerCase())
    if (dup) return
    const next: VehicleModel = { id: newEntityId('model'), name }
    patchCategory(selectedCategory.id, (data) => ({
      ...data,
      modelsByBrandId: {
        ...data.modelsByBrandId,
        [selectedBrand.id]: [...(data.modelsByBrandId[selectedBrand.id] ?? []), next],
      },
      enginesByModelId: { ...data.enginesByModelId, [next.id]: data.enginesByModelId[next.id] ?? [] },
    }))
    setModelName('')
  }

  function removeModel(model: VehicleModel) {
    if (!selectedCategory || !selectedBrand) return
    if (!window.confirm(`ลบรุ่น "${model.name}" หรือไม่?`)) return
    if (selectedModelId === model.id) setSelectedModelId('')
    patchCategory(selectedCategory.id, (data) => {
      const nextModels = (data.modelsByBrandId[selectedBrand.id] ?? []).filter((m) => m.id !== model.id)
      const nextEngines = { ...data.enginesByModelId }
      delete nextEngines[model.id]
      return {
        ...data,
        modelsByBrandId: { ...data.modelsByBrandId, [selectedBrand.id]: nextModels },
        enginesByModelId: nextEngines,
      }
    })
  }

  function addEngine() {
    if (!selectedCategory || !selectedModel) return
    const code = engCode.trim()
    const size = engSize.trim()
    if (!code && !size) return
    const yFrom = parseInt(engYearFrom.trim(), 10) || 2000
    const yTo = engYearTo.trim() ? (parseInt(engYearTo.trim(), 10) || OPEN_END_YEAR) : OPEN_END_YEAR

    const newEngine: VehicleEngineDef = {
      id: newEntityId('eng'),
      powertrain_type: 'ice',
      engine_size: size || null,
      engine_code: code || null,
      fuel_type: engFuel,
      motor_power: null,
      battery_capacity: null,
      variants: [{ id: newEntityId('var'), yearFrom: yFrom, yearTo: yTo }],
    }

    const modelId = selectedModel.id
    patchCategory(selectedCategory.id, (data) => ({
      ...data,
      enginesByModelId: {
        ...data.enginesByModelId,
        [modelId]: [...(data.enginesByModelId[modelId] ?? []), newEngine],
      },
    }))
    setEngCode('')
    setEngSize('')
    setEngFuel('unspecified')
    setEngYearFrom('')
    setEngYearTo('')
  }

  function removeEngine(engineId: string) {
    if (!selectedCategory || !selectedModel) return
    const modelId = selectedModel.id
    patchCategory(selectedCategory.id, (data) => ({
      ...data,
      enginesByModelId: {
        ...data.enginesByModelId,
        [modelId]: (data.enginesByModelId[modelId] ?? []).filter((e) => e.id !== engineId),
      },
    }))
  }

  function handleThaiImport() {
    if (!selectedCategory) return
    if (!window.confirm(`นำเข้าข้อมูลรถตลาดไทย ${THAI_MARKET_DATA.length} ยี่ห้อ ไปยังประเภท "${selectedCategory.label}"?\n(ยี่ห้อ/รุ่นที่มีอยู่แล้วจะข้าม)`)) return

    const current = catalog.byCategory[selectedCategory.id] ?? emptyCatalog()
    let next = { ...current, brands: [...current.brands], modelsByBrandId: { ...current.modelsByBrandId }, enginesByModelId: { ...current.enginesByModelId } }
    let brandsAdded = 0
    let modelsAdded = 0

    for (const entry of THAI_MARKET_DATA) {
      const existing = next.brands.find((b) => b.name.toUpperCase() === entry.brand)
      let brandId: string
      if (existing) {
        brandId = existing.id
      } else {
        brandId = newEntityId('brand')
        next = { ...next, brands: [...next.brands, { id: brandId, name: entry.brand }], modelsByBrandId: { ...next.modelsByBrandId, [brandId]: [] } }
        brandsAdded++
      }

      const existingModels = next.modelsByBrandId[brandId] ?? []
      const newModels: VehicleModel[] = []
      for (const mName of entry.models) {
        if (!existingModels.some((m) => m.name.toUpperCase() === mName)) {
          const nm: VehicleModel = { id: newEntityId('model'), name: mName }
          newModels.push(nm)
          modelsAdded++
        }
      }
      if (newModels.length > 0) {
        next = {
          ...next,
          modelsByBrandId: { ...next.modelsByBrandId, [brandId]: [...existingModels, ...newModels] },
          enginesByModelId: { ...next.enginesByModelId, ...Object.fromEntries(newModels.map((m) => [m.id, []])) },
        }
      }
    }

    setCatalog({ ...catalog, byCategory: { ...catalog.byCategory, [selectedCategory.id]: next } })
    window.alert(`นำเข้าแล้ว: ${brandsAdded} ยี่ห้อ, ${modelsAdded} รุ่น`)
  }

  function handleVinImport(result: VinDecodeResult) {
    if (!selectedCategory || !result.make) {
      return { brandAdded: false, modelAdded: false, brandName: result.make ?? '', modelName: result.model ?? '' }
    }

    const makeName = result.make.toUpperCase()
    const modelNameStr = result.model?.toUpperCase() ?? ''
    const currentData = catalog.byCategory[selectedCategory.id] ?? emptyCatalog()
    const existingBrand = currentData.brands.find((b) => b.name.toUpperCase() === makeName)

    let brandId: string
    let brandAdded = false

    if (existingBrand) {
      brandId = existingBrand.id
    } else {
      brandId = newEntityId('brand')
      brandAdded = true
    }

    let modelAdded = false
    const existingModels = currentData.modelsByBrandId[brandId] ?? []
    const modelExists = modelNameStr ? existingModels.some((m) => m.name.toUpperCase() === modelNameStr) : true
    const newModelEntry: VehicleModel | null =
      modelNameStr && !modelExists ? { id: newEntityId('model'), name: modelNameStr } : null

    if (newModelEntry) modelAdded = true

    patchCategory(selectedCategory.id, (data) => {
      let next = { ...data }
      if (brandAdded) {
        next = { ...next, brands: [...next.brands, { id: brandId, name: makeName }], modelsByBrandId: { ...next.modelsByBrandId, [brandId]: [] } }
      }
      if (newModelEntry) {
        next = {
          ...next,
          modelsByBrandId: { ...next.modelsByBrandId, [brandId]: [...(next.modelsByBrandId[brandId] ?? []), newModelEntry] },
          enginesByModelId: { ...next.enginesByModelId, [newModelEntry.id]: [] },
        }
      }
      return next
    })

    setSelectedBrandId(brandId)
    setSelectedModelId('')
    return { brandAdded, modelAdded, brandName: makeName, modelName: modelNameStr }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <Scissors className="size-4 text-violet-600" />
          <div>
            <p className="text-[12px] font-semibold text-violet-900">เครื่องมือจัดระเบียบข้อมูล</p>
            <p className="text-[11px] text-violet-700">
              แยกข้อมูลรุ่น/เครื่องที่ใส่ <code className="rounded bg-white/60 px-1 font-mono">/</code>{' '}
              <code className="rounded bg-white/60 px-1 font-mono">,</code> รวมกัน เป็น records แยก
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSplitModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-violet-700"
        >
          <Scissors className="size-3.5" />
          แยกข้อมูลที่มีตัวคั่น
        </button>
      </div>

      <SplitSlashFieldsModal open={splitModalOpen} onClose={() => setSplitModalOpen(false)} />

      <VinImportBar categorySelected={hasCategory} onImport={handleVinImport} />

      <div className="grid min-h-0 flex-1 grid-cols-4 gap-2">
        {/* ── ประเภท ── */}
        <section className="min-h-0 rounded-lg border border-slate-200 bg-white p-2">
          <p className="mb-1 text-[11px] font-semibold text-slate-700">ประเภท</p>
          <div className="mb-2 flex gap-1">
            <input
              className={inputCls}
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              placeholder="เพิ่มประเภท"
            />
            <button type="button" className={btnCls} onClick={addCategory}>
              <Plus className="size-3.5" /> เพิ่ม
            </button>
          </div>
          <div className="flex max-h-[26rem] flex-col gap-1 overflow-y-auto pr-1">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setSelectedCategoryId(c.id); setSelectedBrandId(''); setSelectedModelId(''); setBrandSearch(''); setModelSearch('') }}
                className={clsx(listBtnCls,
                  selectedCategoryId === c.id
                    ? 'border-sky-300 bg-sky-50 text-sky-900'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <button type="button" className={btnCls} disabled={!hasCategory} onClick={removeCategory}>
              <Trash2 className="size-3.5" /> ลบประเภทที่เลือก
            </button>
          </div>
        </section>

        {/* ── ยี่ห้อ ── */}
        <section className="min-h-0 rounded-lg border border-slate-200 bg-white p-2">
          <p className="mb-1 text-[11px] font-semibold text-slate-700">ยี่ห้อ</p>
          <div className="mb-1 flex gap-1">
            <input
              className={inputCls}
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addBrand()}
              placeholder="เพิ่มยี่ห้อ"
              disabled={!hasCategory}
            />
            <button type="button" className={btnCls} onClick={addBrand} disabled={!hasCategory}>
              <Plus className="size-3.5" /> เพิ่ม
            </button>
          </div>
          <div className="mb-1.5 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5">
            <Search className="size-3 shrink-0 text-slate-400" />
            <input
              className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-slate-400"
              placeholder="ค้นยี่ห้อ…"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              disabled={!hasCategory}
            />
            {brandSearch && (
              <button type="button" onClick={() => setBrandSearch('')}>
                <X className="size-3 text-slate-300 hover:text-slate-500" />
              </button>
            )}
          </div>
          <div className="flex max-h-[22rem] flex-col gap-1 overflow-y-auto pr-1">
            {filteredBrands.map((b: VehicleBrand) => (
              <button
                key={b.id}
                type="button"
                onClick={() => { setSelectedBrandId(b.id); setSelectedModelId(''); setModelSearch('') }}
                className={clsx(listBtnCls, 'flex items-center gap-1',
                  selectedBrandId === b.id
                    ? 'border-sky-300 bg-sky-50 text-sky-900'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
                )}
              >
                <span className="flex-1 truncate">{b.name}</span>
                {(coverageByBrand.get(b.id) ?? 0) > 0 && (
                  <span className="rounded-full bg-sky-100 px-1.5 text-[9px] font-semibold text-sky-600">
                    {coverageByBrand.get(b.id)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              type="button"
              className={clsx(btnCls, 'border-sky-200 text-sky-700 hover:bg-sky-50')}
              disabled={!hasCategory}
              onClick={handleThaiImport}
            >
              <Database className="size-3.5" /> โหลดรถไทย
            </button>
            <button type="button" className={btnCls} disabled={!hasBrand} onClick={removeBrand}>
              <Trash2 className="size-3.5" /> ลบยี่ห้อ
            </button>
          </div>
        </section>

        {/* ── รุ่น ── */}
        <section className="min-h-0 rounded-lg border border-slate-200 bg-white p-2">
          <p className="mb-1 text-[11px] font-semibold text-slate-700">รุ่น</p>
          <div className="mb-1 flex gap-1">
            <input
              className={inputCls}
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addModel()}
              placeholder="เพิ่มรุ่น"
              disabled={!hasBrand}
            />
            <button type="button" className={btnCls} onClick={addModel} disabled={!hasBrand}>
              <Plus className="size-3.5" /> เพิ่ม
            </button>
          </div>
          <div className="mb-1.5 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5">
            <Search className="size-3 shrink-0 text-slate-400" />
            <input
              className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-slate-400"
              placeholder="ค้นรุ่น…"
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              disabled={!hasBrand}
            />
            {modelSearch && (
              <button type="button" onClick={() => setModelSearch('')}>
                <X className="size-3 text-slate-300 hover:text-slate-500" />
              </button>
            )}
          </div>
          <div className="flex max-h-[22rem] flex-col gap-1 overflow-y-auto pr-1">
            {filteredModels.map((m) => (
              <div
                key={m.id}
                className={clsx(
                  'flex items-center rounded-md border transition',
                  selectedModelId === m.id
                    ? 'border-violet-300 bg-violet-50'
                    : 'border-slate-200 bg-slate-50',
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelectedModelId(m.id === selectedModelId ? '' : m.id)}
                  className="flex min-w-0 flex-1 items-center gap-1 px-2 py-1 text-left"
                >
                  <span className="flex-1 truncate text-[12px] text-slate-800">{m.name}</span>
                  {(coverageByModel.get(m.id) ?? 0) > 0 && (
                    <span className="rounded-full bg-sky-100 px-1.5 text-[9px] font-semibold text-sky-600">
                      {coverageByModel.get(m.id)}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => removeModel(m)}
                  className="rounded p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`ลบรุ่น ${m.name}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── เครื่อง / ปี ── */}
        <section className="min-h-0 rounded-lg border border-slate-200 bg-white p-2">
          {hasModel ? (
            <>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-700">
                เครื่อง / ปี —{' '}
                <span className="text-violet-700">{selectedModel!.name}</span>
              </p>

              {/* Add engine form */}
              <div className="mb-2 space-y-1 rounded-md border border-slate-100 bg-slate-50 p-1.5">
                <div className="flex gap-1">
                  <input
                    className={clsx(inputCls, 'flex-1')}
                    value={engCode}
                    onChange={(e) => setEngCode(e.target.value)}
                    placeholder="รหัสเครื่อง (1KD)"
                  />
                  <input
                    className={clsx(inputCls, 'flex-1')}
                    value={engSize}
                    onChange={(e) => setEngSize(e.target.value)}
                    placeholder="ขนาด (3.0L)"
                  />
                </div>
                <div className="flex gap-1">
                  <select
                    className={clsx(inputCls, 'flex-1')}
                    value={engFuel}
                    onChange={(e) => setEngFuel(e.target.value as VehicleFuelType)}
                  >
                    <option value="unspecified">ไม่ระบุ</option>
                    <option value="diesel">ดีเซล</option>
                    <option value="bensin">เบนซิน</option>
                  </select>
                  <input
                    className={clsx(inputCls, 'w-16')}
                    type="number"
                    value={engYearFrom}
                    onChange={(e) => setEngYearFrom(e.target.value)}
                    placeholder="จากปี"
                  />
                  <input
                    className={clsx(inputCls, 'w-16')}
                    type="number"
                    value={engYearTo}
                    onChange={(e) => setEngYearTo(e.target.value)}
                    placeholder="ถึงปี"
                    onKeyDown={(e) => e.key === 'Enter' && addEngine()}
                  />
                  <button type="button" className={btnCls} onClick={addEngine} title="เพิ่มเครื่อง">
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Engine list */}
              <div className="flex max-h-[18rem] flex-col gap-1 overflow-y-auto pr-1">
                {engines.length === 0 && (
                  <p className="py-3 text-center text-[11px] text-slate-400">ยังไม่มีข้อมูลเครื่อง</p>
                )}
                {engines.map((eng) => {
                  const years = eng.variants.map((v) => formatYearRangeLabel(v.yearFrom, v.yearTo)).join(', ')
                  const label = formatEngineDisplayName(eng)
                  return (
                    <div key={eng.id} className="flex items-start gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-slate-800">{label || '—'}</div>
                        {years && <div className="text-[10px] text-slate-400">{years}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEngine(eng.id)}
                        className="mt-0.5 rounded p-0.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-[11px] text-slate-400">เลือกรุ่น<br />เพื่อจัดการข้อมูลเครื่องยนต์</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
