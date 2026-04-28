import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'

export type VendorRow = {
  id: string
  name: string
  bankName: string | null
  bankAccount: string | null
  contactName: string | null
  phone: string | null
  note: string | null
}

export type VendorSpendingRow = {
  payee: string
  total: number
  count: number
  lastDate: string | null
}

export async function vendorListAsync(): Promise<VendorRow[]> {
  if (!isTauri()) return []
  return invoke<VendorRow[]>('vendor_list')
}

export async function vendorCreateAsync(
  name: string,
  bankName?: string | null,
  bankAccount?: string | null,
  contactName?: string | null,
  phone?: string | null,
  note?: string | null,
): Promise<string> {
  if (!isTauri()) return ''
  return invoke<string>('vendor_create', {
    name, bankName: bankName ?? null, bankAccount: bankAccount ?? null,
    contactName: contactName ?? null, phone: phone ?? null, note: note ?? null,
  })
}

export async function vendorUpdateAsync(
  id: string,
  name: string,
  bankName?: string | null,
  bankAccount?: string | null,
  contactName?: string | null,
  phone?: string | null,
  note?: string | null,
): Promise<void> {
  if (!isTauri()) return
  return invoke<void>('vendor_update', {
    id, name, bankName: bankName ?? null, bankAccount: bankAccount ?? null,
    contactName: contactName ?? null, phone: phone ?? null, note: note ?? null,
  })
}

export async function vendorDeleteAsync(id: string): Promise<void> {
  if (!isTauri()) return
  return invoke<void>('vendor_delete', { id })
}

export async function vendorSpendingAsync(dateFrom: string, dateTo: string): Promise<VendorSpendingRow[]> {
  if (!isTauri()) return []
  return invoke<VendorSpendingRow[]>('vendor_spending', { dateFrom, dateTo })
}
