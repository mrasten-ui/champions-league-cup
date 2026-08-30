import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Team, Translation, LeagueStanding } from '../types';
import { StandingsTable } from './StandingsTable';

interface StandingsStripProps {
  standings: LeagueStanding[];
  teams: Record<string, Team>;
  lang: Translation;
  onTeamClick?: (teamId: string) => void;
  highlightedTeamId?: string | null;
}

/**
 * Collapsed "top of table" glance — a handful of rows plus a toggle that
 * expands into the full 36-team StandingsTable in place. Keeps the round-
 * centric home focused on "predict this round" while standings stay one tap
 * away rather than a separate destination.
 */
export const StandingsStrip: React.FC<StandingsStripProps> = ({ standings, teams, lang, onTeamClick, highlightedTeamId }) => {
  const [expanded, setExpanded] = useState(false);
  const preview = standings.slice(0, 4);

  if (expanded) {
    return (
      <div className="mb-6">
        <StandingsTable standings={standings} teams={teams} lang={lang} onTeamClick={onTeamClick} highlightedTeamId={highlightedTeamId} />
        <button
          onClick={() => setExpanded(false)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/15 transition-colors"
        >
          <ChevronUp size={14} /> {lang.collapseTable || 'Collapse Table'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setExpanded(true)}
      className="mb-6 w-full text-left rounded-xl border border-white/20 bg-blue-900/50 backdrop-blur-md overflow-hidden hover:border-white/30 transition-colors shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
    >
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{lang.leaguePhaseTable || 'League Phase'}</span>
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-cyan-400">
          {lang.viewFullTable || 'Full Table'} <ChevronDown size={12} />
        </span>
      </div>
      <div className="divide-y divide-white/5">
        {preview.map((row, index) => {
          const team = teams[row.teamId];
          return (
            <div key={row.teamId} className="flex items-center gap-3 px-4 py-2 border-l-2 border-cyan-400">
              <span className="w-4 text-[10px] font-bold text-slate-400 tabular-nums">{index + 1}</span>
              {team?.flag && <img src={team.flag} alt={team.name} className="w-5 h-3.5 object-cover rounded-sm border border-white/10" />}
              <span className="flex-1 min-w-0 truncate font-bold text-sm text-slate-300">{team?.name || row.teamId}</span>
              <span className="text-sm font-black text-white tabular-nums">{row.pts}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest w-6 text-right">{lang.pts || 'PTS'}</span>
            </div>
          );
        })}
      </div>
    </button>
  );
};
