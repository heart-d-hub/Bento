import { applyHubDataToLocal } from '@/features/sync/applyHubPull'
import {
  loadHubBranchId,
  loadHubLastRevision,
  loadHubLastSyncAt,
  loadHubToken,
  loadHubUrl,
  loadAutoSyncEnabled,
  loadAutoSyncTime1,
  loadAutoSyncTime2,
  saveAutoSyncEnabled,
  saveAutoSyncTime1,
  saveAutoSyncTime2,
  saveHubBranchId,
  saveHubLastRevision,
  saveHubLastSyncAt,
  saveHubToken,
  saveHubUrl,
} from '@/features/sync/hubSyncConfig'
import {
  HUB_SYNC_FINISHED_EVENT,
  runHubFullSyncOperation,
  runHubPullOperation,
  runHubPushOperation,
} from '@/features/sync/hubSyncOperations'
import { hubHealthCheck, hubPull } from '@/features/sync/hubSyncClient'
import { clsx } from 'clsx'
import { Cloud, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300'

function formatLastInfo(): string {
  const r = loadHubLastRevision()
  const t = loadHubLastSyncAt()
  if (!t) return `revision ในเครื่อง: ${r}`
  return `revision ในเครื่อง: ${r} · sync ล่าสุด ${new Date(t).toLocaleString('th-TH')}`
}

export function HubSyncPanel({ className }: { className?: string }) {
  const [url, setUrl] = useState(() => loadHubUrl())
  const [token, setToken] = useState(() => loadHubToken())
  const [branchId, setBranchId] = useState(() => loadHubBranchId())
  const [autoEnabled, setAutoEnabled] = useState(() => loadAutoSyncEnabled())
  const [time1, setTime1] = useState(() => loadAutoSyncTime1())
  const [time2, setTime2] = useState(() => loadAutoSyncTime2())
  const [busy, setBusy] = useState<'idle' | 'ping' | 'pull' | 'push' | 'full'>('idle')
  const [msg, setMsg] = useState<string | null>(null)
  const [lastInfo, setLastInfo] = useState<string>(() => formatLastInfo())

  const refreshLastInfo = useCallback(() => setLastInfo(formatLastInfo()), [])

  useEffect(() => {
    const onFin = (e: Event) => {
      const ce = e as CustomEvent<{ ok: boolean; message: string; source: 'manual' | 'auto' }>
      refreshLastInfo()
      if (ce.detail?.source === 'auto' && ce.detail.message) {
        setMsg(`[อัตโนมัติ] ${ce.detail.message}`)
      }
    }
    window.addEventListener(HUB_SYNC_FINISHED_EVENT, onFin)
    return () => window.removeEventListener(HUB_SYNC_FINISHED_EVENT, onFin)
  }, [refreshLastInfo])

  const persistConfig = useCallback(() => {
    saveHubUrl(url)
    saveHubToken(token)
    saveHubBranchId(branchId)
    saveAutoSyncEnabled(autoEnabled)
    saveAutoSyncTime1(time1)
    saveAutoSyncTime2(time2)
  }, [url, token, branchId, autoEnabled, time1, time2])

  const handlePing = useCallback(async () => {
    persistConfig()
    const u = url.trim()
    if (!u) {
      setMsg('กรุณาใส่ URL ของเซิร์ฟเวอร์กลาง')
      return
    }
    setBusy('ping')
    setMsg(null)
    const res = await hubHealthCheck(u)
    setBusy('idle')
    if (res.ok) {
      setMsg(`เชื่อมต่อได้ · revision บนกลาง: ${res.revision ?? '—'}`)
    } else {
      setMsg(`เชื่อมต่อไม่ได้: ${res.error ?? 'unknown'}`)
    }
  }, [url, persistConfig])

  const handlePull = useCallback(async () => {
    persistConfig()
    setBusy('pull')
    setMsg(null)
    const res = await runHubPullOperation()
    setBusy('idle')
    refreshLastInfo()
    if (!res.ok) {
      setMsg(res.error)
      return
    }
    setMsg(res.message)
  }, [persistConfig, refreshLastInfo])

  const handlePush = useCallback(async () => {
    persistConfig()
    setBusy('push')
    setMsg(null)
    const res = await runHubPushOperation()
    setBusy('idle')
    refreshLastInfo()
    if (!res.ok) {
      setMsg(res.error)
      return
    }
    setMsg(res.message)
  }, [persistConfig, refreshLastInfo])

  const handleFullSync = useCallback(async () => {
    persistConfig()
    setBusy('full')
    setMsg(null)
    const res = await runHubFullSyncOperation()
    setBusy('idle')
    refreshLastInfo()
    if (!res.ok) {
      setMsg(res.error)
      return
    }
    setMsg(res.message)
  }, [persistConfig, refreshLastInfo])

  const handleForcePullFromConflict = useCallback(async () => {
    persistConfig()
    const u = url.trim()
    const tok = token.trim()
    if (!u || !tok) return
    setBusy('pull')
    setMsg(null)
    const res = await hubPull(u, tok)
    setBusy('idle')
    if (!res.ok) {
      setMsg(`ดึงไม่สำเร็จ: ${res.error}`)
      return
    }
    const d = res.data
    applyHubDataToLocal({
      productMaster: d.productMaster,
      vehicleCatalog: d.vehicleCatalog,
    })
    saveHubLastRevision(d.revision)
    saveHubLastSyncAt(new Date().toISOString())
    refreshLastInfo()
    setMsg('ดึงทับเครื่องนี้ตามกลางแล้ว')
  }, [url, token, persistConfig, refreshLastInfo])

  const loading = busy !== 'idle'

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="rounded-2xl border border-sky-200/90 bg-sky-50/50 px-4 py-3 text-sm text-sky-950">
        <p className="font-medium">เซิร์ฟเวอร์กลาง (ทดสอบ)</p>
        <p className="mt-1 text-xs leading-relaxed text-sky-900/90">
          ใช้สำหรับ sync แฟ้มสินค้าและแคตตาล็อกรถระหว่างเครื่อง — รันโปรแกรม hub บน PC ที่เป็นกลาง (หรือ VPS
          ภายหลัง) แล้วใส่ URL เช่น <span className="font-mono">http://192.168.1.50:3847</span>
        </p>
        <p className="mt-2 text-xs text-sky-900/85">
          Sync อัตโนมัติทำงานเมื่อโปรแกรมเปิดอยู่เท่านั้น — ถ้าปิดแอปช่วงเวลาที่ตั้ง จะไม่ sync จนกว่าจะเปิดใหม่หรือกดปุ่ม
          Sync เอง
        </p>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-slate-600">URL กลาง</span>
        <input
          className={inputClass}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://IP:3847"
          autoComplete="off"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-600">โทเคน (ต้องตรงกับ BENTO_HUB_TOKEN บนเซิร์ฟเวอร์)</span>
        <input
          className={clsx(inputClass, 'font-mono')}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="bento-dev-hub-token"
          autoComplete="off"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-600">รหัสสาขา (branchId)</span>
        <input
          className={inputClass}
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          placeholder="เช่น branch-a, ร้านสาขา-1"
          autoComplete="off"
        />
      </label>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            className="mt-1 rounded border-slate-300"
            checked={autoEnabled}
            onChange={(e) => {
              const v = e.target.checked
              setAutoEnabled(v)
              saveAutoSyncEnabled(v)
            }}
          />
          <span>
            <span className="text-sm font-medium text-slate-900">Sync อัตโนมัติวันละ 2 ครั้ง</span>
            <span className="mt-0.5 block text-xs text-slate-600">
              ดึงจากกลางแล้วส่งขึ้นกลาง (เต็มรอบ) ตามเวลาที่ตั้ง — ต้องมี URL / โทเคน / รหัสสาขา
            </span>
          </span>
        </label>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">รอบที่ 1</span>
            <input
              type="time"
              className={inputClass}
              value={time1}
              onChange={(e) => {
                const v = e.target.value
                setTime1(v)
                saveAutoSyncTime1(v)
              }}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">รอบที่ 2</span>
            <input
              type="time"
              className={inputClass}
              value={time2}
              onChange={(e) => {
                const v = e.target.value
                setTime2(v)
                saveAutoSyncTime2(v)
              }}
            />
          </label>
        </div>
      </div>

      <p className="text-xs text-slate-500">{lastInfo}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={handlePing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {busy === 'ping' ? <Loader2 className="size-4 animate-spin" /> : <Cloud className="size-4" />}
          ทดสอบการเชื่อมต่อ
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handleFullSync}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy === 'full' ? <Loader2 className="size-4 animate-spin" /> : null}
          Sync ตอนนี้ (ดึง + ส่ง)
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          disabled={loading}
          onClick={handlePull}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100 disabled:opacity-50"
        >
          {busy === 'pull' ? <Loader2 className="size-4 animate-spin" /> : null}
          ดึงจากกลางอย่างเดียว
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handlePush}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy === 'push' ? <Loader2 className="size-4 animate-spin" /> : null}
          ส่งขึ้นกลางอย่างเดียว
        </button>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={handleForcePullFromConflict}
        className="text-xs font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
      >
        ดึงจากกลางทับเครื่องนี้ (กรณีชน revision — ทับข้อมูลในเครื่อง)
      </button>

      {msg ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{msg}</p>
      ) : null}
    </div>
  )
}
