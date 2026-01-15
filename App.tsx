import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Trophy, Zap, LayoutGrid, ListOrdered, CheckCircle2, ChevronRight, MonitorPlay, Eye, EyeOff, Shuffle, ArrowRight, Users, Lock, Unlock, Grid3X3, Menu, Table2, LogOut, BookOpen, Settings, ChevronLeft, ShieldCheck, Sparkles, UserCircle2, Network, UserCircle, Edit3, X, ArrowLeft, Trash2, RefreshCw, Bot, Calendar, CalendarDays, GitMerge } from 'lucide-react';
import { TEAMS as INITIAL_TEAMS, INITIAL_MATCHES, TRANSLATIONS, LANGUAGES, AVATARS, GROUP_CONFIG, MOCK_PREDICTIONS, INTRO_VIDEOS } from './constants';
import { Match, LanguageCode, UserProfile, Prediction, TournamentPhase, MatchStatus, Team } from './types';
import { calculateGroupStandings, generateMagicScores, updateBracket, simulateFullTournament, applyPredictionsToBracket, simulateTournamentAtDate, fetchAllTeamRanks } from './services/engine';
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
import { AvatarDisplay } from './components/AvatarDisplay';
import { AvatarGenerator } from './components/AvatarGenerator';
import { Logo } from './components/Logo';
import { useSwipe } from './hooks/useSwipe';
import { supabase, isSupabaseConfigured } from './supabase';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { DebugTools } from './components/DebugTools';
import { IntroVideoModal } from './components/IntroVideoModal';
import { TournamentSchedule } from './components/TournamentSchedule';
import { TeamDetailsModal } from './components/TeamDetailsModal';

// Bumping versions to v2 to wipe previous data for a fresh start
const STORAGE_KEYS = {
  PREDICTIONS: 'rasten_cup_preds_v2',
  USERS: 'rasten_cup_users_v2',
  CURRENT_USER: 'rasten_cup_active_user_v2'
};

