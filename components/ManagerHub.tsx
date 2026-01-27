import React, { useState, useMemo } from 'react';
import { Match, Team, Prediction, UserProfile, Translation, TournamentPhase } from '../types';
import { ResourceHeader } from './ResourceHeader';
import { SecondChancePromo } from './SecondChancePromo';
import { PredictionStamp } from './PredictionStamp';
import { SubstitutionModal } from './SubstitutionModal';
import { calculateMaxPotentialPoints } from '../services/engine';
import { Trophy, Users, LayoutGrid } from 'lucide-react';

interface ManagerHubProps {
  matches: Match[];
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
  matches, teams, allPredictions, currentUser, lang, 
  onSubstitute, onUnlockSecondChance, onUpdate, phase
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const userPredictions = allPredictions.filter(p => p.userId === currentUser.email);
  
  // --- 1. DATA ORGANIZATION ---
  const groupedMatches = useMemo(() => {
      const groups: Record<string, Match[]> = {};
      const knockouts: Record<string, Match[]> = {
          'R32': [], 'R16': [], 'QF': [], 'SF': [], 'FIN': [], '3RD': []
      };

      matches.forEach(m => {
          // Only show "Real" matches (where teams are decided)
          if (m.homeTeamId === 'TBD' || m.awayTeamId === 'TBD') return;

          if (m.groupId) {
              if (!groups[m.groupId]) groups[m.groupId] = [];
              groups[m.groupId].push(m);
          } else if (m.round) {
              knockouts[m.round].push(m);
          }
      });

      // Sort groups alphabetically
      const sortedGroups = Object.keys(groups).sort().reduce((obj, key) => {
          obj[key] = groups[key].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return obj;
      }, {} as Record<string, Match[]>);

      return { groups: sortedGroups, knockouts };
  }, [matches]);

  // --- 2. HELPERS ---
  const activeMatch = useMemo(() => matches.find(m => m.id === selectedMatchId), [selectedMatchId, matches]);

  const canSubMatch = (m: Match) => {
      // Can sub if: 
      // 1. Game is not finished/live (usually locked status handles this)
      // 2. User has subs remaining
      // 3. User hasn't already unlocked it (if unlocked, just edit)
      // Actually, if unlocked, they can just edit. 
      // If locked, they need to "Sub". 
      
      const isLiveOrDone = ['LIVE', '1H', 'HT', '2H', 'FT', 'FINISHED', 'PEN', 'AET'].includes(m.status);
      if (isLiveOrDone) return false;
      
      // If unlocked, it's just editing, handled inside modal logic. 
      // The button on the stamp opens the modal regardless, 
      // but we visually show the button only if action is possible.
      
      return m.isLocked; // If it's unlocked (open), they can edit freely in other views, but here we treat all locked games as potential subs.
  };

  return (
    <div className="pb-24 animate-fade-in space-y-8">
      
      {/* PROFILE HEADER */}
      <ResourceHeader 
        user={currentUser} 
        lang={lang} 
        phase={phase}
        rank={99} 
        totalPoints={0}
      />

      {/* SECOND CHANCE */}
      <SecondChancePromo 
        hasTaken={currentUser.hasTakenSecondChance}
        onUnlock={onUnlockSecondChance}
        lang={lang}
      />

      {/* --- GRID: KNOCKOUT STAGES (Priority) --- */}
      {Object.entries(groupedMatches.knockouts).map(([round, roundMatches]) => {
          if (roundMatches.length === 0) return null;
          return (
              <div key={round} className="space-y-3">
                  <div className="flex items-center gap-2 px-1 text-slate-400">
                      <Trophy size={14} />
                      <h3 className="text-xs font-black uppercase tracking-widest">{round}</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {roundMatches.map(m => (
                          <PredictionStamp 
                              key={m.id}
                              match={m}
                              homeTeam={teams[m.homeTeamId]}
                              awayTeam={teams[m.awayTeamId]}
                              prediction={userPredictions.find(p => p.matchId === m.id)}
                              onOpenSub={() => setSelectedMatchId(m.id)}
                              canSubstitute={canSubMatch(m)}
                              userHasPenalty={currentUser.hasTakenSecondChance}
                              lang={lang}
                          />
                      ))}
                  </div>
              </div>
          );
      })}

      {/* --- GRID: GROUPS --- */}
      <div className="space-y-6">
          <div className="flex items-center gap-2 px-1 text-slate-400 border-b border-slate-100 pb-2">
              <LayoutGrid size={14} />
              <h3 className="text-xs font-black uppercase tracking-widest">{lang.groups || "Group Stage"}</h3>
          </div>
          
          {Object.entries(groupedMatches.groups).map(([groupId, groupMatches]) => (
              <div key={groupId}>
                  <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2 ml-1">Group {groupId}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {groupMatches.map(m => (
                          <PredictionStamp 
                              key={m.id}
                              match={m}
                              homeTeam={teams[m.homeTeamId]}
                              awayTeam={teams[m.awayTeamId]}
                              prediction={userPredictions.find(p => p.matchId === m.id)}
                              onOpenSub={() => setSelectedMatchId(m.id)}
                              canSubstitute={canSubMatch(m)}
                              userHasPenalty={currentUser.hasTakenSecondChance}
                              lang={lang}
                          />
                      ))}
                  </div>
              </div>
          ))}
      </div>

      {/* --- MODAL --- */}
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