const LS_KEY = 'bento.transport.shipmentLog.v1'
export const TRANSPORT_SHIPMENT_LOG_CHANGED = 'bento-transport-shipment-log-changed'

export type BoxCount = { small?: number; normal?: number; large?: number }

export type TransportShipmentLog = {
  id: string
  transportId: string
  transportName: string
  poId: string
  poNo: string
  receivedAt: string      // ISO
  orderedAt?: string      // ISO — for transit day calculation
  transitDays?: number    // calculated
  totalQtyReceived: number
  shortageQtyTotal: number
  boxes?: BoxCount
  damagedBoxes?: BoxCount
  shippingCostBaht?: number
}

function emit() {
  window.dispatchEvent(new CustomEvent(TRANSPORT_SHIPMENT_LOG_CHANGED))
}

export function loadTransportShipmentLogs(): TransportShipmentLog[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as TransportShipmentLog[]
  } catch {
    return []
  }
}

export function appendTransportShipmentLog(log: TransportShipmentLog): void {
  try {
    const list = loadTransportShipmentLogs()
    list.push(log)
    localStorage.setItem(LS_KEY, JSON.stringify(list))
    emit()
  } catch { /* ignore */ }
}

export function deleteTransportShipmentLog(id: string): void {
  try {
    const list = loadTransportShipmentLogs().filter((l) => l.id !== id)
    localStorage.setItem(LS_KEY, JSON.stringify(list))
    emit()
  } catch { /* ignore */ }
}

export function getTransportStats(transportId: string): {
  shipmentCount: number
  avgTransitDays: number | null
  avgShippingCost: number | null
  damageRatePct: { small: number | null; normal: number | null; large: number | null }
} {
  const logs = loadTransportShipmentLogs().filter((l) => l.transportId === transportId)
  const shipmentCount = logs.length

  // Average transit days
  const dayLogs = logs.filter((l) => l.transitDays != null)
  const avgTransitDays = dayLogs.length > 0
    ? Math.round((dayLogs.reduce((s, l) => s + (l.transitDays ?? 0), 0) / dayLogs.length) * 10) / 10
    : null

  // Average shipping cost (only from shipments that had a cost recorded)
  const costLogs = logs.filter((l) => l.shippingCostBaht != null && (l.shippingCostBaht ?? 0) > 0)
  const avgShippingCost = costLogs.length > 0
    ? Math.round(costLogs.reduce((s, l) => s + (l.shippingCostBaht ?? 0), 0) / costLogs.length)
    : null

  // Damage rate per box size
  const calcRate = (size: keyof BoxCount): number | null => {
    const withBoxes = logs.filter((l) => l.boxes?.[size] != null && (l.boxes[size] ?? 0) > 0)
    if (withBoxes.length === 0) return null
    const totalBoxes = withBoxes.reduce((s, l) => s + (l.boxes?.[size] ?? 0), 0)
    const totalDamaged = withBoxes.reduce((s, l) => s + (l.damagedBoxes?.[size] ?? 0), 0)
    return totalBoxes > 0 ? Math.round((totalDamaged / totalBoxes) * 1000) / 10 : null
  }

  return {
    shipmentCount,
    avgTransitDays,
    avgShippingCost,
    damageRatePct: {
      small: calcRate('small'),
      normal: calcRate('normal'),
      large: calcRate('large'),
    },
  }
}
