import type { SupplierCreditDueConfig } from '@/features/finance/data/supplierPaymentDueDate'
import { DEFAULT_SUPPLIER_CREDIT } from '@/features/finance/data/supplierPaymentDueDate'

export const CREDIT_TERMS_CHANGED_EVENT = 'bento-finance-credit-terms-changed'

const LS_SUPPLIERS = 'bento.finance.supplierCreditTerms.v1'
const LS_CUSTOMERS = 'bento.finance.customerCreditTerms.v1'

/** ชุดเดียวกับเจ้าหนี้ — ใช้คำนวณกำหนดเก็บ/กำหนดจ่าย (รอบบิล + เครดิต + สิ้นเดือน) */
export type CounterpartyCreditConfig = SupplierCreditDueConfig

function loadMap(key: string): Record<string, Partial<CounterpartyCreditConfig>> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    const o = JSON.parse(raw) as unknown
    if (o && typeof o === 'object' && !Array.isArray(o)) {
      return o as Record<string, Partial<CounterpartyCreditConfig>>
    }
  } catch {
    /* ignore */
  }
  return {}
}

function saveMap(key: string, map: Record<string, Partial<CounterpartyCreditConfig>>): void {
  try {
    localStorage.setItem(key, JSON.stringify(map))
    window.dispatchEvent(new CustomEvent(CREDIT_TERMS_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}

/** ค่าเริ่มต้นตัวอย่างต่อซัพพลาย (ก่อนผู้ใช้บันทึกทับในเครื่อง) — แสดงว่าแต่ละรายไม่เหมือนกัน */
export const DEMO_SUPPLIER_CREDIT_SEED: Record<string, Partial<CounterpartyCreditConfig>> = {
  'sup-toyota-tsb': {
    statementCutoffDay: 25,
    creditDays: 30,
    excludePurchaseMonth: true,
    payAtEndOfDueMonth: true,
  },
  'sup-bkk-parts': {
    statementCutoffDay: 25,
    creditDays: 45,
    excludePurchaseMonth: true,
    payAtEndOfDueMonth: true,
  },
  'sup-isuzu-pc': {
    statementCutoffDay: 25,
    creditDays: 30,
    excludePurchaseMonth: false,
    payAtEndOfDueMonth: false,
  },
}

/** ตัวอย่างกติกาลูกค้า (ขายให้เราเป็นลูกหนี้) — กำหนดเก็บไม่เหมือนกัน */
export const DEMO_CUSTOMER_CREDIT_SEED: Record<string, Partial<CounterpartyCreditConfig>> = {
  'cust-garage-1': {
    statementCutoffDay: 25,
    creditDays: 30,
    excludePurchaseMonth: true,
    payAtEndOfDueMonth: true,
  },
  'cust-retail-2': {
    statementCutoffDay: 30,
    creditDays: 15,
    excludePurchaseMonth: false,
    payAtEndOfDueMonth: true,
  },
  'cust-company-3': {
    statementCutoffDay: 25,
    creditDays: 60,
    excludePurchaseMonth: true,
    payAtEndOfDueMonth: true,
  },
  'cust-walkin-np': {
    statementCutoffDay: 25,
    creditDays: 0,
    excludePurchaseMonth: false,
    payAtEndOfDueMonth: true,
  },
}

function mergeCredit(
  partyId: string | undefined,
  seedMap: Record<string, Partial<CounterpartyCreditConfig>>,
  storedMap: Record<string, Partial<CounterpartyCreditConfig>>,
): CounterpartyCreditConfig {
  const seed = partyId ? seedMap[partyId] : undefined
  const stored = partyId ? storedMap[partyId] : undefined
  return {
    ...DEFAULT_SUPPLIER_CREDIT,
    ...seed,
    ...stored,
  }
}

/** กติกาสำหรับซัพพลายเออร์ (เจ้าหนี้) — รวม seed + ที่บันทึก */
export function getSupplierCreditTerms(supplierPartyId: string): CounterpartyCreditConfig {
  return mergeCredit(
    supplierPartyId,
    DEMO_SUPPLIER_CREDIT_SEED,
    loadMap(LS_SUPPLIERS),
  )
}

export function setSupplierCreditTerms(
  supplierPartyId: string,
  partial: Partial<CounterpartyCreditConfig>,
): void {
  const cur = loadMap(LS_SUPPLIERS)
  cur[supplierPartyId] = { ...cur[supplierPartyId], ...partial }
  saveMap(LS_SUPPLIERS, cur)
}

/** กติกาสำหรับลูกค้า (ลูกหนี้) — ใช้เดียวกันทางโครงสร้าง */
export function getCustomerCreditTerms(customerPartyId: string): CounterpartyCreditConfig {
  return mergeCredit(customerPartyId, DEMO_CUSTOMER_CREDIT_SEED, loadMap(LS_CUSTOMERS))
}

export function setCustomerCreditTerms(customerPartyId: string, partial: Partial<CounterpartyCreditConfig>): void {
  const cur = loadMap(LS_CUSTOMERS)
  cur[customerPartyId] = { ...cur[customerPartyId], ...partial }
  saveMap(LS_CUSTOMERS, cur)
}
