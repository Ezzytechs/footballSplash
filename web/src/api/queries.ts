import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { api } from './client'
import type {
  ArticleDetail,
  ArticleSummary,
  CategoryWithCount,
  CommentNode,
  CommentThread,
  LiveMatch,
  Paginated,
  TagWithCount,
} from './types'

/* ------------------------------------------------------ live sports */

/** Current live-match fixture list for the live-scores section. */
export function useLiveMatches() {
  return useQuery({
    queryKey: ['live-matches'],
    queryFn: async () => {
      const { data } = await api.get<{ matches: LiveMatch[]; leagues: { league: string; count: number }[] }>('/live-scores')
      return data
    },
    // Live data changes as fixtures progress, so poll the provider at the
    // same cadence the API honours (cache TTL). 30s keeps the homepage card
    // feeling live without hammering the RapidAPI rate limit.
    refetchInterval: 30_000,
    staleTime: 0,
  })
}

/* ---------------------------------------------------------- reads */

export function useArticleQuery(
  slug: string | undefined,
): UseQueryResult<ArticleDetail> {
  return useQuery({
    queryKey: ['article', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data } = await api.get<ArticleDetail>(`/articles/${slug}`)
      // Best-effort view counter; failures must never break the read.
      void api.post(`/articles/${data.slug}/view`).catch(() => undefined)
      return data
    },
  })
}

/**
 * Races several read paths and settles on the first one that resolves.
 *
 * Article reads overlap: `/articles/mine/:id` returns a draft to the writer
 * who owns it, while `/articles/:slug` returns anything published. An editor
 * or admin who published the story themselves needs whichever route the API
 * actually answers, so the first success wins. `Promise.any` resolves with
 * the first fulfilment and only rejects once every candidate has failed.
 */
export function firstSuccessful<T>(paths: string[]): Promise<T | null> {
  const attempts = paths.map((path) => api.get<T>(path).then(({ data }) => data))
  if (attempts.length === 0) return Promise.resolve(null)
  return Promise.any(attempts).catch(() => null)
}

/**
 * Full article for the editor route. The dashboard links there with a slug,
 * and a slug alone cannot resolve a draft on the public route, so the
 * author-scoped routes (by id and by slug) race the public one.
 */
export function useEditableArticleQuery(
  slug: string | undefined,
  articleId?: string,
): UseQueryResult<ArticleDetail | null> {
  return useQuery({
    queryKey: ['editable-article', slug, articleId],
    enabled: Boolean(slug || articleId),
    queryFn: () =>
      firstSuccessful<ArticleDetail>(
        [
          articleId ? `/articles/mine/${articleId}` : null,
          slug ? `/articles/mine/${slug}` : null,
          slug ? `/articles/${slug}` : null,
        ].filter((path): path is string => Boolean(path)),
      ),
  })
}

/**
 * Newest published stories. The homepage slices this single feed into the
 * hero grid, the latest-headlines rail and the per-category sections.
 */
export function useLatestArticles(limit = 30): UseQueryResult<ArticleSummary[]> {
  return useQuery({
    queryKey: ['latest', limit],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ArticleSummary>>('/articles', {
        params: { page: 1, limit },
      })
      return data.items
    },
  })
}

/** Popular / trending list used by the sidebar rails. */
export function usePopularArticles(limit = 5): UseQueryResult<ArticleSummary[]> {
  return useQuery({
    queryKey: ['popular', limit],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ArticleSummary>>(
        '/articles/popular',
        { params: { limit } },
      )
      return data.items
    },
  })
}

/** Same-tag articles excluding the one being read. */
export function useSimilarArticles(
  article: ArticleDetail | undefined,
  limit = 6,
): UseQueryResult<ArticleSummary[]> {
  const tag = article?.tags[0]?.slug
  return useQuery({
    queryKey: ['similar', article?.slug, tag, limit],
    enabled: Boolean(article && tag),
    queryFn: async () => {
      const { data } = await api.get<Paginated<ArticleSummary>>('/articles', {
        params: { tag, limit },
      })
      return data.items.filter((item) => item.slug !== article?.slug)
    },
  })
}

/** All categories with their published-article counts (navbar + archives). */
export function useCategoriesQuery(): UseQueryResult<CategoryWithCount[]> {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<CategoryWithCount[]>('/categories')
      return data
    },
  })
}

export function useTagsQuery(): UseQueryResult<TagWithCount[]> {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data } = await api.get<TagWithCount[]>('/tags')
      return data
    },
  })
}

