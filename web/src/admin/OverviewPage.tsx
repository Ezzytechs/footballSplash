import { Link } from 'react-router-dom'
import { FileText, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useMyArticles, useProfileStats, useUserStats } from '../api/admin'
import { StatusBadge, PageHeader, SkeletonRows, useAdminStyles } from './ui'

export function OverviewPage() {
  const styles = useAdminStyles()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const mine = useMyArticles({ limit: 50 })
  const profile = useProfileStats()
  const siteUsers = useUserStats(isAdmin)

  const articles = mine.data?.items ?? []

  const stats = [
    { label: 'Your articles', value: profile.data?.articles ?? mine.data?.meta.total ?? 0 },
    { label: 'Drafts', value: articles.filter((a) => a.status === 'DRAFT').length },
    { label: 'Published', value: articles.filter((a) => a.status === 'PUBLISHED').length },
    { label: 'Your comments', value: profile.data?.comments ?? 0 },
    { label: 'Your saves', value: profile.data?.bookmarks ?? 0 },
    ...(isAdmin
      ? [{ label: 'Accounts', value: siteUsers.data?.total ?? 0 }]
      : []),
  ]

  const shortcuts = [
    { to: '/admin/articles', label: 'Articles' },
    { to: '/admin/categories', label: 'Categories', roles: ['ADMIN', 'EDITOR'] },
    { to: '/admin/tags', label: 'Tags', roles: ['ADMIN', 'EDITOR'] },
    { to: '/admin/users', label: 'Users', roles: ['ADMIN'] },
  ].filter((item) => !item.roles || (user && item.roles.includes(user.role)))

  return (
    <div>
      <PageHeader
        title="Overview"
        icon={<LayoutDashboard className="w-5 h-5 text-yellow-400" />}
        hint={`Signed in as ${user?.name ?? ''}`}
      />

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-2xl border p-4 ${styles.surface}`}>
            <dt className={`text-[11px] font-black uppercase tracking-wider ${styles.muted}`}>
              {stat.label}
            </dt>
            <dd className={`mt-1 text-2xl font-black tabular-nums ${styles.heading}`}>
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="mt-8">
        <PageHeader
          title="Recent articles"
          icon={<FileText className="w-5 h-5 text-yellow-400" />}
        />

        {mine.isLoading && <SkeletonRows rows={2} />}

        {!mine.isLoading && articles.length === 0 && (
          <p className={`mt-4 text-sm ${styles.muted}`}>No articles yet.</p>
        )}

        <div className="mt-4 space-y-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${styles.surface}`}
            >
              <div className="min-w-0">
                <p className={`truncate text-sm font-black ${styles.heading}`}>
                  {article.title}
                </p>
                <p className={`mt-0.5 text-xs ${styles.muted}`}>
                  {article.category.name} · {article.author.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={article.status as never} />
                <div className="flex items-center gap-2">
                  <Link
                    to={`/post/${article.slug}`}
                    className="rounded-lg border border-zinc-600/40 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-zinc-300 transition-colors hover:border-yellow-400/60 hover:text-yellow-400"
                  >
                    View
                  </Link>
                  <Link
                    to={`/admin/articles/${article.slug}/edit`}
                    className="rounded-lg bg-yellow-400 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-black transition-colors hover:bg-yellow-300"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className={`text-xs font-black uppercase tracking-widest ${styles.muted}`}>
          Shortcuts
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-2xl border p-4 text-sm font-black transition-colors hover:border-yellow-400/60 ${styles.surface} ${styles.heading}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
