import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArticleStatus } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({
    example: 'Late winner seals the derby',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    example: 'A stoppage-time header decided a tense derby.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiProperty({ example: 'Full match report...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200000)
  content: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverImage?: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Up to five image URLs. Upload files with POST /storage/upload or POST /storage/upload/batch.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_tld: false,
    },
    { each: true },
  )
  images?: string[];

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    description:
      'Share on the WhatsApp channel (via the Make.com webhook) when published. Defaults to true.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  shareOnWhatsapp?: boolean;

  @ApiPropertyOptional({
    description: 'Share on the Facebook Page when published. Defaults to true.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  shareOnFacebook?: boolean;

  @ApiPropertyOptional({
    enum: ArticleStatus,
    enumName: 'ArticleStatus',
    default: ArticleStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;
}
