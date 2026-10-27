import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useTheme } from '../component/home/themedContext'
import { NoticeContext } from './notice-context'

/**
 * Lightweight toast used for share/copy confirmations and for the
 * "sign in first" hint the API's 401s translate into.
 */
export function NoticeProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const notify = useCallback((next: string) => {
    setMessage(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(''), 2600)
  }, [])

  return (
    <NoticeContext.Provider value={notify}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-24 lg:bottom-6 right-4 z-[70] max-w-[min(20rem,calc(100vw-2rem))] rounded-xl border px-4 py-3 text-xs font-bold shadow-2xl transition-all duration-300 ${
          message
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        } ${
          isDark
            ? 'border-yellow-400/30 bg-zinc-900 text-yellow-400'
            : 'border-yellow-500/30 bg-white text-zinc-800'
        }`}
      >
        {message}
      </div>
    </NoticeContext.Provider>
  )
}
