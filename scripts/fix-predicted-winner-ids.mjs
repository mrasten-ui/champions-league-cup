/**
 * Backs up all KO predicted_winner_id values, then recomputes the correct
 * value for every knockout prediction using the routing that was actually
 * live when each audience made their picks:
 *
 *   Non-SC: cascaded from the player's OWN group predictions (groups hadn't
 *     been played yet when they predicted), using the routing verified
 *     byte-identical to git commit d450b595 (live right before R32_1 kickoff).
 *   SC: cascaded from REAL match results (groups were already decided when
 *     SC picks were locked in), using the SAME routing table, verified
 *     byte-identical to git commit e2cc8eef (live right before R32_2 kickoff).
 *
 * Usage:
 *   node scripts/fix-predicted-winner-ids.mjs           (backup + dry run, prints diff)
 *   node scripts/fix-predicted-winner-ids.mjs --write    (backup + apply)
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const WRITE = process.argv.includes('--write');

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

// Verified correct: byte-identical between d450b595 (pre-R32_1) and e2cc8eef (pre-R32_2)
const HISTORICAL_PROGRESSION = {
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

const KO_MATCH_RE = /^(R32|R16|QF|SF|FIN|3RD)_\d+$/;

// ─── Non-SC: own-group-prediction cascade ───

function buildInitialMatches() {
  const matches = [];
  GROUP_CONFIG.forEach(({ id, teams: [t1, t2, t3, t4] }) => {
    matches.push({ id: `${id}1`, groupId: id, homeTeamId: t1, awayTeamId: t2, homeScore: null, awayScore: null, round: null });
    matches.push({ id: `${id}2`, groupId: id, homeTeamId: t3, awayTeamId: t4, homeScore: null, awayScore: null, round: null });
    matches.push({ id: `${id}3`, groupId: id, homeTeamId: t1, awayTeamId: t3, homeScore: null, awayScore: null, round: null });
    matches.push({ id: `${id}4`, groupId: id, homeTeamId: t4, awayTeamId: t2, homeScore: null, awayScore: null, round: null });
    matches.push({ id: `${id}5`, groupId: id, homeTeamId: t4, awayTeamId: t1, homeScore: null, awayScore: null, round: null });
    matches.push({ id: `${id}6`, groupId: id, homeTeamId: t2, awayTeamId: t3, homeScore: null, awayScore: null, round: null });
  });
  const rounds = ['R32', 'R16', 'QF', 'SF', '3RD', 'FIN'];
  const counts = [16, 8, 4, 2, 1, 1];
  rounds.forEach((round, idx) => {
    for (let i = 1; i <= counts[idx]; i++) {
      matches.push({ id: `${round}_${i}`, round, groupId: null, homeTeamId: 'TBD', awayTeamId: 'TBD', homeScore: null, awayScore: null });
    }
  });
  return matches;
}

function calculateGroupStandings(groupId, matches) {
  const cfg = GROUP_CONFIG.find(g => g.id === groupId);
  const standingsMap = {};
  cfg.teams.forEach(tId => { standingsMap[tId] = { teamId: tId, pts: 0, gf: 0, ga: 0, gd: 0 }; });
  matches
    .filter(m => m.groupId === groupId && m.homeScore !== null && m.awayScore !== null)
    .forEach(m => {
      const h = standingsMap[m.homeTeamId];
      const a = standingsMap[m.awayTeamId];
      if (!h || !a) return;
      h.gf += m.homeScore; h.ga += m.awayScore; h.gd = h.gf - h.ga;
      a.gf += m.awayScore; a.ga += m.homeScore; a.gd = a.gf - a.ga;
      if (m.homeScore > m.awayScore) h.pts += 3;
      else if (m.awayScore > m.homeScore) a.pts += 3;
      else { h.pts += 1; a.pts += 1; }
    });
  return Object.values(standingsMap).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
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
  return thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}

function updateBracketFromOwnPredictions(matches) {
  const groupResults = getAllGroupStandings(matches);
  const getTeam = (gid, rank) => groupResults[gid]?.[rank - 1]?.teamId || 'TBD';
  const thirds = getThirdPlaceStandings(groupResults);
  const qualifiedThirds = thirds.slice(0, 8);
  const thirdPlaceSlots = [
    { matchId: 'R32_2', allowedGroups: ['A','B','C','D','F'], teamId: 'TBD' },
    { matchId: 'R32_5', allowedGroups: ['C','D','F','G','H'], teamId: 'TBD' },
    { matchId: 'R32_7', allowedGroups: ['C','E','F','H','I'], teamId: 'TBD' },
    { matchId: 'R32_8', allowedGroups: ['E','H','I','J','K'], teamId: 'TBD' },
    { matchId: 'R32_9', allowedGroups: ['B','E','F','I','J'], teamId: 'TBD' },
    { matchId: 'R32_10', allowedGroups: ['A','E','H','I','J'], teamId: 'TBD' },
    { matchId: 'R32_13', allowedGroups: ['E','F','G','I','J'], teamId: 'TBD' },
    { matchId: 'R32_15', allowedGroups: ['D','E','I','J','L'], teamId: 'TBD' },
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
  setMatchup('R32_1', getTeam('A', 2), getTeam('B', 2));
  setMatchup('R32_3', getTeam('F', 1), getTeam('C', 2));
  setMatchup('R32_4', getTeam('C', 1), getTeam('F', 2));
  setMatchup('R32_6', getTeam('E', 2), getTeam('I', 2));
  setMatchup('R32_11', getTeam('K', 2), getTeam('L', 2));
  setMatchup('R32_12', getTeam('H', 1), getTeam('J', 2));
  setMatchup('R32_14', getTeam('J', 1), getTeam('H', 2));
  setMatchup('R32_16', getTeam('D', 2), getTeam('G', 2));
  setMatchup('R32_2', getTeam('E', 1), thirdPlaceSlots[0].teamId);
  setMatchup('R32_5', getTeam('I', 1), thirdPlaceSlots[1].teamId);
  setMatchup('R32_7', getTeam('A', 1), thirdPlaceSlots[2].teamId);
  setMatchup('R32_8', getTeam('L', 1), thirdPlaceSlots[3].teamId);
  setMatchup('R32_9', getTeam('D', 1), thirdPlaceSlots[4].teamId);
  setMatchup('R32_10', getTeam('G', 1), thirdPlaceSlots[5].teamId);
  setMatchup('R32_13', getTeam('B', 1), thirdPlaceSlots[6].teamId);
  setMatchup('R32_15', getTeam('K', 1), thirdPlaceSlots[7].teamId);

  ['R32', 'R16', 'QF', 'SF'].forEach(round => {
    next.filter(m => m.round === round).forEach(match => {
      const prog = HISTORICAL_PROGRESSION[match.id];
      if (!prog) return;
      let winnerId = 'TBD';
      if (match.homeScore !== null && match.awayScore !== null && match.homeTeamId !== 'TBD' && match.awayTeamId !== 'TBD') {
        if (match.homeScore > match.awayScore) winnerId = match.homeTeamId;
        else if (match.awayScore > match.homeScore) winnerId = match.awayTeamId;
      }
      const nextMatch = next.find(m => m.id === prog.nextId);
      if (!nextMatch) return;
      if (prog.slot === 'home') { if (nextMatch.homeTeamId !== winnerId) { nextMatch.homeTeamId = winnerId; nextMatch.homeScore = null; } }
      else { if (nextMatch.awayTeamId !== winnerId) { nextMatch.awayTeamId = winnerId; nextMatch.awayScore = null; } }
    });
  });
  return next;
}

function applyPredictionsToBracketOwn(initialMatches, userPredictions) {
  const predsMap = new Map(userPredictions.map(p => [p.matchId, p]));
  let current = initialMatches.map(m => ({ ...m }));
  for (let i = 0; i < 7; i++) {
    let hasChanges = false;
    current = current.map(m => {
      const pred = predsMap.get(m.id);
      if (pred && m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD') {
        if (m.homeScore !== pred.home || m.awayScore !== pred.away) { hasChanges = true; return { ...m, homeScore: pred.home, awayScore: pred.away }; }
      }
      return m;
    });
    current = updateBracketFromOwnPredictions(current);
    if (!hasChanges) break;
  }
  return current;
}

// ─── SC: real-results cascade ───

function computeScBracket(realMatchMap, koPreds) {
  const predMap = new Map(koPreds.map(p => [p.matchId, p]));
  const bracket = new Map();
  realMatchMap.forEach((m, id) => bracket.set(id, { ...m }));
  const roundOrder = ['R32', 'R16', 'QF', 'SF'];
  for (const round of roundOrder) {
    for (let i = 1; i <= 16; i++) {
      const matchId = `${round}_${i}`;
      const bm = bracket.get(matchId);
      if (!bm) continue;
      const pred = predMap.get(matchId);
      if (!pred) continue;
      if (bm.homeTeamId === 'TBD' || bm.awayTeamId === 'TBD') continue;
      let winner = 'TBD';
      if (pred.home > pred.away) winner = bm.homeTeamId;
      else if (pred.away > pred.home) winner = bm.awayTeamId;
      if (winner === 'TBD') continue;
      const prog = HISTORICAL_PROGRESSION[matchId];
      if (!prog) continue;
      const next = bracket.get(prog.nextId);
      if (next) { if (prog.slot === 'home') next.homeTeamId = winner; else next.awayTeamId = winner; }
    }
  }
  return bracket;
}

// ─── Main ───

async function run() {
  console.log('Fetching profiles...');
  const { data: profiles } = await supabase
    .from('profiles')
    .select('email, has_taken_second_chance, second_chance_status');

  const scEmails = new Set(profiles.filter(p => p.has_taken_second_chance || p.second_chance_status === 'ACTIVE').map(p => p.email));
  const nonScEmails = new Set(profiles.filter(p => !scEmails.has(p.email)).map(p => p.email));

  console.log('Fetching real matches...');
  const { data: realMatches } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, status, round')
    .not('round', 'is', null);
  const realMatchMap = new Map((realMatches || []).map(m => [m.id, { homeTeamId: m.home_team_id || 'TBD', awayTeamId: m.away_team_id || 'TBD' }]));
  const DONE = ['FT', 'AET', 'PEN', 'FINISHED'];
  const matchStatus = new Map((realMatches || []).map(m => [m.id, m.status]));

  console.log('Fetching all predictions...');
  const allPreds = [];
  const PAGE = 1000;
  let from = 0, keepGoing = true;
  while (keepGoing) {
    const { data, error } = await supabase
      .from('predictions')
      .select('user_id, match_id, home, away, predicted_winner_id')
      .range(from, from + PAGE - 1);
    if (error) { console.error(error); break; }
    if (data && data.length > 0) { allPreds.push(...data); keepGoing = data.length === PAGE; from += PAGE; }
    else keepGoing = false;
  }
  console.log(`  Fetched ${allPreds.length} total prediction rows\n`);

  // ── Backup: every KO row's current predicted_winner_id, before touching anything ──
  const koAll = allPreds.filter(p => KO_MATCH_RE.test(p.match_id));
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(process.cwd(), 'scripts/_backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `predicted_winner_id-backup-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(koAll, null, 2));
  console.log(`Backed up ${koAll.length} KO prediction rows to:\n  ${backupPath}\n`);

  const byUser = {};
  allPreds.forEach(p => { (byUser[p.user_id] ??= []).push(p); });

  const INITIAL_MATCHES = buildInitialMatches();
  const updates = [];
  const diffLines = [];

  for (const [userId, preds] of Object.entries(byUser)) {
    const koPreds = preds.filter(p => KO_MATCH_RE.test(p.match_id) && p.match_id !== '3RD_1');
    if (koPreds.length === 0) continue;

    let correctByMatch;
    const isSc = scEmails.has(userId);
    if (isSc) {
      const bracket = computeScBracket(realMatchMap, koPreds.map(p => ({ matchId: p.match_id, home: p.home, away: p.away })));
      correctByMatch = new Map();
      for (const kp of koPreds) {
        const bm = bracket.get(kp.match_id);
        if (!bm || bm.homeTeamId === 'TBD' || bm.awayTeamId === 'TBD') continue;
        let w = null;
        if (kp.home > kp.away) w = bm.homeTeamId; else if (kp.away > kp.home) w = bm.awayTeamId;
        if (w) correctByMatch.set(kp.match_id, w);
      }
    } else {
      const userMatchPreds = preds.map(p => ({ matchId: p.match_id, home: p.home, away: p.away }));
      const bracket = applyPredictionsToBracketOwn(INITIAL_MATCHES, userMatchPreds);
      const matchMap = new Map(bracket.map(m => [m.id, m]));
      correctByMatch = new Map();
      for (const kp of koPreds) {
        const m = matchMap.get(kp.match_id);
        if (!m || m.homeTeamId === 'TBD' || m.awayTeamId === 'TBD') continue;
        let w = null;
        if (kp.home > kp.away) w = m.homeTeamId; else if (kp.away > kp.home) w = m.awayTeamId;
        if (w) correctByMatch.set(kp.match_id, w);
      }
    }

    for (const kp of koPreds) {
      const correct = correctByMatch.get(kp.match_id);
      if (correct === undefined || correct === kp.predicted_winner_id) continue;
      updates.push({ userId, matchId: kp.match_id, from: kp.predicted_winner_id, to: correct });
      diffLines.push(`${userId.padEnd(28)} ${kp.match_id.padEnd(8)} ${(isSc ? 'SC ' : 'non').padEnd(4)} ${String(kp.predicted_winner_id).padEnd(6)} -> ${correct}  [real status: ${matchStatus.get(kp.match_id)}]`);
    }
  }

  const diffPath = path.join(backupDir, `predicted_winner_id-diff-${timestamp}.txt`);
  fs.writeFileSync(diffPath, diffLines.join('\n'));
  console.log(`${updates.length} rows would change. Full diff written to:\n  ${diffPath}\n`);
  console.log('First 40 changes:');
  diffLines.slice(0, 40).forEach(l => console.log('  ' + l));
  if (diffLines.length > 40) console.log(`  ... and ${diffLines.length - 40} more (see diff file)`);

  if (!WRITE) {
    console.log('\nDry run only — no writes made. Re-run with --write to apply.');
    return;
  }

  console.log('\nApplying updates...');
  let ok = 0, fail = 0;
  for (const u of updates) {
    const { error } = await supabase.from('predictions')
      .update({ predicted_winner_id: u.to })
      .eq('user_id', u.userId)
      .eq('match_id', u.matchId);
    if (error) { console.error(`  ERR ${u.userId} ${u.matchId}: ${error.message}`); fail++; }
    else ok++;
  }
  console.log(`\nDone. ${ok} updated, ${fail} failed.`);
}

run().catch(e => { console.error(e); process.exit(1); });
