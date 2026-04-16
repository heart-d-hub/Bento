/** ข้อมูลร้านสำหรับ mock / ฟอร์มตั้งค่า (ยังไม่ผูก backend) */
export type StoreProfile = {
  storeName: string
  taxId: string
  address: string
  phone: string
  email: string
}

export const MOCK_STORE_PROFILE: StoreProfile = {
  storeName: 'บริษัท เบนโต้ออโต้พาร์ท จำกัด',
  taxId: '0-1055-12345-67-8',
  address: '123 ถนนพระราม 4 แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
  phone: '02-123-4567',
  email: 'contact@bento-auto.example',
}
