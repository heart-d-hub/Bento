import { useVehicleCatalog } from '@/features/vehicle/context/VehicleCatalogContext'
import { FUEL_OPTIONS } from '@/features/vehicle/data/fuelOptions'
import {
  POWERTRAIN_OPTIONS,
  powertrainLabel,
  powertrainShowsEngineFuel,
  powertrainShowsMotorBattery,
} from '@/features/vehicle/data/powertrainOptions'
import type {
  CategoryCatalog,
  VehicleEngineDef,
  VehicleFuelType,
  VehiclePowertrainType,
  VehicleVariant,
} from '@/features/vehicle/data/types'
import {
  formatEngineDisplayName,
  formatVariantSummaryLine,
  normalizeEngineDef,
  OPEN_END_YEAR,
  tryBuildTruckEngineDef,
} from '@/features/vehicle/data/vehicleCatalogUtils'
import { newEntityId } from '@/features/vehicle/lib/newId'
import { clsx } from 'clsx'
import { Copy, Plus, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** ฟอร์มแบบกะทัดรัด — เน้นใช้ในหน้าต่างเดสก์ท็อป / EXE */
const inputClassCompact =
  'w-full rounded border border-slate-200/90 bg-white px-1.5 py-1 text-[11px] leading-snug text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400/70 focus:ring-1 focus:ring-sky-100'
const selectClassCompact =
  'w-full rounded border border-slate-200/90 bg-white px-1.5 py-1 text-[11px] text-slate-900 shadow-sm outline-none transition focus:border-sky-400/70 focus:ring-1 focus:ring-sky-100'
const addBtnClassCompact =
  'inline-flex size-7 shrink-0 items-center justify-center rounded bg-slate-900 text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'

function emptyCatalog(): CategoryCatalog {
  return { brands: [], modelsByBrandId: {}, enginesByModelId: {} }
}

function clampYear(n: number): number {
  if (!Number.isFinite(n)) return new Date().getFullYear()
  return Math.min(OPEN_END_YEAR, Math.max(1900, Math.round(n)))
}

function yearRangesOverlap(a: [number, number], b: [number, number]): boolean {
  return a[0] <= b[1] && b[0] <= a[1]
}

function normalizeEntityName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

function byNameAsc<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

/** คู่ id ของ variant ที่ช่วงปีทับกัน (เตือนเท่านั้น) */
function findOverlappingVariantIdPairs(variants: VehicleVariant[]): [string, string][] {
  const pairs: [string, string][] = []
  for (let i = 0; i < variants.length; i++) {
    for (let j = i + 1; j < variants.length; j++) {
      const vi = variants[i]
      const vj = variants[j]
      const ai: [number, number] = [vi.yearFrom, vi.yearTo]
      const aj: [number, number] = [vj.yearFrom, vj.yearTo]
      if (yearRangesOverlap(ai, aj)) pairs.push([vi.id, vj.id])
    }
  }
  return pairs
}

function parseNumInput(s: string): number | undefined {
  const t = s.trim()
  if (t === '') return undefined
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}

function parseAliasesInput(s: string): string[] {
  return s
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function tryBuildEngineDef(
  id: string,
  pt: VehiclePowertrainType,
  engineSize: string,
  engineCode: string,
  engineCodeAliases: string[],
  fuel: VehicleFuelType,
  motorStr: string,
  batteryStr: string,
  variants: VehicleVariant[],
): VehicleEngineDef | null {
  const trimmed = engineSize.trim()
  const code = engineCode.trim()
  const motor = parseNumInput(motorStr)
  const battery = parseNumInput(batteryStr)

  if (pt === 'ev') {
    if (!trimmed && !code && motor == null && battery == null) return null
    return normalizeEngineDef({
      id,
      powertrain_type: 'ev',
      engine_size: trimmed || null,
      engine_code: code || null,
      engine_code_aliases: engineCodeAliases,
      fuel_type: null,
      motor_power: motor ?? null,
      battery_capacity: battery ?? null,
      variants,
    })
  }

  if (!trimmed && !code) return null

  if (pt === 'ice') {
    return normalizeEngineDef({
      id,
      powertrain_type: 'ice',
      engine_size: trimmed || null,
      engine_code: code || null,
      engine_code_aliases: engineCodeAliases,
      fuel_type: fuel,
      motor_power: null,
      battery_capacity: null,
      variants,
    })
  }

  return normalizeEngineDef({
    id,
    powertrain_type: pt,
    engine_size: trimmed || null,
    engine_code: code || null,
    engine_code_aliases: engineCodeAliases,
    fuel_type: fuel,
    motor_power: motor ?? null,
    battery_capacity: battery ?? null,
    variants,
  })
}

type EnginePowertrainFieldsProps = {
  powertrain: VehiclePowertrainType
  onPowertrainChange: (v: VehiclePowertrainType) => void
  engineName: string
  onEngineNameChange: (v: string) => void
  engineCode: string
  onEngineCodeChange: (v: string) => void
  engineCodeAliases: string
  onEngineCodeAliasesChange: (v: string) => void
  fuel: VehicleFuelType
  onFuelChange: (v: VehicleFuelType) => void
  motorKw: string
  onMotorKwChange: (v: string) => void
  batteryKwh: string
  onBatteryKwhChange: (v: string) => void
  disabled?: boolean
}

function EnginePowertrainFields({
  powertrain,
  onPowertrainChange,
  engineName,
  onEngineNameChange,
  engineCode,
  onEngineCodeChange,
  engineCodeAliases,
  onEngineCodeAliasesChange,
  fuel,
  onFuelChange,
  motorKw,
  onMotorKwChange,
  batteryKwh,
  onBatteryKwhChange,
  disabled,
}: EnginePowertrainFieldsProps) {
  const showFuel = powertrainShowsEngineFuel(powertrain)
  const showSize = powertrain !== 'ev'
  const showMB = powertrainShowsMotorBattery(powertrain)
  return (
    <>
      <label className="block">
        <span className="mb-0.5 block text-[10px] text-slate-500">Powertrain</span>
        <select
          className={selectClassCompact}
          value={powertrain}
          onChange={(ev) => onPowertrainChange(ev.target.value as VehiclePowertrainType)}
          disabled={disabled}
        >
          {POWERTRAIN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {showSize ? (
        <label className="block">
          <span className="mb-0.5 block text-[10px] text-slate-500">ขนาดเครื่อง (เช่น 1.6)</span>
          <input
            className={inputClassCompact}
            placeholder="1.6"
            value={engineName}
            onChange={(ev) => onEngineNameChange(ev.target.value)}
            disabled={disabled}
          />
        </label>
      ) : null}
      <label className="block">
        <span className="mb-0.5 block text-[10px] text-slate-500">รหัสเครื่อง</span>
        <input
          className={inputClassCompact}
          placeholder="เช่น 4JA1, 1KD, B16A"
          value={engineCode}
          onChange={(ev) => onEngineCodeChange(ev.target.value)}
          disabled={disabled}
        />
      </label>
      <label className="block">
        <span className="mb-0.5 block text-[10px] text-slate-500">alias ค้นหา</span>
        <input
          className={inputClassCompact}
          placeholder="เช่น 4JA, 4JA-T, 4JA1"
          value={engineCodeAliases}
          onChange={(ev) => onEngineCodeAliasesChange(ev.target.value)}
          disabled={disabled}
        />
        <span className="mt-0.5 block text-[9px] leading-snug text-slate-400">คั่นหลายคำด้วย , หรือ |</span>
      </label>
      {showFuel ? (
        <label className="block">
          <span className="mb-0.5 block text-[10px] text-slate-500">Fuel</span>
          <select
            className={clsx(selectClassCompact, 'whitespace-nowrap')}
            value={fuel}
            onChange={(ev) => onFuelChange(ev.target.value as VehicleFuelType)}
            disabled={disabled}
          >
            {FUEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {showMB ? (
        <>
          <label className="block">
            <span className="mb-0.5 block text-[10px] text-slate-500">กำลังมอเตอร์ (kW)</span>
            <input
              className={inputClassCompact}
              inputMode="decimal"
              placeholder="เช่น 150"
              value={motorKw}
              onChange={(ev) => onMotorKwChange(ev.target.value)}
              disabled={disabled}
            />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] text-slate-500">แบตเตอรี่ (kWh)</span>
            <input
              className={inputClassCompact}
              inputMode="decimal"
              placeholder="เช่น 75"
              value={batteryKwh}
              onChange={(ev) => onBatteryKwhChange(ev.target.value)}
              disabled={disabled}
            />
          </label>
        </>
      ) : null}
    </>
  )
}

export function VehicleManageView() {
  const { catalog, setCatalog, visibleCategoryIds, setVisibleCategoryIds } = useVehicleCatalog()

  const sortedCats = useMemo(
    () => [...catalog.categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [catalog.categories],
  )

  const [categoryId, setCategoryId] = useState<string | null>(() => sortedCats[0]?.id ?? null)
  const [brandId, setBrandId] = useState<string | null>(null)
  const [modelId, setModelId] = useState<string | null>(null)
  const [selectedEngineDefId, setSelectedEngineDefId] = useState<string | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  const [newCategoryName, setNewCategoryName] = useState('')
  const [newBrandName, setNewBrandName] = useState('')
  const [newModelName, setNewModelName] = useState('')
  const [newEngineName, setNewEngineName] = useState('')
  const [newEngineCode, setNewEngineCode] = useState('')
  const [newEngineCodeAliasesText, setNewEngineCodeAliasesText] = useState('')
  const [newEnginePowertrain, setNewEnginePowertrain] = useState<VehiclePowertrainType>('ice')
  const [newEngineFuel, setNewEngineFuel] = useState<VehicleFuelType>('unspecified')
  const [newMotorKw, setNewMotorKw] = useState('')
  const [newBatteryKwh, setNewBatteryKwh] = useState('')
  const [newTruckEuro, setNewTruckEuro] = useState('')
  const [newTruckWheels, setNewTruckWheels] = useState('')
  const [newTruckHp, setNewTruckHp] = useState('')
  const currentYear = new Date().getFullYear()
  const isTruckCategory = categoryId === 'truck'
  const [variantDraftGenerationCode, setVariantDraftGenerationCode] = useState('')
  const [variantDraftYearFrom, setVariantDraftYearFrom] = useState<number>(currentYear)
  const [variantDraftYearTo, setVariantDraftYearTo] = useState<number>(currentYear)
  const [variantContextMenu, setVariantContextMenu] = useState<{
    variantId: string
    x: number
    y: number
  } | null>(null)
  const [variantEditorDialog, setVariantEditorDialog] = useState<{
    mode: 'copy' | 'edit'
    engId: string
    variantId: string
    generationCode: string
    yearFrom: number
    yearTo: number
  } | null>(null)

  const catData = categoryId ? catalog.byCategory[categoryId] : undefined
  const brands = catData?.brands ?? []
  const models = brandId && catData ? (catData.modelsByBrandId[brandId] ?? []) : []
  const engineDefs = modelId && catData ? (catData.enginesByModelId[modelId] ?? []) : []
  const sortedBrands = useMemo(() => [...brands].sort(byNameAsc), [brands])
  const sortedModels = useMemo(() => [...models].sort(byNameAsc), [models])

  const selectedCategoryLabel = sortedCats.find((c) => c.id === categoryId)?.label ?? ''
  const selectedEngineDef = engineDefs.find((e) => e.id === selectedEngineDefId) ?? null
  const summaryBrandName = sortedBrands.find((b) => b.id === brandId)?.name ?? ''
  const summaryModelName = sortedModels.find((m) => m.id === modelId)?.name ?? ''

  const variantOverlapPairs = useMemo(() => {
    if (!selectedEngineDef) return []
    if (normalizeEngineDef(selectedEngineDef).line_kind === 'truck') return []
    return findOverlappingVariantIdPairs(selectedEngineDef.variants)
  }, [selectedEngineDef])

  const canSubmitNewEngine = useMemo(() => {
    if (!modelId || selectedEngineDef) return false
    if (isTruckCategory) {
      return (
        tryBuildTruckEngineDef(
          'new',
          newTruckEuro,
          newTruckWheels,
          newTruckHp,
          newEngineCode,
          parseAliasesInput(newEngineCodeAliasesText),
          [],
          'new-var',
        ) !== null
      )
    }
    return (
      tryBuildEngineDef(
        'new',
        newEnginePowertrain,
        newEngineName,
        newEngineCode,
        parseAliasesInput(newEngineCodeAliasesText),
        newEngineFuel,
        newMotorKw,
        newBatteryKwh,
        [],
      ) !== null
    )
  }, [
    modelId,
    selectedEngineDef,
    isTruckCategory,
    newEngineCode,
    newEngineCodeAliasesText,
    newTruckEuro,
    newTruckWheels,
    newTruckHp,
    newEnginePowertrain,
    newEngineName,
    newEngineFuel,
    newMotorKw,
    newBatteryKwh,
  ])

  const canSaveEditEngine = useMemo(() => {
    if (!selectedEngineDef) return false
    if (isTruckCategory && normalizeEngineDef(selectedEngineDef).line_kind === 'truck') {
      const vid = selectedEngineDef.variants[0]?.id ?? 'v'
      return (
        tryBuildTruckEngineDef(
          selectedEngineDef.id,
          newTruckEuro,
          newTruckWheels,
          newTruckHp,
          newEngineCode,
          parseAliasesInput(newEngineCodeAliasesText),
          selectedEngineDef.variants,
          vid,
        ) !== null
      )
    }
    return (
      tryBuildEngineDef(
        selectedEngineDef.id,
        newEnginePowertrain,
        newEngineName,
        newEngineCode,
        parseAliasesInput(newEngineCodeAliasesText),
        newEngineFuel,
        newMotorKw,
        newBatteryKwh,
        selectedEngineDef.variants,
      ) !== null
    )
  }, [
    selectedEngineDef,
    isTruckCategory,
    newEngineCode,
    newEngineCodeAliasesText,
    newTruckEuro,
    newTruckWheels,
    newTruckHp,
    newEnginePowertrain,
    newEngineName,
    newEngineFuel,
    newMotorKw,
    newBatteryKwh,
  ])

  useEffect(() => {
    if (!selectedEngineDef) {
      setNewEngineName('')
      setNewEngineCode('')
      setNewEngineCodeAliasesText('')
      setNewEnginePowertrain('ice')
      setNewEngineFuel('unspecified')
      setNewMotorKw('')
      setNewBatteryKwh('')
      setNewTruckEuro('')
      setNewTruckWheels('')
      setNewTruckHp('')
      return
    }
    const e = normalizeEngineDef(selectedEngineDef)
    if (e.line_kind === 'truck') {
      setNewEngineCode(e.engine_code ?? '')
      setNewEngineCodeAliasesText((e.engine_code_aliases ?? []).join(', '))
      setNewTruckEuro(e.truck_euro ?? '')
      setNewTruckWheels(e.truck_wheel_config ?? '')
      setNewTruckHp(e.truck_hp != null ? String(e.truck_hp) : '')
      setNewEngineName('')
      setNewEnginePowertrain('ice')
      setNewEngineFuel(e.fuel_type ?? 'diesel')
      setNewMotorKw('')
      setNewBatteryKwh('')
      return
    }
    setNewEngineCode(e.engine_code ?? '')
    setNewEngineCodeAliasesText((e.engine_code_aliases ?? []).join(', '))
    setNewTruckEuro('')
    setNewTruckWheels('')
    setNewTruckHp('')
    setNewEnginePowertrain(e.powertrain_type ?? 'ice')
    setNewEngineName(e.engine_size ?? '')
    setNewEngineFuel(e.fuel_type ?? 'unspecified')
    setNewMotorKw(e.motor_power != null ? String(e.motor_power) : '')
    setNewBatteryKwh(e.battery_capacity != null ? String(e.battery_capacity) : '')
  }, [selectedEngineDefId, selectedEngineDef])

  useEffect(() => {
    if (categoryId && sortedCats.some((c) => c.id === categoryId)) return
    setCategoryId(sortedCats[0]?.id ?? null)
    setBrandId(null)
    setModelId(null)
    setSelectedEngineDefId(null)
  }, [sortedCats, categoryId])

  useEffect(() => {
    if (!brandId || !sortedBrands.some((b) => b.id === brandId)) {
      setBrandId(sortedBrands[0]?.id ?? null)
    }
  }, [sortedBrands, brandId, categoryId])

  useEffect(() => {
    if (!modelId || !sortedModels.some((m) => m.id === modelId)) {
      setModelId(sortedModels[0]?.id ?? null)
    }
  }, [sortedModels, modelId, brandId])

  useEffect(() => {
    if (!modelId || !categoryId) {
      setSelectedEngineDefId(null)
      return
    }
    const list = catalog.byCategory[categoryId]?.enginesByModelId[modelId] ?? []
    setSelectedEngineDefId((prev) => {
      if (prev && list.some((e) => e.id === prev)) return prev
      return list[0]?.id ?? null
    })
  }, [modelId, categoryId, catalog])

  useEffect(() => {
    if (!selectedEngineDef) {
      setSelectedVariantId(null)
      return
    }
    setSelectedVariantId((prev) => {
      if (prev && selectedEngineDef.variants.some((v) => v.id === prev)) return prev
      return selectedEngineDef.variants[0]?.id ?? null
    })
  }, [selectedEngineDef])

  useEffect(() => {
    setVariantDraftGenerationCode('')
    setVariantDraftYearFrom(currentYear)
    setVariantDraftYearTo(currentYear)
    setVariantContextMenu(null)
    setVariantEditorDialog(null)
  }, [selectedEngineDefId, currentYear])

  useEffect(() => {
    if (!variantContextMenu) return
    const close = () => setVariantContextMenu(null)
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [variantContextMenu])

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== 'F2') return
      if (!selectedEngineDef || !selectedVariantId) return
      if (normalizeEngineDef(selectedEngineDef).line_kind === 'truck') return
      const current = selectedEngineDef.variants.find((v) => v.id === selectedVariantId)
      if (!current) return
      ev.preventDefault()
      openVariantEditorDialog('copy', selectedEngineDef.id, current)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedEngineDef, selectedVariantId])

  function patchModelEngines(next: VehicleEngineDef[]) {
    if (!categoryId || !modelId) return
    const cat = catalog.byCategory[categoryId]
    setCatalog({
      ...catalog,
      byCategory: {
        ...catalog.byCategory,
        [categoryId]: {
          ...cat,
          enginesByModelId: { ...cat.enginesByModelId, [modelId]: next },
        },
      },
    })
  }

  function addCategory() {
    const label = newCategoryName.trim()
    if (!label) return
    const id = newEntityId('cat')
    const sortOrder = Math.max(0, ...catalog.categories.map((c) => c.sortOrder)) + 10
    setCatalog({
      ...catalog,
      categories: [...catalog.categories, { id, label, sortOrder }],
      byCategory: { ...catalog.byCategory, [id]: emptyCatalog() },
    })
    setNewCategoryName('')
    setCategoryId(id)
    setBrandId(null)
    setModelId(null)
    setSelectedEngineDefId(null)
  }

  function removeCategory(id: string) {
    const label = catalog.categories.find((c) => c.id === id)?.label ?? id
    if (
      !window.confirm(
        `ต้องการลบประเภท "${label}" หรือไม่?\n\nข้อมูลยี่ห้อ รุ่น และเครื่อง/ปีทั้งหมดในประเภทนี้จะถูกลบถาวร`,
      )
    ) {
      return
    }
    const { [id]: removedCategory, ...restBy } = catalog.byCategory
    void removedCategory
    setCatalog({
      ...catalog,
      categories: catalog.categories.filter((c) => c.id !== id),
      byCategory: restBy,
    })
    setVisibleCategoryIds(new Set([...visibleCategoryIds].filter((cid) => cid !== id)))
    if (categoryId === id) {
      setCategoryId(null)
      setBrandId(null)
      setModelId(null)
      setSelectedEngineDefId(null)
    }
  }

  function addBrand() {
    if (!categoryId) return
    const name = newBrandName.trim().replace(/\s+/g, ' ')
    if (!name) return
    const bid = newEntityId('brand')
    const cat = catalog.byCategory[categoryId]
    const normalized = normalizeEntityName(name)
    const isDuplicate = cat.brands.some((b) => normalizeEntityName(b.name) === normalized)
    if (isDuplicate) {
      window.alert(`มียี่ห้อ "${name}" อยู่แล้ว (ไม่แยกตัวพิมพ์เล็ก/ใหญ่)`)
      return
    }
    setCatalog({
      ...catalog,
      byCategory: {
        ...catalog.byCategory,
        [categoryId]: {
          ...cat,
          brands: [...cat.brands, { id: bid, name }],
          modelsByBrandId: { ...cat.modelsByBrandId, [bid]: [] },
          enginesByModelId: { ...cat.enginesByModelId },
        },
      },
    })
    setNewBrandName('')
    setBrandId(bid)
    setModelId(null)
    setSelectedEngineDefId(null)
  }

  function removeBrand(bid: string) {
    if (!categoryId) return
    const cat = catalog.byCategory[categoryId]
    const brandName = cat.brands.find((b) => b.id === bid)?.name ?? bid
    if (
      !window.confirm(
        `ต้องการลบยี่ห้อ "${brandName}" หรือไม่?\n\nรุ่นและเครื่อง/ปีที่อยู่ภายใต้ยี่ห้อนี้จะถูกลบถาวร`,
      )
    ) {
      return
    }
    const modelsForBrand = cat.modelsByBrandId[bid] ?? []
    const enginesByModelId = { ...cat.enginesByModelId }
    for (const m of modelsForBrand) {
      delete enginesByModelId[m.id]
    }
    const { [bid]: removedModels, ...restModels } = cat.modelsByBrandId
    void removedModels
    setCatalog({
      ...catalog,
      byCategory: {
        ...catalog.byCategory,
        [categoryId]: {
          ...cat,
          brands: cat.brands.filter((b) => b.id !== bid),
          modelsByBrandId: restModels,
          enginesByModelId,
        },
      },
    })
    setBrandId(null)
    setModelId(null)
    setSelectedEngineDefId(null)
  }

  function addModel() {
    if (!categoryId || !brandId) return
    const name = newModelName.trim().replace(/\s+/g, ' ')
    if (!name) return
    const normalized = normalizeEntityName(name)
    const existing = catData?.modelsByBrandId[brandId] ?? []
    const isDuplicate = existing.some((m) => normalizeEntityName(m.name) === normalized)
    if (isDuplicate) {
      window.alert(`มีรุ่น "${name}" อยู่แล้ว (ไม่แยกตัวพิมพ์เล็ก/ใหญ่)`)
      return
    }
    const mid = newEntityId('model')
    const cat = catalog.byCategory[categoryId]
    const list = [...(cat.modelsByBrandId[brandId] ?? []), { id: mid, name }]
    setCatalog({
      ...catalog,
      byCategory: {
        ...catalog.byCategory,
        [categoryId]: {
          ...cat,
          modelsByBrandId: { ...cat.modelsByBrandId, [brandId]: list },
          enginesByModelId: { ...cat.enginesByModelId, [mid]: [] },
        },
      },
    })
    setNewModelName('')
    setModelId(mid)
    setSelectedEngineDefId(null)
  }

  function removeModel(mid: string) {
    if (!categoryId || !brandId) return
    const cat = catalog.byCategory[categoryId]
    const modelName = (cat.modelsByBrandId[brandId] ?? []).find((m) => m.id === mid)?.name ?? mid
    if (
      !window.confirm(
        `ต้องการลบรุ่น "${modelName}" หรือไม่?\n\nรายการเครื่องและ variant ของรุ่นนี้จะถูกลบถาวร`,
      )
    ) {
      return
    }
    const list = (cat.modelsByBrandId[brandId] ?? []).filter((m) => m.id !== mid)
    const enginesByModelId = { ...cat.enginesByModelId }
    delete enginesByModelId[mid]
    setCatalog({
      ...catalog,
      byCategory: {
        ...catalog.byCategory,
        [categoryId]: {
          ...cat,
          modelsByBrandId: { ...cat.modelsByBrandId, [brandId]: list },
          enginesByModelId,
        },
      },
    })
    setModelId(null)
    setSelectedEngineDefId(null)
  }

  function addEngineDef() {
    if (!modelId) return
    if (isTruckCategory) {
      const engId = newEntityId('eng')
      const varId = newEntityId('var')
      const built = tryBuildTruckEngineDef(
        engId,
        newTruckEuro,
        newTruckWheels,
        newTruckHp,
        newEngineCode,
        parseAliasesInput(newEngineCodeAliasesText),
        [],
        varId,
      )
      if (!built) return
      patchModelEngines([...engineDefs, built])
      setNewEngineCode('')
      setNewEngineCodeAliasesText('')
      setNewTruckEuro('')
      setNewTruckWheels('')
      setNewTruckHp('')
      setSelectedEngineDefId(engId)
      return
    }
    const engId = newEntityId('eng')
    const built = tryBuildEngineDef(
      engId,
      newEnginePowertrain,
      newEngineName,
      newEngineCode,
      parseAliasesInput(newEngineCodeAliasesText),
      newEngineFuel,
      newMotorKw,
      newBatteryKwh,
      [],
    )
    if (!built) return
    patchModelEngines([...engineDefs, built])
    setNewEngineName('')
    setNewEngineCode('')
    setNewEngineCodeAliasesText('')
    setNewEnginePowertrain('ice')
    setNewEngineFuel('unspecified')
    setNewMotorKw('')
    setNewBatteryKwh('')
    setSelectedEngineDefId(engId)
  }

  function saveEditEngineDef() {
    if (!selectedEngineDefId || !selectedEngineDef) return
    if (isTruckCategory && normalizeEngineDef(selectedEngineDef).line_kind === 'truck') {
      const vid = selectedEngineDef.variants[0]?.id ?? newEntityId('var')
      const built = tryBuildTruckEngineDef(
        selectedEngineDefId,
        newTruckEuro,
        newTruckWheels,
        newTruckHp,
        newEngineCode,
        parseAliasesInput(newEngineCodeAliasesText),
        selectedEngineDef.variants,
        vid,
      )
      if (!built) return
      patchModelEngines(engineDefs.map((e) => (e.id === built.id ? built : e)))
      return
    }
    const built = tryBuildEngineDef(
      selectedEngineDefId,
      newEnginePowertrain,
      newEngineName,
      newEngineCode,
      parseAliasesInput(newEngineCodeAliasesText),
      newEngineFuel,
      newMotorKw,
      newBatteryKwh,
      selectedEngineDef.variants,
    )
    if (!built) return
    patchModelEngines(engineDefs.map((e) => (e.id === built.id ? built : e)))
  }

  function removeEngineDef(engId: string) {
    const eng = engineDefs.find((e) => e.id === engId)
    if (!eng) return
    const label = formatEngineDisplayName(normalizeEngineDef(eng))
    if (!window.confirm(`ลบระบบขับเคลื่อน "${label}" และ variant ทั้งหมดใต้รายการนี้หรือไม่?`)) return
    const next = engineDefs.filter((e) => e.id !== engId)
    patchModelEngines(next)
    setSelectedEngineDefId(next[0]?.id ?? null)
  }

  function patchVariant(engId: string, variantId: string, patch: Partial<VehicleVariant>) {
    const next = engineDefs.map((e) =>
      e.id === engId
        ? {
            ...e,
            variants: e.variants.map((v) => {
              if (v.id !== variantId) return v
              const merged = { ...v, ...patch }
              let yf = Number.isFinite(merged.yearFrom) ? Math.round(merged.yearFrom) : currentYear
              let yt = Number.isFinite(merged.yearTo) ? Math.round(merged.yearTo) : currentYear
              if (yt === 0) yt = OPEN_END_YEAR
              if (yf > yt) [yf, yt] = [yt, yf]
              return {
                ...merged,
                yearFrom: clampYear(yf),
                yearTo: clampYear(yt),
                generationCode: merged.generationCode?.trim() || undefined,
              }
            }),
          }
        : e,
    )
    patchModelEngines(next)
  }

  function resetVariantDraft() {
    setVariantDraftGenerationCode('')
    setVariantDraftYearFrom(currentYear)
    setVariantDraftYearTo(currentYear)
  }

  function submitVariantDraft() {
    if (!selectedEngineDefId) return
    let yearFrom = clampYear(variantDraftYearFrom)
    let yearTo = variantDraftYearTo === 0 ? OPEN_END_YEAR : clampYear(variantDraftYearTo)
    if (yearFrom > yearTo) [yearFrom, yearTo] = [yearTo, yearFrom]
    const varId = newEntityId('var')
    const next = engineDefs.map((e) =>
      e.id === selectedEngineDefId
        ? {
            ...e,
            variants: [
              ...e.variants,
              {
                id: varId,
                yearFrom,
                yearTo,
                generationCode: variantDraftGenerationCode.trim() || undefined,
              },
            ],
          }
        : e,
    )
    patchModelEngines(next)
    setSelectedVariantId(varId)
    resetVariantDraft()
  }

  function duplicateEngineDef(engId: string) {
    const eng = engineDefs.find((e) => e.id === engId)
    if (!eng) return
    const newEngId = newEntityId('eng')
    const newEng: VehicleEngineDef = {
      ...normalizeEngineDef(eng),
      id: newEngId,
      variants: eng.variants.map((v) => ({ ...v, id: newEntityId('var') })),
    }
    patchModelEngines([...engineDefs, newEng])
    setSelectedEngineDefId(newEngId)
  }

  function duplicateVariant(engId: string, v: VehicleVariant) {
    let yearFrom = clampYear(v.yearFrom)
    let yearTo = v.yearTo === 0 ? OPEN_END_YEAR : clampYear(v.yearTo)
    if (yearFrom > yearTo) [yearFrom, yearTo] = [yearTo, yearFrom]
    const copy: VehicleVariant = {
      ...v,
      generationCode: v.generationCode?.trim() || undefined,
      yearFrom,
      yearTo,
      id: newEntityId('var'),
    }
    const next = engineDefs.map((e) =>
      e.id === engId ? { ...e, variants: [...e.variants, copy] } : e,
    )
    patchModelEngines(next)
    setSelectedVariantId(copy.id)
  }

  function openVariantEditorDialog(mode: 'copy' | 'edit', engId: string, v: VehicleVariant) {
    setVariantEditorDialog({
      mode,
      engId,
      variantId: v.id,
      generationCode: v.generationCode ?? '',
      yearFrom: v.yearFrom,
      yearTo: v.yearTo >= OPEN_END_YEAR ? 0 : v.yearTo,
    })
  }

  function confirmVariantEditorDialog() {
    if (!variantEditorDialog) return
    const source = engineDefs
      .find((e) => e.id === variantEditorDialog.engId)
      ?.variants.find((v) => v.id === variantEditorDialog.variantId)
    if (!source) {
      setVariantEditorDialog(null)
      return
    }
    let yearFrom = clampYear(variantEditorDialog.yearFrom)
    let yearTo = variantEditorDialog.yearTo === 0 ? OPEN_END_YEAR : clampYear(variantEditorDialog.yearTo)
    if (yearFrom > yearTo) [yearFrom, yearTo] = [yearTo, yearFrom]
    if (variantEditorDialog.mode === 'edit') {
      patchVariant(variantEditorDialog.engId, source.id, {
        generationCode: variantEditorDialog.generationCode,
        yearFrom,
        yearTo,
      })
      setSelectedVariantId(source.id)
    } else {
      duplicateVariant(variantEditorDialog.engId, {
        ...source,
        generationCode: variantEditorDialog.generationCode,
        yearFrom,
        yearTo,
      })
    }
    setVariantEditorDialog(null)
  }

  function removeVariant(engId: string, variantId: string) {
    const eng = engineDefs.find((e) => e.id === engId)
    if (!eng) return
    if (eng.variants.length <= 1) {
      removeEngineDef(engId)
      return
    }
    const next = engineDefs.map((e) =>
      e.id === engId ? { ...e, variants: e.variants.filter((v) => v.id !== variantId) } : e,
    )
    patchModelEngines(next)
    if (selectedVariantId === variantId) {
      const rest = eng.variants.filter((v) => v.id !== variantId)
      setSelectedVariantId(rest[0]?.id ?? null)
    }
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 bg-slate-100/40 p-1.5">
      <div className="flex min-h-0 flex-1 items-stretch gap-1.5">
        <div className="flex min-h-0 min-w-0 shrink-0 gap-1.5 overflow-x-auto [scrollbar-width:thin]">
          <CatalogColumn title="1. ประเภท" widthClass="w-[8.75rem]">
            <div className="flex min-h-[10.5rem] flex-1 flex-col gap-1">
              <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-0.5">
            {sortedCats.map((c) => (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setCategoryId(c.id)
                  setBrandId(null)
                  setModelId(null)
                  setSelectedEngineDefId(null)
                }}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault()
                    setCategoryId(c.id)
                    setBrandId(null)
                    setModelId(null)
                    setSelectedEngineDefId(null)
                  }
                }}
                className={clsx(
                  'flex w-full cursor-pointer items-center justify-between gap-0.5 rounded px-1.5 py-1 text-left text-[11px] font-medium transition',
                  categoryId === c.id
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200/90 bg-white text-slate-800 hover:border-slate-300',
                )}
              >
                <span className="truncate">{c.label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeCategory(c.id)
                  }}
                  className={clsx(
                    'shrink-0 rounded p-0.5',
                    categoryId === c.id
                      ? 'text-rose-300 hover:bg-white/15'
                      : 'text-rose-500 hover:bg-rose-50 hover:text-rose-700',
                  )}
                  aria-label={`ลบ ${c.label}`}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
              </div>
              <div className="shrink-0 border-t border-slate-100/90 pt-1">
                <div className="flex gap-1">
                  <input
                    className={inputClassCompact}
                    placeholder="เพิ่มประเภท"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <button type="button" className={addBtnClassCompact} onClick={addCategory} aria-label="เพิ่มประเภท">
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </CatalogColumn>

          <CatalogColumn title="2. ยี่ห้อ" widthClass="w-[8.75rem]">
            <div className="flex min-h-[10.5rem] flex-1 flex-col gap-1">
              <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-0.5">
            {sortedBrands.map((b) => (
              <div
                key={b.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setBrandId(b.id)
                  setModelId(null)
                  setSelectedEngineDefId(null)
                }}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault()
                    setBrandId(b.id)
                    setModelId(null)
                    setSelectedEngineDefId(null)
                  }
                }}
                className={clsx(
                  'flex w-full cursor-pointer items-center justify-between gap-0.5 rounded px-1.5 py-1 text-left text-[11px] font-medium transition',
                  brandId === b.id
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200/90 bg-white text-slate-800 hover:border-slate-300',
                )}
              >
                <span className="truncate">{b.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeBrand(b.id)
                  }}
                  className={clsx(
                    'shrink-0 rounded p-0.5',
                    brandId === b.id
                      ? 'text-rose-300 hover:bg-white/15'
                      : 'text-rose-500 hover:bg-rose-50 hover:text-rose-700',
                  )}
                  aria-label={`ลบ ${b.name}`}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
              </div>
              <div className="shrink-0 border-t border-slate-100/90 pt-1">
                <div className="flex gap-1">
                  <input
                    className={inputClassCompact}
                    placeholder={categoryId ? `เพิ่มยี่ห้อ${selectedCategoryLabel ? ` (${selectedCategoryLabel})` : ''}` : 'เลือกประเภทก่อน'}
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    disabled={!categoryId}
                    onKeyDown={(e) => e.key === 'Enter' && addBrand()}
                  />
                  <button
                    type="button"
                    className={addBtnClassCompact}
                    onClick={addBrand}
                    disabled={!categoryId}
                    aria-label="เพิ่มยี่ห้อ"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </CatalogColumn>

          <CatalogColumn title="3. รุ่น" widthClass="w-[8.75rem]">
            <div className="flex min-h-[10.5rem] flex-1 flex-col gap-1">
              <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-0.5">
            {sortedModels.map((m) => (
              <div
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setModelId(m.id)
                  setSelectedEngineDefId(null)
                }}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault()
                    setModelId(m.id)
                    setSelectedEngineDefId(null)
                  }
                }}
                className={clsx(
                  'flex w-full cursor-pointer items-center justify-between gap-0.5 rounded px-1.5 py-1 text-left text-[11px] font-medium transition',
                  modelId === m.id
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200/90 bg-white text-slate-800 hover:border-slate-300',
                )}
              >
                <span className="truncate">{m.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeModel(m.id)
                  }}
                  className={clsx(
                    'shrink-0 rounded p-0.5',
                    modelId === m.id
                      ? 'text-rose-300 hover:bg-white/15'
                      : 'text-rose-500 hover:bg-rose-50 hover:text-rose-700',
                  )}
                  aria-label={`ลบ ${m.name}`}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
              </div>
              <div className="shrink-0 border-t border-slate-100/90 pt-1">
                <div className="flex gap-1">
                  <input
                    className={inputClassCompact}
                    placeholder="เพิ่มรุ่นรถ"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    disabled={!brandId}
                    onKeyDown={(e) => e.key === 'Enter' && addModel()}
                  />
                  <button
                    type="button"
                    className={addBtnClassCompact}
                    onClick={addModel}
                    disabled={!brandId}
                    aria-label="เพิ่มรุ่น"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </CatalogColumn>

          <CatalogColumn title={isTruckCategory ? '4. สเปก (EURO·ล้อ·HP)' : '4. ขับเคลื่อน'} widthClass="w-[10.25rem]">
            <div className="flex min-h-[12rem] flex-1 flex-col gap-1">
              <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-0.5">
            {engineDefs.map((e) => {
              const en = normalizeEngineDef(e)
              const summaryLine = formatEngineDisplayName(en)
              const truckLine = en.line_kind === 'truck'
              return (
              <div
                key={e.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedEngineDefId(e.id)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault()
                    setSelectedEngineDefId(e.id)
                  }
                }}
                className={clsx(
                  'flex w-full cursor-pointer items-start justify-between gap-0.5 rounded border px-1.5 py-1 text-left transition',
                  selectedEngineDefId === e.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200/90 bg-slate-50/80 text-slate-800 hover:border-slate-300',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={clsx(
                      'truncate text-[11px] font-semibold leading-tight',
                      selectedEngineDefId === e.id ? 'text-white' : 'text-slate-900',
                    )}
                  >
                    <span
                      className={clsx(
                        'mr-1 font-normal',
                        selectedEngineDefId === e.id ? 'text-slate-300' : 'text-slate-500',
                      )}
                    >
                      {truckLine ? 'รถบรรทุก' : powertrainLabel(en.powertrain_type ?? 'ice')}
                    </span>
                    {summaryLine}
                  </p>
                  <p
                    className={clsx(
                      'mt-0.5 text-[10px] leading-snug',
                      selectedEngineDefId === e.id ? 'text-slate-400' : 'text-slate-500',
                    )}
                  >
                    {truckLine ? 'ไม่เก็บปี · ผูกสินค้า 1 รหัส/สเปก' : `${e.variants.length} ช่วงปี`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      duplicateEngineDef(e.id)
                    }}
                    className={clsx(
                      'rounded p-0.5',
                      selectedEngineDefId === e.id
                        ? 'text-sky-200 hover:bg-white/15'
                        : 'text-sky-600 hover:bg-sky-50',
                    )}
                    title="คัดลอกรายการ (รหัสสเปกและรหัสผูกสินค้าใหม่ทั้งหมด)"
                    aria-label="คัดลอกเครื่อง"
                  >
                    <Copy className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      removeEngineDef(e.id)
                    }}
                    className={clsx(
                      'shrink-0 rounded p-0.5',
                      selectedEngineDefId === e.id
                        ? 'text-rose-300 hover:bg-white/15'
                        : 'text-rose-500 hover:bg-rose-50',
                    )}
                    aria-label="ลบเครื่อง"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
              )
            })}
              </div>
              <div className="shrink-0 space-y-1 border-t border-slate-100/90 pt-1">
            <p className="text-[10px] font-medium text-slate-600">
              {selectedEngineDef ? 'แก้ไขรายการที่เลือก' : 'เพิ่มรายการใหม่'}
            </p>
            {isTruckCategory &&
            selectedEngineDef &&
            normalizeEngineDef(selectedEngineDef).line_kind !== 'truck' ? (
              <p className="mb-0.5 text-[9px] leading-snug text-amber-800">
                รายการนี้เป็นรูปแบบเครื่อง/ปีเดิม — แก้ไขได้ตามเดิม หรือลบแล้วเพิ่มสเปก EURO·ล้อ·HP ใหม่
              </p>
            ) : null}
            <span className="mb-0.5 block text-[9px] leading-snug text-slate-400">
              {isTruckCategory &&
              (!selectedEngineDef || normalizeEngineDef(selectedEngineDef).line_kind === 'truck')
                ? 'ยี่ห้อ/รุ่นอยู่คอลัมน์ก่อนหน้า — กรอก EURO, จำนวนล้อ, HP และรหัสเครื่องต่อแถวสเปก'
                : 'รุ่นเดียวกันอาจมีหลายระบบขับเคลื่อน — ถ้าอะไหล่คนละช่วงปี ให้แยกหลายแถวที่ «โฉม & ช่วงปี» ด้านขวา'}
            </span>
            {isTruckCategory &&
            (!selectedEngineDef || normalizeEngineDef(selectedEngineDef).line_kind === 'truck') ? (
              <div className="space-y-1">
                <label className="block">
                  <span className="mb-0.5 block text-[10px] text-slate-500">EURO</span>
                  <input
                    className={inputClassCompact}
                    placeholder="เช่น EURO 5, EURO 6"
                    value={newTruckEuro}
                    onChange={(ev) => setNewTruckEuro(ev.target.value)}
                    disabled={!modelId}
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[10px] text-slate-500">จำนวนล้อ</span>
                  <input
                    className={inputClassCompact}
                    placeholder="เช่น 6 ล้อ, 10 ล้อ"
                    value={newTruckWheels}
                    onChange={(ev) => setNewTruckWheels(ev.target.value)}
                    disabled={!modelId}
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[10px] text-slate-500">HP (แรงม้า)</span>
                  <input
                    className={inputClassCompact}
                    inputMode="decimal"
                    placeholder="เช่น 340"
                    value={newTruckHp}
                    onChange={(ev) => setNewTruckHp(ev.target.value)}
                    disabled={!modelId}
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[10px] text-slate-500">รหัสเครื่อง</span>
                  <input
                    className={inputClassCompact}
                    placeholder="เช่น 4JA1, 6D16"
                    value={newEngineCode}
                    onChange={(ev) => setNewEngineCode(ev.target.value)}
                    disabled={!modelId}
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[10px] text-slate-500">alias ค้นหา</span>
                  <input
                    className={inputClassCompact}
                    placeholder="เช่น 4JA, 4JA-T, 4JA1"
                    value={newEngineCodeAliasesText}
                    onChange={(ev) => setNewEngineCodeAliasesText(ev.target.value)}
                    disabled={!modelId}
                  />
                  <span className="mt-0.5 block text-[9px] leading-snug text-slate-400">
                    คั่นหลายคำด้วย , หรือ |
                  </span>
                </label>
              </div>
            ) : (
              <EnginePowertrainFields
                powertrain={newEnginePowertrain}
                onPowertrainChange={setNewEnginePowertrain}
                engineName={newEngineName}
                onEngineNameChange={setNewEngineName}
                engineCode={newEngineCode}
                onEngineCodeChange={setNewEngineCode}
                engineCodeAliases={newEngineCodeAliasesText}
                onEngineCodeAliasesChange={setNewEngineCodeAliasesText}
                fuel={newEngineFuel}
                onFuelChange={setNewEngineFuel}
                motorKw={newMotorKw}
                onMotorKwChange={setNewMotorKw}
                batteryKwh={newBatteryKwh}
                onBatteryKwhChange={setNewBatteryKwh}
                disabled={!modelId}
              />
            )}
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {selectedEngineDef ? (
                <>
                  <button
                    type="button"
                    onClick={saveEditEngineDef}
                    disabled={!modelId || !canSaveEditEngine}
                    className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-medium text-sky-900 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    บันทึกการแก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEngineDefId(null)}
                    disabled={!modelId}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    เพิ่มรายการใหม่
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={clsx(addBtnClassCompact, 'min-w-[2.25rem]')}
                  onClick={addEngineDef}
                  disabled={!canSubmitNewEngine}
                  aria-label="เพิ่มระบบขับเคลื่อน"
                >
                  <Plus className="size-3.5" />
                </button>
              )}
            </div>
              </div>
            </div>
          </CatalogColumn>

          <CatalogColumn
            title={isTruckCategory ? '5. ไม่เก็บปี' : '5. โฉม & ช่วงปี'}
            subtitle={
              isTruckCategory ? 'รถบรรทุกใช้สเปกคอลัมน์ 4 เท่านั้น' : 'กรอกโฉม/ช่วงปี — สรุปด้านขวา'
            }
            widthClass="w-[11rem]"
          >
            <div className="flex min-h-[12rem] flex-1 flex-col gap-1">
              <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
            {!modelId || !selectedEngineDef ? (
              <p className="text-[11px] leading-snug text-slate-500">
                {isTruckCategory
                  ? 'เลือกรุ่นและสเปกจากคอลัมน์ 4 — ไม่ต้องกรอกปี'
                  : 'เลือกรุ่นและระบบขับเคลื่อนจากซ้าย — แล้วใส่ปี/โฉมที่นี่'}
              </p>
            ) : normalizeEngineDef(selectedEngineDef).line_kind === 'truck' ? (
              <div className="space-y-1">
                <div className="rounded border border-slate-100/90 bg-slate-50/80 px-1.5 py-1">
                  <p className="text-[10px] font-medium text-slate-700">
                    สเปกที่เลือก:{' '}
                    <span className="font-semibold">{formatEngineDisplayName(normalizeEngineDef(selectedEngineDef))}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">ไม่เก็บช่วงปี — รหัสผูกสินค้าอยู่สรุปด้านขวา</p>
                </div>
                <p className="text-[10px] leading-snug text-slate-500">
                  ถ้าต้องการหลายสเปก (คนละ EURO / ล้อ / HP) ให้เพิ่มแถวในคอลัมน์ 4 แยกกัน
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="rounded border border-slate-100/90 bg-slate-50/80 px-1.5 py-1">
                  <p className="text-[10px] font-medium text-slate-700">
                    ระบบที่เลือก:{' '}
                    <span className="font-semibold">{formatEngineDisplayName(normalizeEngineDef(selectedEngineDef))}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {powertrainLabel(normalizeEngineDef(selectedEngineDef).powertrain_type ?? 'ice')} ·{' '}
                    {selectedEngineDef.variants.length} ช่วงปี
                  </p>
                </div>
                <label className="block">
                  <span className="mb-0.5 block text-[9px] text-slate-500">โฉม (ไม่บังคับ)</span>
                  <input
                    className={inputClassCompact}
                    placeholder="เช่น FC"
                    value={variantDraftGenerationCode}
                    onChange={(ev) => setVariantDraftGenerationCode(ev.target.value)}
                  />
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <label className="block">
                    <span className="mb-0.5 block text-[9px] text-slate-500">ปีเริ่ม</span>
                    <input
                      type="number"
                      className={inputClassCompact}
                      min={1900}
                      max={OPEN_END_YEAR}
                      value={variantDraftYearFrom}
                      onChange={(ev) => setVariantDraftYearFrom(Number(ev.target.value))}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-0.5 block text-[9px] text-slate-500">ปีสิ้นสุด</span>
                    <input
                      type="number"
                      className={inputClassCompact}
                      min={0}
                      max={OPEN_END_YEAR}
                      value={variantDraftYearTo}
                      onChange={(ev) => setVariantDraftYearTo(Number(ev.target.value))}
                    />
                  </label>
                </div>
                <p className="text-[9px] text-slate-500">ใส่ปีสิ้นสุดเป็น 0 = ปัจจุบัน</p>
                <button
                  type="button"
                  onClick={submitVariantDraft}
                  className="flex w-full items-center justify-center gap-1 rounded border border-dashed border-sky-300/80 bg-sky-50/60 px-1.5 py-1 text-[10px] font-medium text-sky-900 hover:bg-sky-50"
                >
                  <Plus className="size-3.5" />
                  เพิ่มช่วงปีเข้ารายการ
                </button>
              </div>
            )}
              </div>
            </div>
          </CatalogColumn>
        </div>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-sm shadow-slate-200/30 sm:p-5">
          <div className="mb-3 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              สรุปข้อมูล ({selectedEngineDef?.variants.length ?? 0} รายการ)
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              {selectedEngineDef && normalizeEngineDef(selectedEngineDef).line_kind === 'truck'
                ? 'รายการด้านล่างคือรหัสผูกสินค้า (variant id) ต่อสเปก — ไม่ใช้ช่วงปี'
                : 'ข้อมูลด้านล่างเป็นสรุปรายการที่บันทึกไว้จากช่อง 5 เพื่อใช้ตรวจสอบความถูกต้อง'}
            </p>
          </div>
          {!modelId || !selectedEngineDef ? (
            <div className="flex min-h-[12rem] flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-500">
              {isTruckCategory
                ? 'เลือกรุ่นและสเปกจากแถบด้านบน — รถบรรทุกไม่ต้องกรอกช่องปี'
                : 'เลือกรุ่นและระบบขับเคลื่อนจากแถบด้านบน แล้วกรอกข้อมูลในช่อง 5'}
            </div>
          ) : (
            <>
              {variantOverlapPairs.length > 0 ? (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50/90 px-2.5 py-2 text-[11px] leading-snug text-amber-950">
                  <span className="font-medium">ช่วงปีทับกันภายใต้เครื่องนี้:</span> ตรวจสอบว่าตั้งใจแยกหลาย variant
                  หรือปรับปีให้ไม่ทับ — รหัสที่ทับกัน:{' '}
                  {variantOverlapPairs.map(([a, b], i) => (
                    <span key={`${a}-${b}-${i}`} className="font-mono text-[10px]">
                      {i > 0 ? ' · ' : ' '}
                      {a}↔{b}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
                {selectedEngineDef.variants.map((v) => {
                  const summaryLine = formatVariantSummaryLine(
                    summaryBrandName,
                    summaryModelName,
                    selectedEngineDef,
                    v,
                  )
                  const fullTitle = `${summaryLine} · ${v.id}`
                  return (
                    <article
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      onContextMenu={(ev) => {
                        if (normalizeEngineDef(selectedEngineDef).line_kind === 'truck') {
                          ev.preventDefault()
                          return
                        }
                        ev.preventDefault()
                        setSelectedVariantId(v.id)
                        setVariantContextMenu({ variantId: v.id, x: ev.clientX, y: ev.clientY })
                      }}
                      className={clsx(
                        'rounded-lg border bg-white px-2.5 py-1.5 shadow-sm',
                        selectedVariantId === v.id ? 'border-sky-300 ring-1 ring-sky-100' : 'border-slate-200',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="min-w-0 truncate text-[11px] text-slate-800" title={fullTitle}>
                          <span className="text-slate-800">{summaryLine}</span>
                          <span className="font-mono text-[10px] text-slate-500"> · {v.id}</span>
                        </p>
                      </div>
                    </article>
                  )
                })}
              </div>
              <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-600">
                {normalizeEngineDef(selectedEngineDef).line_kind === 'truck' ? (
                  <>
                    รหัสผูกสินค้า <span className="font-semibold text-slate-900">{selectedEngineDef.variants.length}</span>{' '}
                    รายการต่อสเปก{' '}
                    <span className="font-semibold text-slate-900">
                      {formatEngineDisplayName(normalizeEngineDef(selectedEngineDef))}
                    </span>{' '}
                    (ไม่ใช้ปี)
                  </>
                ) : (
                  <>
                    รวมทั้งหมด <span className="font-semibold text-slate-900">{selectedEngineDef.variants.length}</span>{' '}
                    ช่วงปี สำหรับ{' '}
                    <span className="font-semibold text-slate-900">
                      {formatEngineDisplayName(normalizeEngineDef(selectedEngineDef))}
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </main>
      {variantContextMenu && selectedEngineDef
        ? createPortal(
            <div
              className="fixed z-[120] min-w-[9.5rem] rounded-md border border-slate-200 bg-white p-1 shadow-lg"
              style={{
                left: Math.max(8, Math.min(variantContextMenu.x, window.innerWidth - 170)),
                top: Math.max(8, Math.min(variantContextMenu.y, window.innerHeight - 120)),
              }}
              onClick={(ev) => ev.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  const target = selectedEngineDef.variants.find((v) => v.id === variantContextMenu.variantId)
                  if (target) openVariantEditorDialog('edit', selectedEngineDef.id, target)
                  setVariantContextMenu(null)
                }}
                className="block w-full rounded px-2 py-1 text-left text-xs text-slate-700 hover:bg-slate-100"
              >
                แก้ไข
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedEngineDef.variants.find((v) => v.id === variantContextMenu.variantId)
                  if (target) openVariantEditorDialog('copy', selectedEngineDef.id, target)
                  setVariantContextMenu(null)
                }}
                className="block w-full rounded px-2 py-1 text-left text-xs text-slate-700 hover:bg-slate-100"
              >
                คัดลอก(F2)
              </button>
              <button
                type="button"
                onClick={() => {
                  removeVariant(selectedEngineDef.id, variantContextMenu.variantId)
                  setVariantContextMenu(null)
                }}
                className="block w-full rounded px-2 py-1 text-left text-xs text-rose-700 hover:bg-rose-50"
              >
                ลบรายการ
              </button>
            </div>,
            document.body,
          )
        : null}
      {variantEditorDialog
        ? createPortal(
            <div
              className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/40 p-4"
              onClick={() => setVariantEditorDialog(null)}
            >
              <div
                className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
                onClick={(ev) => ev.stopPropagation()}
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  {variantEditorDialog.mode === 'edit'
                    ? 'แก้ไขรายการ'
                    : 'คัดลอกรายการ (แก้ไขก่อนบันทึก)'}
                </h3>
                <div className="mt-3 space-y-2">
                  <label className="block">
                    <span className="mb-0.5 block text-xs text-slate-600">โฉม (ไม่บังคับ)</span>
                    <input
                      className={inputClassCompact}
                      value={variantEditorDialog.generationCode}
                      onChange={(ev) =>
                        setVariantEditorDialog((prev) =>
                          prev ? { ...prev, generationCode: ev.target.value } : prev,
                        )
                      }
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="mb-0.5 block text-xs text-slate-600">ปีเริ่ม</span>
                      <input
                        type="number"
                        className={inputClassCompact}
                        min={1900}
                        max={OPEN_END_YEAR}
                        value={variantEditorDialog.yearFrom}
                        onChange={(ev) =>
                          setVariantEditorDialog((prev) =>
                            prev ? { ...prev, yearFrom: Number(ev.target.value) } : prev,
                          )
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-0.5 block text-xs text-slate-600">ปีสิ้นสุด</span>
                      <input
                        type="number"
                        className={inputClassCompact}
                        min={0}
                        max={OPEN_END_YEAR}
                        value={variantEditorDialog.yearTo}
                        onChange={(ev) =>
                          setVariantEditorDialog((prev) =>
                            prev ? { ...prev, yearTo: Number(ev.target.value) } : prev,
                          )
                        }
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-500">ใส่ปีสิ้นสุดเป็น 0 = ปัจจุบัน</p>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setVariantEditorDialog(null)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={confirmVariantEditorDialog}
                    className="rounded-md border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
                  >
                    {variantEditorDialog.mode === 'edit' ? 'บันทึกการแก้ไข' : 'บันทึกการคัดลอก'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
      </div>
    </div>
  )
}

function CatalogColumn({
  title,
  subtitle,
  widthClass,
  children,
}: {
  title: string
  subtitle?: string
  widthClass: string
  children: ReactNode
}) {
  return (
    <div
      className={clsx(
        'flex min-h-0 shrink-0 flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/20',
        widthClass,
      )}
    >
      <div className="shrink-0 border-b border-slate-100/90 px-2 py-1">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 text-[9px] font-normal normal-case leading-snug text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-1.5 pb-1.5 pt-1">{children}</div>
    </div>
  )
}
