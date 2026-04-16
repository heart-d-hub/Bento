import { Car, Cog, Disc, FolderOpen, HelpCircle, Info, type LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

type HintDef = {
  id: string
  label: string
  Icon: LucideIcon
  body: ReactNode
}

const HINTS: HintDef[] = [
  {
    id: 'basic',
    label: 'พื้นฐาน',
    Icon: Car,
    body: (
      <>
        <strong className="font-semibold">พื้นฐาน:</strong> ยี่ห้อ · รุ่น · ปีจดทะเบียนหรือปีโมเดล (ถ้าลูกค้าไม่รู้ ให้ดูเล่มทะเบียนหรือป้ายท้ายรถ)
      </>
    ),
  },
  {
    id: 'engine',
    label: 'เครื่องยนต์',
    Icon: Cog,
    body: (
      <>
        <strong className="font-semibold">เครื่องยนต์:</strong> ขนาด CC หรือรหัสเครื่อง — รุ่นเดียวกันบางทีมีหลายเครื่อง ชิ้นอาจไม่ตรงกัน
      </>
    ),
  },
  {
    id: 'brake',
    label: 'ผ้าเบรก / ดิสก์',
    Icon: Disc,
    body: (
      <>
        <strong className="font-semibold">ผ้าเบรก / ดิสก์:</strong> ถามว่าเอา <strong>หน้า</strong> หรือ <strong>หลัง</strong> — ใช้ตัวกรองด้านล่างหลังเลือกเครื่อง/ปี
      </>
    ),
  },
  {
    id: 'unsure',
    label: 'ถ้ายังไม่แน่ใจ',
    Icon: HelpCircle,
    body: (
      <>
        <strong className="font-semibold">ถ้ายังไม่แน่ใจ:</strong> เปรียบเทียบของเก่าหรือถ่ายรูปดุม/ผ้าให้ลูกค้านำมา
      </>
    ),
  },
  {
    id: 'master',
    label: 'แฟ้มสินค้า',
    Icon: FolderOpen,
    body: (
      <>
        <strong className="font-semibold">แฟ้มสินค้า:</strong> ลงรุ่นรถในแฟ้มมาสเตอร์ให้ตรงกับเมนูนี้ — รายการที่มีป้าย &quot;แฟ้มมาสเตอร์&quot; คือผูก{' '}
        <span className="font-mono">engineId</span> แล้ว ราคา/สต็อกมาจากแฟ้ม
      </>
    ),
  },
  {
    id: 'year-note',
    label: 'ช่วงปี / variant',
    Icon: Info,
    body: (
      <span className="text-amber-950/95">
        หมายเหตุ: ช่วงปีในรายการ &quot;เครื่อง / ปี&quot; ควรตรงกับที่ลงใน <strong className="font-medium">จัดการรุ่นรถ</strong> — ถ้าอะไหล่คนละช่วง
        ให้แยกหลาย variant ที่แคตตาล็อก แล้วผูกสินค้าทีละรหัส
      </span>
    ),
  },
]

const iconBtnClass =
  'relative inline-flex h-7 w-7 items-center justify-center rounded-md border text-amber-900/90 shadow-sm transition hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-400/80'

/** คำแนะนำหน้าร้าน — ไอคอนในแถวหัวแผงค้นหา กดเพื่ออ่านรายละเอียด */
export function VehicleSearchHintIcons() {
  const [openId, setOpenId] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const baseId = useId()

  useEffect(() => {
    if (!openId) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenId(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openId])

  return (
    <div
      ref={rootRef}
      className="flex flex-wrap items-center gap-0.5"
      role="group"
      aria-label="คำถามแนะนำหน้าร้าน"
    >
      {HINTS.map(({ id, label, Icon, body }) => {
        const open = openId === id
        const panelId = `${baseId}-${id}-panel`
        return (
          <div key={id} className="relative">
            <button
              type="button"
              className={clsx(
                iconBtnClass,
                open
                  ? 'border-amber-400/90 bg-amber-100/90'
                  : 'border-amber-200/90 bg-amber-50/90',
              )}
              aria-label={label}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenId((prev) => (prev === id ? null : id))}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            </button>
            {open ? (
              <div
                id={panelId}
                role="region"
                className="absolute right-0 top-full z-[60] mt-1 w-[min(18rem,calc(100vw-4rem))] rounded-lg border border-amber-200/90 bg-white p-2 text-[11px] leading-relaxed text-amber-950 shadow-lg shadow-amber-900/10"
              >
                {body}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
