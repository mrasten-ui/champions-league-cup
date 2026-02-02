import React, { useState, useMemo } from 'react';
import { UserProfile, Match, Prediction, Team, Translation, LanguageCode, GroupStanding } from '../types';
import { calculatePoints, calculateGroupStandings, getThirdPlaceStandings, getAllGroupStandings, applyPredictionsToBracket, updateBracket } from '../services/engine';
import { getSlotSource } from '../utils/bracketHelpers';
import { AvatarDisplay } from './AvatarDisplay';
import { DateRibbon } from './DateRibbon';
import { TrendingUp, TrendingDown, Calculator, ChevronUp, ChevronDown, RefreshCw, Filter, Check, Trophy, AlertTriangle, Flame, Target, MessageSquareQuote, Calendar, HelpCircle, ChevronRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { HOST_KEYS } from '../constants';

// --- SUB-COMPONENTS ---

const ScoreStepper: React.FC<{ 
    value: number; 
    onChange: (val: number) => void; 
    isLocked: boolean;
    isSimulated: boolean;
}> = ({ value, onChange, isLocked, isSimulated }) => {
  return (
    <div className={`flex flex-col items-center justify-between w-12 h-20 bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm group ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:border-purple-300 hover:shadow-md'}`}>
      <button 
        disabled={isLocked}
        onClick={(e) => { e.stopPropagation(); onChange(value + 1); }}
        className={`w-full flex-1 flex items-center justify-center rounded-t-xl transition-colors active:bg-purple-50 focus:outline-none ${isSimulated ? 'text-purple-400 group-hover:text-purple-600' : 'text-slate-400 group-hover:text-blue-600'}`}
      >
        <ChevronUp size={18} strokeWidth={3} />
      </button>
      
      <div className={`h-8 flex items-center justify-center text-xl font-black leading-none select-none z-10 bg-white w-full border-y border-slate-100 ${isSimulated ? 'text-purple-600' : 'text-slate-800'}`}>
        {value}
      </div>
      
      <button 
        disabled={isLocked}
        onClick={(e) => { e.stopPropagation(); onChange(Math.max(0, value - 1)); }}
        className={`w-full flex-1 flex items-center justify-center rounded-b-xl transition-colors active:bg-purple-50 focus:outline-none ${isSimulated ? 'text-purple-400 group-hover:text-purple-600' : 'text-slate-400 group-hover:text-blue-600'}`}
      >
        <ChevronDown size={18} strokeWidth={3} />
      </button>
    </div>
  );
};

const WinnerButton: React.FC<{
    team: Team | undefined;
    label: string;
    isSelected: boolean;
    onClick: () => void;
}> = ({ team, label, isSelected, onClick }) => (
    <button 
        onClick={onClick}
        // Fixed height to prevent layout shift
        className={`flex flex-col items-center justify-center gap-2 p-2 rounded-xl border-2 transition-all w-full h-[90px] ${isSelected ? 'bg-purple-50 border-purple-500 shadow-md ring-1 ring-purple-200' : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50'}`}
    >
        <div className="relative">
            {team ? (
                <img src={team.flag} alt={team.name} className="w-10 h-7 object-cover rounded shadow-sm" />
            ) : (
                // TBD State - clearly shows the label (e.g. "1A")
                <div className="w-10 h-7 bg-slate-100 rounded border border-slate-200 flex items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
                </div>
            )}
            {isSelected && <div className="absolute -right-2 -top-2 bg-purple-500 text-white p-0.5 rounded-full shadow-sm border-2 border-white"><Check size={10} strokeWidth={4} /></div>}
        </div>
        <span className={`text-[10px] font-black uppercase tracking-tight text-center leading-none max-w-full truncate px-1 line-clamp-2 ${isSelected ? 'text-purple-800' : 'text-slate-500'}`}>
            {team ? team.name : "TBD"}
        </span>
    </button>
);

const PredictionPill: React.FC<{
    user: UserProfile;
    label: string;
    status: 'exact' | 'correct' | 'wrong' | 'neutral'; 
    isMe: boolean;
    onSelect?: () => void;
    align: 'left' | 'center' | 'right';
}> = ({ user, label, status, isMe, onSelect, align }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    let baseClass = 'bg-slate-50 text-slate-400 border-slate-100 opacity-80';
    if (status === 'exact') baseClass = 'bg-green-100 text-green-800 border-green-300 ring-1 ring-green-200 opacity-100';
    if (status === 'correct') baseClass = 'bg-blue-50 text-blue-700 border-blue-200 opacity-100';
    
    if (isMe) baseClass += ' ring-2 ring-purple-400 ring-offset-1 font-black opacity-100';

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if(onSelect) onSelect();
        setIsExpanded(!isExpanded);
    };

    return (
        <button
            onClick={handleClick}
            className={`
                flex items-center gap-1.5 px-1.5 py-1 rounded-lg border text-[9px] font-bold transition-all shadow-sm
                ${baseClass} ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}
                ${isExpanded ? 'z-10 scale-105' : 'hover:scale-105'}
            `}
            title={`Predicted: ${label}`}
        >
            <AvatarDisplay avatar={user.avatar} size="xs" className="w-4 h-4 rounded-full bg-white shadow-sm" />
            {isExpanded && <span className="truncate max-w-[60px] animate-in fade-in zoom-in duration-200">{user.name.split(' ')[0]}</span>}
            <span className={`font-black ${isExpanded ? 'text-[10px]' : ''}`}>{label}</span>
        </button>
    );
};

