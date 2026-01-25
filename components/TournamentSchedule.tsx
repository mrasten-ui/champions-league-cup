import React, { useState, useMemo } from 'react';
import { Match, Team, Translation, Prediction, UserProfile } from '../types';
import { Calendar, MapPin, Clock, Search, Trophy, Activity } from 'lucide-react';
import { DateRibbon } from './DateRibbon';

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

  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    matches.forEach(m => {
        if (m.date && m.date !== 'TBD') {
            dates.add(new Date(m.date).toDateString());
        }
    });
    return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [matches]);

  const filteredMatches = useMemo(() => {
      return matches.filter(m => {
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

  // Identify the Hero Match: First LIVE match, or the first UPCOMING match
  const heroMatch = useMemo(() => {
    if (searchTerm || filterDate !== 'ALL') return null;
    const live = matches.find(m => m.status === 'LIVE');
    if (live) return live;
    return matches.find(m => m.status === 'UPCOMING' && m.date !== 'TBD');
  }, [matches, searchTerm, filterDate]);

  const formatDate = (dateStr: string) => {
      if (!dateStr || dateStr === 'TBD') return 'TBD';
      return new Date(dateStr).toLocaleDateString(currentLang === 'NO' ? 'nb-NO' : 'en-GB', {
          weekday: 'short', month: 'short', day: 'numeric'
      });
  };

  const formatTime = (dateStr: string) => {
      if (!dateStr || dateStr === 'TBD') return '';
      return new Date(dateStr).toLocaleTimeString(currentLang === 'NO' ? 'nb-NO' : 'en-GB', {
          hour: '2-digit', minute: '2-digit'
      });
  };

  const renderMatchCard = (match: Match, isHero = false) => {
    const home = teams[match.homeTeamId];
    const away = teams[match.awayTeamId];
    const homeName = home ? home.name : (match.homeTeamId === 'TBD' ? 'TBD' : match.homeTeamId);
    const awayName = away ? away.name : (match.awayTeamId === 'TBD' ? 'TBD' : match.awayTeamId);
    const prediction = userPredictions.find(p => p.matchId === match.id);

    return (
        <div key={match.id} className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all ${isHero ? 'ring-2 ring-blue-500 shadow-lg mb-6' : 'hover:shadow-md'}`}>
            {/* Header */}
            <div className={`${isHero ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'} px-3 py-2 border-b border-slate-100 flex justify-between items-center`}>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                    {match.status === 'LIVE' ? <Activity size={12} className="animate-pulse" /> : <Calendar size={12} />}
                    <span>{match.status === 'LIVE' ? (lang.live || "LIVE") : formatDate(match.date)}</span>
                    <span className={isHero ? 'opacity-50' : 'text-slate-300'}>|</span>
                    <Clock size={12} />
                    <span>{formatTime(match.date)}</span>
                </div>
                {isHero && <span className="text-[9px] font-black bg-white text-blue-600 px-2 py-0.5 rounded-full">FEATURED</span>}
            </div>

            {/* Teams Grid */}
            <div className={`p-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4 ${isHero ? 'bg-gradient-to-b from-blue-50/30 to-white' : ''}`}>
                <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => home && onTeamClick(home.id)}>
                    <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-100">
                        {home?.flag && <img src={home.flag} alt={homeName} className="w-full h-full object-cover" />}
                    </div>
                    <span className="text-xs font-black text-slate-800 text-center leading-tight">{homeName}</span>
                </div>

                <div className="flex flex-col items-center">
                    {match.status === 'FINISHED' || match.status === 'FT' || match.status === 'LIVE' ? (
                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-lg font-black tracking-tighter shadow-inner">
                            {match.homeScore ?? 0} - {match.awayScore ?? 0}
                        </div>
                    ) : (
                        <div className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                            VS
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => away && onTeamClick(away.id)}>
                    <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-100">
                        {away?.flag && <img src={away.flag} alt={awayName} className="w-full h-full object-cover" />}
                    </div>
                    <span className="text-xs font-black text-slate-800 text-center leading-tight">{awayName}</span>
                </div>
            </div>

            {prediction && (
                <div className="px-3 py-2 bg-blue-50 border-t border-blue-100 flex justify-between items-center">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{lang.myPick || "My Prediction"}</span>
                    <span className="text-xs font-bold text-blue-800">{prediction.home} - {prediction.away}</span>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="pb-20 animate-fade-in bg-slate-50 min-h-screen">
        <DateRibbon 
            dates={uniqueDates} 
            selectedDate={filterDate} 
            onDateSelect={setFilterDate} 
            lang={lang} 
        />
        
        <div className="p-4">
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder={lang.searchNation || "Search nations or venues..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Render Hero Match if visible */}
            {heroMatch && !searchTerm && filterDate === 'ALL' && (
                <>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Featured Match</h3>
                    {renderMatchCard(heroMatch, true)}
                </>
            )}

            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                {filterDate === 'ALL' ? 'Full Schedule' : 'Matches for ' + formatDate(filterDate)}
            </h3>

            <div className="space-y-4">
                {filteredMatches.length > 0 ? (
                    filteredMatches
                        .filter(m => m.id !== heroMatch?.id || searchTerm !== '' || filterDate !== 'ALL')
                        .map(match => renderMatchCard(match))
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                        <Calendar size={40} className="mx-auto mb-4 text-slate-200" />
                        <div className="text-xs font-black uppercase tracking-widest text-slate-400">{lang.noMatches || "No matches found"}</div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};