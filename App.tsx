import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, LayoutGrid, CalendarDays, ListOrdered, GitMerge, ChevronRight, ChevronLeft, X, Shield } from 'lucide-react';
import { GROUP_CONFIG, TRANSLATIONS, LEAGUES, LEAGUE_DEFAULT_LANGS, INITIAL_MATCHES } from './constants';
import { LanguageCode, UserProfile, Prediction, TournamentPhase, Round, Match } from './types';
import {
  calculateGroupStandings,
  calculateLeagueStandings,
  simulateFullTournament,
  applyPredictionsToBracket,
  getAllGroupStandings,
  getThirdPlaceStandings,
  updateBracket,
  calculatePoints,
  getQualifiedRoundsSwiss,
  resolvePredictedKnockoutBracket,
  computeFinalRank,
  buildRealResultReveal,
  buildFutureReset,
} from './services/engine';
import REAL_CL_2024_RESULTS from './data/real-cl-2024-results.json';
import { isMatchLocked } from './utils/date';
import { MatchRow } from './components/MatchRow';
import { StandingsTable } from './components/StandingsTable';
import { StandingsStrip } from './components/StandingsStrip';
import { StarField } from './components/StarField';
import { MagicWand } from './components/MagicWand';
import { HelpingHandModal } from './components/HelpingHandModal';
import { KnockoutBracket } from './components/KnockoutBracket';
import { KnockoutTreeView } from './components/KnockoutTreeView';
import { Leaderboard } from './components/Leaderboard';
import { ManagerHub } from './components/ManagerHub';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { RulesPage } from './components/RulesPage';
import { PredictionNudge } from './components/PredictionNudge';
import { AvatarGenerator } from './components/AvatarGenerator';
import { InstallPrompt } from './components/InstallPrompt';
import { useSwipe } from './hooks/useSwipe';
import { supabase } from './supabase';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { DebugTools } from './components/DebugTools';
import { TournamentSchedule } from './components/TournamentSchedule';
import { FinalRecapModal } from './components/FinalRecapModal';
import { TeamDetailsModal } from './components/TeamDetailsModal';
import { useAppData, bustPredictionsCache } from './hooks/useAppData';
import { LoginScreen } from './components/LoginScreen';
import { AppHeader } from './components/AppHeader';
import { generateDailyBrief } from './components/analysis/AIAnalystWidget';
import { SecondChanceView } from './components/SecondChanceView';
import { KnockoutReminderModal } from './components/KnockoutReminderModal';
import { SecondChanceReminderModal, SCReminderType } from './components/SecondChanceReminderModal';
import { GoalBanner, GoalNotification, KitNotification, PsoNotification } from './components/GoalBanner';
import { PlayerModal } from './components/PlayerModal';
import { StadiumModal } from './components/StadiumModal';
import { LiveTicker } from './components/LiveTicker';

const STORAGE_KEYS = {
  CURRENT_USER: 'rasten_cup_active_user_v2',
  KNOCKOUT_COMPLETION_TIME_PREFIX: 'rasten_knockout_done_v1_',
  KNOCKOUT_REMINDER_LAST_SHOWN_PREFIX: 'rasten_knockout_reminder_v1_',
  NUDGE_DISMISSED_PREFIX: 'rasten_nudge_dismissed_v1_',
  SC_REMINDER_GROUP_PREFIX:    'rasten_sc_reminder_group_v1_',
  SC_REMINDER_KNOCKOUT_PREFIX: 'rasten_sc_reminder_ko_v1_',
};

