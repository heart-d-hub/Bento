export type SupplierOption = {
  id: string
  name: string
  taxId?: string
  phone?: string
}

export const MOCK_SUPPLIERS: SupplierOption[] = [
  { id: 'sup-toyota-tsb', name: 'บริษัท โตโยต้า ซัพพลาย เซ็นเตอร์ จำกัด', taxId: '0105551234567', phone: '02-xxx-xxxx' },
  { id: 'sup-bkk-parts', name: 'ร้านค้าส่ง กรุงเทพพาร์ท', taxId: '', phone: '081-xxx-xxxx' },
  { id: 'sup-isuzu-pc', name: 'อีซูซุพาร์ทเซ็นเตอร์ (สำนักงานใหญ่)', taxId: '0105533111222', phone: '02-yyy-yyyy' },
]
