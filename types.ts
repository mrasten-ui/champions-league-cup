// Types definition for Rasten Cup '26
export type LanguageCode = 'EN' | 'NO' | 'SCO' | 'US';
export type TournamentPhase = 'PRE_LIVE' | 'LIVE' | 'FINISHED';

export interface Translation {
  groups: string;
  knockout: string;
  leaderboard: string;
  myPredictions: string;
  match: string;
  standings: string;
  points: string;
  goalDiff: string;
  goalsFor: string;
  magicWand: string;
  revealRival: string;
  qualified: string;
  draw: string;
  welcome: string;
  // View Toggles
  treeView: string;
  listView: string;
  // Login Screen
  loginMode: string;
  signupMode: string;
  emailLabel: string;
  passwordLabel: string;
  nameLabel: string;
  enterBtn: string;
  subTitle: string;
  selectAvatar: string;
  createIdentity: string;
  // NEW SCOUTING KEYS
  vsTool: string;
  closeTool: string;
  selectTeam: string;
  winChance: string;
  tier1: string;
  tier2: string;
  tier3: string;
  tier4: string;
  tierView: string;
  allNations: string;
  compareBtn: string;
  compareActive: string;
  addToCompare: string;
  // Avatar Generator
  genAvatarBtn: string;
  genAvatarTitle: string;
  genAvatarDesc: string;
  genAvatarPlaceholder: string;
  generate: string;
  useAvatar: string;
  orChoosePreset: string;
  // Second Chance
  secondChanceTab: string;
  secondChanceTitle: string;
  secondChanceDesc: string;
  secondChanceBtn: string;
  secondChanceUnlockWarn: string;
  refreshTeams: string;
  refreshTeamsDesc: string;
  deadline: string;
  deadlinePassed: string;
  lockedState: string;
  secondChanceActive: string;
  pointsReduced: string;
  // Manager Progress (Pre-Live)
  managersTab: string;
  progressGroups: string;
  progressKnockout: string;
  managerReady: string;
  managerIncomplete: string;
  // Rules & Profile
  profile: string;
  logout: string;
  rulesBtn: string;
  rulesTitle: string;
  tabHowToPlay: string;
  tabScoring: string;
  rule1Title: string;
  rule1Desc: string;
  rule2Title: string;
  rule2Desc: string;
  rule3Title: string;
  rule3Desc: string;
  rule4Title: string;
  rule4Desc: string;
  rule5Title: string;
  rule5Desc: string;
  scoreExact: string;
  scoreResult: string;
  scorePenalty: string;
  scoreKnockoutTitle: string;
  scoreKnockoutDesc: string;
  specialConditions: string;
  gotIt: string;
  // Analysis / What If
  analysisTab: string;
  analysisTitle: string;
  selectRival: string;
  maxPotential: string;
  swingMatches: string;
  pathVictory: string;
  noSwings: string;
  me: string;
  vs: string;
  risk: string;
  proTip: string;
  aiInsight: string;
  swingExplainerTitle: string;
  swingExplainerDesc: string;
  simulationTitle: string;
  projectedStandings: string;
  resetBtn: string;
  punditSays: string;
  tacticalAnalysisTitle: string;
  tacticalAnalysisDesc: string;
  criticalGames: string;
  // NEW KEYS START
  simulatedRank: string;
  rivalWatch: string;
  whoAdvances: string;
  filterNext48: string;
  filterAll: string;
  resetSim: string;
  // NEW KEYS END
  // Analysis Buttons
  analysisOpportunity: string;
  analysisOpportunityDesc: string;
  analysisPitfall: string;
  analysisPitfallDesc: string;
  analysisRealistic: string;
  analysisRealisticDesc: string;
  analysisRoast: string;
  analysisRoastDesc: string;
  // Engine Analysis Messages
  analysisCorrectWinner: string;
  analysisIncorrectWinner: string;
  analysisExact: string;
  analysisResult: string;
  analysisWaiting: string;
  // Scouting
  scoutingTab: string;
  scoutReport: string;
  attack: string;
  midfield: string;
  defense: string;
  overall: string;
  starPlayer: string;
  formGuide: string;
  searchNation: string;
  fifaRank: string;
  tacticalAnalysis: string;
  closeReport: string;
  strengthsLabel: string;
  weaknessesLabel: string;
  trendLabel: string;
  trendUp: string;
  trendDown: string;
  trendFlat: string;
  lastMatches: string;
  // Navigation & General UI
  backToGroup: string;
  backTo: string;
  goToBracket: string;
  prevGroup: string;
  nextGroup: string;
  overviewBtn: string;
  bracketBtn: string;
  allBtn: string;
  tablesBtn: string;
  confirmClear: string;
  finishGroupBtn: string;
  // MatchCard & Interaction
  revealBtn: string;
  tokensLeft: string; // "Intel Left"
  spyCost: string;    // "1 Intel"
  rivalLive: string;
  rivalIntel: string;
  scenarioAnalysis: string;
  now: string;
  noPick: string;
  myPick: string;
  advanced: string;
  live: string;
  ft: string;
  // Substitutions (New)
  substitutions: string;
  makeSub: string;
  subConfirm: string;
  subSuccess: string;
  unlocked: string;
  // Navigation V2
  tabTournament: string;
  tabManager: string;
  subnavSchedule: string;
  subnavTables: string;
  subnavBracket: string;
  // Leaderboard
  rank: string;
  manager: string;
  status: string;
  total: string;
  liveStandings: string;
  bankedOnly: string;
  scoringRulesInfo: string;
  lbBreakdown: string;
  lbAccuracy: string;
  lbExact: string;
  lbCorrect: string;
  lbGroupPts: string;
  lbKoPts: string;
  lbGlobal: string;
  lbLeague: string;
  lbQualified: string;
  lbQualifiedDesc: string;
  lbGroupRes: string;
  liveToggle: string;
  bankedToggle: string;
  // MyPredictions
  journeyTitle: string;
  journeyDesc: string;
  picksMade: string;
  completion: string;
  searchPlaceholder: string;
  noMatches: string;
  noMatchesHint: string;
  groupStagePoints: string;
  filterUpcoming: string;
  filterLive: string;
  filterFinished: string;
  // Helping Hand
  simKnockoutTitle: string;
  simGroupTitle: string;
  simKnockoutDesc: string;
  simGroupDesc: string;
  runSim: string;
  simulating: string;
  selected: string;
  clearAll: string;
  openHand: string;
  // Knockout Specific
  champion: string;
  grandFinal: string;
  thirdPlacePlayoff: string;
  scrollHint: string;
  nextRound: string;
  prevRound: string;
  lockedBracketTitle: string;
  lockedBracketDesc: string;
  // Tables
  allGroupTables: string;
  bestThirdPlace: string;
  top8Advance: string;
  eliminationLine: string;
  teamCol: string;
  grpCol: string;
  // Removed duplicates that caused error
  roundOf32?: string;
  roundOf16?: string;
  quarterFinals?: string;
  semiFinals?: string;
  
