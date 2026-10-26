import { BadRequestException, Injectable } from '@nestjs/common';
import { OtpPurpose } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

export const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const BCRYPT_ROUNDS = 10;

interface OtpUser {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async issue(user: OtpUser, purpose: OtpPurpose): Promise<void> {
    const latest = await this.prisma.otpCode.findFirst({
      where: { userId: user.id, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (
      latest &&
      Date.now() - latest.createdAt.getTime() <
        OTP_RESEND_COOLDOWN_SECONDS * 1000
    ) {
      throw new BadRequestException(
        'A code was sent moments ago. Please wait before requesting another one.',
      );
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);

    const record = await this.prisma.$transaction(async (tx) => {
      await tx.otpCode.updateMany({
        where: { userId: user.id, purpose, consumedAt: null },
        data: { consumedAt: new Date() },
      });

      return tx.otpCode.create({
        data: {
          userId: user.id,
          purpose,
          codeHash,
          expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
        },
      });
    });

    try {
      await this.mail.sendOtpEmail({
        to: user.email,
        name: user.name,
        code,
        purpose,
        expiresInMinutes: OTP_TTL_MINUTES,
      });
    } catch (error) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      });
      throw error;
    }
  }

  /**
   * Consumes a valid code for the user. Throws when the code is missing,
   * expired, already used or has been tried too many times.
   */
  async consume(
    userId: string,
    purpose: OtpPurpose,
    code: string,
  ): Promise<void> {
    const record = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Too many invalid attempts. Request a new verification code.',
      );
    }

    const matches = await bcrypt.compare(code, record.codeHash);

    if (!matches) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.prisma.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
  }
}
