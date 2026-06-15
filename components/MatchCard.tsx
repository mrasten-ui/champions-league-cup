import React, { useState, useEffect } from 'react';
import { Match, Team, Translation, UserProfile, Prediction, TournamentPhase, MatchEvent, MatchLineup } from '../types';
import { Clock, ChevronDown, ChevronUp, RefreshCw, Unlock, Check, MapPin, Save, Trophy, Lock as LockIcon, Tv, AlertCircle } from 'lucide-react';
import { BROADCAST_CHANNELS, TEAMS } from '../constants';
import { calculatePoints } from '../services/engine';
import { AvatarDisplay } from './AvatarDisplay';
import { ScoreStepper } from './ScoreStepper';
import { TbdSlot } from './TbdSlot';
import { JerseyIcon } from './JerseyIcon';
import { KitImage, resolveKitType } from './KitImage';
import { namesMatch } from '../utils/nameMatch';

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
  revealedRivals?: string[];
  currentUser: UserProfile | null;
  allPredictions: Prediction[];
  phase: TournamentPhase;
  isAdminMode: boolean;
  isLateJoiner?: boolean;
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
  events?: MatchEvent[];
  lineups?: MatchLineup[];
  hideHeader?: boolean;
}


const formatMinute = (minute?: number | null, minuteExtra?: number | null, status?: string, evts?: MatchEvent[]): string => {
  // API-Football keeps elapsed=90 during stoppage time with extra=null; fall back to the highest minuteExtra seen in events
  const extra = (minuteExtra != null && minuteExtra > 0)
    ? minuteExtra
    : (minute != null && evts?.length)
      ? (evts.filter(e => e.minute === minute && (e.minuteExtra ?? 0) > 0).reduce((m, e) => Math.max(m, e.minuteExtra ?? 0), 0) || null)
      : null;
  if (extra != null && extra > 0) {
    if (status === '1H') return `45+${extra}`;
    if (status === '2H') return `90+${extra}`;
    if (status === 'ET' || status === 'BT') return `${minute ?? 105}+${extra}`;
  }
  if (!minute) return '';
  if (status === '1H' && minute > 45) return `45+${minute - 45}`;
  if (status === '2H' && minute > 90) return `90+${minute - 90}`;
  if ((status === 'ET' || status === 'BT') && minute > 105) return `105+${minute - 105}`;
  return `${minute}`;
};

// --- MAIN COMPONENT ---

