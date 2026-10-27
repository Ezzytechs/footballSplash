import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Eye, MessageCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Footer } from '../component/home/Footer'
import { Navbar } from '../component/home/Navbar'
import { ThemedApp } from '../component/home/ThemedApp'
import { useTheme } from '../component/home/themedContext'
import { ActionBar } from '../component/post/ActionBar'
import { AuthorCard, StatsStrip } from '../component/post/AuthorCard'
import { CommentsSection } from '../component/post/CommentsSection'
import { ReadingProgress } from '../component/post/ReadingProgress'
import { SimilarPosts, TagCloud, TrendingList } from '../component/post/SideRail'
import { TableOfContents } from '../component/post/TableOfContents'
import { errorMessage, isAuthError } from '../api/client'
import {
  useArticleQuery,
  useBookmarkArticle,
  useLikeArticle,
  usePopularArticles,
  useSimilarArticles,
  useTagsQuery,
} from '../api/queries'
import type { ArticleDetail } from '../api/types'
import { parseSections } from '../lib/article'
import { formatCount, initials, readTime, relativeTime } from '../lib/format'
import { NoticeProvider } from '../lib/notice'
import { useNotice } from '../lib/notice-context'
import { headerOffset } from '../lib/scroll'

const BODY_ID = 'article-body'

export function PostPage() {
  return (
    <ThemedApp>
      <NoticeProvider>
        <PostView />
      </NoticeProvider>
    </ThemedApp>
  )
}

