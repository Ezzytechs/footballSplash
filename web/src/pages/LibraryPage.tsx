import { useState } from 'react'
import {
  Bookmark,
  Heart,
  Library,
  Loader2,
  LogIn,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Navbar } from '../component/home/Navbar'
import { Footer } from '../component/home/Footer'
import { useTheme } from '../component/home/themedContext'
import { ArticleCard } from '../component/shared/ArticleCard'
import {
  useBookmarkedArticles,
  useLikedArticles,
  useRemoveFromLiked,
  useRemoveFromSaved,
} from '../api/library'
import { errorMessage } from '../api/client'
import type { ArticleSummary } from '../api/types'
import { useAuth } from '../auth/AuthContext'

type Tab = 'saved' | 'liked'

const TABS: Array<{ id: Tab; label: string; hint: string; icon: LucideIcon }> = [
  {
    id: 'saved',
    label: 'Saved',
    hint: 'Stories you saved to read later',
    icon: Bookmark,
  },
  {
    id: 'liked',
    label: 'Liked',
    hint: 'Stories you gave a like',
    icon: Heart,
  },
]

/**
 * Reader dashboard: the two personal shelves behind the Save and Like buttons
 * on an article. It is separate from /admin, which only staff can open.
 */
export function LibraryPage() {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const { status, user } = useAuth()
  const [tab, setTab] = useState<Tab>('saved')

  const signedIn = status === 'authenticated' && Boolean(user)
  const saved = useBookmarkedArticles(24, signedIn)
  const liked = useLikedArticles(24, signedIn)

  const active = tab === 'saved' ? saved : liked
  const articles = active.data?.items ?? []

  const removeSaved = useRemoveFromSaved()
  const removeLiked = useRemoveFromLiked()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const card = isDark
    ? 'bg-zinc-900/50 border-zinc-800/80'
    : 'bg-white border-zinc-200/80'
  const heading = isDark ? 'text-white' : 'text-zinc-900'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const faint = isDark ? 'text-zinc-500' : 'text-zinc-400'

  const counts = {
    saved: saved.data?.meta.total ?? 0,
    liked: liked.data?.meta.total ?? 0,
  }

  /**
   * Un-saving / un-liking from the shelf hits the same toggle as the article
   * action bar, then drops the row from the cached page so the card goes away
   * without a refetch. The busy row is tracked so only that card locks up.
   */
  async function remove(article: ArticleSummary) {
    setRemovingId(article.id)
    setRemoveError(null)
    try {
      await (tab === 'saved' ? removeSaved : removeLiked).mutateAsync(article.id)
    } catch (error) {
      setRemoveError(errorMessage(error, 'Could not remove that story'))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#070b10]' : 'bg-white'}`}>
      <Navbar />

      <main className="flex-1">
        <header className={`border-b ${isDark ? 'border-zinc-900' : 'border-zinc-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="flex items-start gap-4">
              <span
                className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${
                  isDark
                    ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                    : 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                }`}
              >
                <Library className="w-7 h-7" />
              </span>
              <div className="min-w-0">
                <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${heading}`}>
                  My library
                </h1>
                <p className={`mt-2 text-sm ${muted}`}>
                  Everything you saved or liked, in one place
                  {signedIn && user ? ` — ${user.name.split(' ')[0]}` : ''}.
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!signedIn ? (
            <div className={`rounded-2xl border p-10 text-center ${card}`}>
              <LogIn className={`mx-auto w-8 h-8 ${faint}`} />
              <p className={`mt-3 text-sm font-bold ${heading}`}>
                Sign in to see your library
              </p>
              <p className={`mt-1 text-xs ${muted}`}>
                Saved and liked stories are tied to your account.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <Link
                  to="/login"
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-yellow-300"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className={`rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors ${
                    isDark
                      ? 'border-zinc-700 text-zinc-300 hover:border-yellow-400/60 hover:text-yellow-400'
                      : 'border-zinc-200 text-zinc-700 hover:border-yellow-500/60 hover:text-yellow-600'
                  }`}
                >
                  Create account
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Shelf switcher */}
              <div className="flex flex-wrap items-center gap-2">
                {TABS.map(({ id, label, icon: Icon }) => {
                  const isActive = tab === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setTab(id)
                        setRemoveError(null)
                      }}
                      aria-pressed={isActive}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors ${
                        isActive
                          ? 'bg-yellow-400 text-black'
                          : isDark
                            ? 'border border-zinc-800 text-zinc-400 hover:text-yellow-400'
                            : 'border border-zinc-200 text-zinc-600 hover:border-yellow-500/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                      <span className={isActive ? 'text-black/60' : faint}>
                        {counts[id]}
                      </span>
                    </button>
                  )
                })}
              </div>

              <p className={`mt-4 text-xs ${muted}`}>
                {TABS.find((item) => item.id === tab)?.hint}
              </p>

              {removeError && (
                <p
                  role="alert"
                  className="mt-2 text-xs font-bold text-red-500"
                >
                  {removeError}
                </p>
              )}

              {active.isLoading && (
                <div className="mt-5 space-y-4">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className={`h-32 animate-pulse rounded-2xl border ${
                        isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'
                      }`}
                    />
                  ))}
                </div>
              )}

              {!active.isLoading && active.isError && (
                <div
                  className={`mt-5 rounded-2xl border p-8 text-center ${
                    isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'
                  }`}
                >
                  <p className={`text-sm font-bold ${heading}`}>
                    Your {tab === 'saved' ? 'saved' : 'liked'} stories could not be loaded
                  </p>
                  <p className={`mt-1 text-xs ${muted}`}>
                    {active.error instanceof Error
                      ? active.error.message
                      : 'Check that the API server is running, then try again.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void active.refetch()}
                    className="mt-4 rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-yellow-300"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!active.isLoading && !active.isError && articles.length === 0 && (
                <div className={`mt-5 rounded-2xl border p-10 text-center ${card}`}>
                  {tab === 'saved' ? (
                    <Bookmark className={`mx-auto w-8 h-8 ${faint}`} />
                  ) : (
                    <Heart className={`mx-auto w-8 h-8 ${faint}`} />
                  )}
                  <p className={`mt-3 text-sm font-bold ${heading}`}>
                    {tab === 'saved' ? 'No saved stories yet' : 'Nothing liked yet'}
                  </p>
                  <p className={`mt-1 text-xs ${muted}`}>
                    {tab === 'saved'
                      ? 'Tap Save on any story and it will wait for you here.'
                      : 'Tap Like on any story and it will show up here.'}
                  </p>
                  <Link
                    to="/"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-yellow-300"
                  >
                    Browse stories
                  </Link>
                </div>
              )}

              {articles.length > 0 && (
                <div className="mt-5 space-y-4">
                  {articles.map((article) => {
                    const isBusy = removingId === article.id
                    return (
                      <div key={article.id} className="relative">
                        <ArticleCard article={article} />
                        {/* Sibling of the card's link, so removing a story
                            never navigates to it. */}
                        <button
                          type="button"
                          onClick={() => void remove(article)}
                          disabled={isBusy}
                          title={
                            tab === 'saved' ? 'Remove from saved' : 'Remove like'
                          }
                          aria-label={`${tab === 'saved' ? 'Unsave' : 'Unlike'} “${article.title}”`}
                          className={`absolute right-3 top-3 flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors disabled:opacity-60 ${
                            isDark
                              ? 'border-zinc-700 bg-zinc-900/90 text-zinc-300 hover:border-red-500/60 hover:text-red-400'
                              : 'border-zinc-200 bg-white/90 text-zinc-600 hover:border-red-500/60 hover:text-red-500'
                          }`}
                        >
                          {isBusy ? (
                            <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          <span className="hidden sm:inline">
                            {tab === 'saved' ? 'Unsave' : 'Unlike'}
                          </span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
