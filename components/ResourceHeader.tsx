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

        {/* Horizontal layout: avatar left, name + stats right */}
        <div className="flex flex-row items-center gap-4 px-4 py-4">

            {/* Avatar — compact */}
            <div className="relative shrink-0">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
                <AvatarDisplay
                    avatar={user.avatar}
                    size="lg"
                    className="w-16 h-16 ring-4 ring-white shadow-xl relative z-10"
                />
            </div>

            {/* Name + Stats */}
            <div className="flex flex-col flex-1 min-w-0">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2 truncate">
                    {user.name}
                </h2>

                {/* Stats row */}
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    {/* Rank */}
                    <div className="flex-1 flex flex-col items-center">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                            <Hash size={10} /> Rank
                        </div>
                        <div className="text-lg font-black text-blue-600">#{rank}</div>
                    </div>

                    <div className="w-px h-7 bg-slate-200" />

                    {/* Points */}
                    <div className="flex-1 flex flex-col items-center">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                            <Trophy size={10} /> Pts
                        </div>
                        <div className="text-lg font-black text-slate-800">{totalPoints}</div>
                    </div>

                    {/* Subs (LIVE only) */}
                    {phase === 'LIVE' && (
                        <>
                            <div className="w-px h-7 bg-slate-200" />
                            <div className="flex-1 flex flex-col items-center">
                                <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 mb-0.5 ${user.substitutions > 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                                    <RefreshCw size={10} /> Subs
                                </div>
                                <div className={`text-lg font-black ${user.substitutions > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                                    {user.substitutions}<span className="text-xs text-slate-300 ml-0.5 align-top">/5</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
