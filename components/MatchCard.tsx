import React, { useState, useEffect } from 'react';
import { Match, Team, Translation, UserProfile, Prediction, TournamentPhase, HeadToHeadStats } from '../types';
import { Clock, Activity, Lock, ScanEye, ChevronUp, ChevronDown, History, RefreshCw, Unlock, Check, Search, MapPin, Save } from 'lucide-react';
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
  // Added optional prediction prop for read-only views if needed, though usually calculated internally
  prediction?: Prediction | undefined; 
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
        onClick={(e) => { e.stopPropagation(); if (value === null) onActivate(); else onChange(value + 1); }}
        className="w-full flex-1 flex items-center justify-center text-slate-300 group-hover:text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-t-xl transition-colors active:bg-blue-50 focus:outline-none"
      >
        <ChevronUp size={24} strokeWidth={3} />
      </button>
      
      <div className="h-10 flex items-center justify-center text-3xl font-black text-slate-800 leading-none select-none z-10">
        {value === null ? '-' : value}
      </div>
      
      <button 
        disabled={isLocked}
        onClick={(e) => { e.stopPropagation(); if (value === null) onActivate(); else onChange(Math.max(0, value - 1)); }}
        className="w-full flex-1 flex items-center justify-center text-slate-300 group-hover:text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-b-xl transition-colors active:bg-blue-50 focus:outline-none"
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
    
    const [localHome, setLocalHome] = useState<number | null>(prediction ? prediction.home : null);
    const [localAway, setLocalAway] = useState<number | null>(prediction ? prediction.away : null);
    const [isDirty, setIsDirty] = useState(false);

    const [h2hData, setH2HData] = useState<HeadToHeadStats | null>(null);
    const [loadingH2H, setLoadingH2H] = useState(false);
    const [showHistoryDetails, setShowHistoryDetails] = useState(false);

    const isKnockout = !!match.round; 

    useEffect(() => {
        if (!isDirty) {
            setLocalHome(prediction ? prediction.home : null);
            setLocalAway(prediction ? prediction.away : null);
        }
    }, [prediction, isDirty]);

    useEffect(() => {
        const hasScore = localHome !== null || localAway !== null;
        const isValidMatchup = homeTeam && awayTeam && homeTeam.id !== 'TBD' && awayTeam.id !== 'TBD';
        const shouldFetch = isValidMatchup && hasScore && !h2hData && !loadingH2H && !match.isLocked;

        if (shouldFetch) {
            setLoadingH2H(true);
            fetchHeadToHeadStats(homeTeam, awayTeam)
                .then(data => { setH2HData(data); setLoadingH2H(false); })
                .catch(() => setLoadingH2H(false));
        }
    }, [localHome, localAway, h2hData, loadingH2H, match.isLocked, homeTeam, awayTeam]);

    const isLive = ['LIVE', '1H', '2H', 'HT', 'AET', 'PEN'].includes(match.status);
    const isFinished = ['FINISHED', 'FT', 'AET', 'PEN'].includes(match.status);
    
    const isRealLifeLocked = match.isLocked || isLive || isFinished;
    const isLocked = (isRealLifeLocked && !isUnlockedBySub) && !isAdminMode;
    const canSubstitute = isRealLifeLocked && !isLive && !isFinished && !isUnlockedBySub && onSubstitute;

    const handleActivate = () => { setLocalHome(0); setLocalAway(0); setIsDirty(true); };
    const handleScoreChange = (side: 'home' | 'away', val: number) => {
        if (side === 'home') setLocalHome(val); else setLocalAway(val);
        setIsDirty(true);
    };
    const handleSave = () => {
        if (localHome !== null && localAway !== null) { onUpdate(match.id, localHome, localAway); setIsDirty(false); }
    };
    const handleSubClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (substitutionsLeft !== undefined && substitutionsLeft > 0 && onSubstitute) {
            if (window.confirm(`${lang.subConfirm} (${substitutionsLeft} ${lang.substitutions} left)`)) { onSubstitute(); }
        }
    };

    const pointsEarned = (isLive || isFinished) && match.homeScore !== null && match.awayScore !== null && prediction
        ? calculatePoints(prediction.home, prediction.away, match.homeScore, match.awayScore, currentUser?.hasTakenSecondChance, match.round)
        : null;

    const homeName = lang.teamNames[homeTeam?.id] || homeTeam?.name || 'TBD';
    const awayName = lang.teamNames[awayTeam?.id] || awayTeam?.name || 'TBD';
    const isSpied = currentUser?.spiedMatches?.includes(match.id);
    const canSpy = !isSpied && userTokens > 0 && !isRealLifeLocked && rivals.length > 0;
    const showRivals = isSpied || isRealLifeLocked;

    const renderControlButtons = () => {
        if (canSubstitute) {
            return (
                <button 
                    onClick={handleSubClick}
                    disabled={!substitutionsLeft || substitutionsLeft <= 0}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border shadow-sm transition-all active:scale-95 w-full justify-center ${substitutionsLeft && substitutionsLeft > 0 ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-500/30' : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'}`}
                >
                    <RefreshCw size={14} className={substitutionsLeft && substitutionsLeft > 0 ? "" : "opacity-50"} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{lang.makeSub}</span>
                </button>
            );
        }
        if (isUnlockedBySub && isDirty) {
            return (
                <button 
                    onClick={(e) => { e.stopPropagation(); handleSave(); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border shadow-sm transition-all active:scale-95 w-full justify-center bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-green-500/30 animate-pulse"
                >
                    <Save size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Save</span>
                </button>
            );
        }
        if (isUnlockedBySub && !isDirty) {
            return (
                <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 w-full">
                    <Unlock size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{lang.unlocked}</span>
                </div>
            );
        }
        if (isLocked) {
            return (
                <div className="text-[9px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1 bg-red-50 px-3 py-2 rounded justify-center w-full">
                    <Lock size={12} /> {lang.lockedState}
                </div>
            );
        }
        return null;
    };

    let predictedWinnerId: string | null = null;
    if (localHome !== null && localAway !== null) {
        if (localHome > localAway) predictedWinnerId = match.homeTeamId;
        else if (localAway > localHome) predictedWinnerId = match.awayTeamId;
    }

    const isHomeClickable = (isKnockout && !isLocked) || (!isKnockout && onTeamClick && !match.homeTeamId.startsWith('TBD'));
    const isAwayClickable = (isKnockout && !isLocked) || (!isKnockout && onTeamClick && !match.awayTeamId.startsWith('TBD'));
    
    return (
        <div className={`bg-white rounded-2xl border ${isLive ? 'border-red-400 shadow-md ring-1 ring-red-100' : 'border-slate-200 shadow-sm'} relative group`}>
             
             {/* Header - NOW NAVY BLUE to match Hero */}
             <div className="px-3 py-2 border-b border-[#1a3a6c] bg-[#0f2545] flex items-center justify-between rounded-t-2xl min-h-[36px]">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 w-full justify-center">
                    {isLive ? (
                         <span className="flex items-center gap-1 text-red-400 animate-pulse">
                            <Activity size={12} /> {lang.live} {match.minute ? `'${match.minute}` : ''}
                         </span>
                    ) : (
                        <div className="flex items-center gap-2">
                            {isFinished ? (
                                <span className="flex items-center gap-1 text-slate-400">
                                    <Clock size={12} /> {lang.ft}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-white">
                                    <Clock size={12} /> 
                                    {new Date(match.date).toLocaleDateString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                            {match.venue && match.venue !== 'TBD' && (
                                <>
                                    <span className="text-slate-500">•</span>
                                    <span className="flex items-center gap-1 truncate max-w-[140px] text-slate-400" title={match.venue}>
                                        <MapPin size={10} />
                                        <span className="truncate">{match.venue.split(',')[0]}</span>
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>
             </div>

            {/* Main Content */}
             <div className="p-4 flex items-center justify-between relative z-10 gap-2">
                {/* Home Team */}
                <div 
                    onClick={() => {
                        if(isKnockout && !isLocked) { setLocalHome(1); setLocalAway(0); setIsDirty(true); }
                        else if(isHomeClickable && onTeamClick) onTeamClick(match.homeTeamId);
                    }}
                    className={`flex-1 flex flex-col items-center justify-center gap-3 z-10 p-2 rounded-xl transition-all relative group/team ${
                        isHomeClickable ? 'cursor-pointer hover:bg-slate-50 active:scale-95' : ''
                    } ${
                        predictedWinnerId === match.homeTeamId && isKnockout ? 'bg-blue-50 ring-2 ring-blue-500 shadow-md' : ''
                    } ${
                        predictedWinnerId && predictedWinnerId !== match.homeTeamId && isKnockout && isLocked ? 'opacity-40 grayscale' : 'opacity-100'
                    }`}
                >
                    {!isKnockout && isHomeClickable && (
                        <div className="absolute top-2 right-2 text-slate-300 group-hover/team:text-blue-500 transition-colors">
                            <Search size={14} />
                        </div>
                    )}

                    <div className="relative shadow-sm rounded-lg overflow-visible w-20 h-14 sm:w-24 sm:h-16 pointer-events-none">
                        <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                            {homeTeam?.flag ? <img src={homeTeam.flag} alt={homeName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100"></div>}
                        </div>
                        {homeTeam?.rank && (
                            <div className="absolute -bottom-2 -right-2 bg-[#0f2545] text-white text-[10px] font-black w-8 h-8 flex items-center justify-center rounded-full border-2 border-white shadow-md z-20">
                            #{homeTeam.rank}
                            </div>
                        )}
                        {isKnockout && predictedWinnerId === match.homeTeamId && (
                            <div className="absolute -top-3 -right-3 bg-blue-600 text-white rounded-full p-1 shadow-lg border-2 border-white animate-in zoom-in">
                                <Check size={14} strokeWidth={4} />
                            </div>
                        )}
                    </div>
                    <span className={`font-black text-slate-800 text-xs sm:text-sm leading-none uppercase tracking-tight text-center max-w-[100px] truncate ${predictedWinnerId === match.homeTeamId ? 'text-blue-700' : ''}`}>{homeName}</span>
                </div>

                {/* CENTER: VS / Controls */}
                <div className="flex flex-col items-center justify-center px-1 z-20 shrink-0 min-w-[80px]">
                    {isKnockout ? (
                        <div className="flex flex-col items-center gap-2 animate-in zoom-in duration-300 w-full">
                            <div className="text-3xl font-black text-slate-200">VS</div>
                            <div className="mt-2 w-full">{renderControlButtons()}</div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 w-full">
                            {!isLocked ? (
                                <div className="flex items-center gap-2 relative">
                                    <ScoreStepper value={localHome} onChange={(v) => handleScoreChange('home', v)} isLocked={isLocked} onActivate={handleActivate} />
                                    <span className="font-black text-slate-300 text-lg">-</span>
                                    <ScoreStepper value={localAway} onChange={(v) => handleScoreChange('away', v)} isLocked={isLocked} onActivate={handleActivate} />
                                    {isUnlockedBySub && isDirty && (
                                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-30">
                                            <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1 whitespace-nowrap animate-bounce">
                                                <Save size={10} /> Save
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center animate-in zoom-in duration-300 w-full">
                                    {(isLive || isFinished || match.homeScore !== null) ? (
                                        <>
                                            <div className={`px-5 py-3 rounded-xl font-mono text-4xl font-bold tracking-widest shadow-lg border-2 flex items-center gap-2 transition-all duration-500 ${isLive ? 'bg-red-600 text-white border-red-700' : 'bg-slate-800 text-white border-slate-900'}`}>
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
                                        <div className="flex flex-col items-center gap-3 w-full">
                                             <div className="text-3xl font-black text-slate-300">VS</div>
                                             {prediction && (
                                                <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                                    {lang.myPick}: {prediction.home}-{prediction.away}
                                                </div>
                                             )}
                                             <div className="w-full">{renderControlButtons()}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Reveal Rival Button */}
                    <div className="flex items-center justify-center w-full mt-3">
                        {!showRivals && canSpy && (
                            <button onClick={(e) => { e.stopPropagation(); onSpy(match.id); }} className="group w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md active:scale-95">
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

                {/* Away Team */}
                <div 
                    onClick={() => {
                        if(isKnockout && !isLocked) { setLocalHome(0); setLocalAway(1); setIsDirty(true); }
                        else if(isAwayClickable && onTeamClick) onTeamClick(match.awayTeamId);
                    }}
                    className={`flex-1 flex flex-col items-center justify-center gap-3 z-10 p-2 rounded-xl transition-all relative group/team ${isAwayClickable ? 'cursor-pointer hover:bg-slate-50 active:scale-95' : ''} ${predictedWinnerId === match.awayTeamId && isKnockout ? 'bg-blue-50 ring-2 ring-blue-500 shadow-md' : ''} ${predictedWinnerId && predictedWinnerId !== match.awayTeamId && isKnockout && isLocked ? 'opacity-40 grayscale' : 'opacity-100'}`}
                >
                    {!isKnockout && isAwayClickable && (
                        <div className="absolute top-2 right-2 text-slate-300 group-hover/team:text-blue-500 transition-colors">
                            <Search size={14} />
                        </div>
                    )}
                    <div className="relative shadow-sm rounded-lg overflow-visible w-20 h-14 sm:w-24 sm:h-16 pointer-events-none">
                        <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                            {awayTeam?.flag ? <img src={awayTeam.flag} alt={awayName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100"></div>}
                        </div>
                        {awayTeam?.rank && (
                            <div className="absolute -bottom-2 -right-2 bg-[#0f2545] text-white text-[10px] font-black w-8 h-8 flex items-center justify-center rounded-full border-2 border-white shadow-md z-20">#{awayTeam.rank}</div>
                        )}
                        {isKnockout && predictedWinnerId === match.awayTeamId && (
                            <div className="absolute -top-3 -right-3 bg-blue-600 text-white rounded-full p-1 shadow-lg border-2 border-white animate-in zoom-in">
                                <Check size={14} strokeWidth={4} />
                            </div>
                        )}
                    </div>
                    <span className={`font-black text-slate-800 text-xs sm:text-sm leading-none uppercase tracking-tight text-center max-w-[100px] truncate ${predictedWinnerId === match.awayTeamId ? 'text-blue-700' : ''}`}>{awayName}</span>
                </div>
            </div>

            {/* HEAD-TO-HEAD & RIVALS */}
            {h2hData && !isLocked && !isKnockout && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 cursor-pointer group" onClick={() => setShowHistoryDetails(!showHistoryDetails)}>
                    <div className="flex items-center justify-between mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2">
                            <History size={12} className="text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{lang.headToHead}</span>
                        </div>
                        <ChevronDown size={14} className={`text-slate-300 transition-transform duration-300 ${showHistoryDetails ? 'rotate-180' : ''}`} />
                    </div>
                    <div className="flex flex-col gap-2">
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

            {/* Rivals Section */}
            {showRivals && rivals.length > 0 && (
                <div className="bg-[#0f2545] p-4 animate-in slide-in-from-top-2 border-t border-white/10 rounded-b-2xl">
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