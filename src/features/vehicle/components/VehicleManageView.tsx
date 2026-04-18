import { useVehicleCatalog } from '@/features/vehicle/context/VehicleCatalogContext'
import type { CategoryCatalog, VehicleBrand, VehicleModel } from '@/features/vehicle/data/types'
import { newEntityId } from '@/features/vehicle/lib/newId'
import { clsx } from 'clsx'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

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

export function VehicleManageView() {
  const { catalog, setCatalog } = useVehicleCatalog()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(catalog.categories[0]?.id ?? '')
  const [selectedBrandId, setSelectedBrandId] = useState<string>('')
  const [categoryName, setCategoryName] = useState('')
  const [brandName, setBrandName] = useState('')
  const [modelName, setModelName] = useState('')

  const categories = useMemo(() => [...catalog.categories].sort((a, b) => a.sortOrder - b.sortOrder), [catalog.categories])
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null
  const categoryData = selectedCategory ? (catalog.byCategory[selectedCategory.id] ?? emptyCatalog()) : emptyCatalog()
  const brands = useMemo(() => [...categoryData.brands].sort(byNameAsc), [categoryData.brands])
  const selectedBrand = brands.find((b) => b.id === selectedBrandId) ?? null
  const models = useMemo(() => {
    if (!selectedBrand) return []
    return [...(categoryData.modelsByBrandId[selectedBrand.id] ?? [])].sort(byNameAsc)
  }, [categoryData.modelsByBrandId, selectedBrand])

  const hasCategory = Boolean(selectedCategory)
  const hasBrand = Boolean(selectedBrand)

  function patchCategory(categoryId: string, patcher: (data: CategoryCatalog) => CategoryCatalog) {
    const current = catalog.byCategory[categoryId] ?? emptyCatalog()
    const nextData = patcher(current)
    setCatalog({
      ...catalog,
      byCategory: {
        ...catalog.byCategory,
        [categoryId]: nextData,
      },
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
    setBrandName('')
  }

  function removeBrand() {
    if (!selectedCategory || !selectedBrand) return
    if (!window.confirm(`ลบยี่ห้อ "${selectedBrand.name}" หรือไม่?`)) return
    patchCategory(selectedCategory.id, (data) => {
      const modelRows = data.modelsByBrandId[selectedBrand.id] ?? []
      const modelIds = new Set(modelRows.map((m) => m.id))
      const nextEngines: Record<string, CategoryCatalog['enginesByModelId'][string]> = {}
      for (const [modelId, engines] of Object.entries(data.enginesByModelId)) {
        if (!modelIds.has(modelId)) nextEngines[modelId] = engines
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
      enginesByModelId: {
        ...data.enginesByModelId,
        [next.id]: data.enginesByModelId[next.id] ?? [],
      },
    }))
    setModelName('')
  }

  function removeModel(model: VehicleModel) {
    if (!selectedCategory || !selectedBrand) return
    if (!window.confirm(`ลบรุ่น "${model.name}" หรือไม่?`)) return
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

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
        หน้านี้จัดการเฉพาะ ประเภท / ยี่ห้อ / รุ่น เท่านั้น (ข้อมูลเครื่องและช่วงปีไปลงตอนเพิ่มสินค้า)
      </div>
      <div className="grid min-h-0 flex-1 gap-2 md:grid-cols-3">
        <section className="min-h-0 rounded-lg border border-slate-200 bg-white p-2">
          <p className="mb-1 text-[11px] font-semibold text-slate-700">ประเภท</p>
          <div className="mb-2 flex gap-1">
            <input className={inputCls} value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="เพิ่มประเภท" />
            <button type="button" className={btnCls} onClick={addCategory}>
              <Plus className="size-3.5" /> เพิ่ม
            </button>
          </div>
          <div className="flex max-h-[26rem] flex-col gap-1 overflow-y-auto pr-1">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryId(c.id)
                  setSelectedBrandId('')
                }}
                className={clsx(
                  listBtnCls,
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

        <section className="min-h-0 rounded-lg border border-slate-200 bg-white p-2">
          <p className="mb-1 text-[11px] font-semibold text-slate-700">ยี่ห้อ</p>
          <div className="mb-2 flex gap-1">
            <input className={inputCls} value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="เพิ่มยี่ห้อ" disabled={!hasCategory} />
            <button type="button" className={btnCls} onClick={addBrand} disabled={!hasCategory}>
              <Plus className="size-3.5" /> เพิ่ม
            </button>
          </div>
          <div className="flex max-h-[26rem] flex-col gap-1 overflow-y-auto pr-1">
            {brands.map((b: VehicleBrand) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBrandId(b.id)}
                className={clsx(
                  listBtnCls,
                  selectedBrandId === b.id
                    ? 'border-sky-300 bg-sky-50 text-sky-900'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
                )}
              >
                {b.name}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <button type="button" className={btnCls} disabled={!hasBrand} onClick={removeBrand}>
              <Trash2 className="size-3.5" /> ลบยี่ห้อที่เลือก
            </button>
          </div>
        </section>

        <section className="min-h-0 rounded-lg border border-slate-200 bg-white p-2">
          <p className="mb-1 text-[11px] font-semibold text-slate-700">รุ่น</p>
          <div className="mb-2 flex gap-1">
            <input className={inputCls} value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="เพิ่มรุ่น" disabled={!hasBrand} />
            <button type="button" className={btnCls} onClick={addModel} disabled={!hasBrand}>
              <Plus className="size-3.5" /> เพิ่ม
            </button>
          </div>
          <div className="flex max-h-[26rem] flex-col gap-1 overflow-y-auto pr-1">
            {models.map((m) => (
              <div key={m.id} className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                <span className="min-w-0 flex-1 truncate text-[12px] text-slate-800">{m.name}</span>
                <button
                  type="button"
                  onClick={() => removeModel(m)}
                  className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
                  aria-label={`ลบรุ่น ${m.name}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
