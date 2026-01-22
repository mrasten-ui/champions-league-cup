import React, { useState, useMemo } from 'react';
import { Match, Team, Prediction, UserProfile, Translation } from '../types';
import { MatchCard } from './MatchCard';
import { Briefcase, RefreshCw } from 'lucide-react';
import { calculatePoints } from '../services/engine';

interface MyPredictionsProps {
  matches: Match[];
  teams: Record<string, Team>;
  allPredictions: Prediction[];
  currentUser: UserProfile;
  lang: Translation;
  onGoToGroup: (groupId: string) => void;
  onGoToBracket: () => void;
  onUnlockSecondChance: () => void;
  onSubstitute: (matchId: string) => void;
  onUpdate: (matchId: string, home: number, away: number) => void;
}

export const MyPredictions: React.FC<MyPredictionsProps> = ({
  matches,
  teams,
  allPredictions,
  currentUser,
  lang,
  onGoToGroup,
  onGoToBracket,
  onUnlockSecondChance,
  onSubstitute,
  onUpdate
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LOCKED' | 'OPEN'>('ALL');
  
  const sortedMatches = useMemo(() => {
    return matches.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [matches]);

  const filteredMatches = useMemo(() => {
      if (activeFilter === 'ALL') return sortedMatches;
      return sortedMatches.filter(m => {
          const isLocked = (['LIVE', 'FT', 'FINISHED'].includes(m.status) || m.isLocked);
          const isUnlocked = (currentUser.unlockedMatches || []).includes(m.id);
          
          if (activeFilter === 'LOCKED') return isLocked && !isUnlocked;
          if (activeFilter === 'OPEN') return !isLocked || isUnlocked;
          return true;
      });
  }, [sortedMatches, activeFilter, currentUser.unlockedMatches]);

  // Calculate Stats
  const totalPoints = useMemo(() => {
      return matches.reduce((acc, m) => {
          const pred = allPredictions.find(p => p.userId === currentUser.email && p.matchId === m.id);
          if (pred && m.homeScore !== null && m.awayScore !== null) {
              return acc + calculatePoints(pred.home, pred.away, m.homeScore, m.awayScore, currentUser.hasTakenSecondChance, m.round);
          }
          return acc;
      }, 0);
  }, [matches, allPredictions, currentUser]);

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* HEADER: MANAGER PROFILE */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5"><Briefcase size={120} /></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-white/20 shadow-xl overflow-hidden bg-slate-700">
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-xs font-black px-2 py-1 rounded-lg border border-white shadow-sm">
                      Lvl 1
                  </div>
              </div>
              
              <div className="text-center md:text-left flex-1">
                  <h2 className="text-2xl font-black uppercase tracking-tight">{currentUser.name}</h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                      <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold flex items-center gap-2">
                          <Briefcase size={14} className="text-yellow-400" />
                          {lang.manager}
                      </span>
                      <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold flex items-center gap-2">
                          <RefreshCw size={14} className={currentUser.substitutions > 0 ? "text-green-400" : "text-red-400"} />
                          {currentUser.substitutions} Subs Left
                      </span>
                  </div>
              </div>

              <div className="flex flex-col items-center bg-white/10 p-4 rounded-xl border border-white/5 min-w-[100px]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Total Pts</span>
                  <span className="text-3xl font-black text-white">{totalPoints}</span>
              </div>
          </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          {(['ALL', 'LOCKED', 'OPEN'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeFilter === f ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                  {f === 'ALL' ? lang.allBtn : f === 'LOCKED' ? 'Vault' : 'Active'}
              </button>
          ))}
      </div>

      {/* MATCH LIST */}
      <div className="space-y-4">
          {filteredMatches.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                  <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-bold">No matches found in this view.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMatches.map(match => (
                      <MatchCard 
                          key={match.id}
                          match={match}
                          homeTeam={teams[match.homeTeamId]}
                          awayTeam={teams[match.awayTeamId]}
                          onUpdate={onUpdate}
                          lang={lang}
                          locale={'en-GB'}
                          userTokens={currentUser.tokens}
                          rivals={[]} // Hide rivals in manager view
                          onSpy={() => {}}
                          revealedRivals={[]}
                          currentUser={currentUser}
                          allPredictions={allPredictions}
                          phase={'LIVE'} // Force live logic to enable locking mechanics
                          isAdminMode={false}
                          onSubstitute={() => onSubstitute(match.id)}
                          substitutionsLeft={currentUser.substitutions}
                          isUnlockedBySub={(currentUser.unlockedMatches || []).includes(match.id)}
                      />
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};