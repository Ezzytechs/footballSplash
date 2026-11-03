import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LiveScoresController } from './live-scores.controller';
import { LiveScoresService } from './live-scores.service';

@Module({
  imports: [ConfigModule],
  controllers: [LiveScoresController],
  providers: [LiveScoresService],
  exports: [LiveScoresService],
})
export class LiveScoresModule {}
