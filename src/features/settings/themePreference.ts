import { useEffect, useState } from 'react'

const THEME_KEY = 'bento_theme_preference'

export type ThemePreference = 'light' | 'dark'

export function loadThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // ignore
  }
  return 'dark' // default to dark
}

export function saveThemePreference(theme: ThemePreference) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // ignore
  }
}

export const THEME_CHANGED_EVENT = 'bento:theme-changed'

export function useThemePreference() {
  const [theme, setTheme] = useState<ThemePreference>(loadThemePreference)

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY) {
        setTheme(loadThemePreference())
      }
    }
    const onCustom = () => setTheme(loadThemePreference())

    window.addEventListener('storage', onStorage)
    window.addEventListener(THEME_CHANGED_EVENT, onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(THEME_CHANGED_EVENT, onCustom)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    saveThemePreference(next)
    window.dispatchEvent(new Event(THEME_CHANGED_EVENT))
  }

  return { theme, toggleTheme, setTheme }
}
