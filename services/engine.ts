
import { Match, Team, GroupStanding, Round, Prediction, UserProfile, Translation, HeadToHeadStats, HistoricalMatch, MatchHistoryItem, ScoutingData, LanguageCode } from '../types';
import { GROUP_CONFIG } from '../constants';
import { supabase } from '../supabase';
import { getScoutingReport } from '../scoutingData'; // Import to access local data for seeding

export const SCORING_RULES = {
  GROUP_EXACT: 5,
  GROUP_RESULT: 3,
  R32: 8,
  R16: 12,
  QF: 16,
  SF: 24,
  FIN: 40,
  '3RD': 12
};

export const calculatePoints = (
  predHome: number, 
  predAway: number, 
  actualHome: number | null, 
  actualAway: number | null, 
  userHasPenalty: boolean = false, 
  round?: Round
): number => {
  if (actualHome === null || actualAway === null) return 0;

  let basePoints = 0;

  if (round) {
    const predWinner = predHome > predAway ? 'HOME' : predHome < predAway ? 'AWAY' : 'DRAW';
    const actualWinner = actualHome > actualAway ? 'HOME' : actualHome < actualAway ? 'AWAY' : 'DRAW';
    
    if (predWinner === actualWinner && predWinner !== 'DRAW') {
       switch(round) {
           case 'R32': basePoints = SCORING_RULES.R32; break;
           case 'R16': basePoints = SCORING_RULES.R16; break;
           case 'QF': basePoints = SCORING_RULES.QF; break;
           case 'SF': basePoints = SCORING_RULES.SF; break;
           case 'FIN': basePoints = SCORING_RULES.FIN; break;
           case '3RD': basePoints = SCORING_RULES['3RD']; break;
           default: basePoints = 5;
       }
    }
  } 
  else {
    if (predHome === actualHome && predAway === actualAway) {
        basePoints = SCORING_RULES.GROUP_EXACT;
    } else {
        const predRes = predHome > predAway ? 'HOME' : predHome < predAway ? 'AWAY' : 'DRAW';
        const actualRes = actualHome > actualAway ? 'HOME' : actualHome < actualAway ? 'AWAY' : 'DRAW';
        if (predRes === actualRes) basePoints = SCORING_RULES.GROUP_RESULT;
    }
  }

  // Update: Penalty applies from R32 matches onwards (determining R16 qualifiers)
  const penaltyRounds: Round[] = ['R32', 'R16', 'QF', 'SF', 'FIN', '3RD'];
  let finalMultiplier = 1.0;
  if (userHasPenalty && round && penaltyRounds.includes(round)) {
    finalMultiplier = 0.5;
  }

  return Math.floor(basePoints * finalMultiplier);
};

export const calculateMaxPotentialPoints = (matches: Match[], predictions: Prediction[], user: UserProfile): number => {
    let total = 0;
    matches.forEach(m => {
        const pred = predictions.find(p => p.matchId === m.id);
        if (!pred) return;

        const isFinishedOrLive = ['FINISHED', 'FT', 'AET', 'PEN', 'LIVE', '1H', '2H', 'HT'].includes(m.status);

        if (isFinishedOrLive && m.homeScore !== null && m.awayScore !== null) {
            total += calculatePoints(pred.home, pred.away, m.homeScore, m.awayScore, !!user.hasTakenSecondChance, m.round);
        } else {
            if (m.round) {
                 const baseVal = (SCORING_RULES as any)[m.round] || 5;
                 const penaltyRounds: Round[] = ['R32', 'R16', 'QF', 'SF', 'FIN', '3RD'];
                 const mult = (user.hasTakenSecondChance && penaltyRounds.includes(m.round)) ? 0.5 : 1.0;
                 total += Math.floor(baseVal * mult);
            } else {
                total += 5; // Max possible for groups
            }
        }
    });
    return total;
};

