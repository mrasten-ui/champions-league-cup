import React, { useState, useMemo } from 'react';
import { Match, Team, Prediction, UserProfile, Translation, TournamentPhase } from '../types';
import { ResourceHeader } from './ResourceHeader';
import { SecondChancePromo } from './SecondChancePromo';
import { PredictionStamp } from './PredictionStamp';
import { ActionableMatchCarousel } from './ActionableMatchCarousel'; // Ensure this is imported if used, otherwise remove
import { SubstitutionModal } from './SubstitutionModal';
import { Trophy, LayoutGrid, Lock } from 'lucide-react';

interface ManagerHubProps {
  matches: Match[];        // Official schedule (Real Status/Scores)
  userMatches: Match[];    // User's predicted bracket (Predicted Teams)
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

  const userPredictions = allPredictions.filter(p => p.userId === currentUser.email);
  
  // --- 1. DATA ORGANIZATION (Using User's Predicted Bracket) ---
  const groupedMatches = useMemo(() => {
      const groups: Record<string, Match[]> = {};
      const knockouts: Record<string, Match[]> = {
          'R32': [], 'R16': [], 'QF': [], 'SF': [], 'FIN': [], '3RD': []
      };

      // Use userMatches to determine WHO is playing (Prediction Path)
      userMatches.forEach(m => {
          if (m.homeTeamId === 'TBD' || m.awayTeamId === 'TBD') return;

          if (m.groupId) {
              if (!groups[m.groupId]) groups[m.groupId] = [];
              groups[m.groupId].push(m);
          } else if (m.round) {
              knockouts[m.round].push(m);
          }
      });

      const sortedGroups = Object.keys(groups).sort().reduce((obj, key) => {
          obj[key] = groups[key].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return obj;
      }, {} as Record<string, Match[]>);

      return { groups: sortedGroups, knockouts };
  }, [userMatches]); // Dependency on userMatches

  // --- 2. HELPERS ---
  const activeMatch = useMemo(() => matches.find(m => m.id === selectedMatchId), [selectedMatchId, matches]);

  const canSubMatch = (m: Match) => {
      const isLiveOrDone = ['LIVE', '1H', 'HT', '2H', 'FT', 'FINISHED', 'PEN', 'AET'].includes(m.status);
      if (isLiveOrDone) return false;
      return m.isLocked; 
  };

  const hasKnockouts = Object.values(groupedMatches.knockouts).some(arr => arr.length > 0);

  return (
    <div className="pb-24 animate-fade-in space-y-8">
      
      {/* 1. PROFILE HEADER */}
      <ResourceHeader 
        user={currentUser} 
        lang={lang} 
        phase={phase}
        rank={99} 
        totalPoints={0}
      />

      {/* 2. SECOND CHANCE */}
      <SecondChancePromo 
        hasTaken={currentUser.hasTakenSecondChance}
        onUnlock={onUnlockSecondChance}
        lang={lang}
      />

      {/* 3. KNOCKOUT STAGES GRID (Boxed) */}
      {hasKnockouts && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-[#0f2545] px-4 py-3 flex items-center gap-2 border-b border-slate-700">
                  <Trophy size={16} className="text-amber-400" />
                  <span className="text-sm font-black text-white uppercase tracking-widest">{lang.knockouts || "Knockout Stage"}</span>
              </div>
              
              <div className="p-4 space-y-6">
                  {Object.entries(groupedMatches.knockouts).map(([round, roundMatches]) => {
                      if (roundMatches.length === 0) return null;
                      return (
                          <div key={round}>
                              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-1">{round}</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                  {roundMatches.map(userMatch => {
                                      // Find REAL match for status/scores
                                      const realMatch = matches.find(m => m.id === userMatch.id);
                                      if (!realMatch) return null;

                                      return (
                                          <PredictionStamp 
                                              key={userMatch.id}
                                              match={realMatch} // Pass REAL match for status
                                              homeTeam={teams[userMatch.homeTeamId]} // Pass PREDICTED team
                                              awayTeam={teams[userMatch.awayTeamId]} // Pass PREDICTED team
                                              prediction={userPredictions.find(p => p.matchId === userMatch.id)}
                                              onOpenSub={() => setSelectedMatchId(userMatch.id)}
                                              canSubstitute={canSubMatch(realMatch)}
                                              userHasPenalty={currentUser.hasTakenSecondChance}
                                              lang={lang}
                                          />
                                      );
                                  })}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* 4. GROUP STAGE GRID (Boxed) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#0f2545] px-4 py-3 flex items-center gap-2 border-b border-slate-700">
              <LayoutGrid size={16} className="text-blue-400" />
              <span className="text-sm font-black text-white uppercase tracking-widest">{lang.groups || "Group Stage"}</span>
          </div>

          <div className="p-4 space-y-8">
              {Object.entries(groupedMatches.groups).map(([groupId, groupMatches]) => (
                  <div key={groupId} className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                      <div className="flex items-center gap-3 mb-4">
                          <span className="bg-[#0f2545] text-white text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">
                              Group {groupId}
                          </span>
                          <div className="h-px bg-slate-200 flex-1"></div>
                      </div>

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
                                  />
                              );
                          })}
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* MODAL */}
      {selectedMatchId && activeMatch && (
          <SubstitutionModal 
              match={activeMatch}
              homeTeam={teams[activeMatch.homeTeamId]} // Note: Modal shows REAL match participants usually, but if editing prediction, maybe show predicted? 
              // Actually, sub modal needs to show what the user IS predicting. 
              // But wait, if they sub, they might be changing a match that effectively DOESN'T exist in real life yet (TBD vs TBD).
              // BUT Substitution is usually for *Real* games. 
              // Let's assume activeMatch (from matches) has the correct TBD/Real IDs. 
              // If it's a future knockout that is TBD, can they sub it? No, it's not locked. They can just edit in bracket.
              // So Subs are only for LOCKED matches. Locked matches usually have teams.
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