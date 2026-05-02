import { newEntityId } from '@/features/vehicle/lib/newId'
import type {
  CategoryCatalog,
  VehicleCatalogState,
  VehicleEngineDef,
  VehicleModel,
} from '@/features/vehicle/data/types'
import type {
  ProductMasterDetail,
  VehicleFitmentRef,
} from '@/features/inventory/data/productMasterData'

/**
 * Default delimiters used to detect "compound" entries (multiple values mashed
 * into one record). Order matters: longer/escaped sequences first so we don't
 * accidentally match inside a longer separator.
 */
export const DEFAULT_SLASH_SPLIT_DELIMITERS: readonly string[] = [
  ' & ',
  ' + ',
  '/',
  '\\',
  '|',
  '；',
  ';',
  '，',
  ',',
]

/** ระดับของฟิลด์ที่จะ split — ใช้ใน UI เพื่อจัดกลุ่ม */
export type SplitFieldKind = 'model' | 'engine_code' | 'engine_size'

/** ข้อมูลตำแหน่งของฟิลด์ที่ต้อง split — ใช้ระบุตัวตนใน catalog */
export type SplitCandidateLocation = {
  categoryId: string
  categoryLabel: string
  brandId: string
  brandName: string
  /** model id เสมอ (สำหรับ engine fields ใช้ค้นหา engines ใต้ model นี้) */
  modelId: string
  modelName: string
  /** engine id (เฉพาะ engine_code/engine_size) */
  engineId?: string
}

/** 1 candidate = 1 record ที่มีตัวคั่น */
export type SplitCandidate = {
  /** key เฉพาะ — ใช้ใน UI key/checkbox state */
  key: string
  kind: SplitFieldKind
  location: SplitCandidateLocation
  /** ค่าตัวอักษรเดิม (ก่อน split) */
  originalText: string
  /** ผลลัพธ์ที่จะแยกเป็นหลายค่า (trim + de-dup แล้ว) */
  parts: string[]
  /** ตัวคั่นที่ตรวจเจอ (ตัวแรกที่ match) */
  delimiter: string
}

