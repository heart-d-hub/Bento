import { isTauri } from '@/features/desktop/isTauri'
import { Package } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * โปรดักชันใช้เฉพาะแอป Windows (.exe) — ไม่รองรับการเปิด UI ผ่านเบราว์เซอร์
 */
export function DesktopOnlyGate({ children }: { children: ReactNode }) {
  if (isTauri()) return <>{children}</>

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 px-6 text-center text-slate-100">
      <span className="flex size-14 items-center justify-center rounded-2xl border border-slate-600 bg-slate-800 text-slate-300">
        <Package className="size-7" strokeWidth={1.5} aria-hidden />
      </span>
      <div className="max-w-md space-y-2">
        <h1 className="text-lg font-semibold tracking-tight">BentoPOS — แอปเดสก์ท็อปเท่านั้น</h1>
        <p className="text-sm leading-relaxed text-slate-400">
          ห้ามใช้งานผ่านเบราว์เซอร์หรือไฟล์ HTML โดยตรง กรุณาเปิดจากโปรแกรม BentoPOS (.exe) ที่ติดตั้งบนเครื่อง
        </p>
      </div>
    </div>
  )
}