export const MatchCard: React.FC<MatchCardProps> = ({
    match, homeTeam, awayTeam, onUpdate, lang, locale, userTokens, rivals, onSpy, currentUser, allPredictions, phase, isAdminMode, isLateJoiner = false, onSubstitute, substitutionsLeft = 0, isUnlockedBySub = false, onTeamClick, showStatusBadge = false,
    homeTeamPoints, awayTeamPoints, allMatches, allTeams, variant = 'prediction', context, cardId, events = [], lineups = [], hideHeader = false
}) => {
    const prediction = allPredictions.find(p => p.userId === currentUser?.email && p.matchId === match.id);
    
    const [localHome, setLocalHome] = useState<number | null>(prediction ? prediction.home : null);
    const [localAway, setLocalAway] = useState<number | null>(prediction ? prediction.away : null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [rivalsOpen, setRivalsOpen] = useState(true);
    const [lineupsOpen, setLineupsOpen] = useState(false);

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


    // --- STATUS HELPERS ---
    const isLive     = ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(match.status);
    const isFinished = ['FINISHED', 'FT', 'AET', 'PEN'].includes(match.status);
    const isStarted = isLive || isFinished; 
    
    // Only lock if it's actually locked, live, or finished.
    // Late joiners bypass the global lock for matches that haven't started yet.
    const matchNotStarted = match.status === 'NS' || match.status === 'UPCOMING';
    const isRealLifeLocked = (isLateJoiner && matchNotStarted)
      ? false
      : (match.isLocked || isLive || isFinished);
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

    // Kit type: resolved from API hex vs static TEAM_JERSEYS
    const cardLineups = lineups.filter(l => l.matchId === match.id);
    const homeKitBg   = cardLineups.find(l => l.teamId === match.homeTeamId)?.kitBg ?? null;
    const awayKitBg   = cardLineups.find(l => l.teamId === match.awayTeamId)?.kitBg ?? null;
    const homeKitType = resolveKitType(match.homeTeamId, homeKitBg);
    const awayKitType = resolveKitType(match.awayTeamId, awayKitBg);

    const showRivals = !isLateJoiner && (isSpied || isRealLifeLocked);

    const getContextLabel = () => {
        if (match.round) {
            const rounds: Record<string, string> = { 'R32': lang.roundOf32 || 'Round of 32', 'R16': lang.roundOf16 || 'Round of 16', 'QF': lang.quarterFinal || 'Quarter Final', 'SF': lang.semiFinal || 'Semi Final', 'FIN': lang.final || 'Final', '3RD': lang.thirdPlace || '3rd Place' };
            return rounds[match.round] || match.round;
        }
        if (match.groupId) return `${lang.group || 'GROUP'} ${match.groupId}`;
        return match.venue || 'FRIENDLY';
    };

    const getTvChannelName = () => {
        let regionKey = 'US';
        const loc = (locale || 'en-US').toLowerCase();
        if (loc.includes('no')) regionKey = 'NO';
        else if (loc.includes('gb') || loc.includes('uk')) regionKey = 'EN';
        else if (loc.startsWith('en') && !loc.includes('us')) regionKey = 'EN';
        if ((lang as any).isScotland) regionKey = 'SCO';

        // Per-match data for this region only — no cross-locale fallback
        const specific = match.channels?.[regionKey];
        return specific ? String(specific) : (BROADCAST_CHANNELS[regionKey] || null);
    };

    const CHANNEL_URLS: Record<string, string> = {
        BBC: 'https://www.bbc.co.uk/iplayer/event/fifa-world-cup',
        ITV: 'https://www.itv.com/watch',
        STV: 'https://player.stv.tv/live',
        NRK: 'https://tv.nrk.no/programmer/fotball-vm-2026',
        TV2: 'https://play.tv2.no/direkte-tv',
        FOX: 'https://www.foxsports.com/live',
        FS1: 'https://www.foxsports.com/live',
    };

    const getChannelUrl = (ch: string) => CHANNEL_URLS[ch.toUpperCase()] ?? null;

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
        const ch = getTvChannelName();
        const url = ch ? getChannelUrl(ch) : null;

        // Always show TV channel when one is available (upcoming, live, or finished)
        if (ch) return url
            ? <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-300 hover:text-blue-400 transition-colors" title={`Watch on ${ch}`}>
                <Tv size={10} /><span className="text-[10px] font-black uppercase tracking-widest">{ch}</span>
              </a>
            : <div className="flex items-center gap-1 text-slate-300"><Tv size={10} /><span className="text-[10px] font-black uppercase tracking-widest">{ch}</span></div>;

        // No channel: show venue only if the footer status bar isn't already showing it
        const venueInFooter = showStatusBadge && (isLive || isFinished);
        if (!venueInFooter) {
            const cityString = getShortVenue(match.venue);
            return (
                <div className="flex items-center gap-1 text-slate-300 opacity-90" title={match.venue || 'Stadium TBD'}>
                    <MapPin size={10} />
                    <span className="text-xs font-bold uppercase tracking-wider truncate max-w-[90px] sm:max-w-[120px]">
                        {cityString}
                    </span>
                </div>
            );
        }
        return null;
    };

    // DEFENSIVE FIX: Check for 'TBD' before parsing Date
    const getLeftStatus = () => {
        const s = match.status;

        // --- FINISHED STATES ---
        if (s === 'PEN')      return <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">FT <span className="text-amber-400">PSO</span></span>;
        if (s === 'AET')      return <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">FT <span className="text-sky-400">AET</span></span>;
        if (isFinished)       return <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">FT</span>;

        // --- LIVE STATES ---
        const liveDot = <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)] animate-pulse shrink-0" />;

        if (s === 'HT') return (
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-pulse shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">HT</span>
            </div>
        );

        if (s === 'BT') return (
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.9)] animate-pulse shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">ET HT</span>
            </div>
        );

        if (s === 'P') return (
            <div className="flex items-center gap-1.5">
                {liveDot}
                <span className="text-[10px] font-black uppercase tracking-widest text-red-400">PENS</span>
            </div>
        );

        if (s === 'INT') return (
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">INT</span>
            </div>
        );

        if (isLive) {
            return (
                <div className="flex items-center gap-1.5">
                    {liveDot}
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400 animate-pulse">
                        LIVE
                    </span>
                </div>
            );
        }

        // --- UPCOMING ---
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

    const isHomeTBD = match.homeTeamId === 'TBD' || !homeTeam;
    const isAwayTBD = match.awayTeamId === 'TBD' || !awayTeam;
    const isHomeClickable = (isKnockout && !isLocked) || (!isKnockout && onTeamClick && !match.homeTeamId.startsWith('TBD'));
    const isAwayClickable = (isKnockout && !isLocked) || (!isKnockout && onTeamClick && !match.awayTeamId.startsWith('TBD'));

    let predictedWinnerId: string | null = null;
    if (localHome !== null && localAway !== null) {
        if (localHome > localAway) predictedWinnerId = isHomeTBD ? '__home__' : match.homeTeamId;
        else if (localAway > localHome) predictedWinnerId = isAwayTBD ? '__away__' : match.awayTeamId;
    }

    return (
        <div id={cardId} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col relative group w-full ${isLive ? 'border-red-400 shadow-md ring-1 ring-red-100' : 'border-slate-200 shadow-sm'}`}>
             
             {/* HEADER */}
             {!hideHeader && (
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
             )}

             <div className="p-4 flex items-center justify-between relative z-10 gap-2 flex-1">
                {/* Home Team */}
                <div onClick={() => { if(isKnockout && !isLocked) { setLocalHome(1); setLocalAway(0); setIsDirty(true); } else if(!isHomeTBD && isHomeClickable && onTeamClick) onTeamClick(match.homeTeamId); }} className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-2 z-10 p-2 rounded-xl transition-all relative group/team ${isHomeClickable ? 'cursor-pointer hover:bg-slate-50 active:scale-95' : ''} ${(predictedWinnerId === match.homeTeamId || predictedWinnerId === '__home__') && isKnockout ? 'bg-blue-50 ring-2 ring-blue-500 shadow-md' : ''} ${predictedWinnerId && predictedWinnerId !== match.homeTeamId && predictedWinnerId !== '__home__' && isKnockout && isLocked ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                    {isHomeTBD ? <TbdSlot matchId={match.id} side="home" allMatches={allMatches} allTeams={allTeams} lang={lang} /> : (
                      <div className="flex items-center gap-1.5 pointer-events-none group-hover/team:scale-105 transition-transform duration-200">
                        {homeKitBg && <KitImage teamId={match.homeTeamId} kitBg={homeKitBg} kitText={cardLineups.find(l => l.teamId === match.homeTeamId)?.kitText} kitType={homeKitType} size="sm" />}
                        <div className={`relative shadow-sm rounded-lg overflow-visible ${homeKitBg ? 'w-12 h-9 sm:w-14 sm:h-10' : 'w-14 h-10 sm:w-16 sm:h-12'}`}>
                          <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white">{homeTeam?.flag ? <img src={homeTeam.flag} alt={homeName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100"></div>}</div>
                          {homeTeam?.rank && <div className="absolute -bottom-2 -right-2 bg-[#0f2545] text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md z-20">#{homeTeam.rank}</div>}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col items-center">
                        {!isHomeTBD && <span className={`font-black text-slate-800 text-xs leading-none uppercase tracking-tight text-center line-clamp-2 ${predictedWinnerId === match.homeTeamId ? 'text-blue-700' : ''}`}>{homeName}</span>}
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
                                <div className="flex flex-col items-center gap-2 w-full">
                                    <div className="flex items-center gap-2">
                                        <ScoreStepper
                                            value={localHome}
                                            onChange={(v) => handleScoreChange('home', v)}
                                            isLocked={isLocked}
                                            onActivate={handleActivate}
                                            ids={cardId ? { up: 'tour-up-home', down: 'tour-down-home' } : undefined}
                                            saveState={isSaved ? 'saved' : (isDirty || isSaving) ? 'syncing' : 'idle'}
                                        />
                                        <span className="font-black text-slate-300 text-lg">-</span>
                                        <ScoreStepper
                                            value={localAway}
                                            onChange={(v) => handleScoreChange('away', v)}
                                            isLocked={isLocked}
                                            onActivate={handleActivate}
                                            ids={cardId ? { up: 'tour-up-away', down: 'tour-down-away' } : undefined}
                                            saveState={isSaved ? 'saved' : (isDirty || isSaving) ? 'syncing' : 'idle'}
                                        />
                                    </div>
                                    {isUnlockedBySub && <div className="w-full">{renderControlButtons()}</div>}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center animate-in zoom-in duration-300 w-full">
                                    {(isLive || isFinished) ? (
                                        <>
                                            {isLive && (() => {
                                                const isHT = match.status === 'HT';
                                                const isET = match.status === 'ET' || match.status === 'BT' || (match.minute != null && match.minute > 90);
                                                const minLabel = formatMinute(match.minute, match.minuteExtra, match.status, events);
                                                if (!isHT && !minLabel) return null;
                                                const colour = isHT ? 'text-amber-400' : isET ? 'text-red-400' : 'text-amber-400';
                                                const shimmer = isET ? 'via-red-400' : 'via-amber-400';
                                                return (
                                                    <div className="flex flex-col items-center mb-1">
                                                        <div className="flex items-start leading-none">
                                                            <span className={`text-xl font-black tabular-nums ${colour}`}>{isHT ? 'HT' : minLabel}</span>
                                                            {!isHT && <span className={`text-xs font-black mt-0.5 ${colour}`}>′</span>}
                                                        </div>
                                                        <div className="relative mt-1.5 w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                                                            <div
                                                                className={`absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent ${shimmer} to-transparent opacity-80`}
                                                                style={isHT ? { left: '25%' } : { animation: 'liveSlide 1.8s ease-in-out infinite' }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            <div className={`px-2.5 sm:px-4 py-2 rounded-xl font-mono text-xl sm:text-3xl font-bold tracking-normal sm:tracking-widest shadow-lg border-2 flex items-center gap-1 sm:gap-2 transition-all duration-500 ${isLive ? 'bg-[#0f2545] text-white border-blue-400/60 shadow-blue-500/20' : 'bg-slate-800 text-white border-slate-900'}`}><span>{match.homeScore ?? 0}</span><span className="opacity-50 text-base sm:text-xl mx-0.5 sm:mx-1">:</span><span>{match.awayScore ?? 0}</span></div>
                                            {!showStatusBadge && pointsEarned !== null && !isAdminMode && <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-in slide-in-from-top-1 ${pointsEarned > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>+{pointsEarned} {lang.points}</div>}
                                            {lineups.filter(l => l.matchId === match.id).length > 0 && (
                                              <button onClick={() => setLineupsOpen(o => !o)} className="mt-1 flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 transition-colors">
                                                {lineupsOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                                {lang.lineups || 'Line-up'}
                                              </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 w-full">
                                             <div className="px-2.5 sm:px-4 py-2 rounded-xl font-mono text-lg sm:text-2xl font-bold tracking-normal sm:tracking-widest shadow-sm border border-slate-200 bg-slate-50 text-slate-300 flex items-center gap-1 sm:gap-2"><span>-</span><span className="opacity-50 text-sm sm:text-lg mx-0.5 sm:mx-1">:</span><span>-</span></div>
                                             {(() => {
                                               const matchLineups = lineups.filter(l => l.matchId === match.id);
                                               const minsToKick = (new Date(match.date).getTime() - Date.now()) / 60_000;
                                               if (matchLineups.length > 0 && minsToKick <= 55) {
                                                 return (
                                                   <button onClick={() => setLineupsOpen(o => !o)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 transition-colors">
                                                     {lineupsOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                                     {lang.lineups || 'Line-up'}
                                                   </button>
                                                 );
                                               }
                                               return null;
                                             })()}
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
                            <AlertCircle size={10} /> Sub status: {onSubstitute ? 'Available' : 'Not wired'}
                        </div>
                    )}
                </div>

                {/* Away Team */}
                <div onClick={() => { if(isKnockout && !isLocked) { setLocalHome(0); setLocalAway(1); setIsDirty(true); } else if(!isAwayTBD && isAwayClickable && onTeamClick) onTeamClick(match.awayTeamId); }} className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-2 z-10 p-2 rounded-xl transition-all relative group/team ${isAwayClickable ? 'cursor-pointer hover:bg-slate-50 active:scale-95' : ''} ${(predictedWinnerId === match.awayTeamId || predictedWinnerId === '__away__') && isKnockout ? 'bg-blue-50 ring-2 ring-blue-500 shadow-md' : ''} ${predictedWinnerId && predictedWinnerId !== match.awayTeamId && predictedWinnerId !== '__away__' && isKnockout && isLocked ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                    {isAwayTBD ? <TbdSlot matchId={match.id} side="away" allMatches={allMatches} allTeams={allTeams} lang={lang} /> : (
                      <div className="flex items-center gap-1.5 pointer-events-none group-hover/team:scale-105 transition-transform duration-200">
                        <div className={`relative shadow-sm rounded-lg overflow-visible ${awayKitBg ? 'w-12 h-9 sm:w-14 sm:h-10' : 'w-14 h-10 sm:w-16 sm:h-12'}`}>
                          <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white">{awayTeam?.flag ? <img src={awayTeam.flag} alt={awayName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100"></div>}</div>
                          {awayTeam?.rank && <div className="absolute -bottom-2 -right-2 bg-[#0f2545] text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md z-20">#{awayTeam.rank}</div>}
                        </div>
                        {awayKitBg && <KitImage teamId={match.awayTeamId} kitBg={awayKitBg} kitText={cardLineups.find(l => l.teamId === match.awayTeamId)?.kitText} kitType={awayKitType} size="sm" />}
                      </div>
                    )}
                    <div className="flex flex-col items-center">
                        {!isAwayTBD && <span className={`font-black text-slate-800 text-xs leading-none uppercase tracking-tight text-center line-clamp-2 ${predictedWinnerId === match.awayTeamId ? 'text-blue-700' : ''}`}>{awayName}</span>}
                    </div>
                </div>
             </div>

             {/* LINEUP PANEL */}
             {lineupsOpen && (() => {
               const matchLineups = lineups.filter(l => l.matchId === match.id);
               const homeLineups = matchLineups.filter(l => l.teamId === match.homeTeamId);
               const awayLineups = matchLineups.filter(l => l.teamId === match.awayTeamId);
               const homeFormation = homeLineups.find(l => l.isStarting)?.formation ?? null;
               const awayFormation = awayLineups.find(l => l.isStarting)?.formation ?? null;
               const sortByGrid = (a: MatchLineup, b: MatchLineup) => {
                 if (!a.grid && !b.grid) return 0;
                 if (!a.grid) return 1;
                 if (!b.grid) return -1;
                 const [ar, ac] = a.grid.split(':').map(Number);
                 const [br, bc] = b.grid.split(':').map(Number);
                 return ar !== br ? ar - br : ac - bc;
               };
               const homeXI = homeLineups.filter(l => l.isStarting).sort(sortByGrid);
               const awayXI = awayLineups.filter(l => l.isStarting).sort(sortByGrid);
               const homeSubs = homeLineups.filter(l => !l.isStarting);
               const awaySubs = awayLineups.filter(l => !l.isStarting);
               const PlayerRow = ({ p, side }: { p: MatchLineup; side: 'home' | 'away' }) => {
                 // Deduplicate goals within ±2 min (API sometimes sends same goal at 59' and 60')
                 const rawGoals = events
                   .filter(e => e.type === 'Goal' && e.teamId === p.teamId && namesMatch(e.player, p.playerName) && e.detail !== 'Own Goal')
                   .sort((a, b) => (a.minute + (a.minuteExtra ?? 0)) - (b.minute + (b.minuteExtra ?? 0)));
                 const playerGoals: typeof rawGoals = [];
                 for (const g of rawGoals) {
                   const tot = g.minute + (g.minuteExtra ?? 0);
                   if (!playerGoals.some(prev => Math.abs((prev.minute + (prev.minuteExtra ?? 0)) - tot) <= 2)) playerGoals.push(g);
                 }
                 const subEvent = events.find(e => e.type?.toLowerCase() === 'subst' && e.teamId === p.teamId && (namesMatch(e.player, p.playerName) || namesMatch(e.assist, p.playerName)));
                 const subbedOut = namesMatch(subEvent?.player, p.playerName) ? subEvent : undefined;
                 const subbedIn = namesMatch(subEvent?.assist, p.playerName) ? subEvent : undefined;
                 // When API kit color is unknown, use home/away position to pick the right PNG
                 const isHomeTeam = p.teamId === match.homeTeamId;
                 const kitTypeFallback: 'home' | 'away' = isHomeTeam ? 'home' : 'away';
                 const kitType: 'home' | 'away' | undefined = p.kitBg ? undefined : kitTypeFallback;
                 const goalBadges = playerGoals.map(g => (
                   <span key={g.id} className="flex items-center gap-0.5 shrink-0">
                     <img src="/wc26-ball.png" className="w-2.5 h-2.5 object-contain" alt="" />
                     <span className="text-[7px] text-slate-500">{g.minute}{g.minuteExtra ? `+${g.minuteExtra}` : ''}'</span>
                   </span>
                 ));
                 const subBadges = <>
                   {subbedOut && <span className="text-[8px] text-red-500 font-bold shrink-0 leading-none">↓{subbedOut.minute}'</span>}
                   {subbedIn && <span className="text-[8px] text-green-600 font-bold shrink-0 leading-none">↑{subbedIn.minute}'</span>}
                 </>;
                 const kitIcon = <KitImage teamId={p.teamId} kitBg={p.kitBg ?? undefined} kitText={p.kitText ?? undefined} kitType={kitType} size="xs" className="shrink-0" />;
                 if (side === 'away') {
                   return (
                     <div className="flex items-center gap-1 min-w-0">
                       {subBadges}{goalBadges}
                       <span className={`text-[9px] flex-1 truncate text-right ${subbedOut ? 'text-slate-400' : 'text-slate-700'}`}>{p.playerName}</span>
                       {kitIcon}
                     </div>
                   );
                 }
                 return (
                   <div className="flex items-center gap-1 min-w-0">
                     {kitIcon}
                     <span className={`text-[9px] flex-1 truncate ${subbedOut ? 'text-slate-400' : 'text-slate-700'}`}>{p.playerName}</span>
                     {goalBadges}{subBadges}
                   </div>
                 );
               };
               return (
                 <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
                   <div className="flex gap-2">
                     <div className="flex-1 min-w-0">
                       {homeFormation && (
                         <div className="mb-1 text-center">
                           <div className="text-[7px] font-bold text-slate-300 uppercase tracking-widest leading-none">Formation</div>
                           <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{homeFormation}</div>
                         </div>
                       )}
                       {homeXI.map(p => <PlayerRow key={p.id} p={p} side="home" />)}
                       {homeSubs.length > 0 && <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest my-1 text-center">Bench</div>}
                       {homeSubs.map(p => <PlayerRow key={p.id} p={p} side="home" />)}
                     </div>
                     <div className="w-px bg-slate-200 shrink-0" />
                     <div className="flex-1 min-w-0">
                       {awayFormation && (
                         <div className="mb-1 text-center">
                           <div className="text-[7px] font-bold text-slate-300 uppercase tracking-widest leading-none">Formation</div>
                           <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{awayFormation}</div>
                         </div>
                       )}
                       {awayXI.map(p => <PlayerRow key={p.id} p={p} side="away" />)}
                       {awaySubs.length > 0 && <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest my-1 text-center">Bench</div>}
                       {awaySubs.map(p => <PlayerRow key={p.id} p={p} side="away" />)}
                     </div>
                   </div>
                 </div>
               );
             })()}

             {/* MATCH EVENTS: goals + cards — schedule view only, or live/finished */}
             {(() => {
               const sigRaw = events.filter(e =>
                 e.type === 'Goal' ||
                 (e.type === 'Card' && (e.detail === 'Yellow Card' || e.detail === 'Red Card')) ||
                 e.type?.toLowerCase() === 'subst'
               );
               // VAR: collect Goal Disallowed decisions per team, find and cancel the most-recent
               // goal scored at or before the VAR minute (decision often comes minutes after the goal)
               const varCancels = new Map<string, number[]>();
               for (const e of events) {
                 if (e.type === 'Var' && e.detail === 'Goal Disallowed' && e.teamId) {
                   if (!varCancels.has(e.teamId)) varCancels.set(e.teamId, []);
                   varCancels.get(e.teamId)!.push(e.minute);
                 }
               }
               const cancelledIds = new Set<number>();
               for (const [teamId, varMins] of varCancels) {
                 const teamGoals = sigRaw
                   .filter(e => e.type === 'Goal' && e.teamId === teamId)
                   .sort((a, b) => a.minute - b.minute);
                 for (const varMin of varMins) {
                   const target = [...teamGoals].reverse().find(
                     g => g.minute <= varMin && !cancelledIds.has(g.id)
                   );
                   if (target) cancelledIds.add(target.id);
                 }
               }
               // Deduplicate: API-Football sometimes returns the same event twice
               const seen = new Set<string>();
               const deduped = sigRaw.filter(e => {
                 if (cancelledIds.has(e.id)) return false;
                 const key = `${e.teamId}_${e.minute}_${e.minuteExtra ?? 0}_${e.type}_${e.detail ?? ''}`;
                 if (seen.has(key)) return false;
                 seen.add(key);
                 return true;
               });

               // Drop duplicate yellow cards for the same player (API sometimes sends the same booking twice)
               const yellowsByPlayer = new Set<string>();
               const dedupedYellow = deduped.filter(e => {
                 if (e.type === 'Card' && e.detail === 'Yellow Card' && e.player) {
                   const pKey = `${e.teamId}::${e.player}`;
                   if (yellowsByPlayer.has(pKey)) return false;
                   yellowsByPlayer.add(pKey);
                 }
                 return true;
               });
               // Subs: deduplicate absolutely — a player can only be subbed once per game.
               // Goals/cards: drop near-dupes within ±2 minutes (API sometimes sends same
               // event at 65' and 66', or 90+4' and 90+5').
               const seenPlayerMin = new Map<string, number>();
               const sig = dedupedYellow.filter(e => {
                 const totalMin = (e.minute ?? 0) + (e.minuteExtra ?? 0);
                 const isSub = e.type?.toLowerCase() === 'subst';
                 for (const name of [e.player, e.assist]) {
                   if (!name) continue;
                   const k = `${e.teamId}::${e.type}::${name}`;
                   const prev = seenPlayerMin.get(k);
                   if (prev !== undefined && (isSub || Math.abs(totalMin - prev) <= 2)) return false;
                 }
                 for (const name of [e.player, e.assist]) {
                   if (!name) continue;
                   seenPlayerMin.set(`${e.teamId}::${e.type}::${name}`, totalMin);
                 }
                 return true;
               });
               if (!sig.length) return null;
               if (!isLive && !isFinished && variant !== 'official') return null;
               const homeEvts = sig.filter(e => e.teamId === match.homeTeamId).sort((a, b) => a.minute - b.minute);
               const awayEvts = sig.filter(e => e.teamId === match.awayTeamId).sort((a, b) => a.minute - b.minute);
               const fmtMin = (e: MatchEvent) => `${e.minute}${e.minuteExtra ? `+${e.minuteExtra}` : ''}'`;
               const Icon = ({ e }: { e: MatchEvent }) => {
                 if (e.type === 'Card') {
                   const isRed = e.detail === 'Red Card';
                   return <span className={`inline-block w-2 h-2.5 rounded-[1px] shrink-0 ${isRed ? 'bg-red-500' : 'bg-yellow-400'}`} />;
                 }
                 const suffix = e.detail === 'Own Goal' ? 'OG' : e.detail === 'Penalty' ? 'P' : '';
                 return (
                   <span className="flex items-center gap-0.5 shrink-0">
                     <img src="/wc26-ball.png" className="w-4 h-4 shrink-0 object-contain" alt="" />
                     {suffix && <span className="text-[7px] font-bold text-slate-500">{suffix}</span>}
                   </span>
                 );
               };
               const renderEvt = (e: MatchEvent, side: 'home' | 'away') => {
                 if (e.type?.toLowerCase() === 'subst') {
                   const rows = [];
                   if (e.player) rows.push(
                     <span key={`${e.id}-out`} className={`flex items-center gap-1 min-w-0 ${side === 'away' ? 'justify-end' : ''}`}>
                       {side === 'away' && <span className="truncate text-slate-500">{e.player}</span>}
                       <span className="font-bold text-slate-600 shrink-0">{fmtMin(e)}</span>
                       <span className="text-red-500 font-bold shrink-0">↓</span>
                       {side === 'home' && <span className="truncate text-slate-500">{e.player}</span>}
                     </span>
                   );
                   if (e.assist) rows.push(
                     <span key={`${e.id}-in`} className={`flex items-center gap-1 min-w-0 ${side === 'away' ? 'justify-end' : ''}`}>
                       {side === 'away' && <span className="truncate text-slate-500">{e.assist}</span>}
                       <span className="font-bold text-slate-600 shrink-0">{fmtMin(e)}</span>
                       <span className="text-green-600 font-bold shrink-0">↑</span>
                       {side === 'home' && <span className="truncate text-slate-500">{e.assist}</span>}
                     </span>
                   );
                   return rows;
                 }
                 return [
                   <span key={e.id} className={`flex items-center gap-1 text-slate-500 min-w-0 ${side === 'away' ? 'justify-end' : ''}`}>
                     {side === 'away' && <span className={`truncate ${e.type === 'Goal' ? 'font-bold text-slate-700' : ''}`}>{e.player || <span className="italic text-slate-400">—</span>}</span>}
                     <span className="font-bold text-slate-600 shrink-0">{fmtMin(e)}</span>
                     {side === 'home' && <span className={`truncate ${e.type === 'Goal' ? 'font-bold text-slate-700' : ''}`}>{e.player || <span className="italic text-slate-400">—</span>}</span>}
                     <Icon e={e} />
                   </span>
                 ];
               };
               return (
                 <div className="px-3 pt-1.5 pb-2 border-t border-slate-100 flex gap-2 text-[9px]">
                   <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                     {homeEvts.flatMap(e => renderEvt(e, 'home'))}
                   </div>
                   {(homeEvts.length > 0 || awayEvts.length > 0) && <div className="w-px bg-slate-100 shrink-0" />}
                   <div className="flex-1 flex flex-col gap-0.5 items-end min-w-0">
                     {awayEvts.flatMap(e => renderEvt(e, 'away'))}
                   </div>
                 </div>
               );
             })()}

             {/* SAVE STATUS BAR */}
             {!isLocked && !isKnockout && (isSaving || isSaved) && (
                <div className="h-7 flex items-center justify-center gap-1.5 transition-all duration-300">
                    {isSaving && <><RefreshCw size={11} className="animate-spin text-slate-400" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang.saving || 'Saving'}</span></>}
                    {isSaved && !isSaving && <><Check size={11} className="text-green-500" /><span className="text-[10px] font-bold text-green-500 uppercase tracking-widest animate-in fade-in duration-300">{lang.saved || 'Saved'}</span></>}
                </div>
             )}
             {!isLocked && !isKnockout && !isSaving && !isSaved && <div className="h-7" />}


             {canSpy && (
                <div
                    id="tour-spy-btn"
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
                <div className={`bg-slate-800 border-l-[3px] border-yellow-500/60 animate-in slide-in-from-top-2 ${showStatusBadge ? '' : 'rounded-b-2xl'}`}>
                  {/* Collapsible header */}
                  <div
                    onClick={() => setRivalsOpen(o => !o)}
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <LockIcon size={10} className="text-yellow-400 shrink-0" />
                      <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{lang.revealRival}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {prediction && <span className="text-[10px] font-bold text-white/40">{lang.myPick}: <span className="text-white/70">{prediction.home} - {prediction.away}</span></span>}
                      <span className="text-[9px] font-black text-yellow-500/70 bg-yellow-500/10 px-1.5 py-0.5 rounded-full">{rivals.length}</span>
                      {rivalsOpen ? <ChevronUp size={12} className="text-yellow-400/70" /> : <ChevronDown size={12} className="text-yellow-400/70" />}
                    </div>
                  </div>
                  {/* Expandable body */}
                  {rivalsOpen && (
                    <div className="px-3 pb-2 flex flex-col gap-1 max-h-24 overflow-y-auto no-scrollbar">
                      {rivals.map(rival => {
                        const rivalPred = allPredictions.find(p => p.userId === rival.email && p.matchId === match.id);
                        return (
                          <div key={rival.email} className="flex items-center justify-between bg-white/5 px-2 py-1.5 rounded border border-white/5">
                            <div className="flex items-center gap-3">
                              <AvatarDisplay avatar={rival.avatar} size="xs" className="w-6 h-6 text-[10px]" />
                              <span className="text-xs font-bold text-white truncate max-w-[80px]">{rival.name}</span>
                            </div>
                            <span className="text-xs font-mono font-black text-yellow-400 tracking-wider">{rivalPred ? `${rivalPred.home} - ${rivalPred.away}` : '-'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

                    <div className="flex items-center gap-2 justify-end w-1/3">
                        {(isLive || isFinished) && pointsEarned !== null && !isAdminMode && (() => {
                            const isExact = prediction && match.homeScore !== null && prediction.home === match.homeScore && prediction.away === match.awayScore;
                            const style = isExact
                                ? 'bg-green-500/20 border-green-500/40 text-green-400'
                                : pointsEarned > 0
                                ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                                : 'bg-white/5 border-white/10 text-slate-500';
                            return (
                                <div className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wide flex items-center gap-1 ${style}`}>
                                    {isLive && <div className="w-1 h-1 rounded-full bg-current animate-pulse shrink-0" />}
                                    {pointsEarned} PTS
                                </div>
                            );
                        })()}
                        {match.isLocked && <LockIcon size={10} className="text-slate-400" />}
                    </div>
                </div>
             )}

             {match.round && match.round !== 'R32' && match.round !== '3RD' && <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-amber-300 to-amber-500 z-10" title="Elimination Match"></div>}
        </div>
    );
};