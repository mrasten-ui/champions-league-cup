import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, Match, Prediction, Team, Translation, LanguageCode } from '../types';
import { calculateGroupStandings } from '../services/engine';
import { DateRibbon } from './DateRibbon';
import { AvatarDisplay } from './AvatarDisplay';
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown, Calendar, RefreshCw, Info, X, Swords } from 'lucide-react';

import { utcDay } from '../utils/date';

// Imported from Refactored Files
import { useTournamentSimulation } from '../hooks/useTournamentSimulation';
import { SimRow } from './analysis/SimRow';
import { HeadToHead } from './analysis/HeadToHead';

// HELPER: Map App Language Code to Dictionary Key
const getLocKey = (code: LanguageCode): string => {
    if (code === 'NO') return 'no';
    if (code === 'SCO') return 'sco';
    if (code === 'US') return 'en-US';
    return 'en'; // Default 'EN'
};

// LOCAL TRANSLATIONS
const TEXT: Record<string, any> = {
    en: {
        analysisTitle: "Path to Victory",
        aiSubtitle: "AI Insights & Simulation",
        resetSim: "Reset Simulation",
        simRank: "Simulated Rank",
        hideTable: "Hide Table",
        fullTable: "Full Table",
        noMatches: "No matches on this date.",
        simHint: "Adjust the match scores below to simulate different results — your leaderboard position updates live so you can see exactly what you need.",
    },
    'en-US': {
        analysisTitle: "Road to Victory",
        aiSubtitle: "AI Intel & Sim",
        resetSim: "Reset Simulation",
        simRank: "Projected Rank",
        hideTable: "Hide Standings",
        fullTable: "Full Standings",
        noMatches: "No matchups on this date.",
        simHint: "Drag scores up or down below to run different scenarios — watch your simulated rank change in real time.",
    },
    sco: {
        analysisTitle: "Road tae Glory",
        aiSubtitle: "The Gaffer's Intel",
        resetSim: "Reset the Sim",
        simRank: "Simulated Rank",
        hideTable: "Hide Table",
        fullTable: "Full Table",
        noMatches: "Nae matches on this date.",
        simHint: "Chynge the scores below an' see where ye'd end up — yer simulated rank updates as ye go.",
    },
    no: {
        analysisTitle: "Veien til Seier",
        aiSubtitle: "AI Innsikt & Simulering",
        resetSim: "Nullstill Simulering",
        simRank: "Simulert Rangering",
        hideTable: "Skjul Tabell",
        fullTable: "Full Tabell",
        noMatches: "Ingen kamper på denne datoen.",
        simHint: "Juster kampresultatene nedenfor for å simulere ulike utfall — stillingen din oppdateres live.",
    }
};

