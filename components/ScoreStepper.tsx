import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ScoreStepperProps {
    value: number | null;
    onChange: (val: number) => void;
    isLocked: boolean;
    onActivate: () => void;
    ids?: { up: string; down: string };
}

export const ScoreStepper: React.FC<ScoreStepperProps> = ({ value, onChange, isLocked, onActivate, ids }) => {
    return (
        <div className={`flex flex-col items-center w-12 sm:w-14 rounded-3xl overflow-hidden transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''} bg-slate-100`}>
            <button
                id={ids?.up}
                disabled={isLocked}
                onClick={(e) => { e.stopPropagation(); if (value === null) onActivate(); else onChange(value + 1); }}
                className="w-full min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 active:bg-slate-200 transition-colors focus:outline-none"
            >
                <ChevronUp size={18} strokeWidth={3} />
            </button>

            <div className="w-full flex items-center justify-center text-2xl sm:text-3xl font-black text-slate-800 leading-none select-none py-1">
                {value === null ? <span className="text-slate-300">–</span> : value}
            </div>

            <button
                id={ids?.down}
                disabled={isLocked}
                onClick={(e) => { e.stopPropagation(); if (value === null) onActivate(); else onChange(Math.max(0, value - 1)); }}
                className="w-full min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 active:bg-slate-200 transition-colors focus:outline-none"
            >
                <ChevronDown size={18} strokeWidth={3} />
            </button>
        </div>
    );
};
