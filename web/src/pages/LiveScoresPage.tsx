import { useMemo, useState } from 'react'
import { Activity, ChevronRight, Clock, RefreshCw, Trophy } from 'lucide-react'
import { useTheme } from '../component/home/themedContext'
import { useLiveMatches } from '../api/queries'
import type { LiveMatch } from '../api/types'

/** Statuses the provider reports while a fixture is still in progress. */
const LIVE_STATES = new Set(['L', 'LIVE', 'PLAYING', 'HT', 'P1', 'P2'])

function isLiveMatch(match: LiveMatch) {
  return LIVE_STATES.has(match.status)
}

function kickoffTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ScoreBox({ match }: { match: LiveMatch }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const live = isLiveMatch(match)
  const hasScore = match.homeScore !== null && match.awayScore !== null

  if (!hasScore) {
    return (
      <span
        className={`flex min-w-[62px] items-center justify-center rounded-lg px-2 py-1 text-[11px] font-black tabular-nums ${
          isDark ? 'bg-zinc-800/80 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
        }`}
      >
        {kickoffTime(match.scheduledAt)}
      </span>
    )
  }

  return (
    <span
      className={`flex min-w-[62px] items-center justify-center gap-1 rounded-lg px-2 py-1 text-sm font-black tabular-nums ${
        live
          ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20'
          : isDark
            ? 'bg-zinc-800 text-white'
            : 'bg-zinc-900 text-white'
      }`}
    >
      <span>{match.homeScore}</span>
      <span className={live ? 'text-black/50' : 'text-white/40'}>–</span>
      <span>{match.awayScore}</span>
    </span>
  )
}

