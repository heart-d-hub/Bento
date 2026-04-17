import { MOCK_MEMBERS, type Member } from '@/features/members/data/mockMembers'

const LS_KEY = 'bento.members.store.v1'
export const MEMBERS_CHANGED_EVENT = 'bento:members:changed'

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
    phone: typeof r.phone === 'string' ? r.phone : '',
    fax: typeof r.fax === 'string' ? r.fax : '',
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
    defaultBranch: typeof r.defaultBranch === 'string' ? r.defaultBranch : '',
    pointsBalance: Number(r.pointsBalance) || 0,
    arBalance: Number(r.arBalance) || 0,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString().slice(0, 10),
  }
}

export function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return [...MOCK_MEMBERS]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...MOCK_MEMBERS]
    const normalized = parsed.map(normalizeMember).filter((m): m is Member => Boolean(m))
    return normalized.length ? normalized : [...MOCK_MEMBERS]
  } catch {
    return [...MOCK_MEMBERS]
  }
}

export function saveMembers(next: Member[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(MEMBERS_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}

