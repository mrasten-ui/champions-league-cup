import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import { Match, Team, Translation, Prediction, UserProfile, MatchEvent, MatchLineup, MatchStats } from '../types';
import { Search, AlertTriangle, CalendarDays } from 'lucide-react';
import { MatchCard } from './MatchCard';
import { DateRibbon } from './DateRibbon';
import { MatchdayHero } from './MatchdayHero';
import { calculateGroupStandings, getAllGroupStandings } from '../services/engine';
import { utcDay } from '../utils/date';

interface TournamentScheduleProps {
  matches: Match[];
  teams: Record<string, Team>;
  userPredictions: Prediction[];
  user: UserProfile | null;
  lang: Translation;
  currentLang: string;
  onTeamClick: (teamId: string) => void;
  onJumpToTable?: (groupId: string, teamId: string) => void;
  onJumpToBracket?: (matchId: string) => void;
  jumpToMatchId?: string;
  matchEvents?: MatchEvent[];
  matchLineups?: MatchLineup[];
  matchStats?: MatchStats[];
  onSubstitute?: (matchId: string) => void;
  onUpdate?: (id: string, h: number, a: number) => void;
}

// MAPPING: Language Code -> Team ID (must match homeTeamId/awayTeamId in match data)
const LANG_TEAM_MAP: Record<string, string> = {
    'NO': 'NOR',
    'SCO': 'SCO',
    'US': 'USA',
    'EN': 'ENG',
};

// LOCALE MAPPING: Ensure correct time formatting (24h vs 12h)
const LOCALE_MAP: Record<string, string> = {
    'EN': 'en-GB', // Force UK time (24h + BST)
    'SCO': 'en-GB',
    'NO': 'no-NO', // Norway (24h + CET)
    'US': 'en-US'  // US (12h - but we override to 24h via options)
};

// OTHER SUPPORTED TEAMS (Priority Tier 2)
const PRIORITY_TEAMS = ['Norway', 'Scotland', 'USA', 'England'];


