import { isTauri } from '@/features/desktop/isTauri'
import { MOCK_STAFF_USERS, type StaffUser } from '@/features/settings/data/mockStaffUsers'
import { invoke } from '@tauri-apps/api/core'

const LS_KEY = 'bento.staff.users.v1'
const STAFF_USERS_DB_DEBOUNCE_MS = 800

export const STAFF_USERS_CHANGED_EVENT = 'bento:staff-users:changed'
let staffUsersMemoryCache: StaffUser[] | null = null
let staffUsersDbDebounceTimer: number | null = null
let staffUsersDbPending: StaffUser[] | null = null

function hasNonDefaultStaffUsers(users: StaffUser[]): boolean {
  if (users.length !== MOCK_STAFF_USERS.length) return true
  const byUsername = new Map(users.map((u) => [u.username.trim().toLowerCase(), u]))
  for (const base of MOCK_STAFF_USERS) {
    const u = byUsername.get(base.username.trim().toLowerCase())
    if (!u) return true
    if (u.password !== base.password || u.status !== base.status || u.displayNamePos !== base.displayNamePos) {
      return true
    }
  }
  return false
}

/** กันซ้ำ id (เช่น จาก state ถูกอัปเดตสองรอบ) */
function dedupeStaffUsersById(users: StaffUser[]): StaffUser[] {
  const seen = new Set<string>()
  return users.filter((u) => {
    if (!u.id || seen.has(u.id)) return false
    seen.add(u.id)
    return true
  })
}

function normalizeStaffUser(raw: unknown): StaffUser | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.username !== 'string') return null
  return {
    id: r.id,
    username: r.username,
    displayNamePos: typeof r.displayNamePos === 'string' ? r.displayNamePos : '',
    nationalId: typeof r.nationalId === 'string' ? r.nationalId : '',
    photoDataUrl: typeof r.photoDataUrl === 'string' || r.photoDataUrl === null ? (r.photoDataUrl as string | null) : null,
    password: typeof r.password === 'string' ? r.password : '',
    role: typeof r.role === 'string' ? r.role : '',
    isAdmin: r.isAdmin === true,
    startDate: typeof r.startDate === 'string' ? r.startDate : '',
    status: r.status === 'active' || r.status === 'inactive' ? r.status : 'active',
  }
}

export function loadStaffUsers(): StaffUser[] {
  if (staffUsersMemoryCache) return [...staffUsersMemoryCache]
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return [...MOCK_STAFF_USERS]
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [...MOCK_STAFF_USERS]
    const normalized = dedupeStaffUsersById(
      parsed.map(normalizeStaffUser).filter((u): u is StaffUser => Boolean(u)),
    )
    if (!normalized.length) return [...MOCK_STAFF_USERS]
    staffUsersMemoryCache = normalized
    return [...normalized]
  } catch {
    return [...MOCK_STAFF_USERS]
  }
}

async function persistStaffUsersToDb(users: StaffUser[]): Promise<void> {
  const rows = JSON.parse(JSON.stringify(users)) as unknown[]
  await invoke('staff_users_replace_all', { rows })
}

function schedulePersistStaffUsersToDb(users: StaffUser[]): void {
  if (!isTauri()) return
  staffUsersDbPending = users
  if (staffUsersDbDebounceTimer !== null) {
    clearTimeout(staffUsersDbDebounceTimer)
  }
  staffUsersDbDebounceTimer = window.setTimeout(() => {
    staffUsersDbDebounceTimer = null
    const snap = staffUsersDbPending
    staffUsersDbPending = null
    if (!snap) return
    void persistStaffUsersToDb(snap).catch((e) => {
      console.error('[staff-users] persistStaffUsersToDb failed', e)
    })
  }, STAFF_USERS_DB_DEBOUNCE_MS)
}

