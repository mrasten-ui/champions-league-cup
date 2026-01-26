import React from 'react';
import { Match, Team, Translation, Prediction } from '../types';
import { MatchCard } from './MatchCard';

interface KnockoutTreeViewProps {
  matches: Match[];
  teams: Record<string, Team>;
  userPredictions: Prediction[];
  onUpdate: (id: string, h: number, a: number) => void;
  lang: Translation;
  highlightedMatchId?: string | null; // NEW PROP: Trigger the yellow flash
}

export const KnockoutTreeView: React.FC<KnockoutTreeViewProps> = ({ 
  matches, teams, userPredictions, onUpdate, lang, highlightedMatchId 
}) => {
  
  const rounds = ['R16', 'QF', 'SF', 'FIN'];
  
  // Render a specific round column
  const renderRound = (round: string, count: number) => {
      // Get matches for this round, sorted by ID order (e.g. R16_1, R16_2...)
      // This sorting is critical for the tree lines to line up visually
      const roundMatches = matches
          .filter(m => m.round === round)
          .sort((a, b) => {
              const numA = parseInt(a.id.split('_')[1] || '0');
              const numB = parseInt(b.id.split('_')[1] || '0');
              return numA - numB;
          });

      return (
          <div className="flex flex-col justify-around gap-4 min-w-[20rem] px-2">
              {/* Sticky Header for the Round Name */}
              <h3 className="text-center text-xs font-black uppercase text-slate-400 tracking-widest mb-4 sticky top-0 bg-slate-50 py-2 z-10 border-b border-slate-200">
                  {round === 'FIN' ? (lang.final || 'Final') : round}
              </h3>
              
              {roundMatches.map(match => {
                  const home = teams[match.homeTeamId];
                  const away = teams[match.awayTeamId];
                  
                  // Check if this match is the one being jumped to
                  const isHighlighted = highlightedMatchId === match.id;

                  return (
                      <div 
                        key={match.id} 
                        id={`bracket-match-${match.id}`} // CRITICAL: Used by App.tsx to scroll to this element
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
                              showStatusBadge={false} // Keep bracket clean without countdown badges
                          />
                          
                          {/* Visual Connector Logic (Optional visual lines) */}
                          {/* Horizontal line to the right (except Final) */}
                          {round !== 'FIN' && (
                              <div className="absolute -right-4 top-1/2 w-4 h-0.5 bg-slate-200 hidden md:block" />
                          )}
                          {/* Horizontal line from the left (except R16) */}
                          {round !== 'R16' && (
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
            {renderRound('R16', 8)}
            {renderRound('QF', 4)}
            {renderRound('SF', 2)}
            {renderRound('FIN', 1)}
        </div>
    </div>
  );
};