import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'

/** ตรวจว่า Rust/sqlx เชื่อม Postgres ได้ (ต้องมี DATABASE_URL ใน .env) */
export async function pingDatabase(): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isTauri()) return { ok: true }
  try {
    await invoke('database_ping')
    return { ok: true }
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e)
    const message = raw.length > 220 ? `${raw.slice(0, 220)}…` : raw
    return { ok: false, message }
  }
}
