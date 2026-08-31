/**
 * Manually record a match score/status — for use when the live-sync script
 * (sync-scores-uefa.mjs) is unavailable or hasn't been run yet. Works for
 * both live in-progress updates (e.g. after each goal) and final results.
 *
 * Usage:
 *   node scripts/set-match-result.mjs <matchId> <homeScore> <awayScore> [status] [minute] [penaltyWinner]
 *
 * Examples (live, goal-by-goal):
 *   node scripts/set-match-result.mjs FIN_1 1 0 1H 23     (1-0, 23rd minute, 1st half)
 *   node scripts/set-match-result.mjs FIN_1 1 1 2H 67     (1-1, 67th minute, 2nd half)
 *   node scripts/set-match-result.mjs FIN_1 1 1 HT        (half-time, minute optional)
 *
 * Examples (final):
 *   node scripts/set-match-result.mjs FIN_1 2 1 FT
 *   node scripts/set-match-result.mjs FIN_1 1 1 AET       (extra time, still level)
 *   node scripts/set-match-result.mjs FIN_1 1 1 PEN "" RMA   (level after 120, Real Madrid won the shootout)
 *
 * status defaults to FT if omitted. Valid: NS, 1H, HT, 2H, ET, P, LIVE, FT, AET, PEN.
 *
 * PEN note: homeScore/awayScore MUST stay the real football score at the
 * final whistle (90/120 min) — never inflate it to reflect the shootout
 * winner. calculatePoints/calculatePenaltyBonus (services/engine.ts) need
 * the real scoreline for exact-score comparisons and derive the shootout
 * winner from the separate `penaltyWinner` argument (a team id), which is
 * written to matches.penalty_winner_id. Omit it for any non-PEN result.
 *
 * is_locked is set true for any status except NS (predictions lock the
 * moment a match goes live).
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

const [matchId, homeScoreStr, awayScoreStr, status = 'FT', minuteStr, penaltyWinner] = process.argv.slice(2);

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

if (penaltyWinner && status !== 'PEN') {
  console.error('penaltyWinner only makes sense with status PEN.');
  process.exit(1);
}
if (status === 'PEN' && homeScore !== awayScore) {
  console.error('status PEN implies the score was level at 120 min — homeScore must equal awayScore (the pre-penalties football score).');
  process.exit(1);
}

const { data: existing, error: fetchErr } = await supabase
  .from('matches')
  .select('id, home_team_id, away_team_id, home_score, away_score, status')
  .eq('id', matchId)
  .single();

if (fetchErr || !existing) {
  console.error(`Match ${matchId} not found:`, fetchErr?.message);
  process.exit(1);
}

if (penaltyWinner && penaltyWinner !== existing.home_team_id && penaltyWinner !== existing.away_team_id) {
  console.error(`penaltyWinner "${penaltyWinner}" must be either ${existing.home_team_id} or ${existing.away_team_id}.`);
  process.exit(1);
}

console.log(`Current: ${matchId}  ${existing.home_team_id} ${existing.home_score ?? '-'}-${existing.away_score ?? '-'} ${existing.away_team_id}  [${existing.status}]`);
console.log(`New:     ${matchId}  ${existing.home_team_id} ${homeScore}-${awayScore} ${existing.away_team_id}  [${status}]${minute !== null ? ` ${minute}'` : ''}${penaltyWinner ? `  pens: ${penaltyWinner}` : ''}`);

const { error: updateErr } = await supabase
  .from('matches')
  .update({ home_score: homeScore, away_score: awayScore, status, is_locked: isLocked, minute, penalty_winner_id: penaltyWinner || null })
  .eq('id', matchId);

if (updateErr) {
  console.error('Update failed:', updateErr.message);
  process.exit(1);
}

console.log('Updated.');
process.exit(0);
