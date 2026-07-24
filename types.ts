export type LanguageCode = 'EN' | 'NO' | 'SCO' | 'US';

export interface Translation {
  [key: string]: string | any;
  teamNames: Record<string, string>;

  // --- Alerts & Toasts ---
  noSubsTitle: string;
  noSubsMsg: string;
  loggedOutTitle: string;
  loggedOutMsg: string;
  profileUpdated: string;
  profileMsg: string;
  predSaved: string;
  predLocked: string;
  rivalRevealed: string;
  intelUsed: string;
  subRefunded: string;
  subRefundedMsg: string;
  secondChanceConfirm: string;
  
  // --- Navigation & UI ---
  prevGroup: string;
  nextGroup: string;
  bracketBtn: string;
  scoutBtn: string;
  saveBtn: string;
  watchOn: string;
  stadiumTbd: string;
  liveTag: string;
  ftTag: string;
  changeIdentity: string;
  cancelBtn: string;
  noMatchesDate: string;
  substitutions: string;
  subSuccess: string;
  subnavSchedule: string;
  subnavTables: string;
  subnavBracket: string;
  lockInConfirm: string;
  pledgeToastMsg: string;
  bracketLockedIn: string;
  bracketLockedInMsg: string;
  leagueJoined: string;
  predictionsCleared: string;
  predictionsClearedMsg: string;
  saveFailed: string;
  saveFailedMsg: string;
  tooLate: string;
  tooLateMsg: string;
  magicApplied: string;
  noIntel: string;
  noIntelMsg: string;

  // --- Magic Wand risk slider ---
  riskTitle: string;
  riskBanker: string;
  riskBalanced: string;
  riskWildcard: string;
  riskBankerDesc: string;
  riskBalancedDesc: string;
  riskWildcardDesc: string;

  // --- Signup risk profile: scoring-volume axis ---
  scoringTitle: string;
  scoringCagey: string;
  scoringBalanced: string;
  scoringGoalFest: string;
  scoringCageyDesc: string;
  scoringBalancedDesc: string;
  scoringGoalFestDesc: string;

  // --- Bracket cascade ---
  bracketAdjusted: string;
  bracketAdjustedMsg: string;
  undo: string;

  // --- Prediction nudge banner ---
  nudgeTitle: string;
  nudgeMsg: string;
  nudgeCta: string;

  // --- Rules tab ---
  rulesPreSubtitle: string;
  rulesLiveSubtitle: string;
  rulesLiveScoringSection: string;
  rulesLiveToolsSection: string;
  rulesLiveAnalysisTitle: string;
  rulesLiveAnalysisDesc: string;
}

// 'R32'/'3RD' are World Cup leftovers with no CL equivalent — kept only so the
// still-unmigrated peripheral display files (Leaderboard, KnockoutTreeView,
// SecondChanceView, etc — see Phase A refactor plan) keep compiling. Nothing
// produces an 'R32' or '3RD' match going forward. 'PO' is the new Swiss-format
// Playoff Round (replaces R32 as the first knockout round).
export type Round = 'PO' | 'R16' | 'QF' | 'SF' | 'FIN' | 'R32' | '3RD';

export interface Match {
  id: string;
  /** @deprecated World Cup group concept. No longer populated — Match.round is the sole phase discriminator (undefined = League Phase, set = Knockout). Kept only for compile compatibility with not-yet-migrated peripheral files. */
  groupId?: string;
  round?: Round;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  venue: string;
  /** League Phase matchday (1-8). Undefined for Knockout Phase matches. */
  matchday?: number;
  status: 'UPCOMING' | 'LIVE' | 'HT' | 'BT' | 'FT' | 'AET' | 'PEN' | 'FINISHED' | '1H' | '2H' | 'NS' | 'ET' | 'P' | 'INT' | 'ABD' | 'AWD' | 'WO';
  isLocked: boolean;
  channels?: Record<string, string>;
  minute?: number;
  minuteExtra?: number | null;
  nextMatchId?: string;
}

export interface Team {
  id: string;
  name: string;
  flag: string;
  rank: number;
  rating: number;
  att: number;
  mid: number;
  def: number;
  overview?: string;
  starPlayer?: string;
  strengths?: string;
  weaknesses?: string;
  code?: string;
  form?: string[];
  eloRating?: number;
  jerseyBg?: string;
  jerseyText?: string;
}

export interface Prediction {
  userId: string;
  matchId: string;
  home: number;
  away: number;
  predictedWinnerId?: string;
  // Snapshot of which teams this prediction was actually made against, captured
  // at save time — so the prediction stays correct even if the match's fixture
  // (matches.home_team_id / away_team_id) is ever reassigned later.
  homeTeamId?: string;
  awayTeamId?: string;
}

