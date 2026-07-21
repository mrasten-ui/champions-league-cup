/**
 * auto-fill-missed-predictions.js
 *
 * Safety net for the League Phase: for any user who set a risk profile at
 * signup, auto-generates a plausible score for any League Phase match whose
 * 1-hour prediction lock has already passed with no prediction from them.
 * Never touches a match the user actually predicted — only fills a true gap.
 *
 * Mirrors send-reminders.js's shape. Reimplements a simplified, two-axis
 * version of services/engine.ts's generateMagicScores in plain JS rather than
 * importing it directly — engine.ts pulls in supabase.ts, which reads
 * import.meta.env at module load time and crashes under plain `node` (no
 * Vite), and this project's scripts have no TS transpiler. Same reason
 * scripts/backfill-predicted-winners.js already duplicates engine.ts's
 * bracket logic instead of importing it.
 *
 * Usage:
 *   node scripts/auto-fill-missed-predictions.js           # writes predictions
 *   node scripts/auto-fill-missed-predictions.js --dry-run # logs what would be written, writes nothing
 *
 * Required env vars:
 *   SUPABASE_URL / VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY / SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const isDryRun = process.argv.includes('--dry-run');

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOCK_WINDOW_MS = 60 * 60 * 1000; // same rolling window as utils/date.ts's isMatchLocked

// Adapted from services/engine.ts's generateMagicScores, split into two
// independent axes: riskResult drives the existing favorite-bias/luck-range
// blend, riskScoring drives expected goals directly (new — the original only
// had a single blended riskLevel and a fixed random baseGoals).
function generateScore(homeTeam, awayTeam, riskResult, riskScoring, favorites) {
  const eloH = homeTeam.elo_rating;
  const eloA = awayTeam.elo_rating;
  let eloGoalDiff = 0;
  if (eloH && eloA) {
    const winProbH = 1 / (1 + Math.pow(10, -(eloH - eloA) / 400));
    eloGoalDiff = (winProbH - 0.5) * 3.0;
  } else {
    const rH = homeTeam.rank || 100;
    const rA = awayTeam.rank || 100;
    eloGoalDiff = (rA - rH) / 15;
  }

  const attDefH = ((homeTeam.att || 50) - (awayTeam.def || 50)) / 50;
  const attDefA = ((awayTeam.att || 50) - (homeTeam.def || 50)) / 50;

  const eloWeight = 0.90 - riskResult * 0.40;
  const adWeight = 1 - eloWeight;
  const skillH = eloGoalDiff * eloWeight + attDefH * adWeight;
  const skillA = -eloGoalDiff * eloWeight + attDefA * adWeight;

  const matchTightness = Math.max(0, 1 - Math.abs(eloGoalDiff) / 1.5);
  const hFav = favorites.includes(homeTeam.id) ? (0.4 + matchTightness * 0.6) : 0;
  const aFav = favorites.includes(awayTeam.id) ? (0.4 + matchTightness * 0.6) : 0;

  // riskScoring: 0 = cagey (~0.6 avg goals/team), 1 = goal fest (~2.8 avg goals/team)
  const baseGoals = 0.6 + riskScoring * 2.2;
  const luckRange = 0.3 + riskResult * 2.2;
  const luckH = (Math.random() * 2 - 1) * luckRange;
  const luckA = (Math.random() * 2 - 1) * luckRange;

  const home = Math.round(Math.max(0, Math.min(9, baseGoals + skillH + hFav + luckH)));
  const away = Math.round(Math.max(0, Math.min(9, baseGoals + skillA + aFav + luckA)));
  return { home, away };
}

async function main() {
  console.log(`\n🎲 Auto-Fill Missed Predictions${isDryRun ? ' [DRY RUN]' : ''}\n`);

  // Only League Phase matches (round is null) — Knockout Phase auto-fill is deferred.
  const { data: matches, error: matchErr } = await supabase
    .from('matches')
    .select('id, date, home_team_id, away_team_id, round, status')
    .is('round', null);
  if (matchErr) { console.error('Matches fetch failed:', matchErr.message); process.exit(1); }

  const now = Date.now();
  const lockedMatches = (matches ?? []).filter(m => {
    if (!m.date || m.date === 'TBD') return false;
    if (!m.home_team_id || !m.away_team_id) return false;
    if (m.home_team_id === 'TBD' || m.away_team_id === 'TBD') return false;
    const kickoff = new Date(m.date).getTime();
    if (isNaN(kickoff)) return false;
    return now >= kickoff - LOCK_WINDOW_MS;
  });
  console.log(`   League Phase matches: ${matches?.length ?? 0}, locked: ${lockedMatches.length}`);

  if (lockedMatches.length === 0) {
    console.log('   Nothing locked yet. Done.\n');
    return;
  }

  // Fetch all predictions (paginated — Supabase returns max 1,000 rows per query)
  const PAGE = 1000;
  let allPredRows = [];
  let from = 0;
  let keepGoing = true;
  while (keepGoing) {
    const { data: page, error: pageErr } = await supabase
      .from('predictions')
      .select('user_id, match_id')
      .range(from, from + PAGE - 1);
    if (pageErr) { console.error('Predictions fetch error:', pageErr.message); process.exit(1); }
    if (page && page.length > 0) {
      allPredRows.push(...page);
      keepGoing = page.length === PAGE;
      from += PAGE;
    } else {
      keepGoing = false;
    }
  }
  const predictedSet = new Set(allPredRows.map(p => `${p.user_id}::${p.match_id}`));
  console.log(`   Prediction rows fetched: ${allPredRows.length}`);

  // Only players with a saved risk profile — null means "never set one," leave them alone.
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('email, favorites, risk_result, risk_scoring')
    .not('risk_result', 'is', null)
    .not('risk_scoring', 'is', null);
  if (profErr) { console.error('Profiles fetch failed:', profErr.message); process.exit(1); }
  console.log(`   Players with a risk profile: ${profiles?.length ?? 0}`);

  if (!profiles || profiles.length === 0) {
    console.log('   No players have a risk profile set. Done.\n');
    return;
  }

  const { data: teams, error: teamErr } = await supabase
    .from('teams')
    .select('id, att, def, rank, elo_rating');
  if (teamErr) { console.error('Teams fetch failed:', teamErr.message); process.exit(1); }
  const teamById = Object.fromEntries((teams ?? []).map(t => [t.id, t]));

  const toWrite = [];
  for (const profile of profiles) {
    const favorites = profile.favorites || [];
    for (const match of lockedMatches) {
      const key = `${profile.email}::${match.id}`;
      if (predictedSet.has(key)) continue; // genuine pick already exists — never overwrite

      const homeTeam = teamById[match.home_team_id];
      const awayTeam = teamById[match.away_team_id];
      if (!homeTeam || !awayTeam) continue;

      const { home, away } = generateScore(homeTeam, awayTeam, profile.risk_result, profile.risk_scoring, favorites);
      toWrite.push({ user_id: profile.email, match_id: match.id, home, away, auto_filled: true, label: `${profile.email} — ${match.id} (${home}-${away})` });
    }
  }

  console.log(`\n   Missing predictions to auto-fill: ${toWrite.length}\n`);

  if (toWrite.length === 0) {
    console.log('   Everyone with a risk profile is covered. Done.\n');
    return;
  }

  if (isDryRun) {
    toWrite.slice(0, 20).forEach(w => console.log(`   📝  [DRY RUN] Would write: ${w.label}`));
    if (toWrite.length > 20) console.log(`   ... and ${toWrite.length - 20} more`);
    console.log('\n   Done.\n');
    return;
  }

  // Batch upserts (500 rows at a time is comfortably under Supabase's request limits)
  const BATCH = 500;
  for (let i = 0; i < toWrite.length; i += BATCH) {
    const batch = toWrite.slice(i, i + BATCH).map(({ user_id, match_id, home, away, auto_filled }) => ({ user_id, match_id, home, away, auto_filled }));
    const { error } = await supabase.from('predictions').upsert(batch, { onConflict: 'user_id,match_id' });
    if (error) { console.error(`   ❌  Batch ${i / BATCH + 1} failed:`, error.message); process.exit(1); }
    console.log(`   ✅  Wrote batch ${i / BATCH + 1} (${batch.length} predictions)`);
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n   Done.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
