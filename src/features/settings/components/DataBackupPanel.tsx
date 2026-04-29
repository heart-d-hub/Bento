import { clsx } from 'clsx'
import { Download, Upload, RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'

const BENTO_PREFIX = 'bento.'

function getAllBentoData(): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(BENTO_PREFIX)) continue
    try {
      out[key] = JSON.parse(localStorage.getItem(key) ?? 'null')
    } catch {
      out[key] = localStorage.getItem(key)
    }
  }
  return out
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

function estimateLocalStorageSize(): number {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) ?? ''
    if (!key.startsWith(BENTO_PREFIX)) continue
    total += key.length + (localStorage.getItem(key)?.length ?? 0)
  }
  return total * 2 // UTF-16 chars = 2 bytes each
}

export function DataBackupPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [importMsg, setImportMsg] = useState('')
  const [keyCount] = useState(() => {
    let n = 0
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith(BENTO_PREFIX)) n++
    }
    return n
  })
  const [dataSize] = useState(() => estimateLocalStorageSize())

  function handleExport() {
    const data = {
      _meta: { exportedAt: new Date().toISOString(), app: 'BentoPOS', version: 1 },
      ...getAllBentoData(),
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bento-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    setImportStatus('idle')
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Record<string, unknown>
        const keys = Object.keys(parsed).filter((k) => k.startsWith(BENTO_PREFIX))
        if (keys.length === 0) {
          setImportStatus('error')
          setImportMsg('ไม่พบข้อมูล Bento ในไฟล์นี้')
          return
        }
        if (!window.confirm(`นำเข้า ${keys.length} รายการ?\nข้อมูลปัจจุบันในเครื่องจะถูกแทนที่ด้วยข้อมูลจากไฟล์ backup`)) return
        for (const key of keys) {
          localStorage.setItem(key, JSON.stringify(parsed[key]))
        }
        setImportStatus('ok')
        setImportMsg(`นำเข้าสำเร็จ ${keys.length} รายการ — รีเฟรชหน้าเพื่อโหลดข้อมูลใหม่`)
      } catch {
        setImportStatus('error')
        setImportMsg('ไฟล์ไม่ถูกต้อง — ต้องเป็น JSON ที่ส่งออกจาก BentoPOS')
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Status card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <span className="text-sm font-bold text-slate-800">ข้อมูลในเครื่องนี้</span>
        </div>
        <div className="flex flex-wrap gap-6 px-4 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">รายการ</p>
            <p className="mt-0.5 text-2xl font-black text-slate-800">{keyCount}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">ขนาดโดยประมาณ</p>
            <p className="mt-0.5 text-2xl font-black text-slate-800">{formatBytes(dataSize)}</p>
          </div>
        </div>
        <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
          ข้อมูลทั้งหมดเก็บใน localStorage ของเบราว์เซอร์นี้ — ล้างแคชหรือเปลี่ยนเครื่องจะทำให้ข้อมูลหาย
        </p>
      </div>

      {/* Export */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <span className="text-sm font-bold text-slate-800">ส่งออก Backup</span>
        </div>
        <div className="flex items-start justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm text-slate-700">ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ <span className="font-mono font-semibold">.json</span></p>
            <p className="mt-1 text-[11px] text-slate-400">ครอบคลุม: สมาชิก · สต็อก · การขาย · ตั้งค่า · สาขา · ทุกอย่างที่ขึ้นต้นด้วย bento.*</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
          >
            <Download className="size-4" />
            ส่งออก
          </button>
        </div>
      </div>

      {/* Import */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <span className="text-sm font-bold text-slate-800">นำเข้า Backup</span>
        </div>
        <div className="flex items-start justify-between gap-4 px-4 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-700">กู้คืนข้อมูลจากไฟล์ backup ที่ส่งออกก่อนหน้า</p>
            <p className="mt-1 text-[11px] text-amber-600 font-semibold">⚠ ข้อมูลปัจจุบันในเครื่องจะถูกแทนที่</p>
            {importStatus !== 'idle' && (
              <p className={clsx('mt-2 text-[11px] font-semibold', importStatus === 'ok' ? 'text-emerald-600' : 'text-rose-600')}>
                {importMsg}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleImportClick}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
          >
            <Upload className="size-4" />
            นำเข้า
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {/* Reset warning */}
      <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-3">
        <div className="flex items-start gap-2">
          <RotateCcw className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div>
            <p className="text-xs font-semibold text-amber-700">แนะนำให้ส่งออก backup ก่อนอัพเดทโปรแกรม หรือทุกสัปดาห์</p>
            <p className="mt-0.5 text-[11px] text-amber-600">
              ไฟล์ backup สามารถนำไปใช้บนเครื่องอื่นได้ — เหมาะสำหรับย้ายเครื่อง หรือสำรองข้อมูลร้าน
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
