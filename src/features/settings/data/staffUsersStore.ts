import { MOCK_STAFF_USERS, type StaffUser } from '@/features/settings/data/mockStaffUsers'

const LS_KEY = 'bento.staff.users.v1'

export const STAFF_USERS_CHANGED_EVENT = 'bento:staff-users:changed'

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
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return [...MOCK_STAFF_USERS]
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [...MOCK_STAFF_USERS]
    const normalized = dedupeStaffUsersById(
      parsed.map(normalizeStaffUser).filter((u): u is StaffUser => Boolean(u)),
    )
    return normalized.length ? normalized : [...MOCK_STAFF_USERS]
  } catch {
    return [...MOCK_STAFF_USERS]
  }
}

export function saveStaffUsers(next: StaffUser[]): void {
  try {
    const deduped = dedupeStaffUsersById(next)
    localStorage.setItem(LS_KEY, JSON.stringify(deduped))
    window.dispatchEvent(new CustomEvent(STAFF_USERS_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}
