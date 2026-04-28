import { getStaffRole, getStaffUsername, getStoredBranch, isLoggedIn } from '@/features/auth/authSession'
import { pingDatabase } from '@/features/desktop/databaseHealth'
import { hydrateCategoryTreeFromDb } from '@/features/inventory/data/inventoryCategories'
import { hydrateProductMasterFromDb } from '@/features/inventory/data/productMasterData'
import { MainDashboard } from '@/features/main/components/MainDashboard'
import { MainTopNav } from '@/features/main/components/MainTopNav'
import { WorkspaceTabPanel } from '@/features/main/components/WorkspaceTabPanel'
import { WorkspaceTabsProvider, useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import { useGlobalShortcuts } from '@/features/desktop/useGlobalShortcuts'
import { PosCartProvider } from '@/features/pos/context/PosCartContext'
import { HubAutoSync } from '@/features/sync/HubAutoSync'
import { VehicleCatalogProvider } from '@/features/vehicle/context/VehicleCatalogContext'
import { type ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function workspacePageTitle(activeTabId: string | null): string | undefined {
  if (activeTabId === 'pos') return 'POS / TAX — ขายหน้าร้าน + ใบกำกับภาษี'
  if (activeTabId === 'buy') return 'ซื้อ — ใบสั่งซื้อ (PO) / รับของ / ค้างรับ'
  if (activeTabId === 'suppliers') return 'ผู้จัดจำหน่าย — รายชื่อ / รายละเอียด / เครดิต'
  if (activeTabId === 'catalog') return 'Catalog สินค้า — จัดชุดเสนออู่ / ร้านค้า'
  if (activeTabId === 'label-print')
    return 'พิมพ์ป้ายสินค้า — บาร์โค้ด / ใบเสร็จ'
  if (activeTabId === 'activity') return 'Log Activity — บันทึกการกระทำในระบบ'
  if (activeTabId === 'report') return 'Report — รายงานยอดขาย / สต็อก / การเงิน / ภาษี'
  if (activeTabId === 'promotions') return 'โปรโมชัน — ซื้อครบแถม / ของแถม'
  if (activeTabId === 'car-model') return 'รถ — ค้นหา / จัดการรุ่นรถ'
  if (activeTabId === 'task-notepad-history') return 'ประวัติสั่งงาน / โน้ต — สรุปรายวัน'
  if (activeTabId === 'clockin') return 'ลงเวลา — บันทึกเวลาเข้า-ออกงานพนักงาน'
  if (activeTabId === 'global-dashboard') return 'Dashboard รวมทุกสาขา'
  if (activeTabId === 'transport') return 'บริษัทขนส่ง — รายชื่อ / เบอร์โทร / ติดต่อ'
  return undefined
}

function MainPageContent() {
  const { activeTabId } = useWorkspaceTabs()
  /** แดชบอร์ดหลัก — รวมแท็บ id `dashboard` (หลีกเลี่ยง placeholder ว่างเมื่อเปิดจากเมนูไทล์ Bento) */
  const showDashboard = activeTabId === null || activeTabId === 'dashboard'
  const branch = getStoredBranch()
  const staffRole = getStaffRole()
  const staffUsername = getStaffUsername()
  const [dbBanner, setDbBanner] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void pingDatabase().then((r) => {
      if (cancelled || r.ok) return
      setDbBanner(r.message)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void hydrateProductMasterFromDb().then(() => {
      if (cancelled) return
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void hydrateCategoryTreeFromDb().then(() => {
      if (cancelled) return
    })
    return () => {
      cancelled = true
    }
  }, [])

  useGlobalShortcuts({
    'ui.close': () => {
      // PoC: close native dialog flows later; for now just blur.
      ;(document.activeElement as HTMLElement | null)?.blur?.()
    },
    'pos.help': () => alert('ช่วยเหลือ (PoC): จะทำเมนูช่วยเหลือในขั้นถัดไป'),
    'pos.search': () => {
      const el = document.getElementById('pos-product-search') as HTMLInputElement | null
      el?.focus()
      el?.select?.()
    },
    'pos.customer': () => {
      const el = document.getElementById('pos-member-search') as HTMLInputElement | null
      el?.focus()
      el?.select?.()
    },
    'pos.pay': () => {
      const el = document.getElementById('pos-confirm-sale') as HTMLButtonElement | null
      el?.focus()
      el?.click()
    },
    'pos.print': () => window.print(),
  })

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50/95 to-slate-100">
      {dbBanner ? (
        <div
          role="status"
          className="shrink-0 border-b border-amber-300/90 bg-amber-50 px-3 py-2 text-center text-[11px] leading-snug text-amber-950 sm:px-4"
        >
          <span className="font-semibold">ฐานข้อมูลไม่พร้อม:</span> {dbBanner}
          <span className="block text-amber-900/90 sm:inline sm:before:content-['\00a0—\00a0']">
            ตั้งค่า <code className="rounded bg-amber-100/80 px-1 font-mono text-[10px]">DATABASE_URL</code> ในไฟล์{' '}
            <code className="rounded bg-amber-100/80 px-1 font-mono text-[10px]">.env</code> ที่รากโปรเจกต์ แล้วรีสตาร์ทแอป
          </span>
        </div>
      ) : null}
      <MainTopNav
        pageTitle={workspacePageTitle(activeTabId)}
        shopName={branch?.name ?? 'สมนึกอะไหล่'}
        userRole={staffUsername ?? staffRole.toUpperCase()}
      />

      <div className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 flex-col gap-2 p-2 pos-compact:gap-1.5 pos-compact:p-1.5 pos-720p:gap-1 pos-720p:p-1 sm:gap-3 sm:p-4 pos-compact:sm:gap-2 pos-compact:sm:p-3 pos-720p:sm:gap-2 pos-720p:sm:p-2">
        {showDashboard && <MainDashboard className="min-h-0 flex-1" />}
        <div className={showDashboard ? 'hidden' : 'contents'}>
          <WorkspaceTabPanel className="min-h-0 flex-1" />
        </div>
      </div>
    </div>
  )
}

function MainAccessGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()
  const branch = getStoredBranch()

  useEffect(() => {
    if (!loggedIn) {
      navigate('/login', { replace: true })
      return
    }
    if (!branch) {
      navigate('/branch', { replace: true })
    }
  }, [loggedIn, branch, navigate])

  if (!loggedIn || !branch) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">กำลังเปลี่ยนหน้า...</p>
      </div>
    )
  }

  return children
}

export function MainPage() {
  return (
    <MainAccessGate>
      <WorkspaceTabsProvider>
        <PosCartProvider>
          <VehicleCatalogProvider>
            <MainPageContent />
            <HubAutoSync />
          </VehicleCatalogProvider>
        </PosCartProvider>
      </WorkspaceTabsProvider>
    </MainAccessGate>
  )
}
