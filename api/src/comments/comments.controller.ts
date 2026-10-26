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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentsDto } from './dto/query-comments.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('Comments')
@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Public()
  @Get('articles/:articleId/comments')
  @ApiOperation({ summary: 'List comments for a published article' })
  findByArticle(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Query() query: QueryCommentsDto,
  ) {
    return this.comments.findByArticle(articleId, query);
  }

  @Post('articles/:articleId/comments')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Comment on a published article',
    description: 'The authenticated user is recorded as the comment author.',
  })
  create(
    @CurrentUser('id') userId: string,
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(userId, articleId, dto);
  }

  @Patch('comments/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Edit a comment',
    description:
      'Comment authors can edit their own comments; editors and admins can edit any comment.',
  })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.comments.update(actor, id, dto);
  }

  @Delete('comments/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a comment',
    description:
      'Comment authors can delete their own comments; editors and admins can delete any comment.',
  })
  remove(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.comments.remove(actor, id);
  }

  @Post('comments/:id/like')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Like a comment',
    description: 'Idempotent: liking an already liked comment keeps one like.',
  })
  like(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.comments.like(userId, id);
  }

  @Delete('comments/:id/like')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a like from a comment' })
  unlike(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.comments.unlike(userId, id);
  }
}
