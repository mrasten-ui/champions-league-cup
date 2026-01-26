import React from 'react';
import { Match, Team, Translation, GroupStanding } from '../types';
import { Activity, Clock, MapPin, Trophy, Star } from 'lucide-react';

interface MatchdayHeroProps {
  match: Match;
  teams: Record<string, Team>;
  groupStandings?: GroupStanding[];
  lang: Translation;
  onTeamClick: (id: string) => void;
}

export const MatchdayHero: React.FC<MatchdayHeroProps> = ({ match, teams, groupStandings, lang, onTeamClick }) => {
  const home = teams[match.homeTeamId];
  const away = teams[match.awayTeamId];
  const isLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'PEN'].includes(match.status);
  const isFinished = ['FT', 'AET', 'PEN', 'FINISHED'].includes(match.status);

  // Helper to find team rank in group
  const getRank = (teamId: string) => groupStandings?.findIndex(g => g.teamId === teamId) ?? -1;

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500 max-w-4xl mx-auto">
      {/* MATCH OF THE DAY HEADLINE */}
      <div className="flex items-center justify-center gap-2 mb-2">
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Match of the Day</span>
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
      </div>

      <div className="relative bg-[#0f2545] rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50 group">
        
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10"></div>

        {/* Header: Status & Venue */}
        <div className="relative z-10 flex justify-between items-center px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                {isLive ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-900/30 px-2 py-1 rounded-full border border-red-500/30 animate-pulse">
                        <Activity size={10} /> Live Now • {match.minute}'
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Clock size={10} /> {isFinished ? "Full Time" : new Date(match.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                <MapPin size={10} />
                <span className="truncate max-w-[150px]">{match.venue.split(',')[0]}</span>
            </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 p-6 sm:p-8 flex items-center justify-between">
            
            {/* Home Team */}
            <div className="flex-1 flex flex-col items-center gap-3 group/team cursor-pointer" onClick={() => onTeamClick(home.id)}>
                <div className="relative transform transition-transform group-hover/team:scale-110 duration-300">
                    <img src={home?.flag} className="w-16 h-12 sm:w-24 sm:h-16 object-cover rounded-xl shadow-lg border-2 border-white/10 bg-white" alt={home?.name} />
                    {groupStandings && (
                        <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#0f2545]">
                            #{getRank(home.id) + 1}
                        </div>
                    )}
                </div>
                <span className="text-sm sm:text-lg font-black text-white uppercase tracking-tight text-center leading-none">{lang.teamNames[home.id] || home.name}</span>
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
            <div className="flex-1 flex flex-col items-center gap-3 group/team cursor-pointer" onClick={() => onTeamClick(away.id)}>
                <div className="relative transform transition-transform group-hover/team:scale-110 duration-300">
                    <img src={away?.flag} className="w-16 h-12 sm:w-24 sm:h-16 object-cover rounded-xl shadow-lg border-2 border-white/10 bg-white" alt={away?.name} />
                    {groupStandings && (
                        <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#0f2545]">
                            #{getRank(away.id) + 1}
                        </div>
                    )}
                </div>
                <span className="text-sm sm:text-lg font-black text-white uppercase tracking-tight text-center leading-none">{lang.teamNames[away.id] || away.name}</span>
            </div>
        </div>

        {/* Footer: Group Context */}
        {groupStandings && (
            <div className="relative z-10 bg-black/20 border-t border-white/5 px-6 py-3 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <Trophy size={12} className="text-yellow-500" />
                    <span>Group {match.groupId}</span>
                </div>
                <div className="flex gap-4">
                    {groupStandings.slice(0, 2).map((row, i) => (
                        <span key={row.teamId} className={row.teamId === match.homeTeamId || row.teamId === match.awayTeamId ? 'text-white font-bold' : ''}>
                            {i+1}. {teams[row.teamId]?.name} ({row.pts}pts)
                        </span>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};