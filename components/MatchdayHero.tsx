import React, { useMemo } from 'react';
import { Match, Team, Translation, GroupStanding } from '../types';
import { Activity, Clock, MapPin, Trophy, Star, Tv } from 'lucide-react';
import { getSlotSource, getPotentialTeams, getGroupTeams } from '../utils/bracketHelpers';

interface MatchdayHeroProps {
  match: Match;
  teams: Record<string, Team>;
  groupStandings?: GroupStanding[];
  lang: Translation;
  locale?: string;
  onTeamClick: (id: string) => void;
  allMatches?: Match[];
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

    // 1. GROUP SOURCE (2x2 Grid, Full Color)
    if (source.type === 'GROUP_RANK') {
        return (
            <div className="w-16 h-12 sm:w-24 sm:h-16 rounded-xl border-2 border-dashed border-white/30 bg-white/10 flex flex-col items-center justify-center relative overflow-hidden shadow-lg backdrop-blur-sm">
                {groupTeams.length > 0 ? (
                    // 2x2 GRID
                    <div className="absolute inset-0 w-full h-full grid grid-cols-2 grid-rows-2">
                        {groupTeams.slice(0, 4).map(team => (
                            <div key={team.id} className="relative w-full h-full">
                                <img src={team.flag} alt="" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                ) : (
                    // Fallback
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                )}
                
                {/* Label */}
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
            <div className="w-16 h-12 sm:w-24 sm:h-16 rounded-xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 opacity-20 bg-[url('/logo.png')] bg-center bg-cover grayscale"></div>
                <span className="relative z-10 text-[9px] sm:text-[10px] font-black text-white/50 uppercase text-center leading-tight">
                    {lang.thirdPlace || "3rd Place"}
                </span>
            </div>
        );
    }

    // 3. KNOCKOUT FEEDER (2 Flags = 1:1 Split)
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
                
                {/* Label */}
                <div className="relative z-10 flex gap-1 text-[8px] sm:text-[9px] font-black text-white uppercase leading-none bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                    <span>{potentialTeams[0].id}</span>
                    <span className="text-white/50 font-normal">/</span>
                    <span>{potentialTeams[1].id}</span>
                </div>
            </div>
        );
    }

    // 4. FALLBACK TBD
    return (
        <div className="w-16 h-12 sm:w-24 sm:h-16 rounded-xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center relative">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">TBD</span>
        </div>
    );
};

export const MatchdayHero: React.FC<MatchdayHeroProps> = ({ match, teams, groupStandings, lang, locale = 'en-GB', onTeamClick, allMatches }) => {
  const home = teams[match.homeTeamId];
  const away = teams[match.awayTeamId];
  const isLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'PEN'].includes(match.status);
  const isFinished = ['FT', 'AET', 'PEN', 'FINISHED'].includes(match.status);

  // Checks for TBD
  const isHomeTBD = match.homeTeamId === 'TBD' || !home;
  const isAwayTBD = match.awayTeamId === 'TBD' || !away;

  // Helper to find team rank in group
  const getRank = (teamId: string) => groupStandings?.findIndex(g => g.teamId === teamId) ?? -1;

  // --- HELPER LOGIC ---

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
      return (
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              <Clock size={12} />
              {new Date(match.date).toLocaleTimeString(locale, {hour: '2-digit', minute:'2-digit'})}
          </span>
      );
  };

  const getTvChannel = () => {
      if (!match.channels) return null;
      let regionKey = 'US';
      const loc = (locale || 'en-GB').toLowerCase();

      if (loc.includes('no')) regionKey = 'NO';
      else if (loc.includes('gb') || loc.includes('uk')) regionKey = 'EN';
      else if (loc.startsWith('en') && !loc.includes('us')) regionKey = 'EN'; 

      if ((lang as any).isScotland && match.channels['SCO']) {
          regionKey = 'SCO';
      }

      let channel = match.channels[regionKey];
      if (!channel) {
          channel = match.channels['EN'] || match.channels['US'] || Object.values(match.channels)[0];
      }

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
            
            {/* Home Team (or TBD) */}
            <div className="flex-1 flex flex-col items-center gap-3 group/team cursor-pointer" onClick={() => !isHomeTBD && onTeamClick(home.id)}>
                {isHomeTBD ? (
                    <TbdHeroSlot matchId={match.id} side="home" allMatches={allMatches} allTeams={teams} lang={lang} />
                ) : (
                    <div className="relative transform transition-transform group-hover/team:scale-110 duration-300">
                        <img src={home?.flag} className="w-16 h-12 sm:w-24 sm:h-16 object-cover rounded-xl shadow-lg border-2 border-white/10 bg-white" alt={home?.name} />
                        {groupStandings && (
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#0f2545]">
                                #{getRank(home.id) + 1}
                            </div>
                        )}
                    </div>
                )}
                {!isHomeTBD && <span className="text-sm sm:text-lg font-black text-white uppercase tracking-tight text-center leading-none">{lang.teamNames[home.id] || home.name}</span>}
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

            {/* Away Team (or TBD) */}
            <div className="flex-1 flex flex-col items-center gap-3 group/team cursor-pointer" onClick={() => !isAwayTBD && onTeamClick(away.id)}>
                {isAwayTBD ? (
                    <TbdHeroSlot matchId={match.id} side="away" allMatches={allMatches} allTeams={teams} lang={lang} />
                ) : (
                    <div className="relative transform transition-transform group-hover/team:scale-110 duration-300">
                        <img src={away?.flag} className="w-16 h-12 sm:w-24 sm:h-16 object-cover rounded-xl shadow-lg border-2 border-white/10 bg-white" alt={away?.name} />
                        {groupStandings && (
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#0f2545]">
                                #{getRank(away.id) + 1}
                            </div>
                        )}
                    </div>
                )}
                {!isAwayTBD && <span className="text-sm sm:text-lg font-black text-white uppercase tracking-tight text-center leading-none">{lang.teamNames[away.id] || away.name}</span>}
            </div>
        </div>

        {/* Footer: Stadium & Standings (Context) */}
        <div className="relative z-10 bg-black/20 border-t border-white/5 px-6 py-3 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest">
            {/* Left: Stadium (Venue) */}
            <div className="flex items-center gap-2">
                <MapPin size={12} className="text-slate-500" />
                <span className="truncate max-w-[120px]">{match.venue ? match.venue.split(',')[0] : 'Stadium TBD'}</span>
            </div>

            {/* Right: Top 2 Standings (If Group Stage) */}
            {groupStandings && (
                <div className="flex gap-4 hidden sm:flex">
                    {groupStandings.slice(0, 2).map((row, i) => (
                        <span key={row.teamId} className={row.teamId === match.homeTeamId || row.teamId === match.awayTeamId ? 'text-white font-bold' : ''}>
                            {i+1}. {teams[row.teamId]?.name} ({row.pts}pts)
                        </span>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};