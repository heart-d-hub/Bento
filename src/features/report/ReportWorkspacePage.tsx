import { clsx } from 'clsx'
import { BarChart3, FileText, Package, Receipt, Scale } from 'lucide-react'
import { useState } from 'react'

type ReportWorkspacePageProps = {
  className?: string
}

type ReportPanelId = 'sales' | 'stock' | 'finance' | 'tax'

const PANELS: {
  id: ReportPanelId
  label: string
  short: string
  icon: typeof FileText
}[] = [
  { id: 'sales', label: 'ยอดขาย', short: 'POS ตามวัน / พนักงาน / สินค้า', icon: BarChart3 },
  { id: 'stock', label: 'สต็อก', short: 'เคลื่อนไหว / คงเหลือ / ช้าเคลื่อน', icon: Package },
  { id: 'finance', label: 'การเงิน', short: 'ลูกหนี้ / เจ้าหนี้ / กระแสเงินสด', icon: Scale },
  { id: 'tax', label: 'ภาษี', short: 'ใบกำกับ / สรุปภาษีซื้อ-ขาย', icon: Receipt },
]

export function ReportWorkspacePage({ className }: ReportWorkspacePageProps) {
  const [panel, setPanel] = useState<ReportPanelId>('sales')

  return (
    <div
      className={clsx(
        'flex min-h-[min(85vh,56rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/90 to-white px-4 py-3 lg:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-200/80 bg-white text-indigo-800 shadow-sm">
            <FileText className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h1 className="text-base font-semibold text-slate-900 lg:text-lg">Report</h1>
            <p className="text-xs text-slate-600 lg:text-sm">
              รายงานสรุปทางธุรกิจ — เลือกหมวดด้านซ้าย แล้วส่งออก / พิมพ์เมื่อเชื่อมข้อมูลจริง
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row">
        <aside
          role="tablist"
          aria-label="หมวดรายงาน"
          className="flex shrink-0 flex-row gap-1.5 border-b border-slate-200 bg-slate-50/90 p-2 md:w-56 md:flex-col md:gap-1 md:border-b-0 md:border-r md:p-3"
        >
          {PANELS.map((p) => {
            const Icon = p.icon
            const selected = panel === p.id
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setPanel(p.id)}
                className={clsx(
                  'flex min-h-10 flex-1 flex-col items-stretch gap-0.5 rounded-xl px-3 py-2 text-left transition touch-manipulation md:min-h-0 md:w-full md:flex-none',
                  selected
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                    : 'text-slate-600 hover:bg-white/70',
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                  {p.label}
                </span>
                <span className="hidden pl-6 text-[10px] leading-tight text-slate-500 md:block">{p.short}</span>
              </button>
            )
          })}
        </aside>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto p-4 lg:p-5">
          {panel === 'sales' && (
            <ReportPlaceholder
              title="รายงานยอดขาย"
              body="สรุปยอดตามช่วงวัน สาขา พนักงาน และสินค้า — รองรับส่งออก Excel / PDF เมื่อเชื่อม backend"
            />
          )}
          {panel === 'stock' && (
            <ReportPlaceholder
              title="รายงานสต็อก"
              body="การเคลื่อนไหวคงเหลือ สินค้าใกล้หมด และวิเคราะห์สินค้าเคลื่อนที่ช้า"
            />
          )}
          {panel === 'finance' && (
            <ReportPlaceholder
              title="รายงานการเงิน"
              body="อายุลูกหนี้-เจ้าหนี้ สรุปรับ-จ่าย และภาพรวมกระแสเงินสดตามงวด"
            />
          )}
          {panel === 'tax' && (
            <ReportPlaceholder
              title="รายงานภาษี"
              body="สรุปใบกำกับภาษีขาย ภาษีซื้อ และฐานภาษีเพื่อยื่น ภ.พ.30 (เชื่อมข้อมูลจริง)"
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ReportPlaceholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-600">{body}</p>
      <p className="mt-6 font-mono text-[10px] text-slate-400">— PoC —</p>
    </div>
  )
}
