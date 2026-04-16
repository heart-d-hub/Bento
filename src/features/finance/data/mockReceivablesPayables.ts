/** ลูกหนี้ — สถานะตามอายุหนี้ (mock) */
export type ArAgingStatus = 'current' | 'due_soon' | 'overdue'

export type ReceivableAccount = {
  id: string
  customerCode: string
  customerName: string
  phone: string
  creditLimit: number
  outstanding: number
  dueDate: string
  lastPaymentDate: string
  agingStatus: ArAgingStatus
  branch: string
  notes: string
  /** รหัสคู่ค้าสำหรับกติกาเครดิตรายราย (ลูกหนี้) */
  customerPartyId?: string
}

/** เจ้าหนี้ */
export type ApPaymentStatus = 'pending' | 'partial' | 'overdue'

export type PayableAccount = {
  id: string
  supplierCode: string
  supplierName: string
  phone: string
  outstanding: number
  dueDate: string
  lastPaymentDate: string
  paymentStatus: ApPaymentStatus
  branch: string
  notes: string
  /** รหัสซัพพลายเออร์สำหรับกติกาเครดิตรายราย (เจ้าหนี้) — ตรงกับ PO / แฟ้มซัพพลาย */
  supplierPartyId?: string
}

export const AR_AGING_LABELS: Record<ArAgingStatus, string> = {
  current: 'ปกติ',
  due_soon: 'ใกล้ครบกำหนด',
  overdue: 'เกินกำหนด',
}

export const AP_STATUS_LABELS: Record<ApPaymentStatus, string> = {
  pending: 'รอจ่าย',
  partial: 'จ่ายบางส่วน',
  overdue: 'เกินกำหนด',
}

export const MOCK_RECEIVABLES: ReceivableAccount[] = [
  {
    id: 'ar1',
    customerPartyId: 'cust-garage-1',
    customerCode: 'M-10483',
    customerName: 'อู่ ทองดีการช่าง',
    phone: '089-111-2222',
    creditLimit: 50000,
    outstanding: 12500,
    dueDate: '2026-04-15',
    lastPaymentDate: '2026-03-01',
    agingStatus: 'current',
    branch: 'สาขา 2',
    notes: 'วางบิล 30 วัน',
  },
  {
    id: 'ar2',
    customerPartyId: 'cust-retail-2',
    customerCode: 'C-9021',
    customerName: 'คุณวิชัย รถดี',
    phone: '062-888-9900',
    creditLimit: 20000,
    outstanding: 8900,
    dueDate: '2026-03-28',
    lastPaymentDate: '2026-02-10',
    agingStatus: 'due_soon',
    branch: 'สาขา 1',
    notes: '',
  },
  {
    id: 'ar3',
    customerPartyId: 'cust-company-3',
    customerCode: 'C-7712',
    customerName: 'บริษัท ขับดี จำกัด',
    phone: '02-123-4567',
    creditLimit: 150000,
    outstanding: 89000,
    dueDate: '2026-02-01',
    lastPaymentDate: '2025-12-15',
    agingStatus: 'overdue',
    branch: 'สาขา 2',
    notes: 'ติดตามบัญชี',
  },
  {
    id: 'ar4',
    customerPartyId: 'cust-walkin-np',
    customerCode: 'W-1001',
    customerName: 'Walk-in — นัดชำระ',
    phone: '080-000-1111',
    creditLimit: 5000,
    outstanding: 1200,
    dueDate: '2026-03-30',
    lastPaymentDate: '2026-03-20',
    agingStatus: 'current',
    branch: 'สาขา 1',
    notes: 'นัดโอนสิ้นเดือน',
  },
]

export const MOCK_PAYABLES: PayableAccount[] = [
  {
    id: 'ap1',
    supplierPartyId: 'sup-toyota-tsb',
    supplierCode: 'S-MIC-01',
    supplierName: 'บริษัท ยางมิชลิน ประเทศไทย',
    phone: '02-365-0000',
    outstanding: 245000,
    dueDate: '2026-04-10',
    lastPaymentDate: '2026-02-28',
    paymentStatus: 'pending',
    branch: 'สาขา 1',
    notes: 'ใบสั่งซื้อ PO-24091',
  },
  {
    id: 'ap2',
    supplierPartyId: 'sup-bkk-parts',
    supplierCode: 'S-BOS-02',
    supplierName: 'Bosch Automotive Thailand',
    phone: '02-798-2000',
    outstanding: 67800,
    dueDate: '2026-03-25',
    lastPaymentDate: '2026-03-01',
    paymentStatus: 'partial',
    branch: 'คลังกลาง',
    notes: 'จ่ายบางส่วนแล้ว',
  },
  {
    id: 'ap3',
    supplierPartyId: 'sup-isuzu-pc',
    supplierCode: 'S-LOC-88',
    supplierName: 'หจก. อะไหล่ท้องถิ่น',
    phone: '053-111-444',
    outstanding: 12500,
    dueDate: '2026-01-20',
    lastPaymentDate: '2025-11-01',
    paymentStatus: 'overdue',
    branch: 'สาขา 2',
    notes: 'ติดต่อฝ่ายจัดซื้อ',
  },
]
