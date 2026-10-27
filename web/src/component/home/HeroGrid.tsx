import { useState } from 'react'
import { Link } from 'react-router-dom'
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

interface Story {
  id: string
  slug: string
  category: string
  categoryColor: string
  title: string
  summary: string
  author: {
    name: string
    avatar: string
  }
  date: string
  readTime: string
  imageUrl: string
  isTrending?: boolean
}

const FEATURED_STORIES: {
  mainHero: Story
  topRightHero: Story
  bottomLeftGrid: Story
  bottomRightGrid: Story
} = {
  mainHero: {
    id: 'hero-1',
    slug: 'against-all-odds-mbappe-real-madrid-late-el-clasico',
    category: 'CHAMPIONS LEAGUE',
    categoryColor: 'bg-emerald-500 text-black',
    title:
      'AGAINST ALL ODDS: MBAPPÉ & REAL MADRID STRIKE LATE TO CLAIM EL CLÁSICO THRILLER',
    summary:
      'In an unforgettable clash at the Bernabéu, Real Madrid mounted a sensational second-half comeback with two goals in stoppage time.',
    author: {
      name: 'Melanie Byrd',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    },
    date: 'Oct 26, 2026',
    readTime: '4 min read',
    imageUrl:
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200',
  },
  topRightHero: {
    id: 'hero-2',
    slug: '140m-bid-submitted-for-bundesliga-midfield-dynamo',
    category: 'TRANSFERS',
    categoryColor: 'bg-yellow-400 text-black',
    title:
      'Record Break: $140M Bid Submitted For Bundesliga Midfield Dynamo Ahead Of January Window',
    summary:
      'Premier League giants are ready to shatter transfer records to secure the prodigy before rival clubs intervene.',
    author: {
      name: 'David Connors',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    },
    date: 'Oct 26, 2026',
    readTime: '3 min read',
    imageUrl:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1000',
  },
  bottomLeftGrid: {
    id: 'hero-3',
    slug: 'tactical-analysis-arsenal-high-press-dismantled-favorites',
    category: 'PREMIER LEAGUE',
    categoryColor: 'bg-fuchsia-600 text-white',
    title:
      'Tactical Analysis: How Arsenal’s High Press Dismantled the Title Favorites',
    summary:
      'A deep dive into Mikel Arteta’s pressing scheme that disrupted build-up play and secured three crucial points.',
    author: {
      name: 'Alexandre Silva',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    },
    date: 'Oct 25, 2026',
    readTime: '5 min read',
    imageUrl:
      'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=800',
  },
  bottomRightGrid: {
    id: 'hero-4',
    slug: 'inter-milan-go-top-after-five-goal-thriller',
    category: 'SERIE A',
    categoryColor: 'bg-cyan-500 text-black',
    title: 'Inter Milan Go Top After Five-Goal Thriller at San Siro',
    summary:
      'Lautaro Martinez scores two stunning volley goals as Inter edge past Napoli in a chaotic match.',
    author: {
      name: 'Elena Rostova',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    },
    date: 'Oct 25, 2026',
    readTime: '3 min read',
    imageUrl:
      'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80&w=800',
  },}
