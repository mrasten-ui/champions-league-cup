/**
 * import-scouting-content.mjs
 *
 * Companion to generate-scouting-content.mjs, for when the content was
 * generated externally (e.g. pasted from a Claude chat) instead of through
 * the Gemini/daily-brief edge function. Reads a JSON file — an array of
 * { team_id, strengths, weaknesses, scout_notes } — validates each entry's
 * shape, and upserts into scouting_overview.
 *
 * Usage:
 *   node scripts/import-scouting-content.mjs <path-to-json> --dry-run
 *   node scripts/import-scouting-content.mjs <path-to-json>
 *
 * Required env vars:
 *   SUPABASE_URL / VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY / SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import 'dotenv/config';

const isDryRun = process.argv.includes('--dry-run');
const filePath = process.argv[2];

if (!filePath || filePath.startsWith('--')) {
  console.error('Usage: node scripts/import-scouting-content.mjs <path-to-json> [--dry-run]');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

function parseJsonLoose(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  return JSON.parse(cleaned);
}

async function main() {
  console.log(`\n=== import-scouting-content.mjs ${isDryRun ? '(DRY RUN)' : '(LIVE)'} ===\n`);

  const raw = readFileSync(filePath, 'utf8');
  const entries = parseJsonLoose(raw);
  if (!Array.isArray(entries)) throw new Error('Expected a JSON array of team entries');

  const { data: teams, error } = await supabase.from('teams').select('id');
  if (error) throw error;
  const validIds = new Set(teams.map(t => t.id));

  const rows = [];
  const problems = [];
  for (const entry of entries) {
    const { team_id, strengths, weaknesses, scout_notes } = entry;
    if (!validIds.has(team_id)) { problems.push(`${team_id}: not a known team_id`); continue; }
    if (!Array.isArray(strengths) || strengths.length !== 3) { problems.push(`${team_id}: strengths must be exactly 3 items`); continue; }
    if (!Array.isArray(weaknesses) || weaknesses.length !== 3) { problems.push(`${team_id}: weaknesses must be exactly 3 items`); continue; }
    if (typeof scout_notes !== 'string' || !scout_notes.trim()) { problems.push(`${team_id}: scout_notes missing`); continue; }
    rows.push({ team_id, strengths: JSON.stringify(strengths), weaknesses: JSON.stringify(weaknesses), scout_notes });
  }

  console.log(`Valid entries: ${rows.length}/${entries.length}`);
  if (problems.length) {
    console.log(`\nProblems (${problems.length}):`);
    problems.forEach(p => console.log(`  - ${p}`));
  }

  const missingIds = [...validIds].filter(id => !rows.some(r => r.team_id === id));
  if (missingIds.length) console.log(`\nTeams with no entry at all: ${missingIds.join(', ')}`);

  if (isDryRun) {
    console.log('\nDry run — nothing written. Re-run without --dry-run to commit.');
    if (rows.length) console.log('\n--- Sample (first row) ---\n' + JSON.stringify(rows[0], null, 2));
    return;
  }

  console.log('\nWriting scouting_overview table...');
  for (const row of rows) {
    const { error: upsertErr } = await supabase.from('scouting_overview').upsert(row, { onConflict: 'team_id' });
    if (upsertErr) console.warn(`⚠️  upsert failed for ${row.team_id}:`, upsertErr.message);
    else console.log(`  ${row.team_id}: ok`);
  }
  console.log('\nDone.');
}

main().catch((e) => { console.error(e); process.exit(1); });
