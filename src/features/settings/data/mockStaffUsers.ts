/** พนักงาน / ผู้ใช้ระบบ — ฟิลด์ตามที่ใช้แทน KAcc9 */

export type StaffStatus = 'active' | 'inactive'

export type StaffUser = {
  id: string
  username: string
  /** ชื่อที่แสดงที่เมนูคิดเงิน (POS) */
  displayNamePos: string
  /** เลขบัตรประชาชน 13 หลัก — เก็บเฉพาะตัวเลข (mock; ระบบจริงควรเข้ารหัส/จัดเก็บตาม PDPA) */
  nationalId: string
  /** รูปพนักงาน — mock ใช้ data URL; ระบบจริงควรอัปโหลดไฟล์ไปเซิร์ฟเวอร์ */
  photoDataUrl: string | null
  /** mock เท่านั้น — ระบบจริงเก็บแฮช ไม่เก็บ plain text */
  password: string
  /** หน้าที่ / ตำแหน่ง */
  role: string
  /** ISO date */
  startDate: string
  status: StaffStatus
}

/** ดึงเฉพาะตัวเลข สูงสุด 13 หลัก */
export function normalizeNationalIdDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 13)
}

/** ตรวจว่าเป็นตัวเลขครบ 13 หลัก */
export function isValidNationalIdDigits(digits: string): boolean {
  return /^\d{13}$/.test(digits)
}

/** แสดงเลขบัตรแบบมีขีด เช่น 1-2345-67890-12-3 */
export function formatNationalIdDisplay(digits: string): string {
  const d = normalizeNationalIdDigits(digits)
  if (d.length !== 13) return digits || '—'
  return `${d[0]}-${d.slice(1, 5)}-${d.slice(5, 10)}-${d.slice(10, 12)}-${d[12]}`
}

export const STAFF_STATUS_LABELS: Record<StaffStatus, string> = {
  active: 'ใช้งาน',
  inactive: 'ระงับ',
}

export const MOCK_STAFF_USERS: StaffUser[] = [
  {
    id: 'staff-1',
    username: 'ANG',
    displayNamePos: 'Ang — แคชเชียร์',
    nationalId: '1234567890123',
    photoDataUrl: null,
    password: '••••••••',
    role: 'MANAGER',
    startDate: '2020-01-15',
    status: 'active',
  },
  {
    id: 'staff-2',
    username: 'EVE',
    displayNamePos: 'Eve',
    nationalId: '9876543210987',
    photoDataUrl: null,
    password: '••••••••',
    role: 'SALE',
    startDate: '2022-06-01',
    status: 'active',
  },
  {
    id: 'staff-3',
    username: 'STOCK',
    displayNamePos: 'คลัง A',
    nationalId: '5555555555555',
    photoDataUrl: null,
    password: '••••••••',
    role: 'STOCK',
    startDate: '2021-03-20',
    status: 'active',
  },
]
