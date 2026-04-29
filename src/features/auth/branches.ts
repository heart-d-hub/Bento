import type { CompanyId } from '@/features/auth/companies'
import { loadBranchesByCompany, type DynamicBranch } from '@/features/auth/branchesStore'

export type BranchId = string

export type BranchInfo = {
  id: BranchId
  companyId: CompanyId
  name: string
  address?: string
  phone?: string
  isActive?: boolean
  sortOrder?: number
  createdAt?: string
}

/** Default seed branches — used for legacy reference and inventory model defaults */
export const BRANCHES: Array<{ id: string; companyId: CompanyId; name: string }> = [
  { id: 'somneuk', companyId: 'somnuek', name: 'สมนึกอะไหล่' },
  { id: 'ang',     companyId: 'ang',     name: 'อังอะไหล่' },
]

export function getBranchById(id: string): BranchInfo | undefined {
  return BRANCHES.find((b) => b.id === id) as BranchInfo | undefined
}

export function getBranchesByCompany(companyId: CompanyId): BranchInfo[] {
  return loadBranchesByCompany(companyId) as BranchInfo[]
}

export function dynamicToBranchInfo(b: DynamicBranch): BranchInfo {
  return { id: b.id, companyId: b.companyId, name: b.name, address: b.address, phone: b.phone, isActive: b.isActive, sortOrder: b.sortOrder, createdAt: b.createdAt }
}
