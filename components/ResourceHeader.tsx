import React from 'react';
import { UserProfile, Translation, TournamentPhase } from '../types';
import { RefreshCw, Trophy, Hash, User } from 'lucide-react';
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500">
        {/* Navy Header */}
        <div className="bg-[#0f2545] px-4 py-3 flex items-center gap-2 border-b border-slate-700">
            <User size={16} className="text-blue-400" />
            <span className="text-sm font-black text-white uppercase tracking-widest">{lang.managerProfile || "Manager Profile"}</span>
        </div>

        <div className="flex flex-col items-center justify-center py-6 px-4">
            
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
            <div className="flex items-center gap-3 sm:gap-6 w-full max-w-md justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                
                {/* Rank */}
                <div className="flex-1 flex flex-col items-center">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                        <Hash size={10} /> Rank
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-blue-600">#{rank}</div>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-slate-200"></div>

                {/* Points */}
                <div className="flex-1 flex flex-col items-center">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                        <Trophy size={10} /> Pts
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-800">{totalPoints}</div>
                </div>

                {/* Subs (Only if Live) */}
                {phase === 'LIVE' && (
                    <>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="flex-1 flex flex-col items-center">
                            <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 mb-1 ${user.substitutions > 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                                <RefreshCw size={10} /> Subs
                            </div>
                            <div className={`text-xl sm:text-2xl font-black ${user.substitutions > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                                {user.substitutions}<span className="text-xs text-slate-300 ml-0.5 align-top">/5</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};