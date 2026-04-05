import React, { useState, useMemo } from 'react';
import { UserProfile, Prediction, Translation } from '../types';
import { Users, CheckCircle2, ChevronDown, Globe, Trophy } from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';

interface PlayerProgressProps {
  users: UserProfile[];
  allPredictions: Prediction[];
  totalMatches: { group: number, knockout: number };
  lang: Translation;
  currentUserLeagues?: string[];
}

export const PlayerProgress: React.FC<PlayerProgressProps> = ({ users, allPredictions, lang, currentUserLeagues = [] }) => {
  const [activeLeague, setActiveLeague] = useState<string>('global');
  const [showLeagueMenu, setShowLeagueMenu] = useState(false);

  const getLeagueName = (slug: string) => {
      switch(slug) {
          case 'family': return 'The Rasten Family';
          case 'beeline': return 'Beeline Colleagues';
          case 'scotland': return 'Scotland & Friends';
          case 'global': return lang.lbGlobal || "Global League";
          default: return slug.charAt(0).toUpperCase() + slug.slice(1);
      }
  };

  // Filter users based on league selection
  const filteredUsers = useMemo(() => {
      if (activeLeague === 'global') return users;
      return users.filter(u => u.leagues?.includes(activeLeague));
  }, [users, activeLeague]);

  // FIX: Force total matches to 104 (Full 2026 Tournament) instead of relying on loaded props
  // This ensures the progress bar tracks the complete journey (Group + Knockout)
  const totalGameMatches = 104; 

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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
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

        {/* 2. League Toolbar */}
        {currentUserLeagues.length > 0 && (
             <div className="relative bg-slate-50 border-b border-slate-100 p-2 z-20">
                 <button 
                    onClick={() => setShowLeagueMenu(!showLeagueMenu)}
                    className="w-full flex items-center justify-between bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-blue-300 transition-colors"
                 >
                    <div className="flex items-center gap-2">
                        {activeLeague === 'global' ? <Globe size={14} className="text-blue-500" /> : <Trophy size={14} className="text-purple-500" />}
                        <span className="uppercase tracking-wide">{getLeagueName(activeLeague)}</span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${showLeagueMenu ? 'rotate-180' : ''}`} />
                 </button>

                 {showLeagueMenu && (
                     <div className="absolute top-full left-2 right-2 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-30">
                         <button 
                            onClick={() => { setActiveLeague('global'); setShowLeagueMenu(false); }}
                            className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 ${activeLeague === 'global' ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
                         >
                             <Globe size={14} /> {lang.lbGlobal || "Global League"}
                         </button>
                         {currentUserLeagues.map(slug => (
                             <button 
                                key={slug}
                                onClick={() => { setActiveLeague(slug); setShowLeagueMenu(false); }}
                                className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 ${activeLeague === slug ? 'text-purple-600 bg-purple-50' : 'text-slate-600'}`}
                             >
                                 <Trophy size={14} /> {getLeagueName(slug)}
                             </button>
                         ))}
                     </div>
                 )}
             </div>
        )}

        {/* 3. Managers List */}
        <div className="divide-y divide-slate-50">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <span>{lang.manager}</span>
                <span>{lang.status}</span>
            </div>

            {sortedUsers.map(user => {
                const userPreds = allPredictions.filter(p => p.userId === user.email);
                const count = userPreds.length;
                const percent = totalGameMatches > 0 ? Math.min(100, Math.round((count / totalGameMatches) * 100)) : 0;
                const isReady = count >= totalGameMatches;

                return (
                    <div key={user.email} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3">
                            <AvatarDisplay avatar={user.avatar} size="md" className="ring-2 ring-white shadow-sm" />
                            <div>
                                <div className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{user.name}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {isReady ? (
                                        <CheckCircle2 size={12} className="text-green-500" />
                                    ) : (
                                        <div className="w-2.5 h-2.5 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin"></div>
                                    )}
                                    <span className={`text-[10px] font-bold uppercase ${isReady ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {isReady ? (lang.managerReady || "Ready") : (lang.managerIncomplete || "Predicting...")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 w-24">
                            <div className="text-xs font-black text-slate-700">{count}/{totalGameMatches}</div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
    </div>
  );
};