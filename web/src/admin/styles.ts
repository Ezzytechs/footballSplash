import { useTheme } from '../component/home/themedContext'

/** Theme-aware class strings shared by every dashboard screen. */
export function useAdminStyles() {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  return {
    isDark,
    surface: isDark
      ? 'bg-zinc-900/60 border-zinc-800/80'
      : 'bg-white border-zinc-200/80',
    heading: isDark ? 'text-white' : 'text-zinc-900',
    muted: isDark ? 'text-zinc-400' : 'text-zinc-500',
    faint: isDark ? 'text-zinc-500' : 'text-zinc-400',
    border: isDark ? 'border-zinc-800/80' : 'border-zinc-200/80',
    input: `w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/60 ${
      isDark
        ? 'bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600'
        : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
    }`,
    primaryBtn:
      'inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-yellow-300 disabled:opacity-50',
    ghostBtn: `inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-colors ${
      isDark
        ? 'border-zinc-700 text-zinc-300 hover:border-yellow-400/60 hover:text-yellow-400'
        : 'border-zinc-200 text-zinc-700 hover:border-yellow-500/60 hover:text-yellow-600'
    }`,
    dangerBtn:
      'inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-red-500 transition-colors hover:bg-red-500/20',
  }
}
