/**
 * Backfill predicted_winner_id for all existing knockout predictions.
 *
 * For each user this script:
 *   1. Reconstructs their full bracket by cascading group predictions → R32 slots,
 *      then applying their knockout picks round by round (using current/new routing).
 *   2. For each knockout match where both teams are known and the user has a prediction,
 *      stores which team they predicted to win as predicted_winner_id.
 *
 * Run AFTER adding the column:
 *   ALTER TABLE predictions ADD COLUMN IF NOT EXISTS predicted_winner_id TEXT;
 *
 * Usage:
 *   node scripts/backfill-predicted-winners.js          (dry run — prints plan)
 *   node scripts/backfill-predicted-winners.js --write  (actually updates DB)
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const WRITE = process.argv.includes('--write');

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Bracket constants (mirrors constants.ts + engine.ts) ────────────────────

const GROUP_CONFIG = [
  { id: 'A', teams: ['MEX', 'RSA', 'KOR', 'CZE'] },
  { id: 'B', teams: ['CAN', 'BIH', 'QAT', 'SUI'] },
  { id: 'C', teams: ['BRA', 'MAR', 'HAI', 'SCO'] },
  { id: 'D', teams: ['USA', 'PAR', 'AUS', 'TUR'] },
  { id: 'E', teams: ['GER', 'CUW', 'CIV', 'ECU'] },
  { id: 'F', teams: ['NED', 'JPN', 'SWE', 'TUN'] },
  { id: 'G', teams: ['BEL', 'EGY', 'IRN', 'NZL'] },
  { id: 'H', teams: ['ESP', 'CPV', 'KSA', 'URU'] },
  { id: 'I', teams: ['FRA', 'SEN', 'IRQ', 'NOR'] },
  { id: 'J', teams: ['ARG', 'ALG', 'AUT', 'JOR'] },
  { id: 'K', teams: ['POR', 'COD', 'UZB', 'COL'] },
  { id: 'L', teams: ['ENG', 'CRO', 'GHA', 'PAN'] },
];

// ORIGINAL routing — exactly what was live from May 31 through June 27, the entire
// period players made their initial predictions. Verified from git history commit c8ebccb
// (June 10) and 4a0c7d0 (May 31).  The R32→R16 first 6 entries differ from later versions;
// R16→QF and QF onwards are unchanged throughout.
//
// Key differences vs. post-June-28 routing:
//   R32_1→R16_2h, R32_2→R16_1h, R32_3→R16_2a, R32_4→R16_3h, R32_5→R16_1a
//   R16_2→QF_1a, R16_3→QF_3h
const KNOCKOUT_PROGRESSION = {
  // R32 → R16  (original May–June 27 layout)
  'R32_1':  { nextId: 'R16_2', slot: 'home' },  // A2/B2 → R16_2 home
  'R32_2':  { nextId: 'R16_1', slot: 'home' },  // E1/3rd → R16_1 home
  'R32_3':  { nextId: 'R16_2', slot: 'away' },  // F1/C2 → R16_2 away
  'R32_4':  { nextId: 'R16_3', slot: 'home' },  // C1/F2 → R16_3 home
  'R32_5':  { nextId: 'R16_1', slot: 'away' },  // I1/3rd → R16_1 away (Group I winner path)
  'R32_6':  { nextId: 'R16_3', slot: 'away' },  // E2/I2 → R16_3 away  (Group I runner-up path)
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
  // R16 → QF  (same in all versions)
  'R16_1': { nextId: 'QF_1', slot: 'home' },
  'R16_2': { nextId: 'QF_1', slot: 'away' },  // original: R16_2 winner → QF_1 away
  'R16_3': { nextId: 'QF_3', slot: 'home' },  // original: R16_3 winner → QF_3 home (I runner-up path)
  'R16_4': { nextId: 'QF_3', slot: 'away' },
  'R16_5': { nextId: 'QF_2', slot: 'home' },
  'R16_6': { nextId: 'QF_2', slot: 'away' },
  'R16_7': { nextId: 'QF_4', slot: 'home' },
  'R16_8': { nextId: 'QF_4', slot: 'away' },
  // QF → SF → FIN (unchanged in all versions)
  'QF_1': { nextId: 'SF_1', slot: 'home' },
  'QF_2': { nextId: 'SF_1', slot: 'away' },
  'QF_3': { nextId: 'SF_2', slot: 'home' },
  'QF_4': { nextId: 'SF_2', slot: 'away' },
  'SF_1': { nextId: 'FIN_1', slot: 'home' },
  'SF_2': { nextId: 'FIN_1', slot: 'away' },
};

// ─── Build INITIAL_MATCHES (mirrors constants.ts) ────────────────────────────

function buildInitialMatches() {
  const matches = [];

  // Group matches
  GROUP_CONFIG.forEach(({ id, teams: [t1, t2, t3, t4] }) => {
    matches.push({ id: `${id}1`, groupId: id, homeTeamId: t1, awayTeamId: t2, homeScore: null, awayScore: null, round: null });
    matches.push({ id: `${id}2`, groupId: id, homeTeamId: t3, awayTeamId: t4, homeScore: null, awayScore: null, round: null });
    matches.push({ id: `${id}3`, groupId: id, homeTeamId: t1, awayTeamId: t3, homeScore: null, awayScore: null, round: null });
    matches.push({ id: `${id}4`, groupId: id, homeTeamId: t4, awayTeamId: t2, homeScore: null, awayScore: null, round: null });
    matches.push({ id: `${id}5`, groupId: id, homeTeamId: t4, awayTeamId: t1, homeScore: null, awayScore: null, round: null });
    matches.push({ id: `${id}6`, groupId: id, homeTeamId: t2, awayTeamId: t3, homeScore: null, awayScore: null, round: null });
  });

  // Knockout placeholders
  const rounds = ['R32', 'R16', 'QF', 'SF', '3RD', 'FIN'];
  const counts = [16,    8,    4,   2,    1,    1  ];
  rounds.forEach((round, idx) => {
    for (let i = 1; i <= counts[idx]; i++) {
      matches.push({ id: `${round}_${i}`, round, groupId: null, homeTeamId: 'TBD', awayTeamId: 'TBD', homeScore: null, awayScore: null });
    }
  });

  return matches;
}

// ─── Group standings (mirrors engine.ts calculateGroupStandings) ─────────────

function calculateGroupStandings(groupId, matches) {
  const cfg = GROUP_CONFIG.find(g => g.id === groupId);
  const standingsMap = {};
  cfg.teams.forEach(tId => {
    standingsMap[tId] = { teamId: tId, pts: 0, gf: 0, ga: 0, gd: 0 };
  });

  matches
    .filter(m => m.groupId === groupId && m.homeScore !== null && m.awayScore !== null)
    .forEach(m => {
      const h = standingsMap[m.homeTeamId];
      const a = standingsMap[m.awayTeamId];
      if (!h || !a) return;
      h.gf += m.homeScore; h.ga += m.awayScore; h.gd = h.gf - h.ga;
      a.gf += m.awayScore; a.ga += m.homeScore; a.gd = a.gf - a.ga;
      if (m.homeScore > m.awayScore) { h.pts += 3; }
      else if (m.awayScore > m.homeScore) { a.pts += 3; }
      else { h.pts += 1; a.pts += 1; }
    });

  return Object.values(standingsMap).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
}

function getAllGroupStandings(matches) {
  const result = {};
  GROUP_CONFIG.forEach(({ id }) => { result[id] = calculateGroupStandings(id, matches); });
  return result;
}

function getThirdPlaceStandings(allGroupStandings) {
  const thirds = [];
  Object.entries(allGroupStandings).forEach(([gid, group]) => {
    if (group.length >= 3) thirds.push({ ...group[2], groupId: gid });
  });
  return thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return b.won - a.won;
  });
}

// ─── updateBracket (mirrors engine.ts) ───────────────────────────────────────

function updateBracket(matches) {
  const groupResults = getAllGroupStandings(matches);
  const getTeam = (gid, rank) => groupResults[gid]?.[rank - 1]?.teamId || 'TBD';

  const thirds = getThirdPlaceStandings(groupResults);
  const qualifiedThirds = thirds.slice(0, 8);

  const thirdPlaceSlots = [
    { matchId: 'R32_2',  allowedGroups: ['A','B','C','D','F'],     teamId: 'TBD' },
    { matchId: 'R32_5',  allowedGroups: ['C','D','F','G','H'],     teamId: 'TBD' },
    { matchId: 'R32_7',  allowedGroups: ['C','E','F','H','I'],     teamId: 'TBD' },
    { matchId: 'R32_8',  allowedGroups: ['E','H','I','J','K'],     teamId: 'TBD' },
    { matchId: 'R32_9',  allowedGroups: ['B','E','F','I','J'],     teamId: 'TBD' },
    { matchId: 'R32_10', allowedGroups: ['A','E','H','I','J'],     teamId: 'TBD' },
    { matchId: 'R32_13', allowedGroups: ['E','F','G','I','J'],     teamId: 'TBD' },
    { matchId: 'R32_15', allowedGroups: ['D','E','I','J','L'],     teamId: 'TBD' },
  ];

  const assignThirds = (idx) => {
    if (idx === qualifiedThirds.length) return true;
    const team = qualifiedThirds[idx];
    for (let i = 0; i < thirdPlaceSlots.length; i++) {
      if (thirdPlaceSlots[i].teamId === 'TBD' && thirdPlaceSlots[i].allowedGroups.includes(team.groupId)) {
        thirdPlaceSlots[i].teamId = team.teamId;
        if (assignThirds(idx + 1)) return true;
        thirdPlaceSlots[i].teamId = 'TBD';
      }
    }
    return false;
  };
  assignThirds(0);

  const next = matches.map(m => ({ ...m }));

  const setMatchup = (matchId, home, away) => {
    const m = next.find(x => x.id === matchId);
    if (!m || (m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD')) return;
    if (m.homeTeamId !== home) { m.homeTeamId = home; m.homeScore = null; }
    if (m.awayTeamId !== away) { m.awayTeamId = away; m.awayScore = null; }
  };

  // R32 base assignments
  setMatchup('R32_1',  getTeam('A', 2), getTeam('B', 2));
  setMatchup('R32_3',  getTeam('F', 1), getTeam('C', 2));
  setMatchup('R32_4',  getTeam('C', 1), getTeam('F', 2));
  setMatchup('R32_6',  getTeam('E', 2), getTeam('I', 2));
  setMatchup('R32_11', getTeam('K', 2), getTeam('L', 2));
  setMatchup('R32_12', getTeam('H', 1), getTeam('J', 2));
  setMatchup('R32_14', getTeam('J', 1), getTeam('H', 2));
  setMatchup('R32_16', getTeam('D', 2), getTeam('G', 2));

  // R32 third-place assignments
  setMatchup('R32_2',  getTeam('E', 1), thirdPlaceSlots[0].teamId);
  setMatchup('R32_5',  getTeam('I', 1), thirdPlaceSlots[1].teamId);
  setMatchup('R32_7',  getTeam('A', 1), thirdPlaceSlots[2].teamId);
  setMatchup('R32_8',  getTeam('L', 1), thirdPlaceSlots[3].teamId);
  setMatchup('R32_9',  getTeam('D', 1), thirdPlaceSlots[4].teamId);
  setMatchup('R32_10', getTeam('G', 1), thirdPlaceSlots[5].teamId);
  setMatchup('R32_13', getTeam('B', 1), thirdPlaceSlots[6].teamId);
  setMatchup('R32_15', getTeam('K', 1), thirdPlaceSlots[7].teamId);

  // Knockout cascade
  ['R32', 'R16', 'QF', 'SF'].forEach(round => {
    next.filter(m => m.round === round).forEach(match => {
      const prog = KNOCKOUT_PROGRESSION[match.id];
      if (!prog) return;

      let winnerId = 'TBD';
      if (match.homeScore !== null && match.awayScore !== null &&
          match.homeTeamId !== 'TBD' && match.awayTeamId !== 'TBD') {
        if (match.homeScore > match.awayScore) winnerId = match.homeTeamId;
        else if (match.awayScore > match.homeScore) winnerId = match.awayTeamId;
      }

      const nextMatch = next.find(m => m.id === prog.nextId);
      if (!nextMatch) return;
      if (prog.slot === 'home') {
        if (nextMatch.homeTeamId !== winnerId) { nextMatch.homeTeamId = winnerId; nextMatch.homeScore = null; }
      } else {
        if (nextMatch.awayTeamId !== winnerId) { nextMatch.awayTeamId = winnerId; nextMatch.awayScore = null; }
      }
    });
  });

  return next;
}

// ─── applyPredictionsToBracket (mirrors engine.ts) ───────────────────────────

function applyPredictionsToBracket(initialMatches, userPredictions) {
  const predsMap = new Map(userPredictions.map(p => [p.matchId, p]));
  let current = initialMatches.map(m => ({ ...m }));

  for (let i = 0; i < 7; i++) {
    let hasChanges = false;
    current = current.map(m => {
      const pred = predsMap.get(m.id);
      if (pred && m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD') {
        if (m.homeScore !== pred.home || m.awayScore !== pred.away) {
          hasChanges = true;
          return { ...m, homeScore: pred.home, awayScore: pred.away };
        }
      }
      return m;
    });
    current = updateBracket(current);
    if (!hasChanges) break;
  }

  return current;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const INITIAL_MATCHES = buildInitialMatches();
  const KO_ROUNDS = new Set(['R32', 'R16', 'QF', 'SF', 'FIN', '3RD']);

  // Fetch all predictions
  console.log('Fetching predictions...');
  const allPreds = [];
  const PAGE = 1000;
  let from = 0;
  let keepGoing = true;
  while (keepGoing) {
    const { data, error } = await supabase.from('predictions').select('user_id, match_id, home, away, predicted_winner_id').range(from, from + PAGE - 1);
    if (error) { console.error('Fetch error:', error); break; }
    if (data && data.length > 0) { allPreds.push(...data); keepGoing = data.length === PAGE; from += PAGE; }
    else keepGoing = false;
  }
  console.log(`  Fetched ${allPreds.length} predictions`);

  // Group by user
  const byUser = {};
  allPreds.forEach(p => {
    if (!byUser[p.user_id]) byUser[p.user_id] = [];
    byUser[p.user_id].push({ matchId: p.match_id, home: p.home, away: p.away, existingWinnerId: p.predicted_winner_id });
  });

  const updates = [];
  let skipped = 0;

  for (const [userId, preds] of Object.entries(byUser)) {
    const koPreds = preds.filter(p => {
      // Only knockout match IDs (e.g. R32_1, R16_3, QF_2, SF_1, FIN_1, 3RD_1)
      return /^(R32|R16|QF|SF|FIN|3RD)_\d+$/.test(p.matchId);
    });

    if (koPreds.length === 0) continue;

    // Compute this user's bracket from their predictions
    const userMatchPreds = preds.map(p => ({ matchId: p.matchId, home: p.home, away: p.away }));
    const bracket = applyPredictionsToBracket(INITIAL_MATCHES, userMatchPreds);
    const matchMap = new Map(bracket.map(m => [m.id, m]));

    for (const koPred of koPreds) {
      const m = matchMap.get(koPred.matchId);
      if (!m) continue;
      if (m.homeTeamId === 'TBD' || m.awayTeamId === 'TBD') {
        // Teams unknown (group predictions missing/insufficient) — can't determine winner
        continue;
      }

      let winnerId = null;
      if (koPred.home > koPred.away) winnerId = m.homeTeamId;
      else if (koPred.away > koPred.home) winnerId = m.awayTeamId;
      // draws → no predicted winner (unlikely in knockout but possible for group-stage home/away fills)

      if (!winnerId) continue;
      if (winnerId === koPred.existingWinnerId) { skipped++; continue; } // already correct

      updates.push({ userId, matchId: koPred.matchId, winnerId });
    }
  }

  console.log(`\n${updates.length} predictions to update, ${skipped} already correct`);
  if (updates.length === 0) { console.log('Nothing to do.'); return; }

  // Show sample
  const sample = updates.slice(0, 10);
  console.log('\nSample (first 10):');
  sample.forEach(u => console.log(`  ${u.userId.split('@')[0]}  ${u.matchId} → ${u.winnerId}`));
  if (updates.length > 10) console.log(`  ... and ${updates.length - 10} more`);

  if (!WRITE) {
    console.log('\nDry run — add --write to apply.');
    return;
  }

  console.log('\nApplying updates...');
  let ok = 0, fail = 0;
  for (const u of updates) {
    const { error } = await supabase.from('predictions')
      .update({ predicted_winner_id: u.winnerId })
      .eq('user_id', u.userId)
      .eq('match_id', u.matchId);
    if (error) { console.error(`  ERR ${u.userId} ${u.matchId}: ${error.message}`); fail++; }
    else ok++;
  }

  console.log(`\nDone. ${ok} updated, ${fail} failed.`);
}

run().catch(console.error);
