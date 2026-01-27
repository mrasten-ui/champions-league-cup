import React from 'react';
import { Translation } from '../types';
import { AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

interface SecondChancePromoProps {
  hasTaken: boolean;
  onUnlock: () => void;
  lang: Translation;
}

export const SecondChancePromo: React.FC<SecondChancePromoProps> = ({ hasTaken, onUnlock, lang }) => {
  if (hasTaken) return null; // Don't show if already active

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-20">
            <ShieldCheck size={100} />
        </div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-white fill-white/20" size={18} />
                <h3 className="text-sm font-black uppercase tracking-widest">Season Strategy</h3>
            </div>
            
            <p className="text-sm font-medium leading-relaxed opacity-95 mb-4 max-w-[90%]">
                Bracket busted? Activate <strong>Second Chance</strong> to reset your knockout predictions for the remaining rounds.
                <span className="block mt-1 text-xs opacity-80 bg-black/20 inline-block px-2 py-0.5 rounded">
                    Note: Future points will be reduced by 50%.
                </span>
            </p>

            <button 
                onClick={onUnlock}
                className="bg-white text-orange-600 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-orange-50 transition-colors flex items-center gap-2"
            >
                Unlock Second Chance <ArrowRight size={14} />
            </button>
        </div>
    </div>
  );
};