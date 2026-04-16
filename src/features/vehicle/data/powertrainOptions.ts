import type { VehiclePowertrainType } from '@/features/vehicle/data/types'

export const POWERTRAIN_OPTIONS: { value: VehiclePowertrainType; label: string }[] = [
  { value: 'ice', label: 'ICE' },
  { value: 'hev', label: 'Hybrid (HEV)' },
  { value: 'phev', label: 'Plug-in Hybrid (PHEV)' },
  { value: 'ev', label: 'EV' },
]

export function powertrainLabel(p: VehiclePowertrainType): string {
  return POWERTRAIN_OPTIONS.find((o) => o.value === p)?.label ?? p
}

export function powertrainShowsEngineFuel(pt: VehiclePowertrainType): boolean {
  return pt === 'ice' || pt === 'hev' || pt === 'phev'
}

export function powertrainShowsMotorBattery(pt: VehiclePowertrainType): boolean {
  return pt === 'hev' || pt === 'phev' || pt === 'ev'
}

export function powertrainRequiresEngineSizeName(pt: VehiclePowertrainType): boolean {
  return pt === 'ice' || pt === 'hev' || pt === 'phev'
}
