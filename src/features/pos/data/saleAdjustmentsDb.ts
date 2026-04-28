import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'

export async function saleVoidAsync(saleId: string, reason?: string): Promise<void> {
  if (!isTauri()) throw new Error('ใช้งานได้เฉพาะในแอป')
  await invoke('sale_void', { saleId, reason: reason ?? '' })
}

export type SaleReturnLineInput = {
  originalSaleLineId?: string
  productId: string
  productName: string
  qty: number
  unitPrice: number
  lineTotal: number
}

export type SaleReturnPayload = {
  originalSaleId: string
  reason?: string
  refundMethod: 'cash' | 'credit' | 'deduct_ar'
  lines: SaleReturnLineInput[]
}

export type SaleReturnResult = {
  returnId: string
  returnNo: string
  totalRefund: number
  creditNoteNo?: string
}

export async function saleReturnCreateAsync(payload: SaleReturnPayload): Promise<SaleReturnResult> {
  if (!isTauri()) throw new Error('ใช้งานได้เฉพาะในแอป')
  return invoke<SaleReturnResult>('sale_return_create', { payload })
}

export const REFUND_METHOD_LABELS: Record<SaleReturnPayload['refundMethod'], string> = {
  cash:      'คืนเงินสด',
  credit:    'เครดิตลูกค้า',
  deduct_ar: 'หักจากหนี้',
}

export const RETURN_REASON_OPTIONS = [
  'สินค้าผิด',
  'สินค้าชำรุด',
  'เปลี่ยนใจ',
  'สั่งเกิน',
  'อื่นๆ',
]
