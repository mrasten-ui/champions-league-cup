/**
 * Manually record a match score/status — for use when the live-sync API
 * (sync-scores.js) is unavailable (e.g. out of API credits). Works for both
 * live in-progress updates (e.g. after each goal) and final results.
 *
 * Usage:
 *   node scripts/set-match-result.mjs <matchId> <homeScore> <awayScore> [status] [minute]
 *
 * Examples (live, goal-by-goal):
 *   node scripts/set-match-result.mjs FIN_1 1 0 1H 23     (1-0, 23rd minute, 1st half)
 *   node scripts/set-match-result.mjs FIN_1 1 1 2H 67     (1-1, 67th minute, 2nd half)
 *   node scripts/set-match-result.mjs FIN_1 1 1 HT        (half-time, minute optional)
 *
 * Examples (final):
 *   node scripts/set-match-result.mjs FIN_1 2 1 FT
 *   node scripts/set-match-result.mjs FIN_1 1 1 AET       (extra time, still level)
 *   node scripts/set-match-result.mjs FIN_1 2 1 PEN       (won on penalties — see note below)
 *
 * status defaults to FT if omitted. Valid: NS, 1H, HT, 2H, ET, P, LIVE, FT, AET, PEN.
 *
 * PEN note: the scoring engine only compares home_score vs away_score (it
 * ignores status), so for a penalty-shootout win you must report the score
 * with the winner strictly ahead — e.g. if normal+extra time ended 1-1 and
 * the home side won the shootout, enter homeScore=2 awayScore=1 (not the
 * literal penalty count). This matches what sync-scores.js does automatically.
 *
 * is_locked is set true for any status except NS (matches sync-scores.js's
 * LOCKED_STATUSES — predictions lock the moment a match goes live).
 *
 * Live caveat: this writes straight to the matches table, so score/status
 * updates show up immediately, but it doesn't insert match_events rows —
 * so it won't trigger the app's live goal push-notifications the way the
 * real sync does. Fine for "seeing it update," just no phone buzz for others.
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const [matchId, homeScoreStr, awayScoreStr, status = 'FT', minuteStr] = process.argv.slice(2);

if (!matchId || homeScoreStr === undefined || awayScoreStr === undefined) {
  console.error('Usage: node scripts/set-match-result.mjs <matchId> <homeScore> <awayScore> [status] [minute]');
  process.exit(1);
}

const homeScore = Number(homeScoreStr);
const awayScore = Number(awayScoreStr);
if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
  console.error('homeScore and awayScore must be integers.');
  process.exit(1);
}

const VALID_STATUSES = ['NS', '1H', 'HT', '2H', 'ET', 'P', 'LIVE', 'FT', 'AET', 'PEN'];
if (!VALID_STATUSES.includes(status)) {
  console.error(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  process.exit(1);
}

const minute = minuteStr !== undefined ? Number(minuteStr) : null;
if (minuteStr !== undefined && !Number.isInteger(minute)) {
  console.error('minute must be an integer.');
  process.exit(1);
}

const isLocked = status !== 'NS';

const { data: existing, error: fetchErr } = await supabase
  .from('matches')
  .select('id, home_team_id, away_team_id, home_score, away_score, status')
  .eq('id', matchId)
  .single();

if (fetchErr || !existing) {
  console.error(`Match ${matchId} not found:`, fetchErr?.message);
  process.exit(1);
}

console.log(`Current: ${matchId}  ${existing.home_team_id} ${existing.home_score ?? '-'}-${existing.away_score ?? '-'} ${existing.away_team_id}  [${existing.status}]`);
console.log(`New:     ${matchId}  ${existing.home_team_id} ${homeScore}-${awayScore} ${existing.away_team_id}  [${status}]${minute !== null ? ` ${minute}'` : ''}`);

const { error: updateErr } = await supabase
  .from('matches')
  .update({ home_score: homeScore, away_score: awayScore, status, is_locked: isLocked, minute })
  .eq('id', matchId);

if (updateErr) {
  console.error('Update failed:', updateErr.message);
  process.exit(1);
}

console.log('Updated.');
process.exit(0);
