import React, { useState, useMemo } from 'react';
import { Match, Team, Translation, Prediction, UserProfile, LanguageCode } from '../types';
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

// MAPPING: Language Code -> Team ID (You may need to adjust IDs based on your data)
const LANG_TEAM_MAP: Record<string, string> = {
    'NO': 'Norway',
    'SCO': 'Scotland',
    'US': 'USA',
    'EN': 'England' 
};

// OTHER SUPPORTED TEAMS (For Step 3)
const PRIORITY_TEAMS = ['Norway', 'Scotland', 'USA', 'England'];

export const TournamentSchedule: React.FC<TournamentScheduleProps> = ({ 
  matches, teams, userPredictions, user, lang, currentLang, onTeamClick 
}) => {
  // 1. SMART DEFAULT: Check if today has matches
  const [filterDate, setFilterDate] = useState<string>(() => {
      const todayStr = new Date().toDateString();
      const hasMatchesToday = matches.some(m => m.date && new Date(m.date).toDateString() === todayStr);
      return hasMatchesToday ? todayStr : 'ALL';
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  // 2. Extract unique dates
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    matches.forEach(m => {
        if (m.date && m.date !== 'TBD') {
            dates.add(new Date(m.date).toDateString());
        }
    });
    return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [matches]);

  // 3. FILTERING LOGIC (The pool of matches to choose from)
  const filteredMatches = useMemo(() => {
      return matches.filter(m => {
          const home = teams[m.homeTeamId] || { name: 'TBD' };
          const away = teams[m.awayTeamId] || { name: 'TBD' };
          
          const dateMatch = filterDate === 'ALL' || (m.date && new Date(m.date).toDateString() === filterDate);
          const searchMatch = searchTerm === '' || 
              home.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              away.name.toLowerCase().includes(searchTerm.toLowerCase());
              
          return dateMatch && searchMatch;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [matches, teams, filterDate, searchTerm]);

  // 4. "MATCH OF THE DAY" SELECTION LOGIC
  const heroMatch = useMemo(() => {
    // If user is searching, don't show a hero
    if (searchTerm) return null;

    // If "ALL" is selected, default to the most relevant LIVE or UPCOMING match globally
    if (filterDate === 'ALL') {
        return matches.find(m => ['LIVE', '1H', '2H', 'HT', 'ET', 'PEN'].includes(m.status)) ||
               matches.find(m => m.status === 'UPCOMING' && m.date !== 'TBD');
    }

    // --- ALGORITHM FOR SPECIFIC DAY ---
    const daysMatches = filteredMatches;
    if (daysMatches.length === 0) return null;

    // RULE 2: Check User's Language Team
    const myTeamId = LANG_TEAM_MAP[currentLang];
    const myMatch = daysMatches.find(m => m.homeTeamId === myTeamId || m.awayTeamId === myTeamId);
    if (myMatch) return myMatch;

    // RULE 3: Check Other Supported Languages
    const priorityMatch = daysMatches.find(m => 
        PRIORITY_TEAMS.includes(m.homeTeamId) || PRIORITY_TEAMS.includes(m.awayTeamId)
    );
    if (priorityMatch) return priorityMatch;

    // RULE 4: Check Top 10 FIFA Rank
    const top10Match = daysMatches.find(m => {
        const homeRank = teams[m.homeTeamId]?.rank || 100;
        const awayRank = teams[m.awayTeamId]?.rank || 100;
        return homeRank <= 10 || awayRank <= 10;
    });
    if (top10Match) return top10Match;

    // RULE 5: Lowest Combined Ranking (The "Biggest" Game)
    // We sort the remaining matches by combined rank and take the first one.
    const sortedByRank = [...daysMatches].sort((a, b) => {
        const rankA = (teams[a.homeTeamId]?.rank || 50) + (teams[a.awayTeamId]?.rank || 50);
        const rankB = (teams[b.homeTeamId]?.rank || 50) + (teams[b.awayTeamId]?.rank || 50);
        return rankA - rankB; // Ascending (lower is better)
    });

    return sortedByRank[0];

  }, [matches, filteredMatches, teams, currentLang, filterDate, searchTerm]);

  // Get Context for Hero
  const heroStandings = useMemo(() => {
    if (!heroMatch?.groupId) return undefined;
    return calculateGroupStandings(heroMatch.groupId, matches, teams);
  }, [heroMatch, matches, teams]);

  // Helper for Date Headlines
  const getDateHeadline = (dateStr: string) => {
      if (dateStr === 'ALL') return lang.subnavSchedule || 'Schedule';
      const dateObj = new Date(dateStr);
      const today = new Date();
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

      if (dateObj.toDateString() === today.toDateString()) return lang.today || "Today";
      if (dateObj.toDateString() === tomorrow.toDateString()) return lang.tomorrow || "Tomorrow";
      if (dateObj.toDateString() === yesterday.toDateString()) return lang.yesterday || "Yesterday";

      return dateObj.toLocaleDateString(currentLang === 'NO' ? 'no-NO' : 'en-GB', { 
          weekday: 'long', month: 'long', day: 'numeric' 
      });
  };

  return (
    <div className="pb-24 animate-fade-in bg-slate-50 min-h-screen">
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

            {/* MATCH OF THE DAY HERO */}
            {heroMatch && !searchTerm && (
                <MatchdayHero 
                    match={heroMatch} 
                    teams={teams} 
                    groupStandings={heroStandings} 
                    lang={lang}
                    onTeamClick={onTeamClick}
                />
            )}

            {/* List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                        {getDateHeadline(filterDate)}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                        {filteredMatches.length} Matches
                    </span>
                </div>

                {filteredMatches.length > 0 ? (
                    filteredMatches.map(match => {
                        // Don't repeat the Hero match in the list if we are looking at a specific day
                        if (filterDate !== 'ALL' && match.id === heroMatch?.id) return null;

                        const isHighStakes = !match.groupId && match.round !== 'R32';
                        const readOnlyMatch = { ...match, isLocked: true };

                        return (
                            <div key={match.id} className="relative">
                                <MatchCard 
                                    match={readOnlyMatch}
                                    homeTeam={teams[match.homeTeamId]}
                                    awayTeam={teams[match.awayTeamId]}
                                    onUpdate={() => {}} 
                                    lang={lang}
                                    locale={currentLang}
                                    userTokens={0}
                                    rivals={[]}
                                    onSpy={() => {}}
                                    revealedRivals={[]}
                                    currentUser={user}
                                    allPredictions={[]}
                                    phase={'LIVE'}
                                    isAdminMode={false}
                                    onTeamClick={onTeamClick}
                                    showStatusBadge={true} 
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