import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from '../home/themedContext'
import type { ArticleSummary, TagWithCount } from '../../api/types'
import { formatCount } from '../../lib/format'

/** Three-card strip of related stories, shown at the foot of a post. */
export function SimilarPosts({ articles }: { articles: ArticleSummary[] }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'

  if (articles.length === 0) return null

  const heading = isDark ? 'text-white' : 'text-zinc-900'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'

  return (
    <section aria-labelledby="similar-heading">
      <h2
        id="similar-heading"
        className={`text-xl font-extrabold flex items-center gap-2 mb-4 ${heading}`}
      >
        <span className="w-1.5 h-6 bg-yellow-400 rounded-full" />
        Similar posts
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.slice(0, 3).map((article) => (
          <Link
            key={article.id}
            to={`/post/${article.slug}`}
            className={`group overflow-hidden rounded-2xl border transition-all ${
              isDark
                ? 'border-zinc-800/80 bg-zinc-900/50 hover:border-yellow-400/40'
                : 'border-zinc-200/80 bg-white hover:border-yellow-500/40'
            }`}
          >
            <div className="relative h-36 overflow-hidden">
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
                className={`absolute left-3 top-3 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                  isDark
                    ? 'bg-black/80 text-yellow-400'
                    : 'bg-black/70 text-yellow-500'
                }`}
              >
                {article.category.name}
              </span>
            </div>
            <div className="p-4">
              <h3
                className={`line-clamp-2 text-sm font-bold leading-snug transition-colors group-hover:text-yellow-500 ${heading}`}
              >
                {article.title}
              </h3>
              <div
                className={`mt-3 flex items-center justify-between text-[11px] font-semibold ${muted}`}
              >
                <span>{article.author.name}</span>
                <span>♥ {formatCount(article.likeCount)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

/** Ranked "Trending now" list driven by /articles/popular. */
export function TrendingList({ articles }: { articles: ArticleSummary[] }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'

  if (articles.length === 0) return null

  const heading = isDark ? 'text-white' : 'text-zinc-900'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const rowBorder = isDark ? 'border-zinc-800/70' : 'border-zinc-200/70'

  return (
    <section
      className={`rounded-2xl border p-4 ${
        isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200/80'
      }`}
      aria-labelledby="trending-heading"
    >
      <h3
        id="trending-heading"
        className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${heading}`}
      >
        <span className="w-1 h-4 bg-yellow-400 rounded-full" />
        Trending now
      </h3>
      <ol className="space-y-3">
        {articles.map((article, index) => (
          <li key={article.id} className={`border-t first:border-t-0 pt-3 first:pt-0 ${rowBorder}`}>
            <Link to={`/post/${article.slug}`} className="group flex gap-3">
              <span
                className={`text-2xl font-black leading-none tabular-nums ${
                  isDark ? 'text-zinc-700' : 'text-zinc-200'
                } group-hover:text-yellow-400`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span
                  className={`line-clamp-2 text-xs font-bold leading-snug transition-colors group-hover:text-yellow-500 ${heading}`}
                >
                  {article.title}
                </span>
                <span className={`mt-1 block text-[10px] font-semibold ${muted}`}>
                  {formatCount(article.views)} views
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Tag cloud linking into the tag archive pages. */
export function TagCloud({ tags }: { tags: TagWithCount[] }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'

  const usable = tags
    .filter((tag) => (tag._count?.articles ?? 0) > 0)
    .sort((a, b) => (b._count?.articles ?? 0) - (a._count?.articles ?? 0))
    .slice(0, 14)

  if (usable.length === 0) return null

  const heading = isDark ? 'text-white' : 'text-zinc-900'

  return (
    <section
      className={`rounded-2xl border p-4 ${
        isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200/80'
      }`}
      aria-labelledby="tags-heading"
    >
      <h3
        id="tags-heading"
        className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${heading}`}
      >
        <span className="w-1 h-4 bg-yellow-400 rounded-full" />
        Browse tags
      </h3>
      <div className="flex flex-wrap gap-2">
        {usable.map((tag) => (
          <Link
            key={tag.id}
            to={`/tag/${tag.slug}`}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${
              isDark
                ? 'border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-yellow-400/60 hover:text-yellow-400'
                : 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:border-yellow-500/60 hover:text-yellow-600'
            }`}
          >
            {tag.name}
            <span
              className={`text-[10px] font-black tabular-nums ${
                isDark ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              {tag._count?.articles ?? 0}
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-4">
        <Link
          to="/tag/premier-league"
          className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider transition-colors ${
            isDark
              ? 'text-yellow-400 hover:text-yellow-300'
              : 'text-yellow-600 hover:text-yellow-700'
          }`}
        >
          All tags <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </section>
  )
}
