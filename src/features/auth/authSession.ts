import type { BranchId, BranchInfo } from '@/features/auth/branches'

const AUTH_KEY = 'bento_auth_session'
const BRANCH_KEY = 'bento_selected_branch'
const STAFF_ROLE_KEY = 'bento_staff_role'
const STAFF_USERNAME_KEY = 'bento_staff_username'

export type StaffAppRole = 'staff' | 'admin'

function safeParseBranch(raw: string | null): BranchInfo | null {
  if (!raw) return null
  try {
    const o = JSON.parse(raw) as unknown
    if (
      o &&
      typeof o === 'object' &&
      'id' in o &&
      'name' in o &&
      typeof (o as BranchInfo).id === 'string' &&
      typeof (o as BranchInfo).name === 'string'
    ) {
      return { id: (o as BranchInfo).id as BranchId, name: (o as BranchInfo).name }
    }
  } catch {
    return null
  }
  return null
}

export function isLoggedIn(): boolean {
  try {
    return sessionStorage.getItem(AUTH_KEY) === '1'
  } catch {
    return false
  }
}

export function setLoggedIn(value: boolean): void {
  try {
    if (value) {
      sessionStorage.setItem(AUTH_KEY, '1')
    } else {
      sessionStorage.removeItem(AUTH_KEY)
    }
  } catch {
    /* ignore */
  }
}

export function getStoredBranch(): BranchInfo | null {
  try {
    return safeParseBranch(localStorage.getItem(BRANCH_KEY))
  } catch {
    return null
  }
}

export function setStoredBranch(branch: BranchInfo | null): void {
  try {
    if (branch) {
      localStorage.setItem(BRANCH_KEY, JSON.stringify(branch))
    } else {
      localStorage.removeItem(BRANCH_KEY)
    }
  } catch {
    /* ignore */
  }
}

export function clearSessionAndBranch(): void {
  setLoggedIn(false)
  setStoredBranch(null)
}

export function setStaffRole(role: StaffAppRole): void {
  try {
    localStorage.setItem(STAFF_ROLE_KEY, role)
  } catch {
    /* ignore */
  }
}

export function getStaffRole(): StaffAppRole {
  try {
    const v = localStorage.getItem(STAFF_ROLE_KEY)
    return v === 'admin' ? 'admin' : 'staff'
  } catch {
    return 'staff'
  }
}

export function canViewCost(): boolean {
  return getStaffRole() === 'admin'
}

export function setStaffUsername(username: string): void {
  try {
    const u = username.trim()
    if (!u) {
      localStorage.removeItem(STAFF_USERNAME_KEY)
    } else {
      localStorage.setItem(STAFF_USERNAME_KEY, u)
    }
  } catch {
    /* ignore */
  }
}

export function getStaffUsername(): string | null {
  try {
    return localStorage.getItem(STAFF_USERNAME_KEY)
  } catch {
    return null
  }
}
