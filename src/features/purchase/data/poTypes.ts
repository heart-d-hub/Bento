import type { BranchId } from '@/features/auth/branches'

/** ฉบับร่าง → สั่งแล้ว (ล็อกแก้ไข) → รับของบางส่วน/ครบ → ชำระ/เจ้าหนี้ */
export type PurchaseOrderStatus = 'draft' | 'ordered' | 'closed'

export type PurchasePaymentMode = 'unpaid' | 'paid_cash' | 'paid_transfer' | 'payable'

export type PoReceiveLine = {
  lineId: string
  qty: number
  unitCost: number
}

export type PoReceiveBatch = {
  id: string
  at: string
  lines: PoReceiveLine[]
  /** เลขที่ใบกำกับ/อ้างอิง (หลายเลขคั่นด้วย comma) */
  refNos?: string
  /** ค่าขนส่งครั้งรับนี้ (บาท) */
  shippingCostBaht?: number
  /** รับเข้าสาขา (บันทึกประกอบการรับ — สต็อก POS ยังอัปเดตรวมตาม flow เดิม) */
  receiveBranchId?: BranchId
}

export type PurchaseOrderLine = {
  lineId: string
  productId: string
  sku: string
  name: string
  /** จำนวนสั่ง (ขั้น Ordered) */
  orderedQty: number
  /** ต้นทุนต่อหน่วยตอนสั่ง — แก้ไขได้ใน Draft */
  unitCostOrder: number
  /** สะสมจำนวนที่รับแล้ว */
  receivedQtyTotal: number
}

export type PurchaseOrder = {
  id: string
  poNo: string
  branchId: BranchId
  supplierId: string
  supplierName: string
  status: PurchaseOrderStatus
  createdAt: string
  orderedAt?: string
  closedAt?: string
  lines: PurchaseOrderLine[]
  receiveBatches: PoReceiveBatch[]
  /** ขั้นชำระ — VAT กับส่วนลดคิดจากฐานรับของจริง */
  vatRatePercent: number
  billDiscountBaht: number
  paymentMode: PurchasePaymentMode
  /** ช่องทางลดหนี้ตามแฟ้มการเงิน — ใช้เมื่อชำระแล้ว (เงินสด/โอน) */
  debtReductionChannel?: string
  paymentNote?: string
  paidAt?: string
}
