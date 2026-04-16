import type {
  VehicleCatalogState,
  VehicleEngineDef,
  VehicleFuelType,
  VehiclePowertrainType,
  VehicleVariant,
} from '@/features/vehicle/data/types'

/** คั่นช่วงปีสำหรับแสดงผล (en dash U+2013) */
const YEAR_RANGE_SEP = '–'

/** ช่องว่างไม่ให้ตัดคำระหว่างขนาดเครื่องกับเชื้อเพลิง (เช่น 1.6 เบนซิน อยู่บรรทัดเดียวกัน) */
const NBSP = '\u00A0'

export function fuelTypeLabelTh(fuel: VehicleFuelType | undefined | null): string {
  if (!fuel || fuel === 'unspecified') return ''
  switch (fuel) {
    case 'bensin':
      return 'เบนซิน'
    case 'diesel':
      return 'ดีเซล'
  }
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function normalizeTextOrNull(v: unknown): string | null {
  if (v == null) return null
  const t = String(v).trim()
  return t ? t : null
}

function normalizeStringList(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .map((item) => normalizeTextOrNull(item))
      .filter((item): item is string => Boolean(item))
  }
  if (typeof v === 'string') {
    return v
      .split(/[|,]/)
      .map((item) => normalizeTextOrNull(item))
      .filter((item): item is string => Boolean(item))
  }
  return []
}

function truckFieldsFromRecord(r: Record<string, unknown>) {
  const line_kind = r.line_kind === 'truck' ? ('truck' as const) : undefined
  const te = r.truck_euro
  const tw = r.truck_wheel_config
  const truck_euro =
    te == null || String(te).trim() === '' ? null : String(te).trim()
  const truck_wheel_config =
    tw == null || String(tw).trim() === '' ? null : String(tw).trim()
  const truck_hp = numOrNull(r.truck_hp)
  return { line_kind, truck_euro, truck_wheel_config, truck_hp }
}

/** แปลงจาก JSON เก่า (camelCase / name) หรือรูปแบบใหม่ — ออกเป็น VehicleEngineDef มาตรฐาน */
export function normalizeEngineDef(e: VehicleEngineDef | Record<string, unknown>): VehicleEngineDef {
  const r = e as Record<string, unknown>
  const id = String(r.id ?? '')
  const pt = (r.powertrain_type ?? r.powertrain ?? 'ice') as VehiclePowertrainType

  const rawSize = r.engine_size ?? r.name
  const engine_size = normalizeTextOrNull(rawSize)
  const engine_code = normalizeTextOrNull(r.engine_code ?? r.engineCode)
  const engine_code_aliases = normalizeStringList(r.engine_code_aliases ?? r.engineCodeAliases)

  const fr = r.fuel_type ?? r.fuelType
  let fuel_type: VehicleFuelType | null = null
  if (fr === 'diesel' || fr === 'bensin' || fr === 'unspecified') {
    fuel_type = fr
  }

  const motor_power = numOrNull(r.motor_power ?? r.motorPowerKw)
  const battery_capacity = numOrNull(r.battery_capacity ?? r.batteryKwh)

  const variants = (Array.isArray(r.variants) ? r.variants : []) as VehicleVariant[]
  const truck = truckFieldsFromRecord(r)

  if (pt === 'ev') {
    return {
      id,
      powertrain_type: 'ev',
      engine_size,
      engine_code,
      engine_code_aliases,
      fuel_type: null,
      motor_power,
      battery_capacity,
      variants,
      ...(truck.line_kind === 'truck' ? truck : {}),
    }
  }
  if (pt === 'ice') {
    return {
      id,
      powertrain_type: 'ice',
      engine_size,
      engine_code,
      engine_code_aliases,
      fuel_type: fuel_type ?? 'unspecified',
      motor_power: null,
      battery_capacity: null,
      variants,
      ...(truck.line_kind === 'truck' ? truck : {}),
    }
  }
  return {
    id,
    powertrain_type: pt,
    engine_size,
    engine_code,
    engine_code_aliases,
    fuel_type: fuel_type ?? 'unspecified',
    motor_power,
    battery_capacity,
    variants,
    ...(truck.line_kind === 'truck' ? truck : {}),
  }
}

export function formatEngineCodeSummary(engine: VehicleEngineDef): string {
  const e = normalizeEngineDef(engine)
  return e.engine_code?.trim() ?? ''
}

