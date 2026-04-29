import type { CustomerType, MemberItemTierOverride, MemberPriceTier } from '@/features/members/data/memberTypes'
import type { B2bTier } from '@/features/settings/data/customerTiersStore'

export type MemberStatus = 'active' | 'inactive' | 'blacklist'

export type MemberType = 'general' | 'mechanic' | 'garage' | 'vip'

export type Member = {
  id: string
  memberCode: string
  /** 1. ชื่อ (บังคับ) */
  fullName: string
  /** 2. ที่อยู่ (บรรทัดเดียวหรือสองบรรทัดในกล่องเดียว) */
  address: string
  /** 3. เลขประจำตัวผู้เสียภาษี */
  taxId: string
  /** 4. ผู้ติดต่อ (ผู้มาซื้อ / ผู้ประสานงาน) */
  contactPerson: string
  email: string
  phone: string
  fax: string
  /** 8. Sales — พนักงานในร้าน */
  salesStaffId: string
  /** 9. วงเงิน (บาท) */
  creditLimitBaht: number
  /** 10. เครดิต — วัน */
  creditTermDays: number
  /** 10. เครดิต — เดือน */
  creditTermMonths: number
  /** 11. ชำระสิ้นเดือน */
  payAtMonthEnd: boolean
  /** 11. ตัดวันที่ (1–31) หรือ null */
  cutOffDayOfMonth: number | null
  /** 12. ราคาขายเริ่มต้น (5 ระดับ) */
  defaultPriceTier: MemberPriceTier
  /** 12. บวกเพิ่ม % จากราคาชุดนั้น */
  markupPercent: number
  priceStartDate: string
  priceEndDate: string
  /** 13. สินค้าเฉพาะรายการ — เลือกระดับราคา 1–5 */
  itemTierOverrides: MemberItemTierOverride[]
  notes: string

  memberType: MemberType
  status: MemberStatus
  branchId: string
  /** B2C = ลูกค้าทั่วไป (สะสมแต้ม), B2B = ร้านค้า/อู่ (มี tier ส่วนลด, ไม่มีแต้ม) */
  customerType: CustomerType
  /** เฉพาะ B2B — ระดับ tier */
  b2bTier: B2bTier | null
  /** แต้มสะสม — B2C เท่านั้น, B2B = 0 เสมอ */
  pointsBalance: number
  /** ค้างชำระ — สะท้อนจากลูกหนี้/บิล ไม่แก้ในฟอร์มสมาชิก */
  arBalance: number
  createdAt: string
}

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  general: 'ทั่วไป',
  mechanic: 'ช่าง',
  garage: 'อู่ / ศูนย์',
  vip: 'VIP',
}

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: 'ใช้งาน',
  inactive: 'ระงับ',
  blacklist: 'แบล็กลิสต์',
}

const today = new Date().toISOString().slice(0, 10)

