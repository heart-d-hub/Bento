export type SupplierSeed = {
  id: string
  supplierCode: string
  name: string
  taxId?: string
  phone?: string
  contactName?: string
  lineId?: string
  brandsSold?: string[]
  defaultShipping?: string
  /** จำนวนสินค้าประจำที่ผูกกับซัพพลาย (แสดงในแถว) */
  regularProductCount?: number
}

export const MOCK_SUPPLIERS: SupplierSeed[] = [
  {
    id: 'sup-toyota-tsb',
    supplierCode: 'S001',
    name: 'บจก. โตโยต้า มอเตอร์ ประเทศไทย',
    taxId: '0105551234567',
    phone: '02-305-2000',
    contactName: 'ฝ่ายขาย',
    lineId: '@toyotath',
    brandsSold: ['Toyota', 'Lexus', 'Denso'],
    defaultShipping: 'NIM Express',
    regularProductCount: 1,
  },
  {
    id: 'sup-bkk-parts',
    supplierCode: 'S002',
    name: 'เจริญยนต์พาร์ท',
    taxId: '',
    phone: '02-222-1111',
    contactName: 'เฮียตี๋',
    lineId: 'jaroen_parts',
    brandsSold: ['Brembo', 'BOSCH', 'TRW', 'Bendix'],
    defaultShipping: 'PL ขนส่ง',
    regularProductCount: 3,
  },
  {
    id: 'sup-isuzu-pc',
    supplierCode: 'S003',
    name: 'Bosch (Thailand)',
    taxId: '0105533111222',
    phone: '02-012-3456',
    contactName: 'คุณ A',
    lineId: '@bosch_th',
    brandsSold: ['BOSCH'],
    defaultShipping: 'Kerry Express',
    regularProductCount: 1,
  },
]
