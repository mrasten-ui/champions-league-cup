import React, { useState, useMemo } from 'react';
import { UserProfile, Prediction, Translation } from '../types';
import { Users, CheckCircle2, ChevronDown, Globe } from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';

interface PlayerProgressProps {
  users: UserProfile[];
  allPredictions: Prediction[];
  totalMatches: { group: number, knockout: number };
  lang: Translation;
  currentUserLeagues?: string[];
}

export const PlayerProgress: React.FC<PlayerProgressProps> = ({ users, allPredictions, totalMatches, lang, currentUserLeagues = [] }) => {
  const [activeLeague, setActiveLeague] = useState<string>('global');
  const [showLeagueMenu, setShowLeagueMenu] = useState(false);

  const getLeagueName = (slug: string) => {
      switch(slug) {
          case 'family': return 'The Rasten Family';
          case 'beeline': return 'Beeline Colleagues';
          case 'scotland': return 'Scotland & Friends';
          case 'global': return lang.lbGlobal;
          default: return slug.charAt(0).toUpperCase() + slug.slice(1);
      }
  };

  // Filter users based on league selection
  const filteredUsers = useMemo(() => {
      if (activeLeague === 'global') return users;
      return users.filter(u => u.leagues?.includes(activeLeague));
  }, [users, activeLeague]);

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aCount = allPredictions.filter(p => p.userId === a.email).length;
    const bCount = allPredictions.filter(p => p.userId === b.email).length;
    return bCount - aCount;
  });

  const totalGameMatches = totalMatches.group + totalMatches.knockout;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Header Stats */}
      <div className="bg-gradient-to-br from-[#0f2545] to-[#1e40af] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <Users size={120} />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">{lang.managersTab}</h2>
          <p className="text-blue-200 text-sm font-medium">{lang.journeyDesc}</p>
        </div>
      </div>

      {/* LEAGUE SELECTOR (Only if user is in leagues) */}
      {currentUserLeagues.length > 0 && (
             <div className="relative z-20">
                 <button 
                    onClick={() => setShowLeagueMenu(!showLeagueMenu)}
                    className="w-full flex items-center justify-between bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:border-blue-300 transition-colors"
                 >
                    <div className="flex items-center gap-2">
                        {activeLeague === 'global' ? <Globe size={16} className="text-blue-500" /> : <Users size={16} className="text-purple-500" />}
                        <span className="uppercase tracking-wide">{getLeagueName(activeLeague)}</span>
                    </div>
                    <ChevronDown size={16} className={`transition-transform ${showLeagueMenu ? 'rotate-180' : ''}`} />
                 </button>

                 {showLeagueMenu && (
                     <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                         <button 
                            onClick={() => { setActiveLeague('global'); setShowLeagueMenu(false); }}
                            className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 ${activeLeague === 'global' ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
                         >
                             <Globe size={14} /> {lang.lbGlobal}
                         </button>
                         {currentUserLeagues.map(slug => (
                             <button 
                                key={slug}
                                onClick={() => { setActiveLeague(slug); setShowLeagueMenu(false); }}
                                className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 ${activeLeague === slug ? 'text-purple-600 bg-purple-50' : 'text-slate-600'}`}
                             >
                                 <Users size={14} /> {getLeagueName(slug)}
                             </button>
                         ))}
                     </div>
                 )}
             </div>
      )}

      {/* Managers List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{lang.manager}</span>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{lang.completion}</span>
          </div>
          <div className="divide-y divide-slate-50">
              {sortedUsers.map(user => {
                  const userPreds = allPredictions.filter(p => p.userId === user.email);
                  const count = userPreds.length;
                  const percent = Math.min(100, Math.round((count / totalGameMatches) * 100));
                  const isReady = count >= totalGameMatches;

                  return (
                      <div key={user.email} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                              <AvatarDisplay avatar={user.avatar} size="md" />
                              <div>
                                  <div className="text-sm font-bold text-slate-800">{user.name}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                      <div className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-green-500' : 'bg-yellow-400'}`}></div>
                                      <span className="text-[10px] font-medium text-slate-400 uppercase">
                                          {isReady ? lang.managerReady : lang.managerIncomplete}
                                      </span>
                                  </div>
                              </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 w-24">
                              <div className="text-xs font-black text-slate-700">{percent}%</div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                      className={`h-full rounded-full ${isReady ? 'bg-green-500' : 'bg-blue-500'}`} 
                                      style={{ width: `${percent}%` }}
                                  ></div>
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
    </div>
  );
};