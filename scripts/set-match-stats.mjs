/**
 * Manually upsert live match stats (shots, possession, cards, etc.) — for use
 * when the live-sync API is unavailable. Mirrors the match_stats table shape
 * consumed by hooks/useAppData.ts's fetchStats().
 *
 * Usage:
 *   node scripts/set-match-stats.mjs <matchId> '<jsonStats>'
 *
 * jsonStats keys (all optional, all numbers): homeShots, awayShots,
 * homeShotsOnTarget, awayShotsOnTarget, homePossession, awayPossession,
 * homeCorners, awayCorners, homeFouls, awayFouls, homeYellow, awayYellow,
 * homeRed, awayRed, homeOffsides, awayOffsides, homeXg, awayXg
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const [matchId, jsonStats] = process.argv.slice(2);
if (!matchId || !jsonStats) {
  console.error("Usage: node scripts/set-match-stats.mjs <matchId> '<jsonStats>'");
  process.exit(1);
}

let stats;
try { stats = JSON.parse(jsonStats); } catch (e) { console.error('Invalid JSON:', e.message); process.exit(1); }

const FIELD_MAP = {
  homeXg: 'home_xg', awayXg: 'away_xg',
  homeShots: 'home_shots', awayShots: 'away_shots',
  homeShotsOnTarget: 'home_shots_on_target', awayShotsOnTarget: 'away_shots_on_target',
  homePossession: 'home_possession', awayPossession: 'away_possession',
  homeCorners: 'home_corners', awayCorners: 'away_corners',
  homeFouls: 'home_fouls', awayFouls: 'away_fouls',
  homeYellow: 'home_yellow', awayYellow: 'away_yellow',
  homeRed: 'home_red', awayRed: 'away_red',
  homeOffsides: 'home_offsides', awayOffsides: 'away_offsides',
};

const payload = { match_id: matchId };
for (const [key, col] of Object.entries(FIELD_MAP)) {
  if (stats[key] !== undefined) payload[col] = stats[key];
}

console.log(`Upserting match_stats for ${matchId}:`, payload);

const { error } = await supabase.from('match_stats').upsert(payload, { onConflict: 'match_id' });
if (error) { console.error('Update failed:', error.message); process.exit(1); }

console.log('Updated.');
process.exit(0);
