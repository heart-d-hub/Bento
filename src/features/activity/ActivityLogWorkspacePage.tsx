import { clsx } from 'clsx'
import {
  ACTIVITY_LOG_CHANGED_EVENT,
  loadActivityLogs,
  type ActivityCategory,
  type ActivityLogEntry,
} from '@/features/activity/data/activityLogStore'
import { Copy, Download, History } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type ActivityLogWorkspacePageProps = {
  className?: string
}

type ActivityFilterCategory = 'all' | ActivityCategory

const CATEGORY_LABEL: Record<ActivityCategory, string> = {
  auth: 'เข้าสู่ระบบ',
  pos: 'ขาย POS',
  stock: 'สต็อก',
  member: 'สมาชิก',
  settings: 'ตั้งค่า',
}

/** ตัวอย่างรายการ — แทนข้อมูลจาก backend / audit log */
const MOCK_LOGS: ActivityLogEntry[] = [
  {
    id: '1',
    at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    actor: 'admin',
    category: 'auth',
    detail: 'เข้าสู่ระบบที่สาขาหลัก',
  },
  {
    id: '2',
    at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    actor: 'sale01',
    category: 'pos',
    detail: 'บันทึกการขาย POS-2026-0042 ยอด ฿3,240.00',
  },
  {
    id: '3',
    at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    actor: 'sale01',
    category: 'stock',
    detail: 'ปรับสต็อกสินค้า SKU DMAX-OIL-001 ลด 2 ชิ้น (ขาย)',
  },
  {
    id: '4',
    at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    actor: 'admin',
    category: 'member',
    detail: 'แก้ไขข้อมูลสมาชิก M-1024 (เบอร์โทร)',
  },
  {
    id: '5',
    at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    actor: 'admin',
    category: 'settings',
    detail: 'เปลี่ยนชื่อร้านในโปรไฟล์สาขา',
  },
  {
    id: '6',
    at: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
    actor: 'manager',
    category: 'pos',
    detail: 'พิมพ์ใบเสร็จ POS BILL-2026-0015',
  },
  {
    id: '7',
    at: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    actor: 'admin',
    category: 'stock',
    detail:
      'อนุมัติขายสต็อกไม่พอ: สูตร ASM-240991 / ชุดสายแบต 35mm (บิล 1 บรรทัด) เหตุผล "ลูกค้ารับงานด่วน รอของเข้าเย็นนี้" | BATT-CABLE-35 สายแบต 35mm ขาด 3',
  },
  {
    id: '8',
    at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    actor: 'admin',
    category: 'stock',
    detail:
      'อนุมัติขายสต็อกไม่พอ: สูตร ASM-241003 / ชุดกรองแย็ก (แตกหลายบรรทัด) เหตุผล "อู่ต้องส่งรถคืนนี้ เติมสต็อกพรุ่งนี้เช้า" | FIL-WATER-001 ไส้กรองดักน้ำ ขาด 1 | HEAD-YAK-002 หัวแย็ก ขาด 1',
  },
]

function isShortageApprovalLog(e: ActivityLogEntry): boolean {
  return e.detail.includes('อนุมัติขายสต็อกไม่พอ:')
}

function escapeCsv(v: string): string {
  const s = String(v ?? '')
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function extractShortageItems(detail: string): string[] {
  const parts = detail
    .split('|')
    .map((x) => x.trim())
    .filter(Boolean)
  if (parts.length <= 1) return []
  return parts.slice(1)
}

type ParsedShortageItem = {
  raw: string
  sku: string
  name: string
  qty: number
}

function parseShortageItem(raw: string): ParsedShortageItem {
  const clean = raw.trim()
  const m = clean.match(/^([A-Za-z0-9._-]+)\s+(.+?)\s+ขาด\s+([0-9]+(?:\.[0-9]+)?)$/)
  if (!m) {
    return { raw: clean, sku: clean, name: '', qty: 0 }
  }
  return {
    raw: clean,
    sku: m[1],
    name: m[2],
    qty: Number(m[3]) || 0,
  }
}

function formatLogTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('th-TH', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return iso
  }
}

