import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, LayoutGrid, CalendarDays, ListOrdered, GitMerge, ChevronRight, ChevronLeft, X, ScanEye, Mic } from 'lucide-react';
import { GROUP_CONFIG, TRANSLATIONS, INTRO_VIDEOS, LEAGUES } from './constants';
import { LanguageCode, UserProfile, Prediction, TournamentPhase, Round } from './types';
import { 
  calculateGroupStandings, 
  simulateFullTournament, 
  applyPredictionsToBracket, 
  simulateTournamentAtDate,
  getAllGroupStandings, 
  getThirdPlaceStandings,
  updateBracket
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
import { RulesModal } from './components/RulesModal';
import { ScoutingCenter } from './components/ScoutingCenter';
import { AvatarGenerator } from './components/AvatarGenerator';
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
import { PRE_SEASON_TOUR } from './components/tourConfig';
import { StudioGenerator } from './components/StudioGenerator';
import { SecondChanceView } from './components/SecondChanceView';

const STORAGE_KEYS = { 
  CURRENT_USER: 'rasten_cup_active_user_v2',
  TOUR_COMPLETED_PREFIX: 'rasten_cup_tour_done_v1_' 
};

export const App = () => {
  const {
    session, user, setUser, loading, matches, setMatches, teamsData,
    allPredictions, setAllPredictions, usersDb, setUsersDb, menPresets, womenPresets,
    groupStageEndTime, knockoutStartTime
  } = useAppData();

  const [activeTab, setActiveTab] = useState<'groups' | 'knockout' | 'leaderboard' | 'manager' | 'tournament' | 'analysis' | 'scouting'>('groups');
  const [tournamentSubTab, setTournamentSubTab] = useState<'schedule' | 'tables' | 'bracket'>('schedule');
  const [showOverview, setShowOverview] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>('A');
  const [activeKnockoutRound, setActiveKnockoutRound] = useState<Round>('R32'); 
  
  const [language, setLanguage] = useState<LanguageCode>('EN');
  const [tournamentPhase, setTournamentPhase] = useState<TournamentPhase>('PRE_LIVE');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isHelpingHandOpen, setIsHelpingHandOpen] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);

  const [highlightedTeamId, setHighlightedTeamId] = useState<string | null>(null);
  const [highlightedMatchId, setHighlightedMatchId] = useState<string | null>(null);

  const [showTour, setShowTour] = useState(false);
  const [showStudio, setShowStudio] = useState(false); 

  const t = TRANSLATIONS[language];
  const localeMap: Record<LanguageCode, string> = { EN: 'en-GB', US: 'en-US', NO: 'no-NO', SCO: 'en-GB' };
  const currentLocale = localeMap[language];

  // --- INVITE LINK HANDLER ---
  // Reads ?invite=slug from URL on first load and stores in sessionStorage.
  // The league-join useEffect below picks it up once the user is authenticated.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      sessionStorage.setItem('pending_league_invite', invite);
      window.history.replaceState({}, '', window.location.pathname);
    }
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
      if (user.hasTakenSecondChance || user.secondChanceStatus === 'ACTIVE' || isDraftingWindow) {
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
    await supabase.from('profiles').update({ avatar: finalUrl } as any).eq('email', user.email);
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
      const isStarted = match && ['LIVE', 'HT', 'FINISHED', 'FT', 'AET', 'PEN', '1H', '2H'].includes(match.status);
      
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
              if (singleInvite && !existing.includes(singleInvite)) toAdd.push(singleInvite);

              // Multi-league signup picker
              const multiRaw = sessionStorage.getItem('pending_leagues_signup');
              if (multiRaw) {
                  try {
                      const multi: string[] = JSON.parse(multiRaw);
                      multi.forEach(slug => { if (!existing.includes(slug) && !toAdd.includes(slug)) toAdd.push(slug); });
                  } catch { /* malformed JSON, ignore */ }
              }

              if (toAdd.length > 0) {
                  const newLeagues = [...existing, ...toAdd];
                  await supabase.from('profiles').update({ leagues: newLeagues } as any).eq('email', user.email);
                  setUser({ ...user, leagues: newLeagues });
                  addToast('success', t.leagueJoined, toAdd.map(s => LEAGUES[s] || s).join(', '));
                  sessionStorage.removeItem('pending_league_invite');
                  sessionStorage.removeItem('pending_leagues_signup');
              }
          }
      };
      checkPendingLeague();
  }, [user]);

  // --- TOUR GUIDE CONTROLS ---
  useEffect(() => {
      const localTourCompleted = user?.email ? localStorage.getItem(STORAGE_KEYS.TOUR_COMPLETED_PREFIX + user.email) : null;
      if (user && tournamentPhase === 'PRE_LIVE' && !user.toursCompleted?.preSeason && !localTourCompleted) {
          const timer = setTimeout(() => setShowTour(true), 1500); 
          return () => clearTimeout(timer);
      }
  }, [user, tournamentPhase]);

  const handleTourComplete = async () => {
      setShowTour(false);
      if (user?.email) localStorage.setItem(STORAGE_KEYS.TOUR_COMPLETED_PREFIX + user.email, 'true');
      if (user && supabase) {
          const newTours = { ...(user.toursCompleted || { liveSeason: false }), preSeason: true };
          setUser({ ...user, toursCompleted: newTours });
          await supabase.from('profiles').update({ tours_completed: newTours } as any).eq('email', user.email);
      }
  };

  const handleTourNavigation = (stepId: string) => {
      if (stepId === 'match_card' && activeTab !== 'groups') { setActiveTab('groups'); setActiveGroup('A'); } 
      else if (stepId === 'groups_nav' && activeTab !== 'groups') setActiveTab('groups');
      else if (stepId === 'knockout_tab' && activeTab !== 'knockout') setActiveTab('knockout');
      else if (stepId === 'profile_menu' && activeTab !== 'groups') { setActiveTab('groups'); setActiveGroup('A'); }
  };

  const groupStageMatches = useMemo(() => matches.filter(m => m.groupId), [matches]);
  const userGroupPredictionsCount = useMemo(() => user ? allPredictions.filter(p => p.userId === user.email && groupStageMatches.some(gm => gm.id === p.matchId)).length : 0, [allPredictions, user, groupStageMatches]);
  const isGroupStageComplete = userGroupPredictionsCount === groupStageMatches.length && groupStageMatches.length > 0;
  
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

  const ROUND_ORDER: Round[] = ['R32', 'R16', 'QF', 'SF', 'FIN'];
  const handlePrevRound = () => {
    const idx = ROUND_ORDER.indexOf(activeKnockoutRound);
    if (idx > 0) { setActiveKnockoutRound(ROUND_ORDER[idx - 1]); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else setActiveTab('groups');
  };
  const handleNextRound = () => {
      const idx = ROUND_ORDER.indexOf(activeKnockoutRound);
      if (idx < ROUND_ORDER.length - 1) { setActiveKnockoutRound(ROUND_ORDER[idx + 1]); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      else setActiveTab('scouting'); 
  };

  const swipeHandlers = useSwipe({ onSwipeLeft: activeTab === 'groups' ? handleNextGroup : () => {}, onSwipeRight: activeTab === 'groups' ? handlePrevGroup : () => {} });
  const handleGoToGroup = (groupId: string) => { setActiveGroup(groupId); setActiveTab('groups'); setShowOverview(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  
  const navTabs = useMemo(() => {
      if (tournamentPhase === 'PRE_LIVE') return ['groups', 'knockout', 'scouting', 'leaderboard'];
      return ['leaderboard', 'tournament', 'manager', 'analysis'];
  }, [tournamentPhase]);

  const rivalsList = useMemo(() => (Object.values(usersDb) as UserProfile[]).filter(u => u.email !== user?.email), [usersDb, user]);
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
       setAllPredictions(prev => prev.filter(p => p.userId !== user.email));
       await query; 
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
      (tournamentPhase === 'PRE_LIVE' && activeTab !== 'leaderboard' && activeTab !== 'manager' && activeTab !== 'scouting' && activeTab !== 'analysis') ||
      (tournamentPhase === 'LIVE' && user?.hasTakenSecondChance && (activeTab === 'knockout'))
  );

  const getSimMode = (): 'knockout' | 'groups' => {
      if (activeTab === 'knockout') return 'knockout';
      if (activeTab === 'tournament' && tournamentSubTab === 'bracket') return 'knockout';
      return 'groups';
  };

  if (loading) return <div className="min-h-screen bg-[#05101c] flex items-center justify-center text-white"><div className="flex flex-col items-center gap-4"><RefreshCw className="animate-spin text-blue-500" size={32} /><div className="text-xs font-black uppercase tracking-widest opacity-60">Initializing...</div></div></div>;

  if (showStudio) return <StudioGenerator />;

  if (!user || !session) {
      const usedAvatarUrls = Object.values(usersDb).map(u => u.avatar);
      const getAvailable = (all: string[]) => {
          const unused = all.filter(url => !usedAvatarUrls.includes(url));
          return unused.length > 0 ? unused : all;
      };
      return <LoginScreen onSuccess={() => supabase.auth.getSession().then(({ data }) => { if (data.session?.user?.email) window.location.reload(); })} currentLang={language} setLang={(l) => setLanguage(l)} isLoading={loading} onLogin={async () => {}} menPresets={getAvailable(menPresets).slice(0,5)} womenPresets={getAvailable(womenPresets).slice(0,5)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-32 md:pb-12 relative">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <IntroVideoModal isOpen={showIntroModal} videoSrc={introVideoUrl} onClose={() => setShowIntroModal(false)} />

      <AppHeader 
        user={user} language={language} setLanguage={handleLanguageSwitch} tournamentPhase={tournamentPhase} setTournamentPhase={setTournamentPhase}
        activeTab={activeTab} setActiveTab={setActiveTab} activeGroup={activeGroup} setActiveGroup={setActiveGroup}
        showOverview={showOverview} setShowOverview={setShowOverview} isProfileMenuOpen={isProfileMenuOpen} setIsProfileMenuOpen={setIsProfileMenuOpen}
        setShowAvatarEditor={setShowAvatarEditor} setIsDebugOpen={setIsDebugOpen} setShowRules={setShowRules} handleLogout={handleLogout}
        onReplayIntro={handleReplayIntro}
        onStartTour={() => setShowTour(true)} 
        navTabs={navTabs} t={t} matches={matches} teamsData={teamsData} allPredictions={allPredictions}
        activeKnockoutRound={activeKnockoutRound} setActiveKnockoutRound={setActiveKnockoutRound}
      />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'analysis' && <AnalysisDashboard currentUser={user} rivals={rivalsList} matches={matches} allPredictions={allPredictions} teams={teamsData} lang={t} currentLang={language} onTeamClick={(id) => setViewingTeamId(id)} />}
        {activeTab === 'scouting' && <ScoutingCenter teams={teamsData} lang={t} currentLang={language} />}
        
        {/* TOURNAMENT HUB */}
        {activeTab === 'tournament' && (
            <div className="flex flex-col h-full animate-fade-in">
                <div className="flex justify-center mb-6">
                   <div className="bg-slate-200 p-1 rounded-xl flex gap-1 shadow-inner border border-slate-300">
                      {(['schedule', 'tables', 'bracket'] as const).map(sub => (
                         <button key={sub} onClick={() => setTournamentSubTab(sub)} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${tournamentSubTab === sub ? 'bg-[#0f2545] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-300/50'}`}>
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
                              />
                          ))}
                      </div>
                      <div className="mt-12 flex flex-col items-center gap-4">
                          <div className="flex gap-3 w-full max-w-lg">
                              {activeGroup !== 'A' && <button onClick={handlePrevGroup} className="flex-1 px-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"><ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /><span>{t.prevGroup}</span></button>}
                              {activeGroup !== 'L' ? <button onClick={handleNextGroup} className="flex-[2] px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl shadow-lg font-black uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"><span>{t.nextGroup}</span><ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></button> : <div className="flex-[2] flex gap-2"><button onClick={() => setShowOverview(true)} className="flex-1 px-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-blue-600 font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><LayoutGrid size={18} /> {t.tablesBtn}</button><button onClick={() => setActiveTab('knockout')} className="flex-1 px-4 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl shadow-lg font-black uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">{t.bracketBtn} <ChevronRight size={18} /></button></div>}
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
                    />
                )}
                <div className="mt-8 flex justify-center pb-8">
                     <div className="flex gap-3 w-full max-w-lg">
                        <button onClick={handlePrevRound} className="flex-1 px-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"><ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /><span>{activeKnockoutRound === 'R32' ? t.groups : t.prevRound}</span></button>
                        {activeKnockoutRound !== 'FIN' ? (
                            <button onClick={handleNextRound} className="flex-[2] px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl shadow-lg font-black uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"><span>{t.nextRound}</span><ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></button>
                        ) : (
                            <button onClick={() => setActiveTab('scouting')} className="flex-[2] px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl shadow-lg font-black uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"><span>{t.scoutBtn}</span><ScanEye size={18} /></button>
                        )}
                     </div>
                </div>
            </div>
        )}
        
        {/* LEADERBOARD */}
        {activeTab === 'leaderboard' && (
            <>
                {tournamentPhase === 'PRE_LIVE' ? (
                    <PlayerProgress users={Object.values(usersDb)} allPredictions={allPredictions} totalMatches={totalMatchesCount} lang={t} currentUserLeagues={user.leagues} />
                ) : (
                    <Leaderboard users={Object.values(usersDb)} matches={matches} allPredictions={allPredictions} lang={t} currentUserEmail={user?.email} currentUserLeagues={user?.leagues} teams={teamsData} onTeamClick={(id) => setViewingTeamId(id)} />
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
                lang={t} 
                onSubstitute={handleSubstitute}
                onUnlockSecondChance={handlePledgeSecondChance}
                onUpdate={handleScoreUpdate}
                phase={tournamentPhase} 
            />
        )}
      </main>

      <TourGuide steps={PRE_SEASON_TOUR} isOpen={showTour} onComplete={handleTourComplete} langCode={language} onStepChange={handleTourNavigation} />

      {showAvatarEditor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setShowAvatarEditor(false)}></div>
            <div className="relative w-full max-w-md bg-[#0f2545] border border-white/10 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-white uppercase tracking-tighter italic">{t.changeIdentity}</h3><button onClick={() => setShowAvatarEditor(false)} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10"><X size={20} /></button></div>
                <AvatarGenerator onGenerate={updateAvatar} lang={t} menAvatars={menPresets} womenAvatars={womenPresets} currentAvatar={user.avatar} />
                <button onClick={() => setShowAvatarEditor(false)} className="w-full mt-6 py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors border-t border-white/5">{t.cancelBtn}</button>
            </div>
        </div>
      )}

      <DebugTools
        isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} onSeed={() => {}}
        onSimulateGroups={() => { const s = simulateFullTournament(matches, teamsData, user?.favorites || [], 'GROUPS'); setMatches(s); addToast('success', 'Groups Simulated'); }}
        onSimulateKnockouts={() => { const s = simulateFullTournament(matches, teamsData, user?.favorites || [], 'KNOCKOUT'); setMatches(s); addToast('success', 'Knockouts Simulated'); }}
        onClear={() => { localStorage.clear(); window.location.reload(); }}
        onTimeTravel={handleTimeTravel}
        onStressTest={() => { addToast('info', 'Stress Test', 'Functionality placeholder'); }}
        isAdminMode={isAdminMode} onToggleAdmin={() => setIsAdminMode(!isAdminMode)}
        lang={t} users={Object.values(usersDb) as UserProfile[]} predictions={allPredictions} matches={matches}
        onUpdateUserLeagues={async (email, leagues) => {
          if (!supabase) return;
          await supabase.from('profiles').update({ leagues } as any).eq('email', email);
          setUsersDb(prev => ({ ...prev, [email]: { ...prev[email], leagues } }));
          if (user?.email === email) setUser(prev => prev ? { ...prev, leagues } : null);
        }}
      />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} lang={t} />
      
      {isHelpingHandOpen && user && (
        <HelpingHandModal 
            isOpen={isHelpingHandOpen} onClose={() => setIsHelpingHandOpen(false)} teams={teamsData} initialFavorites={user.favorites} mode={getSimMode()} lang={t}
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

      <button onClick={() => setShowStudio(true)} className="fixed bottom-4 left-4 z-[9999] bg-slate-900/50 hover:bg-slate-900 text-white/50 hover:text-white p-2 rounded-full backdrop-blur-sm transition-all shadow-lg" title="Open Audio Studio"><Mic size={16} /></button>

    </div>
  );
};

export default App;