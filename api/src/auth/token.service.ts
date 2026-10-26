import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface AuthTokens {
  tokenType: 'Bearer';
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface TokenUser {
  id: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get accessTokenTtlSeconds(): number {
    return Number(this.config.get('JWT_ACCESS_TTL_SECONDS', 900));
  }

  private get refreshTokenTtlMs(): number {
    return (
      Number(this.config.get('JWT_REFRESH_TTL_DAYS', 7)) * 24 * 60 * 60 * 1000
    );
  }

  async issueTokens(user: TokenUser): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: this.accessTokenTtlSeconds,
    });

    return {
      tokenType: 'Bearer',
      accessToken,
      refreshToken: await this.createRefreshToken(user.id),
      expiresIn: this.accessTokenTtlSeconds,
    };
  }

  /**
   * Validates a refresh token, revokes it and returns a fresh token pair.
   * Presenting an already-revoked token revokes every session for the user.
   */
  async rotateRefreshToken(rawToken: string): Promise<AuthTokens> {
    const tokenHash = hashToken(rawToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, email: true, role: true, isActive: true },
        },
      },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.revokedAt) {
      await this.revokeAllRefreshTokens(stored.userId);
      throw new UnauthorizedException('Refresh token has already been used');
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (!stored.user.isActive) {
      throw new ForbiddenException('This account has been deactivated');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user);
  }

  async revokeRefreshToken(userId: string, rawToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        tokenHash: hashToken(rawToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(48).toString('hex');

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(token),
        userId,
        expiresAt: new Date(Date.now() + this.refreshTokenTtlMs),
      },
    });

    return token;
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
