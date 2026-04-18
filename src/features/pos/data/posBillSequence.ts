import { getDeviceLabel } from '@/features/device/deviceSession'
import { getStoredBranch } from '@/features/auth/authSession'
import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'
import { localDateYYYYMMDD, parseLocalYYYYMMDD } from '@/features/pos/utils/posLocalDate'

/**
 * เลขบิล POS (ขายปลีก): `{เลขเครื่อง}P{สาขา}{ปี พ.ศ. 2 หลัก}{เดือน}{ลำดับ 4 หลัก}`
 * เลขที่ใบกำกับภาษี: `{นำสาขา}{เลขเครื่อง}{ปี}{เดือน}{ลำดับ 4 หลัก}`
 *
 * **Tauri:** ลำดับใน Postgres (`PosBillSequenceCounter`)
 * **เบราว์เซอร์:** localStorage เดิม
 */
const POS_SEQ_KEY = 'bento.pos.billSeq.v3'
const TAX_SEQ_KEY = 'bento.pos.taxInvoiceSeq.v4'

export type PosBillSeqPayload = {
  kind: 'retail' | 'tax'
  /** YYYY-MM-DD ตามหน้า POS */
  docDate: string
  machine: number
  branchId?: string
}

export function parseMachineNumberFromLabel(label: string): number {
  const m = label.trim().match(/\d+/)
  if (!m) return 1
  const n = parseInt(m[0], 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(n, 99)
}

/** ปี พ.ศ. 2 หลักท้าย (เช่น 2569 → 69) ตามวันที่เอกสาร */
export function buddhistEraYearLast2Digits(d: Date = new Date()): number {
  const be = d.getFullYear() + 543
  return be % 100
}

/** A = อังอะไหล่, S = สมนึกอะไหล่ */
function branchLetter(): 'A' | 'S' {
  return getStoredBranch()?.id === 'somneuk' ? 'S' : 'A'
}

function loadSeqMap(storageKey: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return {}
    const o = JSON.parse(raw) as unknown
    if (o && typeof o === 'object' && !Array.isArray(o)) return o as Record<string, number>
  } catch {
    /* ignore */
  }
  return {}
}

function saveSeqMap(storageKey: string, map: Record<string, number>): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

function formatRetailPosBill(machine: number, d: Date, seq: number): string {
  const L = branchLetter()
  const yy = buddhistEraYearLast2Digits(d)
  const yy2 = String(yy).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const seq4 = String(seq).padStart(4, '0')
  return `${machine}P${L}${yy2}${mm}${seq4}`
}

function retailPosSeqStorageKey(machine: number, d: Date): string {
  const L = branchLetter()
  const yy = buddhistEraYearLast2Digits(d)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${machine}-P-${L}-${yy}-${mm}`
}

function peekNextRetailPosSeq(machine: number, d: Date): number {
  const key = retailPosSeqStorageKey(machine, d)
  const map = loadSeqMap(POS_SEQ_KEY)
  const prev = map[key]
  return Number.isFinite(prev) && prev >= 1 ? prev + 1 : 1
}

function taxMachinePrefix(): string {
  const letter = branchLetter()
  const n = parseMachineNumberFromLabel(getDeviceLabel())
  const digit = Math.min(Math.max(n, 1), 9)
  return `${letter}${digit}`
}

function formatTaxInvoice(d: Date, seq: number): string {
  const prefix = taxMachinePrefix()
  const yy = buddhistEraYearLast2Digits(d)
  const yy2 = String(yy).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const seq4 = String(seq).padStart(4, '0')
  return `${prefix}${yy2}${mm}${seq4}`
}

function taxSeqStorageKey(d: Date): string {
  const prefix = taxMachinePrefix()
  const yy = buddhistEraYearLast2Digits(d)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${prefix}-${yy}-${mm}`
}

function buildSeqPayload(kind: 'retail' | 'tax', docDate: string): PosBillSeqPayload {
  return {
    kind,
    docDate,
    machine: parseMachineNumberFromLabel(getDeviceLabel()),
    branchId: getStoredBranch()?.id,
  }
}

/** Tauri: ดึงจาก Postgres */
export async function peekNextPosBillNumberAsync(docDate: string): Promise<string> {
  if (!isTauri()) {
    return peekNextPosBillNumber(parseLocalYYYYMMDD(docDate))
  }
  return invoke<string>('pos_bill_peek_next', { payload: buildSeqPayload('retail', docDate) })
}

export async function peekNextTaxInvoiceNumberAsync(docDate: string): Promise<string> {
  if (!isTauri()) {
    return peekNextTaxInvoiceNumber(parseLocalYYYYMMDD(docDate))
  }
  return invoke<string>('pos_bill_peek_next', { payload: buildSeqPayload('tax', docDate) })
}

export async function nextPosBillNumberAsync(docDate: string): Promise<string> {
  if (!isTauri()) {
    return nextPosBillNumber(parseLocalYYYYMMDD(docDate))
  }
  return invoke<string>('pos_bill_next', { payload: buildSeqPayload('retail', docDate) })
}

export async function nextTaxInvoiceNumberAsync(docDate: string): Promise<string> {
  if (!isTauri()) {
    return nextTaxInvoiceNumber(parseLocalYYYYMMDD(docDate))
  }
  return invoke<string>('pos_bill_next', { payload: buildSeqPayload('tax', docDate) })
}

/** เลขที่บิล POS ถัดไป (ยังไม่เพิ่มลำดับ) — ใช้กับ localStorage / fallback */
export function peekNextPosBillNumber(d: Date = new Date()): string {
  const machine = parseMachineNumberFromLabel(getDeviceLabel())
  const seq = peekNextRetailPosSeq(machine, d)
  return formatRetailPosBill(machine, d, seq)
}

/** เลขที่ใบกำกับภาษีถัดไป (ยังไม่เพิ่มลำดับ) */
export function peekNextTaxInvoiceNumber(d: Date = new Date()): string {
  const key = taxSeqStorageKey(d)
  const map = loadSeqMap(TAX_SEQ_KEY)
  const prev = map[key]
  const seq = Number.isFinite(prev) && prev >= 1 ? prev + 1 : 1
  return formatTaxInvoice(d, seq)
}

/** เลขที่บิล POS ถัดไป — เพิ่มลำดับ (localStorage) */
export function nextPosBillNumber(d: Date = new Date()): string {
  const machine = parseMachineNumberFromLabel(getDeviceLabel())
  const key = retailPosSeqStorageKey(machine, d)
  const map = loadSeqMap(POS_SEQ_KEY)
  const prev = map[key]
  const nextSeq = Number.isFinite(prev) && prev >= 1 ? prev + 1 : 1
  map[key] = nextSeq
  saveSeqMap(POS_SEQ_KEY, map)
  return formatRetailPosBill(machine, d, nextSeq)
}

/** เลขที่ใบกำกับภาษีถัดไป */
export function nextTaxInvoiceNumber(d: Date = new Date()): string {
  const key = taxSeqStorageKey(d)
  const map = loadSeqMap(TAX_SEQ_KEY)
  const prev = map[key]
  const nextSeq = Number.isFinite(prev) && prev >= 1 ? prev + 1 : 1
  map[key] = nextSeq
  saveSeqMap(TAX_SEQ_KEY, map)
  return formatTaxInvoice(d, nextSeq)
}

/** สำหรับตะกร้า POS (วันที่ = วันนี้ตาม local) — Tauri ใช้ DB */
export async function nextPosBillNumberForTodayAsync(): Promise<string> {
  const docDate = localDateYYYYMMDD(new Date())
  return nextPosBillNumberAsync(docDate)
}
