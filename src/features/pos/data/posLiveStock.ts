import { productHasSplitSaleRollColumnsTag } from '@/features/inventory/data/productTagsRegistry'
import { type InventoryProduct } from '@/features/inventory/data/mockInventory'
import { getPieceStockLegacyIdAliases, getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { getPosSellConfig, pickDefaultPosUnitAndPrice, type PosSellConfig } from '@/features/pos/data/posUnitPricing'

const LS_KEY = 'bento.pos.liveStock.v1'
/** bump เมื่อเปลี่ยน seed / ต้องการรีเซ็ตสต็อกม้วนจาก localStorage เก่า */
const ROLL_LS_KEY = 'bento.pos.rollStock.v2'
const BOX_PIECE_LS_KEY = 'bento.pos.boxPieceStock.v1'

const EPS = 1e-6

function newRollId(): string {
  return `roll-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function newFullRollId(): string {
  return `full-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** ม้วนเปิดหนึ่งม้วน (หลายม้วนได้ — FIFO ตามลำดับในอาร์เรย์) */
export type OpenRollPart = {
  id: string
  remainingKg: number
}

/** ม้วนเต็มหนึ่งม้วน — กก. ตามที่ชั่ง/ติดสติกเกอร์ (แต่ละม้วนไม่เท่ากัน) */
export type FullRollPart = {
  id: string
  kg: number
  /** วันที่รับของ YYYY-MM-DD — เรียง FIFO เก่าก่อน; ไม่ระบุ = ไปท้ายคิว */
  receivedDate?: string
}

export type RollStockState = {
  fullRolls: number
  openRolls: OpenRollPart[]
  /** ถ้ามีรายการ: รวมกก. จากผลรวมกก.แต่ละม้วน + เศษ — ไม่คูณ fullRolls×nominal */
  fullRollParts?: FullRollPart[]
}

function roundKg(n: number): number {
  return Math.round(n * 1000) / 1000
}

function parseOptionalISODate(s: unknown): string | undefined {
  if (typeof s !== 'string') return undefined
  const t = s.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return undefined
  return t
}

function normalizeFullRollPartsRaw(raw: unknown): FullRollPart[] {
  if (!Array.isArray(raw)) return []
  const out: FullRollPart[] = []
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    const kg = roundKg(Math.max(0, Number(o.kg) || 0))
    if (kg <= EPS) continue
    out.push({
      id: String(o.id || newFullRollId()),
      kg,
      receivedDate: parseOptionalISODate(o.receivedDate),
    })
  }
  return out
}

/** FIFO ม้วนเต็ม: วันที่เก่าก่อน แล้วตาม id */
export function sortFullRollPartsFifo(parts: FullRollPart[]): FullRollPart[] {
  return [...parts].sort((a, b) => {
    const da = a.receivedDate ?? '9999-12-31'
    const db = b.receivedDate ?? '9999-12-31'
    if (da !== db) return da.localeCompare(db)
    return a.id.localeCompare(b.id)
  })
}

/** มีรายการม้วนเต็มแบบจดทีละกก. (ดิบก่อน normalize) */
export function usesPerRollWeightTracking(r: RollStockState | undefined): boolean {
  return normalizeFullRollPartsRaw(r?.fullRollParts).length > 0
}

/** จำนวนม้วนเต็มบนชั้น — จากรายการกก. หรือจาก fullRolls แบบเดิม */
export function countFullRollsOnShelf(r: RollStockState): number {
  const norm = normalizeRollState(r)
  if (norm.fullRollParts && norm.fullRollParts.length > 0) return norm.fullRollParts.length
  return norm.fullRolls
}

function normalizeRollState(r: RollStockState): RollStockState {
  const openRolls = (r.openRolls ?? [])
    .map((x) => ({
      id: x.id || newRollId(),
      remainingKg: roundKg(Math.max(0, x.remainingKg)),
    }))
    .filter((x) => x.remainingKg > EPS)
  const fullRollParts = normalizeFullRollPartsRaw(r.fullRollParts)
  if (fullRollParts.length > 0) {
    return {
      fullRolls: 0,
      openRolls,
      fullRollParts,
    }
  }
  return {
    fullRolls: Math.max(0, Math.floor(r.fullRolls)),
    openRolls,
  }
}

/** แปลง JSON เก่า { fullRolls, openKg } → v2 + fullRollParts */
function migrateLegacyRollEntry(v: unknown): RollStockState | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const fullRollParts = normalizeFullRollPartsRaw(o.fullRollParts)
  if (Array.isArray(o.openRolls)) {
    const openRolls = (o.openRolls as OpenRollPart[])
      .filter((x) => x && typeof x.remainingKg === 'number')
      .map((x) => ({ id: String(x.id || newRollId()), remainingKg: roundKg(x.remainingKg) }))
      .filter((x) => x.remainingKg > EPS)
    return normalizeRollState({
      fullRolls: Math.max(0, Math.floor(Number(o.fullRolls) || 0)),
      openRolls,
      ...(fullRollParts.length > 0 ? { fullRollParts } : {}),
    })
  }
  if ('fullRolls' in o && 'openKg' in o) {
    const fullRolls = Math.max(0, Math.floor(Number(o.fullRolls) || 0))
    const openKg = Math.max(0, Number(o.openKg) || 0)
    const openRolls =
      openKg > EPS ? [{ id: 'migrated-open', remainingKg: roundKg(openKg) }] : []
    return normalizeRollState({
      fullRolls,
      openRolls,
      ...(fullRollParts.length > 0 ? { fullRollParts } : {}),
    })
  }
  return null
}

