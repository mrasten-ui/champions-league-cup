import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Trophy, LayoutGrid, ListOrdered, ChevronRight, ChevronLeft, RefreshCw, CalendarDays, GitMerge 
} from 'lucide-react';

import { 
  TEAMS as INITIAL_TEAMS, 
  INITIAL_MATCHES, 
  TRANSLATIONS, 
  GROUP_CONFIG, 
  MOCK_PREDICTIONS, 
  INTRO_VIDEOS 
} from './constants';

import { 
  Match, LanguageCode, UserProfile, Prediction, TournamentPhase, Team 
} from './types';

import { 
  calculateGroupStandings, 
  updateBracket, 
  simulateFullTournament, 
  applyPredictionsToBracket, 
  simulateTournamentAtDate, 
  fetchAllTeamRanks 
} from './services/engine';

// COMPONENTS
import { MatchCard } from './components/MatchCard';
import { StandingsTable } from './components/StandingsTable';
import { MagicWand } from './components/MagicWand';
import { HelpingHandModal } from './components/HelpingHandModal';
import { KnockoutBracket } from './components/KnockoutBracket';
import { Leaderboard } from './components/Leaderboard';
import { MyPredictions } from './components/MyPredictions';
import { PlayerProgress } from './components/PlayerProgress';
import { GroupStageSummary } from './components/GroupStageSummary';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { RulesModal } from './components/RulesModal';
import { ScoutingCenter } from './components/ScoutingCenter';
import { AvatarGenerator } from './components/AvatarGenerator';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { DebugTools } from './components/DebugTools';
import { IntroVideoModal } from './components/IntroVideoModal';
import { TournamentSchedule } from './components/TournamentSchedule';
import { TeamDetailsModal } from './components/TeamDetailsModal';

// NEW MODULAR COMPONENTS
import { LoginScreen } from './components/LoginScreen';
import { AppHeader } from './components/AppHeader';

