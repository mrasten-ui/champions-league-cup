import { Match, Team, GroupStanding, Round, Prediction, UserProfile, Translation, HeadToHeadStats, HistoricalMatch, MatchHistoryItem, ScoutingData, LanguageCode, TeamFormData } from '../types';
import { GROUP_CONFIG } from '../constants';
import { supabase } from '../supabase';

export const SCORING_RULES = {
  GROUP_EXACT: 5,
  GROUP_RESULT: 3,
  R32: 8,
  R16: 12,
  QF: 16,
  SF: 24,
  FIN: 40,
  '3RD': 20
};

// NOTE — penalty shootouts: scores must reflect the winning team having a higher
// score than the loser. For a 0–0 AET match decided on pens, the admin must
// enter e.g. 1–0 so calculatePoints can determine the correct winner. Storing
// equal scores (0–0, 1–1) for a knockout match will result in no points awarded.
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
      if (form.length < 5 && m.homeScore !== null && m.awayScore !== null) form.push(-1); // -1 = no prediction
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
  if (!teams) return [];

  const groupMatches = matches.filter(m => m.groupId === groupId);
  const standingsMap: Record<string, GroupStanding> = {};
  const groupConfig = GROUP_CONFIG.find((g: any) => g.id === groupId);
  
  const initTeam = (tId: string) => ({
      teamId: tId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
      form: teams[tId]?.form ? [...(teams[tId].form || [])] : [] 
  });

  if (groupConfig) {
      groupConfig.teams.forEach((tId: string) => {
        if (teams[tId]) {
            standingsMap[tId] = initTeam(tId);
        }
      });
  } else {
      groupMatches.forEach(m => {
          if (teams[m.homeTeamId] && !standingsMap[m.homeTeamId]) standingsMap[m.homeTeamId] = initTeam(m.homeTeamId);
          if (teams[m.awayTeamId] && !standingsMap[m.awayTeamId]) standingsMap[m.awayTeamId] = initTeam(m.awayTeamId);
      });
  }

  const sortedMatches = [...groupMatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedMatches.forEach(match => {
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
        home.form.push('W');
        away.form.push('L');
      } else if (aScore > hScore) {
        away.won += 1;
        away.pts += 3;
        home.lost += 1;
        away.form.push('W');
        home.form.push('L');
      } else {
        home.drawn += 1;
        home.pts += 1;
        away.drawn += 1;
        away.pts += 1;
        home.form.push('D');
        away.form.push('D');
      }
    }
  });

  return Object.values(standingsMap).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
};

export const getAllGroupStandings = (matches: Match[], teams: Record<string, Team>): Record<string, GroupStanding[]> => {
  const groups: Record<string, GroupStanding[]> = {};
  
  GROUP_CONFIG.forEach((g: any) => {
      groups[g.id] = calculateGroupStandings(g.id, matches, teams);
  });
  
  return groups;
};

export const getThirdPlaceStandings = (allGroupStandings: Record<string, GroupStanding[]>): (GroupStanding & { groupId: string })[] => {
  const thirds: (GroupStanding & { groupId: string })[] = [];
  
  Object.entries(allGroupStandings).forEach(([gid, group]) => {
    if (group.length >= 3) {
      thirds.push({ ...group[2], groupId: gid });
    }
  });

  return thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return b.won - a.won;
  });
};

