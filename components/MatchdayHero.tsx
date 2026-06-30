import React, { useMemo, useRef } from 'react';
import { Match, Team, Translation, GroupStanding, Prediction, UserProfile, MatchEvent, MatchLineup, MatchStats, PlayerMatchStat } from '../types';
import { Clock, MapPin, Trophy, Star, Tv, RefreshCw, Unlock } from 'lucide-react';
import { BROADCAST_CHANNELS, TEAMS } from '../constants';
import { calculatePoints } from '../services/engine';
import { getSlotSource, getPotentialTeams, getGroupTeams } from '../utils/bracketHelpers';
import { KitImage, resolveKitType } from './KitImage';
import { resolveKitFallback, lookupKitDesignation } from '../kitDesignations';
import { namesMatch, abbreviateName } from '../utils/nameMatch';
import { StatsPanel } from './StatsPanel';
import { PenaltyShootout } from './PenaltyShootout';

interface MatchdayHeroProps {
  match: Match;
  teams: Record<string, Team>;
  groupStandings?: GroupStanding[];
  lang: Translation;
  locale?: string;
  onTeamClick: (id: string) => void;
  allMatches?: Match[];
  userPrediction?: Prediction;
  currentUser?: UserProfile | null;
  events?: MatchEvent[];
  lineups?: MatchLineup[];
  stats?: MatchStats | null;
  onSubstitute?: () => void;
  substitutionsLeft?: number;
  isUnlockedBySub?: boolean;
  onUpdate?: (id: string, h: number, a: number) => void;
  playerMatchStats?: PlayerMatchStat[];
  onPlayerClick?: (playerId: number | null, playerName: string, teamId: string) => void;
  onStadiumClick?: (venue: string) => void;
  predictedKnockoutWinners?: Map<string, string>;
}

