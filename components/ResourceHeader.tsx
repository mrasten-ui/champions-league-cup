import React from 'react';
import { UserProfile, Translation, TournamentPhase } from '../types';
import { RefreshCw, Trophy, Hash } from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';

interface ResourceHeaderProps {
  user: UserProfile;
  lang: Translation;
  phase: TournamentPhase;
  rank: number;
  totalPoints: number;
}

export const ResourceHeader: React.FC<ResourceHeaderProps> = ({ user, lang, phase, rank, totalPoints }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 animate-in slide-in-from-top-4 duration-500">
        
        {/* 1. Large Central Avatar */}
        <div className="relative mb-4 group">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl transform group-hover:scale-110 transition-transform duration-500"></div>
            <AvatarDisplay 
                avatar={user.avatar} 
                size="xl" 
                className="w-28 h-28 sm:w-36 sm:h-36 ring-4 ring-white shadow-2xl relative z-10" 
            />
        </div>

        {/* 2. User Name */}
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tighter mb-6 text-center">
            {user.name}
        </h2>

        {/* 3. Stats Row (Rank, Points, Subs) */}
        <div className="flex items-center gap-3 sm:gap-6 bg-white p-2 sm:p-3 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md justify-between">
            
            {/* Rank */}
            <div className="flex-1 flex flex-col items-center px-2 sm:px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Hash size={10} /> Rank
                </div>
                <div className="text-xl sm:text-2xl font-black text-blue-600">#{rank}</div>
            </div>

            {/* Points */}
            <div className="flex-1 flex flex-col items-center px-2 sm:px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Trophy size={10} /> Pts
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-800">{totalPoints}</div>
            </div>

            {/* Subs (Only if Live) */}
            {phase === 'LIVE' && (
                <div className={`flex-1 flex flex-col items-center px-2 sm:px-4 py-2 rounded-xl border ${user.substitutions > 0 ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 mb-1 ${user.substitutions > 0 ? 'text-blue-400' : 'text-slate-400'}`}>
                        <RefreshCw size={10} /> Subs
                    </div>
                    <div className={`text-xl sm:text-2xl font-black ${user.substitutions > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                        {user.substitutions}<span className="text-xs text-slate-300 ml-0.5 align-top">/5</span>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};