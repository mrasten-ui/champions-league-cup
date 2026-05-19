import React, { useMemo } from 'react';
import { Match, Team, Translation, GroupStanding, Prediction, UserProfile, MatchEvent } from '../types';
import { Clock, MapPin, Trophy, Star, Tv, Check } from 'lucide-react';
import { BROADCAST_CHANNELS } from '../constants';
import { calculatePoints } from '../services/engine';
import { getSlotSource, getPotentialTeams, getGroupTeams } from '../utils/bracketHelpers';

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

export const MatchdayHero: React.FC<MatchdayHeroProps> = ({ match, teams, groupStandings, lang, locale = 'en-GB', onTeamClick, allMatches, userPrediction, currentUser, events = [] }) => {
  const home = teams[match.homeTeamId];
  const away = teams[match.awayTeamId];
  const isLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'PEN'].includes(match.status);
  const isFinished = ['FT', 'AET', 'PEN', 'FINISHED'].includes(match.status);

  const pointsEarned = isFinished && match.homeScore !== null && match.awayScore !== null && userPrediction
      ? calculatePoints(userPrediction.home, userPrediction.away, match.homeScore, match.awayScore, !!currentUser?.hasTakenSecondChance, match.round)
      : null;

  const isHomeTBD = match.homeTeamId === 'TBD' || !home;
  const isAwayTBD = match.awayTeamId === 'TBD' || !away;

  // Calculate points for display under team name
  const homeStats = groupStandings?.find(g => g.teamId === match.homeTeamId);
  const awayStats = groupStandings?.find(g => g.teamId === match.awayTeamId);

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
      if (match.groupId) return `${lang.groups || 'GROUP'} ${match.groupId}`;
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
                  {match.minute ? `${match.minute}'` : 'LIVE'}
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
      return (
          <div className="flex items-center gap-1.5 text-blue-300" title={`Watch on ${channel}`}>
              <Tv size={12} />
              <span className="text-[10px] font-black uppercase tracking-wide truncate max-w-[80px]">
                  {channel}
              </span>
          </div>
      );
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
                        <span className="text-sm sm:text-lg font-black text-white uppercase tracking-tight text-center leading-none mb-1">{lang.teamNames[home.id] || home.name}</span>
                        {homeStats && <span className="text-[10px] font-bold text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-800/50">{homeStats.pts} PTS</span>}
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
                        <span className="text-sm sm:text-lg font-black text-white uppercase tracking-tight text-center leading-none mb-1">{lang.teamNames[away.id] || away.name}</span>
                        {awayStats && <span className="text-[10px] font-bold text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-800/50">{awayStats.pts} PTS</span>}
                    </div>
                )}
            </div>
        </div>

        {/* MATCH EVENTS STRIP */}
        {(() => {
          const sig = events.filter(e =>
            e.type === 'Goal' ||
            (e.type === 'Card' && (e.detail === 'Yellow Card' || e.detail === 'Red Card'))
          );
          if (!sig.length) return null;
          const homeEvts = sig.filter(e => e.teamId === match.homeTeamId).sort((a, b) => a.minute - b.minute);
          const awayEvts = sig.filter(e => e.teamId === match.awayTeamId).sort((a, b) => a.minute - b.minute);
          const fmtMin = (e: MatchEvent) => `${e.minute}${e.minuteExtra ? `+${e.minuteExtra}` : ''}'`;
          const Icon = ({ e }: { e: MatchEvent }) => {
            if (e.type === 'Card') {
              return <span className={`inline-block w-2 h-2.5 rounded-[1px] shrink-0 ${e.detail === 'Red Card' ? 'bg-red-500' : 'bg-yellow-400'}`} />;
            }
            const label = e.detail === 'Own Goal' ? '⚽OG' : e.detail === 'Penalty' ? '⚽P' : '⚽';
            return <span className="shrink-0">{label}</span>;
          };
          return (
            <div className="relative z-10 bg-black/30 border-t border-white/5 px-6 py-2.5 flex gap-4 text-[10px]">
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                {homeEvts.map(e => (
                  <span key={e.id} className="flex items-center gap-1.5 text-white/70 min-w-0">
                    <Icon e={e} />
                    <span className="font-bold text-white/90 shrink-0">{fmtMin(e)}</span>
                    <span className="truncate">{e.player}</span>
                  </span>
                ))}
              </div>
              {(homeEvts.length > 0 || awayEvts.length > 0) && <div className="w-px bg-white/10 shrink-0" />}
              <div className="flex-1 flex flex-col gap-1 items-end min-w-0">
                {awayEvts.map(e => (
                  <span key={e.id} className="flex items-center justify-end gap-1.5 text-white/70 min-w-0">
                    <span className="truncate">{e.player}</span>
                    <span className="font-bold text-white/90 shrink-0">{fmtMin(e)}</span>
                    <Icon e={e} />
                  </span>
                ))}
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
            <div className="w-1/3 flex justify-end items-center gap-1">
                {pointsEarned !== null && (
                    <>
                        {pointsEarned > 0 && <Check size={10} className="text-green-400" />}
                        <span className={`font-black ${pointsEarned > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                            {pointsEarned > 0 ? `+${pointsEarned} PTS` : '+0 PTS'}
                        </span>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};