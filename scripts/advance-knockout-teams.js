import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mirrors KNOCKOUT_PROGRESSION in engine.ts
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

const FINISHED = ['FT', 'AET', 'PEN', 'FINISHED'];
const FIX_MISMATCHES = process.argv.includes('--fix');

async function run() {
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, round, home_team_id, away_team_id, home_score, away_score, status');
  if (error) throw error;

  const matchMap = {};
  matches.forEach(m => { matchMap[m.id] = m; });

  const updates = [];

  for (const [matchId, prog] of Object.entries(PROGRESSION)) {
    const match = matchMap[matchId];
    if (!match) continue;

    const finished = FINISHED.includes(match.status);
    if (!finished) continue;

    // Determine winner
    let winner = null;
    if (match.home_score > match.away_score) {
      winner = match.home_team_id;
    } else if (match.away_score > match.home_score) {
      winner = match.away_team_id;
    } else {
      console.log(`  SKIP ${matchId}: draw ${match.home_score}-${match.away_score} — can't determine winner (check if PEN result needs manual score)`);
      continue;
    }

    if (!winner || winner === 'TBD') {
      console.log(`  SKIP ${matchId}: winner is TBD`);
      continue;
    }

    const nextMatch = matchMap[prog.nextId];
    if (!nextMatch) continue;

    const currentValue = prog.slot === 'home' ? nextMatch.home_team_id : nextMatch.away_team_id;
    if (currentValue && currentValue !== 'TBD') {
      if (currentValue !== winner) {
        console.log(`  MISMATCH ${matchId} → ${prog.nextId} ${prog.slot}: DB has "${currentValue}", should be "${winner}"${FIX_MISMATCHES ? ' — will fix' : ' (run with --fix to correct)'}`);
        if (FIX_MISMATCHES) {
          updates.push({ matchId: prog.nextId, slot: prog.slot, team: winner, from: matchId, fix: true });
        }
      } else {
        console.log(`  OK  ${matchId} → ${prog.nextId} ${prog.slot}: ${winner} already set`);
      }
      continue;
    }

    updates.push({ matchId: prog.nextId, slot: prog.slot, team: winner, from: matchId, fix: false });
  }

  if (updates.length === 0) {
    console.log('\nNo updates needed.');
    return;
  }

  console.log('\nPending updates:');
  updates.forEach(u => console.log(`  ${u.fix ? '[FIX]' : '[NEW]'} ${u.from} winner ${u.team} → ${u.matchId} ${u.slot}`));

  // Apply updates
  for (const u of updates) {
    const field = u.slot === 'home' ? 'home_team_id' : 'away_team_id';
    const { error: ue } = await supabase
      .from('matches')
      .update({ [field]: u.team })
      .eq('id', u.matchId);
    if (ue) {
      console.error(`  ERROR updating ${u.matchId}: ${ue.message}`);
    } else {
      console.log(`  ${u.fix ? 'FIXED' : 'UPDATED'} ${u.matchId} ${u.slot} = ${u.team}`);
    }
  }

  console.log('\nDone.');
}

run().catch(console.error);
