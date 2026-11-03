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

/**
 * GET /comments/mine — a reader's own comments, each with the story it sits
 * on so the profile can link back to it.
 */
export interface MyComment {
  id: string
  content: string
  articleId: string
  parentId: string | null
  createdAt: string
  _count: { likes: number; replies: number }
  article: { id: string; title: string; slug: string }
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

/* ------------------------------------------------------ auth + admin */

export type UserRole = 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'READER'
export type ArticleStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED'

/** Shape returned by POST /auth/signin and GET /auth/me. */
export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  emailVerifiedAt: string | null
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface SigninResponse extends AuthTokens {
  user: SessionUser
}

/** GET /users — admin user list rows. */
export interface AdminUser extends SessionUser {
  updatedAt: string
}

/** GET /profile/stats — counts for the signed-in user. */
export interface ProfileStats {
  articles: number
  comments: number
  bookmarks: number
}

/**
 * GET /profile — the signed-in account, its role/verification fields and the
 * activity counts the API returns alongside them (_count).
 */
export interface ProfileDetail extends SessionUser {
  updatedAt: string
  _count: { articles: number; comments: number; bookmarks: number }
}

/** PATCH /profile — the API answers with a message and the updated account. */
export interface UpdateProfileResult {
  message: string
  user: ProfileDetail
}

/** GET /users/stats/users — site-wide account counts. */
export interface UserStats {
  total: number
  active: number
  suspended: number
  verified: number
  unverified: number
  admins: number
  activeAdmins: number
  newLast7Days: number
  newLast30Days: number
}

/** GET /users/stats/roles — one row per role. */
export interface RoleStat {
  role: UserRole
  count: number
}

/* ------------------------------------------------------ live sports */

/** A single fixture in the live-scores feed. */
export interface LiveMatch {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  status: string
  scheduledAt: string | null
  league: string | null
}
