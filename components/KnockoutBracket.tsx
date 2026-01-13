import React, { useMemo, useState } from 'react';
import { Match, Team, Translation, UserProfile, Prediction, TournamentPhase } from '../types';
import { ChevronRight, ChevronLeft, Trophy, Calendar, MapPin, Lock, Unlock, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { MatchCard } from './MatchCard';

interface KnockoutBracketProps {
  matches: Match[];
  teams: Record<string, Team>;
  onUpdate: (id: string, h: number, a: number) => void;
  lang: Translation;
  user: UserProfile | null;
  onSecondChance: () => void;
  rivals: UserProfile[];
  allPredictions: Prediction[];
  phase: TournamentPhase;
  isGroupStageComplete: boolean;
  firstIncompleteGroup: string | null;
  onGoToGroup: (groupId: string) => void;
  onTeamClick?: (teamId: string) => void;
}

export const KnockoutBracket: React.FC<KnockoutBracketProps> = ({ 
  matches, teams, onUpdate, lang, user, onSecondChance, 
  rivals, allPredictions, phase, isGroupStageComplete, 
  firstIncompleteGroup, onGoToGroup, onTeamClick 
}) => {
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

  // Helper to format ISO dates to local time (Same as MatchCard)
  const formatDateTime = (dateStr: string) => {
    try {
        if (!dateStr) return 'TBD';
        // Handle legacy "June 11" strings gracefully
        if (!dateStr.includes('T') && !dateStr.includes(':') && !dateStr.includes('+')) return dateStr;

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        return new Intl.DateTimeFormat(undefined, { // undefined uses browser's default locale
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    } catch (e) {
        return dateStr;
    }
  };

  const rounds = ['R32', 'R16', 'QF', 'SF', 'FIN'];
  const roundNames: Record<string, string> = {
      'R32': lang.roundOf32 || "Round of 32",
      'R16': lang.roundOf16 || "Round of 16",
      'QF': lang.quarterFinals || "Quarter Finals",
      'SF': lang.semiFinals || "Semi Finals",
      'FIN': lang.grandFinal || "Final",
      '3RD': lang.thirdPlacePlayoff || "3rd Place"
  };

  // Group matches by round for List View
  const matchesByRound = useMemo(() => {
      const grouped: Record<string, Match[]> = {};
      matches.forEach(m => {
          if (m.round) {
              if (!grouped[m.round]) grouped[m.round] = [];
              grouped[m.round].push(m);
          }
      });
      return grouped;
  }, [matches]);

  if (!isGroupStageComplete && phase === 'PRE_LIVE' && !user?.hasTakenSecondChance) {
      return (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300 text-center space-y-4 animate-in fade-in">
              <div className="bg-amber-100 p-4 rounded-full">
                  <Lock size={48} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-black uppercase text-slate-700 tracking-tighter">{lang.lockedBracketTitle}</h3>
              <p className="text-sm text-slate-500 max-w-md">{lang.lockedBracketDesc}</p>
              {firstIncompleteGroup && (
                  <button 
                    onClick={() => onGoToGroup(firstIncompleteGroup)}
                    className="px-6 py-3 bg-blue-600 text-white font-bold uppercase rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                      {lang.finishGroupBtn.replace('{0}', firstIncompleteGroup)} <ChevronRight size={16} />
                  </button>
              )}
          </div>
      );
  }

  return (
    <div className="space-y-4">
        {/* Toggle & Controls */}
        <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setViewMode('tree')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${viewMode === 'tree' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Tree</button>
                <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>List</button>
            </div>
            {viewMode === 'tree' && (
                <div className="flex gap-2">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"><ZoomOut size={16} /></button>
                    <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"><ZoomIn size={16} /></button>
                </div>
            )}
        </div>

        {viewMode === 'list' ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
                {[...rounds, '3RD'].map(round => {
                    const roundMatches = matchesByRound[round] || [];
                    if (roundMatches.length === 0) return null;

                    return (
                        <div key={round} className="space-y-3">
                            <div className="flex items-center gap-2 px-2">
                                <div className="h-4 w-1 bg-yellow-400 rounded-full"></div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">{roundNames[round] || round}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {roundMatches.map(m => (
                                    <MatchCard 
                                        key={m.id} 
                                        match={m} 
                                        homeTeam={teams[m.homeTeamId]} 
                                        awayTeam={teams[m.awayTeamId]} 
                                        onUpdate={onUpdate} 
                                        lang={lang} 
                                        locale="en-GB" 
                                        userTokens={user?.tokens || 0}
                                        rivals={rivals}
                                        onSpy={() => {}}
                                        revealedRivals={[]}
                                        currentUser={user}
                                        allPredictions={allPredictions}
                                        phase={phase}
                                        onSubstitute={() => {}}
                                        substitutionsLeft={user?.substitutions || 0}
                                        isUnlockedBySub={user?.unlockedMatches?.includes(m.id) || false}
                                        onTeamClick={onTeamClick}
                                        isAdminMode={false} // ADDED: Fix TS error
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="overflow-x-auto overflow-y-hidden custom-scrollbar pb-4 bg-slate-50/50 rounded-2xl border border-slate-200">
                <div 
                    className="min-w-[1200px] p-8 flex justify-between relative" 
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${1200 * zoom}px` }}
                >
                    {/* Connecting Lines Layer */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none text-slate-300" style={{ zIndex: 0 }}>
                        {/* Lines would be drawn here if we had precise coordinates, omitting for simplicity in this version */}
                    </svg>

                    {rounds.map((round, rIdx) => {
                       const roundMatches = matchesByRound[round] || [];
                       // Sort by numeric ID to ensure bracket alignment
                       const sortedMatches = [...roundMatches].sort((a, b) => {
                           const numA = parseInt(a.id.split('_')[1] || '0');
                           const numB = parseInt(b.id.split('_')[1] || '0');
                           return numA - numB;
                       });

                       return (
                           <div key={round} className="flex flex-col justify-around relative z-10 w-48">
                               <div className="text-center mb-4">
                                   <span className="text-[10px] font-black uppercase text-slate-400 bg-white px-2 py-1 rounded-full border border-slate-100 shadow-sm">
                                       {roundNames[round] || round}
                                   </span>
                               </div>
                               {sortedMatches.map(m => {
                                   const home = teams[m.homeTeamId];
                                   const away = teams[m.awayTeamId];
                                   const pred = allPredictions.find(p => p.userId === user?.email && p.matchId === m.id);
                                   const isLocked = m.isLocked;

                                   return (
                                       <div key={m.id} className="relative group my-2">
                                           {/* Match Node */}
                                           <div className={`bg-white rounded-lg shadow-sm border ${pred ? 'border-blue-200 ring-1 ring-blue-50' : 'border-slate-200'} overflow-hidden hover:shadow-md transition-all`}>
                                               <div className="bg-slate-50 px-2 py-1 flex justify-between items-center border-b border-slate-100">
                                                   <span className="text-[9px] font-bold text-slate-400">Match {m.id.split('_')[1]}</span>
                                                   <span className="text-[8px] font-medium text-slate-400 flex items-center gap-1">
                                                       {formatDateTime(m.date)}
                                                   </span>
                                               </div>
                                               
                                               {/* Home */}
                                               <div className={`flex items-center justify-between px-2 py-1.5 border-b border-slate-50 ${pred?.home > pred?.away ? 'bg-green-50/50' : ''}`}>
                                                   <div className="flex items-center gap-2 overflow-hidden">
                                                       {home ? <img src={home.flag} className="w-4 h-4 rounded-full object-cover" /> : <div className="w-4 h-4 rounded-full bg-slate-200"></div>}
                                                       <span className="text-[10px] font-bold text-slate-700 truncate w-20">{home?.name || 'TBD'}</span>
                                                   </div>
                                                   <input 
                                                      type="number" 
                                                      className="w-6 h-5 text-center text-xs font-bold bg-slate-100 rounded focus:bg-white focus:ring-1 focus:ring-blue-400 outline-none"
                                                      value={pred?.home ?? ''}
                                                      onChange={(e) => !isLocked && onUpdate(m.id, parseInt(e.target.value), pred?.away || 0)}
                                                      disabled={isLocked}
                                                   />
                                               </div>

                                               {/* Away */}
                                               <div className={`flex items-center justify-between px-2 py-1.5 ${pred?.away > pred?.home ? 'bg-green-50/50' : ''}`}>
                                                   <div className="flex items-center gap-2 overflow-hidden">
                                                       {away ? <img src={away.flag} className="w-4 h-4 rounded-full object-cover" /> : <div className="w-4 h-4 rounded-full bg-slate-200"></div>}
                                                       <span className="text-[10px] font-bold text-slate-700 truncate w-20">{away?.name || 'TBD'}</span>
                                                   </div>
                                                   <input 
                                                      type="number" 
                                                      className="w-6 h-5 text-center text-xs font-bold bg-slate-100 rounded focus:bg-white focus:ring-1 focus:ring-blue-400 outline-none"
                                                      value={pred?.away ?? ''}
                                                      onChange={(e) => !isLocked && onUpdate(m.id, pred?.home || 0, parseInt(e.target.value))}
                                                      disabled={isLocked}
                                                   />
                                               </div>
                                           </div>
                                       </div>
                                   );
                               })}
                           </div>
                       );
                    })}
                </div>
                
                {/* 3rd Place - Special Placement */}
                {matchesByRound['3RD'] && matchesByRound['3RD'].length > 0 && (
                    <div className="mt-8 flex justify-center border-t border-dashed border-slate-300 pt-4">
                        <div className="w-64">
                            <div className="text-center mb-2">
                                <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                    {lang.thirdPlacePlayoff}
                                </span>
                            </div>
                            <MatchCard 
                                match={matchesByRound['3RD'][0]}
                                homeTeam={teams[matchesByRound['3RD'][0].homeTeamId]} 
                                awayTeam={teams[matchesByRound['3RD'][0].awayTeamId]} 
                                onUpdate={onUpdate} 
                                lang={lang} 
                                locale="en-GB"
                                userTokens={user?.tokens || 0}
                                rivals={rivals}
                                onSpy={() => {}}
                                revealedRivals={[]}
                                currentUser={user}
                                allPredictions={allPredictions}
                                phase={phase}
                                onSubstitute={() => {}}
                                substitutionsLeft={user?.substitutions || 0}
                                isUnlockedBySub={false}
                                onTeamClick={onTeamClick}
                                isAdminMode={false} // ADDED: Fix TS error
                            />
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};