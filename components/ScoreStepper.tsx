import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ScoreStepperProps {
    value: number | null;
    onChange: (val: number) => void;
    isLocked: boolean;
    onActivate: () => void;
    ids?: { up: string; down: string };
    saveState?: 'idle' | 'syncing' | 'saved';
}

export const ScoreStepper: React.FC<ScoreStepperProps> = ({ value, onChange, isLocked, onActivate, ids, saveState = 'idle' }) => {
    const numColour =
        saveState === 'syncing' ? 'text-cyan-500' :
        saveState === 'saved'   ? 'text-emerald-500' :
        'text-slate-800';
    return (
        <div
            className={`flex flex-col items-center w-12 sm:w-14 rounded-2xl overflow-hidden transition-all duration-200 focus-within:border-cyan-400 ${
                isLocked
                    ? 'bg-transparent border-none opacity-70'
                    : 'bg-slate-50 border border-slate-300 hover:border-slate-400'
            }`}
        >
            <button
                id={ids?.up}
                disabled={isLocked}
                onClick={(e) => { e.stopPropagation(); if (value === null) onActivate(); else onChange(value + 1); }}
                className="w-full min-h-[44px] flex items-center justify-center text-slate-400 hover:text-cyan-500 active:bg-slate-200 transition-colors focus:outline-none disabled:hover:text-slate-400"
            >
                <ChevronUp size={18} strokeWidth={3} />
            </button>

            <div className={`w-full flex items-center justify-center text-2xl sm:text-3xl font-black leading-none select-none py-1 transition-colors duration-200 tabular-nums ${isLocked ? 'text-slate-400' : numColour}`}>
                {value === null ? <span className="text-slate-300">–</span> : value}
            </div>

            <button
                id={ids?.down}
                disabled={isLocked}
                onClick={(e) => { e.stopPropagation(); if (value === null) onActivate(); else onChange(Math.max(0, value - 1)); }}
                className="w-full min-h-[44px] flex items-center justify-center text-slate-400 hover:text-cyan-500 active:bg-slate-200 transition-colors focus:outline-none disabled:hover:text-slate-400"
            >
                <ChevronDown size={18} strokeWidth={3} />
            </button>
        </div>
    );
};