function seedFromProductRollSeed(p: InventoryProduct): RollStockState | null {
  if ((p.stockMode !== 'kg_roll' && p.stockMode !== 'meter_roll') || !p.rollStockSeed) return null
  const s = p.rollStockSeed
  const seedParts = normalizeFullRollPartsRaw(s.fullRollParts)
  if (seedParts.length > 0) {
    let openRolls: OpenRollPart[] = []
    if (s.openRolls && s.openRolls.length > 0) {
      openRolls = s.openRolls.map((x) => ({
        id: x.id || newRollId(),
        remainingKg: roundKg(x.remainingKg),
      }))
    } else {
      const openKg = s.openKg ?? 0
      if (openKg > EPS) openRolls = [{ id: 'seed-open', remainingKg: roundKg(openKg) }]
    }
    return normalizeRollState({ fullRolls: 0, fullRollParts: seedParts, openRolls })
  }
  if (s.openRolls && s.openRolls.length > 0) {
    return normalizeRollState({
      fullRolls: s.fullRolls,
      openRolls: s.openRolls.map((x) => ({
        id: x.id || newRollId(),
        remainingKg: roundKg(x.remainingKg),
      })),
    })
  }
  const openKg = s.openKg ?? 0
  const openRolls =
    openKg > EPS ? [{ id: 'seed-open', remainingKg: roundKg(openKg) }] : []
  return normalizeRollState({ fullRolls: s.fullRolls, openRolls })
}

/**
 * สินค้าที่ POS ดึงสต็อกจากชั้นม้วน — แต่ถ้ายังไม่เคยบันทึก roll ในเครื่อง จะ bootstrap จาก stock ในแคตตาล็อก
 */
function usesRollShelfForCatalogBootstrap(p: InventoryProduct): boolean {
  if (p.stockMode === 'box_piece' && p.piecesPerBox != null && p.piecesPerBox > 0) return false
  if (p.stockMode === 'kg_roll' && p.nominalKgPerRoll != null && p.nominalKgPerRoll > 0) return true
  if (p.stockMode === 'meter_roll' && p.nominalMetersPerRoll != null && p.nominalMetersPerRoll > 0)
    return true
  return productHasSplitSaleRollColumnsTag(p)
}

function seedRollStock(): Record<string, RollStockState> {
  const o: Record<string, RollStockState> = {}
  for (const p of getPosCatalogProducts()) {
    const st = seedFromProductRollSeed(p)
    if (st) o[p.id] = st
  }
  return o
}

function seedStock(): Record<string, number> {
  return Object.fromEntries(
    getPosCatalogProducts()
      .filter((p) => p.stockMode !== 'kg_roll' && p.stockMode !== 'meter_roll' && p.stockMode !== 'box_piece')
      .map((p) => [p.id, p.stock]),
  )
}

function mergeLegacyPieceStockKeys(parsed: Record<string, number>): { next: Record<string, number>; changed: boolean } {
  const aliases = getPieceStockLegacyIdAliases()
  const next = { ...parsed }
  let changed = false
  for (const [legacy, canonical] of Object.entries(aliases)) {
    if (!(legacy in next)) continue
    const v = next[legacy] ?? 0
    delete next[legacy]
    changed = true
    if (v !== 0) {
      next[canonical] = (next[canonical] ?? 0) + v
    }
  }
  return { next, changed }
}

/** โหลดสต็อก POS (แยกจาก mock ต้นฉบับ — ตัดเมื่อขายจริง) */
export function loadLiveStock(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    const base = seedStock()
    if (!raw) {
      saveLiveStock(base)
      return { ...base }
    }
    const parsed = JSON.parse(raw) as Record<string, number>
    const { next: migrated, changed } = mergeLegacyPieceStockKeys(parsed)
    const merged = { ...base, ...migrated }
    if (changed) {
      saveLiveStock(merged)
    }
    return { ...merged }
  } catch {
    return seedStock()
  }
}

export function saveLiveStock(stock: Record<string, number>): void {
  localStorage.setItem(LS_KEY, JSON.stringify(stock))
}

