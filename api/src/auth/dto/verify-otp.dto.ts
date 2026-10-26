import { ApiProperty } from '@nestjs/swagger';
import { OtpPurpose } from '@prisma/client';
import { IsEmail, IsEnum, IsString, Matches, MaxLength } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be a 6-digit number' })
  code: string;

  @ApiProperty({
    enum: [OtpPurpose.EMAIL_VERIFICATION, OtpPurpose.LOGIN],
    enumName: 'OtpPurpose',
    example: OtpPurpose.EMAIL_VERIFICATION,
  })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}
