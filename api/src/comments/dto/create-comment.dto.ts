import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'What a finish!', minLength: 1, maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Top-level comment to reply to',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
