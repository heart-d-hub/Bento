import {
  PRODUCT_MASTER_LIST_CHANGED_EVENT,
  getProductMasterList,
  productEligibleForPosSale,
  totalCrossBranchStock,
  type ProductMasterDetail,
  type VehicleFitmentRef,
} from '@/features/inventory/data/productMasterData'
import { useVehicleCatalog } from '@/features/vehicle/context/VehicleCatalogContext'
import { clsx } from 'clsx'
import { useEffect, useMemo, useState } from 'react'

const inputCls =
  'w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400/70 focus:ring-1 focus:ring-sky-100'

type SearchHit = {
  sku: string
  name: string
  price: number
  stock: number
  fitPreview: string
  matchedYearLabel: string
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase()
}

function parseYearValue(text: string): number | null {
  const n = Number(text.trim())
  if (!Number.isFinite(n)) return null
  const year = Math.round(n)
  if (year < 1900 || year > 2100) return null
  return year
}

function fitmentMatches(
  f: VehicleFitmentRef,
  opts: {
    categoryId: string
    brand: string
    model: string
    engine: string
    yearText: string
    yearValue: number | null
    brake: '' | 'front' | 'rear'
  },
): boolean {
  if (!f) return false
  if (opts.categoryId && f.categoryId !== opts.categoryId) return false
  if (opts.brand && normalizeText(f.brandName) !== opts.brand) return false
  if (opts.model && normalizeText(f.modelName) !== opts.model) return false

  if (opts.engine) {
    const hay = normalizeText(
      [f.engineText ?? '', f.engineLabel ?? '', f.engineCode ?? '']
        .join(' ')
        .replace(/\s+/g, ' '),
    )
    if (!hay.includes(opts.engine)) return false
  }

  if (opts.yearText) {
    if (opts.yearValue !== null) {
      const from = f.yearFrom
      const to = f.yearTo
      if (from != null || to != null) {
        const start = from != null ? from : 1900
        const end = to != null ? to : new Date().getFullYear()
        if (!(opts.yearValue >= start && opts.yearValue <= end)) return false
      } else {
        const hay = normalizeText([f.yearRangeText ?? '', f.engineLabel ?? ''].join(' '))
        if (!hay.includes(opts.yearText)) return false
      }
    } else {
      const hay = normalizeText([f.yearRangeText ?? '', f.engineLabel ?? ''].join(' '))
      if (!hay.includes(opts.yearText)) return false
    }
  }

  if (!opts.brake) return true
  if (!f.brakePosition) return true
  return f.brakePosition === opts.brake
}

function productMatches(p: ProductMasterDetail, opts: Parameters<typeof fitmentMatches>[1]): VehicleFitmentRef[] {
  const fits = p.vehicleFitments ?? []
  if (!fits.length) return []
  return fits.filter((f) => f != null && fitmentMatches(f, opts))
}

function fitPreviewText(f: VehicleFitmentRef): string {
  const engine = f.engineText?.trim() || f.engineLabel?.trim() || '-'
  const year =
    f.yearFrom != null && f.yearTo != null
      ? `${f.yearFrom}-${f.yearTo}`
      : (f.yearRangeText?.trim() ?? '')
  const brake = f.brakePosition === 'front' ? ' · เบรกหน้า' : f.brakePosition === 'rear' ? ' · เบรกหลัง' : ''
  return `${f.brandName} ${f.modelName} · ${engine}${year ? ` (${year})` : ''}${brake}`
}

function fitYearLabel(f: VehicleFitmentRef): string {
  if (f.yearFrom != null && f.yearTo != null) return `${f.yearFrom}-${f.yearTo}`
  const fromRangeText = (f.yearRangeText ?? '').trim()
  if (fromRangeText) return fromRangeText
  const fromEngine = (f.engineLabel ?? '').match(/(\d{4}\s*[-–]\s*\d{4})/)
  return fromEngine?.[1] ?? '-'
}