/**
 * Shared archive feed with cursor-style paging: each page is appended to the
 * previous one, which is what the infinite scroll on the tag and category
 * pages consumes. The tag and category endpoints share this exact shape.
 */
function useArchiveFeed(
  path: string,
  key: string,
  slug: string | undefined,
  limit: number,
) {
  return useInfiniteQuery({
    queryKey: [key, slug, limit],
    enabled: Boolean(slug),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<Paginated<ArticleSummary>>(path, {
        params: { page: pageParam, limit },
      })
      return data
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
  })
}

export function useTagArticlesQuery(slug: string | undefined, limit = 6) {
  return useArchiveFeed(`/articles/tag/${slug}`, 'tag-articles', slug, limit)
}

export function useCategoryArticlesQuery(slug: string | undefined, limit = 6) {
  return useArchiveFeed(
    `/articles/category/${slug}`,
    'category-articles',
    slug,
    limit,
  )
}

/** Single-page variant used by the homepage rails (not infinite scroll). */
export function useCategoryArticles(
  slug: string | undefined,
  limit = 8,
  enabled = true,
): UseQueryResult<ArticleSummary[]> {
  return useQuery({
    queryKey: ['category-list', slug, limit],
    enabled: Boolean(slug) && enabled,
    queryFn: async () => {
      const { data } = await api.get<Paginated<ArticleSummary>>(
        `/articles/category/${slug}`,
        { params: { page: 1, limit } },
      )
      return data.items
    },
  })
}

export function useCommentsQuery(
  articleId: string | undefined,
  limit = 10,
): UseQueryResult<Paginated<CommentThread>> {
  return useQuery({
    queryKey: ['comments', articleId, limit],
    enabled: Boolean(articleId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<CommentThread>>(
        `/articles/${articleId}/comments`,
        { params: { limit } },
      )
      return data
    },
  })
}

/* ---------------------------------------------------------- writes */

export interface LikeResult {
  liked: boolean
  likeCount: number
}

export function useLikeArticle(
  articleId: string | undefined,
  slug: string | undefined,
) {
  const client = useQueryClient()
  return useMutation<LikeResult, unknown, { liked: boolean }>({
    mutationFn: async ({ liked }) => {
      // POST /articles/:id/like adds a like, DELETE removes it. There is no
      // /unlike route — sending one 404s and the button silently does nothing.
      const path = `/articles/${articleId}/like`
      const { data } = liked
        ? await api.delete<LikeResult>(path)
        : await api.post<LikeResult>(path)
      return data
    },
    onSuccess: (data) => {
      client.setQueryData<ArticleDetail>(['article', slug], (previous) =>
        previous ? { ...previous, likeCount: data.likeCount } : previous,
      )
    },
  })
}

export interface BookmarkResult {
  bookmarked: boolean
  bookmarkCount: number
}

export function useBookmarkArticle(articleId: string | undefined) {
  return useMutation<BookmarkResult, unknown, { bookmarked: boolean }>({
    mutationFn: async ({ bookmarked }) => {
      // POST /articles/:id/bookmark saves, DELETE un-saves.
      const path = `/articles/${articleId}/bookmark`
      const { data } = bookmarked
        ? await api.delete<BookmarkResult>(path)
        : await api.post<BookmarkResult>(path)
      return data
    },
  })
}

export function useCreateComment(articleId: string | undefined) {
  const client = useQueryClient()
  return useMutation<
    CommentNode,
    unknown,
    { content: string; parentId?: string }
  >({
    mutationFn: async (body) => {
      const { data } = await api.post<CommentNode>(
        `/articles/${articleId}/comments`,
        body,
      )
      return data
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['comments', articleId] })
      void client.invalidateQueries({ queryKey: ['article'] })
    },
  })
}

export function useLikeComment() {
  const client = useQueryClient()
  return useMutation<
    { liked: boolean; likeCount: number },
    unknown,
    { commentId: string; liked: boolean; articleId?: string }
  >({
    mutationFn: async ({ commentId, liked }) => {
      const path = `/comments/${commentId}/like`
      const { data } = liked
        ? await api.delete<{ liked: boolean; likeCount: number }>(path)
        : await api.post<{ liked: boolean; likeCount: number }>(path)
      return data
    },
    onSuccess: (_data, variables) => {
      void client.invalidateQueries({
        queryKey: ['comments', variables.articleId],
      })
    },
  })
}
