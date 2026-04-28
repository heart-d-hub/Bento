const SHIFT_KEY   = 'bento.bank.shifts.v1'
const DEPOSIT_KEY = 'bento.bank.deposits.v1'
const ACCOUNT_KEY = 'bento.bank.accounts.v1'

export const BANK_CHANGED_EVENT = 'bento-bank-changed'

export const BANK_NAMES = [
  'กสิกรไทย (KBANK)',
  'กรุงเทพ (BBL)',
  'ไทยพาณิชย์ (SCB)',
  'กรุงไทย (KTB)',
  'กรุงศรีอยุธยา (BAY)',
  'ทหารไทยธนชาต (TTB)',
  'ออมสิน (GSB)',
  'ธ.ก.ส. (BAAC)',
  'อาคารสงเคราะห์ (GHB)',
  'ซีไอเอ็มบี (CIMB)',
  'ยูโอบี (UOB)',
  'แลนด์แอนด์เฮ้าส์ (LH)',
  'อื่น ๆ',
]

export type BankAccountRecord = {
  id: string
  bankName: string       // จากรายการ BANK_NAMES
  accountNo: string      // เลขบัญชี
  accountName: string    // ชื่อบัญชี
  branch: string         // สาขา
  note: string
  isDefault: boolean
  promptPayId?: string   // เบอร์โทร / เลขบัตรประชาชน / เลขนิติบุคคล (สำหรับ PromptPay QR)
  createdAt: number
}

export type ShiftRecord = {
  id: string
  date: string        // YYYY-MM-DD
  openedAt: number    // ms timestamp
  openingFloat: number
  closedAt?: number
  closingCount?: number
  notes?: string
}

export type DepositRecord = {
  id: string
  shiftId: string
  date: string        // YYYY-MM-DD
  amount: number
  bank: string
  ref: string
  note: string
  createdAt: number
}

function emit() {
  window.dispatchEvent(new CustomEvent(BANK_CHANGED_EVENT))
}

/* ── Shifts ──────────────────────────────────────────────────────── */

export function loadShifts(): ShiftRecord[] {
  try {
    const raw = localStorage.getItem(SHIFT_KEY)
    return raw ? (JSON.parse(raw) as ShiftRecord[]) : []
  } catch { return [] }
}

export function saveShifts(shifts: ShiftRecord[]): void {
  try { localStorage.setItem(SHIFT_KEY, JSON.stringify(shifts)) } catch { /* noop */ }
}

export function openShift(date: string, openingFloat: number): ShiftRecord {
  const shift: ShiftRecord = {
    id: `sh-${Date.now()}`,
    date,
    openedAt: Date.now(),
    openingFloat,
  }
  const all = loadShifts()
  all.unshift(shift)
  saveShifts(all.slice(0, 200))
  emit()
  return shift
}

export function closeShift(id: string, closingCount: number, notes: string): void {
  const all = loadShifts()
  const idx = all.findIndex((s) => s.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], closedAt: Date.now(), closingCount, notes }
  saveShifts(all)
  emit()
}

export function getActiveShift(date: string): ShiftRecord | null {
  return loadShifts().find((s) => s.date === date && !s.closedAt) ?? null
}

export function getShiftsForDate(date: string): ShiftRecord[] {
  return loadShifts().filter((s) => s.date === date)
}

/* ── Deposits ────────────────────────────────────────────────────── */

export function loadDeposits(): DepositRecord[] {
  try {
    const raw = localStorage.getItem(DEPOSIT_KEY)
    return raw ? (JSON.parse(raw) as DepositRecord[]) : []
  } catch { return [] }
}

export function saveDeposits(deposits: DepositRecord[]): void {
  try { localStorage.setItem(DEPOSIT_KEY, JSON.stringify(deposits)) } catch { /* noop */ }
}

export function addDeposit(d: Omit<DepositRecord, 'id' | 'createdAt'>): DepositRecord {
  const record: DepositRecord = { ...d, id: `dep-${Date.now()}`, createdAt: Date.now() }
  const all = loadDeposits()
  all.unshift(record)
  saveDeposits(all.slice(0, 500))
  emit()
  return record
}

export function deleteDeposit(id: string): void {
  saveDeposits(loadDeposits().filter((d) => d.id !== id))
  emit()
}

export function getDepositsForDate(date: string): DepositRecord[] {
  return loadDeposits().filter((d) => d.date === date)
}

export function getDepositsForShift(shiftId: string): DepositRecord[] {
  return loadDeposits().filter((d) => d.shiftId === shiftId)
}

/* ── Bank accounts ───────────────────────────────────────────────── */

export function loadBankAccounts(): BankAccountRecord[] {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY)
    return raw ? (JSON.parse(raw) as BankAccountRecord[]) : []
  } catch { return [] }
}

function saveBankAccounts(accounts: BankAccountRecord[]): void {
  try { localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts)) } catch { /* noop */ }
}

export function addBankAccount(a: Omit<BankAccountRecord, 'id' | 'createdAt'>): BankAccountRecord {
  const all = loadBankAccounts()
  const record: BankAccountRecord = { ...a, id: `acc-${Date.now()}`, createdAt: Date.now() }
  if (record.isDefault) {
    all.forEach((x) => { x.isDefault = false })
  }
  all.push(record)
  saveBankAccounts(all)
  emit()
  return record
}

export function updateBankAccount(id: string, patch: Partial<Omit<BankAccountRecord, 'id' | 'createdAt'>>): void {
  const all = loadBankAccounts()
  const idx = all.findIndex((a) => a.id === id)
  if (idx === -1) return
  if (patch.isDefault) all.forEach((x) => { x.isDefault = false })
  all[idx] = { ...all[idx], ...patch }
  saveBankAccounts(all)
  emit()
}

export function deleteBankAccount(id: string): void {
  saveBankAccounts(loadBankAccounts().filter((a) => a.id !== id))
  emit()
}

export function getDefaultBankAccount(): BankAccountRecord | null {
  const all = loadBankAccounts()
  return all.find((a) => a.isDefault) ?? all[0] ?? null
}
