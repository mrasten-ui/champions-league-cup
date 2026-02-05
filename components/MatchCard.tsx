import React, { useState, useEffect, useMemo } from 'react';
import { Match, Team, Translation, UserProfile, Prediction, TournamentPhase, HeadToHeadStats } from '../types';
import { Clock, ChevronUp, ChevronDown, History, RefreshCw, Unlock, Check, MapPin, Save, Trophy, Lock as LockIcon, Tv, AlertCircle } from 'lucide-react';
import { calculatePoints, fetchHeadToHeadStats } from '../services/engine';
import { AvatarDisplay } from './AvatarDisplay';
import { getSlotSource, getPotentialTeams, getGroupTeams } from '../utils/bracketHelpers'; 

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
  showStatusBadge?: boolean;
  homeTeamPoints?: number;
  awayTeamPoints?: number;
  allMatches?: Match[];
  allTeams?: Record<string, Team>;
  variant?: 'prediction' | 'official';
  context?: 'groups' | 'knockout' | 'carousel'; 
}

// --- SUB-COMPONENTS REMAIN UNCHANGED ---
const TbdSlot: React.FC<{ 
    matchId: string;
    side: 'home' | 'away';
    allMatches?: Match[];
    allTeams?: Record<string, Team>;
    lang: Translation;
}> = ({ matchId, side, allMatches, allTeams, lang }) => {
    const source = useMemo(() => getSlotSource(matchId, side), [matchId, side]);
    const groupTeams = useMemo(() => {
        if (source.type !== 'GROUP_RANK' || !allMatches || !allTeams) return [];
        return getGroupTeams(source.groupId, allMatches, allTeams);
    }, [source, allMatches, allTeams]);
    const potentialTeams = useMemo(() => {
        if (!allMatches || !allTeams) return null;
        return getPotentialTeams(source, allMatches, allTeams);
    }, [source, allMatches, allTeams]);

    if (source.type === 'GROUP_RANK') {
        return (
            <div className="w-16 h-12 rounded-lg border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center relative overflow-hidden group/tbd">
                {groupTeams.length > 0 ? (
                    <div className="absolute inset-0 w-full h-full grid grid-cols-2 grid-rows-2">
                        {groupTeams.slice(0, 4).map(team => (
                            <div key={team.id} className="relative w-full h-full"><img src={team.flag} alt="" className="w-full h-full object-cover" /></div>
                        ))}
                    </div>
                ) : (
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-repeat"></div>
                )}
                <div className="relative z-10 bg-white/95 px-1.5 py-0.5 rounded shadow-sm border border-slate-100 backdrop-blur-[1px]">
                    <span className="text-[8px] font-black text-slate-800 uppercase text-center leading-none block">{source.label}</span>
                </div>
            </div>
        );
    }
    if (potentialTeams && potentialTeams.length === 2) {
        return (
            <div className="w-16 h-12 rounded-lg border-2 border-dashed border-blue-200 bg-white flex flex-col items-center justify-center relative overflow-hidden group/tbd">
                <div className="absolute inset-0 w-full h-full grid grid-cols-2">
                    <div className="relative w-full h-full border-r border-white/20"><img src={potentialTeams[0].flag} alt="" className="w-full h-full object-cover" /></div>
                    <div className="relative w-full h-full"><img src={potentialTeams[1].flag} alt="" className="w-full h-full object-cover" /></div>
                </div>
                <div className="relative z-10 bg-white/95 px-1.5 py-0.5 rounded shadow-sm border border-slate-100 backdrop-blur-[1px]">
                    <div className="flex gap-1 text-[7px] font-black text-slate-800 uppercase leading-none"><span>{potentialTeams[0].id}</span><span className="text-slate-400 font-normal">/</span><span>{potentialTeams[1].id}</span></div>
                </div>
            </div>
        );
    }
    return (
        <div className="w-16 h-12 rounded-lg border-2 border-dashed border-[#2a4a7c] bg-[#0f2545] flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('/logo.png')] bg-center bg-contain bg-no-repeat scale-75"></div>
             <div className="relative z-10 bg-white/90 px-2 py-0.5 rounded shadow-sm border border-slate-100 backdrop-blur-[1px]">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">TBD</span>
             </div>
        </div>
    );
};

