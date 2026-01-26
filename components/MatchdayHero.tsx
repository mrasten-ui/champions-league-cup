import React from 'react';
import { Match, Team, Translation, GroupStanding } from '../types';
import { Activity, Zap, TrendingUp } from 'lucide-react';

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
  // Determine if match is live based on status
  const isLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'PEN'].includes(match.status);

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
        {/* Live Badge / Header */}
        <div className="bg-blue-600 px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-white uppercase tracking-tighter">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {lang.live || "Live Now"}
              </span>
            ) : (
              <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest flex items-center gap-1">
                <Zap size={12} /> {lang.filterUpcoming || "Next Match"}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-blue-200 uppercase">{match.venue}</span>
        </div>

        {/* Hero Scoreboard */}
        <div className="p-6 grid grid-cols-3 items-center text-white bg-gradient-to-b from-slate-900 to-slate-800">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => onTeamClick(home.id)}>
            <div className="relative">
                <img src={home?.flag} className="w-16 h-12 object-cover rounded shadow-lg border border-slate-700 group-hover:scale-110 transition-transform" alt={home?.name} />
            </div>
            <span className="text-xs font-black text-center uppercase tracking-tight">{lang.teamNames[home.id] || home.name}</span>
          </div>

          {/* Score / Time */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-4xl font-black tracking-tighter tabular-nums flex gap-2">
              <span>{match.homeScore ?? 0}</span>
              <span className="opacity-50">:</span>
              <span>{match.awayScore ?? 0}</span>
            </div>
            <div className="px-2 py-1 bg-slate-700/50 rounded text-[10px] font-bold text-slate-400">
              {isLive ? `${match.minute}'` : match.status}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => onTeamClick(away.id)}>
            <div className="relative">
                <img src={away?.flag} className="w-16 h-12 object-cover rounded shadow-lg border border-slate-700 group-hover:scale-110 transition-transform" alt={away?.name} />
            </div>
            <span className="text-xs font-black text-center uppercase tracking-tight">{lang.teamNames[away.id] || away.name}</span>
          </div>
        </div>

        {/* Live Table Snippet (Optional Context) */}
        {groupStandings && (
          <div className="bg-slate-800/50 border-t border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <TrendingUp size={12} /> Group {match.groupId} Live Stakes
            </div>
            <div className="space-y-2">
              {groupStandings.map((row, idx) => {
                const isMatchTeam = row.teamId === match.homeTeamId || row.teamId === match.awayTeamId;
                return (
                  <div key={row.teamId} className={`flex items-center text-[11px] ${isMatchTeam ? 'text-white font-bold' : 'text-slate-500 font-medium'}`}>
                    <span className="w-4">{idx + 1}</span>
                    <span className="flex-1 truncate">{lang.teamNames[row.teamId] || teams[row.teamId]?.name}</span>
                    <span className="w-8 text-center">{row.gd > 0 ? `+${row.gd}` : row.gd}</span>
                    <span className="w-8 text-right text-blue-400">{row.pts}pts</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};