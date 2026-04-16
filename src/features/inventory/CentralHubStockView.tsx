import { BranchStockView } from '@/features/inventory/BranchStockView'

/** สต็อกคลังกลาง — ใช้ชุด UI เดียวกับคลังสาขา; ข้อมูลจริงจะกรองเฉพาะ hub ภายหลัง */
export function CentralHubStockView() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <p className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
        <span className="font-medium">คลังกลาง</span>
        <span className="text-emerald-800/90"> — มุมมองสต็อก hub (mock ใช้ชุดข้อมูลเดียวกับคลังสาขา)</span>
      </p>
      <BranchStockView />
    </div>
  )
}