// --- SUB-COMPONENT: HERO TBD SLOT ---
const TbdHeroSlot: React.FC<{ 
    matchId: string;
    side: 'home' | 'away';
    allMatches?: Match[];
    allTeams?: Record<string, Team>;
    lang: Translation;
}> = ({ matchId, side, allMatches, allTeams, lang }) => {
    
    const source = useMemo(() => getSlotSource(matchId, side), [matchId, side]);
    
    const potentialTeams = useMemo(() => {
        if (!allMatches || !allTeams) return null;
        return getPotentialTeams(source, allMatches, allTeams);
    }, [source, allMatches, allTeams]);

    const groupTeams = useMemo(() => {
        if (source.type !== 'GROUP_RANK' || !allMatches || !allTeams) return [];
        return getGroupTeams(source.groupId, allMatches, allTeams);
    }, [source, allMatches, allTeams]);

    // 1. GROUP SOURCE (2x2 Grid)
    if (source.type === 'GROUP_RANK') {
        return (
            <div className="w-16 h-12 sm:w-24 sm:h-16 rounded-xl border-2 border-dashed border-white/30 bg-white/10 flex flex-col items-center justify-center relative overflow-hidden shadow-lg backdrop-blur-sm">
                {groupTeams.length > 0 ? (
                    <div className="absolute inset-0 w-full h-full grid grid-cols-2 grid-rows-2">
                        {groupTeams.slice(0, 4).map(team => (
                            <div key={team.id} className="relative w-full h-full">
                                <img src={team.flag} alt="" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                )}
                <div className="relative z-10 bg-black/70 px-2 py-1 rounded backdrop-blur-sm shadow-md">
                    <span className="text-[9px] sm:text-[10px] font-black text-white uppercase text-center leading-none block">
                        {source.label}
                    </span>
                </div>
            </div>
        );
    }

    // 2. 3RD PLACE
    if (source.type === '3RD_PLACE') {
        return (
            <div className="w-16 h-12 sm:w-24 sm:h-16 rounded-xl border-2 border-dashed border-white/30 bg-[#0f2545] flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-[url('/logo.png')] bg-center bg-contain bg-no-repeat scale-75"></div>
                <div className="relative z-10 bg-black/70 px-2 py-1 rounded backdrop-blur-sm shadow-md">
                    <span className="text-[9px] sm:text-[10px] font-black text-white uppercase text-center leading-tight block">
                        {lang.thirdPlace || "3rd Place"}
                    </span>
                </div>
            </div>
        );
    }

    // 3. KNOCKOUT FEEDER
    if (potentialTeams && potentialTeams.length === 2) {
        return (
            <div className="w-16 h-12 sm:w-24 sm:h-16 rounded-xl border-2 border-dashed border-blue-400/50 bg-blue-900/40 flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
                <div className="absolute inset-0 w-full h-full grid grid-cols-2">
                    <div className="relative w-full h-full border-r border-white/20">
                        <img src={potentialTeams[0].flag} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="relative w-full h-full">
                        <img src={potentialTeams[1].flag} alt="" className="w-full h-full object-cover" />
                    </div>
                </div>
                <div className="relative z-10 flex gap-1 text-[8px] sm:text-[9px] font-black text-white uppercase leading-none bg-black/70 px-2 py-1 rounded backdrop-blur-sm">
                    <span>{potentialTeams[0].id}</span>
                    <span className="text-white/50 font-normal">/</span>
                    <span>{potentialTeams[1].id}</span>
                </div>
            </div>
        );
    }

    // 4. FALLBACK TBD
    return (
        <div className="w-16 h-12 sm:w-24 sm:h-16 rounded-xl border-2 border-dashed border-white/30 bg-[#0f2545] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/logo.png')] bg-center bg-contain bg-no-repeat scale-75"></div>
            <div className="relative z-10 bg-black/70 px-2 py-1 rounded backdrop-blur-sm shadow-md">
                <span className="text-[10px] font-black text-white uppercase tracking-widest block">TBD</span>
            </div>
        </div>
    );
};

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

export const MatchdayHero: React.FC<MatchdayHeroProps> = ({ match, teams, groupStandings, lang, locale = 'en-GB', onTeamClick, allMatches, userPrediction, currentUser, events = [], lineups = [], stats = null, onSubstitute, substitutionsLeft = 0, isUnlockedBySub = false, onUpdate, playerMatchStats = [], onPlayerClick, onStadiumClick, predictedKnockoutWinners }) => {
  const [activePanel, setActivePanel] = React.useState<'events' | 'lineup' | 'stats' | 'pens' | null>(null);
  const [pendingSub, setPendingSub] = React.useState(false);
  const [localHome, setLocalHome] = React.useState<number>(userPrediction?.home ?? 0);
  const [localAway, setLocalAway] = React.useState<number>(userPrediction?.away ?? 0);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const autoOpenedRef = useRef(false);
  const home = teams[match.homeTeamId];
  const away = teams[match.awayTeamId];
  const isLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'PEN'].includes(match.status);
  const isFinished = ['FT', 'AET', 'PEN', 'FINISHED'].includes(match.status);
  const isKnockout = !!match.round;
  const predictedWinnerId = isKnockout
      ? (predictedKnockoutWinners?.get(match.id) ?? null)
      : userPrediction
          ? (userPrediction.home > userPrediction.away ? match.homeTeamId
             : userPrediction.away > userPrediction.home ? match.awayTeamId
             : null)
          : null;
  const actualWinnerId = (() => {
      if (!isFinished || match.homeScore === null || match.awayScore === null) return null;
      if (match.status === 'PEN' && events.length > 0) {
          const MD = new Set(['Missed Penalty', 'Saved Penalty', 'Post', 'Woodwork']);
          const raw = events.filter(e =>
              e.type === 'Miss' ||
              (e.type === 'Goal' && MD.has(e.detail ?? '') && (e.minute ?? 0) >= 120) ||
              (e.type === 'Goal' && e.detail === 'Penalty' && (e.minute ?? 0) >= 120)
          );
          const dedup = new Map<string, typeof raw[0]>();
          for (const e of raw) {
              const k = `${e.teamId}_${e.minute}_${e.minuteExtra ?? 0}_${e.detail}`;
              const prev = dedup.get(k);
              if (!prev || (!prev.player && e.player)) dedup.set(k, e);
          }
          const psoKicks = [...dedup.values()];
          if (psoKicks.length > 0) {
              const hg = psoKicks.filter(e => e.teamId === match.homeTeamId && !MD.has(e.detail ?? '') && e.type !== 'Miss').length;
              const ag = psoKicks.filter(e => e.teamId === match.awayTeamId && !MD.has(e.detail ?? '') && e.type !== 'Miss').length;
              if (hg !== ag) return hg > ag ? match.homeTeamId : match.awayTeamId;
          }
      }
      return match.homeScore > match.awayScore ? match.homeTeamId
          : match.awayScore > match.homeScore ? match.awayTeamId
          : null;
  })();

  React.useEffect(() => {
    if ((isLive || isFinished) && !autoOpenedRef.current && events.length > 0) {
      autoOpenedRef.current = true;
      setActivePanel((match.status === 'P' || match.status === 'PEN') ? 'pens' : 'events');
    }
  }, [isLive, isFinished, events.length, match.status]);

  React.useEffect(() => {
    if (match.status === 'P') setActivePanel('pens');
  }, [match.status]);

  const pointsEarned = (isFinished || isLive) && match.homeScore !== null && match.awayScore !== null && userPrediction
      ? calculatePoints(userPrediction.home, userPrediction.away, match.homeScore, match.awayScore, !!currentUser?.hasTakenSecondChance, match.round)
      : null;

  const isHomeTBD = match.homeTeamId === 'TBD' || !home;
  const isAwayTBD = match.awayTeamId === 'TBD' || !away;

  const heroHomeKitBg   = lineups.find(l => l.teamId === match.homeTeamId)?.kitBg ?? null;
  const heroAwayKitBg   = lineups.find(l => l.teamId === match.awayTeamId)?.kitBg ?? null;
  const heroHomeKitType = lookupKitDesignation(match.homeTeamId, match.awayTeamId, match.homeTeamId) ?? resolveKitType(match.homeTeamId, heroHomeKitBg);
  const heroAwayKitType = lookupKitDesignation(match.homeTeamId, match.awayTeamId, match.awayTeamId) ?? resolveKitType(match.awayTeamId, heroAwayKitBg);

  const getContextLabel = () => {
      if (match.round) {
          const rounds: Record<string, string> = { 
              'R32': lang.roundOf32 || 'ROUND OF 32', 
              'R16': lang.roundOf16 || 'ROUND OF 16', 
              'QF': lang.quarterFinal || 'QUARTER FINAL', 
              'SF': lang.semiFinal || 'SEMI FINAL', 
              'FIN': lang.final || 'FINAL', 
              '3RD': lang.thirdPlace || '3RD PLACE' 
          };
          return rounds[match.round] || match.round;
      }
      if (match.groupId) return `${lang.group || 'GROUP'} ${match.groupId}`;
      return match.venue || 'FRIENDLY';
  };

  const getLeftStatus = () => {
      if (isFinished) {
          return <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">FT</span>;
      }
      if (isLive) {
          return (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-red-400 uppercase tracking-widest animate-pulse">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
                  LIVE
              </span>
          );
      }
      
      // 24h + Timezone
      return (
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              <Clock size={12} />
              {new Date(match.date).toLocaleTimeString(locale, { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false,
                  timeZoneName: 'short'
              })}
          </span>
      );
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

  const getTvChannel = () => {
      let regionKey = 'US';
      const loc = (locale || 'en-GB').toLowerCase();

      if (loc.includes('no')) regionKey = 'NO';
      else if (loc.includes('gb') || loc.includes('uk')) regionKey = 'EN';
      else if (loc.startsWith('en') && !loc.includes('us')) regionKey = 'EN';
      if ((lang as any).isScotland) regionKey = 'SCO';

      const specific = match.channels?.[regionKey];
      const channel = specific ? String(specific) : (BROADCAST_CHANNELS[regionKey] || null);

      if (!channel) return null;
      const url = CHANNEL_URLS[channel.toUpperCase()] ?? null;
      const inner = (
          <>
              <Tv size={12} />
              <span className="text-[10px] font-black uppercase tracking-wide truncate max-w-[80px]">{channel}</span>
          </>
      );
      return url
          ? <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-300 hover:text-blue-100 transition-colors" title={`Watch on ${channel}`}>{inner}</a>
          : <div className="flex items-center gap-1.5 text-blue-300">{inner}</div>;
  };

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500 max-w-4xl mx-auto">
      <div className="relative bg-[#0f2545] rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50 group">
        
        {/* Match of the Day Banner */}
        <div className="bg-black/40 border-b border-white/5 py-1.5 flex justify-center items-center gap-2 relative z-20">
             <Star size={10} className="text-yellow-400 fill-yellow-400 animate-pulse" />
             <span className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.25em] shadow-black drop-shadow-sm">Match of the Day</span>
             <Star size={10} className="text-yellow-400 fill-yellow-400 animate-pulse" />
        </div>

        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10"></div>

        {/* HEADER */}
        <div className="relative z-10 flex justify-between items-center px-4 py-2 border-b border-white/10 bg-[#0f2545]/80 backdrop-blur-sm h-10">
            <div className="w-1/3 flex justify-start">{getLeftStatus()}</div>
            <div className="w-1/3 flex justify-center">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5 shadow-sm">
                    {match.round && <Trophy size={10} className="text-amber-400" />}
                    <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                        {getContextLabel()}
                    </span>
                </div>
            </div>
            <div className="w-1/3 flex justify-end">{getTvChannel()}</div>
        </div>

        {/* LIVE MINUTE BAR */}
        {(() => {
            const isHT = match.status === 'HT';
            const isET = match.status === 'ET' || match.status === 'BT' || (match.minute != null && match.minute > 90);
            const matchStartMs = new Date(match.date).getTime();
            const isRecentlyFinished = isFinished && (Date.now() - matchStartMs) < 3.5 * 60 * 60 * 1000;
            const minuteLabel = formatMinute(match.minute, match.minuteExtra, match.status, events);
            const showMinute = isLive && !isHT && !!minuteLabel;

            if (!isHT && !isRecentlyFinished && !showMinute) return null;

            const colour = isRecentlyFinished ? 'text-slate-400'
                : isHT ? 'text-amber-400'
                : isET ? 'text-red-400'
                : 'text-amber-400';
            const shimmer = isET ? 'via-red-400' : 'via-amber-400';
            const label = isRecentlyFinished ? 'FT' : isHT ? 'HT' : minuteLabel;
            const showTick = !isHT && !isRecentlyFinished;
            const animate = !isRecentlyFinished && !isHT;

            return (
                <div className="relative z-10 flex flex-col items-center py-2 border-b border-white/5 bg-black/20">
                    <style>{`@keyframes liveSlide { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }`}</style>
                    <div className="flex items-start leading-none">
                        <span className={`text-2xl font-black tabular-nums ${colour}`}>{label}</span>
                        {showTick && <span className={`text-sm font-black mt-0.5 ${colour}`}>′</span>}
                    </div>
                    <div className="relative mt-1.5 w-24 h-px bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={`absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent ${shimmer} to-transparent`}
                            style={animate ? { animation: 'liveSlide 1.8s ease-in-out infinite' } : { left: '25%' }}
                        />
                    </div>
                </div>
            );
        })()}

        {/* Main Content */}
        <div className="relative z-10 p-6 sm:p-8 flex items-center justify-between">
            
            {/* Home Team */}
            <div
                className={`flex-1 flex flex-col items-center gap-3 group/team cursor-pointer ${isKnockout && isFinished && actualWinnerId === match.homeTeamId ? 'ring-2 ring-green-400/60 rounded-2xl bg-green-400/10 p-2 -m-2' : ''}`}
                onClick={() => !isHomeTBD && onTeamClick(home.id)}
            >
                {isHomeTBD ? (
                    <TbdHeroSlot matchId={match.id} side="home" allMatches={allMatches} allTeams={teams} lang={lang} />
                ) : (
                    <div className="flex items-center gap-1.5 transform transition-transform group-hover/team:scale-110 duration-300">
                        {heroHomeKitBg && <KitImage teamId={match.homeTeamId} kitBg={heroHomeKitBg} kitText={lineups.find(l => l.teamId === match.homeTeamId)?.kitText} kitType={heroHomeKitType} size="md" />}
                        <div className={`relative ${heroHomeKitBg ? 'w-14 h-10 sm:w-20 sm:h-14' : 'w-16 h-12 sm:w-24 sm:h-16'}`}>
                            <img src={home?.flag} className="w-full h-full object-cover rounded-xl shadow-lg border-2 border-white/10 bg-white" alt={home?.name} />
                            {home?.rank && (
                                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#0f2545]" title="FIFA Ranking">
                                    #{home.rank}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {!isHomeTBD && (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-sm sm:text-lg font-black text-white uppercase tracking-tight text-center leading-none">{lang.teamNames[home.id] || home.name}</span>
                        {isKnockout && isFinished && actualWinnerId === match.homeTeamId && (
                            <span className="px-2 py-0.5 rounded-full bg-green-400/20 text-green-300 border border-green-400/30 text-[9px] font-black uppercase tracking-wider">
                                {(lang as any).goingThrough || 'Going Through'}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Scoreboard */}
            <div className="flex flex-col items-center justify-center px-4 min-w-[100px]">
                {match.homeScore !== null ? (
                    <div className="text-5xl sm:text-7xl font-black text-white tracking-tighter tabular-nums flex items-center gap-1 font-mono drop-shadow-2xl">
                        <span>{match.status === 'PEN' ? Math.min(match.homeScore, match.awayScore ?? 0) : match.homeScore}</span>
                        <span className="text-white/20 text-4xl mx-1">:</span>
                        <span>{match.status === 'PEN' ? Math.min(match.homeScore, match.awayScore ?? 0) : match.awayScore}</span>
                    </div>
                ) : isUnlockedBySub && onUpdate ? (
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col items-center gap-1">
                            <button onClick={() => { setLocalHome(h => Math.min(h + 1, 20)); setIsSaved(false); }} className="w-7 h-7 rounded-full bg-white/10 hover:bg-amber-500/30 text-white font-black text-sm flex items-center justify-center active:scale-90 transition-all">+</button>
                            <span className="text-4xl font-black text-white tabular-nums font-mono">{localHome}</span>
                            <button onClick={() => { setLocalHome(h => Math.max(h - 1, 0)); setIsSaved(false); }} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-black text-sm flex items-center justify-center active:scale-90 transition-all">−</button>
                        </div>
                        <span className="text-white/20 text-3xl font-black">:</span>
                        <div className="flex flex-col items-center gap-1">
                            <button onClick={() => { setLocalAway(a => Math.min(a + 1, 20)); setIsSaved(false); }} className="w-7 h-7 rounded-full bg-white/10 hover:bg-amber-500/30 text-white font-black text-sm flex items-center justify-center active:scale-90 transition-all">+</button>
                            <span className="text-4xl font-black text-white tabular-nums font-mono">{localAway}</span>
                            <button onClick={() => { setLocalAway(a => Math.max(a - 1, 0)); setIsSaved(false); }} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-black text-sm flex items-center justify-center active:scale-90 transition-all">−</button>
                        </div>
                    </div>
                ) : (
                    <div className="text-4xl font-black text-white/10 tracking-widest">VS</div>
                )}

                {match.status === 'PEN' && (
                    <div className="mt-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-white uppercase tracking-widest backdrop-blur-md border border-white/5">
                        Penalties
                    </div>
                )}
            </div>

            {/* Away Team */}
            <div
                className={`flex-1 flex flex-col items-center gap-3 group/team cursor-pointer ${isKnockout && isFinished && actualWinnerId === match.awayTeamId ? 'ring-2 ring-green-400/60 rounded-2xl bg-green-400/10 p-2 -m-2' : ''}`}
                onClick={() => !isAwayTBD && onTeamClick(away.id)}
            >
                {isAwayTBD ? (
                    <TbdHeroSlot matchId={match.id} side="away" allMatches={allMatches} allTeams={teams} lang={lang} />
                ) : (
                    <div className="flex items-center gap-1.5 transform transition-transform group-hover/team:scale-110 duration-300">
                        <div className={`relative ${heroAwayKitBg ? 'w-14 h-10 sm:w-20 sm:h-14' : 'w-16 h-12 sm:w-24 sm:h-16'}`}>
                            <img src={away?.flag} className="w-full h-full object-cover rounded-xl shadow-lg border-2 border-white/10 bg-white" alt={away?.name} />
                            {away?.rank && (
                                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#0f2545]" title="FIFA Ranking">
                                    #{away.rank}
                                </div>
                            )}
                        </div>
                        {heroAwayKitBg && <KitImage teamId={match.awayTeamId} kitBg={heroAwayKitBg} kitText={lineups.find(l => l.teamId === match.awayTeamId)?.kitText} kitType={heroAwayKitType} size="md" />}
                    </div>
                )}
                {!isAwayTBD && (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-sm sm:text-lg font-black text-white uppercase tracking-tight text-center leading-none">{lang.teamNames[away.id] || away.name}</span>
                        {isKnockout && isFinished && actualWinnerId === match.awayTeamId && (
                            <span className="px-2 py-0.5 rounded-full bg-green-400/20 text-green-300 border border-green-400/30 text-[9px] font-black uppercase tracking-wider">
                                {(lang as any).goingThrough || 'Going Through'}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* PANEL TABS — own full-width row so they never crowd the team names/flags */}
        {(() => {
          const minsToKick = (new Date(match.date).getTime() - Date.now()) / 60_000;
          const hasLineups = lineups.length > 0;
          const hasEvents = events.length > 0;
          if (isLive || isFinished) {
            if (!hasLineups && !hasEvents) return null;
            return (
              <div className="relative z-10 flex justify-center px-4 pb-4">
                <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
                  {hasEvents && (
                    <button
                      onClick={() => setActivePanel(p => p === 'events' ? null : 'events')}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${activePanel === 'events' ? 'bg-emerald-600/40 text-emerald-200 shadow-sm' : 'text-white/40 hover:text-white/70'}`}
                    >
                      {lang.events || 'Events'}
                    </button>
                  )}
                  {hasLineups && (
                    <button
                      onClick={() => setActivePanel(p => p === 'lineup' ? null : 'lineup')}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${activePanel === 'lineup' ? 'bg-emerald-600/40 text-emerald-200 shadow-sm' : 'text-white/40 hover:text-white/70'}`}
                    >
                      {lang.lineups || 'Lineup'}
                    </button>
                  )}
                  <button
                    onClick={() => setActivePanel(p => p === 'stats' ? null : 'stats')}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${activePanel === 'stats' ? 'bg-emerald-600/40 text-emerald-200 shadow-sm' : 'text-white/40 hover:text-white/70'}`}
                  >
                    {(lang as any).statsTab || 'Stats'}
                  </button>
                  {(match.status === 'P' || match.status === 'PEN') && (
                    <button
                      onClick={() => setActivePanel(p => p === 'pens' ? null : 'pens')}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${activePanel === 'pens' ? 'bg-amber-500/40 text-amber-200 shadow-sm' : 'text-white/40 hover:text-white/70'}`}
                    >
                      {(lang as any).pensTab || 'Pens 🥅'}
                    </button>
                  )}
                </div>
              </div>
            );
          }
          if (hasLineups && minsToKick <= 55) {
            return (
              <div className="relative z-10 flex justify-center px-4 pb-4">
                <button
                  onClick={() => setActivePanel(p => p === 'lineup' ? null : 'lineup')}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                >
                  {activePanel === 'lineup' ? <span className="text-[8px]">▲</span> : <span className="text-[8px]">▼</span>}
                  {lang.lineups || 'Line-up'}
                </button>
              </div>
            );
          }
          return null;
        })()}

        {/* LINEUP PANEL */}
        {activePanel === 'lineup' && (() => {
          const homeLineups = lineups.filter(l => l.teamId === match.homeTeamId);
          const awayLineups = lineups.filter(l => l.teamId === match.awayTeamId);
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
          const PlayerRow = ({ p, side, bench }: { p: MatchLineup; side: 'home' | 'away'; bench?: boolean }) => {
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
            const isHomeTeam = p.teamId === match.homeTeamId;
            // FIFA designation always wins; API color only used when no designation exists
            const kitType: 'home' | 'away' | 'third' | undefined =
              lookupKitDesignation(match.homeTeamId, match.awayTeamId, p.teamId)
              ?? (p.kitBg ? undefined : resolveKitFallback(match.homeTeamId, match.awayTeamId, p.teamId));
            const kitIcon = <KitImage teamId={p.teamId} kitBg={p.kitBg ?? undefined} kitText={p.kitText ?? undefined} kitType={kitType} size="xs" className="shrink-0" />;
            const numBadge = p.playerNumber != null
              ? <span className="text-[8px] font-black tabular-nums text-white/40 w-5 text-center shrink-0 leading-none">{p.playerNumber}</span>
              : null;
            const goalBadges = playerGoals.map(g => (
              <span key={g.id} className="flex items-center gap-0.5 shrink-0">
                <img src="/wc26-ball.png" className="w-2.5 h-2.5 object-contain" alt="" />
                <span className="text-[7px] text-white/40">{g.minute}{g.minuteExtra ? `+${g.minuteExtra}` : ''}'</span>
              </span>
            ));
            const subBadges = <>
              {subbedOut && <span className="text-[8px] text-red-400 font-bold shrink-0 leading-none">↓{subbedOut.minute}'</span>}
              {subbedIn && <span className="text-[8px] text-green-400 font-bold shrink-0 leading-none">↑{subbedIn.minute}'</span>}
            </>;
            const dimmed = bench && !subbedIn;
            const playerClickId = p.playerId
              ?? events.find(ev => ev.playerId && namesMatch(ev.player, p.playerName))?.playerId
              ?? playerMatchStats.find(s => s.playerId && namesMatch(s.playerName, p.playerName))?.playerId
              ?? null;
            const nameClass = (out: boolean) => `text-[9px] shrink min-w-0 truncate text-left ${out ? 'text-white/30' : 'text-white/75'}`;
            const nameTap = (out: boolean) => onPlayerClick
              ? <button onClick={() => onPlayerClick(playerClickId, p.playerName, p.teamId)} className={`${nameClass(out)} hover:text-white transition-colors underline decoration-dashed decoration-white/20 underline-offset-2`}>{p.playerName}</button>
              : <span className={nameClass(out)}>{p.playerName}</span>;
            if (side === 'away') {
              return (
                <div className={`flex items-center gap-1 min-w-0 transition-opacity ${dimmed ? 'opacity-40' : 'opacity-100'}`}>
                  <span className="flex-1" />
                  {subBadges}{goalBadges}
                  {nameTap(!!subbedOut)}
                  {numBadge}{kitIcon}
                </div>
              );
            }
            return (
              <div className={`flex items-center gap-1 min-w-0 transition-opacity ${dimmed ? 'opacity-40' : 'opacity-100'}`}>
                {kitIcon}{numBadge}
                {nameTap(!!subbedOut)}
                {goalBadges}{subBadges}
                <span className="flex-1" />
              </div>
            );
          };
          const FormationHeader = ({ formation }: { formation: string }) => (
            <div className="mb-1 text-center">
              <div className="text-[7px] font-bold text-white/20 uppercase tracking-widest leading-none">Formation</div>
              <div className="text-[9px] font-black text-white/40 uppercase tracking-widest">{formation}</div>
            </div>
          );
          const SectionDivider = ({ label }: { label: string }) => (
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 border-t border-dashed border-white/15" />
              <span className="text-[7px] font-black uppercase tracking-widest text-white/30 px-1">{label}</span>
              <div className="flex-1 border-t border-dashed border-white/15" />
            </div>
          );
          const hasBench = homeSubs.length > 0 || awaySubs.length > 0;
          return (
            <div className="relative z-10 bg-black/40 border-t border-white/5 px-4 py-3">
              <SectionDivider label={lang.startingXi || 'Starting XI'} />
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  {homeFormation && <FormationHeader formation={homeFormation} />}
                  {homeXI.map(p => <PlayerRow key={p.id} p={p} side="home" />)}
                </div>
                <div className="w-px border-l border-dashed border-white/15 shrink-0" />
                <div className="flex-1 min-w-0">
                  {awayFormation && <FormationHeader formation={awayFormation} />}
                  {awayXI.map(p => <PlayerRow key={p.id} p={p} side="away" />)}
                </div>
              </div>
              {hasBench && <SectionDivider label={lang.benchLabel || 'Bench'} />}
              {hasBench && (
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    {homeSubs.map(p => <PlayerRow key={p.id} p={p} side="home" bench />)}
                  </div>
                  <div className="w-px border-l border-dashed border-white/15 shrink-0" />
                  <div className="flex-1 min-w-0">
                    {awaySubs.map(p => <PlayerRow key={p.id} p={p} side="away" bench />)}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* MATCH EVENTS STRIP */}
        {(activePanel === 'events' || (!isLive && !isFinished)) && (() => {
          const sigRaw = events.filter(e =>
            e.type === 'Goal' ||
            (e.type === 'Card' && (e.detail === 'Yellow Card' || e.detail === 'Red Card')) ||
            (e.type?.toLowerCase() === 'subst' && e.detail === 'Substitution 1')
          );
          // VAR: collect Goal Disallowed decisions per team, find and cancel the most-recent
          // goal scored at or before the VAR minute
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
          // Deduplicate: API-Football returns same event twice with different player name formats
          const seen = new Set<string>();
          const sig = sigRaw.filter(e => {
            if (cancelledIds.has(e.id)) return false;
            const key = `${e.teamId}_${e.minute}_${e.minuteExtra ?? 0}_${e.type}_${e.detail ?? ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          if (!sig.length) return null;
          const homeEvts = sig.filter(e => e.teamId === match.homeTeamId).sort((a, b) => a.minute - b.minute);
          const awayEvts = sig.filter(e => e.teamId === match.awayTeamId).sort((a, b) => a.minute - b.minute);
          const fmtMin = (e: MatchEvent) => `${e.minute}${e.minuteExtra ? `+${e.minuteExtra}` : ''}'`;
          const Icon = ({ e }: { e: MatchEvent }) => {
            if (e.type === 'Card') {
              return <span className={`inline-block w-2 h-2.5 rounded-[1px] shrink-0 ${e.detail === 'Red Card' ? 'bg-red-500' : 'bg-yellow-400'}`} />;
            }
            const suffix = e.detail === 'Own Goal' ? 'OG' : e.detail === 'Penalty' ? 'P' : '';
            return (
              <span className="flex items-center gap-0.5 shrink-0">
                <img src="/wc26-ball.png" className="w-4 h-4 shrink-0 object-contain" alt="" />
                {suffix && <span className="text-[7px] font-bold text-white/60">{suffix}</span>}
              </span>
            );
          };
          const renderEvt = (e: MatchEvent, side: 'home' | 'away') => {
            // Resolve player IDs via lookup chain: DB field → lineups name-match → playerMatchStats name-match
            const resolveId = (name: string | null | undefined): number | null => {
              if (!name) return null;
              return lineups.find(l => String(l.matchId) === String(e.matchId) && namesMatch(l.playerName, name))?.playerId
                ?? playerMatchStats.find(s => s.playerId && namesMatch(s.playerName, name))?.playerId
                ?? null;
            };

            if (e.type?.toLowerCase() === 'subst') {
              const nameSpanClass = 'flex items-center gap-1 min-w-0 flex-1';
              const outId = e.playerId ?? resolveId(e.player);
              const inId = resolveId(e.assist);
              const subName = (name: string | undefined, id: number | null | undefined, arrow: React.ReactNode, key: string) => !name ? null : (
                <span key={key} className={nameSpanClass}>
                  {arrow}
                  {onPlayerClick
                    ? <button onClick={() => onPlayerClick(id ?? null, name, e.teamId!)} className="truncate text-white/60 hover:text-white transition-colors text-left underline decoration-dashed decoration-white/20 underline-offset-2">{abbreviateName(name)}</button>
                    : <span className="truncate text-white/60">{abbreviateName(name)}</span>}
                </span>
              );
              const outSpan = subName(e.player, outId, <span className="text-red-400 font-bold shrink-0">↓</span>, 'out');
              const inSpan  = subName(e.assist, inId, <span className="text-green-400 font-bold shrink-0">↑</span>, 'in');
              return [
                <span key={e.id} className={`flex items-center gap-1.5 min-w-0 ${side === 'away' ? 'justify-end' : ''}`}>
                  {side === 'away' && outSpan}
                  {side === 'away' && inSpan}
                  <span className="font-bold text-white/90 shrink-0">{fmtMin(e)}</span>
                  {side === 'home' && outSpan}
                  {side === 'home' && inSpan}
                </span>
              ];
            }
            const isGoal = e.type === 'Goal';
            const evtPlayerId = e.playerId ?? resolveId(e.player);
            const evtNameEl = (name: string | undefined) => {
              if (!name) return <span className="italic text-white/30">—</span>;
              const cls = `truncate ${isGoal ? 'font-bold text-white text-[10px]' : 'text-[9px]'}`;
              return onPlayerClick
                ? <button onClick={() => onPlayerClick(evtPlayerId ?? null, name, e.teamId!)} className={`${cls} underline decoration-dashed decoration-white/20 underline-offset-2 hover:text-white transition-colors text-left`}>{name}</button>
                : <span className={cls}>{name}</span>;
            };
            const goalPhoto = isGoal && evtPlayerId ? (
              <img
                src={`https://media.api-sports.io/football/players/${evtPlayerId}.png`}
                className="w-4 h-4 rounded-full shrink-0 object-cover border border-white/20"
                onError={ev => { (ev.target as HTMLImageElement).style.display = 'none'; }}
                alt=""
              />
            ) : null;
            return [
              <span key={e.id} className={`flex items-center gap-1.5 text-white/70 min-w-0 ${isGoal ? 'min-h-[18px]' : ''} ${side === 'away' ? 'justify-end' : ''}`}>
                {side === 'away' && goalPhoto}
                {side === 'away' && evtNameEl(e.player)}
                <span className="font-bold text-white/90 shrink-0">{fmtMin(e)}</span>
                {side === 'home' && evtNameEl(e.player)}
                {side === 'home' && goalPhoto}
                <Icon e={e} />
              </span>
            ];
          };
          return (
            <div className="relative z-10 bg-black/30 border-t border-white/5 px-6 py-2.5 flex gap-4 text-[10px]">
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                {homeEvts.flatMap(e => renderEvt(e, 'home'))}
              </div>
              {(homeEvts.length > 0 || awayEvts.length > 0) && <div className="w-px bg-white/10 shrink-0" />}
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                {awayEvts.flatMap(e => renderEvt(e, 'away'))}
              </div>
            </div>
          );
        })()}

        {/* STATS PANEL */}
        {activePanel === 'stats' && (isLive || isFinished) && (
          <StatsPanel stats={stats} homeTeam={home} awayTeam={away} homeKitType={heroHomeKitType} awayKitType={heroAwayKitType} dark />
        )}

        {/* PENALTY SHOOTOUT PANEL */}
        {activePanel === 'pens' && (match.status === 'P' || match.status === 'PEN') && (
          <PenaltyShootout match={match} events={events} teams={teams} lang={lang} />
        )}

        {/* Footer: Stadium & User Prediction */}
        <div className="relative z-10 bg-black/20 border-t border-white/5 px-6 py-3 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest">
            {/* Left: Stadium */}
            <div className="flex items-center gap-2 w-1/3">
                <MapPin size={12} className="text-slate-500 shrink-0" />
                {onStadiumClick && match.venue ? (
                    <button
                        onClick={() => onStadiumClick(match.venue!)}
                        className="truncate max-w-[120px] underline decoration-dashed underline-offset-2 decoration-slate-600 hover:text-amber-400 hover:decoration-amber-400 transition-colors"
                    >
                        {match.venue.split(',')[0]}
                    </button>
                ) : (
                    <span className="truncate max-w-[120px]">{match.venue ? match.venue.split(',')[0] : 'Stadium TBD'}</span>
                )}
            </div>

            {/* Center: Prediction */}
            <div className="w-1/3 flex justify-center">
                {isKnockout && predictedWinnerId && (predictedWinnerId === match.homeTeamId || predictedWinnerId === match.awayTeamId) && !isFinished ? (
                    <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest animate-in zoom-in">
                        {lang.myPick || "Pick"}: {lang.teamNames?.[predictedWinnerId] || teams[predictedWinnerId]?.name || predictedWinnerId}
                    </span>
                ) : !isKnockout && userPrediction ? (
                    <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest animate-in zoom-in">
                        {lang.myPick || "Pick"}: {userPrediction.home} - {userPrediction.away}
                    </span>
                ) : null}
            </div>

            {/* Right: Points earned or SUB button */}
            <div className="w-1/3 flex justify-end items-center">
                {(isLive || isFinished) && pointsEarned !== null && (() => {
                    const isExact = userPrediction && match.homeScore !== null && userPrediction.home === match.homeScore && userPrediction.away === match.awayScore;
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
                {!isLive && !isFinished && isUnlockedBySub && onUpdate && (() => {
                    const isDirty = localHome !== (userPrediction?.home ?? 0) || localAway !== (userPrediction?.away ?? 0);
                    if (isSaved) return (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border bg-green-500/20 border-green-500/40 text-green-400 text-[9px] font-black uppercase tracking-wide">
                            ✓ {lang.saveBtn || 'SAVED'}
                        </div>
                    );
                    if (isDirty) return (
                        <button
                            disabled={isSaving}
                            onClick={async () => {
                                setIsSaving(true);
                                await onUpdate(match.id, localHome, localAway);
                                setIsSaving(false);
                                setIsSaved(true);
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded border bg-amber-500 border-amber-600 text-white text-[9px] font-black uppercase tracking-wide active:scale-95 transition-all shadow-sm"
                        >
                            {lang.saveBtn || 'SAVE'}
                        </button>
                    );
                    return (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border bg-amber-500/20 border-amber-500/40 text-amber-400 text-[9px] font-black uppercase tracking-wide">
                            <Unlock size={8} />
                            <span>{lang.unlocked || 'UNLOCKED'}</span>
                        </div>
                    );
                })()}
                {!isLive && !isFinished && !isUnlockedBySub && onSubstitute && !isKnockout && (
                    pendingSub ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                            <span className="text-[9px] text-white/60">{lang.subConfirm || 'Use a sub?'}</span>
                            <button
                                onClick={() => { onSubstitute(); setPendingSub(false); }}
                                className="px-2 py-0.5 rounded border bg-amber-500/30 border-amber-400/60 text-amber-300 text-[9px] font-black uppercase tracking-wide active:scale-95 transition-all"
                            >✓</button>
                            <button
                                onClick={() => setPendingSub(false)}
                                className="px-2 py-0.5 rounded border bg-white/5 border-white/20 text-white/50 text-[9px] font-black uppercase tracking-wide active:scale-95 transition-all"
                            >✗</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => { if (substitutionsLeft > 0) setPendingSub(true); }}
                            disabled={substitutionsLeft <= 0}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-wide transition-all active:scale-95 ${
                                substitutionsLeft > 0
                                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                                    : 'bg-amber-900/40 border-amber-800/40 text-amber-700/70 cursor-not-allowed'
                            }`}
                        >
                            <RefreshCw size={8} />
                            <span>{lang.makeSub || 'SUB'} ({substitutionsLeft})</span>
                        </button>
                    )
                )}
            </div>
        </div>
      </div>
    </div>
  );
};