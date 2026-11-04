import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { api } from './client'
import type {
  AdminUser,
  ArticleStatus,
  ArticleSummary,
  CategoryWithCount,
  CommentThread,
  Paginated,
  ProfileStats,
  RoleStat,
  TagWithCount,
  UserRole,
  UserStats,
} from './types'

/* ------------------------------------------------------------ reads */

export interface MyArticlesParams {
  status?: ArticleStatus | ''
  search?: string
  page?: number
  limit?: number
}

/** GET /articles/mine — the signed-in author's articles, drafts included. */
export function useMyArticles(
  params: MyArticlesParams,
  enabled = true,
): UseQueryResult<Paginated<ArticleSummary>> {
  const { status = '', search = '', page = 1, limit = 10 } = params
  return useQuery({
    queryKey: ['my-articles', status, search, page, limit],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<Paginated<ArticleSummary>>('/articles/mine', {
        params: {
          page,
          limit,
          ...(status ? { status } : {}),
          ...(search ? { search } : {}),
        },
      })
      return data
    },
  })
}

/** GET /articles/mine/staff — anything a staff author has written, status
 * groups kept intact, so an editor or admin can archive their own room.
 *
 * Authors are excluded here: their `mine` rows already include their own
 * drafts and submitted stories, and a draft never escapes that room.
 */
export function useStaffMine(
  params: MyArticlesParams,
): UseQueryResult<Paginated<ArticleSummary>> {
  const { status = '', search = '', page = 1, limit = 10 } = params
  return useQuery({
    queryKey: ['staff-mine', status, search, page, limit],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ArticleSummary>>('/articles/mine/staff', {
        params: {
          page,
          limit,
          ...(status ? { status } : {}),
          ...(search ? { search } : {}),
        },
      })
      return data
    },
  })
}

/** GET /profile/stats — signed-in user's article/comment/bookmark counts. */
export function useProfileStats(): UseQueryResult<ProfileStats> {
  return useQuery({
    queryKey: ['profile-stats'],
    queryFn: async () => {
      const { data } = await api.get<ProfileStats>('/profile/stats')
      return data
    },
  })
}

/** GET /users/stats/users — site-wide account counts (ADMIN only). */
export function useUserStats(enabled = true): UseQueryResult<UserStats> {
  return useQuery({
    queryKey: ['user-stats'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<UserStats>('/users/stats/users')
      return data
    },
  })
}

/** GET /users/stats/roles — one count per role (ADMIN only). */
export function useRoleStats(enabled = true): UseQueryResult<RoleStat[]> {
  return useQuery({
    queryKey: ['role-stats'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<RoleStat[]>('/users/stats/roles')
      return data
    },
  })
}

export interface UsersParams {
  search?: string
  role?: UserRole | ''
  status?: 'ACTIVE' | 'SUSPENDED' | ''
  page?: number
  limit?: number
}

/** GET /users — admin user directory (ADMIN only). */
export function useUsers(
  params: UsersParams,
): UseQueryResult<Paginated<AdminUser>> {
  const { search = '', role = '', status = '', page = 1, limit = 10 } = params
  return useQuery({
    queryKey: ['users', search, role, status, page, limit],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AdminUser>>('/users', {
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
          ...(role ? { role } : {}),
          ...(status ? { status } : {}),
        },
      })
      return data
    },
  })
}

/** GET /articles/:id/comments — moderation view of one story's thread. */
export function useArticleComments(
  articleId: string | undefined,
): UseQueryResult<Paginated<CommentThread>> {
  return useQuery({
    queryKey: ['admin-comments', articleId],
    enabled: Boolean(articleId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<CommentThread>>(
        `/articles/${articleId}/comments`,
        { params: { limit: 50 } },
      )
      return data
    },
  })
}

/* ------------------------------------------------------------ writes */

/** POST /articles — create a draft or publish immediately. */
export function useCreateArticle() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post<ArticleSummary>('/articles', body)
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['my-articles'] })
      void client.invalidateQueries({ queryKey: ['all-articles'] })
      void client.invalidateQueries({ queryKey: ['profile-stats'] })
      void client.invalidateQueries({ queryKey: ['latest'] })
      void client.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

/** PATCH /articles/:id — edit or change status. */
export function useUpdateArticle() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.patch<ArticleSummary>(`/articles/${id}`, body)
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['my-articles'] })
      void client.invalidateQueries({ queryKey: ['all-articles'] })
      void client.invalidateQueries({ queryKey: ['latest'] })
      void client.invalidateQueries({ queryKey: ['popular'] })
      void client.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

