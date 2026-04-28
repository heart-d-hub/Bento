import { useEffect, useRef, useState } from 'react'
import {
  CFD_STATE_KEY,
  CFD_VIDEO_KEY,
  readCfdSettings,
  readCfdState,
  readCfdVideoPath,
  type CfdLine,
  type CfdState,
  type CfdSettings,
} from './cfdBridge'
import { promptPayDataUrl } from '@/features/bank/promptPayQr'

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/* ── Clock ─────────────────────────────────────────────────────────── */
function DigitalClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const hh = time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const date = time.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="text-right leading-tight">
      <div className="text-2xl font-mono font-black tabular-nums tracking-widest text-orange-500">{hh}</div>
      <div className="mt-0.5 text-[11px] font-medium text-slate-400 tracking-wide">{date}</div>
    </div>
  )
}

/* ── Idle ──────────────────────────────────────────────────────────── */
function IdleScreen({ settings }: { settings: CfdSettings }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 select-none">
      {/* icon */}
      <div className="relative flex size-28 items-center justify-center rounded-full border-2 border-orange-200 bg-orange-50 shadow-lg shadow-orange-100">
        <div className="absolute inset-0 rounded-full bg-orange-400/10 blur-2xl animate-pulse" />
        <svg viewBox="0 0 24 24" className="relative size-14 text-orange-500" fill="none" stroke="currentColor" strokeWidth={1.25}>
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      </div>

      {/* store name */}
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-black tracking-tight text-slate-900">{settings.storeName}</h1>
        <div className="mx-auto h-0.5 w-20 rounded-full bg-orange-400" />
        <p className="text-xl font-light tracking-widest text-slate-500">{settings.tagline}</p>
      </div>

      {/* ready dot */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
        พร้อมให้บริการ
      </div>
    </div>
  )
}

/* ── Order row ─────────────────────────────────────────────────────── */
function OrderLine({ line, index }: { line: CfdLine; index: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm hover:border-orange-200 transition">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-xs font-bold text-orange-500">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800 leading-snug">{line.name}</p>
        <p className="mt-0.5 text-xs text-slate-400">
          {line.qty}&nbsp;{line.unitLabel}&nbsp;×&nbsp;฿{fmt(line.unitPrice)}
        </p>
      </div>
      <span className="shrink-0 text-base font-bold tabular-nums text-slate-800">
        ฿{fmt(line.lineTotal)}
      </span>
    </div>
  )
}

/* ── Active ────────────────────────────────────────────────────────── */
function ActiveScreen({ state }: { state: CfdState }) {
  const linesRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (linesRef.current) linesRef.current.scrollTop = linesRef.current.scrollHeight
  }, [state.lines.length])

  return (
    <div className="flex h-full flex-col gap-3">
      {/* member greeting */}
      {state.memberName && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2.5">
          <span className="text-xl">👋</span>
          <span className="text-sm text-slate-700">
            สวัสดีคุณ <strong className="text-orange-600">{state.memberName}</strong>
          </span>
        </div>
      )}

      {/* lines */}
      <div
        ref={linesRef}
        className="flex-1 space-y-1.5 overflow-y-auto pr-0.5"
        style={{ scrollbarWidth: 'none' }}
      >
        {state.lines.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-slate-400">
            ยังไม่มีรายการ
          </div>
        ) : (
          state.lines.map((line, i) => <OrderLine key={i} line={line} index={i} />)
        )}
      </div>

      {/* totals */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">ราคารวม</span>
            <span className="tabular-nums text-slate-700">฿{fmt(state.subtotal)}</span>
          </div>
          {state.discountAmt > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">ส่วนลด</span>
              <span className="tabular-nums text-rose-500">-฿{fmt(state.discountAmt)}</span>
            </div>
          )}
          {state.vatAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">VAT 7%</span>
              <span className="tabular-nums text-slate-600">฿{fmt(state.vatAmount)}</span>
            </div>
          )}
        </div>

        {/* grand total */}
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-orange-500 px-6 py-4 shadow-lg shadow-orange-200">
          <span className="text-lg font-semibold text-white/90">ยอดรวมสุทธิ</span>
          <span className="text-4xl font-black tabular-nums text-white tracking-tight">
            ฿{fmt(state.grandTotal)}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Confirmed overlay ─────────────────────────────────────────────── */
