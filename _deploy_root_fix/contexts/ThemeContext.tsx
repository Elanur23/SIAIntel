'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

const STORAGE_KEY = 'theme'
type Theme = 'light' | 'dark' | 'system'

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme === 'dark' ? 'dark' : 'light'
}

export function applyTheme(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
  } else {
    root.classList.remove('dark')
    root.setAttribute('data-theme', 'light')
  }
}

type ThemeContextType = {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme) || 'system'
    setThemeState(stored)
    const resolved = getResolvedTheme(stored)
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const resolved = getResolvedTheme(theme)
    setResolvedTheme(resolved)
    applyTheme(resolved)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme, mounted])

  useEffect(() => {
    if (theme !== 'system' || !mounted) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const resolved = getResolvedTheme('system')
      setResolvedTheme(resolved)
      applyTheme(resolved)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme, mounted])

  const setTheme = useCallback((value: Theme) => {
    setThemeState(value)
    const resolved = getResolvedTheme(value)
    setResolvedTheme(resolved)
    applyTheme(resolved)
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, value)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
