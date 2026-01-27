import React from 'react';
import { UserProfile, Translation } from '../types';
import { RefreshCw, ScanEye, TrendingUp, AlertTriangle } from 'lucide-react';

interface ResourceHeaderProps {
  user: UserProfile;
  lang: Translation;
  potentialPoints: number;
  onSecondChance: () => void;
}

export const ResourceHeader: React.FC<ResourceHeaderProps> = ({ user, lang, potentialPoints, onSecondChance }) => {
  return (
    <div className="space-y-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Substitutions (Primary Action Resource) */}
            <div className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center relative overflow-hidden ${user.substitutions > 0 ? 'bg-white border-blue-100 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-75'}`}>
                <div className={`absolute top-2 right-2 text-[10px] font-black uppercase tracking-widest ${user.substitutions > 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                    {lang.substitutions || "SUBS"}
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                    <span className={`text-4xl font-black ${user.substitutions > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{user.substitutions}</span>
                    <span className="text-sm font-bold text-slate-400">/ 5</span>
                </div>
                <RefreshCw size={16} className={`absolute bottom-3 left-3 ${user.substitutions > 0 ? 'text-blue-200' : 'text-slate-300'}`} />
            </div>

            {/* Intel/Tokens */}
            <div className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center relative overflow-hidden ${user.tokens > 0 ? 'bg-white border-purple-100 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-75'}`}>
                <div className={`absolute top-2 right-2 text-[10px] font-black uppercase tracking-widest ${user.tokens > 0 ? 'text-purple-500' : 'text-slate-400'}`}>
                    {lang.tokens || "INTEL"}
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                    <span className={`text-4xl font-black ${user.tokens > 0 ? 'text-purple-600' : 'text-slate-400'}`}>{user.tokens}</span>
                </div>
                <ScanEye size={16} className={`absolute bottom-3 left-3 ${user.tokens > 0 ? 'text-purple-200' : 'text-slate-300'}`} />
            </div>
        </div>

        {/* Potential / Status Bar */}
        <div className="bg-[#0f2545] rounded-xl p-3 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg"><TrendingUp size={18} className="text-green-400" /></div>
                <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Max Potential</div>
                    <div className="text-sm font-black tracking-wide">{potentialPoints} pts</div>
                </div>
            </div>
            
            {!user.hasTakenSecondChance && (
                <button onClick={onSecondChance} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors text-[10px] font-black uppercase tracking-widest text-amber-950">
                    <AlertTriangle size={12} />
                    2nd Chance
                </button>
            )}
        </div>
    </div>
  );
};