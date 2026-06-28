import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, LayoutGrid, CalendarDays, ListOrdered, GitMerge, ChevronRight, ChevronLeft, X, Clock, Zap } from 'lucide-react';
import { GROUP_CONFIG, TRANSLATIONS, INTRO_VIDEOS, LEAGUES, LEAGUE_DEFAULT_LANGS, INITIAL_MATCHES } from './constants';
import { LanguageCode, UserProfile, Prediction, TournamentPhase, Round, Match } from './types';
import { 
  calculateGroupStandings,
  simulateFullTournament,
  applyPredictionsToBracket,
  simulateTournamentAtDate,
  getAllGroupStandings,
  getThirdPlaceStandings,
  updateBracket,
  calculatePoints,
} from './services/engine';
import { MatchCard } from './components/MatchCard';
import { StandingsTable } from './components/StandingsTable';
import { MagicWand } from './components/MagicWand';
import { HelpingHandModal } from './components/HelpingHandModal';
import { KnockoutBracket } from './components/KnockoutBracket';
import { KnockoutTreeView } from './components/KnockoutTreeView';
import { Leaderboard } from './components/Leaderboard';
import { ManagerHub } from './components/ManagerHub'; 
import { GroupStageSummary } from './components/GroupStageSummary';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { RulesPage } from './components/RulesPage';
import { PredictionNudge } from './components/PredictionNudge';
import { AvatarGenerator } from './components/AvatarGenerator';
import { InstallPrompt } from './components/InstallPrompt';
import { useSwipe } from './hooks/useSwipe';
import { supabase } from './supabase';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { DebugTools } from './components/DebugTools';
import { IntroVideoModal } from './components/IntroVideoModal';
import { TournamentSchedule } from './components/TournamentSchedule';
import { TeamDetailsModal } from './components/TeamDetailsModal';
import { useAppData, bustPredictionsCache } from './hooks/useAppData';
import { LoginScreen } from './components/LoginScreen';
import { AppHeader } from './components/AppHeader';
import { PlayerProgress } from './components/PlayerProgress'; 
import { TourGuide } from './components/TourGuide';
import { LiveSplashScreen } from './components/LiveSplashScreen';
import { PRE_SEASON_TOUR, LIVE_SEASON_TOUR } from './components/tourConfig';
import { generateDailyBrief } from './components/analysis/AIAnalystWidget';
import { SecondChanceView } from './components/SecondChanceView';
import { KnockoutReminderModal } from './components/KnockoutReminderModal';
import { SecondChanceReminderModal, SCReminderType } from './components/SecondChanceReminderModal';
import { GoalBanner, GoalNotification, KitNotification } from './components/GoalBanner';
import { PlayerModal } from './components/PlayerModal';
import { StadiumModal } from './components/StadiumModal';
import { LiveTicker } from './components/LiveTicker';

