import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// -----------------------------------------------------------------------
// Seeds the app with the REAL 2024/25 UEFA Champions League League Phase —
// the first season of the current 36-team Swiss format — pulled from
// API-Football (scripts/../scratchpad pull step). Real teams, real logos,
// real matchday pairings/home-away, but re-dated onto the actual UEFA-
// announced 2026/27 matchday calendar with scores reset to null/UPCOMING,
// so it still works as a live "predict this round" experience instead of
// a synthetic round-robin. See scratchpad/pull-real-cl-2024.mjs for the
// extraction step (teams.json / matches.json produced there are the input
// to this script).
// -----------------------------------------------------------------------

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: '.env.local' });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const teamsPath = process.argv[2] || path.resolve(process.cwd(), 'real-cl-2024-teams.json');
const matchesPath = process.argv[3] || path.resolve(process.cwd(), 'real-cl-2024-matches.json');

const teamRows = JSON.parse(fs.readFileSync(teamsPath, 'utf-8'));
const matchRows = JSON.parse(fs.readFileSync(matchesPath, 'utf-8'));

async function run() {
  console.log('🧹 Clearing existing predictions (test-account picks tied to the old fixtures)...');
  const { error: predDelErr } = await supabase.from('predictions').delete().neq('id', -1);
  if (predDelErr) { console.error('❌ Failed to clear predictions:', predDelErr.message); process.exit(1); }

  console.log('🧹 Clearing existing League Phase matches...');
  const { error: matchDelErr } = await supabase.from('matches').delete().is('round', null);
  if (matchDelErr) { console.error('❌ Failed to clear matches:', matchDelErr.message); process.exit(1); }

  console.log('🧹 Clearing existing teams...');
  const { error: teamDelErr } = await supabase.from('teams').delete().neq('id', '__none__');
  if (teamDelErr) { console.error('❌ Failed to clear teams:', teamDelErr.message); process.exit(1); }

  console.log(`🌍 Inserting ${teamRows.length} real teams...`);
  const { error: teamErr } = await supabase.from('teams').insert(teamRows);
  if (teamErr) { console.error('❌ Team insert failed:', teamErr.message); process.exit(1); }

  console.log(`🗓️  Inserting ${matchRows.length} real League Phase matches...`);
  const { error: matchErr } = await supabase.from('matches').insert(matchRows);
  if (matchErr) { console.error('❌ Match insert failed:', matchErr.message); process.exit(1); }

  console.log('✅ Done. Real 2024/25 teams, logos, and matchday pairings are live.');
}

run();
