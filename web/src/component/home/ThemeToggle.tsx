import { Sun, Moon } from 'lucide-react'
import { useTheme } from './themedContext'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'night'

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center w-11 h-11 rounded-full border transition-all shadow-sm active:scale-95"
      style={{
        borderColor: 'var(--land-border-strong)',
        backgroundColor: 'var(--land-surface)',
        color: 'var(--land-on-surface)',
        boxShadow: 'var(--land-shadow)',
      }}
      aria-label={isDark ? 'Switch to day theme' : 'Switch to night theme'}
      title={isDark ? 'Day theme' : 'Night theme'}
    >
      {isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  )
}
