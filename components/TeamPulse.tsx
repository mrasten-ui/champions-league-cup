import React, { useMemo, useState } from 'react';
import { Match, Team, Translation, Prediction, GroupStanding, Round } from '../types';
import { calculateGroupStandings, getThirdPlaceStandings } from '../services/engine';
import { GROUP_CONFIG } from '../constants';
import { AlertTriangle, Check, X, ArrowRight, ShieldAlert, TrendingUp, AlertCircle, HelpCircle, Trophy, Minus, Ghost } from 'lucide-react';

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
  const [showExplainer, setShowExplainer] = useState(false);

  // 1. Detect Active Stage
  const activeStage = useMemo(() => {
      const groupMatches = matches.filter(m => m.groupId);
      const groupsFinished = groupMatches.every(m => m.status === 'FINISHED' || m.status === 'FT');
      
      if (!groupsFinished) return 'GROUPS';

      const rounds: Round[] = ['R32', 'R16', 'QF', 'SF', 'FIN']; 
      for (const r of rounds) {
          const roundMatches = matches.filter(m => m.round === r);
          if (roundMatches.some(m => m.status !== 'FINISHED' && m.status !== 'FT')) return r;
      }
      return 'FIN';
  }, [matches]);

  // 2. Calculate All Data
  const pulseData = useMemo(() => {
      const data = {
          headline: { title: '', sub: '', color: '' },
          totalSafe: 0,
          totalDanger: 0,
          totalDead: 0,
          groupsData: [] as any[],
          thirdPlaceData: [] as any[],
          knockoutData: [] as any[]
      };

      // === GROUP STAGE LOGIC ===
      if (activeStage === 'GROUPS') {
          const allRealStandings: Record<string, GroupStanding[]> = {};
          
          GROUP_CONFIG.forEach(g => {
              const groupMatches = matches.filter(m => m.groupId === g.id);
              const realStandings = calculateGroupStandings(g.id, groupMatches, teams);
              allRealStandings[g.id] = realStandings;

              let myPicks: string[] = [];
              if (!hasTakenSecondChance) {
                  const userGroupPreds = userPredictions.filter(p => groupMatches.some(m => m.id === p.matchId));
                  const userStandings = calculateGroupStandings(g.id, 
                      groupMatches.map(m => {
                          const p = userGroupPreds.find(up => up.matchId === m.id);
                          return p ? { ...m, homeScore: p.home, awayScore: p.away } : m;
                      }), teams
                  );
                  myPicks = userStandings.slice(0, 2).map(s => s.teamId);
              }

              const rows = realStandings.map((s, idx) => {
                  const isMyPick = myPicks.includes(s.teamId);
                  const isTop2 = idx < 2;
                  
                  let status: 'SAFE' | 'SURPRISE' | 'DANGER' | 'NEUTRAL' = 'NEUTRAL';
                  
                  if (isTop2) {
                      if (isMyPick) { status = 'SAFE'; data.totalSafe++; }
                      else status = 'SURPRISE';
                  } else {
                      if (isMyPick) { status = 'DANGER'; data.totalDanger++; }
                      else status = 'NEUTRAL';
                  }

                  return { ...s, status, isMyPick };
              });

              data.groupsData.push({ id: g.id, rows });
          });

          const thirds = getThirdPlaceStandings(allRealStandings);
          let myThirds: string[] = [];
          if (!hasTakenSecondChance) {
               GROUP_CONFIG.forEach(g => {
                  const groupMatches = matches.filter(m => m.groupId === g.id);
                  const userGroupPreds = userPredictions.filter(p => groupMatches.some(m => m.id === p.matchId));
                  const userStandings = calculateGroupStandings(g.id, 
                      groupMatches.map(m => {
                          const p = userGroupPreds.find(up => up.matchId === m.id);
                          return p ? { ...m, homeScore: p.home, awayScore: p.away } : m;
                      }), teams
                  );
                  if (userStandings[2]) myThirds.push(userStandings[2].teamId);
               });
          }

          data.thirdPlaceData = thirds.map((t, idx) => {
              const isQualifying = idx < 8; 
              const isMyPick = myThirds.includes(t.teamId);
              
              let status: 'SAFE' | 'SURPRISE' | 'DANGER' | 'NEUTRAL' = 'NEUTRAL';
              if (isQualifying) {
                   if (isMyPick) status = 'SAFE';
                   else status = 'SURPRISE';
              } else {
                   if (isMyPick) status = 'DANGER';
              }

              return { ...t, status, isQualifying, rank: idx + 1 };
          });

          if (hasTakenSecondChance) data.headline = { title: "Second Chance Active", sub: "Tracking real qualified teams.", color: "text-blue-600" };
          else if (data.totalDanger > 8) data.headline = { title: "Bracket Critical", sub: "Majority of your picks are below the line.", color: "text-red-600" };
          else if (data.totalSafe > 16) data.headline = { title: "Solid Foundation", sub: "Most of your picks are safe.", color: "text-green-600" };
          else data.headline = { title: "Group Stage Pulse", sub: "Live qualification tracking.", color: "text-slate-700" };
      }
      
      // === KNOCKOUT LOGIC ===
      else {
          const roundMatches = matches.filter(m => m.round === activeStage);
          
          roundMatches.forEach(m => {
              const myPred = userPredictions.find(p => p.matchId === m.id);
              
              // Only process if we have a prediction OR if it's Second Chance
              // For basic Pulse, we simply check: Did the user predict the WINNER of this match ID?
              // (Note: In a pure bracket pool, users predict paths. Here we simplify to match IDs for MVP Pulse)
              
              let status: 'SAFE' | 'DANGER' | 'DEAD' = 'DANGER';
              let myPickName = "Unknown";

              // Detect what is happening in the real match
              const homeScore = m.homeScore;
              const awayScore = m.awayScore;
              const isFinished = ['FINISHED', 'FT', 'AET', 'PEN'].includes(m.status);
              const isLive = ['LIVE', '1H', '2H', 'HT'].includes(m.status);

              if (myPred) {
                  // User predicted Home or Away
                  const myPickIsHome = myPred.home > myPred.away;
                  myPickName = myPickIsHome ? (teams[m.homeTeamId]?.name || 'Home') : (teams[m.awayTeamId]?.name || 'Away');
                  
                  if (homeScore !== null && awayScore !== null) {
                      const homeLeading = homeScore > awayScore;
                      const awayLeading = awayScore > homeScore;
                      
                      if ((myPickIsHome && homeLeading) || (!myPickIsHome && awayLeading)) {
                          status = 'SAFE';
                          data.totalSafe++;
                      } else if ((myPickIsHome && awayLeading) || (!myPickIsHome && homeLeading)) {
                          if (isFinished) {
                              status = 'DEAD';
                              data.totalDead++;
                          } else {
                              status = 'DANGER';
                              data.totalDanger++;
                          }
                      } else {
                          // Draw
                          status = 'DANGER';
                      }
                  } else {
                      // Match hasn't started yet
                      status = 'SAFE'; // Assume safe until proven otherwise
                  }
              } else {
                  // No prediction found (maybe TBD match?)
                  status = 'DEAD'; 
                  data.totalDead++;
                  myPickName = "None";
              }

              data.knockoutData.push({
                  id: m.id,
                  home: teams[m.homeTeamId],
                  away: teams[m.awayTeamId],
                  status: status,
                  myPick: myPickName,
                  score: (homeScore !== null && awayScore !== null) ? `${homeScore}-${awayScore}` : 'vs'
              });
          });

          // Knockout Headlines
          const stageName = activeStage === 'R32' ? "Round of 32" : activeStage === 'R16' ? "Round of 16" : activeStage;
          if (data.totalDead > 0) data.headline = { title: "Survival Mode", sub: `${data.totalDead} picks eliminated this round.`, color: "text-red-600" };
          else if (data.totalDanger > 0) data.headline = { title: "Under Pressure", sub: `${data.totalDanger} picks currently trailing.`, color: "text-amber-600" };
          else data.headline = { title: `${stageName} Pulse`, sub: "All picks currently safe.", color: "text-green-600" };
      }

      return data;
  }, [matches, teams, userPredictions, activeStage, hasTakenSecondChance]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
        
        {/* HERO HEADER */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <TrendingUp size={100} />
            </div>
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-slate-900 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                                {activeStage === 'GROUPS' ? 'Group Stage' : activeStage}
                            </span>
                        </div>
                        <h2 className={`text-2xl font-black uppercase tracking-tighter ${pulseData.headline.color}`}>{pulseData.headline.title}</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">{pulseData.headline.sub}</p>
                    </div>
                    <button onClick={() => setShowExplainer(!showExplainer)} className="text-slate-400 hover:text-blue-600 transition-colors">
                        <HelpCircle size={20} />
                    </button>
                </div>

                {/* Explainer Legend */}
                {showExplainer && (
                    <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wide animate-in fade-in">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-slate-600">Your Pick & Winning/Safe</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-slate-600">Your Pick & Failing</span>
                        </div>
                        {activeStage === 'GROUPS' ? (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <span className="text-slate-600">Surprise (Didn't Pick)</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                <span className="text-slate-600">Dead Pick (Eliminated)</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {activeStage === 'GROUPS' ? (
            <>
                {/* 3RD PLACE TABLE */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-indigo-900 p-3 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <Trophy size={14} className="text-yellow-400" />
                            <span className="text-xs font-black uppercase tracking-widest">3rd Place Survival</span>
                        </div>
                        <span className="text-[9px] font-bold bg-white/10 px-2 py-0.5 rounded">Top 8 Advance</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[10px]">
                            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                                <tr>
                                    <th className="px-3 py-2">Rk</th>
                                    <th className="px-2 py-2">Team</th>
                                    <th className="px-2 py-2 text-center">Grp</th>
                                    <th className="px-2 py-2 text-center">Pts</th>
                                    <th className="px-2 py-2 text-center">GD</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {pulseData.thirdPlaceData.map((row, idx) => {
                                    const team = teams[row.teamId];
                                    let rowClass = '';
                                    if (row.status === 'SAFE') rowClass = 'bg-green-50/50 text-green-800 font-bold';
                                    if (row.status === 'DANGER') rowClass = 'bg-red-50/50 text-red-800 font-bold';
                                    if (row.status === 'SURPRISE') rowClass = 'bg-amber-50/30 text-slate-800';

                                    return (
                                        <React.Fragment key={row.teamId}>
                                            {idx === 8 && (
                                                <tr>
                                                    <td colSpan={5} className="bg-slate-100 border-y-2 border-dashed border-red-200 py-1 text-center">
                                                        <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Elimination Zone</span>
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className={rowClass}>
                                                <td className="px-3 py-2 font-mono text-slate-400">{idx + 1}</td>
                                                <td className="px-2 py-2 flex items-center gap-2">
                                                    <img src={team.flag} className="w-4 h-4 rounded-full object-cover" />
                                                    <span className="truncate max-w-[80px] sm:max-w-none">{team.name}</span>
                                                    {row.status === 'SAFE' && <Check size={10} className="text-green-500" />}
                                                    {row.status === 'DANGER' && <AlertCircle size={10} className="text-red-500" />}
                                                </td>
                                                <td className="px-2 py-2 text-center text-slate-400 font-bold">{row.groupId}</td>
                                                <td className="px-2 py-2 text-center font-bold">{row.pts}</td>
                                                <td className="px-2 py-2 text-center text-slate-500">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ALL GROUP TABLES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pulseData.groupsData.map(g => (
                        <div key={g.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{lang.group || 'Group'} {g.id}</span>
                            </div>
                            <div className="p-2 space-y-1">
                                {g.rows.map((row: any, idx: number) => {
                                    const team = teams[row.teamId];
                                    const isTop2 = idx < 2;
                                    let bgClass = 'bg-white border-transparent';
                                    let textClass = 'text-slate-500';
                                    let icon = null;

                                    if (row.status === 'SAFE') {
                                        bgClass = 'bg-green-50 border-green-200 shadow-sm';
                                        textClass = 'text-slate-800 font-bold';
                                        icon = <Check size={12} className="text-green-500" />;
                                    } else if (row.status === 'SURPRISE') {
                                        bgClass = 'bg-amber-50/50 border-amber-200 border-dashed';
                                        textClass = 'text-slate-800';
                                        icon = <span className="text-[8px] font-black text-amber-500 uppercase">Surprise</span>;
                                    } else if (row.status === 'DANGER') {
                                        bgClass = 'bg-red-50 border-red-100 opacity-80';
                                        textClass = 'text-red-700 font-medium line-through decoration-red-300';
                                        icon = <X size={12} className="text-red-400" />;
                                    }

                                    return (
                                        <div key={row.teamId} onClick={() => onTeamClick(row.teamId)} className={`flex items-center justify-between p-1.5 rounded-lg border ${bgClass} cursor-pointer hover:brightness-95 transition-all`}>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-mono w-3 ${isTop2 ? 'text-slate-800 font-bold' : 'text-slate-300'}`}>{idx + 1}</span>
                                                <img src={team.flag} className="w-5 h-5 rounded-full object-cover shadow-sm" />
                                                <span className={`text-xs truncate ${textClass}`}>{team.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-600">{row.pts} <span className="text-[8px] text-slate-300 font-normal">PTS</span></span>
                                                <div className="w-4 flex justify-end">{icon}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </>
        ) : (
            // KNOCKOUT PULSE VIEW
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pulseData.knockoutData.map((m: any) => (
                        <div key={m.id} className={`relative p-3 rounded-xl border flex items-center justify-between transition-all ${m.status === 'SAFE' ? 'bg-green-50 border-green-200' : m.status === 'DEAD' ? 'bg-slate-100 border-slate-200 opacity-75 grayscale' : 'bg-white border-amber-200'}`}>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        <img src={m.home?.flag} className="w-6 h-6 rounded-full border border-white bg-slate-100" />
                                        <img src={m.away?.flag} className="w-6 h-6 rounded-full border border-white bg-slate-100" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{m.home?.name || 'TBD'} vs {m.away?.name || 'TBD'}</span>
                                </div>
                                <div className="text-[9px] font-medium text-slate-400 uppercase pl-1 flex items-center gap-1">
                                    You Picked: <span className={`font-bold ${m.status === 'SAFE' ? 'text-green-600' : m.status === 'DEAD' ? 'text-slate-500 line-through' : 'text-amber-600'}`}>{m.myPick}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {m.status === 'SAFE' && <div className="bg-green-100 p-1.5 rounded-full"><Check size={16} className="text-green-600" /></div>}
                                {m.status === 'DANGER' && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-amber-500">{m.score}</span>
                                        <div className="bg-amber-100 p-1.5 rounded-full animate-pulse"><AlertTriangle size={16} className="text-amber-600" /></div>
                                    </div>
                                )}
                                {m.status === 'DEAD' && <div className="bg-slate-200 p-1.5 rounded-full"><Ghost size={16} className="text-slate-500" /></div>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};