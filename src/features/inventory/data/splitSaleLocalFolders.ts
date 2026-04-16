import {
  canAssignProductToSplitSaleFolder,
  getSplitSaleFolderMatchTagIdSet,
} from '@/features/inventory/data/productTagsRegistry'
import { getProductMasterList } from '@/features/inventory/data/productMasterData'

const FOLDERS_KEY = 'bento_split_sale_local_folders_v1'
const ASSIGN_KEY = 'bento_split_sale_folder_assign_v1'

/** หมวดจัดกลุ่มเฉพาะหน้า «สินค้าแบ่งขาย» — ไม่ผูกกับจัดการหมวดหมู่หลัก */
export type SplitSaleLocalFolder = {
  id: string
  name: string
  /** แท็กที่หมวดนี้รองรับ — ต้องสอดคล้องกับแท็ก `splitSaleFolderMatch` บนสินค้า */
  tagIds?: string[]
}

function newFolderId() {
  return `split-folder-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`
}

function readAssignmentsFromStorage(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ASSIGN_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string' && v.trim()) out[k] = v.trim()
    }
    return out
  } catch {
    return {}
  }
}

function saveAssignments(map: Record<string, string>) {
  localStorage.setItem(ASSIGN_KEY, JSON.stringify(map))
}

/** ลบการจัดหมวดที่ไม่ตรงกฎแท็ก (สินค้ามีแท็กจับคู่ แต่หมวดไม่มีแท็กนั้น) */
function reconcileSplitSaleFolderAssignments(): Record<string, string> {
  const folders = loadSplitSaleLocalFolders()
  const folderById = new Map(folders.map((f) => [f.id, f]))
  const match = getSplitSaleFolderMatchTagIdSet()
  const masterList = getProductMasterList()
  const prodById = new Map(masterList.map((p) => [p.id, p]))
  const assign = readAssignmentsFromStorage()
  const next: Record<string, string> = { ...assign }
  let dirty = false
  for (const [pid, fid] of Object.entries(assign)) {
    const f = folderById.get(fid)
    const p = prodById.get(pid)
    if (!f || !p) {
      delete next[pid]
      dirty = true
      continue
    }
    if (!canAssignProductToSplitSaleFolder(p.productTagIds, f, match)) {
      delete next[pid]
      dirty = true
    }
  }
  if (dirty) saveAssignments(next)
  return next
}

export function loadSplitSaleLocalFolders(): SplitSaleLocalFolder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: SplitSaleLocalFolder[] = []
    for (const x of parsed) {
      if (!x || typeof x !== 'object') continue
      const o = x as Record<string, unknown>
      if (typeof o.id !== 'string' || typeof o.name !== 'string') continue
      const name = o.name.trim()
      if (!name) continue
      let tagIds: string[] | undefined
      if (Array.isArray(o.tagIds)) {
        const tid = o.tagIds
          .filter((u): u is string => typeof u === 'string')
          .map((s) => s.trim())
          .filter(Boolean)
        const uniq = [...new Set(tid)]
        if (uniq.length) tagIds = uniq
      }
      out.push({ id: o.id.trim(), name, tagIds })
    }
    return out
  } catch {
    return []
  }
}

function saveFolders(list: SplitSaleLocalFolder[]) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(list))
}

/** บันทึกลำดับหมวดทั้งชุด (เช่น หลังลากสลับในแถบซ้าย) */
export function saveSplitSaleLocalFolders(list: SplitSaleLocalFolder[]) {
  saveFolders(list)
  reconcileSplitSaleFolderAssignments()
}

export function loadSplitSaleFolderAssignments(): Record<string, string> {
  return reconcileSplitSaleFolderAssignments()
}

export function addSplitSaleLocalFolder(name: string, tagIds?: string[]): SplitSaleLocalFolder | null {
  const t = name.trim()
  if (!t) return null
  const list = loadSplitSaleLocalFolders()
  const id = newFolderId()
  const uniq = tagIds?.length ? [...new Set(tagIds.filter((x) => x && x.trim()))] : []
  const folder: SplitSaleLocalFolder = {
    id,
    name: t,
    tagIds: uniq.length ? uniq : undefined,
  }
  saveFolders([...list, folder])
  return folder
}

export function updateSplitSaleLocalFolderTagIds(folderId: string, tagIds: string[]): void {
  const list = loadSplitSaleLocalFolders()
  const idx = list.findIndex((x) => x.id === folderId)
  if (idx < 0) return
  const uniq = [...new Set(tagIds.map((x) => x.trim()).filter(Boolean))]
  const next = [...list]
  next[idx] = { ...next[idx], tagIds: uniq.length ? uniq : undefined }
  saveFolders(next)
  reconcileSplitSaleFolderAssignments()
}

/** เปลี่ยนเฉพาะชื่อหมวด */
export function renameSplitSaleLocalFolder(folderId: string, name: string): boolean {
  const t = name.trim()
  if (!t) return false
  const list = loadSplitSaleLocalFolders()
  const idx = list.findIndex((x) => x.id === folderId)
  if (idx < 0) return false
  const next = [...list]
  next[idx] = { ...next[idx], name: t }
  saveFolders(next)
  return true
}

export function removeSplitSaleLocalFolder(folderId: string): void {
  const list = loadSplitSaleLocalFolders().filter((x) => x.id !== folderId)
  saveFolders(list)
  const assign = readAssignmentsFromStorage()
  const next = { ...assign }
  for (const [pid, fid] of Object.entries(assign)) {
    if (fid === folderId) delete next[pid]
  }
  saveAssignments(next)
}

/** @returns false เมื่อหมวดไม่รองรับแท็กจับคู่ของสินค้า */
export function setSplitSaleProductFolder(productId: string, folderId: string | null): boolean {
  if (folderId == null || folderId === '') {
    const next = { ...readAssignmentsFromStorage() }
    delete next[productId]
    saveAssignments(next)
    return true
  }
  const folders = loadSplitSaleLocalFolders()
  const folder = folders.find((f) => f.id === folderId)
  if (!folder) return false
  const master = getProductMasterList().find((p) => p.id === productId)
  const match = getSplitSaleFolderMatchTagIdSet()
  if (!canAssignProductToSplitSaleFolder(master?.productTagIds, folder, match)) {
    return false
  }
  const next = { ...readAssignmentsFromStorage(), [productId]: folderId }
  saveAssignments(next)
  return true
}
