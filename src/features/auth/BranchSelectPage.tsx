import { getStoredCompany, isLoggedIn, setStoredBranch } from '@/features/auth/authSession'
import { loadBranchesByCompany, type DynamicBranch } from '@/features/auth/branchesStore'
import { loadCompanyConfig } from '@/features/auth/companiesStore'
import type { BranchInfo } from '@/features/auth/branches'
import { clsx } from 'clsx'
import { Building2, ChevronRight } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function BranchSelectPage() {
  const navigate = useNavigate()
  const company = getStoredCompany()
  const companyCfg = company ? loadCompanyConfig(company.id) : null
  const branches = company ? loadBranchesByCompany(company.id).filter((b) => b.isActive) : []

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login', { replace: true })
      return
    }
    if (!company) {
      navigate('/company', { replace: true })
    }
  }, [navigate, company])

  if (!isLoggedIn() || !company) return null

  function pick(branch: DynamicBranch) {
    setStoredBranch(branch as unknown as BranchInfo)
    navigate('/', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-100 px-4 py-10">
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-2 text-center">
          <p className="text-xs font-semibold text-indigo-600">{companyCfg?.name ?? company.name}</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">เลือกสาขา</h1>
          <p className="mt-1 text-sm text-slate-500">เลือกสาขาที่ต้องการทำงาน</p>
        </div>

        <ul className="mt-6 space-y-3" role="list">
          {branches.map((branch) => (
            <li key={branch.id}>
              <button
                type="button"
                onClick={() => pick(branch)}
                className={clsx(
                  'flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition',
                  'hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]',
                )}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                  <Building2 className="size-6" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-slate-900">{branch.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">เข้าสู่ระบบหลังบ้านของสาขานี้</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-slate-400" aria-hidden />
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => navigate('/company', { replace: true })}
          className="mt-6 w-full text-center text-xs text-slate-400 hover:text-slate-700 hover:underline"
        >
          ← กลับเลือกกิจการ
        </button>
      </div>

      <p className="relative z-10 mt-8 text-[10px] text-slate-400">สาขาจะถูกบันทึกในเครื่อง</p>
    </div>
  )
}
