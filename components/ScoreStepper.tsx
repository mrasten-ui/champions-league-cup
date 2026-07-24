import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ScoreStepperProps {
    value: number | null;
    onChange: (val: number) => void;
    isLocked: boolean;
    onActivate: () => void;
    ids?: { up: string; down: string };
    saveState?: 'idle' | 'syncing' | 'saved';
    /** 'compact' is a shrunk-down version for dense list rows (day-grouped matchday list). */
    size?: 'default' | 'compact';
}

export const ScoreStepper: React.FC<ScoreStepperProps> = ({ value, onChange, isLocked, onActivate, ids, saveState = 'idle', size = 'default' }) => {
    const numColour =
        saveState === 'syncing' ? 'text-cyan-400' :
        saveState === 'saved'   ? 'text-emerald-400' :
        'text-white';
    const isCompact = size === 'compact';
    return (
        <div
            className={`flex flex-col items-center ${isCompact ? 'w-8 rounded-lg' : 'w-12 sm:w-14 rounded-2xl'} overflow-hidden transition-all duration-200 focus-within:border-cyan-400 ${
                isLocked
                    ? 'bg-transparent border-none opacity-70'
                    : 'bg-white/5 border border-white/15 hover:border-white/30'
            }`}
        >
            <button
                id={ids?.up}
                disabled={isLocked}
                onClick={(e) => { e.stopPropagation(); if (value === null) onActivate(); else onChange(value + 1); }}
                className={`w-full flex items-center justify-center text-slate-400 hover:text-cyan-400 active:bg-white/10 transition-colors focus:outline-none disabled:hover:text-slate-400 ${isCompact ? 'min-h-[18px]' : 'min-h-[44px]'}`}
            >
                <ChevronUp size={isCompact ? 11 : 18} strokeWidth={3} />
            </button>

            <div className={`w-full flex items-center justify-center font-black leading-none select-none transition-colors duration-200 tabular-nums ${isCompact ? 'text-base py-0' : 'text-2xl sm:text-3xl py-1'} ${isLocked ? 'text-slate-500' : numColour}`}>
                {value === null ? <span className="text-slate-500">–</span> : value}
            </div>

            <button
                id={ids?.down}
                disabled={isLocked}
                onClick={(e) => { e.stopPropagation(); if (value === null) onActivate(); else onChange(Math.max(0, value - 1)); }}
                className={`w-full flex items-center justify-center text-slate-400 hover:text-cyan-400 active:bg-white/10 transition-colors focus:outline-none disabled:hover:text-slate-400 ${isCompact ? 'min-h-[18px]' : 'min-h-[44px]'}`}
            >
                <ChevronDown size={isCompact ? 11 : 18} strokeWidth={3} />
            </button>
        </div>
    );
};
