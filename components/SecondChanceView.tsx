import React, { useState } from 'react';
import { Match, Team, Translation, UserProfile, Prediction, TournamentPhase } from '../types';
import { ShieldCheck, Lock, Unlock, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'; // Added Unlock
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
}

export const SecondChanceView: React.FC<SecondChanceViewProps> = ({ 
  matches, teams, onUpdate, lang, user, onUnlock, onRefreshTeams,
  rivals, allPredictions, phase, onTeamClick 
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const hasUnlocked = user?.hasTakenSecondChance;

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