import { useTheme } from '../component/home/themedContext'
import { useLiveMatches } from '../api/queries'
import type { LiveMatch } from '../api/types'
import { TrendingUp } from 'lucide-react'

function ScoreChip({
  home,
  away,
  isLive,
}: {
  home: number | null
  away: number | null
  isLive: boolean
}) {
  if (isLive) {
    return (
      <span className="flex items-center gap-0.5 rounded-md bg-yellow-400/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-yellow-500">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
        LIVE
      </span>
    )
  }

  if (home === null || away === null) {
    return (
      <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-zinc-400">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
        SCHEDULED
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 text-sm font-black uppercase tracking-wider">
      <span className="text-zinc-400">{home}</span>
      <span className="text-zinc-300">-</span>
      <span className="text-zinc-400">{away}</span>
    </span>
  )
}

function MatchCard({ match }: { match: LiveMatch }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const isLive = match.status === 'L' || match.status === 'LIVE' || match.status === 'PLAYING'

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
        isDark ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-200 bg-white'
      }`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
          <span className={`text-2xl font-black ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
            {match.homeTeam.charAt(0)}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className={`text-base font-black truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {match.homeTeam} <span className="text-sm font-medium font-normal">v</span> {match.awayTeam}
          </h3>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {match.league ?? 'Football'} · {new Date(match.scheduledAt || Date.now()).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4">
        <ScoreChip home={match.homeScore} away={match.awayScore} isLive={isLive} />
        <span className={`text-xs font-black uppercase tracking-wider ${isLive ? 'text-yellow-500' : isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {match.status === 'L' || match.status === 'LIVE' || match.status === 'PLAYING' ? 'LIVE' : 'UPCOMING'}
        </span>
      </div>
    </div>
  )
}

function LeagueGroup({ group, isDark }: { group: { league: string; matches: LiveMatch[] }; isDark: boolean }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-yellow-500" />
        <h3 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-zinc-900'}`}>
          {group.league}
        </h3>
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {group.matches.length} match{group.matches.length !== 1 ? 'es' : ''}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {group.matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  )
}

export function LiveScoresPage() {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const feed = useLiveMatches()
  const { matches } = feed.data ?? { matches: [] }

  // Group the flat live feed by league so the "View all" step renders each
  // league as its own card rather than one long list.
  const grouped = new Map<string, LiveMatch[]>()
  for (const match of matches) {
    const key = match.league ?? 'Unassigned'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(match)
  }
  const groups = Array.from(grouped.entries()).map(([league, group]) => ({
    league,
    count: group.length,
    matches: group,
  }))

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Live Scores</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Live football scores, grouped by league and updated as the fixtures progress.
          </p>
        </div>

        <div className="flex gap-2">
          <a
            href="https://free-api-live-football-data.p.rapidapi.com/football-current-live"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-yellow-400/20 px-4 py-2 text-xs font-black uppercase tracking-widest text-yellow-500 transition-colors hover:bg-yellow-400/10"
          >
            Source API
          </a>
        </div>
      </div>

      {feed.isLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`h-28 animate-pulse rounded-2xl border ${isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50'}`}
            />
          ))}
        </div>
      ) : feed.isError ? (
        <div className={`mt-6 rounded-2xl border border-red-500/20 p-6 text-center text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>
          Could not load live scores from the API. Check your key or network, then retry.
        </div>
      ) : groups.length > 0 ? (
        <div className="mt-6 space-y-6">
          {groups.map((group) => (
            <LeagueGroup key={group.league} group={group} isDark={isDark} />
          ))}
        </div>
      ) : (
        <div className={`mt-6 rounded-2xl border border-dashed p-10 text-center text-sm ${isDark ? 'border-zinc-700 text-zinc-500' : 'border-zinc-300 text-zinc-400'}`}>
          No matches currently live or scheduled.
        </div>
      )}
    </div>
  )
}
