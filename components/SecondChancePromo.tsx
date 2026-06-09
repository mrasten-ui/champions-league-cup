import React from 'react';
import { Translation } from '../types';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface SecondChancePromoProps {
  hasTaken: boolean;
  secondChanceStatus?: 'NONE' | 'PENDING' | 'ACTIVE';
  onUnlock: () => void;
  lang: Translation;
}

export const SecondChancePromo: React.FC<SecondChancePromoProps> = ({ hasTaken, secondChanceStatus, onUnlock, lang }) => {
  if (hasTaken || secondChanceStatus === 'PENDING' || secondChanceStatus === 'ACTIVE') return null;

  return (
    <div id="tour-second-chance-promo" className="bg-[#0f2545] rounded-2xl border border-white/10 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
            {/* Amber accent icon */}
            <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <ShieldCheck size={18} className="text-amber-400" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none mb-0.5">
                    {lang.secondChanceTab || "Second Chance"}
                </div>
                <div className="text-xs text-slate-300 font-medium leading-snug">
                    {lang.secondChanceDesc || "Busted bracket? Buy back in for the playoffs."}
                </div>
            </div>

            {/* CTA */}
            <button
                onClick={onUnlock}
                className="shrink-0 flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-black text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-all"
            >
                {lang.secondChanceBtn || "Activate"} <ArrowRight size={11} />
            </button>
        </div>
    </div>
  );
};