export const TournamentSchedule: React.FC<TournamentScheduleProps> = ({
  matches, teams, userPredictions, user, lang, currentLang, onTeamClick, onJumpToTable, onJumpToBracket, jumpToMatchId, matchEvents = [], matchLineups = [], matchStats = [], onSubstitute, onUpdate
}) => {

  // Get the correct BCP 47 locale string
  const activeLocale = LOCALE_MAP[currentLang] || 'en-GB';

  // 1. SMART DEFAULT: Check if today has matches.
  // If NOT, find the next available day with matches.
  const [filterDate, setFilterDate] = useState<string>(() => {
      const now = new Date();
      const today = utcDay(now);

      const hasMatchesToday = matches.some(m => m.date && m.date !== 'TBD' && utcDay(m.date) === today);
      if (hasMatchesToday) return today;

      // Fallback: Find closest future match
      const nextMatch = matches
        .filter(m => m.date && m.date !== 'TBD' && new Date(m.date) > now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      if (nextMatch) return utcDay(nextMatch.date);

      return 'ALL';
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!jumpToMatchId) return;
    const match = matches.find(m => m.id === jumpToMatchId);
    if (match?.date) {
      setFilterDate(utcDay(match.date));
      setTimeout(() => {
        const el = document.getElementById(`schedule-match-${jumpToMatchId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [jumpToMatchId]);

  // 2. Extract unique dates for the Ribbon (UTC "YYYY-MM-DD" keys)
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    matches.forEach(m => {
        if (m.date && m.date !== 'TBD') dates.add(utcDay(m.date));
    });
    return Array.from(dates).sort();
  }, [matches]);

  const handleNextDate = useCallback(() => {
    const idx = uniqueDates.indexOf(filterDate);
    if (idx < uniqueDates.length - 1) setFilterDate(uniqueDates[idx + 1]);
  }, [uniqueDates, filterDate]);

  const handlePrevDate = useCallback(() => {
    const idx = uniqueDates.indexOf(filterDate);
    if (idx > 0) setFilterDate(uniqueDates[idx - 1]);
  }, [uniqueDates, filterDate]);

  const dateSwipe = useSwipe({ onSwipeLeft: handleNextDate, onSwipeRight: handlePrevDate, stopPropagation: true });

  // 3. FILTERING LOGIC (For the list below the hero)
  const filteredMatches = useMemo(() => {
      return matches.filter(m => {
          const home = teams[m.homeTeamId] || { name: 'TBD' };
          const away = teams[m.awayTeamId] || { name: 'TBD' };
          
          const dateMatch = filterDate === 'ALL' || (m.date && utcDay(m.date) === filterDate);
          const searchMatch = searchTerm === '' || 
              home.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              away.name.toLowerCase().includes(searchTerm.toLowerCase());
              
          return dateMatch && searchMatch;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [matches, teams, filterDate, searchTerm]);

  // 4. "MATCH OF THE DAY" SELECTION LOGIC
  const heroMatch = useMemo(() => {
    if (searchTerm) return null;

    let candidatePool: Match[] = [];

    // CASE A: User selected 'ALL' -> Look at all Live/Upcoming matches
    if (filterDate === 'ALL') {
        candidatePool = matches.filter(m => 
            ['LIVE', '1H', '2H', 'HT', 'ET', 'PEN'].includes(m.status) ||
            (m.status === 'UPCOMING' && m.date !== 'TBD' && new Date(m.date) > new Date())
        );
    } 
    // CASE B: Specific Date Selected
    else {
        // First, try to find a hero from the *Selected Date*
        candidatePool = filteredMatches;

        // NEW LOGIC: REST DAY FALLBACK
        // If the selected day is empty (Rest Day), fall back to the "ALL" logic 
        if (candidatePool.length === 0) {
             candidatePool = matches.filter(m => 
                ['LIVE', '1H', '2H', 'HT', 'ET', 'PEN'].includes(m.status) ||
                (m.status === 'UPCOMING' && m.date !== 'TBD' && new Date(m.date) > new Date())
             );
        }
    }

    if (candidatePool.length === 0) return null;

    // --- APPLY PRIORITY RULES TO THE POOL ---

    // 1. My Language Team
    const myTeamId = LANG_TEAM_MAP[currentLang];
    const myMatch = candidatePool.find(m => m.homeTeamId === myTeamId || m.awayTeamId === myTeamId);
    if (myMatch) return myMatch;

    // 2. Priority Nations
    const priorityMatch = candidatePool.find(m => 
        PRIORITY_TEAMS.includes(m.homeTeamId) || PRIORITY_TEAMS.includes(m.awayTeamId)
    );
    if (priorityMatch) return priorityMatch;

    // 3. Top 10 Ranked Teams
    const top10Match = candidatePool.find(m => {
        const homeRank = teams[m.homeTeamId]?.rank || 100;
        const awayRank = teams[m.awayTeamId]?.rank || 100;
        return homeRank <= 10 || awayRank <= 10;
    });
    if (top10Match) return top10Match;

    // 4. Biggest Clash
    const sortedByRank = [...candidatePool].sort((a, b) => {
        const rankA = (teams[a.homeTeamId]?.rank || 50) + (teams[a.awayTeamId]?.rank || 50);
        const rankB = (teams[b.homeTeamId]?.rank || 50) + (teams[b.awayTeamId]?.rank || 50);
        return rankA - rankB;
    });

    return sortedByRank[0];

  }, [matches, filteredMatches, teams, currentLang, filterDate, searchTerm]);

  // Get Context for Hero
  const heroStandings = useMemo(() => {
    if (!heroMatch?.groupId) return undefined;
    return calculateGroupStandings(heroMatch.groupId, matches, teams);
  }, [heroMatch, matches, teams]);

  // Whether the hero match is one of today's chronologically-sorted matches.
  // If so, it renders inline at its kickoff-time slot instead of pinned to the top.
  const heroInList = !!heroMatch && !searchTerm && filteredMatches.some(m => m.id === heroMatch.id);

  // Date Headline Helper
  // User's timezone abbreviation (e.g. "BST", "EDT", "CEST") for the headline callout
  const userTzAbbr = useMemo(() =>
    Intl.DateTimeFormat(activeLocale, { timeZoneName: 'short' })
      .formatToParts(new Date())
      .find(p => p.type === 'timeZoneName')?.value ?? ''
  , [activeLocale]);

  const getDateHeadline = (dateStr: string) => {
      if (dateStr === 'ALL') return lang.subnavSchedule || 'Schedule';
      const today = utcDay(new Date());
      const tomorrowDate = new Date(); tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
      const tomorrow = utcDay(tomorrowDate);

      const tzTag = userTzAbbr ? ` · ${userTzAbbr}` : '';

      if (dateStr === today) return `${lang.today || "Today"}${tzTag}`;
      if (dateStr === tomorrow) return `${lang.tomorrow || "Tomorrow"}${tzTag}`;

      // Parse as UTC noon for display so the day number never shifts
      const [y, mo, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
      return dateObj.toLocaleDateString(activeLocale, {
          weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC'
      }) + tzTag;
  };

  // Click Handler Generator
  const createClickHandler = (match: Match) => (teamId: string) => {
      if (match.groupId && onJumpToTable) {
          onJumpToTable(match.groupId, teamId);
      } else if (match.round && onJumpToBracket) {
          onJumpToBracket(match.id);
      } else {
          onTeamClick(teamId);
      }
  };

  // Points Map for List
  const teamPointsMap = useMemo(() => {
      const allStandings = getAllGroupStandings(matches, teams);
      const points: Record<string, number> = {};
      Object.values(allStandings).flat().forEach(standing => {
          points[standing.teamId] = standing.pts;
      });
      return points;
  }, [matches, teams]);

  return (
    <div {...dateSwipe} className="pb-24 animate-fade-in bg-slate-50 min-h-screen touch-pan-y">
        <DateRibbon
            dates={uniqueDates}
            selectedDate={filterDate}
            onDateSelect={setFilterDate}
            lang={lang}
            locale={activeLocale}
        />
        
        <div className="p-4 max-w-2xl mx-auto">
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder={lang.searchNation || "Search fixtures..."}
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); if (e.target.value) setFilterDate('ALL'); }}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* DATE HEADLINE */}
            <div className="flex items-center justify-between px-1 mb-4">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                    {getDateHeadline(filterDate)}
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {filteredMatches.length} Matches
                </span>
            </div>

            {/* MATCH OF THE DAY HERO — pinned to top only when it isn't already part of today's
                chronological list below (e.g. rest-day fallback to the next upcoming match).
                Otherwise it renders inline, in its correct kickoff-time slot. */}
            {heroMatch && !searchTerm && !heroInList && (
                <div id="tour-schedule-hero" data-match-id={heroMatch.id}>
                    <MatchdayHero
                        match={heroMatch}
                        teams={teams}
                        groupStandings={heroStandings}
                        lang={lang}
                        locale={activeLocale}
                        allMatches={matches}
                        onTeamClick={createClickHandler(heroMatch)}
                        userPrediction={userPredictions.find(p => p.matchId === heroMatch.id)}
                        currentUser={user}
                        events={matchEvents.filter(e => String(e.matchId) === String(heroMatch.id) || e.matchId === `${heroMatch.homeTeamId}_${heroMatch.awayTeamId}`)}
                        lineups={matchLineups.filter(l => l.matchId === heroMatch.id)}
                        stats={matchStats.find(s => s.matchId === heroMatch.id) ?? null}
                    />
                </div>
            )}

            {/* List */}
            <div className="space-y-4">
                {filteredMatches.length > 0 ? (
                    filteredMatches.map(match => {
                        const isHero = heroInList && heroMatch && match.id === heroMatch.id;
                        const isHighStakes = !match.groupId && match.round !== 'R32';
                        const readOnlyMatch = { ...match, isLocked: true };

                        return (
                            <div key={match.id} className="relative" id={isHero ? 'tour-schedule-hero' : undefined}>
                                {searchTerm && match.date && match.date !== 'TBD' && (
                                    <div className="flex items-center gap-1.5 mb-1.5 px-1">
                                        <CalendarDays size={10} className="text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {new Date(match.date).toLocaleDateString(activeLocale, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                )}
                                {isHero && heroMatch ? (
                                    <MatchdayHero
                                        match={heroMatch}
                                        teams={teams}
                                        groupStandings={heroStandings}
                                        lang={lang}
                                        locale={activeLocale}
                                        allMatches={matches}
                                        onTeamClick={createClickHandler(heroMatch)}
                                        userPrediction={userPredictions.find(p => p.matchId === heroMatch.id)}
                                        currentUser={user}
                                        events={matchEvents.filter(e => String(e.matchId) === String(heroMatch.id) || e.matchId === `${heroMatch.homeTeamId}_${heroMatch.awayTeamId}`)}
                                        lineups={matchLineups.filter(l => l.matchId === heroMatch.id)}
                                        stats={matchStats.find(s => s.matchId === heroMatch.id) ?? null}
                                        onSubstitute={onSubstitute ? () => onSubstitute(heroMatch.id) : undefined}
                                        substitutionsLeft={user?.substitutions ?? 0}
                                        isUnlockedBySub={user?.unlockedMatches?.includes(heroMatch.id) ?? false}
                                    />
                                ) : (
                                    <MatchCard
                                        match={readOnlyMatch}
                                        homeTeam={teams[match.homeTeamId]}
                                        awayTeam={teams[match.awayTeamId]}
                                        onUpdate={onUpdate ?? (() => {})}
                                        lang={lang}
                                        locale={activeLocale}
                                        userTokens={0}
                                        rivals={[]}
                                        onSpy={() => {}}
                                        revealedRivals={[]}
                                        currentUser={user}
                                        allPredictions={userPredictions}
                                        phase={'LIVE'}
                                        isAdminMode={false}
                                        onTeamClick={createClickHandler(match)}
                                        showStatusBadge={true}
                                        homeTeamPoints={teamPointsMap[match.homeTeamId]}
                                        awayTeamPoints={teamPointsMap[match.awayTeamId]}
                                        allMatches={matches}
                                        allTeams={teams}
                                        variant="official"
                                        cardId={`schedule-match-${match.id}`}
                                        events={matchEvents.filter(e => String(e.matchId) === String(match.id) || e.matchId === `${match.homeTeamId}_${match.awayTeamId}`)}
                                        lineups={matchLineups.filter(l => l.matchId === match.id)}
                                        stats={matchStats.find(s => s.matchId === match.id) ?? null}
                                        onSubstitute={onSubstitute ? () => onSubstitute(match.id) : undefined}
                                        substitutionsLeft={user?.substitutions ?? 0}
                                        isUnlockedBySub={user?.unlockedMatches?.includes(match.id) ?? false}
                                    />
                                )}
                                {isHighStakes && !isHero && (
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
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {lang.noMatches || "No matches scheduled"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};