import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, Match, Prediction, Team, Translation, LanguageCode } from '../types';
import { calculateGroupStandings } from '../services/engine';
import { DateRibbon } from './DateRibbon';
import { AvatarDisplay } from './AvatarDisplay';
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown, Calendar, RefreshCw } from 'lucide-react';

// Imported from Refactored Files
import { useTournamentSimulation } from '../hooks/useTournamentSimulation';
import { SimRow } from './analysis/SimRow';
import { AIAnalystWidget } from './analysis/AIAnalystWidget';

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
        noMatches: "No matches on this date."
    },
    'en-US': {
        analysisTitle: "Road to Victory",
        aiSubtitle: "AI Intel & Sim",
        resetSim: "Reset Simulation",
        simRank: "Projected Rank",
        hideTable: "Hide Standings",
        fullTable: "Full Standings",
        noMatches: "No matchups on this date."
    },
    sco: {
        analysisTitle: "Road tae Glory",
        aiSubtitle: "The Gaffer's Intel",
        resetSim: "Reset the Sim",
        simRank: "Simulated Rank",
        hideTable: "Hide Table",
        fullTable: "Full Table",
        noMatches: "Nae matches on this date."
    },
    no: {
        analysisTitle: "Veien til Seier",
        aiSubtitle: "AI Innsikt & Simulering",
        resetSim: "Nullstill Simulering",
        simRank: "Simulert Rangering",
        hideTable: "Skjul Tabell",
        fullTable: "Full Tabell",
        noMatches: "Ingen kamper på denne datoen."
    }
};

// --- SUB-COMPONENT: SIMULATED LEADERBOARD ---
const SimulatedLeaderboardWidget: React.FC<{
    simulatedUsers: { user: UserProfile, score: number, diff: number, rank: number }[];
    currentUser: UserProfile;
    lang: Translation;
    t: any; // Local translations
}> = ({ simulatedUsers, currentUser, lang, t }) => {
    const [isExpanded, setIsExpanded] = useState(false);

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
            <div onClick={() => setIsExpanded(!isExpanded)} className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
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
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hidden sm:inline">{isExpanded ? t.hideTable : t.fullTable}</span>
                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
            </div>

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
  onTeamClick
}) => {
  // 1. CALCULATE "GAME TODAY" (Date of next match)
  // This ensures the dashboard opens on a relevant date
  const defaultDate = useMemo(() => {
      const upcoming = matches
          .filter(m => (m.status === 'UPCOMING' || m.status === 'LIVE') && m.date !== 'TBD')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // If we have upcoming matches, use the first one. Otherwise use real today.
      if (upcoming.length > 0) return new Date(upcoming[0].date).toDateString();
      return new Date().toDateString();
  }, [matches]);

  const [filterDate, setFilterDate] = useState<string>(defaultDate);

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
              if (d >= cutoff || m.status === 'UPCOMING') dates.add(d.toDateString());
          }
      });
      return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [simulatedMatches]);

  // 2. FILTERED LIST FOR DISPLAY (Affected by User's Date Selection)
  const displayMatches = useMemo(() => {
      let filtered = simulatedMatches.filter(m => m.date && m.date !== 'TBD');
      
      if (filterDate !== 'ALL') {
          filtered = filtered.filter(m => new Date(m.date).toDateString() === filterDate);
      } else {
          const now = Date.now();
          filtered = filtered.filter(m => new Date(m.date).getTime() > now - 86400000); 
      }
      return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [simulatedMatches, filterDate]);

  // 3. INDEPENDENT LIST FOR AI ANALYST (Always Next Up)
  // CRITICAL FIX: This ignores 'filterDate' so the AI always sees the future schedule
  const analysisMatches = useMemo(() => {
    return matches
        .filter(m => (m.status === 'UPCOMING' || m.status === 'LIVE') && m.date !== 'TBD')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);
  }, [matches]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
        
        {/* HEADER: AI Analyst Widget */}
        <div className="p-4 pb-2 bg-gradient-to-r from-indigo-600 to-blue-700">
            <div className="flex items-center gap-3 mb-4 text-white">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                    <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-black uppercase tracking-tight leading-none">{t.analysisTitle}</h2>
                    <p className="text-[10px] text-blue-100 font-medium opacity-80">{t.aiSubtitle}</p>
                </div>
            </div>

            <AIAnalystWidget 
                currentUser={currentUser}
                combinedStats={combinedStats}
                nextMatches={analysisMatches} // <--- UPDATED: Uses the independent list
                allPredictions={allPredictions}
                lang={lang}
                currentLang={currentLang}
                teams={teams}
            />
        </div>

        <DateRibbon dates={uniqueDates} selectedDate={filterDate} onDateSelect={setFilterDate} lang={lang} locale={({'EN':'en-GB','SCO':'en-GB','US':'en-US','NO':'no-NO'} as Record<string,string>)[currentLang] || 'en-GB'} />

        <SimulatedLeaderboardWidget 
            simulatedUsers={combinedStats} 
            currentUser={currentUser} 
            lang={lang}
            t={t} 
        />

        <div className="flex-1 p-4 space-y-4 pb-20">
            {Object.keys(simulation).length > 0 && (
                <div className="flex justify-end mb-2">
                    <button onClick={resetSim} className="flex items-center gap-1 text-[10px] font-bold text-purple-500 uppercase tracking-widest hover:text-purple-600 bg-purple-50 px-2 py-1 rounded-lg"><RefreshCw size={12} /> {t.resetSim}</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayMatches.length > 0 ? (
                    displayMatches.map(match => {
                        const standings = match.groupId ? calculateGroupStandings(match.groupId, simulatedMatches, teams) : undefined;
                        
                        return (
                            <SimRow 
                                key={match.id}
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