import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Ada Lovelace', maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'ada@example.com',
    description:
      'Changing the email address resets verification and sends a new code to the new address.',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
}