const ScoreStepper: React.FC<{ 
    value: number | null; 
    onChange: (val: number) => void; 
    isLocked: boolean;
    onActivate: () => void;
}> = ({ value, onChange, isLocked, onActivate }) => {
  return (
    <div className={`flex flex-col items-center justify-between w-12 h-24 sm:w-14 sm:h-28 bg-white border border-slate-200 rounded-2xl transition-all shadow-sm group ${isLocked ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'hover:border-blue-300 hover:shadow-md'}`}>
      <button disabled={isLocked} onClick={(e) => { e.stopPropagation(); if (value === null) onActivate(); else onChange(value + 1); }} className="w-full flex-1 flex items-center justify-center text-slate-300 group-hover:text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-t-xl transition-colors active:bg-blue-50 focus:outline-none"><ChevronUp size={20} strokeWidth={3} /></button>
      <div className="h-10 flex items-center justify-center text-2xl sm:text-3xl font-black text-slate-800 leading-none select-none z-10">{value === null ? '-' : value}</div>
      <button disabled={isLocked} onClick={(e) => { e.stopPropagation(); if (value === null) onActivate(); else onChange(Math.max(0, value - 1)); }} className="w-full flex-1 flex items-center justify-center text-slate-300 group-hover:text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-b-xl transition-colors active:bg-blue-50 focus:outline-none"><ChevronDown size={20} strokeWidth={3} /></button>
    </div>
  );
};

