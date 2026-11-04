import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../component/home/themedContext'
import type { ArticleStatus, ArticleSummary, UserRole } from '../api/types'
import { useAdminStyles } from './styles'

export { useAdminStyles }

const ROLE_STYLES: Record<UserRole, string> = {
  ADMIN: 'bg-red-500/15 text-red-400',
  EDITOR: 'bg-blue-500/15 text-blue-400',
  AUTHOR: 'bg-amber-500/15 text-amber-400',
  READER: 'bg-zinc-500/15 text-zinc-400',
}

const STATUS_STYLES: Record<ArticleStatus, string> = {
  DRAFT: 'bg-zinc-500/15 text-zinc-400',
  REVIEW: 'bg-blue-500/15 text-blue-400',
  PUBLISHED: 'bg-green-500/15 text-green-400',
  ARCHIVED: 'bg-zinc-700/15 text-zinc-500',
}

export function Badge({ label }: { label: string }) {
  const role = label as UserRole
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${
        ROLE_STYLES[role] ?? 'bg-zinc-500/15 text-zinc-400'
      }`}
    >
      {label}
    </span>
  )
}

export function StatusBadge({ status }: { status: ArticleStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${
        STATUS_STYLES[status] ?? 'bg-zinc-500/15 text-zinc-400'
      }`}
    >
      {status}
    </span>
  )
}

export interface PageHeaderProps {
  title: string
  icon?: ReactNode
  hint?: string
  action?: ReactNode
}

export function PageHeader({ title, icon, hint, action }: PageHeaderProps) {
  const styles = useAdminStyles()
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-3">
          {icon}
          <h1 className={`text-xl font-black uppercase tracking-tight ${styles.heading}`}>
            {title}
          </h1>
        </div>
        {hint ? <p className={`mt-1 text-xs ${styles.muted}`}>{hint}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  const styles = useAdminStyles()
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={`rounded-2xl border p-4 ${styles.surface}`}
        >
          <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-400/30" />
          <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-zinc-400/20" />
          <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-zinc-400/20" />
        </div>
      ))}
    </div>
  )
}

export interface ModalProps {
  open?: boolean
  wide?: boolean
  title: string
  onClose: () => void
  children?: ReactNode
  body?: ReactNode
  confirmLabel?: string
  onConfirm?: () => void
  cancelLabel?: string
}

/** Minimal theme-aware dialog: either passes a `body` or children. */
export function Modal({
  open = true,
  wide = false,
  title,
  onClose,
  children,
  body,
  confirmLabel = 'Confirm',
  onConfirm,
  cancelLabel = 'Cancel',
}: ModalProps) {
  const styles = useAdminStyles()
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4 py-6"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full overflow-auto rounded-2xl border p-6 shadow-2xl ${
          wide ? 'max-w-3xl' : 'max-w-md'
        } ${styles.surface}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className={`text-lg font-black uppercase tracking-tight ${styles.heading}`}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={`rounded-lg px-2 py-1 text-xs font-black ${styles.muted} hover:text-yellow-500`}
          >
            ✕
          </button>
        </div>

        <div className="mt-4">{children ?? body}</div>

        {onConfirm ? (
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className={styles.ghostBtn}>
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={styles.primaryBtn}
            >
              {confirmLabel}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export interface ArticleCardProps {
  article: ArticleSummary
  canEdit?: boolean
}

export function ArticleCard({ article, canEdit = false }: ArticleCardProps) {
  const styles = useAdminStyles()
  const { theme } = useTheme()
  const isDark = theme === 'night'
  const date = article.publishedAt ?? article.createdAt

  return (
    <article
      className={`flex flex-col rounded-2xl border p-4 transition-shadow hover:shadow-md ${styles.surface}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={`line-clamp-2 text-sm font-black ${styles.heading}`}>
            {article.title}
          </h3>
          {article.excerpt ? (
            <p className={`mt-1 line-clamp-2 text-xs ${styles.muted}`}>{article.excerpt}</p>
          ) : null}
        </div>          {canEdit ? (            <Link              to={`/admin/articles/${article.id}/edit`}              className="shrink-0 rounded-lg bg-yellow-400 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-black transition-colors hover:bg-yellow-300"            >              Edit            </Link>          ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={article.status as ArticleStatus} />
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${
            isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          {article.category.name}
        </span>
        <span className={`text-[11px] ${styles.muted}`}>{article.author.name}</span>
      </div>

      <div className={`mt-3 flex items-center gap-3 text-[11px] ${styles.faint}`}>
        <span>{article.views} views</span>
        <span>·</span>
        <span>{article.likeCount} likes</span>
        <span>·</span>
        <span>
          {new Date(date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </article>
  )
}

export interface EmptyStateProps {
  icon: string
  heading: string
  body: string
  action?: ReactNode
}

export function EmptyState({ icon, heading, body, action }: EmptyStateProps) {
  const styles = useAdminStyles()
  return (
    <div
      className={`mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center ${
        styles.isDark ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-300 bg-white/70'
      }`}
    >
      <span className="text-3xl">{icon}</span>
      <h2 className={`mt-4 text-lg font-black uppercase ${styles.heading}`}>{heading}</h2>
      <p className={`mt-1 max-w-md text-sm ${styles.muted}`}>{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
