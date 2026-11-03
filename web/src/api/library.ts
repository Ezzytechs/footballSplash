import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { api } from './client'
import type { ArticleSummary, Paginated } from './types'

/**
 * The two personal collections behind the Save and Like buttons on an
 * article. Both are server-side, per reader:
 *
 *   GET /articles/bookmarked — stories the signed-in reader saved
 *   GET /articles/liked      — stories the signed-in reader liked
 *
 * They share the paginated article shape used by the rest of the feed, so the
 * dashboard reuses the article card and the sidebar can read `meta.total`
 * without pulling the whole shelf. The query stays disabled until the reader
 * is signed in (a 401 would only bounce off the refresh interceptor).
 */
function useArticleCollection(
  path: string,
  queryKey: string,
  limit: number,
  enabled: boolean,
): UseQueryResult<Paginated<ArticleSummary>> {
  return useQuery({
    queryKey: [queryKey, limit],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<Paginated<ArticleSummary>>(path, {
        params: { page: 1, limit },
      })
      return data
    },
  })
}

export function useBookmarkedArticles(limit = 24, enabled = true) {
  return useArticleCollection(
    '/articles/bookmarked',
    'bookmarked-articles',
    limit,
    enabled,
  )
}

export function useLikedArticles(limit = 24, enabled = true) {
  return useArticleCollection('/articles/liked', 'liked-articles', limit, enabled)
}

/**
 * Removes one story from a shelf using the same toggle the article page uses:
 * DELETE /articles/:id/bookmark and DELETE /articles/:id/like. The cached
 * pages are patched in place so the row disappears immediately instead of
 * waiting for a refetch — including the one-item copy the sidebar uses for its
 * counter, whose total is decremented to match.
 */
function useRemoveFromShelf(resource: 'bookmark' | 'like', shelfKey: string) {
  const client = useQueryClient()
  return useMutation<void, unknown, string>({
    mutationFn: async (articleId) => {
      await api.delete(`/articles/${articleId}/${resource}`)
    },
    onSuccess: (_data, articleId) => {
      client.setQueriesData<Paginated<ArticleSummary>>(
        { queryKey: [shelfKey] },
        (previous) => {
          if (!previous) return previous
          if (!previous.items.some((item) => item.id === articleId)) {
            return previous
          }
          return {
            ...previous,
            items: previous.items.filter((item) => item.id !== articleId),
            meta: {
              ...previous.meta,
              total: Math.max(0, previous.meta.total - 1),
            },
          }
        },
      )
      // The article page carries the same counts in its payload.
      void client.invalidateQueries({ queryKey: ['article'] })
    },
  })
}

/** Removes a story from "Saved" (the bookmark toggle). */
export function useRemoveFromSaved() {
  return useRemoveFromShelf('bookmark', 'bookmarked-articles')
}

/** Removes a story from "Liked" (the like toggle). */
export function useRemoveFromLiked() {
  return useRemoveFromShelf('like', 'liked-articles')
}
