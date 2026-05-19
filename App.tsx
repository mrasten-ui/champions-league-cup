import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, LayoutGrid, CalendarDays, ListOrdered, GitMerge, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { GROUP_CONFIG, TRANSLATIONS, INTRO_VIDEOS, LEAGUES, LEAGUE_DEFAULT_LANGS } from './constants';
import { LanguageCode, UserProfile, Prediction, TournamentPhase, Round } from './types';
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
import { AvatarGenerator } from './components/AvatarGenerator';
import { InstallPrompt } from './components/InstallPrompt';
import { useSwipe } from './hooks/useSwipe';
import { supabase } from './supabase';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { DebugTools } from './components/DebugTools';
import { IntroVideoModal } from './components/IntroVideoModal';
import { TournamentSchedule } from './components/TournamentSchedule';
import { TeamDetailsModal } from './components/TeamDetailsModal';
import { useAppData } from './hooks/useAppData';
import { LoginScreen } from './components/LoginScreen';
import { AppHeader } from './components/AppHeader';
import { PlayerProgress } from './components/PlayerProgress'; 
import { TourGuide } from './components/TourGuide';
import { LiveSplashScreen } from './components/LiveSplashScreen';
import { PRE_SEASON_TOUR, LIVE_SEASON_TOUR } from './components/tourConfig';
import { generateDailyBrief } from './components/analysis/AIAnalystWidget';
import { SecondChanceView } from './components/SecondChanceView';
import { KnockoutReminderModal } from './components/KnockoutReminderModal';
import { GoalBanner, GoalNotification } from './components/GoalBanner';

const STORAGE_KEYS = {
  CURRENT_USER: 'rasten_cup_active_user_v2',
  TOUR_COMPLETED_PREFIX: 'rasten_cup_tour_done_v1_',
  AUTO_FILLED_PREFIX: 'rasten_autofill_v1_',
  KNOCKOUT_COMPLETION_TIME_PREFIX: 'rasten_knockout_done_v1_',
  KNOCKOUT_REMINDER_LAST_SHOWN_PREFIX: 'rasten_knockout_reminder_v1_',
};

