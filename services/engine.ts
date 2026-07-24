import { Match, Team, GroupStanding, LeagueStanding, Round, Prediction, UserProfile, Translation, HeadToHeadStats, HistoricalMatch, MatchHistoryItem, ScoutingData, LanguageCode, TeamFormData } from '../types';
import { GROUP_CONFIG, INITIAL_MATCHES } from '../constants';
import { supabase } from '../supabase';

export const SCORING_RULES = {
  GROUP_EXACT: 5,
  GROUP_RESULT: 3,
  R32: 8,
  PO: 8, // Swiss-format Playoff Round — same tier R32 occupied in the old World Cup bracket
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
    // Knockout match results score 0 — points come only from bracket qualification
    // (which team advances through each round), handled by getQualifiedRounds.
    return 0;
  } else {
    if (predHome === actualHome && predAway === actualAway) {
        basePoints = SCORING_RULES.GROUP_EXACT;
    } else {
        const predRes = predHome > predAway ? 'HOME' : predHome < predAway ? 'AWAY' : 'DRAW';
        const actualRes = actualHome > actualAway ? 'HOME' : actualHome < actualAway ? 'AWAY' : 'DRAW';
        if (predRes === actualRes) basePoints = SCORING_RULES.GROUP_RESULT;
    }
  }

  const penaltyRounds: Round[] = ['R32', 'PO', 'R16', 'QF', 'SF', 'FIN', '3RD'];
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
                 const penaltyRounds: Round[] = ['R32', 'PO', 'R16', 'QF', 'SF', 'FIN', '3RD'];
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

// EXPLICIT FIFA KNOCKOUT PROGRESSION MAP (Article 12)
// This ensures that regardless of DB next_match_id flaws, teams route perfectly.
const KNOCKOUT_PROGRESSION: Record<string, { nextId: string, slot: 'home' | 'away' }> = {
    // Round of 32 to Round of 16 — derived from actual DB team placements (real FIFA 2026 draw)
    'R32_1':  { nextId: 'R16_1', slot: 'home' }, // CAN → R16_1 home
    'R32_2':  { nextId: 'R16_2', slot: 'home' }, // BRA → R16_2 home
    'R32_3':  { nextId: 'R16_3', slot: 'home' }, // PAR → R16_3 home
    'R32_4':  { nextId: 'R16_1', slot: 'away' }, // MAR → R16_1 away
    'R32_5':  { nextId: 'R16_2', slot: 'away' }, // NOR → R16_2 away
    'R32_6':  { nextId: 'R16_3', slot: 'away' }, // FRA → R16_3 away
    'R32_7':  { nextId: 'R16_5', slot: 'home' }, // USA → R16_5 home
    'R32_8':  { nextId: 'R16_7', slot: 'away' }, // EGY → R16_7 away
    'R32_9':  { nextId: 'R16_7', slot: 'home' }, // ARG → R16_7 home
    'R32_10': { nextId: 'R16_4', slot: 'home' }, // MEX → R16_4 home
    'R32_11': { nextId: 'R16_4', slot: 'away' }, // ENG → R16_4 away
    'R32_12': { nextId: 'R16_5', slot: 'away' }, // BEL → R16_5 away
    'R32_13': { nextId: 'R16_6', slot: 'home' }, // POR → R16_6 home
    'R32_14': { nextId: 'R16_8', slot: 'away' }, // COL → R16_8 away
    'R32_15': { nextId: 'R16_6', slot: 'away' }, // ESP → R16_6 away
    'R32_16': { nextId: 'R16_8', slot: 'home' }, // SUI → R16_8 home
    // Round of 16 to Quarter Finals — derived from actual DB QF teams (FRA/MAR→QF_1, NOR/ENG→QF_2, ESP/BEL→QF_3)
    'R16_1': { nextId: 'QF_1', slot: 'away' }, // MAR → QF_1 away
    'R16_2': { nextId: 'QF_2', slot: 'home' }, // NOR → QF_2 home
    'R16_3': { nextId: 'QF_1', slot: 'home' }, // FRA → QF_1 home
    'R16_4': { nextId: 'QF_2', slot: 'away' }, // ENG → QF_2 away
    'R16_5': { nextId: 'QF_3', slot: 'away' }, // BEL → QF_3 away
    'R16_6': { nextId: 'QF_3', slot: 'home' }, // ESP → QF_3 home
    'R16_7': { nextId: 'QF_4', slot: 'home' }, 
    'R16_8': { nextId: 'QF_4', slot: 'away' }, 
    // Quarter Finals to Semi Finals — DB: SF_1=FRA/ESP (QF_1,QF_3), SF_2=ENG/ARG (QF_2,QF_4)
    'QF_1': { nextId: 'SF_1', slot: 'home' }, // FRA → SF_1 home
    'QF_2': { nextId: 'SF_2', slot: 'home' }, // ENG → SF_2 home (was SF_1 away — FIXED)
    'QF_3': { nextId: 'SF_1', slot: 'away' }, // ESP → SF_1 away (was SF_2 home — FIXED)
    'QF_4': { nextId: 'SF_2', slot: 'away' }, // ARG → SF_2 away
    // Semi Finals to Final / 3rd Place
    'SF_1': { nextId: 'FIN_1', slot: 'home' },
    'SF_2': { nextId: 'FIN_1', slot: 'away' },
};

