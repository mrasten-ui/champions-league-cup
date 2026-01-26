import React, { useState, useMemo } from 'react';
import { Match, Team, Translation, Prediction, UserProfile } from '../types';
import { Search, AlertTriangle, CalendarDays } from 'lucide-react';
import { MatchCard } from './MatchCard';
import { DateRibbon } from './DateRibbon';
import { MatchdayHero } from './MatchdayHero';
import { calculateGroupStandings } from '../services/engine';

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

  // 1. Extract unique dates from the actual schedule
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    matches.forEach(m => {
        if (m.date && m.date !== 'TBD') {
            dates.add(new Date(m.date).toDateString());
        }
    });
    return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [matches]);

  // 2. Identify a "Hero Match" (Live or High Profile Upcoming)
  const heroMatch = useMemo(() => {
    return matches.find(m => ['LIVE', '1H', '2H', 'HT', 'ET', 'PEN'].includes(m.status)) ||
           matches.find(m => m.status === 'UPCOMING' && m.date !== 'TBD');
  }, [matches]);

  // 3. Get context for the Hero Match (e.g. Group Table)
  const heroStandings = useMemo(() => {
    if (!heroMatch?.groupId) return undefined;
    return calculateGroupStandings(heroMatch.groupId, matches, teams);
  }, [heroMatch, matches, teams]);

  // 4. Filter matches based on user selection
  const filteredMatches = useMemo(() => {
      return matches.filter(m => {
          const home = teams[m.homeTeamId] || { name: 'TBD' };
          const away = teams[m.awayTeamId] || { name: 'TBD' };
          
          // Date Filter
          const dateMatch = filterDate === 'ALL' || (m.date && new Date(m.date).toDateString() === filterDate);
          
          // Search Filter
          const searchMatch = searchTerm === '' || 
              home.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              away.name.toLowerCase().includes(searchTerm.toLowerCase());
              
          return dateMatch && searchMatch;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [matches, teams, filterDate, searchTerm]);

  return (
    <div className="pb-24 animate-fade-in bg-slate-50 min-h-screen">
        {/* Date Navigation */}
        <DateRibbon 
            dates={uniqueDates} 
            selectedDate={filterDate} 
            onDateSelect={setFilterDate} 
            lang={lang} 
        />
        
        <div className="p-4 max-w-2xl mx-auto">
            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder={lang.searchNation || "Search fixtures..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Matchday Hero - Contextual Header */}
            {heroMatch && filterDate === 'ALL' && !searchTerm && (
                <MatchdayHero 
                    match={heroMatch} 
                    teams={teams} 
                    groupStandings={heroStandings} 
                    lang={lang}
                    onTeamClick={onTeamClick}
                />
            )}

            {/* Fixture List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {filterDate === 'ALL' 
                            ? (lang.subnavSchedule || 'Schedule') 
                            : new Date(filterDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
                        }
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                        {filteredMatches.length} Matches
                    </span>
                </div>

                {filteredMatches.length > 0 ? (
                    filteredMatches.map(match => {
                        const isHighStakes = !match.groupId && match.round !== 'R32';
                        return (
                            <div key={match.id} className="relative">
                                <MatchCard 
                                    match={match}
                                    homeTeam={teams[match.homeTeamId]}
                                    awayTeam={teams[match.awayTeamId]}
                                    onUpdate={() => {}} // Read-only
                                    lang={lang}
                                    locale={currentLang}
                                    userTokens={0}
                                    rivals={[]}
                                    onSpy={() => {}}
                                    revealedRivals={[]}
                                    currentUser={user}
                                    allPredictions={userPredictions}
                                    phase={'LIVE'}
                                    isAdminMode={false}
                                    onTeamClick={onTeamClick}
                                />
                                {isHighStakes && (
                                    <div className="absolute -top-2 -right-1 bg-amber-100 text-amber-700 p-1.5 rounded-full border border-amber-200 shadow-sm z-10" title="Elimination Match">
                                        <AlertTriangle size={12} />
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 opacity-50">
                        <CalendarDays size={48} className="text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matches found</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};