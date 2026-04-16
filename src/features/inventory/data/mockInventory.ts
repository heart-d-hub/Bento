export type InventoryActivity = {
  id: string
  text: string
  time: string
}

export type LowStockHighlight = {
  id: string
  sku: string
  name: string
  current: number
  min: number
}

/** piece = นับชิ้น · kg_roll = ม้วน/กก. · meter_roll = ม้วน/เมตร · box_piece = กล่องปิด + เศษตัว (ขายชิ้น) */
export type StockMode = 'piece' | 'kg_roll' | 'meter_roll' | 'box_piece'

/** ม้วนเปิด/เศษหนึ่งม้วน — หลายรายการได้ (FIFO ตามลำดับในอาร์เรย์) */
export type OpenRollSeed = {
  id: string
  remainingKg: number
}

/** ม้วนเต็มในชุด seed — กก. + วันที่รับ (FIFO) */
export type FullRollSeed = {
  id?: string
  kg: number
  receivedDate?: string
}

export type RollStockSeed = {
  fullRolls: number
  /** แบบเดิม: ม้วนเปิดกก. เดียว — แปลงเป็น openRolls อัตโนมัติ */
  openKg?: number
  /** แบบใหม่: หลายม้วนเศษ — ถ้ามีจะใช้แทน openKg */
  openRolls?: OpenRollSeed[]
  /** ม้วนเต็มทีละม้วน (กก. ไม่เท่ากัน) — ถ้ามีจะไม่ใช้แค่ fullRolls */
  fullRollParts?: FullRollSeed[]
}

export type InventoryProduct = {
  id: string
  sku: string
  /** เบอร์แท้ / หมายเลขอะไหล่แท้ */
  genuineNo: string
  /** เบอร์โรงงาน / OEM */
  factoryOem: string
  name: string
  brand: string
  location: string
  stock: number
  minStock: number
  /** เพดานสต็อก (คลัง) — ไม่ระบุหรือ 0 = ไม่เตือนเกิน */
  maxStock?: number
  category: string
  /** หมวดย่อย 1 — สอดคล้องกับแฟ้มมาสเตอร์ / ต้นไม้หมวด */
  subCategory?: string
  /** หมวดย่อย 2 — ใต้ subCategory */
  subSubCategory?: string
  /** ยี่ห้อรถ (เช่น ISUZU, MITSUBISHI) */
  carBrand?: string
  /** รถ/รุ่น (ใช้ช่วยถามต่อใน POS) */
  carModelLabel?: string
  /** ช่วงปี (ใช้ช่วยถามต่อใน POS) */
  yearLabel?: string
  /** true = ของแท้ (OEM) */
  isGenuine?: boolean
  /** โหมดสต็อก — kg_roll / meter_roll = ม้วน · box_piece = กล่อง+เศษ + piecesPerBox */
  stockMode?: StockMode
  /** น้ำหนักม้วนเต็มโดยประมาณ (กก.) — ใช้ตัดสต็อกเมื่อขายจากม้วนเต็ม (stockMode = kg_roll) */
  nominalKgPerRoll?: number
  /** เมตรต่อม้วนเต็ม — ใช้ตัดสต็อกเมื่อขายจากม้วนเต็ม (stockMode = meter_roll; ค่าใน roll state เป็นหน่วยเมตร) */
  nominalMetersPerRoll?: number
  /** ชิ้นต่อกล่อง (ปิด) — ใช้เมื่อ stockMode = box_piece */
  piecesPerBox?: number
  /** ค่าเริ่มต้นม้วน/เศษ (ก่อนโหลด localStorage) */
  rollStockSeed?: RollStockSeed
  /** สต็อกหลังร้าน/คลังย่อย — แสดงในตะกร้า POS คู่กับสต็อกหน้าร้าน (สด) */
  stockShopBack?: number
  /** สินค้าแบ่งขาย — ชื่อบิล/POS ใช้ชื่อสั้น (ไม่ติดท้ายวงเล็บ) */
  splitSale?: boolean
  /** แท็กสินค้า (แฟ้มมาสเตอร์) — แสดงในหน้าแบ่งขาย / โปร ฯลฯ */
  productTagIds?: string[]
  /** หมายเหตุแสดงบน POS — โชว์หลังชื่อสินค้าในตะกร้า */
  posDisplayNote?: string
}

export const INVENTORY_SUMMARY = {
  totalSkus: 14250,
  totalValueBaht: 3500000,
}

export const LOW_STOCK_HIGHLIGHTS: LowStockHighlight[] = [
  { id: '1', sku: 'TOYVIG412', name: 'ลูกหมากปีกนก Vigo 2WD', current: 5, min: 10 },
  { id: '2', sku: 'HON-PLG-01', name: 'หัวเทียน NGK (ชุด)', current: 3, min: 12 },
  { id: '3', sku: 'BATT-12V-55', name: 'แบตเตอรี่ 12V 55Ah', current: 2, min: 8 },
]