// ─── Swiss-format Knockout Phase (Champions League 2026/27+) ────────────────
// Two-legged aggregate ties, id convention `{ROUND}_{tieIndex}_L{leg}` (e.g.
// `PO_3_L1`/`PO_3_L2`). The Final stays a single match (`FIN_1`, no leg
// suffix) — matches real UEFA CL format. This lives alongside the untouched
// World Cup single-match bracket logic below (KNOCKOUT_PROGRESSION,
// third-place solver) rather than replacing it: the two schemes touch
// disjoint match-id namespaces, so both can safely run over the same
// `updateBracket` call — each one simply finds nothing to do when the other
// scheme's data is what's actually present. This keeps every existing
// consumer of updateBracket/applyPredictionsToBracket (Leaderboard,
// ManagerHub, MyPredictions, App.tsx's World Cup recap) working unchanged.

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
        // Real teams already known from DB (SC base or live synced) — don't overwrite
        if (match.homeTeamId !== 'TBD' && match.awayTeamId !== 'TBD') return;

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

// ─── Historical (frozen) knockout routing ───────────────────────────────────
// KNOCKOUT_PROGRESSION above reflects the CURRENT, corrected real-world bracket
// and must keep tracking reality for live scoring. But a player's R16+ picks
// were made against whatever routing was on screen AT THE TIME — which has
// since been corrected twice (commits 32ed16d, c80b865). Replaying old picks
// through the current map silently reassigns them to different teams. This
// frozen snapshot is verified byte-identical to git commits d450b595 (live
// right before R32_1 kickoff — the non-SC deadline) and e2cc8eef (live right
// before R32_2 kickoff — the SC deadline): both audiences saw the same
// routing, so one table serves both. Use ONLY to reconstruct "what did this
// player predict" for display; never for real-match bracket progression.
const HISTORICAL_KNOCKOUT_PROGRESSION: Record<string, { nextId: string, slot: 'home' | 'away' }> = {
    'R32_1':  { nextId: 'R16_2', slot: 'home' },
    'R32_2':  { nextId: 'R16_1', slot: 'home' },
    'R32_3':  { nextId: 'R16_2', slot: 'away' },
    'R32_4':  { nextId: 'R16_3', slot: 'home' },
    'R32_5':  { nextId: 'R16_1', slot: 'away' },
    'R32_6':  { nextId: 'R16_3', slot: 'away' },
    'R32_7':  { nextId: 'R16_4', slot: 'home' },
    'R32_8':  { nextId: 'R16_4', slot: 'away' },
    'R32_9':  { nextId: 'R16_6', slot: 'home' },
    'R32_10': { nextId: 'R16_6', slot: 'away' },
    'R32_11': { nextId: 'R16_5', slot: 'home' },
    'R32_12': { nextId: 'R16_5', slot: 'away' },
    'R32_13': { nextId: 'R16_8', slot: 'home' },
    'R32_14': { nextId: 'R16_7', slot: 'home' },
    'R32_15': { nextId: 'R16_8', slot: 'away' },
    'R32_16': { nextId: 'R16_7', slot: 'away' },
    'R16_1': { nextId: 'QF_1', slot: 'home' },
    'R16_2': { nextId: 'QF_1', slot: 'away' },
    'R16_3': { nextId: 'QF_3', slot: 'home' },
    'R16_4': { nextId: 'QF_3', slot: 'away' },
    'R16_5': { nextId: 'QF_2', slot: 'home' },
    'R16_6': { nextId: 'QF_2', slot: 'away' },
    'R16_7': { nextId: 'QF_4', slot: 'home' },
    'R16_8': { nextId: 'QF_4', slot: 'away' },
    'QF_1': { nextId: 'SF_1', slot: 'home' },
    'QF_2': { nextId: 'SF_1', slot: 'away' },
    'QF_3': { nextId: 'SF_2', slot: 'home' },
    'QF_4': { nextId: 'SF_2', slot: 'away' },
    'SF_1': { nextId: 'FIN_1', slot: 'home' },
    'SF_2': { nextId: 'FIN_1', slot: 'away' },
};

