import {
  ArrowLeftRight,
  Flame,
  Globe,
  Mail,
  Newspaper,
  Shirt,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTagsQuery } from '../../api/queries'
import { useTheme } from './themedContext'

interface NavLink {
  label: string
  href: string
  icon: LucideIcon
}

const QUICK_NAV: NavLink[] = [
  { label: 'Top Stories', href: '#top-stories', icon: Flame },
  { label: 'Latest Headlines', href: '#latest-headlines', icon: Newspaper },
  { label: 'Premier League', href: '#premier-league', icon: Shirt },
  { label: 'Champions League', href: '#champions-league', icon: Trophy },
  { label: 'Transfer Centre', href: '#transfers', icon: ArrowLeftRight },
  { label: 'World Football', href: '#world-football', icon: Globe },
]

const LIVE_MATCHES = [
  { home: 'ARS', away: 'MCI', score: '2 - 1', minute: "67'", live: true },
  { home: 'RMA', away: 'BAY', score: '1 - 1', minute: "HT", live: true },
  { home: 'INT', away: 'NAP', score: '3 - 2', minute: "FT", live: false },
]

const STANDINGS = [
  { pos: 1, team: 'Arsenal', p: 10, gd: '+18', pts: 25 },
  { pos: 2, team: 'Man City', p: 10, gd: '+16', pts: 23 },
  { pos: 3, team: 'Liverpool', p: 10, gd: '+12', pts: 21 },
  { pos: 4, team: 'Chelsea', p: 10, gd: '+9', pts: 19 },
  { pos: 5, team: 'Newcastle', p: 10, gd: '+6', pts: 17 },
  { pos: 6, team: 'Spurs', p: 10, gd: '+4', pts: 16 },
]

const TOP_SCORERS = [
  { name: 'E. Haaland', club: 'Man City', goals: 25, max: 25 },
  { name: 'K. Mbappé', club: 'Real Madrid', goals: 21, max: 25 },
  { name: 'H. Kane', club: 'Bayern', goals: 19, max: 25 },
]

export function Sidebar() {
  const { theme } = useTheme()
  const isDark = theme === 'night'

  const tags = useTagsQuery()
  // Tag archives are reached from here; only tags actually used by a story.
  const trendingTags = (tags.data ?? [])
    .filter((tag) => (tag._count?.articles ?? 0) > 0)
    .slice(0, 8)

  const card = isDark
    ? 'bg-zinc-900/50 border-zinc-800/80'
    : 'bg-white border-zinc-200/80'
  const heading = isDark ? 'text-white' : 'text-zinc-900'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const faint = isDark ? 'text-zinc-500' : 'text-zinc-400'
  const rowBorder = isDark ? 'border-zinc-800/70' : 'border-zinc-200/70'
  const navItem = isDark
    ? 'text-zinc-300 hover:bg-zinc-800/70 hover:text-yellow-400'
    : 'text-zinc-700 hover:bg-zinc-100 hover:text-yellow-600'
  const iconMuted = isDark ? 'text-zinc-500' : 'text-zinc-400'
  const widgetTitle = isDark ? 'text-white' : 'text-zinc-900'

  return (
    <aside className="lg:col-span-4 self-start lg:sticky lg:top-44 lg:max-h-[calc(100vh-13.5rem)] lg:overflow-y-auto lg:pr-1 pb-2">
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
            {QUICK_NAV.map((link) => {
              const Icon = link.icon
              return (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-colors ${navItem}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${iconMuted}`} />
                    <span>{link.label}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

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
                  className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider transition-colors ${
                    isDark
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

        {/* 2. Live matches */}
        <section className={`rounded-2xl border ${card} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3
              className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${widgetTitle}`}
            >
              <span className="w-1 h-4 bg-yellow-400 rounded-full" />
              Live Matches
            </h3>
            <span className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Live
            </span>
          </div>
          <ul className="space-y-2">
            {LIVE_MATCHES.map((match) => (
              <li
                key={`${match.home}-${match.away}`}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
                  isDark
                    ? 'bg-zinc-950/50 border-zinc-800/70'
                    : 'bg-zinc-50 border-zinc-200/70'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className={heading}>{match.home}</span>
                  <span className={faint}>vs</span>
                  <span className={heading}>{match.away}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-black tabular-nums ${heading}`}
                  >
                    {match.score}
                  </span>
                  <span
                    className={`text-[10px] font-bold min-w-[26px] text-right ${
                      match.live ? 'text-red-500' : faint
                    }`}
                  >
                    {match.minute}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Mini league table */}
        <section className={`rounded-2xl border ${card} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3
              className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${widgetTitle}`}
            >
              <span className="w-1 h-4 bg-yellow-400 rounded-full" />
              PL Standings
            </h3>
            <span className={`text-[10px] font-bold ${faint}`}>MW 10</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className={`text-[10px] uppercase ${faint}`}>
                <th className="text-left font-bold pb-2 w-6">#</th>
                <th className="text-left font-bold pb-2">Team</th>
                <th className="text-right font-bold pb-2 w-8">P</th>
                <th className="text-right font-bold pb-2 w-10">GD</th>
                <th className="text-right font-bold pb-2 w-8">Pts</th>
              </tr>
            </thead>
            <tbody>
              {STANDINGS.map((row) => (
                <tr
                  key={row.team}
                  className={`border-t ${rowBorder} ${
                    row.pos === 1 ? 'text-yellow-500' : heading
                  }`}
                >
                  <td className="py-2 font-black">{row.pos}</td>
                  <td className="py-2 font-semibold truncate">{row.team}</td>
                  <td className={`py-2 text-right tabular-nums ${muted}`}>
                    {row.p}
                  </td>
                  <td className={`py-2 text-right tabular-nums ${muted}`}>
                    {row.gd}
                  </td>
                  <td className="py-2 text-right font-black tabular-nums">
                    {row.pts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 4. Golden boot race */}
        <section className={`rounded-2xl border ${card} p-4`}>
          <h3
            className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${widgetTitle}`}
          >
            <span className="w-1 h-4 bg-yellow-400 rounded-full" />
            Golden Boot Race
          </h3>
          <ul className="space-y-3">
            {TOP_SCORERS.map((player, idx) => (
              <li key={player.name}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={`font-bold flex items-center gap-2 ${heading}`}>
                    <span className={faint}>{idx + 1}.</span>
                    {player.name}
                  </span>
                  <span className={`font-semibold ${muted}`}>
                    {player.club} ·{' '}
                    <span className="font-black text-yellow-500">
                      {player.goals}
                    </span>
                  </span>
                </div>
                <div
                  className={`h-1.5 rounded-full overflow-hidden ${
                    isDark ? 'bg-zinc-800' : 'bg-zinc-200'
                  }`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-lime-400"
                    style={{ width: `${(player.goals / player.max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 5. Newsletter */}
        <section
          className={`rounded-2xl border p-4 ${
            isDark
              ? 'bg-yellow-400/10 border-yellow-400/30'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <h3
            className={`text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2 ${
              isDark ? 'text-yellow-400' : 'text-yellow-600'
            }`}
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
              className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs focus:outline-none ${
                isDark
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