export const getManagerStats = (
  user: UserProfile,
  matches: Match[],
  allPredictions: Prediction[]
) => {
  const finishedMatches = matches
    .filter(m => ['FINISHED', 'FT', 'AET', 'PEN'].includes(m.status))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 

  const form: number[] = [];
  let streak = 0;
  let currentStreakAlive = true;

  finishedMatches.forEach(m => {
    const pred = allPredictions.find(p => p.userId === user.email && p.matchId === m.id);
    if (!pred || m.homeScore === null || m.awayScore === null) {
      if (currentStreakAlive) currentStreakAlive = false;
      return;
    }

    const pts = calculatePoints(pred.home, pred.away, m.homeScore, m.awayScore, !!user.hasTakenSecondChance, m.round);
    
    if (form.length < 5) form.push(pts);

    if (currentStreakAlive) {
      if (pts > 0) streak++;
      else currentStreakAlive = false;
    }
  });

  return { form: form.reverse(), streak };
};

export const calculateGroupStandings = (groupId: string, matches: Match[], teams: Record<string, Team>): GroupStanding[] => {
  const groupMatches = matches.filter(m => m.groupId === groupId);
  const standingsMap: Record<string, GroupStanding> = {};
  const groupConfig = GROUP_CONFIG.find((g: any) => g.id === groupId);
  
  if (groupConfig) {
      groupConfig.teams.forEach((tId: string) => {
        standingsMap[tId] = { teamId: tId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
      });
  }

  groupMatches.forEach(match => {
    if (match.homeScore !== null && match.awayScore !== null) {
      const home = standingsMap[match.homeTeamId];
      const away = standingsMap[match.awayTeamId];
      
      if (!home || !away) return;

      const hScore = Number(match.homeScore);
      const aScore = Number(match.awayScore);

      home.played += 1;
      away.played += 1;
      home.gf += hScore;
      home.ga += aScore;
      away.gf += aScore;
      away.ga += hScore;
      
      home.gd = home.gf - home.ga;
      away.gd = away.gf - away.ga;

      if (hScore > aScore) {
        home.won += 1;
        home.pts += 3;
        away.lost += 1;
      } else if (aScore > hScore) {
        away.won += 1;
        away.pts += 3;
        home.lost += 1;
      } else {
        home.drawn += 1;
        home.pts += 1;
        away.drawn += 1;
        away.pts += 1;
      }
    }
  });

  return Object.values(standingsMap).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
};

export const getAllGroupStandings = (matches: Match[], teams: Record<string, Team>) => {
  const results: Record<string, GroupStanding[]> = {};
  GROUP_CONFIG.forEach((g: any) => {
      results[g.id] = calculateGroupStandings(g.id, matches, teams);
  });
  return results;
};

export const getThirdPlaceStandings = (allStandings: Record<string, GroupStanding[]>) => {
  const thirds: (GroupStanding & { groupId: string })[] = [];
  Object.entries(allStandings).forEach(([gid, standings]) => {
      if (standings[2]) {
          thirds.push({ ...standings[2], groupId: gid });
      }
  });
  
  return thirds.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
  });
};

