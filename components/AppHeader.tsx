import React, { useMemo } from 'react';
import { Edit3, UserCircle2, BookOpen, Bot, LogOut, LayoutGrid, Users, Shield, Columns, Crown, CheckCircle, PlayCircle } from 'lucide-react';
import { Logo } from './Logo';
import { AvatarDisplay } from './AvatarDisplay';
import { LANGUAGES, GROUP_CONFIG } from '../constants';
import { LanguageCode, TournamentPhase, Round, UserProfile, Translation, Match, Team, Prediction } from '../types';

interface AppHeaderProps {
  user: UserProfile;
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  tournamentPhase: TournamentPhase;
  setTournamentPhase: (p: TournamentPhase) => void;
  activeTab: string;
  setActiveTab: (t: any) => void;
  activeGroup: string;
  setActiveGroup: (g: string) => void;
  showOverview: boolean;
  setShowOverview: (b: boolean) => void;
  isProfileMenuOpen: boolean;
  setIsProfileMenuOpen: (b: boolean) => void;
  setShowAvatarEditor: (b: boolean) => void;
  setIsDebugOpen: (b: boolean) => void;
  setShowRules: (b: boolean) => void;
  handleLogout: () => void;
  onReplayIntro: () => void;
  onStartTour: () => void;
  navTabs: string[];
  t: Translation;
  matches: Match[];
  teamsData: Record<string, Team>;
  allPredictions: Prediction[];
  activeKnockoutRound?: Round;
  setActiveKnockoutRound?: (r: Round) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = (props) => {
  const { user, t, matches, teamsData, allPredictions } = props;

  const getRoundIcon = (r: Round) => {
      switch(r) {
          case 'R32': return <Users size={48} className="text-white/20" />; 
          case 'R16': return <Shield size={42} className="text-white/20" />;
          case 'QF': return <LayoutGrid size={42} className="text-white/20" />;
          case 'SF': return <Columns size={42} className="text-white/20" />;
          case 'FIN': return <Crown size={48} className="text-yellow-400/30" />;
          default: return null;
      }
  };

  const rounds: Round[] = ['R32', 'R16', 'QF', 'SF', 'FIN'];

  const completionStats = useMemo(() => {
    const groupMatches = matches.filter(m => m.groupId);
    const total = groupMatches.length;
    const myPreds = new Set(allPredictions.filter(p => p.userId === user.email).map(p => p.matchId));
    const completed = groupMatches.filter(m => myPreds.has(m.id)).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }, [matches, allPredictions, user.email]);

  return (
    <header className="sticky top-0 z-50">
      
      {/* 1. TOP BAR */}
      <div className="bg-[#0f2545] text-white border-b border-white/10 shadow-lg relative z-20">
          
          {/* COMPLETION BAR */}
          {props.tournamentPhase === 'PRE_LIVE' && completionStats.total > 0 && (
            <div className="bg-[#0a1a2f] border-b border-white/5 py-1 px-4 relative overflow-hidden group">
                <div className="max-w-5xl mx-auto flex items-center gap-3 relative z-10">
                    <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                        <span className="opacity-50">{t.progressGroups || "Progress"}:</span> 
                        <span className={completionStats.percentage === 100 ? "text-green-400" : "text-white"}>
                            {completionStats.completed}/{completionStats.total}
                        </span>
                    </span>
                    <div className="flex-1 h-1.5 bg-blue-900/30 rounded-full overflow-hidden relative">
                        <div 
                            className={`h-full transition-all duration-1000 ease-out rounded-full ${completionStats.percentage === 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`} 
                            style={{ width: `${completionStats.percentage}%` }}
                        ></div>
                    </div>
                    {completionStats.percentage === 100 && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-green-400 uppercase tracking-widest animate-in fade-in zoom-in">
                            <CheckCircle size={10} strokeWidth={3} />
                            <span>{t.managerReady || "Ready"}</span>
                        </div>
                    )}
                </div>
                {completionStats.percentage === 100 && <div className="absolute inset-0 bg-green-500/5 animate-pulse"></div>}
            </div>
          )}

          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <button onClick={props.onReplayIntro} className="focus:outline-none transition-transform active:scale-95" title="Replay Intro Video">
                     <Logo className="w-12 h-12" variant="theme" />
                 </button>
                 <div className="hidden md:block">
                    <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none">Rasten Cup</h1>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 mr-2">
                      {LANGUAGES.map(l => (
                        <button key={l.code} onClick={() => props.setLanguage(l.code)} className={`w-6 h-4 sm:w-8 sm:h-5 rounded overflow-hidden transition-all duration-200 transform ${props.language === l.code ? 'ring-2 ring-yellow-400 scale-110 z-10 shadow-md grayscale-0' : 'opacity-60 grayscale hover:opacity-100 hover:scale-105'}`} title={l.name}>
                           <img src={l.flag} alt={l.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                  </div>

                  <button onClick={() => props.setTournamentPhase(props.tournamentPhase === 'PRE_LIVE' ? 'LIVE' : 'PRE_LIVE')} className={`text-[9px] px-2 py-0.5 rounded font-black uppercase border transition-all ${props.tournamentPhase === 'LIVE' ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-green-600/20 border-green-500 text-green-500'}`}>
                      {props.tournamentPhase === 'LIVE' ? 'LIVE' : 'PRE'}
                  </button>
                  <div className="relative">
                      <button id="btn-profile-menu" onClick={() => props.setIsProfileMenuOpen(!props.isProfileMenuOpen)} className="flex items-center gap-2 group focus:outline-none relative">
                          <AvatarDisplay avatar={user?.avatar || ''} size="sm" />
                          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full border border-white shadow-sm"><Edit3 size={8} /></div>
                      </button>
                      {props.isProfileMenuOpen && (
                        <>
                           <div className="fixed inset-0 z-10" onClick={() => props.setIsProfileMenuOpen(false)}></div>
                           <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in slide-in-from-top-2">
                              <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col items-center">
                                 <div className="relative mb-2 group cursor-pointer" onClick={() => { props.setShowAvatarEditor(true); props.setIsProfileMenuOpen(false); }}>
                                     <AvatarDisplay avatar={user?.avatar || ''} size="lg" />
                                     <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={20} className="text-white drop-shadow-md" /></div>
                                 </div>
                                 <div className="text-xs font-black text-slate-800 uppercase tracking-wide">{user?.name}</div>
                                 <div className="flex gap-2 mt-1">
                                     <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{user?.tokens} Intel</div>
                                     <div className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">{user?.substitutions} Subs</div>
                                 </div>
                              </div>
                              <div className="p-1">
                                 {/* Restart Tour Button */}
                                 {props.tournamentPhase === 'PRE_LIVE' && (
                                     <button onClick={() => { props.onStartTour(); props.setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-amber-600 hover:bg-amber-50 hover:text-amber-700 rounded-lg flex items-center gap-2 transition-colors"><PlayCircle size={16} /> Replay Stadium Tour</button>
                                 )}
                                 
                                 <button onClick={() => { props.setShowAvatarEditor(true); props.setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center gap-2 transition-colors"><UserCircle2 size={16} /> {t.changeIdentity}</button>
                                 <button onClick={() => { props.setShowRules(true); props.setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg flex items-center gap-2 transition-colors"><BookOpen size={16} /> {t.rulesBtn}</button>
                                 <button onClick={() => { props.setIsDebugOpen(true); props.setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-2 transition-colors border-t border-slate-100 mt-1"><Bot size={16} /> Admin Controls</button>
                                 <button onClick={props.handleLogout} className="w-full text-left px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors mt-1"><LogOut size={16} /> {t.logout}</button>
                              </div>
                           </div>
                        </>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* 2. TAB NAVIGATION */}
      <div className="bg-[#0f2545]/95 backdrop-blur-md border-b border-white/5 shadow-2xl relative z-10">
          <div className="max-w-5xl mx-auto px-4 overflow-x-auto no-scrollbar">
              <nav className="flex justify-center">
                  {props.navTabs.map((tab) => {
                     const isActive = props.activeTab === tab;
                     let label = '';
                     const val = t[tab as keyof typeof t];
                     if (tab === 'manager') label = (props.tournamentPhase === 'PRE_LIVE' ? t.managersTab : t.tabManager) as string; 
                     else if (tab === 'analysis') label = t.analysisTab as string;
                     else if (tab === 'scouting') label = t.scoutingTab as string;
                     else if (tab === 'tournament') label = t.tabTournament as string; 
                     else if (tab === 'leaderboard') label = (props.tournamentPhase === 'PRE_LIVE' ? t.competition : t.leaderboard) as string;
                     else label = (typeof val === 'string' ? val : tab) as string;
                     
                     let tabId = undefined;
                     if (tab === 'groups') tabId = 'nav-groups';
                     else if (tab === 'knockout') tabId = 'nav-knockout'; 
                     else if (tab === 'leaderboard') tabId = 'nav-leaderboard';

                     return (
                        <button 
                            key={tab} 
                            id={tabId}
                            onClick={() => props.setActiveTab(tab as any)} 
                            className={`relative px-4 py-6 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-400 hover:text-blue-200'}`}
                        >
                           {label}
                           {isActive && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-t-full shadow-[0_-2px_10px_rgba(250,204,21,0.6)]"></span>}
                        </button>
                     );
                  })}
              </nav>
          </div>
      </div>
      
      {/* 3. GROUP NAV (Only for Groups Tab) */}
      {props.activeTab === 'groups' && props.tournamentPhase === 'PRE_LIVE' && (
          <div id="subnav-groups" className="bg-[#0f2545] border-b border-white/5 py-6 shadow-inner overflow-x-auto no-scrollbar"> {/* <--- ADDED ID HERE */}
              <div className="flex gap-2 px-4 justify-start sm:justify-center">
                  {GROUP_CONFIG.map(g => {
                      const groupMatches = matches.filter(m => m.groupId === g.id);
                      const userPredsCount = allPredictions.filter(p => groupMatches.some(m => m.id === p.matchId && p.userId === user?.email)).length;
                      const isComplete = userPredsCount === groupMatches.length && groupMatches.length > 0;
                      const inProgress = userPredsCount > 0 && !isComplete;
                      const isActive = props.activeGroup === g.id && !props.showOverview;
                      
                      return (
                          <button key={g.id} onClick={() => { props.setActiveGroup(g.id); props.setShowOverview(false); }} className={`relative min-w-[64px] h-16 rounded-xl overflow-hidden transition-all duration-300 transform active:scale-95 border-2 ${isActive ? 'scale-110 border-yellow-400 z-10 shadow-2xl' : 'border-white/10 hover:border-white/30'}`}>
                              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-50 group-hover:opacity-70 transition-opacity">
                                  {g.teams.map(tid => (<img key={tid} src={teamsData[tid]?.flag} className="w-full h-full object-cover" alt="" />))}
                              </div>
                              <div className="absolute inset-0 bg-black/40"></div>
                              <div className="absolute inset-0 flex items-center justify-center"><span className="text-3xl font-black text-white italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{g.id}</span></div>
                              <div className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-black/50 ${isComplete ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : inProgress ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]' : 'bg-slate-500'}`}></div>
                          </button>
                      );
                  })}
                  <button onClick={() => props.setShowOverview(true)} className={`relative min-w-[64px] h-16 rounded-xl overflow-hidden transition-all duration-300 transform active:scale-95 border-2 flex flex-col items-center justify-center gap-1 ${props.showOverview ? 'scale-110 border-yellow-400 z-10 shadow-2xl bg-blue-900' : 'border-white/10 hover:border-white/30 bg-white/5'}`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900 opacity-80"></div>
                      <div className="relative z-10 flex flex-col items-center"><LayoutGrid size={24} className="text-white" /><span className="text-[9px] font-black text-white uppercase tracking-widest">{t.tablesBtn}</span></div>
                  </button>
              </div>
          </div>
      )}

      {/* 4. KNOCKOUT NAV (Strictly for 'knockout' tab only) */}
      {props.activeTab === 'knockout' && props.setActiveKnockoutRound && (
          <div id="subnav-knockout" className="bg-[#0f2545] border-b border-white/5 py-6 shadow-inner overflow-x-auto no-scrollbar"> {/* <--- ADDED ID HERE */}
              <div className="flex gap-3 px-4 justify-start sm:justify-center min-w-max">
                  {rounds.map(r => {
                      const isActive = props.activeKnockoutRound === r;
                      const roundMatches = matches.filter(m => m.round === r);
                      const userPredictions = allPredictions.filter(p => p.userId === user?.email);
                      const predsCount = userPredictions.filter(p => roundMatches.some(m => m.id === p.matchId)).length;
                      const isComplete = roundMatches.length > 0 && predsCount === roundMatches.length;
                      const inProgress = predsCount > 0 && !isComplete;

                      return (
                          <button
                              key={r}
                              onClick={() => props.setActiveKnockoutRound?.(r)}
                              className={`
                                  relative min-w-[72px] h-16 rounded-xl overflow-hidden transition-all duration-300 transform active:scale-95 border-2 
                                  ${isActive 
                                      ? 'scale-110 border-yellow-400 z-10 shadow-[0_0_20px_rgba(250,204,21,0.4)]' 
                                      : 'border-white/10 hover:border-white/30 bg-white/5 opacity-80 hover:opacity-100'
                                  }
                              `}
                          >
                              <div className="absolute inset-0 flex items-center justify-center opacity-40 scale-125 transform group-hover:scale-110 transition-transform duration-700">
                                  {getRoundIcon(r)}
                              </div>
                              <div className="absolute inset-0 bg-black/30"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                  <span className={`text-xl font-black italic tracking-tighter ${isActive ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-slate-300'}`}>
                                      {r === 'FIN' ? 'FINAL' : r}
                                  </span>
                              </div>
                              <div className={`
                                  absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-black/50 shadow-sm
                                  ${isComplete ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' 
                                    : inProgress ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]' 
                                    : 'bg-slate-500'}
                              `}></div>
                          </button>
                      );
                  })}
              </div>
          </div>
      )}
    </header>
  );
};