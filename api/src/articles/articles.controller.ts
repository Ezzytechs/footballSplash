import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { QueryArticlesDto, QueryMyArticlesDto } from './dto/query-articles.dto';
import { ShareArticleDto } from './dto/share-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List published articles',
    description:
      'Supports full-text search across title, excerpt and content, plus category and tag slug filters.',
  })
  findAll(@Query() query: QueryArticlesDto) {
    return this.articles.findPublished(query);
  }

  @Public()
  @Get('tag/:slug')
  @ApiOperation({ summary: 'List published articles that use a tag' })
  findByTag(@Param('slug') slug: string, @Query() query: QueryArticlesDto) {
    return this.articles.findPublished(query, { tag: slug });
  }

  @Public()
  @Get('category/:slug')
  @ApiOperation({ summary: 'List published articles in a category' })
  findByCategory(
    @Param('slug') slug: string,
    @Query() query: QueryArticlesDto,
  ) {
    return this.articles.findPublished(query, { category: slug });
  }

  @Get('mine')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List the authenticated author’s articles, including drafts',
  })
  findMine(
    @CurrentUser('id') userId: string,
    @Query() query: QueryMyArticlesDto,
  ) {
    return this.articles.findMine(userId, query);
  }

  @Public()
  @Get('popular')
  @ApiOperation({
    summary: 'List popular published articles',
    description: 'Ordered by views, then likes, then publish date.',
  })
  findPopular(@Query() query: QueryArticlesDto) {
    return this.articles.findPopular(query);
  }

  @Get('bookmarked')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List articles bookmarked by the authenticated user',
  })
  findBookmarked(
    @CurrentUser('id') userId: string,
    @Query() query: QueryArticlesDto,
  ) {
    return this.articles.findBookmarked(userId, query);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a published article by slug' })
  findOne(@Param('slug') slug: string) {
    return this.articles.findPublishedBySlug(slug);
  }

  @Public()
  @Post(':slug/view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a view for a published article' })
  recordView(@Param('slug') slug: string) {
    return this.articles.recordView(slug);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Like an article',
    description: 'Idempotent: liking an already liked article keeps one like.',
  })
  like(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.articles.like(userId, id);
  }

  @Delete(':id/like')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a like from an article' })
  unlike(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.articles.unlike(userId, id);
  }

  @Post(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bookmark an article',
    description: 'Idempotent: bookmarking an already saved article is a no-op.',
  })
  bookmark(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.articles.bookmark(userId, id);
  }

  @Delete(':id/bookmark')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a bookmark from an article' })
  unbookmark(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.articles.unbookmark(userId, id);
  }

  @Post(':id/share')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Share a published article on WhatsApp and/or Facebook',
    description:
      'Manually triggers the notifications. Defaults to both channels; pass whatsapp: false or facebook: false to target one. Returns the delivery status of each channel.',
  })
  share(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ShareArticleDto,
  ) {
    return this.articles.share(actor, id, dto);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create an article',
    description:
      'The authenticated user is recorded as the author. Defaults to DRAFT.',
  })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateArticleDto,
  ) {
    return this.articles.create(actor, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update an article',
    description:
      'Authors can update their own articles; editors and admins can update any article. Replacing tagIds replaces the article’s tags.',
  })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articles.update(actor, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete an article',
    description:
      'Authors can delete their own articles; editors and admins can delete any article.',
  })
  remove(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.articles.remove(actor, id);
  }
}
