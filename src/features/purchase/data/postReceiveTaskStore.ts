/**
 * Post-receive worklist: tracks the 3 follow-up jobs for each receive batch
 *  (1) พิมพ์ป้าย — push received SKUs into label print queue
 *  (2) จัดเก็บ — putaway: confirm storage location for each SKU
 *  (3) ทบทวนราคาขาย — review margin after new cost
 *
 * Persisted in localStorage keyed by batchId so staff can resume after a break.
 */

const STORAGE_KEY = 'bento.postreceive.tasks.v1'

export const POST_RECEIVE_TASK_CHANGED_EVENT = 'bento-postreceive-task-changed'

export type PostReceiveSku = {
  sku: string
  productId: string
  name: string
  qty: number
  unitCost: number
  /** master.sellPrice ตอนรับของ — snapshot ก่อน user แก้ */
  sellPriceAtReceive: number
  /** ที่เก็บปัจจุบัน (master.storageLocations[0]) — ถ้ายังไม่มีจะให้ตั้งใหม่ในขั้น putaway */
  currentLocation?: string
  /** ผู้ใช้แตะ checkbox ส่งคิวพิมพ์ป้าย */
  labelQueued: boolean
  /** ผู้ใช้ติ๊กว่าเก็บเข้าที่แล้ว */
  storedAway: boolean
  /** ผู้ใช้ติ๊กว่าทบทวนราคาแล้ว (ดูแล้ว ไม่ว่าจะแก้หรือไม่) */
  priceReviewed: boolean
  /** ผู้ใช้แก้ที่เก็บใน worklist ก่อนติ๊ก stored */
  newLocation?: string
  /** ผู้ใช้แก้ราคาขายใหม่ใน worklist */
  newSellPrice?: number
}

export type PostReceiveTask = {
  batchId: string
  poId: string
  poNo: string
  supplierName: string
  receivedAt: string
  skus: PostReceiveSku[]
  completedAt?: string
}

export function loadPostReceiveTasks(): PostReceiveTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as PostReceiveTask[]
  } catch {
    return []
  }
}

function savePostReceiveTasks(tasks: PostReceiveTask[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(POST_RECEIVE_TASK_CHANGED_EVENT))
}

export function getPostReceiveTask(batchId: string): PostReceiveTask | undefined {
  return loadPostReceiveTasks().find((t) => t.batchId === batchId)
}

export function upsertPostReceiveTask(task: PostReceiveTask): void {
  const all = loadPostReceiveTasks()
  const idx = all.findIndex((t) => t.batchId === task.batchId)
  if (idx >= 0) all[idx] = task
  else all.unshift(task)
  // prune completed tasks older than 30 days to avoid unbounded growth
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const next = all.filter((t) => {
    if (!t.completedAt) return true
    return new Date(t.completedAt).getTime() >= cutoff
  })
  savePostReceiveTasks(next)
}

export function pendingPostReceiveTasks(): PostReceiveTask[] {
  return loadPostReceiveTasks().filter((t) => !t.completedAt)
}

/** True เมื่อ SKU ทุกตัวในงานครบทั้ง 3 ขั้น (label, putaway, price) */
export function isTaskFullyDone(task: PostReceiveTask): boolean {
  if (task.skus.length === 0) return true
  return task.skus.every((s) => s.labelQueued && s.storedAway && s.priceReviewed)
}