export function VehicleSearchView() {
  const { catalog, visibleCategoryIds } = useVehicleCatalog()
  const [masterTick, setMasterTick] = useState(0)
  const [categoryId, setCategoryId] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [engine, setEngine] = useState('')
  const [year, setYear] = useState('')
  const [brake, setBrake] = useState<'' | 'front' | 'rear'>('')

  useEffect(() => {
    const h = () => setMasterTick((t) => t + 1)
    window.addEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, h)
    return () => window.removeEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, h)
  }, [])

  const visibleCategories = useMemo(
    () =>
      [...catalog.categories]
        .filter((c) => visibleCategoryIds.has(c.id))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [catalog.categories, visibleCategoryIds],
  )

  useEffect(() => {
    if (!visibleCategories.length) {
      setCategoryId('')
      return
    }
    if (!categoryId || !visibleCategories.some((c) => c.id === categoryId)) {
      setCategoryId(visibleCategories[0].id)
    }
  }, [visibleCategories, categoryId])

  const masters = useMemo(() => getProductMasterList().filter(productEligibleForPosSale), [masterTick])
  const normalizedBrand = normalizeText(brand)
  const normalizedModel = normalizeText(model)
  const normalizedEngine = normalizeText(engine)
  const normalizedYear = normalizeText(year)
  const yearValue = parseYearValue(year)

  const brandOptions = useMemo(() => {
    const set = new Set<string>()
    for (const p of masters) {
      for (const f of p.vehicleFitments ?? []) {
        if (!f) continue
        if (categoryId && f.categoryId !== categoryId) continue
        set.add(f.brandName)
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'th'))
  }, [masters, categoryId])

  const modelOptions = useMemo(() => {
    const set = new Set<string>()
    for (const p of masters) {
      for (const f of p.vehicleFitments ?? []) {
        if (!f) continue
        if (categoryId && f.categoryId !== categoryId) continue
        if (normalizedBrand && normalizeText(f.brandName) !== normalizedBrand) continue
        set.add(f.modelName)
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'th'))
  }, [masters, categoryId, normalizedBrand])

  const results = useMemo<SearchHit[]>(() => {
    const opts = {
      categoryId,
      brand: normalizedBrand,
      model: normalizedModel,
      engine: normalizedEngine,
      yearText: normalizedYear,
      yearValue,
      brake,
    }
    const out: SearchHit[] = []
    for (const p of masters) {
      const fits = productMatches(p, opts)
      if (!fits.length) continue
      out.push({
        sku: p.sku,
        name: p.name,
        price: p.sellPrice,
        stock: totalCrossBranchStock(p),
        fitPreview: fitPreviewText(fits[0]),
        matchedYearLabel: fitYearLabel(fits[0]),
      })
    }
    return out
  }, [masters, categoryId, normalizedBrand, normalizedModel, normalizedEngine, normalizedYear, yearValue, brake])

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-medium text-slate-600">ประเภท</span>
            <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {visibleCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-medium text-slate-600">ยี่ห้อ</span>
            <input className={inputCls} list="vehicle-brand-options" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="เช่น HONDA" />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-medium text-slate-600">รุ่น</span>
            <input className={inputCls} list="vehicle-model-options" value={model} onChange={(e) => setModel(e.target.value)} placeholder="เช่น ACCORD" />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-medium text-slate-600">เครื่อง</span>
            <input className={inputCls} value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="เช่น 2.0, 1KD" />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-medium text-slate-600">ปี</span>
            <input className={inputCls} value={year} onChange={(e) => setYear(e.target.value)} placeholder="เช่น 2010 หรือ 1990-2018" />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-medium text-slate-600">เบรก</span>
            <select className={inputCls} value={brake} onChange={(e) => setBrake(e.target.value as '' | 'front' | 'rear')}>
              <option value="">ทั้งหมด</option>
              <option value="front">หน้า</option>
              <option value="rear">หลัง</option>
            </select>
          </label>
        </div>
        <p className="mt-1 text-[10px] text-slate-500">
          ตัวอย่างการกรอกปี: <span className="font-medium">2010</span> (ค้นหาตามปีเดียว) หรือ{' '}
          <span className="font-medium">1990-2018</span> (ค้นหาตามช่วงปี)
        </p>
        <datalist id="vehicle-brand-options">
          {brandOptions.map((b) => (
            <option key={`brand-${b}`} value={b} />
          ))}
        </datalist>
        <datalist id="vehicle-model-options">
          {modelOptions.map((m) => (
            <option key={`model-${m}`} value={m} />
          ))}
        </datalist>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 bg-white">
        {results.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-slate-500">ไม่พบสินค้าที่ตรงเงื่อนไข</p>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-[12px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-1.5 text-left">SKU</th>
                <th className="px-2 py-1.5 text-left">สินค้า</th>
                <th className="px-2 py-1.5 text-left">รถที่ตรง</th>
                <th className="px-2 py-1.5 text-right">ราคา</th>
                <th className="px-2 py-1.5 text-right">สต็อก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r) => (
                <tr key={r.sku} className={clsx('hover:bg-slate-50')}>
                  <td className="px-2 py-1.5 font-mono text-[11px] text-slate-700">{r.sku}</td>
                  <td className="px-2 py-1.5 text-slate-900">{r.name}</td>
                  <td className="px-2 py-1.5 text-slate-600">
                    <div className="flex items-center gap-1">
                      <span className="truncate">{r.fitPreview}</span>
                      <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-1 py-0.5 text-[10px] text-emerald-700">
                        match ปี {r.matchedYearLabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-right text-slate-700">{r.price.toLocaleString('th-TH')}</td>
                  <td className="px-2 py-1.5 text-right text-slate-700">{r.stock.toLocaleString('th-TH')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
