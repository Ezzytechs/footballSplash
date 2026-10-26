import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UsersController } from './users.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProfileController, UsersController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
