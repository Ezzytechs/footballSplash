import { ChevronRight, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from '../home/themedContext'
import type { ArticleSummary } from '../../api/types'
import { formatCount } from '../../lib/format'

export function ArticleCard({
  article,
  compact = false,
}: {
  article: ArticleSummary
  compact?: boolean
}) {
  const { theme } = useTheme()
  const isDark = theme === 'night'

  const surface = isDark
    ? 'bg-zinc-900/50 border-zinc-800/80 hover:border-yellow-400/40'
    : 'bg-white border-zinc-200/80 hover:border-yellow-500/40'
  const title = isDark ? 'text-white' : 'text-zinc-900'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'

  return (
    <Link
      to={`/post/${article.slug}`}
      className={`group flex gap-4 rounded-2xl border p-3 transition-all ${surface}`}
    >
      <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-44">
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-yellow-400/70 to-emerald-500/70" />
        )}
        <span
          className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
            isDark ? 'bg-black/80 text-yellow-400' : 'bg-black/70 text-yellow-500'
          }`}
        >
          {article.category.name}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3
          className={`line-clamp-2 text-sm font-bold leading-snug transition-colors group-hover:text-yellow-500 sm:text-base ${title}`}
        >
          {article.title}
        </h3>
        {!compact && article.excerpt && (
          <p className={`mt-1 line-clamp-2 text-xs ${muted}`}>{article.excerpt}</p>
        )}
        <div
          className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium ${muted}`}
        >
          <span>{article.author.name}</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {formatCount(article.views)}
          </span>
          <span className="flex items-center gap-1">
            ♥ {formatCount(article.likeCount)}
          </span>
        </div>
      </div>

      <ChevronRight
        className={`hidden w-4 h-4 shrink-0 self-center transition-transform group-hover:translate-x-1 sm:block ${
          isDark ? 'text-zinc-600' : 'text-zinc-300'
        }`}
      />
    </Link>
  )
}
