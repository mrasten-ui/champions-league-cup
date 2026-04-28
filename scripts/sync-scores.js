import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const API_KEY = process.env.API_FOOTBALL_KEY;
const LEAGUE_ID = 1;   // FIFA World Cup in API-Football
const SEASON    = 2026;

// Only needed when API's 3-letter code differs from our internal ID.
// Keep in sync with seed-api-ids.js CODE_OVERRIDE.
const CODE_OVERRIDE = {
  // Example: "IRN": "IRI"
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
      return;
    }

    if (!data.response || data.response.length === 0) {
      console.log('No fixtures returned. Possible reasons:');
      console.log('  1. API_FOOTBALL_KEY secret is missing or wrong in GitHub');
      console.log('  2. League ID 1 / Season 2026 not yet published on this plan');
      console.log('  3. Free tier does not include future seasons');
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

      // Penalty shootout: goals are equal after AET so we must override stored
      // scores so the pen winner has a strictly higher number. The bracket and
      // scoring engine only compare home_score vs away_score — status is ignored.
      if (status === 'PEN') {
        if (teams.home.winner === true) {
          // Primary: use the winner boolean field
          payload.home_score = (goals.away ?? 0) + 1;
          payload.away_score = goals.away ?? 0;
          console.log(`  PEN override (${teams.home.name} vs ${teams.away.name}): home won → ${payload.home_score}-${payload.away_score}`);
        } else if (teams.away.winner === true) {
          payload.home_score = goals.home ?? 0;
          payload.away_score = (goals.home ?? 0) + 1;
          console.log(`  PEN override (${teams.home.name} vs ${teams.away.name}): away won → ${payload.home_score}-${payload.away_score}`);
        } else {
          // Fallback: compare score.penalty (winner may be null mid-shootout)
          const penHome = item.score?.penalty?.home;
          const penAway = item.score?.penalty?.away;
          if (penHome != null && penAway != null && penHome !== penAway) {
            const base = goals.away ?? 0;
            if (penHome > penAway) {
              payload.home_score = base + 1;
              payload.away_score = base;
            } else {
              payload.home_score = base;
              payload.away_score = base + 1;
            }
            console.log(`  PEN fallback (${teams.home.name} vs ${teams.away.name}): pens ${penHome}-${penAway} → stored ${payload.home_score}-${payload.away_score}`);
          } else {
            console.warn(`  PEN match in progress (${teams.home.name} vs ${teams.away.name}): winner not yet determined, storing raw goals`);
          }
        }
      }

      // Resolve team IDs using the code field (more reliable than name matching)
      const rawHome = teams.home.code?.toUpperCase();
      const rawAway = teams.away.code?.toUpperCase();
      const homeId  = CODE_OVERRIDE[rawHome] ?? rawHome;
      const awayId  = CODE_OVERRIDE[rawAway] ?? rawAway;
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
