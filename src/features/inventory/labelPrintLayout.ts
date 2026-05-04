import type { PriceCipherMoney } from '@/features/inventory/data/priceCipherCodec'
import type { ProductMasterDetail } from '@/features/inventory/data/productMasterData'
import {
  parsePiecesPerPack,
  sellPriceSmallUnitFromTier,
  sellPriceTierContextFromProduct,
} from '@/features/inventory/data/productMasterData'
import type { LabelPrintQueueItem } from '@/features/inventory/data/labelPrintQueueStore'

export type EnrichedLabelRow = LabelPrintQueueItem & {
  name: string
  sku?: string
  oemNo?: string
  factoryNo?: string
  carModelText?: string
  salesUnitText?: string
  brandText?: string
  /** ที่เก็บหลัก / Bin location เช่น "A-3-15" — มาจาก primaryStorageLocation(master) */
  storageLocation?: string
  /** ที่เก็บทั้งหมด — สำหรับ field binLocationsAll */
  storageLocations?: string[]
  price?: number
  /** ต้นทุนจากแฟ้มสินค้า — ใช้เข้ารหัสราคาบนป้าย */
  costPrice?: number
  /** ราคาหลายระดับสำหรับคำนวณรหัสราคาตามแท็บตั้งค่า */
  priceCipherMoney?: PriceCipherMoney
}

/** รวมทุน + ราคา 5 ระดับจากแฟ้มสินค้า (และราคาจากคิวถ้าไม่มีแถวปลีก) */
export function buildPriceCipherMoneyForRow(
  master: ProductMasterDetail | undefined,
  row: { costPrice?: number; price?: number },
): PriceCipherMoney {
  const costBaht = row.costPrice ?? master?.costPrice ?? 0
  const pieces = parsePiecesPerPack(master?.packaging)
  const tierCtx = master ? sellPriceTierContextFromProduct(master) : undefined
  const tiers: [number, number, number, number, number] = [0, 0, 0, 0, 0]
  const st = master?.sellPriceTiers
  if (st?.length) {
    for (let i = 0; i < 5; i++) {
      const t = st[i]
      if (!t) continue
      const v = sellPriceSmallUnitFromTier(t, costBaht, pieces, tierCtx)
      tiers[i] = v != null && v > 0 ? v : 0
    }
  }
  const fallbackRetailBaht =
    row.price != null && row.price > 0
      ? row.price
      : master != null && master.sellPrice > 0
        ? master.sellPrice
        : tiers[0] > 0
          ? tiers[0]
          : 0
  return { costBaht, tiers, fallbackRetailBaht }
}

/** แต่ละแถวในคิว = พิมพ์ซ้ำตามจำนวน `qty` แผ่น */
export function expandQueueToLabels(rows: EnrichedLabelRow[]): EnrichedLabelRow[] {
  const out: EnrichedLabelRow[] = []
  for (const r of rows) {
    const n = Math.max(0, Math.floor(Number(r.qty) || 0))
    for (let i = 0; i < n; i++) out.push(r)
  }
  return out
}

/** แบ่งรายการป้ายเป็นหน้า ๆ โดยเติมช่องว่างด้วย null */
export function buildLabelPages(
  items: EnrichedLabelRow[],
  perPage: number,
): (EnrichedLabelRow | null)[][] {
  const pp = Math.max(1, Math.floor(perPage))
  if (items.length === 0) return []
  const pages: (EnrichedLabelRow | null)[][] = []
  for (let i = 0; i < items.length; i += pp) {
    const chunk: (EnrichedLabelRow | null)[] = items.slice(i, i + pp)
    while (chunk.length < pp) chunk.push(null)
    pages.push(chunk)
  }
  return pages
}

const COMPOSITE_2X4_SLOT = 4

/**
 * แม่แบบ 2×4: 4 รายการคิวต่อดวงสติ๊กเกอร์ 50×35 — แบ่งกลุ่มแล้วแบนต่อหน้า
 * ลำดับในกลุ่ม = ซ้ายบน → ซ้ายล่าง → ขวาบน → ขวาล่าง (ตามลำดับคิว)
 * คืนแต่ละหน้าเป็นอาร์เรย์ยาว physicalSlotsPerPage×4 (แบน)
 */
export function buildComposite2x4LabelPages(
  items: EnrichedLabelRow[],
  physicalSlotsPerPage: number,
): (EnrichedLabelRow | null)[][] {
  const perPhys = Math.max(1, Math.floor(physicalSlotsPerPage))
  if (items.length === 0) return []

  const groups: (EnrichedLabelRow | null)[][] = []
  for (let i = 0; i < items.length; i += COMPOSITE_2X4_SLOT) {
    const g: (EnrichedLabelRow | null)[] = []
    for (let j = 0; j < COMPOSITE_2X4_SLOT; j++) {
      g.push(items[i + j] ?? null)
    }
    groups.push(g)
  }

  const pages: (EnrichedLabelRow | null)[][] = []
  for (let i = 0; i < groups.length; i += perPhys) {
    const chunk = groups.slice(i, i + perPhys)
    const padded = [...chunk]
    while (padded.length < perPhys) {
      padded.push([null, null, null, null])
    }
    pages.push(padded.flat())
  }
  return pages
}