  // History / Stats
  headToHead: string;
  wins: string;
  draws: string;
  totalMeetings: string;
  firstMeeting: string;
  firstMeetingDesc: string;
  showingLast5: string;
  noHistory: string;
  loadingHistory: string;

  // Broadcaster
  myPickShort: string;
  watchOn: string;

  // Time
  days: string;
  hours: string;
  minutes: string;
  seconds: string;

  // Localized Team Data
  teamNames: Record<string, string>;
  teamOverviews: Record<string, string>;
}

export interface MatchHistoryItem {
  opponent: string;
  result: 'W' | 'D' | 'L';
  score: string;
  date: string;
}

export interface ScoutingData {
  id?: number;
  idx?: number; 
  team_id: string; 
  team_name?: string; 
  lang?: string; 
  confederation?: string;
  fifa_rank?: number;
  star_player: string;
  strengths: string;
  weaknesses: string;
  scout_notes?: string;
  recent_form?: string;
  last_5_matches?: string; 
  created_at?: string;
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
  overview: string;
  analysis?: string; 
  starPlayer: string;
  form: ('W' | 'D' | 'L')[];
  matchHistory?: MatchHistoryItem[]; 
}

export type Round = 'R32' | 'R16' | 'QF' | 'SF' | 'FIN' | '3RD';
export type MatchStatus = 'UPCOMING' | 'LIVE' | 'FINISHED' | 'NS' | 'FT' | '1H' | '2H' | 'HT' | 'PST' | 'CANC' | 'ABD' | 'AET' | 'PEN';

export interface Match {
  id: string; 
  apiId?: string; 
  groupId?: string; 
  round?: Round;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  
  date: string; 
  venue?: string;
  
  isLocked: boolean; 
  status: MatchStatus;
  minute?: number; 
  nextMatchId?: string; 
  channels?: {
    EN: string;
    SCO: string;
    NO: string;
    US: string;
    [key: string]: string;
  };
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
}

export interface UserProfile {
  name: string;
  email: string;
  tokens: number; 
  substitutions: number; 
  unlockedMatches?: string[]; 
  favorites: string[]; 
  avatar: string; 
  hasTakenSecondChance?: boolean;
  spiedMatches?: string[];
  leagues?: string[]; 
}

export interface Prediction {
  userId: string;
  matchId: string;
  home: number;
  away: number;
}

export interface HistoricalMatch {
  year: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  winnerId: string | 'DRAW';
}

export interface HeadToHeadStats {
  totalMatches: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  last5: HistoricalMatch[];
}