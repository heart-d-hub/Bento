import { COMPANIES, type CompanyId } from '@/features/auth/companies'

export type CompanyConfig = {
  name: string
  shortName: string
  taxId: string
  address: string
  phone: string
  email: string
}

const lsKey = (companyId: string) => `bento.company.v1.${companyId}`

function defaultConfig(companyId: CompanyId): CompanyConfig {
  const base = COMPANIES.find((c) => c.id === companyId)!
  return { name: base.name, shortName: base.shortName, taxId: base.taxId, address: base.address, phone: '', email: '' }
}

export function loadCompanyConfig(companyId: CompanyId): CompanyConfig {
  try {
    const raw = localStorage.getItem(lsKey(companyId))
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CompanyConfig>
      return { ...defaultConfig(companyId), ...parsed }
    }
  } catch { /* ignore */ }
  return defaultConfig(companyId)
}

export function saveCompanyConfig(companyId: CompanyId, config: CompanyConfig): void {
  try {
    localStorage.setItem(lsKey(companyId), JSON.stringify(config))
  } catch { /* ignore */ }
}
