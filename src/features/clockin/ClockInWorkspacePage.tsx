import { getStoredBranch } from '@/features/auth/authSession'
import { addClockRecord, deleteClockRecord, loadClockRecords } from '@/features/clockin/data/clockInStore'
import type { ClockRecord } from '@/features/clockin/data/clockInStore'
import {
  loadStaffUsers,
  STAFF_USERS_CHANGED_EVENT,
} from '@/features/settings/data/staffUsersStore'
import type { StaffUser } from '@/features/settings/data/mockStaffUsers'
import { clsx } from 'clsx'
import { Clock, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type ClockInWorkspacePageProps = {
  className?: string
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function staffDisplayName(u: StaffUser): string {
  return u.displayNamePos?.trim() || u.username.trim()
}

function calcWorkMinutes(records: ClockRecord[], name: string, date: string, nowMs: number): number {
  const sorted = records
    .filter((r) => r.staffName === name && r.date === date)
    .sort((a, b) => a.at.localeCompare(b.at))
  let total = 0
  let lastIn: number | null = null
  for (const r of sorted) {
    if (r.type === 'in') {
      lastIn = new Date(r.at).getTime()
    } else if (r.type === 'out' && lastIn !== null) {
      total += new Date(r.at).getTime() - lastIn
      lastIn = null
    }
  }
  if (lastIn !== null && date === isoToday()) total += nowMs - lastIn
  return Math.round(total / 60000)
}

function formatMinutes(mins: number): string {
  if (mins <= 0) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} น.`
  return m === 0 ? `${h} ชม.` : `${h} ชม. ${m} น.`
}

export function ClockInWorkspacePage({ className }: ClockInWorkspacePageProps) {
  const branch = getStoredBranch()
  const [now, setNow] = useState(() => new Date())
  const [records, setRecords] = useState<ClockRecord[]>(() => loadClockRecords())
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() =>
    loadStaffUsers().filter((u) => u.status === 'active'),
  )
  const [confirmingUser, setConfirmingUser] = useState<StaffUser | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const on = () => setStaffUsers(loadStaffUsers().filter((u) => u.status === 'active'))
    window.addEventListener(STAFF_USERS_CHANGED_EVENT, on)
    return () => window.removeEventListener(STAFF_USERS_CHANGED_EVENT, on)
  }, [])

  const todayStr = isoToday()

  const todayRecords = useMemo(
    () => records.filter((r) => r.date === todayStr).sort((a, b) => b.at.localeCompare(a.at)),
    [records, todayStr],
  )

  // For each active staff, compute their current status from ALL records (most recent punch)
  function getStatus(name: string): 'in' | 'out' | null {
    const last = records
      .filter((r) => r.staffName === name)
      .sort((a, b) => a.at.localeCompare(b.at))
      .at(-1)
    return last?.type ?? null
  }

  function getLastPunchTime(name: string): string | null {
    const last = records
      .filter((r) => r.staffName === name && r.date === todayStr)
      .sort((a, b) => a.at.localeCompare(b.at))
      .at(-1)
    if (!last) return null
    return new Date(last.at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  }

  const confirmAction = confirmingUser
    ? getStatus(staffDisplayName(confirmingUser)) === 'in'
      ? 'out'
      : 'in'
    : null

  const handleConfirm = () => {
    if (!confirmingUser || !confirmAction) return
    addClockRecord({
      staffName: staffDisplayName(confirmingUser),
      type: confirmAction,
      at: new Date().toISOString(),
      note: note.trim() || undefined,
    })
    setRecords(loadClockRecords())
    setConfirmingUser(null)
    setNote('')
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('ลบรายการนี้?')) return
    deleteClockRecord(id)
    setRecords(loadClockRecords())
  }

  const allNamesInRecords = useMemo(() => {
    const s = new Set<string>()
    for (const r of records) s.add(r.staffName)
    return Array.from(s)
  }, [records])

  const historyDays = useMemo(() => {
    const days: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }
    return days
  }, [])

  // Names for history columns: active staff + any historical names not in active list
  const historyNames = useMemo(() => {
    const active = staffUsers.map(staffDisplayName)
    const extra = allNamesInRecords.filter((n) => !active.includes(n))
    return [...active, ...extra].sort()
  }, [staffUsers, allNamesInRecords])

  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm',
        className,
      )}
    >
      {/* Header */}
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <Clock className="size-5 text-sky-600" aria-hidden />
        <div>
          <h1 className="text-sm font-bold text-slate-900">ลงเวลา</h1>
          <p className="text-[11px] text-slate-500">
            กดชื่อพนักงานเพื่อบันทึกเวลาเข้า-ออกงาน · สาขา {branch?.name ?? '—'}
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-auto">
        {/* Live clock */}
        <div className="shrink-0 bg-gradient-to-r from-sky-600 to-sky-700 px-4 py-4 text-center text-white">
          <p className="font-mono text-5xl font-black tabular-nums tracking-tight">
            {now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="mt-1 text-sm font-medium text-sky-100">
            {now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
          {/* Staff card grid */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              แตะชื่อเพื่อลงเวลา
            </p>
            {staffUsers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                ยังไม่มีพนักงานในระบบ — เพิ่มที่เมนู ตั้งค่า → พนักงาน
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {staffUsers.map((u) => {
                  const name = staffDisplayName(u)
                  const status = getStatus(name)
                  const isIn = status === 'in'
                  const lastTime = getLastPunchTime(name)
                  const mins = calcWorkMinutes(records, name, todayStr, now.getTime())
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => { setConfirmingUser(u); setNote('') }}
                      className={clsx(
                        'group flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition active:scale-95',
                        isIn
                          ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100'
                          : 'border-slate-200 bg-white hover:bg-slate-50',
                      )}
                    >
                      {/* Avatar circle */}
                      <div
                        className={clsx(
                          'flex size-14 items-center justify-center rounded-full text-xl font-black',
                          isIn ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="text-sm font-bold text-slate-800">{name}</p>
                      <div className="flex flex-col items-center gap-0.5">
                        <span
                          className={clsx(
                            'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                            isIn ? 'bg-emerald-100 text-emerald-700' : status === 'out' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500',
                          )}
                        >
                          {isIn ? (
                            <><span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> อยู่ในร้าน</>
                          ) : status === 'out' ? (
                            'ออกแล้ว'
                          ) : (
                            'ยังไม่เข้า'
                          )}
                        </span>
                        {lastTime && (
                          <span className="text-[9px] text-slate-400">
                            {isIn ? 'เข้า' : 'ออก'} {lastTime} น.
                          </span>
                        )}
                        {mins > 0 && (
                          <span className={clsx('text-[9px] font-semibold', isIn ? 'text-emerald-600' : 'text-slate-500')}>
                            {formatMinutes(mins)}{isIn ? ' ▶' : ''}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Today's log */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              บันทึกวันนี้
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal text-slate-600">
                {todayRecords.length}
              </span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[420px] text-xs">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">เวลา</th>
                    <th className="px-3 py-2 text-left">พนักงาน</th>
                    <th className="px-3 py-2 text-left">ประเภท</th>
                    <th className="px-3 py-2 text-left">หมายเหตุ</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {todayRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                        ยังไม่มีการลงเวลาวันนี้
                      </td>
                    </tr>
                  ) : (
                    todayRecords.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono tabular-nums">
                          {new Date(r.at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-3 py-2 font-semibold">{r.staffName}</td>
                        <td className="px-3 py-2">
                          <span
                            className={clsx(
                              'rounded-full px-2 py-0.5 text-[10px] font-bold',
                              r.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                            )}
                          >
                            {r.type === 'in' ? 'เข้างาน' : 'ออกงาน'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-500">{r.note ?? '—'}</td>
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            className="text-slate-300 hover:text-rose-500"
                            title="ลบ"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 7-day history */}
          {records.length > 0 && historyNames.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">ประวัติ 7 วัน</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="py-1 pr-4 text-left font-semibold text-slate-500">วันที่</th>
                      {historyNames.map((n) => (
                        <th key={n} className="px-3 py-1 text-center font-semibold text-slate-500">
                          {n}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historyDays.map((date) => {
                      const hasData = records.some((r) => r.date === date)
                      if (!hasData && date !== todayStr) return null
                      const isToday = date === todayStr
                      return (
                        <tr key={date} className="border-t border-slate-100">
                          <td className="py-1.5 pr-4 font-mono text-slate-600">
                            {new Date(`${date}T12:00:00`).toLocaleDateString('th-TH', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                            {isToday && (
                              <span className="ml-1 rounded bg-sky-100 px-1 text-[9px] font-bold text-sky-700">
                                วันนี้
                              </span>
                            )}
                          </td>
                          {historyNames.map((name) => {
                            const mins = calcWorkMinutes(records, name, date, now.getTime())
                            const isIn = isToday && getStatus(name) === 'in'
                            return (
                              <td key={name} className="px-3 py-1.5 text-center tabular-nums">
                                {mins > 0 ? (
                                  <span className={clsx('font-semibold', isIn ? 'text-emerald-600' : 'text-slate-700')}>
                                    {formatMinutes(mins)}{isIn ? ' ▶' : ''}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation overlay */}
      {confirmingUser && confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            {/* Close */}
            <button
              type="button"
              onClick={() => setConfirmingUser(null)}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            >
              <X className="size-4" />
            </button>

            {/* Avatar + name */}
            <div className="mb-4 flex flex-col items-center gap-3 text-center">
              <div
                className={clsx(
                  'flex size-20 items-center justify-center rounded-full text-3xl font-black',
                  confirmAction === 'out' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white',
                )}
              >
                {staffDisplayName(confirmingUser).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">{staffDisplayName(confirmingUser)}</p>
                <p className={clsx('text-sm font-semibold', confirmAction === 'out' ? 'text-amber-600' : 'text-emerald-600')}>
                  {confirmAction === 'in' ? '→ บันทึกเข้างาน' : '→ บันทึกออกงาน'}
                </p>
                <p className="mt-0.5 font-mono text-xs text-slate-400">
                  {now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.
                </p>
              </div>
            </div>

            {/* Note */}
            <div className="mb-4">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <input
                type="text"
                value={note}
                autoFocus
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                placeholder="เช่น มาสาย, ออกธุระ..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingUser(null)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={clsx(
                  'flex-2 rounded-xl py-3 px-6 text-sm font-black text-white shadow-sm',
                  confirmAction === 'out'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-emerald-500 hover:bg-emerald-600',
                )}
              >
                {confirmAction === 'in' ? '✅ ยืนยันเข้างาน' : '⏰ ยืนยันออกงาน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
