import React, { useState, useEffect, useMemo } from 'react';
import { Match, Translation } from '../types';
import { ShieldAlert, Lock, AlertTriangle } from 'lucide-react';

interface DeadlineCountdownProps {
  matches: Match[];
  lang: Translation;
}

const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

export const DeadlineCountdown: React.FC<DeadlineCountdownProps> = ({ matches, lang }) => {
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

  // Don't render if deadline passed or no matches loaded
  if (!deadline || remaining <= 0) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const isUrgent = remaining < 24 * 60 * 60 * 1000;   // < 24 hours
  const isCritical = remaining < 60 * 60 * 1000;       // < 1 hour

  const units = [
    { value: d,      label: lang.days    || 'Days' },
    { value: h,      label: lang.hours   || 'Hrs'  },
    { value: m,      label: lang.minutes || 'Min'  },
    { value: s,      label: lang.seconds || 'Sec'  },
  ];

  if (isCritical) {
    return (
      <div className="mb-6 rounded-2xl overflow-hidden shadow-lg animate-pulse-slow">
        <div className="bg-red-600 p-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-white" />
            <span className="text-white font-black uppercase tracking-widest text-xs">
              {lang.deadlineLabel || 'Lock In Now'}
            </span>
            <AlertTriangle size={18} className="text-white" />
          </div>
          <div className="flex justify-center gap-3">
            {units.filter((_, i) => i > 0).map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <div className="bg-white/20 rounded-xl px-4 py-2 min-w-[3.5rem] text-center border border-white/30 shadow-inner">
                  <span className="text-3xl font-black text-white tabular-nums leading-none">{pad(value)}</span>
                </div>
                <span className="text-[9px] font-black text-red-200 uppercase tracking-widest mt-1">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-red-700 px-4 py-2 flex items-center justify-center gap-2">
          <Lock size={12} className="text-red-300" />
          <span className="text-[10px] font-bold text-red-200 uppercase tracking-widest">
            {lang.deadlineTitle || '🚨 The Deadline'}
          </span>
        </div>
      </div>
    );
  }

  if (isUrgent) {
    return (
      <div className="mb-6 rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 relative">
          <div className="absolute inset-0 rounded-2xl ring-4 ring-amber-400/50 animate-pulse pointer-events-none" />
          <div className="flex items-center justify-center gap-2 mb-3 relative z-10">
            <ShieldAlert size={18} className="text-white" />
            <span className="text-white font-black uppercase tracking-widest text-xs">
              {lang.deadlineLabel || 'Deadline Approaching'}
            </span>
            <ShieldAlert size={18} className="text-white" />
          </div>
          <div className="flex justify-center gap-3 relative z-10">
            {units.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <div className="bg-white/25 rounded-xl px-3 py-2 min-w-[3.25rem] text-center border border-white/30 shadow-inner">
                  <span className="text-2xl font-black text-white tabular-nums leading-none">{pad(value)}</span>
                </div>
                <span className="text-[9px] font-black text-amber-100 uppercase tracking-widest mt-1">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-amber-600 px-4 py-2 flex items-center justify-center gap-2">
          <Lock size={12} className="text-amber-200" />
          <span className="text-[10px] font-bold text-amber-100 uppercase tracking-widest">
            {lang.deadlineTitle || '🚨 The Deadline'}
          </span>
        </div>
      </div>
    );
  }

  // Normal state — > 24 hours
  return (
    <div className="mb-6 bg-[#0f2545] rounded-2xl overflow-hidden shadow-lg border border-white/10">
      <div className="p-4">
        <div className="flex justify-center gap-3">
          {units.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <div className="bg-white/10 rounded-xl px-3 py-2 min-w-[3.25rem] text-center border border-white/10 shadow-inner">
                <span className="text-2xl font-black text-white tabular-nums leading-none">{pad(value)}</span>
              </div>
              <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest mt-1">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white/5 px-4 py-2 flex items-center justify-center gap-2 border-t border-white/10">
        <Lock size={12} className="text-blue-300" />
        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">
          {lang.deadlineLabel || 'Until predictions lock'}
        </span>
      </div>
    </div>
  );
};
