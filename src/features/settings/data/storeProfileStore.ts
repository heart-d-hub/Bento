import { MOCK_STORE_PROFILE, type StoreProfile } from '@/features/settings/data/mockStoreProfile'
import { getStoredBranch, getStoredCompany } from '@/features/auth/authSession'
import { loadBranchesByCompany } from '@/features/auth/branchesStore'
import { loadCompanyConfig } from '@/features/auth/companiesStore'

const KEY = 'bento.settings.storeProfile.v1'
export const STORE_PROFILE_CHANGED_EVENT = 'bento-store-profile-changed'

function normalize(p: Partial<StoreProfile> | null | undefined): StoreProfile {
  return {
    storeName: typeof p?.storeName === 'string' ? p.storeName : MOCK_STORE_PROFILE.storeName,
    taxId: typeof p?.taxId === 'string' ? p.taxId : MOCK_STORE_PROFILE.taxId,
    address: typeof p?.address === 'string' ? p.address : MOCK_STORE_PROFILE.address,
    phone: typeof p?.phone === 'string' ? p.phone : MOCK_STORE_PROFILE.phone,
    email: typeof p?.email === 'string' ? p.email : MOCK_STORE_PROFILE.email,
    vatRegistered: typeof p?.vatRegistered === 'boolean' ? p.vatRegistered : false,
  }
}

/** ธุรกิจจดทะเบียน VAT หรือยัง — ใช้ในการคำนวณต้นทุนสต็อก */
export function getVatRegistered(): boolean {
  return loadStoreProfile().vatRegistered
}

export function loadStoreProfile(): StoreProfile {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...MOCK_STORE_PROFILE }
    const parsed = JSON.parse(raw) as Partial<StoreProfile>
    return normalize(parsed)
  } catch {
    return { ...MOCK_STORE_PROFILE }
  }
}

export function saveStoreProfile(profile: StoreProfile): void {
  localStorage.setItem(KEY, JSON.stringify(normalize(profile)))
  window.dispatchEvent(new CustomEvent(STORE_PROFILE_CHANGED_EVENT))
}

/**
 * สำหรับการพิมพ์ — รวมข้อมูลสาขาปัจจุบัน + กิจการ + StoreProfile
 * สาขา: ชื่อ, ที่อยู่, โทร (ข้อมูลจุดขายที่แท้จริง)
 * กิจการ: เลขภาษี (ต้องตรงกับนิติบุคคลเสมอ)
 */
export function getStoreContextForPrint(): StoreProfile {
  const base = loadStoreProfile()
  const company = getStoredCompany()
  const branch = getStoredBranch()

  let storeName = base.storeName
  let address = base.address
  let phone = base.phone
  let taxId = base.taxId

  if (company) {
    const cfg = loadCompanyConfig(company.id)
    if (cfg.taxId) taxId = cfg.taxId
    if (cfg.name) storeName = cfg.name
    if (cfg.address) address = cfg.address
    if (cfg.phone) phone = cfg.phone
  }

  if (branch) {
    const branches = loadBranchesByCompany(branch.companyId)
    const branchData = branches.find((b) => b.id === branch.id)
    if (branchData) {
      // Branch name is always used — it identifies which location issued the bill
      storeName = branchData.name
      if (branchData.address) address = branchData.address
      if (branchData.phone) phone = branchData.phone
    }
  }

  return { ...base, storeName, address, phone, taxId }
}
