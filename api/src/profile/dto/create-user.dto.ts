import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Ada Lovelace', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiPropertyOptional({
    example: 'TempPass123!',
    minLength: 8,
    maxLength: 72,
    description:
      'Temporary password. When omitted, a random password is generated and returned once in the response.',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    enumName: 'UserRole',
    default: UserRole.READER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