function MatchRow({ match, index }: { match: LiveMatch; index: number }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const live = isLiveMatch(match)

  return (
    <div
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
      className={`group grid animate-[fadeIn_0.35s_ease-out_both] grid-cols-[1fr_auto_1fr] items-center gap-2 border-b px-3 py-3 last:border-b-0 sm:gap-4 sm:px-4 ${
        isDark
          ? 'border-zinc-800/70 hover:bg-zinc-800/30'
          : 'border-zinc-100 hover:bg-zinc-50'
      } transition-colors`}
    >
      <div className="min-w-0 text-right">
        <p
          className={`truncate text-[13px] font-bold leading-tight sm:text-sm ${
            isDark ? 'text-zinc-100' : 'text-zinc-900'
          } ${live ? '' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
          title={match.homeTeam}
        >
          {match.homeTeam}
        </p>
      </div>

      <div className="flex flex-col items-center gap-1">
        <ScoreBox match={match} />
        {live ? (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-yellow-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-yellow-500" />
            </span>
            Live
          </span>
        ) : (
          <span
            className={`text-[9px] font-black uppercase tracking-wider ${
              isDark ? 'text-zinc-600' : 'text-zinc-400'
            }`}
          >
            {match.status}
          </span>
        )}
      </div>

      <div className="min-w-0 text-left">
        <p
          className={`truncate text-[13px] font-bold leading-tight sm:text-sm ${
            isDark ? 'text-zinc-100' : 'text-zinc-900'
          } ${live ? '' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
          title={match.awayTeam}
        >
          {match.awayTeam}
        </p>
      </div>
    </div>
  )
}

function LeagueCard({
  league,
  matches,
  isDark,
}: {
  league: string
  matches: LiveMatch[]
  isDark: boolean
}) {
  const liveCount = matches.filter(isLiveMatch).length

  return (
    <section
      className={`overflow-hidden rounded-2xl border shadow-sm transition-colors ${
        isDark
          ? 'border-zinc-800 bg-zinc-900/40 shadow-black/20'
          : 'border-zinc-200 bg-white shadow-zinc-200/40'
      }`}
    >
      <header
        className={`flex items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-4 ${
          isDark
            ? 'border-zinc-800 bg-zinc-900/60'
            : 'border-zinc-100 bg-zinc-50/80'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
              isDark ? 'bg-yellow-400/10 text-yellow-400' : 'bg-yellow-400/15 text-yellow-600'
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
          </span>
          <h3
            className={`truncate text-[11px] font-black uppercase tracking-widest sm:text-xs ${
              isDark ? 'text-zinc-100' : 'text-zinc-900'
            }`}
            title={league}
          >
            {league}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {liveCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-400/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-yellow-500">
              <span className="h-1 w-1 rounded-full bg-yellow-500" />
              {liveCount} live
            </span>
          )}
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
              isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200/70 text-zinc-500'
            }`}
          >
            {matches.length}
          </span>
        </div>
      </header>

      <div>
        {matches.map((match, index) => (
          <MatchRow key={match.id} match={match} index={index} />
        ))}
      </div>
    </section>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  return (
    <div className="flex flex-col">
      <span
        className={`text-xl font-black tabular-nums leading-none sm:text-2xl ${
          accent ? 'text-yellow-400' : isDark ? 'text-white' : 'text-zinc-900'
        }`}
      >
        {value}
      </span>
      <span
        className={`mt-1 text-[9px] font-black uppercase tracking-widest ${
          isDark ? 'text-zinc-500' : 'text-zinc-500'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

export function LiveScoresPage() {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const feed = useLiveMatches()
  const matches = useMemo(() => feed.data?.matches ?? [], [feed.data])
  const [activeLeague, setActiveLeague] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const buckets = new Map<string, LiveMatch[]>()
    for (const match of matches) {
      const key = match.league ?? 'Unassigned'
      const bucket = buckets.get(key)
      if (bucket) bucket.push(match)
      else buckets.set(key, [match])
    }
    return Array.from(buckets.entries()).map(([league, list]) => ({
      league,
      matches: list,
      live: list.filter(isLiveMatch).length,
    }))
  }, [matches])

  const ordered = useMemo(() => {
    const named = grouped.filter(
      (g) => !/^Competition \d+$/.test(g.league) && g.league !== 'Unassigned',
    )
    const unnamed = grouped.filter(
      (g) => /^Competition \d+$/.test(g.league) || g.league === 'Unassigned',
    )
    named.sort((a, b) => b.live - a.live || a.league.localeCompare(b.league))
    unnamed.sort((a, b) => b.live - a.live || b.matches.length - a.matches.length)
    return [...named, ...unnamed]
  }, [grouped])

  const visible = activeLeague
    ? ordered.filter((group) => group.league === activeLeague)
    : ordered

  const liveTotal = matches.filter(isLiveMatch).length
  const leagueTotal = grouped.length

  return (
    <div className={`${isDark ? 'text-white' : 'text-zinc-900'}`}>
      {/* Masthead */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-5 sm:p-7 ${
          isDark
            ? 'border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-yellow-500/[0.06]'
            : 'border-zinc-200 bg-gradient-to-br from-white via-white to-yellow-400/10'
        }`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-yellow-400/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-yellow-400/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-yellow-500">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-yellow-500" />
                </span>
                {liveTotal > 0 ? `${liveTotal} live now` : 'Feed idle'}
              </span>
              {feed.isFetching && (
                <span
                  className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${
                    isDark ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  <Activity className="h-3 w-3 animate-pulse" />
                  Updating
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
              Live Scores
            </h1>
            <p
              className={`mt-2 max-w-xl text-xs sm:text-sm ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              Every fixture in play right now, grouped by competition and
              refreshed automatically.
            </p>

            <div className="mt-5 flex items-center gap-6 sm:gap-8">
              <Stat label="Live" value={String(liveTotal)} accent />
              <Stat label="Fixtures" value={String(matches.length)} />
              <Stat label="Competitions" value={String(leagueTotal)} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void feed.refetch()}
            disabled={feed.isFetching}
            className={`inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-60 ${
              isDark
                ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${feed.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* League filter rail */}
      {leagueTotal > 0 && (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveLeague(null)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
              activeLeague === null
                ? 'border-yellow-400 bg-yellow-400 text-black'
                : isDark
                  ? 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-800'
            }`}
          >
            All
          </button>

          {ordered.map((group) => {
            const active = activeLeague === group.league
            return (
              <button
                key={group.league}
                type="button"
                onClick={() => setActiveLeague(active ? null : group.league)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  active
                    ? 'border-yellow-400 bg-yellow-400 text-black'
                    : isDark
                      ? 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-800'
                }`}
                title={group.league}
              >
                <span className="max-w-[9rem] truncate">{group.league}</span>
                <span className={active ? 'text-black/50' : 'opacity-60'}>
                  {group.matches.length}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Feed */}
      {feed.isLoading ? (
        <div className="mt-6 space-y-4">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`h-32 animate-pulse rounded-2xl border ${
                isDark
                  ? 'border-zinc-800 bg-zinc-900/60'
                  : 'border-zinc-200 bg-zinc-50'
              }`}
            />
          ))}
        </div>
      ) : feed.isError ? (
        <div
          className={`mt-6 flex flex-col items-center gap-3 rounded-2xl border p-10 text-center ${
            isDark ? 'border-red-500/20 text-red-300' : 'border-red-200 text-red-600'
          }`}
        >
          <Clock className="h-6 w-6" />
          <p className="text-sm font-semibold">
            Could not load the live feed. Please try again.
          </p>
          <button
            type="button"
            onClick={() => void feed.refetch()}
            className="rounded-xl bg-yellow-400 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black transition-colors hover:bg-yellow-300"
          >
            Retry
          </button>
        </div>
      ) : visible.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visible.map((group) => (
            <LeagueCard
              key={group.league}
              league={group.league}
              matches={group.matches}
              isDark={isDark}
            />
          ))}
        </div>
      ) : (
        <div
          className={`mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed p-12 text-center ${
            isDark ? 'border-zinc-700 text-zinc-500' : 'border-zinc-300 text-zinc-400'
          }`}
        >
          <Trophy className="h-7 w-7" />
          <p className="text-sm font-semibold">
            No matches are live right now. Check back at kick-off.
          </p>
        </div>
      )}

      <p
        className={`mt-8 flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest ${
          isDark ? 'text-zinc-600' : 'text-zinc-400'
        }`}
      >
        Scores refresh automatically every 30 seconds
        <ChevronRight className="h-3 w-3" />
      </p>
    </div>
  )
}
