const PREFS_KEY = 'bento.dashboard.preferences.v1'

export type DashboardPreferences = {
  /** แสดงการ์ดสินค้าขายดี */
  showTopProducts: boolean
  /** แสดงการ์ดสต็อกใกล้หมด */
  showLowStock: boolean
  /** แสดงการ์ดยอดขายวันนี้ */
  showTodaySales: boolean
  /** แสดงการ์ดเงินสดในเก๊ะ */
  showCashOnHand: boolean
}

const DEFAULTS: DashboardPreferences = {
  showTopProducts: true,
  showLowStock: true,
  showTodaySales: true,
  showCashOnHand: true,
}

export function loadDashboardPreferences(): DashboardPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<DashboardPreferences>
    return {
      showTopProducts: typeof parsed.showTopProducts === 'boolean' ? parsed.showTopProducts : DEFAULTS.showTopProducts,
      showLowStock: typeof parsed.showLowStock === 'boolean' ? parsed.showLowStock : DEFAULTS.showLowStock,
      showTodaySales: typeof parsed.showTodaySales === 'boolean' ? parsed.showTodaySales : DEFAULTS.showTodaySales,
      showCashOnHand:
        typeof parsed.showCashOnHand === 'boolean' ? parsed.showCashOnHand : DEFAULTS.showCashOnHand,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveDashboardPreferences(p: DashboardPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p))
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('bento-dashboard-prefs-changed'))
}