export const updateBracket = (matches: Match[], teams: Record<string, Team>): Match[] => {
    const groupResults = getAllGroupStandings(matches, teams);
    const getTeam = (gid: string, rank: number) => groupResults[gid]?.[rank - 1]?.teamId || 'TBD';
    
    const thirds = getThirdPlaceStandings(groupResults);
    const qualifiedThirds = thirds.slice(0, 8);
    const usedThirds = new Set<string>();
    
    const get3rd = (allowedGroups: string[]) => {
        let candidate = qualifiedThirds.find(t => allowedGroups.includes(t.groupId) && !usedThirds.has(t.teamId));
        if (!candidate) {
             candidate = qualifiedThirds.find(t => !usedThirds.has(t.teamId));
        }
        if (candidate) {
            usedThirds.add(candidate.teamId);
            return candidate.teamId;
        }
        return 'TBD';
    };

    const nextMatches = matches.map(m => ({ ...m }));

    const setMatchup = (matchId: string, home: string, away: string) => {
        const match = nextMatches.find(m => m.id === matchId);
        if (!match) return;

        const oldHome = match.homeTeamId;
        const oldAway = match.awayTeamId;
        let changed = false;

        if (oldHome !== home) { match.homeTeamId = home; changed = true; }
        if (oldAway !== away) { match.awayTeamId = away; changed = true; }

        if (changed) {
            if (!match.isLocked) {
                match.homeScore = null;
                match.awayScore = null;
            }
        }
    };

    setMatchup('R32_1', getTeam('A', 2), getTeam('B', 2));
    setMatchup('R32_2', getTeam('E', 1), get3rd(['A', 'B', 'C', 'D', 'F']));
    setMatchup('R32_3', getTeam('F', 1), getTeam('C', 2));
    setMatchup('R32_4', getTeam('C', 1), getTeam('F', 2));
    setMatchup('R32_5', getTeam('I', 1), get3rd(['C', 'D', 'F', 'G', 'H']));
    setMatchup('R32_6', getTeam('E', 2), getTeam('I', 2));
    setMatchup('R32_7', getTeam('A', 1), get3rd(['C', 'E', 'F', 'H', 'I']));
    setMatchup('R32_8', getTeam('L', 1), get3rd(['E', 'H', 'I', 'J', 'K']));
    setMatchup('R32_9', getTeam('D', 1), get3rd(['B', 'E', 'F', 'I', 'J']));
    setMatchup('R32_10', getTeam('G', 1), get3rd(['A', 'E', 'H', 'I', 'J']));
    setMatchup('R32_11', getTeam('K', 2), getTeam('L', 2));
    setMatchup('R32_12', getTeam('H', 1), getTeam('J', 2));
    setMatchup('R32_13', getTeam('B', 1), get3rd(['E', 'F', 'G', 'I', 'J']));
    setMatchup('R32_14', getTeam('J', 1), getTeam('H', 2));
    setMatchup('R32_15', getTeam('K', 1), get3rd(['D', 'E', 'I', 'J', 'L']));
    setMatchup('R32_16', getTeam('D', 2), getTeam('G', 2));

    const rounds: Round[] = ['R32', 'R16', 'QF', 'SF'];
    
    rounds.forEach(round => {
        const roundMatches = nextMatches.filter(m => m.round === round);
        
        roundMatches.forEach(match => {
            if (!match.nextMatchId) return;

            let winnerId = 'TBD';
            let loserId = 'TBD';
            
            if (match.homeScore !== null && match.awayScore !== null) {
                if (match.homeTeamId !== 'TBD' && match.awayTeamId !== 'TBD') {
                    if (match.homeScore > match.awayScore) {
                        winnerId = match.homeTeamId;
                        loserId = match.awayTeamId;
                    } else {
                        winnerId = match.awayTeamId;
                        loserId = match.homeTeamId;
                    }
                }
            }

            const nextMatch = nextMatches.find(m => m.id === match.nextMatchId);
            if (nextMatch) {
                const currentIdNum = parseInt(match.id.split('_')[1] || '0');
                const isOdd = currentIdNum % 2 !== 0;

                if (isOdd) {
                    if (nextMatch.homeTeamId !== winnerId) {
                        nextMatch.homeTeamId = winnerId;
                        if (!nextMatch.isLocked) nextMatch.homeScore = null;
                    }
                } else {
                    if (nextMatch.awayTeamId !== winnerId) {
                        nextMatch.awayTeamId = winnerId;
                        if (!nextMatch.isLocked) nextMatch.awayScore = null;
                    }
                }
            }

            if (round === 'SF') {
                const thirdPlaceMatch = nextMatches.find(m => m.round === '3RD');
                if (thirdPlaceMatch) {
                    const currentIdNum = parseInt(match.id.split('_')[1] || '0');
                    if (currentIdNum === 1) { 
                        if (thirdPlaceMatch.homeTeamId !== loserId) {
                            thirdPlaceMatch.homeTeamId = loserId;
                            if (!thirdPlaceMatch.isLocked) thirdPlaceMatch.homeScore = null;
                        }
                    } else { 
                        if (thirdPlaceMatch.awayTeamId !== loserId) {
                            thirdPlaceMatch.awayTeamId = loserId;
                            if (!thirdPlaceMatch.isLocked) thirdPlaceMatch.awayScore = null;
                        }
                    }
                }
            }
        });
    });

    return nextMatches;
};

export const applyPredictionsToBracket = (
    initialMatches: Match[], 
    teams: Record<string, Team>,
    userPredictions: Prediction[]
): Match[] => {
    let currentMatches = updateBracket([...initialMatches], teams);
    const predsMap = new Map(userPredictions.map(p => [p.matchId, p]));

    for (let i = 0; i < 7; i++) {
        let hasChanges = false;
        currentMatches = currentMatches.map(m => {
            const pred = predsMap.get(m.id);
            if (pred && !m.isLocked) {
                if (m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD') {
                     if (m.homeScore !== pred.home || m.awayScore !== pred.away) {
                         hasChanges = true;
                         return { ...m, homeScore: pred.home, awayScore: pred.away };
                     }
                }
            }
            return m;
        });
        const nextState = updateBracket(currentMatches, teams);
        currentMatches = nextState;
    }
    return currentMatches;
};

