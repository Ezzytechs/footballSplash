import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.profile.getProfile(userId);
  }

  @Get('stats')
  @ApiOperation({
    summary:
      'Get article, comment and bookmark counts for the authenticated user',
  })
  getStats(@CurrentUser('id') userId: string) {
    return this.profile.getProfileStats(userId);
  }

  @Patch()
  @ApiOperation({
    summary: 'Update the authenticated profile',
    description:
      'Changing the email address resets verification and emails a code to the new address.',
  })
  update(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.profile.updateProfile(userId, dto);
  }
}
