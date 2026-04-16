export type ShortcutActionId =
  | 'ui.close'
  | 'pos.search'
  | 'pos.customer'
  | 'pos.pay'
  | 'pos.print'
  | 'pos.help'
  | 'pos.f3'
  | 'pos.f4'
  | 'pos.f5'
  | 'pos.f6'
  | 'pos.f7'
  | 'pos.f8'

export type ShortcutMap = Record<ShortcutActionId, string>

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  'ui.close': 'Escape',
  'pos.help': 'F1',
  'pos.search': 'F2',
  'pos.f3': 'F3',
  'pos.f4': 'F4',
  'pos.f5': 'F5',
  'pos.f6': 'F6',
  'pos.f7': 'F7',
  'pos.f8': 'F8',
  'pos.pay': 'F9',
  'pos.print': 'F10',
  'pos.customer': 'F4',
}

const STORAGE_KEY = 'bento.shortcuts.v1'

export function loadShortcuts(): ShortcutMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SHORTCUTS }
    const parsed = JSON.parse(raw) as Partial<ShortcutMap>
    return { ...DEFAULT_SHORTCUTS, ...parsed }
  } catch {
    return { ...DEFAULT_SHORTCUTS }
  }
}

export function saveShortcuts(map: ShortcutMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function eventKeyString(e: Pick<KeyboardEvent, 'key'>): string {
  return e.key
}

export function matchShortcut(e: KeyboardEvent, expectedKey: string): boolean {
  return eventKeyString(e) === expectedKey
}

