import {
  loadDashboardPreferences,
  saveDashboardPreferences,
  type DashboardPreferences,
} from '@/features/main/data/dashboardPreferences'
import { getCashOnHandBaht, setCashOnHandBaht } from '@/features/main/data/dashboardCashOnHand'
import { buddhistEraYearLast2Digits } from '@/features/pos/data/posBillSequence'
import { getDeviceLabel } from '@/features/device/deviceSession'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import { useEffect, useState } from 'react'

export function DashboardLayoutSettingsForm() {
  const { openTab } = useWorkspaceTabs()
  const [prefs, setPrefs] = useState<DashboardPreferences>(() => loadDashboardPreferences())
  const [cashInput, setCashInput] = useState(() => String(getCashOnHandBaht()))
  const [cashSaved, setCashSaved] = useState(false)

  useEffect(() => {
    const onPrefs = () => setPrefs(loadDashboardPreferences())
    const onCash = () => setCashInput(String(getCashOnHandBaht()))
    window.addEventListener('bento-dashboard-prefs-changed', onPrefs)
    window.addEventListener('bento-dashboard-cash-changed', onCash)
    return () => {
      window.removeEventListener('bento-dashboard-prefs-changed', onPrefs)
      window.removeEventListener('bento-dashboard-cash-changed', onCash)
    }
  }, [])

  const updatePrefs = (next: DashboardPreferences) => {
    setPrefs(next)
    saveDashboardPreferences(next)
  }

  const saveCash = () => {
    const n = Number(String(cashInput).replace(/,/g, ''))
    if (!Number.isFinite(n) || n < 0) return
    setCashOnHandBaht(n)
    setCashInput(String(getCashOnHandBaht()))
    setCashSaved(true)
    window.setTimeout(() => setCashSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">การ์ดสรุปบนแดชบอร์ด</p>
        <ul className="space-y-2">
          {(
            [
              ['showTopProducts', 'สินค้าขายดี (POS)', prefs.showTopProducts],
              ['showLowStock', 'สต็อกใกล้หมด', prefs.showLowStock],
              ['showTodaySales', 'ยอดขายวันนี้', prefs.showTodaySales],
              ['showCashOnHand', 'เงินสดในเก๊ะ (Cash on hand)', prefs.showCashOnHand],
            ] as const
          ).map(([key, label, checked]) => (
            <li key={key}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-800">
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-300 text-slate-800 focus:ring-slate-400"
                  checked={checked}
                  onChange={(e) =>
                    updatePrefs({
                      ...prefs,
                      [key]: e.target.checked,
                    })
                  }
                />
                {label}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
        <p className="mb-1.5 text-xs font-semibold text-slate-800">เลขบิล POS กับเลขเครื่อง</p>
        <p className="mb-2 text-xs leading-relaxed text-slate-600">
          เลขที่บิลหน้าขายใช้รูปแบบ{' '}
          <span className="font-mono text-[11px] text-slate-800">{'{เครื่อง}P{ปี พ.ศ. 2 หลัก}-{ลำดับ 6 หลัก}'}</span>{' '}
          เช่น <span className="font-mono text-[11px]">1PA69040001</span> (PC1, อังอะไหล่, พ.ศ. 69 เดือน 4) — ลำดับรีทุกเดือน
        </p>
        <p className="text-xs leading-relaxed text-slate-600">
          ตั้งชื่อเครื่องเป็น <span className="font-medium text-slate-800">PC1 / PC2</span> ในแถบบนของโปรแกรม (เฉพาะแอดมิน) ระบบจะดึงเลขจากชื่อเครื่องอัตโนมัติ — ปัจจุบัน:{' '}
          <span className="font-mono text-[11px] font-semibold text-slate-900">{getDeviceLabel()}</span> → หัวบิลจะขึ้นต้นด้วยเลขนั้น + P + ปี (
          {String(buddhistEraYearLast2Digits()).padStart(2, '0')})
        </p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
        <p className="mb-1.5 text-xs font-semibold text-slate-800">เงินสดในเก๊ะ (Cash on hand)</p>
        <p className="mb-3 text-xs leading-relaxed text-slate-600">
          นับเงินในลิ้นชักแล้วใส่ยอดประมาณการ — ใช้ดูบนแดชบอร์ด (เก็บในเครื่อง mock ยังไม่ผูกกับบิลเงินสดอัตโนมัติ)
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-0.5 sm:max-w-xs">
            <span className="text-[11px] text-slate-600">จำนวนเงิน (บาท)</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm tabular-nums"
            />
          </label>
          <button
            type="button"
            onClick={saveCash}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            บันทึก
          </button>
          {cashSaved ? <span className="text-xs text-emerald-700">บันทึกแล้ว</span> : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <p className="text-sm leading-relaxed text-slate-600">
          ต้องการตั้งชื่อร้าน คีย์ลัด หรือผู้ใช้?{' '}
          <button
            type="button"
            onClick={() => openTab('settings', 'ตั้งค่า')}
            className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-600"
          >
            เปิดตั้งค่าระบบ
          </button>
        </p>
      </div>
    </div>
  )
}
