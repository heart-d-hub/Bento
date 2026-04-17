import { MemberFormModal, type MemberFormValues } from '@/features/members/components/MemberFormModal'
import { MEMBER_PRICE_TIER_LABELS } from '@/features/members/data/memberTypes'
import {
  MEMBER_STATUS_LABELS,
  MEMBER_TYPE_LABELS,
  type Member,
  type MemberStatus,
  type MemberType,
} from '@/features/members/data/mockMembers'
import { loadMembers, saveMembers } from '@/features/members/data/membersStore'
import { clsx } from 'clsx'
import { Plus, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

type MembersWorkspacePageProps = {
  className?: string
}

function nextMemberCode(existing: Member[]): string {
  const nums = existing
    .map((m) => {
      const t = m.memberCode.replace(/^M-?/i, '')
      const n = parseInt(t, 10)
      return Number.isFinite(n) ? n : 0
    })
    .filter((n) => n > 0)
  const max = nums.length ? Math.max(...nums) : 10486
  return `M-${max + 1}`
}

function statusBadge(status: MemberStatus) {
  const map: Record<MemberStatus, string> = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    inactive: 'border-slate-200 bg-slate-100 text-slate-600',
    blacklist: 'border-rose-200 bg-rose-50 text-rose-800',
  }
  return (
    <span
      className={clsx(
        'inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
        map[status],
      )}
    >
      {MEMBER_STATUS_LABELS[status]}
    </span>
  )
}

