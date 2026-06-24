import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { MatchEvent, MatchLineup, Team, Translation } from '../types';
import { TEAMS } from '../constants';

interface PlayerModalProps {
  playerId: number;
  playerName: string;
  teamId: string;
  matchEvents: MatchEvent[];
  matchLineups: MatchLineup[];
  teams: Record<string, Team>;
  lang: Translation;
  onClose: () => void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  playerId, playerName, teamId, matchEvents, matchLineups, teams, onClose,
}) => {
  const [photoFailed, setPhotoFailed] = useState(false);

  const team = teams[teamId] || TEAMS[teamId];
  const teamColor = (team as any)?.jerseyBg ?? '#C9A84C';

  // World Cup stats computed from in-memory data
  const goals = matchEvents.filter(e =>
    e.player === playerName && e.type === 'Goal' && e.detail !== 'Own Goal'
  ).length;
  const assists = matchEvents.filter(e =>
    e.assist === playerName && e.type === 'Goal'
  ).length;
  const ownGoals = matchEvents.filter(e =>
    e.player === playerName && e.type === 'Goal' && e.detail === 'Own Goal'
  ).length;
  const yellowCards = matchEvents.filter(e =>
    e.player === playerName && e.type === 'Card' && e.detail === 'Yellow Card'
  ).length;
  const redCards = matchEvents.filter(e =>
    e.player === playerName && e.type === 'Card' &&
    (e.detail === 'Red Card' || e.detail === 'Yellow+Red Card')
  ).length;

  // Appearances: distinct matches in lineups
  const lineupRows = matchLineups.filter(l => l.playerName === playerName && l.teamId === teamId);
  const appearances = new Set(lineupRows.map(l => l.matchId)).size;

  // Position + number from most recent lineup entry
  const latestLineup = lineupRows[lineupRows.length - 1];
  const position = latestLineup?.position ?? null;
  const number   = latestLineup?.playerNumber ?? null;

  const posLabel: Record<string, string> = { G: 'GK', D: 'DEF', M: 'MID', F: 'FWD' };

  const stats = [
    { label: 'Goals',   value: goals,       icon: '⚽' },
    { label: 'Assists', value: assists,      icon: '🎯' },
    { label: 'Apps',    value: appearances,  icon: '📋' },
    { label: 'Yellow',  value: yellowCards,  icon: '🟨' },
    { label: 'Red',     value: redCards,     icon: '🟥' },
  ];
  if (ownGoals > 0) stats.splice(1, 0, { label: 'OG', value: ownGoals, icon: '😬' });

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4"
         onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
        style={{ background: '#0a1628' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Team colour tint header */}
        <div
          className="absolute inset-x-0 top-0 h-48 pointer-events-none"
          style={{ background: `linear-gradient(180deg, ${teamColor}40 0%, transparent 100%)` }}
        />
        <div
          className="absolute inset-0 rounded-2xl border pointer-events-none"
          style={{ borderColor: `${teamColor}30` }}
        />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>

        {/* Photo + identity */}
        <div className="relative flex flex-col items-center pt-8 pb-5 px-6">
          {/* Photo */}
          <div
            className="w-24 h-24 rounded-full overflow-hidden mb-4 shadow-[0_0_0_3px_rgba(255,255,255,0.12),0_8px_24px_rgba(0,0,0,0.6)]"
            style={{ background: `${teamColor}25` }}
          >
            {!photoFailed ? (
              <img
                src={`https://media.api-sports.io/football/players/${playerId}.png`}
                alt={playerName}
                className="w-full h-full object-cover"
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">
                🧑
              </div>
            )}
          </div>

          {/* Name */}
          <h2 className="text-white font-black text-xl text-center leading-tight mb-2">
            {playerName}
          </h2>

          {/* Team + badges */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {team?.flag && (
              <img src={team.flag} alt={team.name} className="w-6 h-4 object-cover rounded border border-white/20" />
            )}
            <span className="text-white/70 text-xs font-bold uppercase tracking-wide">
              {team?.name ?? teamId}
            </span>
            {position && (
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                style={{ color: teamColor, borderColor: `${teamColor}50`, background: `${teamColor}15` }}
              >
                {posLabel[position] ?? position}
              </span>
            )}
            {number != null && (
              <span className="text-[10px] font-black text-white/40">#{number}</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-white/8" />

        {/* Stats */}
        <div className="px-5 py-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3 text-center">
            World Cup 2026
          </p>
          <div className="flex justify-around gap-2">
            {stats.map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="text-lg leading-none">{s.icon}</span>
                <span className="text-white font-black text-lg leading-none tabular-nums">
                  {s.value}
                </span>
                <span className="text-white/35 text-[9px] font-bold uppercase tracking-wide">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note if no stats yet */}
        {goals + assists + appearances + yellowCards + redCards === 0 && (
          <p className="text-white/25 text-[10px] text-center pb-4 -mt-2">
            No recorded stats yet this tournament
          </p>
        )}
      </div>
    </div>,
    document.body
  );
};
