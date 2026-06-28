import React, { useState, useEffect } from 'react';
import { Match, Team, Translation, UserProfile, Prediction, TournamentPhase, Round } from '../types';
import { ShieldCheck, Lock, Unlock, AlertTriangle, Users, Shield, LayoutGrid, Columns, Crown, Clock, Save, RefreshCw } from 'lucide-react';
import { KnockoutBracket } from './KnockoutBracket';

interface SecondChanceViewProps {
  matches: Match[];
  teams: Record<string, Team>;
  onUpdate: (id: string, h: number, a: number) => void;
  lang: Translation;
  user: UserProfile | null;
  onPledge: () => void;
  onLockIn: () => void;
  rivals: UserProfile[];
  allPredictions: Prediction[];
  phase: TournamentPhase;
  onTeamClick?: (teamId: string) => void;
  onSpy: (matchId: string) => void;
  revealedRivals: string[];
  groupStageEndTime: number;
  knockoutStartTime: number;
  activeRound?: Round;
  onRoundChange?: (r: Round) => void;
  onEdit?: () => void;
}

export const SecondChanceView: React.FC<SecondChanceViewProps> = ({
  matches, teams, onUpdate, lang, user, onPledge, onLockIn,
  allPredictions, phase,
  onSpy, revealedRivals, groupStageEndTime, knockoutStartTime,
  activeRound: activeRoundProp, onRoundChange, onEdit,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const rounds: Round[] = ['R32', 'R16', 'QF', 'SF', 'FIN'];
  const [internalRound, setInternalRound] = useState<Round>('R32');
  const mapToScRound = (r: Round): Round => rounds.includes(r) ? r : 'FIN';
  const activeRound: Round = activeRoundProp ? mapToScRound(activeRoundProp) : internalRound;
  const setActiveRound = (r: Round) => { setInternalRound(r); onRoundChange?.(r); };

  const status = user?.secondChanceStatus || 'NONE';
  const now = Date.now();

  const handleTeamClick = (teamId: string) => {
    const roundOrder: Round[] = ['R32', 'R16', 'QF', 'SF', 'FIN'];
    let targetRound: Round = 'R32';
    for (const round of roundOrder) {
      if (matches.some(m => m.round === round && (m.homeTeamId === teamId || m.awayTeamId === teamId))) {
        targetRound = round;
      }
    }
    setActiveRound(targetRound);
  };

  // In ACTIVE mode the bracket is read-only — lock all knockout slots so
  // team clicks navigate (via handleTeamClick) instead of making picks.
  const scMatches = status === 'ACTIVE'
    ? matches.map(m => m.round ? { ...m, isLocked: true } : m)
    : matches;
  
  // Is it between the end of Groups and the start of R32?
  const isDraftingWindow = now >= groupStageEndTime && now < knockoutStartTime;
  // Is the group stage entirely in the future/ongoing?
  const isWaitingForGroups = now < groupStageEndTime;

  // --- TIMER LOGIC ---
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const target = isWaitingForGroups ? groupStageEndTime : knockoutStartTime;
    if (target === 0 || status === 'NONE' || status === 'ACTIVE') return;

    const interval = setInterval(() => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        clearInterval(interval);
      } else {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [groupStageEndTime, knockoutStartTime, isWaitingForGroups, status]);

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

  // ==========================================
  // STAGE 1: THE PLEDGE (Not yet clicked)
  // ==========================================
  if (status === 'NONE') {
      return (
        <div className="animate-fade-in space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
              <div className="relative z-10 flex flex-col items-center justify-center gap-6">
                  <div className="p-5 rounded-full bg-indigo-500/20 text-indigo-400 mb-2">
                      <Lock size={48} />
                  </div>
                  <div>
                      <h2 className="text-3xl font-black uppercase italic tracking-tighter">{lang.secondChanceTitle}</h2>
                      <p className="text-indigo-200 text-base font-medium mt-3 max-w-lg mx-auto leading-relaxed">
                          {lang.secondChanceDesc || "Are your group stage predictions completely ruined? Pledge now to unlock the real bracket when the group stages end."}
                      </p>
                  </div>
                  <button 
                      onClick={onPledge}
                      onMouseEnter={() => setIsHovering(true)}
                      onMouseLeave={() => setIsHovering(false)}
                      className={`relative mt-4 px-10 py-5 rounded-xl font-black uppercase tracking-widest transition-all transform hover:scale-[1.02] shadow-xl flex items-center gap-3 text-lg ${isHovering ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' : 'bg-white text-indigo-900'}`}
                  >
                      {isHovering ? <><AlertTriangle size={24} /> Pledge Second Chance</> : <><Unlock size={24} /> Activate Lifeline</>}
                  </button>
              </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 font-medium leading-relaxed">
                  {lang.secondChanceUnlockWarn || "Warning: Activating Second Chance will reduce all future points by 50%."}
              </p>
          </div>
        </div>
      );
  }

  // ==========================================
  // STAGE 2A: THE WAITING ROOM (Pledged, waiting for groups to end)
  // ==========================================
  if (status === 'PENDING' && isWaitingForGroups) {
      return (
        <div className="animate-fade-in flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-indigo-50 p-6 rounded-full mb-8 text-indigo-500 relative shadow-inner">
                <Clock size={56} className="animate-pulse" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-4">{lang.pledgeLocked}</h2>
            <p className="text-slate-500 font-medium max-w-md mb-10 text-lg">
                {lang.pledgeLockedDesc}
            </p>
            
            <div className="flex gap-4">
                <div className="bg-slate-800 text-white rounded-2xl w-24 h-24 flex flex-col items-center justify-center shadow-xl">
                    <span className="text-4xl font-black font-mono">{String(timeLeft.d).padStart(2, '0')}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">{lang.days}</span>
                </div>
                <div className="bg-slate-800 text-white rounded-2xl w-24 h-24 flex flex-col items-center justify-center shadow-xl">
                    <span className="text-4xl font-black font-mono">{String(timeLeft.h).padStart(2, '0')}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">{lang.hours}</span>
                </div>
                <div className="bg-slate-800 text-white rounded-2xl w-24 h-24 flex flex-col items-center justify-center shadow-xl">
                    <span className="text-4xl font-black font-mono">{String(timeLeft.m).padStart(2, '0')}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">{lang.minutes}</span>
                </div>
                <div className="bg-slate-800 text-white rounded-2xl w-24 h-24 flex flex-col items-center justify-center shadow-xl">
                    <span className="text-4xl font-black font-mono text-indigo-400">{String(timeLeft.s).padStart(2, '0')}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">{lang.seconds}</span>
                </div>
            </div>
        </div>
      );
  }

  // ==========================================
  // STAGE 2B & 3: THE SPRINT & ACTIVE BRACKET
  // ==========================================
  return (
    <div className="animate-fade-in space-y-6">
      
      {/* HEADER BANNER */}
      <div className={`rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${status === 'ACTIVE' ? 'bg-gradient-to-r from-green-600 to-emerald-800' : 'bg-gradient-to-r from-red-600 to-rose-800'}`}>
          <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  {status === 'ACTIVE' ? <ShieldCheck size={28} /> : <AlertTriangle size={28} className="animate-pulse" />}
              </div>
              <div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter">
                      {status === 'ACTIVE' ? lang.secondChanceActive : lang.draftingWindowOpen || 'Drafting Window Open'}
                  </h2>
                  <div className="mt-1 inline-flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">{lang.pointsReduced}</span>
                  </div>
              </div>
          </div>

          {/* ACTIVE: change picks button */}
          {status === 'ACTIVE' && onEdit && (
              <button onClick={onEdit} className="shrink-0 flex items-center gap-2 bg-white/20 hover:bg-white/30 active:scale-95 px-5 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all">
                  <RefreshCw size={16} /> {lang.changePicks || 'Change Picks'}
              </button>
          )}

          {/* SPRINT DRAFTING UI */}
          {status === 'PENDING' && isDraftingWindow && (
              <div className="flex items-center gap-6">
                  <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-red-200 font-bold mb-1">{lang.timeTolockIn || 'Time to lock-in'}</div>
                      <div className="font-mono text-2xl font-black tabular-nums">
                          {String(timeLeft.h).padStart(2, '0')}:{String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}
                      </div>
                  </div>
                  <button onClick={onLockIn} className="bg-white text-red-700 hover:bg-red-50 px-8 py-4 rounded-xl font-black uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95">
                      <Save size={18} /> {lang.bracketLockedIn}
                  </button>
              </div>
          )}
      </div>

      {/* THE BRACKET ENGINE */}
      <div className="bg-white rounded-3xl p-1 shadow-sm border border-slate-200">
         <div className="bg-slate-50 border-b border-slate-200 p-4 rounded-t-3xl overflow-x-auto no-scrollbar">
            <div className="flex gap-2 justify-start sm:justify-center min-w-max">
                {rounds.map(r => {
                    const isActive = activeRound === r;
                    return (
                        <button
                            key={r}
                            onClick={() => setActiveRound(r)}
                            className={`relative min-w-[64px] h-14 rounded-xl overflow-hidden transition-all duration-200 border-2 ${isActive ? 'border-indigo-500 shadow-md scale-105 z-10' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${isActive ? 'from-indigo-600 to-indigo-800' : 'from-slate-100 to-slate-200'}`}></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-30">{getRoundIcon(r)}</div>
                            <div className="absolute inset-0 flex items-center justify-center"><span className={`text-sm font-black italic uppercase tracking-tighter ${isActive ? 'text-white' : 'text-slate-400'}`}>{r === 'FIN' ? 'FINAL' : r}</span></div>
                        </button>
                    );
                })}
            </div>
         </div>

         <KnockoutBracket
            matches={scMatches}
            teams={teams}
            onUpdate={onUpdate}
            lang={lang}
            user={user}
            onSecondChance={()=>{}}
            rivals={[]}
            allPredictions={allPredictions.filter(p => p.userId !== user?.email)}
            phase={phase}
            isGroupStageComplete={true}
            firstIncompleteGroup={null}
            onGoToGroup={() => {}}
            onTeamClick={handleTeamClick}
            onSpy={onSpy}
            revealedRivals={revealedRivals}
            activeRound={activeRound}
         />
      </div>
    </div>
  );
};