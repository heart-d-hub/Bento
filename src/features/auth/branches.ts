/** เพิ่มสาขาใหม่ที่นี่ — BranchId จะอัปเดตตามลำดับอาร์เรย์ */
export const BRANCHES = [
  { id: 'somneuk', name: 'สมนึกอะไหล่' },
  { id: 'ang', name: 'อังอะไหล่' },
] as const

export type BranchId = (typeof BRANCHES)[number]['id']

export type BranchInfo = {
  id: BranchId
  name: string
}

export function getBranchById(id: BranchId): BranchInfo | undefined {
  return BRANCHES.find((b) => b.id === id)
}
