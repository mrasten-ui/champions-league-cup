import React, { useMemo } from 'react';
import { Match, Team, Prediction, Translation } from '../types';
import { Trophy, Minus } from 'lucide-react';

interface KnockoutTreeViewProps {
  matches: Match[];
  teams: Record<string, Team>;
  userPredictions: Prediction[];
  onUpdate: (id: string, h: number, a: number) => void;
  lang: Translation;
}

export const KnockoutTreeView: React.FC<KnockoutTreeViewProps> = ({ 
  matches, teams, userPredictions, onUpdate, lang 
}) => {

  // Helper: Find the team that advances to this slot
  // This is the critical fix for "missing names".
  const getTeamForMatchNode = (matchId: string, side: 'home' | 'away'): Team | null => {
      const match = matches.find(m => m.id === matchId);
      if (!match) return null;

      const teamId = side === 'home' ? match.homeTeamId : match.awayTeamId;

      // 1. If it's a real team ID (not TBD/Winner of), return it
      if (teamId && !teamId.startsWith('TBD') && !teamId.startsWith('W_') && teams[teamId]) {
          return teams[teamId];
      }

      // 2. If it's "Winner of match X", find match X
      // (This requires knowing the bracket structure mapping match IDs to previous match IDs)
      // Since we don't have a direct graph, we rely on the `applyPredictionsToBracket` logic 
      // in `App.tsx` which should have already populated `homeTeamId`/`awayTeamId` 
      // based on previous round predictions.
      
      // If `homeTeamId` is still TBD, it means the previous round prediction is missing.
      return null;
  };

  const getPrediction = (matchId: string) => userPredictions.find(p => p.matchId === matchId);

  const handlePick = (match: Match, side: 'home' | 'away') => {
      // Simple logic: 1-0 win for the selected side
      if (side === 'home') onUpdate(match.id, 1, 0);
      else onUpdate(match.id, 0, 1);
  };

  const renderMatchNode = (matchId: string) => {
      const match = matches.find(m => m.id === matchId);
      if (!match) return null;

      const home = teams[match.homeTeamId];
      const away = teams[match.awayTeamId];
      const pred = getPrediction(match.id);
      
      const homeWinner = pred ? pred.home > pred.away : false;
      const awayWinner = pred ? pred.away > pred.home : false;

      return (
          <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden w-48 sm:w-56 mb-4 relative transition-all hover:shadow-md hover:border-blue-300">
              {/* Connector Line Logic would go here in a full SVG tree, 
                  but for this component we focus on the node card itself */}
              
              <div className="flex flex-col">
                  {/* Home Team Row */}
                  <div 
                      onClick={() => home && handlePick(match, 'home')}
                      className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${homeWinner ? 'bg-green-50' : 'hover:bg-slate-50'}`}
                  >
                      <div className="flex items-center gap-2 overflow-hidden">
                          {home ? (
                              <img src={home.flag} className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200"></div>
                          )}
                          <span className={`text-xs font-bold truncate ${home ? 'text-slate-800' : 'text-slate-400'}`}>
                              {home ? home.name : 'TBD'}
                          </span>
                      </div>
                      {homeWinner && <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></div>}
                  </div>

                  <div className="h-px bg-slate-100 mx-2"></div>

                  {/* Away Team Row */}
                  <div 
                      onClick={() => away && handlePick(match, 'away')}
                      className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${awayWinner ? 'bg-green-50' : 'hover:bg-slate-50'}`}
                  >
                      <div className="flex items-center gap-2 overflow-hidden">
                          {away ? (
                              <img src={away.flag} className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200"></div>
                          )}
                          <span className={`text-xs font-bold truncate ${away ? 'text-slate-800' : 'text-slate-400'}`}>
                              {away ? away.name : 'TBD'}
                          </span>
                      </div>
                      {awayWinner && <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></div>}
                  </div>
              </div>
          </div>
      );
  };

  // Group by Rounds for the Visual Tree
  // (Assuming standard 32-team structure for display rows)
  const rounds = [
      { id: 'R32', matches: matches.filter(m => m.round === 'R32') },
      { id: 'R16', matches: matches.filter(m => m.round === 'R16') },
      { id: 'QF', matches: matches.filter(m => m.round === 'QF') },
      { id: 'SF', matches: matches.filter(m => m.round === 'SF') },
      { id: 'FIN', matches: matches.filter(m => m.round === 'FIN') },
  ];

  return (
    <div className="overflow-x-auto pb-8 custom-scrollbar bg-slate-50 rounded-2xl p-4 border border-slate-200">
        <div className="min-w-[1000px] flex justify-between gap-8">
            {rounds.map((round, rIdx) => (
                <div key={round.id} className="flex flex-col justify-around">
                    <div className="text-center mb-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                            {round.id === 'FIN' ? 'Final' : round.id}
                        </span>
                    </div>
                    <div className="flex flex-col justify-around h-full gap-4">
                        {round.matches.map(m => (
                            <div key={m.id} className="relative flex items-center">
                                {renderMatchNode(m.id)}
                                {/* Simple connector line visual could be added here */}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};