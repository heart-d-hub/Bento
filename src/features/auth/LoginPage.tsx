import {
  getStoredBranch,
  isLoggedIn,
  setLoggedIn,
  setStaffRole,
  setStaffUsername,
  setStoredBranch,
} from '@/features/auth/authSession'
import { hydrateStaffUsersFromDb, loadStaffUsers } from '@/features/settings/data/staffUsersStore'
import { clsx } from 'clsx'
import { Lock, User } from 'lucide-react'
import { type FormEvent, useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const inputShell =
  'flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-300/80'

export function LoginPage() {
  const navigate = useNavigate()
  const formId = useId()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn()) return
    if (getStoredBranch()) {
      navigate('/', { replace: true })
    } else {
      navigate('/branch', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !password.trim()) return
    await hydrateStaffUsersFromDb()
    const u = username.trim()
    const p = password.trim()
    const staff = loadStaffUsers().find((s) => s.username.toLowerCase() === u.toLowerCase()) ?? null
    if (!staff) {
      setError('ไม่พบผู้ใช้นี้ในระบบ')
      return
    }
    if (staff.status !== 'active') {
      setError('บัญชีนี้ถูกระงับการใช้งาน')
      return
    }
    if (staff.password.trim() !== p) {
      setError('รหัสผ่านไม่ถูกต้อง')
      return
    }
    setStaffUsername(u)
    setStaffRole(staff.isAdmin || staff.role === 'MANAGER' ? 'admin' : 'staff')
    setLoggedIn(true)
    setStoredBranch(null)
    navigate('/branch')
  }


  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-100 px-4 py-10">
      <div
        className={clsx(
          'relative z-10 w-full max-w-[22rem] rounded-3xl border border-slate-200 bg-white p-8 shadow-lg',
        )}
      >
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">เข้าสู่ระบบ</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor={`${formId}-user`} className="mb-1.5 block text-xs font-medium text-slate-600">
              Username
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                strokeWidth={1.75}
                aria-hidden
              />
              <input
                id={`${formId}-user`}
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ชื่อผู้ใช้"
                className={clsx(inputShell, 'pl-10')}
              />
            </div>
          </div>

          <div>
            <label htmlFor={`${formId}-pass`} className="mb-1.5 block text-xs font-medium text-slate-600">
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                strokeWidth={1.75}
                aria-hidden
              />
              <input
                id={`${formId}-pass`}
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่าน"
                className={clsx(inputShell, 'pl-10')}
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-center text-[11px] text-rose-800">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-slate-800 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 active:scale-[0.99]"
          >
            เข้าสู่ระบบ
          </button>


        </form>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-500">
          ผู้ใช้ทดสอบ: <span className="font-mono">ANG</span> / <span className="font-mono">EVE</span> /{' '}
          <span className="font-mono">STOCK</span> — รหัส <span className="font-mono">bento123</span> |{' '}
          <span className="font-mono">herb</span> — รหัส <span className="font-mono">1234</span>
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] text-slate-500">
          <button type="button" className="hover:text-slate-800 hover:underline">
            ลืมรหัสผ่าน
          </button>
          <span className="text-slate-300" aria-hidden>
            |
          </span>
          <button type="button" className="hover:text-slate-800 hover:underline">
            ช่วยเหลือ
          </button>
        </div>
      </div>

      <p className="relative z-10 mt-6 text-[10px] text-slate-400">Bento — ล็อกอินในเครื่อง</p>
    </div>
  )
}
