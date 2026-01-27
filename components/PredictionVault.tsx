import React, { useState, useMemo } from 'react';
import { Match, Team, Prediction, UserProfile, Translation } from '../types';
import { Search, Archive, CheckCircle2, XCircle, MinusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { calculatePoints } from '../services/engine';

interface PredictionVaultProps {
  matches: Match[];
  teams: Record<string, Team>;
  predictions: Prediction[];
  user: UserProfile;
  lang: Translation;
}

export const PredictionVault: React.FC<PredictionVaultProps> = ({
  matches, teams, predictions, user, lang
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter: Finished matches only (The "Archive")
  const history = useMemo(() => {
      let filtered = matches.filter(m => 
          ['FT', 'FINISHED', 'AET', 'PEN'].includes(m.status) &&
          m.homeTeamId !== 'TBD' && 
          m.awayTeamId !== 'TBD'
      );

      // Apply Search
      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          filtered = filtered.filter(m => {
              const home = teams[m.homeTeamId]?.name.toLowerCase() || '';
              const away = teams[m.awayTeamId]?.name.toLowerCase() || '';
              return home.includes(lower) || away.includes(lower);
          });
      }

      // Sort: Most recent first
      return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [matches, teams, searchTerm]);

  // Show only 5 items unless expanded
  const displayItems = isExpanded ? history : history.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-700">
                    <Archive size={18} />
                    <h3 className="text-sm font-black uppercase tracking-widest">{lang.predictionVault || "Prediction Vault"}</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {history.length} Results
                </span>
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                    type="text" 
                    placeholder={lang.searchVault || "Search team history..."}
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setIsExpanded(true); }}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 transition-all"
                />
            </div>
        </div>

        {/* Compact List */}
        <div className="divide-y divide-slate-100">
            {displayItems.length > 0 ? (
                displayItems.map(match => {
                    const home = teams[match.homeTeamId];
                    const away = teams[match.awayTeamId];
                    const pred = predictions.find(p => p.matchId === match.id);
                    
                    const actualHome = match.homeScore ?? 0;
                    const actualAway = match.awayScore ?? 0;
                    
                    let pts = 0;
                    if (pred) {
                        pts = calculatePoints(pred.home, pred.away, actualHome, actualAway, user.hasTakenSecondChance, match.round);
                    }

                    // Status Color
                    let statusColor = 'text-slate-300';
                    let Icon = MinusCircle;
                    if (pts > 0) { statusColor = 'text-yellow-500'; Icon = CheckCircle2; } // Correct Outcome
                    if (match.round ? pts >= 10 : pts === 5) { statusColor = 'text-green-500'; Icon = CheckCircle2; } // Perfect/High Pts
                    if (pts === 0 && pred) { statusColor = 'text-red-400'; Icon = XCircle; }

                    return (
                        <div key={match.id} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                            {/* Left: Match Info */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`shrink-0 w-1 ${pts > 0 ? 'bg-green-500' : 'bg-slate-200'} h-8 rounded-full`}></div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className="flex items-center gap-1">
                                            <img src={home?.flag} className="w-4 h-3 object-cover rounded shadow-sm" alt="" />
                                            <span className="text-xs font-black text-slate-700 truncate max-w-[60px] sm:max-w-[100px]">{home?.name}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">vs</span>
                                        <div className="flex items-center gap-1">
                                            <img src={away?.flag} className="w-4 h-3 object-cover rounded shadow-sm" alt="" />
                                            <span className="text-xs font-black text-slate-700 truncate max-w-[60px] sm:max-w-[100px]">{away?.name}</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium flex gap-2">
                                        <span>{match.round || 'Group'}</span>
                                        <span>•</span>
                                        <span>{new Date(match.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Middle: Scores */}
                            <div className="flex flex-col items-end gap-1 mx-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Result</span>
                                    <span className="text-xs font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 tabular-nums">
                                        {actualHome}-{actualAway}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">You</span>
                                    <span className={`text-xs font-black px-1.5 py-0.5 rounded tabular-nums border ${pred ? 'bg-white border-slate-200 text-slate-600' : 'bg-red-50 border-red-100 text-red-400'}`}>
                                        {pred ? `${pred.home}-${pred.away}` : '-'}
                                    </span>
                                </div>
                            </div>

                            {/* Right: Points */}
                            <div className="w-12 flex flex-col items-center justify-center border-l border-slate-100 pl-3">
                                <span className={`text-sm font-black ${pts > 0 ? 'text-green-600' : 'text-slate-300'}`}>+{pts}</span>
                                <Icon size={12} className={statusColor} />
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    No history found
                </div>
            )}
        </div>

        {/* Expand/Collapse Footer */}
        {history.length > 5 && !searchTerm && (
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-3 bg-slate-50 border-t border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors flex items-center justify-center gap-1"
            >
                {isExpanded ? (
                    <>Show Less <ChevronUp size={14} /></>
                ) : (
                    <>View All History ({history.length - 5} more) <ChevronDown size={14} /></>
                )}
            </button>
        )}
    </div>
  );
};