import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// -----------------------------------------------------------------------
// Seeds the app with the REAL 2026/27 UEFA Champions League League Phase —
// the actual draw held Aug 27, 2026 — pulled directly from UEFA's own public
// match/draw APIs (see scripts/pull-real-cl-2026.mjs). Real teams, real
// logos, real matchday pairings/home-away, real UEFA-scheduled kickoff
// dates. Replaces the earlier placeholder (real 2024/25 fixtures re-dated
// onto guessed windows) now that the actual fixtures exist.
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

const teamsPath = process.argv[2] || path.resolve(process.cwd(), 'data', 'real-cl-2026-teams.json');
const matchesPath = process.argv[3] || path.resolve(process.cwd(), 'data', 'real-cl-2026-matches.json');

const teamRows = JSON.parse(fs.readFileSync(teamsPath, 'utf-8'));
const matchRows = JSON.parse(fs.readFileSync(matchesPath, 'utf-8'));

async function run() {
  console.log('🧹 Clearing existing predictions (tied to the placeholder fixtures)...');
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

  console.log('✅ Done. Real 2026/27 teams, logos, and matchday pairings are live.');
}

run();
