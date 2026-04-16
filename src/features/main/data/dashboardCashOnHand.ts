const KEY = 'bento.dashboard.cashOnHand.v1'

export const DASHBOARD_CASH_CHANGED_EVENT = 'bento-dashboard-cash-changed'

/** ยอดเงินสดในเก๊ะ (บาท) — นับมือ / ใส่เอง (mock ในเครื่อง) */
export function getCashOnHandBaht(): number {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw == null) return 0
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 0) return 0
    return Math.round(n * 100) / 100
  } catch {
    return 0
  }
}

export function setCashOnHandBaht(baht: number): void {
  const v = Math.max(0, Math.round(baht * 100) / 100)
  try {
    localStorage.setItem(KEY, String(v))
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(DASHBOARD_CASH_CHANGED_EVENT))
}
