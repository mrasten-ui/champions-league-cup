import { Match, Team, GroupStanding, LeagueStanding, Round, Prediction, UserProfile, Translation, HeadToHeadStats, HistoricalMatch, MatchHistoryItem, ScoutingData, LanguageCode, TeamFormData } from '../types';
import { supabase } from '../supabase';

// League Phase base value that the round-scaled formula below
// (outcomePointsForRound/exactPointsForRound) builds on.
const LEAGUE_PHASE_OUTCOME_POINTS = 3;

// Round-scaled live scoring. Every match — League Phase or knockout — is
// judged the same simple way: exact score, or correct result (W/D/L), or
// nothing. No separate "predict who reaches the final" bracket bonus anymore
// — once the League Phase ends, every remaining fixture is a real, known
// pairing, so calling its score isn't the same feat as calling the eventual
// finalists blind used to be. What DOES scale is the base value per round,
// modestly: League Phase = 3 (outcome) / 5 (exact), then +2 per knockout
// round reached (Playoff Round 5/7, R16 7/9, QF 9/11, SF 11/13, Final 13/15).
const KNOCKOUT_ROUND_ORDER: Round[] = ['PO', 'R16', 'QF', 'SF', 'FIN'];
const OUTCOME_STEP = 2;

export const outcomePointsForRound = (round?: Round): number => {
  if (!round) return LEAGUE_PHASE_OUTCOME_POINTS;
  const idx = KNOCKOUT_ROUND_ORDER.indexOf(round);
  if (idx === -1) return LEAGUE_PHASE_OUTCOME_POINTS; // legacy R32/3RD codes — no longer produced
  return LEAGUE_PHASE_OUTCOME_POINTS + OUTCOME_STEP * (idx + 1);
};
export const exactPointsForRound = (round?: Round): number => outcomePointsForRound(round) + 2;

// Penalty-shootout bonus/malus for correctly (or incorrectly) predicting that
// a knockout match/tie goes to a shootout — evaluated separately from
// calculatePoints and added alongside it at every real scoring call site,
// since it depends on the user's PREDICTED scoreline implying a draw, not on
// which side calculatePoints judges as the outcome-tier winner. Rule:
//   - A user's prediction "implies penalties" when it's a draw at the level
//     evaluated (aggregate for a two-legged tie, 90/120 min for the Final) —
//     that's the trigger for asking them to also pick a penalty winner.
//   - +4 if the match/tie they predicted a draw for ACTUALLY went to
//     penalties (regardless of whether their penalty-winner pick was right).
//   - -1 if they predicted a draw (implying penalties) but the match/tie was
//     actually decided in normal or extra time — the shootout they called
//     never happened. No penalty for the reverse (predicting a decisive
//     winner that actually needed penalties) — that's just a normal miss on
//     the base outcome/exact tiers above.
//   - The base outcome tier (calculatePoints) for a knockout tie is judged on
//     who wins the tie overall, not the literal in-90-minutes scoreline — a
//     team that wins on penalties still counts as the "correct winner" pick.
//   - Exact-score comparisons always use the score at the final whistle of
//     football (90 min, or 120 if extra time is played), never the penalty
//     shootout score — penalties decide who advances, not the football score.
export const calculatePenaltyBonus = (
  predictedGoesToPens: boolean,
  actualWentToPens: boolean
): number => {
  if (!predictedGoesToPens) return 0;
  return actualWentToPens ? 4 : -1;
};

// Resolves a team-id winner pick (Prediction.predictedWinnerId, or Match's real
// penaltyWinnerId) into the HOME/AWAY frame calculatePoints works in.
export const resolvePenaltySide = (
  teamId: string | undefined | null,
  match: { homeTeamId: string; awayTeamId: string }
): 'HOME' | 'AWAY' | undefined => {
  if (!teamId) return undefined;
  if (teamId === match.homeTeamId) return 'HOME';
  if (teamId === match.awayTeamId) return 'AWAY';
  return undefined;
};

