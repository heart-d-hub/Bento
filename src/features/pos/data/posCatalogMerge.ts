import { MOCK_PRODUCTS, type InventoryProduct } from '@/features/inventory/data/mockInventory'
import {
  getProductMasterList,
  productEligibleForPosSale,
  totalCrossBranchStock,
  type ProductMasterDetail,
} from '@/features/inventory/data/productMasterData'

/** แปลงแฟ้มมาสเตอร์ → รูปแบบที่ POS ใช้ค้นหา/ตัดสต็อก */
export function masterToInventoryProduct(m: ProductMasterDetail): InventoryProduct {
  const oemFirst = m.oemTags?.[0]?.trim() ?? ''
  const stock = Math.max(0, Math.floor(totalCrossBranchStock(m)))
  return {
    id: m.id,
    sku: m.sku,
    genuineNo: oemFirst,
    factoryOem: m.factoryNo ?? '',
    name: m.name,
    brand: m.brand === '—' ? '' : m.brand,
    location: m.storageLocations?.[0] ?? m.storageLocation ?? m.crossBranch?.[0]?.position ?? '',
    stock,
    minStock: 0,
    category: m.category,
    subCategory: m.subCategory,
    subSubCategory: m.subSubCategory,
    carBrand: m.carBrand !== '—' ? m.carBrand : undefined,
    carModelLabel: m.carModelLabel !== '—' ? m.carModelLabel : undefined,
    yearLabel: m.yearLabel !== '—' ? m.yearLabel : undefined,
    isGenuine: m.isGenuine,
    stockMode: m.stockMode,
    nominalKgPerRoll: m.nominalKgPerRoll,
    nominalMetersPerRoll: m.nominalMetersPerRoll,
    piecesPerBox: m.piecesPerBox,
    splitSale: m.splitSale,
    productTagIds: m.productTagIds?.length ? [...m.productTagIds] : undefined,
    posDisplayNote: m.posDisplayNote,
    vehicleFitments: m.vehicleFitments?.length ? m.vehicleFitments : undefined,
    barcodes: m.barcodes?.length ? m.barcodes : undefined,
    bundleComponents: m.bundleComponents?.length ? m.bundleComponents : undefined,
  }
}

/**
 * รายการสินค้า POS = แฟ้มมาสเตอร์ก่อน แล้วต่อด้วย mock ที่ SKU ยังไม่มีในแฟ้ม
 * (สำหรับของเดโม / สินค้าที่ยังไม่มีในแฟ้ม)
 *
 * ถ้า SKU ซ้ำระหว่างมาสเตอร์กับ MOCK_PRODUCTS: ใช้ **id จาก mock** เป็น canonical
 * (สูตรประกอบ / โค้ดเก่าใช้ p-* — มาสเตอร์มักเป็น pm-*) เพื่อให้คีย์สต็อก POS ตรงกับที่เลือกในสูตร
 */
export function getPosCatalogProducts(): InventoryProduct[] {
  const masters = getProductMasterList()
    .filter(productEligibleForPosSale)
    .map(masterToInventoryProduct)
  const mockBySku = new Map(MOCK_PRODUCTS.map((p) => [p.sku.trim().toLowerCase(), p] as const))

  const mergedFromMaster: InventoryProduct[] = []
  for (const m of masters) {
    const sk = m.sku.trim().toLowerCase()
    const mock = mockBySku.get(sk)
    if (mock) {
      mergedFromMaster.push({
        ...mock,
        ...m,
        id: mock.id,
        stock: m.stock,
        minStock: mock.minStock ?? m.minStock,
        maxStock: mock.maxStock ?? m.maxStock,
        stockShopBack: mock.stockShopBack ?? m.stockShopBack,
        rollStockSeed: mock.rollStockSeed ?? m.rollStockSeed,
      })
    } else {
      mergedFromMaster.push(m)
    }
  }

  return mergedFromMaster
}

/**
 * คีย์สต็อกชิ้นใน localStorage เก่าที่ใช้ id มาสเตอร์ (pm-*) — รวมเข้า id จาก mock (p-*) ตาม SKU
 */
export function getPieceStockLegacyIdAliases(): Record<string, string> {
  const masters = getProductMasterList()
  const mockBySku = new Map(MOCK_PRODUCTS.map((p) => [p.sku.trim().toLowerCase(), p] as const))
  const out: Record<string, string> = {}
  for (const m of masters) {
    const mock = mockBySku.get(m.sku.trim().toLowerCase())
    if (mock && mock.id !== m.id) {
      out[m.id] = mock.id
    }
  }
  return out
}
