import axios from 'axios'

/**
 * Access token lives in localStorage so it survives reloads and can be
 * attached to every resource request as a Bearer header. The refresh token
 * lives only in the cookie jar (HttpOnly, set by the backend) and never in
 * localStorage — it rides along automatically on same-origin calls.
 */
export const TOKEN_KEY = 'splash.accessToken'
export const REFRESH_COOKIE = 'splash.refreshToken'

/**
 * The API lives under /api/v1 on every environment:
 * - development: vite proxies /api -> the NestJS server (see vite.config.ts)
 * - production:  vercel.json rewrites /api -> https://sportsplashapi.vercel.app/api
 *
 * Both keep requests same-origin, so no CORS setup is needed. Set VITE_API_URL
 * to point at a different API deployment without touching code.
 */
const baseURL = import.meta.env.VITE_API_URL || '/api/v1'

export const api = axios.create({
  baseURL,
  timeout: 15000,
})

/* ------------------------------------------------- token persistence */

/** The short-lived bearer token used to fetch resources. */
export function getStoredAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function storeAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Refresh token helpers. The backend sets the cookie HttpOnly (so JS can
 * neither read nor clear it); these only handle the fallback case where the
 * refresh token arrives in the response body instead. It is still written to
 * the cookie — never to localStorage.
 */
function readRefreshCookie(): string | null {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + REFRESH_COOKIE + '=([^;]*)'),
  )
  return match ? decodeURIComponent(match[1]) : null
}

export function storeRefreshCookie(token: string): void {
  document.cookie =
    REFRESH_COOKIE +
    '=' +
    encodeURIComponent(token) +
    '; path=/; max-age=604800; SameSite=Lax'
}

/* ------------------------------------------------------- interceptors */

/**
 * Intercepts 401 responses, swaps the expired access token for a fresh one
 * using the refresh token (cookie, sent automatically by the browser), and
 * replays the failed request once. The refresh token is rotated on every
 * exchange, so a replayed revoke later only invalidates the new bearer of
 * that rotation.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // A 401 can only mean two things: the user is not signed in, or the
    // bearer token expired. Both land on the same wire path here; the login
    // screen is the fallback if neither refresh succeeds.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // The HttpOnly cookie is attached by the browser automatically; the
      // body value only covers the fallback cookie written by this client.
      const refreshToken = readRefreshCookie()

      try {
        const { data } = await axios.post<{
          accessToken: string
          refreshToken?: string
          expiresIn: number
          tokenType?: string
        }>(`${baseURL}/auth/refresh`, refreshToken ? { refreshToken } : {})

        const tokens = data

        // Persist the new bearer token for resource requests; the rotated
        // refresh token goes back into the cookie jar (ignored when the
        // backend already set an HttpOnly cookie of the same name).
        storeAccessToken(tokens.accessToken)
        if (tokens.refreshToken) storeRefreshCookie(tokens.refreshToken)

        // Re-issue the request with the fresh bearer token.
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`
        return axios(originalRequest)
      } catch (refreshError) {
        // Rotation failed: this session is dead, so drop the bearer token
        // so the login screen is the only path forward.
        clearAccessToken()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** True when a request failed because the visitor is not signed in. */
export function isAuthError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401
}

export function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined
    const message = data?.message
    if (Array.isArray(message)) return message[0]
    if (typeof message === 'string') return message
    if (error.response) return `${fallback} (${error.response.status})`
    return 'Cannot reach the server'
  }
  return fallback
}