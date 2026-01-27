import React from 'react';
import { Match, Team, Translation, TournamentPhase, Prediction } from '../types';
import { getAllGroupStandings, getThirdPlaceStandings } from '../services/engine';
import { ThirdPlaceTable } from './ThirdPlaceTable';
import { StandingsTable } from './StandingsTable';
import { LayoutGrid, Unlock, AlertTriangle, ChevronRight, ArrowLeft } from 'lucide-react';

interface GroupStageSummaryProps {
  matches: Match[];
  teams: Record<string, Team>;
  lang: Translation;
  phase?: TournamentPhase;
  hasTakenSecondChance?: boolean;
  onSecondChance?: () => void;
  userPredictions?: Prediction[];
  onGoToGroup?: (groupId: string) => void;
  onGoToKnockout?: () => void;
  onTeamClick?: (teamId: string) => void;
  onSpy?: (matchId: string) => void;
  revealedRivals?: string[];
}

export const GroupStageSummary: React.FC<GroupStageSummaryProps> = ({ 
  matches, teams, lang, phase, hasTakenSecondChance, onSecondChance, 
  userPredictions, onGoToGroup, onGoToKnockout, onTeamClick 
}) => {
  const allStandings = getAllGroupStandings(matches, teams);
  const thirdPlaceStandings = getThirdPlaceStandings(allStandings);
  
  // Calculate Qualified 3rd Place Teams (Top 4)
  const qualifiedThirds = new Set(thirdPlaceStandings.slice(0, 4).map(s => s.teamId));

  return (
    <div className="space-y-8 animate-fade-in pb-20">

      {/* Second Chance Banner */}
      {phase === 'LIVE' && !hasTakenSecondChance && onSecondChance && (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group animate-in slide-in-from-top">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Unlock size={100} />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="font-black uppercase tracking-tighter text-lg flex items-center gap-2">
                        <AlertTriangle size={18} className="text-yellow-400" />
                        {lang.secondChanceTitle}
                    </h3>
                    <p className="text-xs text-purple-200 font-medium max-w-md">{lang.secondChanceDesc}</p>
                </div>
                <button 
                    onClick={onSecondChance}
                    className="bg-white text-purple-900 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-md hover:bg-purple-50 transition-colors whitespace-nowrap"
                >
                    {lang.secondChanceBtn}
                </button>
            </div>
        </div>
      )}
        
      {/* SECTION 1: Third Place Rankings */}
      <section>
          <ThirdPlaceTable standings={thirdPlaceStandings} teams={teams} lang={lang} />
      </section>

      {/* SECTION 2: All Groups Grid */}
      <section>
          <div className="flex items-center gap-2 mb-4 px-1">
             <LayoutGrid size={18} className="text-slate-400" />
             <h3 className="font-black text-slate-700 uppercase tracking-widest text-sm">{lang.allGroupTables}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
             {Object.entries(allStandings).map(([groupId, standings]) => {
                 const groupTeamIds = standings.map(s => s.teamId);
                 
                 const groupMatches = matches.filter(m => m.groupId === groupId);
                 const totalMatches = groupMatches.length;
                 const userPredsCount = userPredictions 
                    ? userPredictions.filter(p => groupMatches.some(m => m.id === p.matchId)).length 
                    : 0;
                 
                 let dotColor = 'bg-slate-600'; 
                 if (userPredsCount === totalMatches && totalMatches > 0) dotColor = 'bg-green-500';
                 else if (userPredsCount > 0) dotColor = 'bg-yellow-400';

                 return (
                     <div key={groupId} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                         <div className="h-14 relative overflow-hidden bg-slate-900">
                            {/* Flags */}
                            <div className="absolute inset-0 grid grid-cols-4 opacity-50">
                                {groupTeamIds.map(tid => (
                                    <div key={tid} className="relative h-full border-r border-white/5 last:border-0">
                                        <img src={teams[tid]?.flag} className="w-full h-full object-cover grayscale brightness-75" alt="" />
                                        <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-between px-4 z-10 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-sm">
                                       <span className="text-sm font-black text-white">{groupId}</span>
                                    </div>
                                    <span className="text-lg font-black text-white italic tracking-tighter uppercase drop-shadow-md">
                                        {lang.groups} {groupId}
                                    </span>
                                </div>
                                <div className={`w-2.5 h-2.5 rounded-full shadow-sm border border-slate-900/20 ${dotColor}`} title="Prediction Status"></div>
                            </div>
                         </div>
                         <StandingsTable 
                            standings={standings} 
                            teams={teams} 
                            lang={lang} 
                            compact={true} 
                            onTeamClick={onTeamClick} 
                            qualifiedThirds={qualifiedThirds} // PASSING THE PROP HERE
                         />
                     </div>
                 );
             })}
          </div>
      </section>

      {/* Navigation */}
      <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex gap-3 w-full max-w-lg">
              <button 
                  onClick={() => onGoToGroup?.('L')}
                  className="flex-1 px-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"
              >
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                  <span>Back to L</span>
              </button>
              
              <button 
                  onClick={onGoToKnockout}
                  className="flex-[2] px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl shadow-lg font-black uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
              >
                  <span>To Knockouts</span>
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
          </div>
      </div>
    </div>
  );
};