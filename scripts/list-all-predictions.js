/**
 * List every prediction for a player — group stage AND knockout —
 * with the teams they saw and who they picked to win.
 *
 * Usage: node scripts/list-all-predictions.js [email]
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

// June 10 / original routing (identical to what was live when predictions locked)
const PROGRESSION = {
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

// Build the fixed group-stage match list (same structure as INITIAL_MATCHES)
function buildGroupMatches() {
  const matches = [];
  GROUP_CONFIG.forEach(({ id, teams: [t1, t2, t3, t4] }) => {
    matches.push({ id: `${id}1`, groupId: id, home: t1, away: t2 });
    matches.push({ id: `${id}2`, groupId: id, home: t3, away: t4 });
    matches.push({ id: `${id}3`, groupId: id, home: t1, away: t3 });
    matches.push({ id: `${id}4`, groupId: id, home: t4, away: t2 });
    matches.push({ id: `${id}5`, groupId: id, home: t4, away: t1 });
    matches.push({ id: `${id}6`, groupId: id, home: t2, away: t3 });
  });
  return matches;
}

function calcStandings(groupId, predMap) {
  const cfg = GROUP_CONFIG.find(g => g.id === groupId);
  const s = {};
  cfg.teams.forEach(t => { s[t] = { teamId: t, pts: 0, gf: 0, ga: 0 }; });
  buildGroupMatches()
    .filter(m => m.groupId === groupId)
    .forEach(m => {
      const p = predMap.get(m.id);
      if (!p) return;
      const h = s[m.home], a = s[m.away];
      h.gf += p.home; h.ga += p.away;
      a.gf += p.away; a.ga += p.home;
      if (p.home > p.away) h.pts += 3;
      else if (p.away > p.home) a.pts += 3;
      else { h.pts++; a.pts++; }
    });
  return Object.values(s).sort((a, b) => b.pts - a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf - a.gf);
}

function getThirds(standings) {
  return Object.entries(standings)
    .map(([gid, g]) => ({ ...g[2], groupId: gid }))
    .sort((a, b) => b.pts - a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf - a.gf);
}

function buildKOBracket(predMap) {
  const standings = {};
  GROUP_CONFIG.forEach(({ id }) => { standings[id] = calcStandings(id, predMap); });
  const getTeam = (gid, rank) => standings[gid]?.[rank-1]?.teamId || 'TBD';
  const thirds = getThirds(standings).slice(0, 8);

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

  const bracket = new Map();
  bracket.set('R32_1',  { home: getTeam('A',2), away: getTeam('B',2) });
  bracket.set('R32_2',  { home: getTeam('E',1), away: thirdSlots[0].teamId });
  bracket.set('R32_3',  { home: getTeam('F',1), away: getTeam('C',2) });
  bracket.set('R32_4',  { home: getTeam('C',1), away: getTeam('F',2) });
  bracket.set('R32_5',  { home: getTeam('I',1), away: thirdSlots[1].teamId });
  bracket.set('R32_6',  { home: getTeam('E',2), away: getTeam('I',2) });
  bracket.set('R32_7',  { home: getTeam('A',1), away: thirdSlots[2].teamId });
  bracket.set('R32_8',  { home: getTeam('L',1), away: thirdSlots[3].teamId });
  bracket.set('R32_9',  { home: getTeam('D',1), away: thirdSlots[4].teamId });
  bracket.set('R32_10', { home: getTeam('G',1), away: thirdSlots[5].teamId });
  bracket.set('R32_11', { home: getTeam('K',2), away: getTeam('L',2) });
  bracket.set('R32_12', { home: getTeam('H',1), away: getTeam('J',2) });
  bracket.set('R32_13', { home: getTeam('B',1), away: thirdSlots[6].teamId });
  bracket.set('R32_14', { home: getTeam('J',1), away: getTeam('H',2) });
  bracket.set('R32_15', { home: getTeam('K',1), away: thirdSlots[7].teamId });
  bracket.set('R32_16', { home: getTeam('D',2), away: getTeam('G',2) });

  for (const round of ['R32','R16','QF','SF']) {
    const count = { R32:16, R16:8, QF:4, SF:2 }[round];
    for (let i = 1; i <= count; i++) {
      const id = `${round}_${i}`;
      const bm = bracket.get(id);
      if (!bm) continue;
      const pred = predMap.get(id);
      if (!pred) continue;
      if (bm.home === 'TBD' || bm.away === 'TBD') continue;
      const prog = PROGRESSION[id];
      if (!prog) continue;
      let winner = null;
      if (pred.home > pred.away) winner = bm.home;
      else if (pred.away > pred.home) winner = bm.away;
      if (!winner) continue;
      const next = bracket.get(prog.nextId) ?? { home: 'TBD', away: 'TBD' };
      if (!bracket.has(prog.nextId)) bracket.set(prog.nextId, next);
      if (prog.slot === 'home') next.home = winner;
      else next.away = winner;
    }
  }

  // FIN_1 if not already set
  if (!bracket.has('FIN_1')) bracket.set('FIN_1', { home: 'TBD', away: 'TBD' });

  return bracket;
}

async function run() {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('email, name, has_taken_second_chance, second_chance_status')
    .eq('email', TARGET);
  const profile = profiles?.[0];

  const { data: rows } = await supabase
    .from('predictions')
    .select('match_id, home, away, predicted_winner_id')
    .eq('user_id', TARGET);

  if (!rows?.length) { console.log('No predictions found.'); return; }

  const predMap = new Map(rows.map(p => [p.match_id, p]));
  const groupMatches = buildGroupMatches();
  const koBracket = buildKOBracket(predMap);

  console.log(`\n${'═'.repeat(72)}`);
  console.log(`  Player : ${profile?.name ?? TARGET}`);
  console.log(`  SC?    : ${profile?.has_taken_second_chance ? 'YES' : 'NO'}`);
  console.log(`  Routing: June 10 original (git c8ebccb)`);
  console.log(`${'═'.repeat(72)}\n`);

  // ── GROUP STAGE ──────────────────────────────────────────────────────────
  console.log('── GROUP STAGE ──────────────────────────────────────────────────────\n');
  console.log(`  ${'Match'.padEnd(6)}  ${'Home'.padEnd(4)}  ${'Score'.padEnd(5)}  ${'Away'.padEnd(4)}  Winner`);
  console.log(`  ${'─'.repeat(50)}`);

  let groupTotal = 0;
  GROUP_CONFIG.forEach(({ id }) => {
    const gMatches = groupMatches.filter(m => m.groupId === id);
    console.log(`\n  Group ${id}`);
    gMatches.forEach(m => {
      const p = predMap.get(m.id);
      if (!p) { console.log(`  ${m.id.padEnd(6)}  ${m.home.padEnd(4)}  ?-?    ${m.away.padEnd(4)}  (no pick)`); return; }
      let winner;
      if (p.home > p.away)       winner = m.home;
      else if (p.away > p.home)  winner = m.away;
      else                        winner = 'DRAW';
      const score = `${p.home}-${p.away}`;
      console.log(`  ${m.id.padEnd(6)}  ${m.home.padEnd(4)}  ${score.padEnd(5)}  ${m.away.padEnd(4)}  ${winner}`);
      groupTotal++;
    });
  });

  // Group standings as Jamie predicted them
  console.log(`\n── PREDICTED GROUP STANDINGS ────────────────────────────────────────\n`);
  GROUP_CONFIG.forEach(({ id }) => {
    const s = calcStandings(id, predMap);
    const line = s.map((t,i) => `${i+1}.${t.teamId}(${t.pts}pts)`).join('  ');
    console.log(`  Group ${id}: ${line}`);
  });

  // ── KNOCKOUT ─────────────────────────────────────────────────────────────
  const KO_ROUNDS = [
    { label: 'ROUND OF 32', ids: Array.from({length:16}, (_,i) => `R32_${i+1}`) },
    { label: 'ROUND OF 16', ids: Array.from({length: 8}, (_,i) => `R16_${i+1}`) },
    { label: 'QUARTER FINALS', ids: ['QF_1','QF_2','QF_3','QF_4'] },
    { label: 'SEMI FINALS',    ids: ['SF_1','SF_2'] },
    { label: 'FINAL',          ids: ['FIN_1'] },
  ];

  console.log(`\n── KNOCKOUT STAGE ───────────────────────────────────────────────────\n`);
  console.log(`  ${'Match'.padEnd(8)}  ${'Home'.padEnd(4)}  ${'Score'.padEnd(5)}  ${'Away'.padEnd(4)}  Winner          Stored`);
  console.log(`  ${'─'.repeat(65)}`);

  for (const { label, ids } of KO_ROUNDS) {
    console.log(`\n  ${label}`);
    for (const id of ids) {
      const bm = koBracket.get(id);
      const p  = predMap.get(id);
      if (!bm && !p) continue;
      const home = bm?.home ?? 'TBD';
      const away = bm?.away ?? 'TBD';
      if (home === 'TBD' && away === 'TBD') continue;
      if (!p) { console.log(`  ${id.padEnd(8)}  ${home.padEnd(4)}       ${away.padEnd(4)}  (no pick)`); continue; }
      let winner;
      if (p.home > p.away)       winner = home;
      else if (p.away > p.home)  winner = away;
      else                        winner = 'DRAW';
      const score = `${p.home}-${p.away}`;
      const stored = p.predicted_winner_id ?? '(missing)';
      const ok = stored === winner ? '✓' : '← DIFFERS';
      // Highlight FRA / ESP
      const flag = (home === 'FRA' || away === 'FRA' || home === 'ESP' || away === 'ESP') ? ' ★' : '';
      console.log(`  ${id.padEnd(8)}  ${home.padEnd(4)}  ${score.padEnd(5)}  ${away.padEnd(4)}  ${winner.padEnd(15)} ${stored} ${ok}${flag}`);
    }
  }

  console.log(`\n${'═'.repeat(72)}`);
  const fin = koBracket.get('FIN_1');
  const finPred = predMap.get('FIN_1');
  if (fin && finPred) {
    const champ = finPred.home > finPred.away ? fin.home : finPred.away > finPred.home ? fin.away : 'DRAW';
    console.log(`  CHAMPION (computed)  : ${champ}`);
    console.log(`  CHAMPION (DB stored) : ${finPred.predicted_winner_id ?? '(missing)'}`);
  }
  console.log(`${'═'.repeat(72)}\n`);
}

run().catch(console.error);
