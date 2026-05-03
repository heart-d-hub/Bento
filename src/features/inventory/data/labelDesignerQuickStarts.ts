import type {
  LabelDesignerElement,
  LabelDesignerTemplate,
} from '@/features/inventory/data/labelDesignerTemplateStore'

export type QuickStartTemplate = {
  id: string
  name: string
  description: string
  emoji: string
  build: () => LabelDesignerTemplate
}

let elIdSeq = 0
function el(part: Omit<LabelDesignerElement, 'id'>): LabelDesignerElement {
  return { id: `qs-${Date.now()}-${++elIdSeq}`, ...part }
}

/** เน้น OEM + barcode — เหมาะร้านอะไหล่ ลูกค้าถามจาก OEM ก่อน */
function buildAutoPartsOemFocus(): LabelDesignerTemplate {
  return {
    version: 1,
    name: 'Auto Parts (เน้น OEM)',
    widthMm: 50,
    heightMm: 35,
    elements: [
      el({ kind: 'text', field: 'storeName', x: 50, y: 2, w: 47, h: 10, fontSize: 6, textAlign: 'right', textVariant: 'badge' }),
      el({ kind: 'text', field: 'oem', x: 3, y: 14, w: 94, h: 16, fontSize: 13, textAlign: 'center', fontWeight: 'bold' }),
      el({ kind: 'text', field: 'name', x: 3, y: 32, w: 62, h: 9, fontSize: 7, textAlign: 'left' }),
      el({ kind: 'barcode', field: 'barcode', x: 3, y: 44, w: 62, h: 50 }),
      el({ kind: 'text', field: 'price', x: 67, y: 44, w: 30, h: 18, fontSize: 11, textAlign: 'center', fontWeight: 'bold' }),
      el({ kind: 'text', field: 'binLocation', x: 67, y: 66, w: 30, h: 12, fontSize: 8, textAlign: 'center' }),
    ],
  }
}

/** ราคาตัวใหญ่เด่น — ป้ายขายปลีก ลูกค้าเดินผ่านเห็นราคาทันที */
function buildPriceTag(): LabelDesignerTemplate {
  return {
    version: 1,
    name: 'Price Tag (ราคาเด่น)',
    widthMm: 50,
    heightMm: 35,
    elements: [
      el({ kind: 'text', field: 'storeName', x: 3, y: 2, w: 94, h: 9, fontSize: 6, textAlign: 'right', textVariant: 'badge' }),
      el({ kind: 'text', field: 'name', x: 3, y: 12, w: 94, h: 12, fontSize: 9, textAlign: 'center', fontWeight: 'bold' }),
      el({ kind: 'text', field: 'price', x: 3, y: 26, w: 94, h: 28, fontSize: 18, textAlign: 'center', fontWeight: 'bold' }),
      el({ kind: 'barcode', field: 'barcode', x: 3, y: 58, w: 65, h: 35 }),
      el({ kind: 'text', field: 'sku', x: 70, y: 88, w: 27, h: 8, fontSize: 7, textAlign: 'right' }),
    ],
  }
}

/** บาร์โค้ดเต็มพื้นที่ — สติ๊กเกอร์เล็ก เน้นการสแกน */
function buildMiniBarcode(): LabelDesignerTemplate {
  return {
    version: 1,
    name: 'Mini Sticker (บาร์โค้ดเด่น)',
    widthMm: 50,
    heightMm: 25,
    elements: [
      el({ kind: 'text', field: 'storeName', x: 3, y: 2, w: 94, h: 8, fontSize: 5, textAlign: 'left' }),
      el({ kind: 'barcode', field: 'barcode', x: 3, y: 12, w: 94, h: 60 }),
      el({ kind: 'text', field: 'price', x: 3, y: 75, w: 94, h: 22, fontSize: 11, textAlign: 'center', fontWeight: 'bold' }),
    ],
  }
}

