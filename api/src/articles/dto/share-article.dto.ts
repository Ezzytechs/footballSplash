import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ShareArticleDto {
  @ApiPropertyOptional({
    description: 'Share on the WhatsApp channel (via the Make.com webhook)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  whatsapp?: boolean;

  @ApiPropertyOptional({
    description: 'Share on the Facebook Page',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  facebook?: boolean;
}
