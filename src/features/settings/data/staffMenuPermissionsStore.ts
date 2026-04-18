import type { MainMenuPermission } from '@/features/settings/data/permissionMenuGrid'

const LS_KEY = 'bento.staff.menuPermissions.v1'

/** staffId → menuId → allow | deny */
export type StaffMenuPermissionsMap = Record<string, Record<string, MainMenuPermission>>

export function loadStaffMenuPermissions(): StaffMenuPermissionsMap {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as StaffMenuPermissionsMap
  } catch {
    return {}
  }
}

export function saveStaffMenuPermissions(next: StaffMenuPermissionsMap): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}
