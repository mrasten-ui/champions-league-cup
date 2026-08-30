import React from 'react';
import { Team, Translation, LeagueStanding } from '../types';

interface StandingsTableProps {
  standings: LeagueStanding[];
  teams: Record<string, Team>;
  lang: Translation;
  compact?: boolean;
  onTeamClick?: (teamId: string) => void;
  highlightedTeamId?: string | null;
  predictedRankMap?: Record<string, number>;
}

// Swiss-format League Phase zones: ranks 1-8 go straight to the Round of 16,
// ranks 9-24 enter the Playoff Round, ranks 25-36 are eliminated.
const DIRECT_R16_CUTOFF = 8;
const PLAYOFF_CUTOFF = 24;

export const StandingsTable: React.FC<StandingsTableProps> = ({
  standings, teams, lang, compact = false, onTeamClick, highlightedTeamId, predictedRankMap
}) => {
  const totalCols = 3 + (compact ? 0 : 5) + 2 + (predictedRankMap ? 1 : 0);

  const zoneDivider = (label: string, colorClasses: string) => (
    <tr>
      <td colSpan={totalCols} className={`p-2 text-center border-y border-dashed ${colorClasses}`}>
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </td>
    </tr>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-blue-950/40 backdrop-blur-md">
      <table className="w-full text-sm text-left">
        <thead className="bg-white/5 text-[10px] font-bold uppercase text-slate-500 tracking-wide">
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
            <th className="py-2 text-center w-10 font-black text-slate-300">{lang.pts || "Pts"}</th>
            {predictedRankMap && (
                <th className="py-2 text-center w-10 text-[9px] font-black text-cyan-400 tracking-widest border-l-2 border-dashed border-cyan-400/30 bg-cyan-500/5">MY PRED</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {standings.map((row, index) => {
            const team = teams[row.teamId];
            const rank = index + 1;
            const isHighlighted = highlightedTeamId === row.teamId;

            const isDirectR16 = rank <= DIRECT_R16_CUTOFF;
            const isPlayoffBound = rank > DIRECT_R16_CUTOFF && rank <= PLAYOFF_CUTOFF;
            const isEliminated = rank > PLAYOFF_CUTOFF;

            const zoneBorder = isDirectR16 ? 'border-l-2 border-cyan-400' : isPlayoffBound ? 'border-l-2 border-fuchsia-400' : 'border-l-2 border-transparent';

            return (
              <React.Fragment key={row.teamId}>
                {index === DIRECT_R16_CUTOFF && zoneDivider('Playoff Round (9th – 24th)', 'bg-fuchsia-500/10 border-fuchsia-400/30 text-fuchsia-400')}
                {index === PLAYOFF_CUTOFF && zoneDivider('Eliminated', 'bg-white/5 border-white/10 text-slate-500')}

                <tr
                    onClick={() => onTeamClick && onTeamClick(row.teamId)}
                    className={`
                        group transition-all duration-500 ease-out cursor-pointer ${zoneBorder}
                        ${isHighlighted
                            ? 'bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.15)] z-10 relative'
                            : 'hover:bg-white/5'
                        }
                        ${isEliminated ? 'opacity-60' : ''}
                    `}
                >
                    <td className="pl-3 py-3 font-bold text-[10px] text-slate-400 tabular-nums">
                        {rank}
                    </td>
                    <td className="py-3">
                        <div className="flex items-center gap-3">
                            {team?.flag && (
                                <img src={team.flag} alt={team.name} className="w-6 h-4 object-cover rounded shadow-sm border border-white/10" />
                            )}
                            <span className={`font-bold ${isHighlighted ? 'text-white' : 'text-slate-300'} ${isEliminated ? 'line-through decoration-slate-500/50' : ''}`}>
                                {team?.name || row.teamId}
                            </span>
                        </div>
                    </td>
                    <td className="text-center font-medium text-slate-400 tabular-nums">{row.played}</td>
                    {!compact && (
                        <>
                            <td className="text-center font-normal text-slate-500 hidden sm:table-cell tabular-nums">{row.won}</td>
                            <td className="text-center font-normal text-slate-500 hidden sm:table-cell tabular-nums">{row.drawn}</td>
                            <td className="text-center font-normal text-slate-500 hidden sm:table-cell tabular-nums">{row.lost}</td>
                            <td className="text-center font-normal text-slate-500 hidden sm:table-cell tabular-nums">{row.gf}</td>
                            <td className="text-center font-normal text-slate-500 hidden sm:table-cell tabular-nums">{row.ga}</td>
                        </>
                    )}
                    <td className={`text-center font-bold tabular-nums ${row.gd > 0 ? 'text-emerald-400' : row.gd < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                        {row.gd > 0 ? `+${row.gd}` : row.gd}
                    </td>
                    <td className="text-center font-black text-white text-sm bg-white/5 tabular-nums">{row.pts}</td>
                    {predictedRankMap && (() => {
                        const predictedRank = predictedRankMap[row.teamId];
                        if (predictedRank == null) return <td className="text-center text-slate-600 text-[10px] border-l-2 border-dashed border-cyan-400/30 bg-cyan-500/5">-</td>;
                        return (
                            <td className="text-center border-l-2 border-dashed border-cyan-400/30 bg-cyan-500/5">
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-black tabular-nums bg-cyan-500/15 text-cyan-400">
                                        {predictedRank}
                                    </div>
                                </div>
                            </td>
                        );
                    })()}
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
