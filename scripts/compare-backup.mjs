/**
 * compare-backup.mjs
 *
 * Reads a predictions CSV backup and compares group-stage rows against
 * the current Supabase DB. Any difference = a SUB was used after the backup.
 *
 * Usage: node scripts/compare-backup.mjs "<path-to-csv>"
 *
 * Prints changed predictions only — NO writes to the DB.
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

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node scripts/compare-backup.mjs "<path-to-backup.csv>"');
  process.exit(1);
}

// Parse CSV
const raw = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
const headers = raw[0].split(',').map(h => h.trim());
const backup = raw.slice(1).map(line => {
  const parts = line.split(',');
  return Object.fromEntries(headers.map((h, i) => [h, (parts[i] ?? '').trim()]));
});

// Filter to group matches only (A1–L6)
const GROUP_RE = /^[A-L]\d$/;
const backupGroup = backup.filter(r => GROUP_RE.test(r.match_id));

console.log(`Backup has ${backupGroup.length} group-stage predictions across ${new Set(backupGroup.map(r => r.user_id)).size} users.\n`);

// Fetch ALL current group-stage predictions from DB
const { data: current, error } = await supabase
  .from('predictions')
  .select('user_id, match_id, home, away');

if (error) {
  console.error('Supabase error:', error.message);
  process.exit(1);
}

const currentGroup = current.filter(r => GROUP_RE.test(r.match_id));
const currentMap = new Map(currentGroup.map(r => [`${r.user_id}::${r.match_id}`, r]));

// Find differences
const changes = [];
for (const row of backupGroup) {
  const key = `${row.user_id}::${row.match_id}`;
  const cur = currentMap.get(key);
  if (!cur) continue;
  if (Number(row.home) !== cur.home || Number(row.away) !== cur.away) {
    changes.push({
      user: row.user_id,
      match: row.match_id,
      backup: `${row.home}-${row.away}`,
      current: `${cur.home}-${cur.away}`,
    });
  }
}

if (changes.length === 0) {
  console.log('No changes found — backup matches current DB exactly for group predictions.');
} else {
  console.log(`Found ${changes.length} changed group prediction(s) (these are the SUBs):\n`);
  console.table(changes);

  const affectedUsers = [...new Set(changes.map(c => c.user))];
  console.log(`\nAffected users: ${affectedUsers.join(', ')}`);

  // Show what knockout predictions would be restored for these users
  const KNOCKOUT_RE = /^(R32|R16|QF|SF|3RD|FIN)/;
  const backupKO = backup.filter(
    r => KNOCKOUT_RE.test(r.match_id) && affectedUsers.includes(r.user_id)
  );

  console.log(`\n--- Knockout predictions that would be RESTORED from backup (${backupKO.length} rows) ---`);
  console.log('(NOT written yet — review before proceeding)\n');
  for (const u of affectedUsers) {
    const rows = backupKO.filter(r => r.user_id === u);
    console.log(`${u} (${rows.length} knockout picks):`);
    for (const r of rows) {
      console.log(`  ${r.match_id}: ${r.home}-${r.away}`);
    }
    console.log();
  }
}
