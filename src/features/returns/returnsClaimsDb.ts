import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'

// ─── Return history ───────────────────────────────────────────────────────────

export type ReturnListRow = {
  id: string
  returnNo: string
  originalSaleId: string
  originalBillNo: string
  returnDate: string
  reason: string | null
  refundMethod: string
  totalRefund: number
  memberName: string | null
  creditNoteNo: string | null
  lineCount: number
}

export async function returnListAsync(dateFrom: string, dateTo: string): Promise<ReturnListRow[]> {
  if (!isTauri()) return []
  return invoke<ReturnListRow[]>('return_list', { dateFrom, dateTo })
}

// ─── Claims ───────────────────────────────────────────────────────────────────

export type ClaimStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected'

export type ClaimRow = {
  id: string
  claimNo: string
  returnId: string | null
  returnNo: string | null
  productName: string
  serialNo: string | null
  issue: string
  status: ClaimStatus
  vendorName: string | null
  resolution: string | null
  resolvedAt: string | null
  createdAt: string
}

export async function claimListAsync(status?: ClaimStatus | null): Promise<ClaimRow[]> {
  if (!isTauri()) return []
  return invoke<ClaimRow[]>('claim_list', { status: status ?? null })
}

export async function claimCreateAsync(params: {
  returnId?: string | null
  productName: string
  serialNo?: string | null
  issue: string
  vendorName?: string | null
}): Promise<string> {
  if (!isTauri()) throw new Error('ใช้งานได้เฉพาะในแอป')
  return invoke<string>('claim_create', {
    returnId: params.returnId ?? null,
    productName: params.productName,
    serialNo: params.serialNo ?? null,
    issue: params.issue,
    vendorName: params.vendorName ?? null,
  })
}

export async function claimUpdateAsync(
  id: string,
  status: ClaimStatus,
  resolution?: string | null,
  vendorName?: string | null,
): Promise<void> {
  if (!isTauri()) throw new Error('ใช้งานได้เฉพาะในแอป')
  await invoke('claim_update', {
    id,
    status,
    resolution: resolution ?? null,
    vendorName: vendorName ?? null,
  })
}

export async function claimDeleteAsync(id: string): Promise<void> {
  if (!isTauri()) throw new Error('ใช้งานได้เฉพาะในแอป')
  await invoke('claim_delete', { id })
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  pending:     'รอดำเนินการ',
  in_progress: 'กำลังดำเนินการ',
  resolved:    'แก้ไขแล้ว',
  rejected:    'ปฏิเสธ',
}

export const CLAIM_STATUSES: ClaimStatus[] = ['pending', 'in_progress', 'resolved', 'rejected']
