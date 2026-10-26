import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OtpPurpose, Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { OtpService } from '../auth/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto, UserStatusFilter } from './dto/query-users.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const USER_DETAIL_SELECT = {
  ...USER_SELECT,
  _count: {
    select: { articles: true, comments: true, bookmarks: true },
  },
} satisfies Prisma.UserSelect;

type UserDetail = Prisma.UserGetPayload<{ select: typeof USER_DETAIL_SELECT }>;

const BCRYPT_ROUNDS = 10;

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
  ) {}

  async getProfile(userId: string): Promise<UserDetail> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_DETAIL_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getProfileStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: { articles: true, comments: true, bookmarks: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user._count;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data: Prisma.UserUpdateInput = {};
    let emailChanged = false;

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Name cannot be empty');
      }
      data.name = name;
    }

    if (dto.email !== undefined) {
      const email = normalizeEmail(dto.email);
      if (email !== user.email) {
        const existing = await this.prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        if (existing) {
          throw new ConflictException('This email address is already in use');
        }

        data.email = email;
        data.emailVerifiedAt = null;
        emailChanged = true;
      }
    }

    if (Object.keys(data).length === 0) {
      return { message: 'No changes were made', user };
    }

    let updated: UserDetail;
    try {
      updated = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: USER_DETAIL_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This email address is already in use');
      }
      throw error;
    }

    if (emailChanged) {
      // Codes requested for the previous address must not verify the new one.
      await this.prisma.otpCode.updateMany({
        where: {
          userId,
          purpose: OtpPurpose.EMAIL_VERIFICATION,
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });

      try {
        await this.otp.issue(
          { id: updated.id, name: updated.name, email: updated.email },
          OtpPurpose.EMAIL_VERIFICATION,
        );
      } catch (error) {
        this.logger.warn(
          `Could not send a verification code to ${updated.email}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return {
      message: emailChanged
        ? 'Profile updated. Verify your new email address before signing in with it.'
        : 'Profile updated',
      user: updated,
    };
  }

  async createUser(dto: CreateUserDto) {
    const email = normalizeEmail(dto.email);
    const name = dto.name.trim();

    if (!name) {
      throw new BadRequestException('Name cannot be empty');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const generatedPassword = dto.password === undefined;
    const temporaryPassword = dto.password ?? generateTemporaryPassword();

    let user: UserDetail;
    try {
      user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS),
          role: dto.role ?? UserRole.READER,
          emailVerifiedAt: new Date(),
        },
        select: USER_DETAIL_SELECT,
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

    return {
      message: generatedPassword
        ? 'User created. Share the temporary password securely; it will not be shown again.'
        : 'User created',
      user,
      ...(generatedPassword ? { temporaryPassword } : {}),
    };
  }

  async getUsers(query: QueryUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.status === UserStatusFilter.ACTIVE) {
      where.isActive = true;
    } else if (query.status === UserStatusFilter.SUSPENDED) {
      where.isActive = false;
    }

    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUser(userId: string): Promise<UserDetail> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_DETAIL_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async assignRole(actorId: string, userId: string, dto: AssignRoleDto) {
    if (actorId === userId) {
      throw new BadRequestException('You cannot change your own role');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === dto.role) {
      return {
        message: 'User already has this role',
        user: await this.getUser(userId),
      };
    }

    if (user.role === UserRole.ADMIN && user.isActive) {
      await this.ensureAnotherActiveAdmin(userId);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: USER_DETAIL_SELECT,
    });

    return { message: 'Role updated', user: updated };
  }

  async suspendUser(actorId: string, userId: string) {
    if (actorId === userId) {
      throw new BadRequestException('You cannot suspend your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN && user.isActive) {
      await this.ensureAnotherActiveAdmin(userId);
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
        select: USER_DETAIL_SELECT,
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'User suspended', user: updated };
  }

  async activateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: USER_DETAIL_SELECT,
    });

    return { message: 'User activated', user: updated };
  }

  async deleteUser(actorId: string, userId: string) {
    if (actorId === userId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN && user.isActive) {
      await this.ensureAnotherActiveAdmin(userId);
    }

    try {
      await this.prisma.user.delete({ where: { id: userId } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'This user has authored articles or comments. Suspend the account instead.',
        );
      }
      throw error;
    }

    return { message: 'User deleted' };
  }

  async getUserStats() {
    const now = Date.now();
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      total,
      active,
      suspended,
      verified,
      admins,
      activeAdmins,
      newLast7Days,
      newLast30Days,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
      this.prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
      this.prisma.user.count({ where: { role: UserRole.ADMIN } }),
      this.prisma.user.count({
        where: { role: UserRole.ADMIN, isActive: true },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
      this.prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
    ]);

    return {
      total,
      active,
      suspended,
      verified,
      unverified: total - verified,
      admins,
      activeAdmins,
      newLast7Days,
      newLast30Days,
    };
  }

  async getRoleStats() {
    const groups = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    });

    const counts = new Map(
      groups.map((group) => [group.role, group._count._all]),
    );

    return Object.values(UserRole).map((role) => ({
      role,
      count: counts.get(role) ?? 0,
    }));
  }

  private async ensureAnotherActiveAdmin(userId: string): Promise<void> {
    const otherActiveAdmins = await this.prisma.user.count({
      where: {
        id: { not: userId },
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    if (otherActiveAdmins === 0) {
      throw new BadRequestException(
        'At least one active administrator must remain',
      );
    }
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateTemporaryPassword(): string {
  return randomBytes(12).toString('base64url');
}
