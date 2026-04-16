import { getDeviceLabel } from '@/features/device/deviceSession'

/**
 * เลขบิล POS รูปแบบ: `{เลขเครื่อง}P{ปี พ.ศ. 2 หลัก}-{ลำดับ 6 หลัก}`
 * ตัวอย่าง: เครื่อง PC1 (ดึงเลข 1), พ.ศ. 2569 → `1P69-000001`
 *
 * เลขที่ใบกำกับภาษีแยกลำดับ: `{เลขเครื่อง}T{ปี พ.ศ. 2 หลัก}-{ลำดับ 6 หลัก}` เช่น `1T69-000001`
 */
const POS_SEQ_KEY = 'bento.pos.billSeq.v2'
const TAX_SEQ_KEY = 'bento.pos.taxInvoiceSeq.v2'

export function parseMachineNumberFromLabel(label: string): number {
  const m = label.trim().match(/\d+/)
  if (!m) return 1
  const n = parseInt(m[0], 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(n, 99)
}

/** ปี พ.ศ. 2 หลักท้าย (เช่น 2569 → 69) ตามวันที่เครื่อง */
export function buddhistEraYearLast2Digits(d: Date = new Date()): number {
  const be = d.getFullYear() + 543
  return be % 100
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

function seqMapKey(machine: number, yy: number): string {
  return `${machine}-${yy}`
}

function formatPosBill(machine: number, yy: number, seq: number): string {
  const seqStr = String(seq).padStart(6, '0')
  const yy2 = String(yy).padStart(2, '0')
  return `${machine}P${yy2}-${seqStr}`
}

function formatTaxInvoice(machine: number, yy: number, seq: number): string {
  const seqStr = String(seq).padStart(6, '0')
  const yy2 = String(yy).padStart(2, '0')
  return `${machine}T${yy2}-${seqStr}`
}

function peekNextSeq(machine: number, yy: number, storageKey: string): number {
  const map = loadSeqMap(storageKey)
  const key = seqMapKey(machine, yy)
  const prev = map[key]
  return Number.isFinite(prev) && prev >= 1 ? prev + 1 : 1
}

/** เลขที่บิล POS ถัดไป (ยังไม่เพิ่มลำดับ — แสดงบนหน้าจอก่อนยืนยันขาย) */
export function peekNextPosBillNumber(d: Date = new Date()): string {
  const machine = parseMachineNumberFromLabel(getDeviceLabel())
  const yy = buddhistEraYearLast2Digits(d)
  const seq = peekNextSeq(machine, yy, POS_SEQ_KEY)
  return formatPosBill(machine, yy, seq)
}

/** เลขที่ใบกำกับภาษีถัดไป (ยังไม่เพิ่มลำดับ) */
export function peekNextTaxInvoiceNumber(d: Date = new Date()): string {
  const machine = parseMachineNumberFromLabel(getDeviceLabel())
  const yy = buddhistEraYearLast2Digits(d)
  const seq = peekNextSeq(machine, yy, TAX_SEQ_KEY)
  return formatTaxInvoice(machine, yy, seq)
}

/** เลขที่บิล POS ถัดไป (รันต่อเนื่อง แยกตามเครื่องและปี พ.ศ.) */
export function nextPosBillNumber(d: Date = new Date()): string {
  const machine = parseMachineNumberFromLabel(getDeviceLabel())
  const yy = buddhistEraYearLast2Digits(d)
  const key = seqMapKey(machine, yy)
  const map = loadSeqMap(POS_SEQ_KEY)
  const prev = map[key]
  const nextSeq = Number.isFinite(prev) && prev >= 1 ? prev + 1 : 1
  map[key] = nextSeq
  saveSeqMap(POS_SEQ_KEY, map)
  return formatPosBill(machine, yy, nextSeq)
}

/** เลขที่ใบกำกับภาษีถัดไป (ลำดับแยกจากบิล POS) */
export function nextTaxInvoiceNumber(d: Date = new Date()): string {
  const machine = parseMachineNumberFromLabel(getDeviceLabel())
  const yy = buddhistEraYearLast2Digits(d)
  const key = seqMapKey(machine, yy)
  const map = loadSeqMap(TAX_SEQ_KEY)
  const prev = map[key]
  const nextSeq = Number.isFinite(prev) && prev >= 1 ? prev + 1 : 1
  map[key] = nextSeq
  saveSeqMap(TAX_SEQ_KEY, map)
  return formatTaxInvoice(machine, yy, nextSeq)
}
