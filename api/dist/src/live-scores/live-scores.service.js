"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var LiveScoresService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveScoresService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const config_1 = require("@nestjs/config");
let LiveScoresService = LiveScoresService_1 = class LiveScoresService {
    configService;
    logger = new common_1.Logger(LiveScoresService_1.name);
    rapidApiKey;
    rapidApiHost;
    cacheTtlMs = 15_000;
    constructor(configService) {
        this.configService = configService;
        this.rapidApiKey = this.configService.get('RAPIDAPI_LIVE_SCORES_KEY') ?? '';
        this.rapidApiHost = this.configService.get('RAPIDAPI_LIVE_SCORES_HOST') ??
            'free-api-live-football-data.p.rapidapi.com';
    }
    async getLiveMatches() {
        const key = this.rapidApiKey;
        if (!key) {
            this.logger.warn('RAPIDAPI_LIVE_SCORES_KEY is not set; returning empty live-scores feed');
            return { matches: [], leagues: [] };
        }
        const url = 'https://' + this.rapidApiHost + '/football-current-live';
        const leaguesUrl = 'https://' + this.rapidApiHost + '/football-get-all-leagues';
        try {
            const [liveRes, leaguesRes] = await Promise.all([
                axios_1.default.get(url, {
                    headers: {
                        'x-rapidapi-key': key,
                        'x-rapidapi-host': this.rapidApiHost,
                    },
                    timeout: 10_000,
                }),
                axios_1.default.get(leaguesUrl, {
                    headers: {
                        'x-rapidapi-key': key,
                        'x-rapidapi-host': this.rapidApiHost,
                    },
                    timeout: 10_000,
                }),
            ]);
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
            const livePayload = liveRes.data;
            const liveMatches = livePayload.response?.live ?? [];
            const leaguePayload = leaguesRes.data;
            const leagues = leaguePayload.response?.leagues ?? [];
            const leagueById = new Map(leagues.map((league) => [league.id, league.name]));
            const matches = liveMatches.map((match) => ({
                id: String(match.id),
                homeTeam: match.home.name,
                awayTeam: match.away.name,
                homeScore: match.home.score == null ? null : match.home.score,
                awayScore: match.away.score == null ? null : match.away.score,
                status: match.status.ongoing ? 'LIVE' : 'UPCOMING',
                scheduledAt: match.timeTS ? new Date(match.timeTS).toISOString() : null,
                league: leagueById.get(match.leagueId) ??
                    (match.leagueId ? `Competition ${match.leagueId}` : null),
            }));
            const groups = new Map();
            for (const match of matches) {
                const key = match.league ?? 'Unassigned';
                if (!groups.has(key))
                    groups.set(key, []);
                groups.get(key).push(match);
            }
            return {
                matches,
                leagues: Array.from(groups.entries()).map(([league, group]) => ({
                    league,
                    count: group.length,
                    matches: group,
                })),
            };
        }
        catch (error) {
            const axError = error;
            this.logger.error(`Live-scores fetch failed (${[axError.status, axError.message]})`, axError.message);
            return { matches: [], leagues: [] };
        }
    }
};
exports.LiveScoresService = LiveScoresService;
exports.LiveScoresService = LiveScoresService = LiveScoresService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LiveScoresService);
//# sourceMappingURL=live-scores.service.js.map