import { INITIAL_VEHICLE_CATALOG } from '@/features/vehicle/data/mockCatalog'
import { normalizeCatalog } from '@/features/vehicle/data/normalizeCatalog'
import {
  VEHICLE_CATALOG_STORAGE_KEY,
  VEHICLE_VISIBLE_CATEGORIES_STORAGE_KEY,
} from '@/features/vehicle/data/vehicleCatalogStorageKeys'
import type { VehicleCatalogState, VehicleCategoryDef } from '@/features/vehicle/data/types'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

function loadCatalog(): VehicleCatalogState {
  try {
    const raw = localStorage.getItem(VEHICLE_CATALOG_STORAGE_KEY)
    if (!raw) return INITIAL_VEHICLE_CATALOG
    const parsed = JSON.parse(raw) as VehicleCatalogState
    if (!parsed?.categories?.length || !parsed?.byCategory) return INITIAL_VEHICLE_CATALOG
    return normalizeCatalog(parsed)
  } catch {
    return INITIAL_VEHICLE_CATALOG
  }
}

function loadVisibleIds(categories: VehicleCategoryDef[]): Set<string> {
  try {
    const raw = localStorage.getItem(VEHICLE_VISIBLE_CATEGORIES_STORAGE_KEY)
    if (!raw) {
      return new Set(categories.map((c) => c.id))
    }
    const arr = JSON.parse(raw) as string[]
    if (!Array.isArray(arr)) return new Set(categories.map((c) => c.id))
    return new Set(arr.filter((id) => categories.some((c) => c.id === id)))
  } catch {
    return new Set(categories.map((c) => c.id))
  }
}

type VehicleCatalogContextValue = {
  catalog: VehicleCatalogState
  setCatalog: (next: VehicleCatalogState) => void
  visibleCategoryIds: Set<string>
  setVisibleCategoryIds: (ids: Set<string>) => void
  resetCatalogToInitial: () => void
}

const VehicleCatalogContext = createContext<VehicleCatalogContextValue | null>(null)

export function VehicleCatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalogState] = useState<VehicleCatalogState>(() => loadCatalog())
  const [visibleCategoryIds, setVisibleState] = useState<Set<string>>(() =>
    loadVisibleIds(loadCatalog().categories),
  )

  useEffect(() => {
    localStorage.setItem(VEHICLE_CATALOG_STORAGE_KEY, JSON.stringify(catalog))
  }, [catalog])

  useEffect(() => {
    localStorage.setItem(VEHICLE_VISIBLE_CATEGORIES_STORAGE_KEY, JSON.stringify([...visibleCategoryIds]))
  }, [visibleCategoryIds])

  const setCatalog = useCallback((next: VehicleCatalogState) => {
    setCatalogState(next)
  }, [])

  const setVisibleCategoryIds = useCallback((ids: Set<string>) => {
    setVisibleState(ids)
  }, [])

  const resetCatalogToInitial = useCallback(() => {
    setCatalogState(INITIAL_VEHICLE_CATALOG)
    localStorage.removeItem(VEHICLE_CATALOG_STORAGE_KEY)
  }, [])

  /** sync จาก hub — อัปเดต state เมื่อมี event จากภายนอก */
  useEffect(() => {
    const onExternal = (e: Event) => {
      const ce = e as CustomEvent<VehicleCatalogState>
      if (ce.detail && typeof ce.detail === 'object') {
        const next = normalizeCatalog(ce.detail)
        setCatalogState(next)
        setVisibleState(new Set(next.categories.map((c) => c.id)))
      }
    }
    window.addEventListener('bento-vehicle-catalog-external-update', onExternal)
    return () => window.removeEventListener('bento-vehicle-catalog-external-update', onExternal)
  }, [])

  const value = useMemo(
    () => ({
      catalog,
      setCatalog,
      visibleCategoryIds,
      setVisibleCategoryIds,
      resetCatalogToInitial,
    }),
    [catalog, setCatalog, visibleCategoryIds, setVisibleCategoryIds, resetCatalogToInitial],
  )

  return <VehicleCatalogContext.Provider value={value}>{children}</VehicleCatalogContext.Provider>
}

export function useVehicleCatalog() {
  const ctx = useContext(VehicleCatalogContext)
  if (!ctx) {
    throw new Error('useVehicleCatalog must be used within VehicleCatalogProvider')
  }
  return ctx
}
