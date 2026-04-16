import { getProductMasterList } from '@/features/inventory/data/productMasterData'
import { applyHubDataToLocal, readLocalVehicleCatalogRaw } from '@/features/sync/applyHubPull'
import { hubPull, hubPush } from '@/features/sync/hubSyncClient'
import {
  loadHubBranchId,
  loadHubLastRevision,
  loadHubToken,
  loadHubUrl,
  saveHubLastRevision,
  saveHubLastSyncAt,
} from '@/features/sync/hubSyncConfig'

export type HubOpResult = { ok: true; message: string } | { ok: false; error: string }

/** ดึงจากกลาง — logic เดียวกับหน้าตั้งค่า */
export async function runHubPullOperation(): Promise<HubOpResult> {
  const u = loadHubUrl().trim()
  const tok = loadHubToken().trim()
  if (!u || !tok) return { ok: false, error: 'ยังไม่ได้ตั้งค่า URL หรือโทเคน' }
  const res = await hubPull(u, tok)
  if (!res.ok) return { ok: false, error: res.error }
  const d = res.data
  const emptyServer =
    d.revision === 0 &&
    d.productMaster.length === 0 &&
    (d.vehicleCatalog == null || d.vehicleCatalog === undefined)
  if (emptyServer) {
    saveHubLastRevision(0)
    return {
      ok: true,
      message: 'บนกลางยังว่าง — ยังไม่นำข้อมูลลงเครื่อง (ใช้ส่งขึ้นกลางครั้งแรก)',
    }
  }
  applyHubDataToLocal({
    productMaster: d.productMaster,
    vehicleCatalog: d.vehicleCatalog,
  })
  saveHubLastRevision(d.revision)
  const now = new Date().toISOString()
  saveHubLastSyncAt(now)
  return {
    ok: true,
    message: `ดึงสำเร็จ · revision ${d.revision}${d.updatedByBranch ? ` · จาก ${d.updatedByBranch}` : ''}`,
  }
}

/** ส่งขึ้นกลาง */
export async function runHubPushOperation(): Promise<HubOpResult> {
  const u = loadHubUrl().trim()
  const tok = loadHubToken().trim()
  const bid = loadHubBranchId().trim()
  if (!u || !tok) return { ok: false, error: 'ยังไม่ได้ตั้งค่า URL หรือโทเคน' }
  if (!bid) return { ok: false, error: 'ยังไม่ได้ตั้งรหัสสาขา (branchId)' }
  const products = getProductMasterList()
  const vehicleCatalog = readLocalVehicleCatalogRaw()
  const baseRevision = loadHubLastRevision()
  const res = await hubPush(u, tok, {
    branchId: bid,
    baseRevision,
    productMaster: products,
    vehicleCatalog,
  })
  if (!res.ok) {
    if ('conflict' in res) {
      const c = res.conflict
      return {
        ok: false,
        error: `ชน revision — กลางเป็น ${c.serverRevision} (แก้โดย ${c.updatedByBranch ?? '—'}) ให้ดึงจากกลางก่อน`,
      }
    }
    return { ok: false, error: res.error }
  }
  saveHubLastRevision(res.data.revision)
  saveHubLastSyncAt(new Date().toISOString())
  return { ok: true, message: `ส่งสำเร็จ · revision ${res.data.revision}` }
}

/**
 * Sync เต็ม: ดึงจากกลางก่อน แล้วส่งขึ้นกลาง (ให้ข้อมูลตรงกับเซิร์ฟเวอร์หลังรวม)
 */
export async function runHubFullSyncOperation(): Promise<HubOpResult> {
  const pull = await runHubPullOperation()
  if (!pull.ok) return pull
  const push = await runHubPushOperation()
  if (!push.ok) return push
  return {
    ok: true,
    message: `Sync ครบ · ${push.message}`,
  }
}

export const HUB_SYNC_FINISHED_EVENT = 'bento-hub-sync-finished'

export function dispatchHubSyncFinished(detail: { ok: boolean; message: string; source: 'manual' | 'auto' }): void {
  window.dispatchEvent(new CustomEvent(HUB_SYNC_FINISHED_EVENT, { detail }))
}
