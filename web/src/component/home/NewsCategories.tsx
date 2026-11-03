import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowLeftRight,
  ArrowRight,
  Clock,
  Globe,
  MessageCircle,
  Newspaper,
  Shirt,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { useTheme } from './themedContext'
import { useCategoryArticles } from '../../api/queries'
import { useCategorySlots } from './categorySlots'
import type { ArticleSummary, CategoryWithCount } from '../../api/types'
import { formatCount, relativeTime } from '../../lib/format'

/** Icon + accent per known category slug; new categories get sensible defaults. */
const CATEGORY_STYLE: Record<string, { icon: LucideIcon; chip: string; accentText: string }> = {
  'premier-league': { icon: Shirt, chip: 'bg-fuchsia-600 text-white', accentText: 'text-fuchsia-500' },
  'champions-league': { icon: Trophy, chip: 'bg-emerald-500 text-black', accentText: 'text-emerald-500' },
  transfers: { icon: ArrowLeftRight, chip: 'bg-yellow-400 text-black', accentText: 'text-yellow-500' },
  'world-football': { icon: Globe, chip: 'bg-cyan-500 text-black', accentText: 'text-cyan-500' },
}

const FALLBACK_STYLE = {
  icon: Newspaper,
  chip: 'bg-yellow-400 text-black',
  accentText: 'text-yellow-500',
}

/** At least this many categories get a section when the newsroom has them. */
const MIN_SECTIONS = 5
const MAX_SECTIONS = 6
/** One lead story plus four recent rows = the five stories each section shows. */
const PER_CATEGORY = 6
const LIST_COUNT = 4

function ArticleMeta({ article, className }: { article: ArticleSummary; className: string }) {
  return (
    <div className={`flex items-center gap-3 text-[11px] font-medium ${className}`}>
      <span className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {relativeTime(article.publishedAt ?? article.createdAt)}
      </span>
      <span className="flex items-center gap-1">
        <MessageCircle className="w-3 h-3" />
        {formatCount(article.commentCount)}
      </span>
    </div>
  )
}

/**
 * One category: heading with a See more link, its newest story as a wide lead
 * card, then the next four as a compact list. Each block fetches its own
 * category feed so a quiet category never empties the other sections.
 */
