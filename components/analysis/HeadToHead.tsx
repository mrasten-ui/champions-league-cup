import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';
import { calculatePoints } from '../../services/engine';
import { AvatarDisplay } from '../AvatarDisplay';
import { UserProfile, Match, Prediction, Team } from '../../types';

const H2H_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#a855f7'];

type TimeWindow = '3D' | '7D' | '14D' | 'ALL';
const WINDOWS: TimeWindow[] = ['3D', '7D', '14D', 'ALL'];
const WINDOW_DAYS: Record<TimeWindow, number | null> = {
  '3D': 3, '7D': 7, '14D': 14, 'ALL': null,
};

export interface HeadToHeadProps {
  currentUser: UserProfile;
  rivals: UserProfile[];
  matches: Match[];
  allPredictions: Prediction[];
  teams: Record<string, Team>;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// SVG avatar dot shown at the last data point of each line
function AvatarDot({ cx, cy, player, color }: {
  cx?: number; cy?: number; player: UserProfile; color: string;
}) {
  if (cx == null || cy == null) return null;
  const av = player.avatar ?? '';
  const isUrl = av.startsWith('http') || av.startsWith('/') || av.startsWith('data:') || av.includes('supabase');

  if (isUrl) {
    const r = 12;
    const clipId = `h2h-clip-${player.email.replace(/[^a-zA-Z0-9]/g, '')}`;
    return (
      <g>
        <defs>
          <clipPath id={clipId}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>
        <circle cx={cx} cy={cy} r={r + 2.5} fill={color} />
        <image href={av} x={cx - r} y={cy - r} width={r * 2} height={r * 2} clipPath={`url(#${clipId})`} />
      </g>
    );
  }

  if (av) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={14} fill="white" stroke={color} strokeWidth={2.5} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={15} style={{ pointerEvents: 'none' }}>
          {av}
        </text>
      </g>
    );
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill={color} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="white" fontWeight="bold" style={{ pointerEvents: 'none' }}>
        {(player.name ?? '?')[0].toUpperCase()}
      </text>
    </g>
  );
}

interface TipEntry { dataKey: string; value: number; stroke: string; payload: Record<string, string | number> }

