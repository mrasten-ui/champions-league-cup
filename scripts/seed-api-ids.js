import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

/**
 * seed-api-ids.js — ONE-TIME SETUP (run before kickoff)
 *
 * Fetches all WC2026 fixtures from API-Football and writes the external
 * api_id into matching rows in your Supabase 'matches' table.
 * Matching is done by: home_team_id + away_team_id + date (date portion only).
 *
 * Uses the `code` field on each team (e.g. "BEL", "ENG") which directly
 * matches our internal 3-letter team IDs. Add CODE_OVERRIDE entries if the
 * seed run reports any unmatched fixtures.
 *
 * Run from project root:
 *   node scripts/seed-api-ids.js
 */

// Accepts both the Vite-prefixed names from .env and the plain names used in GitHub Actions
const SUPABASE_URL         = process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const API_KEY   = process.env.API_FOOTBALL_KEY;
const LEAGUE_ID = 1;
const SEASON    = 2026;

// Only needed when API's 3-letter code differs from our internal ID.
// e.g. if API returns "code": "KSA" but our DB uses "SAU", add: SAU: "KSA"
// Run the script once and check the "Unmatched" log to find any needed overrides.
const CODE_OVERRIDE = {
  // Example: "IRN": "IRI"  — add entries here if the seed run shows mismatches
};

async function seedApiIds() {
  console.log('Fetching fixtures from API-Football...');

  const res  = await fetch(
    `https://v3.football.api-sports.io/fixtures?league=${LEAGUE_ID}&season=${SEASON}`,
    { headers: { 'x-apisports-key': API_KEY } }
  );
  const data = await res.json();

  console.log(`API HTTP status: ${res.status}`);
  console.log(`API errors:`, JSON.stringify(data.errors));

  if (!data.response?.length) {
    console.error('No fixtures returned. Verify API key, league ID, and season.');
    process.exit(1);
  }

  console.log(`Got ${data.response.length} fixtures. Fetching DB matches...`);

  const { data: dbMatches, error } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, date, api_id');

  if (error) { console.error('DB fetch error:', error.message); process.exit(1); }

  let linked = 0;
  const unmatched = [];

  for (const item of data.response) {
    const { fixture, teams } = item;
    const apiId  = fixture.id.toString();
    const apiDate = fixture.date?.slice(0, 10);

    const rawHome = teams.home.code?.toUpperCase();
    const rawAway = teams.away.code?.toUpperCase();
    const homeId  = CODE_OVERRIDE[rawHome] ?? rawHome;
    const awayId  = CODE_OVERRIDE[rawAway] ?? rawAway;

    if (!homeId || !awayId) {
      unmatched.push(`MISSING CODE: "${teams.home.name}" (${rawHome}) vs "${teams.away.name}" (${rawAway})`);
      continue;
    }

    const match = dbMatches.find(m =>
      m.home_team_id?.toUpperCase() === homeId &&
      m.away_team_id?.toUpperCase() === awayId &&
      m.date?.slice(0, 10) === apiDate
    );

    if (!match) {
      unmatched.push(`NOT IN DB: ${homeId} vs ${awayId} on ${apiDate}`);
      continue;
    }

    if (match.api_id === apiId) { linked++; continue; } // already set

    const { error: updateErr } = await supabase
      .from('matches')
      .update({ api_id: apiId })
      .eq('id', match.id);

    if (updateErr) {
      console.error(`  ✗ ${match.id}: ${updateErr.message}`);
    } else {
      console.log(`  ✓ ${homeId} vs ${awayId} (${apiDate}) → api_id=${apiId}`);
      linked++;
    }
  }

  console.log(`\nLinked: ${linked} / ${data.response.length}`);
  if (unmatched.length) {
    console.warn(`\nUnmatched (${unmatched.length}) — add to CODE_OVERRIDE or fix DB dates:`);
    unmatched.forEach(u => console.warn('  •', u));
  } else {
    console.log('All fixtures linked successfully!');
  }
}

seedApiIds();
