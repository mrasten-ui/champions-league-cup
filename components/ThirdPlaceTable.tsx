import React from 'react';
import { GroupStanding, Team, Translation } from '../types';
import { Info, AlertCircle } from 'lucide-react';

interface ThirdPlaceTableProps {
  standings: (GroupStanding & { groupId: string })[];
  teams: Record<string, Team>;
  lang: Translation;
}

export const ThirdPlaceTable: React.FC<ThirdPlaceTableProps> = ({ standings, teams, lang }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-6 relative">
      <div className="bg-[#0f2545] p-4 text-white">
        <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
            {lang.bestThirdPlace}
            <Info size={14} className="text-blue-300" />
        </h3>
        <p className="text-[10px] text-blue-200 mt-1">{lang.top8Advance}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-3 py-3 font-black text-center">#</th>
              <th className="px-3 py-3 font-bold">{lang.teamCol}</th>
              <th className="px-2 py-3 font-bold text-center">{lang.grpCol}</th>
              <th className="px-2 py-3 font-bold text-center">{lang.goalDiff}</th>
              <th className="px-2 py-3 font-bold text-right">{lang.points}</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, index) => {
              const team = teams[row.teamId];
              const teamName = lang.teamNames[row.teamId] || team.name;
              const isQualified = index < 8; // Top 8 qualify
              const rank = index + 1;

              return (
                <React.Fragment key={row.teamId}>
                    {/* CUT LINE INDICATOR */}
                    {index === 8 && (
                        <tr>
                            <td colSpan={5} className="bg-slate-100 p-2 text-center relative border-y border-slate-200 border-dashed">
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                    <div className="w-full border-t-2 border-red-500 border-dashed"></div>
                                </div>
                                <span className="relative z-10 bg-slate-100 px-3 text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-1">
                                    <AlertCircle size={10} /> {lang.eliminationLine}
                                </span>
                            </td>
                        </tr>
                    )}
                    
                    <tr className={`border-b border-slate-50 last:border-0 transition-colors duration-500 ${isQualified ? 'bg-green-50/20' : 'bg-slate-100/50 grayscale opacity-60'}`}>
                        <td className={`px-3 py-3 text-center font-bold ${isQualified ? 'text-green-600' : 'text-slate-400'}`}>
                            {rank}
                        </td>
                        <td className="px-3 py-3 font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-5 h-3.5 rounded-sm overflow-hidden border border-slate-200 relative shrink-0 shadow-sm">
                                {team?.flag ? (
                                    <img src={team.flag} alt={teamName} className="w-full h-full object-cover" />
                                ) : null}
                            </div>
                            <span className={`truncate ${isQualified ? 'text-green-900' : 'text-slate-500 line-through decoration-slate-400/50'}`}>{teamName}</span>
                            {isQualified && <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-auto shrink-0 animate-pulse"></div>}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-500 font-mono text-xs">{row.groupId}</td>
                        <td className="px-2 py-3 text-center text-slate-600 text-xs font-medium">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                        <td className={`px-2 py-3 text-right font-black ${isQualified ? 'text-slate-900' : 'text-slate-400'}`}>{row.pts}</td>
                    </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};