const StandingsStrip: React.FC<{
    standings: GroupStanding[];
    teams: Record<string, Team>;
    qualifiedThirdsSet: Set<string>;
}> = ({ standings, teams, qualifiedThirdsSet }) => {
    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 w-full">
            {standings.map((row, index) => {
                const rank = index + 1;
                let badgeColor = 'bg-slate-800/50 text-slate-300 border-slate-600/50'; 
                let rankIndicator = null;

                if (rank <= 2) {
                    badgeColor = 'bg-emerald-600 text-white border-emerald-500 shadow-sm';
                } else if (rank === 3) {
                    if (qualifiedThirdsSet.has(row.teamId)) {
                        badgeColor = 'bg-amber-500 text-[#0f2545] border-amber-400 shadow-sm';
                        rankIndicator = <span className="text-[8px] font-black bg-white/20 px-1 rounded ml-1">Q</span>;
                    } else {
                        badgeColor = 'bg-slate-600 text-slate-300 border-slate-500 opacity-80';
                        rankIndicator = <span className="text-[8px] font-bold text-red-300 ml-1">X</span>;
                    }
                }

                const teamName = teams[row.teamId]?.name || row.teamId;
                const teamCode = teamName.substring(0,3).toUpperCase();

                return (
                    <div key={row.teamId} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${badgeColor} shrink-0`}>
                        <span className="text-[9px] font-black">{rank}.</span>
                        <img src={teams[row.teamId]?.flag} className="w-4 h-3 object-cover rounded shadow-sm" alt="" />
                        <span className="text-[9px] font-bold">{teamCode}</span>
                        <span className="text-[9px] font-black opacity-80 border-l border-white/20 pl-1.5 ml-0.5">{row.pts}p</span>
                        {rankIndicator}
                    </div>
                );
            })}
        </div>
    );
};

const SimRow: React.FC<{
    match: Match;
    home: Team | undefined;
    away: Team | undefined;
    sim: { home: number, away: number } | undefined;
    onUpdate: (h: number, a: number) => void;
    currentUser: UserProfile;
    rivals: UserProfile[];
    allPredictions: Prediction[];
    userBracketData: Map<string, Record<string, { home: string, away: string, winner: string }>>;
    lang: Translation;
    groupStandings?: GroupStanding[];
    teams: Record<string, Team>;
    qualifiedThirdsSet: Set<string>;
}> = ({ match, home, away, sim, onUpdate, currentUser, rivals, allPredictions, userBracketData, lang, groupStandings, teams, qualifiedThirdsSet }) => {
    const hVal = sim ? sim.home : (match.homeScore ?? 0);
    const aVal = sim ? sim.away : (match.awayScore ?? 0);
    
    const isSimulated = !!sim;
    const isLive = ['LIVE', '1H', '2H', 'HT', 'AET', 'PEN'].includes(match.status);
    const isKnockout = !match.groupId;
    
    // TBD Sources
    const homeSource = useMemo(() => getSlotSource(match.id, 'home'), [match.id]);
    const awaySource = useMemo(() => getSlotSource(match.id, 'away'), [match.id]);
    
    // Logic: If home (Team Object) exists, use its name. Otherwise use the source label (e.g. "1A")
    const homeLabel = home ? home.name : (homeSource?.label || 'TBD');
    const awayLabel = away ? away.name : (awaySource?.label || 'TBD');

    // --- RIVAL SORTING: "Visual Confirmation" Logic ---
    const { homePreds, drawPreds, awayPreds } = useMemo(() => {
        const h: { u: UserProfile, label: string, status: 'exact' | 'correct' | 'wrong' | 'neutral' }[] = [];
        const d: { u: UserProfile, label: string, status: 'exact' | 'correct' | 'wrong' | 'neutral' }[] = [];
        const a: { u: UserProfile, label: string, status: 'exact' | 'correct' | 'wrong' | 'neutral' }[] = [];

        [currentUser, ...rivals].forEach(u => {
            if (match.groupId) {
                // GROUP STAGE
                const p = allPredictions.find(pred => pred.userId === u.email && pred.matchId === match.id);
                if (p) {
                    const label = `${p.home}-${p.away}`;
                    const isExact = (p.home === hVal && p.away === aVal);
                    
                    // Determine Outcome (Home Win, Draw, Away Win)
                    const predOutcome = p.home > p.away ? 'H' : p.home < p.away ? 'A' : 'D';
                    const simOutcome = hVal > aVal ? 'H' : hVal < aVal ? 'A' : 'D';
                    const isCorrectOutcome = predOutcome === simOutcome;

                    let status: 'exact' | 'correct' | 'wrong' | 'neutral' = 'wrong';
                    if (isExact) status = 'exact';
                    else if (isCorrectOutcome) status = 'correct';

                    if (p.home > p.away) h.push({ u, label, status });
                    else if (p.away > p.home) a.push({ u, label, status });
                    else d.push({ u, label, status });
                }
            } else {
                // KNOCKOUT: Visual Confirmation Logic
                const userBracket = userBracketData.get(u.email);
                const userMatchState = userBracket ? userBracket[match.id] : null;

                if (userMatchState) {
                    const userHomeTeam = teams[userMatchState.home];
                    const userAwayTeam = teams[userMatchState.away];
                    const userWinnerId = userMatchState.winner;

                    // CHECK HOME SLOT
                    if (home) {
                        // Flag Visible: Check if user has this team ANYWHERE in this match
                        if (userMatchState.home === home.id || userMatchState.away === home.id) {
                            const picksWin = userWinnerId === home.id;
                            h.push({ u, label: picksWin ? 'WIN' : '-', status: picksWin ? 'exact' : 'wrong' });
                        }
                    } else {
                        // TBD: Show user's HOME slot team if simulated
                        if (userHomeTeam) {
                            const picksWin = userWinnerId === userHomeTeam.id;
                            h.push({ u, label: userHomeTeam.code, status: picksWin ? 'exact' : 'neutral' });
                        }
                    }

                    // CHECK AWAY SLOT
                    if (away) {
                        if (userMatchState.home === away.id || userMatchState.away === away.id) {
                            const picksWin = userWinnerId === away.id;
                            a.push({ u, label: picksWin ? 'WIN' : '-', status: picksWin ? 'exact' : 'wrong' });
                        }
                    } else {
                        // TBD
                        if (userAwayTeam) {
                            const picksWin = userWinnerId === userAwayTeam.id;
                            a.push({ u, label: userAwayTeam.code, status: picksWin ? 'exact' : 'neutral' });
                        }
                    }
                }
            }
        });
        return { homePreds: h, drawPreds: d, awayPreds: a };
    }, [currentUser, rivals, allPredictions, match.id, userBracketData, home, away, hVal, aVal, teams]);

    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 flex flex-col ${isSimulated ? 'border-purple-400 ring-2 ring-purple-50' : 'border-slate-200'}`}>
            
            {/* PURPLE HEADER */}
            <div className="bg-[#2e1065] p-3 border-b border-purple-900/50 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[9px] font-black text-purple-200 uppercase tracking-widest">
                        {isLive ? <span className="text-red-400 animate-pulse">● LIVE</span> : <span>{new Date(match.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
                        <span className="text-purple-700">|</span>
                        <span>{match.groupId ? `Group ${match.groupId}` : match.round}</span>
                    </div>
                    {isSimulated && (
                        <div className="flex items-center gap-1 text-[8px] font-black text-[#2e1065] bg-purple-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            <Calculator size={8} /> Sim
                        </div>
                    )}
                </div>
                
                {groupStandings && (
                    <StandingsStrip standings={groupStandings} teams={teams} qualifiedThirdsSet={qualifiedThirdsSet} />
                )}
            </div>

            {/* MATCH CONTENT */}
            <div className="p-3 grid grid-cols-3 gap-2">
                {/* LEFT: HOME - Fixed Layout */}
                <div className="flex flex-col gap-2 justify-start h-full">
                    {!isKnockout ? (
                        <div className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 rounded-xl border border-slate-100 h-[90px]">
                            {home ? (
                                <>
                                    <img src={home.flag} alt="" className="w-10 h-7 rounded shadow-sm object-cover" />
                                    <span className="text-[10px] font-black text-slate-800 uppercase text-center leading-tight line-clamp-2">{home.name}</span>
                                </>
                            ) : (
                                <span className="text-[8px] font-bold uppercase">{homeLabel}</span>
                            )}
                        </div>
                    ) : (
                        <WinnerButton team={home} label={homeLabel} isSelected={hVal > aVal} onClick={() => onUpdate(1, 0)} />
                    )}

                    <div className="flex flex-wrap content-start gap-1.5 mt-1">
                        {homePreds.map(item => (
                            <PredictionPill 
                                key={item.u.email} 
                                user={item.u} 
                                label={item.label}
                                status={item.status}
                                isMe={item.u.email === currentUser.email} 
                                onSelect={match.groupId ? () => { 
                                    const p = allPredictions.find(pred => pred.userId === item.u.email && pred.matchId === match.id);
                                    if(p) onUpdate(p.home, p.away);
                                } : () => onUpdate(1, 0)} 
                                align="left" 
                            />
                        ))}
                    </div>
                </div>

                {/* CENTER: SCORE / VS - Fixed Layout */}
                <div className="flex flex-col gap-2 items-center justify-start h-full">
                    {!isKnockout ? (
                        <div className="flex items-center gap-1.5 h-[90px]">
                            <ScoreStepper value={hVal} onChange={(v) => onUpdate(v, aVal)} isLocked={false} isSimulated={isSimulated} />
                            <span className="text-slate-300 font-bold">-</span>
                            <ScoreStepper value={aVal} onChange={(v) => onUpdate(hVal, v)} isLocked={false} isSimulated={isSimulated} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[90px] w-full">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-inner">VS</div>
                        </div>
                    )}
                    
                    {!isKnockout && (
                        <div className="flex flex-wrap justify-center gap-1.5 w-full mt-1">
                            {drawPreds.length > 0 && <div className="h-px bg-slate-100 w-full my-0.5"></div>}
                            {drawPreds.map(item => (
                                <PredictionPill 
                                    key={item.u.email} 
                                    user={item.u} 
                                    label={item.label}
                                    status={item.status}
                                    isMe={item.u.email === currentUser.email}
                                    onSelect={() => {
                                        const p = allPredictions.find(pred => pred.userId === item.u.email && pred.matchId === match.id);
                                        if(p) onUpdate(p.home, p.away);
                                    }}
                                    align="center" 
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT: AWAY - Fixed Layout */}
                <div className="flex flex-col gap-2 justify-start h-full">
                    {!isKnockout ? (
                        <div className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 rounded-xl border border-slate-100 h-[90px]">
                            {away ? (
                                <>
                                    <img src={away.flag} alt="" className="w-10 h-7 rounded shadow-sm object-cover" />
                                    <span className="text-[10px] font-black text-slate-800 uppercase text-center leading-tight line-clamp-2">{away.name}</span>
                                </>
                            ) : (
                                <span className="text-[8px] font-bold uppercase">{awayLabel}</span>
                            )}
                        </div>
                    ) : (
                        <WinnerButton team={away} label={awayLabel} isSelected={aVal > hVal} onClick={() => onUpdate(0, 1)} />
                    )}

                    <div className="flex flex-wrap justify-end content-start gap-1.5 mt-1">
                        {awayPreds.map(item => (
                            <PredictionPill 
                                key={item.u.email} 
                                user={item.u} 
                                label={item.label}
                                status={item.status}
                                isMe={item.u.email === currentUser.email} 
                                onSelect={match.groupId ? () => { 
                                    const p = allPredictions.find(pred => pred.userId === item.u.email && pred.matchId === match.id);
                                    if(p) onUpdate(p.home, p.away);
                                } : () => onUpdate(0, 1)} 
                                align="right" 
                            />
                        ))}
                    </div>
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
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hidden sm:inline">{isExpanded ? "Hide Table" : "Full Table"}</span>
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
  const [simulation, setSimulation] = useState<Record<string, { home: number, away: number }>>({});
  const todayStr = new Date().toDateString();
  const [filterDate, setFilterDate] = useState<string>(todayStr);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysisType, setActiveAnalysisType] = useState<string | null>(null);

  const allUsers = useMemo(() => [currentUser, ...rivals], [currentUser, rivals]);

  // 1. CALCULATE BRACKET (MEMOIZED)
  const userBracketData = useMemo(() => {
      const map = new Map<string, Record<string, { home: string, away: string, winner: string }>>();
      allUsers.forEach(u => {
          const userPreds = allPredictions.filter(p => p.userId === u.email);
          const userMatches = applyPredictionsToBracket(matches, teams, userPreds);
          const matchData: Record<string, { home: string, away: string, winner: string }> = {};
          
          userMatches.forEach(m => {
              if (m.homeScore !== null && m.awayScore !== null) {
                  matchData[m.id] = {
                      home: m.homeTeamId,
                      away: m.awayTeamId,
                      winner: m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId
                  };
              }
          });
          map.set(u.email, matchData);
      });
      return map;
  }, [allUsers, matches, teams, allPredictions]);

  // 2. SIMULATION ENGINE + PULL THROUGH
  const { combinedStats, simulatedMatches, qualifiedThirdsSet } = useMemo(() => {
      // Create a "Simulated World" array of matches
      let simMatches = matches.map(m => {
          const sim = simulation[m.id];
          if (sim) return { ...m, homeScore: sim.home, awayScore: sim.away, status: 'FINISHED' as Match['status'] };
          return m;
      });

      // PULL THROUGH: Run bracket logic multiple times to propagate results
      for (let i = 0; i < 6; i++) {
          simMatches = updateBracket(simMatches, teams);
      }

      const livePoints: Record<string, number> = {};
      const simPoints: Record<string, number> = {};
      allUsers.forEach(u => { livePoints[u.email] = 0; simPoints[u.email] = 0; });

      simMatches.forEach(m => {
          const hasRealScore = matches.find(rm => rm.id === m.id)?.homeScore !== null;
          const hasSimScore = m.homeScore !== null && m.homeScore !== undefined;

          allUsers.forEach(u => {
              const pred = allPredictions.find(p => p.userId === u.email && p.matchId === m.id);
              if (pred) {
                  if (hasRealScore) livePoints[u.email] += calculatePoints(pred.home, pred.away, m.homeScore, m.awayScore, u.hasTakenSecondChance, m.round);
                  if (hasSimScore) simPoints[u.email] += calculatePoints(pred.home, pred.away, m.homeScore, m.awayScore, u.hasTakenSecondChance, m.round);
              }
          });
      });

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
              diff: liveRank - simRank 
          };
      });

      const allGroupStandings = getAllGroupStandings(simMatches, teams);
      const thirds = getThirdPlaceStandings(allGroupStandings);
      const qualifiedThirdsSet = new Set(thirds.slice(0, 8).map(t => t.teamId));

      return { combinedStats, simulatedMatches: simMatches, qualifiedThirdsSet };
  }, [matches, simulation, allPredictions, allUsers, teams]);

  // 3. DATE FILTERING (Include TBD matches)
  const uniqueDates = useMemo(() => {
      const dates = new Set<string>();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 3); 

      simulatedMatches.forEach(m => {
          if (m.date && m.date !== 'TBD') {
              const d = new Date(m.date);
              if (d >= cutoff) dates.add(d.toDateString());
          }
      });
      return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [simulatedMatches]);

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
          
          const myStat = combinedStats.find(s => s.user.email === currentUser.email);
          const rank = myStat?.rank || 99;

          const promptMap = {
              opportunity: `Tell this football fan (Rank #${rank}) best case scenario. Optimistic. Max 30 words.`,
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
            
            <div className="grid grid-cols-4 gap-2 mt-4">
                <button onClick={() => handleAnalysis('opportunity')} className="flex flex-col items-center gap-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all"><TrendingUp size={14} className="text-green-300" /><span className="text-[8px] font-bold uppercase">Best Case</span></button>
                <button onClick={() => handleAnalysis('pitfall')} className="flex flex-col items-center gap-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all"><AlertTriangle size={14} className="text-red-300" /><span className="text-[8px] font-bold uppercase">Worst Case</span></button>
                <button onClick={() => handleAnalysis('realistic')} className="flex flex-col items-center gap-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all"><Target size={14} className="text-blue-300" /><span className="text-[8px] font-bold uppercase">Realistic</span></button>
                <button onClick={() => handleAnalysis('roast')} className="flex flex-col items-center gap-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all"><Flame size={14} className="text-orange-300" /><span className="text-[8px] font-bold uppercase">Roast Me</span></button>
            </div>

            {(isAnalyzing || analysisResult) && (
                <div className="mt-3 bg-white/10 border border-white/10 rounded-xl p-3 backdrop-blur-sm animate-in fade-in slide-in-from-top-1">
                    <div className="flex gap-2 items-start">
                        {isAnalyzing ? <RefreshCw size={14} className="animate-spin mt-0.5" /> : <MessageSquareQuote size={14} className="mt-0.5" />}
                        <p className="text-xs font-medium leading-relaxed italic opacity-90">{isAnalyzing ? "Analysing scenarios..." : `"${analysisResult}"`}</p>
                    </div>
                </div>
            )}
        </div>

        <DateRibbon dates={uniqueDates} selectedDate={filterDate} onDateSelect={setFilterDate} lang={lang} />

        <SimulatedLeaderboardWidget simulatedUsers={combinedStats} currentUser={currentUser} lang={lang} />

        <div className="flex-1 p-4 space-y-4 pb-20">
            {Object.keys(simulation).length > 0 && (
                <div className="flex justify-end mb-2">
                    <button onClick={() => setSimulation({})} className="flex items-center gap-1 text-[10px] font-bold text-purple-500 uppercase tracking-widest hover:text-purple-600 bg-purple-50 px-2 py-1 rounded-lg"><RefreshCw size={12} /> Reset Simulation</button>
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
                                groupStandings={standings}
                                teams={teams}
                                qualifiedThirdsSet={qualifiedThirdsSet}
                            />
                        );
                    })
                ) : (
                    <div className="col-span-full text-center py-12 opacity-50"><Calendar size={48} className="mx-auto mb-2 text-slate-300" /><p className="text-sm font-bold text-slate-400">No matches on this date.</p></div>
                )}
            </div>
        </div>
    </div>
  );
};