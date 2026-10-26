import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { uniqueSlug } from '../common/utils/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

const TAG_SELECT = {
  id: true,
  name: true,
  slug: true,
  _count: {
    select: {
      articles: { where: { article: { status: ArticleStatus.PUBLISHED } } },
    },
  },
} satisfies Prisma.TagSelect;

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tag.findMany({
      select: TAG_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(slug: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
      select: TAG_SELECT,
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async create(dto: CreateTagDto) {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Name cannot be empty');
    }

    const slug = await uniqueSlug(name, (value) => this.slugExists(value));

    try {
      return await this.prisma.tag.create({
        data: { name, slug },
        select: TAG_SELECT,
      });
    } catch (error) {
      this.rethrowDuplicate(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateTagDto) {
    const existing = await this.prisma.tag.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Tag not found');
    }

    if (dto.name === undefined) {
      return this.findOneById(id);
    }

    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Name cannot be empty');
    }

    const slug = await uniqueSlug(name, async (value) =>
      Boolean(
        await this.prisma.tag.findFirst({
          where: { slug: value, id: { not: id } },
          select: { id: true },
        }),
      ),
    );

    try {
      return await this.prisma.tag.update({
        where: { id },
        data: { name, slug },
        select: TAG_SELECT,
      });
    } catch (error) {
      this.rethrowDuplicate(error);
      throw error;
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.tag.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Tag not found');
    }

    await this.prisma.tag.delete({ where: { id } });

    return { message: 'Tag deleted' };
  }

  private async slugExists(slug: string): Promise<boolean> {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
      select: { id: true },
    });

    return Boolean(tag);
  }

  private async findOneById(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      select: TAG_SELECT,
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  private rethrowDuplicate(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('A tag with this name already exists');
    }
  }
}
