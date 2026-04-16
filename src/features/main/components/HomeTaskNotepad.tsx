import {
  formatTaskPadTime,
  loadTasks,
  saveTasks,
  type TaskPadItem,
} from '@/features/main/data/homeTaskPadStorage'
import { clsx } from 'clsx'
import { ClipboardList } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type ContextState = { x: number; y: number; taskId: string } | null

type HomeTaskNotepadProps = {
  className?: string
}

export function HomeTaskNotepad({ className }: HomeTaskNotepadProps) {
  const [tasks, setTasks] = useState<TaskPadItem[]>(() => loadTasks())
  const [draft, setDraft] = useState('')
  const [menu, setMenu] = useState<ContextState>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  const addTask = useCallback(() => {
    const t = draft.trim()
    if (!t) return
    setTasks((prev) => [{ id: newId(), text: t, done: false, createdAt: Date.now() }, ...prev])
    setDraft('')
  }, [draft])

  const markDone = useCallback((id: string) => {
    const now = Date.now()
    setTasks((prev) =>
      prev.map((x) => (x.id === id ? { ...x, done: true, completedAt: now } : x)),
    )
    setMenu(null)
  }, [])

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((x) => x.id !== id))
    setMenu(null)
  }, [])

  const clearAll = useCallback(() => {
    if (tasks.length === 0) return
    if (!window.confirm('ลบรายการทั้งหมดในโน้ตนี้?')) return
    setTasks([])
    setMenu(null)
  }, [tasks.length])

  useEffect(() => {
    if (!menu) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      setMenu(null)
    }
    const onScroll = () => setMenu(null)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [menu])

  const sorted = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return b.createdAt - a.createdAt
  })

  return (
    <section
      className={clsx(
        'flex min-h-[12rem] w-full shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:h-full lg:min-h-0 lg:w-56 lg:max-w-56 xl:w-60 xl:max-w-60',
        className,
      )}
      aria-label="โน้ตสั่งงานหน้าร้าน"
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
            <ClipboardList className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-tight text-slate-900">สั่งงาน / โน้ต</h2>
            <p className="text-[10px] leading-snug text-slate-500">
              เก็บในเครื่อง · คลิกขวา → สำเร็จ · สรุปท้ายวันเมื่อเปลี่ยนวัน
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearAll}
          disabled={tasks.length === 0}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-900 disabled:pointer-events-none disabled:opacity-35"
          title="ลบรายการทั้งหมด"
        >
          เคลียร์ทั้งหมด
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {sorted.length === 0 ? (
          <p className="px-1 py-4 text-center text-[11px] leading-relaxed text-slate-400">
            ยังไม่มีรายการ
            <br />
            พิมพ์ด้านล่างแล้วกด Enter
          </p>
        ) : (
          <ul className="space-y-1">
            {sorted.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onContextMenu={(e) => {
                    e.preventDefault()
                    const pad = 8
                    const mw = 160
                    const mh = 88
                    const x = Math.min(Math.max(pad, e.clientX), window.innerWidth - mw - pad)
                    const y = Math.min(Math.max(pad, e.clientY), window.innerHeight - mh - pad)
                    setMenu({ x, y, taskId: task.id })
                  }}
                  title="คลิกขวา: สำเร็จ / ลบ"
                  className={clsx(
                    'w-full rounded-lg border border-transparent px-2 py-1.5 text-left transition',
                    task.done
                      ? 'bg-slate-50 hover:border-slate-200 hover:bg-white'
                      : 'bg-slate-50/80 text-slate-800 hover:border-slate-200 hover:bg-white',
                  )}
                >
                  <span
                    className={clsx(
                      'block text-xs leading-snug',
                      task.done ? 'text-slate-500 line-through' : 'text-slate-800',
                    )}
                  >
                    {task.text}
                  </span>
                  <span className="mt-0.5 block text-[10px] tabular-nums leading-tight text-slate-400">
                    {task.done
                      ? task.completedAt
                        ? `สำเร็จ ${formatTaskPadTime(task.completedAt)} · เพิ่ม ${formatTaskPadTime(task.createdAt)}`
                        : `สำเร็จ · เพิ่ม ${formatTaskPadTime(task.createdAt)}`
                      : `เพิ่ม ${formatTaskPadTime(task.createdAt)}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-100 p-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              addTask()
            }
          }}
          placeholder="พิมพ์งานที่ต้องสั่ง…"
          rows={2}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-1 focus:ring-slate-200"
        />
        <p className="mt-1 text-[10px] text-slate-400">Enter เพิ่มรายการ · Shift+Enter ขึ้นบรรทัดใหม่</p>
      </div>

      {menu ? (
        <div
          ref={menuRef}
          className="fixed z-[300] min-w-[9rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg ring-1 ring-slate-950/10"
          style={{ left: menu.x, top: menu.y }}
          role="menu"
        >
          {!tasks.find((t) => t.id === menu.taskId)?.done ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full px-3 py-2 text-left text-xs text-slate-800 hover:bg-emerald-50"
              onClick={() => markDone(menu.taskId)}
            >
              สำเร็จ
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-50"
            onClick={() => removeTask(menu.taskId)}
          >
            ลบรายการ
          </button>
        </div>
      ) : null}
    </section>
  )
}