// --- SUB-COMPONENT: SIMULATED LEADERBOARD ---
const SimulatedLeaderboardWidget: React.FC<{
    simulatedUsers: { user: UserProfile, score: number, diff: number, rank: number }[];
    currentUser: UserProfile;
    rivals: UserProfile[];
    matches: Match[];
    allPredictions: Prediction[];
    teams: Record<string, Team>;
    lang: Translation;
    t: any; // Local translations
}> = ({ simulatedUsers, currentUser, rivals, matches, allPredictions, teams, lang, t }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [h2hOpen, setH2hOpen] = useState(false);

    const chunkedUsers = useMemo(() => {
        const chunks = [];
        for (let i = 0; i < simulatedUsers.length; i += 10) {
            chunks.push(simulatedUsers.slice(i, i + 10));
        }
        return chunks;
    }, [simulatedUsers]);

    const myRow = simulatedUsers.find(u => u.user.email === currentUser.email);

    return (
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-lg">
            <div
                onClick={() => { if (h2hOpen) { setH2hOpen(false); } else { setIsExpanded(!isExpanded); } }}
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.simRank}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-slate-800">#{myRow?.rank || '-'}</span>
                        {myRow && myRow.diff !== 0 && (
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${myRow.diff > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {myRow.diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {myRow.diff > 0 ? `+${myRow.diff}` : myRow.diff}
                            </div>
                        )}
                        <span className="text-xs font-bold text-slate-400 ml-1">({myRow?.score} pts)</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const opening = !h2hOpen;
                            setH2hOpen(opening);
                            if (opening) setIsExpanded(false);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                            ${h2hOpen
                                ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                                : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}
                    >
                        <Swords size={11} />
                        Head to Head
                    </button>
                    {!h2hOpen && (
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hidden sm:inline">
                            {isExpanded ? t.hideTable : t.fullTable}
                        </span>
                    )}
                    {isExpanded || h2hOpen
                        ? <ChevronUp size={20} className="text-slate-400" />
                        : <ChevronDown size={20} className="text-slate-400" />}
                </div>
            </div>

            {h2hOpen && (
                <HeadToHead
                    currentUser={currentUser}
                    rivals={rivals}
                    matches={matches}
                    allPredictions={allPredictions}
                    teams={teams}
                />
            )}

            {isExpanded && (
                <div className="border-t border-slate-100 animate-in slide-in-from-top-2 bg-slate-50/50">
                    <div className="flex overflow-x-auto snap-x snap-mandatory p-4 gap-4 no-scrollbar">
                        {chunkedUsers.map((chunk, chunkIdx) => (
                            <div key={chunkIdx} className="min-w-[280px] w-[85vw] max-w-[320px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden snap-center flex-shrink-0">
                                <div className="bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                                    Rank {chunkIdx * 10 + 1}-{Math.min((chunkIdx + 1) * 10, simulatedUsers.length)}
                                </div>
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-slate-50 text-xs">
                                        {chunk.map((row) => {
                                            const isMe = row.user.email === currentUser.email;
                                            return (
                                                <tr key={row.user.email} className={isMe ? 'bg-blue-50' : ''}>
                                                    <td className="px-3 py-2 text-center font-black text-slate-400 w-8">{row.rank}</td>
                                                    <td className="px-2 py-2 font-bold text-slate-700 flex items-center gap-2">
                                                        <AvatarDisplay avatar={row.user.avatar} size="xs" className="w-5 h-5" />
                                                        <span className={`truncate max-w-[120px] ${isMe ? 'text-blue-700' : ''}`}>{row.user.name}</span>
                                                        {isMe && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-black text-slate-900">
                                                        {row.score}
                                                        {row.diff !== 0 && (
                                                            <span className={`ml-1 text-[8px] ${row.diff > 0 ? 'text-green-500' : 'text-red-400'}`}>{row.diff > 0 ? '▲' : '▼'}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                    {chunkedUsers.length > 1 && (
                        <div className="flex justify-center pb-2">
                            <div className="flex gap-1">{chunkedUsers.map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>)}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- MAIN DASHBOARD ---

interface AnalysisDashboardProps {
  currentUser: UserProfile;
  rivals: UserProfile[];
  matches: Match[];
  allPredictions: Prediction[];
  teams: Record<string, Team>;
  lang: Translation;
  currentLang: LanguageCode;
  onTeamClick?: (id: string) => void;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  currentUser,
  rivals,
  matches,
  allPredictions,
  teams,
  lang,
  currentLang,
  onTeamClick,
}) => {
  // 1. CALCULATE DEFAULT DATE
  // Prefer today if there are any matches today; otherwise fall back to the next upcoming match.
  const defaultDate = useMemo(() => {
      const today = utcDay(new Date());
      const hasMatchesToday = matches.some(m => m.date && m.date !== 'TBD' && utcDay(m.date) === today);
      if (hasMatchesToday) return today;

      const upcoming = matches
          .filter(m => (m.status === 'UPCOMING' || m.status === 'LIVE') && m.date !== 'TBD')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (upcoming.length > 0) return utcDay(upcoming[0].date);
      return today;
  }, [matches]);

  const [filterDate, setFilterDate] = useState<string>(defaultDate);
  const [showSimHint, setShowSimHint] = useState(() => !localStorage.getItem(`rasten_sim_hint_${currentUser.email}`));

  // Sync state if defaultDate changes (e.g. data loaded or Time Travel used)
  useEffect(() => {
     setFilterDate(defaultDate);
  }, [defaultDate]);

  // Translation Selection
  const locKey = getLocKey(currentLang);
  const t = TEXT[locKey];

  const allUsers = useMemo(() => [currentUser, ...rivals], [currentUser, rivals]);

  // USE THE NEW HOOK
  const { 
      simulation, 
      updateSim, 
      resetSim, 
      combinedStats, 
      simulatedMatches, 
      qualifiedThirdsSet, 
      userBracketData 
  } = useTournamentSimulation(matches, allPredictions, teams, allUsers);

  // DATE FILTERING FOR RIBBON
  const uniqueDates = useMemo(() => {
      const dates = new Set<string>();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 3); 

      simulatedMatches.forEach(m => {
          if (m.date && m.date !== 'TBD') {
              const d = new Date(m.date);
              if (d >= cutoff || m.status === 'UPCOMING') dates.add(utcDay(d));
          }
      });
      return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [simulatedMatches]);

  // 2. FILTERED LIST FOR DISPLAY (Affected by User's Date Selection)
  const displayMatches = useMemo(() => {
      let filtered = simulatedMatches.filter(m => m.date && m.date !== 'TBD');
      
      if (filterDate !== 'ALL') {
          filtered = filtered.filter(m => utcDay(m.date) === filterDate);
      } else {
          const now = Date.now();
          filtered = filtered.filter(m => new Date(m.date).getTime() > now - 86400000); 
      }
      return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [simulatedMatches, filterDate]);

  // 3. INDEPENDENT LIST FOR AI ANALYST (Always Next Up)
  // CRITICAL FIX: This ignores 'filterDate' so the AI always sees the future schedule
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
        
        <DateRibbon dates={uniqueDates} selectedDate={filterDate} onDateSelect={setFilterDate} lang={lang} locale={({'EN':'en-GB','SCO':'en-GB','US':'en-US','NO':'no-NO'} as Record<string,string>)[currentLang] || 'en-GB'} />

        {showSimHint && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
            <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-800 font-medium flex-1 leading-relaxed">{t.simHint}</p>
            <button onClick={() => { localStorage.setItem(`rasten_sim_hint_${currentUser.email}`, '1'); setShowSimHint(false); }} className="text-blue-400 hover:text-blue-600 shrink-0">
              <X size={14} />
            </button>
          </div>
        )}

        <div id="tour-analysis-simleaderboard">
            <SimulatedLeaderboardWidget
                simulatedUsers={combinedStats}
                currentUser={currentUser}
                rivals={rivals}
                matches={matches}
                allPredictions={allPredictions}
                teams={teams}
                lang={lang}
                t={t}
            />
        </div>

        <div className="flex-1 p-4 space-y-4 pb-20">
            {Object.keys(simulation).length > 0 && (
                <div className="flex justify-end mb-2">
                    <button onClick={resetSim} className="flex items-center gap-1 text-[10px] font-bold text-purple-500 uppercase tracking-widest hover:text-purple-600 bg-purple-50 px-2 py-1 rounded-lg"><RefreshCw size={12} /> {t.resetSim}</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayMatches.length > 0 ? (
                    displayMatches.map((match, matchIndex) => {
                        const standings = match.groupId ? calculateGroupStandings(match.groupId, simulatedMatches, teams) : undefined;

                        return (
                            <div key={match.id} id={matchIndex === 0 ? 'tour-analysis-first-simrow' : undefined}>
                                <SimRow
                                    match={match}
                                    home={teams[match.homeTeamId]}
                                    away={teams[match.awayTeamId]}
                                    sim={simulation[match.id]}
                                    onUpdate={(h, a) => updateSim(match.id, h, a)}
                                    currentUser={currentUser}
                                    rivals={rivals}
                                    allPredictions={allPredictions}
                                    userBracketData={userBracketData}
                                    lang={lang}
                                    currentLang={currentLang}
                                    groupStandings={standings}
                                    teams={teams}
                                    qualifiedThirdsSet={qualifiedThirdsSet}
                                />
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full text-center py-12 opacity-50"><Calendar size={48} className="mx-auto mb-2 text-slate-300" /><p className="text-sm font-bold text-slate-400">{t.noMatches}</p></div>
                )}
            </div>
        </div>
    </div>
  );
};