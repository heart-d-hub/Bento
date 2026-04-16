/** สินค้าตัวอย่างในร้าน — ผูกกับ engineId (เครื่อง/ปี) ภายหลังจะดึงจาก API / สต็อกจริง */
export type StoreProductLine = {
  sku: string
  name: string
  price: number
  stock: number
  /** ถ้าระบุ — ใช้กรองหน้า/หลังสำหรับเบรก/ดิสก์; ไม่ระบุ = แสดงทุกโหมด */
  brakePosition?: 'front' | 'rear'
}

/** กรองรายการสินค้าตามตำแหน่งเบรก (ว่าง = แสดงทั้งหมด) */
export function filterStoreProductsByBrakePosition(
  products: StoreProductLine[],
  position: '' | 'front' | 'rear',
): StoreProductLine[] {
  if (!position) return products
  return products.filter((p) => {
    if (p.brakePosition === undefined) return true
    return p.brakePosition === position
  })
}

export const MOCK_STORE_PRODUCTS_BY_ENGINE_ID: Record<string, StoreProductLine[]> = {
  'e-h-civ-1': [
    { sku: 'HV-AF-CIV21', name: 'กรองอากาศ Honda Civic 1.5 Turbo', price: 890, stock: 14 },
    { sku: 'HV-OIL-0W20', name: 'น้ำมันเครื่อง 0W-20 (4L)', price: 1290, stock: 22 },
    { sku: 'HV-BR-PAD-F', name: 'ผ้าเบรกหน้า Civic FC', price: 2450, stock: 6, brakePosition: 'front' },
    { sku: 'HV-BR-PAD-R', name: 'ผ้าเบรกหลัง Civic FC', price: 2180, stock: 5, brakePosition: 'rear' },
  ],
  'e-h-civ-2': [
    { sku: 'HV-AF-CIV18', name: 'กรองอากาศ Honda Civic 1.8', price: 750, stock: 9 },
    { sku: 'HV-SP-PLG', name: 'หัวเทียน NGK (ชุด)', price: 680, stock: 15 },
  ],
  'e-h-city-1': [
    { sku: 'HV-AF-CITY', name: 'กรองอากาศ City / Jazz', price: 720, stock: 18 },
    { sku: 'HV-WIP-24', name: 'ใบปัดน้ำฝน 24"', price: 420, stock: 30 },
  ],
  'e-t-cam-1': [
    { sku: 'TY-FILTER-HY', name: 'กรองน้ำมันเครื่อง Hybrid Camry', price: 1150, stock: 8 },
    { sku: 'TY-BAT-12V', name: 'แบตเตอรี่ 12V (รับประกัน)', price: 3590, stock: 4 },
  ],
  'e-dmax-1': [
    { sku: 'IZ-OIL-DIE', name: 'น้ำมันเครื่องดีเซล (6L)', price: 1890, stock: 11 },
    { sku: 'IZ-FUEL-F', name: 'กรองโซล่า D-MAX', price: 950, stock: 7 },
  ],
  'e-gen-1': [
    { sku: 'GEN-SPARK-GX390', name: 'หัวเทียน GX390', price: 120, stock: 40 },
    { sku: 'GEN-OIL-SAE', name: 'น้ำมันเครื่องเครื่องยนต์เล็ก', price: 280, stock: 25 },
  ],
  'e-gen-2': [
    { sku: 'YM-FILTER-A', name: 'กรองอากาศ Yanmar 10hp', price: 350, stock: 12 },
  ],
  'e-fz-1': [
    { sku: 'MC-CHAIN-428', name: 'โซ่ 428 (ม้วน)', price: 890, stock: 5 },
    { sku: 'MC-OIL-10W40', name: 'น้ำมันเครื่อง 4T 1L', price: 180, stock: 50 },
  ],
}
