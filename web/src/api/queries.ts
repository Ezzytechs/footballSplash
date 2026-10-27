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
  Paginated,
  TagWithCount,
} from './types'

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
      const path = `/articles/${articleId}/${liked ? 'unlike' : 'like'}`
      const { data } = await api.post<LikeResult>(path)
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
      const path = `/articles/${articleId}/${bookmarked ? 'unbookmark' : 'bookmark'}`
      const { data } = await api.post<BookmarkResult>(path)
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
      const path = `/comments/${commentId}/${liked ? 'unlike' : 'like'}`
      const { data } = await api.post<{ liked: boolean; likeCount: number }>(
        path,
      )
      return data
    },
    onSuccess: (_data, variables) => {
      void client.invalidateQueries({
        queryKey: ['comments', variables.articleId],
      })
    },
  })
}
