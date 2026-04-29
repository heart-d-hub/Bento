import { MOCK_MEMBERS, type Member } from '@/features/members/data/mockMembers'
import { normalizePhone } from '@/features/members/data/phoneUtils'
import { isTauri } from '@/features/desktop/isTauri'
import { invoke } from '@tauri-apps/api/core'

const LS_KEY = 'bento.members.store.v1'
export const MEMBERS_CHANGED_EVENT = 'bento:members:changed'

function legacyBranchToId(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  if (raw === 'สาขา 1') return 'somneuk'
  if (raw === 'สาขา 2') return 'ang'
  return raw
}

function normalizeMember(raw: unknown): Member | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.memberCode !== 'string' || typeof r.fullName !== 'string') return null
  return {
    id: r.id,
    memberCode: r.memberCode,
    fullName: typeof r.fullName === 'string' ? r.fullName : '',
    address: typeof r.address === 'string' ? r.address : '',
    taxId: typeof r.taxId === 'string' ? r.taxId : '',
    contactPerson: typeof r.contactPerson === 'string' ? r.contactPerson : '',
    email: typeof r.email === 'string' ? r.email : '',
    phone: normalizePhone(typeof r.phone === 'string' ? r.phone : ''),
    fax: normalizePhone(typeof r.fax === 'string' ? r.fax : ''),
    salesStaffId: typeof r.salesStaffId === 'string' ? r.salesStaffId : '',
    creditLimitBaht: Number(r.creditLimitBaht) || 0,
    creditTermDays: Number(r.creditTermDays) || 0,
    creditTermMonths: Number(r.creditTermMonths) || 0,
    payAtMonthEnd: Boolean(r.payAtMonthEnd),
    cutOffDayOfMonth: typeof r.cutOffDayOfMonth === 'number' ? r.cutOffDayOfMonth : null,
    defaultPriceTier: (r.defaultPriceTier as Member['defaultPriceTier']) ?? 'tier1',
    markupPercent: Number(r.markupPercent) || 0,
    priceStartDate: typeof r.priceStartDate === 'string' ? r.priceStartDate : '',
    priceEndDate: typeof r.priceEndDate === 'string' ? r.priceEndDate : '',
    itemTierOverrides: Array.isArray(r.itemTierOverrides) ? (r.itemTierOverrides as Member['itemTierOverrides']) : [],
    notes: typeof r.notes === 'string' ? r.notes : '',
    memberType: (r.memberType as Member['memberType']) ?? 'general',
    status: (r.status as Member['status']) ?? 'active',
    customerType: (r.customerType as Member['customerType']) ?? 'b2c',
    b2bTier: (r.b2bTier as Member['b2bTier']) ?? null,
    branchId: legacyBranchToId(typeof r.branchId === 'string' ? r.branchId : r.defaultBranch),
    pointsBalance: Number(r.pointsBalance) || 0,
    arBalance: Number(r.arBalance) || 0,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString().slice(0, 10),
  }
}

function dedupeMembers(rows: Member[]): Member[] {
  const seenId = new Set<string>()
  const seenCode = new Set<string>()
  const out: Member[] = []
  for (const m of rows) {
    const id = m.id.trim()
    const code = m.memberCode.trim().toUpperCase()
    if (!id || seenId.has(id)) continue
    if (!code || seenCode.has(code)) continue
    seenId.add(id)
    seenCode.add(code)
    out.push({ ...m, id, memberCode: m.memberCode.trim() })
  }
  return out
}

export function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return [...MOCK_MEMBERS]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...MOCK_MEMBERS]
    const normalized = dedupeMembers(parsed.map(normalizeMember).filter((m): m is Member => Boolean(m)))
    return normalized.length ? normalized : [...MOCK_MEMBERS]
  } catch {
    return [...MOCK_MEMBERS]
  }
}

export function saveMembers(next: Member[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(dedupeMembers(next)))
    window.dispatchEvent(new CustomEvent(MEMBERS_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}

export async function loadMembersAsync(): Promise<Member[]> {
  if (!isTauri()) return loadMembers()
  try {
    const rows = await invoke<Member[]>('members_load')
    if (!Array.isArray(rows) || rows.length === 0) return [...MOCK_MEMBERS]
    const normalized = dedupeMembers(rows.map(normalizeMember).filter((m): m is Member => Boolean(m)))
    return normalized.length ? normalized : [...MOCK_MEMBERS]
  } catch (error) {
    console.error('[members] loadMembersAsync failed, fallback to localStorage', error)
    return loadMembers()
  }
}

export async function upsertMemberAsync(member: Member): Promise<void> {
  if (!isTauri()) return
  try {
    const normalized = dedupeMembers([member])[0]
    if (!normalized) return
    await invoke('members_upsert', { member: normalized })
    window.dispatchEvent(new CustomEvent(MEMBERS_CHANGED_EVENT))
  } catch (error) {
    console.error('[members] upsertMemberAsync failed', error)
    throw error
  }
}

export async function deleteMemberAsync(memberId: string): Promise<void> {
  if (!isTauri()) return
  try {
    await invoke('members_delete', { memberId })
    window.dispatchEvent(new CustomEvent(MEMBERS_CHANGED_EVENT))
  } catch (error) {
    console.error('[members] deleteMemberAsync failed', error)
    throw error
  }
}

