import React, { useState, useMemo } from 'react';
import { UserProfile, Prediction, Translation } from '../types';
import { Users, CheckCircle2, X } from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';
import { LEAGUES, TOTAL_MATCHES } from '../constants';

interface PlayerProgressProps {
  users: UserProfile[];
  allPredictions: Prediction[];
  totalMatches: { group: number, knockout: number };
  lang: Translation;
  currentUserLeagues?: string[];
  currentUserEmail?: string;
  currentLang?: string;
}

const LANG_LABELS: Record<string, string> = {
  en: '🇬🇧 English', no: '🇳🇴 Norsk', sv: '🇸🇪 Svenska',
  us: '🇺🇸 English', sc: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scots'
};

export const PlayerProgress: React.FC<PlayerProgressProps> = ({ users, allPredictions, lang, currentUserLeagues = [], currentUserEmail, currentLang }) => {
  const tabs = [...currentUserLeagues];
  const [activeLeague, setActiveLeague] = useState<string>(currentUserLeagues[0] ?? '');
  const [profileModal, setProfileModal] = useState<UserProfile | null>(null);

  const getLeagueName = (slug: string) =>
    LEAGUES[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);

  // Filter users to only those in the active league
  const filteredUsers = useMemo(() => {
      if (!activeLeague || currentUserLeagues.length === 0) return users;
      return users.filter(u => u.leagues?.includes(activeLeague));
  }, [users, activeLeague, currentUserLeagues]);

  // FIX: Force total matches to 104 (Full 2026 Tournament) instead of relying on loaded props
  // This ensures the progress bar tracks the complete journey (Group + Knockout)
  const totalGameMatches = TOTAL_MATCHES;

  // Calculate Stats for Header
  const readyManagersCount = useMemo(() => {
      return filteredUsers.filter(u => {
          const userPreds = allPredictions.filter(p => p.userId === u.email);
          return userPreds.length >= totalGameMatches;
      }).length;
  }, [filteredUsers, allPredictions, totalGameMatches]);

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aCount = allPredictions.filter(p => p.userId === a.email).length;
    const bCount = allPredictions.filter(p => p.userId === b.email).length;
    return bCount - aCount;
  });

  return (
    <div className="animate-fade-in pb-20">
      
      {/* Main Container Card */}
      <div className="bg-blue-950/40 backdrop-blur-md rounded-2xl border border-white/15 shadow-sm overflow-hidden">

        {/* 1. Navy Header Strip (Updated) */}
        <div className="bg-[#0f2545] px-4 py-4 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg text-blue-300">
                    <Users size={20} />
                </div>
                <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">
                        {lang.managersTab || "MANAGERS"}
                    </h2>
                    {/* NEW: "LET'S GO" + Live Counters */}
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wide">LET'S GO!</span>
                        <span className="text-[10px] font-medium text-slate-400">
                            <span className="text-white">{readyManagersCount}</span> Ready • <span className="text-slate-300">{filteredUsers.length - readyManagersCount}</span> Pending
                        </span>
                    </div>
                </div>
            </div>

            {/* Total Count */}
            <div className="text-right hidden sm:block">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</div>
                <div className="text-xl font-black text-white leading-none">{filteredUsers.length}</div>
            </div>
        </div>

        {/* 2. League Tab Strip */}
        {tabs.length > 1 && (
            <div className="flex overflow-x-auto no-scrollbar border-b border-white/5 bg-black/20 px-2 pt-2 gap-1">
                {tabs.map(slug => {
                    const isActive = activeLeague === slug;
                    return (
                        <button
                            key={slug}
                            onClick={() => setActiveLeague(slug)}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${
                                isActive
                                    ? 'bg-blue-950/40 text-cyan-400 border-cyan-400 shadow-sm'
                                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
                            }`}
                        >
                            {getLeagueName(slug)}
                        </button>
                    );
                })}
            </div>
        )}

        {/* 3. Managers List */}
        <div className="divide-y divide-white/5">
            <div className="flex items-center justify-between px-4 py-2 bg-black/10 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <span>{lang.manager}</span>
                <span>{lang.status}</span>
            </div>

            {sortedUsers.map(user => {
                const userPreds = allPredictions.filter(p => p.userId === user.email);
                const count = userPreds.length;
                const percent = totalGameMatches > 0 ? Math.min(100, Math.round((count / totalGameMatches) * 100)) : 0;
                const isReady = count >= totalGameMatches;
                const isMe = user.email === currentUserEmail;

                return (
                    <div key={user.email} onClick={() => setProfileModal(user)} className={`p-4 flex items-center justify-between transition-colors group relative cursor-pointer ${isMe ? 'bg-blue-500/10' : 'hover:bg-white/5'}`}>
                        {isMe && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r" />}
                        <div className="flex items-center gap-3">
                            <AvatarDisplay avatar={user.avatar} size="md" className="ring-2 ring-white/10 shadow-sm" />
                            <div>
                                <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{user.name}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {isReady ? (
                                        <CheckCircle2 size={12} className="text-green-500" />
                                    ) : (
                                        <div className="w-2.5 h-2.5 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin"></div>
                                    )}
                                    <span className={`text-[10px] font-bold uppercase ${isReady ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {isReady ? (lang.managerReady || "Ready") : (lang.managerIncomplete || "Predicting...")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 w-24">
                            <div className="text-xs font-black text-slate-300">{count}/{totalGameMatches}</div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${isReady ? 'bg-green-500' : 'bg-blue-500'}`} 
                                    style={{ width: `${percent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
        
        {sortedUsers.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                No managers found in this league.
            </div>
        )}
      </div>

      {/* Profile spotlight modal */}
      {profileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setProfileModal(null)}>
              <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
              <div className="relative bg-blue-950/90 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-3 w-72 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setProfileModal(null)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
                      <X size={18} />
                  </button>
                  <AvatarDisplay avatar={profileModal.avatar} size="5xl" className="ring-4 ring-white/10 shadow-xl" />
                  <div className="text-center">
                      <div className="text-xl font-black text-white">{profileModal.name}</div>
                      {profileModal.leagues && profileModal.leagues.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 justify-center mt-1.5">
                              {profileModal.leagues.map(l => (
                                  <span key={l} className="text-[10px] font-bold uppercase tracking-wide bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                                      {LEAGUES[l] ?? l}
                                  </span>
                              ))}
                          </div>
                      )}
                      {profileModal.email === currentUserEmail && currentLang && (
                          <span className="inline-block text-[10px] font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-full mt-1.5">
                              {LANG_LABELS[currentLang] ?? currentLang.toUpperCase()}
                          </span>
                      )}
                  </div>
                  {(() => {
                      const count = allPredictions.filter(p => p.userId === profileModal.email).length;
                      const isReady = count >= totalGameMatches;
                      return (
                          <div className="w-full bg-white/5 rounded-2xl p-3 text-center">
                              <div className={`text-sm font-black ${isReady ? 'text-green-400' : 'text-slate-300'}`}>
                                  {isReady ? (lang.managerReady || 'Ready') : `${count} / ${totalGameMatches}`}
                              </div>
                              <div className="w-full h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                                  <div
                                      className={`h-full rounded-full ${isReady ? 'bg-green-500' : 'bg-blue-500'}`}
                                      style={{ width: `${Math.min(100, Math.round((count / totalGameMatches) * 100))}%` }}
                                  />
                              </div>
                          </div>
                      );
                  })()}
              </div>
          </div>
      )}
    </div>
  );
};