export function MembersWorkspacePage({ className }: MembersWorkspacePageProps) {
  const [members, setMembers] = useState<Member[]>(() => loadMembers())
  const [q, setQ] = useState('')
  const [filterStatus, setFilterStatus] = useState<MemberStatus | 'all'>('all')
  const [filterType, setFilterType] = useState<MemberType | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<Member | null>(null)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return members.filter((m) => {
      if (filterStatus !== 'all' && m.status !== filterStatus) return false
      if (filterType !== 'all' && m.memberType !== filterType) return false
      if (!term) return true
      return (
        m.fullName.toLowerCase().includes(term) ||
        m.phone.replace(/\s/g, '').includes(term.replace(/\s/g, '')) ||
        m.memberCode.toLowerCase().includes(term) ||
        (m.email && m.email.toLowerCase().includes(term)) ||
        m.taxId.toLowerCase().includes(term) ||
        m.contactPerson.toLowerCase().includes(term) ||
        m.address.toLowerCase().includes(term)
      )
    })
  }, [members, q, filterStatus, filterType])

  const suggestedCode = useMemo(() => nextMemberCode(members), [members])

  const openCreate = () => {
    setEditing(null)
    setModalMode('create')
    setModalOpen(true)
  }

  const openEdit = (m: Member) => {
    setEditing(m)
    setModalMode('edit')
    setModalOpen(true)
  }

  const handleSubmit = (values: MemberFormValues) => {
    if (modalMode === 'create') {
      const row: Member = {
        id: `m-${Date.now()}`,
        ...values,
        memberCode: values.memberCode.trim() || suggestedCode,
        fullName: values.fullName.trim(),
        notes: values.notes.trim(),
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setMembers((prev) => {
        const next = [row, ...prev]
        saveMembers(next)
        return next
      })
    } else if (editing) {
      setMembers((prev) =>
        {
          const next = prev.map((m) =>
            m.id === editing.id
              ? {
                  ...m,
                  ...values,
                  memberCode: values.memberCode.trim(),
                  fullName: values.fullName.trim(),
                  notes: values.notes.trim(),
                }
              : m,
          )
          saveMembers(next)
          return next
        },
      )
    }
  }

  return (
    <div
      className={clsx(
        'flex min-h-[min(85vh,56rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50/80 to-white px-3 py-2 sm:px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-violet-200 bg-violet-100 text-violet-700">
              <Users className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h1 className="text-base font-semibold leading-tight text-slate-900">สมาชิก</h1>
              <p className="text-[11px] leading-snug text-slate-600">
                ติดต่อ · เครดิต · ราคา — ชื่อบังคับ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-violet-300 bg-violet-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-violet-700"
          >
            <Plus className="size-3.5" strokeWidth={2} aria-hidden />
            เพิ่มสมาชิก
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-b border-slate-100 px-3 py-2 sm:flex-row sm:items-center sm:px-4">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา ชื่อ, เบอร์, รหัส, อีเมล, ภาษี, ที่อยู่, ผู้ติดต่อ"
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 text-xs text-slate-900 shadow-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as MemberStatus | 'all')}
            className="min-h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm"
          >
            <option value="all">สถานะทั้งหมด</option>
            {(Object.keys(MEMBER_STATUS_LABELS) as MemberStatus[]).map((k) => (
              <option key={k} value={k}>
                {MEMBER_STATUS_LABELS[k]}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as MemberType | 'all')}
            className="min-h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm"
          >
            <option value="all">ประเภททั้งหมด</option>
            {(Object.keys(MEMBER_TYPE_LABELS) as MemberType[]).map((k) => (
              <option key={k} value={k}>
                {MEMBER_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[58rem] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50/95 backdrop-blur">
            <tr className="text-[10px] font-medium uppercase tracking-wide text-slate-600">
              <th className="whitespace-nowrap px-2 py-1.5">รหัส</th>
              <th className="min-w-[8rem] px-2 py-1.5">ชื่อ</th>
              <th className="whitespace-nowrap px-2 py-1.5">เบอร์</th>
              <th className="whitespace-nowrap px-2 py-1.5">ประเภท</th>
              <th className="whitespace-nowrap px-2 py-1.5 text-right">แต้ม</th>
              <th className="whitespace-nowrap px-2 py-1.5 text-right">ค้างชำระ</th>
              <th className="whitespace-nowrap px-2 py-1.5 text-right">วงเงิน</th>
              <th className="whitespace-nowrap px-2 py-1.5 text-center">เครดิต</th>
              <th className="whitespace-nowrap px-2 py-1.5">ระดับราคา</th>
              <th className="whitespace-nowrap px-2 py-1.5">สถานะ</th>
              <th className="whitespace-nowrap px-2 py-1.5 text-right">การทำงาน</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                  ไม่พบสมาชิกตามเงื่อนไข
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-violet-50/30">
                  <td className="whitespace-nowrap px-2 py-1.5 font-mono text-[10px] text-slate-700">
                    {m.memberCode}
                  </td>
                  <td className="max-w-[10rem] truncate px-2 py-1.5 font-medium text-slate-900">{m.fullName}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-700">{m.phone}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-600">
                    {MEMBER_TYPE_LABELS[m.memberType]}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-slate-800">
                    {m.pointsBalance.toLocaleString('th-TH')}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-slate-800">
                    {m.arBalance > 0 ? (
                      <span className="text-amber-800">฿{m.arBalance.toLocaleString('th-TH')}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-slate-700">
                    {m.creditLimitBaht > 0 ? (
                      <span>฿{m.creditLimitBaht.toLocaleString('th-TH')}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-center text-slate-700">
                    {m.payAtMonthEnd ? (
                      <span>สิ้นเดือน</span>
                    ) : m.creditTermDays > 0 && m.creditTermMonths > 0 ? (
                      <span>
                        {m.creditTermDays} วัน · {m.creditTermMonths} ด.
                      </span>
                    ) : m.creditTermDays > 0 ? (
                      <span>{m.creditTermDays} วัน</span>
                    ) : m.creditTermMonths > 0 ? (
                      <span>{m.creditTermMonths} เดือน</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-600">
                    {MEMBER_PRICE_TIER_LABELS[m.defaultPriceTier]}
                    {m.markupPercent !== 0 ? (
                      <span className="text-slate-400"> +{m.markupPercent}%</span>
                    ) : null}
                  </td>
                  <td className="px-2 py-1.5">{statusBadge(m.status)}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(m)}
                      className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-violet-700 hover:bg-violet-50"
                    >
                      แก้ไข
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <MemberFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editing}
        suggestedCode={suggestedCode}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
