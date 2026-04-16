import {
  dispatchHubSyncFinished,
  runHubFullSyncOperation,
} from '@/features/sync/hubSyncOperations'
import {
  loadAutoSyncEnabled,
  loadAutoSyncTime1,
  loadAutoSyncTime2,
  loadHubBranchId,
  loadHubToken,
  loadHubUrl,
  loadLastAutoSlotKey,
  saveLastAutoSlotKey,
} from '@/features/sync/hubSyncConfig'
import { useEffect, useRef } from 'react'

const TICK_MS = 45_000

function currentSlotKey(): string {
  const n = new Date()
  const y = n.getFullYear()
  const mo = String(n.getMonth() + 1).padStart(2, '0')
  const d = String(n.getDate()).padStart(2, '0')
  const hh = String(n.getHours()).padStart(2, '0')
  const mm = String(n.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${d}T${hh}:${mm}`
}

function currentHHmm(): string {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

/**
 * รันในพื้นหลัง — sync อัตโนมัติตามเวลาที่ตั้ง (เฉพาะเมื่อแอปเปิดอยู่)
 */
export function HubAutoSync() {
  const running = useRef(false)

  useEffect(() => {
    const tick = async () => {
      if (running.current) return
      if (!loadAutoSyncEnabled()) return
      const u = loadHubUrl().trim()
      const tok = loadHubToken().trim()
      const bid = loadHubBranchId().trim()
      if (!u || !tok || !bid) return

      const t1 = loadAutoSyncTime1()
      const t2 = loadAutoSyncTime2()
      const nowHm = currentHHmm()
      if (nowHm !== t1 && nowHm !== t2) return

      const slot = currentSlotKey()
      if (loadLastAutoSlotKey() === slot) return

      running.current = true
      const result = await runHubFullSyncOperation()
      running.current = false
      if (result.ok) saveLastAutoSlotKey(slot)

      dispatchHubSyncFinished({
        ok: result.ok,
        message: result.ok ? result.message : result.error,
        source: 'auto',
      })
    }

    const id = window.setInterval(() => {
      void tick()
    }, TICK_MS)
    void tick()
    return () => window.clearInterval(id)
  }, [])

  return null
}