export const MOCK_MEMBERS: Member[] = [
  // ── B2C ลูกค้าทั่วไป (มีแต้ม, ไม่มี tier) ──────────────────────────────

  {
    id: 'm-b2c-001',
    memberCode: 'M-001',
    fullName: 'สมชาย ใจดี',
    address: '12/4 ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900',
    taxId: '',
    contactPerson: '',
    phone: '0812345678',
    email: 'somchai@email.test',
    fax: '',
    salesStaffId: '',
    creditLimitBaht: 0,
    creditTermDays: 0,
    creditTermMonths: 0,
    payAtMonthEnd: false,
    cutOffDayOfMonth: null,
    defaultPriceTier: 'tier1',
    markupPercent: 0,
    priceStartDate: today,
    priceEndDate: today,
    itemTierOverrides: [],
    memberType: 'general',
    status: 'active',
    branchId: 'ang',
    customerType: 'b2c',
    b2bTier: null,
    pointsBalance: 1280,
    arBalance: 0,
    notes: '',
    createdAt: '2024-03-15',
  },
  {
    id: 'm-b2c-002',
    memberCode: 'M-002',
    fullName: 'มาลี สวยงาม',
    address: '',
    taxId: '',
    contactPerson: '',
    phone: '0956667788',
    email: '',
    fax: '',
    salesStaffId: '',
    creditLimitBaht: 0,
    creditTermDays: 0,
    creditTermMonths: 0,
    payAtMonthEnd: false,
    cutOffDayOfMonth: null,
    defaultPriceTier: 'tier1',
    markupPercent: 0,
    priceStartDate: today,
    priceEndDate: today,
    itemTierOverrides: [],
    memberType: 'general',
    status: 'active',
    branchId: 'ang',
    customerType: 'b2c',
    b2bTier: null,
    pointsBalance: 340,
    arBalance: 0,
    notes: '',
    createdAt: '2025-11-02',
  },

  // ── B2B ร้านค้า / อู่ (มี tier, ไม่มีแต้ม, มีวงเงินเครดิต) ──────────────

  {
    id: 'm-b2b-platinum',
    memberCode: 'M-101',
    fullName: 'อู่ ทองดีการช่าง',
    address: '88/9 ซอยรามคำแหง 24 กรุงเทพฯ 10240',
    taxId: '0105565012345',
    contactPerson: 'คุณทองดี มั่นคง',
    phone: '0891112222',
    email: 'thongdee@garage.test',
    fax: '021234568',
    salesStaffId: '',
    creditLimitBaht: 300000,
    creditTermDays: 0,
    creditTermMonths: 1,
    payAtMonthEnd: true,
    cutOffDayOfMonth: 25,
    defaultPriceTier: 'tier3',
    markupPercent: 0,
    priceStartDate: '2023-01-01',
    priceEndDate: '2026-12-31',
    itemTierOverrides: [],
    memberType: 'garage',
    status: 'active',
    branchId: 'ang',
    customerType: 'garage',
    b2bTier: 'platinum',
    pointsBalance: 0,
    arBalance: 87500,
    notes: 'วางบิลสิ้นเดือน ตัดบัญชีวันที่ 25',
    createdAt: '2022-06-01',
  },
  {
    id: 'm-b2b-gold',
    memberCode: 'M-102',
    fullName: 'บริษัท ขับดี จำกัด',
    address: '999 อาคารเอกมัย ชั้น 5 ถนนสุขุมวิท 63 กรุงเทพฯ 10110',
    taxId: '0105566098765',
    contactPerson: 'ฝ่ายจัดซื้อ',
    phone: '021234567',
    email: 'purchase@khapdai.test',
    fax: '021234568',
    salesStaffId: '',
    creditLimitBaht: 150000,
    creditTermDays: 45,
    creditTermMonths: 0,
    payAtMonthEnd: false,
    cutOffDayOfMonth: null,
    defaultPriceTier: 'tier3',
    markupPercent: 0,
    priceStartDate: '2023-06-01',
    priceEndDate: '2026-12-31',
    itemTierOverrides: [],
    memberType: 'garage',
    status: 'active',
    branchId: 'ang',
    customerType: 'store',
    b2bTier: 'gold',
    pointsBalance: 0,
    arBalance: 162000,
    notes: 'เครดิต 45 วัน — ปัจจุบันเกินวงเงิน',
    createdAt: '2023-03-10',
  },
  {
    id: 'm-b2b-silver',
    memberCode: 'M-103',
    fullName: 'ร้านวิชัย อะไหล่',
    address: '45 ถนนลาดพร้าว 71 กรุงเทพฯ 10230',
    taxId: '',
    contactPerson: 'คุณวิชัย',
    phone: '0863334455',
    email: '',
    fax: '',
    salesStaffId: '',
    creditLimitBaht: 50000,
    creditTermDays: 30,
    creditTermMonths: 0,
    payAtMonthEnd: false,
    cutOffDayOfMonth: null,
    defaultPriceTier: 'tier2',
    markupPercent: 0,
    priceStartDate: '2024-01-01',
    priceEndDate: '2026-12-31',
    itemTierOverrides: [],
    memberType: 'mechanic',
    status: 'active',
    branchId: 'ang',
    customerType: 'store',
    b2bTier: 'silver',
    pointsBalance: 0,
    arBalance: 18500,
    notes: '',
    createdAt: '2024-01-20',
  },
  {
    id: 'm-b2b-bronze',
    memberCode: 'M-104',
    fullName: 'ร้านต้นไม้ อะไหล่',
    address: '',
    taxId: '',
    contactPerson: 'คุณต้นไม้',
    phone: '0811112233',
    email: '',
    fax: '',
    salesStaffId: '',
    creditLimitBaht: 0,
    creditTermDays: 0,
    creditTermMonths: 0,
    payAtMonthEnd: false,
    cutOffDayOfMonth: null,
    defaultPriceTier: 'tier1',
    markupPercent: 0,
    priceStartDate: today,
    priceEndDate: today,
    itemTierOverrides: [],
    memberType: 'mechanic',
    status: 'active',
    branchId: 'ang',
    customerType: 'store',
    b2bTier: 'bronze',
    pointsBalance: 0,
    arBalance: 0,
    notes: 'สมาชิก B2B ใหม่ — ยังไม่มีวงเงิน',
    createdAt: '2026-04-01',
  },

  // ── ระงับ / blacklist (สำหรับทดสอบระบบลบ) ─────────────────────────────

  {
    id: 'm-b2c-inactive',
    memberCode: 'M-003',
    fullName: 'อนันต์ หยุดใช้',
    address: '',
    taxId: '',
    contactPerson: '',
    phone: '0700000001',
    email: '',
    fax: '',
    salesStaffId: '',
    creditLimitBaht: 0,
    creditTermDays: 0,
    creditTermMonths: 0,
    payAtMonthEnd: false,
    cutOffDayOfMonth: null,
    defaultPriceTier: 'tier1',
    markupPercent: 0,
    priceStartDate: today,
    priceEndDate: today,
    itemTierOverrides: [],
    memberType: 'general',
    status: 'inactive',
    branchId: 'ang',
    customerType: 'b2c',
    b2bTier: null,
    pointsBalance: 0,
    arBalance: 0,
    notes: 'ระงับชั่วคราว',
    createdAt: '2023-05-01',
  },
]
