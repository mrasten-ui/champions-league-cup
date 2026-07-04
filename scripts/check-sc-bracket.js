/**
 * Show a specific SC user's full bracket using the CURRENT routing (real FIFA draw).
 * Usage: node scripts/check-sc-bracket.js [email]
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TARGET = process.argv[2] || 'mrasten@gmail.com';

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

// CURRENT routing — the real FIFA draw (as in engine.ts)
const PROGRESSION = {
  'R32_1':  { nextId: 'R16_1', slot: 'home' },
  'R32_2':  { nextId: 'R16_2', slot: 'home' },
  'R32_3':  { nextId: 'R16_3', slot: 'home' },
  'R32_4':  { nextId: 'R16_1', slot: 'away' },
  'R32_5':  { nextId: 'R16_2', slot: 'away' },
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
  'R16_2': { nextId: 'QF_3', slot: 'home' },
  'R16_3': { nextId: 'QF_1', slot: 'away' },
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
    for (let i = 1; i <= [16,8,4,2,1,1][idx]; i++)
      matches.push({ id: `${round}_${i}`, round, groupId: null, homeTeamId: 'TBD', awayTeamId: 'TBD', homeScore: null, awayScore: null });
  });
  return matches;
}

function calcStandings(groupId, matches) {
  const cfg = GROUP_CONFIG.find(g => g.id === groupId);
  const s = {};
  cfg.teams.forEach(t => { s[t] = { teamId: t, pts: 0, gf: 0, ga: 0 }; });
  matches.filter(m => m.groupId === groupId && m.homeScore !== null).forEach(m => {
    const h = s[m.homeTeamId], a = s[m.awayTeamId];
    if (!h || !a) return;
    h.gf += m.homeScore; h.ga += m.awayScore;
    a.gf += m.awayScore; a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) h.pts += 3;
    else if (m.awayScore > m.homeScore) a.pts += 3;
    else { h.pts += 1; a.pts += 1; }
  });
  return Object.values(s).sort((a, b) => b.pts - a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf - a.gf);
}

function getThirds(standings) {
  return Object.entries(standings)
    .filter(([, g]) => g.length >= 3)
    .map(([gid, g]) => ({ ...g[2], groupId: gid }))
    .sort((a, b) => b.pts - a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf - a.gf);
}

function updateBracket(matches) {
  const standings = {};
  GROUP_CONFIG.forEach(({ id }) => { standings[id] = calcStandings(id, matches); });
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

  const next = matches.map(m => ({ ...m }));
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
      const prog = PROGRESSION[match.id];
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

function applyPredictions(initialMatches, preds) {
  const pm = new Map(preds.map(p => [p.matchId, p]));
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
    cur = updateBracket(cur);
    if (!changed) break;
  }
  return cur;
}

async function run() {
  const { data, error } = await supabase.from('predictions').select('match_id, home, away, predicted_winner_id').eq('user_id', TARGET);
  if (error || !data?.length) { console.log('No predictions found.'); return; }

  const preds = data.map(p => ({ matchId: p.match_id, home: p.home, away: p.away, storedWinnerId: p.predicted_winner_id }));
  const bracket = applyPredictions(buildInitialMatches(), preds);
  const matchMap = new Map(bracket.map(m => [m.id, m]));

  console.log(`\nSC bracket for ${TARGET} (current/real-draw routing)\n`);

  const KO_ROUNDS = [
    { label: 'Round of 32',    ids: Array.from({length:16}, (_,i) => `R32_${i+1}`) },
    { label: 'Round of 16',    ids: Array.from({length: 8}, (_,i) => `R16_${i+1}`) },
    { label: 'Quarter Finals', ids: ['QF_1','QF_2','QF_3','QF_4'] },
    { label: 'Semi Finals',    ids: ['SF_1','SF_2'] },
    { label: 'Final',          ids: ['FIN_1'] },
  ];

  for (const { label, ids } of KO_ROUNDS) {
    console.log(`── ${label} ──`);
    for (const id of ids) {
      const m = matchMap.get(id);
      if (!m || (m.homeTeamId === 'TBD' && m.awayTeamId === 'TBD')) continue;
      const pred = preds.find(p => p.matchId === id);
      const home = m.homeTeamId, away = m.awayTeamId;
      if (!pred) { console.log(`  ${id.padEnd(8)}  ${home} vs ${away}  (no pick)`); continue; }

      let computed = home > away ? home : away > home ? away : 'DRAW';
      if (pred.home > pred.away) computed = home;
      else if (pred.away > pred.home) computed = away;
      else computed = 'DRAW';

      const stored = pred.storedWinnerId || '(missing)';
      const match = stored === computed ? '✓' : '✗ MISMATCH';
      console.log(`  ${id.padEnd(8)}  ${home.padEnd(4)} vs ${away.padEnd(4)}  ${pred.home}-${pred.away}  computed:${computed}  stored:${stored} ${stored !== computed ? match : ''}`);
    }
    console.log();
  }
}

run().catch(console.error);
