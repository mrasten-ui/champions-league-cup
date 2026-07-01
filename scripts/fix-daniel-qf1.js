import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID  = 'd.ristjouw@gmail.com';
const MATCH_ID = 'QF_1';

async function run() {
  // Read current value first
  const { data: current, error: re } = await supabase
    .from('predictions')
    .select('id, home, away')
    .eq('user_id', USER_ID)
    .eq('match_id', MATCH_ID)
    .single();

  if (re) { console.error('Read error:', re); return; }
  console.log(`Current QF_1 prediction: home=${current.home}, away=${current.away}`);
  console.log(`(Home wins = Brazil advances, Away wins = France advances)`);

  if (current.away > current.home) {
    console.log('Already picks AWAY (France). No change needed.');
    return;
  }

  // Flip to away win (France advances)
  const { error: ue } = await supabase
    .from('predictions')
    .update({ home: 0, away: 1 })
    .eq('user_id', USER_ID)
    .eq('match_id', MATCH_ID);

  if (ue) { console.error('Update error:', ue); return; }

  console.log(`\nUpdated QF_1: home=0, away=1 — France now advances.`);
  console.log(`France path: QF_1 (away win) → SF_1 (home) → Daniel picks HOME ✓ → FIN_1 (home) → Daniel picks HOME ✓`);
}

run().catch(console.error);
