import React, { useState, useMemo, useRef } from 'react';
import { UserProfile, Match, Prediction, Team, Translation, LanguageCode } from '../types';
import { calculatePoints } from '../services/engine';
import { AvatarDisplay } from './AvatarDisplay';
import { TrendingUp, TrendingDown, Calculator, ChevronUp, ChevronDown, RefreshCw, Filter, Check, Minus, Trophy, ArrowRight, Activity, Clock, Calendar, AlertTriangle, Flame, Target, MessageSquareQuote, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
    // Current Values (Real or Simulated)
    const hVal = sim ? sim.home : (match.homeScore ?? 0);
    const aVal = sim ? sim.away : (match.awayScore ?? 0);
    
    // Derived States
    const isSimulated = !!sim;
    const isLive = ['LIVE', '1H', '2H', 'HT', 'AET', 'PEN'].includes(match.status);
    const isFinished = ['FINISHED', 'FT'].includes(match.status);
    
    // Quick Actions
    const setHomeWin = () => onUpdate(Math.max(hVal, aVal + 1), aVal);
    const setDraw = () => onUpdate(Math.max(hVal, 1), Math.max(hVal, 1)); 
    const setAwayWin = () => onUpdate(hVal, Math.max(aVal, hVal + 1));

    // --- RIVAL SORTING LOGIC ---
    const { homePreds, drawPreds, awayPreds } = useMemo(() => {
        const h: { u: UserProfile, p: Prediction }[] = [];
        const d: { u: UserProfile, p: Prediction }[] = [];
        const a: { u: UserProfile, p: Prediction }[] = [];

        // Combine Rivals AND Current User for the view
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

    // Helper to render a prediction pill
    const renderPill = (item: { u: UserProfile, p: Prediction }) => {
        const { u, p } = item;
        const isMe = u.email === currentUser.email;
        
        // Traffic Light Logic (Green = Exact, Blue = Correct Winner, Red = Wrong)
        let statusColor = 'bg-red-50 text-red-700 border-red-100 opacity-80'; 
        
        const predHomeWin = p.home > p.away;
        const predAwayWin = p.away > p.home;
        const predDraw = p.home === p.away;

        const simHomeWin = hVal > aVal;
        const simAwayWin = aVal > hVal;
        const simDraw = hVal === aVal;

        const isExact = p.home === hVal && p.away === aVal;
        const isCorrectResult = (predHomeWin && simHomeWin) || (predAwayWin && simAwayWin) || (predDraw && simDraw);

        if (isExact) statusColor = 'bg-green-100 text-green-800 border-green-300 shadow-sm';
        else if (isCorrectResult) statusColor = 'bg-blue-50 text-blue-700 border-blue-200';

        if (isMe) statusColor += ' ring-1 ring-offset-1 ring-slate-400';

        return (
            <button
                key={u.email}
                onClick={(e) => {
                    e.stopPropagation();
                    onUpdate(p.home, p.away); // CLICK TO SIMULATE THIS SCORE
                }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-bold transition-all hover:scale-105 active:scale-95 ${statusColor}`}
                title={`Set simulation to ${p.home}-${p.away}`}
            >
                <AvatarDisplay avatar={u.avatar} size="xs" className="w-3.5 h-3.5" />
                <span className="truncate max-w-[50px]">{u.name}</span>
                <span className="font-black ml-0.5">{p.home}-{p.away}</span>
            </button>
        );
    };

    return (
        <div className={`bg-white rounded-xl border shadow-sm p-3 transition-all duration-300 ${isSimulated ? 'border-blue-400 ring-1 ring-blue-50' : 'border-slate-200'}`}>
            
            {/* 1. Header: Time & Context */}
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {isLive ? (
                        <span className="text-red-500 animate-pulse">● LIVE</span>
                    ) : (
                        <span>{new Date(match.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    )}
                    <span className="text-slate-300">•</span>
                    <span>{match.groupId ? `Group ${match.groupId}` : match.round}</span>
                </div>
            </div>

            {/* 2. Teams & Score Controls */}
            <div className="flex items-center justify-between gap-2 mb-4">
                {/* Home */}
                <div className="flex-1 flex items-center gap-2 overflow-hidden">
                    <img src={home?.flag} alt="" className="w-6 h-4 rounded shadow-sm object-cover shrink-0" />
                    <span className="text-xs font-black text-slate-800 truncate">{home?.name}</span>
                </div>

                {/* Score Input */}
                <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200 shrink-0">
                    <button onClick={() => onUpdate(Math.max(0, hVal - 1), aVal)} className="w-6 h-8 flex items-center justify-center hover:bg-white rounded text-slate-400 hover:text-slate-600 font-bold">-</button>
                    <div className={`w-8 h-8 flex items-center justify-center font-black text-lg leading-none ${isSimulated ? 'text-blue-600' : 'text-slate-800'}`}>{hVal}</div>
                    <button onClick={() => onUpdate(hVal + 1, aVal)} className="w-6 h-8 flex items-center justify-center hover:bg-white rounded text-slate-400 hover:text-blue-600 font-bold">+</button>
                    
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    
                    <button onClick={() => onUpdate(hVal, Math.max(0, aVal - 1))} className="w-6 h-8 flex items-center justify-center hover:bg-white rounded text-slate-400 hover:text-slate-600 font-bold">-</button>
                    <div className={`w-8 h-8 flex items-center justify-center font-black text-lg leading-none ${isSimulated ? 'text-blue-600' : 'text-slate-800'}`}>{aVal}</div>
                    <button onClick={() => onUpdate(hVal, aVal + 1)} className="w-6 h-8 flex items-center justify-center hover:bg-white rounded text-slate-400 hover:text-blue-600 font-bold">+</button>
                </div>

                {/* Away */}
                <div className="flex-1 flex items-center gap-2 justify-end overflow-hidden">
                    <span className="text-xs font-black text-slate-800 truncate text-right">{away?.name}</span>
                    <img src={away?.flag} alt="" className="w-6 h-4 rounded shadow-sm object-cover shrink-0" />
                </div>
            </div>

            {/* 3. Quick Sim Buttons */}
            {!isFinished && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <button onClick={setHomeWin} className="py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors uppercase tracking-wider">
                        {home?.code || 'HOME'}
                    </button>
                    <button onClick={setDraw} className="py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors uppercase tracking-wider">
                        Draw
                    </button>
                    <button onClick={setAwayWin} className="py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors uppercase tracking-wider">
                        {away?.code || 'AWAY'}
                    </button>
                </div>
            )}

            {/* 4. RIVAL BATTLEFIELD (Left/Center/Right Layout) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100/50">
                {/* Home Predictions (Left) */}
                {homePreds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-start">
                        {homePreds.map(renderPill)}
                    </div>
                )}
                
                {/* Draw Predictions (Center) */}
                {drawPreds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-center">
                        {drawPreds.map(renderPill)}
                    </div>
                )}

                {/* Away Predictions (Right) */}
                {awayPreds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                        {awayPreds.map(renderPill)}
                    </div>
                )}

                {homePreds.length === 0 && drawPreds.length === 0 && awayPreds.length === 0 && (
                    <div className="text-center text-[9px] text-slate-300 italic py-1">No predictions visible</div>
                )}
            </div>
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
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysisType, setActiveAnalysisType] = useState<string | null>(null);

  const allUsers = useMemo(() => [currentUser, ...rivals], [currentUser, rivals]);

  // 1. Calculate Live / Simulated Standings
  const stats = useMemo(() => {
      const livePoints: Record<string, number> = {};
      const simPoints: Record<string, number> = {};
      
      allUsers.forEach(u => {
          livePoints[u.email] = 0;
          simPoints[u.email] = 0;
      });

      matches.forEach(m => {
          const sim = simulation[m.id];
          const hasRealScore = m.homeScore !== null && m.awayScore !== null;
          
          let effHome = hasRealScore ? m.homeScore : null;
          let effAway = hasRealScore ? m.awayScore : null;
          
          if (sim) {
              effHome = sim.home;
              effAway = sim.away;
          }

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

      const sortUsers = (pointsMap: Record<string, number>) => 
          [...allUsers].sort((a,b) => pointsMap[b.email] - pointsMap[a.email]);

      const liveRanked = sortUsers(livePoints);
      const simRanked = sortUsers(simPoints);

      const myLiveRank = liveRanked.findIndex(u => u.email === currentUser.email) + 1;
      const mySimRank = simRanked.findIndex(u => u.email === currentUser.email) + 1;
      const rankDiff = myLiveRank - mySimRank; 

      return { 
          liveRank: myLiveRank, 
          simRank: mySimRank, 
          simPts: simPoints[currentUser.email],
          rankDiff 
      };
  }, [matches, simulation, allPredictions, allUsers, currentUser]);

  // 2. Filter Matches
  const displayMatches = useMemo(() => {
      let filtered = matches.filter(m => m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD');
      const now = Date.now();
      
      filtered.sort((a, b) => {
          const isLiveA = ['LIVE', '1H', '2H', 'HT'].includes(a.status);
          const isLiveB = ['LIVE', '1H', '2H', 'HT'].includes(b.status);
          if (isLiveA && !isLiveB) return -1;
          if (!isLiveA && isLiveB) return 1;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      if (!showAllMatches) {
          filtered = filtered.filter(m => {
              const mTime = new Date(m.date).getTime();
              const isFuture = mTime > (now - 3 * 60 * 60 * 1000); 
              const isLive = ['LIVE', '1H', '2H', 'HT'].includes(m.status);
              return isFuture || isLive;
          });
          return filtered.slice(0, 10);
      }
      return filtered;
  }, [matches, showAllMatches]);

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
          
          const promptMap = {
              opportunity: `Tell this football fan (Rank #${stats.simRank}) best case scenario for upcoming games. Optimistic. Max 30 words.`,
              pitfall: `Warn this fan (Rank #${stats.simRank}) about a dangerous match. Pessimistic. Max 30 words.`,
              realistic: `Give realistic projection for user at Rank #${stats.simRank}. Max 30 words.`,
              roast: `Roast this user for being Rank #${stats.simRank}. Be mean/funny. Max 30 words.`
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

        {/* STICKY IMPACT BAR */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm px-4 py-3 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Simulated Rank</span>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-slate-800">#{stats.simRank}</span>
                    {stats.rankDiff !== 0 && (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${stats.rankDiff > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {stats.rankDiff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {stats.rankDiff > 0 ? `+${stats.rankDiff}` : stats.rankDiff}
                        </div>
                    )}
                </div>
            </div>
            
            {Object.keys(simulation).length > 0 ? (
                <button 
                    onClick={() => setSimulation({})}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                >
                    <RefreshCw size={14} /> Reset
                </button>
            ) : (
                <div className="flex items-center gap-2 opacity-40">
                    <Calculator size={16} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-400">Simulator Active</span>
                </div>
            )}
        </div>

        {/* SCENARIO STACK */}
        <div className="flex-1 p-4 space-y-4 pb-20">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    {showAllMatches ? "All Matches" : "Upcoming Scenarios"}
                </h3>
                <button 
                    onClick={() => setShowAllMatches(!showAllMatches)}
                    className="text-[10px] font-bold text-blue-600 flex items-center gap-1"
                >
                    {showAllMatches ? "Show Upcoming" : "Show All"} <Filter size={10} />
                </button>
            </div>

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
                <div className="text-center py-10 opacity-50">
                    <p>No upcoming matches found.</p>
                </div>
            )}
            
            {!showAllMatches && matches.length > 10 && (
                <button 
                    onClick={() => setShowAllMatches(true)}
                    className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                    Load More Matches
                </button>
            )}
        </div>
    </div>
  );
};