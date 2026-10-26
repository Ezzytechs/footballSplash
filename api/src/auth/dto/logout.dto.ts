import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    description:
      'Refresh token to revoke. When omitted, every session for the user is signed out.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
