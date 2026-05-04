import { ErrorBoundary } from '@/app/ErrorBoundary'
import { BranchSelectPage } from '@/features/auth/BranchSelectPage'
import { CompanySelectPage } from '@/features/auth/CompanySelectPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { CustomerFacingDisplay } from '@/features/cfd/CustomerFacingDisplay'
import { MainPage } from '@/features/main/MainPage'
import { getProductMasterList, saveProductMasterList, seedDemoOilProducts } from '@/features/inventory/data/productMasterData'
import { migrateAllFitmentEngineText } from '@/features/inventory/utils/cleanVehicleFitmentEngineText'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

// Defer boot-time product-master migrations off the critical path so login/branch
// screens render instantly. The product-master list is megabytes after Sakura/Brembo
// imports — parsing + migrating it synchronously at module load was blocking first paint.
// Idempotent: safe to run after UI mount.
function scheduleIdle(fn: () => void): void {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  }
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(fn, { timeout: 2000 })
  } else {
    window.setTimeout(fn, 0)
  }
}

scheduleIdle(() => {
  try {
    seedDemoOilProducts()
  } catch (e) {
    console.warn('[boot] seedDemoOilProducts failed', e)
  }
  try {
    const products = getProductMasterList()
    const result = migrateAllFitmentEngineText(products)
    if (result.changedFitmentCount > 0) {
      saveProductMasterList(result.cleaned, { notify: true })
      console.info(
        `[migration] Cleaned ${result.changedFitmentCount} dirty engineText in ${result.changedProductCount} products. Samples:`,
        result.samples,
      )
    }
  } catch (e) {
    console.warn('[migration] fitment engineText cleanup failed', e)
  }
})

const isCfd = new URLSearchParams(window.location.search).get('cfd') === '1'

export function App() {
  if (isCfd) {
    return (
      <ErrorBoundary>
        <CustomerFacingDisplay />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/company" element={<CompanySelectPage />} />
          <Route path="/branch" element={<BranchSelectPage />} />
          <Route path="/" element={<MainPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
