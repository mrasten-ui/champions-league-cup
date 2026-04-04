import React from 'react';
import { ChevronDown, History } from 'lucide-react';
import { HeadToHeadStats, Team, Translation } from '../types';

interface HeadToHeadBarProps {
    h2hData: HeadToHeadStats;
    homeTeam: Team;
    awayTeam: Team;
    lang: Translation;
    expanded: boolean;
    onToggle: () => void;
}

export const HeadToHeadBar: React.FC<HeadToHeadBarProps> = ({ h2hData, homeTeam, awayTeam, lang, expanded, onToggle }) => {
    return (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 cursor-pointer group" onClick={onToggle}>
            <div className="flex items-center justify-between mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                    <History size={12} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{lang.headToHead}</span>
                </div>
                <ChevronDown size={14} className={`text-slate-300 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
            </div>

            {h2hData.totalMatches > 0 ? (
                <div className="flex flex-col gap-2">
                    {/* Win counts */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <img src={homeTeam.flag} className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">{homeTeam.id}</span>
                            <span className="text-lg font-black text-emerald-600 leading-none">{h2hData.homeWins}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">draws</span>
                            <span className="text-sm font-black text-slate-400 leading-none">{h2hData.draws}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-lg font-black text-blue-600 leading-none">{h2hData.awayWins}</span>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">{awayTeam.id}</span>
                            <img src={awayTeam.flag} className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                        </div>
                    </div>

                    {/* Bar */}
                    <div className="flex h-2.5 rounded-full overflow-hidden w-full shadow-inner bg-slate-100 gap-px">
                        <div style={{ width: `${(h2hData.homeWins / h2hData.totalMatches) * 100}%` }} className="bg-emerald-500 transition-all duration-500" />
                        <div style={{ width: `${(h2hData.draws / h2hData.totalMatches) * 100}%` }} className="bg-slate-300 transition-all duration-500" />
                        <div style={{ width: `${(h2hData.awayWins / h2hData.totalMatches) * 100}%` }} className="bg-blue-500 transition-all duration-500" />
                    </div>

                    {/* Match history */}
                    {expanded && h2hData.last5.length > 0 && (
                        <div className="mt-1 space-y-1 border-t border-slate-100 pt-2">
                            {h2hData.last5.map((m, i) => {
                                const homeWon = m.homeScore > m.awayScore;
                                const awayWon = m.awayScore > m.homeScore;
                                return (
                                    <div key={i} className="flex justify-between items-center text-[10px]">
                                        <span className={`font-black uppercase tracking-tight w-12 ${homeWon ? 'text-emerald-600' : 'text-slate-400'}`}>{homeTeam.id}</span>
                                        <span className="text-slate-400 font-medium">{m.year}</span>
                                        <span className={`font-black tabular-nums ${homeWon ? 'text-emerald-600' : awayWon ? 'text-blue-600' : 'text-slate-500'}`}>{m.homeScore} – {m.awayScore}</span>
                                        <span className={`font-black uppercase tracking-tight w-12 text-right ${awayWon ? 'text-blue-600' : 'text-slate-400'}`}>{awayTeam.id}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center text-[10px] text-slate-400 italic font-medium bg-slate-50 py-2 rounded-lg border border-slate-100">
                    {lang.firstMeeting}
                </div>
            )}
        </div>
    );
};
