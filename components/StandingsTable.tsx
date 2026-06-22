import React from 'react';
import { Team, Translation, GroupStanding } from '../types';

interface StandingsTableProps {
  standings: GroupStanding[];
  teams: Record<string, Team>;
  lang: Translation;
  compact?: boolean;
  onTeamClick?: (teamId: string) => void;
  highlightedTeamId?: string | null;
  qualifiedThirds?: Set<string>;
  predictedRankMap?: Record<string, number>;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  standings, teams, lang, compact = false, onTeamClick, highlightedTeamId, qualifiedThirds, predictedRankMap
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
            {predictedRankMap && (
                <th className="py-2 text-center w-10 text-[9px] font-black text-slate-400 tracking-widest">PRED</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {standings.map((row, index) => {
            const team = teams[row.teamId];
            const isHighlighted = highlightedTeamId === row.teamId;
            
            // --- QUALIFICATION LOGIC ---
            const isTopTwo = index < 2;
            const isQualifiedThird = index === 2 && qualifiedThirds?.has(row.teamId);
            const isQualified = isTopTwo || isQualifiedThird;

            let rankBg = 'bg-slate-100 text-slate-400';
            if (isTopTwo) rankBg = 'bg-green-100 text-green-700';
            if (isQualifiedThird) rankBg = 'bg-amber-100 text-amber-700';

            return (
              <tr 
                key={row.teamId} 
                onClick={() => onTeamClick && onTeamClick(row.teamId)}
                className={`
                    group transition-all duration-1000 ease-out cursor-pointer
                    ${isHighlighted 
                        ? 'bg-yellow-200 scale-[1.02] shadow-[0_0_20px_rgba(250,204,21,0.4)] z-10 relative' 
                        : 'hover:bg-slate-50 bg-white'
                    }
                    ${isQualified ? 'bg-opacity-100' : 'bg-opacity-50'}
                `}
              >
                <td className="pl-3 py-3 font-bold text-[10px]">
                    <div className={`w-5 h-5 flex items-center justify-center rounded-full ${rankBg}`}>
                        {index + 1}
                        {isQualifiedThird && <span className="ml-0.5 text-[7px] font-black opacity-80">Q</span>}
                    </div>
                </td>
                <td className="py-3">
                    <div className="flex items-center gap-3">
                        {team?.flag && (
                            <img src={team.flag} alt={team.name} className="w-6 h-4 object-cover rounded shadow-sm border border-slate-200" />
                        )}
                        <span className={`font-bold ${isHighlighted ? 'text-slate-900' : 'text-slate-700'} ${!isQualified ? 'opacity-60' : ''}`}>
                            {lang.teamNames[row.teamId] || team?.name || row.teamId}
                        </span>
                    </div>
                </td>
                <td className="text-center font-medium text-slate-500">{row.played}</td>
                {!compact && (
                    <>
                        <td className="text-center font-normal text-slate-400 hidden sm:table-cell">{row.won}</td>
                        <td className="text-center font-normal text-slate-400 hidden sm:table-cell">{row.drawn}</td>
                        <td className="text-center font-normal text-slate-400 hidden sm:table-cell">{row.lost}</td>
                        <td className="text-center font-normal text-slate-400 hidden sm:table-cell">{row.gf}</td>
                        <td className="text-center font-normal text-slate-400 hidden sm:table-cell">{row.ga}</td>
                    </>
                )}
                <td className={`text-center font-bold ${row.gd > 0 ? 'text-green-600' : row.gd < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                <td className="text-center font-black text-slate-800 text-sm bg-slate-50/50">{row.pts}</td>
                {predictedRankMap && (() => {
                    const predictedRank = predictedRankMap[row.teamId];
                    const actualRank = index + 1;
                    const delta = predictedRank != null ? predictedRank - actualRank : 0;
                    if (delta > 0) return <td className="text-center text-[11px] font-black text-emerald-500 tabular-nums">▲{delta}</td>;
                    if (delta < 0) return <td className="text-center text-[11px] font-black text-red-500 tabular-nums">▼{Math.abs(delta)}</td>;
                    return <td className="text-center text-[11px] font-bold text-slate-400">=</td>;
                })()}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};