// EXPLICIT FIFA KNOCKOUT PROGRESSION MAP (Article 12)
// This ensures that regardless of DB next_match_id flaws, teams route perfectly.
const KNOCKOUT_PROGRESSION: Record<string, { nextId: string, slot: 'home' | 'away' }> = {
    // Round of 32 to Round of 16
    'R32_1':  { nextId: 'R16_1', slot: 'home' }, // RSA/CAN
    'R32_2':  { nextId: 'R16_5', slot: 'home' }, // BRA/JPN
    'R32_3':  { nextId: 'R16_2', slot: 'home' }, // GER/PAR
    'R32_4':  { nextId: 'R16_1', slot: 'away' }, // NED/MAR
    'R32_5':  { nextId: 'R16_5', slot: 'away' }, // CIV/NOR
    'R32_6':  { nextId: 'R16_2', slot: 'away' }, // FRA/SWE
    'R32_7':  { nextId: 'R16_6', slot: 'home' }, // MEX/ECU
    'R32_8':  { nextId: 'R16_6', slot: 'away' }, // ENG/COD
    'R32_9':  { nextId: 'R16_4', slot: 'home' }, // BEL/SEN
    'R32_10': { nextId: 'R16_4', slot: 'away' }, // USA/BIH
    'R32_11': { nextId: 'R16_3', slot: 'home' }, // ESP/AUT
    'R32_12': { nextId: 'R16_3', slot: 'away' }, // POR/CRO
    'R32_13': { nextId: 'R16_8', slot: 'home' }, // SUI/ALG
    'R32_14': { nextId: 'R16_7', slot: 'home' }, // AUS/EGY
    'R32_15': { nextId: 'R16_7', slot: 'away' }, // ARG/CPV
    'R32_16': { nextId: 'R16_8', slot: 'away' }, // COL/GHA
    // Round of 16 to Quarter Finals
    'R16_1': { nextId: 'QF_1', slot: 'home' }, 
    'R16_2': { nextId: 'QF_1', slot: 'away' }, 
    'R16_3': { nextId: 'QF_3', slot: 'home' }, 
    'R16_4': { nextId: 'QF_3', slot: 'away' }, 
    'R16_5': { nextId: 'QF_2', slot: 'home' }, 
    'R16_6': { nextId: 'QF_2', slot: 'away' }, 
    'R16_7': { nextId: 'QF_4', slot: 'home' }, 
    'R16_8': { nextId: 'QF_4', slot: 'away' }, 
    // Quarter Finals to Semi Finals
    'QF_1': { nextId: 'SF_1', slot: 'home' }, 
    'QF_2': { nextId: 'SF_1', slot: 'away' }, 
    'QF_3': { nextId: 'SF_2', slot: 'home' }, 
    'QF_4': { nextId: 'SF_2', slot: 'away' }, 
    // Semi Finals to Final / 3rd Place
    'SF_1': { nextId: 'FIN_1', slot: 'home' },
    'SF_2': { nextId: 'FIN_1', slot: 'away' },
};