function PostView() {
  const { slug } = useParams()
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const { data: article, isLoading, isError } = useArticleQuery(slug)

  const heading = isDark ? 'text-white' : 'text-zinc-900'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'

  return (
    <div
      className={`min-h-screen flex flex-col ${isDark ? 'bg-[#070b10]' : 'bg-white'}`}
    >
      <Navbar />

      {isLoading && (
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-4 w-40 animate-pulse rounded bg-yellow-400/30" />
          <div className="mt-6 h-12 w-3/4 animate-pulse rounded-lg bg-zinc-500/15" />
          <div className="mt-3 h-12 w-1/2 animate-pulse rounded-lg bg-zinc-500/15" />
          <div className="mt-8 h-64 sm:h-96 w-full animate-pulse rounded-2xl bg-zinc-500/10" />
          <div className="mt-8 space-y-3">
            {[92, 88, 95, 70].map((width, index) => (
              <div
                key={index}
                className="h-4 animate-pulse rounded bg-zinc-500/10"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
        </main>
      )}

      {isError && !isLoading && (
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="text-6xl font-black text-yellow-400">404</p>
          <h1 className={`mt-4 text-2xl font-extrabold ${heading}`}>
            This story is unavailable
          </h1>
          <p className={`mt-2 text-sm ${muted}`}>
            It may have been unpublished, or the link is out of date.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-yellow-300"
          >
            Back to the homepage
          </Link>
        </main>
      )}

      {/* Keyed on the article so likes/saves reset between stories. */}
      {article && !isLoading && <PostBody key={article.id} article={article} />}

      <Footer />
    </div>
  )
}

function PostBody({ article }: { article: ArticleDetail }) {
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const notify = useNotice()

  const similar = useSimilarArticles(article)
  const popular = usePopularArticles(5)
  const tags = useTagsQuery()

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(article.likeCount)
  const [bookmarked, setBookmarked] = useState(false)
  const [activeId, setActiveId] = useState('')

  const likeMutation = useLikeArticle(article.id, article.slug)
  const bookmarkMutation = useBookmarkArticle(article.id)

  const sections = useMemo(() => parseSections(article.content), [article.content])

  // Highlights the current entry in the table of contents.
  useEffect(() => {
    if (sections.length === 0) return
    const update = () => {
      const offset = headerOffset() + 32
      let current = sections[0]?.id ?? ''
      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element && element.getBoundingClientRect().top <= offset) {
          current = section.id
        }
      }
      setActiveId(current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [sections])

  const heading = isDark ? 'text-white' : 'text-zinc-900'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const faint = isDark ? 'text-zinc-500' : 'text-zinc-400'

  const handleLike = () => {
    if (likeMutation.isPending) return
    likeMutation.mutate(
      { liked },
      {
        onSuccess: (data) => {
          setLiked(data.liked)
          setLikeCount(data.likeCount)
        },
        onError: (error) =>
          notify(
            isAuthError(error)
              ? 'Sign in to like this post'
              : errorMessage(error, 'Could not update the like'),
          ),
      },
    )
  }

  const handleBookmark = () => {
    if (bookmarkMutation.isPending) return
    bookmarkMutation.mutate(
      { bookmarked },
      {
        onSuccess: (data) => setBookmarked(data.bookmarked),
        onError: (error) =>
          notify(
            isAuthError(error)
              ? 'Sign in to save this post'
              : errorMessage(error, 'Could not save this post'),
          ),
      },
    )
  }

  const handleShare = async () => {
    const shareData = { title: article.title, url: window.location.href }
    if (typeof navigator.share === 'function') {
      await navigator.share(shareData).catch(() => undefined)
      return
    }
    try {
      await navigator.clipboard.writeText(shareData.url)
      notify('Link copied to clipboard')
    } catch {
      notify('Could not copy the link')
    }
  }

  const actionProps = {
    likeCount,
    liked,
    onLike: handleLike,
    commentCount: article.commentCount,
    onJumpToComments: () => {
      document
        .getElementById('comments')
        ?.scrollIntoView({ behavior: 'smooth' })
    },
    bookmarked,
    onBookmark: handleBookmark,
    onShare: handleShare,
  }

  return (
    <>
      <ReadingProgress targetId={BODY_ID} />

      <main className="flex-1 pb-28 lg:pb-16">
        {/* ------------------------------------------------------ header */}
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <nav
            aria-label="Breadcrumb"
            className={`flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider ${faint}`}
          >
            <Link to="/" className="transition-colors hover:text-yellow-500">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span>{article.category.name}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="truncate text-yellow-500">Article</span>
          </nav>

          <div className="mt-5 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/tag/${tag.slug}`}
                className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider transition-colors ${
                  isDark
                    ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-yellow-400/60 hover:text-yellow-400'
                    : 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:border-yellow-500/60 hover:text-yellow-600'
                }`}
              >
                #{tag.name}
              </Link>
            ))}
          </div>

          <h1
            className={`mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.06] tracking-tight ${heading}`}
          >
            {article.title}
          </h1>

          {article.excerpt && (
            <p
              className={`mt-4 max-w-3xl text-base sm:text-lg leading-relaxed ${muted}`}
            >
              {article.excerpt}
            </p>
          )}

          <div
            className={`mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t pt-5 text-xs ${
              isDark ? 'border-zinc-800/80' : 'border-zinc-200/80'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-tr from-yellow-400 to-emerald-500 text-xs font-black text-black">
                {initials(article.author.name)}
              </span>
              <span className={`font-bold ${heading}`}>
                {article.author.name}
              </span>
            </span>
            <span className={muted}>{relativeTime(article.publishedAt)}</span>
            <span className={`flex items-center gap-1.5 ${muted}`}>
              <MessageCircle className="w-3.5 h-3.5" />
              {formatCount(article.commentCount)}
            </span>
            <span className={`flex items-center gap-1.5 ${muted}`}>
              <Eye className="w-3.5 h-3.5" />
              {formatCount(article.views)} views
            </span>
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-bold ${
                isDark ? 'bg-yellow-400/10 text-yellow-400' : 'bg-yellow-50 text-yellow-600'
              }`}
            >
              {readTime(article.content)} min read
            </span>
          </div>
        </header>

        {/* ------------------------------------------------------- cover */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-7">
          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-56 sm:h-80 lg:h-[420px] object-cover rounded-2xl"
            />
          ) : (
            <div className="w-full h-56 sm:h-80 lg:h-[420px] rounded-2xl bg-gradient-to-tr from-yellow-400/60 via-lime-400/40 to-emerald-500/60" />
          )}
        </div>

        {/* -------------------------------------------------------- body */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="hidden lg:block lg:col-span-1">
            <ActionBar variant="rail" {...actionProps} />
          </div>

          <div className="lg:col-span-7 min-w-0 space-y-8">
            <StatsStrip article={article} />

            <div id={BODY_ID} className="article-prose">
              {sections.map((section) => (
                <section
                  key={section.id || 'intro'}
                  id={section.id || undefined}
                  dangerouslySetInnerHTML={{ __html: section.html }}
                />
              ))}
            </div>

            <AuthorCard
              name={article.author.name}
              category={article.category.name}
              publishedAt={article.publishedAt}
            />

            <CommentsSection articleId={article.id} />

            <SimilarPosts articles={similar.data ?? []} />
          </div>

          <aside className="lg:col-span-4 w-full space-y-5 lg:sticky lg:top-44">
            <TableOfContents sections={sections} activeId={activeId} />
            <TrendingList articles={popular.data ?? []} />
            <TagCloud tags={tags.data ?? []} />
          </aside>
        </div>
      </main>

      <ActionBar variant="bar" {...actionProps} />
    </>
  )
}