export function ActivityLogWorkspacePage({ className }: ActivityLogWorkspacePageProps) {
  const [category, setCategory] = useState<ActivityFilterCategory>('all')
  const [query, setQuery] = useState('')
  const [shortageOnly, setShortageOnly] = useState(false)
  const [storedRows, setStoredRows] = useState<ActivityLogEntry[]>(() => loadActivityLogs())

  useEffect(() => {
    const refresh = () => setStoredRows(loadActivityLogs())
    refresh()
    window.addEventListener(ACTIVITY_LOG_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(ACTIVITY_LOG_CHANGED_EVENT, refresh)
  }, [])

  const rows = useMemo(() => {
    const source = storedRows.length > 0 ? storedRows : MOCK_LOGS
    const q = query.trim().toLowerCase()
    return source.filter((e) => {
      if (category !== 'all' && e.category !== category) return false
      if (shortageOnly && !isShortageApprovalLog(e)) return false
      if (!q) return true
      return (
        e.actor.toLowerCase().includes(q) ||
        e.detail.toLowerCase().includes(q) ||
        CATEGORY_LABEL[e.category].includes(q)
      )
    }).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  }, [storedRows, category, shortageOnly, query])

  const shortageRows = useMemo(() => rows.filter(isShortageApprovalLog), [rows])
  const shortageTodayCount = useMemo(() => {
    const now = new Date()
    return shortageRows.filter((e) => {
      const d = new Date(e.at)
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      )
    }).length
  }, [shortageRows])

  const exportShortageCsv = () => {
    if (shortageRows.length === 0) {
      window.alert('ยังไม่มีรายการอนุมัติขายสต็อกไม่พอสำหรับ Export')
      return
    }
    const header = ['เวลา', 'ผู้ใช้', 'ประเภท', 'รายละเอียด']
    const lines = [
      header.map(escapeCsv).join(','),
      ...shortageRows.map((e) =>
        [new Date(e.at).toLocaleString('th-TH'), e.actor, CATEGORY_LABEL[e.category], e.detail]
          .map(escapeCsv)
          .join(','),
      ),
    ]
    const csv = '\uFEFF' + lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    a.download = `shortage-approvals-${stamp}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyShortageList = async () => {
    if (shortageRows.length === 0) {
      window.alert('ยังไม่มีรายการอนุมัติขายสต็อกไม่พอสำหรับคัดลอก')
      return
    }
    const lines = shortageRows.flatMap((e) => {
      const items = extractShortageItems(e.detail)
      if (items.length === 0) {
        return [`- ${new Date(e.at).toLocaleString('th-TH')} | ${e.actor} | ${e.detail}`]
      }
      return items.map((it) => `- ${new Date(e.at).toLocaleString('th-TH')} | ${e.actor} | ${it}`)
    })
    const text = `รายการที่ขาดจากการอนุมัติขายสต็อกไม่พอ (${lines.length} รายการ)\n` + lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      window.alert('คัดลอกรายการที่ขาดแล้ว')
    } catch {
      window.alert('คัดลอกไม่สำเร็จ กรุณาอนุญาตสิทธิ์ Clipboard')
    }
  }

  const copyShortageDedup = async () => {
    if (shortageRows.length === 0) {
      window.alert('ยังไม่มีรายการอนุมัติขายสต็อกไม่พอสำหรับคัดลอก')
      return
    }

    const allItems = shortageRows.flatMap((e) => extractShortageItems(e.detail).map(parseShortageItem))
    const bySku = new Map<string, { sku: string; name: string; qty: number }>()
    for (const it of allItems) {
      const key = it.sku.trim() || it.raw
      const cur = bySku.get(key) ?? { sku: key, name: it.name, qty: 0 }
      cur.qty += Math.max(0, it.qty || 0)
      if (!cur.name && it.name) cur.name = it.name
      bySku.set(key, cur)
    }

    const merged = [...bySku.values()].sort((a, b) => a.sku.localeCompare(b.sku, 'th'))
    if (merged.length === 0) {
      window.alert('ไม่พบรายการที่ขาดที่อ่านได้')
      return
    }
    const lines = merged.map(
      (x) => `- ${x.sku}${x.name ? ` ${x.name}` : ''} ขาดรวม ${x.qty.toLocaleString('th-TH', { maximumFractionDigits: 3 })}`,
    )
    const text = `รายการขาดรวม (ไม่ซ้ำ) จากอนุมัติขายสต็อกไม่พอ (${merged.length} SKU)\n` + lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      window.alert('คัดลอกรายการไม่ซ้ำแล้ว')
    } catch {
      window.alert('คัดลอกไม่สำเร็จ กรุณาอนุญาตสิทธิ์ Clipboard')
    }
  }

  return (
    <div
      className={clsx(
        'flex min-h-[min(85vh,56rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50/90 to-white px-4 py-3 lg:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-violet-200/80 bg-white text-violet-800 shadow-sm">
            <History className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h1 className="text-base font-semibold text-slate-900 lg:text-lg">Log Activity</h1>
            <p className="text-xs text-slate-600 lg:text-sm">
              บันทึกการกระทำในระบบ (ตัวอย่าง) — เชื่อม audit log จริงในขั้นถัดไป
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4 lg:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="block min-w-[10rem]">
            <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
              ประเภท
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ActivityCategory)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            >
              <option value="all">ทั้งหมด</option>
              {(Object.keys(CATEGORY_LABEL) as (keyof typeof CATEGORY_LABEL)[]).map((k) => (
                <option key={k} value={k}>
                  {CATEGORY_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-0 flex-1 sm:max-w-xs">
            <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
              ค้นหา
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ผู้ใช้ / รายละเอียด…"
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </label>
          <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-2.5 text-xs text-amber-900">
            <input
              type="checkbox"
              checked={shortageOnly}
              onChange={(e) => setShortageOnly(e.target.checked)}
              className="size-3.5 rounded border-amber-400 text-amber-700 focus:ring-amber-500"
            />
            ดูเฉพาะอนุมัติขายสต็อกไม่พอ
          </label>
          <button
            type="button"
            onClick={exportShortageCsv}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Download className="size-3.5" aria-hidden />
            Export CSV (อนุมัติขาดสต็อก)
          </button>
          <button
            type="button"
            onClick={() => {
              void copyShortageList()
            }}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            <Copy className="size-3.5" aria-hidden />
            Copy รายการที่ขาด
          </button>
          <button
            type="button"
            onClick={() => {
              void copyShortageDedup()
            }}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-violet-300 bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-700"
          >
            <Copy className="size-3.5" aria-hidden />
            Copy รายการไม่ซ้ำ
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
            <p className="text-[10px] text-amber-800">อนุมัติขายสต็อกไม่พอ (ในมุมมองนี้)</p>
            <p className="text-sm font-semibold text-amber-950">{shortageRows.length.toLocaleString('th-TH')}</p>
          </div>
          <div className="rounded-lg border border-cyan-200 bg-cyan-50/70 px-3 py-2">
            <p className="text-[10px] text-cyan-800">อนุมัติขายสต็อกไม่พอ (วันนี้)</p>
            <p className="text-sm font-semibold text-cyan-950">{shortageTodayCount.toLocaleString('th-TH')}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
            <p className="text-[10px] text-slate-600">รายการทั้งหมดในมุมมอง</p>
            <p className="text-sm font-semibold text-slate-900">{rows.length.toLocaleString('th-TH')}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200/90 bg-slate-50/40">
          <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-slate-200 bg-white text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-3 py-2">เวลา</th>
                <th className="whitespace-nowrap px-3 py-2">ผู้ใช้</th>
                <th className="whitespace-nowrap px-3 py-2">ประเภท</th>
                <th className="min-w-[12rem] px-3 py-2">รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-slate-500">
                    ไม่มีรายการที่ตรงกับตัวกรอง
                  </td>
                </tr>
              ) : (
                rows.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 bg-white/90 last:border-0 hover:bg-violet-50/40">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] tabular-nums text-slate-600">
                      {formatLogTime(e.at)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">{e.actor}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                        {CATEGORY_LABEL[e.category]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{e.detail}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-slate-400">
          แสดง {rows.length} รายการ {storedRows.length > 0 ? `(ข้อมูลจริง ${storedRows.length} แถว)` : `(ข้อมูลตัวอย่าง ${MOCK_LOGS.length} แถว)`}
        </p>
      </div>
    </div>
  )
}