export const App = () => {
  const {
    session, user, setUser, loading, matches, setMatches, teamsData,
    allPredictions, setAllPredictions, usersDb, setUsersDb, menPresets, womenPresets,
    groupStageEndTime, knockoutStartTime, lockTimePassed, matchEvents, matchLineups, matchStats, playerMatchStats,
  } = useAppData();

  const [activeTab, setActiveTab] = useState<'groups' | 'knockout' | 'leaderboard' | 'manager' | 'tournament' | 'analysis' | 'rules'>('groups');
  const [tournamentSubTab, setTournamentSubTab] = useState<'schedule' | 'tables' | 'bracket'>('schedule');
  const [scheduleJumpMatchId, setScheduleJumpMatchId] = useState<string | undefined>(undefined);
  const [activeMatchday, setActiveMatchday] = useState<number>(1);
  const [activeKnockoutRound, setActiveKnockoutRound] = useState<Round>('PO');
  
  const [language, setLanguage] = useState<LanguageCode>('EN');
  const [leagueLangs, setLeagueLangs] = useState<Record<string, LanguageCode>>(LEAGUE_DEFAULT_LANGS);
  const [adminPhaseOverride, setAdminPhaseOverride] = useState<TournamentPhase | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [scAnnouncementDismissed, setScAnnouncementDismissed] = useState(() => !!localStorage.getItem('rc_sc_announcement_v1'));
  const [isHelpingHandOpen, setIsHelpingHandOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminBanner, setShowAdminBanner] = useState(false);

  // Derived from match data — flips to LIVE the moment any group match leaves UPCOMING/NS.
  // Admin can override for testing only (requires admin mode to be active).
  const tournamentPhase = useMemo<TournamentPhase>(() => {
      if (isAdminMode && adminPhaseOverride !== null) return adminPhaseOverride;
      // !m.round (not m.groupId) is the League Phase discriminator — identical to the old check
      // for existing World Cup data (group matches never have a round set either), but also
      // correctly covers new League Phase matches, which never populate groupId at all.
      const anyLeaguePhaseStarted = matches.some(
          m => !m.round && !['UPCOMING', 'NS'].includes(m.status)
      );
      return (anyLeaguePhaseStarted || lockTimePassed) ? 'LIVE' : 'PRE_LIVE';
  }, [matches, isAdminMode, adminPhaseOverride, lockTimePassed]);
  const setTournamentPhase = setAdminPhaseOverride;
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState(false);
  const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);

  const [highlightedTeamId, setHighlightedTeamId] = useState<string | null>(null);
  const [highlightedMatchId, setHighlightedMatchId] = useState<string | null>(null);

  const [showKnockoutReminder, setShowKnockoutReminder] = useState(false);
  const [showFinalRecapModal, setShowFinalRecapModal] = useState(false);
  const [showSCReminder, setShowSCReminder] = useState(false);
  const [scReminderType, setScReminderType] = useState<SCReminderType>('group');
  const [goalQueue, setGoalQueue] = useState<GoalNotification[]>([]);
  const seenEventIdsRef = useRef<Set<number>>(new Set());
  const goalNotification = goalQueue[0] ?? null;
  const [kitQueue, setKitQueue] = useState<KitNotification[]>([]);
  const kitNotification = kitQueue[0] ?? null;
  const [psoQueue, setPsoQueue] = useState<PsoNotification[]>([]);
  const psoNotification = psoQueue[0] ?? null;
  const psoInitializedRef = useRef(false);
  const prevMatchStatusRef = useRef<Map<string, string>>(new Map());
  const [playerModal, setPlayerModal] = useState<{ playerId: number | null; playerName: string; teamId: string } | null>(null);
  const [stadiumVenue, setStadiumVenue] = useState<string | null>(null);
  const kitNotifiedMatchesRef = useRef<Set<string>>(new Set());
  const kitInitializedRef = useRef(false);
  const [installAction, setInstallAction] = useState<(() => void) | null>(null);
  const [dailyBrief, setDailyBrief] = useState<string | null>(null);
  const [briefRefreshing, setBriefRefreshing] = useState(false);

  const t = TRANSLATIONS[language];
  const localeMap: Record<LanguageCode, string> = { EN: 'en-GB', US: 'en-US', NO: 'no-NO', SCO: 'en-GB' };
  const currentLocale = localeMap[language];

  // --- INVITE LINK HANDLER ---
  // Reads ?invite=slug from URL on first load and stores in sessionStorage.
  // Also applies the league's default language immediately (for the login screen).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      sessionStorage.setItem('pending_league_invite', invite);
      const defaultLang = LEAGUE_DEFAULT_LANGS[invite];
      if (defaultLang) setLanguage(defaultLang);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Keep ?invite=slug in the URL while the user is logged in with a league,
  // so they can share directly from the browser address bar.
  useEffect(() => {
    if (!user?.leagues?.length) return;
    const slug = user.leagues[0];
    const current = new URLSearchParams(window.location.search).get('invite');
    if (current !== slug) window.history.replaceState({}, '', `?invite=${slug}`);
  }, [user?.leagues]);

  // --- LEAGUE LANGUAGE SETTINGS ---
  // Load per-league language overrides from Supabase settings table.
  // After loading, re-apply language for any pending invite so the login page
  // shows the right language even when the constants fallback is 'EN'.
  useEffect(() => {
    if (!supabase) return;
    supabase.from('settings').select('key, value').eq('key', 'league_langs')
      .then(({ data }) => {
        const row = data?.[0];
        if (!row?.value) return;
        const overrides = row.value as Record<string, LanguageCode>;
        setLeagueLangs(prev => ({ ...prev, ...overrides }));
        const pendingInvite = sessionStorage.getItem('pending_league_invite');
        if (pendingInvite && overrides[pendingInvite]) setLanguage(overrides[pendingInvite]);
      })
      .catch(() => { /* settings table not yet created — silently ignore */ });
  }, []);

  // --- HELPERS ---
  const addToast = (type: ToastType, title: string, message?: string, action?: { label: string; onClick: () => void }) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, title, message, action }]);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // --- ACTIONS: NAVIGATION JUMPS ---
  const handleJumpToTable = (groupId: string, teamId: string) => {
      setTournamentSubTab('tables');
      setHighlightedTeamId(teamId);
      setTimeout(() => {
          const element = document.getElementById(`group-card-${groupId}`);
          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      setTimeout(() => setHighlightedTeamId(null), 2000);
  };

  const handleJumpToBracket = (matchId: string) => {
      setTournamentSubTab('bracket');
      setTimeout(() => {
          const element = document.getElementById(`bracket-match-${matchId}`);
          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }, 100);
      // Double-blink: on → off → on → off
      setHighlightedMatchId(matchId);
      setTimeout(() => setHighlightedMatchId(null), 500);
      setTimeout(() => setHighlightedMatchId(matchId), 900);
      setTimeout(() => setHighlightedMatchId(null), 1500);
  };

  // --- CORE LOGIC WITH 3-STAGE SECOND CHANCE OVERRIDE ---
  const userMatches = useMemo(() => {
      if (!user) return matches;
      let userSpecificPreds = allPredictions.filter(p => p.userId === user.email);

      const isDraftingWindow = user.secondChanceStatus === 'PENDING' && groupStageEndTime > 0 && Date.now() >= groupStageEndTime;

      if (user.bracketPredictions) {
          // SUB was used — replace live group preds with the frozen pre-SUB snapshot for bracket derivation
          userSpecificPreds = userSpecificPreds.map(p =>
              /^[A-L]\d$/.test(p.matchId) && user.bracketPredictions![p.matchId]
                  ? { ...p, ...user.bracketPredictions![p.matchId] }
                  : p
          );
      }
      return applyPredictionsToBracket(matches, teamsData, userSpecificPreds);
  }, [matches, teamsData, allPredictions, user, groupStageEndTime]);

  // Bracket display — cascades predictions freely.
  // SC players: use real group results as base so R32 shows actual qualifiers, then apply SC knockout picks.
  // Non-SC players: use INITIAL_MATCHES so group predictions cascade through the full bracket.
  const userBracket = useMemo(() => {
      if (!user) return INITIAL_MATCHES;
      let bracketPreds = allPredictions.filter(p => p.userId === user.email);
      if (user.bracketPredictions) {
          bracketPreds = bracketPreds.map(p =>
              /^[A-L]\d$/.test(p.matchId) && user.bracketPredictions![p.matchId]
                  ? { ...p, ...user.bracketPredictions![p.matchId] }
                  : p
          );
      }

      const isDraftingWindow = user.secondChanceStatus === 'PENDING' && groupStageEndTime > 0 && Date.now() >= groupStageEndTime;
      // SC bracket: use real group results as base for any SC user (pledged+drafting OR locked-in).
      // The setMatchup TBD guard in updateBracket ensures real R32 teams from DB are never
      // overwritten, so partial group data cannot distort slot assignments.
      if (isDraftingWindow || user.hasTakenSecondChance) {
          // Canonical set of match IDs valid for the SC bracket (R32→FIN, no 3rd-place playoff).
          // Derived from INITIAL_MATCHES so we're immune to DB round mismatches on 3RD_1.
          const SC_KO_ROUNDS = new Set(['R32', 'R16', 'QF', 'SF', 'FIN']);
          const SC_MATCH_IDS = new Set(
              INITIAL_MATCHES.filter(m => !m.groupId && SC_KO_ROUNDS.has(m.round ?? '')).map(m => m.id)
          );
          // Base: group matches use real results; KO matches preserve scores/lock if already started,
          // null out future KO matches so SC picks apply there.
          const scBase = matches
              .filter(m => m.groupId || SC_MATCH_IDS.has(m.id))
              .map(m => {
                  if (m.groupId) return m;
                  const started = m.date !== 'TBD' && new Date(m.date).getTime() <= Date.now();
                  // Only lock if real scores exist — a started-but-null-score match (live with no
                  // goals synced yet, or kickoff imminent) should still show the user's pick in R16.
                  const hasRealScore = started && m.homeScore !== null && m.awayScore !== null;
                  return { ...m, isLocked: hasRealScore, homeScore: started ? m.homeScore : null, awayScore: started ? m.awayScore : null };
              });
          // Inject real results for definitively finished KO matches so the winner cascades.
          // Only inject when fully settled (FT/AET/PEN) — live 0-0 scores can't determine a
          // winner and would cascade TBD placeholder chips into later rounds.
          // Display-only: not in sc_draft, not written to DB, no points awarded.
          const FINISHED_STATUSES = new Set(['FINISHED', 'FT', 'AET', 'PEN']);
          const startedResults = matches
              .filter(m => SC_MATCH_IDS.has(m.id) && FINISHED_STATUSES.has(m.status ?? '') && m.homeScore !== null && m.awayScore !== null)
              .map(m => ({ userId: user.email, matchId: m.id, home: m.homeScore!, away: m.awayScore! }));
          const startedIds = new Set(startedResults.map(r => r.matchId));
          let scKnockoutPreds = [
              ...bracketPreds.filter(p => !/^[A-L]\d$/.test(p.matchId) && !startedIds.has(p.matchId)),
              ...startedResults,
          ];
          if (isDraftingWindow && user.scDraft) {
              const draftPreds = Object.entries(user.scDraft).map(([matchId, { home, away }]) => ({
                  userId: user.email, matchId, home, away,
              }));
              const draftIds = new Set(draftPreds.map(p => p.matchId));
              scKnockoutPreds = [...scKnockoutPreds.filter(p => !draftIds.has(p.matchId)), ...draftPreds];
          }
          return applyPredictionsToBracket(scBase, teamsData, scKnockoutPreds);
      }

      return applyPredictionsToBracket(INITIAL_MATCHES, teamsData, bracketPreds);
  }, [matches, teamsData, allPredictions, user, groupStageEndTime]);

  // Manager tab "what did I predict?" bracket.
  //
  // SC ACTIVE users: their SC picks reference real R32 teams, so we use the real
  // SC teams as the base (null out all scores so no results are revealed) and apply
  // the user's own picks to cascade winners through R16/QF/SF/FIN.
  //
  // Non-SC users: start from INITIAL_MATCHES so group predictions cascade to R32.
  // Fall back to real finished results for knockout slots the user didn't pick so
  // R16+ isn't empty.
  const standardBracket = useMemo(() => {
      if (!user) return INITIAL_MATCHES;
      const userPreds = allPredictions.filter(p => p.userId === user.email);

      if (user.hasTakenSecondChance) {
          // Build a base with real R32 teams but no scores — user's picks drive the cascade.
          // Include 3RD so the 3rd-place match section appears in the Manager bracket view.
          const SC_KO_ROUNDS = new Set(['R32', 'R16', 'QF', 'SF', 'FIN', '3RD']);
          const SC_MATCH_IDS = new Set(
              INITIAL_MATCHES.filter(m => !m.groupId && SC_KO_ROUNDS.has(m.round ?? '')).map(m => m.id)
          );
          const scBaseTeamsOnly = matches
              .filter(m => m.groupId || SC_MATCH_IDS.has(m.id))
              .map(m => m.groupId ? m : { ...m, isLocked: false, homeScore: null, awayScore: null });
          const userKoPicks = userPreds.filter(p => !/^[A-L]\d$/.test(p.matchId));
          const bracket = resolvePredictedKnockoutBracket(
              applyPredictionsToBracket(scBaseTeamsOnly, teamsData, userKoPicks),
              userKoPicks
          );

          // Auto-fill 3rd place pick for SC users who didn't select one:
          // use the higher-ranked (lower rank number) SF loser as the winner.
          const has3rdPick = userKoPicks.some(p => p.matchId === '3RD_1');
          if (!has3rdPick) {
              const third = bracket.find(m => m.id === '3RD_1');
              if (third && third.homeTeamId && !third.homeTeamId.startsWith('TBD')
                        && third.awayTeamId && !third.awayTeamId.startsWith('TBD')) {
                  const homeRank = teamsData[third.homeTeamId]?.rank ?? 999;
                  const awayRank = teamsData[third.awayTeamId]?.rank ?? 999;
                  const homeWins = homeRank <= awayRank;
                  third.homeScore = homeWins ? 1 : 0;
                  third.awayScore = homeWins ? 0 : 1;
              }
          }

          return bracket;
      }

      // Non-SC: group predictions cascade to R32; fall back to real results for unpicked KO slots
      const FINISHED_STATUSES = new Set(['FINISHED', 'FT', 'AET', 'PEN']);
      const KO_IDS = new Set(INITIAL_MATCHES.filter(m => !m.groupId).map(m => m.id));
      const userKOIds = new Set(userPreds.filter(p => KO_IDS.has(p.matchId)).map(p => p.matchId));
      const fallbackResults = matches
          .filter(m => KO_IDS.has(m.id) && FINISHED_STATUSES.has(m.status ?? '') && m.homeScore !== null && m.awayScore !== null && !userKOIds.has(m.id))
          .map(m => ({ userId: user.email, matchId: m.id, home: m.homeScore!, away: m.awayScore! }));
      const combinedPreds = [...userPreds, ...fallbackResults];
      return resolvePredictedKnockoutBracket(
          applyPredictionsToBracket(INITIAL_MATCHES, teamsData, combinedPreds),
          combinedPreds
      );
  }, [allPredictions, user, teamsData, matches]);

  const liveResultsAsPredictions = useMemo(() => {
      return matches
        .filter(m => m.homeScore !== null && m.awayScore !== null)
        .map(m => ({ 
            matchId: m.id, 
            home: m.homeScore!, 
            away: m.awayScore!, 
            userId: 'LIVE_SYSTEM' 
        }));
  }, [matches]);

  // Pure prediction matches: force-unlock all group matches so the user's original
  // predictions always override real scores. Finished matches are normally locked,
  // which makes "predicted" standings converge to actual as games complete — not what we want here.
  const purePredictionMatches = useMemo(() => {
      if (!user) return matches;
      let preds = allPredictions.filter(p => p.userId === user.email);
      if (user.bracketPredictions) {
          preds = preds.map(p =>
              /^[A-L]\d$/.test(p.matchId) && user.bracketPredictions![p.matchId]
                  ? { ...p, ...user.bracketPredictions![p.matchId] }
                  : p
          );
      }
      const unlocked = matches.map(m => m.groupId ? { ...m, isLocked: false } : m);
      return applyPredictionsToBracket(unlocked, teamsData, preds);
  }, [matches, teamsData, allPredictions, user]);

  const purePredictedQualifiedThirds = useMemo(() => {
      if (!user) return new Set<string>();
      const all = getAllGroupStandings(purePredictionMatches, teamsData);
      const thirds = getThirdPlaceStandings(all);
      return new Set(thirds.slice(0, 8).map(t => t.teamId));
  }, [user, purePredictionMatches, teamsData]);

  const { predictedAdvancingTeams, predictedKnockoutWinners } = useMemo(() => {
      const empty = { predictedAdvancingTeams: new Set<string>(), predictedKnockoutWinners: new Map<string, string>() };
      if (!user) return empty;
      let userPreds = allPredictions.filter(p => p.userId === user.email);
      if (user.bracketPredictions) {
          userPreds = userPreds.map(p =>
              /^[A-L]\d$/.test(p.matchId) && user.bracketPredictions![p.matchId]
                  ? { ...p, ...user.bracketPredictions![p.matchId] }
                  : p
          );
      }
      const bracket = resolvePredictedKnockoutBracket(
          applyPredictionsToBracket(INITIAL_MATCHES, teamsData, userPreds),
          userPreds
      );

      // Teams predicted to qualify from groups → appear in R32
      const predictedAdvancingTeams = new Set(
          bracket
              .filter(m => m.round === 'R32')
              .flatMap(m => [m.homeTeamId, m.awayTeamId])
              .filter((t): t is string => !!t && t !== 'TBD')
      );

      // For each knockout match: which specific team did the player predict to advance?
      // Derived from the simulated bracket (team-identity-based, not home/away-slot-based).
      const predictedKnockoutWinners = new Map<string, string>();
      for (const bm of bracket) {
          if (!bm.round) continue;
          const pred = userPreds.find(p => p.matchId === bm.id);
          if (!pred) continue;
          if (pred.home > pred.away && bm.homeTeamId && bm.homeTeamId !== 'TBD') {
              predictedKnockoutWinners.set(bm.id, bm.homeTeamId);
          } else if (pred.away > pred.home && bm.awayTeamId && bm.awayTeamId !== 'TBD') {
              predictedKnockoutWinners.set(bm.id, bm.awayTeamId);
          }
      }

      return { predictedAdvancingTeams, predictedKnockoutWinners };
  }, [allPredictions, teamsData, user]);

  const allPredictedGroupStandings = useMemo((): Record<string, Record<string, number>> => {
      if (!user) return {};
      return Object.fromEntries(
          GROUP_CONFIG.map(g => {
              const predicted = calculateGroupStandings(g.id, purePredictionMatches, teamsData);
              return [g.id, Object.fromEntries(predicted.map((s, i) => [s.teamId, i + 1]))];
          })
      );
  }, [user, purePredictionMatches, teamsData]);

  // Count how many of the 32 KO slots the user has filled via group predictions:
  // top 2 from each of 12 groups (24) + 8 qualifying third-place teams
  const predictedKOTeamCount = useMemo(() => {
      if (!user) return 0;
      const top2 = Object.values(allPredictedGroupStandings).flatMap(rankMap =>
          Object.entries(rankMap).filter(([, rank]) => rank <= 2).map(([id]) => id)
      );
      const thirds = [...purePredictedQualifiedThirds];
      return new Set([...top2, ...thirds]).size;
  }, [user, allPredictedGroupStandings, purePredictedQualifiedThirds]);

  const predictedR32Teams = useMemo((): string[] => {
      if (!user) return [];
      const top2 = Object.values(allPredictedGroupStandings).flatMap(rankMap =>
          Object.entries(rankMap).filter(([, rank]) => rank <= 2).map(([id]) => id)
      );
      return [...new Set([...top2, ...purePredictedQualifiedThirds])];
  }, [user, allPredictedGroupStandings, purePredictedQualifiedThirds]);

  const r32Tracker = useMemo(() => {
      if (predictedR32Teams.length === 0) return null;
      const DONE_STATUSES = ['FT', 'AET', 'PEN', 'FINISHED'];
      const allRealStandings = getAllGroupStandings(matches, teamsData);
      const realTop2 = Object.values(allRealStandings).flatMap(g => g.slice(0, 2).map(s => s.teamId));
      const realThirds = getThirdPlaceStandings(allRealStandings).slice(0, 8).map(s => s.teamId);
      const actualR32 = new Set([...realTop2, ...realThirds]);
      const groupIds = [...new Set(matches.filter(m => m.groupId).map(m => m.groupId!))];
      const completedGroups = new Set(
          groupIds.filter(gid => matches.filter(m => m.groupId === gid).every(m => DONE_STATUSES.includes(m.status)))
      );
      const allGroupsDone = completedGroups.size === groupIds.length;
      let matched = 0, wrong = 0, pending = 0;
      for (const teamId of predictedR32Teams) {
          if (actualR32.has(teamId)) { matched++; continue; }
          const teamGroup = groupIds.find(gid =>
              matches.some(m => m.groupId === gid && (m.homeTeamId === teamId || m.awayTeamId === teamId))
          );
          if (teamGroup && completedGroups.has(teamGroup) && allGroupsDone) { wrong++; } else { pending++; }
      }
      return { matched, wrong, pending, total: predictedR32Teams.length, groupsLeft: groupIds.length - completedGroups.size };
  }, [predictedR32Teams, matches, teamsData]);

  // --- ACTIONS ---
  const handleLogout = async () => {
      if (supabase) await supabase.auth.signOut();
      setUser(null); setIsProfileMenuOpen(false);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      addToast('info', t.loggedOutTitle, t.loggedOutMsg);
  };

  useEffect(() => {
    if (showAvatarEditor && user) {
      setPendingName(user.name);
      setNameError(null);
    }
  }, [showAvatarEditor]);

  const saveNewName = async () => {
    if (!user || !supabase) return;
    const trimmed = pendingName.trim();
    if (!trimmed) { setNameError('Name cannot be empty.'); return; }
    if (trimmed === user.name) { setShowAvatarEditor(false); return; }

    const lc = trimmed.toLowerCase();
    const taken = Object.values(usersDb).some(p => p.email !== user.email && p.name.toLowerCase() === lc);
    if (taken) { setNameError(t.nameTaken); return; }

    setNameSaving(true);
    const { error } = await supabase.from('profiles').update({ name: trimmed } as any).eq('email', user.email);
    setNameSaving(false);
    if (error) { setNameError(t.saveFailedMsg); return; }

    setUser({ ...user, name: trimmed });
    setUsersDb(prev => ({ ...prev, [user.email]: { ...prev[user.email], name: trimmed } }));
    setNameError(null);
    setShowAvatarEditor(false);
    addToast('success', t.profileUpdated, t.profileMsg);
  };

  const updateAvatar = async (newAvatar: string) => {
    if (!user || !supabase) return;
    let finalUrl = newAvatar;
    if (newAvatar.startsWith('data:')) {
        try {
            const res = await fetch(newAvatar);
            const blob = await res.blob();
            const fileName = `avatar_${user.email.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, blob, { upsert: true });
            if (!uploadError) {
                const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                finalUrl = data.publicUrl;
            }
        } catch (e) { addToast('error', t.saveFailed, t.saveFailedMsg); return; }
    }
    setUser({ ...user, avatar: finalUrl });
    const { error: dbError } = await supabase.from('profiles').update({ avatar: finalUrl } as any).eq('email', user.email);
    if (dbError) { console.error('Avatar DB save failed:', dbError); addToast('error', t.saveFailed, dbError.message); return; }
    setShowAvatarEditor(false);
    addToast('success', t.profileUpdated, t.profileMsg);
  };

  const handleScoreUpdate = async (matchId: string, h: number, a: number) => {
    if (!user || !supabase) return;
    const match = matches.find(m => m.id === matchId);

    const isWhitelisted = user.unlockedMatches?.includes(matchId);
    const matchKickoffPassed = match.date !== 'TBD' && new Date(match.date).getTime() <= Date.now();
    // !!match.round (not !match.groupId) is the knockout discriminator — identical for existing
    // World Cup data, also correct for new League Phase matches (which never set groupId).
    const isSecondChanceDrafting = user.secondChanceStatus === 'PENDING' && !!match.round && !matchKickoffPassed;
    // isMatchLocked folds in the rolling 1-hour-before-kickoff window on top of the same checks
    // match.isLocked used to cover alone (admin override, live, finished) — keeps this write-time
    // gate in sync with what MatchCard's input UI actually disables.
    const effectiveLock = isSecondChanceDrafting ? false : isMatchLocked(match);
    if (!match || (effectiveLock && !isWhitelisted)) return;

    // SC DRAFTING: save to staging (sc_draft on profiles), not predictions table
    if (isSecondChanceDrafting) {
      const newScDraft = { ...(user.scDraft || {}), [matchId]: { home: Number(h), away: Number(a) } };
      setUser(prev => prev ? { ...prev, scDraft: newScDraft } : null);
      const { error } = await supabase.from('profiles').update({ sc_draft: newScDraft } as any).eq('email', user.email);
      if (error) { console.error('SC draft save failed:', error.message); addToast('error', t.saveFailed, t.saveFailedMsg); }
      return;
    }

    const newPred = { userId: user.email, matchId, home: Number(h), away: Number(a), homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId };

    // --- Cascade: detect knockout slots that shift due to this League Phase prediction ---
    let idsToDelete: string[] = [];
    if (!match.round) {
      const updatedPreds = (() => {
        const idx = allPredictions.findIndex(p => p.userId === user.email && p.matchId === matchId);
        if (idx > -1) { const copy = [...allPredictions]; copy[idx] = newPred; return copy; }
        return [...allPredictions, newPred];
      })();
      const afterBracket = applyPredictionsToBracket(matches, teamsData, updatedPreds);
      const affected = new Set<string>();
      for (const afterMatch of afterBracket.filter(m => m.round)) {
        const before = userMatches.find(b => b.id === afterMatch.id);
        if (!before) continue;
        const homeShifted = before.homeTeamId !== 'TBD' && before.homeTeamId !== afterMatch.homeTeamId;
        const awayShifted = before.awayTeamId !== 'TBD' && before.awayTeamId !== afterMatch.awayTeamId;
        if (homeShifted || awayShifted) {
          let cur: typeof afterMatch | undefined = afterMatch;
          while (cur) {
            affected.add(cur.id);
            cur = cur.nextMatchId ? afterBracket.find(m => m.id === cur!.nextMatchId) : undefined;
          }
        }
      }
      idsToDelete = [...affected].filter(id =>
        allPredictions.some(p => p.userId === user.email && p.matchId === id)
      );
    }

    // Snapshot PREVIOUS group prediction and cascade victims before mutating (needed for full undo)
    const previousGroupPred = allPredictions.find(p => p.userId === user.email && p.matchId === matchId) ?? null;
    const deletedPreds = idsToDelete.length > 0
      ? allPredictions.filter(p => p.userId === user.email && idsToDelete.includes(p.matchId))
      : [];

    // Update local state atomically: apply group edit + remove cascade-affected
    setAllPredictions(prev => {
      const idx = prev.findIndex(p => p.userId === user.email && p.matchId === matchId);
      let updated = idx > -1 ? prev.map((p, i) => i === idx ? newPred : p) : [...prev, newPred];
      if (idsToDelete.length > 0)
        updated = updated.filter(p => !(p.userId === user.email && idsToDelete.includes(p.matchId)));
      return updated;
    });

    // For knockout predictions, capture which team the user intends to win.
    // Prefer real match teams (routing-independent) so client-side routing bugs never corrupt pwid.
    // Fall back to userBracket only for matches with TBD real teams (future rounds not yet assigned).
    let predictedWinnerId: string | undefined;
    if (match.round) {
      const realHome = match.homeTeamId !== 'TBD' ? match.homeTeamId : undefined;
      const realAway = match.awayTeamId !== 'TBD' ? match.awayTeamId : undefined;
      const homeId = realHome ?? userBracket.find(m => m.id === matchId)?.homeTeamId;
      const awayId = realAway ?? userBracket.find(m => m.id === matchId)?.awayTeamId;
      if (homeId && awayId && homeId !== 'TBD' && awayId !== 'TBD') {
        if (Number(h) > Number(a)) predictedWinnerId = homeId;
        else if (Number(a) > Number(h)) predictedWinnerId = awayId;
      }
    }

    // Save group/knockout prediction
    const { error: predError } = await supabase.from('predictions').upsert(
      { user_id: user.email, match_id: matchId, home: Number(h), away: Number(a), home_team_id: match.homeTeamId, away_team_id: match.awayTeamId, ...(predictedWinnerId ? { predicted_winner_id: predictedWinnerId } : {}) } as any,
      { onConflict: 'user_id,match_id' }
    );
    if (predError) { console.error('Prediction save failed:', predError.message, predError); addToast('error', t.saveFailed, t.saveFailedMsg); }
    else { bustPredictionsCache(); }

    // Cascade delete from DB + toast with full undo (group score + knockouts)
    if (idsToDelete.length > 0) {
      await supabase.from('predictions').delete().eq('user_id', user.email).in('match_id', idsToDelete);
      const handleUndo = async () => {
        // Restore local state immediately (UI first)
        setAllPredictions(prev => {
          let updated = prev.filter(p => !(p.userId === user.email && p.matchId === matchId));
          if (previousGroupPred) updated = [...updated, previousGroupPred];
          const userMatchIds = new Set(updated.filter(p => p.userId === user.email).map(p => p.matchId));
          return [...updated, ...deletedPreds.filter(p => !userMatchIds.has(p.matchId))];
        });
        // Persist to Supabase (best-effort)
        try {
          if (previousGroupPred) {
            await supabase.from('predictions').upsert(
              { user_id: previousGroupPred.userId, match_id: previousGroupPred.matchId, home: previousGroupPred.home, away: previousGroupPred.away, home_team_id: previousGroupPred.homeTeamId, away_team_id: previousGroupPred.awayTeamId } as any,
              { onConflict: 'user_id,match_id' }
            );
          } else {
            await supabase.from('predictions').delete().eq('user_id', user.email).eq('match_id', matchId);
          }
          if (deletedPreds.length > 0) {
            await supabase.from('predictions').upsert(
              deletedPreds.map(p => ({ user_id: p.userId, match_id: p.matchId, home: p.home, away: p.away, home_team_id: p.homeTeamId, away_team_id: p.awayTeamId })) as any,
              { onConflict: 'user_id,match_id' }
            );
          }
        } catch (e) {
          console.error('Undo persist failed:', e);
        }
      };
      addToast('warning', t.bracketAdjusted, t.bracketAdjustedMsg, { label: t.undo, onClick: handleUndo });
    }

    if (isWhitelisted) {
      const newUnlocked = user.unlockedMatches?.filter(id => id !== matchId) || [];
      setUser({ ...user, unlockedMatches: newUnlocked });
      await supabase.from('profiles').update({ unlocked_matches: newUnlocked } as any).eq('email', user.email);
      addToast('success', t.predSaved, t.predLocked);
    }
  };

  const handleSpy = async (matchId: string) => {
      if (!user || !supabase) return;
      if (!user.leagues || user.leagues.length === 0) {
          addToast('info', "Not yet assigned", "You haven't been assigned to a league yet. This can take up to 24 hours — check back tomorrow.");
          return;
      }
      if (user.spiedMatches?.includes(matchId)) return;
      if (user.tokens < 1) { addToast('error', t.noIntel, t.noIntelMsg); return; }
      const newSpied = [...(user.spiedMatches || []), matchId];
      const newTokens = user.tokens - 1;
      setUser({ ...user, tokens: newTokens, spiedMatches: newSpied });
      const { error: spyError } = await supabase.from('profiles').update({ tokens: newTokens, spied_matches: newSpied } as any).eq('email', user.email);
      if (spyError) addToast('error', t.saveFailed, t.saveFailedMsg);
      else addToast('success', t.rivalRevealed, t.intelUsed);
  };

  const handleSubstitute = async (matchId: string) => {
      if (!user || !supabase) return;
      
      const match = matches.find(m => m.id === matchId);
      const isStarted = match && ['LIVE', 'HT', 'FINISHED', 'FT', 'AET', 'PEN', '1H', '2H', 'ET', 'BT', 'P', 'INT'].includes(match.status);
      
      if (!match || isStarted) {
          addToast('error', t.tooLate, t.tooLateMsg);
          return;
      }

      if (user.substitutions < 1) { addToast('error', t.noSubsTitle, t.noSubsMsg); return; }

      const newUnlocked = [...(user.unlockedMatches || []), matchId];
      const newSubs = user.substitutions - 1;

      const profileUpdate: Record<string, any> = { substitutions: newSubs, unlocked_matches: newUnlocked };
      const nextUser = { ...user, substitutions: newSubs, unlockedMatches: newUnlocked };

      // On first SUB: snapshot current group predictions so the bracket stays frozen
      if (!user.bracketPredictions) {
          const snapshot = Object.fromEntries(
              allPredictions
                  .filter(p => p.userId === user.email && /^[A-L]\d$/.test(p.matchId))
                  .map(p => [p.matchId, { home: p.home, away: p.away }])
          );
          profileUpdate.bracket_predictions = snapshot;
          nextUser.bracketPredictions = snapshot;
      }

      setUser(nextUser);
      const { error: subError } = await supabase.from('profiles').update(profileUpdate as any).eq('email', user.email);
      if (subError) addToast('error', t.saveFailed, t.saveFailedMsg);
      else addToast('success', t.subSuccess, `${t.substitutions}: ${newSubs} left`);
  };

  // --- STAGE 1: PLEDGE ---
  const handlePledgeSecondChance = async () => {
      if (!user || !supabase) return;
      if (window.confirm(t.secondChanceConfirm)) {
          // Original knockout predictions stay intact until lock-in. Clear any leftover sc_draft.
          setUser({ ...user, secondChanceStatus: 'PENDING', scDraft: undefined });
          await supabase.from('profiles').update({ second_chance_status: 'PENDING', sc_draft: null } as any).eq('email', user.email);
          addToast('info', t.pledgeLocked, t.pledgeToastMsg);
          setActiveTab('knockout');
      }
  };

  // --- STAGE 3: LOCK IN ---
  const handleLockInSecondChance = async () => {
      if (!user || !supabase) return;
      if (window.confirm(t.lockInConfirm)) {
          // Push staged sc_draft picks into the real predictions table
          const draftEntries = Object.entries(user.scDraft || {});
          if (draftEntries.length > 0) {
              const realMatchMap = new Map(matches.map(m => [m.id, m]));
              const bracketMatchMap = new Map(userBracket.map(m => [m.id, m]));
              const rows = draftEntries.map(([matchId, { home, away }]) => {
                  const rm = realMatchMap.get(matchId);
                  const bm = bracketMatchMap.get(matchId);
                  const homeId = (rm?.homeTeamId !== 'TBD' ? rm?.homeTeamId : undefined) ?? bm?.homeTeamId;
                  const awayId = (rm?.awayTeamId !== 'TBD' ? rm?.awayTeamId : undefined) ?? bm?.awayTeamId;
                  let predicted_winner_id: string | undefined;
                  if (homeId && awayId && homeId !== 'TBD' && awayId !== 'TBD') {
                      if (home > away) predicted_winner_id = homeId;
                      else if (away > home) predicted_winner_id = awayId;
                  }
                  return { user_id: user.email, match_id: matchId, home, away, home_team_id: homeId, away_team_id: awayId, ...(predicted_winner_id ? { predicted_winner_id } : {}) };
              });
              const { error: pushError } = await supabase.from('predictions').upsert(rows as any, { onConflict: 'user_id,match_id' });
              if (pushError) { console.error('SC lock-in push failed:', pushError.message); addToast('error', t.saveFailed, t.saveFailedMsg); return; }
              // Sync local predictions state
              setAllPredictions(prev => {
                  let updated = [...prev];
                  for (const row of rows) {
                      const { match_id: matchId, home, away, home_team_id: homeTeamId, away_team_id: awayTeamId } = row;
                      const idx = updated.findIndex(p => p.userId === user.email && p.matchId === matchId);
                      const entry = { userId: user.email, matchId, home, away, homeTeamId, awayTeamId };
                      if (idx > -1) updated[idx] = entry; else updated = [...updated, entry];
                  }
                  return updated;
              });
              bustPredictionsCache();
          }
          setUser({ ...user, secondChanceStatus: 'ACTIVE', hasTakenSecondChance: true, scDraft: undefined });
          const { error: profileErr } = await supabase.from('profiles').update({ second_chance_status: 'ACTIVE', has_taken_second_chance: true, sc_draft: null } as any).eq('email', user.email);
          if (profileErr) {
              console.error('SC lock-in profile update failed:', profileErr.message);
              addToast('error', t.saveFailed, t.saveFailedMsg);
              return;
          }
          addToast('success', t.bracketLockedIn, t.bracketLockedInMsg);
      }
  };

  // --- RE-EDIT: ACTIVE → PENDING, copy current picks to sc_draft ---
  const handleEditSecondChance = async () => {
      if (!user || !supabase) return;
      if (window.confirm(t.lockInConfirm ? (t.changePicks || 'Are you sure you want to change your locked-in picks? You will need to lock in again.') : 'Change your locked-in Second Chance picks? You will need to lock in again.')) {
          const knockoutPreds = allPredictions.filter(p =>
              p.userId === user.email && matches.some(m => m.id === p.matchId && !m.groupId && m.round)
          );
          const newScDraft = Object.fromEntries(knockoutPreds.map(p => [p.matchId, { home: p.home, away: p.away }]));
          setUser({ ...user, secondChanceStatus: 'PENDING', scDraft: Object.keys(newScDraft).length ? newScDraft : undefined });
          await supabase.from('profiles').update({
              second_chance_status: 'PENDING',
              sc_draft: Object.keys(newScDraft).length ? newScDraft : null,
          } as any).eq('email', user.email);
          addToast('info', t.pledgeLocked || 'Editing picks', t.pledgeToastMsg || 'Make your changes and lock in again.');
      }
  };

  // Auto-cancel second chance if drafting window expired without locking in
  useEffect(() => {
      if (!user || !supabase || user.secondChanceStatus !== 'PENDING' || knockoutStartTime === 0) return;

      const cancelExpired = async () => {
          // Discard staged draft only — original predictions in predictions table are untouched
          setUser(prev => prev ? { ...prev, secondChanceStatus: 'NONE', scDraft: undefined } : null);
          await supabase.from('profiles').update({ second_chance_status: 'NONE', sc_draft: null } as any).eq('email', user.email);
          addToast('error', t.secondChanceExpired || 'Second Chance Expired', t.secondChanceExpiredMsg || 'You did not lock in before the knockouts started. Your second chance has been cancelled.');
      };

      const remaining = knockoutStartTime - Date.now();
      if (remaining <= 0) {
          cancelExpired();
      } else {
          const timer = setTimeout(cancelExpired, remaining);
          return () => clearTimeout(timer);
      }
  }, [user?.secondChanceStatus, knockoutStartTime]);

  // Admin testing tool: replay the REAL 2024/25 League Phase results (same match ids
  // as seeded) onto matches up to a chosen matchday, written to Supabase so standings/
  // knockout qualification behave exactly as they would with real results coming in.
  const handleRevealRealResults = async (upToMatchday: number) => {
      if (!supabase) return;
      const rows = buildRealResultReveal(matches, upToMatchday, REAL_CL_2024_RESULTS as any);
      if (rows.length === 0) return;
      const { error } = await supabase.from('matches').upsert(rows as any, { onConflict: 'id' });
      if (error) { console.error('Reveal real results failed:', error.message); addToast('error', t.saveFailed, t.saveFailedMsg); return; }
      addToast('success', 'Time Travel', `Revealed real results through Matchday ${upToMatchday} (${rows.length} matches).`);
  };

  const handleResetToFuture = async () => {
      if (!supabase) return;
      const rows = buildFutureReset(matches);
      const { error } = await supabase.from('matches').upsert(rows as any, { onConflict: 'id' });
      if (error) { console.error('Reset to future failed:', error.message); addToast('error', t.saveFailed, t.saveFailedMsg); return; }
      addToast('success', 'Time Travel', 'All League Phase matches reset to upcoming.');
  };

  const handleLanguageSwitch = (code: LanguageCode) => {
      setLanguage(code);
  };

  // --- REFUND WATCHER ---
  // Tracks IDs already refunded this session to prevent double-processing if the
  // effect fires twice before the state update has propagated.
  const refundedMatchIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.email || !user.unlockedMatches?.length || !matches.length) return;

    const matchesToRefund = user.unlockedMatches.filter(id => {
        if (refundedMatchIds.current.has(id)) return false;
        const match = matches.find(m => m.id === id);
        return match && !['UPCOMING', 'NS'].includes(match.status);
    });

    if (matchesToRefund.length === 0) return;

    matchesToRefund.forEach(id => refundedMatchIds.current.add(id));

    const newUnlocked = user.unlockedMatches.filter(id => !matchesToRefund.includes(id));
    const newSubs = user.substitutions + matchesToRefund.length;

    setUser(prev => prev ? { ...prev, unlockedMatches: newUnlocked, substitutions: newSubs } : null);

    if (supabase) {
        supabase.from('profiles')
            .update({ unlocked_matches: newUnlocked, substitutions: newSubs } as any)
            .eq('email', user.email);
    }

    addToast('info', t.subRefunded, t.subRefundedMsg);
  }, [matches, user?.unlockedMatches]);

  useEffect(() => {
      const checkPendingLeague = async () => {
          if (user && supabase) {
              const existing = user.leagues || [];
              const toAdd: string[] = [];

              // Single invite link (?invite=slug)
              const singleInvite = sessionStorage.getItem('pending_league_invite');
              if (singleInvite) {
                if (!existing.includes(singleInvite)) toAdd.push(singleInvite);
                sessionStorage.removeItem('pending_league_invite'); // always clear, whether member or not
              }

              if (toAdd.length > 0) {
                  const newLeagues = [...existing, ...toAdd];
                  await supabase.from('profiles').update({ leagues: newLeagues } as any).eq('email', user.email);
                  setUser({ ...user, leagues: newLeagues });
                  addToast('success', t.leagueJoined, toAdd.map(s => LEAGUES[s] || s).join(', '));
                  // Apply the league's configured default language
                  const invitedSlug = toAdd[0];
                  const defaultLang = leagueLangs[invitedSlug];
                  if (defaultLang) setLanguage(defaultLang);
              }
          }
      };
      checkPendingLeague();
  }, [user, leagueLangs]);

  // Auto-activate admin mode when user has is_admin flag in DB
  useEffect(() => {
    if (user?.isAdmin && !isAdminMode) setIsAdminMode(true);
  }, [user?.isAdmin]);

  // Show admin banner 2s after login when there are unassigned users
  useEffect(() => {
    if (!isAdminMode) return;
    const unassigned = Object.values(usersDb).filter(u => !(u as UserProfile).leagues?.length).length;
    if (unassigned === 0) return;
    const t = setTimeout(() => setShowAdminBanner(true), 2000);
    return () => clearTimeout(t);
  }, [isAdminMode, usersDb]);


  const groupStageMatches = useMemo(() => matches.filter(m => m.groupId), [matches]);
  const userGroupPredictionsCount = useMemo(() => user ? allPredictions.filter(p => p.userId === user.email && groupStageMatches.some(gm => gm.id === p.matchId)).length : 0, [allPredictions, user, groupStageMatches]);
  const isGroupStageComplete = userGroupPredictionsCount === groupStageMatches.length && groupStageMatches.length > 0;

  const knockoutMatches = useMemo(() => matches.filter(m => m.round), [matches]);
  const userKnockoutPredictionsCount = useMemo(
      () => user ? allPredictions.filter(p => p.userId === user.email && knockoutMatches.some(km => km.id === p.matchId)).length : 0,
      [allPredictions, user, knockoutMatches]
  );
  
  // Real-world (not per-user prediction-completeness) gate: the Knockout Bracket unlocks once
  // every League Phase match has actually finished, same for all players.
  const isLeaguePhaseComplete = useMemo(() => {
      const leagueMatches = matches.filter(m => !m.round);
      if (leagueMatches.length === 0) return false;
      const DONE_STATUSES = ['FT', 'AET', 'PEN', 'FINISHED'];
      return leagueMatches.every(m => DONE_STATUSES.includes(m.status));
  }, [matches]);

  // --- NAVIGATION ---
  const ROUND_ORDER: Round[] = ['PO', 'R16', 'QF', 'SF', 'FIN'];
  const SC_ROUND_ORDER: Round[] = ['PO', 'R16', 'QF', 'SF', 'FIN'];
  const isScUser = user?.secondChanceStatus === 'PENDING' || user?.secondChanceStatus === 'ACTIVE';
  const handlePrevRound = () => {
    const order = isScUser ? SC_ROUND_ORDER : ROUND_ORDER;
    const idx = order.indexOf(activeKnockoutRound);
    if (idx > 0) { setActiveKnockoutRound(order[idx - 1]); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else setActiveTab('groups');
  };
  const handleNextRound = () => {
    const order = isScUser ? SC_ROUND_ORDER : ROUND_ORDER;
    const idx = order.indexOf(activeKnockoutRound);
    if (idx < order.length - 1) { setActiveKnockoutRound(order[idx + 1]); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else setActiveTab('leaderboard');
  };

  // Always the same tabs — predicting, live tracking, and standings all coexist
  // throughout the season instead of the app switching to a different nav set
  // once the first match kicks off.
  const navTabs = useMemo(() => ['groups', 'knockout', 'tournament', 'leaderboard', 'manager', 'analysis', 'rules'], []);

  const handleNextTab = useCallback(() => {
      const idx = navTabs.indexOf(activeTab);
      if (idx < navTabs.length - 1) { setActiveTab(navTabs[idx + 1] as typeof activeTab); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }, [navTabs, activeTab]);

  const handlePrevTab = useCallback(() => {
      const idx = navTabs.indexOf(activeTab);
      if (idx > 0) { setActiveTab(navTabs[idx - 1] as typeof activeTab); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }, [navTabs, activeTab]);

  const handleNextTournamentSub = useCallback(() => {
      const subs = ['schedule', 'tables', 'bracket'] as const;
      const idx = subs.indexOf(tournamentSubTab);
      if (idx < subs.length - 1) setTournamentSubTab(subs[idx + 1]);
      else handleNextTab();
  }, [tournamentSubTab, handleNextTab]);

  const handlePrevTournamentSub = useCallback(() => {
      const subs = ['schedule', 'tables', 'bracket'] as const;
      const idx = subs.indexOf(tournamentSubTab);
      if (idx > 0) setTournamentSubTab(subs[idx - 1]);
      else handlePrevTab();
  }, [tournamentSubTab, handlePrevTab]);

  const swipeHandlers = useSwipe({
      onSwipeLeft:  activeTab === 'tournament' ? handleNextTournamentSub : handleNextTab,
      onSwipeRight: activeTab === 'tournament' ? handlePrevTournamentSub : handlePrevTab,
  });

  // Record the moment group stage is fully predicted (once, never overwrites)
  useEffect(() => {
      if (!user || !isGroupStageComplete) return;
      const timeKey = STORAGE_KEYS.KNOCKOUT_COMPLETION_TIME_PREFIX + user.email;
      if (!localStorage.getItem(timeKey)) {
          localStorage.setItem(timeKey, Date.now().toString());
      }
  }, [isGroupStageComplete, user]);

  // Show knockout reminder immediately on completion, then re-show if 24h pass with no bracket entry
  useEffect(() => {
      if (!user || !isGroupStageComplete || userKnockoutPredictionsCount > 0) return;
      const lastShownKey = STORAGE_KEYS.KNOCKOUT_REMINDER_LAST_SHOWN_PREFIX + user.email;
      const completionTimeKey = STORAGE_KEYS.KNOCKOUT_COMPLETION_TIME_PREFIX + user.email;
      const lastShown = parseInt(localStorage.getItem(lastShownKey) || '0');
      const completionTime = parseInt(localStorage.getItem(completionTimeKey) || Date.now().toString());
      const now = Date.now();
      const H24 = 24 * 60 * 60 * 1000;
      const neverShown = lastShown === 0;
      const remindAgain = (now - completionTime >= H24) && (now - lastShown >= H24);
      if (neverShown || remindAgain) setShowKnockoutReminder(true);
  }, [isGroupStageComplete, userKnockoutPredictionsCount, user, tournamentPhase]);

  const isFinalOver = useMemo(() => {
      const FINISHED_STATUSES = new Set(['FINISHED', 'FT', 'AET', 'PEN']);
      const fin = matches.find(m => m.id === 'FIN_1');
      return !!fin && FINISHED_STATUSES.has(fin.status ?? '') && fin.homeScore !== null && fin.awayScore !== null;
  }, [matches]);

  const finalRecap = useMemo(() => {
      if (!isFinalOver || !user) return null;
      const leagueMates = (Object.values(usersDb) as UserProfile[]).filter(
          u => !user.leagues?.length || u.leagues?.some(l => user.leagues!.includes(l))
      );
      const { rank, totalPlayers, score } = computeFinalRank(user.email, leagueMates, matches, allPredictions, teamsData);

      const fin = matches.find(m => m.id === 'FIN_1');
      const championId = fin && fin.homeScore !== null && fin.awayScore !== null
          ? (fin.homeScore > fin.awayScore ? fin.homeTeamId : fin.awayScore > fin.homeScore ? fin.awayTeamId : null)
          : null;
      const championTeam = championId ? teamsData[championId] : undefined;

      return {
          rank, totalPlayers, totalPoints: score.totalPoints,
          championName: championTeam?.name ?? '',
          championFlag: championTeam?.flag ?? '',
      };
  }, [isFinalOver, user, usersDb, matches, allPredictions, teamsData]);

  // Show the final recap once per app load/session — it's the tournament closing
  // screen, so it's meant to greet every login rather than be dismissed forever.
  // The ref (not localStorage) just stops it re-firing mid-session if finalRecap
  // recomputes (e.g. a live data refresh) while the modal is already showing.
  const finalRecapShownThisSessionRef = useRef(false);
  useEffect(() => {
      if (!user || !finalRecap || finalRecapShownThisSessionRef.current) return;
      finalRecapShownThisSessionRef.current = true;
      setShowFinalRecapModal(true);
  }, [finalRecap, user]);

  const handleFinalRecapDismiss = () => {
      setShowFinalRecapModal(false);
  };

  // LiveTicker only ever surfaces matches that are actually in progress, so a
  // ticker click always means "show me this live match" — no phase branching needed.
  const handleTickerMatchClick = (match: Match) => {
    setActiveTab('tournament');
    setTournamentSubTab('schedule');
    setScheduleJumpMatchId(match.id);
  };

  const handleKnockoutReminderDismiss = (goToKnockouts: boolean) => {
      if (user) localStorage.setItem(STORAGE_KEYS.KNOCKOUT_REMINDER_LAST_SHOWN_PREFIX + user.email, Date.now().toString());
      setShowKnockoutReminder(false);
      if (goToKnockouts) setActiveTab('knockout');
  };

  // Second Chance timed reminders — 24h before group stage ends, 12h before first knockout.
  // Never fires once any knockout match has actually started.
  useEffect(() => {
      if (!user || user.secondChanceStatus !== 'NONE' || user.hasTakenSecondChance) return;
      const now = Date.now();
      const KO_LIVE_STATUSES = ['LIVE', 'FT', 'AET', 'PEN', 'FINISHED', '1H', '2H', 'HT', 'ET', 'P', 'BT'];
      const knockoutStarted = matches.some(m => m.round === 'R32' && KO_LIVE_STATUSES.includes(m.status));
      if (knockoutStarted) return;

      // Knockout reminder takes priority if its window has opened
      if (knockoutStartTime > 0 && now >= knockoutStartTime - 12 * 60 * 60 * 1000 && now < knockoutStartTime) {
          const seen = localStorage.getItem(STORAGE_KEYS.SC_REMINDER_KNOCKOUT_PREFIX + user.email);
          if (!seen) { setScReminderType('knockout'); setShowSCReminder(true); return; }
      }

      // Group stage reminder — 24h before group stage ends
      if (groupStageEndTime > 0 && now >= groupStageEndTime - 24 * 60 * 60 * 1000 && now < groupStageEndTime) {
          const seen = localStorage.getItem(STORAGE_KEYS.SC_REMINDER_GROUP_PREFIX + user.email);
          if (!seen) { setScReminderType('group'); setShowSCReminder(true); }
      }
  }, [user, groupStageEndTime, knockoutStartTime, matches]);

  const handleSCReminderDismiss = (goToManager: boolean) => {
      if (user) {
          const key = scReminderType === 'knockout'
              ? STORAGE_KEYS.SC_REMINDER_KNOCKOUT_PREFIX
              : STORAGE_KEYS.SC_REMINDER_GROUP_PREFIX;
          localStorage.setItem(key + user.email, '1');
      }
      setShowSCReminder(false);
      if (goToManager) setActiveTab('manager');
  };

  // --- GOAL BANNER ---
  // Uses createdAt freshness (3 min) to prevent stale events from notifying on reload.
  // Queue-based so rapid goals all show rather than dropping all but the first.
  useEffect(() => {
    const STALE_MS = 3 * 60 * 1000;
    const now = Date.now();

    const fresh = matchEvents.filter(e => {
      if (seenEventIdsRef.current.has(e.id)) return false;
      seenEventIdsRef.current.add(e.id);
      const isGoal = e.type === 'Goal';
      const isVarCancel = e.type === 'Var' && e.detail === 'Goal Disallowed';
      if (!isGoal && !isVarCancel) return false;
      if (!e.createdAt) return false;
      return (now - new Date(e.createdAt).getTime()) < STALE_MS;
    });

    if (!fresh.length) return;

    const banners: GoalNotification[] = fresh.flatMap(e => {
      const match = matches.find(m => m.id === e.matchId);
      if (!match || match.homeScore === null || match.awayScore === null) return [];
      const homeRow = matchLineups.find(l => l.matchId === match.id && l.teamId === match.homeTeamId && l.kitBg);
      const awayRow = matchLineups.find(l => l.matchId === match.id && l.teamId === match.awayTeamId && l.kitBg);
      return [{
        eventId: e.id,
        matchId: match.id,
        eventType: e.type as 'Goal' | 'Var',
        teamId: e.teamId || '',
        player: e.player,
        playerId: e.playerId,
        detail: e.detail,
        minute: e.minute,
        minuteExtra: e.minuteExtra,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        homeKitBg:   homeRow?.kitBg   ?? null,
        homeKitText: homeRow?.kitText ?? null,
        awayKitBg:   awayRow?.kitBg   ?? null,
        awayKitText: awayRow?.kitText ?? null,
      }];
    });

    if (banners.length) setGoalQueue(prev => [...prev, ...banners]);
  }, [matchEvents, matchLineups]);

  // --- PSO NOTIFICATION ---
  // Fires once when a match transitions from any non-P status to 'P'.
  // On initial load, silently seeds the status map without firing.
  useEffect(() => {
    if (!psoInitializedRef.current) {
      matches.forEach(m => prevMatchStatusRef.current.set(m.id, m.status));
      psoInitializedRef.current = true;
      return;
    }
    const newPso: PsoNotification[] = [];
    matches.forEach(m => {
      const prev = prevMatchStatusRef.current.get(m.id);
      if (prev !== undefined && prev !== 'P' && m.status === 'P') {
        newPso.push({
          id: `pso_${m.id}_${Date.now()}`,
          matchId: m.id,
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          homeScore: m.homeScore ?? 0,
          awayScore: m.awayScore ?? 0,
        });
      }
      prevMatchStatusRef.current.set(m.id, m.status);
    });
    if (newPso.length) setPsoQueue(prev => [...prev, ...newPso]);
  }, [matches]);

  // --- KIT NOTIFICATION ---
  // Fires when lineups arrive with kit colors for a live/upcoming match.
  // On first run: silently marks all already-loaded matches as seen.
  // On subsequent runs: only fires for genuinely new lineup arrivals.
  useEffect(() => {
    const LIVE_STATUSES = new Set(['NS', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE']);
    const byMatch = new Map<string, typeof matchLineups>();
    matchLineups.forEach(l => {
      if (!byMatch.has(l.matchId)) byMatch.set(l.matchId, []);
      byMatch.get(l.matchId)!.push(l);
    });

    const newKits: KitNotification[] = [];
    byMatch.forEach((lineups, matchId) => {
      if (kitNotifiedMatchesRef.current.has(matchId)) return;
      const match = matches.find(m => m.id === matchId);
      if (!match) return;
      const homeRow = lineups.find(l => l.teamId === match.homeTeamId && l.kitBg);
      const awayRow = lineups.find(l => l.teamId === match.awayTeamId && l.kitBg);
      kitNotifiedMatchesRef.current.add(matchId);
      if (!homeRow?.kitBg || !awayRow?.kitBg) return;
      if (!kitInitializedRef.current) return; // suppress on initial page load
      if (!LIVE_STATUSES.has(match.status ?? '')) return;
      newKits.push({
        id: `kit_${matchId}_${Date.now()}`,
        matchId,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeKitBg: homeRow.kitBg!,
        homeKitText: homeRow.kitText ?? '#FFFFFF',
        awayKitBg: awayRow.kitBg!,
        awayKitText: awayRow.kitText ?? '#FFFFFF',
      });
    });

    kitInitializedRef.current = true;
    if (newKits.length) setKitQueue(prev => [...prev, ...newKits]);
  }, [matchLineups, matches]);

  const rivalsList = useMemo(() => (Object.values(usersDb) as UserProfile[]).filter(u => u.email !== user?.email), [usersDb, user]);
  const leagueRivalsList = useMemo(() => {
    const userLeagues = user?.leagues ?? [];
    if (userLeagues.length === 0) return rivalsList;
    return rivalsList.filter(u => u.leagues?.some(l => userLeagues.includes(l)));
  }, [rivalsList, user?.leagues]);

  // Scoped to the round the user is currently viewing, not the whole season —
  // there's no single "everyone predicts everything now" moment to nag about.
  const missingGroupPredictions = useMemo(() => {
    if (!user) return 0;
    const roundMatchIds = matches.filter(m => !m.round && m.matchday === activeMatchday).map(m => m.id);
    const userPredMatchIds = new Set(allPredictions.filter(p => p.userId === user.email).map(p => p.matchId));
    return roundMatchIds.filter(id => !userPredMatchIds.has(id)).length;
  }, [user?.email, matches, allPredictions, activeMatchday]);

  // --- DAILY BRIEF: Pre-generate on login, cache per user per day ---
  const runBriefGeneration = async () => {
      if (!user || !matches.length || !Object.keys(teamsData).length || !allPredictions) return;
      const cacheKey = `rasten_brief_${user.email}_${tournamentPhase}_${new Date().toISOString().slice(0, 10)}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setDailyBrief(cached); return; }
      setBriefRefreshing(true);
      try {
          const allUsers = [user, ...leagueRivalsList];
          const finishedMatches = matches.filter(m =>
              ['FINISHED', 'FT', 'AET', 'PEN'].includes(m.status) &&
              m.homeScore !== null && m.awayScore !== null
          );
          const stats = allUsers.map(u => {
              const userPreds = allPredictions.filter(p => p.userId === u.email);
              const matchPts = finishedMatches.reduce((sum, m) => {
                  const pred = userPreds.find(p => p.matchId === m.id);
                  if (!pred) return sum;
                  return sum + calculatePoints(pred.home, pred.away, m.homeScore!, m.awayScore!, !!u.hasTakenSecondChance, m.round);
              }, 0);
              const bracketPts = getQualifiedRoundsSwiss(matches, userPreds, u, teamsData)
                  .reduce((sum, r) => sum + r.totalPoints, 0);
              return { user: u, score: matchPts + bracketPts, rank: 0, diff: 0 };
          }).sort((a, b) => b.score - a.score).map((s, i) => ({ ...s, rank: i + 1 }));
          const upcoming = matches
              .filter(m => (m.status === 'UPCOMING' || m.status === 'NS') && m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD')
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 3);
          const brief = await generateDailyBrief(user, stats, upcoming, allPredictions, teamsData, language, supabase);
          localStorage.setItem(cacheKey, brief);
          setDailyBrief(brief);
      } catch (e) {
          console.warn('[DailyBrief] Generation failed', e);
          setDailyBrief(''); // empty string → widget shows error state instead of infinite loading
      } finally {
          setBriefRefreshing(false);
      }
  };

  useEffect(() => {
      if (user && matches.length > 0 && Object.keys(teamsData).length > 0) {
          runBriefGeneration();
      }
  }, [user?.email, matches.length, Object.keys(teamsData).length]);
  const leagueStandings = useMemo(() => calculateLeagueStandings(userMatches, teamsData), [userMatches, teamsData]);
  const leagueMatchesList = userMatches.filter(m => !m.round);
  const currentMatchdayMatches = leagueMatchesList.filter(m => m.matchday === activeMatchday);
  // Group the matchday's fixtures by kickoff day (Tue 8 Sept / Wed 9 Sept / ...) for the
  // day-grouped compact list — mirrors how broadcasters lay out a round's results.
  const currentMatchdayByDay = useMemo(() => {
      const groups: { day: string; matches: typeof currentMatchdayMatches }[] = [];
      const indexByDay: Record<string, number> = {};
      currentMatchdayMatches.forEach(m => {
          const day = (m.date && m.date !== 'TBD' && !isNaN(new Date(m.date).getTime()))
              ? new Date(m.date).toLocaleDateString(currentLocale || 'en-US', { weekday: 'short', day: 'numeric', month: 'long' }).toUpperCase()
              : 'DATE TBD';
          if (indexByDay[day] === undefined) {
              indexByDay[day] = groups.length;
              groups.push({ day, matches: [] });
          }
          groups[indexByDay[day]].matches.push(m);
      });
      return groups;
  }, [currentMatchdayMatches, currentLocale]);

  const showClearTrash = useMemo(() => {
    if (!user) return false;
    if (activeTab === 'groups') return allPredictions.some(p => p.userId === user.email);
    if (activeTab === 'knockout') return allPredictions.some(p => p.userId === user.email && matches.some(m => m.id === p.matchId && m.round));
    return false;
  }, [activeTab, allPredictions, user, matches]);

  const handleClearPredictions = useCallback(async () => {
    if (!user || !supabase) return; 
    const query = supabase.from('predictions').delete().eq('user_id', user.email);
    if (activeTab === 'groups') {
       const groupIds = matches.filter(m => m.groupId).map(m => m.id);
       if (groupIds.length > 0) {
           setAllPredictions(prev => prev.filter(p => p.userId !== user.email || !groupIds.includes(p.matchId)));
           await query.in('match_id', groupIds);
       }
    } else if (activeTab === 'knockout') {
       const knockoutIds = matches.filter(m => m.round).map(m => m.id);
       if (knockoutIds.length > 0) {
           setAllPredictions(prev => prev.filter(p => p.userId !== user.email || !knockoutIds.includes(p.matchId)));
           await query.in('match_id', knockoutIds);
       }
    } else {
        setAllPredictions(prev => prev.filter(p => p.userId !== user.email));
        await query;
    }
    addToast('info', t.predictionsCleared, t.predictionsClearedMsg);
  }, [user, activeTab, matches]);

  // Auto-fill is relevant wherever there are picks left to make — groups or knockout —
  // regardless of whether some other match elsewhere in the season has already kicked off.
  const showMagicWand = activeTab === 'groups' || activeTab === 'knockout';

  const getSimMode = (): 'knockout' | 'groups' => {
      if (activeTab === 'knockout') return 'knockout';
      if (activeTab === 'tournament' && tournamentSubTab === 'bracket') return 'knockout';
      return 'groups';
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><div className="flex flex-col items-center gap-4"><RefreshCw className="animate-spin text-cyan-400" size={32} /><div className="text-xs font-black uppercase tracking-widest opacity-60">Initializing...</div></div></div>;


  if (!user || !session) {
      const usedAvatarUrls = Object.values(usersDb).map(u => u.avatar);
      const getAvailable = (all: string[]) => {
          const unused = all.filter(url => !usedAvatarUrls.includes(url));
          return unused.length > 0 ? unused : all;
      };
      return <LoginScreen onSuccess={() => supabase.auth.getSession().then(({ data }) => { if (data.session?.user?.email) window.location.reload(); })} currentLang={language} setLang={(l) => setLanguage(l)} isLoading={loading} onLogin={async () => {}} menPresets={getAvailable(menPresets).slice(0,5)} womenPresets={getAvailable(womenPresets).slice(0,5)} />;
  }

  const unassignedCount = isAdminMode
    ? Object.values(usersDb).filter(u => !(u as UserProfile).leagues?.length).length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060c1a] via-slate-950 to-slate-950 text-white pb-44 md:pb-12 relative isolate">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-[70vw] h-[70vw] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-1/4 w-[60vw] h-[60vw] bg-fuchsia-600/10 rounded-full blur-[120px]" />
      </div>
      <StarField density={50} variant="subtle" position="fixed" className="-z-10" />
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <AppHeader
        user={user} language={language} setLanguage={handleLanguageSwitch} tournamentPhase={tournamentPhase} setTournamentPhase={setTournamentPhase}
        activeTab={activeTab} setActiveTab={setActiveTab}
        isProfileMenuOpen={isProfileMenuOpen} setIsProfileMenuOpen={setIsProfileMenuOpen}
        setShowAvatarEditor={setShowAvatarEditor} setIsDebugOpen={setIsDebugOpen} setShowAdminLogin={setShowAdminLogin}
        handleLogout={handleLogout}
        showSecondChanceBadge={false}
        isAdminMode={isAdminMode}
        unassignedCount={unassignedCount}
        onInstallApp={installAction ?? undefined}
        onLinkCopied={() => addToast('success', 'Link copied!', 'Paste it anywhere to invite someone.')}
        navTabs={navTabs} t={t} matches={matches} teamsData={teamsData} allPredictions={allPredictions}
        activeKnockoutRound={activeKnockoutRound} setActiveKnockoutRound={setActiveKnockoutRound}
      />
      <InstallPrompt isLoggedIn={!!user} onRegisterTrigger={setInstallAction} />

      {/* Admin: unassigned players banner */}
      {showAdminBanner && unassignedCount > 0 && (
        <div className="fixed bottom-16 inset-x-0 z-[44] px-3 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-blue-950/80 backdrop-blur-md border border-red-500/30 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
            <div className="bg-red-500/15 border border-red-500/30 p-2 rounded-xl shrink-0">
              <span className="text-red-400 font-black text-sm">{unassignedCount}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-black uppercase tracking-tight leading-tight">
                {unassignedCount === 1 ? '1 player needs a league' : `${unassignedCount} players need a league`}
              </p>
              <p className="text-slate-400 text-[10px] leading-snug">Assign them in the management panel</p>
            </div>
            <button
              onClick={() => { setIsDebugOpen(true); setShowAdminBanner(false); }}
              className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 active:scale-95 transition-transform"
            >
              Manage
            </button>
            <button onClick={() => setShowAdminBanner(false)} className="text-slate-500 hover:text-white shrink-0 transition-colors p-1">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <main {...swipeHandlers} className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6 touch-pan-y">
        {user && missingGroupPredictions > 0 && (
          <PredictionNudge
            missingCount={missingGroupPredictions}
            userEmail={user.email}
            onGoToPredictions={() => setActiveTab('groups')}
            lang={t}
            scopeKey={activeMatchday}
          />
        )}

        {/* SC extended window banner — show once to non-SC users once groups end */}
        {user && user.secondChanceStatus === 'NONE' && !scAnnouncementDismissed && groupStageEndTime > 0 && Date.now() >= groupStageEndTime && Date.now() < knockoutStartTime && (
          <div className="mb-4 flex items-center gap-3 bg-indigo-900/90 border border-indigo-500/40 rounded-2xl px-4 py-3 shadow-sm">
            <Shield size={18} className="text-indigo-300 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-black uppercase tracking-tight leading-tight">Second Chance window open!</p>
              <p className="text-indigo-300 text-[11px] leading-snug">The bracket has been updated — you can still join and pick your knockout bracket.</p>
            </div>
            <button
              onClick={() => { setActiveTab('knockout'); setScAnnouncementDismissed(true); localStorage.setItem('rc_sc_announcement_v1', '1'); }}
              className="bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shrink-0 transition-colors active:scale-95"
            >
              View →
            </button>
            <button onClick={() => { setScAnnouncementDismissed(true); localStorage.setItem('rc_sc_announcement_v1', '1'); }} className="text-indigo-500 hover:text-white transition-colors shrink-0 p-1">
              <X size={14} />
            </button>
          </div>
        )}

        {activeTab === 'analysis' && <AnalysisDashboard currentUser={user} rivals={leagueRivalsList} matches={matches} allPredictions={allPredictions} teams={teamsData} lang={t} currentLang={language} onTeamClick={(id) => setViewingTeamId(id)} />}
        {activeTab === 'rules' && <RulesPage lang={t} matches={matches} currentLocale={currentLocale} tournamentPhase={tournamentPhase} onAdminTrigger={() => setShowAdminLogin(true)} />}
        
        {/* TOURNAMENT HUB */}
        {activeTab === 'tournament' && (
            <div className="flex flex-col h-full animate-fade-in">
                <div className="flex justify-center mb-6">
                   <div className="bg-slate-900/60 p-1 rounded-xl flex gap-1 shadow-inner border border-white/10">
                      {(['schedule', 'tables', 'bracket'] as const).map(sub => (
                         <button key={sub} id={`tour-subnav-${sub}`} onClick={() => setTournamentSubTab(sub)} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${tournamentSubTab === sub ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                            {sub === 'schedule' && <CalendarDays size={14} />}{sub === 'tables' && <ListOrdered size={14} />}{sub === 'bracket' && <GitMerge size={14} />}{sub === 'schedule' ? t.subnavSchedule : sub === 'tables' ? t.subnavTables : t.subnavBracket}
                         </button>
                      ))}
                   </div>
                </div>
                {tournamentSubTab === 'schedule' && <TournamentSchedule matches={matches} teams={teamsData} userPredictions={allPredictions.filter(p => p.userId === user?.email)} user={user} lang={t} currentLang={language} onTeamClick={(id) => setViewingTeamId(id)} onJumpToTable={handleJumpToTable} onJumpToBracket={handleJumpToBracket} jumpToMatchId={scheduleJumpMatchId} matchEvents={matchEvents} matchLineups={matchLineups} matchStats={matchStats} playerMatchStats={playerMatchStats} onSubstitute={handleSubstitute} onUpdate={handleScoreUpdate} onPlayerClick={(playerId, playerName, teamId) => setPlayerModal({ playerId, playerName, teamId })} onStadiumClick={v => setStadiumVenue(v)} predictedKnockoutWinners={predictedKnockoutWinners} />}
                {tournamentSubTab === 'tables' && (
                    <div className="pb-20 max-w-3xl mx-auto">
                        <div className="bg-blue-950/40 backdrop-blur-md rounded-xl shadow-md border border-white/15 overflow-hidden">
                            <div className="bg-cyan-600 p-3 text-white flex justify-between items-center"><h3 className="font-black uppercase tracking-widest text-sm">{t.groups || 'League Phase'}</h3></div>
                            <StandingsTable standings={calculateLeagueStandings(matches, teamsData)} teams={teamsData} lang={t} onTeamClick={(id) => setViewingTeamId(id)} highlightedTeamId={highlightedTeamId} />
                        </div>
                    </div>
                )}
                {tournamentSubTab === 'bracket' && <KnockoutTreeView matches={matches} teams={teamsData} userPredictions={liveResultsAsPredictions} onUpdate={() => {}} lang={t} highlightedMatchId={highlightedMatchId} />}
            </div>
        )}

        {/* LEAGUE PHASE TAB — round-centric: default view is "this matchday", not the whole season at once.
            The matchday itself is the headline; standings/table are supplementary and sit below the games. */}
        {activeTab === 'groups' && (
            <div className="animate-fade-in">
                <div className="flex items-end justify-between mb-4 px-1 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="w-1.5 h-8 rounded-full bg-gradient-to-b from-cyan-400 to-fuchsia-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></span>
                        <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-white leading-none">Matchday {activeMatchday}</h1>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 bg-white/10 border border-white/10 rounded-full px-2.5 py-1">{currentMatchdayMatches.length} {currentMatchdayMatches.length === 1 ? 'match' : 'matches'}</span>
                </div>
                {currentMatchdayMatches.length === 0 && (
                    <div className="rounded-xl border border-white/15 bg-blue-950/40 backdrop-blur-md shadow-sm py-16 text-center mb-6">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No fixtures for this matchday yet</p>
                    </div>
                )}
                <div className="space-y-4">
                    {currentMatchdayByDay.map(({ day, matches: dayMatches }) => (
                        <div key={day} className="rounded-xl border border-white/10 bg-blue-950/40 backdrop-blur-md overflow-hidden shadow-sm">
                            <div className="px-3 py-1.5 bg-white/5 border-b border-white/10">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{day}</span>
                            </div>
                            <div>
                                {dayMatches.map(match => (
                                    <MatchRow
                                      key={match.id}
                                      match={match}
                                      homeTeam={teamsData[match.homeTeamId]}
                                      awayTeam={teamsData[match.awayTeamId]}
                                      onUpdate={handleScoreUpdate}
                                      lang={t}
                                      locale={currentLocale}
                                      userTokens={user?.tokens || 0}
                                      rivals={rivalsList}
                                      onSpy={handleSpy}
                                      currentUser={user}
                                      allPredictions={allPredictions}
                                      isAdminMode={isAdminMode}
                                      onTeamClick={(id) => setViewingTeamId(id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6">
                    <StandingsStrip standings={leagueStandings} teams={teamsData} lang={t} onTeamClick={(id) => setViewingTeamId(id)} />
                </div>
                <div className="mt-2 flex flex-col items-center gap-4">
                    <div className="flex gap-3 w-full max-w-lg">
                        <button
                          onClick={() => setActiveMatchday(md => Math.max(1, md - 1))}
                          disabled={activeMatchday <= 1}
                          className="flex-1 px-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-slate-200 font-black uppercase tracking-widest hover:bg-white/15 hover:text-white transition-all flex items-center justify-center gap-2 group disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /><span>MD {activeMatchday - 1}</span>
                        </button>
                        <button
                          onClick={() => setActiveMatchday(md => Math.min(8, md + 1))}
                          disabled={activeMatchday >= 8}
                          className="flex-[2] px-6 py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-2xl shadow-lg shadow-cyan-900/40 font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <span>Matchday {activeMatchday + 1}</span><ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <button onClick={() => setActiveTab('knockout')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                        <GitMerge size={12} /> {t.bracketBtn}
                    </button>
                </div>
            </div>
        )}

        {/* KNOCKOUT TAB - WITH SECOND CHANCE OVERRIDE */}
        {activeTab === 'knockout' && (
            <div className="flex flex-col h-full animate-fade-in">
                {(user?.secondChanceStatus === 'PENDING' || user?.secondChanceStatus === 'ACTIVE') ? (
                    <SecondChanceView
                        matches={userBracket} teams={teamsData} onUpdate={handleScoreUpdate} lang={t} user={user}
                        onPledge={handlePledgeSecondChance} onLockIn={handleLockInSecondChance} rivals={rivalsList}
                        allPredictions={user?.secondChanceStatus === 'PENDING'
                            ? [
                                ...allPredictions.filter(p => p.userId !== user.email || !!matches.find(m => m.id === p.matchId && !!m.groupId)),
                                ...Object.entries(user.scDraft || {}).map(([matchId, { home, away }]) => ({ userId: user.email, matchId, home, away })),
                              ]
                            : allPredictions
                        } phase={tournamentPhase} onTeamClick={setViewingTeamId}
                        onSpy={handleSpy} revealedRivals={user?.spiedMatches || []} groupStageEndTime={groupStageEndTime} knockoutStartTime={knockoutStartTime}
                        activeRound={activeKnockoutRound} onRoundChange={setActiveKnockoutRound}
                        onEdit={handleEditSecondChance}
                    />
                ) : (
                    <KnockoutBracket
                        matches={userBracket} teams={teamsData} onUpdate={handleScoreUpdate} lang={t} user={user}
                        onSecondChance={handlePledgeSecondChance} rivals={rivalsList} allPredictions={allPredictions} phase={tournamentPhase}
                        isLeaguePhaseComplete={isLeaguePhaseComplete}
                        onTeamClick={setViewingTeamId} onSpy={handleSpy} revealedRivals={user?.spiedMatches || []} activeRound={activeKnockoutRound}
                        matchEvents={matchEvents}
                    />
                )}
                <div className="mt-8 flex justify-center pb-8">
                     <div className="flex gap-3 w-full max-w-lg">
                        <button onClick={handlePrevRound} className="flex-1 px-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm text-slate-200 font-black uppercase tracking-widest hover:bg-white/15 hover:text-white transition-all flex items-center justify-center gap-2 group"><ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /><span>{activeKnockoutRound === 'PO' ? (t.leaguePhase || t.groups) : t.prevRound}</span></button>
                        {activeKnockoutRound !== 'FIN' ? (
                            <button onClick={handleNextRound} className="flex-[2] px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl shadow-lg font-black uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"><span>{t.nextRound}</span><ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></button>
                        ) : user?.secondChanceStatus === 'PENDING' ? (
                            <button onClick={handleLockInSecondChance} className="flex-[2] px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-2xl shadow-lg font-black uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group animate-pulse"><span>{t.bracketLockedIn || 'Lock In Bracket'}</span><ChevronRight size={18} /></button>
                        ) : (
                            <button onClick={() => setActiveTab('leaderboard')} className="flex-[2] px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl shadow-lg font-black uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"><span>{t.leaderboard || 'Leaderboard'}</span><ChevronRight size={18} /></button>
                        )}
                     </div>
                </div>
            </div>
        )}
        
        {/* LEADERBOARD — always the real standings; there's no single moment where
            everyone has "finished predicting" and the board "goes live". */}
        {activeTab === 'leaderboard' && (
            <Leaderboard users={Object.values(usersDb)} matches={matches} allPredictions={allPredictions} lang={t} currentUserEmail={user?.email} currentUserLeagues={user?.leagues} teams={teamsData} onTeamClick={(id) => setViewingTeamId(id)} preloadedAnalysis={dailyBrief} onRefreshBrief={() => { const cacheKey = `rasten_brief_${user.email}_${new Date().toDateString()}`; localStorage.removeItem(cacheKey); runBriefGeneration(); }} briefRefreshing={briefRefreshing} currentLang={language} />
        )}
        
        {/* MANAGER TAB */}
        {activeTab === 'manager' && (
            <ManagerHub
                matches={matches}
                userMatches={userMatches}
                bracketMatches={standardBracket}
                teams={teamsData}
                allPredictions={allPredictions}
                currentUser={user}
                allUsers={Object.values(usersDb) as UserProfile[]}
                lang={t}
                onSubstitute={handleSubstitute}
                onUnlockSecondChance={handlePledgeSecondChance}
                onGoToKnockout={() => setActiveTab('knockout')}
                onEditSecondChance={handleEditSecondChance}
                onUpdate={handleScoreUpdate}
                phase={tournamentPhase}
                groupStageEndTime={groupStageEndTime}
                knockoutStartTime={knockoutStartTime}
                predictedR32Teams={predictedR32Teams}
            />
        )}
      </main>

      <LiveTicker
        matches={matches}
        teams={teamsData}
        onMatchClick={handleTickerMatchClick}
        phase={tournamentPhase}
        addToast={addToast}
      />

      <KnockoutReminderModal isOpen={showKnockoutReminder} onDismiss={handleKnockoutReminderDismiss} langCode={language} />
      {finalRecap && (
          <FinalRecapModal
              isOpen={showFinalRecapModal}
              onClose={handleFinalRecapDismiss}
              onViewLeaderboard={() => { handleFinalRecapDismiss(); setActiveTab('leaderboard'); }}
              langCode={language}
              userName={user?.name || ''}
              totalPoints={finalRecap.totalPoints}
              rank={finalRecap.rank}
              totalPlayers={finalRecap.totalPlayers}
              championName={finalRecap.championName}
              championFlag={finalRecap.championFlag}
          />
      )}
      <SecondChanceReminderModal isOpen={showSCReminder} type={scReminderType} pickedTeams={predictedKOTeamCount} r32Tracker={r32Tracker} onDismiss={handleSCReminderDismiss} langCode={language} />
      <GoalBanner
        notification={goalNotification}
        homeTeam={goalNotification ? teamsData[goalNotification.homeTeamId] : undefined}
        awayTeam={goalNotification ? teamsData[goalNotification.awayTeamId] : undefined}
        scoringTeam={goalNotification ? teamsData[goalNotification.teamId] : undefined}
        onDismiss={() => setGoalQueue(prev => prev.slice(1))}
        onNavigate={goalNotification ? () => {
          const m = matches.find(m => m.id === goalNotification.matchId);
          if (m) handleTickerMatchClick(m);
          setGoalQueue(prev => prev.slice(1));
        } : undefined}
        onPlayerClick={(playerId, playerName, teamId) => setPlayerModal({ playerId, playerName, teamId })}
        kitNotification={kitNotification}
        onKitDismiss={() => setKitQueue(prev => prev.slice(1))}
        onKitNavigate={kitNotification ? () => {
          const m = matches.find(m => m.id === kitNotification.matchId);
          if (m) handleTickerMatchClick(m);
          setKitQueue(prev => prev.slice(1));
        } : undefined}
        psoNotification={psoNotification}
        psohomeTeam={psoNotification ? teamsData[psoNotification.homeTeamId] : undefined}
        psoAwayTeam={psoNotification ? teamsData[psoNotification.awayTeamId] : undefined}
        onPsoDismiss={() => setPsoQueue(prev => prev.slice(1))}
        onPsoNavigate={psoNotification ? () => {
          const m = matches.find(m => m.id === psoNotification.matchId);
          if (m) handleTickerMatchClick(m);
          setPsoQueue(prev => prev.slice(1));
        } : undefined}
      />
      {playerModal && (
        <PlayerModal
          playerId={playerModal.playerId}
          playerName={playerModal.playerName}
          teamId={playerModal.teamId}
          matchEvents={matchEvents}
          matchLineups={matchLineups}
          playerMatchStats={playerModal.playerId != null ? playerMatchStats.filter(s => s.playerId === playerModal.playerId) : []}
          teams={teamsData}
          lang={t}
          onClose={() => setPlayerModal(null)}
        />
      )}
      {stadiumVenue && (
        <StadiumModal
          venue={stadiumVenue}
          lang={t}
          onClose={() => setStadiumVenue(null)}
        />
      )}

      {showAvatarEditor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setShowAvatarEditor(false)}></div>
            <div className="relative w-full max-w-md bg-blue-950/90 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-white uppercase tracking-tighter italic">{t.changeIdentity}</h3><button onClick={() => setShowAvatarEditor(false)} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10"><X size={20} /></button></div>
                {/* Name editor */}
                <div className="mb-5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.nameLabel}</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={pendingName}
                            onChange={e => { setPendingName(e.target.value); setNameError(null); }}
                            maxLength={30}
                            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                            onKeyDown={e => { if (e.key === 'Enter') saveNewName(); }}
                        />
                        <button
                            onClick={saveNewName}
                            disabled={nameSaving || !pendingName.trim()}
                            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                            {nameSaving ? <RefreshCw size={14} className="animate-spin" /> : t.saveBtn}
                        </button>
                    </div>
                    {nameError && <p className="text-[10px] text-red-400 mt-1.5 font-semibold">{nameError}</p>}
                </div>
                <div className="border-t border-white/10 pt-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t.selectAvatar}</p>
                    <AvatarGenerator onGenerate={updateAvatar} lang={t} menAvatars={menPresets} womenAvatars={womenPresets} currentAvatar={user.avatar} disableAutoAssign={true} />
                </div>
                <button onClick={() => setShowAvatarEditor(false)} className="w-full mt-6 py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors border-t border-white/5">{t.cancelBtn}</button>
            </div>
        </div>
      )}

      <DebugTools
        isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)}
        onRevealRealResults={handleRevealRealResults}
        onResetToFuture={handleResetToFuture}
        users={Object.values(usersDb) as UserProfile[]}
        onToggleAdmin={async (email, isAdmin) => {
          if (!supabase) return;
          await supabase.from('profiles').update({ is_admin: isAdmin } as any).eq('email', email);
          setUsersDb(prev => ({ ...prev, [email]: { ...prev[email], isAdmin } }));
          if (user?.email === email) setUser(prev => prev ? { ...prev, isAdmin } : null);
        }}
        onRenameUser={async (email, newName) => {
          if (!supabase) return;
          await supabase.from('profiles').update({ name: newName } as any).eq('email', email);
          setUsersDb(prev => ({ ...prev, [email]: { ...prev[email], name: newName } }));
          if (user?.email === email) setUser(prev => prev ? { ...prev, name: newName } : null);
        }}
        onDeleteUser={async (email) => {
          if (!supabase) return;
          await supabase.from('predictions').delete().eq('user_id', email);
          await supabase.from('profiles').delete().eq('email', email);
          setUsersDb(prev => { const next = { ...prev }; delete next[email]; return next; });
        }}
        onUpdateUserLeagues={async (email, leagues) => {
          if (!supabase) return;
          await supabase.from('profiles').update({ leagues } as any).eq('email', email);
          setUsersDb(prev => ({ ...prev, [email]: { ...prev[email], leagues } }));
          if (user?.email === email) setUser(prev => prev ? { ...prev, leagues } : null);
        }}
        onTestNotification={(type) => {
          const id = Date.now();
          if (type === 'kit') {
            setKitQueue(prev => [...prev, {
              id: `kit_test_${id}`,
              matchId: 'TEST',
              homeTeamId: 'RM',
              awayTeamId: 'BM',
              homeKitBg: '#FFFFFF',
              homeKitText: '#00529F',
              awayKitBg: '#DC052D',
              awayKitText: '#FFFFFF',
            }]);
          } else {
            setGoalQueue(prev => [...prev, {
              eventId: id,
              matchId: 'TEST',
              eventType: type === 'var' ? 'Var' : 'Goal',
              teamId: type === 'og' ? 'BM' : 'RM',
              player: type === 'var' ? 'J. Bellingham' : type === 'og' ? 'D. Upamecano' : type === 'pen' ? 'Vinícius Jr.' : 'K. Mbappé',
              playerId: type === 'var' ? 47281 : type === 'og' ? 19220 : type === 'pen' ? 47232 : 47189,
              detail: type === 'var' ? 'Goal Disallowed' : type === 'og' ? 'Own Goal' : type === 'pen' ? 'Penalty' : 'Normal Goal',
              minute: 67,
              minuteExtra: null,
              homeTeamId: 'RM',
              awayTeamId: 'BM',
              homeScore: type === 'og' ? 1 : 2,
              awayScore: 1,
              homeKitBg:   '#FFFFFF',
              homeKitText: '#00529F',
              awayKitBg:   '#DC052D',
              awayKitText: '#FFFFFF',
            }]);
          }
        }}
      />

      {/* Admin Password Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => { setShowAdminLogin(false); setAdminPasswordInput(''); setAdminPasswordError(false); }} />
          <div className="relative w-full max-w-xs bg-blue-950/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-cyan-600 px-5 py-4 flex items-center gap-3 text-white">
              <div className="bg-amber-500 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <div className="font-black uppercase tracking-widest text-sm">Admin Login</div>
                <div className="text-[10px] text-cyan-100">Enter admin password to continue</div>
              </div>
            </div>
            <form
              className="p-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (adminPasswordInput === 'RC2026') {
                  setIsAdminMode(true);
                  setShowAdminLogin(false);
                  setAdminPasswordInput('');
                  setAdminPasswordError(false);
                  addToast('success', 'Admin mode activated');
                } else {
                  setAdminPasswordError(true);
                  setAdminPasswordInput('');
                }
              }}
            >
              <input
                type="password"
                autoFocus
                placeholder="Password"
                value={adminPasswordInput}
                onChange={(e) => { setAdminPasswordInput(e.target.value); setAdminPasswordError(false); }}
                className={`w-full px-4 py-3 border rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 ${adminPasswordError ? 'border-red-400 ring-red-500/30 bg-red-500/10 text-red-300 placeholder-red-400/50' : 'border-white/10 ring-cyan-500/30 bg-black/20 text-white placeholder-slate-500'}`}
              />
              {adminPasswordError && (
                <p className="text-xs text-red-500 font-bold text-center">Incorrect password</p>
              )}
              <button type="submit" className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-colors">
                Activate Admin Mode
              </button>
            </form>
          </div>
        </div>
      )}
      {isHelpingHandOpen && user && (
        <HelpingHandModal 
            isOpen={isHelpingHandOpen} onClose={() => setIsHelpingHandOpen(false)} teams={Object.fromEntries(Object.entries(teamsData).filter(([id]) => matches.some(m => m.homeTeamId === id || m.awayTeamId === id)))} initialFavorites={user.favorites} mode={getSimMode()} lang={t}
            onGenerate={async (favs, scope, riskLevel) => {
                if (user && supabase) { await supabase.from('profiles').update({ favorites: favs } as any).eq('email', user.email); setUser({ ...user, favorites: favs }); }
                const safeScope = (getSimMode() === 'knockout') ? 'KNOCKOUT' : 'GROUPS';
                const simulatedMatches = simulateFullTournament(userMatches, teamsData, favs, safeScope, riskLevel);
                const relevantMatches = simulatedMatches.filter(m => { if (safeScope === 'GROUPS') return !m.round; if (safeScope === 'KNOCKOUT') return !!m.round; return true; });

                if (user && supabase) {
                    const predictionsToSave = relevantMatches.filter(m => m.homeScore !== null && m.awayScore !== null)
                        .map(m => ({ user_id: user.email, match_id: m.id, home: m.homeScore!, away: m.awayScore!, home_team_id: m.homeTeamId, away_team_id: m.awayTeamId }));
                    if (predictionsToSave.length > 0) {
                        const { error } = await supabase.from('predictions').upsert(predictionsToSave, { onConflict: 'user_id,match_id' });
                        if (!error) {
                            addToast('success', t.magicApplied, `${predictionsToSave.length} matches.`);
                            setAllPredictions(prev => {
                                const others = prev.filter(p => p.userId !== user.email);
                                const myOldPreds = prev.filter(p => p.userId === user.email && !predictionsToSave.some(newP => newP.match_id === p.matchId));
                                const myNewPreds = predictionsToSave.map(p => ({ userId: p.user_id, matchId: p.match_id, home: p.home, away: p.away, homeTeamId: p.home_team_id, awayTeamId: p.away_team_id }));
                                return [...others, ...myOldPreds, ...myNewPreds];
                            });
                        } else { addToast('error', t.saveFailed, t.saveFailedMsg); }
                    }
                }
                setIsHelpingHandOpen(false);
            }} 
        />
      )}

      {showMagicWand && <MagicWand onOpen={() => setIsHelpingHandOpen(true)} onClear={handleClearPredictions} showClear={showClearTrash} lang={t} />}
      {viewingTeamId && teamsData[viewingTeamId] && <TeamDetailsModal team={teamsData[viewingTeamId]} isOpen={true} onClose={() => setViewingTeamId(null)} lang={t} currentLang={language} />}


    </div>
  );
};

export default App;