export const INVENTORY_ACTIVITIES: InventoryActivity[] = [
  { id: '1', text: 'รับสินค้าใหม่ (PO#123) — กรองอากาศ Civic x24', time: '10:32' },
  { id: '2', text: 'ขายสินค้า (Inv#456) — น้ำมันเครื่อง 0W-20 x3', time: '09:15' },
  { id: '3', text: 'ปรับปรุงสต็อก: แบตเตอรี่ -2 ชิ้น', time: 'เมื่อวาน' },
]

export const MOCK_PRODUCTS: InventoryProduct[] = [
  {
    id: 'p1',
    sku: 'TOYVIG412',
    genuineNo: '43330-0K010',
    factoryOem: '43330-0K020-TH',
    name: 'ลูกหมากปีกนก Vigo 2WD',
    brand: '555',
    location: 'B4-12',
    stock: 35,
    stockShopBack: 18,
    minStock: 10,
    category: 'ช่วงล่าง',
  },
  {
    id: 'p2',
    sku: 'HON-CIV-AF',
    genuineNo: '17220-5AA-A00',
    factoryOem: '17220-RNA-A00',
    name: 'กรองอากาศ Civic FC',
    brand: 'HONDA',
    location: 'A1-03',
    stock: 10,
    stockShopBack: 24,
    minStock: 15,
    category: 'เครื่องยนต์',
    carBrand: 'HONDA',
    carModelLabel: 'Civic FC',
    yearLabel: '2016+',
    isGenuine: true,
  },
  {
    id: 'p3',
    sku: 'ISO-DMAX-F',
    genuineNo: '8-98165-121-0',
    factoryOem: '89801651210',
    name: 'กรองโซล่า D-MAX',
    brand: 'ISUZU',
    location: 'C2-08',
    stock: 20,
    stockShopBack: 32,
    minStock: 8,
    category: 'เครื่องยนต์',
    carBrand: 'ISUZU',
    carModelLabel: 'D-MAX',
    yearLabel: '2012+',
    isGenuine: true,
  },
  {
    id: 'p6',
    sku: 'MITS-TRI-FUEL-A',
    genuineNo: '—',
    factoryOem: 'MITS-TRI-FUEL-01',
    name: 'กรองโซล่า Triton (เทียบ)',
    brand: 'Sakura',
    location: 'C2-10',
    stock: 14,
    stockShopBack: 8,
    minStock: 6,
    category: 'เครื่องยนต์',
    carBrand: 'MITSUBISHI',
    carModelLabel: 'Triton',
    yearLabel: '2005-2014',
    isGenuine: false,
  },
  {
    id: 'p7',
    sku: 'MITS-TRI-FUEL-OEM',
    genuineNo: 'MN123456',
    factoryOem: 'MITS-MN123456',
    name: 'กรองโซล่า Triton (แท้)',
    brand: 'MITSUBISHI',
    location: 'C2-11',
    stock: 4,
    stockShopBack: 12,
    minStock: 4,
    category: 'เครื่องยนต์',
    carBrand: 'MITSUBISHI',
    carModelLabel: 'Triton',
    yearLabel: '2015+',
    isGenuine: true,
  },
  {
    id: 'p4',
    sku: 'BAT-55AH',
    genuineNo: 'N55-MF',
    factoryOem: 'FB-N55-TH01',
    name: 'แบตเตอรี่ 12V 55Ah',
    brand: 'FB',
    location: 'D1-01',
    stock: 6,
    stockShopBack: 14,
    minStock: 10,
    category: 'ไฟฟ้า',
  },
  {
    id: 'p-gift-shirt',
    sku: 'GIFT-SHIRT-IDEM',
    genuineNo: '—',
    factoryOem: '—',
    name: 'เสื้อแถม (โปรโมชัน)',
    brand: 'Promo',
    location: 'PROMO',
    stock: 40,
    stockShopBack: 0,
    minStock: 0,
    category: 'ของแถม',
  },
  {
    id: 'p-hose-1in',
    sku: 'HOSE-1IN-PU',
    genuineNo: '—',
    factoryOem: 'HOSE-1IN-GEN',
    name: 'สายยางท่อน้ำ 1 นิ้ว (ตัดกิโล / ยกม้วน)',
    splitSale: true,
    brand: 'Generic',
    location: 'R-HOSE-01',
    stock: 247,
    /** กก. โดยประมาณในคลังหลัง (โชว์คู่สต็อกหน้าร้าน) */
    stockShopBack: 180,
    minStock: 20,
    category: 'ท่อและสาย',
    stockMode: 'kg_roll',
    nominalKgPerRoll: 25,
    /** ม้วนเต็ม 10 — ไม่มีม้วนเปิด (เทสต์เริ่มสะอาด) */
    rollStockSeed: {
      fullRolls: 10,
    },
  },
  {
    id: 'p5',
    sku: 'WIP-24',
    genuineNo: '3397018924',
    factoryOem: 'BOS-W24-ASIA',
    name: 'ใบปัดน้ำฝน 24"',
    brand: 'BOSCH',
    location: 'B4-12',
    stock: 48,
    stockShopBack: 60,
    minStock: 12,
    category: 'อุปกรณ์',
  },
  {
    id: 'p-batt-cable-raw',
    sku: 'BATT-CABLE-RAW',
    genuineNo: '—',
    factoryOem: 'CABLE-RAW-BATT',
    name: 'สายแบตเตอรี่แบบยังไม่ตัด',
    brand: 'Generic',
    location: 'R-BATT-01',
    stock: 120,
    stockShopBack: 80,
    minStock: 20,
    category: 'ไฟฟ้า',
  },
  {
    id: 'p-batt-cable',
    sku: 'BATT-CABLE',
    genuineNo: '—',
    factoryOem: 'BATT-CABLE-STD',
    name: 'สายแบตเตอรี่',
    brand: 'Generic',
    location: 'R-BATT-01',
    stock: 80,
    stockShopBack: 40,
    minStock: 15,
    category: 'ไฟฟ้า',
  },
  {
    id: 'p-batt-head-plus',
    sku: 'BATT-HEAD-PLUS-BRASS',
    genuineNo: '—',
    factoryOem: 'BATT-PLUS-BR',
    name: 'หัวสายแบตทองเหลือง (+)',
    brand: 'Generic',
    location: 'R-BATT-02',
    stock: 45,
    stockShopBack: 20,
    minStock: 10,
    category: 'ไฟฟ้า',
  },
  {
    id: 'p-batt-head-minus',
    sku: 'BATT-HEAD-MINUS-BRASS',
    genuineNo: '—',
    factoryOem: 'BATT-MINUS-BR',
    name: 'หัวสายแบตทองเหลือง (-)',
    brand: 'Generic',
    location: 'R-BATT-02',
    stock: 42,
    stockShopBack: 24,
    minStock: 10,
    category: 'ไฟฟ้า',
  },
  {
    id: 'p-batt-lug',
    sku: 'BATT-LUG',
    genuineNo: '—',
    factoryOem: 'BATT-LUG-COP',
    name: 'หางปลา',
    brand: 'Generic',
    location: 'R-BATT-03',
    stock: 150,
    stockShopBack: 120,
    minStock: 30,
    category: 'ไฟฟ้า',
  },
  {
    id: 'p-batt-rubber-boot',
    sku: 'BATT-RUBBER-BOOT',
    genuineNo: '—',
    factoryOem: 'BATT-BOOT-RB',
    name: 'ยางหุ้มหัวแบต',
    brand: 'Generic',
    location: 'R-BATT-03',
    stock: 90,
    stockShopBack: 70,
    minStock: 20,
    category: 'ไฟฟ้า',
  },
  {
    id: 'p-batt-cable-2m-asm',
    sku: 'BATT-CABLE-2M-ASM',
    genuineNo: '—',
    factoryOem: 'ASM-BATT-2M',
    name: 'สายแบตเตอรี่ 2(ประกอบ)',
    brand: 'Assembled',
    location: 'FG-BATT-01',
    stock: 0,
    stockShopBack: 0,
    minStock: 5,
    category: 'สินค้าประกอบ',
  },
  /** น็อต STL — คู่กับหัว/ตัวเมีย + แถมแหวน (ดู stlBoltPairRegistry) */
  {
    id: 'p-stl-bolt-male-14x12',
    sku: 'STL-BOLT-14-12',
    genuineNo: '—',
    factoryOem: 'STL-14-12',
    name: 'น็อต STL 1/4×1/2 (ตัวผู้)',
    brand: 'STL',
    location: 'BOLT-14',
    stock: 800,
    stockShopBack: 400,
    minStock: 50,
    category: 'น็อต / สกรู',
  },
  {
    id: 'p-stl-nut-female-14',
    sku: 'STL-NUT-14-F',
    genuineNo: '—',
    factoryOem: 'STL-NUT-14',
    name: 'หัวน็อต STL 1/4 (ตัวเมีย)',
    brand: 'STL',
    location: 'BOLT-14',
    stock: 600,
    stockShopBack: 300,
    minStock: 40,
    category: 'น็อต / สกรู',
  },
  {
    id: 'p-stl-washer-14',
    sku: 'STL-WASH-14',
    genuineNo: '—',
    factoryOem: 'STL-WASH-14',
    name: 'แหวนอีแปะ 1/4 (แถมคู่น็อต)',
    brand: 'STL',
    location: 'BOLT-14',
    stock: 2000,
    stockShopBack: 1000,
    minStock: 100,
    category: 'น็อต / สกรู',
  },
]

export const FILTER_CATEGORIES = ['ทั้งหมด', ...new Set(MOCK_PRODUCTS.map((p) => p.category))]
export const FILTER_BRANDS = ['ทั้งหมด', ...new Set(MOCK_PRODUCTS.map((p) => p.brand))]
export const FILTER_LOCATIONS = ['ทั้งหมด', ...new Set(MOCK_PRODUCTS.map((p) => p.location))]
