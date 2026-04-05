import React, { useState, useEffect } from 'react';
import { Match, Team, Translation, UserProfile, Prediction, TournamentPhase, HeadToHeadStats } from '../types';
import { Clock, ChevronDown, RefreshCw, Unlock, Check, MapPin, Save, Trophy, Lock as LockIcon, Tv, AlertCircle } from 'lucide-react';
import { calculatePoints, fetchHeadToHeadStats } from '../services/engine';
import { AvatarDisplay } from './AvatarDisplay';
import { ScoreStepper } from './ScoreStepper';
import { TbdSlot } from './TbdSlot';
import { HeadToHeadBar } from './HeadToHeadBar';

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
  cardId?: string;
}


// --- MAIN COMPONENT ---

export const MatchCard: React.FC<MatchCardProps> = ({ 
    match, homeTeam, awayTeam, onUpdate, lang, locale, userTokens, rivals, onSpy, currentUser, allPredictions, phase, isAdminMode, onSubstitute, substitutionsLeft = 0, isUnlockedBySub = false, onTeamClick, showStatusBadge = false,
    homeTeamPoints, awayTeamPoints, allMatches, allTeams, variant = 'prediction', context, cardId
}) => {
    const prediction = allPredictions.find(p => p.userId === currentUser?.email && p.matchId === match.id);
    
    const [localHome, setLocalHome] = useState<number | null>(prediction ? prediction.home : null);
    const [localAway, setLocalAway] = useState<number | null>(prediction ? prediction.away : null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

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

    // AUTO-SAVE MECHANISM
    useEffect(() => {
        if (isDirty && localHome !== null && localAway !== null && !isUnlockedBySub) {
            const timer = setTimeout(() => {
                setIsSaving(true);
                setIsSaved(false);
                onUpdate(match.id, localHome, localAway);
                setTimeout(() => {
                    setIsSaving(false);
                    setIsDirty(false);
                    setIsSaved(true);
                    setTimeout(() => setIsSaved(false), 2000);
                }, 500);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [localHome, localAway, isDirty, isUnlockedBySub, match.id, onUpdate]);

    useEffect(() => {
        const isValidMatchup = homeTeam && awayTeam && homeTeam.id !== 'TBD' && awayTeam.id !== 'TBD';
        const shouldFetch = isValidMatchup && !isKnockout && !h2hData && !loadingH2H;

        if (shouldFetch) {
            setLoadingH2H(true);
            fetchHeadToHeadStats(homeTeam, awayTeam)
                .then(data => { setH2HData(data); setLoadingH2H(false); })
                .catch(() => setLoadingH2H(false));
        }
    }, [h2hData, loadingH2H, homeTeam, awayTeam, isKnockout]);

    // --- STATUS HELPERS ---
    const isLive = ['LIVE', '1H', '2H', 'HT', 'AET', 'PEN'].includes(match.status);
    const isFinished = ['FINISHED', 'FT', 'AET', 'PEN'].includes(match.status);
    const isStarted = isLive || isFinished; 
    
    // Only lock if it's actually locked, live, or finished
    const isRealLifeLocked = match.isLocked || isLive || isFinished;
    const isLocked = (isRealLifeLocked && !isUnlockedBySub) && !isAdminMode;
    
    const canSubstitute = isRealLifeLocked && !isLive && !isFinished && !isUnlockedBySub && onSubstitute;
    const isSpied = currentUser?.spiedMatches?.includes(match.id);
    const canSpy = !isLocked && !isSpied && !isStarted && !!onSpy && rivals.length > 0 && !canSubstitute && !isKnockout;

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
    const handleSpyClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (userTokens > 0 && window.confirm(`${lang.spyConfirm} (${userTokens}/5 ${lang.tokensLeft})`)) {
            onSpy(match.id);
        }
    };

    const pointsEarned = (isLive || isFinished) && match.homeScore !== null && match.awayScore !== null && prediction
        ? calculatePoints(prediction.home, prediction.away, match.homeScore, match.awayScore, currentUser?.hasTakenSecondChance, match.round)
        : null;

    const homeName = lang.teamNames[homeTeam?.id] || homeTeam?.name || 'TBD';
    const awayName = lang.teamNames[awayTeam?.id] || awayTeam?.name || 'TBD';
    const showRivals = isSpied || isRealLifeLocked;

    const getContextLabel = () => {
        if (match.round) {
            const rounds: Record<string, string> = { 'R32': lang.roundOf32 || 'Round of 32', 'R16': lang.roundOf16 || 'Round of 16', 'QF': lang.quarterFinal || 'Quarter Final', 'SF': lang.semiFinal || 'Semi Final', 'FIN': lang.final || 'Final', '3RD': lang.thirdPlace || '3rd Place' };
            return rounds[match.round] || match.round;
        }
        if (match.groupId) return `${lang.group || 'GROUP'} ${match.groupId}`;
        return match.venue || 'FRIENDLY';
    };

    const getTvChannelName = () => {
        if (!match.channels) return null;
        let regionKey = 'US';
        const loc = (locale || 'en-US').toLowerCase();
        if (loc.includes('no')) regionKey = 'NO';
        else if (loc.includes('gb') || loc.includes('uk')) regionKey = 'EN';
        else if (loc.startsWith('en') && !loc.includes('us')) regionKey = 'EN'; 
        if ((lang as any).isScotland && match.channels['SCO']) { regionKey = 'SCO'; }
        
        const channel = match.channels[regionKey] || match.channels['EN'] || match.channels['US'] || Object.values(match.channels)[0];
        return channel ? String(channel) : null;
    };

    const getShortVenue = (rawVenue: string | null) => {
        if (!rawVenue) return 'TBD';
        const v = rawVenue.toLowerCase();
        if (v.includes('azteca') || v.includes('mexico city')) return 'Mexico City, MX';
        if (v.includes('guadalajara') || v.includes('akron') || v.includes('zapopan')) return 'Guadalajara, MX';
        if (v.includes('monterrey') || v.includes('guadalupe')) return 'Monterrey, MX';
        if (v.includes('toronto')) return 'Toronto, CA';
        if (v.includes('vancouver') || v.includes('bc place')) return 'Vancouver, CA';
        if (v.includes('atlanta')) return 'Atlanta, US';
        if (v.includes('boston') || v.includes('foxborough')) return 'Boston, US';
        if (v.includes('dallas') || v.includes('arlington')) return 'Dallas, US';
        if (v.includes('houston')) return 'Houston, US';
        if (v.includes('kansas city')) return 'Kansas City, US';
        if (v.includes('los angeles') || v.includes('inglewood')) return 'Los Angeles, US';
        if (v.includes('miami')) return 'Miami, US';
        if (v.includes('new york') || v.includes('east rutherford')) return 'New York, US';
        if (v.includes('philadelphia')) return 'Philadelphia, US';
        if (v.includes('san francisco') || v.includes('santa clara')) return 'San Francisco, US';
        if (v.includes('seattle')) return 'Seattle, US';
        return rawVenue.includes(',') ? rawVenue.split(',')[1].trim() : rawVenue;
    };

    const renderTopRight = () => {
        const channel = getTvChannelName();
        const cityString = getShortVenue(match.venue);

        return (
            <div className="flex flex-col items-end justify-center gap-0.5 text-right">
                <div className="flex items-center gap-1 text-slate-300 opacity-90" title={match.venue || 'Stadium TBD'}>
                    <MapPin size={10} />
                    <span className="text-xs font-bold uppercase tracking-wider truncate max-w-[90px] sm:max-w-[120px]">
                        {cityString}
                    </span>
                </div>
                {channel && (
                    <div className="flex items-center gap-1 text-blue-300" title={`Watch on ${channel}`}>
                        <Tv size={10} />
                        <span className="text-[10px] font-bold uppercase tracking-wide truncate max-w-[70px] sm:max-w-[100px]">
                            {channel}
                        </span>
                    </div>
                )}
            </div>
        );
    };

    // DEFENSIVE FIX: Check for 'TBD' before parsing Date
    const getLeftStatus = () => {
        if (isFinished) return <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">FT</span>;
        if (isLive) return <div className="flex items-center gap-1.5 text-red-400 animate-pulse"><div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div><span className="text-[10px] font-black uppercase tracking-widest">{match.minute ? `${match.minute}'` : 'LIVE'}</span></div>;
        
        return (
            <div className="flex items-center gap-1.5 text-slate-300">
                <Clock size={12} />
                <span className="text-[10px] font-bold">
                    {match.date && match.date !== 'TBD' && !isNaN(new Date(match.date).getTime()) ? new Date(match.date).toLocaleTimeString(locale || 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        timeZoneName: 'short'
                    }) : 'TBD'}
                </span>
            </div>
        );
    };

    const renderControlButtons = () => {
        if (canSubstitute) {
            return <button onClick={handleSubClick} disabled={!substitutionsLeft || substitutionsLeft <= 0} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border shadow-sm transition-all active:scale-95 w-full justify-center ${substitutionsLeft && substitutionsLeft > 0 ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-500/30' : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'}`}><RefreshCw size={14} className={substitutionsLeft && substitutionsLeft > 0 ? "" : "opacity-50"} /><span className="text-[10px] font-black uppercase tracking-widest">{lang.makeSub}</span></button>;
        }
        if (isUnlockedBySub && isDirty) {
            return <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border shadow-sm transition-all hover:scale-105 active:scale-95 w-full justify-center bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-green-500/30"><Save size={14} /><span className="text-[10px] font-black uppercase tracking-widest">{lang.saveBtn}</span></button>;
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
        <div id={cardId} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col relative group w-full ${isLive ? 'border-red-400 shadow-md ring-1 ring-red-100' : 'border-slate-200 shadow-sm'}`}>
             
             {/* HEADER */}
             <div className="bg-[#0f2545] border-b border-[#1a3a6c] py-2 px-3 flex justify-between items-center min-h-[48px] text-white">
                <div className="w-1/3 flex items-center justify-start">{getLeftStatus()}</div>
                <div className="w-1/3 flex items-center justify-center text-center">
                    {variant === 'prediction' ? (
                        (context === 'groups' || context === 'knockout') ? (
                             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                                {match.date && match.date !== 'TBD' && !isNaN(new Date(match.date).getTime()) ? new Date(match.date).toLocaleDateString(locale || 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}
                             </span>
                        ) : (
                             <div className="h-6 opacity-80 flex items-center justify-center">
                                <img src="/logo-white.png" alt="Rasten Cup" className="h-full object-contain max-w-[80px]" />
                             </div>
                        )
                    ) : (
                        <div className="flex items-center gap-1.5">
                            {(match.round || match.groupId) && <Trophy size={12} className="text-amber-400" />}
                            <span className="text-xs font-black uppercase tracking-widest shadow-black/50 drop-shadow-sm whitespace-nowrap">{getContextLabel()}</span>
                        </div>
                    )}
                </div>
                <div className="w-1/3 flex items-center justify-end">
                    {renderTopRight()}
                </div>
             </div>

             <div className="p-4 flex items-center justify-between relative z-10 gap-2 flex-1">
                {/* Home Team */}
                <div onClick={() => { if (isHomeTBD) return; if(isKnockout && !isLocked) { setLocalHome(1); setLocalAway(0); setIsDirty(true); } else if(isHomeClickable && onTeamClick) onTeamClick(match.homeTeamId); }} className={`flex-1 flex flex-col items-center justify-center gap-2 z-10 p-2 rounded-xl transition-all relative group/team ${isHomeClickable ? 'cursor-pointer hover:bg-slate-50 active:scale-95' : ''} ${predictedWinnerId === match.homeTeamId && isKnockout ? 'bg-blue-50 ring-2 ring-blue-500 shadow-md' : ''} ${predictedWinnerId && predictedWinnerId !== match.homeTeamId && isKnockout && isLocked ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                    {isHomeTBD ? <TbdSlot matchId={match.id} side="home" allMatches={allMatches} allTeams={allTeams} lang={lang} /> : <div className="relative shadow-sm rounded-lg overflow-visible w-14 h-10 sm:w-16 sm:h-12 pointer-events-none"><div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white">{homeTeam?.flag ? <img src={homeTeam.flag} alt={homeName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100"></div>}</div>{homeTeam?.rank && <div className="absolute -bottom-2 -right-2 bg-[#0f2545] text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md z-20">#{homeTeam.rank}</div>}</div>}
                    <div className="flex flex-col items-center">
                        {!isHomeTBD && <><span className={`font-black text-slate-800 text-xs leading-none uppercase tracking-tight text-center line-clamp-2 ${predictedWinnerId === match.homeTeamId ? 'text-blue-700' : ''}`}>{homeName}</span>{match.groupId && homeTeamPoints !== undefined && <span className="text-[10px] font-bold text-slate-400 mt-1">{homeTeamPoints} {lang.pts || 'pts'}</span>}</>}
                    </div>
                </div>

                {/* Center Control */}
                <div className="flex flex-col items-center justify-center px-1 z-20 shrink-0 min-w-[80px]">
                    {isKnockout ? (
                        <div className="flex flex-col items-center gap-2 animate-in zoom-in duration-300 w-full">
                            <div className="text-2xl font-black text-slate-200">VS</div>
                            <div className="mt-1 w-full">{renderControlButtons()}</div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 w-full">
                            {!isLocked ? (
                                <div className="flex items-center gap-2">
                                    <ScoreStepper
                                        value={localHome}
                                        onChange={(v) => handleScoreChange('home', v)}
                                        isLocked={isLocked}
                                        onActivate={handleActivate}
                                        ids={cardId ? { up: 'tour-up-home', down: 'tour-down-home' } : undefined}
                                    />
                                    <span className="font-black text-slate-300 text-lg">-</span>
                                    <ScoreStepper
                                        value={localAway}
                                        onChange={(v) => handleScoreChange('away', v)}
                                        isLocked={isLocked}
                                        onActivate={handleActivate}
                                        ids={cardId ? { up: 'tour-up-away', down: 'tour-down-away' } : undefined}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center animate-in zoom-in duration-300 w-full">
                                    {(isLive || isFinished) ? (
                                        <>
                                            <div className={`px-4 py-2 rounded-xl font-mono text-3xl font-bold tracking-widest shadow-lg border-2 flex items-center gap-2 transition-all duration-500 ${isLive ? 'bg-red-600 text-white border-red-700' : 'bg-slate-800 text-white border-slate-900'}`}><span>{match.homeScore ?? 0}</span><span className="opacity-50 text-xl mx-1">:</span><span>{match.awayScore ?? 0}</span></div>
                                            {!showStatusBadge && pointsEarned !== null && !isAdminMode && <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-in slide-in-from-top-1 ${pointsEarned > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>+{pointsEarned} {lang.points}</div>}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 w-full">
                                             <div className="px-4 py-2 rounded-xl font-mono text-2xl font-bold tracking-widest shadow-sm border border-slate-200 bg-slate-50 text-slate-300 flex items-center gap-2"><span>-</span><span className="opacity-50 text-lg mx-1">:</span><span>-</span></div>
                                             {/* Sub Button Lives Here */}
                                             <div className="w-full">{renderControlButtons()}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* --- ADMIN ALERT --- */}
                    {isAdminMode && !canSubstitute && phase === 'LIVE' && !isStarted && !isUnlockedBySub && (
                        <div className="mt-2 text-[10px] bg-red-100 text-red-600 px-1 py-0.5 rounded flex gap-1 items-center">
                            <AlertCircle size={10} /> Sub Hidden. OnSub?: {onSubstitute ? 'Yes' : 'No'}
                        </div>
                    )}
                </div>

                {/* Away Team */}
                <div onClick={() => { if (isAwayTBD) return; if(isKnockout && !isLocked) { setLocalHome(0); setLocalAway(1); setIsDirty(true); } else if(isAwayClickable && onTeamClick) onTeamClick(match.awayTeamId); }} className={`flex-1 flex flex-col items-center justify-center gap-2 z-10 p-2 rounded-xl transition-all relative group/team ${isAwayClickable ? 'cursor-pointer hover:bg-slate-50 active:scale-95' : ''} ${predictedWinnerId === match.awayTeamId && isKnockout ? 'bg-blue-50 ring-2 ring-blue-500 shadow-md' : ''} ${predictedWinnerId && predictedWinnerId !== match.awayTeamId && isKnockout && isLocked ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                    {isAwayTBD ? <TbdSlot matchId={match.id} side="away" allMatches={allMatches} allTeams={allTeams} lang={lang} /> : <div className="relative shadow-sm rounded-lg overflow-visible w-14 h-10 sm:w-16 sm:h-12 pointer-events-none"><div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white">{awayTeam?.flag ? <img src={awayTeam.flag} alt={awayName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100"></div>}</div>{awayTeam?.rank && <div className="absolute -bottom-2 -right-2 bg-[#0f2545] text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md z-20">#{awayTeam.rank}</div>}</div>}
                    <div className="flex flex-col items-center">
                        {!isAwayTBD && <><span className={`font-black text-slate-800 text-xs leading-none uppercase tracking-tight text-center line-clamp-2 ${predictedWinnerId === match.awayTeamId ? 'text-blue-700' : ''}`}>{awayName}</span>{match.groupId && awayTeamPoints !== undefined && <span className="text-[10px] font-bold text-slate-400 mt-1">{awayTeamPoints} {lang.pts || 'pts'}</span>}</>}
                    </div>
                </div>
             </div>

             {/* SAVE STATUS BAR */}
             {!isLocked && !isKnockout && (isSaving || isSaved) && (
                <div className="h-7 flex items-center justify-center gap-1.5 transition-all duration-300">
                    {isSaving && <><RefreshCw size={11} className="animate-spin text-slate-400" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang.saving || 'Saving'}</span></>}
                    {isSaved && !isSaving && <><Check size={11} className="text-green-500" /><span className="text-[10px] font-bold text-green-500 uppercase tracking-widest animate-in fade-in duration-300">{lang.saved || 'Saved'}</span></>}
                </div>
             )}
             {!isLocked && !isKnockout && !isSaving && !isSaved && <div className="h-7" />}

             {/* EXPANDABLE SECTIONS (H2H, Rivals, Footer) */}
             {h2hData && !isLocked && !isKnockout && !isHomeTBD && !isAwayTBD && homeTeam && awayTeam && (
                <HeadToHeadBar
                    h2hData={h2hData}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    lang={lang}
                    expanded={showHistoryDetails}
                    onToggle={() => setShowHistoryDetails(!showHistoryDetails)}
                />
             )}

             {canSpy && (
                <div
                    onClick={userTokens > 0 ? handleSpyClick : undefined}
                    className={`bg-[#0f2545] py-2 px-3 flex justify-between items-center border-t border-white/10 rounded-b-2xl group transition-colors ${userTokens > 0 ? 'cursor-pointer hover:bg-[#153055]' : 'opacity-50 grayscale cursor-not-allowed'}`}
                >
                    <div className="flex items-center gap-2">
                        <LockIcon size={12} className="text-yellow-400 shrink-0" />
                        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{lang.sendScouts || 'Send out the scouts'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-white/60 group-hover:text-white/80 transition-colors">
                        {userTokens}/5 {lang.tokensLeft}
                    </span>
                </div>
             )}

             {showRivals && rivals.length > 0 && (
                <div className={`bg-[#0f2545] p-3 animate-in slide-in-from-top-2 ${showStatusBadge ? 'border-b border-white/10' : 'rounded-b-2xl'}`}>
                    <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><LockIcon size={10} className="text-yellow-400" /><span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{lang.revealRival}</span></div>{prediction && <span className="text-[10px] font-bold text-white/40">{lang.myPick}: <span className="text-white">{prediction.home} - {prediction.away}</span></span>}</div>
                    <div className="flex flex-col gap-1 max-h-24 overflow-y-auto no-scrollbar">
                        {rivals.map(rival => { const rivalPred = allPredictions.find(p => p.userId === rival.email && p.matchId === match.id); return (<div key={rival.email} className="flex items-center justify-between bg-white/5 px-2 py-1.5 rounded border border-white/5 transition-colors"><div className="flex items-center gap-3"><AvatarDisplay avatar={rival.avatar} size="xs" className="w-6 h-6 text-[10px]" /><span className="text-xs font-bold text-white truncate max-w-[80px]">{rival.name}</span></div><span className="text-xs font-mono font-black text-yellow-400 tracking-wider">{rivalPred ? `${rivalPred.home} - ${rivalPred.away}` : '-'}</span></div>); })}
                    </div>
                </div>
             )}

             {showStatusBadge && (
                <div className="bg-[#0f2545] py-2 px-3 flex justify-between items-center text-white/90 relative overflow-hidden h-8 border-t border-white/10">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <div className="flex items-center gap-1.5 opacity-80 min-w-0 w-1/3">
                        <MapPin size={10} className="shrink-0" />
                        <span className="text-[10px] font-medium uppercase tracking-wider truncate">{match.venue || 'Stadium TBD'}</span>
                    </div>

                    {/* CENTER: User Prediction */}
                    <div className="w-1/3 flex justify-center">
                        {prediction && (
                            <div className="flex items-center gap-1.5 text-white animate-in zoom-in">
                                <span className="text-[10px] font-medium text-white/70">{lang.myPick || "Pick"}:</span>
                                <span className="text-[10px] font-black text-yellow-400">{prediction.home} - {prediction.away}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 justify-end w-1/3">{pointsEarned !== null && !isAdminMode && <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${pointsEarned > 0 ? 'text-green-400' : 'text-slate-400'}`}>{pointsEarned > 0 ? <Check size={10} /> : null}<span>+{pointsEarned} PTS</span></div>}{match.isLocked && <LockIcon size={10} className="text-slate-400" />}</div>
                </div>
             )}

             {match.round && match.round !== 'R32' && match.round !== '3RD' && <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-amber-300 to-amber-500 z-10" title="Elimination Match"></div>}
        </div>
    );
};