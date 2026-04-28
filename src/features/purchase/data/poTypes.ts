import type { BranchId } from '@/features/auth/branches'

/** ฉบับร่าง → สั่งแล้ว (ล็อกแก้ไข) → รับของบางส่วน/ครบ → ชำระ/เจ้าหนี้ */
export type PurchaseOrderStatus = 'draft' | 'ordered' | 'closed'

export type PurchasePaymentMode = 'unpaid' | 'paid_cash' | 'paid_transfer' | 'payable'

export type PoReceiveLine = {
  lineId: string
  qty: number
  unitCost: number
  /** จำนวนที่หาย/เสียหายตามใบกำกับแต่ไม่ได้รับของจริง — ไม่เพิ่มสต็อก แต่ยังคิดในยอดชำระ */
  shortageQty?: number
  /** สาเหตุที่ขาด/เสียหาย */
  shortageReason?: string
}

export type PoReceiveBatch = {
  id: string
  at: string
  lines: PoReceiveLine[]
  /** เลขที่ใบกำกับ/อ้างอิง (หลายเลขคั่นด้วย comma) */
  refNos?: string
  /** ค่าขนส่งครั้งรับนี้ (บาท) — คิดเข้าต้นทุนสินค้าแบบ landed cost */
  shippingCostBaht?: number
  /** รับเข้าสาขา (บันทึกประกอบการรับ — สต็อก POS ยังอัปเดตรวมตาม flow เดิม) */
  receiveBranchId?: BranchId
  /** บันทึกประกอบการรับ */
  notes?: string
  /** อ้างอิงบันทึกขนส่ง (TransportShipmentLog.id) — สำหรับยกเลิก */
  transportLogId?: string
}

export type PurchaseOrderLine = {
  lineId: string
  productId: string
  sku: string
  name: string
  /** จำนวนสั่ง (ขั้น Ordered) — เก็บเป็นชิ้นเสมอ */
  orderedQty: number
  /** จำนวนกล่องที่สั่ง — สำหรับสินค้าที่มี piecesPerBox (แสดงผลและอ้างอิงกับ supplier) */
  orderBoxCount?: number
  /** ต้นทุนต่อหน่วยตอนสั่ง — แก้ไขได้ใน Draft */
  unitCostOrder: number
  /** สะสมจำนวนที่รับแล้ว */
  receivedQtyTotal: number
  /** โปรโมชั่น: ราคาตั้งต้น (ก่อนส่วนลด) */
  listPrice?: number
  /** โปรโมชั่น: ส่วนลดแบบขั้น เช่น "45+10" หมายถึง 45% แล้วอีก 10% */
  discountChain?: string
  /** โปรโมชั่น: ซื้อกี่ชิ้นถึงได้แถม (per-line scheme) */
  bonusPaidQty?: number
  /** โปรโมชั่น: แถมกี่ชิ้นต่อรอบ (per-line scheme) */
  bonusFreeQty?: number
  /** โปรโมชั่น: % แถมเพิ่มจากจำนวนที่สั่ง เช่น 5 = ซื้อ 50 ได้เพิ่ม 2 ชิ้น (mutually exclusive กับ bonusPaidQty/bonusFreeQty) */
  bonusPct?: number
}

export type PoPromoGroup = {
  id: string
  name: string
  /** ซื้อรวมกี่ชิ้นจึงได้สิทธิ์แถม */
  buyQty: number
  /** จำนวนที่แถม (ราคาถูกสุด) */
  freeQty: number
  /** lineId ของรายการที่อยู่ในกลุ่ม */
  lineIds: string[]
}

/**
 * 'excluded' (default) — ราคาที่ผู้ขายแจ้งยังไม่รวม VAT → ระบบบวก VAT ทีหลัง
 * 'included'           — ราคาที่ผู้ขายแจ้งรวม VAT แล้ว → ระบบคำนวณต้นทุนก่อน VAT อัตโนมัติ
 * 'none'               — ไม่มี VAT เลย
 */
export type PoVatMode = 'excluded' | 'included' | 'none'

export type PoInvoice = {
  id: string
  /** เลขที่ใบกำกับภาษีจากผู้จำหน่าย */
  invoiceNo: string
  /** วันที่ในใบกำกับ (ISO date string yyyy-mm-dd) */
  invoiceDate: string
  /** เชื่อมกับครั้งรับของ (PoReceiveBatch.id) — optional */
  receiveBatchId?: string
  /** ยอดรวมก่อน VAT ตามในใบกำกับ */
  beforeVatBaht: number
  /** ภาษีมูลค่าเพิ่มในใบกำกับ */
  vatBaht: number
  /** ยอดรวมสุทธิในใบกำกับ (beforeVatBaht + vatBaht + ค่าขนส่งใดๆ) */
  totalBaht: number
  notes?: string
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
  /** วิธีคิด VAT จากราคาที่ผู้ขายแจ้ง — default 'excluded' */
  vatMode?: PoVatMode
  billDiscountBaht: number
  /** ส่วนลดท้ายบิลในรูปแบบ % — เมื่อตั้งค่า billDiscountBaht จะถูกคำนวณอัตโนมัติ */
  billDiscountPct?: number
  paymentMode: PurchasePaymentMode
  /** ช่องทางลดหนี้ตามแฟ้มการเงิน — ใช้เมื่อชำระแล้ว (เงินสด/โอน) */
  debtReductionChannel?: string
  /** บัญชีธนาคารของซัพพลายเออร์ที่ชำระไป — แสดงผลจากโปรไฟล์ supplier */
  supplierBankAccountRef?: string
  paymentNote?: string
  paidAt?: string
  /** วันที่คาดว่าจะได้รับสินค้า (ISO date string yyyy-mm-dd) */
  expectedDeliveryAt?: string
  /** วิธีขนส่ง เช่น Kerry, Flash, รับเอง */
  shippingMethod?: string
  /** กลุ่มโปรโมชั่นแบบมิกซ์-แมทช์ */
  promoGroups?: PoPromoGroup[]
  /** บันทึกภายใน */
  notes?: string
  /** เลขที่ใบกำกับ supplier */
  invoiceNo?: string
  /** เลขพัสดุ / tracking number */
  trackingNo?: string
  /** ใบกำกับภาษีจากผู้จำหน่าย — หนึ่ง PO มีได้หลายใบ */
  poInvoices?: PoInvoice[]
}
