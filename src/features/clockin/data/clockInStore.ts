const CLOCKIN_KEY = 'bento_clockin_records'

export type ClockRecord = {
  id: string
  staffName: string
  type: 'in' | 'out'
  at: string    // ISO timestamp
  date: string  // YYYY-MM-DD
  note?: string
}

function isoDateToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function loadClockRecords(): ClockRecord[] {
  try {
    const raw = localStorage.getItem(CLOCKIN_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ClockRecord[]
  } catch {
    return []
  }
}

function saveClockRecords(records: ClockRecord[]): void {
  try {
    localStorage.setItem(CLOCKIN_KEY, JSON.stringify(records))
  } catch { /* ignore */ }
}

export function addClockRecord(rec: Omit<ClockRecord, 'id' | 'date'>): ClockRecord {
  const full: ClockRecord = {
    ...rec,
    id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: isoDateToday(),
  }
  const all = loadClockRecords()
  saveClockRecords([...all, full])
  return full
}

export function deleteClockRecord(id: string): void {
  saveClockRecords(loadClockRecords().filter((r) => r.id !== id))
}
