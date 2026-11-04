import { useRef } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useEditableArticleQuery } from '../api/queries'
import { useMyArticles } from '../api/admin'
import { useAuth } from '../auth/AuthContext'
import { ArticleEditor } from './ArticleEditor'
import { useAdminStyles } from './ui'

/**
 * Editor route reached from an article's Edit button.
 *
 * The dashboard links here with a slug, and a slug alone cannot resolve a
 * draft: the public /articles/:slug route only returns published stories,
 * while the author-scoped /articles/mine/:id and /articles/mine/:slug routes
 * can return the draft. All three race and the first successful read is used,
 * which is what lets an admin or editor open a story they published
 * themselves (and an author open their own draft).
 *
 * The all-articles editor also accepts a numeric article id so every story
 * can be opened directly. The id-by-id read race keeps drafts editable and
 * published stories readable for editors and admins alike.
 */
export function EditArticlePage() {
  // The edit link in the card carries an id (the all-articles list), but the
  // original author-scoped route used a slug. This param is either a slug or a
  // uuid, so drop any leading slash and pass both forms to the read race.
  const raw = useParams().id ?? useParams().slug ?? ''
  const id = raw.replace(/^\//, '')
  const isId = /^[_a-z0-9-]{21,}$/i.test(id)
  const slugParam = isId ? undefined : id
  const idParam = isId ? id : undefined
  const navigate = useNavigate()
  const styles = useAdminStyles()
  const { user } = useAuth()
  // Holds the save message so onClose — which runs immediately after onSaved —
  // can pass it to the list page; reading state there would still be stale.
  const savedMessage = useRef('')

  // The all-articles editor passes the article id directly, so the form opens
  // any story on the site. The id-scoped read race keeps drafts editable and
  // published stories readable for editors and admins alike. The slug-only
  // fallback still resolves published stories and own drafts.
  const { data: list } = useMyArticles({ limit: 50 })
  const { data: article, isLoading } = useEditableArticleQuery(
    slugParam,
    idParam ?? list?.items.find((item: { id: string }) => item.id === id)?.id,
  )

  const back = () => navigate(-1)

  if (!isLoading && !article) {
    return (
      <div className="text-center">
        <h1 className={`text-xl font-black ${styles.heading}`}>Article not found</h1>
        <p className={`mt-2 text-sm ${styles.muted}`}>
          It may have been removed, or the link is out of date.
        </p>
        <button type="button" onClick={back} className={`${styles.ghostBtn} mt-4`}>
          Go back
        </button>
      </div>
    )
  }

  // Readers never reach the form; authors only edit what they wrote.
  const editable =
    user?.role === 'ADMIN' ||
    user?.role === 'EDITOR' ||
    (user?.role === 'AUTHOR' && user.id === article?.author?.id)

  if (!article || !editable) {
    return (
      <Navigate
        to={article?.slug ? `/post/${article.slug}` : '/admin/articles'}
        replace
      />
    )
  }

  return (
    <>
      {/* Saving or cancelling returns to the dashboard list, never the
          reader-facing story page; a save carries its confirmation along. */}
      <ArticleEditor
        article={article}
        onClose={() =>
          navigate('/admin/articles', {
            state: savedMessage.current
              ? { notice: savedMessage.current }
              : undefined,
          })
        }
        onSaved={(message) => {
          savedMessage.current = message
        }}
      />
    </>
  )
}
