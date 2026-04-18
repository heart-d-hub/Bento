import { DesktopOnlyGate } from '@/app/DesktopOnlyGate'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { BranchSelectPage } from '@/features/auth/BranchSelectPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { MainPage } from '@/features/main/MainPage'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

export function App() {
  return (
    <ErrorBoundary>
      <DesktopOnlyGate>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/branch" element={<BranchSelectPage />} />
            <Route path="/" element={<MainPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DesktopOnlyGate>
    </ErrorBoundary>
  )
}
