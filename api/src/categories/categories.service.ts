import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { uniqueSlug } from '../common/utils/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  createdAt: true,
  _count: {
    select: {
      articles: { where: { status: ArticleStatus.PUBLISHED } },
    },
  },
} satisfies Prisma.CategorySelect;

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      select: CATEGORY_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      select: CATEGORY_SELECT,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Name cannot be empty');
    }

    const slug = await uniqueSlug(name, (value) => this.slugExists(value));

    try {
      return await this.prisma.category.create({
        data: {
          name,
          slug,
          description: dto.description?.trim() || null,
        },
        select: CATEGORY_SELECT,
      });
    } catch (error) {
      this.rethrowDuplicate(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const data: Prisma.CategoryUpdateInput = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Name cannot be empty');
      }

      data.name = name;
      data.slug = await uniqueSlug(name, async (value) =>
        Boolean(
          await this.prisma.category.findFirst({
            where: { slug: value, id: { not: id } },
            select: { id: true },
          }),
        ),
      );
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return this.findOneById(id);
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data,
        select: CATEGORY_SELECT,
      });
    } catch (error) {
      this.rethrowDuplicate(error);
      throw error;
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const articles = await this.prisma.article.count({
      where: { categoryId: id },
    });

    if (articles > 0) {
      throw new ConflictException(
        'This category still has articles. Move or delete them first.',
      );
    }

    await this.prisma.category.delete({ where: { id } });

    return { message: 'Category deleted' };
  }

  private async slugExists(slug: string): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });

    return Boolean(category);
  }

  private async findOneById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: CATEGORY_SELECT,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  private rethrowDuplicate(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('A category with this name already exists');
    }
  }
}
