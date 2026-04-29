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
import { MOCK_MEMBERS } from '@/features/members/data/mockMembers'
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
import { ChevronDown, ChevronRight, ChevronUp, Link, Plus, Search, TrendingUp, Users, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useMemo, useRef, useState } from 'react'

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

const TIER_ICONS: Record<B2bTier, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' }

// Spending thresholds (total spent) required to qualify for the next tier
const TIER_THRESHOLDS: Partial<Record<B2bTier, number>> = {
  bronze: 30_000,
  silver: 150_000,
  gold: 500_000,
}
const TIER_NEXT: Partial<Record<B2bTier, B2bTier>> = {
  bronze: 'silver',
  silver: 'gold',
  gold: 'platinum',
}

type SortKey = 'memberCode' | 'fullName' | 'pointsBalance' | 'arBalance' | 'creditLimitBaht'

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
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [tierPopoverId, setTierPopoverId] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
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
  const [deleteConfirmMemberId, setDeleteConfirmMemberId] = useState<string | null>(null)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')

  // Close tier popover on outside click
  useEffect(() => {
    if (!tierPopoverId) return
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setTierPopoverId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [tierPopoverId])

  useEffect(() => {
    let alive = true
    const FLAG = 'bento.members.seeded.2026-04-29f'
    if (localStorage.getItem(FLAG) !== '1') {
      void loadMembersAsync().then(async (existing) => {
        for (const m of existing) {
          await deleteMemberAsync(m.id).catch(() => {})
        }
        for (const m of MOCK_MEMBERS) {
          await upsertMemberAsync(m).catch(() => {})
        }
        saveMembers([...MOCK_MEMBERS])
        localStorage.setItem(FLAG, '1')
        if (alive) setMembers([...MOCK_MEMBERS])
      })
    } else {
      void loadMembersAsync().then((rows) => {
        if (alive) setMembers(rows)
      })
    }
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

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return null
    return sortDir === 'asc'
      ? <ChevronUp className="ml-0.5 inline size-3 text-violet-500" />
      : <ChevronDown className="ml-0.5 inline size-3 text-violet-500" />
  }

  function quickChangeTier(member: Member, newTier: B2bTier) {
    const tierCfg = loadCustomerTiers().b2bTiers.find((t) => t.tier === newTier)
    const updated: Member = {
      ...member,
      b2bTier: newTier,
      creditLimitBaht: tierCfg?.creditLimitBaht ?? member.creditLimitBaht,
      creditTermDays: tierCfg?.creditTermDays ?? member.creditTermDays,
      payAtMonthEnd: tierCfg?.payAtMonthEnd ?? member.payAtMonthEnd,
    }
    const next = members.map((m) => (m.id === member.id ? updated : m))
    setMembers(next)
    saveMembers(next)
    if (selectedMember?.id === member.id) setSelectedMember(updated)
    setTierPopoverId(null)
    void upsertMemberAsync(updated).catch(console.error)
  }

  const stats = useMemo(() => {
    const totalAr = members.reduce((s, m) => s + m.arBalance, 0)
    const overLimit = members.filter((m) => m.creditLimitBaht > 0 && m.arBalance > m.creditLimitBaht).length
    const b2cCount = members.filter((m) => m.customerType === 'b2c').length
    const garageCount = members.filter((m) => m.customerType === 'garage').length
    const storeCount = members.filter((m) => m.customerType === 'store').length
    const vipCount = members.filter((m) => m.customerType === 'vip').length
    const tierCounts = B2B_TIER_ORDER.reduce(
      (acc, t) => { acc[t] = members.filter((m) => m.b2bTier === t).length; return acc },
      {} as Record<B2bTier, number>,
    )
    return { totalAr, overLimit, b2cCount, garageCount, storeCount, vipCount, tierCounts }
  }, [members])

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

  const sortedFiltered = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
  }, [filtered, sortKey, sortDir])

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

  const handleDeactivate = (row: Member) => {
    const updated: Member = { ...row, status: 'inactive' }
    const next = members.map((m) => (m.id === row.id ? updated : m))
    setMembers(next)
    saveMembers(next)
    if (selectedMember?.id === row.id) setSelectedMember(updated)
    void upsertMemberAsync(updated).catch(console.error)
  }

  const openDeleteConfirm = (row: Member) => {
    setDeleteConfirmMemberId(row.id)
    setDeleteConfirmInput('')
  }

  const confirmPermanentDelete = (row: Member) => {
    if (deleteConfirmInput.trim() !== row.fullName.trim()) return
    const prev = members
    const next = prev.filter((m) => m.id !== row.id)
    setMembers(next)
    saveMembers(next)
    if (selectedMember?.id === row.id) setSelectedMember(null)
    setDeleteConfirmMemberId(null)
    setDeleteConfirmInput('')
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

        {/* ── Stats bar ── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-100 bg-slate-50/60 px-4 py-1.5">
          <span className="text-[10px] text-slate-500">
            ทั้งหมด <span className="font-bold text-slate-700">{members.length}</span> คน
          </span>
          <span className="text-[10px] text-slate-400">👤 <span className="font-semibold text-slate-600">{stats.b2cCount}</span></span>
          <span className="text-[10px] text-slate-400">🔧 <span className="font-semibold text-slate-600">{stats.garageCount}</span></span>
          <span className="text-[10px] text-slate-400">🏪 <span className="font-semibold text-slate-600">{stats.storeCount}</span></span>
          {stats.vipCount > 0 && <span className="text-[10px] text-slate-400">⭐ <span className="font-semibold text-slate-600">{stats.vipCount}</span></span>}
          <span className="text-[10px] text-slate-300">|</span>
          {B2B_TIER_ORDER.map((t) => (
            <span key={t} className="flex items-center gap-1 text-[10px]">
              <span className={clsx('size-2 rounded-full', B2B_TIER_COLORS[t].dot)} />
              <span className="text-slate-500">
                {t.charAt(0).toUpperCase() + t.slice(1)}: <span className="font-semibold text-slate-700">{stats.tierCounts[t]}</span>
              </span>
            </span>
          ))}
          <span className="ml-auto text-[10px] text-slate-500">
            AR รวม: <span className="font-semibold tabular-nums text-amber-700">
              ฿{stats.totalAr.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
            </span>
          </span>
          {stats.overLimit > 0 && (
            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
              เกินวงเงิน {stats.overLimit} ราย
            </span>
          )}
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
              <option value="b2c">👤 ลูกค้าทั่วไป</option>
              {B2B_TIER_ORDER.map((t) => {
                const cfg = loadCustomerTiers().b2bTiers.find((c) => c.tier === t)
                return <option key={t} value={t}>{cfg?.label ?? t}</option>
              })}
            </select>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[58rem] border-collapse text-left text-xs">
            <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50/95 backdrop-blur">
              <tr className="text-[10px] font-medium uppercase tracking-wide text-slate-600">
                <th
                  className="cursor-pointer select-none whitespace-nowrap px-2 py-1.5 hover:text-violet-700"
                  onClick={() => handleSort('memberCode')}
                >รหัส{sortIcon('memberCode')}</th>
                <th
                  className="min-w-[8rem] cursor-pointer select-none px-2 py-1.5 hover:text-violet-700"
                  onClick={() => handleSort('fullName')}
                >ชื่อ{sortIcon('fullName')}</th>
                <th className="whitespace-nowrap px-2 py-1.5">เบอร์</th>
                <th className="whitespace-nowrap px-2 py-1.5">ประเภท</th>
                <th className="whitespace-nowrap px-2 py-1.5">Tier</th>
                <th
                  className="cursor-pointer select-none whitespace-nowrap px-2 py-1.5 text-right hover:text-violet-700"
                  onClick={() => handleSort('pointsBalance')}
                >แต้ม{sortIcon('pointsBalance')}</th>
                <th
                  className="cursor-pointer select-none whitespace-nowrap px-2 py-1.5 text-right hover:text-violet-700"
                  onClick={() => handleSort('arBalance')}
                >ค้างชำระ{sortIcon('arBalance')}</th>
                <th
                  className="cursor-pointer select-none whitespace-nowrap px-2 py-1.5 text-right hover:text-violet-700"
                  onClick={() => handleSort('creditLimitBaht')}
                >วงเงิน{sortIcon('creditLimitBaht')}</th>
                <th className="whitespace-nowrap px-2 py-1.5 text-center">เครดิต</th>
                <th className="whitespace-nowrap px-2 py-1.5">ระดับราคา</th>
                <th className="whitespace-nowrap px-2 py-1.5">สถานะ</th>
                <th className="whitespace-nowrap px-2 py-1.5 text-right">การทำงาน</th>
              </tr>
            </thead>
            <tbody>
              {sortedFiltered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-slate-500">
                    ไม่พบสมาชิกตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                sortedFiltered.map((m) => {
                  const overLimit = m.creditLimitBaht > 0 && m.arBalance > m.creditLimitBaht
                  const hasAr = m.arBalance > 0
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedMember((prev) => (prev?.id === m.id ? null : m))}
                      className={clsx(
                        'cursor-pointer border-b border-slate-100 transition',
                        selectedMember?.id === m.id
                          ? 'bg-violet-50 ring-1 ring-inset ring-violet-200'
                          : overLimit
                          ? 'bg-rose-50/40 hover:bg-rose-50/70'
                          : 'hover:bg-violet-50/30',
                      )}
                    >
                      {/* AR highlight via left border on first cell */}
                      <td className={clsx(
                        'whitespace-nowrap px-2 py-1.5 font-mono text-[10px] text-slate-700',
                        overLimit && 'border-l-2 border-l-rose-400',
                        !overLimit && hasAr && 'border-l-2 border-l-amber-400',
                      )}>
                        {m.memberCode}
                      </td>
                      <td className="max-w-[10rem] truncate px-2 py-1.5 font-medium text-slate-900">{m.fullName}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-slate-700">{formatPhone(m.phone)}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-slate-600">{MEMBER_TYPE_LABELS[m.memberType]}</td>

                      {/* ── Quick tier popover ── */}
                      <td className="whitespace-nowrap px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                        {(m.customerType === 'garage' || m.customerType === 'store') && m.b2bTier ? (
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() => setTierPopoverId((prev) => (prev === m.id ? null : m.id))}
                              className="rounded transition hover:opacity-80"
                            >
                              {tierBadge(m.b2bTier)}
                            </button>
                            {tierPopoverId === m.id && (
                              <div
                                ref={popoverRef}
                                className="absolute left-0 top-full z-20 mt-1 min-w-[130px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
                              >
                                <p className="mb-1 px-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">เปลี่ยน Tier</p>
                                {B2B_TIER_ORDER.map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => quickChangeTier(m, t)}
                                    className={clsx(
                                      'flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] transition hover:bg-slate-100',
                                      m.b2bTier === t && 'bg-slate-100 font-semibold',
                                    )}
                                  >
                                    <span>{TIER_ICONS[t]}</span>
                                    <span className="text-slate-700">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : m.customerType === 'vip' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-800 ring-1 ring-yellow-300">⭐ VIP</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-slate-800">
                        {m.customerType === 'b2c' ? m.pointsBalance.toLocaleString('th-TH') : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
                        {m.arBalance > 0 ? (
                          <span className={overLimit ? 'font-bold text-rose-700' : 'text-amber-800'}>
                            ฿{m.arBalance.toLocaleString('th-TH')}
                          </span>
                        ) : '—'}
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
                        {m.customerType === 'b2c' ? 'ปลีก' : m.customerType === 'garage' ? 'อู่' : m.customerType === 'store' ? 'ร้านค้า' : m.customerType === 'vip' ? 'VIP' : 'ปลีก'}
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
                          {m.status === 'active' ? (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(m)}
                              title="ปิดการใช้งานสมาชิก (ข้อมูลยังคงอยู่)"
                              className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-50"
                            >
                              ปิด
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openDeleteConfirm(m)}
                              title="ลบถาวร (ต้องยืนยันชื่อ)"
                              className="rounded border border-rose-200 bg-white px-2 py-0.5 text-[10px] font-medium text-rose-700 hover:bg-rose-50"
                            >
                              ลบถาวร
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
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

          {/* ── Tier progression bar (B2B only) ── */}
          {(selectedMember.customerType === 'garage' || selectedMember.customerType === 'store') && selectedMember.b2bTier && memberSummary && (() => {
            const tier = selectedMember.b2bTier as B2bTier
            const nextTier = TIER_NEXT[tier]
            const threshold = TIER_THRESHOLDS[tier]
            if (!nextTier || threshold === undefined) return null
            const pct = Math.min(100, Math.round((memberSummary.totalSpent / threshold) * 100))
            const isReady = memberSummary.totalSpent >= threshold
            return (
              <div className="border-b border-slate-200 bg-white px-3 py-2.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <TrendingUp className="size-3" />
                    {isReady ? 'พร้อมอัพเกรด →' : 'เป้าหมาย →'} {tierBadge(nextTier)}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={clsx('h-full rounded-full transition-all', isReady ? 'bg-emerald-500' : 'bg-violet-400')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  ฿{memberSummary.totalSpent.toLocaleString('th-TH', { maximumFractionDigits: 0 })} / ฿{threshold.toLocaleString('th-TH')}
                </p>
                {isReady && (
                  <button
                    type="button"
                    onClick={() => quickChangeTier(selectedMember, nextTier)}
                    className="mt-2 w-full rounded-lg border border-emerald-300 bg-emerald-50 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    อัพเกรด → {TIER_ICONS[nextTier]} {nextTier.charAt(0).toUpperCase() + nextTier.slice(1)}
                  </button>
                )}
              </div>
            )
          })()}

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

      {/* Permanent delete confirmation modal */}
      {deleteConfirmMemberId &&
        typeof document !== 'undefined' &&
        (() => {
          const row = members.find((m) => m.id === deleteConfirmMemberId)
          if (!row) return null
          const nameMatches = deleteConfirmInput.trim() === row.fullName.trim()
          return createPortal(
            <div
              className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
              onMouseDown={(e) => { if (e.target === e.currentTarget) { setDeleteConfirmMemberId(null); setDeleteConfirmInput('') } }}
            >
              <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-2xl">
                <div className="border-t-4 border-rose-500 bg-rose-50 px-5 py-4">
                  <p className="text-sm font-bold text-rose-800">ลบสมาชิกถาวร — ไม่สามารถกู้คืนได้</p>
                  <p className="mt-1 text-xs text-rose-600">
                    {row.memberCode} · {row.fullName}
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="mb-3 text-xs text-slate-600">
                    พิมพ์ชื่อสมาชิก <span className="font-mono font-bold">"{row.fullName}"</span> เพื่อยืนยัน
                  </p>
                  <input
                    className="w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-200"
                    placeholder={row.fullName}
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    autoFocus
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setDeleteConfirmMemberId(null); setDeleteConfirmInput('') }}
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmPermanentDelete(row)}
                      disabled={!nameMatches}
                      className="flex-1 rounded-lg bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ลบถาวร
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        })()}
    </div>
  )
}
