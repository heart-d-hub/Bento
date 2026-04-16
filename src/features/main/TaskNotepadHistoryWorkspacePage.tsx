import {
  formatTaskPadDateHeading,
  formatTaskPadTime,
  loadTaskPadHistory,
  type TaskPadDayArchive,
  TASK_PAD_HISTORY_CHANGED_EVENT,
} from '@/features/main/data/homeTaskPadStorage'
import { clsx } from 'clsx'
import { Calendar, ChevronRight, ClipboardList } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type TaskNotepadHistoryWorkspacePageProps = {
  className?: string
}

export function TaskNotepadHistoryWorkspacePage({ className }: TaskNotepadHistoryWorkspacePageProps) {
  const [archives, setArchives] = useState<TaskPadDayArchive[]>(() => loadTaskPadHistory())
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setArchives(loadTaskPadHistory())
  }, [])

  useEffect(() => {
    refresh()
    const onHist = () => refresh()
    window.addEventListener(TASK_PAD_HISTORY_CHANGED_EVENT, onHist)
    window.addEventListener('storage', onHist)
    return () => {
      window.removeEventListener(TASK_PAD_HISTORY_CHANGED_EVENT, onHist)
      window.removeEventListener('storage', onHist)
    }
  }, [refresh])

  useEffect(() => {
    if (archives.length && !selectedKey) {
      setSelectedKey(archives[0].dateKey)
    }
    if (selectedKey && !archives.some((a) => a.dateKey === selectedKey)) {
      setSelectedKey(archives[0]?.dateKey ?? null)
    }
  }, [archives, selectedKey])

  const selected = archives.find((a) => a.dateKey === selectedKey) ?? null

  return (
    <div
      className={clsx(
        'flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-5',
        className,
      )}
    >
      <header className="shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
            <ClipboardList className="size-5" strokeWidth={1.5} aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">ประวัติสั่งงาน / โน้ต</h1>
            <p className="mt-0.5 text-sm text-slate-600">
              สรุปท้ายวันอัตโนมัติเมื่อเปลี่ยนวัน · ไม่เก็บรายการที่ลบออกจากโน้ต
            </p>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:gap-4">
        <nav
          className="flex max-h-48 shrink-0 flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:max-h-none lg:w-72 lg:shrink-0"
          aria-label="เลือกวัน"
        >
          {archives.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500">
              ยังไม่มีประวัติ
              <br />
              <span className="text-xs text-slate-400">เมื่อครบวันและมีรายการในโน้ต ระบบจะสรุปให้</span>
            </p>
          ) : (
            <ul className="space-y-0.5">
              {archives.map((a) => {
                const active = a.dateKey === selectedKey
                return (
                  <li key={a.dateKey}>
                    <button
                      type="button"
                      onClick={() => setSelectedKey(a.dateKey)}
                      className={clsx(
                        'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition',
                        active
                          ? 'bg-sky-50 font-medium text-sky-950 ring-1 ring-sky-200'
                          : 'text-slate-800 hover:bg-slate-50',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Calendar className="size-4 shrink-0 opacity-60" aria-hidden />
                        <span className="truncate">{formatTaskPadDateHeading(a.dateKey)}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                        {a.items.length}
                        <ChevronRight
                          className={clsx('size-4', active ? 'text-sky-600' : 'opacity-40')}
                          aria-hidden
                        />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </nav>

        <section
          className="min-h-0 min-w-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm"
          aria-live="polite"
        >
          {!selected ? (
            <p className="p-8 text-center text-sm text-slate-500">เลือกวันจากรายการด้านซ้าย</p>
          ) : (
            <div className="p-4 sm:p-5">
              <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
                {formatTaskPadDateHeading(selected.dateKey)}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                บันทึกสรุปเมื่อ{' '}
                {new Date(selected.savedAt).toLocaleString('th-TH', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}{' '}
                · {selected.items.length} รายการ
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[28rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="pb-2 pr-3">งาน</th>
                      <th className="whitespace-nowrap pb-2 px-2">สถานะ</th>
                      <th className="whitespace-nowrap pb-2 px-2">เพิ่ม</th>
                      <th className="whitespace-nowrap pb-2 pl-2">สำเร็จ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((row, i) => (
                      <tr key={`${row.text}-${i}`} className="border-b border-slate-100 last:border-0">
                        <td
                          className={clsx(
                            'py-2.5 pr-3 align-top',
                            row.done ? 'text-slate-500 line-through' : 'text-slate-900',
                          )}
                        >
                          {row.text}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 align-top">
                          <span
                            className={clsx(
                              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                              row.done
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-amber-50 text-amber-900',
                            )}
                          >
                            {row.done ? 'สำเร็จ' : 'ค้าง'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 align-top tabular-nums text-slate-600">
                          {formatTaskPadTime(row.createdAt)}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pl-2 align-top tabular-nums text-slate-600">
                          {row.completedAt ? formatTaskPadTime(row.completedAt) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
