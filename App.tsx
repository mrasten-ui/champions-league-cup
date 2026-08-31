import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, CalendarDays, ListOrdered, Timer, Star, X } from 'lucide-react';
import { TRANSLATIONS, LEAGUES, LEAGUE_DEFAULT_LANGS } from './constants';
import { LanguageCode, UserProfile, TournamentPhase, Match } from './types';
import {
  calculateLeagueStandings,
  simulateFullTournament,
  applyPredictionsToBracket,
  calculatePoints,
  calculatePenaltyBonus,
  resolvePenaltySide,
  buildRealResultReveal,
  buildFutureReset,
} from './services/engine';
import REAL_CL_2024_RESULTS from './data/real-cl-2024-results.json';
import { isMatchLocked, msUntilLock } from './utils/date';
import { MatchRow } from './components/MatchRow';
import { StandingsTable } from './components/StandingsTable';
import { StandingsStrip } from './components/StandingsStrip';
import { StarField } from './components/StarField';
import { MagicWand } from './components/MagicWand';
import { HelpingHandModal } from './components/HelpingHandModal';
import { Leaderboard } from './components/Leaderboard';
import { RulesPage } from './components/RulesPage';
import { PredictionNudge } from './components/PredictionNudge';
import { AvatarGenerator } from './components/AvatarGenerator';
import { RiskSlider } from './components/RiskSlider';
import { InstallPrompt } from './components/InstallPrompt';
import { useSwipe } from './hooks/useSwipe';
import { supabase } from './supabase';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { DebugTools } from './components/DebugTools';
import { RoundResults } from './components/RoundResults';
import { TeamDetailsModal } from './components/TeamDetailsModal';
import { useAppData, bustPredictionsCache } from './hooks/useAppData';
import { LoginScreen } from './components/LoginScreen';
import { AppHeader } from './components/AppHeader';
import { generateDailyBrief } from './components/analysis/AIAnalystWidget';
import { GoalBanner, GoalNotification, KitNotification, PsoNotification } from './components/GoalBanner';
import { PlayerModal } from './components/PlayerModal';
import { StadiumModal } from './components/StadiumModal';
import { LiveTicker } from './components/LiveTicker';

const STORAGE_KEYS = {
  CURRENT_USER: 'rasten_cup_active_user_v2',
  NUDGE_DISMISSED_PREFIX: 'rasten_nudge_dismissed_v1_',
};