/** สต็อกแบบม้วน (สายยาง) — v2: หลายม้วนเปิด */
export function loadRollStock(): Record<string, RollStockState> {
  try {
    const raw = localStorage.getItem(ROLL_LS_KEY)
    const base = seedRollStock()
    if (!raw) {
      saveRollStock(base)
      return { ...base }
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const merged: Record<string, RollStockState> = { ...base }
    for (const [k, v] of Object.entries(parsed)) {
      const migrated = migrateLegacyRollEntry(v)
      if (migrated) merged[k] = normalizeRollState(migrated)
    }
    return merged
  } catch {
    return seedRollStock()
  }
}

export function saveRollStock(stock: Record<string, RollStockState>): void {
  const out: Record<string, RollStockState> = {}
  for (const [k, v] of Object.entries(stock)) {
    out[k] = normalizeRollState(v)
  }
  localStorage.setItem(ROLL_LS_KEY, JSON.stringify(out))
}

/** น้ำหนักรวม (กก.) = ผลรวมม้วนเปิด + ม้วนเต็ม (ผลรวมกก.แต่ละม้วน หรือ fullRolls×nominal) */
export function totalKgFromRoll(roll: RollStockState, nominalKgPerRoll: number): number {
  const norm = normalizeRollState(roll)
  const openSum = norm.openRolls.reduce((s, r) => s + r.remainingKg, 0)
  let fullKg = 0
  if (norm.fullRollParts && norm.fullRollParts.length > 0) {
    fullKg = norm.fullRollParts.reduce((s, x) => s + x.kg, 0)
  } else {
    const n = Math.max(0, nominalKgPerRoll)
    fullKg = norm.fullRolls * n
  }
  return roundKg(openSum + fullKg)
}

export function getRollStateForProduct(
  product: InventoryProduct,
  rollById: Record<string, RollStockState>,
): RollStockState {
  const seeded = seedFromProductRollSeed(product)
  if (seeded) {
    return normalizeRollState(rollById[product.id] ?? seeded)
  }
  const saved = rollById[product.id]
  if (saved !== undefined) {
    return normalizeRollState(saved)
  }
  /** ยังไม่มีคีย์ใน localStorage — ใช้ยอด stock จากแคตตาล็อก (รวมข้ามคลัง / mock) เป็นเศษรวมบนม้วนเปิด */
  if (usesRollShelfForCatalogBootstrap(product)) {
    const catalogQty = Math.max(0, Number(product.stock) || 0)
    if (catalogQty > EPS) {
      return normalizeRollState({
        fullRolls: 0,
        openRolls: [{ id: newRollId(), remainingKg: roundKg(catalogQty) }],
      })
    }
  }
  return normalizeRollState({ fullRolls: 0, openRolls: [] })
}

export type RollStockHintUnit = 'kg' | 'm'

/** แสดงสั้นๆ — หลายม้วนเศษ (ค่าใน state เป็นกก. หรือเมตร ตามโหมดสินค้า) */
export function formatRollStockHint(
  roll: RollStockState,
  nominalPerFullRoll: number,
  unit: RollStockHintUnit = 'kg',
): string {
  const u = unit === 'kg' ? 'กก.' : 'ม.'
  const norm = normalizeRollState(roll)
  const n = norm.openRolls.length
  const parts = norm.openRolls.map((r) => r.remainingKg.toFixed(2)).join(', ')
  const openLabel =
    n === 0
      ? 'ไม่มีม้วนเปิด'
      : n === 1
        ? `เปิด 1 ม้วน (${parts} ${u})`
        : `เปิด ${n} ม้วน (${parts} ${u})`
  const nFull = countFullRollsOnShelf(norm)
  return `${nFull} ม้วนเต็ม · ${openLabel} (รวม ~${totalKgFromRoll(roll, nominalPerFullRoll)} ${u})`
}

/** รวมสต็อกที่แสดงในตารางคลัง — piece จาก liveStock · kg_roll กก. · box_piece รวมตัว */
export function mergeInventoryProductsWithLiveStock(products: InventoryProduct[]): InventoryProduct[] {
  const piece = loadLiveStock()
  const roll = loadRollStock()
  const boxMap = loadBoxPieceStock()
  return products.map((p) => {
    if (p.stockMode === 'kg_roll' && p.nominalKgPerRoll) {
      const r = getRollStateForProduct(p, roll)
      return { ...p, stock: totalKgFromRoll(r, p.nominalKgPerRoll) }
    }
    if (p.stockMode === 'meter_roll' && p.nominalMetersPerRoll) {
      const r = getRollStateForProduct(p, roll)
      return { ...p, stock: totalKgFromRoll(r, p.nominalMetersPerRoll) }
    }
    if (productHasSplitSaleRollColumnsTag(p)) {
      const r = getRollStateForProduct(p, roll)
      /** ม้วนเต็มแบบนับม้วนอย่างเดียว (ไม่มีกก./ม้วนในมาสเตอร์) ไม่รวมในกก. รวม — นับแค่เศษบนม้วนเปิด */
      return { ...p, stock: totalKgFromRoll(r, 0) }
    }
    if (isBoxPieceProduct(p)) {
      const b = getBoxPieceStateForProduct(p, boxMap)
      return { ...p, stock: totalPiecesFromBoxPiece(b, p.piecesPerBox!) }
    }
    return { ...p, stock: piece[p.id] ?? p.stock }
  })
}

// ——— กล่อง + เศษตัว (น็อต — ขายชิ้น, POS แกะกล่องอัตโนมัติเมื่อเศษไม่พอ) ———

export type BoxPieceStockState = {
  fullBoxes: number
  loosePieces: number
}

export function isBoxPieceProduct(p: InventoryProduct): boolean {
  return p.stockMode === 'box_piece' && p.piecesPerBox != null && p.piecesPerBox > 0
}

/** POS / คลังม้วน — สินค้า kg_roll / meter_roll ตามมาสเตอร์ หรือแท็กม้วนแบ่งขาย (เช่น สายยางอ่อน) */
export function posProductUsesRollShelfStock(p: InventoryProduct): boolean {
  if (isBoxPieceProduct(p)) return false
  if (p.stockMode === 'kg_roll' && p.nominalKgPerRoll != null && p.nominalKgPerRoll > 0) return true
  if (p.stockMode === 'meter_roll' && p.nominalMetersPerRoll != null && p.nominalMetersPerRoll > 0) return true
  return productHasSplitSaleRollColumnsTag(p)
}

/** กก./ม้วนแบบนับจำนวนในมาสเตอร์ — 0 ถ้าไม่มี (รวมกก. จาก fullRollParts + เศษ ยังใช้ได้) */
export function posRollNominalKgForProduct(p: InventoryProduct): number {
  const n = p.nominalKgPerRoll
  return n != null && n > 0 ? n : 0
}

/** กก. หรือ เมตร ต่อม้วนเต็ม (ตาม stockMode) — ใช้กับ deductRollKg / totalKgFromRoll */
export function posRollNominalForProduct(p: InventoryProduct): number {
  if (p.stockMode === 'meter_roll') {
    const m = p.nominalMetersPerRoll
    return m != null && m > 0 ? m : 0
  }
  return posRollNominalKgForProduct(p)
}

function normalizeBoxPieceState(b: BoxPieceStockState): BoxPieceStockState {
  return {
    fullBoxes: Math.max(0, Math.floor(b.fullBoxes)),
    loosePieces: Math.max(0, Math.floor(b.loosePieces)),
  }
}

function seedBoxPieceStock(): Record<string, BoxPieceStockState> {
  const o: Record<string, BoxPieceStockState> = {}
  for (const p of getPosCatalogProducts()) {
    if (!isBoxPieceProduct(p)) continue
    /** เริ่มต้น: ยอดในแคตตาล็อกเป็นตัวทั้งหมดในเศษ (ผู้ใช้แยกกล่องในโมดัลปรับสต็อก) */
    o[p.id] = normalizeBoxPieceState({ fullBoxes: 0, loosePieces: Math.max(0, Math.floor(p.stock)) })
  }
  return o
}

export function loadBoxPieceStock(): Record<string, BoxPieceStockState> {
  try {
    const raw = localStorage.getItem(BOX_PIECE_LS_KEY)
    const base = seedBoxPieceStock()
    if (!raw) {
      saveBoxPieceStock(base)
      return { ...base }
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const merged: Record<string, BoxPieceStockState> = { ...base }
    for (const [k, v] of Object.entries(parsed)) {
      if (!v || typeof v !== 'object') continue
      const o = v as Record<string, unknown>
      const fullBoxes = Math.max(0, Math.floor(Number(o.fullBoxes) || 0))
      const loosePieces = Math.max(0, Math.floor(Number(o.loosePieces) || 0))
      merged[k] = normalizeBoxPieceState({ fullBoxes, loosePieces })
    }
    return merged
  } catch {
    return seedBoxPieceStock()
  }
}

export function saveBoxPieceStock(stock: Record<string, BoxPieceStockState>): void {
  const out: Record<string, BoxPieceStockState> = {}
  for (const [k, v] of Object.entries(stock)) {
    out[k] = normalizeBoxPieceState(v)
  }
  localStorage.setItem(BOX_PIECE_LS_KEY, JSON.stringify(out))
}

export function getBoxPieceStateForProduct(
  product: InventoryProduct,
  byId: Record<string, BoxPieceStockState>,
): BoxPieceStockState {
  const base = seedBoxPieceStock()[product.id] ?? { fullBoxes: 0, loosePieces: 0 }
  return normalizeBoxPieceState(byId[product.id] ?? base)
}

export function totalPiecesFromBoxPiece(b: BoxPieceStockState, piecesPerBox: number): number {
  const per = Math.max(1, Math.floor(piecesPerBox))
  return b.fullBoxes * per + b.loosePieces
}

export function formatBoxPieceHint(b: BoxPieceStockState, piecesPerBox: number): string {
  const per = Math.max(1, Math.floor(piecesPerBox))
  const total = totalPiecesFromBoxPiece(b, per)
  return `${b.fullBoxes} กล่อง · เศษ ${b.loosePieces} ตัว · รวม ${total} ตัว (${per} ต./กล่อง)`
}

/**
 * หักชิ้น — ใช้เศษก่อน แล้วแกะกล่องเต็มอัตโนมัติ (ลดกล่อง + เพิ่มเศษต่อกล่อง) จนพอขาย
 */
export function deductBoxPieces(
  state: Record<string, BoxPieceStockState>,
  productId: string,
  qty: number,
  piecesPerBox: number,
): Record<string, BoxPieceStockState> {
  if (qty <= 0) return state
  const per = Math.max(1, Math.floor(piecesPerBox))
  const cur0 = normalizeBoxPieceState(state[productId] ?? { fullBoxes: 0, loosePieces: 0 })
  let need = Math.floor(qty)
  let loose = cur0.loosePieces
  let full = cur0.fullBoxes
  const totalAvail = loose + full * per
  if (totalAvail < need) {
    throw new Error(`สต็อกไม่พอ (ตัว): ${productId}`)
  }
  const takeLoose = Math.min(loose, need)
  loose -= takeLoose
  need -= takeLoose
  while (need > 0) {
    if (full < 1) throw new Error(`สต็อกไม่พอ (ตัว): ${productId}`)
    full -= 1
    loose += per
    const t = Math.min(loose, need)
    loose -= t
    need -= t
  }
  return { ...state, [productId]: normalizeBoxPieceState({ fullBoxes: full, loosePieces: loose }) }
}

/** เปิดกล่องปิด 1 กล่อง → เพิ่มเศษ (+ชิ้นต่อกล่อง) — ใช้หน้าแบ่งขาย / คลัง */
export function openFullBoxToLoosePieces(productId: string, piecesPerBox: number): void {
  const per = Math.max(1, Math.floor(piecesPerBox))
  const map = loadBoxPieceStock()
  const cur = normalizeBoxPieceState(map[productId] ?? { fullBoxes: 0, loosePieces: 0 })
  if (cur.fullBoxes < 1) {
    throw new Error('no-full-box')
  }
  saveBoxPieceStock({
    ...map,
    [productId]: normalizeBoxPieceState({
      fullBoxes: cur.fullBoxes - 1,
      loosePieces: cur.loosePieces + per,
    }),
  })
  notifyLiveStockChanged()
}

export function setBoxPieceStock(productId: string, fullBoxes: number, loosePieces: number): void {
  const map = loadBoxPieceStock()
  saveBoxPieceStock({
    ...map,
    [productId]: normalizeBoxPieceState({ fullBoxes, loosePieces }),
  })
  notifyLiveStockChanged()
}

/** รับเข้าเป็นชิ้น (รวมกล่องปิด +เศษ — คำนวณ full/loose ใหม่) */
export function addPiecesToBoxPieceProduct(productId: string, piecesPerBox: number, addPieces: number): void {
  const per = Math.max(1, Math.floor(piecesPerBox))
  const add = Math.max(0, Math.floor(addPieces))
  if (add <= 0) return
  const map = loadBoxPieceStock()
  const cur = normalizeBoxPieceState(map[productId] ?? { fullBoxes: 0, loosePieces: 0 })
  const total = cur.fullBoxes * per + cur.loosePieces + add
  const fullBoxes = Math.floor(total / per)
  const loosePieces = total % per
  saveBoxPieceStock({
    ...map,
    [productId]: normalizeBoxPieceState({ fullBoxes, loosePieces }),
  })
  notifyLiveStockChanged()
}

/** ตัดสต็อกหลังขายสำเร็จ — throw ถ้าไม่พอ */
export function deductStock(
  stock: Record<string, number>,
  deductions: { productId: string; qty: number }[],
): Record<string, number> {
  const next = { ...stock }
  for (const { productId, qty } of deductions) {
    if (qty <= 0) continue
    const have = next[productId] ?? 0
    if (have < qty) {
      throw new Error(`สต็อกไม่พอ: ${productId}`)
    }
    next[productId] = have - qty
  }
  return next
}

/** เพิ่มสต็อก (เช่น ผลิตประกอบเข้าคลัง / รับเข้า) */
export function addStock(
  stock: Record<string, number>,
  additions: { productId: string; qty: number }[],
): Record<string, number> {
  const next = { ...stock }
  for (const { productId, qty } of additions) {
    if (qty <= 0) continue
    const have = next[productId] ?? 0
    next[productId] = have + qty
  }
  return next
}

/**
 * ขายตัดเป็นกก. — FIFO จากม้วนเปิด แล้วเปิดม้วนเต็ม (แบบรายม้วนกก. หรือ nominal)
 */
export function deductRollKg(
  state: Record<string, RollStockState>,
  productId: string,
  soldKg: number,
  nominalKgPerRoll: number,
): Record<string, RollStockState> {
  if (soldKg <= EPS) return state
  const cur0 = normalizeRollState(state[productId] ?? { fullRolls: 0, openRolls: [] })
  let remaining = roundKg(soldKg)
  let fullRolls = cur0.fullRolls
  let fullRollParts = cur0.fullRollParts ? [...cur0.fullRollParts] : undefined
  const openRolls = cur0.openRolls.map((r) => ({ ...r }))

  while (remaining > EPS && openRolls.length > 0) {
    const first = openRolls[0]
    const take = Math.min(remaining, first.remainingKg)
    first.remainingKg = roundKg(first.remainingKg - take)
    remaining = roundKg(remaining - take)
    if (first.remainingKg <= EPS) openRolls.shift()
  }

  const nominal = Math.max(0.001, nominalKgPerRoll)
  while (remaining > EPS) {
    const sorted =
      fullRollParts && fullRollParts.length > 0 ? sortFullRollPartsFifo(fullRollParts) : []
    if (sorted.length > 0) {
      const first = sorted[0]
      const w = roundKg(first.kg)
      if (w <= EPS) {
        fullRollParts = sorted.slice(1)
        continue
      }
      const take = Math.min(remaining, w)
      const restKg = roundKg(w - take)
      remaining = roundKg(remaining - take)
      fullRollParts = sorted.slice(1)
      if (restKg > EPS) {
        openRolls.push({ id: newRollId(), remainingKg: restKg })
      }
      continue
    }
    if (fullRolls <= 0) {
      throw new Error(`สต็อกไม่พอ (กก.): ${productId}`)
    }
    fullRolls -= 1
    let w = nominal
    const take = Math.min(remaining, w)
    w = roundKg(w - take)
    remaining = roundKg(remaining - take)
    if (w > EPS) {
      openRolls.push({ id: newRollId(), remainingKg: w })
    }
  }

  const next: RollStockState = { fullRolls, openRolls }
  if (fullRollParts && fullRollParts.length > 0) {
    next.fullRollParts = fullRollParts
  }
  return { ...state, [productId]: normalizeRollState(next) }
}

/** เปิดม้วนเต็ม 1 ม้วน (FIFO ตามวันที่) → ม้วนเปิด — กก. ตามม้วนนั้นหรือ nominal */
export function openFullRollAsNewPartial(
  state: Record<string, RollStockState>,
  productId: string,
  nominalKgPerRoll: number,
): Record<string, RollStockState> {
  const cur = normalizeRollState(state[productId] ?? { fullRolls: 0, openRolls: [] })
  const parts = cur.fullRollParts ? sortFullRollPartsFifo(cur.fullRollParts) : []
  if (parts.length > 0) {
    const [first, ...rest] = parts
    return {
      ...state,
      [productId]: normalizeRollState({
        fullRolls: 0,
        fullRollParts: rest,
        openRolls: [...cur.openRolls, { id: newRollId(), remainingKg: roundKg(first.kg) }],
      }),
    }
  }
  if (cur.fullRolls < 1) {
    throw new Error(`ม้วนเต็มไม่พอ: ${productId}`)
  }
  const nominal = Math.max(0.001, nominalKgPerRoll)
  return {
    ...state,
    [productId]: normalizeRollState({
      fullRolls: cur.fullRolls - 1,
      openRolls: [...cur.openRolls, { id: newRollId(), remainingKg: roundKg(nominal) }],
    }),
  }
}

/** ขายยกม้วนเต็ม — หักจำนวนม้วน FIFO (รายกก. หรือ fullRolls) */
export function deductFullRolls(
  state: Record<string, RollStockState>,
  productId: string,
  rolls: number,
): Record<string, RollStockState> {
  if (rolls <= 0) return state
  const cur = normalizeRollState(state[productId] ?? { fullRolls: 0, openRolls: [] })
  const need = Math.floor(rolls)
  const sorted = cur.fullRollParts ? sortFullRollPartsFifo(cur.fullRollParts) : []
  if (sorted.length > 0) {
    if (sorted.length < need) {
      throw new Error(`ม้วนเต็มไม่พอ: ${productId}`)
    }
    return {
      ...state,
      [productId]: normalizeRollState({
        fullRolls: 0,
        fullRollParts: sorted.slice(need),
        openRolls: cur.openRolls,
      }),
    }
  }
  if (cur.fullRolls < need) {
    throw new Error(`ม้วนเต็มไม่พอ: ${productId}`)
  }
  return {
    ...state,
    [productId]: normalizeRollState({
      fullRolls: cur.fullRolls - need,
      openRolls: cur.openRolls,
    }),
  }
}

/** แจ้ง POS / ตารางคลังให้โหลดสต็อกจาก localStorage ใหม่ */
export const LIVE_STOCK_CHANGED_EVENT = 'bento-live-stock-changed'

export function notifyLiveStockChanged() {
  window.dispatchEvent(new CustomEvent(LIVE_STOCK_CHANGED_EVENT))
}

/** บันทึกสถานะม้วนทั้งก้อนสำหรับ SKU (หน้าปรับสต็อกแบบจดทีละม้วน) */
export function setRollStockStateForProduct(productId: string, next: RollStockState): void {
  const map = loadRollStock()
  saveRollStock({
    ...map,
    [productId]: normalizeRollState(next),
  })
  notifyLiveStockChanged()
}

/**
 * เพิ่มม้วนเต็มแบบมีกก.+วันที่รับ (FIFO)
 * ถ้ายังเป็นแค่ fullRolls ไม่มีรายการกก. — แปลงม้วนเดิมทั้งหมดเป็นม้วนละกก. ด้วยค่าที่ส่งมาก่อนเพิ่มม้วนใหม่
 */
export function appendFullRollPartsForProduct(
  productId: string,
  addCount: number,
  kgPerRoll: number,
  receivedDateInput: string,
): void {
  const kg = roundKg(Math.max(0, kgPerRoll))
  if (kg <= EPS) {
    throw new Error('invalid-kg')
  }
  const receivedDate = parseOptionalISODate(receivedDateInput.trim()) ?? undefined
  const map = loadRollStock()
  const cur0 = map[productId] ?? { fullRolls: 0, openRolls: [] }
  const cur = normalizeRollState(cur0)

  let parts: FullRollPart[] = []
  if (cur.fullRollParts && cur.fullRollParts.length > 0) {
    parts = sortFullRollPartsFifo([...cur.fullRollParts])
  } else if (cur.fullRolls > 0) {
    const legacy = Math.max(0, Math.floor(cur.fullRolls))
    for (let i = 0; i < legacy; i++) {
      parts.push({ id: newFullRollId(), kg, receivedDate })
    }
  }

  const n = Math.max(0, Math.floor(addCount))
  if (n <= 0) {
    throw new Error('invalid-count')
  }
  for (let i = 0; i < n; i++) {
    parts.push({ id: newFullRollId(), kg, receivedDate })
  }

  saveRollStock({
    ...map,
    [productId]: normalizeRollState({
      fullRolls: 0,
      openRolls: cur.openRolls,
      fullRollParts: sortFullRollPartsFifo(parts),
    }),
  })
  notifyLiveStockChanged()
}

/** แกะม้วนเต็มที่เลือกจากรายการกก.ต่อม้วน → ย้ายเป็นม้วนเปิดด้วยกก. ของม้วนนั้น */
export function openFullRollPartById(productId: string, partId: string): void {
  const map = loadRollStock()
  const cur0 = map[productId] ?? { fullRolls: 0, openRolls: [] }
  const cur = normalizeRollState(cur0)
  const parts = cur.fullRollParts
  if (!parts || parts.length === 0) {
    throw new Error('no-parts')
  }
  const idx = parts.findIndex((x) => x.id === partId)
  if (idx < 0) {
    throw new Error('not-found')
  }
  const chosen = parts[idx]
  const kg = roundKg(chosen.kg)
  if (kg <= EPS) {
    throw new Error('invalid-kg')
  }
  const rest = parts.filter((_, i) => i !== idx)
  saveRollStock({
    ...map,
    [productId]: normalizeRollState({
      fullRolls: 0,
      openRolls: [...cur.openRolls, { id: newRollId(), remainingKg: kg }],
      fullRollParts: rest.length > 0 ? sortFullRollPartsFifo(rest) : undefined,
    }),
  })
  notifyLiveStockChanged()
}

/** แกะม้วนเต็มแบบนับจำนวน 1 ม้วน (FIFO) — ใช้กก./ม้วนจากมาสเตอร์ */
export function openOneLegacyFullRollFromStorage(productId: string, nominalKgPerRoll: number): void {
  const map = loadRollStock()
  const next = openFullRollAsNewPartial(map, productId, nominalKgPerRoll)
  saveRollStock(next)
  notifyLiveStockChanged()
}

export function adjustPieceStock(productId: string, delta: number): void {
  const cur = loadLiveStock()
  const have = cur[productId] ?? 0
  const next = Math.max(0, Math.floor(have + delta))
  saveLiveStock({ ...cur, [productId]: next })
  notifyLiveStockChanged()
}

export function setPieceStock(productId: string, qty: number): void {
  const cur = loadLiveStock()
  const next = Math.max(0, Math.floor(qty))
  saveLiveStock({ ...cur, [productId]: next })
  notifyLiveStockChanged()
}

/** จัดสต็อกม้วนให้รวมกก. ตามยอดที่ต้องการ (ม้วนเต็ม + เศษ) — ล้างรายการม้วนละกก.; ใช้กับโหมดกก./ม้วนคงที่ */
export function setRollProductTotalKg(
  productId: string,
  totalKg: number,
  nominalKgPerRoll: number,
): void {
  const nominal = Math.max(0.001, nominalKgPerRoll)
  const kg = Math.max(0, roundKg(totalKg))
  const fullRolls = Math.floor(kg / nominal)
  const rem = roundKg(kg - fullRolls * nominal)
  const openRolls = rem > EPS ? [{ id: newRollId(), remainingKg: rem }] : []
  const roll = loadRollStock()
  saveRollStock({
    ...roll,
    [productId]: normalizeRollState({ fullRolls, openRolls }),
  })
  notifyLiveStockChanged()
}

export function adjustRollProductKg(productId: string, deltaKg: number, nominalKgPerRoll: number): void {
  const nominal = Math.max(0.001, nominalKgPerRoll)
  const p = getPosCatalogProducts().find((x) => x.id === productId)
  if (!p || (p.stockMode !== 'kg_roll' && p.stockMode !== 'meter_roll')) return
  const roll = loadRollStock()
  const r = getRollStateForProduct(p, roll)
  if (usesPerRollWeightTracking(r)) {
    const openRolls = r.openRolls.map((x) => ({ ...x }))
    if (openRolls.length === 0 && deltaKg > EPS) {
      openRolls.push({ id: newRollId(), remainingKg: 0 })
    }
    if (openRolls.length === 0) return
    const first = openRolls[0]
    first.remainingKg = roundKg(Math.max(0, first.remainingKg + deltaKg))
    if (first.remainingKg <= EPS) openRolls.shift()
    setRollStockStateForProduct(productId, {
      fullRolls: 0,
      fullRollParts: r.fullRollParts ? [...r.fullRollParts] : undefined,
      openRolls,
    })
    return
  }
  const current = totalKgFromRoll(r, nominal)
  setRollProductTotalKg(productId, current + deltaKg, nominal)
}

function roundBomQty(n: number): number {
  return Math.round(n * 100) / 100
}

function posDefaultUnitRollMeta(cfg: PosSellConfig, unitIndex: number): { isRoll: boolean } {
  const u = cfg.units.find((x) => x.index === unitIndex) ?? cfg.units[0]
  const label = u?.label ?? 'ชิ้น'
  return { isRoll: label === 'ม้วน' }
}

/**
 * หักวัตถุดิบตาม BOM ให้สอดคล้อง POS (ชิ้น / ม้วนกก.·เมตร / กล่อง+เศษ) — ไม่บันทึก
 */
export function reduceLiveStockStateForBomDeductions(
  piece: Record<string, number>,
  roll: Record<string, RollStockState>,
  box: Record<string, BoxPieceStockState>,
  deductions: { productId: string; qty: number }[],
): { piece: Record<string, number>; roll: Record<string, RollStockState>; box: Record<string, BoxPieceStockState> } {
  const catalog = getPosCatalogProducts()
  const pieceDeds: { productId: string; qty: number }[] = []
  let nextRoll = roll
  let nextBox = box

  for (const { productId, qty } of deductions) {
    const q = roundBomQty(qty)
    if (q <= EPS) continue
    const p = catalog.find((x) => x.id === productId)
    if (!p) {
      throw new Error(`ไม่พบสินค้าในแคตตาล็อก: ${productId}`)
    }

    if (isBoxPieceProduct(p)) {
      const pcs = Math.max(0, Math.round(q))
      if (pcs <= 0) continue
      nextBox = deductBoxPieces(nextBox, productId, pcs, p.piecesPerBox!)
      continue
    }

    if (!posProductUsesRollShelfStock(p)) {
      pieceDeds.push({ productId, qty: q })
      continue
    }

    const cfg = getPosSellConfig(productId)
    const picked = pickDefaultPosUnitAndPrice(cfg)
    const nominal = posRollNominalForProduct(p)
    if (!picked) {
      nextRoll = deductRollKg(nextRoll, productId, q, nominal)
      continue
    }
    const { isRoll } = posDefaultUnitRollMeta(cfg, picked.unit.index)
    if (isRoll) {
      nextRoll = deductFullRolls(nextRoll, productId, Math.max(0, Math.floor(q)))
    } else {
      nextRoll = deductRollKg(nextRoll, productId, q, nominal)
    }
  }

  const nextPiece = pieceDeds.length === 0 ? piece : deductStock(piece, pieceDeds)
  return { piece: nextPiece, roll: nextRoll, box: nextBox }
}

/**
 * ผลิตประกอบเข้าคลัง: หักวัตถุดิบตามสูตร แล้วเพิ่มสต็อกสินค้าสำเร็จรูป (ชิ้นใน POS)
 */
export function produceAssemblyToStock(
  componentDeductions: { productId: string; qty: number }[],
  output: { productId: string; qty: number },
): void {
  const outQty = Math.floor(output.qty)
  if (outQty <= 0 || !Number.isFinite(outQty)) {
    throw new Error('invalid-output-qty')
  }
  const piece = loadLiveStock()
  const roll = loadRollStock()
  const box = loadBoxPieceStock()
  const { piece: p2, roll: r2, box: b2 } = reduceLiveStockStateForBomDeductions(piece, roll, box, componentDeductions)
  const p3 = addStock(p2, [{ productId: output.productId, qty: outQty }])
  saveLiveStock(p3)
  saveRollStock(r2)
  saveBoxPieceStock(b2)
  notifyLiveStockChanged()
}