// Rebuilds a player's own predicted bracket for display. R32 team identity is
// taken as-is from `baseMatches` (already resolved by the caller — real R32
// results for SC players, or the player's own group-stage cascade for
// non-SC). R16+ team identity is resolved from each match's stored
// `predictedWinnerId` (the authoritative record of what the player actually
// picked, now backfilled correctly), routed forward through
// HISTORICAL_KNOCKOUT_PROGRESSION rather than the live/current map. Falls
// back to deriving the winner from home/away scores only when
// predictedWinnerId is missing for a match.
export const resolvePredictedKnockoutBracket = (
    baseMatches: Match[],
    userPredictions: Prediction[]
): Match[] => {
    const next = baseMatches.map(m => ({ ...m }));
    const predsMap = new Map(userPredictions.map(p => [p.matchId, p]));
    const winnerOf = (matchId: string): string | undefined => {
        const w = predsMap.get(matchId)?.predictedWinnerId;
        return w && !w.startsWith('TBD') ? w : undefined;
    };

    // R16+ identity must be rebuilt from historical routing, not whatever the
    // base bracket (built with the current/live map) already assigned.
    next.forEach(m => {
        if (m.round && m.round !== 'R32') {
            m.homeTeamId = 'TBD';
            m.awayTeamId = 'TBD';
        }
    });

    (['R32', 'R16', 'QF', 'SF'] as const).forEach(round => {
        next.filter(m => m.round === round).forEach(match => {
            const prog = HISTORICAL_KNOCKOUT_PROGRESSION[match.id];
            if (!prog) return;

            let winnerId = winnerOf(match.id);
            if (!winnerId && match.homeScore !== null && match.awayScore !== null &&
                match.homeTeamId !== 'TBD' && match.awayTeamId !== 'TBD') {
                if (match.homeScore > match.awayScore) winnerId = match.homeTeamId;
                else if (match.awayScore > match.homeScore) winnerId = match.awayTeamId;
            }
            if (!winnerId) return;

            const nextMatch = next.find(m => m.id === prog.nextId);
            if (nextMatch) {
                if (prog.slot === 'home') nextMatch.homeTeamId = winnerId;
                else nextMatch.awayTeamId = winnerId;
            }

            // 3rd place match is fed by the SF losers.
            if (round === 'SF' && (match.id === 'SF_1' || match.id === 'SF_2')) {
                const loserId = winnerId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
                const thirdPlaceMatch = next.find(m => m.id === '3RD_1');
                if (thirdPlaceMatch && loserId && loserId !== 'TBD') {
                    if (match.id === 'SF_1') thirdPlaceMatch.homeTeamId = loserId;
                    else thirdPlaceMatch.awayTeamId = loserId;
                }
            }
        });
    });

    return next;
};

export interface QualifiedRound {
    key: string;
    label: string;
    correctTeams: string[];
    pointsPerTeam: number;
    totalSlots: number;
    penaltyApplied: boolean;
    totalPoints: number;
}