export const generateMagicScores = (matches: Match[], teams: Record<string, Team>, favorites: string[]): Match[] => {
  return matches.map(match => {
    if (match.homeTeamId === 'TBD' || match.awayTeamId === 'TBD') return match;

    const homeTeam = teams[match.homeTeamId];
    const awayTeam = teams[match.awayTeamId];
    
    if (!homeTeam || !awayTeam) return match;
    
    const diff = (homeTeam.rating - awayTeam.rating) / 18; 
    let hAdv = favorites.includes(homeTeam.id) ? 1.0 : 0;
    let aAdv = favorites.includes(awayTeam.id) ? 1.0 : 0;
    const baseGoals = 0.5 + (Math.random() * 3.0); 

    let hS = Math.max(0, baseGoals + diff + hAdv);
    let aS = Math.max(0, baseGoals - diff + aAdv);

    hS += (Math.random() * 4.0) - 2.0;
    aS += (Math.random() * 4.0) - 2.0;

    let finalHome = Math.round(Math.max(0, hS));
    let finalAway = Math.round(Math.max(0, aS));
    
    finalHome = Math.min(finalHome, 9);
    finalAway = Math.min(finalAway, 9);
    
    if (!match.groupId && finalHome === finalAway) { 
        const hWeight = homeTeam.rating + (favorites.includes(homeTeam.id) ? 25 : 0) + (Math.random() * 50);
        const aWeight = awayTeam.rating + (favorites.includes(awayTeam.id) ? 25 : 0) + (Math.random() * 50);
        
        if (hWeight > aWeight) finalHome++;
        else finalAway++;
    }
    
    return { ...match, homeScore: finalHome, awayScore: finalAway };
  });
};

export const simulateFullTournament = (
    initialMatches: Match[], 
    teams: Record<string, Team>, 
    favorites: string[],
    scope: 'GROUPS' | 'KNOCKOUT' | 'ALL' = 'ALL'
): Match[] => {
    let currentMatches = initialMatches.map(m => ({ ...m }));

    currentMatches = currentMatches.map((m: Match) => {
        if (m.isLocked) return m; 

        const inScope = (scope === 'GROUPS' && m.groupId) || 
                        (scope === 'KNOCKOUT' && !m.groupId) ||
                        (scope === 'ALL');
                        
        if (inScope) {
             return { ...m, homeScore: null, awayScore: null };
        }
        return m;
    });
    
    currentMatches = updateBracket(currentMatches, teams);

    for (let i = 0; i < 7; i++) {
        const matchesToPredict = currentMatches.filter((m: Match) => {
            if (m.homeScore !== null && m.awayScore !== null) return false;
            if (m.homeTeamId === 'TBD' || m.awayTeamId === 'TBD') return false;
            if (scope === 'GROUPS' && !m.groupId) return false;
            if (scope === 'KNOCKOUT' && m.groupId) return false;
            return true;
        });

        if (matchesToPredict.length === 0) break;

        const predictedMatches = generateMagicScores(matchesToPredict, teams, favorites);
        
        currentMatches = currentMatches.map(m => {
            const pred = predictedMatches.find(pm => pm.id === m.id);
            return pred || m;
        });
        
        currentMatches = updateBracket(currentMatches, teams);
    }
    return currentMatches;
};

