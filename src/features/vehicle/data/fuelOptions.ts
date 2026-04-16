import type { VehicleFuelType } from '@/features/vehicle/data/types'

export const FUEL_OPTIONS: { value: VehicleFuelType; label: string }[] = [
  { value: 'unspecified', label: 'ไม่ระบุ' },
  { value: 'bensin', label: 'เบนซิน' },
  { value: 'diesel', label: 'ดีเซล' },
]

export function fuelTypeLabel(f: VehicleFuelType): string {
  return FUEL_OPTIONS.find((o) => o.value === f)?.label ?? f
}
