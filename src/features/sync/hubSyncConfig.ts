const KEY_URL = 'bento.sync.hubUrl'
const KEY_TOKEN = 'bento.sync.hubToken'
const KEY_BRANCH = 'bento.sync.hubBranchId'
const KEY_REVISION = 'bento.sync.hubLastRevision'
const KEY_SYNC_AT = 'bento.sync.hubLastSyncAt'

export function loadHubUrl(): string {
  try {
    return (localStorage.getItem(KEY_URL) ?? '').trim()
  } catch {
    return ''
  }
}

export function saveHubUrl(url: string): void {
  const t = url.trim()
  if (!t) localStorage.removeItem(KEY_URL)
  else localStorage.setItem(KEY_URL, t)
}

export function loadHubToken(): string {
  try {
    return (localStorage.getItem(KEY_TOKEN) ?? '').trim()
  } catch {
    return ''
  }
}

export function saveHubToken(token: string): void {
  const t = token.trim()
  if (!t) localStorage.removeItem(KEY_TOKEN)
  else localStorage.setItem(KEY_TOKEN, t)
}

export function loadHubBranchId(): string {
  try {
    return (localStorage.getItem(KEY_BRANCH) ?? '').trim()
  } catch {
    return ''
  }
}

export function saveHubBranchId(branchId: string): void {
  const t = branchId.trim()
  if (!t) localStorage.removeItem(KEY_BRANCH)
  else localStorage.setItem(KEY_BRANCH, t)
}

export function loadHubLastRevision(): number {
  try {
    const n = Number(localStorage.getItem(KEY_REVISION))
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

export function saveHubLastRevision(revision: number): void {
  if (!Number.isFinite(revision) || revision < 0) {
    localStorage.removeItem(KEY_REVISION)
    return
  }
  localStorage.setItem(KEY_REVISION, String(revision))
}

export function loadHubLastSyncAt(): string | null {
  try {
    const s = localStorage.getItem(KEY_SYNC_AT)
    return s?.trim() || null
  } catch {
    return null
  }
}

export function saveHubLastSyncAt(iso: string): void {
  localStorage.setItem(KEY_SYNC_AT, iso)
}

const KEY_AUTO = 'bento.sync.autoEnabled'
const KEY_TIME1 = 'bento.sync.autoTime1'
const KEY_TIME2 = 'bento.sync.autoTime2'
const KEY_LAST_SLOT = 'bento.sync.lastAutoSlotKey'

export function loadAutoSyncEnabled(): boolean {
  try {
    return localStorage.getItem(KEY_AUTO) === '1'
  } catch {
    return false
  }
}

export function saveAutoSyncEnabled(on: boolean): void {
  if (on) localStorage.setItem(KEY_AUTO, '1')
  else localStorage.removeItem(KEY_AUTO)
}

/** ค่าเริ่มต้น 09:00 / 21:00 */
export function loadAutoSyncTime1(): string {
  try {
    const t = (localStorage.getItem(KEY_TIME1) ?? '').trim()
    return normalizeTimeHHmm(t) ?? '09:00'
  } catch {
    return '09:00'
  }
}

export function loadAutoSyncTime2(): string {
  try {
    const t = (localStorage.getItem(KEY_TIME2) ?? '').trim()
    return normalizeTimeHHmm(t) ?? '21:00'
  } catch {
    return '21:00'
  }
}

export function saveAutoSyncTime1(hhmm: string): void {
  const n = normalizeTimeHHmm(hhmm)
  if (n) localStorage.setItem(KEY_TIME1, n)
  else localStorage.removeItem(KEY_TIME1)
}

export function saveAutoSyncTime2(hhmm: string): void {
  const n = normalizeTimeHHmm(hhmm)
  if (n) localStorage.setItem(KEY_TIME2, n)
  else localStorage.removeItem(KEY_TIME2)
}

function normalizeTimeHHmm(s: string): string | null {
  const t = s.trim()
  if (!t) return null
  const m = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!m) return null
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)))
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)))
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function loadLastAutoSlotKey(): string | null {
  try {
    const s = localStorage.getItem(KEY_LAST_SLOT)
    return s?.trim() || null
  } catch {
    return null
  }
}

export function saveLastAutoSlotKey(key: string | null): void {
  if (!key) localStorage.removeItem(KEY_LAST_SLOT)
  else localStorage.setItem(KEY_LAST_SLOT, key)
}