export const MatchCard: React.FC<MatchCardProps> = ({ 
    match, homeTeam, awayTeam, onUpdate, lang, locale, userTokens, rivals, onSpy, currentUser, allPredictions, 
    phase, 
    isAdminMode, onSubstitute, substitutionsLeft = 0, isUnlockedBySub = false, onTeamClick, showStatusBadge = false,
    homeTeamPoints, awayTeamPoints, allMatches, allTeams, variant = 'prediction', context 
}) => {
    const prediction = allPredictions.find(p => p.userId === currentUser?.email && p.matchId === match.id);
    
    const [localHome, setLocalHome] = useState<number | null>(prediction ? prediction.home : null);
    const [localAway, setLocalAway] = useState<number | null>(prediction ? prediction.away : null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
        if (isDirty && localHome !== null && localAway !== null && !isUnlockedBySub) {
            const timer = setTimeout(() => {
                setIsSaving(true);
                onUpdate(match.id, localHome, localAway);
                setTimeout(() => { setIsSaving(false); setIsDirty(false); }, 500); 
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [localHome, localAway, isDirty, isUnlockedBySub, match.id, onUpdate]);

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

    const isStarted = ['LIVE', '1H', '2H', 'HT', 'AET', 'PEN', 'FINISHED', 'FT'].includes(match.status);
    const isLive = ['LIVE', '1H', '2H', 'HT', 'AET', 'PEN'].includes(match.status);
    const isFinished = ['FINISHED', 'FT', 'AET', 'PEN'].includes(match.status);

    // LOGIC: Locked by default in LIVE, unless subbed or admin
    let isLocked = false;
    if (phase === 'PRE_LIVE') {
        isLocked = false;
    } else {
        isLocked = !isUnlockedBySub || isStarted;
    }
    if (isAdminMode) isLocked = false;

    // LOGIC: Can Substitute?
    const canSubstitute = phase === 'LIVE' && !isStarted && !isUnlockedBySub && !!onSubstitute;

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

    const pointsEarned = (isStarted) && match.homeScore !== null && match.awayScore !== null && prediction
        ? calculatePoints(prediction.home, prediction.away, match.homeScore, match.awayScore, currentUser?.hasTakenSecondChance, match.round)
        : null;

    const homeName = lang.teamNames[homeTeam?.id] || homeTeam?.name || 'TBD';
    const awayName = lang.teamNames[awayTeam?.id] || awayTeam?.name || 'TBD';
    const isSpied = currentUser?.spiedMatches?.includes(match.id);
    const showRivals = isSpied || isLocked; 

    const getContextLabel = () => {
        if (match.round) {
            const rounds: Record<string, string> = { 'R32': lang.roundOf32 || 'Round of 32', 'R16': lang.roundOf16 || 'Round of 16', 'QF': lang.quarterFinal || 'Quarter Final', 'SF': lang.semiFinal || 'Semi Final', 'FIN': lang.final || 'Final', '3RD': lang.thirdPlace || '3rd Place' };
            return rounds[match.round] || match.round;
        }
        if (match.groupId) return `${lang.group || 'GROUP'} ${match.groupId}`;
        return match.venue || 'FRIENDLY';
    };

    const getTvChannel = () => {
        if (!match.channels) return null;
        let regionKey = 'US';
        const loc = locale.toLowerCase();
        if (loc.includes('no')) regionKey = 'NO';
        else if (loc.includes('gb') || loc.includes('uk')) regionKey = 'EN';
        else if (loc.startsWith('en') && !loc.includes('us')) regionKey = 'EN'; 
        if ((lang as any).isScotland && match.channels['SCO']) { regionKey = 'SCO'; }
        let channel = match.channels[regionKey] || match.channels['EN'] || match.channels['US'] || Object.values(match.channels)[0];
        if (!channel) return null;
        return <div className="flex items-center gap-1.5 text-blue-300" title={`Watch on ${channel}`}><Tv size={12} /><span className="text-[9px] font-bold uppercase tracking-wide truncate max-w-[60px] sm:max-w-[100px]">{channel}</span></div>;
    };

    const getLeftStatus = () => {
        if (isFinished) return <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">FT</span>;
        if (isLive) return <div className="flex items-center gap-1.5 text-red-400 animate-pulse"><div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div><span className="text-[10px] font-black uppercase tracking-widest">{match.minute ? `${match.minute}'` : 'LIVE'}</span></div>;
        return (
            <div className="flex items-center gap-1.5 text-slate-300">
                <Clock size={12} />
                <span className="text-[10px] font-bold">
                    {new Date(match.date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' })}
                </span>
            </div>
        );
    };

    const renderControlButtons = () => {
        if (canSubstitute) {
            return <button onClick={handleSubClick} disabled={!substitutionsLeft || substitutionsLeft <= 0} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border shadow-sm transition-all active:scale-95 w-full justify-center ${substitutionsLeft && substitutionsLeft > 0 ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-500/30' : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'}`}><RefreshCw size={14} className={substitutionsLeft && substitutionsLeft > 0 ? "" : "opacity-50"} /><span className="text-[10px] font-black uppercase tracking-widest">{lang.makeSub}</span></button>;
        }
        if (isUnlockedBySub && isDirty) {
            return <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border shadow-sm transition-all active:scale-95 w-full justify-center bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-green-500/30 animate-pulse"><Save size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Save</span></button>;
        }
        if (isUnlockedBySub && !isDirty) {
            return <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 w-full"><Unlock size={14} /><span className="text-[10px] font-black uppercase tracking-widest">{lang.unlocked}</span></div>;
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
    const isHomeTBD = match.homeTeamId === 'TBD' || !homeTeam;
    const isAwayTBD = match.awayTeamId === 'TBD' || !awayTeam;

    return (
        <div className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col relative group w-full ${isLive ? 'border-red-400 shadow-md ring-1 ring-red-100' : 'border-slate-200 shadow-sm'}`}>
             
             {/* HEADER */}
             <div className="bg-[#0f2545] border-b border-[#1a3a6c] py-2 px-3 flex justify-between items-center h-10 text-white">
                <div className="w-1/3 flex items-center justify-start">{getLeftStatus()}</div>
                <div className="w-1/3 flex items-center justify-center text-center">
                    {variant === 'prediction' ? (
                        (context === 'groups' || context === 'knockout') ? (
                             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{new Date(match.date).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        ) : (
                             <div className="h-6 opacity-80 flex items-center justify-center"><img src="/logo-white.png" alt="Rasten Cup" className="h-full object-contain max-w-[80px]" /></div>
                        )
                    ) : (
                        <div className="flex items-center gap-1.5">
                            {(match.round || match.groupId) && <Trophy size={12} className="text-amber-400" />}
                            <span className="text-xs font-black uppercase tracking-widest shadow-black/50 drop-shadow-sm whitespace-nowrap">{getContextLabel()}</span>
                        </div>
                    )}
                </div>
                <div className="w-1/3 flex items-center justify-end">{getTvChannel()}</div>
             </div>

             {/* MAIN CARD CONTENT - ALIGNMENT FIXED: items-start, pt-5 */}
             <div className="p-4 pt-5 flex items-start justify-center relative z-10 gap-2 flex-1">
                
                {/* Home Team */}
                <div onClick={() => { if (isHomeTBD) return; if(isKnockout && !isLocked) { setLocalHome(1); setLocalAway(0); setIsDirty(true); } else if(isHomeClickable && onTeamClick) onTeamClick(match.homeTeamId); }} className={`flex-shrink-0 w-28 sm:w-36 flex flex-col items-center justify-start gap-2 z-10 p-2 rounded-xl transition-all relative group/team ${isHomeClickable ? 'cursor-pointer hover:bg-slate-50 active:scale-95' : ''} ${predictedWinnerId === match.homeTeamId && isKnockout ? 'bg-blue-50 ring-2 ring-blue-500 shadow-md' : ''} ${predictedWinnerId && predictedWinnerId !== match.homeTeamId && isKnockout && isLocked ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                    {isHomeTBD ? <TbdSlot matchId={match.id} side="home" allMatches={allMatches} allTeams={allTeams} lang={lang} /> : <div className="relative shadow-sm rounded-lg overflow-visible w-14 h-10 sm:w-16 sm:h-12 pointer-events-none shrink-0"><div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white">{homeTeam?.flag ? <img src={homeTeam.flag} alt={homeName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100"></div>}</div>{homeTeam?.rank && <div className="absolute -bottom-2 -right-2 bg-[#0f2545] text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md z-20">#{homeTeam.rank}</div>}</div>}
                    <div className="flex flex-col items-center w-full">
                        {!isHomeTBD && (
                            <>
                                <div className="h-8 flex items-center justify-center w-full px-1"><span className={`font-black text-slate-800 text-xs leading-tight uppercase tracking-tight text-center line-clamp-2 w-full ${predictedWinnerId === match.homeTeamId ? 'text-blue-700' : ''}`}>{homeName}</span></div>
                                {match.groupId && homeTeamPoints !== undefined && <span className="text-[9px] font-bold text-slate-400">{homeTeamPoints} {lang.pts || 'pts'}</span>}
                            </>
                        )}
                    </div>
                </div>

                {/* Center Control */}
                <div className="flex flex-col items-center justify-start px-1 z-20 shrink-0 w-32 sm:w-40 pt-1">
                    {isKnockout ? (
                        <div className="flex flex-col items-center gap-2 animate-in zoom-in duration-300 w-full"><div className="text-2xl font-black text-slate-200">VS</div><div className="mt-1 w-full">{renderControlButtons()}</div></div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 w-full">
                            {!isLocked ? (
                                <div className="flex items-center gap-2 relative justify-center w-full">
                                    <ScoreStepper value={localHome} onChange={(v) => handleScoreChange('home', v)} isLocked={isLocked} onActivate={handleActivate} />
                                    <div className="flex flex-col items-center gap-1 shrink-0"><span className="font-black text-slate-300 text-lg">-</span>{isSaving && <div className="absolute -bottom-6 left-1/2 -translate-x-1/2"><span className="text-[9px] font-black text-green-500 uppercase animate-pulse">Saving</span></div>}</div>
                                    <ScoreStepper value={localAway} onChange={(v) => handleScoreChange('away', v)} isLocked={isLocked} onActivate={handleActivate} />
                                    {isUnlockedBySub && isDirty && <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-30"><button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1 whitespace-nowrap animate-bounce"><Save size={10} /> Save</button></div>}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center animate-in zoom-in duration-300 w-full">
                                    {isStarted ? (
                                        <>
                                            <div className={`px-4 py-2 rounded-xl font-mono text-3xl font-bold tracking-widest shadow-lg border-2 flex items-center gap-2 transition-all duration-500 ${isLive ? 'bg-red-600 text-white border-red-700' : 'bg-slate-800 text-white border-slate-900'}`}><span>{match.homeScore ?? 0}</span><span className="opacity-50 text-xl mx-1">:</span><span>{match.awayScore ?? 0}</span></div>
                                            {!showStatusBadge && pointsEarned !== null && !isAdminMode && <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-in slide-in-from-top-1 ${pointsEarned > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>+{pointsEarned} {lang.points}</div>}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 w-full">
                                             <div className="px-4 py-2 rounded-xl font-mono text-2xl font-bold tracking-widest shadow-sm border border-slate-200 bg-slate-50 text-slate-300 flex items-center gap-2"><span>-</span><span className="opacity-50 text-lg mx-1">:</span><span>-</span></div>
                                             <div className="w-full">{renderControlButtons()}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* ADMIN DEBUG BADGE: WHY IS SUB HIDDEN? */}
                    {isAdminMode && !canSubstitute && phase === 'LIVE' && !isStarted && !isUnlockedBySub && (
                        <div className="mt-2 text-[8px] bg-red-100 text-red-600 px-1 py-0.5 rounded flex gap-1">
                            <AlertCircle size={8} /> Sub Hidden. OnSub?: {onSubstitute ? 'Yes' : 'No'}
                        </div>
                    )}
                </div>

                {/* Away Team */}
                <div onClick={() => { if (isAwayTBD) return; if(isKnockout && !isLocked) { setLocalHome(0); setLocalAway(1); setIsDirty(true); } else if(isAwayClickable && onTeamClick) onTeamClick(match.awayTeamId); }} className={`flex-shrink-0 w-28 sm:w-36 flex flex-col items-center justify-start gap-2 z-10 p-2 rounded-xl transition-all relative group/team ${isAwayClickable ? 'cursor-pointer hover:bg-slate-50 active:scale-95' : ''} ${predictedWinnerId === match.awayTeamId && isKnockout ? 'bg-blue-50 ring-2 ring-blue-500 shadow-md' : ''} ${predictedWinnerId && predictedWinnerId !== match.awayTeamId && isKnockout && isLocked ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                    {isAwayTBD ? <TbdSlot matchId={match.id} side="away" allMatches={allMatches} allTeams={allTeams} lang={lang} /> : <div className="relative shadow-sm rounded-lg overflow-visible w-14 h-10 sm:w-16 sm:h-12 pointer-events-none shrink-0"><div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white">{awayTeam?.flag ? <img src={awayTeam.flag} alt={awayName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100"></div>}</div>{awayTeam?.rank && <div className="absolute -bottom-2 -right-2 bg-[#0f2545] text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md z-20">#{awayTeam.rank}</div>}</div>}
                    <div className="flex flex-col items-center w-full">
                        {!isAwayTBD && (
                            <>
                                <div className="h-8 flex items-center justify-center w-full px-1"><span className={`font-black text-slate-800 text-xs leading-tight uppercase tracking-tight text-center line-clamp-2 w-full ${predictedWinnerId === match.awayTeamId ? 'text-blue-700' : ''}`}>{awayName}</span></div>
                                {match.groupId && awayTeamPoints !== undefined && <span className="text-[9px] font-bold text-slate-400">{awayTeamPoints} {lang.pts || 'pts'}</span>}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* EXPANDABLE SECTIONS */}
            {h2hData && !isLocked && !isKnockout && !isHomeTBD && !isAwayTBD && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 cursor-pointer group" onClick={() => setShowHistoryDetails(!showHistoryDetails)}>
                    <div className="flex items-center justify-between mb-2 opacity-80 group-hover:opacity-100 transition-opacity"><div className="flex items-center gap-2"><History size={12} className="text-slate-400" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{lang.headToHead}</span></div><ChevronDown size={14} className={`text-slate-300 transition-transform duration-300 ${showHistoryDetails ? 'rotate-180' : ''}`} /></div>
                    <div className="flex flex-col gap-2">
                        {h2hData.totalMatches > 0 ? (
                            <div className="flex h-1.5 rounded-full overflow-hidden w-full shadow-sm bg-slate-100"><div style={{ width: `${(h2hData.homeWins / h2hData.totalMatches) * 100}%` }} className="bg-emerald-500"></div><div style={{ width: `${(h2hData.draws / h2hData.totalMatches) * 100}%` }} className="bg-slate-300"></div><div style={{ width: `${(h2hData.awayWins / h2hData.totalMatches) * 100}%` }} className="bg-blue-500"></div></div>
                        ) : (<div className="text-center text-[10px] text-slate-400 italic font-medium bg-slate-50 py-1 rounded">{lang.firstMeeting}</div>)}
                        {showHistoryDetails && h2hData.last5.length > 0 && <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">{h2hData.last5.map((m, i) => (<div key={i} className="flex justify-between text-[9px] text-slate-500"><span>{m.year}</span><span className="font-bold">{m.homeScore}-{m.awayScore}</span></div>))}</div>}
                    </div>
                </div>
            )}

            {showRivals && rivals.length > 0 && (
                <div className={`bg-[#0f2545] p-3 animate-in slide-in-from-top-2 ${showStatusBadge ? 'border-b border-white/10' : 'rounded-b-2xl'}`}>
                    <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><LockIcon size={10} className="text-yellow-400" /><span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">{lang.revealRival}</span></div>{prediction && <span className="text-[10px] font-bold text-white/40">{lang.myPick}: <span className="text-white">{prediction.home} - {prediction.away}</span></span>}</div>
                    <div className="flex flex-col gap-1 max-h-24 overflow-y-auto no-scrollbar">
                        {rivals.map(rival => { const rivalPred = allPredictions.find(p => p.userId === rival.email && p.matchId === match.id); return (<div key={rival.email} className="flex items-center justify-between bg-white/5 px-2 py-1.5 rounded border border-white/5 transition-colors"><div className="flex items-center gap-3"><AvatarDisplay avatar={rival.avatar} size="xs" className="w-6 h-6 text-[9px]" /><span className="text-xs font-bold text-white truncate max-w-[80px]">{rival.name}</span></div><span className="text-xs font-mono font-black text-yellow-400 tracking-wider">{rivalPred ? `${rivalPred.home} - ${rivalPred.away}` : '-'}</span></div>); })}
                    </div>
                </div>
            )}

            {showStatusBadge && (
                <div className="bg-[#0f2545] py-2 px-3 flex justify-between items-center text-white/90 relative overflow-hidden h-8 border-t border-white/10">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <div className="flex items-center gap-1.5 opacity-80 min-w-0 w-1/3"><MapPin size={10} className="shrink-0" /><span className="text-[9px] font-medium uppercase tracking-wider truncate">{match.venue || 'Stadium TBD'}</span></div>
                    
                    <div className="w-1/3 flex justify-center">
                        {prediction && (
                            <div className="flex items-center gap-1.5 text-white animate-in zoom-in">
                                <span className="text-[9px] font-medium text-white/70">{lang.myPick || "Pick"}:</span>
                                <span className="text-[10px] font-black text-yellow-400">{prediction.home} - {prediction.away}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 justify-end w-1/3">{pointsEarned !== null && !isAdminMode && <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider ${pointsEarned > 0 ? 'text-green-400' : 'text-slate-400'}`}>{pointsEarned > 0 ? <Check size={10} /> : null}<span>+{pointsEarned} PTS</span></div>}{match.isLocked && <LockIcon size={10} className="text-slate-400" />}</div>
                </div>
            )}

            {match.round && match.round !== 'R32' && match.round !== '3RD' && <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-amber-300 to-amber-500 z-10" title="Elimination Match"></div>}
        </div>
    );
};