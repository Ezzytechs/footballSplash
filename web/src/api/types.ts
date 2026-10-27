/** Types mirroring the payloads returned by api/src (see articles.service formatArticle). */

export interface AuthorRef {
  id: string
  name: string
}

export interface CategoryRef {
  id: string
  name: string
  slug: string
}

export interface TagRef {
  id: string
  name: string
  slug: string
}

export interface ArticleSummary {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  status: string
  isFeatured: boolean
  views: number
  images: string[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  authorId: string
  categoryId: string
  author: AuthorRef
  category: CategoryRef
  tags: TagRef[]
  commentCount: number
  likeCount: number
  bookmarkCount: number
}

export interface ArticleDetail extends ArticleSummary {
  content: string
}

export interface PageMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Paginated<T> {
  items: T[]
  meta: PageMeta
}

export interface CommentNode {
  id: string
  content: string
  userId: string
  articleId: string
  parentId: string | null
  createdAt: string
  updatedAt: string
  user: AuthorRef
  _count: { likes: number; replies: number }
}

export interface CommentThread extends CommentNode {
  replies: CommentNode[]
}

export interface TagWithCount extends TagRef {
  _count?: { articles: number }
}

/** GET /categories — used by the navbar and the category archive page. */
export interface CategoryWithCount extends CategoryRef {
  description: string | null
  createdAt?: string
  _count?: { articles: number }
}
