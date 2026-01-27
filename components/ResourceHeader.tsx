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
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-4">
        {/* Top Row: Identity & Main Stats */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <AvatarDisplay avatar={user.avatar} size="md" className="ring-2 ring-slate-100" />
                <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lang.manager || "Manager"}</div>
                    <div className="text-lg font-black text-slate-800 leading-none">{user.name}</div>
                </div>
            </div>
            
            <div className="flex gap-4 text-right">
                <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1">
                        <Hash size={10} /> Rank
                    </div>
                    <div className="text-xl font-black text-blue-600">#{rank}</div>
                </div>
                <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1">
                        <Trophy size={10} /> Pts
                    </div>
                    <div className="text-xl font-black text-slate-800">{totalPoints}</div>
                </div>
            </div>
        </div>

        {/* Action Resource: Substitutions (Only show if relevant) */}
        {phase === 'LIVE' && (
            <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${user.substitutions > 0 ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                        <RefreshCw size={18} />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang.substitutions || "Subs Left"}</div>
                        <div className="text-sm font-bold text-slate-700 leading-tight">
                            {user.substitutions > 0 ? "Strategic Changes Available" : "Out of Substitutions"}
                        </div>
                    </div>
                </div>
                <div className="text-2xl font-black text-slate-800">{user.substitutions}<span className="text-sm text-slate-300 ml-0.5">/5</span></div>
            </div>
        )}
    </div>
  );
};