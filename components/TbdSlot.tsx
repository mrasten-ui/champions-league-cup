import React, { useMemo } from 'react';
import { Match, Team, Translation } from '../types';
import { getSlotSource, getPotentialTeams, getGroupTeams } from '../utils/bracketHelpers';

interface TbdSlotProps {
    matchId: string;
    side: 'home' | 'away';
    allMatches?: Match[];
    allTeams?: Record<string, Team>;
    lang: Translation;
}

export const TbdSlot: React.FC<TbdSlotProps> = ({ matchId, side, allMatches, allTeams, lang }) => {
    const source = useMemo(() => getSlotSource(matchId, side), [matchId, side]);
    const potentialTeams = useMemo(() => {
        if (!allMatches || !allTeams) return null;
        return getPotentialTeams(source, allMatches, allTeams);
    }, [source, allMatches, allTeams]);
    const groupTeams = useMemo(() => {
        if (source.type !== 'GROUP_RANK' || !allMatches || !allTeams) return [];
        return getGroupTeams(source.groupId, allMatches, allTeams);
    }, [source, allMatches, allTeams]);

    if (source.type === 'GROUP_RANK') {
        return (
            <div className="w-16 h-12 rounded-lg border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center relative overflow-hidden group/tbd">
                {groupTeams.length > 0 ? (
                    <div className="absolute inset-0 w-full h-full grid grid-cols-2 grid-rows-2">
                        {groupTeams.slice(0, 4).map(team => (
                            <div key={team.id} className="relative w-full h-full">
                                <img src={team.flag} alt="" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-repeat"></div>
                )}
                <div className="relative z-10 bg-white/95 px-1.5 py-0.5 rounded shadow-sm border border-slate-100 backdrop-blur-[1px]">
                    <span className="text-[8px] font-black text-slate-800 uppercase text-center leading-none block">{source.label}</span>
                </div>
            </div>
        );
    }

    if (potentialTeams && potentialTeams.length === 2) {
        return (
            <div className="w-16 h-12 rounded-lg border-2 border-dashed border-blue-200 bg-white flex flex-col items-center justify-center relative overflow-hidden group/tbd">
                <div className="absolute inset-0 w-full h-full grid grid-cols-2">
                    <div className="relative w-full h-full border-r border-white/20"><img src={potentialTeams[0].flag} alt="" className="w-full h-full object-cover" /></div>
                    <div className="relative w-full h-full"><img src={potentialTeams[1].flag} alt="" className="w-full h-full object-cover" /></div>
                </div>
                <div className="relative z-10 bg-white/95 px-1.5 py-0.5 rounded shadow-sm border border-slate-100 backdrop-blur-[1px]">
                    <div className="flex gap-1 text-[7px] font-black text-slate-800 uppercase leading-none">
                        <span>{potentialTeams[0].id}</span>
                        <span className="text-slate-400 font-normal">/</span>
                        <span>{potentialTeams[1].id}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-16 h-12 rounded-lg border-2 border-dashed border-[#2a4a7c] bg-[#0f2545] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/logo.png')] bg-center bg-contain bg-no-repeat scale-75"></div>
            <div className="relative z-10 bg-white/90 px-2 py-0.5 rounded shadow-sm border border-slate-100 backdrop-blur-[1px]">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">TBD</span>
            </div>
        </div>
    );
};
