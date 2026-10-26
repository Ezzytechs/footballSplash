import { ApiProperty } from '@nestjs/swagger';
import { OtpPurpose } from '@prisma/client';
import { IsEmail, IsEnum, MaxLength } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    enum: OtpPurpose,
    enumName: 'OtpPurpose',
    example: OtpPurpose.EMAIL_VERIFICATION,
    description:
      'EMAIL_VERIFICATION verifies a new account, LOGIN signs the user in, PASSWORD_RESET is handled by /auth/password/forgot',
  })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}