import { useSwipe } from './hooks/useSwipe';
import { supabase, isSupabaseConfigured } from './supabase';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [teamsData, setTeamsData] = useState<Record<string, Team>>(INITIAL_TEAMS);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>(MOCK_PREDICTIONS);
  const [usersDb, setUsersDb] = useState<Record<string, UserProfile>>({});
  
  const [activeTab, setActiveTab] = useState<'groups' | 'knockout' | 'leaderboard' | 'manager' | 'tournament' | 'analysis' | 'scouting'>('groups');
  const [tournamentSubTab, setTournamentSubTab] = useState<'schedule' | 'tables' | 'bracket'>('schedule');
  const [showOverview, setShowOverview] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>('A');
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

  const t = TRANSLATIONS[language];
  const currentLocale = language === 'NO' ? 'no-NO' : 'en-GB';

  // --- INITIALIZATION ---
  useEffect(() => {
      if (isSupabaseConfigured && supabase) {
          supabase.auth.getSession().then(({ data: { session } }) => {
              setSession(session);
              if (session?.user?.email) fetchUserProfile(session.user.email);
              else setLoading(false);
          });

          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
              setSession(session);
              if (session?.user?.email) fetchUserProfile(session.user.email);
              else {
                  setUser(null);
                  setLoading(false);
              }
          });
          return () => subscription.unsubscribe();
      } else {
          setLoading(false);
      }
  }, []);

  const fetchUserProfile = async (email: string) => {
      if (!isSupabaseConfigured || !supabase) return;
      try {
          const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
          if (data) {
              const profile: UserProfile = {
                  name: (data as any).name,
                  email: (data as any).email,
                  tokens: (data as any).tokens,
                  substitutions: (data as any).substitutions,
                  unlockedMatches: (data as any).unlocked_matches || [],
                  hasTakenSecondChance: (data as any).has_taken_second_chance || false,
                  spiedMatches: (data as any).spied_matches || [],
                  favorites: (data as any).favorites || [],
                  avatar: (data as any).avatar,
                  leagues: (data as any).leagues || []
              };
              setUser(profile);
              
              const pendingLeague = sessionStorage.getItem('pending_league_invite');
              if (pendingLeague && !profile.leagues?.includes(pendingLeague)) {
                  const newLeagues = [...(profile.leagues || []), pendingLeague];
                  await supabase.from('profiles').update({ leagues: newLeagues } as any).eq('email', email);
                  setUser({ ...profile, leagues: newLeagues });
                  addToast('success', 'League Joined', `Welcome to ${pendingLeague.toUpperCase()}!`);
                  sessionStorage.removeItem('pending_league_invite');
              }
          }
      } catch (err) { console.error("Profile Fetch Error", err); } finally { setLoading(false); loadGameData(); }
  };

  const loadGameData = async () => {
      if (!isSupabaseConfigured || !supabase) return;
      try {
          const { data: preds } = await supabase.from('predictions').select('*');
          if (preds) setAllPredictions(preds.map((p: any) => ({ userId: p.user_id, matchId: p.match_id, home: p.home, away: p.away })));

          const { data: profiles } = await supabase.from('profiles').select('*');
          if (profiles) {
              const pMap: Record<string, UserProfile> = {};
              profiles.forEach((p: any) => {
                  pMap[p.email] = {
                      name: p.name, email: p.email, tokens: p.tokens, substitutions: p.substitutions, avatar: p.avatar, hasTakenSecondChance: p.has_taken_second_chance, leagues: p.leagues || [], favorites: p.favorites || [], spiedMatches: p.spied_matches || [], unlockedMatches: p.unlocked_matches || []
                  };
              });
              setUsersDb(pMap);
          }
          const rankMap = await fetchAllTeamRanks();
          if (Object.keys(rankMap).length > 0) {
              setTeamsData(prev => {
                  const next = { ...prev };
                  Object.keys(rankMap).forEach(tid => { if (next[tid]) next[tid] = { ...next[tid], rank: rankMap[tid] }; });
                  return next;
              });
          }
      } catch (e) { console.error("Data Load Error", e); }
  };

  // --- ACTIONS ---
  const handleLogout = async () => {
      if (supabase) await supabase.auth.signOut();
      setUser(null); setSession(null); setIsProfileMenuOpen(false);
      addToast('info', 'Logged Out', 'See you next match day.');
  };

  const updateAvatar = async (newAvatar: string) => {
    if (!user || !supabase) return;
    const updatedUser = { ...user, avatar: newAvatar };
    setUser(updatedUser);
    await supabase.from('profiles').update({ avatar: newAvatar } as any).eq('email', user.email);
    setShowAvatarEditor(false);
    addToast('success', 'Profile Updated', 'New avatar looks great!');
  };

  const handleScoreUpdate = async (matchId: string, h: number, a: number) => {
    if (!user || !supabase) return;
    const match = matches.find(m => m.id === matchId);
    if (!match || (match.isLocked && !user.unlockedMatches?.includes(matchId))) return;

    const newPred = { userId: user.email, matchId, home: h, away: a };
    setAllPredictions(prev => {
        const idx = prev.findIndex(p => p.userId === user.email && p.matchId === matchId);
        if (idx > -1) { const copy = [...prev]; copy[idx] = newPred; return copy; }
        return [...prev, newPred];
    });

    const { error } = await supabase.from('predictions').upsert({ user_id: user.email, match_id: matchId, home: h, away: a } as any, { onConflict: 'user_id,match_id' });
    if (error) { addToast('error', 'Save Failed', 'Could not save prediction.'); }
  };

  const handleSpy = async (matchId: string) => {
      if (!user || !supabase) return;
      if (user.tokens < 1) { addToast('error', 'No Intel', 'You need more Intel to spy.'); return; }
      const newSpied = [...(user.spiedMatches || []), matchId];
      const newTokens = user.tokens - 1;
      setUser({ ...user, tokens: newTokens, spiedMatches: newSpied });
      await supabase.from('profiles').update({ tokens: newTokens, spied_matches: newSpied } as any).eq('email', user.email);
      addToast('success', 'Rival Revealed', '-1 Intel used. Asset acquired.');
  };

  const handleSubstitute = async (matchId: string) => {
      if (!user || !supabase) return;
      if (user.substitutions < 1) { addToast('error', 'No Subs Left', 'You have used all 5 substitutions.'); return; }
      const newUnlocked = [...(user.unlockedMatches || []), matchId];
      const newSubs = user.substitutions - 1;
      setUser({ ...user, substitutions: newSubs, unlockedMatches: newUnlocked });
      await supabase.from('profiles').update({ substitutions: newSubs, unlocked_matches: newUnlocked } as any).eq('email', user.email);
      addToast('success', t.subSuccess, `${t.substitutions}: ${newSubs} left`);
  };

  const handleUnlockSecondChance = async () => {
      if (!user || !supabase) return;
      if (window.confirm("Are you sure? unlocking Second Chance reduces future points by 50%.")) {
          setUser({ ...user, hasTakenSecondChance: true });
          await supabase.from('profiles').update({ has_taken_second_chance: true } as any).eq('email', user.email);
          addToast('info', 'Second Chance Active', 'Good luck with the new bracket!');
          setActiveTab('knockout');
      }
  };

  const handleTimeTravel = (timestamp: number) => {
      const simulatedMatches = simulateTournamentAtDate(matches, teamsData, timestamp);
      setMatches(simulatedMatches);
      setTournamentPhase('LIVE');
  };

  const handleTeamClick = (teamId: string) => {
      if (teamId && !teamId.startsWith('TBD')) {
          setViewingTeamId(teamId);
      }
  };

  const handleLanguageSwitch = (code: LanguageCode) => {
      const userKey = user?.email || 'anon';
      const storageKey = `rasten_intro_seen_${code}_${userKey}`;
      const hasSeen = localStorage.getItem(storageKey);

      if (!hasSeen) {
          const videoUrl = INTRO_VIDEOS[code];
          if (videoUrl) {
              setIntroVideoUrl(videoUrl);
              setShowIntroModal(true);
              try { localStorage.setItem(storageKey, 'true'); } catch (e) { /* ignore */ }
          }
      }
      setLanguage(code);
  };

  const handleReplayIntro = () => {
      const videoUrl = INTRO_VIDEOS[language];
      if (videoUrl) {
          setIntroVideoUrl(videoUrl);
          setShowIntroModal(true);
      }
  };

  const addToast = (type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, title, message }]);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // --- DERIVED STATE ---
  const groupStageMatches = useMemo(() => matches.filter(m => m.groupId), [matches]);
  const isGroupStageComplete = useMemo(() => {
      if (!user) return false;
      const myPreds = allPredictions.filter(p => p.userId === user.email);
      return groupStageMatches.every(m => myPreds.some(p => p.matchId === m.id));
  }, [allPredictions, user, groupStageMatches]);

  const firstIncompleteGroup = useMemo(() => {
      if (isGroupStageComplete || !user) return null;
      for (const group of GROUP_CONFIG) {
          const gMatches = matches.filter(m => m.groupId === group.id);
          const gPreds = allPredictions.filter(p => p.userId === user.email && gMatches.some(gm => gm.id === p.matchId));
          if (gPreds.length < gMatches.length) return group.id;
      }
      return 'A';
  }, [matches, allPredictions, user, isGroupStageComplete]);

  // Update Bracket based on Predictions
  useEffect(() => {
    if (user && !isAdminMode) {
        setMatches(prev => {
            let userSpecificPreds = allPredictions.filter(p => p.userId === user.email);
            if (user.hasTakenSecondChance) {
                const groupMatchIds = new Set(prev.filter(m => m.groupId).map(m => m.id));
                userSpecificPreds = userSpecificPreds.filter(p => !groupMatchIds.has(p.matchId));
            }
            return applyPredictionsToBracket(prev, teamsData, userSpecificPreds);
        });
    }
  }, [user?.email, user?.hasTakenSecondChance, allPredictions, isAdminMode, teamsData]);

  // Navigation Handlers
  const handlePrevGroup = useCallback(() => {
    const currentIndex = GROUP_CONFIG.findIndex(g => g.id === activeGroup);
    const prevIndex = (currentIndex - 1 + GROUP_CONFIG.length) % GROUP_CONFIG.length;
    setActiveGroup(GROUP_CONFIG[prevIndex].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeGroup]);

  const handleNextGroup = useCallback(() => {
    const currentIndex = GROUP_CONFIG.findIndex(g => g.id === activeGroup);
    const nextIndex = (currentIndex + 1) % GROUP_CONFIG.length;
    setActiveGroup(GROUP_CONFIG[nextIndex].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeGroup]);

  const swipeHandlers = useSwipe({ 
    onSwipeLeft: activeTab === 'groups' ? handleNextGroup : () => {}, 
    onSwipeRight: activeTab === 'groups' ? handlePrevGroup : () => {} 
  });

  const handleGoToGroup = (groupId: string) => {
    setActiveGroup(groupId); setActiveTab('groups'); setShowOverview(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navTabs = useMemo(() => {
    if (tournamentPhase === 'PRE_LIVE') return ['groups', 'knockout', 'scouting', 'manager'];
    return ['leaderboard', 'tournament', 'manager', 'analysis'];
  }, [tournamentPhase]);

  const rivalsList = useMemo(() => (Object.values(usersDb) as UserProfile[]).filter(u => u.email !== user?.email), [usersDb, user]);
  const standings = useMemo(() => calculateGroupStandings(activeGroup, matches, teamsData), [activeGroup, matches, teamsData]);
  const groupMatchesList = matches.filter(m => m.groupId === activeGroup);

  const hasGroupPredictions = useMemo(() => user ? allPredictions.some(p => p.userId === user.email && matches.some(m => m.id === p.matchId && m.groupId)) : false, [allPredictions, user, matches]);
  const hasKnockoutPredictions = useMemo(() => user ? allPredictions.some(p => p.userId === user.email && matches.some(m => m.id === p.matchId && m.round && m.round !== 'R32')) : false, [allPredictions, user, matches]);
  const showClearTrash = useMemo(() => {
    if (activeTab === 'groups') return hasGroupPredictions;
    if (activeTab === 'knockout') return hasKnockoutPredictions;
    return false;
  }, [activeTab, hasGroupPredictions, hasKnockoutPredictions]);

  const handleClearPredictions = useCallback(async () => {
    if (!user || !supabase) return; 
    try {
        const query = supabase.from('predictions').delete().eq('user_id', user.email);
        if (activeTab === 'groups') {
           setAllPredictions(prev => prev.filter(p => p.userId !== user.email));
           await query;
        } else if (activeTab === 'knockout') {
           const knockoutIds = matches.filter(m => m.round && m.round !== 'R32').map(m => m.id);
           if (knockoutIds.length > 0) {
               setAllPredictions(prev => prev.filter(p => p.userId !== user.email || !knockoutIds.includes(p.matchId)));
               await query.in('match_id', knockoutIds);
           }
        }
        addToast('info', 'Cleared', 'Predictions have been reset.');
    } catch (err) { addToast('error', 'Error', 'Failed to clear predictions.'); }
  }, [user, activeTab, matches]);

  const showMagicWand = (tournamentPhase === 'PRE_LIVE' && activeTab !== 'leaderboard' && activeTab !== 'manager' && activeTab !== 'scouting') ||
                        (tournamentPhase === 'LIVE' && user?.hasTakenSecondChance && (activeTab === 'knockout'));

  if (loading) return (
      <div className="min-h-screen bg-[#05101c] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-4">
              <RefreshCw className="animate-spin text-blue-500" size={32} />
              <div className="text-xs font-black uppercase tracking-widest opacity-60">Initializing...</div>
          </div>
      </div>
  );

  if (!user || !session) {
      return (
        <LoginScreen 
            onSuccess={() => {}} 
            currentLang={language} 
            setLang={(l) => setLanguage(l)} 
            isLoading={loading}
            onLogin={async () => {}} // Legacy
        />
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-32 md:pb-12">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <IntroVideoModal isOpen={showIntroModal} videoSrc={introVideoUrl} onClose={() => setShowIntroModal(false)} />

      {/* HEADER COMPONENT (Extracted logic, kept layout) */}
      <AppHeader 
        user={user}
        lang={t}
        currentLang={language}
        setLang={handleLanguageSwitch}
        tournamentPhase={tournamentPhase}
        setTournamentPhase={setTournamentPhase}
        onReplayIntro={handleReplayIntro}
        isProfileMenuOpen={isProfileMenuOpen}
        setIsProfileMenuOpen={setIsProfileMenuOpen}
        onLogout={handleLogout}
        onChangeIdentity={() => setShowAvatarEditor(true)}
        onShowRules={() => setShowRules(true)}
        onDebug={() => setIsDebugOpen(true)}
        
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navTabs={navTabs}
        
        activeGroup={activeGroup}
        setActiveGroup={setActiveGroup}
        showOverview={showOverview}
        setShowOverview={setShowOverview}
        matches={matches}
        teams={teamsData}
        allPredictions={allPredictions}
      />

      {/* MAIN CONTENT AREA */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        
        {/* VIEW: ANALYSIS */}
        {activeTab === 'analysis' && user && (
            <AnalysisDashboard currentUser={user} rivals={rivalsList} matches={matches} allPredictions={allPredictions} teams={teamsData} lang={t} currentLang={language} onTeamClick={handleTeamClick} />
        )}
        
        {/* VIEW: SCOUTING */}
        {activeTab === 'scouting' && (
            <ScoutingCenter teams={teamsData} lang={t} currentLang={language} />
        )}
        
        {/* VIEW: TOURNAMENT (LIVE) */}
        {activeTab === 'tournament' && (
            <div className="flex flex-col h-full animate-fade-in">
                <div className="flex justify-center mb-6">
                   <div className="bg-slate-200 p-1 rounded-xl flex gap-1 shadow-inner border border-slate-300">
                      {(['schedule', 'tables', 'bracket'] as const).map(sub => (
                         <button 
                            key={sub}
                            onClick={() => setTournamentSubTab(sub)}
                            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${tournamentSubTab === sub ? 'bg-[#0f2545] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-300/50'}`}
                         >
                            {sub === 'schedule' && <CalendarDays size={14} />}
                            {sub === 'tables' && <ListOrdered size={14} />}
                            {sub === 'bracket' && <GitMerge size={14} />}
                            {(t as any)[`subnav${sub.charAt(0).toUpperCase() + sub.slice(1)}`]}
                         </button>
                      ))}
                   </div>
                </div>

                {tournamentSubTab === 'schedule' && (
                    <TournamentSchedule 
                        matches={matches} 
                        teams={teamsData} 
                        userPredictions={allPredictions.filter(p => p.userId === user?.email)} 
                        user={user} 
                        lang={t} 
                        currentLang={language} 
                        onTeamClick={handleTeamClick}
                    />
                )}

                {tournamentSubTab === 'tables' && (
                    <div className="pb-20">
                        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 no-scrollbar px-1">
                            {GROUP_CONFIG.map(g => {
                                const standings = calculateGroupStandings(g.id, matches, teamsData);
                                return (
                                    <div key={g.id} className="snap-center shrink-0 w-[85vw] md:w-[22rem]">
                                        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                                            <div className="bg-[#0f2545] p-3 text-white flex justify-between items-center">
                                                <h3 className="font-black uppercase tracking-widest text-sm">{t.groups} {g.id}</h3>
                                            </div>
                                            <StandingsTable standings={standings} teams={teamsData} lang={t} compact={true} onTeamClick={handleTeamClick} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="text-center text-xs text-slate-400 font-medium uppercase tracking-widest animate-pulse">Swipe for more groups &rarr;</div>
                    </div>
                )}

                {tournamentSubTab === 'bracket' && (
                    <KnockoutBracket 
                      matches={matches} 
                      teams={teamsData} 
                      onUpdate={handleScoreUpdate} 
                      lang={t} 
                      user={user} 
                      onSecondChance={()=>{}} 
                      rivals={rivalsList} 
                      allPredictions={allPredictions} 
                      phase={tournamentPhase} 
                      isGroupStageComplete={isGroupStageComplete} 
                      firstIncompleteGroup={firstIncompleteGroup} 
                      onGoToGroup={handleGoToGroup} 
                      onTeamClick={handleTeamClick} 
                      onSpy={(id) => handleSpy(id)}  
                      revealedRivals={user?.spiedMatches || []} 
                    />
                )}
            </div>
        )}

        {activeTab === 'groups' && tournamentPhase === 'PRE_LIVE' && (
            <div {...swipeHandlers} className="animate-fade-in touch-pan-y">
                {showOverview ? (
                   <GroupStageSummary matches={matches} teams={teamsData} lang={t} phase={tournamentPhase} hasTakenSecondChance={user?.hasTakenSecondChance} onSecondChance={() => {}} userPredictions={allPredictions.filter(p => p.userId === user?.email)} onGoToGroup={handleGoToGroup} onGoToKnockout={() => setActiveTab('knockout')} onTeamClick={handleTeamClick} />
                ) : (
                   <>
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                          <StandingsTable standings={standings} teams={teamsData} lang={t} onTeamClick={handleTeamClick} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {groupMatchesList.map(match => (
                              <MatchCard 
                                key={match.id} 
                                match={match} 
                                homeTeam={teamsData[match.homeTeamId]} 
                                awayTeam={teamsData[match.awayTeamId]} 
                                onUpdate={handleScoreUpdate} 
                                lang={t} 
                                locale={currentLocale}
                                userTokens={user?.tokens || 0} 
                                rivals={rivalsList} 
                                onSpy={(id) => handleSpy(id)}
                                revealedRivals={user?.spiedMatches || []} 
                                currentUser={user} 
                                allPredictions={allPredictions} 
                                phase={tournamentPhase} 
                                isAdminMode={isAdminMode}
                                onSubstitute={() => handleSubstitute(match.id)}
                                substitutionsLeft={user?.substitutions || 0}
                                isUnlockedBySub={user?.unlockedMatches?.includes(match.id) || false}
                                onTeamClick={handleTeamClick}
                              />
                          ))}
                      </div>
                      
                      <div className="mt-12 flex flex-col items-center gap-4">
                          <div className="flex gap-3 w-full max-w-lg">
                              {activeGroup !== 'A' && (
                                  <button 
                                      onClick={handlePrevGroup}
                                      className="flex-1 px-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"
                                  >
                                      <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                                      <span>Prev Group</span>
                                  </button>
                              )}
                              
                              {activeGroup !== 'L' ? (
                                  <button 
                                      onClick={handleNextGroup}
                                      className="flex-[2] px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl shadow-lg font-black uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
                                  >
                                      <span>Next Group</span>
                                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                  </button>
                              ) : (
                                  <div className="flex-[2] flex gap-2">
                                      <button 
                                          onClick={() => setShowOverview(true)}
                                          className="flex-1 px-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-blue-600 font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                      >
                                          <LayoutGrid size={18} /> {t.tablesBtn}
                                      </button>
                                      <button 
                                          onClick={() => setActiveTab('knockout')}
                                          className="flex-1 px-4 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl shadow-lg font-black uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                      >
                                          Bracket <ChevronRight size={18} />
                                      </button>
                                  </div>
                              )}
                          </div>
                      </div>
                   </>
                )}
            </div>
        )}
        {activeTab === 'knockout' && <KnockoutBracket matches={matches} teams={teamsData} onUpdate={handleScoreUpdate} lang={t} user={user} onSecondChance={()=>{}} rivals={rivalsList} allPredictions={allPredictions} phase={tournamentPhase} isGroupStageComplete={isGroupStageComplete} firstIncompleteGroup={firstIncompleteGroup} onGoToGroup={handleGoToGroup} onTeamClick={handleTeamClick} onSpy={(id) => handleSpy(id)} revealedRivals={user?.spiedMatches || []} />}
        {activeTab === 'leaderboard' && <Leaderboard users={Object.values(usersDb)} matches={matches} allPredictions={allPredictions} lang={t} currentUserEmail={user?.email} currentUserLeagues={user?.leagues} teams={teamsData} onTeamClick={handleTeamClick} />}
        {activeTab === 'manager' && (tournamentPhase === 'PRE_LIVE' ? 
            <PlayerProgress users={Object.values(usersDb)} allPredictions={allPredictions} totalMatches={{ group: 72, knockout: 32 }} lang={t} currentUserLeagues={user?.leagues} /> 
            : 
            <MyPredictions 
                matches={matches} 
                teams={teamsData} 
                allPredictions={allPredictions} 
                currentUser={user} 
                lang={t} 
                onGoToGroup={handleGoToGroup} 
                onGoToBracket={() => setActiveTab('knockout')}
                onUnlockSecondChance={handleUnlockSecondChance} 
                onSubstitute={handleSubstitute}
            />
        )}
      </main>

      {showAvatarEditor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setShowAvatarEditor(false)}></div>
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Change Identity</h3>
                    <button onClick={() => setShowAvatarEditor(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <AvatarGenerator onGenerate={updateAvatar} lang={t} />
                <button onClick={() => setShowAvatarEditor(false)} className="w-full mt-4 py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600">Cancel</button>
            </div>
        </div>
      )}

      <DebugTools 
        isOpen={isDebugOpen} 
        onClose={() => setIsDebugOpen(false)} 
        onSeed={() => {}}
        onSimulateGroups={() => {
            const simulated = simulateFullTournament(matches, teamsData, user?.favorites || [], 'GROUPS');
            setMatches(simulated);
            addToast('success', 'Simulation Complete', 'Group stage simulated.');
        }}
        onSimulateKnockouts={() => {
            const simulated = simulateFullTournament(matches, teamsData, user?.favorites || [], 'KNOCKOUT');
            setMatches(simulated);
            addToast('success', 'Simulation Complete', 'Knockouts simulated.');
        }}
        onClear={() => {
            localStorage.clear();
            window.location.reload();
        }}
        onTimeTravel={handleTimeTravel}
        isAdminMode={isAdminMode}
        onToggleAdmin={() => setIsAdminMode(!isAdminMode)}
        lang={t}
        users={Object.values(usersDb) as UserProfile[]}
        predictions={allPredictions}
        matches={matches}
      />

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} lang={t} />
      
      {isHelpingHandOpen && user && (
          <HelpingHandModal 
            isOpen={isHelpingHandOpen} 
            onClose={() => setIsHelpingHandOpen(false)} 
            teams={teamsData} 
            initialFavorites={user.favorites} 
            onGenerate={async (favs, scope) => {
                const simulatedMatches = simulateFullTournament(matches, teamsData, favs, scope);
                const newPredictions: Prediction[] = [];
                simulatedMatches.forEach(m => {
                    if (m.homeScore !== null && m.awayScore !== null) {
                         newPredictions.push({
                             userId: user.email,
                             matchId: m.id,
                             home: m.homeScore,
                             away: m.awayScore
                         });
                    }
                });

                setAllPredictions(prev => {
                    const otherUsersPreds = prev.filter(p => p.userId !== user.email);
                    const mergedMyPreds = [...prev.filter(p => p.userId === user.email)];
                    newPredictions.forEach(np => {
                        const idx = mergedMyPreds.findIndex(p => p.matchId === np.matchId);
                        if (idx >= 0) mergedMyPreds[idx] = np;
                        else mergedMyPreds.push(np);
                    });
                    return [...otherUsersPreds, ...mergedMyPreds];
                });

                if (isSupabaseConfigured && supabase) {
                    const payload = newPredictions.map(p => ({
                        user_id: p.userId,
                        match_id: p.matchId,
                        home: p.home,
                        away: p.away
                    }));
                    if (payload.length > 0) {
                       await supabase.from('predictions').upsert(payload as any, { onConflict: 'user_id,match_id' });
                    }
                }
                addToast('success', 'Magic Applied', `Simulated ${newPredictions.length} matches based on favorites.`);
            }} 
            lang={t} 
            mode={activeTab === 'knockout' ? 'knockout' : 'groups'} 
          />
      )}

      {showMagicWand && (
         <MagicWand 
           onOpen={() => setIsHelpingHandOpen(true)} 
           onClear={handleClearPredictions} 
           showClear={showClearTrash} 
           lang={t} 
         />
      )}

      {viewingTeamId && teamsData[viewingTeamId] && (
          <TeamDetailsModal 
              team={teamsData[viewingTeamId]} 
              isOpen={true} 
              onClose={() => setViewingTeamId(null)} 
              lang={t}
              currentLang={language}
          />
      )}
    </div>
  );
};

export default App;