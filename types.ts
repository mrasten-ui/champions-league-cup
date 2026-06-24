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

export type Round = 'R32' | 'R16' | 'QF' | 'SF' | 'FIN' | '3RD';

export interface Match {
  id: string;
  groupId?: string;
  round?: Round;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  venue: string;
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
}

export interface GroupStanding {
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
}

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

// --- UPDATED: Tour Configuration Interface (TV Mode) ---
export interface TourStep {
  id: string;
  targetId?: string; // HTML ID of the element to highlight (Legacy/Single target)
  targets?: string[]; // NEW: Array of IDs to highlight simultaneously
  position: 'center' | 'top' | 'bottom';
  
  // NEW: Defines which "Telestrator" graphic to draw
  overlayType?: 'none' | 'score-arrows' | 'swipe-hand' | 'sparkles' | 'tap-target'; 
  
  audioFiles: Record<string, string>; // e.g. { 'en': '/audio/...', 'no': '/audio/...' }
  
  // Visual Text (Short headlines for the TV Graphic)
  display: Record<string, {
    title: string;
    lines: string[];
  }>;

  // Audio Script (Full text spoken by personas)
  audioScript: Record<string, { host: string; pundit: string }>;
}