export const simulateTournamentAtDate = (
    currentMatches: Match[], 
    teams: Record<string, Team>,
    targetTimestamp: number
): Match[] => {
    let simMatches = currentMatches.map((m: Match) => {
        if (m.status === 'UPCOMING' || m.status === 'NS') {
            return { ...m, homeScore: null, awayScore: null };
        }
        return { ...m };
    });

    const getMatchTime = (dateStr: string) => {
        try {
            const parts = dateStr.split(',').map(s => s.trim());
            const datePart = parts[0]; 
            const year = parts[1] || '2026';
            const timePart = parts[2] || '12:00';
            const [monthStr, dayStr] = datePart.split(' ');
            const monthMap: Record<string, number> = { 'June': 5, 'July': 6, 'August': 7 };
            return new Date(Date.UTC(parseInt(year), monthMap[monthStr] || 5, parseInt(dayStr), parseInt(timePart.split(':')[0]), 0)).getTime();
        } catch(e) { return 0; }
    };

    for (let i = 0; i < 8; i++) {
        let changesMade = false;
        simMatches = updateBracket(simMatches, teams);
        const magicMatches = generateMagicScores(simMatches, teams, []); 
        const magicMap = new Map(magicMatches.map(m => [m.id, m]));

        simMatches = simMatches.map((m: Match) => {
            const mTime = getMatchTime(m.date);
            const magicM = magicMap.get(m.id);
            const isReady = m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD';

            if (mTime <= targetTimestamp) {
                if (isReady && m.status !== 'FINISHED' && m.status !== 'FT') {
                    if (magicM) {
                        changesMade = true;
                        return { 
                            ...m, 
                            homeScore: magicM.homeScore, 
                            awayScore: magicM.awayScore, 
                            status: 'FINISHED',
                            isLocked: true 
                        };
                    }
                }
            } else {
                if (m.homeScore !== null || m.awayScore !== null || m.status === 'FINISHED' || m.status === 'FT') {
                    changesMade = true;
                    return { 
                        ...m, 
                        homeScore: null, 
                        awayScore: null, 
                        status: 'UPCOMING',
                        isLocked: false 
                    };
                }
            }
            return m;
        });

        if (!changesMade) break;
    }

    return simMatches;
};

export const generateWhatIfAnalysis = (
    match: Match, 
    userPred: Prediction, 
    userProfile: UserProfile,
    rivals: UserProfile[],
    allPredictions: Prediction[],
    lang: Translation
): string => {
    if (match.homeScore === null || match.awayScore === null) return lang.analysisWaiting;
    const currentPts = calculatePoints(userPred.home, userPred.away, match.homeScore, match.awayScore, !!userProfile.hasTakenSecondChance, match.round);
    if (match.round) {
        if (currentPts > 0) return lang.analysisCorrectWinner;
        return lang.analysisIncorrectWinner;
    }
    if (currentPts === 5) return lang.analysisExact;
    return lang.analysisResult;
};

export const getLiveScenarios = (
  match: Match,
  userPred: Prediction,
  user: UserProfile
): { current: number; ifHome: number; ifAway: number } => {
  if (match.homeScore === null || match.awayScore === null) return { current: 0, ifHome: 0, ifAway: 0 };
  const current = calculatePoints(userPred.home, userPred.away, match.homeScore, match.awayScore, !!user.hasTakenSecondChance, match.round);
  const ifHome = calculatePoints(userPred.home, userPred.away, match.homeScore + 1, match.awayScore, !!user.hasTakenSecondChance, match.round);
  const ifAway = calculatePoints(userPred.home, userPred.away, match.homeScore, match.awayScore + 1, !!user.hasTakenSecondChance, match.round);
  return { current, ifHome, ifAway };
};

export const fetchHeadToHeadStats = async (homeTeam: Team, awayTeam: Team): Promise<HeadToHeadStats> => {
    const emptyStats: HeadToHeadStats = {
        totalMatches: 0,
        homeWins: 0,
        awayWins: 0,
        draws: 0,
        last5: []
    };

    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('head_to_head')
                .select('*')
                .in('team_a', [homeTeam.id, awayTeam.id])
                .in('team_b', [homeTeam.id, awayTeam.id])
                .order('year', { ascending: false });

            if (error) {
                console.warn("Supabase H2H Fetch Error:", error.message);
                return emptyStats;
            } else if (data && data.length > 0) {
                const relevantMatches = data.filter(m => 
                    (m.team_a === homeTeam.id && m.team_b === awayTeam.id) ||
                    (m.team_a === awayTeam.id && m.team_b === homeTeam.id)
                );

                if (relevantMatches.length > 0) {
                    let homeWins = 0;
                    let awayWins = 0;
                    let draws = 0;
                    const history: HistoricalMatch[] = [];

                    relevantMatches.forEach(match => {
                        const isHomeTeamA = match.team_a === homeTeam.id;
                        const homeScore = isHomeTeamA ? match.score_a : match.score_b;
                        const awayScore = isHomeTeamA ? match.score_b : match.score_a;
                        
                        let winnerId: string | 'DRAW' = 'DRAW';
                        if (homeScore > awayScore) {
                            winnerId = homeTeam.id;
                            homeWins++;
                        } else if (awayScore > homeScore) {
                            winnerId = awayTeam.id;
                            awayWins++;
                        } else {
                            draws++;
                        }

                        history.push({
                            year: match.year,
                            homeTeamId: homeTeam.id, 
                            awayTeamId: awayTeam.id,
                            homeScore: homeScore,
                            awayScore: awayScore,
                            winnerId: winnerId
                        });
                    });

                    return {
                        totalMatches: relevantMatches.length,
                        homeWins,
                        awayWins,
                        draws,
                        last5: history.slice(0, 5)
                    };
                }
            }
        } catch (err) {
            console.warn("Error fetching real history", err);
        }
    }

    return emptyStats;
};

