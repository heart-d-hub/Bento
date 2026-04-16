/**
 * โมเดลคลังหลายสาขา + คลังกลาง (ในโปรแกรม) — เตรียม path ไปซิงค์เซิร์ฟเวอร์ต่อสาขา
 * อนาคต: โกดังกลางจริง = เพิ่ม siteKind / warehouseId โดยไม่ทับรูปแบบเดิม
 *
 * ไม่ import ProductMasterDetail — หลีกเลี่ยงวงจรนำเข้ากับ productMasterData
 */

import { BRANCHES, type BranchId } from '@/features/auth/branches'
import type { CrossBranchStockRow } from '@/features/inventory/data/productMasterData'

/** ชื่อคลังกลางในโปรแกรม (ยังไม่มีโกดังกลางจริง — ใช้มองยอดรวม/โอน) */
export const CENTRAL_HUB_LOCATION_LABEL = 'คลังกลาง'

export type StockSiteKind = 'branch' | 'central_hub'

/** แมปชื่อที่แสดงใน mock เก่า → BranchId */
const LEGACY_LABEL_TO_BRANCH: Record<string, BranchId> = {
  'สาขา 1': 'somneuk',
  'สาขา 2': 'ang',
}

function branchIdFromLocationLabel(label: string): BranchId | undefined {
  const t = label.trim()
  if (LEGACY_LABEL_TO_BRANCH[t]) return LEGACY_LABEL_TO_BRANCH[t]
  const b = BRANCHES.find((x) => x.name.trim() === t)
  return b?.id
}

/** เติม branchId / siteKind ให้แถวสต็อกเดิมที่มีแค่ชื่อ */
export function normalizeCrossBranchRows(rows: CrossBranchStockRow[]): CrossBranchStockRow[] {
  return rows.map((row) => {
    const label = row.locationLabel.trim()
    if (label === CENTRAL_HUB_LOCATION_LABEL) {
      return {
        ...row,
        siteKind: 'central_hub' as const,
        branchId: undefined,
      }
    }
    const bid = row.branchId ?? branchIdFromLocationLabel(row.locationLabel)
    return {
      ...row,
      ...(bid ? { branchId: bid, siteKind: 'branch' as const } : { siteKind: row.siteKind ?? ('branch' as const) }),
    }
  })
}

/** สต็อกเริ่มต้นตอนเพิ่มสินค้าใหม่ — แถวต่อสาขา + คลังกลาง(โปรแกรม) */
export function defaultCrossBranchRowsForNewProduct(productId: string): CrossBranchStockRow[] {
  const stamp = Date.now().toString(36)
  const branchRows: CrossBranchStockRow[] = BRANCHES.map((b, i) => ({
    id: `cb-${productId}-br-${b.id}-${stamp}-${i}`,
    locationLabel: b.name,
    branchId: b.id,
    siteKind: 'branch',
    stock: 0,
    position: '—',
    status: 'normal',
  }))
  return [
    ...branchRows,
    {
      id: `cb-${productId}-hub-${stamp}`,
      locationLabel: CENTRAL_HUB_LOCATION_LABEL,
      siteKind: 'central_hub',
      stock: 0,
      position: '—',
      status: 'normal',
    },
  ]
}

/** รวมที่เก็บจากฟอร์มเข้าแถวสาขาปัจจุบัน (หรือแถวแรกถ้าไม่ระบุสาขา) */
export function applyStorageLocationToCrossBranch(
  rows: CrossBranchStockRow[],
  storageLocation: string,
  branchId: BranchId | null | undefined,
): CrossBranchStockRow[] {
  const pos = storageLocation.trim() || '—'
  if (!branchId) {
    if (rows.length === 0) return rows
    return rows.map((r, i) => (i === 0 ? { ...r, position: pos } : r))
  }
  let any = false
  const next = rows.map((r) => {
    if (r.branchId === branchId) {
      any = true
      return { ...r, position: pos }
    }
    return r
  })
  if (any) return next
  return rows.map((r, i) => (i === 0 ? { ...r, position: pos } : r))
}

export type MasterEditSnapshot = {
  masterRevision?: number
  lastMasterEditAt?: string
  lastMasterEditBranchId?: BranchId
  lastMasterEditBy?: string
}

export type MasterEditMetadata = {
  masterRevision: number
  lastMasterEditAt: string
  lastMasterEditBranchId: BranchId
  lastMasterEditBy?: string
}

export type ConcurrentMasterEditInfo = {
  otherBranchName: string
  otherBranchId: BranchId
  savedAt: string
  editor?: string
  revisionWhenOpened: number
  revisionNow: number
}

/** ตรวจว่ามีการบันทึกแฟ้มมาสเตอร์ใหม่กว่าตอนเปิดฟอร์มหรือไม่ (ข้ามสาขา / แท็บ) */
export function detectConcurrentMasterEdit(
  openedSnapshot: MasterEditSnapshot,
  latestFromStore: MasterEditSnapshot,
): ConcurrentMasterEditInfo | null {
  const prevRev = openedSnapshot.masterRevision ?? 0
  const nowRev = latestFromStore.masterRevision ?? 0
  if (nowRev <= prevRev) return null
  const bid = latestFromStore.lastMasterEditBranchId
  const branchName = bid ? (BRANCHES.find((b) => b.id === bid)?.name ?? String(bid)) : 'สาขาอื่น'
  return {
    otherBranchName: branchName,
    otherBranchId: bid ?? BRANCHES[0]!.id,
    savedAt: latestFromStore.lastMasterEditAt ?? '',
    editor: latestFromStore.lastMasterEditBy,
    revisionWhenOpened: prevRev,
    revisionNow: nowRev,
  }
}

export function buildNextMasterEditMetadata(
  latestInStore: MasterEditSnapshot | undefined,
  branchId: BranchId,
  editorUsername: string | null | undefined,
): MasterEditMetadata {
  const next = (latestInStore?.masterRevision ?? 0) + 1
  return {
    masterRevision: next,
    lastMasterEditAt: new Date().toISOString(),
    lastMasterEditBranchId: branchId,
    lastMasterEditBy: editorUsername?.trim() || undefined,
  }
}
