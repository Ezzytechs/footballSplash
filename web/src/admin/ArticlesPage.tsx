import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useAllArticles, useMyArticles } from '../api/admin'
import type { ArticleStatus } from '../api/types'
import { ArticleCard, EmptyState, PageHeader, SkeletonRows, useAdminStyles } from './ui'
import { ArticleEditor } from './ArticleEditor'

const STAFF_VIEWS: Array<{ label: string; value: 'my' | 'all' }> = [
  { label: 'All articles', value: 'all' },
  { label: 'My articles', value: 'my' },
]

const FILTERS: Array<{ label: string; value: ArticleStatus | '' }> = [
  { label: 'All', value: '' },
  { label: 'Drafts', value: 'DRAFT' },
  { label: 'In review', value: 'REVIEW' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Archived', value: 'ARCHIVED' },
]

export function ArticlesPage() {
  const styles = useAdminStyles()
  const { user } = useAuth()

  // `mine` lists only the signed-in author's stories (drafts included).
  // `all` lists every article on the site, regardless of author.
  const isAdminOrEditor = user?.role === 'ADMIN' || user?.role === 'EDITOR'

  const [status, setStatus] = useState<ArticleStatus | ''>('')
  const [search, setSearch] = useState('')
  // Staff land on the whole site; an author has only their own room.
  const [view, setView] = useState<'my' | 'all'>(
    isAdminOrEditor ? 'all' : 'my',
  )
  const [editorOpen, setEditorOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const location = useLocation()
  const navigate = useNavigate()

  // The dedicated edit page hands its "Article updated" message over in the
  // navigation state, so the confirmation lands on this list rather than on
  // the page that just closed. Clearing the state keeps a refresh clean.
  useEffect(() => {
    const state = location.state as { notice?: string } | null
    if (!state?.notice) return
    setNotice(state.notice)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])

  // `mine` lists only the signed-in author's stories (drafts included).
  // `all` lists every article on the site, regardless of author, and is only
  // opened for editors and admins. Both hooks stay mounted and one is disabled
  // so switching rooms never fires a wasted request. Status and search are
  // applied server-side on either list.
  const params = { status, search: search.trim(), limit: 50 }
  const viewingAll = view === 'all' && isAdminOrEditor
  const mineQuery = useMyArticles(params, !viewingAll)
  const allQuery = useAllArticles(params, viewingAll)
  const { data, isLoading, isError, error, refetch } = viewingAll
    ? allQuery
    : mineQuery

  const articles = data?.items ?? []
  const canWrite = isAdminOrEditor

  return (
    <div>
      <PageHeader
        title="Articles"
        icon={<FileText className="w-5 h-5 text-yellow-400" />}
        hint={
          user?.role === 'AUTHOR'
            ? 'Your drafts and submitted stories.'
            : 'Every story on the site, or just the ones you wrote.'
        }
        action={
          canWrite ? (
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className={styles.primaryBtn}
            >
              <Plus className="w-3.5 h-3.5" />
              New article
            </button>
          ) : null
        }
      />

      {notice ? (
        <p className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-xs font-bold text-green-500">
          {notice}
        </p>
      ) : null}

      {/* View filter: the whole site or only this author's room. Staff only. */}
      {isAdminOrEditor && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {STAFF_VIEWS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setView(option.value)}
              aria-pressed={view === option.value}
              className={`rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition-colors ${view === option.value ? 'bg-yellow-400 text-black' : styles.isDark ? 'border border-zinc-800 text-zinc-400 hover:text-yellow-400' : 'border border-zinc-200 text-zinc-600 hover:border-yellow-500/60'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Filters. Archived stories live outside an author's room, so that pill
          is staff-only. */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {FILTERS.filter(
          (filter) => filter.value !== 'ARCHIVED' || isAdminOrEditor,
        ).map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => setStatus(filter.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-colors ${status === filter.value ? 'bg-yellow-400 text-black' : styles.isDark ? 'border border-zinc-800 text-zinc-400 hover:text-yellow-400' : 'border border-zinc-200 text-zinc-600 hover:border-yellow-500/60'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label htmlFor="article-search" className="sr-only">
          Search articles
        </label>
        <input
          id="article-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={viewingAll ? 'Search all articles…' : 'Search your articles…'}
          className={styles.input}
        />
      </div>

      {isLoading && <SkeletonRows rows={3} />}

      {!isLoading && isError && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="text-sm font-bold text-red-500">
            Could not load {viewingAll ? 'the articles' : 'your articles'}.
          </p>
          <p className="mt-1 text-xs text-red-400">{(error as Error).message}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className={`${styles.primaryBtn} mt-4`}
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && articles.length === 0 && (
        <EmptyState
          icon="📰"
          heading={search.trim() || status ? 'No matches' : 'No articles yet'}
          body={
            search.trim() || status
              ? 'Try a different title or clear the filters.'
              : viewingAll
                ? 'No stories on the site yet.'
                : 'Your first story starts here.'
          }
          action={
            canWrite ? (
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className={styles.primaryBtn}
              >
                <Plus className="w-3.5 h-3.5" />
                Write an article
              </button>
            ) : null
          }
        />
      )}

      {!isLoading && !isError && articles.length > 0 && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} canEdit />
            ))}
          </div>
          <p className={`mt-6 border-t pt-4 text-xs ${styles.border} ${styles.faint}`}>
            Showing {articles.length} of {data?.meta.total ?? articles.length} article
            {articles.length === 1 ? '' : 's'}
          </p>
        </>
      )}

      {editorOpen && (
        <ArticleEditor
          onClose={() => setEditorOpen(false)}
          onSaved={(message) => {
            setNotice(message)
            void refetch()
          }}
        />
      )}
    </div>
  )
}
