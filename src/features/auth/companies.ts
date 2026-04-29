export type CompanyId = 'ang' | 'somnuek'

export type CompanyInfo = {
  id: CompanyId
  name: string
  shortName: string
  taxId: string
  address: string
}

export const COMPANIES: CompanyInfo[] = [
  {
    id: 'ang',
    name: 'อังอะไหล่',
    shortName: 'อัง',
    taxId: '',
    address: '',
  },
  {
    id: 'somnuek',
    name: 'สมนึกอะไหล่',
    shortName: 'สมนึก',
    taxId: '',
    address: '',
  },
]

export function getCompanyById(id: CompanyId): CompanyInfo | undefined {
  return COMPANIES.find((c) => c.id === id)
}