function ConfirmedOverlay({ state }: { state: CfdState }) {
  const change = state.changeAmount ?? 0
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 px-8 text-center">
        {/* check icon */}
        <div className="relative flex size-28 items-center justify-center rounded-full border-2 border-emerald-300 bg-emerald-50 shadow-xl shadow-emerald-100">
          <div className="absolute inset-0 rounded-full bg-emerald-300/20 blur-xl animate-pulse" />
          <svg viewBox="0 0 24 24" className="relative size-14 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <div>
          <h2 className="text-5xl font-black tracking-tight text-slate-900">ขอบคุณ!</h2>
          <p className="mt-2 text-lg text-slate-400">ชำระ ฿{fmt(state.paidAmount ?? state.grandTotal)}</p>
        </div>

        {change > 0 && (
          <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 px-12 py-5 shadow-lg shadow-emerald-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-1">เงินทอน</p>
            <p className="text-6xl font-black tabular-nums text-emerald-600 tracking-tight">
              ฿{fmt(change)}
            </p>
          </div>
        )}

        <p className="text-sm text-slate-400 animate-pulse">กรุณาตรวจรับสินค้าของท่าน</p>
      </div>
    </div>
  )
}

/* ── QR Payment ────────────────────────────────────────────────────── */
function QrScreen({ state }: { state: CfdState }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    setQrDataUrl(null)
    if (!state.qrPromptPayId) return
    promptPayDataUrl(state.qrPromptPayId, state.qrAmount)
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [state.qrPromptPayId, state.qrAmount])

  const amount = state.qrAmount ?? state.grandTotal

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 select-none">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">ยอดโอน</p>
        <p className="mt-1 text-6xl font-black tabular-nums tracking-tight text-slate-900">
          ฿{fmt(amount)}
        </p>
      </div>

      <div className="rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-2xl">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="PromptPay QR" className="size-64 object-contain" />
        ) : state.qrPromptPayId ? (
          <div className="size-64 flex items-center justify-center">
            <p className="text-sm text-slate-400 animate-pulse">กำลังสร้าง QR…</p>
          </div>
        ) : (
          <div className="size-64 flex items-center justify-center text-center px-4">
            <p className="text-sm text-slate-400">ไม่พบ PromptPay ID</p>
          </div>
        )}
      </div>

      <div className="text-center space-y-0.5">
        {state.qrBankName && (
          <p className="text-base font-bold text-slate-700">{state.qrBankName}</p>
        )}
        {state.qrAccountName && (
          <p className="text-sm text-slate-500">{state.qrAccountName}</p>
        )}
        <p className="text-xs text-slate-400 tracking-wide">โอนผ่าน PromptPay</p>
      </div>
    </div>
  )
}

