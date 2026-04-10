import { createClient } from '@supabase/supabase-js';

/**
 * seed-api-ids.js — ONE-TIME SETUP (run ~1 week before kickoff)
 *
 * Fetches all WC2026 fixtures from API-Football and writes the external
 * api_id into matching rows in your Supabase 'matches' table.
 * Matching is done by: home_team_id + away_team_id + date (date portion only).
 *
 * Run:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... API_FOOTBALL_KEY=... node scripts/seed-api-ids.js
 */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const API_KEY   = process.env.API_FOOTBALL_KEY;
const LEAGUE_ID = 1;
const SEASON    = 2026;

const TEAM_NAME_TO_ID = {
  "Mexico": "MEX", "South Africa": "RSA", "Korea Republic": "KOR",
  "South Korea": "KOR", "Czech Republic": "CZE", "Czechia": "CZE",
  "Canada": "CAN", "Bosnia and Herzegovina": "BIH", "Bosnia": "BIH",
  "Qatar": "QAT", "Switzerland": "SUI",
  "Brazil": "BRA", "Morocco": "MAR", "Haiti": "HAI", "Scotland": "SCO",
  "United States": "USA", "USA": "USA", "Paraguay": "PAR",
  "Australia": "AUS", "Turkey": "TUR", "Türkiye": "TUR",
  "Germany": "GER", "Curacao": "CUW", "Curaçao": "CUW",
  "Ivory Coast": "CIV", "Cote d'Ivoire": "CIV", "Ecuador": "ECU",
  "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "IR Iran": "IRN",
  "New Zealand": "NZL",
  "Spain": "ESP", "Cabo Verde": "CPV", "Cape Verde": "CPV",
  "Saudi Arabia": "KSA", "Uruguay": "URU",
  "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
  "Argentina": "ARG", "Algeria": "ALG", "Austria": "AUT", "Jordan": "JOR",
  "Portugal": "POR", "DR Congo": "COD", "Congo DR": "COD",
  "Uzbekistan": "UZB", "Colombia": "COL",
  "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
};

async function seedApiIds() {
  console.log('Fetching fixtures from API-Football...');

  const res  = await fetch(
    `https://v3.football.api-sports.io/fixtures?league=${LEAGUE_ID}&season=${SEASON}`,
    { headers: { 'x-apisports-key': API_KEY } }
  );
  const data = await res.json();

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
    const apiId   = fixture.id.toString();
    const homeId  = TEAM_NAME_TO_ID[teams.home.name]?.toUpperCase();
    const awayId  = TEAM_NAME_TO_ID[teams.away.name]?.toUpperCase();
    const apiDate = fixture.date?.slice(0, 10);

    if (!homeId || !awayId) {
      unmatched.push(`UNMAPPED TEAM: "${teams.home.name}" vs "${teams.away.name}"`);
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
    console.warn(`\nUnmatched (${unmatched.length}) — add to TEAM_NAME_TO_ID or fix DB dates:`);
    unmatched.forEach(u => console.warn('  •', u));
  } else {
    console.log('All group-stage fixtures linked successfully!');
  }
}

seedApiIds();