/** ผลการ scan ทั้ง catalog */
export type SplitScanResult = {
  candidates: SplitCandidate[]
  /** จำนวนสินค้า (master) ที่อ้างถึง engine ใน candidates นี้ — ใช้แสดงใน preview */
  productImpactByEngineId: Map<string, number>
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * แยก string ด้วย delimiters; ตัวคั่นแรกที่เจอ "ใน" ค่า text จะถูกเลือก
 * คืน { delimiter, parts } — ถ้าไม่เจอตัวคั่น คืน parts เป็นรายเดียว
 */
export function splitTextByDelimiters(
  text: string,
  delimiters: readonly string[] = DEFAULT_SLASH_SPLIT_DELIMITERS,
): { delimiter: string; parts: string[] } {
  const trimmed = text.trim()
  if (!trimmed) return { delimiter: '', parts: [] }
  for (const d of delimiters) {
    if (trimmed.includes(d)) {
      const parts = trimmed
        .split(d)
        .map((p) => p.trim())
        .filter(Boolean)
      const seen = new Set<string>()
      const dedup: string[] = []
      for (const p of parts) {
        const k = p.toLowerCase()
        if (seen.has(k)) continue
        seen.add(k)
        dedup.push(p)
      }
      if (dedup.length > 1) return { delimiter: d, parts: dedup }
      // delimiter present but only one non-empty part — treat as no split
      return { delimiter: '', parts: [trimmed] }
    }
  }
  return { delimiter: '', parts: [trimmed] }
}

// ────────────────────────────────────────────────────────────────────────────
// Scan
// ────────────────────────────────────────────────────────────────────────────

export function scanCatalogForSplitCandidates(
  catalog: VehicleCatalogState,
  products: ProductMasterDetail[] = [],
  delimiters: readonly string[] = DEFAULT_SLASH_SPLIT_DELIMITERS,
): SplitScanResult {
  const candidates: SplitCandidate[] = []
  const productImpactByEngineId = new Map<string, number>()

  for (const p of products) {
    for (const f of p.vehicleFitments ?? []) {
      productImpactByEngineId.set(
        f.engineId,
        (productImpactByEngineId.get(f.engineId) ?? 0) + 1,
      )
    }
  }

  for (const cat of catalog.categories) {
    const data = catalog.byCategory[cat.id]
    if (!data) continue
    for (const brand of data.brands) {
      const models = data.modelsByBrandId[brand.id] ?? []
      for (const model of models) {
        // 1) Model name
        const modelSplit = splitTextByDelimiters(model.name, delimiters)
        if (modelSplit.parts.length > 1) {
          candidates.push({
            key: `model:${model.id}`,
            kind: 'model',
            location: {
              categoryId: cat.id,
              categoryLabel: cat.label,
              brandId: brand.id,
              brandName: brand.name,
              modelId: model.id,
              modelName: model.name,
            },
            originalText: model.name,
            parts: modelSplit.parts,
            delimiter: modelSplit.delimiter,
          })
        }

        // 2) Engines (engine_code / engine_size)
        const engines = data.enginesByModelId[model.id] ?? []
        for (const eng of engines) {
          const code = eng.engine_code ?? ''
          if (code) {
            const codeSplit = splitTextByDelimiters(code, delimiters)
            if (codeSplit.parts.length > 1) {
              candidates.push({
                key: `engcode:${eng.id}`,
                kind: 'engine_code',
                location: {
                  categoryId: cat.id,
                  categoryLabel: cat.label,
                  brandId: brand.id,
                  brandName: brand.name,
                  modelId: model.id,
                  modelName: model.name,
                  engineId: eng.id,
                },
                originalText: code,
                parts: codeSplit.parts,
                delimiter: codeSplit.delimiter,
              })
            }
          }
          const size = eng.engine_size ?? ''
          if (size) {
            const sizeSplit = splitTextByDelimiters(size, delimiters)
            if (sizeSplit.parts.length > 1) {
              candidates.push({
                key: `engsize:${eng.id}`,
                kind: 'engine_size',
                location: {
                  categoryId: cat.id,
                  categoryLabel: cat.label,
                  brandId: brand.id,
                  brandName: brand.name,
                  modelId: model.id,
                  modelName: model.name,
                  engineId: eng.id,
                },
                originalText: size,
                parts: sizeSplit.parts,
                delimiter: sizeSplit.delimiter,
              })
            }
          }
        }
      }
    }
  }

  return { candidates, productImpactByEngineId }
}

// ────────────────────────────────────────────────────────────────────────────
// Apply (catalog mutation)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Map old → new ids ที่เกิดจากการ split
 *  - models: oldModelId → newModelId[]  (รวมตัวเดิมที่เปลี่ยนชื่อด้วย ถ้าตัวคั่นถูกเลือก)
 *  - engines: oldEngineId → newEngineId[]
 *  - variants: oldVariantId → newVariantId[]
 */
export type SplitApplyMaps = {
  modelIdMap: Map<string, string[]>
  engineIdMap: Map<string, string[]>
  variantIdMap: Map<string, string[]>
}

/**
 * Apply split decisions ลงใน catalog — คืน catalog ใหม่ + maps สำหรับ propagate ไปยังสินค้า
 *
 * ตรรกะ:
 *  - "model split" → keep model id เดิม แต่เปลี่ยน name เป็น part แรก, สร้าง model ใหม่สำหรับ part 2..N
 *    (duplicate engines + variants ทั้งหมดใต้ model นั้น)
 *  - "engine_code/engine_size split" → keep engine id เดิม เปลี่ยน text เป็น part แรก,
 *    duplicate engine สำหรับ part 2..N (variants duplicate ตาม)
 */
export function applySplitsToCatalog(
  catalog: VehicleCatalogState,
  selectedKeys: ReadonlySet<string>,
  scan: SplitScanResult,
): { catalog: VehicleCatalogState; maps: SplitApplyMaps } {
  const modelIdMap = new Map<string, string[]>()
  const engineIdMap = new Map<string, string[]>()
  const variantIdMap = new Map<string, string[]>()

  // index candidates by location for lookup during transform
  const modelSplitsById = new Map<string, SplitCandidate>()
  const engineCodeSplitsById = new Map<string, SplitCandidate>()
  const engineSizeSplitsById = new Map<string, SplitCandidate>()
  for (const c of scan.candidates) {
    if (!selectedKeys.has(c.key)) continue
    if (c.kind === 'model') modelSplitsById.set(c.location.modelId, c)
    if (c.kind === 'engine_code' && c.location.engineId)
      engineCodeSplitsById.set(c.location.engineId, c)
    if (c.kind === 'engine_size' && c.location.engineId)
      engineSizeSplitsById.set(c.location.engineId, c)
  }

  const nextByCategory: VehicleCatalogState['byCategory'] = {}

  for (const cat of catalog.categories) {
    const data = catalog.byCategory[cat.id]
    if (!data) continue
    const newData: CategoryCatalog = {
      brands: data.brands,
      modelsByBrandId: {},
      enginesByModelId: {},
    }

    for (const brand of data.brands) {
      const models = data.modelsByBrandId[brand.id] ?? []
      const newModels: VehicleModel[] = []

      for (const model of models) {
        const split = modelSplitsById.get(model.id)

        // engines under this model — split per engine first so duplicate models share split engines
        const baseEngines = data.enginesByModelId[model.id] ?? []
        const transformedEngines = baseEngines.flatMap((eng) =>
          splitEngine(eng, engineCodeSplitsById, engineSizeSplitsById, engineIdMap, variantIdMap),
        )

        if (!split) {
          newModels.push(model)
          newData.enginesByModelId[model.id] = transformedEngines
          continue
        }

        // model is being split: keep first part on original id, create new ids for rest
        const [firstPart, ...restParts] = split.parts
        const renamedFirst: VehicleModel = { id: model.id, name: firstPart ?? model.name }
        newModels.push(renamedFirst)
        const newIdsForOldModel: string[] = [model.id]
        // engines for original model id keep same array (already cloned objects)
        newData.enginesByModelId[model.id] = transformedEngines

        for (const part of restParts) {
          const newModelId = newEntityId('model')
          newModels.push({ id: newModelId, name: part })
          newIdsForOldModel.push(newModelId)
          // duplicate engines (and variants) under this new model id
          newData.enginesByModelId[newModelId] = duplicateEngineList(
            transformedEngines,
            engineIdMap,
            variantIdMap,
          )
        }
        modelIdMap.set(model.id, newIdsForOldModel)
      }

      newData.modelsByBrandId[brand.id] = newModels
    }

    nextByCategory[cat.id] = newData
  }

  return {
    catalog: { ...catalog, byCategory: nextByCategory },
    maps: { modelIdMap, engineIdMap, variantIdMap },
  }
}

function splitEngine(
  eng: VehicleEngineDef,
  engineCodeSplitsById: Map<string, SplitCandidate>,
  engineSizeSplitsById: Map<string, SplitCandidate>,
  engineIdMap: Map<string, string[]>,
  variantIdMap: Map<string, string[]>,
): VehicleEngineDef[] {
  const codeCand = engineCodeSplitsById.get(eng.id)
  const sizeCand = engineSizeSplitsById.get(eng.id)
  if (!codeCand && !sizeCand) {
    return [cloneEngine(eng, /* keepId */ true, variantIdMap)]
  }

  // build the matrix of values; if only one field is split, the other field
  // is replicated across each new engine.
  const codeParts = codeCand?.parts ?? [eng.engine_code ?? null]
  const sizeParts = sizeCand?.parts ?? [eng.engine_size ?? null]

  // pair them positionally if same length, otherwise cross-product is too much —
  // we mimic positional pairing & fall back to first part of the other field.
  const rows: { code: string | null; size: string | null }[] = []
  if (codeCand && sizeCand && codeParts.length === sizeParts.length) {
    for (let i = 0; i < codeParts.length; i++) {
      rows.push({ code: codeParts[i] ?? null, size: sizeParts[i] ?? null })
    }
  } else {
    const len = Math.max(codeParts.length, sizeParts.length)
    for (let i = 0; i < len; i++) {
      rows.push({
        code: codeParts[i] ?? codeParts[0] ?? null,
        size: sizeParts[i] ?? sizeParts[0] ?? null,
      })
    }
  }

  const result: VehicleEngineDef[] = []
  const newIds: string[] = []
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const isFirst = i === 0
    const targetId = isFirst ? eng.id : newEntityId('eng')
    newIds.push(targetId)
    const variants = eng.variants.map((v) => {
      const newVarId = isFirst ? v.id : newEntityId('var')
      if (!isFirst) {
        const arr = variantIdMap.get(v.id) ?? [v.id]
        if (!arr.includes(newVarId)) arr.push(newVarId)
        variantIdMap.set(v.id, arr)
      }
      return { ...v, id: newVarId }
    })
    result.push({
      ...eng,
      id: targetId,
      engine_code: r.code,
      engine_size: r.size,
      variants,
    })
  }
  engineIdMap.set(eng.id, newIds)
  return result
}

