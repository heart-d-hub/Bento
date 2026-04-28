import { MOCK_SUPPLIERS } from '@/features/purchase/data/mockSuppliers'
import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'

const LS_KEY = 'bento.purchase.supplierDirectory.v1'

export const SUPPLIER_DIRECTORY_CHANGED_EVENT = 'bento-supplier-directory-changed'

/** บัญชีรับโอนหนึ่งบัญชี — ผู้จำหน่ายหนึ่งรายมีได้หลายบัญชี */
export type SupplierBankAccount = {
  bankName?: string
  accountNo?: string
  accountName?: string
}

/** ส่วนลดสำหรับจ่ายก่อนกำหนด — จ่ายภายใน X วัน จากวันยืนยัน PO ได้ลด Y% */
export type EarlyPayDiscount = {
  withinDays: number
  discountPct: number
}

export type SupplierProfile = {
  id: string
  /** รหัสย่อผู้จำหน่าย */
  supplierCode: string
  name: string
  taxId?: string
  phone?: string
  address?: string
  notes?: string
  /** รับชำระเงินสด */
  acceptsCash?: boolean
  /** รับชำระโอนธนาคาร */
  acceptsTransfer?: boolean
  /** ช่องทางชำระอื่นๆ (เช็ค, บัตรเครดิต, พร้อมเพย์ ฯลฯ) — หลายรายการได้ */
  otherPaymentMethods?: string[]
  /** บัญชีรับโอน (หลายบัญชีได้) */
  bankAccounts?: SupplierBankAccount[]
  /** ผู้ติดต่อ (แสดงในตารางหลัก) */
  contactName?: string
  /** LINE ID ของซัพพลาย */
  lineId?: string
  /** แบรนด์ที่จำหน่าย (แท็ก) */
  brandsSold?: string[]
  /** ขนส่งประจำ (ชื่อบริษัทขนส่ง / รับเอง) */
  defaultShipping?: string
  /** จำนวนสินค้าประจำ (แสดงในแถว) */
  regularProductCount?: number
  /** รูปแบบ VAT ในใบเสนอราคา/รายการสินค้า */
  priceListVatMode?: 'vat_included' | 'vat_excluded' | 'no_vat'
  /** ส่วนลดจ่ายก่อนกำหนด — เรียงตาม withinDays น้อยสุดก่อน */
  earlyPayDiscounts?: EarlyPayDiscount[]
}

