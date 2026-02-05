export type LanguageCode = 'EN' | 'NO' | 'SCO' | 'US';

export interface Translation {
  [key: string]: string | any;
  teamNames: Record<string, string>;

  // --- NEW: Alerts & Toasts ---
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
  
  // --- NEW: Navigation & UI ---
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
  status: 'UPCOMING' | 'LIVE' | 'HT' | 'FT' | 'AET' | 'PEN' | 'FINISHED' | '1H' | '2H' | 'NS';
  isLocked: boolean;
  channels?: Record<string, string>;
  minute?: number;
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
  code?: string;
  form?: string[]; 
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