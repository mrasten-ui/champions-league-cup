import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ScoreStepperProps {
    value: number | null;
    onChange: (val: number) => void;
    isLocked: boolean;
    onActivate: () => void;
    ids?: { up: string; down: string };
    saveState?: 'idle' | 'syncing' | 'saved';
    /** 'compact' is a shrunk-down version for dense list rows. 'medium' sits between
     *  that and 'default' — used by the airy single-row matchday list. */
    size?: 'default' | 'compact' | 'medium';
}

export const ScoreStepper: React.FC<ScoreStepperProps> = ({ value, onChange, isLocked, onActivate, ids, saveState = 'idle', size = 'default' }) => {
    const numColour =
        saveState === 'syncing' ? 'text-cyan-400' :
        saveState === 'saved'   ? 'text-emerald-400' :
        'text-white';
    const isCompact = size === 'compact';
    const isMedium = size === 'medium';
    const wrapSize = isCompact ? 'w-8 rounded-lg' : isMedium ? 'w-10 sm:w-11 rounded-xl' : 'w-12 sm:w-14 rounded-2xl';
    const btnHeight = isCompact ? 'min-h-[18px]' : isMedium ? 'min-h-[26px]' : 'min-h-[44px]';
    const chevronSize = isCompact ? 11 : isMedium ? 14 : 18;
    const numSize = isCompact ? 'text-base py-0' : isMedium ? 'text-lg sm:text-xl py-0.5' : 'text-2xl sm:text-3xl py-1';
    return (
        <div
            className={`flex flex-col items-center ${wrapSize} overflow-hidden transition-all duration-200 focus-within:border-cyan-400 ${
                isLocked
                    ? 'bg-transparent border-none opacity-70'
                    : 'bg-white/5 border border-white/15 hover:border-white/30'
            }`}
        >
            <button
                id={ids?.up}
                disabled={isLocked}
                onClick={(e) => { e.stopPropagation(); if (value === null) onActivate(); else onChange(value + 1); }}
                className={`w-full flex items-center justify-center text-slate-400 hover:text-cyan-400 active:bg-white/10 transition-colors focus:outline-none disabled:hover:text-slate-400 ${btnHeight}`}
            >
                <ChevronUp size={chevronSize} strokeWidth={3} />
            </button>

            <div className={`w-full flex items-center justify-center font-black leading-none select-none transition-colors duration-200 tabular-nums ${numSize} ${isLocked ? 'text-slate-500' : numColour}`}>
                {value === null ? <span className="text-slate-500">–</span> : value}
            </div>

            <button
                id={ids?.down}
                disabled={isLocked}
                onClick={(e) => { e.stopPropagation(); if (value === null) onActivate(); else onChange(Math.max(0, value - 1)); }}
                className={`w-full flex items-center justify-center text-slate-400 hover:text-cyan-400 active:bg-white/10 transition-colors focus:outline-none disabled:hover:text-slate-400 ${btnHeight}`}
            >
                <ChevronDown size={chevronSize} strokeWidth={3} />
            </button>
        </div>
    );
};
