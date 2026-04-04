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
        <div className={`flex flex-col items-center justify-between w-12 h-24 sm:w-14 sm:h-28 bg-white border border-slate-200 rounded-2xl transition-all shadow-sm group ${isLocked ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'hover:border-blue-300 hover:shadow-md'}`}>
            <button
                id={ids?.up}
                disabled={isLocked}
                onClick={(e) => { e.stopPropagation(); if (value === null) onActivate(); else onChange(value + 1); }}
                className="w-full flex-1 flex items-center justify-center text-slate-300 group-hover:text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-t-xl transition-colors active:bg-blue-50 focus:outline-none"
            >
                <ChevronUp size={20} strokeWidth={3} />
            </button>

            <div className="h-10 flex items-center justify-center text-2xl sm:text-3xl font-black text-slate-800 leading-none select-none z-10">
                {value === null ? '-' : value}
            </div>

            <button
                id={ids?.down}
                disabled={isLocked}
                onClick={(e) => { e.stopPropagation(); if (value === null) onActivate(); else onChange(Math.max(0, value - 1)); }}
                className="w-full flex-1 flex items-center justify-center text-slate-300 group-hover:text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-b-xl transition-colors active:bg-blue-50 focus:outline-none"
            >
                <ChevronDown size={20} strokeWidth={3} />
            </button>
        </div>
    );
};
