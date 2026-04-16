import {
  PERMISSION_MENU_GRID,
  type MainMenuPermission,
} from '@/features/settings/data/permissionMenuGrid'
import { MOCK_STAFF_USERS, type StaffUser } from '@/features/settings/data/mockStaffUsers'
import { useMemo, useState } from 'react'

function buildDefaultMainPerm(): Record<string, MainMenuPermission> {
  return Object.fromEntries(
    PERMISSION_MENU_GRID.map((m) => [m.id, 'allow' as MainMenuPermission]),
  )
}

export function PermissionsPanel() {
  const [staffList] = useState<StaffUser[]>(() => [...MOCK_STAFF_USERS])
  const [selectedId, setSelectedId] = useState(staffList[0]?.id ?? '')
  const [mainPerm, setMainPerm] = useState<Record<string, MainMenuPermission>>(buildDefaultMainPerm)

  const selected = useMemo(
    () => staffList.find((s) => s.id === selectedId) ?? null,
    [staffList, selectedId],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
        <label htmlFor="perm-user" className="mb-1 block text-xs font-medium text-slate-600">
          เลือกผู้ใช้เพื่อตั้งสิทธิ์เมนูหลัก
        </label>
        <select
          id="perm-user"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.username} — {s.displayNamePos}
            </option>
          ))}
        </select>
        {selected && (
          <p className="mt-2 text-xs text-slate-600">
            หน้าที่: <span className="font-medium text-slate-800">{selected.role || '—'}</span>
          </p>
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
                <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="px-3 py-2.5 font-medium text-slate-900">{m.label}</td>
                  <td className="px-3 py-2.5">
                    <label htmlFor={`perm-${m.id}`} className="sr-only">
                      สิทธิ์ {m.label}
                    </label>
                    <select
                      id={`perm-${m.id}`}
                      value={mainPerm[m.id] ?? 'allow'}
                      onChange={(e) =>
                        setMainPerm((prev) => ({
                          ...prev,
                          [m.id]: e.target.value as MainMenuPermission,
                        }))
                      }
                      className="w-full min-w-[7rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
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
        สิทธิ์ที่ปรับอยู่ในเบราว์เซอร์เท่านั้น (mock) — บันทึกลงเซิร์ฟเวอร์ในขั้นถัดไป
      </p>
    </div>
  )
}