export function buildEngineSearchText(engine: VehicleEngineDef): string {
  const e = normalizeEngineDef(engine)
  return [
    formatEngineDisplayName(e),
    e.engine_size ?? '',
    e.engine_code ?? '',
    ...(e.engine_code_aliases ?? []),
    e.line_kind === 'truck' ? e.truck_euro ?? '' : '',
    e.line_kind === 'truck' ? e.truck_wheel_config ?? '' : '',
    e.line_kind === 'truck' && e.truck_hp != null ? String(e.truck_hp) : '',
  ]
    .filter(Boolean)
    .join(' ')
}

/** แถวสเปกรถบรรทุก (มี EURO / ล้อ / HP) */
export function isTruckEngineDef(engine: VehicleEngineDef): boolean {
  return normalizeEngineDef(engine).line_kind === 'truck'
}

function parseTruckHpInput(s: string): number | undefined {
  const t = s.trim()
  if (t === '') return undefined
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}

/**
 * สร้างแถวสเปกรถบรรทุก — ต้องมี EURO, จำนวนล้อ, และ HP
 * ถ้า variants ว่าง จะสร้าง variant เดียว (ใช้ fallbackVariantId) สำหรับผูกสินค้า โดยไม่ใช้ช่วงปีใน UI
 */
export function tryBuildTruckEngineDef(
  id: string,
  euro: string,
  wheels: string,
  hpStr: string,
  engineCode: string,
  engineCodeAliases: string[],
  variants: VehicleVariant[],
  fallbackVariantId: string,
): VehicleEngineDef | null {
  const euroT = euro.trim()
  const wheelsT = wheels.trim()
  const hp = parseTruckHpInput(hpStr)
  if (!euroT || !wheelsT || hp == null) return null

  const v: VehicleVariant[] =
    variants.length > 0
      ? variants
      : [{ id: fallbackVariantId, yearFrom: 1900, yearTo: OPEN_END_YEAR }]

  return normalizeEngineDef({
    id,
    line_kind: 'truck',
    powertrain_type: 'ice',
    engine_size: null,
    engine_code: normalizeTextOrNull(engineCode),
    engine_code_aliases: engineCodeAliases,
    fuel_type: 'diesel',
    motor_power: null,
    battery_capacity: null,
    truck_euro: euroT,
    truck_wheel_config: wheelsT,
    truck_hp: hp,
    variants: v,
  })
}

/** บรรทัดแสดงผลระบบขับเคลื่อน (ลิสต์ / ค้นหา / dropdown) */
export function formatEngineDisplayName(engine: VehicleEngineDef): string {
  const e = normalizeEngineDef(engine)
  const code = formatEngineCodeSummary(e)
  if (e.line_kind === 'truck') {
    const euro = e.truck_euro?.trim() ?? ''
    const wheels = e.truck_wheel_config?.trim() ?? ''
    const hp =
      e.truck_hp != null && Number.isFinite(e.truck_hp) ? `${Math.round(e.truck_hp)} HP` : ''
    const parts = [euro, wheels, hp, code].filter(Boolean)
    return parts.length ? parts.join(' · ') : 'รถบรรทุก'
  }
  const pt = e.powertrain_type
  const size = e.engine_size?.trim() ?? ''
  const fuel = fuelTypeLabelTh(e.fuel_type)

  const motorPart =
    e.motor_power != null && Number.isFinite(e.motor_power) ? `${e.motor_power} kW` : ''
  const batteryPart =
    e.battery_capacity != null && Number.isFinite(e.battery_capacity)
      ? `${e.battery_capacity} kWh`
      : ''

  if (pt === 'ev') {
    const parts = [size, motorPart, batteryPart].filter(Boolean)
    return parts.length ? parts.join(' · ') : 'EV'
  }

  const iceLine = (() => {
    if (!fuel) return size
    if (!size) return fuel
    return `${size}${NBSP}${fuel}`
  })()
  if (pt === 'ice') {
    return [iceLine, code].filter(Boolean).join(' · ') || '—'
  }

  const parts = [iceLine, motorPart, batteryPart, code].filter(Boolean)
  return parts.length ? parts.join(' · ') : size || '—'
}

/**
 * บรรทัดสรุปด้านล่างแบบจัดรูปตาม powertrain
 * ICE: AVEO — 1.6 เบนซิน (2020–ปัจจุบัน) [MC]
 * Hybrid: CAMRY — 2.5 + Motor (Hybrid) (ปี) [โฉม]
 * EV: TESLA — EV 75 kWh (ปี) [โฉม]
 */
