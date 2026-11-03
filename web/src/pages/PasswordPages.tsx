import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, KeyRound, Loader2, MailCheck } from 'lucide-react'
import { useForgotPassword, useResetPassword } from '../api/password'
import { errorMessage } from '../api/client'
import { useAdminStyles } from '../admin/ui'

/** Shared shell for the two signed-out password screens. */
function AuthShell({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  children: ReactNode
}) {
  const styles = useAdminStyles()
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
          <div className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-yellow-400/10 text-yellow-400">
              {icon}
            </span>
            <h1 className={`mt-4 text-xl font-extrabold ${styles.heading}`}>
              {title}
            </h1>
            <p className={`mt-1 text-sm ${styles.muted}`}>{subtitle}</p>
          </div>
          {children}
        </div>

        <p className={`mt-6 text-center text-xs ${styles.faint}`}>
          <Link to="/login" className="transition-colors hover:text-yellow-400">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

/**
 * Step one: ask for the address on the account. The API always replies the
 * same way, so the copy stays neutral about whether an account exists.
 */
export function ForgotPasswordPage() {
  const styles = useAdminStyles()
  const navigate = useNavigate()
  const forgot = useForgotPassword()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    try {
      await forgot.mutateAsync({ email: email.trim() })
      // The code is tied to the address, so carry it into the reset step.
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`, {
        state: { sent: true },
      })
    } catch (err) {
      setError(errorMessage(err, 'Could not send a reset code'))
    }
  }

  return (
    <AuthShell
      icon={<MailCheck className="h-6 w-6" />}
      title="Forgot your password?"
      subtitle="We’ll email a 6-digit code to reset it."
    >
      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-500">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="forgot-email"
            className={`mb-1.5 block text-xs font-bold ${styles.muted}`}
          >
            Email address
          </label>
          <input
            id="forgot-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={styles.input}
          />
        </div>
        <button
          type="submit"
          disabled={forgot.isPending}
          className={`w-full ${styles.primaryBtn}`}
        >
          {forgot.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MailCheck className="h-4 w-4" />
          )}
          {forgot.isPending ? 'Sending…' : 'Email me a code'}
        </button>
      </form>

      <p className={`mt-5 text-center text-xs ${styles.faint}`}>
        Remembered it?{' '}
        <Link
          to="/login"
          className="font-bold text-yellow-500 hover:text-yellow-400"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

/**
 * Step two: the emailed code plus the new password. The address arrives in
 * the query string so the reader does not retype it, but it stays editable.
 */
export function ResetPasswordPage() {
  const styles = useAdminStyles()
  const [params] = useSearchParams()
  const reset = useResetPassword()
  const resend = useForgotPassword()

  const [email, setEmail] = useState(params.get('email') ?? '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (password.length < 8) {
      setError('The new password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('The new passwords do not match')
      return
    }

    try {
      await reset.mutateAsync({
        email: email.trim(),
        code: code.trim(),
        password,
      })
      setCode('')
      setPassword('')
      setConfirm('')
      setDone(true)
    } catch (err) {
      setError(errorMessage(err, 'Could not reset the password'))
    }
  }

  const handleResend = async () => {
    setError('')
    setNotice('')
    if (!email.trim()) {
      setError('Enter the email address on the account first')
      return
    }
    try {
      await resend.mutateAsync({ email: email.trim() })
      setNotice(`If an account exists for ${email.trim()}, a new code is on its way.`)
    } catch (err) {
      setError(errorMessage(err, 'Could not resend the code'))
    }
  }

  if (done) {
    return (
      <AuthShell
        icon={<CheckCircle2 className="h-6 w-6" />}
        title="Password updated"
        subtitle="Sign in with your new password."
      >
        <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-xs font-bold text-green-500">
          Every other device has been signed out of this account.
        </div>
        <Link
          to="/login"
          className={`mt-4 w-full ${styles.primaryBtn}`}
        >
          Continue to sign in
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      icon={<KeyRound className="h-6 w-6" />}
      title="Set a new password"
      subtitle="Enter the code we emailed you, then choose a password."
    >
      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-500">
          {error}
        </p>
      ) : null}
      {!error && notice ? (
        <p className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-xs font-bold text-yellow-500">
          {notice}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="reset-email"
            className={`mb-1.5 block text-xs font-bold ${styles.muted}`}
          >
            Email address
          </label>
          <input
            id="reset-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={styles.input}
          />
        </div>
        <div>
          <label
            htmlFor="reset-code"
            className={`mb-1.5 block text-xs font-bold ${styles.muted}`}
          >
            Reset code
          </label>
          <input
            id="reset-code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className={`${styles.input} text-center text-lg font-black tracking-[0.4em]`}
          />
        </div>
        <div>
          <label
            htmlFor="reset-password"
            className={`mb-1.5 block text-xs font-bold ${styles.muted}`}
          >
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            className={styles.input}
          />
        </div>
        <div>
          <label
            htmlFor="reset-confirm"
            className={`mb-1.5 block text-xs font-bold ${styles.muted}`}
          >
            Confirm new password
          </label>
          <input
            id="reset-confirm"
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="Type it again"
            className={styles.input}
          />
          {confirm.length > 0 && confirm !== password ? (
            <p className="mt-1.5 text-[11px] font-bold text-amber-500">
              Passwords do not match yet
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={reset.isPending || code.length !== 6 || password !== confirm}
          className={`w-full ${styles.primaryBtn}`}
        >
          {reset.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          {reset.isPending ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-xs">
        <Link
          to="/forgot-password"
          className={`font-bold ${styles.muted} hover:text-yellow-400`}
        >
          Use another email
        </Link>
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resend.isPending}
          className={`font-bold ${styles.muted} hover:text-yellow-400`}
        >
          {resend.isPending ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </AuthShell>
  )
}
