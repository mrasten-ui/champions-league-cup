import React from 'react';
import { Match, Team, Translation, Prediction } from '../types';
import { MatchCard } from './MatchCard';

interface KnockoutTreeViewProps {
  matches: Match[];
  teams: Record<string, Team>;
  userPredictions: Prediction[];
  onUpdate: (id: string, h: number, a: number) => void;
  lang: Translation;
  highlightedMatchId?: string | null; // Trigger the yellow flash
}

export const KnockoutTreeView: React.FC<KnockoutTreeViewProps> = ({ 
  matches, teams, userPredictions, onUpdate, lang, highlightedMatchId 
}) => {
  
  // 1. UPDATED ORDER: Added R32 at the start, 3RD before FIN
  const rounds = ['R32', 'R16', 'QF', 'SF', '3RD', 'FIN'];
  
  // 2. HELPER: Full Round Names
  const getRoundTitle = (round: string) => {
      const map: Record<string, string> = {
          'R32': lang.roundOf32 || 'Round of 32',
          'R16': lang.roundOf16 || 'Round of 16',
          'QF': lang.quarterFinal || 'Quarter Final',
          'SF': lang.semiFinal || 'Semi Final',
          '3RD': lang.thirdPlace || '3rd Place',
          'FIN': lang.final || 'Final'
      };
      return map[round] || round;
  };
  
  // Render a specific round column
  const renderRound = (round: string) => {
      // Get matches for this round, sorted by ID order (e.g. R16_1, R16_2...)
      // This sorting is critical for the visual tree lines
      const roundMatches = matches
          .filter(m => m.round === round)
          .sort((a, b) => {
              const numA = parseInt(a.id.split('_')[1] || '0');
              const numB = parseInt(b.id.split('_')[1] || '0');
              return numA - numB;
          });

      // If specific round has no matches yet, don't render empty column
      if (roundMatches.length === 0) return null;

      return (
          <div key={round} className="flex flex-col justify-around gap-4 min-w-[20rem] px-2">
              {/* Sticky Header with Full Name */}
              <h3 className="text-center text-xs font-black uppercase text-slate-400 tracking-widest mb-4 sticky top-0 bg-slate-50 py-2 z-10 border-b border-slate-200 shadow-sm">
                  {getRoundTitle(round)}
              </h3>
              
              {roundMatches.map(match => {
                  const home = teams[match.homeTeamId];
                  const away = teams[match.awayTeamId];
                  
                  // Check if this match is the one being jumped to
                  const isHighlighted = highlightedMatchId === match.id;

                  return (
                      <div 
                        key={match.id} 
                        id={`bracket-match-${match.id}`} // Used for auto-scroll
                        className={`
                            relative transition-all duration-1000 ease-in-out
                            ${isHighlighted 
                                ? 'scale-105 z-30 shadow-[0_0_40px_rgba(250,204,21,0.8)] ring-4 ring-yellow-400 rounded-2xl bg-white' 
                                : 'scale-100 z-0 hover:z-10'
                            }
                        `}
                      >
                          <MatchCard 
                              match={match}
                              homeTeam={home}
                              awayTeam={away}
                              onUpdate={onUpdate}
                              lang={lang}
                              locale="en-GB"
                              userTokens={0}
                              rivals={[]}
                              onSpy={() => {}}
                              revealedRivals={[]}
                              currentUser={null}
                              allPredictions={userPredictions}
                              phase="LIVE"
                              isAdminMode={false}
                              showStatusBadge={false} 
                          />
                          
                          {/* --- Visual Connector Lines --- */}
                          
                          {/* 1. RIGHT LINE (Connects to next round) 
                              Hide for:
                              - FIN (End)
                              - 3RD (End)
                              - SF (Because the next col is 3RD, we don't want a line pointing to it)
                          */}
                          {round !== 'FIN' && round !== '3RD' && round !== 'SF' && (
                              <div className="absolute -right-4 top-1/2 w-4 h-0.5 bg-slate-200 hidden md:block" />
                          )}
                          
                          {/* 2. LEFT LINE (Connects from prev round) 
                              Hide for:
                              - R32 (Start)
                              - 3RD (Detached)
                              - FIN (Detached visually because 3RD is in the way)
                              - R16 (Only if R32 doesn't exist, but here we assume flow is contiguous)
                          */}
                          {round !== 'R32' && round !== '3RD' && round !== 'FIN' && (
                              <div className="absolute -left-4 top-1/2 w-4 h-0.5 bg-slate-200 hidden md:block" />
                          )}
                      </div>
                  );
              })}
          </div>
      );
  };

  return (
    <div className="overflow-x-auto pb-12 pt-4 hide-scrollbar cursor-grab active:cursor-grabbing snap-x">
        <div className="flex gap-8 px-4 min-w-max">
            {rounds.map(round => renderRound(round))}
        </div>
    </div>
  );
};