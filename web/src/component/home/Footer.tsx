import { useTheme } from './themedContext'

export function Footer() {
  const { theme } = useTheme()
  const isDark = theme === 'night'

  const brandAccent = isDark ? 'text-yellow-400' : 'text-yellow-500'
  const brandText = isDark ? 'text-white' : 'text-zinc-900'
  const linkText = isDark ? 'text-zinc-400 hover:text-yellow-400' : 'text-zinc-600 hover:text-yellow-600'
  const divider = isDark ? 'text-zinc-700' : 'text-zinc-300'
  const surfaceBorder = isDark ? 'border-zinc-900' : 'border-zinc-200'
  const bgSurface = isDark ? 'bg-[#070b10]' : 'bg-white'

  return (
    <footer className={`mt-12 text-xs ${bgSurface} ${surfaceBorder} border-t py-10`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Primary row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-2">
            <span className={`font-black text-xl italic ${brandAccent}`}>
              SPLASH
            </span>
            <span className={`font-bold ${brandText}`}>
              FOOTBALL NEWS © 2026
            </span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-xs font-semibold">
            <a href="/privacy" className={`transition-colors ${linkText}`}>
              Privacy Policy
            </a>
            <a href="/terms" className={`transition-colors ${linkText}`}>
              Terms of Service
            </a>
            <a href="/editorial" className={`transition-colors ${linkText}`}>
              Editorial Guidelines
            </a>
            <a href="/contact" className={`transition-colors ${linkText}`}>
              Contact Us
            </a>
          </nav>
        </div>

        {/* Secondary utility row */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-between gap-4 border-t ${
            isDark ? 'border-zinc-800/60' : 'border-zinc-200/60'
          } pt-6`}
        >
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className={`${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Follow us
            </span>
            <a href="#" className={`transition-colors ${linkText}`}>
              X.com
            </a>
            <a href="#" className={`transition-colors ${linkText}`}>
              Instagram
            </a>
            <a href="#" className={`transition-colors ${linkText}`}>
              YouTube
            </a>
          </div>
          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            <span>Made with</span>
            <span className="text-red-500 text-base" aria-hidden="true">♥</span>
            <span className={divider}>|</span>
            <span>for the beautiful game</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
