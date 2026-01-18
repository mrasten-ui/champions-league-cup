import React, { useState } from 'react';
import { Match, Team, Translation, UserProfile, Prediction, TournamentPhase, Round } from '../types';
import { ShieldCheck, Lock, Unlock, RefreshCw, AlertTriangle, CheckCircle2, Users, Shield, LayoutGrid, Columns, Crown } from 'lucide-react';
import { KnockoutBracket } from './KnockoutBracket';

interface SecondChanceViewProps {
  matches: Match[];
  teams: Record<string, Team>;
  onUpdate: (id: string, h: number, a: number) => void;
  lang: Translation;
  user: UserProfile | null;
  onUnlock: () => void;
  onRefreshTeams: () => void;
  rivals: UserProfile[];
  allPredictions: Prediction[];
  phase: TournamentPhase;
  onTeamClick?: (teamId: string) => void;
  onSpy: (matchId: string) => void;
  revealedRivals: string[];
}

export const SecondChanceView: React.FC<SecondChanceViewProps> = ({ 
  matches, teams, onUpdate, lang, user, onUnlock, onRefreshTeams,
  rivals, allPredictions, phase, onTeamClick,
  onSpy, revealedRivals 
}) => {
  const [isHovering, setIsHovering] = useState(false);
  
  // FIX: Manage local round state since KnockoutBracket is now stateless
  const [activeRound, setActiveRound] = useState<Round>('R32');
  const rounds: Round[] = ['R32', 'R16', 'QF', 'SF', 'FIN'];

  const hasUnlocked = user?.hasTakenSecondChance;

  // Helper for Round Icons (matching AppHeader style)
  const getRoundIcon = (r: Round) => {
      switch(r) {
          case 'R32': return <Users size={32} className="text-white/20" />; 
          case 'R16': return <Shield size={28} className="text-white/20" />;
          case 'QF': return <LayoutGrid size={28} className="text-white/20" />;
          case 'SF': return <Columns size={28} className="text-white/20" />;
          case 'FIN': return <Crown size={32} className="text-yellow-400/30" />;
          default: return null;
      }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-2xl ${hasUnlocked ? 'bg-green-500/20 text-green-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      {hasUnlocked ? <ShieldCheck size={32} /> : <Lock size={32} />}
                  </div>
                  <div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tighter">{lang.secondChanceTitle}</h2>
                      <p className="text-indigo-200 text-sm font-medium mt-1 max-w-md leading-relaxed">
                          {hasUnlocked ? lang.secondChanceActive : lang.secondChanceDesc}
                      </p>
                      {hasUnlocked && (
                          <div className="mt-2 inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 px-3 py-1 rounded-lg">
                              <AlertTriangle size={12} className="text-red-400" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-red-300">{lang.pointsReduced}</span>
                          </div>
                      )}
                  </div>
              </div>

              {!hasUnlocked ? (
                  <button 
                      onClick={onUnlock}
                      onMouseEnter={() => setIsHovering(true)}
                      onMouseLeave={() => setIsHovering(false)}
                      className={`relative px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all transform hover:scale-[1.02] shadow-lg flex items-center gap-3 ${isHovering ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white text-indigo-900'}`}
                  >
                      {isHovering ? (
                          <>
                             <AlertTriangle size={18} />
                             {lang.secondChanceBtn}
                          </>
                      ) : (
                          <>
                             <Unlock size={18} />
                             Unlock Now
                          </>
                      )}
                  </button>
              ) : (
                  <div className="flex gap-3">
                      <button 
                          onClick={onRefreshTeams}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg flex items-center gap-2 transition-all"
                      >
                          <RefreshCw size={16} /> {lang.refreshTeams}
                      </button>
                  </div>
              )}
          </div>
      </div>

      {!hasUnlocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  {lang.secondChanceUnlockWarn}
              </p>
          </div>
      )}

      {hasUnlocked ? (
          <div className="bg-white rounded-3xl p-1 shadow-sm border border-slate-200">
             {/* FIX: Add Round Selector here since it was removed from KnockoutBracket */}
             <div className="bg-slate-50 border-b border-slate-200 p-4 rounded-t-3xl overflow-x-auto no-scrollbar">
                <div className="flex gap-2 justify-start sm:justify-center min-w-max">
                    {rounds.map(r => {
                        const isActive = activeRound === r;
                        return (
                            <button
                                key={r}
                                onClick={() => setActiveRound(r)}
                                className={`
                                    relative min-w-[64px] h-14 rounded-xl overflow-hidden transition-all duration-200 border-2
                                    ${isActive 
                                        ? 'border-indigo-500 shadow-md scale-105 z-10' 
                                        : 'border-slate-200 bg-white hover:border-indigo-300'
                                    }
                                `}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${isActive ? 'from-indigo-600 to-indigo-800' : 'from-slate-100 to-slate-200'}`}></div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                    {getRoundIcon(r)}
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-sm font-black italic uppercase tracking-tighter ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                        {r === 'FIN' ? 'FINAL' : r}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
             </div>

             <KnockoutBracket 
                matches={matches} 
                teams={teams} 
                onUpdate={onUpdate} 
                lang={lang} 
                user={user} 
                onSecondChance={()=>{}}
                rivals={rivals}
                allPredictions={allPredictions}
                phase={phase}
                isGroupStageComplete={true}
                firstIncompleteGroup={null}
                onGoToGroup={() => {}}
                onTeamClick={onTeamClick}
                onSpy={onSpy} 
                revealedRivals={revealedRivals}
                // FIX: Pass the active round prop
                activeRound={activeRound}
             />
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50 pointer-events-none grayscale select-none filter blur-[1px]">
              {[1,2,3].map(i => (
                  <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
              ))}
          </div>
      )}
    </div>
  );
};