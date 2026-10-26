import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { ProfileService } from './profile.service';

@ApiTags('User management')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  @ApiOperation({
    summary: 'List users with pagination, search, role and status filters',
  })
  findAll(@Query() query: QueryUsersDto) {
    return this.profile.getUsers(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a user with a temporary password',
    description:
      'Creates a verified account. When the password is omitted, a random temporary password is generated and returned once so it can be shared securely. The user should change it with PATCH /auth/password after signing in.',
  })
  create(@Body() dto: CreateUserDto) {
    return this.profile.createUser(dto);
  }

  @Get('stats/users')
  @ApiOperation({ summary: 'Get user counts by status, verification and age' })
  getUserStats() {
    return this.profile.getUserStats();
  }

  @Get('stats/roles')
  @ApiOperation({ summary: 'Get user counts per role' })
  getRoleStats() {
    return this.profile.getRoleStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user with content counts' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.profile.getUser(id);
  }

  @Patch(':id/role')
  @ApiOperation({
    summary: 'Assign a role to a user',
    description: 'You cannot change your own role.',
  })
  assignRole(
    @CurrentUser('id') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.profile.assignRole(actorId, id, dto);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suspend a user',
    description:
      'Deactivates the account and revokes all refresh tokens. You cannot suspend yourself.',
  })
  suspend(
    @CurrentUser('id') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.profile.suspendUser(actorId, id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a suspended user' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.profile.activateUser(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a user',
    description:
      'Users who authored articles or comments cannot be deleted; suspend them instead.',
  })
  remove(
    @CurrentUser('id') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.profile.deleteUser(actorId, id);
  }
}
