import React, { useState, useEffect, useMemo } from 'react';
import { Lock } from 'lucide-react';
import { Match, Translation } from '../types';

interface CountdownRibbonProps {
  matches: Match[];
  lang: Translation;
}

const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

export const CountdownRibbon: React.FC<CountdownRibbonProps> = ({ matches, lang }) => {
  const deadline = useMemo(() => {
    const valid = matches.filter(m => m.date && m.date !== 'TBD');
    if (!valid.length) return null;
    const earliest = valid.reduce((a, b) => new Date(a.date) < new Date(b.date) ? a : b);
    return new Date(earliest.date).getTime();
  }, [matches]);

  const [remaining, setRemaining] = useState(() => deadline ? deadline - Date.now() : 0);

  useEffect(() => {
    if (!deadline) return;
    setRemaining(deadline - Date.now());
    const id = setInterval(() => setRemaining(deadline - Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!deadline || remaining <= 0) return null;

  const total = Math.floor(remaining / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const isCritical = remaining < 3600 * 1000;       // < 1 hour
  const isUrgent   = remaining < 24 * 3600 * 1000;  // < 24 hours

  const numColor = isCritical
    ? 'text-red-400 animate-pulse'
    : isUrgent
    ? 'text-red-400'
    : 'text-red-400/80';

  const units = [
    { value: d, label: lang.days    || 'Days' },
    { value: h, label: lang.hours   || 'Hrs'  },
    { value: m, label: lang.minutes || 'Min'  },
    { value: s, label: lang.seconds || 'Sec'  },
  ];

  return (
    <div className="w-full bg-slate-900/40 backdrop-blur-md border-b border-white/5 border-t-2 border-t-red-500 shadow-[0_2px_12px_rgba(239,68,68,0.08)] py-3 px-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl">

      {/* LEFT: Label */}
      <div className="flex items-center gap-2">
        <Lock size={13} className="text-red-400 shrink-0" />
        <span className="text-[11px] font-black text-white/80 uppercase tracking-widest">
          {lang.deadlineLabel || 'Predictions Lock In'}
        </span>
      </div>

      {/* RIGHT: LED timer blocks */}
      <div className="flex items-end gap-1.5">
        {units.map(({ value, label }, i) => (
          <React.Fragment key={label}>
            {/* Block */}
            <div className="flex flex-col items-center">
              <div className={`bg-black/60 rounded px-2.5 py-1 font-mono font-black text-lg leading-none border border-white/5 min-w-[2.4rem] text-center ${numColor}`}>
                {pad(value)}
              </div>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">{label}</span>
            </div>
            {/* Separator — not after last */}
            {i < units.length - 1 && (
              <span className="text-slate-600 font-bold text-lg leading-none mb-4">:</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
