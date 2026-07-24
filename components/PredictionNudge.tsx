import React, { useState } from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { Translation } from '../types';

interface PredictionNudgeProps {
  missingCount: number;
  userEmail: string;
  onGoToPredictions: () => void;
  lang: Translation;
}

const NUDGE_KEY_PREFIX = 'rasten_nudge_dismissed_v1_';

export const PredictionNudge: React.FC<PredictionNudgeProps> = ({
  missingCount, userEmail, onGoToPredictions, lang,
}) => {
  const [dismissed, setDismissed] = useState(
    () => !!localStorage.getItem(NUDGE_KEY_PREFIX + userEmail)
  );

  if (dismissed || missingCount <= 0) return null;

  const handleDismiss = () => {
    localStorage.setItem(NUDGE_KEY_PREFIX + userEmail, '1');
    setDismissed(true);
  };

  const message = lang.nudgeMsg.replace('{n}', String(missingCount));

  return (
    <div className="mb-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 shadow-[0_0_24px_rgba(245,158,11,0.12)] px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/25 shrink-0">
        <AlertTriangle size={16} className="text-amber-300" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black uppercase tracking-widest text-amber-300 leading-none">{lang.nudgeTitle}</p>
        <p className="text-[11px] text-amber-200/80 font-medium mt-0.5 leading-snug">{message}</p>
      </div>
      <button
        onClick={onGoToPredictions}
        className="shrink-0 flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-[#0f2545] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors active:scale-95"
      >
        {lang.nudgeCta}
        <ArrowRight size={12} strokeWidth={3} />
      </button>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1.5 text-amber-400/60 hover:text-amber-300 transition-colors rounded-full hover:bg-amber-500/10"
      >
        <X size={13} strokeWidth={3} />
      </button>
    </div>
  );
};
