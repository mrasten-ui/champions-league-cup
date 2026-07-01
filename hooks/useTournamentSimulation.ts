import { useState, useMemo } from 'react';
import { Match, Prediction, UserProfile, Team } from '../types';
import { applyPredictionsToBracket, calculatePoints, getAllGroupStandings, getQualifiedRounds, getThirdPlaceStandings, updateBracket } from '../services/engine';
import type { QualifiedRound } from '../services/engine';

export const useTournamentSimulation = (
    matches: Match[],
    allPredictions: Prediction[],
    teams: Record<string, Team>,
    allUsers: UserProfile[]
) => {
    const [simulation, setSimulation] = useState<Record<string, { home: number, away: number }>>({});

    // 1. CALCULATE USER BRACKET PATHS
    const userBracketData = useMemo(() => {
        const map = new Map<string, Record<string, { home: string, away: string, winner: string }>>();
        allUsers.forEach(u => {
            const userPreds = allPredictions.filter(p => p.userId === u.email);
            const userMatches = applyPredictionsToBracket(matches, teams, userPreds);
            const matchData: Record<string, { home: string, away: string, winner: string }> = {};
            
            userMatches.forEach(m => {
                if (m.homeScore !== null && m.awayScore !== null) {
                    matchData[m.id] = {
                        home: m.homeTeamId,
                        away: m.awayTeamId,
                        winner: m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId
                    };
                }
            });
            map.set(u.email, matchData);
        });
        return map;
    }, [allUsers, matches, teams, allPredictions]);

    // 2. SIMULATION ENGINE + PULL THROUGH
    const { combinedStats, simulatedMatches, qualifiedThirdsSet } = useMemo(() => {
        // Create a "Simulated World" array of matches
        let simMatches = matches.map(m => {
            const sim = simulation[m.id];
            if (sim) return { ...m, homeScore: sim.home, awayScore: sim.away, status: 'FINISHED' as Match['status'] };
            return m;
        });

        // PULL THROUGH: Run bracket logic multiple times to propagate results
        for (let i = 0; i < 6; i++) {
            simMatches = updateBracket(simMatches, teams);
        }

        const livePoints: Record<string, number> = {};
        const simPoints: Record<string, number> = {};
        allUsers.forEach(u => { livePoints[u.email] = 0; simPoints[u.email] = 0; });

        simMatches.forEach(m => {
            const hasRealScore = matches.find(rm => rm.id === m.id)?.homeScore !== null;
            const hasSimScore = m.homeScore !== null && m.homeScore !== undefined;

            allUsers.forEach(u => {
                const pred = allPredictions.find(p => p.userId === u.email && p.matchId === m.id);
                if (pred) {
                    if (hasRealScore) livePoints[u.email] += calculatePoints(pred.home, pred.away, m.homeScore, m.awayScore, u.hasTakenSecondChance, m.round);
                    if (hasSimScore) simPoints[u.email] += calculatePoints(pred.home, pred.away, m.homeScore, m.awayScore, u.hasTakenSecondChance, m.round);
                }
            });
        });

        // Add bracket advancement points BEFORE sorting (calculatePoints returns 0 for KO matches)
        allUsers.forEach(u => {
            const userPreds = allPredictions.filter(p => p.userId === u.email);
            const liveQR = getQualifiedRounds(matches, userPreds, u, teams);
            livePoints[u.email] += liveQR.reduce((s, r) => s + r.totalPoints, 0);
            const simQR = getQualifiedRounds(simMatches, userPreds, u, teams);
            simPoints[u.email] += simQR.reduce((s, r) => s + r.totalPoints, 0);
        });

        const sortUsers = (pointsMap: Record<string, number>) =>
            [...allUsers].sort((a,b) => pointsMap[b.email] - pointsMap[a.email]);

        const liveRanked = sortUsers(livePoints);
        const simRanked = sortUsers(simPoints);

        const combinedStats = simRanked.map((u, idx) => {
            const liveRank = liveRanked.findIndex(lr => lr.email === u.email) + 1;
            const simRank = idx + 1;
            return {
                user: u,
                score: simPoints[u.email],
                rank: simRank,
                diff: liveRank - simRank
            };
        });

        const allGroupStandings = getAllGroupStandings(simMatches, teams);
        const thirds = getThirdPlaceStandings(allGroupStandings);
        const qualifiedThirdsSet = new Set(thirds.slice(0, 8).map(t => t.teamId));

        return { combinedStats, simulatedMatches: simMatches, qualifiedThirdsSet };
    }, [matches, simulation, allPredictions, allUsers, teams]);

    const mySimQualRounds = useMemo((): QualifiedRound[] => {
        const me = allUsers[0];
        if (!me) return [];
        const myPreds = allPredictions.filter(p => p.userId === me.email);
        return getQualifiedRounds(simulatedMatches, myPreds, me, teams);
    }, [simulatedMatches, allPredictions, allUsers, teams]);

    const updateSim = (matchId: string, h: number, a: number) => {
        setSimulation(prev => ({ ...prev, [matchId]: { home: h, away: a } }));
    };

    const resetSim = () => setSimulation({});

    return {
        simulation,
        updateSim,
        resetSim,
        combinedStats,
        simulatedMatches,
        qualifiedThirdsSet,
        userBracketData,
        mySimQualRounds
    };
};