function newSupplierId(): string {
  return `sup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function seedProfiles(): SupplierProfile[] {
  return MOCK_SUPPLIERS.map((s) => ({
    id: s.id,
    supplierCode: s.supplierCode,
    name: s.name,
    taxId: s.taxId,
    phone: s.phone,
    address: '',
    notes: '',
    acceptsCash: true,
    acceptsTransfer: true,
    contactName: s.contactName,
    lineId: s.lineId,
    brandsSold: s.brandsSold?.length ? [...s.brandsSold] : undefined,
    defaultShipping: s.defaultShipping,
    regularProductCount: s.regularProductCount,
  }))
}

export function loadSupplierDirectory(): SupplierProfile[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) {
      const seed = seedProfiles()
      localStorage.setItem(LS_KEY, JSON.stringify(seed))
      return seed
    }
    const list = JSON.parse(raw) as unknown
    if (!Array.isArray(list) || list.length === 0) {
      const seed = seedProfiles()
      localStorage.setItem(LS_KEY, JSON.stringify(seed))
      return seed
    }
    return list
      .map(normalizeProfile)
      .filter((x): x is SupplierProfile => x !== null)
  } catch {
    return seedProfiles()
  }
}

function optTrim(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t || undefined
}

function normalizeBankAccountEntry(v: unknown): SupplierBankAccount | null {
  if (!v || typeof v !== 'object') return null
  const r = v as Record<string, unknown>
  const bankName = optTrim(r.bankName)
  const accountNo = optTrim(r.accountNo ?? r.bankAccountNo)
  const accountName = optTrim(r.accountName ?? r.bankAccountName)
  if (!bankName && !accountNo && !accountName) return null
  return { bankName, accountNo, accountName }
}

function normalizeOtherPaymentMethods(o: Record<string, unknown>): string[] | undefined {
  const raw = o.otherPaymentMethods
  if (!Array.isArray(raw)) return undefined
  const list = raw
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((s) => s.length > 0)
  return list.length ? list : undefined
}

function normalizeBankAccountsFromRecord(o: Record<string, unknown>): SupplierBankAccount[] | undefined {
  const raw = o.bankAccounts
  if (Array.isArray(raw)) {
    const list = raw.map(normalizeBankAccountEntry).filter((x): x is SupplierBankAccount => x !== null)
    if (list.length) return list
  }
  const legacyName = optTrim(o.bankName)
  const legacyNo = optTrim(o.bankAccountNo)
  const legacyAccName = optTrim(o.bankAccountName)
  if (legacyName || legacyNo || legacyAccName) {
    return [{ bankName: legacyName, accountNo: legacyNo, accountName: legacyAccName }]
  }
  return undefined
}

function normalizeProfile(v: unknown): SupplierProfile | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : ''
  const name = typeof o.name === 'string' ? o.name.trim() : ''
  if (!id || !name) return null
  const supplierCode =
    typeof o.supplierCode === 'string' && o.supplierCode.trim()
      ? o.supplierCode.trim()
      : id.replace(/^sup-/, '').slice(0, 12).toUpperCase()
  const bool = (k: string): boolean | undefined => {
    if (typeof o[k] === 'boolean') return o[k] as boolean
    return undefined
  }
  let acceptsCash = bool('acceptsCash')
  let acceptsTransfer = bool('acceptsTransfer')
  if (acceptsCash === undefined && acceptsTransfer === undefined) {
    acceptsCash = true
    acceptsTransfer = true
  }
  const bankAccounts = normalizeBankAccountsFromRecord(o)
  const otherPaymentMethods = normalizeOtherPaymentMethods(o)
  const brandsRaw = o.brandsSold
  const brandsSold =
    Array.isArray(brandsRaw) && brandsRaw.length
      ? brandsRaw.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean)
      : undefined
  const rpc = typeof o.regularProductCount === 'number' && Number.isFinite(o.regularProductCount) ? Math.max(0, Math.floor(o.regularProductCount)) : undefined
  const validVatModes = ['vat_included', 'vat_excluded', 'no_vat'] as const
  const priceListVatMode = validVatModes.includes(o.priceListVatMode as typeof validVatModes[number])
    ? (o.priceListVatMode as SupplierProfile['priceListVatMode'])
    : undefined
  const earlyPayDiscounts: EarlyPayDiscount[] | undefined = (() => {
    if (!Array.isArray(o.earlyPayDiscounts)) return undefined
    const list = (o.earlyPayDiscounts as unknown[])
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const d = item as Record<string, unknown>
        const days = Number(d.withinDays)
        const pct  = Number(d.discountPct)
        if (!Number.isFinite(days) || days <= 0 || !Number.isFinite(pct) || pct <= 0) return null
        return { withinDays: Math.round(days), discountPct: Math.round(pct * 100) / 100 }
      })
      .filter((x): x is EarlyPayDiscount => x !== null)
    return list.length ? list : undefined
  })()
  return {
    id,
    supplierCode,
    name,
    taxId: optTrim(o.taxId),
    phone: optTrim(o.phone),
    address: optTrim(o.address),
    notes: optTrim(o.notes),
    acceptsCash,
    acceptsTransfer,
    otherPaymentMethods,
    bankAccounts,
    contactName: optTrim(o.contactName),
    lineId: optTrim(o.lineId),
    brandsSold: brandsSold?.length ? brandsSold : undefined,
    defaultShipping: optTrim(o.defaultShipping),
    regularProductCount: rpc,
    priceListVatMode,
    earlyPayDiscounts,
  }
}

function saveList(list: SupplierProfile[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent(SUPPLIER_DIRECTORY_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}

export function getSupplierProfile(supplierId: string): SupplierProfile | undefined {
  return loadSupplierDirectory().find((s) => s.id === supplierId)
}

export function upsertSupplierProfile(profile: SupplierProfile): void {
  const list = loadSupplierDirectory()
  const idx = list.findIndex((s) => s.id === profile.id)
  if (idx >= 0) {
    list[idx] = profile
  } else {
    list.push(profile)
  }
  saveList(list)
}

export function deleteSupplierProfile(id: string): void {
  saveList(loadSupplierDirectory().filter((s) => s.id !== id))
}

/** รหัสแสดงถัดไปแบบ S001, S002 … จากรายการที่มีอยู่ */
export function nextSupplierDisplayCode(): string {
  const list = loadSupplierDirectory()
  let max = 0
  for (const s of list) {
    const m = /^S(\d+)$/i.exec(s.supplierCode.trim())
    if (m) {
      const n = parseInt(m[1], 10)
      if (Number.isFinite(n)) max = Math.max(max, n)
    }
  }
  return `S${String(max + 1).padStart(3, '0')}`
}

function trimOpt(s: string | undefined): string | undefined {
  const t = s?.trim()
  return t ? t : undefined
}

function cleanOtherPaymentMethods(list: string[] | undefined): string[] | undefined {
  if (!list?.length) return undefined
  const cleaned = list.map((s) => s.trim()).filter((s) => s.length > 0)
  return cleaned.length ? cleaned : undefined
}

function cleanBankAccounts(list: SupplierBankAccount[] | undefined): SupplierBankAccount[] | undefined {
  if (!list?.length) return undefined
  const cleaned = list
    .map((a) => ({
      bankName: trimOpt(a.bankName),
      accountNo: trimOpt(a.accountNo),
      accountName: trimOpt(a.accountName),
    }))
    .filter((a) => a.bankName || a.accountNo || a.accountName)
  return cleaned.length ? cleaned : undefined
}

export function createSupplierProfile(partial: Omit<SupplierProfile, 'id'> & { id?: string }): SupplierProfile {
  const id = partial.id?.trim() || newSupplierId()
  const profile: SupplierProfile = {
    id,
    supplierCode: partial.supplierCode.trim() || id.slice(0, 10),
    name: partial.name.trim(),
    taxId: trimOpt(partial.taxId),
    phone: trimOpt(partial.phone),
    address: trimOpt(partial.address),
    notes: trimOpt(partial.notes),
    acceptsCash: partial.acceptsCash,
    acceptsTransfer: partial.acceptsTransfer,
    otherPaymentMethods: cleanOtherPaymentMethods(partial.otherPaymentMethods),
    bankAccounts: cleanBankAccounts(partial.bankAccounts),
    contactName: trimOpt(partial.contactName),
    lineId: trimOpt(partial.lineId),
    brandsSold: partial.brandsSold?.length ? partial.brandsSold.map((x) => x.trim()).filter(Boolean) : undefined,
    defaultShipping: trimOpt(partial.defaultShipping),
    regularProductCount:
      partial.regularProductCount != null && Number.isFinite(partial.regularProductCount)
        ? Math.max(0, Math.floor(partial.regularProductCount))
        : undefined,
    priceListVatMode: partial.priceListVatMode,
    earlyPayDiscounts: partial.earlyPayDiscounts?.length ? partial.earlyPayDiscounts : undefined,
  }
  upsertSupplierProfile(profile)
  return profile
}

export async function loadSupplierDirectoryAsync(): Promise<SupplierProfile[]> {
  if (isTauri()) {
    try {
      const rows = await invoke<unknown[]>('supplier_list')
      if (Array.isArray(rows) && rows.length > 0) {
        const parsed = rows.map(normalizeProfile).filter((x): x is SupplierProfile => x !== null)
        if (parsed.length > 0) return parsed
      }
    } catch (e) {
      console.warn('supplier_list failed, falling back to localStorage', e)
    }
  }
  return loadSupplierDirectory()
}

export async function upsertSupplierProfileAsync(profile: SupplierProfile): Promise<void> {
  upsertSupplierProfile(profile)
  if (isTauri()) {
    await invoke('supplier_upsert', { payload: profile })
  }
}

export async function deleteSupplierProfileAsync(id: string): Promise<void> {
  deleteSupplierProfile(id)
  if (isTauri()) {
    await invoke('supplier_delete', { id })
  }
}

/** แสดงช่องทางชำระที่ตั้งไว้ (รวมช่องทางอื่นที่กำหนดเอง) */
export function supplierPaymentMethodsLabel(p: SupplierProfile): string {
  const bits: string[] = []
  if (p.acceptsCash) bits.push('เงินสด')
  if (p.acceptsTransfer) bits.push('เงินโอน')
  for (const s of p.otherPaymentMethods ?? []) {
    const t = s.trim()
    if (t) bits.push(t)
  }
  return bits.length ? bits.join(' · ') : 'ยังไม่ระบุ'
}

/** รวมข้อความบัญชีสำหรับค้นหา */
export function supplierBankAccountsSearchText(p: SupplierProfile): string {
  return (p.bankAccounts ?? [])
    .flatMap((a) => [a.bankName ?? '', a.accountNo ?? '', a.accountName ?? ''])
    .join(' ')
}
