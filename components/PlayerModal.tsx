import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { MatchEvent, MatchLineup, PlayerMatchStat, Team, Translation } from '../types';
import { TEAMS } from '../constants';

interface PlayerModalProps {
  playerId: number;
  playerName: string;
  teamId: string;
  matchEvents: MatchEvent[];
  matchLineups: MatchLineup[];
  playerMatchStats: PlayerMatchStat[];
  teams: Record<string, Team>;
  lang: Translation;
  onClose: () => void;
}

function ratingColor(r: number): string {
  if (r >= 8)   return '#22c55e'; // green
  if (r >= 7)   return '#84cc16'; // lime
  if (r >= 6)   return '#eab308'; // amber
  if (r >= 5)   return '#f97316'; // orange
  return '#ef4444';               // red
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  playerId, playerName, teamId,
  matchEvents, matchLineups, playerMatchStats,
  teams, onClose,
}) => {
  const [photoFailed, setPhotoFailed] = useState(false);

  const team = teams[teamId] || TEAMS[teamId];
  const teamColor = (team as any)?.jerseyBg ?? '#C9A84C';

  // ── Per-match stats from DB ──────────────────────────────────────────────────
  const dbStats = playerMatchStats; // already filtered to this playerId in App.tsx

  const ratedMatches = dbStats.filter(s => s.rating != null && s.rating > 0);
  const avgRating = ratedMatches.length
    ? ratedMatches.reduce((sum, s) => sum + (s.rating ?? 0), 0) / ratedMatches.length
    : null;

  const totalGoals    = dbStats.reduce((n, s) => n + (s.goals   ?? 0), 0);
  const totalAssists  = dbStats.reduce((n, s) => n + (s.assists ?? 0), 0);
  const totalYellow   = dbStats.reduce((n, s) => n + (s.yellowCards ?? 0), 0);
  const totalRed      = dbStats.reduce((n, s) => n + (s.redCards    ?? 0), 0);
  const totalShots    = dbStats.reduce((n, s) => n + (s.shotsTotal ?? 0), 0);
  const totalShotsOn  = dbStats.reduce((n, s) => n + (s.shotsOn    ?? 0), 0);
  const totalPasses   = dbStats.reduce((n, s) => n + (s.passesTotal ?? 0), 0);
  const totalKeyPasses= dbStats.reduce((n, s) => n + (s.passesKey  ?? 0), 0);
  const totalTackles  = dbStats.reduce((n, s) => n + (s.tackles    ?? 0), 0);
  const appearances   = dbStats.length;

  // ── Fallback from in-memory events if no DB stats yet ────────────────────────
  const fbGoals       = dbStats.length ? totalGoals   : matchEvents.filter(e => e.player === playerName && e.type === 'Goal' && e.detail !== 'Own Goal').length;
  const fbAssists     = dbStats.length ? totalAssists : matchEvents.filter(e => e.assist === playerName && e.type === 'Goal').length;
  const fbOwnGoals    =                                 matchEvents.filter(e => e.player === playerName && e.type === 'Goal' && e.detail === 'Own Goal').length;
  const fbYellow      = dbStats.length ? totalYellow  : matchEvents.filter(e => e.player === playerName && e.type === 'Card' && e.detail === 'Yellow Card').length;
  const fbRed         = dbStats.length ? totalRed     : matchEvents.filter(e => e.player === playerName && e.type === 'Card' && (e.detail === 'Red Card' || e.detail === 'Yellow+Red Card')).length;
  const fbApps        = dbStats.length ? appearances  : new Set(matchLineups.filter(l => l.playerName === playerName && l.teamId === teamId).map(l => l.matchId)).size;

  // Position + number from most recent lineup entry
  const lineupRows  = matchLineups.filter(l => l.playerName === playerName && l.teamId === teamId);
  const latestLineup = lineupRows[lineupRows.length - 1];
  const position    = latestLineup?.position ?? null;
  const number      = latestLineup?.playerNumber ?? null;
  const posLabel: Record<string, string> = { G: 'GK', D: 'DEF', M: 'MID', F: 'FWD' };

  const hasDbStats = dbStats.length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4"
         onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto"
        style={{ background: '#0a1628' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Team colour tint */}
        <div className="absolute inset-x-0 top-0 h-48 pointer-events-none"
             style={{ background: `linear-gradient(180deg, ${teamColor}40 0%, transparent 100%)` }} />
        <div className="absolute inset-0 rounded-2xl border pointer-events-none"
             style={{ borderColor: `${teamColor}30` }} />

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors">
          <X size={14} />
        </button>

        {/* Photo + identity */}
        <div className="relative flex flex-col items-center pt-8 pb-4 px-6">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3 shadow-[0_0_0_3px_rgba(255,255,255,0.12),0_8px_24px_rgba(0,0,0,0.6)]"
               style={{ background: `${teamColor}25` }}>
            {!photoFailed ? (
              <img
                src={`https://media.api-sports.io/football/players/${playerId}.png`}
                alt={playerName}
                className="w-full h-full object-cover"
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">🧑</div>
            )}
          </div>

          <h2 className="text-white font-black text-xl text-center leading-tight mb-2">{playerName}</h2>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            {team?.flag && (
              <img src={team.flag} alt={team.name} className="w-6 h-4 object-cover rounded border border-white/20" />
            )}
            <span className="text-white/70 text-xs font-bold uppercase tracking-wide">{team?.name ?? teamId}</span>
            {position && (
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                    style={{ color: teamColor, borderColor: `${teamColor}50`, background: `${teamColor}15` }}>
                {posLabel[position] ?? position}
              </span>
            )}
            {number != null && (
              <span className="text-[10px] font-black text-white/40">#{number}</span>
            )}
          </div>
        </div>

        {/* ── Average Rating hero ─────────────────────────────────────────── */}
        {avgRating != null && (
          <div className="mx-5 mb-4 rounded-xl py-4 flex flex-col items-center"
               style={{ background: `${ratingColor(avgRating)}12`, border: `1px solid ${ratingColor(avgRating)}30` }}>
            <span className="text-[10px] font-black uppercase tracking-widest mb-1"
                  style={{ color: ratingColor(avgRating) + 'aa' }}>
              Avg Rating
            </span>
            <span className="font-black text-5xl tabular-nums leading-none"
                  style={{ color: ratingColor(avgRating) }}>
              {avgRating.toFixed(1)}
            </span>
            <span className="text-white/30 text-[10px] mt-1">{ratedMatches.length} match{ratedMatches.length !== 1 ? 'es' : ''}</span>
          </div>
        )}

        {/* ── Per-match rating bars ────────────────────────────────────────── */}
        {ratedMatches.length > 0 && (
          <div className="mx-5 mb-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Match Ratings</p>
            <div className="flex flex-col gap-1.5">
              {dbStats.map((s, i) => {
                const r = s.rating;
                const color = r != null && r > 0 ? ratingColor(r) : '#ffffff20';
                const pct = r != null && r > 0 ? Math.min(100, ((r - 4) / 6) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[9px] text-white/30 w-4 text-right tabular-nums">{i + 1}</span>
                    <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all"
                           style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-[11px] font-black w-8 text-right tabular-nums"
                          style={{ color: r != null && r > 0 ? color : '#ffffff30' }}>
                      {r != null && r > 0 ? r.toFixed(1) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mx-5 border-t border-white/8 mb-4" />

        {/* ── Key stats row ────────────────────────────────────────────────── */}
        <div className="px-5 pb-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3 text-center">World Cup 2026</p>
          <div className="flex justify-around gap-2 mb-4">
            {[
              { label: 'Goals',   value: fbGoals,   icon: '⚽' },
              { label: 'Assists', value: fbAssists, icon: '🎯' },
              { label: 'Apps',    value: fbApps,    icon: '📋' },
              { label: 'Yellow',  value: fbYellow,  icon: '🟨' },
              { label: 'Red',     value: fbRed,     icon: '🟥' },
              ...(fbOwnGoals > 0 ? [{ label: 'OG', value: fbOwnGoals, icon: '😬' }] : []),
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="text-lg leading-none">{s.icon}</span>
                <span className="text-white font-black text-lg leading-none tabular-nums">{s.value}</span>
                <span className="text-white/35 text-[9px] font-bold uppercase tracking-wide">{s.label}</span>
              </div>
            ))}
          </div>

          {/* ── Detailed stats grid (only when DB data present) ─────────────── */}
          {hasDbStats && (totalShots > 0 || totalPasses > 0 || totalTackles > 0) && (
            <div className="rounded-xl overflow-hidden border border-white/8">
              {[
                totalShots > 0    && { label: 'Shots',      value: `${totalShotsOn} / ${totalShots}`, sub: 'on target / total' },
                totalPasses > 0   && { label: 'Passes',     value: totalPasses.toString(), sub: `${totalKeyPasses} key` },
                totalTackles > 0  && { label: 'Tackles',    value: totalTackles.toString(), sub: '' },
              ].filter(Boolean).map((row: any, i, arr) => (
                <div key={row.label}
                     className={`flex justify-between items-center px-3 py-2 ${i < arr.length - 1 ? 'border-b border-white/6' : ''}`}
                     style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                  <div>
                    <span className="text-white/60 text-[11px] font-bold">{row.label}</span>
                    {row.sub && <span className="text-white/25 text-[9px] ml-1.5">{row.sub}</span>}
                  </div>
                  <span className="text-white font-black text-sm tabular-nums">{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {!hasDbStats && fbGoals + fbAssists + fbApps + fbYellow + fbRed === 0 && (
            <p className="text-white/25 text-[10px] text-center mt-2">No recorded stats yet this tournament</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
