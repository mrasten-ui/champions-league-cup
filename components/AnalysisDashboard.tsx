
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { UserProfile, Match, Prediction, Team, Translation, LanguageCode } from '../types';
import { calculatePoints } from '../services/engine';
import { AvatarDisplay } from './AvatarDisplay';
import { TrendingUp, TrendingDown, Calculator, ChevronUp, ChevronDown, Target, ChevronLeft, ChevronRight, Activity, Clock, RefreshCw, Calendar, Check, Sparkles, AlertTriangle, Flame, MessageSquareQuote, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { HOST_KEYS } from '../constants';

// --- SUB-COMPONENTS ---

const ScoreStepper: React.FC<{ 
    value: number; 
    onChange: (val: number) => void; 
    isLocked: boolean;
}> = ({ value, onChange, isLocked }) => {
  return (
    <div className={`flex flex-col items-center justify-between w-12 h-24 sm:w-14 sm:h-28 bg-white border border-slate-200 rounded-xl transition-all shadow-sm group ${isLocked ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'hover:border-blue-300 hover:shadow-md'}`}>
      <button 
        disabled={isLocked}
        onClick={(e) => { e.stopPropagation(); onChange(value + 1); }}
        className="w-full flex-1 flex items-center justify-center text-slate-300 group-hover:text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-t-xl transition-colors active:bg-blue-50 focus:outline-none"
      >
        <ChevronUp size={20} strokeWidth={3} />
      </button>
      
      <div className="h-8 flex items-center justify-center text-2xl font-black text-slate-800 leading-none select-none z-10">
        {value}
      </div>
      
      <button 
        disabled={isLocked}
        onClick={(e) => { e.stopPropagation(); onChange(Math.max(0, value - 1)); }}
        className="w-full flex-1 flex items-center justify-center text-slate-300 group-hover:text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-b-xl transition-colors active:bg-blue-50 focus:outline-none"
      >
        <ChevronDown size={20} strokeWidth={3} />
      </button>
    </div>
  );
};

const WinnerButton: React.FC<{
    team: Team;
    isWinner: boolean;
    onClick: () => void;
    lang: Translation;
    onTeamClick?: (id: string) => void;
}> = ({ team, isWinner, onClick, lang, onTeamClick }) => {
    return (
        <div className={`relative flex flex-col items-center justify-center w-24 h-28 ${isWinner ? 'transform scale-105 z-10' : ''}`}>
            <button
                onClick={onClick}
                className={`w-full h-full flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                    isWinner 
                        ? 'bg-green-50 border-green-500 shadow-md' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
                {isWinner && (
                    <div className="mb-1 text-green-600 bg-green-100 rounded-full p-0.5">
                        <Check size={12} strokeWidth={4} />
                    </div>
                )}
                
                {/* Visual Flag Display (Clickable for Intel) */}
                <div 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onTeamClick) onTeamClick(team.id);
                        else onClick();
                    }}
                    className={`w-10 h-7 rounded overflow-hidden shadow-sm border border-slate-100 mb-2 relative ${onTeamClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''}`}
                >
                    <img src={team?.flag} alt={team?.name} className="w-full h-full object-cover" />
                    {team?.rank && (
                        <div className="absolute -bottom-1 -right-1 bg-[#0f2545] text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
                            {team.rank}
                        </div>
                    )}
                </div>
                
                <span className={`text-[10px] font-black uppercase tracking-tight text-center leading-tight ${isWinner ? 'text-green-800' : 'text-slate-600'}`}>
                    {team?.name || 'TBD'}
                </span>
            </button>
        </div>
    );
};

const SimulationCard: React.FC<{
    match: Match;
    home: Team;
    away: Team;
    sim: { home: number, away: number } | undefined;
    onUpdate: (h: number, a: number) => void;
    currentUser: UserProfile;
    rivals: UserProfile[];
    allPredictions: Prediction[];
    lang: Translation;
    onTeamClick?: (id: string) => void;
}> = ({ match, home, away, sim, onUpdate, currentUser, rivals, allPredictions, lang, onTeamClick }) => {
    // State Logic
    const isLive = ['LIVE', '1H', '2H', 'HT', 'AET', 'PEN'].includes(match.status);
    const isFinished = ['FINISHED', 'FT'].includes(match.status);
    const isLocked = isLive || isFinished;
    const isModified = !!sim;

    // Determine Mode: Score (Groups/R32) vs Winner (Knockout R16+)
    const isScoreMode = !match.round || match.round === 'R32';

    // Values
    const hVal = sim ? sim.home : (match.homeScore ?? 0);
    const aVal = sim ? sim.away : (match.awayScore ?? 0);

    // Winner Logic for Buttons
    const homeWin = hVal > aVal;
    const awayWin = aVal > hVal;

    const handleFlagClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (onTeamClick) onTeamClick(id);
    };

    return (
        <div className={`bg-white rounded-2xl border shadow-sm relative flex flex-col h-full snap-center shrink-0 w-[85vw] md:w-[22rem] transition-all ${isModified ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200'}`}>
            {/* Header */}
            <div className="px-3 py-2 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 rounded-t-2xl">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {isLive ? (
                        <span className="text-red-500 flex items-center gap-1 animate-pulse"><Activity size={10} /> {lang.live}</span>
                    ) : isFinished ? (
                        <span className="flex items-center gap-1"><Clock size={10} /> {lang.ft}</span>
                    ) : (
                        <span>{new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    )}
                    {match.groupId ? <span>• Grp {match.groupId}</span> : <span>• {match.round}</span>}
                </div>
                {isModified && (
                    <div className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                        Simulated
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-4 flex items-center justify-between gap-2 flex-1">
                {isScoreMode ? (
                    <>
                        {/* Home */}
                        <div className="flex-1 flex flex-col items-center gap-2">
                            <div 
                                onClick={(e) => handleFlagClick(e, home?.id)}
                                className={`relative w-16 h-12 rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-white ${onTeamClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''}`}
                            >
                                <img src={home?.flag} alt={home?.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs font-black text-slate-700 uppercase text-center leading-tight truncate w-full">{home?.name || match.homeTeamId}</span>
                        </div>

                        {/* Steppers */}
                        <div className="flex items-center gap-2 mx-2">
                            {isLocked ? (
                                <div className="px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-3">
                                    <span className="text-2xl font-black text-slate-700">{match.homeScore}</span>
                                    <span className="text-slate-400 font-bold">:</span>
                                    <span className="text-2xl font-black text-slate-700">{match.awayScore}</span>
                                </div>
                            ) : (
                                <>
                                    <ScoreStepper value={hVal} onChange={(v) => onUpdate(v, aVal)} isLocked={isLocked} />
                                    <span className="text-slate-300 font-bold">-</span>
                                    <ScoreStepper value={aVal} onChange={(v) => onUpdate(hVal, v)} isLocked={isLocked} />
                                </>
                            )}
                        </div>

                        {/* Away */}
                        <div className="flex-1 flex flex-col items-center gap-2">
                            <div 
                                onClick={(e) => handleFlagClick(e, away?.id)}
                                className={`relative w-16 h-12 rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-white ${onTeamClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''}`}
                            >
                                <img src={away?.flag} alt={away?.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs font-black text-slate-700 uppercase text-center leading-tight truncate w-full">{away?.name || match.awayTeamId}</span>
                        </div>
                    </>
                ) : (
                    /* Knockout Winner Buttons */
                    <div className="w-full flex flex-col items-center gap-3">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang.whoAdvances}</div>
                        <div className="flex items-center justify-center gap-6 w-full">
                            <WinnerButton team={home} isWinner={homeWin} onClick={() => onUpdate(1, 0)} lang={lang} onTeamClick={onTeamClick} />
                            <div className="text-slate-300 font-black text-xs">VS</div>
                            <WinnerButton team={away} isWinner={awayWin} onClick={() => onUpdate(0, 1)} lang={lang} onTeamClick={onTeamClick} />
                        </div>
                    </div>
                )}
            </div>

            {/* Traffic Light Rival Pills - Dense Grid Layout */}
            <div className="px-3 pb-3 pt-2 border-t border-slate-50 bg-slate-50/30 rounded-b-2xl">
                <div className="flex items-center justify-between mb-1.5 opacity-60">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{lang.rivalWatch}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Scroll for more →</span>
                </div>
                
                {/* 2-Row Grid Container */}
                <div className="grid grid-rows-2 grid-flow-col gap-x-2 gap-y-2 overflow-x-auto no-scrollbar h-[4.5rem] items-start pb-1">
                    {[currentUser, ...rivals].map(u => {
                        const isMe = u.email === currentUser.email;
                        if (isMe) return null; 

                        const pred = allPredictions.find(p => p.userId === u.email && p.matchId === match.id);
                        if (!pred) return null;

                        // Traffic Light Logic
                        // Green: Exact Match (Score or Winner depending on mode)
                        // Blue: Correct Result (Winner match) but diff score
                        // Red: Wrong Result
                        let statusColor = 'bg-red-50 text-red-700 border-red-100'; // Default Red
                        
                        const predHomeWin = pred.home > pred.away;
                        const predAwayWin = pred.away > pred.home;
                        const predDraw = pred.home === pred.away;

                        const simHomeWin = hVal > aVal;
                        const simAwayWin = aVal > hVal;
                        const simDraw = hVal === aVal;

                        const isExact = pred.home === hVal && pred.away === aVal;
                        const isCorrectResult = (predHomeWin && simHomeWin) || (predAwayWin && simAwayWin) || (predDraw && simDraw);

                        if (isExact) {
                            statusColor = 'bg-green-50 text-green-700 border-green-200';
                        } else if (isCorrectResult) {
                            statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
                        }

                        // Display Value
                        let displayValue = `${pred.home}-${pred.away}`;
                        if (!isScoreMode) {
                            // Winner Code
                            if (predHomeWin) displayValue = home?.id || 'HOME';
                            else if (predAwayWin) displayValue = away?.id || 'AWAY';
                            else displayValue = 'PEN';
                        }

                        return (
                            <div
                                key={u.email}
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border shrink-0 w-28 justify-between ${statusColor}`}
                                title={`${u.name}: ${displayValue}`}
                            >
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <AvatarDisplay avatar={u.avatar} size="xs" className="w-4 h-4 text-[8px] shrink-0" />
                                    <span className="text-[9px] font-bold truncate max-w-[60px]">{u.name}</span>
                                </div>
                                <span className="text-[9px] font-black shrink-0">{displayValue}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---

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
  // State
  const [simulation, setSimulation] = useState<Record<string, { home: number, away: number }>>({});
  const [dateFilter, setDateFilter] = useState<'48h' | 'all'>('48h');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Analysis State
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysisType, setActiveAnalysisType] = useState<string | null>(null);

  const allUsers = useMemo(() => [currentUser, ...rivals], [currentUser, rivals]);

  // --- ENGINE: CALCULATE LIVE STANDINGS ---
  const { simulatedData } = useMemo(() => {
      // Base calculation on Real Matches + Simulation Overrides
      const simulatedData: Record<string, number> = {};
      allUsers.forEach(u => simulatedData[u.email] = 0);

      matches.forEach(m => {
          const sim = simulation[m.id];
          
          // Determine "Effective" Score for Simulation
          // If sim exists, use it. Else if real score exists, use it. Else ignore (0-0 or upcoming).
          let hScore = m.homeScore;
          let aScore = m.awayScore;
          let isPlayed = ['FINISHED', 'FT', 'AET', 'PEN', 'LIVE', '1H', '2H', 'HT'].includes(m.status);

          if (sim) {
              hScore = sim.home;
              aScore = sim.away;
              isPlayed = true; // Treat simulated matches as played
          }

          if (isPlayed && hScore !== null && aScore !== null) {
              allUsers.forEach(u => {
                  const pred = allPredictions.find(p => p.userId === u.email && p.matchId === m.id);
                  if (pred) {
                      simulatedData[u.email] += calculatePoints(pred.home, pred.away, hScore, aScore, u.hasTakenSecondChance, m.round);
                  }
              });
          }
      });
      return { simulatedData };
  }, [matches, allPredictions, allUsers, simulation]);

  // --- STATS FOR CURRENT USER ---
  const myStats = useMemo(() => {
      // LIVE REAL RANK (for diff comparison)
      // We need a separate calc for "Real" points to show the diff arrow
      const realPoints: Record<string, number> = {};
      allUsers.forEach(u => realPoints[u.email] = 0);
      matches.forEach(m => {
          const isRealFinished = ['FINISHED', 'FT', 'AET', 'PEN', 'LIVE', '1H', '2H', 'HT'].includes(m.status);
          if (isRealFinished && m.homeScore !== null && m.awayScore !== null) {
              allUsers.forEach(u => {
                  const pred = allPredictions.find(p => p.userId === u.email && p.matchId === m.id);
                  if (pred) realPoints[u.email] += calculatePoints(pred.home, pred.away, m.homeScore, m.awayScore, u.hasTakenSecondChance, m.round);
              });
          }
      });
      const sortedReal = [...allUsers].sort((a, b) => realPoints[b.email] - realPoints[a.email]);
      const myRealRank = sortedReal.findIndex(u => u.email === currentUser.email) + 1;

      // SIMULATED RANK
      const sortedSim = [...allUsers].sort((a, b) => simulatedData[b.email] - simulatedData[a.email]);
      const mySimRank = sortedSim.findIndex(u => u.email === currentUser.email) + 1;
      
      const mySimPts = simulatedData[currentUser.email];
      const rankDiff = myRealRank - mySimRank; // Positive means we improved (lower rank number)

      return { mySimRank, mySimPts, rankDiff };
  }, [allUsers, simulatedData, matches, allPredictions, currentUser.email]);

  // --- FILTER LOGIC (48 HRS) ---
  const relevantMatches = useMemo(() => {
      let filtered = matches.filter(m => m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD');
      
      if (dateFilter === '48h') {
          const now = new Date();
          // Reset time to ensure full day coverage
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const yesterday = today - (86400000);
          const tomorrow = today + (86400000 * 2); // End of tomorrow

          filtered = filtered.filter(m => {
              const mDate = new Date(m.date).getTime();
              // Keep if within window OR if it is LIVE (always show live)
              const isLive = ['LIVE', '1H', '2H', 'HT'].includes(m.status);
              return isLive || (mDate >= yesterday && mDate < tomorrow);
          });
      }

      return filtered.sort((a, b) => {
          // Sort Order: LIVE -> UPCOMING -> FINISHED
          const statusOrder: Record<string, number> = { 'LIVE': 0, '1H': 0, '2H': 0, 'UPCOMING': 1, 'FINISHED': 2 };
          const sA = statusOrder[a.status] ?? 1;
          const sB = statusOrder[b.status] ?? 1;
          if (sA !== sB) return sA - sB;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [matches, dateFilter]);

  const scroll = (direction: 'left' | 'right') => {
      if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const scrollAmount = container.clientWidth * 0.8;
          container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
      }
  };

  // --- HANDLERS ---
  const updateSim = (matchId: string, h: number, a: number) => {
      setSimulation(prev => ({ ...prev, [matchId]: { home: h, away: a } }));
  };

  const resetSimulation = () => setSimulation({});

  // AI ANALYSIS HANDLER
  const handleAnalysis = async (type: 'opportunity' | 'pitfall' | 'realistic' | 'roast') => {
      if (isAnalyzing) return;
      setIsAnalyzing(true);
      setActiveAnalysisType(type);
      setAnalysisResult(null);

      try {
          // Use key from constants (safer for client demo)
          const apiKey = process.env.API_KEY || HOST_KEYS[Math.floor(Math.random() * HOST_KEYS.length)];
          const ai = new GoogleGenAI({ apiKey });
          
          const promptMap = {
              opportunity: `You are a football analyst. Tell this user (Rank #${myStats.mySimRank}, ${myStats.mySimPts} pts) their best path to victory or a key swing match they predicted well. Be optimistic. Max 30 words.`,
              pitfall: `You are a pessimist football pundit. Warn this user (Rank #${myStats.mySimRank}) about a dangerous match or overconfidence. Be pessimistic. Max 30 words.`,
              realistic: `You are a neutral AI. Give a realistic projection for this user (Rank #${myStats.mySimRank}). Be analytical. Max 30 words.`,
              roast: `You are a savage comedian. Roast this user for being Rank #${myStats.mySimRank} with ${myStats.mySimPts} points. Be mean but funny. Max 30 words.`
          };

          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: promptMap[type]
          });
          
          setAnalysisResult(response.text || "AI speechles...");
      } catch (e) {
          console.error(e);
          setAnalysisResult("The pundit is taking a coffee break (Error).");
      } finally {
          setIsAnalyzing(false);
      }
  };

  return (
    <div className="flex flex-col min-h-[85vh] relative bg-slate-50 pb-32">
        
        {/* HEADER & CONTROLS */}
        <div className="bg-white px-4 py-4 border-b border-slate-200 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-[#0f2545] p-2 rounded-lg text-white">
                        <Calculator size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">{lang.simulationTitle}</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Control Center</p>
                    </div>
                </div>
                {Object.keys(simulation).length > 0 && (
                    <button onClick={resetSimulation} className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-full transition-colors" title={lang.resetSim}>
                        <RefreshCw size={18} />
                    </button>
                )}
            </div>

            {/* DATE FILTER TOGGLE */}
            <div className="flex justify-center">
                <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
                    <button 
                        onClick={() => setDateFilter('48h')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === '48h' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {lang.filterNext48}
                    </button>
                    <button 
                        onClick={() => setDateFilter('all')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === 'all' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {lang.filterAll}
                    </button>
                </div>
            </div>
        </div>

        {/* AI ANALYSIS SECTION & CAROUSEL */}
        <div className="flex-1 flex flex-col justify-start py-6 overflow-x-hidden relative">
            
            {/* Analysis Buttons */}
            <div className="px-6 mb-6">
                <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => handleAnalysis('opportunity')} className="flex flex-col items-center gap-1.5 bg-green-50 hover:bg-green-100 border border-green-200 p-3 rounded-xl transition-all active:scale-95 group">
                        <div className="bg-green-500 text-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform"><TrendingUp size={16} /></div>
                        <span className="text-[9px] font-black text-green-800 uppercase tracking-wide">{lang.analysisOpportunity}</span>
                    </button>
                    <button onClick={() => handleAnalysis('pitfall')} className="flex flex-col items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 p-3 rounded-xl transition-all active:scale-95 group">
                        <div className="bg-red-500 text-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform"><AlertTriangle size={16} /></div>
                        <span className="text-[9px] font-black text-red-800 uppercase tracking-wide">{lang.analysisPitfall}</span>
                    </button>
                    <button onClick={() => handleAnalysis('realistic')} className="flex flex-col items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 p-3 rounded-xl transition-all active:scale-95 group">
                        <div className="bg-blue-500 text-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform"><Target size={16} /></div>
                        <span className="text-[9px] font-black text-blue-800 uppercase tracking-wide">{lang.analysisRealistic}</span>
                    </button>
                    <button onClick={() => handleAnalysis('roast')} className="flex flex-col items-center gap-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 p-3 rounded-xl transition-all active:scale-95 group">
                        <div className="bg-orange-500 text-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform"><Flame size={16} fill="currentColor" /></div>
                        <span className="text-[9px] font-black text-orange-800 uppercase tracking-wide">{lang.analysisRoast}</span>
                    </button>
                </div>

                {/* Analysis Result Card */}
                {(isAnalyzing || analysisResult) && (
                    <div className="mt-4 bg-white rounded-2xl shadow-lg border border-slate-100 p-4 relative animate-in slide-in-from-top-2 fade-in">
                        {analysisResult && <button onClick={() => setAnalysisResult(null)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"><X size={16} /></button>}
                        <div className="flex gap-3">
                            <div className={`p-2.5 rounded-full shrink-0 h-fit ${isAnalyzing ? 'bg-slate-100 animate-pulse' : 'bg-[#0f2545] text-white'}`}>
                                {isAnalyzing ? <RefreshCw size={20} className="animate-spin text-slate-400" /> : <MessageSquareQuote size={20} />}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                    {isAnalyzing ? "Analysing..." : activeAnalysisType === 'roast' ? lang.punditSays : lang.aiInsight}
                                </h4>
                                {isAnalyzing ? (
                                    <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                                ) : (
                                    <p className="text-sm font-medium text-slate-800 leading-relaxed italic">
                                        "{analysisResult}"
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop Navigation Arrows - Updated Design */}
            <button 
                onClick={() => scroll('left')}
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-16 h-16 bg-black/10 hover:bg-black/20 backdrop-blur-sm rounded-full items-center justify-center text-slate-600 hover:text-slate-800 transition-all active:scale-95 border border-white/20"
            >
                <ChevronLeft size={40} strokeWidth={1.5} />
            </button>
            <button 
                onClick={() => scroll('right')}
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-16 h-16 bg-black/10 hover:bg-black/20 backdrop-blur-sm rounded-full items-center justify-center text-slate-600 hover:text-slate-800 transition-all active:scale-95 border border-white/20"
            >
                <ChevronRight size={40} strokeWidth={1.5} />
            </button>

            <div 
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 no-scrollbar pb-8 pt-2 items-stretch min-h-[300px]"
                style={{ scrollPaddingLeft: '1.5rem', scrollPaddingRight: '1.5rem' }}
            >
                {relevantMatches.length > 0 ? (
                    relevantMatches.map(match => (
                        <SimulationCard 
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
                            onTeamClick={onTeamClick}
                        />
                    ))
                ) : (
                    <div className="w-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <Calendar size={48} className="mb-2" />
                        <span className="text-sm font-bold uppercase tracking-widest">No matches in 48h</span>
                    </div>
                )}
            </div>
        </div>

        {/* STICKY SIMULATION FOOTER */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0f2545] border-t border-white/10 text-white p-4 pb-8 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <AvatarDisplay avatar={currentUser.avatar} size="md" className="ring-2 ring-white/20" />
                        {/* Live Rank Badge */}
                        <div className="absolute -top-2 -right-2 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-[#0f2545] w-6 h-6 shadow-md">
                            #{myStats.mySimRank}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest opacity-80">{lang.simulatedRank}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black tracking-tight">{myStats.mySimPts} pts</span>
                        </div>
                    </div>
                </div>

                {/* Diff Indicator */}
                <div className="flex items-center">
                    {myStats.rankDiff !== 0 ? (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${myStats.rankDiff > 0 ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'}`}>
                            {myStats.rankDiff > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            <span className="font-black text-sm">
                                {myStats.rankDiff > 0 ? `+${myStats.rankDiff}` : myStats.rankDiff}
                            </span>
                        </div>
                    ) : (
                        <div className="px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-800/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            No Change
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
