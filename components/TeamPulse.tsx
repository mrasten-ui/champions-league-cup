import React, { useMemo } from 'react';
import { Match, Team, Translation, Prediction, GroupStanding, Round } from '../types';
import { calculateGroupStandings } from '../services/engine';
import { GROUP_CONFIG } from '../constants';
import { AlertTriangle, Check, X, ArrowRight, ShieldAlert, TrendingUp, AlertCircle, Ghost, Trophy } from 'lucide-react';

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
  
  // 1. Detect Active Stage
  const activeStage = useMemo(() => {
      // Check if group stages are finished (all matches played)
      const groupMatches = matches.filter(m => m.groupId);
      const groupsFinished = groupMatches.every(m => m.status === 'FINISHED' || m.status === 'FT');
      
      if (!groupsFinished) return 'GROUPS';

      // Find the "Latest" active round
      const rounds: Round[] = ['R32', 'R16', 'QF', 'SF', 'FIN']; // Order matters
      for (const r of rounds) {
          const roundMatches = matches.filter(m => m.round === r);
          // If any match in this round is NOT finished, this is the active round
          if (roundMatches.some(m => m.status !== 'FINISHED' && m.status !== 'FT')) return r;
      }
      return 'FIN'; // Default to final if everything is done
  }, [matches]);

  // 2. Calculate Data (Dynamic based on stage)
  const pulseData = useMemo(() => {
      const data = {
          headline: { title: '', sub: '', color: '' },
          totalSafe: 0,
          totalDanger: 0,
          totalDead: 0, // For knockouts: picks that didn't even make the match
          groupsData: [] as any[], // For Group Stage
          knockoutData: [] as any[] // For Knockout Stage
      };

      // === LOGIC FOR GROUP STAGE ===
      if (activeStage === 'GROUPS') {
          let surprises: string[] = [];
          
          GROUP_CONFIG.forEach(g => {
              const groupMatches = matches.filter(m => m.groupId === g.id);
              const realStandings = calculateGroupStandings(g.id, groupMatches, teams);
              
              const userGroupPreds = userPredictions.filter(p => groupMatches.some(m => m.id === p.matchId));
              const userStandings = calculateGroupStandings(g.id, 
                  groupMatches.map(m => {
                      const p = userGroupPreds.find(up => up.matchId === m.id);
                      return p ? { ...m, homeScore: p.home, awayScore: p.away } : m;
                  }), teams
              );
              
              const myPredictedQualifiers = userStandings.slice(0, 2).map(s => s.teamId);
              const currentTop2 = realStandings.slice(0, 2).map(s => {
                  const isMyPick = myPredictedQualifiers.includes(s.teamId);
                  if (isMyPick) data.totalSafe++;
                  else surprises.push(teams[s.teamId].name);
                  return { ...s, status: isMyPick ? 'CORRECT' : 'SURPRISE' };
              });

              const myPicksInDanger = realStandings
                  .filter(s => myPredictedQualifiers.includes(s.teamId) && !currentTop2.find(t => t.teamId === s.teamId))
                  .map(s => {
                      data.totalDanger++;
                      return { ...s, isEliminated: s.played >= 3 };
                  });

              data.groupsData.push({ id: g.id, top2: currentTop2, danger: myPicksInDanger });
          });

          // Group Headlines
          if (hasTakenSecondChance) data.headline = { title: "Second Chance Active", sub: "Tracking real qualified teams.", color: "text-blue-600" };
          else if (data.totalDanger > 8) data.headline = { title: "Bracket Critical", sub: "Majority of picks failing.", color: "text-red-600" };
          else if (surprises.length > 0) data.headline = { title: "Unexpected Contenders", sub: `You missed ${surprises[0]} qualifying.`, color: "text-amber-600" };
          else data.headline = { title: "Group Stage Pulse", sub: "Tracking your predictions.", color: "text-slate-700" };
      } 
      
      // === LOGIC FOR KNOCKOUT STAGE ===
      else {
          const roundMatches = matches.filter(m => m.round === activeStage);
          
          roundMatches.forEach(m => {
              const myPred = userPredictions.find(p => p.matchId === m.id);
              if (!myPred) return;

              // Who did I pick to win?
              const myWinnerId = myPred.home > myPred.away ? m.homeTeamId : myPred.away > myPred.home ? m.awayTeamId : 'DRAW'; 
              // Note: In "Vault" view (pre-second chance), the homeTeamId in the match might NOT be the team I picked if I picked a team that didn't qualify.
              // But 'myPred' stores scores. We need to check if the TEAM in the real match is the one I wanted.
              // Actually, simpler: If I haven't taken second chance, my prediction logic in 'App.tsx' fills the bracket with MY teams.
              // But 'matches' prop here is the REAL schedule.
              
              // So, we need to know: Did the team I expected to be here actually show up?
              // AND: Did they win?
              
              // For simplicity in this "Pulse" view, we track:
              // 1. Is my predicted winner even in the match? (If not -> Dead End)
              // 2. If they are, are they winning?

              // To do this robustly requires complex "Path Tracing". 
              // For MVP Pulse, we will check: "Is the team I picked to advance from this match ID currently safe?"
              
              // Let's look at the result of the prediction vs reality directly:
              let status: 'SAFE' | 'DANGER' | 'DEAD' = 'DANGER';
              let myPickName = "Unknown";

              // This logic assumes we know who the user picked. 
              // Since we don't have the user's *original* bracket structure passed here, 
              // we infer it: We check the prediction score. 
              // If user predicted Home > Away, they picked Home. 
              // But who was "Home" in their bracket?
              // If hasTakenSecondChance = false, we might have a mismatch.
              
              // Fallback: We just check if the USER's predicted winner (based on the real match ID) is winning the REAL match.
              // If the teams are different, it's a "Dead" prediction.
              
              // Check real match status
              if (m.homeScore !== null && m.awayScore !== null) {
                  const realWinner = m.homeScore > m.awayScore ? 'HOME' : 'AWAY';
                  const myPick = myPred.home > myPred.away ? 'HOME' : 'AWAY';
                  
                  if (realWinner === myPick) {
                      status = 'SAFE'; 
                      data.totalSafe++;
                  } else {
                      status = 'DANGER'; // Or eliminated if Finished
                      if (m.status === 'FINISHED' || m.status === 'FT') {
                          status = 'DEAD';
                          data.totalDead++;
                      } else {
                          data.totalDanger++;
                      }
                  }
              }

              // Visual Item
              data.knockoutData.push({
                  id: m.id,
                  home: teams[m.homeTeamId],
                  away: teams[m.awayTeamId],
                  status: status,
                  myPick: myPred.home > myPred.away ? teams[m.homeTeamId]?.name : teams[m.awayTeamId]?.name
              });
          });

          // Knockout Headlines
          const stageName = activeStage === 'R32' ? "Round of 32" : activeStage === 'R16' ? "Round of 16" : "Knockouts";
          if (data.totalDead > roundMatches.length / 2) data.headline = { title: "Bracket Busted", sub: "Too many lost predictions.", color: "text-red-600" };
          else if (data.totalSafe === roundMatches.length) data.headline = { title: "Perfect Round", sub: "Every pick is correct so far.", color: "text-green-600" };
          else data.headline = { title: `${stageName} Pulse`, sub: "Survival of the fittest.", color: "text-indigo-900" };
      }

      return data;
  }, [matches, teams, userPredictions, activeStage, hasTakenSecondChance]);

  // Helper to render Round Name
  const getRoundName = (r: string) => {
      if (r === 'R32') return "Round of 32";
      if (r === 'R16') return "Round of 16";
      if (r === 'QF') return "Quarter Finals";
      if (r === 'SF') return "Semi Finals";
      if (r === 'FIN') return "The Final";
      return r;
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
        
        {/* Dynamic Headline Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <TrendingUp size={100} />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <span className="bg-slate-900 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                        {activeStage === 'GROUPS' ? 'Group Stage' : getRoundName(activeStage)}
                    </span>
                </div>
                <h2 className={`text-2xl font-black uppercase tracking-tighter ${pulseData.headline.color}`}>{pulseData.headline.title}</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">{pulseData.headline.sub}</p>
                
                {!hasTakenSecondChance && (pulseData.totalDanger > 0 || pulseData.totalDead > 0) && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">{pulseData.totalSafe} Safe</span>
                        <span className="bg-red-50 px-2 py-1 rounded text-red-500">{activeStage === 'GROUPS' ? pulseData.totalDanger : pulseData.totalDead} Lost</span>
                    </div>
                )}
            </div>

            {/* Second Chance Trigger */}
            {!hasTakenSecondChance && (pulseData.totalDanger > 6 || pulseData.totalDead > 2) && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                    <button 
                        onClick={onUnlockSecondChance}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl flex items-center justify-between transition-all group shadow-lg"
                    >
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="text-red-400 group-hover:animate-pulse" size={20} />
                            <div className="text-left">
                                <div className="text-xs font-black uppercase tracking-wider">Bracket Failing?</div>
                                <div className="text-[10px] text-slate-400">Unlock Second Chance</div>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                </div>
            )}
        </div>

        {/* === GROUP STAGE VIEW === */}
        {activeStage === 'GROUPS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pulseData.groupsData.map(g => (
                    <div key={g.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{lang.groups} {g.id}</span>
                            <span className="text-[9px] font-bold text-slate-300 uppercase">Qualifying Zone</span>
                        </div>
                        <div className="p-2 space-y-1">
                            {/* Top 2 */}
                            {g.top2.map((team: any, idx: number) => {
                                const tInfo = teams[team.teamId];
                                const isCorrect = team.status === 'CORRECT';
                                return (
                                    <div key={team.teamId} className={`flex items-center justify-between p-2 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 border-dashed opacity-80'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="text-[10px] font-bold text-slate-400 w-3">{idx + 1}</div>
                                            <img src={tInfo?.flag} className="w-6 h-6 rounded-full object-cover" alt="" />
                                            <span className={`text-xs font-bold ${isCorrect ? 'text-slate-800' : 'text-slate-500'}`}>{tInfo?.name}</span>
                                        </div>
                                        {isCorrect ? <Check size={14} className="text-green-500" /> : <span className="text-[9px] font-bold text-amber-500 uppercase px-1.5 py-0.5 bg-amber-50 rounded">Surprise</span>}
                                    </div>
                                );
                            })}
                        </div>
                        {/* Danger Zone */}
                        {g.danger.length > 0 && (
                            <div className="px-2 pb-2">
                                <div className="border-t border-slate-100 my-1"></div>
                                {g.danger.map((team: any) => {
                                    const tInfo = teams[team.teamId];
                                    return (
                                        <div key={team.teamId} onClick={() => onTeamClick(team.teamId)} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors">
                                            <div className="flex items-center gap-2 opacity-60">
                                                <div className="text-[10px] font-bold text-red-300 w-3">{team.rank || '-'}</div>
                                                <img src={tInfo?.flag} className="w-6 h-6 rounded-full object-cover grayscale" alt="" />
                                                <span className="text-xs font-bold text-slate-500">{tInfo?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[9px] font-bold text-red-400 uppercase">{team.isEliminated ? 'Eliminated' : 'At Risk'}</span>
                                                <AlertCircle size={12} className="text-red-400" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}

        {/* === KNOCKOUT STAGE VIEW === */}
        {activeStage !== 'GROUPS' && (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pulseData.knockoutData.map((m: any) => (
                        <div key={m.id} className={`relative p-3 rounded-xl border flex items-center justify-between transition-all ${m.status === 'SAFE' ? 'bg-green-50 border-green-200' : m.status === 'DEAD' ? 'bg-slate-100 border-slate-200 opacity-75' : 'bg-white border-amber-200'}`}>
                            {/* Match Info */}
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        <img src={m.home?.flag} className="w-6 h-6 rounded-full border border-white" alt="" />
                                        <img src={m.away?.flag} className="w-6 h-6 rounded-full border border-white" alt="" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{m.home?.name || 'TBD'} vs {m.away?.name || 'TBD'}</span>
                                </div>
                                <div className="text-[9px] font-medium text-slate-400 uppercase pl-1">
                                    Your Pick: <span className="text-slate-600 font-bold">{m.myPick || 'None'}</span>
                                </div>
                            </div>

                            {/* Status Icon */}
                            <div className="flex items-center gap-2">
                                {m.status === 'SAFE' && (
                                    <div className="bg-green-100 p-1.5 rounded-full">
                                        <Check size={16} className="text-green-600" />
                                    </div>
                                )}
                                {m.status === 'DANGER' && (
                                    <div className="bg-amber-100 p-1.5 rounded-full animate-pulse">
                                        <AlertTriangle size={16} className="text-amber-600" />
                                    </div>
                                )}
                                {m.status === 'DEAD' && (
                                    <div className="bg-slate-200 p-1.5 rounded-full">
                                        <X size={16} className="text-slate-500" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};