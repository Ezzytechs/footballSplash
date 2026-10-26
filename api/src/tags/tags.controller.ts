import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagsService } from './tags.service';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List tags with published article counts' })
  findAll() {
    return this.tags.findAll();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a tag by slug' })
  findOne(@Param('slug') slug: string) {
    return this.tags.findOne(slug);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a tag' })
  create(@Body() dto: CreateTagDto) {
    return this.tags.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a tag',
    description: 'Renaming regenerates the slug.',
  })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTagDto) {
    return this.tags.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a tag',
    description: 'Removes the tag from any articles that use it.',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tags.remove(id);
  }
}
