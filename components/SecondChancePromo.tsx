import React from 'react';
import { Translation } from '../types';
import { AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

interface SecondChancePromoProps {
  hasTaken: boolean;
  onUnlock: () => void;
  lang: Translation;
}

export const SecondChancePromo: React.FC<SecondChancePromoProps> = ({ hasTaken, onUnlock, lang }) => {
  if (hasTaken) return null; 

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navy Header */}
        <div className="bg-[#0f2545] px-4 py-3 flex items-center gap-2 border-b border-slate-700">
            <ShieldCheck size={16} className="text-amber-400" />
            <span className="text-sm font-black text-white uppercase tracking-widest">Season Strategy</span>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
                <ShieldCheck size={140} />
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-100">
                        <AlertTriangle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">High Risk Action</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed opacity-95">
                        Bracket busted? Activate <strong>Second Chance</strong> to reset your knockout predictions.
                        <span className="block mt-1 text-xs opacity-80">
                            *Future points reduced by 50%.
                        </span>
                    </p>
                </div>

                <button 
                    onClick={onUnlock}
                    className="shrink-0 bg-white text-orange-600 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-orange-50 transition-colors flex items-center gap-2"
                >
                    Unlock Now <ArrowRight size={14} />
                </button>
            </div>
        </div>
    </div>
  );
};