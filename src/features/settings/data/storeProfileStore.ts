import { MOCK_STORE_PROFILE, type StoreProfile } from '@/features/settings/data/mockStoreProfile'

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
