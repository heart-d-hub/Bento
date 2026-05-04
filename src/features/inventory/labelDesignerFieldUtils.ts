import type { LabelDesignerField } from '@/features/inventory/data/labelDesignerTemplateStore'
import {
  buildPriceCipherLine,
  normalizePriceCipherSettings,
  type PriceCipherSettings,
} from '@/features/inventory/data/priceCipherCodec'
import {
  buildPriceCipherMoneyForRow,
  type EnrichedLabelRow,
} from '@/features/inventory/labelPrintLayout'
import {
  getProductMasterList,
  normalizeSalesUnits,
  PRODUCT_MASTER_DETAILS,
  productStorageLocations,
  type ProductMasterDetail,
} from '@/features/inventory/data/productMasterData'

const sampleMaster = getProductMasterList()[0] ?? PRODUCT_MASTER_DETAILS[0]!

export const DESIGNER_SAMPLE_ROW: EnrichedLabelRow = {
  id: 'sample',
  name: 'ผ้าเบรกหน้า NAO แท้ F',
  barcode: '0602062500012',
  sku: '15011536',
  oemNo: '04465-0K360',
  factoryNo: 'P79027N',
  carModelText: `${sampleMaster.carModelLabel}(${sampleMaster.yearLabel})`,
  salesUnitText: normalizeSalesUnits(sampleMaster)[0]?.label ?? 'ชิ้น',
  brandText: sampleMaster.brand,
  storageLocation: sampleMaster.storageLocation ?? 'A-3-15',
  storageLocations: productStorageLocations(sampleMaster).length > 0
    ? productStorageLocations(sampleMaster)
    : ['A-3-15', 'หลังร้าน', 'โกดัง 2'],
  price: 1250,
  costPrice: 108.75,
  qty: 1,
  template: 'medium',
  priceCipherMoney: buildPriceCipherMoneyForRow(sampleMaster, {
    costPrice: sampleMaster.costPrice,
    price: sampleMaster.sellPrice,
  }),
}

export function formatBahtLabel(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function findProductMasterForLabelRow(row: EnrichedLabelRow): ProductMasterDetail | undefined {
  const keySku = (row.sku ?? '').trim().toLowerCase()
  const keyBar = (row.barcode ?? '').trim().toLowerCase()
  return getProductMasterList().find(
    (m) =>
      (keySku.length > 0 && m.sku.trim().toLowerCase() === keySku) ||
      (keyBar.length > 0 && (m.boxBarcode?.trim().toLowerCase() ?? '') === keyBar),
  )
}

export type DesignerFieldElementOptions = {
  salesUnitIndex?: number
}

export function getDesignerFieldValue(
  row: EnrichedLabelRow,
  field: LabelDesignerField,
  ctx?: { storeName?: string; priceCipher?: PriceCipherSettings },
  elementOpts?: DesignerFieldElementOptions,
): string {
  switch (field) {
    case 'name':
      return row.name || '—'
    case 'sku':
      return row.sku || '—'
    case 'barcode':
      return row.barcode || row.sku || ''
    case 'oem':
      return row.oemNo || '—'
    case 'factory':
      return row.factoryNo || '—'
    case 'carModel':
      return row.carModelText || '—'
    case 'salesUnit': {
      const master = findProductMasterForLabelRow(row)
      const units = master ? normalizeSalesUnits(master) : []
      let idx = elementOpts?.salesUnitIndex
      if (idx === undefined || !Number.isFinite(idx)) idx = 0
      idx = Math.max(0, Math.floor(idx))
      if (units.length > 0) {
        const i = Math.min(idx, units.length - 1)
        return units[i]?.label ?? '—'
      }
      return row.salesUnitText || '—'
    }
    case 'brand':
      return row.brandText || '—'
    case 'binLocation':
      return row.storageLocation || '—'
    case 'binLocationsAll': {
      if (row.storageLocations && row.storageLocations.length > 0) {
        return row.storageLocations.join(', ')
      }
      const master = findProductMasterForLabelRow(row)
      const locs = master ? productStorageLocations(master) : []
      if (locs.length > 0) return locs.join(', ')
      return row.storageLocation || '—'
    }
    case 'price':
      return row.price != null ? `฿${formatBahtLabel(row.price)}` : '—'
    case 'storeName':
      return (ctx?.storeName ?? '').trim() || '—'
    case 'priceCipher': {
      const settings = ctx?.priceCipher
      if (!settings) return '—'
      const money =
        row.priceCipherMoney ??
        buildPriceCipherMoneyForRow(undefined, {
          costPrice: row.costPrice,
          price: row.price,
        })
      return buildPriceCipherLine(money, normalizePriceCipherSettings(settings))
    }
    default:
      return '—'
  }
}

export function fieldLabelTh(field: LabelDesignerField): string {
  switch (field) {
    case 'name':
      return 'ชื่อสินค้า'
    case 'sku':
      return 'รหัส SKU'
    case 'barcode':
      return 'บาร์โค้ด'
    case 'oem':
      return 'เบอร์ OEM'
    case 'factory':
      return 'เบอร์โรงงาน'
    case 'carModel':
      return 'รุ่นรถที่ใช้ได้'
    case 'salesUnit':
      return 'หน่วยขาย'
    case 'brand':
      return 'บริษัท / แบรนด์ชิ้นงาน'
    case 'binLocation':
      return 'ที่เก็บ (Bin) — หลัก'
    case 'binLocationsAll':
      return 'ที่เก็บทั้งหมด (Bin)'
    case 'price':
      return 'ราคา'
    case 'storeName':
      return 'ชื่อร้าน'
    case 'priceCipher':
      return 'รหัสราคา'
    default:
      return field
  }
}
