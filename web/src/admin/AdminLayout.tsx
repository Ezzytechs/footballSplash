import type { ReactNode } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  FileText,
  LayoutDashboard,
  FolderTree,
  Tags,
  Users,
  ExternalLink,
  LogOut,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import type { UserRole } from '../api/types'
import { ThemeToggle } from '../component/home/ThemeToggle'
import { useAdminStyles, Badge } from './ui'

interface AdminNavItem {
  to: string
  label: string
  icon: typeof FileText
  /** Roles allowed on this screen; omitted means every editorial role. */
  roles?: UserRole[]
}

const MANAGERS: UserRole[] = ['ADMIN', 'EDITOR']

const NAV_ITEMS: AdminNavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/articles', label: 'Articles', icon: FileText },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree, roles: MANAGERS },
  { to: '/admin/tags', label: 'Tags', icon: Tags, roles: MANAGERS },
  { to: '/admin/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
]

/**
 * Blocks a dashboard screen the signed-in role may not use. Wraps the routes
 * in AppRoutes so a hand-typed URL cannot reach another role's tools.
 */
export function RoleGate({
  allow,
  children,
}: {
  allow: UserRole[]
  children: ReactNode
}) {
  const { user, status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070b10]">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    )
  }

  if (!user) return <Navigate to="/admin/login" replace />
  if (!allow.includes(user.role)) return <Navigate to="/admin" replace />

  return <>{children}</>
}

export function AdminLayout() {
  const styles = useAdminStyles()
  const { user, status, signOut } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070b10]">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    )
  }

  if (status === 'anonymous' || !user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  // Readers have no dashboard — they comment, like and bookmark from the site.
  if (user.role === 'READER') {
    return <Navigate to="/" replace />
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user.role),
  )

  return (
    <div className={`min-h-screen ${styles.isDark ? 'bg-[#070b10]' : 'bg-zinc-50'}`}>
      <div className="mx-auto flex max-w-7xl">
        {/* ---------------------------------------------------- sidebar */}
        <aside
          className={`sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r px-4 py-6 lg:flex ${styles.border} ${
            styles.isDark ? 'bg-[#0a0e14]' : 'bg-white'
          }`}
        >
          <NavLink to="/" className="mb-8 flex items-center gap-2 px-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-yellow-400 via-lime-400 to-emerald-500 text-black">
              ⚡
            </span>
            <span className="text-lg font-black italic tracking-tighter uppercase">
              SPLASH<span className="text-yellow-400">FOOTBALL</span>
            </span>
          </NavLink>

          <nav className="flex-1 space-y-1" aria-label="Dashboard">
            {visibleItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-wider transition-colors ${
                      isActive
                        ? 'bg-yellow-400 text-black'
                        : styles.isDark
                          ? 'text-zinc-400 hover:bg-zinc-900 hover:text-yellow-400'
                          : 'text-zinc-600 hover:bg-zinc-100 hover:text-yellow-600'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className={`space-y-3 border-t pt-4 ${styles.border}`}>
            <div className="px-2">
              <p className={`truncate text-xs font-bold ${styles.heading}`}>{user.name}</p>
              <p className={`mt-1 text-[11px] ${styles.muted}`}>{user.email}</p>
              <div className="mt-2">
                <Badge label={user.role} />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2">
              <ThemeToggle />
              <span className={`text-xs font-bold ${styles.muted}`}>Change theme</span>
            </div>
            <a
              href="/"
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${styles.muted} hover:text-yellow-400`}
            >
              <ExternalLink className="w-4 h-4" /> View site
            </a>
            <button
              type="button"
              onClick={() => void signOut()}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${styles.muted} hover:text-red-400`}
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </aside>

        {/* ----------------------------------------------------- content */}
        <div className="min-w-0 flex-1">
          {/* Mobile top bar */}
          <div
            className={`sticky top-0 z-40 flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-md lg:hidden ${styles.border} ${
              styles.isDark ? 'bg-[#0a0e14]/95' : 'bg-white/95'
            }`}
          >
            <span className="text-sm font-black italic uppercase">
              SPLASH{' '}
              <span className="text-yellow-400">
                {user.role === 'ADMIN' ? 'ADMIN' : `${user.role} DASH`}
              </span>
            </span>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Badge label={user.role} />
              <button
                type="button"
                onClick={() => void signOut()}
                aria-label="Sign out"
                className={`p-2 ${styles.muted} hover:text-red-400`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile nav chips */}
          <div
            className={`flex gap-2 overflow-x-auto border-b px-4 py-3 lg:hidden ${styles.border}`}
          >
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  `shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'border-yellow-400 bg-yellow-400 text-black'
                      : styles.isDark
                        ? 'border-zinc-800 text-zinc-400'
                        : 'border-zinc-200 text-zinc-600'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
