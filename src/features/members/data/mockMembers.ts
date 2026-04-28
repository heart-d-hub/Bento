import type { MemberItemTierOverride, MemberPriceTier } from '@/features/members/data/memberTypes'

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
  /** แต้มสะสม — คำนวณจากธุรกรรม ไม่แก้ในฟอร์มสมาชิก */
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
  {
    id: 'm1',
    memberCode: 'M-10482',
    fullName: 'คุณสมชาย ใจดี',
    address: '123 ถนนตัวอย่าง',
    taxId: '',
    contactPerson: 'คุณสมชาย',
    phone: '0812345678',
    email: 'somchai@email.test',
    fax: '',
    salesStaffId: 's1',
    creditLimitBaht: 50000,
    creditTermDays: 0,
    creditTermMonths: 0,
    payAtMonthEnd: false,
    cutOffDayOfMonth: null,
    defaultPriceTier: 'tier2',
    markupPercent: 0,
    priceStartDate: today,
    priceEndDate: today,
    itemTierOverrides: [],
    memberType: 'vip',
    status: 'active',
    branchId: 'somneuk',
    pointsBalance: 1280,
    arBalance: 0,
    notes: 'ชอบยางมิชลิน',
    createdAt: '2024-06-12',
  },
  {
    id: 'm2',
    memberCode: 'M-10483',
    fullName: 'อู่ ทองดีการช่าง',
    address: '88/9 หมู่บ้านตัวอย่าง',
    taxId: '0123456789012',
    contactPerson: 'คุณทองดี',
    phone: '0891112222',
    email: 'thongdee@garage.test',
    fax: '020000000',
    salesStaffId: 's3',
    creditLimitBaht: 200000,
    creditTermDays: 30,
    creditTermMonths: 0,
    payAtMonthEnd: true,
    cutOffDayOfMonth: 25,
    defaultPriceTier: 'tier3',
    markupPercent: 3,
    priceStartDate: '2024-01-01',
    priceEndDate: '2026-12-31',
    itemTierOverrides: [
      { id: 'io-1', sku: 'TIRE-001', productName: 'ยางตัวอย่าง', tier: 'tier1' },
    ],
    memberType: 'garage',
    status: 'active',
    branchId: 'ang',
    pointsBalance: 5420,
    arBalance: 12500,
    notes: 'วางบิล 30 วัน',
    createdAt: '2023-11-01',
  },
  {
    id: 'm3',
    memberCode: 'M-10484',
    fullName: 'นายวิชัย รถดี',
    address: '',
    taxId: '',
    contactPerson: '',
    phone: '0628889900',
    email: '',
    fax: '',
    salesStaffId: 's2',
    creditLimitBaht: 0,
    creditTermDays: 15,
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
    branchId: 'somneuk',
    pointsBalance: 210,
    arBalance: 0,
    notes: '',
    createdAt: '2025-01-20',
  },
  {
    id: 'm4',
    memberCode: 'M-10485',
    fullName: 'คุณหญิง มาลี',
    address: '',
    taxId: '',
    contactPerson: '',
    phone: '0954443210',
    email: 'malee@email.test',
    fax: '',
    salesStaffId: 's1',
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
    branchId: 'somneuk',
    pointsBalance: 0,
    arBalance: 0,
    notes: 'ไม่รับโทรศัพท์เวลากลางคืน',
    createdAt: '2022-08-05',
  },
  {
    id: 'm5',
    memberCode: 'M-10486',
    fullName: 'บริษัท ขับดี จำกัด',
    address: '999 อาคารตัวอย่าง\nชั้น 5',
    taxId: '0999999999999',
    contactPerson: 'ฝ่ายบัญชี',
    phone: '021234567',
    email: 'acc@khapdai.test',
    fax: '021234568',
    salesStaffId: 's3',
    creditLimitBaht: 150000,
    creditTermDays: 45,
    creditTermMonths: 0,
    payAtMonthEnd: false,
    cutOffDayOfMonth: 15,
    defaultPriceTier: 'tier4',
    markupPercent: 0,
    priceStartDate: '2023-06-01',
    priceEndDate: today,
    itemTierOverrides: [],
    memberType: 'garage',
    status: 'blacklist',
    branchId: 'ang',
    pointsBalance: 0,
    arBalance: 89000,
    notes: 'ค้างชำระ — ติดต่อบัญชี',
    createdAt: '2021-03-15',
  },
]
