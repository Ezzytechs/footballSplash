import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './themedContext'

export function ThemedApp({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('night')

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
  }, [])

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === 'day' ? 'night' : 'day'))
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'night')
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      <div className={`land ${theme === 'night' ? 'dark' : ''}`}>{children}</div>
    </ThemeContext.Provider>
  )
}
