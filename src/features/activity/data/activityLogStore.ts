export type ActivityCategory = 'auth' | 'pos' | 'stock' | 'member' | 'settings'

export type ActivityLogEntry = {
  id: string
  at: string
  actor: string
  category: ActivityCategory
  detail: string
}

const KEY = 'bento.activity.logs.v1'
const MAX_ROWS = 300
export const ACTIVITY_LOG_CHANGED_EVENT = 'bento-activity-log-changed'

export function loadActivityLogs(): ActivityLogEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ActivityLogEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function appendActivityLog(entry: Omit<ActivityLogEntry, 'id' | 'at'>): ActivityLogEntry {
  const full: ActivityLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
  }
  try {
    const next = [full, ...loadActivityLogs()].slice(0, MAX_ROWS)
    localStorage.setItem(KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(ACTIVITY_LOG_CHANGED_EVENT))
  } catch {
    // ignore
  }
  return full
}
