/** โน้ตสั่งงานหน้า home — เก็บเครื่อง + สรุปท้ายวัน (ไม่รวมรายการที่ลบแล้ว) */

export const TASK_PAD_STORAGE_KEY = 'bento-home-task-pad-v1'
export const TASK_PAD_SESSION_DATE_KEY = 'bento-home-task-pad-session-date'
export const TASK_PAD_HISTORY_KEY = 'bento-home-task-pad-history-v1'

export const TASK_PAD_HISTORY_CHANGED_EVENT = 'bento-task-pad-history-changed'

export type TaskPadItem = {
  id: string
  text: string
  done: boolean
  createdAt: number
  completedAt?: number
}

/** หนึ่งวันที่สรุปแล้ว (เฉพาะรายการที่ยังอยู่ในโน้ตตอนปิดวัน — ไม่มีรายการที่กดลบ) */
export type TaskPadDayArchive = {
  dateKey: string
  savedAt: number
  items: Array<{
    text: string
    done: boolean
    createdAt: number
    completedAt?: number
  }>
}

export function dateKeyLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseHistory(raw: string | null): TaskPadDayArchive[] {
  if (!raw) return []
  try {
    const p = JSON.parse(raw) as unknown
    if (!Array.isArray(p)) return []
    return p.filter(
      (x): x is TaskPadDayArchive =>
        typeof x === 'object' &&
        x !== null &&
        typeof (x as TaskPadDayArchive).dateKey === 'string' &&
        typeof (x as TaskPadDayArchive).savedAt === 'number' &&
        Array.isArray((x as TaskPadDayArchive).items),
    )
  } catch {
    return []
  }
}

/**
 * เมื่อวันที่ในเครื่องเปลี่ยน (เทียบกับครั้งล่าสุดที่บันทึก session):
 * สรุปรายการในโน้ตเป็นประวัติของ **วันก่อน** แล้วล้างโน้ต
 * — รายการที่ผู้ใช้ลบไปแล้วไม่ได้อยู่ในโน้ต จึงไม่ถูกเก็บ
 */
export function runTaskPadEndOfDayIfNeeded(): void {
  if (typeof localStorage === 'undefined') return

  const today = dateKeyLocal(new Date())
  const prev = localStorage.getItem(TASK_PAD_SESSION_DATE_KEY)

  if (prev === null) {
    localStorage.setItem(TASK_PAD_SESSION_DATE_KEY, today)
    return
  }
  if (prev === today) return

  let tasks: TaskPadItem[] = []
  try {
    const raw = localStorage.getItem(TASK_PAD_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        tasks = parsed.filter(
          (x): x is TaskPadItem =>
            typeof x === 'object' &&
            x !== null &&
            typeof (x as TaskPadItem).id === 'string' &&
            typeof (x as TaskPadItem).text === 'string' &&
            typeof (x as TaskPadItem).done === 'boolean',
        )
      }
    }
  } catch {
    tasks = []
  }

  if (tasks.length > 0) {
    const history = parseHistory(localStorage.getItem(TASK_PAD_HISTORY_KEY))
    const items = tasks.map(({ text, done, createdAt, completedAt }) => ({
      text,
      done,
      createdAt: typeof createdAt === 'number' ? createdAt : Date.now(),
      completedAt: typeof completedAt === 'number' ? completedAt : undefined,
    }))
    const archive: TaskPadDayArchive = {
      dateKey: prev,
      savedAt: Date.now(),
      items,
    }
    const merged = [...history.filter((h) => h.dateKey !== prev), archive]
    merged.sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    try {
      localStorage.setItem(TASK_PAD_HISTORY_KEY, JSON.stringify(merged))
    } catch {
      /* quota */
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(TASK_PAD_HISTORY_CHANGED_EVENT))
    }
  }

  try {
    localStorage.setItem(TASK_PAD_STORAGE_KEY, JSON.stringify([]))
  } catch {
    /* */
  }
  localStorage.setItem(TASK_PAD_SESSION_DATE_KEY, today)
}

export function loadTasks(): TaskPadItem[] {
  runTaskPadEndOfDayIfNeeded()
  try {
    const raw = localStorage.getItem(TASK_PAD_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (x): x is TaskPadItem =>
          typeof x === 'object' &&
          x !== null &&
          typeof (x as TaskPadItem).id === 'string' &&
          typeof (x as TaskPadItem).text === 'string' &&
          typeof (x as TaskPadItem).done === 'boolean',
      )
      .map((x) => ({
        ...x,
        createdAt: typeof x.createdAt === 'number' ? x.createdAt : Date.now(),
        completedAt: typeof x.completedAt === 'number' ? x.completedAt : undefined,
      }))
  } catch {
    return []
  }
}

export function saveTasks(tasks: TaskPadItem[]): void {
  try {
    localStorage.setItem(TASK_PAD_STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    /* ignore */
  }
}

/** โหลดประวัติรายวัน (เรียก rollover ก่อนเพื่อให้ได้ข้อมูลล่าสุด) */
export function loadTaskPadHistory(): TaskPadDayArchive[] {
  runTaskPadEndOfDayIfNeeded()
  return parseHistory(localStorage.getItem(TASK_PAD_HISTORY_KEY)).sort((a, b) =>
    b.dateKey.localeCompare(a.dateKey),
  )
}

export function formatTaskPadTime(ts: number): string {
  return new Date(ts).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTaskPadDateHeading(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  if (!y || !m || !d) return dateKey
  const dt = new Date(y, m - 1, d, 12, 0, 0)
  return dt.toLocaleDateString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
