import axios from 'axios'

export const TOKEN_KEY = 'splash.accessToken'

/**
 * Same-origin client: vite proxies /api -> the NestJS server, so there is no
 * CORS setup needed in development and the base URL stays relative.
 */
export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
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