const STORAGE_KEYS = {
  CURRENT_USER: 'rasten_cup_active_user_v2',
  TOUR_COMPLETED_PREFIX: 'rasten_cup_tour_done_v1_',
  AUTO_FILLED_PREFIX: 'rasten_autofill_v1_',
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
  const [showOverview, setShowOverview] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>('A');
  const [activeKnockoutRound, setActiveKnockoutRound] = useState<Round>('R32'); 
  
  const [language, setLanguage] = useState<LanguageCode>('EN');
  const [leagueLangs, setLeagueLangs] = useState<Record<string, LanguageCode>>(LEAGUE_DEFAULT_LANGS);
  const [lateJoinerCutoff, setLateJoinerCutoff] = useState<string | null>(null);
  const [adminPhaseOverride, setAdminPhaseOverride] = useState<TournamentPhase | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isHelpingHandOpen, setIsHelpingHandOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [lateWindowCleared, setLateWindowCleared] = useState(false);
  const [lateWindowRemaining, setLateWindowRemaining] = useState(0);
  const [showAdminBanner, setShowAdminBanner] = useState(false);

  // Derived from match data — flips to LIVE the moment any group match leaves UPCOMING/NS.
  // Admin can override for testing only (requires admin mode to be active).
  const tournamentPhase = useMemo<TournamentPhase>(() => {
      if (isAdminMode && adminPhaseOverride !== null) return adminPhaseOverride;
      const anyGroupStarted = matches.some(
          m => m.groupId && !['UPCOMING', 'NS'].includes(m.status)
      );
      return (anyGroupStarted || lockTimePassed) ? 'LIVE' : 'PRE_LIVE';
  }, [matches, isAdminMode, adminPhaseOverride, lockTimePassed]);
  const setTournamentPhase = setAdminPhaseOverride;
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);

  const [highlightedTeamId, setHighlightedTeamId] = useState<string | null>(null);
  const [highlightedMatchId, setHighlightedMatchId] = useState<string | null>(null);

  const [showTour, setShowTour] = useState(false);
  const [currentTourStepId, setCurrentTourStepId] = useState<string | null>(null);
  const [showLiveTour, setShowLiveTour] = useState(false);
  const [showLiveSplash, setShowLiveSplash] = useState(false);
  const [showKnockoutReminder, setShowKnockoutReminder] = useState(false);
  const [showSCReminder, setShowSCReminder] = useState(false);
  const [scReminderType, setScReminderType] = useState<SCReminderType>('group');
  const [goalQueue, setGoalQueue] = useState<GoalNotification[]>([]);
  const seenEventIdsRef = useRef<Set<number>>(new Set());
  const goalNotification = goalQueue[0] ?? null;
  const [kitQueue, setKitQueue] = useState<KitNotification[]>([]);
  const kitNotification = kitQueue[0] ?? null;
  const [playerModal, setPlayerModal] = useState<{ playerId: number | null; playerName: string; teamId: string } | null>(null);
  const [stadiumVenue, setStadiumVenue] = useState<string | null>(null);
  const kitNotifiedMatchesRef = useRef<Set<string>>(new Set());
  const kitInitializedRef = useRef(false);
  const wandTourTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [installAction, setInstallAction] = useState<(() => void) | null>(null);
  const [dailyBrief, setDailyBrief] = useState<string | null>(null);
  const [briefRefreshing, setBriefRefreshing] = useState(false);

  const t = TRANSLATIONS[language];
  const localeMap: Record<LanguageCode, string> = { EN: 'en-GB', US: 'en-US', NO: 'no-NO', SCO: 'en-GB' };
  const currentLocale = localeMap[language];

  // --- INVITE LINK HANDLER ---
  // Reads ?invite=slug and ?late=1 from URL on first load and stores in sessionStorage.
  // Also applies the league's default language immediately (for the login screen).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    const late   = params.get('late');
    if (invite) {
      sessionStorage.setItem('pending_league_invite', invite);
      const defaultLang = LEAGUE_DEFAULT_LANGS[invite];
      if (defaultLang) setLanguage(defaultLang);
    }
    if (late === '1') sessionStorage.setItem('pending_late_joiner', '1');
    if (invite || late) window.history.replaceState({}, '', window.location.pathname);
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
    supabase.from('settings').select('key, value').in('key', ['league_langs', 'late_joiner_cutoff'])
      .then(({ data }) => {
        if (!data) return;
        for (const row of data) {
          if (row.key === 'league_langs' && row.value) {
            const overrides = row.value as Record<string, LanguageCode>;
            setLeagueLangs(prev => ({ ...prev, ...overrides }));
            const pendingInvite = sessionStorage.getItem('pending_league_invite');
            if (pendingInvite && overrides[pendingInvite]) setLanguage(overrides[pendingInvite]);
          }
          if (row.key === 'late_joiner_cutoff') {
            setLateJoinerCutoff(row.value as string ?? null);
          }
        }
      })
      .catch(() => { /* settings table not yet created — silently ignore */ });
  }, []);

  // --- HELPERS ---
  const addToast = (type: ToastType, title: string, message?: string, action?: { label: string; onClick: () => void }) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, title, message, action }]);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const totalMatchesCount = useMemo(() => ({
      group: matches.filter(m => m.groupId).length,
      knockout: matches.filter(m => m.round).length
  }), [matches]);

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
      setHighlightedMatchId(matchId);
      setTimeout(() => {
          const element = document.getElementById(`bracket-match-${matchId}`);
          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }, 100);
      setTimeout(() => setHighlightedMatchId(null), 2000);
  };

  const isInLateWindow = useMemo(() => {
    if (lateWindowCleared || !user?.email) return false;
    const until = parseInt(localStorage.getItem('rasten_late_until_' + user.email) || '0');
    return Date.now() < until;
  }, [user?.email, lateWindowCleared]);

  const effectiveTournamentPhase: TournamentPhase = isInLateWindow ? 'PRE_LIVE' : tournamentPhase;

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
      const matchesForBracket = isInLateWindow
          ? matches.map(m => (m.status === 'NS' || m.status === 'UPCOMING') ? { ...m, isLocked: false } : m)
          : matches;
      return applyPredictionsToBracket(matchesForBracket, teamsData, userSpecificPreds);
  }, [matches, teamsData, allPredictions, user, groupStageEndTime, isInLateWindow]);

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
      // Only use real group results once every group match is settled — prevents
      // partial group data (some groups finished, some not) from distorting the bracket.
      const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'FINISHED'];
      const allGroupMatchesDone = matches.filter(m => m.groupId).length > 0 &&
          matches.filter(m => m.groupId).every(m => FINISHED_STATUSES.includes(m.status ?? ''));
      if (isDraftingWindow || (user.hasTakenSecondChance && allGroupMatchesDone)) {
          // Base: real matches supply actual group results; knockout matches reset so SC picks apply
          const scBase = matches.map(m =>
              m.groupId ? m : { ...m, isLocked: false, homeScore: null, awayScore: null }
          );
          // Knockout picks: for PENDING users use sc_draft (staged); for ACTIVE users use allPredictions
          let scKnockoutPreds = bracketPreds.filter(p => !/^[A-L]\d$/.test(p.matchId));
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

  // --- 3RD PLACE CALCULATIONS ---
  const officialQualifiedThirds = useMemo(() => {
      const all = getAllGroupStandings(matches, teamsData);
      const thirds = getThirdPlaceStandings(all);
      return new Set(thirds.slice(0, 8).map(t => t.teamId));
  }, [matches, teamsData]);

  const predictedQualifiedThirds = useMemo(() => {
      const all = getAllGroupStandings(userMatches, teamsData);
      const thirds = getThirdPlaceStandings(all);
      return new Set(thirds.slice(0, 8).map(t => t.teamId));
  }, [userMatches, teamsData]);

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
    const matchNotStarted = match.status === 'NS' || match.status === 'UPCOMING';
    const isSecondChanceDrafting = user.secondChanceStatus === 'PENDING' && !match.groupId;
    const effectiveLock = isSecondChanceDrafting ? false
        : (isInLateWindow && matchNotStarted ? false : match.isLocked);
    if (!match || (effectiveLock && !isWhitelisted)) return;

    // SC DRAFTING: save to staging (sc_draft on profiles), not predictions table
    if (isSecondChanceDrafting) {
      const newScDraft = { ...(user.scDraft || {}), [matchId]: { home: Number(h), away: Number(a) } };
      setUser(prev => prev ? { ...prev, scDraft: newScDraft } : null);
      const { error } = await supabase.from('profiles').update({ sc_draft: newScDraft } as any).eq('email', user.email);
      if (error) { console.error('SC draft save failed:', error.message); addToast('error', t.saveFailed, t.saveFailedMsg); }
      return;
    }

    const newPred = { userId: user.email, matchId, home: Number(h), away: Number(a) };

    // --- Cascade: detect knockout slots that shift due to this group prediction ---
    let idsToDelete: string[] = [];
    if (match.groupId) {
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

    // Save group/knockout prediction
    const { error: predError } = await supabase.from('predictions').upsert(
      { user_id: user.email, match_id: matchId, home: Number(h), away: Number(a) } as any,
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
              { user_id: previousGroupPred.userId, match_id: previousGroupPred.matchId, home: previousGroupPred.home, away: previousGroupPred.away } as any,
              { onConflict: 'user_id,match_id' }
            );
          } else {
            await supabase.from('predictions').delete().eq('user_id', user.email).eq('match_id', matchId);
          }
          if (deletedPreds.length > 0) {
            await supabase.from('predictions').upsert(
              deletedPreds.map(p => ({ user_id: p.userId, match_id: p.matchId, home: p.home, away: p.away })) as any,
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
              const rows = draftEntries.map(([matchId, { home, away }]) => ({
                  user_id: user.email, match_id: matchId, home, away,
              }));
              const { error: pushError } = await supabase.from('predictions').upsert(rows as any, { onConflict: 'user_id,match_id' });
              if (pushError) { console.error('SC lock-in push failed:', pushError.message); addToast('error', t.saveFailed, t.saveFailedMsg); return; }
              // Sync local predictions state
              setAllPredictions(prev => {
                  let updated = [...prev];
                  for (const [matchId, { home, away }] of draftEntries) {
                      const idx = updated.findIndex(p => p.userId === user.email && p.matchId === matchId);
                      const entry = { userId: user.email, matchId, home, away };
                      if (idx > -1) updated[idx] = entry; else updated = [...updated, entry];
                  }
                  return updated;
              });
              bustPredictionsCache();
          }
          setUser({ ...user, secondChanceStatus: 'ACTIVE', hasTakenSecondChance: true, scDraft: undefined });
          await supabase.from('profiles').update({ second_chance_status: 'ACTIVE', has_taken_second_chance: true, sc_draft: null } as any).eq('email', user.email);
          addToast('success', t.bracketLockedIn, t.bracketLockedInMsg);
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

  const handleTimeTravel = (timestamp: number) => {
      const simulatedMatches = simulateTournamentAtDate(matches, teamsData, timestamp);
      setMatches(simulatedMatches);
      setTournamentPhase('LIVE');
  };

  const handleLanguageSwitch = (code: LanguageCode) => {
      setLanguage(code);
  };

  const handleReplayIntro = () => { const videoUrl = INTRO_VIDEOS[language]; if (videoUrl) { setIntroVideoUrl(videoUrl); setShowIntroModal(true); } };

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

  // --- LATE JOINER WINDOW ---
  // Activates a 4-hour PRE_LIVE window for users who signed up via /?late=1.
  useEffect(() => {
    if (!user?.email) return;
    if (sessionStorage.getItem('pending_late_joiner') !== '1') return;
    sessionStorage.removeItem('pending_late_joiner');
    if (lateJoinerCutoff && Date.now() > new Date(lateJoinerCutoff).getTime()) {
      addToast('error', 'Registration closed', 'The late entry window has now closed. Better luck next tournament!');
      return;
    }
    const expiresAt = Date.now() + 4 * 60 * 60 * 1000;
    localStorage.setItem('rasten_late_until_' + user.email, String(expiresAt));
    addToast('success', 'Welcome, late joiner!', 'You have 4 hours to fill in your predictions. Past matches count as 0 pts.');
  }, [user?.email, lateJoinerCutoff]);

  // Countdown ticker for late joiner banner
  useEffect(() => {
    if (!isInLateWindow || !user?.email) return;
    const tick = () => {
      const until = parseInt(localStorage.getItem('rasten_late_until_' + user.email) || '0');
      setLateWindowRemaining(Math.max(0, until - Date.now()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isInLateWindow, user?.email]);

  const handleGoLive = () => {
    if (!user?.email) return;
    localStorage.removeItem('rasten_late_until_' + user.email);
    setLateWindowCleared(true);
  };

  // --- TOUR GUIDE CONTROLS ---
  useEffect(() => {
      const localTourCompleted = user?.email ? localStorage.getItem(STORAGE_KEYS.TOUR_COMPLETED_PREFIX + user.email) : null;
      if (user && tournamentPhase === 'PRE_LIVE' && !user.toursCompleted?.preSeason && !localTourCompleted) {
          const timer = setTimeout(() => setShowTour(true), 1500);
          return () => clearTimeout(timer);
      }
  }, [user, tournamentPhase]);

  useEffect(() => {
      const localLiveTourCompleted = user?.email ? localStorage.getItem(STORAGE_KEYS.TOUR_COMPLETED_PREFIX + user.email + '_live') : null;
      if (user && tournamentPhase === 'LIVE' && !isInLateWindow && !user.toursCompleted?.liveSeason && !localLiveTourCompleted) {
          const timer = setTimeout(() => setShowLiveSplash(true), 1500);
          return () => clearTimeout(timer);
      }
  }, [user, tournamentPhase]);

  const handleSplashDone = () => {
      setShowLiveSplash(false);
      setActiveTab('leaderboard');
      setTimeout(() => setShowLiveTour(true), 300);
  };

  // Auto-fill predictions for late-joining users in LIVE phase
  useEffect(() => {
      if (!user || !supabase || tournamentPhase !== 'LIVE') return;
      if (isInLateWindow) return; // late joiners predict manually
      if (!matches.length || !Object.keys(teamsData).length) return;
      const alreadyFilled = localStorage.getItem(STORAGE_KEYS.AUTO_FILLED_PREFIX + user.email);
      if (alreadyFilled) return;

      const groupMatches = matches.filter(m => m.groupId);
      const userGroupPreds = allPredictions.filter(p => p.userId === user.email && groupMatches.some(m => m.id === p.matchId));

      const qualifiesForSubsBonus = userGroupPreds.length < groupMatches.length * 0.5;

      const simulated = simulateFullTournament(matches, teamsData, user.favorites || [], 'GROUPS', 50);
      const toSave = simulated
          .filter(m => m.groupId && m.homeScore !== null && m.awayScore !== null
              && !m.isLocked
              && (m.status === 'UPCOMING' || m.status === 'NS')
              && !userGroupPreds.some(p => p.matchId === m.id))
          .map(m => ({ user_id: user.email, match_id: m.id, home: m.homeScore!, away: m.awayScore! }));

      if (toSave.length === 0) return;

      supabase.from('predictions').upsert(toSave, { onConflict: 'user_id,match_id' }).then(({ error }) => {
          if (!error) {
              bustPredictionsCache();
              localStorage.setItem(STORAGE_KEYS.AUTO_FILLED_PREFIX + user.email, '1');
              setAllPredictions(prev => {
                  const others = prev.filter(p => p.userId !== user.email);
                  const kept = prev.filter(p => p.userId === user.email && !toSave.some(s => s.match_id === p.matchId));
                  return [...others, ...kept, ...toSave.map(p => ({ userId: p.user_id, matchId: p.match_id, home: p.home, away: p.away }))];
              });
              if (qualifiesForSubsBonus) {
                  const newSubCount = (user.substitutions ?? 5) + 3;
                  setUser(prev => prev ? { ...prev, substitutions: newSubCount } : prev);
                  supabase.from('profiles').update({ substitutions: newSubCount } as any).eq('email', user.email).then(() => {});
              }
              addToast(
                  'success',
                  "You're in the game!",
                  qualifiesForSubsBonus
                      ? `We filled ${toSave.length} predictions and gave you 3 bonus subs.`
                      : `We filled ${toSave.length} predictions so you can still compete.`
              );
          }
      });
  }, [user?.email, tournamentPhase, matches.length, Object.keys(teamsData).length, allPredictions.length]);

  const handleTourComplete = async () => {
      setShowTour(false);
      if (user?.email) localStorage.setItem(STORAGE_KEYS.TOUR_COMPLETED_PREFIX + user.email, 'true');
      if (user && supabase) {
          const newTours = { ...(user.toursCompleted || { liveSeason: false }), preSeason: true };
          setUser({ ...user, toursCompleted: newTours });
          await supabase.from('profiles').update({ tours_completed: newTours } as any).eq('email', user.email);
      }
  };

  const handleLiveTourComplete = async () => {
      setShowLiveTour(false);
      setActiveTab('leaderboard');
      if (user?.email) localStorage.setItem(STORAGE_KEYS.TOUR_COMPLETED_PREFIX + user.email + '_live', 'true');
      if (user && supabase) {
          const newTours = { ...(user.toursCompleted || { preSeason: false }), liveSeason: true };
          setUser({ ...user, toursCompleted: newTours });
          await supabase.from('profiles').update({ tours_completed: newTours } as any).eq('email', user.email);
      }
  };

  const handleTourNavigation = (stepId: string) => {
      setCurrentTourStepId(stepId);
      if (stepId === 'match_card' && activeTab !== 'groups') { setActiveTab('groups'); setActiveGroup('A'); }
      else if (stepId === 'groups_nav' && activeTab !== 'groups') setActiveTab('groups');
      else if (stepId === 'knockout_tab') { setActiveTab('knockout'); setActiveKnockoutRound('R32'); }
      else if (stepId === 'rules_tab') setActiveTab('rules');
      else if (stepId === 'profile_menu') { setActiveTab('groups'); setActiveGroup('A'); }

      clearTimeout(wandTourTimerRef.current);
      if (stepId === 'magic_wand') {
          wandTourTimerRef.current = setTimeout(() => setIsHelpingHandOpen(true), 1500);
      } else {
          setIsHelpingHandOpen(false);
      }
  };

  const handleLiveTourNavigation = (stepId: string) => {
      if (stepId === 'live_welcome' || stepId === 'live_coach_brief' || stepId === 'live_leaderboard') {
          setActiveTab('leaderboard');
          if (stepId === 'live_leaderboard') {
              setTimeout(() => {
                  const myRow = document.getElementById('tour-my-row');
                  if (myRow) {
                      myRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      const alreadyExpanded = !!document.getElementById('tour-my-row-expanded');
                      if (!alreadyExpanded) setTimeout(() => myRow.click(), 400);
                  }
              }, 450);
          }
      } else if (stepId === 'live_tournament') {
          setActiveTab('tournament');
          setTournamentSubTab('schedule');
          setTimeout(() => {
              document.getElementById('tour-schedule-hero')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 500);
      } else if (stepId === 'live_manager') {
          setActiveTab('manager');
          setTimeout(() => {
              document.getElementById('tour-manager-first-group')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 450);
      } else if (stepId === 'live_second_chance') {
          setActiveTab('manager');
          setTimeout(() => {
              document.getElementById('tour-knockout-btn')?.click();
              setTimeout(() => {
                  document.getElementById('tour-second-chance-promo')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 350);
          }, 450);
      } else if (stepId === 'live_analysis') {
          setActiveTab('analysis');
          setTimeout(() => {
              document.getElementById('tour-analysis-simleaderboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 500);
      } else if (stepId === 'live_rules') {
          setActiveTab('rules');
      } else if (stepId === 'live_profile') {
          setActiveTab('leaderboard');
      }
  };

  const groupStageMatches = useMemo(() => matches.filter(m => m.groupId), [matches]);
  const userGroupPredictionsCount = useMemo(() => user ? allPredictions.filter(p => p.userId === user.email && groupStageMatches.some(gm => gm.id === p.matchId)).length : 0, [allPredictions, user, groupStageMatches]);
  const isGroupStageComplete = userGroupPredictionsCount === groupStageMatches.length && groupStageMatches.length > 0;

  const knockoutMatches = useMemo(() => matches.filter(m => m.round), [matches]);
  const userKnockoutPredictionsCount = useMemo(
      () => user ? allPredictions.filter(p => p.userId === user.email && knockoutMatches.some(km => km.id === p.matchId)).length : 0,
      [allPredictions, user, knockoutMatches]
  );
  
  const firstIncompleteGroup = useMemo(() => {
    if (isGroupStageComplete || !user) return null;
    for (const group of GROUP_CONFIG) {
        const gMatches = matches.filter(m => m.groupId === group.id);
        const gPreds = allPredictions.filter(p => p.userId === user.email && gMatches.some(gm => gm.id === p.matchId));
        if (gPreds.length < gMatches.length) return group.id;
    }
    return 'A';
  }, [matches, allPredictions, user, isGroupStageComplete]);

  // --- NAVIGATION ---
  const handlePrevGroup = useCallback(() => {
    const idx = GROUP_CONFIG.findIndex(g => g.id === activeGroup);
    setActiveGroup(GROUP_CONFIG[(idx - 1 + GROUP_CONFIG.length) % GROUP_CONFIG.length].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeGroup]);

  const handleNextGroup = useCallback(() => {
    const idx = GROUP_CONFIG.findIndex(g => g.id === activeGroup);
    setActiveGroup(GROUP_CONFIG[(idx + 1) % GROUP_CONFIG.length].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeGroup]);

  const ROUND_ORDER: Round[] = ['R32', 'R16', 'QF', 'SF', '3RD', 'FIN'];
  const SC_ROUND_ORDER: Round[] = ['R32', 'R16', 'QF', 'SF', 'FIN'];
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

  const handleGoToGroup = (groupId: string) => { setActiveGroup(groupId); setActiveTab('groups'); setShowOverview(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const navTabs = useMemo(() => {
      if (effectiveTournamentPhase === 'PRE_LIVE') return ['groups', 'knockout', 'leaderboard', 'rules'];
      return ['leaderboard', 'tournament', 'manager', 'analysis', 'rules'];
  }, [effectiveTournamentPhase]);

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
      onSwipeLeft:  activeTab === 'groups'     ? handleNextGroup
                  : activeTab === 'tournament' ? handleNextTournamentSub
                  : handleNextTab,
      onSwipeRight: activeTab === 'groups'     ? handlePrevGroup
                  : activeTab === 'tournament' ? handlePrevTournamentSub
                  : handlePrevTab,
  });

  useEffect(() => {
      const liveTabs = ['leaderboard', 'tournament', 'manager', 'analysis', 'rules'];
      // SC users need the knockout tab to access SecondChanceView — don't bounce them
      const scOnKnockout = activeTab === 'knockout' &&
          (user?.secondChanceStatus === 'PENDING' || user?.secondChanceStatus === 'ACTIVE');
      if (effectiveTournamentPhase === 'LIVE' && !liveTabs.includes(activeTab) && !scOnKnockout) {
          setActiveTab('tournament');
      }
  }, [effectiveTournamentPhase, activeTab, user?.secondChanceStatus]);

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
      if (!user || tournamentPhase !== 'PRE_LIVE' || !isGroupStageComplete || userKnockoutPredictionsCount > 0) return;
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

  const handleTickerMatchClick = (match: Match) => {
    if (match.groupId) {
      if (tournamentPhase === 'LIVE') {
        setActiveTab('tournament');
        setTournamentSubTab('schedule');
        setScheduleJumpMatchId(match.id);
      } else {
        setActiveTab('groups');
        setActiveGroup(match.groupId);
        setTimeout(() => {
          const el = document.getElementById(`match-card-${match.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    } else if (match.round) {
      if (tournamentPhase === 'LIVE') {
        setActiveTab('tournament');
        setTournamentSubTab('schedule');
        setScheduleJumpMatchId(match.id);
      } else {
        setActiveTab('knockout');
        setActiveKnockoutRound(match.round as any);
        handleJumpToBracket(match.id);
      }
    } else {
      setActiveTab('tournament');
      setTournamentSubTab('schedule');
    }
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

  const missingGroupPredictions = useMemo(() => {
    if (!user || tournamentPhase !== 'PRE_LIVE') return 0;
    const allMatchIds = matches.map(m => m.id);
    const userPredMatchIds = new Set(allPredictions.filter(p => p.userId === user.email).map(p => p.matchId));
    return allMatchIds.filter(id => !userPredMatchIds.has(id)).length;
  }, [user?.email, tournamentPhase, matches, allPredictions]);

  // --- DAILY BRIEF: Pre-generate on login, cache per user per day ---
  const runBriefGeneration = async () => {
      if (!user || !matches.length || !Object.keys(teamsData).length || !allPredictions) return;
      const cacheKey = `rasten_brief_${user.email}_${new Date().toISOString().slice(0, 10)}`;
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
              const score = finishedMatches.reduce((sum, m) => {
                  const pred = allPredictions.find(p => p.userId === u.email && p.matchId === m.id);
                  if (!pred) return sum;
                  return sum + calculatePoints(pred.home, pred.away, m.homeScore!, m.awayScore!, !!u.hasTakenSecondChance, m.round);
              }, 0);
              return { user: u, score, rank: 0, diff: 0 };
          }).sort((a, b) => b.score - a.score).map((s, i) => ({ ...s, rank: i + 1 }));
          const upcoming = matches
              .filter(m => m.status === 'UPCOMING' || m.status === 'NS')
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
  const standings = useMemo(() => calculateGroupStandings(activeGroup, userMatches, teamsData), [activeGroup, userMatches, teamsData]);
  const groupMatchesList = userMatches.filter(m => m.groupId === activeGroup);
  
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

  const showMagicWand = (
      (effectiveTournamentPhase === 'PRE_LIVE' && activeTab !== 'leaderboard' && activeTab !== 'manager' && activeTab !== 'analysis') ||
      (tournamentPhase === 'LIVE' && user?.hasTakenSecondChance && (activeTab === 'knockout'))
  );

  const getSimMode = (): 'knockout' | 'groups' => {
      if (activeTab === 'knockout') return 'knockout';
      if (activeTab === 'tournament' && tournamentSubTab === 'bracket') return 'knockout';
      return 'groups';
  };

  if (loading) return <div className="min-h-screen bg-[#05101c] flex items-center justify-center text-white"><div className="flex flex-col items-center gap-4"><RefreshCw className="animate-spin text-blue-500" size={32} /><div className="text-xs font-black uppercase tracking-widest opacity-60">Initializing...</div></div></div>;


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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-44 md:pb-12 relative">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <IntroVideoModal isOpen={showIntroModal} videoSrc={introVideoUrl} onClose={() => setShowIntroModal(false)} />

      <AppHeader
        user={user} language={language} setLanguage={handleLanguageSwitch} tournamentPhase={tournamentPhase} setTournamentPhase={setTournamentPhase}
        activeTab={activeTab} setActiveTab={setActiveTab} activeGroup={activeGroup} setActiveGroup={setActiveGroup}
        showOverview={showOverview} setShowOverview={setShowOverview} isProfileMenuOpen={isProfileMenuOpen} setIsProfileMenuOpen={setIsProfileMenuOpen}
        setShowAvatarEditor={setShowAvatarEditor} setIsDebugOpen={setIsDebugOpen} setShowAdminLogin={setShowAdminLogin}
        handleLogout={handleLogout}
        onReplayIntro={handleReplayIntro}
        onStartTour={() => setShowTour(true)}
        onStartLiveTour={() => { setActiveTab('leaderboard'); setShowLiveTour(true); }}
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
          <div className="bg-[#0f2545] border border-red-500/30 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
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
          />
        )}

        {isInLateWindow && (() => {
          const totalSec = Math.floor(lateWindowRemaining / 1000);
          const h = Math.floor(totalSec / 3600);
          const m = Math.floor((totalSec % 3600) / 60);
          const s = totalSec % 60;
          const timeStr = h > 0
            ? `${h}h ${m.toString().padStart(2, '0')}m`
            : `${m}m ${s.toString().padStart(2, '0')}s`;
          return (
            <div className="mb-4 flex items-center justify-between gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Clock size={16} className="text-amber-600 shrink-0" />
                <span className="text-sm font-bold text-amber-800 truncate">
                  Setup window closes in <span className="font-black tabular-nums">{timeStr}</span>
                </span>
              </div>
              <button
                onClick={handleGoLive}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
              >
                <Zap size={12} />
                Go Live
              </button>
            </div>
          );
        })()}
        {activeTab === 'analysis' && <AnalysisDashboard currentUser={user} rivals={leagueRivalsList} matches={matches} allPredictions={allPredictions} teams={teamsData} lang={t} currentLang={language} onTeamClick={(id) => setViewingTeamId(id)} />}
        {activeTab === 'rules' && <RulesPage lang={t} matches={matches} currentLocale={currentLocale} tournamentPhase={tournamentPhase} onAdminTrigger={() => setShowAdminLogin(true)} />}
        
        {/* TOURNAMENT HUB */}
        {activeTab === 'tournament' && (
            <div className="flex flex-col h-full animate-fade-in">
                <div className="flex justify-center mb-6">
                   <div className="bg-slate-200 p-1 rounded-xl flex gap-1 shadow-inner border border-slate-300">
                      {(['schedule', 'tables', 'bracket'] as const).map(sub => (
                         <button key={sub} id={`tour-subnav-${sub}`} onClick={() => setTournamentSubTab(sub)} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${tournamentSubTab === sub ? 'bg-[#0f2545] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-300/50'}`}>
                            {sub === 'schedule' && <CalendarDays size={14} />}{sub === 'tables' && <ListOrdered size={14} />}{sub === 'bracket' && <GitMerge size={14} />}{sub === 'schedule' ? t.subnavSchedule : sub === 'tables' ? t.subnavTables : t.subnavBracket}
                         </button>
                      ))}
                   </div>
                </div>
                {tournamentSubTab === 'schedule' && <TournamentSchedule matches={matches} teams={teamsData} userPredictions={allPredictions.filter(p => p.userId === user?.email)} user={user} lang={t} currentLang={language} onTeamClick={(id) => setViewingTeamId(id)} onJumpToTable={handleJumpToTable} onJumpToBracket={handleJumpToBracket} jumpToMatchId={scheduleJumpMatchId} matchEvents={matchEvents} matchLineups={matchLineups} matchStats={matchStats} playerMatchStats={playerMatchStats} onSubstitute={handleSubstitute} onUpdate={handleScoreUpdate} onPlayerClick={(playerId, playerName, teamId) => setPlayerModal({ playerId, playerName, teamId })} onStadiumClick={v => setStadiumVenue(v)} />}
                {tournamentSubTab === 'tables' && (
                    <div className="pb-20 max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-1">
                            {GROUP_CONFIG.map(g => (
                                <div key={g.id} id={`group-card-${g.id}`} className="w-full">
                                    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden h-full">
                                        <div className="bg-[#0f2545] p-3 text-white flex justify-between items-center"><h3 className="font-black uppercase tracking-widest text-sm">{t.groups} {g.id}</h3></div>
                                        <StandingsTable standings={calculateGroupStandings(g.id, matches, teamsData)} teams={teamsData} lang={t} compact={true} onTeamClick={(id) => setViewingTeamId(id)} highlightedTeamId={highlightedTeamId} qualifiedThirds={officialQualifiedThirds} predictedRankMap={allPredictedGroupStandings[g.id]} predictedQualifiedThirds={purePredictedQualifiedThirds} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {tournamentSubTab === 'bracket' && <KnockoutTreeView matches={matches} teams={teamsData} userPredictions={liveResultsAsPredictions} onUpdate={() => {}} lang={t} highlightedMatchId={highlightedMatchId} />}
            </div>
        )}

        {/* GROUPS TAB */}
        {activeTab === 'groups' && effectiveTournamentPhase === 'PRE_LIVE' && (
            <div className="animate-fade-in">
                {showOverview ? (
                   <GroupStageSummary matches={userMatches} teams={teamsData} lang={t} phase={tournamentPhase} hasTakenSecondChance={user?.hasTakenSecondChance} onSecondChance={handlePledgeSecondChance} userPredictions={allPredictions.filter(p => p.userId === user?.email)} onGoToGroup={handleGoToGroup} onGoToKnockout={() => setActiveTab('knockout')} onTeamClick={(id) => setViewingTeamId(id)} />
                ) : (
                   <>
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                          <StandingsTable standings={standings} teams={teamsData} lang={t} onTeamClick={(id) => setViewingTeamId(id)} qualifiedThirds={predictedQualifiedThirds} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {groupMatchesList.map((match, index) => (
                              <MatchCard
                                key={match.id}
                                cardId={index === 0 ? "tour-first-match" : undefined}
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
                                phase={tournamentPhase}
                                isAdminMode={isAdminMode}
                                isLateJoiner={isInLateWindow}
                                onSubstitute={() => handleSubstitute(match.id)}
                                substitutionsLeft={user?.substitutions || 0}
                                isUnlockedBySub={user?.unlockedMatches?.includes(match.id) || false}
                                onTeamClick={(id) => setViewingTeamId(id)}
                                showStatusBadge={false}
                                context="groups"
                                events={matchEvents.filter(e => String(e.matchId) === String(match.id) || e.matchId === `${match.homeTeamId}_${match.awayTeamId}`)}
                                playerMatchStats={playerMatchStats}
                                onPlayerClick={(playerId, playerName, teamId) => setPlayerModal({ playerId, playerName, teamId })}
                                onStadiumClick={v => setStadiumVenue(v)}
                              />
                          ))}
                      </div>
                      <div className="mt-12 flex flex-col items-center gap-4">
                          <div className="flex gap-3 w-full max-w-lg">
                              {activeGroup !== 'A' && <button onClick={handlePrevGroup} className="flex-1 px-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"><ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /><span>{t.prevGroup}</span></button>}
                              {activeGroup !== 'L' ? <button onClick={handleNextGroup} className="flex-[2] px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl shadow-lg font-black uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"><span>{t.nextGroup}</span><ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></button> : <div className="flex-[2] flex flex-col gap-3">
                                  <button onClick={() => setShowOverview(true)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm"><LayoutGrid size={16} /> {t.tablesBtn}</button>
                                  <button onClick={() => setActiveTab('knockout')} className="w-full px-6 py-5 bg-gradient-to-r from-[#0f2545] to-[#1a3a6c] border border-yellow-400/30 text-white rounded-2xl shadow-xl font-black uppercase tracking-widest hover:from-[#153055] hover:to-[#1e4080] hover:shadow-yellow-500/20 hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-between gap-3 group">
                                    <div className="flex items-center gap-3">
                                      <GitMerge size={22} className="text-yellow-400 shrink-0" />
                                      <div className="flex flex-col items-start">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">{isGroupStageComplete ? '✓ All groups predicted' : 'Next up'}</span>
                                        <span className="text-base leading-none">{t.bracketBtn}</span>
                                      </div>
                                    </div>
                                    <ChevronRight size={20} className="text-yellow-400 group-hover:translate-x-1 transition-transform shrink-0" />
                                  </button>
                                </div>}
                          </div>
                      </div>
                   </>
                )}
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
                    />
                ) : (
                    <KnockoutBracket
                        matches={userBracket} teams={teamsData} onUpdate={handleScoreUpdate} lang={t} user={user}
                        onSecondChance={handlePledgeSecondChance} rivals={rivalsList} allPredictions={allPredictions} phase={tournamentPhase}
                        isGroupStageComplete={isGroupStageComplete || showTour} firstIncompleteGroup={firstIncompleteGroup} onGoToGroup={handleGoToGroup}
                        onTeamClick={setViewingTeamId} onSpy={handleSpy} revealedRivals={user?.spiedMatches || []} activeRound={activeKnockoutRound}
                        matchEvents={matchEvents} isLateJoiner={isInLateWindow}
                    />
                )}
                <div className="mt-8 flex justify-center pb-8">
                     <div className="flex gap-3 w-full max-w-lg">
                        <button onClick={handlePrevRound} className="flex-1 px-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"><ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /><span>{activeKnockoutRound === 'R32' ? t.groups : t.prevRound}</span></button>
                        {activeKnockoutRound !== 'FIN' ? (
                            <button onClick={handleNextRound} className="flex-[2] px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl shadow-lg font-black uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"><span>{t.nextRound}</span><ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></button>
                        ) : (
                            <button onClick={() => setActiveTab('leaderboard')} className="flex-[2] px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl shadow-lg font-black uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"><span>{t.leaderboard || 'Leaderboard'}</span><ChevronRight size={18} /></button>
                        )}
                     </div>
                </div>
            </div>
        )}
        
        {/* LEADERBOARD */}
        {activeTab === 'leaderboard' && (
            <>
                {tournamentPhase === 'PRE_LIVE' ? (
                    <PlayerProgress users={Object.values(usersDb)} allPredictions={allPredictions} totalMatches={totalMatchesCount} lang={t} currentUserLeagues={user.leagues} currentUserEmail={user?.email} currentLang={language} />
                ) : (
                    <Leaderboard users={Object.values(usersDb)} matches={matches} allPredictions={allPredictions} lang={t} currentUserEmail={user?.email} currentUserLeagues={user?.leagues} teams={teamsData} onTeamClick={(id) => setViewingTeamId(id)} preloadedAnalysis={dailyBrief} onRefreshBrief={() => { const cacheKey = `rasten_brief_${user.email}_${new Date().toDateString()}`; localStorage.removeItem(cacheKey); runBriefGeneration(); }} briefRefreshing={briefRefreshing} currentLang={language} />
                )}
            </>
        )}
        
        {/* MANAGER TAB */}
        {activeTab === 'manager' && (
            <ManagerHub
                matches={matches}
                userMatches={userMatches}
                bracketMatches={userBracket}
                teams={teamsData}
                allPredictions={allPredictions}
                currentUser={user}
                allUsers={Object.values(usersDb) as UserProfile[]}
                lang={t}
                onSubstitute={handleSubstitute}
                onUnlockSecondChance={handlePledgeSecondChance}
                onGoToKnockout={() => setActiveTab('knockout')}
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

      <TourGuide steps={PRE_SEASON_TOUR} isOpen={showTour} onComplete={handleTourComplete} langCode={language} onStepChange={handleTourNavigation} />
      <TourGuide steps={LIVE_SEASON_TOUR} isOpen={showLiveTour} onComplete={handleLiveTourComplete} langCode={language} onStepChange={handleLiveTourNavigation} defaultMode="text" />
      <LiveSplashScreen isOpen={showLiveSplash} onDone={handleSplashDone} langCode={language} />
      <KnockoutReminderModal isOpen={showKnockoutReminder} onDismiss={handleKnockoutReminderDismiss} langCode={language} />
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
            <div className="relative w-full max-w-md bg-[#0f2545] border border-white/10 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
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
                            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                            onKeyDown={e => { if (e.key === 'Enter') saveNewName(); }}
                        />
                        <button
                            onClick={saveNewName}
                            disabled={nameSaving || !pendingName.trim()}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
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
        onAutoFillAllUsers={async () => {
          if (!supabase) return { filled: 0, users: 0 };
          const groupMatches = matches.filter(m => m.groupId);
          const allUpserts: { user_id: string; match_id: string; home: number; away: number }[] = [];
          for (const [email, profile] of Object.entries(usersDb)) {
            const userPreds = allPredictions.filter(p => p.userId === email);
            const simulated = simulateFullTournament(matches, teamsData, profile.favorites || [], 'GROUPS', 50);
            const toSave = simulated.filter(m =>
              m.groupId && m.homeScore !== null && m.awayScore !== null &&
              !m.isLocked && (m.status === 'UPCOMING' || m.status === 'NS') &&
              groupMatches.some(gm => gm.id === m.id) &&
              !userPreds.some(p => p.matchId === m.id)
            ).map(m => ({ user_id: email, match_id: m.id, home: m.homeScore!, away: m.awayScore! }));
            allUpserts.push(...toSave);
          }
          if (allUpserts.length === 0) return { filled: 0, users: 0 };
          const { error } = await supabase.from('predictions').upsert(allUpserts as any, { onConflict: 'user_id,match_id', ignoreDuplicates: true });
          if (error) throw error;
          bustPredictionsCache();
          setAllPredictions(prev => {
            const newPreds = allUpserts.map(p => ({ userId: p.user_id, matchId: p.match_id, home: p.home, away: p.away }));
            const kept = prev.filter(p => !allUpserts.some(u => u.user_id === p.userId && u.match_id === p.matchId));
            return [...kept, ...newPreds];
          });
          return { filled: allUpserts.length, users: new Set(allUpserts.map(u => u.user_id)).size };
        }}
        onClear={() => { localStorage.clear(); window.location.reload(); }}
        onTimeTravel={handleTimeTravel}
        lang={t} users={Object.values(usersDb) as UserProfile[]} predictions={allPredictions} matches={matches}
        leagueLangs={leagueLangs}
        onUpdateLeagueLang={async (slug, lang) => {
          const updated = { ...leagueLangs, [slug]: lang };
          setLeagueLangs(updated);
          if (supabase) await supabase.from('settings').upsert({ key: 'league_langs', value: updated });
        }}
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
        onUpdateMatchChannels={async (matchId, channels) => {
          if (!supabase) return;
          await supabase.from('matches').update({ channels } as any).eq('id', matchId);
          setMatches(prev => prev.map(m => m.id === matchId ? { ...m, channels } : m));
        }}
        onBulkUpdateChannels={async (locale, scope, channel) => {
          if (!supabase) return;
          const targets = matches.filter(m =>
            scope === 'all' ? true : scope === 'groups' ? !!m.groupId : !!m.round
          );
          await Promise.all(targets.map(m => {
            const updated = { ...(m.channels || {}), [locale]: channel };
            return supabase.from('matches').update({ channels: updated } as any).eq('id', m.id);
          }));
          setMatches(prev => prev.map(m =>
            targets.some(t => t.id === m.id)
              ? { ...m, channels: { ...(m.channels || {}), [locale]: channel } }
              : m
          ));
        }}
        lateJoinerCutoff={lateJoinerCutoff}
        onSetLateJoinerCutoff={async (cutoff) => {
          if (!supabase) return;
          if (cutoff) {
            await supabase.from('settings').upsert({ key: 'late_joiner_cutoff', value: cutoff });
          } else {
            await supabase.from('settings').delete().eq('key', 'late_joiner_cutoff');
          }
          setLateJoinerCutoff(cutoff);
        }}
        onPreviewLateInvites={async () => {
          const usersWithPreds = new Set(allPredictions.map(p => p.userId));
          const recipients = Object.values(usersDb as Record<string, any>)
            .filter(u => !usersWithPreds.has(u.email))
            .map(u => {
              const league = u.leagues?.[0] ?? null;
              const lang = league ? (LEAGUE_DEFAULT_LANGS[league] ?? 'EN') : 'EN';
              return {
                name: u.name || '',
                email: u.email,
                league,
                lang,
                url: league
                  ? `${window.location.origin}?invite=${league}&late=1`
                  : `${window.location.origin}?late=1`,
              };
            });
          return { recipients, cutoff: lateJoinerCutoff };
        }}
        onSendLateInvites={async () => {
          if (!supabase) return { sent: 0, failed: 0 };
          const { data, error } = await supabase.functions.invoke('send-late-invites', { body: { dry_run: false } });
          if (error) throw error;
          return data;
        }}
        onSyncNow={async () => {
          try {
            const { error } = await supabase.functions.invoke('sync-scores');
            if (error) return { ok: false, message: error.message };
            return { ok: true };
          } catch (e: any) {
            return { ok: false, message: e?.message ?? 'Unknown error' };
          }
        }}
        onTestNotification={(type) => {
          const id = Date.now();
          if (type === 'kit') {
            setKitQueue(prev => [...prev, {
              id: `kit_test_${id}`,
              matchId: 'TEST',
              homeTeamId: 'BRA',
              awayTeamId: 'SCO',
              homeKitBg: '#F7E016',
              homeKitText: '#033A75',
              awayKitBg: '#003380',
              awayKitText: '#FFFFFF',
            }]);
          } else {
            setGoalQueue(prev => [...prev, {
              eventId: id,
              matchId: 'TEST',
              eventType: type === 'var' ? 'Var' : 'Goal',
              teamId: type === 'og' ? 'SCO' : 'BRA',
              player: type === 'var' ? 'G. Jesus' : type === 'og' ? 'A. Robertson' : type === 'pen' ? 'Vinícius Jr.' : 'R. Firmino',
              playerId: type === 'var' ? 47281 : type === 'og' ? 19220 : type === 'pen' ? 47232 : 47189,
              detail: type === 'var' ? 'Goal Disallowed' : type === 'og' ? 'Own Goal' : type === 'pen' ? 'Penalty' : 'Normal Goal',
              minute: 67,
              minuteExtra: null,
              homeTeamId: 'BRA',
              awayTeamId: 'SCO',
              homeScore: type === 'og' ? 1 : 2,
              awayScore: 1,
              homeKitBg:   '#F7E016',
              homeKitText: '#033A75',
              awayKitBg:   '#003380',
              awayKitText: '#FFFFFF',
            }]);
          }
        }}
      />

      {/* Admin Password Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => { setShowAdminLogin(false); setAdminPasswordInput(''); setAdminPasswordError(false); }} />
          <div className="relative w-full max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#0f2545] px-5 py-4 flex items-center gap-3 text-white">
              <div className="bg-amber-500 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <div className="font-black uppercase tracking-widest text-sm">Admin Login</div>
                <div className="text-[10px] text-blue-200">Enter admin password to continue</div>
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
                className={`w-full px-4 py-3 border rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 ${adminPasswordError ? 'border-red-400 ring-red-200 bg-red-50 text-red-700 placeholder-red-300' : 'border-slate-200 ring-blue-200 bg-slate-50 text-slate-800'}`}
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
                const relevantMatches = simulatedMatches.filter(m => { if (safeScope === 'GROUPS') return !!m.groupId; if (safeScope === 'KNOCKOUT') return !!m.round; return true; });

                if (user && supabase) {
                    const predictionsToSave = relevantMatches.filter(m => {
                        if (m.homeScore === null || m.awayScore === null) return false;
                        // Late joiners: only predict future matches — no retroactive picks on played matches
                        if (isInLateWindow && m.status !== 'NS' && m.status !== 'UPCOMING') return false;
                        return true;
                    }).map(m => ({ user_id: user.email, match_id: m.id, home: m.homeScore!, away: m.awayScore! }));
                    if (predictionsToSave.length > 0) {
                        const { error } = await supabase.from('predictions').upsert(predictionsToSave, { onConflict: 'user_id,match_id' });
                        if (!error) {
                            addToast('success', t.magicApplied, `${predictionsToSave.length} matches.`);
                            setAllPredictions(prev => {
                                const others = prev.filter(p => p.userId !== user.email);
                                const myOldPreds = prev.filter(p => p.userId === user.email && !predictionsToSave.some(newP => newP.match_id === p.matchId));
                                const myNewPreds = predictionsToSave.map(p => ({ userId: p.user_id, matchId: p.match_id, home: p.home, away: p.away }));
                                return [...others, ...myOldPreds, ...myNewPreds];
                            });
                        } else { addToast('error', t.saveFailed, t.saveFailedMsg); }
                    }
                }
                setIsHelpingHandOpen(false);
            }} 
        />
      )}

      {showMagicWand && <MagicWand onOpen={() => setIsHelpingHandOpen(true)} onClear={handleClearPredictions} showClear={showClearTrash} lang={t} isTourActive={currentTourStepId === 'magic_wand' && !isHelpingHandOpen} />}
      {viewingTeamId && teamsData[viewingTeamId] && <TeamDetailsModal team={teamsData[viewingTeamId]} isOpen={true} onClose={() => setViewingTeamId(null)} lang={t} currentLang={language} />}


    </div>
  );
};

export default App;