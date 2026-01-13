import React, { useMemo } from 'react';
import { Match, Team, Translation, Prediction, GroupStanding } from '../types';
import { calculateGroupStandings } from '../services/engine';
import { GROUP_CONFIG } from '../constants';
import { AlertTriangle, CheckCircle2, TrendingUp, XCircle, ArrowRight, ShieldAlert } from 'lucide-react';

interface TeamPulseProps {
  matches: Match[];
  teams: Record<string, Team>;
  userPredictions: Prediction[];
  lang: Translation;
  onTeamClick: (teamId: string) => void;
  onUnlockSecondChance: () => void;
  hasTakenSecondChance: boolean;
}

export const TeamPulse: React.FC<TeamPulseProps> = ({ 
  matches, teams, userPredictions, lang, onTeamClick, onUnlockSecondChance, hasTakenSecondChance 
}) => {
  
  // 1. Calculate Real World Standings
  const allStandings = useMemo(() => {
      const map: Record<string, GroupStanding[]> = {};
      GROUP_CONFIG.forEach(g => {
          map[g.id] = calculateGroupStandings(g.id, matches, teams);
      });
      return map;
  }, [matches, teams]);

  // 2. Identify User's Predicted Qualifiers (Top 2 from each group + Best 3rds not handled here for simplicity, just direct top 2 focus)
  const pulseData = useMemo(() => {
      const myTeams: { teamId: string; status: 'SAFE' | 'TRACK' | 'DANGER' | 'OUT'; rank: number; group: string }[] = [];
      const trendingTeams: { teamId: string; rank: number; group: string }[] = [];

      GROUP_CONFIG.forEach(g => {
          // Find user's predicted standings for this group
          // (Simulated locally for display purposes or pulled from stored prediction logic)
          // For MVP: We assume user predicted teams that they simply have "winning" in their match picks
          // A better way: Did the user predict this team to be Rank 1 or 2?
          
          const groupMatches = matches.filter(m => m.groupId === g.id);
          const userGroupPreds = userPredictions.filter(p => groupMatches.some(m => m.id === p.matchId));
          
          // Calculate User's Predicted Standings
          const userStandings = calculateGroupStandings(g.id, 
              groupMatches.map(m => {
                  const p = userGroupPreds.find(up => up.matchId === m.id);
                  return p ? { ...m, homeScore: p.home, awayScore: p.away } : m;
              }), 
              teams
          );

          const myQualifiers = userStandings.slice(0, 2).map(s => s.teamId); // User's Top 2
          const realStandings = allStandings[g.id];

          realStandings.forEach((s, idx) => {
              const realRank = idx + 1;
              const isMyPick = myQualifiers.includes(s.teamId);

              // Logic for Status
              let status: 'SAFE' | 'TRACK' | 'DANGER' | 'OUT' = 'TRACK';
              if (s.played >= 3 && realRank > 2) status = 'OUT'; // Finished and out
              else if (s.played >= 3 && realRank <= 2) status = 'SAFE'; // Finished and in
              else if (realRank <= 2) status = 'TRACK'; // Currently in
              else status = 'DANGER'; // Currently out

              if (isMyPick) {
                  myTeams.push({ teamId: s.teamId, status, rank: realRank, group: g.id });
              } else {
                  // Trending: Not my pick, but currently winning
                  if (realRank <= 2) {
                      trendingTeams.push({ teamId: s.teamId, rank: realRank, group: g.id });
                  }
              }
          });
      });

      return { myTeams, trendingTeams };
  }, [allStandings, userPredictions, matches, teams]);

  const dangerCount = pulseData.myTeams.filter(t => t.status === 'DANGER' || t.status === 'OUT').length;
  const healthPercent = Math.max(0, Math.round(((16 - dangerCount) / 16) * 100));

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
        
        {/* Health Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-black uppercase text-slate-800 tracking-tighter">Bracket Pulse</h2>
                    <p className="text-xs text-slate-500 font-medium">Live monitoring of your knockout teams.</p>
                </div>
                <div className={`text-2xl font-black ${healthPercent > 70 ? 'text-green-500' : healthPercent > 40 ? 'text-amber-500' : 'text-red-500'}`}>
                    {healthPercent}% <span className="text-[10px] text-slate-400 uppercase tracking-widest block text-right">Health</span>
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100 mb-4">
                <div className="bg-green-500" style={{ width: `${(pulseData.myTeams.filter(t=>t.status==='SAFE' || t.status==='TRACK').length / 16) * 100}%` }}></div>
                <div className="bg-amber-400" style={{ width: `${(pulseData.myTeams.filter(t=>t.status==='DANGER').length / 16) * 100}%` }}></div>
                <div className="bg-red-500" style={{ width: `${(pulseData.myTeams.filter(t=>t.status==='OUT').length / 16) * 100}%` }}></div>
            </div>

            {/* Second Chance Trigger */}
            {!hasTakenSecondChance && healthPercent < 70 && (
                <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between shadow-lg ring-1 ring-slate-800 cursor-pointer hover:bg-slate-800 transition-all" onClick={onUnlockSecondChance}>
                    <div className="flex items-center gap-3">
                        <div className="bg-red-500 p-2 rounded-lg text-white animate-pulse">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <div className="text-white text-sm font-bold uppercase tracking-wide">Detailed Analysis: Critical</div>
                            <div className="text-slate-400 text-[10px]">Tap to unlock Second Chance Protocol</div>
                        </div>
                    </div>
                    <ArrowRight className="text-white" size={20} />
                </div>
            )}
        </div>

        {/* My Teams Grid */}
        <div>
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3 px-2">Your Predicted Qualifiers</h3>
            <div className="grid grid-cols-2 gap-3">
                {pulseData.myTeams.sort((a,b) => (a.status === 'OUT' ? -1 : 1)).map(item => {
                    const team = teams[item.teamId];
                    let statusColor = 'bg-slate-100 border-slate-200';
                    let Icon = CheckCircle2;
                    let iconColor = 'text-slate-400';

                    if (item.status === 'SAFE') { statusColor = 'bg-green-50 border-green-200'; iconColor = 'text-green-500'; }
                    if (item.status === 'TRACK') { statusColor = 'bg-white border-slate-200'; iconColor = 'text-green-400'; }
                    if (item.status === 'DANGER') { statusColor = 'bg-amber-50 border-amber-200'; Icon = AlertTriangle; iconColor = 'text-amber-500'; }
                    if (item.status === 'OUT') { statusColor = 'bg-red-50 border-red-200 opacity-75'; Icon = XCircle; iconColor = 'text-red-500'; }

                    return (
                        <button 
                            key={item.teamId} 
                            onClick={() => onTeamClick(item.teamId)}
                            className={`relative p-3 rounded-xl border flex items-center gap-3 transition-all active:scale-95 text-left ${statusColor}`}
                        >
                            <img src={team.flag} className="w-8 h-8 rounded-full object-cover shadow-sm" alt="" />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-black text-slate-700 truncate">{team.name}</div>
                                <div className="text-[9px] font-medium text-slate-500 uppercase flex items-center gap-1">
                                    Grp {item.group} • Rank {item.rank}
                                </div>
                            </div>
                            <Icon size={16} className={iconColor} />
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Trending Section (Teams you missed) */}
        {pulseData.trendingTeams.length > 0 && (
            <div>
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3 px-2 mt-6 flex items-center gap-2">
                    <TrendingUp size={14} /> Unexpected Contenders
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                    {pulseData.trendingTeams.map(item => {
                        const team = teams[item.teamId];
                        return (
                            <div key={item.teamId} className="min-w-[140px] bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center gap-2">
                                <img src={team.flag} className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-50" alt="" />
                                <div className="text-center">
                                    <div className="text-xs font-bold text-slate-800">{team.name}</div>
                                    <div className="text-[9px] text-green-600 font-bold uppercase">Rank {item.rank}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
    </div>
  );
};