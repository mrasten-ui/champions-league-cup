import React from 'react';
import { MatchStats, Team } from '../types';
import { resolveKitColor } from '../kitDesignations';

interface StatsPanelProps {
  stats: MatchStats | null | undefined;
  homeTeam: Team;
  awayTeam: Team;
  homeKitType?: 'home' | 'away' | 'third';
  awayKitType?: 'home' | 'away' | 'third';
  dark?: boolean;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, homeTeam, awayTeam, homeKitType = 'home', awayKitType = 'home', dark = false }) => {
  const textMuted = dark ? 'text-white/40' : 'text-slate-400';
  const textVal   = dark ? 'text-white/80' : 'text-slate-700';
  const border    = dark ? 'border-white/10' : 'border-slate-100';
  const divider   = dark ? 'bg-white/10' : 'bg-slate-100';

  if (!stats) {
    return (
      <div className={`px-3 py-4 border-t ${border} text-center`}>
        <span className={`text-[9px] ${textMuted}`}>Stats will appear once the match is underway</span>
      </div>
    );
  }

  const homePoss = stats.homePossession ?? 50;
  const awayPoss = stats.awayPossession ?? 50;
  const homeColor = (homeTeam && resolveKitColor(homeTeam.id, homeKitType)) ?? '#1e3a5f';
  const awayColor = (awayTeam && resolveKitColor(awayTeam.id, awayKitType)) ?? '#9b1c1c';

  const rows: Array<{ label: string; home: number | null | undefined; away: number | null | undefined; decimals?: number }> = [
    { label: 'xG', home: stats.homeXg, away: stats.awayXg, decimals: 2 },
    { label: 'Shots', home: stats.homeShots, away: stats.awayShots },
    { label: 'On Target', home: stats.homeShotsOnTarget, away: stats.awayShotsOnTarget },
    { label: 'Corners', home: stats.homeCorners, away: stats.awayCorners },
    { label: 'Fouls', home: stats.homeFouls, away: stats.awayFouls },
    { label: 'Yellow Cards', home: stats.homeYellow, away: stats.awayYellow },
    { label: 'Red Cards', home: stats.homeRed, away: stats.awayRed },
    { label: 'Offsides', home: stats.homeOffsides, away: stats.awayOffsides },
  ].filter(r => r.home != null || r.away != null);

  const fmt = (v: number | null | undefined, dec = 0) =>
    v == null ? '—' : dec > 0 ? v.toFixed(dec) : String(v);

  return (
    <div className={`border-t ${border}`}>
      {/* Possession bar */}
      {(stats.homePossession != null || stats.awayPossession != null) && (
        <div className="px-3 pt-2.5 pb-1">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[9px] font-black tabular-nums ${textVal}`}>{homePoss}%</span>
            <span className={`text-[8px] font-black uppercase tracking-widest ${textMuted}`}>Possession</span>
            <span className={`text-[9px] font-black tabular-nums ${textVal}`}>{awayPoss}%</span>
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden flex border ${dark ? 'border-white/20' : 'border-slate-300'}`}>
            <div className="h-full transition-all duration-500" style={{ width: `${homePoss}%`, background: homeColor }} />
            <div className={`w-px h-full shrink-0 ${dark ? 'bg-white/30' : 'bg-slate-300'}`} />
            <div className="h-full flex-1" style={{ background: awayColor }} />
          </div>
        </div>
      )}

      {/* Stat rows */}
      {rows.length > 0 && (
        <div className={`px-3 py-1.5 flex flex-col gap-0.5 ${stats.homePossession != null ? `border-t ${border} mt-1` : ''}`}>
          {rows.map(r => (
            <div key={r.label} className="flex items-center gap-1 text-[9px]">
              <span className={`w-8 text-right font-black tabular-nums ${textVal}`}>{fmt(r.home, r.decimals)}</span>
              <div className={`flex-1 h-px ${divider}`} />
              <span className={`flex-shrink-0 text-center uppercase tracking-wide ${textMuted}`} style={{ minWidth: '80px' }}>{r.label}</span>
              <div className={`flex-1 h-px ${divider}`} />
              <span className={`w-8 text-left font-black tabular-nums ${textVal}`}>{fmt(r.away, r.decimals)}</span>
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 && (
        <div className={`px-3 py-3 text-center`}>
          <span className={`text-[9px] ${textMuted}`}>No stats available yet</span>
        </div>
      )}
    </div>
  );
};
