import { ArrowLeft, ChevronDown, Home, LogOut, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import { getDeviceLabel, setDeviceLabel } from '@/features/device/deviceSession'
import { clearCompanyAndBranch, getStaffRole, getStoredBranch, getStoredCompany, setStoredBranch } from '@/features/auth/authSession'
import { loadBranchesByCompany } from '@/features/auth/branchesStore'
import { loadCompanyConfig } from '@/features/auth/companiesStore'
import { useEffect, useRef, useState } from 'react'

type MainTopNavProps = {
  /** ถ้ามี จะแสดงแทนชื่อร้าน (เช่น หัวข้อหน้า workspace) */
  pageTitle?: string
  shopName?: string
  userRole?: string
  className?: string
}

function formatDisplayDate(d: Date) {
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function MainTopNav({
  pageTitle,
  shopName = 'สมนึกอะไหล่',
  userRole = 'ADMIN',
  className,
}: MainTopNavProps) {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    closeTab,
    goHome,
    goBack,
    branchStockPanel,
    setBranchStockPanel,
    centralWarehousePanel,
    setCentralWarehousePanel,
    receivablesPayablesPanel,
    vehicleWorkspacePanel,
    setVehicleWorkspacePanel,
  } = useWorkspaceTabs()

  const canGoBack = activeTabId !== null
  const today = formatDisplayDate(new Date())
  const heading = pageTitle ?? shopName
  const [deviceLabel, setDeviceLabelState] = useState(() => getDeviceLabel())
  const canEditDeviceLabel = getStaffRole() === 'admin'
  const [branchOpen, setBranchOpen] = useState(false)
  const currentBranch = getStoredBranch()
  const currentCompany = getStoredCompany()
  const companyCfg = currentCompany ? loadCompanyConfig(currentCompany.id) : null
  const companyBranches = currentCompany ? loadBranchesByCompany(currentCompany.id).filter((b) => b.isActive) : []
  const branchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDeviceLabelState(getDeviceLabel())
  }, [])

  useEffect(() => {
    if (!branchOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setBranchOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [branchOpen])

  return (
    <nav
      className={clsx(
        'flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/50 bg-white/95 px-3 py-2.5 shadow-sm shadow-slate-200/20 backdrop-blur-sm sm:px-4 pos-compact:gap-1.5 pos-compact:py-2 pos-compact:px-2.5',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={goBack}
          disabled={!canGoBack}
          title={
            canGoBack
              ? activeTabId === 'central' && centralWarehousePanel !== 'hub-stock'
                ? 'กลับมุมมองย่อยในคลังกลาง'
                : activeTabId === 'ar-ap' && receivablesPayablesPanel !== 'ar'
                  ? 'กลับมุมมองย่อยในลูกหนี้/เจ้าหนี้'
                  : activeTabId === 'branch-stock' && branchStockPanel !== 'stock'
                    ? 'กลับมุมมองย่อยในคลังสินค้า'
                    : activeTabId === 'car-model' && vehicleWorkspacePanel === 'manage'
                      ? 'กลับไปค้นหารุ่นรถ'
                      : 'ปิดแท็บนี้และกลับแท็บก่อนหน้า'
              : undefined
          }
          className={clsx(
            'inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition touch-manipulation',
            canGoBack
              ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400',
          )}
        >
          <ArrowLeft className="size-4" aria-hidden />
          ย้อนกลับ
        </button>
        <button
          type="button"
          onClick={goHome}
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 touch-manipulation"
        >
          <Home className="size-4" aria-hidden />
          HOME
        </button>

        <div className="ml-2 hidden items-center gap-2 border-l border-slate-200 pl-4 lg:flex">
          <h1 className="text-sm font-bold text-slate-800">{heading}</h1>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <time dateTime={new Date().toISOString()} className="font-mono">
              {today}
            </time>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">
              {userRole}
            </span>
            {/* Branch switcher */}
            <div ref={branchRef} className="relative">
              <button
                type="button"
                onClick={() => setBranchOpen((o) => !o)}
                className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                title="เปลี่ยนสาขา / กิจการ"
              >
                <span className="text-slate-400">{companyCfg?.shortName ?? currentCompany?.shortName ?? '—'} ·</span>
                {currentBranch?.name ?? '—'}
                <ChevronDown className={clsx('size-3 transition-transform', branchOpen && 'rotate-180')} />
              </button>
              {branchOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                  <p className="border-b border-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {companyCfg?.name ?? currentCompany?.name ?? 'สาขา'}
                  </p>
                  {companyBranches.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        if (b.id === currentBranch?.id) { setBranchOpen(false); return }
                        setStoredBranch(b as unknown as import('@/features/auth/branches').BranchInfo)
                        window.location.reload()
                      }}
                      className={clsx(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium hover:bg-slate-50',
                        b.id === currentBranch?.id ? 'font-bold text-amber-700' : 'text-slate-700',
                      )}
                    >
                      {b.id === currentBranch?.id && (
                        <span className="size-1.5 rounded-full bg-amber-500" />
                      )}
                      {b.name}
                    </button>
                  ))}
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => {
                      clearCompanyAndBranch()
                      window.location.href = '/company'
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  >
                    <LogOut className="size-3.5" />
                    เปลี่ยนกิจการ
                  </button>
                </div>
              )}
            </div>
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
                className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                title="คลิกเพื่อเปลี่ยนเลขเครื่อง (เฉพาะแอดมิน)"
              >
                {deviceLabel}
              </button>
            ) : (
              <span
                className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-semibold text-slate-700"
                title="เลขเครื่อง (แก้ได้เฉพาะแอดมิน)"
              >
                {deviceLabel}
              </span>
            )}
          </div>
        </div>

        {activeTabId === 'central' && (
          <div
            role="tablist"
            aria-label="มุมมองคลังกลาง"
            className="flex w-fit max-w-full shrink-0 flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100/90 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={centralWarehousePanel === 'hub-stock'}
              onClick={() => setCentralWarehousePanel('hub-stock')}
              className={clsx(
                'min-h-8 rounded-lg px-2.5 py-1.5 text-xs font-medium transition touch-manipulation',
                centralWarehousePanel === 'hub-stock'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/60',
              )}
            >
              สต็อกคลังกลาง
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={centralWarehousePanel === 'transfer'}
              onClick={() => setCentralWarehousePanel('transfer')}
              className={clsx(
                'min-h-8 rounded-lg px-2.5 py-1.5 text-xs font-medium transition touch-manipulation',
                centralWarehousePanel === 'transfer'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/60',
              )}
            >
              โอนข้ามสาขา
            </button>
          </div>
        )}

        {activeTabId === 'car-model' && (
          <div
            role="tablist"
            aria-label="มุมมองรถ"
            className="flex w-fit max-w-full shrink-0 flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100/90 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={vehicleWorkspacePanel === 'search'}
              onClick={() => setVehicleWorkspacePanel('search')}
              className={clsx(
                'min-h-8 rounded-lg px-2.5 py-1.5 text-xs font-medium transition touch-manipulation',
                vehicleWorkspacePanel === 'search'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/60',
              )}
            >
              ค้นหารุ่นรถ
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={vehicleWorkspacePanel === 'manage'}
              onClick={() => setVehicleWorkspacePanel('manage')}
              className={clsx(
                'min-h-8 rounded-lg px-2.5 py-1.5 text-xs font-medium transition touch-manipulation',
                vehicleWorkspacePanel === 'manage'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/60',
              )}
            >
              จัดการรุ่นรถ
            </button>
          </div>
        )}

        {activeTabId === 'branch-stock' && (
          <div
            role="tablist"
            aria-label="มุมมองคลังสินค้า"
            className="flex w-fit max-w-full shrink-0 flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100/90 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={branchStockPanel === 'stock'}
              onClick={() => setBranchStockPanel('stock')}
              className={clsx(
                'min-h-8 rounded-lg px-2.5 py-1.5 text-xs font-medium transition touch-manipulation',
                branchStockPanel === 'stock'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/60',
              )}
            >
              คลังสินค้า
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={branchStockPanel === 'split-sale'}
              onClick={() => setBranchStockPanel('split-sale')}
              className={clsx(
                'min-h-8 rounded-lg px-2.5 py-1.5 text-xs font-medium transition touch-manipulation',
                branchStockPanel === 'split-sale'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/60',
              )}
            >
              สินค้าแบ่งขาย
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={branchStockPanel === 'product-file'}
              onClick={() => setBranchStockPanel('product-file')}
              className={clsx(
                'min-h-8 rounded-lg px-2.5 py-1.5 text-xs font-medium transition touch-manipulation',
                branchStockPanel === 'product-file'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/60',
              )}
            >
              แฟ้มข้อมูลสินค้า
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={branchStockPanel === 'categories'}
              onClick={() => setBranchStockPanel('categories')}
              className={clsx(
                'min-h-8 rounded-lg px-2.5 py-1.5 text-xs font-medium transition touch-manipulation',
                branchStockPanel === 'categories'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/60',
              )}
            >
              จัดการหมวดหมู่
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={branchStockPanel === 'product-tags'}
              onClick={() => setBranchStockPanel('product-tags')}
              className={clsx(
                'min-h-8 rounded-lg px-2.5 py-1.5 text-xs font-medium transition touch-manipulation',
                branchStockPanel === 'product-tags'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/60',
              )}
            >
              แท็กสินค้า
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={branchStockPanel === 'bin-index'}
              onClick={() => setBranchStockPanel('bin-index')}
              className={clsx(
                'min-h-8 rounded-lg px-2.5 py-1.5 text-xs font-medium transition touch-manipulation',
                branchStockPanel === 'bin-index'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/60',
              )}
            >
              ดัชนีที่เก็บ
            </button>
          </div>
        )}
      </div>

      <div
        className={clsx(
          'flex max-w-full min-w-0 flex-1 basis-full items-center justify-end gap-2 sm:basis-auto lg:max-w-[min(100%,42rem)]',
        )}
      >
        {tabs.length === 0 ? (
          <span className="text-xs text-slate-400">เปิดหน้าจากปุ่มด้านล่าง — แท็บจะแสดงที่นี่</span>
        ) : (
          <div
            role="tablist"
            aria-label="หน้าที่เปิดอยู่"
            className="flex max-w-full min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]"
          >
            {tabs.map((tab) => {
              const isActive = activeTabId === tab.id
              return (
                <div
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  className={clsx(
                    'flex max-w-[12rem] shrink-0 items-center gap-0.5 rounded-full border pl-3 shadow-sm transition',
                    isActive
                      ? 'border-slate-300 bg-slate-100 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className="min-h-8 min-w-0 flex-1 truncate py-1.5 pr-1 text-left text-xs font-medium touch-manipulation"
                    title={tab.label}
                  >
                    {tab.label}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.id)
                    }}
                    className="mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-800 touch-manipulation"
                    aria-label={`ปิด ${tab.label}`}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
