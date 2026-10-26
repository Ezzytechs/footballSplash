import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArticleStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class QueryArticlesDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    description: 'Case-insensitive search across title, excerpt and content',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Category slug', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({ description: 'Tag slug', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  tag?: string;
}

export class QueryMyArticlesDto extends QueryArticlesDto {
  @ApiPropertyOptional({ enum: ArticleStatus, enumName: 'ArticleStatus' })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;
}
