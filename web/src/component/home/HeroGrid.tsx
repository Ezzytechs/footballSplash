import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Flame,
  ArrowRight,
  Calendar,
  ChevronRight,
  Bookmark,
  Share2,
  User,
} from 'lucide-react'
import { useTheme } from './themedContext'
import {
  useCategoryArticles,
  useLatestArticles,
  usePopularArticles,
  useTagsQuery,
} from '../../api/queries'
import type { ArticleSummary } from '../../api/types'
import { initials, relativeTime } from '../../lib/format'

interface Story {
  id: string
  slug: string
  category: string
  categoryColor: string
  title: string
  summary: string
  authorName: string
  date: string
  imageUrl: string
}

/** Accent chip per known category slug; anything else gets the house yellow. */
const CATEGORY_COLORS: Record<string, string> = {
  'premier-league': 'bg-fuchsia-600 text-white',
  'champions-league': 'bg-emerald-500 text-black',
  transfers: 'bg-yellow-400 text-black',
  'world-football': 'bg-cyan-500 text-black',
}

function toStory(article: ArticleSummary, index: number): Story {
  return {
    id: article.id,
    slug: article.slug,
    category: article.category.name,
    categoryColor:
      CATEGORY_COLORS[article.category.slug] ??
      ['bg-yellow-400 text-black', 'bg-emerald-500 text-black', 'bg-cyan-500 text-black'][
        index % 3
      ],
    title: article.title,
    summary: article.excerpt ?? '',
    authorName: article.author.name,
    date: relativeTime(article.publishedAt ?? article.createdAt),
    imageUrl: article.coverImage ?? '',
  }
}

const TAB_COPY = {
  all: 'Updated just now',
  trending: 'Ranked by views and likes',
  transfers: 'Every story in the transfer centre',
} as const

