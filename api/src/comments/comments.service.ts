import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArticleStatus, Prisma, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentsDto } from './dto/query-comments.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

const COMMENT_BASE_SELECT = {
  id: true,
  content: true,
  userId: true,
  articleId: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true } },
  _count: { select: { likes: true, replies: true } },
} satisfies Prisma.CommentSelect;

const COMMENT_THREAD_SELECT = {
  ...COMMENT_BASE_SELECT,
  replies: {
    select: { ...COMMENT_BASE_SELECT },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.CommentSelect;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByArticle(articleId: string, query: QueryCommentsDto) {
    await this.assertPublishedArticle(articleId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.CommentWhereInput = { articleId, parentId: null };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        select: COMMENT_THREAD_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(userId: string, articleId: string, dto: CreateCommentDto) {
    await this.assertPublishedArticle(articleId);

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('Comment cannot be empty');
    }

    let parentId: string | null = null;

    if (dto.parentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: dto.parentId, articleId },
        select: { id: true, parentId: true },
      });

      if (!parent) {
        throw new BadRequestException('Parent comment not found');
      }

      if (parent.parentId) {
        throw new BadRequestException(
          'Replies can only be added to top-level comments',
        );
      }

      parentId = parent.id;
    }

    return this.prisma.comment.create({
      data: { content, userId, articleId, parentId },
      select: COMMENT_BASE_SELECT,
    });
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    this.assertCanManage(actor, comment.userId);

    if (dto.content === undefined) {
      return this.findOne(id);
    }

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('Comment cannot be empty');
    }

    return this.prisma.comment.update({
      where: { id },
      data: { content },
      select: COMMENT_BASE_SELECT,
    });
  }

  async remove(actor: AuthenticatedUser, id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    this.assertCanManage(actor, comment.userId);

    await this.prisma.comment.delete({ where: { id } });

    return { message: 'Comment deleted' };
  }

  async like(userId: string, commentId: string) {
    await this.assertComment(commentId);

    await this.prisma.commentLike.upsert({
      where: { userId_commentId: { userId, commentId } },
      create: { userId, commentId },
      update: {},
    });

    const likeCount = await this.prisma.commentLike.count({
      where: { commentId },
    });

    return { liked: true, likeCount };
  }

  async unlike(userId: string, commentId: string) {
    await this.assertComment(commentId);

    await this.prisma.commentLike.deleteMany({
      where: { userId, commentId },
    });

    const likeCount = await this.prisma.commentLike.count({
      where: { commentId },
    });

    return { liked: false, likeCount };
  }

  private async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: COMMENT_BASE_SELECT,
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
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

  private async assertComment(commentId: string): Promise<void> {
    const comment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        article: { status: ArticleStatus.PUBLISHED },
      },
      select: { id: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
  }

  private assertCanManage(actor: AuthenticatedUser, commentUserId: string) {
    if (
      actor.role === UserRole.ADMIN ||
      actor.role === UserRole.EDITOR ||
      actor.id === commentUserId
    ) {
      return;
    }

    throw new ForbiddenException('You can only manage your own comments');
  }
}
