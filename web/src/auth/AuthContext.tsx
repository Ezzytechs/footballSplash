import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  api,
  clearAccessToken,
  getStoredAccessToken,
  storeAccessToken,
  storeRefreshCookie,
} from '../api/client'
import type { AuthTokens, SessionUser, SigninResponse } from '../api/types'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  user: SessionUser | null
  status: AuthStatus
  /** POST /auth/signin — rejects with the API's error message on failure. */
  signIn: (email: string, password: string) => Promise<void>
  /** POST /auth/signup — creates a READER account and emails a verification code. */
  signUp: (name: string, email: string, password: string) => Promise<void>
  /** POST /auth/otp/request with purpose LOGIN (email a 6-digit code). */
  requestLoginCode: (email: string) => Promise<void>
  /** POST /auth/otp/request with purpose EMAIL_VERIFICATION (resend the signup code). */
  requestVerificationCode: (email: string) => Promise<void>
  /** POST /auth/otp/verify with purpose LOGIN — signs the user in. */
  verifyLoginCode: (email: string, code: string) => Promise<void>
  /** POST /auth/otp/verify with purpose EMAIL_VERIFICATION — verifies and signs in. */
  verifyEmailCode: (email: string, code: string) => Promise<void>
  signOut: () => Promise<void>
  /** True when the active session has been revoked/rotated away by another device. */
  revoked: boolean
  /** Replaces the cached session user after a successful profile update. */
  updateUser: (user: SessionUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  // Set by the response interceptor the first time the access token is
  // rotated away by another device (or the refresh endpoint rejects the
  // rotation). Clears the whole session the next time it is read.
  const [revoked, setRevoked] = useState(false)

  const clearSession = useCallback(() => {
    // The refresh cookie is HttpOnly and cleared by the backend's logout;
    // the bearer token is ours to drop.
    clearAccessToken()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const persistSession = useCallback((tokens: AuthTokens & { user: SessionUser }) => {
    // Access token -> localStorage (attached to every resource request).
    storeAccessToken(tokens.accessToken)
    // Refresh token -> cookie only, never localStorage. Ignored when the
    // backend already set the same name as an HttpOnly cookie.
    if (tokens.refreshToken) storeRefreshCookie(tokens.refreshToken)
    setUser(tokens.user)
    setStatus('authenticated')
    setRevoked(false)
  }, [])

  // Restore a saved session on first load; anything invalid signs out.
  useEffect(() => {
    let cancelled = false
    if (!getStoredAccessToken()) {
      setStatus('anonymous')
      return
    }
    api
      .get<SessionUser>('/auth/me')
      .then(({ data }) => {
        if (cancelled) return
        setUser(data)
        setStatus('authenticated')
      })
      .catch(() => {
        if (!cancelled) clearSession()
      })
    return () => {
      cancelled = true
    }
  }, [clearSession])

  // The response interceptor revokes a session the moment it is rotated
  // away, so a subsequent authenticated call is never shipped with a
  // missing token.
  useEffect(() => {
    if (!revoked) return
    clearSession()
  }, [revoked, clearSession])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<SigninResponse>('/auth/signin', {
        email,
        password,
      })
      persistSession(data)
    },
    [persistSession],
  )

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    await api.post('/auth/signup', { name, email, password })
  }, [])

  const requestLoginCode = useCallback(async (email: string) => {
    await api.post('/auth/otp/request', { email, purpose: 'LOGIN' })
  }, [])

  const requestVerificationCode = useCallback(async (email: string) => {
    await api.post('/auth/otp/request', { email, purpose: 'EMAIL_VERIFICATION' })
  }, [])

  const verifyLoginCode = useCallback(
    async (email: string, code: string) => {
      const { data } = await api.post<SigninResponse>('/auth/otp/verify', {
        email,
        code,
        purpose: 'LOGIN',
      })
      persistSession(data)
    },
    [persistSession],
  )

  const verifyEmailCode = useCallback(
    async (email: string, code: string) => {
      const { data } = await api.post<SigninResponse>('/auth/otp/verify', {
        email,
        code,
        purpose: 'EMAIL_VERIFICATION',
      })
      persistSession(data)
    },
    [persistSession],
  )

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout', { refreshToken: '' })
    } catch {
      // The local session is cleared either way.
    }
    clearSession()
  }, [clearSession])

  // Used by the profile page so the navbar greets the new name immediately
  // instead of waiting for the next /auth/me.
  const updateUser = useCallback((next: SessionUser) => setUser(next), [])

  const ctxValue = useMemo(
    () => ({
      user,
      status,
      signIn,
      signUp,
      requestLoginCode,
      requestVerificationCode,
      verifyLoginCode,
      verifyEmailCode,
      signOut,
      revoked,
      updateUser,
    }),
    [user, status, signIn, signUp, requestLoginCode, requestVerificationCode, verifyLoginCode, verifyEmailCode, signOut, revoked, updateUser],
  )

  return <AuthContext.Provider value={ctxValue}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
