import { StaffUserFormModal, type StaffUserFormValues } from '@/features/settings/components/StaffUserFormModal'
import {
  formatNationalIdDisplay,
  normalizeNationalIdDigits,
  STAFF_STATUS_LABELS,
  type StaffStatus,
  type StaffUser,
} from '@/features/settings/data/mockStaffUsers'
import {
  flushStaffUsersDbSave,
  hydrateStaffUsersFromDb,
  loadStaffUsers,
  saveStaffUsers,
} from '@/features/settings/data/staffUsersStore'
import { clsx } from 'clsx'
import { Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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
  const [rows, setRows] = useState<StaffUser[]>(() => loadStaffUsers())
  const [q, setQ] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<StaffUser | null>(null)

  useEffect(() => {
    void hydrateStaffUsersFromDb().then((users) => {
      setRows(users)
    })
  }, [])

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
      const normalizedUsername = v.username.trim()
      if (!normalizedUsername) return
      const hasDuplicate = rows.some((r) => r.username.trim().toLowerCase() === normalizedUsername.toLowerCase())
      if (hasDuplicate) {
        window.alert(`มี username "${normalizedUsername}" อยู่แล้ว กรุณาใช้ชื่ออื่น`)
        return
      }
      const id = `staff-${Date.now()}`
      const newRow: StaffUser = {
        id,
        username: normalizedUsername,
        displayNamePos: v.displayNamePos.trim(),
        nationalId: normalizeNationalIdDigits(v.nationalId),
        photoDataUrl: v.photoDataUrl,
        password: v.password.trim(),
        role: v.role.trim(),
        isAdmin: v.isAdmin,
        startDate: v.startDate,
        status: v.status,
      }
      setRows((prev) => {
        const next = [newRow, ...prev]
        queueMicrotask(() => {
          saveStaffUsers(next)
          void flushStaffUsersDbSave()
        })
        return next
      })
    } else if (editing) {
      setRows((prev) => {
        const next = prev.map((r) =>
          r.id === editing.id
            ? {
                ...r,
                displayNamePos: v.displayNamePos.trim(),
                nationalId: normalizeNationalIdDigits(v.nationalId),
                photoDataUrl: v.photoDataUrl,
                password: v.password.trim() ? v.password : r.password,
                role: v.role.trim(),
                isAdmin: v.isAdmin,
                startDate: v.startDate,
                status: v.status,
              }
            : r,
        )
        queueMicrotask(() => {
          saveStaffUsers(next)
          void flushStaffUsersDbSave()
        })
        return next
      })
    }
  }

  const handleDelete = (u: StaffUser) => {
    if (rows.length <= 1) {
      window.alert('ต้องมีพนักงานอย่างน้อย 1 คนในระบบ')
      return
    }
    if (
      !window.confirm(`ลบพนักงาน "${u.displayNamePos}" (${u.username}) ใช่หรือไม่?\nการลบไม่สามารถย้อนกลับได้`)
    ) {
      return
    }
    setRows((prev) => {
      const next = prev.filter((x) => x.id !== u.id)
      queueMicrotask(() => {
        saveStaffUsers(next)
        void flushStaffUsersDbSave()
      })
      return next
    })
    if (editing?.id === u.id) {
      setModalOpen(false)
      setEditing(null)
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
                <td className="px-3 py-2.5 text-slate-700">
                  <span className="whitespace-nowrap">{r.role || '—'}</span>
                  {r.isAdmin ? (
                    <span className="ml-1.5 inline-flex rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                      Admin
                    </span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{r.startDate}</td>
                <td className="px-3 py-2.5">{statusBadge(r.status)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                  <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                      aria-label={`ลบ ${r.username}`}
                    >
                      <Trash2 className="size-3.5 shrink-0" aria-hidden />
                      ลบ
                    </button>
                  </div>
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
