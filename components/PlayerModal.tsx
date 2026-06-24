import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Star } from 'lucide-react';
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
  if (r >= 8)  return '#16a34a';
  if (r >= 7)  return '#65a30d';
  if (r >= 6)  return '#ca8a04';
  if (r >= 5)  return '#ea580c';
  return '#dc2626';
}

function ratingBg(r: number): string {
  if (r >= 8)  return 'bg-green-50 border-green-100';
  if (r >= 7)  return 'bg-lime-50 border-lime-100';
  if (r >= 6)  return 'bg-yellow-50 border-yellow-100';
  if (r >= 5)  return 'bg-orange-50 border-orange-100';
  return 'bg-red-50 border-red-100';
}

function ratingBar(r: number): string {
  if (r >= 8)  return 'bg-green-500';
  if (r >= 7)  return 'bg-lime-500';
  if (r >= 6)  return 'bg-yellow-400';
  if (r >= 5)  return 'bg-orange-500';
  return 'bg-red-500';
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  playerId, playerName, teamId,
  matchEvents, matchLineups, playerMatchStats,
  teams, onClose,
}) => {
  const [photoFailed, setPhotoFailed] = useState(false);

  const team = teams[teamId] || TEAMS[teamId];

  // ── Per-match stats from DB ──────────────────────────────────────────────────
  const dbStats = playerMatchStats;
  const ratedMatches = dbStats.filter(s => s.rating != null && s.rating > 0);
  const avgRating = ratedMatches.length
    ? ratedMatches.reduce((sum, s) => sum + (s.rating ?? 0), 0) / ratedMatches.length
    : null;

  const totalGoals     = dbStats.reduce((n, s) => n + (s.goals   ?? 0), 0);
  const totalAssists   = dbStats.reduce((n, s) => n + (s.assists ?? 0), 0);
  const totalYellow    = dbStats.reduce((n, s) => n + (s.yellowCards ?? 0), 0);
  const totalRed       = dbStats.reduce((n, s) => n + (s.redCards    ?? 0), 0);
  const totalShots     = dbStats.reduce((n, s) => n + (s.shotsTotal ?? 0), 0);
  const totalShotsOn   = dbStats.reduce((n, s) => n + (s.shotsOn    ?? 0), 0);
  const totalPasses    = dbStats.reduce((n, s) => n + (s.passesTotal ?? 0), 0);
  const totalKeyPasses = dbStats.reduce((n, s) => n + (s.passesKey  ?? 0), 0);
  const totalTackles   = dbStats.reduce((n, s) => n + (s.tackles    ?? 0), 0);
  const appearances    = dbStats.length;

  // Fallback from in-memory events when DB hasn't synced yet
  const fbGoals     = dbStats.length ? totalGoals   : matchEvents.filter(e => e.player === playerName && e.type === 'Goal' && e.detail !== 'Own Goal').length;
  const fbAssists   = dbStats.length ? totalAssists : matchEvents.filter(e => e.assist === playerName && e.type === 'Goal').length;
  const fbOwnGoals  =                                matchEvents.filter(e => e.player === playerName && e.type === 'Goal' && e.detail === 'Own Goal').length;
  const fbYellow    = dbStats.length ? totalYellow  : matchEvents.filter(e => e.player === playerName && e.type === 'Card' && e.detail === 'Yellow Card').length;
  const fbRed       = dbStats.length ? totalRed     : matchEvents.filter(e => e.player === playerName && e.type === 'Card' && (e.detail === 'Red Card' || e.detail === 'Yellow+Red Card')).length;
  const fbApps      = dbStats.length ? appearances  : new Set(matchLineups.filter(l => l.playerName === playerName && l.teamId === teamId).map(l => l.matchId)).size;

  // Position + number from most recent lineup entry
  const lineupRows   = matchLineups.filter(l => l.playerName === playerName && l.teamId === teamId);
  const latestLineup = lineupRows[lineupRows.length - 1];
  const position     = latestLineup?.position ?? null;
  const number       = latestLineup?.playerNumber ?? null;
  const posLabel: Record<string, string> = { G: 'GK', D: 'DEF', M: 'MID', F: 'FWD' };

  const hasDbStats = dbStats.length > 0;

  const keyStats = [
    { label: 'Goals',   value: fbGoals,   icon: '⚽' },
    { label: 'Assists', value: fbAssists, icon: '🎯' },
    { label: 'Apps',    value: fbApps,    icon: '📋' },
    { label: 'Yellow',  value: fbYellow,  icon: '🟨' },
    { label: 'Red',     value: fbRed,     icon: '🟥' },
    ...(fbOwnGoals > 0 ? [{ label: 'OG', value: fbOwnGoals, icon: '😬' }] : []),
  ];

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />

      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* ── HEADER (navy, matches TeamDetailsModal) ── */}
        <div className="relative h-32 bg-[#0f2545] shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-5" />

          {/* Photo — tilted card at bottom-left like team flag */}
          <div className="absolute -bottom-8 left-6 w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 z-10">
            {!photoFailed ? (
              <img
                src={`https://media.api-sports.io/football/players/${playerId}.png`}
                alt={playerName}
                className="w-full h-full object-cover"
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl bg-slate-100">🧑</div>
            )}
          </div>

          {/* Avg rating badge — top right */}
          {avgRating != null && (
            <div className="absolute top-4 right-4 flex flex-col items-end gap-0.5">
              <span className="text-white/50 text-[9px] font-black uppercase tracking-widest">Rating</span>
              <div className="text-3xl font-black italic tracking-tighter drop-shadow-md"
                   style={{ color: ratingColor(avgRating) === '#16a34a' ? '#4ade80' : ratingColor(avgRating) === '#65a30d' ? '#a3e635' : ratingColor(avgRating) === '#ca8a04' ? '#fbbf24' : ratingColor(avgRating) === '#ea580c' ? '#fb923c' : '#f87171' }}>
                {avgRating.toFixed(1)}
              </div>
            </div>
          )}

          {/* Close */}
          <button onClick={onClose} className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors backdrop-blur-sm">
            <X size={20} />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto pt-10 px-6 pb-6 bg-slate-50">

          {/* Name + badges */}
          <div className="mb-5">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">{playerName}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {team?.flag && (
                <img src={team.flag} alt={team.name} className="w-6 h-4 object-cover rounded border border-slate-200" />
              )}
              <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm">
                {team?.name ?? teamId}
              </span>
              {position && (
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-blue-200">
                  {posLabel[position] ?? position}
                </span>
              )}
              {number != null && (
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black border border-slate-200">
                  #{number}
                </span>
              )}
            </div>
          </div>

          {/* ── Rating card (if we have one) ── */}
          {avgRating != null && (
            <div className={`bg-white rounded-xl p-4 shadow-sm border mb-5 flex items-center gap-4 relative overflow-hidden ${ratingBg(avgRating)}`}>
              <div className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-full blur-2xl"
                   style={{ background: ratingColor(avgRating) }} />
              <div className="p-3 rounded-full shrink-0 relative z-10"
                   style={{ background: ratingColor(avgRating) + '20' }}>
                <Star size={24} fill={ratingColor(avgRating)} style={{ color: ratingColor(avgRating) }} />
              </div>
              <div className="relative z-10 flex-1 min-w-0">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Avg Rating · World Cup 2026</div>
                <div className="text-3xl font-black leading-none tabular-nums" style={{ color: ratingColor(avgRating) }}>
                  {avgRating.toFixed(1)}
                  <span className="text-sm font-bold text-slate-400 ml-1.5">/10</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{ratedMatches.length} match{ratedMatches.length !== 1 ? 'es' : ''} rated</div>
              </div>
            </div>
          )}

          {/* ── Per-match rating bars ── */}
          {ratedMatches.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-5">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Match Ratings</h4>
              <div className="flex flex-col gap-2">
                {dbStats.map((s, i) => {
                  const r = s.rating;
                  const hasRating = r != null && r > 0;
                  const pct = hasRating ? Math.min(100, ((r! - 4) / 6) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 w-5 text-right tabular-nums shrink-0">{i + 1}</span>
                      <div className="flex-1 h-3 rounded-full overflow-hidden bg-slate-100">
                        {hasRating && (
                          <div className={`h-full rounded-full ${ratingBar(r!)}`} style={{ width: `${pct}%` }} />
                        )}
                      </div>
                      <span className="text-[11px] font-black w-8 text-right tabular-nums shrink-0"
                            style={{ color: hasRating ? ratingColor(r!) : '#94a3b8' }}>
                        {hasRating ? r!.toFixed(1) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Key stats row ── */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">World Cup 2026</h4>
            <div className="flex justify-around gap-1">
              {keyStats.map(s => (
                <div key={s.label} className="flex flex-col items-center gap-1">
                  <span className="text-xl leading-none">{s.icon}</span>
                  <span className="text-slate-900 font-black text-lg leading-none tabular-nums">{s.value}</span>
                  <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wide">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Detailed stats (shots / passes / tackles) ── */}
          {hasDbStats && (totalShots > 0 || totalPasses > 0 || totalTackles > 0) && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {([
                totalShots > 0   && { label: 'Shots',   value: `${totalShotsOn} / ${totalShots}`, sub: 'on target / total' },
                totalPasses > 0  && { label: 'Passes',  value: totalPasses.toString(),             sub: `${totalKeyPasses} key pass${totalKeyPasses !== 1 ? 'es' : ''}` },
                totalTackles > 0 && { label: 'Tackles', value: totalTackles.toString(),            sub: '' },
              ] as any[]).filter(Boolean).map((row: any, i: number, arr: any[]) => (
                <div key={row.label}
                     className={`flex justify-between items-center px-4 py-3 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''} ${i % 2 === 0 ? 'bg-slate-50/50' : ''}`}>
                  <div>
                    <span className="text-slate-700 text-sm font-bold">{row.label}</span>
                    {row.sub && <span className="text-slate-400 text-[10px] ml-2">{row.sub}</span>}
                  </div>
                  <span className="text-slate-900 font-black text-sm tabular-nums">{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {!hasDbStats && fbGoals + fbAssists + fbApps + fbYellow + fbRed === 0 && (
            <p className="text-slate-400 text-xs text-center mt-2">No recorded stats yet this tournament</p>
          )}
        </div>

        {/* ── FOOTER BUTTON ── */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
