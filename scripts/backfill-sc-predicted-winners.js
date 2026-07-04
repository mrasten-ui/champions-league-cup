/**
 * Backfill predicted_winner_id for SC (Second Chance) users.
 *
 * The key difference from the non-SC backfill: SC players were shown the REAL
 * bracket (actual group results, real teams in each R32 slot) when they made
 * their SC picks. handleLockInSecondChance incorrectly computed predicted_winner_id
 * using userBracket (driven by the user's own group predictions) instead of the
 * real match data. This script corrects that by starting from the real DB teams
 * in each knockout slot.
 *
 * Usage:
 *   node scripts/backfill-sc-predicted-winners.js          (dry run)
 *   node scripts/backfill-sc-predicted-winners.js --write  (apply to DB)
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const WRITE = process.argv.includes('--write');

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

// SC-era routing — as committed in d7c7e6a (June 30), which was live when SC
// players made their bracket picks. Key difference from current engine.ts:
//   R16_2 → QF_1 away  (not QF_3 home)
//   R16_3 → QF_3 home  (not QF_1 away)
// This swap matters because it determines which QF slot France (R16_3 winner) routes into.
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
  'R16_2': { nextId: 'QF_1', slot: 'away' },  // d7c7e6a: R16_2 → QF_1 away
  'R16_3': { nextId: 'QF_3', slot: 'home' },  // d7c7e6a: R16_3 → QF_3 home (France's path)
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

async function run() {
  // 1. Fetch SC users (locked in only — skip PENDING, they still have original predictions)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('email, name, has_taken_second_chance, second_chance_status');

  const scUsers = profiles.filter(p =>
    p.has_taken_second_chance || p.second_chance_status === 'ACTIVE'
  );

  console.log(`\n${scUsers.length} SC users to process (LOCKED IN only):\n`);
  scUsers.forEach(p => console.log(`  ${p.email}`));

  // 2. Fetch all real knockout matches from DB (these have the REAL teams in each slot)
  const { data: realMatches } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, home_score, away_score, round')
    .not('round', 'is', null)
    .order('id');

  // Build a map of matchId → { homeTeamId, awayTeamId } from real DB data
  const realMatchMap = new Map(
    (realMatches || []).map(m => [m.id, {
      id: m.id,
      round: m.round,
      homeTeamId: m.home_team_id || 'TBD',
      awayTeamId: m.away_team_id || 'TBD',
      homeScore: m.home_score,
      awayScore: m.away_score,
    }])
  );

  console.log(`\nLoaded ${realMatchMap.size} real knockout matches from DB`);
  console.log('\nReal R32 lineup:');
  for (let i = 1; i <= 16; i++) {
    const m = realMatchMap.get(`R32_${i}`);
    if (m) console.log(`  R32_${i}: ${m.homeTeamId} vs ${m.awayTeamId}`);
  }

  const allUpdates = [];

  // 3. Process each SC user
  for (const profile of scUsers) {
    const { data: preds } = await supabase
      .from('predictions')
      .select('match_id, home, away, predicted_winner_id')
      .eq('user_id', profile.email);

    const predMap = new Map((preds || []).map(p => [p.match_id, p]));
    const koPreds = (preds || []).filter(p => KO_MATCH_RE.test(p.match_id));

    if (koPreds.length === 0) {
      console.log(`\n  ${profile.email}: no KO predictions, skipping`);
      continue;
    }

    // Build the bracket starting from the REAL teams in each slot
    // Clone real match map — we'll propagate predicted winners through it
    const bracket = new Map();
    realMatchMap.forEach((m, id) => bracket.set(id, { ...m }));

    // For each match in round order: apply user's score prediction, cascade winner
    const roundOrder = ['R32', 'R16', 'QF', 'SF'];
    for (const round of roundOrder) {
      for (let i = 1; i <= 16; i++) {
        const matchId = `${round}_${i}`;
        const bm = bracket.get(matchId);
        if (!bm) continue;

        const pred = predMap.get(matchId);
        if (!pred) continue;
        if (bm.homeTeamId === 'TBD' || bm.awayTeamId === 'TBD') continue;

        // Apply score
        bm.homeScore = pred.home;
        bm.awayScore = pred.away;

        // Cascade winner to next round
        const prog = PROGRESSION[matchId];
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

    // 4. Compute predicted_winner_id for each KO match
    const displayName = profile.email.split('@')[0];
    const userUpdates = [];

    console.log(`\n  ${displayName}:`);

    for (const koPred of koPreds) {
      if (koPred.match_id === '3RD_1') continue; // skip 3rd place

      const bm = bracket.get(koPred.match_id);
      if (!bm || bm.homeTeamId === 'TBD' || bm.awayTeamId === 'TBD') {
        console.log(`    ${koPred.match_id.padEnd(8)}  TBD vs TBD  (incomplete — skipping)`);
        continue;
      }

      let winnerId = null;
      if (koPred.home > koPred.away) winnerId = bm.homeTeamId;
      else if (koPred.away > koPred.home) winnerId = bm.awayTeamId;
      if (!winnerId) continue;

      const existing = koPred.predicted_winner_id;
      const changed = winnerId !== existing;

      console.log(`    ${koPred.match_id.padEnd(8)}  ${bm.homeTeamId.padEnd(4)} vs ${bm.awayTeamId.padEnd(4)}  ${koPred.home}-${koPred.away}  → ${winnerId}${changed ? `  (was: ${existing || 'null'})` : '  ✓'}`);

      if (changed) {
        userUpdates.push({ userId: profile.email, matchId: koPred.match_id, winnerId });
      }
    }

    const fin = bracket.get('FIN_1');
    const finPred = predMap.get('FIN_1');
    if (fin && finPred) {
      let champ = '???';
      if (finPred.home > finPred.away) champ = fin.homeTeamId;
      else if (finPred.away > finPred.home) champ = fin.awayTeamId;
      console.log(`    PREDICTED CHAMPION: ${champ}`);
    }

    allUpdates.push(...userUpdates);
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`${allUpdates.length} values to update`);

  if (allUpdates.length === 0) { console.log('Nothing to do.'); return; }
  if (!WRITE) { console.log('\nDry run — add --write to apply.'); return; }

  console.log('\nApplying updates...');
  let ok = 0, fail = 0;
  for (const u of allUpdates) {
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
