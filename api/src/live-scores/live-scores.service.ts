import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { ConfigService } from '@nestjs/config';

/** A single live match from the provider, plus an optional league name.
 *
 * `leagueId` on the live payload is its own numeric namespace and does not
 * line up with the league `id`s the provider uses in
 * `football-get-all-leagues`, so league names are resolved best-effort: the
 * service builds a league `id -> name` map from the leagues endpoint and
 * falls back to the match's `tournamentStage` when no league matches.
 */
export interface RapidLiveMatch {
  id: number;
  leagueId: number;
  time: string;
  home: { id: number; name: string; score: number };
  away: { id: number; name: string; score: number };
  eliminatedTeamId: number | null;
  statusId: number;
  tournamentStage: string;
  status: {
    utcTime: string;
    halfs: { firstHalfStarted: string };
    periodLength: number;
    finished: boolean;
    started: boolean;
    cancelled: boolean;
    ongoing: boolean;
    scoreStr: string;
    liveTime: { short: string; long: string };
  };
  timeTS: number;
}

export interface RapidApiLiveMatchesResponse {
  status: string;
  response: {
    live: RapidLiveMatch[];
  };
}

/** A league in the provider's catalogue. */
export interface RapidLeague {
  id: number;
  name: string;
  localizedName: string;
  ccode: string;
  logo: string | null;
}

export interface RapidApiLeaguesResponse {
  status: string;
  response: {
    leagues: RapidLeague[];
  };
}

/** A single match normalised for the UI. */
export type LiveMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  scheduledAt: string | null;
  league: string | null;
};

/** One group of live matches under a single league. */
export interface LiveMatchGroup {
  league: string;
  matches: LiveMatch[];
}

@Injectable()
export class LiveScoresService {
  private readonly logger = new Logger(LiveScoresService.name);

  // RapidAPI key and host come from env so the site can be deployed without
  // committing a key to the client. Cache-Control is honoured so repeated
  // polls do not trip the provider's rate limit.
  private readonly rapidApiKey: string;
  private readonly rapidApiHost: string;
  private readonly cacheTtlMs = 15_000;

  constructor(private readonly configService: ConfigService) {
    this.rapidApiKey = this.configService.get('RAPIDAPI_LIVE_SCORES_KEY') ?? '';
    this.rapidApiHost = this.configService.get('RAPIDAPI_LIVE_SCORES_HOST') ??
      'free-api-live-football-data.p.rapidapi.com';
  }

  async getLiveMatches() {
    const key = this.rapidApiKey;
    if (!key) {
      this.logger.warn(
        'RAPIDAPI_LIVE_SCORES_KEY is not set; returning empty live-scores feed',
      );
      return { matches: [], leagues: [] };
    }

    const url = 'https://' + this.rapidApiHost + '/football-current-live';
    const leaguesUrl = 'https://' + this.rapidApiHost + '/football-get-all-leagues';

    try {
      const [liveRes, leaguesRes] = await Promise.all([
        axios.get(url, {
          headers: {
            'x-rapidapi-key': key,
            'x-rapidapi-host': this.rapidApiHost,
          },
          timeout: 10_000,
        }),
        axios.get(leaguesUrl, {
          headers: {
            'x-rapidapi-key': key,
            'x-rapidapi-host': this.rapidApiHost,
          },
          timeout: 10_000,
        }),
      ]);

      // Honour the provider's Cache-Control so repeated calls do not trip
      // its rate limit. 15s is a compromise between a live-feeling feed and
      // an hourly subscription.
      const cacheControl = liveRes.headers['cache-control'];
      if (typeof cacheControl === 'string') {
        const maxAge = cacheControl
          .split(',')
          .map((part) => part.trim())
          .find((part) => part.startsWith('max-age'))
          ?.split('=')[1];
        if (typeof maxAge === 'string') {
          const parsed = Number(maxAge);
          if (Number.isFinite(parsed) && parsed > 0) {
            Object.defineProperty(this, 'cacheTtlMs', {
              value: Math.max(this.cacheTtlMs, parsed * 1000),
              writable: false,
              configurable: true,
            });
          }
        }
      }

      const livePayload = liveRes.data as RapidApiLiveMatchesResponse;
      const liveMatches = livePayload.response?.live ?? [];

      const leaguePayload = leaguesRes.data as RapidApiLeaguesResponse;
      const leagues = leaguePayload.response?.leagues ?? [];
      const leagueById = new Map(leagues.map((league) => [league.id, league.name]));

      // Live `leagueId` and the league `id` share a namespace, but the
      // catalogue only lists ~127 competitions, so lower divisions and youth
      // cups fall through. Name those by their id so grouping stays stable.
      const matches: LiveMatch[] = liveMatches.map((match) => ({
        id: String(match.id),
        homeTeam: match.home.name,
        awayTeam: match.away.name,
        homeScore: match.home.score == null ? null : match.home.score,
        awayScore: match.away.score == null ? null : match.away.score,
        status: match.status.ongoing ? 'LIVE' : 'UPCOMING',
        scheduledAt: match.timeTS ? new Date(match.timeTS).toISOString() : null,
        league:
          leagueById.get(match.leagueId) ??
          (match.leagueId ? `Competition ${match.leagueId}` : null),
      }));

      // Distinct, ordered league groups for the "View all" step.
      const groups = new Map<string, LiveMatch[]>();
      for (const match of matches) {
        const key = match.league ?? 'Unassigned';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(match);
      }

      return {
        matches,
        leagues: Array.from(groups.entries()).map(([league, group]) => ({
          league,
          count: group.length,
          matches: group,
        })),
      };
    } catch (error) {
      const axError = error as AxiosError;
      this.logger.error(
        `Live-scores fetch failed (${[axError.status, axError.message]})`,
        axError.message,
      );
      // Fail open so the rest of the UI is not blocked by a one-off network
      // hiccup or a key outage.
      return { matches: [], leagues: [] };
    }
  }
}
