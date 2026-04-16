import type { PaymentMethodId } from '@/features/pos/data/placeholders'
import { PAYMENT_METHODS } from '@/features/pos/data/placeholders'

export function getPaymentMethodLabel(id: PaymentMethodId): string {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id
}