export function HeroGrid() {
  const [activeTab, setActiveTab] = useState<'all' | 'trending' | 'transfers'>('all')
  const stories = FEATURED_STORIES

  const { theme } = useTheme()
  const isDark = theme === 'night'

  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const borderBottom = isDark ? 'border-zinc-800/80' : 'border-zinc-200/80'
  const activeTabBg = isDark ? 'bg-yellow-400 text-black shadow' : 'bg-yellow-400 text-black shadow'
  const inactiveTab = isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
  const tagHover = isDark ? 'hover:bg-zinc-700 hover:text-yellow-300' : 'hover:bg-zinc-200 hover:text-yellow-600'
  const trendBg = isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'

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
            | Updated 5 mins ago
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

      {/* Hero Bento Grid Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-[620px]">
        {/* LEFT COLUMN: Main Feature Card */}
        <div
          className={`lg:col-span-6 relative group overflow-hidden rounded-2xl flex flex-col justify-end transition-all duration-300 hover:border-yellow-400/50 shadow-2xl min-h-[450px] lg:h-full ${
            isDark ? 'bg-[#0b1118] border-zinc-800/80' : 'bg-white border-zinc-200/80'
          }`}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ backgroundImage: `url(${stories.mainHero.imageUrl})` }}
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
                className={`inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-3 shadow-md ${stories.mainHero.categoryColor}`}
              >
                {stories.mainHero.category}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-3 group-hover:text-yellow-300 transition-colors font-sans">
              <Link to={`/post/${stories.mainHero.slug}`}>
                {stories.mainHero.title}
              </Link>
            </h1>

            {/* Excerpt */}
            <p className={`text-sm line-clamp-2 mb-6 hidden sm:block font-normal leading-relaxed ${
              isDark ? 'text-zinc-300' : 'text-zinc-200'
            }`}>
              {stories.mainHero.summary}
            </p>

            {/* Footer / Meta Info */}
            <div className={`flex items-center justify-between border-t pt-4 ${
              isDark ? 'border-zinc-800/80' : 'border-zinc-200/80'
            }`}>
              <div className="flex items-center space-x-3">
                <img
                  src={stories.mainHero.author.avatar}
                  alt={stories.mainHero.author.name}
                  className={`w-8 h-8 rounded-full object-cover border ${isDark ? 'border-yellow-400' : 'border-yellow-400'}`}
                />
                <div className="text-xs">
                  <span className="font-semibold block text-white">
                    {stories.mainHero.author.name}
                  </span>
                  <span className="flex items-center gap-1 text-zinc-300">
                    <Calendar className="w-3 h-3" /> {stories.mainHero.date}
                  </span>
                </div>
              </div>

              <button
                className={`font-extrabold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md group/btn ${
                  isDark ? 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-md' : 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-md'
                }`}
              >
                <span>READ STORY</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Nested Grid */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-rows-2 gap-5 h-full">
          {/* TOP RIGHT FEATURE CARD */}
          <div
            className={`sm:col-span-2 relative group overflow-hidden rounded-2xl flex flex-col justify-end transition-all duration-300 hover:border-yellow-400/50 shadow-xl min-h-[260px] lg:min-h-0 ${
              isDark ? 'bg-[#0b1118] border-zinc-800/80' : 'bg-white border-zinc-200/80'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
              style={{
                backgroundImage: `url(${stories.topRightHero.imageUrl})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />

            <div className="relative z-10 p-5 sm:p-6">
              <span
                className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded mb-2 shadow ${stories.topRightHero.categoryColor}`}
              >
                {stories.topRightHero.category}
              </span>
              <h3 className="text-white text-lg sm:text-xl font-extrabold leading-snug group-hover:text-yellow-300 transition-colors mb-2">
                <Link to={`/post/${stories.topRightHero.slug}`}>
                  {stories.topRightHero.title}
                </Link>
              </h3>
              <div
                className={`flex items-center justify-between text-xs pt-2 border-t text-zinc-300 ${
                  isDark ? 'border-zinc-800/60' : 'border-zinc-200/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-yellow-400" />
                  <span>{stories.topRightHero.author.name}</span>
                </div>
                <span>{stories.topRightHero.readTime}</span>
              </div>
            </div>
          </div>

          {/* BOTTOM LEFT MINI CARD */}
          <div
            className={`relative group overflow-hidden rounded-2xl flex flex-col justify-end transition-all duration-300 hover:border-yellow-400/50 shadow-xl min-h-[240px] lg:min-h-0 ${
              isDark ? 'bg-[#0b1118] border-zinc-800/80' : 'bg-white border-zinc-200/80'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
              style={{
                backgroundImage: `url(${stories.bottomLeftGrid.imageUrl})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-transparent" />

            <div className="relative z-10 p-4 sm:p-5">
              <span
                className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded mb-2 shadow ${stories.bottomLeftGrid.categoryColor}`}
              >
                {stories.bottomLeftGrid.category}
              </span>
              <h4 className="text-white text-sm sm:text-base font-bold leading-tight group-hover:text-yellow-300 transition-colors line-clamp-3">
                <Link to={`/post/${stories.bottomLeftGrid.slug}`}>
                  {stories.bottomLeftGrid.title}
                </Link>
              </h4>
              <p className="text-[11px] mt-2 flex items-center justify-between text-zinc-300">
                <span>{stories.bottomLeftGrid.date}</span>
                <ChevronRight className="w-3.5 h-3.5 text-yellow-400 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </div>

          {/* BOTTOM RIGHT MINI CARD */}
          <div
            className={`relative group overflow-hidden rounded-2xl flex flex-col justify-end transition-all duration-300 hover:border-yellow-400/50 shadow-xl min-h-[240px] lg:min-h-0 ${
              isDark ? 'bg-[#0b1118] border-zinc-800/80' : 'bg-white border-zinc-200/80'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
              style={{
                backgroundImage: `url(${stories.bottomRightGrid.imageUrl})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-transparent" />

            <div className="relative z-10 p-4 sm:p-5">
              <span
                className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded mb-2 shadow ${stories.bottomRightGrid.categoryColor}`}
              >
                {stories.bottomRightGrid.category}
              </span>
              <h4 className="text-white text-sm sm:text-base font-bold leading-tight group-hover:text-yellow-300 transition-colors line-clamp-3">
                <Link to={`/post/${stories.bottomRightGrid.slug}`}>
                  {stories.bottomRightGrid.title}
                </Link>
              </h4>
              <p className="text-[11px] mt-2 flex items-center justify-between text-zinc-300">
                <span>{stories.bottomRightGrid.date}</span>
                <ChevronRight className="w-3.5 h-3.5 text-yellow-400 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Headline Carousel Bar */}
      <div className={`mt-6 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 ${trendBg}`}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider shrink-0">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
          <span className="text-yellow-500">Trending Topics:</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          {[
            '#ElClasico',
            '#Mbappe',
            '#PremierLeague',
            '#UCLdraw',
            '#Haaland',
            '#ArtetaBall',
          ].map((tag) => (
            <span
              key={tag}
              className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${
                isDark
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 ' + tagHover
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700 ' + tagHover
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
