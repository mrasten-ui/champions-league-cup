/**
 * backfill-bracket-predictions.mjs
 *
 * One-time script: reads the June 11 predictions backup CSV and writes
 * bracket_predictions JSONB to profiles for the 4 users who changed
 * group predictions since then via SUBs (or direct DB edit).
 *
 * Usage:
 *   node scripts/backfill-bracket-predictions.mjs           # dry run — prints snapshots
 *   node scripts/backfill-bracket-predictions.mjs --write   # writes to DB
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WRITE = process.argv.includes('--write');
const BACKUP_CSV = path.resolve('c:/Users/mrast/Downloads/predictions_rows (7).csv');
const GROUP_RE = /^[A-L]\d$/;

// These 4 users changed group predictions after the June 11 backup.
// We restore the pre-change snapshot as bracket_predictions.
const AFFECTED_USERS = [
  'bolters@gmail.com',
  'seanbriggs_1@hotmail.co.uk',
  'daniel.garton@icloud.com',
  'mrasten@gmail.com',
];

// Known changes for display purposes
const KNOWN_CHANGES = {
  'bolters@gmail.com':          { L1: '1-1 → 3-1' },
  'seanbriggs_1@hotmail.co.uk': { B1: '1-1 → 2-1' },
  'daniel.garton@icloud.com':   { A2: '3-3 → 1-1', D1: '1-3 → 1-0' },
  'mrasten@gmail.com':          { A4: '1-1 → 3-1 (direct DB edit)' },
};

// Parse CSV — simple split is safe here (no JSON arrays in predictions rows)
const raw = fs.readFileSync(BACKUP_CSV, 'utf8').trim().split('\n');
const headers = raw[0].split(',').map(h => h.trim());
const rows = raw.slice(1).map(line => {
  const parts = line.split(',');
  return Object.fromEntries(headers.map((h, i) => [h, (parts[i] ?? '').trim()]));
});

console.log(`\nSource: ${BACKUP_CSV}`);
console.log(`Backup rows: ${rows.length}`);
console.log(`Mode: ${WRITE ? '*** WRITE ***' : 'DRY RUN'}\n`);
console.log('='.repeat(60));

for (const email of AFFECTED_USERS) {
  const userRows = rows.filter(r => r.user_id === email && GROUP_RE.test(r.match_id));
  const snapshot = Object.fromEntries(
    userRows.map(r => [r.match_id, { home: Number(r.home), away: Number(r.away) }])
  );

  console.log(`\n${email}`);
  console.log(`  Group predictions in backup: ${userRows.length}`);

  const changes = KNOWN_CHANGES[email] || {};
  for (const [match, diff] of Object.entries(changes)) {
    const snap = snapshot[match];
    const snapStr = snap ? `${snap.home}-${snap.away}` : 'MISSING';
    console.log(`  ${match}: backup=${snapStr}  (current live: ${diff})`);
  }

  // Print a sample to sanity-check
  const sampleKeys = ['A1', 'A4', 'L1', 'B1'];
  const sampleStr = sampleKeys
    .filter(k => snapshot[k])
    .map(k => `${k}=${snapshot[k].home}-${snapshot[k].away}`)
    .join('  ');
  console.log(`  Sample: ${sampleStr}`);

  if (WRITE) {
    const { error } = await supabase
      .from('profiles')
      .update({ bracket_predictions: snapshot })
      .eq('email', email);
    if (error) {
      console.error(`  ERROR: ${error.message}`);
    } else {
      console.log(`  bracket_predictions written (${userRows.length} entries)`);
    }
  } else {
    console.log(`  → Would write bracket_predictions with ${userRows.length} entries`);
  }
}

console.log('\n' + '='.repeat(60));
if (!WRITE) {
  console.log('DRY RUN complete — no changes made.');
  console.log('Run with --write to apply.\n');
} else {
  console.log('Done.\n');
}
