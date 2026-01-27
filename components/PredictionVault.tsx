import React, { useState, useMemo } from 'react';
import { Match, Team, Prediction, Translation } from '../types';
import { Search, Check, X, Minus, History } from 'lucide-react';
import { calculatePoints } from '../services/engine';

interface PredictionVaultProps {
  matches: Match[];
  teams: Record<string, Team>;
  predictions: Prediction[];
  lang: Translation;
  hasTakenSecondChance: boolean;
}

export const PredictionVault: React.FC<PredictionVaultProps> = ({
  matches, teams, predictions, lang, hasTakenSecondChance
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Get finished matches with predictions
  const logs = useMemo(() => {
      return matches
        .filter(m => ['FT', 'FINISHED', 'AET', 'PEN'].includes(m.status) && m.homeScore !== null && m.awayScore !== null)
        .map(match => {
            const pred = predictions.find(p => p.matchId === match.id);
            const home = teams[match.homeTeamId];
            const away = teams[match.awayTeamId];
            
            if (!home || !away) return null;

            const pts = pred 
                ? calculatePoints(pred.home, pred.away, match.homeScore, match.awayScore, hasTakenSecondChance, match.round) 
                : 0;

            return { match, home, away, pred, pts };
        })
        .filter(item => item !== null)
        .sort((a, b) => new Date(b!.match.date).getTime() - new Date(a!.match.date).getTime());
  }, [matches, predictions, teams, hasTakenSecondChance]);

  const filteredLogs = logs.filter(item => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return item!.home.name.toLowerCase().includes(term) || item!.away.name.toLowerCase().includes(term);
  });

  if (logs.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <History size={16} className="text-slate-400" />
                <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">Prediction Log</h3>
            </div>
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder={lang.searchVault || "Search..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold w-full sm:w-48 focus:outline-none focus:border-blue-500"
                />
            </div>
        </div>

        <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <div>Match</div>
                <div className="text-center w-16">Result</div>
                <div className="text-center w-16">Pick</div>
                <div className="text-right w-12">Pts</div>
            </div>
            
            {filteredLogs.map((item) => {
                if (!item) return null;
                const { match, home, away, pred, pts } = item;
                const isExact = pred && pred.home === match.homeScore && pred.away === match.awayScore;
                
                return (
                    <div key={match.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-3 items-center hover:bg-slate-50/50 transition-colors">
                        {/* Match */}
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-700 truncate">{home.name}</span>
                                    <span className="text-[10px] text-slate-400">v</span>
                                    <span className="font-bold text-xs text-slate-700 truncate">{away.name}</span>
                                </div>
                                <div className="text-[9px] text-slate-400">{match.round || 'Group'}</div>
                            </div>
                        </div>

                        {/* Result */}
                        <div className="w-16 flex justify-center">
                            <span className="font-mono font-black text-xs text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                                {match.homeScore}-{match.awayScore}
                            </span>
                        </div>

                        {/* Pick */}
                        <div className="w-16 flex justify-center">
                            {pred ? (
                                <span className={`font-mono font-bold text-xs px-1.5 py-0.5 rounded border ${isExact ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                                    {pred.home}-{pred.away}
                                </span>
                            ) : (
                                <span className="text-xs text-slate-300">-</span>
                            )}
                        </div>

                        {/* Points */}
                        <div className="w-12 flex justify-end items-center gap-1">
                            <span className={`font-black text-sm ${pts > 0 ? 'text-green-600' : 'text-slate-300'}`}>
                                {pts > 0 ? `+${pts}` : '0'}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
        
        {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase">No results found</div>
        )}
    </div>
  );
};