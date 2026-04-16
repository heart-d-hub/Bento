import { ArrowLeftRight } from 'lucide-react'

/** โอนข้ามสาขา — รวมอยู่ภายใต้เมนูคลังกลาง */
export function CrossBranchTransferView() {
  return (
    <div className="flex min-h-[min(60vh,28rem)] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-800">
        <ArrowLeftRight className="size-7" strokeWidth={1.5} aria-hidden />
      </span>
      <div>
        <h3 className="text-base font-semibold text-slate-900">โอนข้ามสาขา</h3>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          สร้างและติดตามใบโอนระหว่างคลังกลางกับสาขา (หรือสาขาต่อสาขา) จะเชื่อมฟอร์มและรายการจริงในขั้นถัดไป
        </p>
      </div>
    </div>
  )
}
