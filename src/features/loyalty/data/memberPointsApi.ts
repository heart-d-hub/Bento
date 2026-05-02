import type { Member } from '@/features/members/data/mockMembers'
import { isTauri } from '@/features/desktop/isTauri'
import { loadMembers, loadMembersAsync, saveMembers, upsertMemberAsync, MEMBERS_CHANGED_EVENT } from '@/features/members/data/membersStore'

/**
 * อัปเดตแต้มของสมาชิก (delta) ใช้ทั้ง browser (localStorage) + Tauri (DB)
 *
 * Why: หลังขายเสร็จ ต้อง (1) หักแต้มที่ลูกค้าใช้แลกส่วนลด (2) บวกแต้มใหม่ที่ได้จากยอดบิล
 * How to apply: เรียกหลัง createPosSaleAsync สำเร็จ ส่ง delta = +earned - redeemed
 *
 * คืนค่า balance ใหม่ของ member หลังอัปเดต (หรือ null ถ้าไม่พบ)
 */
export async function applyPointsDelta(memberCode: string, delta: number): Promise<number | null> {
  if (!memberCode || delta === 0) return null
  const code = memberCode.trim().toUpperCase()
  if (!code) return null

  // Tauri path — โหลดจาก DB, อัปเดต, บันทึกกลับ
  if (isTauri()) {
    try {
      const rows = await loadMembersAsync()
      const target = rows.find((m) => m.memberCode.trim().toUpperCase() === code)
      if (!target) return null
      const nextBalance = Math.max(0, (target.pointsBalance || 0) + delta)
      const updated: Member = { ...target, pointsBalance: nextBalance }
      await upsertMemberAsync(updated)
      return nextBalance
    } catch (error) {
      console.error('[loyalty] applyPointsDelta tauri failed', error)
      return null
    }
  }

  // Browser path — localStorage
  try {
    const rows = loadMembers()
    const idx = rows.findIndex((m) => m.memberCode.trim().toUpperCase() === code)
    if (idx < 0) return null
    const nextBalance = Math.max(0, (rows[idx].pointsBalance || 0) + delta)
    const next = [...rows]
    next[idx] = { ...rows[idx], pointsBalance: nextBalance }
    saveMembers(next)
    return nextBalance
  } catch (error) {
    console.error('[loyalty] applyPointsDelta localStorage failed', error)
    return null
  }
}

export { MEMBERS_CHANGED_EVENT }