export const calculatePoints = (
  predHome: number,
  predAway: number,
  actualHome: number | null,
  actualAway: number | null,
  round?: Round,
  // Only meaningful when the respective scoreline is level: who the user
  // picked to win on penalties, and who actually won on penalties. A
  // two-legged knockout tie level on aggregate always goes to a shootout
  // (no more away-goals rule), so a real knockout draw normally comes with
  // actualPenaltySide set — see calculatePenaltyBonus for the separate
  // did-it-go-to-pens bonus/malus, evaluated independently at scoring time.
  predictedPenaltySide?: 'HOME' | 'AWAY',
  actualPenaltySide?: 'HOME' | 'AWAY'
): number => {
  if (actualHome === null || actualAway === null) return 0;

  if (predHome === actualHome && predAway === actualAway) {
    return exactPointsForRound(round);
  }

  const rawPredRes = predHome > predAway ? 'HOME' : predHome < predAway ? 'AWAY' : 'DRAW';
  const rawActualRes = actualHome > actualAway ? 'HOME' : actualHome < actualAway ? 'AWAY' : 'DRAW';

  // League Phase: no penalties, a draw is just a draw.
  if (!round) {
    return rawPredRes === rawActualRes ? outcomePointsForRound(round) : 0;
  }

  // Knockouts: a level scoreline resolves through the penalty pick/result
  // instead — a shootout winner is still the correct-winner pick for
  // outcome-tier credit, even when the raw scoreline comparison alone
  // wouldn't suggest it (e.g. predicted 2-1, actual 1-1 then won on pens).
  const predWinner = rawPredRes === 'DRAW' ? predictedPenaltySide : rawPredRes;
  const actualWinner = rawActualRes === 'DRAW' ? actualPenaltySide : rawActualRes;
  return !!predWinner && !!actualWinner && predWinner === actualWinner ? outcomePointsForRound(round) : 0;
};

