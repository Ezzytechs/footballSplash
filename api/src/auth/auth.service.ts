import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OtpPurpose, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';

const BCRYPT_ROUNDS = 10;

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  emailVerifiedAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const GENERIC_OTP_MESSAGE =
  'If an account exists for this email, a verification code has been sent.';
const GENERIC_RESET_MESSAGE =
  'If an account exists for this email, a password reset code has been sent.';
const INVALID_CODE_MESSAGE = 'Invalid or expired verification code';
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

@Injectable()
export class AuthService {
  /** Used to keep sign-in timing similar when the email does not exist. */
  private static readonly dummyPasswordHashPromise = bcrypt.hash(
    'not-a-real-password',
    BCRYPT_ROUNDS,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly otp: OtpService,
  ) {}

  async signup(dto: SignupDto) {
    const email = normalizeEmail(dto.email);
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    let user: PublicUser;
    try {
      user = await this.prisma.user.create({
        data: { name: dto.name.trim(), email, password },
        select: PUBLIC_USER_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw error;
    }

    await this.otp.issue(user, OtpPurpose.EMAIL_VERIFICATION);

    return {
      message:
        'Account created. Check your email for a 6-digit verification code.',
      user,
    };
  }

  async signin(dto: SigninDto) {
    const email = normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });

    const passwordHash =
      user?.password ?? (await AuthService.dummyPasswordHashPromise);
    const passwordMatches = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    if (!user.isActive) {
      throw new ForbiddenException('This account has been deactivated');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException(
        'Please verify your email address. Request a verification code to continue.',
      );
    }

    const tokens = await this.tokens.issueTokens(user);

    return { ...tokens, user: toPublicUser(user) };
  }

  async requestOtp(dto: RequestOtpDto) {
    const email = normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        emailVerifiedAt: true,
      },
    });

    if (!user || !user.isActive) {
      return { message: GENERIC_OTP_MESSAGE };
    }

    // The account state is not revealed for these combinations.
    if (dto.purpose === OtpPurpose.EMAIL_VERIFICATION && user.emailVerifiedAt) {
      return { message: GENERIC_OTP_MESSAGE };
    }

    if (dto.purpose === OtpPurpose.LOGIN && !user.emailVerifiedAt) {
      return { message: GENERIC_OTP_MESSAGE };
    }

    await this.otp.issue(user, dto.purpose);

    return {
      message:
        dto.purpose === OtpPurpose.PASSWORD_RESET
          ? GENERIC_RESET_MESSAGE
          : GENERIC_OTP_MESSAGE,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    if (dto.purpose === OtpPurpose.PASSWORD_RESET) {
      throw new BadRequestException(
        'Use the password reset endpoint with this code',
      );
    }

    const email = normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: PUBLIC_USER_SELECT,
    });

    if (!user || !user.isActive) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    if (dto.purpose === OtpPurpose.LOGIN && !user.emailVerifiedAt) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    await this.otp.consume(user.id, dto.purpose, dto.code);

    let verifiedUser = user;

    if (
      dto.purpose === OtpPurpose.EMAIL_VERIFICATION &&
      !user.emailVerifiedAt
    ) {
      verifiedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
        select: PUBLIC_USER_SELECT,
      });
    }

    const tokens = await this.tokens.issueTokens(verifiedUser);

    return { ...tokens, user: verifiedUser };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, isActive: true },
    });

    if (user?.isActive) {
      await this.otp.issue(user, OtpPurpose.PASSWORD_RESET);
    }

    return { message: GENERIC_RESET_MESSAGE };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    await this.otp.consume(user.id, OtpPurpose.PASSWORD_RESET, dto.code);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS) },
    });

    await this.tokens.revokeAllRefreshTokens(user.id);

    return {
      message:
        'Password reset successfully. You can now sign in with your new password.',
    };
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }

    const currentPasswordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!currentPasswordMatches) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (await bcrypt.compare(dto.newPassword, user.password)) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS) },
    });

    await this.tokens.revokeAllRefreshTokens(user.id);

    return {
      message: 'Password updated. Other sessions have been signed out.',
    };
  }

  async refresh(refreshToken: string) {
    return this.tokens.rotateRefreshToken(refreshToken);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.tokens.revokeRefreshToken(userId, refreshToken);
    } else {
      await this.tokens.revokeAllRefreshTokens(userId);
    }

    return { message: 'Signed out successfully' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_SELECT,
    });

    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }

    return user;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

type PublicUser = Prisma.UserGetPayload<{ select: typeof PUBLIC_USER_SELECT }>;

function toPublicUser(user: PublicUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  };
}
