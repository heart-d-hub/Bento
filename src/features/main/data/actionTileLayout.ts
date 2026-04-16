import { ACTION_TILES, type ActionTile } from '@/features/main/data/actionTiles'

const LS_KEY = 'bento.main.actionTileOrder.v1'

export const ACTION_TILE_ORDER_CHANGED_EVENT = 'bento-action-tile-order-changed'

function defaultOrder(): string[] {
  return ACTION_TILES.map((t) => t.id)
}

function normalizeOrder(order: string[]): string[] {
  const valid = new Set(ACTION_TILES.map((t) => t.id))
  const picked = order.filter((id, i) => valid.has(id) && order.indexOf(id) === i)
  const missing = ACTION_TILES.map((t) => t.id).filter((id) => !picked.includes(id))
  return [...picked, ...missing]
}

export function loadActionTileOrder(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return defaultOrder()
    const parsed = JSON.parse(raw) as string[]
    if (!Array.isArray(parsed)) return defaultOrder()
    return normalizeOrder(parsed)
  } catch {
    return defaultOrder()
  }
}

export function saveActionTileOrder(order: string[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(normalizeOrder(order)))
  window.dispatchEvent(new CustomEvent(ACTION_TILE_ORDER_CHANGED_EVENT))
}

export function resetActionTileOrder(): void {
  localStorage.removeItem(LS_KEY)
  window.dispatchEvent(new CustomEvent(ACTION_TILE_ORDER_CHANGED_EVENT))
}

export function orderActionTiles(tiles: ActionTile[], order: string[]): ActionTile[] {
  const rank = new Map(order.map((id, i) => [id, i]))
  return [...tiles].sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER))
}
