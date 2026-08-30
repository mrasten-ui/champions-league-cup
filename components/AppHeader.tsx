import React, { useState } from 'react';
import { Edit3, UserCircle2, BookOpen, Bot, LogOut, LayoutGrid, Users, Trophy, Calendar, Smartphone, Share2, X } from 'lucide-react';
import { Logo } from './Logo';
import { AvatarDisplay } from './AvatarDisplay';
import { LANGUAGES } from '../constants';
import { LanguageCode, TournamentPhase, UserProfile, Translation } from '../types';

interface AppHeaderProps {
  user: UserProfile;
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  tournamentPhase: TournamentPhase;
  setTournamentPhase: (p: TournamentPhase) => void;
  activeTab: string;
  setActiveTab: (t: any) => void;
  isProfileMenuOpen: boolean;
  setIsProfileMenuOpen: (b: boolean) => void;
  setShowAvatarEditor: (b: boolean) => void;
  setIsDebugOpen: (b: boolean) => void;
  setShowAdminLogin: (b: boolean) => void;
  handleLogout: () => void;
  isAdminMode?: boolean;
  unassignedCount?: number;
  onInstallApp?: () => void;
  onLinkCopied?: () => void;
  navTabs: string[];
  t: Translation;
}

export const AppHeader: React.FC<AppHeaderProps> = (props) => {
  const { user, t } = props;

  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // --- HELPER: Tab icon for bottom nav ---
  const getTabIcon = (tab: string) => {
      switch (tab) {
          case 'leaderboard': return <Trophy size={20} />;
          case 'tournament':  return <Calendar size={20} />;
          case 'groups':      return <LayoutGrid size={20} />;
          case 'scouting':    return <Users size={20} />;
          case 'rules':       return <BookOpen size={20} />;
          default:            return <LayoutGrid size={20} />;
      }
  };

  // --- HELPER: Tab label (shared between bottom nav and desktop tabs) ---
  const getTabLabel = (tab: string): string => {
      if (tab === 'scouting')    return props.t.scoutingTab as string;
      if (tab === 'tournament')  return props.t.tabTournament as string;
      if (tab === 'leaderboard') return props.t.leaderboard as string;
      if (tab === 'rules')       return props.t.rulesBtn as string;
      if (tab === 'groups')      return (props.t.leaguePhase || props.t.groups) as string;
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
             else if (tab === 'leaderboard') tabId = isDesktop ? 'nav-leaderboard-desk' : 'nav-leaderboard';
             else if (tab === 'tournament') tabId = isDesktop ? 'nav-tournament-desk' : 'nav-tournament';
             else if (tab === 'rules')      tabId = isDesktop ? 'nav-rules-desk'      : 'nav-rules';

             return (
                <button
                    key={tab}
                    id={tabId}
                    onClick={() => props.setActiveTab(tab as any)}
                    className={`
                        relative font-black uppercase tracking-normal transition-all duration-300 flex items-center justify-center whitespace-nowrap shrink-0
                        ${isDesktop
                            ? `h-full px-2 text-[11px] ${isActive ? 'text-white' : 'text-slate-300 hover:text-white'}`
                            : `px-4 py-7 text-xs ${isActive ? 'text-white' : 'text-slate-400 hover:text-blue-200'}`
                        }
                    `}
                >
                   {label}
                   {/* Active underline — same treatment on both mobile and desktop */}
                   {isActive && <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-cyan-400 rounded-t-full shadow-[0_0_10px_rgba(34,211,238,0.7)]" />}
                </button>
             );
          })}
      </nav>
  );

  return (
    <>
    <header className="sticky top-0 z-50">
      
      {/* 1. MAIN HEADER BAR (Combines Logo, Desktop Nav, Profile) */}
      <div className="bg-slate-950/80 backdrop-blur-lg text-white border-b border-white/10 shadow-lg relative z-20">

          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
              {/* LEFT: Logo — brand accent: soft glow behind the crest, gradient wordmark */}
              <div className="flex items-center gap-3 shrink-0">
                 <div className="relative">
                    <div className="absolute inset-0 rounded-xl bg-cyan-400/40 blur-lg pointer-events-none"></div>
                    <Logo className="w-12 h-12 relative" variant="theme" />
                 </div>
                 <div className="hidden md:block">
                    <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent">CL Predictor</h1>
                 </div>
              </div>

              {/* CENTER: Desktop Navigation (Hidden on Mobile) — min-w-0 + overflow-x-auto is a safety
                  net so a full tab set never pushes the page wider than the viewport; it scrolls
                  internally instead. */}
              <div className="hidden md:flex flex-1 justify-center px-2 min-w-0 overflow-x-auto no-scrollbar">
                  {renderNavTabs(true)}
              </div>

              {/* RIGHT: Controls & Profile */}
              <div className="flex items-center gap-3 shrink-0">
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
                          {props.isAdminMode && (props.unassignedCount ?? 0) > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-[0_0_6px_rgba(239,68,68,0.8)] z-10 border border-white">
                              {props.unassignedCount}
                            </span>
                          )}
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
                                  </div>
                              </div>
                              <div className="p-1">
                                  <button onClick={() => { props.setShowAvatarEditor(true); props.setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-purple-50 hover:text-purple-600 rounded-lg flex items-center gap-2 transition-colors"><UserCircle2 size={16} /> {t.changeIdentity}</button>
                                  {user.leagues && user.leagues.length > 0 && (
                                    <button
                                      onClick={() => {
                                        const url = `${window.location.origin}?invite=${user.leagues[0]}`;
                                        if (navigator.share) {
                                          navigator.share({ url, title: 'CL Predictor', text: 'Join me on CL Predictor — Champions League prediction game!' }).catch(() => {});
                                        } else {
                                          navigator.clipboard.writeText(url);
                                          props.onLinkCopied?.();
                                        }
                                        props.setIsProfileMenuOpen(false);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-green-50 hover:text-green-600 rounded-lg flex items-center gap-2 transition-colors"
                                    ><Share2 size={16} /> Share League</button>
                                  )}
                                  <button onClick={() => { props.setActiveTab('rules' as any); props.setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg flex items-center gap-2 transition-colors"><BookOpen size={16} /> {t.rulesBtn}</button>
                                  {props.isAdminMode && (
                                      <div className="border-t border-slate-100 mt-1 pt-1">
                                          <button onClick={() => { props.setIsDebugOpen(true); props.setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 transition-colors"><Bot size={16} /> Management</button>
                                      </div>
                                  )}
                                  <button onClick={() => { setShowInstallGuide(true); props.setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-sky-50 hover:text-sky-600 rounded-lg flex items-center gap-2 transition-colors"><Smartphone size={16} /> Add to Phone</button>
                                  <button onClick={props.handleLogout} className="w-full text-left px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors mt-1"><LogOut size={16} /> {t.logout}</button>
                              </div>
                           </div>
                        </>
                      )}
                  </div>
              </div>
          </div>
      </div>

    </header>

    {/* INSTALL GUIDE MODAL */}
    {showInstallGuide && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowInstallGuide(false)}>
            <div className="w-full max-w-sm bg-[#0f2545] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                            <Smartphone size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <div className="font-black text-white text-sm uppercase tracking-wide">Add to Home Screen</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Get the app on your phone</div>
                        </div>
                    </div>
                    <button onClick={() => setShowInstallGuide(false)} className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"><X size={14} /></button>
                </div>

                {/* Native install if available */}
                {props.onInstallApp && (
                    <div className="px-5 pt-4">
                        <button
                            onClick={() => { props.onInstallApp!(); setShowInstallGuide(false); }}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/40"
                        >
                            <Smartphone size={15} /> Install Now
                        </button>
                        <p className="text-center text-[10px] text-slate-500 mt-3">— or follow the steps below —</p>
                    </div>
                )}

                {/* iOS */}
                <div className="px-5 pt-4 pb-2">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="text-base">🍎</span> iPhone / iPad (Safari)
                    </div>
                    <div className="space-y-2.5">
                        {[
                            { text: 'Open this page in Safari' },
                            { text: 'Tap the Share button (⬆ box with arrow) at the bottom of the screen' },
                            { text: 'Scroll down and tap "Add to Home Screen"' },
                            { text: 'Tap "Add" in the top right corner' },
                        ].map(({ text }, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 text-[10px] font-black text-blue-400 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                <span className="text-xs text-white/70 leading-relaxed">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-white/5 mx-5 my-4" />

                {/* Android */}
                <div className="px-5 pb-5">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="text-base">🤖</span> Android (Chrome)
                    </div>
                    <div className="space-y-2.5">
                        {[
                            { text: 'Open this page in Chrome' },
                            { text: 'Tap the three-dot menu (⋮) in the top right' },
                            { text: 'Tap "Add to Home Screen"' },
                            { text: 'Tap "Add" to confirm' },
                        ].map(({ text }, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-green-600/20 border border-green-500/30 text-[10px] font-black text-green-400 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                <span className="text-xs text-white/70 leading-relaxed">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )}

    {/* MOBILE BOTTOM NAV BAR */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {props.navTabs.map(tab => {
            const isActive = props.activeTab === tab;
            const label = getTabLabel(tab);

            let tabId: string | undefined;
            if (tab === 'leaderboard') tabId = 'nav-leaderboard';
            else if (tab === 'tournament') tabId = 'nav-tournament';
            else if (tab === 'rules')     tabId = 'nav-rules';
            else if (tab === 'groups')    tabId = 'nav-groups';

            return (
                <button
                    key={tab}
                    id={tabId}
                    onClick={() => props.setActiveTab(tab as any)}
                    className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                        isActive ? 'text-cyan-400' : 'text-slate-500 active:text-slate-300'
                    }`}
                >
                    {isActive && (
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                    )}
                    {getTabIcon(tab)}
                    <span className="text-[8px] font-black uppercase tracking-wide leading-none">
                        {label}
                    </span>
                </button>
            );
        })}
    </nav>
    </>
  );
};