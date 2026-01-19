import React, { useState, useMemo } from 'react';
import { Match, Team, Translation, Prediction, UserProfile } from '../types';
import { Calendar, MapPin, Clock, Search, ChevronRight, Filter } from 'lucide-react';
import { calculatePoints } from '../services/engine';

interface TournamentScheduleProps {
  matches: Match[];
  teams: Record<string, Team>;
  userPredictions: Prediction[];
  user: UserProfile | null;
  lang: Translation;
  currentLang: string;
  onTeamClick: (teamId: string) => void;
}

export const TournamentSchedule: React.FC<TournamentScheduleProps> = ({ 
  matches, teams, userPredictions, user, lang, currentLang, onTeamClick 
}) => {
  const [filterDate, setFilterDate] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Get unique dates for the filter
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    matches.forEach(m => {
        if (m.date) {
            dates.add(new Date(m.date).toDateString());
        }
    });
    return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [matches]);

  // 2. Filter Matches safely
  const filteredMatches = useMemo(() => {
      return matches.filter(m => {
          // Safety Check: Ensure team objects exist before checking names
          const home = teams[m.homeTeamId] || { name: 'TBD' };
          const away = teams[m.awayTeamId] || { name: 'TBD' };
          
          const matchesDate = filterDate === 'ALL' || (m.date && new Date(m.date).toDateString() === filterDate);
          const matchesSearch = searchTerm === '' || 
              home.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              away.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (m.venue && m.venue.toLowerCase().includes(searchTerm.toLowerCase()));

          return matchesDate && matchesSearch;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [matches, teams, filterDate, searchTerm]);

  // Helper to format date
  const formatDate = (dateStr: string) => {
      if (!dateStr) return 'TBD';
      return new Date(dateStr).toLocaleDateString(currentLang === 'NO' ? 'nb-NO' : 'en-GB', {
          weekday: 'short', month: 'short', day: 'numeric'
      });
  };

  const formatTime = (dateStr: string) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleTimeString(currentLang === 'NO' ? 'nb-NO' : 'en-GB', {
          hour: '2-digit', minute: '2-digit'
      });
  };

  return (
    <div className="pb-20 animate-fade-in">
        
        {/* FILTERS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 sticky top-0 z-20">
            <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder={lang.searchNation || "Search matches..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div className="relative">
                    <select 
                        value={filterDate} 
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="appearance-none h-full pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black uppercase tracking-widest focus:outline-none focus:border-blue-500"
                    >
                        <option value="ALL">All Dates</option>
                        {uniqueDates.map(d => (
                            <option key={d} value={d}>
                                {new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </option>
                        ))}
                    </select>
                    <Filter className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <button 
                    onClick={() => setFilterDate('ALL')}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${filterDate === 'ALL' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                    All Dates
                </button>
                {uniqueDates.map(d => {
                    const isSelected = filterDate === d;
                    const label = new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
                    return (
                        <button 
                            key={d}
                            onClick={() => setFilterDate(d)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* MATCH LIST */}
        <div className="space-y-3">
            {filteredMatches.length > 0 ? filteredMatches.map(match => {
                // SAFETY: Fallback if team ID doesn't exist in teamsData
                const home = teams[match.homeTeamId];
                const away = teams[match.awayTeamId];
                const homeName = home ? home.name : (match.homeTeamId === 'TBD' ? 'TBD' : match.homeTeamId);
                const awayName = away ? away.name : (match.awayTeamId === 'TBD' ? 'TBD' : match.awayTeamId);
                const prediction = userPredictions.find(p => p.matchId === match.id);

                return (
                    <div key={match.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        {/* Header: Date & Venue */}
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                <Calendar size={12} />
                                <span>{formatDate(match.date)}</span>
                                <span className="text-slate-300">|</span>
                                <Clock size={12} />
                                <span>{formatTime(match.date)}</span>
                            </div>
                            {match.venue && (
                                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                                    <MapPin size={10} />
                                    <span className="truncate max-w-[100px]">{match.venue}</span>
                                </div>
                            )}
                        </div>

                        {/* Teams */}
                        <div className="p-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                            {/* Home */}
                            <div 
                                className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-50 transition-colors ${!home ? 'opacity-50' : ''}`}
                                onClick={() => home && onTeamClick(home.id)}
                            >
                                <div className="w-8 h-8 rounded-full border border-slate-100 overflow-hidden shrink-0 bg-slate-100">
                                    {home?.flag && <img src={home.flag} alt={homeName} className="w-full h-full object-cover" />}
                                </div>
                                <span className="text-xs font-black text-slate-800 leading-tight truncate">{homeName}</span>
                            </div>

                            {/* Score/Time */}
                            <div className="flex flex-col items-center justify-center min-w-[60px]">
                                {match.status === 'FINISHED' || match.status === 'FT' ? (
                                    <div className="bg-slate-800 text-white px-2 py-1 rounded text-sm font-black tracking-widest">
                                        {match.homeScore}-{match.awayScore}
                                    </div>
                                ) : (
                                    <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                        VS
                                    </div>
                                )}
                            </div>

                            {/* Away */}
                            <div 
                                className={`flex items-center gap-2 justify-end cursor-pointer p-1 rounded hover:bg-slate-50 transition-colors ${!away ? 'opacity-50' : ''}`}
                                onClick={() => away && onTeamClick(away.id)}
                            >
                                <span className="text-xs font-black text-slate-800 leading-tight truncate text-right">{awayName}</span>
                                <div className="w-8 h-8 rounded-full border border-slate-100 overflow-hidden shrink-0 bg-slate-100">
                                    {away?.flag && <img src={away.flag} alt={awayName} className="w-full h-full object-cover" />}
                                </div>
                            </div>
                        </div>

                        {/* Footer: Prediction */}
                        {prediction && (
                            <div className="px-3 py-2 bg-blue-50 border-t border-blue-100 flex justify-between items-center">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{lang.myPick || "My Prediction"}</span>
                                <span className="text-xs font-bold text-blue-800">{prediction.home} - {prediction.away}</span>
                            </div>
                        )}
                    </div>
                );
            }) : (
                <div className="text-center py-12 opacity-50">
                    <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
                    <div className="text-sm font-black uppercase tracking-widest text-slate-400">No matches found</div>
                </div>
            )}
        </div>
    </div>
  );
};