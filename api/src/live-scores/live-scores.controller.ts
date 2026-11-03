import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { LiveScoresService } from './live-scores.service'

/**
 * Public, unauthenticated read endpoint.
 *
 * The React app calls this once for the homepage `LiveScoreSection` and once for
 * the `/live-scores` page. Both share the cache TTL in the service so repeated
 * navigations to the page do not ratelimit the RapidAPI key.
 */
@Controller('live-scores')
@Public()
export class LiveScoresController {
  constructor(private readonly liveScores: LiveScoresService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.liveScores.getLiveMatches();
  }
}
