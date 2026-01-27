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
      const knockouts: Record<string, Match[]> = {
          'R32': [], 'R16': [], 'QF': [], 'SF': [], 'FIN': [], '3RD': []
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

  // --- LOGIC: CAN SUB? ---
  const canSubMatch = (m: Match) => {
      // 1. KNOCKOUTS: NEVER Allow individual subs (Must use Second Chance)
      if (m.round) return false;

      // 2. GROUPS: Allow if locked but not live/finished
      const isLiveOrDone = ['LIVE', '1H', 'HT', '2H', 'FT', 'FINISHED', 'PEN', 'AET'].includes(m.status);
      if (isLiveOrDone) return false;
      
      return m.isLocked; 
  };

  // Helper for Knockout Grid Layouts
  const getKnockoutGridClass = (round: string, count: number) => {
      if (round === 'FIN') return 'flex justify-center max-w-sm mx-auto';
      if (round === 'SF') return 'flex flex-wrap justify-center gap-3 max-w-lg mx-auto';
      if (round === 'QF' && count <= 4) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3';
      return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3';
  };

  const hasKnockouts = Object.values(groupedMatches.knockouts).some(arr => arr.length > 0);

  return (
    <div className="pb-24 animate-fade-in space-y-8">
      
      {/* 1. PROFILE HEADER (Always Visible) */}
      <ResourceHeader 
        user={currentUser} 
        lang={lang} 
        phase={phase}
        rank={99} 
        totalPoints={0}
      />

      {/* 2. PROMINENT VIEW SWITCHER */}
      <div className="bg-white p-2 rounded-3xl shadow-md border border-slate-200">
          <div className="flex relative bg-slate-100 rounded-2xl p-1.5 h-16">
              <button 
                onClick={() => setViewMode('groups')}
                className={`flex-1 flex items-center justify-center gap-3 rounded-xl text-sm sm:text-base font-black uppercase tracking-widest transition-all duration-300 ${viewMode === 'groups' ? 'bg-[#0f2545] text-white shadow-lg scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  <LayoutGrid size={20} />
                  {lang.groups || "Group Stage"}
              </button>
              <button 
                onClick={() => setViewMode('knockout')}
                disabled={!hasKnockouts}
                className={`flex-1 flex items-center justify-center gap-3 rounded-xl text-sm sm:text-base font-black uppercase tracking-widest transition-all duration-300 ${viewMode === 'knockout' ? 'bg-[#0f2545] text-white shadow-lg scale-[1.02]' : 'text-slate-400 hover:text-slate-600'} ${!hasKnockouts ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                  <Trophy size={20} />
                  {lang.knockouts || "Knockouts"}
              </button>
          </div>
      </div>

      {/* --- A) GROUP STAGE VIEW --- */}
      {viewMode === 'groups' && (
          <div className="space-y-8 animate-in slide-in-from-left-4 fade-in duration-300">
              {Object.entries(groupedMatches.groups).map(([groupId, groupMatches]) => (
                  <div key={groupId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      {/* Prominent Header */}
                      <div className="bg-[#0f2545] px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-black text-sm border border-white/10">
                                  {groupId}
                              </div>
                              <span className="text-white text-sm font-black uppercase tracking-widest">Group {groupId}</span>
                          </div>
                          <span className="text-[10px] font-bold text-blue-200 bg-white/5 px-3 py-1 rounded-full border border-white/5">{groupMatches.length} Matches</span>
                      </div>

                      <div className="p-4 bg-slate-50/50">
                          {/* 3-Column Grid for PC */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                          variant="standard" // Standard = Scores + Subs
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
          <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
              
              {/* STRATEGY: Second Chance (Contextualized here) */}
              <SecondChancePromo 
                  hasTaken={currentUser.hasTakenSecondChance}
                  onUnlock={onUnlockSecondChance}
                  lang={lang}
              />

              {Object.entries(groupedMatches.knockouts).map(([round, roundMatches]) => {
                  if (roundMatches.length === 0) return null;
                  
                  const gridClass = getKnockoutGridClass(round, roundMatches.length);

                  return (
                      <div key={round} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="bg-[#0f2545] px-4 py-3 border-b border-slate-700 flex justify-center sm:justify-start">
                              <span className="text-white text-sm font-black uppercase tracking-[0.2em]">{round}</span>
                          </div>
                          
                          <div className="p-4 bg-slate-50/30">
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
                                              onOpenSub={() => {}} // No Action for Knockouts
                                              canSubstitute={false} // Explicitly Disabled
                                              userHasPenalty={currentUser.hasTakenSecondChance}
                                              lang={lang}
                                              variant="knockout" // Knockout = Flags Only
                                              isFinal={round === 'FIN'} 
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

      {/* MODAL (Only opens for Group Games now) */}
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