export const fetchTeamHistory = async (teamId: string): Promise<MatchHistoryItem[]> => {
  if (supabase) {
      try {
        const { data, error } = await supabase
          .from('head_to_head')
          .select('*')
          .or(`team_a.eq.${teamId},team_b.eq.${teamId}`)
          .order('year', { ascending: false })
          .limit(10);

        if (data && data.length > 0) {
            return data.map(m => {
                const isHome = m.team_a === teamId;
                const opponentId = isHome ? m.team_b : m.team_a;
                const myScore = isHome ? m.score_a : m.score_b;
                const opScore = isHome ? m.score_b : m.score_a;
                
                let result: 'W' | 'D' | 'L' = 'D';
                if (myScore > opScore) result = 'W';
                if (myScore < opScore) result = 'L';

                return {
                    opponent: opponentId,
                    result,
                    score: `${myScore}-${opScore}`,
                    date: m.year.toString()
                };
            });
        }
      } catch (e) {
          console.warn("Error fetching team history", e);
      }
  }

  return [];
};

export const fetchScoutingOverview = async (teamId: string, lang: LanguageCode): Promise<ScoutingData | null> => {
    // If connection missing, return null to trigger UI fallback
    if (!supabase) {
        console.warn("Supabase not initialized");
        return null;
    }

    try {
        // Query by specific team_id (e.g. 'ARG')
        // Trim to handle CSV import artifacts (e.g. "ARG " from split logic)
        const safeId = teamId.trim();
        
        // 1. Try fetching localized report from 'scouting_reports'
        const { data: reportData, error: reportError } = await supabase
            .from('scouting_reports')
            .select('*')
            .eq('team_id', safeId)
            .eq('lang', lang)
            .maybeSingle();

        if (reportData) {
            // Found localized report!
            return {
                id: reportData.id || 0,
                team_id: reportData.team_id,
                lang: reportData.lang,
                strengths: reportData.strengths,
                weaknesses: reportData.weaknesses,
                star_player: reportData.star_player,
                // Defaults/Placeholders for fields not in new schema
                team_name: safeId,
                confederation: 'FIFA',
                fifa_rank: 0, // Should be fetched from Extended Stats
                scout_notes: '',
                recent_form: '',
                last_5_matches: ''
            };
        }

        // --- Removed fallback to scouting_overview to enforce correct table usage ---
        
        return null;
    } catch (e) {
        console.warn("Scouting fetch exception:", e);
        return null;
    }
};

export interface TeamFormData {
    fifaRank: number;
    history: MatchHistoryItem[];
    recentForm: string; // "W-D-L..."
}

export const fetchTeamExtendedStats = async (teamId: string): Promise<TeamFormData | null> => {
    if (!supabase) return null;
    
    try {
        // Use the new table "team_form_data"
        const { data, error } = await supabase
            .from('team_form_data')
            .select('*')
            .eq('team_id', teamId)
            .order('match_date', { ascending: false });

        if (error) {
            console.warn("Extended stats fetch error:", error.message);
            return null;
        }

        if (data && data.length > 0) {
            const history: MatchHistoryItem[] = data.map((row: any) => ({
                opponent: row.opponent,
                result: row.result as 'W' | 'D' | 'L',
                score: row.score,
                date: row.match_date
            }));
            
            // Fifa rank from most recent entry (or any entry for that team)
            const fifaRank = data[0].fifa_rank;
            
            // Form string (last 5 matches)
            const recentForm = data.slice(0, 5).map((row: any) => row.result).join('-');

            return { fifaRank, history, recentForm };
        }
    } catch(e) {
        console.warn(e);
    }
    return null;
};

