import { clsx } from 'clsx'
import { getDeviceLabel, setDeviceLabel } from '@/features/device/deviceSession'
import { getStaffRole } from '@/features/auth/authSession'
import { useEffect, useState } from 'react'

type MainTitleBarProps = {
  /** ถ้ามี จะแสดงแทนชื่อร้าน (เช่น หัวข้อหน้า workspace) */
  pageTitle?: string
  shopName?: string
  userRole?: string
  className?: string
}

function formatDisplayDate(d: Date) {
  return d.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function MainTitleBar({
  pageTitle,
  shopName = 'สมนึกอะไหล่',
  userRole = 'ADMIN',
  className,
}: MainTitleBarProps) {
  const today = formatDisplayDate(new Date())
  const heading = pageTitle ?? shopName
  const [deviceLabel, setDeviceLabelState] = useState(() => getDeviceLabel())
  const canEditDeviceLabel = getStaffRole() === 'admin'

  useEffect(() => {
    setDeviceLabelState(getDeviceLabel())
  }, [])

  return (
    <header
      className={clsx(
        'flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 bg-white/90 px-4 py-2.5 shadow-sm shadow-slate-200/30 backdrop-blur-md sm:px-5 sm:py-3 pos-compact:gap-2 pos-compact:py-2 pos-compact:px-3 pos-compact:sm:py-2.5',
        className,
      )}
    >
      <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl pos-compact:text-base pos-compact:sm:text-lg">
        {heading}
      </h1>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <time dateTime={new Date().toISOString()}>{today}</time>
        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
          {userRole}
        </span>
        {canEditDeviceLabel ? (
          <button
            type="button"
            onClick={() => {
              const next = window.prompt('ตั้งชื่อเครื่อง/เลขเครื่อง (เช่น PC1, PC2)', deviceLabel) ?? ''
              const s = next.trim()
              if (!s) return
              setDeviceLabel(s)
              setDeviceLabelState(s)
            }}
            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            title="คลิกเพื่อเปลี่ยนเลขเครื่อง (เฉพาะแอดมิน)"
          >
            {deviceLabel}
          </button>
        ) : (
          <span
            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700"
            title="เลขเครื่อง (แก้ได้เฉพาะแอดมิน)"
          >
            {deviceLabel}
          </span>
        )}
      </div>
    </header>
  )
}
