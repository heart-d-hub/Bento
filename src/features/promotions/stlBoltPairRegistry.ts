import { MOCK_PRODUCTS } from '@/features/inventory/data/mockInventory'
import { getProductMasterById, getProductMasterBySku } from '@/features/inventory/data/productMasterData'

/**
 * คู่น็อต STL: ตัวผู้ (น็อตยาว) → ตัวเมีย/หัว + แหวนอีแปะแถมตาม min(ตัวผู้, ตัวเมีย)
 * 1) ค่าจากแฟ้มมาสเตอร์ (SKU) 2) fallback ตารางด้านล่าง
 */
export type StlBoltPairConfig = {
  nutProductId: string
  washerProductId: string
}

/** productId ของน็อตตัวผู้ → ตัวเมีย + แหวน (สำรองเมื่อยังไม่ตั้งในแฟ้มมาสเตอร์) */
export const STL_BOLT_PAIR_BY_MALE_PRODUCT_ID: Record<string, StlBoltPairConfig> = {
  /** mock เดิม */
  'p-stl-bolt-male-14x12': {
    nutProductId: 'p-stl-nut-female-14',
    washerProductId: 'p-stl-washer-14',
  },
  /** แฟ้มมาสเตอร์ (SKU เดียวกัน — id เป็น pm-…) */
  'pm-stl-bolt-male-14x12': {
    nutProductId: 'pm-stl-nut-female-14',
    washerProductId: 'pm-stl-washer-14',
  },
}

/** หา productId จาก SKU — แฟ้มมาสเตอร์ก่อน แล้วค่อย mock */
function resolveProductIdForSku(sku: string): string | undefined {
  const k = sku.trim().toLowerCase()
  if (!k) return undefined
  const fromMaster = getProductMasterBySku(sku)
  if (fromMaster) return fromMaster.id
  return MOCK_PRODUCTS.find((p) => p.sku.trim().toLowerCase() === k)?.id
}

function pairFromMasterForMaleSku(maleSku: string): StlBoltPairConfig | undefined {
  const master = getProductMasterBySku(maleSku)
  if (!master?.stlBoltPairNutSku?.trim() || !master?.stlBoltPairWasherSku?.trim()) return undefined
  const nutId = resolveProductIdForSku(master.stlBoltPairNutSku)
  const washerId = resolveProductIdForSku(master.stlBoltPairWasherSku)
  if (!nutId || !washerId) return undefined
  return { nutProductId: nutId, washerProductId: washerId }
}

export function getStlBoltPairForMaleProduct(productId: string): StlBoltPairConfig | undefined {
  const fromTable = STL_BOLT_PAIR_BY_MALE_PRODUCT_ID[productId]
  if (fromTable) return fromTable
  const inv = MOCK_PRODUCTS.find((p) => p.id === productId)
  if (inv) {
    const fromSku = pairFromMasterForMaleSku(inv.sku)
    if (fromSku) return fromSku
  }
  /** สินค้าที่มีเฉพาะในแฟ้มมาสเตอร์ (ไม่มีใน MOCK_PRODUCTS) — อ่านคู่หัวจากแถวมาสเตอร์ตาม id */
  const masterOnly = getProductMasterById(productId)
  if (masterOnly) return pairFromMasterForMaleSku(masterOnly.sku)
  return undefined
}

export function isStlBoltMaleWithPair(productId: string): boolean {
  return getStlBoltPairForMaleProduct(productId) !== undefined
}
