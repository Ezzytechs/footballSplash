import type { CSSProperties } from 'react'
import {
  ArrowLeftRight,
  Bookmark,
  Flame,
  Globe,
  Heart,
  Mail,
  Newspaper,
  Shirt,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePopularArticles, useTagsQuery } from '../../api/queries'
import { useBookmarkedArticles, useLikedArticles } from '../../api/library'
import { useAuth } from '../../auth/AuthContext'
import { TrendingList } from '../post/SideRail'
import { useTheme } from './themedContext'
import { useCategorySlots } from './categorySlots'
import { LiveScoreSection } from './LiveScoreSection'

interface NavLink {
  label: string
  href: string
  icon: LucideIcon
}

/** Icon per category slug; categories added later fall back to a generic one. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'premier-league': Shirt,
  'champions-league': Trophy,
  transfers: ArrowLeftRight,
  'world-football': Globe,
}

const BASE_NAV: NavLink[] = [
  { label: 'Top Stories', href: '#top-stories', icon: Flame },
  { label: 'Latest Headlines', href: '#latest-headlines', icon: Newspaper },
]

export function Sidebar({ railMaxHeight }: { railMaxHeight?: number | null }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'

  // Height comes from the main column, never the window: the rail sticks for
  // as long as it fits inside the column and only scrolls when it does not.
  const railMax = railMaxHeight ?? null

  const tags = useTagsQuery()
  const popular = usePopularArticles(5)

  // Shelf counters. One item per shelf is plenty — only meta.total is read,
  // and the queries stay idle until there is a session to ask about.
  const { status, user } = useAuth()
  const signedIn = status === 'authenticated' && Boolean(user)
  const savedShelf = useBookmarkedArticles(1, signedIn)
  const likedShelf = useLikedArticles(1, signedIn)
  const savedCount = signedIn ? (savedShelf.data?.meta.total ?? null) : null
  const likedCount = signedIn ? (likedShelf.data?.meta.total ?? null) : null

  // Four categories only: the navbar owns the first six and the page body
  // owns the rest, so no category is listed twice on the site.
  const { sidebar: railCategories } = useCategorySlots()
  const quickNav: NavLink[] = [
    ...BASE_NAV,
    ...railCategories.map((category) => ({
      label: category.name,
      href: `/category/${category.slug}`,
      icon: CATEGORY_ICONS[category.slug] ?? Newspaper,
    })),
  ]

  // Tag archives are reached from here; only tags actually used by a story.
  const trendingTags = (tags.data ?? [])
    .filter((tag) => (tag._count?.articles ?? 0) > 0)
    .slice(0, 8)

  const card = isDark
    ? 'bg-zinc-900/50 border-zinc-800/80'
    : 'bg-white border-zinc-200/80'
  const widgetTitle = isDark ? 'text-white' : 'text-zinc-900'
  const navItem = isDark
    ? 'text-zinc-300 hover:bg-zinc-800/70 hover:text-yellow-400'
    : 'text-zinc-700 hover:bg-zinc-100 hover:text-yellow-600'
  const iconMuted = isDark ? 'text-zinc-500' : 'text-zinc-400'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const shelfTile = `flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors ${
    isDark
      ? 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-yellow-400/60 hover:text-yellow-400'
      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-yellow-500/60 hover:text-yellow-600'
  }`

  return (
    <aside
      className="rail-max lg:col-span-4 self-start pb-2 lg:sticky lg:top-44 lg:overflow-y-auto lg:pr-1"
      style={
        railMax === null
          ? undefined
          : ({ '--rail-max': `${railMax}px` } as CSSProperties)
      }
    >
      <div className="space-y-5">
        {/* 1. Quick navigation */}
        <nav
          className={`rounded-2xl border ${card} p-4`}
          aria-label="Browse sections"
        >
          <h3
            className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${widgetTitle}`}
          >
            <span className="w-1 h-4 bg-yellow-400 rounded-full" />
            Browse
          </h3>
          <ul className="space-y-1">
            {quickNav.map((link) => {
              const Icon = link.icon
              const linkClass = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-colors ${navItem}`
              return (
                <li key={link.label}>
                  {link.href.startsWith('#') ? (
                    <a href={link.href} className={linkClass}>
                      <Icon className={`w-4 h-4 shrink-0 ${iconMuted}`} />
                      <span>{link.label}</span>
                    </a>
                  ) : (
                    <Link to={link.href} className={linkClass}>
                      <Icon className={`w-4 h-4 shrink-0 ${iconMuted}`} />
                      <span>{link.label}</span>
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* 1a. The reader's own shelves — same data as the /library dashboard */}
        <section
          className={`rounded-2xl border ${card} p-4`}
          aria-label="My library"
        >
          <h3
            className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${widgetTitle}`}
          >
            <span className="w-1 h-4 bg-yellow-400 rounded-full" />
            My Library
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/library" className={shelfTile}>
              <Bookmark className="w-4 h-4 text-yellow-500" />
              <span className="text-lg font-extrabold leading-none">
                {savedCount ?? '—'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider">
                Saved
              </span>
            </Link>
            <Link to="/library" className={shelfTile}>
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-lg font-extrabold leading-none">
                {likedCount ?? '—'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider">
                Liked
              </span>
            </Link>
          </div>
          <Link
            to={signedIn ? '/library' : '/login'}
            className={`mt-3 block rounded-lg px-3 py-2 text-center text-[11px] font-black uppercase tracking-wider transition-colors ${
              isDark
                ? 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 hover:text-yellow-400'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-yellow-600'
            }`}
          >
            {signedIn ? 'Open my library' : 'Sign in to save stories'}
          </Link>
        </section>

        {/* 1b. Trending tags — the homepage's way into the tag archives */}
        {trendingTags.length > 0 && (
          <section
            className={`rounded-2xl border ${card} p-4`}
            aria-label="Trending tags"
          >
            <h3
              className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${widgetTitle}`}
            >
              <span className="w-1 h-4 bg-yellow-400 rounded-full" />
              Trending Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <Link
                  key={tag.id}
                  to={`/tag/${tag.slug}`}
                  className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider transition-colors ${isDark
                    ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-yellow-400/60 hover:text-yellow-400'
                    : 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:border-yellow-500/60 hover:text-yellow-600'
                  }`}
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 2. Most-read stories, straight from /articles/popular */}
        <TrendingList articles={popular.data ?? []} />

        {/* 3. Live scores */}
        <LiveScoreSection />

        {/* 4. Newsletter */}
        <section
          className={`rounded-2xl border p-4 ${isDark
            ? 'bg-yellow-400/10 border-yellow-400/30'
            : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <h3
            className={`text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}
          >
            <Mail className="w-4 h-4" /> The Morning Kickoff
          </h3>
          <p className={`text-[11px] leading-relaxed mb-3 ${muted}`}>
            One email every morning: overnight results, transfer gossip and the
            day’s fixtures.
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <input
              type="email"
              required
              placeholder="you@email.com"
              className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs focus:outline-none ${isDark
                ? 'bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600'
                : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
              }`}
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black px-3 py-2 transition-colors"
            >
              JOIN
            </button>
          </form>
        </section>
      </div>
    </aside>
  )
}
