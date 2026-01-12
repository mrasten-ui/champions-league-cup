
import React, { useState, useMemo } from 'react';
import { Match, Team, Prediction, Translation, UserProfile } from '../types';
import { Search, Trophy, Check, Activity, LayoutGrid, Clock, ShieldAlert } from 'lucide-react';
import { calculatePoints } from '../services/engine';

interface MyPredictionsProps {
  matches: Match[];
  teams: Record<string, Team>;
  allPredictions: Prediction[];
  currentUser: UserProfile | null;
  lang: Translation;
  onGoToGroup: (groupId: string) => void;
  onGoToBracket: () => void;
}

export const MyPredictions: React.FC<MyPredictionsProps> = ({ 
  matches, 
  teams, 
  allPredictions, 
  currentUser, 
  lang,
  onGoToGroup,
  onGoToBracket
}) => {
  const [activeTab, setActiveTab] = useState<'groups' | 'knockout'>('groups');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'finished'>('all');
  const [search, setSearch] = useState('');

  // Filter relevant predictions for current user
  const userPicks = useMemo(() => {
    if (!currentUser) return [];
    return allPredictions.filter(p => p.userId === currentUser.email);
  }, [allPredictions, currentUser]);

  const picksMap = useMemo(() => {
    const map: Record<string, Prediction> = {};
    userPicks.forEach(p => { map[p.matchId] = p; });
    return map;
  }, [userPicks]);

  // Combined display list filtered by tab
  const displayList = useMemo(() => {
    return matches.filter(m => {
      const pred = picksMap[m.id];
      // Stage Filter
      const isGroup = !!m.groupId;
      const isKnockout = !m.groupId;
      const matchesTab = activeTab === 'groups' ? isGroup : isKnockout;
      
      const homeName = (teams[m.homeTeamId]?.name || '').toLowerCase();
      const awayName = (teams[m.awayTeamId]?.name || '').toLowerCase();
      const matchesSearch = homeName.includes(search.toLowerCase()) || awayName.includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || m.status.toLowerCase() === filter;
      
      return pred && matchesSearch && matchesFilter && matchesTab;
    }).sort((a, b) => {
      // Sort: Live first, then Upcoming, then Finished
      const order: Record<string, number> = { LIVE: 0, '1H': 0, '2H': 0, HT: 0, UPCOMING: 1, FINISHED: 2, FT: 2 };
      const statusA = order[a.status] ?? 3;
      const statusB = order[b.status] ?? 3;
      return statusA - statusB;
    });
  }, [matches, picksMap, search, filter, teams, activeTab]);

  const completionStats = useMemo(() => {
    const total = matches.length;
    const predicted = userPicks.length;
    return { total, predicted, percent: Math.round((predicted / total) * 100) };
  }, [matches, userPicks]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Stats Summary Card */}
      <div className="bg-gradient-to-br from-[#0f2545] to-[#1e40af] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-tighter">{lang.myPredictions}</h2>
            <p className="text-blue-200 text-sm font-medium">{lang.journeyDesc}</p>
          </div>
          <div className="flex gap-4 sm:gap-8">
            <div className="text-center">
              <div className="text-3xl font-black">{completionStats.predicted}</div>
              <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">{lang.picksMade}</div>
            </div>
            <div className="w-px h-10 bg-white/10 self-center"></div>
            <div className="text-center">
              <div className="text-3xl font-black">{completionStats.percent}%</div>
              <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">{lang.completion}</div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6 h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-1000" 
            style={{ width: `${completionStats.percent}%` }}
          ></div>
        </div>
      </div>

      {/* Stage Toggle */}
      <div className="flex p-1 bg-slate-200 rounded-xl">
          <button 
             onClick={() => setActiveTab('groups')}
             className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'groups' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
             {lang.progressGroups}
          </button>
          <button 
             onClick={() => setActiveTab('knockout')}
             className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'knockout' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
             {lang.progressKnockout}
          </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={lang.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
          {(['all', 'upcoming', 'live', 'finished'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === f ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Predictions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayList.length > 0 ? (
          displayList.map(match => {
            const pred = picksMap[match.id];
            const home = teams[match.homeTeamId];
            const away = teams[match.awayTeamId];
            const homeName = lang.teamNames[home?.id] || home?.name || 'TBD';
            const awayName = lang.teamNames[away?.id] || away?.name || 'TBD';

            const isLive = ['LIVE', '1H', '2H', 'HT'].includes(match.status);
            const isFinished = ['FINISHED', 'FT', 'AET', 'PEN'].includes(match.status);
            
            // RELAXED CONDITION: Show scores if they exist, even if status isn't updated yet (for testing/admin mode)
            const hasRealScore = match.homeScore !== null && match.awayScore !== null;

            // Calculate points if score exists
            const pts = hasRealScore ? calculatePoints(pred.home, pred.away, match.homeScore, match.awayScore, currentUser?.hasTakenSecondChance || false, match.round) : null;
            
            // User Prediction Winning Logic for Visuals
            const userPickHomeWin = pred.home > pred.away;
            const userPickAwayWin = pred.away > pred.home;

            if (activeTab === 'knockout') {
                // Determine Real Winner if match has data
                // In knockouts, we look for who advanced.
                const realHomeWin = hasRealScore && (match.homeScore! > match.awayScore!);
                const realAwayWin = hasRealScore && (match.awayScore! > match.homeScore!);

                return (
                    <div 
                        key={match.id} 
                        onClick={onGoToBracket}
                        className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3 relative z-10">
                            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase">{match.round}</span>
                            {pts !== null && <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${pts > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>+{pts} {lang.points}</span>}
                        </div>

                        <div className="flex flex-col gap-2 relative z-10">
                            {/* Home Row */}
                            <div className={`flex items-center justify-between p-2 rounded-lg border ${userPickHomeWin ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-transparent'}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <img src={home?.flag} className="w-8 h-6 object-cover rounded shadow-sm shrink-0" alt={homeName} />
                                    <div className="flex flex-col truncate">
                                        <span className={`text-sm font-bold truncate ${userPickHomeWin ? 'text-blue-900' : 'text-slate-500'}`}>{homeName}</span>
                                        {userPickHomeWin && <span className="text-[9px] font-black text-blue-500 uppercase tracking-wide">My Pick</span>}
                                    </div>
                                </div>
                                {realHomeWin && (
                                    <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded-full shadow-sm shrink-0 animate-in zoom-in">
                                        <Check size={10} strokeWidth={4} />
                                        <span className="text-[9px] font-black uppercase tracking-wider">Advanced</span>
                                    </div>
                                )}
                            </div>

                            {/* Away Row */}
                            <div className={`flex items-center justify-between p-2 rounded-lg border ${userPickAwayWin ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-transparent'}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <img src={away?.flag} className="w-8 h-6 object-cover rounded shadow-sm shrink-0" alt={awayName} />
                                    <div className="flex flex-col truncate">
                                        <span className={`text-sm font-bold truncate ${userPickAwayWin ? 'text-blue-900' : 'text-slate-500'}`}>{awayName}</span>
                                        {userPickAwayWin && <span className="text-[9px] font-black text-blue-500 uppercase tracking-wide">My Pick</span>}
                                    </div>
                                </div>
                                {realAwayWin && (
                                    <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded-full shadow-sm shrink-0 animate-in zoom-in">
                                        <Check size={10} strokeWidth={4} />
                                        <span className="text-[9px] font-black uppercase tracking-wider">Advanced</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }

            // Standard Group Card
            return (
              <div 
                key={match.id} 
                onClick={() => onGoToGroup(match.groupId!)}
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isLive ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-red-600 animate-pulse bg-red-50 px-2 py-0.5 rounded-full uppercase">
                        <Activity size={10} /> {lang.live} {match.minute ? `${match.minute}'` : ''}
                      </span>
                    ) : isFinished ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                            <Clock size={10} /> {lang.ft}
                        </span>
                    ) : hasRealScore ? (
                        // Case for Admin/Test data where score exists but status isn't officially finished
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full uppercase">
                            <ShieldAlert size={10} /> RESULT
                        </span>
                    ) : (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-blue-50 text-blue-600`}>
                        {lang.groups} {match.groupId}
                      </span>
                    )}
                  </div>
                  {pts !== null && (
                    <div className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${pts === 5 ? 'bg-yellow-100 text-yellow-700' : pts === 3 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                      +{pts} {lang.points}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 flex items-center gap-3">
                    <img src={home?.flag} className="w-8 h-6 object-cover rounded shadow-sm border border-slate-100" alt={homeName} />
                    <span className="text-xs font-bold text-slate-700 truncate">{homeName}</span>
                  </div>

                  <div className="flex flex-col items-center justify-center min-w-[80px]">
                    {hasRealScore ? (
                        <div className="flex flex-col items-center gap-1">
                            {/* Real Score - Smaller Badge above */}
                            <div className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${isLive ? 'bg-red-50 border-red-100 text-red-600 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                {isLive ? <Activity size={8} /> : (isFinished ? <Clock size={8} /> : <ShieldAlert size={8} />)}
                                <span>{match.homeScore}-{match.awayScore}</span>
                            </div>

                            {/* User Pick - Larger/Main Display */}
                            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-blue-100 shadow-sm">
                                <span className="text-lg font-black text-blue-900">{pred.home}</span>
                                <span className="text-blue-200 font-bold">-</span>
                                <span className="text-lg font-black text-blue-900">{pred.away}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 group-hover:border-blue-200 transition-colors">
                            <span className="text-sm font-black text-slate-900">{pred.home}</span>
                            <span className="text-slate-300 font-bold">-</span>
                            <span className="text-sm font-black text-slate-900">{pred.away}</span>
                        </div>
                    )}
                  </div>

                  <div className="flex-1 flex items-center justify-end gap-3 text-right">
                    <span className="text-xs font-bold text-slate-700 truncate">{awayName}</span>
                    <img src={away?.flag} className="w-8 h-6 object-cover rounded shadow-sm border border-slate-100" alt={awayName} />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <LayoutGrid size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{lang.noMatches}</h3>
            <p className="text-slate-500 text-sm max-w-xs">
              {search || filter !== 'all' 
                ? lang.noMatchesHint 
                : "You haven't made any predictions yet!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
