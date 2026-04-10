import React, { useMemo, useState, useEffect } from 'react';
import { Edit3, UserCircle2, BookOpen, Bot, LogOut, LayoutGrid, Users, Shield, Columns, Crown, CheckCircle, PlayCircle, Lock, Trophy, Calendar, User, TrendingUp } from 'lucide-react';
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
  setShowAdminLogin: (b: boolean) => void;
  setShowRules: (b: boolean) => void;
  handleLogout: () => void;
  onReplayIntro: () => void;
  onStartTour: () => void;
  onStartLiveTour?: () => void;
  showSecondChanceBadge?: boolean;
  isAdminMode?: boolean;
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

  // --- MODIFIED: Count ALL Matches (104 Total) ---
  const completionStats = useMemo(() => {
    // Filter for any match that has a Group ID OR a Round (Knockout)
    const tournamentMatches = matches.filter(m => m.groupId || m.round);
    const total = tournamentMatches.length;
    
    const myPreds = new Set(allPredictions.filter(p => p.userId === user.email).map(p => p.matchId));
    const completed = tournamentMatches.filter(m => myPreds.has(m.id)).length;
    
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }, [matches, allPredictions, user.email]);


  // --- DEADLINE COUNTDOWN ---
  const deadline = useMemo(() => {
    if (props.tournamentPhase !== 'PRE_LIVE') return null;
    const valid = matches.filter(m => m.date && m.date !== 'TBD');
    if (!valid.length) return null;
    const earliest = valid.reduce((a, b) => new Date(a.date) < new Date(b.date) ? a : b);
    return new Date(earliest.date).getTime() - 15 * 60 * 1000;
  }, [matches, props.tournamentPhase]);

  const [remaining, setRemaining] = useState(() => deadline ? deadline - Date.now() : 0);
  useEffect(() => {
    if (!deadline) return;
    setRemaining(deadline - Date.now());
    const id = setInterval(() => setRemaining(deadline - Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const [showDeadlineModal, setShowDeadlineModal] = useState(false);

  const deadlineFormatted = useMemo(() => {
    if (!deadline) return '';
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(deadline));
  }, [deadline]);

  const countdownUnits = useMemo(() => {
    if (!deadline || remaining <= 0) return null;
    const total = Math.floor(remaining / 1000);
    const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');
    const isCritical = remaining < 3600 * 1000;
    const isUrgent   = remaining < 24 * 3600 * 1000;
    const numClass = isCritical ? 'text-red-400 animate-pulse' : isUrgent ? 'text-amber-400' : 'text-slate-300';
    const labelClass = isCritical ? 'text-red-500/60' : isUrgent ? 'text-amber-500/60' : 'text-slate-500';

    const d  = pad(Math.floor(total / 86400));
    const h  = pad(Math.floor((total % 86400) / 3600));
    const m  = pad(Math.floor((total % 3600) / 60));
    const s  = pad(total % 60);

    // Header: D/H/M normally; H/M/S when urgent; M/S when critical
    const headerUnits = isCritical
      ? [{ val: h, label: t.hours || 'Hrs' }, { val: m, label: t.minutes || 'Min' }, { val: s, label: t.seconds || 'Sec' }]
      : isUrgent
      ? [{ val: h, label: t.hours || 'Hrs' }, { val: m, label: t.minutes || 'Min' }, { val: s, label: t.seconds || 'Sec' }]
      : [{ val: d, label: t.days || 'Days' }, { val: h, label: t.hours || 'Hrs' }, { val: m, label: t.minutes || 'Min' }];

    // Modal: always all four
    const modalUnits = [
      { val: d, label: t.days    || 'Days' },
      { val: h, label: t.hours   || 'Hrs'  },
      { val: m, label: t.minutes || 'Min'  },
      { val: s, label: t.seconds || 'Sec'  },
    ];

    return { headerUnits, modalUnits, numClass, labelClass, isCritical, isUrgent };
  }, [remaining, deadline, t]);

  // --- HELPER: Tab icon for bottom nav ---
  const getTabIcon = (tab: string) => {
      switch (tab) {
          case 'leaderboard': return <Trophy size={20} />;
          case 'tournament':  return <Calendar size={20} />;
          case 'manager':     return <User size={20} />;
          case 'analysis':    return <TrendingUp size={20} />;
          case 'groups':      return <LayoutGrid size={20} />;
          case 'knockout':    return <Shield size={20} />;
          case 'scouting':    return <Users size={20} />;
          default:            return <LayoutGrid size={20} />;
      }
  };

  // --- HELPER: Tab label (shared between bottom nav and desktop tabs) ---
  const getTabLabel = (tab: string): string => {
      if (tab === 'manager')     return (props.tournamentPhase === 'PRE_LIVE' ? props.t.managersTab : props.t.tabManager) as string;
      if (tab === 'analysis')    return props.t.analysisTab as string;
      if (tab === 'scouting')    return props.t.scoutingTab as string;
      if (tab === 'tournament')  return props.t.tabTournament as string;
      if (tab === 'leaderboard') return (props.tournamentPhase === 'PRE_LIVE' ? props.t.competition : props.t.leaderboard) as string;
      const val = props.t[tab as keyof typeof props.t];
      return typeof val === 'string' ? val : tab;
  };

  // --- HELPER: Render Navigation Tabs (Reused for Mobile/Desktop) ---
  const renderNavTabs = (isDesktop: boolean) => (
      <nav className={`flex ${isDesktop ? 'items-center gap-1 h-full' : 'justify-center'}`}>
          {props.navTabs.map((tab) => {
             const isActive = props.activeTab === tab;
             const label = getTabLabel(tab);
             
             let tabId = undefined;
             if (tab === 'groups') tabId = isDesktop ? 'nav-groups-desk' : 'nav-groups'; // Distinct IDs helps Tour Guide find correct element
             else if (tab === 'knockout') tabId = isDesktop ? 'nav-knockout-desk' : 'nav-knockout'; 
             else if (tab === 'leaderboard') tabId = isDesktop ? 'nav-leaderboard-desk' : 'nav-leaderboard';
             else if (tab === 'tournament') tabId = isDesktop ? 'nav-tournament-desk' : 'nav-tournament';
             else if (tab === 'manager')    tabId = isDesktop ? 'nav-manager-desk'    : 'nav-manager';
             else if (tab === 'analysis')   tabId = isDesktop ? 'nav-analysis-desk'   : 'nav-analysis';

             return (
                <button
                    key={tab}
                    id={tabId}
                    onClick={() => props.setActiveTab(tab as any)}
                    className={`
                        relative font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center
                        ${isDesktop
                            ? `h-full px-5 text-[13px] ${isActive ? 'text-white' : 'text-slate-300 hover:text-white'}`
                            : `px-4 py-7 text-xs ${isActive ? 'text-white' : 'text-slate-400 hover:text-blue-200'}`
                        }
                    `}
                >
                   {label}
                   {tab === 'manager' && props.showSecondChanceBadge && (
                     <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
                   )}
                   {/* Active underline — same treatment on both mobile and desktop */}
                   {isActive && <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-t-full shadow-[0_0_10px_rgba(250,204,21,0.7)]" />}
                </button>
             );
          })}
      </nav>
  );

  return (
    <>
    <header className="sticky top-0 z-50">
      
      {/* 1. MAIN HEADER BAR (Combines Logo, Desktop Nav, Profile) */}
      <div className="bg-[#0f2545] text-white border-b border-white/10 shadow-lg relative z-20">
          
          {/* Completion Bar (Stacked on top) */}
          {props.tournamentPhase === 'PRE_LIVE' && completionStats.total > 0 && (
            <div className="bg-[#0a1a2f] border-b border-white/5 py-1 px-4 relative overflow-hidden group">
                <div className="max-w-7xl mx-auto flex items-center gap-3 relative z-10">
                    <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                        {/* CHANGED: Switched 't.progressGroups' to 't.progressTotal'.
                           If your 't' object doesn't have 'progressTotal', it defaults to "Tournament Progress".
                           This preserves localization support if you add the key later.
                        */}
                        <span className="opacity-50">{(t as any).progressTotal || "Tournament Progress"}:</span> 
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

          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              {/* LEFT: Logo */}
              <div className="flex items-center gap-3 shrink-0">
                 <button onClick={props.onReplayIntro} className="focus:outline-none transition-transform active:scale-95" title="Replay Intro Video">
                     <Logo className="w-12 h-12" variant="theme" />
                 </button>
                 <div className="hidden md:block">
                    <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none">Rasten Cup</h1>
                 </div>
              </div>

              {/* CENTER: Desktop Navigation (Hidden on Mobile) */}
              <div className="hidden md:flex flex-1 justify-center px-8">
                  {renderNavTabs(true)}
              </div>

              {/* RIGHT: Controls & Profile */}
              <div className="flex items-center gap-3 shrink-0">
                  {/* COUNTDOWN — LED blocks native to the dark header */}
                  {countdownUnits && (
                    <button
                      onClick={() => setShowDeadlineModal(true)}
                      className="flex items-center gap-0.5 border-r border-white/10 pr-3 mr-1 hover:brightness-125 transition-all cursor-pointer"
                      title={t.deadlineLabel || 'Predictions Lock In'}
                    >
                      {countdownUnits.headerUnits.map(({ val, label }, i) => (
                        <React.Fragment key={label}>
                          <div className="flex flex-col items-center">
                            <span className={`text-[7px] font-black uppercase tracking-wide mb-0.5 ${countdownUnits.labelClass}`}>{label}</span>
                            <div className={`bg-black/40 border border-white/5 rounded px-1.5 py-0.5 font-mono font-black text-sm leading-none min-w-[1.8rem] text-center ${countdownUnits.numClass}`}>
                              {val}
                            </div>
                          </div>
                          {i < countdownUnits.headerUnits.length - 1 && (
                            <span className={`text-xs font-bold mt-3 mx-0.5 ${countdownUnits.labelClass}`}>:</span>
                          )}
                        </React.Fragment>
                      ))}
                    </button>
                  )}
                  <div className="flex items-center gap-1.5 mr-2">
                      {LANGUAGES.map(l => (
                        <button key={l.code} onClick={() => props.setLanguage(l.code)} className={`w-6 h-4 sm:w-8 sm:h-5 rounded overflow-hidden transition-all duration-200 transform ${props.language === l.code ? 'ring-2 ring-yellow-400 scale-110 z-10 shadow-md grayscale-0' : 'opacity-60 grayscale hover:opacity-100 hover:scale-105'}`} title={l.name}>
                           <img src={l.flag} alt={l.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                  </div>

                  {props.isAdminMode && (
                      <button onClick={() => props.setTournamentPhase(props.tournamentPhase === 'PRE_LIVE' ? 'LIVE' : 'PRE_LIVE')} className={`text-[9px] px-2 py-0.5 rounded font-black uppercase border transition-all ${props.tournamentPhase === 'LIVE' ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-green-600/20 border-green-500 text-green-500'}`}>
                          {props.tournamentPhase === 'LIVE' ? 'LIVE' : 'PRE'}
                      </button>
                  )}
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
                                  {props.tournamentPhase === 'PRE_LIVE' && (
                                      <button onClick={() => { props.onStartTour(); props.setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-amber-600 hover:bg-amber-50 hover:text-amber-700 rounded-lg flex items-center gap-2 transition-colors"><PlayCircle size={16} /> Replay Stadium Tour</button>
                                  )}
                                  {props.tournamentPhase === 'LIVE' && props.onStartLiveTour && (
                                      <button onClick={() => { props.onStartLiveTour!(); props.setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-amber-600 hover:bg-amber-50 hover:text-amber-700 rounded-lg flex items-center gap-2 transition-colors"><PlayCircle size={16} /> Replay Live Tour</button>
                                  )}
                                  
                                  <button onClick={() => { props.setShowAvatarEditor(true); props.setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center gap-2 transition-colors"><UserCircle2 size={16} /> {t.changeIdentity}</button>
                                  <button onClick={() => { props.setShowRules(true); props.setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg flex items-center gap-2 transition-colors"><BookOpen size={16} /> {t.rulesBtn}</button>
                                  <div className="border-t border-slate-100 mt-1 pt-1">
                                      {props.isAdminMode ? (
                                          <>
                                              <button onClick={() => { props.setIsDebugOpen(true); props.setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 transition-colors"><Bot size={16} /> Management</button>
                                          </>
                                      ) : (
                                          <button onClick={() => { props.setShowAdminLogin(true); props.setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-amber-600 hover:bg-amber-50 rounded-lg flex items-center gap-2 transition-colors"><Shield size={16} /> Admin Login</button>
                                      )}
                                  </div>
                                  <button onClick={props.handleLogout} className="w-full text-left px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors mt-1"><LogOut size={16} /> {t.logout}</button>
                              </div>
                           </div>
                        </>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* 3. GROUP NAV (Only for Groups Tab) */}
      {props.activeTab === 'groups' && props.tournamentPhase === 'PRE_LIVE' && (
          <div id="subnav-groups" className="bg-[#0f2545] border-b border-white/5 py-6 shadow-inner overflow-x-auto no-scrollbar"> 
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
          <div id="subnav-knockout" className="bg-[#0f2545] border-b border-white/5 py-6 shadow-inner overflow-x-auto no-scrollbar"> 
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


      {/* DEADLINE MODAL */}
      {showDeadlineModal && countdownUnits && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowDeadlineModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Glowing top accent bar */}
            <div className={`h-1.5 w-full ${countdownUnits.isCritical ? 'bg-gradient-to-r from-red-600 via-red-400 to-red-600' : countdownUnits.isUrgent ? 'bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600' : 'bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600'}`} />

            {/* Header banner */}
            <div className={`px-6 pt-5 pb-4 text-center ${countdownUnits.isCritical ? 'bg-gradient-to-b from-red-950 to-[#0f2545]' : countdownUnits.isUrgent ? 'bg-gradient-to-b from-amber-950 to-[#0f2545]' : 'bg-gradient-to-b from-[#071a2e] to-[#0f2545]'}`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Lock size={12} className={countdownUnits.isCritical ? 'text-red-400' : countdownUnits.isUrgent ? 'text-amber-400' : 'text-blue-400'} />
                <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${countdownUnits.isCritical ? 'text-red-400' : countdownUnits.isUrgent ? 'text-amber-400' : 'text-blue-400'}`}>
                  {t.deadlineLabel || 'Predictions Lock In'}
                </span>
                <Lock size={12} className={countdownUnits.isCritical ? 'text-red-400' : countdownUnits.isUrgent ? 'text-amber-400' : 'text-blue-400'} />
              </div>

              {/* Scoreboard blocks — label on top, big number below */}
              <div className="flex justify-center items-end gap-2 mt-4">
                {countdownUnits.modalUnits.map(({ val, label }, i) => (
                  <React.Fragment key={label}>
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${countdownUnits.labelClass}`}>{label}</span>
                      <div className={`
                        relative bg-black/60 border rounded-xl font-mono font-black text-4xl leading-none
                        min-w-[3.5rem] py-3 text-center shadow-inner
                        ${countdownUnits.isCritical
                          ? 'border-red-500/30 text-red-400 shadow-red-900/40 animate-pulse'
                          : countdownUnits.isUrgent
                          ? 'border-amber-500/30 text-amber-400 shadow-amber-900/40'
                          : 'border-white/8 text-white shadow-blue-900/20'}
                      `}>
                        {/* Subtle scan-line effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                        {val}
                      </div>
                    </div>
                    {i < countdownUnits.modalUnits.length - 1 && (
                      <span className={`text-2xl font-black mb-3 ${countdownUnits.labelClass} opacity-60`}>:</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Date/info section */}
            <div className="bg-[#0f2545] border-t border-white/5 px-6 py-4 text-center">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">{t.deadlineBodyPre || 'All predictions lock permanently at'}</p>
              <p className={`font-black text-base ${countdownUnits.isCritical ? 'text-red-400' : countdownUnits.isUrgent ? 'text-amber-400' : 'text-white'}`}>{deadlineFormatted}</p>
              <p className="text-[9px] text-slate-600 mt-2 font-medium italic">15 min before opening kick-off</p>
            </div>

            {/* CTA */}
            <div className={`px-6 pb-6 pt-3 ${countdownUnits.isCritical ? 'bg-gradient-to-b from-[#0f2545] to-red-950/30' : countdownUnits.isUrgent ? 'bg-gradient-to-b from-[#0f2545] to-amber-950/20' : 'bg-[#0f2545]'}`}>
              <button
                onClick={() => setShowDeadlineModal(false)}
                className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 ${
                  countdownUnits.isCritical
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50'
                    : countdownUnits.isUrgent
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-900/50'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-900/50'
                }`}
              >
                {t.gotIt || 'Got It'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>

    {/* MOBILE BOTTOM NAV BAR */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f2545] border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {props.navTabs.map(tab => {
            const isActive = props.activeTab === tab;
            const label = getTabLabel(tab);

            let tabId: string | undefined;
            if (tab === 'leaderboard') tabId = 'nav-leaderboard';
            else if (tab === 'tournament') tabId = 'nav-tournament';
            else if (tab === 'manager')   tabId = 'nav-manager';
            else if (tab === 'analysis')  tabId = 'nav-analysis';
            else if (tab === 'groups')    tabId = 'nav-groups';
            else if (tab === 'knockout')  tabId = 'nav-knockout';

            return (
                <button
                    key={tab}
                    id={tabId}
                    onClick={() => props.setActiveTab(tab as any)}
                    className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                        isActive ? 'text-yellow-400' : 'text-slate-500 active:text-slate-300'
                    }`}
                >
                    {isActive && (
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-yellow-400 rounded-full shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
                    )}
                    {getTabIcon(tab)}
                    <span className="text-[8px] font-black uppercase tracking-wide leading-none">
                        {label}
                    </span>
                    {tab === 'manager' && props.showSecondChanceBadge && (
                        <span className="absolute top-1.5 right-[calc(50%-10px)] w-2 h-2 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
                    )}
                </button>
            );
        })}
    </nav>
    </>
  );
};