export const calculateMaxPotentialPoints = (matches: Match[], predictions: Prediction[], user: UserProfile): number => {
    let total = 0;
    matches.forEach(m => {
        const pred = predictions.find(p => p.matchId === m.id);
        if (!pred) return;

        const isFinishedOrLive = ['FINISHED', 'FT', 'AET', 'PEN', 'LIVE', '1H', '2H', 'HT'].includes(m.status);

        if (isFinishedOrLive && m.homeScore !== null && m.awayScore !== null) {
            total += calculatePoints(pred.home, pred.away, m.homeScore, m.awayScore, m.round, resolvePenaltySide(pred.predictedWinnerId, m), resolvePenaltySide(m.penaltyWinnerId, m));
            if (m.round) total += calculatePenaltyBonus(pred.home === pred.away, !!m.penaltyWinnerId);
        } else {
            total += exactPointsForRound(m.round); // max possible: nailing the exact score
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

    let pts = calculatePoints(pred.home, pred.away, m.homeScore, m.awayScore, m.round, resolvePenaltySide(pred.predictedWinnerId, m), resolvePenaltySide(m.penaltyWinnerId, m));
    if (m.round) pts += calculatePenaltyBonus(pred.home === pred.away, !!m.penaltyWinnerId);

    if (form.length < 5) form.push(pts);

    if (currentStreakAlive) {
      if (pts > 0) streak++;
      else currentStreakAlive = false;
    }
  });

  return { form: form.reverse(), streak };
};

// ─── Swiss-format League Phase (Champions League 2026/27+) ──────────────────
// One flat 36-team table, no groups. A League Phase match is simply any match
// with no `round` set (same discriminator the old group-stage code used —
// matches produced by the old World Cup seed data still work correctly here
// too, since their group matches also have no `round`).
//
// Tiebreak order: Pts, GD, Goals Scored, Away Goals, Wins, Away Wins.
export const calculateLeagueStandings = (matches: Match[], teams: Record<string, Team>): LeagueStanding[] => {
  if (!teams) return [];

  const leagueMatches = matches.filter(m => !m.round);
  const standingsMap: Record<string, LeagueStanding> = {};

  const initTeam = (tId: string): LeagueStanding => ({
    teamId: tId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    pts: 0,
    form: teams[tId]?.form ? [...(teams[tId].form || [])] : [],
    awayGoals: 0,
    awayWins: 0
  });

  // Seed every known team so the table always has all 36 rows, even before kickoff.
  // Skip 'TBD' — the reserved sentinel id for not-yet-determined knockout slots, never a real entrant.
  Object.keys(teams).forEach(tId => { if (tId !== 'TBD') standingsMap[tId] = initTeam(tId); });
  leagueMatches.forEach(m => {
    if (teams[m.homeTeamId] && !standingsMap[m.homeTeamId]) standingsMap[m.homeTeamId] = initTeam(m.homeTeamId);
    if (teams[m.awayTeamId] && !standingsMap[m.awayTeamId]) standingsMap[m.awayTeamId] = initTeam(m.awayTeamId);
  });

  const sortedMatches = [...leagueMatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
      away.awayGoals += aScore;

      if (hScore > aScore) {
        home.won += 1;
        home.pts += 3;
        away.lost += 1;
        home.form.push('W');
        away.form.push('L');
      } else if (aScore > hScore) {
        away.won += 1;
        away.pts += 3;
        away.awayWins += 1;
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
    if (b.gf !== a.gf) return b.gf - a.gf;
    if (b.awayGoals !== a.awayGoals) return b.awayGoals - a.awayGoals;
    if (b.won !== a.won) return b.won - a.won;
    return b.awayWins - a.awayWins;
  });
};

// ─── Swiss-format Knockout Phase (Champions League 2026/27+) ────────────────
// Two-legged aggregate ties, id convention `{ROUND}_{tieIndex}_L{leg}` (e.g.
// `PO_3_L1`/`PO_3_L2`). The Final stays a single match (`FIN_1`, no leg
// suffix) — matches real UEFA CL format.

export interface TieAggregate {
    tieId: string;
    teamAId: string;
    teamBId: string;
    aggA: number | null; // null until leg 1 has a score
    aggB: number | null;
    leg1Played: boolean;
    leg2Played: boolean;
    winnerId: string | null; // set only once both legs are played and decisive
    loserId: string | null;
}

/** Reads the two legs of a knockout tie (`{tieId}_L1`/`{tieId}_L2`) and computes the running/aggregate score. Tolerates either leg hosting either team. */
export const getTieAggregate = (matches: Match[], tieId: string): TieAggregate | null => {
    const leg1 = matches.find(m => m.id === `${tieId}_L1`);
    const leg2 = matches.find(m => m.id === `${tieId}_L2`);
    if (!leg1 || !leg2) return null;

    const teamAId = leg1.homeTeamId;
    const teamBId = leg1.awayTeamId;
    if (!teamAId || !teamBId || teamAId === 'TBD' || teamBId === 'TBD') return null;

    const leg1Played = leg1.homeScore !== null && leg1.awayScore !== null;
    const leg2Played = leg2.homeScore !== null && leg2.awayScore !== null;

    let leg2ForA: number | null = null;
    let leg2ForB: number | null = null;
    if (leg2Played) {
        if (leg2.homeTeamId === teamAId && leg2.awayTeamId === teamBId) {
            leg2ForA = leg2.homeScore; leg2ForB = leg2.awayScore;
        } else if (leg2.homeTeamId === teamBId && leg2.awayTeamId === teamAId) {
            leg2ForA = leg2.awayScore; leg2ForB = leg2.homeScore;
        }
    }

    const aggA = leg1Played ? (leg1.homeScore as number) + (leg2ForA ?? 0) : null;
    const aggB = leg1Played ? (leg1.awayScore as number) + (leg2ForB ?? 0) : null;

    let winnerId: string | null = null;
    let loserId: string | null = null;
    if (leg1Played && leg2Played && aggA !== null && aggB !== null && aggA !== aggB) {
        winnerId = aggA > aggB ? teamAId : teamBId;
        loserId = aggA > aggB ? teamBId : teamAId;
    }

    return { tieId, teamAId, teamBId, aggA, aggB, leg1Played, leg2Played, winnerId, loserId };
};

// Standard 8-seed single-elimination bracket order (tennis/NCAA-style): the seed occupying
// R16 tie i (1-indexed via this array). Guarantees seed 1 and seed 2 fall in opposite SF halves
// (R16 ties 1-4 feed SF1, ties 5-8 feed SF2 — see SWISS_KNOCKOUT_PROGRESSION below), so they can
// only meet in the Final.
const R16_SEED_SLOTS = [1, 8, 4, 5, 2, 7, 3, 6];

// Once seeded (see R16_SEED_SLOTS above), the rest of the tree is standard
// single-elimination bracket math: generated, not hardcoded, unlike the old
// World Cup KNOCKOUT_PROGRESSION table above (which encoded a specific
// real-world draw result).
const SWISS_KNOCKOUT_PROGRESSION: Record<'R16' | 'QF', Record<number, { nextRound: 'QF' | 'SF', nextIndex: number, slot: 'home' | 'away' }>> = (() => {
    const build = (tieCount: number, nextRound: 'QF' | 'SF') => {
        const map: Record<number, { nextRound: 'QF' | 'SF', nextIndex: number, slot: 'home' | 'away' }> = {};
        for (let i = 1; i <= tieCount; i++) {
            map[i] = { nextRound, nextIndex: Math.ceil(i / 2), slot: i % 2 === 1 ? 'home' : 'away' };
        }
        return map;
    };
    return { R16: build(8, 'QF'), QF: build(4, 'SF') };
})();

/** Appends the Swiss-format Playoff Round seeding + two-leg cascade to an already-built `nextMatches` array. No-ops cleanly if no Swiss-shaped (`_L1`/`_L2`) matches exist. */
const applySwissBracketCascade = (nextMatches: Match[], teams: Record<string, Team>): void => {
    const standings = calculateLeagueStandings(nextMatches, teams);
    const getSeed = (rank: number) => standings[rank - 1]?.teamId || 'TBD';

    const setSlot = (matchId: string, slot: 'home' | 'away', teamId: string) => {
        const match = nextMatches.find(m => m.id === matchId);
        if (!match || teamId === 'TBD') return;
        if (match.homeTeamId !== 'TBD' && match.awayTeamId !== 'TBD') return; // already known — don't overwrite real data
        if (slot === 'home' && match.homeTeamId !== teamId) {
            match.homeTeamId = teamId;
            if (!match.isLocked) { match.homeScore = null; match.awayScore = null; }
        } else if (slot === 'away' && match.awayTeamId !== teamId) {
            match.awayTeamId = teamId;
            if (!match.isLocked) { match.homeScore = null; match.awayScore = null; }
        }
    };

    // Playoff Round: deterministic seeding, 9v24, 10v23 ... 16v17. Lower seed
    // hosts leg 1; higher (better) seed hosts leg 2, per real UEFA CL rules.
    for (let i = 1; i <= 8; i++) {
        const highSeed = getSeed(8 + i);   // 9..16
        const lowSeed = getSeed(25 - i);   // 24..17
        setSlot(`PO_${i}_L1`, 'home', lowSeed);
        setSlot(`PO_${i}_L1`, 'away', highSeed);
        setSlot(`PO_${i}_L2`, 'home', highSeed);
        setSlot(`PO_${i}_L2`, 'away', lowSeed);
    }

    // Round of 16: seeds 1-8 (direct qualifiers) auto-placed into a deterministic seeded
    // bracket — NOT the real UEFA draw (which has association/no-repeat-opponent constraints
    // no formula can replicate), a simplified tennis-style seeding instead, per product decision.
    // R16_SEED_SLOTS[i-1] is which seed occupies R16 tie i; playoff tie i's winner (once known)
    // fills the other side. Standard 8-seed bracket order (1,8,4,5,2,7,3,6) guarantees seed 1 and
    // seed 2 land in opposite SF halves — they can only meet in the Final, same for 3 & 4-ish
    // fairness further down. The seeded team hosts leg 2, mirroring the Playoff Round convention.
    for (let i = 1; i <= 8; i++) {
        const seedRank = R16_SEED_SLOTS[i - 1];
        const seedTeam = getSeed(seedRank);
        const playoffWinner = getTieAggregate(nextMatches, `PO_${i}`)?.winnerId;
        setSlot(`R16_${i}_L1`, 'away', seedTeam);
        setSlot(`R16_${i}_L2`, 'home', seedTeam);
        if (playoffWinner) {
            setSlot(`R16_${i}_L1`, 'home', playoffWinner);
            setSlot(`R16_${i}_L2`, 'away', playoffWinner);
        }
    }

    // R16 → QF → SF: fixed bracket math once R16 pairing is known.
    (['R16', 'QF'] as const).forEach(round => {
        const tieIds = new Set(
            nextMatches.filter(m => m.round === round && m.id.endsWith('_L1')).map(m => m.id.slice(0, -3))
        );
        tieIds.forEach(tieId => {
            const agg = getTieAggregate(nextMatches, tieId);
            if (!agg?.winnerId) return;
            const tieIndex = parseInt(tieId.split('_')[1] || '0', 10);
            const prog = SWISS_KNOCKOUT_PROGRESSION[round]?.[tieIndex];
            if (!prog) return;
            const nextTieId = `${prog.nextRound}_${prog.nextIndex}`;
            setSlot(`${nextTieId}_L1`, prog.slot, agg.winnerId);
            setSlot(`${nextTieId}_L2`, prog.slot === 'home' ? 'away' : 'home', agg.winnerId);
        });
    });

    // Final: single match, fed directly by the two SF tie winners.
    const sf1 = getTieAggregate(nextMatches, 'SF_1');
    const sf2 = getTieAggregate(nextMatches, 'SF_2');
    if (sf1?.winnerId) setSlot('FIN_1', 'home', sf1.winnerId);
    if (sf2?.winnerId) setSlot('FIN_1', 'away', sf2.winnerId);
};

export const updateBracket = (matches: Match[], teams: Record<string, Team>): Match[] => {
    const nextMatches = matches.map(m => ({ ...m }));
    applySwissBracketCascade(nextMatches, teams);
    return nextMatches;
};

export const applyPredictionsToBracket = (
    initialMatches: Match[], 
    teams: Record<string, Team>,
    userPredictions: Prediction[]
): Match[] => {
    let currentMatches = initialMatches.map(m => ({ ...m }));
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

export interface UserFinalScore {
    totalPoints: number;
    groupPoints: number;
    knockoutPoints: number;
    exactCount: number;
}

// Mirrors Leaderboard.tsx's userStats calculation (totalPoints/groupPoints/
// knockoutPoints/exactCount only — bankedPoints/form/streak/koBreakdown are
// display-only extras that live in Leaderboard.tsx). Kept here so any other
// caller needing "this player's score" reuses the same calculatePoints logic
// instead of re-deriving it. No bracket-qualification bonus anymore — see
// calculatePoints' round-scaled exact/outcome scoring.
export const computeUserFinalScore = (
    user: UserProfile,
    matches: Match[],
    allPredictions: Prediction[],
    teams: Record<string, Team>
): UserFinalScore => {
    let totalPoints = 0;
    let groupPoints = 0;
    let knockoutPoints = 0;
    let exactCount = 0;

    matches.forEach(match => {
        const pred = allPredictions.find(p => p.userId === user.email && p.matchId === match.id);
        if (pred && match.homeScore !== null && match.awayScore !== null) {
            let pts = calculatePoints(pred.home, pred.away, match.homeScore, match.awayScore, match.round, resolvePenaltySide(pred.predictedWinnerId, match), resolvePenaltySide(match.penaltyWinnerId, match));
            if (match.round) pts += calculatePenaltyBonus(pred.home === pred.away, !!match.penaltyWinnerId);
            totalPoints += pts;
            if (!match.round) {
                groupPoints += pts;
                if (pred.home === match.homeScore && pred.away === match.awayScore) exactCount++;
            } else {
                knockoutPoints += pts;
            }
        }
    });

    return { totalPoints, groupPoints, knockoutPoints, exactCount };
};

// Same tie-break order as Leaderboard.tsx's liveRanked sort (totalPoints,
// then exactCount, then knockoutPoints).
export const computeFinalRank = (
    targetEmail: string,
    users: UserProfile[],
    matches: Match[],
    allPredictions: Prediction[],
    teams: Record<string, Team>
): { rank: number; totalPlayers: number; score: UserFinalScore } => {
    const ranked = users
        .map(u => ({ email: u.email, ...computeUserFinalScore(u, matches, allPredictions, teams) }))
        .sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
            if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount;
            return b.knockoutPoints - a.knockoutPoints;
        });
    const idx = ranked.findIndex(u => u.email === targetEmail);
    const score = idx === -1
        ? { totalPoints: 0, groupPoints: 0, knockoutPoints: 0, exactCount: 0 }
        : ranked[idx];
    return { rank: idx === -1 ? -1 : idx + 1, totalPlayers: ranked.length, score };
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
    // Uses match.round (not match.groupId) as the League-Phase/Knockout discriminator — the two
    // are equivalent for existing World Cup data (a group match never has both set), but only
    // .round holds for League Phase matches, which never populate groupId at all.
    if (!!match.round && finalHome === finalAway) {
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

        // scope values are named after the old World Cup UI ('GROUPS'/'KNOCKOUT') but the
        // underlying discriminator is match.round, which also correctly covers the new League
        // Phase (no round) vs Knockout Phase (round set) split.
        const inScope = (scope === 'GROUPS' && !m.round) ||
                        (scope === 'KNOCKOUT' && !!m.round) ||
                        (scope === 'ALL');

        if (inScope) {
             return { ...m, homeScore: null, awayScore: null };
        }
        return m;
    });

    currentMatches = updateBracket(currentMatches, teams);

    for (let i = 0; i < 7; i++) {
        const matchesToPredict = currentMatches.filter((m: Match) => {
            if (!!m.round && m.homeScore !== null && m.awayScore !== null) {
                if (m.homeScore === m.awayScore) return true;
            }

            if (m.homeScore !== null && m.awayScore !== null) return false;
            if (m.homeTeamId === 'TBD' || m.awayTeamId === 'TBD') return false;
            if (scope === 'GROUPS' && !!m.round) return false;
            if (scope === 'KNOCKOUT' && !m.round) return false;
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
    const currentPts = calculatePoints(userPred.home, userPred.away, match.homeScore, match.awayScore, match.round, resolvePenaltySide(userPred.predictedWinnerId, match), resolvePenaltySide(match.penaltyWinnerId, match));
    if (match.round) {
        if (currentPts > 0) return lang.analysisCorrectWinner;
        return lang.analysisIncorrectWinner;
    }
    if (currentPts === exactPointsForRound(match.round)) return lang.analysisExact;
    return lang.analysisResult;
};

export const getLiveScenarios = (
  match: Match,
  userPred: Prediction,
  user: UserProfile
): { current: number; ifHome: number; ifAway: number } => {
  if (match.homeScore === null || match.awayScore === null) return { current: 0, ifHome: 0, ifAway: 0 };
  const current = calculatePoints(userPred.home, userPred.away, match.homeScore, match.awayScore, match.round, resolvePenaltySide(userPred.predictedWinnerId, match), resolvePenaltySide(match.penaltyWinnerId, match));
  const ifHome = calculatePoints(userPred.home, userPred.away, match.homeScore + 1, match.awayScore, match.round);
  const ifAway = calculatePoints(userPred.home, userPred.away, match.homeScore, match.awayScore + 1, match.round);
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

// ── ADMIN "TIME TRAVEL" (real 2024/25 results) ───────────────────────────────
// Lets an admin replay the REAL historical results of the League Phase matches
// (pulled once via scripts/pull-real-cl-2024-results.mjs, keyed by the same
// match ids seeded into Supabase) onto however many matchdays they choose —
// for testing standings/knockout behavior against authentic result patterns
// instead of hand-typing scores one match at a time.
export interface RealResultsMap { [matchId: string]: { home: number; away: number } }

export const buildRealResultReveal = (
  matches: Match[],
  upToMatchday: number,
  realResults: RealResultsMap
): { id: string; home_score: number; away_score: number; status: string; is_locked: boolean }[] => {
  return matches
    .filter(m => !m.round && m.matchday != null && m.matchday <= upToMatchday && realResults[m.id])
    .map(m => ({
      id: m.id,
      home_score: realResults[m.id].home,
      away_score: realResults[m.id].away,
      status: 'FINISHED',
      is_locked: true,
    }));
};

export const buildFutureReset = (
  matches: Match[]
): { id: string; home_score: null; away_score: null; status: string; is_locked: boolean }[] => {
  return matches
    .filter(m => !m.round)
    .map(m => ({ id: m.id, home_score: null, away_score: null, status: 'UPCOMING', is_locked: false }));
};