import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { errorMessage } from '../api/client'
import { useAdminStyles } from './ui'

type LocationState = { from?: { pathname: string } } | null

/**
 * Shared sign-in screen for readers (/login) and staff (/admin/login). After a
 * successful sign-in each role lands where it can actually work: readers on
 * the site, editors and admins in the dashboard.
 */
export function LoginPage() {
  const styles = useAdminStyles()
  const location = useLocation()
  const { user, status, signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const from = (location.state as LocationState)?.from?.pathname

  if (status === 'authenticated' && user) {
    const target = user.role === 'READER' ? '/' : '/admin'
    return <Navigate to={from ?? target} replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(errorMessage(err, 'Could not sign in'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={`flex min-h-screen items-center justify-center px-4 py-12 ${
        styles.isDark ? 'bg-[#070b10]' : 'bg-zinc-50'
      }`}
    >
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr from-yellow-400 via-lime-400 to-emerald-500 text-black">
            ⚡
          </span>
          <span className="text-2xl font-black italic uppercase tracking-tighter">
            SPLASH<span className="text-yellow-400">FOOTBALL</span>
          </span>
        </Link>

        <div className={`rounded-2xl border p-6 sm:p-8 ${styles.surface}`}>
          <h1 className={`text-xl font-extrabold ${styles.heading}`}>Sign in</h1>
          <p className={`mt-1 text-sm ${styles.muted}`}>
            Readers comment on stories; editors and admins manage the newsroom.
          </p>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-500">
              {error}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="email" className={`mb-1.5 block text-xs font-bold ${styles.muted}`}>
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={styles.input}
              />
            </div>
            <div>
              <label htmlFor="password" className={`mb-1.5 block text-xs font-bold ${styles.muted}`}>
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={styles.input}
              />
            </div>
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-[11px] font-bold text-yellow-600 transition-colors hover:text-yellow-500"
              >
                Forgot password?
              </Link>
            </div>
            <button type="submit" disabled={busy} className={`w-full ${styles.primaryBtn}`}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className={`mt-5 text-center text-xs ${styles.faint}`}>
            No account yet?{' '}
            <Link to="/signup" className="font-bold text-yellow-500 hover:text-yellow-400">
              Sign up
            </Link>
          </p>
        </div>

        <p className={`mt-6 text-center text-xs ${styles.faint}`}>
          <Link to="/" className="hover:text-yellow-400">
            ← Back to the site
          </Link>
        </p>
      </div>
    </div>
  )
}
