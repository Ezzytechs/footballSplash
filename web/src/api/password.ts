import { useMutation } from '@tanstack/react-query'
import { api } from './client'

/**
 * POST /auth/password/forgot — emails a 6-digit PASSWORD_RESET code. The API
 * answers the same way for unknown addresses, so the form never reveals
 * whether an account exists.
 */
export function useForgotPassword() {
  return useMutation<{ message: string }, unknown, { email: string }>({
    mutationFn: async (body) => {
      const { data } = await api.post<{ message: string }>(
        '/auth/password/forgot',
        body,
      )
      return data
    },
  })
}

export interface ResetPasswordInput {
  email: string
  code: string
  password: string
}

/** POST /auth/password/reset — trades the emailed code for a new password. */
export function useResetPassword() {
  return useMutation<{ message: string }, unknown, ResetPasswordInput>({
    mutationFn: async (body) => {
      const { data } = await api.post<{ message: string }>(
        '/auth/password/reset',
        body,
      )
      return data
    },
  })
}