export function formatVariantSummaryLine(
  brandName: string,
  modelName: string,
  engine: VehicleEngineDef,
  v: VehicleVariant,
): string {
  const e = normalizeEngineDef(engine)
  if (e.line_kind === 'truck') {
    const engineLine = formatEngineDisplayName(e)
    return `${modelName} — ${engineLine}`
  }
  const yearLabel = formatYearRangeLabel(v.yearFrom, v.yearTo)
  const gen = v.generationCode?.trim()
  const genPart = gen ? ` [${gen}]` : ''
  const size = e.engine_size?.trim() ?? ''
  const fuelTxt = fuelTypeLabelTh(e.fuel_type)
  const pt = e.powertrain_type
  const yearPart = ` (${yearLabel})`

  if (pt === 'ice') {
    let mid = '—'
    if (size && fuelTxt) mid = `${size}${NBSP}${fuelTxt}`
    else if (size) mid = size
    else if (fuelTxt) mid = fuelTxt
    return `${modelName} — ${mid}${yearPart}${genPart}`
  }

  if (pt === 'hev') {
    const core = size ? `${size}${NBSP}+ Motor (Hybrid)` : 'Motor (Hybrid)'
    return `${modelName} — ${core}${yearPart}${genPart}`
  }

  if (pt === 'phev') {
    const core = size ? `${size}${NBSP}+ Motor (Plug-in Hybrid)` : 'Motor (Plug-in Hybrid)'
    return `${modelName} — ${core}${yearPart}${genPart}`
  }

  if (pt === 'ev') {
    const bat = e.battery_capacity != null && Number.isFinite(e.battery_capacity) ? e.battery_capacity : null
    const mot = e.motor_power != null && Number.isFinite(e.motor_power) ? e.motor_power : null
    let spec = 'EV'
    if (bat != null) spec += ` ${bat} kWh`
    if (mot != null) spec += bat != null ? ` · ${mot} kW` : ` ${mot} kW`
    return `${brandName} — ${spec}${yearPart}${genPart}`
  }

  return `${modelName} — ${formatEngineDisplayName(e)}${yearPart}${genPart}`
}

/** แถวสำหรับ dropdown / ค้นหา — id = variant id (ผูกสินค้า) */
export type VehicleVariantOption = {
  id: string
  label: string
  fuelType: VehicleFuelType
  powertrain_type: VehiclePowertrainType
  engineSummary: string
  engineCode: string
  searchText: string
}

/** ค่าปลายช่วงแบบเปิด (ถึงปัจจุบัน) */
export const OPEN_END_YEAR = 2100

export function formatYearRangeLabel(yearFrom: number, yearTo: number): string {
  if (yearFrom === yearTo) return `${yearFrom}`
  if (yearTo >= OPEN_END_YEAR) return `${yearFrom}${YEAR_RANGE_SEP}ปัจจุบัน`
  return `${yearFrom}${YEAR_RANGE_SEP}${yearTo}`
}

export function formatVariantLabel(engine: VehicleEngineDef, v: VehicleVariant): string {
  const e = normalizeEngineDef(engine)
  if (e.line_kind === 'truck') {
    return formatEngineDisplayName(e)
  }
  const gen = v.generationCode?.trim()
  const genPart = gen ? `${gen} · ` : ''
  const engineLine = formatEngineDisplayName(engine)
  return `${engineLine} · ${genPart}${formatYearRangeLabel(v.yearFrom, v.yearTo)}`
}

/**
 * ข้อความสั้นในช่องเลือก variant (เช่น 1.6FD(2000-2012)) — ใช้คู่กับ label เต็มใน tooltip
 */
export function formatVariantFitPickerCompact(engine: VehicleEngineDef, v: VehicleVariant): string {
  const e = normalizeEngineDef(engine)
  if (e.line_kind === 'truck') {
    const line = formatEngineDisplayName(e).trim()
    return line ? line.replace(/\s*·\s*/g, ' ') : 'รถบรรทุก'
  }
  const size = e.engine_size?.trim() ?? ''
  const gen = v.generationCode?.trim() ?? ''
  let core = `${size}${gen}`
  if (!core.trim()) {
    const line = formatEngineDisplayName(e).trim()
    core = line ? line.replace(/\s*·\s*/g, ' ').replace(/\s+/g, '') : '—'
  }
  const yTo = v.yearTo >= OPEN_END_YEAR ? 'ปจบ.' : String(v.yearTo)
  return `${core}(${v.yearFrom}-${yTo})`
}