/** DELETE /articles/:id */
export function useDeleteArticle() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ message: string }>(`/articles/${id}`)
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['my-articles'] })
      void client.invalidateQueries({ queryKey: ['all-articles'] })
      void client.invalidateQueries({ queryKey: ['profile-stats'] })
      void client.invalidateQueries({ queryKey: ['latest'] })
      void client.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

/** PATCH /comments/:id — authors edit their own comments; staff can edit any. */
export function useUpdateComment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data } = await api.patch<{ message: string }>(`/comments/${id}`, {
        content,
      })
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['my-comments'] })
      void client.invalidateQueries({ queryKey: ['comments'] })
      void client.invalidateQueries({ queryKey: ['admin-comments'] })
    },
  })
}

/** DELETE /comments/:id — moderation (authors own comments; editors/admin all). */
export function useDeleteComment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ message: string }>(`/comments/${id}`)
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['admin-comments'] })
      void client.invalidateQueries({ queryKey: ['comments'] })
      // A reader can delete from the profile, so the personal feeds move too.
      void client.invalidateQueries({ queryKey: ['my-comments'] })
      void client.invalidateQueries({ queryKey: ['profile-stats'] })
    },
  })
}

/** POST /storage/upload — multipart cover-image upload, returns only the nodeId so the frontend can build its own view URL. */
export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<{ data: { nodeId?: string } }>(
        '/storage/upload',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return data.data
    },
  })
}

/**
 * GET /articles/all — every article on the site (DRAFT, REVIEW,
 * PUBLISHED and ARCHIVED), filterable by status or search term.
 *
 * Present on the_admin dashboard so an editor or admin can list, edit and
 * publish any story, regardless of who wrote it.
 */
export interface AllArticlesParams extends MyArticlesParams {
  /** Restrict the list to a single status (DRAFT, REVIEW, PUBLISHED, ARCHIVED). */
  status?: ArticleStatus | ''
  /** Free-text search across title, excerpt and body.
   *
   * A bare word matches the summary fields, a whole sentence is treated as
   * a body search, and a leading `#` looks the tag up by name.
   */
  search?: string
  page?: number
  limit?: number
}

export function useAllArticles(
  params: AllArticlesParams,
  enabled = true,
): UseQueryResult<Paginated<ArticleSummary>> {
  const { status = '', search = '', page = 1, limit = 10 } = params
  return useQuery({
    queryKey: ['all-articles', status, search, page, limit],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<Paginated<ArticleSummary>>('/articles/all', {
        params: {
          page,
          limit,
          ...(status ? { status } : {}),
          ...(search ? { search } : {}),
        },
      })
      return data
    },
  })
}

/* ------------------------------------------------- categories + tags */

export function useCreateCategory() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; description?: string }) => {
      const { data } = await api.post<CategoryWithCount>('/categories', body)
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateCategory() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.patch<CategoryWithCount>(`/categories/${id}`, body)
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategory() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ message: string }>(`/categories/${id}`)
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useCreateTag() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string }) => {
      const { data } = await api.post<TagWithCount>('/tags', body)
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useUpdateTag() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.patch<TagWithCount>(`/tags/${id}`, body)
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useDeleteTag() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ message: string }>(`/tags/${id}`)
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

/* ------------------------------------------------------------- users */

/** POST /users — creates a verified account, returns a temp password once. */
export function useCreateUser() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      name: string
      email: string
      role?: UserRole
      password?: string
    }) => {
      const { data } = await api.post<{
        message: string
        user: AdminUser
        temporaryPassword?: string
      }>('/users', body)
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['users'] })
      void client.invalidateQueries({ queryKey: ['user-stats'] })
      void client.invalidateQueries({ queryKey: ['role-stats'] })
    },
  })
}

/** PATCH /users/:id/role */
export function useAssignRole() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const { data } = await api.patch<{ message: string }>(`/users/${id}/role`, {
        role,
      })
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['users'] })
      void client.invalidateQueries({ queryKey: ['role-stats'] })
      void client.invalidateQueries({ queryKey: ['user-stats'] })
    },
  })
}

/** POST /users/:id/suspend | /users/:id/activate */
export function useSetUserStatus() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      active,
    }: {
      id: string
      active: boolean
    }) => {
      const path = `/users/${id}/${active ? 'activate' : 'suspend'}`
      const { data } = await api.post<{ message: string }>(path)
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['users'] })
      void client.invalidateQueries({ queryKey: ['user-stats'] })
    },
  })
}

/** DELETE /users/:id */
export function useDeleteUser() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ message: string }>(`/users/${id}`)
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['users'] })
      void client.invalidateQueries({ queryKey: ['user-stats'] })
      void client.invalidateQueries({ queryKey: ['role-stats'] })
    },
  })
}
