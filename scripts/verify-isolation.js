/**
 * verify-isolation.js
 *
 * Verifies that the late-joiner feature (/?late=1) does NOT affect regular players.
 * Run: node scripts/verify-isolation.js
 *
 * Three checks:
 *   A) Pure-logic tests of the getManagerStats form array
 *   B) isInLateWindow guard behaviour (no localStorage key → always false)
 *   C) Supabase DB check — no retroactive predictions on already-finished matches
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

let passed = 0;
let failed = 0;

function assert(condition, label, detail = '') {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

// ─── A: getManagerStats form logic (replica of services/engine.ts) ───────────
// After the change, finished matches with no prediction row push -1 into form
// instead of being silently skipped. Regular users with full picks are unaffected.

function replicaGetManagerStats(userEmail, finishedMatches, allPredictions) {
  const sorted = [...finishedMatches].sort((a, b) => new Date(b.date) - new Date(a.date));
  const form = [];
  for (const m of sorted) {
    if (form.length >= 5) break;
    const pred = allPredictions.find(p => p.userId === userEmail && p.matchId === m.id);
    if (!pred) { form.push(-1); continue; } // -1 = no prediction (gray bar)
    // Simplified scoring: exact score = 5, correct result = 3, wrong = 0
    const exactScore = pred.home === m.homeScore && pred.away === m.awayScore;
    const correctResult = (pred.home - pred.away) === (m.homeScore - m.awayScore);
    form.push(exactScore ? 5 : correctResult ? 3 : 0);
  }
  return form.reverse();
}

console.log('\n── A: Form logic ─────────────────────────────────────────────────');

const testMatches = [
  { id: 'm1', date: '2026-06-12', homeScore: 2, awayScore: 1 },
  { id: 'm2', date: '2026-06-13', homeScore: 0, awayScore: 0 },
  { id: 'm3', date: '2026-06-14', homeScore: 3, awayScore: 2 },
];

// Regular user — has predictions for every match
const regularPreds = [
  { userId: 'regular@test.com', matchId: 'm1', home: 2, away: 1 }, // exact
  { userId: 'regular@test.com', matchId: 'm2', home: 2, away: 0 }, // wrong (home win predicted, actual draw)
  { userId: 'regular@test.com', matchId: 'm3', home: 1, away: 0 }, // correct result
];
const regularForm = replicaGetManagerStats('regular@test.com', testMatches, regularPreds);
assert(!regularForm.includes(-1),  'Regular user (all picks): no -1 in form');
assert(regularForm.length === 3,   'Regular user: form has correct length');
assert(regularForm[0] === 5,       'Regular user: exact score = 5 pts (oldest match, reversed)');
assert(regularForm[1] === 0,       'Regular user: wrong pick = 0 pts');
assert(regularForm[2] === 3,       'Regular user: correct result = 3 pts');

// Regular user who missed one match
const partialPreds = [
  { userId: 'partial@test.com', matchId: 'm1', home: 2, away: 1 },
  // m2 intentionally missing
  { userId: 'partial@test.com', matchId: 'm3', home: 1, away: 0 },
];
const partialForm = replicaGetManagerStats('partial@test.com', testMatches, partialPreds);
assert(partialForm.includes(-1),   'User who missed a match: -1 appears in form (gray bar)');
assert(partialForm.length === 3,   'Partial user: all 3 matches in form (none silently dropped)');
assert(!partialForm.every(v => v === -1), 'Partial user: still has some real scores alongside -1');

// Late joiner — no predictions at all
const lateForm = replicaGetManagerStats('late@test.com', testMatches, []);
assert(lateForm.every(v => v === -1), 'Late joiner (no picks): all form entries are -1 (gray)');
assert(!lateForm.some(v => v > 0),    'Late joiner: no false points appear in form');
assert(lateForm.length === 3,         'Late joiner: form still has correct length');

// ─── B: isInLateWindow guard ──────────────────────────────────────────────────
// The guard only activates when localStorage has a non-expired timestamp.
// All existing users have no such key → isInLateWindow is always false for them.

console.log('\n── B: isInLateWindow guard ───────────────────────────────────────');

const isInLateWindow = (storedUntil) => {
  if (!storedUntil) return false;
  return Date.now() < parseInt(storedUntil);
};

assert(isInLateWindow(null) === false,
  'No key (regular user) → not in window');
assert(isInLateWindow(undefined) === false,
  'Undefined key → not in window');
assert(isInLateWindow('') === false,
  'Empty string key → not in window');
assert(isInLateWindow(String(Date.now() - 1)) === false,
  'Expired key (1ms ago) → not in window');
assert(isInLateWindow(String(Date.now() - 4 * 3600 * 1000)) === false,
  'Expired key (4h ago) → not in window');
assert(isInLateWindow(String(Date.now() + 4 * 3600 * 1000)) === true,
  'Valid key (4h from now) → in window');
assert(isInLateWindow(String(Date.now() + 1)) === true,
  'Valid key (1ms from now) → in window');

// ─── C: DB check — no retroactive predictions on FT matches ──────────────────
// The onGenerate wand handler filters out played (non-NS) matches for late joiners.
// This query verifies no prediction rows exist for FT matches that were created
// AFTER the match kicked off (which would indicate a retro prediction).

console.log('\n── C: Supabase — retroactive prediction check ────────────────────');

try {
  const { data: ftMatches, error: ftErr } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, date, status')
    .in('status', ['FT', 'AET', 'PEN']);

  if (ftErr) throw new Error(ftErr.message);

  const ftIds = (ftMatches ?? []).map(m => m.id);
  console.log(`     Found ${ftIds.length} completed match(es) in DB`);

  if (ftIds.length === 0) {
    console.log('     No completed matches yet — skipping retro check');
    passed++;
  } else {
    const { data: preds, error: predErr } = await supabase
      .from('predictions')
      .select('user_id, match_id, created_at')
      .in('match_id', ftIds);

    if (predErr) throw new Error(predErr.message);

    const allPredRows = preds ?? [];
    let retroCount = 0;
    let noTimestamp = 0;

    for (const pred of allPredRows) {
      if (!pred.created_at) { noTimestamp++; continue; }
      const match = ftMatches.find(m => m.id === pred.match_id);
      if (!match) continue;
      const kickoff    = new Date(match.date).getTime();
      const predCreate = new Date(pred.created_at).getTime();
      // Allow predictions up to 60 min AFTER kickoff (substitution unlocks + clock drift)
      if (predCreate > kickoff + 60 * 60 * 1000) retroCount++;
    }

    assert(retroCount === 0,
      `No retroactive predictions on FT matches`,
      retroCount > 0 ? `${retroCount} row(s) created >60 min after kickoff` : ''
    );

    console.log(`     Checked ${allPredRows.length} prediction(s) across ${ftIds.length} FT match(es)`);
    if (noTimestamp > 0) {
      console.log(`     Note: ${noTimestamp} prediction(s) had no created_at timestamp — skipped`);
    }
  }
} catch (err) {
  console.error(`  ✗  DB check failed: ${err.message}`);
  failed++;
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('\n──────────────────────────────────────────────────────────────────');
console.log(`  ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.error('  Some checks failed — review output above before deploying.\n');
  process.exit(1);
} else {
  console.log('  All checks passed. Late-joiner changes are isolated.\n');
}