export function HeroGrid() {
  const [activeTab, setActiveTab] = useState<'all' | 'trending' | 'transfers'>('all')

  const { theme } = useTheme()
  const isDark = theme === 'night'

  // One feed per tab, all straight from the API; the transfer feed only
  // fires while that tab is on screen.
  const latest = useLatestArticles(4)
  const popular = usePopularArticles(4)
  const transfers = useCategoryArticles('transfers', 4, activeTab === 'transfers')
  const tags = useTagsQuery()
  const location = useLocation()
  // A storyless hero hides the dashboard link: there is nothing behind it,
  // and a hand-typed /admin URL can open the editorial shell anyway.
  const newsCount = latest.data?.length ?? 0
  const isOnHomepage = location.pathname === '/'
  const canSeeDashboard = newsCount > 0 && isOnHomepage

  const feed =
    activeTab === 'all'
      ? latest
      : activeTab === 'trending'
        ? popular
        : transfers

  const stories = useMemo(
    () => (feed.data ?? []).map(toStory),
    [feed.data],
  )

  const trendingTags = (tags.data ?? [])
    .filter((tag) => (tag._count?.articles ?? 0) > 0)
    .slice(0, 6)

  const [mainHero, topRightHero, bottomLeftGrid, bottomRightGrid] = stories

  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const borderBottom = isDark ? 'border-zinc-800/80' : 'border-zinc-200/80'
  const activeTabBg = 'bg-yellow-400 text-black shadow'
  const inactiveTab = isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
  const tagHover = isDark ? 'hover:bg-zinc-700 hover:text-yellow-300' : 'hover:bg-zinc-200 hover:text-yellow-600'
  const trendBg = isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
  const cardBorder = isDark ? 'border-zinc-800/80' : 'border-zinc-200/80'

  return (
    <section
      id="top-stories"
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 scroll-mt-32 lg:scroll-mt-44"
    >
      {/* Category Selection Filter Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b ${borderBottom}`}>
        <div className="flex items-center space-x-2">
          <span
            className={`flex items-center gap-1.5 text-xs font-black tracking-wider uppercase ${
              isDark
                ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'
                : 'text-yellow-600 bg-yellow-50 border border-yellow-200'
            } px-3 py-1 rounded-full`}
          >
            <Flame className="w-3.5 h-3.5 shrink-0" /> TOP STORIES
          </span>
          <h2 className={`hidden sm:block text-xs font-semibold ${textMuted}`}>
            | {TAB_COPY[activeTab]}
          </h2>
        </div>

        {/* Filter Switcher */}
        <div
          className={`flex p-1 rounded-lg text-xs font-bold ${
            isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          } border`}
        >
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-all ${activeTab === 'all' ? activeTabBg : inactiveTab}`}
          >
            <span className="sm:hidden">All</span>
            <span className="hidden sm:inline">All Headlines</span>
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-all ${activeTab === 'trending' ? activeTabBg : inactiveTab}`}
          >
            Trending
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-all ${activeTab === 'transfers' ? activeTabBg : inactiveTab}`}
          >
            <span className="sm:hidden">Transfers</span>
            <span className="hidden sm:inline">Transfer Center</span>
          </button>
        </div>
      </div>

      {/* Loading skeletons */}
      {feed.isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-[620px]">
          <div className={`lg:col-span-6 min-h-[450px] lg:h-full rounded-2xl border animate-pulse ${cardBorder} ${isDark ? 'bg-zinc-900/60' : 'bg-zinc-100'}`} />
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-rows-2 gap-5 h-full">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={`${index === 0 ? 'sm:col-span-2' : ''} min-h-[240px] rounded-2xl border animate-pulse ${cardBorder} ${isDark ? 'bg-zinc-900/60' : 'bg-zinc-100'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state — the newsroom has published nothing for this tab yet */}
      {!feed.isLoading && stories.length === 0 && (
        <div
          className={`rounded-2xl border p-12 text-center ${cardBorder} ${
            isDark ? 'bg-zinc-900/50' : 'bg-white'
          }`}
        >
          <p className={`text-4xl font-black ${isDark ? 'text-zinc-700' : 'text-zinc-200'}`}>⚽</p>
          <h3 className={`mt-4 text-lg font-extrabold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            No stories here yet
          </h3>
          <p className={`mt-2 text-sm ${textMuted}`}>
            {activeTab === 'transfers'
              ? 'Nothing has been filed under the transfer centre so far.'
              : 'Published stories will appear in this space the moment they go live.'}
          </p>
          {canSeeDashboard ? (
            <Link
              to="/admin"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-yellow-300"
            >
              Open the dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : null}
        </div>
      )}

      {/* Hero Bento Grid Structure */}
      {!feed.isLoading && stories.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-[620px]">
          {/* LEFT COLUMN: Main Feature Card */}
          {mainHero && (
            <div
              className={`lg:col-span-6 relative group overflow-hidden rounded-2xl flex flex-col justify-end transition-all duration-300 hover:border-yellow-400/50 shadow-2xl min-h-[450px] lg:h-full ${
                isDark ? 'bg-[#0b1118] border-zinc-800/80' : 'bg-white border-zinc-200/80'
              }`}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                style={{
                  backgroundImage: mainHero.imageUrl
                    ? `url(${mainHero.imageUrl})`
                    : 'linear-gradient(135deg, #facc15, #4ade80)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent opacity-90 group-hover:opacity-85 transition-opacity" />

              {/* Floating Action Badge Top Right */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                  className={`p-2 rounded-full backdrop-blur-md transition-colors border ${
                    isDark
                      ? 'bg-zinc-950/60 text-zinc-300 hover:text-yellow-400 border-white/10'
                      : 'bg-white/70 text-zinc-600 hover:text-yellow-600 border-zinc-200'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button
                  className={`p-2 rounded-full backdrop-blur-md transition-colors border ${
                    isDark
                      ? 'bg-zinc-950/60 text-zinc-300 hover:text-yellow-400 border-white/10'
                      : 'bg-white/70 text-zinc-600 hover:text-yellow-600 border-zinc-200'
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Card Content Stack */}
              <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-end h-full">
                {/* Category Tag */}
                <div>
                  <span
                    className={`inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-3 shadow-md ${mainHero.categoryColor}`}
                  >
                    {mainHero.category}
                  </span>
                </div>

                {/* Headline */}
                <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-3 group-hover:text-yellow-300 transition-colors font-sans">
                  <Link to={`/post/${mainHero.slug}`}>{mainHero.title}</Link>
                </h1>

                {/* Excerpt */}
                {mainHero.summary && (
                  <p
                    className={`text-sm line-clamp-2 mb-6 hidden sm:block font-normal leading-relaxed ${
                      isDark ? 'text-zinc-300' : 'text-zinc-200'
                    }`}
                  >
                    {mainHero.summary}
                  </p>
                )}

                {/* Footer / Meta Info */}
                <div
                  className={`flex items-center justify-between border-t pt-4 ${
                    isDark ? 'border-zinc-800/80' : 'border-zinc-200/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-emerald-500 border border-yellow-400 grid place-items-center text-[10px] font-black text-black">
                      {initials(mainHero.authorName)}
                    </span>
                    <div className="text-xs">
                      <span className="font-semibold block text-white">
                        {mainHero.authorName}
                      </span>
                      <span className="flex items-center gap-1 text-zinc-300">
                        <Calendar className="w-3 h-3" /> {mainHero.date}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/post/${mainHero.slug}`}
                    className="font-extrabold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md group/btn bg-yellow-400 text-black hover:bg-yellow-300"
                  >
                    <span>READ STORY</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* RIGHT COLUMN: Nested Grid */}
          {stories.length > 1 && (
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-rows-2 gap-5 h-full">
              {/* TOP RIGHT FEATURE CARD */}
              {topRightHero && (
                <div
                  className={`sm:col-span-2 relative group overflow-hidden rounded-2xl flex flex-col justify-end transition-all duration-300 hover:border-yellow-400/50 shadow-xl min-h-[260px] lg:min-h-0 ${
                    isDark ? 'bg-[#0b1118] border-zinc-800/80' : 'bg-white border-zinc-200/80'
                  }`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{
                      backgroundImage: topRightHero.imageUrl
                        ? `url(${topRightHero.imageUrl})`
                        : 'linear-gradient(135deg, #facc15, #22d3ee)',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />

                  <div className="relative z-10 p-5 sm:p-6">
                    <span
                      className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded mb-2 shadow ${topRightHero.categoryColor}`}
                    >
                      {topRightHero.category}
                    </span>
                    <h3 className="text-white text-lg sm:text-xl font-extrabold leading-snug group-hover:text-yellow-300 transition-colors mb-2">
                      <Link to={`/post/${topRightHero.slug}`}>{topRightHero.title}</Link>
                    </h3>
                    <div
                      className={`flex items-center justify-between text-xs pt-2 border-t text-zinc-300 ${
                        isDark ? 'border-zinc-800/60' : 'border-zinc-200/60'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <User className="w-3 h-3 text-yellow-400" />
                        <span>{topRightHero.authorName}</span>
                      </span>
                      <span>{topRightHero.date}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* BOTTOM LEFT MINI CARD */}
              {bottomLeftGrid && (
                <div
                  className={`relative group overflow-hidden rounded-2xl flex flex-col justify-end transition-all duration-300 hover:border-yellow-400/50 shadow-xl min-h-[240px] lg:min-h-0 ${
                    isDark ? 'bg-[#0b1118] border-zinc-800/80' : 'bg-white border-zinc-200/80'
                  }`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{
                      backgroundImage: bottomLeftGrid.imageUrl
                        ? `url(${bottomLeftGrid.imageUrl})`
                        : 'linear-gradient(135deg, #a855f7, #22d3ee)',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-transparent" />

                  <div className="relative z-10 p-4 sm:p-5">
                    <span
                      className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded mb-2 shadow ${bottomLeftGrid.categoryColor}`}
                    >
                      {bottomLeftGrid.category}
                    </span>
                    <h4 className="text-white text-sm sm:text-base font-bold leading-tight group-hover:text-yellow-300 transition-colors line-clamp-3">
                      <Link to={`/post/${bottomLeftGrid.slug}`}>{bottomLeftGrid.title}</Link>
                    </h4>
                    <p className="text-[11px] mt-2 flex items-center justify-between text-zinc-300">
                      <span>{bottomLeftGrid.date}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-yellow-400 group-hover:translate-x-1 transition-transform" />
                    </p>
                  </div>
                </div>
              )}

              {/* BOTTOM RIGHT MINI CARD */}
              {bottomRightGrid && (
                <div
                  className={`relative group overflow-hidden rounded-2xl flex flex-col justify-end transition-all duration-300 hover:border-yellow-400/50 shadow-xl min-h-[240px] lg:min-h-0 ${
                    isDark ? 'bg-[#0b1118] border-zinc-800/80' : 'bg-white border-zinc-200/80'
                  }`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{
                      backgroundImage: bottomRightGrid.imageUrl
                        ? `url(${bottomRightGrid.imageUrl})`
                        : 'linear-gradient(135deg, #f97316, #facc15)',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-transparent" />

                  <div className="relative z-10 p-4 sm:p-5">
                    <span
                      className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded mb-2 shadow ${bottomRightGrid.categoryColor}`}
                    >
                      {bottomRightGrid.category}
                    </span>
                    <h4 className="text-white text-sm sm:text-base font-bold leading-tight group-hover:text-yellow-300 transition-colors line-clamp-3">
                      <Link to={`/post/${bottomRightGrid.slug}`}>{bottomRightGrid.title}</Link>
                    </h4>
                    <p className="text-[11px] mt-2 flex items-center justify-between text-zinc-300">
                      <span>{bottomRightGrid.date}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-yellow-400 group-hover:translate-x-1 transition-transform" />
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trending topic chips — real tags with published stories */}
      {trendingTags.length > 0 && (
        <div className={`mt-6 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 ${trendBg}`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider shrink-0">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
            <span className="text-yellow-500">Trending Topics:</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {trendingTags.map((tag) => (
              <Link
                key={tag.id}
                to={`/tag/${tag.slug}`}
                className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 ' + tagHover
                    : 'bg-zinc-100 border border-zinc-200 text-zinc-700 ' + tagHover
                }`}
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
