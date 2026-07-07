/**
 * Diagnostic: show the real tournament bracket state.
 * Prints R32, R16, QF from the DB with actual teams and scores,
 * then shows what the current engine.ts routing would derive vs what the DB actually has.
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Current engine.ts routing (d7c7e6a — what the app uses now)
const CURRENT_ROUTING = {
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

// June 28 routing (what was live when R32 results were entered)
const JUNE28_ROUTING = {
  'R32_1':  { nextId: 'R16_1', slot: 'home' },
  'R32_2':  { nextId: 'R16_5', slot: 'home' },
  'R32_3':  { nextId: 'R16_2', slot: 'home' },
  'R32_4':  { nextId: 'R16_1', slot: 'away' },
  'R32_5':  { nextId: 'R16_5', slot: 'away' },
  'R32_6':  { nextId: 'R16_2', slot: 'away' },
  'R32_7':  { nextId: 'R16_6', slot: 'home' },
  'R32_8':  { nextId: 'R16_6', slot: 'away' },
  'R32_9':  { nextId: 'R16_4', slot: 'home' },
  'R32_10': { nextId: 'R16_4', slot: 'away' },
  'R32_11': { nextId: 'R16_3', slot: 'home' },
  'R32_12': { nextId: 'R16_3', slot: 'away' },
  'R32_13': { nextId: 'R16_8', slot: 'home' },
  'R32_14': { nextId: 'R16_7', slot: 'home' },
  'R32_15': { nextId: 'R16_7', slot: 'away' },
  'R32_16': { nextId: 'R16_8', slot: 'away' },
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

function getWinner(m) {
  if (m.home_score === null) return null;
  if (m.home_score > m.away_score) return m.home_team_id;
  if (m.away_score > m.home_score) return m.away_team_id;
  return 'DRAW';
}

async function run() {
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, home_score, away_score, status, round')
    .in('round', ['R32', 'R16', 'QF', 'SF', 'FIN'])
    .order('id');

  const byId = new Map(matches.map(m => [m.id, m]));

  const ROUNDS = [
    { label: 'ROUND OF 32', ids: Array.from({length:16}, (_,i) => `R32_${i+1}`) },
    { label: 'ROUND OF 16', ids: Array.from({length: 8}, (_,i) => `R16_${i+1}`) },
    { label: 'QUARTER FINALS', ids: ['QF_1','QF_2','QF_3','QF_4'] },
    { label: 'SEMI FINALS',    ids: ['SF_1','SF_2'] },
    { label: 'FINAL',          ids: ['FIN_1'] },
  ];

  console.log('\n══ ACTUAL DB BRACKET STATE ══\n');
  for (const { label, ids } of ROUNDS) {
    console.log(`── ${label} ──`);
    for (const id of ids) {
      const m = byId.get(id);
      if (!m) { console.log(`  ${id.padEnd(8)}  (not in DB)`); continue; }
      const home = m.home_team_id || 'TBD';
      const away = m.away_team_id || 'TBD';
      const score = m.home_score !== null ? `${m.home_score}-${m.away_score}` : 'upcoming';
      const winner = m.home_score !== null ? `  → ${getWinner(m)}` : '';
      const status = m.status ? `[${m.status}]` : '';
      console.log(`  ${id.padEnd(8)}  ${home.padEnd(4)} vs ${away.padEnd(4)}  ${score.padEnd(8)} ${status.padEnd(10)}${winner}`);
    }
    console.log();
  }

  // Now derive what the cascade SHOULD produce from R32 results
  // using both routings and compare to DB
  console.log('\n══ ROUTING COMPARISON (R32 winners → R16 slots) ══\n');
  console.log(`  ${'R32'.padEnd(8)}  ${'Winner'.padEnd(6)}  ${'d7c7e6a→'.padEnd(16)}  ${'June28→'.padEnd(16)}  ${'DB R16 slot has'}`);
  console.log(`  ${'─'.repeat(75)}`);

  for (let i = 1; i <= 16; i++) {
    const id = `R32_${i}`;
    const m = byId.get(id);
    if (!m) continue;
    const winner = getWinner(m);
    if (!winner || winner === 'DRAW') continue;

    const curr = CURRENT_ROUTING[id];
    const j28  = JUNE28_ROUTING[id];

    const currSlot = curr ? `${curr.nextId} ${curr.slot}` : '?';
    const j28Slot  = j28  ? `${j28.nextId} ${j28.slot}`   : '?';

    // What does the DB actually have in the derived R16 slot for this winner?
    const currR16 = byId.get(curr?.nextId);
    const dbTeam  = currR16
      ? (curr.slot === 'home' ? currR16.home_team_id : currR16.away_team_id) || 'TBD'
      : 'N/A';

    const mismatch = currSlot !== j28Slot ? '  ← ROUTING DIFFERS' : '';
    const dbMismatch = dbTeam !== winner && dbTeam !== 'TBD' ? `  DB has ${dbTeam} not ${winner}!` : '';

    console.log(`  ${id.padEnd(8)}  ${winner.padEnd(6)}  ${currSlot.padEnd(16)}  ${j28Slot.padEnd(16)}  DB:${dbTeam}${mismatch}${dbMismatch}`);
  }

  // And R16 winners → QF (same routing in both, but let's verify DB state)
  console.log('\n══ R16 WINNERS → QF SLOTS (DB state) ══\n');
  console.log(`  ${'R16'.padEnd(8)}  ${'Home'.padEnd(4)} vs ${'Away'.padEnd(4)}  ${'Score'.padEnd(8)}  ${'Winner'.padEnd(6)}  ${'Routes to'}`);
  console.log(`  ${'─'.repeat(65)}`);

  for (let i = 1; i <= 8; i++) {
    const id = `R16_${i}`;
    const m = byId.get(id);
    if (!m) continue;
    const home = m.home_team_id || 'TBD';
    const away = m.away_team_id || 'TBD';
    const score = m.home_score !== null ? `${m.home_score}-${m.away_score}` : 'upcoming';
    const winner = m.home_score !== null ? getWinner(m) : 'pending';
    const route = CURRENT_ROUTING[id];
    const routeStr = route ? `${route.nextId} ${route.slot}` : '?';

    // Check what the QF slot has
    const qfM = byId.get(route?.nextId);
    const qfTeam = qfM ? (route.slot === 'home' ? qfM.home_team_id : qfM.away_team_id) || 'TBD' : '?';
    const correct = winner === 'pending' || winner === qfTeam ? '' : `  ← QF has ${qfTeam}, expected ${winner}`;

    console.log(`  ${id.padEnd(8)}  ${home.padEnd(4)} vs ${away.padEnd(4)}  ${score.padEnd(8)}  ${String(winner).padEnd(6)}  → ${routeStr}  QF:${qfTeam}${correct}`);
  }
}

run().catch(console.error);