// NEW: Fetch all ranks for App Initialization
export const fetchAllTeamRanks = async (): Promise<Record<string, number>> => {
  if (!supabase) return {};
  try {
    const { data } = await supabase.from('team_form_data').select('team_id, fifa_rank');
    if (data) {
      const rankMap: Record<string, number> = {};
      data.forEach((row: any) => {
        // Handle potential duplicates by taking the latest seen (or any)
        rankMap[row.team_id] = row.fifa_rank;
      });
      return rankMap;
    }
  } catch (e) {
    console.error("Rank Sync Error:", e);
  }
  return {};
};

export const seedMockHistoryToSupabase = async (teams: Record<string, Team>) => {
  if (!supabase) return;

  const teamIds = Object.keys(teams).filter(id => id !== 'TBD');
  const records = [];

  for (let i = 0; i < 50; i++) {
    const idxA = Math.floor(Math.random() * teamIds.length);
    let idxB = Math.floor(Math.random() * teamIds.length);
    while (idxB === idxA) idxB = Math.floor(Math.random() * teamIds.length);

    const teamA = teamIds[idxA];
    const teamB = teamIds[idxB];
    const scoreA = Math.floor(Math.random() * 4);
    const scoreB = Math.floor(Math.random() * 4);
    const year = 2020 + Math.floor(Math.random() * 5);

    records.push({
      team_a: teamA,
      team_b: teamB,
      score_a: scoreA,
      score_b: scoreB,
      year: year,
      competition: 'Friendly Sim'
    });
  }

  await supabase.from('head_to_head').insert(records);
};

export const seedScoutingReportsToSupabase = async (teams: Record<string, Team>) => {
    if (!supabase) return;
    
    const teamIds = Object.keys(teams).filter(id => id !== 'TBD');
    const languages: LanguageCode[] = ['EN', 'NO', 'SCO', 'US'];
    const records = [];

    for (const teamId of teamIds) {
        for (const lang of languages) {
            const data = getScoutingReport(teamId, lang);
            if (data.star_player) { // Ensure valid data
                records.push({
                    team_id: teamId,
                    lang: lang,
                    strengths: data.strengths,
                    weaknesses: data.weaknesses,
                    star_player: data.star_player
                });
            }
        }
    }

    // Upsert to avoid duplicates
    const { error } = await supabase.from('scouting_reports').upsert(records, { onConflict: 'team_id,lang' });
    if (error) console.error("Scouting Seed Error:", error);
};

export const seedTeamStatsToSupabase = async (teams: Record<string, Team>) => {
    if (!supabase) return;

    const teamIds = Object.keys(teams).filter(id => id !== 'TBD');
    const records = [];

    for (const teamId of teamIds) {
        const team = teams[teamId];
        // Generate 5 mock matches per team for form data
        for (let i = 0; i < 5; i++) {
            // Pick random opponent
            let oppId = teamIds[Math.floor(Math.random() * teamIds.length)];
            while (oppId === teamId) oppId = teamIds[Math.floor(Math.random() * teamIds.length)];
            
            // Generate result
            const outcomes = ['W', 'D', 'L'];
            const res = outcomes[Math.floor(Math.random() * outcomes.length)];
            let score = '1-1';
            if (res === 'W') score = `${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 1)}`;
            if (res === 'L') score = `${Math.floor(Math.random() * 1)}-${Math.floor(Math.random() * 3) + 1}`;
            
            // Rank estimate
            const rank = Math.round(100 - (team.rating * 0.8));

            records.push({
                team_id: teamId,
                fifa_rank: rank > 0 ? rank : 50,
                match_date: `2024-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
                opponent: `vs ${oppId}`,
                result: res,
                score: score
            });
        }
    }

    // Clear old data first to avoid clutter in this specific table since it lacks a unique constraint suitable for upsert on ID alone
    await supabase.from('team_form_data').delete().neq('id', 0);
    
    const { error } = await supabase.from('team_form_data').insert(records);
    if (error) console.error("Stats Seed Error:", error);
};
