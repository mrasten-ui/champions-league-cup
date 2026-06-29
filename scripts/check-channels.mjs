import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Check finished KO matches and their round value
const { data: matches } = await sb
  .from('matches')
  .select('id,home_team_id,away_team_id,home_score,away_score,status,round,group_id')
  .in('status', ['FT','FINISHED','AET','PEN'])
  .is('group_id', null);

console.log('Finished knockout matches:\n');
matches?.forEach(m => {
  console.log(`${m.id} | round=${JSON.stringify(m.round)} | ${m.home_team_id} ${m.home_score}-${m.away_score} ${m.away_team_id} | status=${m.status}`);
});

// Also check Mark's predictions for these matches
const { data: preds } = await sb
  .from('predictions')
  .select('match_id,home,away,user_id')
  .in('match_id', matches?.map(m => m.id) ?? []);

console.log('\nPredictions for those matches:');
preds?.forEach(p => {
  console.log(`  user=${p.user_id} | ${p.match_id}: ${p.home}-${p.away}`);
});
