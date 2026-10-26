import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCommentDto {
  @ApiPropertyOptional({
    example: 'What a finish! Edited.',
    minLength: 1,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content?: string;
}
