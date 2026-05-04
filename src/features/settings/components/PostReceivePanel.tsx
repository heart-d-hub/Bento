import { clsx } from 'clsx'
import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import {
  loadPostReceiveSettings,
  POST_RECEIVE_SETTINGS_CHANGED_EVENT,
  savePostReceiveSettings,
  type AutoLabelRule,
} from '@/features/purchase/data/postReceiveSettings'

const RULE_OPTIONS: { id: AutoLabelRule; title: string; desc: string }[] = [
  {
    id: 'skipIfBoxBarcode',
    title: 'ข้ามถ้ามีบาร์โค้ดบนสินค้า (แนะนำ)',
    desc:
      'SKU ที่มี boxBarcode ในแฟ้มสินค้า จะถูกข้ามจากคิวพิมพ์ป้าย — สมมติว่ามีบาร์โค้ด/ราคาจากผู้ผลิตอยู่แล้ว ' +
      'SKU ที่ไม่มี boxBarcode จะเข้าคิวอัตโนมัติ',
  },
  {
    id: 'always',
    title: 'พิมพ์ทุก SKU ที่รับเข้า',
    desc:
      'ทุก SKU จะเข้าคิวพิมพ์ป้ายอัตโนมัติ ไม่ว่าจะมีบาร์โค้ดบนสินค้าหรือไม่ — เหมาะกับร้านที่ติดป้ายราคาของตัวเองเสมอ',
  },
  {
    id: 'manual',
    title: 'ให้ผู้ใช้เลือกเอง',
    desc:
      'ไม่ auto-queue — กล่อง «หลังรับของ» จะแสดงรายการสินค้าให้กดเองว่าตัวไหนต้องพิมพ์ ' +
      'เหมาะกับร้านที่ติดป้ายเฉพาะบางตัว',
  },
]

export function PostReceivePanel() {
  const [settings, setSettings] = useState(() => loadPostReceiveSettings())

  useEffect(() => {
    const sync = () => setSettings(loadPostReceiveSettings())
    window.addEventListener(POST_RECEIVE_SETTINGS_CHANGED_EVENT, sync)
    return () => window.removeEventListener(POST_RECEIVE_SETTINGS_CHANGED_EVENT, sync)
  }, [])

  const setRule = (rule: AutoLabelRule) => {
    const next = { ...settings, autoLabelRule: rule }
    setSettings(next)
    savePostReceiveSettings(next)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Printer className="size-4 text-violet-700" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-900">กฎคิวพิมพ์ป้ายหลังรับของ</h2>
        </div>
        <p className="mb-3 text-xs text-slate-600">
          เลือกว่าหลังบันทึกการรับของแล้ว ระบบจะส่ง SKU ไหนเข้าคิวพิมพ์ป้ายอัตโนมัติ —
          กฎนี้ใช้ในกล่อง «หลังรับของ» ที่เปิดขึ้นหลังกดบันทึก
        </p>

        <div className="space-y-2">
          {RULE_OPTIONS.map((opt) => {
            const active = settings.autoLabelRule === opt.id
            return (
              <label
                key={opt.id}
                className={clsx(
                  'flex cursor-pointer gap-3 rounded-xl border p-3 transition',
                  active
                    ? 'border-violet-300 bg-violet-50/70 ring-1 ring-violet-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50',
                )}
              >
                <input
                  type="radio"
                  name="post-receive-auto-label-rule"
                  checked={active}
                  onChange={() => setRule(opt.id)}
                  className="mt-1 size-4 shrink-0 accent-violet-600"
                />
                <div className="min-w-0">
                  <p className={clsx('text-sm font-semibold', active ? 'text-violet-900' : 'text-slate-800')}>
                    {opt.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-600">{opt.desc}</p>
                </div>
              </label>
            )
          })}
        </div>

        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          💡 กฎที่ตั้งใช้กับ PO ที่รับเข้าครั้งถัดไปทันที — ไม่กระทบ task เดิมที่ค้างอยู่
        </p>
      </section>
    </div>
  )
}
