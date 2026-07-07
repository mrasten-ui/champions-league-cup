/**
 * Deep-dive bracket audit for a single player.
 *
 * 1. Checks whether the player is SC or non-SC.
 * 2. Applies the CORRECT routing for when they picked:
 *      non-SC → original routing (May 31–June 27) + user's group predictions
 *      SC     → real DB teams + d7c7e6a routing (live at SC time)
 * 3. Shows every KO match: teams they saw, score picked, who that gives as winner.
 * 4. Compares the computed winner against the stored predictedWinnerId.
 * 5. Highlights France and Spain's paths explicitly.
 *
 * Usage: node scripts/check-player-deep.js [email]
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TARGET = process.argv[2] || 'jmcleary64@gmail.com';

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

// ORIGINAL routing (May 31 – June 27) — used by all non-SC players
const ORIGINAL = {
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

// d7c7e6a routing — live at SC time (June 30)
// Key difference: R16_2↔R16_3 swap vs original
const D7C = {
  ...ORIGINAL,
  'R16_2': { nextId: 'QF_1', slot: 'away' },  // d7c7e6a
  'R16_3': { nextId: 'QF_3', slot: 'home' },  // d7c7e6a
};

function buildInitialMatches() {
  const matches = [];
  GROUP_CONFIG.forEach(({ id, teams: [t1, t2, t3, t4] }) => {
    matches.push({ id: `${id}1`, groupId: id, homeTeamId: t1, awayTeamId: t2, homeScore: null, awayScore: null });
    matches.push({ id: `${id}2`, groupId: id, homeTeamId: t3, awayTeamId: t4, homeScore: null, awayScore: null });
    matches.push({ id: `${id}3`, groupId: id, homeTeamId: t1, awayTeamId: t3, homeScore: null, awayScore: null });
    matches.push({ id: `${id}4`, groupId: id, homeTeamId: t4, awayTeamId: t2, homeScore: null, awayScore: null });
    matches.push({ id: `${id}5`, groupId: id, homeTeamId: t4, awayTeamId: t1, homeScore: null, awayScore: null });
    matches.push({ id: `${id}6`, groupId: id, homeTeamId: t2, awayTeamId: t3, homeScore: null, awayScore: null });
  });
  ['R32','R16','QF','SF','3RD','FIN'].forEach((round, idx) => {
    const counts = [16,8,4,2,1,1];
    for (let i = 1; i <= counts[idx]; i++)
      matches.push({ id: `${round}_${i}`, round, groupId: null, homeTeamId: 'TBD', awayTeamId: 'TBD', homeScore: null, awayScore: null });
  });
  return matches;
}

function calcStandings(groupId, matchList) {
  const cfg = GROUP_CONFIG.find(g => g.id === groupId);
  const s = {};
  cfg.teams.forEach(t => { s[t] = { teamId: t, pts: 0, gf: 0, ga: 0 }; });
  matchList.filter(m => m.groupId === groupId && m.homeScore !== null).forEach(m => {
    const h = s[m.homeTeamId], a = s[m.awayTeamId];
    if (!h || !a) return;
    h.gf += m.homeScore; h.ga += m.awayScore;
    a.gf += m.awayScore; a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) h.pts += 3;
    else if (m.awayScore > m.homeScore) a.pts += 3;
    else { h.pts++; a.pts++; }
  });
  return Object.values(s).sort((a, b) => b.pts - a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf - a.gf);
}

function getThirds(allStandings) {
  return Object.entries(allStandings)
    .filter(([, g]) => g.length >= 3)
    .map(([gid, g]) => ({ ...g[2], groupId: gid }))
    .sort((a, b) => b.pts - a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf - a.gf);
}

function updateBracket(matchList, progression) {
  const allStandings = {};
  GROUP_CONFIG.forEach(({ id }) => { allStandings[id] = calcStandings(id, matchList); });
  const getTeam = (gid, rank) => allStandings[gid]?.[rank-1]?.teamId || 'TBD';
  const thirds = getThirds(allStandings).slice(0, 8);

  const thirdSlots = [
    { matchId: 'R32_2',  allowed: ['A','B','C','D','F'],  teamId: 'TBD' },
    { matchId: 'R32_5',  allowed: ['C','D','F','G','H'],  teamId: 'TBD' },
    { matchId: 'R32_7',  allowed: ['C','E','F','H','I'],  teamId: 'TBD' },
    { matchId: 'R32_8',  allowed: ['E','H','I','J','K'],  teamId: 'TBD' },
    { matchId: 'R32_9',  allowed: ['B','E','F','I','J'],  teamId: 'TBD' },
    { matchId: 'R32_10', allowed: ['A','E','H','I','J'],  teamId: 'TBD' },
    { matchId: 'R32_13', allowed: ['E','F','G','I','J'],  teamId: 'TBD' },
    { matchId: 'R32_15', allowed: ['D','E','I','J','L'],  teamId: 'TBD' },
  ];
  const assign = (idx) => {
    if (idx === thirds.length) return true;
    for (let i = 0; i < thirdSlots.length; i++) {
      if (thirdSlots[i].teamId === 'TBD' && thirdSlots[i].allowed.includes(thirds[idx].groupId)) {
        thirdSlots[i].teamId = thirds[idx].teamId;
        if (assign(idx + 1)) return true;
        thirdSlots[i].teamId = 'TBD';
      }
    }
    return false;
  };
  assign(0);

  const next = matchList.map(m => ({ ...m }));
  const set = (id, home, away) => {
    const m = next.find(x => x.id === id);
    if (!m || (m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD')) return;
    if (m.homeTeamId !== home) { m.homeTeamId = home; m.homeScore = null; }
    if (m.awayTeamId !== away) { m.awayTeamId = away; m.awayScore = null; }
  };

  set('R32_1',  getTeam('A',2), getTeam('B',2));
  set('R32_2',  getTeam('E',1), thirdSlots[0].teamId);
  set('R32_3',  getTeam('F',1), getTeam('C',2));
  set('R32_4',  getTeam('C',1), getTeam('F',2));
  set('R32_5',  getTeam('I',1), thirdSlots[1].teamId);
  set('R32_6',  getTeam('E',2), getTeam('I',2));
  set('R32_7',  getTeam('A',1), thirdSlots[2].teamId);
  set('R32_8',  getTeam('L',1), thirdSlots[3].teamId);
  set('R32_9',  getTeam('D',1), thirdSlots[4].teamId);
  set('R32_10', getTeam('G',1), thirdSlots[5].teamId);
  set('R32_11', getTeam('K',2), getTeam('L',2));
  set('R32_12', getTeam('H',1), getTeam('J',2));
  set('R32_13', getTeam('B',1), thirdSlots[6].teamId);
  set('R32_14', getTeam('J',1), getTeam('H',2));
  set('R32_15', getTeam('K',1), thirdSlots[7].teamId);
  set('R32_16', getTeam('D',2), getTeam('G',2));

  ['R32','R16','QF','SF'].forEach(round => {
    next.filter(m => m.round === round).forEach(match => {
      const prog = progression[match.id];
      if (!prog) return;
      let winner = 'TBD';
      if (match.homeScore !== null && match.awayScore !== null &&
          match.homeTeamId !== 'TBD' && match.awayTeamId !== 'TBD') {
        if (match.homeScore > match.awayScore) winner = match.homeTeamId;
        else if (match.awayScore > match.homeScore) winner = match.awayTeamId;
      }
      const nm = next.find(m => m.id === prog.nextId);
      if (!nm) return;
      if (prog.slot === 'home') { if (nm.homeTeamId !== winner) { nm.homeTeamId = winner; nm.homeScore = null; } }
      else                     { if (nm.awayTeamId !== winner) { nm.awayTeamId = winner; nm.awayScore = null; } }
    });
  });
  return next;
}

function applyPredictions(initialMatches, preds, progression) {
  const pm = new Map(preds.map(p => [p.match_id, p]));
  let cur = initialMatches.map(m => ({ ...m }));
  for (let i = 0; i < 7; i++) {
    let changed = false;
    cur = cur.map(m => {
      const p = pm.get(m.id);
      if (p && m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD') {
        if (m.homeScore !== p.home || m.awayScore !== p.away) { changed = true; return { ...m, homeScore: p.home, awayScore: p.away }; }
      }
      return m;
    });
    cur = updateBracket(cur, progression);
    if (!changed) break;
  }
  return cur;
}

// Build bracket from real DB matches (for SC users) using a given progression
function applyPredsToRealMatches(realMatchMap, preds, progression) {
  const bracket = new Map();
  realMatchMap.forEach((m, id) => bracket.set(id, { ...m }));

  const roundOrder = ['R32', 'R16', 'QF', 'SF'];
  const predMap = new Map(preds.map(p => [p.match_id, p]));

  for (const round of roundOrder) {
    for (let i = 1; i <= 16; i++) {
      const matchId = `${round}_${i}`;
      const bm = bracket.get(matchId);
      if (!bm) continue;
      const pred = predMap.get(matchId);
      if (!pred) continue;
      if (bm.homeTeamId === 'TBD' || bm.awayTeamId === 'TBD') continue;
      bm.homeScore = pred.home;
      bm.awayScore = pred.away;
      const prog = progression[matchId];
      if (!prog) continue;
      let winner = 'TBD';
      if (pred.home > pred.away) winner = bm.homeTeamId;
      else if (pred.away > pred.home) winner = bm.awayTeamId;
      if (winner === 'TBD') continue;
      const next = bracket.get(prog.nextId);
      if (next) {
        if (prog.slot === 'home') next.homeTeamId = winner;
        else next.awayTeamId = winner;
      }
    }
  }
  return bracket;
}

async function run() {
  // 1. Profile
  const { data: profiles } = await supabase
    .from('profiles')
    .select('email, name, has_taken_second_chance, second_chance_status')
    .eq('email', TARGET);

  const profile = profiles?.[0];
  if (!profile) { console.log(`No profile found for ${TARGET}`); return; }

  const isSC = profile.has_taken_second_chance || profile.second_chance_status === 'ACTIVE';
  const progression = isSC ? D7C : ORIGINAL;
  const routingLabel = isSC ? 'd7c7e6a (SC routing)' : 'original (May 31–June 27)';

  console.log(`\n${'═'.repeat(65)}`);
  console.log(`  Player : ${profile.name} <${profile.email}>`);
  console.log(`  SC?    : ${isSC ? 'YES — ' + profile.second_chance_status : 'NO (original predictions)'}`);
  console.log(`  Routing: ${routingLabel}`);
  console.log(`${'═'.repeat(65)}\n`);

  // 2. Predictions (including stored predicted_winner_id)
  const { data: preds } = await supabase
    .from('predictions')
    .select('match_id, home, away, predicted_winner_id')
    .eq('user_id', TARGET);

  if (!preds?.length) { console.log('No predictions found.'); return; }

  const koPreds = preds.filter(p => /^(R32|R16|QF|SF|FIN)_\d+$/.test(p.match_id));
  console.log(`${preds.length} total predictions, ${koPreds.length} knockout\n`);

  // 3. Build bracket
  let bracket;
  if (isSC) {
    const { data: realMatches } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, home_score, away_score, round')
      .not('round', 'is', null)
      .order('id');

    const realMatchMap = new Map(
      (realMatches || []).map(m => [m.id, {
        id: m.id, round: m.round,
        homeTeamId: m.home_team_id || 'TBD',
        awayTeamId: m.away_team_id || 'TBD',
        homeScore: m.home_score,
        awayScore: m.away_score,
      }])
    );
    bracket = applyPredsToRealMatches(realMatchMap, preds, progression);
  } else {
    const bracketArr = applyPredictions(buildInitialMatches(), preds, progression);
    bracket = new Map(bracketArr.map(m => [m.id, m]));
  }

  // 4. Print full bracket with stored predicted_winner_id comparison
  const KO_ROUNDS = [
    { label: 'Round of 32',    ids: Array.from({length:16}, (_,i) => `R32_${i+1}`) },
    { label: 'Round of 16',    ids: Array.from({length: 8}, (_,i) => `R16_${i+1}`) },
    { label: 'Quarter Finals', ids: ['QF_1','QF_2','QF_3','QF_4'] },
    { label: 'Semi Finals',    ids: ['SF_1','SF_2'] },
    { label: 'Final',          ids: ['FIN_1'] },
  ];

  const predMap = new Map(preds.map(p => [p.match_id, p]));
  const HIGHLIGHT = ['FRA', 'ESP'];

  for (const { label, ids } of KO_ROUNDS) {
    console.log(`── ${label} ──`);
    for (const id of ids) {
      const bm = bracket.get(id);
      if (!bm) continue;
      const pred = predMap.get(id);
      const home = bm.homeTeamId || 'TBD';
      const away = bm.awayTeamId || 'TBD';
      if (home === 'TBD' && away === 'TBD') continue;
      if (!pred) { console.log(`  ${id.padEnd(8)}  ${home.padEnd(4)} vs ${away.padEnd(4)}  (no pick)`); continue; }

      let computed = '(draw)';
      if (pred.home > pred.away) computed = home;
      else if (pred.away > pred.home) computed = away;

      const stored = pred.predicted_winner_id || '(missing)';
      const match = stored === computed ? '✓' : `  ← STORED DIFFERS`;
      const flag = (HIGHLIGHT.includes(home) || HIGHLIGHT.includes(away) || HIGHLIGHT.includes(computed)) ? '  ★' : '';

      console.log(`  ${id.padEnd(8)}  ${home.padEnd(4)} vs ${away.padEnd(4)}  ${String(pred.home)+'-'+pred.away}  computed:${computed.padEnd(4)}  stored:${stored}${stored !== computed ? match : '  ✓'}${flag}`);
    }
    console.log();
  }

  // 5. Summary: France and Spain paths
  console.log('── FRA and ESP paths through the bracket ──\n');
  for (const team of HIGHLIGHT) {
    let found = false;
    for (const { ids } of KO_ROUNDS) {
      for (const id of ids) {
        const bm = bracket.get(id);
        if (!bm) continue;
        const pred = predMap.get(id);
        if (!pred) continue;
        if (bm.homeTeamId === team || bm.awayTeamId === team) {
          let winner = '(draw)';
          if (pred.home > pred.away) winner = bm.homeTeamId;
          else if (pred.away > pred.home) winner = bm.awayTeamId;
          const outcome = winner === team ? 'WINS' : 'LOSES';
          console.log(`  ${team}  in ${id.padEnd(8)}: ${bm.homeTeamId} vs ${bm.awayTeamId}  ${pred.home}-${pred.away}  → ${outcome}`);
          found = true;
          if (outcome === 'LOSES') break;
        }
      }
    }
    if (!found) console.log(`  ${team}: not found in bracket`);
    console.log();
  }

  // 6. Champion
  const finBm = bracket.get('FIN_1');
  const finPred = predMap.get('FIN_1');
  if (finBm && finPred) {
    let computed = '???';
    if (finPred.home > finPred.away) computed = finBm.homeTeamId;
    else if (finPred.away > finPred.home) computed = finBm.awayTeamId;
    console.log(`COMPUTED CHAMPION  : ${computed}`);
    console.log(`STORED (DB) WINNER : ${finPred.predicted_winner_id || '(missing)'}`);
    const agree = computed === finPred.predicted_winner_id;
    console.log(`AGREEMENT          : ${agree ? '✓ match' : '✗ MISMATCH — backfill may be wrong'}`);
  } else {
    console.log('(No final prediction)');
  }
  console.log();
}

run().catch(console.error);
