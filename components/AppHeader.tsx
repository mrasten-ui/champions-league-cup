import React from 'react';
import { Logo } from './Logo';
import { AvatarDisplay } from './AvatarDisplay';
import { LayoutGrid, Edit3, UserCircle2, BookOpen, Bot, LogOut } from 'lucide-react';
import { LANGUAGES, GROUP_CONFIG } from '../constants';
import { LanguageCode, UserProfile, Translation, TournamentPhase, Match, Prediction, Team } from '../types';

interface AppHeaderProps {
  user: UserProfile;
  lang: Translation;
  currentLang: LanguageCode;
  setLang: (code: LanguageCode) => void;
  tournamentPhase: TournamentPhase;
  setTournamentPhase: (phase: TournamentPhase) => void;
  onReplayIntro: () => void;
  isProfileMenuOpen: boolean;
  setIsProfileMenuOpen: (open: boolean) => void;
  onLogout: () => void;
  onChangeIdentity: () => void;
  onShowRules: () => void;
  onDebug: () => void;
  
  // Navigation
  activeTab: string;
  setActiveTab: (tab: any) => void;
  navTabs: string[];
  
  // Group Selector Logic
  activeGroup: string;
  setActiveGroup: (g: string) => void;
  showOverview: boolean;
  setShowOverview: (show: boolean) => void;
  matches: Match[];
  teams: Record<string, Team>;
  allPredictions: Prediction[];
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  user, lang, currentLang, setLang, tournamentPhase, setTournamentPhase,
  onReplayIntro, isProfileMenuOpen, setIsProfileMenuOpen, onLogout,
  onChangeIdentity, onShowRules, onDebug, activeTab, setActiveTab, navTabs,
  activeGroup, setActiveGroup, showOverview, setShowOverview, matches, teams, allPredictions
}) => {
  return (
    <div className="sticky top-0 z-50">
        {/* Main Bar */}
        <div className="bg-[#0f2545] text-white border-b border-white/10 shadow-lg relative z-20">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <button onClick={onReplayIntro} className="focus:outline-none transition-transform active:scale-95" title="Replay Intro Video">
                       <Logo className="w-12 h-12" variant="theme" />
                   </button>
                   <div className="hidden md:block">
                      <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none">Rasten Cup</h1>
                   </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Language Switcher */}
                    <div className="flex items-center gap-1.5 mr-2">
                        {LANGUAGES.map(l => (
                          <button key={l.code} onClick={() => setLang(l.code)} className={`w-6 h-4 sm:w-8 sm:h-5 rounded overflow-hidden transition-all duration-200 transform ${currentLang === l.code ? 'ring-2 ring-yellow-400 scale-110 z-10 shadow-md grayscale-0' : 'opacity-60 grayscale hover:opacity-100 hover:scale-105'}`} title={l.name}>
                             <img src={l.flag} alt={l.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                    </div>

                    {/* Phase Toggle (Admin) */}
                    <button onClick={() => setTournamentPhase(tournamentPhase === 'PRE_LIVE' ? 'LIVE' : 'PRE_LIVE')} className={`text-[9px] px-2 py-0.5 rounded font-black uppercase border transition-all ${tournamentPhase === 'LIVE' ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-green-600/20 border-green-500 text-green-500'}`}>
                        {tournamentPhase === 'LIVE' ? 'LIVE' : 'PRE'}
                    </button>

                    {/* Profile Menu */}
                    <div className="relative">
                        <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 group focus:outline-none relative">
                            <AvatarDisplay avatar={user.avatar} size="sm" />
                            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full border border-white shadow-sm">
                               <Edit3 size={8} />
                            </div>
                        </button>
                        
                        {isProfileMenuOpen && (
                          <>
                             <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)}></div>
                             <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in slide-in-from-top-2">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col items-center">
                                   <div className="relative mb-2 group cursor-pointer" onClick={onChangeIdentity}>
                                       <AvatarDisplay avatar={user.avatar} size="lg" />
                                       <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                           <Edit3 size={20} className="text-white drop-shadow-md" />
                                       </div>
                                   </div>
                                   <div className="text-xs font-black text-slate-800 uppercase tracking-wide">{user.name}</div>
                                   <div className="flex gap-2 mt-1">
                                       <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{user.tokens} Intel</div>
                                       <div className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">{user.substitutions} Subs</div>
                                   </div>
                                </div>
                                <div className="p-1">
                                   <button onClick={onChangeIdentity} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center gap-2 transition-colors"><UserCircle2 size={16} /> Change Identity</button>
                                   <button onClick={onShowRules} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg flex items-center gap-2 transition-colors"><BookOpen size={16} /> {lang.rulesBtn}</button>
                                   <button onClick={onDebug} className="w-full text-left px-3 py-2 text-sm font-bold text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-2 transition-colors border-t border-slate-100 mt-1"><Bot size={16} /> Debug Console</button>
                                   <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors mt-1"><LogOut size={16} /> {lang.logout}</button>
                                </div>
                             </div>
                          </>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#0f2545]/95 backdrop-blur-md border-b border-white/5 shadow-2xl relative z-10">
            <div className="max-w-5xl mx-auto px-4 overflow-x-auto no-scrollbar">
                <nav className="flex justify-center">
                    {navTabs.map((tab) => {
                       const isActive = activeTab === tab;
                       let label = '';
                       const val = lang[tab as keyof typeof lang];
                       
                       if (tab === 'manager') label = (tournamentPhase === 'PRE_LIVE' ? lang.managersTab : lang.tabManager) as string; 
                       else if (tab === 'analysis') label = lang.analysisTab as string;
                       else if (tab === 'scouting') label = lang.scoutingTab as string;
                       else if (tab === 'tournament') label = lang.tabTournament as string; 
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
        
        {/* Group Selector (Only Active in Groups Tab & Pre-Live) */}
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
                                        <img key={tid} src={teams[tid]?.flag} className="w-full h-full object-cover" alt="" />
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
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">{lang.tablesBtn}</span>
                        </div>
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};