function TooltipContent({ active, payload, nameMap }: {
  active?: boolean;
  payload?: unknown;
  nameMap: Record<string, string>;
}) {
  if (!active) return null;
  const entries = (payload as TipEntry[] | undefined) ?? [];
  if (!entries.length) return null;
  const pt = entries[0].payload;
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs shadow-xl min-w-[140px]">
      <p className="font-bold text-slate-300 text-[10px] mb-0.5">{pt.date as string}</p>
      {(pt.match as string) && (
        <p className="text-slate-500 text-[9px] mb-1.5">{pt.match as string}</p>
      )}
      {sorted.map(entry => (
        <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.stroke }} />
          <span className="text-slate-300 truncate flex-1">{nameMap[entry.dataKey] ?? entry.dataKey}</span>
          <span className="font-black text-white ml-1">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export const HeadToHead: React.FC<HeadToHeadProps> = ({
  currentUser, rivals, matches, allPredictions, teams,
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [period, setPeriod] = useState<TimeWindow>('ALL');

  const activePlayers = useMemo<UserProfile[]>(() => {
    const rivalObjs = selected
      .map(e => rivals.find(r => r.email === e))
      .filter((r): r is UserProfile => !!r);
    return [currentUser, ...rivalObjs];
  }, [currentUser, rivals, selected]);

  const nameMap = useMemo(() => {
    const m: Record<string, string> = {};
    activePlayers.forEach(p => { m[p.email] = p.name || p.email; });
    return m;
  }, [activePlayers]);

  const chartData = useMemo(() => {
    const predIdx = new Map<string, Prediction>();
    allPredictions.forEach(p => predIdx.set(`${p.userId}:${p.matchId}`, p));

    // Only matches with confirmed scores
    const finished = matches
      .filter(m => m.homeScore !== null && m.awayScore !== null && m.date !== 'TBD')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const days = WINDOW_DAYS[period];
    const windowed = days === null
      ? finished
      : finished.filter(m => new Date(m.date).getTime() >= Date.now() - days * 86400000);

    if (windowed.length === 0) return [];

    // Baseline point: all players start at 0
    const startPt: Record<string, string | number> = { date: 'Start', match: '' };
    activePlayers.forEach(p => { startPt[p.email] = 0; });

    // Running cumulative per player — mutated in place inside map, each spread captures a snapshot
    const cum: Record<string, number> = {};
    activePlayers.forEach(p => { cum[p.email] = 0; });

    const matchPts = windowed.map(m => {
      const ht = teams[m.homeTeamId];
      const at = teams[m.awayTeamId];
      const hc = ht?.code ?? ht?.name.slice(0, 3).toUpperCase() ?? '?';
      const ac = at?.code ?? at?.name.slice(0, 3).toUpperCase() ?? '?';

      activePlayers.forEach(p => {
        const pred = predIdx.get(`${p.email}:${m.id}`);
        if (pred) {
          cum[p.email] += calculatePoints(
            pred.home, pred.away,
            m.homeScore!, m.awayScore!,
            p.hasTakenSecondChance,
            m.round,
          );
        }
      });

      const pt: Record<string, string | number> = {
        date: fmtDate(m.date),
        match: `${hc}–${ac}`,
      };
      activePlayers.forEach(p => { pt[p.email] = cum[p.email]; });
      return { ...pt }; // spread captures cumulative values at this point in time
    });

    return [{ ...startPt }, ...matchPts];
  }, [activePlayers, matches, allPredictions, teams, period]);

  const toggleRival = (email: string) => {
    setSelected(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : prev.length < 3 ? [...prev, email] : prev
    );
  };

  const lastIdx = chartData.length - 1;
  const tickInterval = chartData.length <= 9 ? 0 : Math.floor((chartData.length - 1) / 8);

  // Spread tied avatars horizontally so they don't stack on top of each other
  const avatarOffsetsX = useMemo(() => {
    const offsets: Record<string, number> = {};
    const last = chartData[chartData.length - 1] as Record<string, string | number> | undefined;
    if (!last) return offsets;

    const byScore = new Map<number, string[]>();
    activePlayers.forEach(p => {
      const score = (last[p.email] as number) ?? 0;
      const group = byScore.get(score) ?? [];
      group.push(p.email);
      byScore.set(score, group);
    });

    const SPACING = 28;
    byScore.forEach(group => {
      group.forEach((email, idx) => {
        offsets[email] = group.length > 1
          ? (idx - (group.length - 1) / 2) * SPACING
          : 0;
      });
    });
    return offsets;
  }, [chartData, activePlayers]);

  // Custom two-line X-axis tick: date on top, match code below
  const renderMatchTick = (tickProps: any) => {
    const { x, y, index } = tickProps;
    const point = chartData[index] as Record<string, string | number> | undefined;
    if (!point) return <g key={`tick-${index}`} />;
    const date = point.date as string;
    const match = (point.match as string) || '';
    return (
      <g key={`tick-${index}`} transform={`translate(${x},${y + 4})`}>
        <text transform="rotate(-40)" textAnchor="end" fontSize={9} fill="#64748b" dominantBaseline="auto">
          {date}
        </text>
        {match && (
          <text transform="rotate(-40)" y={13} textAnchor="end" fontSize={8} fill="#94a3b8" dominantBaseline="auto">
            {match}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="p-4 space-y-4 border-t border-slate-100 bg-white">

      {/* Time filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Period</span>
        {WINDOWS.map(w => (
          <button
            key={w}
            onClick={() => setPeriod(w)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors
              ${period === w
                ? 'bg-[#0f2545] text-white'
                : 'border border-slate-200 text-slate-500 hover:border-slate-400'}`}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Player selector */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
          Rivals — pick up to 3
        </p>
        <div className="flex flex-wrap gap-3 items-start">
          {/* Current user — always included, not deselectable */}
          <div className="flex flex-col items-center gap-1">
            <div className="rounded-full" style={{ boxShadow: `0 0 0 3px ${H2H_COLORS[0]}` }}>
              <AvatarDisplay avatar={currentUser.avatar} size="sm" />
            </div>
            <span className="text-[9px] font-bold text-blue-600 max-w-[52px] truncate text-center">You</span>
          </div>

          {rivals.map(rival => {
            const rivalIdx = selected.indexOf(rival.email);
            const isSelected = rivalIdx !== -1;
            const color = isSelected ? H2H_COLORS[rivalIdx + 1] : undefined;
            const canSelect = !isSelected && selected.length < 3;

            return (
              <button
                key={rival.email}
                onClick={() => toggleRival(rival.email)}
                disabled={!isSelected && !canSelect}
                className={`flex flex-col items-center gap-1 transition-opacity ${!isSelected && !canSelect ? 'opacity-30' : ''}`}
              >
                <div
                  className="rounded-full"
                  style={isSelected ? { boxShadow: `0 0 0 3px ${color}` } : undefined}
                >
                  <AvatarDisplay avatar={rival.avatar} size="sm" />
                </div>
                <span className="text-[9px] font-bold text-slate-600 max-w-[52px] truncate text-center">
                  {rival.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="h-[160px] flex items-center justify-center text-xs text-slate-400 font-bold">
          No finished matches in this period yet
        </div>
      ) : (
        <div className="h-[210px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 72, bottom: 60, left: 0 }}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={renderMatchTick}
                interval={tickInterval}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                content={({ active, payload }) => (
                  <TooltipContent active={active} payload={payload} nameMap={nameMap} />
                )}
              />
              {activePlayers.map((player, i) => (
                <Line
                  key={player.email}
                  type="monotone"
                  dataKey={player.email}
                  stroke={H2H_COLORS[i]}
                  strokeWidth={2}
                  dot={(dotProps: any) => {
                    if (dotProps.index !== lastIdx) return <g key={dotProps.key} />;
                    return (
                      <AvatarDot
                        key={dotProps.key}
                        cx={(dotProps.cx ?? 0) + (avatarOffsetsX[player.email] ?? 0)}
                        cy={dotProps.cy}
                        player={player}
                        color={H2H_COLORS[i]}
                      />
                    );
                  }}
                  activeDot={{ r: 3, strokeWidth: 0, fill: H2H_COLORS[i] }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
