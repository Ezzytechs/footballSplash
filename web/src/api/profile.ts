import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { api } from './client'
import type {
  MyComment,
  Paginated,
  ProfileDetail,
  UpdateProfileResult,
} from './types'

/**
 * GET /profile — the signed-in account with the counts the API keeps for it
 * (`_count.articles`, `_count.comments`, `_count.bookmarks`), plus role,
 * verification state and the join date. Stays idle until there is a session.
 */
export function useProfile(enabled = true): UseQueryResult<ProfileDetail> {
  return useQuery({
    queryKey: ['profile'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<ProfileDetail>('/profile')
      return data
    },
  })
}

/**
 * GET /comments/mine — the reader's own comments, newest first, each with the
 * story title and slug so the profile can link back to the conversation.
 */
export function useMyComments(limit = 5, enabled = true) {
  return useQuery({
    queryKey: ['my-comments', limit],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<Paginated<MyComment>>('/comments/mine', {
        params: { page: 1, limit },
      })
      return data
    },
  })
}

export interface ProfileUpdate {
  name?: string
  email?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

/**
 * PATCH /auth/password — the current password has to match before the new one
 * is accepted. The API revokes every *other* refresh token afterwards, so this
 * session keeps working while other devices are signed out.
 */
export function useChangePassword() {
  return useMutation<{ message: string }, unknown, ChangePasswordInput>({
    mutationFn: async (body) => {
      const { data } = await api.patch<{ message: string }>(
        '/auth/password',
        body,
      )
      return data
    },
  })
}

/**
 * PATCH /profile — only the fields sent are changed. A new email address
 * resets verification and the API emails a code to it, so the page warns
 * about that before saving.
 */
export function useUpdateProfile() {
  const client = useQueryClient()
  return useMutation<UpdateProfileResult, unknown, ProfileUpdate>({
    mutationFn: async (body) => {
      const { data } = await api.patch<UpdateProfileResult>('/profile', body)
      return data
    },
    onSuccess: (data) => {
      client.setQueryData(['profile'], data.user)
      void client.invalidateQueries({ queryKey: ['profile-stats'] })
    },
  })
}
