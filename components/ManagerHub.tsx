import React, { useState, useMemo } from 'react';
import { Match, Team, Prediction, UserProfile, Translation, TournamentPhase } from '../types';
import { ResourceHeader } from './ResourceHeader';
import { SecondChancePromo } from './SecondChancePromo';
import { PredictionStamp } from './PredictionStamp';
import { SubstitutionModal } from './SubstitutionModal';
import { Trophy, LayoutGrid } from 'lucide-react';

interface ManagerHubProps {
  matches: Match[];
  userMatches: Match[];
  teams: Record<string, Team>;
  allPredictions: Prediction[];
  currentUser: UserProfile;
  lang: Translation;
  onSubstitute: (matchId: string) => void;
  onUnlockSecondChance: () => void;
  onUpdate: (matchId: string, h: number, a: number) => void;
  phase: TournamentPhase;
}

export const ManagerHub: React.FC<ManagerHubProps> = ({
  matches, userMatches, teams, allPredictions, currentUser, lang, 
  onSubstitute, onUnlockSecondChance, onUpdate, phase
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'groups' | 'knockout'>('groups');

  const userPredictions = allPredictions.filter(p => p.userId === currentUser.email);
  
  // --- DATA ORGANIZATION ---
  const groupedMatches = useMemo(() => {
      const groups: Record<string, Match[]> = {};
      // Ensure specific order for Knockouts
      const knockouts: Record<string, Match[]> = {
          'R32': [], 'R16': [], 'QF': [], 'SF': [], '3RD': [], 'FIN': []
      };

      userMatches.forEach(m => {
          if (m.homeTeamId === 'TBD' || m.awayTeamId === 'TBD') return;

          if (m.groupId) {
              if (!groups[m.groupId]) groups[m.groupId] = [];
              groups[m.groupId].push(m);
          } else if (m.round) {
              if (knockouts[m.round]) knockouts[m.round].push(m);
          }
      });

      const sortedGroups = Object.keys(groups).sort().reduce((obj, key) => {
          obj[key] = groups[key].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return obj;
      }, {} as Record<string, Match[]>);

      return { groups: sortedGroups, knockouts };
  }, [userMatches]);

  const activeMatch = useMemo(() => matches.find(m => m.id === selectedMatchId), [selectedMatchId, matches]);

  const canSubMatch = (m: Match) => {
      const isLiveOrDone = ['LIVE', '1H', 'HT', '2H', 'FT', 'FINISHED', 'PEN', 'AET'].includes(m.status);
      if (isLiveOrDone) return false;
      return m.isLocked; 
  };

  const hasKnockouts = Object.values(groupedMatches.knockouts).some(arr => arr.length > 0);

  // Helper to get grid classes based on round
  const getKnockoutGridClass = (round: string, count: number) => {
      // Centered layouts for small rounds
      if (round === 'FIN') return 'flex justify-center max-w-sm mx-auto';
      if (round === 'SF') return 'flex flex-wrap justify-center gap-3 max-w-lg mx-auto';
      if (round === 'QF' && count <= 4) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3';
      
      // Default Grid for R32/R16
      return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3';
  };

  return (
    <div className="pb-24 animate-fade-in space-y-6">
      
      <ResourceHeader 
        user={currentUser} 
        lang={lang} 
        phase={phase}
        rank={99} 
        totalPoints={0}
      />

      <SecondChancePromo 
        hasTaken={currentUser.hasTakenSecondChance}
        onUnlock={onUnlockSecondChance}
        lang={lang}
      />

      <div className="flex p-1 bg-slate-200 rounded-xl shadow-inner border border-slate-300">
          <button 
            onClick={() => setViewMode('groups')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'groups' ? 'bg-[#0f2545] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
              <LayoutGrid size={14} />
              {lang.groups || "Group Stage"}
          </button>
          <button 
            onClick={() => setViewMode('knockout')}
            disabled={!hasKnockouts}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'knockout' ? 'bg-[#0f2545] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'} ${!hasKnockouts ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
              <Trophy size={14} />
              {lang.knockouts || "Knockouts"}
          </button>
      </div>

      {/* --- A) GROUP STAGE VIEW --- */}
      {viewMode === 'groups' && (
          <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
              {Object.entries(groupedMatches.groups).map(([groupId, groupMatches]) => (
                  <div key={groupId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-[#0f2545] px-4 py-2 flex items-center justify-between">
                          <span className="text-white text-xs font-black uppercase tracking-widest">Group {groupId}</span>
                          <span className="text-[9px] font-bold text-blue-200 bg-white/10 px-2 py-0.5 rounded">{groupMatches.length} Matches</span>
                      </div>

                      <div className="p-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {groupMatches.map(userMatch => {
                                  const realMatch = matches.find(m => m.id === userMatch.id) || userMatch;
                                  return (
                                      <PredictionStamp 
                                          key={userMatch.id}
                                          match={realMatch}
                                          homeTeam={teams[userMatch.homeTeamId]}
                                          awayTeam={teams[userMatch.awayTeamId]}
                                          prediction={userPredictions.find(p => p.matchId === userMatch.id)}
                                          onOpenSub={() => setSelectedMatchId(userMatch.id)}
                                          canSubstitute={canSubMatch(realMatch)}
                                          userHasPenalty={currentUser.hasTakenSecondChance}
                                          lang={lang}
                                          variant="standard"
                                      />
                                  );
                              })}
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* --- B) KNOCKOUT VIEW --- */}
      {viewMode === 'knockout' && hasKnockouts && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              {Object.entries(groupedMatches.knockouts).map(([round, roundMatches]) => {
                  if (roundMatches.length === 0) return null;
                  
                  const gridClass = getKnockoutGridClass(round, roundMatches.length);

                  return (
                      <div key={round} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="bg-[#0f2545] px-4 py-2 border-b border-slate-700 text-center sm:text-left">
                              <span className="text-white text-xs font-black uppercase tracking-widest">{round}</span>
                          </div>
                          
                          <div className="p-3">
                              <div className={gridClass}>
                                  {roundMatches.map(userMatch => {
                                      const realMatch = matches.find(m => m.id === userMatch.id) || userMatch;
                                      return (
                                          <PredictionStamp 
                                              key={userMatch.id}
                                              match={realMatch}
                                              homeTeam={teams[userMatch.homeTeamId]}
                                              awayTeam={teams[userMatch.awayTeamId]}
                                              prediction={userPredictions.find(p => p.matchId === userMatch.id)}
                                              onOpenSub={() => setSelectedMatchId(userMatch.id)}
                                              canSubstitute={canSubMatch(realMatch)}
                                              userHasPenalty={currentUser.hasTakenSecondChance}
                                              lang={lang}
                                              variant="knockout"
                                              isFinal={round === 'FIN'} // Trigger special style
                                          />
                                      );
                                  })}
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      )}

      {selectedMatchId && activeMatch && (
          <SubstitutionModal 
              match={activeMatch}
              homeTeam={teams[activeMatch.homeTeamId]}
              awayTeam={teams[activeMatch.awayTeamId]}
              currentUser={currentUser}
              allPredictions={allPredictions}
              lang={lang}
              onClose={() => setSelectedMatchId(null)}
              onUpdate={onUpdate}
              onSubstitute={() => onSubstitute(selectedMatchId)}
          />
      )}
    </div>
  );
};