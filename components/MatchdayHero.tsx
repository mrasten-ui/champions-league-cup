import React, { useMemo } from 'react';
import { Match, Team, Translation, GroupStanding, Prediction, UserProfile, MatchEvent, MatchLineup } from '../types';
import { Clock, MapPin, Trophy, Star, Tv } from 'lucide-react';
import { BROADCAST_CHANNELS, TEAMS } from '../constants';
import { calculatePoints } from '../services/engine';
import { getSlotSource, getPotentialTeams, getGroupTeams } from '../utils/bracketHelpers';
import { JerseyIcon } from './JerseyIcon';
import { namesMatch } from '../utils/nameMatch';

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

export const MatchdayHero: React.FC<MatchdayHeroProps> = ({ match, teams, groupStandings, lang, locale = 'en-GB', onTeamClick, allMatches, userPrediction, currentUser, events = [], lineups = [] }) => {
  const [lineupsOpen, setLineupsOpen] = React.useState(false);
  const home = teams[match.homeTeamId];
  const away = teams[match.awayTeamId];
  const isLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'PEN'].includes(match.status);
  const isFinished = ['FT', 'AET', 'PEN', 'FINISHED'].includes(match.status);

  const pointsEarned = (isFinished || isLive) && match.homeScore !== null && match.awayScore !== null && userPrediction
      ? calculatePoints(userPrediction.home, userPrediction.away, match.homeScore, match.awayScore, !!currentUser?.hasTakenSecondChance, match.round)
      : null;

  const isHomeTBD = match.homeTeamId === 'TBD' || !home;
  const isAwayTBD = match.awayTeamId === 'TBD' || !away;

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
            <div className="flex-1 flex flex-col items-center gap-3 group/team cursor-pointer" onClick={() => !isHomeTBD && onTeamClick(home.id)}>
                {isHomeTBD ? (
                    <TbdHeroSlot matchId={match.id} side="home" allMatches={allMatches} allTeams={teams} lang={lang} />
                ) : (
                    <div className="relative transform transition-transform group-hover/team:scale-110 duration-300">
                        <img src={home?.flag} className="w-16 h-12 sm:w-24 sm:h-16 object-cover rounded-xl shadow-lg border-2 border-white/10 bg-white" alt={home?.name} />
                        {home?.rank && (
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#0f2545]" title="FIFA Ranking">
                                #{home.rank}
                            </div>
                        )}
                    </div>
                )}
                {!isHomeTBD && (
                    <div className="flex flex-col items-center">
                        <span className="text-sm sm:text-lg font-black text-white uppercase tracking-tight text-center leading-none">{lang.teamNames[home.id] || home.name}</span>
                    </div>
                )}
            </div>

            {/* Scoreboard */}
            <div className="flex flex-col items-center justify-center px-4 min-w-[100px]">
                {match.homeScore !== null ? (
                    <div className="text-5xl sm:text-7xl font-black text-white tracking-tighter tabular-nums flex items-center gap-1 font-mono drop-shadow-2xl">
                        <span>{match.homeScore}</span>
                        <span className="text-white/20 text-4xl mx-1">:</span>
                        <span>{match.awayScore}</span>
                    </div>
                ) : (
                    <div className="text-4xl font-black text-white/10 tracking-widest">VS</div>
                )}

                {match.status === 'PEN' && (
                    <div className="mt-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-white uppercase tracking-widest backdrop-blur-md border border-white/5">
                        Penalties
                    </div>
                )}
                {(() => {
                  const minsToKick = (new Date(match.date).getTime() - Date.now()) / 60_000;
                  if (lineups.length > 0 && minsToKick <= 55) {
                    return (
                      <button onClick={() => setLineupsOpen(o => !o)} className="mt-2 flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white/70 border border-white/10 transition-colors">
                        {lineupsOpen ? '▲' : '▼'} {lang.lineups || 'Line-up'}
                      </button>
                    );
                  }
                  return null;
                })()}
            </div>

            {/* Away Team */}
            <div className="flex-1 flex flex-col items-center gap-3 group/team cursor-pointer" onClick={() => !isAwayTBD && onTeamClick(away.id)}>
                {isAwayTBD ? (
                    <TbdHeroSlot matchId={match.id} side="away" allMatches={allMatches} allTeams={teams} lang={lang} />
                ) : (
                    <div className="relative transform transition-transform group-hover/team:scale-110 duration-300">
                        <img src={away?.flag} className="w-16 h-12 sm:w-24 sm:h-16 object-cover rounded-xl shadow-lg border-2 border-white/10 bg-white" alt={away?.name} />
                        {away?.rank && (
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#0f2545]" title="FIFA Ranking">
                                #{away.rank}
                            </div>
                        )}
                    </div>
                )}
                {!isAwayTBD && (
                    <div className="flex flex-col items-center">
                        <span className="text-sm sm:text-lg font-black text-white uppercase tracking-tight text-center leading-none">{lang.teamNames[away.id] || away.name}</span>
                    </div>
                )}
            </div>
        </div>

        {/* LINEUP PANEL */}
        {lineupsOpen && (() => {
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
          const PlayerRow = ({ p }: { p: MatchLineup }) => {
            const playerGoals = events.filter(e => e.type === 'Goal' && e.teamId === p.teamId && namesMatch(e.player, p.playerName) && e.detail !== 'Own Goal');
            const subEvent = events.find(e => e.type?.toLowerCase() === 'subst' && e.detail === 'Substitution 1' && e.teamId === p.teamId && (namesMatch(e.player, p.playerName) || namesMatch(e.assist, p.playerName)));
            const subbedOut = namesMatch(subEvent?.assist, p.playerName) ? subEvent : undefined;
            const subbedIn = namesMatch(subEvent?.player, p.playerName) ? subEvent : undefined;
            const jersey = TEAMS[p.teamId];
            const kitBg  = p.kitBg  ?? jersey?.jerseyBg  ?? '#E2E8F0';
            const kitText = p.kitText ?? jersey?.jerseyText ?? '#64748B';
            return (
              <div className="flex items-center gap-1.5 min-w-0">
                <JerseyIcon bg={kitBg} text={kitText} number={p.playerNumber} size={22} className="shrink-0" />
                <span className={`text-[10px] flex-1 truncate ${subbedOut ? 'text-white/30' : 'text-white/80'}`}>{p.playerName}</span>
                {playerGoals.map(g => (
                  <span key={g.id} className="flex items-center gap-0.5 shrink-0">
                    <img src="/wc26-ball.png" className="w-3 h-3 object-contain" alt="" />
                    <span className="text-[8px] text-white/50">{g.minute}{g.minuteExtra ? `+${g.minuteExtra}` : ''}'</span>
                  </span>
                ))}
                {subbedOut && <span className="text-[9px] text-red-400 font-bold shrink-0 leading-none">↓{subbedOut.minute}'</span>}
                {subbedIn && <span className="text-[9px] text-green-400 font-bold shrink-0 leading-none">↑{subbedIn.minute}'</span>}
              </div>
            );
          };
          return (
            <div className="relative z-10 bg-black/40 border-t border-white/5 px-6 py-3">
              <div className="flex gap-4">
                <div className="flex-1 min-w-0">
                  {homeFormation && (
                    <div className="mb-1.5">
                      <div className="text-[7px] font-bold text-white/20 uppercase tracking-widest leading-none">Formation</div>
                      <div className="text-[9px] font-black text-white/50 uppercase tracking-widest">{homeFormation}</div>
                    </div>
                  )}
                  {homeXI.map(p => <PlayerRow key={p.id} p={p} />)}
                  {homeSubs.length > 0 && <div className="text-[8px] font-black text-white/20 uppercase tracking-widest my-1.5">Bench</div>}
                  {homeSubs.map(p => <PlayerRow key={p.id} p={p} />)}
                </div>
                <div className="w-px bg-white/10 shrink-0" />
                <div className="flex-1 min-w-0">
                  {awayFormation && (
                    <div className="mb-1.5">
                      <div className="text-[7px] font-bold text-white/20 uppercase tracking-widest leading-none">Formation</div>
                      <div className="text-[9px] font-black text-white/50 uppercase tracking-widest">{awayFormation}</div>
                    </div>
                  )}
                  {awayXI.map(p => <PlayerRow key={p.id} p={p} />)}
                  {awaySubs.length > 0 && <div className="text-[8px] font-black text-white/20 uppercase tracking-widest my-1.5">Bench</div>}
                  {awaySubs.map(p => <PlayerRow key={p.id} p={p} />)}
                </div>
              </div>
            </div>
          );
        })()}

        {/* MATCH EVENTS STRIP */}
        {(() => {
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
            if (e.type?.toLowerCase() === 'subst') {
              const rows = [];
              if (e.assist) rows.push(
                <span key={`${e.id}-out`} className={`flex items-center gap-1.5 min-w-0 ${side === 'away' ? 'justify-end' : ''}`}>
                  {side === 'away' && <span className="truncate text-white/60">{e.assist}</span>}
                  <span className="font-bold text-white/90 shrink-0">{fmtMin(e)}</span>
                  <span className="text-red-400 font-bold shrink-0">↓</span>
                  {side === 'home' && <span className="truncate text-white/60">{e.assist}</span>}
                </span>
              );
              rows.push(
                <span key={`${e.id}-in`} className={`flex items-center gap-1.5 min-w-0 ${side === 'away' ? 'justify-end' : ''}`}>
                  {side === 'away' && <span className="truncate text-white/60">{e.player}</span>}
                  <span className="font-bold text-white/90 shrink-0">{fmtMin(e)}</span>
                  <span className="text-green-400 font-bold shrink-0">↑</span>
                  {side === 'home' && <span className="truncate text-white/60">{e.player}</span>}
                </span>
              );
              return rows;
            }
            return [
              <span key={e.id} className={`flex items-center gap-1.5 text-white/70 min-w-0 ${side === 'away' ? 'justify-end' : ''}`}>
                {side === 'away' && <span className={`truncate ${e.type === 'Goal' ? 'font-bold text-white' : ''}`}>{e.player}</span>}
                <span className="font-bold text-white/90 shrink-0">{fmtMin(e)}</span>
                {side === 'home' && <span className={`truncate ${e.type === 'Goal' ? 'font-bold text-white' : ''}`}>{e.player}</span>}
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
              <div className="flex-1 flex flex-col gap-1 items-end min-w-0">
                {awayEvts.flatMap(e => renderEvt(e, 'away'))}
              </div>
            </div>
          );
        })()}

        {/* Footer: Stadium & User Prediction */}
        <div className="relative z-10 bg-black/20 border-t border-white/5 px-6 py-3 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest">
            {/* Left: Stadium */}
            <div className="flex items-center gap-2 w-1/3">
                <MapPin size={12} className="text-slate-500" />
                <span className="truncate max-w-[120px]">{match.venue ? match.venue.split(',')[0] : 'Stadium TBD'}</span>
            </div>

            {/* Center: Prediction (Moved back here, no pill) */}
            <div className="w-1/3 flex justify-center">
                {userPrediction && (
                    <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest animate-in zoom-in">
                        {lang.myPick || "Pick"}: {userPrediction.home} - {userPrediction.away}
                    </span>
                )}
            </div>

            {/* Right: Points earned */}
            <div className="w-1/3 flex justify-end items-center">
                {pointsEarned !== null && (() => {
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
            </div>
        </div>
      </div>
    </div>
  );
};