/** ข้อมูลครบ — สำหรับสินค้าซับซ้อน ป้ายใหญ่ขึ้น */
function buildDetailFull(): LabelDesignerTemplate {
  return {
    version: 1,
    name: 'Detail Full (ข้อมูลครบ)',
    widthMm: 70,
    heightMm: 50,
    elements: [
      el({ kind: 'text', field: 'brand', x: 3, y: 2, w: 50, h: 8, fontSize: 6, textAlign: 'left', fontWeight: 'bold' }),
      el({ kind: 'text', field: 'storeName', x: 55, y: 2, w: 42, h: 8, fontSize: 5, textAlign: 'right', textVariant: 'badge' }),
      el({ kind: 'text', field: 'name', x: 3, y: 11, w: 94, h: 10, fontSize: 7, textAlign: 'left' }),
      el({ kind: 'text', field: 'oem', x: 3, y: 23, w: 60, h: 8, fontSize: 7, textAlign: 'left', fontWeight: 'semibold' }),
      el({ kind: 'text', field: 'factory', x: 65, y: 23, w: 32, h: 8, fontSize: 6, textAlign: 'right' }),
      el({ kind: 'text', field: 'carModel', x: 3, y: 32, w: 94, h: 7, fontSize: 6, textAlign: 'left' }),
      el({ kind: 'barcode', field: 'barcode', x: 3, y: 42, w: 60, h: 38 }),
      el({ kind: 'text', field: 'price', x: 65, y: 42, w: 32, h: 18, fontSize: 10, textAlign: 'right', fontWeight: 'bold' }),
      el({ kind: 'text', field: 'binLocation', x: 65, y: 62, w: 32, h: 10, fontSize: 7, textAlign: 'right' }),
      el({ kind: 'text', field: 'sku', x: 3, y: 82, w: 94, h: 12, fontSize: 7, textAlign: 'center' }),
    ],
  }
}

/** ป้ายชั้นวาง / Bin label — สำหรับติดบนชั้นเก็บของ ไม่ใช่บนสินค้า */
function buildShelfBin(): LabelDesignerTemplate {
  return {
    version: 1,
    name: 'Shelf Bin (ป้ายชั้นวาง)',
    widthMm: 50,
    heightMm: 25,
    elements: [
      el({ kind: 'text', field: 'binLocation', x: 3, y: 8, w: 94, h: 35, fontSize: 18, textAlign: 'center', fontWeight: 'bold' }),
      el({ kind: 'text', field: 'name', x: 3, y: 50, w: 94, h: 18, fontSize: 7, textAlign: 'center' }),
      el({ kind: 'text', field: 'sku', x: 3, y: 72, w: 94, h: 22, fontSize: 9, textAlign: 'center', fontWeight: 'semibold' }),
    ],
  }
}

/** ID-only — เฉพาะ SKU + barcode สำหรับ internal warehouse */
function buildIdOnly(): LabelDesignerTemplate {
  return {
    version: 1,
    name: 'ID Only (สแกนภายใน)',
    widthMm: 40,
    heightMm: 20,
    elements: [
      el({ kind: 'barcode', field: 'barcode', x: 3, y: 8, w: 94, h: 60 }),
      el({ kind: 'text', field: 'sku', x: 3, y: 72, w: 65, h: 25, fontSize: 9, textAlign: 'left', fontWeight: 'bold' }),
      el({ kind: 'text', field: 'binLocation', x: 70, y: 72, w: 27, h: 25, fontSize: 8, textAlign: 'right' }),
    ],
  }
}

export const QUICK_START_TEMPLATES: QuickStartTemplate[] = [
  {
    id: 'auto-parts-oem',
    name: 'Auto Parts',
    description: 'เน้น OEM + barcode — ร้านอะไหล่',
    emoji: '🔧',
    build: buildAutoPartsOemFocus,
  },
  {
    id: 'price-tag',
    name: 'Price Tag',
    description: 'ราคาตัวใหญ่เด่น — ขายปลีก',
    emoji: '💰',
    build: buildPriceTag,
  },
  {
    id: 'mini-barcode',
    name: 'Mini Sticker',
    description: 'บาร์โค้ดเต็มพื้นที่ — สินค้าเล็ก',
    emoji: '🏷️',
    build: buildMiniBarcode,
  },
  {
    id: 'detail-full',
    name: 'Detail Full',
    description: 'ข้อมูลครบ 70×50mm — สินค้าซับซ้อน',
    emoji: '📋',
    build: buildDetailFull,
  },
  {
    id: 'shelf-bin',
    name: 'Shelf Bin',
    description: 'ป้ายชั้นวาง — Bin code ตัวใหญ่',
    emoji: '📦',
    build: buildShelfBin,
  },
  {
    id: 'id-only',
    name: 'ID Only',
    description: 'SKU + barcode เท่านั้น — internal',
    emoji: '🆔',
    build: buildIdOnly,
  },
]
