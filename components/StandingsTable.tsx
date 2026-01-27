import React from 'react';
import { Team, Translation, GroupStanding } from '../types';

interface StandingsTableProps {
  standings: GroupStanding[];
  teams: Record<string, Team>;
  lang: Translation;
  compact?: boolean;
  onTeamClick?: (teamId: string) => void;
  highlightedTeamId?: string | null;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ 
  standings, teams, lang, compact = false, onTeamClick, highlightedTeamId 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
          <tr>
            <th className="py-2 pl-3 w-8">#</th>
            <th className="py-2">{lang.team || "Team"}</th>
            <th className="py-2 text-center w-8">{lang.mp || "MP"}</th>
            {!compact && (
                <>
                    <th className="py-2 text-center w-8 hidden sm:table-cell">{lang.w || "W"}</th>
                    <th className="py-2 text-center w-8 hidden sm:table-cell">{lang.d || "D"}</th>
                    <th className="py-2 text-center w-8 hidden sm:table-cell">{lang.l || "L"}</th>
                    <th className="py-2 text-center w-10 hidden sm:table-cell">{lang.gf || "GF"}</th>
                    <th className="py-2 text-center w-10 hidden sm:table-cell">{lang.ga || "GA"}</th>
                </>
            )}
            <th className="py-2 text-center w-10">{lang.gd || "GD"}</th>
            <th className="py-2 text-center w-10 font-bold text-slate-700">{lang.pts || "Pts"}</th>
            {!compact && <th className="py-2 w-16 text-center text-[9px] opacity-50 hidden sm:table-cell">{lang.form || "Form"}</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {standings.map((row, index) => {
            const team = teams[row.teamId];
            const isHighlighted = highlightedTeamId === row.teamId;
            const isQualifying = index < 2; // Top 2 qualify
            
            // Get last 5 matches
            const recentForm = row.form ? row.form.slice(-5) : [];

            return (
              <tr 
                key={row.teamId} 
                onClick={() => onTeamClick && onTeamClick(row.teamId)}
                className={`
                    group transition-all duration-1000 ease-out cursor-pointer
                    ${isHighlighted 
                        ? 'bg-yellow-200 scale-[1.02] shadow-[0_0_20px_rgba(250,204,21,0.4)] z-10 relative' 
                        : isQualifying 
                            ? 'hover:bg-slate-50 bg-white' // Qualifying: White
                            : 'bg-red-50/40 hover:bg-red-50' // Non-Qualifying: Light Red
                    }
                `}
              >
                <td className={`pl-3 py-3 font-bold text-[10px] ${isQualifying ? 'text-green-600' : 'text-red-500'}`}>
                    <div className={`w-5 h-5 flex items-center justify-center rounded-full ${isQualifying ? 'bg-green-100' : 'bg-red-100'}`}>
                        {index + 1}
                    </div>
                </td>
                <td className="py-3">
                    <div className="flex items-center gap-3">
                        {team?.flag && (
                            <img src={team.flag} alt={team.name} className="w-6 h-4 object-cover rounded shadow-sm border border-slate-200" />
                        )}
                        <span className={`font-bold ${isHighlighted ? 'text-slate-900' : 'text-slate-700'}`}>
                            {lang.teamNames[row.teamId] || team?.name || row.teamId}
                        </span>
                    </div>
                </td>
                <td className="text-center font-medium text-slate-500">{row.played}</td>
                {!compact && (
                    <>
                        <th className="text-center font-normal text-slate-400 hidden sm:table-cell">{row.won}</th>
                        <th className="text-center font-normal text-slate-400 hidden sm:table-cell">{row.drawn}</th>
                        <th className="text-center font-normal text-slate-400 hidden sm:table-cell">{row.lost}</th>
                        <th className="text-center font-normal text-slate-400 hidden sm:table-cell">{row.gf}</th>
                        <th className="text-center font-normal text-slate-400 hidden sm:table-cell">{row.ga}</th>
                    </>
                )}
                <td className={`text-center font-bold ${row.gd > 0 ? 'text-green-600' : row.gd < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                {/* Points Column - slightly darkened background for visibility */}
                <td className={`text-center font-black text-sm ${isQualifying ? 'text-slate-800 bg-slate-50/50' : 'text-red-900 bg-red-100/20'}`}>
                    {row.pts}
                </td>
                
                {/* FORM DISPLAY */}
                {!compact && (
                    <td className="text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-1">
                            {recentForm.length > 0 ? (
                                recentForm.map((result, i) => {
                                    let bgClass = 'bg-slate-200';
                                    if (result === 'W') bgClass = 'bg-green-500';
                                    if (result === 'L') bgClass = 'bg-rose-500';
                                    if (result === 'D') bgClass = 'bg-slate-400';
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            title={result}
                                            className={`w-1.5 h-1.5 rounded-full ${bgClass}`}
                                        ></div>
                                    );
                                })
                            ) : (
                                <span className="text-[9px] text-slate-300">-</span>
                            )}
                        </div>
                    </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};