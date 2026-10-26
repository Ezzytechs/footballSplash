import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArticleStatus, Prisma, UserRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import {
  ArticleWebhookPayload,
  PublishNotifierService,
} from '../webhook/publish-notifier.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { uniqueSlug } from '../common/utils/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { QueryArticlesDto, QueryMyArticlesDto } from './dto/query-articles.dto';
import { ShareArticleDto } from './dto/share-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

const ARTICLE_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  status: true,
  isFeatured: true,
  views: true,
  images: true,
  publishedAt: true,
  authorId: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: {
    select: { tag: { select: { id: true, name: true, slug: true } } },
  },
  _count: { select: { comments: true, bookmarks: true, likes: true } },
} satisfies Prisma.ArticleSelect;

const ARTICLE_DETAIL_SELECT = {
  ...ARTICLE_LIST_SELECT,
  content: true,
} satisfies Prisma.ArticleSelect;

type ArticleListRecord = Prisma.ArticleGetPayload<{
  select: typeof ARTICLE_LIST_SELECT;
}>;

type ArticleDetailRecord = Prisma.ArticleGetPayload<{
  select: typeof ARTICLE_DETAIL_SELECT;
}>;

type FormattedArticle = ReturnType<typeof formatArticle<ArticleDetailRecord>>;

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifier: PublishNotifierService,
  ) {}

  async findPublished(
    query: QueryArticlesDto,
    overrides: { category?: string; tag?: string } = {},
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildPublishedWhere(query, overrides);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        select: ARTICLE_LIST_SELECT,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      items: items.map((article) => formatArticle(article)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPopular(query: QueryArticlesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildPublishedWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        select: ARTICLE_LIST_SELECT,
        orderBy: [
          { views: 'desc' },
          { likes: { _count: 'desc' } },
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      items: items.map((article) => formatArticle(article)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBookmarked(userId: string, query: QueryArticlesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildPublishedWhere(query);
    where.bookmarks = { some: { userId } };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        select: ARTICLE_LIST_SELECT,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      items: items.map((article) => formatArticle(article)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMine(userId: string, query: QueryMyArticlesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ArticleWhereInput = { authorId: userId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = { slug: query.category };
    }

    if (query.tag) {
      where.tags = { some: { tag: { slug: query.tag } } };
    }

    this.applySearch(where, query.search);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        select: ARTICLE_LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      items: items.map((article) => formatArticle(article)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPublishedBySlug(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: ArticleStatus.PUBLISHED },
      select: ARTICLE_DETAIL_SELECT,
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return formatArticle(article);
  }

  async recordView(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: ArticleStatus.PUBLISHED },
      select: { id: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return this.prisma.article.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
      select: { id: true, slug: true, views: true },
    });
  }

  async like(userId: string, articleId: string) {
    await this.assertPublishedArticle(articleId);

    await this.prisma.articleLike.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {},
    });

    const likeCount = await this.prisma.articleLike.count({
      where: { articleId },
    });

    return { liked: true, likeCount };
  }

  async unlike(userId: string, articleId: string) {
    await this.assertPublishedArticle(articleId);

    await this.prisma.articleLike.deleteMany({
      where: { userId, articleId },
    });

    const likeCount = await this.prisma.articleLike.count({
      where: { articleId },
    });

    return { liked: false, likeCount };
  }

  async bookmark(userId: string, articleId: string) {
    await this.assertPublishedArticle(articleId);

    await this.prisma.bookmark.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {},
    });

    const bookmarkCount = await this.prisma.bookmark.count({
      where: { articleId },
    });

    return { bookmarked: true, bookmarkCount };
  }

  async unbookmark(userId: string, articleId: string) {
    await this.assertPublishedArticle(articleId);

    await this.prisma.bookmark.deleteMany({
      where: { userId, articleId },
    });

    const bookmarkCount = await this.prisma.bookmark.count({
      where: { articleId },
    });

    return { bookmarked: false, bookmarkCount };
  }

  async create(actor: AuthenticatedUser, dto: CreateArticleDto) {
    await this.assertCategory(dto.categoryId);
    await this.assertTags(dto.tagIds);

    const slug = await uniqueSlug(
      dto.title,
      async (value) =>
        Boolean(
          await this.prisma.article.findUnique({
            where: { slug: value },
            select: { id: true },
          }),
        ),
      'article',
    );

    const status = dto.status ?? ArticleStatus.DRAFT;

    const article = await this.prisma.article.create({
      data: {
        title: dto.title.trim(),
        slug,
        excerpt: dto.excerpt?.trim() || null,
        content: dto.content,
        coverImage: dto.coverImage?.trim() || null,
        images: dto.images ?? [],
        status,
        publishedAt: status === ArticleStatus.PUBLISHED ? new Date() : null,
        authorId: actor.id,
        categoryId: dto.categoryId,
        tags: dto.tagIds?.length
          ? { create: dto.tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      select: ARTICLE_DETAIL_SELECT,
    });

    const formatted = formatArticle(article);

    if (status === ArticleStatus.PUBLISHED) {
      this.notifyPublished(formatted, {
        whatsapp: dto.shareOnWhatsapp,
        facebook: dto.shareOnFacebook,
      });
    }

    return formatted;
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateArticleDto) {
    const existing = await this.prisma.article.findUnique({
      where: { id },
      select: { id: true, authorId: true, publishedAt: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Article not found');
    }

    this.assertCanManage(actor, existing.authorId);

    if (dto.categoryId) {
      await this.assertCategory(dto.categoryId);
    }

    if (dto.tagIds) {
      await this.assertTags(dto.tagIds);
    }

    const data: Prisma.ArticleUpdateInput = {};

    if (dto.title !== undefined) {
      const title = dto.title.trim();
      if (!title) {
        throw new BadRequestException('Title cannot be empty');
      }
      data.title = title;
    }

    if (dto.excerpt !== undefined) {
      data.excerpt = dto.excerpt?.trim() || null;
    }

    if (dto.content !== undefined) {
      data.content = dto.content;
    }

    if (dto.coverImage !== undefined) {
      data.coverImage = dto.coverImage?.trim() || null;
    }

    if (dto.images !== undefined) {
      data.images = dto.images;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === ArticleStatus.PUBLISHED && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    if (dto.categoryId) {
      data.category = { connect: { id: dto.categoryId } };
    }

    const article = await this.prisma.$transaction(async (tx) => {
      if (dto.tagIds !== undefined) {
        await tx.articleTag.deleteMany({ where: { articleId: id } });
      }

      return tx.article.update({
        where: { id },
        data: {
          ...data,
          ...(dto.tagIds?.length
            ? { tags: { create: dto.tagIds.map((tagId) => ({ tagId })) } }
            : {}),
        },
        select: ARTICLE_DETAIL_SELECT,
      });
    });

    const formatted = formatArticle(article);

    if (
      dto.status === ArticleStatus.PUBLISHED &&
      existing.status !== ArticleStatus.PUBLISHED
    ) {
      this.notifyPublished(formatted);
    }

    return formatted;
  }

  async remove(actor: AuthenticatedUser, id: string) {
    const existing = await this.prisma.article.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!existing) {
      throw new NotFoundException('Article not found');
    }

    this.assertCanManage(actor, existing.authorId);

    await this.prisma.article.delete({ where: { id } });

    return { message: 'Article deleted' };
  }

  private buildPublishedWhere(
    query: QueryArticlesDto,
    overrides: { category?: string; tag?: string } = {},
  ): Prisma.ArticleWhereInput {
    const where: Prisma.ArticleWhereInput = {
      status: ArticleStatus.PUBLISHED,
    };

    const categorySlug = overrides.category ?? query.category;
    const tagSlug = overrides.tag ?? query.tag;

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (tagSlug) {
      where.tags = { some: { tag: { slug: tagSlug } } };
    }

    this.applySearch(where, query.search);

    return where;
  }

  private applySearch(
    where: Prisma.ArticleWhereInput,
    search: string | undefined,
  ): void {
    const term = search?.trim();
    if (!term) {
      return;
    }

    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { excerpt: { contains: term, mode: 'insensitive' } },
      { content: { contains: term, mode: 'insensitive' } },
    ];
  }

  private notifyPublished(
    article: FormattedArticle,
    selection: { whatsapp?: boolean; facebook?: boolean } = {},
  ): void {
    const payload = this.buildWebhookPayload(article);

    // Fire and forget: publishing must never fail because of notifications.
    void this.notifier.notifyArticlePublished(payload, selection);
  }

  async share(actor: AuthenticatedUser, id: string, dto: ShareArticleDto) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: ARTICLE_DETAIL_SELECT,
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.status !== ArticleStatus.PUBLISHED) {
      throw new BadRequestException('Only published articles can be shared');
    }

    const result = await this.notifier.notifyArticlePublished(
      this.buildWebhookPayload(formatArticle(article)),
      { whatsapp: dto.whatsapp, facebook: dto.facebook },
    );

    return {
      message: 'Share requested',
      channels: result,
    };
  }

  private buildWebhookPayload(
    article: FormattedArticle,
  ): ArticleWebhookPayload {
    const baseUrl = this.config
      .get<string>('WEB_URL', 'http://localhost:5173')
      .replace(/\/+$/, '');

    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      url: `${baseUrl}/articles/${article.slug}`,
      coverImage: article.coverImage,
      images: article.images,
      publishedAt: article.publishedAt,
      views: article.views,
      commentCount: article.commentCount,
      likeCount: article.likeCount,
      author: article.author,
      category: article.category,
      tags: article.tags,
    };
  }

  private async assertPublishedArticle(articleId: string): Promise<void> {
    const article = await this.prisma.article.findFirst({
      where: { id: articleId, status: ArticleStatus.PUBLISHED },
      select: { id: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }
  }

  private async assertCategory(categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }
  }

  private async assertTags(tagIds: string[] | undefined): Promise<void> {
    if (!tagIds?.length) {
      return;
    }

    const uniqueIds = [...new Set(tagIds)];
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    if (tags.length !== uniqueIds.length) {
      const found = new Set(tags.map((tag) => tag.id));
      const missing = uniqueIds.filter((tagId) => !found.has(tagId));
      throw new BadRequestException(`Unknown tag(s): ${missing.join(', ')}`);
    }
  }

  private assertCanManage(actor: AuthenticatedUser, authorId: string): void {
    if (
      actor.role === UserRole.ADMIN ||
      actor.role === UserRole.EDITOR ||
      actor.id === authorId
    ) {
      return;
    }

    throw new ForbiddenException('You can only manage your own articles');
  }
}

function formatArticle<T extends ArticleListRecord>(article: T) {
  return {
    ...article,
    tags: article.tags.map(({ tag }) => tag),
    commentCount: article._count.comments,
    likeCount: article._count.likes,
    bookmarkCount: article._count.bookmarks,
  };
}
