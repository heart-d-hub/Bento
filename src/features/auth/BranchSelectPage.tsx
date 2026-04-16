import { BRANCHES, type BranchInfo } from '@/features/auth/branches'
import { getStoredBranch, isLoggedIn, setStoredBranch } from '@/features/auth/authSession'
import { clsx } from 'clsx'
import { Building2, ChevronRight } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function BranchSelectPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login', { replace: true })
      return
    }
    const b = getStoredBranch()
    if (b) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const pick = (branch: BranchInfo) => {
    setStoredBranch(branch)
    navigate('/', { replace: true })
  }

  if (!isLoggedIn()) {
    return null
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-100 px-4 py-10">
      <div
        className={clsx(
          'relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg',
        )}
      >
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">เลือกสาขา</h1>
          <p className="mt-1 text-sm text-slate-600">เลือกสาขาที่ต้องการทำงาน</p>
        </div>

        <ul className="space-y-3" role="list">
          {BRANCHES.map((branch) => (
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
      </div>

      <p className="relative z-10 mt-8 text-[10px] text-slate-400">mock — สาขาจะถูกบันทึกในเครื่อง</p>
    </div>
  )
}
