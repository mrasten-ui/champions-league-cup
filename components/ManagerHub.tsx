import React, { useState, useMemo } from 'react';
import { Match, Team, Prediction, UserProfile, Translation, TournamentPhase } from '../types';
import { ResourceHeader } from './ResourceHeader';
import { SecondChancePromo } from './SecondChancePromo';
import { PredictionStamp } from './PredictionStamp';
import { SubstitutionModal } from './SubstitutionModal';
import { Trophy, LayoutGrid } from 'lucide-react';

interface ManagerHubProps {
  matches: Match[];        // Official schedule (Real Status/Scores)
  userMatches: Match[];    // NEW: User's predicted bracket path (Predicted Teams)
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
  
  // VIEW TOGGLE STATE: Default to 'groups'
  const [viewMode, setViewMode] = useState<'groups' | 'knockout'>('groups');

  const userPredictions = allPredictions.filter(p => p.userId === currentUser.email);
  
  // --- DATA ORGANIZATION (Using User's Predicted Bracket) ---
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
  }, [userMatches]);

  // --- HELPERS ---
  const activeMatch = useMemo(() => matches.find(m => m.id === selectedMatchId), [selectedMatchId, matches]);

  const canSubMatch = (m: Match) => {
      const isLiveOrDone = ['LIVE', '1H', 'HT', '2H', 'FT', 'FINISHED', 'PEN', 'AET'].includes(m.status);
      if (isLiveOrDone) return false;
      return m.isLocked; 
  };

  const hasKnockouts = Object.values(groupedMatches.knockouts).some(arr => arr.length > 0);

  return (
    <div className="pb-24 animate-fade-in space-y-6">
      
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

      {/* 3. VIEW TOGGLE BUTTONS */}
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

      {/* 4. CONTENT AREA */}
      
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
                                  // Use REAL match for status checks, User match for teams
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
                  return (
                      <div key={round} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="bg-[#0f2545] px-4 py-2 border-b border-slate-700">
                              <span className="text-white text-xs font-black uppercase tracking-widest">{round}</span>
                          </div>
                          
                          <div className="p-3">
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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