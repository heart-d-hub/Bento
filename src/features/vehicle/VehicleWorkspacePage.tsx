import { VehicleManageView } from '@/features/vehicle/components/VehicleManageView'
import { VehicleSearchView } from '@/features/vehicle/components/VehicleSearchView'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import { clsx } from 'clsx'

type VehicleWorkspaceInnerProps = {
  className?: string
}

function VehicleWorkspaceInner({ className }: VehicleWorkspaceInnerProps) {
  const { vehicleWorkspacePanel } = useWorkspaceTabs()
  const panel = vehicleWorkspacePanel

  return (
    <div
      className={clsx(
        'flex min-h-[min(85vh,52rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 shadow-lg shadow-slate-200/40 backdrop-blur-sm',
        className,
      )}
    >
      <header className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-4 py-3 sm:px-6 sm:py-3.5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          {panel === 'search' ? 'ค้นหารุ่นรถ' : 'จัดการรุ่นรถ'}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          {panel === 'search'
            ? 'เลือกประเภท → ยี่ห้อ → รุ่น แล้วกรอกเครื่อง/ปี เพื่อค้นหาสินค้าที่ผูกในแฟ้มมาสเตอร์'
            : 'จัดการโครงหลัก: ประเภท → ยี่ห้อ → รุ่น (ข้อมูลเครื่องและปีให้กำหนดตอนเพิ่มสินค้า)'}
        </p>
      </header>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4 sm:p-5 lg:p-6">
        {panel === 'search' ? <VehicleSearchView /> : <VehicleManageView />}
      </div>
    </div>
  )
}

type VehicleWorkspacePageProps = {
  className?: string
}

export function VehicleWorkspacePage({ className }: VehicleWorkspacePageProps) {
  return <VehicleWorkspaceInner className={className} />
}
