import type { PosSaleRecord } from '@/features/pos/data/posSalesHistory'

/**
 * ตัวอย่างประวัติการขาย — ใช้แสดงในหน้าเมื่อยังไม่มีข้อมูลจริงใน localStorage
 * โครงสร้างตรงกับที่ `appendSale()` บันทึก (ยกเว้น `id` ที่ระบบสร้างตอนขายจริง)
 */
export const MOCK_POS_SALES_HISTORY: PosSaleRecord[] = [
  {
    id: 'demo-1',
    billNo: '1PA69040101',
    at: '2026-04-02T09:15:00',
    total: 1250.5,
    paymentId: 'cash',
    lineCount: 2,
    lines: [
      { productId: 'demo-p1', sku: '1001001001', name: 'กรองโซล่า D-MAX (ตัวอย่าง)', qty: 1, unitPrice: 850 },
      { productId: 'demo-p2', sku: '2002002002', name: 'น้ำมันเครื่อง 5W-30 4L', qty: 2, unitPrice: 200.25 },
    ],
  },
  {
    id: 'demo-2',
    billNo: '2PA69040015',
    at: '2026-04-02T11:42:00',
    total: 3200,
    paymentId: 'qr',
    lineCount: 1,
    lines: [{ productId: 'demo-p3', sku: '3003003003', name: 'ยาง 205/55R16 (ตัวอย่าง)', qty: 1, unitPrice: 3200 }],
  },
  {
    id: 'demo-3',
    billNo: '1PA69040102',
    at: '2026-04-01T16:05:00',
    total: 450,
    paymentId: 'bill',
    lineCount: 1,
    lines: [{ productId: 'demo-p4', sku: '4004004004', name: 'ไส้กรองอากาศ', qty: 1, unitPrice: 450 }],
  },
  {
    id: 'demo-legacy',
    /** รูปแบบบิลเก่า (ก่อนปรับหัวบิล POS) — อาจไม่มี `lines` ในข้อมูลเก็บย้อนหลัง */
    billNo: '3C0000042',
    at: '2026-03-28T14:20:00',
    total: 1500,
    paymentId: 'credit',
    lineCount: 2,
    lines: undefined,
  },
]
