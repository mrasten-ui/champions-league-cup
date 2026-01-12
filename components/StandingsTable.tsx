
import React from 'react';
import { GroupStanding, Team, Translation } from '../types';

interface StandingsTableProps {
  standings: GroupStanding[];
  teams: Record<string, Team>;
  lang: Translation;
  compact?: boolean;
  onTeamClick?: (teamId: string) => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings, teams, lang, compact = false, onTeamClick }) => {
  const containerClass = compact 
    ? "bg-white" 
    : "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6";

  const handleRowClick = (e: React.MouseEvent, teamId: string) => {
      e.stopPropagation();
      if (onTeamClick && !teamId.startsWith('TBD')) {
          onTeamClick(teamId);
      }
  };

  return (
    <div className={containerClass}>
      {!compact && (
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm">{lang.standings}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">{lang.teamCol}</th>
              <th className="px-2 py-3 font-medium text-center">PL</th>
              <th className="px-2 py-3 font-medium text-center">{lang.goalDiff}</th>
              <th className="px-4 py-3 font-medium text-right">{lang.points}</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, index) => {
              const team = teams[row.teamId];
              // Use localized team name if available
              const teamName = lang.teamNames[team.id] || team.name;

              const isQualified = index < 2; // Top 2 direct qualify
              const isPossible = index === 2; // 3rd place potential
              
              let rowClass = 'border-b border-slate-50 last:border-0';
              let rankColor = 'text-slate-400';
              
              if (isQualified) {
                rowClass += ' bg-green-50/40';
                rankColor = 'text-green-600';
              } else if (isPossible) {
                rowClass += ' bg-yellow-50/30';
                rankColor = 'text-yellow-600';
              }

              return (
                <tr key={row.teamId} className={rowClass}>
                  <td className={`px-4 py-3 font-medium ${rankColor}`}>
                    {index + 1}
                  </td>
                  <td 
                    onClick={(e) => handleRowClick(e, team.id)}
                    className={`px-4 py-3 font-bold text-slate-800 flex items-center gap-2 ${onTeamClick ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}`}
                  >
                    <div className="w-6 h-4 rounded-sm overflow-hidden border border-slate-200 relative shrink-0">
                        {team?.flag ? (
                             <img src={team.flag} alt="" className="w-full h-full object-cover" />
                        ) : null}
                    </div>
                    <span className={`truncate ${isQualified ? 'text-green-900' : ''}`}>{teamName}</span>
                    {isQualified && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 ml-1 shrink-0" title={lang.qualified}></span>}
                    {isPossible && <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 ml-1 shrink-0"></span>}
                  </td>
                  <td className="px-2 py-3 text-center text-slate-600">{row.played}</td>
                  <td className="px-2 py-3 text-center text-slate-600">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                  <td className="px-4 py-3 text-right font-black text-slate-900">{row.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
