import { ErrorBoundary } from '@/app/ErrorBoundary'
import { BranchSelectPage } from '@/features/auth/BranchSelectPage'
import { CompanySelectPage } from '@/features/auth/CompanySelectPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { CustomerFacingDisplay } from '@/features/cfd/CustomerFacingDisplay'
import { MainPage } from '@/features/main/MainPage'
import { seedDemoOilProducts } from '@/features/inventory/data/productMasterData'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

seedDemoOilProducts()

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
