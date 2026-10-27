import { createContext, useContext } from 'react'

export type Theme = 'day' | 'night'

export interface ThemeContextValue {
  theme: Theme
  toggle: () => void
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used inside ThemedApp')
  }
  return ctx
}

export function useTheme(): ThemeContextValue {
  return useThemeContext()
}
