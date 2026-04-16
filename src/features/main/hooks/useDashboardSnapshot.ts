import {
  POS_SALE_RECORDED_EVENT,
  getTodaySalesSummary,
  getTopProductsByQty,
} from '@/features/pos/data/posSalesHistory'
import { getLowStockAlerts } from '@/features/main/data/dashboardStats'
import { useCallback, useEffect, useState } from 'react'

export type DashboardSnapshot = {
  topProducts: { name: string; qty: number }[]
  lowStock: ReturnType<typeof getLowStockAlerts>
  today: ReturnType<typeof getTodaySalesSummary>
}

function readSnapshot(): DashboardSnapshot {
  return {
    topProducts: getTopProductsByQty(5),
    lowStock: getLowStockAlerts(4),
    today: getTodaySalesSummary(),
  }
}

export function useDashboardSnapshot(): DashboardSnapshot {
  const [snap, setSnap] = useState<DashboardSnapshot>(readSnapshot)

  const refresh = useCallback(() => {
    setSnap(readSnapshot())
  }, [])

  useEffect(() => {
    refresh()
    const onVis = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    const onSale = () => refresh()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener(POS_SALE_RECORDED_EVENT, onSale)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener(POS_SALE_RECORDED_EVENT, onSale)
    }
  }, [refresh])

  return snap
}
