import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @ApiPropertyOptional({
    description: 'Target MEGA folder for the upload. Defaults to "uploads".',
    example: 'uploads',
  })
  @IsOptional()
  @IsString()
  folder?: string;
}