export const App = () => {
  const {
    session, user, setUser, loading, matches, setMatches, teamsData,
    allPredictions, setAllPredictions, usersDb, setUsersDb, menPresets, womenPresets,
    groupStageEndTime, knockoutStartTime, lockTimePassed, matchEvents,
  } = useAppData();

  const [activeTab, setActiveTab] = useState<'groups' | 'knockout' | 'leaderboard' | 'manager' | 'tournament' | 'analysis' | 'rules'>('groups');
  const [tournamentSubTab, setTournamentSubTab] = useState<'schedule' | 'tables' | 'bracket'>('schedule');
  const [showOverview, setShowOverview] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>('A');
  const [activeKnockoutRound, setActiveKnockoutRound] = useState<Round>('R32'); 
  
  const [language, setLanguage] = useState<LanguageCode>('EN');
  const [leagueLangs, setLeagueLangs] = useState<Record<string, LanguageCode>>(LEAGUE_DEFAULT_LANGS);
  const [adminPhaseOverride, setAdminPhaseOverride] = useState<TournamentPhase | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isHelpingHandOpen, setIsHelpingHandOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
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
  const [showLiveTour, setShowLiveTour] = useState(false);
  const [showLiveSplash, setShowLiveSplash] = useState(false);
  const [showKnockoutReminder, setShowKnockoutReminder] = useState(false);
  const [goalNotification, setGoalNotification] = useState<GoalNotification | null>(null);
  const seenEventIdsRef = useRef<Set<number> | null>(null);
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
      window.history.replaceState({}, '', window.location.pathname);
      const defaultLang = LEAGUE_DEFAULT_LANGS[invite];
      if (defaultLang) setLanguage(defaultLang);
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
    supabase.from('settings').select('value').eq('key', 'league_langs').maybeSingle()
      .then(({ data }) => {
        if (!data?.value) return;
        const overrides = data.value as Record<string, LanguageCode>;
        setLeagueLangs(prev => ({ ...prev, ...overrides }));
        const pendingInvite = sessionStorage.getItem('pending_league_invite');
        if (pendingInvite && overrides[pendingInvite]) setLanguage(overrides[pendingInvite]);
      })
      .catch(() => { /* settings table not yet created — silently ignore */ });
  }, []);

  // --- HELPERS ---
  const addToast = (type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, title, message }]);
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

  // --- CORE LOGIC WITH 3-STAGE SECOND CHANCE OVERRIDE ---
  const userMatches = useMemo(() => {
      if (!user) return matches;
      let userSpecificPreds = allPredictions.filter(p => p.userId === user.email);

      const isDraftingWindow = user.secondChanceStatus === 'PENDING' && groupStageEndTime > 0 && Date.now() >= groupStageEndTime;

      // If they activated OR are currently drafting, ignore their group predictions
      if (user.hasTakenSecondChance || isDraftingWindow) {
          const groupMatchIds = new Set(matches.filter(m => m.groupId).map(m => m.id));
          userSpecificPreds = userSpecificPreds.filter(p => !groupMatchIds.has(p.matchId));
      }
      return applyPredictionsToBracket(matches, teamsData, userSpecificPreds);
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

  // --- ACTIONS ---
  const handleLogout = async () => {
      if (supabase) await supabase.auth.signOut();
      setUser(null); setIsProfileMenuOpen(false);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      addToast('info', t.loggedOutTitle, t.loggedOutMsg);
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
    if (!match || (match.isLocked && !isWhitelisted)) return;
    
    const newPred = { userId: user.email, matchId, home: Number(h), away: Number(a) };
    setAllPredictions(prev => {
        const idx = prev.findIndex(p => p.userId === user.email && p.matchId === matchId);
        if (idx > -1) { const copy = [...prev]; copy[idx] = newPred; return copy; }
        return [...prev, newPred];
    });

    const { error: predError } = await supabase.from('predictions').upsert({ user_id: user.email, match_id: matchId, home: Number(h), away: Number(a) } as any, { onConflict: 'user_id,match_id' });
    if (predError) addToast('error', t.saveFailed, t.saveFailedMsg);

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
      setUser({ ...user, substitutions: newSubs, unlockedMatches: newUnlocked });
      const { error: subError } = await supabase.from('profiles').update({ substitutions: newSubs, unlocked_matches: newUnlocked } as any).eq('email', user.email);
      if (subError) addToast('error', t.saveFailed, t.saveFailedMsg);
      else addToast('success', t.subSuccess, `${t.substitutions}: ${newSubs} left`);
  };

  // --- STAGE 1: PLEDGE ---
  const handlePledgeSecondChance = async () => {
      if (!user || !supabase) return;
      if (window.confirm(t.secondChanceConfirm)) {
          setUser({ ...user, secondChanceStatus: 'PENDING' });
          await supabase.from('profiles').update({ second_chance_status: 'PENDING' } as any).eq('email', user.email);
          addToast('info', t.pledgeLocked, t.pledgeToastMsg);
          setActiveTab('knockout');
      }
  };

  // --- STAGE 3: LOCK IN ---
  const handleLockInSecondChance = async () => {
      if (!user || !supabase) return;
      if (window.confirm(t.lockInConfirm)) {
          setUser({ ...user, secondChanceStatus: 'ACTIVE', hasTakenSecondChance: true });
          await supabase.from('profiles').update({ second_chance_status: 'ACTIVE', has_taken_second_chance: true } as any).eq('email', user.email);
          addToast('success', t.bracketLockedIn, t.bracketLockedInMsg);
      }
  };

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
      if (user && tournamentPhase === 'LIVE' && !user.toursCompleted?.liveSeason && !localLiveTourCompleted) {
          const timer = setTimeout(() => setShowLiveSplash(true), 1500);
          return () => clearTimeout(timer);
      }
  }, [user, tournamentPhase]);

  const handleSplashDone = () => {
      setShowLiveSplash(false);
      setTimeout(() => setShowLiveTour(true), 300);
  };

  // Auto-fill predictions for late-joining users in LIVE phase
  useEffect(() => {
      if (!user || !supabase || tournamentPhase !== 'LIVE') return;
      if (!matches.length || !Object.keys(teamsData).length) return;
      const alreadyFilled = localStorage.getItem(STORAGE_KEYS.AUTO_FILLED_PREFIX + user.email);
      if (alreadyFilled) return;

      const groupMatches = matches.filter(m => m.groupId);
      const userGroupPreds = allPredictions.filter(p => p.userId === user.email && groupMatches.some(m => m.id === p.matchId));

      // Only auto-fill if fewer than 20% of group matches are predicted
      if (userGroupPreds.length > groupMatches.length * 0.2) return;

      const simulated = simulateFullTournament(matches, teamsData, user.favorites || [], 'GROUPS');
      const toSave = simulated
          .filter(m => m.groupId && m.homeScore !== null && m.awayScore !== null
              && !userGroupPreds.some(p => p.matchId === m.id))
          .map(m => ({ user_id: user.email, match_id: m.id, home: m.homeScore!, away: m.awayScore! }));

      if (toSave.length === 0) return;

      supabase.from('predictions').upsert(toSave, { onConflict: 'user_id,match_id' }).then(({ error }) => {
          if (!error) {
              localStorage.setItem(STORAGE_KEYS.AUTO_FILLED_PREFIX + user.email, '1');
              setAllPredictions(prev => {
                  const others = prev.filter(p => p.userId !== user.email);
                  const kept = prev.filter(p => p.userId === user.email && !toSave.some(s => s.match_id === p.matchId));
                  return [...others, ...kept, ...toSave.map(p => ({ userId: p.user_id, matchId: p.match_id, home: p.home, away: p.away }))];
              });
              addToast('success', "You're in the game!", `We filled ${toSave.length} predictions so you can still compete.`);
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
      if (stepId === 'match_card' && activeTab !== 'groups') { setActiveTab('groups'); setActiveGroup('A'); }
      else if (stepId === 'groups_nav' && activeTab !== 'groups') setActiveTab('groups');
      else if (stepId === 'knockout_tab') { setActiveTab('knockout'); setActiveKnockoutRound('R32'); }
      else if (stepId === 'rules_tab') setActiveTab('rules');
      else if (stepId === 'profile_menu') { setActiveTab('groups'); setActiveGroup('A'); }
  };

  const handleLiveTourNavigation = (stepId: string) => {
      if (stepId === 'live_leaderboard') setActiveTab('leaderboard');
      else if (stepId === 'live_rules') setActiveTab('rules');
      else if (stepId === 'live_tournament') { setActiveTab('tournament'); setTournamentSubTab('schedule'); }
      else if (stepId === 'live_manager') setActiveTab('manager');
      else if (stepId === 'live_analysis') setActiveTab('analysis');
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
  const handlePrevRound = () => {
    const idx = ROUND_ORDER.indexOf(activeKnockoutRound);
    if (idx > 0) { setActiveKnockoutRound(ROUND_ORDER[idx - 1]); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else setActiveTab('groups');
  };
  const handleNextRound = () => {
      const idx = ROUND_ORDER.indexOf(activeKnockoutRound);
      if (idx < ROUND_ORDER.length - 1) { setActiveKnockoutRound(ROUND_ORDER[idx + 1]); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      else setActiveTab('leaderboard');
  };

  const swipeHandlers = useSwipe({ onSwipeLeft: activeTab === 'groups' ? handleNextGroup : () => {}, onSwipeRight: activeTab === 'groups' ? handlePrevGroup : () => {} });
  const handleGoToGroup = (groupId: string) => { setActiveGroup(groupId); setActiveTab('groups'); setShowOverview(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  
  const navTabs = useMemo(() => {
      if (tournamentPhase === 'PRE_LIVE') return ['groups', 'knockout', 'leaderboard', 'rules'];
      return ['leaderboard', 'tournament', 'manager', 'analysis', 'rules'];
  }, [tournamentPhase]);

  useEffect(() => {
      const liveTabs = ['leaderboard', 'tournament', 'manager', 'analysis', 'rules'];
      if (tournamentPhase === 'LIVE' && !liveTabs.includes(activeTab)) {
          setActiveTab('tournament');
      }
  }, [tournamentPhase]);

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

  const handleKnockoutReminderDismiss = (goToKnockouts: boolean) => {
      if (user) localStorage.setItem(STORAGE_KEYS.KNOCKOUT_REMINDER_LAST_SHOWN_PREFIX + user.email, Date.now().toString());
      setShowKnockoutReminder(false);
      if (goToKnockouts) setActiveTab('knockout');
  };

  // --- GOAL BANNER ---
  // First time matchEvents arrives (initial DB load), mark all as seen — don't notify.
  // Any new INSERT after that fires the banner.
  useEffect(() => {
    if (seenEventIdsRef.current === null) {
      seenEventIdsRef.current = new Set(matchEvents.map(e => e.id));
      return;
    }
    const newGoals = matchEvents.filter(
      e => e.type === 'Goal' && !seenEventIdsRef.current!.has(e.id)
    );
    newGoals.forEach(e => seenEventIdsRef.current!.add(e.id));
    if (newGoals.length > 0 && !goalNotification) {
      const goal = newGoals[0];
      const match = matches.find(m => m.id === goal.matchId);
      if (match && match.homeScore !== null && match.awayScore !== null) {
        setGoalNotification({
          eventId: goal.id,
          teamId: goal.teamId || '',
          player: goal.player,
          detail: goal.detail,
          minute: goal.minute,
          minuteExtra: goal.minuteExtra,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
        });
      }
    }
  }, [matchEvents]);

  const rivalsList = useMemo(() => (Object.values(usersDb) as UserProfile[]).filter(u => u.email !== user?.email), [usersDb, user]);

  // --- DAILY BRIEF: Pre-generate on login, cache per user per day ---
  const runBriefGeneration = async () => {
      if (!user || !matches.length || !Object.keys(teamsData).length || !allPredictions) return;
      const cacheKey = `rasten_brief_${user.email}_${new Date().toDateString()}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setDailyBrief(cached); return; }
      setBriefRefreshing(true);
      try {
          const allUsers = [user, ...rivalsList];
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
      (tournamentPhase === 'PRE_LIVE' && activeTab !== 'leaderboard' && activeTab !== 'manager' && activeTab !== 'analysis') ||
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-32 md:pb-12 relative">
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
        onStartLiveTour={() => setShowLiveTour(true)}
        showSecondChanceBadge={
            tournamentPhase === 'LIVE' &&
            !user?.hasTakenSecondChance &&
            user?.secondChanceStatus === 'NONE' &&
            groupStageEndTime > 0 &&
            Date.now() >= groupStageEndTime - 7 * 24 * 60 * 60 * 1000 &&
            Date.now() < groupStageEndTime
        }
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

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {activeTab === 'analysis' && <AnalysisDashboard currentUser={user} rivals={rivalsList} matches={matches} allPredictions={allPredictions} teams={teamsData} lang={t} currentLang={language} onTeamClick={(id) => setViewingTeamId(id)} />}
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
                {tournamentSubTab === 'schedule' && <TournamentSchedule matches={matches} teams={teamsData} userPredictions={allPredictions.filter(p => p.userId === user?.email)} user={user} lang={t} currentLang={language} onTeamClick={(id) => setViewingTeamId(id)} onJumpToTable={handleJumpToTable} onJumpToBracket={handleJumpToBracket} />}
                {tournamentSubTab === 'tables' && (
                    <div className="pb-20 max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-1">
                            {GROUP_CONFIG.map(g => (
                                <div key={g.id} id={`group-card-${g.id}`} className="w-full">
                                    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden h-full">
                                        <div className="bg-[#0f2545] p-3 text-white flex justify-between items-center"><h3 className="font-black uppercase tracking-widest text-sm">{t.groups} {g.id}</h3></div>
                                        <StandingsTable standings={calculateGroupStandings(g.id, matches, teamsData)} teams={teamsData} lang={t} compact={true} onTeamClick={(id) => setViewingTeamId(id)} highlightedTeamId={highlightedTeamId} qualifiedThirds={officialQualifiedThirds} />
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
        {activeTab === 'groups' && tournamentPhase === 'PRE_LIVE' && (
            <div {...swipeHandlers} className="animate-fade-in touch-pan-y">
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
                                onSubstitute={() => handleSubstitute(match.id)}
                                substitutionsLeft={user?.substitutions || 0}
                                isUnlockedBySub={user?.unlockedMatches?.includes(match.id) || false}
                                onTeamClick={(id) => setViewingTeamId(id)}
                                showStatusBadge={false}
                                context="groups"
                                events={matchEvents.filter(e => e.matchId === match.id)}
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
                        matches={userMatches} teams={teamsData} onUpdate={handleScoreUpdate} lang={t} user={user} 
                        onPledge={handlePledgeSecondChance} onLockIn={handleLockInSecondChance} rivals={rivalsList} 
                        allPredictions={allPredictions} phase={tournamentPhase} onTeamClick={setViewingTeamId} 
                        onSpy={handleSpy} revealedRivals={user?.spiedMatches || []} groupStageEndTime={groupStageEndTime} knockoutStartTime={knockoutStartTime} 
                    />
                ) : (
                    <KnockoutBracket 
                        matches={userMatches} teams={teamsData} onUpdate={handleScoreUpdate} lang={t} user={user} 
                        onSecondChance={handlePledgeSecondChance} rivals={rivalsList} allPredictions={allPredictions} phase={tournamentPhase} 
                        isGroupStageComplete={isGroupStageComplete || showTour} firstIncompleteGroup={firstIncompleteGroup} onGoToGroup={handleGoToGroup} 
                        onTeamClick={setViewingTeamId} onSpy={handleSpy} revealedRivals={user?.spiedMatches || []} activeRound={activeKnockoutRound}
                        matchEvents={matchEvents}
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
                    <PlayerProgress users={Object.values(usersDb)} allPredictions={allPredictions} totalMatches={totalMatchesCount} lang={t} currentUserLeagues={user.leagues} currentUserEmail={user?.email} />
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
                teams={teamsData}
                allPredictions={allPredictions}
                currentUser={user}
                allUsers={Object.values(usersDb) as UserProfile[]}
                lang={t}
                onSubstitute={handleSubstitute}
                onUnlockSecondChance={handlePledgeSecondChance}
                onUpdate={handleScoreUpdate}
                phase={tournamentPhase}
                groupStageEndTime={groupStageEndTime}
                knockoutStartTime={knockoutStartTime}
            />
        )}
      </main>

      <TourGuide steps={PRE_SEASON_TOUR} isOpen={showTour} onComplete={handleTourComplete} langCode={language} onStepChange={handleTourNavigation} />
      <TourGuide steps={LIVE_SEASON_TOUR} isOpen={showLiveTour} onComplete={handleLiveTourComplete} langCode={language} onStepChange={handleLiveTourNavigation} defaultMode="text" />
      <LiveSplashScreen isOpen={showLiveSplash} onDone={handleSplashDone} langCode={language} />
      <KnockoutReminderModal isOpen={showKnockoutReminder} onDismiss={handleKnockoutReminderDismiss} langCode={language} />
      <GoalBanner
        notification={goalNotification}
        homeTeam={goalNotification ? teamsData[goalNotification.homeTeamId] : undefined}
        awayTeam={goalNotification ? teamsData[goalNotification.awayTeamId] : undefined}
        scoringTeam={goalNotification ? teamsData[goalNotification.teamId] : undefined}
        onDismiss={() => setGoalNotification(null)}
      />

      {showAvatarEditor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setShowAvatarEditor(false)}></div>
            <div className="relative w-full max-w-md bg-[#0f2545] border border-white/10 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-white uppercase tracking-tighter italic">{t.changeIdentity}</h3><button onClick={() => setShowAvatarEditor(false)} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10"><X size={20} /></button></div>
                <AvatarGenerator onGenerate={updateAvatar} lang={t} menAvatars={menPresets} womenAvatars={womenPresets} currentAvatar={user.avatar} disableAutoAssign={true} />
                <button onClick={() => setShowAvatarEditor(false)} className="w-full mt-6 py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors border-t border-white/5">{t.cancelBtn}</button>
            </div>
        </div>
      )}

      <DebugTools
        isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)}
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
            onGenerate={async (favs, scope) => {
                if (user && supabase) { await supabase.from('profiles').update({ favorites: favs } as any).eq('email', user.email); setUser({ ...user, favorites: favs }); }
                const safeScope = (getSimMode() === 'knockout') ? 'KNOCKOUT' : 'GROUPS';
                const simulatedMatches = simulateFullTournament(userMatches, teamsData, favs, safeScope);
                const relevantMatches = simulatedMatches.filter(m => { if (safeScope === 'GROUPS') return !!m.groupId; if (safeScope === 'KNOCKOUT') return !!m.round; return true; });

                if (user && supabase) {
                    const predictionsToSave = relevantMatches.filter(m => m.homeScore !== null && m.awayScore !== null).map(m => ({ user_id: user.email, match_id: m.id, home: m.homeScore, away: m.awayScore }));
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

      {showMagicWand && <MagicWand onOpen={() => setIsHelpingHandOpen(true)} onClear={handleClearPredictions} showClear={showClearTrash} lang={t} isTourActive={showTour} />}
      {viewingTeamId && teamsData[viewingTeamId] && <TeamDetailsModal team={teamsData[viewingTeamId]} isOpen={true} onClose={() => setViewingTeamId(null)} lang={t} currentLang={language} />}


    </div>
  );
};

export default App;