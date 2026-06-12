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

interface TooltipEntry { dataKey: string; value: number; stroke: string }

function TooltipContent({
  active, payload, label, nameMap,
}: {
  active?: boolean;
  payload?: unknown;
  label?: string;
  nameMap: Record<string, string>;
}) {
  if (!active) return null;
  const entries = (payload as TooltipEntry[] | undefined) ?? [];
  if (!entries.length) return null;
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs shadow-xl min-w-[140px]">
      <p className="font-bold text-slate-400 mb-1.5 truncate text-[10px]">{label}</p>
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

    const finished = matches
      .filter(m => m.homeScore !== null && m.awayScore !== null && m.date !== 'TBD')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const days = WINDOW_DAYS[period];
    const windowed = days === null
      ? finished
      : finished.filter(m => new Date(m.date).getTime() >= Date.now() - days * 86400000);

    if (windowed.length === 0) return [];

    const cum: Record<string, number> = {};
    activePlayers.forEach(p => { cum[p.email] = 0; });

    return windowed.map(m => {
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

      const pt: Record<string, string | number> = { label: `${hc}–${ac}` };
      activePlayers.forEach(p => { pt[p.email] = cum[p.email]; });
      return { ...pt };
    });
  }, [activePlayers, matches, allPredictions, teams, period]);

  const toggleRival = (email: string) => {
    setSelected(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : prev.length < 3 ? [...prev, email] : prev
    );
  };

  const tickInterval = Math.max(0, Math.floor(chartData.length / 8) - 1);

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
          {/* Current user — always included */}
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
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 48, left: 0 }}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                angle={-45}
                textAnchor="end"
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
                content={({ active, payload, label }) => (
                  <TooltipContent
                    active={active}
                    payload={payload}
                    label={label as string}
                    nameMap={nameMap}
                  />
                )}
              />
              {activePlayers.map((player, i) => (
                <Line
                  key={player.email}
                  type="monotone"
                  dataKey={player.email}
                  stroke={H2H_COLORS[i]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
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