export function flattenVariantOptions(engines: VehicleEngineDef[]): VehicleVariantOption[] {
  const out: VehicleVariantOption[] = []
  const seenIds = new Set<string>()
  const seenFingerprints = new Set<string>()
  for (const eng of engines) {
    const engN = normalizeEngineDef(eng)
    for (const v of engN.variants) {
      const label = formatVariantLabel(engN, v)
      const engineSummary = formatEngineDisplayName(engN)
      const fingerprint = `${label}||${engineSummary}||${engN.powertrain_type ?? 'ice'}`
      if (seenIds.has(v.id) || seenFingerprints.has(fingerprint)) continue
      seenIds.add(v.id)
      seenFingerprints.add(fingerprint)
      out.push({
        id: v.id,
        label,
        fuelType: engN.fuel_type ?? 'unspecified',
        powertrain_type: engN.powertrain_type ?? 'ice',
        engineSummary,
        engineCode: formatEngineCodeSummary(engN),
        searchText: buildEngineSearchText(engN),
      })
    }
  }
  return out
}

export function findEngineDefForVariant(
  engines: VehicleEngineDef[],
  variantId: string,
): { engine: VehicleEngineDef; variant: VehicleVariant } | undefined {
  for (const engine of engines) {
    const variant = engine.variants.find((x) => x.id === variantId)
    if (variant) return { engine, variant }
  }
  return undefined
}

/** ตำแหน่ง variant ในแคตตาล็อก — ใช้ resolve engineId ตอน import CSV / Sheet */
export type CatalogVariantLocation = {
  categoryId: string
  categoryLabel: string
  brandId: string
  brandName: string
  modelId: string
  modelName: string
  engine: VehicleEngineDef
  variant: VehicleVariant
}

/** ค้นหา variant จากรหัส leaf ทั่วทุกประเภทในแคตตาล็อก */
export function findVariantInCatalog(
  catalog: VehicleCatalogState,
  variantId: string,
): CatalogVariantLocation | null {
  for (const cat of catalog.categories) {
    const data = catalog.byCategory[cat.id]
    if (!data) continue
    for (const brand of data.brands) {
      const models = data.modelsByBrandId[brand.id] ?? []
      for (const model of models) {
        const engines = data.enginesByModelId[model.id] ?? []
        const found = findEngineDefForVariant(engines, variantId)
        if (found) {
          return {
            categoryId: cat.id,
            categoryLabel: cat.label,
            brandId: brand.id,
            brandName: brand.name,
            modelId: model.id,
            modelName: model.name,
            engine: found.engine,
            variant: found.variant,
          }
        }
      }
    }
  }
  return null
}

/** แปลง label เดิม เช่น "1.5 Turbo (2020)" / "3.0 (2006-2011)" */
export function parseLegacyEngineLabel(label: string): { name: string; yearFrom: number; yearTo: number } {
  const m = label.match(/^(.+?)\s*\(\s*([^)]+)\s*\)\s*$/)
  if (!m) {
    const t = label.trim()
    return { name: t || '—', yearFrom: 2000, yearTo: 2099 }
  }
  const name = m[1].trim()
  const inner = m[2].trim()
  const range = inner.match(/^(\d{4})\s*[-–]\s*(\d{4})$/)
  if (range) {
    return {
      name,
      yearFrom: parseInt(range[1], 10),
      yearTo: parseInt(range[2], 10),
    }
  }
  const single = inner.match(/^(\d{4})$/)
  if (single) {
    const y = parseInt(single[1], 10)
    return { name, yearFrom: y, yearTo: y }
  }
  return { name, yearFrom: 2000, yearTo: 2099 }
}

type LegacyEngineRow = {
  id: string
  label: string
  fuelType?: VehicleFuelType
}

/** ข้อมูลเก่า { id, label, fuelType } → engine def + variant ต่อแถว (variant id = id เดิม) */
export function migrateLegacyEnginesToDefs(rows: unknown[]): VehicleEngineDef[] {
  if (!Array.isArray(rows) || rows.length === 0) return []
  const first = rows[0] as Record<string, unknown>
  if (
    first &&
    typeof first === 'object' &&
    Array.isArray((first as { variants?: unknown }).variants) &&
    !('label' in first)
  ) {
    return (rows as Record<string, unknown>[]).map((row) => normalizeEngineDef(row))
  }
  return (rows as LegacyEngineRow[]).map((e) => {
    const fuel: VehicleFuelType =
      e.fuelType === 'diesel' || e.fuelType === 'bensin' || e.fuelType === 'unspecified'
        ? e.fuelType
        : 'unspecified'
    const parsed = parseLegacyEngineLabel(e.label)
    return normalizeEngineDef({
      id: `${e.id}-def`,
      engine_size: parsed.name,
      powertrain_type: 'ice',
      fuel_type: fuel,
      motor_power: null,
      battery_capacity: null,
      variants: [
        {
          id: e.id,
          yearFrom: parsed.yearFrom,
          yearTo: parsed.yearTo,
        },
      ],
    })
  })
}
