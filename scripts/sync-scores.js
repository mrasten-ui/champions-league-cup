import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const API_KEY = process.env.API_FOOTBALL_KEY;
const LEAGUE_ID = 1;   // FIFA World Cup in API-Football
const SEASON    = 2026;

// ── Full 48-team name map: API-Football team name → our internal 3-letter ID ──
// Source: API-Football naming convention for World Cup 2026 teams
const TEAM_NAME_TO_ID = {
  // Group A
  "Mexico":            "MEX",
  "South Africa":      "RSA",
  "Korea Republic":    "KOR",
  "Korea DPR":         "KOR",  // fallback
  "South Korea":       "KOR",  // fallback
  "Czech Republic":    "CZE",
  "Czechia":           "CZE",

  // Group B
  "Canada":            "CAN",
  "Bosnia and Herzegovina": "BIH",
  "Bosnia":            "BIH",
  "Qatar":             "QAT",
  "Switzerland":       "SUI",

  // Group C
  "Brazil":            "BRA",
  "Morocco":           "MAR",
  "Haiti":             "HAI",
  "Scotland":          "SCO",

  // Group D
  "United States":     "USA",
  "USA":               "USA",
  "Paraguay":          "PAR",
  "Australia":         "AUS",
  "Turkey":            "TUR",
  "Türkiye":           "TUR",

  // Group E
  "Germany":           "GER",
  "Curacao":           "CUW",
  "Curaçao":           "CUW",
  "Ivory Coast":       "CIV",
  "Cote d'Ivoire":     "CIV",
  "Ecuador":           "ECU",

  // Group F
  "Netherlands":       "NED",
  "Japan":             "JPN",
  "Sweden":            "SWE",
  "Tunisia":           "TUN",

  // Group G
  "Belgium":           "BEL",
  "Egypt":             "EGY",
  "Iran":              "IRN",
  "IR Iran":           "IRN",
  "New Zealand":       "NZL",

  // Group H
  "Spain":             "ESP",
  "Cabo Verde":        "CPV",
  "Cape Verde":        "CPV",
  "Saudi Arabia":      "KSA",
  "Uruguay":           "URU",

  // Group I
  "France":            "FRA",
  "Senegal":           "SEN",
  "Iraq":              "IRQ",
  "Norway":            "NOR",

  // Group J
  "Argentina":         "ARG",
  "Algeria":           "ALG",
  "Austria":           "AUT",
  "Jordan":            "JOR",

  // Group K
  "Portugal":          "POR",
  "DR Congo":          "COD",
  "Congo DR":          "COD",
  "Uzbekistan":        "UZB",
  "Colombia":          "COL",

  // Group L
  "England":           "ENG",
  "Croatia":           "CRO",
  "Ghana":             "GHA",
  "Panama":            "PAN",
};

// Status values from API-Football that mean the match is locked (started/finished)
const LOCKED_STATUSES = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'FT', 'AET', 'PEN', 'LIVE', 'INT', 'ABD', 'AWD', 'WO'];

async function syncScores() {
  console.log(`[${new Date().toISOString()}] Starting score sync...`);

  try {
    // 1. Fetch all fixtures from API-Football
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${LEAGUE_ID}&season=${SEASON}`,
      { headers: { 'x-apisports-key': API_KEY } }
    );

    const data = await response.json();

    // Diagnostics — always print so we can debug from GitHub Actions logs
    console.log(`API HTTP status: ${response.status}`);
    console.log(`API errors:`, JSON.stringify(data.errors));
    console.log(`API results count: ${data.results ?? 'undefined'}`);
    console.log(`API key present: ${!!API_KEY}`);

    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('API returned errors:', JSON.stringify(data.errors));
      // Common: { requests: "You have exceeded..." } = rate limit
      //         { token: "Error/Missing" } = bad API key
      return;
    }

    if (!data.response || data.response.length === 0) {
      console.log('No fixtures returned. Possible reasons:');
      console.log('  1. API_FOOTBALL_KEY secret is missing or wrong in GitHub');
      console.log('  2. League ID 1 / Season 2026 not yet published on this plan');
      console.log('  3. Free tier does not include future seasons');
      console.log('Try visiting: https://v3.football.api-sports.io/leagues?id=1 with your key to confirm access.');
      return;
    }

    console.log(`Fetched ${data.response.length} fixtures from API.`);

    let updated = 0;
    let skipped = 0;

    for (const item of data.response) {
      const { fixture, goals, teams } = item;
      const apiId    = fixture.id.toString();
      const status   = fixture.status.short;
      const isLocked = LOCKED_STATUSES.includes(status);

      const payload = {
        status,
        home_score: goals.home ?? null,
        away_score: goals.away ?? null,
        is_locked:  isLocked,
        updated_at: new Date().toISOString(),
      };

      // Resolve team IDs (important for knockout TBD slots)
      const homeId = TEAM_NAME_TO_ID[teams.home.name];
      const awayId = TEAM_NAME_TO_ID[teams.away.name];
      if (homeId) payload.home_team_id = homeId;
      if (awayId) payload.away_team_id = awayId;

      // Match by api_id — populated by seed-api-ids.js
      const { error } = await supabase
        .from('matches')
        .update(payload)
        .eq('api_id', apiId);

      if (error) {
        console.error(`  ✗ api_id=${apiId} (${teams.home.name} vs ${teams.away.name}): ${error.message}`);
        skipped++;
      } else {
        updated++;
      }
    }

    console.log(`Done. Updated: ${updated}, Skipped/Errors: ${skipped}`);

  } catch (err) {
    console.error('Critical error:', err);
    process.exit(1);
  }
}

syncScores();
