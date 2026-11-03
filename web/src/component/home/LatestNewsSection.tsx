import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from './themedContext'
import { useLatestArticles } from '../../api/queries'
import type { ArticleSummary } from '../../api/types'
import { formatCount, relativeTime } from '../../lib/format'

export function LatestNewsSection() {
  const { theme } = useTheme()
  const isDark = theme === 'night'

  // The hero grid consumes the first four stories; this rail shows the next
  // three from the same newest-first feed.
  const latest = useLatestArticles(7)
  const items = (latest.data ?? []).slice(4, 7)
  const surface = isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200/80'
  const borderHover = isDark ? 'hover:border-zinc-700' : 'hover:border-zinc-300'
  const textHeading = isDark ? 'text-white group-hover:text-yellow-400' : 'text-zinc-900 group-hover:text-yellow-600'
  const metaText = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const heading = isDark ? 'text-white' : 'text-zinc-900'

  return (
    // No container of its own: the homepage grid supplies the width and
    // padding so this column can sit beside the sidebar.
    <section
      id="latest-headlines"
      className="mb-10 scroll-mt-32 lg:scroll-mt-44"
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <h3 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
          <span className="w-1.5 h-6 bg-yellow-400 rounded-full" />
          <span className={heading}>LATEST HEADLINES</span>
        </h3>
      </div>

      {latest.isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`h-64 rounded-xl border animate-pulse ${
                isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-100'
              }`}
            />
          ))}
        </div>
      )}

      {!latest.isLoading && items.length === 0 && (
        <div
          className={`rounded-xl border p-8 text-center ${surface}`}
        >
          <p className={`text-sm font-bold ${heading}`}>No more headlines right now</p>
          <p className={`mt-1 text-xs ${metaText}`}>
            Once more than four stories are published, the rest of the feed shows up here.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((item: ArticleSummary) => (
          <article
            key={item.id}
            className={`rounded-xl overflow-hidden transition-all group flex flex-col justify-between ${surface} ${borderHover}`}
          >
            <div className="relative h-44 overflow-hidden">
              {item.coverImage ? (
                <img
                  src={item.coverImage}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-linear-to from-yellow-400/70 to-emerald-500/70" />
              )}
              <span
                className={`absolute top-3 left-3 text-[10px] px-2.5 py-0.5 rounded uppercase ${
                  isDark
                    ? 'bg-black/80 backdrop-blur-md text-yellow-400'
                    : 'bg-black/60 backdrop-blur-md text-yellow-500'
                } font-extrabold`}
              >
                {item.category.name}
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <h4 className={`text-sm font-bold line-clamp-2 ${textHeading}`}>
                <Link to={`/post/${item.slug}`}>{item.title}</Link>
              </h4>
              <div
                className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
                  isDark ? 'border-zinc-800/60 ' + metaText : 'border-zinc-200/60 ' + metaText
                }`}
              >
                <span>{relativeTime(item.publishedAt ?? item.createdAt)}</span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {formatCount(item.commentCount)}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
