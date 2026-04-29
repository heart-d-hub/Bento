import type { CompanyId } from '@/features/auth/companies'

export type DynamicBranch = {
  id: string
  companyId: CompanyId
  name: string
  address: string
  phone: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

const lsKey = (companyId: string) => `bento.branches.v1.${companyId}`

export const SEED_BRANCHES: DynamicBranch[] = [
  { id: 'somneuk', companyId: 'somnuek', name: 'สมนึกอะไหล่', address: '', phone: '', isActive: true, sortOrder: 0, createdAt: '2024-01-01' },
  { id: 'ang',     companyId: 'ang',     name: 'อังอะไหล่',   address: '', phone: '', isActive: true, sortOrder: 0, createdAt: '2024-01-01' },
]

export function loadBranchesByCompany(companyId: CompanyId): DynamicBranch[] {
  try {
    const raw = localStorage.getItem(lsKey(companyId))
    if (raw) {
      const parsed = JSON.parse(raw) as DynamicBranch[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  return SEED_BRANCHES.filter((b) => b.companyId === companyId)
}

export function saveBranchesForCompany(companyId: CompanyId, branches: DynamicBranch[]): void {
  try {
    localStorage.setItem(lsKey(companyId), JSON.stringify(branches))
  } catch { /* ignore */ }
}

export function upsertBranch(branch: DynamicBranch): void {
  const branches = loadBranchesByCompany(branch.companyId)
  const idx = branches.findIndex((b) => b.id === branch.id)
  if (idx >= 0) {
    branches[idx] = branch
  } else {
    branches.push({ ...branch, sortOrder: branches.length })
  }
  saveBranchesForCompany(branch.companyId, branches)
}

export function removeBranch(companyId: CompanyId, branchId: string): void {
  const branches = loadBranchesByCompany(companyId).filter((b) => b.id !== branchId)
  saveBranchesForCompany(companyId, branches)
}

export function newBranchId(): string {
  return `branch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
