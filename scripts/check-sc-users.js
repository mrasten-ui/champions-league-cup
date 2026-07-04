/**
 * Inspect SC users: who they are, what predicted_winner_id is already set,
 * and what champion each one has (if we can compute it).
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: profiles } = await supabase
  .from('profiles')
  .select('email, name, has_taken_second_chance, second_chance_status');

const scProfiles = profiles.filter(p =>
  p.has_taken_second_chance || p.second_chance_status === 'ACTIVE' || p.second_chance_status === 'PENDING'
);

console.log(`\n${scProfiles.length} SC users:\n`);

const KO_RE = /^(R32|R16|QF|SF|FIN|3RD)_\d+$/;

for (const profile of scProfiles) {
  const { data: preds } = await supabase
    .from('predictions')
    .select('match_id, home, away, predicted_winner_id')
    .eq('user_id', profile.email);

  const koPreds = (preds || []).filter(p => KO_RE.test(p.match_id));
  const withWinner = koPreds.filter(p => p.predicted_winner_id);
  const withoutWinner = koPreds.filter(p => !p.predicted_winner_id);

  const fin = koPreds.find(p => p.match_id === 'FIN_1');
  const finWinner = fin?.predicted_winner_id || '???';

  const status = profile.has_taken_second_chance ? 'LOCKED IN' : profile.second_chance_status;

  console.log(`  ${profile.email}`);
  console.log(`    Status: ${status}`);
  console.log(`    KO predictions: ${koPreds.length} total, ${withWinner.length} have predicted_winner_id, ${withoutWinner.length} missing`);
  if (withoutWinner.length > 0) {
    console.log(`    Missing on: ${withoutWinner.map(p => p.match_id).join(', ')}`);
  }
  console.log(`    FIN_1 predicted_winner_id: ${finWinner}`);
  console.log();
}
