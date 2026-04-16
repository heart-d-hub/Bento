import { StaffUserFormModal, type StaffUserFormValues } from '@/features/settings/components/StaffUserFormModal'
import {
  formatNationalIdDisplay,
  MOCK_STAFF_USERS,
  normalizeNationalIdDigits,
  STAFF_STATUS_LABELS,
  type StaffStatus,
  type StaffUser,
} from '@/features/settings/data/mockStaffUsers'
import { clsx } from 'clsx'
import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

function statusBadge(s: StaffStatus) {
  const cls =
    s === 'active'
      ? 'border-slate-200 bg-slate-100 text-slate-800'
      : 'border-slate-200 bg-slate-100 text-slate-600'
  return (
    <span className={clsx('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium', cls)}>
      {STAFF_STATUS_LABELS[s]}
    </span>
  )
}

export function UsersManagementPanel() {
  const [rows, setRows] = useState<StaffUser[]>(() => [...MOCK_STAFF_USERS])
  const [q, setQ] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<StaffUser | null>(null)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    const digitTerm = term.replace(/\D/g, '')
    return rows.filter((r) => {
      const textMatch =
        r.username.toLowerCase().includes(term) ||
        r.displayNamePos.toLowerCase().includes(term) ||
        r.role.toLowerCase().includes(term)
      const idMatch =
        digitTerm.length > 0 && normalizeNationalIdDigits(r.nationalId).includes(digitTerm)
      return textMatch || idMatch
    })
  }, [rows, q])

  const openCreate = () => {
    setEditing(null)
    setMode('create')
    setModalOpen(true)
  }

  const openEdit = (u: StaffUser) => {
    setEditing(u)
    setMode('edit')
    setModalOpen(true)
  }

  const handleSubmit = (v: StaffUserFormValues) => {
    if (mode === 'create') {
      const id = `staff-${Date.now()}`
      setRows((prev) => [
        {
          id,
          username: v.username.trim(),
          displayNamePos: v.displayNamePos.trim(),
          nationalId: normalizeNationalIdDigits(v.nationalId),
          photoDataUrl: v.photoDataUrl,
          password: v.password,
          role: v.role.trim(),
          startDate: v.startDate,
          status: v.status,
        },
        ...prev,
      ])
    } else if (editing) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === editing.id
            ? {
                ...r,
                displayNamePos: v.displayNamePos.trim(),
                nationalId: normalizeNationalIdDigits(v.nationalId),
                photoDataUrl: v.photoDataUrl,
                password: v.password.trim() ? v.password : r.password,
                role: v.role.trim(),
                startDate: v.startDate,
                status: v.status,
              }
            : r,
        ),
      )
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา username, ชื่อ POS, หน้าที่, เลขบัตร"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
          />
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
        >
          <Plus className="size-4" aria-hidden />
          เพิ่มพนักงาน
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
            <tr>
              <th className="w-14 px-2 py-2.5">รูป</th>
              <th className="px-3 py-2.5">Username</th>
              <th className="min-w-[10rem] px-3 py-2.5">ชื่อแสดงที่ POS</th>
              <th className="whitespace-nowrap px-3 py-2.5">เลขบัตร ปชช.</th>
              <th className="px-3 py-2.5">หน้าที่</th>
              <th className="px-3 py-2.5">เริ่มงาน</th>
              <th className="px-3 py-2.5">สถานะ</th>
              <th className="px-3 py-2.5 text-right">การทำงาน</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                <td className="px-2 py-2 align-middle">
                  {r.photoDataUrl ? (
                    <img
                      src={r.photoDataUrl}
                      alt=""
                      className="mx-auto size-9 rounded-full object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div
                      className="mx-auto flex size-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold uppercase text-slate-700"
                      aria-hidden
                    >
                      {(r.displayNamePos.trim().charAt(0) || '?').toUpperCase()}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{r.username}</td>
                <td className="px-3 py-2.5 font-medium text-slate-900">{r.displayNamePos}</td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-700">
                  {formatNationalIdDisplay(r.nationalId)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">{r.role || '—'}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{r.startDate}</td>
                <td className="px-3 py-2.5">{statusBadge(r.status)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                  >
                    แก้ไข
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        รหัสผ่านไม่แสดงในตาราง — เลขบัตรและรูปเก็บใน mock (data URL) ระบบจริงควรเข้ารหัสและอัปโหลดไฟล์ไปเซิร์ฟเวอร์
      </p>

      <StaffUserFormModal
        open={modalOpen}
        mode={mode}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
