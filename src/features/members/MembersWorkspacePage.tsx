import { MemberFormModal, type MemberFormValues } from '@/features/members/components/MemberFormModal'
import { MEMBER_PRICE_TIER_LABELS } from '@/features/members/data/memberTypes'
import {
  MEMBER_STATUS_LABELS,
  MEMBER_TYPE_LABELS,
  type Member,
  type MemberStatus,
  type MemberType,
} from '@/features/members/data/mockMembers'
import { deleteMemberAsync, loadMembers, loadMembersAsync, saveMembers, upsertMemberAsync } from '@/features/members/data/membersStore'
import { formatPhone, phoneMatchesQuery } from '@/features/members/data/phoneUtils'
import { B2B_TIER_COLORS, B2B_TIER_ORDER, loadCustomerTiers, type B2bTier } from '@/features/settings/data/customerTiersStore'
import {
  loadMemberSalesSummaryAsync,
  loadPosSalesHistoryByMemberAsync,
  salesLinkMemberByBillAsync,
  type MemberSalesSummary,
  type PosSalesHistoryRow,
} from '@/features/pos/data/posSalesDb'
import { clsx } from 'clsx'
import { ChevronDown, ChevronRight, Link, Plus, Search, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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

const TIER_ICONS: Record<B2bTier, string> = { silver: '🥈', gold: '🥇', platinum: '💎' }

function tierBadge(tier: B2bTier) {
  const cfg = loadCustomerTiers().b2bTiers.find((t) => t.tier === tier)
  const colors = B2B_TIER_COLORS[tier]
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', colors.badge)}>
      {TIER_ICONS[tier]}{cfg?.label ?? tier}
    </span>
  )
}

function statusBadge(status: MemberStatus) {
  const map: Record<MemberStatus, string> = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    inactive: 'border-slate-200 bg-slate-100 text-slate-600',
    blacklist: 'border-rose-200 bg-rose-50 text-rose-800',
  }
  return (
    <span className={clsx('inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium', map[status])}>
      {MEMBER_STATUS_LABELS[status]}
    </span>
  )
}

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
  } catch {
    return iso
  }
}

const PAGE_SIZE = 10

