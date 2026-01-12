
import React, { useState, useEffect } from 'react';
import { Match, Team, Translation, UserProfile, Prediction, TournamentPhase } from '../types';
import { KnockoutBracket } from './KnockoutBracket';
import { Unlock, Timer, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SecondChanceViewProps {
  matches: Match[];
  teams: Record<string, Team>;
  onUpdate: (id: string, h: number, a: number) => void;
  lang: Translation;
  user: UserProfile | null;
  onUnlock: () => void;
  onRefreshTeams: () => void;
  rivals?: UserProfile[];
  allPredictions?: Prediction[];
  phase: TournamentPhase;
  onTeamClick?: (teamId: string) => void;
}

export const SecondChanceView: React.FC<SecondChanceViewProps> = ({
  matches, teams, onUpdate, lang, user, onUnlock, onRefreshTeams, rivals, allPredictions, phase, onTeamClick
}) => {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Set Deadline: July 2, 2026 at 10:00 AM UTC (2 hours before the first match at 12:00)
  // For demo purposes, ensure this date is in the future relative to testing
  useEffect(() => {
    const deadline = new Date(Date.UTC(2026, 6, 2, 10, 0, 0)); // Month is 0-indexed, so 6 is July
    
    const interval = setInterval(() => {
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();

        if (diff <= 0) {
            setIsExpired(true);
            setTimeLeft(null);
            clearInterval(interval);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const isLocked = !user?.hasTakenSecondChance;

  if (isLocked) {
      return (
          <div className="flex flex-col items-center justify-center py-12 px-4 animate-in zoom-in slide-in-from-bottom-4">
              {/* Header Card */}
              <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[2.5rem] p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden max-w-lg w-full border border-purple-500/30">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-50"></div>
                  
                  {/* Icon */}
                  <div className="relative mb-8 flex justify-center">
                     <div className="bg-white/10 p-6 rounded-full backdrop-blur-md shadow-[0_0_40px_rgba(168,85,247,0.4)] border border-purple-300/20">
                         <Unlock size={48} className="text-purple-300" />
                     </div>
                     <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg animate-bounce">
                         {lang.secondChanceTab}
                     </div>
                  </div>

                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">{lang.secondChanceTitle}</h2>
                  <p className="text-purple-100 text-sm font-medium leading-relaxed mb-8 opacity-90">
                      {lang.secondChanceDesc}
                  </p>

                  <div className="bg-black/30 rounded-xl p-4 mb-8 border border-white/10 flex items-start gap-3 text-left">
                      <AlertTriangle size={20} className="text-yellow-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-100 font-bold leading-relaxed">
                          {lang.secondChanceUnlockWarn}
                      </p>
                  </div>

                  {isExpired ? (
                      <div className="bg-slate-800 text-slate-400 py-4 rounded-xl font-black uppercase tracking-widest text-sm">
                          Deadline Passed
                      </div>
                  ) : (
                      <button 
                        onClick={onUnlock}
                        className="w-full bg-white text-indigo-900 py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-purple-50 hover:scale-105 transition-all flex items-center justify-center gap-2"
                      >
                         <Unlock size={18} /> {lang.secondChanceBtn}
                      </button>
                  )}

                  {timeLeft && (
                      <div className="mt-8 flex justify-center gap-4 text-white">
                          <div className="flex flex-col items-center">
                              <span className="text-2xl font-black font-mono">{timeLeft.days}</span>
                              <span className="text-[9px] uppercase tracking-widest opacity-50">Days</span>
                          </div>
                          <div className="text-2xl font-black opacity-30">:</div>
                          <div className="flex flex-col items-center">
                              <span className="text-2xl font-black font-mono">{timeLeft.hours.toString().padStart(2, '0')}</span>
                              <span className="text-[9px] uppercase tracking-widest opacity-50">Hrs</span>
                          </div>
                          <div className="text-2xl font-black opacity-30">:</div>
                          <div className="flex flex-col items-center">
                              <span className="text-2xl font-black font-mono">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                              <span className="text-[9px] uppercase tracking-widest opacity-50">Min</span>
                          </div>
                          <div className="text-2xl font-black opacity-30">:</div>
                          <div className="flex flex-col items-center">
                              <span className="text-2xl font-black font-mono">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                              <span className="text-[9px] uppercase tracking-widest opacity-50">Sec</span>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // UNLOCKED VIEW
  return (
    <div className="space-y-6 animate-fade-in pb-20">
        {/* Status Bar */}
        <div className="bg-gradient-to-r from-indigo-900 to-purple-800 rounded-2xl p-4 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 border border-purple-500/20">
             <div className="flex items-center gap-4">
                 <div className="bg-yellow-400/20 p-2.5 rounded-full border border-yellow-400/40">
                    <ShieldCheck size={24} className="text-yellow-400" />
                 </div>
                 <div>
                    <h3 className="font-black uppercase tracking-tight text-lg leading-none mb-1">Second Chance Active</h3>
                    <p className="text-[10px] text-purple-200 uppercase tracking-widest opacity-80">Points reduced by 50%</p>
                 </div>
             </div>

             <div className="flex items-center gap-4 w-full md:w-auto">
                 {timeLeft && (
                     <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                        <Timer size={14} className="text-purple-300" />
                        <span className="font-mono text-sm font-bold">{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</span>
                     </div>
                 )}
                 <button 
                    onClick={onRefreshTeams}
                    className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border border-white/10"
                 >
                    <RefreshCw size={14} /> {lang.refreshTeams}
                 </button>
             </div>
        </div>
        
        {/* Embed the standard bracket, but it acts on the data passed to it */}
        <KnockoutBracket 
            matches={matches}
            teams={teams}
            onUpdate={onUpdate}
            lang={lang}
            user={user}
            phase={phase}
            onSecondChance={() => {}} // No-op, we are already here
            rivals={rivals}
            allPredictions={allPredictions}
            onTeamClick={onTeamClick}
        />
    </div>
  );
};