function CategoryBlock({
  category,
  style,
}: {
  category: CategoryWithCount
  style: { icon: LucideIcon; chip: string; accentText: string }
}) {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const feed = useCategoryArticles(category.slug, PER_CATEGORY)

  const articles = feed.data ?? []
  const [featured, ...rest] = articles
  const list = rest.slice(0, LIST_COUNT)

  const Icon = style.icon
  const card = isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200/80'
  const rowBorder = isDark ? 'border-zinc-800/70' : 'border-zinc-200/70'
  const heading = isDark ? 'text-white' : 'text-zinc-900'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const faint = isDark ? 'text-zinc-500' : 'text-zinc-400'
  const seeMore = isDark
    ? 'border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-yellow-400/60 hover:text-yellow-400'
    : 'border-zinc-200 bg-white text-zinc-700 hover:border-yellow-500/60 hover:text-yellow-600'

  return (
    <section id={category.slug} className="scroll-mt-32">
      {/* Heading + See more */}
      <div
        className={`flex flex-col gap-3 rounded-2xl border p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between lg:mb-0 lg:px-0 ${rowBorder}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${style.chip}`}
          >
            <Icon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h2
              className={`text-base font-extrabold uppercase tracking-tight leading-tight ${heading}`}
            >
              {category.name}
            </h2>
            <p className={`text-xs font-semibold truncate ${faint}`}>
              {category._count?.articles ?? 0} published
            </p>
          </div>
        </div>

        <Link
          to={`/category/${category.slug}`}
          className={`shrink-0 flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-colors ${seeMore}`}
        >
          See more <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {feed.isLoading && (
        <div className="space-y-3">
          <div
            className={`h-48 sm:h-56 rounded-2xl border animate-pulse ${isDark ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-200 bg-zinc-50"}`}
          />
          <div
            className={`h-20 rounded-2xl border animate-pulse ${isDark ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-200 bg-zinc-50"}`}
          />
        </div>
      )}

      {!feed.isLoading && feed.isError && (
        <div className={`rounded-2xl border p-4 text-center ${card}`}>
          <p className={`text-xs font-bold ${heading}`}>
            This category could not be loaded
          </p>
          <button
            type="button"
            onClick={() => void feed.refetch()}
            className="mt-2 text-[11px] font-bold text-yellow-500 transition-colors hover:text-yellow-400"
          >
            Try again
          </button>
        </div>
      )}

      {!feed.isLoading && !feed.isError && articles.length === 0 && (
        <div
          className={`mt-2 flex items-center gap-2 rounded-xl border px-2 py-1.5 text-xs ${card}`}
        >
          <Newspaper className={`w-3.5 h-3.5 ${muted}`} />
          <span className={muted}>No stories yet</span>
        </div>
      )}

      {featured && (
        <>
          {/* Lead story: wide card, image on the left at sm and up. */}
          <Link
            to={`/post/${featured.slug}`}
            className={`group relative overflow-hidden rounded-2xl border transition-colors sm:grid sm:grid-cols-[1.05fr_1fr] ${card} ${
              isDark
                ? "hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/5"
                : "hover:border-yellow-500/40 hover:shadow-lg hover:shadow-yellow-500/8"
            }`}
          >
            <div className="relative h-44 overflow-hidden sm:h-full">
              {featured.coverImage ? (
                <img
                  src={featured.coverImage}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-linear-to-br from-yellow-400/70 to-emerald-500/70" />
              )}
              <span
                className={`absolute left-2.5 top-2.5 rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${style.chip}`}
              >
                {featured.category.name}
              </span>
            </div>

            <div className="flex flex-col justify-between p-4 sm:p-5">
              <div>
                <p
                  className={`text-[10px] font-black uppercase tracking-widest ${style.accentText}`}
                >
                  Top story
                </p>
                <h3
                  className={`mt-1.5 text-base font-extrabold leading-snug line-clamp-2 transition-colors sm:text-lg xl:text-xl ${
                    isDark
                      ? "text-white group-hover:text-yellow-400"
                      : "text-zinc-900 group-hover:text-yellow-600"
                  }`}
                >
                  {featured.title}
                </h3>
                {featured.excerpt && (
                  <p
                    className={`mt-1.5 hidden line-clamp-2 text-xs leading-relaxed sm:block ${muted}`}
                  >
                    {featured.excerpt}
                  </p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <ArticleMeta article={featured} className={faint} />
                <span
                  className={`flex shrink-0 items-center gap-1 text-[10px] font-black uppercase tracking-wider ${style.accentText}`}
                >
                  Read <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Link>

          {/* The rest of the recent stories, as a compact list. */}
          {list.length > 0 && (
            <ul className={`mt-3 overflow-hidden rounded-xl border ${card}`}>
              {list.map((article, index) => (
                <li
                  key={article.id}
                  className={index === 0 ? "" : `border-t ${rowBorder}`}
                >
                  <Link
                    to={`/post/${article.slug}`}
                    className={`group flex items-center gap-3 p-3 transition-colors hover:bg-yellow-400/6 ${isDark ? "hover:bg-yellow-400/5" : ""}`}
                  >
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                      {article.coverImage ? (
                        <img
                          src={article.coverImage}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-linear-to-br from-yellow-400/60 to-emerald-500/60" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-sm font-bold leading-snug line-clamp-2 transition-colors ${isDark ? "text-white group-hover:text-yellow-400" : "text-zinc-900 group-hover:text-yellow-600"}`}
                      >
                        {article.title}
                      </h4>
                      <ArticleMeta
                        article={article}
                        className={`mt-1.5 text-xs ${faint}`}
                      />
                    </div>

                    <ArrowRight
                      className={`hidden w-4 h-4 shrink-0 self-center transition-transform group-hover:translate-x-1 sm:block ${faint}`}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

export function NewsCategories() {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const slots = useCategorySlots()
  const location = useLocation()

  /**
   * Categories this block renders. The navbar and sidebar own their own lists,
   * so their leftovers go first; when fewer than five categories are left over,
   * the most-published remaining ones fill the block up to five anyway.
   *
   * A category with no published stories is dropped entirely, so an empty
   * category never leaves a blank heading, dash, or section block.
   */
  const pool = useMemo<CategoryWithCount[]>(() => {
    const picked = slots.body
      .filter((category) => (category._count?.articles ?? 0) > 0)
      .slice(0, MAX_SECTIONS)
    if (picked.length >= MIN_SECTIONS) return picked

    const filler = [...slots.sidebar, ...slots.nav]
      .filter((category) => !picked.some((item) => item.id === category.id))
      .filter((category) => (category._count?.articles ?? 0) > 0)
      .sort((a, b) => (b._count?.articles ?? 0) - (a._count?.articles ?? 0))

    return [...picked, ...filler].slice(0, Math.min(MAX_SECTIONS, Math.max(MIN_SECTIONS, picked.length)))
  }, [slots.body, slots.sidebar, slots.nav])

  const published = pool.reduce((sum, category) => sum + (category._count?.articles ?? 0), 0)
  const isOnHomepage = location.pathname === '/'
  // Nothing to manage on a storyless front page; the dashboard link stays off.
  const canSeeDashboard = published > 0 && isOnHomepage

  if (!slots.isLoading && pool.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2
          className={`text-lg sm:text-xl font-extrabold flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-zinc-900'
          }`}
        >
          <span className="w-1.5 h-6 bg-yellow-400 rounded-full shrink-0" />
          NEWS BY CATEGORY
        </h2>
        <span className={`text-xs font-semibold shrink-0 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {slots.isLoading
            ? 'Loading…'
            : `${pool.length} section${pool.length === 1 ? '' : 's'}`}
          {!slots.isLoading && pool.length > 1 && (
            <span className="lg:hidden"> · swipe</span>
          )}
        </span>
      </div>

      {slots.isLoading && (
        <div className="space-y-4">
          {[0, 1].map((index) => (
            <div
              key={index}
              className={`h-64 rounded-2xl border animate-pulse ${
                isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'
              }`}
            />
          ))}
        </div>
      )}

      {!slots.isLoading && published === 0 && (
        <div
          className={`rounded-2xl border p-10 text-center ${
            isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'
          }`}
        >
          <Newspaper className={`mx-auto w-8 h-8 ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`} />
          <p className={`mt-3 text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            The newsroom is quiet
          </p>
          <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Category sections appear as soon as stories are published.
          </p>
          {canSeeDashboard ? (
            <Link
              to="/admin"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-yellow-300"
            >
              Open the dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : null}
        </div>
      )}

      {!slots.isLoading && published > 0 && (
        <div className="space-y-6 pb-3 xl:pb-0">
          {pool.map((category) => (
            <div key={category.id}>
              <CategoryBlock
                category={category}
                style={CATEGORY_STYLE[category.slug] ?? FALLBACK_STYLE}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
