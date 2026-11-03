import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Loader2, Mail, UserPlus } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { errorMessage } from '../api/client'
import { useAdminStyles } from '../admin/ui'

type Step = 'details' | 'verify'
type LocationState = { from?: { pathname: string } } | null

/** Public registration: name + email + password, then the emailed 6-digit code. */
export function SignupPage() {
  const styles = useAdminStyles()
  const location = useLocation()
  const { status, signUp, requestVerificationCode, verifyEmailCode } = useAuth()

  const [step, setStep] = useState<Step>('details')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const from = (location.state as LocationState)?.from?.pathname

  // A signed-in visitor has nothing left to register.
  if (status === 'authenticated') {
    return <Navigate to={from ?? '/'} replace />
  }

  const handleDetailsSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setBusy(true)
    try {
      await signUp(name.trim(), email.trim(), password)
      setNotice(`We sent a 6-digit code to ${email.trim()}.`)
      setStep('verify')
    } catch (err) {
      setError(errorMessage(err, 'Could not create the account'))
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setBusy(true)
    try {
      await requestVerificationCode(email.trim())
      setNotice(`If an account exists for ${email.trim()}, a new code is on its way.`)
    } catch (err) {
      setError(errorMessage(err, 'Could not resend the code'))
    } finally {
      setBusy(false)
    }
  }

  const handleVerifySubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      // Verifying EMAIL_VERIFICATION signs the new account in.
      await verifyEmailCode(email.trim(), code.trim())
    } catch (err) {
      setError(errorMessage(err, 'Could not verify the code'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${styles.isDark ? 'bg-[#070b10]' : 'bg-white'}`}>
      <div className="w-full max-w-md">
        {/* Brand */}
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr from-yellow-400 via-lime-400 to-emerald-500 text-black shadow-lg shadow-lime-500/20">
            ⚡
          </span>
          <span className="text-2xl font-black italic tracking-tighter uppercase">
            SPLASH<span className="text-yellow-400">FOOTBALL</span>
          </span>
        </Link>

        <div className={`rounded-2xl border p-6 sm:p-8 ${styles.surface}`}>
          <div className="mb-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-yellow-400/10 text-yellow-400">
              {step === 'details' ? (
                <UserPlus className="w-6 h-6" />
              ) : (
                <Mail className="w-6 h-6" />
              )}
            </span>
            <h1 className={`mt-4 text-xl font-extrabold ${styles.heading}`}>
              {step === 'details' ? 'Create your account' : 'Check your inbox'}
            </h1>
            <p className={`mt-1 text-sm ${styles.muted}`}>
              {step === 'details'
                ? 'Join to comment on stories, like posts and save what matters.'
                : `We sent a 6-digit code to ${email}.`}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-500">
              {error}
            </div>
          )}
          {!error && notice && (
            <div className="mb-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-xs font-bold text-yellow-500">
              {notice}
            </div>
          )}

          {step === 'details' ? (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div>
                <label className={`mb-1.5 block text-xs font-bold ${styles.muted}`} htmlFor="name">
                  Display name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  maxLength={100}
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Alex Fan"
                  className={styles.input}
                />
              </div>
              <div>
                <label className={`mb-1.5 block text-xs font-bold ${styles.muted}`} htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className={styles.input}
                />
              </div>
              <div>
                <label className={`mb-1.5 block text-xs font-bold ${styles.muted}`} htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className={styles.input}
                />
              </div>
              <div>
                <label className={`mb-1.5 block text-xs font-bold ${styles.muted}`} htmlFor="confirm-password">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="Type it again"
                  className={styles.input}
                />
              </div>
              <button type="submit" disabled={busy} className={`w-full ${styles.primaryBtn}`}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {busy ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className={`mb-1.5 block text-xs font-bold ${styles.muted}`} htmlFor="signup-code">
                  Verification code
                </label>
                <input
                  id="signup-code"
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
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className={`w-full ${styles.primaryBtn}`}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {busy ? 'Verifying…' : 'Verify & start commenting'}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('details')
                    setError('')
                    setNotice('')
                  }}
                  className={`font-bold ${styles.muted} hover:text-yellow-400`}
                >
                  ← Change details
                </button>
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={busy}
                  className={`font-bold ${styles.muted} hover:text-yellow-400`}
                >
                  Resend code
                </button>
              </div>
            </form>
          )}
        </div>

        <p className={`mt-6 text-center text-xs ${styles.faint}`}>
          {step === 'details' ? (
            <>
              Already have an account?{' '}
              <Link
                to="/login"
                state={from ? { from: { pathname: from } } : undefined}
                className="font-bold text-yellow-400 hover:text-yellow-300"
              >
                Sign in
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={busy}
              className="font-bold hover:text-yellow-400"
            >
              Nothing arrived? Resend the code
            </button>
          )}
        </p>

        <p className={`mt-3 text-center text-xs ${styles.faint}`}>
          <Link to="/" className="transition-colors hover:text-yellow-400">
            ← Back to the site
          </Link>
        </p>
      </div>
    </div>
  )
}
