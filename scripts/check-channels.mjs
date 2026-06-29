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

const { data, error } = await sb
  .from('matches')
  .select('id,home_team_id,away_team_id,date,channels,round')
  .not('round', 'is', null)
  .order('date');

if (error) { console.error(error); process.exit(1); }

console.log('Knockout matches and their channels:\n');
data.forEach(m => {
  const ch = m.channels || {};
  const en = ch.EN || '—';
  const sco = ch.SCO || '—';
  const us = ch.US || '—';
  const no = ch.NO || '—';
  console.log(`${m.id.padEnd(8)} ${(m.home_team_id||'TBD').padEnd(4)} vs ${(m.away_team_id||'TBD').padEnd(4)}  EN=${en.padEnd(4)} SCO=${sco.padEnd(4)} US=${us.padEnd(4)} NO=${no}`);
});
