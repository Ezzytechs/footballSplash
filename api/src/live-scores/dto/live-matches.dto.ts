import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class LiveMatchDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Arsenal' })
  homeTeam: string;

  @ApiProperty({ example: 'Chelsea' })
  awayTeam: string;

  @ApiProperty({ example: 2, nullable: true })
  homeScore: number | null;

  @ApiProperty({ example: 1, nullable: true })
  awayScore: number | null;

  @ApiProperty({ example: 'LIVE' })
  status: string;

  @ApiProperty({ example: '2026-11-03T15:00:00Z', nullable: true })
  scheduledAt: string | null;

  @ApiProperty({ example: 'Premier League', nullable: true })
  league: string | null;
}

export class LiveMatchesQueryDto {
  @ApiPropertyOptional({ description: 'Change the RapidAPI endpoint query string, e.g. ?league=premier-league' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Limit how many matches are returned' })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

/**
 * Raw snapshot returned by RapidAPI.
 *
 * `free-api-live-football-data.p.rapidapi.com` returns an object whose `data`
 * property is the array of fixtures, so this unwraps the envelope.
 */
export interface RapidApiLiveMatchesResponse {
  data: LiveMatchDto[];
}
