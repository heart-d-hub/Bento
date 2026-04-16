import type { ProductMasterDetail } from '@/features/inventory/data/productMasterData'
import type { VehicleCatalogState } from '@/features/vehicle/data/types'

export type HubPullOk = {
  ok: true
  revision: number
  updatedAt: string | null
  updatedByBranch: string | null
  productMaster: ProductMasterDetail[]
  vehicleCatalog: VehicleCatalogState | null
}

export type HubPushOk = {
  ok: true
  revision: number
  updatedAt: string
  updatedByBranch: string
}

export type HubConflict = {
  ok: false
  status: 409
  serverRevision: number
  updatedAt: string | null
  updatedByBranch: string | null
  productMaster: ProductMasterDetail[]
  vehicleCatalog: VehicleCatalogState | null
}
