
import React, { useState, useEffect } from 'react';
import { Match, Team, Translation, UserProfile, Prediction, TournamentPhase, HeadToHeadStats } from '../types';
import { Clock, Activity, Lock, ScanEye, ChevronUp, ChevronDown, History, RefreshCw, Coins, Unlock } from 'lucide-react';
import { calculatePoints, fetchHeadToHeadStats } from '../services/engine';
import { AvatarDisplay } from './AvatarDisplay';

interface MatchCardProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  onUpdate: (id: string, h: number, a: number) => void;
  lang: Translation;
  locale: string;
  userTokens: number;
  rivals: UserProfile[];
  onSpy: (id: string) => void;
  revealedRivals: string[]; 
  currentUser: UserProfile | null;
  allPredictions: Prediction[];
  phase: TournamentPhase;
  isAdminMode: boolean;
  onSubstitute?: () => void;
  substitutionsLeft?: number;
  isUnlockedBySub?: boolean;
  onTeamClick?: (teamId: string) => void;
}

const ScoreStepper: React.FC<{ 
    value: number | null; 
    onChange: (val: number) => void; 
    isLocked: boolean;
    onActivate: () => void;
}> = ({ value, onChange, isLocked, onActivate }) => {
  return (
    <div className={`flex flex-col items-center justify-between w-14 h-32 bg-white border border-slate-200 rounded-2xl transition-all shadow-sm group ${isLocked ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'hover:border-blue-300 hover:shadow-md'}`}>
      <button 
        disabled={isLocked}
        onClick={(e) => {
            e.stopPropagation();
            if (value === null) {
                onActivate();
            } else {
                onChange(value + 1);
            }
        }}
        className="w-full flex-1 flex items-center justify-center text-slate-300 group-hover:text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-t-xl transition-colors active:bg-blue-50 focus:outline-none"
        aria-label="Increase"
      >
        <ChevronUp size={24} strokeWidth={3} />
      </button>
      
      <div className="h-10 flex items-center justify-center text-3xl font-black text-slate-800 leading-none select-none z-10">
        {value === null ? '-' : value}
      </div>
      
      <button 
        disabled={isLocked}
        onClick={(e) => {
            e.stopPropagation();
            if (value === null) {
                onActivate();
            } else {
                onChange(Math.max(0, value - 1));
            }
        }}
        className="w-full flex-1 flex items-center justify-center text-slate-300 group-hover:text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-b-xl transition-colors active:bg-blue-50 focus:outline-none"
        aria-label="Decrease"
      >
        <ChevronDown size={24} strokeWidth={3} />
      </button>
    </div>
  );
};

