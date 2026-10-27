import { useEffect, useRef } from 'react'
import {
  ChevronRight,
  Hash,
  LayoutGrid,
  Loader2,
  Newspaper,
  Tag as TagIcon,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Footer } from '../component/home/Footer'
import { Navbar } from '../component/home/Navbar'
import { ThemedApp } from '../component/home/ThemedApp'
import { useTheme } from '../component/home/themedContext'
import { ArticleCard } from '../component/shared/ArticleCard'
import { TagCloud, TrendingList } from '../component/post/SideRail'
import {
  useCategoriesQuery,
  useCategoryArticlesQuery,
  usePopularArticles,
  useTagArticlesQuery,
  useTagsQuery,
} from '../api/queries'
import { formatCount } from '../lib/format'
import { NoticeProvider } from '../lib/notice'

const PAGE_SIZE = 6

export type ListingKind = 'tag' | 'category'

/**
 * The tag and category archives are the same page with different data
 * sources and copy, so they share this implementation.
 */
export function ListingPage({ kind }: { kind: ListingKind }) {
  return (
    <ThemedApp>
      <NoticeProvider>
        <ListingView kind={kind} />
      </NoticeProvider>
    </ThemedApp>
  )
}

function ListingView({ kind }: { kind: ListingKind }) {
  const { slug } = useParams()
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const isTag = kind === 'tag'

  // Only the archive for the active route is enabled; the other stays idle.
  const tagFeed = useTagArticlesQuery(isTag ? slug : undefined, PAGE_SIZE)
  const categoryFeed = useCategoryArticlesQuery(isTag ? undefined : slug, PAGE_SIZE)
  const feed = isTag ? tagFeed : categoryFeed

  const popular = usePopularArticles(5)
  const tags = useTagsQuery()
  const categories = useCategoriesQuery()

  const articles = feed.data?.pages.flatMap((page) => page.items) ?? []
  const total = feed.data?.pages[0]?.meta.total ?? 0

  // TagWithCount and CategoryWithCount share this shape, so one array type
  // drives the chip row for both kinds.
  const chips: Array<{
    id: string
    name: string
    slug: string
    _count?: { articles: number }
  }> = isTag ? tags.data ?? [] : categories.data ?? []
  const current = chips.find((item) => item.slug === slug)
  const name = current?.name ?? slug ?? ''
  const browseFallback =
    slug === 'premier-league'
      ? { to: '/', label: 'Back to the homepage' }
      : {
          to: `${isTag ? '/tag' : '/category'}/premier-league`,
          label: 'Browse Premier League',
        }

  // Infinite scroll: the sentinel sits 400px below the fold, so the next
  // page is already on screen before the visitor reaches the absolute bottom.
  const sentinel = useRef<HTMLDivElement | null>(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed

  useEffect(() => {
    const node = sentinel.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const pageSurface = isDark ? 'bg-[#070b10]' : 'bg-white'
  const heading = isDark ? 'text-white' : 'text-zinc-900'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const faint = isDark ? 'text-zinc-500' : 'text-zinc-400'
  const HeaderIcon = isTag ? Hash : LayoutGrid

  return (
    <div className={`min-h-screen flex flex-col ${pageSurface}`}>
      <Navbar />

      <main className="flex-1">
        {/* ------------------------------------------------------ header */}
        <header
          className={`border-b ${isDark ? 'border-zinc-900' : 'border-zinc-200'}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <nav
              aria-label="Breadcrumb"
              className={`flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider ${faint}`}
            >
              <Link to="/" className="transition-colors hover:text-yellow-500">
                Home
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span>{isTag ? 'Tags' : 'Categories'}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="truncate text-yellow-500">{slug}</span>
            </nav>

            <div className="mt-5 flex items-start gap-4">
              <span
                className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${
                  isDark
                    ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                    : 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                }`}
              >
                <HeaderIcon className="w-7 h-7" />
              </span>
              <div className="min-w-0">
                <h1
                  className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.06] tracking-tight break-words ${heading}`}
                >
                  {name}
                </h1>
                <p className={`mt-2 text-sm ${muted}`}>
                  {feed.isLoading
                    ? 'Loading stories…'
                    : `${formatCount(total)} ${
                        total === 1 ? 'story' : 'stories'
                      } ${
                        isTag ? 'tagged with this topic' : 'in this category'
                      }`}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {chips
                .filter((item) => (item._count?.articles ?? 0) > 0)
                .slice(0, 10)
                .map((item) => (
                  <Link
                    key={item.id}
                    to={`${isTag ? '/tag' : '/category'}/${item.slug}`}
                    className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider transition-colors ${
                      item.slug === slug
                        ? isDark
                          ? 'border-yellow-400/60 bg-yellow-400/10 text-yellow-400'
                          : 'border-yellow-500/60 bg-yellow-50 text-yellow-600'
                        : isDark
                          ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-yellow-400/60 hover:text-yellow-400'
                          : 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:border-yellow-500/60 hover:text-yellow-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
            </div>
          </div>
        </header>

        {/* ------------------------------------------------------- feed */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <h2
                className={`text-xl font-extrabold flex items-center gap-2 ${heading}`}
              >
                <span className="w-1.5 h-6 bg-yellow-400 rounded-full" />
                Latest stories
              </h2>
              <span className={`text-xs font-semibold ${faint}`}>
                {articles.length > 0 && `Showing ${articles.length} of ${formatCount(total)}`}
              </span>
            </div>

            {feed.isLoading && (
              <div className="space-y-4">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`h-32 animate-pulse rounded-2xl border ${
                      isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'
                    }`}
                  />
                ))}
              </div>
            )}

            {feed.isError && (
              <div
                className={`rounded-2xl border p-8 text-center ${
                  isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'
                }`}
              >
                <p className={`text-sm font-bold ${heading}`}>
                  This {kind} could not be loaded
                </p>
                <p className={`mt-1 text-xs ${muted}`}>
                  Check that the API server is running, then refresh the page.
                </p>
                <button
                  type="button"
                  onClick={() => void feed.refetch()}
                  className="mt-4 rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-yellow-300"
                >
                  Try again
                </button>
              </div>
            )}

            {!feed.isLoading && !feed.isError && articles.length === 0 && (
              <div
                className={`rounded-2xl border p-10 text-center ${
                  isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'
                }`}
              >
                {isTag ? (
                  <TagIcon
                    className={`mx-auto w-8 h-8 ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}
                  />
                ) : (
                  <Newspaper
                    className={`mx-auto w-8 h-8 ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}
                  />
                )}
                <p className={`mt-3 text-sm font-bold ${heading}`}>
                  {isTag ? (
                    <>
                      Nothing tagged with “{slug}” yet
                    </>
                  ) : (
                    <>
                      Nothing filed under “{slug}” yet
                    </>
                  )}
                </p>
                <p className={`mt-1 text-xs ${muted}`}>
                  {isTag
                    ? 'Once a story uses this tag it will show up here automatically.'
                    : 'Once a story lands in this category it will show up here automatically.'}
                </p>
                <Link
                  to={browseFallback.to}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-yellow-300"
                >
                  {browseFallback.label}
                </Link>
              </div>
            )}

            {articles.length > 0 && (
              <div className="space-y-4">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}

            {/* Infinite-scroll sentinel */}
            <div ref={sentinel} className="h-px" aria-hidden="true" />

            <div className="py-8 text-center" aria-live="polite">
              {isFetchingNextPage && (
                <p
                  className={`inline-flex items-center gap-2 text-xs font-bold ${muted}`}
                >
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                  Loading more stories…
                </p>
              )}

              {!feed.isLoading && !feed.isError && !hasNextPage && articles.length > 0 && (
                <div>
                  <span
                    className={`inline-block h-px w-24 ${
                      isDark ? 'bg-zinc-800' : 'bg-zinc-200'
                    }`}
                  />
                  <p className={`mt-4 text-xs font-black uppercase tracking-widest ${faint}`}>
                    You’ve reached the end · {formatCount(total)}{' '}
                    {total === 1 ? 'story' : 'stories'} in{' '}
                    {isTag ? `#${slug}` : name}
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4 w-full space-y-5 lg:sticky lg:top-44">
            <TrendingList articles={popular.data ?? []} />
            <TagCloud tags={tags.data ?? []} />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
