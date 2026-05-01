import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

/**
 * seed-api-ids.js — ONE-TIME SETUP (run before kickoff)
 *
 * Fetches all WC2026 fixtures from API-Football and writes the external
 * api_id into matching rows in your Supabase 'matches' table.
 * Matching is done by: home_team_id + away_team_id + date (date portion only).
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

// API-Football team name → our internal 3-letter ID
// The /fixtures endpoint does not include a `code` field — only team names are available.
// Add fallback spellings if the seed run reports any "UNMAPPED TEAM" entries.
const TEAM_NAME_TO_ID = {
  // Group A
  "Mexico":                    "MEX",
  "South Africa":              "RSA",
  "Korea Republic":            "KOR",
  "South Korea":               "KOR",
  "Czech Republic":            "CZE",
  "Czechia":                   "CZE",

  // Group B
  "Canada":                    "CAN",
  "Bosnia and Herzegovina":    "BIH",
  "Bosnia":                    "BIH",
  "Qatar":                     "QAT",
  "Switzerland":               "SUI",

  // Group C
  "Brazil":                    "BRA",
  "Morocco":                   "MAR",
  "Haiti":                     "HAI",
  "Scotland":                  "SCO",

  // Group D
  "United States":             "USA",
  "USA":                       "USA",
  "Paraguay":                  "PAR",
  "Australia":                 "AUS",
  "Turkey":                    "TUR",
  "Türkiye":                   "TUR",

  // Group E
  "Germany":                   "GER",
  "Curacao":                   "CUW",
  "Curaçao":                   "CUW",
  "Ivory Coast":               "CIV",
  "Cote d'Ivoire":             "CIV",
  "Ecuador":                   "ECU",

  // Group F
  "Netherlands":               "NED",
  "Japan":                     "JPN",
  "Sweden":                    "SWE",
  "Tunisia":                   "TUN",

  // Group G
  "Belgium":                   "BEL",
  "Egypt":                     "EGY",
  "Iran":                      "IRN",
  "IR Iran":                   "IRN",
  "New Zealand":               "NZL",

  // Group H
  "Spain":                     "ESP",
  "Cabo Verde":                "CPV",
  "Cape Verde":                "CPV",
  "Saudi Arabia":              "KSA",
  "Uruguay":                   "URU",

  // Group I
  "France":                    "FRA",
  "Senegal":                   "SEN",
  "Iraq":                      "IRQ",
  "Norway":                    "NOR",

  // Group J
  "Argentina":                 "ARG",
  "Algeria":                   "ALG",
  "Austria":                   "AUT",
  "Jordan":                    "JOR",

  // Group K
  "Portugal":                  "POR",
  "DR Congo":                  "COD",
  "Congo DR":                  "COD",
  "Uzbekistan":                "UZB",
  "Colombia":                  "COL",

  // Group L
  "England":                   "ENG",
  "Croatia":                   "CRO",
  "Ghana":                     "GHA",
  "Panama":                    "PAN",
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
    const apiId   = fixture.id.toString();
    const apiDate = fixture.date?.slice(0, 10);

    const homeId = TEAM_NAME_TO_ID[teams.home.name];
    const awayId = TEAM_NAME_TO_ID[teams.away.name];

    if (!homeId || !awayId) {
      unmatched.push(`UNMAPPED TEAM: "${teams.home.name}" vs "${teams.away.name}" — add to TEAM_NAME_TO_ID`);
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
    console.warn(`\nUnmatched (${unmatched.length}) — fix TEAM_NAME_TO_ID or check DB dates:`);
    unmatched.forEach(u => console.warn('  •', u));
  } else {
    console.log('All fixtures linked successfully!');
  }
}

seedApiIds();