/** บันทึกลง Postgres ทันที (หลังสร้าง/แก้ไขผู้ใช้ — กัน debounce ยังไม่ทันก่อนไปหน้า login) */
export function flushStaffUsersDbSave(): Promise<void> {
  if (staffUsersDbDebounceTimer !== null) {
    clearTimeout(staffUsersDbDebounceTimer)
    staffUsersDbDebounceTimer = null
  }
  if (!isTauri()) {
    staffUsersDbPending = null
    return Promise.resolve()
  }
  const snap = staffUsersDbPending ?? staffUsersMemoryCache
  staffUsersDbPending = null
  if (!snap || snap.length === 0) return Promise.resolve()
  return persistStaffUsersToDb(snap).catch((e) => {
    console.error('[staff-users] flushStaffUsersDbSave failed', e)
    throw e
  })
}

function mergeStaffUsersFromLocalAndDb(local: StaffUser[], fromDb: StaffUser[]): StaffUser[] {
  const byKey = new Map(fromDb.map((u) => [u.username.trim().toLowerCase(), u]))
  for (const u of local) {
    const k = u.username.trim().toLowerCase()
    if (!byKey.has(k)) byKey.set(k, u)
  }
  return dedupeStaffUsersById([...byKey.values()])
}

export async function hydrateStaffUsersFromDb(): Promise<StaffUser[]> {
  if (!isTauri()) return loadStaffUsers()
  try {
    const local = loadStaffUsers()
    const rows = await invoke<unknown[]>('staff_users_load')
    if (!Array.isArray(rows) || rows.length === 0) {
      // Bootstrap DB with current local users so dev/release share one source.
      if (local.length > 0 && hasNonDefaultStaffUsers(local)) {
        void persistStaffUsersToDb(local).catch((e) => {
          console.error('[staff-users] bootstrap persistStaffUsersToDb failed', e)
        })
      }
      return local
    }
    const normalized = dedupeStaffUsersById(rows.map(normalizeStaffUser).filter((u): u is StaffUser => Boolean(u)))
    if (!normalized.length) return loadStaffUsers()

    // Legacy recovery: if DB still has default users but local has custom users,
    // keep local users and backfill DB once so login can find newly created accounts.
    if (hasNonDefaultStaffUsers(local) && !hasNonDefaultStaffUsers(normalized)) {
      staffUsersMemoryCache = local
      localStorage.setItem(LS_KEY, JSON.stringify(local))
      void persistStaffUsersToDb(local).catch((e) => {
        console.error('[staff-users] backfill DB from local failed', e)
      })
      window.dispatchEvent(new CustomEvent(STAFF_USERS_CHANGED_EVENT))
      return [...local]
    }

    // DB อาจยังไม่ทัน sync หลังสร้าง user ใหม่ — รวม user ที่มีแค่ใน local เข้าไป
    const merged = mergeStaffUsersFromLocalAndDb(local, normalized)
    if (merged.length > normalized.length) {
      staffUsersMemoryCache = merged
      localStorage.setItem(LS_KEY, JSON.stringify(merged))
      void persistStaffUsersToDb(merged).catch((e) => {
        console.error('[staff-users] merge persist failed', e)
      })
      window.dispatchEvent(new CustomEvent(STAFF_USERS_CHANGED_EVENT))
      return [...merged]
    }

    staffUsersMemoryCache = normalized
    localStorage.setItem(LS_KEY, JSON.stringify(normalized))
    window.dispatchEvent(new CustomEvent(STAFF_USERS_CHANGED_EVENT))
    return [...normalized]
  } catch (e) {
    console.error('[staff-users] hydrateStaffUsersFromDb failed', e)
    return loadStaffUsers()
  }
}

export function saveStaffUsers(next: StaffUser[]): void {
  try {
    const deduped = dedupeStaffUsersById(next)
    staffUsersMemoryCache = deduped
    localStorage.setItem(LS_KEY, JSON.stringify(deduped))
    schedulePersistStaffUsersToDb(deduped)
    window.dispatchEvent(new CustomEvent(STAFF_USERS_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}

export type StaffUsersDebugSnapshot = {
  localCount: number
  memoryCount: number
  usernames: string[]
}

export function getStaffUsersDebugSnapshot(): StaffUsersDebugSnapshot {
  let localCount = 0
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) localCount = parsed.length
    }
  } catch {
    /* ignore */
  }
  const active = loadStaffUsers()
  return {
    localCount,
    memoryCount: staffUsersMemoryCache?.length ?? 0,
    usernames: active.map((u) => u.username),
  }
}
