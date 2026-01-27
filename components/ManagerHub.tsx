import React, { useState, useMemo } from 'react';
import { Match, Team, Prediction, UserProfile, Translation, TournamentPhase } from '../types';
import { ResourceHeader } from './ResourceHeader';
import { SecondChancePromo } from './SecondChancePromo';
import { PredictionStamp } from './PredictionStamp';
import { SubstitutionModal } from './SubstitutionModal';
import { Trophy, LayoutGrid, AlertCircle, CalendarClock } from 'lucide-react';

interface ManagerHubProps {
  matches: Match[];        // Official schedule (Real Status/Scores/Locks)
  userMatches: Match[];    // User's predicted bracket path (Who they think is playing)
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
  matches, 
  userMatches, 
  teams, 
  allPredictions, 
  currentUser, 
  lang, 
  onSubstitute, 
  onUnlockSecondChance, 
  onUpdate, 
  phase
}) => {
  // --- STATE ---
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'groups' | 'knockout'>('groups');

  // --- DATA PREPARATION ---
  
  // 1. Get current user's predictions
  const userPredictions = useMemo(() => {
    return allPredictions.filter(p => p.userId === currentUser.email);
  }, [allPredictions, currentUser.email]);

  // 2. Organize the User's Bracket (The "Fantasy" Schedule)
  const groupedMatches = useMemo(() => {
      const groups: Record<string, Match[]> = {};
      const knockouts: Record<string, Match[]> = {
          'R32': [], 'R16': [], 'QF': [], 'SF': [], 'FIN': [], '3RD': []
      };

      // We iterate over userMatches to ensure we show the USER'S path
      userMatches.forEach(m => {
          // Skip placeholder matches that haven't been predicted/determined in the user's bracket
          if (m.homeTeamId === 'TBD' || m.awayTeamId === 'TBD') return;

          if (m.groupId) {
              if (!groups[m.groupId]) groups[m.groupId] = [];
              groups[m.groupId].push(m);
          } else if (m.round) {
              knockouts[m.round].push(m);
          }
      });

      // Sort groups A-Z and matches by date
      const sortedGroups = Object.keys(groups).sort().reduce((obj, key) => {
          obj[key] = groups[key].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return obj;
      }, {} as Record<string, Match[]>);

      return { groups: sortedGroups, knockouts };
  }, [userMatches]);

  // --- HELPERS ---

  // Get the "Real" match data for a given User Match ID
  // This is critical for knowing if the game is Locked, Live, or Finished
  const getRealMatch = (userMatchId: string) => {
      return matches.find(m => m.id === userMatchId);
  };

  // Determine if a specific match is currently actionable (Substitutable)
  const canSubMatch = (realMatch: Match | undefined) => {
      if (!realMatch) return false;
      
      // Cannot sub if game is Live or Finished
      const isLiveOrDone = ['LIVE', '1H', 'HT', '2H', 'FT', 'FINISHED', 'PEN', 'AET'].includes(realMatch.status);
      if (isLiveOrDone) return false;
      
      // Can sub if it is Locked (pre-match lock) AND we have subs available
      // Note: If it is Unlocked (e.g. user already spent a sub), they can just edit it via the modal logic
      return realMatch.isLocked; 
  };

  // Check if we have any knockout games to show
  const hasKnockouts = useMemo(() => {
      return Object.values(groupedMatches.knockouts).some(arr => arr.length > 0);
  }, [groupedMatches]);

  // Prepare the Active Match for the Modal (Merging Real status with Predicted teams)
  const activeModalMatch = useMemo(() => {
      if (!selectedMatchId) return null;
      
      // We need the User's version (for teams) AND Real version (for status/id)
      const userMatch = userMatches.find(m => m.id === selectedMatchId);
      const realMatch = matches.find(m => m.id === selectedMatchId);
      
      if (!userMatch || !realMatch) return null;

      // We pass the Real Match ID and Status, but ensure we display the Predicted Teams
      // (This handles the case where the user is predicting a hypothetical matchup)
      return {
          ...realMatch,
          homeTeamId: userMatch.homeTeamId,
          awayTeamId: userMatch.awayTeamId
      };
  }, [selectedMatchId, userMatches, matches]);

  // --- RENDER ---

  return (
    <div className="pb-24 animate-fade-in space-y-8">
      
      {/* 1. MANAGER PROFILE HEADER */}
      {/* Displays Avatar, Rank, Points, and Subs Count */}
      <ResourceHeader 
        user={currentUser} 
        lang={lang} 
        phase={phase}
        rank={99} // TODO: Pass actual rank from Leaderboard logic in App.tsx
        totalPoints={0} // TODO: Pass actual points
      />

      {/* 2. SEASON STRATEGY (Second Chance) */}
      {/* Only shown if the user hasn't used it yet */}
      <SecondChancePromo 
        hasTaken={currentUser.hasTakenSecondChance}
        onUnlock={onUnlockSecondChance}
        lang={lang}
      />

      {/* 3. VIEW TOGGLE (Groups vs Knockouts) */}
      <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex gap-2">
          <button 
            onClick={() => setViewMode('groups')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                viewMode === 'groups' 
                ? 'bg-[#0f2545] text-white shadow-md transform scale-[1.02]' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
          >
              <LayoutGrid size={16} />
              {lang.groups || "Group Stage"}
          </button>
          
          <button 
            onClick={() => setViewMode('knockout')}
            disabled={!hasKnockouts}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                viewMode === 'knockout' 
                ? 'bg-[#0f2545] text-white shadow-md transform scale-[1.02]' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            } ${!hasKnockouts ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
              <Trophy size={16} />
              {lang.knockouts || "Knockouts"}
          </button>
      </div>

      {/* 4. CONTENT GRIDS */}
      
      {/* --- A) GROUP STAGE GRID --- */}
      {viewMode === 'groups' && (
          <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
              {Object.entries(groupedMatches.groups).map(([groupId, groupMatches]) => (
                  <div key={groupId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      {/* Navy Header Strip */}
                      <div className="bg-[#0f2545] px-4 py-3 flex items-center justify-between border-b border-slate-700">
                          <div className="flex items-center gap-2">
                              <span className="text-white text-sm font-black uppercase tracking-widest">Group {groupId}</span>
                          </div>
                          <span className="text-[10px] font-bold text-blue-200 bg-white/10 px-2 py-0.5 rounded-full">
                              {groupMatches.length} Matches
                          </span>
                      </div>

                      {/* Stamps Grid */}
                      <div className="p-4 bg-slate-50/50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {groupMatches.map(userMatch => {
                                  const realMatch = getRealMatch(userMatch.id) || userMatch;
                                  
                                  // For Groups, the matchup is always Real, so we can show scores safely
                                  return (
                                      <PredictionStamp 
                                          key={userMatch.id}
                                          match={realMatch} // Contains Real Score & Status
                                          homeTeam={teams[userMatch.homeTeamId]}
                                          awayTeam={teams[userMatch.awayTeamId]}
                                          prediction={userPredictions.find(p => p.matchId === userMatch.id)}
                                          onOpenSub={() => setSelectedMatchId(userMatch.id)}
                                          canSubstitute={canSubMatch(realMatch)}
                                          userHasPenalty={currentUser.hasTakenSecondChance}
                                          lang={lang}
                                          variant="standard" // Standard = Show Scores
                                      />
                                  );
                              })}
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* --- B) KNOCKOUT GRID --- */}
      {viewMode === 'knockout' && hasKnockouts && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              {Object.entries(groupedMatches.knockouts).map(([round, roundMatches]) => {
                  if (roundMatches.length === 0) return null;
                  
                  return (
                      <div key={round} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          {/* Navy Header Strip */}
                          <div className="bg-[#0f2545] px-4 py-3 flex items-center gap-2 border-b border-slate-700">
                              <Trophy size={16} className="text-amber-400" />
                              <span className="text-sm font-black text-white uppercase tracking-widest">{round}</span>
                          </div>
                          
                          {/* Stamps Grid */}
                          <div className="p-4 bg-slate-50/50">
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                  {roundMatches.map(userMatch => {
                                      const realMatch = getRealMatch(userMatch.id);
                                      
                                      // CRITICAL LOGIC: 
                                      // Only show "Real Score" if the match actually happened as predicted.
                                      // If I predicted Brazil vs Arg, but it's France vs Ger, showing "2-0" is wrong.
                                      
                                      const isMatchupCorrect = realMatch && 
                                          realMatch.homeTeamId === userMatch.homeTeamId && 
                                          realMatch.awayTeamId === userMatch.awayTeamId;

                                      // If matchup is wrong, create a "Ghost" match object without scores
                                      // so the stamp doesn't show confusing numbers
                                      const displayMatch = isMatchupCorrect ? realMatch : { 
                                          ...userMatch, 
                                          homeScore: null, 
                                          awayScore: null,
                                          status: realMatch?.status || 'UPCOMING' // Keep status for locking logic
                                      };

                                      return (
                                          <PredictionStamp 
                                              key={userMatch.id}
                                              match={displayMatch as Match}
                                              homeTeam={teams[userMatch.homeTeamId]}
                                              awayTeam={teams[userMatch.awayTeamId]}
                                              prediction={userPredictions.find(p => p.matchId === userMatch.id)}
                                              onOpenSub={() => setSelectedMatchId(userMatch.id)}
                                              canSubstitute={canSubMatch(realMatch)} // Lock logic depends on REAL time
                                              userHasPenalty={currentUser.hasTakenSecondChance}
                                              lang={lang}
                                              variant="knockout" // Knockout = Minimal Flags, No Scores
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

      {/* --- C) EMPTY STATE --- */}
      {viewMode === 'knockout' && !hasKnockouts && (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 bg-white rounded-3xl border border-slate-200 border-dashed">
              <CalendarClock size={64} className="text-slate-300 mb-4" />
              <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest text-center">
                  Knockout Stage<br/>Not Yet Predicted
              </h3>
              <p className="text-xs font-bold text-slate-300 mt-2 max-w-xs text-center">
                  Predict the group stages first to unlock the bracket.
              </p>
          </div>
      )}

      {/* 5. SUBSTITUTION MODAL */}
      {selectedMatchId && activeModalMatch && teams[activeModalMatch.homeTeamId] && teams[activeModalMatch.awayTeamId] && (
          <SubstitutionModal 
              match={activeModalMatch}
              homeTeam={teams[activeModalMatch.homeTeamId]}
              awayTeam={teams[activeModalMatch.awayTeamId]}
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