export const MatchCard: React.FC<MatchCardProps> = ({ 
    match, homeTeam, awayTeam, onUpdate, lang, locale, userTokens, rivals, onSpy, currentUser, allPredictions, phase, isAdminMode, onSubstitute, substitutionsLeft = 0, isUnlockedBySub = false, onTeamClick
}) => {
    const prediction = allPredictions.find(p => p.userId === currentUser?.email && p.matchId === match.id);
    const [displayHome, setDisplayHome] = useState<number | null>(prediction ? prediction.home : null);
    const [displayAway, setDisplayAway] = useState<number | null>(prediction ? prediction.away : null);

    const [h2hData, setH2HData] = useState<HeadToHeadStats | null>(null);
    const [loadingH2H, setLoadingH2H] = useState(false);
    const [showHistoryDetails, setShowHistoryDetails] = useState(false);

    useEffect(() => {
        if (prediction) {
            setDisplayHome(prediction.home);
            setDisplayAway(prediction.away);
        } else {
            setDisplayHome(null);
            setDisplayAway(null);
        }
    }, [prediction]);

    useEffect(() => {
        const hasScore = displayHome !== null || displayAway !== null;
        const shouldFetch = hasScore && !h2hData && !loadingH2H && !match.isLocked;

        if (shouldFetch) {
            setLoadingH2H(true);
            fetchHeadToHeadStats(homeTeam, awayTeam)
                .then(data => {
                    setH2HData(data);
                    setLoadingH2H(false);
                })
                .catch(err => {
                    console.error("H2H Fetch error", err);
                    setLoadingH2H(false);
                });
        }
    }, [displayHome, displayAway, h2hData, loadingH2H, match.isLocked, homeTeam, awayTeam]);

    const handleActivate = () => {
        setDisplayHome(0);
        setDisplayAway(0);
        onUpdate(match.id, 0, 0);
    };

    const handleScoreChange = (side: 'home' | 'away', val: number) => {
        const h = side === 'home' ? val : (displayHome ?? 0);
        const a = side === 'away' ? val : (displayAway ?? 0);
        
        setDisplayHome(h);
        setDisplayAway(a);
        onUpdate(match.id, h, a);
    };

    const isLive = ['LIVE', '1H', '2H', 'HT', 'AET', 'PEN'].includes(match.status);
    const isFinished = ['FINISHED', 'FT', 'AET', 'PEN'].includes(match.status);
    
    // Effective locked state handles the substitution override
    const rawLocked = match.isLocked || (phase === 'LIVE' && match.status !== 'UPCOMING' && match.status !== 'NS');
    const isLocked = rawLocked && !isUnlockedBySub;

    // Is Eligible for Substitution? (Locked + Upcoming)
    // Note: If rawLocked is true but it's already unlocked by sub, we don't show the button again.
    const canSubstitute = rawLocked && !isUnlockedBySub && match.status === 'UPCOMING' && onSubstitute;

    const pointsEarned = (isLive || isFinished) && match.homeScore !== null && match.awayScore !== null && prediction
        ? calculatePoints(prediction.home, prediction.away, match.homeScore, match.awayScore, currentUser?.hasTakenSecondChance, match.round)
        : null;

    const homeName = lang.teamNames[homeTeam?.id] || homeTeam?.name || 'TBD';
    const awayName = lang.teamNames[awayTeam?.id] || awayTeam?.name || 'TBD';
    const homeRank = homeTeam?.rank;
    const awayRank = awayTeam?.rank;

    const isSpied = currentUser?.spiedMatches?.includes(match.id);
    const canSpy = !isSpied && userTokens > 0 && !rawLocked && rivals.length > 0;
    
    const showRivals = isSpied || rawLocked;

    const handleSubClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (substitutionsLeft > 0 && onSubstitute) {
            if (window.confirm(`${lang.subConfirm} (${substitutionsLeft} ${lang.substitutions} left)`)) {
                onSubstitute();
            }
        }
    };

    const onFlagClick = (e: React.MouseEvent, teamId: string) => {
        e.stopPropagation();
        if (onTeamClick && !teamId.startsWith('TBD')) {
            onTeamClick(teamId);
        }
    };
    
    return (
        <div className={`bg-white rounded-2xl border ${isLive ? 'border-red-400 shadow-md ring-1 ring-red-100' : 'border-slate-200 shadow-sm'} overflow-hidden relative group`}>
             {/* Header */}
             <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-full justify-center">
                    {isLive ? (
                         <span className="flex items-center gap-1 text-red-600 animate-pulse">
                            <Activity size={12} /> {lang.live} {match.minute ? `'${match.minute}` : ''}
                         </span>
                    ) : isFinished ? (
                        <span className="flex items-center gap-1">
                            <Clock size={12} /> {lang.ft}
                        </span>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Clock size={12} /> 
                            <span>{new Date(match.date).toLocaleDateString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            {match.venue && (
                                <>
                                    <span className="text-slate-300">•</span>
                                    <span className="truncate max-w-[150px]">{match.venue}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
             </div>

            {/* Main Content */}
             <div className="p-4 flex items-center justify-between relative z-10">
                {/* Home Team */}
                <div className="flex-1 flex flex-col items-center justify-center gap-3 z-10">
                    <div 
                        onClick={(e) => onFlagClick(e, homeTeam?.id)}
                        className={`relative shadow-sm rounded-lg overflow-visible w-20 h-14 sm:w-24 sm:h-16 transform transition-transform group-hover:scale-105 ${onTeamClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''}`}
                    >
                        <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                            {homeTeam?.flag ? <img src={homeTeam.flag} alt={homeName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100"></div>}
                        </div>
                        {homeRank && (
                            <div className="absolute -bottom-2 -right-2 bg-[#0f2545] text-white text-[10px] font-black w-8 h-8 flex items-center justify-center rounded-full border-2 border-white shadow-md z-20">
                            #{homeRank}
                            </div>
                        )}
                    </div>
                    <span onClick={(e) => onFlagClick(e, homeTeam?.id)} className={`font-black text-slate-800 text-xs sm:text-sm leading-none uppercase tracking-tight text-center max-w-[100px] truncate ${onTeamClick ? 'cursor-pointer hover:text-blue-600' : ''}`}>{homeName}</span>
                </div>

                {/* Score / VS / Controls */}
                <div className="flex flex-col items-center justify-center px-2 z-20 shrink-0 min-w-[140px]">
                    {isLocked ? (
                        <div className="flex flex-col items-center animate-in zoom-in duration-300">
                            {(isLive || isFinished || match.homeScore !== null) ? (
                                <>
                                    <div className={`px-5 py-3 rounded-xl font-mono text-4xl font-bold tracking-widest shadow-lg border-2 flex items-center gap-2 transition-all duration-500 ${
                                        isLive 
                                            ? 'bg-red-600 text-white border-red-700' 
                                            : 'bg-slate-800 text-white border-slate-900'
                                    }`}>
                                        <span>{match.homeScore ?? 0}</span>
                                        <span className="opacity-50 text-xl mx-1">:</span>
                                        <span>{match.awayScore ?? 0}</span>
                                    </div>
                                    {pointsEarned !== null && !isAdminMode && (
                                        <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-in slide-in-from-top-1 ${pointsEarned > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                                            +{pointsEarned} {lang.points}
                                        </div>
                                    )}
                                    {prediction && (
                                        <div className="text-[10px] text-slate-400 font-bold mt-1">
                                            {lang.myPick}: {prediction.home}-{prediction.away}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                     <div className="text-3xl font-black text-slate-300">VS</div>
                                     
                                     {prediction && (
                                        <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                            {lang.myPick}: {prediction.home}-{prediction.away}
                                        </div>
                                     )}

                                     {/* SUBSTITUTION BUTTON */}
                                     {canSubstitute ? (
                                         <button 
                                            onClick={handleSubClick}
                                            disabled={substitutionsLeft <= 0}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shadow-sm transition-all active:scale-95 ${substitutionsLeft > 0 ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-500/30' : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'}`}
                                         >
                                             <RefreshCw size={12} className={substitutionsLeft > 0 ? "" : "opacity-50"} />
                                             <span className="text-[10px] font-black uppercase tracking-widest">{lang.makeSub}</span>
                                         </button>
                                     ) : (
                                         <div className="text-[9px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1 bg-red-50 px-2 py-1 rounded">
                                            <Lock size={10} /> {lang.lockedState}
                                         </div>
                                     )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2 relative">
                                <ScoreStepper 
                                    value={displayHome} 
                                    onChange={(v) => handleScoreChange('home', v)} 
                                    isLocked={isLocked}
                                    onActivate={handleActivate} 
                                />
                                <span className="font-black text-slate-300 text-lg">-</span>
                                <ScoreStepper 
                                    value={displayAway} 
                                    onChange={(v) => handleScoreChange('away', v)} 
                                    isLocked={isLocked}
                                    onActivate={handleActivate} 
                                />
                                
                                {/* Unlocked Badge */}
                                {isUnlockedBySub && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shadow-md flex items-center gap-1 whitespace-nowrap border border-white">
                                        <Unlock size={8} /> {lang.unlocked}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center justify-center w-full">
                                {/* Reveal Rival Button - "Intel" */}
                                {!showRivals && canSpy && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onSpy(match.id); }}
                                        className="group w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md active:scale-95"
                                    >
                                        <div className="flex items-center gap-1.5 text-slate-600 group-hover:text-indigo-700">
                                            <ScanEye size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">{lang.revealRival}</span>
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-500 bg-slate-100 group-hover:bg-white px-2 py-0.5 rounded border border-slate-100 group-hover:border-indigo-200 transition-colors">
                                            {userTokens} {lang.tokensLeft}
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Away Team */}
                <div className="flex-1 flex flex-col items-center justify-center gap-3 z-10">
                    <div 
                        onClick={(e) => onFlagClick(e, awayTeam?.id)}
                        className={`relative shadow-sm rounded-lg overflow-visible w-20 h-14 sm:w-24 sm:h-16 transform transition-transform group-hover:scale-105 ${onTeamClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''}`}
                    >
                        <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                            {awayTeam?.flag ? <img src={awayTeam.flag} alt={awayName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100"></div>}
                        </div>
                        {awayRank && (
                            <div className="absolute -bottom-2 -right-2 bg-[#0f2545] text-white text-[10px] font-black w-8 h-8 flex items-center justify-center rounded-full border-2 border-white shadow-md z-20">
                            #{awayRank}
                            </div>
                        )}
                    </div>
                    <span onClick={(e) => onFlagClick(e, awayTeam?.id)} className={`font-black text-slate-800 text-xs sm:text-sm leading-none uppercase tracking-tight text-center max-w-[100px] truncate ${onTeamClick ? 'cursor-pointer hover:text-blue-600' : ''}`}>{awayName}</span>
                </div>
            </div>

            {/* HEAD-TO-HEAD AUTO-SECTION */}
            {h2hData && !isLocked && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 cursor-pointer group" onClick={() => setShowHistoryDetails(!showHistoryDetails)}>
                    <div className="flex items-center justify-between mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2">
                            <History size={12} className="text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{lang.headToHead}</span>
                        </div>
                        <ChevronDown size={14} className={`text-slate-300 transition-transform duration-300 ${showHistoryDetails ? 'rotate-180' : ''}`} />
                    </div>

                    <div className="flex flex-col gap-2">
                        {/* Stats Bar */}
                        {h2hData.totalMatches > 0 ? (
                            <>
                                <div className="flex h-2.5 rounded-full overflow-hidden w-full shadow-sm bg-slate-100">
                                    <div style={{ width: `${(h2hData.homeWins / h2hData.totalMatches) * 100}%` }} className="bg-emerald-500 transition-all duration-1000"></div>
                                    <div style={{ width: `${(h2hData.draws / h2hData.totalMatches) * 100}%` }} className="bg-slate-300 transition-all duration-1000"></div>
                                    <div style={{ width: `${(h2hData.awayWins / h2hData.totalMatches) * 100}%` }} className="bg-blue-500 transition-all duration-1000"></div>
                                </div>
                                <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400 px-0.5">
                                    <span className="text-emerald-600">{h2hData.homeWins} {lang.wins}</span>
                                    <span>{h2hData.draws} {lang.draws}</span>
                                    <span className="text-blue-600">{h2hData.awayWins} {lang.wins}</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-[10px] text-slate-400 italic font-medium bg-slate-50 py-2 rounded-lg">{lang.firstMeeting}</div>
                        )}

                        {/* Expandable Details */}
                        {showHistoryDetails && h2hData.last5.length > 0 && (
                            <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2 animate-in fade-in slide-in-from-top-1">
                                {h2hData.last5.map((m, i) => {
                                    const isHomeHome = m.homeTeamId === homeTeam.id;
                                    const scoreDisplay = isHomeHome ? `${m.homeScore}-${m.awayScore}` : `${m.awayScore}-${m.homeScore}`;
                                    
                                    let resColor = 'text-slate-400';
                                    if (m.winnerId === homeTeam.id) resColor = 'text-emerald-600';
                                    else if (m.winnerId === awayTeam.id) resColor = 'text-blue-600';

                                    return (
                                        <div key={i} className="flex justify-between items-center px-2 py-1.5 rounded hover:bg-slate-50 transition-colors">
                                            <span className="text-[10px] font-bold text-slate-400">{m.year}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">{m.winnerId === 'DRAW' ? 'DRAW' : (m.winnerId === homeTeam.id ? homeTeam.id : awayTeam.id)}</span>
                                                <span className={`text-xs font-black tracking-widest ${resColor}`}>{scoreDisplay}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Rivals Section (Only visible if revealed/locked) */}
            {showRivals && rivals.length > 0 && (
                <div className="bg-[#0f2545] p-4 animate-in slide-in-from-top-2 border-t border-white/10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Lock size={12} className="text-yellow-400" />
                            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{lang.revealRival}</span>
                        </div>
                        {prediction && (
                            <span className="text-[10px] font-bold text-white/40">
                                {lang.myPick}: <span className="text-white">{prediction.home} - {prediction.away}</span>
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 max-h-32 overflow-y-auto no-scrollbar">
                        {rivals.map(rival => {
                            const rivalPred = allPredictions.find(p => p.userId === rival.email && p.matchId === match.id);
                            return (
                                <div key={rival.email} className="flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 border border-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <AvatarDisplay avatar={rival.avatar} size="xs" className="w-6 h-6 text-[9px]" />
                                        <span className="text-xs font-bold text-white truncate max-w-[100px]">{rival.name}</span>
                                    </div>
                                    <span className="text-xs font-mono font-black text-yellow-400 tracking-wider">
                                        {rivalPred ? `${rivalPred.home} - ${rivalPred.away}` : '-'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
