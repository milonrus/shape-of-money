import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type ThemeMode = 'light' | 'dark'

type ThemeContextValue = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const STORAGE_KEY = 'shape-of-money-theme'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const getPreferredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  const prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => getPreferredTheme())
  const [hasExplicitPreference, setHasExplicitPreference] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark'
  })

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    root.style.colorScheme = mode === 'dark' ? 'dark' : 'light'
  }, [mode])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (event: MediaQueryListEvent) => {
      if (!hasExplicitPreference) {
        setModeState(event.matches ? 'dark' : 'light')
      }
    }

    if (!hasExplicitPreference) {
      setModeState(mediaQuery.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [hasExplicitPreference])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (hasExplicitPreference) {
      window.localStorage.setItem(STORAGE_KEY, mode)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [hasExplicitPreference, mode])

  const setMode = useCallback((nextMode: ThemeMode) => {
    setHasExplicitPreference(true)
    setModeState(nextMode)
  }, [])

  const toggleMode = useCallback(() => {
    setHasExplicitPreference(true)
    setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo<ThemeContextValue>(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export type { ThemeMode }
