import React, { useState, useMemo, useRef } from 'react';
import { UserProfile, Match, Prediction, Team, Translation, LanguageCode } from '../types';
import { calculatePoints } from '../services/engine';
import { AvatarDisplay } from './AvatarDisplay';
import { DateRibbon } from './DateRibbon';
import { TrendingUp, TrendingDown, Calculator, ChevronUp, ChevronDown, RefreshCw, Filter, Check, Minus, Trophy, ArrowRight, Activity, Clock, Calendar, AlertTriangle, Flame, Target, MessageSquareQuote, X, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { HOST_KEYS } from '../constants';

// --- SUB-COMPONENTS ---

const ScoreStepper: React.FC<{ 
    value: number; 
    onChange: (val: number) => void; 
    isLocked: boolean;
}> = ({ value, onChange, isLocked }) => {
  return (
    <div className={`flex flex-col items-center justify-between w-12 h-20 bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm group ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:border-blue-300 hover:shadow-md'}`}>
      <button 
        disabled={isLocked}
        onClick={(e) => { e.stopPropagation(); onChange(value + 1); }}
        className="w-full flex-1 flex items-center justify-center text-slate-400 group-hover:text-blue-600 hover:bg-white rounded-t-xl transition-colors active:bg-blue-50 focus:outline-none"
      >
        <ChevronUp size={18} strokeWidth={3} />
      </button>
      
      <div className="h-8 flex items-center justify-center text-xl font-black text-slate-800 leading-none select-none z-10 bg-white w-full border-y border-slate-100">
        {value}
      </div>
      
      <button 
        disabled={isLocked}
        onClick={(e) => { e.stopPropagation(); onChange(Math.max(0, value - 1)); }}
        className="w-full flex-1 flex items-center justify-center text-slate-400 group-hover:text-blue-600 hover:bg-white rounded-b-xl transition-colors active:bg-blue-50 focus:outline-none"
      >
        <ChevronDown size={18} strokeWidth={3} />
      </button>
    </div>
  );
};

const WinnerButton: React.FC<{
    team: Team;
    isSelected: boolean;
    onClick: () => void;
}> = ({ team, isSelected, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all w-full ${isSelected ? 'bg-green-50 border-green-500 shadow-md' : 'bg-white border-slate-200 hover:border-blue-300'}`}
    >
        <div className="relative">
            <img src={team?.flag} alt={team?.name} className="w-10 h-7 object-cover rounded shadow-sm" />
            {isSelected && <div className="absolute -right-2 -top-2 bg-green-500 text-white p-0.5 rounded-full"><Check size={10} strokeWidth={4} /></div>}
        </div>
        <span className={`text-[10px] font-black uppercase tracking-tight ${isSelected ? 'text-green-800' : 'text-slate-500'}`}>{team?.code || 'WIN'}</span>
    </button>
);

const SimRow: React.FC<{
    match: Match;
    home: Team;
    away: Team;
    sim: { home: number, away: number } | undefined;
    onUpdate: (h: number, a: number) => void;
    currentUser: UserProfile;
    rivals: UserProfile[];
    allPredictions: Prediction[];
    lang: Translation;
}> = ({ match, home, away, sim, onUpdate, currentUser, rivals, allPredictions, lang }) => {
    const hVal = sim ? sim.home : (match.homeScore ?? 0);
    const aVal = sim ? sim.away : (match.awayScore ?? 0);
    
    const isSimulated = !!sim;
    const isLive = ['LIVE', '1H', '2H', 'HT', 'AET', 'PEN'].includes(match.status);
    const isKnockout = !!match.round && match.round !== 'R32'; 

    const { homePreds, drawPreds, awayPreds } = useMemo(() => {
        const h: { u: UserProfile, p: Prediction }[] = [];
        const d: { u: UserProfile, p: Prediction }[] = [];
        const a: { u: UserProfile, p: Prediction }[] = [];

        [currentUser, ...rivals].forEach(u => {
            const p = allPredictions.find(pred => pred.userId === u.email && pred.matchId === match.id);
            if (p) {
                if (p.home > p.away) h.push({ u, p });
                else if (p.away > p.home) a.push({ u, p });
                else d.push({ u, p });
            }
        });
        return { homePreds: h, drawPreds: d, awayPreds: a };
    }, [currentUser, rivals, allPredictions, match.id]);

    const renderStackPill = (item: { u: UserProfile, p: Prediction }, side: 'left' | 'center' | 'right') => {
        const { u, p } = item;
        const isMe = u.email === currentUser.email;
        let bg = 'bg-slate-50 border-slate-100 text-slate-600';
        if (isMe) bg = 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-300';
        let justify = side === 'left' ? 'justify-start' : side === 'right' ? 'justify-end' : 'justify-center';

        return (
            <button
                key={u.email}
                onClick={(e) => { e.stopPropagation(); onUpdate(p.home, p.away); }}
                className={`flex items-center gap-1.5 w-full ${justify} px-1.5 py-1 rounded border text-[9px] font-bold transition-all hover:bg-white hover:shadow-sm ${bg}`}
            >
                {side === 'right' && <span className="font-black opacity-80">{p.home}-{p.away}</span>}
                <AvatarDisplay avatar={u.avatar} size="xs" className="w-3 h-3" />
                <span className="truncate max-w-[50px]">{u.name.split(' ')[0]}</span>
                {side !== 'right' && <span className="font-black opacity-80">{p.home}-{p.away}</span>}
            </button>
        );
    };

    return (
        <div className={`bg-white rounded-2xl border shadow-sm p-3 transition-all duration-300 flex flex-col gap-3 ${isSimulated ? 'border-blue-400 ring-1 ring-blue-50' : 'border-slate-200'}`}>
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {isLive ? <span className="text-red-500 animate-pulse">● LIVE</span> : <span>{new Date(match.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
                    <span className="text-slate-200">|</span>
                    <span>{match.groupId ? `Group ${match.groupId}` : match.round}</span>
                </div>
                {isSimulated && <div className="text-[8px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">Simulated</div>}
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <img src={home?.flag} alt="" className="w-10 h-7 rounded shadow-sm object-cover" />
                        <span className="text-[10px] font-black text-slate-800 uppercase text-center leading-tight">{home?.name}</span>
                    </div>
                    {isKnockout && <WinnerButton team={home} isSelected={hVal > aVal} onClick={() => onUpdate(1, 0)} />}
                    <div className="flex flex-col gap-1 mt-1">{homePreds.map(item => renderStackPill(item, 'left'))}</div>
                </div>

                <div className="flex flex-col gap-2 items-center">
                    {isKnockout ? (
                        <div className="flex items-center justify-center h-full pb-8"><span className="text-xs font-black text-slate-300">VS</span></div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <ScoreStepper value={hVal} onChange={(v) => onUpdate(v, aVal)} isLocked={false} />
                            <span className="text-slate-300 font-bold">-</span>
                            <ScoreStepper value={aVal} onChange={(v) => onUpdate(hVal, v)} isLocked={false} />
                        </div>
                    )}
                    {!isKnockout && (
                        <div className="flex flex-col gap-1 w-full mt-1">
                            {drawPreds.length > 0 && <div className="h-px bg-slate-100 w-full my-0.5"></div>}
                            {drawPreds.map(item => renderStackPill(item, 'center'))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <img src={away?.flag} alt="" className="w-10 h-7 rounded shadow-sm object-cover" />
                        <span className="text-[10px] font-black text-slate-800 uppercase text-center leading-tight">{away?.name}</span>
                    </div>
                    {isKnockout && <WinnerButton team={away} isSelected={aVal > hVal} onClick={() => onUpdate(0, 1)} />}
                    <div className="flex flex-col gap-1 mt-1">{awayPreds.map(item => renderStackPill(item, 'right'))}</div>
                </div>
            </div>
        </div>
    );
};

// --- SIMULATED STANDINGS WIDGET ---

const SimulatedLeaderboardWidget: React.FC<{
    simulatedUsers: { user: UserProfile, score: number, diff: number, rank: number }[];
    currentUser: UserProfile;
    lang: Translation;
}> = ({ simulatedUsers, currentUser, lang }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Get "Condensed" View: Top 3 + User + Neighbors
    const displayRows = useMemo(() => {
        if (!isExpanded) {
            // Collapsed: Just the user
            return simulatedUsers.filter(u => u.user.email === currentUser.email);
        }
        
        // Expanded: Top 3 + Neighbors
        const myIndex = simulatedUsers.findIndex(u => u.user.email === currentUser.email);
        const indicesToShow = new Set([0, 1, 2, myIndex - 1, myIndex, myIndex + 1]);
        
        return simulatedUsers.filter((_, idx) => indicesToShow.has(idx));
    }, [simulatedUsers, currentUser, isExpanded]);

    const myRow = simulatedUsers.find(u => u.user.email === currentUser.email);

    return (
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-lg">
            {/* Header / Toggle Bar */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{lang.simulatedRank || "Simulated Rank"}</span>
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
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hidden sm:inline">
                        {isExpanded ? "Hide Table" : "Show Table"}
                    </span>
                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
            </div>

            {/* Expanded Table */}
            {isExpanded && (
                <div className="border-t border-slate-100 animate-in slide-in-from-top-2">
                    <div className="max-h-60 overflow-y-auto no-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                <tr>
                                    <th className="px-4 py-2 w-10 text-center">#</th>
                                    <th className="px-2 py-2">Manager</th>
                                    <th className="px-4 py-2 text-right">Pts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm">
                                {displayRows.map((row, idx) => {
                                    const isMe = row.user.email === currentUser.email;
                                    const isGap = idx > 0 && simulatedUsers.indexOf(row) !== simulatedUsers.indexOf(displayRows[idx - 1]) + 1;
                                    
                                    return (
                                        <React.Fragment key={row.user.email}>
                                            {isGap && (
                                                <tr><td colSpan={3} className="text-center py-1 text-slate-300 text-[10px]">•••</td></tr>
                                            )}
                                            <tr className={isMe ? 'bg-blue-50' : 'bg-white'}>
                                                <td className="px-4 py-2 text-center font-black text-slate-500">
                                                    {row.rank}
                                                    {row.diff !== 0 && (
                                                        <span className={`block text-[8px] ${row.diff > 0 ? 'text-green-500' : 'text-red-400'}`}>
                                                            {row.diff > 0 ? '▲' : '▼'} {Math.abs(row.diff)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-2 py-2 font-bold text-slate-700 flex items-center gap-2">
                                                    <AvatarDisplay avatar={row.user.avatar} size="xs" />
                                                    <span className={isMe ? 'text-blue-700' : ''}>{row.user.name}</span>
                                                </td>
                                                <td className="px-4 py-2 text-right font-black text-slate-900">{row.score}</td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
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
  const [simulation, setSimulation] = useState<Record<string, { home: number, away: number }>>({});
  
  // Date Logic
  const todayStr = new Date().toDateString();
  const [filterDate, setFilterDate] = useState<string>(todayStr);

  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysisType, setActiveAnalysisType] = useState<string | null>(null);

  const allUsers = useMemo(() => [currentUser, ...rivals], [currentUser, rivals]);

  // 1. Calculate Standings
  const stats = useMemo(() => {
      const livePoints: Record<string, number> = {};
      const simPoints: Record<string, number> = {};
      
      allUsers.forEach(u => { livePoints[u.email] = 0; simPoints[u.email] = 0; });

      matches.forEach(m => {
          const sim = simulation[m.id];
          const hasRealScore = m.homeScore !== null && m.awayScore !== null;
          
          let effHome = hasRealScore ? m.homeScore : null;
          let effAway = hasRealScore ? m.awayScore : null;
          
          if (sim) { effHome = sim.home; effAway = sim.away; }

          allUsers.forEach(u => {
              const pred = allPredictions.find(p => p.userId === u.email && p.matchId === m.id);
              if (pred) {
                  if (hasRealScore) {
                      livePoints[u.email] += calculatePoints(pred.home, pred.away, m.homeScore, m.awayScore, u.hasTakenSecondChance, m.round);
                  }
                  if (effHome !== null && effAway !== null) {
                      simPoints[u.email] += calculatePoints(pred.home, pred.away, effHome, effAway, u.hasTakenSecondChance, m.round);
                  }
              }
          });
      });

      // Generate Sorted List for Table
      const sortUsers = (pointsMap: Record<string, number>) => 
          [...allUsers].sort((a,b) => pointsMap[b.email] - pointsMap[a.email]);

      const liveRanked = sortUsers(livePoints);
      const simRanked = sortUsers(simPoints);

      const combinedStats = simRanked.map((u, idx) => {
          const liveRank = liveRanked.findIndex(lr => lr.email === u.email) + 1;
          const simRank = idx + 1;
          return {
              user: u,
              score: simPoints[u.email],
              rank: simRank,
              diff: liveRank - simRank // + means improvement
          };
      });

      return combinedStats;
  }, [matches, simulation, allPredictions, allUsers]);

  // 2. Date Filtering (Next 48h or All)
  const uniqueDates = useMemo(() => {
      const dates = new Set<string>();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 3); // "Go back only 3 days"

      matches.forEach(m => {
          if (m.date && m.date !== 'TBD') {
              const d = new Date(m.date);
              if (d >= cutoff) dates.add(d.toDateString());
          }
      });
      return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [matches]);

  const displayMatches = useMemo(() => {
      let filtered = matches.filter(m => m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD');
      
      // Filter by Selected Date (from Ribbon)
      if (filterDate !== 'ALL') {
          filtered = filtered.filter(m => new Date(m.date).toDateString() === filterDate);
      } else {
          // If 'ALL', maybe show just upcoming? For now, show all valid
          const now = Date.now();
          filtered = filtered.filter(m => new Date(m.date).getTime() > now - 86400000); // Hide very old
      }

      return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [matches, filterDate]);

  const updateSim = (matchId: string, h: number, a: number) => {
      setSimulation(prev => ({ ...prev, [matchId]: { home: h, away: a } }));
  };

  // AI HANDLER
  const handleAnalysis = async (type: 'opportunity' | 'pitfall' | 'realistic' | 'roast') => {
      if (isAnalyzing) return;
      setIsAnalyzing(true);
      setActiveAnalysisType(type);
      setAnalysisResult(null);

      try {
          const apiKey = process.env.API_KEY || HOST_KEYS[Math.floor(Math.random() * HOST_KEYS.length)];
          const ai = new GoogleGenAI({ apiKey });
          
          const myStat = stats.find(s => s.user.email === currentUser.email);
          const rank = myStat?.rank || 99;

          const promptMap = {
              opportunity: `Tell this football fan (Rank #${rank}) best case scenario for upcoming games. Optimistic. Max 30 words.`,
              pitfall: `Warn this fan (Rank #${rank}) about a dangerous match. Pessimistic. Max 30 words.`,
              realistic: `Give realistic projection for user at Rank #${rank}. Max 30 words.`,
              roast: `Roast this user for being Rank #${rank}. Be mean/funny. Max 30 words.`
          };

          const response = await ai.models.generateContent({
              model: 'gemini-2.0-flash',
              contents: promptMap[type]
          });
          
          setAnalysisResult(response.text || "AI speechless...");
      } catch (e) {
          console.error(e);
          setAnalysisResult("AI taking a nap (Error).");
      } finally {
          setIsAnalyzing(false);
      }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white p-4 pb-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                    <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-black uppercase tracking-tight leading-none">{lang.analysisTitle || "Path to Victory"}</h2>
                    <p className="text-[10px] text-blue-100 font-medium opacity-80">AI Insights & Simulation</p>
                </div>
            </div>
            
            {/* AI BUTTONS */}
            <div className="grid grid-cols-4 gap-2 mt-4">
                <button onClick={() => handleAnalysis('opportunity')} className="flex flex-col items-center gap-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all">
                    <TrendingUp size={14} className="text-green-300" />
                    <span className="text-[8px] font-bold uppercase">Best Case</span>
                </button>
                <button onClick={() => handleAnalysis('pitfall')} className="flex flex-col items-center gap-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all">
                    <AlertTriangle size={14} className="text-red-300" />
                    <span className="text-[8px] font-bold uppercase">Worst Case</span>
                </button>
                <button onClick={() => handleAnalysis('realistic')} className="flex flex-col items-center gap-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all">
                    <Target size={14} className="text-blue-300" />
                    <span className="text-[8px] font-bold uppercase">Realistic</span>
                </button>
                <button onClick={() => handleAnalysis('roast')} className="flex flex-col items-center gap-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all">
                    <Flame size={14} className="text-orange-300" />
                    <span className="text-[8px] font-bold uppercase">Roast Me</span>
                </button>
            </div>

            {/* AI RESULT */}
            {(isAnalyzing || analysisResult) && (
                <div className="mt-3 bg-white/10 border border-white/10 rounded-xl p-3 backdrop-blur-sm animate-in fade-in slide-in-from-top-1">
                    <div className="flex gap-2 items-start">
                        {isAnalyzing ? <RefreshCw size={14} className="animate-spin mt-0.5" /> : <MessageSquareQuote size={14} className="mt-0.5" />}
                        <p className="text-xs font-medium leading-relaxed italic opacity-90">
                            {isAnalyzing ? "Analysing scenarios..." : `"${analysisResult}"`}
                        </p>
                    </div>
                </div>
            )}
        </div>

        {/* DATE RIBBON */}
        <DateRibbon 
            dates={uniqueDates} 
            selectedDate={filterDate} 
            onDateSelect={setFilterDate} 
            lang={lang} 
        />

        {/* STICKY SIMULATED TABLE */}
        <SimulatedLeaderboardWidget 
            simulatedUsers={stats} 
            currentUser={currentUser} 
            lang={lang} 
        />

        {/* SCENARIO STACK */}
        <div className="flex-1 p-4 space-y-4 pb-20">
            {Object.keys(simulation).length > 0 && (
                <div className="flex justify-end mb-2">
                    <button 
                        onClick={() => setSimulation({})}
                        className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600"
                    >
                        <RefreshCw size={12} /> Reset Simulation
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayMatches.length > 0 ? (
                    displayMatches.map(match => (
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
                            lang={lang}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 opacity-50">
                        <Calendar size={48} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-bold text-slate-400">No matches on this date.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};