/* ── Product Spotlight ─────────────────────────────────────────────── */
function ProductSpotlight({ sku, line, expanded, imageIndex }: { sku: string; line?: CfdLine; expanded: boolean; imageIndex: number }) {
  const [imageUrls, setImageUrls] = useState<string[]>([])

  useEffect(() => {
    setImageUrls([])
    import('@/features/inventory/data/productImages')
      .then(({ getProductImageUrls }) => getProductImageUrls(sku))
      .then(setImageUrls)
      .catch(() => null)
  }, [sku])

  const imageUrl = imageUrls[imageIndex] ?? imageUrls[0] ?? null

  if (expanded) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white select-none"
      >
        <div className="flex h-[65vh] w-[65vh] max-w-[90vw] items-center justify-center overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 shadow-2xl">
          {imageUrl ? (
            <img src={imageUrl} alt={line?.name} className="h-full w-full object-contain" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-32 text-slate-200" fill="none" stroke="currentColor" strokeWidth={1}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          )}
        </div>
        {line && (
          <div className="text-center space-y-1 px-8">
            <p className="text-4xl font-black leading-tight text-slate-900">{line.name}</p>
            <p className="text-2xl font-semibold text-orange-500">
              ฿{fmt(line.unitPrice)}&nbsp;<span className="text-lg font-normal text-slate-400">/ {line.unitLabel}</span>
            </p>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-slate-300 tracking-widest uppercase">
          <span className="size-2 rounded-full bg-orange-400 animate-pulse" />
          สแกนแล้ว
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-white/97 backdrop-blur-sm select-none">
      <div
        className="flex size-52 items-center justify-center overflow-hidden rounded-3xl border-2 border-slate-100 bg-slate-50 shadow-2xl"
      >
        {imageUrl ? (
          <img src={imageUrl} alt={line?.name} className="h-full w-full object-contain" />
        ) : (
          <svg viewBox="0 0 24 24" className="size-20 text-slate-200" fill="none" stroke="currentColor" strokeWidth={1}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        )}
      </div>
      {line && (
        <div className="text-center space-y-1 px-6">
          <p className="text-3xl font-black leading-tight text-slate-900">{line.name}</p>
          <p className="text-lg font-semibold text-slate-400">
            ฿{fmt(line.unitPrice)}&nbsp;/&nbsp;{line.unitLabel}
          </p>
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-slate-300 tracking-widest uppercase">
        <span className="size-1.5 rounded-full bg-orange-400 animate-pulse" />
        แตะรูปเพื่อขยาย
      </div>
    </div>
  )
}

/* ── Video panel ───────────────────────────────────────────────────── */
function VideoPanel() {
  const [filePath, setFilePath] = useState<string | null>(() => readCfdVideoPath())
  const [src, setSrc] = useState<string | null>(null)

  // Listen for video path changes written from the main window.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === CFD_VIDEO_KEY) setFilePath(e.newValue)
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // Convert the native file path to a webview-loadable asset URL.
  useEffect(() => {
    if (!filePath) { setSrc(null); return }
    import('@tauri-apps/api/core')
      .then(({ convertFileSrc }) => setSrc(convertFileSrc(filePath)))
      .catch(() => setSrc(null))
  }, [filePath])

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
      {src ? (
        <video key={src} src={src} className="h-full w-full object-cover" autoPlay loop playsInline />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-5 select-none">
          <div className="flex size-20 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <svg viewBox="0 0 24 24" className="size-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1}>
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-slate-500">วิดีโอโปรโมชัน</p>
            <p className="text-xs text-slate-400">เลือกวิดีโอจากหน้า ตั้งค่า → CFD</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Root ──────────────────────────────────────────────────────────── */
export function CustomerFacingDisplay() {
  const [state, setState] = useState<CfdState>(() => readCfdState())
  const [settings] = useState<CfdSettings>(() => readCfdSettings())
  const [spotlightSku, setSpotlightSku] = useState<string | undefined>()

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === CFD_STATE_KEY && e.newValue) {
        try { setState(JSON.parse(e.newValue) as CfdState) } catch { /* noop */ }
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  useEffect(() => {
    if (state.mode !== 'confirmed') return
    const id = setTimeout(() => setState((s) => ({ ...s, mode: 'idle' })), 6000)
    return () => clearTimeout(id)
  }, [state.mode, state.updatedAt])

  // Show product spotlight whenever triggered — stays until next update clears it
  useEffect(() => {
    if (!state.spotlightSku) { setSpotlightSku(undefined); return }
    setSpotlightSku(state.spotlightSku)
  }, [state.spotlightSku, state.updatedAt])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 text-slate-900">

      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-7 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl border border-orange-200 bg-orange-50">
            <svg viewBox="0 0 24 24" className="size-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <span className="text-base font-bold text-slate-800">{settings.storeName}</span>
        </div>
        <DigitalClock />
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">

        {/* Video — 45% */}
        <div className="w-[45%] shrink-0 p-4 pr-2">
          <VideoPanel />
        </div>

        {/* Divider */}
        <div className="my-4 w-px bg-slate-200" />

        {/* Order / welcome — 55% */}
        <div className="relative min-w-0 flex-1 p-4 pl-3">
          {state.mode === 'idle' && <IdleScreen settings={settings} />}
          {state.mode === 'qr' && <QrScreen state={state} />}
          {(state.mode === 'active' || state.mode === 'confirmed') && <ActiveScreen state={state} />}
          {state.mode === 'confirmed' && <ConfirmedOverlay state={state} />}
          {spotlightSku && state.mode === 'active' && (
            <ProductSpotlight
              sku={spotlightSku}
              line={state.lines.find((l) => l.sku === spotlightSku)}
              expanded={!!state.spotlightExpanded}
              imageIndex={state.spotlightImageIndex ?? 0}
            />
          )}
        </div>
      </div>
    </div>
  )
}