export const getQualifiedRounds = (
    realMatches: Match[],
    userPredictions: Prediction[],
    user: UserProfile,
    teams: Record<string, Team>,
    precomputedRealBracket?: Match[]
): QualifiedRound[] => {
    const bracketPreds = user.bracketPredictions
        ? userPredictions.map(p =>
              /^[A-L]\d$/.test(p.matchId) && user.bracketPredictions![p.matchId]
                  ? { ...p, ...user.bracketPredictions![p.matchId] }
                  : p
          )
        : userPredictions;
    const standardBracket = applyPredictionsToBracket(INITIAL_MATCHES, teams, bracketPreds);
    const unlockedRealMatches = realMatches.map(m => ({ ...m, isLocked: false }));
    const secondChanceBracket = user.hasTakenSecondChance
        ? applyPredictionsToBracket(unlockedRealMatches, teams, userPredictions)
        : standardBracket;
    const computedRealBracket = precomputedRealBracket ?? applyPredictionsToBracket(realMatches, teams, []);

    const getTeamsInRound = (matchList: Match[], round: Round | 'R32_START') => {
        const teamSet = new Set<string>();
        const targetMatches = matchList.filter(m => round === 'R32_START' ? m.round === 'R32' : m.round === round);
        targetMatches.forEach(m => {
            if (m.homeTeamId && !m.homeTeamId.startsWith('TBD')) teamSet.add(m.homeTeamId);
            if (m.awayTeamId && !m.awayTeamId.startsWith('TBD')) teamSet.add(m.awayTeamId);
        });
        return teamSet;
    };

    const rounds = [
        { key: 'R32_START', label: 'Round of 32', points: SCORING_RULES.GROUP_RESULT, totalSlots: 32 },
        { key: 'R16', label: 'Round of 16', points: SCORING_RULES.R32, totalSlots: 16 },
        { key: 'QF', label: 'Quarter Finals', points: SCORING_RULES.R16, totalSlots: 8 },
        { key: 'SF', label: 'Semi Finals', points: SCORING_RULES.QF, totalSlots: 4 },
        { key: 'FIN', label: 'Final', points: SCORING_RULES.SF, totalSlots: 2 },
        { key: 'CHAMP', label: 'Champion', points: SCORING_RULES.FIN, totalSlots: 1 }
    ];

    const getChamp = (matchList: Match[]) => {
        const fin = matchList.find(m => m.round === 'FIN');
        if (fin && fin.homeScore !== null && fin.awayScore !== null) {
            return fin.homeScore > fin.awayScore ? fin.homeTeamId : fin.awayTeamId;
        }
        return null;
    };

    const realChamp = getChamp(computedRealBracket);
    const standardChamp = getChamp(standardBracket);
    const secondChanceChamp = getChamp(secondChanceBracket);

    // For KO rounds: "teams predicted to reach this round" = predictedWinnerId of the prior round's matches.
    // This bypasses the cascade entirely and uses the stored, routing-corrected DB values.
    // Feeding round prefix per display round: R16←R32, QF←R16, SF←QF, FIN←SF.
    const FEEDING_ROUND: Record<string, string> = { R16: 'R32', QF: 'R16', SF: 'QF', FIN: 'SF' };

    const getTeamsFromPredictedWinners = (feedingPrefix: string): Set<string> => {
        const teamSet = new Set<string>();
        userPredictions.forEach(p => {
            if (p.matchId.startsWith(feedingPrefix + '_') && p.predictedWinnerId && !p.predictedWinnerId.startsWith('TBD')) {
                teamSet.add(p.predictedWinnerId);
            }
        });
        return teamSet;
    };

    // User's predicted champion — prefer stored predictedWinnerId over cascade.
    const storedUserChamp = userPredictions.find(p => p.matchId === 'FIN_1')?.predictedWinnerId ?? null;

    const result: QualifiedRound[] = [];

    rounds.forEach(r => {
        let correctTeams: string[] = [];
        let pointsPerTeam = r.points;
        let penaltyApplied = false;

        let targetBracket = standardBracket;
        let userChamp = storedUserChamp ?? standardChamp;

        if (r.key !== 'R32_START' && user.hasTakenSecondChance) {
            targetBracket = secondChanceBracket;
            userChamp = storedUserChamp ?? secondChanceChamp;
            penaltyApplied = true;
            pointsPerTeam = Math.floor(pointsPerTeam * 0.5);
        }

        if (r.key === 'CHAMP') {
            if (realChamp && userChamp && realChamp === userChamp && !realChamp.startsWith('TBD')) {
                correctTeams = [realChamp];
            }
        } else {
            const realTeams = getTeamsInRound(computedRealBracket, r.key as any);
            const feedingPrefix = FEEDING_ROUND[r.key];
            let userTeams: Set<string>;
            if (feedingPrefix) {
                const fromDB = getTeamsFromPredictedWinners(feedingPrefix);
                // Fall back to cascade only if no predictedWinnerId data available.
                userTeams = fromDB.size > 0 ? fromDB : getTeamsInRound(targetBracket, r.key as any);
            } else {
                userTeams = getTeamsInRound(targetBracket, r.key as any);
            }
            realTeams.forEach(t => { if (userTeams.has(t)) correctTeams.push(t); });
        }

        if (correctTeams.length === 0) return;

        result.push({
            key: r.key,
            label: r.label,
            correctTeams,
            pointsPerTeam,
            totalSlots: r.totalSlots,
            penaltyApplied,
            totalPoints: correctTeams.length * pointsPerTeam
        });
    });

    return result;
};