export const App = () => {
  const {
    session, user, setUser, loading, matches, setMatches, teamsData,
    allPredictions, setAllPredictions, usersDb, setUsersDb, menPresets, womenPresets,
    lockTimePassed, matchEvents, matchLineups, matchStats, playerMatchStats,
  } = useAppData();

  const [activeTab, setActiveTab] = useState<'groups' | 'leaderboard' | 'tournament' | 'rules'>('groups');
  const [tournamentSubTab, setTournamentSubTab] = useState<'rounds' | 'tables'>('rounds');
  const [scheduleJumpMatchId, setScheduleJumpMatchId] = useState<string | undefined>(undefined);

  const [language, setLanguage] = useState<LanguageCode>('EN');
  const [leagueLangs, setLeagueLangs] = useState<Record<string, LanguageCode>>(LEAGUE_DEFAULT_LANGS);
  const [adminPhaseOverride, setAdminPhaseOverride] = useState<TournamentPhase | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isHelpingHandOpen, setIsHelpingHandOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [pendingRiskResult, setPendingRiskResult] = useState(50);
  const [pendingRiskScoring, setPendingRiskScoring] = useState(50);
  const [riskSaveState, setRiskSaveState] = useState<'idle' | 'syncing' | 'saved'>('idle');
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
  const localeMap: Record<LanguageCode, string> = { EN: 'en-GB', SCO: 'en-GB' };
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

  // Real results stay put for locked/finished matches; the user's own predictions overlay
  // onto not-yet-locked matches, so standings reflect "actual so far + my guesses for the rest."
  const userMatches = useMemo(() => {
      if (!user) return matches;
      const userSpecificPreds = allPredictions.filter(p => p.userId === user.email);
      return applyPredictionsToBracket(matches, teamsData, userSpecificPreds);
  }, [matches, teamsData, allPredictions, user]);

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
      setPendingRiskResult((user.riskResult ?? 0.5) * 100);
      setPendingRiskScoring((user.riskScoring ?? 0.5) * 100);
      setRiskSaveState('idle');
    }
  }, [showAvatarEditor]);

  // Debounced autosave for the risk profile sliders — mirrors MatchRow's
  // drag-then-settle pattern so dragging doesn't hammer the DB with writes.
  useEffect(() => {
    if (!showAvatarEditor || !user || !supabase) return;
    const unchanged = Math.round((user.riskResult ?? 0.5) * 100) === Math.round(pendingRiskResult)
      && Math.round((user.riskScoring ?? 0.5) * 100) === Math.round(pendingRiskScoring);
    if (unchanged) return;

    setRiskSaveState('syncing');
    const timer = setTimeout(async () => {
      const riskResult = pendingRiskResult / 100;
      const riskScoring = pendingRiskScoring / 100;
      const { error } = await supabase.from('profiles').update({ risk_result: riskResult, risk_scoring: riskScoring } as any).eq('email', user.email);
      if (error) { console.error('Risk profile save failed:', error); setRiskSaveState('idle'); addToast('error', t.saveFailed, t.saveFailedMsg); return; }
      setUser({ ...user, riskResult, riskScoring });
      setUsersDb(prev => ({ ...prev, [user.email]: { ...prev[user.email], riskResult, riskScoring } }));
      setRiskSaveState('saved');
    }, 700);
    return () => clearTimeout(timer);
  }, [pendingRiskResult, pendingRiskScoring, showAvatarEditor]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!match || isMatchLocked(match)) return;

    const newPred = { userId: user.email, matchId, home: Number(h), away: Number(a), homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId };

    setAllPredictions(prev => {
      const idx = prev.findIndex(p => p.userId === user.email && p.matchId === matchId);
      return idx > -1 ? prev.map((p, i) => i === idx ? newPred : p) : [...prev, newPred];
    });

    const { error: predError } = await supabase.from('predictions').upsert(
      { user_id: user.email, match_id: matchId, home: Number(h), away: Number(a), home_team_id: match.homeTeamId, away_team_id: match.awayTeamId } as any,
      { onConflict: 'user_id,match_id' }
    );
    if (predError) { console.error('Prediction save failed:', predError.message, predError); addToast('error', t.saveFailed, t.saveFailedMsg); }
    else { bustPredictionsCache(); }
  };

  // Scouting costs a point, not a token — no limit on how many times you can
  // scout, but each one permanently costs 1 point off your score (see the
  // scoutPenalty deduction in Leaderboard.tsx's userStats, derived directly
  // from spiedMatches.length rather than a separate persisted counter).
  const handleSpy = async (matchId: string) => {
      if (!user || !supabase) return;
      if (!user.leagues || user.leagues.length === 0) {
          addToast('info', "Not yet assigned", "You haven't been assigned to a league yet. This can take up to 24 hours — check back tomorrow.");
          return;
      }
      if (user.spiedMatches?.includes(matchId)) return;
      const newSpied = [...(user.spiedMatches || []), matchId];
      setUser({ ...user, spiedMatches: newSpied });
      const { error: spyError } = await supabase.from('profiles').update({ spied_matches: newSpied } as any).eq('email', user.email);
      if (spyError) addToast('error', t.saveFailed, t.saveFailedMsg);
      else addToast('success', t.rivalRevealed, t.intelUsed);
  };


  // Admin testing tool: replay the REAL 2024/25 League Phase results (same match ids
  // as seeded) onto matches up to a chosen matchday, written to Supabase so standings/
  // knockout qualification behave exactly as they would with real results coming in.
  const handleRevealRealResults = async (upToMatchday: number) => {
      if (!supabase) return;
      const rows = buildRealResultReveal(matches, upToMatchday, REAL_CL_2024_RESULTS as any);
      if (rows.length === 0) return;
      const { error } = await supabase.from('matches').upsert(rows as any, { onConflict: 'id' });
      if (error) { console.error('Reveal real results failed:', error.message); addToast('error', t.saveFailed, t.saveFailedMsg); return; }
      addToast('success', 'Time Travel', `Revealed real results through Round ${upToMatchday} (${rows.length} matches).`);
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


  // Always the same tabs — predicting, live tracking, and standings all coexist
  // throughout the season instead of the app switching to a different nav set
  // once the first match kicks off.
  // Order tells a story: what do I need to do → how am I doing → how's the
  // tournament going → how do I play.
  const navTabs = useMemo(() => ['groups', 'leaderboard', 'tournament', 'rules'], []);

  const handleNextTab = useCallback(() => {
      const idx = navTabs.indexOf(activeTab);
      if (idx < navTabs.length - 1) { setActiveTab(navTabs[idx + 1] as typeof activeTab); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }, [navTabs, activeTab]);

  const handlePrevTab = useCallback(() => {
      const idx = navTabs.indexOf(activeTab);
      if (idx > 0) { setActiveTab(navTabs[idx - 1] as typeof activeTab); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }, [navTabs, activeTab]);

  const handleNextTournamentSub = useCallback(() => {
      const subs = ['rounds', 'tables'] as const;
      const idx = subs.indexOf(tournamentSubTab);
      if (idx < subs.length - 1) setTournamentSubTab(subs[idx + 1]);
      else handleNextTab();
  }, [tournamentSubTab, handleNextTab]);

  const handlePrevTournamentSub = useCallback(() => {
      const subs = ['rounds', 'tables'] as const;
      const idx = subs.indexOf(tournamentSubTab);
      if (idx > 0) setTournamentSubTab(subs[idx - 1]);
      else handlePrevTab();
  }, [tournamentSubTab, handlePrevTab]);

  const swipeHandlers = useSwipe({
      onSwipeLeft:  activeTab === 'tournament' ? handleNextTournamentSub : handleNextTab,
      onSwipeRight: activeTab === 'tournament' ? handlePrevTournamentSub : handlePrevTab,
  });

  // LiveTicker only ever surfaces matches that are actually in progress, so a
  // ticker click always means "show me this live match" — no phase branching needed.
  const handleTickerMatchClick = (match: Match) => {
    setActiveTab('tournament');
    setTournamentSubTab('rounds');
    setScheduleJumpMatchId(match.id);
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

  // The single round open for predictions: the earliest League Phase matchday
  // that still has at least one unlocked match. Once every match in a matchday
  // has kicked off/locked, the next matchday becomes current. Historical
  // (locked) and further-future rounds get their own view later — for now the
  // League Phase tab only ever shows this one round.
  const currentMatchday = useMemo(() => {
    const leagueOnly = matches.filter(m => !m.round && m.matchday != null);
    const mdNumbers = [...new Set(leagueOnly.map(m => m.matchday as number))].sort((a, b) => a - b);
    for (const md of mdNumbers) {
        const mdMatches = leagueOnly.filter(m => m.matchday === md);
        if (mdMatches.some(m => !isMatchLocked(m))) return md;
    }
    return mdNumbers[mdNumbers.length - 1] ?? 1;
  }, [matches]);

  // Set of match ids the current user has already predicted — reused by the
  // missing-predictions nudge count and the star progress row alike.
  const userPredMatchIds = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(allPredictions.filter(p => p.userId === user.email).map(p => p.matchId));
  }, [user?.email, allPredictions]);

  // Scoped to the round the user is currently viewing, not the whole season —
  // there's no single "everyone predicts everything now" moment to nag about.
  const missingGroupPredictions = useMemo(() => {
    if (!user) return 0;
    const roundMatchIds = matches.filter(m => !m.round && m.matchday === currentMatchday).map(m => m.id);
    return roundMatchIds.filter(id => !userPredMatchIds.has(id)).length;
  }, [user, matches, currentMatchday, userPredMatchIds]);

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
                  let pts = calculatePoints(pred.home, pred.away, m.homeScore!, m.awayScore!, m.round, resolvePenaltySide(pred.predictedWinnerId, m), resolvePenaltySide(m.penaltyWinnerId, m));
                  if (m.round) pts += calculatePenaltyBonus(pred.home === pred.away, !!m.penaltyWinnerId);
                  return sum + pts;
              }, 0);
              const scoutPenalty = u.spiedMatches?.length ?? 0;
              return { user: u, score: matchPts - scoutPenalty, rank: 0, diff: 0 };
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
  const currentMatchdayMatches = leagueMatchesList.filter(m => m.matchday === currentMatchday);
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

  // Countdown to the soonest lock time still ahead in the current round — "you can no
  // longer enter a score for X once this hits zero." Ticks every 30s, matching the
  // granularity already used for per-match lock countdowns elsewhere in the app.
  const [roundLockTick, setRoundLockTick] = useState(() => Date.now());
  useEffect(() => {
      const id = setInterval(() => setRoundLockTick(Date.now()), 30000);
      return () => clearInterval(id);
  }, []);
  const roundLockCountdownMs = useMemo(() => {
      const soonest = currentMatchdayMatches
          .filter(m => !isMatchLocked(m, roundLockTick))
          .map(m => msUntilLock(m, roundLockTick))
          .filter((ms): ms is number => ms !== null && ms > 0)
          .sort((a, b) => a - b)[0];
      return soonest ?? null;
  }, [currentMatchdayMatches, roundLockTick]);
  const formatRoundCountdown = (ms: number) => {
      const totalMin = Math.floor(ms / 60000);
      const d = Math.floor(totalMin / 1440);
      const h = Math.floor((totalMin % 1440) / 60);
      const m = totalMin % 60;
      if (d > 0) return `${d}d ${h}h`;
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
  };

  const showClearTrash = useMemo(() => {
    if (!user) return false;
    if (activeTab === 'groups') return currentMatchdayMatches.some(m => userPredMatchIds.has(m.id));
    return false;
  }, [activeTab, currentMatchdayMatches, userPredMatchIds, user]);

  const handleClearPredictions = useCallback(async () => {
    if (!user || !supabase) return;
    const query = supabase.from('predictions').delete().eq('user_id', user.email);
    if (activeTab === 'groups') {
       // Only the current round's matches — matches.groupId is a World Cup-era
       // field that's never populated for real League Phase data, so filtering
       // on it here silently cleared nothing while still showing a success toast.
       const roundIds = matches.filter(m => !m.round && m.matchday === currentMatchday).map(m => m.id);
       if (roundIds.length > 0) {
           setAllPredictions(prev => prev.filter(p => p.userId !== user.email || !roundIds.includes(p.matchId)));
           await query.in('match_id', roundIds);
       }
    } else {
        setAllPredictions(prev => prev.filter(p => p.userId !== user.email));
        await query;
    }
    addToast('info', t.predictionsCleared, t.predictionsClearedMsg);
  }, [user, activeTab, matches, currentMatchday]);

  // Auto-fill is relevant wherever there are group predictions left to make.
  const showMagicWand = activeTab === 'groups';

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
        isAdminMode={isAdminMode}
        unassignedCount={unassignedCount}
        onInstallApp={installAction ?? undefined}
        onLinkCopied={() => addToast('success', 'Link copied!', 'Paste it anywhere to invite someone.')}
        navTabs={navTabs} t={t}
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
            scopeKey={currentMatchday}
          />
        )}

        {activeTab === 'rules' && <RulesPage lang={t} matches={matches} currentLocale={currentLocale} tournamentPhase={tournamentPhase} onAdminTrigger={() => setShowAdminLogin(true)} />}
        
        {/* TOURNAMENT HUB */}
        {activeTab === 'tournament' && (
            <div className="flex flex-col h-full animate-fade-in">
                <div className="flex justify-center mb-6">
                   <div className="bg-slate-900/60 p-1 rounded-xl flex gap-1 shadow-inner border border-white/10">
                      {(['rounds', 'tables'] as const).map(sub => (
                         <button key={sub} id={`tour-subnav-${sub}`} onClick={() => setTournamentSubTab(sub)} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${tournamentSubTab === sub ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                            {sub === 'rounds' && <CalendarDays size={14} />}{sub === 'tables' && <ListOrdered size={14} />}{sub === 'rounds' ? (t.subnavRounds || 'Rounds') : t.subnavTables}
                         </button>
                      ))}
                   </div>
                </div>
                {tournamentSubTab === 'rounds' && (
                    <RoundResults
                        matches={matches}
                        teams={teamsData}
                        lang={t}
                        locale={currentLocale}
                        currentUser={user}
                        userPredictions={allPredictions.filter(p => p.userId === user?.email)}
                        onTeamClick={(id) => setViewingTeamId(id)}
                        predictingMatchday={currentMatchday}
                        jumpToMatchId={scheduleJumpMatchId}
                        matchEvents={matchEvents}
                        matchLineups={matchLineups}
                        matchStats={matchStats}
                        playerMatchStats={playerMatchStats}
                        onPlayerClick={(playerId, playerName, teamId) => setPlayerModal({ playerId, playerName, teamId })}
                        onStadiumClick={v => setStadiumVenue(v)}
                    />
                )}
                {tournamentSubTab === 'tables' && (
                    <div className="pb-20 max-w-3xl mx-auto">
                        <div className="bg-blue-950/40 backdrop-blur-md rounded-xl shadow-md border border-white/15 overflow-hidden">
                            <div className="bg-cyan-600 p-3 text-white flex justify-between items-center"><h3 className="font-black uppercase tracking-widest text-sm">{t.groups || 'League Phase'}</h3></div>
                            <StandingsTable standings={calculateLeagueStandings(userMatches, teamsData)} teams={teamsData} lang={t} onTeamClick={(id) => setViewingTeamId(id)} highlightedTeamId={highlightedTeamId} />
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* LEAGUE PHASE TAB — shows only the single round currently open for predictions
            (the earliest matchday with an unlocked match). No browsing other rounds here;
            historical and further-future rounds get their own view later. */}
        {activeTab === 'groups' && (
            <div className="animate-fade-in">
                <div className="flex items-end justify-between mb-4 px-1 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="w-1.5 h-8 rounded-full bg-gradient-to-b from-cyan-400 to-fuchsia-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></span>
                        <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-white leading-none">{t.roundLabel || 'Round'} {currentMatchday}</h1>
                    </div>
                    {roundLockCountdownMs !== null && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 bg-white/10 border border-white/10 rounded-full px-2.5 py-1 flex items-center gap-1.5 shrink-0">
                            <Timer size={11} className="text-amber-400" />
                            {formatRoundCountdown(roundLockCountdownMs)}
                        </span>
                    )}
                </div>
                {currentMatchdayMatches.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                        {currentMatchdayMatches
                            .slice()
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .map(m => {
                                const filled = userPredMatchIds.has(m.id);
                                return (
                                    <Star
                                        key={m.id}
                                        size={16}
                                        strokeWidth={filled ? 1 : 1.5}
                                        className={filled ? 'text-slate-300 fill-slate-300 drop-shadow-[0_0_3px_rgba(203,213,225,0.6)]' : 'text-slate-700'}
                                    />
                                );
                            })}
                    </div>
                )}
                {currentMatchdayMatches.length === 0 && (
                    <div className="rounded-xl border border-white/15 bg-blue-950/40 backdrop-blur-md shadow-sm py-16 text-center mb-6">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No fixtures for this round yet</p>
                    </div>
                )}
                <div className="space-y-4">
                    {currentMatchdayByDay.map(({ day, matches: dayMatches }) => (
                        <div key={day} className="rounded-xl border border-white/10 bg-blue-950/40 backdrop-blur-md overflow-hidden shadow-sm">
                            <div className="px-3 py-1.5 bg-white/5 border-b border-white/10">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{day}</span>
                            </div>
                            <div className="md:grid md:grid-cols-2 md:gap-3 md:p-3">
                                {dayMatches.map(match => (
                                    <MatchRow
                                      key={match.id}
                                      match={match}
                                      homeTeam={teamsData[match.homeTeamId]}
                                      awayTeam={teamsData[match.awayTeamId]}
                                      onUpdate={handleScoreUpdate}
                                      lang={t}
                                      locale={currentLocale}
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
            </div>
        )}

        {/* LEADERBOARD — always the real standings; there's no single moment where
            everyone has "finished predicting" and the board "goes live". */}
        {activeTab === 'leaderboard' && (
            <Leaderboard users={Object.values(usersDb)} matches={matches} allPredictions={allPredictions} lang={t} currentUserEmail={user?.email} currentUserLeagues={user?.leagues} teams={teamsData} onTeamClick={(id) => setViewingTeamId(id)} preloadedAnalysis={dailyBrief} onRefreshBrief={() => { const cacheKey = `rasten_brief_${user.email}_${new Date().toDateString()}`; localStorage.removeItem(cacheKey); runBriefGeneration(); }} briefRefreshing={briefRefreshing} currentLang={language} />
        )}
      </main>

      <LiveTicker
        matches={matches}
        teams={teamsData}
        onMatchClick={handleTickerMatchClick}
        phase={tournamentPhase}
        addToast={addToast}
      />

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

                {/* Risk Profile — same sliders as signup, editable any time. Drives the
                    Magic Wand and the missed-deadline auto-fill for the rest of the season. */}
                <div className="border-t border-white/10 pt-5 mb-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.riskProfileSection}</p>
                        <span className={`text-[9px] font-bold uppercase tracking-wide transition-opacity ${riskSaveState === 'idle' ? 'opacity-0' : 'opacity-100'} ${riskSaveState === 'saved' ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {riskSaveState === 'syncing' ? t.saving : riskSaveState === 'saved' ? t.saved : ''}
                        </span>
                    </div>
                    <div className="space-y-3">
                        <RiskSlider
                            idSuffix="profile-result"
                            value={pendingRiskResult}
                            onChange={setPendingRiskResult}
                            title={t.riskTitle}
                            lowLabel={t.riskBanker} lowIcon="🛡️"
                            midLabel={t.riskBalanced}
                            highLabel={t.riskWildcard} highIcon="⚡"
                            lowDesc={t.riskBankerDesc} midDesc={t.riskBalancedDesc} highDesc={t.riskWildcardDesc}
                        />
                        <RiskSlider
                            idSuffix="profile-scoring"
                            value={pendingRiskScoring}
                            onChange={setPendingRiskScoring}
                            title={t.scoringTitle}
                            lowLabel={t.scoringCagey} lowIcon="🧤"
                            midLabel={t.scoringBalanced}
                            highLabel={t.scoringGoalFest} highIcon="⚽"
                            lowDesc={t.scoringCageyDesc} midDesc={t.scoringBalancedDesc} highDesc={t.scoringGoalFestDesc}
                        />
                    </div>
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
            isOpen={isHelpingHandOpen} onClose={() => setIsHelpingHandOpen(false)} teams={Object.fromEntries(Object.entries(teamsData).filter(([id]) => matches.some(m => m.homeTeamId === id || m.awayTeamId === id)))} initialFavorites={user.favorites} mode="groups" lang={t}
            onGenerate={async (favs, scope, riskLevel) => {
                if (user && supabase) { await supabase.from('profiles').update({ favorites: favs } as any).eq('email', user.email); setUser({ ...user, favorites: favs }); }
                const simulatedMatches = simulateFullTournament(userMatches, teamsData, favs, scope, riskLevel);
                // Only the round currently open for predictions — same restriction as the
                // League Phase tab itself, so the wand can't fill in future or already-locked rounds.
                const relevantMatches = simulatedMatches.filter(m => !m.round && m.matchday === currentMatchday && !isMatchLocked(m));

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