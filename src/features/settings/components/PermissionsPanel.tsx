import {
  buildDefaultMainPerm,
  PERMISSION_MENU_GRID,
  type MainMenuPermission,
} from '@/features/settings/data/permissionMenuGrid'
import type { StaffUser } from '@/features/settings/data/mockStaffUsers'
import {
  loadStaffMenuPermissions,
  saveStaffMenuPermissions,
  type StaffMenuPermissionsMap,
} from '@/features/settings/data/staffMenuPermissionsStore'
import { loadStaffUsers, STAFF_USERS_CHANGED_EVENT } from '@/features/settings/data/staffUsersStore'
import { clsx } from 'clsx'
import { useEffect, useMemo, useState } from 'react'

export function PermissionsPanel() {
  const [staffList, setStaffList] = useState<StaffUser[]>(() => loadStaffUsers())
  const [selectedId, setSelectedId] = useState(() => loadStaffUsers()[0]?.id ?? '')
  const [permByStaffId, setPermByStaffId] = useState<StaffMenuPermissionsMap>(() =>
    loadStaffMenuPermissions(),
  )

  useEffect(() => {
    const on = () => {
      const next = loadStaffUsers()
      setStaffList(next)
      setSelectedId((id) => (next.some((s) => s.id === id) ? id : next[0]?.id ?? ''))
    }
    window.addEventListener(STAFF_USERS_CHANGED_EVENT, on)
    return () => window.removeEventListener(STAFF_USERS_CHANGED_EVENT, on)
  }, [])

  const selected = useMemo(
    () => staffList.find((s) => s.id === selectedId) ?? null,
    [staffList, selectedId],
  )

  const mainPerm = useMemo(() => {
    if (!selectedId) return buildDefaultMainPerm()
    return permByStaffId[selectedId] ?? buildDefaultMainPerm()
  }, [permByStaffId, selectedId])

  const isAdminUser = Boolean(selected?.isAdmin)

  const setMenuPerm = (menuId: string, value: MainMenuPermission) => {
    if (!selectedId || isAdminUser) return
    setPermByStaffId((prev) => {
      const base = prev[selectedId] ?? buildDefaultMainPerm()
      const nextUserPerms = { ...base, [menuId]: value }
      const nextMap: StaffMenuPermissionsMap = { ...prev, [selectedId]: nextUserPerms }
      saveStaffMenuPermissions(nextMap)
      return nextMap
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
        <label htmlFor="perm-user" className="mb-1 block text-xs font-medium text-slate-600">
          เลือกพนักงานเพื่อตั้งสิทธิ์เมนูหลัก
        </label>
        <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
          รายชื่อเดียวกับ <span className="font-medium text-slate-700">การตั้งค่า → จัดการผู้ใช้</span> — เพิ่ม/แก้ไขพนักงานที่นั่น รายการที่นี่จะอัปเดตตาม
        </p>
        {staffList.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            ยังไม่มีพนักงาน — ไปที่แท็บ <span className="font-semibold">จัดการผู้ใช้</span> เพื่อเพิ่มรายชื่อก่อน
          </p>
        ) : (
          <>
            <select
              id="perm-user"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.username} — {s.displayNamePos}
                  {s.status === 'inactive' ? ' (ระงับ)' : ''}
                </option>
              ))}
            </select>
            {selected && (
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <p>
                  หน้าที่: <span className="font-medium text-slate-800">{selected.role || '—'}</span>
                  {selected.isAdmin ? (
                    <span className="ml-2 inline-flex rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-violet-800">
                      Admin
                    </span>
                  ) : null}
                </p>
                {isAdminUser ? (
                  <p className="rounded-lg border border-violet-100 bg-violet-50/80 px-2 py-1.5 text-[11px] leading-snug text-violet-900">
                    บัญชี Admin ใช้สิทธิ์เต็มทุกเมนู — ตารางด้านล่างแสดงค่าจำลองเท่านั้น (แก้ได้ที่ปิดสถานะ Admin ในจัดการผู้ใช้)
                  </p>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex min-h-[14rem] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
          เมนูหลัก
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[28rem] border-collapse text-sm">
            <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-white text-xs font-medium text-slate-500">
              <tr>
                <th className="px-3 py-2.5 text-left">เมนู</th>
                <th className="w-[11rem] px-3 py-2.5 text-left">สิทธิ์</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MENU_GRID.map((m) => (
                <tr
                  key={m.id}
                  className={clsx(
                    'border-b border-slate-100 hover:bg-slate-50/80',
                    isAdminUser && 'bg-slate-50/50',
                  )}
                >
                  <td className="px-3 py-2.5 font-medium text-slate-900">{m.label}</td>
                  <td className="px-3 py-2.5">
                    <label htmlFor={`perm-${m.id}`} className="sr-only">
                      สิทธิ์ {m.label}
                    </label>
                    <select
                      id={`perm-${m.id}`}
                      value={isAdminUser ? 'allow' : (mainPerm[m.id] ?? 'allow')}
                      onChange={(e) => setMenuPerm(m.id, e.target.value as MainMenuPermission)}
                      disabled={!selectedId || staffList.length === 0 || isAdminUser}
                      className={clsx(
                        'w-full min-w-[7rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300',
                        isAdminUser && 'cursor-not-allowed opacity-80',
                      )}
                    >
                      <option value="allow">อนุญาต</option>
                      <option value="deny">ไม่อนุญาต</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        สิทธิ์ต่อพนักงานแต่ละคนถูกบันทึกในเบราว์เซอร์ (mock) — ผูกกับรหัสพนักงานจากจัดการผู้ใช้
      </p>
    </div>
  )
}
