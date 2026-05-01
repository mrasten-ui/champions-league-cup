import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const API_KEY = process.env.API_FOOTBALL_KEY;
const LEAGUE_ID = 1;   // FIFA World Cup in API-Football
const SEASON    = 2026;

// API-Football team name → our internal 3-letter ID
// The /fixtures endpoint does not include a `code` field — only team names are available.
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

    console.log(`API HTTP status: ${response.status}`);
    console.log(`API errors:`, JSON.stringify(data.errors));
    console.log(`API results count: ${data.results ?? 'undefined'}`);

    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('API returned errors:', JSON.stringify(data.errors));
      return;
    }

    if (!data.response || data.response.length === 0) {
      console.log('No fixtures returned — check API key and plan tier.');
      return;
    }

    console.log(`Fetched ${data.response.length} fixtures from API.`);

    // 2. Pre-fetch all DB matches so we can auto-link knockout fixtures as teams become known
    const { data: dbMatches, error: dbError } = await supabase
      .from('matches')
      .select('id, api_id, home_team_id, away_team_id, date');

    if (dbError) {
      console.error('Failed to fetch DB matches:', dbError.message);
      return;
    }

    // Fast lookup for already-linked fixtures
    const linkedByApiId = new Map(
      dbMatches.filter(m => m.api_id).map(m => [m.api_id, m])
    );
    // Candidates for auto-linking (knockout slots not yet linked)
    const unlinked = dbMatches.filter(m => !m.api_id);

    console.log(`DB: ${linkedByApiId.size} linked, ${unlinked.length} unlinked.`);

    let updated = 0;
    let autoLinked = 0;
    let skipped = 0;

    for (const item of data.response) {
      const { fixture, goals, teams } = item;
      const apiId   = fixture.id.toString();
      const apiDate = fixture.date?.slice(0, 10);
      const status  = fixture.status.short;
      const isLocked = LOCKED_STATUSES.includes(status);

      // Resolve team IDs (used in payload + auto-link matching)
      const homeId = TEAM_NAME_TO_ID[teams.home.name];
      const awayId = TEAM_NAME_TO_ID[teams.away.name];

      const payload = {
        status,
        home_score: goals.home ?? null,
        away_score: goals.away ?? null,
        is_locked:  isLocked,
        updated_at: new Date().toISOString(),
      };

      // Populate team IDs whenever we can resolve them (fills TBD knockout slots)
      if (homeId) payload.home_team_id = homeId;
      if (awayId) payload.away_team_id = awayId;

      // Penalty shootout: goals are equal after AET — override so pen winner
      // has a strictly higher score. Scoring engine ignores status, only compares scores.
      if (status === 'PEN') {
        if (teams.home.winner === true) {
          payload.home_score = (goals.away ?? 0) + 1;
          payload.away_score = goals.away ?? 0;
          console.log(`  PEN (${teams.home.name} vs ${teams.away.name}): home won → ${payload.home_score}-${payload.away_score}`);
        } else if (teams.away.winner === true) {
          payload.home_score = goals.home ?? 0;
          payload.away_score = (goals.home ?? 0) + 1;
          console.log(`  PEN (${teams.home.name} vs ${teams.away.name}): away won → ${payload.home_score}-${payload.away_score}`);
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
            console.log(`  PEN fallback (${teams.home.name} vs ${teams.away.name}): ${penHome}-${penAway} pens → stored ${payload.home_score}-${payload.away_score}`);
          } else {
            console.warn(`  PEN in progress (${teams.home.name} vs ${teams.away.name}): winner not yet determined`);
          }
        }
      }

      // 3. Two-path update: fast path if already linked, auto-link path if not
      if (linkedByApiId.has(apiId)) {
        // Fast path: api_id already in DB — just update scores
        const { error } = await supabase
          .from('matches')
          .update(payload)
          .eq('api_id', apiId);

        if (error) {
          console.error(`  ✗ ${teams.home.name} vs ${teams.away.name}: ${error.message}`);
          skipped++;
        } else {
          updated++;
        }
      } else if (homeId && awayId) {
        // Auto-link path: teams are now known — find the unlinked DB row and link it
        const match = unlinked.find(m =>
          m.home_team_id?.toUpperCase() === homeId &&
          m.away_team_id?.toUpperCase() === awayId &&
          m.date?.slice(0, 10) === apiDate
        );

        if (match) {
          const { error } = await supabase
            .from('matches')
            .update({ ...payload, api_id: apiId })
            .eq('id', match.id);

          if (error) {
            console.error(`  ✗ Auto-link failed ${homeId} vs ${awayId}: ${error.message}`);
            skipped++;
          } else {
            console.log(`  Auto-linked: ${homeId} vs ${awayId} (${apiDate}) → api_id=${apiId}`);
            linkedByApiId.set(apiId, match); // prevent re-processing within this run
            autoLinked++;
            updated++;
          }
        }
        // else: DB doesn't have this fixture — skip silently
      }
      // else: teams still TBD — skip, will auto-link on next run once API has team names
    }

    console.log(`Done. Updated: ${updated} (${autoLinked} newly auto-linked), Skipped/Errors: ${skipped}`);

  } catch (err) {
    console.error('Critical error:', err);
    process.exit(1);
  }
}

syncScores();
