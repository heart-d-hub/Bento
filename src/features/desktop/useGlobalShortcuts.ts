import { useEffect, useMemo, useState } from 'react'
import { loadShortcuts, type ShortcutActionId, type ShortcutMap } from '@/features/desktop/shortcuts'

type ShortcutHandlers = Partial<Record<ShortcutActionId, () => void>>

export function useGlobalShortcuts(handlers: ShortcutHandlers) {
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(() => loadShortcuts())

  const shortcutKeyToAction = useMemo(() => {
    const entries = Object.entries(shortcuts) as Array<[ShortcutActionId, string]>
    const keyToAction = new Map<string, ShortcutActionId[]>()
    for (const [actionId, key] of entries) {
      if (!key) continue
      keyToAction.set(key, [...(keyToAction.get(key) ?? []), actionId])
    }
    return keyToAction
  }, [shortcuts])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'bento.shortcuts.v1') {
        setShortcuts(loadShortcuts())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const actions = shortcutKeyToAction.get(e.key) ?? []
      if (!actions.length) return

      const active = document.activeElement as HTMLElement | null
      const isTyping =
        active?.tagName === 'INPUT' ||
        active?.tagName === 'TEXTAREA' ||
        (active?.getAttribute('contenteditable') ?? 'false') === 'true'

      // ESC should always work to close dialogs; other keys we still allow in PoC.
      const shouldHandle = e.key === 'Escape' || !isTyping
      if (!shouldHandle) return

      for (const actionId of actions) {
        const handler = handlers[actionId]
        if (!handler) continue
        e.preventDefault()
        handler()
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlers, shortcutKeyToAction])
}