export const updateBracket = (matches: Match[], teams: Record<string, Team>): Match[] => {
    const groupResults = getAllGroupStandings(matches, teams);
    const getTeam = (gid: string, rank: number) => groupResults[gid]?.[rank - 1]?.teamId || 'TBD';
    
    const thirds = getThirdPlaceStandings(groupResults);
    const qualifiedThirds = thirds.slice(0, 8);
    
    // FIFA ANNEXE C - Constraint Backtracking Solver
    // 495 combinations exist. This recursively finds the single valid assignment
    // where a 3rd place team NEVER plays a winner from its own group.
    const thirdPlaceSlots = [
        { matchId: 'R32_2', allowedGroups: ['A', 'B', 'C', 'D', 'F'], teamId: 'TBD' },
        { matchId: 'R32_5', allowedGroups: ['C', 'D', 'F', 'G', 'H'], teamId: 'TBD' },
        { matchId: 'R32_7', allowedGroups: ['C', 'E', 'F', 'H', 'I'], teamId: 'TBD' },
        { matchId: 'R32_8', allowedGroups: ['E', 'H', 'I', 'J', 'K'], teamId: 'TBD' },
        { matchId: 'R32_9', allowedGroups: ['B', 'E', 'F', 'I', 'J'], teamId: 'TBD' },
        { matchId: 'R32_10', allowedGroups: ['A', 'E', 'H', 'I', 'J'], teamId: 'TBD' },
        { matchId: 'R32_13', allowedGroups: ['E', 'F', 'G', 'I', 'J'], teamId: 'TBD' },
        { matchId: 'R32_15', allowedGroups: ['D', 'E', 'I', 'J', 'L'], teamId: 'TBD' }
    ];

    const assignThirds = (idx: number): boolean => {
        if (idx === qualifiedThirds.length) return true;
        const team = qualifiedThirds[idx];
        
        for (let i = 0; i < thirdPlaceSlots.length; i++) {
            if (thirdPlaceSlots[i].teamId === 'TBD' && thirdPlaceSlots[i].allowedGroups.includes(team.groupId)) {
                thirdPlaceSlots[i].teamId = team.teamId;
                if (assignThirds(idx + 1)) return true;
                thirdPlaceSlots[i].teamId = 'TBD'; // backtrack if dead end
            }
        }
        return false;
    };
    
    // Execute solver
    assignThirds(0);

    const nextMatches = matches.map(m => ({ ...m }));

    const setMatchup = (matchId: string, home: string, away: string) => {
        const match = nextMatches.find(m => m.id === matchId);
        if (!match) return;

        let changed = false;
        if (match.homeTeamId !== home) { match.homeTeamId = home; changed = true; }
        if (match.awayTeamId !== away) { match.awayTeamId = away; changed = true; }

        if (changed && !match.isLocked) {
            match.homeScore = null;
            match.awayScore = null;
        }
    };

    // Round of 32 Base Assignments
    setMatchup('R32_1', getTeam('A', 2), getTeam('B', 2));
    setMatchup('R32_3', getTeam('F', 1), getTeam('C', 2));
    setMatchup('R32_4', getTeam('C', 1), getTeam('F', 2));
    setMatchup('R32_6', getTeam('E', 2), getTeam('I', 2));
    setMatchup('R32_11', getTeam('K', 2), getTeam('L', 2));
    setMatchup('R32_12', getTeam('H', 1), getTeam('J', 2));
    setMatchup('R32_14', getTeam('J', 1), getTeam('H', 2));
    setMatchup('R32_16', getTeam('D', 2), getTeam('G', 2));

    // Round of 32 Solved 3rd Place Assignments
    setMatchup('R32_2', getTeam('E', 1), thirdPlaceSlots[0].teamId);
    setMatchup('R32_5', getTeam('I', 1), thirdPlaceSlots[1].teamId);
    setMatchup('R32_7', getTeam('A', 1), thirdPlaceSlots[2].teamId);
    setMatchup('R32_8', getTeam('L', 1), thirdPlaceSlots[3].teamId);
    setMatchup('R32_9', getTeam('D', 1), thirdPlaceSlots[4].teamId);
    setMatchup('R32_10', getTeam('G', 1), thirdPlaceSlots[5].teamId);
    setMatchup('R32_13', getTeam('B', 1), thirdPlaceSlots[6].teamId);
    setMatchup('R32_15', getTeam('K', 1), thirdPlaceSlots[7].teamId);

    // Cascading Knockout Progression
    const rounds: Round[] = ['R32', 'R16', 'QF', 'SF'];
    
    rounds.forEach(round => {
        const roundMatches = nextMatches.filter(m => m.round === round);
        
        roundMatches.forEach(match => {
            const progression = KNOCKOUT_PROGRESSION[match.id];
            // Fallback to nextMatchId if not in our strict map
            const targetNextId = progression ? progression.nextId : match.nextMatchId;
            if (!targetNextId) return;

            let winnerId = 'TBD';
            let loserId = 'TBD';
            
            if (match.homeScore !== null && match.awayScore !== null) {
                if (match.homeTeamId !== 'TBD' && match.awayTeamId !== 'TBD') {
                    if (match.homeScore > match.awayScore) {
                        winnerId = match.homeTeamId;
                        loserId = match.awayTeamId;
                    } else if (match.awayScore > match.homeScore) {
                        winnerId = match.awayTeamId;
                        loserId = match.homeTeamId;
                    }
                }
            }

            const nextMatch = nextMatches.find(m => m.id === targetNextId);
            if (nextMatch) {
                // Determine slot via strict map, or infer via odd/even ID splitting
                const slot = progression ? progression.slot : (parseInt(match.id.split('_')[1] || '0') % 2 !== 0 ? 'home' : 'away');

                if (slot === 'home') {
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

            // Handle 3rd Place Match routing from Semi Finals
            if (round === 'SF') {
                const thirdPlaceMatch = nextMatches.find(m => m.round === '3RD');
                if (thirdPlaceMatch) {
                    const slot = match.id === 'SF_1' ? 'home' : 'away';
                    if (slot === 'home') { 
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
        if (!hasChanges) break;
    }
    return currentMatches;
};

export const generateMagicScores = (matches: Match[], teams: Record<string, Team>, favorites: string[], riskLevel = 0.5): Match[] => {
  return matches.map(match => {
    if (match.homeTeamId === 'TBD' || match.awayTeamId === 'TBD') return match;

    const homeTeam = teams[match.homeTeamId];
    const awayTeam = teams[match.awayTeamId];
    if (!homeTeam || !awayTeam) return match;

    // --- ELO WIN PROBABILITY → GOAL DIFFERENTIAL (70% weight) ---
    // ELO formula: We = 1 / (10^(-dr/400) + 1)
    // 200-pt gap ≈ 76% win prob ≈ +0.78 goal advantage; 400-pt gap ≈ 91% ≈ +1.23.
    // Falls back to FIFA rank if ELO isn't loaded yet.
    const eloH = homeTeam.eloRating;
    const eloA = awayTeam.eloRating;
    let eloGoalDiff = 0;
    if (eloH && eloA) {
      const winProbH = 1 / (1 + Math.pow(10, -(eloH - eloA) / 400));
      eloGoalDiff = (winProbH - 0.5) * 3.0;
    } else {
      const rH = homeTeam.rank || 100;
      const rA = awayTeam.rank || 100;
      eloGoalDiff = (rA - rH) / 15;
    }

    // --- ATT vs DEF TEXTURE (30% weight) ---
    // Which team's attack overloads the opponent's defence — adds score variety.
    const attDefH = ((homeTeam.att || 50) - (awayTeam.def || 50)) / 50;
    const attDefA = ((awayTeam.att || 50) - (homeTeam.def || 50)) / 50;

    // riskLevel 0=banker, 0.5=default, 1=wildcard
    // Low risk: ELO carries more weight; luck swings are tiny → favourites dominate.
    // High risk: ELO matters less; large luck swings → frequent upsets.
    const eloWeight  = 0.90 - riskLevel * 0.40;   // 0.90 → 0.70 → 0.50
    const adWeight   = 1 - eloWeight;              // 0.10 → 0.30 → 0.50
    const skillH = eloGoalDiff * eloWeight + attDefH * adWeight;
    const skillA = -eloGoalDiff * eloWeight + attDefA * adWeight;

    // --- FAVORITES BOOST ---
    // Base +0.4, scaling up to +1.0 when the match is a genuine 50/50 by ELO.
    // Picking a favourite in a tight game tips the balance; in a mismatch it barely shows.
    const matchTightness = Math.max(0, 1 - Math.abs(eloGoalDiff) / 1.5);
    const hFav = favorites.includes(homeTeam.id) ? (0.4 + matchTightness * 0.6) : 0;
    const aFav = favorites.includes(awayTeam.id) ? (0.4 + matchTightness * 0.6) : 0;

    // --- BASE GOALS + LUCK ---
    // luckRange scales with risk: ±0.3 (banker) → ±1.4 (balanced) → ±2.5 (wildcard).
    const luckRange = 0.3 + riskLevel * 2.2;
    const baseGoals = 1.0 + Math.random() * 1.5;
    const luckH = (Math.random() * 2 - 1) * luckRange;
    const luckA = (Math.random() * 2 - 1) * luckRange;

    let finalHome = Math.round(Math.max(0, Math.min(9, baseGoals + skillH + hFav + luckH)));
    let finalAway = Math.round(Math.max(0, Math.min(9, baseGoals + skillA + aFav + luckA)));

    // --- KNOCKOUT DRAW PREVENTION ---
    if (!match.groupId && finalHome === finalAway) {
      const eloTie = eloH && eloA ? eloH : (200 - (homeTeam.rank || 100)) * 10;
      const eloTieA = eloH && eloA ? eloA : (200 - (awayTeam.rank || 100)) * 10;
      if (eloTie + Math.random() * 100 > eloTieA + Math.random() * 100) finalHome++; else finalAway++;
    }

    return { ...match, homeScore: finalHome, awayScore: finalAway };
  });
};

export const simulateFullTournament = (
    initialMatches: Match[],
    teams: Record<string, Team>,
    favorites: string[],
    scope: 'GROUPS' | 'KNOCKOUT' | 'ALL' = 'ALL',
    riskLevel = 0.5
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
            if (!m.groupId && m.homeScore !== null && m.awayScore !== null) {
                if (m.homeScore === m.awayScore) return true; 
            }

            if (m.homeScore !== null && m.awayScore !== null) return false;
            if (m.homeTeamId === 'TBD' || m.awayTeamId === 'TBD') return false;
            if (scope === 'GROUPS' && !m.groupId) return false;
            if (scope === 'KNOCKOUT' && m.groupId) return false;
            return true;
        });

        if (matchesToPredict.length === 0) break;

        const predictedMatches = generateMagicScores(matchesToPredict, teams, favorites, riskLevel);
        
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
            const timestamp = new Date(dateStr).getTime();
            if (!isNaN(timestamp)) return timestamp;
            return 0; 
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
    const emptyStats: HeadToHeadStats = { totalMatches: 0, homeWins: 0, awayWins: 0, draws: 0, last5: [] };

    if (supabase) {
        try {
            const homeId = homeTeam.id.toUpperCase();
            const awayId = awayTeam.id.toUpperCase();
            const { data, error } = await supabase
                .from('head_to_head')
                .select('*')
                .in('team_a', [homeId, awayId])
                .in('team_b', [homeId, awayId])
                .order('year', { ascending: false });

            if (error) {
                console.warn("Supabase H2H Fetch Error:", error.message);
                return emptyStats;
            } else if (data && data.length > 0) {
                const relevantMatches = data.filter(m =>
                    (m.team_a === homeId && m.team_b === awayId) ||
                    (m.team_a === awayId && m.team_b === homeId)
                );

                if (relevantMatches.length > 0) {
                    let homeWins = 0;
                    let awayWins = 0;
                    let draws = 0;
                    const history: HistoricalMatch[] = [];

                    relevantMatches.forEach(match => {
                        const isHomeTeamA = match.team_a === homeId;
                        const homeScore = isHomeTeamA ? (match.score_a ?? 0) : (match.score_b ?? 0);
                        const awayScore = isHomeTeamA ? (match.score_b ?? 0) : (match.score_a ?? 0);
                        
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
                            year: match.year ?? new Date().getFullYear(),
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
        const safeId = teamId.toUpperCase();
        const { data, error } = await supabase
          .from('head_to_head')
          .select('*')
          .or(`team_a.eq.${safeId},team_b.eq.${safeId}`)
          .order('year', { ascending: false })
          .limit(10);

        if (data && data.length > 0) {
            return data.map(m => {
                const isHome = m.team_a === safeId;
                const opponentId = isHome ? m.team_b : m.team_a;
                const myScore = isHome ? (m.score_a ?? 0) : (m.score_b ?? 0);
                const opScore = isHome ? (m.score_b ?? 0) : (m.score_a ?? 0);
                
                let result: 'W' | 'D' | 'L' = 'D';
                if (myScore > opScore) result = 'W';
                if (myScore < opScore) result = 'L';

                return {
                    opponent: opponentId || 'Unknown',
                    result,
                    score: `${myScore}-${opScore}`,
                    date: (m.year ?? new Date().getFullYear()).toString()
                };
            });
        }
      } catch (e) { console.warn("Error fetching team history", e); }
  }
  return [];
};

export const fetchScoutingOverview = async (teamId: string, lang: LanguageCode): Promise<ScoutingData | null> => {
    if (!supabase) return null;

    try {
        const safeId = teamId.trim().toUpperCase();
        const { data: reportData } = await supabase.from('scouting_reports').select('*').eq('team_id', safeId).eq('lang', lang.toUpperCase()).maybeSingle();
        const { data: overviewData } = await supabase.from('scouting_overview').select('*').eq('team_id', safeId).maybeSingle();

        if (reportData || overviewData) {
            return {
                id: overviewData?.id ?? 0,
                team_id: overviewData?.team_id || reportData?.team_id || safeId,
                team_name: overviewData?.team_name || safeId,
                confederation: overviewData?.confederation || 'FIFA',
                fifa_rank: overviewData?.fifa_rank ?? 0,
                star_player: reportData?.star_player || overviewData?.star_player || '',
                strengths: reportData?.strengths || overviewData?.strengths || '',
                weaknesses: reportData?.weaknesses || overviewData?.weaknesses || '',
                scout_notes: overviewData?.scout_notes || '',
                recent_form: overviewData?.recent_form || '',
                last_5_matches: overviewData?.last_5_matches || '',
                lang: lang 
            };
        }
        return null;
    } catch (e) {
        console.warn("Scouting fetch exception:", e);
        return null;
    }
};

export const fetchTeamExtendedStats = async (teamId: string): Promise<TeamFormData | null> => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase.from('team_form_data').select('*').eq('team_id', teamId.toUpperCase()).order('match_date', { ascending: false });
        if (error) return null;

        if (data && data.length > 0) {
            const history: MatchHistoryItem[] = data.map(row => ({
                opponent: row.opponent || 'Unknown',
                result: (row.result as 'W' | 'D' | 'L') || 'D',
                score: row.score || '0-0',
                date: row.match_date || ''
            }));
            
            const fifaRank = data[0].fifa_rank ?? 0;
            const recentForm = data.slice(0, 5).map(row => row.result).join('-');

            return { fifaRank, history, recentForm };
        }
    } catch(e) { console.warn(e); }
    return null;
};

export const fetchAllTeamRanks = async (): Promise<Record<string, number>> => {
  if (!supabase) return {};
  try {
    const { data } = await supabase.from('team_form_data').select('team_id, fifa_rank');
    if (data) {
      const rankMap: Record<string, number> = {};
      data.forEach(row => { if (row.team_id && row.fifa_rank !== null) rankMap[row.team_id.toUpperCase()] = row.fifa_rank; });
      return rankMap;
    }
  } catch (e) { console.error("Rank Sync Error:", e); }
  return {};
};