function cloneEngine(
  eng: VehicleEngineDef,
  keepId: boolean,
  variantIdMap: Map<string, string[]>,
): VehicleEngineDef {
  if (keepId) {
    return {
      ...eng,
      variants: eng.variants.map((v) => ({ ...v })),
    }
  }
  const newId = newEntityId('eng')
  const variants = eng.variants.map((v) => {
    const newVarId = newEntityId('var')
    const arr = variantIdMap.get(v.id) ?? [v.id]
    if (!arr.includes(newVarId)) arr.push(newVarId)
    variantIdMap.set(v.id, arr)
    return { ...v, id: newVarId }
  })
  return { ...eng, id: newId, variants }
}

function duplicateEngineList(
  engines: VehicleEngineDef[],
  engineIdMap: Map<string, string[]>,
  variantIdMap: Map<string, string[]>,
): VehicleEngineDef[] {
  return engines.map((eng) => {
    const newId = newEntityId('eng')
    const arr = engineIdMap.get(eng.id) ?? [eng.id]
    if (!arr.includes(newId)) arr.push(newId)
    engineIdMap.set(eng.id, arr)
    const variants = eng.variants.map((v) => {
      const newVarId = newEntityId('var')
      const varr = variantIdMap.get(v.id) ?? [v.id]
      if (!varr.includes(newVarId)) varr.push(newVarId)
      variantIdMap.set(v.id, varr)
      return { ...v, id: newVarId }
    })
    return { ...eng, id: newId, variants }
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Apply to product master vehicleFitments
// ────────────────────────────────────────────────────────────────────────────

/**
 * ขยาย vehicleFitments ของแต่ละสินค้าตาม splitMaps
 *  - ถ้า fitment.modelId อยู่ใน modelIdMap → แตกเป็น N fitments (1 ต่อ modelId ใหม่)
 *  - ถ้า fitment.engineId อยู่ใน engineIdMap → แตกเป็น N fitments
 *  - update brandName/modelName/engineLabel ให้ตรงกับชื่อใหม่จาก updatedCatalog
 */
export function applySplitMapToProducts(
  products: ProductMasterDetail[],
  catalogAfter: VehicleCatalogState,
  maps: SplitApplyMaps,
): ProductMasterDetail[] {
  if (maps.modelIdMap.size === 0 && maps.engineIdMap.size === 0) return products

  const modelById = new Map<string, { name: string; brandId: string; brandName: string; categoryId: string; categoryLabel: string }>()
  for (const cat of catalogAfter.categories) {
    const data = catalogAfter.byCategory[cat.id]
    if (!data) continue
    for (const brand of data.brands) {
      for (const model of data.modelsByBrandId[brand.id] ?? []) {
        modelById.set(model.id, {
          name: model.name,
          brandId: brand.id,
          brandName: brand.name,
          categoryId: cat.id,
          categoryLabel: cat.label,
        })
      }
    }
  }

  const engineById = new Map<string, { code: string | null; size: string | null }>()
  for (const cat of catalogAfter.categories) {
    const data = catalogAfter.byCategory[cat.id]
    if (!data) continue
    for (const modelId of Object.keys(data.enginesByModelId)) {
      for (const eng of data.enginesByModelId[modelId] ?? []) {
        engineById.set(eng.id, {
          code: eng.engine_code ?? null,
          size: eng.engine_size ?? null,
        })
      }
    }
  }

  return products.map((p) => {
    const fits = p.vehicleFitments ?? []
    if (fits.length === 0) return p

    const expanded: VehicleFitmentRef[] = []
    for (const f of fits) {
      const modelTargets = maps.modelIdMap.get(f.modelId) ?? [f.modelId]
      const engineTargets = maps.engineIdMap.get(f.engineId) ?? [f.engineId]

      // pair models × engines positionally; if engines were duplicated under
      // a new model, the engineIdMap already contains the cloned ids in order.
      // We do a positional zip when lengths match, otherwise cross-product.
      const pairs: { modelId: string; engineId: string }[] = []
      if (modelTargets.length === engineTargets.length && modelTargets.length > 1) {
        for (let i = 0; i < modelTargets.length; i++) {
          pairs.push({ modelId: modelTargets[i]!, engineId: engineTargets[i]! })
        }
      } else {
        for (const m of modelTargets) {
          for (const e of engineTargets) {
            pairs.push({ modelId: m, engineId: e })
          }
        }
      }

      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i]!
        const meta = modelById.get(pair.modelId)
        const eng = engineById.get(pair.engineId)
        const newId = i === 0 ? f.id : `${f.id}-s${i}`
        const newEngineLabel = eng
          ? [eng.code, eng.size].filter(Boolean).join(' ').trim() || f.engineLabel
          : f.engineLabel
        expanded.push({
          ...f,
          id: newId,
          modelId: pair.modelId,
          modelName: meta?.name ?? f.modelName,
          brandId: meta?.brandId ?? f.brandId,
          brandName: meta?.brandName ?? f.brandName,
          categoryId: meta?.categoryId ?? f.categoryId,
          categoryLabel: meta?.categoryLabel ?? f.categoryLabel,
          engineId: pair.engineId,
          engineLabel: newEngineLabel,
          engineCode: eng?.code ?? f.engineCode,
          engineText: eng?.code ?? eng?.size ?? f.engineText,
        })
      }
    }
    return { ...p, vehicleFitments: expanded }
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Backup / Restore
// ────────────────────────────────────────────────────────────────────────────

export type SplitBackup = {
  takenAt: string
  catalog: VehicleCatalogState
  products: ProductMasterDetail[]
}

export function buildSplitBackupJson(
  catalog: VehicleCatalogState,
  products: ProductMasterDetail[],
): string {
  const payload: SplitBackup = {
    takenAt: new Date().toISOString(),
    catalog,
    products,
  }
  return JSON.stringify(payload, null, 2)
}
