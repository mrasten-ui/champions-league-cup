import React from 'react';
import { Match, Team, Translation, UserProfile, Prediction, TournamentPhase, Round, MatchEvent } from '../types';
import { MatchCard } from './MatchCard';
import { Lock } from 'lucide-react';

interface KnockoutBracketProps {
  matches: Match[];
  teams: Record<string, Team>;
  onUpdate: (id: string, h: number, a: number) => void;
  lang: Translation;
  user: UserProfile;
  onSecondChance: () => void;
  rivals: UserProfile[];
  allPredictions: Prediction[];
  phase: TournamentPhase;
  isGroupStageComplete: boolean;
  firstIncompleteGroup: string | null;
  onGoToGroup: (groupId: string) => void;
  onTeamClick: (id: string) => void;
  onSpy: (id: string) => void;
  revealedRivals: string[];
  activeRound: Round;
  matchEvents?: MatchEvent[];
  allMatches?: Match[];
}

export const KnockoutBracket: React.FC<KnockoutBracketProps> = ({
  matches, teams, onUpdate, lang, user, onSecondChance, rivals, allPredictions, phase, isGroupStageComplete, firstIncompleteGroup, onGoToGroup, onTeamClick, onSpy, revealedRivals, activeRound, matchEvents = [], allMatches
}) => {
  
  // Filter matches for the active round
  const currentMatches = matches
    .filter(m => m.round === activeRound)
    .sort((a, b) => {
        // Sort by Match ID number to keep tree order (R32_1, R32_2...)
        const idA = parseInt(a.id.split('_')[1] || '0');
        const idB = parseInt(b.id.split('_')[1] || '0');
        return idA - idB;
    });

  // Locked State Logic (if Groups aren't done and no Second Chance)
  const isLockedState = !isGroupStageComplete && !user.hasTakenSecondChance && phase === 'PRE_LIVE';

  if (isLockedState) {
      return (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-slate-100 p-6 rounded-full mb-6 text-slate-300">
                  <Lock size={48} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">{lang.lockedState}</h2>
              <p className="text-slate-500 font-medium max-w-xs mb-8">
                  Complete your Group Stage predictions to unlock the Knockout Bracket.
              </p>
              {firstIncompleteGroup && (
                  <button 
                    onClick={() => onGoToGroup(firstIncompleteGroup)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                      Go to Group {firstIncompleteGroup}
                  </button>
              )}
          </div>
      );
  }

  return (
    <div className="pb-24 animate-in fade-in duration-500">
        <div className="flex flex-col gap-6">
            {currentMatches.map((match, index) => {
                const home = teams[match.homeTeamId];
                const away = teams[match.awayTeamId];

                return (
                    <div key={match.id} className="relative">
                        {/* Bracket Connector Line (Visual Flair) */}
                        <div className="absolute -left-4 top-1/2 w-4 h-0.5 bg-slate-200 hidden md:block"></div>

                        <MatchCard
                            match={match}
                            homeTeam={home}
                            awayTeam={away}
                            onUpdate={onUpdate}
                            lang={lang}
                            locale="en-GB"
                            userTokens={user.tokens}
                            rivals={rivals}
                            onSpy={onSpy}
                            revealedRivals={revealedRivals}
                            currentUser={user}
                            allPredictions={allPredictions}
                            phase={phase}
                            isAdminMode={false}
                            onTeamClick={onTeamClick}
                            showStatusBadge={false}
                            context="knockout"
                            cardId={index === 0 ? 'tour-first-knockout' : undefined}
                            events={matchEvents.filter(e => e.matchId === match.id)}
                            allMatches={allMatches ?? matches}
                            allTeams={teams}
                        />
                    </div>
                );
            })}
            
            {currentMatches.length === 0 && (
                <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest">
                    No matches scheduled for this round yet.
                </div>
            )}
        </div>
    </div>
  );
};