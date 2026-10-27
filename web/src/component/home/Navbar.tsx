import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Trophy,
  Flame,
  Globe,
  Newspaper,
  ShieldAlert,
  Search,
  Menu,
  X,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useCategoriesQuery } from '../../api/queries'
import { useTheme } from './themedContext'
import { ThemeToggle } from './ThemeToggle'

/** Icon per category slug; categories added later fall back to a generic one. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'premier-league': ShieldAlert,
  'champions-league': Trophy,
  transfers: Zap,
  'world-football': Globe,
}

interface NavItem {
  label: string
  icon: LucideIcon
  to: string
  badge?: string
}

const QUICK_TICKER = [
  'BREAKING: Manchester City agree terms with 19yo Brazilian phenom',
  'UCL DRAW: Real Madrid to face Bayern Munich in Quarter Finals',
  'INJURY UPDATE: Saka cleared for weekend London Derby',
  'GOLDEN BOOT RACE: Haaland reaches 25 goals in just 18 games',
]
export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { pathname } = useLocation()
  const categories = useCategoriesQuery()

  // Primary navigation: Home plus every category the API actually has, so
  // the row never advertises a section the site does not have a page for.
  const navItems: NavItem[] = [
    { label: 'HOME', icon: Flame, to: '/' },
    ...(categories.data ?? []).map((category) => ({
      label: category.name.toUpperCase(),
      icon: CATEGORY_ICONS[category.slug] ?? Newspaper,
      to: `/category/${category.slug}`,
      badge: category.slug === 'transfers' ? 'HOT' : undefined,
    })),
  ]

  const isCurrent = (item: NavItem) =>
    item.to === '/' ? pathname === '/' : pathname === item.to
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const { theme } = useTheme()
  const isDark = theme === 'night'

  const border = isDark ? 'border-zinc-800/80' : 'border-zinc-200/80'
  const mutedText = isDark ? 'text-zinc-400' : 'text-zinc-600'
  const strongText = isDark ? 'text-zinc-300' : 'text-zinc-800'
  const hoverText = isDark ? 'hover:text-white' : 'hover:text-zinc-900'
  const activeBg = isDark ? 'bg-zinc-900/90' : 'bg-zinc-100'
  const iconMuted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const itemBorder = isDark ? 'border-l-4 border-yellow-400' : 'border-l-4 border-yellow-500'
  const livePulse = isDark ? 'bg-red-600' : 'bg-red-500'
  const searchBorder = isDark ? 'border-yellow-400/50' : 'border-yellow-500/60'

  // Shared search field: rendered inline in the bar on sm+ and as a
  // full-width row under the bar on mobile (only one is visible at a time).
  const SEARCH_FIELD = (
    <div
      className={`flex items-center rounded-full px-3 py-1.5 text-sm w-full transition-all ${
        isDark ? 'bg-zinc-900' : 'bg-white'
      } ${searchBorder} border`}
    >
      <Search
        className={`w-4 h-4 mr-2 shrink-0 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}
      />
      <input
        type="text"
        placeholder="Search teams, players..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        autoFocus
        className={`bg-transparent focus:outline-none w-full min-w-0 text-xs ${
          isDark ? 'text-white' : 'text-zinc-900'
        }`}
      />
      <button
        onClick={() => setIsSearchOpen(false)}
        aria-label="Close search"
        className={`shrink-0 pl-2 ${
          isDark
            ? 'text-zinc-400 hover:text-white'
            : 'text-zinc-500 hover:text-zinc-900'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md transition-all duration-300"
      style={{ background: isDark ? 'rgba(12,16,23,0.92)' : 'rgba(255,255,255,0.92)' }}
    >
      {/* Top micro-bar for breaking news */}
      <div className={`border-b ${border} py-1.5 px-4 text-xs font-medium ${mutedText}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <span
              className={`bg-yellow-400 text-black px-2 py-0.5 rounded font-black tracking-wider text-[10px] uppercase flex items-center gap-1 shrink-0 ${isDark ? '' : 'text-black'}`}
            >
              <TrendingUp className="w-3 h-3" /> Flash News
            </span>
            <div
              className={`truncate animate-pulse ${
                isDark ? 'text-zinc-300' : 'text-zinc-600'
              }`}
            >
              {QUICK_TICKER[0]}
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4 text-xs shrink-0">
            <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Oct 26, 2026</span>
            <span className={isDark ? 'text-zinc-700' : 'text-zinc-300'}>|</span>            <button className={`transition-colors ${hoverText} ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Live Scores (12)
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0">
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-tr from-yellow-400 via-lime-400 to-emerald-500 flex items-center justify-center text-black font-black text-xl sm:text-2xl shadow-lg shadow-lime-500/20 group-hover:scale-105 transition-transform ${isDark ? 'shadow-lime-500/20' : 'shadow-lime-500/30'}`}
            >
              ⚡
            </div>
            <div className="min-w-0">
              <span className="block text-lg sm:text-2xl font-black italic tracking-tighter uppercase font-sans truncate">
                SPLASH<span className="text-yellow-400">FOOTBALL</span>
              </span>
              <span
                className={`hidden sm:block text-[9px] font-bold tracking-widest uppercase -mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}
              >
                The Ultimate Pitch
              </span>
            </div>
          </div>

          {/* Desktop Navigation moved to its own row below the masthead
              (see <nav> after this block) so it never squeezes the logo
              or pushes the page sideways. */}

          {/* Search & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Expanded Search Bar (inline on sm+ and up) */}
            <div
              className={`hidden sm:block relative ${isSearchOpen ? 'w-48 lg:w-64' : ''}`}
            >
              {isSearchOpen ? (
                SEARCH_FIELD
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className={`p-2.5 rounded-full transition-all border ${
                    isDark
                      ? 'bg-zinc-900 text-zinc-300 hover:text-yellow-400 hover:bg-zinc-800 border-zinc-800'
                      : 'bg-white text-zinc-600 hover:text-yellow-500 hover:bg-zinc-50 border-zinc-200'
                  }`}
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search trigger (mobile only — the field opens full-width below) */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label={isSearchOpen ? 'Close search' : 'Search'}
              aria-expanded={isSearchOpen}
              className={`sm:hidden p-2 rounded-full transition-all border ${
                isDark
                  ? 'bg-zinc-900 text-zinc-300 hover:text-yellow-400 hover:bg-zinc-800 border-zinc-800'
                  : 'bg-white text-zinc-600 hover:text-yellow-500 hover:bg-zinc-50 border-zinc-200'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Day / Night theme switch */}
            <ThemeToggle />

            {/* Live TV / Subscribe CTA */}
            <button
              className={`hidden sm:flex items-center gap-2 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 ${
                isDark
                  ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-yellow-400/20'
                  : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-yellow-400/30'
              }`}
            >
              <span>LIVE MATCHES</span>
              <span className={`w-2 h-2 rounded-full animate-ping ${livePulse}`} />
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className={`lg:hidden p-2 rounded-xl transition-colors border ${
                isDark
                  ? 'text-zinc-400 hover:text-white bg-zinc-900 border-zinc-800'
                  : 'text-zinc-600 hover:text-zinc-900 bg-white border-zinc-200'
              }`}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation — own row so the masthead never overflows */}
      <nav
        className={`hidden lg:block border-t overflow-x-auto ${border}`}
        aria-label="Primary"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center space-x-1 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = isCurrent(item)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative px-4 py-2 rounded-lg font-bold text-xs tracking-wider transition-all flex items-center gap-2 group ${isActive ? activeBg : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-yellow-400' : iconMuted}`}
                  />
                  <span className={isActive ? 'text-yellow-400' : strongText}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full animate-bounce">
                      {item.badge}
                    </span>
                  )}

                  {/* Highlight Bar under active item */}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Full-width search row (mobile only) */}
      {isSearchOpen && (
        <div
          className={`sm:hidden border-t px-4 py-2.5 ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          {SEARCH_FIELD}
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-t ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'
          } px-4 pt-2 pb-6 space-y-2 max-h-[calc(100dvh-8rem)] overflow-y-auto`}
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = isCurrent(item)
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm ${
                  isActive
                    ? `${isDark ? 'bg-zinc-900 text-yellow-400' : 'bg-zinc-50 text-yellow-600'} ${itemBorder}`
                    : isDark
                    ? 'text-zinc-300 hover:bg-zinc-900'
                    : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${isActive ? 'text-yellow-400' : isDark ? 'text-zinc-400' : 'text-zinc-500'}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