export interface UserProfile {
  email: string;
  name: string;
  avatar: string;
  tokens: number;
  substitutions: number;
  leagues: string[];
  favorites: string[];
  spiedMatches: string[];
  unlockedMatches: string[];
  hasTakenSecondChance: boolean;
  secondChanceStatus?: 'NONE' | 'PENDING' | 'ACTIVE'; // <--- NEW ADDITION
  
  // --- Tour Tracking ---
  toursCompleted?: {
    preSeason: boolean;
    liveSeason: boolean;
  };
  isAdmin?: boolean;
  bracketPredictions?: Record<string, { home: number; away: number }>;
  scDraft?: Record<string, { home: number; away: number }>;

  // --- Risk profile (set at signup) — drives missed-deadline auto-fill.
  // Undefined for pre-feature accounts that never set one; auto-fill skips them.
  riskResult?: number;   // 0-1: favorites (0) <-> upsets (1)
  riskScoring?: number;  // 0-1: cagey/low-scoring (0) <-> high-scoring (1)
}

export interface LeagueStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  form: string[];
  // Tracked separately for the away-goals/away-wins tiebreak steps (CL League
  // Phase tiebreak order: Pts, GD, GF, Away Goals, Wins, Away Wins). Optional —
  // not populated by the legacy World Cup group-standings code path (aliased
  // below as GroupStanding), which has no away-goals tiebreak concept.
  awayGoals?: number;
  awayWins?: number;
}

/** @deprecated World Cup name for this shape. Use LeagueStanding. Kept as an alias so not-yet-migrated peripheral files keep compiling. */
export type GroupStanding = LeagueStanding;

export interface HeadToHeadStats {
    totalMatches: number;
    homeWins: number;
    awayWins: number;
    draws: number;
    last5: HistoricalMatch[];
}

export interface HistoricalMatch {
    year: number;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    winnerId: string | 'DRAW';
}

export interface MatchHistoryItem {
    opponent: string;
    result: 'W' | 'D' | 'L';
    score: string;
    date: string;
}

export interface ScoutingData {
    id: number;
    team_id: string;
    team_name?: string;
    confederation?: string;
    fifa_rank?: number;
    star_player: string;
    strengths: string;
    weaknesses: string;
    scout_notes?: string;
    recent_form?: string;
    last_5_matches?: string;
    created_at?: string;
    lang?: string; 
}

export interface TeamFormData {
    fifaRank: number;
    history: MatchHistoryItem[];
    recentForm: string;
}

export type TournamentPhase = 'PRE_LIVE' | 'LIVE';

export interface MatchEvent {
  id: number;
  matchId: string;
  minute: number;
  minuteExtra?: number | null;
  type: string;      // 'Goal', 'Card', 'Subst', 'Var'
  detail?: string;   // 'Normal Goal', 'Own Goal', 'Penalty', 'Yellow Card', etc.
  teamId?: string;
  player?: string;
  playerId?: number | null;
  assist?: string;
  createdAt?: string; // ISO timestamp from DB — used for notification staleness check
}

// --- NEW: Broadcast & Lore Types ---
export interface CastMember {
  name: string;
  role: 'Host' | 'Pundit';
  style: string;
  backstory: string;
  quote: string;
  image: string;
}

export interface BroadcastTeam {
  id: LanguageCode;
  region: string;
  host: CastMember;
  pundit: CastMember;
}

export interface MatchLineup {
  id: number;
  matchId: string;
  teamId: string;
  playerName: string;
  playerId?: number | null;
  playerNumber?: number | null;
  position?: string | null;
  grid?: string | null;
  isStarting: boolean;
  formation?: string | null;
  kitBg?: string | null;
  kitText?: string | null;
}

export interface MatchStats {
  matchId: string;
  homeXg?: number | null;
  awayXg?: number | null;
  homeShots?: number | null;
  awayShots?: number | null;
  homeShotsOnTarget?: number | null;
  awayShotsOnTarget?: number | null;
  homePossession?: number | null;
  awayPossession?: number | null;
  homeCorners?: number | null;
  awayCorners?: number | null;
  homeFouls?: number | null;
  awayFouls?: number | null;
  homeYellow?: number | null;
  awayYellow?: number | null;
  homeRed?: number | null;
  awayRed?: number | null;
  homeOffsides?: number | null;
  awayOffsides?: number | null;
}

export interface PlayerMatchStat {
  matchId: string;
  playerId: number;
  playerName?: string | null;
  teamId?: string | null;
  minutes?: number | null;
  rating?: number | null;
  goals?: number;
  assists?: number;
  shotsTotal?: number | null;
  shotsOn?: number | null;
  passesTotal?: number | null;
  passesKey?: number | null;
  passAccuracy?: number | null;
  tackles?: number | null;
  dribblesSuccess?: number | null;
  dribblesAttempts?: number | null;
  foulsCommitted?: number | null;
  foulsDrawn?: number | null;
  yellowCards?: number;
  redCards?: number;
}
