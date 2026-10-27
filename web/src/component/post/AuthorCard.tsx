import { useTheme } from '../home/themedContext'
import { formatCount, initials, relativeTime } from '../../lib/format'
import { useNotice } from '../../lib/notice-context'
import type { ArticleSummary } from '../../api/types'

export function AuthorCard({
  name,
  category,
  publishedAt,
}: {
  name: string
  category: string
  publishedAt: string | null
}) {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const notify = useNotice()

  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 ${
        isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200/80'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-yellow-400 via-lime-400 to-emerald-500 text-lg font-black text-black"
          aria-hidden="true"
        >
          {initials(name)}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-[10px] font-black uppercase tracking-widest ${
              isDark ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            Written by
          </p>
          <h3
            className={`text-lg font-extrabold ${
              isDark ? 'text-white' : 'text-zinc-900'
            }`}
          >
            {name}
          </h3>
          <p
            className={`mt-1 text-xs leading-relaxed ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}
          >
            Staff writer covering the {category} desk — match reports, tactical
            breakdowns and transfer reporting for SplashFootball.
          </p>
          <div
            className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold ${
              isDark ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            <span>Published {relativeTime(publishedAt)}</span>
            <button
              type="button"
              onClick={() => notify('Sign in to follow this writer')}
              className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider transition-colors ${
                isDark
                  ? 'border-zinc-700 text-zinc-300 hover:border-yellow-400 hover:text-yellow-400'
                  : 'border-zinc-300 text-zinc-700 hover:border-yellow-500 hover:text-yellow-600'
              }`}
            >
              Follow
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function StatsStrip({ article }: { article: ArticleSummary }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const stats: Array<[string, string]> = [
    ['Views', formatCount(article.views)],
    ['Likes', formatCount(article.likeCount)],
    ['Comments', formatCount(article.commentCount)],
    ['Saves', formatCount(article.bookmarkCount)],
  ]

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border p-4 ${
        isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-white border-zinc-200/80'
      }`}
    >
      {stats.map(([label, value]) => (
        <div key={label} className="text-center">
          <p
            className={`text-xl font-black tabular-nums ${
              isDark ? 'text-white' : 'text-zinc-900'
            }`}
          >
            {value}
          </p>
          <p
            className={`text-[10px] font-black uppercase tracking-widest ${
              isDark ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}