interface LoginScreenProps {
  onLogin: (name: string, email: string, avatar: string) => Promise<void>;
  currentLang: LanguageCode;
  setLang: (code: LanguageCode) => void;
  isLoading: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, currentLang, setLang, isLoading }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [showAvatarGen, setShowAvatarGen] = useState(true);
  const t = TRANSLATIONS[currentLang];

  useEffect(() => { if (mode === 'signup') setSelectedAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)]); }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return; // Password optional in this open version
    await onLogin(mode === 'signup' ? name : email.split('@')[0], email, selectedAvatar);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#05101c] text-white p-6 relative overflow-hidden">
       <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-[#05101c] to-[#05101c] pointer-events-none"></div>
       <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

       <div className="w-full max-w-md animate-fade-in z-10 flex flex-col items-center gap-8">
          <div className="text-center space-y-4 flex flex-col items-center">
              <div className="relative inline-block mb-4">
                <Logo className="w-52 h-52 transition-transform duration-700 hover:scale-110" variant="theme" />
              </div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">The Rasten Cup '26</h1>
              <p className="text-blue-400 font-bold text-xs tracking-[0.2em] uppercase opacity-90">{t.subTitle}</p>
          </div>
          <div className="w-full bg-slate-900/50 backdrop-blur-md rounded-3xl p-8 shadow-2xl text-slate-100 border border-white/10 ring-1 ring-white/5">
             <div className="mb-8">
                <div className="flex justify-center gap-4">
                  {LANGUAGES.map((lang) => (
                      <button 
                          key={lang.code} 
                          onClick={() => setLang(lang.code)} 
                          className={`relative w-14 h-10 rounded-md overflow-hidden transition-all duration-300 transform ${currentLang === lang.code ? 'scale-110 ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] grayscale-0' : 'opacity-50 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105'}`}
                      >
                          <img src={lang.flag} alt={lang.name} className="w-full h-full object-cover" />
                      </button>
                  ))}
                </div>
             </div>
             
             <div className="flex bg-black/20 p-1 rounded-xl mb-6 border border-white/5">
                <button onClick={() => setMode('login')} className={`flex-1 py-2.5 text-xs font-black uppercase rounded-lg transition-all ${mode === 'login' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:text-white'}`}>{t.loginMode}</button>
                <button onClick={() => setMode('signup')} className={`flex-1 py-2.5 text-xs font-black uppercase rounded-lg transition-all ${mode === 'signup' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:text-white'}`}>{t.signupMode}</button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                    <div className="animate-in slide-in-from-top-1">
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" placeholder={t.nameLabel} />
                    </div>
                )}
                
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" placeholder={t.emailLabel} />
                
                <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 font-semibold text-white placeholder-slate-500 pr-12 focus:outline-none focus:border-blue-500 transition-colors" placeholder={t.passwordLabel} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1 hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>

                {mode === 'signup' && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 pt-2">
                      <div className="flex items-center gap-3 px-1">
                          <div className="h-px bg-white/10 flex-1"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Create Your Identity</span>
                          <div className="h-px bg-white/10 flex-1"></div>
                      </div>

                      <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-4">
                         <div className="flex items-center justify-between">
                             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.selectAvatar}</div>
                             <div className="flex gap-2">
                                <button type="button" onClick={() => setShowAvatarGen(true)} className={`p-1.5 rounded-lg transition-all ${showAvatarGen ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}><Sparkles size={16} /></button>
                                <button type="button" onClick={() => setShowAvatarGen(false)} className={`p-1.5 rounded-lg transition-all ${!showAvatarGen ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}><Grid3X3 size={16} /></button>
                             </div>
                         </div>
                         {showAvatarGen ? <AvatarGenerator onGenerate={(uri) => setSelectedAvatar(uri)} lang={t} /> : (
                            <div className="flex gap-3 justify-start overflow-x-auto no-scrollbar py-2">
                              {AVATARS.map(av => (
                                <button key={av} type="button" onClick={() => setSelectedAvatar(av)} className={`relative w-12 h-12 rounded-full transition-all shrink-0 ${selectedAvatar === av ? 'scale-110 ring-2 ring-blue-400 shadow-lg z-10' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}>
                                  <img src={av} className="w-full h-full rounded-full object-cover bg-white" alt="" />
                                  {selectedAvatar === av && <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full border border-black flex items-center justify-center"><CheckCircle2 size={10} /></div>}
                                </button>
                              ))}
                            </div>
                         )}
                      </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-4 mt-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                > 
                  {isLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" /> Connecting...
                    </>
                  ) : (
                    <>
                      {t.enterBtn} <ChevronRight size={18} /> 
                    </>
                  )}
                </button>
             </form>
          </div>
       </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [teamsData, setTeamsData] = useState<Record<string, Team>>(INITIAL_TEAMS);
  
  const [activeTab, setActiveTab] = useState<'groups' | 'knockout' | 'leaderboard' | 'manager' | 'tournament' | 'analysis' | 'scouting'>('groups');
  const [tournamentSubTab, setTournamentSubTab] = useState<'schedule' | 'tables' | 'bracket'>('schedule');
  
  const [showOverview, setShowOverview] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>('A');
  const [language, setLanguage] = useState<LanguageCode>('EN');
  const [tournamentPhase, setTournamentPhase] = useState<TournamentPhase>('PRE_LIVE');
  const [allPredictions, setAllPredictions] = useState<Prediction[]>(MOCK_PREDICTIONS);
  const [isHelpingHandOpen, setIsHelpingHandOpen] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);

  // Intro Video State
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [introVideoUrl, setIntroVideoUrl] = useState('');

  // Critical for persistence safety
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [usersDb, setUsersDb] = useState<Record<string, UserProfile>>({});

  const t = TRANSLATIONS[language];
  const localeMap: Record<LanguageCode, string> = {
      EN: 'en-GB',
      US: 'en-US',
      NO: 'no-NO',
      SCO: 'en-GB' // Scots falls back to UK English formatting
  };
  const currentLocale = localeMap[language];

  // Group Matches by Date for Schedule View
  const groupedMatches = useMemo(() => {
    const groups: Record<string, Match[]> = {};
    // Sort matches by date first
    const sortedMatches = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedMatches.forEach(m => {
      // Use date string for grouping key
      const d = new Date(m.date).toLocaleDateString(undefined, { weekday:'long', month: 'short', day: 'numeric'});
      if (!groups[d]) groups[d] = [];
      groups[d].push(m);
    });
    return groups;
  }, [matches]);

  // Language Switcher Logic (Checks if video seen per user)
  const handleLanguageSwitch = (code: LanguageCode) => {
      // 1. Check local storage if video seen for this language
      // Key includes user email (or 'anon' if pre-login) to ensure each user tracks views individually
      const userKey = user?.email || 'anon';
      const storageKey = `rasten_intro_seen_${code}_${userKey}`;
      const hasSeen = localStorage.getItem(storageKey);

      // 2. Play video if not seen
      if (!hasSeen) {
          const videoUrl = INTRO_VIDEOS[code];
          if (videoUrl) {
              setIntroVideoUrl(videoUrl);
              setShowIntroModal(true);
              
              // Mark as seen immediately (safely)
              try {
                  localStorage.setItem(storageKey, 'true');
              } catch (e) {
                  // Quota error possible here, warn but don't crash
                  console.warn("Could not save video seen flag due to storage limit.");
              }
          }
      }

      setLanguage(code);
  };

  // Replay Video Logic (Manual Trigger - Always Plays)
  const handleReplayIntro = () => {
      const videoUrl = INTRO_VIDEOS[language];
      if (videoUrl) {
          setIntroVideoUrl(videoUrl);
          setShowIntroModal(true);
      }
  };

  // Toast Helper
  const addToast = (type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleTeamClick = (teamId: string) => {
      if (teamId && !teamId.startsWith('TBD')) {
          setViewingTeamId(teamId);
      }
  };

  // LEAGUE JOINING LOGIC: Check URL for invites
  useEffect(() => {
    const path = window.location.pathname.substring(1).toLowerCase();
    // Valid leagues: 'family', 'beeline', 'scotland'
    if (['family', 'beeline', 'scotland'].includes(path)) {
       console.log("League invite detected:", path);
       sessionStorage.setItem('pending_league_invite', path);
       window.history.replaceState(null, '', '/'); // Clean URL
    }
  }, []);

  // Logic to check if user has finished group stage
  const groupStageMatches = useMemo(() => matches.filter(m => m.groupId), [matches]);
  const userGroupPredictionsCount = useMemo(() => {
    if (!user) return 0;
    return allPredictions.filter(p => p.userId === user.email && groupStageMatches.some(gm => gm.id === p.matchId)).length;
  }, [allPredictions, user, groupStageMatches]);

  const isGroupStageComplete = userGroupPredictionsCount === groupStageMatches.length && groupStageMatches.length > 0;
  
  const firstIncompleteGroup = useMemo(() => {
    if (isGroupStageComplete) return null;
    for (const group of GROUP_CONFIG) {
        const gMatches = matches.filter(m => m.groupId === group.id);
        const gPreds = allPredictions.filter(p => p.userId === user?.email && gMatches.some(gm => gm.id === p.matchId));
        if (gPreds.length < gMatches.length) return group.id;
    }
    return 'A';
  }, [matches, allPredictions, user, isGroupStageComplete]);

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

  // INITIAL DATA LOAD & CLEANUP
  useEffect(() => {
    const initData = async () => {
      try {
          const keys = Object.keys(localStorage);
          const v1Keys = keys.filter(k => k.includes('rasten_cup') && !k.includes('v2'));
          v1Keys.forEach(k => localStorage.removeItem(k));
      } catch(e) { console.warn("Cleanup failed", e); }

      try {
          if (isSupabaseConfigured && supabase) {
            // 1. Sync Rankings
            const rankMap = await fetchAllTeamRanks();
            if (Object.keys(rankMap).length > 0) {
                setTeamsData(prev => {
                    const next = { ...prev };
                    Object.keys(rankMap).forEach(teamId => {
                        if (next[teamId]) {
                            const newRank = rankMap[teamId];
                            const newRating = Math.max(50, Math.min(99, Math.round(100 - (newRank / 1.5))));
                            next[teamId] = {
                                ...next[teamId],
                                rank: newRank,
                                rating: newRating,
                                att: newRating,
                                mid: newRating,
                                def: newRating
                            };
                        }
                    });
                    return next;
                });
            }

            const { data: dbProfiles } = await supabase.from('profiles').select('*');
            if (dbProfiles) {
              const profileMap: Record<string, UserProfile> = {};
              dbProfiles.forEach(p => { 
                profileMap[p.email] = {
                    name: p.name, 
                    email: p.email, 
                    tokens: p.tokens,
                    substitutions: p.substitutions || 5, 
                    favorites: p.favorites || [], 
                    avatar: p.avatar, 
                    hasTakenSecondChance: p.has_taken_second_chance || false,
                    spiedMatches: p.spied_matches || [],
                    unlockedMatches: p.unlocked_matches || [],
                    leagues: p.leagues || []
                }; 
              });
              setUsersDb(profileMap);
            }
            const { data: dbPreds } = await supabase.from('predictions').select('*');
            if (dbPreds) setAllPredictions((dbPreds as any[]).map(p => ({ userId: p.user_id, matchId: p.match_id, home: p.home, away: p.away })));
            
            const { data: dbMatches } = await supabase.from('matches').select('*');
            if (dbMatches && dbMatches.length > 0) {
               setMatches((prev: Match[]) => {
                  const updatedMatches: Match[] = prev.map((m) => {
                     const realM = dbMatches.find((dm: any) => dm.id === m.id || dm.id === m.apiId);
                     if (realM) {
                        const statusVal = realM.status as MatchStatus;
                        const isRealLocked = ['FT', 'LIVE', '1H', '2H', 'HT', 'FINISHED', 'AET', 'PEN'].includes(statusVal);
                        
                        return { 
                            ...m, 
                            apiId: realM.id, 
                            homeScore: isRealLocked ? Number(realM.home_score) : m.homeScore, 
                            awayScore: isRealLocked ? Number(realM.away_score) : m.awayScore, 
                            status: statusVal, 
                            isLocked: isRealLocked,
                            date: realM.date ? realM.date : m.date,
                            venue: realM.venue ? realM.venue : m.venue
                        };
                     }
                     return m;
                  });
                  return updateBracket(updatedMatches, teamsData);
               });
               setTournamentPhase('LIVE');
            }
          } else {
            const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
            const savedPreds = localStorage.getItem(STORAGE_KEYS.PREDICTIONS);
            if (savedUsers) setUsersDb(JSON.parse(savedUsers));
            if (savedPreds) setAllPredictions(JSON.parse(savedPreds));
          }
          const savedActiveUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
          if (savedActiveUser) {
            const parsedUser = JSON.parse(savedActiveUser);
            setUser(parsedUser);
            setIsLoggedIn(true);
          }
      } catch (e) {
          console.error("Initialization error:", e);
          addToast('error', 'Connection Error', 'Could not load tournament data.');
      } finally {
          setIsDataLoaded(true);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (user && !isAdminMode) {
        setMatches(prev => {
            let userSpecificPreds = allPredictions.filter(p => p.userId === user.email);
            
            // CRITICAL FIX: If Second Chance is taken, ignore GROUP predictions when building bracket.
            // This ensures the bracket is built from REAL results (in matches state) not user's predicted results.
            if (user.hasTakenSecondChance) {
                // Filter out any predictions that belong to Group Stage matches (i.e. matches with a groupId)
                // We access the match metadata from 'prev' matches to check if it's a group game.
                const groupMatchIds = new Set(prev.filter(m => m.groupId).map(m => m.id));
                userSpecificPreds = userSpecificPreds.filter(p => !groupMatchIds.has(p.matchId));
            }

            return applyPredictionsToBracket(prev, teamsData, userSpecificPreds);
        });
    }
  }, [user?.email, user?.hasTakenSecondChance, allPredictions, isAdminMode, teamsData]); 

  useEffect(() => {
    if (!isDataLoaded) return;

    let wasSanitized = false;
    const sanitizedUsersDb = { ...usersDb };

    Object.keys(sanitizedUsersDb).forEach(key => {
        const u = sanitizedUsersDb[key];
        if (u.avatar && u.avatar.length > 150000 && u.avatar.startsWith('data:image')) {
            console.warn(`Sanitizing heavy avatar for ${u.name}`);
            const safeAvatar = `https://api.dicebear.com/9.x/micah/svg?seed=${u.name.replace(/\s/g, '')}&backgroundColor=d1d4f9`;
            sanitizedUsersDb[key] = { ...u, avatar: safeAvatar };
            wasSanitized = true;
            
            if (user && user.email === u.email) {
                setUser(prev => prev ? { ...prev, avatar: safeAvatar } : null);
            }
        }
    });

    if (wasSanitized) {
        setUsersDb(sanitizedUsersDb); 
        return; 
    }

    const safeSet = (key: string, val: string) => {
        try {
            localStorage.setItem(key, val);
        } catch (e: any) {
            console.error(`Storage Error (${key}):`, e);
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                console.warn("Storage Limit Reached. Attempting emergency cleanup...");
                try {
                    localStorage.removeItem('rasten_cup_users'); 
                    localStorage.removeItem('rasten_cup_preds');
                    localStorage.removeItem('rasten_cup_active_user');
                } catch (cleanupErr) { console.error("Cleanup failed", cleanupErr); }
            }
        }
    };

    safeSet(STORAGE_KEYS.USERS, JSON.stringify(usersDb));
    safeSet(STORAGE_KEYS.PREDICTIONS, JSON.stringify(allPredictions));
    if (user) safeSet(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }, [usersDb, allPredictions, user, isDataLoaded]);

  const handleAuth = async (name: string, email: string, avatar: string) => {
    setIsAuthLoading(true);
    const safeEmail = email.toLowerCase().trim();
    const safeName = name.trim();

    const pendingLeague = sessionStorage.getItem('pending_league_invite');
    
    let remoteProfile: UserProfile | null = null;
    let remotePreds: Prediction[] = [];

    if (isSupabaseConfigured && supabase) {
        try {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', safeEmail)
                .single();
            
            if (profileData) {
                remoteProfile = {
                    name: profileData.name, 
                    email: profileData.email, 
                    tokens: profileData.tokens,
                    substitutions: profileData.substitutions || 5,
                    unlockedMatches: profileData.unlocked_matches || [],
                    favorites: profileData.favorites || [], 
                    avatar: profileData.avatar, 
                    hasTakenSecondChance: profileData.has_taken_second_chance || false,
                    spiedMatches: profileData.spied_matches || [],
                    leagues: profileData.leagues || []
                };
            }

            const { data: predData } = await supabase
                .from('predictions')
                .select('*')
                .eq('user_id', safeEmail);
            
            if (predData && predData.length > 0) {
                remotePreds = (predData as any[]).map((p: any) => ({
                    userId: p.user_id,
                    matchId: p.match_id,
                    home: p.home,
                    away: p.away
                }));
            }
        } catch (err) {
            console.error("Error fetching remote data", err);
            addToast('error', 'Sync Warning', 'Could not fetch cloud data. Starting local.');
        }
    }

    let activeUser: UserProfile;
    
    if (remoteProfile) {
        activeUser = remoteProfile;
        setUsersDb(prev => ({ ...prev, [safeEmail]: activeUser }));
    } else if (usersDb[safeEmail]) {
        activeUser = usersDb[safeEmail];
    } else {
        const initialLeagues = pendingLeague ? [pendingLeague] : [];
        activeUser = { 
           name: safeName, 
           email: safeEmail, 
           tokens: 5,
           substitutions: 5,
           unlockedMatches: [],
           favorites: [], 
           avatar: avatar || '😊', 
           hasTakenSecondChance: false, 
           spiedMatches: [],
           leagues: initialLeagues
        };
        setUsersDb(prev => ({ ...prev, [safeEmail]: activeUser }));
       
        if (isSupabaseConfigured && supabase) {
           const { error } = await supabase.from('profiles').upsert({ 
               email: safeEmail, 
               name: safeName, 
               avatar, 
               tokens: 5,
               substitutions: 5,
               unlocked_matches: [],
               has_taken_second_chance: false,
               leagues: initialLeagues,
               spied_matches: [],
               favorites: []
           }, { onConflict: 'email' });
           
           if (error) {
               const msg = error.message;
               console.error("Auto-create profile failed:", msg);
               
               if (msg.includes('column') || msg.includes('substitutions') || msg.includes('schema cache')) {
                   console.warn("Schema mismatch detected. Trying legacy insert...");
                   const { error: retryError } = await supabase.from('profiles').upsert({ 
                       email: safeEmail, 
                       name: safeName, 
                       avatar, 
                       tokens: 5,
                       // Omitting new columns for legacy compatibility
                       has_taken_second_chance: false,
                       leagues: initialLeagues,
                       spied_matches: [],
                       favorites: []
                   }, { onConflict: 'email' });
                   
                   if (!retryError) {
                       addToast('warning', 'Update Required', 'Profile saved in legacy mode. Please run SQL Setup in Debug Console.');
                   } else {
                       addToast('error', 'Database Error', 'Go to Debug Console > SQL Setup to fix the schema.');
                   }
               } else if (msg.includes('foreign key') || msg.includes('uuid')) {
                   addToast('error', 'Database Error', 'Go to Debug Console > SQL Setup to fix the schema.');
               } else {
                   addToast('error', 'Sync Error', 'Could not save profile.');
               }
           }
        }
    }

    if (remotePreds.length > 0) {
        setAllPredictions(prev => {
            const others = prev.filter(p => p.userId !== safeEmail);
            return [...others, ...remotePreds];
        });
    }

    if (pendingLeague) {
        const currentLeagues = activeUser.leagues || [];
        if (!currentLeagues.includes(pendingLeague)) {
            activeUser = { ...activeUser, leagues: [...currentLeagues, pendingLeague] };
            setUsersDb(prev => ({ ...prev, [safeEmail]: activeUser }));
            
            if (isSupabaseConfigured && supabase) {
                await supabase.from('profiles').update({ leagues: activeUser.leagues }).eq('email', safeEmail);
            }
        }
        sessionStorage.removeItem('pending_league_invite');
        const leagueName = pendingLeague === 'scotland' ? 'SCOTLAND & FRIENDS' : pendingLeague.toUpperCase();
        addToast('success', 'League Joined', `Welcome to the ${leagueName} league!`);
    }
    
    if (activeUser.substitutions === undefined) activeUser.substitutions = 5;
    if (!activeUser.unlockedMatches) activeUser.unlockedMatches = [];
    
    setUser(activeUser);
    setIsLoggedIn(true);
    setIsAuthLoading(false);
    
    if (!document.querySelector('.text-red-400') && !document.querySelector('.text-amber-400')) {
        addToast('success', t.welcome, `Good luck, ${activeUser.name}!`);
    }

    if (!localStorage.getItem(`rasten_first_login_${STORAGE_KEYS.USERS}`)) {
      setShowRules(true);
      localStorage.setItem(`rasten_first_login_${STORAGE_KEYS.USERS}`, 'true');
    }
  };

  const updateAvatar = async (newAvatar: string) => {
    if (!user) return;
    const updatedUser = { ...user, avatar: newAvatar };
    setUser(updatedUser);
    setUsersDb(prev => ({ ...prev, [user.email]: updatedUser }));
    if (isSupabaseConfigured && supabase) {
        await supabase.from('profiles').update({ avatar: newAvatar }).eq('email', user.email);
    }
    setShowAvatarEditor(false);
    addToast('success', 'Profile Updated', 'New avatar looks great!');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setIsProfileMenuOpen(false);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    addToast('info', 'Logged Out', 'See you next match day.');
  };

  const handleUnlockSecondChance = async () => {
     if (!user) return;
     if (window.confirm("Are you sure? This will reduce all future points by 50%.")) {
         const updatedUser = { ...user, hasTakenSecondChance: true };
         setUser(updatedUser);
         setUsersDb(prev => ({ ...prev, [user.email]: updatedUser }));
         
         if (isSupabaseConfigured && supabase) {
             await supabase.from('profiles').update({ has_taken_second_chance: true }).eq('email', user.email);
         }
         addToast('info', 'Second Chance Active', 'Good luck with the new bracket!');
         // Redirect to Knockout tab
         setActiveTab('knockout');
     }
  };
  
  const handleSubstitute = async (matchId: string) => {
      if (!user) return;
      if (user.substitutions < 1) {
          addToast('error', 'No Subs Left', 'You have used all 5 substitutions.');
          return;
      }

      const updatedUser = {
          ...user,
          substitutions: user.substitutions - 1,
          unlockedMatches: [...(user.unlockedMatches || []), matchId]
      };

      setUser(updatedUser);
      setUsersDb(prev => ({ ...prev, [user.email]: updatedUser }));

      if (isSupabaseConfigured && supabase) {
          await supabase.from('profiles').update({
              substitutions: updatedUser.substitutions,
              unlocked_matches: updatedUser.unlockedMatches
          }).eq('email', user.email);
      }
      addToast('success', t.subSuccess, `${t.substitutions}: ${updatedUser.substitutions} left`);
  };

  const handleSpy = async (matchId: string) => {
      if (!user) return;
      if (user.tokens < 1) {
          addToast('error', 'No Intel', 'You need more Intel to spy.');
          return;
      }
      
      const updatedUser = { 
          ...user, 
          tokens: user.tokens - 1, 
          spiedMatches: [...(user.spiedMatches || []), matchId] 
      };
      
      setUser(updatedUser);
      setUsersDb(prev => ({ ...prev, [user.email]: updatedUser }));

      if (isSupabaseConfigured && supabase) {
          await supabase.from('profiles').update({ 
              tokens: updatedUser.tokens,
              spied_matches: updatedUser.spiedMatches 
          }).eq('email', user.email);
      }
      addToast('spy', 'Rival Revealed', '-1 Intel used. Asset acquired.');
  };

  const handleRefreshBracket = async () => {
    if (!user) return;
    const knockoutIds = matches.filter(m => m.round).map(m => m.id);
    const newPredictions = allPredictions.filter(p => 
        p.userId !== user.email || !knockoutIds.includes(p.matchId)
    );
    setAllPredictions(newPredictions);
    if (isSupabaseConfigured && supabase) {
        await supabase.from('predictions').delete().eq('user_id', user.email).in('match_id', knockoutIds);
    }
    window.location.reload(); 
  };

  const handleScoreUpdate = async (matchId: string, h: number, a: number) => {
    if (!user) return;
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const isUnlockedBySub = user.unlockedMatches?.includes(matchId);
    if (match.isLocked && !isUnlockedBySub) return;
    
    const newPrediction = { userId: user.email, matchId, home: Number(h), away: Number(a) };
    
    setAllPredictions(prev => {
        const existingIdx = prev.findIndex(p => p.userId === user.email && p.matchId === matchId);
        if (existingIdx > -1) {
            const newPreds = [...prev]; 
            newPreds[existingIdx] = newPrediction;
            return newPreds;
        } else return [...prev, newPrediction];
    });

    if (isSupabaseConfigured && supabase) {
       const { error } = await supabase.from('predictions').upsert({ 
          user_id: user.email, 
          match_id: matchId, 
          home: Number(h), 
          away: Number(a) 
       }, { onConflict: 'user_id,match_id' });

       if (error) {
           console.error("Autosave failed:", error.message || error);
           if (error.message.includes('uuid') || error.message.includes('foreign key')) {
                addToast('error', 'Schema Mismatch', 'Run the Reset Script in Debug Console > SQL Setup.');
           }
       }
    }
  };

  const hasGroupPredictions = useMemo(() => {
    if (!user) return false;
    return allPredictions.some(p => 
      p.userId === user.email && 
      matches.some(m => m.id === p.matchId && m.groupId)
    );
  }, [allPredictions, user, matches]);

  const hasKnockoutPredictions = useMemo(() => {
    if (!user) return false;
    return allPredictions.some(p => 
      p.userId === user.email && 
      matches.some(m => m.id === p.matchId && m.round && m.round !== 'R32')
    );
  }, [allPredictions, user, matches]);

  const showClearTrash = useMemo(() => {
    if (activeTab === 'groups') return hasGroupPredictions;
    if (activeTab === 'knockout') return hasKnockoutPredictions;
    return false;
  }, [activeTab, hasGroupPredictions, hasKnockoutPredictions]);

  const handleClearPredictions = useCallback(async () => {
    if (!user) return; 

    try {
        if (activeTab === 'groups') {
           setAllPredictions(prev => prev.filter(p => p.userId !== user.email));
           if (isSupabaseConfigured && supabase) {
              await supabase.from('predictions').delete().eq('user_id', user.email);
           }
        } else if (activeTab === 'knockout') {
           const protectedMatchIds = new Set(
             matches
              .filter(m => m.groupId || m.round === 'R32')
              .map(m => m.id)
           );
    
           setAllPredictions(prev => prev.filter(p => 
              p.userId !== user.email || protectedMatchIds.has(p.matchId)
           ));
           
           if (isSupabaseConfigured && supabase) {
              const matchIdsToDelete = matches
                .filter(m => m.round && m.round !== 'R32')
                .map(m => m.id);
              
              if (matchIdsToDelete.length > 0) {
                await supabase.from('predictions')
                  .delete()
                  .eq('user_id', user.email)
                  .in('match_id', matchIdsToDelete);
              }
           }
        }
        addToast('info', 'Cleared', 'Predictions have been reset.');
    } catch (err) {
        console.error("Failed to clear predictions:", err);
        addToast('error', 'Error', 'Failed to clear predictions.');
    }
  }, [user, activeTab, matches, isSupabaseConfigured]);

  const navTabs = useMemo(() => {
    if (tournamentPhase === 'PRE_LIVE') return ['groups', 'knockout', 'scouting', 'manager'];
    // Removed 'second-chance' from here as it's now internal
    const liveTabs = ['leaderboard', 'tournament', 'manager', 'analysis'];
    return liveTabs;
  }, [tournamentPhase]);

  const standings = useMemo(() => calculateGroupStandings(activeGroup, matches, teamsData), [activeGroup, matches, teamsData]);
  const groupMatchesList = matches.filter(m => m.groupId === activeGroup);
  const rivalsList = useMemo(() => (Object.values(usersDb) as UserProfile[]).filter(u => u.email !== user?.email), [usersDb, user]);
  
  const showMagicWand = (tournamentPhase === 'PRE_LIVE' && activeTab !== 'leaderboard' && activeTab !== 'manager' && activeTab !== 'scouting') ||
                        (tournamentPhase === 'LIVE' && user?.hasTakenSecondChance && (activeTab === 'knockout'));

  const handleGoToGroup = (groupId: string) => {
    setActiveGroup(groupId); setActiveTab('groups'); setShowOverview(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTimeTravel = (timestamp: number) => {
      const simulatedMatches = simulateTournamentAtDate(matches, teamsData, timestamp);
      setMatches(simulatedMatches);
      setTournamentPhase('LIVE');
  };

  if (!isLoggedIn) return <LoginScreen onLogin={handleAuth} currentLang={language} setLang={handleLanguageSwitch} isLoading={isAuthLoading} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-32 md:pb-12">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* INTRO VIDEO MODAL */}
      <IntroVideoModal 
        isOpen={showIntroModal} 
        videoSrc={introVideoUrl} 
        onClose={() => setShowIntroModal(false)} 
      />

      <header className="sticky top-0 z-50">
        <div className="bg-[#0f2545] text-white border-b border-white/10 shadow-lg relative z-20">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <button onClick={handleReplayIntro} className="focus:outline-none transition-transform active:scale-95" title="Replay Intro Video">
                       <Logo className="w-12 h-12" variant="theme" />
                   </button>
                   <div className="hidden md:block">
                      <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none">Rasten Cup</h1>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 mr-2">
                        {LANGUAGES.map(l => (
                          <button
                            key={l.code}
                            onClick={() => handleLanguageSwitch(l.code)}
                            className={`w-6 h-4 sm:w-8 sm:h-5 rounded overflow-hidden transition-all duration-200 transform ${language === l.code ? 'ring-2 ring-yellow-400 scale-110 z-10 shadow-md grayscale-0' : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105'}`}
                            title={l.name}
                          >
                             <img src={l.flag} alt={l.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                    </div>

                    <button onClick={() => setTournamentPhase(prev => prev === 'PRE_LIVE' ? 'LIVE' : 'PRE_LIVE')} className={`text-[9px] px-2 py-0.5 rounded font-black uppercase border transition-all ${tournamentPhase === 'LIVE' ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-green-600/20 border-green-500 text-green-500'}`}>
                        {tournamentPhase === 'LIVE' ? 'LIVE' : 'PRE'}
                    </button>
                    <div className="relative">
                        <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 group focus:outline-none relative">
                            <AvatarDisplay avatar={user?.avatar || ''} size="sm" />
                            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full border border-white shadow-sm">
                               <Edit3 size={8} />
                            </div>
                        </button>
                        {isProfileMenuOpen && (
                          <>
                             <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)}></div>
                             <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in slide-in-from-top-2">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col items-center">
                                   <div className="relative mb-2 group cursor-pointer" onClick={() => { setShowAvatarEditor(true); setIsProfileMenuOpen(false); }}>
                                       <AvatarDisplay avatar={user?.avatar || ''} size="lg" />
                                       <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                           <Edit3 size={20} className="text-white drop-shadow-md" />
                                       </div>
                                   </div>
                                   <div className="text-xs font-black text-slate-800 uppercase tracking-wide">{user?.name}</div>
                                   <div className="flex gap-2 mt-1">
                                       <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{user?.tokens} Intel</div>
                                       <div className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">{user?.substitutions} Subs</div>
                                   </div>
                                </div>
                                <div className="p-1">
                                   <button onClick={() => { setShowAvatarEditor(true); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center gap-2 transition-colors"><UserCircle2 size={16} /> Change Identity</button>
                                   <button onClick={() => { setShowRules(true); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg flex items-center gap-2 transition-colors"><BookOpen size={16} /> {t.rulesBtn}</button>
                                   <button onClick={() => { setIsDebugOpen(true); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-2 transition-colors border-t border-slate-100 mt-1"><Bot size={16} /> Debug Console</button>
                                   <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors mt-1"><LogOut size={16} /> {t.logout}</button>
                                </div>
                             </div>
                          </>
                        )}
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-[#0f2545]/95 backdrop-blur-md border-b border-white/5 shadow-2xl relative z-10">
            <div className="max-w-5xl mx-auto px-4 overflow-x-auto no-scrollbar">
                <nav className="flex justify-center">
                    {navTabs.map((tab) => {
                       const isActive = activeTab === tab;
                       let label = '';
                       const val = t[tab as keyof typeof t];
                       if (tab === 'manager') label = (tournamentPhase === 'PRE_LIVE' ? t.managersTab : t.tabManager) as string; 
                       else if (tab === 'analysis') label = t.analysisTab as string;
                       else if (tab === 'scouting') label = t.scoutingTab as string;
                       else if (tab === 'tournament') label = t.tabTournament as string; 
                       else label = (typeof val === 'string' ? val : tab) as string;
                       
                       return (
                          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`relative px-4 py-6 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-400 hover:text-blue-200'}`}>
                             {label}
                             {isActive && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-t-full shadow-[0_-2px_10px_rgba(250,204,21,0.6)]"></span>}
                          </button>
                       );
                    })}
                </nav>
            </div>
        </div>
        
        {activeTab === 'groups' && tournamentPhase === 'PRE_LIVE' && (
            <div className="bg-[#0f2545] border-b border-white/5 py-6 shadow-inner overflow-x-auto no-scrollbar">
                <div className="flex gap-2 px-4 justify-start sm:justify-center">
                    {GROUP_CONFIG.map(g => {
                        const groupMatches = matches.filter(m => m.groupId === g.id);
                        const userPredsCount = allPredictions.filter(p => groupMatches.some(m => m.id === p.matchId && p.userId === user?.email)).length;
                        const isComplete = userPredsCount === groupMatches.length && groupMatches.length > 0;
                        const inProgress = userPredsCount > 0 && !isComplete;
                        const isActive = activeGroup === g.id && !showOverview;
                        
                        return (
                            <button 
                                key={g.id}
                                onClick={() => { setActiveGroup(g.id); setShowOverview(false); }}
                                className={`relative min-w-[64px] h-16 rounded-xl overflow-hidden transition-all duration-300 transform active:scale-95 border-2 ${isActive ? 'scale-110 border-yellow-400 z-10 shadow-2xl' : 'border-white/10 hover:border-white/30'}`}
                            >
                                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-50 group-hover:opacity-70 transition-opacity">
                                    {g.teams.map(tid => (
                                        <img key={tid} src={teamsData[tid]?.flag} className="w-full h-full object-cover" alt="" />
                                    ))}
                                </div>
                                <div className="absolute inset-0 bg-black/40"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-3xl font-black text-white italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{g.id}</span>
                                </div>
                                <div className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-black/50 ${isComplete ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : inProgress ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]' : 'bg-slate-500'}`}></div>
                            </button>
                        );
                    })}

                    <button 
                        onClick={() => setShowOverview(true)}
                        className={`relative min-w-[64px] h-16 rounded-xl overflow-hidden transition-all duration-300 transform active:scale-95 border-2 flex flex-col items-center justify-center gap-1 ${showOverview ? 'scale-110 border-yellow-400 z-10 shadow-2xl bg-blue-900' : 'border-white/10 hover:border-white/30 bg-white/5'}`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900 opacity-80"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <LayoutGrid size={24} className="text-white" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">{t.tablesBtn}</span>
                        </div>
                    </button>
                </div>
            </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'analysis' && user && <AnalysisDashboard currentUser={user} rivals={rivalsList} matches={matches} allPredictions={allPredictions} teams={teamsData} lang={t} currentLang={language} onTeamClick={handleTeamClick} />}
        {activeTab === 'scouting' && <ScoutingCenter teams={teamsData} lang={t} currentLang={language} />}
        
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
                    const myOldPreds = prev.filter(p => p.userId === user.email);
                    
                    const mergedMyPreds = [...myOldPreds];
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
                       await supabase.from('predictions').upsert(payload, { onConflict: 'user_id,match_id' });
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