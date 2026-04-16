import { MOCK_STAFF_USERS } from '@/features/settings/data/mockStaffUsers'

/** ชื่อพนักงานที่ POS — ใช้ชื่อแสดงจากข้อมูลตั้งค่า (mock) */
export const PLACEHOLDER_SALES_STAFF: { id: string; name: string }[] = MOCK_STAFF_USERS.map(
  (u) => ({
    id: u.id,
    name: u.displayNamePos,
  }),
)

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'เงินสด' },
  { id: 'qr', label: 'QR Code' },
  { id: 'credit', label: 'เครดิต' },
  { id: 'bill', label: 'ลงบิล' },
] as const

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id']
