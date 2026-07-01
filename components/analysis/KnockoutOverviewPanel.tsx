import React, { useMemo } from 'react';
import { Match, Team, UserProfile } from '../../types';
import { QualifiedRound, SCORING_RULES } from '../../services/engine';

// All KO rounds in display order
const ROUND_DEFS = [
    { key: 'R16',      label: 'R16',     matchRound: 'R16',  pointsPerTeam: SCORING_RULES.R32 },
    { key: 'QF',       label: 'QF',      matchRound: 'QF',   pointsPerTeam: SCORING_RULES.R16 },
    { key: 'SF',       label: 'SF',      matchRound: 'SF',   pointsPerTeam: SCORING_RULES.QF  },
    { key: 'FIN',      label: 'Final',   matchRound: 'FIN',  pointsPerTeam: SCORING_RULES.SF  },
    { key: 'CHAMP',    label: 'Champ',   matchRound: 'FIN',  pointsPerTeam: SCORING_RULES.FIN },
];

interface Props {
    mySimQualRounds: QualifiedRound[];
    simulatedMatches: Match[];
    combinedStats: { user: UserProfile; score: number; rank: number; diff: number }[];
    currentUser: UserProfile;
    teams: Record<string, Team>;
}

export const KnockoutOverviewPanel: React.FC<Props> = ({
    mySimQualRounds,
    simulatedMatches,
    combinedStats,
    currentUser,
    teams,
}) => {
    const qualMap = useMemo(() => {
        const m = new Map<string, QualifiedRound>();
        mySimQualRounds.forEach(qr => m.set(qr.key, qr));
        return m;
    }, [mySimQualRounds]);

    // Is a given match-round fully finished?
    const isRoundComplete = (matchRound: string) =>
        simulatedMatches.some(m => m.round === matchRound) &&
        simulatedMatches.filter(m => m.round === matchRound).every(m => m.homeScore !== null);

    // Earned so far
    const earnedTotal = mySimQualRounds.reduce((s, r) => s + r.totalPoints, 0);

    // "Best case remaining" — for incomplete rounds, count how many of user's
    // predicted teams are still in the tournament × pointsPerTeam
    const eliminatedTeams = useMemo(() => {
        const out = new Set<string>();
        simulatedMatches.forEach(m => {
            if (m.round && m.homeScore !== null && m.awayScore !== null &&
                m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD') {
                const loser = m.homeScore > m.awayScore ? m.awayTeamId : m.homeTeamId;
                if (loser && loser !== 'TBD') out.add(loser);
            }
        });
        return out;
    }, [simulatedMatches]);

    // User's predicted teams per round (from their qualified rounds + pending picks)
    // We approximate "potential" per incomplete round as: correctTeams already + picks still alive
    const bestCaseRemaining = useMemo(() => {
        let total = 0;
        ROUND_DEFS.forEach(rd => {
            if (rd.key === 'CHAMP') {
                // Champion: if not yet confirmed and the predicted champion is still alive
                const champQR = qualMap.get('CHAMP');
                if (!champQR) {
                    // No correct champion yet — we can't easily compute "still alive" for CHAMP without
                    // knowing user's predicted champion explicitly. Skip for now (0 added).
                }
                return;
            }
            if (isRoundComplete(rd.matchRound)) return; // Round done — no more to gain
            const qr = qualMap.get(rd.key);
            const alreadyEarned = qr ? qr.correctTeams.length * qr.pointsPerTeam : 0;
            // Count how many of user's predicted teams for this round are still alive
            // "predicted teams for this round" = any team in simMatches for this round that the
            // user predicted correctly OR is currently not yet eliminated
            // Simplified: add potential based on remaining slots in the round
            // We use: (totalSlots - already correct) × pointsPerTeam as the rough ceiling
            const totalSlots = rd.key === 'R16' ? 16 : rd.key === 'QF' ? 8 : rd.key === 'SF' ? 4 : rd.key === 'FIN' ? 2 : 1;
            const remaining = (totalSlots - (qr?.correctTeams.length ?? 0)) * rd.pointsPerTeam;
            total += Math.max(0, remaining);
            void alreadyEarned; // suppress unused warning
        });
        return total;
    }, [qualMap, eliminatedTeams, simulatedMatches]);

    const myStats = combinedStats.find(s => s.user.email === currentUser.email);
    const leader = combinedStats[0];
    const gapToLeader = leader && myStats ? leader.score - myStats.score : 0;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-[#2e1065] px-4 py-2.5 flex items-center justify-between">
                <span className="text-[10px] font-black text-purple-200 uppercase tracking-widest">
                    Bracket Survival
                </span>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-purple-300">
                        {earnedTotal} pts earned
                    </span>
                    {bestCaseRemaining > 0 && (
                        <span className="text-[9px] font-black text-amber-300">
                            up to +{bestCaseRemaining} more
                        </span>
                    )}
                </div>
            </div>

            {/* Round rows */}
            <div className="divide-y divide-slate-50">
                {ROUND_DEFS.map(rd => {
                    const qr = qualMap.get(rd.key);
                    const roundDone = isRoundComplete(rd.matchRound);
                    const earned = qr ? qr.totalPoints : 0;
                    const ppt = qr ? qr.pointsPerTeam : rd.pointsPerTeam;
                    const isPenalty = qr?.penaltyApplied ?? false;

                    return (
                        <div key={rd.key} className="flex items-center gap-3 px-4 py-2.5">
                            {/* Round label */}
                            <div className="w-12 shrink-0">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    {rd.label}
                                </span>
                                <div className="text-[8px] text-slate-300 font-bold">
                                    +{ppt}pts{isPenalty && <span className="text-orange-400 ml-0.5">½</span>}
                                </div>
                            </div>

                            {/* Correct team flags */}
                            <div className="flex-1 flex items-center gap-1.5 flex-wrap min-w-0">
                                {qr && qr.correctTeams.length > 0 ? (
                                    qr.correctTeams.map(teamId => {
                                        const team = teams[teamId];
                                        return (
                                            <div key={teamId} className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg px-1.5 py-0.5">
                                                {team?.flag && (
                                                    <img src={team.flag} alt="" className="w-5 h-3.5 object-cover rounded shadow-sm" />
                                                )}
                                                <span className="text-[8px] font-black text-emerald-700 uppercase">
                                                    {team?.code || teamId}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <span className={`text-[8px] font-bold ${roundDone ? 'text-red-300' : 'text-slate-300'}`}>
                                        {roundDone ? '— none correct' : <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse inline-block" /> pending</span>}
                                    </span>
                                )}
                            </div>

                            {/* Points earned this round */}
                            <div className="shrink-0 text-right">
                                <span className={`text-xs font-black ${earned > 0 ? 'text-emerald-600' : roundDone ? 'text-red-300' : 'text-slate-300'}`}>
                                    {earned > 0 ? `+${earned}` : roundDone ? '0' : '–'}
                                </span>
                                <span className="text-[8px] text-slate-300 font-bold ml-0.5">pts</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer: catch-up */}
            {gapToLeader > 0 && leader && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                        Gap to #{leader.user.name.split(' ')[0]}
                    </span>
                    <span className={`text-[10px] font-black ${bestCaseRemaining >= gapToLeader ? 'text-emerald-600' : 'text-red-400'}`}>
                        -{gapToLeader} pts {bestCaseRemaining >= gapToLeader ? '✓ catchable' : ''}
                    </span>
                </div>
            )}
            {gapToLeader <= 0 && myStats && myStats.rank === 1 && (
                <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-100">
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">
                        🏆 You're leading!
                    </span>
                </div>
            )}
        </div>
    );
};
