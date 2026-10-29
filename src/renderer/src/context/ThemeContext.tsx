import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { ThemeContext } from './theme-context'
import type { ResolvedTheme, ThemeMode } from './theme-context'
import {
  THEME_STORAGE_KEY,
  applyTheme,
  getSystemTheme,
  readStoredMode,
  resolveTheme
} from './theme-utils'

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode)
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(readStoredMode()))

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (): void => {
      if (mode === 'system') {
        setTheme(getSystemTheme())
      }
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [mode])

  const setMode = useCallback((next: ThemeMode) => {
    localStorage.setItem(THEME_STORAGE_KEY, next)
    setModeState(next)
    setTheme(resolveTheme(next))
  }, [])

  const toggleTheme = useCallback(() => {
    setMode(theme === 'dark' ? 'light' : 'dark')
  }, [setMode, theme])

  const value = useMemo(
    () => ({ mode, theme, setMode, toggleTheme }),
    [mode, theme, setMode, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
