import { Calendar, RefreshCw, Trophy, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from './themedContext'
import { useLiveMatches } from '../../api/queries'
import type { LiveMatch } from '../../api/types'

/** A match in the live-scores feed, with its current score rendered visibly. */
export interface LiveScore {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  status: string
  scheduledAt: string | null
  league: string | null
}

function ScoreRow({
  home,
  away,
  isLive,
}: {
  home: number
  away: number
  isLive: boolean
}) {
  if (!isLive) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
        SCHEDULED
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wider">
      <span className="text-zinc-400">{home}</span>
      <span className="text-zinc-300">-</span>
      <span className="text-zinc-400">{away}</span>
    </span>
  )
}

function MatchRow({ match }: { match: LiveMatch }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const isLive = match.status === 'L' || match.status === 'LIVE' || match.status === 'PLAYING'

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
        isDark ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-200 bg-white'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-400/10 text-yellow-500">
          <Trophy className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-black truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {match.homeTeam} <span className="text-[10px] font-medium font-normal">v</span> {match.awayTeam}
          </p>
          <p className={`text-[9px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {match.league ?? 'Football'} · {new Date(match.scheduledAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3">
        <ScoreRow home={match.homeScore ?? 0} away={match.awayScore ?? 0} isLive={isLive} />
        <span className={`text-[9px] font-black uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {match.status}
        </span>
        {match.status === 'HT' || match.status === 'P1' || match.status === 'P2' ? (
          <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            <Calendar className="w-3 h-3" />
            {match.scheduledAt ? new Date(match.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
          </span>
        ) : null}
      </div>
    </div>
  )
}

/** Last five live or upcoming matches, the football fan's pivot on the homepage. */ 
export function LiveScoreSection() {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const feed = useLiveMatches()
  const matches = feed.data?.matches ?? []

  return (
    <section className="rounded-2xl border border-yellow-400/10 bg-gradient-to-b from-yellow-400/5 to-transparent p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h2 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            LIVE SCORES
          </h2>
          <span className="rounded-full bg-yellow-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-yellow-500">
            {matches.length}
          </span>
          <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-yellow-400" />
        </div>

        <Link
          to="/live-scores"
          className="shrink-0 flex items-center gap-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-yellow-500 transition-colors hover:bg-yellow-400/20">
          <RefreshCw className="w-3 h-3" />
          See more
        </Link>
      </div>      {feed.isFetching && !feed.isLoading && (
        <div className={`mt-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          <Activity className="w-3 h-3 animate-pulse" />
          Updating live scores…
        </div>
      )}

      {feed.isLoading ? (
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`h-12 animate-pulse rounded-xl border ${isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50'}`}
            />
          ))}
        </div>
      ) : feed.isError ? (
        <div className={`mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 p-3 text-xs ${isDark ? 'text-red-300' : 'text-red-600'}`}>
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          Could not load live scores. Retrying shortly.
        </div>
      ) : (
        <>
          {matches.slice(0, 5).map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
          {matches.length > 5 && (
            <div className="mt-2 text-center">
              <Link
                to="/live-scores"
                className="text-[11px] font-black uppercase tracking-wider text-yellow-500 transition-colors hover:text-yellow-400"
              >
                View all {matches.length} live matches <span aria-hidden>&rarr;</span>
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  )
}