export function MembersWorkspacePage({ className }: MembersWorkspacePageProps) {
  const [members, setMembers] = useState<Member[]>(() => loadMembers())
  const [q, setQ] = useState('')
  const [filterStatus, setFilterStatus] = useState<MemberStatus | 'all'>('all')
  const [filterType, setFilterType] = useState<MemberType | 'all'>('all')
  const [filterTier, setFilterTier] = useState<B2bTier | 'all' | 'b2c'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<Member | null>(null)

  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberSummary, setMemberSummary] = useState<MemberSalesSummary | null>(null)
  const [memberHistory, setMemberHistory] = useState<PosSalesHistoryRow[]>([])
  const [historyOffset, setHistoryOffset] = useState(0)
  const [historyHasMore, setHistoryHasMore] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [expandedBills, setExpandedBills] = useState<Set<string>>(new Set())
  const [linkBillNo, setLinkBillNo] = useState('')
  const [linkBusy, setLinkBusy] = useState(false)

  useEffect(() => {
    let alive = true
    void loadMembersAsync().then((rows) => {
      if (alive) setMembers(rows)
    })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!selectedMember) {
      setMemberSummary(null)
      setMemberHistory([])
      setHistoryOffset(0)
      setHistoryHasMore(false)
      setExpandedBills(new Set())
      return
    }
    setMemberSummary(null)
    setMemberHistory([])
    setHistoryOffset(0)
    setHistoryHasMore(false)
    setExpandedBills(new Set())
    setHistoryLoading(true)

    const code = selectedMember.memberCode
    void Promise.all([
      loadMemberSalesSummaryAsync(code),
      loadPosSalesHistoryByMemberAsync(code, PAGE_SIZE + 1, 0),
    ]).then(([summary, rows]) => {
      setMemberSummary(summary)
      const hasMore = rows.length > PAGE_SIZE
      setMemberHistory(rows.slice(0, PAGE_SIZE))
      setHistoryHasMore(hasMore)
      setHistoryOffset(PAGE_SIZE)
      setHistoryLoading(false)
    }).catch(() => { setHistoryLoading(false) })
  }, [selectedMember?.memberCode])

  const loadMore = () => {
    if (!selectedMember || historyLoading) return
    setHistoryLoading(true)
    const code = selectedMember.memberCode
    void loadPosSalesHistoryByMemberAsync(code, PAGE_SIZE + 1, historyOffset).then((rows) => {
      const hasMore = rows.length > PAGE_SIZE
      setMemberHistory((prev) => [...prev, ...rows.slice(0, PAGE_SIZE)])
      setHistoryHasMore(hasMore)
      setHistoryOffset((o) => o + PAGE_SIZE)
      setHistoryLoading(false)
    }).catch(() => { setHistoryLoading(false) })
  }

  const toggleBill = (id: string) => {
    setExpandedBills((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return members.filter((m) => {
      if (filterStatus !== 'all' && m.status !== filterStatus) return false
      if (filterType !== 'all' && m.memberType !== filterType) return false
      if (filterTier === 'b2c' && m.customerType !== 'b2c') return false
      if (filterTier !== 'all' && filterTier !== 'b2c' && m.b2bTier !== filterTier) return false
      if (!term) return true
      return (
        m.fullName.toLowerCase().includes(term) ||
        phoneMatchesQuery(m.phone, term) ||
        m.memberCode.toLowerCase().includes(term) ||
        (m.email && m.email.toLowerCase().includes(term)) ||
        m.taxId.toLowerCase().includes(term) ||
        m.contactPerson.toLowerCase().includes(term) ||
        m.address.toLowerCase().includes(term)
      )
    })
  }, [members, q, filterStatus, filterType, filterTier])

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
      const next = [row, ...members]
      setMembers(next)
      saveMembers(next)
      void upsertMemberAsync(row).catch((error) => {
        console.error('[members] create persist failed', error)
        window.alert('บันทึกสมาชิกลงฐานข้อมูลไม่สำเร็จ กรุณาเปิด DevTools ดู error log')
      })
    } else if (editing) {
      const next = members.map((m) =>
        m.id === editing.id
          ? { ...m, ...values, memberCode: values.memberCode.trim(), fullName: values.fullName.trim(), notes: values.notes.trim() }
          : m,
      )
      setMembers(next)
      saveMembers(next)
      const updated = next.find((m) => m.id === editing.id)
      if (!updated) return
      void upsertMemberAsync(updated).catch((error) => {
        console.error('[members] edit persist failed', error)
        window.alert('บันทึกการแก้ไขสมาชิกลงฐานข้อมูลไม่สำเร็จ กรุณาเปิด DevTools ดู error log')
      })
    }
  }

  const handleDelete = (row: Member) => {
    if (!window.confirm(`ลบสมาชิก ${row.memberCode} - ${row.fullName} ?`)) return
    const prev = members
    const next = prev.filter((m) => m.id !== row.id)
    setMembers(next)
    saveMembers(next)
    if (selectedMember?.id === row.id) setSelectedMember(null)
    void deleteMemberAsync(row.id).catch((error) => {
      console.error('[members] delete persist failed', error)
      setMembers(prev)
      saveMembers(prev)
      window.alert('ลบสมาชิกจากฐานข้อมูลไม่สำเร็จ กรุณาเปิด DevTools ดู error log')
    })
  }

  return (
    <div
      className={clsx(
        'flex min-h-[min(85vh,56rem)] flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      {/* Left: member list */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50/80 to-white px-3 py-2 sm:px-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-violet-200 bg-violet-100 text-violet-700">
                <Users className="size-4" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <h1 className="text-base font-semibold leading-tight text-slate-900">สมาชิก</h1>
                <p className="text-[11px] leading-snug text-slate-600">ติดต่อ · เครดิต · ราคา — ชื่อบังคับ</p>
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
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
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
                <option key={k} value={k}>{MEMBER_STATUS_LABELS[k]}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as MemberType | 'all')}
              className="min-h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm"
            >
              <option value="all">ประเภททั้งหมด</option>
              {(Object.keys(MEMBER_TYPE_LABELS) as MemberType[]).map((k) => (
                <option key={k} value={k}>{MEMBER_TYPE_LABELS[k]}</option>
              ))}
            </select>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value as B2bTier | 'all' | 'b2c')}
              className="min-h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm"
            >
              <option value="all">Tier ทั้งหมด</option>
              <option value="b2c">B2C</option>
              {B2B_TIER_ORDER.map((t) => {
                const cfg = loadCustomerTiers().b2bTiers.find((c) => c.tier === t)
                return <option key={t} value={t}>B2B · {cfg?.label ?? t}</option>
              })}
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
                <th className="whitespace-nowrap px-2 py-1.5">Tier</th>
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
                  <td colSpan={12} className="px-4 py-12 text-center text-slate-500">
                    ไม่พบสมาชิกตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMember((prev) => (prev?.id === m.id ? null : m))}
                    className={clsx(
                      'cursor-pointer border-b border-slate-100 transition',
                      selectedMember?.id === m.id
                        ? 'bg-violet-50 ring-1 ring-inset ring-violet-200'
                        : 'hover:bg-violet-50/30',
                    )}
                  >
                    <td className="whitespace-nowrap px-2 py-1.5 font-mono text-[10px] text-slate-700">{m.memberCode}</td>
                    <td className="max-w-[10rem] truncate px-2 py-1.5 font-medium text-slate-900">{m.fullName}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-slate-700">{formatPhone(m.phone)}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-slate-600">{MEMBER_TYPE_LABELS[m.memberType]}</td>
                    <td className="whitespace-nowrap px-2 py-1.5">
                      {m.customerType === 'b2b' && m.b2bTier
                        ? tierBadge(m.b2bTier)
                        : <span className="text-[10px] text-slate-400">B2C</span>}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-slate-800">
                      {m.pointsBalance.toLocaleString('th-TH')}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-slate-800">
                      {m.arBalance > 0 ? <span className="text-amber-800">฿{m.arBalance.toLocaleString('th-TH')}</span> : '—'}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-slate-700">
                      {m.creditLimitBaht > 0 ? <span>฿{m.creditLimitBaht.toLocaleString('th-TH')}</span> : '—'}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-center text-slate-700">
                      {m.payAtMonthEnd ? (
                        <span>สิ้นเดือน</span>
                      ) : m.creditTermDays > 0 && m.creditTermMonths > 0 ? (
                        <span>{m.creditTermDays} วัน · {m.creditTermMonths} ด.</span>
                      ) : m.creditTermDays > 0 ? (
                        <span>{m.creditTermDays} วัน</span>
                      ) : m.creditTermMonths > 0 ? (
                        <span>{m.creditTermMonths} เดือน</span>
                      ) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-slate-600">
                      {MEMBER_PRICE_TIER_LABELS[m.defaultPriceTier]}
                      {m.markupPercent !== 0 ? <span className="text-slate-400"> +{m.markupPercent}%</span> : null}
                    </td>
                    <td className="px-2 py-1.5">{statusBadge(m.status)}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(m)}
                          className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-violet-700 hover:bg-violet-50"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(m)}
                          className="rounded border border-rose-200 bg-white px-2 py-0.5 text-[10px] font-medium text-rose-700 hover:bg-rose-50"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: member detail panel */}
      {selectedMember && (
        <div className="flex w-72 shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{selectedMember.fullName}</p>
              <p className="font-mono text-[10px] text-slate-500">{selectedMember.memberCode}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMember(null)}
              className="ml-2 shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Stats row */}
          {memberSummary && (
            <div className="grid grid-cols-2 gap-px border-b border-slate-200 bg-slate-200">
              <div className="bg-white px-3 py-2">
                <p className="text-[10px] text-slate-500">ยอดซื้อรวม</p>
                <p className="text-sm font-bold tabular-nums text-violet-700">฿{fmt(memberSummary.totalSpent)}</p>
              </div>
              <div className="bg-white px-3 py-2">
                <p className="text-[10px] text-slate-500">จำนวนครั้ง</p>
                <p className="text-sm font-bold tabular-nums text-slate-800">{memberSummary.visitCount.toLocaleString('th-TH')} ครั้ง</p>
              </div>
              <div className="bg-white px-3 py-2">
                <p className="text-[10px] text-slate-500">เฉลี่ย/บิล</p>
                <p className="text-sm font-bold tabular-nums text-slate-800">฿{fmt(memberSummary.avgBill)}</p>
              </div>
              <div className="bg-white px-3 py-2">
                <p className="text-[10px] text-slate-500">ซื้อล่าสุด</p>
                <p className="text-sm font-bold text-slate-800">
                  {memberSummary.lastVisitAt ? fmtDate(memberSummary.lastVisitAt) : '—'}
                </p>
              </div>
            </div>
          )}

          {/* History list */}
          <div className="min-h-0 flex-1 overflow-auto">
            <p className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              ประวัติการซื้อ
            </p>

            {historyLoading && memberHistory.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-slate-400">กำลังโหลด…</p>
            )}

            {!historyLoading && memberHistory.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-slate-400">ยังไม่มีประวัติการซื้อ</p>
            )}

            <ul className="divide-y divide-slate-100">
              {memberHistory.map((bill) => {
                const expanded = expandedBills.has(bill.id)
                return (
                  <li key={bill.id}>
                    <button
                      type="button"
                      onClick={() => toggleBill(bill.id)}
                      className="flex w-full items-start gap-1.5 px-3 py-2 text-left hover:bg-slate-100"
                    >
                      {expanded
                        ? <ChevronDown className="mt-0.5 size-3 shrink-0 text-slate-400" />
                        : <ChevronRight className="mt-0.5 size-3 shrink-0 text-slate-400" />
                      }
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="font-mono text-[10px] text-slate-600">{bill.billNo}</span>
                          <span className="tabular-nums text-xs font-semibold text-slate-800">฿{fmt(bill.total)}</span>
                        </div>
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="text-[10px] text-slate-400">{fmtDate(bill.at)}</span>
                          <span className="text-[10px] text-slate-400">{bill.lineCount} รายการ</span>
                        </div>
                      </div>
                    </button>
                    {expanded && bill.lines.length > 0 && (
                      <ul className="bg-white pb-1 pl-6 pr-3 pt-0.5">
                        {bill.lines.map((line, i) => (
                          <li key={i} className="flex items-baseline justify-between gap-1 py-0.5 text-[10px]">
                            <span className="min-w-0 truncate text-slate-700">{line.name}</span>
                            <span className="shrink-0 tabular-nums text-slate-500">×{line.qty}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>

            {historyHasMore && (
              <div className="px-3 py-2">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={historyLoading}
                  className="w-full rounded border border-slate-200 bg-white py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                >
                  {historyLoading ? 'กำลังโหลด…' : 'โหลดเพิ่ม'}
                </button>
              </div>
            )}

            {/* Backfill: link an orphaned bill to this member */}
            <div className="border-t border-slate-200 px-3 py-2">
              <p className="mb-1 text-[10px] font-medium text-slate-500">เชื่อมบิลเก่า</p>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={linkBillNo}
                  onChange={(e) => setLinkBillNo(e.target.value)}
                  placeholder="เลขที่บิล"
                  className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 outline-none focus:border-violet-400"
                />
                <button
                  type="button"
                  disabled={linkBusy || !linkBillNo.trim()}
                  onClick={async () => {
                    if (!selectedMember || !linkBillNo.trim()) return
                    setLinkBusy(true)
                    try {
                      await salesLinkMemberByBillAsync(linkBillNo.trim(), selectedMember.memberCode)
                      setLinkBillNo('')
                      // Reload history + summary
                      const [summary, rows] = await Promise.all([
                        loadMemberSalesSummaryAsync(selectedMember.memberCode),
                        loadPosSalesHistoryByMemberAsync(selectedMember.memberCode, PAGE_SIZE + 1, 0),
                      ])
                      setMemberSummary(summary)
                      const hasMore = rows.length > PAGE_SIZE
                      setMemberHistory(rows.slice(0, PAGE_SIZE))
                      setHistoryHasMore(hasMore)
                      setHistoryOffset(PAGE_SIZE)
                    } catch (err) {
                      window.alert(`เชื่อมบิลไม่สำเร็จ\n${err instanceof Error ? err.message : String(err)}`)
                    } finally {
                      setLinkBusy(false)
                    }
                  }}
                  className="shrink-0 rounded border border-violet-300 bg-violet-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  <Link className="size-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
