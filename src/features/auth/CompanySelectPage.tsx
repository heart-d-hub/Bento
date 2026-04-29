import { isLoggedIn, setStoredCompany } from '@/features/auth/authSession'
import { COMPANIES, type CompanyInfo } from '@/features/auth/companies'
import { loadCompanyConfig } from '@/features/auth/companiesStore'
import { clsx } from 'clsx'
import { Building2, ChevronRight } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function CompanySelectPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  if (!isLoggedIn()) return null

  function pick(company: CompanyInfo) {
    setStoredCompany(company)
    navigate('/branch', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-100 px-4 py-10">
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">เลือกกิจการ</h1>
          <p className="mt-1 text-sm text-slate-500">เลือกกิจการที่ต้องการทำงาน</p>
        </div>

        <ul className="space-y-3" role="list">
          {COMPANIES.map((company) => {
            const cfg = loadCompanyConfig(company.id)
            return (
              <li key={company.id}>
                <button
                  type="button"
                  onClick={() => pick(company)}
                  className={clsx(
                    'flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition',
                    'hover:border-indigo-300 hover:bg-indigo-50/40 active:scale-[0.99]',
                  )}
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                    <Building2 className="size-6" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-slate-900">{cfg.name}</span>
                    {cfg.taxId ? (
                      <span className="mt-0.5 block font-mono text-xs text-slate-400">เลขภาษี {cfg.taxId}</span>
                    ) : (
                      <span className="mt-0.5 block text-xs text-slate-400">เลือกเพื่อเข้าสู่ระบบกิจการนี้</span>
                    )}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-slate-400" aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <p className="relative z-10 mt-8 text-[10px] text-slate-400">กิจการจะถูกบันทึกในเครื่อง</p>
    </div>
  )
}
