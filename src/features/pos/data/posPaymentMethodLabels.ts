import type { PaymentMethodId } from '@/features/pos/data/placeholders'
import { PAYMENT_METHODS } from '@/features/pos/data/placeholders'

export function getPaymentMethodLabel(id: PaymentMethodId | string): string {
  const map: Record<string, string> = {
    cash: 'เงินสด',
    qr: 'QR Code',
    credit: 'เครดิต',
    bill: 'ลงบิล',
    transfer: 'โอน/QR',
    account: 'ลงบัญชี',
    mixed: 'ผสม',
  }
  return map[id] ?? PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id
}
