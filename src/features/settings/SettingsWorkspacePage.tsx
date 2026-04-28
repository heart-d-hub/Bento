import { DataFileSettingsPanel } from '@/features/settings/components/DataFileSettingsPanel'
import { HubSyncPanel } from '@/features/settings/components/HubSyncPanel'
import { PermissionsPanel } from '@/features/settings/components/PermissionsPanel'
import { DesktopAppPanel } from '@/features/settings/components/DesktopAppPanel'
import { StoreProfilePanel } from '@/features/settings/components/StoreProfilePanel'
import { UsersManagementPanel } from '@/features/settings/components/UsersManagementPanel'
import { DashboardLayoutSettingsForm } from '@/features/main/components/DashboardLayoutSettingsForm'
import { clsx } from 'clsx'
import { Building2, ChevronDown, Cloud, Database, KeyRound, Monitor, Settings, SlidersHorizontal, UserCog, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

type SettingsWorkspacePageProps = {
  className?: string
}

type SettingsSection = 'store' | 'desktop' | 'datafile' | 'hub' | 'staff' | 'permissions' | 'dashboard'

const SECTION_HEADINGS: Record<
  SettingsSection,
  { title: string; description: string }
> = {
  store: {
    title: 'ข้อมูลร้าน',
    description: 'ชื่อร้าน เลขประจำตัวผู้เสียภาษี ที่อยู่ และช่องทางติดต่อสำหรับแสดงบนเอกสาร',
  },
  desktop: {
    title: 'เดสก์ท็อป / EXE',
    description: 'คีย์ลัด, หน้าจอ, และการพิมพ์ — สำหรับการใช้งานหน้าร้านแบบโปรแกรม',
  },
  datafile: {
    title: 'แฟ้มข้อมูล',
    description: 'ส่งออกและนำเข้าแฟ้มสินค้า (CSV) เพื่อใช้ร่วมกับ Google Sheets',
  },
  hub: {
    title: 'เซิร์ฟเวอร์กลาง (sync)',
    description: 'ทดสอบดึง/ส่งแฟ้มสินค้าและแคตตาล็อกรถไป PC กลางก่อนใช้ VPS',
  },
  staff: {
    title: 'จัดการผู้ใช้',
    description:
      'รายชื่อพนักงาน — username, ชื่อแสดงที่ POS, รหัสผ่าน, หน้าที่, วันเริ่มงาน, สถานะ',
  },
  permissions: {
    title: 'จัดการผู้ใช้',
    description: 'สิทธิ์การใช้งาน — กำหนดสิทธิ์เมนูหลักและรายละเอียด',
  },
  dashboard: {
    title: 'Dashboard',
    description: 'การ์ดสรุปด้านซ้าย · เลขเครื่อง POS — แยกจากตั้งค่าร้านทั้งระบบ',
  },
}

export function SettingsWorkspacePage({ className }: SettingsWorkspacePageProps) {
  const [section, setSection] = useState<SettingsSection>('store')
  const [userMgmtOpen, setUserMgmtOpen] = useState(false)

  const heading = SECTION_HEADINGS[section]

  useEffect(() => {
    if (section === 'staff' || section === 'permissions') {
      setUserMgmtOpen(true)
    }
    if (section === 'store' || section === 'desktop' || section === 'datafile' || section === 'hub' || section === 'dashboard') {
      setUserMgmtOpen(false)
    }
  }, [section])

  return (
    <div
      className={clsx(
        'flex min-h-[min(85vh,56rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row">
        <aside
          role="navigation"
          aria-label="เมนูตั้งค่า"
          className="flex shrink-0 flex-col gap-2 border-b border-slate-200 bg-slate-50/95 p-2 md:w-56 md:gap-0 md:border-b-0 md:border-r md:p-3"
        >
          <div className="mb-0 hidden flex-col gap-3 px-2 py-2 md:mb-3 md:flex">
            <div className="flex items-start gap-2.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
                <Settings className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-slate-900">ตั้งค่า</p>
                <p className="mt-0.5 text-xs text-slate-500">จัดการระบบ</p>
              </div>
            </div>

            <div className="border-t border-slate-200/80 pt-3">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                ข้อมูลร้าน
              </p>
            </div>
          </div>

          <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:hidden">
            ข้อมูลร้าน
          </p>
          <button
            type="button"
            onClick={() => setSection('store')}
            className={clsx(
              'flex min-h-10 w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition touch-manipulation md:min-h-11',
              section === 'store'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:bg-white/80',
            )}
          >
            <Building2 className="size-4 shrink-0 opacity-80" aria-hidden />
            ข้อมูลร้าน
          </button>

          <button
            type="button"
            onClick={() => setSection('desktop')}
            className={clsx(
              'flex min-h-10 w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition touch-manipulation md:min-h-11',
              section === 'desktop'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:bg-white/80',
            )}
          >
            <Monitor className="size-4 shrink-0 opacity-80" aria-hidden />
            เดสก์ท็อป / EXE
          </button>

          <button
            type="button"
            onClick={() => setSection('datafile')}
            className={clsx(
              'flex min-h-10 w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition touch-manipulation md:min-h-11',
              section === 'datafile'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:bg-white/80',
            )}
          >
            <Database className="size-4 shrink-0 opacity-80" aria-hidden />
            แฟ้มข้อมูล
          </button>

          <button
            type="button"
            onClick={() => setSection('hub')}
            className={clsx(
              'flex min-h-10 w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition touch-manipulation md:min-h-11',
              section === 'hub'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:bg-white/80',
            )}
          >
            <Cloud className="size-4 shrink-0 opacity-80" aria-hidden />
            เซิร์ฟเวอร์กลาง
          </button>

          <button
            type="button"
            onClick={() => setSection('dashboard')}
            className={clsx(
              'flex min-h-10 w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition touch-manipulation md:min-h-11',
              section === 'dashboard'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:bg-white/80',
            )}
          >
            <SlidersHorizontal className="size-4 shrink-0 opacity-80" aria-hidden />
            Dashboard
          </button>

          <div className="mt-1 border-t border-slate-200/80 pt-3 md:mt-2" />

          <div className="flex min-w-0 flex-col gap-1">
            <button
              type="button"
              id="settings-user-mgmt-trigger"
              aria-expanded={userMgmtOpen}
              aria-controls="settings-user-mgmt-panel"
              onClick={() => setUserMgmtOpen((o) => !o)}
              className={clsx(
                'flex min-h-10 w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition touch-manipulation md:min-h-11',
                section === 'staff' || section === 'permissions'
                  ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                  : 'text-slate-700 hover:bg-white/80',
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <UserCog className="size-4 shrink-0 opacity-80" aria-hidden />
                <span className="truncate">จัดการผู้ใช้</span>
              </span>
              <ChevronDown
                className={clsx(
                  'size-4 shrink-0 text-slate-500 transition-transform duration-200',
                  userMgmtOpen && 'rotate-180',
                )}
                aria-hidden
              />
            </button>

            {userMgmtOpen ? (
              <div
                id="settings-user-mgmt-panel"
                role="region"
                aria-labelledby="settings-user-mgmt-trigger"
                className="flex flex-col gap-0.5 pb-0.5 pt-0.5"
              >
                <button
                  type="button"
                  onClick={() => setSection('staff')}
                  className={clsx(
                    'flex min-h-10 w-full items-center gap-2 rounded-lg border-l-2 py-2 pl-4 pr-3 text-left text-sm font-medium transition touch-manipulation md:min-h-10',
                    section === 'staff'
                      ? 'border-slate-500 bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                      : 'border-transparent text-slate-600 hover:bg-white/80',
                  )}
                >
                  <Users className="size-4 shrink-0 opacity-80" aria-hidden />
                  รายชื่อพนักงาน
                </button>
                <button
                  type="button"
                  onClick={() => setSection('permissions')}
                  className={clsx(
                    'flex min-h-10 w-full items-center gap-2 rounded-lg border-l-2 py-2 pl-4 pr-3 text-left text-sm font-medium transition touch-manipulation md:min-h-10',
                    section === 'permissions'
                      ? 'border-slate-500 bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                      : 'border-transparent text-slate-600 hover:bg-white/80',
                  )}
                >
                  <KeyRound className="size-4 shrink-0 opacity-80" aria-hidden />
                  สิทธิ์การใช้งาน
                </button>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-4 py-3 md:hidden">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
              <Settings className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h1 className="text-base font-semibold text-slate-900">ตั้งค่า</h1>
              <p className="text-xs text-slate-600">{heading.title}</p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4 lg:p-5">
            <div className="mb-4 hidden border-b border-slate-100 pb-4 md:block">
              <h1 className="text-lg font-semibold text-slate-900">{heading.title}</h1>
              <p className="mt-1 text-sm text-slate-600">{heading.description}</p>
            </div>

            {section === 'store' && <StoreProfilePanel />}
            {section === 'desktop' && <DesktopAppPanel />}
            {section === 'datafile' && <DataFileSettingsPanel />}
            {section === 'hub' && <HubSyncPanel />}
            {section === 'staff' && <UsersManagementPanel />}
            {section === 'permissions' && <PermissionsPanel />}
            {section === 'dashboard' && <DashboardLayoutSettingsForm />}
          </div>
        </div>
      </div>
    </div>
  )
}