// ─── Swiss-format bracket qualification bonus (League Phase + Knockout) ────
// Parallel to getQualifiedRounds above (left untouched — it still serves the
// concluded World Cup's historical scoring for Leaderboard/ManagerHub). Same
// overall shape, adapted for the Swiss format:
//  - "Reached the knockout phase" (top 24) is read directly off League Phase
//    standings rather than scanned from first-knockout-round match
//    participants, because Swiss has bye teams (seeds 1-8) who never appear
//    in a Playoff Round match at all.
//  - The Round of 16 bonus only rewards the 8 *earned* slots (Playoff Round
//    winners) — the 8 automatic byes are a standings fact already rewarded
//    once, at the knockout-phase-qualification step, not a fresh prediction.
// Note: until real League Phase fixtures replace the World Cup placeholder
// data in constants.ts's INITIAL_MATCHES, the "standard" (non-live) bracket
// this computes bonus points from will be empty of Swiss-shaped matches, so
// this correctly returns zero bonus points rather than anything meaningful —
// that's expected, not a bug, until real data is seeded.
export const getQualifiedRoundsSwiss = (
    realMatches: Match[],
    userPredictions: Prediction[],
    user: UserProfile,
    teams: Record<string, Team>,
    precomputedRealBracket?: Match[]
): QualifiedRound[] => {
    const standardBracket = applyPredictionsToBracket(INITIAL_MATCHES, teams, userPredictions);
    const unlockedRealMatches = realMatches.map(m => ({ ...m, isLocked: false }));
    const secondChanceBracket = user.hasTakenSecondChance
        ? applyPredictionsToBracket(unlockedRealMatches, teams, userPredictions)
        : standardBracket;
    const computedRealBracket = precomputedRealBracket ?? applyPredictionsToBracket(realMatches, teams, []);

    const getTop24 = (bracket: Match[]) =>
        new Set(calculateLeagueStandings(bracket, teams).slice(0, 24).map(s => s.teamId));

    const getTeamsInRound = (matchList: Match[], round: Round) => {
        const teamSet = new Set<string>();
        matchList.filter(m => m.round === round).forEach(m => {
            if (m.homeTeamId && !m.homeTeamId.startsWith('TBD')) teamSet.add(m.homeTeamId);
            if (m.awayTeamId && !m.awayTeamId.startsWith('TBD')) teamSet.add(m.awayTeamId);
        });
        return teamSet;
    };

    // Teams that reached R16 via a Playoff Round tie — excludes seeds 1-8's automatic byes.
    const getEarnedR16Teams = (bracket: Match[]): Set<string> => {
        const poTeams = getTeamsInRound(bracket, 'PO');
        const r16Teams = getTeamsInRound(bracket, 'R16');
        return new Set([...r16Teams].filter(t => poTeams.has(t)));
    };

    const rounds = [
        { key: 'PO_START', label: 'Knockout Phase', points: SCORING_RULES.GROUP_RESULT, totalSlots: 24 },
        { key: 'R16', label: 'Round of 16', points: SCORING_RULES.PO, totalSlots: 16 },
        { key: 'QF', label: 'Quarter Finals', points: SCORING_RULES.R16, totalSlots: 8 },
        { key: 'SF', label: 'Semi Finals', points: SCORING_RULES.QF, totalSlots: 4 },
        { key: 'FIN', label: 'Final', points: SCORING_RULES.SF, totalSlots: 2 },
        { key: 'CHAMP', label: 'Champion', points: SCORING_RULES.FIN, totalSlots: 1 }
    ];

    const getChamp = (matchList: Match[]) => {
        const fin = matchList.find(m => m.round === 'FIN');
        if (fin && fin.homeScore !== null && fin.awayScore !== null) {
            return fin.homeScore > fin.awayScore ? fin.homeTeamId : fin.awayTeamId;
        }
        return null;
    };

    const realChamp = getChamp(computedRealBracket);
    const standardChamp = getChamp(standardBracket);
    const secondChanceChamp = getChamp(secondChanceBracket);

    const FEEDING_ROUND: Record<string, string> = { R16: 'PO', QF: 'R16', SF: 'QF', FIN: 'SF' };

    const getTeamsFromPredictedWinners = (feedingPrefix: string): Set<string> => {
        const teamSet = new Set<string>();
        userPredictions.forEach(p => {
            if (p.matchId.startsWith(feedingPrefix + '_') && p.predictedWinnerId && !p.predictedWinnerId.startsWith('TBD')) {
                teamSet.add(p.predictedWinnerId);
            }
        });
        return teamSet;
    };

    const storedUserChamp = userPredictions.find(p => p.matchId === 'FIN_1')?.predictedWinnerId ?? null;

    const result: QualifiedRound[] = [];

    rounds.forEach(r => {
        let correctTeams: string[] = [];
        let pointsPerTeam = r.points;
        let penaltyApplied = false;

        let targetBracket = standardBracket;
        let userChamp = storedUserChamp ?? standardChamp;

        if (r.key !== 'PO_START' && user.hasTakenSecondChance) {
            targetBracket = secondChanceBracket;
            userChamp = storedUserChamp ?? secondChanceChamp;
            penaltyApplied = true;
            pointsPerTeam = Math.floor(pointsPerTeam * 0.5);
        }

        if (r.key === 'CHAMP') {
            if (realChamp && userChamp && realChamp === userChamp && !realChamp.startsWith('TBD')) {
                correctTeams = [realChamp];
            }
        } else if (r.key === 'PO_START') {
            const realTop24 = getTop24(computedRealBracket);
            const userTop24 = getTop24(targetBracket);
            realTop24.forEach(t => { if (userTop24.has(t)) correctTeams.push(t); });
        } else if (r.key === 'R16') {
            const realEarnedR16 = getEarnedR16Teams(computedRealBracket);
            const fromDB = getTeamsFromPredictedWinners('PO');
            const userTeams = fromDB.size > 0 ? fromDB : getTeamsInRound(targetBracket, 'R16');
            realEarnedR16.forEach(t => { if (userTeams.has(t)) correctTeams.push(t); });
        } else {
            const realTeams = getTeamsInRound(computedRealBracket, r.key as Round);
            const feedingPrefix = FEEDING_ROUND[r.key];
            let userTeams: Set<string>;
            if (feedingPrefix) {
                const fromDB = getTeamsFromPredictedWinners(feedingPrefix);
                userTeams = fromDB.size > 0 ? fromDB : getTeamsInRound(targetBracket, r.key as Round);
            } else {
                userTeams = getTeamsInRound(targetBracket, r.key as Round);
            }
            realTeams.forEach(t => { if (userTeams.has(t)) correctTeams.push(t); });
        }

        if (correctTeams.length === 0) return;

        result.push({
            key: r.key,
            label: r.label,
            correctTeams,
            pointsPerTeam,
            totalSlots: r.totalSlots,
            penaltyApplied,
            totalPoints: correctTeams.length * pointsPerTeam
        });
    });

    return result;
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
// caller needing "this player's score" reuses the same calculatePoints +
// getQualifiedRounds combination instead of re-deriving it.
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
            const pts = calculatePoints(pred.home, pred.away, match.homeScore, match.awayScore, user.hasTakenSecondChance || false, match.round);
            totalPoints += pts;
            if (match.groupId) {
                groupPoints += pts;
                if (pred.home === match.homeScore && pred.away === match.awayScore) exactCount++;
            } else {
                knockoutPoints += pts;
            }
        }
    });

    const bracketQualPoints = getQualifiedRounds(
        matches,
        allPredictions.filter(p => p.userId === user.email),
        user,
        teams
    ).reduce((sum, qr) => sum + qr.totalPoints, 0);
    totalPoints += bracketQualPoints;
    knockoutPoints += bracketQualPoints;

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